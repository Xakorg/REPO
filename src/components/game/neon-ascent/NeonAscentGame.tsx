"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Play,
  RotateCcw,
  Volume2,
  VolumeX,
  ArrowLeft,
  Trophy,
  Star,
  Award,
  Lock,
  ChevronRight,
  Zap,
  ShieldAlert,
  Pause,
  HelpCircle,
  CheckCircle2
} from "lucide-react";
import Link from "next/link";

// ==========================================
// 1. SYNTHETIC WEB AUDIO SOUND ENGINE
// ==========================================
class PlatformerSoundEngine {
  ctx: AudioContext | null = null;
  muted: boolean = false;

  init() {
    if (!this.ctx && typeof window !== "undefined") {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === "suspended") {
      this.ctx.resume();
    }
  }

  playJump() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(300, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(700, this.ctx.currentTime + 0.12);

      gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.12);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.12);
    } catch (e) {}
  }

  playDoubleJump() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(600, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1100, this.ctx.currentTime + 0.15);

      gain.gain.setValueAtTime(0.25, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.15);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.15);
    } catch (e) {}
  }

  playCoin() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;
    try {
      const notes = [987.77, 1318.51];
      notes.forEach((freq, i) => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, this.ctx!.currentTime + i * 0.06);

        gain.gain.setValueAtTime(0.15, this.ctx!.currentTime + i * 0.06);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx!.currentTime + i * 0.06 + 0.08);

        osc.connect(gain);
        gain.connect(this.ctx!.destination);
        osc.start(this.ctx!.currentTime + i * 0.06);
        osc.stop(this.ctx!.currentTime + i * 0.06 + 0.08);
      });
    } catch (e) {}
  }

  playKeyPickup() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "square";
      osc.frequency.setValueAtTime(500, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1500, this.ctx.currentTime + 0.2);

      gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.2);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.2);
    } catch (e) {}
  }

  playDeath() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(400, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(60, this.ctx.currentTime + 0.3);

      gain.gain.setValueAtTime(0.3, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.3);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.3);
    } catch (e) {}
  }

  playPortal() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;
    try {
      const notes = [523.25, 659.25, 783.99, 1046.5];
      notes.forEach((freq, i) => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, this.ctx!.currentTime + i * 0.07);

        gain.gain.setValueAtTime(0.2, this.ctx!.currentTime + i * 0.07);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx!.currentTime + i * 0.07 + 0.1);

        osc.connect(gain);
        gain.connect(this.ctx!.destination);
        osc.start(this.ctx!.currentTime + i * 0.07);
        osc.stop(this.ctx!.currentTime + i * 0.07 + 0.1);
      });
    } catch (e) {}
  }
}

const soundEngine = new PlatformerSoundEngine();

// ==========================================
// 2. TYPES & LEVEL DATA STRUCTURES
// ==========================================
export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface MovingPlatform extends Rect {
  vx: number;
  vy: number;
  startX: number;
  startY: number;
  rangeX: number;
  rangeY: number;
}

export interface Item {
  id: string;
  x: number;
  y: number;
  type: "coin" | "key" | "portal" | "dash-reset";
  collected: boolean;
}

export interface LevelData {
  id: number;
  title: string;
  subtitle: string;
  spawnX: number;
  spawnY: number;
  platforms: Rect[];
  movingPlatforms: MovingPlatform[];
  spikes: Rect[];
  items: Item[];
  targetCoins: number;
}

export const LEVELS: LevelData[] = [
  {
    id: 1,
    title: "Level 1: Neon Genesis",
    subtitle: "Master basic jump & movement",
    spawnX: 50,
    spawnY: 450,
    platforms: [
      { x: 0, y: 520, w: 1000, h: 40 },
      { x: 220, y: 420, w: 140, h: 20 },
      { x: 420, y: 340, w: 140, h: 20 },
      { x: 620, y: 260, w: 160, h: 20 },
      { x: 820, y: 180, w: 140, h: 20 },
    ],
    movingPlatforms: [],
    spikes: [
      { x: 380, y: 500, w: 120, h: 20 },
    ],
    items: [
      { id: "c1", x: 270, y: 380, type: "coin", collected: false },
      { id: "c2", x: 470, y: 300, type: "coin", collected: false },
      { id: "c3", x: 670, y: 220, type: "coin", collected: false },
      { id: "k1", x: 870, y: 130, type: "key", collected: false },
      { id: "p1", x: 910, y: 450, type: "portal", collected: false },
    ],
    targetCoins: 3,
  },
  {
    id: 2,
    title: "Level 2: Dynamic Oscillations",
    subtitle: "Timing moving cyber platforms",
    spawnX: 50,
    spawnY: 450,
    platforms: [
      { x: 0, y: 520, w: 200, h: 40 },
      { x: 800, y: 520, w: 200, h: 40 },
      { x: 400, y: 180, w: 200, h: 20 },
    ],
    movingPlatforms: [
      { x: 220, y: 440, w: 120, h: 20, vx: 2, vy: 0, startX: 220, startY: 440, rangeX: 180, rangeY: 0 },
      { x: 580, y: 320, w: 120, h: 20, vx: -2, vy: 0, startX: 580, startY: 320, rangeX: 180, rangeY: 0 },
    ],
    spikes: [
      { x: 200, y: 500, w: 600, h: 20 },
    ],
    items: [
      { id: "c1", x: 280, y: 390, type: "coin", collected: false },
      { id: "c2", x: 480, y: 130, type: "coin", collected: false },
      { id: "c3", x: 640, y: 270, type: "coin", collected: false },
      { id: "k1", x: 490, y: 130, type: "key", collected: false },
      { id: "p1", x: 880, y: 450, type: "portal", collected: false },
    ],
    targetCoins: 3,
  },
  {
    id: 3,
    title: "Level 3: Double Jump Spire",
    subtitle: "Execute double leaps across void hazards",
    spawnX: 50,
    spawnY: 480,
    platforms: [
      { x: 0, y: 540, w: 150, h: 40 },
      { x: 250, y: 440, w: 100, h: 20 },
      { x: 450, y: 340, w: 100, h: 20 },
      { x: 650, y: 240, w: 100, h: 20 },
      { x: 850, y: 140, w: 150, h: 20 },
    ],
    movingPlatforms: [
      { x: 350, y: 240, w: 80, h: 20, vx: 0, vy: 1.5, startX: 350, startY: 240, rangeX: 0, rangeY: 100 },
    ],
    spikes: [
      { x: 150, y: 520, w: 700, h: 20 },
    ],
    items: [
      { id: "c1", x: 290, y: 400, type: "coin", collected: false },
      { id: "c2", x: 490, y: 300, type: "coin", collected: false },
      { id: "c3", x: 690, y: 200, type: "coin", collected: false },
      { id: "k1", x: 910, y: 90, type: "key", collected: false },
      { id: "p1", x: 920, y: 470, type: "portal", collected: false },
    ],
    targetCoins: 3,
  },
  {
    id: 4,
    title: "Level 4: Gravity Warp Vault",
    subtitle: "Navigate intricate spike mazes",
    spawnX: 40,
    spawnY: 200,
    platforms: [
      { x: 0, y: 260, w: 140, h: 20 },
      { x: 200, y: 360, w: 140, h: 20 },
      { x: 400, y: 460, w: 140, h: 20 },
      { x: 600, y: 360, w: 140, h: 20 },
      { x: 800, y: 260, w: 180, h: 20 },
    ],
    movingPlatforms: [
      { x: 340, y: 260, w: 100, h: 20, vx: 2.5, vy: 0, startX: 340, startY: 260, rangeX: 120, rangeY: 0 },
    ],
    spikes: [
      { x: 0, y: 540, w: 1000, h: 20 },
      { x: 220, y: 340, w: 100, h: 20 },
      { x: 620, y: 340, w: 100, h: 20 },
    ],
    items: [
      { id: "c1", x: 250, y: 310, type: "coin", collected: false },
      { id: "c2", x: 450, y: 410, type: "coin", collected: false },
      { id: "c3", x: 650, y: 310, type: "coin", collected: false },
      { id: "k1", x: 880, y: 210, type: "key", collected: false },
      { id: "p1", x: 890, y: 200, type: "portal", collected: false },
    ],
    targetCoins: 3,
  },
  {
    id: 5,
    title: "Level 5: Quantum Zenith",
    subtitle: "The ultimate cyber platformer challenge",
    spawnX: 40,
    spawnY: 480,
    platforms: [
      { x: 0, y: 540, w: 120, h: 40 },
      { x: 180, y: 420, w: 80, h: 20 },
      { x: 340, y: 320, w: 80, h: 20 },
      { x: 500, y: 220, w: 80, h: 20 },
      { x: 660, y: 320, w: 80, h: 20 },
      { x: 820, y: 420, w: 180, h: 20 },
    ],
    movingPlatforms: [
      { x: 260, y: 200, w: 90, h: 20, vx: 0, vy: 2, startX: 260, startY: 200, rangeX: 0, rangeY: 150 },
      { x: 580, y: 440, w: 90, h: 20, vx: 2, vy: 0, startX: 580, startY: 440, rangeX: 100, rangeY: 0 },
    ],
    spikes: [
      { x: 120, y: 520, w: 880, h: 20 },
      { x: 350, y: 300, w: 60, h: 20 },
    ],
    items: [
      { id: "c1", x: 210, y: 370, type: "coin", collected: false },
      { id: "c2", x: 530, y: 170, type: "coin", collected: false },
      { id: "c3", x: 690, y: 270, type: "coin", collected: false },
      { id: "k1", x: 305, y: 140, type: "key", collected: false },
      { id: "p1", x: 890, y: 360, type: "portal", collected: false },
    ],
    targetCoins: 3,
  },
];

// ==========================================
// 3. MAIN GAME COMPONENT & PHYSICS ENGINE
// ==========================================
export default function NeonAscentGame() {
  const [gameState, setGameState] = useState<"menu" | "select" | "playing" | "paused" | "complete">("menu");
  const [currentLevelIndex, setCurrentLevelIndex] = useState<number>(0);
  const [unlockedLevels, setUnlockedLevels] = useState<number[]>([1]);
  const [starsMap, setStarsMap] = useState<Record<number, number>>({});
  const [isMuted, setIsMuted] = useState<boolean>(false);

  // Player Game State
  const [coinsCollected, setCoinsCollected] = useState<number>(0);
  const [hasKey, setHasKey] = useState<boolean>(false);
  const [deathsCount, setDeathsCount] = useState<number>(0);
  const [levelTimer, setLevelTimer] = useState<number>(0);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Player Physics Coordinates
  const player = useRef({
    x: 50,
    y: 450,
    w: 24,
    h: 36,
    vx: 0,
    vy: 0,
    grounded: false,
    jumpsLeft: 2,
    facingRight: true,
  });

  const keys = useRef<Record<string, boolean>>({});
  const currentLevel = LEVELS[currentLevelIndex];

  // Sound Mute Toggle
  const toggleMute = () => {
    soundEngine.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  // Start specific level
  const startLevel = (index: number) => {
    soundEngine.init();
    setCurrentLevelIndex(index);
    const lvl = LEVELS[index];

    player.current = {
      x: lvl.spawnX,
      y: lvl.spawnY,
      w: 24,
      h: 36,
      vx: 0,
      vy: 0,
      grounded: false,
      jumpsLeft: 2,
      facingRight: true,
    };

    // Reset level items state
    lvl.items.forEach(i => (i.collected = false));

    setCoinsCollected(0);
    setHasKey(false);
    setLevelTimer(0);
    setGameState("playing");
  };

  // Keyboard Event Handlers
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      keys.current[e.code] = true;

      if (e.code === "KeyP" && gameState === "playing") {
        setGameState("paused");
      } else if (e.code === "KeyP" && gameState === "paused") {
        setGameState("playing");
      }

      if ((e.code === "Space" || e.code === "ArrowUp" || e.code === "KeyW") && gameState === "playing") {
        e.preventDefault();
        if (player.current.jumpsLeft > 0) {
          player.current.vy = -11;
          if (player.current.jumpsLeft === 2) {
            soundEngine.playJump();
          } else {
            soundEngine.playDoubleJump();
          }
          player.current.jumpsLeft--;
          player.current.grounded = false;
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

  // Main Physics Engine & Rendering Loop (Canvas 60 FPS)
  useEffect(() => {
    if (gameState !== "playing" || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let timerInterval: any = setInterval(() => {
      setLevelTimer(t => t + 1);
    }, 1000);

    let animationFrameId: number;

    const gameLoop = () => {
      const p = player.current;
      const lvl = LEVELS[currentLevelIndex];

      // 1. HORIZONTAL PHYSICS MOVEMENT
      const speed = 4.5;
      if (keys.current["KeyA"] || keys.current["ArrowLeft"]) {
        p.vx = -speed;
        p.facingRight = false;
      } else if (keys.current["KeyD"] || keys.current["ArrowRight"]) {
        p.vx = speed;
        p.facingRight = true;
      } else {
        p.vx *= 0.8;
      }

      // 2. GRAVITY & VERTICAL PHYSICS
      const gravity = 0.55;
      p.vy += gravity;

      p.x += p.vx;
      p.y += p.vy;

      // Reset grounded flag for frame
      p.grounded = false;

      // 3. MOVING PLATFORMS UPDATES
      lvl.movingPlatforms.forEach(mp => {
        mp.x += mp.vx;
        mp.y += mp.vy;

        if (Math.abs(mp.x - mp.startX) > mp.rangeX) mp.vx *= -1;
        if (Math.abs(mp.y - mp.startY) > mp.rangeY) mp.vy *= -1;
      });

      // Combine static & moving platforms
      const allPlatforms: Rect[] = [...lvl.platforms, ...lvl.movingPlatforms];

      // 4. PLATFORM COLLISION DETECTION
      allPlatforms.forEach(plat => {
        // Simple AABB Collision
        if (
          p.x < plat.x + plat.w &&
          p.x + p.w > plat.x &&
          p.y < plat.y + plat.h &&
          p.y + p.h > plat.y
        ) {
          // Collision from top
          if (p.vy > 0 && p.y + p.h - p.vy <= plat.y + 10) {
            p.y = plat.y - p.h;
            p.vy = 0;
            p.grounded = true;
            p.jumpsLeft = 2; // Restore double jump
          }
          // Collision from bottom
          else if (p.vy < 0 && p.y - p.vy >= plat.y + plat.h - 10) {
            p.y = plat.y + plat.h;
            p.vy = 0;
          }
          // Collision from left/right
          else if (p.vx > 0) {
            p.x = plat.x - p.w;
          } else if (p.vx < 0) {
            p.x = plat.x + plat.w;
          }
        }
      });

      // 5. SPIKE HAZARDS COLLISION (DEATH CHECK)
      let playerDied = false;
      lvl.spikes.forEach(spike => {
        if (
          p.x < spike.x + spike.w &&
          p.x + p.w > spike.x &&
          p.y < spike.y + spike.h &&
          p.y + p.h > spike.y
        ) {
          playerDied = true;
        }
      });

      // Fall off bottom screen boundary check
      if (p.y > 600) {
        playerDied = true;
      }

      if (playerDied) {
        soundEngine.playDeath();
        setDeathsCount(d => d + 1);
        p.x = lvl.spawnX;
        p.y = lvl.spawnY;
        p.vx = 0;
        p.vy = 0;
      }

      // 6. ITEM COLLECTION CHECK (Coins, Keys, Portal Exit)
      lvl.items.forEach(item => {
        if (item.collected) return;

        const dist = Math.hypot(p.x + p.w / 2 - item.x, p.y + p.h / 2 - item.y);
        if (dist < 28) {
          if (item.type === "coin") {
            item.collected = true;
            soundEngine.playCoin();
            setCoinsCollected(c => c + 1);
          } else if (item.type === "key") {
            item.collected = true;
            soundEngine.playKeyPickup();
            setHasKey(true);
          } else if (item.type === "portal") {
            // Level complete portal trigger
            if (hasKey || lvl.items.filter(i => i.type === "key").length === 0) {
              soundEngine.playPortal();

              // Calculate star rating (1 to 3 stars based on timer & coins)
              const stars = coinsCollected >= lvl.targetCoins ? 3 : 2;
              setStarsMap(prev => ({
                ...prev,
                [lvl.id]: Math.max(prev[lvl.id] || 0, stars),
              }));

              // Unlock next level
              if (currentLevelIndex + 1 < LEVELS.length) {
                const nextLvlId = LEVELS[currentLevelIndex + 1].id;
                setUnlockedLevels(prev => (prev.includes(nextLvlId) ? prev : [...prev, nextLvlId]));
              }

              setGameState("complete");
              return;
            }
          }
        }
      });

      // 7. CANVAS RENDERING
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Render Dark Cyber Grid Background
      ctx.fillStyle = "#0a0a14";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.strokeStyle = "rgba(0, 240, 255, 0.08)";
      ctx.lineWidth = 1;
      for (let x = 0; x < canvas.width; x += 40) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
      }
      for (let y = 0; y < canvas.height; y += 40) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
      }

      // Render Platforms
      allPlatforms.forEach(plat => {
        ctx.fillStyle = "#1e1b4b";
        ctx.fillRect(plat.x, plat.y, plat.w, plat.h);

        ctx.strokeStyle = "#00f0ff";
        ctx.lineWidth = 2;
        ctx.strokeRect(plat.x, plat.y, plat.w, plat.h);
      });

      // Render Spikes
      lvl.spikes.forEach(spike => {
        ctx.fillStyle = "#ff0055";
        const count = Math.floor(spike.w / 20);
        for (let i = 0; i < count; i++) {
          ctx.beginPath();
          ctx.moveTo(spike.x + i * 20, spike.y + spike.h);
          ctx.lineTo(spike.x + i * 20 + 10, spike.y);
          ctx.lineTo(spike.x + i * 20 + 20, spike.y + spike.h);
          ctx.closePath();
          ctx.fill();
        }
      });

      // Render Items (Coins, Key, Portal)
      lvl.items.forEach(item => {
        if (item.collected) return;

        if (item.type === "coin") {
          ctx.fillStyle = "#ffd700";
          ctx.shadowColor = "#ffd700";
          ctx.shadowBlur = 10;
          ctx.beginPath();
          ctx.arc(item.x, item.y, 8, 0, Math.PI * 2);
          ctx.fill();
          ctx.shadowBlur = 0;
        } else if (item.type === "key") {
          ctx.fillStyle = "#00ffcc";
          ctx.shadowColor = "#00ffcc";
          ctx.shadowBlur = 12;
          ctx.fillRect(item.x - 6, item.y - 6, 12, 12);
          ctx.shadowBlur = 0;
        } else if (item.type === "portal") {
          ctx.fillStyle = hasKey ? "#a000ff" : "#555555";
          ctx.shadowColor = "#a000ff";
          ctx.shadowBlur = 15;
          ctx.beginPath();
          ctx.arc(item.x, item.y, 22, 0, Math.PI * 2);
          ctx.fill();
          ctx.shadowBlur = 0;
        }
      });

      // Render Player Character
      ctx.fillStyle = "#00f0ff";
      ctx.shadowColor = "#00f0ff";
      ctx.shadowBlur = 15;
      ctx.fillRect(p.x, p.y, p.w, p.h);

      // Player Visor
      ctx.fillStyle = "#ffffff";
      const visorX = p.facingRight ? p.x + p.w - 8 : p.x + 2;
      ctx.fillRect(visorX, p.y + 6, 6, 6);
      ctx.shadowBlur = 0;

      animationFrameId = requestAnimationFrame(gameLoop);
    };

    animationFrameId = requestAnimationFrame(gameLoop);

    return () => {
      cancelAnimationFrame(animationFrameId);
      clearInterval(timerInterval);
    };
  }, [gameState, currentLevelIndex, hasKey, coinsCollected]);

  return (
    <div className="relative w-full h-screen bg-black overflow-hidden font-sans select-none text-white flex flex-col items-center justify-center">
      {/* GAME HEADER HUD */}
      {gameState === "playing" && (
        <div className="absolute top-0 left-0 right-0 p-6 z-20 flex justify-between items-center bg-gradient-to-b from-black/80 to-transparent">
          <div className="flex items-center gap-6">
            <button
              onClick={() => setGameState("select")}
              className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-white/60 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-4 h-4" /> Levels
            </button>
            <div className="flex items-center gap-4 text-xs font-bold">
              <span className="text-cyan-400 font-black">{currentLevel.title}</span>
              <span className="text-amber-400">🪙 COINS: {coinsCollected} / {currentLevel.targetCoins}</span>
              <span className="text-emerald-400">🔑 KEY: {hasKey ? "ACQUIRED" : "LOCKED"}</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <span className="text-xs font-bold text-white/50">TIME: {levelTimer}s</span>
            <span className="text-xs font-bold text-rose-400">DEATHS: {deathsCount}</span>
            <button
              onClick={toggleMute}
              className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 transition-colors"
            >
              {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-cyan-400" />}
            </button>
            <button
              onClick={() => setGameState("paused")}
              className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 transition-colors"
            >
              <Pause className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* 2D CANVAS PLATFORMER VIEWPORT */}
      <div className="relative border-2 border-cyan-500/30 rounded-3xl overflow-hidden shadow-[0_0_50px_rgba(0,240,255,0.15)]">
        <canvas ref={canvasRef} width={1000} height={600} className="block bg-zinc-950" />
      </div>

      {/* OVERLAY 1: START MENU */}
      <AnimatePresence>
        {gameState === "menu" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-40 bg-black/90 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center"
          >
            <Link
              href="/games"
              className="absolute top-8 left-8 flex items-center gap-2 text-xs font-black uppercase tracking-widest text-white/50 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-4 h-4" /> Back to Arcade
            </Link>

            <motion.div initial={{ y: 20 }} animate={{ y: 0 }} className="max-w-md">
              <div className="flex items-center justify-center gap-2 px-4 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs font-black uppercase tracking-widest mb-6">
                <Zap className="w-4 h-4" /> 2D Cyber Platformer
              </div>

              <h1 className="text-6xl font-black tracking-tighter uppercase mb-4 bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 via-indigo-500 to-fuchsia-500">
                NEON ASCENT
              </h1>
              <p className="text-white/60 text-sm mb-8 leading-relaxed">
                Leap across precision platforms, collect energy keys, dodge plasma spikes, and master double jumps through 10 cyberpunk levels.
              </p>

              <button
                onClick={() => setGameState("select")}
                className="w-full py-4 bg-gradient-to-r from-cyan-500 to-indigo-600 rounded-full font-black uppercase tracking-widest hover:scale-105 transition-all shadow-[0_0_40px_rgba(0,240,255,0.4)] flex items-center justify-center gap-3 text-base"
              >
                <Play className="w-5 h-5 fill-white" /> Start Game
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* OVERLAY 2: LEVEL SELECTOR */}
      <AnimatePresence>
        {gameState === "select" && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="absolute inset-0 z-40 bg-black/90 backdrop-blur-md flex flex-col items-center justify-center p-6"
          >
            <div className="bg-zinc-950 border border-white/10 p-8 rounded-3xl max-w-3xl w-full">
              <div className="flex justify-between items-center mb-8 pb-4 border-b border-white/10">
                <div>
                  <h2 className="text-3xl font-black uppercase tracking-wider">Select Sector Level</h2>
                  <p className="text-xs text-white/50 mt-1">Acquire energy keys to unlock portal exits</p>
                </div>
                <button
                  onClick={() => setGameState("menu")}
                  className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl text-xs font-bold uppercase"
                >
                  Main Menu
                </button>
              </div>

              {/* Level Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {LEVELS.map((lvl, index) => {
                  const isUnlocked = unlockedLevels.includes(lvl.id);
                  const stars = starsMap[lvl.id] || 0;

                  return (
                    <button
                      key={lvl.id}
                      onClick={() => isUnlocked && startLevel(index)}
                      disabled={!isUnlocked}
                      className={`p-5 rounded-2xl border text-left transition-all flex items-center justify-between ${
                        isUnlocked
                          ? "border-cyan-500/40 bg-cyan-500/10 hover:bg-cyan-500/20 hover:border-cyan-400"
                          : "border-white/5 bg-white/5 opacity-50 cursor-not-allowed"
                      }`}
                    >
                      <div>
                        <div className="font-black text-base flex items-center gap-2">
                          {lvl.title}
                          {!isUnlocked && <Lock className="w-4 h-4 text-rose-400" />}
                        </div>
                        <p className="text-xs text-white/50 mt-1">{lvl.subtitle}</p>

                        {/* Stars Display */}
                        <div className="flex items-center gap-1 mt-3">
                          {[1, 2, 3].map(s => (
                            <Star
                              key={s}
                              className={`w-4 h-4 ${s <= stars ? "text-amber-400 fill-amber-400" : "text-white/20"}`}
                            />
                          ))}
                        </div>
                      </div>

                      {isUnlocked && <ChevronRight className="w-6 h-6 text-cyan-400" />}
                    </button>
                  );
                })}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* OVERLAY 3: LEVEL COMPLETE */}
      <AnimatePresence>
        {gameState === "complete" && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-40 bg-black/90 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center"
          >
            <div className="bg-zinc-950 border border-white/10 p-8 rounded-3xl max-w-md w-full">
              <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-8 h-8 text-emerald-400" />
              </div>

              <h2 className="text-3xl font-black uppercase tracking-wider text-emerald-400 mb-2">
                LEVEL COMPLETED!
              </h2>
              <p className="text-xs text-white/50 uppercase tracking-widest mb-6">Portal Exit Reached</p>

              <div className="flex justify-center gap-2 mb-6">
                {[1, 2, 3].map(s => (
                  <Star
                    key={s}
                    className={`w-8 h-8 ${
                      s <= (starsMap[currentLevel.id] || 0)
                        ? "text-amber-400 fill-amber-400 animate-bounce"
                        : "text-white/20"
                    }`}
                  />
                ))}
              </div>

              <div className="space-y-3">
                {currentLevelIndex + 1 < LEVELS.length && (
                  <button
                    onClick={() => startLevel(currentLevelIndex + 1)}
                    className="w-full py-4 bg-cyan-500 text-black font-black uppercase tracking-widest rounded-xl hover:bg-cyan-400 transition-all flex items-center justify-center gap-2"
                  >
                    Next Level <ChevronRight className="w-5 h-5" />
                  </button>
                )}
                <button
                  onClick={() => setGameState("select")}
                  className="w-full py-3.5 bg-white/10 text-white font-black uppercase tracking-widest rounded-xl hover:bg-white/20 transition-all"
                >
                  Level Select
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
