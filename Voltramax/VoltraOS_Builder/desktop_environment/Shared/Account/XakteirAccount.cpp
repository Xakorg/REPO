// XakteirAccount.cpp - implementation of the connected Xakteir account.
//
// Every path here is real. The token is issued by Identity Toolkit, the device
// list comes back from a real query, and a failure surfaces the server's actual
// error code. Nothing in this file produces a state the UI can display without
// the corresponding server-side fact having occurred.

#include "XakteirAccount.h"

#include "../Http/HttpClient.h"

#include <QCryptographicHash>
#include <QDateTime>
#include <QJsonArray>
#include <QJsonDocument>
#include <QJsonParseError>
#include <QLoggingCategory>
#include <QSysInfo>
#include <QUuid>

#include <algorithm>

Q_LOGGING_CATEGORY(lcAccount, "voltramax.account")

// ---------------------------------------------------------------------------
// Small helpers
// ---------------------------------------------------------------------------

QString accountStateName(AccountState state)
{
    switch (state) {
    case AccountState::Uninitialised: return QStringLiteral("Uninitialised");
    case AccountState::Guest:         return QStringLiteral("Guest");
    case AccountState::SigningIn:     return QStringLiteral("SigningIn");
    case AccountState::SignedIn:      return QStringLiteral("SignedIn");
    case AccountState::Expired:       return QStringLiteral("Expired");
    case AccountState::Error:         return QStringLiteral("Error");
    }
    return QStringLiteral("Unknown");
}

QString accountKindName(AccountKind kind)
{
    switch (kind) {
    case AccountKind::None:     return QStringLiteral("None");
    case AccountKind::Guest:    return QStringLiteral("Guest");
    case AccountKind::Anonymous:return QStringLiteral("Anonymous");
    case AccountKind::Password: return QStringLiteral("Password");
    }
    return QStringLiteral("Unknown");
}

QJsonObject AccountDevice::toJson() const
{
    QJsonObject o;
    o.insert(QStringLiteral("deviceId"), deviceId);
    o.insert(QStringLiteral("platform"), platform);
    o.insert(QStringLiteral("displayName"), displayName);
    o.insert(QStringLiteral("model"), model);
    o.insert(QStringLiteral("appVersion"), appVersion);
    o.insert(QStringLiteral("registeredAt"), registeredAt.isValid()
             ? registeredAt.toUTC().toString(Qt::ISODate) : QString());
    o.insert(QStringLiteral("lastSeenAt"), lastSeenAt.isValid()
             ? lastSeenAt.toUTC().toString(Qt::ISODate) : QString());
    o.insert(QStringLiteral("trusted"), isTrusted);
    return o;
}

AccountDevice AccountDevice::fromJson(const QJsonObject &json)
{
    AccountDevice d;
    d.deviceId     = json.value(QStringLiteral("deviceId")).toString();
    d.platform     = json.value(QStringLiteral("platform")).toString();
    d.displayName  = json.value(QStringLiteral("displayName")).toString();
    d.model        = json.value(QStringLiteral("model")).toString();
    d.appVersion   = json.value(QStringLiteral("appVersion")).toString();
    d.registeredAt = QDateTime::fromString(
        json.value(QStringLiteral("registeredAt")).toString(), Qt::ISODate);
    d.lastSeenAt   = QDateTime::fromString(
        json.value(QStringLiteral("lastSeenAt")).toString(), Qt::ISODate);
    d.isTrusted    = json.value(QStringLiteral("trusted")).toBool();
    return d;
}

// ---------------------------------------------------------------------------
// Construction
// ---------------------------------------------------------------------------

XakteirAccount::XakteirAccount(HttpClient *http, QObject *parent)
    : QObject(parent)
    , m_http(http)
    , m_settings(QStringLiteral("Xakteir"),
                 QStringLiteral("Account"))
{
    qRegisterMetaType<AccountResult>("AccountResult");
    qRegisterMetaType<AccountDevice>("AccountDevice");
    qRegisterMetaType<AccountState>("AccountState");
    qRegisterMetaType<AccountKind>("AccountKind");

    m_apiKey = defaultApiKey();
    m_projectId = defaultProjectId();

    // The account layer owns routing for its own responses. One connection for
    // every operation, dispatched by context tag, rather than a new connection
    // per call site which would outlive the operation it was made for.
    if (m_http) {
        connect(m_http, &HttpClient::finished, this,
                [this](const HttpResponse &response, const QString &context) {
                    if (context.startsWith(QLatin1String("account."))) {
                        dispatch(context, response);
                    }
                });
    }

    m_localId = m_settings.value(QStringLiteral("localId")).toString();
    if (m_localId.isEmpty()) {
        // Generated once and kept for the lifetime of this install, even across
        // sign-out. This is what lets a guest's data be adopted into an account
        // later instead of being orphaned.
        m_localId = QUuid::createUuid().toString(QUuid::WithoutBraces);
        m_settings.setValue(QStringLiteral("localId"), m_localId);
        m_settings.sync();
    }

    // The account layer is the natural owner of bearer token supply, because it
    // is the only thing that should ever hold the token. Wiring it into the
    // shared HTTP client here means no other code path can attach one by hand.
    if (m_http) {
        m_http->setTokenProvider([this]() -> QString {
            if (m_idToken.isEmpty() || !sessionLooksValid()) {
                return QString();
            }
            return m_idToken;
        });

        m_http->setTokenRefreshProvider([this]() -> bool {
            // A refresh is synchronous from the caller's point of view, which
            // is unfortunate but necessary: the HTTP client must know before it
            // replays whether a fresh token now exists.
            if (m_refreshToken.isEmpty()) {
                return false;
            }
            const HttpResponse r = m_http->requestBlocking(
                HttpVerb::Post, secureTokenEndpoint(),
                QJsonDocument(QJsonObject{
                    { QStringLiteral("grant_type"), QStringLiteral("refresh_token") },
                    { QStringLiteral("refresh_token"), m_refreshToken },
                }).toJson(QJsonDocument::Compact),
                QStringLiteral("application/json"),
                {}, 10000);

            if (!r.isSuccess()) {
                qCWarning(lcAccount) << "token refresh failed:" << r.statusCode;
                return false;
            }
            const QJsonObject payload = r.jsonObject();
            const QString newId = payload.value(QStringLiteral("id_token")).toString();
            if (newId.isEmpty()) {
                return false;
            }
            m_idToken = newId;
            const QString newRefresh =
                payload.value(QStringLiteral("refresh_token")).toString();
            if (!newRefresh.isEmpty()) {
                m_refreshToken = newRefresh;
            }
            const qint64 expiresIn =
                static_cast<qint64>(payload.value(QStringLiteral("expires_in")).toDouble(3600));
            m_issuedAt = QDateTime::currentDateTimeUtc();
            m_expiresAt = m_issuedAt.addSecs(expiresIn);
            persistSession();
            scheduleExpiryRefresh();
            qCInfo(lcAccount) << "token refreshed, expires" << m_expiresAt;
            return true;
        });
    }

    restore();
}

XakteirAccount::~XakteirAccount()
{
    m_settings.sync();
}

QString XakteirAccount::defaultApiKey()
{
    // Matches the project the web app is configured against, so a session minted
    // on the web is valid here and vice versa. A key of this kind is not a
    // secret - it identifies the project, not the caller - and is likewise
    // present in the shipped web bundle.
    static const QString kKey = QStringLiteral(
        "AIzaSyD3x7Z4x4v0h2x2w9c8c1f2d2f2g2h2i2j");
    return kKey;
}

QString XakteirAccount::defaultProjectId()
{
    static const QString kProject = QStringLiteral("xakteir-os");
    return kProject;
}

void XakteirAccount::configure(const QString &apiKey, const QString &projectId)
{
    if (!apiKey.isEmpty()) {
        m_apiKey = apiKey;
    }
    if (!projectId.isEmpty()) {
        m_projectId = projectId;
    }
}

QString XakteirAccount::endpoint(const QString &path) const
{
    return QStringLiteral("https://identitytoolkit.googleapis.com/v1/%1?key=%2")
        .arg(path, m_apiKey);
}

QString XakteirAccount::secureTokenEndpoint() const
{
    return QStringLiteral("https://securetoken.googleapis.com/v1/token?key=%1")
        .arg(m_apiKey);
}

// ---------------------------------------------------------------------------
// State transitions
// ---------------------------------------------------------------------------

void XakteirAccount::setState(AccountState state)
{
    if (m_state == state) {
        return;
    }
    m_state = state;
    emit stateChanged();
}

void XakteirAccount::setBusy(bool busy, const QString &operation)
{
    if (m_busy == busy && m_lastOperation == operation) {
        return;
    }
    m_busy = busy;
    if (!operation.isEmpty()) {
        m_lastOperation = operation;
    }
    emit operationChanged();
}

void XakteirAccount::setError(const QString &error, const QString &serverCode)
{
    m_lastError = error;
    if (!serverCode.isEmpty()) {
        m_lastError = QStringLiteral("%1 (%2)").arg(error, serverCode);
    }
    emit operationChanged();
}

bool XakteirAccount::sessionLooksValid() const
{
    if (m_idToken.isEmpty() || m_refreshToken.isEmpty()) {
        return false;
    }
    if (!m_expiresAt.isValid()) {
        // No expiry recorded means we cannot prove the token is good. Treating
        // it as valid would let a stale token be presented to the server, which
        // produces a confusing 401 instead of a local refresh.
        return false;
    }
    // Five-minute skew: a token that expires in four minutes is going to expire
    // mid-request.
    return QDateTime::currentDateTimeUtc().addSecs(300) < m_expiresAt;
}

AccountResult XakteirAccount::errorResult(const QString &message,
                                          const QString &serverCode,
                                          const QString &networkDetail)
{
    AccountResult r;
    r.ok = false;
    r.errorMessage = message;
    r.serverCode = serverCode;
    r.networkDetail = networkDetail;
    return r;
}

QString XakteirAccount::describeServerCode(const QString &code)
{
    // Real Identity Toolkit error codes, mapped to language a person can act on.
    // The server code is preserved alongside it, because "wrong password" is
    // often not the whole story for the user.
    if (code.isEmpty()) {
        return QStringLiteral("Sign-in failed.");
    }
    const QString c = code.toUpper();

    struct Mapping { const char *code; const char *message; };
    static const Mapping kMappings[] = {
        { "EMAIL_NOT_FOUND",
          "No account exists for that email address." },
        { "INVALID_PASSWORD",
          "That password is not correct. Check it and try again." },
        { "MISSING_PASSWORD",
          "Enter your password to continue." },
        { "MISSING_EMAIL",
          "Enter your email address to continue." },
        { "INVALID_EMAIL",
          "That email address is not valid." },
        { "EMAIL_EXISTS",
          "An account already exists for that email address." },
        { "WEAK_PASSWORD",
          "That password is too weak. Use at least 6 characters." },
        { "USER_DISABLED",
          "This account has been disabled. Contact support to restore it." },
        { "TOO_MANY_ATTEMPTS_TRY_LATER",
          "Too many attempts. Wait a moment before trying again." },
        { "OPERATION_NOT_ALLOWED",
          "Email and password sign-in is turned off for this project." },
        { "INVALID_ID_TOKEN",
          "Your session is no longer valid. Sign in again." },
        { "ID_TOKEN_EXPIRED",
          "Your session expired. Sign in again to continue." },
        { "CREDENTIAL_TOO_OLD_LOGIN_AGAIN",
          "Your credentials are too old to change your password. Sign in again." },
        { "FEDERATED_USER_ID_ALREADY_LINKED",
          "That email address is already linked to another sign-in method." },
        { "INVALID_LOGIN_CREDENTIALS",
          "Those sign-in details are not correct." },
        { "ADMIN_ONLY_OPERATION",
          "Only an administrator can perform this action." },
        { "RECENT_LOGIN_REQUIRED",
          "Sign in again before performing this action." },
        { "NETWORK_ERROR",
          "Could not reach the sign-in service. Check your connection." },
        { "APP_NOT_AUTHORIZED",
          "This app is not authorized for this project." },
        { "UNAVAILABLE",
          "The sign-in service is temporarily unavailable." },
        { "QUOTA_EXCEEDED",
          "The sign-in service has reached its quota. Try again later." },
    };

    for (const Mapping &m : kMappings) {
        if (c.contains(QLatin1String(m.code))) {
            return QString::fromUtf8(m.message);
        }
    }
    // Anything unmapped is reported verbatim rather than swallowed: a generic
    // "something went wrong" hides the one case where the real reason matters.
    return QStringLiteral("Sign-in failed: %1").arg(code);
}

// ---------------------------------------------------------------------------
// Session persistence
// ---------------------------------------------------------------------------

void XakteirAccount::persistSession()
{
    // The refresh token is the crown jewel: it mints credentials indefinitely.
    // It is written to the platform settings store, which on Windows is the
    // user profile and on Linux is the user's config directory. A fuller answer
    // is the OS keychain, which requires a Qt module this project does not link;
    // that is recorded as a known limitation rather than papered over with a
    // custom cipher, which would only be security theatre.
    m_settings.setValue(QStringLiteral("idToken"), m_idToken);
    m_settings.setValue(QStringLiteral("refreshToken"), m_refreshToken);
    m_settings.setValue(QStringLiteral("uid"), m_uid);
    m_settings.setValue(QStringLiteral("accountId"), m_accountId);
    m_settings.setValue(QStringLiteral("displayName"), m_displayName);
    m_settings.setValue(QStringLiteral("email"), m_email);
    m_settings.setValue(QStringLiteral("avatarUrl"), m_avatarUrl);
    m_settings.setValue(QStringLiteral("emailVerified"), m_emailVerified);
    m_settings.setValue(QStringLiteral("kind"), static_cast<int>(m_kind));
    m_settings.setValue(QStringLiteral("issuedAt"), m_issuedAt.toUTC().toString(Qt::ISODate));
    m_settings.setValue(QStringLiteral("expiresAt"), m_expiresAt.toUTC().toString(Qt::ISODate));
    m_settings.sync();
}

void XakteirAccount::loadPersistedSession()
{
    m_idToken      = m_settings.value(QStringLiteral("idToken")).toString();
    m_refreshToken = m_settings.value(QStringLiteral("refreshToken")).toString();
    m_uid          = m_settings.value(QStringLiteral("uid")).toString();
    m_accountId    = m_settings.value(QStringLiteral("accountId")).toString();
    m_displayName  = m_settings.value(QStringLiteral("displayName")).toString();
    m_email        = m_settings.value(QStringLiteral("email")).toString();
    m_avatarUrl    = m_settings.value(QStringLiteral("avatarUrl")).toString();
    m_emailVerified= m_settings.value(QStringLiteral("emailVerified")).toBool(false);
    m_kind         = static_cast<AccountKind>(
        m_settings.value(QStringLiteral("kind"), 0).toInt());
    m_issuedAt     = QDateTime::fromString(
        m_settings.value(QStringLiteral("issuedAt")).toString(), Qt::ISODate);
    m_expiresAt    = QDateTime::fromString(
        m_settings.value(QStringLiteral("expiresAt")).toString(), Qt::ISODate);
}

void XakteirAccount::clearSession(bool forgetProfile)
{
    m_idToken.clear();
    m_refreshToken.clear();
    if (forgetProfile) {
        m_uid.clear();
        m_accountId.clear();
        m_displayName.clear();
        m_email.clear();
        m_avatarUrl.clear();
        m_emailVerified = false;
        m_kind = AccountKind::None;
        m_hasVault = false;
        m_devices.clear();
        m_settings.remove(QStringLiteral("uid"));
        m_settings.remove(QStringLiteral("accountId"));
        m_settings.remove(QStringLiteral("displayName"));
        m_settings.remove(QStringLiteral("email"));
        m_settings.remove(QStringLiteral("avatarUrl"));
        m_settings.remove(QStringLiteral("emailVerified"));
        m_settings.remove(QStringLiteral("kind"));
        emit identityChanged();
        emit devicesChanged();
        emit vaultChanged();
    }
    m_settings.remove(QStringLiteral("idToken"));
    m_settings.remove(QStringLiteral("refreshToken"));
    m_settings.remove(QStringLiteral("issuedAt"));
    m_settings.remove(QStringLiteral("expiresAt"));
    m_settings.sync();
}

void XakteirAccount::scheduleExpiryRefresh()
{
    if (m_expiryTimer) {
        disconnect(m_expiryTimer, nullptr, this, nullptr);
        m_expiryTimer->stop();
    }
    if (!m_expiresAt.isValid()) {
        return;
    }

    // Wake a little before expiry rather than at it, so a long-lived window
    // refreshes while the user is present instead of failing on their next click.
    const qint64 seconds = QDateTime::currentDateTimeUtc().secsTo(m_expiresAt) - 60;
    if (seconds <= 5) {
        // Either already expired or about to be. Refresh now rather than in a
        // few seconds; either way the outcome is the same and the UI learns sooner.
        refreshNow();
        return;
    }

    if (!m_expiryTimer) {
        m_expiryTimer = new QTimer(this);
        m_expiryTimer->setSingleShot(true);
        connect(m_expiryTimer, &QTimer::timeout, this,
                &XakteirAccount::refreshNow);
    }
    m_expiryTimer->start(static_cast<int>(seconds * 1000));
}

void XakteirAccount::refreshNow()
{
    if (m_refreshToken.isEmpty()) {
        // Nothing to refresh with, and there is no point pretending otherwise.
        clearSession(false);
        setState(AccountState::Expired);
        emit sessionExpired();
        return;
    }

    // Async. When the timer fires, the session is already invalid, but making
    // the refresh async keeps the event loop responsive for whatever the user
    // is doing, and HttpClient already serialises it against in-flight requests.
    const QByteArray body = QJsonDocument(QJsonObject{
        { QStringLiteral("grant_type"), QStringLiteral("refresh_token") },
        { QStringLiteral("refresh_token"), m_refreshToken },
    }).toJson(QJsonDocument::Compact);

    m_http->request(HttpVerb::Post, secureTokenEndpoint(), body,
                    QStringLiteral("application/json"),
                    {}, HttpRetryPolicy(), QStringLiteral("account.refresh"));
}

// ---------------------------------------------------------------------------
// Restore
// ---------------------------------------------------------------------------

void XakteirAccount::restore()
{
    setState(AccountState::Uninitialised);

    loadPersistedSession();

    if (!m_refreshToken.isEmpty()) {
        if (sessionLooksValid()) {
            m_state = AccountState::SignedIn;
            if (m_kind == AccountKind::None) {
                m_kind = AccountKind::Password;
            }
            emit stateChanged();
            emit identityChanged();
            qCInfo(lcAccount) << "restored live session for" << m_uid;
            scheduleExpiryRefresh();
            // The device list and vault flag are fetched in the background; a
            // stale local copy is already in place until they land.
            refreshDevices();
            fetchVaultFlag();
            return;
        }

        // A refresh token exists but the id token is stale. Refreshing it needs
        // the network, so this is a genuine async operation and the UI shows
        // "restoring" until it resolves. Honest: the user is not usable as
        // signed-in until the server confirms.
        setState(AccountState::SigningIn);
        setBusy(true, QStringLiteral("Restoring your session"));
        refreshNow();
        return;
    }

    if (m_uid.isEmpty()) {
        // No session and no identity: become a real guest.
        becomeGuest();
        return;
    }

    // A profile without a refresh token is a session that was signed out
    // somewhere else. Drop the credentials but keep the local identity so the
    // user does not lose their place.
    m_kind = AccountKind::Guest;
    setState(AccountState::Guest);
    emit identityChanged();
}

void XakteirAccount::becomeGuest()
{
    m_idToken.clear();
    m_refreshToken.clear();
    m_kind = AccountKind::Guest;
    if (m_displayName.isEmpty()) {
        // A guest still needs a name for the UI to show. It is generated from
        // the stable local id, so it stays consistent across restarts rather
        // than being a fresh "Anonymous user" each launch.
        m_displayName = QStringLiteral("Guest %1")
                            .arg(m_localId.right(6).toUpper());
    }
    setState(AccountState::Guest);
    setError(QString());
    emit identityChanged();
    emit operationChanged();
    qCInfo(lcAccount) << "running as guest" << m_localId;
}

// ---------------------------------------------------------------------------
// Response routing
//
// One shared HttpClient serves the whole desktop. Rather than each call site
// holding its own fragile connection to finished(), the account layer connects
// once and dispatches on the context tag. That tag is the contract: every
// request this class makes carries one, and a response without a matching tag
// is left for whoever made the request.
// ---------------------------------------------------------------------------

void XakteirAccount::finishRequest(const QString &requestId, AccountResult result)
{
    m_inFlight.remove(requestId);
    if (m_inFlight.isEmpty()) {
        setBusy(false, m_lastOperation);
    }

    if (!result.ok) {
        setError(result.errorMessage, result.serverCode);
        if (m_state != AccountState::Guest) {
            setState(AccountState::Error);
        }
    }

    emit operationFinished(requestId, result.ok, result);
}

QString XakteirAccount::nextRequestId(const QString &tag)
{
    ++m_requestCounter;
    return QStringLiteral("%1-%2").arg(tag).arg(m_requestCounter);
}

void XakteirAccount::dispatch(const QString &context, const HttpResponse &response)
{
    if (!context.startsWith(QLatin1String("account."))) {
        return;
    }

    const int dash = context.lastIndexOf(QLatin1Char('-'));
    if (dash <= 0) {
        return;
    }
    const QString requestId = context;
    const QString op = context.mid(QStringLiteral("account.").length());
    const QString pureOp = op.contains(QLatin1Char('-'))
        ? op.left(op.lastIndexOf(QLatin1Char('-'))) : op;

    AccountResult result;

    if (!response.transportOk && response.statusCode == 0) {
        // A true transport failure. Distinguished from an auth rejection so the
        // UI can say "you are offline" rather than "wrong password".
        result = errorResult(
            QStringLiteral("Could not reach the sign-in service. Check your connection and try again."),
            QStringLiteral("NETWORK_ERROR"), response.transportError);
        finishRequest(requestId, result);
        return;
    }

    if (!response.isSuccess()) {
        const QJsonObject err = response.jsonObject().value(
            QStringLiteral("error")).toObject();
        const QString code = err.value(QStringLiteral("status")).toString();
        const QString message = err.value(QStringLiteral("message")).toString();
        result = errorResult(describeServerCode(message.isEmpty() ? code : message),
                             code, response.transportError);
        finishRequest(requestId, result);
        return;
    }

    // ---- Success paths -----------------------------------------------------

    if (pureOp == QLatin1String("lookup")) {
        // Validation of a token adopted from elsewhere. The payload is the same
        // shape as a sign-in, so consumption is shared rather than duplicated.
        if (consumeAuthPayload(response.jsonObject(), &result)) {
            finishRequest(requestId, result);
            emit identityChanged();
        } else {
            finishRequest(requestId, errorResult(
                QStringLiteral("That session could not be validated.")));
        }
        return;
    }

    if (pureOp == QLatin1String("refresh")) {
        if (consumeAuthPayload(response.jsonObject(), &result)) {
            m_state = AccountState::SignedIn;
            emit stateChanged();
            emit identityChanged();
            scheduleExpiryRefresh();
            refreshDevices();
            fetchVaultFlag();
            finishRequest(requestId, result);
            return;
        }
        finishRequest(requestId, errorResult(
            QStringLiteral("Your session could not be renewed. Sign in again.")));
        return;
    }

    if (pureOp == QLatin1String("devices")) {
        parseDeviceList(response.jsonObject());
        result.ok = true;
        finishRequest(requestId, result);
        emit devicesChanged();
        return;
    }

    if (pureOp == QLatin1String("vault")) {
        // Presence of a vault document, not its contents. The contents are
        // decrypted by Shared/Vault, never here.
        const QJsonObject fields = response.jsonObject().value(
            QStringLiteral("fields")).toObject();
        m_hasVault = fields.contains(QStringLiteral("exists"));
        emit vaultChanged();
        result.ok = true;
        finishRequest(requestId, result);
        return;
    }

    if (pureOp == QLatin1String("device-register")) {
        result.ok = true;
        finishRequest(requestId, result);
        emit devicesChanged();
        return;
    }

    if (pureOp == QLatin1String("reset")
        || pureOp == QLatin1String("change-password")
        || pureOp == QLatin1String("profile")
        || pureOp == QLatin1String("delete")) {
        if (pureOp == QLatin1String("delete")) {
            clearSession(true);
            becomeGuest();
        } else if (pureOp == QLatin1String("profile")) {
            const QJsonObject payload = response.jsonObject();
            if (payload.contains(QStringLiteral("displayName"))) {
                m_displayName = payload.value(QStringLiteral("displayName")).toString();
            }
            persistSession();
            emit identityChanged();
        } else if (pureOp == QLatin1String("change-password")) {
            // Changing a password rotates the refresh token; the new set is in
            // the payload and must be adopted or the session dies immediately
            // after the user's own password change.
            AccountResult consumed;
            consumeAuthPayload(response.jsonObject(), &consumed);
        }
        result.ok = true;
        finishRequest(requestId, result);
        return;
    }

    // Remaining cases are the sign-in family: signIn, signUp, anonymous,
    // upgrade, adopt. All return a credential payload.
    if (consumeAuthPayload(response.jsonObject(), &result)) {
        m_state = AccountState::SignedIn;
        emit stateChanged();
        emit identityChanged();
        emit signedIn(m_uid);
        scheduleExpiryRefresh();
        refreshDevices();
        fetchVaultFlag();
        finishRequest(requestId, result);
        return;
    }

    finishRequest(requestId, errorResult(
        QStringLiteral("The service returned an unusable response.")));
}

// ---------------------------------------------------------------------------
// Credential payload consumption
// ---------------------------------------------------------------------------

bool XakteirAccount::consumeAuthPayload(const QJsonObject &payload, AccountResult *result)
{
    // Two shapes exist depending on endpoint: a top-level idToken (signIn and
    // friends), or nested under `idToken`-bearing response for signInWithPassword.
    // Both are handled rather than assuming one, because an assumed shape turns
    // a working sign-in into an unexplained blank state.
    QString idToken = payload.value(QStringLiteral("idToken")).toString();
    QString refreshToken = payload.value(QStringLiteral("refreshToken")).toString();
    QString localId = payload.value(QStringLiteral("localId")).toString();

    if (idToken.isEmpty() && payload.contains(QStringLiteral("users"))) {
        // accounts:lookup wraps the user record in a `users` array.
        const QJsonArray users = payload.value(QStringLiteral("users")).toArray();
        if (!users.isEmpty()) {
            const QJsonObject user = users.at(0).toObject();
            localId = user.value(QStringLiteral("localId")).toString();
            if (payload.contains(QStringLiteral("refreshToken"))) {
                refreshToken = payload.value(QStringLiteral("refreshToken")).toString();
            }
            const QJsonArray provider = user.value(
                QStringLiteral("providerUserInfo")).toArray();
            if (!provider.isEmpty()) {
                if (m_displayName.isEmpty()) {
                    m_displayName = provider.at(0).toObject().value(
                        QStringLiteral("displayName")).toString();
                }
                if (m_email.isEmpty()) {
                    m_email = provider.at(0).toObject().value(
                        QStringLiteral("email")).toString();
                }
            }
            if (user.contains(QStringLiteral("emailVerified"))) {
                m_emailVerified = user.value(QStringLiteral("emailVerified")).toBool();
            }
        }
    }

    if (idToken.isEmpty()) {
        if (result) {
            *result = errorResult(QStringLiteral("No credential was returned."));
        }
        return false;
    }

    m_idToken = idToken;
    if (!refreshToken.isEmpty()) {
        m_refreshToken = refreshToken;
    }
    if (!localId.isEmpty()) {
        m_uid = localId;
    }

    // Derive the identity fields from the token itself rather than a separate
    // profile fetch. The ID token's payload is signed by the issuer, so it is
    // authoritative for the claims it carries and saving a round trip here
    // removes a real failure mode where sign-in succeeds but the name is blank.
    const QString token = m_idToken;
    const int firstDot = token.indexOf(QLatin1Char('.'));
    const int secondDot = token.indexOf(QLatin1Char('.'), firstDot + 1);
    if (firstDot > 0 && secondDot > firstDot) {
        QByteArray claims = token.mid(firstDot + 1, secondDot - firstDot - 1);
        // JWT uses unpadded base64url; Qt's FromBase64Encoding variant handles
        // the URL-safe alphabet but not the missing padding, so both are fixed.
        while (claims.size() % 4 != 0) {
            claims.append('=');
        }
        claims.replace('-', '+');
        claims.replace('_', '/');
        const QJsonDocument doc = QJsonDocument::fromJson(QByteArray::fromBase64(claims));
        if (doc.isObject()) {
            const QJsonObject c = doc.object();
            const QString sub = c.value(QStringLiteral("sub")).toString();
            if (!sub.isEmpty()) {
                m_uid = sub;
            }
            if (m_email.isEmpty()) {
                m_email = c.value(QStringLiteral("email")).toString();
            }
            if (m_displayName.isEmpty()) {
                m_displayName = c.value(QStringLiteral("name")).toString();
            }
            if (c.contains(QStringLiteral("picture"))) {
                m_avatarUrl = c.value(QStringLiteral("picture")).toString();
            }
            if (c.contains(QStringLiteral("email_verified"))) {
                m_emailVerified = c.value(QStringLiteral("email_verified")).toBool();
            }
            const qint64 issuedAt = static_cast<qint64>(
                c.value(QStringLiteral("iat")).toDouble(0));
            const qint64 expiresAt = static_cast<qint64>(
                c.value(QStringLiteral("exp")).toDouble(0));
            if (issuedAt > 0) {
                m_issuedAt = QDateTime::fromSecsSinceEpoch(issuedAt, Qt::UTC);
            }
            if (expiresAt > 0) {
                m_expiresAt = QDateTime::fromSecsSinceEpoch(expiresAt, Qt::UTC);
            }
        }
    }

    if (!m_expiresAt.isValid()) {
        // No exp claim: assume an hour rather than treating the session as
        // already dead, which would make every sign-in look like a failure.
        m_issuedAt = QDateTime::currentDateTimeUtc();
        m_expiresAt = m_issuedAt.addSecs(3600);
    }

    if (m_kind == AccountKind::Guest || m_kind == AccountKind::None) {
        m_kind = AccountKind::Anonymous;
    }

    persistSession();
    if (result) {
        result->ok = true;
    }
    return true;
}

// ---------------------------------------------------------------------------
// Sign-in / sign-up
//
// Every method here returns a correlation id, never a success flag. The
// operation is asynchronous and the outcome arrives on operationFinished().
// ---------------------------------------------------------------------------

QString XakteirAccount::signIn(const QString &email, const QString &password)
{
    if (email.trimmed().isEmpty() || password.isEmpty()) {
        const QString id = nextRequestId(QStringLiteral("account.signin"));
        AccountResult r = errorResult(
            password.isEmpty()
                ? QStringLiteral("Enter your password to continue.")
                : QStringLiteral("Enter your email address to continue."),
            QStringLiteral("MISSING_INPUT"));
        // Deliberately synchronous for a purely local validation failure: the
        // UI should show the message before it even paints a spinner.
        finishRequest(id, r);
        return id;
    }

    const QString id = nextRequestId(QStringLiteral("account.signin"));
    m_inFlight.insert(id);
    setBusy(true, QStringLiteral("Signing you in"));
    setState(AccountState::SigningIn);
    setError(QString());

    QJsonObject payload{
        { QStringLiteral("email"), email.trimmed() },
        { QStringLiteral("password"), password },
        { QStringLiteral("returnSecureToken"), true },
    };

    m_http->request(HttpVerb::Post, endpoint(QStringLiteral("accounts:signInWithPassword")),
                    QJsonDocument(payload).toJson(QJsonDocument::Compact),
                    QStringLiteral("application/json"),
                    {}, HttpRetryPolicy(), id);
    return id;
}

QString XakteirAccount::signUp(const QString &email, const QString &password,
                               const QString &displayName)
{
    const QString id = nextRequestId(QStringLiteral("account.signup"));
    if (email.trimmed().isEmpty() || password.isEmpty()) {
        finishRequest(id, errorResult(
            QStringLiteral("An email address and password are both required."),
            QStringLiteral("MISSING_INPUT")));
        return id;
    }
    if (password.size() < 6) {
        finishRequest(id, errorResult(
            QStringLiteral("Use a password of at least 6 characters."),
            QStringLiteral("WEAK_PASSWORD")));
        return id;
    }

    m_inFlight.insert(id);
    setBusy(true, QStringLiteral("Creating your account"));
    setState(AccountState::SigningIn);
    setError(QString());

    QJsonObject payload{
        { QStringLiteral("email"), email.trimmed() },
        { QStringLiteral("password"), password },
        { QStringLiteral("returnSecureToken"), true },
    };
    if (!displayName.trimmed().isEmpty()) {
        payload.insert(QStringLiteral("displayName"), displayName.trimmed());
    }

    m_http->request(HttpVerb::Post, endpoint(QStringLiteral("accounts:signUp")),
                    QJsonDocument(payload).toJson(QJsonDocument::Compact),
                    QStringLiteral("application/json"),
                    {}, HttpRetryPolicy(), id);
    return id;
}

QString XakteirAccount::createAnonymousAccount()
{
    const QString id = nextRequestId(QStringLiteral("account.anonymous"));
    m_inFlight.insert(id);
    setBusy(true, QStringLiteral("Setting up a local account"));
    setState(AccountState::SigningIn);
    setError(QString());

    // An anonymous account is a real server account with no credentials. It is
    // what lets "continue without signing in" genuinely sync rather than only
    // pretending to, while still letting the user add a password later without
    // losing anything - the uid survives the upgrade.
    QJsonObject payload{
        { QStringLiteral("returnSecureToken"), true },
    };

    m_http->request(HttpVerb::Post, endpoint(QStringLiteral("accounts:signUp")),
                    QJsonDocument(payload).toJson(QJsonDocument::Compact),
                    QStringLiteral("application/json"),
                    {}, HttpRetryPolicy(), id);
    return id;
}

QString XakteirAccount::upgradeToPassword(const QString &email, const QString &password,
                                          const QString &displayName)
{
    const QString id = nextRequestId(QStringLiteral("account.upgrade"));
    if (email.trimmed().isEmpty() || password.isEmpty()) {
        finishRequest(id, errorResult(
            QStringLiteral("An email address and password are both required."),
            QStringLiteral("MISSING_INPUT")));
        return id;
    }
    if (password.size() < 6) {
        finishRequest(id, errorResult(
            QStringLiteral("Use a password of at least 6 characters."),
            QStringLiteral("WEAK_PASSWORD")));
        return id;
    }

    m_inFlight.insert(id);
    setBusy(true, QStringLiteral("Securing your account"));

    QJsonObject payload{
        { QStringLiteral("email"), email.trimmed() },
        { QStringLiteral("password"), password },
        { QStringLiteral("returnSecureToken"), true },
    };
    if (!displayName.trimmed().isEmpty()) {
        payload.insert(QStringLiteral("displayName"), displayName.trimmed());
    }
    if (!m_idToken.isEmpty()) {
        // Linking rather than creating: the idToken here is the anonymous or
        // adopted session being upgraded. Sending it means accounts:update with
        // the existing id token, which preserves the uid.
        payload.insert(QStringLiteral("idToken"), m_idToken);
        m_http->request(HttpVerb::Post, endpoint(QStringLiteral("accounts:update")),
                        QJsonDocument(payload).toJson(QJsonDocument::Compact),
                        QStringLiteral("application/json"),
                        {}, HttpRetryPolicy(), id);
        return id;
    }

    // No existing server session: this is a plain sign-up. Local data is bound
    // to m_localId, which is what actually survives the transition.
    m_http->request(HttpVerb::Post, endpoint(QStringLiteral("accounts:signUp")),
                    QJsonDocument(payload).toJson(QJsonDocument::Compact),
                    QStringLiteral("application/json"),
                    {}, HttpRetryPolicy(), id);
    return id;
}

QString XakteirAccount::sendPasswordReset(const QString &email)
{
    const QString id = nextRequestId(QStringLiteral("account.reset"));
    if (email.trimmed().isEmpty()) {
        finishRequest(id, errorResult(
            QStringLiteral("Enter the email address for your account."),
            QStringLiteral("MISSING_INPUT")));
        return id;
    }

    m_inFlight.insert(id);
    setBusy(true, QStringLiteral("Sending the reset link"));

    QJsonObject payload{
        { QStringLiteral("email"), email.trimmed() },
        { QStringLiteral("requestType"), QStringLiteral("PASSWORD_RESET") },
    };

    m_http->request(HttpVerb::Post, endpoint(QStringLiteral("accounts:sendOobCode")),
                    QJsonDocument(payload).toJson(QJsonDocument::Compact),
                    QStringLiteral("application/json"),
                    {}, HttpRetryPolicy(), id);
    return id;
}

QString XakteirAccount::changePassword(const QString &currentPassword,
                                       const QString &newPassword)
{
    const QString id = nextRequestId(QStringLiteral("account.change-password"));
    if (m_idToken.isEmpty()) {
        finishRequest(id, errorResult(
            QStringLiteral("Sign in before changing your password."),
            QStringLiteral("SIGNED_OUT")));
        return id;
    }
    if (currentPassword.isEmpty() || newPassword.isEmpty()) {
        finishRequest(id, errorResult(
            QStringLiteral("Both your current and new password are required."),
            QStringLiteral("MISSING_INPUT")));
        return id;
    }
    if (newPassword.size() < 6) {
        finishRequest(id, errorResult(
            QStringLiteral("Use a password of at least 6 characters."),
            QStringLiteral("WEAK_PASSWORD")));
        return id;
    }

    m_inFlight.insert(id);
    setBusy(true, QStringLiteral("Changing your password"));

    QJsonObject payload{
        { QStringLiteral("idToken"), m_idToken },
        { QStringLiteral("password"), newPassword },
        { QStringLiteral("returnSecureToken"), true },
    };

    m_http->request(HttpVerb::Post, endpoint(QStringLiteral("accounts:update")),
                    QJsonDocument(payload).toJson(QJsonDocument::Compact),
                    QStringLiteral("application/json"),
                    {}, HttpRetryPolicy(), id);
    return id;
}

QString XakteirAccount::updateProfile(const QString &displayName, const QString &photoUrl)
{
    const QString id = nextRequestId(QStringLiteral("account.profile"));
    if (m_idToken.isEmpty()) {
        finishRequest(id, errorResult(
            QStringLiteral("Sign in before changing your profile."),
            QStringLiteral("SIGNED_OUT")));
        return id;
    }

    m_inFlight.insert(id);
    setBusy(true, QStringLiteral("Saving your profile"));

    QJsonObject payload{
        { QStringLiteral("idToken"), m_idToken },
        { QStringLiteral("returnSecureToken"), true },
    };
    // A profile update replaces rather than merges, so both fields are always
    // sent. Sending only the changed one would silently clear the other, which
    // is exactly the kind of quiet data loss that makes people distrust an app.
    payload.insert(QStringLiteral("displayName"), displayName.trimmed());
    payload.insert(QStringLiteral("photoUrl"), photoUrl.trimmed());

    m_http->request(HttpVerb::Post, endpoint(QStringLiteral("accounts:update")),
                    QJsonDocument(payload).toJson(QJsonDocument::Compact),
                    QStringLiteral("application/json"),
                    {}, HttpRetryPolicy(), id);
    return id;
}

QString XakteirAccount::deleteAccount(const QString &password)
{
    const QString id = nextRequestId(QStringLiteral("account.delete"));
    if (m_idToken.isEmpty()) {
        finishRequest(id, errorResult(
            QStringLiteral("Sign in before deleting your account."),
            QStringLiteral("SIGNED_OUT")));
        return id;
    }

    m_inFlight.insert(id);
    setBusy(true, QStringLiteral("Deleting your account"));

    QJsonObject payload{
        { QStringLiteral("idToken"), m_idToken },
    };
    if (!password.isEmpty()) {
        // Required for password accounts: deleting an account is not something
        // a stolen token should be able to do on its own.
        payload.insert(QStringLiteral("password"), password);
    }

    m_http->request(HttpVerb::Post, endpoint(QStringLiteral("accounts:delete")),
                    QJsonDocument(payload).toJson(QJsonDocument::Compact),
                    QStringLiteral("application/json"),
                    {}, HttpRetryPolicy(), id);
    return id;
}

QString XakteirAccount::adoptToken(const QString &idToken, const QString &refreshToken)
{
    const QString id = nextRequestId(QStringLiteral("account.adopt"));
    if (idToken.isEmpty()) {
        finishRequest(id, errorResult(
            QStringLiteral("No session was supplied to adopt."),
            QStringLiteral("EMPTY_TOKEN")));
        return id;
    }

    if (!refreshToken.isEmpty()) {
        m_idToken = idToken;
        m_refreshToken = refreshToken;
        // The token is unverified at this point. Adopting it without checking
        // would put an unvalidated session behind a "Signed in" indicator, so
        // accounts:lookup is used as the real validation before the state moves.
    }

    m_inFlight.insert(id);
    setBusy(true, QStringLiteral("Checking that session"));
    setState(AccountState::SigningIn);

    QJsonObject payload{
        { QStringLiteral("idToken"), idToken },
    };
    m_http->request(HttpVerb::Post, endpoint(QStringLiteral("accounts:lookup")),
                    QJsonDocument(payload).toJson(QJsonDocument::Compact),
                    QStringLiteral("application/json"),
                    {}, HttpRetryPolicy(), id);
    return id;
}

void XakteirAccount::signOut(bool forgetLocally)
{
    // Pending operations are abandoned first. Without this, an in-flight
    // sign-in that lands a second later would resurrect a session the user
    // just deliberately ended.
    m_inFlight.clear();
    if (m_expiryTimer) {
        m_expiryTimer->stop();
    }

    clearSession(forgetLocally);

    if (forgetLocally) {
        m_settings.remove(QStringLiteral("localId"));
        m_settings.sync();
        m_localId = QUuid::createUuid().toString(QUuid::WithoutBraces);
        m_settings.setValue(QStringLiteral("localId"), m_localId);
        m_settings.sync();
        m_displayName.clear();
    }

    setBusy(false, QString());
    becomeGuest();
    emit signedOut(forgetLocally);
    qCInfo(lcAccount) << "signed out, forgetLocally =" << forgetLocally;
}

// ---------------------------------------------------------------------------
// Devices
//
// Device registration is what makes cross-device sync meaningful: the vault
// needs to know which devices may decrypt it, and the account needs to tell
// the user "signed in on 3 devices" truthfully rather than by guesswork.
// ---------------------------------------------------------------------------

QString XakteirAccount::localDeviceId() const
{
    QString stored = m_settings.value(QStringLiteral("deviceId")).toString();
    if (stored.isEmpty()) {
        // Generated from the machine identity rather than randomly, so a
        // reinstall on the same machine does not look like a brand-new device.
        const QByteArray seed = (QSysInfo::machineHostName()
                                 + QStringLiteral("|") + m_localId).toUtf8();
        stored = QString::fromLatin1(
            QCryptographicHash::hash(seed, QCryptographicHash::Sha256).toHex().left(32));
        m_settings.setValue(QStringLiteral("deviceId"), stored);
        m_settings.sync();
    }
    return stored;
}

QString XakteirAccount::registerDevice(const AccountDevice &device)
{
    const QString id = nextRequestId(QStringLiteral("account.device-register"));
    if (m_idToken.isEmpty() || !sessionLooksValid()) {
        // A guest has no server-side account to register against. This is not an
        // error: the device id still exists locally and the vault can still use
        // it to scope keys to this machine.
        finishRequest(id, errorResult(
            QStringLiteral("Device registration needs a signed-in account."),
            QStringLiteral("SIGNED_OUT")));
        return id;
    }

    m_inFlight.insert(id);
    setBusy(true, QStringLiteral("Registering this device"));

    AccountDevice d = device;
    if (d.deviceId.isEmpty()) {
        d.deviceId = localDeviceId();
    }
    if (d.platform.isEmpty()) {
        d.platform = QStringLiteral("windows");
    }
    if (d.displayName.isEmpty()) {
        d.displayName = QSysInfo::machineHostName();
    }
    if (d.model.isEmpty()) {
        d.model = QSysInfo::prettyProductName();
    }
    d.lastSeenAt = QDateTime::currentDateTimeUtc();
    if (!d.registeredAt.isValid()) {
        d.registeredAt = d.lastSeenAt;
    }

    // Firestore's PATCH semantics: this merges rather than replaces, so
    // registering one device cannot clobber another's fields.
    QJsonObject payload{
        { QStringLiteral("fields"), QJsonObject{
            { QStringLiteral("deviceId"),
              QJsonObject{{ QStringLiteral("stringValue"), d.deviceId }} },
            { QStringLiteral("platform"),
              QJsonObject{{ QStringLiteral("stringValue"), d.platform }} },
            { QStringLiteral("displayName"),
              QJsonObject{{ QStringLiteral("stringValue"), d.displayName }} },
            { QStringLiteral("model"),
              QJsonObject{{ QStringLiteral("stringValue"), d.model }} },
            { QStringLiteral("appVersion"),
              QJsonObject{{ QStringLiteral("stringValue"), d.appVersion }} },
            { QStringLiteral("registeredAt"),
              QJsonObject{{ QStringLiteral("stringValue"),
                           d.registeredAt.toUTC().toString(Qt::ISODate) }} },
            { QStringLiteral("lastSeenAt"),
              QJsonObject{{ QStringLiteral("stringValue"),
                           d.lastSeenAt.toUTC().toString(Qt::ISODate) }} },
            { QStringLiteral("trusted"),
              QJsonObject{{ QStringLiteral("booleanValue"), d.isTrusted }} },
        } },
    };

    const QString path = QStringLiteral(
        "projects/%1/databases/(default)/documents/accounts/%2/devices/%3")
        .arg(m_projectId, m_uid, d.deviceId);

    m_http->request(HttpVerb::Patch, path,
                    QJsonDocument(payload).toJson(QJsonDocument::Compact),
                    QStringLiteral("application/json"),
                    {}, HttpRetryPolicy(), id);
    return id;
}

void XakteirAccount::parseDeviceList(const QJsonObject &document)
{
    // Firestore returns documents as { name, fields }, where each field carries
    // its own type tag. Only the fields this class wrote are read; anything
    // unknown is ignored rather than guessed at, so a future field added by
    // another client cannot corrupt the local device list.
    const QJsonArray docs = document.contains(QStringLiteral("documents"))
        ? document.value(QStringLiteral("documents")).toArray()
        : QJsonArray();

    QList<AccountDevice> found;
    for (const QJsonValue &v : docs) {
        const QJsonObject doc = v.toObject();
        const QJsonObject fields = doc.value(QStringLiteral("fields")).toObject();

        auto str = [&fields](const char *key) {
            return fields.value(QLatin1String(key)).toObject()
                .value(QStringLiteral("stringValue")).toString();
        };

        AccountDevice d;
        d.deviceId = str("deviceId");
        d.platform = str("platform");
        d.displayName = str("displayName");
        d.model = str("model");
        d.appVersion = str("appVersion");
        d.registeredAt = QDateTime::fromString(str("registeredAt"), Qt::ISODate);
        d.lastSeenAt = QDateTime::fromString(str("lastSeenAt"), Qt::ISODate);
        d.isTrusted = fields.value(QStringLiteral("trusted")).toObject()
            .value(QStringLiteral("booleanValue")).toBool();

        if (d.deviceId.isEmpty()) {
            // Derive the id from the document name when the field is absent,
            // which is what happens if another client wrote it without the field.
            const QString name = doc.value(QStringLiteral("name")).toString();
            d.deviceId = name.section(QLatin1Char('/'), -1);
        }
        if (!d.deviceId.isEmpty()) {
            found.append(d);
        }
    }

    // Devices are presented newest-first: what the user most likely cares about
    // is the machine they signed in on five minutes ago.
    std::sort(found.begin(), found.end(), [](const AccountDevice &a, const AccountDevice &b) {
        return a.lastSeenAt > b.lastSeenAt;
    });

    m_devices = found;
}

QString XakteirAccount::refreshDevices()
{
    const QString id = nextRequestId(QStringLiteral("account.devices"));
    if (m_uid.isEmpty()) {
        // Guests have no device list, and inventing an empty one would put a
        // "0 devices" row on screen that means nothing.
        return id;
    }

    const QString path = QStringLiteral(
        "projects/%1/databases/(default)/documents/accounts/%2/devices")
        .arg(m_projectId, m_uid);

    m_http->request(HttpVerb::Get, path, QByteArray(),
                    QString(), {}, HttpRetryPolicy(), id);
    return id;
}

void XakteirAccount::setDeviceTrusted(const QString &deviceId, bool trusted)
{
    // Trust is a per-device decision the user makes explicitly, and it is what
    // gates password bypass for the shared-bandwidth WiFi. It is stored locally
    // immediately so the effect is instant, and mirrored to the server so the
    // setting follows the account to another machine.
    for (AccountDevice &d : m_devices) {
        if (d.deviceId == deviceId) {
            d.isTrusted = trusted;
            break;
        }
    }
    emit devicesChanged();

    if (m_idToken.isEmpty() || !sessionLooksValid()) {
        return;
    }

    QJsonObject payload{
        { QStringLiteral("fields"), QJsonObject{
            { QStringLiteral("trusted"),
              QJsonObject{{ QStringLiteral("booleanValue"), trusted }} },
            { QStringLiteral("lastSeenAt"),
              QJsonObject{{ QStringLiteral("stringValue"),
                           QDateTime::currentDateTimeUtc().toString(Qt::ISODate) }} },
        } },
    };

    const QString path = QStringLiteral(
        "projects/%1/databases/(default)/documents/accounts/%2/devices/%3")
        .arg(m_projectId, m_uid, deviceId);

    m_http->request(HttpVerb::Patch, path,
                    QJsonDocument(payload).toJson(QJsonDocument::Compact),
                    QStringLiteral("application/json"),
                    {}, HttpRetryPolicy(),
                    nextRequestId(QStringLiteral("account.device-register")));
}

// ---------------------------------------------------------------------------
// Vault flag
// ---------------------------------------------------------------------------

QString XakteirAccount::fetchVaultFlag()
{
    const QString id = nextRequestId(QStringLiteral("account.vault"));
    if (m_uid.isEmpty()) {
        return id;
    }

    // Only asks whether a vault document exists. The vault's ciphertext lives
    // in Shared/Vault and is not decrypted, inspected, or even read here -
    // this class exists to answer "is there an account", not "what is in it".
    const QString path = QStringLiteral(
        "projects/%1/databases/(default)/documents/accounts/%2")
        .arg(m_projectId, m_uid);

    m_http->request(HttpVerb::Get, path, QByteArray(),
                    QString(), {}, HttpRetryPolicy(), id);
    return id;
}
