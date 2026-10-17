#ifndef PAINT_TYPES_H
#define PAINT_TYPES_H

// =============================================================================
//  VOLTRA PAINT - shared value types, enums and small math/colour helpers.
// =============================================================================
//  Everything in this header is header-only and free of QObject machinery so it
//  can be included freely from the engines, the document serialiser and the
//  canvas scene-graph item without pulling in moc-generated code.
// =============================================================================

#include <QColor>
#include <QDateTime>
#include <QJsonArray>
#include <QJsonObject>
#include <QList>
#include <QMetaType>
#include <QPointF>
#include <QRectF>
#include <QString>
#include <QStringList>
#include <QtGlobal>
#include <QtMath>

#include <algorithm>

namespace paint {

// ---------------------------------------------------------------------------
// Tools. Stored as int everywhere so that no moc registration is required; the
// QML side keeps a parallel list of ids/labels/shortcuts.
// ---------------------------------------------------------------------------
enum ToolId {
    ToolPencil = 0,
    ToolPen,
    ToolBrush,
    ToolMarker,
    ToolAirbrush,
    ToolCalligraphy,
    ToolEraserStroke,
    ToolEraserPixel,
    ToolFill,
    ToolEyedropper,
    ToolLine,
    ToolRect,
    ToolEllipse,
    ToolPolygon,
    ToolPolyline,
    ToolStar,
    ToolArrow,
    ToolText,
    ToolSelectRect,
    ToolSelectLasso,
    ToolSelectWand,
    ToolMove,
    ToolTransform
};

// ---------------------------------------------------------------------------
// Stroke kinds recorded in the document so that re-rendering is exact.
// ---------------------------------------------------------------------------
enum StrokeKind {
    StrokeInk = 0,
    StrokeEraser,
    StrokeShape
};

// ---------------------------------------------------------------------------
// Blend modes. Real separable blend functions live in Rasterizer.cpp.
// ---------------------------------------------------------------------------
enum BlendModeId {
    BlendNormal = 0,
    BlendMultiply,
    BlendScreen,
    BlendOverlay,
    BlendDarken,
    BlendLighten,
    BlendColorDodge,
    BlendColorBurn,
    BlendHardLight,
    BlendSoftLight,
    BlendDifference,
    BlendExclusion,
    BlendAdd,
    BlendSubtract
};

// ---------------------------------------------------------------------------
// Caps / joins / nib.
// ---------------------------------------------------------------------------
enum CapStyleId { CapRound = 0, CapFlat, CapSquare };
enum JoinStyleId { JoinRound = 0, JoinMiter, JoinBevel };

// How tilt is allowed to change the footprint of a stamp.
enum NibModeId {
    NibRound = 0,   // tilt only thins the stamp
    NibChisel,      // broad nib: azimuth rotates a flat elliptical footprint
    NibBlunt,       // very strong azimuth dependence, wide
    NibFountain      // chisel with a fine trailing tail
};

// Pointer kinds as reported by the windowing system.
enum PointerKindId {
    PointerUnknown = 0,
    PointerPen,
    PointerMouse,
    PointerTouch,
    PointerEraser
};

// Symmetry modes.
enum SymmetryModeId {
    SymmetryNone = 0,
    SymmetryMirrorVertical,
    SymmetryMirrorHorizontal,
    SymmetryMirrorQuad,
    SymmetryRadial
};

// Nib / dynamics curves are stored as a normalised control point list so the
// user can reshape them from the brush dock.
struct Curve {
    // Control points are (x, y) in the unit square, sorted by x.
    QList<QPointF> points;

    Curve()
    {
        points = { QPointF(0.0, 0.0), QPointF(1.0, 1.0) };
    }

    explicit Curve(const QList<QPointF> &pts)
        : points(pts.isEmpty() ? QList<QPointF>{ QPointF(0.0, 0.0), QPointF(1.0, 1.0) } : pts)
    {
        normalise();
    }

    void addPoint(double x, double y)
    {
        if (x < 0.0) x = 0.0;
        if (x > 1.0) x = 1.0;
        if (y < 0.0) y = 0.0;
        if (y > 1.0) y = 1.0;
        points.append(QPointF(x, y));
        normalise();
    }

    void removePointAt(int index)
    {
        if (index >= 0 && index < points.size() && points.size() > 2)
            points.removeAt(index);
    }

    void movePointAt(int index, double x, double y)
    {
        if (index < 0 || index >= points.size())
            return;
        if (x < 0.0) x = 0.0;
        if (x > 1.0) x = 1.0;
        if (y < 0.0) y = 0.0;
        if (y > 1.0) y = 1.0;
        points[index] = QPointF(x, y);
        normalise();
    }

    void normalise()
    {
        std::sort(points.begin(), points.end(),
                  [](const QPointF &a, const QPointF &b) { return a.x() < b.x(); });
    }

    // Monotone-cubic (Fritsch-Carlson) evaluation: smooth, never overshoots
    // outside the control polygon, and passes through every control point.
    double map(double x) const
    {
        const int n = points.size();
        if (n == 0)
            return x;
        if (n == 1)
            return qBound(0.0, points.first().y(), 1.0);
        if (x <= points.first().x())
            return qBound(0.0, points.first().y(), 1.0);
        if (x >= points.last().x())
            return qBound(0.0, points.last().y(), 1.0);

        QList<double> xs, ys;
        for (const QPointF &p : points) { xs.append(p.x()); ys.append(p.y()); }

        QList<double> d;
        for (int i = 0; i < n - 1; ++i)
            d.append((ys.at(i + 1) - ys.at(i)) / (xs.at(i + 1) - xs.at(i) + 1e-9));

        QList<double> m(n, 0.0);
        m[0] = d.first();
        m[n - 1] = d.last();
        for (int i = 1; i < n - 1; ++i)
            m[i] = (d.at(i - 1) * d.at(i) <= 0.0) ? 0.0 : (d.at(i - 1) + d.at(i)) * 0.5;

        for (int i = 0; i < n - 1; ++i) {
            if (d.at(i) == 0.0) { m[i] = 0.0; m[i + 1] = 0.0; continue; }
            const double a = m.at(i) / d.at(i);
            const double b = m.at(i + 1) / d.at(i);
            const double s = a * a + b * b;
            if (s > 9.0) {
                const double t = 3.0 / qSqrt(s);
                m[i] = t * a * d.at(i);
                m[i + 1] = t * b * d.at(i);
            }
        }

        for (int i = 0; i < n - 1; ++i) {
            if (x <= xs.at(i + 1)) {
                const double h = xs.at(i + 1) - xs.at(i);
                const double t = (x - xs.at(i)) / h;
                const double t2 = t * t;
                const double t3 = t2 * t;
                return qBound(0.0,
                              (2.0 * t3 - 3.0 * t2 + 1.0) * ys.at(i)
                                  + (t3 - 2.0 * t2 + t) * h * m.at(i)
                                  + (-2.0 * t3 + 3.0 * t2) * ys.at(i + 1)
                                  + (t3 - t2) * h * m.at(i + 1),
                              1.0);
            }
        }
        return qBound(0.0, ys.last(), 1.0);
    }

    QJsonObject toJson() const
    {
        QJsonObject o;
        QJsonArray pts;
        for (const QPointF &p : points) {
            QJsonArray pair;
            pair.append(p.x());
            pair.append(p.y());
            pts.append(pair);
        }
        o["p"] = pts;
        return o;
    }

    static Curve fromJson(const QJsonObject &o)
    {
        QList<QPointF> pts;
        const QJsonArray arr = o.value("p").toArray();
        for (const QJsonValue &v : arr) {
            const QJsonArray pair = v.toArray();
            if (pair.size() == 2)
                pts.append(QPointF(pair.at(0).toDouble(), pair.at(1).toDouble()));
        }
        return Curve(pts);
    }

};

// ---------------------------------------------------------------------------
// Small geometry helpers.
// ---------------------------------------------------------------------------
inline double clampd(double v, double lo, double hi)
{
    return v < lo ? lo : (v > hi ? hi : v);
}

inline double lerp(double a, double b, double t) { return a + (b - a) * t; }

inline QPointF rotatePoint(double x, double y, double degrees)
{
    const double r = qDegreesToRadians(degrees);
    const double c = std::cos(r);
    const double s = std::sin(r);
    return QPointF(x * c - y * s, x * s + y * c);
}

// Perpendicular unit vector of a direction.
inline QPointF perpendicular(const QPointF &d)
{
    const double len = std::hypot(d.x(), d.y());
    if (len < 1e-9)
        return QPointF(0.0, 0.0);
    return QPointF(-d.y() / len, d.x() / len);
}

inline QPointF directionAt(const QVector<QPointF> &pts, int index)
{
    const int n = pts.size();
    if (n < 2)
        return QPointF(1.0, 0.0);
    QPointF d;
    if (index <= 0)
        d = pts.at(1) - pts.at(0);
    else if (index >= n - 1)
        d = pts.at(n - 1) - pts.at(n - 2);
    else
        d = pts.at(index + 1) - pts.at(index - 1);
    const double len = std::hypot(d.x(), d.y());
    if (len < 1e-9)
        return QPointF(1.0, 0.0);
    return QPointF(d.x() / len, d.y() / len);
}

// Shortest distance from p to segment ab.
inline double distanceToSegment(const QPointF &p, const QPointF &a, const QPointF &b)
{
    const double dx = b.x() - a.x();
    const double dy = b.y() - a.y();
    const double l2 = dx * dx + dy * dy;
    if (l2 < 1e-12)
        return std::hypot(p.x() - a.x(), p.y() - a.y());
    double t = ((p.x() - a.x()) * dx + (p.y() - a.y()) * dy) / l2;
    t = clampd(t, 0.0, 1.0);
    const double cx = a.x() + t * dx;
    const double cy = a.y() + t * dy;
    return std::hypot(p.x() - cx, p.y() - cy);
}

// Cumulative arc length of a polyline.
inline double polylineLength(const QVector<QPointF> &pts)
{
    double total = 0.0;
    for (int i = 1; i < pts.size(); ++i)
        total += std::hypot(pts.at(i).x() - pts.at(i - 1).x(),
                            pts.at(i).y() - pts.at(i - 1).y());
    return total;
}

inline QRectF unionBounds(const QRectF &a, const QRectF &b)
{
    if (a.isNull()) return b;
    if (b.isNull()) return a;
    return a.united(b);
}

inline QRectF expandForPen(const QRectF &r, double size)
{
    const double m = size * 0.5 + 2.0;
    return QRectF(r.x() - m, r.y() - m, r.width() + 2.0 * m, r.height() + 2.0 * m);
}

// ---------------------------------------------------------------------------
// Colour helpers.
// ---------------------------------------------------------------------------
inline QColor withOpacity(const QColor &c, double a)
{
    QColor r = c;
    r.setAlphaF(clampd(a, 0.0, 1.0));
    return r;
}

inline double luminanceOf(const QColor &c)
{
    return (0.2126 * c.redF() + 0.7152 * c.greenF() + 0.0722 * c.blueF());
}

inline QColor hueShift(const QColor &c, double degrees)
{
    QColor hsv = c.toHsv();
    hsv[0] = int(std::fmod(qMax(0, hsv[0]) + degrees + 360.0, 360.0));
    QColor out = QColor::fromHsv(hsv[0], hsv[1], hsv[2]);
    out.setAlpha(c.alpha());
    return out;
}

inline QColor saturateBy(const QColor &c, double factor)
{
    QColor hsv = c.toHsv();
    hsv[1] = int(clampd(hsv[1] * factor, 0.0, 255.0));
    QColor out = QColor::fromHsv(hsv[0], hsv[1], hsv[2]);
    out.setAlpha(c.alpha());
    return out;
}

inline QColor scaleValue(const QColor &c, double factor)
{
    auto s = [factor](int v) { return int(clampd(v * factor, 0.0, 255.0)); };
    QColor out(s(c.red()), s(c.green()), s(c.blue()));
    out.setAlpha(c.alpha());
    return out;
}

// ---------------------------------------------------------------------------
// Human readable names, kept in C++ so logs, exports and the document format
// all agree with what the UI shows.
// ---------------------------------------------------------------------------
inline QString blendModeName(int id)
{
    static const char *names[] = { "Normal", "Multiply", "Screen", "Overlay",
                                   "Darken", "Lighten", "Color Dodge", "Color Burn",
                                   "Hard Light", "Soft Light", "Difference",
                                   "Exclusion", "Add", "Subtract" };
    const int n = int(sizeof(names) / sizeof(names[0]));
    return (id >= 0 && id < n) ? QString::fromLatin1(names[id]) : QStringLiteral("Normal");
}

inline int blendModeFromName(const QString &name)
{
    for (int i = 0; i < 14; ++i) {
        if (blendModeName(i).compare(name, Qt::CaseInsensitive) == 0)
            return i;
    }
    return BlendNormal;
}

inline QString nibModeName(int id)
{
    static const char *names[] = { "Round", "Chisel", "Blunt", "Fountain" };
    return (id >= 0 && id < 4) ? QString::fromLatin1(names[id]) : QStringLiteral("Round");
}

inline QString toolName(int id)
{
    switch (id) {
    case ToolPencil: return QStringLiteral("Pencil");
    case ToolPen: return QStringLiteral("Pen");
    case ToolBrush: return QStringLiteral("Brush");
    case ToolMarker: return QStringLiteral("Marker");
    case ToolAirbrush: return QStringLiteral("Airbrush");
    case ToolCalligraphy: return QStringLiteral("Calligraphy");
    case ToolEraserStroke: return QStringLiteral("Eraser");
    case ToolEraserPixel: return QStringLiteral("Pixel Eraser");
    case ToolFill: return QStringLiteral("Fill");
    case ToolEyedropper: return QStringLiteral("Eyedropper");
    case ToolLine: return QStringLiteral("Line");
    case ToolRect: return QStringLiteral("Rectangle");
    case ToolEllipse: return QStringLiteral("Ellipse");
    case ToolPolygon: return QStringLiteral("Polygon");
    case ToolPolyline: return QStringLiteral("Polyline");
    case ToolStar: return QStringLiteral("Star");
    case ToolArrow: return QStringLiteral("Arrow");
    case ToolText: return QStringLiteral("Text");
    case ToolSelectRect: return QStringLiteral("Rectangle Select");
    case ToolSelectLasso: return QStringLiteral("Lasso");
    case ToolSelectWand: return QStringLiteral("Magic Wand");
    case ToolMove: return QStringLiteral("Move");
    case ToolTransform: return QStringLiteral("Transform");
    default: return QStringLiteral("Pencil");
    }
}

inline QString pointerKindName(int id)
{
    switch (id) {
    case PointerPen: return QStringLiteral("Pen");
    case PointerMouse: return QStringLiteral("Mouse");
    case PointerTouch: return QStringLiteral("Touch");
    case PointerEraser: return QStringLiteral("Eraser");
    default: return QStringLiteral("Unknown");
    }
}

// Monotonic clock in milliseconds: document timestamps must not move backwards
// when the wall clock is adjusted.
inline qint64 monoMs()
{
    static const qint64 origin = QDateTime::currentMSecsSinceEpoch();
    return QDateTime::currentMSecsSinceEpoch() - origin;
}

} // namespace paint

Q_DECLARE_METATYPE(paint::ToolId)
Q_DECLARE_METATYPE(paint::BlendModeId)
Q_DECLARE_METATYPE(paint::SymmetryModeId)

#endif // PAINT_TYPES_H