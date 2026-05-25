
"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { 
  X, 
  Target, 
  Trophy, 
  Shield, 
  Zap, 
  Loader2, 
  Wind,
  Box,
  MapPin,
  Flame,
  Activity,
  User,
  Bot,
  Trees as TreeIcon,
  Mountain,
  Crosshair,
  Skull,
  Radar
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useUser, useFirestore } from "@/firebase";
import { Badge } from "@/components/ui/badge";

const MAP_SIZE = 3000;
const VIEWPORT_WIDTH = 800;
const VIEWPORT_HEIGHT = 600;
const BOT_COUNT = 24;
const TICK_RATE = 30;

type WeaponType = 'Pistol' | 'Shotgun' | 'AR' | 'Sniper' | null;
type Rarity = 'Common' | 'Uncommon' | 'Rare' | 'Epic' | 'Legendary';

interface Weapon {
  type: WeaponType;
  rarity: Rarity;
  damage: number;
  fireRate: number;
  color: string;
}

interface Bullet {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  ownerId: string;
  damage: number;
}

interface Entity {
  id: string;
  name: string;
  x: number;
  y: number;
  hp: number;
  maxHp: number;
  weapon: Weapon | null;
  isBot: boolean;
  angle: number;
  alive: boolean;
  kills: number;
}

const RARITIES: Record<Rarity, { color: string, weight: number }> = {
  Common: { color: 'text-zinc-400', weight: 0.5 },
  Uncommon: { color: 'text-emerald-400', weight: 0.3 },
  Rare: { color: 'text-blue-400', weight: 0.15 },
  Epic: { color: 'text-purple-400', weight: 0.04 },
  Legendary: { color: 'text-amber-400', weight: 0.01 },
};

export function XbrGame({ onExit }: { onExit: () => void }) {
  const { user } = useUser();
  const [phase, setPhase] = useState<'jump' | 'combat' | 'finished'>('jump');
  const [player, setPlayer] = useState<Entity>({
    id: user?.uid || 'player',
    name: user?.displayName?.replace(/^@+/, "") || 'Player',
    x: 1500,
    y: 1500,
    hp: 100,
    maxHp: 100,
    weapon: null,
    isBot: false,
    angle: 0,
    alive: true,
    kills: 0
  });

  const [entities, setEntities] = useState<Entity[]>([]);
  const [bullets, setBullets] = useState<Bullet[]>([]);
  const [boxes, setBoxes] = useState<{ id: number, x: number, y: number, looted: boolean }[]>([]);
  const [terrain, setTerrain] = useState<{ id: number, x: number, y: number, type: 'tree' | 'rock' }[]>([]);
  const [carrierPos, setCarrierPos] = useState({ x: 0, y: 500 });
  const [viewport, setViewport] = useState({ x: 0, y: 0 });
  const [stormSize, setStormSize] = useState(MAP_SIZE);
  const [killFeed, setKillFeed] = useState<{ id: string, msg: string }[]>([]);
  const [lastShotTime, setLastShotTime] = useState(0);

  const gameRef = useRef<HTMLDivElement>(null);

  // Initialize Match
  useEffect(() => {
    const initialEntities = Array.from({ length: BOT_COUNT }).map((_, i) => ({
      id: `bot-${i}`,
      name: `Bot_${Math.floor(Math.random() * 999)}`,
      x: Math.random() * MAP_SIZE,
      y: Math.random() * MAP_SIZE,
      hp: 100,
      maxHp: 100,
      weapon: { type: 'AR', rarity: 'Common', damage: 10, fireRate: 500, color: 'text-zinc-400' },
      isBot: true,
      angle: Math.random() * Math.PI * 2,
      alive: true,
      kills: 0
    }));

    const initialBoxes = Array.from({ length: 80 }).map((_, i) => ({
      id: i,
      x: 200 + Math.random() * (MAP_SIZE - 400),
      y: 200 + Math.random() * (MAP_SIZE - 400),
      looted: false
    }));

    const initialTerrain = Array.from({ length: 150 }).map((_, i) => ({
      id: i,
      x: Math.random() * MAP_SIZE,
      y: Math.random() * MAP_SIZE,
      type: Math.random() > 0.4 ? 'tree' as const : 'rock' as const
    }));

    setEntities(initialEntities);
    setBoxes(initialBoxes);
    setTerrain(initialTerrain);
  }, []);

  // Carrier Path
  useEffect(() => {
    if (phase === 'jump') {
      const interval = setInterval(() => {
        setCarrierPos(prev => {
          if (prev.x > MAP_SIZE) return { x: 0, y: (prev.y + 800) % MAP_SIZE };
          return { ...prev, x: prev.x + 20 };
        });
      }, 30);
      return () => clearInterval(interval);
    }
  }, [phase]);

  // Viewport Lock
  useEffect(() => {
    setViewport({
      x: Math.max(0, Math.min(MAP_SIZE - VIEWPORT_WIDTH, player.x - VIEWPORT_WIDTH / 2)),
      y: Math.max(0, Math.min(MAP_SIZE - VIEWPORT_HEIGHT, player.y - VIEWPORT_HEIGHT / 2))
    });
  }, [player.x, player.y]);

  const addKillFeed = (msg: string) => {
    const id = Math.random().toString();
    setKillFeed(prev => [{ id, msg }, ...prev].slice(0, 5));
    setTimeout(() => {
      setKillFeed(prev => prev.filter(k => k.id !== id));
    }, 4000);
  };

  const handleShoot = (targetX: number, targetY: number) => {
    if (!player.alive || phase !== 'combat' || !player.weapon) return;
    
    const now = Date.now();
    if (now - lastShotTime < (player.weapon.fireRate || 200)) return;
    setLastShotTime(now);

    const angle = Math.atan2(targetY - (player.y - viewport.y), targetX - (player.x - viewport.x));
    const speed = 15;
    
    const newBullet: Bullet = {
      id: Math.random().toString(),
      x: player.x,
      y: player.y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      ownerId: player.id,
      damage: player.weapon.damage
    };

    setBullets(prev => [...prev, newBullet]);
  };

  // Main Loop
  useEffect(() => {
    if (phase !== 'combat' || !player.alive) return;

    const interval = setInterval(() => {
      setStormSize(s => Math.max(100, s - 1));

      // Storm Damage
      const distFromCenter = Math.sqrt(Math.pow(player.x - MAP_SIZE/2, 2) + Math.pow(player.y - MAP_SIZE/2, 2));
      if (distFromCenter > stormSize / 2) {
        setPlayer(p => {
          const nextHp = Math.max(0, p.hp - 0.5);
          if (nextHp <= 0 && p.alive) {
            addKillFeed("The Storm eliminated " + p.name);
            return { ...p, hp: 0, alive: false };
          }
          return { ...p, hp: nextHp };
        });
      }

      // Update Bullets
      setBullets(prev => {
        const next = prev.map(b => ({ ...b, x: b.x + b.vx, y: b.y + b.vy }));
        return next.filter(b => b.x > 0 && b.x < MAP_SIZE && b.y > 0 && b.y < MAP_SIZE);
      });

      // Bot Logic & Collisions
      setEntities(prev => {
        let next = prev.map(bot => {
          if (!bot.alive) return bot;

          // Simple Bot Movement
          let nx = bot.x + Math.cos(bot.angle) * 3;
          let ny = bot.y + Math.sin(bot.angle) * 3;
          
          if (nx < 0 || nx > MAP_SIZE || ny < 0 || ny > MAP_SIZE) {
            return { ...bot, angle: bot.angle + Math.PI };
          }

          // Random turn
          let nAngle = bot.angle;
          if (Math.random() < 0.02) nAngle = Math.random() * Math.PI * 2;

          // Check Bullet Collision on Bot
          let currentHp = bot.hp;
          bullets.forEach(bullet => {
            if (bullet.ownerId !== bot.id) {
              const dist = Math.sqrt(Math.pow(bullet.x - bot.x, 2) + Math.pow(bullet.y - bot.y, 2));
              if (dist < 20) {
                currentHp -= bullet.damage;
                if (currentHp <= 0 && bot.alive) {
                  const killer = bullet.ownerId === player.id ? player : prev.find(e => e.id === bullet.ownerId);
                  addKillFeed(`${killer?.name || 'Someone'} eliminated ${bot.name}`);
                  if (bullet.ownerId === player.id) {
                    setPlayer(p => ({ ...p, kills: p.kills + 1 }));
                  }
                }
              }
            }
          });

          return { ...bot, x: nx, y: ny, angle: nAngle, hp: Math.max(0, currentHp), alive: currentHp > 0 };
        });

        // Player Collision from Bot Bullets (Simulated engage)
        return next;
      });

      // Bullet Collision on Player
      setPlayer(p => {
        let nextHp = p.hp;
        bullets.forEach(bullet => {
          if (bullet.ownerId !== p.id) {
            const dist = Math.sqrt(Math.pow(bullet.x - p.x, 2) + Math.pow(bullet.y - p.y, 2));
            if (dist < 20) {
              nextHp -= bullet.damage;
              if (nextHp <= 0 && p.alive) addKillFeed("Someone eliminated you");
            }
          }
        });
        return { ...p, hp: Math.max(0, nextHp), alive: nextHp > 0 };
      });

    }, TICK_RATE);

    return () => clearInterval(interval);
  }, [phase, player.alive, stormSize, player.x, player.y, bullets]);

  const handleJump = () => {
    setPlayer(p => ({ ...p, x: carrierPos.x, y: carrierPos.y }));
    setPhase('combat');
    addKillFeed("You deployed into the zone");
  };

  const handleLoot = (boxId: number) => {
    setBoxes(prev => prev.map(b => b.id === boxId ? { ...b, looted: true } : b));
    const rand = Math.random();
    let rarity: Rarity = 'Common';
    if (rand < 0.05) rarity = 'Legendary';
    else if (rand < 0.15) rarity = 'Epic';
    else if (rand < 0.35) rarity = 'Rare';
    else if (rand < 0.65) rarity = 'Uncommon';
    
    const types: { type: WeaponType, damage: number, rate: number }[] = [
      { type: 'AR', damage: 15, rate: 300 },
      { type: 'Shotgun', damage: 40, rate: 1000 },
      { type: 'Pistol', damage: 10, rate: 200 },
      { type: 'Sniper', damage: 80, rate: 2000 }
    ];
    const picked = types[Math.floor(Math.random() * types.length)];
    
    setPlayer(p => ({ 
      ...p, 
      weapon: { 
        type: picked.type, 
        rarity, 
        damage: picked.damage + (rarity === 'Legendary' ? 20 : rarity === 'Epic' ? 10 : 0),
        fireRate: picked.rate,
        color: RARITIES[rarity].color 
      } 
    }));
    toast({ title: `${rarity} ${picked.type} found!` });
  };

  const handleInput = (e: React.KeyboardEvent) => {
    if (phase !== 'combat' || !player.alive) return;
    const speed = 15;
    let dx = 0, dy = 0;
    if (e.key.toLowerCase() === 'w') dy = -speed;
    if (e.key.toLowerCase() === 's') dy = speed;
    if (e.key.toLowerCase() === 'a') dx = -speed;
    if (e.key.toLowerCase() === 'd') dx = speed;

    if (dx === 0 && dy === 0) return;

    const nx = Math.max(0, Math.min(MAP_SIZE, player.x + dx));
    const ny = Math.max(0, Math.min(MAP_SIZE, player.y + dy));
    
    const hitTerrain = terrain.some(t => Math.abs(t.x - nx) < 40 && Math.abs(t.y - ny) < 40);
    if (hitTerrain) return;

    const boxToLoot = boxes.find(b => !b.looted && Math.abs(b.x - nx) < 60 && Math.abs(b.y - ny) < 60);
    if (boxToLoot) handleLoot(boxToLoot.id);

    setPlayer(p => ({ ...p, x: nx, y: ny }));
  };

  return (
    <div 
      className="flex flex-col items-center gap-6 p-4 md:p-8 glass-card rounded-[3rem] border-4 border-primary/30 shadow-2xl bg-background/95 max-w-7xl w-full text-foreground relative overflow-hidden focus:outline-none"
      tabIndex={0}
      onKeyDown={handleInput}
      onMouseDown={(e) => {
        if (gameRef.current) {
          const rect = gameRef.current.getBoundingClientRect();
          handleShoot(e.clientX - rect.left, e.clientY - rect.top);
        }
      }}
    >
      <div className="flex justify-between w-full items-center z-20 px-4">
        <div className="flex items-center gap-6">
          <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center shadow-lg"><Zap className="w-7 h-7 text-white" /></div>
          <div><h2 className="text-3xl font-black italic uppercase tracking-tighter">XBR Pro</h2></div>
        </div>

        <div className="flex items-center gap-6 bg-black/60 px-8 py-3 rounded-2xl border border-white/10 shadow-2xl">
           <div className="text-center border-r border-white/10 pr-6"><p className="text-[8px] font-black uppercase text-muted-foreground">REMAINING</p><span className="text-xl font-black text-white italic">{entities.filter(e => e.alive).length + (player.alive ? 1 : 0)}</span></div>
           <div className="text-center border-r border-white/10 pr-6"><p className="text-[8px] font-black uppercase text-muted-foreground">ELIMINATIONS</p><span className="text-xl font-black text-rose-500 italic">{player.kills}</span></div>
           <div className="text-center"><p className="text-[8px] font-black uppercase text-muted-foreground">HEALTH</p><span className="text-xl font-black text-green-500 italic">{Math.ceil(player.hp)}%</span></div>
           <Button size="icon" variant="ghost" onClick={onExit} className="ml-4 rounded-full h-10 w-10 text-white hover:bg-rose-500/20"><X className="w-6 h-6" /></Button>
        </div>
      </div>

      <div className="relative w-full h-[650px] bg-zinc-950 rounded-[3.5rem] border-8 border-white/10 overflow-hidden shadow-2xl cursor-crosshair" ref={gameRef}>
        <div className="absolute inset-0 transition-transform duration-100 ease-out" style={{ width: MAP_SIZE, height: MAP_SIZE, transform: `translate(${-viewport.x}px, ${-viewport.y}px)` }}>
          <div className="absolute inset-0 arcade-grid opacity-10 pointer-events-none" />
          
          {/* Storm Circle */}
          <div 
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border-[200px] border-rose-500/10 shadow-[inset_0_0_100px_rgba(244,63,94,0.3)] pointer-events-none z-10" 
            style={{ width: stormSize, height: stormSize }} 
          />

          {/* Terrain */}
          {terrain.map(t => (
            <div key={`terrain-${t.id}`} className="absolute" style={{ left: t.x, top: t.y, transform: 'translate(-50%, -50%)' }}>
               {t.type === 'tree' ? <TreeIcon className="w-24 h-24 text-emerald-900/40" /> : <Mountain className="w-20 h-20 text-slate-800/40" />}
            </div>
          ))}

          {/* Loot Boxes */}
          {boxes.map(b => !b.looted && (
            <div key={`box-${b.id}`} className="absolute w-14 h-14 bg-amber-500/5 border-4 border-amber-500 rounded-2xl flex items-center justify-center shadow-lg animate-pulse" style={{ left: b.x, top: b.y }}>
              <Box className="w-7 h-7 text-amber-500" />
            </div>
          ))}

          {/* Entities (Bots) */}
          {entities.map(bot => bot.alive && (
            <div key={bot.id} className="absolute w-14 h-14 bg-rose-600 rounded-3xl border-4 border-white/20 flex items-center justify-center shadow-2xl z-20" style={{ left: bot.x, top: bot.y, transform: 'translate(-50%, -50%)' }}>
               <Bot className="w-7 h-7 text-white" />
               <div className="absolute -top-6 w-12 h-1 bg-black/40 rounded-full overflow-hidden">
                  <div className="h-full bg-rose-500" style={{ width: `${bot.hp}%` }} />
               </div>
            </div>
          ))}

          {/* Player */}
          {player.alive && (
            <div className="absolute w-20 h-20 flex flex-col items-center z-50 transition-all duration-75" style={{ left: player.x, top: player.y, transform: 'translate(-50%, -50%)' }}>
               <div className="relative">
                  <div className="absolute -inset-6 bg-primary/20 rounded-full animate-pulse" />
                  <div className="w-16 h-16 bg-primary rounded-[2rem] border-4 border-white/40 flex items-center justify-center shadow-[0_0_60px_rgba(var(--primary),0.8)] relative z-10">
                     <User className="w-8 h-8 text-white" />
                  </div>
               </div>
            </div>
          )}

          {/* Bullets */}
          {bullets.map(bullet => (
            <div 
              key={bullet.id}
              className="absolute w-3 h-3 bg-white rounded-full shadow-[0_0_10px_white]"
              style={{ left: bullet.x, top: bullet.y, transform: 'translate(-50%, -50%)' }}
            />
          ))}
        </div>

        {/* Phase Overlays */}
        {phase === 'jump' && (
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm z-[100] flex flex-col items-center justify-center p-12 text-center animate-in fade-in">
             <div className="w-32 h-32 rounded-[2.5rem] bg-white/5 border-4 border-white/10 flex items-center justify-center mb-10 animate-float">
                <Wind className="w-16 h-16 text-primary" />
             </div>
             <h3 className="text-5xl font-black text-white uppercase italic tracking-tighter mb-4">Jump Protocol</h3>
             <p className="text-muted-foreground uppercase text-[10px] tracking-[0.4em] mb-12">Carrier is currently at: {Math.floor(carrierPos.x)}m</p>
             <Button onClick={handleJump} className="h-24 px-20 bg-primary hover:bg-primary/90 text-white rounded-3xl font-black text-2xl uppercase tracking-widest shadow-[0_30px_60px_rgba(var(--primary),0.4)] border-b-[16px] border-primary/20 active:border-b-0 active:translate-y-4 transition-all">DEPLOYY NOW</Button>
          </div>
        )}

        {/* Kill Feed */}
        <div className="absolute top-10 right-10 z-50 space-y-2 pointer-events-none">
           {killFeed.map(k => (
             <div key={k.id} className="bg-black/60 backdrop-blur-md px-6 py-2 rounded-xl border border-white/10 flex items-center gap-3 animate-in slide-in-from-right-4">
                <Skull className="w-3 h-3 text-rose-500" />
                <span className="text-[10px] font-black uppercase italic text-white/90">{k.msg}</span>
             </div>
           ))}
        </div>

        {/* Minimap */}
        <div className="absolute bottom-10 left-10 w-48 h-48 bg-black/80 rounded-3xl border-4 border-white/20 shadow-2xl overflow-hidden pointer-events-none z-[100]">
           <div className="w-full h-full relative">
              <div className="absolute inset-0 arcade-grid opacity-10" />
              <div 
                className="absolute w-2 h-2 bg-primary rounded-full shadow-[0_0_10px_rgba(var(--primary),1)]"
                style={{ left: `${(player.x / MAP_SIZE) * 100}%`, top: `${(player.y / MAP_SIZE) * 100}%` }}
              />
              <div 
                className="absolute border-2 border-rose-500/40 rounded-full"
                style={{ 
                  left: '50%', top: '50%', transform: 'translate(-50%, -50%)',
                  width: `${(stormSize / MAP_SIZE) * 100}%`,
                  height: `${(stormSize / MAP_SIZE) * 100}%`
                }}
              />
           </div>
        </div>
      </div>

      <div className="w-full flex justify-between items-center px-4 md:px-10">
        <div className="flex items-center gap-4 text-muted-foreground">
          <Activity className="w-5 h-5 text-green-500 animate-pulse" />
          <p className="text-[10px] font-black uppercase tracking-[0.4em]">Match Session Active // Sector: Zero</p>
        </div>
        {player.weapon && (
          <div className="flex items-center gap-4">
             <span className="text-[10px] font-black uppercase text-muted-foreground">Inventory</span>
             <Badge className={cn("px-6 py-2 rounded-xl font-black text-[10px] uppercase shadow-lg border-4 bg-black/60", player.weapon.color, "border-current")}>
                {player.weapon.rarity} {player.weapon.type}
             </Badge>
          </div>
        )}
      </div>

      {(!player.alive || (entities.every(e => !e.alive) && player.alive)) && phase === 'combat' && (
        <div className="absolute inset-0 bg-black/95 backdrop-blur-xl flex flex-col items-center justify-center text-center p-12 z-[200] rounded-[4rem] animate-in fade-in duration-500">
          <Trophy className="w-32 h-32 text-amber-400 mb-8 animate-bounce drop-shadow-[0_0_50px_rgba(251,191,36,0.6)]" />
          <h3 className="text-8xl font-black text-white uppercase italic tracking-tighter leading-none mb-4">
            {player.alive ? "VICTORY!" : "ELIMINATED"}
          </h3>
          <div className="flex items-center gap-8 mb-12">
             <div className="text-center"><p className="text-[10px] font-black text-muted-foreground uppercase mb-1">ELIMINATIONS</p><p className="text-4xl font-black text-rose-500 italic">{player.kills}</p></div>
             <div className="h-12 w-px bg-white/10" />
             <div className="text-center"><p className="text-[10px] font-black text-muted-foreground uppercase mb-1">SURVIVED</p><p className="text-4xl font-black text-white italic">{Math.floor((MAP_SIZE - stormSize)/10)}%</p></div>
          </div>
          <div className="flex gap-6">
            <Button onClick={() => window.location.reload()} className="h-20 px-16 bg-primary hover:bg-primary/90 text-white rounded-[2.5rem] font-black uppercase text-xl tracking-widest shadow-2xl border-4 border-white/10 transition-all active:scale-95">RE-SYNC MATCH</Button>
            <button onClick={onExit} className="h-20 px-12 rounded-[2.5rem] border-4 border-white/10 font-black uppercase text-xs text-white hover:bg-white/5 transition-all">HUB EXIT</button>
          </div>
        </div>
      )}
    </div>
  );
}
