'use client';

import React, { useState } from 'react';

const COLS = 5;
const ROWS = 6;
const BALL_TYPES = ['🔴', '🔵', '🟢', '🟡', '🟣'];

export default function SuperDrop2() {
  const [grid, setGrid] = useState<string[][]>(() =>
    Array.from({ length: ROWS }, () => Array(COLS).fill(''))
  );
  const [currentNext, setCurrentNext] = useState<string>(
    () => BALL_TYPES[Math.floor(Math.random() * BALL_TYPES.length)]
  );
  const [score, setScore] = useState(0);
  const [gameState, setGameState] = useState<'START' | 'PLAYING' | 'GAMEOVER'>('START');

  const initGame = () => {
    setGrid(Array.from({ length: ROWS }, () => Array(COLS).fill('')));
    setCurrentNext(BALL_TYPES[Math.floor(Math.random() * BALL_TYPES.length)]);
    setScore(0);
    setGameState('PLAYING');
  };

  const popMatches = (g: string[][]): { newGrid: string[][]; points: number } => {
    const matched = Array.from({ length: ROWS }, () => Array(COLS).fill(false));
    let matchCount = 0;

    // Check vertical
    for (let c = 0; c < COLS; c++) {
      for (let r = 0; r < ROWS - 2; r++) {
        const val = g[r][c];
        if (val && val === g[r + 1][c] && val === g[r + 2][c]) {
          matched[r][c] = true;
          matched[r + 1][c] = true;
          matched[r + 2][c] = true;
          matchCount++;
        }
      }
    }

    // Check horizontal
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS - 2; c++) {
        const val = g[r][c];
        if (val && val === g[r][c + 1] && val === g[r][c + 2]) {
          matched[r][c] = true;
          matched[r][c + 1] = true;
          matched[r][c + 2] = true;
          matchCount++;
        }
      }
    }

    if (matchCount === 0) return { newGrid: g, points: 0 };

    const newGrid = g.map((row) => [...row]);
    let popped = 0;

    for (let c = 0; c < COLS; c++) {
      let writeRow = ROWS - 1;
      for (let r = ROWS - 1; r >= 0; r--) {
        if (!matched[r][c] && g[r][c] !== '') {
          newGrid[writeRow][c] = g[r][c];
          writeRow--;
        } else if (matched[r][c]) {
          popped++;
        }
      }
      for (let r = writeRow; r >= 0; r--) {
        newGrid[r][c] = '';
      }
    }

    return { newGrid, points: popped * 40 };
  };

  const dropInColumn = (colIndex: number) => {
    if (gameState !== 'PLAYING') return;

    // Find lowest empty row in colIndex
    let targetRow = -1;
    for (let r = ROWS - 1; r >= 0; r--) {
      if (grid[r][colIndex] === '') {
        targetRow = r;
        break;
      }
    }

    if (targetRow === -1) {
      // Column is full, Game Over
      setGameState('GAMEOVER');
      window.dispatchEvent(
        new CustomEvent('xakteir-game-score', { detail: { score } })
      );
      return;
    }

    const newGrid = grid.map((row) => [...row]);
    newGrid[targetRow][colIndex] = currentNext;

    let { newGrid: resolvedGrid, points } = popMatches(newGrid);
    let totalPoints = points;

    // Chain reaction evaluation
    let chainCount = 0;
    while (points > 0 && chainCount < 5) {
      const result = popMatches(resolvedGrid);
      points = result.points;
      resolvedGrid = result.newGrid;
      totalPoints += points;
      chainCount++;
    }

    setGrid(resolvedGrid);
    const updatedScore = score + (totalPoints > 0 ? totalPoints : 10);
    setScore(updatedScore);
    setCurrentNext(BALL_TYPES[Math.floor(Math.random() * BALL_TYPES.length)]);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[450px] bg-zinc-950 text-white p-4 rounded-xl shadow-2xl border border-zinc-800 w-full max-w-md mx-auto">
      <h2 className="text-2xl font-bold tracking-wider text-emerald-400 mb-2">SUPER DROP 2</h2>

      <div className="relative w-full bg-zinc-900 border border-emerald-500/30 rounded-lg p-4 flex flex-col items-center min-h-[380px]">
        {gameState === 'START' && (
          <div className="absolute inset-0 bg-black/85 flex flex-col items-center justify-center p-6 text-center rounded-lg z-10">
            <h3 className="text-xl font-bold text-emerald-400 mb-2 font-mono">Gravity Sphere Drop</h3>
            <p className="text-zinc-400 text-sm mb-6">Drop colored spheres to align 3 matching colors!</p>
            <button
              onClick={initGame}
              className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg transition-all shadow-lg"
            >
              Start Dropping
            </button>
          </div>
        )}

        {gameState === 'GAMEOVER' && (
          <div className="absolute inset-0 bg-black/90 flex flex-col items-center justify-center p-6 text-center rounded-lg z-10">
            <h3 className="text-2xl font-bold text-red-500 mb-2">GRID OVERFLOW</h3>
            <p className="text-zinc-300 text-lg mb-1">Final Drop Score:</p>
            <p className="text-3xl font-extrabold text-emerald-400 mb-6">{score}</p>
            <button
              onClick={initGame}
              className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg transition-all shadow-lg"
            >
              Try Again
            </button>
          </div>
        )}

        {/* Next Sphere Header */}
        <div className="flex items-center gap-3 mb-3 bg-zinc-950 px-4 py-2 rounded-lg border border-zinc-800">
          <span className="text-xs font-semibold text-zinc-400">NEXT SPHERE:</span>
          <span className="text-2xl animate-bounce">{currentNext}</span>
        </div>

        {/* Column Drop Buttons */}
        <div className="grid grid-cols-5 gap-2 w-full mb-2">
          {Array.from({ length: COLS }).map((_, colIdx) => (
            <button
              key={colIdx}
              onClick={() => dropInColumn(colIdx)}
              className="bg-emerald-950/40 hover:bg-emerald-900/60 border border-emerald-500/30 text-emerald-300 font-bold py-1 text-xs rounded transition-all"
            >
              DROP
            </button>
          ))}
        </div>

        {/* Grid Display */}
        <div className="grid grid-cols-5 gap-2 bg-zinc-950 p-3 rounded-xl border border-zinc-800">
          {grid.map((row, r) =>
            row.map((val, c) => (
              <div
                key={`${r}-${c}`}
                onClick={() => dropInColumn(c)}
                className="w-12 h-12 text-2xl flex items-center justify-center rounded-lg bg-zinc-900 border border-zinc-800 hover:border-emerald-500/50 cursor-pointer"
              >
                {val}
              </div>
            ))
          )}
        </div>
      </div>

      <div className="flex justify-between w-full mt-3 text-sm font-semibold text-zinc-400">
        <span>Score: <span className="text-emerald-400">{score}</span></span>
        <span>Click column or DROP button</span>
      </div>
    </div>
  );
}
