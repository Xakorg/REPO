"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Compass,
  Waves,
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
  Anchor,
  Wind,
  Eye,
  Navigation
} from "lucide-react";
import Link from "next/link";
import { useUser, useFirestore, setDocumentNonBlocking } from "@/firebase";
import { doc, increment } from "firebase/firestore";

// ==========================================
// SOLACE SUBMARINE TYPES
// ==========================================

export type SolaceMode = "abyssal_voyage" | "sonar_hydro_tag";

export interface SonarPing {
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  alpha: number;
}

export interface AbyssalCrystal {
  id: string;
  x: number;
  y: number;
  radius: number;
  collected: boolean;
  color: string;
}

export interface DeepLeviathan {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
}

// ==========================================
// WEB AUDIO SYNTHESIZER
// ==========================================

class SolaceAudioSynth {
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

  playSonarPing() {
    if (this.muted || !this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(1400, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(700, this.ctx.currentTime + 0.4);

      gain.gain.setValueAtTime(0.3, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.4);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.4);
    } catch (e) {}
  }

  playCrystalCollect() {
    if (this.muted || !this.ctx) return;
    try {
      [523.25, 659.25, 783.99, 1046.5].forEach((freq, i) => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, this.ctx!.currentTime + i * 0.05);

        gain.gain.setValueAtTime(0.18, this.ctx!.currentTime + i * 0.05);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx!.currentTime + i * 0.05 + 0.12);

        osc.connect(gain);
        gain.connect(this.ctx!.destination);
        osc.start(this.ctx!.currentTime + i * 0.05);
        osc.stop(this.ctx!.currentTime + i * 0.05 + 0.12);
      });
    } catch (e) {}
  }

  playLeviathanGrowl() {
    if (this.muted || !this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(120, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(40, this.ctx.currentTime + 0.5);

      gain.gain.setValueAtTime(0.25, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.5);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.5);
    } catch (e) {}
  }
}

const audio = new SolaceAudioSynth();

// ==========================================
// SOLACE GAME COMPONENT
// ==========================================

export default function SolaceGame() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const { user } = useUser();
  const firestore = useFirestore();

  const [gameState, setGameState] = useState<"menu" | "playing" | "paused" | "game_over">("menu");
  const [mode, setMode] = useState<SolaceMode>("abyssal_voyage");
  const [soundEnabled, setSoundEnabled] = useState(true);

  // HUD Metrics
  const [hullIntegrity, setHullIntegrity] = useState(100);
  const [crystalsCollected, setCrystalsCollected] = useState(0);
  const [oxygen, setOxygen] = useState(100);
  const [winnerName, setWinnerName] = useState<string | null>(null);

  const engineRef = useRef({
    keys: {
      w: false, a: false, s: false, d: false, space: false,
      up: false, left: false, down: false, right: false, enter: false
    },
    sub1: { x: 200, y: 300, vx: 0, vy: 0, angle: 0, speed: 0, maxSpeed: 4.5, radius: 16, color: "#06b6d4", hull: 100, score: 0 },
    sub2: { x: 800, y: 300, vx: 0, vy: 0, angle: 0, speed: 0, maxSpeed: 4.5, radius: 16, color: "#ec4899", hull: 100, score: 0 },
    pings: [] as SonarPing[],
    crystals: [] as AbyssalCrystal[],
    leviathans: [] as DeepLeviathan[],
    oxygen: 100
  });

  const toggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    audio.muted = !next;
  };

  const dispatchScore = (finalScore: number) => {
    if (typeof window !== "undefined" && finalScore > 0) {
      const points = Math.floor(finalScore / 20) + 15;
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
            displayName: user.displayName || "Abyssal Navigator",
            points: increment(points),
            updatedAt: new Date().toISOString()
          },
          { merge: true }
        );
      }
    }
  };

  const initTrench = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const w = (canvas.width = canvas.parentElement?.clientWidth || window.innerWidth);
    const h = (canvas.height = canvas.parentElement?.clientHeight || window.innerHeight);

    const engine = engineRef.current;
    engine.sub1 = { x: w * 0.15, y: h / 2, vx: 0, vy: 0, angle: 0, speed: 0, maxSpeed: 4.5, radius: 16, color: "#06b6d4", hull: 100, score: 0 };
    engine.sub2 = { x: w * 0.85, y: h / 2, vx: 0, vy: 0, angle: 0, speed: 0, maxSpeed: 4.5, radius: 16, color: "#ec4899", hull: 100, score: 0 };

    // Scatter Abyssal Crystals
    const crystals: AbyssalCrystal[] = [];
    for (let i = 0; i < 10; i++) {
      crystals.push({
        id: `c_${i}`,
        x: w * 0.25 + Math.random() * (w * 0.5),
        y: h * 0.2 + Math.random() * (h * 0.6),
        radius: 12,
        collected: false,
        color: "#06b6d4"
      });
    }

    // Spawn Leviathans
    const leviathans: DeepLeviathan[] = [
      { id: "lev1", x: w * 0.5, y: h * 0.3, vx: 1.5, vy: 0.8, radius: 24, color: "#f43f5e" },
      { id: "lev2", x: w * 0.5, y: h * 0.7, vx: -1.5, vy: -0.8, radius: 24, color: "#f43f5e" }
    ];

    engine.pings = [];
    engine.crystals = crystals;
    engine.leviathans = leviathans;
    engine.oxygen = 100;

    setHullIntegrity(100);
    setCrystalsCollected(0);
    setOxygen(100);
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
      const sub1 = engine.sub1;

      // Oxygen Depletion
      engine.oxygen = Math.max(0, engine.oxygen - 0.03);
      setOxygen(engine.oxygen);
      if (engine.oxygen <= 0) {
        setWinnerName("Oxygen Reserve Depleted");
        setGameState("game_over");
      }

      // Sub 1 Movement
      if (keys.a) sub1.angle -= 0.05;
      if (keys.d) sub1.angle += 0.05;

      if (keys.w) {
        sub1.speed = Math.min(sub1.maxSpeed, sub1.speed + 0.15);
      } else if (keys.s) {
        sub1.speed = Math.max(-2, sub1.speed - 0.1);
      } else {
        sub1.speed *= 0.96;
      }

      // Sonar Pulse Key (Space)
      if (keys.space && engine.pings.length < 3) {
        keys.space = false;
        audio.playSonarPing();
        engine.pings.push({ x: sub1.x, y: sub1.y, radius: 0, maxRadius: 280, alpha: 1.0 });
      }

      sub1.vx = Math.cos(sub1.angle) * sub1.speed;
      sub1.vy = Math.sin(sub1.angle) * sub1.speed;
      sub1.x = Math.max(sub1.radius, Math.min(w - sub1.radius, sub1.x + sub1.vx));
      sub1.y = Math.max(sub1.radius, Math.min(h - sub1.radius, sub1.y + sub1.vy));

      // Update Sonar Pings
      for (let i = engine.pings.length - 1; i >= 0; i--) {
        const ping = engine.pings[i];
        ping.radius += 4;
        ping.alpha = 1.0 - ping.radius / ping.maxRadius;
        if (ping.radius >= ping.maxRadius) {
          engine.pings.splice(i, 1);
        }
      }

      // Leviathan Patrol Movement
      engine.leviathans.forEach(lev => {
        lev.x += lev.vx;
        lev.y += lev.vy;

        if (lev.x < w * 0.2 || lev.x > w * 0.8) lev.vx *= -1;
        if (lev.y < h * 0.2 || lev.y > h * 0.8) lev.vy *= -1;

        // Collision Sub 1 with Leviathan
        if (Math.hypot(sub1.x - lev.x, sub1.y - lev.y) < sub1.radius + lev.radius) {
          audio.playLeviathanGrowl();
          sub1.hull = Math.max(0, sub1.hull - 0.8);
          setHullIntegrity(sub1.hull);
          if (sub1.hull <= 0) {
            setWinnerName("Submarine Destroyed by Leviathan");
            setGameState("game_over");
          }
        }
      });

      // Crystal Pickup Check
      let collectedCount = 0;
      engine.crystals.forEach(cryst => {
        if (!cryst.collected) {
          if (Math.hypot(sub1.x - cryst.x, sub1.y - cryst.y) < sub1.radius + cryst.radius) {
            cryst.collected = true;
            audio.playCrystalCollect();
            sub1.score += 200;
            engine.oxygen = Math.min(100, engine.oxygen + 15);
          }
        }
        if (cryst.collected) collectedCount++;
      });

      setCrystalsCollected(collectedCount);

      if (collectedCount === engine.crystals.length) {
        setWinnerName("Abyssal Trench Voyage Complete");
        dispatchScore(sub1.score + Math.floor(engine.oxygen) * 20);
        setGameState("game_over");
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

      ctx.fillStyle = "#020617";
      ctx.fillRect(0, 0, w, h);

      // Draw Sonar Waves
      engine.pings.forEach(ping => {
        ctx.save();
        ctx.strokeStyle = `rgba(6, 182, 212, ${ping.alpha})`;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(ping.x, ping.y, ping.radius, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      });

      // Draw Crystals
      engine.crystals.forEach(cryst => {
        if (!cryst.collected) {
          ctx.save();
          ctx.shadowBlur = 18;
          ctx.shadowColor = cryst.color;
          ctx.fillStyle = cryst.color;
          ctx.beginPath();
          ctx.arc(cryst.x, cryst.y, cryst.radius, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }
      });

      // Draw Leviathans
      engine.leviathans.forEach(lev => {
        ctx.save();
        ctx.shadowBlur = 20;
        ctx.shadowColor = lev.color;
        ctx.fillStyle = lev.color;
        ctx.beginPath();
        ctx.arc(lev.x, lev.y, lev.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });

      // Draw Exploration Submarine
      const sub = engine.sub1;
      ctx.save();
      ctx.translate(sub.x, sub.y);
      ctx.rotate(sub.angle);

      ctx.shadowBlur = 18;
      ctx.shadowColor = sub.color;
      ctx.fillStyle = sub.color;
      ctx.beginPath();
      ctx.ellipse(0, 0, sub.radius * 1.5, sub.radius * 0.8, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
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
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const keys = engineRef.current.keys;
      if (e.key === "w" || e.key === "W") keys.w = false;
      if (e.key === "a" || e.key === "A") keys.a = false;
      if (e.key === "s" || e.key === "S") keys.s = false;
      if (e.key === "d" || e.key === "D") keys.d = false;
      if (e.key === " ") keys.space = false;
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, []);

  const startGame = (selectedMode: SolaceMode) => {
    setMode(selectedMode);
    initTrench();
    setGameState("playing");
  };

  return (
    <div className="w-full h-screen bg-[#020617] text-white relative overflow-hidden font-sans select-none">
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full block" />

      <div className="absolute top-0 inset-x-0 p-4 flex justify-between items-center z-30 pointer-events-none">
        <Link
          href="/games"
          className="pointer-events-auto flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold"
        >
          <ArrowLeft className="w-4 h-4" /> Exit Solace
        </Link>
        <button
          onClick={toggleSound}
          className="pointer-events-auto p-2 rounded-xl bg-white/5 border border-white/10"
        >
          {soundEnabled ? <Volume2 className="w-4 h-4 text-cyan-400" /> : <VolumeX className="w-4 h-4 text-rose-400" />}
        </button>
      </div>

      {gameState === "playing" && (
        <div className="absolute top-4 inset-x-0 flex justify-center pointer-events-none z-20">
          <div className="bg-[#0b0f19]/90 border border-cyan-500/30 px-8 py-3 rounded-2xl backdrop-blur-md flex items-center gap-8 pointer-events-auto">
            <div className="text-center">
              <div className="text-[10px] font-black uppercase text-white/40 tracking-wider">HULL INTEGRITY</div>
              <div className="text-lg font-black text-cyan-400">{Math.ceil(hullIntegrity)}%</div>
            </div>

            <div className="text-center">
              <div className="text-[10px] font-black uppercase text-white/40 tracking-wider">ABYSSAL CRYSTALS</div>
              <div className="text-xl font-black text-emerald-400">{crystalsCollected} / 10</div>
            </div>

            <div className="text-center">
              <div className="text-[10px] font-black uppercase text-white/40 tracking-wider">OXYGEN RESERVES</div>
              <div className="text-xl font-black text-sky-400">{Math.ceil(oxygen)}%</div>
            </div>
          </div>
        </div>
      )}

      {gameState === "menu" && (
        <div className="absolute inset-0 z-40 bg-[#020617]/95 backdrop-blur-xl flex flex-col items-center justify-center p-6">
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center max-w-xl mb-8">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs font-bold uppercase tracking-widest mb-3">
              <Compass className="w-3.5 h-3.5" /> Abyssal Sonar Submarine Navigation
            </div>
            <h1 className="text-6xl font-black uppercase tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-pink-500">
              SOLACE
            </h1>
            <p className="text-sm text-white/60 mt-3">
              Emit sonar echoes through bioluminescent ocean caverns, collect energy crystals, and evade colossal abyssal leviathans.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-lg w-full">
            <button
              onClick={() => startGame("abyssal_voyage")}
              className="p-5 rounded-2xl bg-[#0b0f19] border border-cyan-500/40 hover:border-cyan-400 flex flex-col items-center gap-2 hover:scale-105 transition-all text-center"
            >
              <User className="w-8 h-8 text-cyan-400" />
              <div className="font-black text-lg">TRENCH VOYAGE</div>
              <div className="text-xs text-white/50">Single player submarine exploration</div>
            </button>

            <button
              onClick={() => startGame("sonar_hydro_tag")}
              className="p-5 rounded-2xl bg-[#0b0f19] border border-pink-500/40 hover:border-pink-400 flex flex-col items-center gap-2 hover:scale-105 transition-all text-center"
            >
              <Users className="w-8 h-8 text-pink-400" />
              <div className="font-black text-lg">HYDRO TAG</div>
              <div className="text-xs text-white/50">2-Player sonar submarine clash</div>
            </button>
          </div>
        </div>
      )}

      {gameState === "game_over" && (
        <div className="absolute inset-0 z-50 bg-black/85 backdrop-blur-md flex flex-col items-center justify-center p-6">
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center max-w-md w-full">
            <h2 className="text-4xl font-black uppercase text-cyan-400 mb-2">
              {winnerName ? `${winnerName}!` : "Voyage Concluded"}
            </h2>
            <p className="text-xs text-white/50 mb-6">Abyssal Solace Expedition Ended</p>

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
