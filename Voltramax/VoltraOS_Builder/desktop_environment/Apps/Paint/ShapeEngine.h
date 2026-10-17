#ifndef PAINT_SHAPE_ENGINE_H
#define PAINT_SHAPE_ENGINE_H

// =============================================================================
//  VOLTRA PAINT - ShapeEngine
// =============================================================================
//  Real geometry, not "a line between two points and hope".
//
//  Every shape produces an explicit point list (line, polyline, polygon, star,
//  arrow, rectangle, ellipse) so that:
//    - snapping can act on the raw vertices before they are rendered,
//    - editing handles have real anchor points to grab,
//    - the resulting outline can go through StrokeModel's join/cap code,
//    - export to the document format is trivial and lossless.
//
//  Snapping resolves in order: guides -> grid -> other geometry (endpoints,
//  midpoints, centres, quadrants) -> freehand. A shape can request any
//  combination and reports back what it snapped to so the UI can show a hint.
// =============================================================================

#include "PaintTypes.h"
#include "Rasterizer.h"
#include "StrokeModel.h"

#include <QColor>
#include <QObject>
#include <QPainterPath>
#include <QVariantList>
#include <QVector>

namespace paint {

// ---------------------------------------------------------------------------
// Shape kinds.
// ---------------------------------------------------------------------------
enum ShapeKind {
    ShapeLine = 0,
    ShapeRectangle,
    ShapeEllipse,
    ShapePolygon,
    ShapePolyline,
    ShapeStar,
    ShapeArrow
};

// ---------------------------------------------------------------------------
// Snap configuration.
// ---------------------------------------------------------------------------
struct SnapConfig {
    bool enabled = true;
    bool toGrid = true;
    bool toGuides = true;
    bool toGeometry = true;
    bool toCanvasEdge = true;
    bool toPerspective = false;
    double gridSize = 32.0;
    double snapRadiusPx = 12.0;   // in item pixels at the current zoom
    bool shiftConstrain = false;  // 45 degree lock
    bool altDisabled = false;     // hold Alt to suspend
};

// ---------------------------------------------------------------------------
// A single snap result, for the on-canvas hint.
// ---------------------------------------------------------------------------
struct SnapResult {
    QPointF applied;
    bool snapped = false;
    QString kind;      // "guide", "grid", "endpoint", "midpoint", "centre",
                       // "quadrant", "canvas", "angle"
    QPointF anchor;    // where the snap came from (so the UI can draw a cross)

    QPointF resolve(QPointF raw) const { return snapped ? applied : raw; }
};

// ---------------------------------------------------------------------------
// Editing handle.
// ---------------------------------------------------------------------------
struct ShapeHandle {
    QPointF pos;
    int index = 0;
    QString role;      // "vertex", "rotate", "scaleX", "scaleY", "centre", "angle"
    double rotationDeg = 0.0;
    bool visible = true;
    bool locked = false;
};

// ---------------------------------------------------------------------------
// A shape in the document.
// ---------------------------------------------------------------------------
struct Shape {
    quint32 id = 0;
    ShapeKind kind = ShapeLine;
    QVector<QPointF> points;     // anchor vertices in document space
    StrokeStyle style;           // stroke appearance
    bool filled = false;
    bool closed = false;
    double strokeWidth = 4.0;
    int sides = 6;               // polygon / star
    double innerRatio = 0.45;    // star
    double arrowHeadLength = 28.0;
    double arrowHeadWidth = 0.42; // radians
    double rotation = 0.0;
    QRectF bounds() const;
    QByteArray serialise() const;
    static bool deserialise(const QByteArray &data, Shape *out, QString *error = nullptr);
    static constexpr quint32 kMagic = 0x56505348u; // "VPSH"
};

class ShapeEngine : public QObject
{
    Q_OBJECT

    Q_PROPERTY(int currentShape READ currentShape WRITE setCurrentShape NOTIFY currentShapeChanged)
    Q_PROPERTY(int strokeWeight READ strokeWeight WRITE setStrokeWeight NOTIFY strokeWeightChanged)
    Q_PROPERTY(bool filled READ filled WRITE setFilled NOTIFY strokeWeightChanged)
    Q_PROPERTY(bool snapEnabled READ snapEnabled WRITE setSnapEnabled NOTIFY snapChanged)
    Q_PROPERTY(bool snapToGrid READ snapToGrid WRITE setSnapToGrid NOTIFY snapChanged)
    Q_PROPERTY(bool snapToGuides READ snapToGuides WRITE setSnapToGuides NOTIFY snapChanged)
    Q_PROPERTY(bool snapToGeometry READ snapToGeometry WRITE setSnapToGeometry NOTIFY snapChanged)
    Q_PROPERTY(double gridSize READ gridSize WRITE setGridSize NOTIFY snapChanged)
    Q_PROPERTY(double snapRadius READ snapRadius WRITE setSnapRadius NOTIFY snapChanged)
    Q_PROPERTY(int sides READ sides WRITE setSides NOTIFY shapeParamsChanged)
    Q_PROPERTY(double innerRatio READ innerRatio WRITE setInnerRatio NOTIFY shapeParamsChanged)
    Q_PROPERTY(double arrowHeadLength READ arrowHeadLength WRITE setArrowHeadLength NOTIFY shapeParamsChanged)
    Q_PROPERTY(double arrowHeadWidth READ arrowHeadWidth WRITE setArrowHeadWidth NOTIFY shapeParamsChanged)
    Q_PROPERTY(QString lastSnap READ lastSnap NOTIFY snapApplied)

public:
    explicit ShapeEngine(QObject *parent = nullptr);
    ~ShapeEngine() override;

    // ---- configuration ----------------------------------------------------
    int currentShape() const { return m_kind; }
    void setCurrentShape(int kind);
    double strokeWeight() const { return m_weight; }
    void setStrokeWeight(double v);
    bool filled() const { return m_filled; }
    void setFilled(bool v);

    bool snapEnabled() const { return m_snap.enabled; }
    void setSnapEnabled(bool v);
    bool snapToGrid() const { return m_snap.toGrid; }
    void setSnapToGrid(bool v);
    bool snapToGuides() const { return m_snap.toGuides; }
    void setSnapToGuides(bool v);
    bool snapToGeometry() const { return m_snap.toGeometry; }
    void setSnapToGeometry(bool v);
    double gridSize() const { return m_snap.gridSize; }
    void setGridSize(double v);
    double snapRadius() const { return m_snap.snapRadiusPx; }
    void setSnapRadius(double v);
    int sides() const { return m_sides; }
    void setSides(int v);
    double innerRatio() const { return m_innerRatio; }
    void setInnerRatio(double v);
    double arrowHeadLength() const { return m_arrowHead; }
    void setArrowHeadLength(double v);
    double arrowHeadWidth() const { return m_arrowHeadWidth; }
    void setArrowHeadWidth(double v);
    QString lastSnap() const { return m_lastSnap; }
    SnapConfig config() const { return m_snap; }

    // ---- snapping -----------------------------------------------------------
    // Guides are (axis, position) pairs supplied by the canvas.
    Q_INVOKABLE void setGuides(const QVariantList &guides);
    void setGuides(const QVector<QPointF> &guides, bool vertical);
    // Existing geometry, used for endpoint/midpoint/centre snapping.
    void setReferenceGeometry(const QVector<QPointF> &vertices);
    void clearReferenceGeometry();

    SnapResult snapPoint(const QPointF &raw, int snapFlags = -1) const;
    // Constrains a direction to 45 degree increments when shift is held.
    QPointF constrainAngle(const QPointF &from, const QPointF &to) const;
    SnapResult snapDirection(const QPointF &from, const QPointF &to) const;

    // ---- construction --------------------------------------------------------
    // Live shape: starts with `start`, updates as the pointer moves.
    Shape begin(const QPointF &start, const QPointF &current, int shapeKind = -1);
    void extend(const QPointF &current);
    void addVertex(const QPointF &p);        // polygon / polyline
    void finish();                            // stops vertex collection
    bool isBuilding() const { return m_building; }
    bool needsMoreVertices() const;
    Shape current() const { return m_current; }

    // ---- static geometry ------------------------------------------------------
    static QVector<QPointF> linePoints(const QPointF &a, const QPointF &b);
    static QVector<QPointF> rectPoints(const QPointF &a, const QPointF &b, double rotation);
    static QVector<QPointF> ellipsePoints(const QPointF &a, const QPointF &b, int segments = 72);
    static QVector<QPointF> polygonPoints(const QPointF &centre, double radius, int sides,
                                          double rotationDeg = 0.0);
    static QVector<QPointF> starPoints(const QPointF &centre, double outerRadius, int sides,
                                       double innerRatio, double rotationDeg = 0.0);
    static QVector<QPointF> arrowPoints(const QPointF &from, const QPointF &to,
                                        double headLength, double headWidth);
    static QPainterPath pathFor(const Shape &shape);

    // ---- editing handles --------------------------------------------------------
    QVector<ShapeHandle> handlesFor(const Shape &shape) const;
    // Applies a handle drag. `index` matches ShapeHandle::index.
    Shape applyHandleDrag(const Shape &shape, int index, const QPointF &to,
                          const SnapResult &snap) const;
    // Whole-shape transforms.
    Shape transformed(const Shape &shape, const QTransform &m, double rotationDelta) const;
    Shape rotatedAbout(const Shape &shape, const QPointF &pivot, double degrees) const;
    Shape flipped(const Shape &shape, bool horizontal) const;
    // Nudge.
    Shape moved(const Shape &shape, const QPointF &delta) const;

    // ---- rendering ------------------------------------------------------------
    // Renders into the layer raster; returns the document rect touched.
    QRectF render(QImage &target, const Shape &shape, const FillOptions &opt) const;
    // Renders a rubber-band preview without touching the layer.
    QImage preview(int w, int h, const Shape &shape, const QPointF &origin) const;

    // ---- document helpers --------------------------------------------------------
    Q_INVOKABLE QVariantList shapeNames() const;
    static QString kindName(int kind);

signals:
    void currentShapeChanged();
    void strokeWeightChanged();
    void snapChanged();
    void shapeParamsChanged();
    void snapApplied(QString kind);

private:
    int m_kind = ShapeRectangle;
    double m_weight = 4.0;
    bool m_filled = false;
    SnapConfig m_snap;
    int m_sides = 6;
    double m_innerRatio = 0.45;
    double m_arrowHead = 28.0;
    double m_arrowHeadWidth = 0.42;
    bool m_building = false;
    Shape m_current;
    QVector<QPointF> m_pending;
    QVector<QPointF> m_guides;
    QVector<bool> m_guideVertical;
    QVector<QPointF> m_reference;
    QString m_lastSnap;
};

} // namespace paint

Q_DECLARE_METATYPE(paint::Shape)

#endif // PAINT_SHAPE_ENGINE_H
