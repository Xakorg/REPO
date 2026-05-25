"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { X, Trophy, Wind, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

export function JumpGame({ onExit }: { onExit: () => void }) {
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [playerY, setPlayerY] = useState(0);
  const [isJumping, setIsJumping] = useState(false);
  const [obstaclePos, setObstaclePos] = useState(100);

  useEffect(() => {
    if (gameOver) return;

    const gameLoop = setInterval(() => {
      setScore(s => s + 1);
      setObstaclePos(prev => {
        if (prev <= -10) return 100;
        return prev - 2;
      });

      // Collision Check
      if (obstaclePos < 25 && obstaclePos > 15 && playerY < 40) {
        setGameOver(true);
      }
    }, 20);

    return () => clearInterval(gameLoop);
  }, [gameOver, obstaclePos, playerY]);

  const jump = () => {
    if (isJumping || gameOver) return;
    setIsJumping(true);
    let height = 0;
    let up = true;
    const interval = setInterval(() => {
      if (up) {
        height += 8;
        if (height >= 120) up = false;
      } else {
        height -= 8;
        if (height <= 0) {
          height = 0;
          clearInterval(interval);
          setIsJumping(false);
        }
      }
      setPlayerY(height);
    }, 16);
  };

  return (
    <div 
      className="flex flex-col items-center gap-10 p-12 glass-card rounded-[4rem] border-4 border-primary/30 shadow-2xl bg-background/90 max-w-2xl w-full text-foreground relative overflow-hidden" 
      onClick={jump}
    >
      <div className="flex justify-between w-full items-center z-10">
        <h2 className="text-3xl font-black italic uppercase">Void_Runner</h2>
        <div className="flex items-center gap-6">
           <span className="text-3xl font-black text-primary italic tabular-nums">{score}</span>
           <Button size="icon" variant="ghost" onClick={(e) => { e.stopPropagation(); onExit(); }} className="rounded-full h-12 w-12"><X className="w-8 h-8" /></Button>
        </div>
      </div>

      <div className="relative w-full h-64 bg-zinc-950 rounded-[3rem] border-4 border-white/10 overflow-hidden flex items-end shadow-inner">
        <div className="absolute inset-0 arcade-grid opacity-10" />
        
        {/* Player */}
        <div 
          className="absolute left-20 w-16 h-16 bg-primary rounded-2xl border-4 border-white/40 shadow-2xl flex items-center justify-center transition-transform duration-75"
          style={{ bottom: playerY + 20 }}
        >
          <Wind className="w-8 h-8 text-white animate-pulse" />
        </div>

        {/* Obstacle */}
        <div 
          className="absolute w-10 h-10 bg-rose-600 rounded-xl border-4 border-white/10 animate-pulse"
          style={{ left: `${obstaclePos}%`, bottom: '20px' }}
        >
           <Zap className="w-5 h-5 text-white m-auto mt-1" />
        </div>

        <div className="w-full h-5 bg-white/10 border-t border-white/20" />
      </div>

      <p className="text-[10px] font-black uppercase tracking-[0.4em] text-muted-foreground animate-pulse italic">Tap Screen to Execute Jump Protocol</p>

      {gameOver && (
        <div className="absolute inset-0 bg-black/95 backdrop-blur-md flex flex-col items-center justify-center text-center p-12 z-50 rounded-[4rem] animate-in zoom-in-95">
          <Trophy className="w-20 h-20 text-amber-400 mb-6" />
          <h3 className="text-6xl font-black text-white uppercase italic tracking-tighter">Impact!</h3>
          <p className="text-xl font-bold mt-4 uppercase text-primary">Distance: {score}m</p>
          <Button onClick={(e) => { e.stopPropagation(); window.location.reload(); }} className="mt-10 bg-primary h-18 px-16 rounded-[2rem] font-black uppercase text-white shadow-2xl text-lg">RE-SYNC RUNNER</Button>
        </div>
      )}
    </div>
  );
}
