#ifndef DESKTOPDAEMON_H
#define DESKTOPDAEMON_H

#include <QObject>
#include <QString>
#include "GameAggregatorService.h"
#include "XakCoachingService.h"
#include "VoltraFileSystemModel.h"
#include "XakChatService.h"
#include <QVariantMap>

// ----------------------------------------------------------------------------
// VoltraOS Desktop Daemon Class
// Bridges the QML UI with the underlying Voltra Kernel and VDS Compositor.
// ----------------------------------------------------------------------------
class DesktopDaemon : public QObject
{
    Q_OBJECT

    // Expose hardware stats to QML (e.g., for task manager or Xak AI)
    Q_PROPERTY(double cpuUsage READ cpuUsage NOTIFY statsChanged)
    Q_PROPERTY(double ramUsage READ ramUsage NOTIFY statsChanged)

    // Expose Subsystems to QML
    Q_PROPERTY(GameAggregatorService* aggregator READ aggregator CONSTANT)
    Q_PROPERTY(XakCoachingService* coaching READ coaching CONSTANT)
    Q_PROPERTY(VoltraFileSystemModel* fileSystem READ fileSystem CONSTANT)
    Q_PROPERTY(XakChatService* xakChat READ xakChat CONSTANT)

public:
    explicit DesktopDaemon(QObject *parent = nullptr);
    ~DesktopDaemon();

    // Invokable from QML: User clicks an app in the launcher
    Q_INVOKABLE void launchApplication(const QString &appId, const QString &type);
    
    // Headless Unified Aggregator Hook for Game Hub
    Q_INVOKABLE void executeGameURI(const QString &uri);

    // Invokable from QML: User asks Xak AI a system command
    Q_INVOKABLE QString processXakCommand(const QString &command);

    // Property getters
    double cpuUsage() const;
    double ramUsage() const;
    
    GameAggregatorService* aggregator() const { return m_aggregator; }
    XakCoachingService* coaching() const { return m_coaching; }
    VoltraFileSystemModel* fileSystem() const { return m_fileSystem; }
    XakChatService* xakChat() const { return m_xakChat; }

signals:
    // Emitted when kernel reports hardware stat changes
    void statsChanged();

    // Emitted when a new application window is spawned by the kernel
    void windowSpawned(const QString &windowId, const QString &title);

private:
    double m_cpuUsage;
    double m_ramUsage;

    GameAggregatorService *m_aggregator;
    XakCoachingService *m_coaching;
    VoltraFileSystemModel *m_fileSystem;
    XakChatService *m_xakChat;

    // Phase 2 Stubs: IPC Socket and Kernel Memory Mapper
    void initializeIPCServer();
    void mapKernelSharedMemory();
    
    // Simulate reading from /proc equivalent in Voltra Kernel
    void pollHardwareStats();
};

#endif // DESKTOPDAEMON_H
