'use client';

import React, { useEffect, useState } from 'react';

interface Quest {
  id: string;
  name: string;
  icon: string;
  difficulty: number;
  reqWarrior: number;
  reqMage: number;
  reqRogue: number;
  goldReward: number;
  scoreReward: number;
  conquered: boolean;
}

export default function TurboQuest() {
  const [gold, setGold] = useState(100);
  const [score, setScore] = useState(0);
  const [warriors, setWarriors] = useState(1);
  const [mages, setMages] = useState(0);
  const [rogues, setRogues] = useState(0);

  const [quests, setQuests] = useState<Quest[]>([
    {
      id: 'forest',
      name: 'Goblin Forest',
      icon: '🌲',
      difficulty: 1,
      reqWarrior: 2,
      reqMage: 0,
      reqRogue: 1,
      goldReward: 150,
      scoreReward: 200,
      conquered: false,
    },
    {
      id: 'cave',
      name: 'Crystal Cavern',
      icon: '💎',
      difficulty: 2,
      reqWarrior: 3,
      reqMage: 2,
      reqRogue: 1,
      goldReward: 350,
      scoreReward: 500,
      conquered: false,
    },
    {
      id: 'volcano',
      name: 'Molten Peak',
      icon: '🌋',
      difficulty: 3,
      reqWarrior: 4,
      reqMage: 3,
      reqRogue: 3,
      goldReward: 750,
      scoreReward: 1000,
      conquered: false,
    },
    {
      id: 'void',
      name: 'Void Citadel',
      icon: '🌌',
      difficulty: 4,
      reqWarrior: 6,
      reqMage: 5,
      reqRogue: 4,
      goldReward: 1500,
      scoreReward: 2500,
      conquered: false,
    },
  ]);

  const [gameOver, setGameOver] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);

  const initGame = () => {
    setGold(100);
    setScore(0);
    setWarriors(1);
    setMages(0);
    setRogues(0);
    setQuests([
      {
        id: 'forest',
        name: 'Goblin Forest',
        icon: '🌲',
        difficulty: 1,
        reqWarrior: 2,
        reqMage: 0,
        reqRogue: 1,
        goldReward: 150,
        scoreReward: 200,
        conquered: false,
      },
      {
        id: 'cave',
        name: 'Crystal Cavern',
        icon: '💎',
        difficulty: 2,
        reqWarrior: 3,
        reqMage: 2,
        reqRogue: 1,
        goldReward: 350,
        scoreReward: 500,
        conquered: false,
      },
      {
        id: 'volcano',
        name: 'Molten Peak',
        icon: '🌋',
        difficulty: 3,
        reqWarrior: 4,
        reqMage: 3,
        reqRogue: 3,
        goldReward: 750,
        scoreReward: 1000,
        conquered: false,
      },
      {
        id: 'void',
        name: 'Void Citadel',
        icon: '🌌',
        difficulty: 4,
        reqWarrior: 6,
        reqMage: 5,
        reqRogue: 4,
        goldReward: 1500,
        scoreReward: 2500,
        conquered: false,
      },
    ]);
    setGameOver(false);
    setGameStarted(true);
  };

  useEffect(() => {
    if (!gameStarted || gameOver) return;

    // Gold passive gain (income)
    const interval = setInterval(() => {
      setGold((prev) => prev + 5);
    }, 1000);

    return () => clearInterval(interval);
  }, [gameStarted, gameOver]);

  const hireUnit = (type: 'warrior' | 'mage' | 'rogue') => {
    const costs = { warrior: 40, mage: 60, rogue: 50 };
    if (gold < costs[type]) return;

    setGold((prev) => prev - costs[type]);
    if (type === 'warrior') setWarriors((v) => v + 1);
    if (type === 'mage') setMages((v) => v + 1);
    if (type === 'rogue') setRogues((v) => v + 1);
  };

  const embarkQuest = (quest: Quest) => {
    if (
      warriors >= quest.reqWarrior &&
      mages >= quest.reqMage &&
      rogues >= quest.reqRogue
    ) {
      const nextGold = gold + quest.goldReward;
      const nextScore = score + quest.scoreReward;
      setGold(nextGold);
      setScore(nextScore);

      setQuests((prev) =>
        prev.map((q) => (q.id === quest.id ? { ...q, conquered: true } : q))
      );

      // Check if all conquered
      const remainingUnconquered = quests.filter(
        (q) => q.id !== quest.id && !q.conquered
      ).length;

      if (remainingUnconquered === 0) {
        const finalScore = nextScore + 1000;
        setScore(finalScore);
        setGameOver(true);
        window.dispatchEvent(
          new CustomEvent('xakteir-game-score', { detail: { score: finalScore } })
        );
      }
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[450px] bg-zinc-950 text-white p-4 rounded-xl border border-zinc-800">
      <div className="w-full max-w-[420px] flex justify-between items-center mb-3">
        <h2 className="text-xl font-bold text-emerald-400">TURBO QUEST</h2>
        <div className="flex gap-2 text-xs font-bold">
          <span className="bg-amber-950 text-amber-400 px-3 py-1 rounded-full border border-amber-800">
            💰 {gold}
          </span>
          <span className="bg-emerald-950 text-emerald-400 px-3 py-1 rounded-full border border-emerald-800">
            ⭐ {score}
          </span>
        </div>
      </div>

      <div className="relative w-full max-w-[420px] bg-zinc-900 border-2 border-emerald-500/40 rounded-xl p-4 flex flex-col gap-3 min-h-[340px]">
        {/* Guild Squad Panel */}
        <div className="bg-zinc-950 p-3 rounded-lg border border-zinc-800 flex justify-between items-center">
          <div>
            <h4 className="text-xs font-bold text-zinc-400 mb-1">GUILD SQUAD</h4>
            <div className="flex gap-3 text-xs">
              <span>⚔️ {warriors}</span>
              <span>🔮 {mages}</span>
              <span>🗡️ {rogues}</span>
            </div>
          </div>
          <div className="flex gap-1.5">
            <button
              onClick={() => hireUnit('warrior')}
              disabled={gold < 40}
              className="px-2 py-1 bg-zinc-800 hover:bg-zinc-700 disabled:opacity-40 rounded text-[11px] font-semibold border border-zinc-700"
            >
              +⚔️ (40g)
            </button>
            <button
              onClick={() => hireUnit('mage')}
              disabled={gold < 60}
              className="px-2 py-1 bg-zinc-800 hover:bg-zinc-700 disabled:opacity-40 rounded text-[11px] font-semibold border border-zinc-700"
            >
              +🔮 (60g)
            </button>
            <button
              onClick={() => hireUnit('rogue')}
              disabled={gold < 50}
              className="px-2 py-1 bg-zinc-800 hover:bg-zinc-700 disabled:opacity-40 rounded text-[11px] font-semibold border border-zinc-700"
            >
              +🗡️ (50g)
            </button>
          </div>
        </div>

        {/* Quests List */}
        <div className="flex flex-col gap-2">
          {quests.map((q) => {
            const canEmbark =
              warriors >= q.reqWarrior &&
              mages >= q.reqMage &&
              rogues >= q.reqRogue;

            return (
              <div
                key={q.id}
                className={`p-3 rounded-lg border flex justify-between items-center ${
                  q.conquered
                    ? 'bg-emerald-950/30 border-emerald-500/40 opacity-70'
                    : 'bg-zinc-950 border-zinc-800'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{q.icon}</span>
                  <div>
                    <h5 className="text-sm font-bold text-zinc-200">{q.name}</h5>
                    <p className="text-[11px] text-zinc-400">
                      Req: ⚔️{q.reqWarrior} 🔮{q.reqMage} 🗡️{q.reqRogue}
                    </p>
                  </div>
                </div>

                {q.conquered ? (
                  <span className="text-xs font-bold text-emerald-400">✓ CONQUERED</span>
                ) : (
                  <button
                    onClick={() => embarkQuest(q)}
                    disabled={!canEmbark}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-30 rounded text-xs font-bold shadow"
                  >
                    EMBARK
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {(!gameStarted || gameOver) && (
          <div className="absolute inset-0 bg-black/85 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center rounded-xl z-10">
            <h3 className="text-2xl font-bold mb-2 text-emerald-400">
              {gameOver ? 'REALM SAVED!' : 'TURBO QUEST'}
            </h3>
            {gameOver && <p className="text-zinc-300 mb-4">Final Score: {score}</p>}
            <button
              onClick={initGame}
              className="px-6 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg transition transform hover:scale-105"
            >
              {gameOver ? 'Play Again' : 'Start Quest'}
            </button>
          </div>
        )}
      </div>

      <p className="text-xs text-zinc-500 mt-3">Hire party members and complete quests to conquer the kingdom!</p>
    </div>
  );
}
