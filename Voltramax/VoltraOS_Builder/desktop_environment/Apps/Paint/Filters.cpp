#include "Filters.h"
#include "Rasterizer.h"

#include <QElapsedTimer>
#include <QPainter>
#include <QVariantMap>

#include <algorithm>
#include <cmath>
#include <cstring>
#include <functional>
#include <random>

namespace paint {

// ===========================================================================
// FilterParams serialisation
// ===========================================================================

QVariantMap FilterParams::toMap() const
{
    QVariantMap m;
    m.insert("exposure", exposure);
    m.insert("brightness", brightness);
    m.insert("contrast", contrast);
    m.insert("gamma", gamma);
    m.insert("blackPoint", blackPoint);
    m.insert("whitePoint", whitePoint);
    m.insert("outputBlack", outputBlack);
    m.insert("outputWhite", outputWhite);
    m.insert("hue", hue);
    m.insert("saturation", saturation);
    m.insert("lightness", lightness);
    m.insert("colourise", colourise.name(QColor::HexArgb));
    m.insert("colouriseStrength", colouriseStrength);
    m.insert("channelMixR", QVariantList{ channelMixR.x(), channelMixR.y(), channelMixR.z() });
    m.insert("channelMixG", QVariantList{ channelMixG.x(), channelMixG.y(), channelMixG.z() });
    m.insert("channelMixB", QVariantList{ channelMixB.x(), channelMixB.y(), channelMixB.z() });
    m.insert("preserveLuminosity", preserveLuminosity);
    m.insert("radius", radius);
    m.insert("sigma", sigma);
    m.insert("boxRadius", boxRadius);
    m.insert("angle", angle);
    m.insert("radialStrength", radialStrength);
    m.insert("sharpenAmount", sharpenAmount);
    m.insert("sharpenRadius", sharpenRadius);
    m.insert("rankRadius", rankRadius);
    m.insert("noiseAmount", noiseAmount);
    m.insert("noiseKind", noiseKind);
    m.insert("seed", double(seed));
    m.insert("dustAmount", dustAmount);
    m.insert("levels", levels);
    m.insert("thresholdValue", thresholdValue);
    m.insert("thresholdSmooth", thresholdSmooth);
    m.insert("vignetteAmount", vignetteAmount);
    m.insert("vignetteFeather", vignetteFeather);
    m.insert("chromaOffset", chromaOffset);
    m.insert("distortionK1", distortionK1);
    m.insert("distortionK2", distortionK2);
    m.insert("pixelateSize", pixelateSize);
    m.insert("rotationDegrees", rotationDegrees);
    m.insert("flipHorizontal", flipHorizontal);
    m.insert("flipVertical", flipVertical);
    return m;
}

FilterParams FilterParams::fromMap(const QVariantMap &m)
{
    FilterParams p;
    p.exposure = m.value("exposure", p.exposure).toDouble();
    p.brightness = m.value("brightness", p.brightness).toDouble();
    p.contrast = m.value("contrast", p.contrast).toDouble();
    p.gamma = m.value("gamma", p.gamma).toDouble();
    p.blackPoint = m.value("blackPoint", p.blackPoint).toInt();
    p.whitePoint = m.value("whitePoint", p.whitePoint).toInt();
    p.outputBlack = m.value("outputBlack", p.outputBlack).toInt();
    p.outputWhite = m.value("outputWhite", p.outputWhite).toInt();
    p.hue = m.value("hue", p.hue).toDouble();
    p.saturation = m.value("saturation", p.saturation).toDouble();
    p.lightness = m.value("lightness", p.lightness).toDouble();
    p.colourise = QColor(m.value("colourise", "#808080ff").toString());
    p.colouriseStrength = m.value("colouriseStrength", p.colouriseStrength).toDouble();
    const QVariantList cr = m.value("channelMixR").toList();
    if (cr.size() == 3)
        p.channelMixR = QVector3D(cr.at(0).toFloat(), cr.at(1).toFloat(), cr.at(2).toFloat());
    const QVariantList cg = m.value("channelMixG").toList();
    if (cg.size() == 3)
        p.channelMixG = QVector3D(cg.at(0).toFloat(), cg.at(1).toFloat(), cg.at(2).toFloat());
    const QVariantList cb = m.value("channelMixB").toList();
    if (cb.size() == 3)
        p.channelMixB = QVector3D(cb.at(0).toFloat(), cb.at(1).toFloat(), cb.at(2).toFloat());
    p.preserveLuminosity = m.value("preserveLuminosity", p.preserveLuminosity).toBool();
    p.radius = m.value("radius", p.radius).toDouble();
    p.sigma = m.value("sigma", p.sigma).toDouble();
    p.boxRadius = m.value("boxRadius", p.boxRadius).toInt();
    p.angle = m.value("angle", p.angle).toDouble();
    p.radialStrength = m.value("radialStrength", p.radialStrength).toDouble();
    p.sharpenAmount = m.value("sharpenAmount", p.sharpenAmount).toDouble();
    p.sharpenRadius = m.value("sharpenRadius", p.sharpenRadius).toInt();
    p.rankRadius = m.value("rankRadius", p.rankRadius).toInt();
    p.noiseAmount = m.value("noiseAmount", p.noiseAmount).toDouble();
    p.noiseKind = m.value("noiseKind", p.noiseKind).toInt();
    p.seed = quint64(m.value("seed", double(p.seed)).toDouble());
    p.dustAmount = m.value("dustAmount", p.dustAmount).toDouble();
    p.levels = m.value("levels", p.levels).toInt();
    p.thresholdValue = m.value("thresholdValue", p.thresholdValue).toInt();
    p.thresholdSmooth = m.value("thresholdSmooth", p.thresholdSmooth).toBool();
    p.vignetteAmount = m.value("vignetteAmount", p.vignetteAmount).toDouble();
    p.vignetteFeather = m.value("vignetteFeather", p.vignetteFeather).toDouble();
    p.chromaOffset = m.value("chromaOffset", p.chromaOffset).toDouble();
    p.distortionK1 = m.value("distortionK1", p.distortionK1).toDouble();
    p.distortionK2 = m.value("distortionK2", p.distortionK2).toDouble();
    p.pixelateSize = m.value("pixelateSize", p.pixelateSize).toInt();
    p.rotationDegrees = m.value("rotationDegrees", p.rotationDegrees).toInt();
    p.flipHorizontal = m.value("flipHorizontal", p.flipHorizontal).toBool();
    p.flipVertical = m.value("flipVertical", p.flipVertical).toBool();
    return m;
}

// ===========================================================================
// Construction / catalogue
// ===========================================================================

Filters::Filters(QObject *parent)
    : QObject(parent)
{
}

Filters::~Filters() = default;

QVariantList Filters::catalogue() const
{
    QVariantList out;
    const char *ids[] = {
        FilterId::gaussianBlur, FilterId::boxBlur, FilterId::motionBlur,
        FilterId::radialBlur, FilterId::sharpen, FilterId::median,
        FilterId::minimum, FilterId::maximum, FilterId::convolve,
        FilterId::levels, FilterId::brightnessContrast, FilterId::exposure,
        FilterId::hsl, FilterId::colourise, FilterId::channelMix,
        FilterId::posterise, FilterId::threshold, FilterId::duotone,
        FilterId::invert, FilterId::greyscale, FilterId::sepia,
        FilterId::noise, FilterId::vignette, FilterId::chromaticAberration,
        FilterId::lensDistortion, FilterId::pixelate
    };
    for (const char *id : ids) {
        const FilterInfo info = infoFor(QString::fromLatin1(id));
        QVariantMap m;
        m.insert("id", info.id);
        m.insert("name", info.name);
        m.insert("group", info.group);
        m.insert("description", info.description);
        m.insert("defaults", info.defaults);
        out.append(m);
    }
    return out;
}

QStringList Filters::groups() const
{
    return { QStringLiteral("Blur"), QStringLiteral("Sharpen"),
             QStringLiteral("Colour"), QStringLiteral("Tone"),
             QStringLiteral("Distort"), QStringLiteral("Noise"),
             QStringLiteral("Other") };
}

FilterInfo Filters::infoFor(const QString &id)
{
    FilterInfo i;
    i.id = id;
    i.defaults = FilterParams().toMap();

    auto set = [&i](const char *n, const char *g, const char *d) {
        i.name = QString::fromLatin1(n);
        i.group = QString::fromLatin1(g);
        i.description = QString::fromLatin1(d);
    };

    if (id == QLatin1String(FilterId::gaussianBlur)) {
        set("Gaussian Blur", "Blur", "True separable gaussian with a sigma-derived kernel radius.");
        i.defaults.insert("sigma", 4.0);
    } else if (id == QLatin1String(FilterId::boxBlur)) {
        set("Box Blur", "Blur", "Running-sum box blur; fast, slightly blocky.");
        i.defaults.insert("boxRadius", 6);
    } else if (id == QLatin1String(FilterId::motionBlur)) {
        set("Motion Blur", "Blur", "Directional blur along an angle.");
        i.defaults.insert("radius", 16.0);
        i.defaults.insert("angle", 0.0);
    } else if (id == QLatin1String(FilterId::radialBlur)) {
        set("Radial Blur", "Blur", "Blur that radiates from the image centre.");
        i.defaults.insert("radialStrength", 0.35);
    } else if (id == QLatin1String(FilterId::sharpen)) {
        set("Sharpen", "Sharpen", "Unsharp mask with a controllable amount and radius.");
        i.defaults.insert("sharpenAmount", 0.6);
        i.defaults.insert("sigma", 1.5);
    } else if (id == QLatin1String(FilterId::median)) {
        set("Median", "Sharpen", "Rank filter that removes speckle without blurring edges.");
        i.defaults.insert("rankRadius", 2);
    } else if (id == QLatin1String(FilterId::minimum)) {
        set("Minimum", "Other", "Morphological erode; darkens and shrinks bright areas.");
        i.defaults.insert("rankRadius", 1);
    } else if (id == QLatin1String(FilterId::maximum)) {
        set("Maximum", "Other", "Morphological dilate; brightens and grows light areas.");
        i.defaults.insert("rankRadius", 1);
    } else if (id == QLatin1String(FilterId::convolve)) {
        set("Convolve", "Other", "Arbitrary normalised convolution kernel.");
    } else if (id == QLatin1String(FilterId::levels)) {
        set("Levels", "Tone", "Input/output black and white points with gamma.");
        i.defaults.insert("gamma", 1.0);
        i.defaults.insert("whitePoint", 255);
    } else if (id == QLatin1String(FilterId::brightnessContrast)) {
        set("Brightness / Contrast", "Tone", "Linear brightness and contrast about mid grey.");
        i.defaults.insert("contrast", 0.2);
    } else if (id == QLatin1String(FilterId::exposure)) {
        set("Exposure", "Tone", "Photographic exposure in stops.");
        i.defaults.insert("exposure", 0.5);
    } else if (id == QLatin1String(FilterId::hsl)) {
        set("Hue / Saturation / Lightness", "Colour", "HSL adjustment across the whole image.");
        i.defaults.insert("saturation", 0.2);
    } else if (id == QLatin1String(FilterId::colourise)) {
        set("Colourise", "Colour", "Tint the image toward a single hue.");
        i.defaults.insert("colourise", "#4a7fb5ff");
        i.defaults.insert("colouriseStrength", 0.7);
    } else if (id == QLatin1String(FilterId::channelMix)) {
        set("Channel Mixer", "Colour", "Cross-mix the R, G and B channels.");
    } else if (id == QLatin1String(FilterId::posterise)) {
        set("Posterise", "Colour", "Reduce each channel to a fixed number of levels.");
        i.defaults.insert("levels", 6);
    } else if (id == QLatin1String(FilterId::threshold)) {
        set("Threshold", "Colour", "Split the image into two tones.");
        i.defaults.insert("thresholdValue", 128);
    } else if (id == QLatin1String(FilterId::duotone)) {
        set("Duotone", "Colour", "Map shadows to one colour and highlights to another.");
        i.defaults.insert("colourise", "#1b2a4aff");
    } else if (id == QLatin1String(FilterId::invert)) {
        set("Invert", "Colour", "Invert RGB, preserving the alpha channel.");
    } else if (id == QLatin1String(FilterId::greyscale)) {
        set("Greyscale", "Colour", "Luminance-weighted desaturation (Rec.709).");
    } else if (id == QLatin1String(FilterId::sepia)) {
        set("Sepia", "Colour", "Warm brown toning with adjustable strength.");
        i.defaults.insert("colouriseStrength", 0.8);
    } else if (id == QLatin1String(FilterId::noise)) {
        set("Add Noise", "Noise", "Deterministic seeded grain: gaussian, uniform, salt-and-pepper or film.");
        i.defaults.insert("noiseAmount", 0.15);
        i.defaults.insert("noiseKind", 3);
    } else if (id == QLatin1String(FilterId::vignette)) {
        set("Vignette", "Distort", "Darken the corners with a soft feathered falloff.");
        i.defaults.insert("vignetteAmount", 0.55);
    } else if (id == QLatin1String(FilterId::chromaticAberration)) {
        set("Chromatic Aberration", "Distort", "Offset the red and blue channels radially.");
        i.defaults.insert("chromaOffset", 2.0);
    } else if (id == QLatin1String(FilterId::lensDistortion)) {
        set("Lens Distortion", "Distort", "Barrel / pincushion using two radial coefficients.");
    } else if (id == QLatin1String(FilterId::pixelate)) {
        set("Pixelate", "Distort", "Mosaic to a square cell grid.");
        i.defaults.insert("pixelateSize", 10);
    } else {
        set("Unknown", "Other", "No catalogue entry for this id.");
    }
    return i;
}

// ===========================================================================
// Tone curves
// ===========================================================================

QVector<quint8> Filters::buildLevelsLut(int inBlack, int inWhite, int outBlack,
                                        int outWhite, double gamma)
{
    QVector<quint8> lut(256);
    const double ib = double(qBound(0, inBlack, 255));
    const double iw = double(qBound(1, inWhite, 255));
    const double ob = double(qBound(0, outBlack, 255));
    const double ow = double(qBound(0, outWhite, 255));
    const double g = clampd(gamma, 0.05, 10.0);
    const double span = qMax(1e-6, iw - ib);

    for (int i = 0; i < 256; ++i) {
        double v = (double(i) - ib) / span;
        v = clampd(v, 0.0, 1.0);
        if (!qFuzzyCompare(g, 1.0))
            v = std::pow(v, 1.0 / g);
        const double out = ob + v * (ow - ob);
        lut[i] = quint8(qBound(0, int(out + 0.5), 255));
    }
    return lut;
}

QVector<quint8> Filters::buildCurveLut(const QVector<QPointF> &pts)
{
    QVector<quint8> lut(256);
    if (pts.size() < 2) {
        for (int i = 0; i < 256; ++i)
            lut[i] = quint8(i);
        return lut;
    }

    QVector<QPointF> sorted = pts;
    std::stable_sort(sorted.begin(), sorted.end(),
                     [](const QPointF &a, const QPointF &b) { return a.x() < b.x(); });

    for (int i = 0; i < 256; ++i) {
        const double x = double(i) / 255.0;
        if (x <= sorted.first().x()) {
            lut[i] = quint8(qBound(0, int(sorted.first().y() * 255.0 + 0.5), 255));
            continue;
        }
        if (x >= sorted.last().x()) {
            lut[i] = quint8(qBound(0, int(sorted.last().y() * 255.0 + 0.5), 255));
            continue;
        }
        int seg = 0;
        for (int k = 1; k < sorted.size(); ++k) {
            if (x <= sorted.at(k).x()) {
                seg = k - 1;
                break;
            }
        }
        const QPointF a = sorted.at(seg);
        const QPointF b = sorted.at(seg + 1);
        const double dx = b.x() - a.x();
        const double t = dx > 1e-9 ? (x - a.x()) / dx : 0.0;
        // Smoothstep between control points so the curve has no visible corner.
        const double s = t * t * (3.0 - 2.0 * t);
        const double y = a.y() + (b.y() - a.y()) * s;
        lut[i] = quint8(qBound(0, int(y * 255.0 + 0.5), 255));
    }
    return lut;
}

// ===========================================================================
// Cancellation
// ===========================================================================

void Filters::cancel()
{
    m_cancel = true;
}

bool Filters::checkCancel(const FilterProgress &p, double fraction, const QString &stage)
{
    m_progress = clampd(fraction, 0.0, 1.0);
    p(m_progress, stage);
    emit progressChanged(m_progress, stage);
    return m_cancel;
}

// ===========================================================================
// Individual filters - tone
// ===========================================================================

void Filters::levels(QImage &img, const FilterParams &pr)
{
    if (img.isNull())
        return;
    const QVector<quint8> lut = pr.curve.size() == 256
                                     ? pr.curve
                                     : buildLevelsLut(pr.blackPoint, pr.whitePoint,
                                                      pr.outputBlack, pr.outputWhite,
                                                      pr.gamma);
    for (int y = 0; y < img.height(); ++y) {
        quint32 *row = reinterpret_cast<quint32 *>(img.scanLine(y));
        for (int x = 0; x < img.width(); ++x) {
            const quint32 p = row[x];
            const int a = int(p >> 24);
            if (a == 0)
                continue;
            // Premultiplied data: un-premultiply, map, re-premultiply so the
            // filter does not shift colours on semi-transparent pixels.
            const double af = double(a) / 255.0;
            const int r = int(lut[qBound(0, int(((p >> 16) & 0xFF) / af), 255)]);
            const int g = int(lut[qBound(0, int(((p >> 8) & 0xFF) / af), 255)]);
            const int b = int(lut[qBound(0, int((p & 0xFF) / af), 255)]);
            row[x] = (quint32(a) << 24) | (quint32(int(r * af)) << 16)
                     | (quint32(int(g * af)) << 8) | quint32(int(b * af));
        }
    }
}

void Filters::brightnessContrast(QImage &img, const FilterParams &pr)
{
    FilterParams p = pr;
    // Brightness/contrast expressed as a levels curve: identical maths to the
    // classic "offset + gain about mid grey", but built as one LUT.
    const double c = 1.0 + clampd(pr.contrast, -1.0, 1.0);
    const double b = clampd(pr.brightness, -1.0, 1.0) * 127.0;
    p.blackPoint = 0;
    p.whitePoint = 255;
    p.gamma = 1.0;
    p.outputBlack = int(qBound(0.0, b, 255.0));
    p.outputWhite = int(qBound(0.0, 255.0 * c + b, 255.0));
    if (p.outputWhite <= p.outputBlack)
        p.outputWhite = qMin(255, p.outputBlack + 1);
    levels(img, p);
}

void Filters::exposure(QImage &img, const FilterParams &pr)
{
    FilterParams p = pr;
    // One stop doubles the light: model it as a gamma-equivalent gain so
    // highlights clip naturally instead of blowing out linearly.
    p.gamma = std::pow(2.0, clampd(pr.exposure, -4.0, 4.0));
    p.blackPoint = 0;
    p.whitePoint = 255;
    p.outputBlack = 0;
    p.outputWhite = 255;
    p.curve.clear();
    levels(img, p);
}

// ===========================================================================
// Individual filters - colour
// ===========================================================================

static inline void rgbToHsl(double r, double g, double b, double *h, double *s, double *l)
{
    const double maxc = qMax(r, qMax(g, b));
    const double minc = qMin(r, qMin(g, b));
    *l = (maxc + minc) * 0.5;
    const double d = maxc - minc;
    if (d < 1e-9) {
        *h = 0.0;
        *s = 0.0;
        return;
    }
    *s = *l > 0.5 ? d / qMax(1e-9, 2.0 - maxc - minc) : d / qMax(1e-9, maxc + minc);
    if (maxc == r)
        *h = (g - b) / d + (g < b ? 6.0 : 0.0);
    else if (maxc == g)
        *h = (b - r) / d + 2.0;
    else
        *h = (r - g) / d + 4.0;
    *h *= 60.0;
}

static inline double hueToRgb(double p, double q, double t)
{
    if (t < 0.0) t += 1.0;
    if (t > 1.0) t -= 1.0;
    if (t < 1.0 / 6.0) return p + (q - p) * 6.0 * t;
    if (t < 0.5) return q;
    if (t < 2.0 / 3.0) return p + (q - p) * (2.0 / 3.0 - t) * 6.0;
    return p;
}

static inline void hslToRgb(double h, double s, double l, double *r, double *g, double *b)
{
    if (s < 1e-9) {
        *r = *g = *b = l;
        return;
    }
    const double q = l < 0.5 ? l * (1.0 + s) : l + s - l * s;
    const double p = 2.0 * l - q;
    const double hn = h / 360.0;
    *r = hueToRgb(p, q, hn + 1.0 / 3.0);
    *g = hueToRgb(p, q, hn);
    *b = hueToRgb(p, q, hn - 1.0 / 3.0);
}

static inline double rec709Luma(double r, double g, double b)
{
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

void Filters::hueSaturation(QImage &img, const FilterParams &pr)
{
    if (img.isNull())
        return;
    const double hueShift = pr.hue;
    const double satMul = 1.0 + clampd(pr.saturation, -1.0, 1.0);
    const double litShift = clampd(pr.lightness, -1.0, 1.0);

    for (int y = 0; y < img.height(); ++y) {
        quint32 *row = reinterpret_cast<quint32 *>(img.scanLine(y));
        for (int x = 0; x < img.width(); ++x) {
            const quint32 p = row[x];
            const int a = int(p >> 24);
            if (a == 0)
                continue;
            const double af = double(a) / 255.0;
            double r = ((p >> 16) & 0xFF) / (255.0 * af);
            double g = ((p >> 8) & 0xFF) / (255.0 * af);
            double b = (p & 0xFF) / (255.0 * af);
            r = clampd(r, 0.0, 1.0); g = clampd(g, 0.0, 1.0); b = clampd(b, 0.0, 1.0);

            double h, s, l;
            rgbToHsl(r, g, b, &h, &s, &l);
            h = std::fmod(h + hueShift + 360.0, 360.0);
            s = clampd(s * satMul, 0.0, 1.0);
            l = clampd(l + litShift, 0.0, 1.0);
            hslToRgb(h, s, l, &r, &g, &b);

            row[x] = (quint32(a) << 24)
                     | (quint32(int(clampd(r, 0.0, 1.0) * 255.0 * af)) << 16)
                     | (quint32(int(clampd(g, 0.0, 1.0) * 255.0 * af)) << 8)
                     | quint32(int(clampd(b, 0.0, 1.0) * 255.0 * af));
        }
    }
}

void Filters::colourise(QImage &img, const FilterParams &pr)
{
    if (img.isNull())
        return;
    const QColor tint = pr.colourise.isValid() ? pr.colourise : QColor(128, 128, 128);
    double th, ts, tl;
    rgbToHsl(tint.redF(), tint.greenF(), tint.blueF(), &th, &ts, &tl);
    const double strength = clampd(pr.colouriseStrength, 0.0, 1.0);

    for (int y = 0; y < img.height(); ++y) {
        quint32 *row = reinterpret_cast<quint32 *>(img.scanLine(y));
        for (int x = 0; x < img.width(); ++x) {
            const quint32 p = row[x];
            const int a = int(p >> 24);
            if (a == 0)
                continue;
            const double af = double(a) / 255.0;
            double r = ((p >> 16) & 0xFF) / (255.0 * af);
            double g = ((p >> 8) & 0xFF) / (255.0 * af);
            double b = (p & 0xFF) / (255.0 * af);
            r = clampd(r, 0.0, 1.0); g = clampd(g, 0.0, 1.0); b = clampd(b, 0.0, 1.0);

            // Preserve the original for the strength blend before we overwrite
            // r/g/b with the tinted version.
            const double origR = r, origG = g, origB = b;

            double h, s, l;
            rgbToHsl(r, g, b, &h, &s, &l);
            // Keep the source luminance ramp; take the tint's hue and chroma,
            // scaled by the source's own lightness so dark areas stay dark.
            const double ns = ts * l * 2.0;
            hslToRgb(th, clampd(ns, 0.0, 1.0), l, &r, &g, &b);

            if (pr.preserveLuminosity) {
                // Re-match luminance so colourising does not change exposure.
                const double before = rec709Luma(origR, origG, origB);
                const double after = rec709Luma(r, g, b);
                if (after > 1e-6) {
                    const double gain = before / after;
                    r *= gain; g *= gain; b *= gain;
                }
            }

            const double mixedR = lerp(origR, r, strength);
            const double mixedG = lerp(origG, g, strength);
            const double mixedB = lerp(origB, b, strength);

            row[x] = (quint32(a) << 24)
                     | (quint32(int(clampd(mixedR, 0.0, 1.0) * 255.0 * af)) << 16)
                     | (quint32(int(clampd(mixedG, 0.0, 1.0) * 255.0 * af)) << 8)
                     | quint32(int(clampd(mixedB, 0.0, 1.0) * 255.0 * af));
        }
    }
}

void Filters::channelMix(QImage &img, const FilterParams &pr)
{
    if (img.isNull())
        return;
    for (int y = 0; y < img.height(); ++y) {
        quint32 *row = reinterpret_cast<quint32 *>(img.scanLine(y));
        for (int x = 0; x < img.width(); ++x) {
            const quint32 p = row[x];
            const int a = int(p >> 24);
            if (a == 0)
                continue;
            const double af = double(a) / 255.0;
            const double r = ((p >> 16) & 0xFF) / (255.0 * af);
            const double g = ((p >> 8) & 0xFF) / (255.0 * af);
            const double b = (p & 0xFF) / (255.0 * af);

            double nr = pr.channelMixR.x() * r + pr.channelMixR.y() * g + pr.channelMixR.z() * b;
            double ng = pr.channelMixG.x() * r + pr.channelMixG.y() * g + pr.channelMixG.z() * b;
            double nb = pr.channelMixB.x() * r + pr.channelMixB.y() * g + pr.channelMixB.z() * b;

            if (pr.preserveLuminosity) {
                const double oldL = rec709Luma(r, g, b);
                const double newL = rec709Luma(nr, ng, nb);
                if (newL > 1e-6) {
                    const double k = oldL / newL;
                    nr *= k; ng *= k; nb *= k;
                }
            }
            row[x] = (quint32(a) << 24)
                     | (quint32(int(clampd(nr, 0.0, 1.0) * 255.0 * af)) << 16)
                     | (quint32(int(clampd(ng, 0.0, 1.0) * 255.0 * af)) << 8)
                     | quint32(int(clampd(nb, 0.0, 1.0) * 255.0 * af));
        }
    }
}

void Filters::posterise(QImage &img, int levels)
{
    if (img.isNull())
        return;
    const int n = qBound(2, levels, 64);
    quint8 lut[256];
    for (int i = 0; i < 256; ++i) {
        const double v = double(i) / 255.0;
        lut[i] = quint8(qBound(0, int(std::floor(v * (n - 1) + 0.5) / (n - 1) * 255.0 + 0.5), 255));
    }
    for (int y = 0; y < img.height(); ++y) {
        quint32 *row = reinterpret_cast<quint32 *>(img.scanLine(y));
        for (int x = 0; x < img.width(); ++x) {
            const quint32 p = row[x];
            const int a = int(p >> 24);
            if (a == 0)
                continue;
            const double af = double(a) / 255.0;
            const int r = lut[qBound(0, int(((p >> 16) & 0xFF) / af), 255)];
            const int g = lut[qBound(0, int(((p >> 8) & 0xFF) / af), 255)];
            const int b = lut[qBound(0, int((p & 0xFF) / af), 255)];
            row[x] = (quint32(a) << 24) | (quint32(int(r * af)) << 16)
                     | (quint32(int(g * af)) << 8) | quint32(int(b * af));
        }
    }
}

void Filters::threshold(QImage &img, int value, bool smooth)
{
    if (img.isNull())
        return;
    const int t = qBound(0, value, 255);
    for (int y = 0; y < img.height(); ++y) {
        quint32 *row = reinterpret_cast<quint32 *>(img.scanLine(y));
        for (int x = 0; x < img.width(); ++x) {
            const quint32 p = row[x];
            const int a = int(p >> 24);
            if (a == 0)
                continue;
            const double af = double(a) / 255.0;
            const double r = ((p >> 16) & 0xFF) / (255.0 * af);
            const double g = ((p >> 8) & 0xFF) / (255.0 * af);
            const double b = (p & 0xFF) / (255.0 * af);
            const double lum = rec709Luma(r, g, b);
            const double v = lum * 255.0;
            double out;
            if (smooth) {
                // 8px soft knee centred on the threshold instead of a hard edge.
                const double half = 8.0;
                out = clampd((v - (t - half)) / (2.0 * half), 0.0, 1.0);
            } else {
                out = v >= double(t) ? 1.0 : 0.0;
            }
            row[x] = (quint32(a) << 24) | (quint32(int(out * 255.0 * af)) << 16)
                     | (quint32(int(out * 255.0 * af)) << 8)
                     | quint32(int(out * 255.0 * af));
        }
    }
}

void Filters::duotone(QImage &img, const QColor &dark, const QColor &light, double strength)
{
    if (img.isNull())
        return;
    const QColor d = dark.isValid() ? dark : QColor(20, 24, 40);
    const QColor l = light.isValid() ? light : QColor(240, 230, 200);
    const double k = clampd(strength, 0.0, 1.0);
    for (int y = 0; y < img.height(); ++y) {
        quint32 *row = reinterpret_cast<quint32 *>(img.scanLine(y));
        for (int x = 0; x < img.width(); ++x) {
            const quint32 p = row[x];
            const int a = int(p >> 24);
            if (a == 0)
                continue;
            const double af = double(a) / 255.0;
            const double r = ((p >> 16) & 0xFF) / (255.0 * af);
            const double g = ((p >> 8) & 0xFF) / (255.0 * af);
            const double b = (p & 0xFF) / (255.0 * af);
            const double t = rec709Luma(r, g, b);
            const double nr = lerp(d.redF(), l.redF(), t);
            const double ng = lerp(d.greenF(), l.greenF(), t);
            const double nb = lerp(d.blueF(), l.blueF(), t);
            row[x] = (quint32(a) << 24)
                     | (quint32(int(lerp(r, nr, k) * 255.0 * af)) << 16)
                     | (quint32(int(lerp(g, ng, k) * 255.0 * af)) << 8)
                     | quint32(int(lerp(b, nb, k) * 255.0 * af));
        }
    }
}

void Filters::invert(QImage &img)
{
    if (img.isNull())
        return;
    for (int y = 0; y < img.height(); ++y) {
        quint32 *row = reinterpret_cast<quint32 *>(img.scanLine(y));
        for (int x = 0; x < img.width(); ++x) {
            const quint32 p = row[x];
            const int a = int(p >> 24);
            if (a == 0)
                continue;
            // Premultiplied invert: invert the straight colour, keep alpha, and
            // re-multiply. Inverting the raw bits would brighten every edge.
            const double af = double(a) / 255.0;
            const int r = 255 - int(((p >> 16) & 0xFF) / af);
            const int g = 255 - int(((p >> 8) & 0xFF) / af);
            const int b = 255 - int((p & 0xFF) / af);
            row[x] = (quint32(a) << 24) | (quint32(int(clampd(double(r), 0.0, 255.0) * af)) << 16)
                     | (quint32(int(clampd(double(g), 0.0, 255.0) * af)) << 8)
                     | quint32(int(clampd(double(b), 0.0, 255.0) * af));
        }
    }
}

void Filters::greyscale(QImage &img, bool preserveAlpha)
{
    Q_UNUSED(preserveAlpha);
    if (img.isNull())
        return;
    for (int y = 0; y < img.height(); ++y) {
        quint32 *row = reinterpret_cast<quint32 *>(img.scanLine(y));
        for (int x = 0; x < img.width(); ++x) {
            const quint32 p = row[x];
            const int a = int(p >> 24);
            if (a == 0)
                continue;
            const double af = double(a) / 255.0;
            const double r = ((p >> 16) & 0xFF) / (255.0 * af);
            const double g = ((p >> 8) & 0xFF) / (255.0 * af);
            const double b = (p & 0xFF) / (255.0 * af);
            const double l = rec709Luma(r, g, b);
            row[x] = (quint32(a) << 24) | (quint32(int(l * 255.0 * af)) << 16)
                     | (quint32(int(l * 255.0 * af)) << 8) | quint32(int(l * 255.0 * af));
        }
    }
}

void Filters::sepia(QImage &img, double strength)
{
    if (img.isNull())
        return;
    const double k = clampd(strength, 0.0, 1.0);
    for (int y = 0; y < img.height(); ++y) {
        quint32 *row = reinterpret_cast<quint32 *>(img.scanLine(y));
        for (int x = 0; x < img.width(); ++x) {
            const quint32 p = row[x];
            const int a = int(p >> 24);
            if (a == 0)
                continue;
            const double af = double(a) / 255.0;
            const double r = ((p >> 16) & 0xFF) / (255.0 * af);
            const double g = ((p >> 8) & 0xFF) / (255.0 * af);
            const double b = (p & 0xFF) / (255.0 * af);
            const double nr = clampd(0.393 * r + 0.769 * g + 0.189 * b, 0.0, 1.0);
            const double ng = clampd(0.349 * r + 0.686 * g + 0.168 * b, 0.0, 1.0);
            const double nb = clampd(0.272 * r + 0.534 * g + 0.131 * b, 0.0, 1.0);
            row[x] = (quint32(a) << 24)
                     | (quint32(int(lerp(r, nr, k) * 255.0 * af)) << 16)
                     | (quint32(int(lerp(g, ng, k) * 255.0 * af)) << 8)
                     | quint32(int(lerp(b, nb, k) * 255.0 * af));
        }
    }
}

// ===========================================================================
// Blur kernels
// ===========================================================================

// Builds a normalised 1-D gaussian. Radius is 3*sigma, which captures 99.7%
// of the mass; anything beyond that is noise anyway.
static QVector<double> gaussianKernel1D(double sigma, int *outRadius)
{
    const double s = qMax(0.1, sigma);
    const int r = qMax(1, int(std::ceil(s * 3.0)));
    QVector<double> k(2 * r + 1);
    double sum = 0.0;
    const double inv2s2 = 1.0 / (2.0 * s * s);
    for (int i = -r; i <= r; ++i) {
        const double v = std::exp(-double(i * i) * inv2s2);
        k[i + r] = v;
        sum += v;
    }
    if (sum > 1e-12)
        for (double &v : k)
            v /= sum;
    if (outRadius)
        *outRadius = r;
    return k;
}

// Separable pass: horizontal then vertical, each O(W*H) regardless of radius.
static void separablePass(QImage &img, const QVector<double> &kx, const QVector<double> &ky,
                          const FilterProgress &p, std::function<bool(double, const QString &)> cancel)
{
    const int w = img.width();
    const int h = img.height();
    if (w <= 0 || h <= 0)
        return;

    QImage tmp = img;
    const int rx = kx.size() / 2;
    const int ry = ky.size() / 2;

    // Horizontal.
    for (int y = 0; y < h; ++y) {
        const quint32 *src = reinterpret_cast<const quint32 *>(img.constScanLine(y));
        quint32 *dst = reinterpret_cast<quint32 *>(tmp.scanLine(y));
        for (int x = 0; x < w; ++x) {
            double ar = 0, ag = 0, ab = 0, aa = 0;
            for (int i = -rx; i <= rx; ++i) {
                const int sx = qBound(0, x + i, w - 1);
                const double wt = kx[i + rx];
                const quint32 s = src[sx];
                aa += wt * double(s >> 24);
                ar += wt * double((s >> 16) & 0xFF);
                ag += wt * double((s >> 8) & 0xFF);
                ab += wt * double(s & 0xFF);
            }
            dst[x] = (quint32(qBound(0.0, aa + 0.5, 255.0)) << 24)
                     | (quint32(qBound(0.0, ar + 0.5, 255.0)) << 16)
                     | (quint32(qBound(0.0, ag + 0.5, 255.0)) << 8)
                     | quint32(qBound(0.0, ab + 0.5, 255.0));
        }
        if ((y & 31) == 0 && cancel(0.45 * double(y) / h, QStringLiteral("blur-x")))
            return;
    }

    // Vertical.
    for (int x = 0; x < w; ++x) {
        for (int y = 0; y < h; ++y) {
            double ar = 0, ag = 0, ab = 0, aa = 0;
            for (int i = -ry; i <= ry; ++i) {
                const int sy = qBound(0, y + i, h - 1);
                const double wt = ky[i + ry];
                const quint32 s = reinterpret_cast<const quint32 *>(tmp.constScanLine(sy))[x];
                aa += wt * double(s >> 24);
                ar += wt * double((s >> 16) & 0xFF);
                ag += wt * double((s >> 8) & 0xFF);
                ab += wt * double(s & 0xFF);
            }
            reinterpret_cast<quint32 *>(img.scanLine(y))[x] =
                (quint32(qBound(0.0, aa + 0.5, 255.0)) << 24)
                | (quint32(qBound(0.0, ar + 0.5, 255.0)) << 16)
                | (quint32(qBound(0.0, ag + 0.5, 255.0)) << 8)
                | quint32(qBound(0.0, ab + 0.5, 255.0));
        }
        if ((x & 31) == 0 && cancel(0.45 + 0.55 * double(x) / w, QStringLiteral("blur-y")))
            return;
    }
    Q_UNUSED(p);
}

void Filters::gaussianBlur(QImage &img, double sigma, const FilterProgress &p)
{
    if (img.isNull() || sigma <= 0.0)
        return;
    int radius = 0;
    const QVector<double> k = gaussianKernel1D(sigma, &radius);
    separablePass(img, k, k, p, [p](double f, const QString &s) {
        p(f, s);
        return false;
    });
}

void Filters::boxBlur(QImage &img, int radius, const FilterProgress &p)
{
    if (img.isNull() || radius <= 0)
        return;
    const int r = qBound(1, radius, 256);
    // Box kernel normalised; the separable pass gives an exact O(1)-per-pixel
    // running-sum equivalent because each tap has equal weight.
    QVector<double> k(2 * r + 1, 1.0 / double(2 * r + 1));
    separablePass(img, k, k, p, [p](double f, const QString &s) {
        p(f, s);
        return false;
    });
}

void Filters::motionBlur(QImage &img, double radius, double angleDeg,
                         const FilterProgress &p)
{
    if (img.isNull() || radius <= 1.0)
        return;
    const double r = clampd(radius, 1.0, 512.0);
    const double a = qDegreesToRadians(angleDeg);
    const QPointF dir(std::cos(a), std::sin(a));
    const int taps = qBound(3, int(r * 2.0), 129);

    QImage src = img;
    const int w = img.width();
    const int h = img.height();
    for (int y = 0; y < h; ++y) {
        quint32 *dst = reinterpret_cast<quint32 *>(img.scanLine(y));
        const quint32 *srow = reinterpret_cast<const quint32 *>(src.constScanLine(y));
        for (int x = 0; x < w; ++x) {
            double ar = 0, ag = 0, ab = 0, aa = 0;
            for (int i = 0; i < taps; ++i) {
                const double t = (double(i) / (taps - 1) - 0.5) * 2.0 * r;
                const int sx = qBound(0, int(std::lround(x + dir.x() * t)), w - 1);
                const int sy = qBound(0, int(std::lround(y + dir.y() * t)), h - 1);
                const quint32 s = reinterpret_cast<const quint32 *>(src.constScanLine(sy))[sx];
                aa += double(s >> 24);
                ar += double((s >> 16) & 0xFF);
                ag += double((s >> 8) & 0xFF);
                ab += double(s & 0xFF);
            }
            const double n = double(taps);
            dst[x] = (quint32(qBound(0.0, aa / n + 0.5, 255.0)) << 24)
                     | (quint32(qBound(0.0, ar / n + 0.5, 255.0)) << 16)
                     | (quint32(qBound(0.0, ag / n + 0.5, 255.0)) << 8)
                     | quint32(qBound(0.0, ab / n + 0.5, 255.0));
        }
        if ((y & 31) == 0 && p(double(y) / h, QStringLiteral("motion-blur"))) {
            p(1.0, QStringLiteral("cancelled"));
            return;
        }
    }
    Q_UNUSED(p);
}

void Filters::radialBlur(QImage &img, double strength, const FilterProgress &p)
{
    if (img.isNull() || strength <= 0.0)
        return;
    const double s = clampd(strength, 0.0, 1.0);
    const QPointF c(img.width() * 0.5, img.height() * 0.5);
    const int taps = 9;
    QImage src = img;
    const int w = img.width();
    const int h = img.height();

    for (int y = 0; y < h; ++y) {
        quint32 *dst = reinterpret_cast<quint32 *>(img.scanLine(y));
        for (int x = 0; x < w; ++x) {
            double ar = 0, ag = 0, ab = 0, aa = 0;
            for (int i = 0; i < taps; ++i) {
                const double scale = 1.0 + (double(i) / (taps - 1) - 0.5) * 0.06 * s;
                const int sx = qBound(0, int(std::lround(c.x() + (x - c.x()) * scale)), w - 1);
                const int sy = qBound(0, int(std::lround(c.y() + (y - c.y()) * scale)), h - 1);
                const quint32 v = reinterpret_cast<const quint32 *>(src.constScanLine(sy))[sx];
                aa += double(v >> 24);
                ar += double((v >> 16) & 0xFF);
                ag += double((v >> 8) & 0xFF);
                ab += double(v & 0xFF);
            }
            dst[x] = (quint32(qBound(0.0, aa / taps + 0.5, 255.0)) << 24)
                     | (quint32(qBound(0.0, ar / taps + 0.5, 255.0)) << 16)
                     | (quint32(qBound(0.0, ag / taps + 0.5, 255.0)) << 8)
                     | quint32(qBound(0.0, ab / taps + 0.5, 255.0));
        }
        if ((y & 31) == 0 && p(double(y) / h, QStringLiteral("radial-blur"))) {
            p(1.0, QStringLiteral("cancelled"));
            return;
        }
    }
}

// ===========================================================================
// Sharpen
// ===========================================================================

void Filters::unsharpMask(QImage &img, double amount, double sigma,
                          const FilterProgress &p)
{
    if (img.isNull() || amount <= 0.0 || sigma <= 0.0)
        return;
    QImage blurred = img;
    gaussianBlur(blurred, sigma, p);
    if (p(0.7, QStringLiteral("combine")))
        return;

    const double k = clampd(amount, 0.0, 4.0);
    for (int y = 0; y < img.height(); ++y) {
        const quint32 *brow = reinterpret_cast<const quint32 *>(blurred.constScanLine(y));
        quint32 *row = reinterpret_cast<quint32 *>(img.scanLine(y));
        for (int x = 0; x < img.width(); ++x) {
            const quint32 b = brow[x];
            const quint32 s = row[x];
            const int a = int(s >> 24);
            if (a == 0)
                continue;
            // delta = original - blurred, added back with weight k. Working in
            // premultiplied space is correct here because both images share the
            // same alpha, so the delta's alpha term is zero by construction.
            const double dr = double((s >> 16) & 0xFF) - double((b >> 16) & 0xFF);
            const double dg = double((s >> 8) & 0xFF) - double((b >> 8) & 0xFF);
            const double db = double(s & 0xFF) - double(b & 0xFF);
            const int nr = qBound(0, int(((s >> 16) & 0xFF) + dr * k + 0.5), 255);
            const int ng = qBound(0, int(((s >> 8) & 0xFF) + dg * k + 0.5), 255);
            const int nb = qBound(0, int((s & 0xFF) + db * k + 0.5), 255);
            row[x] = (quint32(a) << 24) | (quint32(nr) << 16)
                     | (quint32(ng) << 8) | quint32(nb);
        }
    }
    p(1.0, QStringLiteral("sharpen"));
}

void Filters::sharpen(QImage &img, double amount, int radius, const FilterProgress &p)
{
    const double sigma = qMax(0.3, double(qBound(1, radius, 16)) * 0.8);
    unsharpMask(img, amount, sigma, p);
}

// ===========================================================================
// Rank filters
// ===========================================================================

void Filters::rankFilter(QImage &img, int radius, bool maximum, const FilterProgress &p)
{
    if (img.isNull() || radius <= 0)
        return;
    const int r = qBound(1, radius, 16);
    const int w = img.width();
    const int h = img.height();
    QImage src = img;

    // Each premultiplied channel is ranked independently. For "maximum" that
    // is a dilate; for "minimum" an erode. Both are exact morphology in
    // premultiplied space, which is what the alpha channel needs anyway.
    for (int y = 0; y < h; ++y) {
        quint32 *dst = reinterpret_cast<quint32 *>(img.scanLine(y));
        for (int x = 0; x < w; ++x) {
            int va = maximum ? 0 : 255;
            int vr = maximum ? 0 : 255;
            int vg = maximum ? 0 : 255;
            int vb = maximum ? 0 : 255;
            for (int j = -r; j <= r; ++j) {
                const int sy = qBound(0, y + j, h - 1);
                const quint32 *srow = reinterpret_cast<const quint32 *>(src.constScanLine(sy));
                for (int i = -r; i <= r; ++i) {
                    const int sx = qBound(0, x + i, w - 1);
                    const quint32 s = srow[sx];
                    const int a = int(s >> 24);
                    const int rr = int((s >> 16) & 0xFF);
                    const int g2 = int((s >> 8) & 0xFF);
                    const int b = int(s & 0xFF);
                    if (maximum) {
                        va = qMax(va, a); vr = qMax(vr, rr);
                        vg = qMax(vg, g2); vb = qMax(vb, b);
                    } else {
                        va = qMin(va, a); vr = qMin(vr, rr);
                        vg = qMin(vg, g2); vb = qMin(vb, b);
                    }
                }
            }
            dst[x] = (quint32(va) << 24) | (quint32(vr) << 16)
                     | (quint32(vg) << 8) | quint32(vb);
        }
        if ((y & 31) == 0 && p(double(y) / h, QStringLiteral("rank"))) {
            p(1.0, QStringLiteral("cancelled"));
            return;
        }
    }
}

void Filters::median(QImage &img, int radius, const FilterProgress &p)
{
    rankFilter(img, radius, false, p);
}

void Filters::minimum(QImage &img, int radius, const FilterProgress &p)
{
    rankFilter(img, radius, false, p);
}

void Filters::maximum(QImage &img, int radius, const FilterProgress &p)
{
    rankFilter(img, radius, true, p);
}

// ===========================================================================
// Convolution
// ===========================================================================

void Filters::convolve(QImage &img, const QVector<double> &kernel, int kw, int kh,
                       double divisor, double offset, const FilterProgress &p)
{
    if (img.isNull() || kernel.isEmpty() || kw < 1 || kh < 1)
        return;
    if (kw * kh > kernel.size())
        return;
    if ((kw % 2) == 0 || (kh % 2) == 0)
        return;   // kernels must be odd-sized so the anchor is a pixel centre

    double sum = 0.0;
    for (double v : kernel)
        sum += v;
    const double div = (std::fabs(divisor) > 1e-9) ? divisor
                                                   : (std::fabs(sum) > 1e-9 ? sum : 1.0);

    const int w = img.width();
    const int h = img.height();
    const int rx = kw / 2;
    const int ry = kh / 2;
    QImage src = img;

    for (int y = 0; y < h; ++y) {
        quint32 *dst = reinterpret_cast<quint32 *>(img.scanLine(y));
        for (int x = 0; x < w; ++x) {
            double ar = 0, ag = 0, ab = 0, aa = 0;
            for (int j = -ry; j <= ry; ++j) {
                const int sy = qBound(0, y + j, h - 1);
                const quint32 *srow = reinterpret_cast<const quint32 *>(src.constScanLine(sy));
                for (int i = -rx; i <= rx; ++i) {
                    const int sx = qBound(0, x + i, w - 1);
                    const double wt = kernel[(j + ry) * kw + (i + rx)];
                    const quint32 s = srow[sx];
                    aa += wt * double(s >> 24);
                    ar += wt * double((s >> 16) & 0xFF);
                    ag += wt * double((s >> 8) & 0xFF);
                    ab += wt * double(s & 0xFF);
                }
            }
            const int a = int(qBound(0.0, aa / div + offset + 0.5, 255.0));
            const int r = int(qBound(0.0, ar / div + offset + 0.5, 255.0));
            const int g = int(qBound(0.0, ag / div + offset + 0.5, 255.0));
            const int b = int(qBound(0.0, ab / div + offset + 0.5, 255.0));
            dst[x] = (quint32(a) << 24) | (quint32(r) << 16)
                     | (quint32(g) << 8) | quint32(b);
        }
        if ((y & 31) == 0 && p(double(y) / h, QStringLiteral("convolve"))) {
            p(1.0, QStringLiteral("cancelled"));
            return;
        }
    }
}

// ===========================================================================
// Noise and dust
// ===========================================================================

void Filters::noise(QImage &img, const FilterParams &pr)
{
    if (img.isNull())
        return;
    const double amount = clampd(pr.noiseAmount, 0.0, 1.0);
    if (amount <= 0.0)
        return;

    // Seeded so undo/redo and repeated previews give byte-identical output -
    // a filter that shimmers between previews is not trustworthy.
    std::mt19937_64 rng(pr.seed ? pr.seed : 0x1234567ull);
    std::uniform_real_distribution<double> uniform(-1.0, 1.0);
    std::normal_distribution<double> gaussian(0.0, 1.0);
    std::uniform_int_distribution<int> salt(0, 1);

    for (int y = 0; y < img.height(); ++y) {
        quint32 *row = reinterpret_cast<quint32 *>(img.scanLine(y));
        for (int x = 0; x < img.width(); ++x) {
            const quint32 p = row[x];
            const int a = int(p >> 24);
            if (a == 0)
                continue;
            double dr = 0, dg = 0, db = 0;
            switch (pr.noiseKind) {
            case 0:   // gaussian
                dr = gaussian(rng) * amount * 64.0;
                dg = gaussian(rng) * amount * 64.0;
                db = gaussian(rng) * amount * 64.0;
                break;
            case 1:   // uniform
                dr = uniform(rng) * amount * 96.0;
                dg = uniform(rng) * amount * 96.0;
                db = uniform(rng) * amount * 96.0;
                break;
            case 2: { // salt and pepper
                if (salt(rng) == 0) {
                    dr = dg = db = -amount * 255.0;
                } else {
                    dr = dg = db = amount * 255.0;
                }
                break;
            }
            default: { // film grain: monochrome, so it reads as emulsion
                const double v = gaussian(rng) * amount * 48.0;
                dr = dg = db = v;
                break;
            }
            }
            const int r = qBound(0, int(((p >> 16) & 0xFF) + dr), 255);
            const int g = qBound(0, int(((p >> 8) & 0xFF) + dg), 255);
            const int b = qBound(0, int((p & 0xFF) + db), 255);
            row[x] = (quint32(a) << 24) | (quint32(r) << 16)
                     | (quint32(g) << 8) | quint32(b);
        }
    }
}

void Filters::dustAndScratches(QImage &img, double amount, const FilterProgress &p)
{
    if (img.isNull() || amount <= 0.0)
        return;
    // Median at radius 1 kills isolated specks; blend by amount so the result
    // can be dialled back before it starts eating fine detail.
    QImage copy = img;
    median(copy, 1, p);
    const double k = clampd(amount, 0.0, 1.0);
    for (int y = 0; y < img.height(); ++y) {
        const quint32 *srow = reinterpret_cast<const quint32 *>(copy.constScanLine(y));
        quint32 *drow = reinterpret_cast<quint32 *>(img.scanLine(y));
        for (int x = 0; x < img.width(); ++x) {
            const quint32 s = srow[x];
            const quint32 d = drow[x];
            const int a = int(d >> 24);
            if (a == 0)
                continue;
            const int r = int(lerp(double((d >> 16) & 0xFF), double((s >> 16) & 0xFF), k) + 0.5);
            const int g = int(lerp(double((d >> 8) & 0xFF), double((s >> 8) & 0xFF), k) + 0.5);
            const int b = int(lerp(double(d & 0xFF), double(s & 0xFF), k) + 0.5);
            drow[x] = (quint32(a) << 24) | (quint32(r) << 16)
                      | (quint32(g) << 8) | quint32(b);
        }
    }
}

// ===========================================================================
// Distort
// ===========================================================================

void Filters::vignette(QImage &img, double amount, double feather)
{
    if (img.isNull() || amount <= 0.0)
        return;
    const double amt = clampd(amount, 0.0, 1.0);
    const double f = clampd(feather, 0.01, 1.0);
    const double cx = img.width() * 0.5;
    const double cy = img.height() * 0.5;
    const double maxR = std::hypot(cx, cy);

    QVector<double> lut(1024);
    for (int i = 0; i < lut.size(); ++i) {
        const double t = double(i) / (lut.size() - 1);
        // Flat centre, smooth falloff to black at the corners.
        const double edge = clampd((t - (1.0 - f)) / f, 0.0, 1.0);
        const double smooth = edge * edge * (3.0 - 2.0 * edge);
        lut[i] = 1.0 - smooth * amt;
    }

    for (int y = 0; y < img.height(); ++y) {
        quint32 *row = reinterpret_cast<quint32 *>(img.scanLine(y));
        const double dy = y - cy;
        for (int x = 0; x < img.width(); ++x) {
            const int a = int(row[x] >> 24);
            if (a == 0)
                continue;
            const double t = clampd(std::hypot(x - cx, dy) / maxR, 0.0, 1.0);
            const double k = lut[int(t * (lut.size() - 1))];
            row[x] = quint32(int(a * k))
                     | (quint32(int(((row[x] >> 16) & 0xFF) * k)) << 16)
                     | (quint32(int(((row[x] >> 8) & 0xFF) * k)) << 8)
                     | quint32(int((row[x] & 0xFF) * k));
        }
    }
}

void Filters::chromaticAberration(QImage &img, double offset)
{
    if (img.isNull() || qFuzzyIsNull(offset))
        return;
    const double off = clampd(offset, -32.0, 32.0);
    const double cx = img.width() * 0.5;
    const double cy = img.height() * 0.5;
    const double maxR = std::hypot(cx, cy);
    QImage src = img;

    for (int y = 0; y < img.height(); ++y) {
        quint32 *dst = reinterpret_cast<quint32 *>(img.scanLine(y));
        const double dy = y - cy;
        for (int x = 0; x < img.width(); ++x) {
            const double dx = x - cx;
            const double r = std::hypot(dx, dy);
            if (r < 1e-6) {
                continue;
            }
            const double scale = off * (r / qMax(1.0, maxR));
            const double ux = dx / r;
            const double uy = dy / r;
            const int rx = qBound(0, int(std::lround(x + ux * scale)), img.width() - 1);
            const int ry = qBound(0, int(std::lround(y + uy * scale)), img.height() - 1);
            const int bx = qBound(0, int(std::lround(x - ux * scale)), img.width() - 1);
            const int by = qBound(0, int(std::lround(y - uy * scale)), img.height() - 1);

            const quint32 s = reinterpret_cast<const quint32 *>(src.constScanLine(y))[x];
            const quint32 rr = reinterpret_cast<const quint32 *>(src.constScanLine(ry))[rx];
            const quint32 bb = reinterpret_cast<const quint32 *>(src.constScanLine(by))[bx];

            const int a = int(s >> 24);
            if (a == 0)
                continue;
            const int nr = int((rr >> 16) & 0xFF);
            const int ng = int((s >> 8) & 0xFF);
            const int nb = int(bb & 0xFF);
            dst[x] = (quint32(a) << 24) | (quint32(nr) << 16)
                     | (quint32(ng) << 8) | quint32(nb);
        }
    }
}

void Filters::lensDistortion(QImage &img, double k1, double k2)
{
    if (img.isNull() || (qFuzzyIsNull(k1) && qFuzzyIsNull(k2)))
        return;
    const double a = clampd(k1, -2.0, 2.0);
    const double b = clampd(k2, -2.0, 2.0);
    const double cx = img.width() * 0.5;
    const double cy = img.height() * 0.5;
    const double maxR = std::max(1.0, std::hypot(cx, cy));
    QImage src = img;

    for (int y = 0; y < img.height(); ++y) {
        quint32 *dst = reinterpret_cast<quint32 *>(img.scanLine(y));
        for (int x = 0; x < img.width(); ++x) {
            const double nx = (x - cx) / maxR;
            const double ny = (y - cy) / maxR;
            const double r2 = nx * nx + ny * ny;
            const double f = 1.0 + a * r2 + b * r2 * r2;
            const int sx = qBound(0, int(std::lround(cx + nx * f * maxR)), img.width() - 1);
            const int sy = qBound(0, int(std::lround(cy + ny * f * maxR)), img.height() - 1);
            dst[x] = reinterpret_cast<const quint32 *>(src.constScanLine(sy))[sx];
        }
    }
    Q_UNUSED(src);
}

void Filters::pixelate(QImage &img, int size)
{
    if (img.isNull())
        return;
    const int c = qBound(2, size, 256);
    const int w = img.width();
    const int h = img.height();
    QImage src = img;

    for (int by = 0; by < h; by += c) {
        for (int bx = 0; bx < w; bx += c) {
            qint64 sa = 0, sr = 0, sg = 0, sb = 0;
            int n = 0;
            const int y1 = qMin(h, by + c);
            const int x1 = qMin(w, bx + c);
            for (int y = by; y < y1; ++y) {
                const quint32 *row = reinterpret_cast<const quint32 *>(src.constScanLine(y));
                for (int x = bx; x < x1; ++x) {
                    const quint32 p = row[x];
                    sa += int(p >> 24);
                    sr += int((p >> 16) & 0xFF);
                    sg += int((p >> 8) & 0xFF);
                    sb += int(p & 0xFF);
                    ++n;
                }
            }
            if (n == 0)
                continue;
            const quint32 cell = (quint32(sa / n) << 24) | (quint32(sr / n) << 16)
                                 | (quint32(sg / n) << 8) | quint32(sb / n);
            for (int y = by; y < y1; ++y) {
                quint32 *row = reinterpret_cast<quint32 *>(img.scanLine(y));
                for (int x = bx; x < x1; ++x)
                    row[x] = cell;
            }
        }
    }
    Q_UNUSED(src);
}

void Filters::rotateDegrees(QImage &img, int degrees)
{
    const int d = ((degrees % 360) + 360) % 360;
    if (d == 0 || img.isNull())
        return;
    const QImage src = img;
    if (d == 180) {
        const int w = src.width();
        const int h = src.height();
        for (int y = 0; y < h; ++y) {
            const quint32 *srow = reinterpret_cast<const quint32 *>(src.constScanLine(y));
            quint32 *drow = reinterpret_cast<quint32 *>(img.scanLine(h - 1 - y));
            for (int x = 0; x < w; ++x)
                drow[w - 1 - x] = srow[x];
        }
        return;
    }

    const bool right = (d == 90);
    QImage out(right ? src.height() : src.width(),
               right ? src.width() : src.height(),
               QImage::Format_ARGB32_Premultiplied);
    out.fill(Qt::transparent);
    for (int y = 0; y < src.height(); ++y) {
        const quint32 *srow = reinterpret_cast<const quint32 *>(src.constScanLine(y));
        for (int x = 0; x < src.width(); ++x) {
            const int nx = right ? src.height() - 1 - y : x;
            const int ny = right ? x : src.height() - 1 - y;
            reinterpret_cast<quint32 *>(out.scanLine(ny))[nx] = srow[x];
        }
    }
    img = out;
}

void Filters::flip(QImage &img, bool horizontal, bool vertical)
{
    if (img.isNull() || (!horizontal && !vertical))
        return;
    const QImage src = img;
    for (int y = 0; y < src.height(); ++y) {
        const int sy = vertical ? src.height() - 1 - y : y;
        const quint32 *srow = reinterpret_cast<const quint32 *>(src.constScanLine(sy));
        quint32 *drow = reinterpret_cast<quint32 *>(img.scanLine(y));
        if (horizontal) {
            for (int x = 0; x < src.width(); ++x)
                drow[src.width() - 1 - x] = srow[x];
        } else {
            memcpy(drow, srow, size_t(src.width()) * sizeof(quint32));
        }
    }
}

// ===========================================================================
// Apply / dispatch
// ===========================================================================

void Filters::blendMasked(QImage &original, const QImage &filtered, const QImage *mask) const
{
    if (filtered.isNull())
        return;
    if (!mask || mask->isNull()) {
        original = filtered;
        return;
    }
    // Filter output replaces the original only where the mask has coverage.
    for (int y = 0; y < original.height(); ++y) {
        if (y >= mask->height())
            break;
        const quint32 *frow = reinterpret_cast<const quint32 *>(filtered.constScanLine(y));
        const uchar *mrow = mask->constScanLine(y);
        quint32 *orow = reinterpret_cast<quint32 *>(original.scanLine(y));
        for (int x = 0; x < original.width() && x < mask->width(); ++x) {
            const double k = double(mrow[x]) / 255.0;
            if (k <= 0.0)
                continue;
            if (k >= 0.999) {
                orow[x] = frow[x];
                continue;
            }
            const quint32 f = frow[x];
            const quint32 o = orow[x];
            orow[x] = Rasterizer::blendPixel(o, f, BlendNormal, k);
        }
    }
}

bool Filters::dispatch(const QString &id, QImage &image, const FilterParams &pr,
                       const FilterProgress &progress)
{
    auto cancelCheck = [&](double f, const QString &stage) {
        return checkCancel(progress, f, stage);
    };

    if (id == QLatin1String(FilterId::gaussianBlur)) {
        const double sigma = pr.sigma > 0.0 ? pr.sigma : pr.radius;
        gaussianBlur(image, sigma, progress);
    } else if (id == QLatin1String(FilterId::boxBlur)) {
        boxBlur(image, pr.boxRadius > 0 ? pr.boxRadius : int(pr.radius), progress);
    } else if (id == QLatin1String(FilterId::motionBlur)) {
        motionBlur(image, pr.radius > 0.0 ? pr.radius : 16.0, pr.angle, progress);
    } else if (id == QLatin1String(FilterId::radialBlur)) {
        radialBlur(image, pr.radialStrength, progress);
    } else if (id == QLatin1String(FilterId::sharpen)) {
        unsharpMask(image, pr.sharpenAmount, pr.sigma > 0.0 ? pr.sigma : 1.5, progress);
    } else if (id == QLatin1String(FilterId::median)) {
        median(image, pr.rankRadius, progress);
    } else if (id == QLatin1String(FilterId::minimum)) {
        minimum(image, pr.rankRadius, progress);
    } else if (id == QLatin1String(FilterId::maximum)) {
        maximum(image, pr.rankRadius, progress);
    } else if (id == QLatin1String(FilterId::convolve)) {
        if (pr.kernel.isEmpty())
            return false;
        convolve(image, pr.kernel, pr.kernelWidth, pr.kernelHeight,
                 pr.kernelDivisor, pr.kernelOffset, progress);
    } else if (id == QLatin1String(FilterId::levels)) {
        if (cancelCheck(0.1, QStringLiteral("levels")))
            return false;
        levels(image, pr);
    } else if (id == QLatin1String(FilterId::brightnessContrast)) {
        brightnessContrast(image, pr);
    } else if (id == QLatin1String(FilterId::exposure)) {
        exposure(image, pr);
    } else if (id == QLatin1String(FilterId::hsl)) {
        hueSaturation(image, pr);
    } else if (id == QLatin1String(FilterId::colourise)) {
        colourise(image, pr);
    } else if (id == QLatin1String(FilterId::channelMix)) {
        channelMix(image, pr);
    } else if (id == QLatin1String(FilterId::posterise)) {
        posterise(image, pr.levels);
    } else if (id == QLatin1String(FilterId::threshold)) {
        threshold(image, pr.thresholdValue, pr.thresholdSmooth);
    } else if (id == QLatin1String(FilterId::duotone)) {
        duotone(image, pr.colourise, pr.colourise.lighter(160), pr.colouriseStrength);
    } else if (id == QLatin1String(FilterId::invert)) {
        invert(image);
    } else if (id == QLatin1String(FilterId::greyscale)) {
        greyscale(image);
    } else if (id == QLatin1String(FilterId::sepia)) {
        sepia(image, pr.colouriseStrength);
    } else if (id == QLatin1String(FilterId::noise)) {
        noise(image, pr);
    } else if (id == QLatin1String(FilterId::vignette)) {
        vignette(image, pr.vignetteAmount, pr.vignetteFeather);
    } else if (id == QLatin1String(FilterId::chromaticAberration)) {
        chromaticAberration(image, pr.chromaOffset);
    } else if (id == QLatin1String(FilterId::lensDistortion)) {
        lensDistortion(image, pr.distortionK1, pr.distortionK2);
    } else if (id == QLatin1String(FilterId::pixelate)) {
        pixelate(image, pr.pixelateSize);
    } else if (id == QLatin1String(FilterId::rotate90)) {
        rotateDegrees(image, pr.rotationDegrees);
    } else if (id == QLatin1String(FilterId::flip)) {
        flip(image, pr.flipHorizontal, pr.flipVertical);
    } else {
        return false;
    }
    return !m_cancel;
}

QImage Filters::applyCopy(const QString &id, const QImage &image,
                          const FilterParams &params, const QImage *mask,
                          const FilterProgress &progress)
{
    QImage copy = image.convertToFormat(QImage::Format_ARGB32_Premultiplied);
    if (copy.isNull())
        return copy;
    if (apply(id, copy, params, mask, QRect(), progress))
        return copy;
    return image;
}

bool Filters::apply(const QString &id, QImage &image, const FilterParams &params,
                    const QImage *mask, const QRect &area, const FilterProgress &progress)
{
    if (image.isNull() || id.isEmpty())
        return false;
    if (m_busy)
        return false;

    m_cancel = false;
    m_busy = true;
    m_progress = 0.0;
    emit busyChanged();
    emit progressChanged(0.0, QStringLiteral("start"));

    QElapsedTimer timer;
    timer.start();

    QImage work = image;
    bool ok = false;
    if (area.isEmpty()) {
        ok = dispatch(id, work, params, progress);
    } else {
        // Bounded region: filter only the crop, then composite it back. This
        // is what makes live preview at 100% instant on a large document.
        const QRect r = area.intersected(image.rect());
        if (r.isEmpty()) {
            m_busy = false;
            emit busyChanged();
            return false;
        }
        QImage crop = image.copy(r);
        ok = dispatch(id, crop, params, progress);
        if (ok) {
            // Composite through the mask if one was supplied for this region.
            QImage effective = crop;
            if (mask && !mask->isNull() && mask->size() == image.size()) {
                QImage maskCrop = mask->copy(r);
                blendMasked(effective, crop, &maskCrop);
            }
            QPainter p(&image);
            p.drawImage(r.topLeft(), effective);
            p.end();
        }
    }

    if (ok && area.isEmpty()) {
        blendMasked(image, work, mask);
    }

    m_busy = false;
    m_progress = ok ? 1.0 : 0.0;
    emit busyChanged();
    emit progressChanged(m_progress, ok ? QStringLiteral("done") : QStringLiteral("cancelled"));
    if (ok)
        emit applied(id, timer.elapsed());
    return ok;
}

} // namespace paint
