"use client";

import React, { useState } from "react";

interface Boss {
  name: string;
  maxHp: number;
  hp: number;
  attack: number;
  icon: string;
}

const BOSSES: Boss[] = [
  { name: "Goblin Warlord", maxHp: 100, hp: 100, attack: 12, icon: "👹" },
  { name: "Shadow Dragon", maxHp: 200, hp: 200, attack: 20, icon: "🐉" },
  { name: "Demon Sovereign", maxHp: 350, hp: 350, attack: 30, icon: "👾" },
];

export default function LegendQuest() {
  const [stage, setStage] = useState(0);
  const [heroHp, setHeroHp] = useState(150);
  const [maxHeroHp] = useState(150);
  const [heroMana, setHeroMana] = useState(50);
  const [maxHeroMana] = useState(50);
  const [bosses, setBosses] = useState<Boss[]>(BOSSES.map((b) => ({ ...b })));
  const [gameState, setGameState] = useState<"START" | "PLAYING" | "WON" | "LOST">("START");
  const [score, setScore] = useState(0);
  const [combatLog, setCombatLog] = useState<string[]>([]);

  const startGame = () => {
    setStage(0);
    setHeroHp(150);
    setHeroMana(50);
    setBosses(BOSSES.map((b) => ({ ...b })));
    setScore(0);
    setCombatLog(["A new quest begins! Defeat all legendary beasts."]);
    setGameState("PLAYING");
  };

  const handleTurn = (action: "ATTACK" | "HEAVY" | "HEAL" | "GUARD") => {
    if (gameState !== "PLAYING") return;

    const currentBoss = { ...bosses[stage] };
    let newHeroHp = heroHp;
    let newHeroMana = Math.min(maxHeroMana, heroMana + 10);
    let newScore = score;
    let isGuarding = false;
    let heroDmg = 0;
    const log: string[] = [];

    // Player action
    if (action === "ATTACK") {
      heroDmg = 20 + Math.floor(Math.random() * 10);
      currentBoss.hp = Math.max(0, currentBoss.hp - heroDmg);
      log.push(`Hero attacks ${currentBoss.name} for ${heroDmg} damage!`);
    } else if (action === "HEAVY") {
      if (heroMana < 25) {
        setCombatLog((prev) => ["Not enough Mana for Heavy Strike!", ...prev]);
        return;
      }
      newHeroMana -= 25;
      heroDmg = 45 + Math.floor(Math.random() * 15);
      currentBoss.hp = Math.max(0, currentBoss.hp - heroDmg);
      log.push(`Hero unleashes HEAVY STRIKE for ${heroDmg} damage!`);
    } else if (action === "HEAL") {
      if (heroMana < 20) {
        setCombatLog((prev) => ["Not enough Mana to Heal!", ...prev]);
        return;
      }
      newHeroMana -= 20;
      const healAmount = 40;
      newHeroHp = Math.min(maxHeroHp, newHeroHp + healAmount);
      log.push(`Hero casts Healing Light restoring ${healAmount} HP!`);
    } else if (action === "GUARD") {
      isGuarding = true;
      log.push("Hero takes a defensive stance!");
    }

    newScore += heroDmg * 10;

    // Check boss defeated
    if (currentBoss.hp <= 0) {
      log.push(`🎉 Defeated ${currentBoss.name}!`);
      newScore += (stage + 1) * 1000;
      const nextStage = stage + 1;
      if (nextStage >= bosses.length) {
        setScore(newScore);
        setGameState("WON");
        window.dispatchEvent(new CustomEvent("xakteir-game-score", { detail: { score: newScore } }));
        setCombatLog([`VICTORY! All bosses slain! Final Score: ${newScore}`, ...log]);
        return;
      } else {
        setStage(nextStage);
        setHeroHp(Math.min(maxHeroHp, newHeroHp + 30));
      }
    } else {
      // Boss turn
      let bossDmg = currentBoss.attack + Math.floor(Math.random() * 8);
      if (isGuarding) bossDmg = Math.floor(bossDmg / 3);
      newHeroHp = Math.max(0, newHeroHp - bossDmg);
      log.push(`${currentBoss.name} retaliates for ${bossDmg} damage!`);

      if (newHeroHp <= 0) {
        setScore(newScore);
        setGameState("LOST");
        window.dispatchEvent(new CustomEvent("xakteir-game-score", { detail: { score: newScore } }));
        setCombatLog([`DEFEAT! Hero fell in battle. Final Score: ${newScore}`, ...log]);
        return;
      }
    }

    const updatedBosses = [...bosses];
    updatedBosses[stage] = currentBoss;
    setBosses(updatedBosses);
    setHeroHp(newHeroHp);
    setHeroMana(newHeroMana);
    setScore(newScore);
    setCombatLog((prev) => [...log, ...prev].slice(0, 8));
  };

  const currentBoss = bosses[stage];

  return (
    <div className="w-full h-full flex flex-col items-center justify-center bg-zinc-950 text-white p-4">
      <h1 className="text-3xl font-extrabold text-amber-500 mb-2 uppercase tracking-wider">
        Legend Quest
      </h1>

      <div className="flex gap-8 mb-4 font-bold text-zinc-300">
        <div>Score: <span className="text-amber-400">{score}</span></div>
        <div>Stage: <span className="text-blue-400">{stage + 1} / {bosses.length}</span></div>
      </div>

      <div className="w-[800px] bg-zinc-900 border border-zinc-800 rounded-2xl p-6 flex flex-col gap-6 shadow-2xl">
        {/* Battle Arena */}
        <div className="grid grid-cols-2 gap-6 bg-zinc-950 p-6 rounded-xl border border-zinc-800 items-center">
          {/* Hero */}
          <div className="flex flex-col items-center gap-2">
            <div className="text-6xl">⚔️</div>
            <div className="font-extrabold text-lg">Hero Champion</div>
            <div className="w-full bg-zinc-800 h-4 rounded-full overflow-hidden">
              <div className="bg-emerald-500 h-full" style={{ width: `${(heroHp / maxHeroHp) * 100}%` }} />
            </div>
            <div className="text-xs text-emerald-400 font-bold">{heroHp} / {maxHeroHp} HP</div>
            <div className="w-full bg-zinc-800 h-3 rounded-full overflow-hidden">
              <div className="bg-blue-500 h-full" style={{ width: `${(heroMana / maxHeroMana) * 100}%` }} />
            </div>
            <div className="text-xs text-blue-400 font-bold">{heroMana} / {maxHeroMana} MP</div>
          </div>

          {/* Boss */}
          <div className="flex flex-col items-center gap-2">
            <div className="text-6xl">{currentBoss.icon}</div>
            <div className="font-extrabold text-lg text-rose-400">{currentBoss.name}</div>
            <div className="w-full bg-zinc-800 h-4 rounded-full overflow-hidden">
              <div className="bg-rose-500 h-full" style={{ width: `${(currentBoss.hp / currentBoss.maxHp) * 100}%` }} />
            </div>
            <div className="text-xs text-rose-400 font-bold">{currentBoss.hp} / {currentBoss.maxHp} HP</div>
          </div>
        </div>

        {/* Action Controls */}
        {gameState === "PLAYING" ? (
          <div className="grid grid-cols-4 gap-4">
            <button
              onClick={() => handleTurn("ATTACK")}
              className="py-3 bg-rose-600 hover:bg-rose-500 font-extrabold rounded-xl transition shadow-lg"
            >
              Attack ⚔️
            </button>
            <button
              onClick={() => handleTurn("HEAVY")}
              disabled={heroMana < 25}
              className="py-3 bg-amber-600 hover:bg-amber-500 disabled:opacity-40 font-extrabold rounded-xl transition shadow-lg"
            >
              Heavy Strike 💥 (25 MP)
            </button>
            <button
              onClick={() => handleTurn("HEAL")}
              disabled={heroMana < 20}
              className="py-3 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 font-extrabold rounded-xl transition shadow-lg"
            >
              Heal 💚 (20 MP)
            </button>
            <button
              onClick={() => handleTurn("GUARD")}
              className="py-3 bg-indigo-600 hover:bg-indigo-500 font-extrabold rounded-xl transition shadow-lg"
            >
              Guard 🛡️
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-4 py-4">
            <h2 className="text-2xl font-bold text-amber-400">
              {gameState === "WON" ? "Glorious Victory!" : gameState === "LOST" ? "Defeated in Combat" : "Legend Quest"}
            </h2>
            <button
              onClick={startGame}
              className="px-8 py-3 bg-amber-600 hover:bg-amber-500 font-extrabold uppercase rounded-full tracking-wider transition"
            >
              {gameState === "START" ? "Begin Quest" : "Play Again"}
            </button>
          </div>
        )}

        {/* Combat Log */}
        <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-800 text-xs font-mono h-28 overflow-y-auto flex flex-col gap-1 text-zinc-400">
          {combatLog.map((line, idx) => (
            <div key={idx} className={idx === 0 ? "text-amber-300 font-bold" : ""}>
              &gt; {line}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
