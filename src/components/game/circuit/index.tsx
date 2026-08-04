"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Gauge,
  Zap,
  Shield,
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
  Compass,
  Flame,
  Flag
} from "lucide-react";
import Link from "next/link";
import { useUser, useFirestore, setDocumentNonBlocking } from "@/firebase";
import { doc, increment } from "firebase/firestore";

// ==========================================
// CIRCUIT RACING TYPES
// ==========================================

export type CircuitMode = "grand_prix" | "local_drift_duel";

export interface RaceCraft {
  id: string;
  name: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  angle: number;
  speed: number;
  maxSpeed: number;
  accel: number;
  friction: number;
  turnSpeed: number;
  boost: number;
  maxBoost: number;
  boosting: boolean;
  drifting: boolean;
  laps: number;
  checkpoint: number;
  color: string;
  lapTimes: number[];
}

export interface TrackCheckpoint {
  x: number;
  y: number;
  radius: number;
  index: number;
}

// ==========================================
// WEB AUDIO SYNTHESIZER
// ==========================================

class CircuitAudioSynth {
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

  playTurbo() {
    if (this.muted || !this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(300, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1200, this.ctx.currentTime + 0.3);

      gain.gain.setValueAtTime(0.25, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.3);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.3);
    } catch (e) {}
  }

  playCheckpoint() {
    if (this.muted || !this.ctx) return;
    try {
      [600, 800, 1000].forEach((freq, i) => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, this.ctx!.currentTime + i * 0.05);

        gain.gain.setValueAtTime(0.2, this.ctx!.currentTime + i * 0.05);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx!.currentTime + i * 0.05 + 0.12);

        osc.connect(gain);
        gain.connect(this.ctx!.destination);
        osc.start(this.ctx!.currentTime + i * 0.05);
        osc.stop(this.ctx!.currentTime + i * 0.05 + 0.12);
      });
    } catch (e) {}
  }

  playLapComplete() {
    if (this.muted || !this.ctx) return;
    try {
      [523.25, 659.25, 783.99, 1046.5].forEach((freq, i) => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();
        osc.type = "triangle";
        osc.frequency.setValueAtTime(freq, this.ctx!.currentTime + i * 0.08);

        gain.gain.setValueAtTime(0.25, this.ctx!.currentTime + i * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx!.currentTime + i * 0.08 + 0.2);

        osc.connect(gain);
        gain.connect(this.ctx!.destination);
        osc.start(this.ctx!.currentTime + i * 0.08);
        osc.stop(this.ctx!.currentTime + i * 0.08 + 0.2);
      });
    } catch (e) {}
  }
}

const audio = new CircuitAudioSynth();

// ==========================================
// CIRCUIT GAME COMPONENT
// ==========================================

export default function CircuitGame() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const { user } = useUser();
  const firestore = useFirestore();

  const [gameState, setGameState] = useState<"menu" | "playing" | "paused" | "game_over">("menu");
  const [mode, setMode] = useState<CircuitMode>("grand_prix");
  const [soundEnabled, setSoundEnabled] = useState(true);

  // HUD Metrics
  const [lapsP1, setLapsP1] = useState(0);
  const [lapsP2, setLapsP2] = useState(0);
  const [boostP1, setBoostP1] = useState(100);
  const [boostP2, setBoostP2] = useState(100);
  const [winnerName, setWinnerName] = useState<string | null>(null);

  const TOTAL_LAPS = 3;

  const engineRef = useRef({
    keys: {
      w: false, a: false, s: false, d: false, space: false,
      up: false, left: false, down: false, right: false, enter: false
    },
    p1: {
      id: "p1", name: user?.displayName || "Drift Racer 1", x: 250, y: 150, vx: 0, vy: 0, angle: 0,
      speed: 0, maxSpeed: 9.5, accel: 0.25, friction: 0.96, turnSpeed: 0.065, boost: 100, maxBoost: 100,
      boosting: false, drifting: false, laps: 0, checkpoint: 0, color: "#3b82f6", lapTimes: []
    } as RaceCraft,
    p2: {
      id: "p2", name: mode === "local_drift_duel" ? "Drift Racer 2" : "Apex Rival AI", x: 250, y: 200, vx: 0, vy: 0, angle: 0,
      speed: 0, maxSpeed: 9.0, accel: 0.22, friction: 0.96, turnSpeed: 0.065, boost: 100, maxBoost: 100,
      boosting: false, drifting: false, laps: 0, checkpoint: 0, color: mode === "local_drift_duel" ? "#f43f5e" : "#eab308", lapTimes: []
    } as RaceCraft,
    checkpoints: [] as TrackCheckpoint[],
    skidmarks: [] as any[],
    particles: [] as any[]
  });

  const toggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    audio.muted = !next;
  };

  const dispatchScore = (finalScore: number) => {
    if (typeof window !== "undefined" && finalScore > 0) {
      const points = Math.floor(finalScore / 20) + 15;
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
            displayName: user.displayName || "Circuit Racer",
            points: increment(points),
            updatedAt: new Date().toISOString()
          },
          { merge: true }
        );
      }
    }
  };

  const initTrack = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const w = (canvas.width = canvas.parentElement?.clientWidth || window.innerWidth);
    const h = (canvas.height = canvas.parentElement?.clientHeight || window.innerHeight);

    const engine = engineRef.current;

    // Set Up Checkpoints in an Oval Race Track Path
    const checkpoints: TrackCheckpoint[] = [
      { x: w * 0.3, y: h * 0.2, radius: 80, index: 0 },
      { x: w * 0.7, y: h * 0.2, radius: 80, index: 1 },
      { x: w * 0.85, y: h * 0.5, radius: 80, index: 2 },
      { x: w * 0.7, y: h * 0.8, radius: 80, index: 3 },
      { x: w * 0.3, y: h * 0.8, radius: 80, index: 4 },
      { x: w * 0.15, y: h * 0.5, radius: 80, index: 5 }
    ];

    engine.p1 = {
      id: "p1", name: user?.displayName || "Drift Racer 1", x: w * 0.25, y: h * 0.2 - 20, vx: 0, vy: 0, angle: 0,
      speed: 0, maxSpeed: 9.5, accel: 0.25, friction: 0.96, turnSpeed: 0.065, boost: 100, maxBoost: 100,
      boosting: false, drifting: false, laps: 0, checkpoint: 0, color: "#3b82f6", lapTimes: []
    };

    engine.p2 = {
      id: "p2", name: mode === "local_drift_duel" ? "Drift Racer 2" : "Apex Rival AI", x: w * 0.25, y: h * 0.2 + 20, vx: 0, vy: 0, angle: 0,
      speed: 0, maxSpeed: 9.0, accel: 0.22, friction: 0.96, turnSpeed: 0.065, boost: 100, maxBoost: 100,
      boosting: false, drifting: false, laps: 0, checkpoint: 0, color: mode === "local_drift_duel" ? "#f43f5e" : "#eab308", lapTimes: []
    };

    engine.checkpoints = checkpoints;
    engine.skidmarks = [];
    engine.particles = [];

    setLapsP1(0);
    setLapsP2(0);
    setBoostP1(100);
    setBoostP2(100);
    setWinnerName(null);
  }, [mode, user]);

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
      const engine = engineRef.current;
      const keys = engine.keys;
      const p1 = engine.p1;
      const p2 = engine.p2;

      // P1 Physics Loop
      if (keys.a) p1.angle -= p1.turnSpeed;
      if (keys.d) p1.angle += p1.turnSpeed;

      if (keys.w) {
        p1.speed = Math.min(p1.maxSpeed, p1.speed + p1.accel);
      } else if (keys.s) {
        p1.speed = Math.max(-3, p1.speed - p1.accel);
      } else {
        p1.speed *= p1.friction;
      }

      // P1 Kinetic Turbo Boost
      if (keys.space && p1.boost > 0) {
        p1.speed = Math.min(p1.maxSpeed * 1.4, p1.speed + 0.4);
        p1.boost = Math.max(0, p1.boost - 1.5);
        p1.boosting = true;
        audio.playTurbo();
      } else {
        p1.boosting = false;
        p1.boost = Math.min(p1.maxBoost, p1.boost + 0.2);
      }
      setBoostP1(p1.boost);

      p1.vx = Math.cos(p1.angle) * p1.speed;
      p1.vy = Math.sin(p1.angle) * p1.speed;
      p1.x += p1.vx;
      p1.y += p1.vy;

      // Check Checkpoints P1
      const nextCpIdx = (p1.checkpoint + 1) % engine.checkpoints.length;
      const nextCp = engine.checkpoints[nextCpIdx];

      if (Math.hypot(p1.x - nextCp.x, p1.y - nextCp.y) < nextCp.radius) {
        p1.checkpoint = nextCpIdx;
        audio.playCheckpoint();

        if (nextCpIdx === 0) {
          p1.laps++;
          setLapsP1(p1.laps);
          audio.playLapComplete();

          if (p1.laps >= TOTAL_LAPS) {
            setWinnerName(p1.name);
            dispatchScore(2400);
            setGameState("game_over");
          }
        }
      }

      // P2 Local Duel or AI Control
      if (mode === "local_drift_duel") {
        if (keys.left) p2.angle -= p2.turnSpeed;
        if (keys.right) p2.angle += p2.turnSpeed;

        if (keys.up) {
          p2.speed = Math.min(p2.maxSpeed, p2.speed + p2.accel);
        } else if (keys.down) {
          p2.speed = Math.max(-3, p2.speed - p2.accel);
        } else {
          p2.speed *= p2.friction;
        }

        if (keys.enter && p2.boost > 0) {
          p2.speed = Math.min(p2.maxSpeed * 1.4, p2.speed + 0.4);
          p2.boost = Math.max(0, p2.boost - 1.5);
          p2.boosting = true;
          audio.playTurbo();
        } else {
          p2.boosting = false;
          p2.boost = Math.min(p2.maxBoost, p2.boost + 0.2);
        }
        setBoostP2(p2.boost);

        p2.vx = Math.cos(p2.angle) * p2.speed;
        p2.vy = Math.sin(p2.angle) * p2.speed;
        p2.x += p2.vx;
        p2.y += p2.vy;

        const p2NextCpIdx = (p2.checkpoint + 1) % engine.checkpoints.length;
        const p2NextCp = engine.checkpoints[p2NextCpIdx];

        if (Math.hypot(p2.x - p2NextCp.x, p2.y - p2NextCp.y) < p2NextCp.radius) {
          p2.checkpoint = p2NextCpIdx;
          if (p2NextCpIdx === 0) {
            p2.laps++;
            setLapsP2(p2.laps);
            if (p2.laps >= TOTAL_LAPS) {
              setWinnerName(p2.name);
              setGameState("game_over");
            }
          }
        }
      } else {
        // AI Steering toward next checkpoint
        const aiTarget = engine.checkpoints[(p2.checkpoint + 1) % engine.checkpoints.length];
        const targetAngle = Math.atan2(aiTarget.y - p2.y, aiTarget.x - p2.x);
        p2.angle += (targetAngle - p2.angle) * 0.08;
        p2.speed = Math.min(p2.maxSpeed * 0.85, p2.speed + p2.accel);

        p2.vx = Math.cos(p2.angle) * p2.speed;
        p2.vy = Math.sin(p2.angle) * p2.speed;
        p2.x += p2.vx;
        p2.y += p2.vy;

        if (Math.hypot(p2.x - aiTarget.x, p2.y - aiTarget.y) < aiTarget.radius) {
          p2.checkpoint = (p2.checkpoint + 1) % engine.checkpoints.length;
          if (p2.checkpoint === 0) {
            p2.laps++;
            setLapsP2(p2.laps);
            if (p2.laps >= TOTAL_LAPS) {
              setWinnerName("Apex Rival AI");
              setGameState("game_over");
            }
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

      ctx.fillStyle = "#090d16";
      ctx.fillRect(0, 0, w, h);

      // Draw Oval Race Circuit Track
      ctx.strokeStyle = "rgba(59, 130, 246, 0.15)";
      ctx.lineWidth = 120;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";

      ctx.beginPath();
      ctx.moveTo(engine.checkpoints[0].x, engine.checkpoints[0].y);
      for (let i = 1; i < engine.checkpoints.length; i++) {
        ctx.lineTo(engine.checkpoints[i].x, engine.checkpoints[i].y);
      }
      ctx.closePath();
      ctx.stroke();

      // Checkpoints Glowing Rings
      engine.checkpoints.forEach((cp, idx) => {
        ctx.save();
        ctx.shadowBlur = 15;
        ctx.shadowColor = "#3b82f6";

        ctx.strokeStyle = idx === 0 ? "#ef4444" : "rgba(59, 130, 246, 0.4)";
        ctx.lineWidth = idx === 0 ? 6 : 2;
        ctx.beginPath();
        ctx.arc(cp.x, cp.y, cp.radius, 0, Math.PI * 2);
        ctx.stroke();

        ctx.restore();
      });

      // Draw RaceCrafts (P1 and P2)
      [engine.p1, engine.p2].forEach(craft => {
        ctx.save();
        ctx.translate(craft.x, craft.y);
        ctx.rotate(craft.angle);

        ctx.shadowBlur = craft.boosting ? 25 : 12;
        ctx.shadowColor = craft.color;

        ctx.fillStyle = craft.color;
        ctx.beginPath();
        ctx.moveTo(18, 0);
        ctx.lineTo(-12, -10);
        ctx.lineTo(-6, 0);
        ctx.lineTo(-12, 10);
        ctx.closePath();
        ctx.fill();

        ctx.restore();
      });
    };

    animId = requestAnimationFrame(runLoop);
    return () => cancelAnimationFrame(animId);
  }, [gameState, mode]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      audio.init();
      const keys = engineRef.current.keys;
      if (e.key === "w" || e.key === "W") keys.w = true;
      if (e.key === "a" || e.key === "A") keys.a = true;
      if (e.key === "s" || e.key === "S") keys.s = true;
      if (e.key === "d" || e.key === "D") keys.d = true;
      if (e.key === " ") keys.space = true;

      if (e.key === "ArrowUp") keys.up = true;
      if (e.key === "ArrowLeft") keys.left = true;
      if (e.key === "ArrowDown") keys.down = true;
      if (e.key === "ArrowRight") keys.right = true;
      if (e.key === "Enter") keys.enter = true;
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const keys = engineRef.current.keys;
      if (e.key === "w" || e.key === "W") keys.w = false;
      if (e.key === "a" || e.key === "A") keys.a = false;
      if (e.key === "s" || e.key === "S") keys.s = false;
      if (e.key === "d" || e.key === "D") keys.d = false;
      if (e.key === " ") keys.space = false;

      if (e.key === "ArrowUp") keys.up = false;
      if (e.key === "ArrowLeft") keys.left = false;
      if (e.key === "ArrowDown") keys.down = false;
      if (e.key === "ArrowRight") keys.right = false;
      if (e.key === "Enter") keys.enter = false;
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, []);

  const startGame = (selectedMode: CircuitMode) => {
    setMode(selectedMode);
    initTrack();
    setGameState("playing");
  };

  return (
    <div className="w-full h-screen bg-[#090d16] text-white relative overflow-hidden font-sans select-none">
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full block" />

      <div className="absolute top-0 inset-x-0 p-4 flex justify-between items-center z-30 pointer-events-none">
        <Link
          href="/games"
          className="pointer-events-auto flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold"
        >
          <ArrowLeft className="w-4 h-4" /> Exit Circuit
        </Link>
        <button
          onClick={toggleSound}
          className="pointer-events-auto p-2 rounded-xl bg-white/5 border border-white/10"
        >
          {soundEnabled ? <Volume2 className="w-4 h-4 text-blue-400" /> : <VolumeX className="w-4 h-4 text-rose-400" />}
        </button>
      </div>

      {gameState === "playing" && (
        <div className="absolute top-4 inset-x-0 flex justify-center pointer-events-none z-20">
          <div className="bg-[#0b0f19]/90 border border-blue-500/30 px-8 py-3 rounded-2xl backdrop-blur-md flex items-center gap-8 pointer-events-auto">
            <div className="text-center">
              <div className="text-[10px] font-black uppercase text-white/40 tracking-wider">RACER 1 LAPS</div>
              <div className="text-xl font-black text-blue-400">{lapsP1} / {TOTAL_LAPS}</div>
            </div>

            <div className="text-center">
              <div className="text-[10px] font-black uppercase text-white/40 tracking-wider">RACER 2 LAPS</div>
              <div className="text-xl font-black text-rose-400">{lapsP2} / {TOTAL_LAPS}</div>
            </div>
          </div>
        </div>
      )}

      {gameState === "menu" && (
        <div className="absolute inset-0 z-40 bg-[#090d16]/95 backdrop-blur-xl flex flex-col items-center justify-center p-6">
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center max-w-xl mb-8">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 text-xs font-bold uppercase tracking-widest mb-3">
              <Gauge className="w-3.5 h-3.5" /> Top-Down Kinetic Circuit Racer
            </div>
            <h1 className="text-6xl font-black uppercase tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-rose-500">
              CIRCUIT
            </h1>
            <p className="text-sm text-white/60 mt-3">
              Master vector drift momentum, trigger kinetic turbo boosts, and set record lap times around high-speed neon circuits.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-lg w-full">
            <button
              onClick={() => startGame("grand_prix")}
              className="p-5 rounded-2xl bg-[#0b0f19] border border-blue-500/40 hover:border-blue-400 flex flex-col items-center gap-2 hover:scale-105 transition-all text-center"
            >
              <User className="w-8 h-8 text-blue-400" />
              <div className="font-black text-lg">GRAND PRIX</div>
              <div className="text-xs text-white/50">Time trial against Apex Rival AI</div>
            </button>

            <button
              onClick={() => startGame("local_drift_duel")}
              className="p-5 rounded-2xl bg-[#0b0f19] border border-rose-500/40 hover:border-rose-400 flex flex-col items-center gap-2 hover:scale-105 transition-all text-center"
            >
              <Users className="w-8 h-8 text-rose-400" />
              <div className="font-black text-lg">DRIFT DUEL</div>
              <div className="text-xs text-white/50">2-Player head-to-head circuit clash</div>
            </button>
          </div>
        </div>
      )}

      {gameState === "game_over" && (
        <div className="absolute inset-0 z-50 bg-black/85 backdrop-blur-md flex flex-col items-center justify-center p-6">
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center max-w-md w-full">
            <h2 className="text-4xl font-black uppercase text-blue-400 mb-2">
              {winnerName ? `${winnerName} Victorious!` : "Race Concluded"}
            </h2>
            <p className="text-xs text-white/50 mb-6">Circuit Grand Prix Complete</p>

            <div className="flex gap-4">
              <button
                onClick={() => startGame(mode)}
                className="flex-1 py-3.5 rounded-xl bg-blue-500 text-black font-black uppercase"
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
