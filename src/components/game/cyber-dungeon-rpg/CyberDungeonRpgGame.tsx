"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Trophy,
  Shield,
  Zap,
  Heart,
  Briefcase,
  ShoppingBag,
  ArrowLeft,
  ChevronRight,
  Sparkles,
  Sword,
  Cpu,
  UserCheck,
  RefreshCw,
  Award,
  Terminal,
  Activity,
  PackageCheck
} from "lucide-react";
import Link from "next/link";

// ==========================================
// 1. PROCEDURAL AUDIO SYNTH
// ==========================================
class RpgAudioSynth {
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

  public playHit() {
    if (this.muted) return;
    this.initCtx();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = "square";
    osc.frequency.setValueAtTime(220, now);
    osc.frequency.exponentialRampToValueAtTime(60, now + 0.15);

    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.15);
  }

  public playSpell() {
    if (this.muted) return;
    this.initCtx();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(440, now);
    osc.frequency.exponentialRampToValueAtTime(1200, now + 0.25);

    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.25);
  }

  public playLoot() {
    if (this.muted) return;
    this.initCtx();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const notes = [523.25, 659.25, 783.99, 1046.5];
    notes.forEach((freq, idx) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, now + idx * 0.08);
      gain.gain.setValueAtTime(0.15, now + idx * 0.08);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.12);
      osc.connect(gain);
      gain.connect(this.ctx!.destination);
      osc.start(now + idx * 0.08);
      osc.stop(now + idx * 0.08 + 0.12);
    });
  }
}

const audioSynth = new RpgAudioSynth();

// ==========================================
// 2. RPG DATA STRUCTURES
// ==========================================
export interface HeroStats {
  name: string;
  heroClass: "ninja" | "mage" | "brawler";
  level: number;
  xp: number;
  nextXp: number;
  hp: number;
  maxHp: number;
  mana: number;
  maxMana: number;
  atk: number;
  def: number;
  credits: number;
}

export interface InventoryItem {
  id: string;
  name: string;
  type: "weapon" | "armor" | "potion";
  effect: number;
  price: number;
  description: string;
}

export interface DungeonMonster {
  id: string;
  name: string;
  hp: number;
  maxHp: number;
  atk: number;
  def: number;
  xpReward: number;
  creditReward: number;
  icon: string;
}

const INITIAL_HERO: HeroStats = {
  name: "Cyber Ninja Kael",
  heroClass: "ninja",
  level: 1,
  xp: 0,
  nextXp: 100,
  hp: 120,
  maxHp: 120,
  mana: 50,
  maxMana: 50,
  atk: 28,
  def: 8,
  credits: 150
};

// ==========================================
// 3. MAIN RPG COMPONENT
// ==========================================
export default function CyberDungeonRpgGame() {
  const [gameState, setGameState] = useState<"menu" | "explore" | "combat" | "shop" | "inventory" | "gameover" | "victory">("menu");

  const [hero, setHero] = useState<HeroStats>(INITIAL_HERO);
  const [floor, setFloor] = useState(1);
  const [inventory, setInventory] = useState<InventoryItem[]>([
    { id: "p1", name: "Nanite Heal Injector", type: "potion", effect: 60, price: 40, description: "Restores 60 HP instantly" }
  ]);

  const [activeMonster, setActiveMonster] = useState<DungeonMonster | null>(null);
  const [combatLog, setCombatLog] = useState<string[]>([]);
  const [gridPos, setGridPos] = useState({ x: 2, y: 2 });

  // Grid Map (0: empty floor, 1: wall, 2: chest, 3: monster, 4: exit portal)
  const [map, setMap] = useState<number[][]>([
    [1, 1, 1, 1, 1, 1, 1, 1],
    [1, 0, 0, 3, 0, 2, 0, 1],
    [1, 0, 1, 1, 0, 1, 0, 1],
    [1, 3, 0, 0, 0, 3, 0, 1],
    [1, 0, 1, 0, 1, 1, 0, 1],
    [1, 2, 0, 3, 0, 0, 4, 1],
    [1, 1, 1, 1, 1, 1, 1, 1]
  ]);

  // Handle Movement on Tile Grid
  const moveHero = (dx: number, dy: number) => {
    if (gameState !== "explore") return;

    const newX = gridPos.x + dx;
    const newY = gridPos.y + dy;

    if (newY < 0 || newY >= map.length || newX < 0 || newX >= map[0].length) return;
    const tile = map[newY][newX];

    if (tile === 1) return; // Wall

    setGridPos({ x: newX, y: newY });

    if (tile === 3) {
      // Monster Battle Encounter
      startCombat();
    } else if (tile === 2) {
      // Chest Loot
      audioSynth.playLoot();
      setHero((h) => ({ ...h, credits: h.credits + 75 }));
      // Clear chest tile
      const newMap = map.map((row) => [...row]);
      newMap[newY][newX] = 0;
      setMap(newMap);
    } else if (tile === 4) {
      // Next Floor Exit Portal
      audioSynth.playLoot();
      if (floor >= 5) {
        setGameState("victory");
      } else {
        setFloor((f) => f + 1);
        setGridPos({ x: 1, y: 1 });
      }
    }
  };

  // Start Combat Engine
  const startCombat = () => {
    const monsters: DungeonMonster[] = [
      { id: "m1", name: "Cyber Hound Unit", hp: 80 + floor * 20, maxHp: 80 + floor * 20, atk: 18 + floor * 4, def: 5, xpReward: 45, creditReward: 50, icon: "Cpu" },
      { id: "m2", name: "Rogue Sentinel Drone", hp: 120 + floor * 30, maxHp: 120 + floor * 30, atk: 24 + floor * 5, def: 8, xpReward: 70, creditReward: 80, icon: "Activity" }
    ];
    const monster = monsters[Math.floor(Math.random() * monsters.length)];
    setActiveMonster(monster);
    setCombatLog([`Encountered ${monster.name}!`]);
    setGameState("combat");
  };

  // Combat Actions
  const handleAttack = () => {
    if (!activeMonster) return;
    audioSynth.playHit();

    const dmg = Math.max(5, hero.atk - activeMonster.def + Math.floor(Math.random() * 8));
    const monsterHp = activeMonster.hp - dmg;

    let logs = [`You strike ${activeMonster.name} for ${dmg} physical damage!`];

    if (monsterHp <= 0) {
      audioSynth.playLoot();
      logs.push(`Defeated ${activeMonster.name}! Gained ${activeMonster.xpReward} XP & $${activeMonster.creditReward} Credits.`);

      // Clear tile from map
      const newMap = map.map((row) => [...row]);
      newMap[gridPos.y][gridPos.x] = 0;
      setMap(newMap);

      // Reward XP & Credits
      setHero((h) => {
        const nextXpVal = h.xp + activeMonster.xpReward;
        if (nextXpVal >= h.nextXp) {
          return {
            ...h,
            level: h.level + 1,
            xp: 0,
            nextXp: h.nextXp + 50,
            maxHp: h.maxHp + 25,
            hp: h.maxHp + 25,
            atk: h.atk + 6,
            credits: h.credits + activeMonster.creditReward
          };
        }
        return { ...h, xp: nextXpVal, credits: h.credits + activeMonster.creditReward };
      });

      setCombatLog(logs);
      setTimeout(() => setGameState("explore"), 1200);
      return;
    }

    // Monster Retaliate
    const monsterDmg = Math.max(4, activeMonster.atk - hero.def);
    const heroHp = hero.hp - monsterDmg;

    logs.push(`${activeMonster.name} counterattacks for ${monsterDmg} plasma damage!`);

    setActiveMonster({ ...activeMonster, hp: monsterHp });
    setHero((h) => ({ ...h, hp: heroHp }));
    setCombatLog(logs);

    if (heroHp <= 0) {
      setGameState("gameover");
    }
  };

  const handleCastSkill = () => {
    if (!activeMonster || hero.mana < 20) return;
    audioSynth.playSpell();

    const spellDmg = hero.atk * 2;
    const monsterHp = activeMonster.hp - spellDmg;

    setHero((h) => ({ ...h, mana: h.mana - 20 }));
    setCombatLog([`Cast Overclock Overdrive for ${spellDmg} cyber damage!`]);

    if (monsterHp <= 0) {
      const newMap = map.map((row) => [...row]);
      newMap[gridPos.y][gridPos.x] = 0;
      setMap(newMap);
      setTimeout(() => setGameState("explore"), 1000);
    } else {
      setActiveMonster({ ...activeMonster, hp: monsterHp });
    }
  };

  return (
    <div className="fixed inset-0 z-[400] bg-zinc-950 text-white font-sans overflow-hidden select-none flex flex-col">
      {/* RPG Top Bar Header */}
      <header className="bg-black/80 border-b border-white/10 p-4 flex justify-between items-center z-10">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2 text-cyan-400 font-black text-sm uppercase tracking-widest">
            <Sword className="w-5 h-5" /> {hero.name} (LVL {hero.level})
          </div>
          <div className="flex items-center gap-2 text-rose-400 text-xs font-bold">
            <Heart className="w-4 h-4 fill-rose-500" /> HP: {hero.hp}/{hero.maxHp}
          </div>
          <div className="flex items-center gap-2 text-purple-400 text-xs font-bold">
            <Zap className="w-4 h-4 fill-purple-500" /> MP: {hero.mana}/{hero.maxMana}
          </div>
          <div className="flex items-center gap-2 text-amber-400 text-xs font-bold">
            <Briefcase className="w-4 h-4" /> ${hero.credits}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button onClick={() => setGameState("inventory")} className="px-4 py-2 bg-white/10 rounded-xl text-xs font-black uppercase hover:bg-white/20">
            Inventory
          </button>
          <Link href="/games" className="px-4 py-2 bg-rose-500/20 border border-rose-500/40 rounded-xl text-xs font-black uppercase text-rose-400">
            Exit
          </Link>
        </div>
      </header>

      {/* EXPLORE TILE GRID MODE */}
      {gameState === "explore" && (
        <div className="flex-1 flex flex-col items-center justify-center p-6 space-y-6">
          <div className="text-xs font-black uppercase tracking-widest text-cyan-400">DUNGEON SECTOR FLOOR 0{floor} / 05</div>
          <div className="grid grid-cols-8 gap-2 bg-black/60 p-4 rounded-3xl border border-white/10 shadow-2xl">
            {map.map((row, rIdx) =>
              row.map((tile, cIdx) => {
                const isHeroHere = gridPos.x === cIdx && gridPos.y === rIdx;
                return (
                  <div
                    key={`${rIdx}-${cIdx}`}
                    className={`w-14 h-14 rounded-2xl flex items-center justify-center font-bold text-xs transition-all ${
                      isHeroHere
                        ? "bg-cyan-500 shadow-[0_0_20px_rgba(6,182,212,0.8)] border-2 border-white"
                        : tile === 1
                        ? "bg-zinc-900 border border-white/5"
                        : tile === 2
                        ? "bg-amber-500/20 border border-amber-500/40 text-amber-400"
                        : tile === 3
                        ? "bg-rose-500/20 border border-rose-500/40 text-rose-400"
                        : tile === 4
                        ? "bg-emerald-500/20 border border-emerald-500/40 text-emerald-400"
                        : "bg-white/5 border border-white/5"
                    }`}
                  >
                    {isHeroHere ? "HERO" : tile === 2 ? "CHEST" : tile === 3 ? "ENEMY" : tile === 4 ? "EXIT" : ""}
                  </div>
                );
              })
            )}
          </div>

          <div className="flex gap-3">
            <button onClick={() => moveHero(-1, 0)} className="w-12 h-12 rounded-2xl bg-white/10 font-black text-lg">
              ←
            </button>
            <button onClick={() => moveHero(0, -1)} className="w-12 h-12 rounded-2xl bg-white/10 font-black text-lg">
              ↑
            </button>
            <button onClick={() => moveHero(0, 1)} className="w-12 h-12 rounded-2xl bg-white/10 font-black text-lg">
              ↓
            </button>
            <button onClick={() => moveHero(1, 0)} className="w-12 h-12 rounded-2xl bg-white/10 font-black text-lg">
              →
            </button>
          </div>
        </div>
      )}

      {/* COMBAT MODE */}
      {gameState === "combat" && activeMonster && (
        <div className="flex-1 flex flex-col items-center justify-center p-8 max-w-2xl mx-auto w-full space-y-6">
          <div className="w-full bg-black/70 border border-white/10 p-6 rounded-3xl text-center space-y-4 shadow-2xl">
            <div className="text-xl font-black uppercase text-rose-400">{activeMonster.name}</div>
            <div className="w-full bg-zinc-900 h-4 rounded-full overflow-hidden border border-white/10">
              <div className="bg-rose-500 h-full transition-all" style={{ width: `${(activeMonster.hp / activeMonster.maxHp) * 100}%` }} />
            </div>
            <div className="text-xs font-bold text-white/60">
              HP: {activeMonster.hp} / {activeMonster.maxHp}
            </div>
          </div>

          <div className="w-full bg-black/50 border border-white/10 p-4 rounded-2xl h-32 overflow-y-auto space-y-1 text-xs font-mono">
            {combatLog.map((log, idx) => (
              <div key={idx} className="text-cyan-300">
                {log}
              </div>
            ))}
          </div>

          <div className="flex gap-4 w-full">
            <button onClick={handleAttack} className="flex-1 py-4 bg-rose-500 rounded-2xl font-black uppercase tracking-widest text-sm hover:scale-105">
              Attack Blade
            </button>
            <button onClick={handleCastSkill} className="flex-1 py-4 bg-purple-600 rounded-2xl font-black uppercase tracking-widest text-sm hover:scale-105">
              Overclock (20 MP)
            </button>
          </div>
        </div>
      )}

      {/* START MENU */}
      {gameState === "menu" && (
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-6">
          <h1 className="text-6xl font-black italic tracking-tighter uppercase bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">
            CYBER DUNGEON RPG
          </h1>
          <p className="text-white/70 max-w-md">Retro turn-based cyberpunk grid dungeon crawler. Battle rogue mechs, collect credits, and upgrade hero skills.</p>
          <button
            onClick={() => setGameState("explore")}
            className="px-10 py-5 bg-purple-600 rounded-full font-black text-lg uppercase tracking-widest hover:scale-105 shadow-[0_0_40px_rgba(147,51,234,0.5)]"
          >
            Enter Dungeon
          </button>
        </div>
      )}
    </div>
  );
}
