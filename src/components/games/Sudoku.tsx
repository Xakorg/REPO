"use client";
import { useState } from "react";

const INITIAL = [
  [5,3,0,0,7,0,0,0,0],
  [6,0,0,1,9,5,0,0,0],
  [0,9,8,0,0,0,0,6,0],
  [8,0,0,0,6,0,0,0,3],
  [4,0,0,8,0,3,0,0,1],
  [7,0,0,0,2,0,0,0,6],
  [0,6,0,0,0,0,2,8,0],
  [0,0,0,4,1,9,0,0,5],
  [0,0,0,0,8,0,0,7,9],
];

const SOLUTION = [
  [5,3,4,6,7,8,9,1,2],
  [6,7,2,1,9,5,3,4,8],
  [1,9,8,3,4,2,5,6,7],
  [8,5,9,7,6,1,4,2,3],
  [4,2,6,8,5,3,7,9,1],
  [7,1,3,9,2,4,8,5,6],
  [9,6,1,5,3,7,2,8,4],
  [2,8,7,4,1,9,6,3,5],
  [3,4,5,2,8,6,1,7,9],
];

export default function Sudoku() {
  const [board, setBoard] = useState(INITIAL.map(row => [...row]));
  const [selected, setSelected] = useState<[number, number] | null>(null);
  const [errors, setErrors] = useState(new Set<string>());

  const setCell = (r: number, c: number, val: number) => {
    if (INITIAL[r][c] !== 0) return;
    const nb = board.map(row => [...row]);
    nb[r][c] = val;
    setBoard(nb);
    const err = new Set(errors);
    const key = `${r}-${c}`;
    if (val !== 0 && val !== SOLUTION[r][c]) err.add(key);
    else err.delete(key);
    setErrors(err);
  };

  const handleKey = (e: any) => {
    if (!selected) return;
    const [r, c] = selected;
    const n = parseInt(e.key);
    if (n >= 1 && n <= 9) setCell(r, c, n);
    if (e.key === "Backspace" || e.key === "0") setCell(r, c, 0);
  };

  const won = board.every((row, r) => row.every((cell, c) => cell === SOLUTION[r][c]));

  return (
    <div className="w-full h-full flex flex-col items-center justify-center bg-zinc-950 gap-6" onKeyDown={handleKey} tabIndex={0}>
      <h1 className="text-3xl font-black text-white uppercase tracking-widest">Sudoku</h1>
      {won && <div className="text-2xl text-emerald-400 font-black animate-bounce">Solved!</div>}
      <div className="border-2 border-white rounded-xl overflow-hidden">
        {board.map((row, r) => (
          <div key={r} className="flex" style={{ borderBottom: r % 3 === 2 && r !== 8 ? "2px solid white" : "1px solid #334155" }}>
            {row.map((cell, c) => {
              const isSel = selected && selected[0] === r && selected[1] === c;
              const isErr = errors.has(`${r}-${c}`);
              const isFixed = INITIAL[r][c] !== 0;
              return (
                <button key={c} onClick={() => setSelected([r, c])}
                  className={`w-10 h-10 text-base font-bold flex items-center justify-center ${isSel ? "bg-indigo-600" : "bg-zinc-900 hover:bg-zinc-800"} ${isErr ? "text-rose-500" : isFixed ? "text-zinc-300" : "text-indigo-400"}`}
                  style={{ borderRight: c % 3 === 2 && c !== 8 ? "2px solid white" : "1px solid #334155" }}>
                  {cell || ""}
                </button>
              );
            })}
          </div>
        ))}
      </div>
      <div className="flex gap-2">
        {[1,2,3,4,5,6,7,8,9].map(n => (
          <button key={n} onClick={() => { if (selected) setCell(selected[0], selected[1], n); }}
            className="w-10 h-10 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-lg text-sm">{n}</button>
        ))}
        <button onClick={() => { if (selected) setCell(selected[0], selected[1], 0); }}
          className="px-3 h-10 bg-zinc-700 hover:bg-zinc-600 text-white font-bold rounded-lg text-sm">Del</button>
      </div>
      <p className="text-zinc-500 text-xs">Click a cell then press a number or use buttons</p>
    </div>
  );
}