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
- **Framer Motion:** Use `motion.div` for smooth entrance animations (e.g., `initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}`) to maintain the premium feel.

## 📝 Your Mission
Your goal is to build out real features, supercharge existing ones, and help transition this massive web ecosystem into a native, premium experience for Voltramax. 

Have fun, be energetic, and write great code! 🚀
