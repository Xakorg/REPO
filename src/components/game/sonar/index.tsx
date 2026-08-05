"use client";

import React, { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import {
  Trophy,
  Volume2,
  VolumeX,
  ArrowLeft,
  Radio,
  Zap,
  Users,
  User,
} from "lucide-react";
import Link from "next/link";
import { db } from "@/lib/firebase";
import { collection, addDoc, query, orderBy, limit, onSnapshot } from "firebase/firestore";

// --- AUDIO SYNTHESIZER ---
class SonarAudioSynth {
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

  playSonarPing() {
    if (this.muted || !this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(800, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(1600, this.ctx.currentTime + 0.25);
    gain.gain.setValueAtTime(0.15, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.25);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.25);
  }

  playEchoDetect() {
    if (this.muted || !this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = "triangle";
    osc.frequency.setValueAtTime(440, this.ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(880, this.ctx.currentTime + 0.15);
    gain.gain.setValueAtTime(0.1, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.15);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.15);
  }

  playImpactSound() {
    if (this.muted || !this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = "sawtooth";
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

const audioSynth = new SonarAudioSynth();

export type SonarMode = "abyssal_echolocation" | "echo_maze_duel";

interface LeaderboardEntry {
  id: string;
  name: string;
  score: number;
}

interface SonarPulseWave {
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  alpha: number;
}

interface Submarine {
  x: number;
  y: number;
  vx: number;
  vy: number;
  angle: number;
  radius: number;
}

export default function SonarGame() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [gameState, setGameState] = useState<"menu" | "playing" | "game_over">("menu");
  const [mode, setMode] = useState<SonarMode>("abyssal_echolocation");
  const [scoreP1, setScoreP1] = useState(0);
  const [scoreP2, setScoreP2] = useState(0);
  const [sonarEnergy, setSonarEnergy] = useState(100);
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
    keys: { p1Up: false, p1Down: false, p1Left: false, p1Right: false, p1Ping: false, p2Up: false, p2Down: false, p2Left: false, p2Right: false },
    subP1: { x: 150, y: 300, vx: 0, vy: 0, angle: 0, radius: 14 } as Submarine,
    subP2: { x: 650, y: 300, vx: 0, vy: 0, angle: Math.PI, radius: 14 } as Submarine,
    pulses: [] as SonarPulseWave[],
    artifacts: [] as { x: number; y: number; found: boolean }[],
  });

  useEffect(() => {
    try {
      const q = query(collection(db, "sonar_leaderboard"), orderBy("score", "desc"), limit(5));
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
      await addDoc(collection(db, "sonar_leaderboard"), {
        name: playerName.trim().substring(0, 12),
        score: scoreP1,
        createdAt: new Date(),
      });
    } catch (e) {
      console.warn("Score submission error:", e);
    }
  };

  const triggerSonarPing = (sub: Submarine) => {
    audioSynth.playSonarPing();
    engineRef.current.pulses.push({
      x: sub.x,
      y: sub.y,
      radius: 5,
      maxRadius: 220,
      alpha: 1.0,
    });
  };

  const startGame = (selectedMode: SonarMode) => {
    audioSynth.init();
    setMode(selectedMode);
    setScoreP1(0);
    setScoreP2(0);
    setSonarEnergy(100);
    setWinnerName(null);

    const initialArtifacts = [
      { x: 400, y: 150, found: false },
      { x: 300, y: 450, found: false },
      { x: 550, y: 350, found: false },
    ];

    engineRef.current = {
      keys: { p1Up: false, p1Down: false, p1Left: false, p1Right: false, p1Ping: false, p2Up: false, p2Down: false, p2Left: false, p2Right: false },
      subP1: { x: 150, y: 300, vx: 0, vy: 0, angle: 0, radius: 14 },
      subP2: { x: 650, y: 300, vx: 0, vy: 0, angle: Math.PI, radius: 14 },
      pulses: [],
      artifacts: initialArtifacts,
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
      if (e.key === " ") triggerSonarPing(engineRef.current.subP1);
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
      const sub1 = state.subP1;
      const sub2 = state.subP2;

      // P1 Submarine Thrusters
      if (state.keys.p1Up) sub1.vy -= 0.25;
      if (state.keys.p1Down) sub1.vy += 0.25;
      if (state.keys.p1Left) sub1.vx -= 0.25;
      if (state.keys.p1Right) sub1.vx += 0.25;

      sub1.vx *= 0.96;
      sub1.vy *= 0.96;
      sub1.x += sub1.vx;
      sub1.y += sub1.vy;
      sub1.x = Math.max(20, Math.min(780, sub1.x));
      sub1.y = Math.max(20, Math.min(580, sub1.y));

      // P2 Submarine Thrusters (if 2P mode)
      if (mode === "echo_maze_duel") {
        if (state.keys.p2Up) sub2.vy -= 0.25;
        if (state.keys.p2Down) sub2.vy += 0.25;
        if (state.keys.p2Left) sub2.vx -= 0.25;
        if (state.keys.p2Right) sub2.vx += 0.25;

        sub2.vx *= 0.96;
        sub2.vy *= 0.96;
        sub2.x += sub2.vx;
        sub2.y += sub2.vy;
        sub2.x = Math.max(20, Math.min(780, sub2.x));
        sub2.y = Math.max(20, Math.min(580, sub2.y));
      }

      // Expand Sonar Pulse Waves
      state.pulses.forEach((pulse) => {
        pulse.radius += 4;
        pulse.alpha = Math.max(0, 1 - pulse.radius / pulse.maxRadius);
      });
      state.pulses = state.pulses.filter((p) => p.alpha > 0);

      // Check Submarine Artifact Discovery
      state.artifacts.forEach((art) => {
        if (!art.found) {
          const dx1 = art.x - sub1.x;
          const dy1 = art.y - sub1.y;
          if (Math.sqrt(dx1 * dx1 + dy1 * dy1) < 28) {
            art.found = true;
            audioSynth.playEchoDetect();
            p1ScoreAccum += 300;
            setScoreP1(p1ScoreAccum);
            localEnergy = Math.min(100, localEnergy + 20);
          }

          if (mode === "echo_maze_duel") {
            const dx2 = art.x - sub2.x;
            const dy2 = art.y - sub2.y;
            if (Math.sqrt(dx2 * dx2 + dy2 * dy2) < 28) {
              art.found = true;
              audioSynth.playEchoDetect();
              p2ScoreAccum += 300;
              setScoreP2(p2ScoreAccum);
            }
          }
        }
      });

      // Respawn Submarine Artifacts
      if (state.artifacts.every((a) => a.found)) {
        state.artifacts.forEach((a) => {
          a.found = false;
          a.x = 100 + Math.random() * 600;
          a.y = 100 + Math.random() * 400;
        });
      }

      // Passive Energy Drain
      if (mode === "abyssal_echolocation") {
        localEnergy -= 0.05;
        setSonarEnergy(Math.max(0, Math.floor(localEnergy)));
        if (localEnergy <= 0) {
          audioSynth.playImpactSound();
          setGameState("game_over");
          return;
        }
      }

      // --- RENDERING ---
      ctx.fillStyle = "#010810";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw Sonar Pulse Waves
      state.pulses.forEach((pulse) => {
        ctx.strokeStyle = `rgba(14, 165, 233, ${pulse.alpha})`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(pulse.x, pulse.y, pulse.radius, 0, Math.PI * 2);
        ctx.stroke();
      });

      // Draw Echolocation Artifacts (only revealed near pulses)
      state.artifacts.forEach((art) => {
        if (!art.found) {
          const isRevealed = state.pulses.some((p) => {
            const dx = art.x - p.x;
            const dy = art.y - p.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            return Math.abs(dist - p.radius) < 25;
          });

          if (isRevealed) {
            ctx.beginPath();
            ctx.arc(art.x, art.y, 10, 0, Math.PI * 2);
            ctx.fillStyle = "#38bdf8";
            ctx.shadowColor = "#38bdf8";
            ctx.shadowBlur = 18;
            ctx.fill();
          }
        }
      });
      ctx.shadowBlur = 0;

      // Render Player 1 Submarine
      ctx.beginPath();
      ctx.arc(sub1.x, sub1.y, sub1.radius, 0, Math.PI * 2);
      ctx.fillStyle = "#0284c7";
      ctx.shadowColor = "#0284c7";
      ctx.shadowBlur = 18;
      ctx.fill();
      ctx.shadowBlur = 0;

      // Render Player 2 Submarine (if 2P mode)
      if (mode === "echo_maze_duel") {
        ctx.beginPath();
        ctx.arc(sub2.x, sub2.y, sub2.radius, 0, Math.PI * 2);
        ctx.fillStyle = "#38bdf8";
        ctx.shadowColor = "#38bdf8";
        ctx.shadowBlur = 18;
        ctx.fill();
        ctx.shadowBlur = 0;
      }

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [gameState, mode]);

  return (
    <div className="relative w-full h-screen bg-[#01060c] text-white flex flex-col items-center justify-center font-sans overflow-hidden select-none">
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
            {muted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-sky-400" />}
          </button>
        </div>
      </div>

      {/* Main Canvas Area */}
      <div className="relative w-full max-w-4xl aspect-[4/3] bg-[#020e1a] rounded-3xl border border-sky-500/30 overflow-hidden shadow-[0_0_60px_rgba(14,165,233,0.15)] flex flex-col justify-center items-center">
        <canvas ref={canvasRef} width={800} height={600} className="w-full h-full object-contain" />

        {/* Dynamic HUD */}
        {gameState === "playing" && (
          <div className="absolute top-6 inset-x-6 z-20 flex justify-between items-start pointer-events-none">
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-black/60 border border-sky-500/40 text-sky-300 font-mono text-xs backdrop-blur-md">
                <Radio className="w-3.5 h-3.5 text-sky-400" /> P1 SONAR SCORE: {scoreP1}
              </div>
              {mode === "echo_maze_duel" && (
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-black/60 border border-cyan-500/40 text-cyan-300 font-mono text-xs backdrop-blur-md">
                  <Radio className="w-3.5 h-3.5 text-cyan-400" /> P2 SONAR SCORE: {scoreP2}
                </div>
              )}
              {mode === "abyssal_echolocation" && (
                <div className="w-48 bg-black/60 border border-white/10 p-1.5 rounded-xl backdrop-blur-md">
                  <div className="flex justify-between text-[10px] font-mono mb-1 text-white/70">
                    <span>BATTERY ENERGY</span>
                    <span>{sonarEnergy}%</span>
                  </div>
                  <div className="w-full bg-white/10 h-2 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-sky-500 via-cyan-400 to-teal-400 transition-all duration-200"
                      style={{ width: `${sonarEnergy}%` }}
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="px-4 py-2 rounded-2xl bg-black/60 border border-sky-500/40 backdrop-blur-md text-right">
              <div className="text-[10px] font-mono text-sky-400/70 uppercase">PULSE REVEALS</div>
              <div className="text-2xl font-black font-mono text-sky-300">{scoreP1}</div>
            </div>
          </div>
        )}

        {/* Touch Controls Overlay */}
        {gameState === "playing" && isMobileScreen && (
          <div className="absolute bottom-6 inset-x-6 flex justify-between items-center z-30 pointer-events-auto">
            <div className="grid grid-cols-3 gap-2 w-36">
              <div />
              <button
                onTouchStart={() => (engineRef.current.keys.p1Up = true)}
                onTouchEnd={() => (engineRef.current.keys.p1Up = false)}
                className="w-11 h-11 rounded-xl bg-white/10 border border-white/20 active:bg-sky-500/30 flex items-center justify-center font-bold"
              >
                ↑
              </button>
              <div />
              <button
                onTouchStart={() => (engineRef.current.keys.p1Left = true)}
                onTouchEnd={() => (engineRef.current.keys.p1Left = false)}
                className="w-11 h-11 rounded-xl bg-white/10 border border-white/20 active:bg-sky-500/30 flex items-center justify-center font-bold"
              >
                ←
              </button>
              <button
                onTouchStart={() => (engineRef.current.keys.p1Down = true)}
                onTouchEnd={() => (engineRef.current.keys.p1Down = false)}
                className="w-11 h-11 rounded-xl bg-white/10 border border-white/20 active:bg-sky-500/30 flex items-center justify-center font-bold"
              >
                ↓
              </button>
              <button
                onTouchStart={() => (engineRef.current.keys.p1Right = true)}
                onTouchEnd={() => (engineRef.current.keys.p1Right = false)}
                className="w-11 h-11 rounded-xl bg-white/10 border border-white/20 active:bg-sky-500/30 flex items-center justify-center font-bold"
              >
                →
              </button>
            </div>
            <button
              onClick={() => triggerSonarPing(engineRef.current.subP1)}
              className="w-20 h-20 rounded-full bg-gradient-to-tr from-sky-500 to-cyan-500 border border-sky-300 active:scale-95 flex items-center justify-center font-black text-xs uppercase text-black shadow-lg"
            >
              PING
            </button>
          </div>
        )}

        {/* Menu Overlay */}
        {gameState === "menu" && (
          <div className="absolute inset-0 z-40 bg-[#010912]/90 backdrop-blur-2xl flex flex-col items-center justify-center p-6 overflow-y-auto">
            <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-sky-600/20 rounded-full blur-[120px] pointer-events-none animate-pulse" />

            <motion.div
              initial={{ scale: 0.88, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              className="text-center max-w-2xl mb-8 z-10"
            >
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-sky-500/10 border border-sky-500/30 text-sky-300 text-xs font-black uppercase tracking-widest mb-4 shadow-[0_0_20px_rgba(14,165,233,0.2)]">
                <Zap className="w-4 h-4 text-sky-400 animate-bounce" /> Deep Abyssal Echolocation Pulse
              </div>

              <h1 className="text-7xl md:text-8xl font-black uppercase tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-sky-300 via-cyan-300 to-teal-400 drop-shadow-[0_0_40px_rgba(14,165,233,0.6)]">
                SONAR
              </h1>
              <p className="text-base text-sky-100/70 mt-4 max-w-lg mx-auto leading-relaxed">
                Emit active sonar echo pings to navigate pitch-black subterranean trenches and retrieve submerged relics.
              </p>

              <div className="flex justify-center gap-3 mt-4">
                <span className="px-3 py-1 rounded-md bg-white/5 border border-white/10 text-[10px] font-mono text-sky-300">1P / 2P MODES</span>
                <span className="px-3 py-1 rounded-md bg-white/5 border border-white/10 text-[10px] font-mono text-cyan-300">ONLINE LEADERBOARD</span>
                <span className="px-3 py-1 rounded-md bg-white/5 border border-white/10 text-[10px] font-mono text-teal-300">TOUCH READY</span>
              </div>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-xl w-full z-10">
              <button
                onClick={() => startGame("abyssal_echolocation")}
                className="group relative p-6 rounded-3xl bg-white/5 border border-sky-500/30 hover:border-sky-400 hover:bg-sky-500/10 flex flex-col items-center gap-3 transition-all duration-300 text-center backdrop-blur-md shadow-lg hover:shadow-[0_0_30px_rgba(14,165,233,0.3)] active:scale-95"
              >
                <User className="w-8 h-8 text-sky-400 group-hover:scale-110 transition-transform" />
                <div>
                  <div className="font-black text-xl uppercase tracking-wider text-white">ECHOLOCATION</div>
                  <div className="text-xs text-sky-200/60 mt-1">Single player subterranean sonar hunt</div>
                </div>
              </button>

              <button
                onClick={() => startGame("echo_maze_duel")}
                className="group relative p-6 rounded-3xl bg-white/5 border border-cyan-500/30 hover:border-cyan-400 hover:bg-cyan-500/10 flex flex-col items-center gap-3 transition-all duration-300 text-center backdrop-blur-md shadow-lg hover:shadow-[0_0_30px_rgba(6,182,212,0.3)] active:scale-95"
              >
                <Users className="w-8 h-8 text-cyan-400 group-hover:scale-110 transition-transform" />
                <div>
                  <div className="font-black text-xl uppercase tracking-wider text-white">ECHO DUEL</div>
                  <div className="text-xs text-cyan-200/60 mt-1">2-Player abyssal submarine race</div>
                </div>
              </button>
            </div>

            <div className="mt-8 z-10 flex flex-wrap items-center justify-center gap-6 text-xs text-white/50 bg-black/40 px-6 py-3 rounded-2xl border border-white/10">
              <div className="flex items-center gap-2">
                <span className="font-mono text-sky-300 bg-white/10 px-2 py-0.5 rounded border border-white/10 font-bold">WASD</span>
                <span>Submarine Thrusters</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-cyan-300 bg-white/10 px-2 py-0.5 rounded border border-white/10 font-bold">SPACE</span>
                <span>Sonar Echo Ping</span>
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
              className="text-center max-w-md w-full bg-slate-900/90 border border-sky-500/40 p-8 rounded-3xl shadow-[0_0_50px_rgba(14,165,233,0.3)] relative overflow-hidden"
            >
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-500/10 border border-sky-500/30 text-sky-300 text-xs font-bold uppercase tracking-wider mb-4">
                <Trophy className="w-3.5 h-3.5 text-sky-400" /> Submarine Mission Concluded
              </div>

              <h2 className="text-4xl font-black uppercase text-transparent bg-clip-text bg-gradient-to-r from-sky-300 to-cyan-300 mb-2">
                {winnerName ? `${winnerName} VICTORIOUS!` : "BATTERY DRAINED"}
              </h2>
              <p className="text-xs text-sky-200/60 mb-6">Sonar Echolocation Results</p>

              <div className="p-4 rounded-2xl bg-white/5 border border-white/10 mb-6">
                <div className="text-[10px] text-white/40 font-black uppercase">FINAL SCORE</div>
                <div className="text-3xl font-black text-sky-300">{scoreP1}</div>
              </div>

              <div className="mb-6 flex gap-2">
                <input
                  type="text"
                  placeholder="Enter Player Name"
                  value={playerName}
                  onChange={(e) => setPlayerName(e.target.value)}
                  className="flex-1 px-4 py-3 rounded-xl bg-black/60 border border-white/10 text-white text-xs focus:outline-none focus:border-sky-400"
                />
                <button
                  onClick={saveScore}
                  className="px-4 py-3 rounded-xl bg-sky-500 text-black font-bold text-xs uppercase"
                >
                  SAVE
                </button>
              </div>

              <div className="flex gap-4">
                <button
                  onClick={() => startGame(mode)}
                  className="flex-1 py-3.5 rounded-2xl bg-gradient-to-r from-sky-500 to-cyan-500 hover:from-sky-400 hover:to-cyan-400 text-black font-black uppercase tracking-wider shadow-[0_0_20px_rgba(14,165,233,0.4)] active:scale-95 transition-all"
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
