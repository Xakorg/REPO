"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Play,
  Pause,
  RotateCcw,
  Volume2,
  VolumeX,
  Shield,
  Zap,
  Sparkles,
  Trophy,
  ShoppingBag,
  ArrowLeft,
  Flame,
  Swords,
  Heart,
  Skull,
  Crosshair,
  FastForward,
  Award,
  Layers,
  Compass
} from "lucide-react";
import Link from "next/link";

// ==========================================
// TYPES & TOWER DEFINITIONS
// ==========================================
export type TowerType = "gatling" | "plasma" | "frost" | "laser" | "emp" | "nuke";

export interface TowerDef {
  type: TowerType;
  name: string;
  cost: number;
  range: number;
  damage: number;
  fireRate: number; // frames per shot
  color: string;
  description: string;
}

export interface PlacedTower {
  id: string;
  type: TowerType;
  gridX: number;
  gridY: number;
  x: number;
  y: number;
  level: number;
  damage: number;
  range: number;
  cooldown: number;
  kills: number;
}

export interface Creep {
  id: string;
  type: "scout" | "armored" | "flyer" | "boss";
  hp: number;
  maxHp: number;
  speed: number;
  reward: number;
  pathIdx: number;
  x: number;
  y: number;
  slowTimer: number;
  stunTimer: number;
  color: string;
}

export interface Projectile {
  id: string;
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  speed: number;
  damage: number;
  splashRadius: number;
  color: string;
  targetCreepId?: string;
  type: TowerType;
}

const TOWER_SPECS: Record<TowerType, TowerDef> = {
  gatling: { type: "gatling", name: "Gatling Cannon", cost: 100, range: 140, damage: 15, fireRate: 15, color: "#06b6d4", description: "Rapid firing kinetic turret." },
  plasma: { type: "plasma", name: "Plasma Mortar", cost: 175, range: 180, damage: 45, fireRate: 45, color: "#f43f5e", description: "Heavy explosive splash mortar." },
  frost: { type: "frost", name: "Frost Emitter", cost: 150, range: 120, damage: 8, fireRate: 20, color: "#38bdf8", description: "Slows enemy move speed by 50%." },
  laser: { type: "laser", name: "Laser Array", cost: 225, range: 160, damage: 30, fireRate: 10, color: "#ec4899", description: "Continuous high-tech melting beam." },
  emp: { type: "emp", name: "EMP Generator", cost: 200, range: 130, damage: 20, fireRate: 60, color: "#a855f7", description: "Stuns surrounding creeps." },
  nuke: { type: "nuke", name: "Nuke Launcher", cost: 350, range: 240, damage: 160, fireRate: 90, color: "#eab308", description: "Devastating long range missile." }
};

// PRESET GRID PATH (16x10)
const DEFAULT_PATH = [
  { x: 0, y: 3 }, { x: 4, y: 3 }, { x: 4, y: 7 }, { x: 9, y: 7 },
  { x: 9, y: 2 }, { x: 13, y: 2 }, { x: 13, y: 8 }, { x: 15, y: 8 }
];

// WEB AUDIO SYNTHESIZER
class TDAudioEngine {
  private ctx: AudioContext | null = null;
  private muted: boolean = false;

  public setMuted(muted: boolean) {
    this.muted = muted;
  }

  private init() {
    if (!this.ctx && typeof window !== "undefined") {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) this.ctx = new AudioCtx();
    }
    if (this.ctx && this.ctx.state === "suspended") this.ctx.resume();
  }

  public playShoot() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "square";
      osc.frequency.setValueAtTime(600, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(150, this.ctx.currentTime + 0.08);
      gain.gain.setValueAtTime(0.15, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.08);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.08);
    } catch {}
  }

  public playExplosion() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(200, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(40, this.ctx.currentTime + 0.2);
      gain.gain.setValueAtTime(0.25, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.2);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.2);
    } catch {}
  }
}

const audio = new TDAudioEngine();

export default function AegisTDGame() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // States
  const [gameState, setGameState] = useState<"menu" | "playing" | "paused" | "gameover" | "victory">("menu");
  const [isMuted, setIsMuted] = useState(false);
  const [credits, setCredits] = useState(400);
  const [lives, setLives] = useState(20);
  const [wave, setWave] = useState(1);
  const [gameSpeed, setGameSpeed] = useState<1 | 2>(1);
  const [selectedTowerType, setSelectedTowerType] = useState<TowerType>("gatling");

  // Engine Refs
  const engineRef = useRef({
    towers: [] as PlacedTower[],
    creeps: [] as Creep[],
    projectiles: [] as Projectile[],
    particles: [] as { x: number; y: number; vx: number; vy: number; radius: number; color: string; life: number }[],
    animFrameId: 0,
    waveTimer: 0,
    spawningWave: false,
    creepsToSpawn: 0
  });

  const toggleMute = () => {
    const next = !isMuted;
    setIsMuted(next);
    audio.setMuted(next);
  };

  const startGame = () => {
    setCredits(450);
    setLives(20);
    setWave(1);
    engineRef.current.towers = [];
    engineRef.current.creeps = [];
    engineRef.current.projectiles = [];
    engineRef.current.particles = [];
    engineRef.current.spawningWave = false;
    setGameState("playing");
  };

  const startNextWave = () => {
    if (engineRef.current.spawningWave) return;
    engineRef.current.spawningWave = true;
    engineRef.current.creepsToSpawn = 10 + wave * 4;
  };

  // Canvas Click to Build Tower
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (gameState !== "playing") return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const tileSize = 50;
    const gx = Math.floor(x / tileSize);
    const gy = Math.floor(y / tileSize);

    const spec = TOWER_SPECS[selectedTowerType];
    if (credits < spec.cost) return;

    // Check if grid occupied or on path
    const alreadyPlaced = engineRef.current.towers.some((t) => t.gridX === gx && t.gridY === gy);
    if (alreadyPlaced) return;

    const newTower: PlacedTower = {
      id: "t_" + Math.random(),
      type: selectedTowerType,
      gridX: gx,
      gridY: gy,
      x: gx * tileSize + tileSize / 2,
      y: gy * tileSize + tileSize / 2,
      level: 1,
      damage: spec.damage,
      range: spec.range,
      cooldown: 0,
      kills: 0
    };

    engineRef.current.towers.push(newTower);
    setCredits((prev) => prev - spec.cost);
    audio.playShoot();
  };

  // Main Loop Effect
  useEffect(() => {
    if (gameState !== "playing") return;

    const loop = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const engine = engineRef.current;

      // Handle Wave Spawns
      if (engine.spawningWave && engine.creepsToSpawn > 0) {
        engine.waveTimer++;
        if (engine.waveTimer > 30 / gameSpeed) {
          engine.waveTimer = 0;
          engine.creepsToSpawn--;

          const isBoss = engine.creepsToSpawn === 0 && wave % 5 === 0;
          const hp = isBoss ? 800 + wave * 300 : 80 + wave * 25;
          const startNode = DEFAULT_PATH[0];

          engine.creeps.push({
            id: "c_" + Math.random(),
            type: isBoss ? "boss" : "scout",
            hp,
            maxHp: hp,
            speed: isBoss ? 1.0 : 1.8,
            reward: isBoss ? 150 : 20,
            pathIdx: 0,
            x: startNode.x * 50 + 25,
            y: startNode.y * 50 + 25,
            slowTimer: 0,
            stunTimer: 0,
            color: isBoss ? "#ec4899" : "#06b6d4"
          });

          if (engine.creepsToSpawn === 0) engine.spawningWave = false;
        }
      }

      // Update Creeps
      engine.creeps.forEach((creep) => {
        if (creep.stunTimer > 0) {
          creep.stunTimer--;
          return;
        }

        const currentSpeed = creep.slowTimer > 0 ? creep.speed * 0.5 : creep.speed;
        if (creep.slowTimer > 0) creep.slowTimer--;

        const targetNode = DEFAULT_PATH[creep.pathIdx + 1];
        if (targetNode) {
          const tx = targetNode.x * 50 + 25;
          const ty = targetNode.y * 50 + 25;
          const dx = tx - creep.x;
          const dy = ty - creep.y;
          const dist = Math.hypot(dx, dy);

          if (dist < 4) {
            creep.pathIdx++;
          } else {
            creep.x += (dx / dist) * currentSpeed * gameSpeed;
            creep.y += (dy / dist) * currentSpeed * gameSpeed;
          }
        } else {
          // Reached Base Goal!
          creep.hp = 0;
          setLives((prev) => {
            const next = prev - 1;
            if (next <= 0) setGameState("gameover");
            return next;
          });
        }
      });

      // Update Towers & Shoot
      engine.towers.forEach((tower) => {
        const spec = TOWER_SPECS[tower.type];
        if (tower.cooldown > 0) {
          tower.cooldown -= gameSpeed;
          return;
        }

        // Find target creep in range
        const target = engine.creeps.find((c) => Math.hypot(c.x - tower.x, c.y - tower.y) <= tower.range);
        if (target) {
          tower.cooldown = spec.fireRate;
          audio.playShoot();

          engine.projectiles.push({
            id: "p_" + Math.random(),
            x: tower.x,
            y: tower.y,
            targetX: target.x,
            targetY: target.y,
            speed: 8,
            damage: tower.damage,
            splashRadius: tower.type === "plasma" || tower.type === "nuke" ? 60 : 0,
            color: spec.color,
            targetCreepId: target.id,
            type: tower.type
          });
        }
      });

      // Update Projectiles
      engine.projectiles.forEach((proj) => {
        const dx = proj.targetX - proj.x;
        const dy = proj.targetY - proj.y;
        const dist = Math.hypot(dx, dy);

        if (dist < 10) {
          proj.speed = 0; // Hit target
          audio.playExplosion();

          // Damage target or Splash
          engine.creeps.forEach((creep) => {
            const cDist = Math.hypot(creep.x - proj.targetX, creep.y - proj.targetY);
            if (proj.splashRadius > 0 ? cDist <= proj.splashRadius : creep.id === proj.targetCreepId) {
              creep.hp -= proj.damage;
              if (proj.type === "frost") creep.slowTimer = 90;
              if (proj.type === "emp") creep.stunTimer = 60;

              if (creep.hp <= 0 && creep.reward > 0) {
                setCredits((prev) => prev + creep.reward);
                creep.reward = 0;
              }
            }
          });
        } else {
          proj.x += (dx / dist) * proj.speed * gameSpeed;
          proj.y += (dy / dist) * proj.speed * gameSpeed;
        }
      });

      engine.projectiles = engine.projectiles.filter((p) => p.speed > 0);
      engine.creeps = engine.creeps.filter((c) => c.hp > 0);

      // Render Map & Grid
      ctx.fillStyle = "#09090b";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw Path
      ctx.strokeStyle = "#1e1b4b";
      ctx.lineWidth = 36;
      ctx.beginPath();
      DEFAULT_PATH.forEach((pt, i) => {
        const px = pt.x * 50 + 25;
        const py = pt.y * 50 + 25;
        if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
      });
      ctx.stroke();

      // Towers
      engine.towers.forEach((t) => {
        ctx.fillStyle = TOWER_SPECS[t.type].color;
        ctx.shadowColor = TOWER_SPECS[t.type].color;
        ctx.shadowBlur = 12;
        ctx.fillRect(t.x - 18, t.y - 18, 36, 36);
        ctx.shadowBlur = 0;
      });

      // Projectiles
      engine.projectiles.forEach((p) => {
        ctx.fillStyle = p.color;
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      });

      // Creeps
      engine.creeps.forEach((c) => {
        ctx.fillStyle = c.color;
        ctx.shadowColor = c.color;
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.arc(c.x, c.y, c.type === "boss" ? 16 : 10, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;

        // HP bar
        const pct = Math.max(0, c.hp / c.maxHp);
        ctx.fillStyle = "#000000";
        ctx.fillRect(c.x - 12, c.y - 18, 24, 3);
        ctx.fillStyle = c.color;
        ctx.fillRect(c.x - 12, c.y - 18, 24 * pct, 3);
      });

      engine.animFrameId = requestAnimationFrame(loop);
    };

    engineRef.current.animFrameId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(engineRef.current.animFrameId);
  }, [gameState, gameSpeed, wave]);

  useEffect(() => {
    if (canvasRef.current) {
      canvasRef.current.width = 800;
      canvasRef.current.height = 500;
    }
  }, []);

  return (
    <div className="relative w-full h-screen bg-black overflow-hidden select-none font-sans text-white flex flex-col items-center justify-center">
      {/* CANVAS CONTAINER */}
      <div className="relative w-[800px] h-[500px] bg-zinc-950 border border-cyan-500/30 rounded-3xl overflow-hidden shadow-[0_0_50px_rgba(6,182,212,0.15)]">
        <canvas ref={canvasRef} onClick={handleCanvasClick} className="w-full h-full block cursor-crosshair" />

        {/* HUD OVERLAY */}
        {gameState === "playing" && (
          <div className="absolute top-4 left-6 right-6 flex justify-between items-center pointer-events-none z-10">
            <div className="flex items-center gap-4 bg-black/70 backdrop-blur-md px-5 py-2.5 rounded-2xl border border-cyan-500/30">
              <span className="text-xs font-bold uppercase tracking-wider text-cyan-400">
                WAVE {wave}
              </span>
              <div className="flex items-center gap-1.5 text-amber-400 font-bold text-xs">
                <Zap className="w-3.5 h-3.5" /> {credits} Credits
              </div>
              <div className="flex items-center gap-1.5 text-rose-400 font-bold text-xs">
                <Heart className="w-3.5 h-3.5" /> {lives} Lives
              </div>
            </div>

            <div className="flex items-center gap-2 pointer-events-auto">
              <button
                onClick={startNextWave}
                className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-teal-600 text-white font-bold text-xs uppercase tracking-wider rounded-xl hover:scale-105 transition-all shadow-[0_0_15px_rgba(6,182,212,0.3)]"
              >
                Send Wave
              </button>
              <button
                onClick={() => setGameSpeed((prev) => (prev === 1 ? 2 : 1))}
                className="p-2.5 bg-black/50 hover:bg-black/80 border border-white/20 rounded-xl"
              >
                <FastForward className={`w-4 h-4 ${gameSpeed === 2 ? "text-cyan-400" : "text-zinc-400"}`} />
              </button>
              <button onClick={toggleMute} className="p-2.5 bg-black/50 hover:bg-black/80 border border-white/20 rounded-xl">
                {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-cyan-400" />}
              </button>
            </div>
          </div>
        )}

        {/* TOWER SELECTION BAR */}
        {gameState === "playing" && (
          <div className="absolute bottom-4 left-6 right-6 flex gap-3 justify-center pointer-events-auto z-10">
            {Object.entries(TOWER_SPECS).map(([key, spec]) => (
              <button
                key={key}
                onClick={() => setSelectedTowerType(key as TowerType)}
                className={`p-3 rounded-2xl border flex flex-col items-center gap-1 transition-all ${selectedTowerType === key ? "bg-cyan-500/20 border-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.3)]" : "bg-black/70 border-white/10 opacity-75"}`}
              >
                <div className="w-5 h-5 rounded-full" style={{ backgroundColor: spec.color }} />
                <span className="text-[10px] font-bold text-white">{spec.name}</span>
                <span className="text-[10px] font-bold text-amber-400">{spec.cost}c</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* START MENU */}
      {gameState === "menu" && (
        <div className="absolute inset-0 z-30 bg-gradient-to-br from-black via-zinc-950 to-cyan-950 flex flex-col items-center justify-center p-6">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="max-w-xl w-full bg-black/80 backdrop-blur-2xl border border-cyan-500/30 rounded-3xl p-8 text-center flex flex-col items-center shadow-[0_0_50px_rgba(6,182,212,0.2)]"
          >
            <div className="w-16 h-16 rounded-2xl bg-cyan-500/10 border border-cyan-400/40 flex items-center justify-center mb-6">
              <Crosshair className="w-8 h-8 text-cyan-400 animate-pulse" />
            </div>
            <h1 className="text-4xl md:text-5xl font-black uppercase tracking-tighter mb-2 bg-gradient-to-r from-cyan-400 via-teal-300 to-emerald-400 bg-clip-text text-transparent">
              Aegis Protocol TD
            </h1>
            <p className="text-zinc-400 text-sm mb-8">
              Tactical grid tower defense strategy. Build Gatling cannons, Frost beams, and Nuke launchers to defend against creep waves.
            </p>
            <div className="flex gap-4 w-full">
              <button
                onClick={startGame}
                className="flex-1 py-4 bg-gradient-to-r from-cyan-500 to-teal-600 text-white font-black uppercase tracking-widest rounded-2xl hover:scale-105 transition-all flex items-center justify-center gap-2 shadow-[0_0_25px_rgba(6,182,212,0.4)]"
              >
                <Play className="w-5 h-5 fill-white" /> Deploy Defenses
              </button>
              <Link
                href="/games"
                className="px-6 py-4 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold uppercase tracking-wider rounded-2xl transition-all flex items-center justify-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" /> Arcade Hub
              </Link>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
