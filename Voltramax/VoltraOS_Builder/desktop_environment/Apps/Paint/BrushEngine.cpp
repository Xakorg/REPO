#include "BrushEngine.h"

#include <QJsonArray>
#include <QJsonObject>
#include <QPainter>
#include <QVariantList>

#include <cmath>

namespace paint {

QVector<QImage> BrushEngine::s_textures;

// ===========================================================================
// Preset serialisation
// ===========================================================================

QJsonObject BrushPreset::toJson() const
{
    QJsonObject o;
    o["id"] = id;
    o["name"] = name;
    o["group"] = group;
    o["toolHint"] = toolHint;
    o["builtin"] = builtin;
    o["description"] = description;
    o["colour"] = style.colour.name(QColor::HexArgb);
    o["size"] = style.baseSize;
    o["sizeJitter"] = style.sizeJitter;
    o["flow"] = style.flow;
    o["opacity"] = style.opacity;
    o["spacing"] = style.spacing;
    o["hardness"] = style.hardness;
    o["cap"] = int(style.cap);
    o["join"] = int(style.join);
    o["blendMode"] = style.blendMode;
    o["sizePressureDepth"] = style.sizePressureDepth;
    o["flowPressureDepth"] = style.flowPressureDepth;
    o["velocityThinning"] = style.velocityThinning;
    o["hueJitter"] = style.hueJitter;
    o["saturationJitter"] = style.saturationJitter;
    o["valueJitter"] = style.valueJitter;
    o["nib"] = int(style.nib);
    o["nibAngle"] = style.nibAngle;
    o["nibRatio"] = style.nibRatio;
    o["tiltSizeGain"] = style.tiltSizeGain;
    o["tiltFlowGain"] = style.tiltFlowGain;
    o["textureIndex"] = style.textureIndex;
    o["seed"] = double(style.seed);
    o["eraserMode"] = style.eraserMode;
    return o;
}

BrushPreset BrushPreset::fromJson(const QJsonObject &o)
{
    BrushPreset p;
    p.id = o.value("id").toString();
    p.name = o.value("name").toString();
    p.group = o.value("group").toString(QStringLiteral("Custom"));
    p.toolHint = o.value("toolHint").toInt(ToolPen);
    p.builtin = o.value("builtin").toBool(false);
    p.description = o.value("description").toString();
    p.style.colour = QColor(o.value("colour").toString(QStringLiteral("#101218ff")));
    p.style.baseSize = o.value("size").toDouble(6.0);
    p.style.sizeJitter = o.value("sizeJitter").toDouble(0.0);
    p.style.flow = o.value("flow").toDouble(1.0);
    p.style.opacity = o.value("opacity").toDouble(1.0);
    p.style.spacing = o.value("spacing").toDouble(0.12);
    p.style.hardness = o.value("hardness").toDouble(0.75);
    p.style.cap = CapStyleId(o.value("cap").toInt(CapRound));
    p.style.join = JoinStyleId(o.value("join").toInt(JoinRound));
    p.style.blendMode = o.value("blendMode").toInt(BlendNormal);
    p.style.sizePressureDepth = o.value("sizePressureDepth").toDouble(0.75);
    p.style.flowPressureDepth = o.value("flowPressureDepth").toDouble(0.5);
    p.style.velocityThinning = o.value("velocityThinning").toDouble(0.25);
    p.style.hueJitter = o.value("hueJitter").toDouble(0.0);
    p.style.saturationJitter = o.value("saturationJitter").toDouble(0.0);
    p.style.valueJitter = o.value("valueJitter").toDouble(0.0);
    p.style.nib = NibModeId(o.value("nib").toInt(NibRound));
    p.style.nibAngle = o.value("nibAngle").toDouble(45.0);
    p.style.nibRatio = o.value("nibRatio").toDouble(0.45);
    p.style.tiltSizeGain = o.value("tiltSizeGain").toDouble(0.6);
    p.style.tiltFlowGain = o.value("tiltFlowGain").toDouble(0.35);
    p.style.textureIndex = o.value("textureIndex").toInt(-1);
    p.style.seed = quint64(o.value("seed").toDouble(double(0x9E3779B97F4A7C15ull)));
    p.style.eraserMode = o.value("eraserMode").toBool(false);
    return p;
}

// ===========================================================================
// Construction
// ===========================================================================

BrushEngine::BrushEngine(QObject *parent)
    : QObject(parent)
{
    m_pressureCurve = Curve(QList<QPointF>{ QPointF(0.0, 0.0), QPointF(0.25, 0.20),
                                            QPointF(0.6, 0.66), QPointF(1.0, 1.0) });
    m_velocityCurve = Curve(QList<QPointF>{ QPointF(0.0, 1.0), QPointF(0.5, 0.72),
                                            QPointF(1.0, 0.5) });
    loadBuiltins();
    if (!m_presets.isEmpty())
        adopt(m_presets.first());
}

BrushEngine::~BrushEngine() = default;

void BrushEngine::loadBuiltins()
{
    auto make = [](const char *id, const char *name, const char *group, int tool,
                   const char *desc, StrokeStyle s) {
        BrushPreset p;
        p.id = QString::fromLatin1(id);
        p.name = QString::fromLatin1(name);
        p.group = QString::fromLatin1(group);
        p.toolHint = tool;
        p.description = QString::fromLatin1(desc);
        p.style = s;
        p.builtin = true;
        return p;
    };

    StrokeStyle pen;
    pen.baseSize = 5.0; pen.hardness = 1.0; pen.spacing = 0.06;
    pen.sizePressureDepth = 0.8; pen.flowPressureDepth = 0.55; pen.velocityThinning = 0.3;
    pen.cap = CapRound; pen.join = JoinRound; pen.flow = 1.0;

    StrokeStyle pencil;
    pencil.baseSize = 3.0; pencil.hardness = 0.6; pencil.spacing = 0.05;
    pencil.sizePressureDepth = 0.6; pencil.flowPressureDepth = 0.3;
    pencil.velocityThinning = 0.4; pencil.textureIndex = 3;
    pencil.textureStrength = 0.0; pencil.hueJitter = 0.0;

    StrokeStyle brush;
    brush.baseSize = 24.0; brush.hardness = 0.42; brush.spacing = 0.09;
    brush.sizePressureDepth = 0.85; brush.flowPressureDepth = 0.65;
    brush.velocityThinning = 0.2; brush.flow = 0.85; brush.opacity = 1.0;

    StrokeStyle marker;
    marker.baseSize = 30.0; marker.hardness = 0.95; marker.spacing = 0.06;
    marker.sizePressureDepth = 0.45; marker.flowPressureDepth = 0.9;
    marker.velocityThinning = 0.1; marker.flow = 0.35; marker.opacity = 1.0;
    marker.blendMode = BlendMultiply;

    StrokeStyle airbrush;
    airbrush.baseSize = 48.0; airbrush.hardness = 0.12; airbrush.spacing = 0.02;
    airbrush.sizePressureDepth = 0.7; airbrush.flowPressureDepth = 0.7;
    airbrush.velocityThinning = 0.0; airbrush.flow = 0.10; airbrush.opacity = 1.0;

    StrokeStyle calligraphy;
    calligraphy.baseSize = 16.0; calligraphy.hardness = 1.0; calligraphy.spacing = 0.03;
    calligraphy.nib = NibChisel; calligraphy.nibAngle = 30.0; calligraphy.nibRatio = 0.28;
    calligraphy.sizePressureDepth = 0.5; calligraphy.tiltSizeGain = 0.85;
    calligraphy.tiltFlowGain = 0.4; calligraphy.flow = 1.0;

    StrokeStyle chisel;
    chisel.baseSize = 22.0; chisel.hardness = 1.0; chisel.spacing = 0.04;
    chisel.nib = NibChisel; chisel.nibAngle = 45.0; chisel.nibRatio = 0.4;
    chisel.sizePressureDepth = 0.7; chisel.tiltSizeGain = 1.2; chisel.tiltFlowGain = 0.5;

    StrokeStyle blunt;
    blunt.baseSize = 18.0; blunt.hardness = 0.9; blunt.spacing = 0.05;
    blunt.nib = NibBlunt; blunt.nibAngle = 45.0; blunt.nibRatio = 0.35;
    blunt.sizePressureDepth = 0.6; blunt.tiltSizeGain = 1.4;

    StrokeStyle fountain;
    fountain.baseSize = 14.0; fountain.hardness = 1.0; fountain.spacing = 0.03;
    fountain.nib = NibFountain; fountain.nibAngle = 55.0; fountain.nibRatio = 0.22;
    fountain.sizePressureDepth = 0.85; fountain.tiltSizeGain = 0.7;

    StrokeStyle grain;
    grain.baseSize = 34.0; grain.hardness = 0.7; grain.spacing = 0.05;
    grain.textureIndex = 1; grain.sizePressureDepth = 0.65;

    StrokeStyle fibre;
    fibre.baseSize = 40.0; fibre.hardness = 0.8; fibre.spacing = 0.04;
    fibre.textureIndex = 2; fibre.sizePressureDepth = 0.55;

    StrokeStyle eraser;
    eraser.baseSize = 28.0; eraser.hardness = 0.5; eraser.spacing = 0.06;
    eraser.sizePressureDepth = 0.7; eraser.eraserMode = true; eraser.colour = Qt::black;

    StrokeStyle hardEraser;
    hardEraser.baseSize = 18.0; hardEraser.hardness = 1.0; hardEraser.spacing = 0.05;
    hardEraser.sizePressureDepth = 0.5; hardEraser.eraserMode = true;

    m_presets = {
        make("pen.nib", "Fine Nib Pen", "Ink", ToolPen,
             "A hard-edged pen with a strong pressure response. Good for inking.",
             pen),
        make("pencil.graphite", "Graphite Pencil", "Ink", ToolPencil,
             "Soft, slightly textured pencil stroke that thins when flicked.", pencil),
        make("brush.round", "Round Brush", "Paint", ToolBrush,
             "Soft round brush with a wide pressure envelope.", brush),
        make("marker.broad", "Broad Marker", "Paint", ToolMarker,
             "Semi-transparent marker that darkens where strokes cross.", marker),
        make("airbrush.soft", "Soft Airbrush", "Paint", ToolAirbrush,
             "Wide, faint mist. Pressure controls how much ink lands.", airbrush),
        make("calligraphy.chisel", "Chisel Calligraphy", "Ink", ToolCalligraphy,
             "Flat nib at a fixed angle. Tilt rotates the nib with your hand.",
             calligraphy),
        make("chisel.tilt", "Tilt Chisel", "Ink", ToolCalligraphy,
             "Broad nib that genuinely follows the pen's azimuth and altitude.",
             chisel),
        make("nib.blunt", "Blunt Nib", "Ink", ToolPen,
             "Wide flat nib with strong azimuth dependence.", blunt),
        make("nib.fountain", "Fountain Nib", "Ink", ToolPen,
             "Fine tip with a broad trailing edge as the pen tilts.", fountain),
        make("texture.grain", "Grain Stamp", "Texture", ToolBrush,
             "Deterministic value-noise texture stamped along the stroke.", grain),
        make("texture.fibre", "Fibre Stamp", "Texture", ToolBrush,
             "Directional fibre texture for organic edges.", fibre),
        make("eraser.soft", "Soft Eraser", "Erasers", ToolEraserStroke,
             "Rounded eraser with a soft falloff.", eraser),
        make("eraser.hard", "Hard Eraser", "Erasers", ToolEraserPixel,
             "Exact, hard-edged removal.", hardEraser),
    };

    adopt(m_presets.first());
}

// ===========================================================================
// Properties
// ===========================================================================

QString BrushEngine::currentPresetId() const { return m_currentId; }

QString BrushEngine::currentPresetName() const
{
    for (const BrushPreset &p : m_presets)
        if (p.id == m_currentId)
            return p.name;
    return QString();
}

QList<BrushPreset> BrushEngine::presets() const { return m_presets; }

QStringList BrushEngine::presetGroups() const
{
    QStringList out;
    for (const BrushPreset &p : m_presets)
        if (!out.contains(p.group))
            out.append(p.group);
    return out;
}

QVariantList BrushEngine::presetList() const
{
    QVariantList out;
    for (const BrushPreset &p : m_presets) {
        QVariantMap m;
        m.insert("id", p.id);
        m.insert("name", p.name);
        m.insert("group", p.group);
        m.insert("toolHint", p.toolHint);
        m.insert("builtin", p.builtin);
        m.insert("description", p.description);
        m.insert("size", p.style.baseSize);
        m.insert("colour", p.style.colour.name(QColor::HexArgb));
        m.insert("selected", p.id == m_currentId);
        out.append(m);
    }
    return out;
}

bool BrushEngine::hasPreset(const QString &id) const
{
    for (const BrushPreset &p : m_presets)
        if (p.id == id)
            return true;
    return false;
}

void BrushEngine::selectPreset(const QString &id)
{
    for (const BrushPreset &p : m_presets) {
        if (p.id == id) {
            adopt(p);
            return;
        }
    }
}

void BrushEngine::adopt(const BrushPreset &p)
{
    m_currentId = p.id;
    m_style = p.style;
    if (p.style.hasTexture()) {
        m_textureScale = 1.0;
        m_textureStrength = 0.6;
    }
    emit currentPresetChanged();
    emit sizeChanged();
    emit flowChanged();
    emit opacityChanged();
    emit spacingChanged();
    emit hardnessChanged();
    emit nibModeChanged();
    emit dynamicsChanged();
    emit textureChanged();
    emit previewChanged();
}

void BrushEngine::setStyle(const StrokeStyle &s)
{
    m_style = s;
    emit sizeChanged();
    emit flowChanged();
    emit opacityChanged();
    emit spacingChanged();
    emit hardnessChanged();
    emit colourChanged();
    emit nibModeChanged();
    emit dynamicsChanged();
    emit textureChanged();
    emit previewChanged();
}

void BrushEngine::savePreset(const QString &name, const QString &group)
{
    BrushPreset p;
    p.id = QStringLiteral("custom.%1").arg(name.toLower().replace(' ', '_'))
           + QStringLiteral(".%1").arg(m_presets.size());
    p.name = name;
    p.group = group.isEmpty() ? QStringLiteral("Custom") : group;
    p.toolHint = ToolPen;
    p.style = m_style;
    p.builtin = false;
    m_presets.append(p);
    m_currentId = p.id;
    emit presetsChanged();
    emit currentPresetChanged();
}

void BrushEngine::duplicatePreset(const QString &id)
{
    for (int i = 0; i < m_presets.size(); ++i) {
        if (m_presets.at(i).id == id) {
            BrushPreset p = m_presets.at(i);
            p.id = p.id + QStringLiteral(".copy%1").arg(m_presets.size());
            p.name = p.name + QStringLiteral(" copy");
            p.builtin = false;
            m_presets.append(p);
            emit presetsChanged();
            return;
        }
    }
}

void BrushEngine::deletePreset(const QString &id)
{
    for (int i = 0; i < m_presets.size(); ++i) {
        if (m_presets.at(i).id == id && !m_presets.at(i).builtin) {
            m_presets.removeAt(i);
            emit presetsChanged();
            return;
        }
    }
}

// ---- setters -------------------------------------------------------------
void BrushEngine::setSize(double v)
{
    const double nv = clampd(v, 1.0, 400.0);
    if (qFuzzyCompare(m_style.baseSize, nv)) return;
    m_style.baseSize = nv;
    emit sizeChanged();
    emit previewChanged();
}
void BrushEngine::setFlow(double v)
{
    const double nv = clampd(v, 0.01, 1.0);
    if (qFuzzyCompare(m_style.flow, nv)) return;
    m_style.flow = nv;
    emit flowChanged();
    emit previewChanged();
}
void BrushEngine::setOpacity(double v)
{
    const double nv = clampd(v, 0.01, 1.0);
    if (qFuzzyCompare(m_style.opacity, nv)) return;
    m_style.opacity = nv;
    emit opacityChanged();
    emit previewChanged();
}
void BrushEngine::setSpacing(double v)
{
    const double nv = clampd(v, 0.01, 1.0);
    if (qFuzzyCompare(m_style.spacing, nv)) return;
    m_style.spacing = nv;
    emit spacingChanged();
    emit previewChanged();
}
void BrushEngine::setHardness(double v)
{
    const double nv = clampd(v, 0.0, 1.0);
    if (qFuzzyCompare(m_style.hardness, nv)) return;
    m_style.hardness = nv;
    emit hardnessChanged();
    emit previewChanged();
}
void BrushEngine::setColour(const QColor &c)
{
    if (m_style.colour == c) return;
    m_style.colour = c;
    emit colourChanged();
    emit previewChanged();
}
void BrushEngine::setNibMode(int v)
{
    const int nv = qBound(0, v, 3);
    if (int(m_style.nib) == nv) return;
    m_style.nib = NibModeId(nv);
    emit nibModeChanged();
    emit previewChanged();
}
void BrushEngine::setNibAngle(double v)
{
    const double nv = clampd(v, -180.0, 180.0);
    if (qFuzzyCompare(m_style.nibAngle, nv)) return;
    m_style.nibAngle = nv;
    emit nibModeChanged();
    emit previewChanged();
}
void BrushEngine::setNibRatio(double v)
{
    const double nv = clampd(v, 0.05, 1.0);
    if (qFuzzyCompare(m_style.nibRatio, nv)) return;
    m_style.nibRatio = nv;
    emit nibModeChanged();
    emit previewChanged();
}
void BrushEngine::setSizePressureDepth(double v)
{
    const double nv = clampd(v, 0.0, 1.0);
    if (qFuzzyCompare(m_style.sizePressureDepth, nv)) return;
    m_style.sizePressureDepth = nv;
    emit dynamicsChanged();
    emit previewChanged();
}
void BrushEngine::setFlowPressureDepth(double v)
{
    const double nv = clampd(v, 0.0, 1.0);
    if (qFuzzyCompare(m_style.flowPressureDepth, nv)) return;
    m_style.flowPressureDepth = nv;
    emit dynamicsChanged();
    emit previewChanged();
}
void BrushEngine::setVelocityThinning(double v)
{
    const double nv = clampd(v, 0.0, 1.0);
    if (qFuzzyCompare(m_style.velocityThinning, nv)) return;
    m_style.velocityThinning = nv;
    emit dynamicsChanged();
    emit previewChanged();
}
void BrushEngine::setTiltSizeGain(double v)
{
    const double nv = clampd(v, 0.0, 2.0);
    if (qFuzzyCompare(m_style.tiltSizeGain, nv)) return;
    m_style.tiltSizeGain = nv;
    emit dynamicsChanged();
    emit previewChanged();
}
void BrushEngine::setTiltFlowGain(double v)
{
    const double nv = clampd(v, 0.0, 2.0);
    if (qFuzzyCompare(m_style.tiltFlowGain, nv)) return;
    m_style.tiltFlowGain = nv;
    emit dynamicsChanged();
    emit previewChanged();
}
void BrushEngine::setHueJitter(double v)
{
    const double nv = clampd(v, 0.0, 1.0);
    if (qFuzzyCompare(m_style.hueJitter, nv)) return;
    m_style.hueJitter = nv;
    emit dynamicsChanged();
    emit previewChanged();
}
void BrushEngine::setSaturationJitter(double v)
{
    const double nv = clampd(v, 0.0, 1.0);
    if (qFuzzyCompare(m_style.saturationJitter, nv)) return;
    m_style.saturationJitter = nv;
    emit dynamicsChanged();
    emit previewChanged();
}
void BrushEngine::setValueJitter(double v)
{
    const double nv = clampd(v, 0.0, 1.0);
    if (qFuzzyCompare(m_style.valueJitter, nv)) return;
    m_style.valueJitter = nv;
    emit dynamicsChanged();
    emit previewChanged();
}
void BrushEngine::setTextureIndex(int v)
{
    const int nv = qBound(-1, v, kTextureCount - 1);
    if (m_style.textureIndex == nv) return;
    m_style.textureIndex = nv;
    emit textureChanged();
    emit previewChanged();
}
void BrushEngine::setTextureScale(double v)
{
    const double nv = clampd(v, 0.1, 8.0);
    if (qFuzzyCompare(m_textureScale, nv)) return;
    m_textureScale = nv;
    emit textureChanged();
}
void BrushEngine::setTextureStrength(double v)
{
    const double nv = clampd(v, 0.0, 1.0);
    if (qFuzzyCompare(m_textureStrength, nv)) return;
    m_textureStrength = nv;
    emit textureChanged();
}
void BrushEngine::setPreviewSamplePressure(double v)
{
    const double nv = clampd(v, 0.0, 1.0);
    if (qFuzzyCompare(m_previewPressure, nv)) return;
    m_previewPressure = nv;
    emit previewChanged();
}

// ===========================================================================
// Response curves
// ===========================================================================

QVector<QPointF> BrushEngine::curveFromVariant(const QVariantList &v)
{
    QList<QPointF> pts;
    for (const QVariant &item : v) {
        const QVariantList pair = item.toList();
        if (pair.size() == 2)
            pts.append(QPointF(pair.at(0).toDouble(), pair.at(1).toDouble()));
    }
    return QVector<QPointF>(pts);
}

QVariantList BrushEngine::variantFromCurve(const Curve &c)
{
    QVariantList out;
    for (const QPointF &p : c.points) {
        QVariantList pair;
        pair.append(p.x());
        pair.append(p.y());
        out.append(pair);
    }
    return out;
}

void BrushEngine::setPressureCurve(const QVariantList &points)
{
    const QVector<QPointF> pts = curveFromVariant(points);
    if (pts.size() < 2)
        return;
    m_pressureCurve = Curve(QList<QPointF>(pts.begin(), pts.end()));
    emit previewChanged();
}

QVariantList BrushEngine::pressureCurve() const { return variantFromCurve(m_pressureCurve); }

void BrushEngine::setVelocityCurve(const QVariantList &points)
{
    const QVector<QPointF> pts = curveFromVariant(points);
    if (pts.size() < 2)
        return;
    m_velocityCurve = Curve(QList<QPointF>(pts.begin(), pts.end()));
    emit previewChanged();
}

QVariantList BrushEngine::velocityCurve() const { return variantFromCurve(m_velocityCurve); }

double BrushEngine::evaluatePressureCurve(double raw) const
{
    return m_pressureCurve.map(clampd(raw, 0.0, 1.0));
}

double BrushEngine::evaluateVelocityCurve(double raw) const
{
    return m_velocityCurve.map(clampd(raw, 0.0, 1.0));
}

// ===========================================================================
// Session / stamping
// ===========================================================================

void BrushEngine::beginSession()
{
    // The session object is owned by the caller; this is a convenience hook
    // that seeds the nib angle from the current brush settings.
}

Stamp BrushEngine::makeStamp(const StrokeStyle &s, const StrokePoint &p,
                             const BrushSession &session, double speed) const
{
    DynamicsSample dyn = StrokeModel::evaluateDynamics(s, p, speed, session.lastWidthScale);

    // Apply the user's editable pressure curve on top of the built-in shaping,
    // so an artist can make the pen twitchy or dead-flat at will.
    const double curved = m_pressureCurve.map(double(p.pressure));
    const double velCurve = m_velocityCurve.map(clampd(speed / 3.0, 0.0, 1.0));
    const double depth = clampd(s.sizePressureDepth, 0.0, 1.0);
    dyn.widthScale *= lerp(1.0, lerp(0.25, 1.9, curved), depth);
    dyn.widthScale *= lerp(1.0, velCurve, clampd(s.velocityThinning, 0.0, 1.0));
    dyn.widthScale = float(clampd(double(dyn.widthScale), 0.05, 3.0));

    Stamp st;
    st.pos = p.pos;
    st.radius = qMax(0.25, s.baseSize * 0.5 * double(dyn.widthScale));
    st.flow = clampd(s.flow * double(dyn.flowScale), 0.0, 1.0);
    st.alpha = clampd(s.opacity, 0.0, 1.0);
    st.colour = dyn.tint;
    st.hardness = s.hardness;
    st.nib = s.nib;
    st.nibAngle = s.nibAngle;
    st.tiltX = p.leanVector().x();
    st.tiltY = p.leanVector().y();
    st.textureIndex = s.textureIndex;
    st.textureOffset = session.texturePhase;
    st.textureScale = m_textureScale;
    st.textureStrength = s.textureIndex >= 0 ? m_textureStrength : 0.0;
    st.rotation = s.nibAngle;

    if (s.sizeJitter > 0.0) {
        // Deterministic per-stamp jitter, keyed by the stroke seed and stamp
        // index so undo/redo reproduces the exact same mark.
        quint64 h = s.seed ^ (session.stampIndex * 0x9E3779B97F4A7C15ull);
        h ^= h >> 29; h *= 0xBF58476D1CE4E5B9ull; h ^= h >> 32;
        const double n = double(h % 1000u) / 1000.0 * 2.0 - 1.0;
        st.radius *= (1.0 + n * s.sizeJitter);
        st.radius = qMax(0.2, st.radius);
    }
    return st;
}

StampBatch BrushEngine::appendSamples(const QVector<StrokePoint> &samples,
                                      BrushSession &session)
{
    StampBatch batch;
    if (samples.isEmpty())
        return batch;

    const double step = qMax(0.35, m_style.spacing * m_style.baseSize);

    for (const StrokePoint &p : samples) {
        if (session.buffer.isEmpty()) {
            session.lastX = p.pos.x();
            session.lastY = p.pos.y();
            session.lastT = p.t;
            session.buffer.append(p);
            continue;
        }

        const double dx = p.pos.x() - session.lastX;
        const double dy = p.pos.y() - session.lastY;
        const double dist = std::hypot(dx, dy);
        const double dt = double(p.t - session.lastT);

        if (dt > 0.0) {
            const double inst = dist / dt;
            session.speed = session.speed <= 0.0 ? inst : lerp(session.speed, inst, 0.35);
        }

        session.travelled += dist;
        session.lastX = p.pos.x();
        session.lastY = p.pos.y();
        session.lastT = p.t;
        session.buffer.append(p);

        // Emit stamps whenever we have crossed one spacing step. Airbrushes
        // use a much tighter step so the mist does not band.
        const double effectiveStep = (m_style.spacing <= 0.03) ? qMax(0.35, m_style.baseSize * 0.03)
                                                               : step;
        while (session.travelled >= effectiveStep) {
            session.travelled -= effectiveStep;
            const StrokePoint &q = session.buffer.last();
            Stamp st = makeStamp(m_style, q, session, session.speed);
            batch.stamps.append(st);
            session.stampIndex++;
            session.texturePhase += 0.017;
            session.lastWidthScale = double(StrokeModel::evaluateDynamics(
                m_style, q, session.speed, session.lastWidthScale).widthScale);
            session.lastFlowScale = double(StrokeModel::evaluateDynamics(
                m_style, q, session.speed, session.lastFlowScale).flowScale);
        }
    }

    batch.fromIndex = 0;
    return batch;
}

StampBatch BrushEngine::flush(BrushSession &session)
{
    StampBatch batch;
    if (session.buffer.isEmpty())
        return batch;

    const StrokePoint &p = session.buffer.last();
    Stamp st = makeStamp(m_style, p, session, session.speed);
    batch.stamps.append(st);
    session.stampIndex++;
    session.buffer.clear();
    session.travelled = 0.0;
    return batch;
}

QVector<Stamp> BrushEngine::rasteriseStamps(const Stroke &stroke) const
{
    QVector<Stamp> out;
    if (stroke.points.isEmpty())
        return out;

    const StrokeStyle &s = stroke.style;
    const double step = qMax(0.35, s.spacing * s.baseSize);

    BrushSession session;
    session.active = true;
    session.lastWidthScale = -1.0;
    double travelled = 0.0;
    double speed = StrokeModel::averageSpeed(stroke.points) / 1000.0;

    out.append(makeStamp(s, stroke.points.first(), session, 0.0));
    session.stampIndex++;

    for (int i = 1; i < stroke.points.size(); ++i) {
        const StrokePoint &a = stroke.points.at(i - 1);
        const StrokePoint &b = stroke.points.at(i);
        const double dist = std::hypot(b.pos.x() - a.pos.x(), b.pos.y() - a.pos.y());
        travelled += dist;
        while (travelled >= step) {
            travelled -= step;
            BrushSession tmp = session;
            out.append(makeStamp(s, b, session, speed));
            session.stampIndex++;
            session.texturePhase += 0.017;
            Q_UNUSED(tmp);
        }
    }

    if (stroke.points.size() > 1) {
        BrushSession tmp = session;
        out.append(makeStamp(s, stroke.points.last(), session, speed));
        Q_UNUSED(tmp);
    }
    return out;
}

// ===========================================================================
// Preview
// ===========================================================================

QImage BrushEngine::previewImage(int width, int height, double pressure) const
{
    const int w = qMax(16, width);
    const int h = qMax(16, height);
    QImage img(w, h, QImage::Format_ARGB32_Premultiplied);
    img.fill(Qt::transparent);

    // Sweep the pressure range across the preview width: the shape of the
    // resulting ribbon is the honest picture of what the current dynamics do.
    Stroke s;
    s.style = m_style;
    const int samples = 96;
    for (int i = 0; i < samples; ++i) {
        const double t = double(i) / (samples - 1);
        StrokePoint p;
        p.pos = QPointF(8.0 + t * (w - 16.0), h * 0.5);
        p.pressure = float(pressure <= 0.0 ? t : pressure);
        p.tiltAltitude = 90.0 - float(t) * 45.0f;
        p.tiltAzimuth = float(t * 180.0);
        p.t = i * 16;
        s.points.append(p);
    }

    FillOptions opt;
    opt.antialias = true;
    opt.subSamples = 4;
    Rasterizer::drawStroke(img, s, opt);
    return img;
}

// ===========================================================================
// Textures
// ===========================================================================

QImage BrushEngine::textureTile(int index)
{
    const int i = qBound(0, index, kTextureCount - 1);
    if (s_textures.isEmpty()) {
        s_textures.resize(kTextureCount);
        s_textures[0] = Rasterizer::makeNoiseTile(64, 0x1234567ull, 0); // hard grain
        s_textures[1] = Rasterizer::makeNoiseTile(64, 0xABCDEF1ull, 1); // value noise
        s_textures[2] = Rasterizer::makeNoiseTile(64, 0x998877ull, 2);  // fibres
        s_textures[3] = Rasterizer::makeNoiseTile(64, 0x5150ull, 3);    // paper
        s_textures[4] = Rasterizer::makeNoiseTile(64, 0x77777ull, 0);   // coarse
        s_textures[5] = Rasterizer::makeNoiseTile(64, 0x31337ull, 1);   // soft
    }
    return s_textures.at(i);
}

} // namespace paint
