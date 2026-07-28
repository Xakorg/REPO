"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Play,
  Pause,
  RotateCcw,
  Volume2,
  VolumeX,
  Shield,
  Zap,
  Sparkles,
  Trophy,
  ArrowLeft,
  Flame,
  Award,
  Layers,
  Compass,
  RotateCw,
  HelpCircle,
  CheckCircle2,
  Lock,
  Grid
} from "lucide-react";
import Link from "next/link";

// ==========================================
// TYPES & PUZZLE DEFINITIONS
// ==========================================
export type Direction = "up" | "right" | "down" | "left";
export type MirrorType = "mirror_slash" | "mirror_backslash" | "splitter" | "prism";

export interface Emitter {
  x: number;
  y: number;
  dir: Direction;
  color: string;
}

export interface Target {
  x: number;
  y: number;
  color: string;
  energized: boolean;
}

export interface CellItem {
  type: MirrorType;
  rotatable: boolean;
  angle: number; // 0, 90, 180, 270
}

export interface PuzzleLevel {
  id: number;
  name: string;
  gridW: number;
  gridH: number;
  emitters: Emitter[];
  targets: Target[];
  grid: Record<string, CellItem>;
  hint: string;
}

const PUZZLE_LEVELS: PuzzleLevel[] = [
  {
    id: 1,
    name: "Reflection 101",
    gridW: 6,
    gridH: 6,
    hint: "Click the mirror in the top right to align the beam downward toward the core.",
    emitters: [{ x: 1, y: 1, dir: "right", color: "#06b6d4" }],
    targets: [{ x: 4, y: 4, color: "#06b6d4", energized: false }],
    grid: {
      "4,1": { type: "mirror_slash", rotatable: true, angle: 0 }
    }
  },
  {
    id: 2,
    name: "Double Reflection",
    gridW: 6,
    gridH: 6,
    hint: "Orient both mirrors so the laser bounces off the right wall and down into the target.",
    emitters: [{ x: 0, y: 1, dir: "right", color: "#ec4899" }],
    targets: [{ x: 5, y: 5, color: "#ec4899", energized: false }],
    grid: {
      "3,1": { type: "mirror_slash", rotatable: true, angle: 0 },
      "3,5": { type: "mirror_backslash", rotatable: true, angle: 0 }
    }
  },
  {
    id: 3,
    name: "Beam Splitter Matrix",
    gridW: 7,
    gridH: 7,
    hint: "Use the splitter to create dual beams hitting both top and bottom targets simultaneously.",
    emitters: [{ x: 1, y: 3, dir: "right", color: "#a855f7" }],
    targets: [
      { x: 5, y: 1, color: "#a855f7", energized: false },
      { x: 5, y: 5, color: "#a855f7", energized: false }
    ],
    grid: {
      "3,3": { type: "splitter", rotatable: true, angle: 0 },
      "5,3": { type: "mirror_slash", rotatable: true, angle: 0 }
    }
  },
  {
    id: 4,
    name: "Quantum Prism Divergence",
    gridW: 8,
    gridH: 8,
    hint: "Split the golden beam into parallel paths to power both energy nodes.",
    emitters: [{ x: 1, y: 2, dir: "right", color: "#eab308" }],
    targets: [
      { x: 6, y: 2, color: "#eab308", energized: false },
      { x: 6, y: 6, color: "#eab308", energized: false }
    ],
    grid: {
      "4,2": { type: "splitter", rotatable: true, angle: 0 },
      "4,6": { type: "mirror_backslash", rotatable: true, angle: 0 }
    }
  },
  {
    id: 5,
    name: "Chrono Dual Emitter Array",
    gridW: 8,
    gridH: 8,
    hint: "Cross-reflection required! Direct Cyan and Magenta lasers to their matching core colors.",
    emitters: [
      { x: 0, y: 1, dir: "right", color: "#06b6d4" },
      { x: 0, y: 6, dir: "right", color: "#ec4899" }
    ],
    targets: [
      { x: 7, y: 1, color: "#06b6d4", energized: false },
      { x: 7, y: 6, color: "#ec4899", energized: false }
    ],
    grid: {
      "3,1": { type: "mirror_slash", rotatable: true, angle: 0 },
      "3,6": { type: "mirror_backslash", rotatable: true, angle: 0 }
    }
  },
  {
    id: 6,
    name: "Tachyon Prism Core",
    gridW: 8,
    gridH: 8,
    hint: "Construct a 4-mirror perimeter loop to direct the beam into the central vault.",
    emitters: [{ x: 0, y: 0, dir: "right", color: "#10b981" }],
    targets: [{ x: 4, y: 4, color: "#10b981", energized: false }],
    grid: {
      "7,0": { type: "mirror_slash", rotatable: true, angle: 0 },
      "7,4": { type: "mirror_backslash", rotatable: true, angle: 0 }
    }
  },
  {
    id: 7,
    name: "Hyper Optics Relay",
    gridW: 9,
    gridH: 9,
    hint: "Synchronize 3 mirrors in sequence to navigate the laser through narrow energy slots.",
    emitters: [{ x: 1, y: 1, dir: "down", color: "#38bdf8" }],
    targets: [{ x: 7, y: 7, color: "#38bdf8", energized: false }],
    grid: {
      "1,4": { type: "mirror_backslash", rotatable: true, angle: 0 },
      "5,4": { type: "mirror_slash", rotatable: true, angle: 0 },
      "5,7": { type: "mirror_backslash", rotatable: true, angle: 0 }
    }
  },
  {
    id: 8,
    name: "Apex Master Prism",
    gridW: 10,
    gridH: 10,
    hint: "The ultimate optic challenge! Align all 5 optical elements to energize 3 targets at once.",
    emitters: [
      { x: 0, y: 2, dir: "right", color: "#a855f7" },
      { x: 0, y: 7, dir: "right", color: "#eab308" }
    ],
    targets: [
      { x: 9, y: 2, color: "#a855f7", energized: false },
      { x: 9, y: 7, color: "#eab308", energized: false },
      { x: 5, y: 5, color: "#10b981", energized: false }
    ],
    grid: {
      "3,2": { type: "splitter", rotatable: true, angle: 0 },
      "3,7": { type: "mirror_slash", rotatable: true, angle: 0 },
      "5,2": { type: "mirror_backslash", rotatable: true, angle: 0 },
      "8,7": { type: "mirror_slash", rotatable: true, angle: 0 }
    }
  }
];

// WEB AUDIO SYNTHESIZER
class PuzzleAudioEngine {
  private ctx: AudioContext | null = null;
  private muted: boolean = false;

  public setMuted(muted: boolean) {
    this.muted = muted;
  }

  private init() {
    if (!this.ctx && typeof window !== "undefined") {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) this.ctx = new AudioCtx();
    }
    if (this.ctx && this.ctx.state === "suspended") this.ctx.resume();
  }

  public playRotate() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(450, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(700, this.ctx.currentTime + 0.08);
      gain.gain.setValueAtTime(0.15, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.08);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.08);
    } catch {}
  }

  public playSolve() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;
    try {
      const notes = [523, 659, 783, 1046];
      notes.forEach((f, i) => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = "triangle";
        osc.frequency.setValueAtTime(f, this.ctx.currentTime + i * 0.08);
        gain.gain.setValueAtTime(0.2, this.ctx.currentTime + i * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + i * 0.08 + 0.2);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(this.ctx.currentTime + i * 0.08);
        osc.stop(this.ctx.currentTime + i * 0.08 + 0.2);
      });
    } catch {}
  }
}

const audio = new PuzzleAudioEngine();

export default function QuantumPrismGame() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // States
  const [gameState, setGameState] = useState<"menu" | "levels" | "playing" | "solved">("menu");
  const [currentLevelIdx, setCurrentLevelIdx] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [moves, setMoves] = useState(0);
  const [showHint, setShowHint] = useState(false);
  const [completedLevels, setCompletedLevels] = useState<Record<number, boolean>>({});
  const [levelGrid, setLevelGrid] = useState<Record<string, CellItem>>({});

  const toggleMute = () => {
    const next = !isMuted;
    setIsMuted(next);
    audio.setMuted(next);
  };

  const loadLevel = (idx: number) => {
    setCurrentLevelIdx(idx);
    const lvl = PUZZLE_LEVELS[idx];
    setLevelGrid({ ...lvl.grid });
    setMoves(0);
    setShowHint(false);
    setGameState("playing");
  };

  const rotateMirror = (key: string) => {
    if (!levelGrid[key]) return;
    audio.playRotate();
    setMoves((prev) => prev + 1);

    setLevelGrid((prev) => {
      const item = prev[key];
      return {
        ...prev,
        [key]: { ...item, angle: (item.angle + 90) % 360 }
      };
    });
  };

  // Raytracing Laser Solver & Render
  useEffect(() => {
    if (gameState !== "playing") return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const lvl = PUZZLE_LEVELS[currentLevelIdx];
    const cellSize = 55;
    const offsetX = (canvas.width - lvl.gridW * cellSize) / 2;
    const offsetY = (canvas.height - lvl.gridH * cellSize) / 2;

    ctx.fillStyle = "#09090b";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw Grid
    for (let r = 0; r < lvl.gridH; r++) {
      for (let c = 0; c < lvl.gridW; c++) {
        ctx.strokeStyle = "rgba(6, 182, 212, 0.15)";
        ctx.lineWidth = 1;
        ctx.strokeRect(c * cellSize + offsetX, r * cellSize + offsetY, cellSize, cellSize);
      }
    }

    // Trace Lasers
    const energizedTargets = new Set<string>();

    lvl.emitters.forEach((em) => {
      let currX = em.x;
      let currY = em.y;
      let dir = em.dir;
      let steps = 0;

      ctx.strokeStyle = em.color;
      ctx.lineWidth = 4;
      ctx.shadowColor = em.color;
      ctx.shadowBlur = 12;
      ctx.beginPath();

      let startPx = currX * cellSize + offsetX + cellSize / 2;
      let startPy = currY * cellSize + offsetY + cellSize / 2;
      ctx.moveTo(startPx, startPy);

      while (steps < 25) {
        steps++;
        if (dir === "right") currX++;
        else if (dir === "left") currX--;
        else if (dir === "down") currY++;
        else if (dir === "up") currY--;

        if (currX < 0 || currX >= lvl.gridW || currY < 0 || currY >= lvl.gridH) break;

        const nextPx = currX * cellSize + offsetX + cellSize / 2;
        const nextPy = currY * cellSize + offsetY + cellSize / 2;
        ctx.lineTo(nextPx, nextPy);

        // Check Target
        lvl.targets.forEach((t) => {
          if (t.x === currX && t.y === currY) {
            energizedTargets.add(`${t.x},${t.y}`);
          }
        });

        // Check Mirrors
        const cellKey = `${currX},${currY}`;
        const mirror = levelGrid[cellKey];
        if (mirror) {
          if (mirror.type === "mirror_slash") {
            if (dir === "right") dir = "up";
            else if (dir === "left") dir = "down";
            else if (dir === "up") dir = "right";
            else if (dir === "down") dir = "left";
          } else if (mirror.type === "mirror_backslash") {
            if (dir === "right") dir = "down";
            else if (dir === "left") dir = "up";
            else if (dir === "up") dir = "left";
            else if (dir === "down") dir = "right";
          }
        }
      }
      ctx.stroke();
      ctx.shadowBlur = 0;
    });

    // Render Emitters & Targets
    lvl.emitters.forEach((em) => {
      ctx.fillStyle = em.color;
      ctx.fillRect(em.x * cellSize + offsetX + 14, em.y * cellSize + offsetY + 14, 28, 28);
    });

    lvl.targets.forEach((t) => {
      const isEnergized = energizedTargets.has(`${t.x},${t.y}`);
      ctx.fillStyle = isEnergized ? "#10b981" : "#ef4444";
      ctx.shadowColor = isEnergized ? "#10b981" : "#ef4444";
      ctx.shadowBlur = 15;
      ctx.beginPath();
      ctx.arc(t.x * cellSize + offsetX + cellSize / 2, t.y * cellSize + offsetY + cellSize / 2, 14, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
    });

    // Render Mirrors
    Object.entries(levelGrid).forEach(([key, cell]) => {
      const [cx, cy] = key.split(",").map(Number);
      const px = cx * cellSize + offsetX + cellSize / 2;
      const py = cy * cellSize + offsetY + cellSize / 2;

      ctx.save();
      ctx.translate(px, py);
      ctx.rotate((cell.angle * Math.PI) / 180);

      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 5;
      ctx.beginPath();
      if (cell.type === "mirror_slash") {
        ctx.moveTo(-16, 16); ctx.lineTo(16, -16);
      } else if (cell.type === "mirror_backslash") {
        ctx.moveTo(-16, -16); ctx.lineTo(16, 16);
      }
      ctx.stroke();
      ctx.restore();
    });

    // Win condition check
    if (energizedTargets.size >= lvl.targets.length && lvl.targets.length > 0) {
      audio.playSolve();
      setCompletedLevels((prev) => ({ ...prev, [lvl.id]: true }));
      setTimeout(() => setGameState("solved"), 600);
    }
  }, [gameState, levelGrid, currentLevelIdx]);

  useEffect(() => {
    if (canvasRef.current) {
      canvasRef.current.width = 640;
      canvasRef.current.height = 580;
    }
  }, []);

  return (
    <div className="relative w-full h-screen bg-black overflow-hidden select-none font-sans text-white flex flex-col items-center justify-center">
      {/* CANVAS CONTAINER */}
      <div className="relative w-[640px] h-[580px] bg-zinc-950 border border-cyan-500/30 rounded-3xl overflow-hidden shadow-[0_0_50px_rgba(6,182,212,0.15)] flex flex-col justify-between">
        <canvas
          ref={canvasRef}
          onClick={(e) => {
            const canvas = canvasRef.current;
            if (!canvas) return;
            const rect = canvas.getBoundingClientRect();
            const lvl = PUZZLE_LEVELS[currentLevelIdx];
            const cellSize = 55;
            const offsetX = (canvas.width - lvl.gridW * cellSize) / 2;
            const offsetY = (canvas.height - lvl.gridH * cellSize) / 2;
            const gx = Math.floor((e.clientX - rect.left - offsetX) / cellSize);
            const gy = Math.floor((e.clientY - rect.top - offsetY) / cellSize);
            rotateMirror(`${gx},${gy}`);
          }}
          className="w-full h-full block cursor-pointer"
        />

        {/* HUD OVERLAY */}
        {gameState === "playing" && (
          <div className="absolute top-4 left-6 right-6 flex justify-between items-center pointer-events-none z-10">
            <div className="flex items-center gap-4 bg-black/70 backdrop-blur-md px-5 py-2.5 rounded-2xl border border-cyan-500/30">
              <span className="text-xs font-bold uppercase tracking-wider text-cyan-400">
                LEVEL {PUZZLE_LEVELS[currentLevelIdx].id}: {PUZZLE_LEVELS[currentLevelIdx].name}
              </span>
              <div className="flex items-center gap-1 text-amber-400 font-bold text-xs">
                <RotateCw className="w-3.5 h-3.5" /> Moves: {moves}
              </div>
            </div>

            <div className="flex items-center gap-2 pointer-events-auto">
              <button onClick={() => setShowHint(!showHint)} className="p-2.5 bg-black/50 hover:bg-black/80 border border-white/20 rounded-xl text-amber-400">
                <HelpCircle className="w-4 h-4" />
              </button>
              <button onClick={toggleMute} className="p-2.5 bg-black/50 hover:bg-black/80 border border-white/20 rounded-xl">
                {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-cyan-400" />}
              </button>
            </div>
          </div>
        )}

        {/* HINT BANNER */}
        {showHint && gameState === "playing" && (
          <div className="absolute bottom-4 left-6 right-6 bg-amber-500/10 border border-amber-500/30 p-3 rounded-xl text-amber-300 text-xs font-bold text-center z-10 backdrop-blur-md">
            HINT: {PUZZLE_LEVELS[currentLevelIdx].hint}
          </div>
        )}
      </div>

      {/* START MENU */}
      {gameState === "menu" && (
        <div className="absolute inset-0 z-30 bg-gradient-to-br from-black via-zinc-950 to-cyan-950 flex flex-col items-center justify-center p-6">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="max-w-xl w-full bg-black/80 backdrop-blur-2xl border border-cyan-500/30 rounded-3xl p-8 text-center flex flex-col items-center shadow-[0_0_50px_rgba(6,182,212,0.2)]"
          >
            <div className="w-16 h-16 rounded-2xl bg-cyan-500/10 border border-cyan-400/40 flex items-center justify-center mb-6">
              <Sparkles className="w-8 h-8 text-cyan-400 animate-pulse" />
            </div>
            <h1 className="text-4xl md:text-5xl font-black uppercase tracking-tighter mb-2 bg-gradient-to-r from-cyan-400 via-teal-300 to-emerald-400 bg-clip-text text-transparent">
              Quantum Prism Puzzles
            </h1>
            <p className="text-zinc-400 text-sm mb-8">
              Optics physics laser grid puzzles. Rotate mirrors and beam splitters to energize target cores across 8 levels.
            </p>
            <div className="flex gap-4 w-full">
              <button
                onClick={() => setGameState("levels")}
                className="flex-1 py-4 bg-gradient-to-r from-cyan-500 to-teal-600 text-white font-black uppercase tracking-widest rounded-2xl hover:scale-105 transition-all flex items-center justify-center gap-2 shadow-[0_0_25px_rgba(6,182,212,0.4)]"
              >
                <Play className="w-5 h-5 fill-white" /> Level Select
              </button>
              <Link
                href="/games"
                className="px-6 py-4 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold uppercase tracking-wider rounded-2xl transition-all flex items-center justify-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" /> Arcade Hub
              </Link>
            </div>
          </motion.div>
        </div>
      )}

      {/* LEVEL SELECT MENU */}
      {gameState === "levels" && (
        <div className="absolute inset-0 z-30 bg-black/90 backdrop-blur-xl flex flex-col items-center justify-center p-6">
          <div className="max-w-2xl w-full bg-zinc-950 border border-cyan-500/30 rounded-3xl p-8">
            <div className="flex justify-between items-center mb-6 pb-4 border-b border-white/10">
              <h2 className="text-2xl font-black uppercase tracking-wider text-cyan-400">Select Optic Puzzle</h2>
              <button onClick={() => setGameState("menu")} className="px-4 py-2 bg-white/5 hover:bg-white/10 rounded-xl text-xs font-bold uppercase">
                Back to Menu
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
              {PUZZLE_LEVELS.map((lvl, idx) => (
                <button
                  key={lvl.id}
                  onClick={() => loadLevel(idx)}
                  className="bg-white/5 hover:bg-cyan-500/20 border border-white/10 hover:border-cyan-500/40 p-4 rounded-2xl flex flex-col items-center transition-all group"
                >
                  <span className="text-xs font-bold text-zinc-500 group-hover:text-cyan-400">PUZZLE {lvl.id}</span>
                  <span className="font-bold text-xs text-white my-1 text-center">{lvl.name}</span>
                  {completedLevels[lvl.id] && <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-1" />}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* SOLVED MODAL */}
      {gameState === "solved" && (
        <div className="absolute inset-0 z-30 bg-black/90 backdrop-blur-xl flex items-center justify-center p-6">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="max-w-md w-full bg-zinc-950 border border-emerald-500/40 rounded-3xl p-8 text-center flex flex-col items-center"
          >
            <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mb-4 text-emerald-400">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h2 className="text-3xl font-black uppercase tracking-wider text-emerald-400 mb-1">Puzzle Solved!</h2>
            <p className="text-xs text-zinc-400 mb-6">Completed in {moves} moves.</p>

            <div className="flex gap-3 w-full">
              {currentLevelIdx < PUZZLE_LEVELS.length - 1 ? (
                <button
                  onClick={() => loadLevel(currentLevelIdx + 1)}
                  className="flex-1 py-4 bg-emerald-500 text-white font-black uppercase tracking-wider rounded-2xl hover:bg-emerald-400 transition-all flex items-center justify-center gap-2"
                >
                  Next Puzzle
                </button>
              ) : (
                <button
                  onClick={() => setGameState("levels")}
                  className="flex-1 py-4 bg-emerald-500 text-white font-black uppercase tracking-wider rounded-2xl hover:bg-emerald-400 transition-all"
                >
                  All Puzzles Solved!
                </button>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
