"use client";
import { useState } from "react";

const COLORS = ["red", "blue", "green", "yellow", "purple", "orange"];
const EMOJI = { red: "🔴", blue: "🔵", green: "🟢", yellow: "🟡", purple: "🟣", orange: "🟠" };

const makeBoard = () => Array.from({ length: 8 }, () => Array.from({ length: 8 }, () => COLORS[Math.floor(Math.random() * COLORS.length)]));

export default function Match3() {
  const [board, setBoard] = useState(makeBoard);
  const [selected, setSelected] = useState<[number, number] | null>(null);
  const [score, setScore] = useState(0);
  const [moves, setMoves] = useState(20);

  const swap = (r1: number, c1: number, r2: number, c2: number, newBoard: string[][]) => {
    [newBoard[r1][c1], newBoard[r2][c2]] = [newBoard[r2][c2], newBoard[r1][c1]];
  };

  const clearMatches = (b: string[][]): [string[][], number] => {
    const toRemove = new Set<string>();
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 6; c++) {
        if (b[r][c] === b[r][c+1] && b[r][c] === b[r][c+2]) { toRemove.add(`${r},${c}`); toRemove.add(`${r},${c+1}`); toRemove.add(`${r},${c+2}`); }
      }
    }
    for (let r = 0; r < 6; r++) {
      for (let c = 0; c < 8; c++) {
        if (b[r][c] === b[r+1][c] && b[r][c] === b[r+2][c]) { toRemove.add(`${r},${c}`); toRemove.add(`${r+1},${c}`); toRemove.add(`${r+2},${c}`); }
      }
    }
    if (toRemove.size === 0) return [b, 0];
    const nb = b.map(row => [...row]);
    toRemove.forEach(k => { const [r, c] = k.split(",").map(Number); nb[r][c] = ""; });
    // Drop
    for (let c = 0; c < 8; c++) {
      let empty = 7;
      for (let r = 7; r >= 0; r--) {
        if (nb[r][c] !== "") { nb[empty][c] = nb[r][c]; if (empty !== r) nb[r][c] = ""; empty--; }
      }
      for (let r = empty; r >= 0; r--) nb[r][c] = COLORS[Math.floor(Math.random() * COLORS.length)];
    }
    return [nb, toRemove.size];
  };

  const handleClick = (r: number, c: number) => {
    if (moves <= 0) return;
    if (!selected) { setSelected([r, c]); return; }
    const [sr, sc] = selected;
    if (Math.abs(r - sr) + Math.abs(c - sc) !== 1) { setSelected([r, c]); return; }

    const nb = board.map(row => [...row]);
    swap(sr, sc, r, c, nb);
    const [cleared, pts] = clearMatches(nb);
    if (pts > 0) { setBoard(cleared); setScore(s => s + pts * 10); setMoves(m => m - 1); }
    else { setBoard(board); }
    setSelected(null);
  };

  return (
    <div className="w-full h-full flex flex-col items-center justify-center bg-zinc-950 gap-6">
      <div className="flex gap-12 text-white font-black text-xl uppercase tracking-widest">
        <span>Score: <span className="text-amber-400">{score}</span></span>
        <span>Moves: <span className={moves <= 5 ? "text-rose-500" : "text-emerald-400"}>{moves}</span></span>
      </div>
      <div className="grid gap-1" style={{ gridTemplateColumns: "repeat(8, 1fr)" }}>
        {board.map((row, r) => row.map((cell, c) => (
          <button key={`${r}-${c}`} onClick={() => handleClick(r, c)}
            className={`w-12 h-12 text-2xl rounded-lg transition-all duration-150 border-2 ${
              selected && selected[0] === r && selected[1] === c
                ? "border-white scale-110 bg-white/20"
                : "border-transparent bg-white/5 hover:bg-white/10"
            }`}>
            {EMOJI[cell as keyof typeof EMOJI] || ""}
          </button>
        )))}
      </div>
      {moves <= 0 && (
        <button onClick={() => { setBoard(makeBoard()); setScore(0); setMoves(20); }} className="bg-amber-500 hover:bg-amber-400 text-white px-8 py-3 rounded-full font-bold uppercase tracking-widest">
          Play Again
        </button>
      )}
    </div>
  );
}
