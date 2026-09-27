#include "XakChatService.h"
#include <QDebug>
#include <QTimer>
#include <QJsonDocument>
#include <QJsonObject>
#include <QJsonValue>

// ----------------------------------------------------------------------------
// XakChatService Implementation
// ----------------------------------------------------------------------------

XakChatService::XakChatService(QObject *parent) 
    : QObject(parent), m_activeServer("home"), m_inCall(false), m_isMuted(false), m_isDeafened(false),
      m_webSocketServer(new QWebSocketServer(QStringLiteral("XakChat Native Sync"), QWebSocketServer::NonSecureMode, this))
{
    qInfo() << "[XAKCHAT] Initializing Native C++ XakChat Engine & Sync Server...";
    populateMockData();
    updateChannelsForServer();

    if (m_webSocketServer->listen(QHostAddress::Any, 8080)) {
        qInfo() << "[XAKCHAT-SYNC] Local WebSocket Server listening on ws://localhost:8080";
        connect(m_webSocketServer, &QWebSocketServer::newConnection, this, &XakChatService::onNewConnection);
    } else {
        qWarning() << "[XAKCHAT-SYNC] Failed to start WebSocket Server!";
    }
}

QVariantList XakChatService::servers() const { return m_servers; }
QString XakChatService::activeServer() const { return m_activeServer; }
QVariantList XakChatService::currentChannels() const { return m_currentChannels; }

void XakChatService::setActiveServer(const QString &serverId) {
    if (m_activeServer != serverId) {
        m_activeServer = serverId;
        updateChannelsForServer();
        emit activeServerChanged();
    }
}

void XakChatService::joinVoiceChannel(const QString &channelId) {
    qInfo() << "[XAKCHAT-WEBRTC] Establishing native audio socket for channel:" << channelId;
    m_inCall = true;
    m_activeVoiceChannel = channelId;
    emit voiceStateChanged(m_inCall, m_activeVoiceChannel, m_isMuted, m_isDeafened);
}

void XakChatService::leaveVoiceChannel() {
    qInfo() << "[XAKCHAT-WEBRTC] Disconnecting audio sockets.";
    m_inCall = false;
    m_activeVoiceChannel = "";
    emit voiceStateChanged(m_inCall, m_activeVoiceChannel, m_isMuted, m_isDeafened);
}

void XakChatService::toggleMute() {
    m_isMuted = !m_isMuted;
    qInfo() << "[XAKCHAT-WEBRTC] Mute state:" << m_isMuted;
    emit voiceStateChanged(m_inCall, m_activeVoiceChannel, m_isMuted, m_isDeafened);
}

void XakChatService::toggleDeafen() {
    m_isDeafened = !m_isDeafened;
    qInfo() << "[XAKCHAT-WEBRTC] Deafen state:" << m_isDeafened;
    emit voiceStateChanged(m_inCall, m_activeVoiceChannel, m_isMuted, m_isDeafened);
}

void XakChatService::sendMessage(const QString &channelId, const QString &message) {
    qInfo() << "[XAKCHAT-WS] Sending native message to" << channelId << ":" << message;
    
    // Broadcast to web clients via WebSocket
    QJsonObject payload;
    payload["type"] = "chat_message";
    payload["channelId"] = channelId;
    payload["sender"] = "Ridwan (Native)";
    payload["text"] = message;
    payload["avatar"] = "😎";
    
    QJsonDocument doc(payload);
    broadcastMessage(doc.toJson(QJsonDocument::Compact));

    // Simulate Xak AI responding natively
    if (channelId == "xak-ai" || message.contains("xak", Qt::CaseInsensitive)) {
        QTimer::singleShot(1000, this, [this, channelId]() {
            emit messageReceived(channelId, "Xak AI", "I am running natively in VoltraOS C++ now. Web latency is a thing of the past.", "✨");
            
            QJsonObject aiPayload;
            aiPayload["type"] = "chat_message";
            aiPayload["channelId"] = channelId;
            aiPayload["sender"] = "Xak AI";
            aiPayload["text"] = "I am running natively in VoltraOS C++ now. Web latency is a thing of the past.";
            aiPayload["avatar"] = "✨";
            QJsonDocument aiDoc(aiPayload);
            broadcastMessage(aiDoc.toJson(QJsonDocument::Compact));
        });
    }
}

void XakChatService::onNewConnection() {
    QWebSocket *pSocket = m_webSocketServer->nextPendingConnection();
    connect(pSocket, &QWebSocket::textMessageReceived, this, &XakChatService::processTextMessage);
    connect(pSocket, &QWebSocket::disconnected, this, &XakChatService::socketDisconnected);
    m_clients << pSocket;
    qInfo() << "[XAKCHAT-SYNC] New Web Client connected. Total clients:" << m_clients.size();
}

void XakChatService::processTextMessage(const QString &message) {
    qInfo() << "[XAKCHAT-SYNC] Received message from Web Client:" << message;
    QJsonDocument doc = QJsonDocument::fromJson(message.toUtf8());
    if (!doc.isNull() && doc.isObject()) {
        QJsonObject obj = doc.object();
        if (obj["type"].toString() == "chat_message") {
            // Emitting to Native QML UI
            emit messageReceived(
                obj["channelId"].toString(),
                obj["sender"].toString(),
                obj["text"].toString(),
                obj["avatar"].toString()
            );
            // Broadcast to other web clients
            broadcastMessage(message);
        }
    }
}

void XakChatService::socketDisconnected() {
    QWebSocket *pClient = qobject_cast<QWebSocket *>(sender());
    if (pClient) {
        m_clients.removeAll(pClient);
        pClient->deleteLater();
        qInfo() << "[XAKCHAT-SYNC] Web Client disconnected. Remaining:" << m_clients.size();
    }
}

void XakChatService::broadcastMessage(const QString &message) {
    for (QWebSocket *pClient : qAsConst(m_clients)) {
        pClient->sendTextMessage(message);
    }
}

void XakChatService::populateMockData() {
    m_servers.append(QVariantMap{{"id", "home"}, {"name", "Home"}, {"icon", "🏠"}, {"color", "#3b82f6"}});
    m_servers.append(QVariantMap{{"id", "discover"}, {"name", "Discovery"}, {"icon", "🌐"}, {"color", "#10b981"}});
    m_servers.append(QVariantMap{{"id", "xakteir"}, {"name", "Xakteir"}, {"icon", "⚡"}, {"color", "#a855f7"}});
    m_servers.append(QVariantMap{{"id", "gaming"}, {"name", "Gaming"}, {"icon", "🎮"}, {"color", "#ef4444"}});
    m_servers.append(QVariantMap{{"id", "dev"}, {"name", "Dev"}, {"icon", "💻"}, {"color", "#6366f1"}});
}

void XakChatService::updateChannelsForServer() {
    m_currentChannels.clear();
    
    if (m_activeServer == "xakteir") {
        m_currentChannels.append(QVariantMap{{"category", "WELCOME"}});
        m_currentChannels.append(QVariantMap{{"id", "general"}, {"name", "general"}, {"type", "text"}});
        m_currentChannels.append(QVariantMap{{"category", "LOBBY"}});
        m_currentChannels.append(QVariantMap{{"id", "logic-lab"}, {"name", "logic-lab"}, {"type", "text"}});
        m_currentChannels.append(QVariantMap{{"id", "design"}, {"name", "design"}, {"type", "text"}});
        m_currentChannels.append(QVariantMap{{"category", "VOICE CHANNELS"}});
        m_currentChannels.append(QVariantMap{{"id", "general-lounge"}, {"name", "General Lounge"}, {"type", "voice"}});
        m_currentChannels.append(QVariantMap{{"id", "gaming-pod-a"}, {"name", "Gaming Pod A"}, {"type", "voice"}});
    } else if (m_activeServer == "gaming") {
        m_currentChannels.append(QVariantMap{{"category", "LOBBY"}});
        m_currentChannels.append(QVariantMap{{"id", "game-chat"}, {"name", "game-chat"}, {"type", "text"}});
        m_currentChannels.append(QVariantMap{{"category", "VOICE CHANNELS"}});
        m_currentChannels.append(QVariantMap{{"id", "gaming-pod-a"}, {"name", "Gaming Pod A"}, {"type", "voice"}});
    } else {
        // Home DMs
        m_currentChannels.append(QVariantMap{{"category", "DIRECT MESSAGES"}});
        m_currentChannels.append(QVariantMap{{"id", "xak-ai"}, {"name", "Xak AI"}, {"type", "text"}});
        m_currentChannels.append(QVariantMap{{"id", "ridwan"}, {"name", "Ridwan"}, {"type", "text"}});
    }
    
    emit currentChannelsChanged();
}
