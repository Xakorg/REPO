"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Shield,
  Zap,
  Play,
  RotateCcw,
  Volume2,
  VolumeX,
  ArrowLeft,
  Award,
  Crosshair,
  Sparkles,
  Radio,
  Sliders,
  DollarSign
} from "lucide-react";
import Link from "next/link";

// ==========================================
// 1. WEB AUDIO SYNTH SFX ENGINE
// ==========================================
class TDAudioEngine {
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

  playPlace() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(300, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(600, this.ctx.currentTime + 0.1);

    gain.gain.setValueAtTime(0.15, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.1);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.1);
  }

  playShot() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = "square";
    osc.frequency.setValueAtTime(500, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(150, this.ctx.currentTime + 0.08);

    gain.gain.setValueAtTime(0.1, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.08);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.08);
  }

  playExplosion() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(120, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(30, this.ctx.currentTime + 0.25);

    gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.25);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.25);
  }
}

const audio = new TDAudioEngine();

// ==========================================
// 2. DATA STRUCTURES & TURRET TYPES
// ==========================================
export type TurretType = "PLASMA" | "EMP" | "ROCKET";

interface TurretConfig {
  type: TurretType;
  name: string;
  cost: number;
  range: number;
  damage: number;
  fireRate: number; // shots per sec
  color: string;
}

const TURRET_SPECS: { [key in TurretType]: TurretConfig } = {
  PLASMA: { type: "PLASMA", name: "Plasma Cannon", cost: 100, range: 120, damage: 25, fireRate: 1.5, color: "#38bdf8" },
  EMP: { type: "EMP", name: "EMP Stun Tower", cost: 150, range: 100, damage: 10, fireRate: 0.8, color: "#c084fc" },
  ROCKET: { type: "ROCKET", name: "Heavy Rocket", cost: 220, range: 180, damage: 70, fireRate: 0.5, color: "#f43f5e" }
};

interface PlacedTurret {
  id: string;
  x: number;
  y: number;
  type: TurretType;
  level: number;
  lastFired: number;
}

interface EnemyWaveUnit {
  id: string;
  x: number;
  y: number;
  pathIdx: number;
  hp: number;
  maxHp: number;
  speed: number;
  reward: number;
  color: string;
}

const WAYPOINTS = [
  { x: 0, y: 140 },
  { x: 240, y: 140 },
  { x: 240, y: 360 },
  { x: 500, y: 360 },
  { x: 500, y: 180 },
  { x: 720, y: 180 },
  { x: 720, y: 440 }
];

// ==========================================
// 3. MAIN COMPONENT
// ==========================================
export default function NeonCoreDefense() {
  const [gameState, setGameState] = useState<"menu" | "playing" | "game_over" | "victory">("menu");
  const [wave, setWave] = useState(1);
  const [coreHp, setCoreHp] = useState(100);
  const [energy, setEnergy] = useState(300);
  const [score, setScore] = useState(0);
  const [selectedBuildType, setSelectedBuildType] = useState<TurretType>("PLASMA");
  const [muted, setMuted] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const turretsRef = useRef<PlacedTurret[]>([]);
  const enemiesRef = useRef<EnemyWaveUnit[]>([]);

  const toggleMute = () => {
    setMuted(!muted);
    audio.muted = !muted;
  };

  const startDefense = () => {
    setWave(1);
    setCoreHp(100);
    setEnergy(350);
    setScore(0);
    turretsRef.current = [];
    enemiesRef.current = [];
    spawnWave(1);
    setGameState("playing");
  };

  const spawnWave = (waveNum: number) => {
    const units: EnemyWaveUnit[] = [];
    const count = 5 + waveNum * 3;
    for (let i = 0; i < count; i++) {
      units.push({
        id: `e_${waveNum}_${i}`,
        x: WAYPOINTS[0].x - i * 40,
        y: WAYPOINTS[0].y,
        pathIdx: 0,
        hp: 40 + waveNum * 25,
        maxHp: 40 + waveNum * 25,
        speed: 1.2 + waveNum * 0.1,
        reward: 20 + waveNum * 5,
        color: waveNum % 2 === 0 ? "#f43f5e" : "#eab308"
      });
    }
    enemiesRef.current = units;
  };

  // Canvas Handle Click (Place Turret)
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (gameState !== "playing") return;

    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const spec = TURRET_SPECS[selectedBuildType];
    if (energy < spec.cost) return;

    // Place Turret
    turretsRef.current.push({
      id: `t_${Date.now()}`,
      x,
      y,
      type: selectedBuildType,
      level: 1,
      lastFired: 0
    });

    setEnergy((e) => e - spec.cost);
    audio.playPlace();
  };

  // Main Loop
  useEffect(() => {
    if (gameState !== "playing") return;

    let animId: number;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const gameLoop = (timestamp: number) => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw Path
      ctx.strokeStyle = "#334155";
      ctx.lineWidth = 40;
      ctx.beginPath();
      WAYPOINTS.forEach((pt, idx) => {
        if (idx === 0) ctx.moveTo(pt.x, pt.y);
        else ctx.lineTo(pt.x, pt.y);
      });
      ctx.stroke();

      // Draw Core Target
      const lastPt = WAYPOINTS[WAYPOINTS.length - 1];
      ctx.fillStyle = "#ef4444";
      ctx.beginPath();
      ctx.arc(lastPt.x, lastPt.y, 24, 0, Math.PI * 2);
      ctx.fill();

      // Update Enemies
      const enemies = enemiesRef.current;
      for (let i = enemies.length - 1; i >= 0; i--) {
        const e = enemies[i];
        const targetPt = WAYPOINTS[e.pathIdx + 1];

        if (!targetPt) {
          // Reached Core!
          setCoreHp((hp) => {
            const nextHp = hp - 15;
            if (nextHp <= 0) setGameState("game_over");
            return Math.max(0, nextHp);
          });
          enemies.splice(i, 1);
          continue;
        }

        const dx = targetPt.x - e.x;
        const dy = targetPt.y - e.y;
        const dist = Math.hypot(dx, dy);

        if (dist < e.speed) {
          e.x = targetPt.x;
          e.y = targetPt.y;
          e.pathIdx += 1;
        } else {
          e.x += (dx / dist) * e.speed;
          e.y += (dy / dist) * e.speed;
        }

        // Render Enemy
        ctx.fillStyle = e.color;
        ctx.beginPath();
        ctx.arc(e.x, e.y, 10, 0, Math.PI * 2);
        ctx.fill();

        // Enemy HP bar
        ctx.fillStyle = "#1e293b";
        ctx.fillRect(e.x - 12, e.y - 18, 24, 4);
        ctx.fillStyle = "#10b981";
        ctx.fillRect(e.x - 12, e.y - 18, (e.hp / e.maxHp) * 24, 4);
      }

      // Update Turrets & Firing
      const turrets = turretsRef.current;
      turrets.forEach((t) => {
        const spec = TURRET_SPECS[t.type];
        ctx.fillStyle = spec.color;
        ctx.beginPath();
        ctx.arc(t.x, t.y, 14, 0, Math.PI * 2);
        ctx.fill();

        // Target Nearest Enemy
        let nearestEnemy: EnemyWaveUnit | null = null;
        let minDist = spec.range;

        enemies.forEach((e) => {
          const d = Math.hypot(e.x - t.x, e.y - t.y);
          if (d < minDist) {
            minDist = d;
            nearestEnemy = e;
          }
        });

        if (nearestEnemy && timestamp - t.lastFired > 1000 / spec.fireRate) {
          t.lastFired = timestamp;
          (nearestEnemy as EnemyWaveUnit).hp -= spec.damage;
          audio.playShot();

          // Laser line beam
          ctx.strokeStyle = spec.color;
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.moveTo(t.x, t.y);
          ctx.lineTo((nearestEnemy as EnemyWaveUnit).x, (nearestEnemy as EnemyWaveUnit).y);
          ctx.stroke();

          // Kill check
          if ((nearestEnemy as EnemyWaveUnit).hp <= 0) {
            audio.playExplosion();
            setEnergy((eng) => eng + (nearestEnemy as EnemyWaveUnit).reward);
            setScore((s) => s + 100);
            enemiesRef.current = enemies.filter((item) => item.id !== (nearestEnemy as EnemyWaveUnit).id);
          }
        }
      });

      // Wave cleared check
      if (enemies.length === 0) {
        if (wave < 10) {
          setWave((w) => w + 1);
          spawnWave(wave + 1);
        } else {
          setGameState("victory");
        }
      }

      animId = requestAnimationFrame(gameLoop);
    };

    animId = requestAnimationFrame(gameLoop);
    return () => cancelAnimationFrame(animId);
  }, [gameState, wave]);

  return (
    <div className="relative w-full h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-4 font-sans select-none overflow-hidden">
      <div className="relative bg-slate-900 border-2 border-slate-800 rounded-2xl p-6 shadow-2xl flex flex-col items-center gap-4 max-w-4xl w-full">
        {/* HUD Bar */}
        <div className="w-full flex items-center justify-between bg-slate-950 p-4 rounded-xl border border-slate-800">
          <div className="flex items-center gap-4 text-xs font-bold">
            <span className="text-sky-400">WAVE {wave} / 10</span>
            <span className="text-rose-400">CORE HP: {coreHp}%</span>
            <span className="text-amber-400">ENERGY: {energy}</span>
          </div>

          <button onClick={toggleMute} className="p-2 bg-slate-800 rounded-lg">
            {muted ? <VolumeX className="w-4 h-4 text-slate-400" /> : <Volume2 className="w-4 h-4 text-sky-400" />}
          </button>
        </div>

        {/* START MENU */}
        {gameState === "menu" && (
          <div className="py-12 text-center">
            <span className="px-4 py-1.5 rounded-full bg-sky-500/10 border border-sky-500/30 text-sky-400 text-xs font-bold uppercase mb-6">
              2D TOWER DEFENSE STRATEGY
            </span>
            <h1 className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-sky-400 via-indigo-300 to-rose-400 mb-4">
              NEON CORE DEFENSE
            </h1>
            <p className="text-slate-400 text-xs max-w-md mx-auto mb-8">
              Place plasma cannons & rocket launchers along the grid path to protect the central reactor core from wave invasions.
            </p>

            <button
              onClick={startDefense}
              className="px-8 py-4 bg-sky-500 hover:bg-sky-400 font-bold text-white rounded-xl shadow-lg shadow-sky-500/25 mb-4"
            >
              START DEFENSE
            </button>
          </div>
        )}

        {/* GAME CANVAS */}
        {gameState === "playing" && (
          <div className="flex flex-col items-center gap-4">
            <canvas
              ref={canvasRef}
              width={800}
              height={480}
              onClick={handleCanvasClick}
              className="block rounded-xl border border-slate-800 bg-slate-950 cursor-crosshair"
            />

            {/* Turret Selection Toolbar */}
            <div className="flex gap-4">
              {(["PLASMA", "EMP", "ROCKET"] as TurretType[]).map((type) => {
                const spec = TURRET_SPECS[type];
                const active = selectedBuildType === type;
                return (
                  <button
                    key={type}
                    onClick={() => setSelectedBuildType(type)}
                    className={`px-4 py-2.5 rounded-xl border text-xs font-bold flex items-center gap-2 ${
                      active ? "bg-sky-500 text-white border-sky-400" : "bg-slate-950 text-slate-400 border-slate-800"
                    }`}
                  >
                    <span style={{ color: spec.color }}>●</span> {spec.name} ({spec.cost} E)
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* VICTORY / GAMEOVER */}
        {gameState === "victory" && (
          <div className="py-8 text-center">
            <Award className="w-12 h-12 text-amber-400 mx-auto mb-4" />
            <h2 className="text-3xl font-black mb-2">SECTOR DEFENDED!</h2>
            <button onClick={startDefense} className="px-8 py-3 bg-sky-500 font-bold rounded-xl">REPLAY DEFENSE</button>
          </div>
        )}
      </div>
    </div>
  );
}
