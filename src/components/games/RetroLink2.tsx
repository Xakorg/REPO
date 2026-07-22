'use client';

import React, { useState, useEffect } from 'react';

type ColorType = 'red' | 'blue' | 'green' | 'yellow' | 'purple';

interface GridCell {
  r: number;
  c: number;
  color?: ColorType;
  nodeId?: number;
  pathColor?: ColorType;
}

const COLOR_MAP: Record<ColorType, string> = {
  red: '#ef4444',
  blue: '#3b82f6',
  green: '#10b981',
  yellow: '#eab308',
  purple: '#a855f7',
};

const LEVELS = [
  {
    size: 5,
    nodes: [
      { r: 0, c: 0, color: 'red', id: 1 },
      { r: 4, c: 0, color: 'red', id: 1 },
      { r: 0, c: 4, color: 'blue', id: 2 },
      { r: 3, c: 3, color: 'blue', id: 2 },
      { r: 2, c: 1, color: 'green', id: 3 },
      { r: 4, c: 4, color: 'green', id: 3 },
    ],
  },
  {
    size: 5,
    nodes: [
      { r: 0, c: 1, color: 'red', id: 1 },
      { r: 3, c: 4, color: 'red', id: 1 },
      { r: 1, c: 0, color: 'blue', id: 2 },
      { r: 4, c: 2, color: 'blue', id: 2 },
      { r: 2, c: 2, color: 'yellow', id: 3 },
      { r: 0, c: 4, color: 'yellow', id: 3 },
    ],
  },
];

export default function RetroLink2() {
  const [gameState, setGameState] = useState<'start' | 'playing' | 'gameover'>('start');
  const [score, setScore] = useState(0);
  const [levelIndex, setLevelIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(60);

  const [activeColor, setActiveColor] = useState<ColorType | null>(null);
  const [grid, setGrid] = useState<GridCell[][]>([]);
  const [paths, setPaths] = useState<Record<ColorType, { r: number; c: number }[]>>({
    red: [],
    blue: [],
    green: [],
    yellow: [],
    purple: [],
  });

  const initLevel = (idx: number) => {
    const lvl = LEVELS[idx % LEVELS.length];
    const newGrid: GridCell[][] = Array.from({ length: lvl.size }, (_, r) =>
      Array.from({ length: lvl.size }, (_, c) => ({ r, c }))
    );

    lvl.nodes.forEach((n) => {
      newGrid[n.r][n.c] = {
        r: n.r,
        c: n.c,
        color: n.color as ColorType,
        nodeId: n.id,
      };
    });

    setGrid(newGrid);
    setPaths({ red: [], blue: [], green: [], yellow: [], purple: [] });
  };

  const startGame = () => {
    setScore(0);
    setLevelIndex(0);
    setTimeLeft(60);
    initLevel(0);
    setGameState('playing');
  };

  useEffect(() => {
    if (gameState !== 'playing') return;

    const timer = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          setGameState('gameover');
          window.dispatchEvent(new CustomEvent('xakteir-game-score', { detail: { score } }));
          return 0;
        }
        return t - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [gameState, score]);

  const handleCellClick = (r: number, c: number) => {
    const cell = grid[r][c];

    // If clicking on an initial node, start drawing for that color
    if (cell.color) {
      setActiveColor(cell.color);
      setPaths((prev) => ({ ...prev, [cell.color!]: [{ r, c }] }));
      return;
    }

    if (!activeColor) return;

    const currentPath = paths[activeColor];
    if (currentPath.length === 0) return;

    const last = currentPath[currentPath.length - 1];
    const isAdjacent = Math.abs(last.r - r) + Math.abs(last.c - c) === 1;

    if (isAdjacent) {
      const newPath = [...currentPath, { r, c }];
      const updatedPaths = { ...paths, [activeColor]: newPath };
      setPaths(updatedPaths);

      // Check level completion
      checkLevelCompletion(updatedPaths);
    }
  };

  const checkLevelCompletion = (currentPaths: Record<ColorType, { r: number; c: number }[]>) => {
    const lvl = LEVELS[levelIndex % LEVELS.length];
    let allConnected = true;

    lvl.nodes.forEach((node) => {
      const p = currentPaths[node.color as ColorType];
      if (!p || p.length < 2) allConnected = false;
    });

    if (allConnected) {
      const nextScore = score + 300;
      setScore(nextScore);
      setTimeLeft((t) => t + 15);
      const nextLvl = levelIndex + 1;
      setLevelIndex(nextLvl);
      initLevel(nextLvl);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[500px] bg-zinc-950 text-white p-4 rounded-xl shadow-2xl border border-zinc-800">
      <h1 className="text-3xl font-extrabold mb-2 text-indigo-400 tracking-wider">RETRO LINK 2</h1>
      <p className="text-xs text-zinc-400 mb-4">Click terminal node and connect adjacent grid slots to link matching colors!</p>

      <div className="relative w-[600px] h-[400px] bg-zinc-950 border-2 border-indigo-500/40 rounded-lg flex flex-col items-center justify-center overflow-hidden">
        {gameState === 'start' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-zinc-950/90 z-20">
            <p className="text-xl font-bold text-indigo-400 mb-4">Connect Retro Terminals & Restore Circuits!</p>
            <button
              onClick={startGame}
              className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 font-bold rounded-lg transition transform hover:scale-105"
            >
              Start Game
            </button>
          </div>
        )}

        {gameState === 'gameover' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-zinc-950/90 z-20">
            <h2 className="text-3xl font-bold text-red-500 mb-2">TIME'S UP</h2>
            <p className="text-lg text-zinc-300 mb-4">Final Score: {score}</p>
            <button
              onClick={startGame}
              className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 font-bold rounded-lg transition transform hover:scale-105"
            >
              Play Again
            </button>
          </div>
        )}

        {/* Puzzle Grid */}
        <div className="grid grid-cols-5 gap-2 bg-zinc-900 p-4 rounded-xl border border-zinc-800">
          {grid.map((row, r) =>
            row.map((cell, c) => {
              // Determine if cell is in active path
              let cellColor = cell.color ? COLOR_MAP[cell.color] : undefined;

              Object.entries(paths).forEach(([clr, path]) => {
                if (path.some((p) => p.r === r && p.c === c)) {
                  cellColor = COLOR_MAP[clr as ColorType];
                }
              });

              return (
                <button
                  key={`${r}-${c}`}
                  onClick={() => handleCellClick(r, c)}
                  className="w-14 h-14 rounded-lg bg-zinc-800 border-2 border-zinc-700 flex items-center justify-center transition hover:border-zinc-500 active:scale-95"
                  style={{ backgroundColor: cellColor || undefined }}
                >
                  {cell.color && <div className="w-8 h-8 rounded-full bg-white/30 border-2 border-white shadow-inner" />}
                </button>
              );
            })
          )}
        </div>
      </div>

      <div className="flex gap-8 mt-4 font-mono text-lg">
        <span className="text-indigo-400">Score: {score}</span>
        <span className="text-amber-400">Time: {timeLeft}s</span>
        <span className="text-emerald-400">Level: {levelIndex + 1}</span>
      </div>
    </div>
  );
}
