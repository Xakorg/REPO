#ifndef PAINT_LAYER_ENGINE_H
#define PAINT_LAYER_ENGINE_H

// =============================================================================
//  VOLTRA PAINT - LayerEngine
// =============================================================================
//  Real layers: each has its own ARGB32_Premultiplied raster plus its vector
//  stroke list. The raster is the "base" (fills, imports, filters, erasing)
//  and the strokes are replayed on top into a cache, so:
//
//    - undoing a stroke only invalidates the cache for that layer,
//    - filters act on the base pixels without destroying the stroke history,
//    - the vector strokes stay available for hit-testing and transforms.
//
//  The composite stack walks the layer list bottom-to-top honouring opacity,
//  visibility, blend mode, clipping masks and groups.
// =============================================================================

#include "PaintTypes.h"
#include "Rasterizer.h"
#include "StrokeModel.h"

#include <QImage>
#include <QObject>
#include <QString>
#include <QVector>

namespace paint {

// ---------------------------------------------------------------------------
// One layer.
// ---------------------------------------------------------------------------
struct PaintLayer {
    quint32 id = 0;
    QString name;
    QImage base;                 // ARGB32_Premultiplied, document sized
    QVector<Stroke> strokes;     // vector source of truth for ink
    QImage cache;                // base + strokes, rebuilt on invalidation
    mutable bool cacheValid = false;

    double opacity = 1.0;
    int blendMode = BlendNormal;
    bool visible = true;
    bool locked = false;
    bool isGroup = false;
    bool isMask = false;         // clipping mask: only paints where parent alpha > 0
    bool isReference = false;    // reference images do not export by default
    bool isTextLayer = false;    // managed by TextEngine
    bool alphaLocked = false;    // painting only affects existing pixels
    quint32 clipToId = 0;        // clip against this layer's alpha (0 = none)
    quint32 parentId = 0;        // group membership (0 = root)
    int order = 0;

    // Approximate memory footprint, used by the status bar and the undo budget.
    qint64 bytes() const;

    // Document-sized version of the cache, or `base` if nothing to replay.
    const QImage &resolved() const;
    void invalidate() const { cacheValid = false; }
};

// ---------------------------------------------------------------------------
// A serialisable snapshot of one layer, used by undo commands and by save/load.
// ---------------------------------------------------------------------------
struct LayerSnapshot {
    quint32 id = 0;
    QString name;
    QImage base;
    QVector<Stroke> strokes;
    double opacity = 1.0;
    int blendMode = BlendNormal;
    bool visible = true;
    bool locked = false;
    bool isGroup = false;
    bool isMask = false;
    bool isReference = false;
    bool isTextLayer = false;
    bool alphaLocked = false;
    quint32 clipToId = 0;
    quint32 parentId = 0;
    int order = 0;
};

class LayerEngine : public QObject
{
    Q_OBJECT

    Q_PROPERTY(int count READ count NOTIFY layersChanged)
    Q_PROPERTY(int currentIndex READ currentIndex WRITE setCurrentIndex NOTIFY currentLayerChanged)
    Q_PROPERTY(QVariantList layerList READ layerList NOTIFY layersChanged)
    Q_PROPERTY(QVariantList blendModeNames READ blendModeNames CONSTANT)
    Q_PROPERTY(int totalMemory READ totalMemory NOTIFY layersChanged)

public:
    explicit LayerEngine(QObject *parent = nullptr);
    ~LayerEngine() override;

    // ---- document sizing ---------------------------------------------------
    void reset(const QSize &size, const QColor &background = QColor(255, 255, 255, 255));
    QSize size() const { return m_size; }
    void resize(const QSize &size, bool scaleContent);
    const QColor &background() const { return m_background; }
    void setBackground(const QColor &c);

    // ---- list access -------------------------------------------------------
    int count() const { return m_layers.size(); }
    int currentIndex() const { return m_current; }
    void setCurrentIndex(int index);
    PaintLayer *layerAt(int index);
    const PaintLayer *layerAt(int index) const;
    PaintLayer *layerById(quint32 id);
    int indexOfId(quint32 id) const;
    QVector<PaintLayer> &layers() { return m_layers; }
    const QVector<PaintLayer> &layers() const { return m_layers; }
    quint32 currentLayerId() const;
    int totalMemory() const;

    // ---- mutations (all of these are called through UndoEngine) ------------
    quint32 addLayer(const QString &name, int insertAt = -1, quint32 parentId = 0);
    quint32 addRasterLayer(const QString &name, const QImage &content, int insertAt = -1);
    quint32 addGroup(const QString &name, int insertAt = -1);
    bool removeLayer(quint32 id);
    bool moveLayer(quint32 id, int newIndex);
    bool renameLayer(quint32 id, const QString &name);
    bool setLayerOpacity(quint32 id, double opacity);
    bool setLayerBlend(quint32 id, int blendMode);
    bool setLayerVisible(quint32 id, bool visible);
    bool setLayerLocked(quint32 id, bool locked);
    bool setLayerAlphaLocked(quint32 id, bool alphaLocked);
    bool setLayerMask(quint32 id, bool isMask, quint32 clipToId);
    bool setLayerClipTo(quint32 id, quint32 targetId);
    bool setLayerParent(quint32 id, quint32 parentId);
    bool duplicateLayer(quint32 id, quint32 *newId = nullptr);
    bool flattenInto(quint32 sourceId, quint32 targetId);

    // ---- ink ---------------------------------------------------------------
    bool addStroke(quint32 layerId, const Stroke &stroke);
    bool removeStroke(quint32 layerId, quint32 strokeId, Stroke *removed = nullptr);
    bool replaceStroke(quint32 layerId, quint32 strokeId, const Stroke &replacement);
    QVector<Stroke> strokes(quint32 layerId) const;
    int strokeCount(quint32 layerId) const;
    Stroke strokeAt(quint32 layerId, int index) const;

    // ---- pixels ------------------------------------------------------------
    QImage &baseOf(quint32 layerId);
    const QImage &resolvedOf(quint32 layerId) const;
    void invalidate(quint32 layerId);
    void invalidateAll();
    bool paintOn(quint32 layerId, const QRectF &docRect, const QImage &crop,
                 const QRect &at, bool destinationOut);

    // ---- composite ---------------------------------------------------------
    // Full composite (background + every visible layer, bottom to top).
    QImage composite() const;
    QImage compositeFlat() const;
    QImage compositeFrom(int firstIndex, int lastIndex) const;
    QImage compositeLayer(quint32 layerId) const;

    // ---- snapshots for undo / persistence ---------------------------------
    LayerSnapshot snapshot(quint32 id) const;
    bool restoreSnapshot(const LayerSnapshot &snap);
    QVector<LayerSnapshot> snapshotAll() const;
    void restoreAll(const QVector<LayerSnapshot> &snap);

    // ---- observers ----------------------------------------------------------
    static LayerEngine *instance();

signals:
    void layersChanged();
    void currentLayerChanged();
    void compositeDirty();
    void layerRenamed(quint32 id);

private:
    void rebuildOrder();
    const QImage &ensureCache(PaintLayer &l) const;
    QImage compositeRange(int firstIndex, int lastIndex) const;

    QVector<PaintLayer> m_layers;
    int m_current = 0;
    QSize m_size;
    QColor m_background = QColor(255, 255, 255, 255);
    quint32 m_nextId = 1;
    static LayerEngine *s_instance;
};

} // namespace paint

#endif // PAINT_LAYER_ENGINE_H
