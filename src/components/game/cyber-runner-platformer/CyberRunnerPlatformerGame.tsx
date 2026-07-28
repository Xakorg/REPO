"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Trophy,
  Play,
  RotateCcw,
  ArrowLeft,
  Pause,
  Key,
  ShieldAlert,
  Zap,
  Sparkles,
  Award,
  ChevronRight,
  RefreshCw,
  Clock,
  Skull
} from "lucide-react";
import Link from "next/link";

// ==========================================
// 1. PROCEDURAL AUDIO SYNTH
// ==========================================
class PlatformerAudioEngine {
  private ctx: AudioContext | null = null;
  public muted: boolean = false;

  private initCtx() {
    if (!this.ctx && typeof window !== "undefined") {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) this.ctx = new AudioCtx();
    }
    if (this.ctx && this.ctx.state === "suspended") {
      this.ctx.resume();
    }
  }

  public playJump() {
    if (this.muted) return;
    this.initCtx();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(250, now);
    osc.frequency.exponentialRampToValueAtTime(700, now + 0.12);

    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.12);
  }

  public playDash() {
    if (this.muted) return;
    this.initCtx();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = "triangle";
    osc.frequency.setValueAtTime(600, now);
    osc.frequency.exponentialRampToValueAtTime(150, now + 0.15);

    gain.gain.setValueAtTime(0.25, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.15);
  }

  public playPickup() {
    if (this.muted) return;
    this.initCtx();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(587.33, now); // D5
    osc.frequency.setValueAtTime(880, now + 0.08); // A5

    gain.gain.setValueAtTime(0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.2);
  }

  public playKey() {
    if (this.muted) return;
    this.initCtx();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const notes = [523.25, 659.25, 783.99];
    notes.forEach((n, i) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(n, now + i * 0.06);
      gain.gain.setValueAtTime(0.15, now + i * 0.06);
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.06 + 0.1);
      osc.connect(gain);
      gain.connect(this.ctx!.destination);
      osc.start(now + i * 0.06);
      osc.stop(now + i * 0.06 + 0.1);
    });
  }

  public playDeath() {
    if (this.muted) return;
    this.initCtx();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(300, now);
    osc.frequency.exponentialRampToValueAtTime(50, now + 0.3);

    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.3);
  }

  public playVictory() {
    if (this.muted) return;
    this.initCtx();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const notes = [440, 554.37, 659.25, 880];
    notes.forEach((n, i) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(n, now + i * 0.1);
      gain.gain.setValueAtTime(0.2, now + i * 0.1);
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.1 + 0.2);
      osc.connect(gain);
      gain.connect(this.ctx!.destination);
      osc.start(now + i * 0.1);
      osc.stop(now + i * 0.1 + 0.2);
    });
  }
}

const audioSynth = new PlatformerAudioEngine();

// ==========================================
// 2. LEVEL DATA & INTERFACES
// ==========================================
export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
  type?: "solid" | "hazard" | "key" | "portal" | "orb" | "disappearing";
}

export interface LevelData {
  id: number;
  name: string;
  parTime: number;
  spawn: { x: number; y: number };
  platforms: Rect[];
  hazards: Rect[];
  key?: { x: number; y: number; w: number; h: number };
  portal: { x: number; y: number; w: number; h: number };
  orbs: { x: number; y: number; collected?: boolean }[];
}

const LEVELS: LevelData[] = [
  {
    id: 1,
    name: "Sector 01: Training Facility",
    parTime: 12,
    spawn: { x: 80, y: 550 },
    portal: { x: 1150, y: 530, w: 40, h: 60 },
    platforms: [
      { x: 0, y: 620, w: 1280, h: 100, type: "solid" },
      { x: 300, y: 500, w: 140, h: 20, type: "solid" },
      { x: 550, y: 420, w: 140, h: 20, type: "solid" },
      { x: 800, y: 480, w: 140, h: 20, type: "solid" },
      { x: 1050, y: 580, w: 180, h: 20, type: "solid" }
    ],
    hazards: [{ x: 480, y: 600, w: 200, h: 20, type: "hazard" }],
    orbs: [
      { x: 370, y: 460 },
      { x: 620, y: 380 },
      { x: 870, y: 440 }
    ]
  },
  {
    id: 2,
    name: "Sector 02: Laser Vault",
    parTime: 15,
    spawn: { x: 80, y: 250 },
    portal: { x: 1150, y: 550, w: 40, h: 60 },
    key: { x: 1160, y: 150, w: 24, h: 24 },
    platforms: [
      { x: 50, y: 300, w: 180, h: 20, type: "solid" },
      { x: 320, y: 240, w: 120, h: 20, type: "solid" },
      { x: 520, y: 320, w: 120, h: 20, type: "solid" },
      { x: 720, y: 220, w: 120, h: 20, type: "solid" },
      { x: 950, y: 180, w: 250, h: 20, type: "solid" },
      { x: 1050, y: 620, w: 200, h: 20, type: "solid" }
    ],
    hazards: [
      { x: 0, y: 700, w: 1280, h: 20, type: "hazard" },
      { x: 460, y: 0, w: 20, h: 450, type: "hazard" },
      { x: 860, y: 200, w: 20, h: 500, type: "hazard" }
    ],
    orbs: [
      { x: 380, y: 200 },
      { x: 780, y: 180 },
      { x: 1120, y: 580 }
    ]
  },
  {
    id: 3,
    name: "Sector 03: Precision Spikes",
    parTime: 18,
    spawn: { x: 80, y: 550 },
    portal: { x: 1150, y: 180, w: 40, h: 60 },
    key: { x: 620, y: 140, w: 24, h: 24 },
    platforms: [
      { x: 40, y: 620, w: 160, h: 20, type: "solid" },
      { x: 260, y: 540, w: 90, h: 20, type: "solid" },
      { x: 420, y: 440, w: 90, h: 20, type: "solid" },
      { x: 580, y: 200, w: 100, h: 20, type: "solid" },
      { x: 760, y: 320, w: 90, h: 20, type: "solid" },
      { x: 940, y: 240, w: 90, h: 20, type: "solid" },
      { x: 1120, y: 240, w: 140, h: 20, type: "solid" }
    ],
    hazards: [
      { x: 0, y: 700, w: 1280, h: 20, type: "hazard" },
      { x: 200, y: 580, w: 800, h: 20, type: "hazard" }
    ],
    orbs: [
      { x: 305, y: 500 },
      { x: 465, y: 400 },
      { x: 805, y: 280 }
    ]
  }
];

// ==========================================
// 3. MAIN GAME COMPONENT
// ==========================================
export default function CyberRunnerPlatformerGame() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [gameState, setGameState] = useState<"menu" | "playing" | "levelselect" | "paused" | "victory" | "gameover">("menu");
  const [currentLevelIdx, setCurrentLevelIdx] = useState(0);

  // Player Stats
  const [deaths, setDeaths] = useState(0);
  const [orbsCount, setOrbsCount] = useState(0);
  const [hasKey, setHasKey] = useState(false);
  const [timer, setTimer] = useState(0);

  // Input states
  const keys = useRef<{ [key: string]: boolean }>({});

  // Physics engine states
  const playerRef = useRef({
    x: 100,
    y: 500,
    w: 24,
    h: 36,
    vx: 0,
    vy: 0,
    speed: 6,
    jumpForce: 13,
    grounded: false,
    doubleJumpAvailable: true,
    dashAvailable: true,
    isDashing: false,
    dashTimer: 0,
    facing: 1
  });

  const levelDataRef = useRef<LevelData>(LEVELS[0]);
  const activeOrbsRef = useRef<{ x: number; y: number; collected: boolean }[]>([]);
  const keyCollectedRef = useRef(false);

  // Load level initialization
  const loadLevel = (idx: number) => {
    const lvl = LEVELS[idx];
    setCurrentLevelIdx(idx);
    levelDataRef.current = lvl;
    playerRef.current.x = lvl.spawn.x;
    playerRef.current.y = lvl.spawn.y;
    playerRef.current.vx = 0;
    playerRef.current.vy = 0;

    activeOrbsRef.current = lvl.orbs.map((o) => ({ ...o, collected: false }));
    keyCollectedRef.current = false;
    setHasKey(!lvl.key); // if no key required, true by default
    setTimer(0);
    setGameState("playing");
  };

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      keys.current[e.code] = true;

      if (gameState === "playing") {
        const p = playerRef.current;

        // Jump / Double Jump
        if (e.code === "Space" || e.code === "KeyW" || e.code === "ArrowUp") {
          if (p.grounded) {
            p.vy = -p.jumpForce;
            p.grounded = false;
            p.doubleJumpAvailable = true;
            audioSynth.playJump();
          } else if (p.doubleJumpAvailable) {
            p.vy = -p.jumpForce * 0.9;
            p.doubleJumpAvailable = false;
            audioSynth.playJump();
          }
        }

        // Dash
        if ((e.code === "ShiftLeft" || e.code === "ShiftRight") && p.dashAvailable && !p.isDashing) {
          p.isDashing = true;
          p.dashTimer = 0.18;
          p.dashAvailable = false;
          p.vx = p.facing * 16;
          audioSynth.playDash();
        }

        if (e.code === "KeyP" || e.code === "Escape") {
          setGameState((prev) => (prev === "playing" ? "paused" : prev === "paused" ? "playing" : prev));
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      keys.current[e.code] = false;
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [gameState]);

  // MAIN 60 FPS ENGINE LOOP
  useEffect(() => {
    if (gameState !== "playing") return;

    let animId: number;
    let lastTime = performance.now();

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const gameLoop = (now: number) => {
      const delta = Math.min((now - lastTime) / 1000, 0.1);
      lastTime = now;

      setTimer((t) => t + delta);

      const p = playerRef.current;
      const lvl = levelDataRef.current;

      // 1. Horizontal Movement & Dash Engine
      if (p.isDashing) {
        p.dashTimer -= delta;
        if (p.dashTimer <= 0) p.isDashing = false;
      } else {
        let moveDir = 0;
        if (keys.current["KeyA"] || keys.current["ArrowLeft"]) moveDir -= 1;
        if (keys.current["KeyD"] || keys.current["ArrowRight"]) moveDir += 1;

        if (moveDir !== 0) {
          p.facing = moveDir;
          p.vx = moveDir * p.speed;
        } else {
          p.vx *= 0.8; // friction
        }

        // Gravity acceleration
        p.vy += 28 * delta;
      }

      // 2. Physics Collision with Platforms (AABB)
      let nextX = p.x + p.vx;
      let nextY = p.y + p.vy;

      p.grounded = false;

      lvl.platforms.forEach((plat) => {
        // Vertical collision check
        if (
          nextX < plat.x + plat.w &&
          nextX + p.w > plat.x &&
          p.y + p.h <= plat.y &&
          nextY + p.h >= plat.y
        ) {
          nextY = plat.y - p.h;
          p.vy = 0;
          p.grounded = true;
          p.doubleJumpAvailable = true;
          p.dashAvailable = true;
        }
      });

      p.x = Math.max(0, Math.min(canvas.width - p.w, nextX));
      p.y = Math.max(0, Math.min(canvas.height - p.h, nextY));

      // 3. Hazard Spike/Laser Collisions
      lvl.hazards.forEach((haz) => {
        if (
          p.x < haz.x + haz.w &&
          p.x + p.w > haz.x &&
          p.y < haz.y + haz.h &&
          p.y + p.h > haz.y
        ) {
          // Death trigger
          audioSynth.playDeath();
          setDeaths((d) => d + 1);
          p.x = lvl.spawn.x;
          p.y = lvl.spawn.y;
          p.vx = 0;
          p.vy = 0;
        }
      });

      // 4. Key Pickup
      if (lvl.key && !keyCollectedRef.current) {
        const k = lvl.key;
        if (p.x < k.x + k.w && p.x + p.w > k.x && p.y < k.y + k.h && p.y + p.h > k.y) {
          keyCollectedRef.current = true;
          setHasKey(true);
          audioSynth.playKey();
        }
      }

      // 5. Energy Orbs Pickup
      activeOrbsRef.current.forEach((orb) => {
        if (!orb.collected) {
          if (
            p.x < orb.x + 16 &&
            p.x + p.w > orb.x &&
            p.y < orb.y + 16 &&
            p.y + p.h > orb.y
          ) {
            orb.collected = true;
            setOrbsCount((c) => c + 1);
            audioSynth.playPickup();
          }
        }
      });

      // 6. Portal Gate Win Collision
      const port = lvl.portal;
      if (p.x < port.x + port.w && p.x + p.w > port.x && p.y < port.y + port.h && p.y + p.h > port.y) {
        if (keyCollectedRef.current || !lvl.key) {
          audioSynth.playVictory();
          if (currentLevelIdx + 1 < LEVELS.length) {
            loadLevel(currentLevelIdx + 1);
          } else {
            setGameState("victory");
          }
        }
      }

      // ==========================================
      // RENDER PHASE
      // ==========================================
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Background Grid
      ctx.strokeStyle = "rgba(6, 182, 212, 0.08)";
      ctx.lineWidth = 1;
      for (let x = 0; x < canvas.width; x += 40) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
      }

      // Render Platforms
      lvl.platforms.forEach((plat) => {
        ctx.fillStyle = "#0284c7";
        ctx.shadowColor = "#38bdf8";
        ctx.shadowBlur = 10;
        ctx.fillRect(plat.x, plat.y, plat.w, plat.h);
      });

      // Render Hazards (Spikes/Lasers)
      lvl.hazards.forEach((haz) => {
        ctx.fillStyle = "#f43f5e";
        ctx.shadowColor = "#ef4444";
        ctx.shadowBlur = 15;
        ctx.fillRect(haz.x, haz.y, haz.w, haz.h);
      });

      // Render Key
      if (lvl.key && !keyCollectedRef.current) {
        ctx.fillStyle = "#f59e0b";
        ctx.shadowColor = "#fbbf24";
        ctx.shadowBlur = 15;
        ctx.beginPath();
        ctx.arc(lvl.key.x + 12, lvl.key.y + 12, 10, 0, Math.PI * 2);
        ctx.fill();
      }

      // Render Orbs
      activeOrbsRef.current.forEach((orb) => {
        if (!orb.collected) {
          ctx.fillStyle = "#a855f7";
          ctx.shadowColor = "#c084fc";
          ctx.shadowBlur = 12;
          ctx.beginPath();
          ctx.arc(orb.x + 8, orb.y + 8, 7, 0, Math.PI * 2);
          ctx.fill();
        }
      });

      // Render Portal Door
      ctx.fillStyle = keyCollectedRef.current || !lvl.key ? "#10b981" : "#6b7280";
      ctx.shadowColor = keyCollectedRef.current || !lvl.key ? "#34d399" : "#9ca3af";
      ctx.shadowBlur = 20;
      ctx.fillRect(port.x, port.y, port.w, port.h);

      // Render Cyber Runner Hero
      ctx.fillStyle = p.isDashing ? "#38bdf8" : "#ffffff";
      ctx.shadowColor = "#38bdf8";
      ctx.shadowBlur = 15;
      ctx.fillRect(p.x, p.y, p.w, p.h);

      animId = requestAnimationFrame(gameLoop);
    };

    animId = requestAnimationFrame(gameLoop);
    return () => cancelAnimationFrame(animId);
  }, [gameState, currentLevelIdx]);

  return (
    <div className="fixed inset-0 z-[400] bg-zinc-950 text-white font-sans overflow-hidden select-none">
      <canvas ref={canvasRef} width={1280} height={720} className="w-full h-full object-cover block" />

      {/* LIVE HUD */}
      {gameState === "playing" && (
        <div className="absolute inset-0 pointer-events-none p-6 flex justify-between items-start z-10">
          <div className="bg-black/70 backdrop-blur-xl border border-white/10 p-4 rounded-2xl space-y-2 pointer-events-auto shadow-2xl">
            <div className="text-xs font-black uppercase text-cyan-400 tracking-widest">{LEVELS[currentLevelIdx].name}</div>
            <div className="flex gap-4 text-xs font-bold text-white/70">
              <span className="flex items-center gap-1 text-rose-400">
                <Skull className="w-4 h-4" /> Deaths: {deaths}
              </span>
              <span className="flex items-center gap-1 text-purple-400">
                <Sparkles className="w-4 h-4" /> Orbs: {orbsCount}
              </span>
              <span className="flex items-center gap-1 text-amber-400">
                <Key className="w-4 h-4" /> Key: {hasKey ? "YES" : "NO"}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4 pointer-events-auto">
            <div className="bg-black/70 backdrop-blur-xl border border-white/10 px-6 py-2 rounded-2xl flex items-center gap-2 font-mono font-bold text-white">
              <Clock className="w-4 h-4 text-cyan-400" /> {timer.toFixed(1)}s
            </div>
            <button
              onClick={() => setGameState("paused")}
              className="w-10 h-10 rounded-2xl bg-black/70 border border-white/10 flex items-center justify-center hover:bg-white/20"
            >
              <Pause className="w-5 h-5 text-white" />
            </button>
          </div>
        </div>
      )}

      {/* START MENU */}
      {gameState === "menu" && (
        <div className="absolute inset-0 z-50 bg-black/90 backdrop-blur-2xl flex flex-col items-center justify-center p-8 text-center space-y-6">
          <h1 className="text-6xl font-black italic tracking-tighter uppercase bg-gradient-to-r from-cyan-400 to-purple-500 bg-clip-text text-transparent">
            CYBER RUNNER PLATFORMER
          </h1>
          <p className="text-white/70 text-base max-w-md">Precision 2D platformer. Master double jumps, air dashes, keycards, and hazard vaults.</p>
          <button
            onClick={() => loadLevel(0)}
            className="px-10 py-5 bg-cyan-500 rounded-full font-black text-lg uppercase tracking-widest hover:scale-105 shadow-[0_0_40px_rgba(6,182,212,0.5)] flex items-center gap-3"
          >
            <Play className="w-6 h-6 fill-white" /> Start Platforming
          </button>
          <Link href="/games" className="text-xs font-black uppercase text-white/40 hover:text-white flex items-center gap-2 pt-4">
            <ArrowLeft className="w-4 h-4" /> Return to Games Hub
          </Link>
        </div>
      )}
    </div>
  );
}
