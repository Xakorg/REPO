'use client';

import React, { useState } from 'react';

type Entity = 'player' | 'enemy' | 'treasure' | 'potion' | null;

export default function PixelQuest() {
  const GRID_SIZE = 7;
  const [playerPos, setPlayerPos] = useState({ r: 3, c: 3 });
  const [hp, setHp] = useState(100);
  const [score, setScore] = useState(0);
  const [grid, setGrid] = useState<Entity[][]>([]);
  const [gameState, setGameState] = useState<'start' | 'playing' | 'gameover'>('start');

  const generateGrid = () => {
    const newGrid: Entity[][] = Array(GRID_SIZE).fill(null).map(() => Array(GRID_SIZE).fill(null));
    // Place items and enemies randomly
    for (let i = 0; i < 4; i++) {
      let r = Math.floor(Math.random() * GRID_SIZE);
      let c = Math.floor(Math.random() * GRID_SIZE);
      if (r !== 3 || c !== 3) newGrid[r][c] = 'treasure';
    }
    for (let i = 0; i < 4; i++) {
      let r = Math.floor(Math.random() * GRID_SIZE);
      let c = Math.floor(Math.random() * GRID_SIZE);
      if ((r !== 3 || c !== 3) && !newGrid[r][c]) newGrid[r][c] = 'enemy';
    }
    for (let i = 0; i < 2; i++) {
      let r = Math.floor(Math.random() * GRID_SIZE);
      let c = Math.floor(Math.random() * GRID_SIZE);
      if ((r !== 3 || c !== 3) && !newGrid[r][c]) newGrid[r][c] = 'potion';
    }
    return newGrid;
  };

  const startGame = () => {
    setPlayerPos({ r: 3, c: 3 });
    setHp(100);
    setScore(0);
    setGrid(generateGrid());
    setGameState('playing');
  };

  const movePlayer = (dr: number, dc: number) => {
    if (gameState !== 'playing') return;
    const nr = playerPos.r + dr;
    const nc = playerPos.c + dc;

    if (nr < 0 || nr >= GRID_SIZE || nc < 0 || nc >= GRID_SIZE) return;

    const target = grid[nr][nc];
    let currentHp = hp;
    let currentScore = score;

    if (target === 'treasure') {
      currentScore += 25;
    } else if (target === 'potion') {
      currentHp = Math.min(100, currentHp + 30);
    } else if (target === 'enemy') {
      currentHp -= 25;
      currentScore += 50;
    }

    const nextGrid = grid.map((row, r) =>
      row.map((cell, c) => (r === nr && c === nc ? null : cell))
    );

    // Respawn items if empty
    const totalItems = nextGrid.flat().filter(Boolean).length;
    if (totalItems < 3) {
      let r = Math.floor(Math.random() * GRID_SIZE);
      let c = Math.floor(Math.random() * GRID_SIZE);
      if (r !== nr || c !== nc) {
        nextGrid[r][c] = Math.random() > 0.4 ? 'enemy' : 'treasure';
      }
    }

    setPlayerPos({ r: nr, c: nc });
    setGrid(nextGrid);
    setScore(currentScore);

    if (currentHp <= 0) {
      setHp(0);
      setGameState('gameover');
      window.dispatchEvent(
        new CustomEvent('xakteir-game-score', { detail: { score: currentScore } })
      );
    } else {
      setHp(currentHp);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[450px] bg-zinc-950 text-white p-4 rounded-xl border border-zinc-800">
      <div className="flex justify-between w-full max-w-[400px] mb-3 items-center">
        <h2 className="text-xl font-bold text-emerald-400">PIXEL QUEST</h2>
        <div className="flex gap-4 font-mono text-sm">
          <div>HP: <span className="text-red-400 font-bold">{hp}</span></div>
          <div>Score: <span className="text-yellow-400 font-bold">{score}</span></div>
        </div>
      </div>

      <div className="relative w-full max-w-[360px] aspect-square bg-zinc-900 border-2 border-emerald-900 rounded-xl p-2 flex flex-col items-center justify-center">
        <div className="grid grid-cols-7 gap-1 w-full h-full">
          {Array.from({ length: GRID_SIZE }).map((_, r) =>
            Array.from({ length: GRID_SIZE }).map((_, c) => {
              const isPlayer = playerPos.r === r && playerPos.c === c;
              const cell = grid[r]?.[c];
              return (
                <div
                  key={`${r}-${c}`}
                  className="bg-zinc-800/90 rounded flex items-center justify-center font-bold text-lg select-none"
                >
                  {isPlayer ? (
                    <span className="text-emerald-400 animate-pulse text-xl">⚔️</span>
                  ) : cell === 'treasure' ? (
                    <span className="text-yellow-400">💎</span>
                  ) : cell === 'enemy' ? (
                    <span className="text-red-500">👾</span>
                  ) : cell === 'potion' ? (
                    <span className="text-green-400">🧪</span>
                  ) : null}
                </div>
              );
            })
          )}
        </div>

        {gameState === 'playing' && (
          <div className="grid grid-cols-3 gap-2 mt-4 w-48">
            <div />
            <button onClick={() => movePlayer(-1, 0)} className="bg-zinc-700 hover:bg-zinc-600 font-bold py-1 rounded text-center">▲</button>
            <div />
            <button onClick={() => movePlayer(0, -1)} className="bg-zinc-700 hover:bg-zinc-600 font-bold py-1 rounded text-center">◀</button>
            <button onClick={() => movePlayer(1, 0)} className="bg-zinc-700 hover:bg-zinc-600 font-bold py-1 rounded text-center">▼</button>
            <button onClick={() => movePlayer(0, 1)} className="bg-zinc-700 hover:bg-zinc-600 font-bold py-1 rounded text-center">▶</button>
          </div>
        )}

        {gameState === 'start' && (
          <div className="absolute inset-0 bg-black/85 flex flex-col items-center justify-center p-4 rounded-xl">
            <h1 className="text-2xl font-extrabold mb-2 text-emerald-400">PIXEL QUEST</h1>
            <p className="text-sm text-zinc-400 mb-6 text-center">
              Collect Gems 💎, Drink Potions 🧪, Fight Monsters 👾!
            </p>
            <button
              onClick={startGame}
              className="px-6 py-2 bg-emerald-600 hover:bg-emerald-500 font-bold rounded-lg transition"
            >
              START QUEST
            </button>
          </div>
        )}

        {gameState === 'gameover' && (
          <div className="absolute inset-0 bg-black/90 flex flex-col items-center justify-center p-4 rounded-xl">
            <h2 className="text-2xl font-bold text-red-500 mb-2">YOU DIED</h2>
            <p className="text-lg text-zinc-300 mb-6">Final Score: {score}</p>
            <button
              onClick={startGame}
              className="px-6 py-2 bg-emerald-600 hover:bg-emerald-500 font-bold rounded-lg transition"
            >
              RESTART QUEST
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
