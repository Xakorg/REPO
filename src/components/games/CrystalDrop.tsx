'use client';

import React, { useState, useEffect } from 'react';

const COLORS = ['💎', '🔮', '🔴', '🟢', '🟡'];
const ROWS = 8;
const COLS = 6;

export default function CrystalDrop() {
  const [grid, setGrid] = useState<string[][]>(() =>
    Array(ROWS).fill(null).map(() => Array(COLS).fill(''))
  );
  const [falling, setFalling] = useState<{ col: number; row: number; color: string } | null>(null);
  const [score, setScore] = useState(0);
  const [gameState, setGameState] = useState<'start' | 'playing' | 'gameover'>('start');

  const spawnCrystal = (currentGrid: string[][]) => {
    const col = Math.floor(Math.random() * COLS);
    const color = COLORS[Math.floor(Math.random() * COLORS.length)];
    if (currentGrid[0][col] !== '') {
      setGameState('gameover');
      return null;
    }
    return { col, row: 0, color };
  };

  const startGame = () => {
    const emptyGrid = Array(ROWS).fill(null).map(() => Array(COLS).fill(''));
    setGrid(emptyGrid);
    setScore(0);
    setFalling(spawnCrystal(emptyGrid));
    setGameState('playing');
  };

  useEffect(() => {
    if (gameState !== 'playing' || !falling) return;

    const timer = setInterval(() => {
      setFalling((prev) => {
        if (!prev) return null;
        const nextRow = prev.row + 1;

        if (nextRow >= ROWS || grid[nextRow][prev.col] !== '') {
          // Lock crystal
          const newGrid = grid.map((r) => [...r]);
          newGrid[prev.row][prev.col] = prev.color;

          // Check matches
          let points = 0;
          for (let r = 0; r < ROWS; r++) {
            for (let c = 0; c < COLS - 2; c++) {
              if (
                newGrid[r][c] &&
                newGrid[r][c] === newGrid[r][c + 1] &&
                newGrid[r][c] === newGrid[r][c + 2]
              ) {
                points += 30;
                newGrid[r][c] = '';
                newGrid[r][c + 1] = '';
                newGrid[r][c + 2] = '';
              }
            }
          }

          if (points > 0) {
            setScore((s) => s + points);
          }

          setGrid(newGrid);
          return spawnCrystal(newGrid);
        }

        return { ...prev, row: nextRow };
      });
    }, 450);

    return () => clearInterval(timer);
  }, [gameState, falling, grid]);

  useEffect(() => {
    if (gameState === 'gameover') {
      window.dispatchEvent(
        new CustomEvent('xakteir-game-score', { detail: { score } })
      );
    }
  }, [gameState, score]);

  const moveFalling = (dir: number) => {
    if (!falling || gameState !== 'playing') return;
    const newCol = falling.col + dir;
    if (newCol >= 0 && newCol < COLS && grid[falling.row][newCol] === '') {
      setFalling({ ...falling, col: newCol });
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[450px] bg-zinc-950 text-white p-4 rounded-xl border border-zinc-800">
      <div className="flex justify-between w-full max-w-[360px] mb-3 items-center">
        <h2 className="text-xl font-bold tracking-wider text-teal-400">CRYSTAL DROP</h2>
        <div className="text-lg font-mono">Score: <span className="text-yellow-400">{score}</span></div>
      </div>

      <div className="relative w-full max-w-[320px] bg-zinc-900 border-2 border-teal-900 rounded-xl p-3 flex flex-col items-center justify-center">
        <div className="grid grid-cols-6 gap-1 w-full aspect-[6/8]">
          {Array.from({ length: ROWS }).map((_, r) =>
            Array.from({ length: COLS }).map((_, c) => {
              const isFalling = falling?.row === r && falling?.col === c;
              const cellColor = isFalling ? falling.color : grid[r][c];

              return (
                <div
                  key={`${r}-${c}`}
                  className="bg-zinc-800/80 rounded flex items-center justify-center font-bold text-xl select-none"
                >
                  {cellColor || ''}
                </div>
              );
            })
          )}
        </div>

        {gameState === 'playing' && (
          <div className="flex gap-4 mt-4">
            <button onClick={() => moveFalling(-1)} className="px-6 py-2 bg-zinc-700 hover:bg-zinc-600 font-bold rounded-lg text-lg">◀ LEFT</button>
            <button onClick={() => moveFalling(1)} className="px-6 py-2 bg-zinc-700 hover:bg-zinc-600 font-bold rounded-lg text-lg">RIGHT ▶</button>
          </div>
        )}

        {gameState === 'start' && (
          <div className="absolute inset-0 bg-black/85 flex flex-col items-center justify-center p-4 rounded-xl">
            <h1 className="text-2xl font-extrabold mb-2 text-teal-400">CRYSTAL DROP</h1>
            <p className="text-sm text-zinc-400 mb-6 text-center">Match 3 crystals horizontally to clear them!</p>
            <button
              onClick={startGame}
              className="px-6 py-2 bg-teal-600 hover:bg-teal-500 font-bold rounded-lg transition"
            >
              START DROP
            </button>
          </div>
        )}

        {gameState === 'gameover' && (
          <div className="absolute inset-0 bg-black/90 flex flex-col items-center justify-center p-4 rounded-xl">
            <h2 className="text-2xl font-bold text-red-500 mb-2">GRID OVERFLOW</h2>
            <p className="text-lg text-zinc-300 mb-6">Final Score: {score}</p>
            <button
              onClick={startGame}
              className="px-6 py-2 bg-teal-600 hover:bg-teal-500 font-bold rounded-lg transition"
            >
              PLAY AGAIN
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
