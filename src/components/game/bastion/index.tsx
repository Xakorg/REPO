"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Shield,
  Zap,
  Crosshair,
  Volume2,
  VolumeX,
  Play,
  Pause,
  RotateCcw,
  Sparkles,
  Users,
  User,
  Globe,
  Trophy,
  ArrowLeft,
  Activity,
  Radio,
  Clock,
  Hammer,
  Target,
  Flame,
  Bomb
} from "lucide-react";
import Link from "next/link";
import { useUser, useFirestore, setDocumentNonBlocking } from "@/firebase";
import { doc, increment } from "firebase/firestore";

// ==========================================
// BASTION FORTRESS TYPES
// ==========================================

export type BastionMode = "endless_siege" | "coop_fortress";

export interface DefenseStructure {
  id: string;
  type: "wall" | "turret" | "generator";
  x: number;
  y: number;
  hp: number;
  maxHp: number;
  range: number;
  fireCooldown: number;
  color: string;
}

export interface SiegeEnemy {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  hp: number;
  maxHp: number;
  speed: number;
  damage: number;
  radius: number;
  color: string;
}

export interface PlasmaProjectile {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  damage: number;
  color: string;
}

// ==========================================
// WEB AUDIO SYNTHESIZER
// ==========================================

class BastionAudioSynth {
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

  playBuild() {
    if (this.muted || !this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(400, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(900, this.ctx.currentTime + 0.1);

      gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.1);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.1);
    } catch (e) {}
  }

  playCannonFire() {
    if (this.muted || !this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(700, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(150, this.ctx.currentTime + 0.15);

      gain.gain.setValueAtTime(0.25, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.15);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.15);
    } catch (e) {}
  }

  playExplosion() {
    if (this.muted || !this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "square";
      osc.frequency.setValueAtTime(150, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(40, this.ctx.currentTime + 0.3);

      gain.gain.setValueAtTime(0.3, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.3);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.3);
    } catch (e) {}
  }
}

const audio = new BastionAudioSynth();

// ==========================================
// BASTION GAME COMPONENT
// ==========================================

export default function BastionGame() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const { user } = useUser();
  const firestore = useFirestore();

  const [gameState, setGameState] = useState<"menu" | "playing" | "paused" | "game_over">("menu");
  const [mode, setMode] = useState<BastionMode>("endless_siege");
  const [soundEnabled, setSoundEnabled] = useState(true);

  // HUD Metrics
  const [coreHp, setCoreHp] = useState(500);
  const [energy, setEnergy] = useState(150);
  const [wave, setWave] = useState(1);
  const [selectedBuildType, setSelectedBuildType] = useState<"wall" | "turret">("turret");
  const [winnerName, setWinnerName] = useState<string | null>(null);

  const engineRef = useRef({
    keys: {
      w: false, a: false, s: false, d: false, space: false,
      up: false, left: false, down: false, right: false, enter: false,
      mouseX: 0, mouseY: 0
    },
    p1: { x: 500, y: 300, vx: 0, vy: 0, radius: 16, color: "#f59e0b" },
    p2: { x: 500, y: 300, vx: 0, vy: 0, radius: 16, color: "#3b82f6" },
    structures: [] as DefenseStructure[],
    enemies: [] as SiegeEnemy[],
    projectiles: [] as PlasmaProjectile[],
    particles: [] as any[],
    energy: 150,
    coreHp: 500,
    maxCoreHp: 500,
    wave: 1,
    waveTimer: 0
  });

  const toggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    audio.muted = !next;
  };

  const dispatchScore = (finalScore: number) => {
    if (typeof window !== "undefined" && finalScore > 0) {
      const points = Math.floor(finalScore / 25) + 20;
      window.dispatchEvent(
        new CustomEvent("xakteir-game-score", {
          detail: { score: finalScore, points }
        })
      );
      if (user && firestore) {
        setDocumentNonBlocking(
          doc(firestore, "leaderboard", user.uid),
          {
            uid: user.uid,
            displayName: user.displayName || "Bastion Defender",
            points: increment(points),
            updatedAt: new Date().toISOString()
          },
          { merge: true }
        );
      }
    }
  };

  const initFortress = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const w = (canvas.width = canvas.parentElement?.clientWidth || window.innerWidth);
    const h = (canvas.height = canvas.parentElement?.clientHeight || window.innerHeight);

    const engine = engineRef.current;
    engine.p1 = { x: w / 2, y: h / 2, vx: 0, vy: 0, radius: 16, color: "#f59e0b" };
    engine.p2 = { x: w / 2, y: h / 2, vx: 0, vy: 0, radius: 16, color: "#3b82f6" };

    engine.structures = [
      { id: "core", type: "generator", x: w / 2, y: h / 2, hp: 500, maxHp: 500, range: 0, fireCooldown: 0, color: "#f59e0b" }
    ];
    engine.enemies = [];
    engine.projectiles = [];
    engine.particles = [];
    engine.energy = 150;
    engine.coreHp = 500;
    engine.wave = 1;
    engine.waveTimer = 0;

    setCoreHp(500);
    setEnergy(150);
    setWave(1);
    setWinnerName(null);
  }, []);

  // Main 60FPS Game & Physics Loop
  useEffect(() => {
    let animId: number;

    const runLoop = () => {
      if (gameState === "playing") {
        updatePhysics();
      }
      renderCanvas();
      animId = requestAnimationFrame(runLoop);
    };

    const updatePhysics = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const w = canvas.width;
      const h = canvas.height;
      const engine = engineRef.current;
      const keys = engine.keys;
      const p1 = engine.p1;

      // P1 Builder Movement
      let p1dx = 0;
      let p1dy = 0;
      if (keys.a) p1dx -= 1;
      if (keys.d) p1dx += 1;
      if (keys.w) p1dy -= 1;
      if (keys.s) p1dy += 1;

      p1.vx += (p1dx * 5.0 - p1.vx) * 0.25;
      p1.vy += (p1dy * 5.0 - p1.vy) * 0.25;
      p1.x = Math.max(p1.radius, Math.min(w - p1.radius, p1.x + p1.vx));
      p1.y = Math.max(p1.radius, Math.min(h - p1.radius, p1.y + p1.vy));

      // Wave Enemy Spawning (Every 180 frames)
      engine.waveTimer++;
      if (engine.waveTimer % 180 === 0) {
        const side = Math.floor(Math.random() * 4);
        let ex = 0, ey = 0;
        if (side === 0) { ex = Math.random() * w; ey = -20; }
        else if (side === 1) { ex = w + 20; ey = Math.random() * h; }
        else if (side === 2) { ex = Math.random() * w; ey = h + 20; }
        else { ex = -20; ey = Math.random() * h; }

        engine.enemies.push({
          id: `enemy_${Date.now()}_${Math.random()}`,
          x: ex, y: ey,
          vx: 0, vy: 0,
          hp: 40 + engine.wave * 10,
          maxHp: 40 + engine.wave * 10,
          speed: 1.8,
          damage: 15,
          radius: 14,
          color: "#ef4444"
        });
      }

      // Update Turrets Firing
      engine.structures.forEach(struct => {
        if (struct.type === "turret") {
          struct.fireCooldown = Math.max(0, struct.fireCooldown - 1);
          if (struct.fireCooldown <= 0) {
            // Target Nearest Enemy
            let closestEnemy: SiegeEnemy | null = null;
            let minDist = struct.range;

            engine.enemies.forEach(enemy => {
              const dist = Math.hypot(enemy.x - struct.x, enemy.y - struct.y);
              if (dist < minDist) {
                minDist = dist;
                closestEnemy = enemy;
              }
            });

            if (closestEnemy) {
              audio.playCannonFire();
              struct.fireCooldown = 25;
              const angle = Math.atan2((closestEnemy as SiegeEnemy).y - struct.y, (closestEnemy as SiegeEnemy).x - struct.x);
              engine.projectiles.push({
                id: `proj_${Date.now()}`,
                x: struct.x, y: struct.y,
                vx: Math.cos(angle) * 12,
                vy: Math.sin(angle) * 12,
                damage: 25,
                color: "#38bdf8"
              });
            }
          }
        }
      });

      // Update Projectiles
      for (let pIdx = engine.projectiles.length - 1; pIdx >= 0; pIdx--) {
        const proj = engine.projectiles[pIdx];
        proj.x += proj.vx;
        proj.y += proj.vy;

        for (let eIdx = engine.enemies.length - 1; eIdx >= 0; eIdx--) {
          const enemy = engine.enemies[eIdx];
          if (Math.hypot(proj.x - enemy.x, proj.y - enemy.y) < enemy.radius + 4) {
            audio.playExplosion();
            enemy.hp -= proj.damage;
            engine.projectiles.splice(pIdx, 1);

            if (enemy.hp <= 0) {
              engine.enemies.splice(eIdx, 1);
              engine.energy += 15;
              setEnergy(engine.energy);
            }
            break;
          }
        }

        if (proj.x < -20 || proj.x > w + 20 || proj.y < -20 || proj.y > h + 20) {
          engine.projectiles.splice(pIdx, 1);
        }
      }

      // Update Enemies Movement toward Core
      const core = engine.structures[0];
      for (let eIdx = engine.enemies.length - 1; eIdx >= 0; eIdx--) {
        const enemy = engine.enemies[eIdx];
        const angle = Math.atan2(core.y - enemy.y, core.x - enemy.x);
        enemy.x += Math.cos(angle) * enemy.speed;
        enemy.y += Math.sin(angle) * enemy.speed;

        // Core Collision
        if (Math.hypot(core.x - enemy.x, core.y - enemy.y) < core.range + enemy.radius) {
          audio.playExplosion();
          engine.coreHp = Math.max(0, engine.coreHp - enemy.damage);
          setCoreHp(engine.coreHp);
          engine.enemies.splice(eIdx, 1);

          if (engine.coreHp <= 0) {
            setWinnerName("Fortress Fallen");
            dispatchScore(engine.wave * 500);
            setGameState("game_over");
          }
        }
      }
    };

    const renderCanvas = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      const w = canvas.width;
      const h = canvas.height;
      const engine = engineRef.current;

      ctx.fillStyle = "#0c0a09";
      ctx.fillRect(0, 0, w, h);

      // Draw Fortress Base Grid
      ctx.strokeStyle = "rgba(245, 158, 11, 0.05)";
      ctx.lineWidth = 1;
      const step = 40;
      for (let x = 0; x < w; x += step) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke();
      }
      for (let y = 0; y < h; y += step) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
      }

      // Draw Structures
      engine.structures.forEach(struct => {
        ctx.save();
        ctx.shadowBlur = 18;
        ctx.shadowColor = struct.color;

        ctx.fillStyle = struct.color;
        ctx.beginPath();
        if (struct.type === "generator") {
          ctx.arc(struct.x, struct.y, 35, 0, Math.PI * 2);
        } else if (struct.type === "turret") {
          ctx.fillRect(struct.x - 16, struct.y - 16, 32, 32);
        } else {
          ctx.fillRect(struct.x - 20, struct.y - 8, 40, 16);
        }
        ctx.fill();

        ctx.restore();
      });

      // Draw Projectiles
      engine.projectiles.forEach(proj => {
        ctx.shadowBlur = 10;
        ctx.shadowColor = proj.color;
        ctx.fillStyle = proj.color;
        ctx.beginPath();
        ctx.arc(proj.x, proj.y, 5, 0, Math.PI * 2);
        ctx.fill();
      });

      // Draw Enemies
      engine.enemies.forEach(enemy => {
        ctx.shadowBlur = 12;
        ctx.shadowColor = enemy.color;
        ctx.fillStyle = enemy.color;
        ctx.beginPath();
        ctx.arc(enemy.x, enemy.y, enemy.radius, 0, Math.PI * 2);
        ctx.fill();
      });

      // Draw P1 Builder Avatar
      ctx.save();
      ctx.shadowBlur = 15;
      ctx.shadowColor = engine.p1.color;
      ctx.fillStyle = engine.p1.color;
      ctx.beginPath();
      ctx.arc(engine.p1.x, engine.p1.y, engine.p1.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    };

    animId = requestAnimationFrame(runLoop);
    return () => cancelAnimationFrame(animId);
  }, [gameState, mode]);

  // Handle Structure Placement Click
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    audio.init();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    const engine = engineRef.current;
    const cost = selectedBuildType === "turret" ? 50 : 25;

    if (engine.energy >= cost) {
      audio.playBuild();
      engine.energy -= cost;
      setEnergy(engine.energy);

      engine.structures.push({
        id: `struct_${Date.now()}`,
        type: selectedBuildType,
        x: clickX,
        y: clickY,
        hp: selectedBuildType === "turret" ? 150 : 300,
        maxHp: selectedBuildType === "turret" ? 150 : 300,
        range: selectedBuildType === "turret" ? 220 : 0,
        fireCooldown: 0,
        color: selectedBuildType === "turret" ? "#38bdf8" : "#f59e0b"
      });
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      audio.init();
      const keys = engineRef.current.keys;
      if (e.key === "w" || e.key === "W") keys.w = true;
      if (e.key === "a" || e.key === "A") keys.a = true;
      if (e.key === "s" || e.key === "S") keys.s = true;
      if (e.key === "d" || e.key === "D") keys.d = true;
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const keys = engineRef.current.keys;
      if (e.key === "w" || e.key === "W") keys.w = false;
      if (e.key === "a" || e.key === "A") keys.a = false;
      if (e.key === "s" || e.key === "S") keys.s = false;
      if (e.key === "d" || e.key === "D") keys.d = false;
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, []);

  const startGame = (selectedMode: BastionMode) => {
    setMode(selectedMode);
    initFortress();
    setGameState("playing");
  };

  return (
    <div className="w-full h-screen bg-[#0c0a09] text-white relative overflow-hidden font-sans select-none">
      <canvas
        ref={canvasRef}
        onClick={handleCanvasClick}
        className="absolute inset-0 w-full h-full block cursor-crosshair"
      />

      <div className="absolute top-0 inset-x-0 p-4 flex justify-between items-center z-30 pointer-events-none">
        <Link
          href="/games"
          className="pointer-events-auto flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold"
        >
          <ArrowLeft className="w-4 h-4" /> Exit Bastion
        </Link>
        <button
          onClick={toggleSound}
          className="pointer-events-auto p-2 rounded-xl bg-white/5 border border-white/10"
        >
          {soundEnabled ? <Volume2 className="w-4 h-4 text-amber-400" /> : <VolumeX className="w-4 h-4 text-rose-400" />}
        </button>
      </div>

      {gameState === "playing" && (
        <div className="absolute top-4 inset-x-0 flex justify-center pointer-events-none z-20">
          <div className="bg-[#0b0f19]/90 border border-amber-500/30 px-8 py-3 rounded-2xl backdrop-blur-md flex items-center gap-8 pointer-events-auto">
            <div className="text-center">
              <div className="text-[10px] font-black uppercase text-white/40 tracking-wider">FORTRESS CORE HP</div>
              <div className="text-lg font-black text-amber-400">{Math.ceil(coreHp)} / 500</div>
            </div>

            <div className="text-center">
              <div className="text-[10px] font-black uppercase text-white/40 tracking-wider">ENERGY CORE</div>
              <div className="text-xl font-black text-sky-400">{Math.floor(energy)} ENERGY</div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setSelectedBuildType("turret")}
                className={`px-3 py-1.5 rounded-xl border text-xs font-bold ${
                  selectedBuildType === "turret" ? "bg-sky-500 border-sky-400 text-black" : "bg-white/5 border-white/10"
                }`}
              >
                TURRET (50)
              </button>
              <button
                onClick={() => setSelectedBuildType("wall")}
                className={`px-3 py-1.5 rounded-xl border text-xs font-bold ${
                  selectedBuildType === "wall" ? "bg-amber-500 border-amber-400 text-black" : "bg-white/5 border-white/10"
                }`}
              >
                WALL (25)
              </button>
            </div>
          </div>
        </div>
      )}

      {gameState === "menu" && (
        <div className="absolute inset-0 z-40 bg-[#0c0a09]/95 backdrop-blur-xl flex flex-col items-center justify-center p-6">
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center max-w-xl mb-8">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-bold uppercase tracking-widest mb-3">
              <Hammer className="w-3.5 h-3.5" /> Modular Fortress Builder & Siege Defense
            </div>
            <h1 className="text-6xl font-black uppercase tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-sky-500">
              BASTION
            </h1>
            <p className="text-sm text-white/60 mt-3">
              Construct plasma defense turrets, fortify energy barrier walls, and defend central power cores against invading alien wave sieges.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-lg w-full">
            <button
              onClick={() => startGame("endless_siege")}
              className="p-5 rounded-2xl bg-[#0b0f19] border border-amber-500/40 hover:border-amber-400 flex flex-col items-center gap-2 hover:scale-105 transition-all text-center"
            >
              <User className="w-8 h-8 text-amber-400" />
              <div className="font-black text-lg">ENDLESS SIEGE</div>
              <div className="text-xs text-white/50">Single player fortress survival</div>
            </button>

            <button
              onClick={() => startGame("coop_fortress")}
              className="p-5 rounded-2xl bg-[#0b0f19] border border-sky-500/40 hover:border-sky-400 flex flex-col items-center gap-2 hover:scale-105 transition-all text-center"
            >
              <Users className="w-8 h-8 text-sky-400" />
              <div className="font-black text-lg">CO-OP DEFENDER</div>
              <div className="text-xs text-white/50">2-Player builder & gunner fortress defense</div>
            </button>
          </div>
        </div>
      )}

      {gameState === "game_over" && (
        <div className="absolute inset-0 z-50 bg-black/85 backdrop-blur-md flex flex-col items-center justify-center p-6">
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center max-w-md w-full">
            <h2 className="text-4xl font-black uppercase text-amber-400 mb-2">
              {winnerName ? `${winnerName}!` : "Siege Concluded"}
            </h2>
            <p className="text-xs text-white/50 mb-6">Bastion Defense Operation Ended</p>

            <div className="flex gap-4">
              <button
                onClick={() => startGame(mode)}
                className="flex-1 py-3.5 rounded-xl bg-amber-500 text-black font-black uppercase"
              >
                REMATCH
              </button>
              <button
                onClick={() => setGameState("menu")}
                className="px-5 py-3.5 rounded-xl bg-white/10 text-white font-bold uppercase"
              >
                MENU
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
