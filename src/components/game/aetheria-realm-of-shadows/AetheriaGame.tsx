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
  ShoppingBag,
  ArrowLeft,
  Flame,
  Swords,
  Heart,
  Skull,
  User,
  BookOpen,
  Award,
  Package,
  Compass
} from "lucide-react";
import Link from "next/link";

// ==========================================
// TYPES & DATA STRUCTURES
// ==========================================
export type HeroClassType = "paladin" | "archmage" | "assassin";

export interface Item {
  id: string;
  name: string;
  type: "weapon" | "armor" | "potion" | "key";
  value: number;
  statBonus: number;
  description: string;
}

export interface Spell {
  id: string;
  name: string;
  manaCost: number;
  damage: number;
  element: "fire" | "ice" | "holy" | "shadow";
  description: string;
}

export interface HeroState {
  classType: HeroClassType;
  name: string;
  level: number;
  xp: number;
  maxXp: number;
  hp: number;
  maxHp: number;
  mana: number;
  maxMana: number;
  atk: number;
  def: number;
  gold: number;
  x: number;
  y: number;
  inventory: Item[];
  spells: Spell[];
}

export interface Monster {
  id: string;
  name: string;
  hp: number;
  maxHp: number;
  atk: number;
  def: number;
  xpReward: number;
  goldReward: number;
  isBoss?: boolean;
  color: string;
}

export interface TileMap {
  floor: number;
  width: number;
  height: number;
  grid: number[][]; // 0: floor, 1: wall, 2: chest, 3: door, 4: portal
}

// SPELL DATABASE
const SPELLS: Record<HeroClassType, Spell[]> = {
  paladin: [
    { id: "s1", name: "Holy Strike", manaCost: 15, damage: 35, element: "holy", description: "Smite foes with holy radiance." },
    { id: "s2", name: "Divine Shield", manaCost: 25, damage: 0, element: "holy", description: "Restore 40 HP and boost defense." }
  ],
  archmage: [
    { id: "s3", name: "Fireball", manaCost: 20, damage: 55, element: "fire", description: "Hurl a searing orb of flame." },
    { id: "s4", name: "Frost Nova", manaCost: 30, damage: 45, element: "ice", description: "Freeze foes with absolute zero." }
  ],
  assassin: [
    { id: "s5", name: "Shadow Blade", manaCost: 15, damage: 45, element: "shadow", description: "Strike from darkness with critical damage." },
    { id: "s6", name: "Venom Burst", manaCost: 25, damage: 60, element: "shadow", description: "Infuse daggers with deadly venom." }
  ]
};

// AUDIO SYNTHESIZER
class RPGAudioEngine {
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

  public playAttack() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(400, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(100, this.ctx.currentTime + 0.1);
      gain.gain.setValueAtTime(0.25, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.1);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.1);
    } catch {}
  }

  public playSpell() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(600, this.ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(1200, this.ctx.currentTime + 0.2);
      gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.2);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.2);
    } catch {}
  }

  public playLoot() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(523, this.ctx.currentTime);
      osc.frequency.setValueAtTime(659, this.ctx.currentTime + 0.08);
      gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.18);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.18);
    } catch {}
  }
}

const audio = new RPGAudioEngine();

export default function AetheriaGame() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // States
  const [gameState, setGameState] = useState<"menu" | "select_class" | "exploring" | "combat" | "inventory" | "gameover" | "victory">("menu");
  const [isMuted, setIsMuted] = useState(false);
  const [currentFloor, setCurrentFloor] = useState(1);
  const [combatLog, setCombatLog] = useState<string[]>([]);
  const [activeMonster, setActiveMonster] = useState<Monster | null>(null);

  const [hero, setHero] = useState<HeroState>({
    classType: "paladin",
    name: "Sir Gareth",
    level: 1,
    xp: 0,
    maxXp: 100,
    hp: 120,
    maxHp: 120,
    mana: 50,
    maxMana: 50,
    atk: 25,
    def: 10,
    gold: 50,
    x: 2,
    y: 2,
    inventory: [
      { id: "p1", name: "Health Elixir", type: "potion", value: 30, statBonus: 40, description: "Restores 40 HP" }
    ],
    spells: SPELLS.paladin
  });

  const toggleMute = () => {
    const next = !isMuted;
    setIsMuted(next);
    audio.setMuted(next);
  };

  const selectHeroClass = (cls: HeroClassType) => {
    const baseStats =
      cls === "paladin" ? { hp: 140, mana: 40, atk: 28, def: 14 } :
      cls === "archmage" ? { hp: 90, mana: 100, atk: 35, def: 6 } :
      { hp: 110, mana: 60, atk: 32, def: 8 };

    setHero({
      classType: cls,
      name: cls === "paladin" ? "Sir Gareth" : cls === "archmage" ? "Archmage Valerius" : "Shadow Kael",
      level: 1,
      xp: 0,
      maxXp: 100,
      hp: baseStats.hp,
      maxHp: baseStats.hp,
      mana: baseStats.mana,
      maxMana: baseStats.mana,
      atk: baseStats.atk,
      def: baseStats.def,
      gold: 50,
      x: 2,
      y: 2,
      inventory: [
        { id: "p1", name: "Health Elixir", type: "potion", value: 30, statBonus: 50, description: "Restores 50 HP" }
      ],
      spells: SPELLS[cls]
    });

    setCurrentFloor(1);
    setGameState("exploring");
  };

  // Keyboard Movement & Exploration
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (gameState !== "exploring") return;
      const k = e.key.toLowerCase();

      let dx = 0;
      let dy = 0;
      if (k === "w" || k === "arrowup") dy = -1;
      if (k === "s" || k === "arrowdown") dy = 1;
      if (k === "a" || k === "arrowleft") dx = -1;
      if (k === "d" || k === "arrowright") dx = 1;

      if (dx !== 0 || dy !== 0) {
        moveHero(dx, dy);
      }

      if (k === "i") setGameState("inventory");
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [gameState, hero]);

  const moveHero = (dx: number, dy: number) => {
    const nx = hero.x + dx;
    const ny = hero.y + dy;

    // Boundaries
    if (nx < 1 || nx > 14 || ny < 1 || ny > 9) return;

    setHero((prev) => ({ ...prev, x: nx, y: ny }));

    // Random Encounter Check (20% chance)
    if (Math.random() < 0.20) {
      triggerCombat();
    }
  };

  const triggerCombat = () => {
    const isBoss = currentFloor === 5;
    const monsterName = isBoss ? "Shadow Oni Lord" : currentFloor === 1 ? "Goblin Scout" : currentFloor === 2 ? "Skeleton Warrior" : "Dungeon Specter";
    const hp = isBoss ? 350 : 40 + currentFloor * 20;

    const monster: Monster = {
      id: "m_" + Math.random(),
      name: monsterName,
      hp,
      maxHp: hp,
      atk: 10 + currentFloor * 5,
      def: 2 + currentFloor * 2,
      xpReward: 35 * currentFloor,
      goldReward: 25 * currentFloor,
      isBoss,
      color: isBoss ? "#ec4899" : "#f43f5e"
    };

    setActiveMonster(monster);
    setCombatLog([`Encountered ${monster.name}! Prepare for battle.`]);
    setGameState("combat");
  };

  const attackMonster = () => {
    if (!activeMonster) return;
    audio.playAttack();

    const damage = Math.max(5, hero.atk - activeMonster.def + Math.floor(Math.random() * 8));
    const newMonsterHp = Math.max(0, activeMonster.hp - damage);

    const log = [`You strike ${activeMonster.name} for ${damage} damage!`];

    if (newMonsterHp <= 0) {
      // Monster defeated!
      log.push(`Defeated ${activeMonster.name}! +${activeMonster.xpReward} XP, +${activeMonster.goldReward} Gold.`);
      setCombatLog(log);

      audio.playLoot();
      handleVictoryRewards(activeMonster.xpReward, activeMonster.goldReward, activeMonster.isBoss);
      return;
    }

    // Monster Retaliation
    const monsterDmg = Math.max(3, activeMonster.atk - hero.def + Math.floor(Math.random() * 6));
    const newHeroHp = Math.max(0, hero.hp - monsterDmg);

    log.push(`${activeMonster.name} attacks you for ${monsterDmg} damage!`);
    setCombatLog(log);

    setActiveMonster((prev) => prev ? { ...prev, hp: newMonsterHp } : null);
    setHero((prev) => ({ ...prev, hp: newHeroHp }));

    if (newHeroHp <= 0) {
      setGameState("gameover");
    }
  };

  const castSpell = (spell: Spell) => {
    if (!activeMonster) return;
    if (hero.mana < spell.manaCost) {
      setCombatLog((prev) => [...prev, "Not enough mana!"]);
      return;
    }

    audio.playSpell();
    setHero((prev) => ({ ...prev, mana: prev.mana - spell.manaCost }));

    if (spell.damage > 0) {
      const damage = spell.damage + Math.floor(Math.random() * 10);
      const newMonsterHp = Math.max(0, activeMonster.hp - damage);
      const log = [`Cast ${spell.name}! Dealt ${damage} elemental damage!`];

      if (newMonsterHp <= 0) {
        log.push(`Defeated ${activeMonster.name}!`);
        setCombatLog(log);
        handleVictoryRewards(activeMonster.xpReward, activeMonster.goldReward, activeMonster.isBoss);
        return;
      }
      setActiveMonster((prev) => prev ? { ...prev, hp: newMonsterHp } : null);
      setCombatLog(log);
    } else {
      // Heal spell
      const heal = 45;
      setHero((prev) => ({ ...prev, hp: Math.min(prev.maxHp, prev.hp + heal) }));
      setCombatLog((prev) => [...prev, `Cast ${spell.name}! Restored ${heal} HP!`]);
    }
  };

  const handleVictoryRewards = (xp: number, gold: number, isBoss?: boolean) => {
    setTimeout(() => {
      let newXp = hero.xp + xp;
      let newLevel = hero.level;
      let maxXp = hero.maxXp;
      let newAtk = hero.atk;
      let newMaxHp = hero.maxHp;

      if (newXp >= maxXp) {
        newLevel++;
        newXp -= maxXp;
        maxXp = Math.round(maxXp * 1.5);
        newAtk += 8;
        newMaxHp += 20;
      }

      setHero((prev) => ({
        ...prev,
        xp: newXp,
        level: newLevel,
        maxXp,
        atk: newAtk,
        maxHp: newMaxHp,
        hp: newMaxHp,
        gold: prev.gold + gold
      }));

      if (isBoss) {
        setGameState("victory");
      } else {
        setGameState("exploring");
      }
    }, 1200);
  };

  // Render Dungeon Exploration Canvas
  useEffect(() => {
    if (gameState !== "exploring") return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.fillStyle = "#09090b";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const tileSize = 48;
    // Draw Floor Grid
    for (let r = 0; r < 10; r++) {
      for (let c = 0; c < 15; c++) {
        ctx.strokeStyle = "rgba(168, 85, 247, 0.1)";
        ctx.lineWidth = 1;
        ctx.strokeRect(c * tileSize + 40, r * tileSize + 40, tileSize, tileSize);
      }
    }

    // Hero Icon
    ctx.fillStyle = "#a855f7";
    ctx.shadowColor = "#a855f7";
    ctx.shadowBlur = 15;
    ctx.beginPath();
    ctx.arc(hero.x * tileSize + 40 + tileSize / 2, hero.y * tileSize + 40 + tileSize / 2, 16, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
  }, [gameState, hero]);

  useEffect(() => {
    if (canvasRef.current) {
      canvasRef.current.width = 800;
      canvasRef.current.height = 560;
    }
  }, []);

  return (
    <div className="relative w-full h-screen bg-black overflow-hidden select-none font-sans text-white flex flex-col items-center justify-center">
      {/* CANVAS CONTAINER */}
      <div className="relative w-[800px] h-[560px] bg-zinc-950 border border-purple-500/30 rounded-3xl overflow-hidden shadow-[0_0_50px_rgba(168,85,247,0.15)] flex flex-col justify-between">
        <canvas ref={canvasRef} className="w-full h-full block" />

        {/* HUD OVERLAY */}
        {gameState === "exploring" && (
          <div className="absolute top-4 left-6 right-6 flex justify-between items-center pointer-events-none z-10">
            <div className="flex items-center gap-4 bg-black/70 backdrop-blur-md px-5 py-2.5 rounded-2xl border border-purple-500/30">
              <span className="text-xs font-bold uppercase tracking-wider text-purple-400">
                FLOOR {currentFloor}: {hero.name} (LVL {hero.level})
              </span>
              <div className="flex items-center gap-2 text-rose-400 font-bold text-xs">
                <Heart className="w-3.5 h-3.5" /> {hero.hp} / {hero.maxHp}
              </div>
              <div className="flex items-center gap-2 text-cyan-400 font-bold text-xs">
                <Zap className="w-3.5 h-3.5" /> {hero.mana} / {hero.maxMana}
              </div>
            </div>

            <div className="flex items-center gap-2 pointer-events-auto">
              <button onClick={() => setGameState("inventory")} className="p-2.5 bg-black/50 hover:bg-black/80 border border-white/20 rounded-xl flex items-center gap-1.5 text-xs font-bold">
                <Package className="w-4 h-4 text-purple-400" /> Items
              </button>
              <button onClick={toggleMute} className="p-2.5 bg-black/50 hover:bg-black/80 border border-white/20 rounded-xl">
                {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-purple-400" />}
              </button>
            </div>
          </div>
        )}

        {/* COMBAT OVERLAY */}
        {gameState === "combat" && activeMonster && (
          <div className="absolute inset-0 bg-black/90 backdrop-blur-md z-20 flex flex-col justify-between p-8">
            <div className="flex justify-between items-start">
              {/* Hero Status */}
              <div className="bg-white/5 border border-purple-500/30 p-4 rounded-2xl w-64">
                <div className="font-bold text-purple-400 text-sm">{hero.name}</div>
                <div className="text-xs text-zinc-400 mb-2">Level {hero.level} {hero.classType}</div>
                <div className="text-xs font-bold text-rose-400">HP: {hero.hp} / {hero.maxHp}</div>
                <div className="text-xs font-bold text-cyan-400">Mana: {hero.mana} / {hero.maxMana}</div>
              </div>

              {/* Monster Status */}
              <div className="bg-white/5 border border-rose-500/30 p-4 rounded-2xl w-64 text-right">
                <div className="font-bold text-rose-400 text-sm">{activeMonster.name}</div>
                <div className="text-xs text-zinc-400 mb-2">{activeMonster.isBoss ? "DUNGEON BOSS" : "FOE"}</div>
                <div className="text-xs font-bold text-rose-400">HP: {activeMonster.hp} / {activeMonster.maxHp}</div>
              </div>
            </div>

            {/* Combat Logs */}
            <div className="bg-black/80 border border-white/10 p-4 rounded-2xl h-32 overflow-y-auto font-mono text-xs text-zinc-300">
              {combatLog.map((log, idx) => (
                <div key={idx} className="mb-1">{log}</div>
              ))}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                onClick={attackMonster}
                className="flex-1 py-3.5 bg-rose-500 hover:bg-rose-400 font-black uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-2"
              >
                <Swords className="w-4 h-4" /> Melee Strike
              </button>
              {hero.spells.map((spell) => (
                <button
                  key={spell.id}
                  onClick={() => castSpell(spell)}
                  className="flex-1 py-3.5 bg-purple-600 hover:bg-purple-500 font-black uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-2"
                >
                  <Zap className="w-4 h-4" /> {spell.name} ({spell.manaCost} MP)
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* START MENU */}
      {gameState === "menu" && (
        <div className="absolute inset-0 z-30 bg-gradient-to-br from-black via-zinc-950 to-purple-950 flex flex-col items-center justify-center p-6">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="max-w-xl w-full bg-black/80 backdrop-blur-2xl border border-purple-500/30 rounded-3xl p-8 text-center flex flex-col items-center shadow-[0_0_50px_rgba(168,85,247,0.2)]"
          >
            <div className="w-16 h-16 rounded-2xl bg-purple-500/10 border border-purple-400/40 flex items-center justify-center mb-6">
              <Compass className="w-8 h-8 text-purple-400 animate-pulse" />
            </div>
            <h1 className="text-4xl md:text-5xl font-black uppercase tracking-tighter mb-2 bg-gradient-to-r from-purple-400 via-pink-400 to-rose-400 bg-clip-text text-transparent">
              Aetheria: Shadow Realm
            </h1>
            <p className="text-zinc-400 text-sm mb-8">
              Turn-based tile dungeon crawler RPG. Choose your hero class, cast elemental spells, and slay the Shadow Oni.
            </p>
            <div className="flex gap-4 w-full">
              <button
                onClick={() => setGameState("select_class")}
                className="flex-1 py-4 bg-gradient-to-r from-purple-500 to-rose-600 text-white font-black uppercase tracking-widest rounded-2xl hover:scale-105 transition-all flex items-center justify-center gap-2 shadow-[0_0_25px_rgba(168,85,247,0.4)]"
              >
                <Play className="w-5 h-5 fill-white" /> Choose Hero
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

      {/* CLASS SELECTION MENU */}
      {gameState === "select_class" && (
        <div className="absolute inset-0 z-30 bg-black/90 backdrop-blur-xl flex items-center justify-center p-6">
          <div className="max-w-2xl w-full bg-zinc-950 border border-purple-500/30 rounded-3xl p-8 text-center">
            <h2 className="text-2xl font-black uppercase tracking-wider text-purple-400 mb-6">Select Hero Class</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              <button
                onClick={() => selectHeroClass("paladin")}
                className="bg-white/5 hover:bg-purple-500/20 border border-white/10 hover:border-purple-500/40 p-5 rounded-2xl flex flex-col items-center transition-all group"
              >
                <Shield className="w-8 h-8 text-amber-400 mb-2 group-hover:scale-110 transition-transform" />
                <span className="font-bold text-base text-white">Paladin</span>
                <span className="text-xs text-zinc-400 mt-1">High HP & Defense</span>
              </button>
              <button
                onClick={() => selectHeroClass("archmage")}
                className="bg-white/5 hover:bg-purple-500/20 border border-white/10 hover:border-purple-500/40 p-5 rounded-2xl flex flex-col items-center transition-all group"
              >
                <Zap className="w-8 h-8 text-cyan-400 mb-2 group-hover:scale-110 transition-transform" />
                <span className="font-bold text-base text-white">Archmage</span>
                <span className="text-xs text-zinc-400 mt-1">Elemental Magic</span>
              </button>
              <button
                onClick={() => selectHeroClass("assassin")}
                className="bg-white/5 hover:bg-purple-500/20 border border-white/10 hover:border-purple-500/40 p-5 rounded-2xl flex flex-col items-center transition-all group"
              >
                <Swords className="w-8 h-8 text-rose-400 mb-2 group-hover:scale-110 transition-transform" />
                <span className="font-bold text-base text-white">Assassin</span>
                <span className="text-xs text-zinc-400 mt-1">High Critical Damage</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
