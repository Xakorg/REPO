#ifndef PAINT_STROKE_MODEL_H
#define PAINT_STROKE_MODEL_H

// =============================================================================
//  VOLTRA PAINT - StrokeModel
// =============================================================================
//  The heart of the app: a faithful, lossless record of what a stylus did.
//
//  Every sample carries position, pressure, tilt (altitude + azimuth), barrel
//  rotation (twist) and the pointer type that produced it, plus a monotonic
//  timestamp. Nothing is averaged away until the user asks for simplification,
//  and even then only the polyline is thinned - pressure/tilt/twist are
//  re-interpolated so that re-rendering the simplified stroke is visually
//  indistinguishable from the raw capture.
//
//  The model also owns outline generation (variable width, real caps and
//  joins), hit testing, transforms, bounds and a portable binary encoding.
// =============================================================================

#include "PaintTypes.h"

#include <QByteArray>
#include <QDataStream>
#include <QPainterPath>
#include <QPolygonF>
#include <QTransform>
#include <QVector>

namespace paint {

// ---------------------------------------------------------------------------
// One captured sample. Fixed 8 floats + timestamp keeps the hot path cheap.
// ---------------------------------------------------------------------------
struct StrokePoint {
    QPointF pos;          // document space, pixels
    float pressure = 0.0f;   // 0..1 from QTabletEvent::pressure
    float tiltAzimuth = 0.0f;  // degrees, 0 = pointing along +X
    float tiltAltitude = 90.0f; // degrees, 90 = perpendicular to surface
    float twist = 0.0f;    // degrees of barrel rotation
    qint64 t = 0;          // monotonic ms since stroke start
    int pointerKind = PointerPen;
    bool eraser = false;   // stylus flipped to the eraser end

    // Projected tilt vector in document space: length is lean, angle is the
    // direction the pen leans towards. This is what the chisel nib uses.
    QPointF leanVector() const
    {
        const double alt = qDegreesToRadians(clampd(tiltAltitude, 0.0, 90.0));
        const double az = qDegreesToRadians(tiltAzimuth);
        const double lean = std::cos(alt);
        return QPointF(std::cos(az) * lean, std::sin(az) * lean);
    }

    // 0..1 how "on its side" the pen is.
    double tiltAmount() const { return clampd(1.0 - tiltAltitude / 90.0, 0.0, 1.0); }
};

// ---------------------------------------------------------------------------
// Everything needed to reproduce a stroke visually, independent of the brush
// that produced it. Snapshotted into the document so editing a brush later
// never silently changes existing artwork.
// ---------------------------------------------------------------------------
struct StrokeStyle {
    QColor colour = QColor(16, 18, 24, 255);
    double baseSize = 6.0;
    double sizeJitter = 0.0;
    double flow = 1.0;
    double opacity = 1.0;
    double spacing = 0.12;      // fraction of size between stamps
    double hardness = 0.75;
    CapStyleId cap = CapRound;
    JoinStyleId join = JoinRound;
    int blendMode = BlendNormal;

    // Pressure / velocity dynamics, evaluated per stamp by BrushEngine and
    // baked here so the stroke is self-contained.
    double sizePressureDepth = 0.75;
    double flowPressureDepth = 0.5;
    double velocityThinning = 0.25;
    double hueJitter = 0.0;
    double saturationJitter = 0.0;
    double valueJitter = 0.0;

    NibModeId nib = NibRound;
    double nibAngle = 45.0;     // degrees, base orientation of a chisel
    double nibRatio = 0.45;     // minor/major axis of a chisel footprint
    double tiltSizeGain = 0.6;  // how much tilt widens the stamp
    double tiltFlowGain = 0.35;

    // Texture stamping: a deterministic 64x64 greyscale tile index. -1 = none.
    int textureIndex = -1;
    quint64 seed = 0x9E3779B97F4A7C15ull;

    // Eraser strokes paint with the destination-out operator rather than a
    // colour, so they behave correctly on partially transparent layers.
    bool eraserMode = false;

    bool isEraser() const { return eraserMode; }
    bool hasTexture() const { return textureIndex >= 0; }

    // Serialised width in bytes (used by the undo memory accounting).
    qint64 byteSize() const;
};

// ---------------------------------------------------------------------------
// A stroke: samples + style + the metrics caches that make rendering cheap.
// ---------------------------------------------------------------------------
struct Stroke {
    quint32 id = 0;
    StrokeKind kind = StrokeInk;
    QVector<StrokePoint> points;
    StrokeStyle style;

    bool closed = false;          // polygons / lasso-ish shapes
    QRectF cachedBounds;          // document space including half width
    bool boundsValid = false;
    double cachedLength = -1.0;

    bool isEmpty() const { return points.size() < 1; }

    void invalidate() { boundsValid = false; cachedLength = -1.0; }

    double length() const;
    QRectF bounds() const;        // tight bounds of the sample positions
    QRectF paintBounds() const;   // bounds plus the brush radius (hit/AA safe)
    qint64 byteSize() const;

    QPointF centre() const;
};

// ---------------------------------------------------------------------------
// Pressure / velocity estimation.
// ---------------------------------------------------------------------------
struct DynamicsSample {
    float pressure = 1.0f;
    float tilt = 0.0f;
    float twist = 0.0f;
    float speed = 0.0f;       // px per ms
    float widthScale = 1.0f;
    float flowScale = 1.0f;
    QColor tint;
};

// ---------------------------------------------------------------------------
// Static algorithms. All pure functions over their inputs.
// ---------------------------------------------------------------------------
class StrokeModel
{
public:
    StrokeModel() = delete;

    // ---- sampling -------------------------------------------------------
    // One-Euro style adaptive smoothing: strong smoothing when the hand is
    // slow (kills jitter), light smoothing when it is fast (keeps detail).
    static QVector<StrokePoint> smooth(const QVector<StrokePoint> &in,
                                       double minCutoff = 1.2,
                                       double beta = 0.02,
                                       double dCutoff = 1.0);

    // Ramer-Douglas-Peucker on positions, with linear re-interpolation of the
    // remaining attributes across the kept span. `preserveFirstLast` keeps the
    // endpoints so the stroke always starts and ends exactly where the pen did.
    static QVector<StrokePoint> simplify(const QVector<StrokePoint> &in, double epsilon);

    // Perpendicular-distance error metric RDP (better for strokes than
    // Douglas-Peucker because it accounts for the local direction).
    static double perpendicularError(const QVector<StrokePoint> &pts, int first, int last);

    // Resample to (approximately) uniform arc-length spacing.
    static QVector<StrokePoint> resample(const QVector<StrokePoint> &in, double spacing);

    // Cumulative length / velocity helpers.
    static QVector<double> arcLengths(const QVector<StrokePoint> &pts);
    static double averageSpeed(const QVector<StrokePoint> &pts);

    // ---- dynamics -------------------------------------------------------
    // width multiplier from pressure, velocity and tilt, with real response
    // curves rather than a linear ramp.
    static DynamicsSample evaluateDynamics(const StrokeStyle &style, const StrokePoint &p,
                                           double speedPxPerMs, double prevWidthScale);

    // ---- outline generation --------------------------------------------
    // Left and right offset polylines of a variable-width stroke. Returns 2
    // polygons (may be empty when there are not enough points).
    static QVector<QPolygonF> variableWidthOutline(const QVector<StrokePoint> &pts,
                                                   const StrokeStyle &style,
                                                   double spacing,
                                                   bool *closed = nullptr);

    // Real round/flat/square caps as arc or line point runs.
    static QVector<QPointF> capPoints(const QPointF &centre, const QPointF &dir,
                                      double radius, CapStyleId cap);

    // Real round/miter/bevel joins.
    static QVector<QPointF> joinPoints(const QPointF &prev, const QPointF &curr,
                                       const QPointF &next, double r0, double r1,
                                       JoinStyleId join, double miterLimit = 4.0);

    // Chisel / fountain footprint: an oriented ellipse whose minor axis follows
    // the projected tilt vector. Returns the two semi-axes.
    static void nibFootprint(const StrokeStyle &style, const StrokePoint &p,
                             double radius, double *majorOut, double *minorOut,
                             double *angleOut);

    // QPainterPath for hit testing / vector export.
    static QPainterPath toPainterPath(const QVector<StrokePoint> &pts, const StrokeStyle &style,
                                      bool fill = true);

    // ---- geometry -------------------------------------------------------
    static QRectF computeBounds(const QVector<StrokePoint> &pts, const StrokeStyle &style);
    static bool hitTest(const QVector<StrokePoint> &pts, const StrokeStyle &style,
                        const QPointF &p, double slack = 0.0);
    static double distanceToStroke(const QVector<StrokePoint> &pts,
                                   const StrokeStyle &style, const QPointF &p);
    static bool hitTestOutline(const QVector<QPointF> &outline, const QPointF &p);
    static bool isSelfIntersecting(const QVector<StrokePoint> &pts);

    // ---- transforms -----------------------------------------------------
    // Transforms positions and rotates tilt azimuth/twist by the same angle so
    // a rotated chisel nib keeps its orientation. Scale is anisotropic so the
    // transform is applied to the sample stream, not the already-built outline.
    static void transform(Stroke &s, const QTransform &m, double rotationDelta = 0.0,
                          double scaleX = 1.0, double scaleY = 1.0);
    static QVector<StrokePoint> transformedPoints(const QVector<StrokePoint> &pts,
                                                  const QTransform &m,
                                                  double rotationDelta);
    static Stroke transformed(const Stroke &s, const QTransform &m, double rotationDelta);

    // ---- serialisation ---------------------------------------------------
    // Portable little-endian binary. Version 1 layout is documented in the
    // README ("VPD1 stroke block") and is stable across platforms.
    static QByteArray serialise(const Stroke &s);
    static QByteArray serialiseList(const QVector<Stroke> &list);
    static bool deserialise(const QByteArray &data, Stroke *out, QString *error = nullptr);
    static bool deserialiseList(const QByteArray &data, QVector<Stroke> *out,
                                QString *error = nullptr);

    static quint32 nextId();
    static void resetIdCounter(quint32 base);

    // Number of bytes one StrokePoint occupies on disk.
    static constexpr int kPointRecordBytes = 44;
    static constexpr quint32 kFormatMagic = 0x56505331u; // "VPS1"
};

} // namespace paint

#endif // PAINT_STROKE_MODEL_H