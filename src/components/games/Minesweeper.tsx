"use client";
import { useState, useCallback } from "react";

const ROWS = 16, COLS = 16, MINES = 40;

type Cell = { mine: boolean; revealed: boolean; flagged: boolean; count: number };
const makeBoard = (): Cell[][] => {
  const board: Cell[][] = Array.from({ length: ROWS }, () =>
    Array.from({ length: COLS }, () => ({ mine: false, revealed: false, flagged: false, count: 0 }))
  );
  let placed = 0;
  while (placed < MINES) {
    const r = Math.floor(Math.random() * ROWS);
    const c = Math.floor(Math.random() * COLS);
    if (!board[r][c].mine) { board[r][c].mine = true; placed++; }
  }
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      if (board[r][c].mine) continue;
      let count = 0;
      for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) {
        if (board[r + dr]?.[c + dc]?.mine) count++;
      }
      board[r][c].count = count;
    }
  }
  return board;
};

const COLORS = ["","#3b82f6","#22c55e","#ef4444","#7c3aed","#dc2626","#06b6d4","#111","#6b7280"];

export default function Minesweeper() {
  const [board, setBoard] = useState(makeBoard);
  const [dead, setDead] = useState(false);
  const [won, setWon] = useState(false);
  const [flags, setFlags] = useState(0);

  const reveal = useCallback((r: number, c: number, b: Cell[][]) => {
    if (r < 0 || r >= ROWS || c < 0 || c >= COLS || b[r][c].revealed || b[r][c].flagged) return;
    b[r][c].revealed = true;
    if (b[r][c].count === 0 && !b[r][c].mine) {
      for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) reveal(r + dr, c + dc, b);
    }
  }, []);

  const click = (r: number, c: number) => {
    if (dead || won || board[r][c].revealed || board[r][c].flagged) return;
    const nb = board.map(row => row.map(cell => ({ ...cell })));
    if (nb[r][c].mine) { nb.forEach(row => row.forEach(cell => { if (cell.mine) cell.revealed = true; })); setBoard(nb); setDead(true); return; }
    reveal(r, c, nb);
    const allSafe = nb.every(row => row.every(cell => cell.mine || cell.revealed));
    setBoard(nb);
    if (allSafe) setWon(true);
  };

  const flag = (e: React.MouseEvent, r: number, c: number) => {
    e.preventDefault();
    if (dead || won || board[r][c].revealed) return;
    const nb = board.map(row => row.map(cell => ({ ...cell })));
    nb[r][c].flagged = !nb[r][c].flagged;
    setFlags(f => nb[r][c].flagged ? f + 1 : f - 1);
    setBoard(nb);
  };

  return (
    <div className="w-full h-full flex flex-col items-center justify-center bg-zinc-950 gap-4">
      <div className="flex gap-8 text-white font-black text-lg uppercase tracking-widest">
        <span>💣 {MINES - flags} left</span>
        {dead && <span className="text-rose-500 animate-pulse">💥 Boom!</span>}
        {won && <span className="text-emerald-400">🏆 Cleared!</span>}
        <button onClick={() => { setBoard(makeBoard()); setDead(false); setWon(false); setFlags(0); }}
          className="px-4 py-1 bg-white/10 rounded-full hover:bg-white/20 text-sm">Reset</button>
      </div>
      <div className="border border-white/10 rounded-xl overflow-hidden">
        {board.map((row, r) => (
          <div key={r} className="flex">
            {row.map((cell, c) => (
              <button key={c} onClick={() => click(r, c)} onContextMenu={e => flag(e, r, c)}
                className={`w-6 h-6 text-xs font-black flex items-center justify-center border border-zinc-800 transition-colors ${
                  cell.revealed
                    ? cell.mine ? "bg-rose-600" : "bg-zinc-900"
                    : "bg-zinc-700 hover:bg-zinc-600"
                }`}
                style={{ color: COLORS[cell.count] }}>
                {cell.revealed ? (cell.mine ? "💣" : cell.count > 0 ? cell.count : "") : cell.flagged ? "🚩" : ""}
              </button>
            ))}
          </div>
        ))}
      </div>
      <p className="text-zinc-500 text-xs">Left click to reveal · Right click to flag</p>
    </div>
  );
}
