"use client";
import { useState } from "react";

const COLS = 5;
const ROWS = 6;
const SONIC_COLORS = ["#ef4444", "#3b82f6", "#10b981", "#eab308", "#a855f7"];

const getRandomColor = () => SONIC_COLORS[Math.floor(Math.random() * SONIC_COLORS.length)];

export default function SonicDrop() {
  const [grid, setGrid] = useState<string[][]>(() =>
    Array.from({ length: ROWS }, () => Array(COLS).fill(""))
  );
  const [nextOrb, setNextOrb] = useState<string>(getRandomColor);
  const [dropsLeft, setDropsLeft] = useState(15);
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [gameOver, setGameOver] = useState(false);

  const checkMatchesAndPop = (board: string[][]): { updatedBoard: string[][]; points: number } => {
    const matched = new Set<string>();

    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const color = board[r][c];
        if (!color) continue;

        // Check connected cluster using BFS
        const cluster: [number, number][] = [];
        const queue: [number, number][] = [[r, c]];
        const visited = new Set<string>([`${r}-${c}`]);

        while (queue.length > 0) {
          const [currR, currC] = queue.shift()!;
          cluster.push([currR, currC]);

          const dirs = [
            [-1, 0], [1, 0], [0, -1], [0, 1],
          ];
          for (const [dr, dc] of dirs) {
            const nr = currR + dr;
            const nc = currC + dc;
            const key = `${nr}-${nc}`;
            if (
              nr >= 0 && nr < ROWS && nc >= 0 && nc < COLS &&
              !visited.has(key) &&
              board[nr][nc] === color
            ) {
              visited.add(key);
              queue.push([nr, nc]);
            }
          }
        }

        if (cluster.length >= 3) {
          cluster.forEach(([cr, cc]) => matched.add(`${cr}-${cc}`));
        }
      }
    }

    if (matched.size === 0) return { updatedBoard: board, points: 0 };

    // Remove matched and drop columns down
    const nextBoard: string[][] = Array.from({ length: ROWS }, () => Array(COLS).fill(""));

    for (let c = 0; c < COLS; c++) {
      const colOrbs: string[] = [];
      for (let r = ROWS - 1; r >= 0; r--) {
        if (!matched.has(`${r}-${c}`) && board[r][c] !== "") {
          colOrbs.push(board[r][c]);
        }
      }
      for (let i = 0; i < colOrbs.length; i++) {
        nextBoard[ROWS - 1 - i][c] = colOrbs[i];
      }
    }

    return { updatedBoard: nextBoard, points: matched.size * 150 };
  };

  const dropOrb = (colIndex: number) => {
    if (gameOver || dropsLeft <= 0) return;

    // Find lowest empty row in column
    let targetRow = -1;
    for (let r = ROWS - 1; r >= 0; r--) {
      if (grid[r][colIndex] === "") {
        targetRow = r;
        break;
      }
    }

    if (targetRow === -1) return; // Column full

    const newGrid = grid.map((row) => [...row]);
    newGrid[targetRow][colIndex] = nextOrb;

    // Process pops
    const { updatedBoard, points } = checkMatchesAndPop(newGrid);

    let newScore = score + points;
    let newCombo = points > 0 ? combo + 1 : 0;
    if (newCombo > 1) {
      newScore += newCombo * 100;
    }

    const nextDrops = dropsLeft - 1;

    setGrid(updatedBoard);
    setScore(newScore);
    setCombo(newCombo);
    setDropsLeft(nextDrops);
    setNextOrb(getRandomColor());

    if (nextDrops <= 0) {
      setGameOver(true);
      window.dispatchEvent(
        new CustomEvent("xakteir-game-score", { detail: { score: newScore } })
      );
    }
  };

  const restart = () => {
    setGrid(Array.from({ length: ROWS }, () => Array(COLS).fill("")));
    setNextOrb(getRandomColor());
    setDropsLeft(15);
    setScore(0);
    setCombo(0);
    setGameOver(false);
  };

  return (
    <div className="w-full h-full flex flex-col items-center justify-center bg-zinc-950 p-4 font-sans text-zinc-100">
      <div className="max-w-md w-full flex flex-col items-center">
        <h2 className="text-2xl font-bold uppercase tracking-wider text-purple-400 mb-1">Sonic Drop</h2>
        <p className="text-zinc-400 text-xs mb-4">Drop sonic frequency spheres to trigger acoustic chain pops!</p>

        {/* Stats & Next Orb */}
        <div className="w-full flex justify-between items-center bg-zinc-900 p-3 rounded-xl border border-zinc-800 mb-4 font-mono text-sm">
          <div>
            SCORE: <span className="text-purple-400 font-bold">{score}</span>
            {combo > 1 && <span className="ml-2 text-xs text-amber-400 font-bold">({combo}x COMBO!)</span>}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-zinc-400">NEXT:</span>
            <div className="w-6 h-6 rounded-full ring-2 ring-white/50" style={{ backgroundColor: nextOrb }} />
          </div>
          <div>
            DROPS: <span className="text-amber-400 font-bold">{dropsLeft}</span>
          </div>
        </div>

        {/* Column Drop Buttons */}
        <div className="grid grid-cols-5 gap-2 w-full mb-2">
          {Array.from({ length: COLS }).map((_, c) => (
            <button
              key={c}
              disabled={gameOver || dropsLeft <= 0}
              onClick={() => dropOrb(c)}
              className="py-1 bg-purple-950/60 hover:bg-purple-800/80 border border-purple-800/50 text-purple-300 font-bold text-xs rounded-lg transition"
            >
              ▼ Drop
            </button>
          ))}
        </div>

        {/* Board */}
        <div className="relative p-3 bg-zinc-900 rounded-2xl border border-zinc-800 shadow-2xl">
          <div className="grid grid-cols-5 gap-2">
            {grid.map((row, r) =>
              row.map((color, c) => (
                <div
                  key={`${r}-${c}`}
                  className="w-14 h-14 bg-zinc-950 border border-zinc-800/80 rounded-full flex items-center justify-center transition-all duration-300"
                >
                  {color ? (
                    <div
                      className="w-12 h-12 rounded-full shadow-lg shadow-purple-500/20 scale-100 transition-all duration-300 flex items-center justify-center"
                      style={{ backgroundColor: color }}
                    >
                      <div className="w-3 h-3 bg-white/40 rounded-full -mt-4 -ml-4" />
                    </div>
                  ) : null}
                </div>
              ))
            )}
          </div>

          {gameOver && (
            <div className="absolute inset-0 bg-black/90 backdrop-blur-sm rounded-2xl flex flex-col items-center justify-center gap-3">
              <h3 className="text-purple-400 font-extrabold text-2xl uppercase tracking-wider">Acoustic Session End</h3>
              <p className="text-zinc-300 text-sm">Final Score: <span className="text-purple-400 font-bold">{score}</span></p>
              <button
                onClick={restart}
                className="px-6 py-2 bg-purple-600 hover:bg-purple-500 text-white font-bold uppercase text-xs rounded-lg transition"
              >
                Drop Again
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
