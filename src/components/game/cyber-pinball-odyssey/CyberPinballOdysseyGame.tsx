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
  Activity,
  CircleDot
} from "lucide-react";
import Link from "next/link";

// ==========================================
// 1. PROCEDURAL AUDIO SYNTH
// ==========================================
class PinballAudioEngine {
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

  public playBumper() {
    if (this.muted) return;
    this.initCtx();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(600, now);
    osc.frequency.exponentialRampToValueAtTime(1200, now + 0.1);

    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.1);
  }

  public playFlipper() {
    if (this.muted) return;
    this.initCtx();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = "triangle";
    osc.frequency.setValueAtTime(200, now);
    osc.frequency.exponentialRampToValueAtTime(80, now + 0.08);

    gain.gain.setValueAtTime(0.25, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.08);
  }

  public playDrain() {
    if (this.muted) return;
    this.initCtx();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(300, now);
    osc.frequency.exponentialRampToValueAtTime(50, now + 0.3);

    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.3);
  }
}

const audioSynth = new PinballAudioEngine();

// ==========================================
// 2. MAIN PINBALL COMPONENT
// ==========================================
export default function CyberPinballOdysseyGame() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [gameState, setGameState] = useState<"menu" | "playing" | "paused" | "gameover">("menu");
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [multiplier, setMultiplier] = useState(1);
  const [ballsLeft, setBallsLeft] = useState(3);

  // Ball physics state
  const ballsRef = useRef<{ x: number; y: number; vx: number; vy: number; radius: number }[]>([
    { x: 580, y: 600, vx: 0, vy: -18, radius: 10 }
  ]);

  // Flippers
  const leftFlipperAngle = useRef(0.3); // radians
  const rightFlipperAngle = useRef(-0.3);

  const keys = useRef<{ [key: string]: boolean }>({});

  // Load High Score
  useEffect(() => {
    const saved = localStorage.getItem("cyber_pinball_highscore");
    if (saved) setHighScore(parseInt(saved, 10));
  }, []);

  // Controls Setup
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      keys.current[e.code] = true;
      if (gameState === "playing") {
        if (e.code === "KeyA" || e.code === "ArrowLeft") audioSynth.playFlipper();
        if (e.code === "KeyD" || e.code === "ArrowRight") audioSynth.playFlipper();
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
  }, [gameState]);

  // MAIN 60 FPS PHYSICS ENGINE LOOP
  useEffect(() => {
    if (gameState !== "playing") return;

    let animId: number;
    let lastTime = performance.now();

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Table Bumpers (X, Y, Radius)
    const bumpers = [
      { x: 220, y: 220, r: 28, color: "#f43f5e", score: 100 },
      { x: 380, y: 220, r: 28, color: "#38bdf8", score: 100 },
      { x: 300, y: 320, r: 35, color: "#a855f7", score: 250 }
    ];

    const gameLoop = (now: number) => {
      const delta = Math.min((now - lastTime) / 1000, 0.1);
      lastTime = now;

      // 1. Update Flippers Angle
      const isLeftUp = keys.current["KeyA"] || keys.current["ArrowLeft"];
      const isRightUp = keys.current["KeyD"] || keys.current["ArrowRight"];

      leftFlipperAngle.current += (isLeftUp ? -0.7 - leftFlipperAngle.current : 0.3 - leftFlipperAngle.current) * 0.4;
      rightFlipperAngle.current += (isRightUp ? 0.7 - rightFlipperAngle.current : -0.3 - rightFlipperAngle.current) * 0.4;

      // 2. Physics Update for Balls
      ballsRef.current.forEach((ball) => {
        ball.vy += 16 * delta; // Gravity
        ball.x += ball.vx;
        ball.y += ball.vy;

        // Table Wall Bounce (Left/Right)
        if (ball.x - ball.radius < 40) {
          ball.x = 40 + ball.radius;
          ball.vx = Math.abs(ball.vx) * 0.85;
        }
        if (ball.x + ball.radius > 560) {
          ball.x = 560 - ball.radius;
          ball.vx = -Math.abs(ball.vx) * 0.85;
        }

        // Top Arch Wall Bounce
        if (ball.y - ball.radius < 40) {
          ball.y = 40 + ball.radius;
          ball.vy = Math.abs(ball.vy) * 0.85;
        }

        // Bumper Collisions
        bumpers.forEach((bump) => {
          const dist = Math.hypot(ball.x - bump.x, ball.y - bump.y);
          if (dist < ball.radius + bump.r) {
            audioSynth.playBumper();
            const angle = Math.atan2(ball.y - bump.y, ball.x - bump.x);
            ball.vx = Math.cos(angle) * 12;
            ball.vy = Math.sin(angle) * 12;
            setScore((s) => s + bump.score * multiplier);
          }
        });

        // Drain Check (Bottom Out)
        if (ball.y > 680) {
          audioSynth.playDrain();
          ball.x = 580;
          ball.y = 600;
          ball.vx = 0;
          ball.vy = -18; // Re-launch
          setBallsLeft((b) => {
            if (b - 1 <= 0) {
              setGameState("gameover");
              return 0;
            }
            return b - 1;
          });
        }
      });

      // ==========================================
      // RENDER PHASE
      // ==========================================
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Table Cabinet Outer Outline
      ctx.strokeStyle = "rgba(56, 189, 248, 0.3)";
      ctx.lineWidth = 4;
      ctx.strokeRect(40, 40, 520, 640);

      // Render Bumpers
      bumpers.forEach((bump) => {
        ctx.fillStyle = bump.color;
        ctx.shadowColor = bump.color;
        ctx.shadowBlur = 20;
        ctx.beginPath();
        ctx.arc(bump.x, bump.y, bump.r, 0, Math.PI * 2);
        ctx.fill();
      });

      // Render Left Flipper
      ctx.save();
      ctx.translate(180, 580);
      ctx.rotate(leftFlipperAngle.current);
      ctx.fillStyle = "#38bdf8";
      ctx.shadowColor = "#38bdf8";
      ctx.shadowBlur = 15;
      ctx.fillRect(0, -8, 100, 16);
      ctx.restore();

      // Render Right Flipper
      ctx.save();
      ctx.translate(420, 580);
      ctx.rotate(rightFlipperAngle.current);
      ctx.fillStyle = "#38bdf8";
      ctx.shadowColor = "#38bdf8";
      ctx.shadowBlur = 15;
      ctx.fillRect(-100, -8, 100, 16);
      ctx.restore();

      // Render Balls
      ballsRef.current.forEach((ball) => {
        ctx.fillStyle = "#ffffff";
        ctx.shadowColor = "#ffffff";
        ctx.shadowBlur = 15;
        ctx.beginPath();
        ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
        ctx.fill();
      });

      animId = requestAnimationFrame(gameLoop);
    };

    animId = requestAnimationFrame(gameLoop);
    return () => cancelAnimationFrame(animId);
  }, [gameState, multiplier]);

  return (
    <div className="fixed inset-0 z-[400] bg-zinc-950 text-white font-sans overflow-hidden select-none flex flex-col items-center justify-center">
      {/* HUD Header */}
      {gameState === "playing" && (
        <div className="w-full max-w-xl p-4 flex justify-between items-center z-10">
          <div>
            <div className="text-xs font-black uppercase text-purple-400">CYBER PINBALL</div>
            <div className="text-3xl font-black italic text-white">{score} PTS</div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-xs font-bold text-cyan-400">Balls Left: {ballsLeft}</div>
            <button
              onClick={() => setGameState("paused")}
              className="w-10 h-10 rounded-2xl bg-black/70 border border-white/10 flex items-center justify-center hover:bg-white/20"
            >
              <Pause className="w-5 h-5 text-white" />
            </button>
          </div>
        </div>
      )}

      {/* PINBALL CANVAS */}
      {gameState === "playing" && (
        <div className="relative bg-black/80 p-4 rounded-3xl border border-white/10 shadow-2xl">
          <canvas ref={canvasRef} width={600} height={700} className="block rounded-2xl" />
        </div>
      )}

      {/* START MENU */}
      {gameState === "menu" && (
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-6">
          <h1 className="text-6xl font-black italic tracking-tighter uppercase bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 bg-clip-text text-transparent">
            CYBER PINBALL ODYSSEY
          </h1>
          <p className="text-white/70 max-w-md">Cyberpunk 2D physics pinball arcade. Trigger bumpers, quantum multipliers, and multiballs.</p>
          <button
            onClick={() => {
              setScore(0);
              setBallsLeft(3);
              setGameState("playing");
            }}
            className="px-10 py-5 bg-purple-600 rounded-full font-black text-lg uppercase tracking-widest hover:scale-105 shadow-[0_0_40px_rgba(147,51,234,0.5)]"
          >
            Launch Ball
          </button>
          <Link href="/games" className="text-xs font-black uppercase text-white/40 hover:text-white flex items-center gap-2 pt-4">
            <ArrowLeft className="w-4 h-4" /> Return to Games Hub
          </Link>
        </div>
      )}
    </div>
  );
}
