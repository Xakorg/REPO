#ifndef PAINT_INPUT_ENGINE_H
#define PAINT_INPUT_ENGINE_H

// =============================================================================
//  VOLTRA PAINT - InputEngine
// =============================================================================
//  The only place where hardware input becomes pen data.
//
//  Path (see README section 4):
//
//    QQuickPaintedItem::tabletEvent(QTabletEvent*)
//        |   pressure, tiltX/tiltY (-> altitude + azimuth), rotation, pointer type
//        v
//    InputEngine::beginStroke / addTabletSamples / endStroke
//        |   coalesced event handling: QTabletEvent::points() is drained fully
//        |   so a fast flick is not a polygon
//        v
//    palm rejection  ---- touch contact with area > threshold is dropped while
//        |                a stylus is down, and for `m_palmGraceMs` after it
//        v
//    barrel button / eraser detection  -> tool swap, tool modifier, or eyedrop
//        |
//        v
//    smoothing (One-Euro) -> raw sample buffer -> signals to PaintEngine
//
//  Touch still works when no stylus is present, so the app is usable on a
//  pure-touch display; the rejection rule only bites when a pen is live.
// =============================================================================

#include "PaintTypes.h"
#include "StrokeModel.h"

#include <QElapsedTimer>
#include <QList>
#include <QObject>
#include <QPointF>
#include <QString>
#include <QTimer>
#include <QVariantList>
#include <QVector>

namespace paint {

// ---------------------------------------------------------------------------
// One sample as it came out of the windowing system, before smoothing.
// ---------------------------------------------------------------------------
struct RawSample {
    QPointF pos;                // item-local pixels
    double pressure = 0.0;      // 0..1
    double tiltX = 0.0;         // Qt convention: -1..1 in the item's plane
    double tiltY = 0.0;
    double rotation = 0.0;      // degrees, -180..180 (barrel twist)
    int pointerType = PointerUnknown;
    int buttons = 0;            // Qt::MouseButton bitfield as reported
    int pointerId = 0;          // contact id for multi-touch
    double contactArea = 0.0;   // touch contacts: width*height in mm^2
    qint64 t = 0;               // monotonic ms
    bool eraser = false;
    bool synthetic = false;     // mouse fallback where pressure is unknown
};

// ---------------------------------------------------------------------------
// Rejection decision, surfaced so the UI can explain why nothing happened.
// ---------------------------------------------------------------------------
enum RejectReason {
    RejectNone = 0,
    RejectPalmContact,
    RejectTouchWhilePenDown,
    RejectPenGraceWindow,
    RejectIgnoredPointer,
    RejectOutsideCanvas,
    RejectLockedLayer
};

// ---------------------------------------------------------------------------
// Barrel-button behaviour.
// ---------------------------------------------------------------------------
enum BarrelAction {
    BarrelNone = 0,
    BarrelEraser,      // swap to the eraser while held
    BarrelEyedropper,  // sample colour while held
    BarrelPan,         // drag to pan the canvas
    BarrelToolSwitch   // switch to the alternate tool
};

// ---------------------------------------------------------------------------
// Live readout for the stylus HUD.
// ---------------------------------------------------------------------------
struct LiveInput {
    bool active = false;
    double pressure = 0.0;
    double velocity = 0.0;      // px/ms
    double tiltAltitude = 90.0; // degrees from surface normal
    double tiltAzimuth = 0.0;   // degrees
    double twist = 0.0;
    int pointerKind = PointerUnknown;
    QString pointerName;
    int toolUnderPointer = ToolPencil;
    bool rejected = false;
    RejectReason rejectReason = RejectNone;
    QString rejectReasonText;
    qint64 sampleCount = 0;
    double contactArea = 0.0;
    bool eraserEnd = false;
};

class InputEngine : public QObject
{
    Q_OBJECT

    Q_PROPERTY(bool stylusActive READ stylusActive NOTIFY liveChanged)
    Q_PROPERTY(bool touchActive READ touchActive NOTIFY liveChanged)
    Q_PROPERTY(bool palmRejectionEnabled READ palmRejectionEnabled WRITE setPalmRejectionEnabled NOTIFY palmRejectionChanged)
    Q_PROPERTY(double palmContactThreshold READ palmContactThreshold WRITE setPalmContactThreshold NOTIFY palmRejectionChanged)
    Q_PROPERTY(double palmGraceMs READ palmGraceMs WRITE setPalmGraceMs NOTIFY palmRejectionChanged)
    Q_PROPERTY(int barrelAction READ barrelAction WRITE setBarrelAction NOTIFY barrelChanged)
    Q_PROPERTY(int eraserAction READ eraserAction WRITE setEraserAction NOTIFY barrelChanged)
    Q_PROPERTY(bool pressureEnabled READ pressureEnabled WRITE setPressureEnabled NOTIFY pressureChanged)
    Q_PROPERTY(bool tiltEnabled READ tiltEnabled WRITE setTiltEnabled NOTIFY pressureChanged)
    Q_PROPERTY(bool smoothingEnabled READ smoothingEnabled WRITE setSmoothingEnabled NOTIFY smoothingChanged)
    Q_PROPERTY(double smoothingMinCutoff READ smoothingMinCutoff WRITE setSmoothingMinCutoff NOTIFY smoothingChanged)
    Q_PROPERTY(double smoothingBeta READ smoothingBeta WRITE setSmoothingBeta NOTIFY smoothingChanged)
    Q_PROPERTY(double pressureMin READ pressureMin WRITE setPressureMin NOTIFY pressureChanged)
    Q_PROPERTY(double pressureMax READ pressureMax WRITE setPressureMax NOTIFY pressureChanged)
    Q_PROPERTY(double pressureCurveGamma READ pressureCurveGamma WRITE setPressureCurveGamma NOTIFY pressureChanged)
    Q_PROPERTY(bool coalescedEnabled READ coalescedEnabled WRITE setCoalescedEnabled NOTIFY smoothingChanged)
    Q_PROPERTY(bool seenStylus READ seenStylus NOTIFY deviceChanged)
    Q_PROPERTY(bool seenTouch READ seenTouch NOTIFY deviceChanged)
    Q_PROPERTY(QString deviceName READ deviceName NOTIFY deviceChanged)
    Q_PROPERTY(QVariantList deviceLog READ deviceLog NOTIFY deviceChanged)
    Q_PROPERTY(QString lastRejection READ lastRejection NOTIFY liveChanged)
    Q_PROPERTY(double livePressure READ livePressure NOTIFY liveChanged)
    Q_PROPERTY(double liveTiltAltitude READ liveTiltAltitude NOTIFY liveChanged)
    Q_PROPERTY(double liveTiltAzimuth READ liveTiltAzimuth NOTIFY liveChanged)
    Q_PROPERTY(double liveTwist READ liveTwist NOTIFY liveChanged)
    Q_PROPERTY(double liveVelocity READ liveVelocity NOTIFY liveChanged)
    Q_PROPERTY(QString livePointer READ livePointer NOTIFY liveChanged)

public:
    explicit InputEngine(QObject *parent = nullptr);
    ~InputEngine() override;

    // ---- event entry points (called by the canvas item) --------------------
    // Return false when the event must be ignored by the caller (e.g. QML
    // should not also treat it as a hover).
    bool beginStroke(const RawSample &first);
    // `samples` is the full coalesced batch from QTabletEvent::points().
    bool addSamples(const QVector<RawSample> &samples);
    bool endStroke();
    void cancelStroke();

    // Pointer events (QPointerEvent) - covers mouse and any device Qt does not
    // deliver as a tablet event on this platform.
    bool pointerEvent(int type, const RawSample &sample);

    // Touch events: rejected by default while a stylus is active.
    bool touchEvent(int type, const RawSample &sample);

    // ---- state -------------------------------------------------------------
    bool stylusActive() const { return m_stylusActive; }
    bool touchActive() const { return m_touchActive; }
    bool strokeActive() const { return m_strokeActive; }
    LiveInput live() const { return m_live; }

    // ---- rejection ----------------------------------------------------------
    bool palmRejectionEnabled() const { return m_palmEnabled; }
    void setPalmRejectionEnabled(bool v);
    double palmContactThreshold() const { return m_palmThreshold; }
    void setPalmContactThreshold(double v);
    double palmGraceMs() const { return m_palmGraceMs; }
    void setPalmGraceMs(double v);

    // ---- device mapping ------------------------------------------------------
    int barrelAction() const { return m_barrelAction; }
    void setBarrelAction(int v);
    int eraserAction() const { return m_eraserAction; }
    void setEraserAction(int v);

    // ---- pressure shaping -----------------------------------------------------
    bool pressureEnabled() const { return m_pressureEnabled; }
    void setPressureEnabled(bool v);
    bool tiltEnabled() const { return m_tiltEnabled; }
    void setTiltEnabled(bool v);
    double pressureMin() const { return m_pressureMin; }
    void setPressureMin(double v);
    double pressureMax() const { return m_pressureMax; }
    void setPressureMax(double v);
    double pressureCurveGamma() const { return m_pressureGamma; }
    void setPressureCurveGamma(double v);

    // ---- smoothing -----------------------------------------------------------
    bool smoothingEnabled() const { return m_smoothingEnabled; }
    void setSmoothingEnabled(bool v);
    double smoothingMinCutoff() const { return m_minCutoff; }
    void setSmoothingMinCutoff(double v);
    double smoothingBeta() const { return m_beta; }
    void setSmoothingBeta(double v);
    bool coalescedEnabled() const { return m_coalesced; }
    void setCoalescedEnabled(bool v);

    // ---- diagnostics ----------------------------------------------------------
    bool seenStylus() const { return m_seenStylus; }
    bool seenTouch() const { return m_seenTouch; }
    QString deviceName() const { return m_deviceName; }
    QVariantList deviceLog() const { return m_deviceLog; }
    QString lastRejection() const { return m_lastRejection; }

    double livePressure() const { return m_live.pressure; }
    double liveTiltAltitude() const { return m_live.tiltAltitude; }
    double liveTiltAzimuth() const { return m_live.tiltAzimuth; }
    double liveTwist() const { return m_live.twist; }
    double liveVelocity() const { return m_live.velocity; }
    QString livePointer() const { return m_live.pointerName; }

    // ---- raw -> document conversion -------------------------------------------
    // Converts a raw sample (item space) into a StrokePoint (document space)
    // applying pressure shaping, tilt projection and the time base.
    StrokePoint toStrokePoint(const RawSample &raw, const QTransform &itemToDocument,
                              double zoom) const;
    static QPointF tiltFromQt(double tiltX, double tiltY, double *azimuthDeg,
                              double *altitudeDeg);

    // Barrel state as reported by the current event.
    bool barrelPressed() const { return m_barrelDown; }
    bool eraserEnd() const { return m_eraserEnd; }

    Q_INVOKABLE void resetDeviceLog();
    Q_INVOKABLE QString describeLive() const;

signals:
    void liveChanged();
    void palmRejectionChanged();
    void barrelChanged();
    void pressureChanged();
    void smoothingChanged();
    void deviceChanged();

    void strokeStarted();
    void strokeSample(const paint::StrokePoint &point);
    void strokeFinished();
    void strokeCancelled();

    // Barrel / eraser tool switching is requested, not assumed: PaintEngine
    // decides whether the swap is allowed for the current layer/tool.
    void barrelPressedChanged(bool pressed);
    void eraserEndChanged(bool active);
    void toolSwapRequested(int fromTool, int toTool);
    void eyedropRequested(QPointF itemPos);
    void panRequested(QPointF delta);

private:
    RejectReason classify(const RawSample &sample) const;
    void noteDevice(const RawSample &sample);
    void updateLive(const RawSample &sample, double speed);
    void setRejection(RejectReason reason);
    double shapePressure(double raw) const;

    bool m_palmEnabled = true;
    double m_palmThreshold = 40.0;   // mm^2 - a fingertip is ~700, a palm ~2500
    double m_palmGraceMs = 450.0;

    int m_barrelAction = BarrelEraser;
    int m_eraserAction = BarrelEraser;

    bool m_pressureEnabled = true;
    bool m_tiltEnabled = true;
    double m_pressureMin = 0.02;
    double m_pressureMax = 0.98;
    double m_pressureGamma = 1.0;

    bool m_smoothingEnabled = true;
    double m_minCutoff = 1.2;
    double m_beta = 0.02;
    bool m_coalesced = true;

    bool m_strokeActive = false;
    bool m_stylusActive = false;
    bool m_touchActive = false;
    bool m_barrelDown = false;
    bool m_eraserEnd = false;

    bool m_seenStylus = false;
    bool m_seenTouch = false;
    QString m_deviceName;
    QVariantList m_deviceLog;

    QElapsedTimer m_clock;
    qint64 m_penUpAtMs = -1;
    qint64 m_lastSampleT = 0;
    double m_lastSpeed = 0.0;

    QVector<StrokePoint> m_pending;
    QVector<StrokePoint> m_smoothed;
    LiveInput m_live;
    QString m_lastRejection;
    int m_rejectionStreak = 0;

    QTimer m_hudTimer;
};

} // namespace paint

Q_DECLARE_METATYPE(paint::RawSample)

#endif // PAINT_INPUT_ENGINE_H
