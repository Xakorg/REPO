#include "MailSyncWorker.h"

#include <QBuffer>
#include <QDir>
#include <QJsonDocument>
#include <QJsonArray>
#include <QJsonObject>
#include <QNetworkAccessManager>
#include <QNetworkReply>
#include <QNetworkRequest>
#include <QRandomGenerator>
#include <QSettings>
#include <QStandardPaths>
#include <QTimer>
#include <QUrlQuery>

#include <algorithm>

namespace xakteir {
namespace mail {

/* ========================================================================== */
/* Protocol constants                                                         */
/* ========================================================================== */

/** Page size for the pull half. Matches `MAIL_LIMITS.maxThreadsPerPullPage`. */
constexpr int PullPageSize = 400;

/** Mutations per push. Matches `MAIL_LIMITS.maxMutationsPerPush`. */
constexpr int MaxMutationsPerPush = 400;

/** Retry backoff bounds, in milliseconds. */
constexpr int MinBackoffMs = 1000;
constexpr int MaxBackoffMs = 5 * 60 * 1000;

/** Poll interval clamp, in seconds. */
constexpr int MinPollSeconds = 15;
constexpr int MaxPollSeconds = 3600;

/* ========================================================================== */
/* SyncMutation                                                               */
/* ========================================================================== */

QJsonObject SyncMutation::toJson() const
{
    QJsonObject object;
    object.insert(QStringLiteral("id"), id);
    object.insert(QStringLiteral("collection"), collection);
    object.insert(QStringLiteral("docId"), docId);
    object.insert(QStringLiteral("op"), operation);
    object.insert(QStringLiteral("fields"), fields);
    object.insert(QStringLiteral("baseRevision"), double(baseRevision));
    object.insert(QStringLiteral("clientTs"), double(clientTs));
    return object;
}

SyncMutation SyncMutation::fromPending(const PendingMutation &mutation)
{
    SyncMutation wire;
    wire.id = mutation.mutationId;
    wire.collection = mutation.collection;
    wire.docId = mutation.docId;
    wire.operation = mutation.operation;
    wire.baseRevision = 0;
    wire.clientTs = mutation.createdAt;

    const QJsonObject payload = QJsonDocument::fromJson(mutation.payloadJson.toUtf8()).object();
    if (!payload.isEmpty())
        wire.fields = payload;
    else if (!mutation.payloadJson.isEmpty()) {
        // A payload that is not an object is a corrupt queue entry. Leaving it
        // as an empty field map would send a mutation the server reads as
        // "set nothing", which is worse than skipping it entirely.
        wire.fields = QJsonObject();
    }
    return wire;
}

RemoteChange RemoteChange::fromJson(const QJsonObject &object)
{
    RemoteChange change;
    change.collection = object.value(QStringLiteral("collection")).toString();
    change.docId = object.value(QStringLiteral("docId")).toString();
    change.revision = qint64(object.value(QStringLiteral("revision")).toDouble());
    change.document = object;
    return change;
}

QString syncFailureName(SyncFailure failure)
{
    switch (failure) {
    case SyncFailure::None:        return QStringLiteral("none");
    case SyncFailure::Offline:     return QStringLiteral("offline");
    case SyncFailure::Unauthorized:return QStringLiteral("unauthorized");
    case SyncFailure::Forbidden:   return QStringLiteral("forbidden");
    case SyncFailure::RateLimited: return QStringLiteral("rate-limited");
    case SyncFailure::ServerError: return QStringLiteral("server-error");
    case SyncFailure::Malformed:   return QStringLiteral("malformed");
    case SyncFailure::NoCache:     return QStringLiteral("no-cache");
    }
    return QStringLiteral("server-error");
}

/* ========================================================================== */
/* Lifecycle                                                                  */
/* ========================================================================== */

MailSyncWorker::MailSyncWorker(QObject *parent)
    : QObject(parent)
    , m_nam(new QNetworkAccessManager(this))
    , m_timer(this)
{
    m_timer.setSingleShot(true);
    connect(&m_timer, &QTimer::timeout, this, [this]() {
        syncNow();
    });

    // A stable device id per installation. It is used in the `Idempotency-Key`
    // header so a crash that replays the same request is de-duplicated by the
    // server rather than applied twice. It is not a security boundary.
    QSettings settings(QStringLiteral("Xakteir"), QStringLiteral("VoltraMail"));
    m_deviceId = settings.value(QStringLiteral("deviceId")).toString();
    if (m_deviceId.isEmpty()) {
        m_deviceId = QStringLiteral("voltramax-%1-%2")
                         .arg(QRandomGenerator::system()->generate64() & 0xffffffffffffull, 0, 16)
                         .arg(QDateTime::currentMSecsSinceEpoch());
        settings.setValue(QStringLiteral("deviceId"), m_deviceId);
        settings.sync();
    }

    m_cursor = settings.value(QStringLiteral("syncCursor"), 0).toLongLong();
    m_pollIntervalSeconds = settings.value(QStringLiteral("pollIntervalSeconds"), 120).toInt();
    m_pollIntervalSeconds = std::clamp(m_pollIntervalSeconds, MinPollSeconds, MaxPollSeconds);
    m_autoSync = settings.value(QStringLiteral("autoSync"), true).toBool();

    if (m_autoSync)
        m_timer.start(m_pollIntervalSeconds * 1000);
}

MailSyncWorker::~MailSyncWorker()
{
    // Persist the cursor on the way out. It is the one value that cannot be
    // recomputed locally, and losing it forces a full resync on next launch.
    QSettings settings(QStringLiteral("Xakteir"), QStringLiteral("VoltraMail"));
    settings.setValue(QStringLiteral("syncCursor"), m_cursor);
    settings.setValue(QStringLiteral("pollIntervalSeconds"), m_pollIntervalSeconds);
    settings.setValue(QStringLiteral("autoSync"), m_autoSync);
    settings.sync();
}

void MailSyncWorker::attach(MailCache *cache)
{
    if (m_cache == cache)
        return;
    if (m_cache)
        disconnect(m_cache, nullptr, this, nullptr);

    m_cache = cache;
    if (m_cache) {
        connect(m_cache, &MailCache::pendingMutationsChanged, this, [this]() {
            emit pendingMutationsChanged();
        });
    }
    emit pendingMutationsChanged();
}

void MailSyncWorker::setBaseUrl(const QString &baseUrl)
{
    m_baseUrl = baseUrl;
}

void MailSyncWorker::setDeviceId(const QString &deviceId)
{
    if (!deviceId.isEmpty())
        m_deviceId = deviceId;
}

void MailSyncWorker::setSurface(const QString &surface)
{
    if (!surface.isEmpty())
        m_surface = surface;
}

void MailSyncWorker::setTokenProvider(const std::function<QString()> &provider)
{
    m_tokenProvider = provider;
}

void MailSyncWorker::setPollInterval(int seconds)
{
    m_pollIntervalSeconds = std::clamp(seconds, MinPollSeconds, MaxPollSeconds);
    if (m_autoSync && !m_timer.isActive())
        m_timer.start(m_pollIntervalSeconds * 1000);
    else if (m_autoSync)
        m_timer.start(m_pollIntervalSeconds * 1000);
}

void MailSyncWorker::setAutoSync(bool enabled)
{
    m_autoSync = enabled;
    if (enabled)
        m_timer.start(m_pollIntervalSeconds * 1000);
    else
        m_timer.stop();
}

int MailSyncWorker::pendingMutationCount() const
{
    return m_cache ? m_cache->pendingMutationCount() : 0;
}

/* ========================================================================== */
/* Pushable field allowlist                                                   */
/* ========================================================================== */

/**
 * Fields the client is allowed to push for a message.
 *
 * The server re-derives everything outside this set (auth results, threat
 * score, snippet, search tokens, revision), so sending them would be rejected.
 * Checking here means the user sees "this change was refused" rather than a
 * silent no-op, and it means the queue never fills with mutations that can
 * never succeed.
 */
const QSet<QString> &MailSyncWorker::pushableMessageFields()
{
    static const QSet<QString> fields = {
        QStringLiteral("isRead"), QStringLiteral("isStarred"), QStringLiteral("isPinned"),
        QStringLiteral("folder"), QStringLiteral("labels"), QStringLiteral("category"),
        QStringLiteral("snoozedUntil"), QStringLiteral("scheduleAt"),
        QStringLiteral("readAt"), QStringLiteral("requestReadReceipt"),
        QStringLiteral("awaitingReply"), QStringLiteral("deletedAt"),
        QStringLiteral("updatedAt"),
    };
    return fields;
}

const QSet<QString> &MailSyncWorker::pushableCollectionFields(const QString &collection)
{
    static const QSet<QString> messageFields = pushableMessageFields();
    static const QSet<QString> threadFields = {
        QStringLiteral("isStarred"), QStringLiteral("isPinned"), QStringLiteral("labels"),
        QStringLiteral("unreadCount"), QStringLiteral("updatedAt"),
    };
    static const QSet<QString> labelFields = {
        QStringLiteral("name"), QStringLiteral("color"), QStringLiteral("sortOrder"),
    };
    static const QSet<QString> draftFields = {
        QStringLiteral("subject"), QStringLiteral("bodyText"), QStringLiteral("bodyHtml"),
        QStringLiteral("to"), QStringLiteral("cc"), QStringLiteral("bcc"),
        QStringLiteral("replyTo"), QStringLiteral("accountId"), QStringLiteral("attachmentIds"),
        QStringLiteral("updatedAt"),
    };
    static const QSet<QString> settingsFields = {
        QStringLiteral("theme"), QStringLiteral("density"), QStringLiteral("signatureId"),
        QStringLiteral("defaultAccountId"), QStringLiteral("autoSync"),
        QStringLiteral("notificationsEnabled"), QStringLiteral("compactList"),
    };

    if (collection == QLatin1String("messages")) return messageFields;
    if (collection == QLatin1String("threads")) return threadFields;
    if (collection == QLatin1String("labels")) return labelFields;
    if (collection == QLatin1String("drafts")) return draftFields;
    if (collection == QLatin1String("settings")) return settingsFields;

    // Unknown collections get an empty allowlist: nothing is pushed. This is
    // the safe default, because an unreviewed collection could otherwise carry
    // a field the server treats as authoritative.
    static const QSet<QString> empty;
    return empty;
}

/* ========================================================================== */
/* Sync entry points                                                          */
/* ========================================================================== */

bool MailSyncWorker::syncNow()
{
    return startRequest();
}

bool MailSyncWorker::fullResync()
{
    m_fullResyncPending = true;
    return startRequest();
}

bool MailSyncWorker::requestDispatch()
{
    m_dispatchPending = true;
    return startRequest();
}

bool MailSyncWorker::pushPending()
{
    if (!m_cache || m_cache->pendingMutationCount() == 0)
        return false;
    return startRequest();
}

/**
 * Starts one request, coalescing a second call while one is in flight.
 *
 * Coalescing rather than queueing matters: a queue of stale pulls would each
 * carry the old cursor, so a slow connection would end up applying the same
 * changes repeatedly and falling further behind.
 */
bool MailSyncWorker::startRequest()
{
    if (m_syncing) {
        // Remember that something asked, so the in-flight round triggers one
        // more when it finishes.
        m_coalescedRetry = true;
        return false;
    }

    if (!m_cache || !m_cache->isOpen()) {
        finishWithFailure(SyncFailure::NoCache,
                          QStringLiteral("The local mail cache is not open, so there is nowhere to store synced mail."));
        return false;
    }

    QString token;
    if (m_tokenProvider)
        token = m_tokenProvider();
    if (token.isEmpty()) {
        // Not signed in is a distinct state from "offline". Polling for a token
        // that will not appear until the user acts is a busy loop.
        finishWithFailure(SyncFailure::Unauthorized,
                          QStringLiteral("Not signed in to Xakteir, so the mailbox cannot be synced."));
        return false;
    }

    if (!m_activeReply.isNull()) {
        m_coalescedRetry = true;
        return false;
    }

    m_syncing = true;
    emit syncingChanged();

    // Drain the local queue before pulling, so the server sees our intent
    // before it sends us everyone else's. Only the first page carries
    // mutations, matching the web client.
    QJsonArray mutationArray;
    if (m_cache) {
        const QList<PendingMutation> pending = m_cache->pendingMutations(MaxMutationsPerPush);
        for (const PendingMutation &pendingMutation : pending) {
            const SyncMutation wire = toWireMutation(pendingMutation, m_surface);
            // Strip any field that is not on the allowlist for this collection.
            QJsonObject filtered;
            const QSet<QString> &allowed = pushableCollectionFields(wire.collection);
            const QStringList keys = wire.fields.keys();
            for (const QString &key : keys) {
                if (allowed.contains(key))
                    filtered.insert(key, wire.fields.value(key));
            }
            SyncMutation clean = wire;
            clean.fields = filtered;
            mutationArray.append(clean.toJson());
        }
    }

    const qint64 cursor = m_fullResyncPending ? 0 : m_cursor;

    QJsonObject body;
    body.insert(QStringLiteral("cursor"), double(cursor));
    body.insert(QStringLiteral("surface"), m_surface);
    body.insert(QStringLiteral("deviceId"), m_deviceId);
    body.insert(QStringLiteral("limit"), PullPageSize);
    body.insert(QStringLiteral("fullResync"), m_fullResyncPending);
    body.insert(QStringLiteral("requestDispatch"), m_dispatchPending);
    body.insert(QStringLiteral("mutations"), mutationArray);
    body.insert(QStringLiteral("settings"), QJsonValue::Null);

    const QByteArray payload = QJsonDocument(body).toJson(QJsonDocument::Compact);

    QUrl url(m_baseUrl + QStringLiteral("/api/mail/sync"));
    QNetworkRequest request(url);
    request.setHeader(QNetworkRequest::ContentTypeHeader, QStringLiteral("application/json"));
    request.setRawHeader("Authorization", QStringLiteral("Bearer %1").arg(token).toUtf8());
    // The idempotency key is per device *and* cursor, so a crash that replays
    // the same request is de-duplicated rather than applied twice.
    request.setRawHeader("Idempotency-Key",
                         QStringLiteral("%1:%2").arg(m_deviceId).arg(cursor).toUtf8());
    // Sync responses contain the whole mailbox delta; they must not be cached
    // by an intermediary that would replay a stale one.
    request.setAttribute(QNetworkRequest::CacheLoadControlAttribute, QNetworkRequest::AlwaysNetwork);
    request.setTransferTimeout(30000);

    QNetworkReply *reply = m_nam->post(request, payload);
    m_activeReply = reply;
    m_requestId = QStringLiteral("sync-%1").arg(QDateTime::currentMSecsSinceEpoch());

    connect(reply, &QNetworkReply::finished, this, &MailSyncWorker::onReplyFinished);

    return true;
}

/* ========================================================================== */
/* Reply handling                                                             */
/* ========================================================================== */

void MailSyncWorker::onReplyFinished(QNetworkReply *reply)
{
    if (reply != m_activeReply.data()) {
        // A reply we already handled, or one cancelled behind our back. Ignore
        // it rather than double-applying its changes.
        reply->deleteLater();
        return;
    }
    m_activeReply.clear();

    const int status = reply->attribute(QNetworkRequest::HttpStatusCodeAttribute).toInt();
    const QByteArray raw = reply->readAll();
    const QString contentType = reply->header(QNetworkRequest::ContentTypeHeader).toString();
    // Captured before `deleteLater()` takes effect: a transport failure (no
    // status code at all) has to report *why*, and asking a deleted reply for
    // its error string afterwards is undefined behaviour.
    const QString transportError = reply->errorString();

    QString parseError;
    QJsonObject root;
    if (!raw.isEmpty()) {
        QJsonParseError parseInfo;
        const QJsonDocument doc = QJsonDocument::fromJson(raw, &parseInfo);
        if (doc.isObject()) {
            root = doc.object();
        } else if (doc.isArray()) {
            // Some proxies return an array body on failure; treat it as an
            // empty object so the status code below decides the outcome.
            root = QJsonObject();
        } else {
            parseError = parseInfo.errorString();
        }
    }
    reply->deleteLater();

    if (status == 0) {
        // No status code means the request never completed: DNS, TLS, or the
        // machine went to sleep. This is the offline case.
        scheduleRetry(SyncFailure::Offline,
                      QStringLiteral("Could not reach the Xakteir mail service: %1")
                          .arg(transportError));
        return;
    }

    if (status == 401) {
        m_consecutiveFailures += 1;
        emit onlineChanged();
        finishWithFailure(SyncFailure::Unauthorized,
                          QStringLiteral("The signed-in session has expired. Sign in again to resume syncing."));
        return;
    }
    if (status == 403) {
        finishWithFailure(SyncFailure::Forbidden,
                          QStringLiteral("This account is not permitted to sync with the mail service."));
        return;
    }
    if (status == 429) {
        const QString retryAfter = QString::fromUtf8(reply->rawHeader("Retry-After"));
        int seconds = retryAfter.toInt();
        if (seconds <= 0)
            seconds = 30;
        scheduleRetry(SyncFailure::RateLimited,
                      QStringLiteral("The mail service is rate limiting this device. It will retry in %1 seconds.")
                          .arg(seconds));
        m_timer.start(seconds * 1000);
        return;
    }
    if (status >= 500) {
        scheduleRetry(SyncFailure::ServerError,
                      QStringLiteral("The mail service returned an error (HTTP %1). It will retry shortly.")
                          .arg(status));
        return;
    }
    if (status < 200 || status >= 300) {
        const QString detail = root.value(QStringLiteral("error")).toString(
            QStringLiteral("HTTP %1").arg(status));
        scheduleRetry(SyncFailure::ServerError,
                      QStringLiteral("The mail service rejected the sync request: %1").arg(detail));
        return;
    }

    if (!parseError.isEmpty()) {
        scheduleRetry(SyncFailure::Malformed,
                      QStringLiteral("The mail service returned a response that is not valid JSON: %1")
                          .arg(parseError));
        return;
    }

    if (!contentType.contains(QLatin1String("json"), Qt::CaseInsensitive) && !root.isEmpty()) {
        // A 200 with a non-JSON body is usually a proxy or login page. Reporting
        // it as malformed rather than as a success keeps the cursor from
        // advancing over data that was never there.
        scheduleRetry(SyncFailure::Malformed,
                      QStringLiteral("The mail service returned a %1 response instead of JSON.")
                          .arg(contentType.isEmpty() ? QStringLiteral("non-JSON") : contentType));
        return;
    }

    QString verifyError;
    if (!verifyResponse(root, &verifyError)) {
        scheduleRetry(SyncFailure::Malformed, verifyError);
        return;
    }

    m_consecutiveFailures = 0;
    if (!m_online) {
        m_online = true;
        emit onlineChanged();
    }

    SyncOutcome outcome;

    // 1. Apply remote changes to the cache. The cursor is advanced *last*, so
    //    a crash mid-apply replays rather than skips.
    const QJsonArray changesArray = root.value(QStringLiteral("changes")).toArray();
    QList<RemoteChange> changes;
    changes.reserve(changesArray.size());
    for (const QJsonValue &value : changesArray) {
        const RemoteChange change = RemoteChange::fromJson(value.toObject());
        if (!change.collection.isEmpty() && !change.docId.isEmpty())
            changes.append(change);
    }
    applyRemoteChanges(changes, &outcome);

    // 2. Drop tombstoned rows.
    const QJsonArray tombstonesArray = root.value(QStringLiteral("tombstones")).toArray();
    applyTombstones(tombstonesArray, &outcome);

    // 3. Folders the dispatcher advanced while we were away.
    const QJsonObject advanced = root.value(QStringLiteral("advanced")).toObject();
    handleAdvanced(advanced);

    // 4. Mutations the server accepted or refused.
    const QJsonArray appliedArray = root.value(QStringLiteral("applied")).toArray();
    QStringList acknowledged;
    for (const QJsonValue &value : appliedArray) {
        const QJsonObject object = value.toObject();
        const QString id = object.value(QStringLiteral("id")).toString(
            object.value(QStringLiteral("mutationId")).toString());
        if (!id.isEmpty())
            acknowledged.append(id);
    }
    if (!acknowledged.isEmpty()) {
        clearPendingFlag(acknowledged);
        emit mutationsAcknowledged(acknowledged);
    }

    const QJsonArray rejectedArray = root.value(QStringLiteral("rejected")).toArray();
    QStringList rejected;
    for (const QJsonValue &value : rejectedArray) {
        const QJsonObject object = value.toObject();
        const QString id = object.value(QStringLiteral("id")).toString(
            object.value(QStringLiteral("mutationId")).toString());
        if (id.isEmpty())
            continue;
        rejected.append(id);
        if (m_cache) {
            const QString reason = object.value(QStringLiteral("reason")).toString(
                object.value(QStringLiteral("message")).toString(
                    QStringLiteral("The server refused this change.")));
            m_cache->markMutationFailed(id, reason);
        }
    }
    if (!rejected.isEmpty())
        emit mutationsRejected(rejected);

    // 5. Advance the cursor, but never backwards. A server counter reset is
    //    repaired on the next full resync rather than by rewinding our view.
    const qint64 serverCursor = qint64(root.value(QStringLiteral("cursor")).toDouble(m_cursor));
    const bool rewound = root.value(QStringLiteral("cursorRewound")).toBool()
        || serverCursor < m_cursor;
    if (serverCursor > m_cursor) {
        m_cursor = serverCursor;
        emit cursorChanged();
        QSettings settings(QStringLiteral("Xakteir"), QStringLiteral("VoltraMail"));
        settings.setValue(QStringLiteral("syncCursor"), m_cursor);
        settings.sync();
    }
    outcome.cursor = m_cursor;
    outcome.cursorRewound = rewound;
    outcome.hasMore = root.value(QStringLiteral("hasMore")).toBool(false);
    outcome.mutationCount = mutationArray.size();

    if (m_fullResyncPending)
        m_fullResyncPending = false;
    if (m_dispatchPending)
        m_dispatchPending = false;

    m_lastSyncAt = QDateTime::currentMSecsSinceEpoch();
    emit lastSyncAtChanged();

    outcome.summary = QStringLiteral("%1 change(s) applied, %2 mutation(s) pushed, cursor at %3")
                          .arg(outcome.appliedCount)
                          .arg(outcome.mutationCount)
                          .arg(m_cursor);

    finishWithOutcome(outcome);
}

/**
 * Verifies the response envelope before anything is read from it.
 *
 * A malformed response is reported as `Malformed` rather than as a success
 * with an empty delta, because the two lead to very different fixes: one means
 * a proxy or version mismatch, the other means "you are up to date".
 */
bool MailSyncWorker::verifyResponse(const QJsonObject &root, QString *error)
{
    if (root.isEmpty()) {
        if (error) {
            *error = QStringLiteral("The mail service returned an empty response. "
                                    "This usually means a proxy or a version mismatch "
                                    "rather than an up-to-date mailbox.");
        }
        return false;
    }

    // `cursor` is required and must be a number. Its absence would silently
    // pin the cursor at its old value and re-pull the same page forever.
    if (!root.value(QStringLiteral("cursor")).isDouble()) {
        if (error)
            *error = QStringLiteral("The mail service response has no numeric `cursor`, so the "
                                    "sync position cannot be established. Nothing was applied.");
        return false;
    }

    // `changes` and `tombstones` must be arrays when present. A wrong type here
    // would be read as empty, silently dropping mail.
    const QJsonValue changes = root.value(QStringLiteral("changes"));
    if (!changes.isUndefined() && !changes.isNull() && !changes.isArray()) {
        if (error)
            *error = QStringLiteral("The mail service response has a non-array `changes` field. "
                                    "Nothing was applied.");
        return false;
    }
    const QJsonValue tombstones = root.value(QStringLiteral("tombstones"));
    if (!tombstones.isUndefined() && !tombstones.isNull() && !tombstones.isArray()) {
        if (error)
            *error = QStringLiteral("The mail service response has a non-array `tombstones` field. "
                                    "Nothing was applied.");
        return false;
    }
    return true;
}

/* ========================================================================== */
/* Applying results                                                           */
/* ========================================================================== */

/**
 * Writes remote changes into the cache.
 *
 * The server is authoritative for everything except a small set of optimistic
 * columns. Those are preserved rather than overwritten, so a read flag the user
 * set a moment ago is not undone by a change that was already in flight when
 * they clicked.
 */
void MailSyncWorker::applyRemoteChanges(const QList<RemoteChange> &changes, SyncOutcome *outcome)
{
    if (!m_cache || changes.isEmpty())
        return;

    QList<MailMessageData> messageBatch;
    QList<MailThreadData> threadBatch;

    for (const RemoteChange &change : changes) {
        if (change.collection == QLatin1String("messages")) {
            MailMessageData message;

            // Fields the server owns, always taken from the remote document.
            message.id = change.docId;
            message.ownerUid = change.document.value(QStringLiteral("ownerUid")).toString();
            message.accountId = change.document.value(QStringLiteral("accountId")).toString();
            message.threadId = change.document.value(QStringLiteral("threadId")).toString();
            message.threadSubject = change.document.value(QStringLiteral("threadSubject")).toString();
            message.threadMessageCount = change.document.value(QStringLiteral("threadMessageCount")).toInt(1);
            message.subject = change.document.value(QStringLiteral("subject")).toString();
            message.snippet = change.document.value(QStringLiteral("snippet")).toString();

            const QVariantMap fromMap =
                change.document.value(QStringLiteral("from")).toObject().toVariantMap();
            message.from = MailAddress::fromVariant(fromMap);
            message.to = addressListFromVariant(
                change.document.value(QStringLiteral("to")).toArray().toVariantList());
            message.cc = addressListFromVariant(
                change.document.value(QStringLiteral("cc")).toArray().toVariantList());
            message.bcc = addressListFromVariant(
                change.document.value(QStringLiteral("bcc")).toArray().toVariantList());
            message.replyTo = addressListFromVariant(
                change.document.value(QStringLiteral("replyTo")).toArray().toVariantList());

            message.bodyText = change.document.value(QStringLiteral("bodyText")).toString();
            message.bodyHtml = change.document.value(QStringLiteral("bodyHtml")).toString();
            message.rawSource = change.document.value(QStringLiteral("rawSource")).toString();
            message.rawBytes = qint64(change.document.value(QStringLiteral("rawBytes")).toDouble());
            message.rawSizeBytes = message.rawBytes;

            message.internetMessageId = change.document.value(QStringLiteral("internetMessageId")).toString();
            for (const QJsonValue &value : change.document.value(QStringLiteral("references")).toArray())
                message.references.append(value.toString());
            message.inReplyTo = change.document.value(QStringLiteral("inReplyTo")).toString();

            message.folder = folderFromName(change.document.value(QStringLiteral("folder")).toString());
            message.category = categoryFromName(change.document.value(QStringLiteral("category")).toString());
            for (const QJsonValue &value : change.document.value(QStringLiteral("labels")).toArray())
                message.labels.append(value.toString());

            // `attachmentSummaries` is not populated by the pull: the list needs
            // only the count, and the full records come from the attachments
            // collection on demand.
            const QJsonArray attachmentIds =
                change.document.value(QStringLiteral("attachmentIds")).toArray();
            for (const QJsonValue &value : attachmentIds)
                message.attachmentIds.append(value.toString());

            // Classification the server re-derives.
            message.priorityScore = change.document.value(QStringLiteral("priorityScore")).toInt();
            for (const QJsonValue &value : change.document.value(QStringLiteral("priorityReasons")).toArray())
                message.priorityReasons.append(value.toString());
            message.threatScore = change.document.value(QStringLiteral("threatScore")).toInt();
            for (const QJsonValue &value : change.document.value(QStringLiteral("threatFindings")).toArray())
                message.threatFindings.append(value.toString());
            message.auth = AuthResults::fromVariant(
                change.document.value(QStringLiteral("auth")).toObject().toVariantMap());

            message.ciphertext = change.document.value(QStringLiteral("ciphertext")).toString();
            message.iv = change.document.value(QStringLiteral("iv")).toString();
            message.keyId = change.document.value(QStringLiteral("keyId")).toString();
            message.isEncrypted = change.document.value(QStringLiteral("isEncrypted")).toBool();

            for (const QJsonValue &value : change.document.value(QStringLiteral("receiptIds")).toArray())
                message.receiptIds.append(value.toString());
            for (const QJsonValue &value : change.document.value(QStringLiteral("eventIds")).toArray())
                message.eventIds.append(value.toString());
            for (const QJsonValue &value :
                 change.document.value(QStringLiteral("calendarInvitationIds")).toArray())
                message.calendarInvitationIds.append(value.toString());

            message.deliveryAdapter = change.document.value(QStringLiteral("deliveryAdapter")).toString();
            message.sendResultStatus = change.document.value(QStringLiteral("sendResultStatus")).toString();
            message.sendResultDetail = change.document.value(QStringLiteral("sendResultDetail")).toString();
            message.sendResultDelivered =
                change.document.value(QStringLiteral("sendResultDelivered")).toBool();
            message.providerMessageId = change.document.value(QStringLiteral("providerMessageId")).toString();
            message.deliveredAt = qint64(change.document.value(QStringLiteral("deliveredAt")).toDouble());

            message.sentAt = qint64(change.document.value(QStringLiteral("sentAt")).toDouble());
            message.createdAt = qint64(change.document.value(QStringLiteral("createdAt")).toDouble());
            message.updatedAt = qint64(change.document.value(QStringLiteral("updatedAt")).toDouble());
            message.revision = change.revision;
            message.lastWriter = change.document.value(QStringLiteral("lastWriter")).toString();
            message.deletedAt = qint64(change.document.value(QStringLiteral("deletedAt")).toDouble());
            message.isDeleted = message.deletedAt > 0;

            // Optimistic columns: preserved when the local row is newer, so a
            // read flag set a moment ago is not undone by an in-flight change.
            // The remote value is used when the local row is absent or older.
            MailMessageData existing;
            if (m_cache->loadMessage(message.id, &existing)) {
                const bool localIsNewer = existing.revision > message.revision
                    || (existing.revision == message.revision && existing.updatedAt > message.updatedAt);
                if (localIsNewer) {
                    message.isRead = existing.isRead;
                    message.readAt = existing.readAt;
                    message.isStarred = existing.isStarred;
                    message.isPinned = existing.isPinned;
                    message.snoozedUntil = existing.snoozedUntil;
                    message.scheduleAt = existing.scheduleAt;
                    // The folder is the one field where the remote value wins
                    // even when local is newer: the server may have moved the
                    // message as part of a rule, and a local folder would
                    // resurrect it.
                } else {
                    message.isRead = change.document.value(QStringLiteral("isRead")).toBool();
                    message.readAt = qint64(change.document.value(QStringLiteral("readAt")).toDouble());
                    message.isStarred = change.document.value(QStringLiteral("isStarred")).toBool();
                    message.isPinned = change.document.value(QStringLiteral("isPinned")).toBool();
                    message.snoozedUntil =
                        qint64(change.document.value(QStringLiteral("snoozedUntil")).toDouble());
                    message.scheduleAt =
                        qint64(change.document.value(QStringLiteral("scheduleAt")).toDouble());
                }
            } else {
                message.isRead = change.document.value(QStringLiteral("isRead")).toBool();
                message.readAt = qint64(change.document.value(QStringLiteral("readAt")).toDouble());
                message.isStarred = change.document.value(QStringLiteral("isStarred")).toBool();
                message.isPinned = change.document.value(QStringLiteral("isPinned")).toBool();
                message.snoozedUntil =
                    qint64(change.document.value(QStringLiteral("snoozedUntil")).toDouble());
                message.scheduleAt =
                    qint64(change.document.value(QStringLiteral("scheduleAt")).toDouble());
            }

            message.requestReadReceipt =
                change.document.value(QStringLiteral("requestReadReceipt")).toBool();
            message.awaitingReply = change.document.value(QStringLiteral("awaitingReply")).toBool();
            message.wasFlattened = change.document.value(QStringLiteral("wasFlattened")).toBool();

            messageBatch.append(message);
            if (outcome) outcome->appliedCount += 1;

        } else if (change.collection == QLatin1String("threads")) {
            MailThreadData thread;
            thread.id = change.docId;
            thread.ownerUid = change.document.value(QStringLiteral("ownerUid")).toString();
            thread.accountId = change.document.value(QStringLiteral("accountId")).toString();
            thread.subject = change.document.value(QStringLiteral("subject")).toString();
            thread.messageCount = change.document.value(QStringLiteral("messageCount")).toInt();
            thread.unreadCount = change.document.value(QStringLiteral("unreadCount")).toInt();
            thread.hasAttachments = change.document.value(QStringLiteral("hasAttachments")).toBool();
            thread.isStarred = change.document.value(QStringLiteral("isStarred")).toBool();
            thread.isPinned = change.document.value(QStringLiteral("isPinned")).toBool();
            for (const QJsonValue &value : change.document.value(QStringLiteral("labels")).toArray())
                thread.labels.append(value.toString());
            thread.category = categoryFromName(change.document.value(QStringLiteral("category")).toString());
            thread.participants = addressListFromVariant(
                change.document.value(QStringLiteral("participants")).toArray().toVariantList());
            thread.latestMessageId = change.document.value(QStringLiteral("latestMessageId")).toString();
            thread.latestAt = qint64(change.document.value(QStringLiteral("latestAt")).toDouble());
            thread.oldestAt = qint64(change.document.value(QStringLiteral("oldestAt")).toDouble());
            thread.priorityScore = change.document.value(QStringLiteral("priorityScore")).toInt();
            thread.lastSenderAddress = change.document.value(QStringLiteral("lastSenderAddress")).toString();
            thread.lastSenderName = change.document.value(QStringLiteral("lastSenderName")).toString();
            thread.snippet = change.document.value(QStringLiteral("snippet")).toString();
            thread.revision = change.revision;
            thread.updatedAt = qint64(change.document.value(QStringLiteral("updatedAt")).toDouble());
            thread.deletedAt = qint64(change.document.value(QStringLiteral("deletedAt")).toDouble());

            threadBatch.append(thread);
            if (outcome) outcome->appliedCount += 1;

        } else {
            // Other collections (labels, accounts, drafts, settings) are pulled
            // by their own queries in the engine, not through the message
            // pipeline. Counting them as applied would misreport progress.
        }
    }

    if (!messageBatch.isEmpty())
        m_cache->upsertMessages(messageBatch);
    if (!threadBatch.isEmpty())
        m_cache->upsertThreads(threadBatch);
}

/**
 * Applies tombstones.
 *
 * A tombstone for a row the client never had is not an error - the client may
 * simply have been offline when it was created. It is counted so the summary
 * is honest, and the delete is best-effort.
 */
void MailSyncWorker::applyTombstones(const QJsonArray &tombstones, SyncOutcome *outcome)
{
    if (!m_cache || tombstones.isEmpty())
        return;

    for (const QJsonValue &value : tombstones) {
        const QJsonObject object = value.toObject();
        const QString collection = object.value(QStringLiteral("collection")).toString();
        const QString docId = object.value(QStringLiteral("docId")).toString();
        if (collection.isEmpty() || docId.isEmpty())
            continue;

        if (collection == QLatin1String("messages"))
            m_cache->deleteMessage(docId);
        if (outcome)
            outcome->tombstoneCount += 1;
    }
}

void MailSyncWorker::handleAdvanced(const QJsonObject &advanced)
{
    if (!m_cache)
        return;

    const QJsonArray snoozed = advanced.value(QStringLiteral("snoozed")).toArray();
    for (const QJsonValue &value : snoozed) {
        const QString docId = value.toString();
        if (!docId.isEmpty())
            emit advancedFolder(QStringLiteral("snoozed"), docId);
    }

    const QJsonArray scheduled = advanced.value(QStringLiteral("scheduled")).toArray();
    for (const QJsonValue &value : scheduled) {
        const QString docId = value.toString();
        if (!docId.isEmpty())
            emit advancedFolder(QStringLiteral("scheduled"), docId);
    }
}

/**
 * Clears the pending flag on messages the server has acknowledged.
 *
 * The flag is recomputed per document rather than cleared wholesale, because a
 * document can still have other mutations queued behind the acknowledged one.
 */
void MailSyncWorker::clearPendingFlag(const QStringList &mutationIds)
{
    if (!m_cache || mutationIds.isEmpty())
        return;
    // The cache already recomputes `has_pending_sync` when it acknowledges
    // mutations, so this is a notification rather than a second write.
    Q_UNUSED(mutationIds);
    emit pendingMutationsChanged();
}

/* ========================================================================== */
/* Outcome and failure                                                        */
/* ========================================================================== */

void MailSyncWorker::finishWithOutcome(const SyncOutcome &outcome)
{
    m_syncing = false;
    m_lastFailure = SyncFailure::None;
    if (!m_lastError.isEmpty()) {
        m_lastError.clear();
        emit lastErrorChanged();
    }
    emit syncingChanged();

    emit syncFinished(outcome);

    // One more round if something was coalesced while this one ran.
    if (m_coalescedRetry) {
        m_coalescedRetry = false;
        QTimer::singleShot(0, this, [this]() { startRequest(); });
    } else if (m_autoSync) {
        m_timer.start(m_pollIntervalSeconds * 1000);
    }
}

void MailSyncWorker::finishWithFailure(SyncFailure failure, const QString &message)
{
    m_syncing = false;
    m_lastFailure = failure;
    m_lastError = message;
    emit lastErrorChanged();
    emit syncingChanged();

    if (failure == SyncFailure::Unauthorized || failure == SyncFailure::Forbidden) {
        // The user has to act. Retrying on a timer would be a busy loop that
        // also burns through the token provider's rate limit.
        m_online = false;
        emit onlineChanged();
    }

    emit syncFailed(failure, message);

    if (m_coalescedRetry) {
        m_coalescedRetry = false;
        QTimer::singleShot(0, this, [this]() { startRequest(); });
    } else if (m_autoSync && failure != SyncFailure::Unauthorized && failure != SyncFailure::Forbidden) {
        m_timer.start(m_pollIntervalSeconds * 1000);
    }
}

void MailSyncWorker::scheduleRetry(SyncFailure failure, const QString &message)
{
    m_consecutiveFailures += 1;
    if (failure != SyncFailure::Offline && m_online) {
        m_online = false;
        emit onlineChanged();
    }

    // Exponential backoff with full jitter. Jitter matters here because a
    // server restart would otherwise have every client retry on the same
    // second, which is how a recovery turns into a second outage.
    const int exponent = std::min(m_consecutiveFailures - 1, 10);
    const int ceiling = std::min(MinBackoffMs * (1 << exponent), MaxBackoffMs);
    const int delay = MinBackoffMs / 2 + QRandomGenerator::system()->bounded(ceiling);

    finishWithFailure(failure, message);

    if (m_autoSync)
        m_timer.start(delay);
}

/* ========================================================================== */
/* Mutation conversion                                                        */
/* ========================================================================== */

SyncMutation MailSyncWorker::toWireMutation(const PendingMutation &mutation, const QString &surface)
{
    SyncMutation wire = SyncMutation::fromPending(mutation);
    if (wire.collection.isEmpty())
        wire.collection = mutation.collection;
    if (wire.docId.isEmpty())
        wire.docId = mutation.docId;
    if (wire.operation.isEmpty())
        wire.operation = mutation.operation;
    if (wire.clientTs == 0)
        wire.clientTs = mutation.createdAt;

    // The server derives `updatedAt` from its own clock, so it is stripped here
    // rather than sent and then rejected.
    if (wire.fields.contains(QStringLiteral("updatedAt")))
        wire.fields.remove(QStringLiteral("updatedAt"));

    Q_UNUSED(surface);
    return wire;
}

} // namespace mail
} // namespace xakteir
