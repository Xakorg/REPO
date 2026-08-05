"use client";

import React, { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import {
  Trophy,
  Volume2,
  VolumeX,
  ArrowLeft,
  Zap,
  Users,
  User,
  Radio,
} from "lucide-react";
import Link from "next/link";
import { db } from "@/lib/firebase";
import { collection, addDoc, query, orderBy, limit, onSnapshot } from "firebase/firestore";

// --- AUDIO SYNTHESIZER ---
class KinesisAudioSynth {
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

  playRepulsor() {
    if (this.muted || !this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(300, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(900, this.ctx.currentTime + 0.2);
    gain.gain.setValueAtTime(0.15, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.2);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.2);
  }

  playAttractor() {
    if (this.muted || !this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = "triangle";
    osc.frequency.setValueAtTime(800, this.ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(400, this.ctx.currentTime + 0.18);
    gain.gain.setValueAtTime(0.12, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.18);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.18);
  }

  playDisruption() {
    if (this.muted || !this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(150, this.ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(40, this.ctx.currentTime + 0.3);
    gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.3);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.3);
  }
}

const audioSynth = new KinesisAudioSynth();

export type KinesisMode = "kinetic_repulsion" | "gravitational_duel";

interface LeaderboardEntry {
  id: string;
  name: string;
  score: number;
}

interface KineticParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
  type: "positive" | "negative";
  captured: boolean;
}

export default function KinesisGame() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [gameState, setGameState] = useState<"menu" | "playing" | "game_over">("menu");
  const [mode, setMode] = useState<KinesisMode>("kinetic_repulsion");
  const [scoreP1, setScoreP1] = useState(0);
  const [scoreP2, setScoreP2] = useState(0);
  const [fieldEnergy, setFieldEnergy] = useState(100);
  const [muted, setMuted] = useState(false);
  const [, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [playerName, setPlayerName] = useState("");
  const [winnerName, setWinnerName] = useState<string | null>(null);
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
    keys: { p1Up: false, p1Down: false, p1Left: false, p1Right: false, p1Pulse: false, p2Up: false, p2Down: false, p2Left: false, p2Right: false },
    nodeP1: { x: 300, y: 300, radius: 24, force: 1 },
    nodeP2: { x: 500, y: 300, radius: 24, force: 1 },
    particles: [] as KineticParticle[],
  });

  useEffect(() => {
    try {
      const q = query(collection(db, "kinesis_leaderboard"), orderBy("score", "desc"), limit(5));
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
    if (!playerName.trim() || scoreP1 <= 0) return;
    try {
      await addDoc(collection(db, "kinesis_leaderboard"), {
        name: playerName.trim().substring(0, 12),
        score: scoreP1,
        createdAt: new Date(),
      });
    } catch (e) {
      console.warn("Score submission error:", e);
    }
  };

  const startGame = (selectedMode: KinesisMode) => {
    audioSynth.init();
    setMode(selectedMode);
    setScoreP1(0);
    setScoreP2(0);
    setFieldEnergy(100);
    setWinnerName(null);

    const initialParticles: KineticParticle[] = [];
    for (let i = 0; i < 24; i++) {
      initialParticles.push({
        x: 100 + Math.random() * 600,
        y: 100 + Math.random() * 400,
        vx: (Math.random() - 0.5) * 3,
        vy: (Math.random() - 0.5) * 3,
        radius: 6,
        color: i % 2 === 0 ? "#10b981" : "#f43f5e",
        type: i % 2 === 0 ? "positive" : "negative",
        captured: false,
      });
    }

    engineRef.current = {
      keys: { p1Up: false, p1Down: false, p1Left: false, p1Right: false, p1Pulse: false, p2Up: false, p2Down: false, p2Left: false, p2Right: false },
      nodeP1: { x: mode === "gravitational_duel" ? 250 : 400, y: 300, radius: 24, force: 1 },
      nodeP2: { x: 550, y: 300, radius: 24, force: 1 },
      particles: initialParticles,
    };

    setGameState("playing");
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (gameState !== "playing") return;
      if (e.key === "w" || e.key === "W") engineRef.current.keys.p1Up = true;
      if (e.key === "s" || e.key === "S") engineRef.current.keys.p1Down = true;
      if (e.key === "a" || e.key === "A") engineRef.current.keys.p1Left = true;
      if (e.key === "d" || e.key === "D") engineRef.current.keys.p1Right = true;
      if (e.key === " ") engineRef.current.keys.p1Pulse = true;
      if (e.key === "ArrowUp") engineRef.current.keys.p2Up = true;
      if (e.key === "ArrowDown") engineRef.current.keys.p2Down = true;
      if (e.key === "ArrowLeft") engineRef.current.keys.p2Left = true;
      if (e.key === "ArrowRight") engineRef.current.keys.p2Right = true;
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === "w" || e.key === "W") engineRef.current.keys.p1Up = false;
      if (e.key === "s" || e.key === "S") engineRef.current.keys.p1Down = false;
      if (e.key === "a" || e.key === "A") engineRef.current.keys.p1Left = false;
      if (e.key === "d" || e.key === "D") engineRef.current.keys.p1Right = false;
      if (e.key === " ") engineRef.current.keys.p1Pulse = false;
      if (e.key === "ArrowUp") engineRef.current.keys.p2Up = false;
      if (e.key === "ArrowDown") engineRef.current.keys.p2Down = false;
      if (e.key === "ArrowLeft") engineRef.current.keys.p2Left = false;
      if (e.key === "ArrowRight") engineRef.current.keys.p2Right = false;
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

    let p1ScoreAccum = 0;
    let p2ScoreAccum = 0;
    let localEnergy = 100;

    const loop = () => {
      const state = engineRef.current;
      const nodeP1 = state.nodeP1;
      const nodeP2 = state.nodeP2;

      // P1 Movement
      if (state.keys.p1Up) nodeP1.y -= 5;
      if (state.keys.p1Down) nodeP1.y += 5;
      if (state.keys.p1Left) nodeP1.x -= 5;
      if (state.keys.p1Right) nodeP1.x += 5;
      nodeP1.x = Math.max(30, Math.min(770, nodeP1.x));
      nodeP1.y = Math.max(30, Math.min(570, nodeP1.y));

      // P2 Movement (if 2P mode)
      if (mode === "gravitational_duel") {
        if (state.keys.p2Up) nodeP2.y -= 5;
        if (state.keys.p2Down) nodeP2.y += 5;
        if (state.keys.p2Left) nodeP2.x -= 5;
        if (state.keys.p2Right) nodeP2.x += 5;
        nodeP2.x = Math.max(30, Math.min(770, nodeP2.x));
        nodeP2.y = Math.max(30, Math.min(570, nodeP2.y));
      }

      // Physics Calculation for Kinetic Particles
      state.particles.forEach((p) => {
        if (!p.captured) {
          p.x += p.vx;
          p.y += p.vy;

          // Wall Bounce
          if (p.x < 15 || p.x > 785) p.vx *= -1;
          if (p.y < 15 || p.y > 585) p.vy *= -1;

          // Gravitational / Kinetic Attraction to P1 Node
          const dx1 = nodeP1.x - p.x;
          const dy1 = nodeP1.y - p.y;
          const dist1 = Math.sqrt(dx1 * dx1 + dy1 * dy1);

          if (dist1 < 160) {
            const force = (160 - dist1) * 0.02;
            p.vx += (dx1 / dist1) * force * (p.type === "positive" ? 1 : -0.8);
            p.vy += (dy1 / dist1) * force * (p.type === "positive" ? 1 : -0.8);
          }

          if (dist1 < nodeP1.radius + p.radius) {
            p.captured = true;
            if (p.type === "positive") {
              audioSynth.playRepulsor();
              p1ScoreAccum += 150;
              setScoreP1(p1ScoreAccum);
              localEnergy = Math.min(100, localEnergy + 5);
            } else {
              audioSynth.playDisruption();
              localEnergy -= 15;
            }
            setFieldEnergy(Math.max(0, Math.floor(localEnergy)));
          }

          // Gravitational Attraction to P2 Node (in 2P mode)
          if (mode === "gravitational_duel" && !p.captured) {
            const dx2 = nodeP2.x - p.x;
            const dy2 = nodeP2.y - p.y;
            const dist2 = Math.sqrt(dx2 * dx2 + dy2 * dy2);

            if (dist2 < 160) {
              const force = (160 - dist2) * 0.02;
              p.vx += (dx2 / dist2) * force * (p.type === "positive" ? 1 : -0.8);
              p.vy += (dy2 / dist2) * force * (p.type === "positive" ? 1 : -0.8);
            }

            if (dist2 < nodeP2.radius + p.radius) {
              p.captured = true;
              if (p.type === "positive") {
                audioSynth.playRepulsor();
                p2ScoreAccum += 150;
                setScoreP2(p2ScoreAccum);
              }
            }
          }
        }
      });

      // Respawn Captured Particles
      if (state.particles.every((p) => p.captured)) {
        state.particles.forEach((p) => {
          p.captured = false;
          p.x = 100 + Math.random() * 600;
          p.y = 100 + Math.random() * 400;
          p.vx = (Math.random() - 0.5) * 3;
          p.vy = (Math.random() - 0.5) * 3;
        });
      }

      if (mode === "kinetic_repulsion" && localEnergy <= 0) {
        setGameState("game_over");
        return;
      }

      // --- RENDERING ---
      ctx.fillStyle = "#010e14";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw Particles
      state.particles.forEach((p) => {
        if (!p.captured) {
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
          ctx.fillStyle = p.color;
          ctx.shadowColor = p.color;
          ctx.shadowBlur = 10;
          ctx.fill();
        }
      });
      ctx.shadowBlur = 0;

      // Draw P1 Node
      ctx.beginPath();
      ctx.arc(nodeP1.x, nodeP1.y, nodeP1.radius, 0, Math.PI * 2);
      ctx.fillStyle = "#10b981";
      ctx.shadowColor = "#10b981";
      ctx.shadowBlur = 20;
      ctx.fill();
      ctx.shadowBlur = 0;

      // Draw P2 Node (if 2P mode)
      if (mode === "gravitational_duel") {
        ctx.beginPath();
        ctx.arc(nodeP2.x, nodeP2.y, nodeP2.radius, 0, Math.PI * 2);
        ctx.fillStyle = "#06b6d4";
        ctx.shadowColor = "#06b6d4";
        ctx.shadowBlur = 20;
        ctx.fill();
        ctx.shadowBlur = 0;
      }

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [gameState, mode]);

  return (
    <div className="relative w-full h-screen bg-[#01090d] text-white flex flex-col items-center justify-center font-sans overflow-hidden select-none">
      {/* Navigation Header */}
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
            {muted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
          </button>
        </div>
      </div>

      {/* Main Canvas Area */}
      <div className="relative w-full max-w-4xl aspect-[4/3] bg-[#02151f] rounded-3xl border border-emerald-500/30 overflow-hidden shadow-[0_0_60px_rgba(16,185,129,0.15)] flex flex-col justify-center items-center">
        <canvas ref={canvasRef} width={800} height={600} className="w-full h-full object-contain" />

        {/* Dynamic HUD */}
        {gameState === "playing" && (
          <div className="absolute top-6 inset-x-6 z-20 flex justify-between items-start pointer-events-none">
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-black/60 border border-emerald-500/40 text-emerald-300 font-mono text-xs backdrop-blur-md">
                <Radio className="w-3.5 h-3.5 text-emerald-400" /> P1 KINETIC SCORE: {scoreP1}
              </div>
              {mode === "gravitational_duel" && (
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-black/60 border border-cyan-500/40 text-cyan-300 font-mono text-xs backdrop-blur-md">
                  <Radio className="w-3.5 h-3.5 text-cyan-400" /> P2 KINETIC SCORE: {scoreP2}
                </div>
              )}
              {mode === "kinetic_repulsion" && (
                <div className="w-48 bg-black/60 border border-white/10 p-1.5 rounded-xl backdrop-blur-md">
                  <div className="flex justify-between text-[10px] font-mono mb-1 text-white/70">
                    <span>KINETIC ENERGY</span>
                    <span>{fieldEnergy}%</span>
                  </div>
                  <div className="w-full bg-white/10 h-2 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-400 transition-all duration-200"
                      style={{ width: `${fieldEnergy}%` }}
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="px-4 py-2 rounded-2xl bg-black/60 border border-emerald-500/40 backdrop-blur-md text-right">
              <div className="text-[10px] font-mono text-emerald-400/70 uppercase">FIELD ATTRACTIVITY</div>
              <div className="text-2xl font-black font-mono text-emerald-300">{scoreP1}</div>
            </div>
          </div>
        )}

        {/* Small Touch Screen Controls */}
        {gameState === "playing" && isMobileScreen && (
          <div className="absolute bottom-6 inset-x-6 flex justify-between items-center z-30 pointer-events-auto">
            <div className="grid grid-cols-3 gap-2 w-36">
              <div />
              <button
                onTouchStart={() => (engineRef.current.keys.p1Up = true)}
                onTouchEnd={() => (engineRef.current.keys.p1Up = false)}
                className="w-11 h-11 rounded-xl bg-white/10 border border-white/20 active:bg-emerald-500/30 flex items-center justify-center font-bold"
              >
                ↑
              </button>
              <div />
              <button
                onTouchStart={() => (engineRef.current.keys.p1Left = true)}
                onTouchEnd={() => (engineRef.current.keys.p1Left = false)}
                className="w-11 h-11 rounded-xl bg-white/10 border border-white/20 active:bg-emerald-500/30 flex items-center justify-center font-bold"
              >
                ←
              </button>
              <button
                onTouchStart={() => (engineRef.current.keys.p1Down = true)}
                onTouchEnd={() => (engineRef.current.keys.p1Down = false)}
                className="w-11 h-11 rounded-xl bg-white/10 border border-white/20 active:bg-emerald-500/30 flex items-center justify-center font-bold"
              >
                ↓
              </button>
              <button
                onTouchStart={() => (engineRef.current.keys.p1Right = true)}
                onTouchEnd={() => (engineRef.current.keys.p1Right = false)}
                className="w-11 h-11 rounded-xl bg-white/10 border border-white/20 active:bg-emerald-500/30 flex items-center justify-center font-bold"
              >
                →
              </button>
            </div>
          </div>
        )}

        {/* Menu Overlay */}
        {gameState === "menu" && (
          <div className="absolute inset-0 z-40 bg-[#020e17]/90 backdrop-blur-2xl flex flex-col items-center justify-center p-6 overflow-y-auto">
            <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-emerald-600/20 rounded-full blur-[120px] pointer-events-none animate-pulse" />

            <motion.div
              initial={{ scale: 0.88, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              className="text-center max-w-2xl mb-8 z-10"
            >
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-black uppercase tracking-widest mb-4 shadow-[0_0_20px_rgba(16,185,129,0.2)]">
                <Zap className="w-4 h-4 text-emerald-400 animate-bounce" /> Telekinetic Particle Gravitational Field
              </div>

              <h1 className="text-7xl md:text-8xl font-black uppercase tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-emerald-300 via-teal-300 to-cyan-400 drop-shadow-[0_0_40px_rgba(16,185,129,0.6)]">
                KINESIS
              </h1>
              <p className="text-base text-emerald-100/70 mt-4 max-w-lg mx-auto leading-relaxed">
                Control kinetic gravitational attraction nodes to draw positive energy particles while repelling negative disruptions.
              </p>

              <div className="flex justify-center gap-3 mt-4">
                <span className="px-3 py-1 rounded-md bg-white/5 border border-white/10 text-[10px] font-mono text-emerald-300">1P / 2P MODES</span>
                <span className="px-3 py-1 rounded-md bg-white/5 border border-white/10 text-[10px] font-mono text-teal-300">ONLINE LEADERBOARD</span>
                <span className="px-3 py-1 rounded-md bg-white/5 border border-white/10 text-[10px] font-mono text-cyan-300">TOUCH READY</span>
              </div>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-xl w-full z-10">
              <button
                onClick={() => startGame("kinetic_repulsion")}
                className="group relative p-6 rounded-3xl bg-white/5 border border-emerald-500/30 hover:border-emerald-400 hover:bg-emerald-500/10 flex flex-col items-center gap-3 transition-all duration-300 text-center backdrop-blur-md shadow-lg hover:shadow-[0_0_30px_rgba(16,185,129,0.3)] active:scale-95"
              >
                <User className="w-8 h-8 text-emerald-400 group-hover:scale-110 transition-transform" />
                <div>
                  <div className="font-black text-xl uppercase tracking-wider text-white">KINETIC FIELD</div>
                  <div className="text-xs text-emerald-200/60 mt-1">Single player particle attraction puzzle</div>
                </div>
              </button>

              <button
                onClick={() => startGame("gravitational_duel")}
                className="group relative p-6 rounded-3xl bg-white/5 border border-cyan-500/30 hover:border-cyan-400 hover:bg-cyan-500/10 flex flex-col items-center gap-3 transition-all duration-300 text-center backdrop-blur-md shadow-lg hover:shadow-[0_0_30px_rgba(6,182,212,0.3)] active:scale-95"
              >
                <Users className="w-8 h-8 text-cyan-400 group-hover:scale-110 transition-transform" />
                <div>
                  <div className="font-black text-xl uppercase tracking-wider text-white">GRAVITY DUEL</div>
                  <div className="text-xs text-cyan-200/60 mt-1">2-Player competitive particle pull</div>
                </div>
              </button>
            </div>

            <div className="mt-8 z-10 flex flex-wrap items-center justify-center gap-6 text-xs text-white/50 bg-black/40 px-6 py-3 rounded-2xl border border-white/10">
              <div className="flex items-center gap-2">
                <span className="font-mono text-emerald-300 bg-white/10 px-2 py-0.5 rounded border border-white/10 font-bold">WASD</span>
                <span>Move P1 Node</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-cyan-300 bg-white/10 px-2 py-0.5 rounded border border-white/10 font-bold">ARROWS</span>
                <span>Move P2 Node</span>
              </div>
            </div>
          </div>
        )}

        {/* Game Over Overlay */}
        {gameState === "game_over" && (
          <div className="absolute inset-0 z-50 bg-black/90 backdrop-blur-2xl flex flex-col items-center justify-center p-6">
            <motion.div
              initial={{ scale: 0.88, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="text-center max-w-md w-full bg-slate-900/90 border border-emerald-500/40 p-8 rounded-3xl shadow-[0_0_50px_rgba(16,185,129,0.3)] relative overflow-hidden"
            >
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-bold uppercase tracking-wider mb-4">
                <Trophy className="w-3.5 h-3.5 text-emerald-400" /> Kinetic Field Finished
              </div>

              <h2 className="text-4xl font-black uppercase text-transparent bg-clip-text bg-gradient-to-r from-emerald-300 to-cyan-300 mb-2">
                ENERGY DISRUPTED
              </h2>
              <p className="text-xs text-emerald-200/60 mb-6">Kinesis Particle Attraction Results</p>

              <div className="p-4 rounded-2xl bg-white/5 border border-white/10 mb-6">
                <div className="text-[10px] text-white/40 font-black uppercase">FINAL SCORE</div>
                <div className="text-3xl font-black text-emerald-300">{scoreP1}</div>
              </div>

              <div className="mb-6 flex gap-2">
                <input
                  type="text"
                  placeholder="Enter Player Name"
                  value={playerName}
                  onChange={(e) => setPlayerName(e.target.value)}
                  className="flex-1 px-4 py-3 rounded-xl bg-black/60 border border-white/10 text-white text-xs focus:outline-none focus:border-emerald-400"
                />
                <button
                  onClick={saveScore}
                  className="px-4 py-3 rounded-xl bg-emerald-500 text-black font-bold text-xs uppercase"
                >
                  SAVE
                </button>
              </div>

              <div className="flex gap-4">
                <button
                  onClick={() => startGame(mode)}
                  className="flex-1 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-black font-black uppercase tracking-wider shadow-[0_0_20px_rgba(16,185,129,0.4)] active:scale-95 transition-all"
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
