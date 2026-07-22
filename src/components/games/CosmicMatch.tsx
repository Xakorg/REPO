'use client';

import React, { useEffect, useState } from 'react';

const SYMBOLS = ['⭐', '🌙', '🪐', '☀️', '☄️'];
const GRID_SIZE = 6;

export default function CosmicMatch() {
  const [grid, setGrid] = useState<string[][]>([]);
  const [selected, setSelected] = useState<[number, number] | null>(null);
  const [score, setScore] = useState<number>(0);
  const [timeLeft, setTimeLeft] = useState<number>(60);
  const [gameState, setGameState] = useState<'START' | 'PLAYING' | 'GAMEOVER'>('START');

  const createBoard = () => {
    const newGrid: string[][] = [];
    for (let r = 0; r < GRID_SIZE; r++) {
      const row: string[] = [];
      for (let c = 0; c < GRID_SIZE; c++) {
        row.push(SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)]);
      }
      newGrid.push(row);
    }
    return newGrid;
  };

  const startGame = () => {
    setGrid(createBoard());
    setScore(0);
    setTimeLeft(60);
    setSelected(null);
    setGameState('PLAYING');
  };

  useEffect(() => {
    if (gameState !== 'PLAYING') return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setGameState('GAMEOVER');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [gameState]);

  useEffect(() => {
    if (gameState === 'GAMEOVER') {
      window.dispatchEvent(new CustomEvent('xakteir-game-score', { detail: { score } }));
    }
  }, [gameState, score]);

  const checkMatches = (currentGrid: string[][]) => {
    const matched: boolean[][] = Array(GRID_SIZE)
      .fill(false)
      .map(() => Array(GRID_SIZE).fill(false));
    let hasMatch = false;

    // Horizontal
    for (let r = 0; r < GRID_SIZE; r++) {
      for (let c = 0; c < GRID_SIZE - 2; c++) {
        const val = currentGrid[r][c];
        if (val && val === currentGrid[r][c + 1] && val === currentGrid[r][c + 2]) {
          matched[r][c] = true;
          matched[r][c + 1] = true;
          matched[r][c + 2] = true;
          hasMatch = true;
        }
      }
    }

    // Vertical
    for (let r = 0; r < GRID_SIZE - 2; r++) {
      for (let c = 0; c < GRID_SIZE; c++) {
        const val = currentGrid[r][c];
        if (val && val === currentGrid[r + 1][c] && val === currentGrid[r + 2][c]) {
          matched[r][c] = true;
          matched[r + 1][c] = true;
          matched[r + 2][c] = true;
          hasMatch = true;
        }
      }
    }

    if (hasMatch) {
      let count = 0;
      const nextGrid = currentGrid.map((row) => [...row]);
      for (let r = 0; r < GRID_SIZE; r++) {
        for (let c = 0; c < GRID_SIZE; c++) {
          if (matched[r][c]) {
            count++;
            nextGrid[r][c] = SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)];
          }
        }
      }
      setScore((prev) => prev + count * 50);
      setGrid(nextGrid);
    }
  };

  const handleTileClick = (r: number, c: number) => {
    if (gameState !== 'PLAYING') return;

    if (!selected) {
      setSelected([r, c]);
    } else {
      const [sr, sc] = selected;
      const isAdjacent = Math.abs(sr - r) + Math.abs(sc - c) === 1;

      if (isAdjacent) {
        const newGrid = grid.map((row) => [...row]);
        const temp = newGrid[sr][sc];
        newGrid[sr][sc] = newGrid[r][c];
        newGrid[r][c] = temp;
        setGrid(newGrid);
        checkMatches(newGrid);
      }
      setSelected(null);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[500px] bg-zinc-950 text-white rounded-xl p-4">
      <div className="flex justify-between items-center w-full max-w-[450px] mb-4">
        <div>
          <h2 className="text-xl font-bold text-amber-400">Cosmic Match</h2>
          <p className="text-xs text-zinc-400">Swap cosmic celestial symbols to match 3 or more!</p>
        </div>
        <div className="text-right">
          <div className="text-sm text-red-400">Time: {timeLeft}s</div>
          <div className="text-lg font-semibold text-amber-400">Score: {score}</div>
        </div>
      </div>

      <div className="relative border border-amber-900/50 rounded-xl overflow-hidden p-4 bg-zinc-900/90 shadow-2xl w-[450px]">
        <div className="grid grid-cols-6 gap-2">
          {grid.map((row, r) =>
            row.map((symbol, c) => {
              const isSelected = selected && selected[0] === r && selected[1] === c;
              return (
                <button
                  key={`${r}-${c}`}
                  onClick={() => handleTileClick(r, c)}
                  className={`w-14 h-14 text-2xl flex items-center justify-center rounded-xl transition border ${
                    isSelected
                      ? 'bg-amber-500/40 border-amber-400 scale-105 shadow-lg shadow-amber-500/50'
                      : 'bg-zinc-950/80 border-zinc-800 hover:border-amber-500/50'
                  }`}
                >
                  {symbol}
                </button>
              );
            })
          )}
        </div>

        {gameState === 'START' && (
          <div className="absolute inset-0 bg-zinc-950/95 flex flex-col items-center justify-center p-6 text-center z-10">
            <h3 className="text-3xl font-extrabold text-amber-400 mb-2">COSMIC MATCH</h3>
            <p className="text-zinc-400 mb-6 max-w-xs text-sm">
              Click two adjacent cosmic symbols to swap them. Match 3 or more in a row or column before time expires!
            </p>
            <button
              onClick={startGame}
              className="px-6 py-3 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-lg transition shadow-lg shadow-amber-600/30"
            >
              Start Puzzle
            </button>
          </div>
        )}

        {gameState === 'GAMEOVER' && (
          <div className="absolute inset-0 bg-zinc-950/95 flex flex-col items-center justify-center p-6 text-center z-10">
            <h3 className="text-3xl font-extrabold text-amber-400 mb-2">TIME EXPIRED</h3>
            <p className="text-zinc-300 text-lg mb-4">
              Final Score: <span className="text-amber-400 font-bold">{score}</span>
            </p>
            <button
              onClick={startGame}
              className="px-6 py-3 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-lg transition"
            >
              Play Again
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
