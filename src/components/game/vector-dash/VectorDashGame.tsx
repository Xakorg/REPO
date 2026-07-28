"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Play,
  RotateCcw,
  Volume2,
  VolumeX,
  ArrowLeft,
  Zap,
  Gauge,
  Trophy,
  ShoppingBag,
  Shield,
  Sparkles,
  Pause,
  ChevronRight,
  Flame,
  Award
} from "lucide-react";
import Link from "next/link";

// ==========================================
// 1. SYNTHETIC AUDIO ENGINE FOR SYNTHWAVE RUNNER
// ==========================================
class RunnerSoundEngine {
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

  playLaneSwitch() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(300, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(600, this.ctx.currentTime + 0.08);

      gain.gain.setValueAtTime(0.15, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.08);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.08);
    } catch (e) {}
  }

  playNitroBoost() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(200, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1000, this.ctx.currentTime + 0.3);

      gain.gain.setValueAtTime(0.25, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.3);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.3);
    } catch (e) {}
  }

  playCoin() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;
    try {
      const notes = [987.77, 1318.51];
      notes.forEach((freq, i) => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, this.ctx!.currentTime + i * 0.05);

        gain.gain.setValueAtTime(0.15, this.ctx!.currentTime + i * 0.05);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx!.currentTime + i * 0.05 + 0.08);

        osc.connect(gain);
        gain.connect(this.ctx!.destination);
        osc.start(this.ctx!.currentTime + i * 0.05);
        osc.stop(this.ctx!.currentTime + i * 0.05 + 0.08);
      });
    } catch (e) {}
  }

  playCrash() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(300, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(40, this.ctx.currentTime + 0.35);

      gain.gain.setValueAtTime(0.3, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.35);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.35);
    } catch (e) {}
  }
}

const soundEngine = new RunnerSoundEngine();

// ==========================================
// 2. DATA STRUCTURES & STAGES
// ==========================================
export interface Obstacle {
  id: string;
  lane: 0 | 1 | 2; // Left, Center, Right
  z: number; // Distance down track (1000 to 0)
  type: "barrier" | "spike" | "gap";
}

export interface EnergyOrb {
  id: string;
  lane: 0 | 1 | 2;
  z: number;
  type: "coin" | "nitro";
}

export interface TrackStage {
  id: number;
  title: string;
  speed: number;
  targetDistance: number;
}

export const STAGES: TrackStage[] = [
  { id: 1, title: "Track 1: Neon Highway", speed: 12, targetDistance: 1500 },
  { id: 2, title: "Track 2: Cyber Canyon", speed: 16, targetDistance: 2200 },
  { id: 3, title: "Track 3: Overdrive Expressway", speed: 20, targetDistance: 3000 },
  { id: 4, title: "Track 4: Quantum Tunnel", speed: 24, targetDistance: 3800 },
  { id: 5, title: "Track 5: Hyperion Apex", speed: 28, targetDistance: 4500 },
];

// ==========================================
// 3. MAIN RUNNER COMPONENT
// ==========================================
export default function VectorDashGame() {
  const [gameState, setGameState] = useState<"menu" | "playing" | "paused" | "garage" | "gameover" | "victory">("menu");
  const [stageIndex, setStageIndex] = useState<number>(0);
  const [lane, setLane] = useState<0 | 1 | 2>(1); // 0 = Left, 1 = Center, 2 = Right
  const [isJumping, setIsJumping] = useState<boolean>(false);
  const [score, setScore] = useState<number>(0);
  const [distance, setDistance] = useState<number>(0);
  const [coins, setCoins] = useState<number>(0);
  const [nitro, setNitro] = useState<number>(100);
  const [isBoosting, setIsBoosting] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(false);

  // Upgrades state
  const [upgrades, setUpgrades] = useState({
    speedLvl: 1,
    nitroLvl: 1,
    shieldLvl: 1,
  });

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const obstaclesRef = useRef<Obstacle[]>([]);
  const itemsRef = useRef<EnergyOrb[]>([]);

  const currentStage = STAGES[stageIndex];

  // Start specific stage
  const startRace = (idx: number) => {
    soundEngine.init();
    setStageIndex(idx);
    setLane(1);
    setIsJumping(false);
    setScore(0);
    setDistance(0);
    setNitro(100);
    setIsBoosting(false);

    obstaclesRef.current = [];
    itemsRef.current = [];

    setGameState("playing");
  };

  // Controls handler (Left / Right / Jump / Nitro)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (gameState !== "playing") return;

      if (e.code === "KeyA" || e.code === "ArrowLeft") {
        setLane(l => Math.max(0, l - 1) as 0 | 1 | 2);
        soundEngine.playLaneSwitch();
      } else if (e.code === "KeyD" || e.code === "ArrowRight") {
        setLane(l => Math.min(2, l + 1) as 0 | 1 | 2);
        soundEngine.playLaneSwitch();
      } else if ((e.code === "Space" || e.code === "ArrowUp") && !isJumping) {
        setIsJumping(true);
        setTimeout(() => setIsJumping(false), 600);
      } else if (e.code === "ShiftLeft" || e.code === "KeyE") {
        if (nitro > 20) {
          setIsBoosting(true);
          soundEngine.playNitroBoost();
          setTimeout(() => setIsBoosting(false), 2000);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [gameState, isJumping, nitro]);

  // Main Canvas Render & Game Engine Loop
  useEffect(() => {
    if (gameState !== "playing" || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;

    const gameLoop = () => {
      // 1. UPDATE DISTANCE & SCORE
      const currentSpeed = (currentStage.speed + (upgrades.speedLvl - 1) * 2) * (isBoosting ? 1.8 : 1.0);
      setDistance(d => {
        const nextD = d + currentSpeed / 10;
        if (nextD >= currentStage.targetDistance) {
          setGameState("victory");
        }
        return nextD;
      });

      setScore(s => s + Math.floor(currentSpeed / 2));

      // 2. SPAWN OBSTACLES & ITEMS
      if (Math.random() < 0.04) {
        const laneRnd = Math.floor(Math.random() * 3) as 0 | 1 | 2;
        obstaclesRef.current.push({
          id: `obs-${Date.now()}-${Math.random()}`,
          lane: laneRnd,
          z: 800,
          type: Math.random() < 0.5 ? "barrier" : "spike",
        });
      }

      if (Math.random() < 0.05) {
        const laneRnd = Math.floor(Math.random() * 3) as 0 | 1 | 2;
        itemsRef.current.push({
          id: `item-${Date.now()}-${Math.random()}`,
          lane: laneRnd,
          z: 800,
          type: Math.random() < 0.7 ? "coin" : "nitro",
        });
      }

      // 3. MOVE OBSTACLES & ITEMS FORWARD
      obstaclesRef.current.forEach(obs => (obs.z -= currentSpeed * 1.5));
      itemsRef.current.forEach(itm => (itm.z -= currentSpeed * 1.5));

      // 4. COLLISION CHECKS
      obstaclesRef.current.forEach(obs => {
        if (obs.z < 60 && obs.z > -20 && obs.lane === lane && !isJumping) {
          soundEngine.playCrash();
          setGameState("gameover");
        }
      });

      itemsRef.current.forEach(itm => {
        if (itm.z < 60 && itm.z > -20 && itm.lane === lane) {
          if (itm.type === "coin") {
            soundEngine.playCoin();
            setCoins(c => c + 10);
          } else if (itm.type === "nitro") {
            soundEngine.playNitroBoost();
            setNitro(n => Math.min(100, n + 25));
          }
          itm.z = -999; // Remove collected item
        }
      });

      // Filter out off-screen objects
      obstaclesRef.current = obstaclesRef.current.filter(o => o.z > -50);
      itemsRef.current = itemsRef.current.filter(i => i.z > -50);

      // 5. CANVAS RENDERING (PERSPECTIVE 3D ROAD)
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Background Cyber Sky
      const skyGradient = ctx.createLinearGradient(0, 0, 0, canvas.height / 2);
      skyGradient.addColorStop(0, "#050014");
      skyGradient.addColorStop(1, "#240046");
      ctx.fillStyle = skyGradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height / 2);

      // Synthwave Horizon Sun
      ctx.fillStyle = "#ff0055";
      ctx.shadowColor = "#ff0055";
      ctx.shadowBlur = 40;
      ctx.beginPath();
      ctx.arc(canvas.width / 2, canvas.height / 2, 70, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      // 3D Perspective Road Grid
      ctx.fillStyle = "#0d0d1a";
      ctx.fillRect(0, canvas.height / 2, canvas.width, canvas.height / 2);

      // Render 3 Lanes Lines
      const vanishingX = canvas.width / 2;
      const vanishingY = canvas.height / 2;

      const laneXCoords = [
        [0, canvas.width / 3],
        [canvas.width / 3, (2 * canvas.width) / 3],
        [(2 * canvas.width) / 3, canvas.width],
      ];

      ctx.strokeStyle = "rgba(0, 240, 255, 0.4)";
      ctx.lineWidth = 2;

      for (let i = 0; i <= 3; i++) {
        const bottomX = (i * canvas.width) / 3;
        ctx.beginPath();
        ctx.moveTo(vanishingX, vanishingY);
        ctx.lineTo(bottomX, canvas.height);
        ctx.stroke();
      }

      // Render Moving Obstacles
      obstaclesRef.current.forEach(obs => {
        const scale = 1 - obs.z / 800;
        if (scale <= 0) return;

        const laneCenterX = (obs.lane + 0.5) * (canvas.width / 3);
        const projX = vanishingX + (laneCenterX - vanishingX) * scale;
        const projY = vanishingY + (canvas.height - vanishingY) * scale;
        const size = 40 * scale;

        ctx.fillStyle = obs.type === "barrier" ? "#ff0055" : "#ffaa00";
        ctx.shadowColor = ctx.fillStyle;
        ctx.shadowBlur = 15;
        ctx.fillRect(projX - size / 2, projY - size, size, size);
        ctx.shadowBlur = 0;
      });

      // Render Energy Orbs
      itemsRef.current.forEach(itm => {
        const scale = 1 - itm.z / 800;
        if (scale <= 0) return;

        const laneCenterX = (itm.lane + 0.5) * (canvas.width / 3);
        const projX = vanishingX + (laneCenterX - vanishingX) * scale;
        const projY = vanishingY + (canvas.height - vanishingY) * scale;
        const radius = 15 * scale;

        ctx.fillStyle = itm.type === "coin" ? "#ffd700" : "#00ffcc";
        ctx.shadowColor = ctx.fillStyle;
        ctx.shadowBlur = 15;
        ctx.beginPath();
        ctx.arc(projX, projY - radius, radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      });

      // Render Player Cyber Racer Vehicle
      const playerLaneX = (lane + 0.5) * (canvas.width / 3);
      const playerY = canvas.height - 70 - (isJumping ? 60 : 0);

      ctx.fillStyle = isBoosting ? "#a000ff" : "#00f0ff";
      ctx.shadowColor = ctx.fillStyle;
      ctx.shadowBlur = 25;
      ctx.fillRect(playerLaneX - 30, playerY, 60, 40);
      ctx.shadowBlur = 0;

      // Racer Headlights
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(playerLaneX - 25, playerY, 10, 5);
      ctx.fillRect(playerLaneX + 15, playerY, 10, 5);

      animId = requestAnimationFrame(gameLoop);
    };

    animId = requestAnimationFrame(gameLoop);
    return () => cancelAnimationFrame(animId);
  }, [gameState, lane, isJumping, isBoosting, currentStage]);

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
              <span className="text-cyan-400 font-black">{currentStage.title}</span>
              <span className="text-amber-400">🪙 COINS: {coins}</span>
              <span className="text-fuchsia-400">SCORE: {score}</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <span className="text-xs font-bold text-emerald-400">
              DISTANCE: {Math.floor(distance)} / {currentStage.targetDistance}m
            </span>
            <button
              onClick={() => setGameState("paused")}
              className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 transition-colors"
            >
              <Pause className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* 3D PERSPECTIVE CANVAS */}
      <div className="relative border-2 border-cyan-500/30 rounded-3xl overflow-hidden shadow-[0_0_50px_rgba(0,240,255,0.15)]">
        <canvas ref={canvasRef} width={900} height={550} className="block bg-zinc-950" />
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
                <Flame className="w-4 h-4" /> Synthwave Cyber Runner
              </div>

              <h1 className="text-6xl font-black tracking-tighter uppercase mb-4 bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 via-fuchsia-500 to-pink-500">
                VECTOR DASH
              </h1>
              <p className="text-white/60 text-sm mb-8 leading-relaxed">
                Drive at blistering speeds down 3D synthwave highways. Switch lanes, leap over plasma barriers, trigger nitro boosts, and upgrade vehicle tech.
              </p>

              <button
                onClick={() => startRace(0)}
                className="w-full py-4 bg-gradient-to-r from-cyan-500 to-fuchsia-600 rounded-full font-black uppercase tracking-widest hover:scale-105 transition-all shadow-[0_0_40px_rgba(0,240,255,0.4)] flex items-center justify-center gap-3 text-base"
              >
                <Play className="w-5 h-5 fill-white" /> Launch Race
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* OVERLAY 2: GAME OVER */}
      <AnimatePresence>
        {gameState === "gameover" && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-40 bg-black/90 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center"
          >
            <div className="bg-zinc-950 border border-white/10 p-8 rounded-3xl max-w-md w-full">
              <h2 className="text-3xl font-black uppercase tracking-wider text-rose-500 mb-2">
                VEHICLE CRASHED!
              </h2>
              <p className="text-xs text-white/50 uppercase tracking-widest mb-6">Track Collision Occurred</p>

              <div className="space-y-3">
                <button
                  onClick={() => startRace(stageIndex)}
                  className="w-full py-4 bg-cyan-500 text-black font-black uppercase tracking-widest rounded-xl hover:bg-cyan-400 transition-all flex items-center justify-center gap-2"
                >
                  <RotateCcw className="w-5 h-5" /> Retry Race
                </button>
                <button
                  onClick={() => setGameState("menu")}
                  className="w-full py-3.5 bg-white/10 text-white font-black uppercase tracking-widest rounded-xl hover:bg-white/20 transition-all"
                >
                  Main Menu
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
