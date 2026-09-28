#ifndef DESKTOPDAEMON_H
#define DESKTOPDAEMON_H

#include <QObject>
#include <QString>
#include <QVariantMap>
#include <QTimer>
#include <QDateTime>
#include "GameAggregatorService.h"
#include "XakCoachingService.h"
#include "VoltraFileSystemModel.h"
#include "XakChatService.h"
#include "WeatherService.h"
#include "HardwareService.h"
#include "SoundService.h"

// ----------------------------------------------------------------------------
// VoltraOS Desktop Daemon Class
// Bridges the QML UI with the underlying Voltra Kernel and VDS Compositor.
// Supports 5 hardware modes: Normal, Stylus, TV, Tablet, 2-Tablet.
// ----------------------------------------------------------------------------
class DesktopDaemon : public QObject
{
    Q_OBJECT

    // Core hardware stats
    Q_PROPERTY(double cpuUsage READ cpuUsage NOTIFY statsChanged)
    Q_PROPERTY(double ramUsage READ ramUsage NOTIFY statsChanged)
    Q_PROPERTY(double gpuUsage READ gpuUsage NOTIFY statsChanged)
    Q_PROPERTY(double storageUsed READ storageUsed NOTIFY statsChanged)
    Q_PROPERTY(double storageTotal READ storageTotal NOTIFY statsChanged)
    Q_PROPERTY(int uptimeSeconds READ uptimeSeconds NOTIFY statsChanged)

    // Hardware mode properties
    Q_PROPERTY(QString currentHardwareMode READ currentHardwareMode NOTIFY hardwareModeChanged)
    Q_PROPERTY(int foldAngle READ foldAngle NOTIFY foldAngleChanged)
    Q_PROPERTY(bool isDualTabletMode READ isDualTabletMode NOTIFY dualTabletModeChanged)
    Q_PROPERTY(QString dualTabletLeftUser READ dualTabletLeftUser NOTIFY dualTabletUserChanged)
    Q_PROPERTY(QString dualTabletRightUser READ dualTabletRightUser NOTIFY dualTabletUserChanged)

    // Thermal properties
    Q_PROPERTY(QString cpuTemp READ cpuTemp NOTIFY statsChanged)
    Q_PROPERTY(QString gpuTemp READ gpuTemp NOTIFY statsChanged)

    // Settings properties
    Q_PROPERTY(bool soundEnabled READ soundEnabled WRITE setSoundEnabled NOTIFY soundChanged)
    Q_PROPERTY(bool hapticEnabled READ hapticEnabled WRITE setHapticEnabled NOTIFY hapticChanged)
    Q_PROPERTY(bool vpnEnabled READ vpnEnabled WRITE setVpnEnabled NOTIFY vpnChanged)
    Q_PROPERTY(bool firewallEnabled READ firewallEnabled WRITE setFirewallEnabled NOTIFY firewallChanged)
    Q_PROPERTY(bool diskEncryptionEnabled READ diskEncryptionEnabled WRITE setDiskEncryptionEnabled NOTIFY encryptionChanged)
    Q_PROPERTY(bool xakAIEnabled READ xakAIEnabled WRITE setXakAIEnabled NOTIFY xakAIChanged)
    Q_PROPERTY(bool micAccessEnabled READ micAccessEnabled WRITE setMicAccessEnabled NOTIFY micAccessChanged)
    Q_PROPERTY(bool cameraAccessEnabled READ cameraAccessEnabled WRITE setCameraAccessEnabled NOTIFY cameraAccessChanged)
    Q_PROPERTY(QString displayResolution READ displayResolution NOTIFY displayChanged)
    Q_PROPERTY(int displayRefreshRate READ displayRefreshRate NOTIFY displayChanged)
    Q_PROPERTY(bool hdrEnabled READ hdrEnabled WRITE setHdrEnabled NOTIFY hdrChanged)
    Q_PROPERTY(QString cpuScheduler READ cpuScheduler NOTIFY schedulerChanged)
    Q_PROPERTY(bool hyperThreadingEnabled READ hyperThreadingEnabled WRITE setHyperThreadingEnabled NOTIFY threadingChanged)
    Q_PROPERTY(bool xakteirMeshEnabled READ xakteirMeshEnabled WRITE setXakteirMeshEnabled NOTIFY meshChanged)
    Q_PROPERTY(QString wifiNetwork READ wifiNetwork NOTIFY networkChanged)
    Q_PROPERTY(bool kernelVisible READ kernelVisible NOTIFY kernelVisibilityChanged)
    Q_PROPERTY(QString ecoAIWebsite READ ecoAIWebsite NOTIFY ecoAIChanged)
    Q_PROPERTY(int ecoAISessions READ ecoAISessions NOTIFY ecoAIChanged)

    // Expose Subsystems to QML
    Q_PROPERTY(GameAggregatorService* aggregator READ aggregator CONSTANT)
    Q_PROPERTY(XakCoachingService* coaching READ coaching CONSTANT)
    Q_PROPERTY(VoltraFileSystemModel* fileSystem READ fileSystem CONSTANT)
    Q_PROPERTY(XakChatService* xakChat READ xakChat CONSTANT)
    Q_PROPERTY(WeatherService* weather READ weather CONSTANT)
    Q_PROPERTY(HardwareService* hardware READ hardware CONSTANT)
    Q_PROPERTY(SoundService* sound READ sound CONSTANT)

public:
    explicit DesktopDaemon(QObject *parent = nullptr);
    ~DesktopDaemon();

    // Invokable from QML: User clicks an app in the launcher
    Q_INVOKABLE void launchApplication(const QString &appId, const QString &type);
    
    // Headless Unified Aggregator Hook for Game Hub
    Q_INVOKABLE void executeGameURI(const QString &uri);

    // Invokable from QML: User asks Xak AI a system command
    Q_INVOKABLE QString processXakCommand(const QString &command);

    // Hardware Mode Management (5 modes)
    Q_INVOKABLE void setHardwareMode(const QString &mode);
    Q_INVOKABLE QString currentHardwareMode() const;
    Q_INVOKABLE void setFoldAngle(int angle);
    Q_INVOKABLE int foldAngle() const;
    Q_INVOKABLE void toggleDualTabletMode();
    Q_INVOKABLE bool isDualTabletMode() const;
    Q_INVOKABLE void setDualTabletUsers(const QString &leftUser, const QString &rightUser);
    Q_INVOKABLE void detectHardwareMode();

    // Audio Management
    Q_INVOKABLE void playSound(const QString &soundFile);
    Q_INVOKABLE void setVolume(int level);
    Q_INVOKABLE int volume() const;
    Q_INVOKABLE void muteAudio();
    Q_INVOKABLE void unmuteAudio();

    // File Management
    Q_INVOKABLE QStringList listFiles(const QString &path);
    Q_INVOKABLE bool createDirectory(const QString &path);
    Q_INVOKABLE bool deleteFile(const QString &path);
    Q_INVOKABLE QString readFile(const QString &path);
    Q_INVOKABLE bool writeFile(const QString &path, const QString &content);

    // Network Management
    Q_INVOKABLE void connectToNetwork(const QString &ssid, const QString &password);
    Q_INVOKABLE void disconnectFromNetwork();
    Q_INVOKABLE QStringList scanNetworks();
    Q_INVOKABLE void setDns(const QString &primary, const QString &secondary);

    // Xak AI Management
    Q_INVOKABLE void toggleXakAI();
    Q_INVOKABLE void setXakVoiceOutput(bool enabled);
    Q_INVOKABLE void setXakResponseStyle(const QString &style);
    Q_INVOKABLE void setXakMaxResponseLength(int length);
    Q_INVOKABLE void toggleXakIndexing();
    Q_INVOKABLE void setEcoAIWebsite(const QString &url);
    Q_INVOKABLE void addEcoAILearningLink(const QString &url);
    Q_INVOKABLE void toggleEcoAISharing();

    // System Info
    Q_INVOKABLE QString getSystemInfo();
    Q_INVOKABLE QVariantMap getHardwareInfo();
    Q_INVOKABLE QVariantMap getKernelInfo();
    Q_INVOKABLE void factoryReset();

    // Property getters
    double cpuUsage() const { return m_cpuUsage; }
    double ramUsage() const { return m_ramUsage; }
    double gpuUsage() const { return m_gpuUsage; }
    double storageUsed() const { return m_storageUsed; }
    double storageTotal() const { return m_storageTotal; }
    int uptimeSeconds() const { return m_uptimeSeconds; }
    QString cpuTemp() const { return m_cpuTemp; }
    QString gpuTemp() const { return m_gpuTemp; }
    QString currentHardwareMode() const { return m_currentHardwareMode; }
    int foldAngle() const { return m_foldAngle; }
    bool isDualTabletMode() const { return m_dualTabletMode; }
    QString dualTabletLeftUser() const { return m_dualTabletLeftUser; }
    QString dualTabletRightUser() const { return m_dualTabletRightUser; }
    bool soundEnabled() const { return m_soundEnabled; }
    bool hapticEnabled() const { return m_hapticEnabled; }
    bool vpnEnabled() const { return m_vpnEnabled; }
    bool firewallEnabled() const { return m_firewallEnabled; }
    bool diskEncryptionEnabled() const { return m_diskEncryptionEnabled; }
    bool xakAIEnabled() const { return m_xakAIEnabled; }
    bool micAccessEnabled() const { return m_micAccessEnabled; }
    bool cameraAccessEnabled() const { return m_cameraAccessEnabled; }
    QString displayResolution() const { return m_displayResolution; }
    int displayRefreshRate() const { return m_displayRefreshRate; }
    bool hdrEnabled() const { return m_hdrEnabled; }
    QString cpuScheduler() const { return m_cpuScheduler; }
    bool hyperThreadingEnabled() const { return m_hyperThreadingEnabled; }
    bool xakteirMeshEnabled() const { return m_xakteirMeshEnabled; }
    QString wifiNetwork() const { return m_wifiNetwork; }
    bool kernelVisible() const { return m_kernelVisible; }
    QString ecoAIWebsite() const { return m_ecoAIWebsite; }
    int ecoAISessions() const { return m_ecoAISessions; }

    // Setters
    void setSoundEnabled(bool enabled) { m_soundEnabled = enabled; emit soundChanged(); }
    void setHapticEnabled(bool enabled) { m_hapticEnabled = enabled; emit hapticChanged(); }
    void setVpnEnabled(bool enabled) { m_vpnEnabled = enabled; emit vpnChanged(); }
    void setFirewallEnabled(bool enabled) { m_firewallEnabled = enabled; emit firewallChanged(); }
    void setDiskEncryptionEnabled(bool enabled) { m_diskEncryptionEnabled = enabled; emit encryptionChanged(); }
    void setXakAIEnabled(bool enabled) { m_xakAIEnabled = enabled; emit xakAIChanged(); }
    void setMicAccessEnabled(bool enabled) { m_micAccessEnabled = enabled; emit micAccessChanged(); }
    void setCameraAccessEnabled(bool enabled) { m_cameraAccessEnabled = enabled; emit cameraAccessChanged(); }
    void setHdrEnabled(bool enabled) { m_hdrEnabled = enabled; emit hdrChanged(); }
    void setHyperThreadingEnabled(bool enabled) { m_hyperThreadingEnabled = enabled; emit threadingChanged(); }
    void setXakteirMeshEnabled(bool enabled) { m_xakteirMeshEnabled = enabled; emit meshChanged(); }

signals:
    // Emitted when kernel reports hardware stat changes
    void statsChanged();

    // Emitted when a new application window is spawned
    void windowSpawned(const QString &windowId, const QString &title);

    // Hardware mode signals
    void hardwareModeChanged();
    void foldAngleChanged();
    void dualTabletModeChanged();
    void dualTabletUserChanged();

    // Settings signals
    void soundChanged();
    void hapticChanged();
    void vpnChanged();
    void firewallChanged();
    void encryptionChanged();
    void xakAIChanged();
    void micAccessChanged();
    void cameraAccessChanged();
    void displayChanged();
    void hdrChanged();
    void schedulerChanged();
    void threadingChanged();
    void meshChanged();
    void networkChanged();
    void kernelVisibilityChanged();
    void ecoAIChanged();

private:
    // Hardware stats
    double m_cpuUsage;
    double m_ramUsage;
    double m_gpuUsage;
    double m_storageUsed;
    double m_storageTotal;
    int m_uptimeSeconds;
    QString m_cpuTemp;
    QString m_gpuTemp;

    // Hardware mode support (5 modes)
    QString m_currentHardwareMode;
    int m_foldAngle;
    bool m_dualTabletMode;
    QString m_dualTabletLeftUser;
    QString m_dualTabletRightUser;
    bool m_isStylusHovered;
    bool m_isStylusPressed;
    double m_stylusPressure;
    int m_stylusTilt;

    // Settings
    bool m_soundEnabled;
    bool m_hapticEnabled;
    bool m_vpnEnabled;
    bool m_firewallEnabled;
    bool m_diskEncryptionEnabled;
    bool m_xakAIEnabled;
    bool m_micAccessEnabled;
    bool m_cameraAccessEnabled;
    QString m_displayResolution;
    int m_displayRefreshRate;
    bool m_hdrEnabled;
    QString m_cpuScheduler;
    bool m_hyperThreadingEnabled;
    bool m_xakteirMeshEnabled;
    QString m_wifiNetwork;
    bool m_kernelVisible;
    QString m_ecoAIWebsite;
    int m_ecoAISessions;

    // Subsystems
    GameAggregatorService *m_aggregator;
    XakCoachingService *m_coaching;
    VoltraFileSystemModel *m_fileSystem;
    XakChatService *m_xakChat;
    WeatherService *m_weather;
    HardwareService *m_hardware;
    SoundService *m_sound;

    // Internal Systems
    void initializeIPCServer();
    void mapKernelSharedMemory();
    void pollHardwareStats();
    void updateUptime();
    void detectFoldAngle();
    void initSoundSystem();
    void initFileManager();
    void initNetworkStack();
    void initHardwareServices();
    void initEcoAISystem();
    void loadKernelModules();

    // 5-Mode Hardware Detection
    void enterNormalMode();
    void enterStylusMode();
    void enterTVMode();
    void enterTabletMode();
    void enterDualTabletMode();
    void exitHardwareMode();

    // Kernel module loaders
    bool loadSoundInit();
    bool loadFileManagerInit();
    bool loadNetStackInit();
    bool loadDeviceManager();
    bool loadVMSSubsystem();
};

#endif // DESKTOPDAEMON_H
