#include "GameAggregatorService.h"
#include <QDebug>
#include <QUrl>

// ----------------------------------------------------------------------------
// GameAggregatorService Implementation
// ----------------------------------------------------------------------------

GameAggregatorService::GameAggregatorService(QObject *parent) : QObject(parent) {
    qInfo() << "[UAD] Game Aggregator Service initialized.";
    
    // Load mock telemetry database from NVMe storage (simulated)
    m_telemetryDB["Cyberpunk 2077"] = {"Cyberpunk 2077", 4320, QDateTime::currentDateTime().addDays(-1)}; // 72 hours
    m_telemetryDB["Fortnite"] = {"Fortnite", 12000, QDateTime::currentDateTime().addDays(-5)}; // 200 hours
}

GameAggregatorService::~GameAggregatorService() {
    qInfo() << "[UAD] Shutting down active games...";
    for (QProcess* proc : m_activeGames.values()) {
        if (proc && proc->state() == QProcess::Running) {
            proc->terminate();
        }
    }
}

void GameAggregatorService::launchGame(const QString &uri, const QString &gameName) {
    qInfo() << "[UAD] Launch request received for:" << gameName;
    qInfo() << "[UAD] Parsing URI Scheme:" << uri;

    // Track session start for telemetry
    m_sessionStartTimes[gameName] = QDateTime::currentDateTime();
    emit gameStarted(gameName);

    if (uri.startsWith("steam://")) {
        // Extract AppID
        QString appId = uri.split("/").last();
        spawnHeadlessSteam(appId);
    } else if (uri.startsWith("com.epicgames.launcher://")) {
        spawnHeadlessEpic(uri);
    } else {
        qWarning() << "[UAD] Unknown schema. Routing to native Voltra Executable engine.";
        // Fallback to native .exe execution
    }
}

void GameAggregatorService::spawnHeadlessSteam(const QString &appId) {
    qInfo() << "[UAD] [IPC] Checking if Steam daemon is running...";
    // In a real OS, we'd check `ps aux | grep steam`.
    qInfo() << "[UAD] [SYS] Steam is offline. Booting headless instance: steam.exe -silent -applaunch" << appId;
    
    QProcess *steamProc = new QProcess(this);
    // steamProc->start("steam", QStringList() << "-silent" << "-applaunch" << appId);
    // m_activeGames["SteamGame"] = steamProc;
}

void GameAggregatorService::spawnHeadlessEpic(const QString &launchCommand) {
    qInfo() << "[UAD] [IPC] Connecting to Epic Games local socket...";
    qInfo() << "[UAD] [SYS] Injecting launch command into headless daemon: " << launchCommand;
    
    QProcess *epicProc = new QProcess(this);
    // epicProc->start("EpicGamesLauncher", QStringList() << launchCommand);
    // m_activeGames["EpicGame"] = epicProc;
}

int GameAggregatorService::getPlaytimeMinutes(const QString &gameName) const {
    if (m_telemetryDB.contains(gameName)) {
        return m_telemetryDB[gameName].totalPlaytimeMinutes;
    }
    return 0;
}
