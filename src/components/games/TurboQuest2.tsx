'use client';

import React, { useState } from 'react';

interface Entity {
  x: number;
  y: number;
  type: 'monster' | 'chest' | 'portal' | 'potion';
  hp?: number;
}

const GRID_SIZE = 7;

export default function TurboQuest2() {
  const [player, setPlayer] = useState({ x: 0, y: 0, hp: 100, maxHp: 100, atk: 25 });
  const [entities, setEntities] = useState<Entity[]>([]);
  const [floor, setFloor] = useState(1);
  const [score, setScore] = useState(0);
  const [gold, setGold] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const [log, setLog] = useState<string[]>([]);

  const generateFloor = (f: number) => {
    const newEntities: Entity[] = [
      { x: GRID_SIZE - 1, y: GRID_SIZE - 1, type: 'portal' },
      { x: Math.floor(Math.random() * 5) + 1, y: Math.floor(Math.random() * 5) + 1, type: 'chest' },
      { x: Math.floor(Math.random() * 5) + 1, y: Math.floor(Math.random() * 5) + 1, type: 'potion' },
    ];

    const monsterCount = 2 + Math.floor(f / 2);
    for (let i = 0; i < monsterCount; i++) {
      let mx = Math.floor(Math.random() * GRID_SIZE);
      let my = Math.floor(Math.random() * GRID_SIZE);
      if ((mx === 0 && my === 0) || (mx === GRID_SIZE - 1 && my === GRID_SIZE - 1)) {
        mx = 3;
        my = 3;
      }
      newEntities.push({ x: mx, y: my, type: 'monster', hp: 30 + f * 15 });
    }

    setEntities(newEntities);
  };

  const initGame = () => {
    setPlayer({ x: 0, y: 0, hp: 100, maxHp: 100, atk: 25 });
    setFloor(1);
    setScore(0);
    setGold(0);
    setGameOver(false);
    setGameStarted(true);
    setLog(['Entered floor 1. Find the portal!']);
    generateFloor(1);
  };

  const addLog = (msg: string) => {
    setLog((prev) => [msg, ...prev.slice(0, 3)]);
  };

  const movePlayer = (dx: number, dy: number) => {
    if (!gameStarted || gameOver) return;

    const nx = Math.max(0, Math.min(GRID_SIZE - 1, player.x + dx));
    const ny = Math.max(0, Math.min(GRID_SIZE - 1, player.y + dy));

    if (nx === player.x && ny === player.y) return;

    let currentScore = score;
    let currentGold = gold;
    let currentHp = player.hp;
    let nextEntities = [...entities];

    // Check interaction with target tile
    const targetIdx = nextEntities.findIndex((e) => e.x === nx && e.y === ny);

    if (targetIdx !== -1) {
      const target = nextEntities[targetIdx];
      if (target.type === 'monster') {
        // Fight monster
        const mHp = (target.hp || 30) - player.atk;
        if (mHp <= 0) {
          nextEntities.splice(targetIdx, 1);
          currentScore += 100 * floor;
          currentGold += 25;
          addLog(`Defeated Cyber-Beast! +${100 * floor} pts`);
        } else {
          target.hp = mHp;
          addLog(`Dealt ${player.atk} damage to Cyber-Beast.`);
        }
      } else if (target.type === 'chest') {
        nextEntities.splice(targetIdx, 1);
        currentGold += 50;
        currentScore += 150;
        addLog('Opened Supply Chest! +50 Gold');
      } else if (target.type === 'potion') {
        nextEntities.splice(targetIdx, 1);
        currentHp = Math.min(player.maxHp, currentHp + 40);
        addLog('Drank Nano-Potion! +40 HP');
      } else if (target.type === 'portal') {
        const nextFloor = floor + 1;
        setFloor(nextFloor);
        setScore(currentScore + 300);
        addLog(`Warped to Floor ${nextFloor}!`);
        setPlayer({ ...player, x: 0, y: 0, hp: currentHp });
        generateFloor(nextFloor);
        return;
      }
    }

    // Move enemies closer
    nextEntities.forEach((e) => {
      if (e.type === 'monster') {
        const mdx = player.x > e.x ? 1 : player.x < e.x ? -1 : 0;
        const mdy = player.y > e.y ? 1 : player.y < e.y ? -1 : 0;

        const targetX = e.x + mdx;
        const targetY = e.y + mdy;

        if (targetX === nx && targetY === ny) {
          // Monster attacks player
          const dmg = 12 + floor * 4;
          currentHp -= dmg;
          addLog(`Cyber-Beast strikes for ${dmg} damage!`);
        } else if (!nextEntities.some((o) => o !== e && o.x === targetX && o.y === targetY)) {
          e.x = targetX;
          e.y = targetY;
        }
      }
    });

    setScore(currentScore);
    setGold(currentGold);
    setEntities(nextEntities);

    if (currentHp <= 0) {
      setPlayer({ ...player, hp: 0, x: nx, y: ny });
      setGameOver(true);
      window.dispatchEvent(new CustomEvent('xakteir-game-score', { detail: { score: currentScore } }));
    } else {
      setPlayer({ ...player, hp: currentHp, x: nx, y: ny });
    }
  };

  const buyUpgrade = (type: 'hp' | 'atk') => {
    if (gold < 40) return;
    setGold((g) => g - 40);
    if (type === 'hp') {
      setPlayer((p) => ({ ...p, maxHp: p.maxHp + 25, hp: p.hp + 25 }));
      addLog('Upgraded Max HP +25!');
    } else {
      setPlayer((p) => ({ ...p, atk: p.atk + 10 }));
      addLog('Upgraded Attack +10!');
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[450px] bg-zinc-950 text-white p-4 rounded-xl border border-zinc-800">
      <div className="w-full max-w-[360px] flex justify-between items-center mb-2 text-xs font-semibold">
        <span className="text-amber-400 font-bold">Floor {floor}</span>
        <span className="text-cyan-400">Score: {score}</span>
        <span className="text-yellow-400">Gold: 💰{gold}</span>
      </div>

      <div className="relative p-2 bg-zinc-900 border-2 border-cyan-500/40 rounded-xl shadow-lg shadow-cyan-500/10">
        <div className="grid grid-cols-7 gap-1 w-[320px] h-[320px]">
          {Array.from({ length: GRID_SIZE * GRID_SIZE }).map((_, idx) => {
            const gx = idx % GRID_SIZE;
            const gy = Math.floor(idx / GRID_SIZE);
            const isPlayer = player.x === gx && player.y === gy;
            const entity = entities.find((e) => e.x === gx && e.y === gy);

            return (
              <div
                key={idx}
                className={`flex items-center justify-center text-lg rounded font-bold transition ${
                  isPlayer
                    ? 'bg-cyan-500 text-black shadow-md shadow-cyan-400/50'
                    : 'bg-zinc-800/60 border border-zinc-700/40'
                }`}
              >
                {isPlayer
                  ? '🏃'
                  : entity?.type === 'monster'
                  ? '👾'
                  : entity?.type === 'chest'
                  ? '📦'
                  : entity?.type === 'potion'
                  ? '🧪'
                  : entity?.type === 'portal'
                  ? '🌀'
                  : ''}
              </div>
            );
          })}
        </div>

        {(!gameStarted || gameOver) && (
          <div className="absolute inset-0 bg-black/85 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center rounded-xl z-10">
            <h3 className="text-2xl font-bold mb-2 text-cyan-400">{gameOver ? 'DEFEATED IN GRID' : 'TURBO QUEST 2'}</h3>
            {gameOver && <p className="text-zinc-300 mb-4 font-semibold">Reached Floor {floor} - Score: {score}</p>}
            <button
              onClick={initGame}
              className="px-6 py-2 bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-bold rounded-lg hover:opacity-90 transition transform hover:scale-105"
            >
              {gameOver ? 'Play Again' : 'Enter Dungeon'}
            </button>
          </div>
        )}
      </div>

      {/* Stats & Controls */}
      <div className="w-full max-w-[360px] mt-2 flex flex-col gap-2">
        <div className="flex justify-between items-center text-xs font-semibold">
          <span>HP: {player.hp}/{player.maxHp}</span>
          <span>ATK: {player.atk}</span>
          <div className="flex gap-1">
            <button
              disabled={gold < 40 || !gameStarted || gameOver}
              onClick={() => buyUpgrade('hp')}
              className="px-2 py-0.5 bg-zinc-800 border border-emerald-500/40 rounded text-[10px] text-emerald-400 disabled:opacity-40"
            >
              +HP (40G)
            </button>
            <button
              disabled={gold < 40 || !gameStarted || gameOver}
              onClick={() => buyUpgrade('atk')}
              className="px-2 py-0.5 bg-zinc-800 border border-rose-500/40 rounded text-[10px] text-rose-400 disabled:opacity-40"
            >
              +ATK (40G)
            </button>
          </div>
        </div>

        <div className="flex justify-center gap-2">
          <button
            onClick={() => movePlayer(-1, 0)}
            className="px-3 py-1 bg-zinc-800 border border-zinc-700 rounded text-xs font-bold"
          >
            ←
          </button>
          <div className="flex flex-col gap-1">
            <button
              onClick={() => movePlayer(0, -1)}
              className="px-3 py-1 bg-zinc-800 border border-zinc-700 rounded text-xs font-bold"
            >
              ↑
            </button>
            <button
              onClick={() => movePlayer(0, 1)}
              className="px-3 py-1 bg-zinc-800 border border-zinc-700 rounded text-xs font-bold"
            >
              ↓
            </button>
          </div>
          <button
            onClick={() => movePlayer(1, 0)}
            className="px-3 py-1 bg-zinc-800 border border-zinc-700 rounded text-xs font-bold"
          >
            →
          </button>
        </div>

        <div className="text-[10px] text-zinc-400 bg-zinc-900 p-1.5 rounded border border-zinc-800 min-h-[36px]">
          {log.map((l, i) => (
            <div key={i}>{l}</div>
          ))}
        </div>
      </div>
    </div>
  );
}
