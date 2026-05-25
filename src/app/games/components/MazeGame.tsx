"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { X, Layers } from "lucide-react";
import { cn } from "@/lib/utils";

export function MazeGame({ onExit }: { onExit: () => void }) {
  const size = 15;
  const [player, setPlayer] = useState({ x: 1, y: 1 });
  const [won, setWon] = useState(false);

  // Very simple generated maze logic (1 = wall, 0 = path)
  const maze = Array(size).fill(0).map((_, r) => Array(size).fill(0).map((_, c) => {
    if (r === 0 || r === size - 1 || c === 0 || c === size - 1) return 1;
    if (r % 2 === 0 && c % 2 === 0) return 1;
    return Math.random() < 0.2 ? 1 : 0;
  }));
  maze[size-2][size-2] = 0; // Exit

  const handleKey = (e: KeyboardEvent) => {
    if (won) return;
    let next = { ...player };
    if (e.key === "ArrowUp") next.y--;
    if (e.key === "ArrowDown") next.y++;
    if (e.key === "ArrowLeft") next.x--;
    if (e.key === "ArrowRight") next.x++;

    if (maze[next.y][next.x] === 0) {
      setPlayer(next);
      if (next.x === size - 2 && next.y === size - 2) setWon(true);
    }
  };

  useEffect(() => {
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [player, won]);

  return (
    <div className="flex flex-col items-center gap-8 p-12 glass-card rounded-[4rem] border-4 border-cyan-500/30 bg-background/90 max-w-lg w-full">
      <div className="flex justify-between w-full items-center">
        <h2 className="text-3xl font-black italic uppercase">Circuit_Maze</h2>
        <Button size="icon" variant="ghost" onClick={onExit}><X className="w-8 h-8" /></Button>
      </div>
      <div className="grid grid-cols-[repeat(15,minmax(0,1fr))] gap-0.5 border-4 border-white/10 p-1">
        {maze.map((row, r) => row.map((cell, c) => (
          <div key={`${r}-${c}`} className={cn(
            "w-6 h-6",
            cell === 1 ? "bg-cyan-900" : "bg-black/20",
            player.x === c && player.y === r ? "bg-primary animate-pulse" : "",
            c === size-2 && r === size-2 ? "bg-green-500/50" : ""
          )} />
        )))}
      </div>
      {won && <h3 className="text-green-500 font-black text-2xl">SOLVED!</h3>}
    </div>
  );
}
