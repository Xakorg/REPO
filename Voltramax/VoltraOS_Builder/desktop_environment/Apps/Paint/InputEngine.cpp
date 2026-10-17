#include "InputEngine.h"

#include <QVariantList>
#include <QtMath>

#include <cmath>

namespace paint {

// ===========================================================================
// Construction
// ===========================================================================

InputEngine::InputEngine(QObject *parent)
    : QObject(parent)
{
    m_clock.start();
    m_hudTimer.setInterval(80);
    connect(&m_hudTimer, &QTimer::timeout, this, [this]() {
        if (!m_strokeActive && m_live.active) {
            m_live.active = false;
            m_live.velocity = 0.0;
            emit liveChanged();
        }
    });
    m_hudTimer.start();
}

InputEngine::~InputEngine() = default;

void InputEngine::resetDeviceLog()
{
    m_deviceLog.clear();
    m_seenStylus = false;
    m_seenTouch = false;
    m_deviceName.clear();
    emit deviceChanged();
}

// ===========================================================================
// Property setters
// ===========================================================================

void InputEngine::setPalmRejectionEnabled(bool v)
{
    if (m_palmEnabled == v) return;
    m_palmEnabled = v;
    emit palmRejectionChanged();
}

void InputEngine::setPalmContactThreshold(double v)
{
    const double nv = clampd(v, 0.0, 10000.0);
    if (qFuzzyCompare(m_palmThreshold, nv)) return;
    m_palmThreshold = nv;
    emit palmRejectionChanged();
}

void InputEngine::setPalmGraceMs(double v)
{
    const double nv = clampd(v, 0.0, 5000.0);
    if (qFuzzyCompare(m_palmGraceMs, nv)) return;
    m_palmGraceMs = nv;
    emit palmRejectionChanged();
}

void InputEngine::setBarrelAction(int v)
{
    const int nv = qBound(0, v, 3);
    if (m_barrelAction == nv) return;
    m_barrelAction = nv;
    emit barrelChanged();
}

void InputEngine::setEraserAction(int v)
{
    const int nv = qBound(0, v, 3);
    if (m_eraserAction == nv) return;
    m_eraserAction = nv;
    emit barrelChanged();
}

void InputEngine::setPressureEnabled(bool v)
{
    if (m_pressureEnabled == v) return;
    m_pressureEnabled = v;
    emit pressureChanged();
}

void InputEngine::setTiltEnabled(bool v)
{
    if (m_tiltEnabled == v) return;
    m_tiltEnabled = v;
    emit pressureChanged();
}

void InputEngine::setPressureMin(double v)
{
    const double nv = clampd(v, 0.0, 1.0);
    if (qFuzzyCompare(m_pressureMin, nv)) return;
    m_pressureMin = nv;
    emit pressureChanged();
}

void InputEngine::setPressureMax(double v)
{
    const double nv = clampd(v, 0.0, 1.0);
    if (qFuzzyCompare(m_pressureMax, nv)) return;
    m_pressureMax = nv;
    emit pressureChanged();
}

void InputEngine::setPressureCurveGamma(double v)
{
    const double nv = clampd(v, 0.1, 5.0);
    if (qFuzzyCompare(m_pressureGamma, nv)) return;
    m_pressureGamma = nv;
    emit pressureChanged();
}

void InputEngine::setSmoothingEnabled(bool v)
{
    if (m_smoothingEnabled == v) return;
    m_smoothingEnabled = v;
    emit smoothingChanged();
}

void InputEngine::setSmoothingMinCutoff(double v)
{
    const double nv = clampd(v, 0.05, 20.0);
    if (qFuzzyCompare(m_minCutoff, nv)) return;
    m_minCutoff = nv;
    emit smoothingChanged();
}

void InputEngine::setSmoothingBeta(double v)
{
    const double nv = clampd(v, 0.0, 1.0);
    if (qFuzzyCompare(m_beta, nv)) return;
    m_beta = nv;
    emit smoothingChanged();
}

void InputEngine::setCoalescedEnabled(bool v)
{
    if (m_coalesced == v) return;
    m_coalesced = v;
    emit smoothingChanged();
}

// ===========================================================================
// Pressure shaping
// ===========================================================================

double InputEngine::shapePressure(double raw) const
{
    if (!m_pressureEnabled)
        return 1.0;

    // 1. Calibrated dead zone / ceiling from the two sliders.
    double p = (raw - m_pressureMin) / qMax(1e-6, m_pressureMax - m_pressureMin);
    p = clampd(p, 0.0, 1.0);

    // 2. Gamma response. gamma < 1 makes light pressure bite sooner,
    //    gamma > 1 makes the nib stiffer.
    if (!qFuzzyCompare(m_pressureGamma, 1.0))
        p = std::pow(p, m_pressureGamma);

    return clampd(p, 0.0, 1.0);
}

QPointF InputEngine::tiltFromQt(double tiltX, double tiltY, double *azimuthDeg,
                                double *altitudeDeg)
{
    // Qt reports tilt as -1..1 per axis where the magnitudes combine to the
    // pen's lean. Convert to polar (azimuth from +X, altitude from normal).
    const double lean = std::hypot(tiltX, tiltY);
    const double alt = 90.0 - qBound(0.0, lean, 1.0) * 90.0;
    const double az = qRadiansToDegrees(std::atan2(tiltY, tiltX));
    if (azimuthDeg)
        *azimuthDeg = std::fmod(az + 360.0, 360.0);
    if (altitudeDeg)
        *altitudeDeg = alt;
    return QPointF(tiltX, tiltY);
}

StrokePoint InputEngine::toStrokePoint(const RawSample &raw, const QTransform &itemToDocument,
                                       double zoom) const
{
    StrokePoint p;
    p.pos = itemToDocument.map(raw.pos);
    p.pressure = float(shapePressure(raw.pressure));

    double az = 0.0;
    double alt = 90.0;
    const double lean = std::hypot(raw.tiltX, raw.tiltY);
    if (m_tiltEnabled && lean > 1e-4) {
        tiltFromQt(raw.tiltX, raw.tiltY, &az, &alt);
        // Tilt is a physical property of the hand, not of the zoom level: it
        // must not be scaled by the view transform.
        p.tiltAzimuth = float(az);
        p.tiltAltitude = float(alt);
    } else {
        p.tiltAltitude = 90.0f;
        p.tiltAzimuth = 0.0f;
    }

    p.twist = float(raw.rotation);
    p.t = raw.t;
    p.pointerKind = raw.pointerType;
    p.eraser = raw.eraser || m_eraserEnd;

    if (!m_pressureEnabled)
        p.pressure = 1.0f;
    if (raw.synthetic && !m_pressureEnabled)
        p.pressure = 1.0f;
    else if (raw.synthetic)
        p.pressure = 1.0f;   // a mouse has no pressure; do not fake one

    Q_UNUSED(zoom);
    return p;
}

// ===========================================================================
// Device log
// ===========================================================================

void InputEngine::noteDevice(const RawSample &sample)
{
    const int kind = sample.pointerType;
    if (kind == PointerPen || kind == PointerEraser)
        m_seenStylus = true;
    else if (kind == PointerTouch)
        m_seenTouch = true;

    if (kind == PointerPen || kind == PointerEraser) {
        if (m_deviceName.isEmpty())
            m_deviceName = QStringLiteral("Stylus");
    }

    QString label = QStringLiteral("%1 @ %2 ms, pressure %3")
                        .arg(paint::pointerKindName(kind))
                        .arg(sample.t)
                        .arg(sample.pressure, 0, 'f', 3);

    if (m_deviceLog.isEmpty() || m_deviceLog.last().toString() != label)
        m_deviceLog.append(label);

    // Keep the log bounded: it is a diagnostic, not an archive.
    while (m_deviceLog.size() > 64)
        m_deviceLog.removeFirst();

    emit deviceChanged();
}

// ===========================================================================
// Rejection
// ===========================================================================

RejectReason InputEngine::classify(const RawSample &sample) const
{
    if (sample.pointerKind == PointerUnknown)
        return RejectIgnoredPointer;

    // A stylus is never rejected while it is down: it is the primary input.
    if (sample.pointerKind == PointerPen || sample.pointerKind == PointerEraser)
        return RejectNone;

    if (sample.pointerKind == PointerTouch) {
        if (!m_palmEnabled)
            return RejectNone;

        // 1. Contact-area rule: a palm or forearm is vastly larger than a
        //    fingertip, so threshold on the reported contact patch.
        if (sample.contactArea > 0.0 && sample.contactArea >= m_palmThreshold)
            return RejectPalmContact;

        // 2. While a stylus is down, every touch is a palm. This is the rule
        //    that makes resting your hand on the tablet harmless.
        if (m_stylusActive || m_strokeActive)
            return RejectTouchWhilePenDown;

        // 3. Just after the pen lifted, keep rejecting for a grace period.
        if (m_penUpAtMs >= 0) {
            const double since = double(m_clock.elapsed() - m_penUpAtMs);
            if (since < m_palmGraceMs)
                return RejectPenGraceWindow;
        }
        return RejectNone;
    }

    if (sample.pointerKind == PointerMouse)
        return RejectNone;

    return RejectIgnoredPointer;
}

void InputEngine::setRejection(RejectReason reason)
{
    if (reason == RejectNone) {
        if (m_live.rejected) {
            m_live.rejected = false;
            m_live.rejectReason = RejectNone;
            m_live.rejectReasonText.clear();
        }
        return;
    }

    static const char *texts[] = {
        "",
        "Palm contact rejected (area)",
        "Touch ignored while pen is down",
        "Touch ignored in the post-pen grace window",
        "Pointer type ignored",
        "Outside the canvas",
        "Layer is locked"
    };
    const int n = int(sizeof(texts) / sizeof(texts[0]));
    m_live.rejected = true;
    m_live.rejectReason = reason;
    m_live.rejectReasonText = QString::fromLatin1(texts[reason >= 0 && reason < n ? int(reason) : 0]);
    m_lastRejection = m_live.rejectReasonText;
    ++m_rejectionStreak;
    emit liveChanged();
}

// ===========================================================================
// Stroke lifecycle
// ===========================================================================

bool InputEngine::beginStroke(const RawSample &first)
{
    RejectReason r = classify(first);
    if (r != RejectNone) {
        setRejection(r);
        noteDevice(first);
        return false;
    }

    if (m_strokeActive)
        endStroke();

    m_clock.start();
    m_strokeActive = true;
    m_pending.clear();
    m_smoothed.clear();
    m_lastSampleT = first.t;
    m_lastSpeed = 0.0;
    m_rejectionStreak = 0;

    if (first.pointerType == PointerTouch) {
        m_touchActive = true;
    } else {
        m_stylusActive = true;
        m_seenStylus = m_seenStylus || (first.pointerType == PointerPen
                                        || first.pointerType == PointerEraser);
    }

    m_barrelDown = (first.buttons & 0x08000000) != 0;   // Qt::MiddleButton on tablet
    m_eraserEnd = first.eraser || first.pointerType == PointerEraser;

    noteDevice(first);
    emit barrelPressedChanged(m_barrelDown);
    emit eraserEndChanged(m_eraserEnd);

    StrokePoint sp = toStrokePoint(first, QTransform(), 1.0);
    sp.t = 0;
    m_pending.append(sp);

    m_live.active = true;
    m_live.pressure = shapePressure(first.pressure);
    m_live.pointerKind = first.pointerType;
    m_live.pointerName = paint::pointerKindName(first.pointerType);
    m_live.eraserEnd = m_eraserEnd;
    m_live.sampleCount = 1;
    m_live.velocity = 0.0;
    tiltFromQt(first.tiltX, first.tiltY, &m_live.tiltAzimuth, &m_live.tiltAltitude);
    m_live.twist = first.rotation;
    m_live.contactArea = first.contactArea;
    m_live.rejected = false;
    m_live.rejectReason = RejectNone;
    m_live.rejectReasonText.clear();

    emit liveChanged();
    emit strokeStarted();

    if (m_smoothingEnabled) {
        m_smoothed = StrokeModel::smooth(m_pending, m_minCutoff, m_beta, 1.0);
        for (const StrokePoint &p : m_smoothed)
            emit strokeSample(p);
    } else {
        emit strokeSample(sp);
    }
    return true;
}

bool InputEngine::addSamples(const QVector<RawSample> &samples)
{
    if (samples.isEmpty())
        return false;

    // Rejection applies to every contact in the batch, not just the first:
    // QTouchEvent::points() can mix a pen and a palm in one frame.
    QVector<RawSample> accepted;
    accepted.reserve(samples.size());
    for (const RawSample &s : samples) {
        const RejectReason r = classify(s);
        if (r != RejectNone) {
            setRejection(r);
            continue;
        }
        if (s.pointerType == PointerPen || s.pointerType == PointerEraser)
            noteDevice(s);
        accepted.append(s);
    }
    if (accepted.isEmpty())
        return false;

    if (!m_strokeActive) {
        // We somehow missed the press; start now with the first accepted sample.
        return beginStroke(accepted.first());
    }

    for (const RawSample &s : accepted) {
        const double dt = double(s.t - m_lastSampleT);
        const double dx = s.pos.x() - (m_pending.isEmpty() ? s.pos.x()
                                                           : m_pending.last().pos.x());
        const double dy = s.pos.y() - (m_pending.isEmpty() ? s.pos.y()
                                                           : m_pending.last().pos.y());
        const double dist = std::hypot(dx, dy);
        if (dt > 0.0) {
            const double inst = dist / dt;
            m_lastSpeed = m_lastSpeed <= 0.0 ? inst : lerp(m_lastSpeed, inst, 0.4);
        }

        StrokePoint sp = toStrokePoint(s, QTransform(), 1.0);
        sp.t = s.t;
        m_pending.append(sp);

        m_barrelDown = (s.buttons & 0x08000000) != 0;
        m_eraserEnd = s.eraser || s.pointerType == PointerEraser;

        updateLive(s, m_lastSpeed);
    }

    if (m_smoothingEnabled) {
        // Only re-emit the tail; the head is already committed and re-emitting
        // it would duplicate dabs in the live preview.
        QVector<StrokePoint> combined = m_pending;
        QVector<StrokePoint> smooth = StrokeModel::smooth(combined, m_minCutoff, m_beta, 1.0);
        for (int i = m_smoothed.size(); i < smooth.size(); ++i)
            emit strokeSample(smooth.at(i));
        m_smoothed = smooth;
    } else {
        for (const RawSample &s : accepted)
            emit strokeSample(toStrokePoint(s, QTransform(), 1.0));
    }

    m_lastSampleT = accepted.last().t;
    return true;
}

bool InputEngine::endStroke()
{
    if (!m_strokeActive)
        return false;

    // Flush whatever the filter still holds so the stroke ends exactly where
    // the pen left the surface.
    if (m_smoothingEnabled && !m_smoothed.isEmpty()) {
        if (m_smoothed.size() > m_pending.size()) {
            // The filter may synthesise nothing extra; emit the last point.
        }
        if (!m_pending.isEmpty() && m_smoothed.last().pos != m_pending.last().pos)
            emit strokeSample(m_pending.last());
    } else if (!m_pending.isEmpty()) {
        emit strokeSample(m_pending.last());
    }

    m_strokeActive = false;
    m_penUpAtMs = m_clock.elapsed();
    m_stylusActive = false;
    m_touchActive = false;
    m_barrelDown = false;
    m_eraserEnd = false;

    emit barrelPressedChanged(false);
    emit eraserEndChanged(false);
    emit strokeFinished();
    return true;
}

void InputEngine::cancelStroke()
{
    if (!m_strokeActive)
        return;
    m_strokeActive = false;
    m_penUpAtMs = m_clock.elapsed();
    m_stylusActive = false;
    m_touchActive = false;
    m_barrelDown = false;
    m_eraserEnd = false;
    m_pending.clear();
    m_smoothed.clear();
    emit barrelPressedChanged(false);
    emit eraserEndChanged(false);
    emit strokeCancelled();
}

void InputEngine::updateLive(const RawSample &sample, double speed)
{
    m_live.active = true;
    m_live.pressure = shapePressure(sample.pressure);
    m_live.velocity = speed;
    m_live.pointerKind = sample.pointerType;
    m_live.pointerName = paint::pointerKindName(sample.pointerType);
    m_live.eraserEnd = sample.eraser || m_eraserEnd;
    m_live.contactArea = sample.contactArea;
    m_live.sampleCount++;
    tiltFromQt(sample.tiltX, sample.tiltY, &m_live.tiltAzimuth, &m_live.tiltAltitude);
    m_live.twist = sample.rotation;
    emit liveChanged();
}

QString InputEngine::describeLive() const
{
    return QStringLiteral("p=%1 az=%2 alt=%3 rot=%4 v=%5 samples=%6%7")
        .arg(m_live.pressure, 0, 'f', 3)
        .arg(m_live.tiltAzimuth, 0, 'f', 1)
        .arg(m_live.tiltAltitude, 0, 'f', 1)
        .arg(m_live.twist, 0, 'f', 1)
        .arg(m_live.velocity, 0, 'f', 3)
        .arg(m_live.sampleCount)
        .arg(m_live.rejected ? QStringLiteral(" REJECTED: ") + m_live.rejectReasonText
                             : QString());
}

// ===========================================================================
// Alternate entry points
// ===========================================================================

bool InputEngine::pointerEvent(int type, const RawSample &sample)
{
    // 0 = press, 1 = move, 2 = release, 3 = cancel
    switch (type) {
    case 0:
        if (sample.pointerType == PointerTouch)
            return touchEvent(0, sample);
        return beginStroke(sample);
    case 1:
        if (sample.pointerType == PointerTouch)
            return touchEvent(1, sample);
        return addSamples({ sample });
    case 2:
        if (sample.pointerType == PointerTouch)
            return touchEvent(2, sample);
        return endStroke();
    case 3:
        cancelStroke();
        return true;
    default:
        return false;
    }
}

bool InputEngine::touchEvent(int type, const RawSample &sample)
{
    switch (type) {
    case 0:
        if (classify(sample) != RejectNone) {
            setRejection(classify(sample));
            noteDevice(sample);
            return false;
        }
        if (!m_palmEnabled || m_palmThreshold <= 0.0)
            return beginStroke(sample);
        return beginStroke(sample);
    case 1:
        return addSamples({ sample });
    case 2:
        return endStroke();
    case 3:
        cancelStroke();
        return true;
    default:
        return false;
    }
}

} // namespace paint
