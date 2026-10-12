#include "MailMessageModel.h"

#include <QDateTime>
#include <QJsonObject>
#include <QJsonArray>

namespace xakteir {
namespace mail {

/* ========================================================================== */
/* MessageListEntry                                                           */
/* ========================================================================== */

/**
 * Sort key composition.
 *
 * The key is a single integer so ordering is a plain `std::sort` rather than a
 * comparator that re-reads three fields per comparison. The layout is:
 *
 *   bit 63        : pinned first (1 = pinned, so pinned sorts highest)
 *   bit 62        : read last among equal times (1 = unread, sorts higher)
 *   bits 61..0    : sentAt in epoch milliseconds
 *
 * The id is *not* part of the key. Two messages with the same timestamp are
 * ordered by the stable sort using the row's original position, which preserves
 * the order the server sent them in - and the server orders by id, so that
 * order is deterministic.
 */
void MessageListEntry::recomputeSortKey()
{
    qint64 key = sentAt;
    if (isRead)
        key &= ~(qint64(1) << 62);
    else
        key |= (qint64(1) << 62);
    if (isPinned)
        key |= (qint64(1) << 63);
    else
        key &= ~(qint64(1) << 63);
    sortKey = key;
}

/* ========================================================================== */
/* MailMessageModel                                                           */
/* ========================================================================== */

MailMessageModel::MailMessageModel(QObject *parent)
    : QAbstractListModel(parent)
{
    // The metatype is declared in the header, but registering it here as well
    // means a model created before any QML engine exists still works when it is
    // handed across a signal to a worker thread.
    qRegisterMetaType<MessageListEntry>("MessageListEntry");
}

void MailMessageModel::attach(MailCache *cache)
{
    if (m_cache == cache)
        return;

    // Detach from the previous cache first. Leaving the old connection in place
    // would mean two caches both emitting `messagesChanged` into one model,
    // and the second write would overwrite the first in the row list.
    if (m_cache) {
        disconnect(m_cache, nullptr, this, nullptr);
    }

    m_cache = cache;
    m_attached = (cache != nullptr);

    if (m_cache) {
        connect(m_cache, &MailCache::messagesChanged, this, [this]() {
            reload();
        });
        connect(m_cache, &MailCache::countsChanged, this, [this]() {
            emitCountChanged();
        });
    }

    reload();
}

int MailMessageModel::rowCount(const QModelIndex &parent) const
{
    if (parent.isValid())
        return 0;
    return m_rows.size();
}

QVariant MailMessageModel::data(const QModelIndex &index, int role) const
{
    if (!index.isValid() || index.row() < 0 || index.row() >= m_rows.size())
        return QVariant();

    const MessageListEntry &entry = m_rows.at(index.row());

    switch (role) {
    case IdRole:            return entry.id;
    case AccountIdRole:     return entry.accountId;
    case AccountColorRole:  return entry.accountColor;
    case ThreadIdRole:      return entry.threadId;
    case SubjectRole:       return entry.isEncrypted ? tr("Encrypted message") : entry.subject;
    case SnippetRole:       return entry.snippet;
    case SenderNameRole:    return entry.senderName;
    case SenderAddressRole: return entry.senderAddress;
    case FolderRole:        return entry.folder;
    case CategoryRole:      return entry.category;
    case IsReadRole:        return entry.isRead;
    case IsStarredRole:     return entry.isStarred;
    case IsPinnedRole:      return entry.isPinned;
    case IsEncryptedRole:   return entry.isEncrypted;
    case HasAttachmentsRole:return entry.hasAttachments;
    case AttachmentCountRole: return entry.attachmentCount;
    case MessageCountRole:  return entry.messageCount;
    case PriorityScoreRole: return entry.priorityScore;
    case ThreatScoreRole:   return entry.threatScore;
    case SentAtRole:        return double(entry.sentAt);
    case SnoozedUntilRole:  return double(entry.snoozedUntil);
    case ScheduleAtRole:    return double(entry.scheduleAt);
    case RecallDeadlineRole:return double(entry.recallDeadline);
    case HasPendingSyncRole:return entry.hasPendingSync;
    case LabelsRole:        return entry.labels;
    case IsPlaceholderRole: return entry.isPlaceholder;
    case FolderEnumRole:    return int(folderFromQString(entry.folder));
    case CategoryEnumRole: {
        return int(categoryFromName(entry.category));
    }
    case RowMapRole: {
        QVariantMap map;
        map.insert(QStringLiteral("id"), entry.id);
        map.insert(QStringLiteral("accountId"), entry.accountId);
        map.insert(QStringLiteral("accountColor"), entry.accountColor);
        map.insert(QStringLiteral("threadId"), entry.threadId);
        map.insert(QStringLiteral("subject"),
                   entry.isEncrypted ? tr("Encrypted message") : entry.subject);
        map.insert(QStringLiteral("snippet"), entry.snippet);
        map.insert(QStringLiteral("senderName"), entry.senderName);
        map.insert(QStringLiteral("senderAddress"), entry.senderAddress);
        map.insert(QStringLiteral("folder"), entry.folder);
        map.insert(QStringLiteral("category"), entry.category);
        map.insert(QStringLiteral("isRead"), entry.isRead);
        map.insert(QStringLiteral("isStarred"), entry.isStarred);
        map.insert(QStringLiteral("isPinned"), entry.isPinned);
        map.insert(QStringLiteral("isEncrypted"), entry.isEncrypted);
        map.insert(QStringLiteral("hasAttachments"), entry.hasAttachments);
        map.insert(QStringLiteral("attachmentCount"), entry.attachmentCount);
        map.insert(QStringLiteral("messageCount"), entry.messageCount);
        map.insert(QStringLiteral("priorityScore"), entry.priorityScore);
        map.insert(QStringLiteral("threatScore"), entry.threatScore);
        map.insert(QStringLiteral("sentAt"), double(entry.sentAt));
        map.insert(QStringLiteral("snoozedUntil"), double(entry.snoozedUntil));
        map.insert(QStringLiteral("scheduleAt"), double(entry.scheduleAt));
        map.insert(QStringLiteral("recallDeadline"), double(entry.recallDeadline));
        map.insert(QStringLiteral("hasPendingSync"), entry.hasPendingSync);
        map.insert(QStringLiteral("labels"), entry.labels);
        map.insert(QStringLiteral("isPlaceholder"), entry.isPlaceholder);
        map.insert(QStringLiteral("sortKey"), double(entry.sortKey));
        return map;
    }
    default:
        return QVariant();
    }
}

QHash<int, QByteArray> MailMessageModel::roleNames() const
{
    return {
        { IdRole,            "id" },
        { AccountIdRole,     "accountId" },
        { AccountColorRole,  "accountColor" },
        { ThreadIdRole,      "threadId" },
        { SubjectRole,       "subject" },
        { SnippetRole,       "snippet" },
        { SenderNameRole,    "senderName" },
        { SenderAddressRole, "senderAddress" },
        { FolderRole,        "folder" },
        { CategoryRole,      "category" },
        { IsReadRole,        "isRead" },
        { IsStarredRole,     "isStarred" },
        { IsPinnedRole,      "isPinned" },
        { IsEncryptedRole,   "isEncrypted" },
        { HasAttachmentsRole,"hasAttachments" },
        { AttachmentCountRole, "attachmentCount" },
        { MessageCountRole,  "messageCount" },
        { PriorityScoreRole, "priorityScore" },
        { ThreatScoreRole,   "threatScore" },
        { SentAtRole,        "sentAt" },
        { SnoozedUntilRole,  "snoozedUntil" },
        { ScheduleAtRole,    "scheduleAt" },
        { RecallDeadlineRole,"recallDeadline" },
        { HasPendingSyncRole,"hasPendingSync" },
        { LabelsRole,        "labels" },
        { IsPlaceholderRole, "isPlaceholder" },
        { RowMapRole,        "rowMap" },
        { FolderEnumRole,    "folderEnum" },
        { CategoryEnumRole,  "categoryEnum" },
    };
}

void MailMessageModel::setFolder(Folder folder)
{
    if (m_query.folder == folder)
        return;
    m_query.folder = folder;
    m_offset = 0;
    m_rows.clear();
    m_rawRows.clear();
    m_rowById.clear();
    emit queryChanged();
    reload();
}

QString MailMessageModel::folderName() const
{
    return ::xakteir::mail::folderName(m_query.folder);
}

void MailMessageModel::setAccountId(const QString &accountId)
{
    if (m_query.accountId == accountId)
        return;
    m_query.accountId = accountId;
    emit queryChanged();
    reload();
}

void MailMessageModel::setSearchTerms(const QString &terms)
{
    if (m_query.searchTerms == terms)
        return;
    m_query.searchTerms = terms;
    emit queryChanged();
    reload();
}

void MailMessageModel::setLabelId(const QString &labelId)
{
    if (m_query.labelId == labelId)
        return;
    m_query.labelId = labelId;
    emit queryChanged();
    reload();
}

void MailMessageModel::setPriorityOrder(bool enabled)
{
    if (m_query.priorityOrder == enabled)
        return;
    m_query.priorityOrder = enabled;
    emit queryChanged();
    reload();
}

void MailMessageModel::setAscending(bool enabled)
{
    if (m_query.ascOrder == enabled)
        return;
    m_query.ascOrder = enabled;
    emit queryChanged();
    reload();
}

void MailMessageModel::setCategory(Category category, bool enabled)
{
    if (m_query.category == category && m_query.useCategory == enabled)
        return;
    m_query.category = category;
    m_query.useCategory = enabled;
    emit queryChanged();
    reload();
}

void MailMessageModel::setUnreadOnly(bool enabled)
{
    if (m_query.unreadOnly == enabled)
        return;
    m_query.unreadOnly = enabled;
    emit queryChanged();
    reload();
}

void MailMessageModel::setStarredOnly(bool enabled)
{
    if (m_query.starredOnly == enabled)
        return;
    m_query.starredOnly = enabled;
    emit queryChanged();
    reload();
}

void MailMessageModel::setPinnedOnly(bool enabled)
{
    if (m_query.pinnedOnly == enabled)
        return;
    m_query.pinnedOnly = enabled;
    emit queryChanged();
    reload();
}

void MailMessageModel::setHasAttachmentsOnly(bool enabled)
{
    if (m_query.hasAttachmentsOnly == enabled)
        return;
    m_query.hasAttachmentsOnly = enabled;
    emit queryChanged();
    reload();
}

void MailMessageModel::beginReset()
{
    beginResetModel();
    m_loading = true;
    emit loadingChanged();
}

void MailMessageModel::endReset()
{
    m_loading = false;
    emit loadingChanged();
    endResetModel();
    emitCountChanged();
}

void MailMessageModel::emitCountChanged()
{
    emit countChanged();
    emit hasMoreChanged();
}

MessageListEntry MailMessageModel::fromCacheRow(const MessageListRow &row)
{
    MessageListEntry entry;
    entry.id = row.id;
    entry.accountId = row.accountId;
    entry.accountColor = row.accountColor;
    entry.threadId = row.threadId;
    entry.subject = row.subject;
    entry.snippet = row.snippet;
    entry.senderName = row.senderName;
    entry.senderAddress = row.senderAddress;
    entry.folder = folderName(row.folder);
    entry.category = categoryName(row.category);
    entry.isRead = row.isRead;
    entry.isStarred = row.isStarred;
    entry.isPinned = row.isPinned;
    entry.isEncrypted = row.isEncrypted;
    entry.hasAttachments = row.hasAttachments;
    entry.attachmentCount = row.attachmentCount;
    entry.messageCount = row.messageCount;
    entry.priorityScore = row.priorityScore;
    entry.threatScore = row.threatScore;
    entry.sentAt = row.sentAt;
    entry.snoozedUntil = row.snoozedUntil;
    entry.scheduleAt = row.scheduleAt;
    entry.recallDeadline = row.recallDeadline;
    entry.hasPendingSync = row.hasPendingSync;
    entry.labels = row.labels;
    entry.isPlaceholder = false;
    entry.recomputeSortKey();
    return entry;
}

Folder MailMessageModel::folderFromQString(const QString &name)
{
    return ::xakteir::mail::folderFromName(name);
}

void MailMessageModel::reload()
{
    if (!m_cache || !m_cache->isOpen()) {
        beginReset();
        m_rows.clear();
        m_rawRows.clear();
        m_rowById.clear();
        m_totalMatching = 0;
        m_unreadMatching = 0;
        m_offset = 0;
        m_hasMore = false;
        endReset();
        return;
    }

    beginReset();

    m_offset = 0;
    m_rawRows.clear();
    m_rows.clear();
    m_rowById.clear();

    m_query.limit = PageSize;
    m_query.offset = 0;

    const MessagePage page = m_cache->queryMessages(m_query);
    m_totalMatching = page.totalMatching;
    m_unreadMatching = page.unreadMatching;

    m_rawRows = page.rows;
    m_rows.reserve(page.rows.size());
    for (const MessageListRow &row : std::as_const(page.rows)) {
        m_rowById.insert(row.id, m_rows.size());
        m_rows.append(fromCacheRow(row));
    }

    m_offset = m_rawRows.size();
    m_hasMore = (m_offset < m_totalMatching);

    endReset();
}

void MailMessageModel::loadMore()
{
    if (!m_cache || !m_cache->isOpen() || !m_hasMore || m_loading)
        return;

    m_loading = true;
    emit loadingChanged();

    m_query.limit = PageSize;
    m_query.offset = m_offset;

    const MessagePage page = m_cache->queryMessages(m_query);

    if (page.rows.isEmpty()) {
        // The count and the rows disagree, which happens when rows are deleted
        // between the count and the read. Reporting "no more" rather than
        // retrying forever is the honest response.
        m_hasMore = false;
        m_loading = false;
        emit loadingChanged();
        emit hasMoreChanged();
        return;
    }

    const int firstNewRow = m_rows.size();
    m_rawRows.reserve(m_rawRows.size() + page.rows.size());
    m_rows.reserve(m_rows.size() + page.rows.size());

    for (const MessageListRow &row : page.rows) {
        if (m_rowById.contains(row.id))
            continue;
        m_rowById.insert(row.id, m_rows.size());
        m_rawRows.append(row);
        m_rows.append(fromCacheRow(row));
    }

    m_offset = m_rawRows.size();
    m_hasMore = (m_offset < m_totalMatching);

    m_loading = false;

    if (m_rows.size() > firstNewRow) {
        beginInsertRows(QModelIndex(), firstNewRow, m_rows.size() - 1);
        endInsertRows();
    }

    emit loadingChanged();
    emit hasMoreChanged();
    emitCountChanged();
}

void MailMessageModel::refreshRow(int row)
{
    if (row < 0 || row >= m_rows.size())
        return;
    const QString id = m_rows.at(row).id;
    if (!m_cache)
        return;

    MailMessageData message;
    if (!m_cache->loadMessage(id, &message)) {
        // The row is gone from the cache. Remove it rather than leaving a
        // stale entry that the user can still click.
        beginRemoveRows(QModelIndex(), row, row);
        m_rowById.remove(id);
        m_rawRows.removeAt(row);
        m_rows.removeAt(row);
        m_rowById.clear();
        for (int i = row; i < m_rows.size(); i += 1)
            m_rowById.insert(m_rows.at(i).id, i);
        endRemoveRows();
        emitCountChanged();
        return;
    }

    MessageListEntry entry;
    entry.id = message.id;
    entry.accountId = message.accountId;
    entry.threadId = message.threadId;
    entry.subject = message.subject;
    entry.snippet = message.snippet;
    entry.senderName = message.from.name;
    entry.senderAddress = message.from.address;
    entry.folder = folderName(message.folder);
    entry.category = categoryName(message.category);
    entry.isRead = message.isRead;
    entry.isStarred = message.isStarred;
    entry.isPinned = message.isPinned;
    entry.isEncrypted = message.isEncrypted;
    entry.hasAttachments = !message.attachmentSummaries.isEmpty();
    entry.attachmentCount = message.attachmentSummaries.size();
    entry.messageCount = message.threadMessageCount;
    entry.priorityScore = message.priorityScore;
    entry.threatScore = message.threatScore;
    entry.sentAt = message.sentAt;
    entry.snoozedUntil = message.snoozedUntil;
    entry.scheduleAt = message.scheduleAt;
    entry.recallDeadline = message.recallDeadline;
    entry.hasPendingSync = false;
    entry.labels = message.labels;
    entry.recomputeSortKey();

    m_rows[row] = entry;
    const QModelIndex idx = index(row);
    emit dataChanged(idx, idx);
    emit rowChanged(entry.id);
}

MessageListEntry MailMessageModel::entryForId(const QString &id) const
{
    const int row = rowForId(id);
    if (row < 0)
        return MessageListEntry();
    return m_rows.at(row);
}

int MailMessageModel::rowForId(const QString &id) const
{
    return m_rowById.value(id, -1);
}

int MailMessageModel::unreadCount() const
{
    return m_unreadMatching;
}

void MailMessageModel::markRead(const QString &id, bool read)
{
    QVariantMap patch;
    patch.insert(QStringLiteral("isRead"), read);
    patch.insert(QStringLiteral("readAt"), read ? QDateTime::currentMSecsSinceEpoch() : 0);
    applyPatch({ id }, patch);
}

void MailMessageModel::markStarred(const QString &id, bool starred)
{
    QVariantMap patch;
    patch.insert(QStringLiteral("isStarred"), starred);
    applyPatch({ id }, patch);
}

void MailMessageModel::markPinned(const QString &id, bool pinned)
{
    QVariantMap patch;
    patch.insert(QStringLiteral("isPinned"), pinned);
    applyPatch({ id }, patch);
}

void MailMessageModel::moveToFolder(const QString &id, const QString &folder)
{
    QVariantMap patch;
    patch.insert(QStringLiteral("folder"), folder);
    if (folder != QLatin1String("inbox"))
        patch.insert(QStringLiteral("snoozedUntil"), 0);
    if (folder == QLatin1String("inbox") || folder == QLatin1String("archive"))
        patch.insert(QStringLiteral("deletedAt"), 0);
    applyPatch({ id }, patch);
}

void MailMessageModel::archive(const QString &id)
{
    moveToFolder(id, QStringLiteral("archive"));
}

void MailMessageModel::markSpam(const QString &id)
{
    moveToFolder(id, QStringLiteral("spam"));
}

void MailMessageModel::markTrash(const QString &id)
{
    moveToFolder(id, QStringLiteral("trash"));
}

void MailMessageModel::restore(const QString &id)
{
    QVariantMap patch;
    patch.insert(QStringLiteral("deletedAt"), 0);
    patch.insert(QStringLiteral("folder"), QStringLiteral("inbox"));
    applyPatch({ id }, patch);
}

void MailMessageModel::markAllRead()
{
    QStringList ids;
    ids.reserve(m_rows.size());
    for (const MessageListEntry &entry : std::as_const(m_rows)) {
        if (!entry.isRead)
            ids.append(entry.id);
    }
    if (ids.isEmpty())
        return;

    QVariantMap patch;
    patch.insert(QStringLiteral("isRead"), true);
    patch.insert(QStringLiteral("readAt"), QDateTime::currentMSecsSinceEpoch());
    applyPatch(ids, patch);
}

/**
 * Applies one patch to one or more rows.
 *
 * The cache is asked to apply the patch first; only if that succeeds are the
 * in-memory rows updated. Doing it the other way round - updating the model and
 * hoping the cache agrees - is how a list ends up showing a state the next
 * reload will undo.
 *
 * A rejected patch is reported per id rather than as one aggregate, because the
 * usual cause is a single server-owned field and the user needs to know which
 * one.
 */
void MailMessageModel::applyPatch(const QStringList &ids, const QVariantMap &patch)
{
    if (!m_cache || !m_cache->isOpen() || ids.isEmpty())
        return;

    for (const QString &id : ids) {
        QString error;
        if (!m_cache->applyLocalPatch(QStringLiteral("messages"), id, patch, &error)) {
            emit patchRejected(id, error);
            continue;
        }
        const int row = rowForId(id);
        if (row >= 0)
            refreshRow(row);
    }
}

/* ========================================================================== */
/* MailThreadModel                                                            */
/* ========================================================================== */

MailThreadModel::MailThreadModel(QObject *parent)
    : QAbstractListModel(parent)
{
}

void MailThreadModel::attach(MailCache *cache)
{
    if (m_cache == cache)
        return;
    if (m_cache)
        disconnect(m_cache, nullptr, this, nullptr);

    m_cache = cache;
    if (m_cache) {
        connect(m_cache, &MailCache::threadsChanged, this, [this]() {
            reload();
        });
        connect(m_cache, &MailCache::messagesChanged, this, [this]() {
            // A message change can change a thread's unread count even when the
            // thread row itself did not move, so the thread list refreshes too.
            reload();
        });
    }
    reload();
}

int MailThreadModel::rowCount(const QModelIndex &parent) const
{
    if (parent.isValid())
        return 0;
    return m_threads.size();
}

QVariant MailThreadModel::data(const QModelIndex &index, int role) const
{
    if (!index.isValid() || index.row() < 0 || index.row() >= m_threads.size())
        return QVariant();
    return threadToMap(m_threads.at(index.row())).value(QString::fromLatin1(roleNames().value(role)));
}

QHash<int, QByteArray> MailThreadModel::roleNames() const
{
    return {
        { Qt::DisplayRole,   "subject" },
        { Qt::UserRole + 1,  "id" },
        { Qt::UserRole + 2,  "accountId" },
        { Qt::UserRole + 3,  "messageCount" },
        { Qt::UserRole + 4,  "unreadCount" },
        { Qt::UserRole + 5,  "hasAttachments" },
        { Qt::UserRole + 6,  "isStarred" },
        { Qt::UserRole + 7,  "isPinned" },
        { Qt::UserRole + 8,  "latestAt" },
        { Qt::UserRole + 9,  "lastSenderName" },
        { Qt::UserRole + 10, "lastSenderAddress" },
        { Qt::UserRole + 11, "snippet" },
        { Qt::UserRole + 12, "labels" },
        { Qt::UserRole + 13, "priorityScore" },
        { Qt::UserRole + 14, "participantCount" },
        { Qt::UserRole + 15, "threadMap" },
    };
}

QVariantMap MailThreadModel::threadToMap(const MailThreadData &thread)
{
    QVariantMap map;
    map.insert(QStringLiteral("id"), thread.id);
    map.insert(QStringLiteral("accountId"), thread.accountId);
    map.insert(QStringLiteral("subject"), thread.subject);
    map.insert(QStringLiteral("messageCount"), thread.messageCount);
    map.insert(QStringLiteral("unreadCount"), thread.unreadCount);
    map.insert(QStringLiteral("hasAttachments"), thread.hasAttachments);
    map.insert(QStringLiteral("isStarred"), thread.isStarred);
    map.insert(QStringLiteral("isPinned"), thread.isPinned);
    map.insert(QStringLiteral("latestAt"), double(thread.latestAt));
    map.insert(QStringLiteral("lastSenderName"), thread.lastSenderName);
    map.insert(QStringLiteral("lastSenderAddress"), thread.lastSenderAddress);
    map.insert(QStringLiteral("snippet"), thread.snippet);
    map.insert(QStringLiteral("labels"), thread.labels);
    map.insert(QStringLiteral("priorityScore"), thread.priorityScore);
    map.insert(QStringLiteral("participantCount"), thread.participants.size());

    QVariantList participants;
    for (const MailAddress &address : thread.participants)
        participants.append(address.toVariant());
    map.insert(QStringLiteral("participants"), participants);
    map.insert(QStringLiteral("threadMap"), map);
    return map;
}

void MailThreadModel::setFolder(Folder folder)
{
    if (m_folder == folder)
        return;
    m_folder = folder;
    emit queryChanged();
    reload();
}

void MailThreadModel::setAccountId(const QString &accountId)
{
    if (m_accountId == accountId)
        return;
    m_accountId = accountId;
    emit queryChanged();
    reload();
}

void MailThreadModel::setUnreadOnly(bool enabled)
{
    if (m_unreadOnly == enabled)
        return;
    m_unreadOnly = enabled;
    emit queryChanged();
    reload();
}

void MailThreadModel::setPriorityOrder(bool enabled)
{
    if (m_priorityOrder == enabled)
        return;
    m_priorityOrder = enabled;
    emit queryChanged();
    reload();
}

void MailThreadModel::setSearchTerms(const QString &terms)
{
    if (m_searchTerms == terms)
        return;
    m_searchTerms = terms;
    emit queryChanged();
    reload();
}

void MailThreadModel::reload()
{
    if (!m_cache || !m_cache->isOpen()) {
        beginResetModel();
        m_threads.clear();
        m_threadById.clear();
        m_unreadCount = 0;
        m_offset = 0;
        m_hasMore = false;
        endResetModel();
        emit countChanged();
        return;
    }

    beginResetModel();
    m_offset = 0;
    m_threads.clear();
    m_threadById.clear();

    m_unreadCount = 0;
    const QList<MailThreadData> page = m_cache->queryThreads(m_folder, m_accountId, PageSize, 0,
                                                             m_unreadOnly, m_priorityOrder);
    m_threads = page;
    for (int i = 0; i < m_threads.size(); i += 1) {
        m_threadById.insert(m_threads.at(i).id, i);
        m_unreadCount += m_threads.at(i).unreadCount;
    }
    m_offset = m_threads.size();
    m_hasMore = (m_threads.size() == PageSize);

    endResetModel();
    emit countChanged();
    emit hasMoreChanged();
    emit loadingChanged();
}

void MailThreadModel::loadMore()
{
    if (!m_cache || !m_cache->isOpen() || !m_hasMore || m_loading)
        return;

    m_loading = true;
    emit loadingChanged();

    const QList<MailThreadData> page = m_cache->queryThreads(m_folder, m_accountId, PageSize, m_offset,
                                                             m_unreadOnly, m_priorityOrder);
    if (page.isEmpty()) {
        m_hasMore = false;
        m_loading = false;
        emit loadingChanged();
        emit hasMoreChanged();
        return;
    }

    const int firstNewRow = m_threads.size();
    for (const MailThreadData &thread : page) {
        if (m_threadById.contains(thread.id))
            continue;
        m_threadById.insert(thread.id, m_threads.size());
        m_threads.append(thread);
        m_unreadCount += thread.unreadCount;
    }
    m_offset = m_threads.size();
    m_hasMore = (page.size() == PageSize);
    m_loading = false;

    if (m_threads.size() > firstNewRow) {
        beginInsertRows(QModelIndex(), firstNewRow, m_threads.size() - 1);
        endInsertRows();
    }
    emit loadingChanged();
    emit hasMoreChanged();
    emit countChanged();
}

void MailThreadModel::markThreadRead(const QString &threadId, bool read)
{
    if (!m_cache)
        return;
    const QStringList ids = m_cache->threadMessageIds(threadId);
    QVariantMap patch;
    patch.insert(QStringLiteral("isRead"), read);
    patch.insert(QStringLiteral("readAt"), read ? QDateTime::currentMSecsSinceEpoch() : 0);
    for (const QString &id : ids)
        m_cache->applyLocalPatch(QStringLiteral("messages"), id, patch);
    m_cache->rebuildThread(threadId);
    reload();
}

void MailThreadModel::markThreadStarred(const QString &threadId, bool starred)
{
    if (!m_cache)
        return;
    const QStringList ids = m_cache->threadMessageIds(threadId);
    QVariantMap patch;
    patch.insert(QStringLiteral("isStarred"), starred);
    for (const QString &id : ids)
        m_cache->applyLocalPatch(QStringLiteral("messages"), id, patch);
    m_cache->rebuildThread(threadId);
    reload();
}

void MailThreadModel::archiveThread(const QString &threadId)
{
    if (!m_cache)
        return;
    const QStringList ids = m_cache->threadMessageIds(threadId);
    QVariantMap patch;
    patch.insert(QStringLiteral("folder"), QStringLiteral("archive"));
    patch.insert(QStringLiteral("deletedAt"), 0);
    for (const QString &id : ids)
        m_cache->applyLocalPatch(QStringLiteral("messages"), id, patch);
    m_cache->rebuildThread(threadId);
    reload();
}

void MailThreadModel::markThreadTrash(const QString &threadId)
{
    if (!m_cache)
        return;
    const QStringList ids = m_cache->threadMessageIds(threadId);
    QVariantMap patch;
    patch.insert(QStringLiteral("folder"), QStringLiteral("trash"));
    patch.insert(QStringLiteral("deletedAt"), QDateTime::currentMSecsSinceEpoch());
    for (const QString &id : ids)
        m_cache->applyLocalPatch(QStringLiteral("messages"), id, patch);
    m_cache->rebuildThread(threadId);
    reload();
}

void MailThreadModel::markThreadSpam(const QString &threadId)
{
    if (!m_cache)
        return;
    const QStringList ids = m_cache->threadMessageIds(threadId);
    QVariantMap patch;
    patch.insert(QStringLiteral("folder"), QStringLiteral("spam"));
    patch.insert(QStringLiteral("deletedAt"), 0);
    for (const QString &id : ids)
        m_cache->applyLocalPatch(QStringLiteral("messages"), id, patch);
    m_cache->rebuildThread(threadId);
    reload();
}

void MailThreadModel::toggleStar(const QString &threadId)
{
    bool starred = false;
    const QHash<QString, int>::const_iterator it = m_threadById.constFind(threadId);
    if (it != m_threadById.constEnd() && it.value() >= 0 && it.value() < m_threads.size())
        starred = m_threads.at(it.value()).isStarred;
    markThreadStarred(threadId, !starred);
}

QVariant MailThreadModel::dataAt(int row, const QString &role) const
{
    if (row < 0 || row >= m_threads.size())
        return QVariant();
    const QHash<int, QByteArray> roles = roleNames();
    for (QHash<int, QByteArray>::const_iterator it = roles.constBegin();
         it != roles.constEnd(); ++it) {
        if (QString::fromUtf8(it.value()) == role)
            return data(index(row, 0), it.key());
    }
    return QVariant();
}

} // namespace mail
} // namespace xakteir
