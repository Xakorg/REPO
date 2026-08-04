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

          {/* MOBILE TOUCH CONTROLS OVERLAY */}
          <div className="absolute bottom-6 inset-x-6 flex justify-between items-center z-30 md:hidden pointer-events-auto">
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
        </>
      )}

      {gameState === "menu" && (
        <div className="absolute inset-0 z-40 bg-[#090514]/95 backdrop-blur-xl flex flex-col items-center justify-center p-6">
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center max-w-xl mb-8">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/30 text-purple-400 text-xs font-bold uppercase tracking-widest mb-3">
              <Orbit className="w-3.5 h-3.5" /> Gravitational Singularity Core
            </div>
            <h1 className="text-6xl font-black uppercase tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-indigo-400">
              VORTEX
            </h1>
            <p className="text-sm text-white/60 mt-3">
              Steer a gravitational singularity core to pull in cosmic scrap while avoiding volatile antimatter mines.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-lg w-full">
            <button
              onClick={() => startGame("vortex_core")}
              className="p-5 rounded-2xl bg-[#0b0f19] border border-purple-500/40 hover:border-purple-400 flex flex-col items-center gap-2 hover:scale-105 transition-all text-center"
            >
              <User className="w-8 h-8 text-purple-400" />
              <div className="font-black text-lg">VORTEX CORE</div>
              <div className="text-xs text-white/50">Single player singularity absorption</div>
            </button>

            <button
              onClick={() => startGame("singularity_war")}
              className="p-5 rounded-2xl bg-[#0b0f19] border border-indigo-500/40 hover:border-indigo-400 flex flex-col items-center gap-2 hover:scale-105 transition-all text-center"
            >
              <Users className="w-8 h-8 text-indigo-400" />
              <div className="font-black text-lg">SINGULARITY WAR</div>
              <div className="text-xs text-white/50">2-Player grav-well clash</div>
            </button>
          </div>
        </div>
      )}

      {gameState === "game_over" && (
        <div className="absolute inset-0 z-50 bg-black/85 backdrop-blur-md flex flex-col items-center justify-center p-6">
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center max-w-md w-full">
            <h2 className="text-4xl font-black uppercase text-purple-400 mb-2">
              {winnerName ? `${winnerName}!` : "Core Collapsed"}
            </h2>
            <p className="text-xs text-white/50 mb-6">Gravitational Singularity Trial Concluded</p>

            <div className="flex gap-4">
              <button
                onClick={() => startGame(mode)}
                className="flex-1 py-3.5 rounded-xl bg-purple-500 text-black font-black uppercase"
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
