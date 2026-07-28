"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Trophy,
  Play,
  RotateCcw,
  Volume2,
  VolumeX,
  ArrowLeft,
  Zap,
  Gauge,
  Clock,
  Award,
  Flame,
  ChevronRight
} from "lucide-react";
import Link from "next/link";

// ==========================================
// 1. WEB AUDIO SYNTH SFX ENGINE
// ==========================================
class RacerAudioEngine {
  ctx: AudioContext | null = null;
  muted: boolean = false;
  engineOsc: OscillatorNode | null = null;
  engineGain: GainNode | null = null;

  init() {
    if (!this.ctx && typeof window !== "undefined") {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) this.ctx = new AudioCtx();
    }
    if (this.ctx && this.ctx.state === "suspended") {
      this.ctx.resume();
    }
  }

  startEngine() {
    if (this.muted) return;
    this.init();
    if (!this.ctx || this.engineOsc) return;

    this.engineOsc = this.ctx.createOscillator();
    this.engineGain = this.ctx.createGain();
    this.engineOsc.type = "sawtooth";
    this.engineOsc.frequency.setValueAtTime(60, this.ctx.currentTime);
    this.engineGain.gain.setValueAtTime(0.05, this.ctx.currentTime);

    this.engineOsc.connect(this.engineGain);
    this.engineGain.connect(this.ctx.destination);
    this.engineOsc.start();
  }

  setEngineSpeed(speedRatio: number) {
    if (this.engineOsc && this.ctx) {
      const freq = 60 + speedRatio * 220;
      this.engineOsc.frequency.setTargetAtTime(freq, this.ctx.currentTime, 0.05);
    }
  }

  stopEngine() {
    if (this.engineOsc) {
      try {
        this.engineOsc.stop();
      } catch (e) {}
      this.engineOsc = null;
    }
  }

  playBoost() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(200, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(1000, this.ctx.currentTime + 0.3);

    gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.3);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.3);
  }

  playLap() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    [523.25, 659.25, 783.99, 1046.5].forEach((freq, idx) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(freq, now + idx * 0.08);
      gain.gain.setValueAtTime(0.2, now + idx * 0.08);
      gain.gain.exponentialRampToValueAtTime(0.01, now + idx * 0.08 + 0.25);
      osc.connect(gain);
      gain.connect(this.ctx!.destination);
      osc.start(now + idx * 0.08);
      osc.stop(now + idx * 0.08 + 0.25);
    });
  }
}

const audio = new RacerAudioEngine();

// ==========================================
// 2. MAIN RACER COMPONENT
// ==========================================
export default function CyberDriftRunner() {
  const [gameState, setGameState] = useState<"menu" | "playing" | "finished">("menu");
  const [lap, setLap] = useState(1);
  const [totalLaps] = useState(3);
  const [lapTime, setLapTime] = useState(0);
  const [bestLap, setBestLap] = useState<number | null>(null);
  const [speed, setSpeed] = useState(0);
  const [muted, setMuted] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const carRef = useRef({
    x: 120,
    y: 240,
    angle: 0,
    speed: 0,
    maxSpeed: 7,
    accel: 0.15,
    friction: 0.98,
    turnSpeed: 0.05
  });

  const keysRef = useRef<{ [key: string]: boolean }>({});

  const toggleMute = () => {
    setMuted(!muted);
    audio.muted = !muted;
  };

  const startRace = () => {
    setLap(1);
    setLapTime(0);
    setSpeed(0);
    carRef.current = {
      x: 120,
      y: 240,
      angle: 0,
      speed: 0,
      maxSpeed: 7,
      accel: 0.15,
      friction: 0.98,
      turnSpeed: 0.05
    };
    audio.startEngine();
    setGameState("playing");
  };

  // Key Listeners
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

  // Main Physics & Canvas Loop
  useEffect(() => {
    if (gameState !== "playing") return;

    let animId: number;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let timerInterval = setInterval(() => {
      setLapTime((t) => t + 0.1);
    }, 100);

    const gameLoop = () => {
      const car = carRef.current;

      // Steering
      if (keysRef.current["KeyA"] || keysRef.current["ArrowLeft"]) {
        car.angle -= car.turnSpeed * (car.speed / car.maxSpeed);
      }
      if (keysRef.current["KeyD"] || keysRef.current["ArrowRight"]) {
        car.angle += car.turnSpeed * (car.speed / car.maxSpeed);
      }

      // Acceleration / Braking
      if (keysRef.current["KeyW"] || keysRef.current["ArrowUp"]) {
        car.speed = Math.min(car.maxSpeed, car.speed + car.accel);
      } else if (keysRef.current["KeyS"] || keysRef.current["ArrowDown"]) {
        car.speed = Math.max(-2, car.speed - car.accel);
      } else {
        car.speed *= car.friction;
      }

      setSpeed(Math.round(car.speed * 20));
      audio.setEngineSpeed(car.speed / car.maxSpeed);

      // Move Position
      car.x += Math.cos(car.angle) * car.speed;
      car.y += Math.sin(car.angle) * car.speed;

      // Wrap around canvas edges for continuous track loop
      if (car.x < 0) car.x = canvas.width;
      if (car.x > canvas.width) car.x = 0;
      if (car.y < 0) car.y = canvas.height;
      if (car.y > canvas.height) car.y = 0;

      // Checkpoint / Lap Crossing (Start/Finish line at x=120, y=240)
      if (Math.hypot(car.x - 120, car.y - 240) < 30 && car.speed > 2) {
        audio.playLap();
        setLap((l) => {
          if (l >= totalLaps) {
            audio.stopEngine();
            setGameState("finished");
            return l;
          }
          return l + 1;
        });
      }

      // Render Track & Car
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Oval Circuit Track
      ctx.strokeStyle = "#1e293b";
      ctx.lineWidth = 100;
      ctx.beginPath();
      ctx.ellipse(canvas.width / 2, canvas.height / 2, 300, 160, 0, 0, Math.PI * 2);
      ctx.stroke();

      ctx.strokeStyle = "#38bdf8";
      ctx.lineWidth = 4;
      ctx.shadowColor = "#38bdf8";
      ctx.shadowBlur = 10;
      ctx.stroke();
      ctx.shadowBlur = 0;

      // Finish Line
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(110, 210, 20, 60);

      // Render Car
      ctx.save();
      ctx.translate(car.x, car.y);
      ctx.rotate(car.angle);

      ctx.fillStyle = "#f43f5e";
      ctx.shadowColor = "#f43f5e";
      ctx.shadowBlur = 12;
      ctx.fillRect(-15, -8, 30, 16);
      ctx.shadowBlur = 0;

      ctx.fillStyle = "#38bdf8";
      ctx.fillRect(0, -6, 8, 12);
      ctx.restore();

      animId = requestAnimationFrame(gameLoop);
    };

    animId = requestAnimationFrame(gameLoop);
    return () => {
      cancelAnimationFrame(animId);
      clearInterval(timerInterval);
    };
  }, [gameState, totalLaps]);

  return (
    <div className="relative w-full h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-4 font-sans select-none overflow-hidden">
      <div className="relative bg-slate-900 border-2 border-slate-800 rounded-2xl p-6 shadow-2xl flex flex-col items-center gap-4 max-w-4xl w-full">
        {/* HUD Top Bar */}
        <div className="w-full flex items-center justify-between bg-slate-950 p-4 rounded-xl border border-slate-800">
          <div className="flex items-center gap-6 text-xs font-bold">
            <span className="text-sky-400">LAP {lap} / {totalLaps}</span>
            <span className="text-amber-400 font-mono">TIME: {lapTime.toFixed(1)}s</span>
            <span className="text-rose-400">SPEED: {speed} KM/H</span>
          </div>

          <button onClick={toggleMute} className="p-2 bg-slate-800 rounded-lg">
            {muted ? <VolumeX className="w-4 h-4 text-slate-400" /> : <Volume2 className="w-4 h-4 text-sky-400" />}
          </button>
        </div>

        {/* START MENU */}
        {gameState === "menu" && (
          <div className="py-12 text-center">
            <span className="px-4 py-1.5 rounded-full bg-sky-500/10 border border-sky-500/30 text-sky-400 text-xs font-bold uppercase mb-6">
              2D SYNTHWAVE DRIFT RACER
            </span>
            <h1 className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-sky-400 via-indigo-300 to-rose-400 mb-4">
              CYBER DRIFT RUNNER
            </h1>
            <p className="text-slate-400 text-xs max-w-md mx-auto mb-8">
              Master top-down drift physics, steer through neon circuits, and set high-speed lap records.
            </p>

            <button
              onClick={startRace}
              className="px-8 py-4 bg-sky-500 hover:bg-sky-400 font-bold text-white rounded-xl shadow-lg shadow-sky-500/25 mb-4"
            >
              START RACE
            </button>
          </div>
        )}

        {/* RACER CANVAS */}
        {gameState === "playing" && (
          <canvas
            ref={canvasRef}
            width={800}
            height={480}
            className="block rounded-xl border border-slate-800 bg-slate-950"
          />
        )}

        {/* FINISHED OVERLAY */}
        {gameState === "finished" && (
          <div className="py-8 text-center">
            <Award className="w-12 h-12 text-amber-400 mx-auto mb-4" />
            <h2 className="text-3xl font-black mb-2">RACE FINISHED!</h2>
            <p className="text-xs text-slate-400 mb-6">Total Time: {lapTime.toFixed(1)} seconds.</p>
            <button onClick={startRace} className="px-8 py-3 bg-sky-500 font-bold rounded-xl">RACE AGAIN</button>
          </div>
        )}
      </div>
    </div>
  );
}
