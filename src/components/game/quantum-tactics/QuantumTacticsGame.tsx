"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Play,
  RotateCcw,
  Volume2,
  VolumeX,
  ArrowLeft,
  Shield,
  Zap,
  Heart,
  Swords,
  Sparkles,
  UserCheck,
  ChevronRight,
  Pause,
  Award,
  Crown,
  Info
} from "lucide-react";
import Link from "next/link";

// ==========================================
// 1. SYNTHETIC AUDIO ENGINE FOR TACTICAL RPG
// ==========================================
class TacticsSoundEngine {
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

  playSlash() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(800, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(150, this.ctx.currentTime + 0.15);

      gain.gain.setValueAtTime(0.25, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.15);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.15);
    } catch (e) {}
  }

  playSpell() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(400, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1200, this.ctx.currentTime + 0.25);

      gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.25);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.25);
    } catch (e) {}
  }

  playHeal() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;
    try {
      const notes = [440, 554.37, 659.25, 880];
      notes.forEach((freq, i) => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();
        osc.type = "triangle";
        osc.frequency.setValueAtTime(freq, this.ctx!.currentTime + i * 0.08);

        gain.gain.setValueAtTime(0.18, this.ctx!.currentTime + i * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx!.currentTime + i * 0.08 + 0.12);

        osc.connect(gain);
        gain.connect(this.ctx!.destination);
        osc.start(this.ctx!.currentTime + i * 0.08);
        osc.stop(this.ctx!.currentTime + i * 0.08 + 0.12);
      });
    } catch (e) {}
  }

  playTurnChange() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(523.25, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(659.25, this.ctx.currentTime + 0.1);

      gain.gain.setValueAtTime(0.15, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.1);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.1);
    } catch (e) {}
  }

  playVictory() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;
    try {
      const notes = [523.25, 659.25, 783.99, 1046.5];
      notes.forEach((freq, i) => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, this.ctx!.currentTime + i * 0.1);

        gain.gain.setValueAtTime(0.2, this.ctx!.currentTime + i * 0.1);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx!.currentTime + i * 0.1 + 0.2);

        osc.connect(gain);
        gain.connect(this.ctx!.destination);
        osc.start(this.ctx!.currentTime + i * 0.1);
        osc.stop(this.ctx!.currentTime + i * 0.1 + 0.2);
      });
    } catch (e) {}
  }
}

const soundEngine = new TacticsSoundEngine();

// ==========================================
// 2. DATA STRUCTURES & TYPES
// ==========================================
export interface Unit {
  id: string;
  name: string;
  role: "samurai" | "hacker" | "medic" | "enemy_grunt" | "enemy_boss";
  isHero: boolean;
  hp: number;
  maxHp: number;
  ap: number;
  maxAp: number;
  attack: number;
  defense: number;
  range: number;
  x: number;
  y: number;
  color: string;
  abilities: {
    name: string;
    cost: number;
    description: string;
    type: "attack" | "heal" | "buff";
  }[];
}

export interface Stage {
  id: number;
  title: string;
  gridWidth: number;
  gridHeight: number;
  enemies: Omit<Unit, "id">[];
  obstacles: [number, number][];
}

export const CAMPAIGN_STAGES: Stage[] = [
  {
    id: 1,
    title: "Stage 1: Outpost Ambush",
    gridWidth: 8,
    gridHeight: 8,
    obstacles: [[3, 3], [3, 4], [4, 3]],
    enemies: [
      {
        name: "Cyber Drone",
        role: "enemy_grunt",
        isHero: false,
        hp: 60,
        maxHp: 60,
        ap: 3,
        maxAp: 3,
        attack: 18,
        defense: 5,
        range: 2,
        x: 6,
        y: 2,
        color: "#ff0055",
        abilities: [{ name: "Laser Shot", cost: 2, description: "Basic ranged blast", type: "attack" }],
      },
      {
        name: "Enforcer Mech",
        role: "enemy_grunt",
        isHero: false,
        hp: 90,
        maxHp: 90,
        ap: 3,
        maxAp: 3,
        attack: 22,
        defense: 10,
        range: 1,
        x: 6,
        y: 5,
        color: "#ff3300",
        abilities: [{ name: "Heavy Strike", cost: 2, description: "Melee crushing attack", type: "attack" }],
      },
    ],
  },
  {
    id: 2,
    title: "Stage 2: Core Sector Rampart",
    gridWidth: 8,
    gridHeight: 8,
    obstacles: [[2, 2], [2, 5], [5, 2], [5, 5]],
    enemies: [
      {
        name: "Plasma Sentinel",
        role: "enemy_grunt",
        isHero: false,
        hp: 100,
        maxHp: 100,
        ap: 4,
        maxAp: 4,
        attack: 25,
        defense: 8,
        range: 3,
        x: 7,
        y: 1,
        color: "#ff0077",
        abilities: [{ name: "Plasma Ray", cost: 2, description: "Ranged energy ray", type: "attack" }],
      },
      {
        name: "Quantum Goliath",
        role: "enemy_boss",
        isHero: false,
        hp: 180,
        maxHp: 180,
        ap: 4,
        maxAp: 4,
        attack: 32,
        defense: 15,
        range: 1,
        x: 7,
        y: 6,
        color: "#aa00ff",
        abilities: [{ name: "Quake Slam", cost: 3, description: "Devastating slam", type: "attack" }],
      },
    ],
  },
];

// Initial Hero Squad Template
const INITIAL_HEROES: Omit<Unit, "id" | "x" | "y">[] = [
  {
    name: "Ren (Samurai)",
    role: "samurai",
    isHero: true,
    hp: 120,
    maxHp: 120,
    ap: 4,
    maxAp: 4,
    attack: 35,
    defense: 12,
    range: 1,
    color: "#00f0ff",
    abilities: [
      { name: "Plasma Blade", cost: 2, description: "Heavy cyber blade slash", type: "attack" },
      { name: "Blade Dash", cost: 3, description: "High damage leap strike", type: "attack" },
    ],
  },
  {
    name: "Vex (Hacker)",
    role: "hacker",
    isHero: true,
    hp: 90,
    maxHp: 90,
    ap: 5,
    maxAp: 5,
    attack: 28,
    defense: 6,
    range: 4,
    color: "#00ffcc",
    abilities: [
      { name: "EMP Blast", cost: 2, description: "Long range electronic disruption", type: "attack" },
      { name: "Overclock", cost: 3, description: "Buff ally attack & AP", type: "buff" },
    ],
  },
  {
    name: "Aria (Medic)",
    role: "medic",
    isHero: true,
    hp: 100,
    maxHp: 100,
    ap: 4,
    maxAp: 4,
    attack: 18,
    defense: 8,
    range: 3,
    color: "#a000ff",
    abilities: [
      { name: "Nanite Heal", cost: 2, description: "Restore 45 HP to ally", type: "heal" },
      { name: "Shield Beam", cost: 2, description: "Ranged light attack", type: "attack" },
    ],
  },
];

// ==========================================
// 3. MAIN TACTICAL RPG COMPONENT
// ==========================================
export default function QuantumTacticsGame() {
  const [gameState, setGameState] = useState<"menu" | "playing" | "victory" | "defeat">("menu");
  const [stageIndex, setStageIndex] = useState<number>(0);
  const [units, setUnits] = useState<Unit[]>([]);
  const [selectedUnitId, setSelectedUnitId] = useState<string | null>(null);
  const [targetUnitId, setTargetUnitId] = useState<string | null>(null);
  const [turn, setTurn] = useState<"player" | "enemy">("player");
  const [logMessages, setLogMessages] = useState<string[]>([]);
  const [isMuted, setIsMuted] = useState<boolean>(false);

  const currentStage = CAMPAIGN_STAGES[stageIndex];

  // Initialize Stage Setup
  const setupStage = (sIdx: number) => {
    soundEngine.init();
    setStageIndex(sIdx);
    const stg = CAMPAIGN_STAGES[sIdx];

    // Spawn Heroes at left side of grid
    const heroUnits: Unit[] = INITIAL_HEROES.map((hero, idx) => ({
      ...hero,
      id: `hero-${idx}`,
      x: 0,
      y: idx * 2 + 1,
    }));

    // Spawn Enemies at right side of grid
    const enemyUnits: Unit[] = stg.enemies.map((e, idx) => ({
      ...e,
      id: `enemy-${idx}`,
    }));

    setUnits([...heroUnits, ...enemyUnits]);
    setSelectedUnitId(heroUnits[0].id);
    setTurn("player");
    setLogMessages([`Combat Engaged: ${stg.title}`]);
    setGameState("playing");
  };

  // Helper log message adder
  const addLog = (msg: string) => {
    setLogMessages(prev => [msg, ...prev.slice(0, 4)]);
  };

  // Select Unit Handler
  const handleTileClick = (x: number, y: number) => {
    if (gameState !== "playing" || turn !== "player") return;

    const clickedUnit = units.find(u => u.x === x && u.y === y && u.hp > 0);
    const activeUnit = units.find(u => u.id === selectedUnitId);

    if (clickedUnit) {
      if (clickedUnit.isHero) {
        setSelectedUnitId(clickedUnit.id);
        setTargetUnitId(null);
      } else if (activeUnit && activeUnit.isHero) {
        // Target enemy for attack
        setTargetUnitId(clickedUnit.id);
      }
    } else if (activeUnit && activeUnit.isHero && activeUnit.ap >= 1) {
      // Check if tile is obstacle
      const isObstacle = currentStage.obstacles.some(([ox, oy]) => ox === x && oy === y);
      if (isObstacle) return;

      // Distance calculation
      const dist = Math.abs(activeUnit.x - x) + Math.abs(activeUnit.y - y);
      if (dist <= activeUnit.ap) {
        // Move active unit to tile
        setUnits(prev =>
          prev.map(u => (u.id === activeUnit.id ? { ...u, x, y, ap: u.ap - dist } : u))
        );
        soundEngine.playTurnChange();
        addLog(`${activeUnit.name} moved to (${x}, ${y})`);
      }
    }
  };

  // Perform Attack Action
  const executeAttack = (abilityIndex: number = 0) => {
    const attacker = units.find(u => u.id === selectedUnitId);
    const defender = units.find(u => u.id === targetUnitId);

    if (!attacker || !defender || attacker.ap < 2) return;

    const dist = Math.abs(attacker.x - defender.x) + Math.abs(attacker.y - defender.y);
    if (dist > attacker.range) {
      addLog(`Target out of range! (${dist} tiles away)`);
      return;
    }

    const ability = attacker.abilities[abilityIndex] || attacker.abilities[0];
    const dmg = Math.max(10, attacker.attack + Math.floor(Math.random() * 10) - defender.defense);

    soundEngine.playSlash();

    setUnits(prev =>
      prev.map(u => {
        if (u.id === attacker.id) return { ...u, ap: u.ap - ability.cost };
        if (u.id === defender.id) return { ...u, hp: Math.max(0, u.hp - dmg) };
        return u;
      })
    );

    addLog(`${attacker.name} used ${ability.name} on ${defender.name} for ${dmg} damage!`);

    // Check Victory/Defeat
    setTimeout(() => checkBattleStatus(), 300);
  };

  // Perform Heal Action
  const executeHeal = () => {
    const healer = units.find(u => u.id === selectedUnitId);
    if (!healer || healer.role !== "medic" || healer.ap < 2) return;

    soundEngine.playHeal();
    const healAmount = 45;

    setUnits(prev =>
      prev.map(u => {
        if (u.id === healer.id) return { ...u, ap: u.ap - 2 };
        if (u.isHero) return { ...u, hp: Math.min(u.maxHp, u.hp + healAmount) };
        return u;
      })
    );

    addLog(`${healer.name} healed squad heroes for +${healAmount} HP!`);
  };

  // End Turn Handler & Enemy AI Engine
  const endTurn = () => {
    if (turn === "player") {
      setTurn("enemy");
      addLog("--- ENEMY AI TURN ---");

      // Reset enemy AP
      setUnits(prev => prev.map(u => (!u.isHero ? { ...u, ap: u.maxAp } : u)));

      // Execute AI Actions
      setTimeout(() => {
        runEnemyAI();
      }, 600);
    }
  };

  // Enemy AI Logic
  const runEnemyAI = () => {
    let currentUnits = [...units];
    const enemies = currentUnits.filter(u => !u.isHero && u.hp > 0);
    const heroes = currentUnits.filter(u => u.isHero && u.hp > 0);

    if (heroes.length === 0) {
      setGameState("defeat");
      return;
    }

    enemies.forEach(enemy => {
      // Find closest hero
      let closestHero = heroes[0];
      let minDist = 999;

      heroes.forEach(h => {
        const d = Math.abs(enemy.x - h.x) + Math.abs(enemy.y - h.y);
        if (d < minDist) {
          minDist = d;
          closestHero = h;
        }
      });

      // Attack if in range, otherwise move closer
      if (minDist <= enemy.range) {
        const dmg = Math.max(8, enemy.attack - closestHero.defense);
        soundEngine.playSlash();
        currentUnits = currentUnits.map(u =>
          u.id === closestHero.id ? { ...u, hp: Math.max(0, u.hp - dmg) } : u
        );
        addLog(`${enemy.name} attacked ${closestHero.name} for ${dmg} DMG!`);
      } else {
        // Move towards hero
        const dx = Math.sign(closestHero.x - enemy.x);
        const dy = Math.sign(closestHero.y - enemy.y);

        const newX = enemy.x + dx;
        const newY = enemy.y + dy;

        currentUnits = currentUnits.map(u => (u.id === enemy.id ? { ...u, x: newX, y: newY } : u));
        addLog(`${enemy.name} advanced towards ${closestHero.name}`);
      }
    });

    // Reset player AP and return control to player
    currentUnits = currentUnits.map(u => (u.isHero ? { ...u, ap: u.maxAp } : u));
    setUnits(currentUnits);
    setTurn("player");
    addLog("--- PLAYER TURN ---");

    // Check defeat
    const aliveHeroes = currentUnits.filter(u => u.isHero && u.hp > 0);
    if (aliveHeroes.length === 0) {
      setGameState("defeat");
    }
  };

  // Check battle status (victory / defeat)
  const checkBattleStatus = () => {
    setUnits(latestUnits => {
      const aliveEnemies = latestUnits.filter(u => !u.isHero && u.hp > 0);
      const aliveHeroes = latestUnits.filter(u => u.isHero && u.hp > 0);

      if (aliveEnemies.length === 0) {
        soundEngine.playVictory();
        setGameState("victory");
      } else if (aliveHeroes.length === 0) {
        setGameState("defeat");
      }
      return latestUnits;
    });
  };

  const activeUnit = units.find(u => u.id === selectedUnitId);

  return (
    <div className="relative w-full h-screen bg-black overflow-hidden font-sans select-none text-white flex flex-col items-center justify-center">
      {/* HEADER HUD */}
      {gameState === "playing" && (
        <div className="absolute top-0 left-0 right-0 p-6 z-20 flex justify-between items-center bg-gradient-to-b from-black/80 to-transparent">
          <div className="flex items-center gap-6">
            <button
              onClick={() => setGameState("menu")}
              className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-white/60 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-4 h-4" /> Menu
            </button>
            <span className="text-cyan-400 font-black text-sm uppercase">{currentStage.title}</span>
          </div>

          <div className="flex items-center gap-4">
            <span
              className={`px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest ${
                turn === "player"
                  ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/40"
                  : "bg-rose-500/20 text-rose-400 border border-rose-500/40 animate-pulse"
              }`}
            >
              {turn === "player" ? "PLAYER TURN" : "ENEMY TURN"}
            </span>
            <button
              onClick={endTurn}
              disabled={turn !== "player"}
              className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 font-black text-xs uppercase tracking-wider transition-all disabled:opacity-50"
            >
              End Turn
            </button>
          </div>
        </div>
      )}

      {/* TACTICAL GRID BATTLEFIELD */}
      {gameState === "playing" && (
        <div className="relative flex flex-col items-center gap-6">
          <div className="bg-zinc-950 p-6 rounded-3xl border-2 border-white/10 shadow-[0_0_50px_rgba(0,240,255,0.1)]">
            <div
              className="grid gap-2"
              style={{
                gridTemplateColumns: `repeat(${currentStage.gridWidth}, minmax(0, 1fr))`,
              }}
            >
              {Array.from({ length: currentStage.gridHeight }).map((_, r) =>
                Array.from({ length: currentStage.gridWidth }).map((_, c) => {
                  const unitOnTile = units.find(u => u.x === c && u.y === r && u.hp > 0);
                  const isObstacle = currentStage.obstacles.some(([ox, oy]) => ox === c && oy === r);
                  const isSelected = activeUnit && activeUnit.x === c && activeUnit.y === r;

                  return (
                    <button
                      key={`${r}-${c}`}
                      onClick={() => handleTileClick(c, r)}
                      className={`w-16 h-16 rounded-xl border flex flex-col items-center justify-center relative transition-all ${
                        isSelected
                          ? "border-cyan-400 bg-cyan-500/20 shadow-[0_0_15px_rgba(0,240,255,0.4)]"
                          : isObstacle
                          ? "border-zinc-800 bg-zinc-900/80 cursor-not-allowed"
                          : "border-white/10 bg-white/5 hover:border-cyan-500/40"
                      }`}
                    >
                      {/* Grid Tile Coordinate Indicator */}
                      <span className="absolute top-1 left-1 text-[9px] text-white/20 font-mono">
                        {c},{r}
                      </span>

                      {/* Render Unit Icon on Tile */}
                      {unitOnTile && (
                        <div
                          className="w-10 h-10 rounded-full border-2 flex items-center justify-center relative"
                          style={{
                            borderColor: unitOnTile.color,
                            backgroundColor: `${unitOnTile.color}33`,
                          }}
                        >
                          <span className="text-[10px] font-black uppercase">
                            {unitOnTile.name.substring(0, 2)}
                          </span>

                          {/* Unit HP Bar */}
                          <div className="absolute -bottom-1.5 left-0 right-0 h-1.5 bg-black rounded-full overflow-hidden border border-white/20">
                            <div
                              className="h-full bg-emerald-400"
                              style={{ width: `${(unitOnTile.hp / unitOnTile.maxHp) * 100}%` }}
                            />
                          </div>
                        </div>
                      )}
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* LOWER ACTION CONTROL PANEL */}
          {activeUnit && activeUnit.isHero && (
            <div className="bg-zinc-900 border border-white/10 p-4 rounded-2xl max-w-2xl w-full flex items-center justify-between">
              <div>
                <span className="text-xs font-black uppercase tracking-wider text-cyan-400 block">
                  {activeUnit.name}
                </span>
                <div className="flex items-center gap-4 text-xs text-white/60 mt-1">
                  <span>HP: {activeUnit.hp} / {activeUnit.maxHp}</span>
                  <span className="text-amber-400 font-bold">AP: {activeUnit.ap} / {activeUnit.maxAp}</span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                {targetUnitId && (
                  <button
                    onClick={() => executeAttack(0)}
                    disabled={activeUnit.ap < 2}
                    className="px-4 py-2 bg-rose-600 hover:bg-rose-500 font-black text-xs uppercase tracking-wider rounded-xl transition-all disabled:opacity-40"
                  >
                    Attack Target (2 AP)
                  </button>
                )}
                {activeUnit.role === "medic" && (
                  <button
                    onClick={executeHeal}
                    disabled={activeUnit.ap < 2}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 font-black text-xs uppercase tracking-wider rounded-xl transition-all disabled:opacity-40"
                  >
                    Group Heal (2 AP)
                  </button>
                )}
              </div>
            </div>
          )}

          {/* COMBAT LOG */}
          <div className="bg-black/60 border border-white/10 p-3 rounded-xl max-w-2xl w-full text-xs font-mono text-white/60 space-y-1">
            {logMessages.map((msg, i) => (
              <div key={i}>{msg}</div>
            ))}
          </div>
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
                <Swords className="w-4 h-4" /> Tactical Turn-Based RPG
              </div>

              <h1 className="text-6xl font-black tracking-tighter uppercase mb-4 bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 via-indigo-500 to-purple-500">
                QUANTUM TACTICS
              </h1>
              <p className="text-white/60 text-sm mb-8 leading-relaxed">
                Command a cyber samurai squad on tactical grids. Position your heroes, manage action points, unleash elemental spells, and outsmart enemy AI mechs.
              </p>

              <button
                onClick={() => setupStage(0)}
                className="w-full py-4 bg-gradient-to-r from-cyan-500 to-indigo-600 rounded-full font-black uppercase tracking-widest hover:scale-105 transition-all shadow-[0_0_40px_rgba(0,240,255,0.4)] flex items-center justify-center gap-3 text-base"
              >
                <Play className="w-5 h-5 fill-white" /> Start Campaign
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* OVERLAY 2: VICTORY SCREEN */}
      <AnimatePresence>
        {gameState === "victory" && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-40 bg-black/90 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center"
          >
            <div className="bg-zinc-950 border border-white/10 p-8 rounded-3xl max-w-md w-full">
              <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center mx-auto mb-4">
                <Crown className="w-8 h-8 text-emerald-400" />
              </div>

              <h2 className="text-3xl font-black uppercase tracking-wider text-emerald-400 mb-2">
                STAGE VICTORY!
              </h2>
              <p className="text-xs text-white/50 uppercase tracking-widest mb-6">Enemy Forces Eliminated</p>

              <div className="space-y-3">
                {stageIndex + 1 < CAMPAIGN_STAGES.length ? (
                  <button
                    onClick={() => setupStage(stageIndex + 1)}
                    className="w-full py-4 bg-cyan-500 text-black font-black uppercase tracking-widest rounded-xl hover:bg-cyan-400 transition-all flex items-center justify-center gap-2"
                  >
                    Next Stage <ChevronRight className="w-5 h-5" />
                  </button>
                ) : (
                  <button
                    onClick={() => setGameState("menu")}
                    className="w-full py-4 bg-emerald-500 text-black font-black uppercase tracking-widest rounded-xl hover:bg-emerald-400 transition-all"
                  >
                    Campaign Completed!
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
