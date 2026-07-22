"use client";
import { useState, useEffect } from "react";

const GRID_SIZE = 7;
const BUBBLE_COLORS = ["#06b6d4", "#3b82f6", "#8b5cf6", "#10b981", "#ec4899", "#f59e0b"];

interface Bubble {
  id: string;
  color: string;
}

const getRandomColor = () => BUBBLE_COLORS[Math.floor(Math.random() * BUBBLE_COLORS.length)];

const createBoard = (): Bubble[][] => {
  const board: Bubble[][] = [];
  for (let r = 0; r < GRID_SIZE; r++) {
    const row: Bubble[] = [];
    for (let c = 0; c < GRID_SIZE; c++) {
      row.push({ id: `${r}-${c}-${Math.random()}`, color: getRandomColor() });
    }
    board.push(row);
  }
  return board;
};

export default function AquaMatch() {
  const [board, setBoard] = useState<Bubble[][]>(createBoard);
  const [selected, setSelected] = useState<{ r: number; c: number } | null>(null);
  const [score, setScore] = useState(0);
  const [movesLeft, setMovesLeft] = useState(25);
  const [gameOver, setGameOver] = useState(false);

  // Check and clear matches
  const checkMatches = (currentBoard: Bubble[][]): { matched: boolean; newBoard: Bubble[][]; points: number } => {
    const toClear = new Set<string>();

    // Horizontal check
    for (let r = 0; r < GRID_SIZE; r++) {
      for (let c = 0; c < GRID_SIZE - 2; c++) {
        const color = currentBoard[r][c].color;
        if (
          color === currentBoard[r][c + 1].color &&
          color === currentBoard[r][c + 2].color
        ) {
          toClear.add(`${r}-${c}`);
          toClear.add(`${r}-${c + 1}`);
          toClear.add(`${r}-${c + 2}`);
        }
      }
    }

    // Vertical check
    for (let r = 0; r < GRID_SIZE - 2; r++) {
      for (let c = 0; c < GRID_SIZE; c++) {
        const color = currentBoard[r][c].color;
        if (
          color === currentBoard[r + 1][c].color &&
          color === currentBoard[r + 2][c].color
        ) {
          toClear.add(`${r}-${c}`);
          toClear.add(`${r + 1}-${c}`);
          toClear.add(`${r + 2}-${c}`);
        }
      }
    }

    if (toClear.size === 0) {
      return { matched: false, newBoard: currentBoard, points: 0 };
    }

    // Drop bubbles down
    const nextBoard: Bubble[][] = Array.from({ length: GRID_SIZE }, () => []);

    for (let c = 0; c < GRID_SIZE; c++) {
      const colBubbles: Bubble[] = [];
      for (let r = 0; r < GRID_SIZE; r++) {
        if (!toClear.has(`${r}-${c}`)) {
          colBubbles.push(currentBoard[r][c]);
        }
      }
      // Fill missing top with new random bubbles
      while (colBubbles.length < GRID_SIZE) {
        colBubbles.unshift({ id: `new-${Math.random()}`, color: getRandomColor() });
      }
      for (let r = 0; r < GRID_SIZE; r++) {
        nextBoard[r][c] = colBubbles[r];
      }
    }

    return { matched: true, newBoard: nextBoard, points: toClear.size * 50 };
  };

  const handleTileClick = (r: number, c: number) => {
    if (gameOver || movesLeft <= 0) return;

    if (!selected) {
      setSelected({ r, c });
      return;
    }

    // If clicked same tile, unselect
    if (selected.r === r && selected.c === c) {
      setSelected(null);
      return;
    }

    // Check if adjacent
    const dist = Math.abs(selected.r - r) + Math.abs(selected.c - c);
    if (dist !== 1) {
      setSelected({ r, c });
      return;
    }

    // Swap
    const newBoard = board.map((row) => [...row]);
    const temp = newBoard[selected.r][selected.c];
    newBoard[selected.r][selected.c] = newBoard[r][c];
    newBoard[r][c] = temp;

    // Check matches
    const result = checkMatches(newBoard);
    if (result.matched) {
      setBoard(result.newBoard);
      setScore((s) => s + result.points);
      const nextMoves = movesLeft - 1;
      setMovesLeft(nextMoves);
      setSelected(null);

      if (nextMoves <= 0) {
        setGameOver(true);
        window.dispatchEvent(
          new CustomEvent("xakteir-game-score", { detail: { score: score + result.points } })
        );
      }
    } else {
      // Invalid swap
      setSelected(null);
    }
  };

  const restart = () => {
    setBoard(createBoard());
    setSelected(null);
    setScore(0);
    setMovesLeft(25);
    setGameOver(false);
  };

  return (
    <div className="w-full h-full flex flex-col items-center justify-center bg-zinc-950 p-4 font-sans text-zinc-100">
      <div className="max-w-md w-full flex flex-col items-center">
        <h2 className="text-2xl font-bold uppercase tracking-wider text-cyan-400 mb-1">Aqua Match</h2>
        <p className="text-zinc-400 text-xs mb-4">Swap adjacent ocean bubbles to align 3 or more!</p>

        {/* Stats */}
        <div className="w-full flex justify-between bg-zinc-900 p-3 rounded-xl border border-zinc-800 mb-4 font-mono text-sm">
          <div>
            SCORE: <span className="text-cyan-400 font-bold">{score}</span>
          </div>
          <div>
            MOVES: <span className="text-amber-400 font-bold">{movesLeft}</span>
          </div>
        </div>

        {/* Grid */}
        <div className="relative p-3 bg-zinc-900 rounded-2xl border border-zinc-800 shadow-2xl">
          <div className="grid grid-cols-7 gap-2">
            {board.map((row, r) =>
              row.map((bubble, c) => {
                const isSelected = selected?.r === r && selected?.c === c;
                return (
                  <button
                    key={bubble.id}
                    onClick={() => handleTileClick(r, c)}
                    className={`w-11 h-11 rounded-full flex items-center justify-center transition-all duration-200 ${
                      isSelected
                        ? "ring-4 ring-white scale-110 z-10 shadow-lg shadow-cyan-500/50"
                        : "hover:scale-105 opacity-90 hover:opacity-100"
                    }`}
                    style={{ backgroundColor: bubble.color }}
                  >
                    <div className="w-3 h-3 bg-white/40 rounded-full -mt-4 -ml-4" />
                  </button>
                );
              })
            )}
          </div>

          {gameOver && (
            <div className="absolute inset-0 bg-black/90 backdrop-blur-sm rounded-2xl flex flex-col items-center justify-center gap-3">
              <h3 className="text-cyan-400 font-extrabold text-2xl uppercase tracking-wider">Ocean Cleared!</h3>
              <p className="text-zinc-300 text-sm">Final Score: <span className="text-cyan-400 font-bold">{score}</span></p>
              <button
                onClick={restart}
                className="px-6 py-2 bg-cyan-500 hover:bg-cyan-400 text-zinc-950 font-bold uppercase text-xs rounded-lg transition"
              >
                Play Again
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
