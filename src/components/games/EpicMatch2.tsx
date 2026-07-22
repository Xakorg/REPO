'use client';

import React, { useEffect, useState } from 'react';

const GRID_SIZE = 6;
const GEM_TYPES = ['💎', '🔥', '⚡', '🌿', '🔮'];

export default function EpicMatch2() {
  const [grid, setGrid] = useState<string[][]>([]);
  const [selected, setSelected] = useState<[number, number] | null>(null);
  const [score, setScore] = useState(0);
  const [movesLeft, setMovesLeft] = useState(15);
  const [gameState, setGameState] = useState<'START' | 'PLAYING' | 'GAMEOVER'>('START');

  const createInitialGrid = () => {
    const newGrid: string[][] = [];
    for (let r = 0; r < GRID_SIZE; r++) {
      const row: string[] = [];
      for (let c = 0; c < GRID_SIZE; c++) {
        row.push(GEM_TYPES[Math.floor(Math.random() * GEM_TYPES.length)]);
      }
      newGrid.push(row);
    }
    return newGrid;
  };

  const initGame = () => {
    setGrid(createInitialGrid());
    setSelected(null);
    setScore(0);
    setMovesLeft(15);
    setGameState('PLAYING');
  };

  const checkMatchesAndPop = (currentGrid: string[][]): { grid: string[][]; points: number } => {
    const matched = Array.from({ length: GRID_SIZE }, () => Array(GRID_SIZE).fill(false));
    let hasMatches = false;

    // Horizontal check
    for (let r = 0; r < GRID_SIZE; r++) {
      for (let c = 0; c < GRID_SIZE - 2; c++) {
        const val = currentGrid[r][c];
        if (val && val === currentGrid[r][c + 1] && val === currentGrid[r][c + 2]) {
          matched[r][c] = true;
          matched[r][c + 1] = true;
          matched[r][c + 2] = true;
          hasMatches = true;
        }
      }
    }

    // Vertical check
    for (let r = 0; r < GRID_SIZE - 2; r++) {
      for (let c = 0; c < GRID_SIZE; c++) {
        const val = currentGrid[r][c];
        if (val && val === currentGrid[r + 1][c] && val === currentGrid[r + 2][c]) {
          matched[r][c] = true;
          matched[r + 1][c] = true;
          matched[r + 2][c] = true;
          hasMatches = true;
        }
      }
    }

    if (!hasMatches) return { grid: currentGrid, points: 0 };

    let count = 0;
    const nextGrid = currentGrid.map((row) => [...row]);
    for (let r = 0; r < GRID_SIZE; r++) {
      for (let c = 0; c < GRID_SIZE; c++) {
        if (matched[r][c]) {
          count++;
          nextGrid[r][c] = GEM_TYPES[Math.floor(Math.random() * GEM_TYPES.length)];
        }
      }
    }

    return { grid: nextGrid, points: count * 30 };
  };

  const handleTileClick = (r: number, c: number) => {
    if (gameState !== 'PLAYING') return;

    if (!selected) {
      setSelected([r, c]);
      return;
    }

    const [sr, sc] = selected;
    const isAdjacent = (Math.abs(sr - r) === 1 && sc === c) || (Math.abs(sc - c) === 1 && sr === r);

    if (!isAdjacent) {
      setSelected([r, c]);
      return;
    }

    // Swap
    const newGrid = grid.map((row) => [...row]);
    const temp = newGrid[sr][sc];
    newGrid[sr][sc] = newGrid[r][c];
    newGrid[r][c] = temp;

    const { grid: poppedGrid, points } = checkMatchesAndPop(newGrid);

    if (points > 0) {
      setGrid(poppedGrid);
      const updatedScore = score + points;
      setScore(updatedScore);

      const nextMoves = movesLeft - 1;
      setMovesLeft(nextMoves);
      setSelected(null);

      if (nextMoves <= 0) {
        setGameState('GAMEOVER');
        window.dispatchEvent(
          new CustomEvent('xakteir-game-score', { detail: { score: updatedScore } })
        );
      }
    } else {
      // Revert swap if no match
      setSelected(null);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[450px] bg-zinc-950 text-white p-4 rounded-xl shadow-2xl border border-zinc-800 w-full max-w-md mx-auto">
      <h2 className="text-2xl font-bold tracking-wider text-pink-400 mb-2">EPIC MATCH 2</h2>

      <div className="relative w-full bg-zinc-900 border border-pink-500/30 rounded-lg p-4 flex flex-col items-center justify-center min-h-[380px]">
        {gameState === 'START' && (
          <div className="absolute inset-0 bg-black/85 flex flex-col items-center justify-center p-6 text-center rounded-lg z-10">
            <h3 className="text-xl font-bold text-pink-400 mb-2 font-mono">Gem Fusion Puzzle</h3>
            <p className="text-zinc-400 text-sm mb-6">Swap adjacent gems to create 3-in-a-row matches before moves run out!</p>
            <button
              onClick={initGame}
              className="px-6 py-3 bg-pink-600 hover:bg-pink-500 text-white font-bold rounded-lg transition-all shadow-lg"
            >
              Start Matching
            </button>
          </div>
        )}

        {gameState === 'GAMEOVER' && (
          <div className="absolute inset-0 bg-black/90 flex flex-col items-center justify-center p-6 text-center rounded-lg z-10">
            <h3 className="text-2xl font-bold text-pink-400 mb-2">OUT OF MOVES</h3>
            <p className="text-zinc-300 text-lg mb-1">Total Epic Score:</p>
            <p className="text-3xl font-extrabold text-pink-400 mb-6">{score}</p>
            <button
              onClick={initGame}
              className="px-6 py-3 bg-pink-600 hover:bg-pink-500 text-white font-bold rounded-lg transition-all shadow-lg"
            >
              Play Again
            </button>
          </div>
        )}

        <div className="grid grid-cols-6 gap-2 bg-zinc-950 p-3 rounded-xl border border-zinc-800">
          {grid.map((row, r) =>
            row.map((gem, c) => {
              const isSelected = selected && selected[0] === r && selected[1] === c;
              return (
                <button
                  key={`${r}-${c}`}
                  onClick={() => handleTileClick(r, c)}
                  className={`w-11 h-11 text-2xl flex items-center justify-center rounded-lg transition-all border ${
                    isSelected
                      ? 'bg-pink-900/80 border-pink-400 scale-105 shadow-md shadow-pink-500/50'
                      : 'bg-zinc-900 border-zinc-800 hover:bg-zinc-800'
                  }`}
                >
                  {gem}
                </button>
              );
            })
          )}
        </div>
      </div>

      <div className="flex justify-between w-full mt-3 text-sm font-semibold text-zinc-400">
        <span>Moves Left: <span className="text-pink-400">{movesLeft}</span></span>
        <span>Score: <span className="text-pink-400">{score}</span></span>
      </div>
    </div>
  );
}
