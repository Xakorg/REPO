"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  Zap,
  Shield,
  Volume2,
  VolumeX,
  Play,
  Pause,
  RotateCcw,
  Users,
  User,
  Globe,
  Trophy,
  ArrowLeft,
  Activity,
  Radio,
  Clock,
  Compass,
  Layers,
  X
} from "lucide-react";
import Link from "next/link";
import { useUser, useFirestore, setDocumentNonBlocking } from "@/firebase";
import { doc, increment } from "firebase/firestore";

// ==========================================
// RIFT GRAVITY & PORTAL TYPES
// ==========================================

export type RiftMode = "single_trial" | "local_duel";

export interface RiftPlayer {
  id: string;
  name: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  rotation: number;
  health: number;
  maxHealth: number;
  energy: number;
  maxEnergy: number;
  score: number;
  color: string;
  gravityFlipped: boolean;
  riftCooldown: number;
  blastCooldown: number;
  kills: number;
}

export interface SpatialRift {
  id: string;
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  radius: number;
  color: string;
  life: number;
}

// ==========================================
// WEB AUDIO SYNTHESIZER
// ==========================================

class RiftAudioSynth {
  ctx: AudioContext | null = null;
  muted: boolean = false;

  init() {
    if (!this.ctx && typeof window !== "undefined") {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) this.ctx = new AudioCtx();
    }
    if (this.ctx && this.ctx.state === "suspended") {
      this.ctx.resume();
    }
  }

  playGravityFlip() {
    if (this.muted || !this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(200, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1000, this.ctx.currentTime + 0.2);

      gain.gain.setValueAtTime(0.3, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.2);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.2);
    } catch (e) {}
  }

  playRiftTeleport() {
    if (this.muted || !this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(1400, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(300, this.ctx.currentTime + 0.25);

      gain.gain.setValueAtTime(0.3, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.25);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.25);
    } catch (e) {}
  }

  playKineticBlast() {
    if (this.muted || !this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "square";
      osc.frequency.setValueAtTime(500, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(100, this.ctx.currentTime + 0.15);

      gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.15);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.15);
    } catch (e) {}
  }
}

const audio = new RiftAudioSynth();

// ==========================================
// RIFT GAME COMPONENT
// ==========================================

export default function RiftGame() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const { user } = useUser();
  const firestore = useFirestore();

  const [gameState, setGameState] = useState<"menu" | "playing" | "paused" | "game_over">("menu");
  const [mode, setMode] = useState<RiftMode>("single_trial");
  const [soundEnabled, setSoundEnabled] = useState(true);

  // HUD Stats
  const [healthP1, setHealthP1] = useState(100);
  const [healthP2, setHealthP2] = useState(100);
  const [wave, setWave] = useState(1);
  const [winnerName, setWinnerName] = useState<string | null>(null);

  const engineRef = useRef({
    keys: {
      w: false, a: false, s: false, d: false, space: false,
      up: false, left: false, down: false, right: false, enter: false,
      mouseX: 0, mouseY: 0
    },
    p1: {
      id: "p1", name: user?.displayName || "Void Walker 1", x: 200, y: 300, vx: 0, vy: 0, radius: 20, rotation: 0,
      health: 100, maxHealth: 100, energy: 100, maxEnergy: 100, score: 0, color: "#06b6d4",
      gravityFlipped: false, riftCooldown: 0, blastCooldown: 0, kills: 0
    } as RiftPlayer,
    p2: {
      id: "p2", name: mode === "local_duel" ? "Void Walker 2" : "Rift Phantom", x: 800, y: 300, vx: 0, vy: 0, radius: 20, rotation: Math.PI,
      health: 100, maxHealth: 100, energy: 100, maxEnergy: 100, score: 0, color: mode === "local_duel" ? "#f43f5e" : "#eab308",
      gravityFlipped: false, riftCooldown: 0, blastCooldown: 0, kills: 0
    } as RiftPlayer,
    rifts: [] as SpatialRift[],
    blasts: [] as any[],
    enemies: [] as any[],
    particles: [] as any[],
    wave: 1,
    waveTimer: 0
  });

  const toggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    audio.muted = !next;
  };

  const dispatchScore = (finalScore: number) => {
    if (typeof window !== "undefined" && finalScore > 0) {
      const points = Math.floor(finalScore / 30) + 12;
      window.dispatchEvent(
        new CustomEvent("xakteir-game-score", {
          detail: { score: finalScore, points }
        })
      );
      if (user && firestore) {
        setDocumentNonBlocking(
          doc(firestore, "leaderboard", user.uid),
          {
            uid: user.uid,
            displayName: user.displayName || "Rift Master",
            points: increment(points),
            updatedAt: new Date().toISOString()
          },
          { merge: true }
        );
      }
    }
  };

  const initGame = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const w = (canvas.width = canvas.parentElement?.clientWidth || window.innerWidth);
    const h = (canvas.height = canvas.parentElement?.clientHeight || window.innerHeight);

    const engine = engineRef.current;
    engine.p1 = {
      id: "p1", name: user?.displayName || "Void Walker 1", x: w * 0.25, y: h / 2, vx: 0, vy: 0, radius: 20, rotation: 0,
      health: 100, maxHealth: 100, energy: 100, maxEnergy: 100, score: 0, color: "#06b6d4",
      gravityFlipped: false, riftCooldown: 0, blastCooldown: 0, kills: 0
    };

    engine.p2 = {
      id: "p2", name: mode === "local_duel" ? "Void Walker 2" : "Rift Phantom", x: w * 0.75, y: h / 2, vx: 0, vy: 0, radius: 20, rotation: Math.PI,
      health: 100, maxHealth: 100, energy: 100, maxEnergy: 100, score: 0, color: mode === "local_duel" ? "#f43f5e" : "#eab308",
      gravityFlipped: false, riftCooldown: 0, blastCooldown: 0, kills: 0
    };

    // Pre-create 2 Spatial Teleport Rifts on sides
    engine.rifts = [
      { id: "r1", x: 80, y: h / 2, targetX: w - 80, targetY: h / 2, radius: 35, color: "#06b6d4", life: 9999 },
      { id: "r2", x: w - 80, y: h / 2, targetX: 80, targetY: h / 2, radius: 35, color: "#f43f5e", life: 9999 }
    ];

    engine.blasts = [];
    engine.enemies = [];
    engine.particles = [];
    engine.wave = 1;
    engine.waveTimer = 0;

    setHealthP1(100);
    setHealthP2(100);
    setWave(1);
    setWinnerName(null);
  }, [mode, user]);

  // Main 60FPS Game & Physics Loop
  useEffect(() => {
    let animId: number;

    const runLoop = () => {
      if (gameState === "playing") {
        updatePhysics();
      }
      renderCanvas();
      animId = requestAnimationFrame(runLoop);
    };

    const updatePhysics = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const w = canvas.width;
      const h = canvas.height;
      const engine = engineRef.current;
      const keys = engine.keys;
      const p1 = engine.p1;
      const p2 = engine.p2;

      // ----------------------------------------
      // P1 GRAVITY & MOVEMENT
      // ----------------------------------------
      let p1dx = 0;
      if (keys.a) p1dx -= 1;
      if (keys.d) p1dx += 1;

      const gravity = p1.gravityFlipped ? -0.5 : 0.5;
      p1.vy += gravity;

      p1.vx += (p1dx * 7.0 - p1.vx) * 0.2;
      p1.x = Math.max(p1.radius, Math.min(w - p1.radius, p1.x + p1.vx));
      p1.y = Math.max(p1.radius, Math.min(h - p1.radius, p1.y + p1.vy));

      // Gravity Flip (W Key)
      if (keys.w && p1.riftCooldown <= 0) {
        audio.playGravityFlip();
        p1.gravityFlipped = !p1.gravityFlipped;
        p1.riftCooldown = 20;
      }
      if (p1.riftCooldown > 0) p1.riftCooldown--;

      // P1 Kinetic Blast (Space)
      if (p1.blastCooldown > 0) p1.blastCooldown--;
      if (keys.space && p1.blastCooldown <= 0) {
        audio.playKineticBlast();
        p1.blastCooldown = 15;
        engine.blasts.push({
          x: p1.x + (p1.vx >= 0 ? 25 : -25),
          y: p1.y,
          vx: p1.vx >= 0 ? 14 : -14,
          vy: 0,
          radius: 6,
          damage: 25,
          color: p1.color,
          ownerId: p1.id
        });
      }

      // Check Spatial Rift Teleportation for P1
      engine.rifts.forEach(rift => {
        if (Math.hypot(p1.x - rift.x, p1.y - rift.y) < rift.radius) {
          audio.playRiftTeleport();
          p1.x = rift.targetX;
          p1.y = rift.targetY;
        }
      });

      // ----------------------------------------
      // P2 / AI LOGIC
      // ----------------------------------------
      if (mode === "local_duel") {
        let p2dx = 0;
        if (keys.left) p2dx -= 1;
        if (keys.right) p2dx += 1;

        const p2Gravity = p2.gravityFlipped ? -0.5 : 0.5;
        p2.vy += p2Gravity;

        p2.vx += (p2dx * 7.0 - p2.vx) * 0.2;
        p2.x = Math.max(p2.radius, Math.min(w - p2.radius, p2.x + p2.vx));
        p2.y = Math.max(p2.radius, Math.min(h - p2.radius, p2.y + p2.vy));

        if (keys.up && p2.riftCooldown <= 0) {
          audio.playGravityFlip();
          p2.gravityFlipped = !p2.gravityFlipped;
          p2.riftCooldown = 20;
        }
        if (p2.riftCooldown > 0) p2.riftCooldown--;

        if (p2.blastCooldown > 0) p2.blastCooldown--;
        if (keys.enter && p2.blastCooldown <= 0) {
          audio.playKineticBlast();
          p2.blastCooldown = 15;
          engine.blasts.push({
            x: p2.x + (p2.vx >= 0 ? 25 : -25),
            y: p2.y,
            vx: p2.vx >= 0 ? 14 : -14,
            vy: 0,
            radius: 6,
            damage: 25,
            color: p2.color,
            ownerId: p2.id
          });
        }

        engine.rifts.forEach(rift => {
          if (Math.hypot(p2.x - rift.x, p2.y - rift.y) < rift.radius) {
            audio.playRiftTeleport();
            p2.x = rift.targetX;
            p2.y = rift.targetY;
          }
        });
      }

      // ----------------------------------------
      // UPDATE BLASTS & IMPACT COLLISION
      // ----------------------------------------
      for (let bIdx = engine.blasts.length - 1; bIdx >= 0; bIdx--) {
        const b = engine.blasts[bIdx];
        b.x += b.vx;

        if (mode === "local_duel") {
          const target = b.ownerId === "p1" ? p2 : p1;
          if (Math.hypot(b.x - target.x, b.y - target.y) < target.radius + b.radius) {
            target.health -= b.damage;
            createSparks(b.x, b.y, b.color);
            engine.blasts.splice(bIdx, 1);

            if (target.id === "p1") setHealthP1(target.health);
            else setHealthP2(target.health);

            if (target.health <= 0) {
              setWinnerName(b.ownerId === "p1" ? p1.name : p2.name);
              dispatchScore(1500);
              setGameState("game_over");
            }
            continue;
          }
        }

        if (b.x < -20 || b.x > w + 20) {
          engine.blasts.splice(bIdx, 1);
        }
      }
    };

    const createSparks = (x: number, y: number, color: string) => {
      const engine = engineRef.current;
      for (let i = 0; i < 10; i++) {
        const angle = Math.random() * Math.PI * 2;
        engine.particles.push({
          x, y,
          vx: Math.cos(angle) * (Math.random() * 5 + 2),
          vy: Math.sin(angle) * (Math.random() * 5 + 2),
          radius: Math.random() * 3 + 1,
          color,
          alpha: 1,
          life: 18
        });
      }
    };

    const renderCanvas = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      const w = canvas.width;
      const h = canvas.height;
      const engine = engineRef.current;

      ctx.fillStyle = "#030712";
      ctx.fillRect(0, 0, w, h);

      // Spatial Portal Rifts
      engine.rifts.forEach(rift => {
        ctx.save();
        ctx.shadowBlur = 25;
        ctx.shadowColor = rift.color;

        ctx.strokeStyle = rift.color;
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(rift.x, rift.y, rift.radius, 0, Math.PI * 2);
        ctx.stroke();

        ctx.fillStyle = `${rift.color}20`;
        ctx.fill();
        ctx.restore();
      });

      // Draw Blasts
      engine.blasts.forEach(b => {
        ctx.shadowBlur = 12;
        ctx.shadowColor = b.color;
        ctx.fillStyle = b.color;
        ctx.beginPath();
        ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.shadowBlur = 0;

      // Draw Particles
      for (let i = engine.particles.length - 1; i >= 0; i--) {
        const p = engine.particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.alpha -= 1 / p.life;

        if (p.alpha <= 0) {
          engine.particles.splice(i, 1);
          continue;
        }

        ctx.fillStyle = p.color;
        ctx.globalAlpha = Math.max(0, p.alpha);
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;

      // Draw Void Walkers
      [engine.p1, ...(mode === "local_duel" ? [engine.p2] : [])].forEach(p => {
        ctx.save();
        ctx.shadowBlur = 20;
        ctx.shadowColor = p.color;

        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
      });
    };

    animId = requestAnimationFrame(runLoop);
    return () => cancelAnimationFrame(animId);
  }, [gameState, mode]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      audio.init();
      const keys = engineRef.current.keys;
      if (e.key === "w" || e.key === "W") keys.w = true;
      if (e.key === "a" || e.key === "A") keys.a = true;
      if (e.key === "s" || e.key === "S") keys.s = true;
      if (e.key === "d" || e.key === "D") keys.d = true;
      if (e.key === " ") keys.space = true;

      if (e.key === "ArrowUp") keys.up = true;
      if (e.key === "ArrowLeft") keys.left = true;
      if (e.key === "ArrowDown") keys.down = true;
      if (e.key === "ArrowRight") keys.right = true;
      if (e.key === "Enter") keys.enter = true;
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const keys = engineRef.current.keys;
      if (e.key === "w" || e.key === "W") keys.w = false;
      if (e.key === "a" || e.key === "A") keys.a = false;
      if (e.key === "s" || e.key === "S") keys.s = false;
      if (e.key === "d" || e.key === "D") keys.d = false;
      if (e.key === " ") keys.space = false;

      if (e.key === "ArrowUp") keys.up = false;
      if (e.key === "ArrowLeft") keys.left = false;
      if (e.key === "ArrowDown") keys.down = false;
      if (e.key === "ArrowRight") keys.right = false;
      if (e.key === "Enter") keys.enter = false;
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, []);

  const startGame = (selectedMode: RiftMode) => {
    setMode(selectedMode);
    initGame();
    setGameState("playing");
  };

  return (
    <div className="w-full h-screen bg-[#030712] text-white relative overflow-hidden font-sans select-none">
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full block" />

      <div className="absolute top-0 inset-x-0 p-4 flex justify-between items-center z-30 pointer-events-none">
        <Link
          href="/games"
          className="pointer-events-auto flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold"
        >
          <ArrowLeft className="w-4 h-4" /> Exit Rift
        </Link>
        <button
          onClick={toggleSound}
          className="pointer-events-auto p-2 rounded-xl bg-white/5 border border-white/10"
        >
          {soundEnabled ? <Volume2 className="w-4 h-4 text-cyan-400" /> : <VolumeX className="w-4 h-4 text-rose-400" />}
        </button>
      </div>

      {gameState === "playing" && (
        <div className="absolute inset-0 p-6 flex flex-col justify-between pointer-events-none z-20">
          <div className="flex justify-between items-start mt-12">
            <div className="bg-[#0b0f19]/80 border border-cyan-500/30 p-3.5 rounded-2xl backdrop-blur-md w-56">
              <div className="text-xs font-black text-cyan-400 uppercase tracking-wider mb-1 flex justify-between">
                <span>{engineRef.current.p1.name}</span>
                <span>{Math.ceil(healthP1)} HP</span>
              </div>
              <div className="w-full h-2 bg-cyan-950 rounded-full overflow-hidden">
                <div className="h-full bg-cyan-400 transition-all" style={{ width: `${Math.max(0, healthP1)}%` }} />
              </div>
            </div>

            <div className="text-center bg-[#0b0f19]/80 border border-white/10 px-5 py-2 rounded-2xl backdrop-blur-md">
              <div className="text-[10px] font-black uppercase text-white/40 tracking-widest">SPATIAL ARENA</div>
              <div className="text-xl font-black text-cyan-400">RIFT BOUND</div>
            </div>

            <div className="bg-[#0b0f19]/80 border border-rose-500/30 p-3.5 rounded-2xl backdrop-blur-md w-56 text-right">
              <div className="text-xs font-black text-rose-400 uppercase tracking-wider mb-1 flex justify-between">
                <span>{Math.ceil(healthP2)} HP</span>
                <span>{engineRef.current.p2.name}</span>
              </div>
              <div className="w-full h-2 bg-rose-950 rounded-full overflow-hidden">
                <div className="h-full bg-rose-500 transition-all" style={{ width: `${Math.max(0, healthP2)}%` }} />
              </div>
            </div>
          </div>
        </div>
      )}

      {gameState === "menu" && (
        <div className="absolute inset-0 z-40 bg-[#030712]/90 backdrop-blur-xl flex flex-col items-center justify-center p-6">
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center max-w-xl mb-8">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs font-bold uppercase tracking-widest mb-3">
              <Sparkles className="w-3.5 h-3.5" /> Spatial Gravity & Teleport Fighter
            </div>
            <h1 className="text-6xl font-black uppercase tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-rose-500">
              RIFT
            </h1>
            <p className="text-sm text-white/60 mt-3">
              Manipulate spatial gravity, step through portal rifts, and fire kinetic energy blasts in high-speed 1v1 arena duels.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-lg w-full">
            <button
              onClick={() => startGame("single_trial")}
              className="p-5 rounded-2xl bg-[#0b0f19] border border-cyan-500/40 hover:border-cyan-400 flex flex-col items-center gap-2 hover:scale-105 transition-all text-center"
            >
              <User className="w-8 h-8 text-cyan-400" />
              <div className="font-black text-lg">SPATIAL TRIAL</div>
              <div className="text-xs text-white/50">Single player gravity simulation</div>
            </button>

            <button
              onClick={() => startGame("local_duel")}
              className="p-5 rounded-2xl bg-[#0b0f19] border border-rose-500/40 hover:border-rose-400 flex flex-col items-center gap-2 hover:scale-105 transition-all text-center"
            >
              <Users className="w-8 h-8 text-rose-400" />
              <div className="font-black text-lg">2-PLAYER DUEL</div>
              <div className="text-xs text-white/50">Same screen portal clash</div>
            </button>
          </div>
        </div>
      )}

      {gameState === "game_over" && (
        <div className="absolute inset-0 z-50 bg-black/85 backdrop-blur-md flex flex-col items-center justify-center p-6">
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center max-w-md w-full">
            <h2 className="text-4xl font-black uppercase text-cyan-400 mb-2">
              {winnerName ? `${winnerName} Victorious!` : "Trial Concluded"}
            </h2>
            <p className="text-xs text-white/50 mb-6">Spatial Rift Simulation Ended</p>

            <div className="flex gap-4">
              <button
                onClick={() => startGame(mode)}
                className="flex-1 py-3.5 rounded-xl bg-cyan-500 text-black font-black uppercase"
              >
                REMATCH
              </button>
              <button
                onClick={() => setGameState("menu")}
                className="px-5 py-3.5 rounded-xl bg-white/10 text-white font-bold uppercase"
              >
                MENU
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
