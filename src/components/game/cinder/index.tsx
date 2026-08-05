"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Flame,
  Zap,
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
  ShieldAlert,
  Smartphone
} from "lucide-react";
import Link from "next/link";
import { useUser, useFirestore, setDocumentNonBlocking } from "@/firebase";
import { doc, increment } from "firebase/firestore";

// ==========================================
// CINDER GAME TYPES
// ==========================================

export type CinderMode = "cinder_defense" | "volcanic_showdown";

export interface VolcanicEmber {
  id: string;
  x: number;
  y: number;
  vy: number;
  radius: number;
  deflected: boolean;
  color: string;
}

export interface MagmaSpout {
  x: number;
  height: number;
  maxHeight: number;
  active: boolean;
  color: string;
}

// ==========================================
// WEB AUDIO SYNTHESIZER
// ==========================================

class CinderAudioSynth {
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

  playEmberDeflect() {
    if (this.muted || !this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(700, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1400, this.ctx.currentTime + 0.1);

      gain.gain.setValueAtTime(0.25, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.1);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.1);
    } catch (e) {}
  }

  playThermalBurst() {
    if (this.muted || !this.ctx) return;
    try {
      [350, 500, 750, 1100].forEach((freq, i) => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();
        osc.type = "triangle";
        osc.frequency.setValueAtTime(freq, this.ctx!.currentTime + i * 0.04);

        gain.gain.setValueAtTime(0.25, this.ctx!.currentTime + i * 0.04);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx!.currentTime + i * 0.04 + 0.12);

        osc.connect(gain);
        gain.connect(this.ctx!.destination);
        osc.start(this.ctx!.currentTime + i * 0.04);
        osc.stop(this.ctx!.currentTime + i * 0.04 + 0.12);
      });
    } catch (e) {}
  }

  playRefineryHit() {
    if (this.muted || !this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(170, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(50, this.ctx.currentTime + 0.22);

      gain.gain.setValueAtTime(0.25, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.22);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.22);
    } catch (e) {}
  }
}

const audio = new CinderAudioSynth();

// ==========================================
// CINDER GAME COMPONENT
// ==========================================

export default function CinderGame() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const { user } = useUser();
  const firestore = useFirestore();

  const [gameState, setGameState] = useState<"menu" | "playing" | "paused" | "game_over">("menu");
  const [mode, setMode] = useState<CinderMode>("cinder_defense");
  const [soundEnabled, setSoundEnabled] = useState(true);

  // HUD Metrics
  const [refineryHealth, setRefineryHealth] = useState(100);
  const [embersDeflected, setEmbersDeflected] = useState(0);
  const [score, setScore] = useState(0);
  const [winnerName, setWinnerName] = useState<string | null>(null);

  const engineRef = useRef({
    keys: { left: false, right: false, burst: false },
    shieldX: 300,
    shieldWidth: 110,
    refineryHp: 100,
    deflectedCount: 0,
    embers: [] as VolcanicEmber[],
    spouts: [] as MagmaSpout[],
    score: 0,
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
            displayName: user.displayName || "Cinder Defender",
            points: increment(points),
            updatedAt: new Date().toISOString()
          },
          { merge: true }
        );
      }
    }
  };

  const initCinder = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const w = (canvas.width = canvas.parentElement?.clientWidth || window.innerWidth);
    const h = (canvas.height = canvas.parentElement?.clientHeight || window.innerHeight);

    const engine = engineRef.current;
    engine.shieldX = w / 2;
    engine.refineryHp = 100;
    engine.deflectedCount = 0;
    engine.embers = [];
    engine.spouts = [];
    engine.score = 0;
    engine.frameCount = 0;

    setRefineryHealth(100);
    setEmbersDeflected(0);
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

      // Shield Movement
      const speed = 7.0;
      if (keys.left) engine.shieldX = Math.max(engine.shieldWidth / 2, engine.shieldX - speed);
      if (keys.right) engine.shieldX = Math.min(w - engine.shieldWidth / 2, engine.shieldX + speed);

      engine.frameCount++;

      // Spawn Falling Volcanic Embers
      if (engine.frameCount % 40 === 0) {
        const colors = ["#f97316", "#ef4444", "#eab308"];
        engine.embers.push({
          id: `emb_${Date.now()}_${Math.random()}`,
          x: Math.random() * (w - 60) + 30,
          y: -20,
          vy: 4.2 + Math.random() * 2.0,
          radius: 12,
          deflected: false,
          color: colors[Math.floor(Math.random() * 3)]
        });
      }

      // Update Embers Physics
      const shieldY = h - 90;
      for (let i = engine.embers.length - 1; i >= 0; i--) {
        const emb = engine.embers[i];
        emb.y += emb.vy;

        // Check Thermal Shield Deflection
        if (
          !emb.deflected &&
          Math.abs(emb.y - shieldY) < 16 &&
          Math.abs(emb.x - engine.shieldX) < engine.shieldWidth / 2 + 10
        ) {
          audio.playEmberDeflect();
          emb.deflected = true;
          emb.vy *= -1.6;
          engine.deflectedCount++;
          engine.score += 150;
          setEmbersDeflected(engine.deflectedCount);
          setScore(engine.score);
        }

        // Hitting Subterranean Refinery Core
        if (emb.y > h - 40 && !emb.deflected) {
          audio.playRefineryHit();
          engine.refineryHp = Math.max(0, engine.refineryHp - 12);
          setRefineryHealth(engine.refineryHp);

          if (engine.refineryHp <= 0) {
            setWinnerName("Geothermal Refinery Overheat");
            dispatchScore(engine.score);
            setGameState("game_over");
          }

          engine.embers.splice(i, 1);
        }

        // Offscreen Top after deflection
        if (emb.y < -30 && emb.deflected) {
          engine.embers.splice(i, 1);
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

      ctx.fillStyle = "#180808";
      ctx.fillRect(0, 0, w, h);

      // Draw Volcanic Background Glow
      ctx.fillStyle = "rgba(249, 115, 22, 0.06)";
      ctx.fillRect(0, h - 120, w, 120);

      // Draw Falling Embers
      engine.embers.forEach(emb => {
        ctx.save();
        ctx.shadowBlur = 20;
        ctx.shadowColor = emb.color;
        ctx.fillStyle = emb.color;
        ctx.beginPath();
        ctx.arc(emb.x, emb.y, emb.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });

      // Draw Thermal Shield Platform
      const shieldY = h - 90;
      ctx.save();
      ctx.shadowBlur = 25;
      ctx.shadowColor = "#f97316";
      ctx.fillStyle = "#f97316";
      ctx.beginPath();
      ctx.roundRect(engine.shieldX - engine.shieldWidth / 2, shieldY - 10, engine.shieldWidth, 20, 10);
      ctx.fill();
      ctx.restore();
    };

    animId = requestAnimationFrame(runLoop);
    return () => cancelAnimationFrame(animId);
  }, [gameState, mode]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      audio.init();
      const keys = engineRef.current.keys;
      if (e.key === "a" || e.key === "A" || e.key === "ArrowLeft") keys.left = true;
      if (e.key === "d" || e.key === "D" || e.key === "ArrowRight") keys.right = true;
      if (e.key === " " || e.key === "Enter") {
        keys.burst = true;
        audio.playThermalBurst();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const keys = engineRef.current.keys;
      if (e.key === "a" || e.key === "A" || e.key === "ArrowLeft") keys.left = false;
      if (e.key === "d" || e.key === "D" || e.key === "ArrowRight") keys.right = false;
      if (e.key === " " || e.key === "Enter") keys.burst = false;
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, []);

  const triggerMobileLeftStart = () => { audio.init(); engineRef.current.keys.left = true; };
  const triggerMobileLeftEnd = () => { engineRef.current.keys.left = false; };
  const triggerMobileRightStart = () => { audio.init(); engineRef.current.keys.right = true; };
  const triggerMobileRightEnd = () => { engineRef.current.keys.right = false; };
  const triggerMobileBurst = () => {
    audio.init();
    audio.playThermalBurst();
  };

  const startGame = (selectedMode: CinderMode) => {
    setMode(selectedMode);
    initCinder();
    setGameState("playing");
  };

  return (
    <div className="w-full h-screen bg-[#180808] text-white relative overflow-hidden font-sans select-none">
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full block" />

      <div className="absolute top-0 inset-x-0 p-4 flex justify-between items-center z-30 pointer-events-none">
        <Link
          href="/games"
          className="pointer-events-auto flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold"
        >
          <ArrowLeft className="w-4 h-4" /> Exit Cinder
        </Link>
        <button
          onClick={toggleSound}
          className="pointer-events-auto p-2 rounded-xl bg-white/5 border border-white/10"
        >
          {soundEnabled ? <Volume2 className="w-4 h-4 text-orange-400" /> : <VolumeX className="w-4 h-4 text-rose-400" />}
        </button>
      </div>

      {gameState === "playing" && (
        <>
          <div className="absolute top-4 inset-x-0 flex justify-center pointer-events-none z-20">
            <div className="bg-[#0b0f19]/90 border border-orange-500/30 px-8 py-3 rounded-2xl backdrop-blur-md flex items-center gap-8 pointer-events-auto">
              <div className="text-center">
                <div className="text-[10px] font-black uppercase text-white/40 tracking-wider">REFINERY HEALTH</div>
                <div className="text-lg font-black text-orange-400">{refineryHealth}%</div>
              </div>

              <div className="text-center">
                <div className="text-[10px] font-black uppercase text-white/40 tracking-wider">EMBERS DEFLECTED</div>
                <div className="text-xl font-black text-yellow-400">{embersDeflected}</div>
              </div>

              <div className="text-center">
                <div className="text-[10px] font-black uppercase text-white/40 tracking-wider">CINDER SCORE</div>
                <div className="text-xl font-black text-emerald-400">{score}</div>
              </div>
            </div>
          </div>

          {/* MOBILE TOUCH CONTROLS OVERLAY */}
          <div className="absolute bottom-6 inset-x-6 flex justify-between items-center z-30 md:hidden pointer-events-auto">
            <div className="flex gap-3">
              <button
                onTouchStart={triggerMobileLeftStart}
                onTouchEnd={triggerMobileLeftEnd}
                className="w-16 h-16 rounded-2xl bg-orange-600/40 border border-orange-400/60 active:scale-95 flex items-center justify-center font-black text-2xl"
              >
                ◀
              </button>
              <button
                onTouchStart={triggerMobileRightStart}
                onTouchEnd={triggerMobileRightEnd}
                className="w-16 h-16 rounded-2xl bg-orange-600/40 border border-orange-400/60 active:scale-95 flex items-center justify-center font-black text-2xl"
              >
                ▶
              </button>
            </div>

            <button
              onTouchStart={triggerMobileBurst}
              onClick={triggerMobileBurst}
              className="w-20 h-20 rounded-full bg-gradient-to-tr from-orange-500 to-red-600 border border-orange-300 active:scale-90 flex items-center justify-center font-black text-xs uppercase tracking-wider"
            >
              BURST
            </button>
          </div>
        </>
      )}

      {gameState === "menu" && (
        <div className="absolute inset-0 z-40 bg-[#1f0606]/90 backdrop-blur-2xl flex flex-col items-center justify-center p-6 overflow-y-auto">
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-orange-600/20 rounded-full blur-[120px] pointer-events-none animate-pulse" />

          <motion.div
            initial={{ scale: 0.88, opacity: 0, y: 10 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            className="text-center max-w-2xl mb-8 z-10"
          >
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-orange-500/10 border border-orange-500/30 text-orange-300 text-xs font-black uppercase tracking-widest mb-4 shadow-[0_0_20px_rgba(249,115,22,0.2)]">
              <Flame className="w-4 h-4 text-orange-400 animate-pulse" /> Volcanic Ember Deflection Protocol
            </div>

            <h1 className="text-7xl md:text-8xl font-black uppercase tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-orange-400 via-amber-300 to-red-500 drop-shadow-[0_0_40px_rgba(249,115,22,0.6)]">
              CINDER
            </h1>
            <p className="text-base text-orange-100/70 mt-4 max-w-lg mx-auto leading-relaxed">
              Position thermal shields to deflect falling volcanic embers and protect the subterranean geothermal refinery core.
            </p>

            <div className="flex justify-center gap-3 mt-4">
              <span className="px-3 py-1 rounded-md bg-white/5 border border-white/10 text-[10px] font-mono text-orange-300">1P / 2P MODES</span>
              <span className="px-3 py-1 rounded-md bg-white/5 border border-white/10 text-[10px] font-mono text-amber-300">ONLINE LEADERBOARD</span>
              <span className="px-3 py-1 rounded-md bg-white/5 border border-white/10 text-[10px] font-mono text-red-300">TOUCH READY</span>
            </div>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-xl w-full z-10">
            <button
              onClick={() => startGame("cinder_defense")}
              className="group relative p-6 rounded-3xl bg-white/5 border border-orange-500/30 hover:border-orange-400 hover:bg-orange-500/10 flex flex-col items-center gap-3 transition-all duration-300 text-center backdrop-blur-md shadow-lg hover:shadow-[0_0_30px_rgba(249,115,22,0.3)] active:scale-95"
            >
              <User className="w-8 h-8 text-orange-400 group-hover:scale-110 transition-transform" />
              <div>
                <div className="font-black text-xl uppercase tracking-wider text-white">CINDER DEFENSE</div>
                <div className="text-xs text-orange-200/60 mt-1">Single player thermal shield ember defense</div>
              </div>
            </button>

            <button
              onClick={() => startGame("volcanic_showdown")}
              className="group relative p-6 rounded-3xl bg-white/5 border border-red-500/30 hover:border-red-400 hover:bg-red-500/10 flex flex-col items-center gap-3 transition-all duration-300 text-center backdrop-blur-md shadow-lg hover:shadow-[0_0_30px_rgba(239,68,68,0.3)] active:scale-95"
            >
              <Users className="w-8 h-8 text-red-400 group-hover:scale-110 transition-transform" />
              <div>
                <div className="font-black text-xl uppercase tracking-wider text-white">VOLCANIC SHOWDOWN</div>
                <div className="text-xs text-red-200/60 mt-1">2-Player geothermal ember deflection duel</div>
              </div>
            </button>
          </div>

          <div className="mt-8 z-10 flex flex-wrap items-center justify-center gap-6 text-xs text-white/50 bg-black/40 px-6 py-3 rounded-2xl border border-white/10">
            <div className="flex items-center gap-2">
              <span className="font-mono text-orange-300 bg-white/10 px-2 py-0.5 rounded border border-white/10 font-bold">LEFT / RIGHT</span>
              <span>Position Shield</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-red-300 bg-white/10 px-2 py-0.5 rounded border border-white/10 font-bold">SPACE</span>
              <span>Thermal Blast</span>
            </div>
          </div>
        </div>
      )}

      {gameState === "game_over" && (
        <div className="absolute inset-0 z-50 bg-black/85 backdrop-blur-md flex flex-col items-center justify-center p-6">
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center max-w-md w-full">
            <h2 className="text-4xl font-black uppercase text-orange-400 mb-2">
              {winnerName ? `${winnerName}!` : "Refinery Overheat"}
            </h2>
            <p className="text-xs text-white/50 mb-6">Volcanic Cinder Protocol Concluded</p>

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
