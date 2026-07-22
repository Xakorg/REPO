'use client';

import React, { useState } from 'react';

const ICONS = ['⚛️', '🌌', '⚡', '🌀', '💥'];
const GRID_SIZE = 6;

export default function QuantumMatch() {
  const [grid, setGrid] = useState<string[][]>([]);
  const [score, setScore] = useState(0);
  const [moves, setMoves] = useState(20);
  const [gameOver, setGameOver] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const [selected, setSelected] = useState<[number, number] | null>(null);

  const initGame = () => {
    const newGrid: string[][] = [];
    for (let r = 0; r < GRID_SIZE; r++) {
      const row: string[] = [];
      for (let c = 0; c < GRID_SIZE; c++) {
        row.push(ICONS[Math.floor(Math.random() * ICONS.length)]);
      }
      newGrid.push(row);
    }
    setGrid(newGrid);
    setScore(0);
    setMoves(20);
    setSelected(null);
    setGameOver(false);
    setGameStarted(true);
  };

  const handleCellClick = (r: number, c: number) => {
    if (!gameStarted || gameOver || moves <= 0) return;

    if (!selected) {
      setSelected([r, c]);
      return;
    }

    const [sr, sc] = selected;
    if (sr === r && sc === c) {
      setSelected(null);
      return;
    }

    // Check if adjacent
    const isAdjacent = Math.abs(sr - r) + Math.abs(sc - c) === 1;

    if (isAdjacent) {
      // Swap tiles
      const nextGrid = grid.map((row) => [...row]);
      const temp = nextGrid[sr][sc];
      nextGrid[sr][sc] = nextGrid[r][c];
      nextGrid[r][c] = temp;

      // Find matched clusters
      const matches = findMatches(nextGrid);

      if (matches.length > 0) {
        // Valid move
        const newMoves = moves - 1;
        setMoves(newMoves);

        // Process pops & gravity
        const points = matches.length * 50;
        const finalGrid = resolveBoard(nextGrid, matches);
        setGrid(finalGrid);
        const newScore = score + points;
        setScore(newScore);

        if (newMoves <= 0) {
          setGameOver(true);
          window.dispatchEvent(
            new CustomEvent('xakteir-game-score', { detail: { score: newScore } })
          );
        }
      } else {
        // Swap back if no match
      }

      setSelected(null);
    } else {
      setSelected([r, c]);
    }
  };

  const findMatches = (board: string[][]) => {
    const matched = new Set<string>();

    // Horizontal match-3+
    for (let r = 0; r < GRID_SIZE; r++) {
      for (let c = 0; c < GRID_SIZE - 2; c++) {
        const val = board[r][c];
        if (val && val === board[r][c + 1] && val === board[r][c + 2]) {
          matched.add(`${r},${c}`);
          matched.add(`${r},${c + 1}`);
          matched.add(`${r},${c + 2}`);
        }
      }
    }

    // Vertical match-3+
    for (let r = 0; r < GRID_SIZE - 2; r++) {
      for (let c = 0; c < GRID_SIZE; c++) {
        const val = board[r][c];
        if (val && val === board[r + 1][c] && val === board[r + 2][c]) {
          matched.add(`${r},${c}`);
          matched.add(`${r + 1},${c}`);
          matched.add(`${r + 2},${c}`);
        }
      }
    }

    return Array.from(matched).map((pos) => pos.split(',').map(Number) as [number, number]);
  };

  const resolveBoard = (board: string[][], matches: [number, number][]) => {
    const next = board.map((row) => [...row]);
    matches.forEach(([r, c]) => {
      next[r][c] = '';
    });

    // Drop items
    for (let c = 0; c < GRID_SIZE; c++) {
      let emptyRow = GRID_SIZE - 1;
      for (let r = GRID_SIZE - 1; r >= 0; r--) {
        if (next[r][c] !== '') {
          next[emptyRow][c] = next[r][c];
          if (emptyRow !== r) next[r][c] = '';
          emptyRow--;
        }
      }
      for (let r = emptyRow; r >= 0; r--) {
        next[r][c] = ICONS[Math.floor(Math.random() * ICONS.length)];
      }
    }

    return next;
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[450px] bg-zinc-950 text-white p-4 rounded-xl border border-zinc-800">
      <div className="w-full max-w-[380px] flex justify-between items-center mb-3">
        <h2 className="text-xl font-bold text-purple-400">QUANTUM MATCH</h2>
        <div className="flex gap-2 text-xs font-bold">
          <span className="bg-zinc-900 px-3 py-1 rounded-full border border-zinc-800 text-purple-300">
            Moves: {moves}
          </span>
          <span className="bg-zinc-900 px-3 py-1 rounded-full border border-zinc-800 text-amber-400">
            Score: {score}
          </span>
        </div>
      </div>

      <div className="relative p-3 bg-zinc-900 border-2 border-purple-500/40 rounded-xl shadow-lg shadow-purple-500/10">
        <div className="grid grid-cols-6 gap-2 w-[320px] h-[320px]">
          {grid.map((row, r) =>
            row.map((icon, c) => {
              const isSelected = selected && selected[0] === r && selected[1] === c;
              return (
                <button
                  key={`${r}-${c}`}
                  onClick={() => handleCellClick(r, c)}
                  className={`w-12 h-12 rounded-lg flex items-center justify-center text-xl bg-zinc-800 hover:bg-zinc-700 transition transform duration-150 ${
                    isSelected
                      ? 'ring-2 ring-purple-400 scale-105 bg-purple-950/60 shadow-md shadow-purple-500/30'
                      : 'hover:scale-95'
                  }`}
                >
                  {icon}
                </button>
              );
            })
          )}
        </div>

        {(!gameStarted || gameOver) && (
          <div className="absolute inset-0 bg-black/85 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center rounded-xl z-10">
            <h3 className="text-2xl font-bold mb-2 text-purple-400">{gameOver ? 'QUANTUM STABLE' : 'QUANTUM MATCH'}</h3>
            {gameOver && <p className="text-zinc-300 mb-4">Final Energy Score: {score}</p>}
            <button
              onClick={initGame}
              className="px-6 py-2 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-lg transition transform hover:scale-105"
            >
              {gameOver ? 'Play Again' : 'Start Fusion'}
            </button>
          </div>
        )}
      </div>

      <p className="text-xs text-zinc-500 mt-3">Click two adjacent tiles to swap and match 3 or more quantum elements!</p>
    </div>
  );
}
