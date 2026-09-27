#ifndef GAME_AGGREGATOR_SERVICE_H
#define GAME_AGGREGATOR_SERVICE_H

#include <QObject>
#include <QString>
#include <QProcess>
#include <QMap>
#include <QDateTime>

// ----------------------------------------------------------------------------
// VoltraOS - Unified Game Aggregator Service (UAD)
// ----------------------------------------------------------------------------
// Responsible for headless background process management of third-party 
// store clients (Steam, Epic) and tracking gameplay telemetry.

struct GameTelemetry {
    QString gameName;
    int totalPlaytimeMinutes;
    QDateTime lastPlayed;
};

class GameAggregatorService : public QObject {
    Q_OBJECT
public:
    explicit GameAggregatorService(QObject *parent = nullptr);
    ~GameAggregatorService();

    // The main entry point for the Game Hub QML UI
    Q_INVOKABLE void launchGame(const QString &uri, const QString &gameName);
    
    // Telemetry API for the UI to display playtime
    Q_INVOKABLE int getPlaytimeMinutes(const QString &gameName) const;

signals:
    void gameStarted(const QString &gameName);
    void gameExited(const QString &gameName, int sessionPlaytimeMinutes);
    void telemetryUpdated(const QString &gameName, int totalPlaytimeMinutes);

private:
    void spawnHeadlessSteam(const QString &gameId);
    void spawnHeadlessEpic(const QString &launchCommand);
    
    // Internal state
    QMap<QString, QProcess*> m_activeGames;
    QMap<QString, GameTelemetry> m_telemetryDB; // Mock database in memory
    QMap<QString, QDateTime> m_sessionStartTimes;
};

#endif // GAME_AGGREGATOR_SERVICE_H
