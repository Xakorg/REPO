#include "DesktopDaemon.h"
#include <QDebug>
#include <QTimer>

// ----------------------------------------------------------------------------
// VoltraOS Desktop Daemon Implementation
// ----------------------------------------------------------------------------

DesktopDaemon::DesktopDaemon(QObject *parent)
    : QObject(parent), m_cpuUsage(0.0), m_ramUsage(0.0)
{
    qInfo() << "[VDS-DAEMON] Initializing Voltra Desktop Daemon...";
    
    m_aggregator = new GameAggregatorService(this);
    m_coaching = new XakCoachingService(this);
    m_fileSystem = new VoltraFileSystemModel(this);
    m_xakChat = new XakChatService(this);

    // Start background threads for IPC and Kernel Shared Memory
    initializeIPCServer();
    mapKernelSharedMemory();

    // Simulate real-time hardware polling from the Kernel every 2 seconds
    QTimer *statTimer = new QTimer(this);
    connect(statTimer, &QTimer::timeout, this, &DesktopDaemon::pollHardwareStats);
    statTimer->start(2000);
}

DesktopDaemon::~DesktopDaemon()
{
    qInfo() << "[VDS-DAEMON] Shutting down Daemon. Terminating child processes...";
}

// ----------------------------------------------------------------------------
// QML Invokables
// ----------------------------------------------------------------------------

void DesktopDaemon::launchApplication(const QString &appId, const QString &type)
{
    qInfo() << "[VDS-DAEMON] Launch request received for:" << appId << "Type:" << type;

    // PHASE 2: This is where we will execute the C syscall `voltra_sys_execve`
    if (type == "windows") {
        qInfo() << "[VDS-DAEMON] Routing to NT Subsystem (Wine Translation Layer)...";
    } else if (type == "linux") {
        qInfo() << "[VDS-DAEMON] Routing to POSIX Subsystem...";
    } else {
        qInfo() << "[VDS-DAEMON] Routing to Native VEX Execution Engine...";
    }

    emit windowSpawned("win_handle_" + QString::number(rand() % 1000), appId);
}

void DesktopDaemon::executeGameURI(const QString &uri)
{
    // Legacy routing: redirect to the new Aggregator service
    m_aggregator->launchGame(uri, "Game (Routed)");
}

QString DesktopDaemon::processXakCommand(const QString &command)
{
    qInfo() << "[VDS-DAEMON] Xak AI Command Intercepted:" << command;
    
    if (command.contains("teach me how to edit course", Qt::CaseInsensitive)) {
        m_coaching->requestCoachingExample("Fortnite", command);
        return "Activating VoltraClip Coaching Mode. Taking temporary control to demonstrate edit course macros.";
    }
    
    // In a real implementation, this pipes out to the dedicated Xak AI ML daemon
    if (command.contains("weather", Qt::CaseInsensitive)) {
        return "It's currently 14°C and raining. Perfect day to stay inside and play some Cyberpunk on the VoltraMax!";
    } else if (command.contains("launch", Qt::CaseInsensitive)) {
        return "Executing neural app routing protocol...";
    }
    
    return "I am deeply integrated into the Linux Kernel Foundation. How may I assist you further?";
}

// ----------------------------------------------------------------------------
// Internal Systems
// ----------------------------------------------------------------------------

void DesktopDaemon::initializeIPCServer()
{
    qInfo() << "[VDS-DAEMON] [SYS] Binding Local Domain Socket at /var/run/voltra/vds.sock...";
}

void DesktopDaemon::mapKernelSharedMemory()
{
    qInfo() << "[VDS-DAEMON] [SYS] Mapping Linux Framebuffer via mmap()...";
}

void DesktopDaemon::pollHardwareStats()
{
    m_cpuUsage = (rand() % 100) / 100.0;
    m_ramUsage = (rand() % 100) / 100.0;
    emit statsChanged();
}

double DesktopDaemon::cpuUsage() const { return m_cpuUsage; }
double DesktopDaemon::ramUsage() const { return m_ramUsage; }
