"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  X, 
  Trophy, 
  User, 
  Bot, 
  Zap, 
  Timer, 
  Activity, 
  ChevronLeft, 
  Globe, 
  Shield, 
  Rocket, 
  Loader2 
} from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";

const PITCH_HEIGHT = 2000;

export default function ProFootballScrollingPage() {
  const [playerScore, setPlayerScore] = useState(0);
  const [aiScore, setAiScore] = useState(0);
  const [playerPos, setPlayerPos] = useState({ x: 50, y: 1800 });
  const [aiPos, setAiPos] = useState({ x: 50, y: 200 });
  const [ballPos, setBallPos] = useState({ x: 50, y: 1000 });
  const [ballVel, setBallVel] = useState({ x: 0, y: 0 });
  const [gameOver, setGameOver] = useState(false);
  const [time, setTime] = useState(90);
  const [viewportY, setViewportY] = useState(1500);
  const [gameMode, setGameMode] = useState<'selection' | 'lobby' | 'playing'>('selection');
  
  const gameRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window === 'undefined' || gameMode !== 'playing') return;
    const targetY = ballPos.y - window.innerHeight / 2;
    setViewportY(prev => prev + (targetY - prev) * 0.1);
  }, [ballPos, gameMode]);

  useEffect(() => {
    const handleMove = (e: MouseEvent) => {
      if (gameOver || !gameRef.current || gameMode !== 'playing') return;
      const rect = gameRef.current.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const mouseRelativeY = e.clientY - rect.top;
      const pitchY = viewportY + mouseRelativeY;
      
      setPlayerPos(prev => ({
        x: Math.max(5, Math.min(95, x)),
        y: Math.max(PITCH_HEIGHT / 2, Math.min(PITCH_HEIGHT - 50, pitchY))
      }));
    };
    window.addEventListener("mousemove", handleMove);
    return () => window.removeEventListener("mousemove", handleMove);
  }, [gameOver, viewportY, gameMode]);

  useEffect(() => {
    if (gameMode !== 'playing') return;
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
  }, [gameMode]);

  useEffect(() => {
    if (gameOver || gameMode !== 'playing') return;

    const gameLoop = setInterval(() => {
      setBallPos(prev => ({
        x: prev.x + ballVel.x,
        y: prev.y + ballVel.y
      }));

      setBallVel(prev => ({
        x: prev.x * 0.985,
        y: prev.y * 0.985
      }));

      setAiPos(prev => {
        const targetX = ballPos.x;
        const targetY = Math.max(50, Math.min(PITCH_HEIGHT / 2, ballPos.y - 20));
        const dx = targetX - prev.x;
        const dy = targetY - prev.y;
        return {
          x: prev.x + dx * 0.05,
          y: prev.y + dy * 0.05
        };
      });

      if (ballPos.x <= 5 || ballPos.x >= 95) setBallVel(v => ({ ...v, x: -v.x * 0.8 }));
      if (ballPos.y <= 0 || ballPos.y >= PITCH_HEIGHT) {
        if (ballPos.x > 35 && ballPos.x < 65) {
          if (ballPos.y <= 5) setPlayerScore(s => s + 1);
          if (ballPos.y >= PITCH_HEIGHT - 5) setAiScore(s => s + 1);
          resetBall();
        } else {
          setBallVel(v => ({ ...v, y: -v.y * 0.8 }));
        }
      }
      
      const realDistP = Math.sqrt(Math.pow(playerPos.x - ballPos.x, 2) + Math.pow((playerPos.y - ballPos.y) / 10, 2));
      if (realDistP < 8) {
        setBallVel({
          x: (ballPos.x - playerPos.x) * 0.8,
          y: (ballPos.y - playerPos.y) * 0.8
        });
      }

      const realDistA = Math.sqrt(Math.pow(aiPos.x - ballPos.x, 2) + Math.pow((aiPos.y - ballPos.y) / 10, 2));
      if (realDistA < 8) {
        setBallVel({
          x: (ballPos.x - aiPos.x) * 0.8,
          y: (ballPos.y - aiPos.y) * 0.8
        });
      }

    }, 16);

    return () => clearInterval(gameLoop);
  }, [ballPos, playerPos, aiPos, ballVel, gameOver, gameMode]);

  const resetBall = () => {
    setBallPos({ x: 50, y: PITCH_HEIGHT / 2 });
    setBallVel({ x: 0, y: 0 });
  };

  if (gameMode === 'selection') {
    return (
      <div className="fixed inset-0 z-[400] bg-black flex flex-col items-center justify-center p-10 animate-fade-in">
        <div className="absolute inset-0 arcade-grid opacity-10" />
        <div className="relative z-10 text-center space-y-12 max-w-4xl w-full">
          <div className="space-y-4">
            <h1 className="text-8xl font-black text-white italic tracking-tighter uppercase leading-none">Match Select</h1>
            <p className="text-primary font-black uppercase tracking-[0.5em] text-xs">Professional Football Match v4.2</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            <Card className="glass-card p-12 rounded-[4rem] border-white/10 bg-white/5 hover:border-primary transition-all cursor-pointer group" onClick={() => setGameMode('playing')}>
              <Shield className="w-20 h-20 text-primary mx-auto mb-8 transition-transform group-hover:scale-110" />
              <h3 className="text-3xl font-black uppercase italic tracking-tighter mb-4">Local Arena</h3>
              <p className="text-xs text-muted-foreground font-bold uppercase tracking-widest italic leading-relaxed">Match against the professional AI bot defender.</p>
              <Button className="mt-8 bg-primary w-full h-14 rounded-2xl font-black uppercase text-xs text-white">Play Offline</Button>
            </Card>

            <Card className="glass-card p-12 rounded-[4rem] border-white/10 bg-white/5 hover:border-blue-500 transition-all cursor-pointer group" onClick={() => setGameMode('lobby')}>
              <Globe className="w-20 h-20 text-blue-500 mx-auto mb-8 transition-transform group-hover:scale-110" />
              <h3 className="text-3xl font-black uppercase italic tracking-tighter mb-4">Global Online</h3>
              <p className="text-xs text-muted-foreground font-bold uppercase tracking-widest italic leading-relaxed">Search the multiverse for an active opponent.</p>
              <Button className="mt-8 bg-blue-600 w-full h-14 rounded-2xl font-black uppercase text-xs text-white">Join Server</Button>
            </Card>
          </div>

          <Link href="/games">
            <Button variant="ghost" className="text-[10px] font-black uppercase tracking-[0.4em] text-muted-foreground hover:text-white">Return to Games</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[400] bg-black flex flex-col animate-in fade-in duration-500 overflow-hidden text-foreground">
      <header className="h-20 bg-zinc-900/90 backdrop-blur-xl border-b-4 border-white/10 px-10 flex items-center justify-between z-50 shadow-2xl">
        <div className="flex items-center gap-6">
          <Link href="/games">
            <Button variant="ghost" size="icon" className="rounded-full h-12 w-12 text-white hover:bg-white/10 border-2 border-white/5"><ChevronLeft className="w-6 h-6" /></Button>
          </Link>
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-green-600 flex items-center justify-center shadow-lg"><Zap className="w-6 h-6 text-white" /></div>
            <h2 className="text-xl font-black text-white uppercase italic tracking-tighter">Pro_Football_3D</h2>
          </div>
        </div>

        <div className="flex items-center gap-8 bg-black/60 px-10 py-2 rounded-2xl border-2 border-white/10">
          <div className="text-center">
            <p className="text-[8px] font-black uppercase text-muted-foreground">YOU</p>
            <span className="text-3xl font-black text-primary italic leading-none">{playerScore}</span>
          </div>
          <div className="h-8 w-px bg-white/10" />
          <div className="flex flex-col items-center">
            <Timer className="w-3 h-3 text-amber-500 mb-1" />
            <span className="text-lg font-black italic tabular-nums text-white">{time}s</span>
          </div>
          <div className="h-8 w-px bg-white/10" />
          <div className="text-center">
            <p className="text-[8px] font-black uppercase text-muted-foreground">BOT</p>
            <span className="text-3xl font-black text-rose-500 italic leading-none">{aiScore}</span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <Badge variant="outline" className="border-green-500/20 text-green-500 bg-green-500/5 text-[8px] font-black uppercase tracking-widest px-4 py-1.5">V-Sync Mode</Badge>
        </div>
      </header>

      <div 
        ref={gameRef}
        className="flex-1 relative overflow-hidden bg-green-950"
      >
        <div className="absolute inset-0 arcade-grid opacity-10 pointer-events-none" />
        
        <div 
          className="absolute inset-x-0 transition-transform duration-75 ease-out"
          style={{ 
            height: `${PITCH_HEIGHT}px`, 
            transform: `translateY(${-viewportY}px)`,
            backgroundImage: 'repeating-linear-gradient(0deg, #064e3b, #064e3b 100px, #065f46 100px, #065f46 200px)'
          }}
        >
          <div className="absolute top-0 left-0 right-0 h-4 border-b-4 border-white/30" />
          <div className="absolute bottom-0 left-0 right-0 h-4 border-t-4 border-white/30" />
          <div className="absolute top-1/2 left-0 right-0 h-px bg-white/30" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full border-4 border-white/30" />
          
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/3 h-20 bg-rose-500/20 border-4 border-white/40 border-t-0 rounded-b-3xl flex items-center justify-center">
            <div className="text-[10px] font-black text-white/20 uppercase tracking-[1em]">AI_GOAL</div>
          </div>
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1/3 h-20 bg-primary/20 border-4 border-white/40 border-b-0 rounded-t-3xl flex items-center justify-center">
            <div className="text-[10px] font-black text-white/20 uppercase tracking-[1em]">PLAYER_GOAL</div>
          </div>

          <div 
            className="absolute w-10 h-10 bg-white rounded-full border-4 border-black/20 shadow-[0_10px_20px_rgba(0,0,0,0.5)] z-20"
            style={{ left: `${ballPos.x}%`, top: `${ballPos.y}px`, transform: 'translate(-50%, -50%)' }}
          >
            <div className="w-full h-full animate-spin duration-[0.5s]" style={{ backgroundImage: 'radial-gradient(circle at 30% 30%, transparent, rgba(0,0,0,0.3))' }} />
          </div>

          <div 
            className="absolute w-16 h-16 bg-primary rounded-2xl border-4 border-white/40 shadow-[0_0_30px_rgba(var(--primary),0.6)] flex items-center justify-center z-10"
            style={{ left: `${playerPos.x}%`, top: `${playerPos.y}px`, transform: 'translate(-50%, -50%)' }}
          >
            <User className="w-8 h-8 text-white" />
            <div className="absolute -top-10 bg-primary text-white text-[8px] font-black px-2 py-1 rounded-md shadow-xl whitespace-nowrap uppercase">Hero Player</div>
          </div>

          <div 
            className="absolute w-16 h-16 bg-rose-600 rounded-2xl border-4 border-white/40 shadow-2xl flex items-center justify-center z-10"
            style={{ left: `${aiPos.x}%`, top: `${aiPos.y}px`, transform: 'translate(-50%, -50%)' }}
          >
            <Bot className="w-8 h-8 text-white" />
            <div className="absolute -top-10 bg-rose-600 text-white text-[8px] font-black px-2 py-1 rounded-md shadow-xl whitespace-nowrap uppercase">AI_Defensor</div>
          </div>
        </div>
      </div>

      {gameOver && (
        <div className="absolute inset-0 z-[500] bg-black/95 backdrop-blur-3xl flex flex-col items-center justify-center text-center p-12">
          <Trophy className="w-32 h-32 text-amber-400 mb-8 animate-bounce" />
          <h3 className="text-8xl font-black text-white uppercase italic tracking-tighter leading-none mb-4">
            {playerScore > aiScore ? "VICTORY!" : playerScore < aiScore ? "DEFEAT" : "DRAW"}
          </h3>
          <p className="text-2xl text-muted-foreground font-black uppercase tracking-[0.5em] mb-12 italic">Final Score: {playerScore} - {aiScore}</p>
          <div className="flex gap-6">
            <Button onClick={() => window.location.reload()} className="h-20 px-16 bg-primary hover:bg-primary/90 text-white rounded-[2rem] font-black uppercase text-xl tracking-widest shadow-2xl border-4 border-white/10">REMATCH</Button>
            <Link href="/games">
              <Button variant="outline" className="h-20 px-12 rounded-[2rem] border-4 border-white/10 font-black uppercase text-xs text-white hover:bg-white/5">HUB EXIT</Button>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
