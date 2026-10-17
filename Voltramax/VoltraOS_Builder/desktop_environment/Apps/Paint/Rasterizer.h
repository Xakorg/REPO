#ifndef PAINT_RASTERIZER_H
#define PAINT_RASTERIZER_H

// =============================================================================
//  VOLTRA PAINT - Rasterizer
// =============================================================================
//  Turns StrokeModel geometry into pixels. No shortcuts:
//
//   - Strokes are filled as non-zero-winding polygons built from real
//     variable-width offsets, so overlapping stamps merge instead of stacking
//     their alpha twice.
//   - Edges are anti-aliased with 4x4 sub-sample coverage computed from the
//     exact polygon winding, not from a QPainter render pass.
//   - Alpha compositing is done per-pixel in premultiplied ARGB32 so that a
//     stroke with flow < 1 does not darken itself where it overlaps.
//   - Blend modes are the real separable formulas over the backdrop.
//   - Every operation honours a clip rectangle and an optional clip mask, which
//     is how selections and layer masks restrict painting.
// =============================================================================

#include "PaintTypes.h"
#include "StrokeModel.h"

#include <QImage>
#include <QPainterPath>
#include <QRegion>

namespace paint {

// ---------------------------------------------------------------------------
// Where a stamp may write. Normalised to the document, then scaled.
// ---------------------------------------------------------------------------
struct RasterTarget {
    QRectF rect;              // document-space region that will be written
    int deviceScale = 1;      // 1 at 100%, 2 on a HiDPI screen

    RasterTarget() = default;
    explicit RasterTarget(const QRectF &r, int scale = 1) : rect(r), deviceScale(scale) {}
};

// ---------------------------------------------------------------------------
// Anti-aliased polygon filling.
//
// We rasterise ourselves rather than handing polygons to QPainter because:
//  (a) we need per-pixel blend modes and destination-out erasers,
//  (b) we need coverage that survives compositing without double-darkening,
//  (c) we need to clamp work to the layer bounds on a document with 40 layers.
//
// The scanline uses 4 sub-scanlines per pixel row and 4 samples across, giving
// 16 levels of coverage, which is what QPainter::Antialiasing gives and what
// our supersampled tile cache expects.
// ---------------------------------------------------------------------------
struct FillOptions {
    bool antialias = true;
    bool clipToAlpha = false;   // only paint where dst already has coverage
    double globalAlpha = 1.0;
    int subSamples = 4;         // 1 = hard edges, 4 = default AA
    QRegion hardClip;           // device-pixel region, may be null
};

// ---------------------------------------------------------------------------
// Flood fill request.
// ---------------------------------------------------------------------------
struct FillRequest {
    QPoint seed;
    QColor colour;
    int tolerance = 32;         // 0..255, per-channel euclidean in RGBA space
    bool contiguous = true;     // false => global replace of matching colour
    bool alphaThreshold = true; // treat near-transparent as "empty"
    int minAlpha = 8;
};

class Rasterizer
{
public:
    Rasterizer() = delete;

    // ---- strokes --------------------------------------------------------
    // Rasterises `stroke` into `dst`. `dst` must be ARGB32_Premultiplied.
    // Returns the document-space rectangle that was touched.
    static QRectF drawStroke(QImage &dst, const Stroke &stroke, const FillOptions &opt);

    // Fast path for live drawing: rasterises only the dirty tail of a stroke
    // that is still growing. `fromIndex` is an index into stroke.points.
    static QRectF drawStrokeSegment(QImage &dst, const Stroke &stroke, int fromIndex,
                                    const FillOptions &opt);

    // Stamps a single dab. Used for airbrush and for the brush preview.
    static QRectF stamp(QImage &dst, const QPointF &docPos, double radius,
                        const QColor &colour, double flow, double alpha,
                        double hardness, NibModeId nib, double nibAngle,
                        double tiltX, double tiltY, const FillOptions &opt);

    // ---- primitive fills -------------------------------------------------
    static QRectF fillPath(QImage &dst, const QPainterPath &path, const QColor &colour,
                           int blendMode, double alpha, const FillOptions &opt);
    static QRectF strokePath(QImage &dst, const QPainterPath &path, const QColor &colour,
                             double width, int blendMode, double alpha,
                             const FillOptions &opt);
    static QRectF clearRect(QImage &dst, const QRectF &rect, const FillOptions &opt);

    // ---- flood fill ------------------------------------------------------
    // Real scanline flood fill on the actual pixel data of `dst`.
    static QRectF floodFill(QImage &dst, const FillRequest &req, const FillOptions &opt);

    // ---- compositing -----------------------------------------------------
    // Composites `src` onto `dst` inside `area` with a blend mode and opacity.
    static void compositeImage(QImage &dst, const QImage &src, const QRect &area,
                               int blendMode, double opacity, bool destinationOut = false);

    // Multiplies dst alpha by `mask`'s luminance in `area`.
    static void applyMask(QImage &dst, const QImage &mask, const QRect &area,
                          double maskStrength = 1.0);

    // Flattens an entire layer stack into one image.
    static QImage flatten(const QVector<QImage> &layers, const QVector<double> &opacities,
                          const QVector<int> &blendModes, const QSize &size);

    // ---- core pixel operations -------------------------------------------
    // Blends a single source pixel over a destination pixel. Both are
    // premultiplied ARGB32. Returns the new destination pixel.
    static quint32 blendPixel(quint32 dst, quint32 src, int blendMode, double opacity);

    // Blend function on the 0..1 separable components only.
    static double blendChannel(int mode, double back, double src);

    // Coverage accumulator used by the scanline filler. Public so the brush
    // preview and the canvas overlay can reuse the exact same AA.
    struct Coverage {
        QVector<float> values;   // one entry per device pixel in `area`
        QRect area;
    };
    static Coverage rasteriseCoverage(const QVector<QPolygonF> &polys, const QRect &area,
                                      int subSamples);

    // ---- helpers ----------------------------------------------------------
    static QImage ensureFormat(QImage &img);
    static QImage createLayer(const QSize &size, const QColor &fill = QColor(0, 0, 0, 0));
    static QRect scaleRect(const QRectF &docRect, int scale);
    static QImage cropDirty(const QImage &src, const QRectF &docRect, int scale);
    static void applyToCrop(QImage &dst, const QImage &crop, const QRect &at, bool destinationOut);

    // Scanline fill of a single polygon with non-zero winding.
    static void fillPolygonNonZero(QImage &dst, const QPolygonF &poly,
                                   const QColor &colour, int blendMode, double alpha,
                                   const FillOptions &opt, const QRect &limit);

    // Deterministic 64x64 tileable noise used by texture brushes and the
    // "noise" filter. Hash-based so it is reproducible across devices.
    static QImage makeNoiseTile(int size, quint64 seed, int mode);

    // Soft radial dab sprite for the current brush (cached by the caller).
    static QImage makeDabSprite(int size, double hardness);
};

} // namespace paint

#endif // PAINT_RASTERIZER_H