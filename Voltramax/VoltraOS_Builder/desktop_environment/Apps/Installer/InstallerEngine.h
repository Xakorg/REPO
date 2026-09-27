#ifndef INSTALLER_ENGINE_H
#define INSTALLER_ENGINE_H

#include <QObject>
#include <QString>
#include <QVariantList>
#include <QThread>

/**
 * ============================================================================
 * VOLTRA OS ENTERPRISE - TRUE BARE METAL INSTALLER
 * ============================================================================
 * 
 * Production C++ Backend for writing VoltraOS to physical NVMe/SATA drives.
 * NO MOCKING. This executes real POSIX system calls, reads real block devices 
 * from /sys/class/block, and executes standard mkfs/mount routines.
 * ============================================================================
 */

// Worker Thread to handle blocking I/O (mkfs, dd, tar) without freezing QML UI
class InstallerWorker : public QThread {
    Q_OBJECT
public:
    explicit InstallerWorker(const QString& targetDevice, QObject *parent = nullptr);
    void run() override;

signals:
    void progressUpdated(int percent, const QString& currentFile);
    void installationComplete();
    void installationFailed(const QString& reason);

private:
    QString m_targetDevice;
    bool executeCommand(const QString& cmd, QString& output);
};

class InstallerEngine : public QObject {
    Q_OBJECT

public:
    explicit InstallerEngine(QObject *parent = nullptr);
    ~InstallerEngine();

    // Directly reads the Linux sysfs to find physical drives
    Q_INVOKABLE QVariantList scanPhysicalDrives();

    // Initiates the destructive wipe and install sequence
    Q_INVOKABLE void wipeAndInstall(const QString& devicePath);

signals:
    void installProgress(int percent, const QString& currentFile);
    void installFinished();
    void installError(const QString& errorLog);

private:
    InstallerWorker* m_worker;
};

#endif // INSTALLER_ENGINE_H
