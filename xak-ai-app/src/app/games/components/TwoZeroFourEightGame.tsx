"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { X, Box } from "lucide-react";
import { cn } from "@/lib/utils";

export function TwoZeroFourEightGame({ onExit }: { onExit: () => void }) {
  const [grid, setGrid] = useState<number[][]>(Array(4).fill(0).map(() => Array(4).fill(0)));
  const [score, setScore] = useState(0);

  const init = () => {
    const newGrid = Array(4).fill(0).map(() => Array(4).fill(0));
    addRandom(newGrid);
    addRandom(newGrid);
    setGrid(newGrid);
  };

  const addRandom = (g: number[][]) => {
    const empty = [];
    for (let r = 0; r < 4; r++) for (let c = 0; c < 4; c++) if (g[r][c] === 0) empty.push({ r, c });
    if (empty.length > 0) {
      const { r, c } = empty[Math.floor(Math.random() * empty.length)];
      g[r][c] = Math.random() < 0.9 ? 2 : 4;
    }
  };

  useEffect(() => { init(); }, []);

  return (
    <div className="flex flex-col items-center gap-8 p-12 glass-card rounded-[4rem] border-4 border-amber-500/30 bg-background/90 max-w-md w-full">
      <div className="flex justify-between w-full items-center">
        <h2 className="text-3xl font-black italic uppercase">Number_Merge</h2>
        <Button size="icon" variant="ghost" onClick={onExit}><X className="w-8 h-8" /></Button>
      </div>
      <div className="grid grid-cols-4 gap-3 bg-black/40 p-4 rounded-3xl border-4 border-white/5">
        {grid.flat().map((val, i) => (
          <div key={i} className={cn(
            "w-16 h-16 rounded-2xl flex items-center justify-center text-xl font-black transition-all",
            val === 0 ? "bg-white/5" : "bg-primary text-white shadow-lg"
          )}>
            {val || ""}
          </div>
        ))}
      </div>
      <p className="text-[10px] font-black uppercase opacity-40">Arrow Keys to Slide (Simulation)</p>
      <Button onClick={() => init()} variant="outline" className="w-full">Reset</Button>
    </div>
  );
}
