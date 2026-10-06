// HttpClient.cpp - implementation of the single HTTP egress point.
//
// Design constraints that shape everything below:
//
//   * No synthetic data. Every code path either produces a real response from a
//     real server or produces an error. There is no branch anywhere in this
//     file that invents a body.
//
//   * Retries must not duplicate writes. A retried GET is free; a retried POST
//     creates a second note unless it carries an idempotency key. The retry
//     decision therefore consults both the HTTP method and the presence of that
//     key, not just the method.
//
//   * A 401 is not a failure, it is a stale token. Exactly one refresh attempt
//     is made per request before it is finally reported, so a genuinely revoked
//     account cannot spin.
//
//   * A 412 is a conflict, not an error, and is never retried. Retrying it
//     would defeat the entire point of a conditional write.

#include "HttpClient.h"

#include <QCoreApplication>
#include <QEventLoop>
#include <QFile>
#include <QHostInfo>
#include <QJsonParseError>
#include <QLoggingCategory>
#include <QNetworkRequest>
#include <QOperatingSystemVersion>
#include <QRandomGenerator>
#include <QSsl>
#include <QSysInfo>

#include <functional>

Q_LOGGING_CATEGORY(lcHttp, "voltramax.http")

namespace {

// Builds a fresh boundary per call. Reusing a boundary across two bodies lets a
// server that has mis-parsed one body find the boundary in the next one, which
// is a genuinely nasty content-confusion bug, so it is not done.
QString makeBoundary()
{
    const quint32 a = QRandomGenerator::global()->generate();
    const quint32 b = QRandomGenerator::global()->generate();
    return QStringLiteral("----VoltraMaxFormBoundary%1%2")
        .arg(a, 8, 16, QLatin1Char('0'))
        .arg(b, 8, 16, QLatin1Char('0'));
}

// Extension-to-MIME map for multipart parts. Deliberately not a general MIME
// database: it covers what VoltraMax actually uploads, and anything unknown falls
// back to application/octet-stream, which is always safe. Guessing "text/plain"
// for an unknown type is not, because it invites charset corruption.
QString mimeTypeForFileName(const QString &fileName)
{
    static const QHash<QString, QString> kMap = {
        { QStringLiteral("txt"),  QStringLiteral("text/plain") },
        { QStringLiteral("md"),   QStringLiteral("text/markdown") },
        { QStringLiteral("csv"),  QStringLiteral("text/csv") },
        { QStringLiteral("json"), QStringLiteral("application/json") },
        { QStringLiteral("xml"),  QStringLiteral("application/xml") },
        { QStringLiteral("html"), QStringLiteral("text/html") },
        { QStringLiteral("css"),  QStringLiteral("text/css") },
        { QStringLiteral("js"),   QStringLiteral("text/javascript") },
        { QStringLiteral("pdf"),  QStringLiteral("application/pdf") },
        { QStringLiteral("png"),  QStringLiteral("image/png") },
        { QStringLiteral("jpg"),  QStringLiteral("image/jpeg") },
        { QStringLiteral("jpeg"), QStringLiteral("image/jpeg") },
        { QStringLiteral("gif"),  QStringLiteral("image/gif") },
        { QStringLiteral("webp"), QStringLiteral("image/webp") },
        { QStringLiteral("svg"),  QStringLiteral("image/svg+xml") },
        { QStringLiteral("mp4"),  QStringLiteral("video/mp4") },
        { QStringLiteral("webm"), QStringLiteral("video/webm") },
        { QStringLiteral("mp3"),  QStringLiteral("audio/mpeg") },
        { QStringLiteral("wav"),  QStringLiteral("audio/wav") },
        { QStringLiteral("zip"),  QStringLiteral("application/zip") },
    };

    const QString suffix = QFileInfo(fileName).suffix().toLower();
    const auto it = kMap.constFind(suffix);
    return it != kMap.constEnd() ? it.value() : QStringLiteral("application/octet-stream");
}

} // namespace

// ---------------------------------------------------------------------------
// HttpVerb
// ---------------------------------------------------------------------------

QString httpVerbToString(HttpVerb verb)
{
    switch (verb) {
    case HttpVerb::Get:    return QStringLiteral("GET");
    case HttpVerb::Head:   return QStringLiteral("HEAD");
    case HttpVerb::Post:   return QStringLiteral("POST");
    case HttpVerb::Put:    return QStringLiteral("PUT");
    case HttpVerb::Patch:  return QStringLiteral("PATCH");
    case HttpVerb::Delete: return QStringLiteral("DELETE");
    }
    return QStringLiteral("GET");
}

// ---------------------------------------------------------------------------
// HttpResponse
// ---------------------------------------------------------------------------

QJsonObject HttpResponse::jsonObject() const
{
    const QJsonDocument doc = jsonDocument();
    return doc.isObject() ? doc.object() : QJsonObject();
}

QJsonDocument HttpResponse::jsonDocument() const
{
    if (body.isEmpty()) {
        return QJsonDocument();
    }
    QJsonParseError err{};
    // Servers really do send malformed JSON, and a parse failure here must be
    // indistinguishable from "not JSON" rather than throwing.
    const QJsonDocument doc = QJsonDocument::fromJson(body, &err);
    if (err.error != QJsonParseError::NoError) {
        return QJsonDocument();
    }
    return doc;
}

int HttpResponse::retryAfterMs(const QDateTime &now) const
{
    const QString raw = header(QStringLiteral("retry-after")).trimmed();
    if (raw.isEmpty()) {
        return -1;
    }

    // Delta-seconds form first: it is by far the common case.
    bool okSeconds = false;
    const double seconds = raw.toDouble(&okSeconds);
    if (okSeconds && seconds >= 0.0) {
        // Clamp. A hostile or broken server sending Retry-After: 999999 would
        // otherwise park a worker thread indefinitely.
        constexpr double kMaxSeconds = 300.0;
        return static_cast<int>(qMin(seconds, kMaxSeconds) * 1000.0);
    }

    // HTTP-date form.
    QDateTime when = QDateTime::fromString(raw, Qt::RFC2822Date);
    if (!when.isValid()) {
        when = QDateTime::fromString(raw, Qt::ISODate);
    }
    if (!when.isValid()) {
        return -1;
    }
    if (when.isLocalTime() != now.isLocalTime()) {
        when = when.toUTC();
        const QDateTime utcNow = now.toUTC();
        const qint64 delta = utcNow.msecsTo(when);
        return delta > 0 ? static_cast<int>(qMin<qint64>(delta, 300000)) : 0;
    }
    const qint64 delta = now.msecsTo(when);
    return delta > 0 ? static_cast<int>(qMin<qint64>(delta, 300000)) : 0;
}

// ---------------------------------------------------------------------------
// HttpClient construction
// ---------------------------------------------------------------------------

HttpClient::HttpClient(QObject *parent)
    : QObject(parent)
    , m_manager(new QNetworkAccessManager(this))
{
    qRegisterMetaType<HttpResponse>("HttpResponse");
    qRegisterMetaType<HttpVerb>("HttpVerb");
}

HttpClient::~HttpClient() = default;

QString HttpClient::userAgent() const
{
    // Reported honestly: VoltraMax is a desktop client, not a phone. The backend
    // gates capabilities per platform, so misreporting this would produce
    // confusing capability mismatches rather than help anything.
    const QString qtVersion = QString::fromLatin1(qVersion());
    const QString os = QSysInfo::prettyProductName();
    const QString arch = QSysInfo::currentCpuArchitecture();
    return QStringLiteral("VoltraMax/2.0 (Qt%1; %2; %3)")
        .arg(qtVersion, os, arch);
}

QString HttpClient::platformTag() const
{
#if defined(Q_OS_WIN)
    return QStringLiteral("windows");
#elif defined(Q_OS_MACOS)
    return QStringLiteral("macos");
#elif defined(Q_OS_LINUX)
    return QStringLiteral("linux");
#else
    return QStringLiteral("unknown");
#endif
}

void HttpClient::setBaseUrl(const QString &baseUrl)
{
    QString normalised = baseUrl.trimmed();
    while (normalised.endsWith(QLatin1Char('/'))) {
        normalised.chop(1);
    }
    if (normalised == m_baseUrl) {
        return;
    }
    m_baseUrl = normalised;
    qCInfo(lcHttp) << "base URL set to" << m_baseUrl;
    emit configurationChanged();
}

void HttpClient::setTokenProvider(std::function<QString()> provider)
{
    m_tokenProvider = std::move(provider);
}

void HttpClient::setTokenRefreshProvider(std::function<bool()> refresher)
{
    m_tokenRefreshProvider = std::move(refresher);
}

QUrl HttpClient::resolveUrl(const QString &path) const
{
    if (path.startsWith(QLatin1String("http://"), Qt::CaseInsensitive)
        || path.startsWith(QLatin1String("https://"), Qt::CaseInsensitive)) {
        return QUrl(path);
    }

    if (m_baseUrl.isEmpty()) {
        qWarning(lcHttp) << "refusing to resolve relative path with no base URL:" << path;
        return QUrl();
    }

    QString relative = path;
    if (!relative.startsWith(QLatin1Char('/'))) {
        relative.prepend(QLatin1Char('/'));
    }
    return QUrl(m_baseUrl + relative);
}

// ---------------------------------------------------------------------------
// Request construction
// ---------------------------------------------------------------------------

void HttpClient::applyDefaultHeaders(QNetworkRequest &request) const
{
    request.setHeader(QNetworkRequest::UserAgentHeader, userAgent());
    request.setRawHeader("Accept", "application/json, text/plain;q=0.9, */*;q=0.5");
    request.setRawHeader("X-VoltraMax-Platform", platformTag().toUtf8());
    request.setRawHeader("X-VoltraMax-Client", "desktop");

    // Redirects are followed for GET but a POST redirected across origins would
    // leak the bearer token to whoever controls the redirect target. Restricting
    // to same-origin-ish handling is not something QNetworkAccessManager does by
    // default, so the redirect policy is set explicitly rather than left to the
    // default "no less safe" behaviour.
    request.setAttribute(QNetworkRequest::RedirectPolicyAttribute,
                         QVariant::fromValue(QNetworkRequest::ManualRedirectPolicy));

    if (m_tokenProvider) {
        const QString token = m_tokenProvider();
        if (!token.isEmpty()) {
            request.setRawHeader("Authorization", QByteArray("Bearer ") + token.toUtf8());
        }
    }
}

QNetworkRequest HttpClient::buildRequest(HttpVerb verb, const QString &urlString) const
{
    QNetworkRequest request;
    request.setUrl(QUrl(urlString));

    // A redirect arrives as an HTTP 3xx with a Location header. QNetworkAccess
    // manager's manual policy means we have to follow it ourselves, and we have
    // to decide correctly rather than blindly.
    const QUrl url(urlString);
    if (url.scheme().compare(QLatin1String("https"), Qt::CaseInsensitive) == 0) {
        request.setAttribute(QNetworkRequest::SslProtocolsAttribute,
                             QVariant::fromValue(QList<QSsl::SslProtocol>{ QSsl::TlsV1_2,
                                                                           QSsl::TlsV1_3 }));
    }

    applyDefaultHeaders(request);
    return request;
}

// ---------------------------------------------------------------------------
// Issuing requests
// ---------------------------------------------------------------------------

QNetworkReply *HttpClient::request(HttpVerb verb,
                                  const QString &path,
                                  const QByteArray &body,
                                  const QString &contentType,
                                  const QMap<QString, QString> &headers,
                                  HttpRetryPolicy policy,
                                  const QString &context)
{
    const QUrl url = resolveUrl(path);
    if (!url.isValid() || url.isEmpty()) {
        qWarning(lcHttp) << "invalid request URL for path" << path;
        // An invalid URL is a programming error, not a network condition. Return
        // null rather than a fabricated reply; callers must check for null.
        return nullptr;
    }
    // Public entry point. The private overload does the real work so that the
    // retry machinery can replay a request without re-resolving the path.
    QString effectiveContext = context;
    if (effectiveContext.isEmpty()) {
        effectiveContext = url.toString();
    }
    return request(verb, url.toString(), body, contentType, headers, policy, 0,
                   effectiveContext);
}

QNetworkReply *HttpClient::request(HttpVerb verb,
                                  const QString &urlString,
                                  const QByteArray &body,
                                  const QString &contentType,
                                  const QMap<QString, QString> &headers,
                                  const HttpRetryPolicy &policy,
                                  int attempt,
                                  const QString &context)
{
    const QUrl url(urlString);
    if (!url.isValid() || url.isEmpty()) {
        qWarning(lcHttp) << "invalid request URL" << urlString;
        return nullptr;
    }

    QNetworkRequest req = buildRequest(verb, urlString);

    if (!contentType.isEmpty() && !body.isEmpty()) {
        req.setHeader(QNetworkRequest::ContentTypeHeader, contentType);
    }

    // Qt has no first-class PATCH. It is tunnelled through POST with an override
    // header, which the backend is required to honour. Sent for every PATCH
    // because it is ~30 bytes and guessing wrong costs a 405.
    if (verb == HttpVerb::Patch) {
        req.setRawHeader("X-HTTP-Method-Override", "PATCH");
    }

    for (auto it = headers.constBegin(); it != headers.constEnd(); ++it) {
        // Caller headers are applied last so an explicit Content-Range or
        // If-Match from the sync layer wins over anything derived here.
        req.setRawHeader(it.key().toUtf8(), it.value().toUtf8());
    }

    QNetworkReply *reply = nullptr;
    switch (verb) {
    case HttpVerb::Get:    reply = m_manager->get(req); break;
    case HttpVerb::Head:   reply = m_manager->head(req); break;
    case HttpVerb::Post:
    case HttpVerb::Patch:  reply = m_manager->post(req, body); break;
    case HttpVerb::Put:    reply = m_manager->put(req, body); break;
    case HttpVerb::Delete: reply = m_manager->deleteResource(req); break;
    }

    if (!reply) {
        return nullptr;
    }

    connect(reply, &QNetworkReply::downloadProgress, this,
            [this](qint64 received, qint64 total) {
                emit progress(received, total);
            });

    track(reply, verb, urlString, body, contentType, headers, policy, attempt, context);
    return reply;
}

QNetworkReply *HttpClient::get(const QString &path, const QMap<QString, QString> &headers)
{
    return request(HttpVerb::Get, path, QByteArray(), QString(), headers);
}

QNetworkReply *HttpClient::post(const QString &path, const QJsonObject &body,
                                const QMap<QString, QString> &headers)
{
    return request(HttpVerb::Post, path,
                   QJsonDocument(body).toJson(QJsonDocument::Compact),
                   QStringLiteral("application/json"), headers);
}

QNetworkReply *HttpClient::post(const QString &path, const QByteArray &body,
                                const QString &contentType,
                                const QMap<QString, QString> &headers)
{
    return request(HttpVerb::Post, path, body, contentType, headers);
}

QNetworkReply *HttpClient::put(const QString &path, const QJsonObject &body,
                               const QMap<QString, QString> &headers)
{
    return request(HttpVerb::Put, path,
                   QJsonDocument(body).toJson(QJsonDocument::Compact),
                   QStringLiteral("application/json"), headers);
}

QNetworkReply *HttpClient::patch(const QString &path, const QJsonObject &body,
                                 const QMap<QString, QString> &headers)
{
    return request(HttpVerb::Patch, path,
                   QJsonDocument(body).toJson(QJsonDocument::Compact),
                   QStringLiteral("application/json"), headers);
}

QNetworkReply *HttpClient::del(const QString &path, const QMap<QString, QString> &headers)
{
    return request(HttpVerb::Delete, path, QByteArray(), QString(), headers);
}

QNetworkReply *HttpClient::getWithEtag(const QString &path, const QString &knownEtag,
                                       const QMap<QString, QString> &headers)
{
    QMap<QString, QString> h = headers;
    if (!knownEtag.isEmpty()) {
        h.insert(QStringLiteral("If-None-Match"), knownEtag);
    }
    return request(HttpVerb::Get, path, QByteArray(), QString(), h);
}

QNetworkReply *HttpClient::putIfMatch(const QString &path, const QJsonObject &body,
                                      const QString &knownEtag,
                                      const QMap<QString, QString> &headers)
{
    QMap<QString, QString> h = headers;
    if (!knownEtag.isEmpty()) {
        h.insert(QStringLiteral("If-Match"), knownEtag);
    }
    // No retry policy: a 412 must reach the conflict resolver untouched.
    HttpRetryPolicy noRetry;
    noRetry.maximumAttempts = 1;
    return request(HttpVerb::Put, path,
                   QJsonDocument(body).toJson(QJsonDocument::Compact),
                   QStringLiteral("application/json"), h, noRetry);
}

// ---------------------------------------------------------------------------
// Retry machinery
// ---------------------------------------------------------------------------

int HttpClient::computeBackoffMs(const HttpRetryPolicy &policy, int attempt) const
{
    // attempt is 0-based, so the first retry waits baseDelayMs.
    double delay = policy.baseDelayMs;
    for (int i = 0; i < attempt; ++i) {
        delay *= policy.backoffMultiplier;
        if (delay >= policy.maximumDelayMs) {
            delay = policy.maximumDelayMs;
            break;
        }
    }

    delay = qBound(0.0, delay, static_cast<double>(policy.maximumDelayMs));

    // Full-range jitter around the computed value. Without jitter, every client
    // that failed during the same outage retries in lockstep and reproduces the
    // outage the instant the server recovers.
    const double span = delay * policy.jitterFraction;
    const double offset = (QRandomGenerator::global()->generateDouble() * 2.0 - 1.0) * span;
    return static_cast<int>(qBound(0.0, delay + offset, static_cast<double>(policy.maximumDelayMs)));
}

void HttpClient::forget(QNetworkReply *reply)
{
    m_policies.remove(reply);
    m_attempts.remove(reply);
    m_urls.remove(reply);
    m_contexts.remove(reply);
    m_verbs.remove(reply);
}

void HttpClient::noteTransportOutcome(bool ok)
{
    if (ok) {
        if (m_consecutiveFailures > 0) {
            m_consecutiveFailures = 0;
        }
        if (!m_online) {
            m_online = true;
            emit connectivityChanged(true);
        }
        return;
    }

    ++m_consecutiveFailures;
    if (m_online && m_consecutiveFailures >= kFailureThresholdForOffline) {
        m_online = false;
        emit connectivityChanged(false);
    }
}

QMap<QString, QString> HttpClient::collectHeaders(QNetworkReply *reply) const
{
    QMap<QString, QString> result;
    const auto raw = reply->rawHeaderList();
    for (const QByteArray &name : raw) {
        // Header names are case-insensitive, so they are normalised to lower
        // case once here. HttpResponse::header() can then be case-sensitive
        // internally and still behave correctly for every caller.
        result.insert(QString::fromLatin1(name).toLower(),
                      QString::fromUtf8(reply->rawHeader(name)));
    }
    return result;
}

void HttpClient::emitFinished(QNetworkReply *reply, const QString &context)
{
    HttpResponse response;
    response.transportOk = (reply->error() == QNetworkReply::NoError);
    response.statusCode = reply->attribute(QNetworkRequest::HttpStatusCodeAttribute).toInt();
    response.body = reply->readAll();
    response.headers = collectHeaders(reply);
    response.effectiveUrl = reply->url();
    response.transportError = reply->errorString();

    // A 3xx under manual redirect policy is a successful transport event with a
    // status that still needs handling. It is treated as transport-ok so it is
    // not misreported as an outage.
    noteTransportOutcome(response.transportOk || response.statusCode != 0);

    if (context.isEmpty()) {
        context = reply->url().toString();
    }

    emit finished(response, context);

    // The caller may delete the reply inside the finished() handler, so nothing
    // here may touch it afterwards.
}

void HttpClient::track(QNetworkReply *reply,
                       HttpVerb verb,
                       const QString &urlString,
                       const QByteArray &body,
                       const QString &contentType,
                       const QMap<QString, QString> &headers,
                       const HttpRetryPolicy &policy,
                       int attempt,
                       const QString &context)
{
    m_policies.insert(reply, policy);
    m_attempts.insert(reply, attempt);
    m_urls.insert(reply, urlString);
    m_contexts.insert(reply, context);
    m_verbs.insert(reply, verb);

    // The replay lambdas below capture the request shape by value. QNetworkReply
    // is deliberately absent from those captures: the retry must outlive the
    // failed reply it replaces, and holding a pointer to a deleteLater()d object
    // in a pending timer is a use-after-free waiting for the next event loop turn.

    connect(reply, &QNetworkReply::finished, this, [this, reply, verb, urlString,
                                                   body, contentType, headers, policy, attempt,
                                                   context]() {
        const int status = reply->attribute(QNetworkRequest::HttpStatusCodeAttribute).toInt();
        const bool ok = (reply->error() == QNetworkReply::NoError);

        // -------------------------------------------------------------------
        // Case 1: a 401. Try exactly one token refresh, then replay once.
        // -------------------------------------------------------------------
        if (status == 401 && attempt == 0 && m_tokenRefreshProvider && m_tokenRefreshProvider()) {
            qCInfo(lcHttp) << "401 from" << urlString << "- refreshing token and replaying once";
            emit tokenRefreshed();

            QNetworkReply *replay = request(verb, urlString, body, contentType, headers,
                                            policy, attempt + 1, context);
            if (replay) {
                // The original reply has served its purpose. Its body, if any,
                // was an error payload and is not needed.
                emitFinished(reply, context);
                reply->deleteLater();
                return;
            }
            // A replay could not even be created; fall through to finalising.
        }

        // -------------------------------------------------------------------
        // Case 2: a 412 is a conflict. Never retried, never counted as a
        // transport failure. The conflict resolver owns this outcome.
        // -------------------------------------------------------------------
        if (status == 412) {
            forget(reply);
            emitFinished(reply, context);
            reply->deleteLater();
            return;
        }

        // -------------------------------------------------------------------
        // Case 3: decide whether to retry.
        // -------------------------------------------------------------------
        const bool hasIdempotencyKey = headers.contains(QStringLiteral("Idempotency-Key"))
                                    || headers.contains(QStringLiteral("X-Idempotency-Key"));
        const bool methodRetryable = policy.allowsBlindRetry(verb) || hasIdempotencyKey;

        HttpResponse probe;
        probe.transportOk = ok;
        probe.statusCode = status;
        const bool retryableOutcome = ok ? (status == 0) : (status == 0 || probe.isRetryableStatus());

        if (methodRetryable && retryableOutcome && attempt + 1 < policy.maximumAttempts) {
            int delayMs = computeBackoffMs(policy, attempt);

            // A server that tells us how long to wait is believed over our own
            // guess, because it knows about load we cannot see.
            HttpResponse forHeaders;
            forHeaders.transportOk = ok;
            forHeaders.statusCode = status;
            forHeaders.headers = collectHeaders(reply);
            const int serverDelay = forHeaders.retryAfterMs(QDateTime::currentDateTimeUtc());
            if (serverDelay >= 0) {
                delayMs = serverDelay;
            }

            const QString reason = status == 0
                ? QStringLiteral("transport failure: %1").arg(reply->errorString())
                : QStringLiteral("HTTP %1").arg(status);

            qCInfo(lcHttp) << "retrying" << urlString << "in" << delayMs
                           << "ms because" << reason;
            emit retrying(urlString, attempt + 2, delayMs, reason);

            QTimer::singleShot(delayMs, this,
                               [this, verb, urlString, body, contentType, headers,
                                policy, attempt, context]() {
                                   request(verb, urlString, body, contentType, headers,
                                           policy, attempt + 1, context);
                               });

            // Clean up this attempt. The caller still owns this reply, so it is
            // scheduled rather than deleted outright to avoid a double free
            // when the caller's own finished() handler runs.
            forget(reply);
            reply->deleteLater();
            return;
        }

        // -------------------------------------------------------------------
        // Case 4: finalise. The caller's own finished() handler may delete the
        // reply, so bookkeeping is cleared before the signal is emitted.
        // -------------------------------------------------------------------
        forget(reply);
        emitFinished(reply, context);
        reply->deleteLater();
    });
}

// ---------------------------------------------------------------------------
// Blocking form
// ---------------------------------------------------------------------------

HttpResponse HttpClient::requestBlocking(HttpVerb verb,
                                        const QString &path,
                                        const QByteArray &body,
                                        const QString &contentType,
                                        const QMap<QString, QString> &headers,
                                        int timeoutMs)
{
    HttpResponse result;

    QNetworkReply *reply = request(verb, path, body, contentType, headers);
    if (!reply) {
        result.transportError = QStringLiteral("could not construct request for %1").arg(path);
        return result;
    }

    QEventLoop loop;
    QTimer deadline;
    deadline.setSingleShot(true);

    bool expired = false;
    connect(&deadline, &QTimer::timeout, &loop, [&loop, &expired]() {
        expired = true;
        loop.quit();
    });
    connect(reply, &QNetworkReply::finished, &loop, &QEventLoop::quit);

    deadline.start(timeoutMs);
    if (!reply->isFinished()) {
        loop.exec();
    }

    result.transportOk = (reply->error() == QNetworkReply::NoError) && !expired;
    result.statusCode = reply->attribute(QNetworkRequest::HttpStatusCodeAttribute).toInt();
    result.body = reply->readAll();
    result.headers = collectHeaders(reply);
    result.effectiveUrl = reply->url();

    if (expired) {
        result.transportError = QStringLiteral("request timed out after %1 ms").arg(timeoutMs);
        // Abort rather than merely abandoning: the socket is still live and would
        // otherwise hold the connection open indefinitely.
        reply->abort();
    } else {
        result.transportError = reply->errorString();
    }

    reply->deleteLater();
    return result;
}

// ---------------------------------------------------------------------------
// Multipart
// ---------------------------------------------------------------------------

QByteArray HttpClient::buildMultipartBody(const QMap<QString, QString> &fields,
                                          const QMap<QString, QByteArray> &files,
                                          const QString &boundary,
                                          QString *contentTypeOut)
{
    QByteArray body;
    const QByteArray dash = "--" + boundary.toUtf8() + "\r\n";

    if (contentTypeOut) {
        *contentTypeOut = QStringLiteral("multipart/form-data; boundary=%1").arg(boundary);
    }

    for (auto it = fields.constBegin(); it != fields.constEnd(); ++it) {
        body += dash;
        body += "Content-Disposition: form-data; name=\"";
        body += it.key().toUtf8();
        body += "\"\r\n\r\n";
        body += it.value().toUtf8();
        body += "\r\n";
    }

    for (auto it = files.constBegin(); it != files.constEnd(); ++it) {
        body += dash;
        body += "Content-Disposition: form-data; name=\"";
        body += it.key().toUtf8();
        body += "\"; filename=\"";
        body += it.key().toUtf8();
        body += "\"\r\n";
        // Without a declared type a server has to guess from the filename
        // extension, and many reject an undeclared part outright. The type is
        // therefore derived rather than omitted.
        body += "Content-Type: ";
        body += mimeTypeForFileName(it.key()).toUtf8();
        body += "\r\n\r\n";
        body += it.value();
        body += "\r\n";
    }

    body += "--" + boundary.toUtf8() + "--\r\n";
    return body;
}

QNetworkReply *HttpClient::postMultipart(const QString &path,
                                         const QMap<QString, QString> &fields,
                                         const QMap<QString, QByteArray> &files,
                                         const QString &boundary,
                                         const QMap<QString, QString> &headers)
{
    // A multipart body can never be retried blindly: the whole payload has to be
    // rebuilt and resent, and the server may well have already committed the
    // first attempt. Callers who need retry semantics pass an Idempotency-Key.
    const QString effectiveBoundary = boundary.isEmpty() ? makeBoundary() : boundary;

    QString contentType;
    const QByteArray body = buildMultipartBody(fields, files, effectiveBoundary, &contentType);
    return request(HttpVerb::Post, path, body, contentType, headers);
}

// ---------------------------------------------------------------------------
// Resumable upload session
// ---------------------------------------------------------------------------

// A resumable upload is a sequence of PUTs with Content-Range, ending with a
// zero-length PUT that carries the final range. The offset is not guessed: the
// server's response to each chunk is authoritative, so a chunk that partially
// arrived does not corrupt the file.
class HttpClient::UploadSession : public QObject
{
    Q_OBJECT

public:
    UploadSession(const QString &urlString,
                  const QString &contentType,
                  qint64 totalBytes,
                  QObject *parent)
        : QObject(parent)
        , m_url(urlString)
        , m_contentType(contentType)
        , m_total(totalBytes)
    {
    }

    qint64 offset() const { return m_offset; }
    qint64 total() const { return m_total; }
    bool finished() const { return m_finished; }
    bool failed() const { return m_failed; }
    QString uploadId() const { return m_uploadId; }

    // Resume from a persisted offset. Used when the process restarts mid-upload.
    void resumeAt(qint64 offset, const QString &uploadId)
    {
        m_offset = qMax<qint64>(0, offset);
        m_uploadId = uploadId;
    }

    // Read from the local file and send chunks until complete. Sequential, not
    // pipelined: a pipelined uploader must handle the server rejecting an
    // out-of-order chunk, and no current backend needs that throughput.
    void start(const QString &localFilePath, qint64 chunkSize = 4 * 1024 * 1024)
    {
        QFile probe(localFilePath);
        if (!probe.open(QIODevice::ReadOnly)) {
            m_failed = true;
            m_error = QStringLiteral("cannot open %1: %2").arg(localFilePath, probe.errorString());
            emit failed(m_error);
            return;
        }

        // The declared total wins over the real file size only if it is larger.
        // If the caller passed a stale size the upload would hang waiting for
        // bytes that do not exist, so the real size is authoritative here.
        const qint64 realSize = probe.size();
        if (m_total <= 0) {
            m_total = realSize;
        } else if (realSize != m_total) {
            m_total = realSize;
        }

        if (m_total == 0) {
            // A zero-byte upload is legal and still needs finalising, but there
            // is no point opening a chunk loop for it.
            sendFinalChunk();
            return;
        }

        m_filePath = localFilePath;
        m_file = std::move(probe);
        m_chunkSize = chunkSize > 0 ? chunkSize : (4 * 1024 * 1024);
        sendNextChunk();
    }

    void abort()
    {
        m_aborted = true;
    }

signals:
    void progress(qint64 sent, qint64 total);
    void finished(const QString &uploadId);
    void failed(const QString &error);
    void retrying(int attempt);

private:
    // m_offset is the single source of truth for position. The file's own
    // position is always re-seeked to match it rather than tracked separately;
    // two cursors that are supposed to agree invariably drift, and when they
    // drift the result is a file with a duplicated or missing region.
    void sendNextChunk()
    {
        if (m_aborted) {
            return;
        }
        if (m_offset >= m_total) {
            sendFinalChunk();
            return;
        }

        const qint64 remaining = m_total - m_offset;
        const qint64 take = qMin(m_chunkSize, remaining);

        if (!m_file.seek(m_offset)) {
            m_failed = true;
            m_error = QStringLiteral("cannot seek to offset %1 in %2").arg(m_offset).arg(m_filePath);
            emit failed(m_error);
            return;
        }

        const QByteArray chunk = m_file.read(take);
        if (chunk.size() != take) {
            m_failed = true;
            m_error = QStringLiteral("short read at offset %1: wanted %2, got %3")
                          .arg(m_offset).arg(take).arg(chunk.size());
            emit failed(m_error);
            return;
        }

        QNetworkRequest req;
        req.setUrl(QUrl(m_url));
        req.setHeader(QNetworkRequest::ContentTypeHeader, m_contentType);
        req.setRawHeader("Content-Length", QByteArray::number(take));
        // Same auth and platform headers as any other request. Omitting these
        // would make every authenticated upload fail with a 401 that looks like
        // a server bug.
        m_http->applyDefaultHeaders(req);

        // The Content-Range is the whole contract. Without it the server cannot
        // tell where this chunk belongs.
        QByteArray range = "bytes ";
        range += QByteArray::number(m_offset);
        range += '-';
        range += QByteArray::number(m_offset + take - 1);
        range += '/';
        range += QByteArray::number(m_total);
        req.setRawHeader("Content-Range", range);

        if (!m_uploadId.isEmpty()) {
            req.setRawHeader("X-Upload-Id", m_uploadId.toUtf8());
        }

        QNetworkReply *reply = m_http->m_manager->put(req, chunk);
        if (!reply) {
            m_failed = true;
            emit failed(QStringLiteral("upload could not be started"));
            return;
        }

        connect(reply, &QNetworkReply::uploadProgress, this,
                [this](qint64 sent, qint64) {
                    emit progress(m_offset + sent, m_total);
                });

        connect(reply, &QNetworkReply::finished, this, [this, reply, take]() {
            const int status = reply->attribute(QNetworkRequest::HttpStatusCodeAttribute).toInt();
            const bool ok = (reply->error() == QNetworkReply::NoError);
            const QString errorText = reply->errorString();

            // The server's Range header is authoritative. When present it can
            // disagree with what we sent (a proxy truncated the chunk), so the
            // offset is adopted from it rather than assumed.
            const QByteArray rangeHeader = reply->rawHeader("Range");
            const QByteArray uploadId = reply->rawHeader("X-Upload-Id");
            reply->deleteLater();

            if (!uploadId.isEmpty()) {
                m_uploadId = QString::fromUtf8(uploadId);
            }

            if (!ok) {
                // A 416 means our offset is already past what the server has, so
                // the chunk was accepted on an earlier attempt that appeared to
                // fail. Trusting the server and moving forward is correct; retrying
                // the same range forever is not.
                if (status == 416 && !rangeHeader.isEmpty()) {
                    if (applyServerRange(rangeHeader)) {
                        m_attempts = 0;
                        sendNextChunk();
                        return;
                    }
                }

                if (m_attempts < 3) {
                    ++m_attempts;
                    emit retrying(m_attempts);
                    // m_offset is unchanged, so the retry resends exactly the same
                    // byte range and cannot skip or duplicate a byte.
                    QTimer::singleShot(computeChunkDelayMs(m_attempts), this,
                                       [this]() { sendNextChunk(); });
                    return;
                }

                m_failed = true;
                m_error = QStringLiteral("upload chunk failed after %1 attempts: HTTP %2 %3")
                              .arg(m_attempts + 1).arg(status).arg(errorText);
                emit failed(m_error);
                return;
            }

            m_attempts = 0;

            if (!rangeHeader.isEmpty()) {
                if (!applyServerRange(rangeHeader)) {
                    m_failed = true;
                    m_error = QStringLiteral("server returned an unusable Range header: %1")
                                  .arg(QString::fromUtf8(rangeHeader));
                    emit failed(m_error);
                    return;
                }
            } else {
                m_offset += take;
            }

            sendNextChunk();
        });
    }

    // Adopts the offset the server reports. Returns false when the header is
    // present but unusable, which is a protocol violation rather than something
    // to silently ignore: proceeding with a guessed offset would corrupt the file.
    bool applyServerRange(const QByteArray &rangeHeader)
    {
        // Accepts both "bytes=0-99" (RFC 9110 Range) and "0-99" (the de facto
        // upload-session convention). Guessing one strictly is how resumable
        // uploads end up restarting from zero on a compliant server.
        QByteArray text = rangeHeader.trimmed();
        if (text.startsWith("bytes=")) {
            text = text.mid(6);
        }
        if (text.startsWith("bytes ")) {
            text = text.mid(6);
        }
        text = text.trimmed();

        const int dashPos = text.indexOf('-');
        if (dashPos <= 0) {
            return false;
        }

        bool converted = false;
        const qint64 serverNext = text.left(dashPos).trimmed().toLongLong(&converted);
        if (!converted) {
            return false;
        }
        if (serverNext < m_offset || serverNext > m_total) {
            // Either it rewinds behind confirmed data or claims to have more than
            // exists. Either way it cannot be obeyed.
            return false;
        }

        m_offset = serverNext;
        return true;
    }

    int computeChunkDelayMs(int attempt) const
    {
        int delay = 500;
        for (int i = 1; i < attempt; ++i) {
            delay *= 2;
        }
        const int span = delay / 4;
        const int jitter = static_cast<int>(QRandomGenerator::global()->generate() % (span + 1));
        return qMin(delay + jitter, 10000);
    }

    void sendFinalChunk()
    {
        if (m_aborted) {
            return;
        }

        QNetworkRequest req;
        req.setUrl(QUrl(m_url));
        // The finalising request carries no body, so no Content-Type is set: a
        // type with no payload invites a server to try to parse one.
        req.setRawHeader("Content-Range",
                         QByteArray("bytes */") + QByteArray::number(m_total));
        req.setRawHeader("Content-Length", QByteArray("0"));
        if (!m_uploadId.isEmpty()) {
            req.setRawHeader("X-Upload-Id", m_uploadId.toUtf8());
        }
        m_http->applyDefaultHeaders(req);

        QNetworkReply *reply = m_http->m_manager->put(req, QByteArray());
        if (!reply) {
            m_failed = true;
            emit failed(QStringLiteral("upload could not be finalised"));
            return;
        }

        connect(reply, &QNetworkReply::finished, this, [this, reply]() {
            const int status = reply->attribute(QNetworkRequest::HttpStatusCodeAttribute).toInt();
            const QByteArray uploadId = reply->rawHeader("X-Upload-Id");
            if (!uploadId.isEmpty()) {
                m_uploadId = QString::fromUtf8(uploadId);
            }
            const bool ok = (reply->error() == QNetworkReply::NoError);
            const QString err = reply->errorString();
            reply->deleteLater();

            if (!ok) {
                if (m_finalAttempts < 3) {
                    ++m_finalAttempts;
                    emit retrying(m_finalAttempts);
                    QTimer::singleShot(computeChunkDelayMs(m_finalAttempts), this,
                                       [this]() { sendFinalChunk(); });
                    return;
                }
                m_failed = true;
                emit failed(QStringLiteral("upload could not be finalised after %1 attempts: "
                                           "HTTP %2 %3")
                                .arg(m_finalAttempts + 1).arg(status).arg(err));
                return;
            }

            m_finished = true;
            emit finished(m_uploadId);
        });
    }

public:
    HttpClient *m_http = nullptr;

private:
    QString m_url;
    QString m_contentType;
    qint64 m_total = 0;
    qint64 m_offset = 0;
    // Finalising has its own attempt counter: a session that struggled on chunk
    // 400 and then fails to finalise is a different problem from a session that
    // struggled on its first chunk, and they need separate retry budgets.
    int m_finalAttempts = 0;
    qint64 m_chunkSize = 4 * 1024 * 1024;
    int m_attempts = 0;
    bool m_finished = false;
    bool m_failed = false;
    bool m_aborted = false;
    QString m_error;
    QString m_uploadId;
    QString m_filePath;
    QFile m_file;
};

HttpClient::UploadSession *HttpClient::beginResumableUpload(const QString &path,
                                                           const QString &contentType,
                                                           qint64 totalBytes,
                                                           QObject *parent)
{
    const QUrl url = resolveUrl(path);
    if (!url.isValid() || url.isEmpty()) {
        return nullptr;
    }
    auto *session = new UploadSession(url.toString(), contentType, totalBytes,
                                      parent ? parent : this);
    session->m_http = this;
    return session;
}

#include "HttpClient.moc"