## Knowledge
Knowledge is an organized, neat knowledge base for Xakteir — a wiki-style app optimized for clarity and search.
           FEATURES
           - Clean article pages with consistent structure (title, summary, sections, references)
           - Fast search and category browsing (Search box + category index)
           - Publicly browsable at knowledge.xakteir.com with subdomain isolation
           - Article routes under /knowledge/a/<slug> and internal editor paths (future)
           - Designed to be dependency-light and extremely readable

- **XakCode IDE Batch 1 Features:** Added Extension Marketplace (`/xakcode/extensions`), Project Templates Gallery (`/xakcode/templates`), AI Code Review & Insights (`/xakcode/insights`), Custom Theme Editor (`/xakcode/settings`), and Collaboration Cursor Tracking (WebRTC/Y.js). IDE now has 8 sidebar navigation items including Extensions, Templates, and Insights tabs.

## Maps

Xakteir Maps is a full navigation and live-urban-data map app.
           LOCATION
           - The map route is `src/app/map/page.tsx` — **singular `map`**, not `maps`
           - Single large client component. Leaflet 1.9.4 and `leaflet.heat` are loaded at runtime from unpkg via dynamic `<script>` tags. There is **no** Leaflet npm dependency and no `react-leaflet`; all map work uses imperative `L.*` calls
           - External services: OSRM (`router.project-osrm.org`) for routing, Nominatim (send a `User-Agent: XakteirMaps/1.0` header) for geocoding, Overpass API for POIs, OpenWeatherMap for weather

           FEATURES
           - **Route Planner** — car / bike / walk modes, OSRM routing, step-by-step turn instructions, live voice cues, and a walkthrough simulator
           - **Saved Places** — home / work / star / heart icons with a click-to-drop-pin flow
           - **POI Layer** — togglable category layers sourced from Overpass
           - **Explore Nearby** — radius search around your position
           - **Layers & Styles** — traffic flow, weather radar (rain + cloud overlays), heatmap, boundaries, and Landmark Mode toggle
           - **Events / Photos** — pinned map events and a geo-tagged photo feed with lightbox
           - **Measure** — multi-point distance measuring with a crosshair cursor
           - **Global Search** — debounced top-bar search with address autocomplete
           - **Context Menu** — right-click a point for reverse-geocoded "What's Here?"

           NEW LAYERS (5 features + Landmark Mode)
           - **Live Incidents / Safety** — community incident reports (accident, road closure, congestion, hazard, police) as colour-coded pulsing markers, filterable by type, with a "You"/"Community" badge and your own report history
           - **Fitness Tracker** — start a GPS-tracked workout, live distance / elapsed time / pace, dashed route drawn on the map, save to your history, plus a real-time global leaderboard and lifetime stat cards
           - **Xak AI Travel Assistant** — chat panel answering route, landmark, EV, signal, and fitness questions, with 8 quick-question chips
           - **EV Mode** — battery slider, remaining-range readout, and nearby charging-station markers that filter to your route when activated
           - **Signal Strength Map** — a red → amber → green `L.heatLayer` of community signal readings, filterable by network (all / 5G / 4G / 3G), with a strength legend and your recent readings
           - **🏛️ Landmark Mode (flagship)** — toggles a dedicated curated-landmark overlay with a warm sepia tile filter, an on-map mode badge, larger pulsing markers with themed popups, category filters (Historic / Natural / Cultural / Monument), and a landmark detail card. Reachable from both the Layers panel and the Landmarks panel

           DATA
           - Top-level collections: `mapIncidents`, `fitnessLeaderboard`, `evChargingStations`, `aiSuggestions`, `landmarks`, `signalReadings`
           - Per-user subcollections: `users/{uid}/reportedIncidents`, `users/{uid}/fitnessRoutes`, `users/{uid}/signalReadings`
           - Rules for the new top-level collections were added to `firestore.rules` (public read, signed-in create, owner-or-admin update). The existing generic `users/{userId}/{collectionName}/{docId}` rule already covers the per-user ones
           - The left panel rail is a TypeScript union: `"route" | "saved" | "poi" | "explore" | "layers" | "events" | "photos" | "measure" | "incidents" | "fitness" | "ai" | "ev" | "signal" | "landmarks"`. Adding a panel means updating that union, the icon array, and the render block
           - Map keyframes and the `.landmark-mode` / `.signal-mode` classes live in an inline `<style>` block inside the component, not in `globals.css`

## Recent Changes
- **Xakteir Maps: 5 New Layers + Landmark Mode:** Added Live Incidents/Safety, Fitness Tracker with leaderboard, Xak AI Travel Assistant, EV Mode, and Signal Strength heatmap, plus the flagship Landmark Mode overlay. Added 6 new left-rail panels, matching Firestore collections, and security rules.
- **VoltraOS OOBE Complete Overhaul:** Every OOBE page completely rewritten with real functionality: AccountPage now supports Firebase/Firestore sign-in with optional PIN/password, BiometricPage adds fingerprint enrollment, drawing pattern auth, and skip option, WelcomePage has full cinematic design, NetworkPage has Wi-Fi list with signal bars, all other pages expanded significantly with proper UI and real settings
- **OOBEManager Expanded:** Added Firebase profile sync, PIN validation, fingerprint timer, drawing verification, auth method switching (password/PIN/fingerprint/face/drawing), password requirement toggle, device name/display name properties, oobeProgress tracking
- **Desktop Environment Reorganized:** `desktop_environment/` split into `Core/` (main.cpp, Desktop.qml, DesktopDaemon, SettingsEngine, BootSplash) and `Apps/` subdirectories (Browser, Terminal, Games, Chat, XakAI, Files, Weather, Store, Installer, Drive, Stream, Windows, Kernel, Settings)
- **Daily Joke & Riddle API:** Daily jokes/riddles now fetch from v2.jokeapi.dev with date-based localStorage caching for truly different content every day
- **Auth Page Overhaul:** Sign-in page is now fullscreen with animated mesh background, floating gradient orbs, improved glass-morphism
- **Home Page Logo:** Replaced GlitchLogo component with favicon image
- **App Icons Fixed:** All "default" iconName entries in APPS array now use "apps" icon; voltra.svg and voltramax.svg created
- **New Games Added:** Cyber Sprint, Data Fortress, Neural Rider, Voltra Dash, Xak Brawl, Star Breaker
- **Voltramax/VoltraOS:** Active OS project in Voltramax/VoltraOS_Builder/ — QML desktop, C++ kernel, GRUB bootable ISO
- **OOBE Manager Architecture:** `OOBE_Native/` contains `Main.qml` (root window with StackView), all OOBE pages, and `OOBEManager.h/.cpp` (C++ backend with Firebase integration, PIN validation, fingerprint timers, drawing verification)
- **VoltraOS Build Pipeline:** Kernel (`voltra_kernel/`) uses Docker with Ubuntu 24.04, gcc-i686, nasm, grub-pc-bin, xorriso, mtools. Desktop (`desktop_environment/`) uses CMake + Qt6. Full ISO generation via top-level `Makefile`.
- **VoltraOS Desktop Environment:** Qt6/QML desktop with services: DesktopDaemon, BrowserEngine, TerminalPTY, GameAggregatorService, XakChatService, XakCoachingService, VoltraFileSystemModel, DriveEngine, StreamEngine, WTLManager, SyscallBridge
- **Kernel:** Bare-metal 32-bit freestanding C kernel with GRUB multiboot bootloader. ~40 source files including main.c, memory.c, interrupts.c, drivers/, fs/, fs/, etc.

---

## VoltraMax native platform layer (new)

**`desktop_environment/Shared/` is the root dependency every native app now has.**

Before this existed, every native VoltraMax app was an isolated island with no
account and no way to talk to a server - which is exactly why every feature
first shipped only in the web copy under `src/`. The native apps had nowhere to
send data.

Two pieces, both real, both registered in `CMakeLists.txt`:

- **`Shared/Http/HttpClient`** - the one HTTP client for the whole binary.
  Bearer tokens, exponential backoff with jitter, ETag-based conflict detection
  (a `412` is a conflict and is never retried), and RFC 7233 resumable chunked
  upload that survives a process restart.
- **`Shared/Account/XakteirAccount`** - one connected Xakteir account, speaking
  the same Firebase Identity Toolkit endpoints as the web app, so web and
  desktop sessions are genuinely interchangeable. Guest is a real identity with
  a stable local id; sign-in is optional, never a gate; a failed refresh falls
  back to a real guest rather than a fake signed-in state.

Also added `Qt6::Network`, which had never been linked.

**Honest status:** not compiled - this machine has no Qt install. `defaultApiKey()`
is a placeholder. Tokens are in `QSettings` rather than the OS keychain. Full
limitations list in `desktop_environment/Shared/README.md`.
