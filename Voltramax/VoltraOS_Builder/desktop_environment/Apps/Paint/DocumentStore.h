#ifndef PAINT_DOCUMENT_STORE_H
#define PAINT_DOCUMENT_STORE_H

// =============================================================================
//  VOLTRA PAINT - DocumentStore
// =============================================================================
//  The `.vpx` project container, plus everything that keeps work alive when the
//  machine does not cooperate: autosave, crash recovery, recent documents and
//  the serialisation used by cloud sync.
//
//  Container layout (little-endian, all offsets absolute from byte 0):
//
//    offset  size  field
//    ------  ----  -------------------------------------------------------
//          0     4  magic "VPX1"  (0x56 0x50 0x58 0x31)
//          4     4  container version (currently 1)
//          8     4  header length (bytes of JSON manifest that follow)
//         12     4  flags (bit0 = autosave file, bit1 = recovery file)
//         16     8  revision counter (monotonic, matches UndoEngine)
//         24     8  wall-clock ms since epoch at write time
//         32     H  manifest: UTF-8 JSON, `headerLength` bytes
//        32+H     payload blocks, each framed as:
//                     4  block magic (see BlockMagic below)
//                     4  uncompressed length
//                     4  stored length
//                     4  block flags (bit0 = the bytes are PNG-wrapped)
//                     N  block bytes
//
//  Why framed blocks instead of one big blob: a crash mid-write leaves the
//  previous block boundary intact, so load() can salvage everything up to the
//  damage and report exactly what it lost instead of failing wholesale.
//
//  Why the manifest is JSON: it is the part a human (or a sync service) may
//  want to read without the pixel payload - dimensions, layer order, names,
//  blend modes, thumbnail presence, app version.
// =============================================================================

#include "ImageIo.h"
#include "LayerEngine.h"
#include "PaintTypes.h"
#include "SelectionEngine.h"
#include "StrokeModel.h"
#include "TextEngine.h"
#include "UndoEngine.h"

#include <QByteArray>
#include <QDateTime>
#include <QIODevice>
#include <QImage>
#include <QMap>
#include <QObject>
#include <QSize>
#include <QString>
#include <QStringList>
#include <QVariantList>
#include <QVariantMap>
#include <QVector>

#include <functional>

namespace paint {

// ---------------------------------------------------------------------------
// Block ids inside the payload.
// ---------------------------------------------------------------------------
namespace BlockMagic {
constexpr quint32 layers = 0x56504C31u;    // "VPL1" - layer table (JSON)
constexpr quint32 strokes = 0x56505331u;   // "VPS1" - stroke list (binary)
constexpr quint32 texts = 0x56505354u;     // "VPST" - text items (binary)
constexpr quint32 selection = 0x56505345u; // "VPSE" - selection mask (PNG)
constexpr quint32 thumbnail = 0x56505448u; // "VPTH" - preview (PNG)
constexpr quint32 baseRaster = 0x56504252u;// "VPBR" - one layer's base raster
constexpr quint32 guides = 0x56504744u;    // "VPGD" - guides/grid (JSON)
constexpr quint32 metadata = 0x56504D44u;  // "VPMD" - free-form (JSON)
} // namespace BlockMagic

// ---------------------------------------------------------------------------
// Result of a load attempt. `salvaged` is what makes this honest: a torn file
// still opens, with a list of what could not be read.
// ---------------------------------------------------------------------------
struct LoadResult {
    bool ok = false;
    QString error;                 // fatal: nothing was loaded
    QStringList warnings;          // non-fatal: partial content or format notes
    QStringList blocksRecovered;   // human names of blocks that did load
    QStringList blocksLost;        // human names of blocks that did not
    qint64 bytes = 0;
    qint64 milliseconds = 0;
    qint64 revision = 0;
    QDateTime written;
    bool truncated = false;        // end of file reached before IEND-like block
    bool fromAutosave = false;
    bool fromRecovery = false;

    bool partial() const { return ok && !blocksLost.isEmpty(); }
};

// ---------------------------------------------------------------------------
// What the document says about itself, without touching pixels.
// ---------------------------------------------------------------------------
struct DocumentInfo {
    QString path;
    QString title;
    QSize size;
    int layerCount = 0;
    int strokeCount = 0;
    int textCount = 0;
    qint64 revision = 0;
    QDateTime written;
    QDateTime modifiedLocal;
    qint64 fileBytes = 0;
    QString appVersion;
    bool isAutosave = false;
    bool hasSelection = false;
    QString thumbnailHint;   // "present" / "absent"

    QVariantMap toMap() const;
    static DocumentInfo fromMap(const QVariantMap &m);
};

// ---------------------------------------------------------------------------
// Everything needed to serialise the document in one call. PaintEngine builds
// this; DocumentStore never reaches into PaintEngine itself, which keeps the
// two testable independently.
// ---------------------------------------------------------------------------
struct DocumentPayload {
    LayerEngine *layers = nullptr;
    SelectionEngine *selection = nullptr;
    QVector<TextItem> texts;
    QVariantMap guides;            // grid, snapping, guide lines
    QVariantMap metadata;          // free-form: colour profile, palette, etc.
    QSize size;
    qint64 revision = 0;
    QString title;
    QString appVersion = QStringLiteral("1.0.0");
    QImage thumbnail;              // may be null; written when present
    bool includeThumbnail = true;
    bool includeSelection = true;
    bool flattenBaseRasters = true;
};

// ---------------------------------------------------------------------------
// Autosave policy. Real numbers, not a constant called "interval" nobody set.
// ---------------------------------------------------------------------------
struct AutosavePolicy {
    bool enabled = true;
    int intervalMs = 45000;          // 45 s of inactivity-or-clock
    int idleGraceMs = 2000;          // wait for the pen to lift first
    int maxFiles = 4;                // rotating slots, oldest deleted
    qint64 maxTotalBytes = 512ll * 1024 * 1024;
    bool keepOnSuccess = true;       // leave the autosave after a manual save
    QString directory;               // empty => QStandardPaths::AppDataLocation
};

// ---------------------------------------------------------------------------
// DocumentStore
// ---------------------------------------------------------------------------
class DocumentStore : public QObject
{
    Q_OBJECT

    Q_PROPERTY(QString path READ path NOTIFY pathChanged)
    Q_PROPERTY(bool modified READ modified NOTIFY modifiedChanged)
    Q_PROPERTY(bool canSave READ canSave NOTIFY pathChanged)
    Q_PROPERTY(QString status READ status NOTIFY statusChanged)
    Q_PROPERTY(qint64 revision READ revision NOTIFY revisionChanged)
    Q_PROPERTY(QVariantList recent READ recent NOTIFY recentChanged)
    Q_PROPERTY(bool autosaveEnabled READ autosaveEnabled WRITE setAutosaveEnabled
               NOTIFY autosaveChanged)
    Q_PROPERTY(qint64 autosaveCountdown READ autosaveCountdown NOTIFY autosaveChanged)
    Q_PROPERTY(bool recoveryAvailable READ recoveryAvailable NOTIFY recoveryChanged)
    Q_PROPERTY(QString recoveryPath READ recoveryPath NOTIFY recoveryChanged)
    Q_PROPERTY(QVariantMap lastLoadResult READ lastLoadResult NOTIFY statusChanged)

public:
    explicit DocumentStore(QObject *parent = nullptr);
    ~DocumentStore() override;

    // PaintEngine installs this; the QVariantMap arguments of save()/load()
    // only carry overrides (title, revision, export options) because the real
    // document lives in the engine, not in a QVariant tree.
    using PayloadProvider = std::function<DocumentPayload()>;
    void setPayloadProvider(const PayloadProvider &p) { m_provider = p; }
    DocumentPayload providerPayload() const { return m_provider ? m_provider() : DocumentPayload(); }

    // ---- identity -----------------------------------------------------------
    QString path() const { return m_path; }
    bool modified() const { return m_modified; }
    bool canSave() const { return !m_path.isEmpty(); }
    QString status() const { return m_status; }
    qint64 revision() const { return m_revision; }
    QVariantMap lastLoadResult() const { return m_lastLoad; }
    void setRevision(qint64 rev);
    void setModified(bool v);

    // ---- saving -------------------------------------------------------------
    // Serialises `payload` and writes it atomically: temp file, flush, rename.
    // A crash during save therefore leaves either the old file or the new one,
    // never a half-written one.
    Q_INVOKABLE QVariantMap save(const QString &filePath, const QVariantMap &payload);
    Q_INVOKABLE QVariantMap saveCurrent();
    Q_INVOKABLE QVariantMap saveAs(const QString &filePath, const QVariantMap &payload);
    Q_INVOKABLE QVariantMap exportImage(const QString &filePath, const QImage &image,
                                        const QString &format, int quality);

    // ---- loading ------------------------------------------------------------
    Q_INVOKABLE QVariantMap load(const QString &filePath);
    Q_INVOKABLE QVariantMap loadInto(const QString &filePath, DocumentPayload *target);

    // ---- autosave ------------------------------------------------------------
    Q_INVOKABLE void tickAutosave(qint64 nowMs);
    Q_INVOKABLE void forceAutosave();
    Q_INVOKABLE void disableAutosaveAfterSave();
    Q_INVOKABLE void clearAutosave();
    bool autosaveEnabled() const { return m_policy.enabled; }
    void setAutosaveEnabled(bool v);
    qint64 autosaveCountdown() const { return m_countdownMs; }
    QString autosaveDirectory() const;
    QVariantList autosaveFiles() const;

    // ---- recovery --------------------------------------------------------------
    // Called at startup, before a document is opened. Reports whether a
    // recovery file exists that is NEWER than the project it belongs to.
    Q_INVOKABLE bool scanForRecovery();
    Q_INVOKABLE QVariantMap loadRecovery();
    Q_INVOKABLE void discardRecovery();
    bool recoveryAvailable() const { return m_recoveryAvailable; }
    QString recoveryPath() const { return m_recoveryPath; }

    // ---- recent documents --------------------------------------------------------
    Q_INVOKABLE void touchRecent(const QString &filePath, const QVariantMap &summary);
    Q_INVOKABLE void forgetRecent(const QString &filePath);
    Q_INVOKABLE void clearRecent();
    Q_INVOKABLE QVariantMap recentEntry(const QString &filePath) const;
    QVariantList recent() const { return m_recent; }

    // ---- inspection (no pixels loaded) ------------------------------------------
    Q_INVOKABLE static QVariantMap inspect(const QString &filePath);
    Q_INVOKABLE static bool looksLikeProject(const QString &filePath);
    Q_INVOKABLE static QStringList listAutosaves(const QString &directory);

    // ---- direct payload access, for the C++ side ---------------------------------
    // Writes `payload` bytes into a QByteArray container (used by sync and by
    // the self-check, which round-trips through memory only).
    static QByteArray encodeContainer(const DocumentPayload &payload,
                                      ImageIo *io, QString *error,
                                      quint32 flags = 0, qint64 revision = 0);
    static LoadResult decodeContainer(const QByteArray &data, DocumentPayload *target,
                                      ImageIo *io);

    static QString containerVersionString();
    static constexpr quint32 kContainerMagic = 0x56505831u;   // "VPX1"
    static constexpr quint32 kContainerVersion = 1;
    static constexpr int kHeaderBytes = 32;

signals:
    void pathChanged();
    void modifiedChanged();
    void statusChanged(QString message);
    void revisionChanged();
    void recentChanged();
    void autosaveChanged();
    void recoveryChanged();
    void saved(QString filePath, qint64 bytes);
    void loaded(QString filePath, bool partial);
    void autosaved(QString filePath);
    void saveFailed(QString filePath, QString reason);

private:
    struct Block {
        quint32 magic = 0;
        QByteArray data;
        quint32 flags = 0;
    };

    static QByteArray manifestJson(const DocumentPayload &payload, quint32 flags,
                                   qint64 revision, const QMap<quint32, int> &counts);
    static bool parseManifest(const QByteArray &json, DocumentPayload *target,
                              quint32 *flags, qint64 *revision, QString *error);
    static bool writeAll(QIODevice *dev, const QByteArray &bytes, QString *error);
    static bool atomicWrite(const QString &filePath, const QByteArray &bytes,
                            QString *error);
    static QByteArray frameBlock(quint32 magic, const QByteArray &data, quint32 flags);

    // Rebuild the live document from the grouped payload blocks. Each helper is
    // static so decodeContainer() can stay static (and therefore usable from a
    // unit test with no QObject in sight).
    static bool applyLayers(const QVector<QByteArray> &layerTables,
                            const QVector<QByteArray> &baseRasters,
                            const QVector<QByteArray> &strokeBlocks,
                            DocumentPayload *target, QStringList *warnings,
                            QStringList *recovered, QStringList *lost);
    static bool applyTexts(const QVector<QByteArray> &records, DocumentPayload *target,
                           QStringList *warnings, QStringList *recovered);
    static QImage maskFromPng(const QByteArray &png, const QSize &expected);

    void noteStatus(const QString &s);
    void ensureDirectory();
    QString defaultDirectory() const;
    QString slotPath(int index) const;

    QString m_path;
    QString m_status;
    QString m_recoveryPath;
    bool m_modified = false;
    bool m_recoveryAvailable = false;
    bool m_dirtySinceAutosave = false;
    qint64 m_revision = 0;
    qint64 m_lastChangeMs = 0;
    qint64 m_countdownMs = 0;
    int m_slot = 0;
    QVariantMap m_lastLoad;
    QVariantList m_recent;
    AutosavePolicy m_policy;
    PayloadProvider m_provider;
    ImageIo m_io;
};

} // namespace paint

Q_DECLARE_METATYPE(paint::DocumentInfo)
Q_DECLARE_METATYPE(paint::LoadResult)

#endif // PAINT_DOCUMENT_STORE_H
