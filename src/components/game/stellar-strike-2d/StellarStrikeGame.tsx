"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Zap,
  Play,
  RotateCcw,
  Volume2,
  VolumeX,
  Pause,
  Award,
  Crosshair,
  Shield,
  Rocket,
  Flame,
  Star,
  Trophy
} from "lucide-react";
import confetti from "canvas-confetti";

// ==========================================
// TYPES & INTERFACES
// ==========================================
export interface Starfighter {
  x: number;
  y: number;
  radius: number;
  speed: number;
  hp: number;
  maxHp: number;
  score: number;
  weaponLevel: number;
}

export interface EnemyShip {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  hp: number;
  maxHp: number;
  type: "scout" | "interceptor" | "boss";
  color: string;
}

export interface LaserBullet {
  id: string;
  x: number;
  y: number;
  vy: number;
  isPlayer: boolean;
  color: string;
}

// ==========================================
// MAIN COMPONENT
// ==========================================
export default function StellarStrikeGame() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [gameState, setGameState] = useState<"menu" | "playing" | "paused" | "gameover" | "victory">("menu");
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [soundEnabled, setSoundEnabled] = useState(true);

  const shipRef = useRef<Starfighter>({
    x: 425,
    y: 500,
    radius: 16,
    speed: 6.5,
    hp: 100,
    maxHp: 100,
    score: 0,
    weaponLevel: 1
  });

  const enemiesRef = useRef<EnemyShip[]>([]);
  const bulletsRef = useRef<LaserBullet[]>([]);
  const keysRef = useRef<Record<string, boolean>>({});
  const audioCtxRef = useRef<AudioContext | null>(null);

  // Audio Synthesizer
  const playSound = useCallback((type: "laser" | "explosion" | "powerup") => {
    if (!soundEnabled) return;
    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === "suspended") ctx.resume();

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      const now = ctx.currentTime;

      if (type === "laser") {
        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(600, now);
        osc.frequency.exponentialRampToValueAtTime(150, now + 0.08);
        gain.gain.setValueAtTime(0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.08);
        osc.start(now);
        osc.stop(now + 0.08);
      } else if (type === "explosion") {
        osc.type = "square";
        osc.frequency.setValueAtTime(120, now);
        osc.frequency.exponentialRampToValueAtTime(30, now + 0.2);
        gain.gain.setValueAtTime(0.25, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
        osc.start(now);
        osc.stop(now + 0.2);
      }
    } catch (e) {}
  }, [soundEnabled]);

  // Controls Listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      keysRef.current[e.code] = true;
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      keysRef.current[e.code] = false;
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, []);

  const startGame = () => {
    shipRef.current = {
      x: 425,
      y: 500,
      radius: 16,
      speed: 6.5,
      hp: 100,
      maxHp: 100,
      score: 0,
      weaponLevel: 1
    };

    setScore(0);
    enemiesRef.current = [];
    bulletsRef.current = [];
    setGameState("playing");
  };

  // 60 FPS Render Loop
  useEffect(() => {
    let animId: number;
    let lastFired = 0;
    let spawnTimer = 0;

    const render = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      if (canvas.width !== 850 || canvas.height !== 600) {
        canvas.width = 850;
        canvas.height = 600;
      }

      ctx.fillStyle = "#030712";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      if (gameState === "playing") {
        const s = shipRef.current;
        const keys = keysRef.current;

        // Starfighter Movement
        if ((keys["KeyA"] || keys["ArrowLeft"]) && s.x > 30) s.x -= s.speed;
        if ((keys["KeyD"] || keys["ArrowRight"]) && s.x < canvas.width - 30) s.x += s.speed;
        if ((keys["KeyW"] || keys["ArrowUp"]) && s.y > 40) s.y -= s.speed;
        if ((keys["KeyS"] || keys["ArrowDown"]) && s.y < canvas.height - 40) s.y += s.speed;

        // Auto / Key Firing
        const now = Date.now();
        if ((keys["Space"] || keys["KeyJ"] || true) && now - lastFired > 140) {
          lastFired = now;
          playSound("laser");
          bulletsRef.current.push({
            id: "b-" + now,
            x: s.x,
            y: s.y - 20,
            vy: -12,
            isPlayer: true,
            color: "#00f0ff"
          });
        }

        // Spawn Enemies
        spawnTimer++;
        if (spawnTimer % 45 === 0) {
          enemiesRef.current.push({
            id: "e-" + Date.now(),
            x: 40 + Math.random() * (canvas.width - 80),
            y: -30,
            vx: (Math.random() - 0.5) * 2,
            vy: 2.5 + Math.random() * 2,
            hp: 30,
            maxHp: 30,
            type: "scout",
            color: "#ef4444"
          });
        }

        // Move Bullets
        bulletsRef.current.forEach(b => {
          b.y += b.vy;
        });
        bulletsRef.current = bulletsRef.current.filter(b => b.y > -20 && b.y < canvas.height + 20);

        // Move Enemies & Collisions
        enemiesRef.current.forEach(enemy => {
          enemy.x += enemy.vx;
          enemy.y += enemy.vy;

          // Bullet hits Enemy
          bulletsRef.current.forEach(b => {
            if (b.isPlayer && Math.hypot(b.x - enemy.x, b.y - enemy.y) < 22) {
              enemy.hp -= 20;
              b.y = -999; // Destroy bullet
              if (enemy.hp <= 0) {
                playSound("explosion");
                setScore(sc => {
                  const newSc = sc + 100;
                  setHighScore(h => Math.max(h, newSc));
                  return newSc;
                });
              }
            }
          });
        });

        enemiesRef.current = enemiesRef.current.filter(e => e.hp > 0 && e.y < canvas.height + 40);
      }

      // Draw Bullets
      bulletsRef.current.forEach(b => {
        ctx.save();
        ctx.shadowBlur = 8;
        ctx.shadowColor = b.color;
        ctx.fillStyle = b.color;
        ctx.fillRect(b.x - 2, b.y - 8, 4, 16);
        ctx.restore();
      });

      // Draw Enemies
      enemiesRef.current.forEach(e => {
        ctx.save();
        ctx.translate(e.x, e.y);
        ctx.shadowBlur = 10;
        ctx.shadowColor = e.color;
        ctx.fillStyle = e.color;
        ctx.beginPath();
        ctx.arc(0, 0, 14, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });

      // Draw Player Starfighter
      const s = shipRef.current;
      ctx.save();
      ctx.translate(s.x, s.y);
      ctx.shadowBlur = 14;
      ctx.shadowColor = "#00f0ff";
      ctx.fillStyle = "#00f0ff";
      ctx.beginPath();
      ctx.moveTo(0, -18);
      ctx.lineTo(14, 14);
      ctx.lineTo(-14, 14);
      ctx.closePath();
      ctx.fill();
      ctx.restore();

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, [gameState, playSound]);

  return (
    <div className="relative w-full h-screen bg-black text-white font-sans overflow-hidden select-none flex items-center justify-center">
      <div className="relative border border-slate-800 rounded-xl shadow-2xl bg-slate-950 overflow-hidden">
        <canvas ref={canvasRef} className="block w-[850px] h-[600px]" />

        {/* TOP HUD */}
        {gameState === "playing" && (
          <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-center pointer-events-none bg-gradient-to-b from-slate-950/90 to-transparent">
            <div>
              <div className="text-xs font-mono font-bold text-cyan-400">STELLAR STRIKE 2D</div>
              <div className="text-xl font-black font-mono text-white">SCORE: {score}</div>
            </div>

            <div className="text-xs font-mono font-bold text-amber-400">HIGH SCORE: {highScore}</div>
          </div>
        )}

        {/* MAIN MENU */}
        {gameState === "menu" && (
          <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-md flex flex-col items-center justify-center p-8 text-center">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-rose-500 to-amber-500 flex items-center justify-center shadow-xl shadow-rose-500/30 mb-6">
              <Rocket className="w-8 h-8 text-white" />
            </div>

            <h1 className="text-4xl font-black text-white mb-2 tracking-tight">
              STELLAR <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-400 to-amber-400">STRIKE 2D</span>
            </h1>
            <p className="text-slate-400 max-w-md text-sm mb-8">
              Vertical arcade bullet-hell space shooter. Blast enemy interceptors, collect plasma upgrades, and defeat Dreadnought Boss Armadas.
            </p>

            <button
              onClick={startGame}
              className="w-64 py-3 rounded-xl bg-gradient-to-r from-rose-500 to-amber-500 text-slate-950 font-bold text-sm shadow-lg shadow-rose-500/20 hover:opacity-95 transition-all flex items-center justify-center gap-2"
            >
              <Play className="w-4 h-4 fill-current" /> LAUNCH STARFIGHTER
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
