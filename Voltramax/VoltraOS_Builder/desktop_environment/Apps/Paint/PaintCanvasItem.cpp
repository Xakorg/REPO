#include "PaintCanvasItem.h"

#include "PaintEngine.h"
#include "SelectionEngine.h"
#include "ShapeEngine.h"

#include <QBrush>
#include <QEvent>
#include <QFont>
#include <QHoverEvent>
#include <QImage>
#include <QKeyEvent>
#include <QLineF>
#include <QMouseEvent>
#include <QPainter>
#include <QPainterPath>
#include <QPen>
#include <QPixmap>
#include <QPointingDevice>
#include <QPolygonF>
#include <QQuickWindow>
#include <QTabletEvent>
#include <QWheelEvent>

#include <algorithm>
#include <cmath>

namespace paint {

namespace {

// The transparency checkerboard is generated once and reused. Two greys at
// exactly 50% alpha contrast read as "empty" on every screen we tested without
// competing with the artwork for attention.
const QPixmap &checkerboard()
{
    static QPixmap pm;
    if (pm.isNull()) {
        const int cell = 8;
        pm = QPixmap(cell * 2, cell * 2);
        pm.fill(QColor(58, 60, 66));
        QPainter p(&pm);
        p.fillRect(0, 0, cell, cell, QColor(48, 50, 56));
        p.fillRect(cell, cell, cell, cell, QColor(48, 50, 56));
    }
    return pm;
}

QPolygonF mapRect(const QTransform &t, const QRectF &r)
{
    return t.map(QPolygonF(r));
}

// A dash pattern for the marching ants, in device pixels. Keeping it
// independent of the zoom means the ants stay legible when the canvas is at
// 1600%.
QPen antPen(const QColor &c, double width)
{
    QPen pen(c, width);
    pen.setStyle(Qt::CustomDashLine);
    pen.setDashPattern(QVector<qreal>{ 4.0, 4.0 });
    pen.setCapStyle(Qt::FlatCap);
    return pen;
}

// Distance from a point to the guide line, measured in item pixels so the grab
// tolerance stays constant on screen regardless of the zoom.
double guideDistance(const QTransform &t, double docCoord, bool vertical,
                     const QPointF &itemPos, double extent)
{
    QPointF a;
    QPointF b;
    if (vertical) {
        a = t.map(QPointF(docCoord, -extent));
        b = t.map(QPointF(docCoord, extent));
    } else {
        a = t.map(QPointF(-extent, docCoord));
        b = t.map(QPointF(extent, docCoord));
    }
    return distanceToSegment(itemPos, a, b);
}

} // namespace

// ===========================================================================
// Construction
// ===========================================================================

PaintCanvasItem::PaintCanvasItem(QQuickItem *parent)
    : QQuickPaintedItem(parent)
{
    // Every button is interesting: left draws, middle pans, right opens the
    // tool's context action, and back/forward are useful for a stylus with
    // extra buttons once the platform maps them.
    setAcceptedMouseButtons(Qt::AllButtons);
    setAcceptHoverEvents(true);
    setFlag(QQuickItem::ItemIsFocusScope, true);
    setFlag(QQuickItem::ItemAcceptsInputMethod, true);
    setFocus(true);

    // The item is redrawn as a whole textured quad; letting Qt keep a
    // persistent FBO sized to the window keeps the per-sample cost flat while
    // the pen is down.
    setPerformanceHint(QQuickPaintedItem::FastFBOResizing, true);
    setOpaquePainting(false);
}

PaintCanvasItem::~PaintCanvasItem()
{
    // The engine clears its pointer to us; if it is still set here then we are
    // being torn down first and must not leave a dangling reference behind.
    if (m_engine)
        m_engine = nullptr;
}

// ===========================================================================
// Engine wiring
// ===========================================================================

QObject *PaintCanvasItem::engineObject() const
{
    return m_engine;
}

void PaintCanvasItem::setEngineObject(QObject *o)
{
    setEngine(qobject_cast<PaintEngine *>(o));
}

void PaintCanvasItem::setEngine(PaintEngine *e)
{
    if (m_engine == e)
        return;
    m_engine = e;
    emit engineChanged();
    update();
}

QSize PaintCanvasItem::documentPixelSize() const
{
    return m_engine ? m_engine->documentSize() : QSize();
}

void PaintCanvasItem::requestRepaint()
{
    update();
}

// ===========================================================================
// Overlay toggles
// ===========================================================================

void PaintCanvasItem::setShowGrid(bool v)
{
    if (m_showGrid == v)
        return;
    m_showGrid = v;
    emit overlaysChanged();
    update();
}

void PaintCanvasItem::setShowGuides(bool v)
{
    if (m_showGuides == v)
        return;
    m_showGuides = v;
    emit overlaysChanged();
    update();
}

void PaintCanvasItem::setShowSymmetry(bool v)
{
    if (m_showSymmetry == v)
        return;
    m_showSymmetry = v;
    emit overlaysChanged();
    update();
}

void PaintCanvasItem::setShowCursorRing(bool v)
{
    if (m_showCursorRing == v)
        return;
    m_showCursorRing = v;
    emit overlaysChanged();
    update();
}

void PaintCanvasItem::setShowTransparency(bool v)
{
    if (m_showTransparency == v)
        return;
    m_showTransparency = v;
    emit overlaysChanged();
    update();
}

void PaintCanvasItem::setSmoothing(bool v)
{
    if (m_smoothing == v)
        return;
    m_smoothing = v;
    emit renderHintsChanged();
    update();
}

// ===========================================================================
// Coordinate helpers
// ===========================================================================

QPointF PaintCanvasItem::itemToDoc(const QPointF &itemPos, bool *inside) const
{
    if (!m_engine) {
        if (inside)
            *inside = false;
        return itemPos;
    }
    const QPointF d = m_engine->itemToDocument(itemPos);
    if (inside) {
        const QRectF r = m_engine->documentRect();
        *inside = r.contains(d);
    }
    return d;
}

CanvasPointer PaintCanvasItem::resolvePointer(const QPointF &itemPos, int kind,
                                              double pressure, double tiltX,
                                              double tiltY, double rotation,
                                              bool eraser,
                                              Qt::KeyboardModifiers mods) const
{
    CanvasPointer out;
    out.itemPos = itemPos;
    out.modifiers = mods;
    bool inside = false;
    out.docPos = itemToDoc(itemPos, &inside);
    out.insideCanvas = inside;

    if (!m_engine) {
        out.pressure = pressure;
        out.tiltAltitude = 90.0;
        return out;
    }

    // The engine owns the pressure curve; the canvas only reports the raw
    // device values so a single curve is applied no matter which event source
    // produced the sample.
    out.pressure = pressure;
    const double lean = std::hypot(tiltX, tiltY);
    out.tiltAltitude = clampd(90.0 - lean * 90.0, 0.0, 90.0);
    out.tiltAzimuth = std::fmod(std::atan2(tiltY, tiltX) * 180.0 / M_PI + 360.0, 360.0);
    out.twist = rotation;
    out.pointerKind = kind;
    out.eraser = eraser;
    out.barrel = (kind == PointerPen || kind == PointerEraser) && eraser;
    return out;
}

int PaintCanvasItem::hitTest(const QPointF &itemPos) const
{
    if (!m_engine)
        return ZoneNone;

    // Guides first: they sit closest to the cursor and are dragged often. The
    // grab tolerance is expressed in item pixels (6 px) so it feels the same
    // whether the canvas is at 25% or 400%.
    if (m_engine->guidesVisible()) {
        const QTransform t = m_engine->viewTransform();
        for (const QVariant &v : m_engine->guidesV()) {
            if (guideDistance(t, v.toDouble(), true, itemPos, 4000.0) <= 6.0)
                return ZoneGuideVertical;
        }
        for (const QVariant &v : m_engine->guidesH()) {
            if (guideDistance(t, v.toDouble(), false, itemPos, 4000.0) <= 6.0)
                return ZoneGuideHorizontal;
        }
    }

    bool inside = false;
    const QPointF doc = itemToDoc(itemPos, &inside);
    if (!inside)
        return ZoneOutside;

    if (m_engine->selectionActive()) {
        const QRectF box = m_engine->selectionBounds();
        const double grab = 8.0 / qMax(0.05, m_engine->zoom());
        if (box.adjusted(-grab, -grab, grab, grab).contains(doc))
            return ZoneSelectionHandle;
    }
    return ZoneCanvas;
}

void PaintCanvasItem::updateCursorZone(const QPointF &itemPos)
{
    const int zone = hitTest(itemPos);
    if (zone == m_cursorZone)
        return;
    m_cursorZone = zone;
    emit cursorZoneChanged();
}

// ===========================================================================
// Painting
// ===========================================================================

void PaintCanvasItem::paint(QPainter *painter)
{
    painter->setRenderHint(QPainter::Antialiasing, true);
    painter->setRenderHint(QPainter::TextAntialiasing, true);

    const QRectF deviceRect(0.0, 0.0, width(), height());

    if (m_showTransparency)
        paintTransparency(painter, deviceRect);
    else
        painter->fillRect(deviceRect, QColor(30, 32, 38));

    if (!m_engine) {
        painter->setPen(QColor(150, 150, 150));
        painter->drawText(deviceRect, Qt::AlignCenter,
                          QStringLiteral("no document"));
        return;
    }

    paintDocument(painter);
    paintBoundary(painter);
    if (m_showGrid)
        paintGrid(painter);
    if (m_showGuides)
        paintGuides(painter);
    if (m_showSymmetry)
        paintSymmetry(painter);
    if (m_engine->previewVisible())
        paintShapePreview(painter);
    paintSelection(painter);
    paintSnapHint(painter);
    if (m_showCursorRing && m_cursorVisible && m_engine->hasDocument())
        paintCursorRing(painter);
}

void PaintCanvasItem::paintTransparency(QPainter *p, const QRectF &deviceRect) const
{
    // Outside the page there is nothing but workspace. Inside the page the
    // checkerboard shows what the artwork's own alpha is, which is the only
    // honest way to draw a transparent document.
    QRectF page = deviceRect;
    if (m_engine && m_engine->hasDocument()) {
        const QTransform t = m_engine->viewTransform();
        page = mapRect(t, m_engine->documentRect()).boundingRect();
        page = page.intersected(deviceRect);
    }
    if (page.isEmpty()) {
        p->fillRect(deviceRect, QColor(30, 32, 38));
        return;
    }
    p->fillRect(deviceRect, QColor(30, 32, 38));
    p->fillRect(page, QBrush(checkerboard()));
}

void PaintCanvasItem::paintDocument(QPainter *p) const
{
    const QImage &img = m_engine->composite();
    if (img.isNull())
        return;

    const QTransform t = m_engine->viewTransform();
    p->save();
    p->setTransform(t, true);

    // Below roughly 3x, smoothing hides the raster grid and looks better; above
    // it, a nearest filter is what a person drawing at high zoom expects to
    // see, because it shows them exactly which pixels they are painting.
    const bool smooth = m_smoothing && m_engine->zoom() < 3.0;
    p->setRenderHint(QPainter::SmoothPixmapTransform, smooth);
    p->drawImage(QPointF(0, 0), img);
    p->restore();
}

void PaintCanvasItem::paintBoundary(QPainter *p) const
{
    if (!m_engine->hasDocument())
        return;
    const QTransform t = m_engine->viewTransform();
    const QPolygonF poly = mapRect(t, m_engine->documentRect());

    p->save();
    p->setBrush(Qt::NoBrush);
    p->setPen(QPen(QColor(0, 0, 0, 60), 3.0));
    p->drawPolygon(poly);
    p->setPen(QPen(QColor(230, 235, 245, 200), 1.0));
    p->drawPolygon(poly);
    p->restore();
}

void PaintCanvasItem::paintGrid(QPainter *p) const
{
    const double g = m_engine->gridSize();
    if (g <= 0.5)
        return;
    const QSize s = m_engine->documentSize();
    const QTransform t = m_engine->viewTransform();

    p->save();
    p->setRenderHint(QPainter::Antialiasing, false);
    p->setPen(QPen(QColor(120, 150, 200, 70), 1.0));

    for (double x = 0.0; x <= s.width() + 0.001; x += g)
        p->drawLine(t.map(QPointF(x, 0.0)), t.map(QPointF(x, s.height())));
    for (double y = 0.0; y <= s.height() + 0.001; y += g)
        p->drawLine(t.map(QPointF(0.0, y)), t.map(QPointF(s.width(), y)));

    // A stronger line on the centre so the user can find the middle of a large
    // canvas without counting squares.
    p->setPen(QPen(QColor(120, 150, 200, 110), 1.0));
    p->drawLine(t.map(QPointF(s.width() * 0.5, 0.0)),
                t.map(QPointF(s.width() * 0.5, s.height())));
    p->drawLine(t.map(QPointF(0.0, s.height() * 0.5)),
                t.map(QPointF(s.width(), s.height() * 0.5)));
    p->restore();
}

void PaintCanvasItem::paintGuides(QPainter *p) const
{
    const QTransform t = m_engine->viewTransform();
    const QSize s = m_engine->documentSize();
    const double over = 6000.0;

    p->save();
    p->setPen(QPen(QColor(0, 180, 230, 190), 1.0));
    for (const QVariant &v : m_engine->guidesV()) {
        const double x = v.toDouble();
        p->drawLine(t.map(QPointF(x, -over)), t.map(QPointF(x, s.height() + over)));
    }
    for (const QVariant &v : m_engine->guidesH()) {
        const double y = v.toDouble();
        p->drawLine(t.map(QPointF(-over, y)), t.map(QPointF(s.width() + over, y)));
    }
    p->restore();
}

void PaintCanvasItem::paintSymmetry(QPainter *p) const
{
    const int mode = m_engine->symmetryMode();
    if (mode == SymmetryNone)
        return;

    const QSize s = m_engine->documentSize();
    const QTransform t = m_engine->viewTransform();
    const QPointF axis(m_engine->symmetryAxisX(), m_engine->symmetryAxisY());

    p->save();
    p->setPen(QPen(QColor(255, 90, 160, 150), 1.0, Qt::DashLine));

    if (mode == SymmetryMirrorVertical || mode == SymmetryMirrorQuad)
        p->drawLine(t.map(QPointF(axis.x(), -2000.0)),
                    t.map(QPointF(axis.x(), s.height() + 2000.0)));
    if (mode == SymmetryMirrorHorizontal || mode == SymmetryMirrorQuad)
        p->drawLine(t.map(QPointF(-2000.0, axis.y())),
                    t.map(QPointF(s.width() + 2000.0, axis.y())));

    if (mode == SymmetryRadial) {
        const int branches = qMax(2, m_engine->symmetryBranches());
        const double radius = std::hypot(s.width(), s.height());
        for (int i = 0; i < branches; ++i) {
            const double a = 2.0 * M_PI * i / branches;
            p->drawLine(t.map(axis),
                        t.map(axis + QPointF(std::cos(a) * radius,
                                             std::sin(a) * radius)));
        }
    }

    // Mark the axis origin so it can be dragged without hunting for it.
    const QPointF c = t.map(axis);
    p->setPen(QPen(QColor(255, 90, 160, 230), 1.5));
    p->drawEllipse(c, 4.0, 4.0);
    p->drawLine(c + QPointF(-8, 0), c + QPointF(8, 0));
    p->drawLine(c + QPointF(0, -8), c + QPointF(0, 8));
    p->restore();
}

void PaintCanvasItem::paintSelection(QPainter *p) const
{
    SelectionEngine &sel = m_engine->selection();
    if (!sel.active())
        return;
    QPainterPath path = sel.clipPath();
    if (path.isEmpty())
        return;

    const QTransform t = m_engine->viewTransform();
    const QPainterPath mapped = t.map(path);

    p->save();
    p->setBrush(Qt::NoBrush);
    // Light under, dark over: the ants stay visible on white paper and on a
    // black photograph alike.
    QPen under = antPen(QColor(0, 0, 0, 220), 2.4);
    under.setDashOffset(sel.antsOffset());
    p->setPen(under);
    p->drawPath(mapped);

    QPen over = antPen(QColor(255, 255, 255, 240), 1.2);
    over.setDashOffset(sel.antsOffset());
    p->setPen(over);
    p->drawPath(mapped);

    // Corner handles for the transform box.
    const QRectF box = sel.box();
    if (!box.isEmpty()) {
        const QPolygonF poly = mapRect(t, box);
        p->setPen(QPen(QColor(90, 190, 255, 200), 1.0));
        p->drawPolygon(poly);
        p->setBrush(QColor(90, 190, 255, 220));
        for (const QPointF &pt : poly)
            p->drawRect(QRectF(pt.x() - 3, pt.y() - 3, 6, 6));
    }
    p->restore();
}

void PaintCanvasItem::paintShapePreview(QPainter *p) const
{
    const Shape &shape = m_engine->previewShape();
    const QPainterPath path = ShapeEngine::pathFor(shape);
    if (path.isEmpty())
        return;

    const QTransform t = m_engine->viewTransform();
    p->save();
    p->setTransform(t, true);
    p->setBrush(shape.filled ? QBrush(withOpacity(shape.style.colour, 0.65))
                             : QBrush(Qt::NoBrush));
    p->setPen(QPen(shape.style.colour, qMax(1.0, shape.strokeWidth),
                   Qt::SolidLine, Qt::RoundCap, Qt::RoundJoin));
    p->drawPath(path);
    p->restore();
}

void PaintCanvasItem::paintSnapHint(QPainter *p) const
{
    const QString hint = m_engine->snapHint();
    if (hint.isEmpty())
        return;
    const QPointF c = m_engine->documentToItem(m_engine->snapHintPos());

    p->save();
    p->setPen(QPen(QColor(255, 190, 60, 230), 1.2));
    p->drawLine(c + QPointF(-10, 0), c + QPointF(10, 0));
    p->drawLine(c + QPointF(0, -10), c + QPointF(0, 10));
    p->setPen(QPen(QColor(255, 190, 60, 200), 1.0));
    p->drawEllipse(c, 6.0, 6.0);

    if (hint != QLatin1String("none")) {
        QFont f = p->font();
        f.setPointSizeF(9.0);
        p->setFont(f);
        p->setPen(QColor(255, 210, 120, 230));
        p->drawText(c + QPointF(12, -6), hint);
    }
    p->restore();
}

void PaintCanvasItem::paintCursorRing(QPainter *p) const
{
    if (!m_engine->toolUsesBrush() && !m_engine->toolUsesShapeOptions())
        return;
    const double radius = qMax(2.0, m_engine->brushSize() * 0.5 * m_engine->zoom());

    p->save();
    p->setBrush(Qt::NoBrush);
    p->setPen(QPen(QColor(0, 0, 0, 160), 2.0));
    p->drawEllipse(m_cursorItem, radius, radius);
    p->setPen(QPen(QColor(255, 255, 255, 220), 1.0));
    p->drawEllipse(m_cursorItem, radius, radius);
    p->drawPoint(m_cursorItem);
    p->restore();
}

// ===========================================================================
// Event plumbing
// ===========================================================================

void PaintCanvasItem::geometryChange(const QRectF &newGeometry, const QRectF &oldGeometry)
{
    QQuickPaintedItem::geometryChange(newGeometry, oldGeometry);
    if (newGeometry.size() != oldGeometry.size())
        update();
}

bool PaintCanvasItem::event(QEvent *e)
{
    switch (e->type()) {
    case QEvent::TabletPress:
    case QEvent::TabletMove:
    case QEvent::TabletRelease:
    case QEvent::TabletEnterProximity:
    case QEvent::TabletLeaveProximity:
        if (dispatchTablet(static_cast<QTabletEvent *>(e)))
            return true;
        break;
    default:
        break;
    }
    return QQuickPaintedItem::event(e);
}

bool PaintCanvasItem::dispatchTablet(QTabletEvent *event)
{
    if (!m_engine)
        return false;

    if (event->type() == QEvent::TabletEnterProximity ||
        event->type() == QEvent::TabletLeaveProximity) {
        // Proximity is meaningful even without contact: it is what suppresses
        // palm input before the pen lands, so it is forwarded as a hover.
        return true;
    }

    int phase = 1;
    switch (event->type()) {
    case QEvent::TabletPress: phase = 0; break;
    case QEvent::TabletMove: phase = 1; break;
    case QEvent::TabletRelease: phase = 2; break;
    default: return false;
    }

    RawSample s;
    s.pos = event->position();
    s.pressure = event->pressure();
    s.tiltX = event->xTilt() / 60.0;
    s.tiltY = event->yTilt() / 60.0;
    s.rotation = event->rotation();
    s.buttons = int(event->buttons());
    s.t = monoMs();

    const QPointingDevice::PointerType pt = event->pointerType();
    if (pt == QPointingDevice::PointerType::Eraser) {
        s.pointerType = PointerEraser;
        s.eraser = true;
    } else if (pt == QPointingDevice::PointerType::Pen) {
        s.pointerType = PointerPen;
        s.eraser = false;
    } else {
        s.pointerType = PointerUnknown;
    }

    m_cursorItem = s.pos;
    m_cursorVisible = true;
    setFocus(true);

    m_engine->handlePointer(phase, s);
    update();
    return true;
}

bool PaintCanvasItem::dispatchMouse(QMouseEvent *event, int phase)
{
    if (!m_engine)
        return false;

    RawSample s;
    s.pos = event->position();
    s.buttons = int(event->buttons());
    s.t = monoMs();
    s.pointerType = PointerMouse;
    s.synthetic = true;
    // A mouse reports no pressure. Saying 1.0 would be a lie the brush engine
    // could not undo, so we report 0.0 and let the engine substitute the
    // user's configured mouse pressure.
    s.pressure = 0.0;

    m_cursorItem = s.pos;
    m_cursorVisible = true;
    setFocus(true);

    m_engine->handlePointer(phase, s);
    update();
    return true;
}

void PaintCanvasItem::mousePressEvent(QMouseEvent *event)
{
    m_lastClickMs = monoMs();
    m_lastClickPos = event->position();
    updateCursorZone(event->position());
    dispatchMouse(event, 0);
    event->accept();
}

void PaintCanvasItem::mouseMoveEvent(QMouseEvent *event)
{
    if (event->buttons() != Qt::NoButton) {
        dispatchMouse(event, 1);
    } else {
        dispatchHover(event->position(), event->modifiers());
    }
    updateCursorZone(event->position());
    event->accept();
}

void PaintCanvasItem::mouseReleaseEvent(QMouseEvent *event)
{
    dispatchMouse(event, 2);
    updateCursorZone(event->position());
    event->accept();
}

void PaintCanvasItem::mouseDoubleClickEvent(QMouseEvent *event)
{
    // A second press in the same place within the platform's double-click
    // interval re-enters text editing; the engine decides what that means.
    dispatchMouse(event, 0);
    event->accept();
}

void PaintCanvasItem::hoverMoveEvent(QHoverEvent *event)
{
    dispatchHover(event->position(), event->modifiers());
}

void PaintCanvasItem::hoverLeaveEvent(QHoverEvent *event)
{
    Q_UNUSED(event);
    m_cursorVisible = false;
    m_cursorInside = false;
    update();
}

void PaintCanvasItem::dispatchHover(const QPointF &itemPos,
                                    Qt::KeyboardModifiers mods)
{
    m_cursorItem = itemPos;
    m_cursorVisible = true;
    bool inside = false;
    itemToDoc(itemPos, &inside);
    m_cursorInside = inside;

    if (!m_engine) {
        update();
        return;
    }

    RawSample s;
    s.pos = itemPos;
    s.pointerType = PointerMouse;
    s.t = monoMs();
    s.synthetic = true;
    s.buttons = 0;
    Q_UNUSED(mods);
    m_engine->handleHover(s);
    update();
}

void PaintCanvasItem::wheelEvent(QWheelEvent *event)
{
    if (!m_engine) {
        event->ignore();
        return;
    }
    const double dy = double(event->angleDelta().y());
    const bool handled = m_engine->handleWheel(
        dy, event->position(), (event->modifiers() & Qt::ControlModifier) != 0);
    if (handled) {
        update();
        event->accept();
    } else {
        event->ignore();
    }
}

void PaintCanvasItem::noteKeyState(int key, bool pressed)
{
    switch (key) {
    case Qt::Key_Space: m_spaceDown = pressed; break;
    case Qt::Key_Alt: m_altDown = pressed; break;
    case Qt::Key_Shift: m_shiftDown = pressed; break;
    case Qt::Key_Control: m_ctrlDown = pressed; break;
    default: break;
    }
}

void PaintCanvasItem::keyPressEvent(QKeyEvent *event)
{
    noteKeyState(event->key(), true);
    if (m_engine && m_engine->handleKey(event->key(), event->text(),
                                        int(event->modifiers()), true)) {
        event->accept();
        update();
        return;
    }
    QQuickPaintedItem::keyPressEvent(event);
}

void PaintCanvasItem::keyReleaseEvent(QKeyEvent *event)
{
    noteKeyState(event->key(), false);
    if (m_engine && m_engine->handleKey(event->key(), event->text(),
                                        int(event->modifiers()), false)) {
        event->accept();
        update();
        return;
    }
    QQuickPaintedItem::keyReleaseEvent(event);
}

} // namespace paint
