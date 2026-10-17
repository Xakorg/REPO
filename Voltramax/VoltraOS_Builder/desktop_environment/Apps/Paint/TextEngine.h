#ifndef PAINT_TEXT_ENGINE_H
#define PAINT_TEXT_ENGINE_H

// =============================================================================
//  VOLTRA PAINT - TextEngine
// =============================================================================
//  Real text: QTextLayout for shaping (kerning, ligatures, bidi), a real
//  QFontDatabase lookup for families, real metrics for line boxes and baseline
//  alignment, and a real rasterisation pass onto the layer.
//
//  Text stays vector until it is committed to pixels, so the document keeps
//  the string, the font, the box and the paragraph options - never a bitmap
//  that nobody can edit.
// =============================================================================

#include "PaintTypes.h"

#include <QColor>
#include <QFont>
#include <QImage>
#include <QObject>
#include <QString>
#include <QTextOption>
#include <QVariant>
#include <QVariantList>
#include <QVariantMap>
#include <QVector>

namespace paint {

// ---------------------------------------------------------------------------
// Alignment / wrapping.
// ---------------------------------------------------------------------------
enum TextAlign {
    AlignLeft = 0,
    AlignCenter,
    AlignRight,
    AlignJustify
};

enum VAlign {
    VAlignTop = 0,
    VAlignMiddle,
    VAlignBottom
};

// ---------------------------------------------------------------------------
// One text object in the document.
// ---------------------------------------------------------------------------
struct TextItem {
    quint32 id = 0;
    QString text;
    QRectF box;                 // document space; wrapping happens inside it
    QFont font;
    QColor colour = QColor(16, 18, 24, 255);
    double fontSize = 48.0;
    QString fontFamily = QStringLiteral("Sans Serif");
    int weight = 400;
    bool italic = false;
    bool underline = false;
    bool strikeout = false;
    int align = AlignLeft;
    int valign = VAlignTop;
    double lineHeight = 1.25;
    double letterSpacing = 0.0;   // px
    double wordSpacing = 0.0;     // px
    double skew = 0.0;            // degrees of oblique applied at render
    double rotation = 0.0;        // degrees around the box centre
    int outlineWidth = 0;         // px of stroke around the glyphs
    QColor outlineColour = Qt::black;
    double opacity = 1.0;
    bool autoSize = false;        // box follows the laid-out text
    quint32 layerId = 0;

    QByteArray serialise() const;
    static bool deserialise(const QByteArray &data, TextItem *out, QString *error = nullptr);
    static constexpr quint32 kMagic = 0x56505354u; // "VPST"
};

// ---------------------------------------------------------------------------
// A laid-out line, for the overlay UI.
// ---------------------------------------------------------------------------
struct TextLine {
    QString text;
    QRectF rect;
    qreal baseline = 0.0;
    qreal ascent = 0.0;
    qreal descent = 0.0;
    qreal advance = 0.0;
};

struct TextLayoutResult {
    QVector<TextLine> lines;
    QSizeF size;
    int wrapWidth = 0;
    QString fontFamily;
    QString fontScript;      // features Qt decided to use
    int glyphCount = 0;
    bool truncated = false;
};

class TextEngine : public QObject
{
    Q_OBJECT

    Q_PROPERTY(QString text READ text WRITE setText NOTIFY textChanged)
    Q_PROPERTY(QString fontFamily READ fontFamily WRITE setFontFamily NOTIFY fontChanged)
    Q_PROPERTY(double fontSize READ fontSize WRITE setFontSize NOTIFY fontChanged)
    Q_PROPERTY(int fontWeight READ fontWeight WRITE setFontWeight NOTIFY fontChanged)
    Q_PROPERTY(bool italic READ italic WRITE setItalic NOTIFY fontChanged)
    Q_PROPERTY(bool underline READ underline WRITE setUnderline NOTIFY fontChanged)
    Q_PROPERTY(bool strikeout READ strikeout WRITE setStrikeout NOTIFY fontChanged)
    Q_PROPERTY(int align READ align WRITE setAlign NOTIFY fontChanged)
    Q_PROPERTY(int valign READ valign WRITE setVAlign NOTIFY fontChanged)
    Q_PROPERTY(double lineHeight READ lineHeight WRITE setLineHeight NOTIFY fontChanged)
    Q_PROPERTY(double letterSpacing READ letterSpacing WRITE setLetterSpacing NOTIFY fontChanged)
    Q_PROPERTY(double wordSpacing READ wordSpacing WRITE setWordSpacing NOTIFY fontChanged)
    Q_PROPERTY(QColor colour READ colour WRITE setColour NOTIFY colourChanged)
    Q_PROPERTY(QColor outlineColour READ outlineColour WRITE setOutlineColour NOTIFY colourChanged)
    Q_PROPERTY(double outlineWidth READ outlineWidth WRITE setOutlineWidth NOTIFY colourChanged)
    Q_PROPERTY(double opacity READ opacity WRITE setOpacity NOTIFY colourChanged)
    Q_PROPERTY(double boxWidth READ boxWidth WRITE setBoxWidth NOTIFY boxChanged)
    Q_PROPERTY(double boxHeight READ boxHeight WRITE setBoxHeight NOTIFY boxChanged)
    Q_PROPERTY(bool autoSize READ autoSize WRITE setAutoSize NOTIFY boxChanged)
    Q_PROPERTY(QStringList families READ families CONSTANT)
    Q_PROPERTY(QStringList commonFamilies READ commonFamilies CONSTANT)
    Q_PROPERTY(bool enginesReady READ enginesReady NOTIFY layoutChanged)
    Q_PROPERTY(QVariantList weights READ weights CONSTANT)

public:
    explicit TextEngine(QObject *parent = nullptr);
    ~TextEngine() override;

    // ---- content ----------------------------------------------------------
    QString text() const { return m_text; }
    void setText(const QString &t);
    QString fontFamily() const { return m_family; }
    void setFontFamily(const QString &f);
    double fontSize() const { return m_size; }
    void setFontSize(double v);
    int fontWeight() const { return m_weight; }
    void setFontWeight(int v);
    bool italic() const { return m_italic; }
    void setItalic(bool v);
    bool underline() const { return m_underline; }
    void setUnderline(bool v);
    bool strikeout() const { return m_strikeout; }
    void setStrikeout(bool v);
    int align() const { return m_align; }
    void setAlign(int v);
    int valign() const { return m_valign; }
    void setVAlign(int v);
    double lineHeight() const { return m_lineHeight; }
    void setLineHeight(double v);
    double letterSpacing() const { return m_spacing; }
    void setLetterSpacing(double v);
    double wordSpacing() const { return m_wordSpacing; }
    void setWordSpacing(double v);
    QColor colour() const { return m_colour; }
    void setColour(const QColor &c);
    QColor outlineColour() const { return m_outlineColour; }
    void setOutlineColour(const QColor &c);
    double outlineWidth() const { return m_outlineWidth; }
    void setOutlineWidth(double v);
    double opacity() const { return m_opacity; }
    void setOpacity(double v);
    double boxWidth() const { return m_boxWidth; }
    void setBoxWidth(double v);
    double boxHeight() const { return m_boxHeight; }
    void setBoxHeight(double v);
    bool autoSize() const { return m_autoSize; }
    void setAutoSize(bool v);

    QStringList families() const;
    QStringList commonFamilies() const;
    QVariantList weights() const;
    bool enginesReady() const { return m_enginesReady; }

    // ---- font handling ------------------------------------------------------
    QFont buildFont() const;
    Q_INVOKABLE QFont fontFor(const QString &family, double size, int weight, bool italic) const;
    Q_INVOKABLE bool familyExists(const QString &family) const;
    Q_INVOKABLE QVariantMap fontMetricsFor(double size) const;

    // ---- layout --------------------------------------------------------------
    TextLayoutResult layout(const QString &text, const QRectF &box, const QFont &font,
                            int align, double lineHeight, double letterSpacing,
                            double wordSpacing) const;
    // Convenience: lays out the current settings.
    Q_INVOKABLE QVariantList layoutLines(double width) const;
    Q_INVOKABLE double measureWidth(const QString &sample) const;
    QSizeF naturalSize(const QString &text) const;

    // ---- building items ---------------------------------------------------------
    TextItem toItem(quint32 id, const QRectF &box, quint32 layerId) const;
    // Renders an item into a raster; returns the document rect touched.
    QRectF render(QImage &target, const TextItem &item, int resolution = 1) const;
    // Renders into its own image (used for previews and for the overlay).
    QImage renderToImage(const TextItem &item, const QSize &size) const;
    // Interactive caret geometry for the canvas overlay.
    struct Caret {
        QPointF pos;
        double height = 0.0;
        int lineIndex = 0;
        int column = 0;
        bool visible = false;
    };
    Caret caretAt(const TextItem &item, const QPointF &docPos) const;
    QRectF boundsFor(const TextItem &item) const;

    // ---- documents -------------------------------------------------------------
    Q_INVOKABLE QVariantMap toVariantMap(const TextItem &item) const;
    Q_INVOKABLE TextItem fromVariantMap(const QVariantMap &map) const;

signals:
    void textChanged();
    void fontChanged();
    void colourChanged();
    void boxChanged();
    void layoutChanged();

private:
    QString m_text;
    QString m_family = QStringLiteral("Sans Serif");
    double m_size = 48.0;
    int m_weight = 400;
    bool m_italic = false;
    bool m_underline = false;
    bool m_strikeout = false;
    int m_align = AlignLeft;
    int m_valign = VAlignTop;
    double m_lineHeight = 1.25;
    double m_spacing = 0.0;
    double m_wordSpacing = 0.0;
    QColor m_colour = QColor(16, 18, 24, 255);
    QColor m_outlineColour = Qt::black;
    double m_outlineWidth = 0.0;
    double m_opacity = 1.0;
    double m_boxWidth = 640.0;
    double m_boxHeight = 320.0;
    bool m_autoSize = false;
    bool m_enginesReady = false;
};

} // namespace paint

Q_DECLARE_METATYPE(paint::TextItem)

#endif // PAINT_TEXT_ENGINE_H
