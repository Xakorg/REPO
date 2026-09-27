#ifndef XAKCHAT_SERVICE_H
#define XAKCHAT_SERVICE_H

#include <QObject>
#include <QString>
#include <QVariantList>
#include <QVariantMap>
#include <QWebSocketServer>
#include <QWebSocket>
#include <QList>

// ----------------------------------------------------------------------------
// VoltraOS - Native XakChat Backend Service
// ----------------------------------------------------------------------------
// Replaces the React/Firebase web backend with a native C++ implementation
// running directly on the DesktopDaemon. Handles WebRTC voice states,
// channel lists, and direct messages.

class XakChatService : public QObject {
    Q_OBJECT
    Q_PROPERTY(QVariantList servers READ servers NOTIFY serversChanged)
    Q_PROPERTY(QString activeServer READ activeServer WRITE setActiveServer NOTIFY activeServerChanged)
    Q_PROPERTY(QVariantList currentChannels READ currentChannels NOTIFY currentChannelsChanged)

public:
    explicit XakChatService(QObject *parent = nullptr);

    QVariantList servers() const;
    QString activeServer() const;
    void setActiveServer(const QString &serverId);
    QVariantList currentChannels() const;

    // Native WebRTC Voice Actions
    Q_INVOKABLE void joinVoiceChannel(const QString &channelId);
    Q_INVOKABLE void leaveVoiceChannel();
    Q_INVOKABLE void toggleMute();
    Q_INVOKABLE void toggleDeafen();

    // Text Actions
    Q_INVOKABLE void sendMessage(const QString &channelId, const QString &message);

signals:
    void serversChanged();
    void activeServerChanged();
    void currentChannelsChanged();
    
    // Voice Signals to drive the QML PiP Overlay
    void voiceStateChanged(bool inCall, const QString &channelName, bool isMuted, bool isDeafened);
    
    // Simulating incoming messages
    void messageReceived(const QString &channelId, const QString &sender, const QString &text, const QString &avatar);

private slots:
    void onNewConnection();
    void processTextMessage(const QString &message);
    void socketDisconnected();

private:
    void populateMockData();
    void updateChannelsForServer();
    void broadcastMessage(const QString &message);

    QVariantList m_servers;
    QString m_activeServer;
    QVariantList m_currentChannels;
    
    // Voice State
    bool m_inCall;
    QString m_activeVoiceChannel;
    bool m_isMuted;
    bool m_isDeafened;

    // WebSocket Sync Server
    QWebSocketServer *m_webSocketServer;
    QList<QWebSocket *> m_clients;
};

#endif // XAKCHAT_SERVICE_H
