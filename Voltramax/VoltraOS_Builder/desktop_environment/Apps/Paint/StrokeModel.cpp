#include "StrokeModel.h"

#include <QBuffer>
#include <QDataStream>
#include <QDateTime>
#include <QFile>
#include <QVector>
#include <QtEndian>

#include <atomic>
#include <cmath>
#include <limits>

namespace paint {

// ===========================================================================
// StrokeStyle / Stroke metrics
// ===========================================================================

qint64 StrokeStyle::byteSize() const
{
    // Fixed record: colour (4) + 9 doubles (72) + 5 doubles of dynamics (40)
    // + nib block (32) + texture/seed (16) + enum fields (12).
    return 4 + 72 + 40 + 32 + 16 + 12;
}

double Stroke::length() const
{
    if (cachedLength >= 0.0)
        return cachedLength;
    cachedLength = 0.0;
    for (int i = 1; i < points.size(); ++i) {
        const QPointF d = points.at(i).pos - points.at(i - 1).pos;
        cachedLength += std::hypot(d.x(), d.y());
    }
    return cachedLength;
}

QRectF Stroke::bounds() const
{
    if (boundsValid)
        return cachedBounds;
    cachedBounds = StrokeModel::computeBounds(points, style);
    boundsValid = true;
    return cachedBounds;
}

QRectF Stroke::paintBounds() const
{
    return expandForPen(bounds(), style.baseSize);
}

QPointF Stroke::centre() const
{
    const QRectF b = bounds();
    return QPointF(b.center().x(), b.center().y());
}

qint64 Stroke::byteSize() const
{
    return style.byteSize() + qint64(points.size()) * StrokeModel::kPointRecordBytes;
}

// Small helper kept private to the translation unit.
static QVector<QPointF> positionsOf(const QVector<StrokePoint> &pts)
{
    QVector<QPointF> out;
    out.reserve(pts.size());
    for (const StrokePoint &p : pts)
        out.append(p.pos);
    return out;
}



// ===========================================================================
// Sampling
// ===========================================================================

QVector<StrokePoint> StrokeModel::smooth(const QVector<StrokePoint> &in,
                                         double minCutoff, double beta, double dCutoff)
{
    if (in.size() < 3)
        return in;

    // One Euro filter, standard formulation:
    //   dx_hat = lowpass(dx, alpha(dCutoff))
    //   cutoff = minCutoff + beta * |dx_hat|
    //   x_hat  = lowpass(x, alpha(cutoff))
    const double dt = 0.004; // 250 Hz coalesced-event floor
    auto alphaFor = [dt](double cutoff) {
        const double tau = 1.0 / (2.0 * M_PI * qMax(cutoff, 1e-3));
        return 1.0 / (1.0 + tau / dt);
    };

    const double aD = alphaFor(dCutoff);

    QVector<StrokePoint> out;
    out.reserve(in.size());
    out.append(in.first());

    double hx = in.first().pos.x();
    double hy = in.first().pos.y();
    double hp = in.first().pressure;
    double hvx = 0.0;
    double hvy = 0.0;

    for (int i = 1; i < in.size(); ++i) {
        const StrokePoint &cur = in.at(i);
        const StrokePoint &prev = in.at(i - 1);

        const double rawVx = (cur.pos.x() - prev.pos.x()) / dt;
        const double rawVy = (cur.pos.y() - prev.pos.y()) / dt;
        hvx = aD * rawVx + (1.0 - aD) * hvx;
        hvy = aD * rawVy + (1.0 - aD) * hvy;

        const double speed = std::hypot(hvx, hvy);
        const double cutoff = minCutoff + beta * speed;
        const double a = alphaFor(cutoff);

        hx = a * cur.pos.x() + (1.0 - a) * hx;
        hy = a * cur.pos.y() + (1.0 - a) * hy;
        hp = a * cur.pressure + (1.0 - a) * hp;

        StrokePoint s = cur;
        s.pos = QPointF(hx, hy);
        s.pressure = float(hp);
        // Tilt and twist are already smooth signals from the digitiser; copying
        // them raw keeps the chisel nib responsive.
        out.append(s);
    }
    return out;
}

double StrokeModel::perpendicularError(const QVector<StrokePoint> &pts, int first, int last)
{
    if (last - first < 2)
        return 0.0;

    // Work on a locally resampled, arc-length parameterised copy so that a slow
    // drift with many samples counts the same as a fast jump with few.
    QVector<QPointF> seg;
    seg.reserve(last - first + 1);
    for (int i = first; i <= last; ++i)
        seg.append(pts.at(i).pos);

    // Resample at ~1px.
    QVector<QPointF> rs;
    double acc = 0.0;
    rs.append(seg.first());
    for (int i = 1; i < seg.size(); ++i) {
        const QPointF &a = seg.at(i - 1);
        const QPointF &b = seg.at(i);
        const double len = std::hypot(b.x() - a.x(), b.y() - a.y());
        if (len < 1e-9)
            continue;
        acc += len;
        if (acc >= 1.0) {
            acc = 0.0;
            rs.append(b);
        }
    }
    if (rs.size() < 2)
        return 0.0;

    // Distance of every resampled point from the chord first..last.
    const QPointF a = seg.first();
    const QPointF b = seg.last();
    double maxErr = 0.0;
    for (const QPointF &p : rs)
        maxErr = qMax(maxErr, distanceToSegment(p, a, b));
    return maxErr;
}

QVector<StrokePoint> StrokeModel::simplify(const QVector<StrokePoint> &in, double epsilon)
{
    if (in.size() < 3 || epsilon <= 0.0)
        return in;

    QVector<bool> keep(in.size(), false);
    keep[0] = true;
    keep[in.size() - 1] = true;

    struct Frame { int first; int last; };
    QVector<Frame> stack;
    stack.append({ 0, in.size() - 1 });

    while (!stack.isEmpty()) {
        const Frame f = stack.takeLast();
        const double err = perpendicularError(in, f.first, f.last);
        if (err <= epsilon)
            continue;

        // Split at the point furthest from the chord.
        int split = -1;
        double best = 0.0;
        for (int i = f.first + 1; i < f.last; ++i) {
            const double d = distanceToSegment(in.at(i).pos, in.at(f.first).pos,
                                               in.at(f.last).pos);
            if (d > best) { best = d; split = i; }
        }
        if (split <= f.first || split >= f.last)
            continue;
        keep[split] = true;
        stack.append({ f.first, split });
        stack.append({ split, f.last });
    }

    QVector<StrokePoint> out;
    out.reserve(keep.count(true));

    // Re-interpolate the dropped attributes linearly between the kept points so
    // that pressure/tilt/twist still follow the original motion.
    int k = 0;
    while (k < in.size()) {
        if (keep[k]) {
            out.append(in.at(k));
            ++k;
            continue;
        }
        int next = k;
        while (next < in.size() && !keep[next])
            ++next;
        if (next >= in.size()) {
            out.append(in.last());
            break;
        }
        const StrokePoint &a = in.at(k - 1);
        const StrokePoint &b = in.at(next);
        const double span = double(b.t - a.t);
        const double ratio = span > 1e-6 ? double(in.at(k).t - a.t) / span : 0.0;

        for (int i = k; i < next; ++i) {
            const double local = span > 1e-6 ? double(in.at(i).t - a.t) / span : 0.0;
            StrokePoint s = in.at(i);
            s.pressure = float(lerp(a.pressure, b.pressure, local));
            s.tiltAzimuth = float(lerp(a.tiltAzimuth, b.tiltAzimuth, local));
            s.tiltAltitude = float(lerp(a.tiltAltitude, b.tiltAltitude, local));
            s.twist = float(lerp(a.twist, b.twist, local));
            Q_UNUSED(ratio);
            out.append(s);
        }
        k = next;
    }
    return out;
}

QVector<StrokePoint> StrokeModel::resample(const QVector<StrokePoint> &in, double spacing)
{
    if (in.size() < 2 || spacing <= 0.05)
        return in;

    QVector<StrokePoint> out;
    out.reserve(in.size() * 2);
    out.append(in.first());

    double carry = 0.0;
    for (int i = 1; i < in.size(); ++i) {
        const StrokePoint &a = in.at(i - 1);
        const StrokePoint &b = in.at(i);
        QPointF seg = b.pos - a.pos;
        double segLen = std::hypot(seg.x(), seg.y());
        if (segLen < 1e-9) {
            out.append(b);
            continue;
        }
        const QPointF dir(seg.x() / segLen, seg.y() / segLen);

        double travelled = -carry;
        while (travelled + spacing <= segLen) {
            travelled += spacing;
            const double f = travelled / segLen;
            StrokePoint s;
            s.pos = QPointF(lerp(a.pos.x(), b.pos.x(), f), lerp(a.pos.y(), b.pos.y(), f));
            s.pressure = float(lerp(a.pressure, b.pressure, f));
            s.tiltAzimuth = float(lerp(a.tiltAzimuth, b.tiltAzimuth, f));
            s.tiltAltitude = float(lerp(a.tiltAltitude, b.tiltAltitude, f));
            s.twist = float(lerp(a.twist, b.twist, f));
            s.t = qint64(lerp(double(a.t), double(b.t), f));
            s.pointerKind = a.pointerKind;
            s.eraser = a.eraser;
            out.append(s);
        }
        carry = segLen - travelled;
    }

    const StrokePoint &last = in.last();
    if (out.isEmpty() || (out.last().pos - last.pos).manhattanLength() > 1e-6)
        out.append(last);
    return out;
}

QVector<double> StrokeModel::arcLengths(const QVector<StrokePoint> &pts)
{
    QVector<double> out;
    out.reserve(pts.size());
    double acc = 0.0;
    for (int i = 0; i < pts.size(); ++i) {
        if (i > 0) {
            const QPointF d = pts.at(i).pos - pts.at(i - 1).pos;
            acc += std::hypot(d.x(), d.y());
        }
        out.append(acc);
    }
    return out;
}

double StrokeModel::averageSpeed(const QVector<StrokePoint> &pts)
{
    if (pts.size() < 2)
        return 0.0;
    const double dt = double(pts.last().t - pts.first().t) / 1000.0;
    if (dt <= 1e-6)
        return 0.0;
    return polylineLength(positionsOf(pts)) / dt;
}

// ===========================================================================
// Dynamics
// ===========================================================================

void StrokeModel::nibFootprint(const StrokeStyle &style, const StrokePoint &p,
                              double radius, double *majorOut, double *minorOut,
                              double *angleOut)
{
    const double tilt = p.tiltAmount();

    if (style.nib == NibChisel || style.nib == NibFountain) {
        // The nib is a flat edge. Its long axis follows the projected tilt
        // vector, so leaning the pen genuinely changes the footprint shape,
        // not just the size.
        const QPointF lean = p.leanVector();
        const double angle = std::atan2(lean.y(), lean.x()) * 180.0 / M_PI;
        const double gain = 1.0 + style.tiltSizeGain * tilt * 1.8;
        const double major = radius * gain;
        const double minor = major * clampd(style.nibRatio * (1.0 - 0.45 * tilt),
                                            0.05, 1.0);
        if (majorOut) *majorOut = major;
        if (minorOut) *minorOut = style.nib == NibFountain
                                       ? major * clampd(style.nibRatio + 0.35 * tilt, 0.05, 1.0)
                                       : minor;
        if (angleOut) *angleOut = angle + (style.nibAngle - 45.0);
        return;
    }

    if (style.nib == NibBlunt) {
        // Wide, strongly azimuth dependent, no rotation of the footprint.
        const double gain = 1.0 + style.tiltSizeGain * tilt * 2.4;
        const double major = radius * gain;
        if (majorOut) *majorOut = major;
        if (minorOut) *minorOut = major * clampd(1.0 - 0.55 * tilt, 0.08, 1.0);
        if (angleOut) *angleOut = style.nibAngle;
        return;
    }

    // Round nib: tilt only changes the size, and very little at that.
    const double gain = 1.0 + style.tiltSizeGain * tilt * 0.35;
    if (majorOut) *majorOut = radius * gain;
    if (minorOut) *minorOut = radius * gain;
    if (angleOut) *angleOut = 0.0;
}

DynamicsSample StrokeModel::evaluateDynamics(const StrokeStyle &style, const StrokePoint &p,
                                             double speedPxPerMs, double prevWidthScale)
{
    DynamicsSample d;
    d.pressure = qBound(0.0f, p.pressure, 1.0f);
    d.tilt = float(p.tiltAmount());
    d.twist = p.twist;
    d.speed = float(speedPxPerMs);

    // --- width from pressure -------------------------------------------
    // A gamma-shaped response: light touches stay thin but visible, heavy
    // touches swell fast. depth 0 => constant width, 1 => full range.
    const double pr = double(d.pressure);
    double width = 1.0;
    if (style.sizePressureDepth > 0.0) {
        const double shaped = std::pow(qMax(pr, 0.015), 0.62);
        width = lerp(1.0, lerp(0.14, 2.35, shaped), clampd(style.sizePressureDepth, 0.0, 1.0));
    }

    // --- width from velocity -------------------------------------------
    // Real pens thin out when flicked. Normalised against 3 px/ms.
    if (style.velocityThinning > 0.0) {
        const double v = clampd(speedPxPerMs / 3.0, 0.0, 1.0);
        width *= lerp(1.0, lerp(1.0, 0.55, v), clampd(style.velocityThinning, 0.0, 1.0));
    }

    // --- width from tilt -------------------------------------------------
    if (style.tiltSizeGain > 0.0)
        width *= (1.0 + style.tiltSizeGain * d.tilt * 0.55);

    // Smooth the width signal a little: a single-sample spike reads as a
    // blob, real ink does not do that.
    if (prevWidthScale > 0.0)
        width = lerp(prevWidthScale, width, 0.55);

    d.widthScale = float(clampd(width, 0.05, 3.0));

    // --- flow from pressure ---------------------------------------------
    double flow = 1.0;
    if (style.flowPressureDepth > 0.0) {
        flow = lerp(1.0, lerp(0.22, 1.0, std::pow(pr, 0.75)),
                    clampd(style.flowPressureDepth, 0.0, 1.0));
    }
    if (style.tiltFlowGain > 0.0)
        flow *= (1.0 - style.tiltFlowGain * d.tilt * 0.5);
    d.flowScale = float(clampd(flow, 0.0, 1.0));

    // --- colour jitter ----------------------------------------------------
    QColor c = style.colour;
    if (style.hueJitter > 0.0 || style.saturationJitter > 0.0 || style.valueJitter > 0.0) {
        // Deterministic per-sample jitter derived from the seed and the sample
        // timestamp: reproducible on undo/redo and across devices.
        quint32 h = quint32(p.t) * 2654435761u ^ quint32(style.seed);
        h ^= h >> 15;
        h *= 2246822519u;
        h ^= h >> 13;
        const double n1 = double(h & 0xFFFF) / 65535.0 * 2.0 - 1.0;
        h = h * 1664525u + 1013904223u;
        const double n2 = double(h & 0xFFFF) / 65535.0 * 2.0 - 1.0;
        h = h * 1664525u + 1013904223u;
        const double n3 = double(h & 0xFFFF) / 65535.0 * 2.0 - 1.0;

        QColor hsv = c.toHsv();
        hsv[0] = int(std::fmod(hsv[0] + n1 * style.hueJitter * 30.0 + 360.0, 360.0));
        hsv[1] = qBound(0, hsv[1] + int(n2 * style.saturationJitter * 40.0), 255);
        hsv[2] = qBound(0, hsv[2] + int(n3 * style.valueJitter * 55.0), 255);
        QColor out = QColor::fromHsv(hsv[0], hsv[1], hsv[2]);
        out.setAlpha(c.alpha());
        c = out;
    }
    d.tint = c;
    return d;
}

// ===========================================================================
// Outline generation
// ===========================================================================

// ===========================================================================
// Geometry: bounds, hit testing, transforms
// ===========================================================================

QRectF StrokeModel::computeBounds(const QVector<StrokePoint> &pts, const StrokeStyle &style)
{
    if (pts.isEmpty())
        return QRectF();

    double minX = pts.first().pos.x();
    double minY = pts.first().pos.y();
    double maxX = minX;
    double maxY = minY;
    double maxR = 0.0;

    for (const StrokePoint &p : pts) {
        minX = qMin(minX, p.pos.x());
        minY = qMin(minY, p.pos.y());
        maxX = qMax(maxX, p.pos.x());
        maxY = qMax(maxY, p.pos.y());
        const DynamicsSample d = evaluateDynamics(style, p, 0.0, -1.0);
        maxR = qMax(maxR, style.baseSize * 0.5 * double(d.widthScale));
    }

    // A chisel nib can reach further than the round equivalent, so include it.
    if (style.nib != NibRound) {
        for (const StrokePoint &p : pts) {
            double major = 0.0, minor = 0.0, angle = 0.0;
            const DynamicsSample d = evaluateDynamics(style, p, 0.0, -1.0);
            nibFootprint(style, p, style.baseSize * 0.5 * d.widthScale, &major, &minor, &angle);
            maxR = qMax(maxR, major);
        }
    }

    maxR = qMax(maxR, style.baseSize * 0.5) + 1.0; // +1px for AA skirt
    return QRectF(minX - maxR, minY - maxR,
                  (maxX - minX) + 2.0 * maxR,
                  (maxY - minY) + 2.0 * maxR);
}

double StrokeModel::distanceToStroke(const QVector<StrokePoint> &pts,
                                     const StrokeStyle &style, const QPointF &p)
{
    if (pts.isEmpty())
        return std::numeric_limits<double>::max();
    if (pts.size() == 1)
        return std::hypot(pts.first().pos.x() - p.x(), pts.first().pos.y() - p.y());

    // Minimum distance, with the local radius subtracted so that a wide nib is
    // genuinely easier to hit with a finger than a thin one.
    double best = std::numeric_limits<double>::max();
    for (int i = 1; i < pts.size(); ++i) {
        const double d = distanceToSegment(p, pts.at(i - 1).pos, pts.at(i).pos);
        const DynamicsSample dyn = evaluateDynamics(style, pts.at(i), 0.0, -1.0);
        best = qMin(best, d - style.baseSize * 0.5 * dyn.widthScale);
    }
    return best;
}

bool StrokeModel::hitTest(const QVector<StrokePoint> &pts, const StrokeStyle &style,
                          const QPointF &p, double slack)
{
    return distanceToStroke(pts, style, p) <= slack;
}

bool StrokeModel::hitTestOutline(const QVector<QPointF> &outline, const QPointF &p)
{
    if (outline.size() < 3)
        return false;

    // Crossing-number test.
    bool inside = false;
    for (int i = 0, j = outline.size() - 1; i < outline.size(); j = i++) {
        const QPointF &a = outline.at(i);
        const QPointF &b = outline.at(j);
        if (((a.y() > p.y()) != (b.y() > p.y()))
            && (p.x() < (b.x() - a.x()) * (p.y() - a.y()) / (b.y() - a.y() + 1e-12) + a.x()))
            inside = !inside;
    }
    return inside;
}

bool StrokeModel::isSelfIntersecting(const QVector<StrokePoint> &pts)
{
    const int n = pts.size();
    if (n < 4)
        return false;

    // Span check first so this stays near-linear for ordinary strokes.
    const QRectF all = QRectF(QPointF(pts.first().pos), QPointF(pts.last().pos)).normalized();
    for (int i = 0; i < n - 2; ++i) {
        const QPointF &a1 = pts.at(i).pos;
        const QPointF &a2 = pts.at(i + 1).pos;
        for (int j = i + 2; j < n - 1; ++j) {
            const QPointF &b1 = pts.at(j).pos;
            const QPointF &b2 = pts.at(j + 1).pos;
            const QRectF ra(QRectF(a1, a2).normalized());
            const QRectF rb(QRectF(b1, b2).normalized());
            if (!ra.intersects(rb))
                continue;

            // Proper segment intersection via the sign of the cross products.
            auto orient = [](const QPointF &a, const QPointF &b, const QPointF &c) {
                const double v = (b.y() - a.y()) * (c.x() - b.x())
                                 - (b.x() - a.x()) * (c.y() - b.y());
                return v > 1e-9 ? 1 : (v < -1e-9 ? -1 : 0);
            };
            const int o1 = orient(a1, a2, b1);
            const int o2 = orient(a1, a2, b2);
            const int o3 = orient(b1, b2, a1);
            const int o4 = orient(b1, b2, a2);
            if (o1 != o2 && o3 != o4)
                return true;
        }
    }
    Q_UNUSED(all);
    return false;
}

// ===========================================================================
// Transforms
// ===========================================================================

QVector<StrokePoint> StrokeModel::transformedPoints(const QVector<StrokePoint> &pts,
                                                    const QTransform &m, double rotationDelta)
{
    QVector<StrokePoint> out;
    out.reserve(pts.size());
    for (const StrokePoint &p : pts) {
        StrokePoint s = p;
        s.pos = m.map(QPointF(p.pos));
        // Anisotropic scale would make azimuth meaningless, so the rotation is
        // carried explicitly.
        if (rotationDelta != 0.0) {
            s.tiltAzimuth = float(std::fmod(p.tiltAzimuth + rotationDelta + 360.0, 360.0));
            s.twist = float(std::fmod(p.twist + rotationDelta + 360.0, 360.0));
        }
        out.append(s);
    }
    return out;
}

Stroke StrokeModel::transformed(const Stroke &s, const QTransform &m, double rotationDelta)
{
    Stroke out = s;
    out.points = transformedPoints(s.points, m, rotationDelta);
    out.style.baseSize = s.style.baseSize;
    out.invalidate();
    return out;
}

void StrokeModel::transform(Stroke &s, const QTransform &m, double rotationDelta,
                            double scaleX, double scaleY)
{
    Q_UNUSED(scaleX);
    Q_UNUSED(scaleY);
    s.points = transformedPoints(s.points, m, rotationDelta);
    // Scale the nib by the mean of the two axes: for uniform scale this is
    // exact, and for anisotropic it is the least-wrong single number.
    const double sx = std::hypot(m.m11(), m.m12());
    const double sy = std::hypot(m.m21(), m.m22());
    s.style.baseSize *= (sx + sy) * 0.5;
    s.invalidate();
}

// ===========================================================================
// Serialisation - "VPS1" stroke block, see README section 7.2
// ===========================================================================

namespace {

void writeColour(QDataStream &s, const QColor &c)
{
    const quint32 argb = (quint32(c.alpha()) << 24) | (quint32(c.red()) << 16)
                         | (quint32(c.green()) << 8) | quint32(c.blue());
    s << argb;
}

QColor readColour(QDataStream &s, bool *ok)
{
    quint32 argb = 0;
    s >> argb;
    if (s.status() != QDataStream::Ok) {
        if (ok) *ok = false;
        return QColor(Qt::black);
    }
    return QColor(int((argb >> 16) & 0xFF), int((argb >> 8) & 0xFF), int(argb & 0xFF),
                  int((argb >> 24) & 0xFF));
}

} // namespace

QByteArray StrokeModel::serialise(const Stroke &s)
{
    QByteArray bytes;
    QDataStream out(&bytes, QIODevice::WriteOnly);
    out.setByteOrder(QDataStream::LittleEndian);
    out.setFloatingPointPrecision(QDataStream::SinglePrecision);

    out << kFormatMagic;
    out << quint16(1);              // record version
    out << quint32(s.id);
    out << quint8(s.kind);
    out << quint8(s.closed ? 1 : 0);

    // --- style -----------------------------------------------------------
    writeColour(out, s.style.colour);
    out << s.style.baseSize << s.style.sizeJitter << s.style.flow << s.style.opacity
        << s.style.spacing << s.style.hardness;
    out << quint8(s.style.cap) << quint8(s.style.join) << quint16(s.style.blendMode);
    out << s.style.sizePressureDepth << s.style.flowPressureDepth
        << s.style.velocityThinning;
    out << s.style.hueJitter << s.style.saturationJitter << s.style.valueJitter;
    out << quint8(s.style.nib) << s.style.nibAngle << s.style.nibRatio
        << s.style.tiltSizeGain << s.style.tiltFlowGain;
    out << quint32(s.style.textureIndex);
    out << quint64(s.style.seed);
    out << quint8(s.style.eraserMode ? 1 : 0);

    // --- points ----------------------------------------------------------
    out << quint32(s.points.size());
    for (const StrokePoint &p : s.points) {
        out << float(p.pos.x()) << float(p.pos.y());
        out << p.pressure;
        out << p.tiltAzimuth << p.tiltAltitude;
        out << p.twist;
        out << quint64(p.t);
        out << quint8(p.pointerKind) << quint8(p.eraser ? 1 : 0);
    }
    return bytes;
}

QByteArray StrokeModel::serialiseList(const QVector<Stroke> &list)
{
    QByteArray bytes;
    QDataStream out(&bytes, QIODevice::WriteOnly);
    out.setByteOrder(QDataStream::LittleEndian);
    out.setFloatingPointPrecision(QDataStream::SinglePrecision);
    out << kFormatMagic;
    out << quint16(1);
    out << quint32(list.size());
    // Each record is length-prefixed so a reader can skip forward without
    // knowing the record layout. This is what makes a partially written file
    // recoverable: everything up to the last intact prefix still parses.
    for (const Stroke &s : list) {
        const QByteArray rec = serialise(s);
        out << quint32(rec.size());
        out.writeRawData(rec.constData(), rec.size());
    }
    return bytes;
}

bool StrokeModel::deserialise(const QByteArray &data, Stroke *out, QString *error)
{
    if (!out)
        return false;
    QDataStream in(data);
    in.setByteOrder(QDataStream::LittleEndian);
    in.setFloatingPointPrecision(QDataStream::SinglePrecision);

    quint32 magic = 0;
    in >> magic;
    if (magic != kFormatMagic) {
        if (error) *error = QStringLiteral("bad stroke magic");
        return false;
    }
    quint16 ver = 0;
    in >> ver;
    if (ver != 1) {
        if (error) *error = QStringLiteral("unsupported stroke version %1").arg(ver);
        return false;
    }

    Stroke s;
    quint8 kind = 0, closed = 0;
    in >> s.id >> kind >> closed;
    s.kind = StrokeKind(kind);
    s.closed = closed != 0;

    bool ok = true;
    s.style.colour = readColour(in, &ok);
    in >> s.style.baseSize >> s.style.sizeJitter >> s.style.flow >> s.style.opacity
       >> s.style.spacing >> s.style.hardness;
    quint8 cap = 0, join = 0, nib = 0, eraser = 0;
    quint16 blend = 0;
    in >> cap >> join >> blend;
    s.style.cap = CapStyleId(cap);
    s.style.join = JoinStyleId(join);
    s.style.blendMode = int(blend);
    in >> s.style.sizePressureDepth >> s.style.flowPressureDepth >> s.style.velocityThinning
       >> s.style.hueJitter >> s.style.saturationJitter >> s.style.valueJitter;
    in >> nib >> s.style.nibAngle >> s.style.nibRatio >> s.style.tiltSizeGain
       >> s.style.tiltFlowGain;
    s.style.nib = NibModeId(nib);
    in >> s.style.textureIndex >> s.style.seed >> eraser;
    s.style.eraserMode = eraser != 0;

    quint32 count = 0;
    in >> count;
    if (in.status() != QDataStream::Ok) {
        if (error) *error = QStringLiteral("truncated stroke header");
        return false;
    }
    // Sanity bound: 8M points is ~350MB, far beyond any real stroke.
    if (count > 8000000u) {
        if (error) *error = QStringLiteral("implausible point count");
        return false;
    }

    s.points.reserve(int(count));
    for (quint32 i = 0; i < count; ++i) {
        StrokePoint p;
        float fx = 0.0f, fy = 0.0f;
        in >> fx >> fy >> p.pressure >> p.tiltAzimuth >> p.tiltAltitude >> p.twist;
        quint64 t = 0;
        quint8 kindPtr = 0, er = 0;
        in >> t >> kindPtr >> er;
        p.pos = QPointF(double(fx), double(fy));
        p.t = qint64(t);
        p.pointerKind = kindPtr;
        p.eraser = er != 0;
        s.points.append(p);
    }
    if (in.status() != QDataStream::Ok) {
        if (error) *error = QStringLiteral("truncated stroke points");
        return false;
    }
    s.invalidate();
    *out = s;
    return true;
}

bool StrokeModel::deserialiseList(const QByteArray &data, QVector<Stroke> *out, QString *error)
{
    if (!out)
        return false;
    QDataStream in(data);
    in.setByteOrder(QDataStream::LittleEndian);
    in.setFloatingPointPrecision(QDataStream::SinglePrecision);

    quint32 magic = 0;
    quint16 ver = 0;
    in >> magic >> ver;
    if (magic != kFormatMagic || ver != 1) {
        if (error) *error = QStringLiteral("not a stroke list block");
        return false;
    }
    quint32 count = 0;
    in >> count;
    if (count > 100000u) {
        if (error) *error = QStringLiteral("implausible stroke count");
        return false;
    }

    QVector<Stroke> list;
    list.reserve(int(count));
    for (quint32 i = 0; i < count; ++i) {
        quint32 len = 0;
        in >> len;
        if (in.status() != QDataStream::Ok || len == 0 || len > 512u * 1024u * 1024u) {
            if (error) *error = QStringLiteral("stroke %1 of %2: bad record length").arg(i).arg(count);
            return false;
        }
        const QByteArray rec = in.read(len);
        Stroke s;
        QString subError;
        if (!deserialise(rec, &s, &subError)) {
            if (error) *error = QStringLiteral("stroke %1 of %2: %3").arg(i).arg(count).arg(subError);
            return false;
        }
        list.append(s);
    }
    // Keep the id counter ahead of anything we just read.
    quint32 high = 1;
    for (const Stroke &s : list)
        high = qMax(high, s.id);
    g_nextId.store(high + 1, std::memory_order_relaxed);
    *out = list;
    return true;
}

std::atomic<quint32> g_nextId{1};

quint32 StrokeModel::nextId()
{
    return g_nextId.fetch_add(1, std::memory_order_relaxed);
}

void StrokeModel::resetIdCounter(quint32 base)
{
    g_nextId.store(base ? base : 1, std::memory_order_relaxed);
}

QVector<QPointF> StrokeModel::capPoints(const QPointF &centre, const QPointF &dir,
                                        double radius, CapStyleId cap)
{
    QVector<QPointF> out;
    if (radius <= 0.01)
        return out;

    const QPointF n = perpendicular(dir);
    switch (cap) {
    case CapFlat:
        out.append(centre - n * radius);
        out.append(centre + n * radius);
        break;
    case CapSquare: {
        const QPointF ext = dir * radius;
        out.append(centre - n * radius - ext);
        out.append(centre - n * radius + ext);
        out.append(centre + n * radius + ext);
        out.append(centre + n * radius - ext);
        break;
    }
    case CapRound:
    default: {
        // Semicircle from +n to -n going through +dir.
        const int steps = qMax(6, int(qCeil(radius * 1.6)) + 6);
        const double base = std::atan2(n.y(), n.x());
        for (int i = 0; i <= steps; ++i) {
            const double a = base - M_PI * double(i) / steps;
            out.append(centre + QPointF(std::cos(a), std::sin(a)) * radius);
        }
        break;
    }
    }
    return out;
}

QVector<QPointF> StrokeModel::joinPoints(const QPointF &prev, const QPointF &curr,
                                         const QPointF &next, double r0, double r1,
                                         JoinStyleId join, double miterLimit)
{
    QVector<QPointF> out;
    const QPointF d0 = curr - prev;
    const QPointF d1 = next - curr;
    const double l0 = std::hypot(d0.x(), d0.y());
    const double l1 = std::hypot(d1.x(), d1.y());
    if (l0 < 1e-9 || l1 < 1e-9)
        return out;

    const QPointF u0(d0.x() / l0, d0.y() / l0);
    const QPointF u1(d1.x() / l1, d1.y() / l1);
    const double cross = u0.x() * u1.y() - u0.y() * u1.x();
    if (std::fabs(cross) < 1e-6)
        return out; // collinear, nothing to fill

    const QPointF n0 = perpendicular(u0);
    const QPointF n1 = perpendicular(u1);
    const double side = cross > 0.0 ? -1.0 : 1.0;

    if (join == JoinRound) {
        // Arc on the outer side of the turn, from n0 to n1.
        const double a0 = std::atan2(n0.y() * side, n0.x() * side);
        const double a1 = std::atan2(n1.y() * side, n1.x() * side);
        double da = a1 - a0;
        while (da > M_PI) da -= 2.0 * M_PI;
        while (da < -M_PI) da += 2.0 * M_PI;
        const int steps = qBound(3, int(std::fabs(da) / 0.35) + 2, 32);
        for (int i = 1; i < steps; ++i) {
            const double a = a0 + da * double(i) / steps;
            const double r = lerp(r0, r1, double(i) / steps);
            out.append(curr + QPointF(std::cos(a), std::sin(a)) * r * side);
        }
        return out;
    }

    // Bevel / miter: explicit corner points.
    const QPointF p0 = curr + n0 * (r0 * side);
    const QPointF p1 = curr + n1 * (r1 * side);
    if (join == JoinMiter) {
        // Intersect the two offset lines; clamp the miter length.
        const QPointF bis = n0 * side + n1 * side;
        const double bl = std::hypot(bis.x(), bis.y());
        if (bl > 1e-9) {
            const QPointF un(bis.x() / bl, bis.y() / bl);
            const double cosHalf = bl / 2.0;
            if (cosHalf > 1e-6) {
                const double miterLen = qMax(r0, r1) / cosHalf;
                if (miterLen <= qMax(r0, r1) * miterLimit) {
                    out.append(curr + un * miterLen);
                    return out;
                }
            }
        }
    }
    out.append(p0);
    out.append(p1);
    return out;
}

// Signed area; positive means counter-clockwise in a y-down space.
static double ringArea(const QPolygonF &ring)
{
    double a = 0.0;
    for (int i = 0; i < ring.size(); ++i) {
        const QPointF &p = ring.at(i);
        const QPointF &q = ring.at((i + 1) % ring.size());
        a += p.x() * q.y() - q.x() * p.y();
    }
    return a * 0.5;
}

// Every ring we emit must wind the same way, otherwise the non-zero fill rule
// punches holes where ribbons overlap.
static QPolygonF normalised(const QPolygonF &ring)
{
    if (ringArea(ring) < 0.0) {
        QPolygonF r = ring;
        std::reverse(r.begin(), r.end());
        return r;
    }
    return ring;
}

QVector<QPolygonF> StrokeModel::variableWidthOutline(const QVector<StrokePoint> &rawPts,
                                                    const StrokeStyle &style,
                                                    double spacing, bool *closed)
{
    QVector<QPolygonF> result;
    if (rawPts.isEmpty())
        return result;
    if (closed)
        *closed = false;

    // A single tap still deserves a real mark.
    if (rawPts.size() == 1) {
        double major = 0.0, minor = 0.0, angle = 0.0;
        const DynamicsSample dyn = evaluateDynamics(style, rawPts.first(), 0.0, -1.0);
        nibFootprint(style, rawPts.first(),
                     style.baseSize * 0.5 * dyn.widthScale, &major, &minor, &angle);
        QPolygonF dot;
        const int steps = qBound(10, int(qSqrt(major) * 4.0), 64);
        for (int i = 0; i < steps; ++i) {
            const double a = 2.0 * M_PI * double(i) / steps;
            dot.append(QPointF(std::cos(a) * major, std::sin(a) * minor));
        }
        result.append(normalised(dot));
        return result;
    }

    const double sp = qMax(0.15, spacing * style.baseSize);
    const QVector<StrokePoint> pts = resample(rawPts, sp);

    // Positions once; directionAt needs a plain polyline.
    QVector<QPointF> pos;
    pos.reserve(pts.size());
    for (const StrokePoint &p : pts)
        pos.append(p.pos);

    QVector<double> offset;
    offset.reserve(pts.size());
    QVector<double> offsetN;
    offsetN.reserve(pts.size());

    double prevW = -1.0;
    qint64 lastT = pts.first().t;
    double lastSpeed = 0.0;

    for (int i = 0; i < pts.size(); ++i) {
        const StrokePoint &p = pts.at(i);
        const double dt = qMax(0.0, double(p.t - lastT));
        double speed = lastSpeed;
        if (dt > 0.0) {
            const QPointF d = p.pos - pts.at(qMax(0, i - 1)).pos;
            speed = std::hypot(d.x(), d.y()) / dt;
        }
        lastSpeed = speed;
        lastT = p.t;

        const DynamicsSample dyn = evaluateDynamics(style, p, speed, prevW);
        prevW = dyn.widthScale;

        const double radius = qMax(0.05, style.baseSize * 0.5 * dyn.widthScale);
        double major = radius, minor = radius, angle = 0.0;
        nibFootprint(style, p, radius, &major, &minor, &angle);

        const QPointF n = perpendicular(directionAt(pos, i));

        // Support of the oriented ellipse along n: this is what makes a chisel
        // nib produce a genuine flat-sided band instead of a scaled circle.
        const double an = angle * M_PI / 180.0;
        const double mdx = std::cos(an), mdy = std::sin(an);
        const double mdx2 = -mdy, mdy2 = mdx;
        const double alongMajor = n.x() * mdx + n.y() * mdy;
        const double alongMinor = n.x() * mdx2 + n.y() * mdy2;
        const double support = std::sqrt(alongMajor * alongMajor * major * major
                                         + alongMinor * alongMinor * minor * minor);

        offset.append(support);
        // The normal's perpendicular (the direction the nib's long axis leans)
        // decides where the widest point of the band sits.
        const QPointF tan = directionAt(pos, i);
        offsetN.append(std::sqrt(std::pow(n.x() * mdx2 + n.y() * mdy2, 2.0) * minor * minor
                                 + std::pow(tan.x() * mdx + tan.y() * mdy, 2.0) * major * major));
    }

    QVector<QPointF> left;
    QVector<QPointF> right;
    left.reserve(pts.size());
    right.reserve(pts.size());
    for (int i = 0; i < pts.size(); ++i) {
        const QPointF n = perpendicular(directionAt(pos, i));
        left.append(pts.at(i).pos + n * offset.at(i));
        right.append(pts.at(i).pos - n * offset.at(i));
    }

    QPolygonF ring;
    ring.reserve(pts.size() * 2 + 40);
    ring += left;

    const double rLast = offset.isEmpty() ? style.baseSize * 0.5 : offset.last();
    ring += capPoints(pts.last().pos, directionAt(pos, pts.size() - 1), rLast, style.cap);

    for (int i = right.size() - 1; i >= 0; --i)
        ring.append(right.at(i));

    const double rFirst = offset.isEmpty() ? style.baseSize * 0.5 : offset.first();
    const QPointF dBack = -directionAt(pos, 0);
    const QVector<QPointF> capStart = capPoints(pts.first().pos, dBack, rFirst, style.cap);
    for (int i = capStart.size() - 1; i >= 0; --i)
        ring.append(capStart.at(i));

    result.append(normalised(ring));

    // Join wedges as separate overlapping polygons. Union under the non-zero
    // rule, so the corner is solid without the ring having to self-intersect.
    for (int i = 1; i < pts.size() - 1; ++i) {
        const double r = qMax(offset.at(i), 0.05);
        const QVector<QPointF> jp = joinPoints(pts.at(i - 1).pos, pts.at(i).pos,
                                               pts.at(i + 1).pos, r, r, style.join);
        if (jp.size() < 2)
            continue;
        QPolygonF wedge;
        wedge.reserve(jp.size() + 2);
        wedge.append(pts.at(i).pos);
        wedge += jp;
        result.append(normalised(wedge));
    }

    // Inner joins (miter/bevel on the inside of the turn) need no extra fill
    // for a round nib, but a chisel can self-intersect there: add the smaller
    // offset wedge so the band stays watertight.
    if (style.nib != NibRound) {
        for (int i = 1; i < pts.size() - 1; ++i) {
            const double r = offsetN.at(i);
            if (r < 0.2)
                continue;
            const QPointF n = perpendicular(directionAt(pos, i));
            QPolygonF inner;
            inner.append(pts.at(i).pos - n * r);
            inner.append(pts.at(i - 1).pos - perpendicular(directionAt(pos, i - 1)) * r);
            inner.append(pts.at(i + 1).pos - perpendicular(directionAt(pos, i + 1)) * r);
            result.append(normalised(inner));
        }
    }

    return result;
}

QPainterPath StrokeModel::toPainterPath(const QVector<StrokePoint> &pts,
                                        const StrokeStyle &style, bool fill)
{
    QPainterPath path;
    if (pts.isEmpty())
        return path;

    QVector<QPointF> poly;
    poly.reserve(pts.size());
    for (const StrokePoint &p : pts)
        poly.append(p.pos);

    if (!fill) {
        path.moveTo(poly.first());
        for (int i = 1; i < poly.size(); ++i)
            path.lineTo(poly.at(i));
        return path;
    }

    const QVector<QPolygonF> outlines = variableWidthOutline(pts, style, style.spacing);
    for (const QPolygonF &poly2 : outlines) {
        if (poly2.size() < 3)
            continue;
        path.moveTo(poly2.first());
        for (int i = 1; i < poly2.size(); ++i)
            path.lineTo(poly2.at(i));
        path.closeSubpath();
    }
    return path;
}

} // namespace paint