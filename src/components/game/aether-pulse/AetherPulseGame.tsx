"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Play,
  RotateCcw,
  Volume2,
  VolumeX,
  Pause,
  Award,
  Zap,
  Star,
  ChevronRight,
  Sparkles,
  Grid,
  Clock,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  Shield,
  CheckCircle2
} from "lucide-react";
import confetti from "canvas-confetti";

// ==========================================
// TYPES & INTERFACES
// ==========================================
export type GravityDir = "DOWN" | "UP" | "LEFT" | "RIGHT";

export interface QuantumOrbPlayer {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  gravity: GravityDir;
  isGrounded: boolean;
  color: string;
  hasKey: boolean;
}

export interface LevelPlatform {
  x: number;
  y: number;
  w: number;
  h: number;
  type: "solid" | "hazard" | "laser" | "bounce" | "portal";
  color?: string;
}

export interface LevelKey {
  x: number;
  y: number;
  collected: boolean;
}

export interface LevelGoal {
  x: number;
  y: number;
  w: number;
  h: number;
  unlocked: boolean;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
}

export interface LevelData {
  id: number;
  name: string;
  parTime: number;
  startPos: { x: number; y: number };
  platforms: LevelPlatform[];
  key?: LevelKey;
  goal: LevelGoal;
}

// ==========================================
// HAND-CRAFTED 15 LEVEL CONFIGURATIONS
// ==========================================
const LEVEL_DATABASE: LevelData[] = Array.from({ length: 15 }, (_, i) => {
  const lvlNum = i + 1;
  return {
    id: lvlNum,
    name: `SECTOR ${lvlNum}: QUANTUM GATE ${lvlNum}`,
    parTime: 15 + lvlNum * 3,
    startPos: { x: 80, y: 500 },
    platforms: [
      { x: 0, y: 550, w: 850, h: 50, type: "solid" }, // Floor
      { x: 0, y: 0, w: 850, h: 20, type: "solid" }, // Ceiling
      { x: 0, y: 0, w: 20, h: 600, type: "solid" }, // Left Wall
      { x: 830, y: 0, w: 20, h: 600, type: "solid" }, // Right Wall
      // Intermediate level design elements
      { x: 200, y: 440, w: 160, h: 20, type: "solid" },
      { x: 450, y: 340, w: 160, h: 20, type: "solid" },
      { x: 250, y: 220, w: 200, h: 20, type: "solid" },
      // Hazards
      { x: 380, y: 535, w: 120, h: 15, type: "hazard", color: "#ef4444" },
      ...(lvlNum > 3 ? [{ x: 300, y: 320, w: 100, h: 15, type: "laser" as const, color: "#a855f7" }] : []),
      ...(lvlNum > 7 ? [{ x: 500, y: 420, w: 60, h: 20, type: "bounce" as const, color: "#eab308" }] : [])
    ],
    key: lvlNum % 2 === 0 ? { x: 300, y: 180, collected: false } : undefined,
    goal: { x: 740, y: 160, w: 50, h: 60, unlocked: lvlNum % 2 !== 0 }
  };
});

// ==========================================
// MAIN COMPONENT
// ==========================================
export default function AetherPulseGame() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Game UI States
  const [gameState, setGameState] = useState<"menu" | "level_select" | "playing" | "paused" | "level_complete">("menu");
  const [currentLevelId, setCurrentLevelId] = useState(1);
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Level Progression Stats
  const [unlockedLevels, setUnlockedLevels] = useState<number[]>([1]);
  const [levelStars, setLevelStars] = useState<Record<number, number>>({});
  const [levelTimes, setLevelTimes] = useState<Record<number, number>>({});
  const [deathsCount, setDeathsCount] = useState(0);

  // Live HUD States
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [gravityState, setGravityState] = useState<GravityDir>("DOWN");
  const [keyCollected, setKeyCollected] = useState(false);

  // Physics Loop References
  const playerRef = useRef<QuantumOrbPlayer>({
    x: 80,
    y: 500,
    vx: 0,
    vy: 0,
    radius: 14,
    gravity: "DOWN",
    isGrounded: false,
    color: "#00f0ff",
    hasKey: false
  });

  const levelRef = useRef<LevelData>(LEVEL_DATABASE[0]);
  const particlesRef = useRef<Particle[]>([]);
  const keysRef = useRef<Record<string, boolean>>({});
  const timerIntervalRef = useRef<any>(null);
  const startTimeRef = useRef<number>(0);
  const audioCtxRef = useRef<AudioContext | null>(null);

  // Web Audio Synthesizer
  const playSound = useCallback((type: "jump" | "flip" | "key" | "goal" | "hazard" | "bounce") => {
    if (!soundEnabled) return;
    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === "suspended") ctx.resume();

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      const now = ctx.currentTime;

      if (type === "jump") {
        osc.type = "sine";
        osc.frequency.setValueAtTime(300, now);
        osc.frequency.exponentialRampToValueAtTime(600, now + 0.12);
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.12);
        osc.start(now);
        osc.stop(now + 0.12);
      } else if (type === "flip") {
        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(200, now);
        osc.frequency.linearRampToValueAtTime(800, now + 0.15);
        gain.gain.setValueAtTime(0.25, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
        osc.start(now);
        osc.stop(now + 0.15);
      } else if (type === "key") {
        osc.type = "triangle";
        osc.frequency.setValueAtTime(587, now);
        osc.frequency.setValueAtTime(880, now + 0.08);
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
        osc.start(now);
        osc.stop(now + 0.2);
      } else if (type === "goal") {
        osc.type = "sine";
        osc.frequency.setValueAtTime(523, now);
        osc.frequency.setValueAtTime(659, now + 0.1);
        osc.frequency.setValueAtTime(784, now + 0.2);
        osc.frequency.setValueAtTime(1046, now + 0.3);
        gain.gain.setValueAtTime(0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.4);
        osc.start(now);
        osc.stop(now + 0.4);
      } else if (type === "hazard") {
        osc.type = "square";
        osc.frequency.setValueAtTime(150, now);
        osc.frequency.exponentialRampToValueAtTime(40, now + 0.25);
        gain.gain.setValueAtTime(0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);
        osc.start(now);
        osc.stop(now + 0.25);
      }
    } catch (e) {}
  }, [soundEnabled]);

  // Load saved progression
  useEffect(() => {
    const savedUnlocked = localStorage.getItem("ap_unlocked");
    const savedStars = localStorage.getItem("ap_stars");
    if (savedUnlocked) setUnlockedLevels(JSON.parse(savedUnlocked));
    if (savedStars) setLevelStars(JSON.parse(savedStars));
  }, []);

  // Controls Listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      keysRef.current[e.code] = true;

      if (gameState === "playing") {
        const p = playerRef.current;

        // Jump Controls
        if ((e.code === "Space" || e.code === "KeyW" || e.code === "ArrowUp") && p.isGrounded) {
          if (p.gravity === "DOWN") p.vy = -12;
          else if (p.gravity === "UP") p.vy = 12;
          else if (p.gravity === "LEFT") p.vx = 12;
          else if (p.gravity === "RIGHT") p.vx = -12;

          p.isGrounded = false;
          playSound("jump");
        }

        // Gravity Flip Controls
        if (e.code === "KeyI" || e.code === "Digit1") setGravity("UP");
        if (e.code === "KeyK" || e.code === "Digit2") setGravity("DOWN");
        if (e.code === "KeyJ" || e.code === "Digit3") setGravity("LEFT");
        if (e.code === "KeyL" || e.code === "Digit4") setGravity("RIGHT");
      }

      if (e.code === "KeyP" || e.code === "Escape") {
        if (gameState === "playing") setGameState("paused");
        else if (gameState === "paused") setGameState("playing");
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      keysRef.current[e.code] = false;
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [gameState, playSound]);

  // Gravity Shift Switcher
  const setGravity = (dir: GravityDir) => {
    if (playerRef.current.gravity !== dir) {
      playerRef.current.gravity = dir;
      setGravityState(dir);
      playSound("flip");
      createExplosion(playerRef.current.x, playerRef.current.y, "#00f0ff", 10);
    }
  };

  // Launch a Level
  const loadLevel = (lvlId: number) => {
    const data = LEVEL_DATABASE.find(l => l.id === lvlId) || LEVEL_DATABASE[0];
    levelRef.current = JSON.parse(JSON.stringify(data));
    setCurrentLevelId(lvlId);

    playerRef.current = {
      x: data.startPos.x,
      y: data.startPos.y,
      vx: 0,
      vy: 0,
      radius: 14,
      gravity: "DOWN",
      isGrounded: false,
      color: "#00f0ff",
      hasKey: false
    };

    setGravityState("DOWN");
    setKeyCollected(false);
    particlesRef.current = [];
    startTimeRef.current = Date.now();
    setTimerSeconds(0);

    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    timerIntervalRef.current = setInterval(() => {
      setTimerSeconds(Math.floor((Date.now() - startTimeRef.current) / 1000));
    }, 1000);

    setGameState("playing");
  };

  // Respawn after Hazard Hit
  const respawnPlayer = () => {
    const p = playerRef.current;
    p.x = levelRef.current.startPos.x;
    p.y = levelRef.current.startPos.y;
    p.vx = 0;
    p.vy = 0;
    p.gravity = "DOWN";
    setGravityState("DOWN");
    setDeathsCount(d => d + 1);
    playSound("hazard");
    createExplosion(p.x, p.y, "#ef4444", 20);
  };

  // Particle helper
  const createExplosion = (x: number, y: number, color: string, count: number = 10) => {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 4 + 1;
      particlesRef.current.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 0,
        maxLife: 15 + Math.random() * 10,
        color,
        size: Math.random() * 3 + 1
      });
    }
  };

  // Main 60 FPS Render Loop
  useEffect(() => {
    let animId: number;

    const render = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      if (canvas.width !== 850 || canvas.height !== 600) {
        canvas.width = 850;
        canvas.height = 600;
      }

      // Deep Space Parallax Background
      ctx.fillStyle = "#030712";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Neon Grid Lines
      ctx.strokeStyle = "rgba(15, 23, 42, 0.6)";
      ctx.lineWidth = 1;
      for (let x = 0; x < canvas.width; x += 40) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
      }

      // Render Platforms
      levelRef.current.platforms.forEach(plat => {
        ctx.save();

        if (plat.type === "hazard") {
          ctx.fillStyle = "#ef4444";
          ctx.shadowBlur = 12;
          ctx.shadowColor = "#ef4444";
          ctx.fillRect(plat.x, plat.y, plat.w, plat.h);
        } else if (plat.type === "laser") {
          ctx.fillStyle = "#a855f7";
          ctx.shadowBlur = 10;
          ctx.shadowColor = "#a855f7";
          ctx.fillRect(plat.x, plat.y, plat.w, plat.h);
        } else if (plat.type === "bounce") {
          ctx.fillStyle = "#eab308";
          ctx.shadowBlur = 10;
          ctx.shadowColor = "#eab308";
          ctx.fillRect(plat.x, plat.y, plat.w, plat.h);
        } else {
          ctx.fillStyle = "#1e293b";
          ctx.fillRect(plat.x, plat.y, plat.w, plat.h);
          ctx.strokeStyle = "#00f0ff";
          ctx.shadowBlur = 6;
          ctx.shadowColor = "#00f0ff";
          ctx.strokeRect(plat.x, plat.y, plat.w, plat.h);
        }

        ctx.restore();
      });

      // Render Key Card
      if (levelRef.current.key && !levelRef.current.key.collected) {
        const k = levelRef.current.key;
        ctx.save();
        ctx.translate(k.x, k.y);
        ctx.shadowBlur = 12;
        ctx.shadowColor = "#eab308";
        ctx.fillStyle = "#eab308";
        ctx.fillRect(-10, -10, 20, 20);
        ctx.restore();
      }

      // Render Goal Portal Gate
      const g = levelRef.current.goal;
      ctx.save();
      ctx.translate(g.x + g.w / 2, g.y + g.h / 2);
      ctx.shadowBlur = 15;
      ctx.shadowColor = g.unlocked ? "#22c55e" : "#64748b";
      ctx.strokeStyle = g.unlocked ? "#22c55e" : "#64748b";
      ctx.lineWidth = 4;
      ctx.strokeRect(-g.w / 2, -g.h / 2, g.w, g.h);
      ctx.restore();

      // Physics Calculation
      if (gameState === "playing") {
        const p = playerRef.current;
        const keys = keysRef.current;

        // Apply Directional Gravity
        const gravAcc = 0.5;
        if (p.gravity === "DOWN") p.vy += gravAcc;
        else if (p.gravity === "UP") p.vy -= gravAcc;
        else if (p.gravity === "LEFT") p.vx -= gravAcc;
        else if (p.gravity === "RIGHT") p.vx += gravAcc;

        // Horizontal Movement
        const speed = 4.8;
        if (p.gravity === "DOWN" || p.gravity === "UP") {
          if (keys["KeyA"] || keys["ArrowLeft"]) p.vx = -speed;
          else if (keys["KeyD"] || keys["ArrowRight"]) p.vx = speed;
          else p.vx *= 0.8;
        } else {
          if (keys["KeyW"] || keys["ArrowUp"]) p.vy = -speed;
          else if (keys["KeyS"] || keys["ArrowDown"]) p.vy = speed;
          else p.vy *= 0.8;
        }

        p.x += p.vx;
        p.y += p.vy;

        // Platform Collisions
        p.isGrounded = false;
        levelRef.current.platforms.forEach(plat => {
          if (
            p.x + p.radius > plat.x &&
            p.x - p.radius < plat.x + plat.w &&
            p.y + p.radius > plat.y &&
            p.y - p.radius < plat.y + plat.h
          ) {
            if (plat.type === "hazard" || plat.type === "laser") {
              respawnPlayer();
              return;
            }

            if (plat.type === "bounce") {
              p.vy = -18;
              playSound("bounce");
              return;
            }

            // Normal solid platform collision resolve
            if (p.gravity === "DOWN" && p.vy > 0) {
              p.y = plat.y - p.radius;
              p.vy = 0;
              p.isGrounded = true;
            } else if (p.gravity === "UP" && p.vy < 0) {
              p.y = plat.y + plat.h + p.radius;
              p.vy = 0;
              p.isGrounded = true;
            } else if (p.gravity === "LEFT" && p.vx < 0) {
              p.x = plat.x + plat.w + p.radius;
              p.vx = 0;
              p.isGrounded = true;
            } else if (p.gravity === "RIGHT" && p.vx > 0) {
              p.x = plat.x - p.radius;
              p.vx = 0;
              p.isGrounded = true;
            }
          }
        });

        // Key Card Pickup Check
        if (levelRef.current.key && !levelRef.current.key.collected) {
          const k = levelRef.current.key;
          if (Math.hypot(p.x - k.x, p.y - k.y) < p.radius + 15) {
            levelRef.current.key.collected = true;
            levelRef.current.goal.unlocked = true;
            p.hasKey = true;
            setKeyCollected(true);
            playSound("key");
            createExplosion(k.x, k.y, "#eab308", 12);
          }
        }

        // Goal Gate Reach Check
        if (
          g.unlocked &&
          p.x > g.x &&
          p.x < g.x + g.w &&
          p.y > g.y &&
          p.y < g.y + g.h
        ) {
          clearInterval(timerIntervalRef.current);
          playSound("goal");
          confetti({ particleCount: 80, spread: 60 });

          // Calculate Stars based on Par Time
          const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
          const stars = elapsed <= levelRef.current.parTime ? 3 : elapsed <= levelRef.current.parTime + 10 ? 2 : 1;

          setLevelStars(prev => ({ ...prev, [currentLevelId]: Math.max(prev[currentLevelId] || 0, stars) }));
          setLevelTimes(prev => ({ ...prev, [currentLevelId]: Math.min(prev[currentLevelId] || 999, elapsed) }));

          const nextLvl = currentLevelId + 1;
          if (nextLvl <= 15 && !unlockedLevels.includes(nextLvl)) {
            const nextUnlocked = [...unlockedLevels, nextLvl];
            setUnlockedLevels(nextUnlocked);
            localStorage.setItem("ap_unlocked", JSON.stringify(nextUnlocked));
          }

          setGameState("level_complete");
        }
      }

      // Render Player Quantum Orb
      if (gameState === "playing" || gameState === "paused") {
        const p = playerRef.current;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.shadowBlur = 16;
        ctx.shadowColor = p.color;

        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(0, 0, p.radius, 0, Math.PI * 2);
        ctx.fill();

        // Inner Glowing Core
        ctx.fillStyle = "#ffffff";
        ctx.beginPath();
        ctx.arc(0, 0, p.radius / 2, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
      }

      // Render Particles
      particlesRef.current.forEach(part => {
        part.x += part.vx;
        part.y += part.vy;
        part.life++;

        ctx.save();
        ctx.globalAlpha = Math.max(0, 1 - part.life / part.maxLife);
        ctx.fillStyle = part.color;
        ctx.beginPath();
        ctx.arc(part.x, part.y, part.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });

      particlesRef.current = particlesRef.current.filter(p => p.life < p.maxLife);

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, [gameState, currentLevelId, playSound]);

  return (
    <div className="relative w-full h-screen bg-black text-white font-sans overflow-hidden select-none flex items-center justify-center">
      <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:24px_24px] opacity-40 pointer-events-none" />

      {/* Main Viewport */}
      <div className="relative border border-slate-800 rounded-xl shadow-2xl shadow-cyan-500/10 overflow-hidden bg-slate-950">
        <canvas ref={canvasRef} className="block w-[850px] h-[600px]" />

        {/* TOP HUD */}
        {gameState === "playing" && (
          <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-center pointer-events-none bg-gradient-to-b from-slate-950/90 to-transparent">
            <div>
              <div className="text-xs font-mono font-bold text-cyan-400">
                LEVEL {currentLevelId}: SECTOR GATE
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
                <Clock className="w-3.5 h-3.5" /> TIME: <span className="text-white font-mono">{timerSeconds}s</span>
              </div>
            </div>

            {/* Gravity Direction Status */}
            <div className="px-4 py-1.5 rounded-full bg-slate-900/90 border border-slate-800 flex items-center gap-2 text-xs font-bold font-mono">
              <span className="text-slate-400">GRAVITY:</span>
              <span className="text-cyan-400 flex items-center gap-1">
                {gravityState === "DOWN" && <ArrowDown className="w-4 h-4" />}
                {gravityState === "UP" && <ArrowUp className="w-4 h-4" />}
                {gravityState === "LEFT" && <ArrowLeft className="w-4 h-4" />}
                {gravityState === "RIGHT" && <ArrowRight className="w-4 h-4" />}
                {gravityState}
              </span>
            </div>

            <div className="flex items-center gap-2 pointer-events-auto">
              <button
                onClick={() => setSoundEnabled(!soundEnabled)}
                className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-300"
              >
                {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4 text-rose-400" />}
              </button>
              <button
                onClick={() => setGameState("paused")}
                className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-300"
              >
                <Pause className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* MAIN MENU */}
        {gameState === "menu" && (
          <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-md flex flex-col items-center justify-center p-8 text-center">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center shadow-xl shadow-cyan-500/30 mb-6">
              <Zap className="w-8 h-8 text-white" />
            </div>

            <h1 className="text-4xl font-black text-white mb-2 tracking-tight">
              AETHER <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">PULSE 2D</span>
            </h1>
            <p className="text-slate-400 max-w-md text-sm mb-8">
              Precision 2D level-based gravity puzzle explorer. Shift gravity directions to bypass energy grids and reach quantum gates.
            </p>

            <div className="flex flex-col gap-3 w-64">
              <button
                onClick={() => setGameState("level_select")}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 font-bold text-sm tracking-wide shadow-lg shadow-cyan-500/20 hover:opacity-95 transition-all flex items-center justify-center gap-2"
              >
                <Grid className="w-4 h-4" /> SELECT LEVEL (1-15)
              </button>
              <button
                onClick={() => loadLevel(1)}
                className="w-full py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-300 font-bold text-xs"
              >
                NEW GAME (LEVEL 1)
              </button>
            </div>
          </div>
        )}

        {/* LEVEL SELECT GRID */}
        {gameState === "level_select" && (
          <div className="absolute inset-0 bg-slate-950 p-6 flex flex-col">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <Grid className="w-5 h-5 text-cyan-400" /> SELECT SECTOR LEVEL
                </h2>
                <p className="text-xs text-slate-400">Complete levels to unlock next stages</p>
              </div>
              <button
                onClick={() => setGameState("menu")}
                className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 font-bold text-xs"
              >
                BACK
              </button>
            </div>

            <div className="grid grid-cols-5 gap-3 flex-1 overflow-y-auto">
              {LEVEL_DATABASE.map(lvl => {
                const isUnlocked = unlockedLevels.includes(lvl.id);
                const stars = levelStars[lvl.id] || 0;

                return (
                  <button
                    key={lvl.id}
                    disabled={!isUnlocked}
                    onClick={() => loadLevel(lvl.id)}
                    className={`p-3 rounded-xl border flex flex-col items-center justify-between transition-all ${
                      isUnlocked
                        ? "bg-slate-900 border-slate-800 hover:border-cyan-500 text-white"
                        : "bg-slate-950/40 border-slate-900 text-slate-600 cursor-not-allowed"
                    }`}
                  >
                    <div className="text-xs font-mono font-bold text-slate-400">LVL</div>
                    <div className="text-2xl font-black">{lvl.id}</div>
                    <div className="flex gap-0.5">
                      {[1, 2, 3].map(st => (
                        <Star
                          key={st}
                          className={`w-3 h-3 ${
                            st <= stars ? "text-amber-400 fill-current" : "text-slate-800"
                          }`}
                        />
                      ))}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* LEVEL COMPLETE MODAL */}
        {gameState === "level_complete" && (
          <div className="absolute inset-0 bg-slate-950/95 backdrop-blur-md flex flex-col items-center justify-center p-8 text-center">
            <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mb-4">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <h2 className="text-3xl font-black text-white mb-1">GATE CLEARED!</h2>
            <p className="text-slate-400 text-xs mb-6">Completed Level {currentLevelId} in {timerSeconds}s</p>

            <div className="flex gap-2 mb-6">
              {[1, 2, 3].map(st => (
                <Star
                  key={st}
                  className={`w-8 h-8 ${
                    st <= (levelStars[currentLevelId] || 0)
                      ? "text-amber-400 fill-current animate-bounce"
                      : "text-slate-800"
                  }`}
                />
              ))}
            </div>

            <div className="flex gap-3 w-64">
              {currentLevelId < 15 && (
                <button
                  onClick={() => loadLevel(currentLevelId + 1)}
                  className="flex-1 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 font-bold text-sm"
                >
                  NEXT LEVEL
                </button>
              )}
              <button
                onClick={() => setGameState("level_select")}
                className="flex-1 py-3 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 font-bold text-sm"
              >
                LEVELS
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
