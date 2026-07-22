'use client';

import React, { useState, useEffect } from 'react';

const GRID_SIZE = 6;
const SYMBOLS = ['⚛️', '🌌', '⚡', '🔮', '✨'];

interface Tile {
  id: number;
  symbol: string;
  selected?: boolean;
}

export default function QuantumMatch2() {
  const [grid, setGrid] = useState<Tile[]>([]);
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [movesLeft, setMovesLeft] = useState(20);
  const [gameOver, setGameOver] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);

  const createInitialGrid = () => {
    const tiles: Tile[] = [];
    for (let i = 0; i < GRID_SIZE * GRID_SIZE; i++) {
      tiles.push({
        id: i,
        symbol: SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)],
      });
    }
    return tiles;
  };

  const initGame = () => {
    setGrid(createInitialGrid());
    setSelectedIdx(null);
    setScore(0);
    setMovesLeft(20);
    setGameOver(false);
    setGameStarted(true);
  };

  const checkMatchesAndClear = (currentGrid: Tile[], currentScore: number) => {
    const toClear = new Set<number>();

    // Horizontal matches
    for (let r = 0; r < GRID_SIZE; r++) {
      for (let c = 0; c < GRID_SIZE - 2; c++) {
        const idx1 = r * GRID_SIZE + c;
        const idx2 = r * GRID_SIZE + c + 1;
        const idx3 = r * GRID_SIZE + c + 2;
        if (
          currentGrid[idx1].symbol &&
          currentGrid[idx1].symbol === currentGrid[idx2].symbol &&
          currentGrid[idx2].symbol === currentGrid[idx3].symbol
        ) {
          toClear.add(idx1);
          toClear.add(idx2);
          toClear.add(idx3);
        }
      }
    }

    // Vertical matches
    for (let c = 0; c < GRID_SIZE; c++) {
      for (let r = 0; r < GRID_SIZE - 2; r++) {
        const idx1 = r * GRID_SIZE + c;
        const idx2 = (r + 1) * GRID_SIZE + c;
        const idx3 = (r + 2) * GRID_SIZE + c;
        if (
          currentGrid[idx1].symbol &&
          currentGrid[idx1].symbol === currentGrid[idx2].symbol &&
          currentGrid[idx2].symbol === currentGrid[idx3].symbol
        ) {
          toClear.add(idx1);
          toClear.add(idx2);
          toClear.add(idx3);
        }
      }
    }

    if (toClear.size > 0) {
      const newGrid = [...currentGrid];
      toClear.forEach((idx) => {
        newGrid[idx] = {
          id: Math.random(),
          symbol: SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)],
        };
      });
      const gained = toClear.size * 30;
      const updatedScore = currentScore + gained;
      setScore(updatedScore);
      setGrid(newGrid);
      setTimeout(() => checkMatchesAndClear(newGrid, updatedScore), 250);
    }
  };

  const handleTileClick = (idx: number) => {
    if (!gameStarted || gameOver) return;

    if (selectedIdx === null) {
      setSelectedIdx(idx);
    } else {
      // Check adjacency
      const r1 = Math.floor(selectedIdx / GRID_SIZE);
      const c1 = selectedIdx % GRID_SIZE;
      const r2 = Math.floor(idx / GRID_SIZE);
      const c2 = idx % GRID_SIZE;

      const isAdjacent = Math.abs(r1 - r2) + Math.abs(c1 - c2) === 1;

      if (isAdjacent) {
        // Swap
        const newGrid = [...grid];
        const temp = newGrid[selectedIdx].symbol;
        newGrid[selectedIdx].symbol = newGrid[idx].symbol;
        newGrid[idx].symbol = temp;

        setGrid(newGrid);
        setSelectedIdx(null);
        const nextMoves = movesLeft - 1;
        setMovesLeft(nextMoves);

        checkMatchesAndClear(newGrid, score);

        if (nextMoves <= 0) {
          setGameOver(true);
          window.dispatchEvent(new CustomEvent('xakteir-game-score', { detail: { score } }));
        }
      } else {
        setSelectedIdx(idx);
      }
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[450px] bg-zinc-950 text-white p-4 rounded-xl border border-zinc-800">
      <div className="w-full max-w-[360px] flex justify-between items-center mb-3">
        <h2 className="text-xl font-bold text-emerald-400">QUANTUM MATCH 2</h2>
        <div className="flex gap-2 text-xs font-semibold">
          <span className="bg-zinc-900 px-3 py-1 rounded-full border border-zinc-800 text-purple-400">
            Moves: {movesLeft}
          </span>
          <span className="bg-zinc-900 px-3 py-1 rounded-full border border-zinc-800 text-emerald-400">
            Score: {score}
          </span>
        </div>
      </div>

      <div className="relative p-3 bg-zinc-900/90 border-2 border-emerald-500/30 rounded-xl shadow-xl shadow-emerald-500/10">
        <div className="grid grid-cols-6 gap-2 w-[320px] h-[320px]">
          {grid.map((tile, idx) => (
            <button
              key={idx}
              onClick={() => handleTileClick(idx)}
              className={`flex items-center justify-center text-2xl rounded-lg border transition transform active:scale-95 ${
                selectedIdx === idx
                  ? 'bg-emerald-500/30 border-emerald-400 scale-105 shadow-md shadow-emerald-400/50'
                  : 'bg-zinc-800/80 border-zinc-700/60 hover:bg-zinc-700/80'
              }`}
            >
              {tile.symbol}
            </button>
          ))}
        </div>

        {(!gameStarted || gameOver) && (
          <div className="absolute inset-0 bg-black/85 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center rounded-xl z-10">
            <h3 className="text-2xl font-bold mb-2 text-emerald-400">
              {gameOver ? 'QUANTUM STASIS' : 'QUANTUM MATCH 2'}
            </h3>
            {gameOver && <p className="text-zinc-300 mb-4 font-semibold">Final Score: {score}</p>}
            <button
              onClick={initGame}
              className="px-6 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold rounded-lg hover:opacity-90 transition transform hover:scale-105"
            >
              {gameOver ? 'Play Again' : 'Start Matching'}
            </button>
          </div>
        )}
      </div>

      <p className="text-xs text-zinc-500 mt-3">Click two adjacent quantum items to swap and match 3 or more!</p>
    </div>
  );
}
