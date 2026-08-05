"use client";

import React, { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import {
  Trophy,
  Volume2,
  VolumeX,
  ArrowLeft,
  Sparkles,
  Sun,
} from "lucide-react";
import Link from "next/link";
import { db } from "@/lib/firebase";
import { collection, addDoc, query, orderBy, limit, onSnapshot } from "firebase/firestore";

// --- AUDIO SYNTHESIZER ---
class AetherAudioSynth {
  ctx: AudioContext | null = null;
  muted: boolean = false;

  init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === "suspended") {
      this.ctx.resume();
    }
  }

  playEmberAbsorb() {
    if (this.muted || !this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(440, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(880, this.ctx.currentTime + 0.2);
    gain.gain.setValueAtTime(0.12, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.2);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.2);
  }

  playHarmonicPulse() {
    if (this.muted || !this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = "triangle";
    osc.frequency.setValueAtTime(523.25, this.ctx.currentTime);
    osc.frequency.setValueAtTime(659.25, this.ctx.currentTime + 0.1);
    osc.frequency.setValueAtTime(783.99, this.ctx.currentTime + 0.2);
    gain.gain.setValueAtTime(0.15, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.35);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.35);
  }

  playVoidStrike() {
    if (this.muted || !this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(140, this.ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(40, this.ctx.currentTime + 0.25);
    gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.25);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.25);
  }
}

const audioSynth = new AetherAudioSynth();

interface LeaderboardEntry {
  id: string;
  name: string;
  score: number;
}

interface CelestialEmber {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
  absorbed: boolean;
}

interface VoidAnomaly {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
}

export default function AetherGame() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [gameState, setGameState] = useState<"menu" | "playing" | "game_over">("menu");
  const [score, setScore] = useState(0);
  const [harmonyScore, setHarmonyScore] = useState(100);
  const [pulseCharges, setPulseCharges] = useState(3);
  const [muted, setMuted] = useState(false);
  const [, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [playerName, setPlayerName] = useState("");
  const [isMobileScreen, setIsMobileScreen] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobileScreen(window.innerWidth <= 768 && window.matchMedia("(pointer: coarse)").matches);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const engineRef = useRef({
    keys: { left: false, right: false, up: false, down: false, pulse: false },
    avatar: {
      x: 400,
      y: 300,
      vx: 0,
      vy: 0,
      radius: 18,
    },
    embers: [] as CelestialEmber[],
    anomalies: [] as VoidAnomaly[],
    particles: [] as { x: number; y: number; vx: number; vy: number; life: number; color: string }[],
    pulseActive: false,
    pulseRadius: 0,
  });

  useEffect(() => {
    try {
      const q = query(collection(db, "aether_leaderboard"), orderBy("score", "desc"), limit(5));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const entries: LeaderboardEntry[] = [];
        snapshot.forEach((doc) => {
          entries.push({ id: doc.id, ...doc.data() } as LeaderboardEntry);
        });
        setLeaderboard(entries);
      });
      return () => unsubscribe();
    } catch (e) {
      console.warn("Firestore leaderboard offline:", e);
    }
  }, []);

  const saveScore = async () => {
    if (!playerName.trim() || score <= 0) return;
    try {
      await addDoc(collection(db, "aether_leaderboard"), {
        name: playerName.trim().substring(0, 12),
        score: score,
        createdAt: new Date(),
      });
    } catch (e) {
      console.warn("Score submission error:", e);
    }
  };

  const triggerPulse = () => {
    if (pulseCharges <= 0 || engineRef.current.pulseActive) return;
    setPulseCharges((prev) => prev - 1);
    audioSynth.playHarmonicPulse();
    engineRef.current.pulseActive = true;
    engineRef.current.pulseRadius = 15;
  };

  const startGame = () => {
    audioSynth.init();
    setScore(0);
    setHarmonyScore(100);
    setPulseCharges(3);

    const initialEmbers: CelestialEmber[] = [];
    for (let i = 0; i < 12; i++) {
      initialEmbers.push({
        x: 100 + Math.random() * 600,
        y: 100 + Math.random() * 400,
        vx: (Math.random() - 0.5) * 1.5,
        vy: (Math.random() - 0.5) * 1.5,
        radius: 8 + Math.random() * 6,
        color: Math.random() > 0.5 ? "#fbbf24" : "#38bdf8",
        absorbed: false,
      });
    }

    const initialAnomalies: VoidAnomaly[] = [];
    for (let i = 0; i < 4; i++) {
      initialAnomalies.push({
        x: 100 + Math.random() * 600,
        y: 100 + Math.random() * 400,
        vx: (Math.random() - 0.5) * 2,
        vy: (Math.random() - 0.5) * 2,
        radius: 14 + Math.random() * 8,
      });
    }

    engineRef.current = {
      keys: { left: false, right: false, up: false, down: false, pulse: false },
      avatar: {
        x: 400,
        y: 300,
        vx: 0,
        vy: 0,
        radius: 18,
      },
      embers: initialEmbers,
      anomalies: initialAnomalies,
      particles: [],
      pulseActive: false,
      pulseRadius: 0,
    };

    setGameState("playing");
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (gameState !== "playing") return;
      if (e.key === "ArrowLeft" || e.key === "a" || e.key === "A") engineRef.current.keys.left = true;
      if (e.key === "ArrowRight" || e.key === "d" || e.key === "D") engineRef.current.keys.right = true;
      if (e.key === "ArrowUp" || e.key === "w" || e.key === "W") engineRef.current.keys.up = true;
      if (e.key === "ArrowDown" || e.key === "s" || e.key === "S") engineRef.current.keys.down = true;
      if (e.key === " " || e.key === "e" || e.key === "E") triggerPulse();
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft" || e.key === "a" || e.key === "A") engineRef.current.keys.left = false;
      if (e.key === "ArrowRight" || e.key === "d" || e.key === "D") engineRef.current.keys.right = false;
      if (e.key === "ArrowUp" || e.key === "w" || e.key === "W") engineRef.current.keys.up = false;
      if (e.key === "ArrowDown" || e.key === "s" || e.key === "S") engineRef.current.keys.down = false;
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [gameState]);

  // --- GAME LOOP ---
  useEffect(() => {
    if (gameState !== "playing") return;
    let animId: number;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let localHarmony = 100;

    const loop = () => {
      const state = engineRef.current;
      const avatar = state.avatar;

      // Zero-G Physics Movement
      if (state.keys.left) avatar.vx -= 0.35;
      if (state.keys.right) avatar.vx += 0.35;
      if (state.keys.up) avatar.vy -= 0.35;
      if (state.keys.down) avatar.vy += 0.35;

      avatar.vx *= 0.94;
      avatar.vy *= 0.94;

      avatar.x += avatar.vx;
      avatar.y += avatar.vy;

      // Screen Bounds Rebound
      if (avatar.x < 30) { avatar.x = 30; avatar.vx *= -0.8; }
      if (avatar.x > 770) { avatar.x = 770; avatar.vx *= -0.8; }
      if (avatar.y < 30) { avatar.y = 30; avatar.vy *= -0.8; }
      if (avatar.y > 570) { avatar.y = 570; avatar.vy *= -0.8; }

      // Harmonic Pulse Expansion
      if (state.pulseActive) {
        state.pulseRadius += 12;
        state.anomalies = state.anomalies.filter((anom) => {
          const dx = anom.x - avatar.x;
          const dy = anom.y - avatar.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < state.pulseRadius) {
            setScore((prev) => prev + 300);
            return false;
          }
          return true;
        });

        if (state.pulseRadius > 240) {
          state.pulseActive = false;
        }
      }

      // Embers Motion & Absorption
      state.embers.forEach((ember) => {
        if (!ember.absorbed) {
          ember.x += ember.vx;
          ember.y += ember.vy;
          if (ember.x < 40 || ember.x > 760) ember.vx *= -1;
          if (ember.y < 40 || ember.y > 560) ember.vy *= -1;

          const dx = ember.x - avatar.x;
          const dy = ember.y - avatar.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < avatar.radius + ember.radius) {
            ember.absorbed = true;
            audioSynth.playEmberAbsorb();
            setScore((prev) => prev + 150);
            localHarmony = Math.min(100, localHarmony + 5);
            setHarmonyScore(Math.floor(localHarmony));
          }
        }
      });

      // Respawn Absorbed Embers
      if (state.embers.filter((e) => !e.absorbed).length < 6) {
        state.embers.push({
          x: 50 + Math.random() * 700,
          y: 50 + Math.random() * 500,
          vx: (Math.random() - 0.5) * 1.5,
          vy: (Math.random() - 0.5) * 1.5,
          radius: 8 + Math.random() * 6,
          color: Math.random() > 0.5 ? "#fbbf24" : "#38bdf8",
          absorbed: false,
        });
      }

      // Void Anomalies Collisions
      state.anomalies.forEach((anom) => {
        anom.x += anom.vx;
        anom.y += anom.vy;
        if (anom.x < 40 || anom.x > 760) anom.vx *= -1;
        if (anom.y < 40 || anom.y > 560) anom.vy *= -1;

        const dx = anom.x - avatar.x;
        const dy = anom.y - avatar.y;
        if (Math.sqrt(dx * dx + dy * dy) < avatar.radius + anom.radius) {
          localHarmony -= 0.8;
          setHarmonyScore((prev) => Math.max(0, Math.floor(prev - 0.8)));
          audioSynth.playVoidStrike();
        }
      });

      if (localHarmony <= 0) {
        setGameState("game_over");
        return;
      }

      // --- RENDERING ---
      ctx.fillStyle = "#030712";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Render Nebula Background Orbs
      ctx.fillStyle = "rgba(251, 191, 36, 0.03)";
      ctx.beginPath();
      ctx.arc(200, 200, 180, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = "rgba(56, 189, 248, 0.03)";
      ctx.beginPath();
      ctx.arc(600, 400, 220, 0, Math.PI * 2);
      ctx.fill();

      // Render Embers
      state.embers.forEach((e) => {
        if (!e.absorbed) {
          ctx.beginPath();
          ctx.arc(e.x, e.y, e.radius, 0, Math.PI * 2);
          ctx.fillStyle = e.color;
          ctx.shadowColor = e.color;
          ctx.shadowBlur = 12;
          ctx.fill();
        }
      });
      ctx.shadowBlur = 0;

      // Render Void Anomalies
      state.anomalies.forEach((anom) => {
        ctx.beginPath();
        ctx.arc(anom.x, anom.y, anom.radius, 0, Math.PI * 2);
        ctx.fillStyle = "#a855f7";
        ctx.shadowColor = "#a855f7";
        ctx.shadowBlur = 16;
        ctx.fill();
      });
      ctx.shadowBlur = 0;

      // Render Harmonic Pulse Expansion Wave
      if (state.pulseActive) {
        ctx.beginPath();
        ctx.arc(avatar.x, avatar.y, state.pulseRadius, 0, Math.PI * 2);
        ctx.strokeStyle = "rgba(251, 191, 36, 0.8)";
        ctx.lineWidth = 4;
        ctx.stroke();
      }

      // Render Player Avatar Core
      ctx.beginPath();
      ctx.arc(avatar.x, avatar.y, avatar.radius, 0, Math.PI * 2);
      ctx.fillStyle = "#ffffff";
      ctx.shadowColor = "#fbbf24";
      ctx.shadowBlur = 20;
      ctx.fill();

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [gameState]);

  return (
    <div className="relative w-full h-screen bg-[#03050d] text-white flex flex-col items-center justify-center font-sans overflow-hidden select-none">
      {/* Top Header */}
      <div className="absolute top-4 left-4 right-4 z-30 flex items-center justify-between pointer-events-auto">
        <Link
          href="/games"
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-xs font-bold uppercase tracking-wider backdrop-blur-md transition-all"
        >
          <ArrowLeft className="w-4 h-4" /> GAMES
        </Link>
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              audioSynth.muted = !muted;
              setMuted(!muted);
            }}
            className="p-2.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-white backdrop-blur-md"
          >
            {muted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-amber-400" />}
          </button>
        </div>
      </div>

      {/* Main Canvas Container */}
      <div className="relative w-full max-w-4xl aspect-[4/3] bg-[#050816] rounded-3xl border border-amber-500/30 overflow-hidden shadow-[0_0_60px_rgba(251,191,36,0.15)] flex flex-col justify-center items-center">
        <canvas ref={canvasRef} width={800} height={600} className="w-full h-full object-contain" />

        {/* Dynamic Playing HUD */}
        {gameState === "playing" && (
          <div className="absolute top-6 inset-x-6 z-20 flex justify-between items-start pointer-events-none">
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-black/60 border border-amber-500/40 text-amber-300 font-mono text-xs backdrop-blur-md">
                <Sparkles className="w-3.5 h-3.5" /> PULSE CHARGES: {pulseCharges}
              </div>
              <div className="w-48 bg-black/60 border border-white/10 p-1.5 rounded-xl backdrop-blur-md">
                <div className="flex justify-between text-[10px] font-mono mb-1 text-white/70">
                  <span>CELESTIAL HARMONY</span>
                  <span>{harmonyScore}%</span>
                </div>
                <div className="w-full bg-white/10 h-2 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-purple-500 via-amber-400 to-amber-300 transition-all duration-200"
                    style={{ width: `${harmonyScore}%` }}
                  />
                </div>
              </div>
            </div>

            <div className="px-4 py-2 rounded-2xl bg-black/60 border border-amber-500/40 backdrop-blur-md text-right">
              <div className="text-[10px] font-mono text-amber-400/70 uppercase">HARMONY SCORE</div>
              <div className="text-2xl font-black font-mono text-amber-300">{score}</div>
            </div>
          </div>
        )}

        {/* Small Touch Screen Controls */}
        {gameState === "playing" && isMobileScreen && (
          <div className="absolute bottom-6 inset-x-6 flex justify-between items-center z-30 pointer-events-auto">
            <div className="grid grid-cols-3 gap-1 w-36 h-36">
              <div />
              <button
                onTouchStart={() => (engineRef.current.keys.up = true)}
                onTouchEnd={() => (engineRef.current.keys.up = false)}
                className="bg-white/10 rounded-xl border border-white/20 active:bg-amber-500/30 flex items-center justify-center font-bold"
              >
                ↑
              </button>
              <div />
              <button
                onTouchStart={() => (engineRef.current.keys.left = true)}
                onTouchEnd={() => (engineRef.current.keys.left = false)}
                className="bg-white/10 rounded-xl border border-white/20 active:bg-amber-500/30 flex items-center justify-center font-bold"
              >
                ←
              </button>
              <div />
              <button
                onTouchStart={() => (engineRef.current.keys.right = true)}
                onTouchEnd={() => (engineRef.current.keys.right = false)}
                className="bg-white/10 rounded-xl border border-white/20 active:bg-amber-500/30 flex items-center justify-center font-bold"
              >
                →
              </button>
              <div />
              <button
                onTouchStart={() => (engineRef.current.keys.down = true)}
                onTouchEnd={() => (engineRef.current.keys.down = false)}
                className="bg-white/10 rounded-xl border border-white/20 active:bg-amber-500/30 flex items-center justify-center font-bold"
              >
                ↓
              </button>
              <div />
            </div>
            <button
              onClick={triggerPulse}
              className="w-20 h-20 rounded-full bg-gradient-to-tr from-amber-500 to-amber-300 border border-amber-200 active:scale-95 flex items-center justify-center font-black text-xs uppercase text-black shadow-lg"
            >
              PULSE
            </button>
          </div>
        )}

        {/* Menu Screen */}
        {gameState === "menu" && (
          <div className="absolute inset-0 z-40 bg-[#040612]/90 backdrop-blur-2xl flex flex-col items-center justify-center p-6 overflow-y-auto">
            <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-amber-600/20 rounded-full blur-[120px] pointer-events-none animate-pulse" />

            <motion.div
              initial={{ scale: 0.88, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              className="text-center max-w-2xl mb-8 z-10"
            >
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-black uppercase tracking-widest mb-4 shadow-[0_0_20px_rgba(251,191,36,0.2)]">
                <Sun className="w-4 h-4 text-amber-400 animate-spin" style={{ animationDuration: "12s" }} /> Celestial Ember Balance Protocol
              </div>

              <h1 className="text-7xl md:text-8xl font-black uppercase tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-yellow-300 to-amber-500 drop-shadow-[0_0_40px_rgba(251,191,36,0.6)]">
                AETHER
              </h1>
              <p className="text-base text-amber-100/70 mt-4 max-w-lg mx-auto leading-relaxed">
                Absorb glowing stardust embers in zero-G deep space while repelling void shadow anomalies with harmonic EMP shockwaves.
              </p>

              <div className="flex justify-center gap-3 mt-4">
                <span className="px-3 py-1 rounded-md bg-white/5 border border-white/10 text-[10px] font-mono text-amber-300">SINGLE PLAYER</span>
                <span className="px-3 py-1 rounded-md bg-white/5 border border-white/10 text-[10px] font-mono text-yellow-300">ONLINE LEADERBOARD</span>
                <span className="px-3 py-1 rounded-md bg-white/5 border border-white/10 text-[10px] font-mono text-cyan-300">TOUCH READY</span>
              </div>
            </motion.div>

            <button
              onClick={startGame}
              className="group px-10 py-5 rounded-3xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-black font-black text-xl uppercase tracking-wider shadow-[0_0_40px_rgba(251,191,36,0.4)] active:scale-95 transition-all z-10"
            >
              INITIALIZE HARMONY
            </button>

            <div className="mt-8 z-10 flex flex-wrap items-center justify-center gap-6 text-xs text-white/50 bg-black/40 px-6 py-3 rounded-2xl border border-white/10">
              <div className="flex items-center gap-2">
                <span className="font-mono text-amber-300 bg-white/10 px-2 py-0.5 rounded border border-white/10 font-bold">WASD / ARROWS</span>
                <span>Zero-G Movement</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-yellow-300 bg-white/10 px-2 py-0.5 rounded border border-white/10 font-bold">SPACE / E</span>
                <span>Harmonic Pulse</span>
              </div>
            </div>
          </div>
        )}

        {/* Game Over Screen */}
        {gameState === "game_over" && (
          <div className="absolute inset-0 z-50 bg-black/90 backdrop-blur-2xl flex flex-col items-center justify-center p-6">
            <motion.div
              initial={{ scale: 0.88, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="text-center max-w-md w-full bg-slate-900/90 border border-amber-500/40 p-8 rounded-3xl shadow-[0_0_50px_rgba(251,191,36,0.3)] relative overflow-hidden"
            >
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-bold uppercase tracking-wider mb-4">
                <Trophy className="w-3.5 h-3.5 text-amber-400" /> Celestial Trial Concluded
              </div>

              <h2 className="text-4xl font-black uppercase text-transparent bg-clip-text bg-gradient-to-r from-amber-300 to-yellow-300 mb-2">
                HARMONY DISSOLVED
              </h2>
              <p className="text-xs text-amber-200/60 mb-6">Zero-G Celestial Balance Results</p>

              <div className="p-4 rounded-2xl bg-white/5 border border-white/10 mb-6">
                <div className="text-[10px] text-white/40 font-black uppercase">FINAL HARMONY SCORE</div>
                <div className="text-3xl font-black text-amber-300">{score}</div>
              </div>

              <div className="mb-6 flex gap-2">
                <input
                  type="text"
                  placeholder="Enter Pilot Name"
                  value={playerName}
                  onChange={(e) => setPlayerName(e.target.value)}
                  className="flex-1 px-4 py-3 rounded-xl bg-black/60 border border-white/10 text-white text-xs focus:outline-none focus:border-amber-400"
                />
                <button
                  onClick={saveScore}
                  className="px-4 py-3 rounded-xl bg-amber-500 text-black font-bold text-xs uppercase"
                >
                  SAVE
                </button>
              </div>

              <div className="flex gap-4">
                <button
                  onClick={startGame}
                  className="flex-1 py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-black font-black uppercase tracking-wider shadow-[0_0_20px_rgba(251,191,36,0.4)] active:scale-95 transition-all"
                >
                  REMATCH
                </button>
                <button
                  onClick={() => setGameState("menu")}
                  className="px-6 py-3.5 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-bold uppercase tracking-wider border border-white/10 active:scale-95 transition-all"
                >
                  MENU
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
}
