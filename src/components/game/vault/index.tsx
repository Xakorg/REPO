"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Lock,
  Unlock,
  Shield,
  Zap,
  Volume2,
  VolumeX,
  Play,
  Pause,
  RotateCcw,
  Sparkles,
  Users,
  User,
  Globe,
  Trophy,
  ArrowLeft,
  Activity,
  Radio,
  Key,
  ShieldAlert,
  Eye,
  AlertOctagon
} from "lucide-react";
import Link from "next/link";
import { useUser, useFirestore, setDocumentNonBlocking } from "@/firebase";
import { doc, increment } from "firebase/firestore";

// ==========================================
// VAULT GAME TYPES
// ==========================================

export type VaultMode = "vault_heist" | "rival_heist_duel";

export interface VaultLockTumbler {
  id: string;
  x: number;
  y: number;
  radius: number;
  progress: number;
  unlocked: boolean;
  color: string;
}

export interface SecurityLaserGrid {
  id: string;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  speedX: number;
  speedY: number;
  color: string;
}

// ==========================================
// WEB AUDIO SYNTHESIZER
// ==========================================

class VaultAudioSynth {
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

  playHackProgress() {
    if (this.muted || !this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(600, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1100, this.ctx.currentTime + 0.06);

      gain.gain.setValueAtTime(0.15, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.06);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.06);
    } catch (e) {}
  }

  playLockUnlocked() {
    if (this.muted || !this.ctx) return;
    try {
      [440, 554.37, 659.25, 880].forEach((freq, i) => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();
        osc.type = "triangle";
        osc.frequency.setValueAtTime(freq, this.ctx!.currentTime + i * 0.05);

        gain.gain.setValueAtTime(0.2, this.ctx!.currentTime + i * 0.05);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx!.currentTime + i * 0.05 + 0.15);

        osc.connect(gain);
        gain.connect(this.ctx!.destination);
        osc.start(this.ctx!.currentTime + i * 0.05);
        osc.stop(this.ctx!.currentTime + i * 0.05 + 0.15);
      });
    } catch (e) {}
  }

  playAlarmTrigger() {
    if (this.muted || !this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(300, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(100, this.ctx.currentTime + 0.25);

      gain.gain.setValueAtTime(0.25, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.25);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.25);
    } catch (e) {}
  }
}

const audio = new VaultAudioSynth();

// ==========================================
// VAULT GAME COMPONENT
// ==========================================

export default function VaultGame() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const { user } = useUser();
  const firestore = useFirestore();

  const [gameState, setGameState] = useState<"menu" | "playing" | "paused" | "game_over">("menu");
  const [mode, setMode] = useState<VaultMode>("vault_heist");
  const [soundEnabled, setSoundEnabled] = useState(true);

  // HUD Metrics
  const [p1Stealth, setP1Stealth] = useState(100);
  const [p2Stealth, setP2Stealth] = useState(100);
  const [locksUnlocked, setLocksUnlocked] = useState(0);
  const [lockdownTimer, setLockdownTimer] = useState(60);
  const [winnerName, setWinnerName] = useState<string | null>(null);

  const engineRef = useRef({
    keys: {
      w: false, a: false, s: false, d: false, space: false,
      up: false, left: false, down: false, right: false, enter: false
    },
    p1: { x: 150, y: 300, vx: 0, vy: 0, radius: 14, color: "#eab308", stealth: 100, score: 0 },
    p2: { x: 850, y: 300, vx: 0, vy: 0, radius: 14, color: "#a855f7", stealth: 100, score: 0 },
    tumblers: [] as VaultLockTumbler[],
    lasers: [] as SecurityLaserGrid[],
    particles: [] as any[],
    timer: 60,
    frameCount: 0
  });

  const toggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    audio.muted = !next;
  };

  const dispatchScore = (finalScore: number) => {
    if (typeof window !== "undefined" && finalScore > 0) {
      const points = Math.floor(finalScore / 20) + 20;
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
            displayName: user.displayName || "Vault Infiltrator",
            points: increment(points),
            updatedAt: new Date().toISOString()
          },
          { merge: true }
        );
      }
    }
  };

  const initVault = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const w = (canvas.width = canvas.parentElement?.clientWidth || window.innerWidth);
    const h = (canvas.height = canvas.parentElement?.clientHeight || window.innerHeight);

    const engine = engineRef.current;
    engine.p1 = { x: w * 0.15, y: h / 2, vx: 0, vy: 0, radius: 14, color: "#eab308", stealth: 100, score: 0 };
    engine.p2 = { x: w * 0.85, y: h / 2, vx: 0, vy: 0, radius: 14, color: "#a855f7", stealth: 100, score: 0 };

    // Set Up Vault Tumblers
    engine.tumblers = [
      { id: "t1", x: w * 0.35, y: h * 0.3, radius: 32, progress: 0, unlocked: false, color: "#eab308" },
      { id: "t2", x: w * 0.65, y: h * 0.3, radius: 32, progress: 0, unlocked: false, color: "#eab308" },
      { id: "t3", x: w * 0.35, y: h * 0.7, radius: 32, progress: 0, unlocked: false, color: "#eab308" },
      { id: "t4", x: w * 0.65, y: h * 0.7, radius: 32, progress: 0, unlocked: false, color: "#eab308" }
    ];

    // Security Lasers
    engine.lasers = [
      { id: "l1", x1: w * 0.25, y1: h * 0.2, x2: w * 0.25, y2: h * 0.8, speedX: 2.5, speedY: 0, color: "#ef4444" },
      { id: "l2", x1: w * 0.75, y1: h * 0.2, x2: w * 0.75, y2: h * 0.8, speedX: -2.5, speedY: 0, color: "#ef4444" },
      { id: "l3", x1: w * 0.2, y1: h * 0.5, x2: w * 0.8, y2: h * 0.5, speedX: 0, speedY: 2.0, color: "#ef4444" }
    ];

    engine.particles = [];
    engine.timer = 60;
    engine.frameCount = 0;

    setP1Stealth(100);
    setP2Stealth(100);
    setLocksUnlocked(0);
    setLockdownTimer(60);
    setWinnerName(null);
  }, []);

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

      // Timer Lockdown Count
      engine.frameCount++;
      if (engine.frameCount % 60 === 0) {
        engine.timer = Math.max(0, engine.timer - 1);
        setLockdownTimer(engine.timer);
        if (engine.timer <= 0) {
          setWinnerName("Security Lockdown Enforced");
          setGameState("game_over");
        }
      }

      // P1 Infiltrator Movement
      let p1dx = 0;
      let p1dy = 0;
      if (keys.a) p1dx -= 1;
      if (keys.d) p1dx += 1;
      if (keys.w) p1dy -= 1;
      if (keys.s) p1dy += 1;

      p1.vx += (p1dx * 5.5 - p1.vx) * 0.25;
      p1.vy += (p1dy * 5.5 - p1.vy) * 0.25;
      p1.x = Math.max(p1.radius, Math.min(w - p1.radius, p1.x + p1.vx));
      p1.y = Math.max(p1.radius, Math.min(h - p1.radius, p1.y + p1.vy));

      // P2 Infiltrator Movement
      if (mode === "rival_heist_duel") {
        let p2dx = 0;
        let p2dy = 0;
        if (keys.left) p2dx -= 1;
        if (keys.right) p2dx += 1;
        if (keys.up) p2dy -= 1;
        if (keys.down) p2dy += 1;

        const p2 = engine.p2;
        p2.vx += (p2dx * 5.5 - p2.vx) * 0.25;
        p2.vy += (p2dy * 5.5 - p2.vy) * 0.25;
        p2.x = Math.max(p2.radius, Math.min(w - p2.radius, p2.x + p2.vx));
        p2.y = Math.max(p2.radius, Math.min(h - p2.radius, p2.y + p2.vy));
      }

      // Move Security Lasers
      engine.lasers.forEach(laser => {
        laser.x1 += laser.speedX;
        laser.x2 += laser.speedX;
        laser.y1 += laser.speedY;
        laser.y2 += laser.speedY;

        if (laser.x1 < w * 0.15 || laser.x1 > w * 0.85) laser.speedX *= -1;
        if (laser.y1 < h * 0.15 || laser.y1 > h * 0.85) laser.speedY *= -1;

        // Collision P1 with Laser
        if (distToSegment({ x: p1.x, y: p1.y }, { x: laser.x1, y: laser.y1 }, { x: laser.x2, y: laser.y2 }) < p1.radius) {
          audio.playAlarmTrigger();
          p1.stealth = Math.max(0, p1.stealth - 0.8);
          setP1Stealth(p1.stealth);
          if (p1.stealth <= 0) {
            setWinnerName("Security Alarm Triggered");
            setGameState("game_over");
          }
        }
      });

      // Tumbler Lock Pick Check
      let unlockedCount = 0;
      engine.tumblers.forEach(tumb => {
        if (!tumb.unlocked) {
          if (Math.hypot(p1.x - tumb.x, p1.y - tumb.y) < tumb.radius + p1.radius) {
            tumb.progress += 0.8;
            audio.playHackProgress();
            if (tumb.progress >= 100) {
              tumb.unlocked = true;
              audio.playLockUnlocked();
              p1.score += 250;
            }
          }
        }
        if (tumb.unlocked) unlockedCount++;
      });

      setLocksUnlocked(unlockedCount);

      if (unlockedCount === engine.tumblers.length) {
        setWinnerName("Vault Breach Successful");
        dispatchScore(p1.score + engine.timer * 30);
        setGameState("game_over");
      }
    };

    const distToSegment = (p: { x: number; y: number }, v: { x: number; y: number }, w: { x: number; y: number }) => {
      const l2 = (w.x - v.x) ** 2 + (w.y - v.y) ** 2;
      if (l2 === 0) return Math.hypot(p.x - v.x, p.y - v.y);
      let t = ((p.x - v.x) * (w.x - v.x) + (p.y - v.y) * (w.y - v.y)) / l2;
      t = Math.max(0, Math.min(1, t));
      return Math.hypot(p.x - (v.x + t * (w.x - v.x)), p.y - (v.y + t * (w.y - v.y)));
    };

    const renderCanvas = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      const w = canvas.width;
      const h = canvas.height;
      const engine = engineRef.current;

      ctx.fillStyle = "#09090b";
      ctx.fillRect(0, 0, w, h);

      // Draw Vault Metallic Floor Grid
      ctx.strokeStyle = "rgba(234, 179, 8, 0.08)";
      ctx.lineWidth = 1;
      const step = 50;
      for (let x = 0; x < w; x += step) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke();
      }
      for (let y = 0; y < h; y += step) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
      }

      // Draw Security Lasers
      engine.lasers.forEach(laser => {
        ctx.save();
        ctx.shadowBlur = 20;
        ctx.shadowColor = laser.color;
        ctx.strokeStyle = laser.color;
        ctx.lineWidth = 4;

        ctx.beginPath();
        ctx.moveTo(laser.x1, laser.y1);
        ctx.lineTo(laser.x2, laser.y2);
        ctx.stroke();

        ctx.restore();
      });

      // Draw Vault Lock Tumblers
      engine.tumblers.forEach(tumb => {
        ctx.save();
        ctx.shadowBlur = tumb.unlocked ? 25 : 12;
        ctx.shadowColor = tumb.unlocked ? "#10b981" : tumb.color;

        ctx.strokeStyle = tumb.unlocked ? "#10b981" : tumb.color;
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(tumb.x, tumb.y, tumb.radius, 0, Math.PI * 2);
        ctx.stroke();

        ctx.fillStyle = tumb.unlocked ? "rgba(16, 185, 129, 0.2)" : "rgba(234, 179, 8, 0.1)";
        ctx.fill();

        ctx.restore();
      });

      // Draw Infiltrators (P1 and P2)
      [engine.p1, ...(mode === "rival_heist_duel" ? [engine.p2] : [])].forEach(p => {
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

      if (e.key === "ArrowUp") keys.up = true;
      if (e.key === "ArrowLeft") keys.left = true;
      if (e.key === "ArrowDown") keys.down = true;
      if (e.key === "ArrowRight") keys.right = true;
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const keys = engineRef.current.keys;
      if (e.key === "w" || e.key === "W") keys.w = false;
      if (e.key === "a" || e.key === "A") keys.a = false;
      if (e.key === "s" || e.key === "S") keys.s = false;
      if (e.key === "d" || e.key === "D") keys.d = false;

      if (e.key === "ArrowUp") keys.up = false;
      if (e.key === "ArrowLeft") keys.left = false;
      if (e.key === "ArrowDown") keys.down = false;
      if (e.key === "ArrowRight") keys.right = false;
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, []);

  const startGame = (selectedMode: VaultMode) => {
    setMode(selectedMode);
    initVault();
    setGameState("playing");
  };

  return (
    <div className="w-full h-screen bg-[#09090b] text-white relative overflow-hidden font-sans select-none">
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full block" />

      <div className="absolute top-0 inset-x-0 p-4 flex justify-between items-center z-30 pointer-events-none">
        <Link
          href="/games"
          className="pointer-events-auto flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold"
        >
          <ArrowLeft className="w-4 h-4" /> Exit Vault
        </Link>
        <button
          onClick={toggleSound}
          className="pointer-events-auto p-2 rounded-xl bg-white/5 border border-white/10"
        >
          {soundEnabled ? <Volume2 className="w-4 h-4 text-amber-400" /> : <VolumeX className="w-4 h-4 text-rose-400" />}
        </button>
      </div>

      {gameState === "playing" && (
        <div className="absolute top-4 inset-x-0 flex justify-center pointer-events-none z-20">
          <div className="bg-[#0b0f19]/90 border border-amber-500/30 px-8 py-3 rounded-2xl backdrop-blur-md flex items-center gap-8 pointer-events-auto">
            <div className="text-center">
              <div className="text-[10px] font-black uppercase text-white/40 tracking-wider">STEALTH COVER</div>
              <div className="text-lg font-black text-amber-400">{Math.ceil(p1Stealth)}%</div>
            </div>

            <div className="text-center">
              <div className="text-[10px] font-black uppercase text-white/40 tracking-wider">LOCK TUMBLERS</div>
              <div className="text-xl font-black text-emerald-400">{locksUnlocked} / 4</div>
            </div>

            <div className="text-center">
              <div className="text-[10px] font-black uppercase text-white/40 tracking-wider">LOCKDOWN TIMER</div>
              <div className="text-xl font-black text-rose-400">{lockdownTimer}s</div>
            </div>
          </div>
        </div>
      )}

      {gameState === "menu" && (
        <div className="absolute inset-0 z-40 bg-[#09090b]/95 backdrop-blur-xl flex flex-col items-center justify-center p-6">
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center max-w-xl mb-8">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-bold uppercase tracking-widest mb-3">
              <Key className="w-3.5 h-3.5" /> Stealth Quantum Laser Maze & Vault Lock Pick
            </div>
            <h1 className="text-6xl font-black uppercase tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-purple-500">
              VAULT
            </h1>
            <p className="text-sm text-white/60 mt-3">
              Bypass high-security laser grids, hack electronic tumbler locks, and infiltrate central vault cores before security lockdown.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-lg w-full">
            <button
              onClick={() => startGame("vault_heist")}
              className="p-5 rounded-2xl bg-[#0b0f19] border border-amber-500/40 hover:border-amber-400 flex flex-col items-center gap-2 hover:scale-105 transition-all text-center"
            >
              <User className="w-8 h-8 text-amber-400" />
              <div className="font-black text-lg">VAULT HEIST</div>
              <div className="text-xs text-white/50">Single player stealth infiltration</div>
            </button>

            <button
              onClick={() => startGame("rival_heist_duel")}
              className="p-5 rounded-2xl bg-[#0b0f19] border border-purple-500/40 hover:border-purple-400 flex flex-col items-center gap-2 hover:scale-105 transition-all text-center"
            >
              <Users className="w-8 h-8 text-purple-400" />
              <div className="font-black text-lg">RIVAL HEIST</div>
              <div className="text-xs text-white/50">2-Player head-to-head vault clash</div>
            </button>
          </div>
        </div>
      )}

      {gameState === "game_over" && (
        <div className="absolute inset-0 z-50 bg-black/85 backdrop-blur-md flex flex-col items-center justify-center p-6">
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center max-w-md w-full">
            <h2 className="text-4xl font-black uppercase text-amber-400 mb-2">
              {winnerName ? `${winnerName}!` : "Operation Ended"}
            </h2>
            <p className="text-xs text-white/50 mb-6">Vault Heist Protocol Concluded</p>

            <div className="flex gap-4">
              <button
                onClick={() => startGame(mode)}
                className="flex-1 py-3.5 rounded-xl bg-amber-500 text-black font-black uppercase"
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
