#include "VoltMasterEngine.h"
#include "SyscallBridge.h"
#include <QDebug>
#include <QRandomGenerator>

VoltMasterEngine::VoltMasterEngine(QObject *parent) 
    : QObject(parent), m_globalCpuUsage(12.5), m_globalRamUsage(4096.0) 
{
    qDebug() << "[VoltMaster] Booting Ring 0 Telemetry Polling Engine...";
    
    initializeMockProcesses();

    // Poll the kernel 10 times a second (100ms)
    m_telemetryTimer = new QTimer(this);
    m_telemetryTimer->setInterval(100);
    connect(m_telemetryTimer, &QTimer::timeout, this, &VoltMasterEngine::pollKernelTelemetry);
    m_telemetryTimer->start();
}

VoltMasterEngine::~VoltMasterEngine() {
    m_telemetryTimer->stop();
    delete m_telemetryTimer;
}

double VoltMasterEngine::globalCpuUsage() const { return m_globalCpuUsage; }
double VoltMasterEngine::globalRamUsage() const { return m_globalRamUsage; }

void VoltMasterEngine::initializeMockProcesses() {
    m_processes = {
        {1, "voltra_kernel_init", 0.1, 12, true},
        {14, "vfs_worker_daemon", 0.0, 45, true},
        {42, "DesktopDaemon", 3.4, 320, false},
        {88, "Xakteir_Stream", 14.2, 1024, false},
        {102, "VoltBrowserEngine", 8.5, 850, false},
        {150, "drm_compositor", 12.0, 512, true},
        {190, "XakOpal_AI_Core", 0.5, 2048, false}
    };
}

QVariantList VoltMasterEngine::getProcessList() {
    QMutexLocker locker(&m_dataMutex);
    QVariantList list;
    for (const auto& proc : m_processes) {
        QVariantMap map;
        map["pid"] = proc.pid;
        map["name"] = proc.name;
        map["cpuPercent"] = QString::number(proc.cpuPercent, 'f', 1);
        map["ramMegabytes"] = proc.ramMegabytes;
        map["isKernelThread"] = proc.isKernelThread;
        list.append(map);
    }
    return list;
}

void VoltMasterEngine::killProcess(int pid) {
    QMutexLocker locker(&m_dataMutex);
    qDebug() << "[VoltMaster] FATAL: Issuing SIGKILL Syscall via int 0x80 to PID:" << pid;
    
    // Simulate Syscall success
    for (int i = 0; i < m_processes.size(); ++i) {
        if (m_processes[i].pid == pid) {
            m_processes.removeAt(i);
            break;
        }
    }
    emit processListUpdated();
}

void VoltMasterEngine::pollKernelTelemetry() {
    QMutexLocker locker(&m_dataMutex);
    
    double totalCpu = 0;
    double totalRam = 0;

    // Simulate micro-fluctuations in thread execution
    for (auto& proc : m_processes) {
        // CPU jitters by +/- 0.5%
        double jitter = (QRandomGenerator::global()->generateDouble() - 0.5);
        proc.cpuPercent = qMax(0.0, proc.cpuPercent + jitter);
        
        // RAM jitters by +/- 2MB
        int ramJitter = QRandomGenerator::global()->bounded(-2, 3);
        proc.ramMegabytes = qMax(10, proc.ramMegabytes + ramJitter);

        totalCpu += proc.cpuPercent;
        totalRam += proc.ramMegabytes;
    }

    m_globalCpuUsage = totalCpu;
    m_globalRamUsage = totalRam;

    emit globalStatsChanged();
    emit processListUpdated();
}
