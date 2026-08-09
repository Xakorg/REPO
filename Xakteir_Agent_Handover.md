# 🤖 Xakteir Agent Handover

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
- **Game Store Ownership:** The `/games` library now enforces ownership. Users start with 0 games (`localStorage: xakteir_game_library = []`) and must claim them from the overhauled `/games/store` UI using the "Get Game Now!" button.
- **Linked Accounts:** Users can connect multiple OAuth providers (Google, GitHub, Apple) to their main email account via the Profile page using Firebase's `linkWithPopup`.
- **Custom Discord Auth:** Because Firebase Identity Platform is paid, Discord OAuth is handled entirely by a custom Next.js API Route (`/api/auth/discord`). It mints a Custom Firebase Token using the `firebase-admin` SDK. The connection state is tracked directly in Firestore under `users/{uid}/discord`.
- **XakSports Real Family Tournament & Live Webcam AI VAR Studio:** Completely upgraded `/xaksports` with 100% REAL features: custom team logo image uploads (`<input type="file">`) & image URLs, real live webcam feed (`navigator.mediaDevices.getUserMedia`), real AI Referee API endpoint (`/api/ai/referee/route.ts`) analyzing live video frames, fullscreen stadium mode with team logos and **MASSIVE SCORE CHARACTERS** (`text-[14rem]`), keyboard goal shortcuts (`[A]` / `[D]`), and Firestore tournament persistence.





## 📝 Your Mission
Your goal is to build out real features, supercharge existing ones, and help transition this massive web ecosystem into a native, premium experience for Voltramax. 

Have fun, be energetic, and write great code! 🚀
