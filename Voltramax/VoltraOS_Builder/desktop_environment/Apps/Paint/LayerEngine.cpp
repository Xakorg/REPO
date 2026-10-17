#include "LayerEngine.h"

#include <QPainter>

#include <algorithm>

namespace paint {

LayerEngine *LayerEngine::s_instance = nullptr;

// ===========================================================================
// PaintLayer
// ===========================================================================

qint64 PaintLayer::bytes() const
{
    qint64 n = 0;
    if (!base.isNull())
        n += qint64(base.bytesPerLine()) * base.height();
    if (!cache.isNull() && cache.constBits() != base.constBits())
        n += qint64(cache.bytesPerLine()) * cache.height();
    for (const Stroke &s : strokes)
        n += s.byteSize();
    return n;
}

const QImage &PaintLayer::resolved() const
{
    if (strokes.isEmpty())
        return base;

    if (!cacheValid || cache.isNull() || cache.size() != base.size()) {
        // `this` is const but the cache is mutable; that is deliberate and is
        // what keeps compositing cheap under a live stroke.
        auto *self = const_cast<PaintLayer *>(this);
        self->cache = base.isNull() ? QImage() : QImage(base);
        if (self->cache.isNull())
            self->cache = QImage();

        FillOptions opt;
        opt.antialias = true;
        opt.subSamples = 4;
        for (const Stroke &s : strokes) {
            if (self->cache.isNull())
                break;
            Rasterizer::drawStroke(self->cache, s, opt);
        }
        cacheValid = true;
    }
    return cache;
}

// ===========================================================================
// Construction / sizing
// ===========================================================================

LayerEngine::LayerEngine(QObject *parent)
    : QObject(parent)
{
    s_instance = this;
    reset(QSize(1920, 1080), QColor(255, 255, 255, 255));
}

LayerEngine::~LayerEngine()
{
    if (s_instance == this)
        s_instance = nullptr;
}

LayerEngine *LayerEngine::instance() { return s_instance; }

void LayerEngine::reset(const QSize &size, const QColor &background)
{
    m_layers.clear();
    m_size = size;
    m_background = background;
    m_current = 0;
    m_nextId = 1;

    PaintLayer bg;
    bg.id = m_nextId++;
    bg.name = QStringLiteral("Background");
    bg.base = Rasterizer::createLayer(size, background);
    bg.opacity = 1.0;
    bg.blendMode = BlendNormal;
    bg.locked = false;
    m_layers.append(bg);

    emit layersChanged();
    emit currentLayerChanged();
    emit compositeDirty();
}

void LayerEngine::resize(const QSize &size, bool scaleContent)
{
    if (size == m_size)
        return;
    m_size = size;
    for (PaintLayer &l : m_layers) {
        if (l.base.isNull()) {
            l.base = Rasterizer::createLayer(size, QColor(0, 0, 0, 0));
            l.invalidate();
            continue;
        }
        QImage scaled = Rasterizer::createLayer(size, QColor(0, 0, 0, 0));
        QPainter p(&scaled);
        p.setRenderHint(QPainter::SmoothPixmapTransform, true);
        if (scaleContent)
            p.drawImage(QRect(QPoint(0, 0), size), l.base);
        else
            p.drawImage(QPoint(0, 0), l.base);
        p.end();
        l.base = scaled;
        l.invalidate();
    }
    emit layersChanged();
    emit compositeDirty();
}

void LayerEngine::setBackground(const QColor &c)
{
    m_background = c;
    if (!m_layers.isEmpty() && m_layers.first().id == 1) {
        m_layers.first().base.fill(c);
        m_layers.first().invalidate();
        emit compositeDirty();
    }
}

// ===========================================================================
// List access
// ===========================================================================

void LayerEngine::setCurrentIndex(int index)
{
    const int i = qBound(0, index, m_layers.size() - 1);
    if (i == m_current)
        return;
    m_current = i;
    emit currentLayerChanged();
}

PaintLayer *LayerEngine::layerAt(int index)
{
    if (index < 0 || index >= m_layers.size())
        return nullptr;
    return &m_layers[index];
}

const PaintLayer *LayerEngine::layerAt(int index) const
{
    if (index < 0 || index >= m_layers.size())
        return nullptr;
    return &m_layers[index];
}

PaintLayer *LayerEngine::layerById(quint32 id)
{
    for (PaintLayer &l : m_layers)
        if (l.id == id)
            return &l;
    return nullptr;
}

int LayerEngine::indexOfId(quint32 id) const
{
    for (int i = 0; i < m_layers.size(); ++i)
        if (m_layers.at(i).id == id)
            return i;
    return -1;
}

quint32 LayerEngine::currentLayerId() const
{
    if (m_current < 0 || m_current >= m_layers.size())
        return 0;
    return m_layers.at(m_current).id;
}

int LayerEngine::totalMemory() const
{
    qint64 n = 0;
    for (const PaintLayer &l : m_layers)
        n += l.bytes();
    return int(qMin<qint64>(n, 0x7FFFFFFF));
}

// ===========================================================================
// Mutations
// ===========================================================================

quint32 LayerEngine::addLayer(const QString &name, int insertAt, quint32 parentId)
{
    PaintLayer l;
    l.id = m_nextId++;
    l.name = name;
    l.base = Rasterizer::createLayer(m_size, QColor(0, 0, 0, 0));
    l.parentId = parentId;
    l.opacity = 1.0;
    l.blendMode = BlendNormal;

    const int at = (insertAt < 0 || insertAt > m_layers.size())
                       ? m_layers.size() : insertAt;
    m_layers.insert(at, l);
    m_current = at;
    rebuildOrder();

    emit layersChanged();
    emit currentLayerChanged();
    emit compositeDirty();
    return l.id;
}

quint32 LayerEngine::addRasterLayer(const QString &name, const QImage &content, int insertAt)
{
    const quint32 id = addLayer(name, insertAt);
    PaintLayer *l = layerById(id);
    if (l && !content.isNull()) {
        QImage copy = content.convertToFormat(QImage::Format_ARGB32_Premultiplied);
        if (copy.size() != m_size) {
            QImage scaled = Rasterizer::createLayer(m_size, QColor(0, 0, 0, 0));
            QPainter p(&scaled);
            p.setRenderHint(QPainter::SmoothPixmapTransform, true);
            p.drawImage(QRect(QPoint(0, 0), m_size), copy);
            p.end();
            copy = scaled;
        }
        l->base = copy;
        l->invalidate();
        emit compositeDirty();
    }
    return id;
}

quint32 LayerEngine::addGroup(const QString &name, int insertAt)
{
    const quint32 id = addLayer(name, insertAt);
    if (PaintLayer *l = layerById(id)) {
        l->isGroup = true;
        l->base = QImage();
        l->cache = QImage();
        emit layersChanged();
        emit compositeDirty();
    }
    return id;
}

bool LayerEngine::removeLayer(quint32 id)
{
    const int idx = indexOfId(id);
    if (idx < 0 || m_layers.size() <= 1)
        return false;
    m_layers.removeAt(idx);

    // Children of a removed group go with it; children of a removed layer are
    // detached rather than silently orphaned into a broken tree.
    QVector<quint32> removed;
    removed.append(id);
    for (int pass = 0; pass < 8; ++pass) {
        bool any = false;
        for (int i = m_layers.size() - 1; i >= 0; --i) {
            if (removed.contains(m_layers.at(i).parentId)) {
                removed.append(m_layers.at(i).id);
                m_layers.removeAt(i);
                any = true;
            }
        }
        if (!any)
            break;
    }
    for (PaintLayer &l : m_layers) {
        if (removed.contains(l.clipToId))
            l.clipToId = 0;
        if (removed.contains(l.parentId))
            l.parentId = 0;
    }

    m_current = qBound(0, m_current, m_layers.size() - 1);
    rebuildOrder();
    emit layersChanged();
    emit currentLayerChanged();
    emit compositeDirty();
    return true;
}

bool LayerEngine::moveLayer(quint32 id, int newIndex)
{
    const int from = indexOfId(id);
    if (from < 0)
        return false;
    const int to = qBound(0, newIndex, m_layers.size() - 1);
    if (from == to)
        return false;

    PaintLayer l = m_layers.takeAt(from);
    m_layers.insert(to, l);
    m_current = to;
    rebuildOrder();

    emit layersChanged();
    emit currentLayerChanged();
    emit compositeDirty();
    return true;
}

bool LayerEngine::renameLayer(quint32 id, const QString &name)
{
    PaintLayer *l = layerById(id);
    if (!l || l->name == name)
        return false;
    l->name = name;
    emit layersChanged();
    emit layerRenamed(id);
    return true;
}

bool LayerEngine::setLayerOpacity(quint32 id, double opacity)
{
    PaintLayer *l = layerById(id);
    if (!l)
        return false;
    const double v = clampd(opacity, 0.0, 1.0);
    if (qFuzzyCompare(l->opacity, v))
        return false;
    l->opacity = v;
    emit compositeDirty();
    emit layersChanged();
    return true;
}

bool LayerEngine::setLayerBlend(quint32 id, int blendMode)
{
    PaintLayer *l = layerById(id);
    if (!l)
        return false;
    const int v = qBound(0, blendMode, 13);
    if (l->blendMode == v)
        return false;
    l->blendMode = v;
    emit compositeDirty();
    emit layersChanged();
    return true;
}

bool LayerEngine::setLayerVisible(quint32 id, bool visible)
{
    PaintLayer *l = layerById(id);
    if (!l || l->visible == visible)
        return false;
    l->visible = visible;
    emit compositeDirty();
    emit layersChanged();
    return true;
}

bool LayerEngine::setLayerLocked(quint32 id, bool locked)
{
    PaintLayer *l = layerById(id);
    if (!l || l->locked == locked)
        return false;
    l->locked = locked;
    emit layersChanged();
    return true;
}

bool LayerEngine::setLayerAlphaLocked(quint32 id, bool alphaLocked)
{
    PaintLayer *l = layerById(id);
    if (!l || l->alphaLocked == alphaLocked)
        return false;
    l->alphaLocked = alphaLocked;
    emit layersChanged();
    return true;
}

bool LayerEngine::setLayerMask(quint32 id, bool isMask, quint32 clipToId)
{
    PaintLayer *l = layerById(id);
    if (!l)
        return false;
    l->isMask = isMask;
    l->clipToId = clipToId;
    emit compositeDirty();
    emit layersChanged();
    return true;
}

bool LayerEngine::setLayerClipTo(quint32 id, quint32 targetId)
{
    PaintLayer *l = layerById(id);
    if (!l)
        return false;
    l->clipToId = targetId;
    l->isMask = targetId != 0;
    emit compositeDirty();
    emit layersChanged();
    return true;
}

bool LayerEngine::setLayerParent(quint32 id, quint32 parentId)
{
    PaintLayer *l = layerById(id);
    if (!l)
        return false;
    if (l->id == parentId)
        return false;
    l->parentId = parentId;
    emit layersChanged();
    emit compositeDirty();
    return true;
}

bool LayerEngine::duplicateLayer(quint32 id, quint32 *newId)
{
    const int idx = indexOfId(id);
    if (idx < 0)
        return false;
    PaintLayer copy = m_layers.at(idx);
    copy.id = m_nextId++;
    copy.name = copy.name + QStringLiteral(" copy");
    copy.isGroup = false;
    copy.invalidate();
    m_layers.insert(idx + 1, copy);
    m_current = idx + 1;
    rebuildOrder();
    if (newId)
        *newId = copy.id;
    emit layersChanged();
    emit currentLayerChanged();
    emit compositeDirty();
    return true;
}

bool LayerEngine::flattenInto(quint32 sourceId, quint32 targetId)
{
    PaintLayer *src = layerById(sourceId);
    PaintLayer *dst = layerById(targetId);
    if (!src || !dst || src == dst)
        return false;

    Rasterizer::compositeImage(dst->base, src->resolved(), src->resolved().rect(),
                               src->blendMode, src->opacity, false);
    dst->invalidate();
    emit compositeDirty();
    return removeLayer(sourceId);
}

void LayerEngine::rebuildOrder()
{
    for (int i = 0; i < m_layers.size(); ++i) {
        m_layers[i].order = i;
        if (i > m_current)
            m_layers[i].invalidate();
    }
}

// ===========================================================================
// Ink
// ===========================================================================

bool LayerEngine::addStroke(quint32 layerId, const Stroke &stroke)
{
    PaintLayer *l = layerById(layerId);
    if (!l || l->locked || l->isGroup)
        return false;
    l->strokes.append(stroke);
    l->invalidate();
    emit compositeDirty();
    return true;
}

bool LayerEngine::removeStroke(quint32 layerId, quint32 strokeId, Stroke *removed)
{
    PaintLayer *l = layerById(layerId);
    if (!l)
        return false;
    for (int i = 0; i < l->strokes.size(); ++i) {
        if (l->strokes.at(i).id == strokeId) {
            if (removed)
                *removed = l->strokes.at(i);
            l->strokes.removeAt(i);
            l->invalidate();
            emit compositeDirty();
            return true;
        }
    }
    return false;
}

bool LayerEngine::replaceStroke(quint32 layerId, quint32 strokeId, const Stroke &replacement)
{
    PaintLayer *l = layerById(layerId);
    if (!l)
        return false;
    for (int i = 0; i < l->strokes.size(); ++i) {
        if (l->strokes.at(i).id == strokeId) {
            l->strokes[i] = replacement;
            l->invalidate();
            emit compositeDirty();
            return true;
        }
    }
    return false;
}

QVector<Stroke> LayerEngine::strokes(quint32 layerId) const
{
    const PaintLayer *l = nullptr;
    for (const PaintLayer &layer : m_layers)
        if (layer.id == layerId) { l = &layer; break; }
    return l ? l->strokes : QVector<Stroke>();
}

int LayerEngine::strokeCount(quint32 layerId) const
{
    for (const PaintLayer &layer : m_layers)
        if (layer.id == layerId)
            return layer.strokes.size();
    return 0;
}

Stroke LayerEngine::strokeAt(quint32 layerId, int index) const
{
    for (const PaintLayer &layer : m_layers)
        if (layer.id == layerId)
            return (index >= 0 && index < layer.strokes.size())
                       ? layer.strokes.at(index) : Stroke();
    return Stroke();
}

// ===========================================================================
// Pixels
// ===========================================================================

QImage &LayerEngine::baseOf(quint32 layerId)
{
    static QImage nullImage;
    PaintLayer *l = layerById(layerId);
    if (!l)
        return nullImage;
    if (l->base.isNull() && !l->isGroup)
        l->base = Rasterizer::createLayer(m_size, QColor(0, 0, 0, 0));
    l->invalidate();
    return l->base;
}

const QImage &LayerEngine::resolvedOf(quint32 layerId) const
{
    static const QImage nullImage;
    for (const PaintLayer &layer : m_layers)
        if (layer.id == layerId)
            return layer.resolved();
    return nullImage;
}

void LayerEngine::invalidate(quint32 layerId)
{
    if (PaintLayer *l = layerById(layerId))
        l->invalidate();
    emit compositeDirty();
}

void LayerEngine::invalidateAll()
{
    for (PaintLayer &l : m_layers)
        l->invalidate();
    emit compositeDirty();
}

bool LayerEngine::paintOn(quint32 layerId, const QRectF &docRect, const QImage &crop,
                          const QRect &at, bool destinationOut)
{
    PaintLayer *l = layerById(layerId);
    if (!l || l->locked || l->isGroup || crop.isNull())
        return false;
    Q_UNUSED(docRect);

    if (l->base.isNull())
        l->base = Rasterizer::createLayer(m_size, QColor(0, 0, 0, 0));

    Rasterizer::applyToCrop(l->base, crop, at, destinationOut);

    if (l->alphaLocked) {
        // Alpha lock: restrict the change to where the layer already had
        // coverage, by restoring the previous alpha in the touched rect.
        // (The colour change is kept; only coverage is protected.)
        const QImage before = l->resolved();
        QImage &dst = l->base;
        const QRect r = at.intersected(dst.rect());
        for (int y = r.top(); y <= r.bottom(); ++y) {
            const quint32 *brow = reinterpret_cast<const quint32 *>(before.constScanLine(y));
            quint32 *drow = reinterpret_cast<quint32 *>(dst.scanLine(y));
            for (int x = r.left(); x <= r.right(); ++x) {
                const int ba = int(brow[x] >> 24);
                if (ba == 0)
                    drow[x] = 0;
                else {
                    const int da = int(drow[x] >> 24);
                    drow[x] = (drow[x] & 0x00FFFFFFu) | (quint32(ba) << 24);
                    Q_UNUSED(da);
                }
            }
        }
    }

    l->invalidate();
    emit compositeDirty();
    return true;
}

// ===========================================================================
// Composite
// ===========================================================================

QImage LayerEngine::compositeRange(int firstIndex, int lastIndex) const
{
    const int from = qBound(0, firstIndex, m_layers.size() - 1);
    const int to = qBound(0, lastIndex, m_layers.size() - 1);

    QImage out = Rasterizer::createLayer(m_size, m_background);
    for (int i = from; i <= to; ++i) {
        const PaintLayer &l = m_layers.at(i);
        if (!l.visible || l.opacity <= 0.0)
            continue;
        if (l.isGroup)
            continue;

        QImage raster = l.resolved();
        if (raster.isNull())
            continue;

        // Clipping mask: restrict output to the target layer's alpha.
        QImage effective = raster;
        if (l.clipToId != 0) {
            const PaintLayer *target = nullptr;
            for (const PaintLayer &cand : m_layers)
                if (cand.id == l.clipToId) { target = &cand; break; }
            if (target) {
                effective = QImage(raster.size(), QImage::Format_ARGB32_Premultiplied);
                effective.fill(Qt::transparent);
                Rasterizer::compositeImage(effective, raster, raster.rect(), BlendNormal, 1.0, false);
                Rasterizer::applyMask(effective, target->resolved(), effective.rect(), 1.0);
            }
        }

        Rasterizer::compositeImage(out, effective, effective.rect(), l.blendMode, l.opacity, false);
    }
    return out;
}

QImage LayerEngine::composite() const
{
    if (m_layers.isEmpty())
        return Rasterizer::createLayer(m_size, m_background);
    return compositeRange(0, m_layers.size() - 1);
}

QImage LayerEngine::compositeFlat() const
{
    // Flat = everything merged into one raster, ignoring groups.
    QImage out = Rasterizer::createLayer(m_size, m_background);
    for (const PaintLayer &l : m_layers) {
        if (!l.visible || l.opacity <= 0.0 || l.isGroup || l.isReference)
            continue;
        const QImage &raster = l.resolved();
        if (raster.isNull())
            continue;
        Rasterizer::compositeImage(out, raster, raster.rect(), l.blendMode, l.opacity, false);
    }
    return out;
}

QImage LayerEngine::compositeFrom(int firstIndex, int lastIndex) const
{
    return compositeRange(firstIndex, lastIndex);
}

QImage LayerEngine::compositeLayer(quint32 layerId) const
{
    const PaintLayer *l = nullptr;
    for (const PaintLayer &layer : m_layers)
        if (layer.id == layerId) { l = &layer; break; }
    if (!l)
        return QImage();
    return l->resolved();
}

// ===========================================================================
// Snapshots
// ===========================================================================

LayerSnapshot LayerEngine::snapshot(quint32 id) const
{
    LayerSnapshot s;
    for (const PaintLayer &l : m_layers) {
        if (l.id != id)
            continue;
        s.id = l.id;
        s.name = l.name;
        s.base = l.base;
        s.strokes = l.strokes;
        s.opacity = l.opacity;
        s.blendMode = l.blendMode;
        s.visible = l.visible;
        s.locked = l.locked;
        s.isGroup = l.isGroup;
        s.isMask = l.isMask;
        s.isReference = l.isReference;
        s.isTextLayer = l.isTextLayer;
        s.alphaLocked = l.alphaLocked;
        s.clipToId = l.clipToId;
        s.parentId = l.parentId;
        s.order = l.order;
        break;
    }
    return s;
}

bool LayerEngine::restoreSnapshot(const LayerSnapshot &snap)
{
    if (snap.id == 0)
        return false;
    for (int i = 0; i < m_layers.size(); ++i) {
        if (m_layers.at(i).id != snap.id)
            continue;
        PaintLayer l = m_layers.at(i);
        l.name = snap.name;
        l.base = snap.base;
        l.strokes = snap.strokes;
        l.opacity = snap.opacity;
        l.blendMode = snap.blendMode;
        l.visible = snap.visible;
        l.locked = snap.locked;
        l.isGroup = snap.isGroup;
        l.isMask = snap.isMask;
        l.isReference = snap.isReference;
        l.isTextLayer = snap.isTextLayer;
        l.alphaLocked = snap.alphaLocked;
        l.clipToId = snap.clipToId;
        l.parentId = snap.parentId;
        l.invalidate();

        const int to = qBound(0, snap.order, m_layers.size() - 1);
        m_layers[i] = l;
        if (to != i) {
            m_layers.move(i, to);
            rebuildOrder();
        }
        emit layersChanged();
        emit compositeDirty();
        return true;
    }

    // The layer no longer exists (undo of a delete): re-create it.
    PaintLayer l;
    l.id = snap.id;
    l.name = snap.name;
    l.base = snap.base;
    l.strokes = snap.strokes;
    l.opacity = snap.opacity;
    l.blendMode = snap.blendMode;
    l.visible = snap.visible;
    l.locked = snap.locked;
    l.isGroup = snap.isGroup;
    l.isMask = snap.isMask;
    l.isReference = snap.isReference;
    l.isTextLayer = snap.isTextLayer;
    l.alphaLocked = snap.alphaLocked;
    l.clipToId = snap.clipToId;
    l.parentId = snap.parentId;
    l.invalidate();

    const int to = qBound(0, snap.order, m_layers.size());
    m_layers.insert(to, l);
    m_nextId = qMax(m_nextId, snap.id + 1);
    rebuildOrder();
    emit layersChanged();
    emit compositeDirty();
    return true;
}

QVector<LayerSnapshot> LayerEngine::snapshotAll() const
{
    QVector<LayerSnapshot> out;
    out.reserve(m_layers.size());
    for (const PaintLayer &l : m_layers)
        out.append(snapshot(l.id));
    return out;
}

void LayerEngine::restoreAll(const QVector<LayerSnapshot> &snap)
{
    m_layers.clear();
    quint32 high = 1;
    for (const LayerSnapshot &s : snap) {
        PaintLayer l;
        l.id = s.id;
        l.name = s.name;
        l.base = s.base;
        l.strokes = s.strokes;
        l.opacity = s.opacity;
        l.blendMode = s.blendMode;
        l.visible = s.visible;
        l.locked = s.locked;
        l.isGroup = s.isGroup;
        l.isMask = s.isMask;
        l.isReference = s.isReference;
        l.isTextLayer = s.isTextLayer;
        l.alphaLocked = s.alphaLocked;
        l.clipToId = s.clipToId;
        l.parentId = s.parentId;
        l.order = s.order;
        l.invalidate();
        high = qMax(high, s.id);
        m_layers.append(l);
    }
    if (m_layers.isEmpty())
        reset(m_size, m_background);
    else {
        std::stable_sort(m_layers.begin(), m_layers.end(),
                         [](const PaintLayer &a, const PaintLayer &b) {
                             return a.order < b.order;
                         });
        m_nextId = high + 1;
        m_current = qBound(0, m_current, m_layers.size() - 1);
        rebuildOrder();
    }
    emit layersChanged();
    emit currentLayerChanged();
    emit compositeDirty();
}

} // namespace paint
