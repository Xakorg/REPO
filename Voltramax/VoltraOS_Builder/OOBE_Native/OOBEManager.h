#ifndef OOBEMANAGER_H
#define OOBEMANAGER_H

#include <QObject>
#include <QString>
#include <QTimer>
#include <QDebug>
#include <QJsonDocument>
#include <QJsonObject>
#include <QNetworkAccessManager>
#include <QNetworkReply>

class OOBEManager : public QObject
{
    Q_OBJECT
    Q_PROPERTY(QString currentNetwork READ currentNetwork NOTIFY networkChanged)
    Q_PROPERTY(bool isConnecting READ isConnecting NOTIFY connectingChanged)
    Q_PROPERTY(int passwordStrength READ passwordStrength NOTIFY passwordStrengthChanged)
    Q_PROPERTY(int biometricProgress READ biometricProgress NOTIFY biometricProgressChanged)
    Q_PROPERTY(QString biometricStatus READ biometricStatus NOTIFY biometricStatusChanged)
    Q_PROPERTY(bool passwordRequired READ passwordRequired NOTIFY passwordRequiredChanged)
    Q_PROPERTY(int authMethod READ authMethod NOTIFY authMethodChanged)
    Q_PROPERTY(QString firebaseUser READ firebaseUser NOTIFY firebaseUserChanged)
    Q_PROPERTY(bool isXakteirSignedIn READ isXakteirSignedIn NOTIFY xakteirSignedInChanged)
    Q_PROPERTY(int fingerprintEnrolled READ fingerprintEnrolled NOTIFY fingerprintEnrolledChanged)
    Q_PROPERTY(QString deviceName READ deviceName NOTIFY deviceNameChanged)
    Q_PROPERTY(QString displayName READ displayName NOTIFY displayNameChanged)
    Q_PROPERTY(bool enableXakAI READ enableXakAI NOTIFY xakAIChanged)
    Q_PROPERTY(bool enableTelemetry READ enableTelemetry NOTIFY telemetryChanged)
    Q_PROPERTY(int oobeProgress READ oobeProgress NOTIFY oobeProgressChanged)

public:
    explicit OOBEManager(QObject *parent = nullptr);
    ~OOBEManager();

    QString currentNetwork() const;
    bool isConnecting() const;
    int passwordStrength() const;
    int biometricProgress() const;
    QString biometricStatus() const;
    bool passwordRequired() const;
    int authMethod() const;
    QString firebaseUser() const;
    bool isXakteirSignedIn() const;
    int fingerprintEnrolled() const;
    QString deviceName() const;
    QString displayName() const;
    bool enableXakAI() const;
    bool enableTelemetry() const;
    int oobeProgress() const;

    Q_INVOKABLE void connectToNetwork(const QString& ssid, const QString& password);
    Q_INVOKABLE void evaluatePassword(const QString& password);
    Q_INVOKABLE void createUserAccount(const QString& username, const QString& password, bool passwordOptional, int authMethod);
    Q_INVOKABLE void startBiometricScan();
    Q_INVOKABLE void finalizeOOBE(bool enableXakAI, bool enableTelemetry);
    Q_INVOKABLE void signInWithXakteir(const QString& email);
    Q_INVOKABLE void signInWithPin(const QString& pin);
    Q_INVOKABLE void enrollFingerprint();
    Q_INVOKABLE void verifyDrawingPattern(const QString& pattern);
    Q_INVOKABLE void togglePasswordRequirement(bool required);
    Q_INVOKABLE void setAuthMethod(int method);
    Q_INVOKABLE void setDeviceName(const QString& name);
    Q_INVOKABLE void setDisplayName(const QString& name);
    Q_INVOKABLE void skipBiometric();
    Q_INVOKABLE void checkFirebaseAuth();

signals:
    void networkChanged();
    void connectingChanged();
    void passwordStrengthChanged();
    void biometricProgressChanged();
    void biometricStatusChanged();
    void passwordRequiredChanged();
    void authMethodChanged();
    void firebaseUserChanged();
    void xakteirSignedInChanged();
    void fingerprintEnrolledChanged();
    void deviceNameChanged();
    void displayNameChanged();
    void xakAIChanged();
    void telemetryChanged();
    void oobeProgressChanged();
    void networkConnectionSuccess();
    void networkConnectionFailed();
    void biometricScanComplete();
    void oobeFinished();
    void xakteirAuthSuccess();
    void xakteirAuthFailed();
    void fingerprintEnrolledComplete();
    void drawingVerified();

private:
    void fetchFirebaseProfile(const QString& uid);
    void sendToFirestore(const QString& userId, const QJsonObject& data);
    void updateOobeProgress();
    bool validatePin(const QString& pin);
    bool validateDrawingPattern(const QString& pattern);

    QString m_currentNetwork;
    bool m_isConnecting = false;
    int m_passwordStrength = 0;
    int m_biometricProgress = 0;
    QString m_biometricStatus = "Position your face in the frame";
    bool m_passwordRequired = true;
    int m_authMethod = 0;
    QString m_firebaseUser;
    bool m_isXakteirSignedIn = false;
    int m_fingerprintEnrolled = 0;
    QString m_deviceName = "VoltraMax";
    QString m_displayName = "User";
    bool m_enableXakAI = true;
    bool m_enableTelemetry = false;
    int m_oobeProgress = 0;

    QTimer* m_networkTimer;
    QTimer* m_biometricTimer;
    QNetworkAccessManager* m_networkManager;
    QTimer* m_fingerprintTimer;
    QTimer* m_drawingTimer;

    QString m_registeredPattern;
    QString m_currentDrawing;
    int m_drawingProgress = 0;
};

#endif // OOBEMANAGER_H
