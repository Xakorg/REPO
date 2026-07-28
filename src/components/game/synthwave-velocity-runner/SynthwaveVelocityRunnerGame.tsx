"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Trophy,
  Play,
  RotateCcw,
  ArrowLeft,
  Pause,
  Zap,
  Sparkles,
  Award,
  RefreshCw,
  Gauge,
  Flame,
  Shield,
  Activity,
  ChevronRight
} from "lucide-react";
import Link from "next/link";

// ==========================================
// 1. PROCEDURAL AUDIO SYNTH
// ==========================================
class RunnerAudioEngine {
  private ctx: AudioContext | null = null;
  public muted: boolean = false;

  private initCtx() {
    if (!this.ctx && typeof window !== "undefined") {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) this.ctx = new AudioCtx();
    }
    if (this.ctx && this.ctx.state === "suspended") {
      this.ctx.resume();
    }
  }

  public playEngine() {
    if (this.muted) return;
    this.initCtx();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(110, now);
    osc.frequency.exponentialRampToValueAtTime(180, now + 0.1);

    gain.gain.setValueAtTime(0.08, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.1);
  }

  public playBoost() {
    if (this.muted) return;
    this.initCtx();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(300, now);
    osc.frequency.exponentialRampToValueAtTime(900, now + 0.3);

    gain.gain.setValueAtTime(0.25, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.3);
  }

  public playRing() {
    if (this.muted) return;
    this.initCtx();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(880, now);
    osc.frequency.exponentialRampToValueAtTime(1760, now + 0.12);

    gain.gain.setValueAtTime(0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.12);
  }

  public playCrash() {
    if (this.muted) return;
    this.initCtx();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(200, now);
    osc.frequency.exponentialRampToValueAtTime(40, now + 0.4);

    gain.gain.setValueAtTime(0.35, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.4);
  }
}

const audioSynth = new RunnerAudioEngine();

// ==========================================
// 2. MAIN RUNNER COMPONENT
// ==========================================
export default function SynthwaveVelocityRunnerGame() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [gameState, setGameState] = useState<"menu" | "playing" | "paused" | "gameover">("menu");
  const [distance, setDistance] = useState(0);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [nitro, setNitro] = useState(100);
  const [speed, setSpeed] = useState(120);

  // Player Lane Position (0: Left, 1: Center, 2: Right)
  const laneRef = useRef<number>(1);
  const targetXRef = useRef<number>(640);
  const currentXRef = useRef<number>(640);

  // Objects & Highway Grid state
  const obstaclesRef = useRef<{ id: string; lane: number; z: number; type: "barrier" | "mine" }[]>([]);
  const ringsRef = useRef<{ id: string; lane: number; z: number }[]>([]);
  const isBoostingRef = useRef(false);

  // Load High Score
  useEffect(() => {
    const saved = localStorage.getItem("synthwave_velocity_highscore");
    if (saved) setHighScore(parseInt(saved, 10));
  }, []);

  // Controls Setup
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (gameState !== "playing") return;

      if ((e.code === "KeyA" || e.code === "ArrowLeft") && laneRef.current > 0) {
        laneRef.current -= 1;
        audioSynth.playEngine();
      }
      if ((e.code === "KeyD" || e.code === "ArrowRight") && laneRef.current < 2) {
        laneRef.current += 1;
        audioSynth.playEngine();
      }
      if (e.code === "Space" && nitro > 10) {
        isBoostingRef.current = true;
        audioSynth.playBoost();
      }
      if (e.code === "KeyP" || e.code === "Escape") {
        setGameState((prev) => (prev === "playing" ? "paused" : prev === "paused" ? "playing" : prev));
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === "Space") {
        isBoostingRef.current = false;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [gameState, nitro]);

  // MAIN 60 FPS ENGINE LOOP
  useEffect(() => {
    if (gameState !== "playing") return;

    let animId: number;
    let lastTime = performance.now();
    let gridOffset = 0;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const lanePositions = [380, 640, 900];

    const gameLoop = (now: number) => {
      const delta = Math.min((now - lastTime) / 1000, 0.1);
      lastTime = now;

      // 1. Calculate Speed & Boosting
      const currentSpeed = isBoostingRef.current ? 240 : 140;
      setSpeed(currentSpeed);

      if (isBoostingRef.current) {
        setNitro((n) => Math.max(0, n - delta * 30));
        if (nitro <= 0) isBoostingRef.current = false;
      } else {
        setNitro((n) => Math.min(100, n + delta * 10));
      }

      // Smooth Lane Interpolation
      targetXRef.current = lanePositions[laneRef.current];
      currentXRef.current += (targetXRef.current - currentXRef.current) * 0.2;

      gridOffset = (gridOffset + currentSpeed * delta * 2) % 60;
      setDistance((d) => d + Math.floor(currentSpeed * delta));
      setScore((s) => s + Math.floor((currentSpeed / 10) * (isBoostingRef.current ? 2 : 1)));

      // 2. Object Spawning
      if (Math.random() < 0.04) {
        obstaclesRef.current.push({
          id: Math.random().toString(),
          lane: Math.floor(Math.random() * 3),
          z: 1000,
          type: Math.random() < 0.5 ? "barrier" : "mine"
        });
      }

      if (Math.random() < 0.05) {
        ringsRef.current.push({
          id: Math.random().toString(),
          lane: Math.floor(Math.random() * 3),
          z: 1000
        });
      }

      // Update Z position of objects
      const zSpeed = currentSpeed * 1.5 * delta * 10;

      obstaclesRef.current.forEach((obs) => (obs.z -= zSpeed));
      ringsRef.current.forEach((ring) => (ring.z -= zSpeed));

      // 3. Collision Checks (z close to 0)
      obstaclesRef.current.forEach((obs) => {
        if (obs.z < 60 && obs.z > 0 && obs.lane === laneRef.current) {
          audioSynth.playCrash();
          setGameState("gameover");
        }
      });

      ringsRef.current.forEach((ring) => {
        if (ring.z < 60 && ring.z > 0 && ring.lane === laneRef.current) {
          audioSynth.playRing();
          ring.z = -100; // Mark collected
          setScore((s) => s + 250);
          setNitro((n) => Math.min(100, n + 20));
        }
      });

      // Filter out off-screen objects
      obstaclesRef.current = obstaclesRef.current.filter((obs) => obs.z > 0);
      ringsRef.current = ringsRef.current.filter((ring) => ring.z > 0);

      // ==========================================
      // RENDER PHASE (Pseudo-3D Highway)
      // ==========================================
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw Horizon Sun
      const horizonY = 320;
      const gradient = ctx.createLinearGradient(0, 0, 0, horizonY);
      gradient.addColorStop(0, "#09090b");
      gradient.addColorStop(1, "#3b0764");
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, horizonY);

      // Neon Sun Disk
      ctx.fillStyle = "#f43f5e";
      ctx.shadowColor = "#f43f5e";
      ctx.shadowBlur = 30;
      ctx.beginPath();
      ctx.arc(640, 220, 90, 0, Math.PI * 2);
      ctx.fill();

      // Highway Grid Surface
      ctx.fillStyle = "#030712";
      ctx.fillRect(0, horizonY, canvas.width, canvas.height - horizonY);

      // Perspective Grid Lines
      ctx.strokeStyle = "rgba(236, 72, 153, 0.4)";
      ctx.lineWidth = 2;

      // Vertical perspective lines
      for (let x = -600; x <= 1800; x += 150) {
        ctx.beginPath();
        ctx.moveTo(640 + (x - 640) * 0.1, horizonY);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
      }

      // Horizontal moving grid lines
      for (let z = 0; z < canvas.height - horizonY; z += 30) {
        const lineY = horizonY + Math.pow(z / (canvas.height - horizonY), 1.8) * (canvas.height - horizonY);
        ctx.beginPath();
        ctx.moveTo(0, lineY);
        ctx.lineTo(canvas.width, lineY);
        ctx.stroke();
      }

      // Draw Rings
      ringsRef.current.forEach((ring) => {
        const scale = 1 - ring.z / 1000;
        const renderX = 640 + (lanePositions[ring.lane] - 640) * scale;
        const renderY = horizonY + (canvas.height - horizonY - 40) * scale;

        ctx.strokeStyle = "#38bdf8";
        ctx.shadowColor = "#38bdf8";
        ctx.shadowBlur = 20;
        ctx.lineWidth = 4 * scale;
        ctx.beginPath();
        ctx.arc(renderX, renderY, 30 * scale, 0, Math.PI * 2);
        ctx.stroke();
      });

      // Draw Obstacles
      obstaclesRef.current.forEach((obs) => {
        const scale = 1 - obs.z / 1000;
        const renderX = 640 + (lanePositions[obs.lane] - 640) * scale;
        const renderY = horizonY + (canvas.height - horizonY - 40) * scale;

        ctx.fillStyle = "#ef4444";
        ctx.shadowColor = "#f43f5e";
        ctx.shadowBlur = 25;
        ctx.fillRect(renderX - 40 * scale, renderY - 30 * scale, 80 * scale, 40 * scale);
      });

      // Draw Cyber Supercar
      const playerY = canvas.height - 100;
      ctx.fillStyle = isBoostingRef.current ? "#38bdf8" : "#ec4899";
      ctx.shadowColor = isBoostingRef.current ? "#38bdf8" : "#ec4899";
      ctx.shadowBlur = 25;
      ctx.fillRect(currentXRef.current - 45, playerY, 90, 45);

      // Tail Lights
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(currentXRef.current - 35, playerY + 38, 20, 6);
      ctx.fillRect(currentXRef.current + 15, playerY + 38, 20, 6);

      animId = requestAnimationFrame(gameLoop);
    };

    animId = requestAnimationFrame(gameLoop);
    return () => cancelAnimationFrame(animId);
  }, [gameState, nitro]);

  return (
    <div className="fixed inset-0 z-[400] bg-zinc-950 text-white font-sans overflow-hidden select-none">
      <canvas ref={canvasRef} width={1280} height={720} className="w-full h-full object-cover block" />

      {/* LIVE HUD */}
      {gameState === "playing" && (
        <div className="absolute inset-0 pointer-events-none p-6 flex justify-between items-start z-10">
          <div className="bg-black/70 backdrop-blur-xl border border-white/10 p-4 rounded-2xl space-y-2 pointer-events-auto shadow-2xl">
            <div className="text-xs font-black uppercase text-pink-400">VELOCITY HIGHWAY</div>
            <div className="text-3xl font-black italic tracking-tighter text-white">{score} PTS</div>
            <div className="text-xs font-bold text-white/60">Distance: {distance}m</div>
          </div>

          <div className="flex items-center gap-4 pointer-events-auto">
            <div className="bg-black/70 backdrop-blur-xl border border-white/10 p-3 rounded-2xl flex items-center gap-3">
              <Flame className="w-5 h-5 text-cyan-400" />
              <div className="w-32 bg-zinc-900 h-3 rounded-full overflow-hidden border border-white/10">
                <div className="bg-cyan-400 h-full transition-all" style={{ width: `${nitro}%` }} />
              </div>
            </div>
            <button
              onClick={() => setGameState("paused")}
              className="w-10 h-10 rounded-2xl bg-black/70 border border-white/10 flex items-center justify-center hover:bg-white/20"
            >
              <Pause className="w-5 h-5 text-white" />
            </button>
          </div>
        </div>
      )}

      {/* START MENU */}
      {gameState === "menu" && (
        <div className="absolute inset-0 z-50 bg-black/90 backdrop-blur-2xl flex flex-col items-center justify-center p-8 text-center space-y-6">
          <h1 className="text-6xl font-black italic tracking-tighter uppercase bg-gradient-to-r from-pink-500 via-rose-400 to-cyan-400 bg-clip-text text-transparent">
            SYNTHWAVE VELOCITY RUNNER
          </h1>
          <p className="text-white/70 max-w-md">High-speed 3D perspective synthwave highway runner. Dodge barriers, collect energy rings, and hit nitro boost.</p>
          <button
            onClick={() => {
              setScore(0);
              setDistance(0);
              setNitro(100);
              setGameState("playing");
            }}
            className="px-10 py-5 bg-pink-500 rounded-full font-black text-lg uppercase tracking-widest hover:scale-105 shadow-[0_0_40px_rgba(236,72,153,0.5)]"
          >
            Start Race
          </button>
          <Link href="/games" className="text-xs font-black uppercase text-white/40 hover:text-white flex items-center gap-2 pt-4">
            <ArrowLeft className="w-4 h-4" /> Return to Games Hub
          </Link>
        </div>
      )}
    </div>
  );
}
