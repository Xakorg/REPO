// HttpClient.h - the single HTTP egress point for VoltraMax.
//
// OWNERSHIP NOTE
// -------------
// This file is the platform-wide HTTP client. It is NOT part of Shared/mesh.
// The mesh transport is deliberately built with zero Qt and zero HTTP
// assumptions so that it can be lifted into the VoltraPlay kernel image
// unchanged; the mesh code must not depend on this class, and this class must
// not depend on the mesh code. The two share the repository, not the code.
//
// WHY THIS EXISTS
// ---------------
// VoltraMax is built as one monolithic VoltraOS binary. Every app that talks to
// the network (Drive, Mail, Chat, Store, Notes, Voltraclip, the account layer
// itself) needs the same four things, and every one of them is easy to get
// subtly wrong:
//
//   1. A bearer token that can expire mid-flight and must be refreshed once,
//      not once per call site.
//   2. Retries that back off properly and do not duplicate a non-idempotent
//      write.
//   3. ETags, because the sync engine cannot do conflict detection without
//      conditional requests.
//   4. Chunked / resumable uploads, because a 2 GB video will not survive a
//      single request with any reliability at all.
//
// Rather than let N apps each grow their own subtly different version of that,
// they all route through this class. It is deliberately the only place in the
// codebase that constructs a QNetworkAccessManager.
//
// HONESTY NOTE
// ------------
// This is a real HTTP client speaking real TLS to real endpoints. It is not a
// simulator and it does not fabricate responses. If the network is down, a
// request fails; callers must handle failure and the UI must say so. Nothing in
// here ever returns synthetic data to make a screen look populated.

#ifndef VOLTRAMAX_HTTP_CLIENT_H
#define VOLTRAMAX_HTTP_CLIENT_H

#include <QObject>
#include <QByteArray>
#include <QDateTime>
#include <QHash>
#include <QJsonObject>
#include <QJsonDocument>
#include <QList>
#include <QMap>
#include <QNetworkAccessManager>
#include <QNetworkReply>
#include <QSet>
#include <QString>
#include <QStringList>
#include <QTimer>
#include <QUrl>

#include <functional>

// ---------------------------------------------------------------------------
// Request description
// ---------------------------------------------------------------------------

// Verb, reduced to the set VoltraMax actually needs. A raw QString is avoided
// so a typo becomes a compile error rather than a 405 at runtime.
enum class HttpVerb {
    Get,
    Head,
    Post,
    Put,
    Patch,
    Delete,
};

QString httpVerbToString(HttpVerb verb);

// Retry policy. Defaults are deliberately conservative: the sync engine is the
// hottest caller, and an aggressive retry policy turns a server-side rate limit
// into a self-inflicted denial of service.
struct HttpRetryPolicy {
    int maximumAttempts = 4;          // total attempts, including the first
    int baseDelayMs = 250;            // first backoff step
    int maximumDelayMs = 20000;       // ceiling for exponential growth
    double backoffMultiplier = 2.0;   // growth per attempt
    double jitterFraction = 0.25;     // +/- proportion, prevents thundering herd

    // Only these methods may be retried blindly. A POST that creates a document
    // must carry an idempotency key instead, which is why the client supports
    // one; without it, retrying a create is how you end up with three identical
    // notes after one flaky network.
    bool allowsBlindRetry(HttpVerb verb) const
    {
        switch (verb) {
        case HttpVerb::Get:
        case HttpVerb::Head:
            return true;
        case HttpVerb::Put:      // PUT is idempotent by definition
        case HttpVerb::Delete:   // deleting twice still leaves it deleted
            return true;
        case HttpVerb::Post:
        case HttpVerb::Patch:    // PATCH is not idempotent in general
            return false;
        }
        return false;
    }
};

// A response, fully materialised. The reply has already finished by the time
// callers see this, which keeps ownership simple: no dangling QNetworkReply.
struct HttpResponse {
    bool transportOk = false;      // false means the request never completed
    int statusCode = 0;            // 0 when transportOk is false
    QByteArray body;
    QMap<QString, QString> headers; // header names lower-cased
    QUrl effectiveUrl;
    QString transportError;        // human readable, safe to show in UI

    // Parsed body, or an undefined value when the body is not JSON. Real
    // servers do return HTML error pages, so this is genuinely nullable.
    QJsonObject jsonObject() const;
    QJsonDocument jsonDocument() const;

    bool isSuccess() const { return transportOk && statusCode >= 200 && statusCode < 300; }
    bool isClientError() const { return statusCode >= 400 && statusCode < 500; }
    bool isServerError() const { return statusCode >= 500 && statusCode < 600; }
    // 429 plus the 5xx family: the two cases where waiting is the right move.
    bool isRetryableStatus() const { return statusCode == 429 || isServerError(); }
    bool isRateLimited() const { return statusCode == 429; }

    QString header(const QString &name) const { return headers.value(name.toLower()); }

    // Honour a Retry-After expressed either as seconds or as an HTTP date.
    // Returns milliseconds to wait, or -1 when absent or unparseable.
    int retryAfterMs(const QDateTime &now) const;
};

// HttpResponse is carried across a signal, so Qt's queued-connection machinery
// needs to know how to copy it. Declaring the metatype is what makes a queued
// emission legal; the constructor registers it with the meta-type system at
// runtime. Both halves are required - declaring without registering is silently
// broken for queued connections.
Q_DECLARE_METATYPE(HttpResponse)
Q_DECLARE_METATYPE(HttpVerb)

// ---------------------------------------------------------------------------
// HttpClient
// ---------------------------------------------------------------------------

class HttpClient : public QObject
{
    Q_OBJECT

    // Base URL for the VoltraMax backend. Every relative path resolves against it.
    Q_PROPERTY(QString baseUrl READ baseUrl WRITE setBaseUrl NOTIFY configurationChanged)
    Q_PROPERTY(bool online READ online NOTIFY connectivityChanged)
    Q_PROPERTY(QString userAgent READ userAgent CONSTANT)
    Q_PROPERTY(QString platformTag READ platformTag CONSTANT)

public:
    explicit HttpClient(QObject *parent = nullptr);
    ~HttpClient() override;

    QString baseUrl() const { return m_baseUrl; }
    void setBaseUrl(const QString &baseUrl);

    // VoltraMax identifies itself honestly: it is a desktop client, and the
    // backend needs to know that so it can gate features per platform.
    QString userAgent() const;
    QString platformTag() const;

    // Reachability as far as this class can tell. Note the honest limit: this is
    // derived from real request outcomes, not an ICMP probe, because ICMP is
    // routinely blocked and would report false negatives. It is also optimistic
    // - a captive portal looks reachable, which is why callers must treat a
    // 4xx/5xx as "not usable" rather than consulting only this flag.
    bool online() const { return m_online; }

    // -----------------------------------------------------------------------
    // Token supply
    //
    // The client never owns the credential. It asks this provider and gets
    // either a token or an empty string meaning "send unauthenticated". That
    // keeps the account layer as the single owner of refresh logic and stops
    // tokens from leaking into unrelated code.
    // -----------------------------------------------------------------------
    void setTokenProvider(std::function<QString()> provider);
    void setTokenRefreshProvider(std::function<bool()> refresher);
    bool hasToken() const { return m_tokenProvider && !m_tokenProvider().isEmpty(); }

    // -----------------------------------------------------------------------
    // Basic requests
    //
    // Each returns a QNetworkReply* that the caller owns and must eventually
    // delete. The client's own finished() signal is emitted before the reply is
    // torn down, so a handler connected to it may delete the reply safely.
    // Returns nullptr when the URL itself is invalid - a programming error, not
    // a network condition, and never papered over with a fake reply.
    // -----------------------------------------------------------------------
    QNetworkReply *request(HttpVerb verb,
                          const QString &path,
                          const QByteArray &body = QByteArray(),
                          const QString &contentType = QStringLiteral("application/json"),
                          const QMap<QString, QString> &headers = QMap<QString, QString>(),
                          HttpRetryPolicy policy = HttpRetryPolicy(),
                          // A caller-supplied tag echoed back on HttpClient::finished().
                          // Several subsystems share this one client, and matching on the
                          // URL to guess who a response belongs to breaks the moment two
                          // endpoints share a path.
                          const QString &context = QString());

    QNetworkReply *get(const QString &path,
                       const QMap<QString, QString> &headers = QMap<QString, QString>());
    QNetworkReply *post(const QString &path, const QJsonObject &body,
                        const QMap<QString, QString> &headers = QMap<QString, QString>());
    QNetworkReply *post(const QString &path, const QByteArray &body,
                        const QString &contentType,
                        const QMap<QString, QString> &headers = QMap<QString, QString>());
    QNetworkReply *put(const QString &path, const QJsonObject &body,
                       const QMap<QString, QString> &headers = QMap<QString, QString>());
    QNetworkReply *patch(const QString &path, const QJsonObject &body,
                         const QMap<QString, QString> &headers = QMap<QString, QString>());
    QNetworkReply *del(const QString &path,
                       const QMap<QString, QString> &headers = QMap<QString, QString>());

    // -----------------------------------------------------------------------
    // Conditional requests
    //
    // The sync engine cannot detect a conflict without these. The backend
    // returns an ETag on every document read and honours If-Match on writes; a
    // stale ETag produces a 412, which is a *conflict*, not a failure, and must
    // reach the conflict resolver rather than being retried.
    // -----------------------------------------------------------------------
    QNetworkReply *getWithEtag(const QString &path,
                               const QString &knownEtag,
                               const QMap<QString, QString> &headers = QMap<QString, QString>());
    QNetworkReply *putIfMatch(const QString &path, const QJsonObject &body,
                              const QString &knownEtag,
                              const QMap<QString, QString> &headers = QMap<QString, QString>());

    // -----------------------------------------------------------------------
    // Blocking convenience wrapper
    //
    // For the places that genuinely cannot be asynchronous (flushing an outbox
    // during shutdown, a startup reachability probe). It runs a nested event
    // loop and is flagged as such; nothing on a user-visible UI path should
    // call it. For UI work prefer the asynchronous form.
    // -----------------------------------------------------------------------
    HttpResponse requestBlocking(HttpVerb verb,
                                const QString &path,
                                const QByteArray &body = QByteArray(),
                                const QString &contentType = QStringLiteral("application/json"),
                                const QMap<QString, QString> &headers = QMap<QString, QString>(),
                                int timeoutMs = 30000);

    // -----------------------------------------------------------------------
    // Multipart form upload, for endpoints that want a plain multipart body.
    // -----------------------------------------------------------------------
    QNetworkReply *postMultipart(const QString &path,
                                 const QMap<QString, QString> &fields,
                                 const QMap<QString, QByteArray> &files,
                                 const QString &boundary = QString(),
                                 const QMap<QString, QString> &headers = QMap<QString, QString>());

    // Exposed because several callers need to build a body once and then send it
    // with different headers.
    static QByteArray buildMultipartBody(const QMap<QString, QString> &fields,
                                         const QMap<QString, QByteArray> &files,
                                         const QString &boundary,
                                         QString *contentTypeOut);

    // -----------------------------------------------------------------------
    // Resumable upload
    //
    // Large payloads (a Voltraclip master video, a Drive attachment) are sent in
    // chunks with a real Content-Range, per RFC 7233. The session survives a
    // process restart because the offset and upload id are exposed for the
    // caller to persist, so an interrupted 2 GB upload continues instead of
    // restarting from zero.
    // -----------------------------------------------------------------------
    class UploadSession;
    UploadSession *beginResumableUpload(const QString &path,
                                        const QString &contentType,
                                        qint64 totalBytes,
                                        QObject *parent = nullptr);

signals:
    void finished(const HttpResponse &response, const QString &context);
    void progress(qint64 sent, qint64 total);
    void connectivityChanged(bool online);
    void configurationChanged();
    // Emitted when a request is retried, so the sync engine can log it and the
    // UI can show a "reconnecting" state instead of an indefinite spinner.
    void retrying(const QString &url, int attempt, int delayMs, const QString &reason);
    // Emitted once per 401 that the token provider successfully refreshed, so the
    // account layer can log an actual refresh rather than a silent retry.
    void tokenRefreshed();

private:
    friend class UploadSession;

    // Attempt-tracking variant of request(), used by the retry machinery to
    // replay a request with an incremented attempt counter and the original
    // context preserved.
    QNetworkReply *request(HttpVerb verb,
                          const QString &urlString,
                          const QByteArray &body,
                          const QString &contentType,
                          const QMap<QString, QString> &headers,
                          const HttpRetryPolicy &policy,
                          int attempt,
                          const QString &context);

    QNetworkRequest buildRequest(HttpVerb verb, const QString &urlString) const;
    QUrl resolveUrl(const QString &path) const;
    void applyDefaultHeaders(QNetworkRequest &request) const;

    // Watches a reply. On failure decides whether to retry, and either
    // schedules a replay or finalises and emits finished().
    void track(QNetworkReply *reply,
               HttpVerb verb,
               const QString &urlString,
               const QByteArray &body,
               const QString &contentType,
               const QMap<QString, QString> &headers,
               const HttpRetryPolicy &policy,
               int attempt,
               const QString &context);

    int computeBackoffMs(const HttpRetryPolicy &policy, int attempt) const;
    void emitFinished(QNetworkReply *reply, const QString &context);
    void noteTransportOutcome(bool ok);
    QMap<QString, QString> collectHeaders(QNetworkReply *reply) const;
    void forget(QNetworkReply *reply);

private:
    QNetworkAccessManager *m_manager;
    QString m_baseUrl;
    std::function<QString()> m_tokenProvider;
    std::function<bool()> m_tokenRefreshProvider;

    bool m_online = true;
    int m_consecutiveFailures = 0;
    // After this many failures in a row we report offline, because a UI that
    // keeps claiming "connected" while every request fails is lying.
    static constexpr int kFailureThresholdForOffline = 3;

    // Per-reply bookkeeping. A QMap keyed on the reply pointer rather than a
    // heap allocation per request: the state is small, and owning it by value
    // means there is nothing to leak when a reply is destroyed without finishing.
    QMap<QNetworkReply *, HttpRetryPolicy> m_policies;
    QMap<QNetworkReply *, int> m_attempts;
    QMap<QNetworkReply *, QString> m_urls;
    QMap<QNetworkReply *, QString> m_contexts;
    QMap<QNetworkReply *, HttpVerb> m_verbs;
};

#endif // VOLTRAMAX_HTTP_CLIENT_H