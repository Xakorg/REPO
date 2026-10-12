#ifndef MAILCACHE_H
#define MAILCACHE_H

/**
 * ============================================================================
 * XAKTEIR MAIL - LOCAL SQLITE CACHE
 * ============================================================================
 *
 * Offline-first mailbox storage. Every read the UI performs comes from here;
 * `MailSyncWorker` is the only thing that talks to it from the network side.
 *
 * WHY SQLITE AND NOT THE FIRESTORE SNAPSHOT CACHE
 * -----------------------------------------------
 * QML lists are `QAbstractItemModel`s backed by prepared statements. Firestore's
 * local cache has no query planner a model can page through, no way to compute a
 * folder count without materialising the whole collection, and no durable store
 * that survives an explicit cache clear. A single local database gives:
 *
 *   - `unreadCount(folder)` as a `COUNT(*)` with an index, recomputed cheaply
 *   - pagination that is a `LIMIT/OFFSET` rather than "fetch 500, drop 400"
 *   - a real full-text index (`VIRTUAL TABLE ... USING fts5`) for search
 *   - a durable outbox that survives a restart mid-flight
 *
 * WHAT THIS LAYER IS NOT
 * ----------------------
 * It is not a second source of truth. `MailSyncWorker::pull` is authoritative
 * and will overwrite local rows on conflict, except for a small set of
 * *optimistic* columns (`isRead`, `isStarred`, `isPinned`, `folder`) that are
 * queued as pending mutations. That asymmetry is deliberate: a read flag is a
 * local intent that has not reached the server yet, whereas a message body is
 * not something this client gets to author.
 *
 * TRANSACTION DISCIPLINE
 * ----------------------
 * Every public mutator opens exactly one transaction. A partial write in a
 * mailbox is worse than no write, because the list would show a message whose
 * thread row disagrees with it.
 *
 * SCHEMA REVISION
 * ---------------
 * `PRAGMA user_version` stores `MAIL_NATIVE_SCHEMA_REVISION`. If it disagrees,
 * the cache is recreated rather than migrated by guesswork - the local copy is
 * always rebuildable from the server, so throwing it away is safe and honest.
 */

#include <QObject>
#include <QSqlDatabase>
#include <QString>
#include <QStringList>
#include <QVariantMap>
#include <QVariantList>

#include <functional>

#include "MailTypes.h"

class QThreadPool;

namespace xakteir {
namespace mail {

/** One row of the message list projection - the columns the list actually shows. */
struct MessageListRow {
    QString id;
    QString accountId;
    QString threadId;
    QString subject;
    QString snippet;
    QString senderName;
    QString senderAddress;
    Folder folder = Folder::Inbox;
    Category category = Category::Primary;
    bool isRead = false;
    bool isStarred = false;
    bool isPinned = false;
    bool isEncrypted = false;
    bool hasAttachments = false;
    int attachmentCount = 0;
    int messageCount = 1;
    int priorityScore = 0;
    int threatScore = 0;
    qint64 sentAt = 0;
    qint64 snoozedUntil = 0;
    qint64 scheduleAt = 0;
    qint64 recallDeadline = 0;
    QStringList labels;
    QString accountColor;
    bool hasPendingSync = false;
};

/** The result of a composed query: rows plus the count the pager needs. */
struct MessagePage {
    QList<MessageListRow> rows;
    int totalMatching = 0;
    int unreadMatching = 0;
};

/** Filter + sort description handed to `queryMessages`. */
struct MessageQuery {
    Folder folder = Folder::Inbox;
    QString accountId;      // empty = every account (unified inbox)
    QString labelId;        // empty = folder only
    QString searchTerms;    // free text, matched against the FTS index
    QString participant;    // "from:alice" style narrowing
    bool unreadOnly = false;
    bool starredOnly = false;
    bool pinnedOnly = false;
    bool hasAttachmentsOnly = false;
    Category category = Category::Primary;
    bool useCategory = false;
    bool priorityOrder = false;
    bool ascOrder = false;
    int limit = 50;
    int offset = 0;
};

/** A pending local change that has not been acknowledged by the server yet. */
struct PendingMutation {
    QString mutationId;
    QString collection;
    QString docId;
    QString operation;   // "set" | "delete"
    QString payloadJson;
    qint64 createdAt = 0;
    int attempts = 0;
    QString lastError;
};

/**
 * Full-text search hit with the snippet the list renders.
 *
 * `rowid` maps to `messages.rowid`, not to a message id, so `messageId` is
 * carried separately.
 */
struct SearchHit {
    QString messageId;
    QString threadId;
    QString accountId;
    QString snippet;
    QString highlightSubject;
    double rank = 0.0;
    qint64 sentAt = 0;
};

/** Per-folder counters derived by SQL, never maintained incrementally. */
struct FolderCounts {
    int total = 0;
    int unread = 0;
};

class MailCache : public QObject
{
    Q_OBJECT

public:
    explicit MailCache(QObject *parent = nullptr);
    ~MailCache() override;

    /**
     * Opens (or creates) the database at `path`.
     *
     * Returns false when the file exists but its schema revision is a different
     * *major* contract; the caller must surface that to the user rather than
     * silently deleting a cache that might hold unsynced outbox entries.
     */
    bool open(const QString &path);
    bool isOpen() const;
    QString errorString() const;
    QString databasePath() const;

    /* ---- connections ---- */

    /**
     * A named connection for a worker thread.
     *
     * SQLite connections are per-thread by construction, so a `QNetworkReply`
     * callback running on a worker must not touch `m_db`. Every cache entry
     * point takes a connection name and looks it up, which makes that rule
     * mechanical instead of a convention.
     */
    QSqlDatabase connection(const QString &connectionName = QString()) const;

    /* ---- messages ---- */

    /** Inserts or overwrites one message. Used by the pull path. */
    bool upsertMessage(const MailMessageData &message);
    /** Batch insert inside one transaction. */
    bool upsertMessages(const QList<MailMessageData> &messages);
    /** Loads one message with its full body. */
    bool loadMessage(const QString &id, MailMessageData *out) const;
    /** Returns raw RFC 5322 source, or an empty string when it is not cached. */
    QString rawSource(const QString &id) const;

    /** The list projection. Reads only the columns the list renders. */
    MessagePage queryMessages(const MessageQuery &query) const;
    /** Every cached row id for a thread, oldest first. */
    QStringList threadMessageIds(const QString &threadId) const;
    /** All rows in a thread with bodies loaded. */
    QList<MailMessageData> threadMessages(const QString &threadId) const;

    /**
     * Applies one optimistic local change and queues it as a mutation.
     *
     * `fields` is an allowlist-checked patch: unknown keys are rejected rather
     * than passed through to SQL, so a caller cannot write a server-owned column
     * and then be surprised when the next pull reverts it.
     */
    bool applyLocalPatch(const QString &collection, const QString &docId,
                         const QVariantMap &fields, QString *errorOut = nullptr);

    /** Moves a message between folders, both locally and as a queued mutation. */
    bool moveMessage(const QString &id, Folder target);
    /** Tombstones a message locally. The server still owns the deletion. */
    bool deleteMessage(const QString &id);
    /** Clears the tombstone (undo). */
    bool restoreMessage(const QString &id);

    /* ---- threads ---- */

    bool upsertThread(const MailThreadData &thread);
    bool upsertThreads(const QList<MailThreadData> &threads);
    bool loadThread(const QString &id, MailThreadData *out) const;
    /** Rebuilds a thread row from every cached message in it, then upserts it. */
    bool rebuildThread(const QString &threadId);
    /** Thread rows matching the same folder/account constraints as the list. */
    QList<MailThreadData> queryThreads(Folder folder, const QString &accountId, int limit, int offset,
                                       bool unreadOnly = false, bool priorityOrder = false) const;

    /* ---- labels & accounts ---- */

    bool upsertLabel(const MailLabelData &label);
    QList<MailLabelData> labels() const;
    bool upsertAccount(const MailAccountData &account);
    QList<MailAccountData> accounts() const;
    MailAccountData account(const QString &id) const;

    /* ---- counts ---- */

    FolderCounts folderCounts(Folder folder, const QString &accountId = QString()) const;
    FolderCounts labelCounts(const QString &labelId) const;
    /** Total unread across every enabled account - drives the tray badge. */
    int globalUnreadCount() const;
    /** Unread per account, so the sidebar can show a dot per identity. */
    QVariantMap unreadByAccount() const;

    /* ---- search ---- */

    /**
     * Full-text search over subject, body text and sender.
     *
     * The FTS index is populated by `reindexMessage`. The native app does NOT
     * try to replicate the server's BM25 token set; it indexes the same source
     * strings locally so a query behaves the same offline as online.
     */
    QList<SearchHit> search(const QString &terms, const QStringList &folderFilter,
                            const QString &accountId, int limit = 50) const;
    /** Rebuilds the FTS row for one message. Called after every upsert. */
    bool reindexMessage(const MailMessageData &message);
    /** Rebuilds the whole index (schema change, or a corrupt index report). */
    int reindexAll();

    /* ---- outbox / queue ---- */

    /** Queues a mutation for the next push. */
    bool enqueueMutation(const PendingMutation &mutation);
    /** Mutations due for a retry, oldest first, capped at `limit`. */
    QList<PendingMutation> pendingMutations(int limit) const;
    int pendingMutationCount() const;
    /** Removes mutations the server has acknowledged. */
    bool acknowledgeMutations(const QStringList &mutationIds);
    /** Records a failure and the backoff reason for the UI. */
    bool markMutationFailed(const QString &mutationId, const QString &error);

    /* ---- drafts ---- */

    bool saveDraft(const QString &draftId, const QVariantMap &draft);
    QVariantList drafts(const QString &accountId) const;
    bool deleteDraft(const QString &draftId);

    /* ---- settings ---- */

    QVariantMap settings() const;
    bool saveSettings(const QVariantMap &settings);

    /* ---- integrity ---- */

    /** VACUUM-free stats used by the diagnostics panel. */
    QVariantMap stats() const;
    /** Deletes every row and resets the schema. Only reachable from Settings. */
    bool wipe();

signals:
    /** Emitted after any write that changes what a list would render. */
    void messagesChanged();
    void threadsChanged();
    void labelsChanged();
    void accountsChanged();
    void countsChanged();
    void pendingMutationsChanged();

private:
    bool ensureSchema(QSqlDatabase &db);
    bool createSchema(QSqlDatabase &db);
    void applyIndexes(QSqlDatabase &db);
    bool withTransaction(const QString &connectionName, const std::function<bool(QSqlDatabase &)> &body,
                         QString *errorOut = nullptr);
    /**
     * Records a failure message.
     *
     * `const` because the read paths (`queryMessages`, `queryThreads`, `search`)
     * are const and still have to report that a query failed. "The list is
     * empty because the database broke" is a property of what the caller
     * observes, not a mutation of the cache, so the string is mutable - the
     * same reasoning behind `QFutureWatcher::isRunning` being const while the
     * future it watches changes underneath.
     */
    void setError(const QString &message) const;

    QSqlDatabase m_db;
    QString m_path;
    mutable QString m_error;
    bool m_open = false;
};

} // namespace mail
} // namespace xakteir

#endif // MAILCACHE_H