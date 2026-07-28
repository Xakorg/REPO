"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Trophy,
  Play,
  RotateCcw,
  ArrowLeft,
  Pause,
  Sun,
  Zap,
  Sparkles,
  Award,
  RefreshCw,
  CheckCircle2,
  Sliders,
  RotateCw,
  HelpCircle
} from "lucide-react";
import Link from "next/link";

// ==========================================
// 1. PROCEDURAL AUDIO SYNTH
// ==========================================
class PuzzleAudioEngine {
  private ctx: AudioContext | null = null;
  public muted: boolean = false;

  private initCtx() {
    if (!this.ctx && typeof window !== "undefined") {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) this.ctx = new AudioCtx();
    }
    if (this.ctx && this.ctx.state === "suspended") {
      this.ctx.resume();
    }
  }

  public playRotate() {
    if (this.muted) return;
    this.initCtx();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(400, now);
    osc.frequency.exponentialRampToValueAtTime(800, now + 0.08);

    gain.gain.setValueAtTime(0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.08);
  }

  public playConnect() {
    if (this.muted) return;
    this.initCtx();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(523.25, now); // C5
    osc.frequency.exponentialRampToValueAtTime(1046.5, now + 0.15); // C6

    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.15);
  }

  public playVictory() {
    if (this.muted) return;
    this.initCtx();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const notes = [523.25, 659.25, 783.99, 1046.5];
    notes.forEach((freq, idx) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, now + idx * 0.1);
      gain.gain.setValueAtTime(0.2, now + idx * 0.1);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.1 + 0.25);
      osc.connect(gain);
      gain.connect(this.ctx!.destination);
      osc.start(now + idx * 0.1);
      osc.stop(now + idx * 0.1 + 0.25);
    });
  }
}

const audioSynth = new PuzzleAudioEngine();

// ==========================================
// 2. PUZZLE DATA STRUCTURES & DATA
// ==========================================
export type TileType = "empty" | "emitter" | "mirror" | "target" | "block";
export type Direction = "UP" | "RIGHT" | "DOWN" | "LEFT";

export interface PuzzleTile {
  x: number;
  y: number;
  type: TileType;
  dir: Direction; // Emitter direction or Mirror orientation (0: /, 1: \)
  mirrorAngle?: 45 | 135;
  powered?: boolean;
  fixed?: boolean;
}

export interface LevelConfig {
  id: number;
  name: string;
  gridSize: number;
  tiles: PuzzleTile[];
}

const LEVELS: LevelConfig[] = [
  {
    id: 1,
    name: "Quantum 01: Refraction Basics",
    gridSize: 6,
    tiles: [
      { x: 0, y: 2, type: "emitter", dir: "RIGHT", fixed: true },
      { x: 3, y: 2, type: "mirror", dir: "RIGHT", mirrorAngle: 45 },
      { x: 3, y: 5, type: "target", dir: "UP", fixed: true }
    ]
  },
  {
    id: 2,
    name: "Quantum 02: Double Bounce Matrix",
    gridSize: 6,
    tiles: [
      { x: 1, y: 1, type: "emitter", dir: "RIGHT", fixed: true },
      { x: 4, y: 1, type: "mirror", dir: "RIGHT", mirrorAngle: 45 },
      { x: 4, y: 4, type: "mirror", dir: "RIGHT", mirrorAngle: 135 },
      { x: 1, y: 4, type: "target", dir: "UP", fixed: true }
    ]
  },
  {
    id: 3,
    name: "Quantum 03: Dual Beam Circuit",
    gridSize: 6,
    tiles: [
      { x: 0, y: 0, type: "emitter", dir: "RIGHT", fixed: true },
      { x: 5, y: 0, type: "mirror", dir: "RIGHT", mirrorAngle: 45 },
      { x: 5, y: 5, type: "mirror", dir: "RIGHT", mirrorAngle: 135 },
      { x: 0, y: 5, type: "target", dir: "RIGHT", fixed: true }
    ]
  }
];

// ==========================================
// 3. MAIN PUZZLE COMPONENT
// ==========================================
export default function QuantumGridPuzzleGame() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [gameState, setGameState] = useState<"menu" | "playing" | "victory">("menu");
  const [levelIdx, setLevelIdx] = useState(0);
  const [moves, setMoves] = useState(0);
  const [grid, setGrid] = useState<PuzzleTile[]>([]);
  const [isLevelSolved, setIsLevelSolved] = useState(false);

  // Load Level
  const loadLevel = (idx: number) => {
    const lvl = LEVELS[idx];
    setLevelIdx(idx);
    setGrid(lvl.tiles.map((t) => ({ ...t, powered: false })));
    setMoves(0);
    setIsLevelSolved(false);
    setGameState("playing");
  };

  // Rotate Mirror Tile
  const handleTileClick = (x: number, y: number) => {
    if (gameState !== "playing" || isLevelSolved) return;

    setGrid((prev) =>
      prev.map((tile) => {
        if (tile.x === x && tile.y === y && tile.type === "mirror" && !tile.fixed) {
          audioSynth.playRotate();
          setMoves((m) => m + 1);
          return {
            ...tile,
            mirrorAngle: tile.mirrorAngle === 45 ? 135 : 45
          };
        }
        return tile;
      })
    );
  };

  // Laser Raytracing Physics Engine
  useEffect(() => {
    if (gameState !== "playing") return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const gridSize = LEVELS[levelIdx].gridSize;
    const cellSize = canvas.width / gridSize;

    // Reset powered status
    let targetsPoweredCount = 0;
    let totalTargetsCount = 0;

    grid.forEach((t) => {
      if (t.type === "target") {
        totalTargetsCount++;
        t.powered = false;
      }
    });

    // Raytrace laser beams
    const emitters = grid.filter((t) => t.type === "emitter");
    const laserPaths: { x1: number; y1: number; x2: number; y2: number }[] = [];

    emitters.forEach((emitter) => {
      let currX = emitter.x;
      let currY = emitter.y;

      let dx = emitter.dir === "RIGHT" ? 1 : emitter.dir === "LEFT" ? -1 : 0;
      let dy = emitter.dir === "DOWN" ? 1 : emitter.dir === "UP" ? -1 : 0;

      let steps = 0;
      let startPxX = currX * cellSize + cellSize / 2;
      let startPxY = currY * cellSize + cellSize / 2;

      while (steps < 25) {
        steps++;
        const nextX = currX + dx;
        const nextY = currY + dy;

        if (nextX < 0 || nextX >= gridSize || nextY < 0 || nextY >= gridSize) {
          const endPxX = (currX + dx * 0.5) * cellSize + cellSize / 2;
          const endPxY = (currY + dy * 0.5) * cellSize + cellSize / 2;
          laserPaths.push({ x1: startPxX, y1: startPxY, x2: endPxX, y2: endPxY });
          break;
        }

        currX = nextX;
        currY = nextY;

        const endPxX = currX * cellSize + cellSize / 2;
        const endPxY = currY * cellSize + cellSize / 2;
        laserPaths.push({ x1: startPxX, y1: startPxY, x2: endPxX, y2: endPxY });
        startPxX = endPxX;
        startPxY = endPxY;

        const hitTile = grid.find((t) => t.x === currX && t.y === currY);
        if (hitTile) {
          if (hitTile.type === "target") {
            hitTile.powered = true;
            targetsPoweredCount++;
            break;
          } else if (hitTile.type === "mirror") {
            // Reflect laser
            if (hitTile.mirrorAngle === 45) {
              const temp = dx;
              dx = -dy;
              dy = -temp;
            } else if (hitTile.mirrorAngle === 135) {
              const temp = dx;
              dx = dy;
              dy = temp;
            }
          } else if (hitTile.type === "block") {
            break;
          }
        }
      }
    });

    if (totalTargetsCount > 0 && targetsPoweredCount === totalTargetsCount && !isLevelSolved) {
      setIsLevelSolved(true);
      audioSynth.playVictory();
    }

    // ==========================================
    // RENDER PHASE
    // ==========================================
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw Grid Cells
    for (let r = 0; r < gridSize; r++) {
      for (let c = 0; c < gridSize; c++) {
        ctx.strokeStyle = "rgba(6, 182, 212, 0.15)";
        ctx.lineWidth = 1;
        ctx.strokeRect(c * cellSize, r * cellSize, cellSize, cellSize);
      }
    }

    // Render Laser Beams
    laserPaths.forEach((path) => {
      ctx.strokeStyle = "#38bdf8";
      ctx.shadowColor = "#38bdf8";
      ctx.shadowBlur = 15;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(path.x1, path.y1);
      ctx.lineTo(path.x2, path.y2);
      ctx.stroke();
    });

    // Render Tiles
    grid.forEach((tile) => {
      const centerX = tile.x * cellSize + cellSize / 2;
      const centerY = tile.y * cellSize + cellSize / 2;

      if (tile.type === "emitter") {
        ctx.fillStyle = "#0284c7";
        ctx.shadowColor = "#38bdf8";
        ctx.shadowBlur = 15;
        ctx.beginPath();
        ctx.arc(centerX, centerY, cellSize * 0.25, 0, Math.PI * 2);
        ctx.fill();
      } else if (tile.type === "mirror") {
        ctx.strokeStyle = "#a855f7";
        ctx.shadowColor = "#c084fc";
        ctx.shadowBlur = 12;
        ctx.lineWidth = 6;
        ctx.beginPath();
        if (tile.mirrorAngle === 45) {
          ctx.moveTo(tile.x * cellSize + 15, (tile.y + 1) * cellSize - 15);
          ctx.lineTo((tile.x + 1) * cellSize - 15, tile.y * cellSize + 15);
        } else {
          ctx.moveTo(tile.x * cellSize + 15, tile.y * cellSize + 15);
          ctx.lineTo((tile.x + 1) * cellSize - 15, (tile.y + 1) * cellSize - 15);
        }
        ctx.stroke();
      } else if (tile.type === "target") {
        ctx.fillStyle = tile.powered ? "#10b981" : "#6b7280";
        ctx.shadowColor = tile.powered ? "#34d399" : "#9ca3af";
        ctx.shadowBlur = tile.powered ? 25 : 5;
        ctx.beginPath();
        ctx.arc(centerX, centerY, cellSize * 0.28, 0, Math.PI * 2);
        ctx.fill();
      }
    });
  }, [grid, gameState, levelIdx, isLevelSolved]);

  return (
    <div className="fixed inset-0 z-[400] bg-zinc-950 text-white font-sans overflow-hidden select-none flex flex-col items-center justify-center">
      {/* HUD Header */}
      {gameState === "playing" && (
        <div className="w-full max-w-xl p-4 flex justify-between items-center z-10">
          <div>
            <div className="text-xs font-black uppercase text-cyan-400">{LEVELS[levelIdx].name}</div>
            <div className="text-xs font-bold text-white/60">Moves: {moves}</div>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => loadLevel(levelIdx)} className="px-4 py-2 bg-white/10 rounded-xl text-xs font-black uppercase hover:bg-white/20">
              Reset
            </button>
            <Link href="/games" className="px-4 py-2 bg-rose-500/20 border border-rose-500/40 rounded-xl text-xs font-black uppercase text-rose-400">
              Exit
            </Link>
          </div>
        </div>
      )}

      {/* PUZZLE CANVAS GRID */}
      {gameState === "playing" && (
        <div className="relative bg-black/80 p-4 rounded-3xl border border-white/10 shadow-2xl">
          <canvas
            ref={canvasRef}
            width={480}
            height={480}
            onClick={(e) => {
              const rect = canvasRef.current?.getBoundingClientRect();
              if (rect) {
                const cellSize = 480 / LEVELS[levelIdx].gridSize;
                const clickX = Math.floor((e.clientX - rect.left) / cellSize);
                const clickY = Math.floor((e.clientY - rect.top) / cellSize);
                handleTileClick(clickX, clickY);
              }
            }}
            className="cursor-pointer block rounded-2xl"
          />

          {/* Level Complete Victory Overlay */}
          {isLevelSolved && (
            <div className="absolute inset-0 bg-black/80 backdrop-blur-md rounded-3xl flex flex-col items-center justify-center p-6 space-y-4">
              <div className="text-3xl font-black italic text-emerald-400 uppercase">CIRCUIT ENERGIZED!</div>
              <div className="text-xs text-white/70">Completed in {moves} moves</div>
              {levelIdx + 1 < LEVELS.length ? (
                <button
                  onClick={() => loadLevel(levelIdx + 1)}
                  className="px-8 py-4 bg-emerald-500 rounded-full font-black text-sm uppercase tracking-widest hover:scale-105 shadow-[0_0_30px_rgba(16,185,129,0.5)]"
                >
                  Next Level
                </button>
              ) : (
                <div className="text-lg font-black text-cyan-400">ALL PUZZLES CONQUERED!</div>
              )}
            </div>
          )}
        </div>
      )}

      {/* START MENU */}
      {gameState === "menu" && (
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-6">
          <h1 className="text-6xl font-black italic tracking-tighter uppercase bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
            QUANTUM GRID PUZZLE
          </h1>
          <p className="text-white/70 max-w-md">Laser refraction logic puzzle. Rotate quantum mirrors to energize all receptor nodes.</p>
          <button
            onClick={() => loadLevel(0)}
            className="px-10 py-5 bg-emerald-500 rounded-full font-black text-lg uppercase tracking-widest hover:scale-105 shadow-[0_0_40px_rgba(16,185,129,0.5)]"
          >
            Start Puzzles
          </button>
        </div>
      )}
    </div>
  );
}
