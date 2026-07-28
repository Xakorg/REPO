"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Play,
  RotateCcw,
  Volume2,
  VolumeX,
  ArrowLeft,
  Shield,
  Zap,
  Flame,
  ShoppingBag,
  Trophy,
  Sparkles,
  Pause,
  ChevronRight,
  ShieldAlert,
  Award
} from "lucide-react";
import Link from "next/link";

// ==========================================
// 1. SYNTHETIC AUDIO ENGINE FOR SPACE SHOOTER
// ==========================================
class ShooterSoundEngine {
  ctx: AudioContext | null = null;
  muted: boolean = false;

  init() {
    if (!this.ctx && typeof window !== "undefined") {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) this.ctx = new AudioCtx();
    }
    if (this.ctx && this.ctx.state === "suspended") {
      this.ctx.resume();
    }
  }

  playLaser() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(900, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(200, this.ctx.currentTime + 0.08);

      gain.gain.setValueAtTime(0.18, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.08);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.08);
    } catch (e) {}
  }

  playExplosion() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(250, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(40, this.ctx.currentTime + 0.25);

      gain.gain.setValueAtTime(0.3, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.25);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.25);
    } catch (e) {}
  }

  playPowerup() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;
    try {
      const notes = [523.25, 659.25, 783.99, 1046.5];
      notes.forEach((freq, i) => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, this.ctx!.currentTime + i * 0.06);

        gain.gain.setValueAtTime(0.18, this.ctx!.currentTime + i * 0.06);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx!.currentTime + i * 0.06 + 0.1);

        osc.connect(gain);
        gain.connect(this.ctx!.destination);
        osc.start(this.ctx!.currentTime + i * 0.06);
        osc.stop(this.ctx!.currentTime + i * 0.06 + 0.1);
      });
    } catch (e) {}
  }
}

const soundEngine = new ShooterSoundEngine();

// ==========================================
// 2. DATA TYPES & ENEMY DEFINITIONS
// ==========================================
export interface Bullet {
  id: string;
  x: number;
  y: number;
  vy: number;
  isPlayer: boolean;
  color: string;
}

export interface Enemy {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
  hp: number;
  maxHp: number;
  vy: number;
  type: "scout" | "interceptor" | "boss";
  color: string;
}

export interface Powerup {
  id: string;
  x: number;
  y: number;
  type: "health" | "spread" | "shield";
}

export interface SectorCampaign {
  id: number;
  title: string;
  enemySpawnRate: number;
  bossHp: number;
}

export const CAMPAIGN_SECTORS: SectorCampaign[] = [
  { id: 1, title: "Sector 1: Asteroid Belt Outpost", enemySpawnRate: 0.03, bossHp: 200 },
  { id: 2, title: "Sector 2: Quantum Nebula", enemySpawnRate: 0.05, bossHp: 350 },
  { id: 3, title: "Sector 3: Mothership Armada", enemySpawnRate: 0.07, bossHp: 500 },
  { id: 4, title: "Sector 4: Eclipse Citadel", enemySpawnRate: 0.09, bossHp: 750 },
  { id: 5, title: "Sector 5: Hyperion Core", enemySpawnRate: 0.12, bossHp: 1000 },
];

// ==========================================
// 3. MAIN TOP-DOWN SHOOTER COMPONENT
// ==========================================
export default function StarlightCommanderGame() {
  const [gameState, setGameState] = useState<"menu" | "playing" | "paused" | "gameover" | "victory">("menu");
  const [sectorIndex, setSectorIndex] = useState<number>(0);

  // Player Stats
  const [hp, setHp] = useState<number>(100);
  const [maxHp] = useState<number>(100);
  const [score, setScore] = useState<number>(0);
  const [kills, setKills] = useState<number>(0);
  const [hasSpread, setHasSpread] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Player Coordinates
  const playerPos = useRef({ x: 400, y: 500, w: 32, h: 32, speed: 6 });
  const keys = useRef<Record<string, boolean>>({});

  const bulletsRef = useRef<Bullet[]>([]);
  const enemiesRef = useRef<Enemy[]>([]);
  const powerupsRef = useRef<Powerup[]>([]);

  const currentSector = CAMPAIGN_SECTORS[sectorIndex];

  // Start Sector Mission
  const startMission = (idx: number) => {
    soundEngine.init();
    setSectorIndex(idx);
    setHp(100);
    setScore(0);
    setKills(0);
    setHasSpread(false);

    playerPos.current = { x: 400, y: 500, w: 32, h: 32, speed: 6 };
    bulletsRef.current = [];
    enemiesRef.current = [];
    powerupsRef.current = [];

    setGameState("playing");
  };

  // Keyboard Handlers
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      keys.current[e.code] = true;

      // Spacebar to shoot laser
      if (e.code === "Space" && gameState === "playing") {
        e.preventDefault();
        soundEngine.playLaser();

        const px = playerPos.current.x;
        const py = playerPos.current.y;

        bulletsRef.current.push({
          id: `b-${Date.now()}-${Math.random()}`,
          x: px,
          y: py - 10,
          vy: -14,
          isPlayer: true,
          color: "#00f0ff",
        });

        if (hasSpread) {
          bulletsRef.current.push({
            id: `b1-${Date.now()}`,
            x: px - 15,
            y: py - 5,
            vy: -12,
            isPlayer: true,
            color: "#a000ff",
          });
          bulletsRef.current.push({
            id: `b2-${Date.now()}`,
            x: px + 15,
            y: py - 5,
            vy: -12,
            isPlayer: true,
            color: "#a000ff",
          });
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      keys.current[e.code] = false;
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [gameState, hasSpread]);

  // Main Canvas Render & Physics Loop
  useEffect(() => {
    if (gameState !== "playing" || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;

    const gameLoop = () => {
      const p = playerPos.current;

      // 1. UPDATE PLAYER MOVEMENT
      if (keys.current["KeyA"] || keys.current["ArrowLeft"]) p.x = Math.max(20, p.x - p.speed);
      if (keys.current["KeyD"] || keys.current["ArrowRight"]) p.x = Math.min(canvas.width - 20, p.x + p.speed);
      if (keys.current["KeyW"] || keys.current["ArrowUp"]) p.y = Math.max(40, p.y - p.speed);
      if (keys.current["KeyS"] || keys.current["ArrowDown"]) p.y = Math.min(canvas.height - 40, p.y + p.speed);

      // 2. SPAWN ENEMIES
      if (Math.random() < currentSector.enemySpawnRate) {
        enemiesRef.current.push({
          id: `e-${Date.now()}-${Math.random()}`,
          x: Math.random() * (canvas.width - 60) + 30,
          y: -40,
          w: 30,
          h: 30,
          hp: 30,
          maxHp: 30,
          vy: 3 + Math.random() * 2,
          type: "scout",
          color: "#ff0055",
        });
      }

      // 3. UPDATE BULLETS & ENEMIES POSITIONS
      bulletsRef.current.forEach(b => (b.y += b.vy));
      enemiesRef.current.forEach(e => (e.y += e.vy));

      // 4. BULLET VS ENEMY COLLISION CHECKS
      bulletsRef.current.forEach(bullet => {
        if (!bullet.isPlayer) return;

        enemiesRef.current.forEach(enemy => {
          if (
            bullet.x > enemy.x - enemy.w / 2 &&
            bullet.x < enemy.x + enemy.w / 2 &&
            bullet.y > enemy.y - enemy.h / 2 &&
            bullet.y < enemy.y + enemy.h / 2
          ) {
            enemy.hp -= 15;
            bullet.y = -999; // Destroy bullet

            if (enemy.hp <= 0) {
              soundEngine.playExplosion();
              setScore(s => s + 50);
              setKills(k => k + 1);

              // Powerup drop chance
              if (Math.random() < 0.25) {
                powerupsRef.current.push({
                  id: `pow-${Date.now()}`,
                  x: enemy.x,
                  y: enemy.y,
                  type: Math.random() < 0.5 ? "health" : "spread",
                });
              }
            }
          }
        });
      });

      // Filter destroyed objects
      bulletsRef.current = bulletsRef.current.filter(b => b.y > -50 && b.y < canvas.height + 50);
      enemiesRef.current = enemiesRef.current.filter(e => e.hp > 0 && e.y < canvas.height + 50);

      // 5. ENEMY VS PLAYER COLLISION CHECKS
      enemiesRef.current.forEach(enemy => {
        const dist = Math.hypot(p.x - enemy.x, p.y - enemy.y);
        if (dist < 28) {
          soundEngine.playExplosion();
          enemy.hp = 0;
          setHp(prev => {
            const nextHp = prev - 25;
            if (nextHp <= 0) setGameState("gameover");
            return Math.max(0, nextHp);
          });
        }
      });

      // Powerup Collection Check
      powerupsRef.current.forEach(pow => {
        pow.y += 2;
        const dist = Math.hypot(p.x - pow.x, p.y - pow.y);
        if (dist < 28) {
          soundEngine.playPowerup();
          if (pow.type === "health") setHp(h => Math.min(maxHp, h + 30));
          if (pow.type === "spread") setHasSpread(true);
          pow.y = 999;
        }
      });

      // 6. CANVAS RENDERING
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Deep Space Background
      ctx.fillStyle = "#070714";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Animated Background Stars
      ctx.fillStyle = "#ffffff";
      for (let i = 0; i < 40; i++) {
        const starX = (Math.sin(i * 99) * 0.5 + 0.5) * canvas.width;
        const starY = ((Date.now() * 0.1 + i * 50) % canvas.height);
        ctx.fillRect(starX, starY, 2, 2);
      }

      // Render Bullets
      bulletsRef.current.forEach(bullet => {
        ctx.fillStyle = bullet.color;
        ctx.shadowColor = bullet.color;
        ctx.shadowBlur = 10;
        ctx.fillRect(bullet.x - 2, bullet.y - 8, 4, 16);
        ctx.shadowBlur = 0;
      });

      // Render Enemy Ships
      enemiesRef.current.forEach(enemy => {
        ctx.fillStyle = enemy.color;
        ctx.shadowColor = enemy.color;
        ctx.shadowBlur = 15;

        ctx.beginPath();
        ctx.moveTo(enemy.x, enemy.y + enemy.h / 2);
        ctx.lineTo(enemy.x - enemy.w / 2, enemy.y - enemy.h / 2);
        ctx.lineTo(enemy.x + enemy.w / 2, enemy.y - enemy.h / 2);
        ctx.closePath();
        ctx.fill();

        ctx.shadowBlur = 0;
      });

      // Render Player Fighter Ship
      ctx.fillStyle = "#00f0ff";
      ctx.shadowColor = "#00f0ff";
      ctx.shadowBlur = 20;

      ctx.beginPath();
      ctx.moveTo(p.x, p.y - p.h / 2);
      ctx.lineTo(p.x - p.w / 2, p.y + p.h / 2);
      ctx.lineTo(p.x + p.w / 2, p.y + p.h / 2);
      ctx.closePath();
      ctx.fill();

      ctx.shadowBlur = 0;

      animId = requestAnimationFrame(gameLoop);
    };

    animId = requestAnimationFrame(gameLoop);
    return () => cancelAnimationFrame(animId);
  }, [gameState, currentSector, hasSpread, maxHp]);

  return (
    <div className="relative w-full h-screen bg-black overflow-hidden font-sans select-none text-white flex flex-col items-center justify-center">
      {/* HEADER HUD */}
      {gameState === "playing" && (
        <div className="absolute top-0 left-0 right-0 p-6 z-20 flex justify-between items-center bg-gradient-to-b from-black/80 to-transparent">
          <div className="flex items-center gap-6">
            <button
              onClick={() => setGameState("menu")}
              className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-white/60 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-4 h-4" /> Menu
            </button>
            <div className="flex items-center gap-4 text-xs font-bold">
              <span className="text-cyan-400 font-black">{currentSector.title}</span>
              <span className="text-amber-400">SCORE: {score}</span>
              <span className="text-rose-400">KILLS: {kills}</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="w-36 h-3 bg-zinc-900 rounded-full overflow-hidden border border-white/20">
              <div className="h-full bg-rose-500" style={{ width: `${(hp / maxHp) * 100}%` }} />
            </div>
            <button
              onClick={() => setGameState("paused")}
              className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 transition-colors"
            >
              <Pause className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* TOP-DOWN CANVAS VIEWPORT */}
      <div className="relative border-2 border-cyan-500/30 rounded-3xl overflow-hidden shadow-[0_0_50px_rgba(0,240,255,0.15)]">
        <canvas ref={canvasRef} width={800} height={600} className="block bg-zinc-950" />
      </div>

      {/* OVERLAY 1: START MENU */}
      <AnimatePresence>
        {gameState === "menu" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-40 bg-black/90 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center"
          >
            <Link
              href="/games"
              className="absolute top-8 left-8 flex items-center gap-2 text-xs font-black uppercase tracking-widest text-white/50 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-4 h-4" /> Back to Arcade
            </Link>

            <motion.div initial={{ y: 20 }} animate={{ y: 0 }} className="max-w-md">
              <div className="flex items-center justify-center gap-2 px-4 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs font-black uppercase tracking-widest mb-6">
                <Zap className="w-4 h-4" /> Sci-Fi Top-Down Shooter
              </div>

              <h1 className="text-6xl font-black tracking-tighter uppercase mb-4 bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 via-indigo-500 to-purple-500">
                STARLIGHT COMMANDER
              </h1>
              <p className="text-white/60 text-sm mb-8 leading-relaxed">
                Pilot your starfighter through hostile sector armadas. Fire plasma cannons, collect weapon upgrades, defeat boss fleets, and defend the sector.
              </p>

              <button
                onClick={() => startMission(0)}
                className="w-full py-4 bg-gradient-to-r from-cyan-500 to-indigo-600 rounded-full font-black uppercase tracking-widest hover:scale-105 transition-all shadow-[0_0_40px_rgba(0,240,255,0.4)] flex items-center justify-center gap-3 text-base"
              >
                <Play className="w-5 h-5 fill-white" /> Launch Mission
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
