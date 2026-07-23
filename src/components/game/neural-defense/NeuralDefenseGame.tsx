"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Sword, Trophy, Shield, Coins, Zap, Heart, Crosshair, ChevronLeft, Activity } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

export default function NeuralDefenseGame() {
  const [money, setMoney] = useState(500);
  const [health, setHealth] = useState(10);
  const [wave, setWave] = useState(1);
  const [towers, setTowers] = useState<{ id: number, x: number, y: number, type: string }[]>([]);
  const [enemies, setEnemies] = useState<{ id: number, progress: number, hp: number }[]>([]);
  const [gameOver, setGameOver] = useState(false);

  const resetGame = () => {
    setMoney(500);
    setHealth(10);
    setWave(1);
    setTowers([]);
    setEnemies([]);
    setGameOver(false);
  };

  useEffect(() => {
    if (gameOver) return;

    const spawnInterval = setInterval(() => {
      setEnemies(prev => [...prev, { 
        id: Date.now(), 
        progress: 0, 
        hp: 50 + (wave * 15) 
      }]);
    }, Math.max(500, 2000 - (wave * 100)));

    const gameLoop = setInterval(() => {
      setEnemies(prev => {
        const next = prev.map(e => ({ ...e, progress: e.progress + 0.4 }));
        const reached = next.filter(e => e.progress >= 100);
        if (reached.length > 0) {
          setHealth(h => Math.max(0, h - reached.length));
        }
        return next.filter(e => e.progress < 100 && e.hp > 0);
      });

      setEnemies(prev => {
        return prev.map(enemy => {
          let damage = 0;
          towers.forEach(t => {
            const enemyX = enemy.progress;
            const enemyY = 50; 
            const dist = Math.sqrt(Math.pow(t.x - enemyX, 2) + Math.pow(t.y - enemyY, 2));
            if (dist < 25) damage += 1.5;
          });
          if (damage > 0) {
            if (enemy.hp - damage <= 0) setMoney(m => m + 25);
            return { ...enemy, hp: enemy.hp - damage };
          }
          return enemy;
        });
      });

      if (health <= 0) setGameOver(true);
    }, 50);

    return () => {
      clearInterval(spawnInterval);
      clearInterval(gameLoop);
    };
  }, [wave, towers, health, gameOver]);

  const placeTower = (e: React.MouseEvent) => {
    if (money < 150 || gameOver) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    if (Math.abs(y - 50) < 15) return;
    setTowers(prev => [...prev, { id: Date.now(), x, y, type: 'laser' }]);
    setMoney(m => m - 150);
  };

  return (
    <div className="fixed inset-0 z-[400] bg-black flex flex-col animate-in fade-in duration-500 overflow-hidden text-foreground">
      <header className="h-24 bg-zinc-900/90 backdrop-blur-xl border-b-4 border-white/10 px-10 flex items-center justify-between z-50 shadow-2xl">
        <div className="flex items-center gap-8">
          <Link href="/games">
            <Button variant="ghost" size="icon" className="rounded-full h-14 w-14 text-white hover:bg-white/10 border-2 border-white/5"><ChevronLeft className="w-8 h-8" /></Button>
          </Link>
          <div className="flex items-center gap-5">
            <div className="w-14 h-14 rounded-2xl bg-blue-600 flex items-center justify-center shadow-lg"><Shield className="w-8 h-8 text-white" /></div>
            <div>
              <h1 className="text-3xl font-black text-white uppercase italic tracking-tighter">Base_Defense</h1>
              <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest mt-1">Sector Integrity System v4.2</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-10">
          <div className="flex items-center gap-4 bg-black/60 px-8 py-3 rounded-2xl border-2 border-white/10 shadow-2xl">
            <Coins className="w-6 h-6 text-amber-500" />
            <span className="text-3xl font-black italic text-white tabular-nums">{money}</span>
          </div>
          <div className="flex items-center gap-4 bg-rose-500/10 px-8 py-3 rounded-2xl border-2 border-rose-500/20 shadow-2xl">
            <Heart className="w-6 h-6 text-rose-500 fill-rose-500" />
            <span className="text-3xl font-black text-rose-500 italic tabular-nums">{health}</span>
          </div>
          <Badge variant="outline" className="border-blue-500/20 text-blue-400 bg-blue-500/5 text-[10px] font-black uppercase px-6 py-2">Wave {wave}</Badge>
        </div>
      </header>

      <div 
        onClick={placeTower}
        className="flex-1 relative bg-zinc-950 cursor-crosshair group overflow-hidden"
      >
        <div className="absolute inset-0 arcade-grid opacity-10 pointer-events-none" />
        
        <div className="absolute top-1/2 left-0 w-full h-24 -translate-y-1/2 bg-white/5 border-y-4 border-white/10 flex items-center justify-between px-20">
           <div className="text-2xl font-black uppercase text-white/5 tracking-[2em] animate-pulse">CORE_TRANSMISSION_SECTOR</div>
           <div className="w-32 h-32 rounded-full bg-primary/5 border-4 border-primary/10 animate-pulse flex items-center justify-center">
              <Zap className="w-16 h-16 text-primary opacity-10" />
           </div>
        </div>

        {towers.map(t => (
          <div 
            key={t.id} 
            className="absolute animate-in zoom-in-95 duration-300"
            style={{ left: `${t.x}%`, top: `${t.y}%`, transform: 'translate(-50%, -50%)' }}
          >
            <div className="relative group/tower">
              <div className="absolute -inset-8 bg-blue-500/10 rounded-full animate-pulse group-hover/tower:bg-blue-500/20 transition-all" />
              <div className="w-16 h-16 bg-blue-600 rounded-3xl border-4 border-white/40 flex items-center justify-center shadow-[0_0_40px_rgba(37,99,235,0.6)]">
                <Crosshair className="w-8 h-8 text-white" />
              </div>
              <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-black border border-white/10 px-3 py-1 rounded-lg text-[8px] font-black uppercase text-blue-400 opacity-0 group-hover/tower:opacity-100 transition-opacity">LVL_1_LASER</div>
            </div>
          </div>
        ))}

        {enemies.map(e => (
          <div 
            key={e.id}
            className="absolute transition-all duration-75"
            style={{ left: `${e.progress}%`, top: '50%', transform: 'translate(-50%, -50%)' }}
          >
            <div className="space-y-2 flex flex-col items-center">
              <div className="w-12 h-1.5 bg-black/40 rounded-full overflow-hidden border border-white/10">
                <div className="h-full bg-rose-500 transition-all" style={{ width: `${(e.hp / (50 + wave * 15)) * 100}%` }} />
              </div>
              <div className="w-12 h-12 bg-zinc-900 rounded-2xl border-4 border-rose-500/40 flex items-center justify-center animate-bounce shadow-lg">
                <Sword className="w-6 h-6 text-rose-500" />
              </div>
            </div>
          </div>
        ))}

        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 pointer-events-none">
           <div className="bg-primary/20 backdrop-blur-xl border-4 border-primary/30 text-white px-10 py-4 rounded-[2rem] shadow-2xl flex items-center gap-6">
              <div className="flex flex-col">
                <span className="text-[10px] font-black uppercase tracking-widest opacity-60">Build Tool</span>
                <span className="text-xl font-black uppercase italic">Laser Tower</span>
              </div>
              <div className="h-10 w-px bg-white/20" />
              <div className="flex items-center gap-3">
                <Coins className="w-5 h-5 text-amber-500" />
                <span className="text-xl font-black tabular-nums">150</span>
              </div>
           </div>
        </div>
      </div>

      <footer className="h-20 border-t-4 border-white/10 bg-zinc-900/90 backdrop-blur-xl flex items-center justify-between px-10">
        <div className="flex items-center gap-4 text-muted-foreground">
          <Activity className="w-5 h-5 text-blue-500 animate-pulse" />
          <p className="text-[10px] font-black uppercase tracking-[0.4em]">Sector Integrity Protocol Active // Enemy Wave Impending</p>
        </div>
        <Button onClick={() => setWave(w => w + 1)} className="bg-primary hover:bg-primary/90 h-12 px-12 rounded-xl font-black uppercase text-xs tracking-widest text-white shadow-xl transition-all active:scale-95">
          Release Wave {wave + 1}
        </Button>
      </footer>

      {gameOver && (
        <div className="absolute inset-0 z-[500] bg-black/95 backdrop-blur-3xl flex flex-col items-center justify-center text-center p-12">
          <Trophy className="w-32 h-32 text-amber-400 mb-8 animate-bounce" />
          <h3 className="text-8xl font-black text-white uppercase italic tracking-tighter leading-none mb-4">SECTOR BREACH</h3>
          <p className="text-2xl text-muted-foreground font-black uppercase tracking-[0.5em] mb-12 italic">Waves Defeated: {wave}</p>
          <div className="flex gap-6">
            <Button onClick={resetGame} className="h-20 px-16 bg-primary hover:bg-primary/90 text-white rounded-[2rem] font-black uppercase text-xl tracking-widest shadow-2xl border-4 border-white/10">PLAY AGAIN</Button>
            <Link href="/games">
              <Button variant="outline" className="h-20 px-12 rounded-[2rem] border-4 border-white/10 font-black uppercase text-xs text-white hover:bg-white/5">HUB EXIT</Button>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
