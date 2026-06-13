"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { X, Bird, Trophy } from "lucide-react";

export function FlappyGame({ onExit }: { onExit: () => void }) {
  const [score, setScore] = useState(0);
  const [birdY, setBirdY] = useState(200);
  const [gameOver, setGameOver] = useState(false);

  useEffect(() => {
    if (gameOver) return;
    const interval = setInterval(() => {
      setBirdY(y => Math.min(400, y + 5));
    }, 30);
    return () => clearInterval(interval);
  }, [gameOver]);

  const jump = () => {
    if (gameOver) return;
    setBirdY(y => Math.max(0, y - 60));
    setScore(s => s + 1);
  };

  return (
    <div className="flex flex-col items-center gap-8 p-12 glass-card rounded-[4rem] border-4 border-primary/30 shadow-2xl bg-background/90 animate-in zoom-in-95 duration-500 max-w-2xl w-full relative overflow-hidden" onClick={jump}>
      <div className="flex justify-between w-full items-center z-10 text-foreground">
        <h2 className="text-3xl font-black italic uppercase">Flappy_Xak</h2>
        <Button size="icon" variant="ghost" onClick={onExit} className="rounded-full h-12 w-12"><X className="w-8 h-8" /></Button>
      </div>

      <div className="relative w-full h-96 bg-sky-400/20 rounded-[3rem] border-4 border-white/10 overflow-hidden">
        <div className="absolute inset-0 arcade-grid opacity-10" />
        <div 
          className="absolute left-20 w-12 h-12 bg-amber-400 rounded-full border-4 border-white/20 shadow-lg transition-all duration-75 flex items-center justify-center"
          style={{ top: birdY }}
        >
          <Bird className="w-6 h-6 text-white" />
        </div>
      </div>

      <div className="text-center z-10">
        <span className="text-4xl font-black text-primary">{score}</span>
      </div>

      {gameOver && (
        <div className="absolute inset-0 bg-black/95 flex flex-col items-center justify-center text-center p-8 z-20 rounded-[4rem]">
          <Trophy className="w-20 h-20 text-amber-400 mb-6" />
          <h3 className="text-5xl font-black text-white uppercase italic">Crash!</h3>
          <Button onClick={onExit} className="mt-10 bg-primary h-16 px-12 rounded-[2rem] font-black text-white">Back</Button>
        </div>
      )}
    </div>
  );
}
