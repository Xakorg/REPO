# Xakteir Mail - Qt/QML desktop client

This package contains the native VoltraOS Mail application that mirrors the
`src/app/mail/**`, `src/app/api/mail/**`, and `src/lib/mail/**` web surface.

The implementation follows three hard constraints:

- Real data. No mocks, no stubs, no fake inboxes, and no `setTimeout` used to
  synthesise data. Everything reads from Firestore through the web API, the
  local SQLite cache, and the shared credential vault.
- Crash-resistant. Files are written to disk immediately, one at a time.
- No secrets on disk. Credentials are referenced by id from the shared
  Xakteir vault (`users/{uid}/auth_accounts`); their values are never written
  to `QSettings`, never returned to QML, and never logged. The only exception
  is what passes through the API's allowlisted projections.

## Files

| File | Lines | Purpose |
|---|------|---------|
| `MailTypes.h` | 564 | TS-mirror types (Folder/Category, `MailAddress`, `MailMessageData`, etc) |
| `MailCache.h/.cpp` | 285 / 1772 | SQLite schema, FTS5, mutation queue, optimistic applyLocalPatch |
| `MailCrypto.h/.cpp` | 141 / 602 | AES-256-GCM (NIST SP 800-38D), selfTest against published vectors |
| `MailMessageModel.h/.cpp` | 329 / 808 | `MailMessageModel` and `MailThreadModel` (separate) |
| `MailSyncWorker.h/.cpp` | 292 / 880 | Sync client mirroring `src/lib/mail/sync-client.ts` wire |
| `MailEngine.h/.cpp` | 345 / 1073 | Orchestration, tray, single-instance, vault, send |
| `MailSidebar.qml` | 299 | Sidebar with folders/categories/labels |
| `MailMessageList.qml` | 386 | Thread list (virtualised) |
| `MailThreadReader.qml` | 432 | Reader with sanitised HTML and per-thread decrypt |
| `MailComposer.qml` | 377 | Drafts, autosave, send with idempotency |
| `MailSearchPanel.qml` | 319 | Live + full-scope search (FTS5) |
| `MailSettingsPane.qml` | 481 | Preferences and diagnostics |
| `MailAccountManager.qml` | 335 | Accounts (vault-attached only) |
| `MailShortcutSheet.qml` | 90 | Keyboard shortcuts |
| `SettingRow.qml` | 67 | Reusable boolean row |
| `MailDetailField.qml` | 34 | Reusable read-only field |
| `XakteirMail.qml` | 482 | Main shell (three-pane) |

Total: 17 files, ~9373 lines.

## CMakeLists.txt block (exact text to add)

Do NOT edit `Voltramax/VoltraOS_Builder/desktop_environment/CMakeLists.txt`.
Add this block to the `mail` app section:

```cmake
set(MAIL_SOURCES
  Apps/Mail/MailCache.cpp
  Apps/Mail/MailCrypto.cpp
  Apps/Mail/MailEngine.cpp
  Apps/Mail/MailMessageModel.cpp
  Apps/Mail/MailSyncWorker.cpp
)

set(MAIL_HEADERS
  Apps/Mail/MailCache.h
  Apps/Mail/MailCrypto.h
  Apps/Mail/MailEngine.h
  Apps/Mail/MailMessageModel.h
  Apps/Mail/MailSyncWorker.h
  Apps/Mail/MailTypes.h
)

set(MAIL_QML
  Apps/Mail/XakteirMail.qml
  Apps/Mail/MailSidebar.qml
  Apps/Mail/MailMessageList.qml
  Apps/Mail/MailThreadReader.qml
  Apps/Mail/MailComposer.qml
  Apps/Mail/MailSearchPanel.qml
  Apps/Mail/MailSettingsPane.qml
  Apps/Mail/MailAccountManager.qml
  Apps/Mail/MailShortcutSheet.qml
  Apps/Mail/SettingRow.qml
  Apps/Mail/MailDetailField.qml
)

# Qt modules: Core Gui Qml Quick WebEngineQuick WebSockets Sql Network Widgets
find_package(Qt6 REQUIRED COMPONENTS Core Gui Qml Quick WebEngineQuick WebSockets Sql Network Widgets)

target_sources(${PROJECT_NAME} PRIVATE ${MAIL_SOURCES} ${MAIL_HEADERS} ${MAIL_QML})

target_link_libraries(${PROJECT_NAME} PRIVATE
  Qt6::Core
  Qt6::Gui
  Qt6::Qml
  Qt6::Quick
  Qt6::WebEngineQuick
  Qt6::WebSockets
  Qt6::Sql
  Qt6::Network
  Qt6::Widgets
)
```

Note: `Sql`, `Network`, `Widgets` are required by this implementation but may
not be present in the current link line. Add them exactly as shown.

## main.cpp registration block (exact text)

Do NOT edit `Core/main.cpp`. Add the context property registration after
Store's registration:

```cpp
// Xakteir Mail
#include "Apps/Mail/MailEngine.h"
{
  xakteir::mail::MailEngine *mail = new xakteir::mail::MailEngine(engine);
  engine.rootContext()->setContextProperty("MailEngine", mail);
  QObject::connect(engine, &QQmlApplicationEngine::quit, mail, &xakteir::mail::MailEngine::shutdown);
  qmlRegisterUncreatableType<xakteir::mail::Folder>("Xakteir.Mail", 1, 0, "MailFolder", "enum only");
  qmlRegisterUncreatableType<xakteir::mail::Category>("Xakteir.Mail", 1, 0, "MailCategory", "enum only");
}
```

Include `MailEngine.h` and wire `shutdown()` to `QQmlApplicationEngine::quit`.
Also ensure QML plugins for WebEngineQuick/WebSockets are available if
packaging.

## firestore.rules block (exact text, DO NOT EDIT firestore.rules)

The parent/owning agent controls `firestore.rules`. The Mail feature requires
the following (documented here for that agent):

```text
// Mail routes expect these collection paths:
// - users/{uid}/mails/{id}
// - users/{uid}/mailThreads/{id}
// - users/{uid}/mailMutations/{id}
// - users/{uid}/mailAccounts/{id}
// - users/{uid}/mailLabels/{id}
// - users/{uid}/auth_accounts/{id}  (shared vault; Authenticator owns write)
// - system/global/limits (read-only)

// Rules summary:
// - Read/write own subcollections under users/{uid} for mails/mailThreads/mailMutations/mailAccounts/mailLabels
// - auth_accounts: peer read if purpose matches; write only by Authenticator
// - Sync route uses server SDK; rules may allow server context
// - Attachments referenced by id; download/upload through API only
```

This matches `src/lib/mail/schema.ts` (`MAIL_COLLECTIONS`, `SERVER_OWNED_FIELDS`).

## Vault API (documented)

- `GET /api/mail/vault` → returns allowlisted references only (`{credentials:[{id,service,account,website,purpose}]}`), no secrets.
- `POST /api/mail/vault` → writes reference/metadata (never invents a password).
- `GET /api/mail/vault/[credentialId]` → returns `{value,...}` (the secret) for the authenticated owner; this is the only route returning a secret.
- `PATCH /api/mail/vault/[credentialId]` → re-purpose/metadata only.
- `DELETE /api/mail/vault/[credentialId]` → refuses if linked to mail accounts (peer: Authenticator owns lifecycle; Mail does not delete vault entries).
- `POST /api/mail/send` → persist-before-network, idempotency header `Idempotency-Key`, real attachment bytes via `@/lib/mail/storage`, MIME via `buildMimeMessage`, returns verdict/receipt.
- `POST /api/mail/sync` → wire mirrors `sync-client.ts` exactly (cursor advanced last; optimistic columns preserved; server-owned fields stripped).

See `src/app/api/mail/vault/route.ts`, `src/app/api/mail/vault/[credentialId]/route.ts`, `src/app/api/mail/send/route.ts`, `src/app/api/mail/sync/route.ts`.

## Web changes

- `src/lib/mail/storage.ts` (new, server-only) — Firebase Admin Storage helper. Not exported from `src/lib/mail/index.ts` (client-importable barrel).
- `src/lib/mail/types.ts` — added `folder: MailFolder` to `MailMessage`, plus `idempotencyKey`, `deliveryAdapter`, `sendResult`, `deliveredAt`, `rawBytes`.
- `src/app/api/mail/send/route.ts` — fixed duplicate declarations; uses `@/lib/mail/storage`; no unused imports.
- `src/app/api/mail/vault/*` — completed as specified.
- `src/app/mail/page.tsx` — user-owned (2766 lines). No rebuild; integrate minimally at mount points if extending to use `/api/mail/*`.

## Env vars

- `NEXT_PUBLIC_FIREBASE_*` (existing) for web client.
- `FIREBASE_SERVICE_ACCOUNT_KEY` or ADC for Firebase Admin on API routes.
- `MAIL_SYNC_BASE_URL` (optional; Qt uses default or `Settings > Sync`).
- `XAKTEIR_MAIL_DOMAIN` = `mail.xakteir.com` (matches web).

## Crypto

- AES-256-GCM, 32-byte key, 12-byte nonce, 16-byte tag (separate). AAD = `<internetMessage-id>`. Constant-time tag compare. `selfTest()` against NIST vectors. Format matches `src/lib/mail/crypto.ts`.

## Schema

- `MAIL_SCHEMA_REVISION = 3` (web). `MAIL_NATIVE_SCHEMA_REVISION = 3` (Qt). Mismatched schema triggers recreation. Pending-mutation queue written to `.pending.json` sidecar before drop (server-unrebuildable).
- FTS5 over `messages_fts` (subject, bodyText, senderTokens, recipientTokens).
- Mutation queue with `has_pending_sync` recomputed.

## Deliberately unimplemented

- No web <-> Qt IPC bridge added beyond existing routes.
- No `git commit/push/add -A/reset/stash` performed.
- `firestore.rules` and `CMakeLists.txt`/`main.cpp` not edited (blocks provided as text).
- No emojis in code; UI copy may use minimal symbols.
- `setTimeout` only for real backoff/jitter (exponential 1s–5min, full jitter), never to fabricate data.

## Sync wire (reference)

Body: `{cursor,surface,deviceId,limit,fullResync,requestDispatch,mutations,settings}`
Headers: `Authorization: Bearer ...`, `Idempotency-Key: deviceId:cursor`
Response: `{cursor,serverTime,changes,tombstones,advanced,hasMore,applied,rejected,cursorRewound}`
- Cursor advanced last.
- Optimistic columns (`isRead,isStarred,isPinned,snoozedUntil,scheduleAt`) preserved if local revision newer.
- Remote folder always wins on server-accepted changes.
- Field allowlist strips server-owned fields before push.
- Unauthorized/forbidden don't retry on a timer.Offline/RateLimited/ServerError retry with jitter.
- `toRouteError` returns `{status,body}`; `MailAuthError` 401/403 only.
