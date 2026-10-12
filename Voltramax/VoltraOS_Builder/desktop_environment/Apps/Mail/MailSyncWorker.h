#ifndef MAILSYNCWORKER_H
#define MAILSYNCWORKER_H

/**
 * ============================================================================
 * XAKTEIR MAIL - NETWORK SYNC WORKER
 * ============================================================================
 *
 * Speaks the same wire protocol as `src/lib/mail/sync-client.ts`:
 *
 *   POST /api/mail/sync
 *   Authorization: Bearer <idToken>
 *   Idempotency-Key: <deviceId>:<cursor>
 *   {
 *     cursor, surface, deviceId, limit, fullResync,
 *     requestDispatch, mutations[], settings
 *   }
 *
 *   -> { cursor, serverTime, changes[], tombstones[],
 *        advanced{ snoozed[], scheduled[] }, hasMore,
 *        applied[], rejected[], cursorRewound }
 *
 * WHY THE PROTOCOL IS REPLICATED RATHER THAN SHARED
 * -------------------------------------------------
 * There is no schema generator in this build, so the request and response are
 * hand-written here against `types.ts`. The shapes are mirrored one field at a
 * time, and `MailSyncWorker::verifyResponse` checks the envelope before any
 * field is read - so a server that starts returning a different shape produces
 * a clear "the mail service returned an unexpected response" rather than a
 * cursor silently stuck at zero.
 *
 * OFFLINE-FIRST CONTRACT
 * ----------------------
 * The worker is a *background* participant. It never blocks the UI, never
 * throws across the QML boundary, and treats the cache as the only thing it is
 * allowed to write. Everything it does is expressed as:
 *
 *   1. drain the local mutation queue into the push half
 *   2. pull pages until `hasMore` is false
 *   3. apply each remote change to the cache, overwriting local rows
 *   4. drop tombstoned rows
 *   5. advance the cursor *last*, so a crash mid-apply replays rather than
 *      skips
 *
 * That ordering is the whole reliability story. Advancing the cursor before
 * the writes land is how a sync system loses mail.
 *
 * AUTHENTICATION
 * --------------
 * The worker does not hold credentials. It calls a token provider callback on
 * every request, so the token is fresh and is never persisted. A missing token
 * is reported as "not signed in" rather than as a network failure, because the
 * two need different fixes.
 *
 * BACKOFF
 * -------
 * Failures back off exponentially up to a five-minute ceiling, and the backoff
 * is reset by any successful request. The counter is not persisted: a restart
 * begins at the minimum delay, which is the right behaviour for a transient
 * network problem and harmless for a persistent one.
 */

#include <QDateTime>
#include <QJsonArray>
#include <QJsonObject>
#include <QList>
#include <QObject>
#include <QPointer>
#include <QString>
#include <QTimer>
#include <QUrl>

#include <functional>

#include "MailCache.h"
#include "MailTypes.h"

class QNetworkAccessManager;
class QNetworkReply;

namespace xakteir {
namespace mail {

/** A mutation as the server expects to receive it. Mirrors `MailMutation`. */
struct SyncMutation {
    QString id;
    QString collection;
    QString docId;
    /** "set" | "update" | "delete" */
    QString operation;
    /** Firestore-shaped field map. */
    QJsonObject fields;
    qint64 baseRevision = 0;
    qint64 clientTs = 0;

    QJsonObject toJson() const;
    static SyncMutation fromPending(const PendingMutation &mutation);
};

/** One remote change. Mirrors `MailRemoteChange`. */
struct RemoteChange {
    QString collection;
    QString docId;
    qint64 revision = 0;
    QJsonObject document;

    static RemoteChange fromJson(const QJsonObject &object);
};

/** The result of one successful sync round. */
struct SyncOutcome {
    int appliedCount = 0;
    int rejectedCount = 0;
    int tombstoneCount = 0;
    int mutationCount = 0;
    qint64 cursor = 0;
    bool hasMore = false;
    bool cursorRewound = false;
    QString summary;
};

/**
 * The result of a failed sync, classified so the UI can react differently.
 *
 * `Unauthorized` means "sign in again"; `Offline` means "you are fine, this is
 * the network"; `RateLimited` means "wait"; `ServerError` means "this is on
 * us". Collapsing these into one boolean would make the app tell a user with
 * no connection to check their password.
 */
enum class SyncFailure {
    None,
    Offline,
    Unauthorized,
    Forbidden,
    RateLimited,
    ServerError,
    Malformed,
    NoCache,
};

QString syncFailureName(SyncFailure failure);

/**
 * Performs sync against `/api/mail/sync` and writes the results to the cache.
 *
 * One instance per `MailEngine`. The worker owns its `QNetworkAccessManager`
 * and a single `QTimer`, so it never overlaps requests: a second `syncNow()`
 * while one is in flight is coalesced rather than queued, because a queue of
 * stale pulls is how a slow connection ends up hours behind.
 */
class MailSyncWorker : public QObject
{
    Q_OBJECT
    Q_PROPERTY(bool syncing READ isSyncing NOTIFY syncingChanged)
    Q_PROPERTY(bool online READ isOnline NOTIFY onlineChanged)
    Q_PROPERTY(qint64 cursor READ cursor NOTIFY cursorChanged)
    Q_PROPERTY(int pendingMutations READ pendingMutationCount NOTIFY pendingMutationsChanged)
    Q_PROPERTY(QString lastError READ lastError NOTIFY lastErrorChanged)
    Q_PROPERTY(qint64 lastSyncAt READ lastSyncAt NOTIFY lastSyncAtChanged)

public:
    explicit MailSyncWorker(QObject *parent = nullptr);
    ~MailSyncWorker() override;

    /** Sets the cache the worker writes to. Not owned. */
    void attach(MailCache *cache);

    /**
     * Supplies the base URL for the mail API.
     *
     * An empty string means same-origin, which is what the desktop app uses when
     * it is pointed at a local development server. A non-empty value must
     * include the scheme.
     */
    void setBaseUrl(const QString &baseUrl);
    QString baseUrl() const { return m_baseUrl; }

    /**
     * Supplies the device id. Stable across restarts, so the server can
     * de-duplicate an `Idempotency-Key` that is replayed after a crash.
     */
    void setDeviceId(const QString &deviceId);
    QString deviceId() const { return m_deviceId; }

    /** "voltramax" by default; the server uses it to attribute writes. */
    void setSurface(const QString &surface);
    QString surface() const { return m_surface; }

    /**
     * Supplies the token provider.
     *
     * Called on every request. Returning an empty string means "not signed in",
     * which is reported as `Unauthorized` rather than retried, because polling
     * for a token that will not appear until the user acts is a busy loop.
     */
    void setTokenProvider(const std::function<QString()> &provider);

    /** How often the background timer fires. Clamped to 15s..1h. */
    void setPollInterval(int seconds);
    int pollInterval() const { return m_pollIntervalSeconds; }

    /** Enables or disables the background timer. Manual `syncNow` still works. */
    void setAutoSync(bool enabled);
    bool autoSync() const { return m_autoSync; }

    /* ---- operations ---- */

    /**
     * Runs one sync round now.
     *
     * Returns false when a round is already running, when there is no cache, or
     * when there is no token. The signal `syncFinished` is the reliable way to
     * learn the outcome; the return value only says whether this call started
     * anything.
     */
    Q_INVOKABLE bool syncNow();
    /** Requests a full resync, discarding the cursor. Used after a cache wipe. */
    Q_INVOKABLE bool fullResync();
    /** Asks the server to run the dispatcher for this user. */
    Q_INVOKABLE bool requestDispatch();

    /**
     * Pushes the local mutation queue without pulling.
     *
     * Called after an optimistic local change so the write reaches the server
     * promptly rather than at the next poll. It is a no-op when the queue is
     * empty, and it is coalesced with an in-flight sync.
     */
    Q_INVOKABLE bool pushPending();

    bool isSyncing() const { return m_syncing; }
    bool isOnline() const { return m_online; }
    qint64 cursor() const { return m_cursor; }
    int pendingMutationCount() const;
    QString lastError() const { return m_lastError; }
    qint64 lastSyncAt() const { return m_lastSyncAt; }
    SyncFailure lastFailure() const { return m_lastFailure; }

    /**
     * Converts a queued `PendingMutation` into the wire shape.
     *
     * Exposed for tests: the queue's `payload` column is a JSON object, and
     * the mapping from that to a `fields` map is where a server-owned field
     * could leak into a push if it were not checked. It is checked here.
     */
    static SyncMutation toWireMutation(const PendingMutation &mutation, const QString &surface);

signals:
    void syncingChanged();
    void onlineChanged();
    void cursorChanged();
    void pendingMutationsChanged();
    void lastErrorChanged();
    void lastSyncAtChanged();
    void syncFinished(const SyncOutcome &outcome);
    void syncFailed(SyncFailure failure, const QString &message);
    /** Emitted for every accepted mutation, so the cache can drop its copy. */
    void mutationsAcknowledged(const QStringList &mutationIds);
    /** Emitted for every mutation the server refused, with the reason. */
    void mutationsRejected(const QStringList &mutationIds);
    /** A folder the dispatcher advanced (snoozed or scheduled). */
    void advancedFolder(const QString &collection, const QString &docId);

private slots:
    void onReplyFinished(QNetworkReply *reply);

private:
    /**
     * Starts one request, coalescing a second call while one is in flight.
     *
     * Returns true when this call began a request. Returns false when a round
     * was already running (and is recorded as coalesced), when there is no
     * cache, or when there is no token - in all of which case the outcome is
     * reported through `syncFailed` rather than through the return value.
     */
    bool startRequest();
    void finishWithOutcome(const SyncOutcome &outcome);
    void finishWithFailure(SyncFailure failure, const QString &message);
    void scheduleRetry(SyncFailure failure, const QString &message);
    void applyRemoteChanges(const QList<RemoteChange> &changes, SyncOutcome *outcome);
    void applyTombstones(const QJsonArray &tombstones, SyncOutcome *outcome);
    void handleAdvanced(const QJsonObject &advanced);
    void clearPendingFlag(const QStringList &mutationIds);

    /**
     * Checks the response envelope before anything is read from it.
     *
     * A malformed response is `Malformed`, not `ServerError`, because the two
     * have different fixes and merging them would send a user to check a status
     * page for what is really an incompatibility.
     */
    static bool verifyResponse(const QJsonObject &root, QString *error);

    /** Fields the client may push. Anything else is stripped, never sent. */
    static const QSet<QString> &pushableMessageFields();
    static const QSet<QString> &pushableCollectionFields(const QString &collection);

    MailCache *m_cache = nullptr;
    QNetworkAccessManager *m_nam = nullptr;
    QTimer m_timer;
    std::function<QString()> m_tokenProvider;

    QString m_baseUrl;
    QString m_deviceId;
    QString m_surface = QStringLiteral("voltramax");
    QString m_lastError;
    QString m_requestId;

    qint64 m_cursor = 0;
    qint64 m_lastSyncAt = 0;
    int m_pollIntervalSeconds = 120;
    int m_consecutiveFailures = 0;
    bool m_autoSync = true;
    bool m_syncing = false;
    bool m_online = false;
    bool m_fullResyncPending = false;
    bool m_dispatchPending = false;
    bool m_coalescedRetry = false;
    SyncFailure m_lastFailure = SyncFailure::None;

    /** In-flight reply, so a second `syncNow` can be coalesced rather than queued. */
    QPointer<QNetworkReply> m_activeReply;
};

} // namespace mail
} // namespace xakteir

Q_DECLARE_METATYPE(xakteir::mail::SyncOutcome)
Q_DECLARE_METATYPE(xakteir::mail::SyncFailure)

#endif // MAILSYNCWORKER_H
