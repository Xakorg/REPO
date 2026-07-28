"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Shield,
  Zap,
  Heart,
  Sparkles,
  Swords,
  ShoppingBag,
  Award,
  RotateCcw,
  ArrowLeft,
  Volume2,
  VolumeX,
  Compass,
  Coins,
  Scroll
} from "lucide-react";
import Link from "next/link";

// ==========================================
// 1. WEB AUDIO SYNTH SFX ENGINE
// ==========================================
class RPGAudioEngine {
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

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(600, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(100, this.ctx.currentTime + 0.12);

    gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.12);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.12);
  }

  playMagic() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(300, now);
    osc.frequency.exponentialRampToValueAtTime(1200, now + 0.3);

    gain.gain.setValueAtTime(0.25, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(now + 0.3);
  }

  playHeal() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    [440, 554.37, 659.25].forEach((freq, idx) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, now + idx * 0.08);
      gain.gain.setValueAtTime(0.15, now + idx * 0.08);
      gain.gain.exponentialRampToValueAtTime(0.01, now + idx * 0.08 + 0.2);
      osc.connect(gain);
      gain.connect(this.ctx!.destination);
      osc.start(now + idx * 0.08);
      osc.stop(now + idx * 0.08 + 0.2);
    });
  }

  playVictory() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    [523.25, 659.25, 783.99, 1046.5].forEach((freq, idx) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(freq, now + idx * 0.12);
      gain.gain.setValueAtTime(0.2, now + idx * 0.12);
      gain.gain.exponentialRampToValueAtTime(0.01, now + idx * 0.12 + 0.3);
      osc.connect(gain);
      gain.connect(this.ctx!.destination);
      osc.start(now + idx * 0.12);
      osc.stop(now + idx * 0.12 + 0.3);
    });
  }
}

const audio = new RPGAudioEngine();

// ==========================================
// 2. DATA MODELS & ENEMY BESTIARY
// ==========================================
interface PlayerStats {
  name: string;
  level: number;
  exp: number;
  maxExp: number;
  hp: number;
  maxHp: number;
  mp: number;
  maxMp: number;
  atk: number;
  def: number;
  gold: number;
  potions: number;
  etherElixirs: number;
  weapon: string;
  armor: string;
}

interface Enemy {
  name: string;
  hp: number;
  maxHp: number;
  atk: number;
  def: number;
  expYield: number;
  goldYield: number;
  color: string;
  isBoss?: boolean;
}

const BESTIARY: { [floor: number]: Enemy[] } = {
  1: [
    { name: "Scrap Drone", hp: 35, maxHp: 35, atk: 8, def: 2, expYield: 20, goldYield: 15, color: "#94a3b8" },
    { name: "Cyber Crawler", hp: 45, maxHp: 45, atk: 10, def: 3, expYield: 30, goldYield: 25, color: "#38bdf8" }
  ],
  2: [
    { name: "Plasma Sentinel", hp: 70, maxHp: 70, atk: 15, def: 5, expYield: 50, goldYield: 40, color: "#c084fc" },
    { name: "Viper Mech", hp: 85, maxHp: 85, atk: 18, def: 6, expYield: 70, goldYield: 60, color: "#f43f5e" }
  ],
  3: [
    { name: "Laser Golem", hp: 130, maxHp: 130, atk: 24, def: 10, expYield: 120, goldYield: 100, color: "#eab308" },
    { name: "Ghost Operative", hp: 110, maxHp: 110, atk: 28, def: 8, expYield: 140, goldYield: 120, color: "#10b981" }
  ],
  4: [
    { name: "Void Titan", hp: 200, maxHp: 200, atk: 35, def: 15, expYield: 220, goldYield: 180, color: "#a855f7" }
  ],
  5: [
    { name: "OVERLORD DREADNOUGHT", hp: 450, maxHp: 450, atk: 48, def: 20, expYield: 500, goldYield: 500, color: "#dc2626", isBoss: true }
  ]
};

// ==========================================
// 3. MAIN GAME COMPONENT
// ==========================================
export default function CyberDungeonRPG() {
  const [gameState, setGameState] = useState<"menu" | "exploring" | "battle" | "shop" | "victory" | "gameover">("menu");
  const [dungeonFloor, setDungeonFloor] = useState(1);
  const [muted, setMuted] = useState(false);
  const [battleLog, setBattleLog] = useState<string[]>([]);
  const [turn, setTurn] = useState<"player" | "enemy">("player");

  const [player, setPlayer] = useState<PlayerStats>({
    name: "CYBER KNIGHT",
    level: 1,
    exp: 0,
    maxExp: 100,
    hp: 100,
    maxHp: 100,
    mp: 40,
    maxMp: 40,
    atk: 14,
    def: 5,
    gold: 50,
    potions: 3,
    etherElixirs: 2,
    weapon: "Nano Blade (+0)",
    armor: "Cyber Mesh (+0)"
  });

  const [activeEnemy, setActiveEnemy] = useState<Enemy | null>(null);

  // Player Map Position
  const [mapPos, setMapPos] = useState({ x: 4, y: 4 });

  const toggleMute = () => {
    setMuted(!muted);
    audio.muted = !muted;
  };

  const startNewGame = () => {
    setDungeonFloor(1);
    setPlayer({
      name: "CYBER KNIGHT",
      level: 1,
      exp: 0,
      maxExp: 100,
      hp: 100,
      maxHp: 100,
      mp: 40,
      maxMp: 40,
      atk: 14,
      def: 5,
      gold: 50,
      potions: 3,
      etherElixirs: 2,
      weapon: "Nano Blade (+0)",
      armor: "Cyber Mesh (+0)"
    });
    setMapPos({ x: 4, y: 4 });
    setGameState("exploring");
  };

  // Keyboard navigation on exploration map
  useEffect(() => {
    if (gameState !== "exploring") return;

    const handleKeyDown = (e: KeyboardEvent) => {
      let dx = 0;
      let dy = 0;

      if (e.code === "KeyW" || e.code === "ArrowUp") dy = -1;
      if (e.code === "KeyS" || e.code === "ArrowDown") dy = 1;
      if (e.code === "KeyA" || e.code === "ArrowLeft") dx = -1;
      if (e.code === "KeyD" || e.code === "ArrowRight") dx = 1;

      if (dx !== 0 || dy !== 0) {
        setMapPos((pos) => {
          const nx = Math.max(0, Math.min(8, pos.x + dx));
          const ny = Math.max(0, Math.min(8, pos.y + dy));

          // Random Encounter Check (25% chance per step)
          if (Math.random() < 0.25) {
            triggerEncounter();
          }

          return { x: nx, y: ny };
        });
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [gameState, dungeonFloor]);

  // Trigger Random Encounter
  const triggerEncounter = () => {
    const list = BESTIARY[dungeonFloor] || BESTIARY[1];
    const template = list[Math.floor(Math.random() * list.length)];
    const enemy: Enemy = { ...template, hp: template.maxHp };

    setActiveEnemy(enemy);
    setBattleLog([`ENGAGING THREAT: ${enemy.name}!`]);
    setTurn("player");
    setGameState("battle");
  };

  // Player Battle Actions
  const handleAttack = () => {
    if (!activeEnemy || turn !== "player") return;
    audio.playSlash();

    const dmg = Math.max(1, player.atk - activeEnemy.def + Math.floor(Math.random() * 6));
    const nextEnemyHp = Math.max(0, activeEnemy.hp - dmg);

    setBattleLog((prev) => [`You slashed ${activeEnemy.name} for ${dmg} DMG!`, ...prev]);
    setActiveEnemy({ ...activeEnemy, hp: nextEnemyHp });

    if (nextEnemyHp <= 0) {
      handleBattleVictory(activeEnemy);
    } else {
      setTurn("enemy");
      setTimeout(() => enemyTurn(nextEnemyHp), 1000);
    }
  };

  const handleMagic = () => {
    if (!activeEnemy || turn !== "player" || player.mp < 10) return;
    audio.playMagic();

    const spellDmg = player.atk * 2.2 + Math.floor(Math.random() * 8);
    const nextEnemyHp = Math.max(0, activeEnemy.hp - spellDmg);

    setPlayer((p) => ({ ...p, mp: p.mp - 10 }));
    setBattleLog((prev) => [`You cast Plasma Surge for ${Math.round(spellDmg)} DMG!`, ...prev]);
    setActiveEnemy({ ...activeEnemy, hp: nextEnemyHp });

    if (nextEnemyHp <= 0) {
      handleBattleVictory(activeEnemy);
    } else {
      setTurn("enemy");
      setTimeout(() => enemyTurn(nextEnemyHp), 1000);
    }
  };

  const handleHeal = () => {
    if (player.potions <= 0 || turn !== "player") return;
    audio.playHeal();

    const healAmount = 45;
    setPlayer((p) => ({
      ...p,
      potions: p.potions - 1,
      hp: Math.min(p.maxHp, p.hp + healAmount)
    }));
    setBattleLog((prev) => [`Used Nanite Injector! Restored ${healAmount} HP.`, ...prev]);
    setTurn("enemy");
    setTimeout(() => enemyTurn(activeEnemy?.hp || 0), 1000);
  };

  // Enemy Turn AI
  const enemyTurn = (currentEnemyHp: number) => {
    if (!activeEnemy || currentEnemyHp <= 0) return;

    const eDmg = Math.max(1, activeEnemy.atk - player.def + Math.floor(Math.random() * 4));
    setPlayer((p) => {
      const nextHp = Math.max(0, p.hp - eDmg);
      if (nextHp <= 0) {
        setGameState("gameover");
      }
      return { ...p, hp: nextHp };
    });

    setBattleLog((prev) => [`${activeEnemy.name} attacked you for ${eDmg} DMG!`, ...prev]);
    setTurn("player");
  };

  // Victory Rewards & Level Up Check
  const handleBattleVictory = (enemy: Enemy) => {
    audio.playVictory();
    const gYield = enemy.goldYield;
    const eYield = enemy.expYield;

    setPlayer((p) => {
      let nextExp = p.exp + eYield;
      let nextLevel = p.level;
      let nextMaxExp = p.maxExp;
      let nextAtk = p.atk;
      let nextDef = p.def;
      let nextMaxHp = p.maxHp;

      if (nextExp >= nextMaxExp) {
        nextLevel += 1;
        nextExp -= nextMaxExp;
        nextMaxExp = Math.round(nextMaxExp * 1.5);
        nextAtk += 4;
        nextDef += 2;
        nextMaxHp += 20;
      }

      return {
        ...p,
        level: nextLevel,
        exp: nextExp,
        maxExp: nextMaxExp,
        gold: p.gold + gYield,
        atk: nextAtk,
        def: nextDef,
        maxHp: nextMaxHp,
        hp: nextMaxHp,
        mp: p.maxMp
      };
    });

    if (enemy.isBoss) {
      setGameState("victory");
    } else {
      setTimeout(() => setGameState("exploring"), 1500);
    }
  };

  // Shop Purchases
  const buyItem = (item: "potion" | "weapon" | "armor") => {
    if (item === "potion" && player.gold >= 25) {
      setPlayer((p) => ({ ...p, gold: p.gold - 25, potions: p.potions + 1 }));
    } else if (item === "weapon" && player.gold >= 100) {
      setPlayer((p) => ({ ...p, gold: p.gold - 100, atk: p.atk + 8, weapon: "Laser Katana (+1)" }));
    } else if (item === "armor" && player.gold >= 100) {
      setPlayer((p) => ({ ...p, gold: p.gold - 100, def: p.def + 5, armor: "Titanium Exosuit (+1)" }));
    }
  };

  return (
    <div className="relative w-full h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-4 font-sans select-none overflow-hidden">
      <div className="relative w-full max-w-4xl bg-slate-900 border-2 border-slate-800 rounded-2xl p-6 shadow-2xl flex flex-col gap-4">
        {/* Top Header Bar */}
        <div className="flex items-center justify-between bg-slate-950 p-4 rounded-xl border border-slate-800">
          <div className="flex items-center gap-4">
            <span className="text-sm font-bold text-sky-400">LVL {player.level} {player.name}</span>
            <div className="flex items-center gap-1 text-rose-400 text-xs font-bold">
              <Heart className="w-4 h-4" /> {player.hp} / {player.maxHp}
            </div>
            <div className="flex items-center gap-1 text-sky-400 text-xs font-bold">
              <Zap className="w-4 h-4" /> {player.mp} / {player.maxMp}
            </div>
            <div className="flex items-center gap-1 text-amber-400 text-xs font-bold">
              <Coins className="w-4 h-4" /> {player.gold} GOLD
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs font-bold text-slate-400">FLOOR {dungeonFloor} / 5</span>
            <button onClick={toggleMute} className="p-2 bg-slate-800 rounded-lg hover:bg-slate-700">
              {muted ? <VolumeX className="w-4 h-4 text-slate-400" /> : <Volume2 className="w-4 h-4 text-sky-400" />}
            </button>
          </div>
        </div>

        {/* START MENU */}
        {gameState === "menu" && (
          <div className="py-12 flex flex-col items-center justify-center text-center">
            <span className="px-4 py-1.5 rounded-full bg-sky-500/10 border border-sky-500/30 text-sky-400 text-xs font-bold uppercase tracking-widest mb-6">
              2D RETRO TURN-BASED RPG
            </span>
            <h1 className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-sky-400 via-indigo-300 to-fuchsia-400 mb-4">
              CYBER DUNGEON RPG
            </h1>
            <p className="text-slate-400 text-xs max-w-md mb-8">
              Explore cyber dungeon floors, engage rogue mechs in turn-based tactical battles, upgrade your Laser Katana, and defeat the Overlord Dreadnought.
            </p>

            <button
              onClick={startNewGame}
              className="px-8 py-4 bg-sky-500 hover:bg-sky-400 font-bold rounded-xl text-white shadow-lg shadow-sky-500/25 mb-4"
            >
              BEGIN DESCENT
            </button>
          </div>
        )}

        {/* EXPLORING GRID MAP */}
        {gameState === "exploring" && (
          <div className="flex flex-col md:flex-row gap-6">
            {/* 9x9 Grid Map */}
            <div className="grid grid-cols-9 gap-1 bg-slate-950 p-4 rounded-xl border border-slate-800 w-fit mx-auto">
              {Array.from({ length: 81 }).map((_, idx) => {
                const x = idx % 9;
                const y = Math.floor(idx / 9);
                const isPlayer = mapPos.x === x && mapPos.y === y;

                return (
                  <div
                    key={idx}
                    className={`w-10 h-10 rounded-lg flex items-center justify-center border text-xs font-bold transition ${
                      isPlayer
                        ? "bg-sky-500 border-sky-400 shadow-lg shadow-sky-500/50"
                        : "bg-slate-900 border-slate-800"
                    }`}
                  >
                    {isPlayer ? "⚔️" : ""}
                  </div>
                );
              })}
            </div>

            {/* Status & Actions Panel */}
            <div className="flex-1 bg-slate-950 p-6 rounded-xl border border-slate-800 flex flex-col justify-between">
              <div>
                <h3 className="text-sm font-bold text-sky-400 mb-2">CYBER LABYRINTH - FLOOR {dungeonFloor}</h3>
                <p className="text-xs text-slate-400 mb-4">
                  Use WASD or Arrow Keys to move on the grid map. Beware of wild rogue AI encounters!
                </p>

                <div className="space-y-2 text-xs font-semibold">
                  <div className="flex justify-between text-slate-400">
                    <span>WEAPON:</span> <span className="text-white">{player.weapon}</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>ARMOR:</span> <span className="text-white">{player.armor}</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>POTIONS:</span> <span className="text-rose-400">{player.potions} HP Injectors</span>
                  </div>
                </div>
              </div>

              <div className="flex gap-2 mt-4">
                <button
                  onClick={() => setGameState("shop")}
                  className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 font-bold rounded-xl text-xs flex items-center justify-center gap-2"
                >
                  <ShoppingBag className="w-4 h-4 text-amber-400" /> MERCHANT SHOP
                </button>
                {dungeonFloor < 5 && (
                  <button
                    onClick={() => setDungeonFloor((f) => f + 1)}
                    className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-500 font-bold rounded-xl text-xs"
                  >
                    NEXT FLOOR ➡️
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* TURN-BASED BATTLE SCREEN */}
        {gameState === "battle" && activeEnemy && (
          <div className="flex flex-col gap-4">
            {/* Enemy Banner */}
            <div className="bg-slate-950 p-6 rounded-xl border border-slate-800 flex justify-between items-center">
              <div>
                <h2 className="text-lg font-black" style={{ color: activeEnemy.color }}>{activeEnemy.name}</h2>
                <div className="w-64 h-3 bg-slate-800 rounded-full overflow-hidden mt-2">
                  <div
                    className="h-full bg-rose-500 transition-all duration-300"
                    style={{ width: `${(activeEnemy.hp / activeEnemy.maxHp) * 100}%` }}
                  />
                </div>
              </div>
              <span className="text-xs font-bold text-slate-400">{activeEnemy.hp} / {activeEnemy.maxHp} HP</span>
            </div>

            {/* Battle Log Box */}
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 h-32 overflow-y-auto space-y-1 font-mono text-xs">
              {battleLog.map((log, idx) => (
                <p key={idx} className={idx === 0 ? "text-sky-400 font-bold" : "text-slate-400"}>{log}</p>
              ))}
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-3 gap-3">
              <button
                disabled={turn !== "player"}
                onClick={handleAttack}
                className="py-4 bg-rose-600 hover:bg-rose-500 disabled:opacity-40 font-bold text-xs rounded-xl flex items-center justify-center gap-2"
              >
                <Swords className="w-4 h-4" /> CYBER STRIKE
              </button>

              <button
                disabled={turn !== "player" || player.mp < 10}
                onClick={handleMagic}
                className="py-4 bg-sky-600 hover:bg-sky-500 disabled:opacity-40 font-bold text-xs rounded-xl flex items-center justify-center gap-2"
              >
                <Zap className="w-4 h-4" /> PLASMA SURGE (10 MP)
              </button>

              <button
                disabled={turn !== "player" || player.potions <= 0}
                onClick={handleHeal}
                className="py-4 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 font-bold text-xs rounded-xl flex items-center justify-center gap-2"
              >
                <Heart className="w-4 h-4" /> HEAL ({player.potions})
              </button>
            </div>
          </div>
        )}

        {/* SHOP SCREEN */}
        {gameState === "shop" && (
          <div className="bg-slate-950 p-6 rounded-xl border border-slate-800">
            <h2 className="text-lg font-black text-amber-400 mb-2">MERCHANT SANCTUARY</h2>
            <p className="text-xs text-slate-400 mb-6">Upgrade stats & restock healing nanites.</p>

            <div className="space-y-3 mb-6">
              <div className="flex justify-between items-center p-3 bg-slate-900 rounded-xl">
                <div>
                  <div className="text-sm font-bold text-white">NANITE INJECTOR</div>
                  <div className="text-xs text-slate-400">+45 HP Heal</div>
                </div>
                <button
                  disabled={player.gold < 25}
                  onClick={() => buyItem("potion")}
                  className="px-4 py-2 bg-amber-500 disabled:opacity-40 text-slate-950 font-bold rounded-lg text-xs"
                >
                  25 GOLD
                </button>
              </div>

              <div className="flex justify-between items-center p-3 bg-slate-900 rounded-xl">
                <div>
                  <div className="text-sm font-bold text-white">LASER KATANA (+1)</div>
                  <div className="text-xs text-slate-400">+8 ATK Damage</div>
                </div>
                <button
                  disabled={player.gold < 100}
                  onClick={() => buyItem("weapon")}
                  className="px-4 py-2 bg-amber-500 disabled:opacity-40 text-slate-950 font-bold rounded-lg text-xs"
                >
                  100 GOLD
                </button>
              </div>
            </div>

            <button
              onClick={() => setGameState("exploring")}
              className="w-full py-3 bg-slate-800 hover:bg-slate-700 font-bold rounded-xl text-xs"
            >
              RETURN TO DUNGEON
            </button>
          </div>
        )}

        {/* VICTORY OVERLAY */}
        {gameState === "victory" && (
          <div className="py-8 flex flex-col items-center justify-center text-center">
            <Award className="w-12 h-12 text-amber-400 mb-4" />
            <h2 className="text-3xl font-black text-white mb-2">DUNGEON CLEARED!</h2>
            <p className="text-xs text-slate-400 mb-6">You defeated the Overlord Dreadnought and liberated the sector.</p>
            <button
              onClick={startNewGame}
              className="px-8 py-3 bg-sky-500 hover:bg-sky-400 font-bold text-white rounded-xl"
            >
              PLAY AGAIN
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
