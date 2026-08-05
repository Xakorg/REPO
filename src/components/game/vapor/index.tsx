"use client";

import React, { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import {
  Trophy,
  Volume2,
  VolumeX,
  ArrowLeft,
  Wind,
  Zap,
  Users,
  User,
} from "lucide-react";
import Link from "next/link";
import { db } from "@/lib/firebase";
import { collection, addDoc, query, orderBy, limit, onSnapshot } from "firebase/firestore";

// --- AUDIO SYNTHESIZER ---
class VaporAudioSynth {
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

  playPhaseShift() {
    if (this.muted || !this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(600, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(1200, this.ctx.currentTime + 0.18);
    gain.gain.setValueAtTime(0.12, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.18);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.18);
  }

  playOrbCollect() {
    if (this.muted || !this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = "triangle";
    osc.frequency.setValueAtTime(450, this.ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(900, this.ctx.currentTime + 0.15);
    gain.gain.setValueAtTime(0.1, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.15);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.15);
  }

  playThermalDisruption() {
    if (this.muted || !this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(130, this.ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(35, this.ctx.currentTime + 0.25);
    gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.25);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.25);
  }
}

const audioSynth = new VaporAudioSynth();

export type VaporMode = "thermal_phase_runner" | "vapor_duel";

interface LeaderboardEntry {
  id: string;
  name: string;
  score: number;
}

interface ThermalObstacle {
  x: number;
  y: number;
  width: number;
  height: number;
  requiredState: "gas" | "liquid";
  passed: boolean;
}

export default function VaporGame() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [gameState, setGameState] = useState<"menu" | "playing" | "game_over">("menu");
  const [mode, setMode] = useState<VaporMode>("thermal_phase_runner");
  const [scoreP1, setScoreP1] = useState(0);
  const [scoreP2, setScoreP2] = useState(0);
  const [vaporTemperature, setVaporTemperature] = useState(50);
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
    keys: { p1Left: false, p1Right: false, p1ShiftState: false, p2Left: false, p2Right: false, p2ShiftState: false },
    runnerP1: { x: 400, y: 480, state: "gas" as "gas" | "liquid", width: 22, height: 32 },
    runnerP2: { x: 550, y: 480, state: "liquid" as "gas" | "liquid", width: 22, height: 32 },
    obstacles: [] as ThermalObstacle[],
    speed: 5.0,
  });

  useEffect(() => {
    try {
      const q = query(collection(db, "vapor_leaderboard"), orderBy("score", "desc"), limit(5));
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
      await addDoc(collection(db, "vapor_leaderboard"), {
        name: playerName.trim().substring(0, 12),
        score: scoreP1,
        createdAt: new Date(),
      });
    } catch (e) {
      console.warn("Score submission error:", e);
    }
  };

  const toggleP1Phase = () => {
    const runner = engineRef.current.runnerP1;
    runner.state = runner.state === "gas" ? "liquid" : "gas";
    audioSynth.playPhaseShift();
  };

  const startGame = (selectedMode: VaporMode) => {
    audioSynth.init();
    setMode(selectedMode);
    setScoreP1(0);
    setScoreP2(0);
    setVaporTemperature(50);
    setWinnerName(null);

    const initialObstacles: ThermalObstacle[] = [
      { x: 200, y: -100, width: 140, height: 20, requiredState: "gas", passed: false },
      { x: 400, y: -300, width: 140, height: 20, requiredState: "liquid", passed: false },
    ];

    engineRef.current = {
      keys: { p1Left: false, p1Right: false, p1ShiftState: false, p2Left: false, p2Right: false, p2ShiftState: false },
      runnerP1: { x: mode === "vapor_duel" ? 250 : 400, y: 480, state: "gas", width: 22, height: 32 },
      runnerP2: { x: 550, y: 480, state: "liquid", width: 22, height: 32 },
      obstacles: initialObstacles,
      speed: 5.0,
    };

    setGameState("playing");
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (gameState !== "playing") return;
      if (e.key === "a" || e.key === "A") engineRef.current.keys.p1Left = true;
      if (e.key === "d" || e.key === "D") engineRef.current.keys.p1Right = true;
      if (e.key === " ") toggleP1Phase();
      if (e.key === "ArrowLeft") engineRef.current.keys.p2Left = true;
      if (e.key === "ArrowRight") engineRef.current.keys.p2Right = true;
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === "a" || e.key === "A") engineRef.current.keys.p1Left = false;
      if (e.key === "d" || e.key === "D") engineRef.current.keys.p1Right = false;
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

    const loop = () => {
      const state = engineRef.current;
      const r1 = state.runnerP1;
      const r2 = state.runnerP2;

      // P1 Navigation
      if (state.keys.p1Left) r1.x -= 6;
      if (state.keys.p1Right) r1.x += 6;
      r1.x = Math.max(60, Math.min(740, r1.x));

      // P2 Navigation (if 2P mode)
      if (mode === "vapor_duel") {
        if (state.keys.p2Left) r2.x -= 6;
        if (state.keys.p2Right) r2.x += 6;
        r2.x = Math.max(60, Math.min(740, r2.x));
      }

      // Update Thermal Obstacles
      state.obstacles.forEach((obs) => {
        obs.y += state.speed;

        if (!obs.passed && obs.y > r1.y) {
          obs.passed = true;
          p1ScoreAccum += 120;
          setScoreP1(p1ScoreAccum);
        }

        // P1 Collision & Thermal State Check
        if (
          r1.x > obs.x &&
          r1.x < obs.x + obs.width &&
          r1.y > obs.y &&
          r1.y < obs.y + obs.height
        ) {
          if (r1.state !== obs.requiredState) {
            audioSynth.playThermalDisruption();
            if (mode === "vapor_duel") setWinnerName("PLAYER 2");
            setGameState("game_over");
            return;
          }
        }
      });

      // Spawn Procedural Obstacles
      const highestObsY = Math.min(...state.obstacles.map((o) => o.y));
      if (highestObsY > -100) {
        state.obstacles.push({
          x: 60 + Math.random() * 600,
          y: highestObsY - 160,
          width: 130 + Math.random() * 40,
          height: 20,
          requiredState: Math.random() > 0.5 ? "gas" : "liquid",
          passed: false,
        });
      }

      // --- RENDERING ---
      ctx.fillStyle = "#010d14";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw Obstacles
      state.obstacles.forEach((obs) => {
        ctx.fillStyle = obs.requiredState === "gas" ? "#38bdf8" : "#34d399";
        ctx.shadowColor = ctx.fillStyle;
        ctx.shadowBlur = 12;
        ctx.fillRect(obs.x, obs.y, obs.width, obs.height);
      });
      ctx.shadowBlur = 0;

      // Draw Player 1 Runner
      ctx.beginPath();
      ctx.arc(r1.x, r1.y, 12, 0, Math.PI * 2);
      ctx.fillStyle = r1.state === "gas" ? "rgba(56, 189, 248, 0.8)" : "#34d399";
      ctx.shadowColor = ctx.fillStyle;
      ctx.shadowBlur = 20;
      ctx.fill();
      ctx.shadowBlur = 0;

      // Draw Player 2 Runner (if 2P mode)
      if (mode === "vapor_duel") {
        ctx.beginPath();
        ctx.arc(r2.x, r2.y, 12, 0, Math.PI * 2);
        ctx.fillStyle = r2.state === "gas" ? "rgba(56, 189, 248, 0.8)" : "#06b6d4";
        ctx.shadowColor = ctx.fillStyle;
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
    <div className="relative w-full h-screen bg-[#010a0f] text-white flex flex-col items-center justify-center font-sans overflow-hidden select-none">
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
            {muted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-cyan-400" />}
          </button>
        </div>
      </div>

      {/* Main Canvas Area */}
      <div className="relative w-full max-w-4xl aspect-[4/3] bg-[#021520] rounded-3xl border border-cyan-500/30 overflow-hidden shadow-[0_0_60px_rgba(6,182,212,0.15)] flex flex-col justify-center items-center">
        <canvas ref={canvasRef} width={800} height={600} className="w-full h-full object-contain" />

        {/* Dynamic HUD */}
        {gameState === "playing" && (
          <div className="absolute top-6 inset-x-6 z-20 flex justify-between items-start pointer-events-none">
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-black/60 border border-cyan-500/40 text-cyan-300 font-mono text-xs backdrop-blur-md">
                <Wind className="w-3.5 h-3.5 text-cyan-400" /> P1 VAPOR SCORE: {scoreP1}
              </div>
              {mode === "vapor_duel" && (
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-black/60 border border-teal-500/40 text-teal-300 font-mono text-xs backdrop-blur-md">
                  <Wind className="w-3.5 h-3.5 text-teal-400" /> P2 VAPOR SCORE: {scoreP2}
                </div>
              )}
            </div>

            <div className="px-4 py-2 rounded-2xl bg-black/60 border border-cyan-500/40 backdrop-blur-md text-right">
              <div className="text-[10px] font-mono text-cyan-400/70 uppercase">CURRENT STATE</div>
              <div className="text-2xl font-black font-mono text-cyan-300 uppercase">
                {engineRef.current.runnerP1.state}
              </div>
            </div>
          </div>
        )}

        {/* Touch Controls Overlay */}
        {gameState === "playing" && isMobileScreen && (
          <div className="absolute bottom-6 inset-x-6 flex justify-between items-center z-30 pointer-events-auto">
            <div className="flex gap-2">
              <button
                onTouchStart={() => (engineRef.current.keys.p1Left = true)}
                onTouchEnd={() => (engineRef.current.keys.p1Left = false)}
                className="w-14 h-14 rounded-2xl bg-white/10 border border-white/20 active:bg-cyan-500/30 flex items-center justify-center font-bold text-lg"
              >
                ←
              </button>
              <button
                onTouchStart={() => (engineRef.current.keys.p1Right = true)}
                onTouchEnd={() => (engineRef.current.keys.p1Right = false)}
                className="w-14 h-14 rounded-2xl bg-white/10 border border-white/20 active:bg-cyan-500/30 flex items-center justify-center font-bold text-lg"
              >
                →
              </button>
            </div>
            <button
              onClick={toggleP1Phase}
              className="w-20 h-20 rounded-full bg-gradient-to-tr from-cyan-500 to-teal-500 border border-cyan-300 active:scale-95 flex items-center justify-center font-black text-xs uppercase text-black shadow-lg"
            >
              PHASE
            </button>
          </div>
        )}

        {/* Menu Overlay */}
        {gameState === "menu" && (
          <div className="absolute inset-0 z-40 bg-[#01101a]/90 backdrop-blur-2xl flex flex-col items-center justify-center p-6 overflow-y-auto">
            <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-cyan-600/20 rounded-full blur-[120px] pointer-events-none animate-pulse" />

            <motion.div
              initial={{ scale: 0.88, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              className="text-center max-w-2xl mb-8 z-10"
            >
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs font-black uppercase tracking-widest mb-4 shadow-[0_0_20px_rgba(6,182,212,0.2)]">
                <Zap className="w-4 h-4 text-cyan-400 animate-bounce" /> Condensation Vapor Thermal Phase Shift
              </div>

              <h1 className="text-7xl md:text-8xl font-black uppercase tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-teal-300 to-emerald-400 drop-shadow-[0_0_40px_rgba(6,182,212,0.6)]">
                VAPOR
              </h1>
              <p className="text-base text-cyan-100/70 mt-4 max-w-lg mx-auto leading-relaxed">
                Toggle thermal phase state between Gas vapor and Liquid condensate to pass matching energy barriers.
              </p>

              <div className="flex justify-center gap-3 mt-4">
                <span className="px-3 py-1 rounded-md bg-white/5 border border-white/10 text-[10px] font-mono text-cyan-300">1P / 2P MODES</span>
                <span className="px-3 py-1 rounded-md bg-white/5 border border-white/10 text-[10px] font-mono text-teal-300">ONLINE LEADERBOARD</span>
                <span className="px-3 py-1 rounded-md bg-white/5 border border-white/10 text-[10px] font-mono text-emerald-300">TOUCH READY</span>
              </div>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-xl w-full z-10">
              <button
                onClick={() => startGame("thermal_phase_runner")}
                className="group relative p-6 rounded-3xl bg-white/5 border border-cyan-500/30 hover:border-cyan-400 hover:bg-cyan-500/10 flex flex-col items-center gap-3 transition-all duration-300 text-center backdrop-blur-md shadow-lg hover:shadow-[0_0_30px_rgba(6,182,212,0.3)] active:scale-95"
              >
                <User className="w-8 h-8 text-cyan-400 group-hover:scale-110 transition-transform" />
                <div>
                  <div className="font-black text-xl uppercase tracking-wider text-white">PHASE RUNNER</div>
                  <div className="text-xs text-cyan-200/60 mt-1">Single player thermal state obstacle run</div>
                </div>
              </button>

              <button
                onClick={() => startGame("vapor_duel")}
                className="group relative p-6 rounded-3xl bg-white/5 border border-teal-500/30 hover:border-teal-400 hover:bg-teal-500/10 flex flex-col items-center gap-3 transition-all duration-300 text-center backdrop-blur-md shadow-lg hover:shadow-[0_0_30px_rgba(20,184,166,0.3)] active:scale-95"
              >
                <Users className="w-8 h-8 text-teal-400 group-hover:scale-110 transition-transform" />
                <div>
                  <div className="font-black text-xl uppercase tracking-wider text-white">VAPOR DUEL</div>
                  <div className="text-xs text-teal-200/60 mt-1">2-Player side-by-side phase race</div>
                </div>
              </button>
            </div>

            <div className="mt-8 z-10 flex flex-wrap items-center justify-center gap-6 text-xs text-white/50 bg-black/40 px-6 py-3 rounded-2xl border border-white/10">
              <div className="flex items-center gap-2">
                <span className="font-mono text-cyan-300 bg-white/10 px-2 py-0.5 rounded border border-white/10 font-bold">A / D</span>
                <span>Steer Vapor</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-teal-300 bg-white/10 px-2 py-0.5 rounded border border-white/10 font-bold">SPACE</span>
                <span>Toggle Gas / Liquid</span>
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
              className="text-center max-w-md w-full bg-slate-900/90 border border-cyan-500/40 p-8 rounded-3xl shadow-[0_0_50px_rgba(6,182,212,0.3)] relative overflow-hidden"
            >
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs font-bold uppercase tracking-wider mb-4">
                <Trophy className="w-3.5 h-3.5 text-cyan-400" /> Vapor Phase Run Finished
              </div>

              <h2 className="text-4xl font-black uppercase text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 to-teal-300 mb-2">
                {winnerName ? `${winnerName} VICTORIOUS!` : "THERMAL DISRUPTION"}
              </h2>
              <p className="text-xs text-cyan-200/60 mb-6">Thermal State Distance Results</p>

              <div className="p-4 rounded-2xl bg-white/5 border border-white/10 mb-6">
                <div className="text-[10px] text-white/40 font-black uppercase">FINAL SCORE</div>
                <div className="text-3xl font-black text-cyan-300">{scoreP1}</div>
              </div>

              <div className="mb-6 flex gap-2">
                <input
                  type="text"
                  placeholder="Enter Player Name"
                  value={playerName}
                  onChange={(e) => setPlayerName(e.target.value)}
                  className="flex-1 px-4 py-3 rounded-xl bg-black/60 border border-white/10 text-white text-xs focus:outline-none focus:border-cyan-400"
                />
                <button
                  onClick={saveScore}
                  className="px-4 py-3 rounded-xl bg-cyan-500 text-black font-bold text-xs uppercase"
                >
                  SAVE
                </button>
              </div>

              <div className="flex gap-4">
                <button
                  onClick={() => startGame(mode)}
                  className="flex-1 py-3.5 rounded-2xl bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-400 hover:to-teal-400 text-black font-black uppercase tracking-wider shadow-[0_0_20px_rgba(6,182,212,0.4)] active:scale-95 transition-all"
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
