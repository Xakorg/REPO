'use client';

import React, { useState, useEffect, useRef } from 'react';

const COLS = 6;
const ROWS = 7;
const COLORS = ['#ef4444', '#3b82f6', '#10b981', '#f59e0b', '#a855f7'];

export default function AstroDrop() {
  const [board, setBoard] = useState<(string | null)[][]>(
    Array(ROWS).fill(null).map(() => Array(COLS).fill(null))
  );
  const [nextColor, setNextColor] = useState<string>('');
  const [score, setScore] = useState(0);
  const [gameState, setGameState] = useState<'start' | 'playing' | 'gameover'>('start');

  const gameOverHandled = useRef(false);

  const getRandomColor = () => COLORS[Math.floor(Math.random() * COLORS.length)];

  const startGame = () => {
    setBoard(Array(ROWS).fill(null).map(() => Array(COLS).fill(null)));
    setScore(0);
    setNextColor(getRandomColor());
    gameOverHandled.current = false;
    setGameState('playing');
  };

  const handleGameOver = (finalScore: number) => {
    if (gameOverHandled.current) return;
    gameOverHandled.current = true;
    setGameState('gameover');
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('xakteir-game-score', { detail: { score: finalScore } }));
    }
  };

  const checkMatches = (currentBoard: (string | null)[][]): { newBoard: (string | null)[][]; matchedCount: number } => {
    const toRemove: boolean[][] = Array(ROWS).fill(false).map(() => Array(COLS).fill(false));
    let matchedCount = 0;

    // Horizontal check
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS - 2; c++) {
        const val = currentBoard[r][c];
        if (val && val === currentBoard[r][c + 1] && val === currentBoard[r][c + 2]) {
          toRemove[r][c] = true;
          toRemove[r][c + 1] = true;
          toRemove[r][c + 2] = true;
        }
      }
    }

    // Vertical check
    for (let r = 0; r < ROWS - 2; r++) {
      for (let c = 0; c < COLS; c++) {
        const val = currentBoard[r][c];
        if (val && val === currentBoard[r + 1][c] && val === currentBoard[r + 2][c]) {
          toRemove[r][c] = true;
          toRemove[r + 1][c] = true;
          toRemove[r + 2][c] = true;
        }
      }
    }

    const nextBoard = currentBoard.map((row) => [...row]);
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        if (toRemove[r][c]) {
          nextBoard[r][c] = null;
          matchedCount++;
        }
      }
    }

    // Gravity apply
    for (let c = 0; c < COLS; c++) {
      let writeRow = ROWS - 1;
      for (let r = ROWS - 1; r >= 0; r--) {
        if (nextBoard[r][c] !== null) {
          const temp = nextBoard[r][c];
          nextBoard[r][c] = null;
          nextBoard[writeRow][c] = temp;
          writeRow--;
        }
      }
    }

    return { newBoard: nextBoard, matchedCount };
  };

  const dropOrb = (colIdx: number) => {
    if (gameState !== 'playing') return;

    let targetRow = -1;
    for (let r = ROWS - 1; r >= 0; r--) {
      if (!board[r][colIdx]) {
        targetRow = r;
        break;
      }
    }

    if (targetRow === -1) return; // column full

    let newBoard = board.map((row) => [...row]);
    newBoard[targetRow][colIdx] = nextColor;

    // Check matches recursively
    let totalPoints = 0;
    let matchRes = checkMatches(newBoard);
    while (matchRes.matchedCount > 0) {
      totalPoints += matchRes.matchedCount * 10;
      newBoard = matchRes.newBoard;
      matchRes = checkMatches(newBoard);
    }

    const newScore = score + totalPoints;
    setScore(newScore);
    setBoard(newBoard);
    setNextColor(getRandomColor());

    // Check game over (top row filled)
    if (newBoard[0].every((cell) => cell !== null)) {
      handleGameOver(newScore);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[500px] bg-zinc-950 text-white p-4 rounded-xl">
      <h1 className="text-3xl font-black text-cyan-400 mb-2 tracking-wider">ASTRO DROP</h1>

      {gameState === 'playing' && (
        <div className="flex items-center justify-between w-80 mb-4 font-bold">
          <span className="text-cyan-400 text-lg">Score: {score}</span>
          <div className="flex items-center gap-2">
            <span className="text-zinc-400">Next:</span>
            <div
              className="w-6 h-6 rounded-full border border-white/20"
              style={{ backgroundColor: nextColor }}
            />
          </div>
        </div>
      )}

      <div className="relative bg-zinc-900 border-2 border-cyan-500/30 p-3 rounded-xl">
        <div className="grid grid-cols-6 gap-2">
          {Array(COLS)
            .fill(0)
            .map((_, c) => (
              <button
                key={c}
                onClick={() => dropOrb(c)}
                disabled={gameState !== 'playing'}
                className="flex flex-col gap-2 p-1 hover:bg-zinc-800/50 rounded-lg transition"
              >
                {Array(ROWS)
                  .fill(0)
                  .map((_, r) => {
                    const color = board[r][c];
                    return (
                      <div
                        key={r}
                        className="w-10 h-10 rounded-full border border-zinc-800 flex items-center justify-center transition-all duration-300"
                        style={{
                          backgroundColor: color || '#18181b',
                          boxShadow: color ? `0 0 10px ${color}` : 'none',
                        }}
                      />
                    );
                  })}
              </button>
            ))}
        </div>

        {gameState === 'start' && (
          <div className="absolute inset-0 bg-zinc-950/90 flex flex-col items-center justify-center p-6 text-center rounded-xl">
            <p className="text-zinc-300 mb-6 max-w-xs">
              Drop astro gems into columns. Align 3 or more horizontally or vertically to trigger cosmic chain reactions!
            </p>
            <button
              onClick={startGame}
              className="px-6 py-3 bg-cyan-500 hover:bg-cyan-400 text-zinc-950 font-black rounded-lg text-lg transition transform active:scale-95"
            >
              START GAME
            </button>
          </div>
        )}

        {gameState === 'gameover' && (
          <div className="absolute inset-0 bg-zinc-950/90 flex flex-col items-center justify-center p-6 text-center rounded-xl">
            <h2 className="text-4xl font-extrabold text-red-500 mb-2">GRID FULL</h2>
            <p className="text-2xl text-cyan-400 font-bold mb-6">Final Score: {score}</p>
            <button
              onClick={startGame}
              className="px-6 py-3 bg-cyan-500 hover:bg-cyan-400 text-zinc-950 font-black rounded-lg text-lg transition transform active:scale-95"
            >
              PLAY AGAIN
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
