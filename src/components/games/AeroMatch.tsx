'use client';

import React, { useState, useEffect } from 'react';

const SYMBOLS = ['☁️', '💨', '⚡', '🪶', '🕊️', '☀️'];
const GRID_SIZE = 6;

export default function AeroMatch() {
  const [gameState, setGameState] = useState<'START' | 'PLAYING' | 'GAMEOVER'>('START');
  const [grid, setGrid] = useState<string[][]>([]);
  const [selected, setSelected] = useState<[number, number] | null>(null);
  const [score, setScore] = useState<number>(0);
  const [movesLeft, setMovesLeft] = useState<number>(20);

  const createBoard = () => {
    let newGrid: string[][] = [];
    for (let r = 0; r < GRID_SIZE; r++) {
      let row: string[] = [];
      for (let c = 0; c < GRID_SIZE; c++) {
        row.push(SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)]);
      }
      newGrid.push(row);
    }
    setGrid(newGrid);
  };

  const startGame = () => {
    setScore(0);
    setMovesLeft(20);
    setSelected(null);
    createBoard();
    setGameState('PLAYING');
  };

  const checkMatches = (currentGrid: string[][]): { matches: [number, number][]; newGrid: string[][] } => {
    const toClear = new Set<string>();

    // Horizontal
    for (let r = 0; r < GRID_SIZE; r++) {
      for (let c = 0; c < GRID_SIZE - 2; c++) {
        const val = currentGrid[r][c];
        if (val && val === currentGrid[r][c + 1] && val === currentGrid[r][c + 2]) {
          toClear.add(`${r},${c}`);
          toClear.add(`${r},${c + 1}`);
          toClear.add(`${r},${c + 2}`);
        }
      }
    }

    // Vertical
    for (let r = 0; r < GRID_SIZE - 2; r++) {
      for (let c = 0; c < GRID_SIZE; c++) {
        const val = currentGrid[r][c];
        if (val && val === currentGrid[r + 1][c] && val === currentGrid[r + 2][c]) {
          toClear.add(`${r},${c}`);
          toClear.add(`${r + 1},${c}`);
          toClear.add(`${r + 2},${c}`);
        }
      }
    }

    if (toClear.size === 0) return { matches: [], newGrid: currentGrid };

    // Clear matched and drop down
    let nextGrid = currentGrid.map((row) => [...row]);
    toClear.forEach((coord) => {
      const [r, c] = coord.split(',').map(Number);
      nextGrid[r][c] = '';
    });

    // Drop
    for (let c = 0; c < GRID_SIZE; c++) {
      let emptyRow = GRID_SIZE - 1;
      for (let r = GRID_SIZE - 1; r >= 0; r--) {
        if (nextGrid[r][c] !== '') {
          nextGrid[emptyRow][c] = nextGrid[r][c];
          if (emptyRow !== r) nextGrid[r][c] = '';
          emptyRow--;
        }
      }
      for (let r = emptyRow; r >= 0; r--) {
        nextGrid[r][c] = SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)];
      }
    }

    const matchesList = Array.from(toClear).map((s) => s.split(',').map(Number) as [number, number]);
    return { matches: matchesList, newGrid: nextGrid };
  };

  const handleTileClick = (r: number, c: number) => {
    if (gameState !== 'PLAYING') return;

    if (!selected) {
      setSelected([r, c]);
      return;
    }

    const [sr, sc] = selected;
    const isAdjacent = Math.abs(sr - r) + Math.abs(sc - c) === 1;

    if (isAdjacent) {
      let newGrid = grid.map((row) => [...row]);
      // Swap
      const temp = newGrid[sr][sc];
      newGrid[sr][sc] = newGrid[r][c];
      newGrid[r][c] = temp;

      const { matches, newGrid: processedGrid } = checkMatches(newGrid);

      if (matches.length > 0) {
        setGrid(processedGrid);
        const addedScore = matches.length * 30;
        setScore((s) => s + addedScore);
        const newMoves = movesLeft - 1;
        setMovesLeft(newMoves);
        if (newMoves <= 0) {
          endGame(score + addedScore);
        }
      } else {
        // invalid swap
        setGrid(grid);
      }
    }

    setSelected(null);
  };

  const endGame = (finalScore: number) => {
    window.dispatchEvent(new CustomEvent('xakteir-game-score', { detail: { score: finalScore } }));
    setGameState('GAMEOVER');
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[500px] bg-zinc-950 text-white rounded-xl p-4">
      <div className="flex justify-between items-center w-full max-w-[420px] mb-4">
        <div>
          <h2 className="text-xl font-bold text-sky-400">Aero Match</h2>
          <p className="text-xs text-zinc-400">Match 3+ sky elements!</p>
        </div>
        <div className="text-right">
          <div className="text-lg font-semibold text-sky-300">Score: {score}</div>
          <div className="text-sm text-zinc-400">Moves: {movesLeft}</div>
        </div>
      </div>

      <div className="relative border border-sky-900/50 rounded-xl p-4 bg-zinc-900 w-[420px] h-[420px] flex items-center justify-center">
        <div className="grid grid-cols-6 gap-2 w-full h-full">
          {grid.map((row, r) =>
            row.map((val, c) => {
              const isSelected = selected && selected[0] === r && selected[1] === c;
              return (
                <button
                  key={`${r}-${c}`}
                  onClick={() => handleTileClick(r, c)}
                  className={`flex items-center justify-center text-2xl rounded-lg border-2 transition transform active:scale-95 ${
                    isSelected ? 'border-sky-400 bg-sky-950 scale-105' : 'border-zinc-800 bg-zinc-950/80 hover:bg-zinc-800'
                  }`}
                >
                  {val}
                </button>
              );
            })
          )}
        </div>

        {gameState === 'START' && (
          <div className="absolute inset-0 bg-zinc-950/90 flex flex-col items-center justify-center p-6 text-center rounded-xl z-10">
            <h3 className="text-3xl font-extrabold text-sky-400 mb-2">AERO MATCH</h3>
            <p className="text-zinc-400 mb-6 max-w-xs">Swap adjacent sky symbols to align 3 or more in a row or column before running out of moves!</p>
            <button
              onClick={startGame}
              className="px-6 py-3 bg-sky-600 hover:bg-sky-500 text-white font-bold rounded-lg transition"
            >
              Start Game
            </button>
          </div>
        )}

        {gameState === 'GAMEOVER' && (
          <div className="absolute inset-0 bg-zinc-950/90 flex flex-col items-center justify-center p-6 text-center rounded-xl z-10">
            <h3 className="text-3xl font-extrabold text-sky-400 mb-2">OUT OF MOVES</h3>
            <p className="text-zinc-300 text-lg mb-4">Final Score: <span className="text-sky-400 font-bold">{score}</span></p>
            <button
              onClick={startGame}
              className="px-6 py-3 bg-sky-600 hover:bg-sky-500 text-white font-bold rounded-lg transition"
            >
              Play Again
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
