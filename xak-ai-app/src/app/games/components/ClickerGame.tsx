"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { X, MousePointer2, Trophy } from "lucide-react";

export function ClickerGame({ onExit }: { onExit: () => void }) {
  const [score, setScore] = useState(0);
  const [won, setWon] = useState(false);

  const handleClick = () => {
    const newScore = score + 1;
    setScore(newScore);
    if (newScore >= 100) setWon(true);
  };

  return (
    <div className="flex flex-col items-center gap-8 p-12 glass-card rounded-[4rem] border-4 border-primary/30 shadow-2xl bg-background/90 animate-in zoom-in-95 duration-500 max-w-md w-full text-foreground">
      <div className="flex justify-between w-full items-center">
        <h2 className="text-3xl font-black italic uppercase">Click_Blast</h2>
        <Button size="icon" variant="ghost" onClick={onExit} className="rounded-full h-12 w-12"><X className="w-8 h-8" /></Button>
      </div>

      <div className="flex flex-col items-center gap-6">
        <p className="text-[10px] font-black uppercase tracking-widest opacity-60">Score to Win: 100</p>
        <span className="text-8xl font-black text-primary animate-pulse">{score}</span>
        
        <button 
          onClick={handleClick}
          className="w-48 h-48 rounded-full bg-primary border-8 border-white/20 shadow-[0_0_50px_rgba(var(--primary),0.5)] flex items-center justify-center active:scale-90 transition-transform group"
        >
          <MousePointer2 className="w-20 h-20 text-white group-hover:rotate-12 transition-transform" />
        </button>
      </div>

      {won && (
        <div className="absolute inset-0 bg-black/90 backdrop-blur-md flex flex-col items-center justify-center text-center p-8 z-20 rounded-[4rem]">
          <Trophy className="w-24 h-24 text-amber-400 mb-6 animate-bounce" />
          <h3 className="text-6xl font-black text-white uppercase italic tracking-tighter leading-none">Speed Master!</h3>
          <Button onClick={onExit} className="mt-10 bg-primary h-16 px-12 rounded-[2rem] font-black uppercase tracking-widest text-white shadow-2xl">Back to Hub</Button>
        </div>
      )}
    </div>
  );
}
