"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { X, Trophy, Target, Shield, User, Bot, Zap, Timer, Activity } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

export function Football3DGame({ onExit }: { onExit: () => void }) {
  const [playerScore, setPlayerScore] = useState(0);
  const [aiScore, setAiScore] = useState(0);
  const [playerPos, setPlayerPos] = useState({ x: 50, y: 80 });
  const [aiPos, setAiPos] = useState({ x: 50, y: 20 });
  const [ballPos, setBallPos] = useState({ x: 50, y: 50 });
  const [ballVel, setBallVel] = useState({ x: 0, y: 0 });
  const [gameOver, setGameOver] = useState(false);
  const [time, setTime] = useState(90);
  const gameRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleMove = (e: MouseEvent) => {
      if (gameOver || !gameRef.current) return;
      const rect = gameRef.current.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;
      setPlayerPos({ x: Math.max(10, Math.min(90, x)), y: Math.max(55, Math.min(95, y)) });
    };
    window.addEventListener("mousemove", handleMove);
    return () => window.removeEventListener("mousemove", handleMove);
  }, [gameOver]);

  useEffect(() => {
    const clock = setInterval(() => {
      setTime(prev => {
        if (prev <= 0) {
          setGameOver(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(clock);
  }, []);

  useEffect(() => {
    if (gameOver) return;

    const gameLoop = setInterval(() => {
      // Ball Physics
      setBallPos(prev => ({
        x: prev.x + ballVel.x,
        y: prev.y + ballVel.y
      }));

      // Friction
      setBallVel(prev => ({
        x: prev.x * 0.985,
        y: prev.y * 0.985
      }));

      // Pro AI Logic (Advanced Style Tracking)
      setAiPos(prev => {
        const targetX = ballPos.x;
        const targetY = Math.max(5, Math.min(45, ballPos.y - 5));
        const dx = targetX - prev.x;
        const dy = targetY - prev.y;
        return {
          x: prev.x + dx * 0.08,
          y: prev.y + dy * 0.08
        };
      });

      // Bounds & Walls
      if (ballPos.x <= 5 || ballPos.x >= 95) setBallVel(v => ({ ...v, x: -v.x * 0.8 }));
      if (ballPos.y <= 0 || ballPos.y >= 100) setBallVel(v => ({ ...v, y: -v.y * 0.8 }));
      
      // Goals
      if (ballPos.y <= 2 && ballPos.x > 35 && ballPos.x < 65) {
        setPlayerScore(s => s + 1);
        resetBall();
      }
      if (ballPos.y >= 98 && ballPos.x > 35 && ballPos.x < 65) {
        setAiScore(s => s + 1);
        resetBall();
      }

      // Pro Collision Player
      const distP = Math.sqrt(Math.pow(playerPos.x - ballPos.x, 2) + Math.pow(playerPos.y - ballPos.y, 2));
      if (distP < 7) {
        const force = 0.6;
        setBallVel({
          x: (ballPos.x - playerPos.x) * force,
          y: (ballPos.y - playerPos.y) * force
        });
      }

      // Pro Collision AI
      const distA = Math.sqrt(Math.pow(aiPos.x - ballPos.x, 2) + Math.pow(aiPos.y - ballPos.y, 2));
      if (distA < 7) {
        const force = 0.6;
        setBallVel({
          x: (ballPos.x - aiPos.x) * force,
          y: (ballPos.y - aiPos.y) * force
        });
      }

    }, 16);

    return () => clearInterval(gameLoop);
  }, [ballPos, playerPos, aiPos, ballVel, gameOver]);

  const resetBall = () => {
    setBallPos({ x: 50, y: 50 });
    setBallVel({ x: (Math.random() - 0.5) * 2, y: (Math.random() - 0.5) * 2 });
  };

  return (
    <div className="flex flex-col items-center gap-8 p-12 glass-card rounded-[4rem] border-4 border-primary/30 shadow-2xl bg-background/90 max-w-5xl w-full text-foreground relative overflow-hidden">
      <div className="absolute inset-0 arcade-grid opacity-10 pointer-events-none" />
      
      <div className="flex justify-between w-full items-center z-10">
        <div className="flex items-center gap-6">
          <div className="w-14 h-14 rounded-2xl bg-green-600 flex items-center justify-center shadow-lg border-2 border-white/20"><Zap className="w-8 h-8 text-white" /></div>
          <div>
            <h2 className="text-4xl font-black italic uppercase tracking-tighter leading-none">Pro_Football_3D</h2>
            <p className="text-[10px] font-black text-green-500 uppercase tracking-widest mt-1">Professional Match Sync</p>
          </div>
        </div>

        <div className="flex items-center gap-8">
          <div className="flex items-center gap-6 bg-black/60 px-8 py-3 rounded-[2rem] border-2 border-white/10 shadow-2xl">
            <div className="text-center">
              <p className="text-[8px] font-black uppercase text-muted-foreground mb-1">PLAYER</p>
              <span className="text-4xl font-black text-primary italic leading-none">{playerScore}</span>
            </div>
            <div className="h-10 w-px bg-white/10" />
            <div className="flex flex-col items-center gap-1">
              <Timer className="w-4 h-4 text-amber-500" />
              <span className="text-xl font-black italic tabular-nums">{time}s</span>
            </div>
            <div className="h-10 w-px bg-white/10" />
            <div className="text-center">
              <p className="text-[8px] font-black uppercase text-muted-foreground mb-1">AI_BOT</p>
              <span className="text-4xl font-black text-rose-500 italic leading-none">{aiScore}</span>
            </div>
          </div>
          <Button size="icon" variant="ghost" onClick={onExit} className="rounded-full h-14 w-14 bg-white/5 hover:bg-white/10 border-2 border-white/5"><X className="w-8 h-8" /></Button>
        </div>
      </div>

      <div 
        ref={gameRef}
        className="relative w-full aspect-[21/9] bg-green-950 rounded-[4rem] border-8 border-white/10 overflow-hidden shadow-[0_0_100px_rgba(0,0,0,0.8)]"
        style={{ perspective: '1200px' }}
      >
        <div className="absolute inset-0 bg-green-800 opacity-20 pointer-events-none" style={{ backgroundImage: 'repeating-linear-gradient(90deg, transparent, transparent 10%, rgba(255,255,255,0.05) 10%, rgba(255,255,255,0.05) 20%)' }} />
        
        {/* Pro 3D Pitch Rendering */}
        <div className="absolute inset-0 flex flex-col justify-between" style={{ transform: 'rotateX(35deg) translateY(-80px) scale(1.3)' }}>
          {/* Top Goal */}
          <div className="w-1/3 h-16 border-4 border-white/40 border-t-0 mx-auto bg-white/5 rounded-b-[2rem] flex items-center justify-center relative">
             <div className="absolute inset-0 bg-rose-500/10 rounded-b-[2rem] animate-pulse" />
             <div className="text-[10px] font-black text-white/30 uppercase tracking-[0.5em] z-10">AI_SECTOR</div>
          </div>

          <div className="w-full h-px bg-white/20 relative">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full border-4 border-white/10 flex items-center justify-center">
               <div className="w-4 h-4 bg-white/20 rounded-full" />
            </div>
          </div>

          {/* Bottom Goal */}
          <div className="w-1/3 h-16 border-4 border-white/40 border-b-0 mx-auto bg-white/5 rounded-t-[2rem] flex items-center justify-center relative">
             <div className="absolute inset-0 bg-primary/10 rounded-t-[2rem] animate-pulse" />
             <div className="text-[10px] font-black text-white/30 uppercase tracking-[0.5em] z-10">PLAYER_ZONE</div>
          </div>
        </div>

        {/* Pro Players & Ball */}
        <div className="absolute inset-0 pointer-events-none">
          {/* Pro Ball */}
          <div 
            className="absolute w-8 h-8 bg-white rounded-full border-4 border-black/20 transition-all duration-75"
            style={{ 
              left: `${ballPos.x}%`, 
              top: `${ballPos.y}%`, 
              transform: 'translate(-50%, -50%)', 
              boxShadow: `0 20px 40px rgba(0,0,0,0.6), 0 0 20px rgba(255,255,255,0.4)`
            }}
          >
            <div className="w-full h-full animate-spin duration-[0.3s]" style={{ backgroundImage: 'radial-gradient(circle at 30% 30%, transparent, rgba(0,0,0,0.2))' }} />
          </div>

          {/* Pro AI Bot */}
          <div 
            className="absolute w-16 h-16 bg-rose-600 rounded-[1.5rem] border-4 border-white/30 shadow-2xl flex items-center justify-center transition-all duration-100"
            style={{ left: `${aiPos.x}%`, top: `${aiPos.y}%`, transform: 'translate(-50%, -50%) scale(1.1)' }}
          >
            <Bot className="w-10 h-10 text-white drop-shadow-lg" />
            <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-rose-600 text-white px-3 py-1 rounded-lg text-[8px] font-black uppercase">LVL_MAX_BOT</div>
          </div>

          {/* Pro Player */}
          <div 
            className="absolute w-18 h-18 bg-primary rounded-[1.5rem] border-4 border-white/40 shadow-[0_0_50px_rgba(var(--primary),0.8)] flex items-center justify-center transition-all duration-75"
            style={{ left: `${playerPos.x}%`, top: `${playerPos.y}%`, transform: 'translate(-50%, -50%) scale(1.1)' }}
          >
            <User className="w-10 h-10 text-white drop-shadow-lg" />
            <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-primary text-white px-3 py-1 rounded-lg text-[8px] font-black uppercase shadow-xl">HERO_PLAYER</div>
          </div>
        </div>
      </div>

      <div className="w-full flex justify-between items-center px-10">
        <div className="flex items-center gap-4 text-muted-foreground">
          <Activity className="w-5 h-5 text-green-500 animate-pulse" />
          <p className="text-[10px] font-black uppercase tracking-[0.4em]">Match Sync v4.2.8 // V-Sync Mode Active</p>
        </div>
        <div className="flex gap-4">
          <Badge variant="outline" className="bg-white/5 border-white/10 text-[8px] font-black uppercase tracking-widest px-4 py-1.5">Crowd Audio: ON</Badge>
          <Badge variant="outline" className="bg-white/5 border-white/10 text-[8px] font-black uppercase tracking-widest px-4 py-1.5">AI Level: Professional</Badge>
        </div>
      </div>

      {gameOver && (
        <div className="absolute inset-0 bg-black/95 backdrop-blur-xl flex flex-col items-center justify-center text-center p-12 z-[100] rounded-[4rem] animate-in fade-in duration-500">
          <Trophy className="w-32 h-32 text-amber-400 mb-8 animate-bounce drop-shadow-[0_0_50px_rgba(251,191,36,0.6)]" />
          <h3 className="text-8xl font-black text-white uppercase italic tracking-tighter leading-none mb-4">
            {playerScore > aiScore ? "VICTORY!" : playerScore < aiScore ? "DEFEAT" : "DRAW"}
          </h3>
          <p className="text-2xl text-muted-foreground font-black uppercase tracking-[0.5em] mb-12 italic">Final Score: {playerScore} - {aiScore}</p>
          <div className="flex gap-6">
            <Button onClick={() => window.location.reload()} className="h-20 px-16 bg-primary hover:bg-primary/90 text-white rounded-[2rem] font-black uppercase text-xl tracking-widest shadow-2xl border-4 border-white/10 transition-all active:scale-95">REMATCH</Button>
            <button onClick={onExit} className="h-20 px-12 rounded-[2rem] border-4 border-white/10 font-black uppercase text-xs text-white hover:bg-white/5">HUB EXIT</button>
          </div>
        </div>
      )}
    </div>
  );
}
