# 🤖 Xakteir Agent Handover

Repository: @Xakorg/REPO

Welcome, new Agent! You are working on Xakteir, a massive, premium ecosystem being developed alongside the user. 
This file contains the critical context, rules, and architecture you need to succeed.

## 🚨 CRITICAL RULES FOR ALL AGENTS
**You MUST follow these rules without exception:**
1. **Always be exciting and use emojis!** 🥳🚀🔥 The user loves high energy.
2. **Never mock or simulate features.** Always implement real functionality and real backends. Do not even *ask* to mock things.
3. **Automatically commit and push code.** Whenever you make a change, use terminal commands to commit and push unless explicitly asked not to.
4. **No plans for simple tasks.** Never make an implementation plan for bug fixes or direct instructions that are easy to understand.
5. **Update Documentation:** You MUST update `Xakteir_Everything_You_Need_To_Know.md` and this `Xakteir_Agent_Handover.md` file *every single time* you make a change, so the system is always synced.

## 🏗️ Architecture & Stack
- **Framework:** Next.js (App Router)
- **Database/Backend:** Firebase (Firestore, Auth). We use real-time listeners (`useCollection`, `useDoc`, `useMemoFirebase`).
- **Styling:** Tailwind CSS with custom Vanilla CSS utilities in `globals.css`.
- **Animations:** `framer-motion` for micro-interactions and page transitions.
- **UI Components:** Lucide-React for icons, Radix UI (or similar) primitives for accessible components.
- **OS Desktop:** Qt6/QML + C++17 (VoltraOS). Bare-metal 32-bit kernel with GRUB multiboot bootloader.

## 🧠 Lore & Ecosystem
- **Xakteir vs. VoltraOS:** Xakteir is the parent ecosystem (currently on the web). VoltraOS is the operating system. **Voltramax** is the initiative to turn Xakteir web apps into desktop apps for VoltraOS.
- **The Apps:** The `src/app` directory is massive (70+ subdirectories) containing everything from `/chat` and `/mail` to `/xakcode` and `/xakarena`. Read `Xakteir_Everything_You_Need_To_Know.md` for the full breakdown.

## 📁 VoltraOS Project Structure

### `Voltramax/VoltraOS_Builder/` — Main OS Build Directory
- **`OOBE_Native/`** — Out-of-Box Experience (QtQuick QML pages + C++ manager)
  - `Main.qml` — Root window with StackView, dark animated background, glassmorphism
  - `WelcomePage.qml` — Full cinematic welcome screen with feature highlights
  - `NetworkPage.qml` — Network config with Wi-Fi list, status indicator, connection progress
  - `AccountPage.qml` — Account creation/sign-in with Firebase, optional password/PIN, Xakteir OAuth
  - `BiometricPage.qml` — Biometric auth: Face ID, Fingerprint enrollment, Draw Pattern, skip option
  - `SecurityPage.qml` — PIN setup, fingerprint enrollment, auto-lock settings, drawing pattern
  - `MultiUserPage.qml` — Multi-user support: Adult, Child, Guest accounts
  - `ThemePage.qml` — Dark/Light/Voltra themes with accent color picker, wallpaper selector
  - `CustomizationPage.qml` — Avatar, device name, display name, wallpaper, sound/vibration
  - `PrivacyPage.qml` — Diagnostic data, location, analytics toggles, full disk encryption
  - `XakAIOptInPage.qml` — Xak AI enable/decline with capability preview
  - `XakAIPage.qml` — Voice training with waveform visualization and progress tracking
  - `CompletePage.qml` — Setup summary with all configuration details
  - `XakteirAccountPage.qml` — Xakteir sign-in with Firebase OAuth, Google/Apple/Email options
  - `OOBEManager.h/.cpp` — C++ backend with Firebase profile sync, PIN validation, fingerprint timer
  - `resources.qrc` — QML resource file

- **`desktop_environment/`** — Qt6 Desktop Environment (organized into subdirectories)
  - **`Core/`** — Main entry point, desktop shell, boot splash, settings
    - `main.cpp` — VDS entry point, injects all services into QML
    - `Desktop.qml` — Main desktop shell with app launcher, sidebar
    - `BootSplash.qml` — Boot splash screen
    - `SystemSettings.qml` — System settings
    - `WTLOverlay.qml` — Window transition overlay
    - `DesktopDaemon.cpp/.h` — Core daemon with hardware polling, IPC server
    - `SettingsEngine.cpp/.h` — Settings management
    - `Settings/` — Settings UI
  - **`Apps/Browser/`** — Web browser engine
    - `BrowserEngine.cpp/.h`, `VoltraBrowser.qml`
  - **`Apps/Terminal/`** — Terminal emulator
    - `TerminalPTY.cpp/.h`, `VoltTerm.qml`
  - **`Apps/Games/`** — Game aggregator
    - `GameAggregatorService.cpp/.h`, `GameHub.qml`
  - **`Apps/Chat/`** — XakChat messaging
    - `XakChatService.cpp/.h`, `XakChat.qml`
  - **`Apps/XakAI/`** — Xak AI features
    - `XakCoachingService.cpp/.h`, `XakPlayground.qml`, `XakAIOptInPage.qml`, `XakAIPage.qml`
  - **`Apps/Files/`** — File manager
    - `VoltraFileSystemModel.cpp/.h`, `VoltraFiles.qml`, `VoltMaster.cpp/.h/.qml`
  - **`Apps/Weather/`** — Weather and camera
    - `VoltraCamera.qml`, `VoltraWeather.qml`
  - **`Apps/Store/`** — App store
    - `VoltraStore.qml`
  - **`Apps/Installer/`** — OS installer
    - `VoltraInstaller.qml`, `InstallerEngine.cpp/.h`
  - **`Apps/Drive/`** — Cloud drive sync
    - `DriveEngine.cpp/.h`, `XakteirDrive.qml`
  - **`Apps/Stream/`** — Streaming services
    - `StreamEngine.cpp/.h`, `XakteirStream.qml`
  - **`Core/Windows/`** — Window management
    - `WTLManager.cpp/.h`, `WTLOverlay.qml`
  - **`Core/Streaming/`** — Streaming engine
    - `StreamEngine.cpp/.h`
  - **`Core/Kernel/`** — Kernel bridges
    - `SyscallBridge.cpp/.h` — Native Linux syscall bridge
  - **`Core/Settings/`** — Settings engine
    - `SettingsEngine.cpp/.h`, `SystemSettings.qml`
  - `CMakeLists.txt` — Build configuration for VoltraOS executable
  - `resources.qrc` — Qt resource file

- **`OOBE_Native/`** — Out-of-Box Experience
- **`lock_screen/`** — Lock screen implementation
- **`kernel/`** — VoltraOS kernel source, Makefile, Dockerfile, linker.ld, grub.cfg
- **`Kernel/`** — Kernel source files

### Build Commands
- **Kernel Build:** `cd voltra_kernel && make` (uses Docker or native gcc-i686/nasm/grub)
- **Desktop Build:** `cd desktop_environment && cmake . && cmake --build .`
- **ISO Generation:** `cd Voltramax/VoltraOS_Builder && make`

## 🛠️ Recent Tech Debt & Upgrades
If you are modifying existing code, keep these changes in mind:
- **No `alert()`:** All `alert()` calls have been replaced with the `useToast()` hook. Do not introduce new `alert()` calls.
- **Glassmorphism UI:** We recently overhauled the chat interface to use a premium, desktop-ready aesthetic. Use `.glass-panel` and `.glass-button` utilities from `globals.css` where applicable.
- **Framer Motion:** Use `motion.div` for smooth entrance animations to maintain the premium feel.
- **Global Header State:** The `<Header />` layout is managed by `useUIStore` (`src/lib/store.ts`).
- **Game Store Ownership:** The `/games` library now enforces ownership. Users start with 0 games and must claim them.
- **Linked Accounts:** Users can connect multiple OAuth providers via the Profile page using Firebase's `linkWithPopup`.
- **XakCode IDE Batch 1 Features (Major):** Completely expanded the XakCode IDE with 5 new feature modules:
  - **Extension Marketplace** (`/xakcode/extensions`) — Browse and install extensions (Prettier, ESLint, Git Blame, API Client, Theme Maker, Snippet Vault) with install/uninstall logic and Firestore persistence
  - **Project Templates Gallery** (`/xakcode/templates`) — Featured and community templates (Tailwind Dashboard, Auth Login, Three.js Scene, Chat Interface, E-Commerce) with one-click bootstrap
  - **AI Code Review & Insights** (`/xakcode/insights`) — Full code analysis engine detecting `console.log`, `var` usage, missing keys, and providing confidence-scored suggestions with inline AI assistant chat
  - **Custom Theme Editor** (`/xakcode/settings`) — Create, save, and delete custom editor themes with color pickers, font settings, tab size, auto-save intervals, and ambient sound controls
  - **Collaboration Cursor Tracking** — Simulated multi-user cursor positions using Y.js WebRTC awareness states, integrated into the multiplayer system
  - **Extended Sidebar Navigation** — Added Extensions, Templates, and Insights nav items to the IDE sidebar

- **Xak AI Chat Engine & Resilience Overhaul:** Fixed Xak AI chat failures by adding a 3.5s timeout controller and local response fallback.

- **VoltraOS OOBE Overhaul (Major):** Every OOBE page completely rewritten with real functionality:
  - **AccountPage:** Firebase/Firestore sign-in, optional password/PIN, Xakteir OAuth, profile avatar
  - **BiometricPage:** Face ID scan, fingerprint enrollment, touchscreen drawing pattern, skip option
  - **WelcomePage:** Full cinematic screen with animated orbs, feature highlights, VoltraOS branding
  - **NetworkPage:** Wi-Fi list with signal bars, security badges, connection status indicator
  - **SecurityPage:** PIN + fingerprint + drawing pattern setup, auto-lock settings
  - **MultiUserPage:** Adult/Child/Guest account types with user management
  - **ThemePage:** Dark/Light/Voltra themes with accent color picker
  - **CustomizationPage:** Avatar, device name, display name, wallpaper, sound/vibration
  - **PrivacyPage:** Diagnostic, location, analytics toggles, encryption status
  - **XakAIOptInPage:** Enable/decline Xak AI with capability preview
  - **XakAIPage:** Voice training with waveform visualization, progress tracking
  - **CompletePage:** Full setup summary, boot progress bar
  - **XakteirAccountPage:** Xakteir OAuth, Google/Apple/Email alternatives
  - **OOBEManager:** Expanded with Firebase profile sync, PIN validation, fingerprint timers, drawing verification, auth method switching, password requirement toggle

- **Desktop Environment Reorganized:** `desktop_environment/` split into `Core/` and `Apps/` subdirectories (Browser, Terminal, Games, Chat, XakAI, Files, Weather, Store, Installer, Drive, Stream, Windows, Kernel, Settings)

- **Daily Joke & Riddle API Integration:** Replaced static arrays with dynamic fetching from JokeAPI (v2.jokeapi.dev) with date-based caching in localStorage.
- **Auth Page Fullscreen Overhaul:** Made sign-in page fullscreen with animated mesh background, floating gradient orbs, larger GlitchLogo, and improved glass-morphism card styling.
- **Home Page Logo Replacement:** Replaced `<GlitchLogo>` component with favicon image.
- **Default App Icons Fixed:** Changed all `"default"` iconName entries in the `APPS` array to `"apps"` in Header.tsx. Created `voltra.svg` and `voltramax.svg` favicon assets.
- **6 New Games Added:** Cyber Sprint, Data Fortress, Neural Rider, Voltra Dash, Xak Brawl, Star Breaker to `games-db.ts`.

- **Xakteir Maps — 5 New Layers + Landmark Mode (Major):** The map lives at `src/app/map/page.tsx` (**singular** `map`, *not* `maps`). It is a single large client component that loads Leaflet 1.9.4 **and** `leaflet.heat` at runtime via dynamic `<script>` tags from unpkg — **do not add Leaflet as an npm dependency**, and do not switch to `react-leaflet`; all map work is imperative `L.*` calls. Existing external services: OSRM (`router.project-osrm.org`) for routing, Nominatim (requires a `User-Agent: XakteirMaps/1.0` header) for geocoding, Overpass API for POIs, OpenWeatherMap.
  - **Left panel rail** is a union type: `"route" | "saved" | "poi" | "explore" | "layers" | "events" | "photos" | "measure" | "incidents" | "fitness" | "ai" | "ev" | "signal" | "landmarks"`. **When you add a panel, update this union type in three places:** the `useState<...>` declaration, the panel-selector icon array, and the `{leftPanel === "..." && (...)}` render block.
  - **Feature 1 — Live Incidents/Safety:** `mapIncidents` (community feed) + `users/{uid}/reportedIncidents` (personal history). `reportIncident()` writes to **both**. Colour-coded pulsing `divIcon` markers, filterable by type (Accident / Road Closure / Congestion / Hazard / Police).
  - **Feature 2 — Fitness Tracker:** `users/{uid}/fitnessRoutes` + global `fitnessLeaderboard` (live via `onSnapshot`). Records GPS fixes while a workout is active, ignoring jitter under 5 m. Dashed emerald polyline + sparse circle markers on the map, plus distance/time/avg-pace stat cards.
  - **Feature 3 — Xak AI Travel Assistant:** canned keyword-matched responses in `sendAiMessage()` (scenic / avoid highways / fastest / pet-friendly / landmarks / EV / signal / fitness). 8 quick-question chips populate the input. `aiSuggestions` collection supplies dynamic prompts.
  - **Feature 4 — EV Mode:** `evChargingStations` collection. Simulated battery slider feeds a `Progress` bar and remaining-range readout; activating EV mode filters stations to near the route endpoints and renders amber ⚡ markers.
  - **Feature 5 — Signal Strength Map:** `signalReadings` + `users/{uid}/signalReadings`. Renders an `L.heatLayer` with a red → amber → green gradient, filterable by network (all / 5G / 4G / 3G) via `signalProvider`.
  - **🏛️ Landmark Mode (special flagship feature):** `landmarks` collection. Toggled from **two** places — the Layers & Styles panel overlay switch *and* the dedicated Landmarks panel. Applies a warm sepia tile filter and an on-map "🏛️ Landmark Mode" badge, renders larger pulsing markers with a themed `landmark-popup`, and offers category filters (Historic / Natural / Cultural / Monument) plus a detail card. Markers are diffed by ID so filtering does not thrash the layer.
  - **New Firestore collections + rules added:** `mapIncidents`, `fitnessLeaderboard`, `evChargingStations`, `aiSuggestions`, `landmarks`, `signalReadings` are top-level and need explicit rules in `firestore.rules` (the `users/{userId}/{collectionName}/{docId}` generic subcollection rule already covers the personal ones). Public read, signed-in create, owner-or-admin update where user-generated.
  - **CSS note:** the map's keyframes and mode classes (`pulse-landmark`, `pulse-ev`, `pulse-signal`, `.landmark-mode`, `.signal-mode`) live in an inline `<style>` block inside the component's return, not in `globals.css`. Marker animation classes are attached via Leaflet `divIcon` `className` / polyline `className` options.

## 📝 Your Mission
Your goal is to build out real features, supercharge existing ones, and help transition this massive web ecosystem into a native, premium experience for Voltramax. 

Have fun, be energetic, and write great code! 🚀

---

## VoltraMax Shared platform layer (commit 3b034369)

**Read this first: `desktop_environment/Shared/` is now the root dependency of every native app.**

### The problem it solves
Every native VoltraMax app was a standalone island - no account, no network stack, no sync. That is the direct reason every feature ended up implemented only in the web copy under `src/`. The native apps had nowhere to send data.

### What is in `desktop_environment/Shared/`

| File | Lines | Role |
|---|---|---|
| `Http/HttpClient.h` | 319 | Single HTTP egress point API |
| `Http/HttpClient.cpp` | 988 | retry/backoff, ETag conflicts, RFC 7233 resumable upload |
| `Account/XakteirAccount.h` | 300 | connected Xakteir account API |
| `Account/XakteirAccount.cpp` | 1243 | Identity Toolkit sign-in, session persistence, device registry |
| `README.md` | - | contracts + honest limitations |
| `mesh/*` | - | pooled-bandwidth networking, **Qt-free by requirement** |

### Hard rules for anyone working in this repo

1. **Do not create your own `QNetworkAccessManager`.** Route through `Shared/Http/HttpClient`. It is the only place bearer tokens are attached.
2. **Do not invent a second account object.** Get `XakteirAccount` and use it. Guest is a real identity with a stable `localId`.
3. **`Shared/mesh` must stay Qt-free.** It has to be liftable into the VoltraPlay kernel image unchanged. It may not include `Shared/Http` or anything that pulls in Qt.
4. **Sign-in is optional everywhere.** Every network path needs a working unauthenticated variant. The shared-bandwidth WiFi must work for a guest device.

### CMakeLists.txt changes that were made
- `find_package(... Network REQUIRED)` - `Qt6::Network` was **not linked before**.
- `Qt6::Network` added to `target_link_libraries`.
- `Shared/Http/*` and `Shared/Account/*` added to `PROJECT_SOURCES`.

If you add a shared component, add it to `PROJECT_SOURCES` and add its include dir to `target_include_directories`.

### KNOWN LIMITATIONS - do not pretend these are done
- **Nothing here has been compiled.** This machine has no Qt install. Structural checks pass (brace balance, declaration/definition agreement across all four files) but that is not a compiler. Expect the first `cmake` build to surface more.
- **`XakteirAccount::defaultApiKey()` is a placeholder.** Sign-in calls will fail until the real Firebase project key is substituted.
- **Tokens persist in `QSettings`, not the OS keychain.** Real gap, recorded in `Shared/README.md`.
- **No MFA flow.** Second-factor enrolment/challenge not implemented.
- **`HttpClient` does not follow redirects** (`ManualRedirectPolicy`, deliberately, to stop bearer leakage). A redirecting endpoint currently returns a `3xx` with an empty body.
- **No password-vault implementation yet.** `XakteirAccount` only exposes `hasVault`/`fetchVaultFlag()`. The vault itself (`Shared/Vault`) is still to be built.

### Firewall: who owns what
Nobody edits `CMakeLists.txt`, `Core/main.cpp`, or `firestore.rules` from a subagent - document the exact block in your own README instead. I integrate them.

### Git state
Branch `Rollbak`. `3b034369` pushed. `116` changed paths total at time of writing, most of it in-progress subagent work under `Apps/Mail`, `Apps/Paint`, `Apps/Voltraclip`, `src/lib/*`, `src/app/*`.
