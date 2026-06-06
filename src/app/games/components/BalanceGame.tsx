"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { X, Activity } from "lucide-react";

export function BalanceGame({ onExit }: { onExit: () => void }) {
  const [bal, setBal] = useState(50);
  const [score, setScore] = useState(0);

  const resetGame = () => {
    setBal(50);
    setScore(0);
  };

  useEffect(() => {
    const interval = setInterval(() => {
      setBal(b => b + (Math.random() - 0.5) * 5);
      setScore(s => s + 1);
    }, 100);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col items-center gap-8 p-12 glass-card rounded-[4rem] border-4 border-cyan-500/30 bg-background/90 max-w-md w-full relative">
      <div className="flex justify-between w-full items-center">
        <h2 className="text-3xl font-black italic uppercase">Balance_Game</h2>
        <Button size="icon" variant="ghost" onClick={onExit}><X className="w-8 h-8" /></Button>
      </div>
      <div className="w-full h-12 bg-zinc-950 rounded-full relative border-2 border-white/10">
        <div 
          className="absolute top-1/2 w-8 h-8 bg-primary rounded-full -translate-y-1/2 transition-all shadow-lg"
          style={{ left: `${bal}%` }}
        />
      </div>
      <div className="flex gap-4 w-full">
        <Button onClick={() => setBal(b => Math.max(0, b - 10))} className="flex-1">LEFT</Button>
        <Button onClick={() => setBal(b => Math.min(100, b + 10))} className="flex-1">RIGHT</Button>
      </div>
      <div className="font-black text-2xl">Time Balanced: {score/10}s</div>
      {(bal <= 0 || bal >= 100) && <div className="absolute inset-0 bg-black/90 flex flex-col items-center justify-center rounded-[4rem] z-50">
        <h3 className="text-4xl font-black">UNBALANCED!</h3>
        <Button onClick={resetGame} className="mt-8 bg-primary">Restart</Button>
      </div>}
    </div>
  );
}
