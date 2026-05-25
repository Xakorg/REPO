"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { X, Trophy, Activity, Target } from "lucide-react";
import { cn } from "@/lib/utils";

export function DodgeGame({ onExit }: { onExit: () => void }) {
  const [playerX, setPlayerX] = useState(50);
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [hazards, setHazards] = useState<{ id: number, x: number, y: number }[]>([]);

  useEffect(() => {
    if (gameOver) return;

    const gameLoop = setInterval(() => {
      setScore(s => s + 10);
      setHazards(prev => {
        const next = prev.map(h => ({ ...h, y: h.y + 1.5 }));
        
        // Collision Detection
        const hit = next.some(h => Math.abs(h.x - playerX) < 8 && h.y > 80 && h.y < 95);
        if (hit) setGameOver(true);

        return next.filter(h => h.y < 110);
      });

      if (Math.random() < 0.15) {
        setHazards(prev => [...prev, { id: Date.now(), x: Math.random() * 90 + 5, y: -10 }]);
      }
    }, 20);

    return () => clearInterval(gameLoop);
  }, [gameOver, playerX]);

  const handleMouseMove = (e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    setPlayerX(Math.max(5, Math.min(95, x)));
  };

  return (
    <div className="flex flex-col items-center gap-10 p-12 glass-card rounded-[4rem] border-4 border-primary/30 shadow-2xl bg-background/90 max-w-4xl w-full text-foreground relative overflow-hidden">
      <div className="flex justify-between w-full items-center z-10">
        <h2 className="text-3xl font-black italic uppercase">Shard_Dodge</h2>
        <div className="flex items-center gap-10">
           <div className="text-right">
              <p className="text-[8px] font-black uppercase text-muted-foreground mb-1">STREAK</p>
              <span className="text-4xl font-black text-emerald-500 italic tabular-nums">{score}</span>
           </div>
           <Button size="icon" variant="ghost" onClick={onExit} className="rounded-full h-12 w-12"><X className="w-8 h-8" /></Button>
        </div>
      </div>

      <div 
        onMouseMove={handleMouseMove}
        className="relative w-full h-[500px] bg-zinc-950 rounded-[3rem] border-4 border-white/10 overflow-hidden cursor-none shadow-inner"
      >
        <div className="absolute inset-0 arcade-grid opacity-10 pointer-events-none" />
        
        {/* Player */}
        <div 
          className="absolute bottom-10 w-16 h-16 bg-primary rounded-3xl border-4 border-white/40 shadow-[0_0_40px_rgba(var(--primary),0.6)] flex items-center justify-center transition-all duration-75"
          style={{ left: `${playerX}%`, transform: 'translateX(-50%)' }}
        >
          <Target className="w-8 h-8 text-white" />
        </div>

        {/* Hazards */}
        {hazards.map(h => (
          <div 
            key={h.id}
            className="absolute w-8 h-8 bg-rose-600 rounded-lg border-2 border-white/20 animate-spin flex items-center justify-center"
            style={{ left: `${h.x}%`, top: `${h.y}%` }}
          >
             <Activity className="w-4 h-4 text-white opacity-40" />
          </div>
        ))}
      </div>

      <p className="text-[10px] font-black uppercase tracking-[0.4em] opacity-40 italic">Move cursor to navigate identity shard</p>

      {gameOver && (
        <div className="absolute inset-0 bg-black/95 backdrop-blur-md flex flex-col items-center justify-center text-center p-12 z-50 rounded-[4rem] animate-in slide-in-from-bottom-10">
          <Trophy className="w-24 h-24 text-amber-400 mb-8 animate-bounce" />
          <h3 className="text-7xl font-black text-white uppercase italic tracking-tighter">Collision!</h3>
          <p className="text-2xl font-black text-muted-foreground uppercase tracking-widest mt-4">Final XP: {score}</p>
          <Button onClick={() => window.location.reload()} className="mt-12 bg-primary h-20 px-20 rounded-[2.5rem] font-black uppercase text-xl shadow-2xl border-b-8 border-primary/20">REBOOT SYSTEM</Button>
        </div>
      )}
    </div>
  );
}
