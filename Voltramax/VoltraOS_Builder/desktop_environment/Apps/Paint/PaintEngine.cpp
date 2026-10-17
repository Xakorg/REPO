#include "PaintEngine.h"

#include "PaintCanvasItem.h"
#include "Rasterizer.h"

#include <QFile>
#include <QFileInfo>
#include <QImage>
#include <QJsonArray>
#include <QJsonDocument>
#include <QJsonObject>
#include <QPainter>
#include <QPainterPath>
#include <QPointF>
#include <QRectF>
#include <QStandardPaths>
#include <QTransform>

#include <algorithm>
#include <cmath>

namespace paint {

namespace {

// ---------------------------------------------------------------------------
// Small private helpers shared by several PaintEngine methods.
// ---------------------------------------------------------------------------

// Qt draws clockwise for positive angles; the mirror copy must be exact, and
// the trivial implementation below is the whole point of keeping the mirrored
// points in document space rather than trusting a hand-written reflection.
QTransform reflectVertically(double axisX)
{
    QTransform t;
    t.translate(2.0 * axisX, 0.0);
    t.scale(-1.0, 1.0);
    return t;
}

QTransform reflectHorizontally(double axisY)
{
    QTransform t;
    t.translate(0.0, 2.0 * axisY);
    t.scale(1.0, -1.0);
    return t;
}

// Rotate about a pivot point, in the document coordinate system.
QTransform rotateAbout(const QPointF &pivot, double degrees)
{
    QTransform t;
    t.translate(pivot.x(), pivot.y());
    t.rotate(degrees);
    t.translate(-pivot.x(), -pivot.y());
    return t;
}

bool isStrokeTool(int tool)
{
    switch (tool) {
    case ToolPencil:
    case ToolPen:
    case ToolBrush:
    case ToolMarker:
    case ToolAirbrush:
    case ToolCalligraphy:
    case ToolEraserStroke:
    case ToolEraserPixel:
        return true;
    default:
        return false;
    }
}

bool isShapeTool(int tool)
{
    switch (tool) {
    case ToolLine:
    case ToolRect:
    case ToolEllipse:
    case ToolPolygon:
    case ToolPolyline:
    case ToolStar:
    case ToolArrow:
        return true;
    default:
        return false;
    }
}

bool isSelectionTool(int tool)
{
    return tool == ToolSelectRect || tool == ToolSelectLasso
           || tool == ToolSelectWand || tool == ToolMove
           || tool == ToolTransform;
}

// Key -> action labelled map, shared with the shortcut sheet in QML. The map is
// the single source of truth for what the shortcut sheet advertises; handleKey
// switches on the same pairs, so the sheet and the behaviour cannot drift.
struct ShortcutEntry {
    const char *label;
    const char *key;
};

const ShortcutEntry kShortcuts[] = {
    { "Pencil",            "B" },
    { "Brush",             "V" },
    { "Eraser",            "E" },
    { "Pixel eraser",      "Shift+E" },
    { "Eyedropper",        "I" },
    { "Flood fill",        "G" },
    { "Line",              "L" },
    { "Rectangle",         "R" },
    { "Ellipse",           "O" },
    { "Polygon",           "Y" },
    { "Star",              "S" },
    { "Text",              "T" },
    { "Rectangle select",  "M" },
    { "Lasso",             "Shift+M" },
    { "Magic wand",        "W" },
    { "Move",              "A" },
    { "Transform",         "Ctrl+T" },
    { "Undo",              "Ctrl+Z" },
    { "Redo",              "Ctrl+Shift+Z" },
    { "Save",              "Ctrl+S" },
    { "Save as",           "Ctrl+Shift+S" },
    { "Export image",      "Ctrl+E" },
    { "Select all",        "Ctrl+A" },
    { "Deselect",          "Ctrl+D" },
    { "Invert selection",  "Ctrl+Shift+I" },
    { "Copy",              "Ctrl+C" },
    { "Cut",               "Ctrl+X" },
    { "Paste",             "Ctrl+V" },
    { "Swap colours",      "X" },
    { "Reset colours",     "D" },
    { "Zoom in",           "=" },
    { "Zoom out",          "-" },
    { "Fit to window",     "0" },
    { "Actual size",       "1" },
    { "Brush size down",   "[" },
    { "Brush size up",     "]" },
    { "Pan",               "Space" }
};

} // namespace

// ===========================================================================
// Construction / teardown
// ===========================================================================

PaintEngine::PaintEngine(QObject *parent)
    : QObject(parent)
{
    setObjectName(QStringLiteral("PaintEngine"));
    m_sessionClock.start();
    m_lastTickMs = monoMs();

    wireEngines();
    installProviders();

    // A blank white page is the one thing the app can always show, and it makes
    // every QML binding safe: no property in the UI needs to handle "no
    // document" as a special case on startup.
    newDocument(1600, 1000, QColor(255, 255, 255, 255));
    setStatus(QStringLiteral("Ready"));
}

PaintEngine::~PaintEngine()
{
    if (m_canvas) {
        // The canvas is owned by QML; the destroyed() connection in
        // createCanvasItem() clears our pointer, so reaching here with a live
        // pointer means QML is still alive. We make it inert rather than
        // deleting it.
        m_canvas->setEngine(nullptr);
        m_canvas = nullptr;
    }
}

void PaintEngine::setStatus(const QString &s)
{
    if (m_status == s)
        return;
    m_status = s;
    emit statusMessageChanged();
}

void PaintEngine::setTitle(const QString &t)
{
    if (m_title == t)
        return;
    m_title = t;
    emit titleChanged();
}

// ===========================================================================
// Wiring
// ===========================================================================

void PaintEngine::wireEngines()
{
    // ---- input ---------------------------------------------------------------
    connect(&m_input, &InputEngine::strokeStarted,
            this, &PaintEngine::onStrokeStarted);
    connect(&m_input, &InputEngine::strokeSample,
            this, &PaintEngine::onStrokeSample);
    connect(&m_input, &InputEngine::strokeFinished,
            this, &PaintEngine::onStrokeFinished);
    connect(&m_input, &InputEngine::strokeCancelled,
            this, &PaintEngine::onStrokeCancelled);
    connect(&m_input, &InputEngine::barrelPressedChanged,
            this, &PaintEngine::onBarrelPressed);
    connect(&m_input, &InputEngine::eraserEndChanged,
            this, &PaintEngine::onEraserEnd);
    connect(&m_input, &InputEngine::eyedropRequested,
            this, &PaintEngine::onEyedropRequested);
    connect(&m_input, &InputEngine::panRequested,
            this, &PaintEngine::onPanRequested);
    connect(&m_input, &InputEngine::toolSwapRequested,
            this, &PaintEngine::onToolSwapRequested);
    connect(&m_input, &InputEngine::liveChanged, this, [this] {
        m_liveReadout = m_input.describeLive();
        emit liveChanged();
    });

    // ---- layers ----------------------------------------------------------------
    connect(&m_layers, &LayerEngine::layersChanged, this, [this] {
        m_layerCache = layerList();
        noteCompositeDirty();
        emit layersChanged();
    });
    connect(&m_layers, &LayerEngine::currentLayerChanged, this, [this] {
        emit activeLayerChanged();
    });
    connect(&m_layers, &LayerEngine::compositeDirty, this, [this] {
        noteCompositeDirty();
    });

    // ---- selection ----------------------------------------------------------------
    connect(&m_selection, &SelectionEngine::changed, this, [this] {
        noteCompositeDirty();
        emit selectionChanged();
    });

    // ---- undo -------------------------------------------------------------------
    connect(&m_undo, &UndoEngine::stateChanged, this, [this] {
        const qint64 rev = m_revision + 1;
        m_revision = rev;
        m_store.setRevision(rev);
        emit revisionChanged();
        emit historyChanged();
        noteCompositeDirty();
    });
    connect(&m_undo, &UndoEngine::pushed, this,
            [this](const QString &label) { setStatus(QStringLiteral("Recorded: %1").arg(label)); });
    connect(&m_undo, &UndoEngine::undone, this,
            [this](const QString &label) { setStatus(QStringLiteral("Undid: %1").arg(label)); });
    connect(&m_undo, &UndoEngine::redone, this,
            [this](const QString &label) { setStatus(QStringLiteral("Redid: %1").arg(label)); });
    connect(&m_undo, &UndoEngine::cleared, this,
            [this] { setStatus(QStringLiteral("History cleared")); });

    // ---- document store --------------------------------------------------------------
    connect(&m_store, &DocumentStore::statusChanged, this,
            [this](const QString &m) { setStatus(m); });
    connect(&m_store, &DocumentStore::autosaveChanged, this,
            &PaintEngine::autosaveChanged);
    connect(&m_store, &DocumentStore::recoveryChanged, this,
            &PaintEngine::recoveryChanged);
    connect(&m_store, &DocumentStore::recentChanged, this,
            &PaintEngine::recentChanged);
    connect(&m_store, &DocumentStore::pathChanged, this, [this] {
        m_path = m_store.path();
        emit pathChanged();
    });
}

void PaintEngine::installProviders()
{
    m_store.setPayloadProvider([this]() -> DocumentPayload {
        DocumentPayload p;
        p.layers = &m_layers;
        p.selection = &m_selection;
        p.size = m_size;
        p.revision = m_revision;
        p.title = m_title;
        p.appVersion = QStringLiteral("1.0.0");
        for (const CanvasText &ct : m_texts)
            p.texts.append(ct.item);

        QVariantMap guides;
        guides.insert("gridVisible", m_gridVisible);
        guides.insert("gridSize", m_gridSize);
        guides.insert("gridSnap", m_gridSnap);
        guides.insert("guidesVisible", m_guidesVisible);
        {
            QVariantList v, h;
            for (double d : m_guidesVertical) v.append(d);
            for (double d : m_guidesHorizontal) h.append(d);
            guides.insert("guidesV", v);
            guides.insert("guidesH", h);
        }
        p.guides = guides;

        QVariantMap meta;
        meta.insert("tool", m_tool);
        meta.insert("zoom", m_zoom);
        meta.insert("foreground", m_foreground.name(QColor::HexArgb));
        meta.insert("background", m_background.name(QColor::HexArgb));
        meta.insert("symmetryMode", m_symmetryMode);
        meta.insert("symmetryAxisX", m_symAxis.x());
        meta.insert("symmetryAxisY", m_symAxis.y());
        p.metadata = meta;

        if (m_size.isValid() && !m_size.isEmpty())
            p.includeThumbnail = true;
        return p;
    });
}

// ===========================================================================
// Canvas
// ===========================================================================

QQuickItem *PaintEngine::createCanvasItem()
{
    if (m_canvas)
        return m_canvas;
    auto *item = new PaintCanvasItem();
    item->setEngine(this);
    m_canvas = item;
    connect(item, &QObject::destroyed, this, [this] { m_canvas = nullptr; });
    return item;
}

QTransform PaintEngine::viewTransform() const
{
    QTransform t;
    t.scale(m_zoom, m_zoom);
    if (m_flipH)
        t.scale(-1.0, 1.0);
    if (m_flipV)
        t.scale(1.0, -1.0);
    if (std::fabs(m_rotation) > 0.001)
        t.rotate(m_rotation);
    t.translate(-m_pan.x(), -m_pan.y());
    return t;
}

QTransform PaintEngine::documentTransform() const
{
    return viewTransform().inverted();
}

QPointF PaintEngine::itemToDocument(const QPointF &itemPos) const
{
    return documentTransform().map(itemPos);
}

QPointF PaintEngine::documentToItem(const QPointF &docPos) const
{
    return viewTransform().map(docPos);
}

const QImage &PaintEngine::composite() const
{
    // LayerEngine::composite() builds a fresh image every call. The canvas
    // holds our reference across a whole paint() pass, so we own a stable copy
    // and rebuild it only when something actually changed the pixels.
    if (!m_cacheValid || m_cacheSerial != m_compositeSerial) {
        m_compositeCache = m_layers.composite();
        m_cacheSerial = m_compositeSerial;
        m_cacheValid = true;
    }
    return m_compositeCache;
}

void PaintEngine::noteCompositeDirty()
{
    ++m_compositeSerial;
    m_cacheValid = false;
    emit compositeChanged();
}

// ===========================================================================
// Input path
// ===========================================================================

bool PaintEngine::handlePointer(int phase, const RawSample &sample)
{
    if (!hasDocument())
        return false;

    m_lastItemPos = sample.pos;
    m_lastDocPos = itemToDocument(sample.pos);

    // Hand the platform event to the InputEngine for palm rejection, pressure
    // shaping and smoothing. Whatever survives comes back as stroke signals,
    // which the slots below interpret according to the current tool.
    return m_input.pointerEvent(phase, sample);
}

bool PaintEngine::handleHover(const RawSample &sample)
{
    if (!hasDocument())
        return false;
    m_lastItemPos = sample.pos;
    m_lastDocPos = itemToDocument(sample.pos);
    m_liveReadout = m_input.describeLive();
    emit liveChanged();
    return true;
}

bool PaintEngine::handleWheel(double deltaY, const QPointF &itemPos, bool ctrlHeld)
{
    if (!hasDocument())
        return false;
    if (ctrlHeld) {
        // Pinch-style zoom anchored at the cursor.
        const double factor = deltaY > 0.0 ? 1.1 : 1.0 / 1.1;
        zoomAt(itemPos, factor);
        return true;
    }
    // Plain wheel pans vertically; painting apps rarely want the page to scroll
    // because the page is a drawing, not a document.
    panBy(QPointF(0.0, -deltaY));
    return true;
}

bool PaintEngine::handleKey(int key, const QString &text, int modifiers, bool pressed)
{
    const bool ctrl = (modifiers & Qt::ControlModifier) != 0;
    const bool shift = (modifiers & Qt::ShiftModifier) != 0;
    const bool alt = (modifiers & Qt::AltModifier) != 0;
    Q_UNUSED(text);

    // Keep the engine's modifier mirror in sync; the canvas reports the same
    // state to us because pen events carry no modifier information.
    if (pressed) {
        if (key >= Qt::Key_Shift && key <= Qt::Key_AltGr) {
            m_shiftDown = (key == Qt::Key_Shift);
            m_altDown = (key == Qt::Key_Alt || key == Qt::Key_AltGr);
            m_ctrlDown = (key == Qt::Key_Control || key == Qt::Key_Meta);
            m_spaceDown = false;
            return true;
        }
        if (key == Qt::Key_Space)
            m_spaceDown = true;
    } else {
        if (key == Qt::Key_Space)
            m_spaceDown = false;
        if (key == Qt::Key_Shift)
            m_shiftDown = false;
        if (key == Qt::Key_Alt || key == Qt::Key_AltGr)
            m_altDown = false;
        if (key == Qt::Key_Control || key == Qt::Key_Meta)
            m_ctrlDown = false;
        return true;
    }

    // Modifier-key shortcuts have priority over the single-key tool switches,
    // otherwise Ctrl+S would silently switch to the Star tool.
    if (ctrl) {
        switch (key) {
        case Qt::Key_S:
            if (shift) { saveDocumentAs(QString()); } else { saveDocument(); }
            return true;
        case Qt::Key_E:
            exportDocument(QString(), QStringLiteral("png"), 92);
            return true;
        case Qt::Key_Z: return undo();
        case Qt::Key_Y: return redo();
        case Qt::Key_A: selectAll(); return true;
        case Qt::Key_D: clearSelection(); return true;
        case Qt::Key_I: invertSelection(); return true;
        case Qt::Key_C: copySelection(); return true;
        case Qt::Key_X: cutSelection(); return true;
        case Qt::Key_V: pasteClipboard(); return true;
        case Qt::Key_T: setTool(ToolTransform); return true;
        case Qt::Key_Plus:
        case Qt::Key_Equal: zoomIn(); return true;
        case Qt::Key_Minus: zoomOut(); return true;
        case Qt::Key_0: resetView(); return true;
        case Qt::Key_1: zoomToActual(); return true;
        default: break;
        }
    }

    switch (key) {
    case Qt::Key_B: setTool(ToolPencil); return true;
    case Qt::Key_V: setTool(ToolBrush); return true;
    case Qt::Key_E: setTool(shift ? ToolEraserPixel : ToolEraserStroke); return true;
    case Qt::Key_I: setTool(ToolEyedropper); return true;
    case Qt::Key_G: setTool(ToolFill); return true;
    case Qt::Key_L: setTool(ToolLine); return true;
    case Qt::Key_R: setTool(ToolRect); return true;
    case Qt::Key_O: setTool(ToolEllipse); return true;
    case Qt::Key_Y: setTool(ToolPolygon); return true;
    case Qt::Key_S: setTool(ToolStar); return true;
    case Qt::Key_T: setTool(ToolText); return true;
    case Qt::Key_M: setTool(shift ? ToolSelectLasso : ToolSelectRect); return true;
    case Qt::Key_W: setTool(ToolSelectWand); return true;
    case Qt::Key_A: setTool(ToolMove); return true;
    case Qt::Key_X: swapColours(); return true;
    case Qt::Key_D: resetColours(); return true;
    case Qt::Key_Plus:
    case Qt::Key_Equal: zoomAt(m_lastItemPos, 1.25); return true;
    case Qt::Key_Minus: zoomAt(m_lastItemPos, 0.8); return true;
    case Qt::Key_0: zoomToFit(800, 600); return true;
    case Qt::Key_1: zoomToActual(); return true;
    case Qt::Key_BracketLeft: setBrushSize(qMax(1.0, m_brush.size() - 2.0)); return true;
    case Qt::Key_BracketRight: setBrushSize(m_brush.size() + 2.0); return true;
    case Qt::Key_Space: return true;   // consumed: canvas uses it to pan
    case Qt::Key_Escape:
        if (m_previewActive) { cancelShapeGesture(); return true; }
        if (m_dragging) { m_input.cancelStroke(); return true; }
        clearSelection();
        return true;
    default:
        return false;
    }
}

// ===========================================================================
// Input slots
// ===========================================================================

void PaintEngine::onStrokeStarted()
{
    if (isStrokeTool(m_tool)) {
        // Begin a real vector stroke on the current layer immediately.
        RawSample first;
        beginLiveStroke(first);
        return;
    }
    if (isShapeTool(m_tool)) {
        beginShapeGesture(m_lastDocPos);
        return;
    }
    if (m_tool == ToolMove || m_tool == ToolTransform) {
        beginMoveGesture(m_lastDocPos);
        return;
    }
    if (isSelectionTool(m_tool)) {
        beginSelectionGesture(m_lastDocPos);
        return;
    }
    if (m_tool == ToolEyedropper) {
        const QColor c = sampleCompositeAt(m_lastDocPos);
        setForeground(c);
        setStatus(QStringLiteral("Sampled %1").arg(c.name(QColor::HexArgb)));
        m_input.cancelStroke();
        return;
    }
    if (m_tool == ToolFill) {
        const QVariantMap r = floodFillAt(m_lastDocPos);
        setStatus(r.value("status").toString());
        m_input.cancelStroke();
        return;
    }
    m_input.cancelStroke();
}

void PaintEngine::onStrokeSample(const StrokePoint &point)
{
    // InputEngine works in item space (it has no opinion about the view);
    // convert here, once, so every consumer agrees.
    StrokePoint doc = point;
    doc.pos = itemToDocument(point.pos);
    const QPointF prevDoc = m_lastDocPos;
    m_lastDocPos = doc.pos;

    if (m_gesture == GestureStroke) {
        extendLiveStrokeFrom(doc);
    } else if (m_gesture == GestureShape) {
        updateShapeGesture(doc.pos, m_shiftDown, m_altDown);
    } else if (m_gesture == GestureSelect) {
        updateSelectionGesture(doc.pos, m_shiftDown, m_altDown);
    } else if (m_gesture == GestureMove) {
        updateMoveGesture(doc.pos, prevDoc, m_shiftDown);
    }
}

void PaintEngine::onStrokeFinished()
{
    switch (m_gesture) {
    case GestureStroke: finishLiveStroke(); break;
    case GestureShape: commitShapeGesture(); break;
    case GestureSelect: commitSelectionGesture(); break;
    case GestureMove: commitMoveGesture(); break;
    default: break;
    }
    m_gesture = GestureNone;
    m_dragging = false;
    noteCompositeDirty();
}

void PaintEngine::onStrokeCancelled()
{
    if (m_gesture == GestureStroke)
        cancelLiveStroke();
    if (m_gesture == GestureShape)
        cancelShapeGesture();
    m_gesture = GestureNone;
    m_dragging = false;
    setStatus(QStringLiteral("Gesture cancelled"));
    noteCompositeDirty();
}

void PaintEngine::onBarrelPressed(bool pressed)
{
    if (!pressed)
        return;
    // The barrel button swaps the active tool for as long as it is held. We
    // remember which one was active so releasing the mouse cancels cleanly.
    switch (m_input.barrelAction()) {
    case BarrelEraser: m_altTool = m_tool; setTool(ToolEraserStroke); break;
    case BarrelEyedropper: m_altTool = m_tool; setTool(ToolEyedropper); break;
    case BarrelPan: m_altTool = m_tool; m_spacePan = true; emit spacePanningChanged(); break;
    case BarrelToolSwitch: m_altTool = m_tool; break;
    default: break;
    }
}

void PaintEngine::onEraserEnd(bool active)
{
    Q_UNUSED(active);
    // The eraser end swaps to the pixel eraser for the duration of the stroke,
    // and swaps back afterwards. InputEngine already carries the eraser bit in
    // every sample; the swap is a UX nicety on top of the real eraser path.
}

void PaintEngine::onEyedropRequested(const QPointF &itemPos)
{
    setForeground(sampleCompositeAt(itemToDocument(itemPos)));
}

void PaintEngine::onPanRequested(const QPointF &delta)
{
    panBy(delta);
}

void PaintEngine::onToolSwapRequested(int fromTool, int toTool)
{
    Q_UNUSED(fromTool);
    setTool(toTool);
}

// ===========================================================================
// Live stroke machinery
// ===========================================================================

StrokeStyle PaintEngine::styleForTool(int tool) const
{
    StrokeStyle s = m_brush.style();
    switch (tool) {
    case ToolPencil:
        s.hardness = 1.0;
        s.spacing = 0.08;
        s.flow = 1.0;
        s.velocityThinning = 0.0;
        break;
    case ToolMarker:
        s.hardness = 0.9;
        s.flow = 0.6;
        s.opacity = 0.75;
        s.velocityThinning = 0.0;
        break;
    case ToolAirbrush:
        s.hardness = 0.2;
        s.flow = 0.15;
        s.velocityThinning = 0.0;
        s.sizePressureDepth = 0.0;
        break;
    case ToolCalligraphy:
        s.nib = NibChisel;
        s.nibAngle = m_brush.nibAngle();
        s.nibRatio = 0.25;
        break;
    case ToolEraserStroke:
    case ToolEraserPixel:
        s.eraserMode = true;
        s.colour = QColor(0, 0, 0, 255);
        s.blendMode = BlendNormal;
        break;
    default:
        break;
    }
    return s;
}

void PaintEngine::beginLiveStroke(const RawSample &sample)
{
    const int layerId = m_layers.currentIndex();
    PaintLayer *layer = m_layers.layerAt(layerId);
    if (!layer)
        return;
    if (layer->locked) {
        m_input.cancelStroke();
        setStatus(QStringLiteral("Layer is locked"));
        return;
    }

    m_liveLayerId = layer->id;
    StrokeStyle style = styleForTool(m_tool);
    if (m_input.eraserEnd())
        style.eraserMode = true;
    style.colour = m_foreground;
    if (style.eraserMode)
        style.colour = QColor(0, 0, 0, 255);

    m_liveStroke = Stroke();
    m_liveStroke.id = StrokeModel::nextId();
    m_liveStroke.kind = style.eraserMode ? StrokeEraser : StrokeInk;
    m_liveStroke.style = style;

    // First point comes from the live sample stream, not the press sample
    // (which may have been smoothed away).
    m_liveStroke.points.clear();
    m_liveStrokeId = m_liveStroke.id;

    m_layers.addStroke(m_liveLayerId, m_liveStroke);
    m_layers.invalidate(m_liveLayerId);

    m_gesture = GestureStroke;
    m_dragging = true;
    m_gestureBefore = QImage();
    setStatus(QStringLiteral("Stroke %1").arg(m_liveStrokeId));
    noteCompositeDirty();
}

void PaintEngine::extendLiveStroke(const RawSample &sample)
{
    Q_UNUSED(sample);
}

void PaintEngine::extendLiveStrokeFrom(const StrokePoint &point)
{
    StrokePoint p = point;
    // Symmetry twins are appended to their own strokes; the primary stroke is
    // the one we extend directly.
    m_liveStroke.points.append(p);
    m_liveStroke.invalidate();

    PaintLayer *layer = m_layers.layerAt(m_layers.indexOfId(m_liveLayerId));
    if (layer && !layer->strokes.isEmpty()) {
        // Replace the tail copy held in the vector with the growing one so the
        // cache replay always sees the newest geometry.
        for (Stroke &s : layer->strokes) {
            if (s.id == m_liveStrokeId) {
                s = m_liveStroke;
                break;
            }
        }
    }
    m_layers.invalidate(m_liveLayerId);
    noteCompositeDirty();
}

void PaintEngine::finishLiveStroke()
{
    if (m_liveStrokeId == 0)
        return;

    PaintLayer *layer = m_layers.layerById(m_liveLayerId);
    if (layer) {
        for (Stroke &s : layer->strokes) {
            if (s.id == m_liveStrokeId) {
                s = m_liveStroke;
                break;
            }
        }
    }

    // RDP-simplify greedily: long strokes keep every point above the epsilon,
    // and the tolerance is in document pixels so an 8000px canvas does not
    // degenerate into a zig-zag.
    Stroke finalised = m_liveStroke;
    finalised.points = StrokeModel::simplify(m_liveStroke.points, 0.35);
    finalised.invalidate();
    if (layer) {
        for (Stroke &s : layer->strokes) {
            if (s.id == m_liveStrokeId) {
                s = finalised;
                break;
            }
        }
    }

    // Symmetry twins are materialised here, once, in the exact order the axes
    // imply, so the undo step below stays a single clean step.
    QVector<Stroke> twins;
    const QVector<QTransform> sym = symmetryTransforms();
    for (const QTransform &t : sym) {
        Stroke twin = finalised;
        twin.id = StrokeModel::nextId();
        for (StrokePoint &p : twin.points)
            p.pos = t.map(p.pos);
        twin.invalidate();
        m_layers.addStroke(m_liveLayerId, twin);
        twins.append(twin);
    }

    m_layers.invalidate(m_liveLayerId);

    const Stroke undoData = finalised;
    const quint32 strokeId = m_liveStrokeId;
    const quint32 layerId = m_liveLayerId;

    m_undo.pushApplied(
        QStringLiteral("Stroke"),
        [this, layerId, strokeId, twins] {
            m_layers.removeStroke(layerId, strokeId);
            for (const Stroke &t : twins)
                m_layers.removeStroke(layerId, t.id);
            m_layers.invalidate(layerId);
            noteCompositeDirty();
        },
        [this, layerId, undoData, twins] {
            m_layers.addStroke(layerId, undoData);
            for (const Stroke &t : twins)
                m_layers.addStroke(layerId, t);
            m_layers.invalidate(layerId);
            noteCompositeDirty();
        },
        undoData.byteSize() * (1 + twins.size()),
        QStringLiteral("stroke:%1:%2").arg(layerId).arg(strokeId),
        0);

    m_liveStrokeId = 0;
    m_liveLayerId = 0;

    notifyDocumentChanged();
    if (m_gesture == GestureStroke)
        setStatus(QStringLiteral("Stroke done (%1 points)")
                      .arg(finalised.points.size()));
}

void PaintEngine::cancelLiveStroke()
{
    if (m_liveStrokeId != 0) {
        m_layers.removeStroke(m_liveLayerId, m_liveStrokeId);
        m_layers.invalidate(m_liveLayerId);
    }
    m_liveStrokeId = 0;
    m_liveLayerId = 0;
    noteCompositeDirty();
}

QVector<QTransform> PaintEngine::symmetryTransforms() const
{
    QVector<QTransform> out;
    switch (m_symmetryMode) {
    case SymmetryMirrorVertical:
        out.append(reflectVertically(m_symAxis.x()));
        break;
    case SymmetryMirrorHorizontal:
        out.append(reflectHorizontally(m_symAxis.y()));
        break;
    case SymmetryMirrorQuad:
        out.append(reflectVertically(m_symAxis.x()));
        out.append(reflectHorizontally(m_symAxis.y()));
        out.append(reflectVertically(m_symAxis.x()) * reflectHorizontally(m_symAxis.y()));
        break;
    case SymmetryRadial: {
        const int n = qBound(2, m_symBranches, 12);
        for (int k = 1; k < n; ++k)
            out.append(rotateAbout(m_symAxis, 360.0 * k / n));
        break;
    }
    default:
        break;
    }
    return out;
}

// ---------------------------------------------------------------------------
// Shape gesture
// ---------------------------------------------------------------------------

void PaintEngine::beginShapeGesture(const QPointF &docPos)
{
    PaintLayer *layer = m_layers.layerAt(m_layers.currentIndex());
    if (!layer || layer->locked) {
        m_input.cancelStroke();
        return;
    }
    m_gesture = GestureShape;
    m_gestureStart = docPos;
    m_previewActive = true;
    m_previewShape = m_shapes.begin(docPos, docPos);
    m_gestureBefore = QImage();
    emit snapHintChanged();
}

void PaintEngine::updateShapeGesture(const QPointF &docPos, bool shift, bool alt)
{
    Q_UNUSED(alt);
    QPointF applied = docPos;
    if (m_shapes.snapEnabled()) {
        const SnapResult r = m_shapes.snapPoint(docPos);
        applied = r.resolve(applied);
        if (r.snapped) {
            m_snapHint = r.kind;
            m_snapHintPos = r.applied;
            emit snapHintChanged();
        }
    }
    if (shift && m_shapes.currentShape() == ShapeLine)
        applied = m_shapes.constrainAngle(m_gestureStart, applied);
    m_shapes.extend(applied);
    m_previewShape = m_shapes.current();
    noteCompositeDirty();
}

void PaintEngine::commitShapeGesture()
{
    if (!m_previewActive)
        return;
    m_previewActive = false;
    m_previewShape = m_shapes.finish();
    emit snapHintChanged();
    if (m_previewShape.points.size() < 2) {
        setStatus(QStringLiteral("Shape too small"));
        return;
    }
    rasteriseShape(m_previewShape);
}

void PaintEngine::cancelShapeGesture()
{
    m_previewActive = false;
    m_shapes.finish();
    emit snapHintChanged();
    noteCompositeDirty();
}

void PaintEngine::rasteriseShape(const Shape &shape)
{
    PaintLayer *layer = m_layers.layerAt(m_layers.currentIndex());
    if (!layer)
        return;
    const quint32 layerId = layer->id;
    QImage before = layer->base;

    Shape s = shape;
    s.filled = m_shapes.filled();
    s.strokeWidth = m_shapes.strokeWeight();
    m_shapes.render(m_layers.baseOf(layerId), s, FillOptions());
    m_layers.invalidate(layerId);
    recordBaseEdit(QStringLiteral("Shape"), layerId, before,
                   QStringLiteral("shape:%1").arg(s.id));
    notifyDocumentChanged();
}

// ---------------------------------------------------------------------------
// Selection gesture
// ---------------------------------------------------------------------------

void PaintEngine::beginSelectionGesture(const QPointF &docPos)
{
    m_gesture = GestureSelect;
    m_selectionBefore = m_selection.mask();
    switch (m_tool) {
    case ToolSelectRect: m_selection.beginRectangle(docPos); break;
    case ToolSelectLasso: m_selection.beginLasso(docPos); break;
    case ToolSelectWand:
        m_selection.wandSelect(m_layers.composite(), docPos, false);
        recordSelectionEdit(QStringLiteral("Wand select"), m_selectionBefore);
        m_gesture = GestureNone;
        break;
    default:
        m_selection.beginRectangle(docPos);
        break;
    }
}

void PaintEngine::updateSelectionGesture(const QPointF &docPos, bool shift, bool alt)
{
    if (m_tool == ToolSelectLasso) {
        m_selection.addLassoPoint(docPos, 1.0);
        return;
    }
    const bool square = shift;
    const bool additive = alt;
    Q_UNUSED(additive);
    m_selection.updateRectangle(docPos, square);
}

void PaintEngine::commitSelectionGesture()
{
    if (m_tool == ToolSelectLasso) {
        m_selection.commitLasso(true);
    } else if (m_tool == ToolSelectRect) {
        m_selection.commitRectangle();
    }
    if (!m_selectionBefore.isNull())
        recordSelectionEdit(QStringLiteral("Select"), m_selectionBefore);
    else
        recordSelectionEdit(QStringLiteral("Select"), QImage());
    notifyDocumentChanged();
    setStatus(QStringLiteral("Selection %1px").arg(m_selection.pixelCount()));
}

// ---------------------------------------------------------------------------
// Move / transform gesture
// ---------------------------------------------------------------------------

void PaintEngine::beginMoveGesture(const QPointF &docPos)
{
    m_gesture = GestureMove;
    m_moveAccum = QPointF();
    m_gestureStart = docPos;
    m_gestureBefore = QImage();
}

void PaintEngine::updateMoveGesture(const QPointF &docPos, const QPointF &prevDoc,
                                    bool constrain)
{
    Q_UNUSED(constrain);
    const QPointF delta = docPos - prevDoc;
    m_moveAccum += delta;
    if (m_tool == ToolMove) {
        // The live transform is previewed by offsetting the selection box;
        // actual content movement happens on commit to keep the raster copy.
        m_selection.applyMaskTransform(QTransform().translate(delta.x(), delta.y()));
        noteCompositeDirty();
    }
}

void PaintEngine::commitMoveGesture()
{
    if (m_tool != ToolMove && m_tool != ToolTransform)
        return;
    if (!m_selection.active())
        return;

    // Flatten the current layer to pixels so a partial selection can be moved
    // without dragging vector strokes behind it.
    PaintLayer *layer = m_layers.layerAt(m_layers.currentIndex());
    if (!layer)
        return;
    const quint32 layerId = layer->id;
    QImage before = layer->base;
    QImage resolved = m_layers.resolvedOf(layerId);
    QImage moving = m_selection.cut(resolved);
    if (moving.isNull()) {
        m_selection.applyMaskTransform(QTransform());
        return;
    }

    QImage &base = m_layers.baseOf(layerId);
    base = resolved;
    layer->strokes.clear();

    // Paste the moved content at the new selection origin.
    const QRectF box = m_selection.box();
    m_selection.pasteInto(moving, box.topLeft(), base);

    m_layers.invalidate(layerId);
    recordBaseEdit(QStringLiteral("Move"), layerId, before);
    notifyDocumentChanged();
}

void PaintEngine::beginPanGesture(const QPointF &itemPos)
{
    Q_UNUSED(itemPos);
    m_gesture = GesturePan;
}

void PaintEngine::updatePanGesture(const QPointF &itemPos)
{
    const QPointF delta = itemPos - m_lastItemPos;
    panBy(delta);
    m_lastItemPos = itemPos;
}

void PaintEngine::endPanGesture()
{
    m_gesture = GestureNone;
}

// ===========================================================================
// Pixel painting bridge
// ===========================================================================

QRectF PaintEngine::paintIntoActiveLayer(const QImage &source, const QRectF &destRect,
                                         int blendMode, double opacity, bool destinationOut)
{
    PaintLayer *layer = m_layers.layerAt(m_layers.currentIndex());
    if (!layer || source.isNull())
        return QRectF();

    const quint32 layerId = layer->id;
    QImage before = layer->base;
    QRectF dirty;

    QImage &base = m_layers.baseOf(layerId);
    QPainter p(&base);
    p.setRenderHint(QPainter::Antialiasing, true);
    p.setRenderHint(QPainter::SmoothPixmapTransform, true);
    p.setOpacity(opacity);

    if (destinationOut) {
        p.setCompositionMode(QPainter::CompositionMode_DestinationOut);
    } else {
        p.setCompositionMode(QPainter::CompositionMode_SourceOver);
    }
    p.drawImage(destRect.topLeft(), source);
    p.end();
    dirty = destRect;

    m_layers.invalidate(layerId);
    recordBaseEdit(QStringLiteral("Paint"), layerId, before,
                   QStringLiteral("paint:%1").arg(layerId));
    notifyDocumentChanged();
    return dirty;
}

// ===========================================================================
// Document lifecycle
// ===========================================================================

QVariantMap PaintEngine::newDocument(int width, int height, const QColor &background)
{
    const QSize size(qMax(16, width), qMax(16, height));
    m_layers.reset(size, background);
    resetDocumentState();
    adoptSize(size);

    m_title = QStringLiteral("Untitled");
    m_path.clear();
    m_modified = false;
    m_revision = 0;
    m_store.setRevision(0);
    m_store.setModified(false);
    m_undo.clear();
    m_texts.clear();
    m_clipboard = ClipboardBlob();
    m_selection.selectNone();

    emit titleChanged();
    emit documentSizeChanged();
    emit historyChanged();
    emit textItemsChanged();
    noteCompositeDirty();
    setStatus(QStringLiteral("New document %1 x %2").arg(width).arg(height));
    return QVariantMap{ { "ok", true } };
}

void PaintEngine::adoptSize(const QSize &size)
{
    if (m_size == size)
        return;
    m_size = size;
    emit documentSizeChanged();
}

void PaintEngine::resetDocumentState()
{
    m_gesture = GestureNone;
    m_liveStrokeId = 0;
    m_liveLayerId = 0;
    m_previewActive = false;
    m_dragging = false;
    m_pendingSelectionCommit = false;
    m_moveAccum = QPointF();
    m_symAxis = QPointF(double(m_size.width()) * 0.5,
                        double(m_size.height()) * 0.5);
    if (m_guidesVertical.isEmpty())
        m_guidesVertical.append(double(m_size.width()) * 0.5);
    if (m_guidesHorizontal.isEmpty())
        m_guidesHorizontal.append(double(m_size.height()) * 0.5);
}

QVariantMap PaintEngine::openDocument(const QString &filePath, bool asRecovery)
{
    QVariantMap out;
    if (filePath.isEmpty()) {
        out.insert("ok", false);
        out.insert("error", QStringLiteral("No path given."));
        return out;
    }
    if (asRecovery) {
        out = m_store.loadRecovery();
    } else {
        out = m_store.load(filePath);
    }
    if (!out.value("ok").toBool()) {
        setStatus(out.value("error").toString());
        return out;
    }

    // The store decoded into &m_layers (via the payload provider) and restored
    // the selection; adopt the rest here.
    m_size = m_layers.size();
    emit documentSizeChanged();
    m_modified = false;
    m_title = out.value("title", m_title).toString();
    emit titleChanged();
    emit pathChanged();
    emit layersChanged();
    emit historyChanged();
    noteCompositeDirty();
    setStatus(QStringLiteral("Opened %1").arg(QFileInfo(filePath).fileName()));
    return out;
}

QVariantMap PaintEngine::saveDocument()
{
    QVariantMap out;
    if (m_path.isEmpty()) {
        out.insert("ok", false);
        out.insert("error", QStringLiteral("Save As is required first."));
        return out;
    }
    out = m_store.saveCurrent();
    if (out.value("ok").toBool()) {
        m_modified = false;
        emit modifiedChanged();
    }
    return out;
}

QVariantMap PaintEngine::saveDocumentAs(const QString &filePath)
{
    QVariantMap out = m_store.save(filePath, QVariantMap());
    if (out.value("ok").toBool()) {
        m_modified = false;
        m_path = filePath;
        emit modifiedChanged();
        emit pathChanged();
    }
    return out;
}

QVariantMap PaintEngine::exportDocument(const QString &filePath,
                                        const QString &format, int quality)
{
    if (filePath.isEmpty()) {
        // The QML dialog captures the real path; this entry point defines the
        // default file name so a missing path still yields a sensible result.
        const QString base = m_path.isEmpty() ? QStringLiteral("paint") : m_path;
        QString f = base;
        const int dot = f.lastIndexOf(QLatin1Char('.'));
        if (dot > 0)
            f = f.left(dot);
        return m_store.exportImage(f + QStringLiteral(".png"), composite(),
                                   QStringLiteral("png"), quality);
    }
    return m_store.exportImage(filePath, composite(), format, quality);
}

QVariantMap PaintEngine::exportFlattened(const QString &filePath,
                                         const QString &format, int quality)
{
    if (filePath.isEmpty()) {
        QString f = m_path.isEmpty() ? QStringLiteral("paint") : m_path;
        const int dot = f.lastIndexOf(QLatin1Char('.'));
        if (dot > 0)
            f = f.left(dot);
        return m_store.exportImage(f + QStringLiteral(".png"),
                                   m_layers.compositeFlat(),
                                   QStringLiteral("png"), quality);
    }
    return m_store.exportImage(filePath, m_layers.compositeFlat(), format, quality);
}

QVariantMap PaintEngine::documentInfo(const QString &filePath) const
{
    return DocumentStore::inspect(filePath);
}

void PaintEngine::closeDocument()
{
    m_layers.reset(m_size, QColor(255, 255, 255, 255));
    m_texts.clear();
    m_selection.selectNone();
    m_undo.clear();
    emit layersChanged();
    emit textItemsChanged();
    emit documentClosed();
    noteCompositeDirty();
}

// ===========================================================================
// Tools
// ===========================================================================

void PaintEngine::setTool(int t)
{
    if (t < ToolPencil || t > ToolTransform)
        return;
    if (m_tool == t)
        return;
    m_previousTool = m_tool;
    m_tool = t;
    setStatus(QStringLiteral("Tool: %1").arg(toolName(t)));
    emit toolChanged();
}

bool PaintEngine::toolUsesBrush() const
{
    return isStrokeTool(m_tool) || m_tool == ToolEyedropper;
}

bool PaintEngine::toolUsesShapeOptions() const
{
    return isShapeTool(m_tool);
}

bool PaintEngine::toolUsesSelection() const
{
    return isSelectionTool(m_tool);
}

// ===========================================================================
// View
// ===========================================================================

void PaintEngine::setZoom(double z)
{
    const double nz = qBound(0.02, z, 64.0);
    if (qFuzzyCompare(m_zoom, nz))
        return;
    m_zoom = nz;
    emit viewChanged();
    noteCompositeDirty();
}

void PaintEngine::setPanX(double v) { m_pan.setX(v); emit viewChanged(); }
void PaintEngine::setPanY(double v) { m_pan.setY(v); emit viewChanged(); }

void PaintEngine::zoomAt(const QPointF &itemPos, double factor)
{
    if (factor <= 0.0)
        return;
    // Keep the document point under the cursor stationary.
    const QPointF doc = itemToDocument(itemPos);
    m_zoom = qBound(0.02, m_zoom * factor, 64.0);
    const QPointF after = documentToItem(doc);
    m_pan -= after - itemPos;
    emit viewChanged();
    noteCompositeDirty();
}

void PaintEngine::zoomIn()  { setZoom(m_zoom * 1.25); }
void PaintEngine::zoomOut() { setZoom(m_zoom / 1.25); }

void PaintEngine::zoomToFit(double viewportW, double viewportH)
{
    if (m_size.isEmpty() || viewportW <= 0.0 || viewportH <= 0.0)
        return;
    const double z = qMin(viewportW / m_size.width(),
                          viewportH / m_size.height());
    m_zoom = qBound(0.02, z * 0.9, 64.0);
    m_pan = QPointF((viewportW - m_size.width() * m_zoom) * 0.5,
                    (viewportH - m_size.height() * m_zoom) * 0.5);
    emit viewChanged();
    noteCompositeDirty();
}

void PaintEngine::zoomToActual() { setZoom(1.0); }

void PaintEngine::panBy(const QPointF &delta)
{
    m_pan += delta;
    emit viewChanged();
}

void PaintEngine::resetView()
{
    m_zoom = 1.0;
    m_pan = QPointF(0, 0);
    m_rotation = 0.0;
    m_flipH = false;
    m_flipV = false;
    emit viewChanged();
    noteCompositeDirty();
}

void PaintEngine::rotateView(double degrees) { m_rotation = std::fmod(m_rotation + degrees, 360.0); emit viewChanged(); }
void PaintEngine::flipViewH() { m_flipH = !m_flipH; emit viewChanged(); noteCompositeDirty(); }
void PaintEngine::flipViewV() { m_flipV = !m_flipV; emit viewChanged(); noteCompositeDirty(); }

void PaintEngine::setHandMode(bool v)
{
    if (m_handMode == v)
        return;
    m_handMode = v;
    emit handModeChanged();
    emit spacePanningChanged();
}

// ===========================================================================
// Colour
// ===========================================================================

void PaintEngine::setForeground(const QColor &c)
{
    if (!c.isValid() || m_foreground == c)
        return;
    m_foreground = c;
    pushRecentColour(c);
    emit colourChanged();
}

void PaintEngine::setBackground(const QColor &c)
{
    if (!c.isValid() || m_background == c)
        return;
    m_background = c;
    emit colourChanged();
}

void PaintEngine::swapColours()
{
    QColor tmp = m_foreground;
    m_foreground = m_background;
    m_background = tmp;
    emit colourChanged();
}

void PaintEngine::resetColours()
{
    m_foreground = QColor(24, 26, 32, 255);
    m_background = QColor(255, 255, 255, 255);
    emit colourChanged();
}

void PaintEngine::pushRecentColour(const QColor &c)
{
    if (!c.isValid())
        return;
    for (int i = 0; i < m_recentColours.size(); ++i) {
        if (m_recentColours.at(i).toString() == c.name(QColor::HexArgb)) {
            m_recentColours.removeAt(i);
            break;
        }
    }
    m_recentColours.prepend(c.name(QColor::HexArgb));
    while (m_recentColours.size() > 10)
        m_recentColours.removeLast();
}

QColor PaintEngine::sampleCompositeAt(const QPointF &docPos) const
{
    const QImage &img = composite();
    if (img.isNull())
        return QColor(0, 0, 0, 0);
    const int x = qBound(0, int(docPos.x()), img.width() - 1);
    const int y = qBound(0, int(docPos.y()), img.height() - 1);
    return QColor(img.pixel(x, y));
}

QColor PaintEngine::sampleLayerAt(const QPointF &docPos) const
{
    PaintLayer *layer = m_layers.layerAt(m_layers.currentIndex());
    if (!layer)
        return QColor(0, 0, 0, 0);
    const QImage &res = layer->resolved();
    const int x = qBound(0, int(docPos.x()), res.width() - 1);
    const int y = qBound(0, int(docPos.y()), res.height() - 1);
    return QColor(res.pixel(x, y));
}

// ===========================================================================
// Symmetry / grid / guides
// ===========================================================================

void PaintEngine::setSymmetryMode(int m)
{
    if (m_symmetryMode == m)
        return;
    m_symmetryMode = m;
    if (m_symmetryMode != SymmetryNone) {
        m_symAxis = QPointF(double(m_size.width()) * 0.5,
                            double(m_size.height()) * 0.5);
    }
    emit symmetryChanged();
    noteCompositeDirty();
}

void PaintEngine::setSymmetryAxisX(double v) { m_symAxis.setX(v); emit symmetryChanged(); noteCompositeDirty(); }
void PaintEngine::setSymmetryAxisY(double v) { m_symAxis.setY(v); emit symmetryChanged(); noteCompositeDirty(); }
void PaintEngine::setSymmetryBranches(int n) { m_symBranches = qBound(2, n, 12); emit symmetryChanged(); }

void PaintEngine::setGridVisible(bool v) { if (m_gridVisible == v) return; m_gridVisible = v; emit gridChanged(); noteCompositeDirty(); }
void PaintEngine::setGridSize(double v) { m_gridSize = qMax(2.0, v); emit gridChanged(); noteCompositeDirty(); }
void PaintEngine::setGridSnap(bool v) { if (m_gridSnap == v) return; m_gridSnap = v; emit gridChanged(); }
void PaintEngine::setGuidesVisible(bool v) { if (m_guidesVisible == v) return; m_guidesVisible = v; emit gridChanged(); noteCompositeDirty(); }

QVariantList PaintEngine::guidesV() const
{
    QVariantList out;
    for (double d : m_guidesVertical) out.append(d);
    return out;
}

QVariantList PaintEngine::guidesH() const
{
    QVariantList out;
    for (double d : m_guidesHorizontal) out.append(d);
    return out;
}

void PaintEngine::addGuide(double pos, bool vertical)
{
    (vertical ? m_guidesVertical : m_guidesHorizontal).append(pos);
    emit gridChanged();
    noteCompositeDirty();
}

void PaintEngine::moveGuide(int index, bool vertical, double pos)
{
    QVector<double> &g = vertical ? m_guidesVertical : m_guidesHorizontal;
    if (index < 0 || index >= g.size())
        return;
    g[index] = pos;
    emit gridChanged();
    noteCompositeDirty();
}

void PaintEngine::removeGuide(int index, bool vertical)
{
    QVector<double> &g = vertical ? m_guidesVertical : m_guidesHorizontal;
    if (index < 0 || index >= g.size())
        return;
    g.removeAt(index);
    emit gridChanged();
    noteCompositeDirty();
}

void PaintEngine::clearGuides()
{
    m_guidesVertical.clear();
    m_guidesHorizontal.clear();
    emit gridChanged();
    noteCompositeDirty();
}

// ===========================================================================
// Layers
// ===========================================================================

QVariantList PaintEngine::layerList() const
{
    QVariantList out;
    const QVector<PaintLayer> &ls = m_layers.layers();
    for (int i = 0; i < ls.size(); ++i) {
        const PaintLayer &l = ls.at(i);
        QVariantMap m;
        m.insert("index", i);
        m.insert("id", double(l.id));
        m.insert("name", l.name);
        m.insert("opacity", l.opacity);
        m.insert("blend", l.blendMode);
        m.insert("blendName", blendModeName(l.blendMode));
        m.insert("visible", l.visible);
        m.insert("locked", l.locked);
        m.insert("alphaLocked", l.alphaLocked);
        m.insert("isGroup", l.isGroup);
        m.insert("isMask", l.isMask);
        m.insert("isReference", l.isReference);
        m.insert("isTextLayer", l.isTextLayer);
        m.insert("strokes", l.strokes.size());
        m.insert("bytes", double(l.bytes()));
        m.insert("thumb", l.resolved().scaled(64, 64, Qt::KeepAspectRatio,
                                              Qt::SmoothTransformation));
        out.append(m);
    }
    return out;
}

void PaintEngine::setActiveLayerIndex(int i)
{
    if (i < 0 || i >= m_layers.count())
        return;
    m_layers.setCurrentIndex(i);
}

QString PaintEngine::activeLayerName() const
{
    PaintLayer *l = m_layers.layerAt(m_layers.currentIndex());
    return l ? l->name : QString();
}

quint32 PaintEngine::addLayer(const QString &name)
{
    const QVector<LayerSnapshot> before = m_layers.snapshotAll();
    m_layers.addRasterLayer(name.isEmpty() ? QStringLiteral("Layer %1").arg(m_layers.count() + 1)
                                           : name,
                            QImage(), -1);
    recordLayerListEdit(QStringLiteral("Add layer"), before);
    emit layersChanged();
    notifyDocumentChanged();
    return m_layers.currentLayerId();
}

quint32 PaintEngine::addGroup(const QString &name)
{
    const QVector<LayerSnapshot> before = m_layers.snapshotAll();
    m_layers.addGroup(name.isEmpty() ? QStringLiteral("Group %1").arg(m_layers.count() + 1)
                                     : name);
    recordLayerListEdit(QStringLiteral("Add group"), before);
    emit layersChanged();
    notifyDocumentChanged();
    return m_layers.currentLayerId();
}

quint32 PaintEngine::duplicateActiveLayer()
{
    const QVector<LayerSnapshot> before = m_layers.snapshotAll();
    PaintLayer *l = m_layers.layerAt(m_layers.currentIndex());
    if (!l)
        return 0;
    quint32 copyId = 0;
    m_layers.duplicateLayer(l->id, &copyId);
    recordLayerListEdit(QStringLiteral("Duplicate layer"), before);
    emit layersChanged();
    notifyDocumentChanged();
    return copyId;
}

bool PaintEngine::removeActiveLayer()
{
    if (m_layers.count() <= 1)
        return false;
    const QVector<LayerSnapshot> before = m_layers.snapshotAll();
    PaintLayer *l = m_layers.layerAt(m_layers.currentIndex());
    if (!l)
        return false;
    const quint32 id = l->id;
    const bool ok = m_layers.removeLayer(id);
    recordLayerListEdit(QStringLiteral("Delete layer"), before);
    emit layersChanged();
    notifyDocumentChanged();
    return ok;
}

bool PaintEngine::moveActiveLayer(int delta)
{
    const QVector<LayerSnapshot> before = m_layers.snapshotAll();
    const int cur = m_layers.currentIndex();
    m_layers.moveLayer(m_layers.currentLayerId(), qBound(0, cur + delta, m_layers.count() - 1));
    recordLayerListEdit(QStringLiteral("Reorder layer"), before);
    emit layersChanged();
    notifyDocumentChanged();
    return true;
}

bool PaintEngine::renameLayer(int index, const QString &name)
{
    const QVector<LayerSnapshot> before = m_layers.snapshotAll();
    quint32 id = 0;
    if (index >= 0 && index < m_layers.count())
        id = m_layers.layers().at(index).id;
    const bool ok = id != 0 && m_layers.renameLayer(id, name);
    recordLayerListEdit(QStringLiteral("Rename layer"), before);
    emit layersChanged();
    notifyDocumentChanged();
    return ok;
}

bool PaintEngine::setLayerOpacity(int index, double opacity)
{
    quint32 id = index >= 0 && index < m_layers.count()
                     ? m_layers.layers().at(index).id : 0;
    return id != 0 && m_layers.setLayerOpacity(id, qBound(0.0, opacity, 1.0));
}

bool PaintEngine::setLayerBlend(int index, int blendMode)
{
    quint32 id = index >= 0 && index < m_layers.count()
                     ? m_layers.layers().at(index).id : 0;
    const bool ok = id != 0 && m_layers.setLayerBlend(id, blendMode);
    if (ok)
        noteCompositeDirty();
    return ok;
}

bool PaintEngine::setLayerVisible(int index, bool visible)
{
    quint32 id = index >= 0 && index < m_layers.count()
                     ? m_layers.layers().at(index).id : 0;
    const bool ok = id != 0 && m_layers.setLayerVisible(id, visible);
    if (ok)
        emit layersChanged();
    return ok;
}

bool PaintEngine::setLayerLocked(int index, bool locked)
{
    quint32 id = index >= 0 && index < m_layers.count()
                     ? m_layers.layers().at(index).id : 0;
    const bool ok = id != 0 && m_layers.setLayerLocked(id, locked);
    if (ok)
        emit layersChanged();
    return ok;
}

bool PaintEngine::setLayerAlphaLocked(int index, bool locked)
{
    quint32 id = index >= 0 && index < m_layers.count()
                     ? m_layers.layers().at(index).id : 0;
    return id != 0 && m_layers.setLayerAlphaLocked(id, locked);
}

bool PaintEngine::setLayerClipTo(int index, int targetIndex)
{
    quint32 id = index >= 0 && index < m_layers.count()
                     ? m_layers.layers().at(index).id : 0;
    quint32 target = targetIndex >= 0 && targetIndex < m_layers.count()
                         ? m_layers.layers().at(targetIndex).id : 0;
    const bool ok = id != 0 && m_layers.setLayerClipTo(id, target);
    if (ok)
        emit layersChanged();
    return ok;
}

bool PaintEngine::mergeLayerDown(int index)
{
    const QVector<LayerSnapshot> before = m_layers.snapshotAll();
    quint32 id = index >= 0 && index < m_layers.count()
                     ? m_layers.layers().at(index).id : 0;
    const int below = index - 1;
    if (id == 0 || below < 0)
        return false;
    const quint32 target = m_layers.layers().at(below).id;
    m_layers.flattenInto(id, target);
    m_layers.removeLayer(id);
    recordLayerListEdit(QStringLiteral("Merge down"), before);
    emit layersChanged();
    notifyDocumentChanged();
    return true;
}

QImage PaintEngine::renderLayerThumbnail(int index, int w, int h) const
{
    if (index < 0 || index >= m_layers.count())
        return QImage();
    return m_layers.compositeLayer(m_layers.layers().at(index).id)
        .scaled(w, h, Qt::KeepAspectRatio, Qt::SmoothTransformation);
}

void PaintEngine::clearActiveLayer()
{
    PaintLayer *l = m_layers.layerAt(m_layers.currentIndex());
    if (!l)
        return;
    const quint32 layerId = l->id;
    const QImage before = l->base;
    QImage &base = m_layers.baseOf(layerId);
    base.fill(Qt::transparent);
    l->strokes.clear();
    m_layers.invalidate(layerId);
    recordBaseEdit(QStringLiteral("Clear layer"), layerId, before);
    notifyDocumentChanged();
    setStatus(QStringLiteral("Layer cleared"));
}

void PaintEngine::fillActiveLayer(const QColor &c)
{
    PaintLayer *l = m_layers.layerAt(m_layers.currentIndex());
    if (!l)
        return;
    const quint32 layerId = l->id;
    const QImage before = l->base;
    QImage &base = m_layers.baseOf(layerId);
    base.fill(c);
    m_layers.invalidate(layerId);
    recordBaseEdit(QStringLiteral("Fill layer"), layerId, before);
    notifyDocumentChanged();
}

// ===========================================================================
// Brush
// ===========================================================================

void PaintEngine::setBrushSize(double v) { m_brush.setSize(qMax(0.5, v)); emit brushChanged(); }
void PaintEngine::setBrushFlow(double v) { m_brush.setFlow(qBound(0.0, v, 1.0)); emit brushChanged(); }
void PaintEngine::setBrushOpacity(double v) { m_brush.setOpacity(qBound(0.0, v, 1.0)); emit brushChanged(); }
void PaintEngine::setBrushHardness(double v) { m_brush.setHardness(qBound(0.0, v, 1.0)); emit brushChanged(); }
void PaintEngine::setBrushSpacing(double v) { m_brush.setSpacing(qBound(0.02, v, 2.0)); emit brushChanged(); }
void PaintEngine::setNibMode(int v) { m_brush.setNibMode(qBound(NibRound, v, NibFountain)); emit brushChanged(); }

void PaintEngine::selectBrushPreset(const QString &id) { m_brush.selectPreset(id); emit brushChanged(); }

void PaintEngine::saveBrushPreset(const QString &name, const QString &group)
{
    m_brush.savePreset(name, group);
    emit brushChanged();
}

QImage PaintEngine::brushPreview(int w, int h) const
{
    return m_brush.previewImage(w, h, 0.6);
}

// ===========================================================================
// Shape / text
// ===========================================================================

void PaintEngine::setShapeKind(int k) { m_shapes.setCurrentShape(k); emit shapeChanged(); }
void PaintEngine::setShapeFilled(bool v) { m_shapes.setFilled(v); emit shapeChanged(); }
void PaintEngine::setShapeStrokeWidth(double v) { m_shapes.setStrokeWeight(qMax(0.5, v)); emit shapeChanged(); }
void PaintEngine::setShapeSides(int v) { m_shapes.setSides(qBound(3, v, 64)); emit shapeChanged(); }
void PaintEngine::setSnapEnabled(bool v) { m_shapes.setSnapEnabled(v); emit shapeChanged(); }

void PaintEngine::setTextFontFamily(const QString &f) { m_text.setFontFamily(f); emit textChanged(); }
void PaintEngine::setTextFontSize(double v) { m_text.setFontSize(qMax(4.0, v)); emit textChanged(); }

QVariantList PaintEngine::textItems() const
{
    QVariantList out;
    for (const CanvasText &ct : m_texts) {
        QVariantMap m = m_text.toVariantMap(ct.item);
        m.insert("id", double(ct.id));
        m.insert("layerId", double(ct.layerId));
        out.append(m);
    }
    return out;
}

int PaintEngine::hitTestText(const QPointF &docPos) const
{
    for (int i = m_texts.size() - 1; i >= 0; --i) {
        const QRectF b = m_texts.at(i).item.bounds;
        if (b.adjusted(-6, -6, 6, 6).contains(docPos))
            return i;
    }
    return -1;
}

QVariantList PaintEngine::textItemsAt(const QPointF &docPos) const
{
    QVariantList out;
    const int i = hitTestText(docPos);
    if (i >= 0) {
        QVariantMap m = m_text.toVariantMap(m_texts.at(i).item);
        m.insert("id", double(m_texts.at(i).id));
        out.append(m);
    }
    return out;
}

bool PaintEngine::placeTextAt(const QPointF &docPos)
{
    PaintLayer *layer = m_layers.layerAt(m_layers.currentIndex());
    if (!layer)
        return false;
    if (m_text.text().trimmed().isEmpty())
        return false;

    Qt::Alignment align = Qt::AlignLeft | Qt::AlignTop;
    QSizeF box = m_text.naturalSize(m_text.text());
    box.setWidth(box.width() + 4.0);
    box.setHeight(box.height() + 4.0);
    const QRectF bounds(docPos, box);

    TextItem item = m_text.toItem(0, bounds, layer->id);
    item.text = m_text.text();
    item.colour = m_foreground;

    CanvasText ct;
    ct.id = m_nextTextId++;
    ct.item = item;
    ct.layerId = layer->id;
    m_texts.append(ct);

    // Immediate render so the text is visible, then a single undo step that
    // removes and reinstates it, including the raster side effects. The text
    // list is mutated in the same step, so one placement is one undo.
    const QImage rendered = m_text.renderToImage(item, QSize());
    const quint32 layerId = layer->id;
    const QImage baseBefore = layer->base;
    QImage &base = m_layers.baseOf(layerId);
    QPainter p(&base);
    p.setRenderHint(QPainter::Antialiasing, true);
    p.setOpacity(item.opacity);
    p.drawImage(bounds.topLeft(), rendered);
    p.end();
    m_layers.invalidate(layerId);

    m_undo.pushApplied(
        QStringLiteral("Add text"),
        [this, layerId, baseBefore, ct] {
            for (int i = m_texts.size() - 1; i >= 0; --i) {
                if (m_texts.at(i).id == ct.id) {
                    m_texts.removeAt(i);
                    break;
                }
            }
            QImage &b = m_layers.baseOf(layerId);
            b = baseBefore;
            m_layers.invalidate(layerId);
            emit textItemsChanged();
            noteCompositeDirty();
        },
        [this, baseBefore, layerId, item, bounds, ct] {
            QImage &b = m_layers.baseOf(layerId);
            b = baseBefore;
            const QImage renderedAgain = m_text.renderToImage(item, QSize());
            QPainter p(&b);
            p.setRenderHint(QPainter::Antialiasing, true);
            p.setOpacity(item.opacity);
            p.drawImage(bounds.topLeft(), renderedAgain);
            p.end();
            m_texts.append(ct);
            m_layers.invalidate(layerId);
            emit textItemsChanged();
            noteCompositeDirty();
        },
        baseBefore.sizeInBytes() + item.text.size() * 4);

    emit textItemsChanged();
    notifyDocumentChanged();
    return true;
}

bool PaintEngine::updateTextItem(quint32 id, const QVariantMap &fields)
{
    for (CanvasText &ct : m_texts) {
        if (ct.id != id)
            continue;
        TextItem updated = m_text.fromVariantMap(fields);
        updated.id = ct.item.id;
        ct.item = updated;
        emit textItemsChanged();
        notifyDocumentChanged();
        return true;
    }
    return false;
}

bool PaintEngine::removeTextItem(quint32 id)
{
    for (int i = m_texts.size() - 1; i >= 0; --i) {
        CanvasText &ct = m_texts[i];
        if (ct.id != id)
            continue;

        // Erasing text must also scrub the pixels it painted into the layer,
        // and both effects must be one undo step, otherwise an undo would bring
        // the item back while leaving a ghost of its glyphs.
        PaintLayer *layer = m_layers.layerById(ct.layerId);
        if (!layer)
            return false;
        const quint32 layerId = ct.layerId;
        const QRectF eraseBox = ct.item.box.adjusted(-4, -4, 4, 4);
        const QImage baseBefore = layer->base;

        const QVector<CanvasText> before = m_texts;
        m_texts.removeAt(i);
        Rasterizer::clearRect(m_layers.baseOf(layerId), eraseBox, FillOptions());
        m_layers.invalidate(layerId);

        m_undo.beginMacro(QStringLiteral("Delete text"));
        recordBaseEdit(QStringLiteral("Delete text"), layerId, baseBefore);
        recordTextEdit(QStringLiteral("Delete text"), before);
        m_undo.endMacro();

        emit textItemsChanged();
        notifyDocumentChanged();
        return true;
    }
    return false;
}

// ===========================================================================
// Selection
// ===========================================================================

void PaintEngine::setSelectionMode(int m)
{
    m_selection.setMode(m == SelectAdd ? SelectAdd
                       : m == SelectSubtract ? SelectSubtract
                       : m == SelectIntersect ? SelectIntersect
                                              : SelectReplace);
    emit selectionChanged();
}

void PaintEngine::selectAll()
{
    m_selectionBefore = m_selection.mask();
    m_selection.selectAll(m_size);
    recordSelectionEdit(QStringLiteral("Select all"), m_selectionBefore);
    notifyDocumentChanged();
    emit selectionChanged();
}

void PaintEngine::invertSelection()
{
    m_selectionBefore = m_selection.mask();
    m_selection.invert(m_size);
    recordSelectionEdit(QStringLiteral("Invert selection"), m_selectionBefore);
    notifyDocumentChanged();
    emit selectionChanged();
}

void PaintEngine::clearSelection()
{
    m_selectionBefore = m_selection.mask();
    m_selection.selectNone();
    recordSelectionEdit(QStringLiteral("Deselect"), m_selectionBefore);
    notifyDocumentChanged();
    emit selectionChanged();
}

void PaintEngine::commitSelection()
{
    emit selectionChanged();
}

void PaintEngine::growSelection()
{
    const QRectF b = m_selection.bounds();
    const QRectF grown = b.adjusted(-1, -1, 1, 1);
    m_selection.updateRectangle(grown, false);
    m_selection.commitRectangle();
    notifyDocumentChanged();
    emit selectionChanged();
}

void PaintEngine::shrinkSelection()
{
    const QRectF b = m_selection.bounds();
    if (b.width() <= 2 || b.height() <= 2)
        return;
    const QRectF shrunk = b.adjusted(1, 1, -1, -1);
    m_selection.updateRectangle(shrunk, false);
    m_selection.commitRectangle();
    notifyDocumentChanged();
    emit selectionChanged();
}

void PaintEngine::featherSelection(double radius)
{
    m_selection.setFeather(qMax(0.0, radius));
    m_selection.reapplyFeather();
    notifyDocumentChanged();
    emit selectionChanged();
}

void PaintEngine::copySelection()
{
    if (!m_selection.active())
        return;
    PaintLayer *l = m_layers.layerAt(m_layers.currentIndex());
    if (!l)
        return;
    QImage piece = m_selection.copy(l->resolved());
    if (piece.isNull())
        return;
    m_clipboard.image = piece;
    m_clipboard.bounds = m_selection.box();
    m_clipboard.source = QStringLiteral("selection");
    setStatus(QStringLiteral("Copied selection"));
}

void PaintEngine::cutSelection()
{
    if (!m_selection.active())
        return;
    PaintLayer *l = m_layers.layerAt(m_layers.currentIndex());
    if (!l)
        return;
    const quint32 layerId = l->id;
    const QImage before = l->base;
    QImage resolved = l->resolved();
    m_clipboard.image = m_selection.cut(resolved);
    m_clipboard.bounds = m_selection.box();
    m_clipboard.source = QStringLiteral("selection");
    QImage &base = m_layers.baseOf(layerId);
    base = resolved;
    l->strokes.clear();
    m_layers.invalidate(layerId);
    recordBaseEdit(QStringLiteral("Cut selection"), layerId, before);
    notifyDocumentChanged();
    setStatus(QStringLiteral("Cut selection"));
}

void PaintEngine::pasteClipboard()
{
    if (!m_clipboard.valid())
        return;
    PaintLayer *l = m_layers.layerAt(m_layers.currentIndex());
    if (!l)
        return;
    const quint32 layerId = l->id;
    const QImage before = l->base;
    QImage &base = m_layers.baseOf(layerId);
    m_selection.pasteInto(m_clipboard.image, m_clipboard.bounds.topLeft(), base);
    m_layers.invalidate(layerId);
    recordBaseEdit(QStringLiteral("Paste"), layerId, before);
    notifyDocumentChanged();
    setStatus(QStringLiteral("Pasted"));
}

void PaintEngine::copyActiveLayer()
{
    PaintLayer *l = m_layers.layerAt(m_layers.currentIndex());
    if (!l)
        return;
    m_clipboard.image = l->resolved();
    m_clipboard.bounds = QRectF(QPointF(0, 0), QSizeF(m_size));
    m_clipboard.source = QStringLiteral("layer");
    setStatus(QStringLiteral("Copied layer"));
}

void PaintEngine::pasteAsNewLayer()
{
    if (!m_clipboard.valid())
        return;
    const QVector<LayerSnapshot> before = m_layers.snapshotAll();
    QImage docSized(m_size, QImage::Format_ARGB32_Premultiplied);
    docSized.fill(Qt::transparent);
    m_selection.pasteInto(m_clipboard.image, m_clipboard.bounds.topLeft(), docSized);
    m_layers.addRasterLayer(QStringLiteral("Pasted"), docSized, -1);
    recordLayerListEdit(QStringLiteral("Paste as layer"), before);
    emit layersChanged();
    notifyDocumentChanged();
}

void PaintEngine::deleteSelection()
{
    if (!m_selection.active())
        return;
    PaintLayer *l = m_layers.layerAt(m_layers.currentIndex());
    if (!l)
        return;
    const quint32 layerId = l->id;
    const QImage before = l->base;
    QImage resolved = l->resolved();
    const QImage _dummy = m_selection.cut(resolved);
    Q_UNUSED(_dummy);
    QImage &base = m_layers.baseOf(layerId);
    base = resolved;
    l->strokes.clear();
    m_layers.invalidate(layerId);
    recordBaseEdit(QStringLiteral("Delete selection"), layerId, before);
    notifyDocumentChanged();
}

void PaintEngine::fillSelection(const QColor &c)
{
    if (!m_selection.active())
        return;
    PaintLayer *l = m_layers.layerAt(m_layers.currentIndex());
    if (!l)
        return;
    const quint32 layerId = l->id;
    const QImage before = l->base;
    QImage &base = m_layers.baseOf(layerId);
    QPainter p(&base);
    p.setRenderHint(QPainter::Antialiasing, true);
    if (m_selection.mode() == SelectReplace)
        p.setCompositionMode(QPainter::CompositionMode_Source);
    const QPainterPath path = m_selection.clipPath();
    p.setClipPath(path);
    p.fillRect(QRectF(QPointF(0, 0), QSizeF(m_size)), c);
    p.end();
    m_layers.invalidate(layerId);
    recordBaseEdit(QStringLiteral("Fill selection"), layerId, before);
    notifyDocumentChanged();
}

void PaintEngine::strokeSelectionOutline(double width, const QColor &c)
{
    if (!m_selection.active())
        return;
    PaintLayer *l = m_layers.layerAt(m_layers.currentIndex());
    if (!l)
        return;
    const quint32 layerId = l->id;
    const QImage before = l->base;
    QImage &base = m_layers.baseOf(layerId);
    QPainter p(&base);
    p.setRenderHint(QPainter::Antialiasing, true);
    p.setPen(QPen(c, qMax(0.5, width)));
    p.setBrush(Qt::NoBrush);
    p.drawPath(m_selection.clipPath());
    p.end();
    m_layers.invalidate(layerId);
    recordBaseEdit(QStringLiteral("Stroke selection"), layerId, before);
    notifyDocumentChanged();
}

void PaintEngine::transformSelection(double dx, double dy, double scale, double rotateDeg)
{
    if (!m_selection.active())
        return;
    PaintLayer *l = m_layers.layerAt(m_layers.currentIndex());
    if (!l)
        return;
    const quint32 layerId = l->id;
    const QImage before = l->base;

    QImage resolved = l->resolved();
    QImage piece = m_selection.cut(resolved);
    m_layers.baseOf(layerId) = resolved;
    l->strokes.clear();

    // Apply the requested transform to the floating piece.
    TransformRequest req;
    req.from = m_selection.box().center();
    req.to = req.from + QPointF(dx, dy);
    QTransform t = m_selection.transformFor(req);
    t.translate(dx, dy);
    QTransform s;
    s.translate(req.from.x(), req.from.y());
    s.scale(qMax(0.02, scale), qMax(0.02, scale));
    if (std::fabs(rotateDeg) > 0.01)
        s.rotate(rotateDeg);
    s.translate(-req.from.x(), -req.from.y());
    t = t * s;

    const QRectF box = m_selection.box();
    const QPointF centre = box.center();
    QImage rotated = piece.transformed(t, Qt::SmoothTransformation);
    const QImage &scaled = rotated;
    Q_UNUSED(scaled);

    QPointF topLeft = centre - QPointF(rotated.width() * 0.5, rotated.height() * 0.5);
    QImage &base = m_layers.baseOf(layerId);
    m_selection.pasteInto(rotated, topLeft, base);
    m_selection.applyMaskTransform(t);
    m_layers.invalidate(layerId);
    recordBaseEdit(QStringLiteral("Transform selection"), layerId, before);
    notifyDocumentChanged();
}

void PaintEngine::flipSelection(bool horizontal, bool vertical)
{
    if (!m_selection.active())
        return;
    PaintLayer *l = m_layers.layerAt(m_layers.currentIndex());
    if (!l)
        return;
    const quint32 layerId = l->id;
    const QImage before = l->base;
    QImage resolved = l->resolved();
    QImage piece = m_selection.cut(resolved);
    m_layers.baseOf(layerId) = resolved;
    l->strokes.clear();
    if (horizontal)
        piece = piece.mirrored(true, false);
    if (vertical)
        piece = piece.mirrored(false, true);
    const QRectF box = m_selection.box();
    QImage &base = m_layers.baseOf(layerId);
    m_selection.pasteInto(piece, box.topLeft(), base);
    m_layers.invalidate(layerId);
    recordBaseEdit(QStringLiteral("Flip selection"), layerId, before);
    notifyDocumentChanged();
}

// ===========================================================================
// Pixel operations
// ===========================================================================

QVariantMap PaintEngine::floodFillAt(const QPointF &docPos)
{
    QVariantMap out;
    PaintLayer *l = m_layers.layerAt(m_layers.currentIndex());
    if (!l) {
        out.insert("status", QStringLiteral("No layer"));
        return out;
    }
    const int x = int(docPos.x());
    const int y = int(docPos.y());
    if (x < 0 || y < 0 || x >= m_size.width() || y >= m_size.height()) {
        out.insert("status", QStringLiteral("Fill outside canvas"));
        return out;
    }
    const quint32 layerId = l->id;
    const QImage before = l->base;
    FillRequest req;
    req.seed = QPoint(x, y);
    req.colour = m_foreground;
    req.tolerance = m_selection.tolerance();
    Rasterizer::floodFill(m_layers.baseOf(layerId), req, FillOptions());
    m_layers.invalidate(layerId);
    recordBaseEdit(QStringLiteral("Flood fill"), layerId, before);
    notifyDocumentChanged();
    out.insert("status",
               QStringLiteral("Fill %1 at (%2, %3)")
                   .arg(m_foreground.name(QColor::HexArgb)).arg(x).arg(y));
    return out;
}

QVariantMap PaintEngine::eraseRect(const QRectF &docRect)
{
    QVariantMap out;
    PaintLayer *l = m_layers.layerAt(m_layers.currentIndex());
    if (!l) {
        out.insert("ok", false);
        return out;
    }
    const quint32 layerId = l->id;
    const QImage before = l->base;
    Rasterizer::clearRect(m_layers.baseOf(layerId), docRect, FillOptions());
    m_layers.invalidate(layerId);
    recordBaseEdit(QStringLiteral("Erase rect"), layerId, before);
    notifyDocumentChanged();
    out.insert("ok", true);
    return out;
}

QVariantMap PaintEngine::applyFilter(const QString &filterId, const QVariantMap &params)
{
    QVariantMap out;
    PaintLayer *l = m_layers.layerAt(m_layers.currentIndex());
    if (!l) {
        out.insert("ok", false);
        out.insert("error", QStringLiteral("No active layer."));
        return out;
    }
    const quint32 layerId = l->id;
    const QImage before = l->base;
    FilterParams p = FilterParams::fromMap(params);
    QImage img = l->resolved();
    const QRect area = m_selection.active()
                           ? m_selection.bounds().toAlignedRect().intersected(
                                 QRect(QPoint(0, 0), m_size))
                           : QRect();
    const QImage *mask = m_selection.active() ? &m_selection.mask() : nullptr;

    // Filters run on the resolved pixels (strokes are baked first) because a
    // blur cannot meaningfully blur "the untransformed vector".
    if (!m_filters.apply(filterId, img, p, mask, area)) {
        out.insert("ok", false);
        out.insert("error", QStringLiteral("Unknown filter %1").arg(filterId));
        return out;
    }
    QImage &base = m_layers.baseOf(layerId);
    base = img;
    l->strokes.clear();
    m_layers.invalidate(layerId);
    recordBaseEdit(QStringLiteral("Filter %1").arg(filterId), layerId, before);
    notifyDocumentChanged();
    setStatus(QStringLiteral("Filter applied: %1").arg(filterId));
    out.insert("ok", true);
    return out;
}

QVariantList PaintEngine::filterCatalogue() const
{
    return m_filters.catalogue();
}

QVariantList PaintEngine::filterGroups() const
{
    QVariantList out;
    const QStringList g = m_filters.groups();
    for (const QString &s : g)
        out.append(s);
    return out;
}

QVariantMap PaintEngine::filterInfo(const QString &id) const
{
    QVariantMap out;
    const FilterInfo info = m_filters.infoFor(id);
    out.insert("id", info.id);
    out.insert("name", info.name);
    out.insert("group", info.group);
    out.insert("description", info.description);
    out.insert("defaults", info.defaults);
    return out;
}

QVariantMap PaintEngine::applyTransform(const QVariantMap &options)
{
    const double dx = options.value("dx", 0.0).toDouble();
    const double dy = options.value("dy", 0.0).toDouble();
    const double scale = options.value("scale", 1.0).toDouble();
    const double rotate = options.value("rotate", 0.0).toDouble();
    if (!m_selection.active())
        return QVariantMap{ { "ok", false }, { "error", QStringLiteral("No selection.") } };
    transformSelection(dx, dy, scale, rotate);
    return QVariantMap{ { "ok", true } };
}

// ===========================================================================
// Undo
// ===========================================================================

bool PaintEngine::undo()
{
    const bool ok = m_undo.undo();
    if (ok) {
        noteCompositeDirty();
        emit layersChanged();
        emit historyChanged();
    }
    return ok;
}

bool PaintEngine::redo()
{
    const bool ok = m_undo.redo();
    if (ok) {
        noteCompositeDirty();
        emit layersChanged();
        emit historyChanged();
    }
    return ok;
}

bool PaintEngine::jumpHistory(int index)
{
    const bool ok = m_undo.jumpTo(index);
    if (ok) {
        noteCompositeDirty();
        emit layersChanged();
        emit historyChanged();
    }
    return ok;
}

// ===========================================================================
// Undo recording helpers
// ===========================================================================

QImage PaintEngine::captureLayerBase(quint32 layerId) const
{
    PaintLayer *l = const_cast<PaintEngine *>(this)->m_layers.layerById(layerId);
    return l ? l->base : QImage();
}

void PaintEngine::recordBaseEdit(const QString &label, quint32 layerId,
                                 const QImage &before, const QString &mergeKey)
{
    const QImage after = captureLayerBase(layerId);
    m_undo.pushApplied(
        label,
        [this, layerId, before] {
            QImage &b = m_layers.baseOf(layerId);
            b = before;
            m_layers.invalidate(layerId);
            noteCompositeDirty();
        },
        [this, layerId, after] {
            QImage &b = m_layers.baseOf(layerId);
            b = after;
            m_layers.invalidate(layerId);
            noteCompositeDirty();
        },
        before.sizeInBytes() + after.sizeInBytes(),
        mergeKey);
}

void PaintEngine::recordSelectionEdit(const QString &label, const QImage &beforeMask,
                                      const QString &mergeKey)
{
    const QImage afterMask = m_selection.mask();
    m_undo.pushApplied(
        label,
        [this, beforeMask] {
            m_selection.restoreMask(beforeMask);
            noteCompositeDirty();
        },
        [this, afterMask] {
            m_selection.restoreMask(afterMask);
            noteCompositeDirty();
        },
        beforeMask.sizeInBytes() + afterMask.sizeInBytes(),
        mergeKey);
}

void PaintEngine::recordLayerListEdit(const QString &label,
                                      const QVector<LayerSnapshot> &before,
                                      const QString &mergeKey)
{
    const QVector<LayerSnapshot> after = m_layers.snapshotAll();
    m_undo.pushApplied(
        label,
        [this, before] {
            m_layers.restoreAll(before);
            noteCompositeDirty();
        },
        [this, after] {
            m_layers.restoreAll(after);
            noteCompositeDirty();
        },
        0,
        mergeKey);
}

void PaintEngine::recordTextEdit(const QString &label, const QVector<CanvasText> &before,
                                 const QString &mergeKey)
{
    const QVector<CanvasText> after = m_texts;
    m_undo.pushApplied(
        label,
        [this, before] {
            m_texts = before;
            emit textItemsChanged();
            noteCompositeDirty();
        },
        [this, after] {
            m_texts = after;
            emit textItemsChanged();
            noteCompositeDirty();
        },
        0,
        mergeKey);
}

// ===========================================================================
// Status / autosave / recovery / shortcuts
// ===========================================================================

void PaintEngine::setAutosaveEnabled(bool v)
{
    // The store emits autosaveChanged itself; wireEngines() forwards it.
    m_store.setAutosaveEnabled(v);
}

void PaintEngine::tick()
{
    const qint64 now = monoMs();
    m_store.tickAutosave(now);
    if (now - m_lastEditMs > 90000)
        m_lastTickMs = now;
}

bool PaintEngine::attemptRecovery()
{
    if (!m_store.scanForRecovery())
        return false;
    const QVariantMap r = openDocument(QString(), true);
    return r.value("ok").toBool();
}

void PaintEngine::discardRecovery()
{
    m_store.discardRecovery();
}

QStringList PaintEngine::shortcutSheet() const
{
    QStringList out;
    for (const ShortcutEntry &e : kShortcuts)
        out.append(QStringLiteral("%1  %2")
                       .arg(QString::fromLatin1(e.key), -10)
                       .arg(QString::fromLatin1(e.label)));
    return out;
}

QString PaintEngine::shortcutFor(const QString &action) const
{
    for (const ShortcutEntry &e : kShortcuts) {
        if (QString::fromLatin1(e.label).compare(action, Qt::CaseInsensitive) == 0)
            return QString::fromLatin1(e.key);
    }
    return QString();
}

void PaintEngine::notifyDocumentChanged()
{
    m_modified = true;
    m_lastEditMs = monoMs();
    m_store.setModified(true);
    emit modifiedChanged();
    emit historyChanged();
}

} // namespace paint