#ifndef PAINT_SELECTION_ENGINE_H
#define PAINT_SELECTION_ENGINE_H

// =============================================================================
//  VOLTRA PAINT - SelectionEngine
// =============================================================================
//  Real selections: a mask raster, not a decorative dotted rectangle.
//
//   - Rectangle: four corners, live during the drag.
//   - Lasso: freehand polyline closed on release, filled with the non-zero
//     winding rule (so loops work like every other raster app).
//   - Magic wand: connectivity over the composited pixels with a real
//     tolerance metric, and an optional contiguous / global mode.
//
//  The mask is what every other subsystem consults: painting is clipped to it,
//  filters apply inside it, cut/copy/paste read it, and the transform handles
//  move only what is inside it.
//
//  Marching ants are drawn as a real animated dash pattern with an animated
//  offset; `setAntsPhase()` advances it, the canvas calls that from its timer.
// =============================================================================

#include "PaintTypes.h"
#include "Rasterizer.h"
#include "StrokeModel.h"

#include <QImage>
#include <QObject>
#include <QPainterPath>
#include <QPolygonF>
#include <QTimer>
#include <QVariantList>

namespace paint {

// ---------------------------------------------------------------------------
// Selection modes.
// ---------------------------------------------------------------------------
enum SelectionMode {
    SelectReplace = 0,
    SelectAdd,
    SelectSubtract,
    SelectIntersect
};

// ---------------------------------------------------------------------------
// Handle roles for the transform box.
// ---------------------------------------------------------------------------
enum TransformHandle {
    HandleNone = 0,
    HandleTopLeft, HandleTop, HandleTopRight,
    HandleRight, HandleRightBottom,
    HandleBottom, HandleBottomLeft, HandleLeft,
    HandleRotate, HandleMove, HandleSkew
};

// ---------------------------------------------------------------------------
// Transform request from the UI.
// ---------------------------------------------------------------------------
struct TransformRequest {
    int handle = HandleNone;
    QPointF from;
    QPointF to;
    bool keepAspect = false;
    bool fromCentre = false;
    bool snap45 = false;
    bool constrainAxis = false;
};

// ---------------------------------------------------------------------------
// Live selection state.
// ---------------------------------------------------------------------------
struct SelectionState {
    bool active = false;
    bool marching = false;
    double antsOffset = 0.0;
    double antsDash = 6.0;
    double antsGap = 6.0;
    QRectF bounds;
    SelectionMode mode = SelectReplace;
    QString kind;    // "rect", "lasso", "wand", "transform"
    int pixelCount = 0;
    double fillRatio = 0.0;
};

class SelectionEngine : public QObject
{
    Q_OBJECT

    Q_PROPERTY(bool active READ active NOTIFY changed)
    Q_PROPERTY(bool empty READ isEmpty NOTIFY changed)
    Q_PROPERTY(QRectF bounds READ bounds NOTIFY changed)
    Q_PROPERTY(QVariantList ants READ ants NOTIFY antsChanged)
    Q_PROPERTY(double antsOffset READ antsOffset NOTIFY antsChanged)
    Q_PROPERTY(bool marching READ marching WRITE setMarching NOTIFY marchingChanged)
    Q_PROPERTY(int mode READ mode WRITE setMode NOTIFY changed)
    Q_PROPERTY(QString kind READ kind NOTIFY changed)
    Q_PROPERTY(int pixelCount READ pixelCount NOTIFY changed)
    Q_PROPERTY(double fillRatio READ fillRatio NOTIFY changed)
    Q_PROPERTY(QVariantList handles READ handles NOTIFY changed)
    Q_PROPERTY(double feather READ feather WRITE setFeather NOTIFY changed)
    Q_PROPERTY(int tolerance READ tolerance WRITE setTolerance NOTIFY wandChanged)
    Q_PROPERTY(bool contiguous READ contiguous WRITE setContiguous NOTIFY wandChanged)
    Q_PROPERTY(bool antialias READ antialias WRITE setAntialias NOTIFY wandChanged)

public:
    explicit SelectionEngine(QObject *parent = nullptr);
    ~SelectionEngine() override;

    // ---- state --------------------------------------------------------------
    bool active() const { return m_state.active; }
    bool isEmpty() const { return m_mask.isNull(); }
    QRectF bounds() const { return m_state.bounds; }
    QString kind() const { return m_state.kind; }
    SelectionMode mode() const { return m_state.mode; }
    void setMode(int mode);
    int pixelCount() const { return m_state.pixelCount; }
    double fillRatio() const { return m_state.fillRatio; }
    double antsOffset() const { return m_state.antsOffset; }
    bool marching() const { return m_state.marching; }
    void setMarching(bool v);
    double feather() const { return m_feather; }
    void setFeather(double v);
    int tolerance() const { return m_tolerance; }
    void setTolerance(int v);
    bool contiguous() const { return m_contiguous; }
    void setContiguous(bool v);
    bool antialias() const { return m_antialias; }
    void setAntialias(bool v);
    SelectionState state() const { return m_state; }

    // The mask: 8-bit alpha, document sized, 255 = fully selected.
    const QImage &mask() const { return m_mask; }
    // A paintable clip path derived from the mask (for QPainter use).
    QPainterPath clipPath() const;

    // ---- construction ----------------------------------------------------------
    void beginRectangle(const QPointF &start);
    void updateRectangle(const QPointF &current, bool constrainSquare = false);
    void updateRectangle(const QRectF &rect, bool additive);
    void commitRectangle();

    void beginLasso(const QPointF &start);
    void addLassoPoint(const QPointF &p, double minDistance = 1.0);
    void updateLasso(const QPointF &p);
    void commitLasso(bool closed);

    // Applies the wand to the supplied raster (usually the flattened document).
    void wandSelect(const QImage &source, const QPointF &seed, bool additive);
    void selectAll(const QSize &size);
    void invert(const QSize &size);
    void selectNone();

    // Feathering is applied lazily on commit; this re-runs it after a change.
    void reapplyFeather();

    // ---- transforms ------------------------------------------------------------
    QVariantList handles() const;
    // Computes the affine transform implied by a handle drag.
    QTransform transformFor(const TransformRequest &req) const;
    // Applies a transform to the selection mask itself (moves the ants).
    void applyMaskTransform(const QTransform &m);
    // Geometry of the box the handles sit on.
    QRectF box() const;

    // ---- marching ants ---------------------------------------------------------
    Q_INVOKABLE void tickAnts(double dtMs);
    Q_INVOKABLE QVariantList antsSegments() const;
    // The ant path in document space, for drawing an overlay.
    QPolygonF antOutline() const;

    // ---- clipboard --------------------------------------------------------------
    // Extracts the masked pixels from `source`. Returns an ARGB32_Premultiplied
    // image sized to bounds(), with transparency outside the selection.
    QImage cut(QImage &source);
    QImage copy(const QImage &source) const;
    // Pastes `content` at `topLeft` (or centred when topLeft is null).
    bool paste(const QImage &content, const QPointF &topLeft, QImage &destination,
               bool asFloating = false);
    // Stamps the clipboard back into the selection region.
    bool pasteInto(const QImage &content, const QPointF &topLeft, QImage &destination);

    // ---- document helpers ---------------------------------------------------------
    // Region that painting should be restricted to.
    QRectF paintRegion() const;
    // Multiplies an alpha value by the selection coverage.
    double coverageAt(const QPointF &docPos) const;
    // Restricts a QImage to the selection (used by filters).
    void constrainImage(QImage &img) const;
    // Persistence: reinstates a serialised mask and recomputes every derived
    // metric (bounds, pixel count, fill ratio) so the raster and the state can
    // never disagree after a load. An empty mask clears the selection.
    void restoreMask(const QImage &mask);

signals:
    void changed();
    void antsChanged();
    void marchingChanged();
    void wandChanged();
    void selectionCommitted();
    void selectionCleared();

private:
    void rebuildMetrics();
    void finishFromPath(const QPainterPath &path, const QSize &size, bool additive);
    void applyMode(QImage &incoming, const QSize &size);
    static QImage rasterisePath(const QPainterPath &path, const QSize &size, bool antialias);

    QImage m_mask;
    QPainterPath m_path;
    SelectionState m_state;
    double m_feather = 0.0;
    int m_tolerance = 32;
    bool m_contiguous = true;
    bool m_antialias = true;

    QPointF m_anchor;
    QPointF m_cursor;
    QPolygonF m_lasso;
    bool m_dragging = false;
    int m_dragMode = 0;   // 0 rect, 1 lasso

    QTimer m_timer;
};

} // namespace paint

Q_DECLARE_METATYPE(paint::SelectionState)

#endif // PAINT_SELECTION_ENGINE_H
