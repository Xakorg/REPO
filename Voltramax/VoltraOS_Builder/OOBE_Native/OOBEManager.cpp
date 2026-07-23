#include "OOBEManager.h"
#include <QRegularExpression>
#include "../desktop_environment/SyscallBridge.h"

OOBEManager::OOBEManager(QObject *parent) : QObject(parent) {
    m_networkTimer = new QTimer(this);
    m_networkTimer->setSingleShot(true);
    connect(m_networkTimer, &QTimer::timeout, this, [this]() {
        m_isConnecting = false;
        emit connectingChanged();
        
        // Simulate an 80% success rate for connections
        if (rand() % 100 < 80) {
            emit networkConnectionSuccess();
        } else {
            m_currentNetwork = "";
            emit networkChanged();
            emit networkConnectionFailed();
        }
    });

    m_biometricTimer = new QTimer(this);
    connect(m_biometricTimer, &QTimer::timeout, this, [this]() {
        m_biometricProgress += 5;
        
        if (m_biometricProgress == 25) m_biometricStatus = "Scanning facial geometry...";
        else if (m_biometricProgress == 50) m_biometricStatus = "Analyzing depth mapping...";
        else if (m_biometricProgress == 75) m_biometricStatus = "Securing biometric hash...";
        else if (m_biometricProgress >= 100) {
            m_biometricStatus = "Face ID Registration Complete!";
            m_biometricProgress = 100;
            m_biometricTimer->stop();
            emit biometricScanComplete();
        }
        
        emit biometricProgressChanged();
        emit biometricStatusChanged();
    });
}

QString OOBEManager::currentNetwork() const { return m_currentNetwork; }
bool OOBEManager::isConnecting() const { return m_isConnecting; }
int OOBEManager::passwordStrength() const { return m_passwordStrength; }
int OOBEManager::biometricProgress() const { return m_biometricProgress; }
QString OOBEManager::biometricStatus() const { return m_biometricStatus; }

void OOBEManager::connectToNetwork(const QString& ssid, const QString& password) {
    qDebug() << "[OOBE] Connecting to SSID:" << ssid;
    m_currentNetwork = ssid;
    m_isConnecting = true;
    emit networkChanged();
    emit connectingChanged();
    
    // Hardware integration: Open an AF_INET socket via VoltraOS Kernel Syscall
    int sockfd = SyscallBridge::socket();
    SyscallBridge::connect(sockfd, 0, 8080); // Connect to mock IP
    
    // Simulate connection delay (2.5 seconds)
    m_networkTimer->start(2500);
}

void OOBEManager::evaluatePassword(const QString& password) {
    int score = 0;
    if (password.length() >= 8) score += 25;
    if (password.length() >= 12) score += 25;
    
    QRegularExpression hasUpper("[A-Z]");
    QRegularExpression hasLower("[a-z]");
    QRegularExpression hasNumber("[0-9]");
    QRegularExpression hasSpecial("[^a-zA-Z0-9]");
    
    if (hasUpper.match(password).hasMatch()) score += 10;
    if (hasLower.match(password).hasMatch()) score += 10;
    if (hasNumber.match(password).hasMatch()) score += 15;
    if (hasSpecial.match(password).hasMatch()) score += 15;
    
    m_passwordStrength = score;
    emit passwordStrengthChanged();
}

void OOBEManager::createUserAccount(const QString& username, const QString& password) {
    qDebug() << "[OOBE] Creating secure user account for:" << username;
    // Hardware integration: Write profile securely to VoltraOS VFS via Syscall
    int fd = SyscallBridge::open("/usr/local/profiles.dat", 2); // O_RDWR
    QString profileData = username + ":" + password;
    SyscallBridge::write(fd, profileData.toStdString().c_str(), profileData.length());
    SyscallBridge::close(fd);
}

void OOBEManager::startBiometricScan() {
    qDebug() << "[OOBE] Initializing Biometric Hardware...";
    m_biometricProgress = 0;
    m_biometricStatus = "Position your face in the frame";
    emit biometricProgressChanged();
    emit biometricStatusChanged();
    m_biometricTimer->start(150); // 150ms per 5% progress
}

void OOBEManager::finalizeOOBE(bool enableXakAI, bool enableTelemetry) {
    qDebug() << "[OOBE] Finalizing System Setup...";
    qDebug() << "[OOBE] XakAI Engine:" << (enableXakAI ? "ENABLED" : "DISABLED");
    qDebug() << "[OOBE] Neural Telemetry:" << (enableTelemetry ? "ENABLED" : "DISABLED");
    
    // Simulate finalizing writes to the VFS
    QTimer::singleShot(2000, this, &OOBEManager::oobeFinished);
}
