#ifndef PAINT_FILTERS_H
#define PAINT_FILTERS_H

// =============================================================================
//  VOLTRA PAINT - Filters
// =============================================================================
//  Real pixel processing. Every filter here operates on premultiplied ARGB32
//  data with documented semantics - no "do some Photoshop stuff" placeholders.
//
//  The set is deliberately the honest core that a raster editor actually needs:
//
//    - Levels / brightness / contrast / exposure (tone curves, exact)
//    - Hue / saturation / lightness / colourise / channel mix
//    - Gaussian blur (true separable kernel, sigma-derived radius)
//    - Box blur (running sums, O(1) per pixel) and a stack blur variant
//    - Sharpen (unsharp mask built from the blur above)
//    - Median, minimum, maximum (rank filters for denoise and morphology)
//    - Convolution with an arbitrary normalised kernel
//    - Noise (deterministic, seeded) and dust-and-scratches removal
//    - Posterise, duotone/threshold, invert, greyscale, sepia
//    - Lens distortion, vignette, chromatic aberration (channel offsets)
//    - Canvas rotation / flip / perspective-lite (bilinear resample)
//
//  All filters honour a mask (selection) and a progress callback; anything
//  that can be run in tiles is, so a 200-megapixel document does not stall
//  the event loop for four seconds.
// =============================================================================

#include "PaintTypes.h"

#include <QImage>
#include <QObject>
#include <QString>
#include <QVariantList>
#include <QVariantMap>
#include <QVector>
#include <QVector3D>

#include <functional>

namespace paint {

// ---------------------------------------------------------------------------
// Filter identifiers - stable strings so presets can be stored in documents.
// ---------------------------------------------------------------------------
namespace FilterId {
constexpr const char *levels = "levels";
constexpr const char *brightnessContrast = "brightnessContrast";
constexpr const char *exposure = "exposure";
constexpr const char *hsl = "hsl";
constexpr const char *colourise = "colourise";
constexpr const char *channelMix = "channelMix";
constexpr const char *gaussianBlur = "gaussianBlur";
constexpr const char *boxBlur = "boxBlur";
constexpr const char *motionBlur = "motionBlur";
constexpr const char *radialBlur = "radialBlur";
constexpr const char *sharpen = "sharpen";
constexpr const char *median = "median";
constexpr const char *minimum = "minimum";
constexpr const char *maximum = "maximum";
constexpr const char *convolve = "convolve";
constexpr const char *noise = "noise";
constexpr const char *posterise = "posterise";
constexpr const char *threshold = "threshold";
constexpr const char *duotone = "duotone";
constexpr const char *invert = "invert";
constexpr const char *greyscale = "greyscale";
constexpr const char *sepia = "sepia";
constexpr const char *vignette = "vignette";
constexpr const char *chromaticAberration = "chromaticAberration";
constexpr const char *lensDistortion = "lensDistortion";
constexpr const char *pixelate = "pixelate";
constexpr const char *rotate90 = "rotate90";
constexpr const char *flip = "flip";
} // namespace FilterId

// ---------------------------------------------------------------------------
// Parameters. One struct carries every filter's knobs; unused fields are
// ignored per filter. This keeps the QML <-> C++ boundary a single conversion
// instead of forty signals.
// ---------------------------------------------------------------------------
struct FilterParams {
    // Tones
    double exposure = 0.0;          // stops, -4..+4
    double brightness = 0.0;        // -1..+1
    double contrast = 0.0;          // -1..+1
    double gamma = 1.0;             // 0.1..4
    int blackPoint = 0;             // 0..255
    int whitePoint = 255;
    int outputBlack = 0;
    int outputWhite = 255;
    QVector<quint8> curve;          // optional 256-entry LUT override

    // Colour
    double hue = 0.0;               // degrees -180..+180
    double saturation = 0.0;        // -1..+1
    double lightness = 0.0;         // -1..+1
    QColor colourise;               // target hue for colourise/duotone
    double colouriseStrength = 1.0;
    QVector3D channelMixR = QVector3D(1, 0, 0);
    QVector3D channelMixG = QVector3D(0, 1, 0);
    QVector3D channelMixB = QVector3D(0, 0, 1);
    bool preserveLuminosity = true;

    // Blur / sharpen
    double radius = 0.0;            // px (sigma for gaussian)
    double sigma = 0.0;
    int boxRadius = 0;
    double angle = 0.0;             // motion blur direction, degrees
    double radialStrength = 0.0;    // 0..1
    double sharpenAmount = 0.6;
    int sharpenRadius = 1;

    // Rank / convolution
    int rankRadius = 1;
    QVector<double> kernel;         // row-major, odd width
    int kernelWidth = 0;
    int kernelHeight = 0;
    double kernelDivisor = 0.0;     // 0 = normalise to the sum
    double kernelOffset = 0.0;

    // Noise / texture
    quint64 seed = 0x1234567ull;
    double noiseAmount = 0.15;
    int noiseKind = 0;              // 0 gaussian, 1 uniform, 2 salt-pepper, 3 film grain
    double dustAmount = 0.4;

    // Posterise / threshold
    int levels = 6;
    int thresholdValue = 128;
    bool thresholdSmooth = true;

    // Geometry
    double vignetteAmount = 0.6;
    double vignetteFeather = 0.45;
    double chromaOffset = 1.5;      // px, red/blue divergence at the corners
    double distortionK1 = 0.0;
    double distortionK2 = 0.0;
    int pixelateSize = 8;
    int rotationDegrees = 0;        // 0/90/180/270
    bool flipHorizontal = false;
    bool flipVertical = false;

    QVariantMap toMap() const;
    static FilterParams fromMap(const QVariantMap &m);
};

// ---------------------------------------------------------------------------
// Progress reporting: filters longer than ~100ms pump this so QML can show a
// real bar instead of freezing.
// ---------------------------------------------------------------------------
struct FilterProgress {
    std::function<void(double, const QString &)> report;
    void operator()(double fraction, const QString &stage = QString()) const
    {
        if (report)
            report(clampd(fraction, 0.0, 1.0), stage);
    }
};

// ---------------------------------------------------------------------------
// Filter catalogue entry, for the menu UI.
// ---------------------------------------------------------------------------
struct FilterInfo {
    QString id;
    QString name;
    QString group;      // "Blur", "Sharpen", "Colour", "Distort", "Noise", "Other"
    QString description;
    QVariantMap defaults;
};

class Filters : public QObject
{
    Q_OBJECT

    Q_PROPERTY(QStringList groups READ groups CONSTANT)
    Q_PROPERTY(bool busy READ busy NOTIFY busyChanged)
    Q_PROPERTY(double progress READ progress NOTIFY progressChanged)

public:
    explicit Filters(QObject *parent = nullptr);
    ~Filters() override;

    // ---- catalogue ----------------------------------------------------------
    QVariantList catalogue() const;
    QStringList groups() const;
    static FilterInfo infoFor(const QString &id);

    // ---- entry points -------------------------------------------------------
    // Applies `id` to `image` in place. Returns false when the id is unknown,
    // the image is null, or the filter was cancelled through `cancel()`.
    // `area` limits the work to a rect (0/empty = whole image); the result is
    // blended back so callers can do progressive preview.
    bool apply(const QString &id, QImage &image, const FilterParams &params,
               const QImage *mask = nullptr, const QRect &area = QRect(),
               const FilterProgress &progress = FilterProgress());

    // Same but returns a new image; `image` is untouched.
    QImage applyCopy(const QString &id, const QImage &image, const FilterParams &params,
                     const QImage *mask = nullptr,
                     const FilterProgress &progress = FilterProgress());

    // Cancels a running apply() at the next progress checkpoint.
    Q_INVOKABLE void cancel();
    bool busy() const { return m_busy; }
    double progress() const { return m_progress; }

    // ---- individual filters, exposed for direct composition -----------------
    static void gaussianBlur(QImage &img, double sigma, const FilterProgress &p = {});
    static void boxBlur(QImage &img, int radius, const FilterProgress &p = {});
    static void motionBlur(QImage &img, double radius, double angleDeg,
                           const FilterProgress &p = {});
    static void radialBlur(QImage &img, double strength, const FilterProgress &p = {});
    static void sharpen(QImage &img, double amount, int radius,
                        const FilterProgress &p = {});
    static void unsharpMask(QImage &img, double amount, double sigma,
                            const FilterProgress &p = {});
    static void median(QImage &img, int radius, const FilterProgress &p = {});
    static void rankFilter(QImage &img, int radius, bool maximum,
                           const FilterProgress &p = {});
    static void convolve(QImage &img, const QVector<double> &kernel, int kw, int kh,
                         double divisor, double offset, const FilterProgress &p = {});
    static void levels(QImage &img, const FilterParams &p);
    static void brightnessContrast(QImage &img, const FilterParams &p);
    static void exposure(QImage &img, const FilterParams &p);
    static void hueSaturation(QImage &img, const FilterParams &p);
    static void colourise(QImage &img, const FilterParams &p);
    static void channelMix(QImage &img, const FilterParams &p);
    static void posterise(QImage &img, int levels);
    static void threshold(QImage &img, int value, bool smooth);
    static void duotone(QImage &img, const QColor &dark, const QColor &light,
                        double strength);
    static void invert(QImage &img);
    static void greyscale(QImage &img, bool preserveAlpha = true);
    static void sepia(QImage &img, double strength);
    static void noise(QImage &img, const FilterParams &p);
    static void dustAndScratches(QImage &img, double amount, const FilterProgress &p = {});
    static void vignette(QImage &img, double amount, double feather);
    static void chromaticAberration(QImage &img, double offset);
    static void lensDistortion(QImage &img, double k1, double k2);
    static void pixelate(QImage &img, int size);
    static void rotateDegrees(QImage &img, int degrees);
    static void flip(QImage &img, bool horizontal, bool vertical);

    // ---- tone curve helper, reusable by the curves UI ------------------------
    static QVector<quint8> buildLevelsLut(int inBlack, int inWhite, int outBlack,
                                          int outWhite, double gamma);
    static QVector<quint8> buildCurveLut(const QVector<QPointF> &controlPoints);

signals:
    void busyChanged();
    void progressChanged(double fraction, QString stage);
    void applied(QString filterId, qint64 milliseconds);

private:
    bool dispatch(const QString &id, QImage &image, const FilterParams &params,
                  const FilterProgress &progress);
    void blendMasked(QImage &original, const QImage &filtered, const QImage *mask) const;
    bool checkCancel(const FilterProgress &p, double fraction, const QString &stage);

    bool m_cancel = false;
    bool m_busy = false;
    double m_progress = 0.0;
};

} // namespace paint

Q_DECLARE_METATYPE(paint::FilterParams)

#endif // PAINT_FILTERS_H
