"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { X, Bomb, Target } from "lucide-react";
import { cn } from "@/lib/utils";

export function MinesweeperGame({ onExit }: { onExit: () => void }) {
  const size = 8;
  const mineCount = 10;
  const [grid, setGrid] = useState<any[][]>([]);
  const [gameOver, setGameOver] = useState(false);

  const initGrid = () => {
    let g = Array(size).fill(null).map(() => Array(size).fill({ isMine: false, revealed: false, count: 0 }));
    let placed = 0;
    while (placed < mineCount) {
      let r = Math.floor(Math.random() * size);
      let c = Math.floor(Math.random() * size);
      if (!g[r][c].isMine) {
        g[r][c] = { ...g[r][c], isMine: true };
        placed++;
      }
    }
    setGrid(g);
  };

  useEffect(() => { initGrid(); }, []);

  const reveal = (r: number, c: number) => {
    if (gameOver || grid[r][c].revealed) return;
    const next = [...grid];
    next[r][c] = { ...next[r][c], revealed: true };
    if (next[r][c].isMine) setGameOver(true);
    setGrid(next);
  };

  return (
    <div className="flex flex-col items-center gap-8 p-12 glass-card rounded-[4rem] border-4 border-slate-500/30 bg-background/90 max-w-lg w-full">
      <div className="flex justify-between w-full items-center">
        <h2 className="text-3xl font-black italic uppercase">Mine_Shard</h2>
        <Button size="icon" variant="ghost" onClick={onExit}><X className="w-8 h-8" /></Button>
      </div>
      <div className="grid grid-cols-8 gap-1">
        {grid.map((row, r) => row.map((cell, c) => (
          <div key={`${r}-${c}`} onClick={() => reveal(r, c)} className={cn(
            "w-10 h-10 border border-white/5 flex items-center justify-center cursor-pointer transition-all",
            cell.revealed ? "bg-white/10" : "bg-slate-800 hover:bg-slate-700"
          )}>
            {cell.revealed && (cell.isMine ? <Bomb className="text-rose-500 w-5 h-5" /> : "")}
          </div>
        )))}
      </div>
      {gameOver && <h3 className="text-rose-500 font-black text-2xl">BOMBED!</h3>}
    </div>
  );
}
