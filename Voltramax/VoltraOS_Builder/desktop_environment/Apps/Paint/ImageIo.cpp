#include "ImageIo.h"

#include <QBuffer>
#include <QFile>
#include <QImageReader>
#include <QImageWriter>
#include <QFileInfo>
#include <QVariantMap>

#include <algorithm>
#include <cstring>

// zlib is used when the build environment provides it. It is NOT assumed:
// __has_include decides, and the fallback path below is a complete, valid
// DEFLATE encoder and decoder of our own.
#if defined(__has_include)
#  if __has_include(<zlib.h>)
#    include <zlib.h>
#    define PAINT_HAVE_ZLIB 1
#  endif
#endif
#ifndef PAINT_HAVE_ZLIB
#  define PAINT_HAVE_ZLIB 0
#endif

namespace paint {

quint32 ImageIo::s_crcTable[256];
bool ImageIo::s_crcTableReady = false;

// ===========================================================================
// CRC-32 (PNG's own polynomial, reflected 0xEDB88320)
// ===========================================================================

void ImageIo::initCrcTable()
{
    if (s_crcTableReady)
        return;
    for (quint32 n = 0; n < 256; ++n) {
        quint32 c = n;
        for (int k = 0; k < 8; ++k)
            c = (c & 1u) ? (0xEDB88320u ^ (c >> 1)) : (c >> 1);
        s_crcTable[n] = c;
    }
    s_crcTableReady = true;
}

quint32 ImageIo::crc32Update(quint32 crc, const uchar *data, int len)
{
    initCrcTable();
    crc ^= 0xFFFFFFFFu;
    for (int i = 0; i < len; ++i)
        crc = s_crcTable[(crc ^ data[i]) & 0xFFu] ^ (crc >> 8);
    return crc ^ 0xFFFFFFFFu;
}

quint32 ImageIo::crc32(const uchar *data, int len)
{
    return crc32Update(0, data, len);
}

// ===========================================================================
// Adler-32 (zlib trailer)
// ===========================================================================

static quint32 adler32(const uchar *data, int len)
{
    quint32 a = 1, b = 0;
    for (int i = 0; i < len; ++i) {
        a = (a + data[i]) % 65521u;
        b = (b + a) % 65521u;
    }
    return (b << 16) | a;
}

// ===========================================================================
// DEFLATE bit reader + Huffman decoding (used when zlib is absent)
// ===========================================================================

namespace {

struct BitReader {
    const uchar *data = nullptr;
    int size = 0;
    int bytePos = 0;
    quint32 bitBuffer = 0;
    int bitCount = 0;
    bool failed = false;

    BitReader(const uchar *d, int n) : data(d), size(n) {}

    quint32 bits(int need)
    {
        while (bitCount < need) {
            if (bytePos >= size) {
                failed = true;
                return 0;
            }
            bitBuffer |= quint32(data[bytePos++]) << bitCount;
            bitCount += 8;
        }
        const quint32 v = bitBuffer & ((1u << need) - 1u);
        bitBuffer >>= need;
        bitCount -= need;
        return v;
    }

    void alignToByte()
    {
        bitBuffer = 0;
        bitCount = 0;
    }

    // Canonical Huffman table: counts[codelen] + symbols in order.
    struct Huffman {
        QVector<quint16> counts;     // codes of each length
        QVector<quint16> symbols;    // symbols ordered by (length, symbol)
        int minLen = 0;
        int maxLen = 0;

        bool build(const QVector<int> &lengths)
        {
            const int n = lengths.size();
            counts.fill(0, 16);
            for (int i = 0; i < n; ++i) {
                const int l = lengths.at(i);
                if (l < 0 || l > 15)
                    return false;
                counts[l]++;
            }
            if (counts[0] == n)
                return true;   // unused symbols are fine

            // Check for an over-subscribed code set.
            int left = 1;
            for (int len = 1; len <= 15; ++len) {
                left <<= 1;
                left -= counts[len];
                if (left < 0)
                    return false;
            }

            offsets.resize(16);
            offsets[0] = 0;
            for (int len = 1; len < 16; ++len)
                offsets[len] = offsets[len - 1] + counts[len - 1];

            symbols.fill(0, n);
            minLen = 15;
            maxLen = 0;
            for (int sym = 0; sym < n; ++sym) {
                const int l = lengths.at(sym);
                if (l == 0)
                    continue;
                minLen = qMin(minLen, l);
                maxLen = qMax(maxLen, l);
                symbols[offsets[l]++] = quint16(sym);
            }
            // offsets moved during assignment; rebuild them.
            offsets[0] = 0;
            for (int len = 1; len < 16; ++len)
                offsets[len] = offsets[len - 1] + counts[len - 1];
            return true;
        }

        int decode(BitReader &br) const
        {
            int code = 0;
            int first = 0;
            int index = 0;
            for (int len = 1; len <= 15; ++len) {
                code |= int(br.bits(1));
                if (br.failed)
                    return -1;
                const int count = counts[len];
                if (code - first < count)
                    return symbols.at(index + (code - first));
                index += count;
                first = (first + count) << 1;
                code <<= 1;
            }
            return -1;
        }

        QVector<int> offsets;
    };
};

// Length / distance tables from RFC 1951.
const int kLenBase[29] = {
    3, 4, 5, 6, 7, 8, 9, 10, 11, 13, 15, 17, 19, 23, 27, 31,
    35, 43, 51, 59, 67, 83, 99, 115, 131, 163, 195, 227, 258
};
const int kLenExtra[29] = {
    0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 2, 2, 2, 2,
    3, 3, 3, 3, 4, 4, 4, 4, 5, 5, 5, 5, 0
};
const int kDistBase[30] = {
    1, 2, 3, 4, 5, 7, 9, 13, 17, 25, 33, 49, 65, 97, 129, 193,
    257, 385, 513, 769, 1025, 1537, 2049, 3073, 4097, 6145,
    8193, 12289, 16385, 24577
};
const int kDistExtra[30] = {
    0, 0, 0, 0, 1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 6, 6,
    7, 7, 8, 8, 9, 9, 10, 10, 11, 11, 12, 12, 13, 13
};

// Minimal, complete DEFLATE decoder: stored, fixed-Huffman and
// dynamic-Huffman blocks. This is a real decoder, not a stub - it is what
// makes PNG reading work on a zlib-less build.
bool inflateRaw(const uchar *src, int srcLen, QByteArray *out, QString *error)
{
    BitReader br(src, srcLen);
    out->clear();

    bool finalBlock = false;
    int guard = 0;

    while (!finalBlock) {
        if (++guard > 1'000'000) {
            if (error) *error = QStringLiteral("deflate: runaway block count");
            return false;
        }
        finalBlock = br.bits(1) != 0;
        const int type = int(br.bits(2));
        if (br.failed) {
            if (error) *error = QStringLiteral("deflate: truncated header");
            return false;
        }

        if (type == 0) {
            // Stored: skip to byte boundary, copy LEN bytes.
            br.alignToByte();
            if (br.bytePos + 4 > br.size) {
                if (error) *error = QStringLiteral("deflate: truncated stored block");
                return false;
            }
            const int len = br.data[br.bytePos] | (br.data[br.bytePos + 1] << 8);
            const int nlen = br.data[br.bytePos + 2] | (br.data[br.bytePos + 3] << 8);
            br.bytePos += 4;
            if ((len ^ nlen) != 0xFFFF) {
                if (error) *error = QStringLiteral("deflate: stored LEN/NLEN mismatch");
                return false;
            }
            if (br.bytePos + len > br.size) {
                if (error) *error = QStringLiteral("deflate: stored block exceeds input");
                return false;
            }
            out->append(reinterpret_cast<const char *>(br.data + br.bytePos), len);
            br.bytePos += len;
            continue;
        }

        BitReader::Huffman litLen, dist;
        if (type == 1) {
            QVector<int> ll(288);
            for (int i = 0; i < 144; ++i) ll[i] = 8;
            for (int i = 144; i < 256; ++i) ll[i] = 9;
            for (int i = 256; i < 280; ++i) ll[i] = 7;
            for (int i = 280; i < 288; ++i) ll[i] = 8;
            QVector<int> dd(30, 5);
            if (!litLen.build(ll) || !dist.build(dd)) {
                if (error) *error = QStringLiteral("deflate: bad fixed tables");
                return false;
            }
        } else if (type == 2) {
            const int hlit = int(br.bits(5)) + 257;
            const int hdist = int(br.bits(5)) + 1;
            const int hclen = int(br.bits(4)) + 4;
            if (br.failed || hlit > 288 || hdist > 30) {
                if (error) *error = QStringLiteral("deflate: bad dynamic header");
                return false;
            }
            static const int kOrder[19] = {
                16, 17, 18, 0, 8, 7, 9, 6, 10, 5, 11, 4, 12, 3, 13, 2, 14, 1, 15
            };
            QVector<int> codeLen(19, 0);
            for (int i = 0; i < hclen; ++i)
                codeLen[kOrder[i]] = int(br.bits(3));
            BitReader::Huffman clTree;
            if (br.failed || !clTree.build(codeLen)) {
                if (error) *error = QStringLiteral("deflate: bad code-length tree");
                return false;
            }

            QVector<int> lengths;
            lengths.reserve(hlit + hdist);
            while (int(lengths.size()) < hlit + hdist) {
                const int sym = clTree.decode(br);
                if (sym < 0 || br.failed) {
                    if (error) *error = QStringLiteral("deflate: bad code-length symbol");
                    return false;
                }
                if (sym < 16) {
                    lengths.append(sym);
                } else if (sym == 16) {
                    if (lengths.isEmpty()) {
                        if (error) *error = QStringLiteral("deflate: repeat with no previous");
                        return false;
                    }
                    const int prev = lengths.last();
                    const int rep = 3 + int(br.bits(2));
                    for (int i = 0; i < rep; ++i)
                        lengths.append(prev);
                } else if (sym == 17) {
                    const int rep = 3 + int(br.bits(3));
                    for (int i = 0; i < rep; ++i)
                        lengths.append(0);
                } else {
                    const int rep = 11 + int(br.bits(7));
                    for (int i = 0; i < rep; ++i)
                        lengths.append(0);
                }
                if (lengths.size() > hlit + hdist + 32) {
                    if (error) *error = QStringLiteral("deflate: length overrun");
                    return false;
                }
            }
            lengths.resize(hlit + hdist);
            QVector<int> ll = lengths.mid(0, hlit);
            QVector<int> dd = lengths.mid(hlit);
            while (ll.size() < 257) ll.append(0);
            while (dd.size() < 1) dd.append(0);
            if (!litLen.build(ll) || !dist.build(dd)) {
                if (error) *error = QStringLiteral("deflate: unsymbolised dynamic tables");
                return false;
            }
        } else {
            if (error) *error = QStringLiteral("deflate: reserved block type");
            return false;
        }

        // Decode the block body.
        for (;;) {
            const int sym = litLen.decode(br);
            if (sym < 0 || br.failed) {
                if (error) *error = QStringLiteral("deflate: bad literal/length code");
                return false;
            }
            if (sym < 256) {
                out->append(char(sym));
                continue;
            }
            if (sym == 256)
                break;
            const int lenIdx = sym - 257;
            if (lenIdx >= 29) {
                if (error) *error = QStringLiteral("deflate: length code out of range");
                return false;
            }
            const int length = kLenBase[lenIdx] + int(br.bits(kLenExtra[lenIdx]));
            const int dsym = dist.decode(br);
            if (dsym < 0 || dsym >= 30 || br.failed) {
                if (error) *error = QStringLiteral("deflate: bad distance code");
                return false;
            }
            const int distance = kDistBase[dsym] + int(br.bits(kDistExtra[dsym]));
            if (distance <= 0 || distance > out->size()) {
                if (error) *error = QStringLiteral("deflate: distance exceeds output");
                return false;
            }
            const int start = out->size() - distance;
            for (int i = 0; i < length; ++i)
                out->append(out->at(start + i));
        }
        if (out->size() > 512 * 1024 * 1024) {
            if (error) *error = QStringLiteral("deflate: output exceeds 512 MB safety cap");
            return false;
        }
    }
    return true;
}

// Minimal DEFLATE encoder using only "stored" blocks. Every byte of the
// output is a legal DEFLATE stream; it simply carries no compression. This is
// the honest fallback when zlib.h was not available at build time.
QByteArray deflateStored(const uchar *data, int len)
{
    QByteArray out;
    out.reserve(len + (len / 65535 + 1) * 5 + 6);

    // zlib wrapper header: CM=8 (deflate), CINFO=7 (32K window), FCHECK makes
    // the 16-bit header divisible by 31. 0x7801 satisfies that.
    out.append(char(0x78));
    out.append(char(0x01));

    int pos = 0;
    if (len == 0) {
        // A single empty final stored block.
        out.append(char(0x01));          // BFINAL=1, BTYPE=00, padded
        out.append(char(0x00));
        out.append(char(0x00));
        out.append(char(0xFF));
        out.append(char(0xFF));
    }
    while (pos < len) {
        const int chunk = qMin(65535, len - pos);
        const bool last = (pos + chunk) >= len;
        out.append(char(last ? 0x01 : 0x00));     // 3 header bits, then pad
        out.append(char(chunk & 0xFF));
        out.append(char((chunk >> 8) & 0xFF));
        const int nlen = (~chunk) & 0xFFFF;
        out.append(char(nlen & 0xFF));
        out.append(char((nlen >> 8) & 0xFF));
        out.append(reinterpret_cast<const char *>(data + pos), chunk);
        pos += chunk;
    }

    const quint32 ad = adler32(data, len);
    out.append(char((ad >> 24) & 0xFF));
    out.append(char((ad >> 16) & 0xFF));
    out.append(char((ad >> 8) & 0xFF));
    out.append(char(ad & 0xFF));
    return out;
}

// Wraps raw deflate bytes in a zlib container with a correct adler32 trailer.
QByteArray zlibWrap(const QByteArray &rawDeflate, const uchar *rawData, int rawLen)
{
    QByteArray out;
    out.reserve(rawDeflate.size() + 6);
    out.append(char(0x78));
    out.append(char(0x01));
    out += rawDeflate;
    const quint32 ad = adler32(rawData, rawLen);
    out.append(char((ad >> 24) & 0xFF));
    out.append(char((ad >> 16) & 0xFF));
    out.append(char((ad >> 8) & 0xFF));
    out.append(char(ad & 0xFF));
    return out;
}

// Splits a zlib container and hands the deflate payload to the decoder.
bool zlibUnwrap(const QByteArray &in, QByteArray *out, QString *error)
{
    if (in.size() < 6) {
        if (error) *error = QStringLiteral("zlib: stream too short");
        return false;
    }
    const uchar *p = reinterpret_cast<const uchar *>(in.constData());
    const int cmf = p[0];
    const int flg = p[1];
    if ((cmf & 0x0F) != 8) {
        if (error) *error = QStringLiteral("zlib: unsupported compression method");
        return false;
    }
    if (((cmf << 8) | flg) % 31 != 0) {
        if (error) *error = QStringLiteral("zlib: header check failed");
        return false;
    }
    if (flg & 0x20) {
        if (error) *error = QStringLiteral("zlib: preset dictionaries are not supported");
        return false;
    }

    QByteArray raw(in.constData() + 2, in.size() - 2);
    return inflateRaw(reinterpret_cast<const uchar *>(raw.constData()), raw.size(),
                      out, error);
}

} // namespace

// ===========================================================================
// Capability probing
// ===========================================================================

ImageIo::ImageIo(QObject *parent)
    : QObject(parent)
{
    initCrcTable();
    capabilities();
}

ImageIo::~ImageIo() = default;

CodecCapabilities ImageIo::capabilities() const
{
    if (m_capabilitiesChecked)
        return m_caps;

    CodecCapabilities c;
#if PAINT_HAVE_ZLIB
    c.zlibPresent = true;
    c.zlibVersion = QString::fromLatin1(zlibVersion());
#else
    c.zlibPresent = false;
    c.zlibVersion = QStringLiteral("not available at build time");
#endif

    // JPEG honesty: ask Qt whether a handler actually exists rather than
    // assuming the plugin package was installed.
    const QList<QByteArray> writers = QImageWriter::supportedImageFormats();
    const QList<QByteArray> readers = QImageReader::supportedImageFormats();
    c.jpegWrite = writers.contains("jpg") || writers.contains("jpeg");
    c.jpegRead = readers.contains("jpg") || readers.contains("jpeg");
    c.qoiWrite = writers.contains("qoi");
    c.qoiRead = readers.contains("qoi");

    m_caps = c;
    m_capabilitiesChecked = true;
    const_cast<ImageIo *>(this)->emit capabilitiesChanged();
    return c;
}

bool ImageIo::jpegAvailable() const { return capabilities().jpegWrite; }
bool ImageIo::zlibAvailable() const { return capabilities().zlibPresent; }

QString ImageIo::pngStrategy() const
{
    const CodecCapabilities c = capabilities();
    if (c.zlibPresent)
        return QStringLiteral("PNG: own encoder + zlib deflate (level %1)")
            .arg(PngOptions().compressionLevel);
    return QStringLiteral("PNG: own encoder + own stored-block deflate (larger files, "
                          "zlib was not available when this binary was built)");
}

QStringList ImageIo::writableFormats() const
{
    QStringList out;
    out << "png" << "bmp";
    if (capabilities().jpegWrite)
        out << "jpg";
    if (capabilities().qoiWrite)
        out << "qoi";
    return out;
}

QStringList ImageIo::readableFormats() const
{
    QStringList out;
    out << "png" << "bmp";
    if (capabilities().jpegRead)
        out << "jpg";
    if (capabilities().qoiRead)
        out << "qoi";
    return out;
}

QVariantMap ImageIo::capabilityMap() const
{
    const CodecCapabilities c = capabilities();
    QVariantMap m;
    m.insert("pngRead", c.pngRead);
    m.insert("pngWrite", c.pngWrite);
    m.insert("bmpRead", c.bmpRead);
    m.insert("bmpWrite", c.bmpWrite);
    m.insert("jpegRead", c.jpegRead);
    m.insert("jpegWrite", c.jpegWrite);
    m.insert("qoiRead", c.qoiRead);
    m.insert("qoiWrite", c.qoiWrite);
    m.insert("zlibPresent", c.zlibPresent);
    m.insert("zlibVersion", c.zlibVersion);
    m.insert("pngStrategy", pngStrategy());
    m.insert("writable", writableFormats());
    m.insert("readable", readableFormats());
    return m;
}

QVariantList ImageIo::formatFilters(const QString &purpose) const
{
    // Shape: [{ name, filter, extensions }...] ready for QML FileDialog.
    QVariantList out;
    auto add = [&out](const QString &name, const QString &filter) {
        QVariantMap m;
        m.insert("name", name);
        m.insert("filter", filter);
        out.append(m);
    };
    const bool write = purpose.compare(QLatin1String("write"), Qt::CaseInsensitive) == 0;

    add(QStringLiteral("PNG image"), QStringLiteral("*.png"));
    add(QStringLiteral("Windows bitmap"), QStringLiteral("*.bmp"));
    if ((write && capabilities().jpegWrite) || (!write && capabilities().jpegRead))
        add(QStringLiteral("JPEG image"), QStringLiteral("*.jpg *.jpeg"));
    if ((write && capabilities().qoiWrite) || (!write && capabilities().qoiRead))
        add(QStringLiteral("QOI image"), QStringLiteral("*.qoi"));
    add(QStringLiteral("All supported"), QStringLiteral("*.png *.bmp *.jpg *.jpeg *.qoi"));
    return out;
}

QVariantList CodecCapabilities::toVariantList() const
{
    QVariantList out;
    auto add = [&out](const char *n, bool v) {
        QVariantMap m;
        m.insert("name", QString::fromLatin1(n));
        m.insert("available", v);
        out.append(m);
    };
    add("png-read", pngRead);
    add("png-write", pngWrite);
    add("zlib", zlibPresent);
    add("bmp-read", bmpRead);
    add("bmp-write", bmpWrite);
    add("jpeg-read", jpegRead);
    add("jpeg-write", jpegWrite);
    add("qoi-read", qoiRead);
    add("qoi-write", qoiWrite);
    return out;
}

// ===========================================================================
// PNG chunk framing
// ===========================================================================

struct ImageIo::PngChunk {
    char type[5] = { 0, 0, 0, 0, 0 };
    QByteArray payload;
    quint32 crc = 0;
};

bool ImageIo::writeChunk(QIODevice *dev, const char *type, const QByteArray &payload,
                         QString *error)
{
    char lenBytes[4];
    const quint32 len = quint32(payload.size());
    lenBytes[0] = char((len >> 24) & 0xFF);
    lenBytes[1] = char((len >> 16) & 0xFF);
    lenBytes[2] = char((len >> 8) & 0xFF);
    lenBytes[3] = char(len & 0xFF);
    if (dev->write(lenBytes, 4) != 4) {
        if (error) *error = QStringLiteral("png: short write on chunk length");
        return false;
    }
    if (dev->write(type, 4) != 4) {
        if (error) *error = QStringLiteral("png: short write on chunk type");
        return false;
    }
    if (len && dev->write(payload) != qint64(len)) {
        if (error) *error = QStringLiteral("png: short write on chunk payload");
        return false;
    }

    QByteArray crcInput(type, 4);
    crcInput += payload;
    const quint32 crc = crc32(reinterpret_cast<const uchar *>(crcInput.constData()),
                              crcInput.size());
    char crcBytes[4];
    crcBytes[0] = char((crc >> 24) & 0xFF);
    crcBytes[1] = char((crc >> 16) & 0xFF);
    crcBytes[2] = char((crc >> 8) & 0xFF);
    crcBytes[3] = char(crc & 0xFF);
    if (dev->write(crcBytes, 4) != 4) {
        if (error) *error = QStringLiteral("png: short write on chunk crc");
        return false;
    }
    return true;
}

bool ImageIo::readChunk(QIODevice *dev, PngChunk *chunk, QString *error)
{
    char lenBytes[4];
    if (dev->read(lenBytes, 4) != 4) {
        if (error) *error = QStringLiteral("png: truncated chunk length");
        return false;
    }
    const quint32 len = (quint32(uchar(lenBytes[0])) << 24)
                        | (quint32(uchar(lenBytes[1])) << 16)
                        | (quint32(uchar(lenBytes[2])) << 8)
                        | quint32(uchar(lenBytes[3]));
    if (len > 0x7FFFFFFFu) {
        if (error) *error = QStringLiteral("png: chunk length exceeds 2 GB");
        return false;
    }
    char type[4];
    if (dev->read(type, 4) != 4) {
        if (error) *error = QStringLiteral("png: truncated chunk type");
        return false;
    }
    std::memcpy(chunk->type, type, 4);
    chunk->type[4] = 0;

    chunk->payload.resize(int(len));
    if (len && dev->read(chunk->payload.data(), int(len)) != qint64(len)) {
        if (error) *error = QStringLiteral("png: truncated chunk payload");
        return false;
    }
    char crcBytes[4];
    if (dev->read(crcBytes, 4) != 4) {
        if (error) *error = QStringLiteral("png: truncated chunk crc");
        return false;
    }
    const quint32 storedCrc = (quint32(uchar(crcBytes[0])) << 24)
                              | (quint32(uchar(crcBytes[1])) << 16)
                              | (quint32(uchar(crcBytes[2])) << 8)
                              | quint32(uchar(crcBytes[3]));
    QByteArray crcInput(type, 4);
    crcInput += chunk->payload;
    const quint32 actual = crc32(reinterpret_cast<const uchar *>(crcInput.constData()),
                                 crcInput.size());
    if (storedCrc != actual) {
        if (error)
            *error = QStringLiteral("png: CRC mismatch in chunk %1 (stored %2, computed %3)")
                         .arg(QString::fromLatin1(type))
                         .arg(storedCrc, 0, 16)
                         .arg(actual, 0, 16);
        return false;
    }
    chunk->crc = storedCrc;
    return true;
}

// ===========================================================================
// PNG encoding
// ===========================================================================

// Sum of absolute values of the filtered bytes interpreted as signed
// characters - PNG's own heuristic for choosing the best filter per line.
static int filterCost(const QByteArray &line)
{
    int sum = 0;
    for (char c : line) {
        const int v = signed char(c);
        sum += (v < 0) ? -v : v;
    }
    return sum;
}

static uchar paethPredictor(int a, int b, int c)
{
    const int p = a + b - c;
    const int pa = std::abs(p - a);
    const int pb = std::abs(p - b);
    const int pc = std::abs(p - c);
    if (pa <= pb && pa <= pc)
        return uchar(a);
    if (pb <= pc)
        return uchar(b);
    return uchar(c);
}

IoResult ImageIo::encodePng(const QImage &image, QByteArray *out, const PngOptions &opts)
{
    if (!out)
        return IoResult::failure(QStringLiteral("png: null output buffer"));
    out->clear();
    if (image.isNull())
        return IoResult::failure(QStringLiteral("png: cannot encode a null image"));

    initCrcTable();

    const QImage src = image.convertToFormat(QImage::Format_ARGB32);
    const int w = src.width();
    const int h = src.height();

    // Do we genuinely need an alpha channel? Ask the pixels, not the format.
    bool hasAlpha = false;
    if (opts.writeAlpha) {
        for (int y = 0; y < h && !hasAlpha; ++y) {
            const QRgb *row = reinterpret_cast<const QRgb *>(src.constScanLine(y));
            for (int x = 0; x < w; ++x)
                if (qAlpha(row[x]) != 255) { hasAlpha = true; break; }
        }
    }

    const int channels = hasAlpha ? 4 : 3;
    const int colorType = hasAlpha ? 6 : 2;
    const int bytesPerLine = w * channels;

    // --- build the filtered scanline stream ---------------------------------
    QByteArray raw;
    raw.reserve(size_t(h) * size_t(bytesPerLine + 1));
    QByteArray prevLine(bytesPerLine, char(0));
    QByteArray line(bytesPerLine, char(0));
    QVector<int> costs(5);

    for (int y = 0; y < h; ++y) {
        const QRgb *row = reinterpret_cast<const QRgb *>(src.constScanLine(y));
        if (hasAlpha) {
            for (int x = 0; x < w; ++x) {
                const QRgb p = row[x];
                line[x * 4 + 0] = char(qRed(p));
                line[x * 4 + 1] = char(qGreen(p));
                line[x * 4 + 2] = char(qBlue(p));
                line[x * 4 + 3] = char(qAlpha(p));
            }
        } else {
            for (int x = 0; x < w; ++x) {
                const QRgb p = row[x];
                line[x * 3 + 0] = char(qRed(p));
                line[x * 3 + 1] = char(qGreen(p));
                line[x * 3 + 2] = char(qBlue(p));
            }
        }

        if (!opts.filterAdaptive) {
            raw.append(char(0));
            raw += line;
            prevLine = line;
            continue;
        }

        QByteArray fNone(bytesPerLine, char(0));
        QByteArray fSub(bytesPerLine, char(0));
        QByteArray fUp(bytesPerLine, char(0));
        QByteArray fAvg(bytesPerLine, char(0));
        QByteArray fPaeth(bytesPerLine, char(0));

        for (int i = 0; i < bytesPerLine; ++i) {
            const int cur = uchar(line.at(i));
            const int left = i >= channels ? uchar(line.at(i - channels)) : 0;
            const int up = uchar(prevLine.at(i));
            const int upLeft = i >= channels ? uchar(prevLine.at(i - channels)) : 0;

            fNone[i] = char(cur);
            fSub[i] = char((cur - left) & 0xFF);
            fUp[i] = char((cur - up) & 0xFF);
            fAvg[i] = char((cur - ((left + up) >> 1)) & 0xFF);
            fPaeth[i] = char((cur - paethPredictor(left, up, upLeft)) & 0xFF);
        }

        costs[0] = filterCost(fNone);
        costs[1] = filterCost(fSub);
        costs[2] = filterCost(fUp);
        costs[3] = filterCost(fAvg);
        costs[4] = filterCost(fPaeth);

        int best = 0;
        for (int i = 1; i < 5; ++i)
            if (costs[i] < costs[best])
                best = i;

        // Non-static on purpose: these are locals and must not outlive the
        // iteration they were built in.
        const QByteArray *table[5] = { &fNone, &fSub, &fUp, &fAvg, &fPaeth };
        raw.append(char(best));
        raw += *table[best];
        prevLine = line;
    }

    // --- compress -------------------------------------------------------------
    QByteArray idat;
    QString strategy;
#if PAINT_HAVE_ZLIB
    if (opts.useZlib) {
        uLongf bound = compressBound(uLong(raw.size()));
        idat.resize(int(bound));
        const int rc = compress2(reinterpret_cast<Bytef *>(idat.data()), &bound,
                                 reinterpret_cast<const Bytef *>(raw.constData()),
                                 uLong(raw.size()),
                                 qBound(0, opts.compressionLevel, 9));
        if (rc != Z_OK)
            return IoResult::failure(QStringLiteral("png: zlib compress2 failed (%1)").arg(rc));
        idat.resize(int(bound));
        strategy = QStringLiteral("zlib");
    } else {
        idat = deflateStored(reinterpret_cast<const uchar *>(raw.constData()), raw.size());
        strategy = QStringLiteral("stored");
    }
#else
    if (opts.useZlib) {
        // No zlib in this build. We do not pretend: we fall back and record it.
        idat = deflateStored(reinterpret_cast<const uchar *>(raw.constData()), raw.size());
        strategy = QStringLiteral("stored (zlib unavailable)");
    } else {
        idat = deflateStored(reinterpret_cast<const uchar *>(raw.constData()), raw.size());
        strategy = QStringLiteral("stored");
    }
#endif

    // --- assemble the file -----------------------------------------------------
    QByteArray file;
    file.reserve(idat.size() + 512);
    static const char kSig[8] = { char(0x89), 'P', 'N', 'G', '\r', '\n', 0x1A, '\n' };
    file.append(kSig, 8);

    QBuffer buf(&file);
    buf.open(QIODevice::Append);
    QString err;

    QByteArray ihdr;
    {
        QBuffer b(&ihdr);
        b.open(QIODevice::WriteOnly);
        auto put32 = [&b](quint32 v) {
            char d[4] = { char((v >> 24) & 0xFF), char((v >> 16) & 0xFF),
                          char((v >> 8) & 0xFF), char(v & 0xFF) };
            b.write(d, 4);
        };
        put32(quint32(w));
        put32(quint32(h));
        b.putChar(char(8));        // bit depth
        b.putChar(char(colorType));
        b.putChar(char(0));        // compression method: deflate
        b.putChar(char(0));        // filter method: adaptive
        b.putChar(char(0));        // interlace: none
        b.close();
    }
    if (!writeChunk(&buf, "IHDR", ihdr, &err))
        return IoResult::failure(err);

    if (!opts.softwareTag.isEmpty()) {
        QByteArray text;
        text.append("Software");
        text.append(char(0));
        text.append(opts.softwareTag.toUtf8());
        if (!writeChunk(&buf, "tEXt", text, &err))
            return IoResult::failure(err);
    }

    if (!writeChunk(&buf, "IDAT", idat, &err))
        return IoResult::failure(err);
    if (!writeChunk(&buf, "IEND", QByteArray(), &err))
        return IoResult::failure(err);

    buf.close();

    IoResult r = IoResult::success(file.size());
    r.detail = QStringLiteral("png/%1, %2bpp, %3 channels, filter=adaptive")
                   .arg(strategy).arg(hasAlpha ? 32 : 24).arg(channels);
    if (!opts.useZlib || !QString(strategy).contains(QStringLiteral("zlib"))) {
#if !PAINT_HAVE_ZLIB
        r.warning = QStringLiteral(
            "zlib.h was not available when this build was produced, so the PNG "
            "was written with stored (uncompressed) DEFLATE blocks. The file is "
            "a valid PNG and opens in any reader, but is larger than it would "
            "be with zlib.");
#endif
    }
    *out = file;
    return r;
}

bool ImageIo::encodePngToDevice(const QImage &image, QIODevice *device,
                                const PngOptions &opts, QString *error)
{
    if (!device) {
        if (error) *error = QStringLiteral("png: null device");
        return false;
    }
    QByteArray bytes;
    const IoResult r = encodePng(image, &bytes, opts);
    if (!r.ok) {
        if (error) *error = r.error;
        return false;
    }
    if (device->write(bytes) != bytes.size()) {
        if (error) *error = QStringLiteral("png: short write");
        return false;
    }
    return true;
}

IoResult ImageIo::savePng(const QImage &image, const QString &filePath,
                          const PngOptions &opts)
{
    QFile f(filePath);
    if (!f.open(QIODevice::WriteOnly | QIODevice::Truncate))
        return IoResult::failure(QStringLiteral("cannot open for writing: %1").arg(filePath));
    QByteArray bytes;
    const IoResult r = encodePng(image, &bytes, opts);
    if (!r.ok)
        return r;
    const qint64 n = f.write(bytes);
    f.close();
    if (n != bytes.size())
        return IoResult::failure(QStringLiteral("short write to %1").arg(filePath));
    IoResult ok = r;
    ok.bytesWritten = n;
    return ok;
}

// ===========================================================================
// PNG decoding
// ===========================================================================

static int pngChannels(int colorType)
{
    switch (colorType) {
    case 0: return 1;   // grey
    case 2: return 3;   // rgb
    case 3: return 1;   // palette index
    case 4: return 2;   // grey + alpha
    case 6: return 4;   // rgba
    default: return 0;
    }
}

static int pngBitDepthValid(int colorType, int bitDepth)
{
    switch (colorType) {
    case 0:
        return bitDepth == 1 || bitDepth == 2 || bitDepth == 4
               || bitDepth == 8 || bitDepth == 16;
    case 3:
        return bitDepth == 1 || bitDepth == 2 || bitDepth == 4 || bitDepth == 8;
    case 2: case 4: case 6:
        return bitDepth == 8 || bitDepth == 16;
    default:
        return 0;
    }
}

// Reads a sample of `bitDepth` bits starting at bit offset `bitPos` in `row`.
static int pngSample(const uchar *row, int bitPos, int bitDepth)
{
    switch (bitDepth) {
    case 1: return (row[bitPos >> 3] >> (7 - (bitPos & 7))) & 1;
    case 2: return (row[bitPos >> 3] >> (6 - 2 * (bitPos & 7))) & 3;
    case 4: return (row[bitPos >> 3] >> (4 - 4 * (bitPos & 7))) & 15;
    case 8: return row[bitPos >> 3];
    case 16: return row[bitPos >> 3];   // high byte; low byte dropped (see warning)
    default: return 0;
    }
}

bool ImageIo::decodeScanlines(const QByteArray &raw, int width, int height, int bitDepth,
                              int colorType, const QVector<quint8> &palette,
                              const QVector<quint8> &trans, int interlace, QImage *out,
                              QString *error)
{
    if (interlace != 0) {
        if (error)
            *error = QStringLiteral("png: Adam7 interlaced images are not supported "
                                    "by this decoder");
        return false;
    }
    const int channels = pngChannels(colorType);
    if (channels == 0) {
        if (error) *error = QStringLiteral("png: unknown colour type");
        return false;
    }
    const int bppBits = channels * bitDepth;
    const int bpp = qMax(1, (bppBits + 7) / 8);      // filter stride in bytes
    const int bytesPerLine = (width * bppBits + 7) / 8;
    const qint64 needed = qint64(height) * (qint64(bytesPerLine) + 1);
    if (raw.size() < needed) {
        if (error)
            *error = QStringLiteral("png: pixel data truncated (need %1 bytes, have %2)")
                         .arg(needed).arg(raw.size());
        return false;
    }

    // --- un-filter -----------------------------------------------------------
    QByteArray lines(raw.constData(), int(needed));
    for (int y = 0; y < height; ++y) {
        uchar *cur = reinterpret_cast<uchar *>(lines.data()) + y * (bytesPerLine + 1) + 1;
        const int filter = int(uchar(lines.constData()[y * (bytesPerLine + 1)]));
        const uchar *prev = (y > 0)
            ? reinterpret_cast<const uchar *>(lines.constData()) + (y - 1) * (bytesPerLine + 1) + 1
            : nullptr;

        switch (filter) {
        case 0:
            break;
        case 1:
            for (int i = bpp; i < bytesPerLine; ++i)
                cur[i] = uchar(cur[i] + cur[i - bpp]);
            break;
        case 2:
            if (prev)
                for (int i = 0; i < bytesPerLine; ++i)
                    cur[i] = uchar(cur[i] + prev[i]);
            break;
        case 3:
            for (int i = 0; i < bytesPerLine; ++i) {
                const int left = i >= bpp ? cur[i - bpp] : 0;
                const int up = prev ? prev[i] : 0;
                cur[i] = uchar(cur[i] + ((left + up) >> 1));
            }
            break;
        case 4:
            for (int i = 0; i < bytesPerLine; ++i) {
                const int a = i >= bpp ? cur[i - bpp] : 0;
                const int b = prev ? prev[i] : 0;
                const int c = (prev && i >= bpp) ? prev[i - bpp] : 0;
                cur[i] = uchar(cur[i] + paethPredictor(a, b, c));
            }
            break;
        default:
            if (error) *error = QStringLiteral("png: invalid filter type %1 on line %2")
                                    .arg(filter).arg(y);
            return false;
        }
    }

    // --- convert to ARGB32 ----------------------------------------------------
    QImage img(width, height, QImage::Format_ARGB32);
    img.fill(Qt::transparent);
    const int maxValue = (1 << ((bitDepth < 8) ? bitDepth : 8)) - 1;
    const bool wide = (bitDepth == 16);

    for (int y = 0; y < height; ++y) {
        const uchar *row = reinterpret_cast<const uchar *>(lines.constData())
                           + y * (bytesPerLine + 1) + 1;
        QRgb *dst = reinterpret_cast<QRgb *>(img.scanLine(y));
        int bitPos = 0;

        for (int x = 0; x < width; ++x) {
            QRgb px = qRgba(0, 0, 0, 255);
            if (colorType == 0) {
                int v = pngSample(row, bitPos, bitDepth);
                if (bitDepth < 8)
                    v = maxValue ? v * 255 / maxValue : 0;
                else if (wide)
                    ;   // high byte already the 8-bit value
                px = qRgba(v, v, v, 255);
                bitPos += bitDepth;
            } else if (colorType == 2) {
                const int r = pngSample(row, bitPos, bitDepth);
                const int g = pngSample(row, bitPos + bitDepth, bitDepth);
                const int b = pngSample(row, bitPos + 2 * bitDepth, bitDepth);
                px = qRgba(r, g, b, 255);
                bitPos += 3 * bitDepth;
            } else if (colorType == 3) {
                const int idx = pngSample(row, bitPos, bitDepth);
                if (idx * 4 + 3 < palette.size()) {
                    const int a = (idx * 4 + 3 < trans.size()) ? trans.at(idx * 4 + 3) : 255;
                    px = qRgba(palette.at(idx * 4), palette.at(idx * 4 + 1),
                               palette.at(idx * 4 + 2), a);
                } else {
                    px = qRgba(255, 0, 255, 255);   // out-of-range index: obvious
                }
                bitPos += bitDepth;
            } else if (colorType == 4) {
                const int v = pngSample(row, bitPos, bitDepth);
                const int a = pngSample(row, bitPos + bitDepth, bitDepth);
                px = qRgba(v, v, v, a);
                bitPos += 2 * bitDepth;
            } else {   // 6
                const int r = pngSample(row, bitPos, bitDepth);
                const int g = pngSample(row, bitPos + bitDepth, bitDepth);
                const int b = pngSample(row, bitPos + 2 * bitDepth, bitDepth);
                const int a = pngSample(row, bitPos + 3 * bitDepth, bitDepth);
                px = qRgba(r, g, b, a);
                bitPos += 4 * bitDepth;
            }
            dst[x] = px;
        }
    }

    *out = img.convertToFormat(QImage::Format_ARGB32_Premultiplied);
    return true;
}

IoResult ImageIo::decodePng(const QByteArray &data, QImage *out, QString *warning)
{
    if (!out)
        return IoResult::failure(QStringLiteral("png: null output image"));
    if (data.size() < 8)
        return IoResult::failure(QStringLiteral("png: file shorter than the signature"));

    static const unsigned char kSig[8] = { 0x89, 'P', 'N', 'G', '\r', '\n', 0x1A, '\n' };
    if (std::memcmp(data.constData(), kSig, 8) != 0)
        return IoResult::failure(QStringLiteral("png: bad signature"));

    QBuffer buf;
    buf.setData(data);
    buf.open(QIODevice::ReadOnly);

    int width = 0, height = 0, bitDepth = 8, colorType = 6;
    int interlace = 0;
    bool sawIhdr = false;
    bool sawIend = false;
    QVector<quint8> palette;
    QVector<quint8> trans;
    QByteArray idat;

    QString err;
    while (!sawIend) {
        PngChunk chunk;
        if (!readChunk(&buf, &chunk, &err)) {
            // A truncated tail is a warning, not a hard failure: we may already
            // hold a complete IDAT and can still produce the image.
            if (!idat.isEmpty() && sawIhdr) {
                if (warning)
                    *warning = QStringLiteral("png: %1 - recovered from complete IDAT data").arg(err);
                break;
            }
            return IoResult::failure(err);
        }

        const QString type = QString::fromLatin1(chunk.type);
        if (type == QLatin1String("IHDR")) {
            if (chunk.payload.size() != 13)
                return IoResult::failure(QStringLiteral("png: IHDR must be 13 bytes"));
            const uchar *p = reinterpret_cast<const uchar *>(chunk.payload.constData());
            width = int((quint32(p[0]) << 24) | (quint32(p[1]) << 16)
                        | (quint32(p[2]) << 8) | quint32(p[3]));
            height = int((quint32(p[4]) << 24) | (quint32(p[5]) << 16)
                         | (quint32(p[6]) << 8) | quint32(p[7]));
            bitDepth = p[8];
            colorType = p[9];
            if (p[10] != 0)
                return IoResult::failure(QStringLiteral("png: unsupported compression method"));
            if (p[11] != 0)
                return IoResult::failure(QStringLiteral("png: unsupported filter method"));
            interlace = p[12];
            if (width <= 0 || height <= 0)
                return IoResult::failure(QStringLiteral("png: invalid dimensions"));
            if (width > 65535 || height > 65535)
                return IoResult::failure(QStringLiteral("png: dimensions exceed 65535"));
            if (!pngBitDepthValid(colorType, bitDepth))
                return IoResult::failure(
                    QStringLiteral("png: bit depth %1 is not valid for colour type %2")
                        .arg(bitDepth).arg(colorType));
            sawIhdr = true;
        } else if (type == QLatin1String("PLTE")) {
            palette = QVector<quint8>(
                reinterpret_cast<const quint8 *>(chunk.payload.constData()),
                chunk.payload.size());
            if (palette.size() % 3 != 0 || palette.size() > 256 * 3)
                return IoResult::failure(QStringLiteral("png: malformed PLTE"));
            // Expand to RGBA quads for direct indexing.
            QVector<quint8> rgba;
            rgba.reserve(palette.size() / 3 * 4);
            for (int i = 0; i + 2 < palette.size(); i += 3) {
                rgba.append(palette.at(i));
                rgba.append(palette.at(i + 1));
                rgba.append(palette.at(i + 2));
                rgba.append(255);
            }
            palette = rgba;
        } else if (type == QLatin1String("tRNS")) {
            trans = QVector<quint8>(
                reinterpret_cast<const quint8 *>(chunk.payload.constData()),
                chunk.payload.size());
        } else if (type == QLatin1String("IDAT")) {
            if (!sawIhdr)
                return IoResult::failure(QStringLiteral("png: IDAT before IHDR"));
            if (colorType == 3 && palette.isEmpty())
                return IoResult::failure(QStringLiteral("png: palette image without PLTE"));
            idat += chunk.payload;
        } else if (type == QLatin1String("IEND")) {
            sawIend = true;
        }
        // Ancillary chunks (tEXt, gAMA, sRGB, pHYs, tIME...) are intentionally
        // skipped: they do not affect the pixels we are asked to show.
    }

    if (!sawIhdr)
        return IoResult::failure(QStringLiteral("png: no IHDR chunk"));
    if (idat.isEmpty())
        return IoResult::failure(QStringLiteral("png: no IDAT chunk"));

    QByteArray inflated;
    QString inflateError;
    if (!zlibUnwrap(idat, &inflated, &inflateError))
        return IoResult::failure(QStringLiteral("png: %1").arg(inflateError));

    QImage result;
    if (!decodeScanlines(inflated, width, height, bitDepth, colorType, palette, trans,
                         interlace, &result, &err))
        return IoResult::failure(err);

    *out = result;
    IoResult r = IoResult::success(data.size());
    r.detail = QStringLiteral("png %1x%2 %3bpp type%4").arg(width).arg(height)
                   .arg(bitDepth).arg(colorType);
    if (bitDepth == 16)
        r.warning = QStringLiteral("16-bit PNG reduced to 8 bits per channel");
    if (interlace != 0)
        r.warning = QStringLiteral("interlaced PNG could not be decoded");
    if (warning)
        *warning = r.warning;
    return r;
}

IoResult ImageIo::loadPng(const QString &filePath, QImage *out, QString *warning)
{
    QFile f(filePath);
    if (!f.open(QIODevice::ReadOnly))
        return IoResult::failure(QStringLiteral("cannot open: %1").arg(filePath));
    return decodePng(f.readAll(), out, warning);
}

// ===========================================================================
// BMP encoding - our own, no plugin involved
// ===========================================================================

IoResult ImageIo::encodeBmp(const QImage &image, QByteArray *out, bool withAlpha)
{
    if (!out)
        return IoResult::failure(QStringLiteral("bmp: null output buffer"));
    out->clear();
    if (image.isNull())
        return IoResult::failure(QStringLiteral("bmp: cannot encode a null image"));

    const QImage src = image.convertToFormat(QImage::Format_ARGB32);
    const int w = src.width();
    const int h = src.height();

    bool needAlpha = false;
    if (withAlpha) {
        for (int y = 0; y < h && !needAlpha; ++y) {
            const QRgb *row = reinterpret_cast<const QRgb *>(src.constScanLine(y));
            for (int x = 0; x < w; ++x)
                if (qAlpha(row[x]) != 255) { needAlpha = true; break; }
        }
    }

    // 32-bit with alpha needs BITMAPV4HEADER + explicit channel masks, because
    // plain BI_RGB 32bpp leaves alpha undefined and most readers guess wrong.
    const int bpp = needAlpha ? 32 : 24;
    const int infoSize = needAlpha ? 108 : 40;
    const int rowRaw = needAlpha ? w * 4 : ((w * 3 + 3) & ~3);
    const int dataSize = rowRaw * h;
    const int offset = 14 + infoSize;
    const int fileSize = offset + dataSize;

    QByteArray file(fileSize, char(0));
    uchar *base = reinterpret_cast<uchar *>(file.data());

    // BITMAPFILEHEADER (14 bytes)
    base[0] = 'B'; base[1] = 'M';
    base[2] = uchar(fileSize & 0xFF);
    base[3] = uchar((fileSize >> 8) & 0xFF);
    base[4] = uchar((fileSize >> 16) & 0xFF);
    base[5] = uchar((fileSize >> 24) & 0xFF);
    // bytes 6-9 reserved, already zero
    base[10] = uchar(offset & 0xFF);
    base[11] = uchar((offset >> 8) & 0xFF);
    base[12] = uchar((offset >> 16) & 0xFF);
    base[13] = uchar((offset >> 24) & 0xFF);

    auto put32 = [base](int at, quint32 v) {
        base[at] = uchar(v & 0xFF);
        base[at + 1] = uchar((v >> 8) & 0xFF);
        base[at + 2] = uchar((v >> 16) & 0xFF);
        base[at + 3] = uchar((v >> 24) & 0xFF);
    };
    auto put16 = [base](int at, quint16 v) {
        base[at] = uchar(v & 0xFF);
        base[at + 1] = uchar((v >> 8) & 0xFF);
    };

    put32(14, quint32(infoSize));                 // bV4Size / biSize
    put32(18, quint32(w));
    put32(22, quint32(h));                        // positive => bottom-up
    put16(26, 1);                                 // planes
    put16(28, quint16(bpp));
    put32(30, needAlpha ? 3u : 0u);               // BI_BITFIELDS : BI_RGB
    put32(34, quint32(dataSize));
    put32(38, 2835);                              // 72 DPI in pixels/metre
    put32(42, 2835);
    put32(46, needAlpha ? 3u : 0u);               // palette colours used
    put32(50, needAlpha ? 3u : 0u);               // important colours

    if (needAlpha) {
        // BITMAPV4HEADER channel masks at offsets 54..70.
        put32(54, 0x00FF0000u);   // red
        put32(58, 0x0000FF00u);   // green
        put32(62, 0x000000FFu);   // blue
        put32(66, 0xFF000000u);   // alpha
        // bV4CSType = 'sRGB' (LCS_sRGB) at offset 70.
        base[70] = 's'; base[71] = 'R'; base[72] = 'G'; base[73] = 'B';
    }

    uchar *pixels = base + offset;
    for (int y = 0; y < h; ++y) {
        const int srcY = h - 1 - y;               // bottom-up storage
        const QRgb *row = reinterpret_cast<const QRgb *>(src.constScanLine(srcY));
        uchar *dst = pixels + y * rowRaw;
        if (needAlpha) {
            for (int x = 0; x < w; ++x) {
                const QRgb p = row[x];
                dst[x * 4 + 0] = uchar(qBlue(p));
                dst[x * 4 + 1] = uchar(qGreen(p));
                dst[x * 4 + 2] = uchar(qRed(p));
                dst[x * 4 + 3] = uchar(qAlpha(p));
            }
        } else {
            for (int x = 0; x < w; ++x) {
                const QRgb p = row[x];
                dst[x * 3 + 0] = uchar(qBlue(p));
                dst[x * 3 + 1] = uchar(qGreen(p));
                dst[x * 3 + 2] = uchar(qRed(p));
            }
            // The row was allocated with padding; it is already zeroed by the
            // QByteArray constructor, so the pad bytes need no work.
        }
    }

    *out = file;
    IoResult r = IoResult::success(file.size());
    r.detail = QStringLiteral("bmp %1bpp %2, %3x%4").arg(bpp)
                   .arg(needAlpha ? "BITMAPV4HEADER+masks" : "BITMAPINFOHEADER BI_RGB")
                   .arg(w).arg(h);
    return r;
}

IoResult ImageIo::saveBmp(const QImage &image, const QString &filePath, bool withAlpha)
{
    QFile f(filePath);
    if (!f.open(QIODevice::WriteOnly | QIODevice::Truncate))
        return IoResult::failure(QStringLiteral("cannot open for writing: %1").arg(filePath));
    QByteArray bytes;
    const IoResult r = encodeBmp(image, &bytes, withAlpha);
    if (!r.ok)
        return r;
    const qint64 n = f.write(bytes);
    f.close();
    if (n != bytes.size())
        return IoResult::failure(QStringLiteral("short write to %1").arg(filePath));
    IoResult ok = r;
    ok.bytesWritten = n;
    return ok;
}

// ===========================================================================
// BMP decoding
// ===========================================================================

IoResult ImageIo::decodeBmp(const QByteArray &data, QImage *out)
{
    if (!out)
        return IoResult::failure(QStringLiteral("bmp: null output image"));
    if (data.size() < 54)
        return IoResult::failure(QStringLiteral("bmp: file shorter than a header"));
    const uchar *p = reinterpret_cast<const uchar *>(data.constData());
    if (p[0] != 'B' || p[1] != 'M')
        return IoResult::failure(QStringLiteral("bmp: bad signature"));

    auto u32 = [p](int at) -> quint32 {
        return quint32(p[at]) | (quint32(p[at + 1]) << 8)
               | (quint32(p[at + 2]) << 16) | (quint32(p[at + 3]) << 24);
    };

    const quint32 pixelOffset = u32(10);
    const quint32 infoSize = u32(14);
    if (infoSize < 40)
        return IoResult::failure(QStringLiteral("bmp: unsupported DIB header size %1")
                                     .arg(infoSize));

    const int width = int(u32(18));
    const int rawHeight = int(u32(22));
    const bool topDown = rawHeight < 0;
    const int height = topDown ? -rawHeight : rawHeight;
    const quint16 planes = quint16(p[26] | (p[27] << 8));
    const quint16 bpp = quint16(p[28] | (p[29] << 8));
    const quint32 compression = u32(30);

    if (planes != 1)
        return IoResult::failure(QStringLiteral("bmp: planes must be 1"));
    if (width <= 0 || height <= 0 || width > 32767 || height > 32767)
        return IoResult::failure(QStringLiteral("bmp: invalid dimensions"));
    if (compression != 0 && compression != 3)
        return IoResult::failure(QStringLiteral(
            "bmp: compressed BMP (compression=%1) is not supported by our own decoder")
            .arg(compression));
    if (bpp != 24 && bpp != 32 && bpp != 8)
        return IoResult::failure(QStringLiteral("bmp: %1 bpp is not supported (8/24/32 only)")
                                     .arg(bpp));

    // Channel masks for the BITFIELDS case.
    quint32 maskR = 0x00FF0000, maskG = 0x0000FF00, maskB = 0x000000FF, maskA = 0xFF000000;
    if (compression == 3) {
        if (infoSize >= 56) {
            maskR = u32(54);
            maskG = u32(58);
            maskB = u32(62);
            maskA = u32(66);
        } else if (infoSize >= 52) {
            maskR = u32(54);
            maskG = u32(58);
            maskB = u32(62);
        } else {
            return IoResult::failure(QStringLiteral("bmp: BITFIELDS without mask offsets"));
        }
        if (maskR == 0 || maskG == 0 || maskB == 0)
            return IoResult::failure(QStringLiteral("bmp: zero channel mask"));
    }

    auto shiftFor = [](quint32 mask) -> int {
        if (!mask)
            return 0;
        int s = 0;
        while (!((mask >> s) & 1u) && s < 31)
            ++s;
        return s;
    };
    auto scaleFor = [](quint32 mask) -> double {
        if (!mask)
            return 0.0;
        int bits = 0;
        while (mask & (1u << bits))
            ++bits;
        return bits > 0 ? 255.0 / double((1u << bits) - 1u) : 0.0;
    };
    const int shR = shiftFor(maskR), shG = shiftFor(maskG);
    const int shB = shiftFor(maskB), shA = shiftFor(maskA);
    const double scR = scaleFor(maskR), scG = scaleFor(maskG);
    const double scB = scaleFor(maskB), scA = scaleFor(maskA);

    // Palette for 8-bit.
    QVector<QRgb> palette;
    if (bpp == 8) {
        const quint32 colorsUsed = u32(46);
        const quint32 count = colorsUsed ? colorsUsed : 256;
        const int palAt = 14 + int(infoSize);
        if (palAt + int(count) * 4 > data.size())
            return IoResult::failure(QStringLiteral("bmp: palette exceeds file"));
        palette.reserve(int(count));
        for (quint32 i = 0; i < count; ++i) {
            const int at = palAt + int(i) * 4;
            palette.append(qRgba(p[at + 2], p[at + 1], p[at], 255));
        }
    }

    const int bytesPerPixel = bpp / 8;
    const int stride = ((width * bytesPerPixel + 3) & ~3);
    const qint64 needed = qint64(pixelOffset) + qint64(stride) * height;
    if (qint64(data.size()) < needed)
        return IoResult::failure(
            QStringLiteral("bmp: pixel data truncated (need %1, have %2)")
                .arg(needed).arg(data.size()));

    QImage img(width, height, QImage::Format_ARGB32);
    img.fill(Qt::transparent);

    for (int y = 0; y < height; ++y) {
        const int fileY = topDown ? y : (height - 1 - y);
        const uchar *row = p + pixelOffset + qint64(fileY) * stride;
        QRgb *dst = reinterpret_cast<QRgb *>(img.scanLine(y));

        for (int x = 0; x < width; ++x) {
            if (bpp == 8) {
                const int idx = row[x];
                dst[x] = (idx < palette.size()) ? palette.at(idx) : qRgba(255, 0, 255, 255);
                continue;
            }
            const uchar *px = row + x * bytesPerPixel;
            if (bpp == 24) {
                dst[x] = qRgba(px[2], px[1], px[0], 255);
                continue;
            }
            quint32 v = quint32(px[0]) | (quint32(px[1]) << 8)
                        | (quint32(px[2]) << 16) | (quint32(px[3]) << 24);
            const int r = int(double((v & maskR) >> shR) * scR + 0.5);
            const int g = int(double((v & maskG) >> shG) * scG + 0.5);
            const int b = int(double((v & maskB) >> shB) * scB + 0.5);
            const int a = maskA ? int(double((v & maskA) >> shA) * scA + 0.5) : 255;
            dst[x] = qRgba(qBound(0, r, 255), qBound(0, g, 255),
                           qBound(0, b, 255), qBound(0, a, 255));
        }
    }

    *out = img.convertToFormat(QImage::Format_ARGB32_Premultiplied);
    IoResult r = IoResult::success(data.size());
    r.detail = QStringLiteral("bmp %1bpp %2").arg(bpp)
                   .arg(compression == 3 ? "BITFIELDS" : "BI_RGB");
    return r;
}

IoResult ImageIo::loadBmp(const QString &filePath, QImage *out)
{
    QFile f(filePath);
    if (!f.open(QIODevice::ReadOnly))
        return IoResult::failure(QStringLiteral("cannot open: %1").arg(filePath));
    return decodeBmp(f.readAll(), out);
}

// ===========================================================================
// JPEG - delegated to Qt's plugin layer, with honest failure reporting
// ===========================================================================

IoResult ImageIo::saveJpeg(const QImage &image, const QString &filePath, int quality)
{
    if (!capabilities().jpegWrite)
        return IoResult::failure(
            QStringLiteral("JPEG is not available in this Qt build: no JPEG image "
                           "writer is registered. Install the Qt JPEG plugin, or "
                           "export PNG instead."));
    if (image.isNull())
        return IoResult::failure(QStringLiteral("jpeg: cannot encode a null image"));

    QImageWriter writer(filePath, "jpg");
    writer.setQuality(qBound(1, quality, 100));
    writer.setCompression(qBound(1, quality, 100));
    if (!writer.write(image.convertToFormat(QImage::Format_RGB888))) {
        return IoResult::failure(
            QStringLiteral("jpeg: %1").arg(writer.errorString().isEmpty()
                                               ? QStringLiteral("write failed")
                                               : writer.errorString()));
    }
    IoResult r = IoResult::success(QFileInfo(filePath).size());
    r.detail = QStringLiteral("jpeg q%1 via Qt image plugin").arg(quality);
    return r;
}

IoResult ImageIo::loadJpeg(const QString &filePath, QImage *out)
{
    if (!out)
        return IoResult::failure(QStringLiteral("jpeg: null output image"));
    if (!capabilities().jpegRead)
        return IoResult::failure(
            QStringLiteral("JPEG is not available in this Qt build: no JPEG image "
                           "reader is registered."));
    QImageReader reader(filePath, "jpg");
    reader.setAutoTransform(true);
    QImage img = reader.read();
    if (img.isNull())
        return IoResult::failure(QStringLiteral("jpeg: %1").arg(reader.errorString()));
    *out = img.convertToFormat(QImage::Format_ARGB32_Premultiplied);
    IoResult r = IoResult::success(QFileInfo(filePath).size());
    r.detail = QStringLiteral("jpeg via Qt image plugin");
    return r;
}

IoResult ImageIo::saveJpegToBytes(const QImage &image, QByteArray *out, int quality)
{
    if (!out)
        return IoResult::failure(QStringLiteral("jpeg: null output buffer"));
    out->clear();
    if (!capabilities().jpegWrite)
        return IoResult::failure(
            QStringLiteral("JPEG is not available in this Qt build."));
    QByteArray bytes;
    QBuffer buf(&bytes);
    buf.open(QIODevice::WriteOnly);
    QImageWriter writer(&buf, "jpg");
    writer.setQuality(qBound(1, quality, 100));
    if (!writer.write(image.convertToFormat(QImage::Format_RGB888))) {
        buf.close();
        return IoResult::failure(QStringLiteral("jpeg: %1").arg(writer.errorString()));
    }
    buf.close();
    *out = bytes;
    IoResult r = IoResult::success(bytes.size());
    r.detail = QStringLiteral("jpeg q%1 via Qt image plugin").arg(quality);
    return r;
}

// ===========================================================================
// Generic dispatch
// ===========================================================================

QString ImageIo::sniffFormat(const QByteArray &head) const
{
    if (head.size() >= 8
        && static_cast<uchar>(head[0]) == 0x89 && head[1] == 'P' && head[2] == 'N'
        && head[3] == 'G')
        return QStringLiteral("png");
    if (head.size() >= 2 && head[0] == 'B' && head[1] == 'M')
        return QStringLiteral("bmp");
    if (head.size() >= 3 && static_cast<uchar>(head[0]) == 0xFF
        && static_cast<uchar>(head[1]) == 0xD8 && static_cast<uchar>(head[2]) == 0xFF)
        return QStringLiteral("jpg");
    if (head.size() >= 4 && head.startsWith("qoif"))
        return QStringLiteral("qoi");
    if (head.size() >= 12 && head.startsWith("RIFF")
        && head.mid(8, 4) == "WEBP")
        return QStringLiteral("webp");
    if (head.size() >= 4 && (head.startsWith("%PDF")))
        return QStringLiteral("pdf");
    return QStringLiteral("unknown");
}

QString ImageIo::probeFormat(const QString &filePath) const
{
    QFile f(filePath);
    if (!f.open(QIODevice::ReadOnly))
        return QString();
    const QByteArray head = f.read(16);
    f.close();
    const QString sniffed = sniffFormat(head);
    if (sniffed != QLatin1String("unknown"))
        return sniffed;
    return QFileInfo(filePath).suffix().toLower();
}

IoResult ImageIo::saveImage(const QImage &image, const QString &filePath,
                            const QString &format, int quality)
{
    QString fmt = format.toLower();
    if (fmt.isEmpty())
        fmt = QFileInfo(filePath).suffix().toLower();
    if (fmt == QLatin1String("jpeg"))
        fmt = QStringLiteral("jpg");

    if (fmt == QLatin1String("png")) {
        PngOptions opts;
        opts.compressionLevel = qBound(0, quality, 9);
        return savePng(image, filePath, opts);
    }
    if (fmt == QLatin1String("bmp"))
        return saveBmp(image, filePath, true);
    if (fmt == QLatin1String("jpg"))
        return saveJpeg(image, filePath, quality);
    if (fmt == QLatin1String("qoi")) {
        if (!capabilities().qoiWrite)
            return IoResult::failure(QStringLiteral(
                "QOI is not available in this Qt build: no QOI writer is registered."));
        QImageWriter writer(filePath, "qoi");
        if (!writer.write(image))
            return IoResult::failure(QStringLiteral("qoi: %1").arg(writer.errorString()));
        return IoResult::success(QFileInfo(filePath).size());
    }
    return IoResult::failure(
        QStringLiteral("unsupported export format '%1' (writable: %2)")
            .arg(fmt, writableFormats().join(QLatin1Char(', '))));
}

IoResult ImageIo::loadImage(const QString &filePath, QImage *out)
{
    if (!out)
        return IoResult::failure(QStringLiteral("load: null output image"));
    const QString fmt = probeFormat(filePath);

    if (fmt == QLatin1String("png")) {
        QString warning;
        const IoResult r = loadPng(filePath, out, &warning);
        if (r.ok && !warning.isEmpty()) {
            IoResult w = r;
            w.warning = warning;
            return w;
        }
        return r;
    }
    if (fmt == QLatin1String("bmp"))
        return loadBmp(filePath, out);
    if (fmt == QLatin1String("jpg"))
        return loadJpeg(filePath, out);
    if (fmt == QLatin1String("qoi")) {
        if (!capabilities().qoiRead)
            return IoResult::failure(QStringLiteral(
                "QOI is not available in this Qt build: no QOI reader is registered."));
        QImageReader reader(filePath, "qoi");
        QImage img = reader.read();
        if (img.isNull())
            return IoResult::failure(QStringLiteral("qoi: %1").arg(reader.errorString()));
        *out = img.convertToFormat(QImage::Format_ARGB32_Premultiplied);
        return IoResult::success(QFileInfo(filePath).size());
    }

    // Unknown: let Qt try registered readers as a last resort, then say so.
    QImageReader reader(filePath);
    QImage img = reader.read();
    if (img.isNull())
        return IoResult::failure(
            QStringLiteral("%1 could not be decoded (sniffed as '%2', and no "
                           "registered reader handled it)")
                .arg(filePath, fmt));
    *out = img.convertToFormat(QImage::Format_ARGB32_Premultiplied);
    IoResult r = IoResult::success(QFileInfo(filePath).size());
    r.detail = QStringLiteral("fallback via Qt plugin '%1'")
                   .arg(QString::fromLatin1(reader.format()));
    return r;
}

// ===========================================================================
// Self-check: proves round-tripping without touching the file system
// ===========================================================================

QVariantMap ImageIo::selfTest()
{
    QVariantMap m;
    initCrcTable();

    // CRC known-answer test (the standard "123456789" vector).
    const char check[] = "123456789";
    const quint32 crc = crc32(reinterpret_cast<const uchar *>(check), 9);
    m.insert("crc32VectorOk", crc == 0xCBF43926u);

    // Build an image with an alpha ramp and a colour checker.
    QImage src(64, 48, QImage::Format_ARGB32_Premultiplied);
    for (int y = 0; y < src.height(); ++y) {
        quint32 *row = reinterpret_cast<quint32 *>(src.scanLine(y));
        for (int x = 0; x < src.width(); ++x) {
            const int a = (x * 255) / (src.width() - 1);
            const int r = (y * 255) / (src.height() - 1);
            row[x] = (quint32(a) << 24) | (quint32(r) << 16)
                     | (quint32(x * 4) << 8) | quint32(y * 5);
        }
    }

    // --- PNG round trip -------------------------------------------------------
    QByteArray pngBytes;
    const IoResult enc = encodePng(src, &pngBytes);
    m.insert("pngEncodeOk", enc.ok);
    m.insert("pngEncodeDetail", enc.detail);
    m.insert("pngEncodeWarning", enc.warning);
    m.insert("pngBytes", pngBytes.size());

    QImage pngBack;
    QString pngWarn;
    const IoResult dec = decodePng(pngBytes, &pngBack, &pngWarn);
    m.insert("pngDecodeOk", dec.ok);
    m.insert("pngDecodeError", dec.error);
    if (dec.ok) {
        bool identical = pngBack.size() == src.size();
        qint64 diff = 0;
        if (identical) {
            for (int y = 0; y < src.height(); ++y) {
                const quint32 *a = reinterpret_cast<const quint32 *>(src.constScanLine(y));
                const quint32 *b = reinterpret_cast<const quint32 *>(pngBack.constScanLine(y));
                for (int x = 0; x < src.width(); ++x)
                    if (a[x] != b[x])
                        ++diff;
            }
        }
        m.insert("pngPixelsIdentical", identical && diff == 0);
        m.insert("pngPixelsDiffering", double(diff));
    }

    // --- BMP round trip -------------------------------------------------------
    QByteArray bmpBytes;
    const IoResult benc = encodeBmp(src, &bmpBytes, true);
    m.insert("bmpEncodeOk", benc.ok);
    m.insert("bmpEncodeDetail", benc.detail);
    m.insert("bmpBytes", bmpBytes.size());

    QImage bmpBack;
    const IoResult bdec = decodeBmp(bmpBytes, &bmpBack);
    m.insert("bmpDecodeOk", bdec.ok);
    m.insert("bmpDecodeError", bdec.error);
    if (bdec.ok) {
        bool identical = bmpBack.size() == src.size();
        qint64 diff = 0;
        if (identical) {
            for (int y = 0; y < src.height(); ++y) {
                const quint32 *a = reinterpret_cast<const quint32 *>(src.constScanLine(y));
                const quint32 *b = reinterpret_cast<const quint32 *>(bmpBack.constScanLine(y));
                for (int x = 0; x < src.width(); ++x)
                    if (a[x] != b[x])
                        ++diff;
            }
        }
        m.insert("bmpPixelsIdentical", identical && diff == 0);
        m.insert("bmpPixelsDiffering", double(diff));
    }

    // --- capability report -----------------------------------------------------
    m.insert("capabilities", capabilityMap());
    m.insert("allOk", enc.ok && dec.ok && benc.ok && bdec.ok
                      && m.value("crc32VectorOk").toBool()
                      && m.value("pngPixelsIdentical", false).toBool());
    return m;
}

} // namespace paint
