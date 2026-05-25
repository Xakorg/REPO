"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { X, Sword, Trophy, Shield, Coins, Zap, Heart, Crosshair } from "lucide-react";
import { cn } from "@/lib/utils";

export function TowerDefenseGame({ onExit }: { onExit: () => void }) {
  const [money, setMoney] = useState(500);
  const [health, setHealth] = useState(10);
  const [wave, setWave] = useState(1);
  const [towers, setTowers] = useState<{ id: number, x: number, y: number, type: string }[]>([]);
  const [enemies, setEnemies] = useState<{ id: number, progress: number, hp: number }[]>([]);
  const [gameOver, setGameOver] = useState(false);

  useEffect(() => {
    if (gameOver) return;

    const spawnInterval = setInterval(() => {
      setEnemies(prev => [...prev, { 
        id: Date.now(), 
        progress: 0, 
        hp: 50 + (wave * 10) 
      }]);
    }, 2000 - Math.min(1500, wave * 100));

    const gameLoop = setInterval(() => {
      setEnemies(prev => {
        const next = prev.map(e => ({ ...e, progress: e.progress + 0.5 }));
        
        // Damage Hub
        const reached = next.filter(e => e.progress >= 100);
        if (reached.length > 0) {
          setHealth(h => Math.max(0, h - reached.length));
        }

        return next.filter(e => e.progress < 100 && e.hp > 0);
      });

      // Towers Attack
      setEnemies(prev => {
        return prev.map(enemy => {
          let damage = 0;
          towers.forEach(t => {
            // Check distance simplified
            const enemyX = enemy.progress; // Simplified path
            const enemyY = 50; 
            const dist = Math.sqrt(Math.pow(t.x - enemyX, 2) + Math.pow(t.y - enemyY, 2));
            if (dist < 20) damage += 1;
          });
          if (damage > 0) {
            if (enemy.hp - damage <= 0) setMoney(m => m + 20);
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
    if (money < 150) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    
    // Only place near path but not ON path
    if (Math.abs(y - 50) < 10) return;

    setTowers(prev => [...prev, { id: Date.now(), x, y, type: 'laser' }]);
    setMoney(m => m - 150);
  };

  return (
    <div className="flex flex-col items-center gap-8 p-12 glass-card rounded-[4rem] border-4 border-primary/30 shadow-2xl bg-background/90 max-w-4xl w-full text-foreground relative">
      <div className="flex justify-between w-full items-center z-10">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shadow-lg"><Shield className="w-6 h-6 text-white" /></div>
          <h2 className="text-3xl font-black italic uppercase tracking-tighter">Neural_Defense</h2>
        </div>
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-3 bg-secondary/50 px-6 py-2 rounded-xl border border-white/5 shadow-xl">
            <Coins className="w-5 h-5 text-amber-500" />
            <span className="text-xl font-black italic">{money}</span>
          </div>
          <div className="flex items-center gap-3 bg-rose-500/10 px-6 py-2 rounded-xl border border-rose-500/20 shadow-xl">
            <Heart className="w-5 h-5 text-rose-500 fill-rose-500" />
            <span className="text-xl font-black text-rose-500 italic">{health}</span>
          </div>
          <Button size="icon" variant="ghost" onClick={onExit} className="rounded-full h-12 w-12"><X className="w-8 h-8" /></Button>
        </div>
      </div>

      <div 
        onClick={placeTower}
        className="relative w-full h-[400px] bg-zinc-950 rounded-[3rem] border-4 border-white/10 overflow-hidden cursor-crosshair group"
      >
        <div className="absolute inset-0 arcade-grid opacity-10 pointer-events-none" />
        
        {/* Path Rendering */}
        <div className="absolute top-1/2 left-0 w-full h-20 -translate-y-1/2 bg-white/5 border-y border-white/10 flex items-center justify-between px-10">
           <div className="text-[10px] font-black uppercase text-white/10 tracking-[1em]">DATA_PATH</div>
           <div className="w-20 h-20 rounded-full bg-primary/10 border-2 border-primary/20 animate-pulse flex items-center justify-center">
              <Zap className="w-10 h-10 text-primary opacity-20" />
           </div>
        </div>

        {/* Towers */}
        {towers.map(t => (
          <div 
            key={t.id} 
            className="absolute animate-in zoom-in-95"
            style={{ left: `${t.x}%`, top: `${t.y}%`, transform: 'translate(-50%, -50%)' }}
          >
            <div className="relative">
              <div className="absolute -inset-4 bg-primary/20 rounded-full animate-pulse" />
              <div className="w-10 h-10 bg-primary rounded-xl border-2 border-white/40 flex items-center justify-center shadow-lg">
                <Crosshair className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
        ))}

        {/* Enemies */}
        {enemies.map(e => (
          <div 
            key={e.id}
            className="absolute transition-all duration-75"
            style={{ left: `${e.progress}%`, top: '50%', transform: 'translate(-50%, -50%)' }}
          >
            <div className="space-y-1 flex flex-col items-center">
              <div className="w-8 h-1 bg-white/10 rounded-full overflow-hidden">
                <div className="h-full bg-rose-500" style={{ width: `${(e.hp / (50 + wave * 10)) * 100}%` }} />
              </div>
              <div className="w-8 h-8 bg-zinc-800 rounded-lg border-2 border-rose-500/40 flex items-center justify-center animate-bounce">
                <Sword className="w-4 h-4 text-rose-500" />
              </div>
            </div>
          </div>
        ))}

        {/* Floating UI Helper */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
           <Badge className="bg-primary/20 text-primary border-none text-[8px] font-black uppercase px-6 py-2">Click to Place Tower (Cost: 150)</Badge>
        </div>
      </div>

      <div className="flex justify-between w-full items-center">
        <p className="text-[10px] font-black uppercase tracking-[0.4em] opacity-40 italic">Wave: {wave} // Sector Integrity Active</p>
        <Button onClick={() => setWave(w => w + 1)} className="bg-primary h-14 rounded-2xl px-10 font-black uppercase tracking-widest shadow-xl">Start Wave {wave + 1}</Button>
      </div>

      {gameOver && (
        <div className="absolute inset-0 bg-black/95 backdrop-blur-md flex flex-col items-center justify-center text-center p-8 z-20 rounded-[4rem]">
          <Trophy className="w-24 h-24 text-amber-400 mb-6 animate-bounce" />
          <h3 className="text-6xl font-black text-white uppercase italic">Sector Breach!</h3>
          <p className="text-muted-foreground font-bold mt-4 uppercase">You survived {wave} neural waves.</p>
          <Button onClick={onExit} className="mt-10 bg-primary h-16 px-12 rounded-[2rem] font-black text-white shadow-2xl">Return to Hub</Button>
        </div>
      )}
    </div>
  );
}
