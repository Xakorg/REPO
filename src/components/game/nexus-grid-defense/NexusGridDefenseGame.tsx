"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Shield,
  Zap,
  Play,
  RotateCcw,
  Volume2,
  VolumeX,
  Pause,
  Award,
  Crosshair,
  Radio,
  Cpu,
  Flame,
  Activity,
  Layers,
  ChevronRight
} from "lucide-react";
import confetti from "canvas-confetti";

// ==========================================
// TYPES & INTERFACES
// ==========================================
export type TowerType = "plasma" | "emp" | "laser" | "tesla" | "nuke";

export interface DefenseTower {
  id: string;
  type: TowerType;
  gridX: number;
  gridY: number;
  range: number;
  damage: number;
  fireRate: number;
  lastFired: number;
  level: number;
  cost: number;
  color: string;
}

export interface EnemyNode {
  id: string;
  pathIndex: number;
  x: number;
  y: number;
  hp: number;
  maxHp: number;
  speed: number;
  reward: number;
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
  color: string;
}

// Fixed Path Coordinates
const PATH_WAYPOINTS = [
  { x: 50, y: 300 },
  { x: 200, y: 300 },
  { x: 200, y: 120 },
  { x: 450, y: 120 },
  { x: 450, y: 480 },
  { x: 700, y: 480 },
  { x: 700, y: 300 },
  { x: 820, y: 300 }
];

// ==========================================
// MAIN COMPONENT
// ==========================================
export default function NexusGridDefenseGame() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [gameState, setGameState] = useState<"menu" | "playing" | "paused" | "gameover" | "victory">("menu");
  const [wave, setWave] = useState(1);
  const [credits, setCredits] = useState(300);
  const [coreHp, setCoreHp] = useState(100);
  const [selectedTowerType, setSelectedTowerType] = useState<TowerType>("plasma");
  const [soundEnabled, setSoundEnabled] = useState(true);

  const towersRef = useRef<DefenseTower[]>([]);
  const enemiesRef = useRef<EnemyNode[]>([]);
  const projectilesRef = useRef<Projectile[]>([]);
  const audioCtxRef = useRef<AudioContext | null>(null);

  // Audio Synthesizer
  const playSound = useCallback((type: "plasma" | "laser" | "place" | "explosion") => {
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

      if (type === "plasma") {
        osc.type = "sine";
        osc.frequency.setValueAtTime(800, now);
        osc.frequency.exponentialRampToValueAtTime(300, now + 0.1);
        gain.gain.setValueAtTime(0.18, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
        osc.start(now);
        osc.stop(now + 0.1);
      } else if (type === "place") {
        osc.type = "triangle";
        osc.frequency.setValueAtTime(440, now);
        osc.frequency.setValueAtTime(880, now + 0.08);
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
        osc.start(now);
        osc.stop(now + 0.15);
      }
    } catch (e) {}
  }, [soundEnabled]);

  const startDefense = () => {
    setWave(1);
    setCredits(350);
    setCoreHp(100);
    towersRef.current = [];
    enemiesRef.current = [];
    projectilesRef.current = [];

    spawnEnemyWave(1);
    setGameState("playing");
  };

  const spawnEnemyWave = (waveNum: number) => {
    const count = 5 + waveNum * 3;
    const enemies: EnemyNode[] = [];

    for (let i = 0; i < count; i++) {
      enemies.push({
        id: `enemy-${i}-${Date.now()}`,
        pathIndex: 0,
        x: PATH_WAYPOINTS[0].x - i * 40,
        y: PATH_WAYPOINTS[0].y,
        hp: 40 + waveNum * 25,
        maxHp: 40 + waveNum * 25,
        speed: 1.2 + waveNum * 0.1,
        reward: 15,
        color: waveNum % 3 === 0 ? "#ef4444" : "#a855f7"
      });
    }

    enemiesRef.current = enemies;
  };

  // Place Defense Tower on Canvas Click
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (gameState !== "playing") return;
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    const costs: Record<TowerType, number> = {
      plasma: 100,
      emp: 140,
      laser: 180,
      tesla: 220,
      nuke: 350
    };

    const cost = costs[selectedTowerType];
    if (credits < cost) return;

    // Check overlaps
    const existing = towersRef.current.some(
      t => Math.hypot(t.gridX - clickX, t.gridY - clickY) < 35
    );
    if (existing) return;

    setCredits(c => c - cost);
    playSound("place");

    towersRef.current.push({
      id: "tower-" + Date.now(),
      type: selectedTowerType,
      gridX: clickX,
      gridY: clickY,
      range: selectedTowerType === "laser" ? 180 : 120,
      damage: selectedTowerType === "nuke" ? 80 : 25,
      fireRate: selectedTowerType === "laser" ? 200 : 600,
      lastFired: 0,
      level: 1,
      cost,
      color:
        selectedTowerType === "plasma"
          ? "#00f0ff"
          : selectedTowerType === "laser"
          ? "#ef4444"
          : "#eab308"
    });
  };

  // 60 FPS Render Loop
  useEffect(() => {
    let animId: number;

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

      // Draw Path Waypoint Lines
      ctx.strokeStyle = "rgba(0, 240, 255, 0.3)";
      ctx.lineWidth = 24;
      ctx.beginPath();
      PATH_WAYPOINTS.forEach((pt, i) => {
        if (i === 0) ctx.moveTo(pt.x, pt.y);
        else ctx.lineTo(pt.x, pt.y);
      });
      ctx.stroke();

      if (gameState === "playing") {
        // Move Enemies along Path
        enemiesRef.current.forEach(enemy => {
          const target = PATH_WAYPOINTS[enemy.pathIndex + 1];
          if (!target) {
            // Reached Nexus Core!
            setCoreHp(h => {
              const next = h - 10;
              if (next <= 0) setGameState("gameover");
              return Math.max(0, next);
            });
            enemy.hp = 0;
            return;
          }

          const dx = target.x - enemy.x;
          const dy = target.y - enemy.y;
          const dist = Math.hypot(dx, dy);

          if (dist < 4) {
            enemy.pathIndex++;
          } else {
            enemy.x += (dx / dist) * enemy.speed;
            enemy.y += (dy / dist) * enemy.speed;
          }
        });

        enemiesRef.current = enemiesRef.current.filter(e => e.hp > 0);

        // Towers Targeting AI
        const now = Date.now();
        towersRef.current.forEach(tower => {
          if (now - tower.lastFired > tower.fireRate) {
            // Find closest enemy in range
            const target = enemiesRef.current.find(
              e => Math.hypot(e.x - tower.gridX, e.y - tower.gridY) <= tower.range
            );

            if (target) {
              tower.lastFired = now;
              target.hp -= tower.damage;
              playSound("plasma");

              projectilesRef.current.push({
                id: "p-" + now,
                x: tower.gridX,
                y: tower.gridY,
                targetX: target.x,
                targetY: target.y,
                speed: 12,
                damage: tower.damage,
                color: tower.color
              });

              if (target.hp <= 0) {
                setCredits(c => c + target.reward);
              }
            }
          }
        });

        // Wave Completion Check
        if (enemiesRef.current.length === 0) {
          const nextW = wave + 1;
          setWave(nextW);
          spawnEnemyWave(nextW);
        }
      }

      // Draw Towers
      towersRef.current.forEach(tower => {
        ctx.save();
        ctx.translate(tower.gridX, tower.gridY);
        ctx.shadowBlur = 10;
        ctx.shadowColor = tower.color;
        ctx.fillStyle = tower.color;
        ctx.beginPath();
        ctx.arc(0, 0, 16, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });

      // Draw Enemies
      enemiesRef.current.forEach(enemy => {
        ctx.save();
        ctx.translate(enemy.x, enemy.y);
        ctx.fillStyle = enemy.color;
        ctx.beginPath();
        ctx.arc(0, 0, 10, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, [gameState, wave, playSound]);

  return (
    <div className="relative w-full h-screen bg-black text-white font-sans overflow-hidden select-none flex items-center justify-center">
      <div className="relative border border-slate-800 rounded-xl shadow-2xl bg-slate-950 overflow-hidden">
        <canvas
          ref={canvasRef}
          onClick={handleCanvasClick}
          className="block w-[850px] h-[600px] cursor-crosshair"
        />

        {/* TOP HUD */}
        {gameState === "playing" && (
          <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-center pointer-events-none bg-gradient-to-b from-slate-950/90 to-transparent">
            <div>
              <div className="text-xs font-mono font-bold text-cyan-400">NEXUS DEFENSE CORE</div>
              <div className="text-xl font-black font-mono text-white">WAVE {wave}</div>
            </div>

            <div className="flex items-center gap-6 font-mono text-xs font-bold">
              <div className="text-emerald-400">CORE HP: {coreHp}%</div>
              <div className="text-amber-400">CREDITS: 💰 {credits}</div>
            </div>
          </div>
        )}

        {/* MAIN MENU */}
        {gameState === "menu" && (
          <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-md flex flex-col items-center justify-center p-8 text-center">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-cyan-500 to-emerald-500 flex items-center justify-center shadow-xl shadow-cyan-500/30 mb-6">
              <Shield className="w-8 h-8 text-white" />
            </div>

            <h1 className="text-4xl font-black text-white mb-2 tracking-tight">
              NEXUS <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-emerald-400">GRID DEFENSE</span>
            </h1>
            <p className="text-slate-400 max-w-md text-sm mb-8">
              Real-time tactical grid tower defense. Build plasma cannons, laser turrets, and defend the Nexus Core against corrupted AI node waves.
            </p>

            <button
              onClick={startDefense}
              className="w-64 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-emerald-500 text-slate-950 font-bold text-sm shadow-lg shadow-cyan-500/20 hover:opacity-95 transition-all flex items-center justify-center gap-2"
            >
              <Play className="w-4 h-4 fill-current" /> LAUNCH DEFENSE
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
