"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { X, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

export function Match3Game({ onExit }: { onExit: () => void }) {
  const size = 6;
  const colors = ["bg-rose-500", "bg-blue-500", "bg-green-500", "bg-amber-500", "bg-purple-500"];
  const [grid, setGrid] = useState<string[][]>(Array(size).fill(null).map(() => Array(size).fill("")));

  useEffect(() => {
    setGrid(Array(size).fill(null).map(() => Array(size).fill("").map(() => colors[Math.floor(Math.random() * colors.length)])));
  }, []);

  return (
    <div className="flex flex-col items-center gap-8 p-12 glass-card rounded-[4rem] border-4 border-blue-400/30 bg-background/90 max-w-lg w-full">
      <div className="flex justify-between w-full items-center">
        <h2 className="text-3xl font-black italic uppercase">Shard_Match</h2>
        <Button size="icon" variant="ghost" onClick={onExit}><X className="w-8 h-8" /></Button>
      </div>
      <div className="grid grid-cols-6 gap-2 bg-black/40 p-4 rounded-3xl">
        {grid.flat().map((c, i) => (
          <div key={i} className={cn("w-12 h-12 rounded-xl shadow-lg border-2 border-white/10 cursor-pointer hover:scale-110 transition-transform", c)} />
        ))}
      </div>
    </div>
  );
}
