#ifndef MAILMESSAGEMODEL_H
#define MAILMESSAGEMODEL_H

/**
 * ============================================================================
 * XAKTEIR MAIL - MESSAGE LIST MODEL FOR QML
 * ============================================================================
 *
 * A `QAbstractListModel` over `MailCache::queryMessages`. QML's `ListView` can
 * only bind to a model it can page through, and a `QVariantList` of maps would
 * mean the whole folder is materialised in memory on every keystroke of the
 * search box.
 *
 * WHY A MODEL AND NOT A VARIANT LIST
 * ----------------------------------
 * Three reasons, in the order they matter:
 *
 *  1. Pagination. `MailSyncWorker` pulls in pages; this model appends them.
 *     A `ListView` over a `QVariantList` cannot distinguish "the page loaded"
 *     from "the folder is exhausted", which is the difference between showing
 *     a spinner and showing "no more mail".
 *
 *  2. Optimistic updates. When the user marks a message read, the cache row is
 *     updated and this model emits a single `dataChanged` for that row. A
 *     variant list would need to be rebuilt, which re-creates every delegate
 *     and loses the scroll position - the classic "click something and the
 *     list jumps" bug.
 *
 *  3. Counting. `rowCount` is what drives the scrollbar geometry. Deriving it
 *     from a list means the list must be complete; deriving it from a SQL
 *     `COUNT` means the scrollbar is honest about how much mail there is even
 *     when only one page has been fetched.
 *
 * THE COLUMN CONTRACT
 * -------------------
 * `roleNames()` is the single source of truth for what QML can read. Every
 * role is documented at its `enum` definition, and the roles are named after
 * the fields in `MailTypes.h` rather than after positions, so a reordering of
 * the underlying struct cannot silently rebind a delegate to the wrong value.
 *
 * THREADS OR MESSAGES?
 * --------------------
 * This model is the *message* list. `MailThreadModel` (below) is the thread
 * list, and the two are deliberately separate: the unified inbox shows threads,
 * while a conversation view shows messages, and merging them into one model
 * with a mode flag would mean every reader of the model has to know which mode
 * it is in.
 */

#include <QAbstractListModel>
#include <QHash>
#include <QModelIndex>
#include <QObject>
#include <QPersistentModelIndex>
#include <QStringList>
#include <QVariant>

#include "MailCache.h"
#include "MailTypes.h"

namespace xakteir {
namespace mail {

/**
 * One row of the message list as handed to QML.
 *
 * Deliberately a flat struct rather than a nested object: QML property access on
 * a flat map is a single `QHash` lookup per delegate, whereas a nested object
 * requires a metatype conversion that shows up in the profiler when a folder
 * of several thousand messages is scrolled.
 */
struct MessageListEntry {
    QString id;
    QString accountId;
    QString accountColor;
    QString threadId;
    QString subject;
    QString snippet;
    QString senderName;
    QString senderAddress;
    QString folder;
    QString category;
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
    bool hasPendingSync = false;
    QStringList labels;

    /** True when the row is a placeholder for a message not yet downloaded. */
    bool isPlaceholder = false;

    /**
     * A stable sort key.
     *
     * Pinned rows sort above everything else, then by sent time, then by id so
     * two messages from the same second do not swap places between renders.
     * The key is recomputed only when the row changes, not on every access.
     */
    qint64 sortKey = 0;

    void recomputeSortKey();
};

/**
 * Roles exposed to QML. Kept in sync with `MailMessageList.qml`'s `delegate`.
 *
 * The `Raw*` roles carry the underlying value rather than a formatted string, so
 * a delegate can decide its own formatting (a relative timestamp is locale- and
 * clock-dependent, and baking it in here would make every row re-render on a
 * timer).
 */
enum MessageRole {
    IdRole = Qt::UserRole + 1,
    AccountIdRole,
    AccountColorRole,
    ThreadIdRole,
    SubjectRole,
    SnippetRole,
    SenderNameRole,
    SenderAddressRole,
    FolderRole,
    CategoryRole,
    IsReadRole,
    IsStarredRole,
    IsPinnedRole,
    IsEncryptedRole,
    HasAttachmentsRole,
    AttachmentCountRole,
    MessageCountRole,
    PriorityScoreRole,
    ThreatScoreRole,
    SentAtRole,
    SnoozedUntilRole,
    ScheduleAtRole,
    RecallDeadlineRole,
    HasPendingSyncRole,
    LabelsRole,
    IsPlaceholderRole,
    /** The row as a QVariantMap, for delegates that want everything at once. */
    RowMapRole,
    /** The `folder` field, as an enum int, so `switch` works in QML. */
    FolderEnumRole,
    /** The `category` field, as an enum int. */
    CategoryEnumRole,
};

/**
 * The message list model.
 *
 * One instance per folder view. The model owns nothing but its rows: the cache
 * is the source of truth, and `reload()` re-reads from it. This is what makes
 * "pull to refresh" and "mark read" consistent without a second copy of the
 * data drifting out of sync.
 */
class MailMessageModel : public QAbstractListModel
{
    Q_OBJECT
    Q_PROPERTY(int count READ rowCount NOTIFY countChanged)
    Q_PROPERTY(int unreadCount READ unreadCount NOTIFY countChanged)
    Q_PROPERTY(bool loading READ isLoading NOTIFY loadingChanged)
    Q_PROPERTY(bool hasMore READ hasMore NOTIFY hasMoreChanged)
    Q_PROPERTY(QString folder READ folderName NOTIFY queryChanged)
    Q_PROPERTY(QString searchTerms READ searchTerms NOTIFY queryChanged)

public:
    explicit MailMessageModel(QObject *parent = nullptr);

    /* ---- QAbstractListModel ---- */

    int rowCount(const QModelIndex &parent = QModelIndex()) const override;
    QVariant data(const QModelIndex &index, int role) const override;
    QHash<int, QByteArray> roleNames() const override;

    /* ---- query ---- */

    /**
     * Points the model at a cache and a folder.
     *
     * The cache is not owned. Callers must ensure it outlives the model, which
     * in practice means both live as children of the same `MailEngine`.
     */
    void attach(MailCache *cache);

    /** Sets the folder, clearing any previous query. */
    void setFolder(Folder folder);
    /** Sets the account filter; an empty string means the unified inbox. */
    void setAccountId(const QString &accountId);
    /** Sets the free-text search terms. Debounced by the caller. */
    void setSearchTerms(const QString &terms);
    /** Narrows to one label; an empty string clears the filter. */
    void setLabelId(const QString &labelId);
    /** Sorts by priority rather than recency. */
    void setPriorityOrder(bool enabled);
    /** Reverses the sort. */
    void setAscending(bool enabled);
    /** Narrows to one category (inbox tab). */
    void setCategory(Category category, bool enabled);
    /** Unread / starred / pinned / has-attachment filters. */
    void setUnreadOnly(bool enabled);
    void setStarredOnly(bool enabled);
    void setPinnedOnly(bool enabled);
    void setHasAttachmentsOnly(bool enabled);

    Folder folder() const { return m_query.folder; }
    QString folderName() const;
    QString searchTerms() const { return m_query.searchTerms; }
    QString accountId() const { return m_query.accountId; }
    QString labelId() const { return m_query.labelId; }

    /* ---- data ---- */

    /**
     * Re-reads the first page from the cache.
     *
     * This is what a folder switch, a refresh, or a `messagesChanged` signal
     * calls. It replaces the whole list rather than merging, because a merge
     * cannot express a deletion.
     */
    void reload();
    /** Appends the next page. Used by `ListView`'s `onAtYEndChanged`. */
    void loadMore();
    /** Forces a re-read of the row at `row`, if it is still present. */
    void refreshRow(int row);

    /** The row for an id, or a null entry. */
    MessageListEntry entryForId(const QString &id) const;
    /** The index for an id, or an invalid index. */
    int rowForId(const QString &id) const;

    /** Total rows the cache reports matching the query, beyond what is loaded. */
    int totalMatching() const { return m_totalMatching; }
    int unreadMatching() const { return m_unreadMatching; }
    int loadedCount() const { return m_rows.size(); }

    bool isLoading() const { return m_loading; }
    bool hasMore() const { return m_hasMore; }
    int unreadCount() const;

    /* ---- actions (all optimistic, all queued as mutations) ---- */

    Q_INVOKABLE void markRead(const QString &id, bool read);
    Q_INVOKABLE void markStarred(const QString &id, bool starred);
    Q_INVOKABLE void markPinned(const QString &id, bool pinned);
    Q_INVOKABLE void moveToFolder(const QString &id, const QString &folder);
    Q_INVOKABLE void archive(const QString &id);
    Q_INVOKABLE void markSpam(const QString &id);
    Q_INVOKABLE void markTrash(const QString &id);
    Q_INVOKABLE void restore(const QString &id);
    /** Marks every loaded row read, in one transaction. */
    Q_INVOKABLE void markAllRead();
    /** Applies one patch to several ids, so a bulk action is one transaction. */
    Q_INVOKABLE void applyPatch(const QStringList &ids, const QVariantMap &patch);

signals:
    void countChanged();
    void loadingChanged();
    void hasMoreChanged();
    void queryChanged();
    /** Emitted when a row the user is looking at changed underneath them. */
    void rowChanged(const QString &id);
    /** Emitted when a patch was rejected, so the UI can explain why. */
    void patchRejected(const QString &id, const QString &reason);

private:
    void beginReset();
    void endReset();
    void applyRow(const MessageListEntry &entry);
    void emitCountChanged();
    static MessageListEntry fromCacheRow(const MessageListRow &row);
    static Folder folderFromQString(const QString &name);

    MailCache *m_cache = nullptr;
    MessageQuery m_query;
    QList<MessageListRow> m_rawRows;
    QList<MessageListEntry> m_rows;
    QHash<QString, int> m_rowById;

    int m_totalMatching = 0;
    int m_unreadMatching = 0;
    int m_offset = 0;
    bool m_loading = false;
    bool m_hasMore = false;
    bool m_attached = false;

    /** Page size. Large enough to scroll for a while, small enough to stay cheap. */
    static constexpr int PageSize = 50;
};

/**
 * The thread list model.
 *
 * Separate from `MailMessageModel` because a thread row and a message row carry
 * different facts: a thread has a participant count and a last-sender, a
 * message has a body and an auth result. Merging them would mean either
 * carrying both sets of fields everywhere or a mode flag at every access site.
 */
class MailThreadModel : public QAbstractListModel
{
    Q_OBJECT
    Q_PROPERTY(int count READ rowCount NOTIFY countChanged)
    Q_PROPERTY(int unreadCount READ unreadCount NOTIFY countChanged)
    Q_PROPERTY(bool loading READ isLoading NOTIFY loadingChanged)
    Q_PROPERTY(bool hasMore READ hasMore NOTIFY hasMoreChanged)

public:
    explicit MailThreadModel(QObject *parent = nullptr);

    int rowCount(const QModelIndex &parent = QModelIndex()) const override;
    QVariant data(const QModelIndex &index, int role) const override;
    QHash<int, QByteArray> roleNames() const override;

    void attach(MailCache *cache);
    void setFolder(Folder folder);
    void setAccountId(const QString &accountId);
    void setUnreadOnly(bool enabled);
    void setPriorityOrder(bool enabled);
    void setSearchTerms(const QString &terms);

    Folder folder() const { return m_folder; }

    void reload();
    void loadMore();

    Q_INVOKABLE void markThreadRead(const QString &threadId, bool read);
    Q_INVOKABLE void markThreadStarred(const QString &threadId, bool starred);
    Q_INVOKABLE void archiveThread(const QString &threadId);
    Q_INVOKABLE void markThreadTrash(const QString &threadId);
    Q_INVOKABLE void markThreadSpam(const QString &threadId);

    /*
     * Flat QML-facing aliases.
     *
     * QML addresses a thread by id and reads a row by index. Spelling
     * `archiveThread(threadIdAt(row))` at every call site would push lookup
     * logic into QML, so the two operations QML actually performs - "act on
     * this id" and "read this row" - are given the names QML uses. They are
     * thin delegates; the real work stays in the methods above.
     */
    Q_INVOKABLE void setRead(const QString &threadId, bool read) { markThreadRead(threadId, read); }
    Q_INVOKABLE void toggleStar(const QString &threadId);
    Q_INVOKABLE void archive(const QString &threadId) { archiveThread(threadId); }
    Q_INVOKABLE void markTrash(const QString &threadId) { markThreadTrash(threadId); }
    Q_INVOKABLE void markSpam(const QString &threadId) { markThreadSpam(threadId); }
    /** Reads a delegate role by row index and role name. */
    Q_INVOKABLE QVariant dataAt(int row, const QString &role) const;

    bool isLoading() const { return m_loading; }
    bool hasMore() const { return m_hasMore; }
    int unreadCount() const { return m_unreadCount; }

signals:
    void countChanged();
    void loadingChanged();
    void hasMoreChanged();
    void queryChanged();

private:
    static QVariantMap threadToMap(const MailThreadData &thread);

    MailCache *m_cache = nullptr;
    Folder m_folder = Folder::Inbox;
    QString m_accountId;
    QString m_searchTerms;
    bool m_unreadOnly = false;
    bool m_priorityOrder = false;

    QList<MailThreadData> m_threads;
    QHash<QString, int> m_threadById;

    int m_unreadCount = 0;
    int m_offset = 0;
    bool m_loading = false;
    bool m_hasMore = false;

    static constexpr int PageSize = 40;
};

} // namespace mail
} // namespace xakteir

Q_DECLARE_METATYPE(xakteir::mail::MessageListEntry)

#endif // MAILMESSAGEMODEL_H
