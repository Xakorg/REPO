"use client";
import { useState, useCallback } from "react";

const WORDS = ["PYTHON","REACT","CANVAS","XAKTEIR","BROWSER","DEPLOY","WEBHOOK","FIREBASE","TAILWIND","SOCKET","COMPUTE","STORAGE"];
const GRID_SIZE = 10;

const makeGrid = (words: string[]) => {
  const grid: string[][] = Array.from({ length: GRID_SIZE }, () => Array(GRID_SIZE).fill(""));
  const placed: { word: string; cells: [number,number][] }[] = [];

  for (const word of words) {
    let placed_word = false;
    for (let attempt = 0; attempt < 50; attempt++) {
      const horiz = Math.random() < 0.5;
      const r = Math.floor(Math.random() * GRID_SIZE);
      const c = Math.floor(Math.random() * GRID_SIZE);
      if (horiz && c + word.length > GRID_SIZE) continue;
      if (!horiz && r + word.length > GRID_SIZE) continue;
      const cells: [number,number][] = [];
      let ok = true;
      for (let i = 0; i < word.length; i++) {
        const nr = horiz ? r : r + i, nc = horiz ? c + i : c;
        if (grid[nr][nc] && grid[nr][nc] !== word[i]) { ok = false; break; }
        cells.push([nr, nc]);
      }
      if (ok) {
        cells.forEach(([nr, nc], i) => { grid[nr][nc] = word[i]; });
        placed.push({ word, cells });
        placed_word = true;
        break;
      }
    }
  }

  // Fill remaining
  const alpha = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  for (let r = 0; r < GRID_SIZE; r++) {
    for (let c = 0; c < GRID_SIZE; c++) {
      if (!grid[r][c]) grid[r][c] = alpha[Math.floor(Math.random() * alpha.length)];
    }
  }

  return { grid, placed };
};

const CHOSEN_WORDS = WORDS.slice(0, 8);
const { grid, placed } = makeGrid(CHOSEN_WORDS);

export default function WordSearch() {
  const [found, setFound] = useState<Set<string>>(new Set());
  const [selecting, setSelecting] = useState<[number,number][]>([]);
  const [highlighted, setHighlighted] = useState<Set<string>>(new Set());

  const startSel = (r: number, c: number) => setSelecting([[r, c]]);
  const extendSel = (r: number, c: number) => {
    if (selecting.length === 0) return;
    setSelecting(prev => {
      if (prev.some(([pr, pc]) => pr === r && pc === c)) return prev;
      return [...prev, [r, c]];
    });
  };
  const endSel = () => {
    const selWord = selecting.map(([r, c]) => grid[r][c]).join("");
    const selWordRev = selWord.split("").reverse().join("");
    for (const pw of placed) {
      if ((pw.word === selWord || pw.word === selWordRev) && !found.has(pw.word)) {
        const newFound = new Set(found);
        newFound.add(pw.word);
        setFound(newFound);
        const newHL = new Set(highlighted);
        pw.cells.forEach(([r, c]) => newHL.add(`${r}-${c}`));
        setHighlighted(newHL);
        break;
      }
    }
    setSelecting([]);
  };

  const isSelecting = (r: number, c: number) => selecting.some(([sr, sc]) => sr === r && sc === c);

  return (
    <div className="w-full h-full flex items-center justify-center bg-zinc-950 gap-8 p-6">
      <div className="space-y-3">
        <h2 className="text-white font-black text-xl uppercase tracking-widest">Find the Words</h2>
        {CHOSEN_WORDS.map(w => (
          <div key={w} className={`px-4 py-2 rounded-xl font-bold text-sm tracking-wider ${found.has(w) ? "bg-emerald-500/20 text-emerald-400 line-through" : "bg-zinc-800 text-white"}`}>
            {w}
          </div>
        ))}
        {found.size === CHOSEN_WORDS.length && (
          <div className="text-emerald-400 font-black text-xl animate-bounce">🏆 All found!</div>
        )}
      </div>

      <div className="select-none" onMouseLeave={endSel}>
        {grid.map((row, r) => (
          <div key={r} className="flex">
            {row.map((cell, c) => {
              const key = `${r}-${c}`;
              const isSel = isSelecting(r, c);
              const isHL = highlighted.has(key);
              return (
                <div key={c}
                  onMouseDown={() => startSel(r, c)}
                  onMouseEnter={() => extendSel(r, c)}
                  onMouseUp={endSel}
                  className={`w-10 h-10 flex items-center justify-center font-black text-sm cursor-pointer border border-zinc-800 transition-colors ${
                    isHL ? "bg-emerald-600/40 text-emerald-400" : isSel ? "bg-indigo-600/60 text-white" : "text-zinc-300 hover:text-white hover:bg-zinc-800"
                  }`}>
                  {cell}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
