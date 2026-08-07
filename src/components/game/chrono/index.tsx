"use client";

import React, { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import {
  Trophy,
  Volume2,
  VolumeX,
  ArrowLeft,
  Clock,
  Zap,
  Users,
  User,
} from "lucide-react";
import Link from "next/link";
import { db } from "@/lib/firebase";
import { collection, addDoc, query, orderBy, limit, onSnapshot } from "firebase/firestore";

// --- AUDIO SYNTHESIZER ---
class ChronoAudioSynth {
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

  playTimeWarp() {
    if (this.muted || !this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(600, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(150, this.ctx.currentTime + 0.3);
    gain.gain.setValueAtTime(0.15, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.3);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.3);
  }

  playOrbCollect() {
    if (this.muted || !this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(440, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(880, this.ctx.currentTime + 0.15);
    gain.gain.setValueAtTime(0.1, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.15);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.15);
  }

  playCollision() {
    if (this.muted || !this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = "square";
    osc.frequency.setValueAtTime(120, this.ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(30, this.ctx.currentTime + 0.25);
    gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.25);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.25);
  }
}

const audioSynth = new ChronoAudioSynth();

export type ChronoMode = "time_warp_speedrun" | "temporal_echo_duel";

interface LeaderboardEntry {
  id: string;
  name: string;
  score: number;
}

interface TemporalBarrier {
  x: number;
  y: number;
  width: number;
  height: number;
  vy: number;
  passed: boolean;
}

interface ChronoOrb {
  x: number;
  y: number;
  radius: number;
  collected: boolean;
}

export default function ChronoGame() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [gameState, setGameState] = useState<"menu" | "playing" | "game_over">("menu");
  const [mode, setMode] = useState<ChronoMode>("time_warp_speedrun");
  const [scoreP1, setScoreP1] = useState(0);
  const [scoreP2, setScoreP2] = useState(0);
  const [timeDilationGauge, setTimeDilationGauge] = useState(100);
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
    keys: { p1Left: false, p1Right: false, p1Dilation: false, p2Left: false, p2Right: false },
    runnerP1: { x: 250, y: 500, vx: 0, width: 24, height: 36 },
    runnerP2: { x: 550, y: 500, vx: 0, width: 24, height: 36 },
    barriers: [] as TemporalBarrier[],
    orbs: [] as ChronoOrb[],
    gameSpeed: 5.0,
    timeDilated: false,
  });

  useEffect(() => {
    try {
      const q = query(collection(db, "chrono_leaderboard"), orderBy("score", "desc"), limit(5));
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
      await addDoc(collection(db, "chrono_leaderboard"), {
        name: playerName.trim().substring(0, 12),
        score: scoreP1,
        createdAt: new Date(),
      });
    } catch (e) {
      console.warn("Score submission error:", e);
    }
  };

  const startGame = (selectedMode: ChronoMode) => {
    audioSynth.init();
    setMode(selectedMode);
    setScoreP1(0);
    setScoreP2(0);
    setTimeDilationGauge(100);
    setWinnerName(null);

    const initialBarriers: TemporalBarrier[] = [
      { x: 100, y: -100, width: 140, height: 20, vy: 5, passed: false },
      { x: 300, y: -300, width: 160, height: 20, vy: 5, passed: false },
    ];

    const initialOrbs: ChronoOrb[] = [
      { x: 200, y: -200, radius: 10, collected: false },
      { x: 400, y: -450, radius: 10, collected: false },
    ];

    engineRef.current = {
      keys: { p1Left: false, p1Right: false, p1Dilation: false, p2Left: false, p2Right: false },
      runnerP1: { x: mode === "temporal_echo_duel" ? 200 : 400, y: 500, vx: 0, width: 24, height: 36 },
      runnerP2: { x: 600, y: 500, vx: 0, width: 24, height: 36 },
      barriers: initialBarriers,
      orbs: initialOrbs,
      gameSpeed: 5.0,
      timeDilated: false,
    };

    setGameState("playing");
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (gameState !== "playing") return;
      if (e.key === "a" || e.key === "A") engineRef.current.keys.p1Left = true;
      if (e.key === "d" || e.key === "D") engineRef.current.keys.p1Right = true;
      if (e.key === "Shift" || e.key === " ") engineRef.current.keys.p1Dilation = true;
      if (e.key === "ArrowLeft") engineRef.current.keys.p2Left = true;
      if (e.key === "ArrowRight") engineRef.current.keys.p2Right = true;
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === "a" || e.key === "A") engineRef.current.keys.p1Left = false;
      if (e.key === "d" || e.key === "D") engineRef.current.keys.p1Right = false;
      if (e.key === "Shift" || e.key === " ") engineRef.current.keys.p1Dilation = false;
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
      const runnerP1 = state.runnerP1;
      const runnerP2 = state.runnerP2;

      // Time Dilation Mechanism
      if (state.keys.p1Dilation && timeDilationGauge > 0) {
        state.timeDilated = true;
        state.gameSpeed = 2.0;
        setTimeDilationGauge((prev) => Math.max(0, prev - 0.7));
        audioSynth.playTimeWarp();
      } else {
        state.timeDilated = false;
        state.gameSpeed = 5.5;
        setTimeDilationGauge((prev) => Math.min(100, prev + 0.15));
      }

      // P1 Runner Movement
      if (state.keys.p1Left) runnerP1.x -= 6;
      if (state.keys.p1Right) runnerP1.x += 6;

      const minP1X = mode === "temporal_echo_duel" ? 40 : 80;
      const maxP1X = mode === "temporal_echo_duel" ? 360 : 720;
      runnerP1.x = Math.max(minP1X, Math.min(maxP1X, runnerP1.x));

      // P2 Runner Movement (if 2P mode)
      if (mode === "temporal_echo_duel") {
        if (state.keys.p2Left) runnerP2.x -= 6;
        if (state.keys.p2Right) runnerP2.x += 6;
        runnerP2.x = Math.max(440, Math.min(760, runnerP2.x));
      }

      // Update Barriers & Check Collisions
      state.barriers.forEach((b) => {
        b.y += state.gameSpeed;

        if (!b.passed && b.y > runnerP1.y) {
          b.passed = true;
          p1ScoreAccum += 100;
          if (mode === "temporal_echo_duel") p2ScoreAccum += 100;
          setScoreP1(p1ScoreAccum);
          setScoreP2(p2ScoreAccum);
        }

        // P1 Collision Test
        if (
          runnerP1.x > b.x &&
          runnerP1.x < b.x + b.width &&
          runnerP1.y > b.y &&
          runnerP1.y < b.y + b.height
        ) {
          audioSynth.playCollision();
          if (mode === "temporal_echo_duel") setWinnerName("PLAYER 2");
          setGameState("game_over");
          return;
        }

        // P2 Collision Test (if 2P mode)
        if (
          mode === "temporal_echo_duel" &&
          runnerP2.x > b.x &&
          runnerP2.x < b.x + b.width &&
          runnerP2.y > b.y &&
          runnerP2.y < b.y + b.height
        ) {
          audioSynth.playCollision();
          setWinnerName("PLAYER 1");
          setGameState("game_over");
          return;
        }
      });

      // Procedurally Spawn New Temporal Barriers
      const highestBarrierY = Math.min(...state.barriers.map((b) => b.y));
      if (highestBarrierY > -100) {
        if (mode === "temporal_echo_duel") {
          state.barriers.push({
            x: 40 + Math.random() * 200,
            y: highestBarrierY - 180,
            width: 100,
            height: 18,
            vy: 5,
            passed: false,
          });
          state.barriers.push({
            x: 440 + Math.random() * 200,
            y: highestBarrierY - 180,
            width: 100,
            height: 18,
            vy: 5,
            passed: false,
          });
        } else {
          state.barriers.push({
            x: 80 + Math.random() * 450,
            y: highestBarrierY - 160,
            width: 180,
            height: 20,
            vy: 5,
            passed: false,
          });
        }
      }

      // Collect Orbs
      state.orbs.forEach((orb) => {
        orb.y += state.gameSpeed;
        if (!orb.collected) {
          const dx = orb.x - runnerP1.x;
          const dy = orb.y - runnerP1.y;
          if (Math.sqrt(dx * dx + dy * dy) < runnerP1.width + orb.radius) {
            orb.collected = true;
            audioSynth.playOrbCollect();
            p1ScoreAccum += 250;
            setScoreP1(p1ScoreAccum);
          }
        }
      });

      // --- RENDERING ---
      ctx.fillStyle = state.timeDilated ? "#060919" : "#030612";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Track Divider (if 2P mode)
      if (mode === "temporal_echo_duel") {
        ctx.strokeStyle = "rgba(147, 51, 234, 0.4)";
        ctx.lineWidth = 4;
        ctx.setLineDash([12, 12]);
        ctx.beginPath();
        ctx.moveTo(400, 0);
        ctx.lineTo(400, 600);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      // Draw Temporal Barriers
      state.barriers.forEach((b) => {
        ctx.fillStyle = "#a855f7";
        ctx.shadowColor = "#a855f7";
        ctx.shadowBlur = 12;
        ctx.fillRect(b.x, b.y, b.width, b.height);
      });
      ctx.shadowBlur = 0;

      // Draw Chrono Orbs
      state.orbs.forEach((orb) => {
        if (!orb.collected) {
          ctx.beginPath();
          ctx.arc(orb.x, orb.y, orb.radius, 0, Math.PI * 2);
          ctx.fillStyle = "#38bdf8";
          ctx.shadowColor = "#38bdf8";
          ctx.shadowBlur = 14;
          ctx.fill();
        }
      });
      ctx.shadowBlur = 0;

      // Draw Player 1 Runner
      ctx.fillStyle = "#c084fc";
      ctx.shadowColor = "#c084fc";
      ctx.shadowBlur = 16;
      ctx.fillRect(runnerP1.x - runnerP1.width / 2, runnerP1.y - runnerP1.height / 2, runnerP1.width, runnerP1.height);

      // Draw Player 2 Runner (if 2P mode)
      if (mode === "temporal_echo_duel") {
        ctx.fillStyle = "#38bdf8";
        ctx.shadowColor = "#38bdf8";
        ctx.shadowBlur = 16;
        ctx.fillRect(runnerP2.x - runnerP2.width / 2, runnerP2.y - runnerP2.height / 2, runnerP2.width, runnerP2.height);
      }
      ctx.shadowBlur = 0;

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [gameState, mode, timeDilationGauge]);

  return (
    <div className="relative w-full h-screen bg-[#03050e] text-white flex flex-col items-center justify-center font-sans overflow-hidden select-none">
      {/* Top Bar Header */}
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
            {muted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-purple-400" />}
          </button>
        </div>
      </div>

      {/* Main Canvas Area */}
      <div className="relative w-full max-w-4xl aspect-[4/3] bg-[#050818] rounded-3xl border border-purple-500/30 overflow-hidden shadow-[0_0_60px_rgba(168,85,247,0.15)] flex flex-col justify-center items-center">
        <canvas ref={canvasRef} width={800} height={600} className="w-full h-full object-contain" />

        {/* Dynamic HUD */}
        {gameState === "playing" && (
          <div className="absolute top-6 inset-x-6 z-20 flex justify-between items-start pointer-events-none">
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-black/60 border border-purple-500/40 text-purple-300 font-mono text-xs backdrop-blur-md">
                <Clock className="w-3.5 h-3.5 text-purple-400" /> P1 TIME SCORE: {scoreP1}
              </div>
              {mode === "temporal_echo_duel" && (
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-black/60 border border-cyan-500/40 text-cyan-300 font-mono text-xs backdrop-blur-md">
                  <Clock className="w-3.5 h-3.5 text-cyan-400" /> P2 TIME SCORE: {scoreP2}
                </div>
              )}
              {mode === "time_warp_speedrun" && (
                <div className="w-48 bg-black/60 border border-white/10 p-1.5 rounded-xl backdrop-blur-md">
                  <div className="flex justify-between text-[10px] font-mono mb-1 text-white/70">
                    <span>TIME DILATION</span>
                    <span>{Math.floor(timeDilationGauge)}%</span>
                  </div>
                  <div className="w-full bg-white/10 h-2 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-purple-500 via-pink-400 to-cyan-400 transition-all duration-200"
                      style={{ width: `${timeDilationGauge}%` }}
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="px-4 py-2 rounded-2xl bg-black/60 border border-purple-500/40 backdrop-blur-md text-right">
              <div className="text-[10px] font-mono text-purple-400/70 uppercase">TEMPORAL DISTANCE</div>
              <div className="text-2xl font-black font-mono text-purple-300">{scoreP1}</div>
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
                className="w-14 h-14 rounded-2xl bg-white/10 border border-white/20 active:bg-purple-500/30 flex items-center justify-center font-bold text-lg"
              >
                ←
              </button>
              <button
                onTouchStart={() => (engineRef.current.keys.p1Right = true)}
                onTouchEnd={() => (engineRef.current.keys.p1Right = false)}
                className="w-14 h-14 rounded-2xl bg-white/10 border border-white/20 active:bg-purple-500/30 flex items-center justify-center font-bold text-lg"
              >
                →
              </button>
            </div>
            {mode === "time_warp_speedrun" && (
              <button
                onTouchStart={() => (engineRef.current.keys.p1Dilation = true)}
                onTouchEnd={() => (engineRef.current.keys.p1Dilation = false)}
                className="w-20 h-20 rounded-full bg-gradient-to-tr from-purple-500 to-pink-500 border border-purple-300 active:scale-95 flex items-center justify-center font-black text-xs uppercase text-black shadow-lg"
              >
                SLOW
              </button>
            )}
          </div>
        )}

        {/* Menu Overlay */}
        {gameState === "menu" && (
          <div className="absolute inset-0 z-40 bg-[#070314]/90 backdrop-blur-2xl flex flex-col items-center justify-center p-6 overflow-y-auto">
            <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-purple-600/20 rounded-full blur-[120px] pointer-events-none animate-pulse" />

            <motion.div
              initial={{ scale: 0.88, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              className="text-center max-w-2xl mb-8 z-10"
            >
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-purple-500/10 border border-purple-500/30 text-purple-300 text-xs font-black uppercase tracking-widest mb-4 shadow-[0_0_20px_rgba(168,85,247,0.2)]">
                <Zap className="w-4 h-4 text-purple-400 animate-bounce" /> Time-Warp Velocity Obstacle Runner
              </div>

              <h1 className="text-7xl md:text-8xl font-black uppercase tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-300 to-cyan-400 drop-shadow-[0_0_40px_rgba(168,85,247,0.6)]">
                CHRONO
              </h1>
              <p className="text-base text-purple-100/70 mt-4 max-w-lg mx-auto leading-relaxed">
                Dodge temporal barriers at warp velocity and dilate time to maneuver past impossible obstacle patterns.
              </p>

              <div className="flex justify-center gap-3 mt-4">
                <span className="px-3 py-1 rounded-md bg-white/5 border border-white/10 text-[10px] font-mono text-purple-300">1P / 2P MODES</span>
                <span className="px-3 py-1 rounded-md bg-white/5 border border-white/10 text-[10px] font-mono text-pink-300">ONLINE LEADERBOARD</span>
                <span className="px-3 py-1 rounded-md bg-white/5 border border-white/10 text-[10px] font-mono text-cyan-300">TOUCH READY</span>
              </div>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-xl w-full z-10">
              <button
                onClick={() => startGame("time_warp_speedrun")}
                className="group relative p-6 rounded-3xl bg-white/5 border border-purple-500/30 hover:border-purple-400 hover:bg-purple-500/10 flex flex-col items-center gap-3 transition-all duration-300 text-center backdrop-blur-md shadow-lg hover:shadow-[0_0_30px_rgba(168,85,247,0.3)] active:scale-95"
              >
                <User className="w-8 h-8 text-purple-400 group-hover:scale-110 transition-transform" />
                <div>
                  <div className="font-black text-xl uppercase tracking-wider text-white">TIME WARP</div>
                  <div className="text-xs text-purple-200/60 mt-1">Single player time-dilation speedrun</div>
                </div>
              </button>

              <button
                onClick={() => startGame("temporal_echo_duel")}
                className="group relative p-6 rounded-3xl bg-white/5 border border-cyan-500/30 hover:border-cyan-400 hover:bg-cyan-500/10 flex flex-col items-center gap-3 transition-all duration-300 text-center backdrop-blur-md shadow-lg hover:shadow-[0_0_30px_rgba(6,182,212,0.3)] active:scale-95"
              >
                <Users className="w-8 h-8 text-cyan-400 group-hover:scale-110 transition-transform" />
                <div>
                  <div className="font-black text-xl uppercase tracking-wider text-white">TEMPORAL ECHO</div>
                  <div className="text-xs text-cyan-200/60 mt-1">2-Player side-by-side warp race</div>
                </div>
              </button>
            </div>

            <div className="mt-8 z-10 flex flex-wrap items-center justify-center gap-6 text-xs text-white/50 bg-black/40 px-6 py-3 rounded-2xl border border-white/10">
              <div className="flex items-center gap-2">
                <span className="font-mono text-purple-300 bg-white/10 px-2 py-0.5 rounded border border-white/10 font-bold">A / D</span>
                <span>Steer Runner</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-pink-300 bg-white/10 px-2 py-0.5 rounded border border-white/10 font-bold">SHIFT / SPACE</span>
                <span>Time Dilation</span>
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
              className="text-center max-w-md w-full bg-slate-900/90 border border-purple-500/40 p-8 rounded-3xl shadow-[0_0_50px_rgba(168,85,247,0.3)] relative overflow-hidden"
            >
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/30 text-purple-300 text-xs font-bold uppercase tracking-wider mb-4">
                <Trophy className="w-3.5 h-3.5 text-purple-400" /> Temporal Run Finished
              </div>

              <h2 className="text-4xl font-black uppercase text-transparent bg-clip-text bg-gradient-to-r from-purple-300 to-pink-300 mb-2">
                {winnerName ? `${winnerName} WINS!` : "TIMELINE COLLAPSED"}
              </h2>
              <p className="text-xs text-purple-200/60 mb-6">Temporal Warp Distance Results</p>

              <div className="p-4 rounded-2xl bg-white/5 border border-white/10 mb-6">
                <div className="text-[10px] text-white/40 font-black uppercase">FINAL TEMPORAL SCORE</div>
                <div className="text-3xl font-black text-purple-300">{scoreP1}</div>
              </div>

              <div className="mb-6 flex gap-2">
                <input
                  type="text"
                  placeholder="Enter Player Name"
                  value={playerName}
                  onChange={(e) => setPlayerName(e.target.value)}
                  className="flex-1 px-4 py-3 rounded-xl bg-black/60 border border-white/10 text-white text-xs focus:outline-none focus:border-purple-400"
                />
                <button
                  onClick={saveScore}
                  className="px-4 py-3 rounded-xl bg-purple-500 text-black font-bold text-xs uppercase"
                >
                  SAVE
                </button>
              </div>

              <div className="flex gap-4">
                <button
                  onClick={() => startGame(mode)}
                  className="flex-1 py-3.5 rounded-2xl bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-400 hover:to-pink-400 text-black font-black uppercase tracking-wider shadow-[0_0_20px_rgba(168,85,247,0.4)] active:scale-95 transition-all"
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
