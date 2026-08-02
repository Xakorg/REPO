"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Shield,
  Zap,
  Crosshair,
  Award,
  Volume2,
  VolumeX,
  Play,
  Pause,
  RotateCcw,
  Sparkles,
  Users,
  User,
  Globe,
  Trophy,
  ArrowLeft,
  Activity,
  Target,
  Grid,
  Radio,
  Clock,
  Swords
} from "lucide-react";
import Link from "next/link";
import { useUser, useFirestore, setDocumentNonBlocking } from "@/firebase";
import { doc, increment } from "firebase/firestore";

// ==========================================
// APEX TACTICAL TYPES & GRID DATA
// ==========================================

export type ApexMode = "single_campaign" | "local_duel";

export interface TacticalUnit {
  id: string;
  owner: "p1" | "p2";
  name: string;
  x: number;
  y: number;
  hp: number;
  maxHp: number;
  ap: number;
  maxAp: number;
  attackRange: number;
  damage: number;
  shield: number;
  color: string;
  selected: boolean;
}

export interface GridTile {
  x: number;
  y: number;
  isCover: boolean;
  coverValue: number;
}

// ==========================================
// WEB AUDIO SYNTHESIZER
// ==========================================

class TacticalAudioSynth {
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

  playMove() {
    if (this.muted || !this.ctx) return;
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

  playShot() {
    if (this.muted || !this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(900, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(200, this.ctx.currentTime + 0.15);

      gain.gain.setValueAtTime(0.25, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.15);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.15);
    } catch (e) {}
  }

  playShieldHit() {
    if (this.muted || !this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(1200, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(500, this.ctx.currentTime + 0.2);

      gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.2);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.2);
    } catch (e) {}
  }
}

const audio = new TacticalAudioSynth();

// ==========================================
// APEX GAME COMPONENT
// ==========================================

export default function ApexGame() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const { user } = useUser();
  const firestore = useFirestore();

  const [gameState, setGameState] = useState<"menu" | "playing" | "paused" | "game_over">("menu");
  const [mode, setMode] = useState<ApexMode>("single_campaign");
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Turn Management
  const [currentTurn, setCurrentTurn] = useState<"p1" | "p2">("p1");
  const [selectedUnitId, setSelectedUnitId] = useState<string | null>(null);
  const [winnerName, setWinnerName] = useState<string | null>(null);

  const GRID_COLS = 12;
  const GRID_ROWS = 8;

  const engineRef = useRef({
    grid: [] as GridTile[],
    units: [] as TacticalUnit[],
    particles: [] as any[],
    selectedUnitId: null as string | null
  });

  const toggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    audio.muted = !next;
  };

  const dispatchScore = (finalScore: number) => {
    if (typeof window !== "undefined" && finalScore > 0) {
      const points = Math.floor(finalScore / 20) + 15;
      window.dispatchEvent(
        new CustomEvent("xakteir-game-score", {
          detail: { score: finalScore, points }
        })
      );
      if (user && firestore) {
        setDocumentNonBlocking(
          doc(firestore, "leaderboard", user.uid),
          {
            uid: user.uid,
            displayName: user.displayName || "Apex Commander",
            points: increment(points),
            updatedAt: new Date().toISOString()
          },
          { merge: true }
        );
      }
    }
  };

  const initGrid = useCallback(() => {
    const grid: GridTile[] = [];
    for (let r = 0; r < GRID_ROWS; r++) {
      for (let c = 0; c < GRID_COLS; c++) {
        const isCover = Math.random() < 0.18 && c > 1 && c < GRID_COLS - 2;
        grid.push({
          x: c,
          y: r,
          isCover,
          coverValue: isCover ? 30 : 0
        });
      }
    }

    const units: TacticalUnit[] = [
      // P1 Units (Red / Blue)
      { id: "p1_u1", owner: "p1", name: "Alpha Striker", x: 1, y: 2, hp: 100, maxHp: 100, ap: 2, maxAp: 2, attackRange: 4, damage: 35, shield: 20, color: "#06b6d4", selected: false },
      { id: "p1_u2", owner: "p1", name: "Sentinel Tank", x: 1, y: 5, hp: 140, maxHp: 140, ap: 2, maxAp: 2, attackRange: 3, damage: 25, shield: 40, color: "#06b6d4", selected: false },

      // P2 / AI Units
      { id: "p2_u1", owner: "p2", name: mode === "local_duel" ? "Rival Vanguard" : "AI Commander", x: 10, y: 2, hp: 100, maxHp: 100, ap: 2, maxAp: 2, attackRange: 4, damage: 35, shield: 20, color: "#f43f5e", selected: false },
      { id: "p2_u2", owner: "p2", name: mode === "local_duel" ? "Rival Juggernaut" : "AI Heavy", x: 10, y: 5, hp: 140, maxHp: 140, ap: 2, maxAp: 2, attackRange: 3, damage: 25, shield: 40, color: "#f43f5e", selected: false }
    ];

    engineRef.current.grid = grid;
    engineRef.current.units = units;
    engineRef.current.particles = [];
    engineRef.current.selectedUnitId = null;

    setCurrentTurn("p1");
    setSelectedUnitId(null);
    setWinnerName(null);
  }, [mode]);

  // Main 60FPS Render & Animation Loop
  useEffect(() => {
    let animId: number;

    const runLoop = () => {
      renderCanvas();
      animId = requestAnimationFrame(runLoop);
    };

    const renderCanvas = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      const w = (canvas.width = canvas.parentElement?.clientWidth || window.innerWidth);
      const h = (canvas.height = canvas.parentElement?.clientHeight || window.innerHeight);
      const engine = engineRef.current;

      ctx.fillStyle = "#030712";
      ctx.fillRect(0, 0, w, h);

      const tileWidth = Math.min(w / (GRID_COLS + 2), h / (GRID_ROWS + 2));
      const offsetX = (w - GRID_COLS * tileWidth) / 2;
      const offsetY = (h - GRID_ROWS * tileWidth) / 2;

      // Draw Grid Tiles
      engine.grid.forEach(tile => {
        const tx = offsetX + tile.x * tileWidth;
        const ty = offsetY + tile.y * tileWidth;

        ctx.fillStyle = tile.isCover ? "#1e293b" : "#0f172a";
        ctx.strokeStyle = "rgba(255, 255, 255, 0.08)";
        ctx.lineWidth = 1;

        ctx.fillRect(tx + 2, ty + 2, tileWidth - 4, tileWidth - 4);
        ctx.strokeRect(tx + 2, ty + 2, tileWidth - 4, tileWidth - 4);

        if (tile.isCover) {
          ctx.fillStyle = "#334155";
          ctx.fillRect(tx + tileWidth * 0.25, ty + tileWidth * 0.25, tileWidth * 0.5, tileWidth * 0.5);
        }
      });

      // Highlight Selected Unit Move Range
      const selectedUnit = engine.units.find(u => u.id === engineRef.current.selectedUnitId);
      if (selectedUnit && selectedUnit.owner === currentTurn && selectedUnit.ap > 0) {
        engine.grid.forEach(tile => {
          const dist = Math.abs(tile.x - selectedUnit.x) + Math.abs(tile.y - selectedUnit.y);
          if (dist === 1 && !engine.units.some(u => u.x === tile.x && u.y === tile.y)) {
            const tx = offsetX + tile.x * tileWidth;
            const ty = offsetY + tile.y * tileWidth;
            ctx.fillStyle = "rgba(6, 182, 212, 0.25)";
            ctx.fillRect(tx + 2, ty + 2, tileWidth - 4, tileWidth - 4);
          }
        });
      }

      // Draw Units
      engine.units.forEach(unit => {
        const tx = offsetX + unit.x * tileWidth + tileWidth / 2;
        const ty = offsetY + unit.y * tileWidth + tileWidth / 2;

        ctx.save();
        ctx.shadowBlur = unit.id === engineRef.current.selectedUnitId ? 25 : 10;
        ctx.shadowColor = unit.color;

        ctx.fillStyle = unit.color;
        ctx.beginPath();
        ctx.arc(tx, ty, tileWidth * 0.3, 0, Math.PI * 2);
        ctx.fill();

        // Draw HP Bar
        ctx.fillStyle = "#020617";
        ctx.fillRect(tx - tileWidth * 0.35, ty - tileWidth * 0.45, tileWidth * 0.7, 5);
        ctx.fillStyle = "#22c55e";
        ctx.fillRect(tx - tileWidth * 0.35, ty - tileWidth * 0.45, (tileWidth * 0.7) * (unit.hp / unit.maxHp), 5);

        ctx.restore();
      });
    };

    animId = requestAnimationFrame(runLoop);
    return () => cancelAnimationFrame(animId);
  }, [currentTurn]);

  // Handle Canvas Tile Clicks
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    audio.init();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    const w = canvas.width;
    const h = canvas.height;
    const tileWidth = Math.min(w / (GRID_COLS + 2), h / (GRID_ROWS + 2));
    const offsetX = (w - GRID_COLS * tileWidth) / 2;
    const offsetY = (h - GRID_ROWS * tileWidth) / 2;

    const col = Math.floor((clickX - offsetX) / tileWidth);
    const row = Math.floor((clickY - offsetY) / tileWidth);

    if (col < 0 || col >= GRID_COLS || row < 0 || row >= GRID_ROWS) return;

    const engine = engineRef.current;
    const clickedUnit = engine.units.find(u => u.x === col && u.y === row);

    // Select Unit
    if (clickedUnit && clickedUnit.owner === currentTurn) {
      engine.selectedUnitId = clickedUnit.id;
      setSelectedUnitId(clickedUnit.id);
      audio.playMove();
      return;
    }

    // Perform Action / Move
    const activeUnit = engine.units.find(u => u.id === engine.selectedUnitId);
    if (activeUnit && activeUnit.owner === currentTurn && activeUnit.ap > 0) {
      const dist = Math.abs(col - activeUnit.x) + Math.abs(row - activeUnit.y);

      // Move to Adjacent Empty Tile
      if (dist === 1 && !clickedUnit) {
        activeUnit.x = col;
        activeUnit.y = row;
        activeUnit.ap--;
        audio.playMove();
        return;
      }

      // Attack Enemy Unit in Range
      if (clickedUnit && clickedUnit.owner !== currentTurn) {
        const attackDist = Math.abs(col - activeUnit.x) + Math.abs(row - activeUnit.y);
        if (attackDist <= activeUnit.attackRange) {
          audio.playShot();
          clickedUnit.hp -= activeUnit.damage;
          activeUnit.ap = 0;

          if (clickedUnit.hp <= 0) {
            engine.units = engine.units.filter(u => u.id !== clickedUnit.id);
            const remainingEnemies = engine.units.filter(u => u.owner !== currentTurn);

            if (remainingEnemies.length === 0) {
              setWinnerName(currentTurn === "p1" ? "Player 1" : "Player 2");
              dispatchScore(1200);
              setGameState("game_over");
            }
          }
        }
      }
    }
  };

  const endTurn = () => {
    const nextTurn = currentTurn === "p1" ? "p2" : "p1";
    engineRef.current.units.forEach(u => {
      if (u.owner === nextTurn) u.ap = u.maxAp;
    });

    engineRef.current.selectedUnitId = null;
    setSelectedUnitId(null);
    setCurrentTurn(nextTurn);

    // AI Turn in Single Player
    if (mode === "single_campaign" && nextTurn === "p2") {
      setTimeout(() => {
        const aiUnits = engineRef.current.units.filter(u => u.owner === "p2");
        const playerUnits = engineRef.current.units.filter(u => u.owner === "p1");

        if (aiUnits.length > 0 && playerUnits.length > 0) {
          const ai = aiUnits[0];
          const target = playerUnits[0];
          if (ai && target) {
            if (ai.x > target.x) ai.x--;
            else if (ai.y < target.y) ai.y++;
          }
        }
        endTurn();
      }, 1000);
    }
  };

  const startGame = (selectedMode: ApexMode) => {
    setMode(selectedMode);
    initGrid();
    setGameState("playing");
  };

  return (
    <div className="w-full h-screen bg-[#030712] text-white relative overflow-hidden font-sans select-none">
      <canvas
        ref={canvasRef}
        onClick={handleCanvasClick}
        className="absolute inset-0 w-full h-full block cursor-pointer"
      />

      <div className="absolute top-0 inset-x-0 p-4 flex justify-between items-center z-30 pointer-events-none">
        <Link
          href="/games"
          className="pointer-events-auto flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold"
        >
          <ArrowLeft className="w-4 h-4" /> Exit Apex
        </Link>
        <button
          onClick={toggleSound}
          className="pointer-events-auto p-2 rounded-xl bg-white/5 border border-white/10"
        >
          {soundEnabled ? <Volume2 className="w-4 h-4 text-cyan-400" /> : <VolumeX className="w-4 h-4 text-rose-400" />}
        </button>
      </div>

      {gameState === "playing" && (
        <div className="absolute top-4 inset-x-0 flex justify-center pointer-events-none z-20">
          <div className="bg-[#0b0f19]/90 border border-white/10 px-8 py-3 rounded-2xl backdrop-blur-md flex items-center gap-6 pointer-events-auto">
            <div className="text-center">
              <div className="text-[10px] font-black uppercase text-white/40 tracking-wider">CURRENT TURN</div>
              <div className={`text-xl font-black ${currentTurn === "p1" ? "text-cyan-400" : "text-rose-400"}`}>
                {currentTurn === "p1" ? "PLAYER 1" : "PLAYER 2"}
              </div>
            </div>
            <button
              onClick={endTurn}
              className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-black uppercase text-xs tracking-wider"
            >
              END TURN
            </button>
          </div>
        </div>
      )}

      {gameState === "menu" && (
        <div className="absolute inset-0 z-40 bg-[#030712]/90 backdrop-blur-xl flex flex-col items-center justify-center p-6">
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center max-w-xl mb-8">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs font-bold uppercase tracking-widest mb-3">
              <Grid className="w-3.5 h-3.5" /> Cyberpunk Tactical Strategy
            </div>
            <h1 className="text-6xl font-black uppercase tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-indigo-500">
              APEX
            </h1>
            <p className="text-sm text-white/60 mt-3">
              Master grid tactics, leverage cover barriers, and manage unit Action Points in turn-based tactical combat.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-lg w-full">
            <button
              onClick={() => startGame("single_campaign")}
              className="p-5 rounded-2xl bg-[#0b0f19] border border-cyan-500/40 hover:border-cyan-400 flex flex-col items-center gap-2 hover:scale-105 transition-all text-center"
            >
              <User className="w-8 h-8 text-cyan-400" />
              <div className="font-black text-lg">AI CAMPAIGN</div>
              <div className="text-xs text-white/50">Tactical simulation vs AI Commander</div>
            </button>

            <button
              onClick={() => startGame("local_duel")}
              className="p-5 rounded-2xl bg-[#0b0f19] border border-rose-500/40 hover:border-rose-400 flex flex-col items-center gap-2 hover:scale-105 transition-all text-center"
            >
              <Users className="w-8 h-8 text-rose-400" />
              <div className="font-black text-lg">2-PLAYER DUEL</div>
              <div className="text-xs text-white/50">Same screen turn-based tactical clash</div>
            </button>
          </div>
        </div>
      )}

      {gameState === "game_over" && (
        <div className="absolute inset-0 z-50 bg-black/85 backdrop-blur-md flex flex-col items-center justify-center p-6">
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center max-w-md w-full">
            <h2 className="text-4xl font-black uppercase text-cyan-400 mb-2">
              {winnerName ? `${winnerName} Victorious!` : "Operation Complete"}
            </h2>
            <p className="text-xs text-white/50 mb-6">Apex Grid Warfare Concluded</p>

            <div className="flex gap-4">
              <button
                onClick={() => startGame(mode)}
                className="flex-1 py-3.5 rounded-xl bg-cyan-500 text-black font-black uppercase"
              >
                REMATCH
              </button>
              <button
                onClick={() => setGameState("menu")}
                className="px-5 py-3.5 rounded-xl bg-white/10 text-white font-bold uppercase"
              >
                MENU
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
