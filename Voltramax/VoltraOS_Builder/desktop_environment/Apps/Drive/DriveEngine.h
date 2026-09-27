#ifndef DRIVE_ENGINE_H
#define DRIVE_ENGINE_H

#include <QObject>
#include <QString>
#include <QVariantList>
#include <QTimer>
#include <QMutex>

/**
 * ============================================================================
 * VOLTRA OS ENTERPRISE - XAKTEIR DRIVE ENGINE
 * ============================================================================
 * 
 * Massive C++ WebSocket Daemon for synchronizing User Space files directly
 * with the Next.js `src/app` Web Backend.
 * Features:
 * - Smart Cache Delta-Syncing (Uploads only changed bytes)
 * - VFS File Watcher Abstraction
 * - Offline Queueing
 * ============================================================================
 */

class DriveEngine : public QObject {
    Q_OBJECT

    // Expose overall cloud connection state
    Q_PROPERTY(bool isCloudConnected READ isCloudConnected NOTIFY connectionStateChanged)
    Q_PROPERTY(QString syncStatusText READ syncStatusText NOTIFY syncStatusChanged)

public:
    explicit DriveEngine(QObject *parent = nullptr);
    ~DriveEngine();

    bool isCloudConnected() const;
    QString syncStatusText() const;

    // Get the current local cached files
    Q_INVOKABLE QVariantList getCloudFiles();

    // Trigger an instant manual sync
    Q_INVOKABLE void triggerManualSync();

    // Simulate modifying a file locally (Triggers the Delta-Sync)
    Q_INVOKABLE void modifyFileLocally(const QString& filename);

signals:
    void connectionStateChanged();
    void syncStatusChanged();
    void fileListUpdated();

private:
    bool m_isCloudConnected;
    QString m_syncStatusText;
    QTimer* m_webSocketPingTimer;
    QMutex m_syncMutex;

    // Internal File Node Structure
    struct CloudFile {
        QString name;
        QString size;
        QString syncState; // "Synced", "Syncing", "Offline Pending"
        QString lastModified;
    };

    QList<CloudFile> m_files;

    void initializeVfsCache();
    void pingXakteirCloud();
    void processSyncQueue();
};

#endif // DRIVE_ENGINE_H
