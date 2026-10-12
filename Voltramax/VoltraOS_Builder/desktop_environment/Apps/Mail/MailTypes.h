#ifndef MAILTYPES_H
#define MAILTYPES_H

/**
 * ============================================================================
 * XAKTEIR MAIL - SHARED RECORD CONTRACT (NATIVE)
 * ============================================================================
 *
 * This header is the C++ mirror of `src/lib/mail/types.ts`. It exists so the
 * web client, the sync route and this desktop app agree on one wire shape.
 *
 * WHY A HAND-WRITTEN MIRROR
 * -------------------------
 * There is no code generation step in this build: CMake compiles the desktop
 * environment and Next.js compiles the web app from separate roots, and adding
 * a shared schema generator to both would be more machinery than the contract
 * justifies. Instead:
 *
 *   - `MAIL_SCHEMA_REVISION` in `types.ts` is the source of truth. It is 3.
 *   - `MAIL_NATIVE_SCHEMA_REVISION` here must equal it. `MailEngine` refuses to
 *     open a cache whose revision disagrees, which is how a desync becomes a
 *     loud error instead of a subtle one.
 *   - `docs` comments are copied, not paraphrased, so a reader can diff the two.
 *
 * WHAT IS DELIBERATELY ABSENT
 * ---------------------------
 * No secrets. `MailAccount::credentialId` is an *id*, and the value lives in the
 * shared Xakteir vault (see `MailVaultClient`). A struct that could carry an
 * IMAP password would eventually end up in a `qDebug()` line.
 *
 * No behaviour. Everything here is POD plus `QVariant`-convertible accessors,
 * so `MailMessageModel` can hand a row to QML without a conversion layer and
 * `MailSyncWorker` can serialise it to JSON without a second type graph.
 */

#include <QByteArray>
#include <QDateTime>
#include <QJsonArray>
#include <QJsonObject>
#include <QList>
#include <QSet>
#include <QString>
#include <QStringList>
#include <QVariant>
#include <QVariantMap>

#include <utility>

namespace xakteir {
namespace mail {

/** Must match `MAIL_SCHEMA_REVISION` exported by `src/lib/mail/index.ts`. */
constexpr int MAIL_NATIVE_SCHEMA_REVISION = 3;

/** Product string written into outgoing MIME and generated .ics files. */
constexpr const char *MAIL_PRODID = "-//Xakteir//Xakteir Mail 1.0//EN";

/** The account-scoped Firestore root: `users/{uid}/mail/...`. */
constexpr const char *MAIL_ROOT = "mail";

/* ------------------------------------------------------------------------- */
/* Enumerations                                                               */
/* ------------------------------------------------------------------------- */

/** Physical mailbox. Stored as `folder` on the message document. */
enum class Folder {
    Inbox,
    Sent,
    Drafts,
    Archive,
    Spam,
    Trash,
    Outbox,
    Snoozed,
    Scheduled
};

inline QString folderName(Folder folder)
{
    switch (folder) {
    case Folder::Inbox:     return QStringLiteral("inbox");
    case Folder::Sent:      return QStringLiteral("sent");
    case Folder::Drafts:    return QStringLiteral("drafts");
    case Folder::Archive:   return QStringLiteral("archive");
    case Folder::Spam:      return QStringLiteral("spam");
    case Folder::Trash:     return QStringLiteral("trash");
    case Folder::Outbox:    return QStringLiteral("outbox");
    case Folder::Snoozed:   return QStringLiteral("snoozed");
    case Folder::Scheduled: return QStringLiteral("scheduled");
    }
    return QStringLiteral("inbox");
}

inline Folder folderFromName(const QString &name)
{
    if (name == QLatin1String("sent")) return Folder::Sent;
    if (name == QLatin1String("drafts")) return Folder::Drafts;
    if (name == QLatin1String("archive")) return Folder::Archive;
    if (name == QLatin1String("spam")) return Folder::Spam;
    if (name == QLatin1String("trash")) return Folder::Trash;
    if (name == QLatin1String("outbox")) return Folder::Outbox;
    if (name == QLatin1String("snoozed")) return Folder::Snoozed;
    if (name == QLatin1String("scheduled")) return Folder::Scheduled;
    return Folder::Inbox;
}

/** `inbox`-tab style folding. Mirrors `MailCategory` in `types.ts`. */
enum class Category { Primary, Social, Promotions, Notifications, Finance, Updates, Travel };

inline QString categoryName(Category category)
{
    switch (category) {
    case Category::Primary:       return QStringLiteral("primary");
    case Category::Social:        return QStringLiteral("social");
    case Category::Promotions:    return QStringLiteral("promotions");
    case Category::Notifications: return QStringLiteral("notifications");
    case Category::Finance:       return QStringLiteral("finance");
    case Category::Updates:       return QStringLiteral("updates");
    case Category::Travel:        return QStringLiteral("travel");
    }
    return QStringLiteral("primary");
}

inline Category categoryFromName(const QString &name)
{
    if (name == QLatin1String("social")) return Category::Social;
    if (name == QLatin1String("promotions")) return Category::Promotions;
    if (name == QLatin1String("notifications")) return Category::Notifications;
    if (name == QLatin1String("finance")) return Category::Finance;
    if (name == QLatin1String("updates")) return Category::Updates;
    if (name == QLatin1String("travel")) return Category::Travel;
    return Category::Primary;
}

/** RFC 8601 authentication verdict. Mirrors `AuthVerdict`. */
enum class Verdict { Pass, Fail, SoftFail, Neutral, None, Tempered, Unknown };

inline QString verdictName(Verdict verdict)
{
    switch (verdict) {
    case Verdict::Pass:     return QStringLiteral("pass");
    case Verdict::Fail:     return QStringLiteral("fail");
    case Verdict::SoftFail: return QStringLiteral("softfail");
    case Verdict::Neutral:  return QStringLiteral("neutral");
    case Verdict::None:     return QStringLiteral("none");
    case Verdict::Tempered: return QStringLiteral("tempered");
    case Verdict::Unknown:  return QStringLiteral("unknown");
    }
    return QStringLiteral("unknown");
}

inline Verdict verdictFromName(const QString &name)
{
    if (name == QLatin1String("pass")) return Verdict::Pass;
    if (name == QLatin1String("fail")) return Verdict::Fail;
    if (name == QLatin1String("softfail")) return Verdict::SoftFail;
    if (name == QLatin1String("neutral")) return Verdict::Neutral;
    if (name == QLatin1String("none")) return Verdict::None;
    if (name == QLatin1String("tempered")) return Verdict::Tempered;
    return Verdict::Unknown;
}

/** Which sync surface wrote a record. */
enum class Surface { Web, VoltraMax, VoltraPlay };

inline QString surfaceName(Surface surface)
{
    switch (surface) {
    case Surface::Web:        return QStringLiteral("web");
    case Surface::VoltraMax:  return QStringLiteral("voltramax");
    case Surface::VoltraPlay: return QStringLiteral("voltraplay");
    }
    return QStringLiteral("voltramax");
}

/** Transport outcome. Mirrors `MailSendResult["status"]`. */
enum class SendStatus { Queued, Sent, Failed, Deferred, Recalled };

inline QString sendStatusName(SendStatus status)
{
    switch (status) {
    case SendStatus::Queued:   return QStringLiteral("queued");
    case SendStatus::Sent:     return QStringLiteral("sent");
    case SendStatus::Failed:   return QStringLiteral("failed");
    case SendStatus::Deferred: return QStringLiteral("deferred");
    case SendStatus::Recalled: return QStringLiteral("recalled");
    }
    return QStringLiteral("failed");
}

inline SendStatus sendStatusFromName(const QString &name)
{
    if (name == QLatin1String("queued")) return SendStatus::Queued;
    if (name == QLatin1String("sent")) return SendStatus::Sent;
    if (name == QLatin1String("deferred")) return SendStatus::Deferred;
    if (name == QLatin1String("recalled")) return SendStatus::Recalled;
    return SendStatus::Failed;
}

/* ------------------------------------------------------------------------- */
/* Addresses                                                                  */
/* ------------------------------------------------------------------------- */

/**
 * Envelope address. `address` is always `local@domain` lowercased; `rawAddress`
 * preserves the local-part casing actually transmitted, so sent mail renders
 * the way it was written rather than the way it was stored.
 */
struct MailAddress {
    QString address;
    QString rawAddress;
    QString name;
    QString domain;

    QString display() const
    {
        if (name.isEmpty())
            return address;
        return QStringLiteral("%1 <%2>").arg(name, address);
    }

    QVariantMap toVariant() const
    {
        QVariantMap map;
        map.insert(QStringLiteral("address"), address);
        map.insert(QStringLiteral("rawAddress"), rawAddress.isEmpty() ? address : rawAddress);
        map.insert(QStringLiteral("name"), name);
        map.insert(QStringLiteral("domain"), domain);
        return map;
    }

    static MailAddress fromVariant(const QVariantMap &map)
    {
        MailAddress out;
        out.address = map.value(QStringLiteral("address")).toString().trimmed().toLower();
        out.rawAddress = map.value(QStringLiteral("rawAddress")).toString().trimmed();
        out.name = map.value(QStringLiteral("name")).toString();
        out.domain = map.value(QStringLiteral("domain")).toString();
        if (out.rawAddress.isEmpty())
            out.rawAddress = out.address;
        if (out.domain.isEmpty() && out.address.contains(QLatin1Char('@')))
            out.domain = out.address.mid(out.address.indexOf(QLatin1Char('@')) + 1).toLower();
        return out;
    }
};

inline QList<MailAddress> addressListFromVariant(const QVariantList &list)
{
    QList<MailAddress> out;
    out.reserve(list.size());

    // De-duplicated by address: `To:` lists routinely repeat an address that
    // appears in both a `To:` and a `Cc:`, and the wire contract stores each
    // recipient exactly once.
    QSet<QString> seen;
    for (const QVariant &entry : list) {
        const MailAddress address = MailAddress::fromVariant(entry.toMap());
        if (address.address.isEmpty() || seen.contains(address.address))
            continue;
        seen.insert(address.address);
        out.append(address);
    }
    return out;
}

inline QVariantList addressListToVariant(const QList<MailAddress> &list)
{
    QVariantList out;
    out.reserve(list.size());
    for (const MailAddress &address : list)
        out.append(address.toVariant());
    return out;
}

/* ------------------------------------------------------------------------- */
/* Auth results                                                               */
/* ------------------------------------------------------------------------- */

/**
 * RFC 8601 verdicts as published by the receiving MTA.
 *
 * Native code never *computes* these from scratch for inbound mail: it parses
 * `Authentication-Results` / `Received-SPF` out of the headers it already has.
 * `Unknown` is therefore the honest default, never `Pass`.
 */
struct AuthResults {
    Verdict spf = Verdict::Unknown;
    Verdict dkim = Verdict::Unknown;
    Verdict dmarc = Verdict::Unknown;
    QString spfRecord;
    QString dkimDomain;
    QString dkimSelector;
    QString dmarcPolicy;
    bool reverseAlignment = false;
    bool alignedFromHost = false;

    QVariantMap toVariant() const
    {
        QVariantMap map;
        map.insert(QStringLiteral("spf"), verdictName(spf));
        map.insert(QStringLiteral("dkim"), verdictName(dkim));
        map.insert(QStringLiteral("dmarc"), verdictName(dmarc));
        if (!spfRecord.isEmpty()) map.insert(QStringLiteral("spfRecord"), spfRecord);
        if (!dkimDomain.isEmpty()) map.insert(QStringLiteral("dkimDomain"), dkimDomain);
        if (!dkimSelector.isEmpty()) map.insert(QStringLiteral("dkimSelector"), dkimSelector);
        if (!dmarcPolicy.isEmpty()) map.insert(QStringLiteral("dmarcPolicy"), dmarcPolicy);
        map.insert(QStringLiteral("reverseAlignment"), reverseAlignment);
        map.insert(QStringLiteral("alignedFromHost"), alignedFromHost);
        return map;
    }

    static AuthResults fromVariant(const QVariantMap &map)
    {
        AuthResults out;
        out.spf = verdictFromName(map.value(QStringLiteral("spf"), QStringLiteral("unknown")).toString());
        out.dkim = verdictFromName(map.value(QStringLiteral("dkim"), QStringLiteral("unknown")).toString());
        out.dmarc = verdictFromName(map.value(QStringLiteral("dmarc"), QStringLiteral("unknown")).toString());
        out.spfRecord = map.value(QStringLiteral("spfRecord")).toString();
        out.dkimDomain = map.value(QStringLiteral("dkimDomain")).toString();
        out.dkimSelector = map.value(QStringLiteral("dkimSelector")).toString();
        out.dmarcPolicy = map.value(QStringLiteral("dmarcPolicy")).toString();
        out.reverseAlignment = map.value(QStringLiteral("reverseAlignment")).toBool();
        out.alignedFromHost = map.value(QStringLiteral("alignedFromHost")).toBool();
        return out;
    }
};

/* ------------------------------------------------------------------------- */
/* Attachment                                                                 */
/* ------------------------------------------------------------------------- */

/**
 * One attachment record. `storagePath` is the Firebase Storage object; the
 * download URL is always derived, never stored, because a Storage download URL
 * is an unauthenticated bearer token that does not expire.
 */
struct AttachmentRef {
    QString id;
    QString messageId;
    QString storagePath;
    QString fileName;
    QString mimeType;
    qint64 sizeBytes = 0;
    QString contentId;
    QString sha256;
    qint64 uploadedAt = 0;
    int progress = 0;

    QVariantMap toVariant() const
    {
        QVariantMap map;
        map.insert(QStringLiteral("id"), id);
        map.insert(QStringLiteral("messageId"), messageId);
        map.insert(QStringLiteral("storagePath"), storagePath);
        map.insert(QStringLiteral("fileName"), fileName);
        map.insert(QStringLiteral("mimeType"), mimeType);
        map.insert(QStringLiteral("sizeBytes"), double(sizeBytes));
        map.insert(QStringLiteral("contentId"), contentId);
        map.insert(QStringLiteral("sha256"), sha256);
        map.insert(QStringLiteral("uploadedAt"), double(uploadedAt));
        map.insert(QStringLiteral("progress"), progress);
        return map;
    }

    static AttachmentRef fromVariant(const QVariantMap &map)
    {
        AttachmentRef out;
        out.id = map.value(QStringLiteral("id")).toString();
        out.messageId = map.value(QStringLiteral("messageId")).toString();
        out.storagePath = map.value(QStringLiteral("storagePath")).toString();
        out.fileName = map.value(QStringLiteral("fileName")).toString();
        out.mimeType = map.value(QStringLiteral("mimeType")).toString();
        out.sizeBytes = qint64(map.value(QStringLiteral("sizeBytes")).toDouble());
        out.contentId = map.value(QStringLiteral("contentId")).toString();
        out.sha256 = map.value(QStringLiteral("sha256")).toString();
        out.uploadedAt = qint64(map.value(QStringLiteral("uploadedAt")).toDouble());
        out.progress = map.value(QStringLiteral("progress")).toInt();
        return out;
    }
};

/* ------------------------------------------------------------------------- */
/* Message                                                                    */
/* ------------------------------------------------------------------------- */

/**
 * One stored message. Field-for-field with `MailMessage` in `types.ts`.
 *
 * The fields the sync route owns (`auth`, `threatScore`, `priorityScore`,
 * `searchTokens`, `snippet`, `threadId`, `revision`) are present here but are
 * only ever *read* by this app. `MailSyncWorker::pushMutation` never includes
 * them in a push body; the server strips them and rewrites its own values. That
 * restriction is enforced client-side too, because a client that pushes a field
 * it will always be rejected for produces a confusing retry loop.
 */
struct MailMessageData {
    QString id;
    QString ownerUid;

    /* envelope */
    QString accountId;
    QString subject;
    MailAddress from;
    QList<MailAddress> to;
    QList<MailAddress> cc;
    QList<MailAddress> bcc;
    QList<MailAddress> replyTo;
    Folder folder = Folder::Inbox;

    /* content */
    QString bodyText;
    QString bodyHtml;
    QString rawSource;
    qint64 rawSizeBytes = 0;
    qint64 rawBytes = 0;

    /* threading (RFC 5322 s3.6.4) */
    QString internetMessageId;
    QStringList references;
    QString inReplyTo;
    QString threadId;
    QString threadSubject;
    int threadMessageCount = 1;

    /* timestamps (epoch ms; 0 means "not set") */
    qint64 sentAt = 0;
    qint64 createdAt = 0;
    qint64 updatedAt = 0;
    qint64 readAt = 0;
    qint64 snoozedUntil = 0;
    qint64 scheduleAt = 0;
    qint64 recallDeadline = 0;

    /* classification */
    QStringList labels;
    Category category = Category::Primary;
    int priorityScore = 0;
    QStringList priorityReasons;

    /* security */
    AuthResults auth;
    int threatScore = 0;
    QStringList threatFindings;
    QString ciphertext;
    QString iv;
    QString keyId;

    /* attachments */
    QStringList attachmentIds;
    QList<AttachmentRef> attachmentSummaries;

    /* search */
    QString snippet;
    QStringList searchTokens;
    QStringList subjectTokens;
    QStringList senderTokens;

    /* receipts & events */
    QStringList receiptIds;
    QStringList eventIds;
    QStringList calendarInvitationIds;

    /* delivery bookkeeping */
    QString idempotencyKey;
    QString deliveryAdapter;
    QString sendResultStatus;
    QString sendResultDetail;
    bool sendResultDelivered = false;
    QString providerMessageId;
    qint64 deliveredAt = 0;

    /* flags */
    bool isRead = false;
    bool isStarred = false;
    bool isPinned = false;
    bool isDeleted = false;
    bool isEncrypted = false;
    bool requestReadReceipt = false;
    bool awaitingReply = false;
    bool wasFlattened = false;

    /* housekeeping */
    qint64 revision = 0;
    QString lastWriter;
    qint64 deletedAt = 0;

    bool isUnread() const { return !isRead; }
    bool isSnoozed() const { return snoozedUntil > 0; }
    bool isScheduled() const { return scheduleAt > 0; }
    bool isTombstoned() const { return deletedAt > 0; }

    /** Deterministic ordering used by every list: newest first, id as tiebreak. */
    bool newerThan(const MailMessageData &other) const
    {
        if (sentAt != other.sentAt)
            return sentAt > other.sentAt;
        return id > other.id;
    }
};

/* ------------------------------------------------------------------------- */
/* Thread                                                                     */
/* ------------------------------------------------------------------------- */

/** Denormalised conversation row so the list needs no client-side stitching. */
struct MailThreadData {
    QString id;
    QString ownerUid;
    QString accountId;
    QString subject;
    int messageCount = 0;
    int unreadCount = 0;
    bool hasAttachments = false;
    bool isStarred = false;
    bool isPinned = false;
    QStringList labels;
    Category category = Category::Primary;
    QList<MailAddress> participants;
    QString latestMessageId;
    qint64 latestAt = 0;
    qint64 oldestAt = 0;
    int priorityScore = 0;
    QString lastSenderAddress;
    QString lastSenderName;
    QString snippet;
    qint64 revision = 0;
    qint64 updatedAt = 0;
    qint64 deletedAt = 0;

    bool newerThan(const MailThreadData &other) const
    {
        if (latestAt != other.latestAt)
            return latestAt > other.latestAt;
        return id > other.id;
    }
};

/* ------------------------------------------------------------------------- */
/* Account & label                                                            */
/* ------------------------------------------------------------------------- */

/**
 * A sending identity. `credentialId` is an id into the shared Xakteir vault;
 * this struct never carries the secret itself.
 */
struct MailAccountData {
    QString id;
    QString ownerUid;
    QString kind;      // "xakteir" | "imap" | "smtp-relay" | "gmail-oauth"
    QString label;
    QString address;
    QString displayName;
    QString replyTo;
    QString color;
    bool enabled = true;
    QString credentialId;
    QString oauthCredentialId;
    QString signatureId;
    int pollIntervalSeconds = 120;
    qint64 lastSyncAt = 0;
    QString lastSyncError;

    /* Endpoint config. Secrets are NOT here - they come from the vault. */
    QString imapHost;
    int imapPort = 0;
    QString imapSecurity;
    QString smtpHost;
    int smtpPort = 0;
    QString smtpSecurity;
    QString username;

    qint64 createdAt = 0;
    qint64 updatedAt = 0;
};

/** A folder or label shown in the sidebar. */
struct MailLabelData {
    QString id;
    QString name;
    QString color;
    QString kind;      // "system" | "user"
    bool autoFiled = false;
    int messageCount = 0;
    int unreadCount = 0;
    int order = 0;
};

/* ------------------------------------------------------------------------- */
/* Envelope limits                                                            */
/* ------------------------------------------------------------------------- */

/**
 * Hard caps. These are duplicated from `schema.ts` because a limit enforced
 * only by the server would let the native client build a message the sync route
 * silently rejects, and the user would see a failed send with no reason.
 */
struct MailLimits {
    static constexpr int MaxRecipientsPerMessage = 100;
    static constexpr int MaxAttachmentsPerMessage = 25;
    static constexpr qint64 MaxAttachmentBytes = 25ll * 1024 * 1024;
    static constexpr int MaxSubjectLength = 998;
    static constexpr qint64 MaxBodyBytes = 2ll * 1024 * 1024;
    static constexpr int MaxMutationsPerPush = 400;
    static constexpr int MaxRules = 200;
    static constexpr int MaxLabels = 200;
    static constexpr int MaxPullPage = 400;
};

/**
 * Raised for anything the client can catch before hitting the wire. Kept
 * distinct from an I/O error so the UI can tell "your subject is too long" from
 * "the network is down" without string matching.
 */
class MailValidationException
{
public:
    explicit MailValidationException(QString field, QString message)
        : m_field(std::move(field)), m_message(std::move(message))
    {
    }

    QString field() const { return m_field; }
    QString message() const { return m_message; }

private:
    QString m_field;
    QString m_message;
};

} // namespace mail
} // namespace xakteir

#endif // MAILTYPES_H