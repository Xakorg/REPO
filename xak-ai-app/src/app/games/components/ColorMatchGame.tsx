"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { X, Trophy } from "lucide-react";
import { cn } from "@/lib/utils";

const COLORS = [
  { name: 'RED', class: 'bg-red-500', hex: '#ef4444' },
  { name: 'BLUE', class: 'bg-blue-500', hex: '#3b82f6' },
  { name: 'GREEN', class: 'bg-green-500', hex: '#22c55e' },
  { name: 'AMBER', class: 'bg-amber-500', hex: '#f59e0b' },
  { name: 'PURPLE', class: 'bg-primary', hex: '#a855f7' }
];

export function ColorMatchGame({ onExit }: { onExit: () => void }) {
  const [target, setTarget] = useState(COLORS[0]);
  const [label, setLabel] = useState(COLORS[1]);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(20);
  const [gameOver, setGameOver] = useState(false);

  const shuffle = () => {
    const t = COLORS[Math.floor(Math.random() * COLORS.length)];
    const l = COLORS[Math.floor(Math.random() * COLORS.length)];
    setTarget(t);
    setLabel(l);
  };

  useEffect(() => {
    shuffle();
    const timer = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          setGameOver(true);
          clearInterval(timer);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleMatch = (color: typeof COLORS[0]) => {
    if (color.name === target.name) {
      setScore(s => s + 100);
      shuffle();
    } else {
      setScore(s => Math.max(0, s - 50));
    }
  };

  return (
    <div className="flex flex-col items-center gap-10 p-12 glass-card rounded-[4rem] border-4 border-primary/30 shadow-2xl bg-background/90 max-w-md w-full text-foreground relative overflow-hidden">
      <div className="flex justify-between w-full items-center">
        <h2 className="text-3xl font-black italic uppercase">Color_Rush</h2>
        <Button size="icon" variant="ghost" onClick={onExit} className="rounded-full h-12 w-12"><X className="w-8 h-8" /></Button>
      </div>

      <div className="text-center space-y-6">
        <p className="text-[10px] font-black uppercase tracking-widest opacity-40">Time: {timeLeft}s</p>
        <div className="p-10 bg-black/40 rounded-[3rem] border-4 border-white/5 shadow-inner">
           <h3 className={cn("text-7xl font-black italic uppercase tracking-tighter leading-none transition-all", target.class.replace('bg', 'text'))}>
             {label.name}
           </h3>
        </div>
        <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground italic">Click the visual color, not the word!</p>
      </div>

      <div className="grid grid-cols-2 gap-4 w-full">
        {COLORS.map(c => (
          <button 
            key={c.name}
            onClick={() => handleMatch(c)}
            className={cn("h-20 rounded-2xl border-4 border-white/10 hover:scale-105 active:scale-95 transition-all shadow-xl", c.class)}
          />
        ))}
      </div>

      <div className="text-center">
        <span className="text-4xl font-black text-primary italic tabular-nums">{score}</span>
      </div>

      {gameOver && (
        <div className="absolute inset-0 bg-black/95 backdrop-blur-md flex flex-col items-center justify-center text-center p-8 z-20 rounded-[4rem] animate-in zoom-in-95 duration-500">
          <Trophy className="w-20 h-20 text-amber-400 mb-6 animate-bounce" />
          <h3 className="text-5xl font-black text-white uppercase italic tracking-tighter">Session End</h3>
          <p className="text-muted-foreground font-bold mt-4 uppercase">Score: {score}</p>
          <Button onClick={() => window.location.reload()} className="mt-10 bg-primary h-16 px-12 rounded-[2rem] font-black uppercase tracking-widest text-white shadow-2xl">PLAY AGAIN</Button>
        </div>
      )}
    </div>
  );
}
