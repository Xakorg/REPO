"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { X, Brain } from "lucide-react";

export function SudokuGame({ onExit }: { onExit: () => void }) {
  const grid = [
    [5,3,0,0,7,0,0,0,0],
    [6,0,0,1,9,5,0,0,0],
    [0,9,8,0,0,0,0,6,0]
  ]; // Partial demo grid

  return (
    <div className="flex flex-col items-center gap-8 p-12 glass-card rounded-[4rem] border-4 border-indigo-400/30 bg-background/90 max-w-md w-full">
      <div className="flex justify-between w-full items-center">
        <h2 className="text-3xl font-black italic uppercase">Logic_Sudoku</h2>
        <Button size="icon" variant="ghost" onClick={onExit}><X className="w-8 h-8" /></Button>
      </div>
      <div className="grid grid-cols-9 gap-1 bg-black/40 p-2 border-2 border-white/10">
        {grid.flat().map((n, i) => (
          <div key={i} className="w-8 h-8 bg-white/5 flex items-center justify-center font-bold text-xs">
            {n || ""}
          </div>
        ))}
      </div>
      <p className="text-[10px] font-black uppercase opacity-40 italic">Complete the Shard Grid</p>
    </div>
  );
}
