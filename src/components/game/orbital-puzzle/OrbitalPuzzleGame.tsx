"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Play,
  RotateCcw,
  Volume2,
  VolumeX,
  ArrowLeft,
  Zap,
  RotateCw,
  Undo2,
  Sparkles,
  Star,
  CheckCircle2,
  Lock,
  ChevronRight,
  HelpCircle,
  Pause
} from "lucide-react";
import Link from "next/link";

// ==========================================
// 1. SYNTHETIC AUDIO ENGINE FOR LASER PUZZLE
// ==========================================
class PuzzleSoundEngine {
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

  playRotate() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(400, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(800, this.ctx.currentTime + 0.08);

      gain.gain.setValueAtTime(0.15, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.08);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.08);
    } catch (e) {}
  }

  playTargetHit() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;
    try {
      const notes = [523.25, 659.25, 783.99];
      notes.forEach((freq, i) => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, this.ctx!.currentTime + i * 0.06);

        gain.gain.setValueAtTime(0.2, this.ctx!.currentTime + i * 0.06);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx!.currentTime + i * 0.06 + 0.1);

        osc.connect(gain);
        gain.connect(this.ctx!.destination);
        osc.start(this.ctx!.currentTime + i * 0.06);
        osc.stop(this.ctx!.currentTime + i * 0.06 + 0.1);
      });
    } catch (e) {}
  }

  playLevelComplete() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;
    try {
      const notes = [523.25, 659.25, 783.99, 1046.5];
      notes.forEach((freq, i) => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, this.ctx!.currentTime + i * 0.08);

        gain.gain.setValueAtTime(0.2, this.ctx!.currentTime + i * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx!.currentTime + i * 0.08 + 0.15);

        osc.connect(gain);
        gain.connect(this.ctx!.destination);
        osc.start(this.ctx!.currentTime + i * 0.08);
        osc.stop(this.ctx!.currentTime + i * 0.08 + 0.15);
      });
    } catch (e) {}
  }
}

const soundEngine = new PuzzleSoundEngine();

// ==========================================
// 2. PUZZLE TYPES & LEVEL DEFINITIONS
// ==========================================
export type Direction = "UP" | "RIGHT" | "DOWN" | "LEFT";

export interface GridTile {
  x: number;
  y: number;
  type: "empty" | "emitter" | "target" | "mirror" | "splitter" | "block";
  rotation: number; // 0, 90, 180, 270 degrees
  color?: string;
  isPowered?: boolean;
}

export interface PuzzleLevel {
  id: number;
  title: string;
  gridWidth: number;
  gridHeight: number;
  tiles: GridTile[];
  emitterDir: Direction;
  emitterPos: [number, number];
  targetPos: [number, number];
  targetColor: string;
}

export const PUZZLE_LEVELS: PuzzleLevel[] = [
  {
    id: 1,
    title: "Level 1: Reflection Basics",
    gridWidth: 6,
    gridHeight: 6,
    emitterPos: [0, 2],
    emitterDir: "RIGHT",
    targetPos: [5, 4],
    targetColor: "#00f0ff",
    tiles: [
      { x: 0, y: 2, type: "emitter", rotation: 90, color: "#00f0ff" },
      { x: 5, y: 4, type: "target", rotation: 0, color: "#00f0ff" },
      { x: 3, y: 2, type: "mirror", rotation: 0, color: "#00f0ff" },
      { x: 3, y: 4, type: "mirror", rotation: 90, color: "#00f0ff" },
    ],
  },
  {
    id: 2,
    title: "Level 2: Dual Mirror Loop",
    gridWidth: 6,
    gridHeight: 6,
    emitterPos: [1, 0],
    emitterDir: "DOWN",
    targetPos: [4, 5],
    targetColor: "#00ffcc",
    tiles: [
      { x: 1, y: 0, type: "emitter", rotation: 180, color: "#00ffcc" },
      { x: 4, y: 5, type: "target", rotation: 0, color: "#00ffcc" },
      { x: 1, y: 3, type: "mirror", rotation: 0 },
      { x: 4, y: 3, type: "mirror", rotation: 180 },
    ],
  },
  {
    id: 3,
    title: "Level 3: Prism Beam Routing",
    gridWidth: 7,
    gridHeight: 7,
    emitterPos: [0, 1],
    emitterDir: "RIGHT",
    targetPos: [6, 5],
    targetColor: "#a000ff",
    tiles: [
      { x: 0, y: 1, type: "emitter", rotation: 90, color: "#a000ff" },
      { x: 6, y: 5, type: "target", rotation: 0, color: "#a000ff" },
      { x: 2, y: 1, type: "mirror", rotation: 0 },
      { x: 2, y: 3, type: "mirror", rotation: 90 },
      { x: 4, y: 3, type: "mirror", rotation: 0 },
      { x: 4, y: 5, type: "mirror", rotation: 90 },
    ],
  },
  {
    id: 4,
    title: "Level 4: Quad Matrix Convergence",
    gridWidth: 7,
    gridHeight: 7,
    emitterPos: [1, 0],
    emitterDir: "DOWN",
    targetPos: [5, 6],
    targetColor: "#ff0077",
    tiles: [
      { x: 1, y: 0, type: "emitter", rotation: 180, color: "#ff0077" },
      { x: 5, y: 6, type: "target", rotation: 0, color: "#ff0077" },
      { x: 1, y: 4, type: "mirror", rotation: 0 },
      { x: 3, y: 4, type: "mirror", rotation: 90 },
      { x: 3, y: 2, type: "mirror", rotation: 0 },
      { x: 5, y: 2, type: "mirror", rotation: 90 },
    ],
  },
  {
    id: 5,
    title: "Level 5: Gravitational Overdrive",
    gridWidth: 8,
    gridHeight: 8,
    emitterPos: [0, 0],
    emitterDir: "RIGHT",
    targetPos: [7, 7],
    targetColor: "#00ffaa",
    tiles: [
      { x: 0, y: 0, type: "emitter", rotation: 90, color: "#00ffaa" },
      { x: 7, y: 7, type: "target", rotation: 0, color: "#00ffaa" },
      { x: 4, y: 0, type: "mirror", rotation: 0 },
      { x: 4, y: 4, type: "mirror", rotation: 90 },
      { x: 2, y: 4, type: "mirror", rotation: 0 },
      { x: 2, y: 7, type: "mirror", rotation: 90 },
    ],
  },
];

// ==========================================
// 3. MAIN PUZZLE COMPONENT
// ==========================================
export default function OrbitalPuzzleGame() {
  const [gameState, setGameState] = useState<"menu" | "select" | "playing" | "complete">("menu");
  const [levelIndex, setLevelIndex] = useState<number>(0);
  const [tiles, setTiles] = useState<GridTile[]>([]);
  const [movesCount, setMovesCount] = useState<number>(0);
  const [isSolved, setIsSolved] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(false);

  const currentLevel = PUZZLE_LEVELS[levelIndex];

  // Initialize level
  const startPuzzleLevel = (idx: number) => {
    soundEngine.init();
    setLevelIndex(idx);
    const lvl = PUZZLE_LEVELS[idx];
    setTiles(JSON.parse(JSON.stringify(lvl.tiles)));
    setMovesCount(0);
    setIsSolved(false);
    setGameState("playing");
  };

  // Rotate tile mirror handler
  const handleRotateTile = (x: number, y: number) => {
    if (gameState !== "playing" || isSolved) return;

    soundEngine.playRotate();
    setTiles(prev =>
      prev.map(t => (t.x === x && t.y === y && t.type === "mirror" ? { ...t, rotation: (t.rotation + 90) % 360 } : t))
    );
    setMovesCount(m => m + 1);
  };

  // Check Laser Beam Path Trace
  useEffect(() => {
    if (gameState !== "playing") return;

    let beamX = currentLevel.emitterPos[0];
    let beamY = currentLevel.emitterPos[1];
    let dir: Direction = currentLevel.emitterDir;

    let targetHit = false;
    let steps = 0;

    while (beamX >= 0 && beamX < currentLevel.gridWidth && beamY >= 0 && beamY < currentLevel.gridHeight && steps < 30) {
      steps++;

      // Advance beam
      if (dir === "RIGHT") beamX++;
      else if (dir === "LEFT") beamX--;
      else if (dir === "DOWN") beamY++;
      else if (dir === "UP") beamY--;

      // Check hit on target
      if (beamX === currentLevel.targetPos[0] && beamY === currentLevel.targetPos[1]) {
        targetHit = true;
        break;
      }

      // Check hit on mirror
      const mirror = tiles.find(t => t.x === beamX && t.y === beamY && t.type === "mirror");
      if (mirror) {
        // Reflection physics according to 0 deg or 90 deg mirror angle
        if (mirror.rotation === 0 || mirror.rotation === 180) {
          if (dir === "RIGHT") dir = "DOWN";
          else if (dir === "UP") dir = "LEFT";
          else if (dir === "LEFT") dir = "UP";
          else if (dir === "DOWN") dir = "RIGHT";
        } else {
          if (dir === "RIGHT") dir = "UP";
          else if (dir === "DOWN") dir = "LEFT";
          else if (dir === "LEFT") dir = "DOWN";
          else if (dir === "UP") dir = "RIGHT";
        }
      }
    }

    if (targetHit && !isSolved) {
      setIsSolved(true);
      soundEngine.playLevelComplete();
      setTimeout(() => setGameState("complete"), 600);
    }
  }, [tiles, gameState, levelIndex, isSolved]);

  return (
    <div className="relative w-full h-screen bg-black overflow-hidden font-sans select-none text-white flex flex-col items-center justify-center">
      {/* HEADER HUD */}
      {gameState === "playing" && (
        <div className="absolute top-0 left-0 right-0 p-6 z-20 flex justify-between items-center bg-gradient-to-b from-black/80 to-transparent">
          <div className="flex items-center gap-6">
            <button
              onClick={() => setGameState("select")}
              className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-white/60 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-4 h-4" /> Levels
            </button>
            <span className="text-cyan-400 font-black text-sm uppercase">{currentLevel.title}</span>
          </div>

          <div className="flex items-center gap-4">
            <span className="text-xs font-bold text-amber-400">MOVES: {movesCount}</span>
            <button
              onClick={() => startPuzzleLevel(levelIndex)}
              className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* PUZZLE GRID VIEWPORT */}
      {gameState === "playing" && (
        <div className="bg-zinc-950 p-8 rounded-3xl border-2 border-white/10 shadow-[0_0_50px_rgba(0,240,255,0.1)] flex flex-col items-center gap-6">
          <div
            className="grid gap-3"
            style={{
              gridTemplateColumns: `repeat(${currentLevel.gridWidth}, minmax(0, 1fr))`,
            }}
          >
            {Array.from({ length: currentLevel.gridHeight }).map((_, r) =>
              Array.from({ length: currentLevel.gridWidth }).map((_, c) => {
                const tile = tiles.find(t => t.x === c && t.y === r);

                return (
                  <button
                    key={`${r}-${c}`}
                    onClick={() => handleRotateTile(c, r)}
                    className="w-16 h-16 rounded-2xl border border-white/10 bg-white/5 flex items-center justify-center relative hover:border-cyan-400/50 transition-all overflow-hidden"
                  >
                    {/* Render Emitter */}
                    {tile?.type === "emitter" && (
                      <div className="w-10 h-10 rounded-full bg-cyan-500 shadow-[0_0_20px_rgba(0,240,255,0.8)] flex items-center justify-center">
                        <Zap className="w-5 h-5 text-black" />
                      </div>
                    )}

                    {/* Render Target Core */}
                    {tile?.type === "target" && (
                      <div
                        className={`w-10 h-10 rounded-full border-2 flex items-center justify-center transition-all ${
                          isSolved
                            ? "bg-emerald-500 border-emerald-300 shadow-[0_0_25px_rgba(16,185,129,0.9)] animate-pulse"
                            : "bg-purple-600/40 border-purple-400"
                        }`}
                      >
                        <Sparkles className="w-5 h-5 text-white" />
                      </div>
                    )}

                    {/* Render Rotatable Mirror */}
                    {tile?.type === "mirror" && (
                      <motion.div
                        animate={{ rotate: tile.rotation }}
                        transition={{ type: "spring", stiffness: 300 }}
                        className="w-12 h-2 bg-gradient-to-r from-cyan-400 to-indigo-500 rounded-full shadow-[0_0_10px_rgba(0,240,255,0.6)]"
                      />
                    )}
                  </button>
                );
              })
            )}
          </div>

          <p className="text-xs text-white/40 uppercase tracking-widest">
            Click mirrors to rotate & redirect the laser beam into the target core
          </p>
        </div>
      )}

      {/* OVERLAY 1: START MENU */}
      <AnimatePresence>
        {gameState === "menu" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-40 bg-black/90 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center"
          >
            <Link
              href="/games"
              className="absolute top-8 left-8 flex items-center gap-2 text-xs font-black uppercase tracking-widest text-white/50 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-4 h-4" /> Back to Arcade
            </Link>

            <motion.div initial={{ y: 20 }} animate={{ y: 0 }} className="max-w-md">
              <div className="flex items-center justify-center gap-2 px-4 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs font-black uppercase tracking-widest mb-6">
                <Sparkles className="w-4 h-4" /> Physics & Gravity Laser Puzzle
              </div>

              <h1 className="text-6xl font-black tracking-tighter uppercase mb-4 bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 via-purple-500 to-pink-500">
                ORBITAL PUZZLE
              </h1>
              <p className="text-white/60 text-sm mb-8 leading-relaxed">
                Rotate precision optical mirrors, bend laser beams through gravity wells, and power target energy cores across 15 mind-bending puzzle stages.
              </p>

              <button
                onClick={() => setGameState("select")}
                className="w-full py-4 bg-gradient-to-r from-cyan-500 to-purple-600 rounded-full font-black uppercase tracking-widest hover:scale-105 transition-all shadow-[0_0_40px_rgba(0,240,255,0.4)] flex items-center justify-center gap-3 text-base"
              >
                <Play className="w-5 h-5 fill-white" /> Start Puzzles
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* OVERLAY 2: LEVEL SELECT */}
      <AnimatePresence>
        {gameState === "select" && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="absolute inset-0 z-40 bg-black/90 backdrop-blur-md flex flex-col items-center justify-center p-6"
          >
            <div className="bg-zinc-950 border border-white/10 p-8 rounded-3xl max-w-2xl w-full">
              <div className="flex justify-between items-center mb-8 pb-4 border-b border-white/10">
                <h2 className="text-3xl font-black uppercase tracking-wider">Select Laser Puzzle Stage</h2>
                <button
                  onClick={() => setGameState("menu")}
                  className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl text-xs font-bold uppercase"
                >
                  Main Menu
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {PUZZLE_LEVELS.map((lvl, index) => (
                  <button
                    key={lvl.id}
                    onClick={() => startPuzzleLevel(index)}
                    className="p-5 rounded-2xl border border-cyan-500/40 bg-cyan-500/10 hover:bg-cyan-500/20 hover:border-cyan-400 text-left transition-all flex items-center justify-between"
                  >
                    <div>
                      <div className="font-black text-base">{lvl.title}</div>
                      <p className="text-xs text-white/50 mt-1">Target Core Color: {lvl.targetColor}</p>
                    </div>
                    <ChevronRight className="w-6 h-6 text-cyan-400" />
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* OVERLAY 3: LEVEL COMPLETE */}
      <AnimatePresence>
        {gameState === "complete" && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-40 bg-black/90 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center"
          >
            <div className="bg-zinc-950 border border-white/10 p-8 rounded-3xl max-w-md w-full">
              <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-8 h-8 text-emerald-400" />
              </div>

              <h2 className="text-3xl font-black uppercase tracking-wider text-emerald-400 mb-2">
                PUZZLE SOLVED!
              </h2>
              <p className="text-xs text-white/50 uppercase tracking-widest mb-6">Target Core Powered</p>

              <div className="space-y-3">
                {levelIndex + 1 < PUZZLE_LEVELS.length ? (
                  <button
                    onClick={() => startPuzzleLevel(levelIndex + 1)}
                    className="w-full py-4 bg-cyan-500 text-black font-black uppercase tracking-widest rounded-xl hover:bg-cyan-400 transition-all flex items-center justify-center gap-2"
                  >
                    Next Puzzle <ChevronRight className="w-5 h-5" />
                  </button>
                ) : (
                  <button
                    onClick={() => setGameState("select")}
                    className="w-full py-4 bg-emerald-500 text-black font-black uppercase tracking-widest rounded-xl hover:bg-emerald-400 transition-all"
                  >
                    All Puzzles Solved!
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
