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
  Sliders,
  ShoppingBag,
  Clock,
  Gauge,
  Compass,
  Trophy,
  ShieldAlert
} from "lucide-react";
import confetti from "canvas-confetti";

// ==========================================
// TYPES & INTERFACES
// ==========================================
export interface Hovercraft {
  x: number;
  y: number;
  vx: number;
  vy: number;
  angle: number;
  angularVelocity: number;
  nitro: number;
  maxNitro: number;
  speed: number;
  topSpeed: number;
  accel: number;
  isGrounded: boolean;
  score: number;
}

export interface TrackSegment {
  x: number;
  y: number;
  w: number;
  h: number;
  type: "flat" | "boost" | "ramp" | "hazard";
}

// ==========================================
// MAIN COMPONENT
// ==========================================
export default function GravityRacerGame() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [gameState, setGameState] = useState<"menu" | "playing" | "paused" | "finish" | "garage">("menu");
  const [trackDistance, setTrackDistance] = useState(0);
  const [bestTime, setBestTime] = useState(0);
  const [credits, setCredits] = useState(200);
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Upgrades
  const [upgrades, setUpgrades] = useState<Record<string, number>>({
    topSpeed: 0,
    acceleration: 0,
    nitroCapacity: 0
  });

  const craftRef = useRef<Hovercraft>({
    x: 80,
    y: 480,
    vx: 0,
    vy: 0,
    angle: 0,
    angularVelocity: 0,
    nitro: 100,
    maxNitro: 100,
    speed: 0,
    topSpeed: 14,
    accel: 0.3,
    isGrounded: false,
    score: 0
  });

  const keysRef = useRef<Record<string, boolean>>({});
  const audioCtxRef = useRef<AudioContext | null>(null);

  // Track Layout Generator
  const trackRef = useRef<TrackSegment[]>([
    { x: 0, y: 520, w: 1200, h: 80, type: "flat" },
    { x: 1200, y: 520, w: 200, h: 80, type: "boost" },
    { x: 1400, y: 460, w: 300, h: 140, type: "ramp" },
    { x: 1700, y: 520, w: 1500, h: 80, type: "flat" },
    { x: 3200, y: 520, w: 200, h: 80, type: "boost" },
    { x: 3400, y: 520, w: 1000, h: 80, type: "flat" }
  ]);

  // Audio Synthesizer
  const playSound = useCallback((type: "engine" | "nitro" | "boost" | "crash" | "win") => {
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

      if (type === "nitro") {
        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(300, now);
        osc.frequency.linearRampToValueAtTime(900, now + 0.2);
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

  const startRace = () => {
    const bonusSpeed = (upgrades.topSpeed || 0) * 3;
    const bonusAccel = (upgrades.acceleration || 0) * 0.1;

    craftRef.current = {
      x: 80,
      y: 480,
      vx: 0,
      vy: 0,
      angle: 0,
      angularVelocity: 0,
      nitro: 100,
      maxNitro: 100,
      speed: 0,
      topSpeed: 14 + bonusSpeed,
      accel: 0.3 + bonusAccel,
      isGrounded: false,
      score: 0
    };

    setTrackDistance(0);
    setGameState("playing");
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

      if (gameState === "playing") {
        const c = craftRef.current;
        const keys = keysRef.current;

        // Acceleration & Controls
        if (keys["KeyD"] || keys["ArrowRight"]) {
          c.vx += c.accel;
        } else {
          c.vx *= 0.98;
        }

        // Nitro Boost
        if ((keys["Space"] || keys["ShiftLeft"]) && c.nitro > 0) {
          c.vx += 0.6;
          c.nitro -= 0.8;
          playSound("nitro");
        } else {
          c.nitro = Math.min(c.maxNitro, c.nitro + 0.1);
        }

        // Gravity & Physics
        c.vy += 0.4;
        c.x += c.vx;
        c.y += c.vy;

        // Floor ground check
        if (c.y > 480) {
          c.y = 480;
          c.vy = 0;
          c.isGrounded = true;
        }

        setTrackDistance(Math.floor(c.x));

        // Check Race Finish (4400m)
        if (c.x > 4400) {
          confetti({ particleCount: 100, spread: 70 });
          setGameState("finish");
        }
      }

      const cameraX = craftRef.current.x - 150;

      // Draw Track Segments
      ctx.save();
      ctx.translate(-cameraX, 0);

      trackRef.current.forEach(seg => {
        ctx.fillStyle = seg.type === "boost" ? "#eab308" : "#1e293b";
        ctx.fillRect(seg.x, seg.y, seg.w, seg.h);
        ctx.strokeStyle = "#00f0ff";
        ctx.lineWidth = 2;
        ctx.strokeRect(seg.x, seg.y, seg.w, seg.h);
      });

      // Draw Hovercraft
      const c = craftRef.current;
      ctx.save();
      ctx.translate(c.x, c.y);
      ctx.shadowBlur = 12;
      ctx.shadowColor = "#00f0ff";
      ctx.fillStyle = "#00f0ff";
      ctx.fillRect(-20, -10, 40, 20);
      ctx.restore();

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
              <div className="text-xs font-mono font-bold text-amber-400">GRAVITY TRACK 2099</div>
              <div className="text-xl font-black font-mono text-white">{trackDistance}m / 4400m</div>
            </div>

            {/* Nitro Gauge */}
            <div className="w-48">
              <div className="flex justify-between text-xs font-mono mb-1 text-cyan-400">
                <span>NITRO BOOST</span>
                <span>{Math.floor(craftRef.current.nitro)}%</span>
              </div>
              <div className="h-2.5 bg-slate-900 border border-cyan-500/30 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 transition-all duration-100"
                  style={{ width: `${craftRef.current.nitro}%` }}
                />
              </div>
            </div>
          </div>
        )}

        {/* MAIN MENU */}
        {gameState === "menu" && (
          <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-md flex flex-col items-center justify-center p-8 text-center">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-amber-500 to-rose-600 flex items-center justify-center shadow-xl shadow-amber-500/30 mb-6">
              <Gauge className="w-8 h-8 text-white" />
            </div>

            <h1 className="text-4xl font-black text-white mb-2 tracking-tight">
              GRAVITY <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-rose-500">RACER 2099</span>
            </h1>
            <p className="text-slate-400 max-w-md text-sm mb-8">
              2D physics hovercraft racing & stunt trials. Balance anti-gravity thrust, activate nitro boosts, and beat time trials.
            </p>

            <button
              onClick={startRace}
              className="w-64 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-rose-600 text-slate-950 font-bold text-sm shadow-lg shadow-amber-500/20 hover:opacity-95 transition-all flex items-center justify-center gap-2"
            >
              <Play className="w-4 h-4 fill-current" /> START SPEED RACE
            </button>
          </div>
        )}

        {/* FINISH SCREEN */}
        {gameState === "finish" && (
          <div className="absolute inset-0 bg-slate-950/95 backdrop-blur-md flex flex-col items-center justify-center p-8 text-center">
            <div className="w-16 h-16 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 mb-4">
              <Trophy className="w-8 h-8" />
            </div>

            <h2 className="text-3xl font-black text-white mb-1">RACE FINISHED!</h2>
            <p className="text-slate-400 text-xs mb-6">Completed 4400m speed track</p>

            <button
              onClick={startRace}
              className="w-64 py-3 rounded-xl bg-amber-500 text-slate-950 font-bold text-sm"
            >
              RETRY TRACK
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
