"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Compass,
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
  Orbit,
  CircleDot,
  Smartphone
} from "lucide-react";
import Link from "next/link";
import { useUser, useFirestore, setDocumentNonBlocking } from "@/firebase";
import { doc, increment } from "firebase/firestore";

// ==========================================
// VORTEX GAME TYPES
// ==========================================

export type VortexMode = "vortex_core" | "singularity_war";

export interface CosmicScrap {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  isAntimatter: boolean;
  color: string;
}

// ==========================================
// WEB AUDIO SYNTHESIZER
// ==========================================

class VortexAudioSynth {
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

  playSingularityPull() {
    if (this.muted || !this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(140, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(480, this.ctx.currentTime + 0.12);

      gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.12);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.12);
    } catch (e) {}
  }

  playScrapAbsorb() {
    if (this.muted || !this.ctx) return;
    try {
      [440, 587.33, 880, 1174.66].forEach((freq, i) => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();
        osc.type = "triangle";
        osc.frequency.setValueAtTime(freq, this.ctx!.currentTime + i * 0.03);

        gain.gain.setValueAtTime(0.2, this.ctx!.currentTime + i * 0.03);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx!.currentTime + i * 0.03 + 0.1);

        osc.connect(gain);
        gain.connect(this.ctx!.destination);
        osc.start(this.ctx!.currentTime + i * 0.03);
        osc.stop(this.ctx!.currentTime + i * 0.03 + 0.1);
      });
    } catch (e) {}
  }

  playAntimatterBlast() {
    if (this.muted || !this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(150, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(40, this.ctx.currentTime + 0.25);

      gain.gain.setValueAtTime(0.25, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.25);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.25);
    } catch (e) {}
  }
}

const audio = new VortexAudioSynth();

// ==========================================
// VORTEX GAME COMPONENT
// ==========================================

export default function VortexGame() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const { user } = useUser();
  const firestore = useFirestore();

  const [gameState, setGameState] = useState<"menu" | "playing" | "paused" | "game_over">("menu");
  const [mode, setMode] = useState<VortexMode>("vortex_core");
  const [soundEnabled, setSoundEnabled] = useState(true);

  // HUD Metrics
  const [singularityMass, setSingularityMass] = useState(50);
  const [scrapAbsorbed, setScrapAbsorbed] = useState(0);
  const [score, setScore] = useState(0);
  const [winnerName, setWinnerName] = useState<string | null>(null);
  const [isMobileScreen, setIsMobileScreen] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobileScreen(window.innerWidth <= 768 && window.matchMedia("(pointer: coarse)").matches);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const engineRef = useRef({
    keys: { left: false, right: false, up: false, down: false, pull: false },
    vortex: { x: 300, y: 300, radius: 28, mass: 50 },
    scraps: [] as CosmicScrap[],
    absorbedCount: 0,
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
      const points = Math.floor(finalScore / 30) + 20;
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
            displayName: user.displayName || "Vortex Pilot",
            points: increment(points),
            updatedAt: new Date().toISOString()
          },
          { merge: true }
        );
      }
    }
  };

  const initVortex = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const w = (canvas.width = canvas.parentElement?.clientWidth || window.innerWidth);
    const h = (canvas.height = canvas.parentElement?.clientHeight || window.innerHeight);

    const engine = engineRef.current;
    engine.vortex = { x: w / 2, y: h / 2, radius: 28, mass: 50 };
    engine.scraps = [];
    engine.absorbedCount = 0;
    engine.score = 0;
    engine.frameCount = 0;

    setSingularityMass(50);
    setScrapAbsorbed(0);
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
      const v = engine.vortex;
      const keys = engine.keys;

      // Vortex Movement
      const speed = 4.8;
      if (keys.left) v.x = Math.max(v.radius, v.x - speed);
      if (keys.right) v.x = Math.min(w - v.radius, v.x + speed);
      if (keys.up) v.y = Math.max(v.radius, v.y - speed);
      if (keys.down) v.y = Math.min(h - v.radius, v.y + speed);

      engine.frameCount++;

      // Spawn Cosmic Scrap & Antimatter Mines
      if (engine.frameCount % 45 === 0) {
        const isAnti = Math.random() < 0.3;
        const side = Math.floor(Math.random() * 4);
        let sx = 0, sy = 0;

        if (side === 0) { sx = Math.random() * w; sy = -20; }
        else if (side === 1) { sx = w + 20; sy = Math.random() * h; }
        else if (side === 2) { sx = Math.random() * w; sy = h + 20; }
        else { sx = -20; sy = Math.random() * h; }

        const angle = Math.atan2(v.y - sy, v.x - sx);

        engine.scraps.push({
          id: `scr_${Date.now()}_${Math.random()}`,
          x: sx,
          y: sy,
          vx: Math.cos(angle) * (1.8 + Math.random() * 1.5),
          vy: Math.sin(angle) * (1.8 + Math.random() * 1.5),
          radius: isAnti ? 14 : 10,
          isAntimatter: isAnti,
          color: isAnti ? "#ef4444" : "#a855f7"
        });
      }

      // Gravitational Singularity Pull
      const pullRadius = keys.pull ? 250 : 130;
      engine.scraps.forEach(scrap => {
        const dx = v.x - scrap.x;
        const dy = v.y - scrap.y;
        const dist = Math.hypot(dx, dy);

        if (dist < pullRadius) {
          const pullForce = (keys.pull ? 0.35 : 0.15) * (1 - dist / pullRadius);
          scrap.vx += (dx / dist) * pullForce;
          scrap.vy += (dy / dist) * pullForce;
        }

        scrap.x += scrap.vx;
        scrap.y += scrap.vy;
      });

      // Absorption Collisions
      for (let i = engine.scraps.length - 1; i >= 0; i--) {
        const scrap = engine.scraps[i];
        const dist = Math.hypot(scrap.x - v.x, scrap.y - v.y);

        if (dist < v.radius + scrap.radius) {
          if (scrap.isAntimatter) {
            // Antimatter Blast Damage!
            audio.playAntimatterBlast();
            v.mass = Math.max(0, v.mass - 20);
            setSingularityMass(v.mass);

            if (v.mass <= 0) {
              setWinnerName("Singularity Core Collapsed");
              dispatchScore(engine.score);
              setGameState("game_over");
            }
          } else {
            // Cosmic Scrap Absorption!
            audio.playScrapAbsorb();
            v.mass = Math.min(100, v.mass + 3);
            engine.absorbedCount++;
            engine.score += 200;
            setSingularityMass(v.mass);
            setScrapAbsorbed(engine.absorbedCount);
            setScore(engine.score);
          }

          engine.scraps.splice(i, 1);
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
      const v = engine.vortex;

      ctx.fillStyle = "#090514";
      ctx.fillRect(0, 0, w, h);

      // Draw Gravitational Field Pull Ring
      ctx.strokeStyle = engine.keys.pull ? "rgba(168, 85, 247, 0.4)" : "rgba(168, 85, 247, 0.15)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(v.x, v.y, engine.keys.pull ? 250 : 130, 0, Math.PI * 2);
      ctx.stroke();

      // Draw Cosmic Scraps
      engine.scraps.forEach(scrap => {
        ctx.save();
        ctx.shadowBlur = 18;
        ctx.shadowColor = scrap.color;
        ctx.fillStyle = scrap.color;
        ctx.beginPath();
        ctx.arc(scrap.x, scrap.y, scrap.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });

      // Draw Vortex Core
      ctx.save();
      ctx.shadowBlur = 35;
      ctx.shadowColor = "#a855f7";
      ctx.fillStyle = "#a855f7";
      ctx.beginPath();
      ctx.arc(v.x, v.y, v.radius, 0, Math.PI * 2);
      ctx.fill();

      // Black Hole Inner Center
      ctx.fillStyle = "#000000";
      ctx.beginPath();
      ctx.arc(v.x, v.y, v.radius * 0.55, 0, Math.PI * 2);
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
      if (e.key === "w" || e.key === "W" || e.key === "ArrowUp") keys.up = true;
      if (e.key === "s" || e.key === "S" || e.key === "ArrowDown") keys.down = true;

      if (e.key === " " || e.key === "Enter") {
        keys.pull = true;
        audio.playSingularityPull();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const keys = engineRef.current.keys;
      if (e.key === "a" || e.key === "A" || e.key === "ArrowLeft") keys.left = false;
      if (e.key === "d" || e.key === "D" || e.key === "ArrowRight") keys.right = false;
      if (e.key === "w" || e.key === "W" || e.key === "ArrowUp") keys.up = false;
      if (e.key === "s" || e.key === "S" || e.key === "ArrowDown") keys.down = false;
      if (e.key === " " || e.key === "Enter") keys.pull = false;
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
  const triggerMobileUpStart = () => { audio.init(); engineRef.current.keys.up = true; };
  const triggerMobileUpEnd = () => { engineRef.current.keys.up = false; };
  const triggerMobileDownStart = () => { audio.init(); engineRef.current.keys.down = true; };
  const triggerMobileDownEnd = () => { engineRef.current.keys.down = false; };
  const triggerMobilePullStart = () => {
    audio.init();
    audio.playSingularityPull();
    engineRef.current.keys.pull = true;
  };
  const triggerMobilePullEnd = () => { engineRef.current.keys.pull = false; };

  const startGame = (selectedMode: VortexMode) => {
    setMode(selectedMode);
    initVortex();
    setGameState("playing");
  };

  return (
    <div className="w-full h-screen bg-[#090514] text-white relative overflow-hidden font-sans select-none">
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full block" />

      <div className="absolute top-0 inset-x-0 p-4 flex justify-between items-center z-30 pointer-events-none">
        <Link
          href="/games"
          className="pointer-events-auto flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold"
        >
          <ArrowLeft className="w-4 h-4" /> Exit Vortex
        </Link>
        <button
          onClick={toggleSound}
          className="pointer-events-auto p-2 rounded-xl bg-white/5 border border-white/10"
        >
          {soundEnabled ? <Volume2 className="w-4 h-4 text-purple-400" /> : <VolumeX className="w-4 h-4 text-rose-400" />}
        </button>
      </div>

      {gameState === "playing" && (
        <>
          <div className="absolute top-4 inset-x-0 flex justify-center pointer-events-none z-20">
            <div className="bg-[#0b0f19]/90 border border-purple-500/30 px-8 py-3 rounded-2xl backdrop-blur-md flex items-center gap-8 pointer-events-auto">
              <div className="text-center">
                <div className="text-[10px] font-black uppercase text-white/40 tracking-wider">SINGULARITY MASS</div>
                <div className="text-lg font-black text-purple-400">{singularityMass}%</div>
              </div>

              <div className="text-center">
                <div className="text-[10px] font-black uppercase text-white/40 tracking-wider">SCRAP ABSORBED</div>
                <div className="text-xl font-black text-cyan-400">{scrapAbsorbed}</div>
              </div>

              <div className="text-center">
                <div className="text-[10px] font-black uppercase text-white/40 tracking-wider">VORTEX SCORE</div>
                <div className="text-xl font-black text-pink-400">{score}</div>
              </div>
            </div>
          </div>

          {/* MOBILE TOUCH CONTROLS OVERLAY - ONLY FOR SMALL TOUCH SCREENS */}
          {isMobileScreen && (
            <div className="absolute bottom-6 inset-x-6 flex justify-between items-center z-30 md:hidden lg:hidden pointer-events-auto">
            <div className="flex flex-col gap-2 items-center">
              <button
                onTouchStart={triggerMobileUpStart}
                onTouchEnd={triggerMobileUpEnd}
                className="w-12 h-12 rounded-xl bg-white/10 border border-white/20 active:scale-95 flex items-center justify-center font-bold"
              >
                ▲
              </button>
              <div className="flex gap-2">
                <button
                  onTouchStart={triggerMobileLeftStart}
                  onTouchEnd={triggerMobileLeftEnd}
                  className="w-12 h-12 rounded-xl bg-white/10 border border-white/20 active:scale-95 flex items-center justify-center font-bold"
                >
                  ◀
                </button>
                <button
                  onTouchStart={triggerMobileDownStart}
                  onTouchEnd={triggerMobileDownEnd}
                  className="w-12 h-12 rounded-xl bg-white/10 border border-white/20 active:scale-95 flex items-center justify-center font-bold"
                >
                  ▼
                </button>
                <button
                  onTouchStart={triggerMobileRightStart}
                  onTouchEnd={triggerMobileRightEnd}
                  className="w-12 h-12 rounded-xl bg-white/10 border border-white/20 active:scale-95 flex items-center justify-center font-bold"
                >
                  ▶
                </button>
              </div>
            </div>

            <button
              onTouchStart={triggerMobilePullStart}
              onTouchEnd={triggerMobilePullEnd}
              className="w-20 h-20 rounded-full bg-gradient-to-tr from-purple-500 to-indigo-600 border border-purple-300 active:scale-90 flex items-center justify-center font-black text-xs uppercase tracking-wider"
            >
              PULL
            </button>
          </div>
          )}
        </>
      )}

      {gameState === "menu" && (
        <div className="absolute inset-0 z-40 bg-[#070312]/90 backdrop-blur-2xl flex flex-col items-center justify-center p-6 overflow-y-auto">
          {/* Ambient Glowing Orbs */}
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-purple-600/20 rounded-full blur-[120px] pointer-events-none animate-pulse" />
          <div className="absolute bottom-1/4 left-1/3 w-80 h-80 bg-indigo-600/15 rounded-full blur-[100px] pointer-events-none" />

          <motion.div
            initial={{ scale: 0.88, opacity: 0, y: 10 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="text-center max-w-2xl mb-8 z-10"
          >
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-purple-500/10 border border-purple-500/30 text-purple-300 text-xs font-black uppercase tracking-widest mb-4 shadow-[0_0_20px_rgba(168,85,247,0.2)]">
              <Orbit className="w-4 h-4 text-purple-400 animate-spin" style={{ animationDuration: "8s" }} /> Gravitational Singularity Core
            </div>

            <h1 className="text-7xl md:text-8xl font-black uppercase tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-purple-300 via-indigo-300 to-purple-500 drop-shadow-[0_0_40px_rgba(168,85,247,0.6)]">
              VORTEX
            </h1>
            <p className="text-base text-purple-100/70 mt-4 max-w-lg mx-auto leading-relaxed">
              Steer a high-density singularity core to pull in cosmic scrap while dodging volatile antimatter shockwaves.
            </p>

            <div className="flex justify-center gap-3 mt-4">
              <span className="px-3 py-1 rounded-md bg-white/5 border border-white/10 text-[10px] font-mono text-purple-300">60 FPS ENGINE</span>
              <span className="px-3 py-1 rounded-md bg-white/5 border border-white/10 text-[10px] font-mono text-cyan-300">ONLINE LEADERBOARD</span>
              <span className="px-3 py-1 rounded-md bg-white/5 border border-white/10 text-[10px] font-mono text-emerald-300">TOUCH READY</span>
            </div>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 max-w-xl w-full z-10">
            <button
              onClick={() => startGame("vortex_core")}
              className="group p-6 rounded-3xl bg-slate-900/80 border border-purple-500/40 hover:border-purple-400 hover:shadow-[0_0_35px_rgba(168,85,247,0.35)] flex flex-col items-center gap-3 transition-all duration-300 hover:-translate-y-1 text-center backdrop-blur-xl relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-tr from-purple-600/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="p-3.5 rounded-2xl bg-purple-500/10 border border-purple-500/30 group-hover:scale-110 transition-transform">
                <User className="w-8 h-8 text-purple-300" />
              </div>
              <div className="font-black text-xl text-white tracking-wide">VORTEX CORE</div>
              <div className="text-xs text-purple-200/60">Single player singularity absorption & survival</div>
              <div className="mt-2 px-3 py-1 rounded-full bg-purple-500/20 text-purple-300 text-[10px] font-black tracking-wider uppercase">
                PLAY SOLO
              </div>
            </button>

            <button
              onClick={() => startGame("singularity_war")}
              className="group p-6 rounded-3xl bg-slate-900/80 border border-indigo-500/40 hover:border-indigo-400 hover:shadow-[0_0_35px_rgba(99,102,241,0.35)] flex flex-col items-center gap-3 transition-all duration-300 hover:-translate-y-1 text-center backdrop-blur-xl relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-tr from-indigo-600/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="p-3.5 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 group-hover:scale-110 transition-transform">
                <Users className="w-8 h-8 text-indigo-300" />
              </div>
              <div className="font-black text-xl text-white tracking-wide">SINGULARITY WAR</div>
              <div className="text-xs text-indigo-200/60">2-Player competitive gravitational well clash</div>
              <div className="mt-2 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-[10px] font-black tracking-wider uppercase">
                VERSUS MODE
              </div>
            </button>
          </div>

          {/* Controls Quick Guide */}
          <div className="mt-8 z-10 flex flex-wrap items-center justify-center gap-6 text-xs text-white/50 bg-black/40 px-6 py-3 rounded-2xl border border-white/10">
            <div className="flex items-center gap-2">
              <span className="font-mono text-purple-300 bg-white/10 px-2 py-0.5 rounded border border-white/10 font-bold">WASD / ARROWS</span>
              <span>Move Core</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-cyan-300 bg-white/10 px-2 py-0.5 rounded border border-white/10 font-bold">SPACE / ENTER</span>
              <span>Singularity Pull</span>
            </div>
          </div>
        </div>
      )}

      {gameState === "game_over" && (
        <div className="absolute inset-0 z-50 bg-black/90 backdrop-blur-2xl flex flex-col items-center justify-center p-6">
          <motion.div
            initial={{ scale: 0.88, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="text-center max-w-md w-full bg-slate-900/90 border border-purple-500/40 p-8 rounded-3xl shadow-[0_0_50px_rgba(168,85,247,0.3)] relative overflow-hidden"
          >
            <div className="absolute -top-12 -left-12 w-36 h-36 bg-purple-500/20 rounded-full blur-3xl pointer-events-none" />

            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/30 text-purple-300 text-xs font-bold uppercase tracking-wider mb-4">
              <Trophy className="w-3.5 h-3.5 text-amber-400" /> Trial Concluded
            </div>

            <h2 className="text-4xl font-black uppercase text-transparent bg-clip-text bg-gradient-to-r from-purple-300 to-indigo-300 mb-2">
              {winnerName ? `${winnerName}` : "Core Collapsed"}
            </h2>
            <p className="text-xs text-purple-200/60 mb-6">Gravitational Singularity Absorption Results</p>

            <div className="grid grid-cols-2 gap-3 mb-6">
              <div className="p-3 rounded-2xl bg-white/5 border border-white/10">
                <div className="text-[10px] text-white/40 font-black uppercase">FINAL SCORE</div>
                <div className="text-2xl font-black text-purple-300">{score}</div>
              </div>
              <div className="p-3 rounded-2xl bg-white/5 border border-white/10">
                <div className="text-[10px] text-white/40 font-black uppercase">SCRAP ABSORBED</div>
                <div className="text-2xl font-black text-cyan-300">{scrapAbsorbed}</div>
              </div>
            </div>

            <div className="flex gap-4">
              <button
                onClick={() => startGame(mode)}
                className="flex-1 py-3.5 rounded-2xl bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-400 hover:to-indigo-500 text-white font-black uppercase tracking-wider shadow-[0_0_20px_rgba(168,85,247,0.4)] active:scale-95 transition-all"
              >
                REMATCH
              </button>
              <button
                onClick={() => setGameState("menu")}
                className="px-6 py-3.5 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-bold uppercase tracking-wider border border-white/10 active:scale-95 transition-all"
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
