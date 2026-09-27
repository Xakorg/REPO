#include "OOBEManager.h"
#include <QRegularExpression>
#include <QJsonArray>
#include <QDateTime>
#include "../desktop_environment/SyscallBridge.h"

OOBEManager::OOBEManager(QObject *parent) : QObject(parent) {
    m_networkTimer = new QTimer(this);
    m_networkTimer->setSingleShot(true);
    connect(m_networkTimer, &QTimer::timeout, this, [this]() {
        m_isConnecting = false;
        emit connectingChanged();

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

    m_fingerprintTimer = new QTimer(this);
    connect(m_fingerprintTimer, &QTimer::timeout, this, [this]() {
        m_biometricProgress += 5;
        if (m_biometricProgress <= 100) {
            m_biometricStatus = "Enrolling fingerprint... (" + QString::number(m_biometricProgress) + "%)";
            emit biometricProgressChanged();
            emit biometricStatusChanged();
        }
        if (m_biometricProgress >= 100) {
            m_fingerprintEnrolled = 1;
            m_fingerprintTimer->stop();
            emit fingerprintEnrolledComplete();
        }
    });

    m_drawingTimer = new QTimer(this);
    connect(m_drawingTimer, &QTimer::timeout, this, [this]() {
        m_drawingProgress += 2;
        if (m_drawingProgress >= 100) {
            m_drawingTimer->stop();
            emit drawingVerified();
        }
    });

    m_networkManager = new QNetworkAccessManager(this);
    connect(m_networkManager, &QNetworkAccessManager::finished, this, [this](QNetworkReply *reply) {
        if (reply->error() == QNetworkReply::NoError) {
            QJsonDocument doc = QJsonDocument::fromJson(reply->readAll());
            if (doc.isObject()) {
                m_firebaseUser = doc.object()["name"].toString();
                emit firebaseUserChanged();
            }
        }
        reply->deleteLater();
    });
}

OOBEManager::~OOBEManager() {
    qDebug() << "[OOBE] Manager destroyed.";
}

QString OOBEManager::currentNetwork() const { return m_currentNetwork; }
bool OOBEManager::isConnecting() const { return m_isConnecting; }
int OOBEManager::passwordStrength() const { return m_passwordStrength; }
int OOBEManager::biometricProgress() const { return m_biometricProgress; }
QString OOBEManager::biometricStatus() const { return m_biometricStatus; }
bool OOBEManager::passwordRequired() const { return m_passwordRequired; }
int OOBEManager::authMethod() const { return m_authMethod; }
QString OOBEManager::firebaseUser() const { return m_firebaseUser; }
bool OOBEManager::isXakteirSignedIn() const { return m_isXakteirSignedIn; }
int OOBEManager::fingerprintEnrolled() const { return m_fingerprintEnrolled; }
QString OOBEManager::deviceName() const { return m_deviceName; }
QString OOBEManager::displayName() const { return m_displayName; }
bool OOBEManager::enableXakAI() const { return m_enableXakAI; }
bool OOBEManager::enableTelemetry() const { return m_enableTelemetry; }
int OOBEManager::oobeProgress() const { return m_oobeProgress; }

void OOBEManager::connectToNetwork(const QString& ssid, const QString& password) {
    qDebug() << "[OOBE] Connecting to SSID:" << ssid;
    m_currentNetwork = ssid;
    m_isConnecting = true;
    emit networkChanged();
    emit connectingChanged();

    int sockfd = SyscallBridge::socket();
    SyscallBridge::connect(sockfd, 0, 8080);
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

void OOBEManager::createUserAccount(const QString& username, const QString& password, bool passwordOptional, int authMethod) {
    qDebug() << "[OOBE] Creating account for:" << username << "Auth method:" << authMethod;
    QString effectivePassword = passwordOptional && password.isEmpty() ? "PIN_ONLY" : password;

    int fd = SyscallBridge::open("/usr/local/profiles.dat", 2);
    QString profileData = username + ":" + effectivePassword + ":" + QString::number(authMethod);
    SyscallBridge::write(fd, profileData.toStdString().c_str(), profileData.length());
    SyscallBridge::close(fd);

    if (!m_firebaseUser.isEmpty()) {
        QJsonObject data;
        data["username"] = username;
        data["authMethod"] = authMethod;
        data["deviceName"] = m_deviceName;
        data["timestamp"] = QDateTime::currentDateTime().toString(Qt::ISODate);
        sendToFirestore(m_firebaseUser, data);
    }
}

void OOBEManager::startBiometricScan() {
    qDebug() << "[OOBE] Initializing Biometric Hardware...";
    m_biometricProgress = 0;
    m_biometricStatus = "Position your face in the frame";
    emit biometricProgressChanged();
    emit biometricStatusChanged();
    m_biometricTimer->start(150);
}

void OOBEManager::finalizeOOBE(bool enableXakAI, bool enableTelemetry) {
    qDebug() << "[OOBE] Finalizing System Setup...";
    qDebug() << "[OOBE] XakAI Engine:" << (enableXakAI ? "ENABLED" : "DISABLED");
    qDebug() << "[OOBE] Neural Telemetry:" << (enableTelemetry ? "ENABLED" : "DISABLED");
    m_enableXakAI = enableXakAI;
    m_enableTelemetry = enableTelemetry;
    emit xakAIChanged();
    emit telemetryChanged();
    QTimer::singleShot(2000, this, &OOBEManager::oobeFinished);
}

void OOBEManager::signInWithXakteir(const QString& email) {
    qDebug() << "[OOBE] Signing in with Xakteir (Firebase OAuth):" << email;
    QUrl firebaseUrl(QString("https://identitytoolkit.googleapis.com/v1/accounts:signInWithIdp?key=%1").arg(FIREBASE_API_KEY));
    QNetworkRequest request(firebaseUrl);
    request.setHeader(QNetworkRequest::ContentTypeHeader, "application/json");

    QJsonObject body;
    body["email"] = email;
    body["returnSecureToken"] = true;

    m_networkManager->post(request, QJsonDocument(body).toJson());
    m_isXakteirSignedIn = true;
    emit xakteirSignedInChanged();
    emit xakteirAuthSuccess();
    qDebug() << "[OOBE] Xakteir sign-in initiated for:" << email;
}

void OOBEManager::signInWithPin(const QString& pin) {
    qDebug() << "[OOBE] Signing in with PIN:" << pin;
    if (validatePin(pin)) {
        m_isXakteirSignedIn = true;
        emit xakteirSignedInChanged();
        emit xakteirAuthSuccess();
    } else {
        emit xakteirAuthFailed();
    }
}

void OOBEManager::enrollFingerprint() {
    qDebug() << "[OOBE] Starting fingerprint enrollment...";
    m_biometricProgress = 0;
    m_biometricStatus = "Place finger on scanner...";
    emit biometricProgressChanged();
    emit biometricStatusChanged();
    m_fingerprintTimer->start(100);
}

void OOBEManager::verifyDrawingPattern(const QString& pattern) {
    qDebug() << "[OOBE] Verifying drawing pattern...";
    m_currentDrawing = pattern;
    m_drawingProgress = 0;
    m_drawingTimer->start(50);
    emit drawingVerified();
}

void OOBEManager::togglePasswordRequirement(bool required) {
    m_passwordRequired = required;
    emit passwordRequiredChanged();
    qDebug() << "[OOBE] Password requirement:" << (required ? "ENABLED" : "DISABLED");
}

void OOBEManager::setAuthMethod(int method) {
    m_authMethod = method;
    emit authMethodChanged();
    qDebug() << "[OOBE] Auth method set to:" << method;
}

void OOBEManager::setDeviceName(const QString& name) {
    m_deviceName = name;
    emit deviceNameChanged();
}

void OOBEManager::setDisplayName(const QString& name) {
    m_displayName = name;
    emit displayNameChanged();
}

void OOBEManager::skipBiometric() {
    qDebug() << "[OOBE] Biometric skipped by user.";
    m_biometricProgress = 100;
    m_biometricStatus = "Biometric skipped";
    emit biometricProgressChanged();
    emit biometricStatusChanged();
    emit biometricScanComplete();
}

void OOBEManager::checkFirebaseAuth() {
    qDebug() << "[OOBE] Checking Firebase authentication state...";
    QUrl firebaseUrl(QString("https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=%1").arg(FIREBASE_API_KEY));
    QNetworkRequest request(firebaseUrl);
    m_networkManager->get(request);
}

void OOBEManager::fetchFirebaseProfile(const QString& uid) {
    QUrl firebaseUrl(QString("https://firestore.googleapis.com/v1/projects/%1/databases/(default)/documents/users/%2").arg(FIREBASE_PROJECT_ID).arg(uid));
    QNetworkRequest request(firebaseUrl);
    request.setRawHeader("Authorization", QString("Bearer %1").arg(FIREBASE_API_KEY).toUtf8());
    m_networkManager->get(request);
}

void OOBEManager::sendToFirestore(const QString& userId, const QJsonObject& data) {
    QUrl firebaseUrl(QString("https://firestore.googleapis.com/v1/projects/%1/databases/(default)/documents/users/%2").arg(FIREBASE_PROJECT_ID).arg(userId));
    QNetworkRequest request(firebaseUrl);
    request.setRawHeader("Authorization", QString("Bearer %1").arg(FIREBASE_API_KEY).toUtf8());
    request.setHeader(QNetworkRequest::ContentTypeHeader, "application/json");

    QJsonObject doc;
    doc["fields"] = data;
    m_networkManager->post(request, QJsonDocument(doc).toJson());
    qDebug() << "[OOBE] Sent profile to Firestore for user:" << userId;
}

void OOBEManager::updateOobeProgress() {
    m_oobeProgress++;
    emit oobeProgressChanged();
}

bool OOBEManager::validatePin(const QString& pin) {
    return pin.length() >= 4 && pin.length() <= 8 && pin.toUInt() > 0;
}

bool OOBEManager::validateDrawingPattern(const QString& pattern) {
    return pattern.length() >= 10;
}
