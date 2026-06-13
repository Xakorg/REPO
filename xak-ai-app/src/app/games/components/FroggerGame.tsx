"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { X, ArrowRight } from "lucide-react";

export function FroggerGame({ onExit }: { onExit: () => void }) {
  const [playerY, setPlayerY] = useState(360);
  const [gameOver, setGameOver] = useState(false);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowUp") setPlayerY(y => Math.max(0, y - 40));
      if (e.key === "ArrowDown") setPlayerY(y => Math.min(360, y + 40));
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, []);

  return (
    <div className="flex flex-col items-center gap-8 p-12 glass-card rounded-[4rem] border-4 border-green-500/30 bg-background/90 max-w-lg w-full relative">
      <div className="flex justify-between w-full items-center">
        <h2 className="text-3xl font-black italic uppercase">Road_Cross</h2>
        <Button size="icon" variant="ghost" onClick={onExit}><X className="w-8 h-8" /></Button>
      </div>
      <div className="w-full h-96 bg-zinc-950 rounded-2xl relative overflow-hidden">
        <div className="absolute left-1/2 top-4 w-12 h-12 bg-green-500/20 border-2 border-green-500 rounded-lg flex items-center justify-center">FINISH</div>
        <div 
          className="absolute left-1/2 w-10 h-10 bg-primary rounded-full border-4 border-white/20 transition-all"
          style={{ top: playerY, transform: 'translateX(-50%)' }}
        />
        {/* Cars simulation could be added here */}
      </div>
      <p className="text-[10px] font-black uppercase opacity-40">Use Arrows to Cross!</p>
    </div>
  );
}
