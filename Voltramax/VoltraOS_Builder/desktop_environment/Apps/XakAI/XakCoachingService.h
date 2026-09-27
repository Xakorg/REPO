#ifndef XAK_COACHING_SERVICE_H
#define XAK_COACHING_SERVICE_H

#include <QObject>
#include <QString>
#include <QPoint>

// ----------------------------------------------------------------------------
// VoltraOS - Xak AI Game Coaching & Input Simulation Service
// ----------------------------------------------------------------------------
// Responsible for VoltraClip capture analysis, ML coaching, and injecting
// simulated hardware inputs directly into the Game's window buffer to 
// "show examples" to the user.

class XakCoachingService : public QObject {
    Q_OBJECT
public:
    explicit XakCoachingService(QObject *parent = nullptr);
    ~XakCoachingService();

    // Hook from VoltraClip (Game Capture)
    Q_INVOKABLE void analyzeFrameBuffer(const QString &gameName);
    
    // Voice/Text trigger for an interactive tutorial (e.g. "teach me how to edit course")
    Q_INVOKABLE void requestCoachingExample(const QString &gameName, const QString &prompt);

signals:
    // Signals the QML Compositor to draw UI overlays (e.g., "Press [E] here")
    void showButtonOverlay(const QString &button, const QPoint &screenPos);
    void hideOverlays();
    
    // Signals the UI that Xak has temporarily taken control of the mouse/keyboard
    void aiControlStateChanged(bool isControlling);

private:
    void simulateKeystroke(const QString &key);
    void simulateMouseMovement(const QPoint &target);
    
    bool m_isControlling;
};

#endif // XAK_COACHING_SERVICE_H
