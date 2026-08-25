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

## 🧠 Lore & Ecosystem
- **Xakteir vs. VoltraOS:** Xakteir is the parent ecosystem (currently on the web). VoltraOS is the operating system. **Voltramax** is the initiative to turn Xakteir web apps into desktop apps for VoltraOS.
- **The Apps:** The `src/app` directory is massive (70+ subdirectories) containing everything from `/chat` and `/mail` to `/xakcode` and `/xakarena`. Read `Xakteir_Everything_You_Need_To_Know.md` for the full breakdown.

## 🛠️ Recent Tech Debt & Upgrades
If you are modifying existing code, keep these recent changes in mind:
- **No `alert()`:** All `alert()` calls have been replaced with the `useToast()` hook. Do not introduce new `alert()` calls.
- **Glassmorphism UI:** We recently overhauled the chat interface to use a premium, desktop-ready aesthetic. Use `.glass-panel` and `.glass-button` utilities from `globals.css` where applicable.
- **Framer Motion:** Use `motion.div` for smooth entrance animations (e.g., `initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}`) to maintain the premium feel. We also heavily use `Reorder.Group` for drag-and-drop mechanics (e.g. in `/settings`).
- **Global Header State:** The `<Header />` layout is managed by `useUIStore` (`src/lib/store.ts`). This includes `headerStyle`, `showLogo`, and `pinnedApps`. Users can drag-and-drop apps to pin them to the header via `/settings`.
- **Game Store Ownership:** The `/games` library now enforces ownership. Users start with 0 games (`localStorage: xakteir_game_library = []`) and must claim them from the overhauled `/games/store`.
- **Linked Accounts:** Users can connect multiple OAuth providers (Google, GitHub, Apple) to their main email account via the Profile page using Firebase's `linkWithPopup`.
- **Custom Discord Auth:** Because Firebase Identity Platform is paid, Discord OAuth is handled entirely by a custom Next.js API Route (`/api/auth/discord`). It mints a Custom Firebase Token using...
- **Xakteir Social 30-Feature Supercharged Upgrade:** Transformed `/social` into a full-featured social media platform: Global Social Timeline, Rich Post Composer (Text, Images, Polls, GIFs, Spoilers), Avatar cosmetics, and more.
- **Xakteir Mail 30-Feature Supercharged Suite:** Upgraded `/mail` with 30 fully integrated capabilities: AI Thread Summarizer, AI Smart One-Click Reply, AI Tone & Polish Assistant, Scheduled Send, and delivery analytics.

- **Native Fortnite Strike & Roblox Sandbox Obby Games:** Created 100% native, zero-external-dependency WebGL games directly inside Xakteir Games: **Fortnite Strike**.
- **Xak AI Chat Engine & Resilience Overhaul:** Fixed Xak AI chat failures by adding a 3.5s timeout controller on external Eve AI endpoints, adding a local response synthesizer fallback, and expanding retries.
- **Xakteir Dev Mail Dashboard:** Added a real Dev Centre mail route with inbox/outbox views, compose UI, delivery stats, and custom domain/DNS status panel for the Xakteir platform.


- **Smooth 12-Point SVG Animated Icon & Favicon Fix:** Re-architected `XakAiAnimatedIcon`.


- **XakChat Sending Fix & Offense Filter Overhaul:** Fixed silent message sending failures in `/chat` caused by unhandled error suppression and false positive `isOffensive` word substring matching.

- **Directory Cleanup:** Deleted deprecated folders `src/app/stream`, `src/app/sign`, `src/app/xakarena`, and `src/app/xakarena-creator`.
- **Ecosystem Naming & Hierarchy Realignment:** Standardized app titles to: **Xakteir Mail**, **Xakteir Social**, **Xakteir Translate**, **Suite Write**, **Suite Sheets**, **Suite Forms**, **Suite Slides**.



## 📝 Your Mission
Your goal is to build out real features, supercharge existing ones, and help transition this massive web ecosystem into a native, premium experience for Voltramax. 

Have fun, be energetic, and write great code! 🚀
