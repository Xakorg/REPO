#ifndef OOBEMANAGER_H
#define OOBEMANAGER_H

#include <QObject>
#include <QString>
#include <QTimer>
#include <QDebug>

class OOBEManager : public QObject {
    Q_OBJECT
    Q_PROPERTY(QString currentNetwork READ currentNetwork NOTIFY networkChanged)
    Q_PROPERTY(bool isConnecting READ isConnecting NOTIFY connectingChanged)
    Q_PROPERTY(int passwordStrength READ passwordStrength NOTIFY passwordStrengthChanged)
    Q_PROPERTY(int biometricProgress READ biometricProgress NOTIFY biometricProgressChanged)
    Q_PROPERTY(QString biometricStatus READ biometricStatus NOTIFY biometricStatusChanged)

public:
    explicit OOBEManager(QObject *parent = nullptr);

    QString currentNetwork() const;
    bool isConnecting() const;
    int passwordStrength() const;
    int biometricProgress() const;
    QString biometricStatus() const;

    // Callables from QML
    Q_INVOKABLE void connectToNetwork(const QString& ssid, const QString& password);
    Q_INVOKABLE void evaluatePassword(const QString& password);
    Q_INVOKABLE void createUserAccount(const QString& username, const QString& password);
    Q_INVOKABLE void startBiometricScan();
    Q_INVOKABLE void finalizeOOBE(bool enableXakAI, bool enableTelemetry);

signals:
    void networkChanged();
    void connectingChanged();
    void passwordStrengthChanged();
    void biometricProgressChanged();
    void biometricStatusChanged();
    
    // UI Triggers
    void networkConnectionSuccess();
    void networkConnectionFailed();
    void biometricScanComplete();
    void oobeFinished();

private:
    QString m_currentNetwork;
    bool m_isConnecting = false;
    int m_passwordStrength = 0; // 0-100
    int m_biometricProgress = 0; // 0-100
    QString m_biometricStatus = "Position your face in the frame";

    QTimer* m_networkTimer;
    QTimer* m_biometricTimer;
};

#endif // OOBEMANAGER_H
