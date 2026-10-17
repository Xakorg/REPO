#include "TextEngine.h"

#include <QFontDatabase>
#include <QFontMetricsF>
#include <QImage>
#include <QPainter>
#include <QPainterPath>
#include <QDataStream>
#include <QJsonArray>
#include <QJsonDocument>
#include <QJsonObject>
#include <QTextLayout>
#include <QTextLine>

#include <cmath>

namespace paint {

// ===========================================================================
// TextItem serialisation
// ===========================================================================

QByteArray TextItem::serialise() const
{
    QJsonObject o;
    o["id"] = double(id);
    o["text"] = text;
    o["box"] = QJsonArray{ box.x(), box.y(), box.width(), box.height() };
    o["family"] = fontFamily;
    o["size"] = fontSize;
    o["weight"] = weight;
    o["italic"] = italic;
    o["underline"] = underline;
    o["strikeout"] = strikeout;
    o["align"] = align;
    o["valign"] = valign;
    o["lineHeight"] = lineHeight;
    o["letterSpacing"] = letterSpacing;
    o["wordSpacing"] = wordSpacing;
    o["skew"] = skew;
    o["rotation"] = rotation;
    o["outlineWidth"] = outlineWidth;
    o["colour"] = colour.name(QColor::HexArgb);
    o["outlineColour"] = outlineColour.name(QColor::HexArgb);
    o["opacity"] = opacity;
    o["autoSize"] = autoSize;
    o["layerId"] = double(layerId);

    const QByteArray payload = QJsonDocument(o).toJson(QJsonDocument::Compact);
    QByteArray out;
    QDataStream s(&out, QIODevice::WriteOnly);
    s.setByteOrder(QDataStream::LittleEndian);
    s << kMagic << quint16(1) << quint32(payload.size());
    s.writeRawData(payload.constData(), payload.size());
    return out;
}

bool TextItem::deserialise(const QByteArray &data, TextItem *out, QString *error)
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
        if (error) *error = QStringLiteral("bad text record");
        return false;
    }
    const QByteArray payload = s.read(int(len));
    if (quint32(payload.size()) != len) {
        if (error) *error = QStringLiteral("truncated text payload");
        return false;
    }
    const QJsonObject o = QJsonDocument::fromJson(payload).object();

    out->id = quint32(o.value("id").toDouble());
    out->text = o.value("text").toString();
    const QJsonArray b = o.value("box").toArray();
    if (b.size() == 4)
        out->box = QRectF(b.at(0).toDouble(), b.at(1).toDouble(),
                          b.at(2).toDouble(), b.at(3).toDouble());
    out->fontFamily = o.value("family").toString(QStringLiteral("Sans Serif"));
    out->fontSize = o.value("size").toDouble(48.0);
    out->weight = o.value("weight").toInt(400);
    out->italic = o.value("italic").toBool(false);
    out->underline = o.value("underline").toBool(false);
    out->strikeout = o.value("strikeout").toBool(false);
    out->align = o.value("align").toInt(AlignLeft);
    out->valign = o.value("valign").toInt(VAlignTop);
    out->lineHeight = o.value("lineHeight").toDouble(1.25);
    out->letterSpacing = o.value("letterSpacing").toDouble(0.0);
    out->wordSpacing = o.value("wordSpacing").toDouble(0.0);
    out->skew = o.value("skew").toDouble(0.0);
    out->rotation = o.value("rotation").toDouble(0.0);
    out->outlineWidth = o.value("outlineWidth").toDouble(0.0);
    out->colour = QColor(o.value("colour").toString(QStringLiteral("#101218ff")));
    out->outlineColour = QColor(o.value("outlineColour").toString(QStringLiteral("#000000ff")));
    out->opacity = o.value("opacity").toDouble(1.0);
    out->autoSize = o.value("autoSize").toBool(false);
    out->layerId = quint32(o.value("layerId").toDouble());
    return true;
}

// ===========================================================================
// Construction / properties
// ===========================================================================

TextEngine::TextEngine(QObject *parent)
    : QObject(parent)
{
    // QFontDatabase must not be used from a static initializer; doing it here
    // is both correct and what tells us whether font resolution works at all.
    const QStringList all = QFontDatabase().families();
    m_enginesReady = !all.isEmpty();
}

TextEngine::~TextEngine() = default;

void TextEngine::setText(const QString &t)
{
    if (m_text == t)
        return;
    m_text = t;
    emit textChanged();
    emit layoutChanged();
}

void TextEngine::setFontFamily(const QString &f)
{
    if (m_family == f)
        return;
    m_family = f;
    emit fontChanged();
    emit layoutChanged();
}

void TextEngine::setFontSize(double v)
{
    const double nv = clampd(v, 1.0, 800.0);
    if (qFuzzyCompare(m_size, nv))
        return;
    m_size = nv;
    emit fontChanged();
    emit layoutChanged();
}

void TextEngine::setFontWeight(int v)
{
    const int nv = qBound(1, v, 1000);
    if (m_weight == nv)
        return;
    m_weight = nv;
    emit fontChanged();
    emit layoutChanged();
}

void TextEngine::setItalic(bool v)
{
    if (m_italic == v) return;
    m_italic = v;
    emit fontChanged();
    emit layoutChanged();
}
void TextEngine::setUnderline(bool v)
{
    if (m_underline == v) return;
    m_underline = v;
    emit fontChanged();
    emit layoutChanged();
}
void TextEngine::setStrikeout(bool v)
{
    if (m_strikeout == v) return;
    m_strikeout = v;
    emit fontChanged();
    emit layoutChanged();
}
void TextEngine::setAlign(int v)
{
    const int nv = qBound(0, v, 3);
    if (m_align == nv) return;
    m_align = nv;
    emit fontChanged();
    emit layoutChanged();
}
void TextEngine::setVAlign(int v)
{
    const int nv = qBound(0, v, 2);
    if (m_valign == nv) return;
    m_valign = nv;
    emit fontChanged();
    emit layoutChanged();
}
void TextEngine::setLineHeight(double v)
{
    const double nv = clampd(v, 0.5, 4.0);
    if (qFuzzyCompare(m_lineHeight, nv)) return;
    m_lineHeight = nv;
    emit fontChanged();
    emit layoutChanged();
}
void TextEngine::setLetterSpacing(double v)
{
    const double nv = clampd(v, -50.0, 200.0);
    if (qFuzzyCompare(m_spacing, nv)) return;
    m_spacing = nv;
    emit fontChanged();
    emit layoutChanged();
}
void TextEngine::setWordSpacing(double v)
{
    const double nv = clampd(v, -100.0, 200.0);
    if (qFuzzyCompare(m_wordSpacing, nv)) return;
    m_wordSpacing = nv;
    emit fontChanged();
    emit layoutChanged();
}
void TextEngine::setColour(const QColor &c)
{
    if (m_colour == c) return;
    m_colour = c;
    emit colourChanged();
}
void TextEngine::setOutlineColour(const QColor &c)
{
    if (m_outlineColour == c) return;
    m_outlineColour = c;
    emit colourChanged();
}
void TextEngine::setOutlineWidth(double v)
{
    const double nv = clampd(v, 0.0, 40.0);
    if (qFuzzyCompare(m_outlineWidth, nv)) return;
    m_outlineWidth = nv;
    emit colourChanged();
}
void TextEngine::setOpacity(double v)
{
    const double nv = clampd(v, 0.0, 1.0);
    if (qFuzzyCompare(m_opacity, nv)) return;
    m_opacity = nv;
    emit colourChanged();
}
void TextEngine::setBoxWidth(double v)
{
    const double nv = clampd(v, 8.0, 20000.0);
    if (qFuzzyCompare(m_boxWidth, nv)) return;
    m_boxWidth = nv;
    emit boxChanged();
    emit layoutChanged();
}
void TextEngine::setBoxHeight(double v)
{
    const double nv = clampd(v, 8.0, 20000.0);
    if (qFuzzyCompare(m_boxHeight, nv)) return;
    m_boxHeight = nv;
    emit boxChanged();
}
void TextEngine::setAutoSize(bool v)
{
    if (m_autoSize == v) return;
    m_autoSize = v;
    emit boxChanged();
}

// ===========================================================================
// Fonts
// ===========================================================================

QStringList TextEngine::families() const
{
    const QStringList all = QFontDatabase().families();
    QStringList out;
    out.reserve(all.size());
    for (const QString &f : all)
        out.append(f);
    return out;
}

QStringList TextEngine::commonFamilies() const
{
    static const QStringList preferred = {
        QStringLiteral("Sans Serif"), QStringLiteral("Arial"), QStringLiteral("Helvetica"),
        QStringLiteral("Times New Roman"), QStringLiteral("Courier New"),
        QStringLiteral("Georgia"), QStringLiteral("Verdana"), QStringLiteral("Trebuchet MS"),
        QStringLiteral("Palatino Linotype"), QStringLiteral("Impact"),
        QStringLiteral("Comic Sans MS"), QStringLiteral("Segoe UI"),
        QStringLiteral("Roboto"), QStringLiteral("Inter"), QStringLiteral("Noto Sans"),
        QStringLiteral("DejaVu Sans"), QStringLiteral("Liberation Sans"),
        QStringLiteral("Ubuntu"), QStringLiteral("Cantarell"), QStringLiteral("FreeSans")
    };
    const QStringList all = QFontDatabase().families();
    QStringList out;
    for (const QString &f : preferred)
        if (all.contains(f, Qt::CaseInsensitive))
            out.append(f);
    // Append anything else not already listed, up to a sane UI limit.
    for (const QString &f : all) {
        if (out.contains(f, Qt::CaseInsensitive))
            continue;
        if (out.size() > 60)
            break;
        out.append(f);
    }
    if (out.isEmpty())
        out.append(QStringLiteral("Sans Serif"));
    return out;
}

QVariantList TextEngine::weights() const
{
    QVariantList out;
    struct W { int v; const char *n; };
    const W list[] = {
        { 100, "Thin" }, { 200, "Extra Light" }, { 300, "Light" }, { 400, "Regular" },
        { 500, "Medium" }, { 600, "Semi Bold" }, { 700, "Bold" }, { 800, "Extra Bold" },
        { 900, "Black" }
    };
    for (const W &w : list) {
        QVariantMap m;
        m.insert("value", w.v);
        m.insert("name", QString::fromLatin1(w.n));
        out.append(m);
    }
    return out;
}

QFont TextEngine::buildFont() const
{
    QFont f(m_family);
    f.setPixelSize(int(std::lround(m_size)));
    f.setWeight(QFont::Weight(m_weight));
    f.setItalic(m_italic);
    f.setUnderline(m_underline);
    f.setStrikeOut(m_strikeout);
    f.setLetterSpacing(QFont::AbsoluteSpacing, m_spacing);
    f.setWordSpacing(m_wordSpacing);
    f.setKerning(true);
    return f;
}

QFont TextEngine::fontFor(const QString &family, double size, int weight, bool italic) const
{
    QFont f(family);
    f.setPixelSize(qMax(1, int(std::lround(size))));
    f.setWeight(QFont::Weight(qBound(1, weight, 1000)));
    f.setItalic(italic);
    f.setKerning(true);
    return f;
}

bool TextEngine::familyExists(const QString &family) const
{
    if (family.isEmpty())
        return false;
    const QStringList all = QFontDatabase().families();
    for (const QString &f : all)
        if (f.compare(family, Qt::CaseInsensitive) == 0)
            return true;
    return false;
}

QVariantMap TextEngine::fontMetricsFor(double size) const
{
    QFont f = buildFont();
    f.setPixelSize(qMax(1, int(std::lround(size))));
    const QFontMetricsF fm(f);
    QVariantMap m;
    m.insert("ascent", fm.ascent());
    m.insert("descent", fm.descent());
    m.insert("height", fm.height());
    m.insert("lineSpacing", fm.lineSpacing());
    m.insert("xHeight", fm.xHeight());
    m.insert("capHeight", fm.capHeight());
    m.insert("averageCharWidth", fm.averageCharWidth());
    m.insert("maxCharWidth", fm.maxWidth());
    return m;
}

// ===========================================================================
// Layout
// ===========================================================================

TextLayoutResult TextEngine::layout(const QString &text, const QRectF &box, const QFont &font,
                                    int align, double lineHeight, double letterSpacing,
                                    double wordSpacing) const
{
    TextLayoutResult result;
    result.wrapWidth = int(std::lround(box.width()));

    if (text.isEmpty())
        return result;

    const QFontMetricsF fm(font);
    const double lineH = qMax(fm.height(), lineHeight * double(fm.height()));

    QTextOption opt;
    opt.setWrapMode(QTextOption::WrapAtWordBoundaryOrAnywhere);
    opt.setTabStopDistance(font.pixelSize() * 4.0);
    switch (align) {
    case AlignCenter: opt.setAlignment(Qt::AlignHCenter); break;
    case AlignRight: opt.setAlignment(Qt::AlignRight); break;
    case AlignJustify: opt.setAlignment(Qt::AlignJustify); break;
    default: opt.setAlignment(Qt::AlignLeft); break;
    }

    // Split on explicit newlines first so hard breaks are always honoured.
    const QStringList paragraphs = text.split('\n');
    double y = box.top();
    double maxWidth = 0.0;

    for (const QString &para : paragraphs) {
        QTextLayout tl(para, font);
        tl.setTextOption(opt);
        tl.beginLayout();

        while (true) {
            QTextLine line = tl.createLine();
            if (!line.isValid())
                break;
            if (box.width() > 1.0)
                line.setLineWidth(box.width());
            else
                line.setLineWidth(4000.0);

            const QString lineText = para.mid(line.textStart(), line.textLength());
            line.setPosition(QPointF(0.0, y));

            TextLine info;
            info.text = lineText;
            info.advance = line.naturalTextWidth();
            info.ascent = fm.ascent();
            info.descent = fm.descent();
            info.baseline = y + fm.ascent();
            maxWidth = qMax(maxWidth, info.advance);

            const double h = qMax(line.height(), lineH);
            info.rect = QRectF(box.left(), y, info.advance, h);
            result.lines.append(info);

            y += h;
            if (!box.height().isNull() && (y - box.top()) > box.height() + h) {
                result.truncated = true;
                break;
            }
            if (lineText.isEmpty())
                break;
        }
        tl.endLayout();
        y += 0.0;
    }

    result.size = QSizeF(qMin(maxWidth, box.width()), y - box.top());
    result.fontFamily = font.family();
    for (const TextLine &l : result.lines)
        result.glyphCount += l.text.size();
    return result;
}

QVariantList TextEngine::layoutLines(double width) const
{
    const QRectF box(0.0, 0.0, width > 0.0 ? width : m_boxWidth, m_boxHeight);
    const TextLayoutResult r = layout(m_text, box, buildFont(), m_align, m_lineHeight,
                                      m_spacing, m_wordSpacing);
    QVariantList out;
    for (const TextLine &l : r.lines) {
        QVariantMap m;
        m.insert("text", l.text);
        m.insert("x", l.rect.x());
        m.insert("y", l.rect.y());
        m.insert("width", l.rect.width());
        m.insert("height", l.rect.height());
        m.insert("baseline", l.baseline);
        m.insert("advance", l.advance);
        out.append(m);
    }
    return out;
}

double TextEngine::measureWidth(const QString &sample) const
{
    const QFontMetricsF fm(buildFont());
    return fm.horizontalAdvance(sample);
}

QSizeF TextEngine::naturalSize(const QString &text) const
{
    const QFont font = buildFont();
    const QFontMetricsF fm(font);
    double maxW = 0.0;
    double y = 0.0;
    for (const QString &para : text.split('\n')) {
        double paraW = fm.horizontalAdvance(para);
        // Word wrap against an effectively infinite box: the paragraph is a
        // single line unless it contains spaces, in which case QTextLayout
        // with an infinite width still returns one line.
        maxW = qMax(maxW, paraW);
        y += fm.height() * m_lineHeight;
    }
    if (text.isEmpty())
        y = fm.height();
    return QSizeF(maxW, y);
}

// ===========================================================================
// Items
// ===========================================================================

TextItem TextEngine::toItem(quint32 id, const QRectF &box, quint32 layerId) const
{
    TextItem it;
    it.id = id;
    it.text = m_text;
    it.box = box;
    it.fontFamily = m_family;
    it.fontSize = m_size;
    it.weight = m_weight;
    it.italic = m_italic;
    it.underline = m_underline;
    it.strikeout = m_strikeout;
    it.align = m_align;
    it.valign = m_valign;
    it.lineHeight = m_lineHeight;
    it.letterSpacing = m_spacing;
    it.wordSpacing = m_wordSpacing;
    it.colour = m_colour;
    it.outlineWidth = m_outlineWidth;
    it.outlineColour = m_outlineColour;
    it.opacity = m_opacity;
    it.autoSize = m_autoSize;
    it.layerId = layerId;
    return it;
}

QRectF TextEngine::boundsFor(const TextItem &item) const
{
    const QFont font = fontFor(item.fontFamily, item.fontSize, item.weight, item.italic);
    const TextLayoutResult r = layout(item.text, item.box, font, item.align, item.lineHeight,
                                      item.letterSpacing, item.wordSpacing);
    QRectF b = item.box;
    if (item.autoSize) {
        b.setWidth(qMax(4.0, r.size.width()));
        b.setHeight(qMax(4.0, r.size.height()));
    }
    if (item.outlineWidth > 0.0)
        b.adjust(-item.outlineWidth, -item.outlineWidth, item.outlineWidth, item.outlineWidth);
    if (item.rotation != 0.0) {
        QTransform t;
        t.translate(item.box.center().x(), item.box.center().y());
        t.rotate(item.rotation);
        t.translate(-item.box.center().x(), -item.box.center().y());
        return t.mapRect(b);
    }
    return b;
}

QRectF TextEngine::render(QImage &target, const TextItem &item, int resolution) const
{
    if (target.isNull() || item.text.isEmpty())
        return QRectF();

    const int scale = qBound(1, resolution, 8);
    const QFont font = fontFor(item.fontFamily, item.fontSize, item.weight, item.italic);

    QRectF layoutBox = item.box;
    if (scale > 1) {
        layoutBox = QRectF(item.box.x() * scale, item.box.y() * scale,
                           item.box.width() * scale, item.box.height() * scale);
    }

    const TextLayoutResult r = layout(item.text, layoutBox, font, item.align, item.lineHeight,
                                      item.letterSpacing * scale, item.wordSpacing * scale);

    QPainter p(&target);
    p.setRenderHint(QPainter::TextAntialiasing, true);
    p.setRenderHint(QPainter::Antialiasing, true);
    p.setOpacity(clampd(item.opacity, 0.0, 1.0));

    if (item.rotation != 0.0) {
        p.translate(layoutBox.center());
        p.rotate(item.rotation);
        p.translate(-layoutBox.center());
    }

    // Vertical alignment offset from the natural height.
    double dy = 0.0;
    const double naturalH = r.size.height();
    if (item.valign == VAlignMiddle)
        dy = (layoutBox.height() - naturalH) * 0.5;
    else if (item.valign == VAlignBottom)
        dy = layoutBox.height() - naturalH;

    QPen pen(item.outlineColour, item.outlineWidth * scale, Qt::SolidLine,
             Qt::RoundCap, Qt::RoundJoin);
    for (const TextLine &line : r.lines) {
        double x = layoutBox.left();
        if (item.align == AlignCenter)
            x = layoutBox.left() + (layoutBox.width() - line.advance) * 0.5;
        else if (item.align == AlignRight)
            x = layoutBox.left() + layoutBox.width() - line.advance;

        const QPointF pos(x, layoutBox.top() + line.rect.y() + dy + line.ascent);
        p.setPen(QPen(item.colour));
        p.setFont(font);

        if (item.outlineWidth > 0.0) {
            QPainterPath path;
            path.addText(pos, font, line.text);
            p.setPen(pen);
            p.setBrush(item.colour);
            p.drawPath(path);
            p.setPen(QPen(item.colour));
        }
        p.setBrush(Qt::NoBrush);
        p.drawText(pos, line.text);
    }

    p.end();

    QRectF touched = boundsFor(item);
    if (scale > 1) {
        touched = QRectF(touched.x() / scale, touched.y() / scale,
                         touched.width() / scale, touched.height() / scale);
    }
    return touched;
}

QImage TextEngine::renderToImage(const TextItem &item, const QSize &size) const
{
    QSize s = size;
    if (s.isEmpty()) {
        const QRectF b = boundsFor(item);
        s = QSize(qMax(1, int(std::ceil(b.width())) + 4),
                  qMax(1, int(std::ceil(b.height())) + 4));
    }
    QImage img(s, QImage::Format_ARGB32_Premultiplied);
    img.fill(Qt::transparent);
    render(img, item, 1);
    return img;
}

TextEngine::Caret TextEngine::caretAt(const TextItem &item, const QPointF &docPos) const
{
    Caret c;
    const QFont font = fontFor(item.fontFamily, item.fontSize, item.weight, item.italic);
    const TextLayoutResult r = layout(item.text, item.box, font, item.align, item.lineHeight,
                                      item.letterSpacing, item.wordSpacing);
    if (r.lines.isEmpty())
        return c;

    const QFontMetricsF fm(font);
    // Nearest line by baseline distance.
    int best = 0;
    double bestD = 1e18;
    for (int i = 0; i < r.lines.size(); ++i) {
        const double d = std::fabs(r.lines.at(i).baseline - docPos.y());
        if (d < bestD) { bestD = d; best = i; }
    }

    const TextLine &line = r.lines.at(best);
    double x = item.box.left();
    if (item.align == AlignCenter)
        x = item.box.left() + (item.box.width() - line.advance) * 0.5;
    else if (item.align == AlignRight)
        x = item.box.left() + item.box.width() - line.advance;

    // Walk characters to find the column whose midpoint the click crossed.
    int col = line.text.size();
    double caretX = x + line.advance;
    for (int i = 0; i < line.text.size(); ++i) {
        const double w = fm.horizontalAdvance(line.text.left(i + 1));
        const double mid = x + w;
        if (docPos.x() < mid) {
            col = i;
            caretX = x + fm.horizontalAdvance(line.text.left(i));
            break;
        }
    }

    c.pos = QPointF(caretX, line.baseline - fm.ascent());
    c.height = fm.height();
    c.lineIndex = best;
    c.column = col;
    c.visible = true;
    return c;
}

// ===========================================================================
// Document mapping
// ===========================================================================

QVariantMap TextEngine::toVariantMap(const TextItem &item) const
{
    QVariantMap m;
    m.insert("id", double(item.id));
    m.insert("text", item.text);
    m.insert("box", QVariantList{ item.box.x(), item.box.y(), item.box.width(), item.box.height() });
    m.insert("family", item.fontFamily);
    m.insert("size", item.fontSize);
    m.insert("weight", item.weight);
    m.insert("italic", item.italic);
    m.insert("underline", item.underline);
    m.insert("strikeout", item.strikeout);
    m.insert("align", item.align);
    m.insert("valign", item.valign);
    m.insert("lineHeight", item.lineHeight);
    m.insert("letterSpacing", item.letterSpacing);
    m.insert("wordSpacing", item.wordSpacing);
    m.insert("rotation", item.rotation);
    m.insert("outlineWidth", item.outlineWidth);
    m.insert("colour", item.colour.name(QColor::HexArgb));
    m.insert("outlineColour", item.outlineColour.name(QColor::HexArgb));
    m.insert("opacity", item.opacity);
    m.insert("autoSize", item.autoSize);
    m.insert("layerId", double(item.layerId));
    return m;
}

TextItem TextEngine::fromVariantMap(const QVariantMap &map) const
{
    TextItem it;
    it.id = quint32(map.value("id").toDouble());
    it.text = map.value("text").toString();
    const QVariantList b = map.value("box").toList();
    if (b.size() == 4)
        it.box = QRectF(b.at(0).toDouble(), b.at(1).toDouble(), b.at(2).toDouble(),
                        b.at(3).toDouble());
    it.fontFamily = map.value("family").toString(QStringLiteral("Sans Serif"));
    it.fontSize = map.value("size").toDouble(48.0);
    it.weight = map.value("weight").toInt(400);
    it.italic = map.value("italic").toBool();
    it.underline = map.value("underline").toBool();
    it.strikeout = map.value("strikeout").toBool();
    it.align = map.value("align").toInt(AlignLeft);
    it.valign = map.value("valign").toInt(VAlignTop);
    it.lineHeight = map.value("lineHeight").toDouble(1.25);
    it.letterSpacing = map.value("letterSpacing").toDouble(0.0);
    it.wordSpacing = map.value("wordSpacing").toDouble(0.0);
    it.rotation = map.value("rotation").toDouble(0.0);
    it.outlineWidth = map.value("outlineWidth").toDouble(0.0);
    it.colour = QColor(map.value("colour").toString(QStringLiteral("#101218ff")));
    it.outlineColour = QColor(map.value("outlineColour").toString(QStringLiteral("#000000ff")));
    it.opacity = map.value("opacity").toDouble(1.0);
    it.autoSize = map.value("autoSize").toBool();
    it.layerId = quint32(map.value("layerId").toDouble());
    return it;
}

} // namespace paint
