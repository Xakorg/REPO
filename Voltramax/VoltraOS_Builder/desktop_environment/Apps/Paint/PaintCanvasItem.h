#ifndef PAINT_CANVAS_ITEM_H
#define PAINT_CANVAS_ITEM_H

// =============================================================================
//  VOLTRA PAINT - PaintCanvasItem
// =============================================================================
//  A QQuickPaintedItem that is the single place where tablet, mouse, touch and
//  wheel input enter the application, and the single place where the composited
//  document is turned into pixels on screen.
//
//  Why a QQuickPaintedItem and not a scene-graph node tree:
//
//    * The document is one big premultiplied ARGB image and every edit is a
//      region-limited raster operation. Uploading that image once per frame is
//      exactly what QQuickPaintedItem::update() does with its texture cache;
//      splitting it into thousands of QSG nodes would add bookkeeping with no
//      rendering benefit, because the blend already happened in C++.
//
//    * We need per-event fidelity from the platform: QTabletEvent pressure,
//      tilt, rotation and the eraser bit. QQuickItem's default event routing in
//      Qt 6 sends MouseEvents for the mouse and TouchEvents for touch, and
//      QTabletEvent only if the item opts in by overriding event(). Doing that
//      on a QQuickItem subclass is the supported path, and it keeps the whole
//      input path in C++ instead of splitting it across QML handlers.
//
//    * Overlays (grid, guides, symmetry axes, marching ants, shape preview,
//      snap crosshair, cursor ring) are cheap vector strokes. They are drawn in
//      paint() on top of the composited image, in the same painter, so they can
//      never lag the artwork by a frame and they never touch the document
//      pixels - the user sees rules, not damage.
//
//  What this item deliberately does NOT do:
//
//    * It does not own the document. Every pointer/tablet event is converted to
//      a paint::RawSample and handed to PaintEngine::handlePointer(), which
//      owns the tool state machine. The item has no opinion about tools.
//
//    * It does not decide the view transform. PaintEngine does, and exposes it
//      through viewTransform() so the rulers, the layer thumbnails and this item
//      all agree to the pixel. Two transforms computed in two places is how
//      cursors end up systematically half a pixel off.
// =============================================================================

#include <QColor>
#include <QPointF>
#include <QQuickPaintedItem>
#include <QRectF>
#include <QSize>

#include "PaintTypes.h"

QT_BEGIN_NAMESPACE
class QTabletEvent;
class QMouseEvent;
class QWheelEvent;
class QHoverEvent;
class QKeyEvent;
QT_END_NAMESPACE

namespace paint {

class PaintEngine;
struct RawSample;
struct Stroke;

// ---------------------------------------------------------------------------
// Hit zones for the transform handles drawn over an active selection.
//
// The order matters: hitTest() walks the list from the front, so the small
// rotate handle must be tested before the large move box it sits inside, or it
// would be impossible to grab.
// ---------------------------------------------------------------------------
enum CanvasHitZone {
    ZoneNone = 0,
    ZoneCanvas,
    ZoneOutside,
    ZoneSelectionHandle,
    ZoneGuideVertical,
    ZoneGuideHorizontal,
    ZoneRulerHorizontal,
    ZoneRulerVertical
};

// ---------------------------------------------------------------------------
// A resolved pointer event, in the form the canvas needs to reason about the
// view before it hands anything to the engine.
// ---------------------------------------------------------------------------
struct CanvasPointer {
    QPointF itemPos;          // item-local pixels (what the OS reported)
    QPointF docPos;           // document pixels (after the inverse view)
    double pressure = 0.0;
    double tiltAltitude = 90.0;
    double tiltAzimuth = 0.0;
    double twist = 0.0;
    int pointerKind = PointerUnknown;
    bool eraser = false;
    bool barrel = false;
    Qt::KeyboardModifiers modifiers;
    bool insideCanvas = false;
};

class PaintCanvasItem : public QQuickPaintedItem
{
    Q_OBJECT

    // The engine is set once, immediately after construction, by
    // PaintEngine::createCanvasItem(). It is a raw pointer because QML owns the
    // item's lifetime while the engine outlives it; the engine clears the
    // pointer in its destructor so a late repaint cannot dereference it.
    Q_PROPERTY(QObject *engine READ engineObject WRITE setEngineObject NOTIFY engineChanged)
    Q_PROPERTY(bool showGrid READ showGrid WRITE setShowGrid NOTIFY overlaysChanged)
    Q_PROPERTY(bool showGuides READ showGuides WRITE setShowGuides NOTIFY overlaysChanged)
    Q_PROPERTY(bool showSymmetry READ showSymmetry WRITE setShowSymmetry
                   NOTIFY overlaysChanged)
    Q_PROPERTY(bool showCursorRing READ showCursorRing WRITE setShowCursorRing
                   NOTIFY overlaysChanged)
    Q_PROPERTY(bool showTransparency READ showTransparency WRITE setShowTransparency
                   NOTIFY overlaysChanged)
    Q_PROPERTY(bool smoothing READ smoothing WRITE setSmoothing NOTIFY renderHintsChanged)
    Q_PROPERTY(int cursorZone READ cursorZone NOTIFY cursorZoneChanged)
    Q_PROPERTY(QSize documentPixelSize READ documentPixelSize NOTIFY engineChanged)

public:
    explicit PaintCanvasItem(QQuickItem *parent = nullptr);
    ~PaintCanvasItem() override;

    // ---- engine ---------------------------------------------------------------
    QObject *engineObject() const;
    void setEngineObject(QObject *o);
    void setEngine(PaintEngine *e);
    PaintEngine *engine() const { return m_engine; }

    // ---- overlay toggles ---------------------------------------------------------
    bool showGrid() const { return m_showGrid; }
    void setShowGrid(bool v);
    bool showGuides() const { return m_showGuides; }
    void setShowGuides(bool v);
    bool showSymmetry() const { return m_showSymmetry; }
    void setShowSymmetry(bool v);
    bool showCursorRing() const { return m_showCursorRing; }
    void setShowCursorRing(bool v);
    bool showTransparency() const { return m_showTransparency; }
    void setShowTransparency(bool v);
    bool smoothing() const { return m_smoothing; }
    void setSmoothing(bool v);
    int cursorZone() const { return m_cursorZone; }
    QSize documentPixelSize() const;

    // Called by the engine when the composite or the overlays changed. It does
    // not take a rect because the engine knows better than we do which region
    // changed; asking for a full repaint is honest and simple, and the textured
    // item means Qt still only uploads the changed rows.
    Q_INVOKABLE void requestRepaint();

    // Converts a Qt tablet/mouse event into the neutral structure the rest of
    // the app speaks. Public so the rulers and the HUD can reuse it.
    CanvasPointer resolvePointer(const QPointF &itemPos, int kind, double pressure,
                                 double tiltX, double tiltY, double rotation,
                                 bool eraser, Qt::KeyboardModifiers mods) const;

    // Maps item-local coordinates onto the document and reports whether the
    // point is inside the page.
    QPointF itemToDoc(const QPointF &itemPos, bool *inside = nullptr) const;

    // Which overlay element, if any, is under this point.
    int hitTest(const QPointF &itemPos) const;

signals:
    void engineChanged();
    void overlaysChanged();
    void renderHintsChanged();
    void cursorZoneChanged();

protected:
    // ---- painting -------------------------------------------------------------
    void paint(QPainter *painter) override;
    void geometryChange(const QRectF &newGeometry, const QRectF &oldGeometry) override;

    // ---- input --------------------------------------------------------------------
    void mousePressEvent(QMouseEvent *event) override;
    void mouseMoveEvent(QMouseEvent *event) override;
    void mouseReleaseEvent(QMouseEvent *event) override;
    void mouseDoubleClickEvent(QMouseEvent *event) override;
    void hoverMoveEvent(QHoverEvent *event) override;
    void hoverLeaveEvent(QHoverEvent *event) override;
    void wheelEvent(QWheelEvent *event) override;
    void keyPressEvent(QKeyEvent *event) override;
    void keyReleaseEvent(QKeyEvent *event) override;
    bool event(QEvent *e) override;

private:
    // ---- overlay painters ---------------------------------------------------------
    void paintTransparency(QPainter *p, const QRectF &deviceRect) const;
    void paintDocument(QPainter *p) const;
    void paintGrid(QPainter *p) const;
    void paintGuides(QPainter *p) const;
    void paintSymmetry(QPainter *p) const;
    void paintSelection(QPainter *p) const;
    void paintShapePreview(QPainter *p) const;
    void paintSnapHint(QPainter *p) const;
    void paintCursorRing(QPainter *p) const;
    void paintBoundary(QPainter *p) const;

    // ---- event plumbing -------------------------------------------------------------
    bool dispatchTablet(QTabletEvent *event);
    bool dispatchMouse(QMouseEvent *event, int phase);
    void dispatchHover(const QPointF &itemPos, Qt::KeyboardModifiers mods);
    void updateCursorZone(const QPointF &itemPos);
    void noteKeyState(int key, bool pressed);

    PaintEngine *m_engine = nullptr;

    bool m_showGrid = false;
    bool m_showGuides = true;
    bool m_showSymmetry = true;
    bool m_showCursorRing = true;
    bool m_showTransparency = true;
    bool m_smoothing = true;

    int m_cursorZone = ZoneNone;
    QPointF m_cursorItem;
    bool m_cursorInside = false;
    bool m_cursorVisible = false;

    // Modifier keys the canvas tracks itself so a tablet event (which carries
    // no key state for space) can still pan. Qt delivers key events to the item
    // with focus, which we request in mousePressEvent.
    bool m_spaceDown = false;
    bool m_altDown = false;
    bool m_shiftDown = false;
    bool m_ctrlDown = false;

    // A double-click on a text item is the documented way to re-enter editing;
    // the item remembers the last click so it can report the second one.
    qint64 m_lastClickMs = 0;
    QPointF m_lastClickPos;
};

// =============================================================================
//  INPUT CONTRACT (what the item promises the engine)
// =============================================================================
//  Every pointer source is normalised into paint::RawSample and delivered to
//  PaintEngine::handlePointer(phase, sample). The phases are:
//
//      0  press     the logical start of a gesture
//      1  move      a sample during a gesture (including coalesced samples)
//      2  release   the logical end of a gesture
//      3  hover     movement with no button down
//
//  Sources and how they are mapped:
//
//    * Mouse left button      -> PointerMouse, synthetic pressure 1.0 when the
//                                user has no tablet attached, 0.0 otherwise so
//                                the InputEngine can tell "real pen" from
//                                "mouse pretending to be a pen".
//    * Mouse middle / space   -> pan gesture, never a stroke.
//    * Pen tip (QTabletEvent) -> PointerPen with real pressure, tilt and twist
//                                straight from the driver.
//    * Pen eraser end         -> PointerEraser, sample.eraser = true. The
//                                engine decides whether that means "erase" or
//                                "sample a colour" based on the eraser action.
//    * Pen barrel button      -> passed as sample.buttons with the barrel bit,
//                                so the InputEngine's barrel action (eraser,
//                                eyedropper, pan, alternate tool) applies.
//    * Touch                  -> PointerTouch. Kept for navigation only; a
//                                resting palm is filtered out in InputEngine
//                                by contact area and by the pen proximity
//                                window, never here, so the rejection reason
//                                stays inspectable in the UI.
//
//  The item never interprets the tool. It is legal for the same gesture to
//  start as a brush stroke and end as a pan if the barrel state changed mid
//  stroke; the engine owns that state machine and the item merely forwards.
//
// =============================================================================
//  OVERLAY Z-ORDER (bottom to top)
// =============================================================================
//   1. transparency checkerboard, clipped to the page rect
//   2. the composited document image, drawn with a smooth or nearest filter
//      depending on the current zoom and the `smoothing` property
//   3. the page boundary hairline and its drop shadow
//   4. the grid
//   5. guides
//   6. symmetry axes and mirror markers
//   7. the shape preview being dragged
//   8. marching ants around the selection
//   9. the snap crosshair / alignment hint
//  10. the brush cursor ring
//
//  Overlays after step 3 are drawn in item space, not document space, because
//  their stroke widths are measured in device pixels and must not scale with
//  the zoom. Their *positions* come from the document transform, so they stay
//  glued to the artwork.
//
// =============================================================================
//  COORDINATE PIPELINE
// =============================================================================
//      OS event            item-local QPointF (Qt reports this already scaled)
//        |                 |
//        |                 +-- PaintEngine::itemToDocument()
//        |                        |
//        |                        +-- document pixels (integers matter: the
//        |                            rasteriser works on a pixel grid, and a
//        |                            half-pixel error shows up as a soft edge)
//        |
//        +-- QQuickPaintedItem::paint() receives a painter already in item
//            space; paintDocument() applies the same view transform so the two
//            directions can never disagree.
//
//  The view transform is:
//
//      scale(zoom) * flip(±1) * rotate(rotationDegrees) * translate(-pan)
//
//  applied about the page origin (0,0). Flip and rotation are applied before
//  the pan so that panning a rotated canvas still moves it in screen
//  directions, which is what a person expects when they drag with two fingers
//  or the pen held down.
//
// =============================================================================

} // namespace paint

Q_DECLARE_METATYPE(paint::CanvasHitZone)

#endif // PAINT_CANVAS_ITEM_H
