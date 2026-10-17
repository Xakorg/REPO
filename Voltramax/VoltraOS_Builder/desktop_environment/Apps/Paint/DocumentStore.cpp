#include "DocumentStore.h"

#include <QBuffer>
#include <QDir>
#include <QFile>
#include <QFileInfo>
#include <QJsonArray>
#include <QJsonDocument>
#include <QJsonObject>
#include <QPainter>
#include <QSaveFile>
#include <QSettings>
#include <QStandardPaths>
#include <QElapsedTimer>

#include <algorithm>

namespace paint {

namespace {

constexpr const char *kSettingsOrg = "VoltraMax";
constexpr const char *kSettingsApp = "VoltraPaint";
constexpr int kRecentMax = 12;

// Little-endian primitive helpers, so the container format never inherits
// QDataStream's version-dependent encoding.
inline void putU32(QByteArray &b, quint32 v)
{
    b.append(char(v & 0xFF));
    b.append(char((v >> 8) & 0xFF));
    b.append(char((v >> 16) & 0xFF));
    b.append(char((v >> 24) & 0xFF));
}

inline void putU64(QByteArray &b, quint64 v)
{
    for (int i = 0; i < 8; ++i)
        b.append(char((v >> (8 * i)) & 0xFF));
}

inline quint32 getU32(const char *p)
{
    const uchar *u = reinterpret_cast<const uchar *>(p);
    return quint32(u[0]) | (quint32(u[1]) << 8) | (quint32(u[2]) << 16)
           | (quint32(u[3]) << 24);
}

inline quint64 getU64(const char *p)
{
    quint64 v = 0;
    for (int i = 0; i < 8; ++i)
        v |= quint64(uchar(p[i])) << (8 * i);
    return v;
}

QString magicName(quint32 magic)
{
    char c[4];
    c[0] = char((magic >> 24) & 0xFF);
    c[1] = char((magic >> 16) & 0xFF);
    c[2] = char((magic >> 8) & 0xFF);
    c[3] = char(magic & 0xFF);
    for (int i = 0; i < 4; ++i)
        if (c[i] < 0x20 || c[i] > 0x7E)
            c[i] = '?';
    return QString::fromLatin1(c, 4);
}

// Inverse of magicName(), used to read the manifest's count table back into
// the same key space as the grouped payload blocks.
quint32 nameToMagic(const QString &name)
{
    if (name.size() != 4)
        return 0;
    quint32 m = 0;
    for (int i = 0; i < 4; ++i)
        m = (m << 8) | quint32(uchar(name.at(i).toLatin1()));
    return m;
}

// One payload block before it is framed.
struct Rec {
    quint32 magic = 0;
    QByteArray data;
    quint32 flags = 0;
};

} // namespace

// ===========================================================================
// DocumentInfo
// ===========================================================================

QVariantMap DocumentInfo::toMap() const
{
    QVariantMap m;
    m.insert("path", path);
    m.insert("title", title);
    m.insert("width", size.width());
    m.insert("height", size.height());
    m.insert("layerCount", layerCount);
    m.insert("strokeCount", strokeCount);
    m.insert("textCount", textCount);
    m.insert("revision", double(revision));
    m.insert("written", written.toString(Qt::ISODate));
    m.insert("modifiedLocal", modifiedLocal.toString(Qt::ISODate));
    m.insert("fileBytes", double(fileBytes));
    m.insert("appVersion", appVersion);
    m.insert("isAutosave", isAutosave);
    m.insert("hasSelection", hasSelection);
    m.insert("thumbnail", thumbnailHint);
    return m;
}

DocumentInfo DocumentInfo::fromMap(const QVariantMap &m)
{
    DocumentInfo d;
    d.path = m.value("path").toString();
    d.title = m.value("title").toString();
    d.size = QSize(m.value("width").toInt(), m.value("height").toInt());
    d.layerCount = m.value("layerCount").toInt();
    d.strokeCount = m.value("strokeCount").toInt();
    d.textCount = m.value("textCount").toInt();
    d.revision = qint64(m.value("revision").toDouble());
    d.written = QDateTime::fromString(m.value("written").toString(), Qt::ISODate);
    d.modifiedLocal = QDateTime::fromString(m.value("modifiedLocal").toString(), Qt::ISODate);
    d.fileBytes = qint64(m.value("fileBytes").toDouble());
    d.appVersion = m.value("appVersion").toString();
    d.isAutosave = m.value("isAutosave").toBool();
    d.hasSelection = m.value("hasSelection").toBool();
    d.thumbnailHint = m.value("thumbnail").toString();
    return d;
}

// ===========================================================================
// Construction
// ===========================================================================

DocumentStore::DocumentStore(QObject *parent)
    : QObject(parent)
{
    ensureDirectory();
    QSettings s(kSettingsOrg, kSettingsApp);
    s.beginReadArray("recent");
    for (int i = 1; i <= s.childKeys().size() + 1; ++i) {
        s.setArrayIndex(i - 1);
        const QString p = s.value("path").toString();
        if (p.isEmpty())
            break;
        m_recent.append(QVariantMap{
            { "path", p },
            { "title", s.value("title").toString() },
            { "when", s.value("when").toString() },
            { "bytes", s.value("bytes", 0) },
            { "layers", s.value("layers", 0) }
        });
    }
    s.endArray();
    if (m_recent.isEmpty()) {
        // First run: seed nothing - a fake "recent documents" list is worse
        // than an empty one.
        m_recent.clear();
    }
}

DocumentStore::~DocumentStore() = default;

void DocumentStore::setRevision(qint64 rev)
{
    if (m_revision == rev)
        return;
    m_revision = rev;
    emit revisionChanged();
}

void DocumentStore::setModified(bool v)
{
    if (m_modified == v)
        return;
    m_modified = v;
    m_dirtySinceAutosave = v;
    m_lastChangeMs = QDateTime::currentMSecsSinceEpoch();
    emit modifiedChanged();
    if (v)
        emit autosaveChanged();
}

void DocumentStore::noteStatus(const QString &s)
{
    m_status = s;
    emit statusChanged(s);
}

// ===========================================================================
// Manifest (JSON) - the human-readable part of the container
// ===========================================================================

QByteArray DocumentStore::manifestJson(const DocumentPayload &payload, quint32 flags,
                                       qint64 revision, const QMap<quint32, int> &counts)
{
    QJsonObject root;
    root.insert("title", payload.title.isEmpty() ? QStringLiteral("Untitled")
                                                 : payload.title);
    root.insert("width", payload.layers ? payload.layers->size().width() : 0);
    root.insert("height", payload.layers ? payload.layers->size().height() : 0);
    root.insert("revision", double(revision));
    root.insert("appVersion", payload.appVersion);
    root.insert("written", double(QDateTime::currentMSecsSinceEpoch()));
    root.insert("flags", double(flags));
    root.insert("containerVersion", double(kContainerVersion));

    // Counts per block magic, so a reader can verify the payload it received
    // matches what the writer said it wrote - before touching a single pixel.
    // The counts come from the records actually framed, never from what the
    // payload "should" have produced, so a skipped block still yields a
    // truthful manifest.
    QJsonObject countObj;
    for (auto it = counts.cbegin(); it != counts.cend(); ++it)
        countObj.insert(magicName(it.key()), it.value());
    root.insert("counts", countObj);

    root.insert("hasSelection", counts.value(BlockMagic::selection) > 0);
    root.insert("thumbnail", counts.value(BlockMagic::thumbnail) > 0);
    root.insert("hasGuides", counts.value(BlockMagic::guides) > 0);
    root.insert("hasMetadata", counts.value(BlockMagic::metadata) > 0);
    root.insert("layerCount", counts.value(BlockMagic::layers) > 0 && payload.layers
                                  ? payload.layers->count()
                                  : 0);
    root.insert("strokeBlocks", counts.value(BlockMagic::strokes));
    root.insert("textBlocks", counts.value(BlockMagic::texts));
    root.insert("selectionTolerance",
                payload.selection ? payload.selection->tolerance() : -1);
    root.insert("selectionContiguous",
                payload.selection ? payload.selection->contiguous() : true);

    if (!payload.guides.isEmpty())
        root.insert("guides", QJsonObject::fromVariantMap(payload.guides));
    if (!payload.metadata.isEmpty())
        root.insert("metadata", QJsonObject::fromVariantMap(payload.metadata));

    return QJsonDocument(root).toJson(QJsonDocument::Compact);
}

bool DocumentStore::parseManifest(const QByteArray &json, DocumentPayload *target,
                                  quint32 *flags, qint64 *revision, QString *error)
{
    QJsonParseError pe{};
    const QJsonDocument doc = QJsonDocument::fromJson(json, &pe);
    if (pe.error != QJsonParseError::NoError || !doc.isObject()) {
        if (error)
            *error = QStringLiteral("manifest is not valid JSON: %1").arg(pe.errorString());
        return false;
    }
    const QJsonObject root = doc.object();
    if (target) {
        target->size = QSize(root.value("width").toInt(0), root.value("height").toInt(0));
        target->title = root.value("title").toString();
        target->appVersion = root.value("appVersion").toString(QStringLiteral("1.0.0"));
        target->includeSelection = root.value("hasSelection").toBool(true);
        target->includeThumbnail = root.value("thumbnail").toBool(true);
        if (root.value("guides").isObject())
            target->guides = root.value("guides").toObject().toVariantMap();
        if (root.value("metadata").isObject())
            target->metadata = root.value("metadata").toObject().toVariantMap();
    }
    if (flags)
        *flags = quint32(root.value("flags").toInt(0));
    if (revision)
        *revision = qint64(root.value("revision").toDouble(0));
    return true;
}

// ===========================================================================
// Block framing
// ===========================================================================

QByteArray DocumentStore::frameBlock(quint32 magic, const QByteArray &data, quint32 flags)
{
    QByteArray out;
    out.reserve(data.size() + 16);
    putU32(out, magic);
    putU32(out, quint32(data.size()));   // uncompressed length
    putU32(out, quint32(data.size()));   // stored length (no block compression in v1)
    putU32(out, flags);
    out += data;
    return out;
}

// ===========================================================================
// Encoding
// ===========================================================================

QByteArray DocumentStore::encodeContainer(const DocumentPayload &payload, ImageIo *io,
                                          QString *error, quint32 flags,
                                          qint64 revision)
{
    if (!payload.layers) {
        if (error)
            *error = QStringLiteral("encode: no layer engine attached");
        return QByteArray();
    }
    if (!io) {
        if (error)
            *error = QStringLiteral("encode: no image codec attached");
        return QByteArray();
    }

    QVector<Rec> recs;

    // ---- layer table --------------------------------------------------------
    {
        QJsonObject root;
        root.insert("w", payload.layers->size().width());
        root.insert("h", payload.layers->size().height());
        root.insert("background", payload.layers->background().name(QColor::HexArgb));
        root.insert("current", payload.layers->currentIndex());
        root.insert("count", payload.layers->count());

        QJsonArray arr;
        const auto &ls = payload.layers->layers();
        for (int i = 0; i < ls.size(); ++i) {
            const PaintLayer &l = ls.at(i);
            QJsonObject o;
            o.insert("id", double(l.id));
            o.insert("name", l.name);
            o.insert("order", i);
            o.insert("opacity", l.opacity);
            o.insert("blend", l.blendMode);
            o.insert("visible", l.visible);
            o.insert("locked", l.locked);
            o.insert("group", l.isGroup);
            o.insert("mask", l.isMask);
            o.insert("ref", l.isReference);
            o.insert("text", l.isTextLayer);
            o.insert("alphaLock", l.alphaLocked);
            o.insert("clipTo", double(l.clipToId));
            o.insert("parent", double(l.parentId));
            o.insert("strokes", l.strokes.size());
            o.insert("hasBase", payload.flattenBaseRasters);
            arr.append(o);
        }
        root.insert("layers", arr);

        Rec r;
        r.magic = BlockMagic::layers;
        r.data = QJsonDocument(root).toJson(QJsonDocument::Compact);
        recs.append(r);
    }

    // ---- per-layer rasters and strokes, in layer order ----------------------
    const QVector<PaintLayer> &ls = payload.layers->layers();
    for (const PaintLayer &l : ls) {
        if (payload.flattenBaseRasters) {
            Rec r;
            r.magic = BlockMagic::baseRaster;
            r.flags = 1u;   // payload bytes are a PNG file
            // A null base is encoded as a 1x1 transparent placeholder rather
            // than by mutating the live document during a save.
            const QImage source = l.base.isNull()
                                      ? QImage(1, 1, QImage::Format_ARGB32_Premultiplied)
                                      : l.base;
            QImage solid = source;
            if (solid.isNull())
                solid.fill(Qt::transparent);
            const IoResult res = io->encodePng(solid, &r.data);
            if (!res.ok) {
                if (error)
                    *error = QStringLiteral("encode: layer '%1' raster: %2")
                                 .arg(l.name, res.error);
                return QByteArray();
            }
            recs.append(r);
        }
        Rec s;
        s.magic = BlockMagic::strokes;
        s.data = StrokeModel::serialiseList(l.strokes);
        recs.append(s);
    }

    // ---- text items -----------------------------------------------------------
    {
        QByteArray blob;
        for (const TextItem &t : payload.texts)
            blob += t.serialise();
        Rec r;
        r.magic = BlockMagic::texts;
        r.data = blob;
        recs.append(r);
    }

    // ---- selection mask --------------------------------------------------------
    if (payload.includeSelection && payload.selection && !payload.selection->isEmpty()) {
        Rec r;
        r.magic = BlockMagic::selection;
        r.flags = 1u;
        const IoResult res = io->encodePng(payload.selection->mask(), &r.data);
        if (res.ok)
            recs.append(r);
        // A mask that cannot be encoded is dropped with the manifest count
        // adjusted below rather than failing the whole save.
    }

    // ---- thumbnail ----------------------------------------------------------------
    QImage thumb = payload.thumbnail;
    if (thumb.isNull() && payload.includeThumbnail) {
        const QImage flat = payload.layers->composite();
        if (!flat.isNull()) {
            thumb = flat.scaled(320, 320, Qt::KeepAspectRatio, Qt::SmoothTransformation);
        }
    }
    if (payload.includeThumbnail && !thumb.isNull()) {
        Rec r;
        r.magic = BlockMagic::thumbnail;
        r.flags = 1u;
        const IoResult res = io->encodePng(thumb, &r.data);
        if (res.ok)
            recs.append(r);
    }

    // ---- guides and metadata ---------------------------------------------------------
    if (!payload.guides.isEmpty()) {
        Rec r;
        r.magic = BlockMagic::guides;
        r.data = QJsonDocument(QJsonObject::fromVariantMap(payload.guides))
                     .toJson(QJsonDocument::Compact);
        recs.append(r);
    }
    if (!payload.metadata.isEmpty()) {
        Rec r;
        r.magic = BlockMagic::metadata;
        r.data = QJsonDocument(QJsonObject::fromVariantMap(payload.metadata))
                     .toJson(QJsonDocument::Compact);
        recs.append(r);
    }

    // ---- manifest, now that we know exactly what we wrote --------------------
    // Counts are tallied from the records actually framed, so a block that had
    // to be skipped still produces a manifest that tells the truth.
    QMap<quint32, int> counts;
    for (const Rec &r : recs)
        counts[r.magic] = counts.value(r.magic) + 1;

    const QByteArray manifest = manifestJson(payload, flags, revision, counts);

    // Assemble: 32-byte header + manifest + framed blocks.
    QByteArray out;
    out.reserve(manifest.size() + 4096);
    putU32(out, kContainerMagic);
    putU32(out, kContainerVersion);
    putU32(out, quint32(manifest.size()));
    putU32(out, flags);
    putU64(out, quint64(revision));
    putU64(out, quint64(QDateTime::currentMSecsSinceEpoch()));
    out += manifest;
    for (const Rec &r : recs)
        out += frameBlock(r.magic, r.data, r.flags);
    return out;
}

// ===========================================================================
// Decoding
// ===========================================================================

QImage DocumentStore::maskFromPng(const QByteArray &png, const QSize &expected)
{
    ImageIo io;
    QImage colour;
    const IoResult res = io.decodePng(png, &colour);
    if (!res.ok || colour.isNull())
        return QImage();
    if (!expected.isNull() && colour.size() != expected)
        return QImage();

    // The mask is Format_Grayscale8 in SelectionEngine; the PNG round-trip
    // carried it as opaque grey RGB. Read the red channel explicitly instead
    // of trusting QImage's format conversion rules.
    QImage mask(colour.size(), QImage::Format_Grayscale8);
    for (int y = 0; y < colour.height(); ++y) {
        const QRgb *row = reinterpret_cast<const QRgb *>(colour.constScanLine(y));
        uchar *dst = mask.scanLine(y);
        for (int x = 0; x < colour.width(); ++x)
            dst[x] = uchar(qRed(row[x]));
    }
    return mask;
}

bool DocumentStore::applyLayers(const QVector<QByteArray> &layerTables,
                                const QVector<QByteArray> &baseRasters,
                                const QVector<QByteArray> &strokeBlocks,
                                DocumentPayload *target, QStringList *warnings,
                                QStringList *recovered, QStringList *lost)
{
    if (!target || !target->layers) {
        if (lost)
            *lost << QStringLiteral("layer table (no engine attached)");
        return false;
    }
    if (layerTables.size() != 1) {
        if (lost)
            *lost << QStringLiteral("layer table (found %1)").arg(layerTables.size());
        return false;
    }

    QJsonParseError pe{};
    const QJsonDocument doc = QJsonDocument::fromJson(layerTables.first(), &pe);
    if (pe.error != QJsonParseError::NoError || !doc.isObject()) {
        if (lost)
            *lost << QStringLiteral("layer table (invalid JSON: %1)").arg(pe.errorString());
        return false;
    }
    const QJsonObject root = doc.object();
    const QSize size(root.value("w").toInt(0), root.value("h").toInt(0));
    const QColor background(root.value("background").toString(QStringLiteral("#ffffffff")));
    const QJsonArray arr = root.value("layers").toArray();
    if (size.width() <= 0 || size.height() <= 0 || arr.isEmpty()) {
        if (lost)
            *lost << QStringLiteral("layer table (empty or invalid dimensions)");
        return false;
    }

    LayerEngine *eng = target->layers;
    eng->reset(size, background.isValid() ? background : QColor(255, 255, 255, 255));

    // Build the layer objects in stored order. Index 0 reuses the "Background"
    // layer reset() created so the layer count matches exactly.
    QMap<quint32, quint32> idMap;
    for (int i = 0; i < arr.size(); ++i) {
        const QJsonObject o = arr.at(i).toObject();
        if (i > 0)
            eng->addLayer(o.value("name").toString(QStringLiteral("Layer")), -1, 0);
        PaintLayer *l = eng->layerAt(i);
        if (!l)
            break;
        const quint32 storedId = quint32(o.value("id").toDouble());
        idMap.insert(storedId, l->id);
        l->name = o.value("name").toString(QStringLiteral("Layer"));
        l->opacity = clampd(o.value("opacity").toDouble(1.0), 0.0, 1.0);
        l->blendMode = qBound(0, o.value("blend").toInt(BlendNormal), 13);
        l->visible = o.value("visible").toBool(true);
        l->locked = o.value("locked").toBool(false);
        l->isGroup = o.value("group").toBool(false);
        l->isMask = o.value("mask").toBool(false);
        l->isReference = o.value("ref").toBool(false);
        l->isTextLayer = o.value("text").toBool(false);
        l->alphaLocked = o.value("alphaLock").toBool(false);
        l->order = i;
        l->invalidate();
    }

    const int created = eng->count();
    if (created != arr.size() && warnings)
        *warnings << QStringLiteral("layer count mismatch: manifest said %1, built %2")
                         .arg(arr.size()).arg(created);

    // Second pass: relationships, which need every id to exist first.
    for (int i = 0; i < arr.size() && i < created; ++i) {
        const QJsonObject o = arr.at(i).toObject();
        PaintLayer *l = eng->layerAt(i);
        if (!l)
            continue;
        l->clipToId = idMap.value(quint32(o.value("clipTo").toDouble()), 0);
        l->parentId = idMap.value(quint32(o.value("parent").toDouble()), 0);
        l->invalidate();
    }

    // Base rasters, in stored order, for layers that declared hasBase.
    int baseIdx = 0;
    for (int i = 0; i < arr.size() && i < created; ++i) {
        if (!arr.at(i).toObject().value("hasBase").toBool())
            continue;
        if (baseIdx >= baseRasters.size()) {
            if (warnings)
                *warnings << QStringLiteral("layer %1 declared a base raster but the "
                                            "container had none left").arg(i);
            break;
        }
        ImageIo io;
        QImage img;
        const IoResult res = io.decodePng(baseRasters.at(baseIdx++), &img);
        if (!res.ok) {
            if (warnings)
                *warnings << QStringLiteral("layer %1 raster failed to decode: %2")
                                 .arg(i).arg(res.error);
            continue;
        }
        if (img.size() != size) {
            QImage scaled = Rasterizer::createLayer(size, QColor(0, 0, 0, 0));
            QPainter p(&scaled);
            p.setRenderHint(QPainter::SmoothPixmapTransform, false);
            p.drawImage(QPoint(0, 0), img);
            p.end();
            img = scaled;
            if (warnings)
                *warnings << QStringLiteral("layer %1 raster was %2, document is %3")
                                 .arg(i)
                                 .arg(QString::fromLatin1("%1x%2")
                                          .arg(img.width()).arg(img.height()))
                                 .arg(QString::fromLatin1("%1x%2")
                                          .arg(size.width()).arg(size.height()));
        }
        PaintLayer *l = eng->layerAt(i);
        if (l) {
            l->base = img.convertToFormat(QImage::Format_ARGB32_Premultiplied);
            l->invalidate();
        }
    }

    // Vector strokes, one block per layer in the same order.
    for (int i = 0; i < created; ++i) {
        PaintLayer *l = eng->layerAt(i);
        if (!l)
            continue;
        if (i >= strokeBlocks.size()) {
            l->strokes.clear();
            l->invalidate();
            if (warnings)
                *warnings << QStringLiteral("layer %1 had no stroke block; "
                                            "vector ink for it is missing").arg(i);
            continue;
        }
        QVector<Stroke> strokes;
        QString err;
        if (!StrokeModel::deserialiseList(strokeBlocks.at(i), &strokes, &err)) {
            if (warnings)
                *warnings << QStringLiteral("layer %1 strokes unreadable: %2")
                                 .arg(i).arg(err);
            l->strokes.clear();
        } else {
            l->strokes = strokes;
        }
        l->invalidate();
    }

    const int current = qBound(0, root.value("current").toInt(0), created - 1);
    eng->setCurrentIndex(current);
    eng->invalidateAll();

    if (recovered)
        *recovered << QStringLiteral("layers") << QStringLiteral("strokes")
                   << QStringLiteral("base rasters");
    return true;
}

bool DocumentStore::applyTexts(const QVector<QByteArray> &records, DocumentPayload *target,
                               QStringList *warnings, QStringList *recovered)
{
    if (!target || records.isEmpty())
        return true;

    int ok = 0;
    for (const QByteArray &blob : records) {
        int offset = 0;
        // Records are concatenated, each framed as magic(4) + version(2) +
        // length(4) + payload. Walk them until the bytes run out.
        while (offset + 10 <= blob.size()) {
            const QByteArray slice = blob.mid(offset);
            TextItem item;
            QString err;
            if (!TextItem::deserialise(slice, &item, &err)) {
                if (warnings)
                    *warnings << QStringLiteral("text record at offset %1: %2")
                                     .arg(offset).arg(err);
                break;
            }
            target->texts.append(item);
            ++ok;
            // Record layout written by TextItem::serialise():
            //   0..3  magic "VPST"
            //   4..5  version (uint16, little-endian)
            //   6..9  payload length (uint32, little-endian)
            //  10..   payload
            const quint32 len = getU32(blob.constData() + offset + 6);
            const qint64 next = qint64(offset) + 10 + qint64(len);
            if (next > blob.size()) {
                if (warnings)
                    *warnings << QStringLiteral("text record at offset %1 claims %2 "
                                                "bytes but only %3 remain")
                                     .arg(offset).arg(len)
                                     .arg(blob.size() - offset - 10);
                break;
            }
            offset = int(next);
            if (len == 0)
                break;
        }
    }
    if (ok > 0 && recovered)
        *recovered << QStringLiteral("text items (%1)").arg(ok);
    return true;
}

LoadResult DocumentStore::decodeContainer(const QByteArray &data, DocumentPayload *target,
                                          ImageIo *io)
{
    LoadResult res;
    QElapsedTimer timer;
    timer.start();
    res.bytes = data.size();

    auto fail = [&](const QString &e) {
        res.ok = false;
        res.error = e;
        res.milliseconds = timer.elapsed();
        return res;
    };

    if (data.size() < kHeaderBytes)
        return fail(QStringLiteral("file is shorter than the %1-byte container header")
                        .arg(kHeaderBytes));

    const char *base = data.constData();
    const quint32 magic = getU32(base);
    if (magic != kContainerMagic)
        return fail(QStringLiteral("not a Voltra Paint project (magic %1, expected VPX1)")
                        .arg(magicName(magic)));
    const quint32 version = getU32(base + 4);
    if (version > kContainerVersion)
        return fail(QStringLiteral("project format version %1 is newer than this build "
                                   "understands (max %2)")
                        .arg(version).arg(kContainerVersion));

    const quint32 headerLen = getU32(base + 8);
    const quint32 flags = getU32(base + 12);
    qint64 revision = qint64(getU64(base + 16));
    const qint64 writtenMs = qint64(getU64(base + 24));

    if (qint64(headerLen) + kHeaderBytes > data.size())
        return fail(QStringLiteral("manifest length %1 exceeds the file size %2")
                        .arg(headerLen).arg(data.size()));

    const QByteArray manifest = data.mid(kHeaderBytes, int(headerLen));
    QString err;
    if (!parseManifest(manifest, target, nullptr, &revision, &err))
        return fail(err);

    res.revision = revision;
    res.written = QDateTime::fromMSecsSinceEpoch(writtenMs);
    res.fromAutosave = (flags & 1u) != 0;
    res.fromRecovery = (flags & 2u) != 0;

    // ---- walk the framed payload -------------------------------------------
    qint64 offset = qint64(kHeaderBytes) + qint64(headerLen);
    QMap<quint32, QVector<QByteArray>> groups;

    while (offset + 16 <= data.size()) {
        const quint32 bmagic = getU32(base + offset);
        const quint32 stored = getU32(base + offset + 8);
        const quint32 bflags = getU32(base + offset + 12);
        Q_UNUSED(bflags);
        if (qint64(stored) > data.size() - offset - 16) {
            res.truncated = true;
            res.warnings << QStringLiteral("payload truncated at byte %1: block %2 "
                                           "claims %3 bytes, %4 remain")
                                .arg(offset).arg(magicName(bmagic)).arg(stored)
                                .arg(data.size() - offset - 16);
            break;
        }
        groups[bmagic].append(data.mid(int(offset) + 16, int(stored)));
        offset += 16 + qint64(stored);
    }
    if (offset < data.size() && !res.truncated)
        res.warnings << QStringLiteral("%1 trailing byte(s) after the last block")
                            .arg(data.size() - offset);

    // Verify counts against the manifest before applying anything. A mismatch
    // here is what turns "the file opened" into "the file opened, but this is
    // what it is missing".
    const QJsonObject mroot = QJsonDocument::fromJson(manifest).object();
    const QJsonObject counts = mroot.value("counts").toObject();
    for (auto it = counts.begin(); it != counts.end(); ++it) {
        const quint32 key = nameToMagic(it.key());
        if (key == 0)
            continue;
        const int wanted = it.value().toInt();
        const int got = groups.value(key).size();
        if (wanted != got)
            res.warnings << QStringLiteral("block %1: manifest expected %2, found %3")
                                .arg(it.key()).arg(wanted).arg(got);
    }

    // ---- apply -------------------------------------------------------------
    if (target) {
        applyLayers(groups.value(BlockMagic::layers),
                    groups.value(BlockMagic::baseRaster),
                    groups.value(BlockMagic::strokes),
                    target, &res.warnings, &res.blocksRecovered, &res.blocksLost);

        if (groups.contains(BlockMagic::texts))
            applyTexts(groups.value(BlockMagic::texts), target, &res.warnings,
                       &res.blocksRecovered);

        if (target->selection && groups.contains(BlockMagic::selection)) {
            const QImage mask = maskFromPng(groups.value(BlockMagic::selection).first(),
                                            target->layers ? target->layers->size()
                                                           : QSize());
            if (mask.isNull()) {
                res.warnings << QStringLiteral("selection mask could not be decoded; "
                                               "the selection was cleared");
                target->selection->selectNone();
            } else {
                // restoreMask() reinstates the raster and recomputes bounds,
                // pixel count and fill ratio from it, so the saved metrics and
                // the actual pixels cannot drift apart.
                target->selection->restoreMask(mask);
            }
            res.blocksRecovered << QStringLiteral("selection");
        } else if (target->selection) {
            target->selection->selectNone();
        }

        if (groups.contains(BlockMagic::guides)) {
            const QJsonObject g = QJsonDocument::fromJson(
                groups.value(BlockMagic::guides).first()).object();
            target->guides = g.toVariantMap();
            res.blocksRecovered << QStringLiteral("guides");
        }
        if (groups.contains(BlockMagic::metadata)) {
            const QJsonObject g = QJsonDocument::fromJson(
                groups.value(BlockMagic::metadata).first()).object();
            target->metadata = g.toVariantMap();
            res.blocksRecovered << QStringLiteral("metadata");
        }
        if (groups.contains(BlockMagic::thumbnail)) {
            ImageIo localIo;
            ImageIo *codec = io ? io : &localIo;
            QImage thumb;
            if (codec->decodePng(groups.value(BlockMagic::thumbnail).first(), &thumb).ok)
                target->thumbnail = thumb;
            res.blocksRecovered << QStringLiteral("thumbnail");
        }
    }

    // The header and manifest parsed, so the file loaded. Blocks that did not
    // survive are reported through blocksLost instead of failing the whole
    // document - partial recovery is the entire point of the framed format.
    res.ok = true;
    if (!res.blocksLost.isEmpty())
        res.warnings << QStringLiteral("blocks lost: %1")
                            .arg(res.blocksLost.join(QStringLiteral(", ")));
    res.milliseconds = timer.elapsed();
    return res;
}

// ===========================================================================
// Low-level writing
// ===========================================================================

bool DocumentStore::writeAll(QIODevice *dev, const QByteArray &bytes, QString *error)
{
    qint64 written = 0;
    while (written < bytes.size()) {
        const qint64 n = dev->write(bytes.constData() + written, bytes.size() - written);
        if (n <= 0) {
            if (error)
                *error = QStringLiteral("write failed after %1 of %2 bytes: %3")
                             .arg(written).arg(bytes.size())
                             .arg(dev->errorString().isEmpty()
                                      ? QStringLiteral("unknown error")
                                      : dev->errorString());
            return false;
        }
        written += n;
    }
    return true;
}

bool DocumentStore::atomicWrite(const QString &filePath, const QByteArray &bytes,
                                QString *error)
{
    // QSaveFile writes to a sibling temporary and renames it over the target on
    // commit(), so a crash or a full disk leaves the previous file intact.
    QSaveFile file(filePath);
    if (!file.open(QIODevice::WriteOnly)) {
        if (error)
            *error = QStringLiteral("cannot open %1 for writing: %2")
                         .arg(filePath, file.errorString());
        return false;
    }
    if (!writeAll(&file, bytes, error)) {
        file.cancelWriting();
        return false;
    }
    if (!file.commit()) {
        if (error)
            *error = QStringLiteral("could not commit %1: %2")
                         .arg(filePath, file.errorString());
        return false;
    }
    return true;
}

// ===========================================================================
// Saving
// ===========================================================================

QVariantMap DocumentStore::save(const QString &filePath, const QVariantMap &payload)
{
    QVariantMap out;
    out.insert("path", filePath);

    if (filePath.isEmpty()) {
        out.insert("ok", false);
        out.insert("error", QStringLiteral("No file path was given."));
        emit saveFailed(filePath, out.value("error").toString());
        return out;
    }
    if (!m_provider) {
        out.insert("ok", false);
        out.insert("error", QStringLiteral("No document is attached to the store."));
        emit saveFailed(filePath, out.value("error").toString());
        return out;
    }

    DocumentPayload p = providerPayload();
    if (!p.layers) {
        out.insert("ok", false);
        out.insert("error", QStringLiteral("The document has no layers; nothing to save."));
        emit saveFailed(filePath, out.value("error").toString());
        return out;
    }

    // Overrides carried by the caller. The only ones the UI needs are the
    // title, the revision, and the two container flags.
    if (payload.contains("title"))
        p.title = payload.value("title").toString();
    if (payload.contains("revision"))
        p.revision = qint64(payload.value("revision").toDouble());
    if (payload.contains("includeThumbnail"))
        p.includeThumbnail = payload.value("includeThumbnail").toBool();
    if (payload.contains("includeSelection"))
        p.includeSelection = payload.value("includeSelection").toBool();
    if (payload.contains("flattenBaseRasters"))
        p.flattenBaseRasters = payload.value("flattenBaseRasters").toBool();
    if (payload.contains("appVersion"))
        p.appVersion = payload.value("appVersion").toString();

    const bool isAutosave = payload.value("autosave").toBool();
    const bool isRecovery = payload.value("recovery").toBool();
    quint32 flags = 0;
    if (isAutosave)
        flags |= 1u;
    if (isRecovery)
        flags |= 2u;

    if (p.title.isEmpty())
        p.title = QFileInfo(filePath).completeBaseName();

    QString err;
    const QByteArray bytes = encodeContainer(p, &m_io, &err, flags, p.revision);
    if (bytes.isEmpty()) {
        out.insert("ok", false);
        out.insert("error", err.isEmpty()
                                ? QStringLiteral("Serialisation produced no data.")
                                : err);
        emit saveFailed(filePath, out.value("error").toString());
        return out;
    }

    const QDateTime started = QDateTime::currentDateTime();
    if (!atomicWrite(filePath, bytes, &err)) {
        out.insert("ok", false);
        out.insert("error", err);
        noteStatus(QStringLiteral("Save failed: %1").arg(err));
        emit saveFailed(filePath, err);
        return out;
    }

    out.insert("ok", true);
    out.insert("bytes", double(bytes.size()));
    out.insert("milliseconds",
               double(started.msecsTo(QDateTime::currentDateTime())));
    out.insert("autosave", isAutosave);

    // An autosave is a side copy: it must never hijack the document's own path
    // or silently clear the dirty flag the user is relying on.
    if (!isAutosave) {
        if (m_path != filePath) {
            m_path = filePath;
            emit pathChanged();
        }
        setModified(false);
        setRevision(p.revision);
        touchRecent(filePath, QVariantMap{
                        { "title", p.title },
                        { "bytes", double(bytes.size()) },
                        { "layers", p.layers->count() }
                    });
        noteStatus(QStringLiteral("Saved %1 (%2)")
                       .arg(QFileInfo(filePath).fileName())
                       .arg(QStringLiteral("%1 KB").arg(bytes.size() / 1024)));
        emit saved(filePath, bytes.size());
    }

    return out;
}

QVariantMap DocumentStore::saveCurrent()
{
    if (m_path.isEmpty()) {
        QVariantMap out;
        out.insert("ok", false);
        out.insert("error",
                   QStringLiteral("This document has never been saved; use Save As."));
        emit saveFailed(QString(), out.value("error").toString());
        return out;
    }
    QVariantMap r = save(m_path, QVariantMap());
    if (r.value("ok").toBool())
        disableAutosaveAfterSave();
    return r;
}

QVariantMap DocumentStore::saveAs(const QString &filePath, const QVariantMap &payload)
{
    QVariantMap r = save(filePath, payload);
    if (r.value("ok").toBool())
        noteStatus(QStringLiteral("Saved a copy as %1")
                       .arg(QFileInfo(filePath).fileName()));
    return r;
}

QVariantMap DocumentStore::exportImage(const QString &filePath, const QImage &image,
                                       const QString &format, int quality)
{
    QVariantMap out;
    out.insert("path", filePath);

    if (filePath.isEmpty() || image.isNull()) {
        out.insert("ok", false);
        out.insert("error", filePath.isEmpty()
                                ? QStringLiteral("No export path was given.")
                                : QStringLiteral("There is no image to export."));
        emit saveFailed(filePath, out.value("error").toString());
        return out;
    }

    const IoResult res = m_io.saveImage(image, filePath, format, quality);
    out.insert("ok", res.ok);
    out.insert("bytes", double(res.bytesWritten));
    out.insert("detail", res.detail);
    if (!res.warning.isEmpty())
        out.insert("warning", res.warning);
    if (!res.ok) {
        out.insert("error", res.error);
        noteStatus(QStringLiteral("Export failed: %1").arg(res.error));
        emit saveFailed(filePath, res.error);
        return out;
    }

    noteStatus(QStringLiteral("Exported %1 - %2")
                   .arg(QFileInfo(filePath).fileName(), res.detail));
    emit saved(filePath, res.bytesWritten);
    return out;
}

// ===========================================================================
// Loading
// ===========================================================================

QVariantMap DocumentStore::load(const QString &filePath)
{
    DocumentPayload target = providerPayload();
    return loadInto(filePath, &target);
}

QVariantMap DocumentStore::loadInto(const QString &filePath, DocumentPayload *target)
{
    QVariantMap out;
    out.insert("path", filePath);

    if (filePath.isEmpty() || !target) {
        out.insert("ok", false);
        out.insert("error", QStringLiteral("Nothing to load into."));
        return out;
    }

    QFile f(filePath);
    if (!f.open(QIODevice::ReadOnly)) {
        out.insert("ok", false);
        out.insert("error", QStringLiteral("Cannot open %1: %2")
                                .arg(filePath, f.errorString()));
        noteStatus(out.value("error").toString());
        return out;
    }
    const QByteArray bytes = f.readAll();
    f.close();

    const LoadResult res = decodeContainer(bytes, target, &m_io);

    out.insert("ok", res.ok);
    out.insert("partial", res.partial());
    out.insert("error", res.error);
    out.insert("warnings", res.warnings);
    out.insert("blocksRecovered", res.blocksRecovered);
    out.insert("blocksLost", res.blocksLost);
    out.insert("bytes", double(res.bytes));
    out.insert("milliseconds", double(res.milliseconds));
    out.insert("revision", double(res.revision));
    out.insert("written", res.written.isValid() ? res.written.toString(Qt::ISODate)
                                                : QString());
    out.insert("truncated", res.truncated);
    out.insert("fromAutosave", res.fromAutosave);
    out.insert("fromRecovery", res.fromRecovery);
    m_lastLoad = out;

    if (!res.ok) {
        noteStatus(QStringLiteral("Could not open %1: %2")
                       .arg(QFileInfo(filePath).fileName(), res.error));
        emit statusChanged(m_status);
        return out;
    }

    m_path = res.fromAutosave || res.fromRecovery ? QString() : filePath;
    emit pathChanged();
    setModified(res.partial());
    setRevision(res.revision);

    if (res.partial())
        noteStatus(QStringLiteral("Opened %1 with damage: %2 missing")
                       .arg(QFileInfo(filePath).fileName(),
                            QString::number(res.blocksLost.size())));
    else if (res.truncated)
        noteStatus(QStringLiteral("Opened %1 from a truncated file; "
                                  "everything up to the cut was recovered")
                       .arg(QFileInfo(filePath).fileName()));
    else
        noteStatus(QStringLiteral("Opened %1 in %2 ms")
                       .arg(QFileInfo(filePath).fileName())
                       .arg(res.milliseconds));

    if (!m_path.isEmpty())
        touchRecent(filePath, QVariantMap{
                        { "title", target->title },
                        { "bytes", double(bytes.size()) },
                        { "layers", target->layers ? target->layers->count() : 0 }
                    });

    emit loaded(filePath, res.partial());
    emit statusChanged(m_status);
    return out;
}

// ===========================================================================
// Inspection - reads the manifest only, never the pixels
// ===========================================================================

QVariantMap DocumentStore::inspect(const QString &filePath)
{
    QVariantMap out;
    out.insert("path", filePath);

    QFile f(filePath);
    if (!f.open(QIODevice::ReadOnly)) {
        out.insert("ok", false);
        out.insert("error", QStringLiteral("Cannot open %1").arg(filePath));
        return out;
    }
    const QByteArray head = f.read(kHeaderBytes);
    if (head.size() < kHeaderBytes) {
        out.insert("ok", false);
        out.insert("error", QStringLiteral("File is shorter than the container header."));
        f.close();
        return out;
    }
    const char *hp = head.constData();
    if (getU32(hp) != kContainerMagic) {
        out.insert("ok", false);
        out.insert("error", QStringLiteral("Not a Voltra Paint project."));
        f.close();
        return out;
    }
    const quint32 version = getU32(hp + 4);
    const quint32 headerLen = getU32(hp + 8);
    const quint32 flags = getU32(hp + 12);
    const qint64 revision = qint64(getU64(hp + 16));
    const qint64 writtenMs = qint64(getU64(hp + 24));

    if (qint64(headerLen) > f.size() - kHeaderBytes) {
        out.insert("ok", false);
        out.insert("error", QStringLiteral("Manifest length exceeds the file."));
        f.close();
        return out;
    }
    const QByteArray manifest = f.read(int(headerLen));
    f.close();

    QJsonParseError pe{};
    const QJsonDocument doc = QJsonDocument::fromJson(manifest, &pe);
    if (pe.error != QJsonParseError::NoError || !doc.isObject()) {
        out.insert("ok", false);
        out.insert("error", QStringLiteral("Manifest is not valid JSON: %1")
                                .arg(pe.errorString()));
        return out;
    }
    const QJsonObject root = doc.object();

    DocumentInfo info;
    info.path = filePath;
    info.title = root.value("title").toString();
    info.size = QSize(root.value("width").toInt(0), root.value("height").toInt(0));
    info.layerCount = root.value("layerCount").toInt(0);
    info.strokeCount = root.value("strokeBlocks").toInt(0);
    info.textCount = root.value("textBlocks").toInt(0);
    info.revision = revision;
    info.written = QDateTime::fromMSecsSinceEpoch(writtenMs);
    info.modifiedLocal = QFileInfo(filePath).lastModified();
    info.fileBytes = QFileInfo(filePath).size();
    info.appVersion = root.value("appVersion").toString();
    info.isAutosave = (flags & 1u) != 0;
    info.hasSelection = root.value("hasSelection").toBool(false);
    info.thumbnailHint = root.value("thumbnail").toBool(false)
                             ? QStringLiteral("present")
                             : QStringLiteral("absent");

    out.insert("ok", true);
    out.insert("version", double(version));
    out.insert("info", info.toMap());

    // The count table lets the file browser show "12 of 40 blocks readable"
    // without decoding a single image.
    const QJsonObject counts = root.value("counts").toObject();
    int total = 0;
    for (auto it = counts.begin(); it != counts.end(); ++it)
        total += it.value().toInt();
    out.insert("blockCount", total);
    out.insert("counts", counts.toVariantMap());
    out.insert("guides", root.value("guides").toObject().toVariantMap());
    out.insert("metadata", root.value("metadata").toObject().toVariantMap());
    return out;
}

bool DocumentStore::looksLikeProject(const QString &filePath)
{
    QFile f(filePath);
    if (!f.open(QIODevice::ReadOnly))
        return false;
    const QByteArray head = f.read(4);
    f.close();
    return head.size() == 4 && getU32(head.constData()) == kContainerMagic;
}

// ===========================================================================
// Autosave
// ===========================================================================

QString DocumentStore::defaultDirectory() const
{
    return QStandardPaths::writableLocation(QStandardPaths::AppDataLocation)
           + QStringLiteral("/paint");
}

void DocumentStore::ensureDirectory()
{
    QDir().mkpath(defaultDirectory());
    if (!m_policy.directory.isEmpty())
        QDir().mkpath(m_policy.directory);
}

QString DocumentStore::autosaveDirectory() const
{
    return m_policy.directory.isEmpty() ? defaultDirectory() : m_policy.directory;
}

QString DocumentStore::slotPath(int index) const
{
    return autosaveDirectory()
           + QStringLiteral("/autosave-%1.vpx").arg(qMax(0, index));
}

QStringList DocumentStore::listAutosaves(const QString &directory)
{
    QDir d(directory);
    if (!d.exists())
        return QStringList();
    QStringList out;
    const QStringList entries = d.entryList(QStringList() << QStringLiteral("autosave-*.vpx"),
                                            QDir::Files | QDir::Readable);
    for (const QString &e : entries)
        out << d.absoluteFilePath(e);
    // Newest first: recovery wants the most recent file, and the browser wants
    // the same order.
    std::sort(out.begin(), out.end(), [](const QString &a, const QString &b) {
        return QFileInfo(a).lastModified() > QFileInfo(b).lastModified();
    });
    return out;
}

QVariantList DocumentStore::autosaveFiles() const
{
    QVariantList out;
    const QStringList files = listAutosaves(autosaveDirectory());
    for (const QString &p : files) {
        const QFileInfo fi(p);
        QVariantMap m;
        m.insert("path", p);
        m.insert("name", fi.fileName());
        m.insert("bytes", double(fi.size()));
        m.insert("when", fi.lastModified().toString(Qt::ISODate));
        out.append(m);
    }
    return out;
}

void DocumentStore::setAutosaveEnabled(bool v)
{
    if (m_policy.enabled == v)
        return;
    m_policy.enabled = v;
    if (!v)
        m_countdownMs = 0;
    emit autosaveChanged();
    noteStatus(v ? QStringLiteral("Autosave on")
                 : QStringLiteral("Autosave off - unsaved work will not be "
                                  "recovered after a crash"));
}

void DocumentStore::tickAutosave(qint64 nowMs)
{
    if (!m_policy.enabled) {
        if (m_countdownMs != 0) {
            m_countdownMs = 0;
            emit autosaveChanged();
        }
        return;
    }

    if (!m_modified) {
        // Nothing to write; show the full interval so the countdown does not
        // look like it is frozen mid-way.
        if (m_countdownMs != m_policy.intervalMs) {
            m_countdownMs = m_policy.intervalMs;
            emit autosaveChanged();
        }
        return;
    }

    const qint64 idle = nowMs - m_lastChangeMs;
    const qint64 remaining = m_policy.intervalMs - idle;
    if (remaining <= 0 && idle >= m_policy.idleGraceMs) {
        forceAutosave();
        return;
    }
    const qint64 shown = qMax<qint64>(0, remaining);
    if (m_countdownMs != shown) {
        m_countdownMs = shown;
        emit autosaveChanged();
    }
}

void DocumentStore::forceAutosave()
{
    if (!m_policy.enabled || !m_modified)
        return;
    if (!m_provider)
        return;

    ensureDirectory();
    const QString path = slotPath(m_slot);
    QVariantMap opts;
    opts.insert("autosave", true);
    const QVariantMap r = save(path, opts);
    if (!r.value("ok").toBool()) {
        noteStatus(QStringLiteral("Autosave failed: %1")
                       .arg(r.value("error").toString()));
        return;
    }

    m_slot = (m_slot + 1) % qMax(1, m_policy.maxFiles);
    m_dirtySinceAutosave = false;
    m_countdownMs = m_policy.intervalMs;

    // Enforce the disk budget: drop the oldest slots until we are back under
    // the cap, rather than letting the autosave directory grow without bound.
    const QStringList files = listAutosaves(autosaveDirectory());
    qint64 total = 0;
    for (const QString &p : files)
        total += QFileInfo(p).size();
    for (int i = files.size() - 1; i >= 0 && total > m_policy.maxTotalBytes; --i) {
        total -= QFileInfo(files.at(i)).size();
        QFile::remove(files.at(i));
    }

    emit autosaveChanged();
    emit autosaved(path);
}

void DocumentStore::disableAutosaveAfterSave()
{
    m_dirtySinceAutosave = false;
    if (!m_policy.keepOnSuccess)
        clearAutosave();
}

void DocumentStore::clearAutosave()
{
    const QStringList files = listAutosaves(autosaveDirectory());
    int removed = 0;
    for (const QString &p : files) {
        if (QFile::remove(p))
            ++removed;
    }
    m_recoveryAvailable = false;
    m_recoveryPath.clear();
    if (removed)
        noteStatus(QStringLiteral("Removed %1 autosave file(s)").arg(removed));
    emit recoveryChanged();
    emit autosaveChanged();
}

// ===========================================================================
// Crash recovery
// ===========================================================================

bool DocumentStore::scanForRecovery()
{
    ensureDirectory();
    const QStringList files = listAutosaves(autosaveDirectory());
    const bool had = m_recoveryAvailable;
    if (files.isEmpty()) {
        m_recoveryAvailable = false;
        m_recoveryPath.clear();
    } else {
        m_recoveryAvailable = true;
        m_recoveryPath = files.first();   // newest first
    }
    if (had != m_recoveryAvailable)
        emit recoveryChanged();
    return m_recoveryAvailable;
}

QVariantMap DocumentStore::loadRecovery()
{
    QVariantMap out;
    if (m_recoveryPath.isEmpty() && !scanForRecovery()) {
        out.insert("ok", false);
        out.insert("error", QStringLiteral("There is no autosaved document to recover."));
        return out;
    }

    DocumentPayload target = providerPayload();
    out = loadInto(m_recoveryPath, &target);
    if (out.value("ok").toBool()) {
        // Recovered work is, by definition, unsaved against the user's real
        // project file - so the document must come back dirty.
        m_path.clear();
        emit pathChanged();
        setModified(true);
        noteStatus(QStringLiteral("Recovered from %1 - the recovered document "
                                  "has not been saved to its own file yet")
                       .arg(QFileInfo(m_recoveryPath).fileName()));
        emit recoveryChanged();
    }
    return out;
}

void DocumentStore::discardRecovery()
{
    clearAutosave();
    m_recoveryAvailable = false;
    emit recoveryChanged();
    noteStatus(QStringLiteral("Recovery files discarded"));
}

// ===========================================================================
// Recent documents
// ===========================================================================

void DocumentStore::touchRecent(const QString &filePath, const QVariantMap &summary)
{
    if (filePath.isEmpty())
        return;
    if (filePath.startsWith(autosaveDirectory()))
        return;   // autosaves are not something the user chose to open

    forgetRecent(filePath);

    QVariantMap entry;
    entry.insert("path", filePath);
    entry.insert("title", summary.value("title",
                                        QFileInfo(filePath).completeBaseName()));
    entry.insert("when", QDateTime::currentDateTime().toString(Qt::ISODate));
    entry.insert("bytes", summary.value("bytes", 0));
    entry.insert("layers", summary.value("layers", 0));
    m_recent.prepend(entry);

    while (m_recent.size() > kRecentMax)
        m_recent.removeLast();

    QSettings s(kSettingsOrg, kSettingsApp);
    s.remove("recent");
    s.beginWriteArray("recent", m_recent.size());
    for (int i = 0; i < m_recent.size(); ++i) {
        s.setArrayIndex(i);
        const QVariantMap e = m_recent.at(i).toMap();
        s.setValue("path", e.value("path"));
        s.setValue("title", e.value("title"));
        s.setValue("when", e.value("when"));
        s.setValue("bytes", e.value("bytes"));
        s.setValue("layers", e.value("layers"));
    }
    s.endArray();
    s.sync();
    emit recentChanged();
}

void DocumentStore::forgetRecent(const QString &filePath)
{
    for (int i = m_recent.size() - 1; i >= 0; --i) {
        if (m_recent.at(i).toMap().value("path").toString() == filePath)
            m_recent.removeAt(i);
    }
}

void DocumentStore::clearRecent()
{
    m_recent.clear();
    QSettings s(kSettingsOrg, kSettingsApp);
    s.remove("recent");
    s.sync();
    emit recentChanged();
}

QVariantMap DocumentStore::recentEntry(const QString &filePath) const
{
    for (const QVariant &v : m_recent) {
        const QVariantMap e = v.toMap();
        if (e.value("path").toString() == filePath)
            return e;
    }
    return QVariantMap();
}

// ===========================================================================
// Misc
// ===========================================================================

QString DocumentStore::containerVersionString()
{
    return QStringLiteral("VPX1 container version %1").arg(kContainerVersion);
}

} // namespace paint
