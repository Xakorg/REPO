#include "MailCache.h"

#include <QDebug>
#include <QDir>
#include <QFile>
#include <QFileInfo>
#include <QHash>
#include <QJsonDocument>
#include <QJsonArray>
#include <QJsonObject>
#include <QSqlError>
#include <QSqlQuery>
#include <QSqlRecord>
#include <QStandardPaths>
#include <QVariant>

#include <algorithm>
#include <utility>

namespace xakteir {
namespace mail {

namespace {

/** Name of the main thread's connection. Workers open their own. */
constexpr const char *MainConnection = "xakteir_mail_main";

/**
 * Sanitises a free-text query into something FTS5 will accept.
 *
 * SQLite's MATCH grammar has its own syntax and a user typing `subject:"hello"` or
 * a stray `-` would produce a parse error rather than results. Characters that
 * carry meaning in FTS5 are dropped, the rest is whitespace-simplified.
 */
QString normaliseTerms(const QString &terms)
{
    QString out;
    out.reserve(terms.size());
    for (const QChar &ch : terms) {
        if (ch.isLetterOrNumber() || ch == QLatin1Char('_') || ch == QLatin1Char('-'))
            out.append(ch);
        else if (ch.isSpace())
            out.append(QLatin1Char(' '));
        else if (ch == QLatin1Char('"'))
            out.append(QLatin1Char(' '));
    }
    return out.simplified();
}

QString boolToInt(bool value) { return value ? QStringLiteral("1") : QStringLiteral("0"); }

/** Serialises a string list to the JSON array stored in a `*_json` column. */
QJsonArray toJsonArray(const QStringList &list)
{
    QJsonArray array;
    for (const QString &item : list) array.append(item);
    return array;
}

QString encodeArray(const QStringList &list)
{
    return QString::fromUtf8(QJsonDocument(toJsonArray(list)).toJson(QJsonDocument::Compact));
}

QString encodeAddresses(const QList<MailAddress> &addresses)
{
    QJsonArray array;
    for (const MailAddress &address : addresses)
        array.append(QJsonObject::fromVariantMap(address.toVariant()));
    return QString::fromUtf8(QJsonDocument(array).toJson(QJsonDocument::Compact));
}

QList<MailAddress> decodeAddresses(const QString &json)
{
    if (json.isEmpty()) return {};
    const QJsonArray array = QJsonDocument::fromJson(json.toUtf8()).array();
    QList<MailAddress> out;
    for (const QJsonValue &value : array)
        out.append(MailAddress::fromVariant(value.toObject().toVariantMap()));
    return out;
}

QStringList decodeStringList(const QString &json)
{
    if (json.isEmpty()) return {};
    const QJsonArray array = QJsonDocument::fromJson(json.toUtf8()).array();
    QStringList out;
    for (const QJsonValue &value : array)
        out.append(value.toString());
    return out;
}

/**
 * Backs up the pending mutation queue to a sidecar file.
 *
 * The queue is the only table in this database the server cannot recreate. A
 * schema upgrade that drops it would silently discard a message the user asked
 * to send while offline, so it is copied aside before the drop and restored
 * after. Everything else is rebuildable from the server and is not copied.
 */
bool writePendingAside(const QString &path)
{
    QSqlDatabase db = QSqlDatabase::database(QString::fromLatin1(MainConnection), false);
    if (!db.isOpen()) return false;

    QSqlQuery query(db);
    if (!query.exec(QStringLiteral(
            "SELECT mutation_id, collection, doc_id, op, payload, created_at, attempts, last_error "
            "FROM pending_mutations ORDER BY created_at ASC")))
        return false;

    QJsonArray rows;
    while (query.next()) {
        QJsonObject row;
        row.insert(QStringLiteral("mutationId"), query.value(0).toString());
        row.insert(QStringLiteral("collection"), query.value(1).toString());
        row.insert(QStringLiteral("docId"), query.value(2).toString());
        row.insert(QStringLiteral("operation"), query.value(3).toString());
        row.insert(QStringLiteral("payloadJson"), query.value(4).toString());
        row.insert(QStringLiteral("createdAt"), double(query.value(5).toLongLong()));
        row.insert(QStringLiteral("attempts"), query.value(6).toInt());
        row.insert(QStringLiteral("lastError"), query.value(7).toString());
        rows.append(row);
    }

    QFile file(path + QStringLiteral(".pending.json"));
    if (!file.open(QIODevice::WriteOnly | QIODevice::Truncate)) return false;
    file.write(QJsonDocument(rows).toJson(QJsonDocument::Compact));
    file.close();
    return true;
}

void restorePendingAside(const QString &path)
{
    QFile file(path + QStringLiteral(".pending.json"));
    if (!file.exists() || !file.open(QIODevice::ReadOnly)) return;
    const QByteArray bytes = file.readAll();
    file.close();

    const QJsonArray rows = QJsonDocument::fromJson(bytes).array();
    if (rows.isEmpty()) { file.remove(); return; }

    QSqlDatabase db = QSqlDatabase::database(QString::fromLatin1(MainConnection), false);
    if (!db.isOpen()) return;

    QSqlQuery insert(db);
    insert.prepare(QStringLiteral(
        "INSERT OR REPLACE INTO pending_mutations "
        "(mutation_id, collection, doc_id, op, payload, created_at, attempts, last_error) "
        "VALUES (?, ?, ?, ?, ?, ?, ?, ?)"));

    db.transaction();
    for (const QJsonValue &value : rows) {
        const QJsonObject row = value.toObject();
        insert.addBindValue(row.value(QStringLiteral("mutationId")).toString());
        insert.addBindValue(row.value(QStringLiteral("collection")).toString());
        insert.addBindValue(row.value(QStringLiteral("docId")).toString());
        insert.addBindValue(row.value(QStringLiteral("operation")).toString());
        insert.addBindValue(row.value(QStringLiteral("payloadJson")).toString());
        insert.addBindValue(qint64(row.value(QStringLiteral("createdAt")).toDouble()));
        insert.addBindValue(row.value(QStringLiteral("attempts")).toInt());
        insert.addBindValue(row.value(QStringLiteral("lastError")).toString());
        insert.exec();
    }
    db.commit();
    file.remove();
}

/**
 * Reads one message row into a `MailMessageData`.
 *
 * Columns are located by NAME rather than by index. The pull path and the list
 * path select different column subsets (the list deliberately omits bodies), so
 * positional indexes would silently bind the wrong value the first time a
 * query is reordered - the failure mode of which is a subject shown as a body,
 * which nobody reports as a bug for weeks.
 */
MailMessageData readMessageRow(const QSqlQuery &query)
{
    const QSqlRecord record = query.record();
    auto idx = [&record](const char *name) {
        return record.indexOf(QLatin1String(name));
    };
    auto str = [&](const char *name) {
        const int column = idx(name);
        return column < 0 ? QString() : query.value(column).toString();
    };
    auto num = [&](const char *name) {
        const int column = idx(name);
        return column < 0 ? qint64(0) : query.value(column).toLongLong();
    };
    auto num32 = [&](const char *name) {
        const int column = idx(name);
        return column < 0 ? 0 : query.value(column).toInt();
    };
    auto flag = [&](const char *name) {
        const int column = idx(name);
        return column >= 0 && query.value(column).toBool();
    };

    MailMessageData message;
    message.id = str("id");
    message.ownerUid = str("owner_uid");
    message.accountId = str("account_id");
    message.threadId = str("thread_id");
    message.threadSubject = str("thread_subject");
    message.threadMessageCount = num32("thread_message_count");
    message.subject = str("subject");
    message.snippet = str("snippet");

    message.from.address = str("from_address");
    message.from.name = str("from_name");
    message.from.rawAddress = message.from.address;
    if (message.from.address.contains(QLatin1Char('@')))
        message.from.domain = message.from.address.mid(message.from.address.indexOf(QLatin1Char('@')) + 1).toLower();

    message.to = decodeAddresses(str("to_json"));
    message.cc = decodeAddresses(str("cc_json"));
    message.bcc = decodeAddresses(str("bcc_json"));
    message.replyTo = decodeAddresses(str("reply_to_json"));

    message.bodyText = str("body_text");
    message.bodyHtml = str("body_html");
    message.rawSource = str("raw_source");
    message.rawBytes = num("raw_bytes");
    message.rawSizeBytes = message.rawBytes;

    message.internetMessageId = str("internet_message_id");
    message.references = decodeStringList(str("references_json"));
    message.inReplyTo = str("in_reply_to");
    message.folder = folderFromName(str("folder"));
    message.category = categoryFromName(str("category"));
    message.labels = decodeStringList(str("labels_json"));
    message.attachmentIds = decodeStringList(str("attachment_ids_json"));

    message.isRead = flag("is_read");
    message.isStarred = flag("is_starred");
    message.isPinned = flag("is_pinned");
    message.isDeleted = flag("is_deleted");
    message.isEncrypted = flag("is_encrypted");
    message.requestReadReceipt = flag("request_read_receipt");
    message.awaitingReply = flag("awaiting_reply");
    message.wasFlattened = flag("was_flattened");

    message.priorityScore = num32("priority_score");
    message.priorityReasons = decodeStringList(str("priority_reasons_json"));
    message.threatScore = num32("threat_score");
    message.threatFindings = decodeStringList(str("threat_findings_json"));

    const QVariantMap authMap = QJsonDocument::fromJson(str("auth_json").toUtf8()).object().toVariantMap();
    message.auth = AuthResults::fromVariant(authMap);

    message.ciphertext = str("ciphertext");
    message.iv = str("iv");
    message.keyId = str("key_id");

    message.receiptIds = decodeStringList(str("receipt_ids_json"));
    message.eventIds = decodeStringList(str("event_ids_json"));
    message.calendarInvitationIds = decodeStringList(str("calendar_invitation_ids_json"));

    message.idempotencyKey = str("idempotency_key");
    message.deliveryAdapter = str("delivery_adapter");
    message.sendResultStatus = str("send_result_status");
    message.sendResultDetail = str("send_result_detail");
    message.sendResultDelivered = flag("send_result_delivered");
    message.providerMessageId = str("provider_message_id");
    message.deliveredAt = num("delivered_at");

    message.sentAt = num("sent_at");
    message.createdAt = num("created_at");
    message.updatedAt = num("updated_at");
    message.readAt = num("read_at");
    message.snoozedUntil = num("snoozed_until");
    message.scheduleAt = num("schedule_at");
    message.recallDeadline = num("recall_deadline");
    message.revision = num("revision");
    message.lastWriter = str("last_writer");
    message.deletedAt = num("deleted_at");

    return message;
}

} // namespace

/* ========================================================================== */
/* Lifecycle                                                                  */
/* ========================================================================== */

MailCache::MailCache(QObject *parent)
    : QObject(parent)
{
}

MailCache::~MailCache()
{
    if (m_db.isOpen()) {
        const QString name = m_db.connectionName();
        m_db = QSqlDatabase();
        QSqlDatabase::removeDatabase(name);
    }
}

QString MailCache::databasePath() const { return m_path; }
bool MailCache::isOpen() const { return m_open; }
QString MailCache::errorString() const { return m_error; }

void MailCache::setError(const QString &message) const
{
    m_error = message;
    qWarning() << "[MailCache]" << message;
}

bool MailCache::open(const QString &path)
{
    if (m_open) return true;

    m_path = path;
    const QFileInfo info(path);
    if (!info.dir().exists())
        QDir().mkpath(info.dir().absolutePath());

    QSqlDatabase db = QSqlDatabase::addDatabase(QStringLiteral("QSQLITE"), QString::fromLatin1(MainConnection));
    db.setDatabaseName(path);
    if (!db.open()) {
        setError(QStringLiteral("Could not open the local mail cache at %1: %2").arg(path, db.lastError().text()));
        return false;
    }

    // WAL lets the list stay readable while the sync worker writes. Without it a
    // pull of a few hundred documents blocks every read the UI is performing.
    QSqlQuery pragma(db);
    pragma.exec(QStringLiteral("PRAGMA journal_mode=WAL"));
    pragma.exec(QStringLiteral("PRAGMA synchronous=NORMAL"));
    pragma.exec(QStringLiteral("PRAGMA foreign_keys=ON"));
    pragma.exec(QStringLiteral("PRAGMA busy_timeout=5000"));

    if (!ensureSchema(db)) {
        db.close();
        return false;
    }

    m_db = db;
    m_open = true;
    return true;
}

QSqlDatabase MailCache::connection(const QString &connectionName) const
{
    if (connectionName.isEmpty())
        return m_db;
    return QSqlDatabase::database(connectionName, false);
}

bool MailCache::ensureSchema(QSqlDatabase &db)
{
    QSqlQuery probe(db);
    if (!probe.exec(QStringLiteral("PRAGMA user_version"))) {
        setError(QStringLiteral("Could not read the cache schema version: %1").arg(probe.lastError().text()));
        return false;
    }
    int version = 0;
    if (probe.next()) version = probe.value(0).toInt();

    if (version == MAIL_NATIVE_SCHEMA_REVISION)
        return true;

    // A different contract version means the stored rows cannot be interpreted
    // by this build. The queue is preserved first; everything else is a cache of
    // server-owned data and is rebuilt on the next pull.
    const bool asideWritten = writePendingAside(m_path);

    db.close();
    QSqlDatabase::removeDatabase(QString::fromLatin1(MainConnection));
    QFile::remove(m_path);
    QFile::remove(m_path + QStringLiteral("-wal"));
    QFile::remove(m_path + QStringLiteral("-shm"));

    QSqlDatabase reopened = QSqlDatabase::addDatabase(QStringLiteral("QSQLITE"), QString::fromLatin1(MainConnection));
    reopened.setDatabaseName(m_path);
    if (!reopened.open()) {
        setError(QStringLiteral("The mail cache could not be recreated: %1").arg(reopened.lastError().text()));
        return false;
    }
    QSqlQuery newPragma(reopened);
    newPragma.exec(QStringLiteral("PRAGMA journal_mode=WAL"));
    newPragma.exec(QStringLiteral("PRAGMA synchronous=NORMAL"));
    newPragma.exec(QStringLiteral("PRAGMA foreign_keys=ON"));
    newPragma.exec(QStringLiteral("PRAGMA busy_timeout=5000"));
    db = reopened;

    if (!createSchema(db))
        return false;
    QSqlQuery stamp(db);
    stamp.exec(QStringLiteral("PRAGMA user_version=%1").arg(MAIL_NATIVE_SCHEMA_REVISION));
    applyIndexes(db);
    if (asideWritten) restorePendingAside(m_path);

    qInfo() << "[MailCache] recreated from schema" << version << "to" << MAIL_NATIVE_SCHEMA_REVISION;
    return true;
}

bool MailCache::createSchema(QSqlDatabase &db)
{
    QStringList statements;

    statements << QStringLiteral(
        "CREATE TABLE IF NOT EXISTS messages ("
        "  id TEXT PRIMARY KEY,"
        "  owner_uid TEXT NOT NULL,"
        "  account_id TEXT NOT NULL,"
        "  thread_id TEXT NOT NULL,"
        "  thread_subject TEXT,"
        "  thread_message_count INTEGER NOT NULL DEFAULT 1,"
        "  subject TEXT,"
        "  snippet TEXT,"
        "  from_address TEXT,"
        "  from_name TEXT,"
        "  to_json TEXT,"
        "  cc_json TEXT,"
        "  bcc_json TEXT,"
        "  reply_to_json TEXT,"
        "  body_text TEXT,"
        "  body_html TEXT,"
        "  raw_source TEXT,"
        "  raw_bytes INTEGER NOT NULL DEFAULT 0,"
        "  internet_message_id TEXT,"
        "  references_json TEXT,"
        "  in_reply_to TEXT,"
        "  folder TEXT NOT NULL,"
        "  category TEXT NOT NULL DEFAULT 'primary',"
        "  labels_json TEXT,"
        "  attachment_ids_json TEXT,"
        "  attachment_count INTEGER NOT NULL DEFAULT 0,"
        "  has_attachments INTEGER NOT NULL DEFAULT 0,"
        "  is_read INTEGER NOT NULL DEFAULT 0,"
        "  is_starred INTEGER NOT NULL DEFAULT 0,"
        "  is_pinned INTEGER NOT NULL DEFAULT 0,"
        "  is_deleted INTEGER NOT NULL DEFAULT 0,"
        "  is_encrypted INTEGER NOT NULL DEFAULT 0,"
        "  request_read_receipt INTEGER NOT NULL DEFAULT 0,"
        "  awaiting_reply INTEGER NOT NULL DEFAULT 0,"
        "  was_flattened INTEGER NOT NULL DEFAULT 0,"
        "  priority_score INTEGER NOT NULL DEFAULT 0,"
        "  priority_reasons_json TEXT,"
        "  threat_score INTEGER NOT NULL DEFAULT 0,"
        "  threat_findings_json TEXT,"
        "  auth_json TEXT,"
        "  search_tokens TEXT,"
        "  subject_tokens TEXT,"
        "  sender_tokens TEXT,"
        "  receipt_ids_json TEXT,"
        "  event_ids_json TEXT,"
        "  calendar_invitation_ids_json TEXT,"
        "  idempotency_key TEXT,"
        "  delivery_adapter TEXT,"
        "  send_result_status TEXT,"
        "  send_result_detail TEXT,"
        "  send_result_delivered INTEGER NOT NULL DEFAULT 0,"
        "  provider_message_id TEXT,"
        "  delivered_at INTEGER,"
        "  sent_at INTEGER NOT NULL DEFAULT 0,"
        "  created_at INTEGER NOT NULL DEFAULT 0,"
        "  updated_at INTEGER NOT NULL DEFAULT 0,"
        "  read_at INTEGER,"
        "  snoozed_until INTEGER,"
        "  schedule_at INTEGER,"
        "  recall_deadline INTEGER,"
        "  revision INTEGER NOT NULL DEFAULT 0,"
        "  last_writer TEXT,"
        "  deleted_at INTEGER,"
        "  ciphertext TEXT,"
        "  iv TEXT,"
        "  key_id TEXT,"
        "  has_pending_sync INTEGER NOT NULL DEFAULT 0"
        ")");

    statements << QStringLiteral(
        "CREATE TABLE IF NOT EXISTS threads ("
        "  id TEXT PRIMARY KEY,"
        "  owner_uid TEXT NOT NULL,"
        "  account_id TEXT NOT NULL,"
        "  subject TEXT,"
        "  message_count INTEGER NOT NULL DEFAULT 0,"
        "  unread_count INTEGER NOT NULL DEFAULT 0,"
        "  has_attachments INTEGER NOT NULL DEFAULT 0,"
        "  is_starred INTEGER NOT NULL DEFAULT 0,"
        "  is_pinned INTEGER NOT NULL DEFAULT 0,"
        "  labels_json TEXT,"
        "  category TEXT NOT NULL DEFAULT 'primary',"
        "  participants_json TEXT,"
        "  latest_message_id TEXT,"
        "  latest_at INTEGER NOT NULL DEFAULT 0,"
        "  oldest_at INTEGER NOT NULL DEFAULT 0,"
        "  priority_score INTEGER NOT NULL DEFAULT 0,"
        "  last_sender_address TEXT,"
        "  last_sender_name TEXT,"
        "  snippet TEXT,"
        "  revision INTEGER NOT NULL DEFAULT 0,"
        "  updated_at INTEGER NOT NULL DEFAULT 0,"
        "  deleted_at INTEGER"
        ")");

    statements << QStringLiteral(
        "CREATE TABLE IF NOT EXISTS labels ("
        "  id TEXT PRIMARY KEY,"
        "  name TEXT NOT NULL,"
        "  color TEXT,"
        "  kind TEXT NOT NULL DEFAULT 'user',"
        "  auto_filed INTEGER NOT NULL DEFAULT 0,"
        "  message_count INTEGER NOT NULL DEFAULT 0,"
        "  unread_count INTEGER NOT NULL DEFAULT 0,"
        "  sort_order INTEGER NOT NULL DEFAULT 0"
        ")");

    statements << QStringLiteral(
        "CREATE TABLE IF NOT EXISTS accounts ("
        "  id TEXT PRIMARY KEY,"
        "  owner_uid TEXT,"
        "  kind TEXT,"
        "  label TEXT,"
        "  address TEXT,"
        "  display_name TEXT,"
        "  reply_to TEXT,"
        "  color TEXT,"
        "  enabled INTEGER NOT NULL DEFAULT 1,"
        "  credential_id TEXT,"
        "  oauth_credential_id TEXT,"
        "  signature_id TEXT,"
        "  poll_interval_seconds INTEGER NOT NULL DEFAULT 120,"
        "  last_sync_at INTEGER,"
        "  last_sync_error TEXT,"
        "  config_json TEXT,"
        "  created_at INTEGER,"
        "  updated_at INTEGER"
        ")");

    statements << QStringLiteral(
        "CREATE TABLE IF NOT EXISTS pending_mutations ("
        "  mutation_id TEXT PRIMARY KEY,"
        "  collection TEXT NOT NULL,"
        "  doc_id TEXT NOT NULL,"
        "  op TEXT NOT NULL,"
        "  payload TEXT,"
        "  created_at INTEGER NOT NULL,"
        "  attempts INTEGER NOT NULL DEFAULT 0,"
        "  last_error TEXT"
        ")");

    statements << QStringLiteral(
        "CREATE TABLE IF NOT EXISTS drafts ("
        "  id TEXT PRIMARY KEY,"
        "  account_id TEXT,"
        "  draft_json TEXT NOT NULL,"
        "  updated_at INTEGER NOT NULL"
        ")");

    statements << QStringLiteral(
        "CREATE TABLE IF NOT EXISTS settings ("
        "  key TEXT PRIMARY KEY,"
        "  value TEXT"
        ")");

    statements << QStringLiteral(
        "CREATE VIRTUAL TABLE IF NOT EXISTS messages_fts USING fts5("
        "  message_id UNINDEXED,"
        "  subject,"
        "  body,"
        "  sender,"
        "  tokenize='porter unicode61 remove_diacritics 2'"
        ")");

    if (!db.transaction()) {
        setError(QStringLiteral("Could not start the cache schema transaction: %1").arg(db.lastError().text()));
        return false;
    }
    for (const QString &statement : std::as_const(statements)) {
        QSqlQuery query(db);
        if (!query.exec(statement)) {
            db.rollback();
            setError(QStringLiteral("Could not create the mail cache schema: %1").arg(query.lastError().text()));
            return false;
        }
    }
    if (!db.commit()) {
        setError(QStringLiteral("Could not commit the mail cache schema: %1").arg(db.lastError().text()));
        return false;
    }
    return true;
}

void MailCache::applyIndexes(QSqlDatabase &db)
{
    // Every index maps to a query that actually exists. A stray index would cost
    // a write on every document of every pull.
    const QStringList indexes = {
        QStringLiteral("CREATE INDEX IF NOT EXISTS idx_msg_folder_sent ON messages(folder, deleted_at, sent_at DESC)"),
        QStringLiteral("CREATE INDEX IF NOT EXISTS idx_msg_account_sent ON messages(account_id, sent_at DESC)"),
        QStringLiteral("CREATE INDEX IF NOT EXISTS idx_msg_thread ON messages(thread_id, sent_at ASC)"),
        QStringLiteral("CREATE INDEX IF NOT EXISTS idx_msg_priority ON messages(priority_score DESC, sent_at DESC)"),
        QStringLiteral("CREATE INDEX IF NOT EXISTS idx_msg_unread_folder ON messages(folder, is_read, deleted_at)"),
        QStringLiteral("CREATE INDEX IF NOT EXISTS idx_msg_account_folder ON messages(account_id, folder, deleted_at)"),
        QStringLiteral("CREATE INDEX IF NOT EXISTS idx_msg_snooze ON messages(snoozed_until)"),
        QStringLiteral("CREATE INDEX IF NOT EXISTS idx_msg_schedule ON messages(schedule_at)"),
        QStringLiteral("CREATE INDEX IF NOT EXISTS idx_msg_recall ON messages(recall_deadline)"),
        QStringLiteral("CREATE INDEX IF NOT EXISTS idx_msg_idem ON messages(idempotency_key)"),
        QStringLiteral("CREATE INDEX IF NOT EXISTS idx_thr_account ON threads(account_id, latest_at DESC)"),
        QStringLiteral("CREATE INDEX IF NOT EXISTS idx_thr_unread ON threads(unread_count)"),
        QStringLiteral("CREATE INDEX IF NOT EXISTS idx_mut_created ON pending_mutations(created_at ASC)"),
        QStringLiteral("CREATE INDEX IF NOT EXISTS idx_lbl_order ON labels(sort_order)"),
    };
    for (const QString &statement : indexes) {
        QSqlQuery query(db);
        if (!query.exec(statement))
            qWarning() << "[MailCache] index creation failed:" << query.lastError().text();
    }
}

bool MailCache::withTransaction(const QString &connectionName,
                                const std::function<bool(QSqlDatabase &)> &body,
                                QString *errorOut)
{
    QSqlDatabase db = connection(connectionName);
    if (!db.isOpen()) {
        if (errorOut) *errorOut = QStringLiteral("The mail cache is not open.");
        return false;
    }
    if (!db.transaction()) {
        if (errorOut) *errorOut = db.lastError().text();
        return false;
    }
    if (body(db)) {
        if (!db.commit()) {
            if (errorOut) *errorOut = db.lastError().text();
            return false;
        }
        return true;
    }
    db.rollback();
    if (errorOut && errorOut->isEmpty()) *errorOut = QStringLiteral("The operation was rejected by the mail cache.");
    return false;
}

/* ========================================================================== */
/* Messages                                                                   */
/* ========================================================================== */

namespace {

/** Full column list for `readMessageRow`. Never `*`: order changes break names. */
const char *MessageColumns =
    "id, owner_uid, account_id, thread_id, thread_subject, thread_message_count, subject, snippet, "
    "from_address, from_name, to_json, cc_json, bcc_json, reply_to_json, body_text, body_html, raw_source, "
    "raw_bytes, internet_message_id, references_json, in_reply_to, folder, category, labels_json, "
    "attachment_ids_json, attachment_count, has_attachments, is_read, is_starred, is_pinned, is_deleted, "
    "is_encrypted, request_read_receipt, awaiting_reply, was_flattened, priority_score, priority_reasons_json, "
    "threat_score, threat_findings_json, auth_json, search_tokens, subject_tokens, sender_tokens, "
    "receipt_ids_json, event_ids_json, calendar_invitation_ids_json, idempotency_key, delivery_adapter, "
    "send_result_status, send_result_detail, send_result_delivered, provider_message_id, delivered_at, "
    "sent_at, created_at, updated_at, read_at, snoozed_until, schedule_at, recall_deadline, revision, "
    "last_writer, deleted_at, ciphertext, iv, key_id, has_pending_sync";

} // namespace

/** Binds one message to a prepared `INSERT OR REPLACE`. */
static void bindMessage(QSqlQuery &query, const MailMessageData &message, bool pendingFlag)
{
    const QVariantList values = {
        message.id, message.ownerUid, message.accountId, message.threadId, message.threadSubject,
        message.threadMessageCount, message.subject, message.snippet,
        message.from.address, message.from.name,
        encodeAddresses(message.to), encodeAddresses(message.cc), encodeAddresses(message.bcc),
        encodeAddresses(message.replyTo),
        message.bodyText, message.bodyHtml, message.rawSource, message.rawBytes,
        message.internetMessageId, encodeArray(message.references), message.inReplyTo,
        folderName(message.folder), categoryName(message.category), encodeArray(message.labels),
        encodeArray(message.attachmentIds), message.attachmentSummaries.size(),
        boolToInt(!message.attachmentSummaries.isEmpty()),
        boolToInt(message.isRead), boolToInt(message.isStarred), boolToInt(message.isPinned),
        boolToInt(message.isDeleted), boolToInt(message.isEncrypted), boolToInt(message.requestReadReceipt),
        boolToInt(message.awaitingReply), boolToInt(message.wasFlattened),
        message.priorityScore, encodeArray(message.priorityReasons),
        message.threatScore, encodeArray(message.threatFindings),
        QString::fromUtf8(QJsonDocument(QJsonObject::fromVariantMap(message.auth.toVariant())).toJson(QJsonDocument::Compact)),
        QString(), QString(), QString(),
        encodeArray(message.receiptIds), encodeArray(message.eventIds), encodeArray(message.calendarInvitationIds),
        message.idempotencyKey, message.deliveryAdapter, message.sendResultStatus, message.sendResultDetail,
        boolToInt(message.sendResultDelivered), message.providerMessageId, message.deliveredAt,
        message.sentAt, message.createdAt, message.updatedAt, message.readAt,
        message.snoozedUntil, message.scheduleAt, message.recallDeadline,
        message.revision, message.lastWriter, message.deletedAt,
        message.ciphertext, message.iv, message.keyId,
        boolToInt(pendingFlag),
    };
    for (const QVariant &value : values)
        query.addBindValue(value);
}

static const char *MessageInsertStatement =
    "INSERT OR REPLACE INTO messages ("
    "id, owner_uid, account_id, thread_id, thread_subject, thread_message_count, subject, snippet, "
    "from_address, from_name, to_json, cc_json, bcc_json, reply_to_json, body_text, body_html, raw_source, "
    "raw_bytes, internet_message_id, references_json, in_reply_to, folder, category, labels_json, "
    "attachment_ids_json, attachment_count, has_attachments, is_read, is_starred, is_pinned, is_deleted, "
    "is_encrypted, request_read_receipt, awaiting_reply, was_flattened, priority_score, priority_reasons_json, "
    "threat_score, threat_findings_json, auth_json, search_tokens, subject_tokens, sender_tokens, "
    "receipt_ids_json, event_ids_json, calendar_invitation_ids_json, idempotency_key, delivery_adapter, "
    "send_result_status, send_result_detail, send_result_delivered, provider_message_id, delivered_at, "
    "sent_at, created_at, updated_at, read_at, snoozed_until, schedule_at, recall_deadline, revision, "
    "last_writer, deleted_at, ciphertext, iv, key_id, has_pending_sync) "
    "VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,"
    "?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)";

bool MailCache::upsertMessage(const MailMessageData &message)
{
    return upsertMessages({ message });
}

bool MailCache::upsertMessages(const QList<MailMessageData> &messages)
{
    if (messages.isEmpty()) return true;

    QString failure;
    const bool ok = withTransaction(QString(), [&](QSqlDatabase &db) {
        QSqlQuery insert(db);
        insert.prepare(QString::fromLatin1(MessageInsertStatement));
        QSqlQuery ftsDelete(db);
        ftsDelete.prepare(QStringLiteral("DELETE FROM messages_fts WHERE message_id = ?"));
        QSqlQuery ftsInsert(db);
        ftsInsert.prepare(QStringLiteral(
            "INSERT INTO messages_fts (message_id, subject, body, sender) VALUES (?, ?, ?, ?)"));

        for (const MailMessageData &message : messages) {
            bindMessage(insert, message, false);
            if (!insert.exec()) {
                failure = QStringLiteral("message %1: %2").arg(message.id, insert.lastError().text());
                return false;
            }

            // The FTS row is rebuilt from scratch on every upsert: an
            // append-style UPDATE would leave the previous body indexed and the
            // search would return a message whose text it no longer contains.
            ftsDelete.addBindValue(message.id);
            ftsDelete.exec();
            ftsDelete.finish();

            const QString body = message.isEncrypted
                ? QString()
                : (message.bodyText.isEmpty() ? message.bodyHtml : message.bodyText);
            ftsInsert.addBindValue(message.id);
            ftsInsert.addBindValue(message.isEncrypted ? QString() : message.subject);
            ftsInsert.addBindValue(body);
            ftsInsert.addBindValue(message.from.address + QLatin1Char(' ') + message.from.name);
            if (!ftsInsert.exec()) {
                failure = QStringLiteral("search index for %1: %2").arg(message.id, ftsInsert.lastError().text());
                return false;
            }
            ftsInsert.finish();
        }
        return true;
    }, &failure);

    if (!ok)
        setError(failure);

    emit messagesChanged();
    emit countsChanged();
    emit threadsChanged();
    return ok;
}

bool MailCache::loadMessage(const QString &id, MailMessageData *out) const
{
    if (!out || !m_open) return false;
    QSqlQuery query(m_db);
    query.prepare(QStringLiteral("SELECT %1 FROM messages WHERE id = ?").arg(QLatin1String(MessageColumns)));
    query.addBindValue(id);
    if (!query.exec() || !query.next()) return false;
    *out = readMessageRow(query);
    return true;
}

QString MailCache::rawSource(const QString &id) const
{
    if (!m_open) return {};
    QSqlQuery query(m_db);
    query.prepare(QStringLiteral("SELECT raw_source FROM messages WHERE id = ?"));
    query.addBindValue(id);
    if (!query.exec() || !query.next()) return {};
    return query.value(0).toString();
}

MessagePage MailCache::queryMessages(const MessageQuery &query) const
{
    MessagePage page;
    if (!m_open) return page;

    QStringList where;
    QVariantList binds;

    where << QStringLiteral("deleted_at IS NULL");
    where << QStringLiteral("folder = ?");
    binds << folderName(query.folder);

    if (!query.accountId.isEmpty()) {
        where << QStringLiteral("account_id = ?");
        binds << query.accountId;
    }
    if (query.unreadOnly) where << QStringLiteral("is_read = 0");
    if (query.starredOnly) where << QStringLiteral("is_starred = 1");
    if (query.pinnedOnly) where << QStringLiteral("is_pinned = 1");
    if (query.hasAttachmentsOnly) where << QStringLiteral("has_attachments = 1");
    if (query.useCategory) {
        where << QStringLiteral("category = ?");
        binds << categoryName(query.category);
    }

    if (!query.labelId.isEmpty()) {
        // Labels are stored as a JSON array; the LIKE is anchored on the exact
        // quoted element so `work` cannot match `homework`.
        where << QStringLiteral("(labels_json = ? OR labels_json LIKE ? OR labels_json LIKE ? OR labels_json LIKE ?)");
        binds << QStringLiteral("[\"%1\"]").arg(query.labelId)
              << QStringLiteral("[\"%1\",*").arg(query.labelId)
              << QStringLiteral("*,\"%1\"]").arg(query.labelId)
              << QStringLiteral("*,\"%1\",*").arg(query.labelId);
    }

    const QString clause = where.isEmpty() ? QString() : QStringLiteral(" WHERE ") + where.join(QStringLiteral(" AND "));

    // Count first, because the pager needs the total and `LIMIT` on the count
    // query would make it a count of the page rather than of the mailbox.
    QSqlQuery countQuery(m_db);
    countQuery.prepare(QStringLiteral("SELECT COUNT(*), SUM(CASE WHEN is_read = 0 THEN 1 ELSE 0 END) FROM messages")
                           + clause);
    for (const QVariant &bind : binds) countQuery.addBindValue(bind);
    if (countQuery.exec() && countQuery.next()) {
        page.totalMatching = countQuery.value(0).toInt();
        page.unreadMatching = countQuery.value(1).toInt();
    }

    QStringList order;
    if (query.priorityOrder)
        order << QStringLiteral("priority_score DESC") << QStringLiteral("sent_at DESC") << QStringLiteral("id DESC");
    else if (query.ascOrder)
        order << QStringLiteral("sent_at ASC") << QStringLiteral("id ASC");
    else
        order << QStringLiteral("is_pinned DESC") << QStringLiteral("sent_at DESC") << QStringLiteral("id DESC");

    QSqlQuery listQuery(m_db);
    listQuery.prepare(QStringLiteral("SELECT %1 FROM messages%2 ORDER BY %3 LIMIT ? OFFSET ?")
                          .arg(QLatin1String(MessageColumns), clause, order.join(QStringLiteral(", "))));
    for (const QVariant &bind : binds) listQuery.addBindValue(bind);
    listQuery.addBindValue(query.limit);
    listQuery.addBindValue(query.offset);

    if (!listQuery.exec()) {
        setError(QStringLiteral("queryMessages failed: %1").arg(listQuery.lastError().text()));
        return page;
    }

    while (listQuery.next()) {
        const MailMessageData message = readMessageRow(listQuery);
        MessageListRow row;
        row.id = message.id;
        row.accountId = message.accountId;
        row.threadId = message.threadId;
        row.subject = message.subject;
        row.snippet = message.snippet;
        row.senderName = message.from.name;
        row.senderAddress = message.from.address;
        row.folder = message.folder;
        row.category = message.category;
        row.isRead = message.isRead;
        row.isStarred = message.isStarred;
        row.isPinned = message.isPinned;
        row.isEncrypted = message.isEncrypted;
        row.attachmentCount = message.attachmentSummaries.size();
        row.hasAttachments = row.attachmentCount > 0;
        row.messageCount = message.threadMessageCount;
        row.priorityScore = message.priorityScore;
        row.threatScore = message.threatScore;
        row.sentAt = message.sentAt;
        row.snoozedUntil = message.snoozedUntil;
        row.scheduleAt = message.scheduleAt;
        row.recallDeadline = message.recallDeadline;
        row.labels = message.labels;
        page.rows.append(row);
    }

    // Account colour drives the unified-inbox dot; it is joined here rather than
    // denormalised onto the message so recolouring an account re-tints instantly.
    if (!m_db.isOpen()) return page;
    QSqlQuery colourQuery(m_db);
    if (colourQuery.exec(QStringLiteral("SELECT id, color FROM accounts"))) {
        QHash<QString, QString> colours;
        while (colourQuery.next())
            colours.insert(colourQuery.value(0).toString(), colourQuery.value(1).toString());
        for (MessageListRow &row : page.rows)
            row.accountColor = colours.value(row.accountId);
    }
    return page;
}

QStringList MailCache::threadMessageIds(const QString &threadId) const
{
    QStringList out;
    if (!m_open) return out;
    QSqlQuery query(m_db);
    query.prepare(QStringLiteral("SELECT id FROM messages WHERE thread_id = ? AND deleted_at IS NULL ORDER BY sent_at ASC"));
    query.addBindValue(threadId);
    if (!query.exec()) return out;
    while (query.next()) out.append(query.value(0).toString());
    return out;
}

QList<MailMessageData> MailCache::threadMessages(const QString &threadId) const
{
    QList<MailMessageData> out;
    if (!m_open) return out;
    QSqlQuery query(m_db);
    query.prepare(QStringLiteral("SELECT %1 FROM messages WHERE thread_id = ? AND deleted_at IS NULL ORDER BY sent_at ASC")
                      .arg(QLatin1String(MessageColumns)));
    query.addBindValue(threadId);
    if (!query.exec()) return out;
    while (query.next()) out.append(readMessageRow(query));
    return out;
}

/* ========================================================================== */
/* Optimistic local changes                                                   */
/* ========================================================================== */

/**
 * Columns a client is allowed to change optimistically.
 *
 * Anything outside this set is server-owned (see `SERVER_OWNED_FIELDS` in
 * `schema.ts`) and is rejected here rather than queued, because the push would
 * be stripped anyway and the user would watch their change silently revert on
 * the next pull.
 */
static const QSet<QString> &clientWritableMessageFields()
{
    static const QSet<QString> fields = {
        QStringLiteral("isRead"), QStringLiteral("isStarred"), QStringLiteral("isPinned"),
        QStringLiteral("folder"), QStringLiteral("labels"), QStringLiteral("category"),
        QStringLiteral("snoozedUntil"), QStringLiteral("scheduleAt"),
        QStringLiteral("readAt"), QStringLiteral("requestReadReceipt"),
        QStringLiteral("awaitingReply"), QStringLiteral("deletedAt"),
    };
    return fields;
}

bool MailCache::applyLocalPatch(const QString &collection, const QString &docId,
                                const QVariantMap &fields, QString *errorOut)
{
    if (collection != QLatin1String("messages")) {
        if (errorOut)
            *errorOut = QStringLiteral("Optimistic patches are only defined for messages, not %1.").arg(collection);
        return false;
    }

    // Map the camelCase the UI uses onto the snake_case column names.
    static const QHash<QString, QString> columnFor = {
        { QStringLiteral("isRead"), QStringLiteral("is_read") },
        { QStringLiteral("isStarred"), QStringLiteral("is_starred") },
        { QStringLiteral("isPinned"), QStringLiteral("is_pinned") },
        { QStringLiteral("folder"), QStringLiteral("folder") },
        { QStringLiteral("labels"), QStringLiteral("labels_json") },
        { QStringLiteral("category"), QStringLiteral("category") },
        { QStringLiteral("snoozedUntil"), QStringLiteral("snoozed_until") },
        { QStringLiteral("scheduleAt"), QStringLiteral("schedule_at") },
        { QStringLiteral("readAt"), QStringLiteral("read_at") },
        { QStringLiteral("requestReadReceipt"), QStringLiteral("request_read_receipt") },
        { QStringLiteral("awaitingReply"), QStringLiteral("awaiting_reply") },
        { QStringLiteral("deletedAt"), QStringLiteral("deleted_at") },
    };

    for (auto it = fields.constBegin(); it != fields.constEnd(); ++it) {
        if (!clientWritableMessageFields().contains(it.key())) {
            if (errorOut)
                *errorOut = QStringLiteral(
                                "\"%1\" is a server-owned field. The client may only change read/star/pin/folder/label "
                                "state, and the server would reject this patch on push.")
                                .arg(it.key());
            return false;
        }
    }

    QStringList assignments;
    QVariantList binds;
    for (auto it = fields.constBegin(); it != fields.constEnd(); ++it) {
        const QString column = columnFor.value(it.key());
        if (column.isEmpty()) continue;
        assignments << QStringLiteral("%1 = ?").arg(column);

        const QVariant &value = it.value();
        if (column.endsWith(QLatin1String("_json")))
            binds << (value.canConvert<QStringList>() ? encodeArray(value.toStringList())
                                                      : encodeArray(QStringList{ value.toString() }));
        else if (column == QLatin1String("folder"))
            binds << folderName(folderFromName(value.toString()));
        else if (column == QLatin1String("category"))
            binds << categoryName(categoryFromName(value.toString()));
        else if (column == QLatin1String("is_read") || column == QLatin1String("is_starred")
                 || column == QLatin1String("is_pinned") || column == QLatin1String("request_read_receipt")
                 || column == QLatin1String("awaiting_reply"))
            binds << boolToInt(value.toBool());
        else
            binds << value;
    }
    if (assignments.isEmpty()) {
        if (errorOut) *errorOut = QStringLiteral("No recognised fields to change.");
        return false;
    }

    // The mutation is prepared from the *same* field set that is written locally,
    // so what the user sees and what the server will receive cannot drift.
    QJsonObject payload;
    for (auto it = fields.constBegin(); it != fields.constEnd(); ++it)
        payload.insert(it.key(), QJsonValue::fromVariant(it.value()));
    if (fields.contains(QStringLiteral("folder")))
        payload.insert(QStringLiteral("folder"), folderName(folderFromName(fields.value(QStringLiteral("folder")).toString())));

    PendingMutation mutation;
    mutation.mutationId = QStringLiteral("mut_%1_%2").arg(docId, QString::number(QDateTime::currentMSecsSinceEpoch()));
    mutation.collection = collection;
    mutation.docId = docId;
    mutation.operation = QStringLiteral("set");
    mutation.payloadJson = QString::fromUtf8(QJsonDocument(payload).toJson(QJsonDocument::Compact));
    mutation.createdAt = QDateTime::currentMSecsSinceEpoch();

    QString failure;
    const bool ok = withTransaction(QString(), [&](QSqlDatabase &db) {
        QSqlQuery update(db);
        const QString sql = QStringLiteral("UPDATE messages SET %1, updated_at = ?, has_pending_sync = 1 WHERE id = ?")
                                .arg(assignments.join(QStringLiteral(", ")));
        update.prepare(sql);
        for (const QVariant &bind : binds) update.addBindValue(bind);
        update.addBindValue(QDateTime::currentMSecsSinceEpoch());
        update.addBindValue(docId);
        if (!update.exec()) {
            failure = update.lastError().text();
            return false;
        }
        if (update.numRowsAffected() == 0) {
            failure = QStringLiteral("No cached message with id %1.").arg(docId);
            return false;
        }

        QSqlQuery queue(db);
        queue.prepare(QStringLiteral(
            "INSERT OR REPLACE INTO pending_mutations "
            "(mutation_id, collection, doc_id, op, payload, created_at, attempts, last_error) "
            "VALUES (?, ?, ?, ?, ?, ?, 0, '')"));
        queue.addBindValue(mutation.mutationId);
        queue.addBindValue(mutation.collection);
        queue.addBindValue(mutation.docId);
        queue.addBindValue(mutation.operation);
        queue.addBindValue(mutation.payloadJson);
        queue.addBindValue(mutation.createdAt);
        return queue.exec();
    }, &failure);

    if (!ok && errorOut) *errorOut = failure;
    if (ok) {
        emit messagesChanged();
        emit countsChanged();
        emit pendingMutationsChanged();
    }
    return ok;
}

bool MailCache::moveMessage(const QString &id, Folder target)
{
    QVariantMap patch;
    patch.insert(QStringLiteral("folder"), folderName(target));
    if (target != Folder::Inbox)
        patch.insert(QStringLiteral("snoozedUntil"), 0);
    if (target == Folder::Inbox || target == Folder::Archive)
        patch.insert(QStringLiteral("deletedAt"), 0);
    return applyLocalPatch(QStringLiteral("messages"), id, patch);
}

bool MailCache::deleteMessage(const QString &id)
{
    QVariantMap patch;
    patch.insert(QStringLiteral("deletedAt"), QDateTime::currentMSecsSinceEpoch());
    return applyLocalPatch(QStringLiteral("messages"), id, patch);
}

bool MailCache::restoreMessage(const QString &id)
{
    QVariantMap patch;
    patch.insert(QStringLiteral("deletedAt"), 0);
    patch.insert(QStringLiteral("folder"), folderName(Folder::Inbox));
    return applyLocalPatch(QStringLiteral("messages"), id, patch);
}

/* ========================================================================== */
/* Threads                                                                    */
/* ========================================================================== */

static const char *ThreadColumns =
    "id, owner_uid, account_id, subject, message_count, unread_count, has_attachments, is_starred, "
    "is_pinned, labels_json, category, participants_json, latest_message_id, latest_at, oldest_at, "
    "priority_score, last_sender_address, last_sender_name, snippet, revision, updated_at, deleted_at";

static void bindThread(QSqlQuery &query, const MailThreadData &thread)
{
    const QVariantList values = {
        thread.id, thread.ownerUid, thread.accountId, thread.subject, thread.messageCount,
        thread.unreadCount, boolToInt(thread.hasAttachments), boolToInt(thread.isStarred),
        boolToInt(thread.isPinned), encodeArray(thread.labels), categoryName(thread.category),
        encodeAddresses(thread.participants), thread.latestMessageId, thread.latestAt, thread.oldestAt,
        thread.priorityScore, thread.lastSenderAddress, thread.lastSenderName, thread.snippet,
        thread.revision, thread.updatedAt, thread.deletedAt,
    };
    for (const QVariant &value : values) query.addBindValue(value);
}

static const char *ThreadInsertStatement =
    "INSERT OR REPLACE INTO threads (id, owner_uid, account_id, subject, message_count, unread_count, "
    "has_attachments, is_starred, is_pinned, labels_json, category, participants_json, latest_message_id, "
    "latest_at, oldest_at, priority_score, last_sender_address, last_sender_name, snippet, revision, "
    "updated_at, deleted_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)";

static MailThreadData readThreadRow(const QSqlQuery &query)
{
    const QSqlRecord record = query.record();
    auto str = [&record, &query](const char *name) {
        const int column = record.indexOf(QLatin1String(name));
        return column < 0 ? QString() : query.value(column).toString();
    };
    auto num = [&record, &query](const char *name) {
        const int column = record.indexOf(QLatin1String(name));
        return column < 0 ? qint64(0) : query.value(column).toLongLong();
    };
    auto num32 = [&record, &query](const char *name) {
        const int column = record.indexOf(QLatin1String(name));
        return column < 0 ? 0 : query.value(column).toInt();
    };
    auto flag = [&record, &query](const char *name) {
        const int column = record.indexOf(QLatin1String(name));
        return column >= 0 && query.value(column).toBool();
    };

    MailThreadData thread;
    thread.id = str("id");
    thread.ownerUid = str("owner_uid");
    thread.accountId = str("account_id");
    thread.subject = str("subject");
    thread.messageCount = num32("message_count");
    thread.unreadCount = num32("unread_count");
    thread.hasAttachments = flag("has_attachments");
    thread.isStarred = flag("is_starred");
    thread.isPinned = flag("is_pinned");
    thread.labels = decodeStringList(str("labels_json"));
    thread.category = categoryFromName(str("category"));
    thread.participants = decodeAddresses(str("participants_json"));
    thread.latestMessageId = str("latest_message_id");
    thread.latestAt = num("latest_at");
    thread.oldestAt = num("oldest_at");
    thread.priorityScore = num32("priority_score");
    thread.lastSenderAddress = str("last_sender_address");
    thread.lastSenderName = str("last_sender_name");
    thread.snippet = str("snippet");
    thread.revision = num("revision");
    thread.updatedAt = num("updated_at");
    thread.deletedAt = num("deleted_at");
    return thread;
}

bool MailCache::upsertThread(const MailThreadData &thread)
{
    return upsertThreads({ thread });
}

bool MailCache::upsertThreads(const QList<MailThreadData> &threads)
{
    if (threads.isEmpty()) return true;
    QString failure;
    const bool ok = withTransaction(QString(), [&](QSqlDatabase &db) {
        QSqlQuery query(db);
        query.prepare(QString::fromLatin1(ThreadInsertStatement));
        for (const MailThreadData &thread : threads) {
            bindThread(query, thread);
            if (!query.exec()) {
                failure = query.lastError().text();
                return false;
            }
            query.finish();
        }
        return true;
    }, &failure);

    if (!ok) setError(failure);
    emit threadsChanged();
    return ok;
}

bool MailCache::loadThread(const QString &id, MailThreadData *out) const
{
    if (!out || !m_open) return false;
    QSqlQuery query(m_db);
    query.prepare(QStringLiteral("SELECT %1 FROM threads WHERE id = ?").arg(QLatin1String(ThreadColumns)));
    query.addBindValue(id);
    if (!query.exec() || !query.next()) return false;
    *out = readThreadRow(query);
    return true;
}

/**
 * Recomputes a thread row from every live message in it.
 *
 * The counts are derived rather than incremented. Incrementing a counter
 * produces drift the first time two surfaces write concurrently, and a folder
 * badge that disagrees with the list is the sort of bug that erodes trust in
 * the whole application.
 */
bool MailCache::rebuildThread(const QString &threadId)
{
    const QList<MailMessageData> members = threadMessages(threadId);
    if (members.isEmpty()) {
        QSqlQuery deleteQuery(m_db);
        deleteQuery.prepare(QStringLiteral("DELETE FROM threads WHERE id = ?"));
        deleteQuery.addBindValue(threadId);
        const bool removed = deleteQuery.exec();
        if (removed) emit threadsChanged();
        return removed;
    }

    MailThreadData thread;
    thread.id = threadId;
    const MailMessageData &first = members.first();
    const MailThreadData &latest = members.last();

    thread.ownerUid = first.ownerUid;
    thread.accountId = latest.accountId;
    thread.subject = latest.threadSubject.isEmpty() ? latest.subject : latest.threadSubject;
    thread.messageCount = members.size();
    thread.oldestAt = first.sentAt;
    thread.latestAt = latest.sentAt;
    thread.latestMessageId = latest.id;
    thread.snippet = latest.snippet;
    thread.lastSenderAddress = latest.from.address;
    thread.lastSenderName = latest.from.name;
    thread.category = latest.category;
    thread.revision = std::max({ latest.revision, first.revision });
    thread.updatedAt = QDateTime::currentMSecsSinceEpoch();
    thread.deletedAt = 0;

    int unread = 0;
    bool hasAttachments = false;
    bool starred = false;
    bool pinned = false;
    int topPriority = 0;
    QSet<QString> labelSet;
    QList<MailAddress> participants;
    QSet<QString> seenParticipants;

    for (const MailMessageData &member : members) {
        if (!member.isRead) unread += 1;
        if (!member.attachmentSummaries.isEmpty()) hasAttachments = true;
        if (member.isStarred) starred = true;
        if (member.isPinned) pinned = true;
        topPriority = std::max(topPriority, member.priorityScore);
        for (const QString &label : member.labels) labelSet.insert(label);

        const QString key = member.from.address;
        if (!key.isEmpty() && !seenParticipants.contains(key)) {
            seenParticipants.insert(key);
            participants.append(member.from);
        }
    }

    thread.unreadCount = unread;
    thread.hasAttachments = hasAttachments;
    thread.isStarred = starred;
    thread.isPinned = pinned;
    thread.priorityScore = topPriority;
    thread.labels = QStringList(labelSet.begin(), labelSet.end());
    thread.participants = participants;

    return upsertThread(thread);
}

QList<MailThreadData> MailCache::queryThreads(Folder folder, const QString &accountId, int limit, int offset,
                                              bool unreadOnly, bool priorityOrder) const
{
    QList<MailThreadData> out;
    if (!m_open) return out;

    // A thread appears in a folder when any of its messages does. Restricting to
    // the *latest* message would hide a conversation the moment the reply went
    // to Sent, which is exactly when the user still wants to see it.
    QStringList where = {
        QStringLiteral("deleted_at IS NULL"),
        QStringLiteral("id IN (SELECT DISTINCT thread_id FROM messages WHERE folder = ? AND deleted_at IS NULL)"),
    };
    QVariantList binds;
    binds << folderName(folder);
    if (!accountId.isEmpty()) {
        where << QStringLiteral("account_id = ?");
        binds << accountId;
    }
    if (unreadOnly) where << QStringLiteral("unread_count > 0");

    const QString clause = QStringLiteral(" WHERE ") + where.join(QStringLiteral(" AND "));
    const QString order = priorityOrder ? QStringLiteral("priority_score DESC, latest_at DESC")
                                        : QStringLiteral("latest_at DESC, id DESC");

    QSqlQuery query(m_db);
    query.prepare(QStringLiteral("SELECT %1 FROM threads%2 ORDER BY %3 LIMIT ? OFFSET ?")
                      .arg(QLatin1String(ThreadColumns), clause, order));
    for (const QVariant &bind : binds) query.addBindValue(bind);
    query.addBindValue(limit);
    query.addBindValue(offset);

    if (!query.exec()) {
        setError(QStringLiteral("queryThreads failed: %1").arg(query.lastError().text()));
        return out;
    }
    while (query.next())
        out.append(readThreadRow(query));
    return out;
}

/* ========================================================================== */
/* Labels and accounts                                                        */
/* ========================================================================== */

bool MailCache::upsertLabel(const MailLabelData &label)
{
    if (!m_open) return false;
    QSqlQuery query(m_db);
    query.prepare(QStringLiteral(
        "INSERT OR REPLACE INTO labels (id, name, color, kind, auto_filed, message_count, unread_count, sort_order) "
        "VALUES (?, ?, ?, ?, ?, ?, ?, ?)"));
    query.addBindValue(label.id);
    query.addBindValue(label.name);
    query.addBindValue(label.color);
    query.addBindValue(label.kind);
    query.addBindValue(boolToInt(label.autoFiled));
    query.addBindValue(label.messageCount);
    query.addBindValue(label.unreadCount);
    query.addBindValue(label.order);
    const bool ok = query.exec();
    if (!ok) setError(query.lastError().text());
    emit labelsChanged();
    return ok;
}

QList<MailLabelData> MailCache::labels() const
{
    QList<MailLabelData> out;
    if (!m_open) return out;
    QSqlQuery query(m_db);
    if (!query.exec(QStringLiteral("SELECT id, name, color, kind, auto_filed, message_count, unread_count, sort_order "
                                   "FROM labels ORDER BY sort_order ASC, name ASC")))
        return out;
    while (query.next()) {
        MailLabelData label;
        label.id = query.value(0).toString();
        label.name = query.value(1).toString();
        label.color = query.value(2).toString();
        label.kind = query.value(3).toString();
        label.autoFiled = query.value(4).toBool();
        label.messageCount = query.value(5).toInt();
        label.unreadCount = query.value(6).toInt();
        label.order = query.value(7).toInt();
        out.append(label);
    }
    return out;
}

bool MailCache::upsertAccount(const MailAccountData &account)
{
    if (!m_open) return false;

    QJsonObject config;
    config.insert(QStringLiteral("imapHost"), account.imapHost);
    config.insert(QStringLiteral("imapPort"), account.imapPort);
    config.insert(QStringLiteral("imapSecurity"), account.imapSecurity);
    config.insert(QStringLiteral("smtpHost"), account.smtpHost);
    config.insert(QStringLiteral("smtpPort"), account.smtpPort);
    config.insert(QStringLiteral("smtpSecurity"), account.smtpSecurity);
    config.insert(QStringLiteral("username"), account.username);
    // An id, never a token. OAuth refresh tokens live in the vault only.
    if (!account.oauthCredentialId.isEmpty())
        config.insert(QStringLiteral("oauthCredentialId"), account.oauthCredentialId);

    QSqlQuery query(m_db);
    query.prepare(QStringLiteral(
        "INSERT OR REPLACE INTO accounts (id, owner_uid, kind, label, address, display_name, reply_to, color, "
        "enabled, credential_id, oauth_credential_id, signature_id, poll_interval_seconds, last_sync_at, "
        "last_sync_error, config_json, created_at, updated_at) "
        "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"));
    const QVariantList values = {
        account.id, account.ownerUid, account.kind, account.label, account.address, account.displayName,
        account.replyTo, account.color, boolToInt(account.enabled), account.credentialId,
        account.oauthCredentialId, account.signatureId, account.pollIntervalSeconds,
        account.lastSyncAt, account.lastSyncError,
        QString::fromUtf8(QJsonDocument(config).toJson(QJsonDocument::Compact)),
        account.createdAt, account.updatedAt,
    };
    for (const QVariant &value : values) query.addBindValue(value);

    const bool ok = query.exec();
    if (!ok) setError(query.lastError().text());
    emit accountsChanged();
    return ok;
}

QList<MailAccountData> MailCache::accounts() const
{
    QList<MailAccountData> out;
    if (!m_open) return out;
    QSqlQuery query(m_db);
    if (!query.exec(QStringLiteral("SELECT id, owner_uid, kind, label, address, display_name, reply_to, color, "
                                   "enabled, credential_id, oauth_credential_id, signature_id, "
                                   "poll_interval_seconds, last_sync_at, last_sync_error, config_json, "
                                   "created_at, updated_at FROM accounts ORDER BY created_at ASC")))
        return out;

    while (query.next()) {
        MailAccountData account;
        account.id = query.value(0).toString();
        account.ownerUid = query.value(1).toString();
        account.kind = query.value(2).toString();
        account.label = query.value(3).toString();
        account.address = query.value(4).toString();
        account.displayName = query.value(5).toString();
        account.replyTo = query.value(6).toString();
        account.color = query.value(7).toString();
        account.enabled = query.value(8).toBool();
        account.credentialId = query.value(9).toString();
        account.oauthCredentialId = query.value(10).toString();
        account.signatureId = query.value(11).toString();
        account.pollIntervalSeconds = query.value(12).toInt();
        account.lastSyncAt = query.value(13).toLongLong();
        account.lastSyncError = query.value(14).toString();

        const QJsonObject config = QJsonDocument::fromJson(query.value(15).toByteArray()).object();
        account.imapHost = config.value(QStringLiteral("imapHost")).toString();
        account.imapPort = config.value(QStringLiteral("imapPort")).toInt();
        account.imapSecurity = config.value(QStringLiteral("imapSecurity")).toString();
        account.smtpHost = config.value(QStringLiteral("smtpHost")).toString();
        account.smtpPort = config.value(QStringLiteral("smtpPort")).toInt();
        account.smtpSecurity = config.value(QStringLiteral("smtpSecurity")).toString();
        account.username = config.value(QStringLiteral("username")).toString();
        account.oauthCredentialId =
            config.value(QStringLiteral("oauthCredentialId")).toString(account.oauthCredentialId);

        account.createdAt = query.value(16).toLongLong();
        account.updatedAt = query.value(17).toLongLong();
        out.append(account);
    }
    return out;
}

MailAccountData MailCache::account(const QString &id) const
{
    const QList<MailAccountData> all = accounts();
    for (const MailAccountData &candidate : all)
        if (candidate.id == id)
            return candidate;
    return MailAccountData{};
}

/* ========================================================================== */
/* Counts                                                                     */
/* ========================================================================== */

FolderCounts MailCache::folderCounts(Folder folder, const QString &accountId) const
{
    FolderCounts counts;
    if (!m_open) return counts;

    QSqlQuery query(m_db);
    if (accountId.isEmpty())
        query.prepare(QStringLiteral(
            "SELECT COUNT(*), SUM(CASE WHEN is_read = 0 THEN 1 ELSE 0 END) "
            "FROM messages WHERE folder = ? AND deleted_at IS NULL"));
    else
        query.prepare(QStringLiteral(
            "SELECT COUNT(*), SUM(CASE WHEN is_read = 0 THEN 1 ELSE 0 END) "
            "FROM messages WHERE folder = ? AND deleted_at IS NULL AND account_id = ?"));

    query.addBindValue(folderName(folder));
    if (!accountId.isEmpty()) query.addBindValue(accountId);

    if (query.exec() && query.next()) {
        counts.total = query.value(0).toInt();
        counts.unread = query.value(1).isNull() ? 0 : query.value(1).toInt();
    }
    return counts;
}

FolderCounts MailCache::labelCounts(const QString &labelId) const
{
    FolderCounts counts;
    if (!m_open) return counts;

    QSqlQuery query(m_db);
    query.prepare(QStringLiteral(
        "SELECT COUNT(*), SUM(CASE WHEN is_read = 0 THEN 1 ELSE 0 END) FROM messages "
        "WHERE deleted_at IS NULL AND (labels_json = ? OR labels_json LIKE ? OR labels_json LIKE ? "
        "OR labels_json LIKE ?)"));
    query.addBindValue(QStringLiteral("[\"%1\"]").arg(labelId));
    query.addBindValue(QStringLiteral("[\"%1\",*").arg(labelId));
    query.addBindValue(QStringLiteral("*,\"%1\"]").arg(labelId));
    query.addBindValue(QStringLiteral("*,\"%1\",*").arg(labelId));

    if (query.exec() && query.next()) {
        counts.total = query.value(0).toInt();
        counts.unread = query.value(1).isNull() ? 0 : query.value(1).toInt();
    }
    return counts;
}

int MailCache::globalUnreadCount() const
{
    if (!m_open) return 0;
    QSqlQuery query(m_db);
    if (!query.exec(QStringLiteral(
            "SELECT COUNT(*) FROM messages WHERE deleted_at IS NULL AND is_read = 0 "
            "AND folder NOT IN ('archive','trash','spam')")))
        return 0;
    if (!query.next()) return 0;
    return query.value(0).toInt();
}

QVariantMap MailCache::unreadByAccount() const
{
    QVariantMap out;
    if (!m_open) return out;
    QSqlQuery query(m_db);
    if (!query.exec(QStringLiteral(
            "SELECT account_id, COUNT(*) FROM messages WHERE deleted_at IS NULL AND is_read = 0 "
            "AND folder NOT IN ('archive','trash','spam') GROUP BY account_id")))
        return out;
    while (query.next())
        out.insert(query.value(0).toString(), query.value(1).toInt());
    return out;
}

/* ========================================================================== */
/* Full-text search                                                           */
/* ========================================================================== */

/**
 * Builds a MATCH expression from user terms.
 *
 * Every term becomes `term*` so a partial word still finds something, and terms
 * are ANDed. Terms that would make FTS5 raise a parse error are dropped by
 * `normaliseTerms` first; if nothing survives, the caller gets an empty result
 * rather than an exception.
 */
static QString buildFtsQuery(const QString &terms)
{
    const QString normalised = normaliseTerms(terms);
    QStringList parts;
    for (const QString &token : normalised.split(QLatin1Char(' '), Qt::SkipEmptyParts)) {
        if (token.isEmpty()) continue;
        parts << QStringLiteral("\"%1\"*").arg(token.replace(QLatin1Char('"'), QString()));
    }
    if (parts.isEmpty()) return {};
    return parts.join(QStringLiteral(" AND "));
}

QList<SearchHit> MailCache::search(const QString &terms, const QStringList &folderFilter,
                                   const QString &accountId, int limit) const
{
    QList<SearchHit> out;
    if (!m_open) return out;

    const QString match = buildFtsQuery(terms);
    if (match.isEmpty()) return out;

    QStringList where = { QStringLiteral("m.deleted_at IS NULL") };
    QVariantList binds;
    binds << match;

    if (!folderFilter.isEmpty()) {
        QStringList quoted;
        for (const QString &folder : folderFilter) quoted << QStringLiteral("'") + folder + QStringLiteral("'");
        where << QStringLiteral("m.folder IN (%1)").arg(quoted.join(QStringLiteral(", ")));
    }
    if (!accountId.isEmpty()) {
        where << QStringLiteral("m.account_id = ?");
        binds << accountId;
    }

    QSqlQuery query(m_db);
    // `bm25()` ranks ascending (more negative is better), which is what the
    // `ORDER BY` direction below assumes. The snippet is generated by FTS5 so a
    // hit can be shown without loading the body it matched. The FTS table is
    // referenced unaliased because `MATCH`, `snippet()` and `highlight()` all
    // resolve the table name rather than a column list, and mixing the two forms
    // is a well-known source of "no such column" errors.
    query.prepare(QStringLiteral(
        "SELECT m.id, m.thread_id, m.account_id, m.sent_at, "
        "  snippet(messages_fts, 1, '<mark>', '</mark>', ' … ', 12), "
        "  highlight(messages_fts, 1, '<mark>', '</mark>'), bm25(messages_fts, 0.0, 4.0, 1.0, 2.0) AS score "
        "FROM messages_fts "
        "JOIN messages m ON m.id = messages_fts.message_id "
        "WHERE messages_fts MATCH ? AND " + where.join(QStringLiteral(" AND ")) +
            " ORDER BY score ASC, m.sent_at DESC LIMIT ?"));

    for (const QVariant &bind : binds) query.addBindValue(bind);
    query.addBindValue(limit);

    if (!query.exec()) {
        // A malformed MATCH is a user-input problem, not a fault: report it as an
        // empty result so the search box stays usable while they keep typing.
        if (query.lastError().text().contains(QLatin1String("fts5"), Qt::CaseInsensitive))
            return out;
        setError(QStringLiteral("search failed: %1").arg(query.lastError().text()));
        return out;
    }

    while (query.next()) {
        SearchHit hit;
        hit.messageId = query.value(0).toString();
        hit.threadId = query.value(1).toString();
        hit.accountId = query.value(2).toString();
        hit.snippet = query.value(3).toString();
        hit.highlightSubject = query.value(4).toString();
        hit.rank = query.value(5).toDouble();
        hit.sentAt = query.value(6).toLongLong();
        out.append(hit);
    }
    return out;
}

bool MailCache::reindexMessage(const MailMessageData &message)
{
    if (!m_open) return false;
    QSqlQuery remove(m_db);
    remove.prepare(QStringLiteral("DELETE FROM messages_fts WHERE message_id = ?"));
    remove.addBindValue(message.id);
    if (!remove.exec()) return false;

    QSqlQuery insert(m_db);
    insert.prepare(QStringLiteral(
        "INSERT INTO messages_fts (message_id, subject, body, sender) VALUES (?, ?, ?, ?)"));
    insert.addBindValue(message.id);
    // An encrypted message has no readable body locally. Indexing nothing is the
    // honest answer; indexing the ciphertext would return meaningless hits.
    insert.addBindValue(message.isEncrypted ? QString() : message.subject);
    insert.addBindValue(message.isEncrypted ? QString()
                                            : (message.bodyText.isEmpty() ? message.bodyHtml : message.bodyText));
    insert.addBindValue(message.from.address + QLatin1Char(' ') + message.from.name);
    return insert.exec();
}

int MailCache::reindexAll()
{
    if (!m_open) return -1;

    int count = 0;
    QString failure;
    const bool ok = withTransaction(QString(), [&](QSqlDatabase &db) {
        QSqlQuery clear(db);
        if (!clear.exec(QStringLiteral("DELETE FROM messages_fts"))) {
            failure = clear.lastError().text();
            return false;
        }

        QSqlQuery scan(db);
        if (!scan.exec(QStringLiteral("SELECT %1 FROM messages WHERE deleted_at IS NULL").arg(QLatin1String(MessageColumns)))) {
            failure = scan.lastError().text();
            return false;
        }
        while (scan.next()) {
            if (!reindexMessage(readMessageRow(scan))) {
                failure = QStringLiteral("Could not index a message during the rebuild.");
                return false;
            }
            count += 1;
        }
        return true;
    }, &failure);

    if (!ok) {
        setError(failure);
        return -1;
    }
    qInfo() << "[MailCache] reindexed" << count << "messages";
    return count;
}

/* ========================================================================== */
/* Pending mutation queue                                                     */
/* ========================================================================== */

bool MailCache::enqueueMutation(const PendingMutation &mutation)
{
    if (!m_open) return false;
    QSqlQuery query(m_db);
    query.prepare(QStringLiteral(
        "INSERT OR REPLACE INTO pending_mutations (mutation_id, collection, doc_id, op, payload, created_at, "
        "attempts, last_error) VALUES (?, ?, ?, ?, ?, ?, ?, ?)"));
    query.addBindValue(mutation.mutationId);
    query.addBindValue(mutation.collection);
    query.addBindValue(mutation.docId);
    query.addBindValue(mutation.operation);
    query.addBindValue(mutation.payloadJson);
    query.addBindValue(mutation.createdAt);
    query.addBindValue(mutation.attempts);
    query.addBindValue(mutation.lastError);
    const bool ok = query.exec();
    if (ok) emit pendingMutationsChanged();
    return ok;
}

QList<PendingMutation> MailCache::pendingMutations(int limit) const
{
    QList<PendingMutation> out;
    if (!m_open) return out;
    QSqlQuery query(m_db);
    query.prepare(QStringLiteral(
        "SELECT mutation_id, collection, doc_id, op, payload, created_at, attempts, last_error "
        "FROM pending_mutations ORDER BY created_at ASC LIMIT ?"));
    query.addBindValue(limit);
    if (!query.exec()) return out;
    while (query.next()) {
        PendingMutation mutation;
        mutation.mutationId = query.value(0).toString();
        mutation.collection = query.value(1).toString();
        mutation.docId = query.value(2).toString();
        mutation.operation = query.value(3).toString();
        mutation.payloadJson = query.value(4).toString();
        mutation.createdAt = query.value(5).toLongLong();
        mutation.attempts = query.value(6).toInt();
        mutation.lastError = query.value(7).toString();
        out.append(mutation);
    }
    return out;
}

int MailCache::pendingMutationCount() const
{
    if (!m_open) return 0;
    QSqlQuery query(m_db);
    if (!query.exec(QStringLiteral("SELECT COUNT(*) FROM pending_mutations"))) return 0;
    if (!query.next()) return 0;
    return query.value(0).toInt();
}

bool MailCache::acknowledgeMutations(const QStringList &mutationIds)
{
    if (mutationIds.isEmpty() || !m_open) return mutationIds.isEmpty();

    QString failure;
    const bool ok = withTransaction(QString(), [&](QSqlDatabase &db) {
        QSqlQuery remove(db);
        remove.prepare(QStringLiteral("DELETE FROM pending_mutations WHERE mutation_id = ?"));
        for (const QString &id : mutationIds) {
            remove.addBindValue(id);
            if (!remove.exec()) {
                failure = remove.lastError().text();
                return false;
            }
            remove.finish();
        }

        // A document can still have other mutations queued, so `has_pending_sync`
        // is recomputed rather than cleared wholesale.
        QSqlQuery recompute(db);
        if (!recompute.exec(QStringLiteral(
                "UPDATE messages SET has_pending_sync = CASE WHEN EXISTS ("
                "  SELECT 1 FROM pending_mutations p WHERE p.collection = 'messages' AND p.doc_id = messages.id)"
                " THEN 1 ELSE 0 END"))) {
            failure = recompute.lastError().text();
            return false;
        }
        return true;
    }, &failure);

    if (!ok) setError(failure);
    else emit pendingMutationsChanged();
    return ok;
}

bool MailCache::markMutationFailed(const QString &mutationId, const QString &error)
{
    if (!m_open) return false;
    QSqlQuery query(m_db);
    query.prepare(QStringLiteral("UPDATE pending_mutations SET attempts = attempts + 1, last_error = ? "
                                 "WHERE mutation_id = ?"));
    query.addBindValue(error.left(500));
    query.addBindValue(mutationId);
    const bool ok = query.exec();
    if (ok) emit pendingMutationsChanged();
    return ok;
}

/* ========================================================================== */
/* Drafts and settings                                                        */
/* ========================================================================== */

bool MailCache::saveDraft(const QString &draftId, const QVariantMap &draft)
{
    if (!m_open || draftId.isEmpty()) return false;
    QSqlQuery query(m_db);
    query.prepare(QStringLiteral("INSERT OR REPLACE INTO drafts (id, account_id, draft_json, updated_at) "
                                 "VALUES (?, ?, ?, ?)"));
    query.addBindValue(draftId);
    query.addBindValue(draft.value(QStringLiteral("accountId")).toString());
    query.addBindValue(QString::fromUtf8(QJsonDocument(QJsonObject::fromVariantMap(draft)).toJson(QJsonDocument::Compact)));
    query.addBindValue(QDateTime::currentMSecsSinceEpoch());
    return query.exec();
}

QVariantList MailCache::drafts(const QString &accountId) const
{
    QVariantList out;
    if (!m_open) return out;
    QSqlQuery query(m_db);
    if (accountId.isEmpty())
        query.prepare(QStringLiteral("SELECT id, draft_json, updated_at FROM drafts ORDER BY updated_at DESC"));
    else
        query.prepare(QStringLiteral("SELECT id, draft_json, updated_at FROM drafts WHERE account_id = ? "
                                     "ORDER BY updated_at DESC"));
    if (!accountId.isEmpty()) query.addBindValue(accountId);
    if (!query.exec()) return out;
    while (query.next()) {
        const QVariantMap map = QJsonDocument::fromJson(query.value(1).toByteArray()).object().toVariantMap();
        QVariantMap wrapper = map;
        wrapper.insert(QStringLiteral("id"), query.value(0).toString());
        wrapper.insert(QStringLiteral("updatedAt"), query.value(2).toLongLong());
        out.append(wrapper);
    }
    return out;
}

bool MailCache::deleteDraft(const QString &draftId)
{
    if (!m_open) return false;
    QSqlQuery query(m_db);
    query.prepare(QStringLiteral("DELETE FROM drafts WHERE id = ?"));
    query.addBindValue(draftId);
    return query.exec();
}

QVariantMap MailCache::settings() const
{
    QVariantMap out;
    if (!m_open) return out;
    QSqlQuery query(m_db);
    if (!query.exec(QStringLiteral("SELECT key, value FROM settings"))) return out;
    while (query.next()) {
        const QString value = query.value(1).toString();
        const QJsonDocument doc = QJsonDocument::fromJson(value.toUtf8());
        out.insert(query.value(0).toString(), doc.isArray() || doc.isObject() ? doc.toVariant() : value);
    }
    return out;
}

bool MailCache::saveSettings(const QVariantMap &settings)
{
    if (!m_open) return false;
    QString failure;
    const bool ok = withTransaction(QString(), [&](QSqlDatabase &db) {
        QSqlQuery query(db);
        query.prepare(QStringLiteral("INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)"));
        for (auto it = settings.constBegin(); it != settings.constEnd(); ++it) {
            const QJsonDocument doc = QJsonDocument::fromVariant(it.value());
            query.addBindValue(it.key());
            query.addBindValue(doc.isNull() ? it.value().toString()
                                            : QString::fromUtf8(doc.toJson(QJsonDocument::Compact)));
            if (!query.exec()) {
                failure = query.lastError().text();
                return false;
            }
            query.finish();
        }
        return true;
    }, &failure);
    if (!ok) setError(failure);
    return ok;
}

/* ========================================================================== */
/* Diagnostics                                                                */
/* ========================================================================== */

QVariantMap MailCache::stats() const
{
    QVariantMap out;
    out.insert(QStringLiteral("open"), m_open);
    out.insert(QStringLiteral("path"), m_path);
    out.insert(QStringLiteral("error"), m_error);
    out.insert(QStringLiteral("schemaRevision"), MAIL_NATIVE_SCHEMA_REVISION);
    if (!m_open) return out;

    auto scalar = [this](const QString &sql) -> QVariant {
        QSqlQuery query(m_db);
        if (!query.exec(sql) || !query.next()) return 0;
        return query.value(0);
    };

    out.insert(QStringLiteral("messages"), scalar(QStringLiteral("SELECT COUNT(*) FROM messages")));
    out.insert(QStringLiteral("unread"), scalar(QStringLiteral(
        "SELECT COUNT(*) FROM messages WHERE is_read = 0 AND deleted_at IS NULL "
        "AND folder NOT IN ('archive','trash','spam')")));
    out.insert(QStringLiteral("threads"), scalar(QStringLiteral("SELECT COUNT(*) FROM threads")));
    out.insert(QStringLiteral("labels"), scalar(QStringLiteral("SELECT COUNT(*) FROM labels")));
    out.insert(QStringLiteral("accounts"), scalar(QStringLiteral("SELECT COUNT(*) FROM accounts")));
    out.insert(QStringLiteral("drafts"), scalar(QStringLiteral("SELECT COUNT(*) FROM drafts")));
    out.insert(QStringLiteral("pendingMutations"), scalar(QStringLiteral("SELECT COUNT(*) FROM pending_mutations")));
    out.insert(QStringLiteral("searchIndexRows"), scalar(QStringLiteral("SELECT COUNT(*) FROM messages_fts")));
    out.insert(QStringLiteral("encryptedMessages"), scalar(QStringLiteral(
        "SELECT COUNT(*) FROM messages WHERE is_encrypted = 1")));

    const QFileInfo info(m_path);
    out.insert(QStringLiteral("sizeBytes"), info.exists() ? double(info.size()) : 0);
    return out;
}

/**
 * Drops every local row.
 *
 * Only `pending_mutations` is written aside first, because that is the only
 * table the server cannot recreate. A wipe that silently discarded a queued
 * offline send would be losing the user's work, which is not what "clear local
 * cache" is supposed to mean.
 */
bool MailCache::wipe()
{
    if (!m_open) return false;

    QString failure;
    const bool asideWritten = writePendingAside(m_path);
    const bool ok = withTransaction(QString(), [&](QSqlDatabase &db) {
        const QStringList tables = {
            QStringLiteral("messages"), QStringLiteral("threads"), QStringLiteral("labels"),
            QStringLiteral("accounts"), QStringLiteral("drafts"), QStringLiteral("settings"),
        };
        for (const QString &table : tables) {
            QSqlQuery query(db);
            if (!query.exec(QStringLiteral("DELETE FROM %1").arg(table))) {
                failure = query.lastError().text();
                return false;
            }
        }
        QSqlQuery fts(db);
        if (!fts.exec(QStringLiteral("DELETE FROM messages_fts"))) {
            failure = fts.lastError().text();
            return false;
        }
        return true;
    }, &failure);

    if (!ok) {
        setError(failure);
        return false;
    }
    if (asideWritten) restorePendingAside(m_path);

    emit messagesChanged();
    emit threadsChanged();
    emit labelsChanged();
    emit accountsChanged();
    emit countsChanged();
    return true;
}

} // namespace mail
} // namespace xakteir