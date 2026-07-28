"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Shield,
  Zap,
  Sword,
  Heart,
  Award,
  Terminal,
  Activity,
  RotateCcw,
  Volume2,
  VolumeX,
  UserCheck,
  Cpu,
  Sparkles,
  ShoppingBag,
  ChevronRight,
  Crosshair,
  Package,
  Layers
} from "lucide-react";
import confetti from "canvas-confetti";

// ==========================================
// TYPES & INTERFACES
// ==========================================
export interface PartyMember {
  id: string;
  name: string;
  role: "Netrunner" | "Enforcer" | "Medic";
  hp: number;
  maxHp: number;
  energy: number;
  maxEnergy: number;
  atk: number;
  def: number;
  spAtk: number;
  skills: { id: string; name: string; cost: number; desc: string }[];
  portraitColor: string;
}

export interface RPGEnemy {
  id: string;
  name: string;
  hp: number;
  maxHp: number;
  atk: number;
  def: number;
  color: string;
  isBoss?: boolean;
}

export interface RPGItem {
  id: string;
  name: string;
  type: "heal" | "energy" | "buff";
  value: number;
  qty: number;
}

// ==========================================
// MAIN COMPONENT
// ==========================================
export default function Sector9RpgGame() {
  const [gameState, setGameState] = useState<"menu" | "dungeon" | "battle" | "victory" | "gameover" | "inventory">("menu");
  const [sectorLevel, setSectorLevel] = useState(1);
  const [credits, setCredits] = useState(250);
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Turn-Based Combat State
  const [turnIndex, setTurnIndex] = useState(0); // 0,1,2 = party, 3 = enemy turn
  const [battleLog, setBattleLog] = useState<string[]>([]);
  const [activeEnemy, setActiveEnemy] = useState<RPGEnemy | null>(null);

  const audioCtxRef = useRef<AudioContext | null>(null);

  // Party Roster
  const [party, setParty] = useState<PartyMember[]>([
    {
      id: "p1",
      name: "KAI (Netrunner)",
      role: "Netrunner",
      hp: 120,
      maxHp: 120,
      energy: 80,
      maxEnergy: 80,
      atk: 24,
      def: 8,
      spAtk: 45,
      skills: [
        { id: "s1", name: "System Hack", cost: 20, desc: "Deals 50 Cyber damage & reduces enemy ATK" },
        { id: "s2", name: "Overclock", cost: 35, desc: "Boosts party ATK by +30% for 3 turns" }
      ],
      portraitColor: "#00f0ff"
    },
    {
      id: "p2",
      name: "VEX (Enforcer)",
      role: "Enforcer",
      hp: 180,
      maxHp: 180,
      energy: 50,
      maxEnergy: 50,
      atk: 38,
      def: 18,
      spAtk: 15,
      skills: [
        { id: "s3", name: "Plasma Slash", cost: 15, desc: "Heavy physical slash dealing 60 damage" },
        { id: "s4", name: "Shield Wall", cost: 25, desc: "Taunts enemy & absorbs 50 damage" }
      ],
      portraitColor: "#a855f7"
    },
    {
      id: "p3",
      name: "LYRA (Medic)",
      role: "Medic",
      hp: 100,
      maxHp: 100,
      energy: 100,
      maxEnergy: 100,
      atk: 15,
      def: 10,
      spAtk: 35,
      skills: [
        { id: "s5", name: "Nano Repair", cost: 25, desc: "Restores +45 HP to all party members" },
        { id: "s6", name: "EMP Blast", cost: 30, desc: "Deals 35 damage & stuns enemy turn" }
      ],
      portraitColor: "#22c55e"
    }
  ]);

  // Inventory
  const [inventory, setInventory] = useState<RPGItem[]>([
    { id: "i1", name: "Health Injector", type: "heal", value: 50, qty: 3 },
    { id: "i2", name: "Energy Battery", type: "energy", value: 40, qty: 2 }
  ]);

  // Audio Synthesizer
  const playSound = useCallback((type: "slash" | "hack" | "heal" | "boss" | "win") => {
    if (!soundEnabled) return;
    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === "suspended") ctx.resume();

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      const now = ctx.currentTime;

      if (type === "slash") {
        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(400, now);
        osc.frequency.exponentialRampToValueAtTime(120, now + 0.15);
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
        osc.start(now);
        osc.stop(now + 0.15);
      } else if (type === "hack") {
        osc.type = "sine";
        osc.frequency.setValueAtTime(800, now);
        osc.frequency.setValueAtTime(1200, now + 0.08);
        gain.gain.setValueAtTime(0.18, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.18);
        osc.start(now);
        osc.stop(now + 0.18);
      } else if (type === "heal") {
        osc.type = "sine";
        osc.frequency.setValueAtTime(523, now);
        osc.frequency.setValueAtTime(659, now + 0.1);
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
        osc.start(now);
        osc.stop(now + 0.2);
      }
    } catch (e) {}
  }, [soundEnabled]);

  // Start Dungeon Encounter
  const startEncounter = (level: number) => {
    const isBoss = level % 3 === 0;
    const enemy: RPGEnemy = {
      id: "enemy-" + Date.now(),
      name: isBoss ? `SECTOR DREADNOUGHT BOSS (LVL ${level})` : `CYBER MECH DRONE (LVL ${level})`,
      hp: isBoss ? 350 + level * 100 : 140 + level * 40,
      maxHp: isBoss ? 350 + level * 100 : 140 + level * 40,
      atk: 18 + level * 6,
      def: 10 + level * 3,
      color: isBoss ? "#ef4444" : "#a855f7",
      isBoss
    };

    setActiveEnemy(enemy);
    setTurnIndex(0);
    setBattleLog([`Engaged hostile ${enemy.name}! Prepare tactical assault.`]);
    setGameState("battle");
  };

  // Execute Basic Attack
  const handleAttack = () => {
    if (!activeEnemy) return;
    const attacker = party[turnIndex];
    const dmg = Math.max(10, attacker.atk - activeEnemy.def / 2);
    const nextEnemyHp = Math.max(0, activeEnemy.hp - dmg);

    playSound("slash");
    setActiveEnemy({ ...activeEnemy, hp: nextEnemyHp });
    addLog(`${attacker.name} executed basic attack for ${Math.floor(dmg)} damage!`);

    if (nextEnemyHp <= 0) {
      handleVictory();
    } else {
      nextTurn();
    }
  };

  // Execute Skill Action
  const handleSkill = (skill: { id: string; name: string; cost: number }) => {
    if (!activeEnemy) return;
    const attacker = party[turnIndex];
    if (attacker.energy < skill.cost) {
      addLog(`Not enough Energy to use ${skill.name}!`);
      return;
    }

    // Deduct Energy
    setParty(prev =>
      prev.map((p, i) => (i === turnIndex ? { ...p, energy: p.energy - skill.cost } : p))
    );

    if (skill.id === "s1" || skill.id === "s3") {
      const dmg = attacker.spAtk + 20;
      const nextEnemyHp = Math.max(0, activeEnemy.hp - dmg);
      playSound("hack");
      setActiveEnemy({ ...activeEnemy, hp: nextEnemyHp });
      addLog(`${attacker.name} unleashed ${skill.name} dealing ${dmg} CRITICAL damage!`);

      if (nextEnemyHp <= 0) {
        handleVictory();
        return;
      }
    } else if (skill.id === "s5") {
      playSound("heal");
      setParty(prev =>
        prev.map(p => ({ ...p, hp: Math.min(p.maxHp, p.hp + 45) }))
      );
      addLog(`${attacker.name} activated Nano Repair, restoring +45 HP to all party members!`);
    }

    nextTurn();
  };

  // Enemy Turn AI
  const executeEnemyTurn = () => {
    if (!activeEnemy || activeEnemy.hp <= 0) return;
    addLog(`--- ENEMY TURN ---`);

    setTimeout(() => {
      // Pick random alive party member
      const targetIdx = Math.floor(Math.random() * party.length);
      const target = party[targetIdx];
      const dmg = Math.max(8, activeEnemy.atk - target.def / 2);

      setParty(prev =>
        prev.map((p, i) => (i === targetIdx ? { ...p, hp: Math.max(0, p.hp - dmg) } : p))
      );

      playSound("slash");
      addLog(`${activeEnemy.name} attacked ${target.name} for ${Math.floor(dmg)} damage!`);

      // Check Party Defeat
      setTimeout(() => {
        const anyAlive = party.some(p => p.hp > 0);
        if (!anyAlive) {
          setGameState("gameover");
        } else {
          setTurnIndex(0); // Return to Kai's turn
        }
      }, 500);
    }, 800);
  };

  const nextTurn = () => {
    const nextIdx = turnIndex + 1;
    if (nextIdx >= party.length) {
      setTurnIndex(3); // Enemy turn
      executeEnemyTurn();
    } else {
      setTurnIndex(nextIdx);
    }
  };

  const addLog = (msg: string) => {
    setBattleLog(prev => [msg, ...prev.slice(0, 5)]);
  };

  const handleVictory = () => {
    confetti({ particleCount: 80, spread: 60 });
    const earnedCreds = 50 * sectorLevel;
    setCredits(c => c + earnedCreds);
    setSectorLevel(l => l + 1);
    setGameState("victory");
  };

  return (
    <div className="relative w-full h-screen bg-black text-white font-sans overflow-hidden select-none flex items-center justify-center">
      <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:24px_24px] opacity-40 pointer-events-none" />

      <div className="relative w-[850px] h-[600px] border border-slate-800 rounded-xl shadow-2xl bg-slate-950 flex flex-col overflow-hidden">
        {/* MAIN MENU */}
        {gameState === "menu" && (
          <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-md flex flex-col items-center justify-center p-8 text-center">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-purple-500 to-cyan-500 flex items-center justify-center shadow-xl shadow-purple-500/30 mb-6">
              <Cpu className="w-8 h-8 text-white" />
            </div>

            <h1 className="text-4xl font-black text-white mb-2 tracking-tight">
              SECTOR 9 <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-cyan-400">CYBER RPG</span>
            </h1>
            <p className="text-slate-400 max-w-md text-sm mb-8">
              Tactical cyberpunk turn-based RPG. Manage party skills, hack enemy defense systems, and conquer sector dungeons.
            </p>

            <button
              onClick={() => startEncounter(1)}
              className="w-64 py-3 rounded-xl bg-gradient-to-r from-purple-500 to-cyan-500 text-slate-950 font-bold text-sm shadow-lg shadow-purple-500/20 hover:opacity-95 transition-all flex items-center justify-center gap-2"
            >
              <Sword className="w-4 h-4" /> ENTER SECTOR DUNGEON
            </button>
          </div>
        )}

        {/* BATTLE SCREEN */}
        {gameState === "battle" && activeEnemy && (
          <div className="flex-1 p-6 flex flex-col justify-between">
            {/* Top Bar Enemy Unit */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 flex justify-between items-center">
              <div>
                <div className="text-xs font-mono font-bold text-purple-400">HOSTILE TARGET</div>
                <div className="text-xl font-black text-white">{activeEnemy.name}</div>
              </div>

              <div className="w-64">
                <div className="flex justify-between text-xs font-mono mb-1">
                  <span className="text-slate-400">HP</span>
                  <span className="text-rose-400 font-bold">{activeEnemy.hp} / {activeEnemy.maxHp}</span>
                </div>
                <div className="h-3 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                  <div
                    className="h-full bg-rose-500 transition-all duration-300"
                    style={{ width: `${(activeEnemy.hp / activeEnemy.maxHp) * 100}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Middle Party Status */}
            <div className="grid grid-cols-3 gap-3">
              {party.map((p, idx) => (
                <div
                  key={p.id}
                  className={`p-3 rounded-xl border transition-all ${
                    turnIndex === idx
                      ? "bg-slate-900 border-cyan-500 shadow-lg shadow-cyan-500/20"
                      : "bg-slate-900/50 border-slate-800 opacity-80"
                  }`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: p.portraitColor }}
                    />
                    <div className="font-bold text-xs text-white">{p.name}</div>
                  </div>

                  <div className="space-y-1.5 text-xs">
                    <div>
                      <div className="flex justify-between text-[10px] text-slate-400">
                        <span>HP</span>
                        <span>{p.hp}/{p.maxHp}</span>
                      </div>
                      <div className="h-1.5 bg-slate-950 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-emerald-500"
                          style={{ width: `${(p.hp / p.maxHp) * 100}%` }}
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-[10px] text-slate-400">
                        <span>EN</span>
                        <span>{p.energy}/{p.maxEnergy}</span>
                      </div>
                      <div className="h-1.5 bg-slate-950 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-cyan-500"
                          style={{ width: `${(p.energy / p.maxEnergy) * 100}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Bottom Actions & Console Log */}
            <div className="grid grid-cols-2 gap-4 h-44">
              {/* Action Buttons */}
              <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
                <div className="text-xs font-mono font-bold text-cyan-400 mb-2">
                  TACTICAL ACTIONS ({turnIndex < 3 ? party[turnIndex].name : "ENEMY TURN..."})
                </div>

                <div className="grid grid-cols-2 gap-2 flex-1">
                  <button
                    disabled={turnIndex >= 3}
                    onClick={handleAttack}
                    className="p-2 rounded-lg bg-slate-800 hover:bg-cyan-500 hover:text-slate-950 font-bold text-xs transition-all flex items-center justify-center gap-1.5"
                  >
                    <Sword className="w-3.5 h-3.5" /> BASIC ATTACK
                  </button>

                  {turnIndex < 3 && party[turnIndex].skills.map(sk => (
                    <button
                      key={sk.id}
                      disabled={party[turnIndex].energy < sk.cost}
                      onClick={() => handleSkill(sk)}
                      className="p-2 rounded-lg bg-slate-800 hover:bg-purple-500 hover:text-slate-950 font-bold text-xs transition-all flex flex-col items-center justify-center"
                    >
                      <span>{sk.name}</span>
                      <span className="text-[9px] text-cyan-400">({sk.cost} EN)</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Console Battle Log */}
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 font-mono text-xs overflow-y-auto space-y-1">
                <div className="text-slate-500 text-[10px] uppercase font-bold">TACTICAL LOG</div>
                {battleLog.map((log, i) => (
                  <div key={i} className="text-slate-300 text-[11px]">
                    &gt; {log}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* VICTORY SCREEN */}
        {gameState === "victory" && (
          <div className="absolute inset-0 bg-slate-950/95 backdrop-blur-md flex flex-col items-center justify-center p-8 text-center">
            <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mb-4">
              <Award className="w-8 h-8" />
            </div>

            <h2 className="text-3xl font-black text-white mb-1">SECTOR VICTORY!</h2>
            <p className="text-slate-400 text-xs mb-6">Cleared Sector Level {sectorLevel - 1}</p>

            <button
              onClick={() => startEncounter(sectorLevel)}
              className="w-64 py-3 rounded-xl bg-gradient-to-r from-purple-500 to-cyan-500 text-slate-950 font-bold text-sm"
            >
              NEXT SECTOR DUNGEON
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
