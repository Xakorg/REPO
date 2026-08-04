"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Flame,
  Zap,
  Snowflake,
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
  Hammer,
  Sword,
  ShieldAlert
} from "lucide-react";
import Link from "next/link";
import { useUser, useFirestore, setDocumentNonBlocking } from "@/firebase";
import { doc, increment } from "firebase/firestore";

// ==========================================
// FORGE GAME TYPES
// ==========================================

export type ForgeMode = "master_craftsman" | "alloy_clash";

export interface ElementalSpark {
  id: string;
  type: "fire" | "ice" | "lightning";
  x: number;
  y: number;
  vy: number;
  radius: number;
  color: string;
}

export interface ForgedWeapon {
  id: string;
  type: "inferno_blade" | "frost_shield" | "thunder_bolt";
  power: number;
}

// ==========================================
// WEB AUDIO SYNTHESIZER
// ==========================================

class ForgeAudioSynth {
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

  playAnvilStrike() {
    if (this.muted || !this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(880, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(220, this.ctx.currentTime + 0.15);

      gain.gain.setValueAtTime(0.3, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.15);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.15);
    } catch (e) {}
  }

  playSparkCatch() {
    if (this.muted || !this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(600, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1200, this.ctx.currentTime + 0.08);

      gain.gain.setValueAtTime(0.18, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.08);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.08);
    } catch (e) {}
  }

  playAlloyUnleashed() {
    if (this.muted || !this.ctx) return;
    try {
      [300, 600, 900, 1200].forEach((freq, i) => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();
        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(freq, this.ctx!.currentTime + i * 0.06);

        gain.gain.setValueAtTime(0.2, this.ctx!.currentTime + i * 0.06);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx!.currentTime + i * 0.06 + 0.15);

        osc.connect(gain);
        gain.connect(this.ctx!.destination);
        osc.start(this.ctx!.currentTime + i * 0.06);
        osc.stop(this.ctx!.currentTime + i * 0.06 + 0.15);
      });
    } catch (e) {}
  }
}

const audio = new ForgeAudioSynth();

// ==========================================
// FORGE GAME COMPONENT
// ==========================================

export default function ForgeGame() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const { user } = useUser();
  const firestore = useFirestore();

  const [gameState, setGameState] = useState<"menu" | "playing" | "paused" | "game_over">("menu");
  const [mode, setMode] = useState<ForgeMode>("master_craftsman");
  const [soundEnabled, setSoundEnabled] = useState(true);

  // HUD Metrics
  const [fireSparks, setFireSparks] = useState(0);
  const [iceSparks, setIceSparks] = useState(0);
  const [lightningSparks, setLightningSparks] = useState(0);
  const [score, setScore] = useState(0);
  const [winnerName, setWinnerName] = useState<string | null>(null);

  const engineRef = useRef({
    keys: {
      w: false, a: false, s: false, d: false, space: false,
      up: false, left: false, down: false, right: false, enter: false
    },
    craftsman1: { x: 300, y: 550, width: 80, height: 16, color: "#f97316", score: 0 },
    craftsman2: { x: 700, y: 550, width: 80, height: 16, color: "#a855f7", score: 0 },
    sparks: [] as ElementalSpark[],
    counts: { fire: 0, ice: 0, lightning: 0 },
    particles: [] as any[],
    timer: 60,
    frameCount: 0
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
            displayName: user.displayName || "Master Blacksmith",
            points: increment(points),
            updatedAt: new Date().toISOString()
          },
          { merge: true }
        );
      }
    }
  };

  const initForge = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const w = (canvas.width = canvas.parentElement?.clientWidth || window.innerWidth);
    const h = (canvas.height = canvas.parentElement?.clientHeight || window.innerHeight);

    const engine = engineRef.current;
    engine.craftsman1 = { x: w * 0.3, y: h - 60, width: 90, height: 18, color: "#f97316", score: 0 };
    engine.craftsman2 = { x: w * 0.7, y: h - 60, width: 90, height: 18, color: "#a855f7", score: 0 };

    engine.sparks = [];
    engine.counts = { fire: 0, ice: 0, lightning: 0 };
    engine.particles = [];
    engine.timer = 60;
    engine.frameCount = 0;

    setFireSparks(0);
    setIceSparks(0);
    setLightningSparks(0);
    setScore(0);
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
      const c1 = engine.craftsman1;

      // Timer Countdown
      engine.frameCount++;
      if (engine.frameCount % 60 === 0) {
        engine.timer = Math.max(0, engine.timer - 1);
        if (engine.timer <= 0) {
          setWinnerName("Forge Cycle Completed");
          dispatchScore(c1.score);
          setGameState("game_over");
        }
      }

      // Spawn Falling Sparks (Every 30 frames)
      if (engine.frameCount % 30 === 0) {
        const types: ("fire" | "ice" | "lightning")[] = ["fire", "ice", "lightning"];
        const chosenType = types[Math.floor(Math.random() * types.length)];
        const colors = { fire: "#ef4444", ice: "#38bdf8", lightning: "#eab308" };

        engine.sparks.push({
          id: `spark_${Date.now()}_${Math.random()}`,
          type: chosenType,
          x: Math.random() * (w - 40) + 20,
          y: -20,
          vy: 3.5 + Math.random() * 2.5,
          radius: 12,
          color: colors[chosenType]
        });
      }

      // Craftsman 1 Movement
      if (keys.a) c1.x = Math.max(c1.width / 2, c1.x - 7.5);
      if (keys.d) c1.x = Math.min(w - c1.width / 2, c1.x + 7.5);

      // Craftsman 2 Movement
      if (mode === "alloy_clash") {
        const c2 = engine.craftsman2;
        if (keys.left) c2.x = Math.max(c2.width / 2, c2.x - 7.5);
        if (keys.right) c2.x = Math.min(w - c2.width / 2, c2.x + 7.5);
      }

      // Update Sparks Physics & Catch Collision
      for (let i = engine.sparks.length - 1; i >= 0; i--) {
        const spark = engine.sparks[i];
        spark.y += spark.vy;

        // Catch by C1 Anvil
        if (
          spark.y >= c1.y - c1.height / 2 &&
          spark.y <= c1.y + c1.height / 2 &&
          spark.x >= c1.x - c1.width / 2 &&
          spark.x <= c1.x + c1.width / 2
        ) {
          audio.playSparkCatch();
          engine.counts[spark.type]++;
          c1.score += 150;

          setFireSparks(engine.counts.fire);
          setIceSparks(engine.counts.ice);
          setLightningSparks(engine.counts.lightning);
          setScore(c1.score);

          // Anvil Forge Synergy Bonus
          if (engine.counts.fire >= 3 && engine.counts.ice >= 3 && engine.counts.lightning >= 3) {
            audio.playAlloyUnleashed();
            c1.score += 1000;
            engine.counts = { fire: 0, ice: 0, lightning: 0 };
          }

          engine.sparks.splice(i, 1);
          continue;
        }

        // Missed Spark
        if (spark.y > h + 20) {
          engine.sparks.splice(i, 1);
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

      // Draw Anvil Forge Grid
      ctx.strokeStyle = "rgba(249, 115, 22, 0.08)";
      ctx.lineWidth = 1;
      const step = 40;
      for (let x = 0; x < w; x += step) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke();
      }

      // Draw Falling Elemental Sparks
      engine.sparks.forEach(spark => {
        ctx.save();
        ctx.shadowBlur = 18;
        ctx.shadowColor = spark.color;
        ctx.fillStyle = spark.color;
        ctx.beginPath();
        ctx.arc(spark.x, spark.y, spark.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });

      // Draw Craftsman Anvils (C1 and C2)
      [engine.craftsman1, ...(mode === "alloy_clash" ? [engine.craftsman2] : [])].forEach(c => {
        ctx.save();
        ctx.shadowBlur = 20;
        ctx.shadowColor = c.color;
        ctx.fillStyle = c.color;
        ctx.beginPath();
        ctx.roundRect(c.x - c.width / 2, c.y - c.height / 2, c.width, c.height, 8);
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
      if (e.key === "a" || e.key === "A") keys.a = true;
      if (e.key === "d" || e.key === "D") keys.d = true;

      if (e.key === "ArrowLeft") keys.left = true;
      if (e.key === "ArrowRight") keys.right = true;
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const keys = engineRef.current.keys;
      if (e.key === "a" || e.key === "A") keys.a = false;
      if (e.key === "d" || e.key === "D") keys.d = false;

      if (e.key === "ArrowLeft") keys.left = false;
      if (e.key === "ArrowRight") keys.right = false;
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, []);

  const startGame = (selectedMode: ForgeMode) => {
    setMode(selectedMode);
    initForge();
    setGameState("playing");
  };

  return (
    <div className="w-full h-screen bg-[#0c0a09] text-white relative overflow-hidden font-sans select-none">
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full block" />

      <div className="absolute top-0 inset-x-0 p-4 flex justify-between items-center z-30 pointer-events-none">
        <Link
          href="/games"
          className="pointer-events-auto flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold"
        >
          <ArrowLeft className="w-4 h-4" /> Exit Forge
        </Link>
        <button
          onClick={toggleSound}
          className="pointer-events-auto p-2 rounded-xl bg-white/5 border border-white/10"
        >
          {soundEnabled ? <Volume2 className="w-4 h-4 text-orange-400" /> : <VolumeX className="w-4 h-4 text-rose-400" />}
        </button>
      </div>

      {gameState === "playing" && (
        <div className="absolute top-4 inset-x-0 flex justify-center pointer-events-none z-20">
          <div className="bg-[#0b0f19]/90 border border-orange-500/30 px-8 py-3 rounded-2xl backdrop-blur-md flex items-center gap-8 pointer-events-auto">
            <div className="text-center">
              <div className="text-[10px] font-black uppercase text-white/40 tracking-wider">FIRE SPARKS</div>
              <div className="text-lg font-black text-rose-400">{fireSparks}</div>
            </div>

            <div className="text-center">
              <div className="text-[10px] font-black uppercase text-white/40 tracking-wider">ICE SPARKS</div>
              <div className="text-lg font-black text-sky-400">{iceSparks}</div>
            </div>

            <div className="text-center">
              <div className="text-[10px] font-black uppercase text-white/40 tracking-wider">LIGHTNING SPARKS</div>
              <div className="text-lg font-black text-yellow-400">{lightningSparks}</div>
            </div>

            <div className="text-center">
              <div className="text-[10px] font-black uppercase text-white/40 tracking-wider">FORGE SCORE</div>
              <div className="text-xl font-black text-orange-400">{score}</div>
            </div>
          </div>
        </div>
      )}

      {gameState === "menu" && (
        <div className="absolute inset-0 z-40 bg-[#0c0a09]/95 backdrop-blur-xl flex flex-col items-center justify-center p-6">
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center max-w-xl mb-8">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/10 border border-orange-500/30 text-orange-400 text-xs font-bold uppercase tracking-widest mb-3">
              <Flame className="w-3.5 h-3.5" /> Elemental Plasma Spark Crafting Arena
            </div>
            <h1 className="text-6xl font-black uppercase tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-yellow-500">
              FORGE
            </h1>
            <p className="text-sm text-white/60 mt-3">
              Catch falling fire, ice, and lightning plasma sparks to forge plasma weapons and trigger elemental alloy explosions.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-lg w-full">
            <button
              onClick={() => startGame("master_craftsman")}
              className="p-5 rounded-2xl bg-[#0b0f19] border border-orange-500/40 hover:border-orange-400 flex flex-col items-center gap-2 hover:scale-105 transition-all text-center"
            >
              <User className="w-8 h-8 text-orange-400" />
              <div className="font-black text-lg">MASTER CRAFTSMAN</div>
              <div className="text-xs text-white/50">Single player elemental crafting challenge</div>
            </button>

            <button
              onClick={() => startGame("alloy_clash")}
              className="p-5 rounded-2xl bg-[#0b0f19] border border-yellow-500/40 hover:border-yellow-400 flex flex-col items-center gap-2 hover:scale-105 transition-all text-center"
            >
              <Users className="w-8 h-8 text-yellow-400" />
              <div className="font-black text-lg">ALLOY CLASH</div>
              <div className="text-xs text-white/50">2-Player anvil forge duel</div>
            </button>
          </div>
        </div>
      )}

      {gameState === "game_over" && (
        <div className="absolute inset-0 z-50 bg-black/85 backdrop-blur-md flex flex-col items-center justify-center p-6">
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center max-w-md w-full">
            <h2 className="text-4xl font-black uppercase text-orange-400 mb-2">
              {winnerName ? `${winnerName}!` : "Forge Concluded"}
            </h2>
            <p className="text-xs text-white/50 mb-6">Elemental Forge Protocol Complete</p>

            <div className="flex gap-4">
              <button
                onClick={() => startGame(mode)}
                className="flex-1 py-3.5 rounded-xl bg-orange-500 text-black font-black uppercase"
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
