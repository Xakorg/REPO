"use client";

import React, { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import {
  Trophy,
  Volume2,
  VolumeX,
  ArrowLeft,
  Grid,
  Zap,
  Users,
  User,
} from "lucide-react";
import Link from "next/link";
import { db } from "@/lib/firebase";
import { collection, addDoc, query, orderBy, limit, onSnapshot } from "firebase/firestore";

// --- AUDIO SYNTHESIZER ---
class MatrixAudioSynth {
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

  playNodePulse() {
    if (this.muted || !this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(500, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(1000, this.ctx.currentTime + 0.15);
    gain.gain.setValueAtTime(0.12, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.15);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.15);
  }

  playLinkConnect() {
    if (this.muted || !this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = "triangle";
    osc.frequency.setValueAtTime(600, this.ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(1200, this.ctx.currentTime + 0.2);
    gain.gain.setValueAtTime(0.15, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.2);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.2);
  }

  playGridOverload() {
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

const audioSynth = new MatrixAudioSynth();

export type MatrixMode = "neural_alignment" | "grid_defense_duel";

interface LeaderboardEntry {
  id: string;
  name: string;
  score: number;
}

interface MatrixNode {
  id: number;
  x: number;
  y: number;
  active: boolean;
  color: string;
}

export default function MatrixGame() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [gameState, setGameState] = useState<"menu" | "playing" | "game_over">("menu");
  const [mode, setMode] = useState<MatrixMode>("neural_alignment");
  const [scoreP1, setScoreP1] = useState(0);
  const [scoreP2, setScoreP2] = useState(0);
  const [matrixStability, setMatrixStability] = useState(100);
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
    keys: { p1Up: false, p1Down: false, p1Left: false, p1Right: false, p1Activate: false, p2Up: false, p2Down: false, p2Left: false, p2Right: false },
    cursorP1: { x: 400, y: 300, vx: 0, vy: 0, radius: 12 },
    cursorP2: { x: 500, y: 300, vx: 0, vy: 0, radius: 12 },
    nodes: [] as MatrixNode[],
    connections: [] as { from: number; to: number }[],
  });

  useEffect(() => {
    try {
      const q = query(collection(db, "matrix_leaderboard"), orderBy("score", "desc"), limit(5));
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
      await addDoc(collection(db, "matrix_leaderboard"), {
        name: playerName.trim().substring(0, 12),
        score: scoreP1,
        createdAt: new Date(),
      });
    } catch (e) {
      console.warn("Score submission error:", e);
    }
  };

  const activateNearestNode = () => {
    const state = engineRef.current;
    const cur = state.cursorP1;
    let closestNode: MatrixNode | null = null;
    let minDistance = 50;

    state.nodes.forEach((n) => {
      const dx = n.x - cur.x;
      const dy = n.y - cur.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < minDistance) {
        minDistance = dist;
        closestNode = n;
      }
    });

    if (closestNode) {
      (closestNode as MatrixNode).active = !(closestNode as MatrixNode).active;
      audioSynth.playNodePulse();
    }
  };

  const startGame = (selectedMode: MatrixMode) => {
    audioSynth.init();
    setMode(selectedMode);
    setScoreP1(0);
    setScoreP2(0);
    setMatrixStability(100);
    setWinnerName(null);

    const initialNodes: MatrixNode[] = [];
    let id = 0;
    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 5; c++) {
        initialNodes.push({
          id: id++,
          x: 160 + c * 120,
          y: 150 + r * 100,
          active: false,
          color: "#34d399",
        });
      }
    }

    engineRef.current = {
      keys: { p1Up: false, p1Down: false, p1Left: false, p1Right: false, p1Activate: false, p2Up: false, p2Down: false, p2Left: false, p2Right: false },
      cursorP1: { x: 400, y: 300, vx: 0, vy: 0, radius: 12 },
      cursorP2: { x: 500, y: 300, vx: 0, vy: 0, radius: 12 },
      nodes: initialNodes,
      connections: [],
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
      if (e.key === " ") activateNearestNode();
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
    let localStability = 100;

    const loop = () => {
      const state = engineRef.current;
      const cur1 = state.cursorP1;
      const cur2 = state.cursorP2;

      // Cursor P1
      if (state.keys.p1Up) cur1.vy -= 0.4;
      if (state.keys.p1Down) cur1.vy += 0.4;
      if (state.keys.p1Left) cur1.vx -= 0.4;
      if (state.keys.p1Right) cur1.vx += 0.4;

      cur1.vx *= 0.9;
      cur1.vy *= 0.9;
      cur1.x += cur1.vx;
      cur1.y += cur1.vy;
      cur1.x = Math.max(20, Math.min(780, cur1.x));
      cur1.y = Math.max(20, Math.min(580, cur1.y));

      // Cursor P2 (if 2P mode)
      if (mode === "grid_defense_duel") {
        if (state.keys.p2Up) cur2.vy -= 0.4;
        if (state.keys.p2Down) cur2.vy += 0.4;
        if (state.keys.p2Left) cur2.vx -= 0.4;
        if (state.keys.p2Right) cur2.vx += 0.4;

        cur2.vx *= 0.9;
        cur2.vy *= 0.9;
        cur2.x += cur2.vx;
        cur2.y += cur2.vy;
        cur2.x = Math.max(20, Math.min(780, cur2.x));
        cur2.y = Math.max(20, Math.min(580, cur2.y));
      }

      // Check Active Node Connections
      const activeNodes = state.nodes.filter((n) => n.active);
      p1ScoreAccum = activeNodes.length * 50;
      setScoreP1(p1ScoreAccum);

      // Stability Drain
      if (mode === "neural_alignment") {
        localStability -= 0.04;
        setMatrixStability(Math.max(0, Math.floor(localStability)));
        if (localStability <= 0) {
          audioSynth.playGridOverload();
          setGameState("game_over");
          return;
        }
      }

      // --- RENDERING ---
      ctx.fillStyle = "#020b12";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Render Grid Lines between active nodes
      ctx.strokeStyle = "#10b981";
      ctx.lineWidth = 2;
      for (let i = 0; i < activeNodes.length; i++) {
        for (let j = i + 1; j < activeNodes.length; j++) {
          const n1 = activeNodes[i];
          const n2 = activeNodes[j];
          const dist = Math.sqrt((n1.x - n2.x) ** 2 + (n1.y - n2.y) ** 2);
          if (dist < 180) {
            ctx.beginPath();
            ctx.moveTo(n1.x, n1.y);
            ctx.lineTo(n2.x, n2.y);
            ctx.stroke();
          }
        }
      }

      // Render Matrix Nodes
      state.nodes.forEach((n) => {
        ctx.beginPath();
        ctx.arc(n.x, n.y, 14, 0, Math.PI * 2);
        ctx.fillStyle = n.active ? "#34d399" : "#1e293b";
        ctx.shadowColor = n.active ? "#34d399" : "transparent";
        ctx.shadowBlur = n.active ? 16 : 0;
        ctx.fill();
        ctx.strokeStyle = "#059669";
        ctx.lineWidth = 2;
        ctx.stroke();
      });
      ctx.shadowBlur = 0;

      // Render Cursor P1
      ctx.beginPath();
      ctx.arc(cur1.x, cur1.y, cur1.radius, 0, Math.PI * 2);
      ctx.fillStyle = "#10b981";
      ctx.shadowColor = "#10b981";
      ctx.shadowBlur = 16;
      ctx.fill();
      ctx.shadowBlur = 0;

      // Render Cursor P2 (if 2P mode)
      if (mode === "grid_defense_duel") {
        ctx.beginPath();
        ctx.arc(cur2.x, cur2.y, cur2.radius, 0, Math.PI * 2);
        ctx.fillStyle = "#06b6d4";
        ctx.shadowColor = "#06b6d4";
        ctx.shadowBlur = 16;
        ctx.fill();
        ctx.shadowBlur = 0;
      }

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [gameState, mode]);

  return (
    <div className="relative w-full h-screen bg-[#01080e] text-white flex flex-col items-center justify-center font-sans overflow-hidden select-none">
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
      <div className="relative w-full max-w-4xl aspect-[4/3] bg-[#021320] rounded-3xl border border-emerald-500/30 overflow-hidden shadow-[0_0_60px_rgba(16,185,129,0.15)] flex flex-col justify-center items-center">
        <canvas ref={canvasRef} width={800} height={600} className="w-full h-full object-contain" />

        {/* Dynamic HUD */}
        {gameState === "playing" && (
          <div className="absolute top-6 inset-x-6 z-20 flex justify-between items-start pointer-events-none">
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-black/60 border border-emerald-500/40 text-emerald-300 font-mono text-xs backdrop-blur-md">
                <Grid className="w-3.5 h-3.5 text-emerald-400" /> P1 MATRIX SCORE: {scoreP1}
              </div>
              {mode === "grid_defense_duel" && (
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-black/60 border border-cyan-500/40 text-cyan-300 font-mono text-xs backdrop-blur-md">
                  <Grid className="w-3.5 h-3.5 text-cyan-400" /> P2 MATRIX SCORE: {scoreP2}
                </div>
              )}
              {mode === "neural_alignment" && (
                <div className="w-48 bg-black/60 border border-white/10 p-1.5 rounded-xl backdrop-blur-md">
                  <div className="flex justify-between text-[10px] font-mono mb-1 text-white/70">
                    <span>MATRIX STABILITY</span>
                    <span>{matrixStability}%</span>
                  </div>
                  <div className="w-full bg-white/10 h-2 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-400 transition-all duration-200"
                      style={{ width: `${matrixStability}%` }}
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="px-4 py-2 rounded-2xl bg-black/60 border border-emerald-500/40 backdrop-blur-md text-right">
              <div className="text-[10px] font-mono text-emerald-400/70 uppercase">NODES ACTIVE</div>
              <div className="text-2xl font-black font-mono text-emerald-300">{scoreP1 / 50}</div>
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
            <button
              onClick={activateNearestNode}
              className="w-20 h-20 rounded-full bg-gradient-to-tr from-emerald-500 to-cyan-500 border border-emerald-300 active:scale-95 flex items-center justify-center font-black text-xs uppercase text-black shadow-lg"
            >
              TOGGLE
            </button>
          </div>
        )}

        {/* Menu Overlay */}
        {gameState === "menu" && (
          <div className="absolute inset-0 z-40 bg-[#010d16]/90 backdrop-blur-2xl flex flex-col items-center justify-center p-6 overflow-y-auto">
            <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-emerald-600/20 rounded-full blur-[120px] pointer-events-none animate-pulse" />

            <motion.div
              initial={{ scale: 0.88, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              className="text-center max-w-2xl mb-8 z-10"
            >
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-black uppercase tracking-widest mb-4 shadow-[0_0_20px_rgba(16,185,129,0.2)]">
                <Zap className="w-4 h-4 text-emerald-400 animate-bounce" /> Neural Node Matrix Network Alignment
              </div>

              <h1 className="text-7xl md:text-8xl font-black uppercase tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-emerald-300 via-teal-300 to-cyan-400 drop-shadow-[0_0_40px_rgba(16,185,129,0.6)]">
                MATRIX
              </h1>
              <p className="text-base text-emerald-100/70 mt-4 max-w-lg mx-auto leading-relaxed">
                Align interconnected neural matrix nodes to complete conductive cyber grid circuits and stabilize network flow.
              </p>

              <div className="flex justify-center gap-3 mt-4">
                <span className="px-3 py-1 rounded-md bg-white/5 border border-white/10 text-[10px] font-mono text-emerald-300">1P / 2P MODES</span>
                <span className="px-3 py-1 rounded-md bg-white/5 border border-white/10 text-[10px] font-mono text-teal-300">ONLINE LEADERBOARD</span>
                <span className="px-3 py-1 rounded-md bg-white/5 border border-white/10 text-[10px] font-mono text-cyan-300">TOUCH READY</span>
              </div>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-xl w-full z-10">
              <button
                onClick={() => startGame("neural_alignment")}
                className="group relative p-6 rounded-3xl bg-white/5 border border-emerald-500/30 hover:border-emerald-400 hover:bg-emerald-500/10 flex flex-col items-center gap-3 transition-all duration-300 text-center backdrop-blur-md shadow-lg hover:shadow-[0_0_30px_rgba(16,185,129,0.3)] active:scale-95"
              >
                <User className="w-8 h-8 text-emerald-400 group-hover:scale-110 transition-transform" />
                <div>
                  <div className="font-black text-xl uppercase tracking-wider text-white">NEURAL ALIGNMENT</div>
                  <div className="text-xs text-emerald-200/60 mt-1">Single player node grid stabilization</div>
                </div>
              </button>

              <button
                onClick={() => startGame("grid_defense_duel")}
                className="group relative p-6 rounded-3xl bg-white/5 border border-cyan-500/30 hover:border-cyan-400 hover:bg-cyan-500/10 flex flex-col items-center gap-3 transition-all duration-300 text-center backdrop-blur-md shadow-lg hover:shadow-[0_0_30px_rgba(6,182,212,0.3)] active:scale-95"
              >
                <Users className="w-8 h-8 text-cyan-400 group-hover:scale-110 transition-transform" />
                <div>
                  <div className="font-black text-xl uppercase tracking-wider text-white">GRID DUEL</div>
                  <div className="text-xs text-cyan-200/60 mt-1">2-Player node control battle</div>
                </div>
              </button>
            </div>

            <div className="mt-8 z-10 flex flex-wrap items-center justify-center gap-6 text-xs text-white/50 bg-black/40 px-6 py-3 rounded-2xl border border-white/10">
              <div className="flex items-center gap-2">
                <span className="font-mono text-emerald-300 bg-white/10 px-2 py-0.5 rounded border border-white/10 font-bold">WASD</span>
                <span>Move Cursor</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-cyan-300 bg-white/10 px-2 py-0.5 rounded border border-white/10 font-bold">SPACE</span>
                <span>Toggle Node State</span>
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
                <Trophy className="w-3.5 h-3.5 text-emerald-400" /> Matrix Alignment Completed
              </div>

              <h2 className="text-4xl font-black uppercase text-transparent bg-clip-text bg-gradient-to-r from-emerald-300 to-cyan-300 mb-2">
                {winnerName ? `${winnerName} VICTORIOUS!` : "MATRIX OVERLOADED"}
              </h2>
              <p className="text-xs text-emerald-200/60 mb-6">Neural Node Alignment Results</p>

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
