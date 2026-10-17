#include "Rasterizer.h"

#include <QGuiApplication>
#include <QPainter>
#include <QPainterPath>
#include <QVector>
#include <QtEndian>

#include <algorithm>
#include <cmath>
#include <cstring>

namespace paint {

// ===========================================================================
// Poly bounds helper (used all over the file)
// ===========================================================================

static QRectF polyBoundsRect(const QPolygonF &poly)
{
    if (poly.isEmpty())
        return QRectF();
    double x0 = poly.first().x(), y0 = poly.first().y();
    double x1 = x0, y1 = y0;
    for (const QPointF &p : poly) {
        x0 = qMin(x0, p.x()); y0 = qMin(y0, p.y());
        x1 = qMax(x1, p.x()); y1 = qMax(y1, p.y());
    }
    return QRectF(x0, y0, x1 - x0, y1 - y0);
}

// Destination-out: dst_new = dst * (1 - srcAlpha * opacity). Used by both the
// pixel eraser and layer masking; must NOT go through blendPixel, which is
// source-over.
static inline quint32 destinationOut(quint32 dst, quint32 src, double opacity)
{
    const double sa = double(src >> 24) / 255.0;
    const double k = clampd(opacity, 0.0, 1.0);
    const double keep = 1.0 - sa * k;
    if (keep <= 1e-6)
        return 0;
    const int a = int(double(dst >> 24) * keep + 0.5);
    const int r = int(double((dst >> 16) & 0xFF) * keep + 0.5);
    const int g = int(double((dst >> 8) & 0xFF) * keep + 0.5);
    const int b = int(double(dst & 0xFF) * keep + 0.5);
    return (quint32(qBound(0, a, 255)) << 24) | (quint32(qBound(0, r, 255)) << 16)
           | (quint32(qBound(0, g, 255)) << 8) | quint32(qBound(0, b, 255));
}

// ===========================================================================
// Pixel format helpers
// ===========================================================================

QImage Rasterizer::ensureFormat(QImage &img)
{
    if (img.format() == QImage::Format_ARGB32_Premultiplied)
        return img;
    QImage conv = img.convertToFormat(QImage::Format_ARGB32_Premultiplied);
    img = conv;
    return img;
}

QImage Rasterizer::createLayer(const QSize &size, const QColor &fill)
{
    QImage img(size, QImage::Format_ARGB32_Premultiplied);
    img.fill(fill);
    return img;
}

QRect Rasterizer::scaleRect(const QRectF &docRect, int scale)
{
    const int s = qMax(1, scale);
    return QRect(int(std::floor(docRect.x() * s)),
                 int(std::floor(docRect.y() * s)),
                 int(std::ceil(docRect.width() * s)) + 2,
                 int(std::ceil(docRect.height() * s)) + 2);
}

QImage Rasterizer::cropDirty(const QImage &src, const QRectF &docRect, int scale)
{
    const QRect r = scaleRect(docRect, scale).intersected(src.rect());
    if (r.isEmpty())
        return QImage();
    return src.copy(r);
}

void Rasterizer::applyToCrop(QImage &dst, const QImage &crop, const QRect &at, bool destinationOut)
{
    if (crop.isNull())
        return;
    QImage src = crop;
    if (src.format() != QImage::Format_ARGB32_Premultiplied)
        src = src.convertToFormat(QImage::Format_ARGB32_Premultiplied);

    // A dirty rect that hangs off the edge must be clipped, and the crop shifted.
    QRect target = at.intersected(dst.rect());
    if (target.isEmpty())
        return;
    const QRect srcRect = target.translated(-at.topLeft());

    for (int y = 0; y < target.height(); ++y) {
        const quint32 *srow = reinterpret_cast<const quint32 *>(src.constScanLine(srcRect.top() + y));
        quint32 *drow = reinterpret_cast<quint32 *>(dst.scanLine(target.top() + y));
        for (int x = 0; x < target.width(); ++x) {
            const quint32 s = srow[x];
            if ((s >> 24) == 0)
                continue;
            quint32 &d = drow[target.left() + x];
            d = destinationOut ? ::paint::destinationOut(d, s, 1.0)
                               : Rasterizer::blendPixel(d, s, BlendNormal, 1.0);
        }
    }
}

// ===========================================================================
// Blend modes
// ===========================================================================

double Rasterizer::blendChannel(int mode, double back, double src)
{
    switch (mode) {
    case BlendMultiply:   return back * src;
    case BlendScreen:     return 1.0 - (1.0 - back) * (1.0 - src);
    case BlendOverlay:    return back <= 0.5 ? (2.0 * back * src)
                                             : (1.0 - 2.0 * (1.0 - back) * (1.0 - src));
    case BlendDarken:     return std::min(back, src);
    case BlendLighten:    return std::max(back, src);
    case BlendColorDodge: return back <= 0.0 ? 0.0
                                             : (src >= 1.0 ? 1.0
                                                            : std::min(1.0, back / (1.0 - src)));
    case BlendColorBurn:  return back >= 1.0 ? 1.0
                                             : (src <= 0.0 ? 0.0
                                                          : 1.0 - std::min(1.0, (1.0 - back) / src));
    case BlendHardLight:  return src <= 0.5 ? (2.0 * src * back)
                                            : (1.0 - 2.0 * (1.0 - src) * (1.0 - back));
    case BlendSoftLight: {
        if (src <= 0.5)
            return back - (1.0 - 2.0 * src) * back * (1.0 - back);
        double d = 0.0;
        if (back <= 0.25)
            d = ((16.0 * back - 12.0) * back + 4.0) * back;
        else
            d = std::sqrt(back);
        return back + (2.0 * src - 1.0) * (d - back);
    }
    case BlendDifference:  return std::fabs(back - src);
    case BlendExclusion:  return back + src - 2.0 * back * src;
    case BlendAdd:         return std::min(1.0, back + src);
    case BlendSubtract:    return std::max(0.0, back - src);
    case BlendNormal:
    default:               return src;
    }
}

quint32 Rasterizer::blendPixel(quint32 dst, quint32 src, int blendMode, double opacity)
{
    if (opacity <= 0.0)
        return dst;

    // Premultiplied extraction. Qt stores ARGB32_Premultiplied as BGRA on
    // little-endian, which QImage::pixel() accounts for, so go through the
    // canonical helpers rather than reinterpreting the words by hand.
    const int da = int(dst >> 24);
    const int dr = int((dst >> 16) & 0xFF);
    const int dg = int((dst >> 8) & 0xFF);
    const int db = int(dst & 0xFF);

    const int sa = int(src >> 24);
    const int sr = int((src >> 16) & 0xFF);
    const int sg = int((src >> 8) & 0xFF);
    const int sb = int(src & 0xFF);

    const double inv = 1.0 - opacity;
    const double af = double(sa) / 255.0 * opacity;
    const double ad = double(da) / 255.0;

    // Eraser: destination-out. Removes coverage proportionally.
    if (blendMode == BlendSubtract && sa == 0) {
        const double na = ad * inv;
        if (na <= 0.0)
            return 0;
        // Keep colour, drop alpha.
        const int na8 = int(na * 255.0 + 0.5);
        return (quint32(na8) << 24) | (dst & 0x00FFFFFFu);
    }

    // Straight (un-premultiply) colour of the source so the blend formulas,
    // which are defined on non-premultiplied values, are correct.
    const double sAlpha = af;
    double srN = sAlpha > 1e-6 ? (double(sr) / 255.0) / sAlpha : 0.0;
    double sgN = sAlpha > 1e-6 ? (double(sg) / 255.0) / sAlpha : 0.0;
    double sbN = sAlpha > 1e-6 ? (double(sb) / 255.0) / sAlpha : 0.0;
    srN = clampd(srN, 0.0, 1.0);
    sgN = clampd(sgN, 0.0, 1.0);
    sbN = clampd(sbN, 0.0, 1.0);

    const double drN = ad > 1e-6 ? (double(dr) / 255.0) / ad : 0.0;
    const double dgN = ad > 1e-6 ? (double(dg) / 255.0) / ad : 0.0;
    const double dbN = ad > 1e-6 ? (double(db) / 255.0) / ad : 0.0;

    double br, bg, bb;
    if (blendMode == BlendNormal || ad <= 1e-6) {
        br = srN; bg = sgN; bb = sbN;
    } else {
        br = blendChannel(blendMode, clampd(drN, 0.0, 1.0), srN);
        bg = blendChannel(blendMode, clampd(dgN, 0.0, 1.0), sgN);
        bb = blendChannel(blendMode, clampd(dbN, 0.0, 1.0), sbN);
    }

    // Composite the blended colour over the backdrop using source-over.
    const double outA = sAlpha + ad * inv;
    if (outA <= 1e-9)
        return 0;

    const double k = ad * inv / outA;
    const double orr = (br * sAlpha + drN * k) ;
    const double og = (bg * sAlpha + dgN * k);
    const double ob = (bb * sAlpha + dbN * k);

    const int oa = int(outA * 255.0 + 0.5);
    // Re-premultiply for storage.
    const int r8 = int(clampd(orr, 0.0, 1.0) * outA * 255.0 + 0.5);
    const int g8 = int(clampd(og, 0.0, 1.0) * outA * 255.0 + 0.5);
    const int b8 = int(clampd(ob, 0.0, 1.0) * outA * 255.0 + 0.5);

    return (quint32(qBound(0, oa, 255)) << 24) | (quint32(qBound(0, r8, 255)) << 16)
           | (quint32(qBound(0, g8, 255)) << 8) | quint32(qBound(0, b8, 255));
}

// ===========================================================================
// Anti-aliased coverage rasterisation
// ===========================================================================

Rasterizer::Coverage Rasterizer::rasteriseCoverage(const QVector<QPolygonF> &polys,
                                                   const QRect &area, int subSamples)
{
    Coverage cov;
    cov.area = area;
    if (area.isEmpty() || polys.isEmpty())
        return cov;

    const int ss = qBound(1, subSamples, 8);
    cov.values.assign(area.width() * area.height(), 0.0f);

    // Edges in device space, bucketed by scanline for a proper active edge table.
    struct Edge { double x0, y0, x1, y1; int dir; };
    QVector<Edge> edges;
    for (const QPolygonF &poly : polys) {
        const int n = poly.size();
        if (n < 3)
            continue;
        for (int i = 0; i < n; ++i) {
            const QPointF a = poly.at(i);
            const QPointF b = poly.at((i + 1) % n);
            if (std::fabs(a.y() - b.y()) < 1e-12)
                continue;
            Edge e;
            e.x0 = a.x(); e.y0 = a.y();
            e.x1 = b.x(); e.y1 = b.y();
            e.dir = (b.y() > a.y()) ? 1 : -1;
            edges.append(e);
        }
    }
    if (edges.isEmpty())
        return cov;

    // Coverage is accumulated as winding-sorted sample counts.
    const double invSS = 1.0 / ss;
    const double weight = invSS * invSS;

    for (int y = area.top(); y <= area.bottom(); ++y) {
        // Accumulate into a per-row winding sum, so overlaps with the same
        // direction saturate instead of adding twice (the anti-darkening rule).
        QVector<int> winding(area.width() + 1, 0);

        for (int sub = 0; sub < ss; ++sub) {
            const double sy = y + (double(sub) + 0.5) * invSS;

            // Collect x-intersections with their directions for this sub-scanline.
            struct Cross { double x; int dir; };
            QVector<Cross> xs;
            for (const Edge &e : edges) {
                const double ymin = qMin(e.y0, e.y1);
                const double ymax = qMax(e.y0, e.y1);
                if (sy < ymin || sy >= ymax)
                    continue;
                const double t = (sy - e.y0) / (e.y1 - e.y0);
                xs.append({ e.x0 + t * (e.x1 - e.x0), e.dir });
            }
            if (xs.size() < 2)
                continue;

            std::sort(xs.begin(), xs.end(),
                      [](const Cross &a, const Cross &b) { return a.x < b.x; });

            // Walk the sorted crossings maintaining winding.
            std::fill(winding.begin(), winding.end(), 0);
            int w = 0;
            for (int i = 0; i < xs.size(); ++i) {
                const int prevW = w;
                w += xs.at(i).dir;
                if (prevW == 0 && w != 0) {
                    // Entering: record span start
                    // Stored via a sentinel pass below.
                    // We instead record into a temp list of spans for this sub.
                    // Implemented by writing into `spanStart` parallel array.
                    // (kept simple: spans emitted immediately)
                }
                if (prevW != 0 && w == 0) {
                    // Leaving: emit the span [enterX, xs[i].x]
                    const double xa = xs.at(i - 1 >= 0 ? i - 1 : 0).x;
                    const double xb = xs.at(i).x;
                    int px0 = int(std::floor(xa));
                    int px1 = int(std::ceil(xb));
                    px0 = qMax(px0, area.left());
                    px1 = qMin(px1, area.right());
                    for (int px = px0; px < px1; ++px) {
                        const double lo = qMax(xa, double(px));
                        const double hi = qMin(xb, double(px + 1));
                        const double overlap = hi - lo;
                        if (overlap <= 0.0)
                            continue;
                        winding[px - area.left()] += 1;
                    }
                }
            }
        }

        const int row = y - area.top();
        float *out = cov.values.data() + qint64(row) * area.width();
        for (int x = 0; x < area.width(); ++x) {
            const int hits = winding[x];
            if (hits <= 0)
                continue;
            // Each sub-scanline contributes at most weight; several
            // sub-scanlines inside one pixel means partial coverage.
            const double partial = double(hits) * weight;
            // Hits beyond the number of sub-scanlines mean full horizontal
            // coverage, which the clamp to 1.0 handles.
            out[x] = float(qBound(0.0, partial, 1.0));
        }
    }

    // The above counts coverage from sample-row crossings only, which yields
    // 4 levels vertically. Add the horizontal analytic fraction for a smooth
    // ramp by re-running the span accumulation with exact x extents already
    // applied above (the per-pixel overlap was clamped to whole pixels), so
    // refine here with a second pass that stores the fractional x coverage.
    //
    // Simplification that is still correct and smooth: recompute using a
    // per-pixel fractional accumulator.
    QVector<float> frac(area.width() * area.height(), 0.0f);
    for (int y = area.top(); y <= area.bottom(); ++y) {
        for (int sub = 0; sub < ss; ++sub) {
            const double sy = y + (double(sub) + 0.5) * invSS;
            struct Cross2 { double x; int dir; };
            QVector<Cross2> xs;
            for (const Edge &e : edges) {
                const double ymin = qMin(e.y0, e.y1);
                const double ymax = qMax(e.y0, e.y1);
                if (sy < ymin || sy >= ymax)
                    continue;
                const double t = (sy - e.y0) / (e.y1 - e.y0);
                xs.append({ e.x0 + t * (e.x1 - e.x0), e.dir });
            }
            if (xs.size() < 2)
                continue;
            std::sort(xs.begin(), xs.end(),
                      [](const Cross2 &a, const Cross2 &b) { return a.x < b.x; });

            int w = 0;
            double enterX = 0.0;
            for (int i = 0; i < xs.size(); ++i) {
                const int prevW = w;
                w += xs.at(i).dir;
                if (prevW == 0 && w != 0)
                    enterX = xs.at(i).x;
                else if (prevW != 0 && w == 0) {
                    const double xa = enterX;
                    const double xb = xs.at(i).x;
                    if (xb <= xa)
                        continue;
                    int px0 = qMax(int(std::floor(xa)), area.left());
                    int px1 = qMin(int(std::ceil(xb)) - 1, area.right());
                    for (int px = px0; px <= px1; ++px) {
                        const double lo = qMax(xa, double(px));
                        const double hi = qMin(xb, double(px + 1));
                        const double ov = hi - lo;
                        if (ov <= 0.0)
                            continue;
                        frac[qint64(y - area.top()) * area.width() + (px - area.left())]
                            += float(ov * invSS);
                    }
                }
            }
        }
    }
    for (int i = 0; i < frac.size(); ++i)
        cov.values[i] = float(clampd(float(frac.at(i)), 0.0f, 1.0f));

    return cov;
}

// ===========================================================================
// Polygon fill
// ===========================================================================

void Rasterizer::fillPolygonNonZero(QImage &dst, const QPolygonF &polyDevice,
                                    const QColor &colour, int blendMode, double alpha,
                                    const FillOptions &opt, const QRect &limit)
{
    if (dst.isNull() || polyDevice.size() < 3 || alpha <= 0.0)
        return;
    if (colour.alpha() == 0)
        return;

    QRectF polyBounds;
    for (const QPointF &p : polyDevice)
        polyBounds |= QRectF(p, QPointF(1.0, 1.0));
    polyBounds.adjust(-1.0, -1.0, 1.0, 1.0);

    QRect area = polyBounds.toAlignedRect().intersected(dst.rect());
    if (limit.isValid())
        area = area.intersected(limit);
    if (opt.hardClip.isValid())
        area = area.intersected(opt.hardClip.boundingRect());
    if (area.isEmpty())
        return;

    const int ss = opt.antialias ? qBound(1, opt.subSamples, 8) : 1;
    Coverage cov = rasteriseCoverage({ polyDevice }, area, ss);
    if (cov.values.isEmpty())
        return;

    const double totalAlpha = clampd(alpha * opt.globalAlpha * (colour.alphaF()), 0.0, 1.0);
    if (totalAlpha <= 0.0)
        return;

    for (int y = 0; y < cov.area.height(); ++y) {
        quint32 *drow = reinterpret_cast<quint32 *>(dst.scanLine(cov.area.top() + y));
        const float *crow = cov.values.constData() + qint64(y) * cov.area.width();
        for (int x = 0; x < cov.area.width(); ++x) {
            const float c = crow[x];
            if (c <= 0.002f)
                continue;
            const quint32 d = drow[cov.area.left() + x];

            const double da = double(d >> 24) / 255.0;
            if (opt.clipToAlpha && da < 0.004)
                continue;

            const double a = totalAlpha * double(c);
            if (a <= 0.0)
                continue;

            // Build the premultiplied source for this coverage.
            const quint32 src =
                (quint32(int(clampd(a * 255.0, 0.0, 255.0))) << 24)
                | (quint32(int(colour.red() * clampd(a, 0.0, 1.0)) & 0xFF) << 16)
                | (quint32(int(colour.green() * clampd(a, 0.0, 1.0)) & 0xFF) << 8)
                | quint32(int(colour.blue() * clampd(a, 0.0, 1.0)) & 0xFF);

            drow[cov.area.left() + x] = blendPixel(d, src, blendMode, 1.0);
        }
    }
}

// ===========================================================================
// Strokes
// ===========================================================================

QRectF Rasterizer::drawStroke(QImage &dst, const Stroke &stroke, const FillOptions &opt)
{
    if (dst.isNull() || stroke.points.isEmpty())
        return QRectF();

    const StrokeStyle &st = stroke.style;
    const QVector<QPolygonF> outlines =
        StrokeModel::variableWidthOutline(stroke.points, st, st.spacing);

    QRectF touched;
    for (const QPolygonF &poly : outlines) {
        if (poly.size() < 3)
            continue;
        QPolygonF device;
        device.reserve(poly.size());
        for (const QPointF &p : poly)
            device.append(p);

        QRectF b;
        for (const QPointF &p : device)
            b |= QRectF(p, QPointF(1.0, 1.0));

        if (st.hasTexture() || st.flow < 0.999) {
            // Partial flow and textured stamps need the rasterised coverage so
            // the same dab alpha does not stack along the stroke.
            QImage acc = createLayer(dst.size(), QColor(0, 0, 0, 0));
            fillPolygonNonZero(acc, device, st.colour, BlendNormal,
                               st.eraserMode ? 1.0 : clampd(st.flow * st.opacity, 0.0, 1.0),
                               opt, QRect());
            touched = touched.united(b);
            compositeImage(dst, acc, acc.rect().intersected(b.toAlignedRect()),
                           st.eraserMode ? BlendNormal : st.blendMode,
                           st.eraserMode ? 1.0 : 1.0, st.eraserMode);
        } else {
            fillPolygonNonZero(dst, device, st.colour, st.blendMode,
                               st.eraserMode ? 1.0 : st.opacity, opt, QRect());
            touched = touched.united(b);
        }
    }
    return touched;
}

QRectF Rasterizer::drawStrokeSegment(QImage &dst, const Stroke &stroke, int fromIndex,
                                     const FillOptions &opt)
{
    if (dst.isNull() || stroke.points.isEmpty())
        return QRectF();
    const int start = qBound(0, fromIndex - 1, stroke.points.size() - 1);

    Stroke tail;
    tail.style = stroke.style;
    tail.kind = stroke.kind;
    for (int i = start; i < stroke.points.size(); ++i)
        tail.points.append(stroke.points.at(i));
    if (tail.points.isEmpty())
        return QRectF();

    return drawStroke(dst, tail, opt);
}

QRectF Rasterizer::stamp(QImage &dst, const QPointF &docPos, double radius,
                         const QColor &colour, double flow, double alpha,
                         double hardness, NibModeId nib, double nibAngle,
                         double tiltX, double tiltY, const FillOptions &opt)
{
    if (dst.isNull() || radius <= 0.05)
        return QRectF();

    const double r = radius;
    QPolygonF poly;
    const int steps = qBound(12, int(r * 2.4) + 12, 96);

    if (nib == NibRound) {
        for (int i = 0; i < steps; ++i) {
            const double a = 2.0 * M_PI * double(i) / steps;
            poly.append(docPos + QPointF(std::cos(a) * r, std::sin(a) * r));
        }
    } else {
        // Oriented ellipse from the projected tilt vector.
        const double lean = std::hypot(tiltX, tiltY);
        double ang = (lean > 1e-5) ? std::atan2(tiltY, tiltX) * 180.0 / M_PI : nibAngle;
        if (nib == NibBlunt)
            ang = nibAngle;
        const double a = ang * M_PI / 180.0;
        const double ca = std::cos(a), sa = std::sin(a);
        const double major = r * (1.0 + lean * 1.4);
        const double minor = major * (nib == NibFountain ? 0.7 : 0.45);
        for (int i = 0; i < steps; ++i) {
            const double t = 2.0 * M_PI * double(i) / steps;
            const double px = std::cos(t) * major;
            const double py = std::sin(t) * minor;
            poly.append(docPos + QPointF(px * ca - py * sa, px * sa + py * ca));
        }
    }

    // Softness: hardness < 1 is applied as a radial alpha ramp in the fill.
    FillOptions local = opt;
    if (hardness < 0.999) {
        QImage acc = createLayer(dst.size(), QColor(0, 0, 0, 0));
        QRect area = polyBoundsRect(poly).toAlignedRect();
        area = area.intersected(dst.rect());
        for (int y = area.top(); y <= area.bottom(); ++y) {
            for (int x = area.left(); x <= area.right(); ++x) {
                const double d = std::hypot(x + 0.5 - docPos.x(), y + 0.5 - docPos.y());
                const double t = clampd(d / qMax(r, 1e-6), 0.0, 1.0);
                const double falloff = std::pow(1.0 - t, 1.0 + (1.0 - hardness) * 6.0);
                const double a = clampd(alpha * flow * falloff, 0.0, 1.0);
                if (a <= 0.002)
                    continue;
                quint32 *row = reinterpret_cast<quint32 *>(acc.scanLine(y));
                row[x] = (quint32(int(a * 255.0)) << 24)
                         | (quint32(int(colour.red() * a)) << 16)
                         | (quint32(int(colour.green() * a)) << 8)
                         | quint32(int(colour.blue() * a));
            }
        }
        QRect r2 = polyBoundsRect(poly).toAlignedRect().intersected(dst.rect());
        compositeImage(dst, acc, r2, BlendNormal, 1.0);
        return polyBoundsRect(poly);
    }

    fillPolygonNonZero(dst, poly, colour, BlendNormal, alpha * flow, local, QRect());
    return polyBoundsRect(poly);
}

// ===========================================================================
// Primitives
// ===========================================================================

QRectF Rasterizer::fillPath(QImage &dst, const QPainterPath &path, const QColor &colour,
                            int blendMode, double alpha, const FillOptions &opt)
{
    if (dst.isNull() || path.isEmpty() || colour.alpha() == 0)
        return QRectF();

    // Flatten to polygons so our own AA covers everything uniformly. QPainter
    // handles the bezier subdivision for us; we handle the coverage.
    const QList<QPolygonF> polys = path.toSubpathPolygons();
    QRectF touched;
    for (const QPolygonF &poly : polys) {
        if (poly.size() < 3)
            continue;
        fillPolygonNonZero(dst, poly, colour, blendMode, alpha, opt, QRect());
        touched = touched.united(polyBoundsRect(poly));
    }
    return touched;
}

QRectF Rasterizer::strokePath(QImage &dst, const QPainterPath &path, const QColor &colour,
                              double width, int blendMode, double alpha, const FillOptions &opt)
{
    if (dst.isNull() || path.isEmpty())
        return QRectF();

    // Generate a centre-line from the flattened path, then let StrokeModel do
    // the width/cap/join work so shapes and ink share one code path.
    QVector<QPointF> line;
    QPointF cursor;
    for (int i = 0; i < path.elementCount(); ++i) {
        const QPainterPath::Element e = path.elementAt(i);
        const QPointF p(e.x, e.y);
        if (e.type == QPainterPath::MoveToElement) {
            line.append(p);
            cursor = p;
        } else if (e.type == QPainterPath::LineToElement || e.type == QPainterPath::CurveToElement) {
            line.append(p);
            cursor = p;
        } else if (e.type == QPainterPath::CloseSubpathElement) {
            line.append(cursor);
        }
    }
    if (line.size() < 2)
        return QRectF();

    StrokeStyle st;
    st.colour = colour;
    st.baseSize = width;
    st.hardness = 1.0;
    st.flow = 1.0;
    st.opacity = alpha;
    st.blendMode = blendMode;
    st.spacing = 0.02;   // dense enough that a straight line is not stepped

    const QVector<QPolygonF> polys = StrokeModel::variableWidthOutline(line, st, st.spacing);
    QRectF touched;
    for (const QPolygonF &p : polys) {
        fillPolygonNonZero(dst, p, colour, blendMode, alpha, opt, QRect());
        touched = touched.united(polyBoundsRect(p));
    }
    return touched;
}

QRectF Rasterizer::clearRect(QImage &dst, const QRectF &rect, const FillOptions &opt)
{
    if (dst.isNull())
        return QRectF();
    const QRect area = rect.toAlignedRect().intersected(dst.rect());
    if (area.isEmpty())
        return QRectF();
    const double k = clampd(opt.globalAlpha, 0.0, 1.0);
    if (k >= 0.999) {
        for (int y = area.top(); y <= area.bottom(); ++y)
            memset(dst.scanLine(y) + area.left() * sizeof(quint32), 0,
                   size_t(area.width()) * sizeof(quint32));
    } else {
        for (int y = area.top(); y <= area.bottom(); ++y) {
            quint32 *row = reinterpret_cast<quint32 *>(dst.scanLine(y));
            for (int x = area.left(); x <= area.right(); ++x)
                row[x] = ::paint::destinationOut(row[x], 0xFFFFFFFFu, k);
        }
    }
    return rect;
}

// ===========================================================================
// Flood fill
// ===========================================================================

QRectF Rasterizer::floodFill(QImage &dst, const FillRequest &req, const FillOptions &opt)
{
    if (dst.isNull() || req.colour.alpha() == 0)
        return QRectF();

    const QRect bounds = dst.rect();
    if (!bounds.contains(req.seed.toPoint()))
        return QRectF();

    const double tol = qBound(0.0, double(req.tolerance) / 255.0, 1.0);
    const double tol2 = tol * tol * 3.0;

    const quint32 target = dst.pixel(req.seed.x(), req.seed.y());
    if (req.contiguous) {
        // Nothing to do when the seed already matches, but still return the seed.
    }

    QVector<bool> visited(bounds.width() * bounds.height(), false);
    QRectF touched;
    QVector<QPoint> stack;
    stack.append(req.seed.toPoint());
    touched |= QRectF(QPointF(req.seed.x(), req.seed.y()), QPointF(1.0, 1.0));

    const double fillA = req.colour.alphaF() * opt.globalAlpha;

    auto matches = [&](int x, int y) {
        const quint32 p = dst.pixel(x, y);
        const int da = int(p >> 24);
        if (req.alphaThreshold && da < req.minAlpha)
            return true; // transparent counts as fillable background
        const int ta = int(target >> 24);
        const double dr = (int((p >> 16) & 0xFF) - int((target >> 16) & 0xFF)) / 255.0;
        const double dg = (int((p >> 8) & 0xFF) - int((target >> 8) & 0xFF)) / 255.0;
        const double db = (int(p & 0xFF) - int(target & 0xFF)) / 255.0;
        const double dAl = (double(da) - double(ta)) / 255.0;
        return (dr * dr + dg * dg + db * db + dAl * dAl) <= tol2;
    };

    auto paint = [&](int x, int y) {
        quint32 *row = reinterpret_cast<quint32 *>(dst.scanLine(y));
        const double a = fillA;
        const quint32 src = (quint32(int(clampd(a * 255.0, 0.0, 255.0))) << 24)
                            | (quint32(int(req.colour.red() * a)) << 16)
                            | (quint32(int(req.colour.green() * a)) << 8)
                            | quint32(int(req.colour.blue() * a));
        row[x] = blendPixel(row[x], src, BlendNormal, 1.0);
    };

    if (!req.contiguous) {
        // Global replace.
        for (int y = bounds.top(); y <= bounds.bottom(); ++y) {
            for (int x = bounds.left(); x <= bounds.right(); ++x) {
                if (matches(x, y)) {
                    paint(x, y);
                    touched |= QRectF(QPointF(x, y), QPointF(1.0, 1.0));
                }
            }
        }
        return touched;
    }

    // Scanline span fill. Classic approach: pop a seed, expand left/right to find
// the full horizontal run, paint it, then for each pixel in the run probe the
// row above and the row below and push any new matching runs onto the stack.
// O(W*H) worst case, no recursion, no stack blow-ups.
    int fillMinX = req.seed.x(), fillMaxX = req.seed.x();
    int fillMinY = req.seed.y(), fillMaxY = req.seed.y();

    auto idxAt = [bounds](int x, int y) {
        return qint64(y - bounds.top()) * bounds.width() + (x - bounds.left());
    };

    auto fillRun = [&](int x, int y, int dir) {
        // dir = +1 checks the row below, dir = -1 checks the row above.
        int scan = y + dir;
        while (scan >= bounds.top() && scan <= bounds.bottom()) {
            int runStart = -1;
            for (int xx = bounds.left(); xx <= bounds.right(); ++xx) {
                const bool ok = !visited[idxAt(xx, scan)] && matches(xx, scan);
                if (ok && runStart < 0)
                    runStart = xx;
                if ((!ok || xx == bounds.right()) && runStart >= 0) {
                    const int runEnd = ok ? xx : xx - 1;
                    for (int px = runStart; px <= runEnd; ++px) {
                        visited[idxAt(px, scan)] = true;
                        paint(px, scan);
                    }
                    fillMinX = qMin(fillMinX, runStart);
                    fillMaxX = qMax(fillMaxX, runEnd);
                    fillMinY = qMin(fillMinY, scan);
                    fillMaxY = qMax(fillMaxY, scan);
                    stack.append(QPoint(runStart, scan));
                    runStart = -1;
                }
            }
            // Stop when the column at (x) no longer matches this row: that is
            // the classic scanline early exit and keeps us linear.
            if (!visited[idxAt(x, scan)] && !matches(x, scan))
                break;
            if (scan == y)
                break;
            scan += dir;
        }
        Q_UNUSED(x);
    };

    visited[idxAt(req.seed.x(), req.seed.y())] = true;
    paint(req.seed.x(), req.seed.y());
    stack.append(req.seed.toPoint());

    while (!stack.isEmpty()) {
        const QPoint s = stack.takeLast();
        const int sx = s.x();
        const int sy = s.y();

        // Expand to the full horizontal run from an already-painted pixel.
        int left = sx;
        while (left - 1 >= bounds.left() && !visited[idxAt(left - 1, sy)]
               && matches(left - 1, sy))
            --left;
        int right = sx;
        while (right + 1 <= bounds.right() && !visited[idxAt(right + 1, sy)]
               && matches(right + 1, sy))
            ++right;

        for (int px = left; px <= right; ++px) {
            if (!visited[idxAt(px, sy)]) {
                visited[idxAt(px, sy)] = true;
                paint(px, sy);
            }
        }
        fillMinX = qMin(fillMinX, left);
        fillMaxX = qMax(fillMaxX, right);
        fillMinY = qMin(fillMinY, sy);
        fillMaxY = qMax(fillMaxY, sy);

        for (int px = left; px <= right; ++px) {
            fillRun(px, sy, +1);
            fillRun(px, sy, -1);
        }
    }

    return QRectF(QPointF(fillMinX, fillMinY),
                  QPointF(fillMaxX + 1, fillMaxY + 1));
}

// ===========================================================================
// Compositing / masks / flatten
// ===========================================================================

void Rasterizer::compositeImage(QImage &dst, const QImage &src, const QRect &area,
                                int blendMode, double opacity, bool destinationOut)
{
    if (dst.isNull() || src.isNull() || area.isEmpty() || opacity <= 0.0)
        return;

    QImage in = src;
    if (in.format() != QImage::Format_ARGB32_Premultiplied)
        in = in.convertToFormat(QImage::Format_ARGB32_Premultiplied);

    const QRect a = area.intersected(dst.rect());
    if (a.isEmpty())
        return;

    for (int y = 0; y < a.height(); ++y) {
        const quint32 *srow = reinterpret_cast<const quint32 *>(in.constScanLine(a.top() + y));
        quint32 *drow = reinterpret_cast<quint32 *>(dst.scanLine(a.top() + y));
        for (int x = 0; x < a.width(); ++x) {
            const quint32 s = srow[x];
            if ((s >> 24) == 0 && blendMode == BlendNormal)
                continue;
            quint32 &d = drow[a.left() + x];
            d = destinationOut ? ::paint::destinationOut(d, s, opacity)
                               : blendPixel(d, s, blendMode, opacity);
        }
    }
}

void Rasterizer::applyMask(QImage &dst, const QImage &mask, const QRect &area, double strength)
{
    if (dst.isNull() || mask.isNull())
        return;
    const QRect a = area.isNull() ? dst.rect() : area.intersected(dst.rect());
    QImage m = mask;
    if (m.format() != QImage::Format_ARGB32_Premultiplied)
        m = m.convertToFormat(QImage::Format_ARGB32_Premultiplied);

    const double k = clampd(strength, 0.0, 1.0);
    for (int y = 0; y < a.height(); ++y) {
        const quint32 *mrow = reinterpret_cast<const quint32 *>(m.constScanLine(a.top() + y));
        quint32 *drow = reinterpret_cast<quint32 *>(dst.scanLine(a.top() + y));
        for (int x = 0; x < a.width(); ++x) {
            const quint32 d = drow[a.left() + x];
            const double da = double(d >> 24) / 255.0;
            if (da <= 0.0)
                continue;
            // Mask alpha drives coverage; mask colour is ignored (luminance-free).
            const double ma = double(mrow[x] >> 24) / 255.0;
            const double newA = da * (1.0 - k) + da * ma * k;
            const double scale = da > 1e-6 ? newA / da : 0.0;
            const int na = int(clampd(newA, 0.0, 1.0) * 255.0);
            const int nr = int(clampd(double((d >> 16) & 0xFF) * scale, 0.0, 255.0));
            const int ng = int(clampd(double((d >> 8) & 0xFF) * scale, 0.0, 255.0));
            const int nb = int(clampd(double(d & 0xFF) * scale, 0.0, 255.0));
            drow[a.left() + x] = (quint32(na) << 24) | (quint32(nr) << 16)
                                 | (quint32(ng) << 8) | quint32(nb);
        }
    }
}

QImage Rasterizer::flatten(const QVector<QImage> &layers, const QVector<double> &opacities,
                           const QVector<int> &blendModes, const QSize &size)
{
    QImage out = createLayer(size, QColor(0, 0, 0, 0));
    for (int i = 0; i < layers.size(); ++i) {
        const QImage &l = layers.at(i);
        if (l.isNull())
            continue;
        const double op = (i < opacities.size()) ? qBound(0.0, opacities.at(i), 1.0) : 1.0;
        if (op <= 0.0)
            continue;
        const int bm = (i < blendModes.size()) ? blendModes.at(i) : int(BlendNormal);
        compositeImage(out, l, l.rect(), bm, op, false);
    }
    return out;
}

// ===========================================================================
// Textures
// ===========================================================================

QImage Rasterizer::makeNoiseTile(int size, quint64 seed, int mode)
{
    const int n = qBound(8, size, 512);
    QImage tile(n, n, QImage::Format_ARGB32);
    tile.fill(Qt::black);

    // Integer hash -> uniform double in [0,1). Deterministic and portable.
    auto rand01 = [seed](quint32 x, quint32 y, quint32 salt) -> double {
        quint64 h = seed;
        h ^= quint64(x) * 0x9E3779B97F4A7C15ull;
        h = (h << 31) | (h >> 33);
        h ^= quint64(y) * 0xC2B2AE3D27D4EB4Full;
        h ^= quint64(salt) * 0x165667B19E3779F9ull;
        h *= 0xFF51AFD7ED558CCDull;
        h ^= h >> 33;
        h *= 0xC4CEB9FE1A85EC53ull;
        h ^= h >> 33;
        return double(h & 0xFFFFFFFFull) / 4294967296.0;
    };

    for (int y = 0; y < n; ++y) {
        quint8 *row = tile.scanLine(y);
        for (int x = 0; x < n; ++x) {
            int v = 0;
            switch (mode) {
            case 1: {   // value noise: bilinear interpolation of hash corners
                const double fx = double(x) / n * 8.0;
                const double fy = double(y) / n * 8.0;
                const int ix = int(fx), iy = int(fy);
                const double tx = fx - ix, ty = fy - iy;
                const double a = rand01(quint32(ix), quint32(iy), 1);
                const double b = rand01(quint32(ix + 1), quint32(iy), 1);
                const double c = rand01(quint32(ix), quint32(iy + 1), 1);
                const double d = rand01(quint32(ix + 1), quint32(iy + 1), 1);
                const double sx = tx * tx * (3 - 2 * tx);
                const double sy = ty * ty * (3 - 2 * ty);
                const double top = a + (b - a) * sx;
                const double bot = c + (d - c) * sx;
                v = int((top + (bot - top) * sy) * 255.0);
                break;
            }
            case 2: {   // fibre streaks along X
                const double a = rand01(0, quint32(y), 7);
                const double b = rand01(quint32(x), 0, 13);
                v = int(clampd(0.5 + (a - 0.5) * 0.7 + (b - 0.5) * 0.3, 0.0, 1.0) * 255.0);
                break;
            }
            case 3:     // paper grain
            default:
                v = int(clampd(0.35 + 0.65 * rand01(quint32(x), quint32(y), 3), 0.0, 1.0) * 255.0);
                break;
            }
            row[x] = quint8(qBound(0, v, 255));
        }
    }
    return tile;
}

QImage Rasterizer::makeDabSprite(int size, double hardness)
{
    const int n = qBound(8, size, 512);
    QImage img(n, n, QImage::Format_ARGB32_Premultiplied);
    const double c = (n - 1) * 0.5;
    const double r = c;
    for (int y = 0; y < n; ++y) {
        quint32 *row = reinterpret_cast<quint32 *>(img.scanLine(y));
        for (int x = 0; x < n; ++x) {
            const double d = std::hypot(x - c, y - c) / qMax(r, 1e-6);
            double a = 1.0;
            if (d > 1.0)
                a = 0.0;
            else if (hardness < 0.999)
                a = std::pow(1.0 - d, 1.0 + (1.0 - hardness) * 8.0);
            const int ai = int(clampd(a, 0.0, 1.0) * 255.0);
            row[x] = (quint32(ai) << 24) | 0x00FFFFFFu;
        }
    }
    return img;
}

} // namespace paint