#ifndef PAINT_IMAGE_IO_H
#define PAINT_IMAGE_IO_H

// =============================================================================
//  VOLTRA PAINT - ImageIo
// =============================================================================
//  Codec honesty document as much as a header. The rules this file follows:
//
//   1. PNG is written and read by OUR OWN code, so a document produced here
//      opens anywhere. Deflate comes from zlib when <zlib.h> is present at
//      build time (detected with __has_include); when it is not, the encoder
//      emits a stream made entirely of DEFLATE "stored" blocks, which is a
//      valid, standard-compressed-method-0 stream every PNG decoder accepts.
//      It is larger. We say so instead of pretending zlib was there.
//
//   2. BMP is our own codec, uncompressed 24/32-bit BI_RGB, bottom-up or
//      top-down, plus 8-bit palette when the caller asks for it. There is no
//      dependency to lie about.
//
//   3. JPEG goes through Qt's image-format plugin layer ONLY. jpegAvailable()
//      reports honestly whether a JPEG handler actually exists in this Qt
//      build; if it does not, saveJpeg()/loadJpeg() return an error string
//      saying so rather than silently writing a broken file.
//
//   4. Every loader validates CRC, chunk framing and colour-type constraints
//      before trusting a byte of pixel data. Truncated files return a partial
//      image plus a non-empty warning - the crash-safe path.
// =============================================================================

#include "PaintTypes.h"

#include <QByteArray>
#include <QColor>
#include <QImage>
#include <QIODevice>
#include <QObject>
#include <QString>
#include <QStringList>
#include <QVariantList>

namespace paint {

// ---------------------------------------------------------------------------
// Result of an encode/decode operation.
// ---------------------------------------------------------------------------
struct IoResult {
    bool ok = false;
    QString error;          // empty when ok
    QString warning;        // non-fatal (partial read, fallback compressor)
    qint64 bytesWritten = 0;
    QString detail;         // e.g. "deflate: stored" or "deflate: zlib"

    static IoResult failure(const QString &e) { IoResult r; r.error = e; return r; }
    static IoResult success(qint64 n = 0) { IoResult r; r.ok = true; r.bytesWritten = n; return r; }
};

// ---------------------------------------------------------------------------
// PNG encoding options.
// ---------------------------------------------------------------------------
struct PngOptions {
    int compressionLevel = 6;     // 0..9 - only meaningful when zlib is present
    bool useZlib = true;          // false forces stored blocks (for testing)
    bool writeAlpha = true;       // emit RGBA when the image has transparency
    bool filterAdaptive = true;   // adaptive per-scanline filtering
    QString softwareTag = QStringLiteral("Voltra Paint");
};

// ---------------------------------------------------------------------------
// What the current build can actually do. Queried by the export dialog so it
// can disable a format instead of failing at the last moment.
// ---------------------------------------------------------------------------
struct CodecCapabilities {
    bool pngRead = true;
    bool pngWrite = true;
    bool zlibPresent = false;
    bool bmpRead = true;
    bool bmpWrite = true;
    bool jpegRead = false;
    bool jpegWrite = false;
    bool qoiRead = false;
    bool qoiWrite = false;
    QString zlibVersion;

    QVariantList toVariantList() const;
};

class ImageIo : public QObject
{
    Q_OBJECT

    Q_PROPERTY(bool jpegAvailable READ jpegAvailable NOTIFY capabilitiesChanged)
    Q_PROPERTY(bool zlibAvailable READ zlibAvailable NOTIFY capabilitiesChanged)
    Q_PROPERTY(QStringList writableFormats READ writableFormats NOTIFY capabilitiesChanged)
    Q_PROPERTY(QStringList readableFormats READ readableFormats NOTIFY capabilitiesChanged)
    Q_PROPERTY(QString pngStrategy READ pngStrategy NOTIFY capabilitiesChanged)

public:
    explicit ImageIo(QObject *parent = nullptr);
    ~ImageIo() override;

    // ---- capability reporting ------------------------------------------------
    CodecCapabilities capabilities() const;
    bool jpegAvailable() const;
    bool zlibAvailable() const;
    QString pngStrategy() const;
    QStringList writableFormats() const;
    QStringList readableFormats() const;
    Q_INVOKABLE QVariantMap capabilityMap() const;
    Q_INVOKABLE QStringList formatFilters(const QString &purpose) const;

signals:
    void capabilitiesChanged();

    // ---- PNG: our own codec ---------------------------------------------------
public:
    IoResult encodePng(const QImage &image, QByteArray *out,
                       const PngOptions &opts = PngOptions());
    IoResult savePng(const QImage &image, const QString &filePath,
                     const PngOptions &opts = PngOptions());
    IoResult decodePng(const QByteArray &data, QImage *out, QString *warning = nullptr);
    IoResult loadPng(const QString &filePath, QImage *out, QString *warning = nullptr);

    // Streaming entry points for large documents.
    bool encodePngToDevice(const QImage &image, QIODevice *device,
                           const PngOptions &opts, QString *error);

    // ---- BMP: our own codec ---------------------------------------------------
    IoResult encodeBmp(const QImage &image, QByteArray *out, bool withAlpha = true);
    IoResult saveBmp(const QImage &image, const QString &filePath, bool withAlpha = true);
    IoResult decodeBmp(const QByteArray &data, QImage *out);
    IoResult loadBmp(const QString &filePath, QImage *out);

    // ---- JPEG: delegated, honestly --------------------------------------------
    IoResult saveJpeg(const QImage &image, const QString &filePath, int quality = 92);
    IoResult loadJpeg(const QString &filePath, QImage *out);
    IoResult saveJpegToBytes(const QImage &image, QByteArray *out, int quality);

    // ---- generic ---------------------------------------------------------------
    // Dispatches on the extension, reporting which path was taken in `detail`.
    IoResult saveImage(const QImage &image, const QString &filePath,
                       const QString &format = QString(), int quality = 92);
    IoResult loadImage(const QString &filePath, QImage *out);
    Q_INVOKABLE QString probeFormat(const QString &filePath) const;
    Q_INVOKABLE QString sniffFormat(const QByteArray &head) const;

    // ---- colour helpers used by the codecs ---------------------------------------
    static QRgb crc32Update(quint32 crc, const uchar *data, int len);
    static quint32 crc32(const uchar *data, int len);

    // ---- unit-testable pure helpers ---------------------------------------------
    // Exported so the sanity self-check can prove round-tripping without a file
    // system (see ImageIo::selfTest()).
    Q_INVOKABLE QVariantMap selfTest();

private:
    struct PngChunk;
    bool writeChunk(QIODevice *dev, const char *type, const QByteArray &payload,
                    QString *error);
    bool readChunk(QIODevice *dev, PngChunk *chunk, QString *error);
    bool decodeScanlines(const QByteArray &raw, int width, int height, int bitDepth,
                         int colorType, const QVector<quint8> &palette,
                         const QVector<quint8> &trans, int interlace, QImage *out,
                         QString *error);

    bool m_capabilitiesChecked = false;
    CodecCapabilities m_caps;
    static quint32 s_crcTable[256];
    static bool s_crcTableReady;
    static void initCrcTable();
};

} // namespace paint

Q_DECLARE_METATYPE(paint::IoResult)

#endif // PAINT_IMAGE_IO_H
