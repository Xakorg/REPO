#ifndef PAINT_BRUSH_ENGINE_H
#define PAINT_BRUSH_ENGINE_H

// =============================================================================
//  VOLTRA PAINT - BrushEngine
// =============================================================================
//  A brush is a definition (what the nib looks like) plus dynamics (how the
//  digitiser's signal changes it). The engine owns the preset library, the
//  editable response curves, and the per-stamp evaluation that turns a raw
//  tablet sample into a width/flow/colour triple.
//
//  Nothing here is decorative: the values it produces feed directly into
//  Rasterizer::drawStroke, and a stroke in the document snapshots its style so
//  re-rendering after a preset edit is still byte-identical.
// =============================================================================

#include "PaintTypes.h"
#include "Rasterizer.h"
#include "StrokeModel.h"

#include <QColor>
#include <QHash>
#include <QImage>
#include <QObject>
#include <QString>
#include <QVariant>
#include <QVariantList>
#include <QVector>

namespace paint {

// ---------------------------------------------------------------------------
// Preset: everything the user can see in the brush dock.
// ---------------------------------------------------------------------------
struct BrushPreset {
    QString id;              // stable key, e.g. "pen.nib"
    QString name;
    QString group;           // "Ink", "Paint", "Texture", "Erasers", "Custom"
    int toolHint = ToolPen;  // which tool selects this preset by default
    StrokeStyle style;
    QString description;
    bool builtin = true;

    QJsonObject toJson() const;
    static BrushPreset fromJson(const QJsonObject &o);
};

// ---------------------------------------------------------------------------
// A stamp: one dab at a position, produced by evaluateStamp().
// ---------------------------------------------------------------------------
struct Stamp {
    QPointF pos;
    double radius = 1.0;
    double flow = 1.0;
    double alpha = 1.0;
    QColor colour;
    NibModeId nib = NibRound;
    double nibAngle = 0.0;
    double tiltX = 0.0;
    double tiltY = 0.0;
    double hardness = 1.0;
    int textureIndex = -1;
    double textureOffset = 0.0;
    double textureScale = 1.0;
    double textureStrength = 0.0;
    double rotation = 0.0;
};

// ---------------------------------------------------------------------------
// Live brush state, held across a single stroke.
// ---------------------------------------------------------------------------
struct BrushSession {
    bool active = false;
    double travelled = 0.0;        // distance since the last stamp, in px
    double lastWidthScale = -1.0;
    double lastFlowScale = -1.0;
    double lastX = 0.0;
    double lastY = 0.0;
    qint64 lastT = 0;
    double speed = 0.0;            // px per ms, low-pass filtered
    double texturePhase = 0.0;
    QVector<StrokePoint> buffer;   // samples received since the last stamp
    quint64 stampIndex = 0;
};

// ---------------------------------------------------------------------------
// Stroke build outcome.
// ---------------------------------------------------------------------------
struct StampBatch {
    QVector<Stamp> stamps;
    QRectF touched;
    int fromIndex = 0;             // stroke index after this batch
};

class BrushEngine : public QObject
{
    Q_OBJECT

    Q_PROPERTY(QString currentPresetId READ currentPresetId WRITE setCurrentPresetId NOTIFY currentPresetChanged)
    Q_PROPERTY(QString currentPresetName READ currentPresetName NOTIFY currentPresetChanged)
    Q_PROPERTY(double size READ size WRITE setSize NOTIFY sizeChanged)
    Q_PROPERTY(double flow READ flow WRITE setFlow NOTIFY flowChanged)
    Q_PROPERTY(double opacity READ opacity WRITE setOpacity NOTIFY opacityChanged)
    Q_PROPERTY(double spacing READ spacing WRITE setSpacing NOTIFY spacingChanged)
    Q_PROPERTY(double hardness READ hardness WRITE setHardness NOTIFY hardnessChanged)
    Q_PROPERTY(QColor colour READ colour WRITE setColour NOTIFY colourChanged)
    Q_PROPERTY(int nibMode READ nibMode WRITE setNibMode NOTIFY nibModeChanged)
    Q_PROPERTY(double nibAngle READ nibAngle WRITE setNibAngle NOTIFY nibModeChanged)
    Q_PROPERTY(double nibRatio READ nibRatio WRITE setNibRatio NOTIFY nibModeChanged)
    Q_PROPERTY(double sizePressureDepth READ sizePressureDepth WRITE setSizePressureDepth NOTIFY dynamicsChanged)
    Q_PROPERTY(double flowPressureDepth READ flowPressureDepth WRITE setFlowPressureDepth NOTIFY dynamicsChanged)
    Q_PROPERTY(double velocityThinning READ velocityThinning WRITE setVelocityThinning NOTIFY dynamicsChanged)
    Q_PROPERTY(double tiltSizeGain READ tiltSizeGain WRITE setTiltSizeGain NOTIFY dynamicsChanged)
    Q_PROPERTY(double tiltFlowGain READ tiltFlowGain WRITE setTiltFlowGain NOTIFY dynamicsChanged)
    Q_PROPERTY(double hueJitter READ hueJitter WRITE setHueJitter NOTIFY dynamicsChanged)
    Q_PROPERTY(double saturationJitter READ saturationJitter WRITE setSaturationJitter NOTIFY dynamicsChanged)
    Q_PROPERTY(double valueJitter READ valueJitter WRITE setValueJitter NOTIFY dynamicsChanged)
    Q_PROPERTY(int textureIndex READ textureIndex WRITE setTextureIndex NOTIFY textureChanged)
    Q_PROPERTY(double textureScale READ textureScale WRITE setTextureScale NOTIFY textureChanged)
    Q_PROPERTY(double textureStrength READ textureStrength WRITE setTextureStrength NOTIFY textureChanged)
    Q_PROPERTY(int textureCount READ textureCount CONSTANT)
    Q_PROPERTY(double previewSamplePressure READ previewSamplePressure WRITE setPreviewSamplePressure NOTIFY previewChanged)

public:
    explicit BrushEngine(QObject *parent = nullptr);
    ~BrushEngine() override;

    // ---- preset library ---------------------------------------------------
    QList<BrushPreset> presets() const;
    QStringList presetGroups() const;
    Q_INVOKABLE QVariantList presetList() const;
    Q_INVOKABLE bool hasPreset(const QString &id) const;
    Q_INVOKABLE void selectPreset(const QString &id);
    Q_INVOKABLE void savePreset(const QString &name, const QString &group);
    Q_INVOKABLE void deletePreset(const QString &id);
    Q_INVOKABLE void duplicatePreset(const QString &id);

    // ---- accessors --------------------------------------------------------
    QString currentPresetId() const;
    QString currentPresetName() const;
    StrokeStyle style() const { return m_style; }
    void setStyle(const StrokeStyle &s);

    double size() const { return m_style.baseSize; }
    void setSize(double v);
    double flow() const { return m_style.flow; }
    void setFlow(double v);
    double opacity() const { return m_style.opacity; }
    void setOpacity(double v);
    double spacing() const { return m_style.spacing; }
    void setSpacing(double v);
    double hardness() const { return m_style.hardness; }
    void setHardness(double v);
    QColor colour() const { return m_style.colour; }
    void setColour(const QColor &c);
    int nibMode() const { return int(m_style.nib); }
    void setNibMode(int v);
    double nibAngle() const { return m_style.nibAngle; }
    void setNibAngle(double v);
    double nibRatio() const { return m_style.nibRatio; }
    void setNibRatio(double v);
    double sizePressureDepth() const { return m_style.sizePressureDepth; }
    void setSizePressureDepth(double v);
    double flowPressureDepth() const { return m_style.flowPressureDepth; }
    void setFlowPressureDepth(double v);
    double velocityThinning() const { return m_style.velocityThinning; }
    void setVelocityThinning(double v);
    double tiltSizeGain() const { return m_style.tiltSizeGain; }
    void setTiltSizeGain(double v);
    double tiltFlowGain() const { return m_style.tiltFlowGain; }
    void setTiltFlowGain(double v);
    double hueJitter() const { return m_style.hueJitter; }
    void setHueJitter(double v);
    double saturationJitter() const { return m_style.saturationJitter; }
    void setSaturationJitter(double v);
    double valueJitter() const { return m_style.valueJitter; }
    void setValueJitter(double v);
    int textureIndex() const { return m_style.textureIndex; }
    void setTextureIndex(int v);
    double textureScale() const { return m_textureScale; }
    void setTextureScale(double v);
    double textureStrength() const { return m_textureStrength; }
    void setTextureStrength(double v);
    int textureCount() const { return kTextureCount; }

    double previewSamplePressure() const { return m_previewPressure; }
    void setPreviewSamplePressure(double v);

    // ---- response curves (user editable) ---------------------------------
    Q_INVOKABLE void setPressureCurve(const QVariantList &points);
    Q_INVOKABLE QVariantList pressureCurve() const;
    Q_INVOKABLE void setVelocityCurve(const QVariantList &points);
    Q_INVOKABLE QVariantList velocityCurve() const;
    Q_INVOKABLE double evaluatePressureCurve(double raw) const;
    Q_INVOKABLE double evaluateVelocityCurve(double raw) const;

    // ---- session ----------------------------------------------------------
    void beginSession();
    // Appends raw samples and returns the stamps ready to paint. `advance` is
    // how many of the incoming samples the caller should now consider painted.
    StampBatch appendSamples(const QVector<StrokePoint> &samples, BrushSession &session);
    // Forces any pending buffer out (end of stroke).
    StampBatch flush(BrushSession &session);
    // Builds a complete stamp list for a finished stroke (used for re-render
    // after undo, layer cache invalidation, and export).
    QVector<Stamp> rasteriseStamps(const Stroke &stroke) const;

    // ---- preview ----------------------------------------------------------
    Q_INVOKABLE QImage previewImage(int width, int height, double pressure) const;

    // Texture tiles are generated once and cached for the process lifetime.
    static QImage textureTile(int index);
    static constexpr int kTextureCount = 6;

signals:
    void currentPresetChanged();
    void sizeChanged();
    void flowChanged();
    void opacityChanged();
    void spacingChanged();
    void hardnessChanged();
    void colourChanged();
    void nibModeChanged();
    void dynamicsChanged();
    void textureChanged();
    void previewChanged();
    void presetsChanged();

private:
    void loadBuiltins();
    void adopt(const BrushPreset &p);
    void setStyleField();
    Stamp makeStamp(const StrokeStyle &s, const StrokePoint &p, const BrushSession &session,
                    double speed) const;
    static QVector<QPointF> curveFromVariant(const QVariantList &v);
    static QVariantList variantFromCurve(const Curve &c);

    QVector<BrushPreset> m_presets;
    QString m_currentId;
    StrokeStyle m_style;
    double m_textureScale = 1.0;
    double m_textureStrength = 0.0;
    double m_previewPressure = 0.75;
    Curve m_pressureCurve;
    Curve m_velocityCurve;
    static QVector<QImage> s_textures;
};

} // namespace paint

Q_DECLARE_METATYPE(paint::BrushPreset)

#endif // PAINT_BRUSH_ENGINE_H
