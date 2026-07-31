# Xakteir - Shared Agent Memory & Context

This document contains the shared memory and context for the Xakteir project. All Antigravity agents working on this repository MUST read this file to understand the architecture, design aesthetics, and current state of the project.

## 1. Project Overview
**Xakteir** is a gaming and app ecosystem, essentially a web-based OS/dashboard. It features an app launcher, a premium game store, global UI themes, and social features (Xakchat).

## 2. Design Aesthetics (CRITICAL)
- **Vibe:** Ultra-premium, state-of-the-art, dark mode, glassmorphism, dynamic.
- **Layouts:** The UI resembles high-end systems (like PS5 or modern desktop App Stores). 
- **Colors & Styles:** Uses deep blacks (`bg-[#05030d]`, `bg-[#0f0f15]`), vibrant neon accents (indigo, purple, amber, emerald), smooth gradients, and backdrop blur.
- **Micro-interactions:** Extensive use of `framer-motion` for smooth hover states, page transitions, and subtle scale/opacity animations.
- **Icons:** Uses `lucide-react`.

## 3. Architecture & Tech Stack
- **Framework:** Next.js (App Router), React, Tailwind CSS, Framer Motion.
- **State Management:** Zustand (`src/lib/store.ts` handles global UI states like active menus and layouts).
- **Database / Backend:** Firebase (Firestore). We NEVER mock features; we always implement real functionality with Firebase.
- **Rules:** Firestore rules are strictly configured in `firestore.rules`.
- **Blob Storage:** We use Vercel Blob (but customized for Xakteir using `XktrBlb_...` prefixes).

## 4. Key Features Implemented Recently
- **Dynamic Headers:** The global header layout can be customized via the settings store (Apps & Profile only, Everything Left, Everything Right, Hamburger menu).
- **Game Store (`/games` and `/games/store`):**
  - PS5-style horizontal scrolling library in `/games`.
  - Desktop-style premium store grid in `/games/store` with a "Trending Now" hero section.
- **Game Details (`/game/[id]`):**
  - Features an interactive Tabs interface for "Overview", "Reviews" (with interactive star ratings), and "Achievements".
- **Xakchat Integration:**
  - A global `XakchatSidebar.tsx` (using Shadcn `Sheet`) is injected into the navigation.
  - Allows friends lists, real-time messaging, and "Invite to Game" functionality (powered by Xakchat).

## 5. Collaboration Sync
- Agents communicate using `.agents/skills/xakteir-collab/collab_sync.js`.
- Always check the sync (`node .agents/skills/xakteir-collab/collab_sync.js read`) before making massive changes to avoid stepping on another agent's work.
- Broadcast your intentions when starting/finishing major features.

## 6. How to Continue Work
- Respect the premium design system. Do NOT add generic, boring, or unstyled UI elements.
- Ensure all new features are fully functional (no mocking).
- Automatically commit and push code after successful implementations (per `AGENTS.md` rules).
