#ifndef MAILENGINE_H
#define MAILENGINE_H

/**
 * ============================================================================
 * XAKTEIR MAIL - APPLICATION ENGINE (the QML context object)
 * ============================================================================
 *
 * `MailEngine` is what QML talks to. It owns every other component, wires them
 * together, and exposes a small, flat `Q_INVOKABLE` surface so that no QML file
 * ever has to know that a SQLite database, a sync worker, and a crypto module
 * exist.
 *
 * OWNSHIP GRAPH
 * -------------
 *   MailEngine
 *     |- MailCache           (SQLite; single owner, single connection)
 *     |- MailSyncWorker      (QtNetwork; writes into the cache)
 *     |- MailMessageModel    (message list for the current folder)
 *     |- MailThreadModel     (thread list for the current folder)
 *     |- QSystemTrayIcon     (unread badge + quick actions)
 *     `- QMimeData paths     (drag-and-drop, mailto: handling)
 *
 * Everything is a child of the engine, so destroying the engine destroys the
 * whole graph. That matters for the shutdown path: a cache connection left open
 * during static destruction produces a "database is locked" message on exit that
 * users read as data loss.
 *
 * WHY NOT PUT THIS IN QML?
 * ------------------------
 * Because three of the four things it does are not expressible in QML at all:
 * registering a `mailto:` URL handler, owning a `QSystemTrayIcon`, and reading a
 * SQLite database. The parts that *could* be QML are kept here anyway, because a
 * state machine split across QML and C++ is harder to reason about than one
 * kept in C++ and *exposed* to QML.
 *
 * NO SECRETS LIVE HERE
 * --------------------
 * The engine never stores a password, an IMAP secret, or an OAuth token. It
 * holds `credentialId` references into the shared Xakteir vault and asks the
 * web API to resolve them server-side. A desktop process that reads
 * `QSettings` for a password is one crash dump away from leaking it.
 */

#include <QObject>
#include <QPointer>
#include <QString>
#include <QStringList>
#include <QVariantList>
#include <QVariantMap>

#include "MailCache.h"
#include "MailCrypto.h"
#include "MailMessageModel.h"
#include "MailSyncWorker.h"
#include "MailTypes.h"

class QSystemTrayIcon;
class QMenu;
class QAction;
class QLocalServer;
class QUrl;
class QNetworkAccessManager;

namespace xakteir {
namespace mail {

/**
 * The application-level state QML renders.
 *
 * Kept as one enum rather than a set of booleans because the states are
 * mutually exclusive by construction: the app is either booting, offline,
 * signed-out, syncing, or ready. Four independent flags would allow a
 * combination like "offline and ready" that has no meaning.
 */
enum class AppState {
    Booting,
    SignedOut,
    Offline,
    Syncing,
    Ready,
    Error,
};

QString appStateName(AppState state);

/**
 * One `mailto:` or drag-and-drop payload handed to the composer.
 *
 * Returned as a variant map rather than a `Q_INVOKABLE` taking many arguments,
 * because a `mailto:` URL can carry any subset of the fields and a positional
 * signature would either be wrong for most callers or require six overloads.
 */
struct ComposerRequest {
    QString to;
    QString cc;
    QString bcc;
    QString subject;
    QString body;
    QString accountId;
    QString inReplyTo;
    QString threadId;
    QStringList attachmentPaths;

    bool isEmpty() const
    {
        return to.isEmpty() && cc.isEmpty() && bcc.isEmpty() && subject.isEmpty()
            && body.isEmpty() && attachmentPaths.isEmpty();
    }

    QVariantMap toVariant() const;
    static ComposerRequest fromVariant(const QVariantMap &map);
};

/**
 * The engine. Registered once as the `MailEngine` context property.
 */
class MailEngine : public QObject
{
    Q_OBJECT

    /* Read-only state. */
    Q_PROPERTY(QString state READ stateName NOTIFY stateChanged)
    Q_PROPERTY(QString lastError READ lastError NOTIFY lastErrorChanged)
    Q_PROPERTY(bool busy READ isBusy NOTIFY stateChanged)
    Q_PROPERTY(bool online READ isOnline NOTIFY onlineChanged)
    Q_PROPERTY(bool signedIn READ isSignedIn NOTIFY signedInChanged)

    /* Unread counts, driving the tray badge and the sidebar. */
    Q_PROPERTY(int unreadCount READ unreadCount NOTIFY countsChanged)
    Q_PROPERTY(int folderUnreadCount READ folderUnreadCount NOTIFY countsChanged)
    Q_PROPERTY(int pendingCount READ pendingCount NOTIFY countsChanged)

    /* Current view selection. */
    Q_PROPERTY(QString folder READ folderName NOTIFY queryChanged)
    Q_PROPERTY(QString accountId READ accountId NOTIFY queryChanged)
    Q_PROPERTY(QString searchTerms READ searchTerms NOTIFY queryChanged)
    Q_PROPERTY(QString selectedThreadId READ selectedThreadId NOTIFY selectionChanged)
    Q_PROPERTY(QString selectedMessageId READ selectedMessageId NOTIFY selectionChanged)

    /* Models. */
    Q_PROPERTY(QObject *messages READ messages CONSTANT)
    Q_PROPERTY(QObject *threads READ threads CONSTANT)

    /* Connection detail for the settings pane. */
    Q_PROPERTY(QString baseUrl READ baseUrl WRITE setBaseUrl NOTIFY baseUrlChanged)
    Q_PROPERTY(int pollIntervalSeconds READ pollIntervalSeconds WRITE setPollIntervalSeconds NOTIFY pollIntervalChanged)

public:
    explicit MailEngine(QObject *parent = nullptr);
    ~MailEngine() override;

    /* ---- property accessors ---- */

    QString stateName() const;
    QString lastError() const;
    bool isBusy() const;
    bool isOnline() const;
    bool isSignedIn() const { return m_signedIn; }
    int unreadCount() const;
    int folderUnreadCount() const;
    int pendingCount() const;

    QString folderName() const;
    QString accountId() const;
    QString searchTerms() const;
    QString selectedThreadId() const { return m_selectedThreadId; }
    QString selectedMessageId() const { return m_selectedMessageId; }

    QObject *messages() const { return m_messageModel; }
    QObject *threads() const { return m_threadModel; }

    QString baseUrl() const;
    void setBaseUrl(const QString &baseUrl);
    int pollIntervalSeconds() const;
    void setPollIntervalSeconds(int seconds);

    /* ---- lifecycle ---- */

    /**
     * Opens the local cache and starts the sync worker.
     *
     * Returns false only when the cache cannot be opened at all - a corrupt
     * file, no disk space, a permissions problem. Everything else is reported
     * through `stateChanged` so the UI can show a retry affordance.
     */
    Q_INVOKABLE bool start();

    /**
     * Shuts down cleanly.
     *
     * Called from `aboutToQuit` as well as directly. It is idempotent, because
     * the destructor calls it too and a double-shutdown is exactly the kind of
     * thing that happens during an unclean exit.
     */
    Q_INVOKABLE void shutdown();

    /* ---- authentication ---- */

    /**
     * Supplies the Firebase ID token.
     *
     * The engine never sees the refresh token or the password; it receives a
     * short-lived bearer token from the host application's auth layer and uses
     * it for one request at a time.
     */
    Q_INVOKABLE void setAuthToken(const QString &token);
    Q_INVOKABLE void clearAuthToken();
    Q_INVOKABLE void setSignedIn(bool signedIn);

    /* ---- navigation ---- */

    Q_INVOKABLE void openFolder(const QString &folder);
    Q_INVOKABLE void openAccount(const QString &accountId);
    Q_INVOKABLE void search(const QString &terms);
    Q_INVOKABLE void selectThread(const QString &threadId);
    Q_INVOKABLE void selectMessage(const QString &messageId);
    Q_INVOKABLE void clearSelection();

    /** Sets the inbox category tab (primary/social/promotions/...). */
    Q_INVOKABLE void setCategory(const QString &category);

    /* ---- actions ---- */

    /** Requests a sync round now. */
    Q_INVOKABLE void refresh();
    /** Requests a full resync after a cache wipe. */
    Q_INVOKABLE void fullResync();

    /** Optimistic actions, all funnelling into the cache's mutation queue. */
    Q_INVOKABLE void markRead(const QString &id, bool read);
    Q_INVOKABLE void markStarred(const QString &id, bool starred);
    Q_INVOKABLE void archive(const QString &id);
    Q_INVOKABLE void markTrash(const QString &id);
    Q_INVOKABLE void markSpam(const QString &id);
    Q_INVOKABLE void restore(const QString &id);
    Q_INVOKABLE void markAllRead();

    /** Loads every message in a thread, oldest first, for the reader pane. */
    Q_INVOKABLE QVariantList threadMessages(const QString &threadId);

    /** Full-text search across every folder the account has. */
    Q_INVOKABLE QVariantList searchAll(const QString &terms, int limit);

    /* ---- composer ---- */

    /**
     * Prepares a composer payload from a `mailto:` URL, dropped files, or a
     * reply action. The QML side calls this rather than parsing URLs itself,
     * so the parsing rules live in exactly one place.
     */
    Q_INVOKABLE QVariantMap prepareComposer(const QVariantMap &request);
    /** Handles a `mailto:` URL from the OS or from a link click. */
    Q_INVOKABLE void handleMailto(const QString &url);

    /* ---- vault (peer reader; see `src/lib/mail/vault.ts`) ---- */

    /**
     * Fetches the list of credential references for this user.
     *
     * This is the *reference* list only - ids, labels, and which purpose each
     * credential serves. The secret values are resolved server-side and never
     * travel to the desktop.
     */
    Q_INVOKABLE void requestVaultList();
    /**
     * Resolves one credential's secret for use by the sync worker.
     *
     * The result is passed directly to the network layer and is never stored,
     * logged, or exposed to QML. Returning it as a `QVariant` property would
     * put a password in the QML heap where a debugger will find it.
     */
    Q_INVOKABLE void resolveCredential(const QString &credentialId);

    /* ---- attachments ---- */

    /** Prepares a file for attachment: size check, content-type sniff, id. */
    Q_INVOKABLE QVariantMap prepareAttachment(const QString &path);
    /** Removes a prepared attachment by id. */
    Q_INVOKABLE void cancelAttachment(const QString &attachmentId);
    /** Fetches an attachment's bytes through the API and opens them. */
    Q_INVOKABLE void downloadAttachment(const QString &attachmentId);

    /* ---- drafts and sending ---- */

    /**
     * Persists a new draft and returns its id.
     *
     * The draft hits SQLite before the composer renders, so a crash between
     * "new message" and the first keystroke still leaves a recoverable row.
     */
    Q_INVOKABLE QString createDraft(const QVariantMap &fields);
    /** Merges fields into an existing draft. */
    Q_INVOKABLE void updateDraft(const QString &draftId, const QVariantMap &fields);
    /** Deletes a draft. Called only after a confirmed send or a discard. */
    Q_INVOKABLE void deleteDraft(const QString &draftId);
    /**
     * Sends a message through `POST /api/mail/send`.
     *
     * Completion is reported asynchronously through `sendCompleted`; the
     * payload always carries an idempotency key so a retry after a timeout
     * cannot deliver the message twice.
     */
    Q_INVOKABLE void sendMessage(const QVariantMap &payload);
    /**
     * Decrypts every message in a thread in place, resolving the key through
     * the vault. The key never enters QML; only the resulting text does.
     */
    Q_INVOKABLE void decryptThreadMessage(const QString &threadId);
    /** Persists the new-mail notification preference. */
    Q_INVOKABLE void setNotifyEnabled(bool enabled);
    /** Whether desktop notifications are enabled. */
    Q_INVOKABLE bool notifyEnabled() const;

    /* ---- accounts and labels ---- */

    /** Every configured account, as a list of variant maps for QML. */
    Q_INVOKABLE QVariantList accounts() const;
    /** Every label the user has, across accounts. */
    Q_INVOKABLE QVariantList labels() const;

    /* ---- encryption ---- */

    /** True when the AES-GCM implementation matches the NIST test vectors. */
    Q_INVOKABLE bool cryptoSelfTest() const;
    /** Encrypts a draft body under a key from the vault. */
    Q_INVOKABLE QVariantMap encryptBody(const QString &plaintext, const QString &keyBase64,
                                        const QString &internetMessageId);
    /** Verifies and decrypts a stored body. */
    Q_INVOKABLE QVariantMap decryptBody(const QVariantMap &payload, const QString &keyBase64);

    /* ---- diagnostics ---- */

    /** Cache and queue statistics for the settings/diagnostics pane. */
    Q_INVOKABLE QVariantMap diagnostics() const;
    /** Clears the local cache and requests a full resync. */
    Q_INVOKABLE bool wipeLocalCache();
    /** Rebuilds the full-text index from the cached rows. */
    Q_INVOKABLE int reindexSearch();

    /* ---- native integration ---- */

    /** Installs or removes the system tray icon. */
    Q_INVOKABLE void setTrayEnabled(bool enabled);
    /** Whether the tray icon is currently showing. */
    Q_INVOKABLE bool isTrayEnabled() const;
    /** Shows a desktop notification for a new message. */
    Q_INVOKABLE void notifyNewMessage(const QString &subject, const QString &sender);

signals:
    void stateChanged();
    void lastErrorChanged();
    void onlineChanged();
    void signedInChanged();
    void countsChanged();
    void queryChanged();
    void selectionChanged();
    void baseUrlChanged();
    void pollIntervalChanged();

    /** A `mailto:` URL arrived from the OS or a link click. */
    void mailtoReceived(const QVariantMap &request);
    /** A new message arrived and the tray should flash. */
    void newMessageArrived(const QString &subject, const QString &sender);
    /** The sync worker reported a failure worth surfacing to the user. */
    void syncFailed(const QString &failure, const QString &message);
    /** A prepared attachment should be uploaded; the QML side drives progress. */
    void attachmentPrepared(const QVariantMap &attachment);
    /** The vault returned the credential reference list. */
    void vaultListReceived(const QVariantList &credentials);
    /** A credential resolved successfully. Not emitted with the secret. */
    void credentialResolved(const QString &credentialId);
    /**
     * A send attempt finished. `result.ok` is true on delivery acceptance;
     * otherwise `result.error` carries the server's reason. Emitted for both
     * outcomes so the composer has exactly one place to land.
     */
    void sendCompleted(const QVariantMap &result);
    /**
     * The host shell should bring the main window to the front.
     *
     * The engine has no window of its own - it is a context object - so
     * "raise" is a request the shell handles. Emitted by the tray and by the
     * single-instance socket.
     */
    void raiseWindowRequested();

private slots:
    void onSyncFinished(const SyncOutcome &outcome);
    void onSyncFailed(SyncFailure failure, const QString &message);
    void onCountsChanged();
    void onTrayActivated();
    void onLocalConnection();

private:
    void setState(AppState state);
    void setError(const QString &message);
    void updateTrayBadge();
    void startTray();
    void stopTray();
    bool ensureLocalServer();
    Folder folderFromNameOr(const QString &name, Folder fallback) const;

    /* Components. All children of this object. */
    MailCache *m_cache = nullptr;
    MailSyncWorker *m_sync = nullptr;
    MailMessageModel *m_messageModel = nullptr;
    MailThreadModel *m_threadModel = nullptr;

    /* Tray and native integration. */
    QSystemTrayIcon *m_tray = nullptr;
    QMenu *m_trayMenu = nullptr;
    QLocalServer *m_localServer = nullptr;

    /* State. */
    AppState m_state = AppState::Booting;
    QString m_lastError;
    QString m_authToken;
    QString m_baseUrl;
    QString m_currentCategory = QStringLiteral("primary");
    QString m_selectedThreadId;
    QString m_selectedMessageId;
    bool m_signedIn = false;
    bool m_started = false;
    bool m_trayEnabled = false;
    bool m_notifyEnabled = false;
    bool m_online = false;
    /**
     * Three-state memo for the crypto self-test: -1 not yet checked, 0 failed,
     * 1 passed. `mutable` because `cryptoSelfTest()` is const (QML calls it
     * from a binding, and a non-const accessor would force the binding to be
     * re-evaluated on every read) but the memo has to be filled on first use.
     */
    mutable int m_cryptoVerified = -1;
    QPointer<MailSyncWorker> m_syncGuard;

    /**
     * Owns the vault requests. A single shared manager means connection pooling
     * and a single place where timeouts and `Authorization` headers are set,
     * rather than one per call site.
     */
    QNetworkAccessManager *m_nam = nullptr;
};

} // namespace mail
} // namespace xakteir

Q_DECLARE_METATYPE(xakteir::mail::ComposerRequest)

#endif // MAILENGINE_H
