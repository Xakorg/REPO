# Shared — the VoltraMax platform layer

This directory is the root dependency of every app in the VoltraOS binary.

## Why it exists

VoltraMax is built as one monolithic executable: `Browser`, `Chat`, `Drive`,
`Files`, `Games`, `Installer`, `Store`, `Stream`, `Terminal`, `Weather`, `XakAI`
and every app added afterwards are compiled into a single `VoltraOS` target.

Before this layer existed, none of those apps had an account, a network stack,
or any way to sync. Each was a standalone island with its own local state. That
is precisely why, when the features were first built, they ended up implemented
only in the web copies under `src/` — the native apps had nowhere to send data.

`Shared/` is the fix. It supplies the three things every app needs and none of
them should independently reinvent:

| Component | Responsibility |
| --- | --- |
| `Shared/Http/HttpClient` | The single HTTP egress point for the whole binary |
| `Shared/Account/XakteirAccount` | The connected Xakteir account |
| `Shared/mesh/*` | Pooled-bandwidth networking (deliberately Qt-free) |

## Design rules

1. **One network stack.** `HttpClient` is the only place that constructs a
   `QNetworkAccessManager`. Bearer tokens, retries, conditional requests and
   resumable upload are solved once rather than once per app.
2. **The account owns the token.** `XakteirAccount` is the only thing that
   holds a credential. It installs a token provider on the shared HTTP client,
   so no other code path can attach an `Authorization` header by hand.
3. **Sign-in is optional.** Every network path has a working unauthenticated
   variant, and the shared-bandwidth WiFi is required to work for a guest
   device. Sign-in is a choice, never a gate.
4. **No simulated data.** Nothing here returns a fabricated response to make a
   screen look populated. If a request fails, it fails, and the UI says so.
5. **Mesh stays Qt-free.** `Shared/mesh` must be liftable into the VoltraPlay
   kernel image unchanged, so it may not include `Shared/Http` or anything else
   that pulls in Qt.

## `Shared/Http/HttpClient`

The single HTTP egress point. The four things every app gets wrong are solved
here instead of per app:

- **Token refresh.** A `401` is treated as a stale token, not a failure. Exactly
  one refresh-and-replay is attempted per request before the failure is
  reported, so a genuinely revoked account cannot spin forever.
- **Retry with real backoff.** Exponential backoff with jitter, and a method
  check: a `GET` may be retried blindly, a `POST` may not, because retrying a
  create is how you end up with three identical notes after one flaky network.
  An `Idempotency-Key` header opts a `POST` into retries properly.
- **Conditional requests.** `getWithEtag` / `putIfMatch`. A `412` is treated as a
  *conflict*, not an error, and is never retried — retrying it would defeat the
  entire point of a conditional write.
- **Resumable upload.** RFC 7233 chunked `Content-Range` uploads that survive a
  process restart: the offset and upload id are exposed for the caller to
  persist, so an interrupted 2 GB master video continues rather than restarting.

### Response contract

`HttpResponse::transportOk` is true when the request completed, regardless of
status. `statusCode` is 0 only when the transport itself failed. This
distinction matters: a caller must be able to tell "you are offline" from "the
server rejected your password", and conflating them produces the most common
bad UX in networked applications.

### Known limitations

- **No HTTP redirect following.** The redirect policy is deliberately set to
  `ManualRedirectPolicy`, because a cross-origin redirect would otherwise carry
  the bearer token to whoever controls the target. There is currently no manual
  follow-up, so a redirecting endpoint will surface as a `3xx` with an empty
  body. Follow-ups must re-apply `applyDefaultHeaders()` explicitly.
- **No connection pooling tuning.** Default `QNetworkAccessManager` limits apply.

## `Shared/Account/XakteirAccount`

The connected Xakteir account. It speaks the same Firebase Identity Toolkit
endpoints as the web app under `src/`, which is what makes web and desktop
sessions genuinely interchangeable rather than two parallel half-connected
things.

### Account states

```
Uninitialised → Guest | SignedIn | SigningIn | Expired | Error
```

- **Guest** is a first-class identity, not a placeholder. A guest gets a stable
  local id (`localId`), real local storage, and a deterministic display name.
  Their data stays bound to `localId`, which is what lets an account be adopted
  later without losing anything.
- **Anonymous** is a real server account with no password. `createAnonymousAccount()`
  is what makes "continue without signing in" genuinely sync instead of only
  pretending to, while the uid survives `upgradeToPassword()` unchanged.
- **SignedIn** always means a real token issued by a real endpoint. There is no
  path that sets this state without a server response.

### Endpoints used

| Operation | Endpoint |
| --- | --- |
| `signIn` | `POST v1/accounts:signInWithPassword` |
| `signUp` | `POST v1/accounts:signUp` |
| `createAnonymousAccount` | `POST v1/accounts:signUp` |
| `adoptToken` | `POST v1/accounts:lookup` (real validation) |
| `sendPasswordReset` | `POST v1/accounts:sendOobCode` |
| `updateProfile` / `changePassword` / `upgradeToPassword` | `POST v1/accounts:update` |
| `deleteAccount` | `POST v1/accounts:delete` |
| refresh | `POST securetoken v1/token` |
| devices / vault flag | Firestore REST `documents/*` |

### Error reporting

`describeServerCode()` maps Identity Toolkit error codes to actionable
sentences, and the server code is preserved alongside. Unmapped codes are
reported verbatim rather than swallowed — a generic "something went wrong"
hides the one case where the real reason matters.

### Known limitations

- **Tokens are stored in `QSettings`, not the OS keychain.** On Windows that is
  the user profile; on Linux, the user's config directory. The fuller answer is
  the platform keychain, which needs a Qt module this project does not currently
  link (`Qt6::Keychain` or platform-specific APIs). This is a real gap and is
  recorded here rather than papered over with a custom cipher, which would only
  be security theatre.
- **Sign-in is unverified in this build.** The API key placeholder in
  `defaultApiKey()` must be replaced with the real project key before any
  sign-in call can succeed. Everything else — state machine, persistence,
  refresh, error mapping — is implemented against the documented API.
- **No MFA flow.** Second-factor enrolment and challenge are not implemented.

## Device registry

`registerDevice` / `refreshDevices` / `setDeviceTrusted` maintain a per-account
device list in Firestore. Device ids are derived from a stable machine seed
rather than randomly, so a reinstall does not look like a brand-new machine.

Trust is per-device and explicit, because it gates the password-bypass allowlist
for the shared-bandwidth WiFi. It is written locally first for instant effect,
then mirrored to the server so the setting follows the account to another
machine.

The local device id is available even to guests, so the credential vault can
scope keys to this machine without an account.

## The credential vault contract

The vault is shared between the Xakteir Authenticator and the browser: both are
full peers that read and write the same synced vault, neither is authoritative,
and the browser additionally does autofill.

`XakteirAccount` deliberately does **not** own the vault. It only exposes
`hasVault` / `fetchVaultFlag()`, which answer whether a vault document exists.
The ciphertext itself is read, decrypted and edited by `Shared/Vault`, never by
this class — an account layer that can decrypt your passwords is the wrong
thing to have sitting between them and the network.

## Build integration

Both components are listed in `PROJECT_SOURCES` in `../CMakeLists.txt`, and
`Qt6::Network` was added to `find_package` and `target_link_libraries` to back
them.

To add a new shared component:

```cmake
    Shared/YourComponent/YourComponent.cpp
    Shared/YourComponent/YourComponent.h
```

and add its include directory to `target_include_directories`.

## Testing status

These files are **not yet compiled**. The machine this was written on has no Qt
installation, so no build has been run against them. Structural checks have been
performed — brace balance, declaration/definition agreement across all four
files — but that is not a compiler and should not be mistaken for one.

The first `cmake` + build run will surface whatever remains. Treat a green
structural check as "ready to be compiled", not "compiled".
