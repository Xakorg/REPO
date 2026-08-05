"use client";

import React, { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import {
  Trophy,
  Volume2,
  VolumeX,
  ArrowLeft,
  Zap,
  Gauge,
} from "lucide-react";
import Link from "next/link";
import { db } from "@/lib/firebase";
import { collection, addDoc, query, orderBy, limit, onSnapshot } from "firebase/firestore";

// --- AUDIO SYNTHESIZER ---
class DriftAudioSynth {
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

  playDriftSound() {
    if (this.muted || !this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(180, this.ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(320, this.ctx.currentTime + 0.15);
    gain.gain.setValueAtTime(0.08, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.005, this.ctx.currentTime + 0.15);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.15);
  }

  playBoostSound() {
    if (this.muted || !this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(400, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(1200, this.ctx.currentTime + 0.25);
    gain.gain.setValueAtTime(0.18, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.25);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.25);
  }

  playCrash() {
    if (this.muted || !this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = "square";
    osc.frequency.setValueAtTime(120, this.ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(30, this.ctx.currentTime + 0.3);
    gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.3);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.3);
  }
}

const audioSynth = new DriftAudioSynth();

interface LeaderboardEntry {
  id: string;
  name: string;
  score: number;
}

interface PylonGate {
  x: number;
  y: number;
  width: number;
  passed: boolean;
}

interface SparkParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  color: string;
}

export default function DriftGame() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [gameState, setGameState] = useState<"menu" | "playing" | "game_over">("menu");
  const [score, setScore] = useState(0);
  const [speedMeter, setSpeedMeter] = useState(0);
  const [boostGauge, setBoostGauge] = useState(100);
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
    keys: { left: false, right: false, boost: false },
    vehicle: {
      x: 400,
      y: 500,
      vx: 0,
      vy: 0,
      angle: -Math.PI / 2,
      speed: 0,
      driftFactor: 0,
    },
    gates: [] as PylonGate[],
    particles: [] as SparkParticle[],
    distanceTraveled: 0,
    cameraY: 0,
  });

  useEffect(() => {
    try {
      const q = query(collection(db, "drift_leaderboard"), orderBy("score", "desc"), limit(5));
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
      await addDoc(collection(db, "drift_leaderboard"), {
        name: playerName.trim().substring(0, 12),
        score: score,
        createdAt: new Date(),
      });
    } catch (e) {
      console.warn("Score submission error:", e);
    }
  };

  const startGame = () => {
    audioSynth.init();
    setScore(0);
    setBoostGauge(100);

    const initialGates: PylonGate[] = [
      { x: 250, y: 300, width: 220, passed: false },
      { x: 380, y: 100, width: 200, passed: false },
      { x: 200, y: -100, width: 200, passed: false },
      { x: 340, y: -300, width: 180, passed: false },
    ];

    engineRef.current = {
      keys: { left: false, right: false, boost: false },
      vehicle: {
        x: 400,
        y: 500,
        vx: 0,
        vy: -5,
        angle: -Math.PI / 2,
        speed: 5,
        driftFactor: 0,
      },
      gates: initialGates,
      particles: [],
      distanceTraveled: 0,
      cameraY: 500,
    };

    setGameState("playing");
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (gameState !== "playing") return;
      if (e.key === "ArrowLeft" || e.key === "a" || e.key === "A") engineRef.current.keys.left = true;
      if (e.key === "ArrowRight" || e.key === "d" || e.key === "D") engineRef.current.keys.right = true;
      if (e.key === " " || e.key === "Shift") engineRef.current.keys.boost = true;
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft" || e.key === "a" || e.key === "A") engineRef.current.keys.left = false;
      if (e.key === "ArrowRight" || e.key === "d" || e.key === "D") engineRef.current.keys.right = false;
      if (e.key === " " || e.key === "Shift") engineRef.current.keys.boost = false;
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

    const loop = () => {
      const state = engineRef.current;
      const vehicle = state.vehicle;

      // Steering & Drift Physics
      if (state.keys.left) {
        vehicle.angle -= 0.055;
        vehicle.driftFactor += 0.05;
        audioSynth.playDriftSound();
      }
      if (state.keys.right) {
        vehicle.angle += 0.055;
        vehicle.driftFactor += 0.05;
        audioSynth.playDriftSound();
      }

      // Base Speed & Boost
      let maxSpeed = 7.5;
      if (state.keys.boost && boostGauge > 0) {
        maxSpeed = 12.0;
        setBoostGauge((prev) => Math.max(0, prev - 0.6));
        audioSynth.playBoostSound();
      } else {
        setBoostGauge((prev) => Math.min(100, prev + 0.15));
      }

      vehicle.speed += (maxSpeed - vehicle.speed) * 0.04;
      setSpeedMeter(Math.floor(vehicle.speed * 20));

      vehicle.vx = Math.cos(vehicle.angle) * vehicle.speed;
      vehicle.vy = Math.sin(vehicle.angle) * vehicle.speed;

      vehicle.x += vehicle.vx;
      vehicle.y += vehicle.vy;

      // Camera Scrolling
      state.cameraY = vehicle.y + 200;
      state.distanceTraveled = Math.floor(-vehicle.y + 500);
      setScore(state.distanceTraveled);

      // Track Walls Collision (Left 80px, Right 720px)
      if (vehicle.x < 80 || vehicle.x > 720) {
        audioSynth.playCrash();
        setGameState("game_over");
        return;
      }

      // Generate Slalom Pylon Gates Procedurally
      const highestGate = Math.min(...state.gates.map((g) => g.y));
      if (highestGate > vehicle.y - 600) {
        const newY = highestGate - (180 + Math.random() * 100);
        const newX = 120 + Math.random() * 360;
        state.gates.push({
          x: newX,
          y: newY,
          width: 180,
          passed: false,
        });
      }

      // Gate Passing & Drift Particles
      state.gates.forEach((gate) => {
        if (!gate.passed && vehicle.y < gate.y + 10) {
          if (vehicle.x > gate.x && vehicle.x < gate.x + gate.width) {
            gate.passed = true;
            setScore((prev) => prev + 500);
          }
        }
      });

      // Spawn Drift Trail Sparks
      if (Math.random() > 0.3) {
        state.particles.push({
          x: vehicle.x - Math.cos(vehicle.angle) * 16,
          y: vehicle.y - Math.sin(vehicle.angle) * 16,
          vx: (Math.random() - 0.5) * 2,
          vy: (Math.random() - 0.5) * 2,
          life: 15,
          color: state.keys.boost ? "#38bdf8" : "#f59e0b",
        });
      }

      // --- RENDERING ---
      ctx.fillStyle = "#09090b";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.save();
      ctx.translate(0, -state.cameraY + 500);

      // Render Track Side Boundaries
      ctx.strokeStyle = "#38bdf8";
      ctx.lineWidth = 4;
      ctx.shadowColor = "#38bdf8";
      ctx.shadowBlur = 12;
      ctx.beginPath();
      ctx.moveTo(80, state.cameraY - 600);
      ctx.lineTo(80, state.cameraY + 600);
      ctx.moveTo(720, state.cameraY - 600);
      ctx.lineTo(720, state.cameraY + 600);
      ctx.stroke();
      ctx.shadowBlur = 0;

      // Draw Slalom Pylon Gates
      state.gates.forEach((gate) => {
        ctx.fillStyle = gate.passed ? "#10b981" : "#ef4444";
        ctx.shadowColor = ctx.fillStyle;
        ctx.shadowBlur = 14;
        ctx.fillRect(gate.x, gate.y, 16, 24);
        ctx.fillRect(gate.x + gate.width - 16, gate.y, 16, 24);

        // Beam energy line
        ctx.strokeStyle = gate.passed ? "rgba(16, 185, 129, 0.4)" : "rgba(239, 68, 68, 0.4)";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(gate.x + 16, gate.y + 12);
        ctx.lineTo(gate.x + gate.width - 16, gate.y + 12);
        ctx.stroke();
      });
      ctx.shadowBlur = 0;

      // Draw Drift Particles
      state.particles.forEach((p, idx) => {
        p.x += p.vx;
        p.y += p.vy;
        p.life--;
        ctx.fillStyle = p.color;
        ctx.fillRect(p.x, p.y, 3, 3);
        if (p.life <= 0) state.particles.splice(idx, 1);
      });

      // Draw Vehicle Core
      ctx.save();
      ctx.translate(vehicle.x, vehicle.y);
      ctx.rotate(vehicle.angle + Math.PI / 2);

      ctx.fillStyle = "#f59e0b";
      ctx.shadowColor = "#f59e0b";
      ctx.shadowBlur = 16;

      ctx.beginPath();
      ctx.moveTo(0, -18);
      ctx.lineTo(12, 14);
      ctx.lineTo(-12, 14);
      ctx.closePath();
      ctx.fill();

      ctx.restore();

      ctx.restore();

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [gameState, boostGauge]);

  return (
    <div className="relative w-full h-screen bg-[#06080e] text-white flex flex-col items-center justify-center font-sans overflow-hidden select-none">
      {/* Top Navigation */}
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
      <div className="relative w-full max-w-4xl aspect-[4/3] bg-[#090b14] rounded-3xl border border-amber-500/30 overflow-hidden shadow-[0_0_60px_rgba(245,158,11,0.15)] flex flex-col justify-center items-center">
        <canvas ref={canvasRef} width={800} height={600} className="w-full h-full object-contain" />

        {/* Dynamic HUD */}
        {gameState === "playing" && (
          <div className="absolute top-6 inset-x-6 z-20 flex justify-between items-start pointer-events-none">
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-black/60 border border-amber-500/40 text-amber-300 font-mono text-xs backdrop-blur-md">
                <Gauge className="w-3.5 h-3.5" /> SPEED: {speedMeter} KM/H
              </div>
              <div className="w-48 bg-black/60 border border-white/10 p-1.5 rounded-xl backdrop-blur-md">
                <div className="flex justify-between text-[10px] font-mono mb-1 text-white/70">
                  <span>NITRO BOOST</span>
                  <span>{Math.floor(boostGauge)}%</span>
                </div>
                <div className="w-full bg-white/10 h-2 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-amber-500 via-amber-400 to-cyan-400 transition-all duration-200"
                    style={{ width: `${boostGauge}%` }}
                  />
                </div>
              </div>
            </div>

            <div className="px-4 py-2 rounded-2xl bg-black/60 border border-amber-500/40 backdrop-blur-md text-right">
              <div className="text-[10px] font-mono text-amber-400/70 uppercase">DISTANCE / SCORE</div>
              <div className="text-2xl font-black font-mono text-amber-300">{score}</div>
            </div>
          </div>
        )}

        {/* Small Touch Controls */}
        {gameState === "playing" && isMobileScreen && (
          <div className="absolute bottom-6 inset-x-6 flex justify-between items-center z-30 pointer-events-auto">
            <div className="flex gap-2">
              <button
                onTouchStart={() => (engineRef.current.keys.left = true)}
                onTouchEnd={() => (engineRef.current.keys.left = false)}
                className="w-14 h-14 rounded-2xl bg-white/10 border border-white/20 active:bg-amber-500/30 flex items-center justify-center font-bold text-lg"
              >
                ←
              </button>
              <button
                onTouchStart={() => (engineRef.current.keys.right = true)}
                onTouchEnd={() => (engineRef.current.keys.right = false)}
                className="w-14 h-14 rounded-2xl bg-white/10 border border-white/20 active:bg-amber-500/30 flex items-center justify-center font-bold text-lg"
              >
                →
              </button>
            </div>
            <button
              onTouchStart={() => (engineRef.current.keys.boost = true)}
              onTouchEnd={() => (engineRef.current.keys.boost = false)}
              className="w-20 h-20 rounded-full bg-gradient-to-tr from-amber-500 to-cyan-500 border border-amber-300 active:scale-95 flex items-center justify-center font-black text-xs uppercase text-black shadow-lg"
            >
              BOOST
            </button>
          </div>
        )}

        {/* Menu Screen */}
        {gameState === "menu" && (
          <div className="absolute inset-0 z-40 bg-[#060812]/90 backdrop-blur-2xl flex flex-col items-center justify-center p-6 overflow-y-auto">
            <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-amber-600/20 rounded-full blur-[120px] pointer-events-none animate-pulse" />

            <motion.div
              initial={{ scale: 0.88, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              className="text-center max-w-2xl mb-8 z-10"
            >
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-black uppercase tracking-widest mb-4 shadow-[0_0_20px_rgba(245,158,11,0.2)]">
                <Zap className="w-4 h-4 text-amber-400 animate-bounce" /> Tactical Orbital Slalom Speedrun
              </div>

              <h1 className="text-7xl md:text-8xl font-black uppercase tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-yellow-300 to-cyan-400 drop-shadow-[0_0_40px_rgba(245,158,11,0.6)]">
                DRIFT
              </h1>
              <p className="text-base text-amber-100/70 mt-4 max-w-lg mx-auto leading-relaxed">
                Pilot a high-speed hovercraft down narrow neon slalom tracks, drift past pylon gates, and ignite nitro thrusters.
              </p>

              <div className="flex justify-center gap-3 mt-4">
                <span className="px-3 py-1 rounded-md bg-white/5 border border-white/10 text-[10px] font-mono text-amber-300">SPEEDRUN</span>
                <span className="px-3 py-1 rounded-md bg-white/5 border border-white/10 text-[10px] font-mono text-cyan-300">ONLINE LEADERBOARD</span>
                <span className="px-3 py-1 rounded-md bg-white/5 border border-white/10 text-[10px] font-mono text-emerald-300">TOUCH READY</span>
              </div>
            </motion.div>

            <button
              onClick={startGame}
              className="group px-10 py-5 rounded-3xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-black font-black text-xl uppercase tracking-wider shadow-[0_0_40px_rgba(245,158,11,0.4)] active:scale-95 transition-all z-10"
            >
              LAUNCH HOVERCRAFT
            </button>

            <div className="mt-8 z-10 flex flex-wrap items-center justify-center gap-6 text-xs text-white/50 bg-black/40 px-6 py-3 rounded-2xl border border-white/10">
              <div className="flex items-center gap-2">
                <span className="font-mono text-amber-300 bg-white/10 px-2 py-0.5 rounded border border-white/10 font-bold">WASD / ARROWS</span>
                <span>Steer & Drift</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-cyan-300 bg-white/10 px-2 py-0.5 rounded border border-white/10 font-bold">SPACE / SHIFT</span>
                <span>Nitro Boost</span>
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
              className="text-center max-w-md w-full bg-slate-900/90 border border-amber-500/40 p-8 rounded-3xl shadow-[0_0_50px_rgba(245,158,11,0.3)] relative overflow-hidden"
            >
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-bold uppercase tracking-wider mb-4">
                <Trophy className="w-3.5 h-3.5 text-amber-400" /> Slalom Run Finished
              </div>

              <h2 className="text-4xl font-black uppercase text-transparent bg-clip-text bg-gradient-to-r from-amber-300 to-yellow-300 mb-2">
                HOVERCRAFT CRASHED
              </h2>
              <p className="text-xs text-amber-200/60 mb-6">Slalom Speedrun Distance Results</p>

              <div className="p-4 rounded-2xl bg-white/5 border border-white/10 mb-6">
                <div className="text-[10px] text-white/40 font-black uppercase">FINAL SCORE / DISTANCE</div>
                <div className="text-3xl font-black text-amber-300">{score} M</div>
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
                  className="flex-1 py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-black font-black uppercase tracking-wider shadow-[0_0_20px_rgba(245,158,11,0.4)] active:scale-95 transition-all"
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
