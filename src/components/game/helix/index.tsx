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
  Activity,
} from "lucide-react";
import Link from "next/link";
import { db } from "@/lib/firebase";
import { collection, addDoc, query, orderBy, limit, onSnapshot } from "firebase/firestore";

// --- AUDIO SYNTHESIZER ---
class HelixAudioSynth {
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

  playAlignSound() {
    if (this.muted || !this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(523.25, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(1046.5, this.ctx.currentTime + 0.15);
    gain.gain.setValueAtTime(0.12, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.15);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.15);
  }

  playPulseSound() {
    if (this.muted || !this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = "triangle";
    osc.frequency.setValueAtTime(320, this.ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(640, this.ctx.currentTime + 0.2);
    gain.gain.setValueAtTime(0.15, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.2);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.2);
  }

  playOverload() {
    if (this.muted || !this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(160, this.ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(40, this.ctx.currentTime + 0.3);
    gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.3);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.3);
  }
}

const audioSynth = new HelixAudioSynth();

export type HelixMode = "dna_alignment" | "quantum_clash";

interface LeaderboardEntry {
  id: string;
  name: string;
  score: number;
}

interface SpiralNode {
  x: number;
  y: number;
  angle: number;
  radius: number;
  aligned: boolean;
  color: string;
}

export default function HelixGame() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [gameState, setGameState] = useState<"menu" | "playing" | "game_over">("menu");
  const [mode, setMode] = useState<HelixMode>("dna_alignment");
  const [scoreP1, setScoreP1] = useState(0);
  const [scoreP2, setScoreP2] = useState(0);
  const [energyLevel, setEnergyLevel] = useState(100);
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
    keys: { p1RotateLeft: false, p1RotateRight: false, p2RotateLeft: false, p2RotateRight: false, pulse: false },
    p1Angle: 0,
    p2Angle: Math.PI,
    helixNodes: [] as SpiralNode[],
    particles: [] as { x: number; y: number; vx: number; vy: number; life: number; color: string }[],
    rotationSpeed: 0.04,
    timer: 60,
  });

  useEffect(() => {
    try {
      const q = query(collection(db, "helix_leaderboard"), orderBy("score", "desc"), limit(5));
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
      await addDoc(collection(db, "helix_leaderboard"), {
        name: playerName.trim().substring(0, 12),
        score: scoreP1,
        createdAt: new Date(),
      });
    } catch (e) {
      console.warn("Score submission error:", e);
    }
  };

  const startGame = (selectedMode: HelixMode) => {
    audioSynth.init();
    setMode(selectedMode);
    setScoreP1(0);
    setScoreP2(0);
    setEnergyLevel(100);
    setWinnerName(null);

    const initialNodes: SpiralNode[] = [];
    for (let i = 0; i < 16; i++) {
      const angle = (i * Math.PI) / 8;
      const radius = 120 + (i % 3) * 35;
      initialNodes.push({
        x: 400 + Math.cos(angle) * radius,
        y: 300 + Math.sin(angle) * radius,
        angle: angle,
        radius: radius,
        aligned: false,
        color: i % 2 === 0 ? "#10b981" : "#06b6d4",
      });
    }

    engineRef.current = {
      keys: { p1RotateLeft: false, p1RotateRight: false, p2RotateLeft: false, p2RotateRight: false, pulse: false },
      p1Angle: 0,
      p2Angle: Math.PI,
      helixNodes: initialNodes,
      particles: [],
      rotationSpeed: 0.04,
      timer: 60,
    };

    setGameState("playing");
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (gameState !== "playing") return;
      if (e.key === "a" || e.key === "A") engineRef.current.keys.p1RotateLeft = true;
      if (e.key === "d" || e.key === "D") engineRef.current.keys.p1RotateRight = true;
      if (e.key === "ArrowLeft") engineRef.current.keys.p2RotateLeft = true;
      if (e.key === "ArrowRight") engineRef.current.keys.p2RotateRight = true;
      if (e.key === " ") engineRef.current.keys.pulse = true;
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === "a" || e.key === "A") engineRef.current.keys.p1RotateLeft = false;
      if (e.key === "d" || e.key === "D") engineRef.current.keys.p1RotateRight = false;
      if (e.key === "ArrowLeft") engineRef.current.keys.p2RotateLeft = false;
      if (e.key === "ArrowRight") engineRef.current.keys.p2RotateRight = false;
      if (e.key === " ") engineRef.current.keys.pulse = false;
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

      // P1 Rotation Controls
      if (state.keys.p1RotateLeft) state.p1Angle -= state.rotationSpeed;
      if (state.keys.p1RotateRight) state.p1Angle += state.rotationSpeed;

      // P2 Rotation Controls
      if (state.keys.p2RotateLeft) state.p2Angle -= state.rotationSpeed;
      if (state.keys.p2RotateRight) state.p2Angle += state.rotationSpeed;

      // Rotate Helix Spiral Nodes
      state.helixNodes.forEach((node) => {
        node.angle += 0.015;
        node.x = 400 + Math.cos(node.angle) * node.radius;
        node.y = 300 + Math.sin(node.angle) * node.radius;

        // Check P1 Alignment Angle
        const angleDiffP1 = Math.abs((state.p1Angle % (Math.PI * 2)) - (node.angle % (Math.PI * 2)));
        if (angleDiffP1 < 0.25 && !node.aligned) {
          node.aligned = true;
          audioSynth.playAlignSound();
          p1ScoreAccum += 150;
          setScoreP1(p1ScoreAccum);
          localEnergy = Math.min(100, localEnergy + 4);
          setEnergyLevel(Math.floor(localEnergy));
        }

        // Check P2 Alignment Angle (if 2P mode)
        if (mode === "quantum_clash") {
          const angleDiffP2 = Math.abs((state.p2Angle % (Math.PI * 2)) - (node.angle % (Math.PI * 2)));
          if (angleDiffP2 < 0.25 && !node.aligned) {
            node.aligned = true;
            audioSynth.playAlignSound();
            p2ScoreAccum += 150;
            setScoreP2(p2ScoreAccum);
          }
        }
      });

      // Reset aligned nodes periodically
      if (state.helixNodes.every((n) => n.aligned)) {
        state.helixNodes.forEach((n) => (n.aligned = false));
      }

      // Energy drain over time in single player
      if (mode === "dna_alignment") {
        localEnergy -= 0.08;
        setEnergyLevel(Math.max(0, Math.floor(localEnergy)));
        if (localEnergy <= 0) {
          audioSynth.playOverload();
          setGameState("game_over");
          return;
        }
      }

      // --- RENDERING ---
      ctx.fillStyle = "#021512";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Render Central Quantum Core
      ctx.beginPath();
      ctx.arc(400, 300, 45, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(16, 185, 129, 0.15)";
      ctx.shadowColor = "#10b981";
      ctx.shadowBlur = 30;
      ctx.fill();

      ctx.beginPath();
      ctx.arc(400, 300, 18, 0, Math.PI * 2);
      ctx.fillStyle = "#10b981";
      ctx.fill();
      ctx.shadowBlur = 0;

      // Render Helix Nodes
      state.helixNodes.forEach((node) => {
        ctx.beginPath();
        ctx.arc(node.x, node.y, node.aligned ? 10 : 6, 0, Math.PI * 2);
        ctx.fillStyle = node.aligned ? "#34d399" : node.color;
        ctx.shadowColor = ctx.fillStyle;
        ctx.shadowBlur = node.aligned ? 18 : 8;
        ctx.fill();

        // Connect lines to center
        ctx.strokeStyle = "rgba(16, 185, 129, 0.15)";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(400, 300);
        ctx.lineTo(node.x, node.y);
        ctx.stroke();
      });
      ctx.shadowBlur = 0;

      // Render Player 1 Beam Pointer
      const p1X = 400 + Math.cos(state.p1Angle) * 220;
      const p1Y = 300 + Math.sin(state.p1Angle) * 220;

      ctx.strokeStyle = "#10b981";
      ctx.lineWidth = 3;
      ctx.shadowColor = "#10b981";
      ctx.shadowBlur = 15;
      ctx.beginPath();
      ctx.moveTo(400, 300);
      ctx.lineTo(p1X, p1Y);
      ctx.stroke();
      ctx.shadowBlur = 0;

      // Render Player 2 Beam Pointer (in 2P mode)
      if (mode === "quantum_clash") {
        const p2X = 400 + Math.cos(state.p2Angle) * 220;
        const p2Y = 300 + Math.sin(state.p2Angle) * 220;

        ctx.strokeStyle = "#06b6d4";
        ctx.lineWidth = 3;
        ctx.shadowColor = "#06b6d4";
        ctx.shadowBlur = 15;
        ctx.beginPath();
        ctx.moveTo(400, 300);
        ctx.lineTo(p2X, p2Y);
        ctx.stroke();
        ctx.shadowBlur = 0;
      }

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [gameState, mode]);

  return (
    <div className="relative w-full h-screen bg-[#010e0c] text-white flex flex-col items-center justify-center font-sans overflow-hidden select-none">
      {/* Top Bar Navigation */}
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
      <div className="relative w-full max-w-4xl aspect-[4/3] bg-[#021814] rounded-3xl border border-emerald-500/30 overflow-hidden shadow-[0_0_60px_rgba(16,185,129,0.15)] flex flex-col justify-center items-center">
        <canvas ref={canvasRef} width={800} height={600} className="w-full h-full object-contain" />

        {/* Dynamic In-Game HUD */}
        {gameState === "playing" && (
          <div className="absolute top-6 inset-x-6 z-20 flex justify-between items-start pointer-events-none">
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-black/60 border border-emerald-500/40 text-emerald-300 font-mono text-xs backdrop-blur-md">
                <Activity className="w-3.5 h-3.5 text-emerald-400" /> P1 HELIX SCORE: {scoreP1}
              </div>
              {mode === "quantum_clash" && (
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-black/60 border border-cyan-500/40 text-cyan-300 font-mono text-xs backdrop-blur-md">
                  <Activity className="w-3.5 h-3.5 text-cyan-400" /> P2 HELIX SCORE: {scoreP2}
                </div>
              )}
              {mode === "dna_alignment" && (
                <div className="w-48 bg-black/60 border border-white/10 p-1.5 rounded-xl backdrop-blur-md">
                  <div className="flex justify-between text-[10px] font-mono mb-1 text-white/70">
                    <span>STABILITY ENERGY</span>
                    <span>{energyLevel}%</span>
                  </div>
                  <div className="w-full bg-white/10 h-2 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-400 transition-all duration-200"
                      style={{ width: `${energyLevel}%` }}
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="px-4 py-2 rounded-2xl bg-black/60 border border-emerald-500/40 backdrop-blur-md text-right">
              <div className="text-[10px] font-mono text-emerald-400/70 uppercase">ALIGNMENT STREAK</div>
              <div className="text-2xl font-black font-mono text-emerald-300">{scoreP1}</div>
            </div>
          </div>
        )}

        {/* Touch Controls Overlay for Small Mobile Screens */}
        {gameState === "playing" && isMobileScreen && (
          <div className="absolute bottom-6 inset-x-6 flex justify-between items-center z-30 pointer-events-auto">
            <div className="flex gap-2">
              <button
                onTouchStart={() => (engineRef.current.keys.p1RotateLeft = true)}
                onTouchEnd={() => (engineRef.current.keys.p1RotateLeft = false)}
                className="w-14 h-14 rounded-2xl bg-white/10 border border-white/20 active:bg-emerald-500/30 flex items-center justify-center font-bold text-lg"
              >
                ↺
              </button>
              <button
                onTouchStart={() => (engineRef.current.keys.p1RotateRight = true)}
                onTouchEnd={() => (engineRef.current.keys.p1RotateRight = false)}
                className="w-14 h-14 rounded-2xl bg-white/10 border border-white/20 active:bg-emerald-500/30 flex items-center justify-center font-bold text-lg"
              >
                ↻
              </button>
            </div>
            {mode === "quantum_clash" && (
              <div className="flex gap-2">
                <button
                  onTouchStart={() => (engineRef.current.keys.p2RotateLeft = true)}
                  onTouchEnd={() => (engineRef.current.keys.p2RotateLeft = false)}
                  className="w-14 h-14 rounded-2xl bg-cyan-500/20 border border-cyan-400/30 active:bg-cyan-500/50 flex items-center justify-center font-bold text-lg text-cyan-300"
                >
                  ↺ P2
                </button>
                <button
                  onTouchStart={() => (engineRef.current.keys.p2RotateRight = true)}
                  onTouchEnd={() => (engineRef.current.keys.p2RotateRight = false)}
                  className="w-14 h-14 rounded-2xl bg-cyan-500/20 border border-cyan-400/30 active:bg-cyan-500/50 flex items-center justify-center font-bold text-lg text-cyan-300"
                >
                  ↻ P2
                </button>
              </div>
            )}
          </div>
        )}

        {/* Menu Screen Overlay */}
        {gameState === "menu" && (
          <div className="absolute inset-0 z-40 bg-[#011410]/90 backdrop-blur-2xl flex flex-col items-center justify-center p-6 overflow-y-auto">
            <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-emerald-600/20 rounded-full blur-[120px] pointer-events-none animate-pulse" />

            <motion.div
              initial={{ scale: 0.88, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              className="text-center max-w-2xl mb-8 z-10"
            >
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-black uppercase tracking-widest mb-4 shadow-[0_0_20px_rgba(16,185,129,0.2)]">
                <Zap className="w-4 h-4 text-emerald-400 animate-bounce" /> Quantum Light Alignment Protocol
              </div>

              <h1 className="text-7xl md:text-8xl font-black uppercase tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-emerald-300 via-teal-300 to-cyan-400 drop-shadow-[0_0_40px_rgba(16,185,129,0.6)]">
                HELIX
              </h1>
              <p className="text-base text-emerald-100/70 mt-4 max-w-lg mx-auto leading-relaxed">
                Rotate quantum light alignment beams to match revolving spiral DNA nodes and prevent total energy decay.
              </p>

              <div className="flex justify-center gap-3 mt-4">
                <span className="px-3 py-1 rounded-md bg-white/5 border border-white/10 text-[10px] font-mono text-emerald-300">1P / 2P MODES</span>
                <span className="px-3 py-1 rounded-md bg-white/5 border border-white/10 text-[10px] font-mono text-cyan-300">ONLINE LEADERBOARD</span>
                <span className="px-3 py-1 rounded-md bg-white/5 border border-white/10 text-[10px] font-mono text-teal-300">TOUCH READY</span>
              </div>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-xl w-full z-10">
              <button
                onClick={() => startGame("dna_alignment")}
                className="group relative p-6 rounded-3xl bg-white/5 border border-emerald-500/30 hover:border-emerald-400 hover:bg-emerald-500/10 flex flex-col items-center gap-3 transition-all duration-300 text-center backdrop-blur-md shadow-lg hover:shadow-[0_0_30px_rgba(16,185,129,0.3)] active:scale-95"
              >
                <User className="w-8 h-8 text-emerald-400 group-hover:scale-110 transition-transform" />
                <div>
                  <div className="font-black text-xl uppercase tracking-wider text-white">DNA ALIGNMENT</div>
                  <div className="text-xs text-emerald-200/60 mt-1">Single player quantum spiral balance</div>
                </div>
              </button>

              <button
                onClick={() => startGame("quantum_clash")}
                className="group relative p-6 rounded-3xl bg-white/5 border border-cyan-500/30 hover:border-cyan-400 hover:bg-cyan-500/10 flex flex-col items-center gap-3 transition-all duration-300 text-center backdrop-blur-md shadow-lg hover:shadow-[0_0_30px_rgba(6,182,212,0.3)] active:scale-95"
              >
                <Users className="w-8 h-8 text-cyan-400 group-hover:scale-110 transition-transform" />
                <div>
                  <div className="font-black text-xl uppercase tracking-wider text-white">QUANTUM CLASH</div>
                  <div className="text-xs text-cyan-200/60 mt-1">2-Player competitive spiral duel</div>
                </div>
              </button>
            </div>

            <div className="mt-8 z-10 flex flex-wrap items-center justify-center gap-6 text-xs text-white/50 bg-black/40 px-6 py-3 rounded-2xl border border-white/10">
              <div className="flex items-center gap-2">
                <span className="font-mono text-emerald-300 bg-white/10 px-2 py-0.5 rounded border border-white/10 font-bold">A / D</span>
                <span>P1 Rotate Beam</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-cyan-300 bg-white/10 px-2 py-0.5 rounded border border-white/10 font-bold">LEFT / RIGHT</span>
                <span>P2 Rotate Beam</span>
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
              className="text-center max-w-md w-full bg-slate-900/90 border border-emerald-500/40 p-8 rounded-3xl shadow-[0_0_50px_rgba(16,185,129,0.3)] relative overflow-hidden"
            >
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-bold uppercase tracking-wider mb-4">
                <Trophy className="w-3.5 h-3.5 text-emerald-400" /> Quantum Alignment Finished
              </div>

              <h2 className="text-4xl font-black uppercase text-transparent bg-clip-text bg-gradient-to-r from-emerald-300 to-teal-300 mb-2">
                {winnerName ? `${winnerName} VICTORY!` : "ENERGY DECAYED"}
              </h2>
              <p className="text-xs text-emerald-200/60 mb-6">Helix Quantum Spiral Results</p>

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
                  className="flex-1 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-black font-black uppercase tracking-wider shadow-[0_0_20px_rgba(16,185,129,0.4)] active:scale-95 transition-all"
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
