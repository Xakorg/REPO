"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  RotateCw,
  Undo2,
  Award,
  Play,
  RotateCcw,
  Volume2,
  VolumeX,
  ArrowLeft,
  Sun,
  Shield,
  Layers,
  HelpCircle
} from "lucide-react";
import Link from "next/link";

// ==========================================
// 1. WEB AUDIO SYNTH SFX ENGINE
// ==========================================
class PuzzleAudioEngine {
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

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(400, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(700, this.ctx.currentTime + 0.08);

    gain.gain.setValueAtTime(0.15, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.08);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.08);
  }

  playTargetHit() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = "triangle";
    osc.frequency.setValueAtTime(880, now);
    osc.frequency.setValueAtTime(1174.66, now + 0.1);

    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(now + 0.25);
  }

  playClear() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    [523.25, 659.25, 783.99, 1046.5, 1318.51].forEach((freq, idx) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, now + idx * 0.08);
      gain.gain.setValueAtTime(0.2, now + idx * 0.08);
      gain.gain.exponentialRampToValueAtTime(0.01, now + idx * 0.08 + 0.25);
      osc.connect(gain);
      gain.connect(this.ctx!.destination);
      osc.start(now + idx * 0.08);
      osc.stop(now + idx * 0.08 + 0.25);
    });
  }
}

const audio = new PuzzleAudioEngine();

// ==========================================
// 2. PUZZLE DATA & RAYCAST ENGINE
// ==========================================
export type Direction = "UP" | "RIGHT" | "DOWN" | "LEFT";
export type MirrorType = "MIRROR_SLASH" | "MIRROR_BACKSLASH" | "SPLITTER" | "EMITTER" | "TARGET" | "BLOCK";

export interface GridTile {
  type: MirrorType;
  dir?: Direction;
  color?: string; // e.g. '#38bdf8'
  active?: boolean;
}

interface LevelPuzzle {
  id: number;
  name: string;
  gridSize: number; // e.g. 6 (6x6)
  grid: (GridTile | null)[][];
  parMoves: number;
}

const PUZZLE_LEVELS: LevelPuzzle[] = [
  {
    id: 1,
    name: "OPTICS 101: REFLECTION",
    gridSize: 6,
    parMoves: 2,
    grid: [
      [null, null, null, null, null, null],
      [null, { type: "EMITTER", dir: "RIGHT", color: "#38bdf8" }, null, null, null, null],
      [null, null, null, { type: "MIRROR_SLASH" }, null, null],
      [null, null, null, null, null, null],
      [null, null, null, { type: "TARGET", color: "#38bdf8" }, null, null],
      [null, null, null, null, null, null]
    ]
  },
  {
    id: 2,
    name: "DOUBLE REFRACTION",
    gridSize: 6,
    parMoves: 3,
    grid: [
      [{ type: "EMITTER", dir: "DOWN", color: "#f43f5e" }, null, null, null, null, null],
      [null, null, null, null, null, null],
      [{ type: "MIRROR_BACKSLASH" }, null, { type: "MIRROR_SLASH" }, null, null, null],
      [null, null, null, null, null, null],
      [null, null, { type: "TARGET", color: "#f43f5e" }, null, null, null],
      [null, null, null, null, null, null]
    ]
  },
  {
    id: 3,
    name: "BEAM SPLITTER ARRAY",
    gridSize: 6,
    parMoves: 4,
    grid: [
      [null, { type: "EMITTER", dir: "DOWN", color: "#10b981" }, null, null, null, null],
      [null, null, null, null, null, null],
      [null, { type: "SPLITTER", dir: "DOWN" }, null, { type: "TARGET", color: "#10b981" }, null, null],
      [null, null, null, null, null, null],
      [null, { type: "TARGET", color: "#10b981" }, null, null, null, null],
      [null, null, null, null, null, null]
    ]
  }
];

// ==========================================
// 3. MAIN PUZZLE COMPONENT
// ==========================================
export default function QuantumLaserPuzzle() {
  const [gameState, setGameState] = useState<"menu" | "playing" | "level_clear">("menu");
  const [levelIdx, setLevelIdx] = useState(0);
  const [moves, setMoves] = useState(0);
  const [muted, setMuted] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Active Grid State
  const [grid, setGrid] = useState<(GridTile | null)[][]>([]);

  const currentLevel = PUZZLE_LEVELS[levelIdx];

  const loadLevel = (idx: number) => {
    const lvl = PUZZLE_LEVELS[idx];
    if (!lvl) return;

    // Deep copy level grid
    const initialGrid = lvl.grid.map((row) =>
      row.map((tile) => (tile ? { ...tile, active: false } : null))
    );
    setGrid(initialGrid);
    setMoves(0);
  };

  const startPuzzle = () => {
    setLevelIdx(0);
    loadLevel(0);
    setGameState("playing");
  };

  const toggleMute = () => {
    setMuted(!muted);
    audio.muted = !muted;
  };

  // Click Tile to Rotate Mirror
  const handleTileClick = (r: number, c: number) => {
    if (gameState !== "playing") return;

    const tile = grid[r][c];
    if (!tile) return;

    if (tile.type === "MIRROR_SLASH") {
      audio.playRotate();
      setMoves((m) => m + 1);
      const nextGrid = grid.map((row) => [...row]);
      nextGrid[r][c] = { ...tile, type: "MIRROR_BACKSLASH" };
      setGrid(nextGrid);
    } else if (tile.type === "MIRROR_BACKSLASH") {
      audio.playRotate();
      setMoves((m) => m + 1);
      const nextGrid = grid.map((row) => [...row]);
      nextGrid[r][c] = { ...tile, type: "MIRROR_SLASH" };
      setGrid(nextGrid);
    }
  };

  // Render & Raytracing Simulation Loop
  useEffect(() => {
    if (gameState !== "playing" || !currentLevel) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const size = currentLevel.gridSize;
    const cellSize = canvas.width / size;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw Grid Background
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        const x = c * cellSize;
        const y = r * cellSize;
        ctx.fillStyle = (r + c) % 2 === 0 ? "#0f172a" : "#1e293b";
        ctx.fillRect(x, y, cellSize, cellSize);
        ctx.strokeStyle = "#334155";
        ctx.strokeRect(x, y, cellSize, cellSize);
      }
    }

    // Raytracing Beam Simulation
    let allTargetsLit = true;
    let targetCount = 0;

    // Find Emitters
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        const tile = grid[r]?.[c];
        if (tile?.type === "EMITTER") {
          // Cast Ray
          let currR = r;
          let currC = c;
          let dir: Direction = tile.dir || "RIGHT";
          const beamColor = tile.color || "#38bdf8";

          // Trace Ray Path
          let steps = 0;
          while (steps < 40) {
            steps++;
            let dr = 0;
            let dc = 0;

            if (dir === "RIGHT") dc = 1;
            if (dir === "LEFT") dc = -1;
            if (dir === "DOWN") dr = 1;
            if (dir === "UP") dr = -1;

            const nextR = currR + dr;
            const nextC = currC + dc;

            if (nextR < 0 || nextR >= size || nextC < 0 || nextC >= size) break;

            // Draw Beam segment
            ctx.beginPath();
            ctx.moveTo(currC * cellSize + cellSize / 2, currR * cellSize + cellSize / 2);
            ctx.lineTo(nextC * cellSize + cellSize / 2, nextR * cellSize + cellSize / 2);
            ctx.strokeStyle = beamColor;
            ctx.lineWidth = 4;
            ctx.shadowColor = beamColor;
            ctx.shadowBlur = 10;
            ctx.stroke();
            ctx.shadowBlur = 0;

            currR = nextR;
            currC = nextC;

            // Check Hit Tile
            const hit = grid[currR]?.[currC];
            if (hit) {
              if (hit.type === "MIRROR_SLASH") {
                // '/' mirror
                if (dir === "RIGHT") dir = "UP";
                else if (dir === "DOWN") dir = "LEFT";
                else if (dir === "LEFT") dir = "DOWN";
                else if (dir === "UP") dir = "RIGHT";
              } else if (hit.type === "MIRROR_BACKSLASH") {
                // '\' mirror
                if (dir === "RIGHT") dir = "DOWN";
                else if (dir === "UP") dir = "LEFT";
                else if (dir === "LEFT") dir = "UP";
                else if (dir === "DOWN") dir = "RIGHT";
              } else if (hit.type === "TARGET") {
                targetCount++;
                break;
              }
            }
          }
        }
      }
    }

    // Draw Grid Objects (Mirrors, Emitters, Targets)
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        const tile = grid[r]?.[c];
        if (!tile) continue;

        const x = c * cellSize;
        const y = r * cellSize;

        if (tile.type === "EMITTER") {
          ctx.fillStyle = tile.color || "#38bdf8";
          ctx.beginPath();
          ctx.arc(x + cellSize / 2, y + cellSize / 2, cellSize / 3, 0, Math.PI * 2);
          ctx.fill();
        } else if (tile.type === "TARGET") {
          ctx.strokeStyle = tile.color || "#38bdf8";
          ctx.lineWidth = 3;
          ctx.strokeRect(x + 10, y + 10, cellSize - 20, cellSize - 20);
        } else if (tile.type === "MIRROR_SLASH") {
          ctx.strokeStyle = "#facc15";
          ctx.lineWidth = 6;
          ctx.beginPath();
          ctx.moveTo(x + 12, y + cellSize - 12);
          ctx.lineTo(x + cellSize - 12, y + 12);
          ctx.stroke();
        } else if (tile.type === "MIRROR_BACKSLASH") {
          ctx.strokeStyle = "#facc15";
          ctx.lineWidth = 6;
          ctx.beginPath();
          ctx.moveTo(x + 12, y + 12);
          ctx.lineTo(x + cellSize - 12, y + cellSize - 12);
          ctx.stroke();
        }
      }
    }

    if (targetCount > 0 && targetCount >= 1) {
      audio.playClear();
      setGameState("level_clear");
    }
  }, [grid, gameState, levelIdx]);

  return (
    <div className="relative w-full h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-4 font-sans select-none overflow-hidden">
      <div className="relative bg-slate-900 border-2 border-slate-800 rounded-2xl p-6 shadow-2xl flex flex-col items-center gap-6 max-w-2xl w-full">
        {/* Header HUD */}
        <div className="w-full flex items-center justify-between bg-slate-950 p-4 rounded-xl border border-slate-800">
          <div>
            <span className="text-xs font-bold text-sky-400">LEVEL {levelIdx + 1}: {currentLevel?.name}</span>
            <div className="text-xs text-slate-400">Moves: <span className="text-white font-bold">{moves}</span> / Par: {currentLevel?.parMoves}</div>
          </div>

          <div className="flex items-center gap-3">
            <button onClick={() => loadLevel(levelIdx)} className="p-2 bg-slate-800 rounded-lg hover:bg-slate-700">
              <RotateCcw className="w-4 h-4 text-slate-300" />
            </button>
            <button onClick={toggleMute} className="p-2 bg-slate-800 rounded-lg hover:bg-slate-700">
              {muted ? <VolumeX className="w-4 h-4 text-slate-400" /> : <Volume2 className="w-4 h-4 text-sky-400" />}
            </button>
          </div>
        </div>

        {/* START MENU */}
        {gameState === "menu" && (
          <div className="py-12 flex flex-col items-center text-center">
            <span className="px-4 py-1.5 rounded-full bg-sky-500/10 border border-sky-500/30 text-sky-400 text-xs font-bold uppercase tracking-widest mb-6">
              2D OPTICS LOGIC PUZZLE
            </span>
            <h1 className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-sky-400 via-indigo-300 to-amber-300 mb-4">
              QUANTUM LASER
            </h1>
            <p className="text-slate-400 text-xs max-w-md mb-8">
              Click yellow mirrors to rotate beam paths and guide quantum laser rays into target sensors.
            </p>

            <button
              onClick={startPuzzle}
              className="px-8 py-4 bg-sky-500 hover:bg-sky-400 font-bold text-white rounded-xl shadow-lg shadow-sky-500/25 mb-4"
            >
              START PUZZLE
            </button>
            <Link href="/games" className="text-xs text-slate-400 hover:text-white flex items-center gap-1">
              <ArrowLeft className="w-4 h-4" /> Back to Arcade Hub
            </Link>
          </div>
        )}

        {/* PLAYING CANVAS GRID */}
        {gameState === "playing" && (
          <div className="relative cursor-pointer">
            <canvas
              ref={canvasRef}
              width={480}
              height={480}
              className="block rounded-xl border border-slate-700 shadow-inner"
              onClick={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;
                const cellSize = 480 / (currentLevel?.gridSize || 6);
                const c = Math.floor(x / cellSize);
                const r = Math.floor(y / cellSize);
                handleTileClick(r, c);
              }}
            />
          </div>
        )}

        {/* LEVEL CLEAR OVERLAY */}
        {gameState === "level_clear" && (
          <div className="py-8 flex flex-col items-center justify-center text-center">
            <Award className="w-12 h-12 text-amber-400 mb-4" />
            <h2 className="text-3xl font-black text-white mb-2">PUZZLE SOLVED!</h2>
            <p className="text-xs text-slate-400 mb-6">Completed in {moves} moves.</p>

            {levelIdx + 1 < PUZZLE_LEVELS.length ? (
              <button
                onClick={() => {
                  setLevelIdx((l) => l + 1);
                  loadLevel(levelIdx + 1);
                  setGameState("playing");
                }}
                className="px-8 py-3 bg-sky-500 hover:bg-sky-400 font-bold text-white rounded-xl"
              >
                NEXT PUZZLE ➡️
              </button>
            ) : (
              <button
                onClick={startPuzzle}
                className="px-8 py-3 bg-sky-500 hover:bg-sky-400 font-bold text-white rounded-xl"
              >
                REPLAY ALL PUZZLES
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
