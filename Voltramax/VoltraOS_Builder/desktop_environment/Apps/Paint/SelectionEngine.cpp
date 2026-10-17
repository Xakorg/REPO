#include "SelectionEngine.h"

#include <QPainter>
#include <QtMath>

#include <cmath>
#include <queue>
#include <vector>

namespace paint {

// ===========================================================================
// Construction
// ===========================================================================

SelectionEngine::SelectionEngine(QObject *parent)
    : QObject(parent)
{
    m_timer.setInterval(66);
    connect(&m_timer, &QTimer::timeout, this, [this]() {
        m_state.antsOffset = std::fmod(m_state.antsOffset + 1.0,
                                       m_state.antsDash + m_state.antsGap);
        emit antsChanged();
    });
}

SelectionEngine::~SelectionEngine() = default;

void SelectionEngine::setMarching(bool v)
{
    if (m_state.marching == v)
        return;
    m_state.marching = v;
    if (v) {
        if (!m_timer.isActive())
            m_timer.start();
    } else {
        m_timer.stop();
        m_state.antsOffset = 0.0;
    }
    emit marchingChanged();
    emit antsChanged();
}

void SelectionEngine::setMode(int mode)
{
    const SelectionMode m = SelectionMode(qBound(0, mode, 3));
    if (m_state.mode == m)
        return;
    m_state.mode = m;
    emit changed();
}

void SelectionEngine::setFeather(double v)
{
    const double nv = clampd(v, 0.0, 64.0);
    if (qFuzzyCompare(m_feather, nv))
        return;
    m_feather = nv;
    reapplyFeather();
    emit changed();
}

void SelectionEngine::setTolerance(int v)
{
    const int nv = qBound(0, v, 255);
    if (m_tolerance == nv)
        return;
    m_tolerance = nv;
    emit wandChanged();
}

void SelectionEngine::setContiguous(bool v)
{
    if (m_contiguous == v)
        return;
    m_contiguous = v;
    emit wandChanged();
}

void SelectionEngine::setAntialias(bool v)
{
    if (m_antialias == v)
        return;
    m_antialias = v;
    emit wandChanged();
}

// ===========================================================================
// Rasterising / metrics
// ===========================================================================

QImage SelectionEngine::rasterisePath(const QPainterPath &path, const QSize &size,
                                      bool antialias)
{
    QImage mask(size, QImage::Format_Grayscale8);
    mask.fill(char(0));
    if (path.isEmpty() || size.isEmpty())
        return mask;

    QPainter p(&mask);
    p.setRenderHint(QPainter::Antialiasing, antialias);
    p.setPen(Qt::NoPen);
    p.setBrush(Qt::white);
    p.drawPath(path);
    p.end();
    return mask;
}

void SelectionEngine::applyMode(QImage &incoming, const QSize &size)
{
    QImage normal(size, QImage::Format_Grayscale8);
    normal.fill(char(0));

    if (m_mask.isNull() || m_state.mode == SelectReplace) {
        normal = incoming;
    } else {
        QImage prev = m_mask;
        if (prev.size() != size) {
            prev = QImage(size, QImage::Format_Grayscale8);
            prev.fill(char(0));
        }
        for (int y = 0; y < size.height(); ++y) {
            const uchar *a = incoming.constScanLine(y);
            const uchar *b = prev.constScanLine(y);
            uchar *o = normal.scanLine(y);
            for (int x = 0; x < size.width(); ++x) {
                switch (m_state.mode) {
                case SelectAdd:
                    o[x] = uchar(qMax(int(a[x]), int(b[x])));
                    break;
                case SelectSubtract:
                    o[x] = uchar(qMax(0, int(b[x]) - int(a[x])));
                    break;
                case SelectIntersect:
                    o[x] = uchar((int(a[x]) * int(b[x])) / 255);
                    break;
                default:
                    o[x] = a[x];
                    break;
                }
            }
        }
    }
    m_mask = normal;
}

void SelectionEngine::rebuildMetrics()
{
    if (m_mask.isNull()) {
        m_state.active = false;
        m_state.pixelCount = 0;
        m_state.fillRatio = 0.0;
        m_state.bounds = QRectF();
        return;
    }

    const QSize s = m_mask.size();
    qint64 count = 0;
    int minX = s.width(), minY = s.height(), maxX = -1, maxY = -1;
    for (int y = 0; y < s.height(); ++y) {
        const uchar *row = m_mask.constScanLine(y);
        for (int x = 0; x < s.width(); ++x) {
            if (row[x] == 0)
                continue;
            ++count;
            minX = qMin(minX, x);
            minY = qMin(minY, y);
            maxX = qMax(maxX, x);
            maxY = qMax(maxY, y);
        }
    }

    m_state.pixelCount = int(qMin<qint64>(count, 0x7FFFFFFF));
    m_state.fillRatio = s.isEmpty() ? 0.0
                                    : double(count) / double(qint64(s.width()) * s.height());
    m_state.active = count > 0;
    m_state.bounds = count > 0 ? QRectF(minX, minY, maxX - minX + 1, maxY - minY + 1)
                               : QRectF();
    if (count == 0)
        m_path = QPainterPath();
}

void SelectionEngine::finishFromPath(const QPainterPath &path, const QSize &size,
                                     bool additive)
{
    m_path = path;
    const QImage raster = rasterisePath(path, size, m_antialias);
    const SelectionMode saved = m_state.mode;
    if (additive)
        m_state.mode = SelectAdd;
    applyMode(raster, size);
    m_state.mode = saved;
    rebuildMetrics();
    if (m_feather > 0.0)
        reapplyFeather();
    emit changed();
    emit selectionCommitted();
}

QPainterPath SelectionEngine::clipPath() const
{
    QPainterPath p;
    if (m_mask.isNull())
        return p;
    // Build the path from the mask by marching squares on the mid threshold.
    // (Fast enough at document scale, and gives an exact, editable outline.)
    const QSize s = m_mask.size();
    for (int y = 0; y < s.height() - 1; ++y) {
        const uchar *r0 = m_mask.constScanLine(y);
        const uchar *r1 = m_mask.constScanLine(y + 1);
        int runStart = -1;
        for (int x = 0; x <= s.width(); ++x) {
            const bool inside = x < s.width() && r0[x] >= 128;
            if (inside && runStart < 0)
                runStart = x;
            if (!inside && runStart >= 0) {
                p.addRect(QRectF(runStart, y, x - runStart, 1.0));
                runStart = -1;
            }
        }
        Q_UNUSED(r1);
    }
    return p;
}

// ===========================================================================
// Rectangle
// ===========================================================================

void SelectionEngine::beginRectangle(const QPointF &start)
{
    m_anchor = start;
    m_cursor = start;
    m_dragging = true;
    m_dragMode = 0;
    m_state.kind = QStringLiteral("rect");
    m_state.active = true;
    emit changed();
}

void SelectionEngine::updateRectangle(const QPointF &current, bool constrainSquare)
{
    m_cursor = current;
    QRectF r = QRectF(m_anchor, m_cursor).normalized();
    if (constrainSquare) {
        const double side = qMax(r.width(), r.height());
        r.setWidth(side);
        r.setHeight(side);
        r = r.normalized();
    }

    QPainterPath path;
    path.addRect(r);
    m_path = path;

    if (m_mask.isNull()) {
        // Live preview without committing: keep a transient mask so the ants
        // are drawn from the same source of truth as a committed selection.
        m_mask = QImage(path.boundingRect().adjusted(-2, -2, 2, 2).toAlignedRect().size(),
                        QImage::Format_Grayscale8);
        m_mask.fill(char(0));
    }
    emit changed();
}

void SelectionEngine::updateRectangle(const QRectF &rect, bool additive)
{
    QPainterPath path;
    path.addRect(rect);
    const QSize size = m_mask.isNull() ? rect.toAlignedRect().size() : m_mask.size();
    finishFromPath(path, size, additive);
}

void SelectionEngine::commitRectangle()
{
    m_dragging = false;
    if (!m_path.isEmpty()) {
        // The live preview may have been a placeholder mask: rebuild against
        // whatever size the caller last supplied, else derive from the rect.
        const QSize size = m_mask.isNull() ? m_path.boundingRect().toAlignedRect().size()
                                           : m_mask.size();
        QImage full(size, QImage::Format_Grayscale8);
        full.fill(char(0));
        {
            QPainter p(&full);
            p.setRenderHint(QPainter::Antialiasing, m_antialias);
            p.setPen(Qt::NoPen);
            p.setBrush(Qt::white);
            p.drawPath(m_path);
            p.end();
        }
        applyMode(full, size);
        rebuildMetrics();
        if (m_feather > 0.0)
            reapplyFeather();
        m_state.kind = QStringLiteral("rect");
        emit changed();
        emit selectionCommitted();
    }
}

// ===========================================================================
// Lasso
// ===========================================================================

void SelectionEngine::beginLasso(const QPointF &start)
{
    m_lasso.clear();
    m_lasso.append(start);
    m_anchor = start;
    m_cursor = start;
    m_dragging = true;
    m_dragMode = 1;
    m_state.kind = QStringLiteral("lasso");
    m_state.active = true;
    emit changed();
}

void SelectionEngine::addLassoPoint(const QPointF &p, double minDistance)
{
    if (m_lasso.isEmpty()) {
        m_lasso.append(p);
        return;
    }
    const QPointF d = p - m_lasso.last();
    if (std::hypot(d.x(), d.y()) < minDistance)
        return;
    m_lasso.append(p);
    m_cursor = p;
    emit changed();
}

void SelectionEngine::updateLasso(const QPointF &p)
{
    addLassoPoint(p, 1.0);
}

void SelectionEngine::commitLasso(bool closed)
{
    m_dragging = false;
    if (m_lasso.size() < 3) {
        selectNone();
        return;
    }

    QPainterPath path;
    path.moveTo(m_lasso.first());
    for (int i = 1; i < m_lasso.size(); ++i)
        path.lineTo(m_lasso.at(i));
    if (closed)
        path.closeSubpath();

    const QSize size = m_mask.isNull()
                           ? m_lasso.boundingRect().toAlignedRect().size()
                           : m_mask.size();
    finishFromPath(path, size, false);
    m_state.kind = QStringLiteral("lasso");
    emit changed();
}

// ===========================================================================
// Magic wand
// ===========================================================================

void SelectionEngine::wandSelect(const QImage &source, const QPointF &seed, bool additive)
{
    if (source.isNull())
        return;
    const QSize s = source.size();
    const QPoint sp(int(std::floor(seed.x())), int(std::floor(seed.y())));
    if (!QRect(QPoint(0, 0), s).contains(sp))
        return;

    QImage work = source.convertToFormat(QImage::Format_ARGB32);

    // Reference colour from the seed pixel, measured in straight RGBA.
    const QRgb ref = work.pixel(sp.x(), sp.y());
    const int refR = qRed(ref), refG = qGreen(ref), refB = qBlue(ref), refA = qAlpha(ref);

    // Tolerance is a euclidean distance in a 4D RGBA cube, normalised to 0..1.
    const double tol = clampd(double(m_tolerance) / 255.0, 0.0, 1.0);
    const double tol2 = tol * tol * 4.0;

    QImage incoming(s, QImage::Format_Grayscale8);
    incoming.fill(char(0));

    auto matches = [&](int x, int y) {
        const QRgb p = work.pixel(x, y);
        const double dr = (qRed(p) - refR) / 255.0;
        const double dg = (qGreen(p) - refG) / 255.0;
        const double db = (qBlue(p) - refB) / 255.0;
        const double da = (qAlpha(p) - refA) / 255.0;
        return (dr * dr + dg * dg + db * db + da * da) <= tol2;
    };

    auto paint = [&](int x, int y, uchar v) {
        *reinterpret_cast<uchar *>(incoming.scanLine(y) + x) = v;
    };

    if (m_contiguous) {
        // Breadth-first connectivity (4-neighbour) with an explicit queue so a
        // full-canvas selection cannot overflow the C stack.
        std::queue<QPoint> q;
        std::vector<char> visited(size_t(s.width()) * size_t(s.height()), 0);
        auto idx = [&](int x, int y) { return size_t(y) * size_t(s.width()) + size_t(x); };

        visited[idx(sp.x(), sp.y())] = 1;
        paint(sp.x(), sp.y(), char(255));
        q.push(sp);

        int minX = sp.x(), minY = sp.y(), maxX = sp.x(), maxY = sp.y();
        while (!q.empty()) {
            const QPoint c = q.front();
            q.pop();

            const int dx[4] = { 1, -1, 0, 0 };
            const int dy[4] = { 0, 0, 1, -1 };
            for (int i = 0; i < 4; ++i) {
                const int nx = c.x() + dx[i];
                const int ny = c.y() + dy[i];
                if (nx < 0 || ny < 0 || nx >= s.width() || ny >= s.height())
                    continue;
                if (visited[idx(nx, ny)])
                    continue;
                if (!matches(nx, ny))
                    continue;
                visited[idx(nx, ny)] = 1;
                paint(nx, ny, char(255));
                minX = qMin(minX, nx); minY = qMin(minY, ny);
                maxX = qMax(maxX, nx); maxY = qMax(maxY, ny);
                q.push(QPoint(nx, ny));
            }
        }
        Q_UNUSED(minX); Q_UNUSED(minY); Q_UNUSED(maxX); Q_UNUSED(maxY);
    } else {
        // Global: every pixel within tolerance of the seed colour.
        for (int y = 0; y < s.height(); ++y) {
            uchar *row = incoming.scanLine(y);
            for (int x = 0; x < s.width(); ++x) {
                if (matches(x, y))
                    row[x] = char(255);
            }
        }
    }

    const SelectionMode saved = m_state.mode;
    if (additive)
        m_state.mode = SelectAdd;
    applyMode(incoming, s);
    m_state.mode = saved;

    m_state.kind = QStringLiteral("wand");
    m_path = QPainterPath();
    rebuildMetrics();
    if (m_feather > 0.0)
        reapplyFeather();
    emit changed();
    emit selectionCommitted();
}

void SelectionEngine::selectAll(const QSize &size)
{
    QImage m(size, QImage::Format_Grayscale8);
    m.fill(char(255));
    m_mask = m;
    m_path = QPainterPath();
    m_state.kind = QStringLiteral("all");
    rebuildMetrics();
    emit changed();
    emit selectionCommitted();
}

void SelectionEngine::invert(const QSize &size)
{
    QImage out(size, QImage::Format_Grayscale8);
    for (int y = 0; y < size.height(); ++y) {
        const uchar *in = m_mask.isNull() ? nullptr : m_mask.constScanLine(y);
        uchar *o = out.scanLine(y);
        for (int x = 0; x < size.width(); ++x)
            o[x] = in ? uchar(255 - in[x]) : char(0);
    }
    m_mask = out;
    m_state.kind = QStringLiteral("inverted");
    rebuildMetrics();
    emit changed();
    emit selectionCommitted();
}

void SelectionEngine::selectNone()
{
    if (m_mask.isNull() && !m_state.active) {
        emit selectionCleared();
        return;
    }
    m_mask = QImage();
    m_path = QPainterPath();
    m_lasso.clear();
    m_state.active = false;
    m_state.pixelCount = 0;
    m_state.fillRatio = 0.0;
    m_state.bounds = QRectF();
    m_state.kind.clear();
    emit changed();
    emit selectionCleared();
}

void SelectionEngine::reapplyFeather()
{
    if (m_mask.isNull())
        return;
    if (m_feather <= 0.0)
        return;

    // Two box-blur passes approximates a gaussian with the same radius, which
    // is the standard cheap trick and is accurate to within a few percent.
    const int r = qBound(1, int(std::lround(m_feather * 0.5)), 32);
    QImage a = m_mask;
    QImage b = m_mask;

    for (int y = 0; y < m_mask.height(); ++y) {
        const uchar *src = m_mask.constScanLine(y);
        uchar *dst = a.scanLine(y);
        int sum = 0;
        for (int x = -r; x <= r; ++x)
            sum += src[qBound(0, x, m_mask.width() - 1)];
        for (int x = 0; x < m_mask.width(); ++x) {
            dst[x] = uchar(sum / (2 * r + 1));
            const int add = src[qBound(0, x + r + 1, m_mask.width() - 1)];
            const int sub = src[qBound(0, x - r, m_mask.width() - 1)];
            sum += add - sub;
        }
    }

    for (int x = 0; x < m_mask.width(); ++x) {
        int sum = 0;
        for (int y = -r; y <= r; ++y)
            sum += a.constScanLine(qBound(0, y, m_mask.height() - 1))[x];
        for (int y = 0; y < m_mask.height(); ++y) {
            *reinterpret_cast<uchar *>(b.scanLine(y) + x) = uchar(sum / (2 * r + 1));
            const int add = a.constScanLine(qBound(0, y + r + 1, m_mask.height() - 1))[x];
            const int sub = a.constScanLine(qBound(0, y - r, m_mask.height() - 1))[x];
            sum += add - sub;
        }
    }

    m_mask = b;
    rebuildMetrics();
}

// ===========================================================================
// Handles / transforms
// ===========================================================================

QRectF SelectionEngine::box() const
{
    if (m_state.bounds.isNull())
        return QRectF();
    return m_state.bounds;
}

QVariantList SelectionEngine::handles() const
{
    QVariantList out;
    if (!m_state.active)
        return out;

    const QRectF b = m_state.bounds;
    struct P { const char *role; QPointF p; };
    const P pts[] = {
        { "topLeft", b.topLeft() }, { "top", QPointF(b.center().x(), b.top()) },
        { "topRight", b.topRight() }, { "right", QPointF(b.right(), b.center().y()) },
        { "bottomRight", b.bottomRight() }, { "bottom", QPointF(b.center().x(), b.bottom()) },
        { "bottomLeft", b.bottomLeft() }, { "left", QPointF(b.left(), b.center().y()) },
        { "rotate", QPointF(b.center().x(), b.top() - 24.0) }
    };
    int i = 0;
    for (const P &p : pts) {
        QVariantMap m;
        m.insert("role", QString::fromLatin1(p.role));
        m.insert("index", i++);
        m.insert("x", p.p.x());
        m.insert("y", p.p.y());
        out.append(m);
    }
    return out;
}

QTransform SelectionEngine::transformFor(const TransformRequest &req) const
{
    QTransform t;
    const QRectF b = m_state.bounds;
    if (!req.handle || b.isNull())
        return t;

    const QPointF c = b.center();

    // --- move ---------------------------------------------------------------
    if (req.handle == HandleMove) {
        t.translate(req.to.x() - req.from.x(), req.to.y() - req.from.y());
        return t;
    }

    // --- rotate ---------------------------------------------------------------
    if (req.handle == HandleRotate) {
        const double a0 = std::atan2(req.from.y() - c.y(), req.from.x() - c.x());
        const double a1 = std::atan2(req.to.y() - c.y(), req.to.x() - c.x());
        double deg = qRadiansToDegrees(a1 - a0);
        if (req.snap45)
            deg = std::round(deg / 45.0) * 45.0;
        t.translate(c.x(), c.y());
        t.rotate(deg);
        t.translate(-c.x(), -c.y());
        return t;
    }

    const bool isLeft = req.handle == HandleTopLeft || req.handle == HandleLeft
                        || req.handle == HandleBottomLeft;
    const bool isRight = req.handle == HandleTopRight || req.handle == HandleRight
                         || req.handle == HandleRightBottom;
    const bool isTop = req.handle == HandleTopLeft || req.handle == HandleTop
                       || req.handle == HandleTopRight;
    const bool isBottom = req.handle == HandleBottomLeft || req.handle == HandleBottom
                          || req.handle == HandleRightBottom;

    // --- skew from the four edge handles ------------------------------------
    // An edge handle slides along the edge, shearing the box. This is real
    // shear, not a scale: vertical edges keep their x, only x depends on y.
    if ((isTop || isBottom) && !(isLeft || isRight)) {
        if (std::fabs(b.height()) > 1e-6) {
            const double k = (req.to.x() - req.from.x()) / b.height();
            const double originY = isTop ? b.bottom() : b.top();
            t.translate(0.0, originY);
            t.shear(k, 0.0);
            t.translate(0.0, -originY);
        }
        return t;
    }
    if ((isLeft || isRight) && !(isTop || isBottom)) {
        if (std::fabs(b.width()) > 1e-6) {
            const double k = (req.to.y() - req.from.y()) / b.width();
            const double originX = isLeft ? b.right() : b.left();
            t.translate(originX, 0.0);
            t.shear(0.0, k);
            t.translate(-originX, 0.0);
        }
        return t;
    }

    // --- scale from a corner handle ------------------------------------------
    // The fixed point is the opposite corner, or the centre when the modifier
    // asks to scale from the middle.
    double sx = 1.0, sy = 1.0;
    if (isLeft) {
        const double newW = b.width() + (b.left() - req.to.x());
        if (std::fabs(b.width()) > 1e-6)
            sx = newW / b.width();
    } else if (isRight) {
        const double newW = req.to.x() - b.left();
        if (std::fabs(b.width()) > 1e-6)
            sx = newW / b.width();
    }
    if (isTop) {
        const double newH = b.height() + (b.top() - req.to.y());
        if (std::fabs(b.height()) > 1e-6)
            sy = newH / b.height();
    } else if (isBottom) {
        const double newH = req.to.y() - b.top();
        if (std::fabs(b.height()) > 1e-6)
            sy = newH / b.height();
    }

    if (req.keepAspect && (std::fabs(sx - 1.0) > 1e-9) && (std::fabs(sy - 1.0) > 1e-9)) {
        const double s = (std::fabs(sx) > std::fabs(sy)) ? sx : sy;
        sx = s;
        sy = s;
    }
    if (req.constrainAxis) {
        if (std::fabs(sx - 1.0) > std::fabs(sy - 1.0))
            sy = 1.0;
        else
            sx = 1.0;
    }

    const QPointF origin = req.fromCentre
                               ? c
                               : QPointF(isLeft ? b.right() : (isRight ? b.left() : c.x()),
                                         isTop ? b.bottom() : (isBottom ? b.top() : c.y()));

    t.translate(origin.x(), origin.y());
    t.scale(sx, sy);
    t.translate(-origin.x(), -origin.y());
    return t;
}

void SelectionEngine::applyMaskTransform(const QTransform &m)
{
    if (m_mask.isNull())
        return;

    // Render the mask into a new image through the transform. This is what
    // makes dragging a selection move the ants with it.
    const QRectF mapped = m.mapRect(m_state.bounds);
    const QRectF orig = m_state.bounds;
    const int pad = 8;
    QRectF region = orig.united(mapped).adjusted(-pad, -pad, pad, pad);
    const QRect target = region.toAlignedRect();

    QImage out(target.size(), QImage::Format_Grayscale8);
    out.fill(char(0));

    {
        QTransform local;
        local.translate(-target.x(), -target.y());
        local = m * local;

        // Composite the mask through the transform using a grayscale->alpha
        // intermediate so QPainter can interpolate it correctly.
        QImage alpha(m_mask.size(), QImage::Format_ARGB32_Premultiplied);
        for (int y = 0; y < m_mask.height(); ++y) {
            const uchar *src = m_mask.constScanLine(y);
            quint32 *dst = reinterpret_cast<quint32 *>(alpha.scanLine(y));
            for (int x = 0; x < m_mask.width(); ++x) {
                const quint32 v = src[x];
                dst[x] = (v << 24) | 0x00FFFFFFu;
            }
        }

        QImage scaled(target.size(), QImage::Format_ARGB32_Premultiplied);
        scaled.fill(Qt::transparent);
        QPainter p(&scaled);
        p.setRenderHint(QPainter::SmoothPixmapTransform, true);
        p.setTransform(local);
        p.drawImage(QPointF(0, 0), alpha);
        p.end();

        for (int y = 0; y < target.height(); ++y) {
            const quint32 *src = reinterpret_cast<const quint32 *>(scaled.constScanLine(y));
            uchar *dst = out.scanLine(y);
            for (int x = 0; x < target.width(); ++x)
                dst[x] = uchar(src[x] >> 24);
        }
    }

    // Rebase: the mask origin moves to `target.topLeft()`.
    m_mask = out;
    m_state.bounds = mapped.translated(-target.topLeft());
    m_path = QPainterPath();
    rebuildMetrics();
    emit changed();
}

// ===========================================================================
// Marching ants
// ===========================================================================

void SelectionEngine::tickAnts(double dtMs)
{
    if (!m_state.marching)
        return;
    const double period = m_state.antsDash + m_state.antsGap;
    m_state.antsOffset = std::fmod(m_state.antsOffset + dtMs * 0.04, period);
    emit antsChanged();
}

QVariantList SelectionEngine::antsSegments() const
{
    QVariantList out;
    if (!m_state.active || m_state.bounds.isNull())
        return out;

    const QRectF b = m_state.bounds;
    const double period = m_state.antsDash + m_state.antsGap;
    auto emitEdge = [&](const QPointF &a, const QPointF &bb) {
        const QPointF d = bb - a;
        const double len = std::hypot(d.x(), d.y());
        if (len < 1e-6)
            return;
        const QPointF u(d.x() / len, d.y() / len);
        double s = -m_state.antsOffset;
        while (s < len) {
            const double e = qMin(s + m_state.antsDash, len);
            if (e > 0.0) {
                QVariantMap m;
                m.insert("x1", a.x() + u.x() * qMax(0.0, s));
                m.insert("y1", a.y() + u.y() * qMax(0.0, s));
                m.insert("x2", a.x() + u.x() * e);
                m.insert("y2", a.y() + u.y() * e);
                out.append(m);
            }
            s += period;
        }
    };
    emitEdge(b.topLeft(), b.topRight());
    emitEdge(b.topRight(), b.bottomRight());
    emitEdge(b.bottomRight(), b.bottomLeft());
    emitEdge(b.bottomLeft(), b.topLeft());
    return out;
}

QPolygonF SelectionEngine::antOutline() const
{
    QPolygonF p;
    if (!m_state.active || m_state.bounds.isNull())
        return p;
    const QRectF b = m_state.bounds;
    p << b.topLeft() << b.topRight() << b.bottomRight() << b.bottomLeft() << b.topLeft();
    return p;
}

// ===========================================================================
// Clipboard
// ===========================================================================

QImage SelectionEngine::copy(const QImage &source) const
{
    if (source.isNull() || m_mask.isNull())
        return QImage();

    const QRect r = m_state.bounds.toAlignedRect().intersected(source.rect());
    if (r.isEmpty())
        return QImage();

    QImage slice = source.copy(r);
    QImage maskSlice = m_mask.copy(r);

    QImage out(slice.size(), QImage::Format_ARGB32_Premultiplied);
    out.fill(Qt::transparent);
    for (int y = 0; y < r.height(); ++y) {
        const quint32 *src = reinterpret_cast<const quint32 *>(slice.constScanLine(y));
        const uchar *mk = maskSlice.constScanLine(y);
        quint32 *dst = reinterpret_cast<quint32 *>(out.scanLine(y));
        for (int x = 0; x < r.width(); ++x) {
            const double k = double(mk[x]) / 255.0;
            if (k <= 0.0) {
                dst[x] = 0;
                continue;
            }
            const quint32 s = src[x];
            const int na = int(double(s >> 24) * k);
            const int nr = int(double((s >> 16) & 0xFF) * k);
            const int ng = int(double((s >> 8) & 0xFF) * k);
            const int nb = int(double(s & 0xFF) * k);
            dst[x] = (quint32(na) << 24) | (quint32(nr) << 16)
                     | (quint32(ng) << 8) | quint32(nb);
        }
    }
    return out;
}

QImage SelectionEngine::cut(QImage &source)
{
    const QImage result = copy(source);
    if (result.isNull())
        return result;

    // Zero the selected region in the source.
    for (int y = 0; y < source.height(); ++y) {
        if (y < m_mask.height()) {
            const uchar *mk = m_mask.constScanLine(y);
            quint32 *dst = reinterpret_cast<quint32 *>(source.scanLine(y));
            for (int x = 0; x < source.width() && x < m_mask.width(); ++x) {
                const double k = double(mk[x]) / 255.0;
                if (k <= 0.0)
                    continue;
                const quint32 d = dst[x];
                const double keep = 1.0 - k;
                const int na = int(double(d >> 24) * keep);
                const int nr = int(double((d >> 16) & 0xFF) * keep);
                const int ng = int(double((d >> 8) & 0xFF) * keep);
                const int nb = int(double(d & 0xFF) * keep);
                dst[x] = (quint32(na) << 24) | (quint32(nr) << 16)
                         | (quint32(ng) << 8) | quint32(nb);
            }
        }
    }
    emit changed();
    return result;
}

bool SelectionEngine::paste(const QImage &content, const QPointF &topLeft, QImage &destination,
                            bool asFloating)
{
    if (content.isNull() || destination.isNull())
        return false;

    const QPointF pos = topLeft.isNull() && !m_state.bounds.isNull()
                            ? m_state.bounds.topLeft() : topLeft;

    const QRect target = QRect(pos.toPoint(), content.size());
    Rasterizer::compositeImage(destination, content, target, BlendNormal, 1.0, false);
    if (asFloating) {
        m_state.active = true;
        m_state.bounds = QRectF(target);
        m_state.kind = QStringLiteral("transform");
        emit changed();
    }
    emit selectionCommitted();
    return true;
}

bool SelectionEngine::pasteInto(const QImage &content, const QPointF &topLeft,
                                QImage &destination)
{
    if (content.isNull() || destination.isNull())
        return false;
    const QRect target = QRect(topLeft.toPoint(), content.size());

    if (m_mask.isNull()) {
        Rasterizer::compositeImage(destination, content, target, BlendNormal, 1.0, false);
        return true;
    }

    QImage clipped(target.size(), QImage::Format_ARGB32_Premultiplied);
    clipped.fill(Qt::transparent);
    Rasterizer::compositeImage(clipped, content, QRect(QPoint(0, 0), target.size()),
                               BlendNormal, 1.0, false);

    for (int y = 0; y < target.height(); ++y) {
        const int dy = target.top() + y;
        if (dy < 0 || dy >= destination.height())
            continue;
        if (y >= m_mask.height())
            continue;
        const uchar *mk = m_mask.constScanLine(y);
        quint32 *dst = reinterpret_cast<quint32 *>(destination.scanLine(dy));
        const quint32 *src = reinterpret_cast<const quint32 *>(clipped.constScanLine(y));
        for (int x = 0; x < target.width(); ++x) {
            const int dx = target.left() + x;
            if (dx < 0 || dx >= destination.width())
                continue;
            if (x >= m_mask.width())
                continue;
            const double k = double(mk[x]) / 255.0;
            if (k <= 0.0)
                continue;
            const quint32 s = src[x];
            if ((s >> 24) == 0)
                continue;
            dst[dx] = Rasterizer::blendPixel(dst[dx], s, BlendNormal, k);
        }
    }
    return true;
}

// ===========================================================================
// Painting helpers
// ===========================================================================

QRectF SelectionEngine::paintRegion() const
{
    return m_state.active ? m_state.bounds : QRectF();
}

double SelectionEngine::coverageAt(const QPointF &docPos) const
{
    if (!m_state.active || m_mask.isNull())
        return 1.0;
    const int x = int(std::floor(docPos.x()));
    const int y = int(std::floor(docPos.y()));
    if (x < 0 || y < 0 || x >= m_mask.width() || y >= m_mask.height())
        return 0.0;
    return double(m_mask.constScanLine(y)[x]) / 255.0;
}

void SelectionEngine::constrainImage(QImage &img) const
{
    if (!m_state.active || m_mask.isNull() || img.isNull())
        return;
    if (m_mask.size() != img.size())
        return;
    for (int y = 0; y < img.height(); ++y) {
        const uchar *mk = m_mask.constScanLine(y);
        quint32 *dst = reinterpret_cast<quint32 *>(img.scanLine(y));
        for (int x = 0; x < img.width(); ++x) {
            const double k = double(mk[x]) / 255.0;
            if (k >= 0.999)
                continue;
            const quint32 d = dst[x];
            const double keep = k;
            const int na = int(double(d >> 24) * keep);
            const int nr = int(double((d >> 16) & 0xFF) * keep);
            const int ng = int(double((d >> 8) & 0xFF) * keep);
            const int nb = int(double(d & 0xFF) * keep);
            dst[x] = (quint32(na) << 24) | (quint32(nr) << 16)
                     | (quint32(ng) << 8) | quint32(nb);
        }
    }
    emit changed();
}

void SelectionEngine::restoreMask(const QImage &mask)
{
    if (mask.isNull()) {
        selectNone();
        return;
    }

    // The serialised mask is 8-bit grey; normalise to the engine's canonical
    // Grayscale8 so no downstream reader has to care what the PNG round-trip
    // produced.
    m_mask = mask.format() == QImage::Format_Grayscale8
                 ? mask
                 : mask.convertToFormat(QImage::Format_Grayscale8);

    // Rebuild every derived value from the raster rather than trusting any of
    // the saved metrics - a container that disagrees with its own pixels is
    // exactly the kind of corruption this path has to survive.
    m_path = QPainterPath();
    m_state.mode = SelectReplace;
    m_state.kind = QStringLiteral("restored");
    m_state.antsOffset = 0.0;
    m_dragging = false;
    m_lasso.clear();
    rebuildMetrics();

    if (m_feather > 0.0)
        reapplyFeather();

    emit changed();
    emit antsChanged();
    emit selectionCommitted();
}

} // namespace paint
