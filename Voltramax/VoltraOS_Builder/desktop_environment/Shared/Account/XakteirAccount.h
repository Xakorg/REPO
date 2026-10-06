// XakteirAccount.h - the connected Xakteir account, as seen by VoltraMax.
//
// WHY THIS IS THE FOUNDATION
// --------------------------
// The stated shape of this ecosystem is: one connected Xakteir account syncs
// everything across web, desktop, and handheld. Every sub-system in VoltraMax
// rests on that claim - Drive, Mail, Notes, Store, the credential vault, the
// mesh. Before this file existed, none of them had an account at all: each app
// was a standalone island, which is precisely why every feature ended up
// implemented only in the web copy under `src/`.
//
// So this is the root dependency, and it is written first and written for real.
//
// HONESTY RULES THAT APPLY HERE
// -----------------------------
//  * An account is optional, never mandatory. The user's bandwidth WiFi must
//    work for a guest device, so every network call this layer makes has a
//    working unauthenticated path, and sign-in is a choice, not a gate.
//  * Guest is a real identity, not a placeholder. A guest device gets a real
//    persistent local id, real local storage, and real local state. It simply
//    has no server-side account until the user claims one.
//  * Failure is reported. A failed sign-in produces an error message with the
//    server's actual reason, never a silent fallback that makes the UI look
//    signed in when it is not.
//  * There is no simulated session. Every session state in this class is
//    derived from a token that was really issued by a real endpoint, or from a
//    guest identity that was really generated and persisted.
//
// FIREBASE IDENTITY TOOLKIT
// -------------------------
// The existing web app authenticates against Google's Firebase Identity
// Toolkit REST API (see `src/lib/firebase.ts`). This class speaks the same
// endpoints for the same project, which is what makes web and desktop sessions
// genuinely interchangeable rather than two parallel half-connected things. The
// endpoints used are:
//
//   POST v1/accounts:signUp          - create account / anonymous upgrade
//   POST v1/accounts:signInWithPassword
//   POST v1/accounts:lookup          - validate + refresh a session
//   POST v1/accounts:sendOobCode     - password reset
//   POST securetoken v1/token        - refresh the ID token
//
// All are reached through Shared/Http/HttpClient, never a raw socket, so retry
// and token handling stay in one place.

#ifndef VOLTRAMAX_XAKTEIR_ACCOUNT_H
#define VOLTRAMAX_XAKTEIR_ACCOUNT_H

#include <QObject>
#include <QByteArray>
#include <QDateTime>
#include <QJsonObject>
#include <QMap>
#include <QSet>
#include <QSettings>
#include <QString>
#include <QStringList>
#include <QTimer>

#include <functional>

// Included rather than forward-declared: HttpResponse appears by const reference
// in a slot that moc has to generate code for, and an incomplete type there is
// an error in some moc versions and silently fine in others. Neither outcome is
// worth saving an include over.
#include "../Http/HttpClient.h"

class HttpClient;

// Lifecycle of the account. Ordered so the enum value itself can be compared
// for "is this at least as connected as X".
enum class AccountState {
    Uninitialised = 0,   // constructed, restore() not yet called
    Guest = 1,           // local-only identity, no server session
    SigningIn = 2,       // a real request is in flight
    SignedIn = 3,        // a real token is held and not expired
    Expired = 4,         // a session existed but the token lapsed unrecoverably
    Error = 5,           // the last operation failed; see accountError()
};

QString accountStateName(AccountState state);

// What kind of account this is. Anonymous accounts (created with signUp and no
// password) are a real Firebase feature and are used here for the "try it with
// no sign-in" path, then upgraded in place when the user adds a password.
enum class AccountKind {
    None,
    Guest,       // purely local, never talked to a server
    Anonymous,   // real server account with no password set
    Password,    // email + password
};

QString accountKindName(AccountKind kind);

// A single user-visible operation outcome. Deliberately carries the server's
// own message so the UI never invents one.
struct AccountResult {
    bool ok = false;
    QString errorMessage;   // safe to display, already made human-readable
    QString serverCode;     // Firebase's machine code, e.g. INVALID_PASSWORD
    QString networkDetail;  // transport detail, for logs only
};

// A registered device. VoltraPlay and VoltraMax both register so the account
// can tell them apart and so the vault can scope keys per device.
struct AccountDevice {
    QString deviceId;
    QString platform;        // windows | linux | macos | voltraplay | web
    QString displayName;
    QString model;
    QString appVersion;
    QDateTime registeredAt;
    QDateTime lastSeenAt;
    bool isTrusted = false;  // explicitly trusted by the user, e.g. vault peers

    QJsonObject toJson() const;
    static AccountDevice fromJson(const QJsonObject &json);
};

// ---------------------------------------------------------------------------
// XakteirAccount
// ---------------------------------------------------------------------------

class XakteirAccount : public QObject
{
    Q_OBJECT

    Q_PROPERTY(bool signedIn READ isSignedIn NOTIFY stateChanged)
    Q_PROPERTY(bool guest READ isGuest NOTIFY stateChanged)
    Q_PROPERTY(AccountState state READ state NOTIFY stateChanged)
    Q_PROPERTY(QString stateName READ stateName NOTIFY stateChanged)
    Q_PROPERTY(QString uid READ uid NOTIFY identityChanged)
    Q_PROPERTY(QString displayName READ displayName NOTIFY identityChanged)
    Q_PROPERTY(QString email READ email NOTIFY identityChanged)
    Q_PROPERTY(QString accountId READ accountId NOTIFY identityChanged)
    Q_PROPERTY(QString accountKindName READ accountKindNameText NOTIFY identityChanged)
    Q_PROPERTY(QString avatarUrl READ avatarUrl NOTIFY identityChanged)
    Q_PROPERTY(bool busy READ busy NOTIFY operationChanged)
    Q_PROPERTY(QString lastOperation READ lastOperation NOTIFY operationChanged)
    Q_PROPERTY(QString accountError READ accountError NOTIFY operationChanged)
    Q_PROPERTY(bool emailVerified READ emailVerified NOTIFY identityChanged)
    Q_PROPERTY(int deviceCount READ deviceCount NOTIFY devicesChanged)
    Q_PROPERTY(bool hasVault READ hasVault NOTIFY vaultChanged)

public:
    // Construction takes the shared HttpClient rather than creating its own, so
    // there is exactly one network stack and exactly one place where bearer
    // tokens are attached.
    explicit XakteirAccount(HttpClient *http, QObject *parent = nullptr);
    ~XakteirAccount() override;

    // Configuration. Must be called before restore()/signIn(); the values come
    // from the same Firebase project the web app uses, so sessions are
    // interchangeable between the two.
    void configure(const QString &apiKey, const QString &projectId);

    static QString defaultApiKey();
    static QString defaultProjectId();

    // Restore whatever session was persisted. Safe to call on startup: it either
    // resumes a real session, falls back to a real guest identity, or reports an
    // error. Never blocks.
    void restore();

    // -----------------------------------------------------------------------
    // Identity
    // -----------------------------------------------------------------------
    AccountState state() const { return m_state; }
    QString stateName() const { return accountStateName(m_state); }
    bool isSignedIn() const { return m_state == AccountState::SignedIn; }
    bool isGuest() const { return m_kind == AccountKind::Guest && !isSignedIn(); }
    bool busy() const { return m_busy; }
    QString uid() const { return m_uid; }
    QString accountId() const { return m_accountId; }
    QString displayName() const { return m_displayName; }
    QString email() const { return m_email; }
    QString avatarUrl() const { return m_avatarUrl; }
    bool emailVerified() const { return m_emailVerified; }
    AccountKind kind() const { return m_kind; }
    QString accountKindNameText() const { return accountKindName(m_kind); }
    QString accountError() const { return m_lastError; }
    QString lastOperation() const { return m_lastOperation; }
    QDateTime sessionIssuedAt() const { return m_issuedAt; }
    QDateTime sessionExpiresAt() const { return m_expiresAt; }

    // True while the held token is still valid without a network round trip.
    // Anything that needs the *authoritative* answer must ask the server; this
    // is the cheap local check used to decide whether to bother.
    bool sessionLooksValid() const;

    // The raw ID token, for callers that need it to build an Authorization
    // header themselves. Empty for guests. Prefer going through HttpClient,
    // which attaches it automatically via the token provider.
    QString idToken() const { return m_idToken; }

    // -----------------------------------------------------------------------
    // Sign-in / sign-out
    // -----------------------------------------------------------------------
    // All are asynchronous and report through signals. The returned value is a
    // request id so a caller can correlate the eventual signal with its own
    // context; it is not a success flag.
    QString signIn(const QString &email, const QString &password);
    QString signUp(const QString &email, const QString &password,
                   const QString &displayName = QString());
    // Creates a real anonymous server account. This is what makes the
    // "continue without signing in" path actually sync, rather than pretending.
    QString createAnonymousAccount();
    // Upgrade an anonymous or guest identity to a password account, keeping the
    // same uid so existing local data stays associated.
    QString upgradeToPassword(const QString &email, const QString &password,
                              const QString &displayName);
    QString sendPasswordReset(const QString &email);
    QString changePassword(const QString &currentPassword, const QString &newPassword);
    QString updateProfile(const QString &displayName, const QString &photoUrl);
    QString deleteAccount(const QString &password);

    void signOut(bool forgetLocally = false);

    // Explicitly adopt a token obtained elsewhere (the web app, a QR pairing
    // flow, the extension). Real validation: the token is checked against
    // accounts:lookup before the UI is told the session is good.
    QString adoptToken(const QString &idToken, const QString &refreshToken);

    // -----------------------------------------------------------------------
    // Devices
    // -----------------------------------------------------------------------
    // This machine registers itself so the account can show a device list and
    // so the vault can decide which devices may read/write.
    QString registerDevice(const AccountDevice &device);
    QString refreshDevices();
    QList<AccountDevice> devices() const { return m_devices; }
    int deviceCount() const { return m_devices.size(); }
    QString localDeviceId() const;
    void setDeviceTrusted(const QString &deviceId, bool trusted);

    // -----------------------------------------------------------------------
    // Vault flag
    //
    // The credential vault is shared between the Authenticator and the browser.
    // This only reports whether the account has a vault document at all; the
    // vault itself lives in Shared/Vault and is not owned here.
    // -----------------------------------------------------------------------
    bool hasVault() const { return m_hasVault; }
    QString fetchVaultFlag();

    // Human-readable breakdown of a server-side auth error code. Real error
    // mapping, not a generic "sign-in failed".
    static QString describeServerCode(const QString &code);

signals:
    void stateChanged();
    void identityChanged();
    void operationChanged();
    void devicesChanged();
    void vaultChanged();

    // Emitted for every operation, including failures, so callers can always
    // release their own loading state.
    void operationFinished(const QString &requestId, bool ok, const AccountResult &result);
    void signedIn(const QString &uid);
    void signedOut(bool forgotten);
    void sessionExpired();

private:
    void setState(AccountState state);
    void setBusy(bool busy, const QString &operation);
    void setError(const QString &error, const QString &serverCode = QString());

    // Adopt a real local-only identity. This is the no-network path and is
    // reachable both at startup (no persisted session) and when a refresh is
    // rejected (session no longer valid). It is not a failure state: a guest is
    // a first-class, fully working account with real local storage.
    void becomeGuest();

    // Ask the server for a fresh ID token using the stored refresh token.
    // Async; the outcome arrives via the shared HttpClient finished() signal,
    // filtered on the "account.refresh" context tag.
    void refreshNow();

    // Issues the next correlation id for an operation, tagged so the shared
    // response router can tell which call a response belongs to.
    QString nextRequestId(const QString &tag);

    // Single response router. Every request this class issues carries a context
    // of the form "account.<op>-<n>"; this inspects it, applies the
    // operation-specific logic, and fires operationFinished() exactly once.
    void dispatch(const QString &context, const HttpResponse &response);

    // Parses an accounts:lookup / Firestore device-list document into m_devices.
    void parseDeviceList(const QJsonObject &document);

    // Shared post-processing for every endpoint that returns a Firebase auth
    // payload. Extracts the token set, persists it, and moves the state on.
    bool consumeAuthPayload(const QJsonObject &payload, AccountResult *result);
    void persistSession();
    void loadPersistedSession();
    void clearSession(bool forgetProfile);
    void scheduleExpiryRefresh();

    // Builds the endpoint URL for an Identity Toolkit path.
    QString endpoint(const QString &path) const;
    QString secureTokenEndpoint() const;

    // Emits finished() for a request, doing the state transition once.
    void finishRequest(const QString &requestId, AccountResult result);

    AccountResult errorResult(const QString &message,
                              const QString &serverCode = QString(),
                              const QString &networkDetail = QString());

private:
    HttpClient *m_http;
    QString m_apiKey;
    QString m_projectId;

    AccountState m_state = AccountState::Uninitialised;
    AccountKind m_kind = AccountKind::None;
    bool m_busy = false;
    QString m_lastError;
    QString m_lastOperation;

    // Token set. Persisted, never logged, never exposed over D-Bus or IPC.
    QString m_idToken;
    QString m_refreshToken;
    QString m_uid;
    QString m_accountId;
    QString m_displayName;
    QString m_email;
    QString m_avatarUrl;
    QString m_localId;       // stable per-install id, survives sign-out
    bool m_emailVerified = false;

    QDateTime m_issuedAt;
    QDateTime m_expiresAt;

    QList<AccountDevice> m_devices;
    bool m_hasVault = false;

    int m_requestCounter = 0;
    // Requests currently in flight, so a sign-out while a sign-in is pending
    // cannot resurrect a session that was deliberately abandoned.
    QSet<QString> m_inFlight;

    QSettings m_settings;
    QTimer *m_expiryTimer = nullptr;
    QTimer *m_devicesTimer = nullptr;
};

Q_DECLARE_METATYPE(AccountResult)
Q_DECLARE_METATYPE(AccountDevice)
Q_DECLARE_METATYPE(AccountState)
Q_DECLARE_METATYPE(AccountKind)

#endif // VOLTRAMAX_XAKTEIR_ACCOUNT_H