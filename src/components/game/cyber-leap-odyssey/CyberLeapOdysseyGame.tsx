"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Play,
  Pause,
  RotateCcw,
  Volume2,
  VolumeX,
  Trophy,
  Star,
  ArrowLeft,
  ChevronRight,
  Zap,
  Sparkles,
  Shield,
  Layers,
  Flag,
  Award,
  Clock,
  Compass
} from "lucide-react";
import Link from "next/link";

// ==========================================
// TYPES & LEVEL DATA
// ==========================================
export interface LevelPlatform {
  x: number;
  y: number;
  w: number;
  h: number;
  type: "normal" | "crumble" | "bounce" | "laser" | "grav_flip";
  timer?: number;
  active?: boolean;
}

export interface LevelCollectible {
  id: string;
  x: number;
  y: number;
  collected: boolean;
}

export interface LevelHazard {
  x: number;
  y: number;
  w: number;
  h: number;
  type: "spike" | "laser_beam";
}

export interface LevelData {
  id: number;
  name: string;
  parTime: number;
  gravity: number;
  playerStart: { x: number; y: number };
  goal: { x: number; y: number; w: number; h: number };
  platforms: LevelPlatform[];
  hazards: LevelHazard[];
  orbs: LevelCollectible[];
}

export interface Player {
  x: number;
  y: number;
  vx: number;
  vy: number;
  w: number;
  h: number;
  facing: "left" | "right";
  isGrounded: boolean;
  jumpCount: number;
  maxJumps: number;
  dashTimer: number;
  dashCooldown: number;
  gravInverted: boolean;
}

// 8 HANDCRAFTED LEVELS
const LEVEL_DATABASE: LevelData[] = [
  {
    id: 1,
    name: "Initiation Vault",
    parTime: 15,
    gravity: 0.6,
    playerStart: { x: 80, y: 400 },
    goal: { x: 860, y: 150, w: 40, h: 50 },
    platforms: [
      { x: 0, y: 500, w: 250, h: 40, type: "normal" },
      { x: 300, y: 440, w: 160, h: 20, type: "normal" },
      { x: 520, y: 360, w: 160, h: 20, type: "normal" },
      { x: 740, y: 260, w: 200, h: 20, type: "normal" }
    ],
    hazards: [
      { x: 250, y: 520, w: 490, h: 20, type: "spike" }
    ],
    orbs: [
      { id: "o1", x: 380, y: 390, collected: false },
      { id: "o2", x: 600, y: 310, collected: false },
      { id: "o3", x: 820, y: 210, collected: false }
    ]
  },
  {
    id: 2,
    name: "Crumbling Cyberways",
    parTime: 20,
    gravity: 0.6,
    playerStart: { x: 80, y: 450 },
    goal: { x: 880, y: 120, w: 40, h: 50 },
    platforms: [
      { x: 0, y: 520, w: 180, h: 40, type: "normal" },
      { x: 240, y: 460, w: 120, h: 20, type: "crumble" },
      { x: 420, y: 380, w: 120, h: 20, type: "crumble" },
      { x: 600, y: 300, w: 120, h: 20, type: "crumble" },
      { x: 780, y: 200, w: 180, h: 20, type: "normal" }
    ],
    hazards: [
      { x: 0, y: 580, w: 1000, h: 20, type: "spike" }
    ],
    orbs: [
      { id: "o1", x: 300, y: 410, collected: false },
      { id: "o2", x: 480, y: 330, collected: false },
      { id: "o3", x: 660, y: 250, collected: false }
    ]
  },
  {
    id: 3,
    name: "Bounce Core Ascent",
    parTime: 18,
    gravity: 0.65,
    playerStart: { x: 60, y: 480 },
    goal: { x: 860, y: 100, w: 40, h: 50 },
    platforms: [
      { x: 0, y: 540, w: 160, h: 40, type: "normal" },
      { x: 220, y: 480, w: 100, h: 20, type: "bounce" },
      { x: 400, y: 360, w: 100, h: 20, type: "bounce" },
      { x: 600, y: 260, w: 100, h: 20, type: "bounce" },
      { x: 800, y: 180, w: 160, h: 20, type: "normal" }
    ],
    hazards: [
      { x: 160, y: 560, w: 840, h: 20, type: "spike" }
    ],
    orbs: [
      { id: "o1", x: 270, y: 380, collected: false },
      { id: "o2", x: 450, y: 260, collected: false },
      { id: "o3", x: 650, y: 160, collected: false }
    ]
  },
  {
    id: 4,
    name: "Laser Gate Sector",
    parTime: 25,
    gravity: 0.6,
    playerStart: { x: 60, y: 480 },
    goal: { x: 880, y: 140, w: 40, h: 50 },
    platforms: [
      { x: 0, y: 540, w: 160, h: 40, type: "normal" },
      { x: 220, y: 440, w: 140, h: 20, type: "normal" },
      { x: 440, y: 340, w: 140, h: 20, type: "normal" },
      { x: 660, y: 240, w: 140, h: 20, type: "normal" },
      { x: 820, y: 200, w: 140, h: 20, type: "normal" }
    ],
    hazards: [
      { x: 370, y: 300, w: 20, h: 180, type: "laser_beam" },
      { x: 590, y: 200, w: 20, h: 180, type: "laser_beam" },
      { x: 0, y: 580, w: 1000, h: 20, type: "spike" }
    ],
    orbs: [
      { id: "o1", x: 290, y: 390, collected: false },
      { id: "o2", x: 510, y: 290, collected: false },
      { id: "o3", x: 730, y: 190, collected: false }
    ]
  },
  {
    id: 5,
    name: "Gravity Flip Matrix",
    parTime: 22,
    gravity: 0.6,
    playerStart: { x: 60, y: 480 },
    goal: { x: 880, y: 140, w: 40, h: 50 },
    platforms: [
      { x: 0, y: 540, w: 160, h: 40, type: "normal" },
      { x: 240, y: 460, w: 120, h: 20, type: "grav_flip" },
      { x: 420, y: 140, w: 140, h: 20, type: "normal" },
      { x: 640, y: 240, w: 120, h: 20, type: "grav_flip" },
      { x: 820, y: 200, w: 140, h: 20, type: "normal" }
    ],
    hazards: [
      { x: 0, y: 580, w: 1000, h: 20, type: "spike" },
      { x: 0, y: 0, w: 1000, h: 20, type: "spike" }
    ],
    orbs: [
      { id: "o1", x: 300, y: 410, collected: false },
      { id: "o2", x: 490, y: 190, collected: false },
      { id: "o3", x: 700, y: 190, collected: false }
    ]
  },
  {
    id: 6,
    name: "Tachyon Velocity Spire",
    parTime: 28,
    gravity: 0.6,
    playerStart: { x: 60, y: 480 },
    goal: { x: 880, y: 80, w: 40, h: 50 },
    platforms: [
      { x: 0, y: 540, w: 140, h: 40, type: "normal" },
      { x: 180, y: 460, w: 100, h: 20, type: "crumble" },
      { x: 320, y: 380, w: 100, h: 20, type: "bounce" },
      { x: 480, y: 300, w: 100, h: 20, type: "grav_flip" },
      { x: 640, y: 200, w: 120, h: 20, type: "bounce" },
      { x: 820, y: 140, w: 140, h: 20, type: "normal" }
    ],
    hazards: [
      { x: 0, y: 580, w: 1000, h: 20, type: "spike" },
      { x: 430, y: 220, w: 20, h: 140, type: "laser_beam" }
    ],
    orbs: [
      { id: "o1", x: 230, y: 410, collected: false },
      { id: "o2", x: 530, y: 250, collected: false },
      { id: "o3", x: 700, y: 150, collected: false }
    ]
  },
  {
    id: 7,
    name: "Quantum Gauntlet",
    parTime: 32,
    gravity: 0.65,
    playerStart: { x: 60, y: 480 },
    goal: { x: 880, y: 120, w: 40, h: 50 },
    platforms: [
      { x: 0, y: 540, w: 140, h: 40, type: "normal" },
      { x: 200, y: 450, w: 100, h: 20, type: "bounce" },
      { x: 360, y: 380, w: 100, h: 20, type: "crumble" },
      { x: 520, y: 300, w: 100, h: 20, type: "bounce" },
      { x: 680, y: 220, w: 100, h: 20, type: "grav_flip" },
      { x: 820, y: 180, w: 140, h: 20, type: "normal" }
    ],
    hazards: [
      { x: 0, y: 580, w: 1000, h: 20, type: "spike" },
      { x: 300, y: 300, w: 20, h: 180, type: "laser_beam" },
      { x: 620, y: 150, w: 20, h: 180, type: "laser_beam" }
    ],
    orbs: [
      { id: "o1", x: 250, y: 400, collected: false },
      { id: "o2", x: 570, y: 250, collected: false },
      { id: "o3", x: 730, y: 170, collected: false }
    ]
  },
  {
    id: 8,
    name: "Apex Cyber Citadel",
    parTime: 35,
    gravity: 0.65,
    playerStart: { x: 60, y: 480 },
    goal: { x: 880, y: 80, w: 40, h: 50 },
    platforms: [
      { x: 0, y: 540, w: 140, h: 40, type: "normal" },
      { x: 180, y: 450, w: 90, h: 20, type: "crumble" },
      { x: 310, y: 370, w: 90, h: 20, type: "bounce" },
      { x: 440, y: 290, w: 90, h: 20, type: "grav_flip" },
      { x: 580, y: 210, w: 90, h: 20, type: "bounce" },
      { x: 710, y: 150, w: 90, h: 20, type: "crumble" },
      { x: 840, y: 130, w: 120, h: 20, type: "normal" }
    ],
    hazards: [
      { x: 0, y: 580, w: 1000, h: 20, type: "spike" },
      { x: 270, y: 280, w: 20, h: 200, type: "laser_beam" },
      { x: 530, y: 120, w: 20, h: 200, type: "laser_beam" }
    ],
    orbs: [
      { id: "o1", x: 225, y: 400, collected: false },
      { id: "o2", x: 485, y: 240, collected: false },
      { id: "o3", x: 755, y: 100, collected: false }
    ]
  }
];

// WEB AUDIO SYNTHESIZER
class PlatformAudioEngine {
  private ctx: AudioContext | null = null;
  private muted: boolean = false;

  public setMuted(muted: boolean) {
    this.muted = muted;
  }

  private init() {
    if (!this.ctx && typeof window !== "undefined") {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) this.ctx = new AudioCtx();
    }
    if (this.ctx && this.ctx.state === "suspended") this.ctx.resume();
  }

  public playJump() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(250, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(600, this.ctx.currentTime + 0.12);
      gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.12);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.12);
    } catch {}
  }

  public playBounce() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(300, this.ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(900, this.ctx.currentTime + 0.15);
      gain.gain.setValueAtTime(0.3, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.15);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.15);
    } catch {}
  }

  public playOrb() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(523.25, this.ctx.currentTime); // C5
      osc.frequency.setValueAtTime(659.25, this.ctx.currentTime + 0.08); // E5
      gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.2);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.2);
    } catch {}
  }

  public playDeath() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(400, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(60, this.ctx.currentTime + 0.25);
      gain.gain.setValueAtTime(0.3, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.25);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.25);
    } catch {}
  }

  public playGoal() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;
    try {
      const notes = [523.25, 659.25, 783.99, 1046.5];
      notes.forEach((freq, idx) => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = "triangle";
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime + idx * 0.08);
        gain.gain.setValueAtTime(0.2, this.ctx.currentTime + idx * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + idx * 0.08 + 0.2);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(this.ctx.currentTime + idx * 0.08);
        osc.stop(this.ctx.currentTime + idx * 0.08 + 0.2);
      });
    } catch {}
  }
}

const audio = new PlatformAudioEngine();

export default function CyberLeapOdysseyGame() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // States
  const [gameState, setGameState] = useState<"menu" | "levels" | "playing" | "paused" | "completed">("menu");
  const [currentLevelIdx, setCurrentLevelIdx] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [deaths, setDeaths] = useState(0);
  const [timer, setTimer] = useState(0);
  const [orbsCollectedCount, setOrbsCollectedCount] = useState(0);
  const [starRatings, setStarRatings] = useState<Record<number, number>>({});

  // Engine Refs
  const engineRef = useRef({
    keys: {} as Record<string, boolean>,
    player: {
      x: 0,
      y: 0,
      vx: 0,
      vy: 0,
      w: 24,
      h: 36,
      facing: "right",
      isGrounded: false,
      jumpCount: 0,
      maxJumps: 2,
      dashTimer: 0,
      dashCooldown: 0,
      gravInverted: false
    } as Player,
    currentLevel: LEVEL_DATABASE[0],
    orbs: [] as LevelCollectible[],
    platforms: [] as LevelPlatform[],
    particles: [] as { x: number; y: number; vx: number; vy: number; radius: number; color: string; life: number }[],
    animFrameId: 0,
    startTime: 0
  });

  const toggleMute = () => {
    const next = !isMuted;
    setIsMuted(next);
    audio.setMuted(next);
  };

  // Keyboard Listeners
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      engineRef.current.keys[k] = true;

      if (k === "p" || k === "escape") {
        if (gameState === "playing") setGameState("paused");
        else if (gameState === "paused") setGameState("playing");
      }

      if (gameState === "playing") {
        if (k === "w" || k === "arrowup" || k === " ") performJump();
        if (k === "shift" || k === "k") performDash();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      engineRef.current.keys[e.key.toLowerCase()] = false;
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [gameState]);

  const performJump = () => {
    const p = engineRef.current.player;
    if (p.jumpCount < p.maxJumps) {
      const dir = p.gravInverted ? 1 : -1;
      p.vy = dir * 11;
      p.jumpCount++;
      p.isGrounded = false;
      audio.playJump();
      spawnSparks(p.x + p.w / 2, p.y + p.h / 2, "#00f0ff", 8);
    }
  };

  const performDash = () => {
    const p = engineRef.current.player;
    if (p.dashCooldown > 0) return;
    p.dashTimer = 10;
    p.dashCooldown = 35;
    p.vx = p.facing === "right" ? 16 : -16;
    audio.playJump();
    spawnSparks(p.x + p.w / 2, p.y + p.h / 2, "#ff0077", 10);
  };

  const spawnSparks = (x: number, y: number, color: string, count: number) => {
    for (let i = 0; i < count; i++) {
      engineRef.current.particles.push({
        x,
        y,
        vx: (Math.random() - 0.5) * 6,
        vy: (Math.random() - 0.5) * 6,
        radius: 2 + Math.random() * 3,
        color,
        life: 15
      });
    }
  };

  const loadLevel = (idx: number) => {
    const lvl = LEVEL_DATABASE[idx];
    setCurrentLevelIdx(idx);
    engineRef.current.currentLevel = lvl;
    engineRef.current.player = {
      x: lvl.playerStart.x,
      y: lvl.playerStart.y,
      vx: 0,
      vy: 0,
      w: 24,
      h: 36,
      facing: "right",
      isGrounded: false,
      jumpCount: 0,
      maxJumps: 2,
      dashTimer: 0,
      dashCooldown: 0,
      gravInverted: false
    };
    engineRef.current.orbs = lvl.orbs.map((o) => ({ ...o, collected: false }));
    engineRef.current.platforms = lvl.platforms.map((p) => ({ ...p, active: true, timer: 0 }));
    engineRef.current.particles = [];
    engineRef.current.startTime = Date.now();

    setOrbsCollectedCount(0);
    setTimer(0);
    setGameState("playing");
  };

  // Main Loop
  useEffect(() => {
    if (gameState !== "playing") return;

    const loop = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const engine = engineRef.current;
      const { keys, player, currentLevel, platforms, orbs } = engine;

      // Update timer
      const elapsed = Math.floor((Date.now() - engine.startTime) / 1000);
      setTimer(elapsed);

      // Player Movement Physics
      if (player.dashCooldown > 0) player.dashCooldown--;

      if (player.dashTimer > 0) {
        player.dashTimer--;
      } else {
        const speed = 5.5;
        if (keys["a"] || keys["arrowleft"]) {
          player.vx = -speed;
          player.facing = "left";
        } else if (keys["d"] || keys["arrowright"]) {
          player.vx = speed;
          player.facing = "right";
        } else {
          player.vx *= 0.75;
        }

        // Apply Gravity
        const g = player.gravInverted ? -currentLevel.gravity : currentLevel.gravity;
        player.vy += g;
      }

      player.x += player.vx;
      player.y += player.vy;

      // Platform Collision
      player.isGrounded = false;
      platforms.forEach((plat) => {
        if (!plat.active) return;

        if (
          player.x < plat.x + plat.w &&
          player.x + player.w > plat.x &&
          player.y < plat.y + plat.h &&
          player.y + player.h > plat.y
        ) {
          // Landing from top
          if (!player.gravInverted && player.vy > 0 && player.y + player.h - player.vy <= plat.y + 10) {
            player.y = plat.y - player.h;
            player.vy = 0;
            player.isGrounded = true;
            player.jumpCount = 0;

            if (plat.type === "bounce") {
              player.vy = -14;
              audio.playBounce();
              spawnSparks(player.x + player.w / 2, player.y + player.h, "#00ffcc", 10);
            } else if (plat.type === "crumble") {
              plat.timer = (plat.timer || 0) + 1;
              if (plat.timer > 15) plat.active = false;
            } else if (plat.type === "grav_flip") {
              player.gravInverted = !player.gravInverted;
              player.vy = player.gravInverted ? -8 : 8;
              audio.playBounce();
            }
          }
          // Landing from bottom when inverted gravity
          else if (player.gravInverted && player.vy < 0 && player.y - player.vy >= plat.y + plat.h - 10) {
            player.y = plat.y + plat.h;
            player.vy = 0;
            player.isGrounded = true;
            player.jumpCount = 0;

            if (plat.type === "bounce") {
              player.vy = 14;
              audio.playBounce();
            } else if (plat.type === "grav_flip") {
              player.gravInverted = !player.gravInverted;
              player.vy = 8;
              audio.playBounce();
            }
          }
        }
      });

      // Hazard Collision
      currentLevel.hazards.forEach((haz) => {
        if (
          player.x < haz.x + haz.w &&
          player.x + player.w > haz.x &&
          player.y < haz.y + haz.h &&
          player.y + player.h > haz.y
        ) {
          // Death trigger
          respawnPlayer();
        }
      });

      // Screen boundary death
      if (player.y > canvas.height + 100 || player.y < -100) {
        respawnPlayer();
      }

      // Collectible Orbs
      orbs.forEach((orb) => {
        if (!orb.collected) {
          const dist = Math.hypot(player.x + player.w / 2 - orb.x, player.y + player.h / 2 - orb.y);
          if (dist < 22) {
            orb.collected = true;
            audio.playOrb();
            setOrbsCollectedCount((prev) => prev + 1);
            spawnSparks(orb.x, orb.y, "#ffcc00", 12);
          }
        }
      });

      // Goal Reach Check
      const goal = currentLevel.goal;
      if (
        player.x < goal.x + goal.w &&
        player.x + player.w > goal.x &&
        player.y < goal.y + goal.h &&
        player.y + player.h > goal.y
      ) {
        // Level Completed!
        audio.playGoal();
        const collectedCount = orbs.filter((o) => o.collected).length;
        let stars = 1;
        if (collectedCount === 3) stars++;
        if (elapsed <= currentLevel.parTime) stars++;

        setStarRatings((prev) => ({ ...prev, [currentLevel.id]: Math.max(prev[currentLevel.id] || 0, stars) }));
        setGameState("completed");
      }

      // Render
      ctx.fillStyle = "#09090b";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Grid Pattern
      ctx.strokeStyle = "rgba(0, 240, 255, 0.05)";
      ctx.lineWidth = 1;
      for (let x = 0; x < canvas.width; x += 40) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, canvas.height); ctx.stroke();
      }

      // Platforms
      platforms.forEach((plat) => {
        if (!plat.active) return;
        ctx.fillStyle =
          plat.type === "crumble" ? "#f43f5e" :
          plat.type === "bounce" ? "#10b981" :
          plat.type === "grav_flip" ? "#a855f7" : "#06b6d4";
        ctx.fillRect(plat.x, plat.y, plat.w, plat.h);
      });

      // Hazards
      currentLevel.hazards.forEach((haz) => {
        if (haz.type === "spike") {
          ctx.fillStyle = "#ef4444";
          for (let x = haz.x; x < haz.x + haz.w; x += 15) {
            ctx.beginPath();
            ctx.moveTo(x, haz.y + haz.h);
            ctx.lineTo(x + 7.5, haz.y);
            ctx.lineTo(x + 15, haz.y + haz.h);
            ctx.fill();
          }
        } else if (haz.type === "laser_beam") {
          ctx.fillStyle = "#f43f5e";
          ctx.shadowColor = "#f43f5e";
          ctx.shadowBlur = 15;
          ctx.fillRect(haz.x, haz.y, haz.w, haz.h);
          ctx.shadowBlur = 0;
        }
      });

      // Orbs
      orbs.forEach((orb) => {
        if (!orb.collected) {
          ctx.fillStyle = "#ffcc00";
          ctx.shadowColor = "#ffcc00";
          ctx.shadowBlur = 12;
          ctx.beginPath();
          ctx.arc(orb.x, orb.y, 8, 0, Math.PI * 2);
          ctx.fill();
          ctx.shadowBlur = 0;
        }
      });

      // Goal Portal
      ctx.fillStyle = "#10b981";
      ctx.shadowColor = "#10b981";
      ctx.shadowBlur = 20;
      ctx.fillRect(goal.x, goal.y, goal.w, goal.h);
      ctx.shadowBlur = 0;

      // Player
      ctx.fillStyle = player.gravInverted ? "#a855f7" : "#00f0ff";
      ctx.shadowColor = player.gravInverted ? "#a855f7" : "#00f0ff";
      ctx.shadowBlur = 12;
      ctx.fillRect(player.x, player.y, player.w, player.h);
      ctx.shadowBlur = 0;

      // Particles
      engine.particles.forEach((pt) => {
        pt.x += pt.vx;
        pt.y += pt.vy;
        pt.life--;
        ctx.fillStyle = pt.color;
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, pt.radius, 0, Math.PI * 2);
        ctx.fill();
      });
      engine.particles = engine.particles.filter((pt) => pt.life > 0);

      engine.animFrameId = requestAnimationFrame(loop);
    };

    const respawnPlayer = () => {
      audio.playDeath();
      setDeaths((prev) => prev + 1);
      const lvl = engineRef.current.currentLevel;
      engineRef.current.player.x = lvl.playerStart.x;
      engineRef.current.player.y = lvl.playerStart.y;
      engineRef.current.player.vx = 0;
      engineRef.current.player.vy = 0;
      engineRef.current.player.gravInverted = false;
      engineRef.current.platforms.forEach((p) => { p.active = true; p.timer = 0; });
      spawnSparks(lvl.playerStart.x, lvl.playerStart.y, "#ef4444", 15);
    };

    engineRef.current.animFrameId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(engineRef.current.animFrameId);
  }, [gameState]);

  useEffect(() => {
    if (canvasRef.current) {
      canvasRef.current.width = 1000;
      canvasRef.current.height = 600;
    }
  }, []);

  return (
    <div className="relative w-full h-screen bg-black overflow-hidden select-none font-sans text-white flex flex-col items-center justify-center">
      {/* CANVAS CONTAINER */}
      <div className="relative w-[1000px] h-[600px] bg-zinc-950 border border-cyan-500/30 rounded-3xl overflow-hidden shadow-[0_0_50px_rgba(6,182,212,0.15)]">
        <canvas ref={canvasRef} className="w-full h-full block" />

        {/* HUD OVERLAY */}
        {gameState === "playing" && (
          <div className="absolute top-4 left-6 right-6 flex justify-between items-center pointer-events-none z-10">
            <div className="flex items-center gap-4 bg-black/70 backdrop-blur-md px-5 py-2.5 rounded-2xl border border-cyan-500/30">
              <span className="text-xs font-bold uppercase tracking-wider text-cyan-400">
                LVL {LEVEL_DATABASE[currentLevelIdx].id}: {LEVEL_DATABASE[currentLevelIdx].name}
              </span>
              <div className="flex items-center gap-1 text-amber-400 font-bold text-xs">
                <Sparkles className="w-3.5 h-3.5" /> {orbsCollectedCount} / 3
              </div>
            </div>

            <div className="flex items-center gap-4 bg-black/70 backdrop-blur-md px-5 py-2.5 rounded-2xl border border-cyan-500/30">
              <div className="flex items-center gap-1.5 text-xs font-bold text-rose-400">
                <Flag className="w-3.5 h-3.5" /> Deaths: {deaths}
              </div>
              <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-400">
                <Clock className="w-3.5 h-3.5" /> Time: {timer}s
              </div>
            </div>

            <div className="flex items-center gap-2 pointer-events-auto">
              <button onClick={toggleMute} className="p-2.5 bg-black/50 hover:bg-black/80 border border-white/20 rounded-xl">
                {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-cyan-400" />}
              </button>
              <button onClick={() => setGameState("paused")} className="p-2.5 bg-black/50 hover:bg-black/80 border border-white/20 rounded-xl">
                <Pause className="w-4 h-4 text-cyan-400" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* START MENU */}
      {gameState === "menu" && (
        <div className="absolute inset-0 z-30 bg-gradient-to-br from-black via-zinc-950 to-cyan-950 flex flex-col items-center justify-center p-6">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="max-w-xl w-full bg-black/80 backdrop-blur-2xl border border-cyan-500/30 rounded-3xl p-8 text-center flex flex-col items-center shadow-[0_0_50px_rgba(6,182,212,0.2)]"
          >
            <div className="w-16 h-16 rounded-2xl bg-cyan-500/10 border border-cyan-400/40 flex items-center justify-center mb-6">
              <Compass className="w-8 h-8 text-cyan-400 animate-pulse" />
            </div>
            <h1 className="text-4xl md:text-5xl font-black uppercase tracking-tighter mb-2 bg-gradient-to-r from-cyan-400 via-teal-300 to-emerald-400 bg-clip-text text-transparent">
              Cyber Leap Odyssey
            </h1>
            <p className="text-zinc-400 text-sm mb-8">
              Precision 2D level platforming. Master gravity flips, wall jumps, and Crumble Cyberways across 8 levels.
            </p>
            <div className="flex gap-4 w-full">
              <button
                onClick={() => setGameState("levels")}
                className="flex-1 py-4 bg-gradient-to-r from-cyan-500 to-teal-600 text-white font-black uppercase tracking-widest rounded-2xl hover:scale-105 transition-all flex items-center justify-center gap-2 shadow-[0_0_25px_rgba(6,182,212,0.4)]"
              >
                <Play className="w-5 h-5 fill-white" /> Level Select
              </button>
              <Link
                href="/games"
                className="px-6 py-4 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold uppercase tracking-wider rounded-2xl transition-all flex items-center justify-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" /> Arcade Hub
              </Link>
            </div>
          </motion.div>
        </div>
      )}

      {/* LEVEL SELECT MENU */}
      {gameState === "levels" && (
        <div className="absolute inset-0 z-30 bg-black/90 backdrop-blur-xl flex flex-col items-center justify-center p-6">
          <div className="max-w-3xl w-full bg-zinc-950 border border-cyan-500/30 rounded-3xl p-8">
            <div className="flex justify-between items-center mb-6 pb-4 border-b border-white/10">
              <h2 className="text-2xl font-black uppercase tracking-wider text-cyan-400">Select Mission Level</h2>
              <button onClick={() => setGameState("menu")} className="px-4 py-2 bg-white/5 hover:bg-white/10 rounded-xl text-xs font-bold uppercase">
                Back to Menu
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
              {LEVEL_DATABASE.map((lvl, idx) => (
                <button
                  key={lvl.id}
                  onClick={() => loadLevel(idx)}
                  className="bg-white/5 hover:bg-cyan-500/20 border border-white/10 hover:border-cyan-500/40 p-4 rounded-2xl flex flex-col items-center transition-all group"
                >
                  <span className="text-xs font-bold text-zinc-500 group-hover:text-cyan-400">LEVEL {lvl.id}</span>
                  <span className="font-bold text-sm text-white my-1 text-center">{lvl.name}</span>
                  <div className="flex gap-1 text-amber-400 mt-2">
                    {[1, 2, 3].map((star) => (
                      <Star key={star} className={`w-3.5 h-3.5 ${star <= (starRatings[lvl.id] || 0) ? "fill-amber-400 text-amber-400" : "text-zinc-700"}`} />
                    ))}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* LEVEL COMPLETED MODAL */}
      {gameState === "completed" && (
        <div className="absolute inset-0 z-30 bg-black/90 backdrop-blur-xl flex items-center justify-center p-6">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="max-w-md w-full bg-zinc-950 border border-emerald-500/40 rounded-3xl p-8 text-center flex flex-col items-center"
          >
            <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mb-4 text-emerald-400">
              <Award className="w-8 h-8" />
            </div>
            <h2 className="text-3xl font-black uppercase tracking-wider text-emerald-400 mb-1">Level Cleared!</h2>
            <p className="text-xs text-zinc-400 mb-6">{LEVEL_DATABASE[currentLevelIdx].name}</p>

            <div className="flex gap-2 mb-6">
              {[1, 2, 3].map((star) => (
                <Star
                  key={star}
                  className={`w-8 h-8 ${star <= (starRatings[LEVEL_DATABASE[currentLevelIdx].id] || 1) ? "fill-amber-400 text-amber-400" : "text-zinc-700"}`}
                />
              ))}
            </div>

            <div className="flex gap-3 w-full">
              {currentLevelIdx < LEVEL_DATABASE.length - 1 ? (
                <button
                  onClick={() => loadLevel(currentLevelIdx + 1)}
                  className="flex-1 py-4 bg-emerald-500 text-white font-black uppercase tracking-wider rounded-2xl hover:bg-emerald-400 transition-all flex items-center justify-center gap-2"
                >
                  Next Level <ChevronRight className="w-5 h-5" />
                </button>
              ) : (
                <button
                  onClick={() => setGameState("levels")}
                  className="flex-1 py-4 bg-emerald-500 text-white font-black uppercase tracking-wider rounded-2xl hover:bg-emerald-400 transition-all"
                >
                  All Levels Completed!
                </button>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
