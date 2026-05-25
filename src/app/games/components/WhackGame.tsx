"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { X, Trophy, Ghost } from "lucide-react";
import { cn } from "@/lib/utils";

export function WhackGame({ onExit }: { onExit: () => void }) {
  const [activeHole, setActiveHole] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(25);
  const [gameOver, setGameOver] = useState(false);

  useEffect(() => {
    if (gameOver) return;
    const moleTimer = setInterval(() => {
      setActiveHole(Math.floor(Math.random() * 9));
    }, 700);

    const gameTimer = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          setGameOver(true);
          clearInterval(moleTimer);
          clearInterval(gameTimer);
          return 0;
        }
        return t - 1;
      });
    }, 1000);

    return () => {
      clearInterval(moleTimer);
      clearInterval(gameTimer);
    };
  }, [gameOver]);

  const whack = (i: number) => {
    if (i === activeHole) {
      setScore(s => s + 50);
      setActiveHole(null);
    }
  };

  return (
    <div className="flex flex-col items-center gap-10 p-12 glass-card rounded-[4rem] border-4 border-primary/30 shadow-2xl bg-background/90 max-w-xl w-full text-foreground relative overflow-hidden">
      <div className="flex justify-between w-full items-center z-10">
        <h2 className="text-3xl font-black italic uppercase">Whack_Buddy</h2>
        <div className="flex items-center gap-8">
           <div className="text-right">
              <p className="text-[8px] font-black uppercase text-muted-foreground">TIME</p>
              <span className="text-2xl font-black text-amber-500 tabular-nums">{timeLeft}s</span>
           </div>
           <Button size="icon" variant="ghost" onClick={onExit} className="rounded-full h-12 w-12"><X className="w-8 h-8" /></Button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6 w-full aspect-square relative z-10">
        {Array.from({ length: 9 }).map((_, i) => (
          <div 
            key={i}
            onClick={() => whack(i)}
            className="aspect-square bg-zinc-950/60 rounded-3xl border-4 border-white/5 relative overflow-hidden flex items-center justify-center cursor-crosshair group hover:border-primary/20 transition-all shadow-inner"
          >
            {activeHole === i && (
              <div className="animate-in slide-in-from-bottom-10 duration-200">
                <Ghost className="w-16 h-16 text-primary drop-shadow-[0_0_20px_rgba(var(--primary),0.8)] fill-primary/20" />
              </div>
            )}
            <div className="absolute inset-x-2 bottom-0 h-4 bg-black/40 rounded-t-full opacity-40" />
          </div>
        ))}
      </div>

      <div className="text-center z-10">
        <p className="text-[10px] font-black uppercase tracking-widest text-primary italic">Energy Collected</p>
        <span className="text-6xl font-black text-white italic drop-shadow-lg">{score}</span>
      </div>

      {gameOver && (
        <div className="absolute inset-0 bg-black/95 backdrop-blur-xl flex flex-col items-center justify-center text-center p-12 z-[100] rounded-[4rem] animate-in fade-in duration-500">
          <Trophy className="w-32 h-32 text-amber-400 mb-8 animate-bounce" />
          <h3 className="text-7xl font-black text-white uppercase italic tracking-tighter leading-none mb-4">RECORDS SYNCED</h3>
          <p className="text-xl text-muted-foreground font-black uppercase tracking-[0.5em] mb-12">Final Score: {score}</p>
          <Button onClick={() => window.location.reload()} className="h-20 px-16 bg-primary hover:bg-primary/90 text-white rounded-[2rem] font-black uppercase text-xl tracking-widest shadow-2xl transition-all active:scale-95 border-b-8 border-primary/20">REPLAY MATCH</Button>
        </div>
      )}
    </div>
  );
}
