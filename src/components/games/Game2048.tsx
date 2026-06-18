"use client";
import { useState, useCallback } from "react";

const makeBoard = () => Array.from({ length: 4 }, () => [0, 0, 0, 0]);
const addRandom = (board: number[][]) => {
  const empty: [number, number][] = [];
  board.forEach((row, r) => row.forEach((v, c) => { if (!v) empty.push([r, c]); }));
  if (!empty.length) return board;
  const [r, c] = empty[Math.floor(Math.random() * empty.length)];
  const nb = board.map(row => [...row]);
  nb[r][c] = Math.random() < 0.9 ? 2 : 4;
  return nb;
};

const slide = (row: number[]) => {
  const filtered = row.filter(x => x);
  const merged: number[] = [];
  let i = 0, gained = 0;
  while (i < filtered.length) {
    if (i + 1 < filtered.length && filtered[i] === filtered[i + 1]) {
      merged.push(filtered[i] * 2); gained += filtered[i] * 2; i += 2;
    } else { merged.push(filtered[i]); i++; }
  }
  while (merged.length < 4) merged.push(0);
  return { row: merged, gained };
};

const COLORS: Record<number, string> = {
  0: "#1e1b4b", 2: "#312e81", 4: "#3730a3", 8: "#4338ca", 16: "#4f46e5",
  32: "#7c3aed", 64: "#6d28d9", 128: "#a855f7", 256: "#d946ef", 512: "#ec4899",
  1024: "#f43f5e", 2048: "#f59e0b"
};

export default function Game2048() {
  const [board, setBoard] = useState(() => addRandom(addRandom(makeBoard())));
  const [score, setScore] = useState(0);
  const [won, setWon] = useState(false);

  const move = useCallback((dir: "up"|"down"|"left"|"right") => {
    let nb = board.map(row => [...row]);
    let totalGained = 0;
    const transform = (b: number[][]) => {
      const result = b.map(row => { const { row: r, gained } = slide(row); totalGained += gained; return r; });
      return result;
    };

    if (dir === "left") nb = transform(nb);
    else if (dir === "right") nb = transform(nb.map(r => [...r].reverse())).map(r => [...r].reverse());
    else if (dir === "up") {
      nb = [0,1,2,3].map(c => nb.map(r => r[c]));
      nb = transform(nb);
      nb = [0,1,2,3].map(c => nb.map(r => r[c]));
    } else {
      nb = [0,1,2,3].map(c => nb.map(r => r[c]).reverse());
      nb = transform(nb);
      nb = [0,1,2,3].map(c => nb.map(r => r[c]).reverse());
    }

    const changed = JSON.stringify(nb) !== JSON.stringify(board);
    if (!changed) return;
    nb = addRandom(nb);
    setBoard(nb);
    setScore(s => s + totalGained);
    if (nb.some(row => row.includes(2048))) setWon(true);
  }, [board]);

  const handleKey = (e: React.KeyboardEvent) => {
    const map: Record<string, "up"|"down"|"left"|"right"> = { ArrowUp:"up", ArrowDown:"down", ArrowLeft:"left", ArrowRight:"right" };
    if (map[e.key]) { e.preventDefault(); move(map[e.key]); }
  };

  return (
    <div className="w-full h-full flex flex-col items-center justify-center bg-[#0c0a1e] gap-6" onKeyDown={handleKey} tabIndex={0}>
      <div className="flex gap-8 items-center">
        <h1 className="text-4xl font-black text-white">2048</h1>
        <div className="bg-indigo-900 px-6 py-2 rounded-xl text-white font-black text-xl">Score: {score}</div>
      </div>

      {won && <div className="text-2xl text-amber-400 font-black animate-bounce">🎉 You reached 2048!</div>}

      <div className="grid grid-cols-4 gap-2 bg-indigo-950 p-3 rounded-2xl border border-indigo-800">
        {board.flat().map((val, i) => (
          <div key={i} className="w-16 h-16 rounded-xl flex items-center justify-center font-black text-white transition-all duration-100 text-lg"
            style={{ background: COLORS[val] || COLORS[2048], boxShadow: val ? `0 0 15px ${COLORS[val]}40` : "none" }}>
            {val || ""}
          </div>
        ))}
      </div>

      <div className="flex gap-3">
        {(["up","left","down","right"] as const).map(dir => (
          <button key={dir} onClick={() => move(dir)}
            className="w-12 h-12 bg-indigo-700 hover:bg-indigo-600 text-white rounded-xl font-bold text-lg">
            {dir === "up" ? "↑" : dir === "down" ? "↓" : dir === "left" ? "←" : "→"}
          </button>
        ))}
      </div>
      <p className="text-zinc-500 text-xs">Arrow Keys or buttons to slide</p>
    </div>
  );
}
