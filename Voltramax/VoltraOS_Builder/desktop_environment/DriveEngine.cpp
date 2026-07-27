#include "DriveEngine.h"
#include <QDebug>
#include <QRandomGenerator>

DriveEngine::DriveEngine(QObject *parent) 
    : QObject(parent), m_isCloudConnected(true), m_syncStatusText("Cloud Synchronized") 
{
    qDebug() << "[DriveEngine] Booting Xakteir Web App WebSocket Sync Daemon...";
    
    initializeVfsCache();

    // Simulate the persistent wss:// WebSocket ping to the Next.js backend
    m_webSocketPingTimer = new QTimer(this);
    m_webSocketPingTimer->setInterval(3000); // Ping every 3 seconds
    connect(m_webSocketPingTimer, &QTimer::timeout, this, &DriveEngine::pingXakteirCloud);
    m_webSocketPingTimer->start();
}

DriveEngine::~DriveEngine() {
    m_webSocketPingTimer->stop();
    delete m_webSocketPingTimer;
}

bool DriveEngine::isCloudConnected() const { return m_isCloudConnected; }
QString DriveEngine::syncStatusText() const { return m_syncStatusText; }

void DriveEngine::initializeVfsCache() {
    // These files represent the local /home/voltra/XakteirDrive directory
    m_files = {
        {"Project_Opal_Architecture.pdf", "4.2 MB", "Synced", "Just now"},
        {"Q3_Financials_Xakteir.xlsx", "1.1 MB", "Synced", "2 hours ago"},
        {"voltra_kernel_v2_source.zip", "850 MB", "Synced", "Yesterday"},
        {"Team_Meeting_Notes.docx", "25 KB", "Synced", "3 days ago"},
        {"Xak_AI_Weights.bin", "4.5 GB", "Synced", "1 week ago"}
    };
}

QVariantList DriveEngine::getCloudFiles() {
    QMutexLocker locker(&m_syncMutex);
    QVariantList list;
    for (const auto& file : m_files) {
        QVariantMap map;
        map["name"] = file.name;
        map["size"] = file.size;
        map["syncState"] = file.syncState;
        map["lastModified"] = file.lastModified;
        list.append(map);
    }
    return list;
}

void DriveEngine::triggerManualSync() {
    qDebug() << "[DriveEngine] Manual sync forced. Re-establishing wss:// socket...";
    processSyncQueue();
}

void DriveEngine::modifyFileLocally(const QString& filename) {
    QMutexLocker locker(&m_syncMutex);
    
    qDebug() << "[DriveEngine] VFS Watcher detected modification on:" << filename;
    
    for (auto& file : m_files) {
        if (file.name == filename) {
            file.lastModified = "Modified just now";
            if (m_isCloudConnected) {
                file.syncState = "Syncing";
                m_syncStatusText = "Calculating Delta Diffs...";
                qDebug() << "[DriveEngine] Generating binary delta diff to prevent full file re-upload...";
                
                // Simulate network upload time
                QTimer::singleShot(2000, this, [this]() {
                    processSyncQueue();
                });
            } else {
                // OPTION A: Smart Cache Offline Logic
                file.syncState = "Offline Pending";
                m_syncStatusText = "Saved locally. Awaiting Cloud Connection...";
                qDebug() << "[DriveEngine] Cloud unreachable. Caching binary deltas locally.";
            }
            break;
        }
    }
    
    emit syncStatusChanged();
    emit fileListUpdated();
}

void DriveEngine::pingXakteirCloud() {
    QMutexLocker locker(&m_syncMutex);
    
    // Simulate sporadic network drops to test the Smart Cache architecture
    bool previousState = m_isCloudConnected;
    m_isCloudConnected = (QRandomGenerator::global()->generateDouble() > 0.2); // 80% uptime

    if (m_isCloudConnected && !previousState) {
        qDebug() << "[DriveEngine] WebSocket Reconnected. Pushing Smart Cache to Web App.";
        processSyncQueue();
    } else if (!m_isCloudConnected && previousState) {
        qDebug() << "[DriveEngine] WebSocket Dropped. Entering Offline Smart Cache Mode.";
        m_syncStatusText = "Disconnected. Working Offline.";
        emit syncStatusChanged();
    }
    
    emit connectionStateChanged();
}

void DriveEngine::processSyncQueue() {
    QMutexLocker locker(&m_syncMutex);
    
    bool hadPendingFiles = false;
    for (auto& file : m_files) {
        if (file.syncState == "Offline Pending" || file.syncState == "Syncing") {
            qDebug() << "[DriveEngine] Streaming deltas to Web App for:" << file.name;
            file.syncState = "Synced";
            hadPendingFiles = true;
        }
    }

    if (hadPendingFiles) {
        m_syncStatusText = "Cloud Synchronized";
        emit syncStatusChanged();
        emit fileListUpdated();
    }
}
