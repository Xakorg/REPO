#ifndef VOLTMASTER_ENGINE_H
#define VOLTMASTER_ENGINE_H

#include <QObject>
#include <QTimer>
#include <QMutex>
#include <QVariantList>
#include <QVariantMap>

/**
 * ============================================================================
 * VOLTRA OS ENTERPRISE - VOLTMASTER C++ ENGINE
 * ============================================================================
 * 
 * Deep system diagnostics layer.
 * Simulates polling the C Kernel's CFS (Completely Fair Scheduler) and 
 * RAM allocators to broadcast live process telemetry to the User Space UI.
 * ============================================================================
 */

class VoltMasterEngine : public QObject {
    Q_OBJECT

    // Expose overall system stats to QML
    Q_PROPERTY(double globalCpuUsage READ globalCpuUsage NOTIFY globalStatsChanged)
    Q_PROPERTY(double globalRamUsage READ globalRamUsage NOTIFY globalStatsChanged)

public:
    explicit VoltMasterEngine(QObject *parent = nullptr);
    ~VoltMasterEngine();

    double globalCpuUsage() const;
    double globalRamUsage() const;

    // Send the massive list of process structs to QML
    Q_INVOKABLE QVariantList getProcessList();

    // Hardware Syscall Interrupt Hook
    Q_INVOKABLE void killProcess(int pid);

signals:
    void globalStatsChanged();
    void processListUpdated(); // Fired at 10Hz

private:
    double m_globalCpuUsage;
    double m_globalRamUsage;

    QTimer* m_telemetryTimer;
    QMutex m_dataMutex;

    // Internal Process Structure
    struct ProcessNode {
        int pid;
        QString name;
        double cpuPercent;
        int ramMegabytes;
        bool isKernelThread;
    };

    QList<ProcessNode> m_processes;

    void initializeMockProcesses();
    void pollKernelTelemetry();
};

#endif // VOLTMASTER_ENGINE_H
