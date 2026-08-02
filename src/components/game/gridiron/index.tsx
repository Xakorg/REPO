"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Trophy,
  Zap,
  Shield,
  Volume2,
  VolumeX,
  Play,
  Pause,
  RotateCcw,
  Sparkles,
  Flame,
  Users,
  User,
  Globe,
  ArrowLeft,
  Activity,
  Target,
  Circle,
  Clock
} from "lucide-react";
import Link from "next/link";
import { useUser, useFirestore, setDocumentNonBlocking } from "@/firebase";
import { doc, increment } from "firebase/firestore";

// ==========================================
// GRIDIRON HOVER SPORTS TYPES
// ==========================================

export type GridironMode = "single_league" | "local_versus" | "online_room";

export interface HoverPaddles {
  id: string;
  name: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  score: number;
  color: string;
  boostEnergy: number;
  maxBoost: number;
  boosting: boolean;
  tractorActive: boolean;
}

export interface HoverPuck {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
}

// ==========================================
// WEB AUDIO SYNTHESIZER
// ==========================================

class SportsAudioSynth {
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

  playPuckHit() {
    if (this.muted || !this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(600, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(150, this.ctx.currentTime + 0.1);

      gain.gain.setValueAtTime(0.3, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.1);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.1);
    } catch (e) {}
  }

  playGoalHorn() {
    if (this.muted || !this.ctx) return;
    try {
      [220, 277.18, 329.63].forEach((freq) => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();
        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(freq, this.ctx!.currentTime);

        gain.gain.setValueAtTime(0.2, this.ctx!.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx!.currentTime + 1.2);

        osc.connect(gain);
        gain.connect(this.ctx!.destination);
        osc.start();
        osc.stop(this.ctx!.currentTime + 1.2);
      });
    } catch (e) {}
  }

  playBoost() {
    if (this.muted || !this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(300, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(900, this.ctx.currentTime + 0.15);

      gain.gain.setValueAtTime(0.15, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.15);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.15);
    } catch (e) {}
  }
}

const audio = new SportsAudioSynth();

// ==========================================
// GRIDIRON GAME COMPONENT
// ==========================================

export default function GridironGame() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const { user } = useUser();
  const firestore = useFirestore();

  const [gameState, setGameState] = useState<"menu" | "playing" | "paused" | "game_over">("menu");
  const [mode, setMode] = useState<GridironMode>("single_league");
  const [soundEnabled, setSoundEnabled] = useState(true);

  // HUD Stats
  const [scoreRed, setScoreRed] = useState(0);
  const [scoreBlue, setScoreBlue] = useState(0);
  const [matchTime, setMatchTime] = useState(120); // 2 minute matches
  const [winnerName, setWinnerName] = useState<string | null>(null);

  const engineRef = useRef({
    keys: {
      w: false, a: false, s: false, d: false, space: false,
      up: false, left: false, down: false, right: false, enter: false,
      mouseX: 0, mouseY: 0
    },
    p1: {
      id: "p1", name: "Red Strikers", x: 200, y: 300, vx: 0, vy: 0, radius: 30, score: 0,
      color: "#ef4444", boostEnergy: 100, maxBoost: 100, boosting: false, tractorActive: false
    } as HoverPaddles,
    p2: {
      id: "p2", name: "Blue Dynamos", x: 800, y: 300, vx: 0, vy: 0, radius: 30, score: 0,
      color: "#3b82f6", boostEnergy: 100, maxBoost: 100, boosting: false, tractorActive: false
    } as HoverPaddles,
    puck: {
      x: 500, y: 300, vx: 0, vy: 0, radius: 18, color: "#eab308"
    } as HoverPuck,
    particles: [] as any[],
    matchTimer: 120 * 60,
    goalFlash: 0
  });

  const toggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    audio.muted = !next;
  };

  const dispatchScore = (finalScore: number) => {
    if (typeof window !== "undefined" && finalScore > 0) {
      const points = finalScore * 100 + 20;
      window.dispatchEvent(
        new CustomEvent("xakteir-game-score", {
          detail: { score: finalScore * 1000, points }
        })
      );
      if (user && firestore) {
        setDocumentNonBlocking(
          doc(firestore, "leaderboard", user.uid),
          {
            uid: user.uid,
            displayName: user.displayName || "Gridiron Striker",
            points: increment(points),
            updatedAt: new Date().toISOString()
          },
          { merge: true }
        );
      }
    }
  };

  const resetPuck = (w: number, h: number) => {
    const engine = engineRef.current;
    engine.puck.x = w / 2;
    engine.puck.y = h / 2;
    engine.puck.vx = (Math.random() > 0.5 ? 1 : -1) * (Math.random() * 4 + 3);
    engine.puck.vy = (Math.random() - 0.5) * 6;
  };

  const initGame = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const w = (canvas.width = canvas.parentElement?.clientWidth || window.innerWidth);
    const h = (canvas.height = canvas.parentElement?.clientHeight || window.innerHeight);

    const engine = engineRef.current;
    engine.p1 = {
      id: "p1", name: user?.displayName || "Red Strikers", x: w * 0.2, y: h / 2, vx: 0, vy: 0, radius: 30, score: 0,
      color: "#ef4444", boostEnergy: 100, maxBoost: 100, boosting: false, tractorActive: false
    };

    engine.p2 = {
      id: "p2", name: mode === "local_versus" ? "Blue Dynamos" : "AI Goalie", x: w * 0.8, y: h / 2, vx: 0, vy: 0, radius: 30, score: 0,
      color: "#3b82f6", boostEnergy: 100, maxBoost: 100, boosting: false, tractorActive: false
    };

    resetPuck(w, h);
    engine.particles = [];
    engine.matchTimer = 120 * 60;
    engine.goalFlash = 0;

    setScoreRed(0);
    setScoreBlue(0);
    setMatchTime(120);
    setWinnerName(null);
  }, [mode, user]);

  // Main 60FPS Game Loop
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
      const p2 = engine.p2;
      const puck = engine.puck;

      // Timer Decrement
      engine.matchTimer--;
      if (engine.matchTimer % 60 === 0) {
        setMatchTime(Math.ceil(engine.matchTimer / 60));
      }
      if (engine.matchTimer <= 0) {
        let winner = "Draw Match";
        if (p1.score > p2.score) winner = p1.name;
        else if (p2.score > p1.score) winner = p2.name;
        setWinnerName(winner);
        dispatchScore(p1.score);
        setGameState("game_over");
        return;
      }

      // ----------------------------------------
      // P1 MOVEMENT & PADDLE PHYSICS
      // ----------------------------------------
      let p1dx = 0;
      let p1dy = 0;
      if (keys.w) p1dy -= 1;
      if (keys.s) p1dy += 1;
      if (keys.a) p1dx -= 1;
      if (keys.d) p1dx += 1;

      if (p1dx !== 0 && p1dy !== 0) {
        p1dx *= 0.7071;
        p1dy *= 0.7071;
      }

      p1.boosting = keys.space && p1.boostEnergy > 10;
      if (p1.boosting) {
        p1.boostEnergy = Math.max(0, p1.boostEnergy - 1.2);
        audio.playBoost();
      } else {
        p1.boostEnergy = Math.min(p1.maxBoost, p1.boostEnergy + 0.4);
      }

      const p1Speed = p1.boosting ? 11.0 : 7.0;
      p1.vx += (p1dx * p1Speed - p1.vx) * 0.25;
      p1.vy += (p1dy * p1Speed - p1.vy) * 0.25;

      p1.x = Math.max(p1.radius, Math.min(w / 2 - p1.radius, p1.x + p1.vx));
      p1.y = Math.max(p1.radius, Math.min(h - p1.radius, p1.y + p1.vy));

      // ----------------------------------------
      // P2 MOVEMENT (LOCAL VS OR AI)
      // ----------------------------------------
      if (mode === "local_versus") {
        let p2dx = 0;
        let p2dy = 0;
        if (keys.up) p2dy -= 1;
        if (keys.down) p2dy += 1;
        if (keys.left) p2dx -= 1;
        if (keys.right) p2dx += 1;

        if (p2dx !== 0 && p2dy !== 0) {
          p2dx *= 0.7071;
          p2dy *= 0.7071;
        }

        p2.boosting = keys.enter && p2.boostEnergy > 10;
        if (p2.boosting) {
          p2.boostEnergy = Math.max(0, p2.boostEnergy - 1.2);
        } else {
          p2.boostEnergy = Math.min(p2.maxBoost, p2.boostEnergy + 0.4);
        }

        const p2Speed = p2.boosting ? 11.0 : 7.0;
        p2.vx += (p2dx * p2Speed - p2.vx) * 0.25;
        p2.vy += (p2dy * p2Speed - p2.vy) * 0.25;

        p2.x = Math.max(w / 2 + p2.radius, Math.min(w - p2.radius, p2.x + p2.vx));
        p2.y = Math.max(p2.radius, Math.min(h - p2.radius, p2.y + p2.vy));
      } else {
        // AI Goalie movement
        const targetY = puck.y;
        const targetX = Math.max(w * 0.65, Math.min(w - p2.radius, puck.x));

        p2.vx += (targetX - p2.x) * 0.08;
        p2.vy += (targetY - p2.y) * 0.08;

        p2.x = Math.max(w / 2 + p2.radius, Math.min(w - p2.radius, p2.x + p2.vx * 0.9));
        p2.y = Math.max(p2.radius, Math.min(h - p2.radius, p2.y + p2.vy * 0.9));
      }

      // ----------------------------------------
      // PUCK PHYSICS & WALL REFLECTION
      // ----------------------------------------
      puck.vx *= 0.992; // Slight friction
      puck.vy *= 0.992;

      puck.x += puck.vx;
      puck.y += puck.vy;

      // Top & Bottom Wall bounce
      if (puck.y - puck.radius < 0 || puck.y + puck.radius > h) {
        audio.playPuckHit();
        puck.vy *= -1;
        puck.y = puck.y - puck.radius < 0 ? puck.radius : h - puck.radius;
      }

      // Goal Nets Detection (Center 40% height of walls)
      const goalTop = h * 0.3;
      const goalBottom = h * 0.7;

      // Left Wall Collision or P2 Goal Score
      if (puck.x - puck.radius < 0) {
        if (puck.y > goalTop && puck.y < goalBottom) {
          // Goal for P2 (Blue)
          audio.playGoalHorn();
          p2.score++;
          setScoreBlue(p2.score);
          createGoalBurst(puck.x, puck.y, p2.color);
          resetPuck(w, h);
          if (p2.score >= 5) {
            setWinnerName(p2.name);
            setGameState("game_over");
          }
        } else {
          audio.playPuckHit();
          puck.vx *= -1;
          puck.x = puck.radius;
        }
      }

      // Right Wall Collision or P1 Goal Score
      if (puck.x + puck.radius > w) {
        if (puck.y > goalTop && puck.y < goalBottom) {
          // Goal for P1 (Red)
          audio.playGoalHorn();
          p1.score++;
          setScoreRed(p1.score);
          createGoalBurst(puck.x, puck.y, p1.color);
          resetPuck(w, h);
          if (p1.score >= 5) {
            setWinnerName(p1.name);
            dispatchScore(p1.score);
            setGameState("game_over");
          }
        } else {
          audio.playPuckHit();
          puck.vx *= -1;
          puck.x = w - puck.radius;
        }
      }

      // ----------------------------------------
      // PADDLE VS PUCK IMPACT DYNAMICS
      // ----------------------------------------
      [p1, p2].forEach(paddle => {
        const dist = Math.hypot(puck.x - paddle.x, puck.y - paddle.y);
        if (dist < paddle.radius + puck.radius) {
          audio.playPuckHit();

          const angle = Math.atan2(puck.y - paddle.y, puck.x - paddle.x);
          const force = Math.hypot(paddle.vx, paddle.vy) + 12;

          puck.vx = Math.cos(angle) * force;
          puck.vy = Math.sin(angle) * force;

          // Prevent overlap stuck
          const overlap = paddle.radius + puck.radius - dist;
          puck.x += Math.cos(angle) * overlap;
          puck.y += Math.sin(angle) * overlap;

          createGoalBurst(puck.x, puck.y, paddle.color);
        }
      });
    };

    const createGoalBurst = (x: number, y: number, color: string) => {
      const engine = engineRef.current;
      for (let i = 0; i < 20; i++) {
        const angle = Math.random() * Math.PI * 2;
        engine.particles.push({
          x, y,
          vx: Math.cos(angle) * (Math.random() * 8 + 3),
          vy: Math.sin(angle) * (Math.random() * 8 + 3),
          radius: Math.random() * 4 + 2,
          color,
          alpha: 1,
          life: 30
        });
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

      ctx.fillStyle = "#030712";
      ctx.fillRect(0, 0, w, h);

      // Draw Ice Rink / Cyber Field Lines
      ctx.strokeStyle = "rgba(255, 255, 255, 0.1)";
      ctx.lineWidth = 3;

      // Center Line & Center Circle
      ctx.beginPath();
      ctx.moveTo(w / 2, 0);
      ctx.lineTo(w / 2, h);
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(w / 2, h / 2, 80, 0, Math.PI * 2);
      ctx.stroke();

      // Goal Creases
      const goalTop = h * 0.3;
      const goalHeight = h * 0.4;

      ctx.strokeStyle = "#ef4444";
      ctx.strokeRect(0, goalTop, 40, goalHeight);

      ctx.strokeStyle = "#3b82f6";
      ctx.strokeRect(w - 40, goalTop, 40, goalHeight);

      // Draw Particles
      for (let i = engine.particles.length - 1; i >= 0; i--) {
        const p = engine.particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.alpha -= 1 / p.life;

        if (p.alpha <= 0) {
          engine.particles.splice(i, 1);
          continue;
        }

        ctx.fillStyle = p.color;
        ctx.globalAlpha = Math.max(0, p.alpha);
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;

      // Draw Puck
      ctx.save();
      ctx.shadowBlur = 20;
      ctx.shadowColor = engine.puck.color;
      ctx.fillStyle = engine.puck.color;
      ctx.beginPath();
      ctx.arc(engine.puck.x, engine.puck.y, engine.puck.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // Draw Hover Paddles
      [engine.p1, engine.p2].forEach(p => {
        ctx.save();
        ctx.shadowBlur = 25;
        ctx.shadowColor = p.color;

        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = "#ffffff";
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius * 0.4, 0, Math.PI * 2);
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

  const startGame = (selectedMode: GridironMode) => {
    setMode(selectedMode);
    initGame();
    setGameState("playing");
  };

  return (
    <div className="w-full h-screen bg-[#030712] text-white relative overflow-hidden font-sans select-none">
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full block" />

      <div className="absolute top-0 inset-x-0 p-4 flex justify-between items-center z-30 pointer-events-none">
        <Link
          href="/games"
          className="pointer-events-auto flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold"
        >
          <ArrowLeft className="w-4 h-4" /> Exit Gridiron
        </Link>
        <button
          onClick={toggleSound}
          className="pointer-events-auto p-2 rounded-xl bg-white/5 border border-white/10"
        >
          {soundEnabled ? <Volume2 className="w-4 h-4 text-red-400" /> : <VolumeX className="w-4 h-4 text-rose-400" />}
        </button>
      </div>

      {gameState === "playing" && (
        <div className="absolute top-4 inset-x-0 flex justify-center pointer-events-none z-20">
          <div className="bg-[#0b0f19]/90 border border-white/10 px-8 py-3 rounded-2xl backdrop-blur-md flex items-center gap-8 shadow-2xl">
            <div className="text-center">
              <div className="text-[10px] font-black uppercase text-red-400 tracking-wider">RED STRIKERS</div>
              <div className="text-3xl font-black text-white">{scoreRed}</div>
            </div>

            <div className="text-center px-4 border-x border-white/10">
              <div className="text-[10px] font-black uppercase text-white/40 tracking-widest">MATCH TIME</div>
              <div className="text-xl font-black text-amber-400">{matchTime}s</div>
            </div>

            <div className="text-center">
              <div className="text-[10px] font-black uppercase text-blue-400 tracking-wider">BLUE DYNAMOS</div>
              <div className="text-3xl font-black text-white">{scoreBlue}</div>
            </div>
          </div>
        </div>
      )}

      {gameState === "menu" && (
        <div className="absolute inset-0 z-40 bg-[#030712]/90 backdrop-blur-xl flex flex-col items-center justify-center p-6">
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center max-w-xl mb-8">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-bold uppercase tracking-widest mb-3">
              <Trophy className="w-3.5 h-3.5" /> Cybernetic Hover Sports League
            </div>
            <h1 className="text-6xl font-black uppercase tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-blue-500">
              GRIDIRON
            </h1>
            <p className="text-sm text-white/60 mt-3">
              High-velocity hover hockey. Outspeed opponents with thruster boosts and blast plasma pucks into goal nets. First to 5 goals wins!
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-lg w-full">
            <button
              onClick={() => startGame("single_league")}
              className="p-5 rounded-2xl bg-[#0b0f19] border border-red-500/40 hover:border-red-400 flex flex-col items-center gap-2 hover:scale-105 transition-all text-center"
            >
              <User className="w-8 h-8 text-red-400" />
              <div className="font-black text-lg">AI LEAGUE</div>
              <div className="text-xs text-white/50">Single player arcade tournament</div>
            </button>

            <button
              onClick={() => startGame("local_versus")}
              className="p-5 rounded-2xl bg-[#0b0f19] border border-blue-500/40 hover:border-blue-400 flex flex-col items-center gap-2 hover:scale-105 transition-all text-center"
            >
              <Users className="w-8 h-8 text-blue-400" />
              <div className="font-black text-lg">2-PLAYER VERSUS</div>
              <div className="text-xs text-white/50">Head-to-head same screen hover match</div>
            </button>
          </div>
        </div>
      )}

      {gameState === "game_over" && (
        <div className="absolute inset-0 z-50 bg-black/85 backdrop-blur-md flex flex-col items-center justify-center p-6">
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center max-w-md w-full">
            <h2 className="text-4xl font-black uppercase text-amber-400 mb-2">
              {winnerName ? `${winnerName} Wins!` : "Match Complete"}
            </h2>
            <p className="text-xs text-white/50 mb-6">Gridiron Arena Match Concluded</p>

            <div className="flex gap-4">
              <button
                onClick={() => startGame(mode)}
                className="flex-1 py-3.5 rounded-xl bg-red-500 text-white font-black uppercase"
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
