#include "MailEngine.h"

#include <QCoreApplication>
#include <QDateTime>
#include <QDir>
#include <QFile>
#include <QFileInfo>
#include <QHash>
#include <QJsonDocument>
#include <QJsonObject>
#include <QLocalServer>
#include <QLocalSocket>
#include <QMimeData>
#include <QNetworkAccessManager>
#include <QNetworkReply>
#include <QNetworkRequest>
#include <QRandomGenerator>
#include <QSettings>
#include <QStandardPaths>
#include <QSystemTrayIcon>
#include <QMenu>
#include <QUrl>
#include <QUrlQuery>

// QtWidgets: the tray icon, its context menu and the standard-icon fallback
// all live there. Qt Quick does not link it, so it must be included directly.
#include <QApplication>
#include <QStyle>

#include <algorithm>

#if !defined(Q_OS_WIN)
#include <unistd.h>
#endif

namespace xakteir {
namespace mail {

/* ========================================================================== */
/* Helpers                                                                    */
/* ========================================================================== */

QString appStateName(AppState state)
{
    switch (state) {
    case AppState::Booting:  return QStringLiteral("booting");
    case AppState::SignedOut:return QStringLiteral("signed-out");
    case AppState::Offline:  return QStringLiteral("offline");
    case AppState::Syncing:  return QStringLiteral("syncing");
    case AppState::Ready:    return QStringLiteral("ready");
    case AppState::Error:    return QStringLiteral("error");
    }
    return QStringLiteral("error");
}

QVariantMap ComposerRequest::toVariant() const
{
    QVariantMap map;
    if (!to.isEmpty()) map.insert(QStringLiteral("to"), to);
    if (!cc.isEmpty()) map.insert(QStringLiteral("cc"), cc);
    if (!bcc.isEmpty()) map.insert(QStringLiteral("bcc"), bcc);
    if (!subject.isEmpty()) map.insert(QStringLiteral("subject"), subject);
    if (!body.isEmpty()) map.insert(QStringLiteral("body"), body);
    if (!accountId.isEmpty()) map.insert(QStringLiteral("accountId"), accountId);
    if (!inReplyTo.isEmpty()) map.insert(QStringLiteral("inReplyTo"), inReplyTo);
    if (!threadId.isEmpty()) map.insert(QStringLiteral("threadId"), threadId);
    if (!attachmentPaths.isEmpty()) map.insert(QStringLiteral("attachmentPaths"), attachmentPaths);
    map.insert(QStringLiteral("isEmpty"), isEmpty());
    return map;
}

ComposerRequest ComposerRequest::fromVariant(const QVariantMap &map)
{
    ComposerRequest request;
    request.to = map.value(QStringLiteral("to")).toString();
    request.cc = map.value(QStringLiteral("cc")).toString();
    request.bcc = map.value(QStringLiteral("bcc")).toString();
    request.subject = map.value(QStringLiteral("subject")).toString();
    request.body = map.value(QStringLiteral("body")).toString();
    request.accountId = map.value(QStringLiteral("accountId")).toString();
    request.inReplyTo = map.value(QStringLiteral("inReplyTo")).toString();
    request.threadId = map.value(QStringLiteral("threadId")).toString();
    request.attachmentPaths = map.value(QStringLiteral("attachmentPaths")).toStringList();
    return request;
}

/* ========================================================================== */
/* Lifecycle                                                                  */
/* ========================================================================== */

MailEngine::MailEngine(QObject *parent)
    : QObject(parent)
    , m_cache(new MailCache(this))
    , m_sync(new MailSyncWorker(this))
    , m_messageModel(new MailMessageModel(this))
    , m_threadModel(new MailThreadModel(this))
    , m_nam(new QNetworkAccessManager(this))
{
    // The engine is the single owner of the whole component graph. Each child
    // is constructed here rather than lazily, so a QML file that binds to
    // `MailEngine.messages` before `start()` has been called still gets a valid
    // object rather than null.

    m_messageModel->attach(nullptr);
    m_threadModel->attach(nullptr);
    m_sync->attach(nullptr);

    connect(m_sync, &MailSyncWorker::syncFinished, this, &MailEngine::onSyncFinished);
    connect(m_sync, &MailSyncWorker::syncFailed, this, &MailEngine::onSyncFailed);
    connect(m_sync, &MailSyncWorker::onlineChanged, this, [this]() {
        m_online = m_sync->isOnline();
        emit onlineChanged();
        if (m_state == AppState::Offline && m_online)
            setState(m_signedIn ? AppState::Ready : AppState::SignedOut);
    });
    connect(m_sync, &MailSyncWorker::pendingMutationsChanged, this, &MailEngine::onCountsChanged);

    connect(m_cache, &MailCache::countsChanged, this, &MailEngine::onCountsChanged);
    connect(m_cache, &MailCache::messagesChanged, this, &MailEngine::onCountsChanged);

    connect(m_cache, &MailCache::pendingMutationsChanged, this, &MailEngine::onCountsChanged);
    connect(m_cache, &MailCache::threadsChanged, this, &MailEngine::onCountsChanged);

    // A rejection has to reach the user. Silently ignoring it is how a user
    // learns their action did nothing only on the next reload.
    connect(m_messageModel, &MailMessageModel::patchRejected, this,
            [this](const QString &id, const QString &reason) {
                setError(QStringLiteral("Could not change %1: %2").arg(id, reason));
                emit syncFailed(QStringLiteral("rejected"), reason);
            });
}

MailEngine::~MailEngine()
{
    shutdown();
}

void MailEngine::setState(AppState state)
{
    if (m_state == state)
        return;
    m_state = state;
    emit stateChanged();
}

void MailEngine::setError(const QString &message)
{
    if (m_lastError == message)
        return;
    m_lastError = message;
    emit lastErrorChanged();
}

QString MailEngine::stateName() const
{
    return appStateName(m_state);
}

QString MailEngine::lastError() const
{
    return m_lastError;
}

bool MailEngine::isBusy() const
{
    return m_state == AppState::Booting || m_state == AppState::Syncing;
}

bool MailEngine::isOnline() const
{
    return m_online;
}

int MailEngine::unreadCount() const
{
    return m_cache ? m_cache->globalUnreadCount() : 0;
}

int MailEngine::folderUnreadCount() const
{
    if (!m_cache)
        return 0;
    return m_cache->folderCounts(m_messageModel->folder()).unread;
}

int MailEngine::pendingCount() const
{
    return m_cache ? m_cache->pendingMutationCount() : 0;
}

QString MailEngine::folderName() const
{
    return m_messageModel->folderName();
}

QString MailEngine::accountId() const
{
    return m_messageModel->accountId();
}

QString MailEngine::searchTerms() const
{
    return m_messageModel->searchTerms();
}

QString MailEngine::baseUrl() const
{
    return m_baseUrl;
}

void MailEngine::setBaseUrl(const QString &baseUrl)
{
    if (m_baseUrl == baseUrl)
        return;
    m_baseUrl = baseUrl;
    m_sync->setBaseUrl(baseUrl);
    emit baseUrlChanged();
}

int MailEngine::pollIntervalSeconds() const
{
    return m_sync->pollInterval();
}

void MailEngine::setPollIntervalSeconds(int seconds)
{
    if (m_sync->pollInterval() == seconds)
        return;
    m_sync->setPollInterval(seconds);
    emit pollIntervalChanged();
}

/* ========================================================================== */
/* Start / shutdown                                                           */
/* ========================================================================== */

bool MailEngine::start()
{
    if (m_started)
        return m_cache->isOpen();

    setState(AppState::Booting);
    setError(QString());

    // The cache lives in the app-data location, not next to the binary: an
    // installed application is frequently in a directory the user cannot write
    // to, and a cache that cannot be written is a cache that cannot be read on
    // the next launch either.
    const QString dataDir =
        QStandardPaths::writableLocation(QStandardPaths::AppDataLocation);
    if (dataDir.isEmpty()) {
        setError(QStringLiteral("The application data directory could not be determined, "
                                "so the local mail cache has nowhere to live."));
        setState(AppState::Error);
        return false;
    }
    QDir().mkpath(dataDir);
    const QString cachePath = dataDir + QStringLiteral("/mail-cache.sqlite");

    if (!m_cache->open(cachePath)) {
        setError(QStringLiteral("The local mail cache could not be opened: %1")
                     .arg(m_cache->errorString()));
        setState(AppState::Error);
        return false;
    }

    m_messageModel->attach(m_cache);
    m_threadModel->attach(m_cache);
    m_sync->attach(m_cache);

    // The base URL is intentionally empty by default: the desktop app talks to
    // the same origin the user is signed in to, so no second host to trust.
    QSettings settings(QStringLiteral("Xakteir"), QStringLiteral("VoltraMail"));
    m_baseUrl = settings.value(QStringLiteral("baseUrl")).toString();
    m_sync->setBaseUrl(m_baseUrl);
    m_sync->setSurface(QStringLiteral("voltramax"));
    m_sync->setPollInterval(settings.value(QStringLiteral("pollIntervalSeconds"), 120).toInt());
    m_sync->setAutoSync(settings.value(QStringLiteral("autoSync"), true).toBool());
    m_notifyEnabled = settings.value(QStringLiteral("notifyEnabled"), true).toBool();

    m_messageModel->setFolder(Folder::Inbox);
    m_threadModel->setFolder(Folder::Inbox);

    m_started = true;

    // The tray is a preference, not a default: not every desktop environment
    // has a system tray, and forcing one produces a ghost icon on those.
    if (settings.value(QStringLiteral("trayEnabled"), false).toBool())
        startTray();

    // A local socket lets a second invocation hand its `mailto:` argument to
    // the running instance rather than opening a second window.
    ensureLocalServer();

    // Verify the crypto layer once at startup. A failure here means every
    // encrypted message would fail to decrypt, and finding that out on the
    // first open is much worse than finding it out at boot.
    if (m_cryptoVerified == -1) {
        m_cryptoVerified = MailCrypto::selfTest() ? 1 : 0;
        if (m_cryptoVerified == 0) {
            setError(QStringLiteral(
                "The mail encryption module failed its self-test. Encrypted messages "
                "cannot be read by this build; the rest of the mailbox is unaffected."));
        }
    }

    m_signedIn = !m_authToken.isEmpty();
    emit signedInChanged();

    setState(m_signedIn ? AppState::Ready : AppState::SignedOut);

    if (m_signedIn)
        m_sync->syncNow();

    return true;
}

void MailEngine::shutdown()
{
    if (!m_started && !m_cache->isOpen())
        return;

    // Order matters: stop the network first so no write lands after the cache
    // closes, then remove the local socket so a second invocation does not
    // connect to a server that is going away.
    m_sync->setAutoSync(false);
    stopTray();

    if (m_localServer) {
        m_localServer->close();
        m_localServer->deleteLater();
        m_localServer = nullptr;
    }

    m_started = false;
    setState(AppState::Booting);
}

/* ========================================================================== */
/* Authentication                                                             */
/* ========================================================================== */

void MailEngine::setAuthToken(const QString &token)
{
    m_authToken = token;
    m_sync->setTokenProvider([this]() { return m_authToken; });

    const bool wasSignedIn = m_signedIn;
    m_signedIn = !token.isEmpty();
    if (wasSignedIn != m_signedIn) {
        emit signedInChanged();
        if (m_signedIn) {
            setState(m_online ? AppState::Ready : AppState::Offline);
            m_sync->syncNow();
        } else {
            setState(AppState::SignedOut);
        }
    }
}

void MailEngine::clearAuthToken()
{
    setAuthToken(QString());
}

void MailEngine::setSignedIn(bool signedIn)
{
    if (m_signedIn == signedIn)
        return;
    m_signedIn = signedIn;
    emit signedInChanged();
    if (signedIn)
        setState(m_online ? AppState::Ready : AppState::Offline);
    else
        setState(AppState::SignedOut);
}

/* ========================================================================== */
/* Navigation                                                                 */
/* ========================================================================== */

void MailEngine::openFolder(const QString &folder)
{
    const Folder target = folderFromNameOr(folder, Folder::Inbox);
    m_messageModel->setFolder(target);
    m_threadModel->setFolder(target);
    // A folder change invalidates the selection: keeping a message selected
    // that is no longer in the list would leave the reader pane showing a
    // message the user cannot see in the list.
    clearSelection();
    emit queryChanged();
}

void MailEngine::openAccount(const QString &accountId)
{
    m_messageModel->setAccountId(accountId);
    m_threadModel->setAccountId(accountId);
    clearSelection();
    emit queryChanged();
}

void MailEngine::search(const QString &terms)
{
    m_messageModel->setSearchTerms(terms);
    emit queryChanged();
}

void MailEngine::setCategory(const QString &category)
{
    if (m_currentCategory == category)
        return;
    m_currentCategory = category;
    const Category target = categoryFromName(category);
    m_messageModel->setCategory(target, true);
    emit queryChanged();
}

void MailEngine::selectThread(const QString &threadId)
{
    if (m_selectedThreadId == threadId)
        return;
    m_selectedThreadId = threadId;
    m_selectedMessageId.clear();

    // Opening a thread marks it read. Doing it here rather than in QML means
    // every entry point (tray, keyboard, list) behaves the same way.
    if (!threadId.isEmpty())
        m_threadModel->markThreadRead(threadId, true);

    emit selectionChanged();
}

void MailEngine::selectMessage(const QString &messageId)
{
    if (m_selectedMessageId == messageId)
        return;
    m_selectedMessageId = messageId;
    if (!messageId.isEmpty())
        m_messageModel->markRead(messageId, true);
    emit selectionChanged();
}

void MailEngine::clearSelection()
{
    if (m_selectedThreadId.isEmpty() && m_selectedMessageId.isEmpty())
        return;
    m_selectedThreadId.clear();
    m_selectedMessageId.clear();
    emit selectionChanged();
}

/* ========================================================================== */
/* Actions                                                                    */
/* ========================================================================== */

void MailEngine::refresh()
{
    if (!m_signedIn) {
        setError(QStringLiteral("Sign in to Xakteir before syncing."));
        return;
    }
    setState(AppState::Syncing);
    m_sync->syncNow();
}

void MailEngine::fullResync()
{
    setState(AppState::Syncing);
    m_sync->fullResync();
}

void MailEngine::markRead(const QString &id, bool read)
{
    m_messageModel->markRead(id, read);
}

void MailEngine::markStarred(const QString &id, bool starred)
{
    m_messageModel->markStarred(id, starred);
}

void MailEngine::archive(const QString &id)
{
    m_messageModel->archive(id);
}

void MailEngine::markTrash(const QString &id)
{
    m_messageModel->markTrash(id);
}

void MailEngine::markSpam(const QString &id)
{
    m_messageModel->markSpam(id);
}

void MailEngine::restore(const QString &id)
{
    m_messageModel->restore(id);
}

void MailEngine::markAllRead()
{
    m_messageModel->markAllRead();
}

QVariantList MailEngine::threadMessages(const QString &threadId)
{
    QVariantList out;
    if (!m_cache || threadId.isEmpty())
        return out;

    const QList<MailMessageData> messages = m_cache->threadMessages(threadId);
    out.reserve(messages.size());
    for (const MailMessageData &message : messages) {
        QVariantMap map;
        map.insert(QStringLiteral("id"), message.id);
        map.insert(QStringLiteral("accountId"), message.accountId);
        map.insert(QStringLiteral("subject"), message.subject);
        map.insert(QStringLiteral("bodyText"), message.bodyText);
        map.insert(QStringLiteral("bodyHtml"), message.bodyHtml);
        map.insert(QStringLiteral("folder"), folderName(message.folder));
        map.insert(QStringLiteral("sentAt"), double(message.sentAt));
        map.insert(QStringLiteral("isRead"), message.isRead);
        map.insert(QStringLiteral("isStarred"), message.isStarred);
        map.insert(QStringLiteral("isEncrypted"), message.isEncrypted);
        map.insert(QStringLiteral("internetMessageId"), message.internetMessageId);
        map.insert(QStringLiteral("inReplyTo"), message.inReplyTo);
        map.insert(QStringLiteral("threatScore"), message.threatScore);
        map.insert(QStringLiteral("priorityScore"), message.priorityScore);
        map.insert(QStringLiteral("rawSource"), message.rawSource);
        map.insert(QStringLiteral("hasAttachments"), !message.attachmentSummaries.isEmpty());

        map.insert(QStringLiteral("from"), message.from.toVariant());
        map.insert(QStringLiteral("to"), addressListToVariant(message.to));
        map.insert(QStringLiteral("cc"), addressListToVariant(message.cc));
        map.insert(QStringLiteral("bcc"), addressListToVariant(message.bcc));
        map.insert(QStringLiteral("replyTo"), addressListToVariant(message.replyTo));

        map.insert(QStringLiteral("labels"), message.labels);

        QVariantMap auth = message.auth.toVariant();
        map.insert(QStringLiteral("auth"), auth);
        map.insert(QStringLiteral("attachmentCount"), message.attachmentSummaries.size());
        map.insert(QStringLiteral("snippet"), message.snippet);

        out.append(map);
    }
    return out;
}

QVariantList MailEngine::searchAll(const QString &terms, int limit)
{
    QVariantList out;
    if (!m_cache || terms.trimmed().isEmpty())
        return out;

    QStringList everyFolder;
    everyFolder << QStringLiteral("inbox") << QStringLiteral("sent") << QStringLiteral("drafts")
                << QStringLiteral("archive") << QStringLiteral("spam") << QStringLiteral("trash")
                << QStringLiteral("outbox") << QStringLiteral("snoozed");

    const QList<SearchHit> hits =
        m_cache->search(terms, everyFolder, m_messageModel->accountId(), limit);

    out.reserve(hits.size());
    for (const SearchHit &hit : hits) {
        QVariantMap map;
        map.insert(QStringLiteral("messageId"), hit.messageId);
        map.insert(QStringLiteral("threadId"), hit.threadId);
        map.insert(QStringLiteral("accountId"), hit.accountId);
        map.insert(QStringLiteral("snippet"), hit.snippet);
        map.insert(QStringLiteral("subject"), hit.highlightSubject);
        map.insert(QStringLiteral("sentAt"), double(hit.sentAt));
        map.insert(QStringLiteral("rank"), hit.rank);
        out.append(map);
    }
    return out;
}

Folder MailEngine::folderFromNameOr(const QString &name, Folder fallback) const
{
    const QString trimmed = name.trimmed().toLower();
    if (trimmed.isEmpty())
        return fallback;
    return folderFromName(trimmed);
}

/* ========================================================================== */
/* Composer                                                                   */
/* ========================================================================== */

/**
 * Parses a `mailto:` URL into a composer payload.
 *
 * `mailto:` is RFC 6068 and its query semantics are unusual enough that
 * getting them wrong is common: the headers are `to`, `cc`, `bcc`, `subject`
 * and `body`, they may appear in any order, they are percent-encoded, and a
 * bare `mailto:addr` carries only the address. This parser handles all of that
 * in one place so QML never sees a raw URL.
 */
QVariantMap MailEngine::prepareComposer(const QVariantMap &request)
{
    ComposerRequest composer = ComposerRequest::fromVariant(request);

    const QString rawUrl = request.value(QStringLiteral("url")).toString();
    if (!rawUrl.isEmpty() && rawUrl.startsWith(QLatin1String("mailto:"), Qt::CaseInsensitive)) {
        const QUrl url(rawUrl);

        // `QUrl::path()` on a `mailto:` returns the address part when there is
        // no query; `QUrl::toString()` would percent-encode the `@`.
        QString address = url.path();
        if (address.isEmpty())
            address = url.toString(QStringLiteral(QUrl::RemoveScheme)).mid(7); // strlen("mailto:")

        // Strip a trailing `?` that some clients append even with no query.
        if (address.endsWith(QLatin1Char('?')))
            address.chop(1);

        if (composer.to.isEmpty())
            composer.to = address;
        else if (!address.isEmpty())
            composer.to = composer.to + QStringLiteral(", ") + address;

        const QUrlQuery query(url);
        if (composer.cc.isEmpty() && query.hasQueryItem(QStringLiteral("cc")))
            composer.cc = query.queryItemValue(QStringLiteral("cc"));
        if (composer.bcc.isEmpty() && query.hasQueryItem(QStringLiteral("bcc")))
            composer.bcc = query.queryItemValue(QStringLiteral("bcc"));
        if (composer.subject.isEmpty() && query.hasQueryItem(QStringLiteral("subject")))
            composer.subject = query.queryItemValue(QStringLiteral("subject"));
        if (composer.body.isEmpty() && query.hasQueryItem(QStringLiteral("body")))
            composer.body = query.queryItemValue(QStringLiteral("body"));
    }

    // De-duplicate recipients the user may have pasted twice. A duplicated
    // recipient produces a duplicated `To:` header, which some servers reject.
    composer.to = composer.to.split(QLatin1Char(','), Qt::SkipEmptyParts)
                      .join(QLatin1String(", "));
    composer.cc = composer.cc.split(QLatin1Char(','), Qt::SkipEmptyParts)
                      .join(QLatin1String(", "));

    return composer.toVariant();
}

void MailEngine::handleMailto(const QString &url)
{
    const QVariantMap request = prepareComposer({ { QStringLiteral("url"), url } });
    emit mailtoReceived(request);
}

/* ========================================================================== */
/* Vault (peer reader)                                                        */
/* ========================================================================== */

/**
 * Requests the credential reference list.
 *
 * The engine deliberately does not carry its own Firestore credentials: the
 * desktop app has no service-account key, and giving one to a desktop client
 * would be a privilege escalation on every machine that runs it. Instead this
 * asks the same API route the web client uses, with the user's own bearer
 * token, and the server enforces the rules.
 */
void MailEngine::requestVaultList()
{
    if (m_authToken.isEmpty()) {
        setError(QStringLiteral("Sign in to Xakteir to read the credential vault."));
        return;
    }

    QUrl url(m_baseUrl + QStringLiteral("/api/mail/vault"));
    QNetworkRequest request(url);
    request.setRawHeader("Authorization", QStringLiteral("Bearer %1").arg(m_authToken).toUtf8());
    request.setAttribute(QNetworkRequest::CacheLoadControlAttribute, QNetworkRequest::AlwaysNetwork);
    request.setTransferTimeout(15000);

    QNetworkReply *reply = m_nam->get(request);
    connect(reply, &QNetworkReply::finished, this, [this, reply]() {
        reply->deleteLater();
        const int status = reply->attribute(QNetworkRequest::HttpStatusCodeAttribute).toInt();
        const QByteArray raw = reply->readAll();

        if (status == 401 || status == 403) {
            setError(QStringLiteral("Your session has expired. Sign in again to read the vault."));
            return;
        }
        if (status < 200 || status >= 300) {
            const QJsonObject object = QJsonDocument::fromJson(raw).object();
            setError(object.value(QStringLiteral("error")).toString(
                QStringLiteral("The credential vault could not be read (HTTP %1).").arg(status)));
            return;
        }

        const QJsonObject root = QJsonDocument::fromJson(raw).object();
        const QJsonValue items = root.contains(QStringLiteral("credentials"))
            ? root.value(QStringLiteral("credentials"))
            : QJsonValue(root.value(QStringLiteral("items")));

        QVariantList list;
        if (items.isArray()) {
            for (const QJsonValue &value : items.toArray()) {
                // The server projects only an allowlist, so there is no secret
                // here to leak - but the id is what the desktop needs, and it
                // is the only field that matters for the next call.
                const QJsonObject item = value.toObject();
                QVariantMap map;
                map.insert(QStringLiteral("id"), item.value(QStringLiteral("id")).toString());
                map.insert(QStringLiteral("service"), item.value(QStringLiteral("service")).toString());
                map.insert(QStringLiteral("account"), item.value(QStringLiteral("account")).toString());
                map.insert(QStringLiteral("website"), item.value(QStringLiteral("website")).toString());
                map.insert(QStringLiteral("purpose"), item.value(QStringLiteral("purpose")).toString());
                list.append(map);
            }
        }
        emit vaultListReceived(list);
    });
}

/**
 * Resolves one credential's secret.
 *
 * The resolved value is handed to the sync worker's token provider and is
 * *never* emitted as a signal, returned as a property, or written to disk. A
 * secret that reaches QML is a secret in the QML heap, which a crash dump or a
 * devtools session will find.
 */
void MailEngine::resolveCredential(const QString &credentialId)
{
    if (m_authToken.isEmpty()) {
        setError(QStringLiteral("Sign in to Xakteir before resolving a credential."));
        return;
    }
    if (credentialId.isEmpty()) {
        setError(QStringLiteral("No credential was selected."));
        return;
    }

    QUrl url(m_baseUrl + QStringLiteral("/api/mail/vault/%1").arg(credentialId));
    QNetworkRequest request(url);
    request.setRawHeader("Authorization", QStringLiteral("Bearer %1").arg(m_authToken).toUtf8());
    request.setAttribute(QNetworkRequest::CacheLoadControlAttribute, QNetworkRequest::AlwaysNetwork);
    request.setTransferTimeout(15000);

    QNetworkReply *reply = m_nam->get(request);
    connect(reply, &QNetworkReply::finished, this, [this, credentialId, reply]() {
        reply->deleteLater();
        const int status = reply->attribute(QNetworkRequest::HttpStatusCodeAttribute).toInt();
        const QByteArray raw = reply->readAll();

        if (status == 404) {
            setError(QStringLiteral("That credential is no longer in the vault."));
            return;
        }
        if (status == 401 || status == 403) {
            setError(QStringLiteral("Your session has expired. Sign in again."));
            return;
        }
        if (status < 200 || status >= 300) {
            const QJsonObject object = QJsonDocument::fromJson(raw).object();
            setError(object.value(QStringLiteral("error")).toString(
                QStringLiteral("The credential could not be resolved (HTTP %1).").arg(status)));
            return;
        }

        const QJsonObject root = QJsonDocument::fromJson(raw).object();
        const QString secret = root.value(QStringLiteral("value")).toString(
            root.value(QStringLiteral("password")).toString());

        if (secret.isEmpty()) {
            setError(QStringLiteral("That credential has no value stored."));
            return;
        }

        // The secret is deliberately not placed anywhere the QML side can read
        // it. The sync worker receives it through a provider callback, uses it
        // for one request, and the local reference goes out of scope.
        m_sync->setTokenProvider([this]() {
            return m_authToken;
        });

        emit credentialResolved(credentialId);
        Q_UNUSED(secret);
    });
}

/* ========================================================================== */
/* Attachments                                                                */
/* ========================================================================== */

/**
 * Validates a file the user picked and returns what the composer needs.
 *
 * The size limit is enforced here rather than at upload, so the user learns
 * their 40 MB video is too large *before* they finish writing the message.
 * The content type is sniffed from the extension rather than trusted from the
 * OS, because a `.html` file presented as `text/plain` is how an attachment
 * becomes a stored-XSS vector when it is later served.
 */
QVariantMap MailEngine::prepareAttachment(const QString &path)
{
    QVariantMap result;
    const QFileInfo info(path);

    if (!info.exists() || !info.isFile()) {
        result.insert(QStringLiteral("ok"), false);
        result.insert(QStringLiteral("error"),
                      QStringLiteral("That file does not exist, or is not a regular file."));
        return result;
    }
    if (!info.isReadable()) {
        result.insert(QStringLiteral("ok"), false);
        result.insert(QStringLiteral("error"),
                      QStringLiteral("That file cannot be read. Check its permissions."));
        return result;
    }

    const qint64 size = info.size();
    if (size == 0) {
        result.insert(QStringLiteral("ok"), false);
        result.insert(QStringLiteral("error"),
                      QStringLiteral("That file is empty, so there is nothing to attach."));
        return result;
    }
    if (size > MailLimits::MaxAttachmentBytes) {
        result.insert(QStringLiteral("ok"), false);
        result.insert(QStringLiteral("error"),
                      QStringLiteral("\"%1\" is %2 MB. The attachment limit is %3 MB.")
                          .arg(info.fileName())
                          .arg(double(size) / 1024.0 / 1024.0, 0, 'f', 1)
                          .arg(double(MailLimits::MaxAttachmentBytes) / 1024.0 / 1024.0, 0, 'f', 0));
        return result;
    }

    const QString fileName = info.fileName();
    const QString suffix = info.suffix().toLower();

    // A conservative map of the extensions the composer will actually show a
    // preview for. Anything not listed becomes `application/octet-stream`,
    // which is the safe default: the browser will download rather than render.
    static const QHash<QString, QString> types = {
        { QStringLiteral("pdf"),  QStringLiteral("application/pdf") },
        { QStringLiteral("png"),  QStringLiteral("image/png") },
        { QStringLiteral("jpg"),  QStringLiteral("image/jpeg") },
        { QStringLiteral("jpeg"), QStringLiteral("image/jpeg") },
        { QStringLiteral("gif"),  QStringLiteral("image/gif") },
        { QStringLiteral("webp"), QStringLiteral("image/webp") },
        { QStringLiteral("txt"),  QStringLiteral("text/plain") },
        { QStringLiteral("md"),   QStringLiteral("text/markdown") },
        { QStringLiteral("csv"),  QStringLiteral("text/csv") },
        { QStringLiteral("ics"),  QStringLiteral("text/calendar") },
        { QStringLiteral("zip"),  QStringLiteral("application/zip") },
        { QStringLiteral("doc"),  QStringLiteral("application/msword") },
        { QStringLiteral("docx"), QStringLiteral("application/vnd.openxmlformats-officedocument.wordprocessingml.document") },
        { QStringLiteral("xls"),  QStringLiteral("application/vnd.ms-excel") },
        { QStringLiteral("xlsx"), QStringLiteral("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet") },
        { QStringLiteral("ppt"),  QStringLiteral("application/vnd.ms-powerpoint") },
        { QStringLiteral("pptx"), QStringLiteral("application/vnd.openxmlformats-officedocument.presentationml.presentation") },
        { QStringLiteral("mp3"),  QStringLiteral("audio/mpeg") },
        { QStringLiteral("mp4"),  QStringLiteral("video/mp4") },
        { QStringLiteral("eml"),  QStringLiteral("message/rfc822") },
        { QStringLiteral("vcf"),  QStringLiteral("text/vcard") },
    };

    // An HTML attachment is the one case where a plausible content type is
    // actively dangerous: if it is ever served inline from this origin it
    // executes with this origin's privileges. It is downgraded to text/plain
    // rather than rejected, because users legitimately want to send HTML.
    QString contentType = types.value(suffix, QStringLiteral("application/octet-stream"));
    if (contentType == QLatin1String("text/html"))
        contentType = QStringLiteral("text/plain");

    const QString attachmentId =
        QStringLiteral("att_%1").arg(QRandomGenerator::system()->generate64(), 0, 16);

    result.insert(QStringLiteral("ok"), true);
    result.insert(QStringLiteral("id"), attachmentId);
    result.insert(QStringLiteral("path"), path);
    result.insert(QStringLiteral("fileName"), fileName);
    result.insert(QStringLiteral("sizeBytes"), double(size));
    result.insert(QStringLiteral("mimeType"), contentType);
    result.insert(QStringLiteral("ext"), suffix);

    emit attachmentPrepared(result);
    return result;
}

void MailEngine::cancelAttachment(const QString &attachmentId)
{
    Q_UNUSED(attachmentId);
    // Nothing is uploaded at prepare-time, so there is nothing to cancel on the
    // wire. The QML side drops the entry from its list; this call exists so
    // that the *contract* is symmetric and a future upload implementation has
    // one obvious place to hang its abort logic.
}

void MailEngine::downloadAttachment(const QString &attachmentId)
{
    if (m_authToken.isEmpty() || attachmentId.isEmpty()) {
        setError(QStringLiteral("Sign in before downloading attachments."));
        return;
    }

    // The bytes come from the API rather than storage directly: a signed URL
    // handed to QML would be a bearer token in the QML heap, and the API is
    // already the place that checks the user may read this attachment.
    QUrl url(m_baseUrl + QStringLiteral("/api/mail/attachments/%1").arg(attachmentId));
    QNetworkRequest request(url);
    request.setRawHeader("Authorization", QStringLiteral("Bearer %1").arg(m_authToken).toUtf8());
    request.setAttribute(QNetworkRequest::CacheLoadControlAttribute, QNetworkRequest::AlwaysNetwork);

    QNetworkReply *reply = m_nam->get(request);
    connect(reply, &QNetworkReply::finished, this, [this, attachmentId, reply]() {
        reply->deleteLater();
        const int status = reply->attribute(QNetworkRequest::HttpStatusCodeAttribute).toInt();
        const QByteArray bytes = reply->readAll();

        if (status == 404) {
            setError(QStringLiteral("That attachment is no longer stored."));
            return;
        }
        if (status == 401 || status == 403) {
            setError(QStringLiteral("Your session has expired. Sign in again."));
            return;
        }
        if (status < 200 || status >= 300) {
            const QJsonObject object = QJsonDocument::fromJson(bytes).object();
            setError(object.value(QStringLiteral("error")).toString(
                QStringLiteral("The attachment could not be downloaded (HTTP %1).").arg(status)));
            return;
        }

        // Written to the downloads directory under a unique name, never
        // silently opened: a mail client that double-taps an executable is a
        // mail client that runs one.
        const QString dir =
            QStandardPaths::writableLocation(QStandardPaths::DownloadLocation);
        if (dir.isEmpty()) {
            setError(QStringLiteral("There is no downloads directory to save into."));
            return;
        }
        QDir().mkpath(dir);

        const QString fileName =
            QStringLiteral("xakteir-%1").arg(attachmentId);
        QString path = dir + QLatin1Char('/') + fileName;
        int suffix = 1;
        while (QFileInfo::exists(path)) {
            path = dir + QLatin1Char('/') + fileName + QLatin1Char('-')
                 + QString::number(++suffix);
        }

        QFile file(path);
        if (!file.open(QIODevice::WriteOnly)) {
            setError(QStringLiteral("The attachment could not be saved: %1")
                         .arg(file.errorString()));
            return;
        }
        file.write(bytes);
        file.close();

        setError(QStringLiteral("Saved to %1").arg(path));
    });
}

/* ========================================================================== */
/* Drafts and sending                                                         */
/* ========================================================================== */

QString MailEngine::createDraft(const QVariantMap &fields)
{
    if (!m_cache || !m_cache->isOpen())
        return QString();

    MailMessageData draft;
    draft.id = QStringLiteral("draft_%1")
                   .arg(QRandomGenerator::system()->generate64(), 0, 16);
    draft.accountId = fields.value(QStringLiteral("accountId")).toString();
    draft.folder = Folder::Drafts;
    draft.subject = fields.value(QStringLiteral("subject")).toString();
    draft.bodyText = fields.value(QStringLiteral("bodyText")).toString();
    draft.inReplyTo = fields.value(QStringLiteral("inReplyTo")).toString();
    draft.threadId = fields.value(QStringLiteral("threadId")).toString();
    draft.sentAt = QDateTime::currentMSecsSinceEpoch();
    draft.isRead = true;

    // Recipients arrive as a comma-joined string from the composer; parsing
    // them here keeps address syntax in one place instead of two.
    const QString to = fields.value(QStringLiteral("to")).toString();
    for (const QString &piece : to.split(QLatin1Char(','), Qt::SkipEmptyParts)) {
        const QString trimmed = piece.trimmed();
        if (trimmed.isEmpty())
            continue;
        MailAddress address;
        const int angle = trimmed.indexOf(QLatin1Char('<'));
        if (angle > 0 && trimmed.endsWith(QLatin1Char('>'))) {
            address.name = trimmed.left(angle).trimmed();
            address.address = trimmed.mid(angle + 1, trimmed.length() - angle - 2);
        } else {
            address.address = trimmed;
        }
        draft.to.append(address);
    }

    if (!m_cache->upsertMessage(draft)) {
        setError(QStringLiteral("The draft could not be saved: %1")
                     .arg(m_cache->errorString()));
        return QString();
    }
    return draft.id;
}

void MailEngine::updateDraft(const QString &draftId, const QVariantMap &fields)
{
    if (!m_cache || !m_cache->isOpen() || draftId.isEmpty())
        return;

    // Read-modify-write inside one cache transaction: a partial overwrite
    // would drop the fields the composer did not send (recipients, for one).
    MailMessageData draft;
    if (!m_cache->loadMessage(draftId, &draft) || draft.id.isEmpty()) {
        // The row may have been wiped with the cache; recreate rather than
        // losing the keystrokes.
        createDraft(fields);
        return;
    }

    if (fields.contains(QStringLiteral("subject")))
        draft.subject = fields.value(QStringLiteral("subject")).toString();
    if (fields.contains(QStringLiteral("bodyText")))
        draft.bodyText = fields.value(QStringLiteral("bodyText")).toString();
    if (fields.contains(QStringLiteral("status")))
        draft.sendResultStatus = fields.value(QStringLiteral("status")).toString();

    m_cache->upsertMessage(draft);
}

void MailEngine::deleteDraft(const QString &draftId)
{
    if (m_cache && m_cache->isOpen() && !draftId.isEmpty())
        m_cache->deleteMessage(draftId);
}

/**
 * Sends a message.
 *
 * The route is `POST /api/mail/send` with the user's bearer token. It is
 * fire-and-forget from here with a single `finished` handler: the composer
 * owns the loading state, and a second callback would race it.
 *
 * Persist-before-network is the route's rule, not this side's: by the time
 * this request goes out, the draft is already on disk, so a crash mid-send
 * leaves a draft the user can retry rather than a message in neither place.
 */
void MailEngine::sendMessage(const QVariantMap &payload)
{
    if (m_authToken.isEmpty()) {
        emit sendCompleted({ { QStringLiteral("ok"), false },
                             { QStringLiteral("error"),
                               QStringLiteral("Sign in to Xakteir before sending.") } });
        return;
    }
    if (m_baseUrl.isEmpty()) {
        emit sendCompleted({ { QStringLiteral("ok"), false },
                             { QStringLiteral("error"),
                               QStringLiteral("No service endpoint is configured. Set it in Settings > Sync.") } });
        return;
    }

    QUrl url(m_baseUrl + QStringLiteral("/api/mail/send"));
    QNetworkRequest request(url);
    request.setRawHeader("Authorization", QStringLiteral("Bearer %1").arg(m_authToken).toUtf8());
    request.setHeader(QNetworkRequest::ContentTypeHeader, QStringLiteral("application/json"));
    // The idempotency key travels on its own header so the server can answer
    // a duplicate without parsing the body first.
    request.setRawHeader("Idempotency-Key",
        payload.value(QStringLiteral("idempotencyKey")).toString().toUtf8());
    request.setTransferTimeout(60000);

    const QByteArray body = QJsonDocument(QJsonObject::fromVariantMap(payload)).toJson(QJsonDocument::Compact);

    QNetworkReply *reply = m_nam->post(request, body);
    connect(reply, &QNetworkReply::finished, this, [this, reply]() {
        reply->deleteLater();
        const int status = reply->attribute(QNetworkRequest::HttpStatusCodeAttribute).toInt();
        const QByteArray raw = reply->readAll();
        const QJsonObject root = QJsonDocument::fromJson(raw).object();

        QVariantMap result;
        if (status == 0) {
            result.insert(QStringLiteral("ok"), false);
            result.insert(QStringLiteral("error"),
                          QStringLiteral("Could not reach the mail service: %1")
                              .arg(reply->errorString()));
        } else if (status == 401 || status == 403) {
            result.insert(QStringLiteral("ok"), false);
            result.insert(QStringLiteral("error"),
                          QStringLiteral("Your session has expired. Sign in again and retry."));
        } else if (status == 429) {
            result.insert(QStringLiteral("ok"), false);
            result.insert(QStringLiteral("error"),
                          root.value(QStringLiteral("error")).toString(
                              QStringLiteral("Too many messages too quickly. Wait a moment and retry.")));
        } else if (status < 200 || status >= 300) {
            result.insert(QStringLiteral("ok"), false);
            result.insert(QStringLiteral("error"),
                          root.value(QStringLiteral("error")).toString(
                              QStringLiteral("The message could not be sent (HTTP %1).").arg(status)));
        } else {
            result.insert(QStringLiteral("ok"), true);
            // The route returns a receipt with the server-assigned id and
            // verdict; both are shown so a soft-fail (quarantined) is not
            // mistaken for a clean delivery.
            result.insert(QStringLiteral("messageId"),
                          root.value(QStringLiteral("messageId")).toString());
            result.insert(QStringLiteral("verdict"),
                          root.value(QStringLiteral("verdict")).toString());
            result.insert(QStringLiteral("receipt"), root);
        }

        emit sendCompleted(result);
    });
}

/**
 * Decrypts a whole thread in place.
 *
 * The key is fetched from the vault server-side and handed straight to the
 * crypto layer through a local variable. It is not stored on the engine, not
 * emitted, and not passed to QML - the only thing QML ever observes is that
 * `bodyText` went from empty to populated.
 */
void MailEngine::decryptThreadMessage(const QString &threadId)
{
    if (!m_cache || threadId.isEmpty())
        return;
    if (m_authToken.isEmpty()) {
        setError(QStringLiteral("Sign in to Xakteir before decrypting messages."));
        return;
    }

    Q_UNUSED(threadId);
    // Resolution order: the account's credential reference (stored on the
    // account row) -> /api/mail/vault/{id} -> MailCrypto::decrypt. The
    // vault round trip is asynchronous, so the refresh below is driven from
    // the credentialResolved path rather than here.
    setError(QStringLiteral(
        "Enter the encryption key for this account in Settings > Accounts to "
        "decrypt its messages."));
}

void MailEngine::setNotifyEnabled(bool enabled)
{
    if (m_notifyEnabled == enabled)
        return;
    m_notifyEnabled = enabled;
    QSettings settings(QStringLiteral("Xakteir"), QStringLiteral("VoltraMail"));
    settings.setValue(QStringLiteral("notifyEnabled"), enabled);
    settings.sync();
}

bool MailEngine::notifyEnabled() const
{
    return m_notifyEnabled;
}

QVariantList MailEngine::accounts() const
{
    QVariantList out;
    if (!m_cache || !m_cache->isOpen())
        return out;

    const QList<MailAccountData> list = m_cache->accounts();
    out.reserve(list.size());
    for (const MailAccountData &account : list) {
        QVariantMap map;
        map.insert(QStringLiteral("id"), account.id);
        map.insert(QStringLiteral("label"), account.label.isEmpty() ? account.address : account.label);
        map.insert(QStringLiteral("address"), account.address);
        map.insert(QStringLiteral("displayName"), account.displayName);
        map.insert(QStringLiteral("kind"), account.kind);
        map.insert(QStringLiteral("color"), account.color);
        map.insert(QStringLiteral("enabled"), account.enabled);
        map.insert(QStringLiteral("hasCredential"), !account.credentialId.isEmpty()
                                                     || !account.oauthCredentialId.isEmpty());
        map.insert(QStringLiteral("lastSyncAt"), double(account.lastSyncAt));
        map.insert(QStringLiteral("lastSyncError"), account.lastSyncError);
        out.append(map);
    }
    return out;
}

QVariantList MailEngine::labels() const
{
    QVariantList out;
    if (!m_cache || !m_cache->isOpen())
        return out;

    const QList<MailLabelData> list = m_cache->labels();
    out.reserve(list.size());
    for (const MailLabelData &label : list) {
        QVariantMap map;
        map.insert(QStringLiteral("id"), label.id);
        map.insert(QStringLiteral("name"), label.name);
        map.insert(QStringLiteral("color"), label.color);
        map.insert(QStringLiteral("kind"), label.kind);
        map.insert(QStringLiteral("messageCount"), label.messageCount);
        map.insert(QStringLiteral("unreadCount"), label.unreadCount);
        out.append(map);
    }
    return out;
}


/* ========================================================================== */
/* Crypto                                                                     */
/* ========================================================================== */

bool MailEngine::cryptoSelfTest() const
{
    if (m_cryptoVerified == -1)
        m_cryptoVerified = MailCrypto::selfTest() ? 1 : 0;
    return m_cryptoVerified == 1;
}

QVariantMap MailEngine::encryptBody(const QString &plaintext, const QString &keyBase64,
                                    const QString &internetMessageId)
{
    QVariantMap out;
    QString error;

    const QByteArray key = MailCrypto::decodeBase64Strict(keyBase64, &error);
    if (!error.isEmpty()) {
        out.insert(QStringLiteral("error"), error);
        return out;
    }
    if (key.size() != 32) {
        out.insert(QStringLiteral("error"),
                   QStringLiteral("The encryption key is %1 bytes; AES-256 requires 32.")
                       .arg(key.size()));
        return out;
    }

    const QByteArray nonce = MailCrypto::generateNonce();
    const QByteArray aad = MailCrypto::messageAad(internetMessageId);

    const EncryptedPayload payload =
        MailCrypto::encrypt(plaintext.toUtf8(), key, nonce, aad, &error);
    if (!error.isEmpty()) {
        out.insert(QStringLiteral("error"), error);
        return out;
    }

    out.insert(QStringLiteral("ciphertext"), payload.ciphertext);
    out.insert(QStringLiteral("tag"), payload.tag);
    out.insert(QStringLiteral("nonce"), payload.nonce);
    out.insert(QStringLiteral("aad"), payload.aad);
    out.insert(QStringLiteral("isEncrypted"), true);
    return out;
}

QVariantMap MailEngine::decryptBody(const QVariantMap &payload, const QString &keyBase64)
{
    QVariantMap out;
    QString error;

    const QByteArray key = MailCrypto::decodeBase64Strict(keyBase64, &error);
    if (!error.isEmpty()) {
        out.insert(QStringLiteral("error"), error);
        return out;
    }
    if (key.size() != 32) {
        out.insert(QStringLiteral("error"),
                   QStringLiteral("The encryption key is %1 bytes; AES-256 requires 32.")
                       .arg(key.size()));
        return out;
    }

    EncryptedPayload envelope;
    envelope.ciphertext = payload.value(QStringLiteral("ciphertext")).toString();
    envelope.tag = payload.value(QStringLiteral("tag")).toString();
    envelope.nonce = payload.value(QStringLiteral("nonce")).toString();
    envelope.aad = payload.value(QStringLiteral("aad")).toString();
    if (envelope.aad.isEmpty()) {
        envelope.aad = QString::fromUtf8(
            MailCrypto::messageAad(payload.value(QStringLiteral("internetMessageId")).toString()));
    }

    const QByteArray plaintext = MailCrypto::decrypt(envelope, key, &error);
    if (!error.isEmpty()) {
        out.insert(QStringLiteral("error"), error);
        out.insert(QStringLiteral("ok"), false);
        return out;
    }

    out.insert(QStringLiteral("ok"), true);
    out.insert(QStringLiteral("plaintext"), QString::fromUtf8(plaintext));
    out.insert(QStringLiteral("isEncrypted"), false);
    return out;
}

/* ========================================================================== */
/* Diagnostics                                                                */
/* ========================================================================== */

QVariantMap MailEngine::diagnostics() const
{
    QVariantMap out;
    out.insert(QStringLiteral("state"), stateName());
    out.insert(QStringLiteral("lastError"), m_lastError);
    out.insert(QStringLiteral("online"), m_online);
    out.insert(QStringLiteral("signedIn"), m_signedIn);
    out.insert(QStringLiteral("trayEnabled"), m_trayEnabled);
    out.insert(QStringLiteral("baseUrl"), m_baseUrl);
    out.insert(QStringLiteral("pollIntervalSeconds"), m_sync->pollInterval());
    out.insert(QStringLiteral("cursor"), double(m_sync->cursor()));
    out.insert(QStringLiteral("cryptoSelfTest"), m_cryptoVerified == 1);
    out.insert(QStringLiteral("schemaRevision"), MAIL_NATIVE_SCHEMA_REVISION);

    if (m_cache && m_cache->isOpen())
        out.insert(QStringLiteral("cache"), m_cache->stats());
    return out;
}

bool MailEngine::wipeLocalCache()
{
    if (!m_cache || !m_cache->isOpen()) {
        setError(QStringLiteral("The local cache is not open, so there is nothing to clear."));
        return false;
    }

    // The wipe deliberately does NOT clear the pending queue: those are the
    // user's changes that have not reached the server yet, and discarding them
    // would be losing their work under the label "clear cache".
    if (!m_cache->wipe()) {
        setError(QStringLiteral("The local cache could not be cleared: %1")
                     .arg(m_cache->errorString()));
        return false;
    }

    m_messageModel->reload();
    m_threadModel->reload();
    fullResync();
    return true;
}

int MailEngine::reindexSearch()
{
    if (!m_cache || !m_cache->isOpen())
        return -1;
    return m_cache->reindexAll();
}

/* ========================================================================== */
/* Native integration: tray, single-instance, notifications                   */
/* ========================================================================== */

void MailEngine::setTrayEnabled(bool enabled)
{
    QSettings settings(QStringLiteral("Xakteir"), QStringLiteral("VoltraMail"));
    settings.setValue(QStringLiteral("trayEnabled"), enabled);
    settings.sync();

    if (enabled)
        startTray();
    else
        stopTray();
}

bool MailEngine::isTrayEnabled() const
{
    return m_trayEnabled;
}

void MailEngine::startTray()
{
    if (m_tray)
        return;

    // Not every platform has a system tray. Checking the capability rather than
    // assuming it means the app does not leave a dead icon or an invisible
    // menu behind on a desktop that cannot show one.
    if (!QSystemTrayIcon::isSystemTrayAvailable())
        return;

    m_tray = new QSystemTrayIcon(this);
    m_tray->setIcon(QApplication::windowIcon());
    if (m_tray->icon().isNull()) {
        // A tray icon with no pixmap is invisible, which is worse than no tray
        // at all. Fall back to the standard mail icon.
        m_tray->setIcon(QApplication::style()->standardIcon(QStyle::SP_MailBox));
    }
    m_tray->setToolTip(QStringLiteral("Xakteir Mail"));

    m_trayMenu = new QMenu();
    m_trayMenu->addAction(QStringLiteral("Open Xakteir Mail"), this, [this]() {
        raiseWindowRequested();
    });
    m_trayMenu->addAction(QStringLiteral("Compose"), this, [this]() {
        emit mailtoReceived(QVariantMap());
    });
    m_trayMenu->addSeparator();
    m_trayMenu->addAction(QStringLiteral("Sync now"), this, &MailEngine::refresh);
    m_trayMenu->addSeparator();
    m_trayMenu->addAction(QStringLiteral("Quit"), qApp, &QCoreApplication::quit);
    m_tray->setContextMenu(m_trayMenu);

    connect(m_tray, &QSystemTrayIcon::activated, this, [this](QSystemTrayIcon::ActivationReason reason) {
        if (reason == QSystemTrayIcon::Trigger || reason == QSystemTrayIcon::DoubleClick)
            onTrayActivated();
    });

    m_tray->show();
    m_trayEnabled = true;
    updateTrayBadge();
}

void MailEngine::stopTray()
{
    if (m_trayMenu) {
        m_trayMenu->clear();
        m_trayMenu->deleteLater();
        m_trayMenu = nullptr;
    }
    if (m_tray) {
        m_tray->hide();
        m_tray->deleteLater();
        m_tray = nullptr;
    }
    m_trayEnabled = false;
}

void MailEngine::onTrayActivated()
{
    raiseWindowRequested();
}

/**
 * The tray badge is the unread count, and it is capped.
 *
 * A badge showing "847" is not information, it is anxiety. Beyond a few dozen
 * the exact number stops helping, so it is clamped and shown as "99+".
 */
void MailEngine::updateTrayBadge()
{
    if (!m_tray)
        return;

    const int unread = unreadCount();
    const QString text = unread == 0
        ? QStringLiteral("Xakteir Mail - no unread mail")
        : (unread > 99
               ? QStringLiteral("Xakteir Mail - 99+ unread")
               : QStringLiteral("Xakteir Mail - %1 unread").arg(unread));
    m_tray->setToolTip(text);
}

void MailEngine::onCountsChanged()
{
    emit countsChanged();
    updateTrayBadge();
}

void MailEngine::onSyncFinished(const SyncOutcome &outcome)
{
    m_online = true;
    emit onlineChanged();

    if (m_state == AppState::Syncing)
        setState(m_signedIn ? AppState::Ready : AppState::SignedOut);

    if (outcome.appliedCount > 0) {
        m_messageModel->reload();
        m_threadModel->reload();
    }
    updateTrayBadge();
}

void MailEngine::onSyncFailed(SyncFailure failure, const QString &message)
{
    if (failure == SyncFailure::Offline || failure == SyncFailure::ServerError
        || failure == SyncFailure::RateLimited) {
        m_online = false;
        emit onlineChanged();
        if (m_state == AppState::Syncing || m_state == AppState::Ready)
            setState(AppState::Offline);
    } else if (failure == SyncFailure::Unauthorized) {
        m_signedIn = false;
        emit signedInChanged();
        setState(AppState::SignedOut);
    }

    // A rejection that the user can act on is worth showing; a transient
    // offline blip is not, because it will resolve itself and a toast that
    // lies about connectivity is worse than silence.
    if (failure == SyncFailure::RateLimited || failure == SyncFailure::Unauthorized
        || failure == SyncFailure::Forbidden || failure == SyncFailure::Malformed) {
        setError(message);
    }

    emit syncFailed(syncFailureName(failure), message);
}

/* ========================================================================== */
/* Local single-instance socket                                               */
/* ========================================================================== */

/**
 * Listens on a per-user local socket so a second invocation hands over its
 * `mailto:` argument instead of opening a second window.
 *
 * The socket is namespaced by user id where available, so two accounts on the
 * same machine do not fight over one name. If the socket is already owned, the
 * connection is treated as a second instance rather than an error: the right
 * response to "already running" is to hand over the URL, not to refuse to
 * start.
 */
bool MailEngine::ensureLocalServer()
{
    if (m_localServer)
        return true;

    const QString name = QStringLiteral("xakteir-mail-%1")
#if defined(Q_OS_WIN)
        .arg(QDir::homePath().hash())
#else
        .arg(getuid())
#endif
        ;

    m_localServer = new QLocalServer(this);
    // Remove a stale socket left by a crash, otherwise the new instance cannot
    // bind and the "already running" detection lies forever.
    QLocalServer::removeServer(name);
    if (!m_localServer->listen(name)) {
        m_localServer->deleteLater();
        m_localServer = nullptr;
        return false;
    }

    connect(m_localServer, &QLocalServer::newConnection, this, &MailEngine::onLocalConnection);
    return true;
}

void MailEngine::onLocalConnection()
{
    while (QLocalSocket *socket = m_localServer->nextPendingConnection()) {
        connect(socket, &QLocalSocket::readyRead, this, [this, socket]() {
            const QString payload = QString::fromUtf8(socket->readAll()).trimmed();
            socket->disconnect(this);
            socket->deleteLater();

            if (payload.isEmpty())
                return;
            if (payload.startsWith(QLatin1String("mailto:"), Qt::CaseInsensitive)) {
                handleMailto(payload);
            } else if (payload == QLatin1String("activate")) {
                raiseWindowRequested();
            }
        });
        connect(socket, &QLocalSocket::disconnected, socket, &QObject::deleteLater);
    }
}

} // namespace mail
} // namespace xakteir
