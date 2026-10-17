#include "ShapeEngine.h"

#include <QDataStream>
#include <QJsonArray>
#include <QJsonDocument>
#include <QJsonObject>
#include <QPainter>
#include <QtMath>

#include <cmath>

namespace paint {

// ===========================================================================
// Shape serialisation
// ===========================================================================

QRectF Shape::bounds() const
{
    if (points.isEmpty())
        return QRectF();
    double x0 = points.first().x(), y0 = points.first().y();
    double x1 = x0, y1 = y0;
    for (const QPointF &p : points) {
        x0 = qMin(x0, p.x()); y0 = qMin(y0, p.y());
        x1 = qMax(x1, p.x()); y1 = qMax(y1, p.y());
    }
    const double pad = strokeWidth * 0.5 + arrowHeadLength * (kind == ShapeArrow ? 1.0 : 0.0);
    return QRectF(x0 - pad, y0 - pad, (x1 - x0) + 2 * pad, (y1 - y0) + 2 * pad);
}

QByteArray Shape::serialise() const
{
    QJsonObject o;
    o["id"] = double(id);
    o["kind"] = int(kind);
    QJsonArray pts;
    for (const QPointF &p : points) {
        QJsonArray pair;
        pair.append(p.x());
        pair.append(p.y());
        pts.append(pair);
    }
    o["points"] = pts;
    o["filled"] = filled;
    o["closed"] = closed;
    o["strokeWidth"] = strokeWidth;
    o["sides"] = sides;
    o["innerRatio"] = innerRatio;
    o["arrowHeadLength"] = arrowHeadLength;
    o["arrowHeadWidth"] = arrowHeadWidth;
    o["rotation"] = rotation;
    o["colour"] = style.colour.name(QColor::HexArgb);
    o["blendMode"] = style.blendMode;
    o["opacity"] = style.opacity;
    o["cap"] = int(style.cap);
    o["join"] = int(style.join);

    QByteArray payload = QJsonDocument(o).toJson(QJsonDocument::Compact);
    QByteArray out;
    QDataStream s(&out, QIODevice::WriteOnly);
    s.setByteOrder(QDataStream::LittleEndian);
    s << kMagic << quint16(1) << quint32(payload.size());
    s.writeRawData(payload.constData(), payload.size());
    return out;
}

bool Shape::deserialise(const QByteArray &data, Shape *out, QString *error)
{
    if (!out)
        return false;
    QDataStream s(data);
    s.setByteOrder(QDataStream::LittleEndian);
    quint32 magic = 0;
    quint16 ver = 0;
    quint32 len = 0;
    s >> magic >> ver >> len;
    if (magic != kMagic || ver != 1 || quint32(data.size()) < 10u + len) {
        if (error) *error = QStringLiteral("bad shape record");
        return false;
    }
    const QByteArray payload = s.read(int(len));
    if (quint32(payload.size()) != len) {
        if (error) *error = QStringLiteral("truncated shape payload");
        return false;
    }

    const QJsonObject o = QJsonDocument::fromJson(payload).object();
    out->id = quint32(o.value("id").toDouble());
    out->kind = ShapeKind(o.value("kind").toInt(ShapeLine));
    out->points.clear();
    for (const QJsonValue &v : o.value("points").toArray()) {
        const QJsonArray pair = v.toArray();
        if (pair.size() == 2)
            out->points.append(QPointF(pair.at(0).toDouble(), pair.at(1).toDouble()));
    }
    out->filled = o.value("filled").toBool(false);
    out->closed = o.value("closed").toBool(false);
    out->strokeWidth = o.value("strokeWidth").toDouble(4.0);
    out->sides = o.value("sides").toInt(6);
    out->innerRatio = o.value("innerRatio").toDouble(0.45);
    out->arrowHeadLength = o.value("arrowHeadLength").toDouble(28.0);
    out->arrowHeadWidth = o.value("arrowHeadWidth").toDouble(0.42);
    out->rotation = o.value("rotation").toDouble(0.0);
    out->style.colour = QColor(o.value("colour").toString(QStringLiteral("#101218ff")));
    out->style.blendMode = o.value("blendMode").toInt(BlendNormal);
    out->style.opacity = o.value("opacity").toDouble(1.0);
    out->style.cap = CapStyleId(o.value("cap").toInt(CapRound));
    out->style.join = JoinStyleId(o.value("join").toInt(JoinRound));
    return true;
}

// ===========================================================================
// Construction / configuration
// ===========================================================================

ShapeEngine::ShapeEngine(QObject *parent)
    : QObject(parent)
{
    m_current.style.colour = QColor(16, 18, 24, 255);
    m_current.style.baseSize = m_weight;
    m_current.style.hardness = 1.0;
}

ShapeEngine::~ShapeEngine() = default;

void ShapeEngine::setCurrentShape(int kind)
{
    const int v = qBound(0, kind, int(ShapeArrow));
    if (m_kind == v)
        return;
    m_kind = v;
    m_pending.clear();
    m_building = false;
    emit currentShapeChanged();
}

void ShapeEngine::setStrokeWeight(double v)
{
    const double nv = clampd(v, 0.5, 200.0);
    if (qFuzzyCompare(m_weight, nv))
        return;
    m_weight = nv;
    m_current.style.baseSize = nv;
    emit strokeWeightChanged();
}

void ShapeEngine::setFilled(bool v)
{
    if (m_filled == v)
        return;
    m_filled = v;
    emit strokeWeightChanged();
}

void ShapeEngine::setSnapEnabled(bool v)
{
    if (m_snap.enabled == v) return;
    m_snap.enabled = v;
    emit snapChanged();
}
void ShapeEngine::setSnapToGrid(bool v)
{
    if (m_snap.toGrid == v) return;
    m_snap.toGrid = v;
    emit snapChanged();
}
void ShapeEngine::setSnapToGuides(bool v)
{
    if (m_snap.toGuides == v) return;
    m_snap.toGuides = v;
    emit snapChanged();
}
void ShapeEngine::setSnapToGeometry(bool v)
{
    if (m_snap.toGeometry == v) return;
    m_snap.toGeometry = v;
    emit snapChanged();
}
void ShapeEngine::setGridSize(double v)
{
    const double nv = clampd(v, 2.0, 512.0);
    if (qFuzzyCompare(m_snap.gridSize, nv)) return;
    m_snap.gridSize = nv;
    emit snapChanged();
}
void ShapeEngine::setSnapRadius(double v)
{
    const double nv = clampd(v, 1.0, 80.0);
    if (qFuzzyCompare(m_snap.snapRadiusPx, nv)) return;
    m_snap.snapRadiusPx = nv;
    emit snapChanged();
}
void ShapeEngine::setSides(int v)
{
    const int nv = qBound(3, v, 64);
    if (m_sides == nv) return;
    m_sides = nv;
    emit shapeParamsChanged();
}
void ShapeEngine::setInnerRatio(double v)
{
    const double nv = clampd(v, 0.05, 0.95);
    if (qFuzzyCompare(m_innerRatio, nv)) return;
    m_innerRatio = nv;
    emit shapeParamsChanged();
}
void ShapeEngine::setArrowHeadLength(double v)
{
    const double nv = clampd(v, 4.0, 400.0);
    if (qFuzzyCompare(m_arrowHead, nv)) return;
    m_arrowHead = nv;
    emit shapeParamsChanged();
}
void ShapeEngine::setArrowHeadWidth(double v)
{
    const double nv = clampd(v, 0.05, 1.5);
    if (qFuzzyCompare(m_arrowHeadWidth, nv)) return;
    m_arrowHeadWidth = nv;
    emit shapeParamsChanged();
}

QVariantList ShapeEngine::shapeNames() const
{
    QVariantList out;
    const char *names[] = { "Line", "Rectangle", "Ellipse", "Polygon", "Polyline",
                            "Star", "Arrow" };
    for (int i = 0; i < 7; ++i) {
        QVariantMap m;
        m.insert("id", i);
        m.insert("name", QString::fromLatin1(names[i]));
        m.insert("selected", i == m_kind);
        out.append(m);
    }
    return out;
}

QString ShapeEngine::kindName(int kind)
{
    switch (kind) {
    case ShapeLine: return QStringLiteral("Line");
    case ShapeRectangle: return QStringLiteral("Rectangle");
    case ShapeEllipse: return QStringLiteral("Ellipse");
    case ShapePolygon: return QStringLiteral("Polygon");
    case ShapePolyline: return QStringLiteral("Polyline");
    case ShapeStar: return QStringLiteral("Star");
    case ShapeArrow: return QStringLiteral("Arrow");
    default: return QStringLiteral("Shape");
    }
}

// ===========================================================================
// Snapping
// ===========================================================================

void ShapeEngine::setGuides(const QVariantList &guides)
{
    m_guides.clear();
    m_guideVertical.clear();
    for (const QVariant &v : guides) {
        const QVariantMap m = v.toMap();
        if (m.contains("axis") && m.contains("position")) {
            m_guides.append(QPointF(m.value("axis").toString() == QStringLiteral("v")
                                        ? m.value("position").toDouble()
                                        : 0.0,
                                    m.value("axis").toString() == QStringLiteral("v")
                                        ? 0.0
                                        : m.value("position").toDouble()));
            m_guideVertical.append(m.value("axis").toString() == QStringLiteral("v"));
        } else if (v.canConvert<QPointF>()) {
            m_guides.append(v.toPointF());
            m_guideVertical.append(true);
        }
    }
    emit snapChanged();
}

void ShapeEngine::setGuides(const QVector<QPointF> &guides, bool vertical)
{
    m_guides.clear();
    m_guideVertical.clear();
    for (const QPointF &g : guides) {
        m_guides.append(g);
        m_guideVertical.append(vertical);
    }
    emit snapChanged();
}

void ShapeEngine::setReferenceGeometry(const QVector<QPointF> &vertices)
{
    m_reference = vertices;
}

void ShapeEngine::clearReferenceGeometry()
{
    m_reference.clear();
}

SnapResult ShapeEngine::snapPoint(const QPointF &raw, int snapFlags) const
{
    SnapResult r;
    r.applied = raw;
    if (!m_snap.enabled || m_snap.altDisabled)
        return r;

    const int flags = snapFlags < 0 ? 7 : snapFlags;  // 1=grid 2=guide 4=geometry
    const double radius = m_snap.snapRadiusPx;
    double bestD = radius;
    SnapResult best;
    best.applied = raw;

    if ((flags & 2) && m_snap.toGuides) {
        for (int i = 0; i < m_guides.size(); ++i) {
            const QPointF g = m_guides.at(i);
            const bool vertical = i < m_guideVertical.size() ? m_guideVertical.at(i) : true;
            if (vertical) {
                const double d = std::fabs(raw.x() - g.x());
                if (d < bestD) {
                    bestD = d;
                    best.snapped = true;
                    best.kind = QStringLiteral("guide");
                    best.anchor = g;
                    best.applied = QPointF(g.x(), raw.y());
                }
            } else {
                const double d = std::fabs(raw.y() - g.y());
                if (d < bestD) {
                    bestD = d;
                    best.snapped = true;
                    best.kind = QStringLiteral("guide");
                    best.anchor = g;
                    best.applied = QPointF(raw.x(), g.y());
                }
            }
        }
    }

    if ((flags & 4) && m_snap.toGeometry) {
        for (const QPointF &v : m_reference) {
            const double d = std::hypot(v.x() - raw.x(), v.y() - raw.y());
            if (d < bestD) {
                bestD = d;
                best.snapped = true;
                best.kind = QStringLiteral("endpoint");
                best.anchor = v;
                best.applied = v;
            }
        }
        // Midpoints between consecutive reference vertices.
        for (int i = 1; i < m_reference.size(); ++i) {
            const QPointF mid((m_reference.at(i - 1).x() + m_reference.at(i).x()) * 0.5,
                              (m_reference.at(i - 1).y() + m_reference.at(i).y()) * 0.5);
            const double d = std::hypot(mid.x() - raw.x(), mid.y() - raw.y());
            if (d < bestD) {
                bestD = d;
                best.snapped = true;
                best.kind = QStringLiteral("midpoint");
                best.anchor = mid;
                best.applied = mid;
            }
        }
        if (m_reference.size() >= 3) {
            double cx = 0, cy = 0;
            for (const QPointF &v : m_reference) { cx += v.x(); cy += v.y(); }
            const QPointF centre(cx / m_reference.size(), cy / m_reference.size());
            const double d = std::hypot(centre.x() - raw.x(), centre.y() - raw.y());
            if (d < bestD) {
                bestD = d;
                best.snapped = true;
                best.kind = QStringLiteral("centre");
                best.anchor = centre;
                best.applied = centre;
            }
        }
    }

    if ((flags & 1) && m_snap.toGrid) {
        const double g = qMax(2.0, m_snap.gridSize);
        const QPointF grid(std::round(raw.x() / g) * g, std::round(raw.y() / g) * g);
        const double d = std::hypot(grid.x() - raw.x(), grid.y() - raw.y());
        if (d < bestD) {
            bestD = d;
            best.snapped = true;
            best.kind = QStringLiteral("grid");
            best.anchor = grid;
            best.applied = grid;
        }
    }

    if (best.snapped) {
        r = best;
        const_cast<ShapeEngine *>(this)->m_lastSnap = r.kind;
        emit const_cast<ShapeEngine *>(this)->snapApplied(r.kind);
    }
    return r;
}

QPointF ShapeEngine::constrainAngle(const QPointF &from, const QPointF &to) const
{
    const QPointF d = to - from;
    const double len = std::hypot(d.x(), d.y());
    if (len < 1e-6)
        return to;
    const double a = std::atan2(d.y(), d.x());
    const double step = M_PI / 4.0;   // 45 degrees
    const double snapped = std::round(a / step) * step;
    return from + QPointF(std::cos(snapped) * len, std::sin(snapped) * len);
}

SnapResult ShapeEngine::snapDirection(const QPointF &from, const QPointF &to) const
{
    SnapResult r;
    r.applied = to;
    if (!m_snap.shiftConstrain)
        return r;
    r.applied = constrainAngle(from, to);
    r.snapped = true;
    r.kind = QStringLiteral("angle");
    r.anchor = from;
    m_lastSnap = r.kind;
    return r;
}

// ===========================================================================
// Static geometry
// ===========================================================================

QVector<QPointF> ShapeEngine::linePoints(const QPointF &a, const QPointF &b)
{
    return { a, b };
}

QVector<QPointF> ShapeEngine::rectPoints(const QPointF &a, const QPointF &b, double rotation)
{
    QRectF r = QRectF(a, b).normalized();
    const QPointF c = r.center();
    QVector<QPointF> pts;
    pts.reserve(5);
    const QPointF corners[4] = {
        QPointF(r.left(), r.top()), QPointF(r.right(), r.top()),
        QPointF(r.right(), r.bottom()), QPointF(r.left(), r.bottom())
    };
    for (const QPointF &corner : corners) {
        if (qFuzzyIsNull(rotation))
            pts.append(corner);
        else {
            const QPointF d = corner - c;
            const QPointF rot = rotatePoint(d.x(), d.y(), rotation);
            pts.append(c + rot);
        }
    }
    pts.append(pts.first());
    return pts;
}

QVector<QPointF> ShapeEngine::ellipsePoints(const QPointF &a, const QPointF &b, int segments)
{
    QRectF r = QRectF(a, b).normalized();
    const QPointF c = r.center();
    const double rx = r.width() * 0.5;
    const double ry = r.height() * 0.5;
    QVector<QPointF> pts;
    const int n = qBound(12, segments, 720);
    pts.reserve(n + 1);
    for (int i = 0; i <= n; ++i) {
        const double t = 2.0 * M_PI * double(i) / n;
        pts.append(c + QPointF(std::cos(t) * rx, std::sin(t) * ry));
    }
    return pts;
}

QVector<QPointF> ShapeEngine::polygonPoints(const QPointF &centre, double radius, int sides,
                                            double rotationDeg)
{
    QVector<QPointF> pts;
    const int n = qBound(3, sides, 64);
    for (int i = 0; i <= n; ++i) {
        const double t = 2.0 * M_PI * double(i) / n - M_PI / 2.0
                         + qDegreesToRadians(rotationDeg);
        pts.append(centre + QPointF(std::cos(t) * radius, std::sin(t) * radius));
    }
    return pts;
}

QVector<QPointF> ShapeEngine::starPoints(const QPointF &centre, double outerRadius, int sides,
                                         double innerRatio, double rotationDeg)
{
    QVector<QPointF> pts;
    const int n = qBound(3, sides, 64);
    const double inner = outerRadius * clampd(innerRatio, 0.05, 0.95);
    for (int i = 0; i <= n * 2; ++i) {
        const double t = M_PI * double(i) / n - M_PI / 2.0 + qDegreesToRadians(rotationDeg);
        const double r = (i % 2 == 0) ? outerRadius : inner;
        pts.append(centre + QPointF(std::cos(t) * r, std::sin(t) * r));
    }
    return pts;
}

QVector<QPointF> ShapeEngine::arrowPoints(const QPointF &from, const QPointF &to,
                                          double headLength, double headWidth)
{
    const QPointF d = to - from;
    const double len = std::hypot(d.x(), d.y());
    if (len < 1e-6)
        return { from, to };

    const QPointF u(d.x() / len, d.y() / len);
    const QPointF n(-u.y(), u.x());
    const double head = qMin(double(headLength), len * 0.9);

    const QPointF base = to - u * head;
    QVector<QPointF> pts;
    pts.reserve(6);
    // Shaft.
    pts.append(from);
    pts.append(base);
    pts.append(base);
    pts.append(to);
    pts.append(to);
    pts.append(base);
    // Two head barbs, so the caller sees a closed V plus the shaft.
    const QPointF barbA = base + n * (head * headWidth);
    const QPointF barbB = base - n * (head * headWidth);
    pts.append(barbA);
    pts.append(to);
    pts.append(barbB);
    pts.append(base);
    return pts;
}

QPainterPath ShapeEngine::pathFor(const Shape &shape)
{
    QPainterPath path;
    if (shape.points.isEmpty())
        return path;

    switch (shape.kind) {
    case ShapeRectangle: {
        if (shape.points.size() < 2)
            return path;
        const QVector<QPointF> pts = rectPoints(shape.points.first(), shape.points.last(),
                                                shape.rotation);
        path.moveTo(pts.first());
        for (int i = 1; i < pts.size(); ++i)
            path.lineTo(pts.at(i));
        break;
    }
    case ShapeEllipse: {
        if (shape.points.size() < 2)
            return path;
        const QVector<QPointF> pts = ellipsePoints(shape.points.first(), shape.points.last());
        path.moveTo(pts.first());
        for (int i = 1; i < pts.size(); ++i)
            path.lineTo(pts.at(i));
        break;
    }
    case ShapePolygon: {
        const QPointF c = shape.points.size() >= 2
                              ? QPointF((shape.points.first().x() + shape.points.last().x()) * 0.5,
                                        (shape.points.first().y() + shape.points.last().y()) * 0.5)
                              : QPointF();
        const double r = shape.points.size() >= 2
                             ? std::hypot(shape.points.last().x() - c.x(),
                                          shape.points.last().y() - c.y())
                             : 0.0;
        const QVector<QPointF> pts = polygonPoints(c, r, shape.sides, shape.rotation);
        path.moveTo(pts.first());
        for (int i = 1; i < pts.size(); ++i)
            path.lineTo(pts.at(i));
        break;
    }
    case ShapeStar: {
        const QPointF c = shape.points.size() >= 2
                              ? QPointF((shape.points.first().x() + shape.points.last().x()) * 0.5,
                                        (shape.points.first().y() + shape.points.last().y()) * 0.5)
                              : QPointF();
        const double r = shape.points.size() >= 2
                             ? std::hypot(shape.points.last().x() - c.x(),
                                          shape.points.last().y() - c.y())
                             : 0.0;
        const QVector<QPointF> pts = starPoints(c, r, shape.sides, shape.innerRatio,
                                                shape.rotation);
        path.moveTo(pts.first());
        for (int i = 1; i < pts.size(); ++i)
            path.lineTo(pts.at(i));
        break;
    }
    case ShapeLine: {
        path.moveTo(shape.points.first());
        path.lineTo(shape.points.last());
        break;
    }
    case ShapeArrow: {
        // For a filled arrow, the closed region is the head triangle plus the
        // shaft quad: build both so the fill is solid, not a zig-zag outline.
        if (shape.points.size() >= 4) {
            const QPointF shaftA = shape.points.at(0);
            const QPointF headBase = shape.points.at(1);
            const QPointF tip = shape.points.at(3);
            path.moveTo(shaftA);
            path.lineTo(headBase);
            path.lineTo(tip);
            path.closeSubpath();
        } else {
            path.moveTo(shape.points.first());
            path.lineTo(shape.points.last());
        }
        break;
    }
    case ShapePolyline:
    default: {
        if (shape.points.isEmpty())
            return path;
        path.moveTo(shape.points.first());
        for (int i = 1; i < shape.points.size(); ++i)
            path.lineTo(shape.points.at(i));
        if (shape.closed)
            path.closeSubpath();
        break;
    }
    }
    return path;
}

// ===========================================================================
// Live construction
// ===========================================================================

bool ShapeEngine::needsMoreVertices() const
{
    return m_kind == ShapePolygon || m_kind == ShapePolyline;
}

Shape ShapeEngine::begin(const QPointF &start, const QPointF &current, int shapeKind)
{
    m_building = true;
    m_current = Shape();
    m_current.id = 0;
    m_current.kind = ShapeKind(shapeKind >= 0 ? shapeKind : m_kind);
    m_current.style = StrokeStyle();
    m_current.style.colour = m_current.style.colour;
    m_current.style.baseSize = m_weight;
    m_current.style.hardness = 1.0;
    m_current.style.opacity = 1.0;
    m_current.filled = m_filled;
    m_current.strokeWidth = m_weight;
    m_current.sides = m_sides;
    m_current.innerRatio = m_innerRatio;
    m_current.arrowHeadLength = m_arrowHead;
    m_current.arrowHeadWidth = m_arrowHeadWidth;

    if (needsMoreVertices()) {
        m_pending.clear();
        m_pending.append(start);
        m_current.points = m_pending;
        return m_current;
    }

    const QPointF a = snapPoint(start).applied;
    const QPointF b = snapPoint(current).applied;
    m_current.points = linePoints(a, b);
    return m_current;
}

void ShapeEngine::extend(const QPointF &current)
{
    if (!m_building)
        return;

    if (needsMoreVertices()) {
        if (m_pending.isEmpty())
            m_pending.append(current);
        m_current.points = m_pending;
        return;
    }

    const QPointF start = m_current.points.isEmpty() ? current : m_current.points.first();
    const SnapResult snapped = snapPoint(current);
    const QPointF b = m_snap.shiftConstrain ? constrainAngle(start, snapped.applied)
                                            : snapped.applied;

    switch (m_current.kind) {
    case ShapeLine:
    case ShapeArrow:
        m_current.points = (m_current.kind == ShapeArrow)
                               ? arrowPoints(start, b, m_arrowHead, m_arrowHeadWidth)
                               : linePoints(start, b);
        break;
    case ShapeRectangle:
        m_current.points = rectPoints(start, b, m_current.rotation);
        break;
    case ShapeEllipse:
        m_current.points = ellipsePoints(start, b);
        break;
    default:
        m_current.points = linePoints(start, b);
        break;
    }
}

void ShapeEngine::addVertex(const QPointF &p)
{
    if (!needsMoreVertices())
        return;
    const QPointF sp = snapPoint(p).applied;
    if (m_pending.isEmpty())
        m_pending.append(sp);
    else if (std::hypot(sp.x() - m_pending.last().x(), sp.y() - m_pending.last().y()) > 1.0)
        m_pending.append(sp);
    m_current.points = m_pending;
}

void ShapeEngine::finish()
{
    if (needsMoreVertices() && m_pending.size() >= 3) {
        if (m_current.kind == ShapePolygon)
            m_current.points.append(m_pending.first());
        m_current.closed = m_current.kind == ShapePolygon;
    }
    m_building = false;
    m_pending.clear();
}

// ===========================================================================
// Handles and editing
// ===========================================================================

QVector<ShapeHandle> ShapeEngine::handlesFor(const Shape &shape) const
{
    QVector<ShapeHandle> out;
    if (shape.points.isEmpty())
        return out;

    switch (shape.kind) {
    case ShapeRectangle:
    case ShapeEllipse: {
        const QRectF r = shape.kind == ShapeRectangle
                             ? QRectF(shape.points.first(), shape.points.last()).normalized()
                             : [&]() {
                                   double x0 = shape.points.first().x();
                                   double y0 = shape.points.first().y();
                                   double x1 = x0, y1 = y0;
                                   for (const QPointF &p : shape.points) {
                                       x0 = qMin(x0, p.x()); y0 = qMin(y0, p.y());
                                       x1 = qMax(x1, p.x()); y1 = qMax(y1, p.y());
                                   }
                                   return QRectF(x0, y0, x1 - x0, y1 - y0);
                               }();
        const QPointF corners[4] = {
            r.topLeft(), r.topRight(), r.bottomRight(), r.bottomLeft()
        };
        for (int i = 0; i < 4; ++i) {
            ShapeHandle h;
            h.pos = corners[i];
            h.index = i;
            h.role = QStringLiteral("vertex");
            out.append(h);
        }
        ShapeHandle c;
        c.pos = r.center();
        c.index = 4;
        c.role = QStringLiteral("centre");
        out.append(c);
        ShapeHandle rot;
        rot.pos = QPointF(r.center().x(), r.top() - 24.0);
        rot.index = 5;
        rot.role = QStringLiteral("rotate");
        rot.rotationDeg = shape.rotation;
        out.append(rot);
        break;
    }
    case ShapeStar:
    case ShapePolygon: {
        const QPointF centre = [&]() {
            double x = 0, y = 0;
            for (const QPointF &p : shape.points) { x += p.x(); y += p.y(); }
            return QPointF(x / qMax(1, shape.points.size()),
                           y / qMax(1, shape.points.size()));
        }();
        for (int i = 0; i < shape.points.size(); ++i) {
            ShapeHandle h;
            h.pos = shape.points.at(i);
            h.index = i;
            h.role = QStringLiteral("vertex");
            out.append(h);
        }
        ShapeHandle c;
        c.pos = centre;
        c.index = 100;
        c.role = QStringLiteral("centre");
        out.append(c);
        break;
    }
    default: {
        for (int i = 0; i < shape.points.size(); ++i) {
            ShapeHandle h;
            h.pos = shape.points.at(i);
            h.index = i;
            h.role = QStringLiteral("vertex");
            out.append(h);
        }
        break;
    }
    }
    return out;
}

Shape ShapeEngine::applyHandleDrag(const Shape &shape, int index, const QPointF &to,
                                   const SnapResult &snap) const
{
    Shape out = shape;
    const QPointF target = snap.snapped ? snap.applied : to;

    if (shape.kind == ShapeRectangle || shape.kind == ShapeEllipse) {
        if (index >= 0 && index < 4) {
            QRectF r = QRectF(shape.points.first(), shape.points.last()).normalized();
            const bool left = (index == 0 || index == 3);
            const bool top = (index == 0 || index == 1);
            if (left) r.setLeft(target.x()); else r.setRight(target.x());
            if (top) r.setTop(target.y()); else r.setBottom(target.y());
            out.points = (shape.kind == ShapeRectangle)
                             ? rectPoints(r.topLeft(), r.bottomRight(), shape.rotation)
                             : ellipsePoints(r.topLeft(), r.bottomRight());
        } else if (index == 4) {
            // Centre drag: move the whole shape.
            QRectF r = QRectF(shape.points.first(), shape.points.last()).normalized();
            const QPointF delta = target - r.center();
            const QRectF nr = r.translated(delta);
            out.points = (shape.kind == ShapeRectangle)
                             ? rectPoints(nr.topLeft(), nr.bottomRight(), shape.rotation)
                             : ellipsePoints(nr.topLeft(), nr.bottomRight());
        } else if (index == 5) {
            QRectF r = QRectF(shape.points.first(), shape.points.last()).normalized();
            const QPointF c = r.center();
            const double a = std::atan2(target.y() - c.y(), target.x() - c.x()) * 180.0 / M_PI;
            out.rotation = a;
            out.points = (shape.kind == ShapeRectangle)
                             ? rectPoints(r.topLeft(), r.bottomRight(), out.rotation)
                             : ellipsePoints(r.topLeft(), r.bottomRight());
        }
        return out;
    }

    if (index == 100) {
        // Whole-shape translation via the centre handle.
        double cx = 0, cy = 0;
        for (const QPointF &p : shape.points) { cx += p.x(); cy += p.y(); }
        const QPointF c(cx / qMax(1, shape.points.size()), cy / qMax(1, shape.points.size()));
        const QPointF delta = target - c;
        for (QPointF &p : out.points)
            p += delta;
        return out;
    }

    if (index >= 0 && index < out.points.size()) {
        // Constrain polygon vertices radially when they come from a centre.
        if (shape.kind == ShapePolygon || shape.kind == ShapeStar) {
            double cx = 0, cy = 0;
            for (const QPointF &p : shape.points) { cx += p.x(); cy += p.y(); }
            const QPointF c(cx / qMax(1, shape.points.size()), cy / qMax(1, shape.points.size()));
            out.points[index] = target;
            const double r = std::hypot(target.x() - c.x(), target.y() - c.y());
            const double a = std::atan2(target.y() - c.y(), target.x() - c.x());
            out.points[index] = c + QPointF(std::cos(a) * r, std::sin(a) * r);
        } else {
            out.points[index] = target;
        }
    }
    return out;
}

Shape ShapeEngine::transformed(const Shape &shape, const QTransform &m,
                               double rotationDelta) const
{
    Shape out = shape;
    for (QPointF &p : out.points)
        p = m.map(p);
    out.rotation += rotationDelta;
    out.id = shape.id;
    return out;
}

Shape ShapeEngine::rotatedAbout(const Shape &shape, const QPointF &pivot, double degrees) const
{
    QTransform t;
    t.translate(pivot.x(), pivot.y());
    t.rotate(degrees);
    t.translate(-pivot.x(), -pivot.y());
    return transformed(shape, t, degrees);
}

Shape ShapeEngine::flipped(const Shape &shape, bool horizontal) const
{
    const QRectF r = shape.bounds();
    const QPointF c = r.center();
    QTransform t;
    t.translate(c.x(), c.y());
    t.scale(horizontal ? -1.0 : 1.0, horizontal ? 1.0 : -1.0);
    t.translate(-c.x(), -c.y());
    Shape out = transformed(shape, t, 0.0);
    if (horizontal)
        out.rotation = 180.0 - out.rotation;
    return out;
}

Shape ShapeEngine::moved(const Shape &shape, const QPointF &delta) const
{
    Shape out = shape;
    for (QPointF &p : out.points)
        p += delta;
    return out;
}

// ===========================================================================
// Rendering
// ===========================================================================

QRectF ShapeEngine::render(QImage &target, const Shape &shape, const FillOptions &opt) const
{
    if (target.isNull() || shape.points.isEmpty())
        return QRectF();

    if (shape.filled) {
        const QPainterPath p = pathFor(shape);
        if (p.isEmpty())
            return QRectF();
        StrokeStyle fillStyle = shape.style;
        return Rasterizer::fillPath(target, p, fillStyle.colour, fillStyle.blendMode,
                                    fillStyle.opacity, opt);
    }

    if (shape.kind == ShapeArrow) {
        // The arrow's shaft and head are already explicit vertices; stroke the
        // path so joins come out of StrokeModel.
        QPainterPath p;
        if (shape.points.size() >= 4) {
            // Shaft is points[0]..points[1] (== points[2]); head barbs follow.
            p.moveTo(shape.points.at(0));
            p.lineTo(shape.points.at(1));
        } else {
            p.moveTo(shape.points.first());
            p.lineTo(shape.points.last());
        }
        return Rasterizer::strokePath(target, p, shape.style.colour, shape.strokeWidth,
                                      shape.style.blendMode, shape.style.opacity, opt);
    }

    const QPainterPath p = pathFor(shape);
    if (p.isEmpty())
        return QRectF();
    return Rasterizer::strokePath(target, p, shape.style.colour, shape.strokeWidth,
                                  shape.style.blendMode, shape.style.opacity, opt);
}

QImage ShapeEngine::preview(int w, int h, const Shape &shape, const QPointF &origin) const
{
    QImage img(qMax(8, w), qMax(8, h), QImage::Format_ARGB32_Premultiplied);
    img.fill(Qt::transparent);
    Shape shifted = shape;
    for (QPointF &p : shifted.points)
        p -= origin;
    FillOptions opt;
    opt.antialias = true;
    opt.subSamples = 4;
    render(img, shifted, opt);
    return img;
}

} // namespace paint
