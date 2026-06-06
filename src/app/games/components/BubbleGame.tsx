"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { X, Sparkles, Trophy } from "lucide-react";
import { cn } from "@/lib/utils";

export function BubbleGame({ onExit }: { onExit: () => void }) {
  const [bubbles, setBubbles] = useState<{ id: number, x: number, y: number, color: string }[]>([]);
  const [score, setScore] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      if (bubbles.length < 12) {
        setBubbles(prev => [...prev, {
          id: Date.now() + Math.random(),
          x: Math.random() * 80 + 10,
          y: Math.random() * 80 + 10,
          color: ['bg-primary', 'bg-blue-500', 'bg-rose-500', 'bg-amber-500', 'bg-emerald-500'][Math.floor(Math.random() * 5)]
        }]);
      }
    }, 600);
    return () => clearInterval(interval);
  }, [bubbles]);

  const popBubble = (id: number) => {
    setBubbles(prev => prev.filter(b => b.id !== id));
    setScore(s => s + 10);
  };

  return (
    <div className="flex flex-col items-center gap-8 p-12 glass-card rounded-[4rem] border-4 border-primary/30 shadow-2xl bg-background/90 max-w-2xl w-full text-foreground relative overflow-hidden">
      <div className="flex justify-between w-full items-center z-10">
        <h2 className="text-3xl font-black italic uppercase">Bubble_Pop</h2>
        <div className="flex items-center gap-6">
           <span className="text-2xl font-black text-primary italic">SCORE: {score}</span>
           <Button size="icon" variant="ghost" onClick={onExit} className="rounded-full h-12 w-12"><X className="w-8 h-8" /></Button>
        </div>
      </div>

      <div className="relative w-full h-[450px] bg-zinc-950 rounded-[3rem] border-4 border-white/10 overflow-hidden shadow-inner">
        <div className="absolute inset-0 arcade-grid opacity-10" />
        {bubbles.map(b => (
          <button 
            key={b.id}
            onClick={() => popBubble(b.id)}
            className={cn("absolute w-20 h-20 rounded-full border-4 border-white/20 animate-float transition-all hover:scale-110 active:scale-0 shadow-lg", b.color)}
            style={{ left: `${b.x}%`, top: `${b.y}%` }}
          />
        ))}
      </div>

      <p className="text-[10px] font-black uppercase tracking-[0.4em] opacity-40 italic">Pop bubbles to gain energy points</p>
    </div>
  );
}
