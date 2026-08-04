"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Magnet,
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
  Plus,
  Minus,
  Smartphone
} from "lucide-react";
import Link from "next/link";
import { useUser, useFirestore, setDocumentNonBlocking } from "@/firebase";
import { doc, increment } from "firebase/firestore";

// ==========================================
// FLUX GAME TYPES
// ==========================================

export type FluxMode = "flux_accelerator" | "polarity_duel";
export type MagneticPolarity = "positive" | "negative";

export interface ChargedParticle {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  charge: MagneticPolarity;
  color: string;
}

// ==========================================
// WEB AUDIO SYNTHESIZER
// ==========================================

class FluxAudioSynth {
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

  playPolarityFlip() {
    if (this.muted || !this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(500, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1000, this.ctx.currentTime + 0.08);

      gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.08);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.08);
    } catch (e) {}
  }

  playParticleCapture() {
    if (this.muted || !this.ctx) return;
    try {
      [523.25, 659.25, 783.99].forEach((freq, i) => {
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

  playOverchargeHit() {
    if (this.muted || !this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(180, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(50, this.ctx.currentTime + 0.2);

      gain.gain.setValueAtTime(0.25, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.2);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.2);
    } catch (e) {}
  }
}

const audio = new FluxAudioSynth();

// ==========================================
// FLUX GAME COMPONENT
// ==========================================

export default function FluxGame() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const { user } = useUser();
  const firestore = useFirestore();

  const [gameState, setGameState] = useState<"menu" | "playing" | "paused" | "game_over">("menu");
  const [mode, setMode] = useState<FluxMode>("flux_accelerator");
  const [soundEnabled, setSoundEnabled] = useState(true);

  // HUD Metrics
  const [containmentEnergy, setContainmentEnergy] = useState(100);
  const [polarity, setPolarity] = useState<MagneticPolarity>("positive");
  const [particlesCaptured, setParticlesCaptured] = useState(0);
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
    keys: { left: false, right: false, up: false, down: false },
    player: { x: 300, y: 300, radius: 26, polarity: "positive" as MagneticPolarity, energy: 100 },
    particles: [] as ChargedParticle[],
    capturedCount: 0,
    score: 0,
    frameCount: 0
  });

  const toggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    audio.muted = !next;
  };

  const togglePolarity = (target?: MagneticPolarity) => {
    audio.init();
    audio.playPolarityFlip();
    const next = target || (engineRef.current.player.polarity === "positive" ? "negative" : "positive");
    engineRef.current.player.polarity = next;
    setPolarity(next);
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
            displayName: user.displayName || "Flux Physicist",
            points: increment(points),
            updatedAt: new Date().toISOString()
          },
          { merge: true }
        );
      }
    }
  };

  const initFlux = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const w = (canvas.width = canvas.parentElement?.clientWidth || window.innerWidth);
    const h = (canvas.height = canvas.parentElement?.clientHeight || window.innerHeight);

    const engine = engineRef.current;
    engine.player = { x: w / 2, y: h / 2, radius: 26, polarity: "positive", energy: 100 };
    engine.particles = [];
    engine.capturedCount = 0;
    engine.score = 0;
    engine.frameCount = 0;

    setContainmentEnergy(100);
    setPolarity("positive");
    setParticlesCaptured(0);
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
      const p = engine.player;
      const keys = engine.keys;

      // Player Movement
      const speed = 4.6;
      if (keys.left) p.x = Math.max(p.radius, p.x - speed);
      if (keys.right) p.x = Math.min(w - p.radius, p.x + speed);
      if (keys.up) p.y = Math.max(p.radius, p.y - speed);
      if (keys.down) p.y = Math.min(h - p.radius, p.y + speed);

      engine.frameCount++;

      // Spawn Charged Particles
      if (engine.frameCount % 45 === 0) {
        const isPos = Math.random() < 0.5;
        const side = Math.floor(Math.random() * 4);
        let sx = 0, sy = 0;

        if (side === 0) { sx = Math.random() * w; sy = -20; }
        else if (side === 1) { sx = w + 20; sy = Math.random() * h; }
        else if (side === 2) { sx = Math.random() * w; sy = h + 20; }
        else { sx = -20; sy = Math.random() * h; }

        const angle = Math.atan2(p.y - sy, p.x - sx);

        engine.particles.push({
          id: `part_${Date.now()}_${Math.random()}`,
          x: sx,
          y: sy,
          vx: Math.cos(angle) * (2.0 + Math.random() * 1.5),
          vy: Math.sin(angle) * (2.0 + Math.random() * 1.5),
          radius: 12,
          charge: isPos ? "positive" : "negative",
          color: isPos ? "#3b82f6" : "#ef4444"
        });
      }

      // Magnetic Forces
      engine.particles.forEach(part => {
        const dx = p.x - part.x;
        const dy = p.y - part.y;
        const dist = Math.hypot(dx, dy);

        if (dist < 200) {
          const attract = part.charge !== p.polarity; // Opposite charges attract!
          const force = (attract ? 0.25 : -0.2) * (1 - dist / 200);
          part.vx += (dx / dist) * force;
          part.vy += (dy / dist) * force;
        }

        part.x += part.vx;
        part.y += part.vy;
      });

      // Capture Collisions
      for (let i = engine.particles.length - 1; i >= 0; i--) {
        const part = engine.particles[i];
        const dist = Math.hypot(part.x - p.x, part.y - p.y);

        if (dist < p.radius + part.radius) {
          if (part.charge !== p.polarity) {
            // Opposite Charge Capture!
            audio.playParticleCapture();
            engine.capturedCount++;
            engine.score += 200;
            setParticlesCaptured(engine.capturedCount);
            setScore(engine.score);
          } else {
            // Like Charge Overcharge Blast!
            audio.playOverchargeHit();
            p.energy = Math.max(0, p.energy - 15);
            setContainmentEnergy(p.energy);

            if (p.energy <= 0) {
              setWinnerName("Magnetic Core Overcharge");
              dispatchScore(engine.score);
              setGameState("game_over");
            }
          }

          engine.particles.splice(i, 1);
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
      const p = engine.player;

      ctx.fillStyle = "#030712";
      ctx.fillRect(0, 0, w, h);

      // Draw Particles
      engine.particles.forEach(part => {
        ctx.save();
        ctx.shadowBlur = 15;
        ctx.shadowColor = part.color;
        ctx.fillStyle = part.color;
        ctx.beginPath();
        ctx.arc(part.x, part.y, part.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });

      // Draw Player Flux Core
      const playerColor = p.polarity === "positive" ? "#3b82f6" : "#ef4444";
      ctx.save();
      ctx.shadowBlur = 30;
      ctx.shadowColor = playerColor;
      ctx.fillStyle = playerColor;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fill();

      // Outer Polarity Ring
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius + 6, 0, Math.PI * 2);
      ctx.stroke();

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

      if (e.key === " " || e.key === "Enter") togglePolarity();
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const keys = engineRef.current.keys;
      if (e.key === "a" || e.key === "A" || e.key === "ArrowLeft") keys.left = false;
      if (e.key === "d" || e.key === "D" || e.key === "ArrowRight") keys.right = false;
      if (e.key === "w" || e.key === "W" || e.key === "ArrowUp") keys.up = false;
      if (e.key === "s" || e.key === "S" || e.key === "ArrowDown") keys.down = false;
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

  const startGame = (selectedMode: FluxMode) => {
    setMode(selectedMode);
    initFlux();
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
          <ArrowLeft className="w-4 h-4" /> Exit Flux
        </Link>
        <button
          onClick={toggleSound}
          className="pointer-events-auto p-2 rounded-xl bg-white/5 border border-white/10"
        >
          {soundEnabled ? <Volume2 className="w-4 h-4 text-blue-400" /> : <VolumeX className="w-4 h-4 text-rose-400" />}
        </button>
      </div>

      {gameState === "playing" && (
        <>
          <div className="absolute top-4 inset-x-0 flex justify-center pointer-events-none z-20">
            <div className="bg-[#0b0f19]/90 border border-blue-500/30 px-8 py-3 rounded-2xl backdrop-blur-md flex items-center gap-8 pointer-events-auto">
              <div className="text-center">
                <div className="text-[10px] font-black uppercase text-white/40 tracking-wider">CONTAINMENT ENERGY</div>
                <div className="text-lg font-black text-emerald-400">{containmentEnergy}%</div>
              </div>

              <div className="text-center">
                <div className="text-[10px] font-black uppercase text-white/40 tracking-wider">POLARITY</div>
                <div className="text-xl font-black uppercase" style={{ color: polarity === "positive" ? "#3b82f6" : "#ef4444" }}>
                  {polarity === "positive" ? "+ POSITIVE" : "- NEGATIVE"}
                </div>
              </div>

              <div className="text-center">
                <div className="text-[10px] font-black uppercase text-white/40 tracking-wider">FLUX SCORE</div>
                <div className="text-xl font-black text-cyan-400">{score}</div>
              </div>
            </div>
          </div>

          {/* MOBILE TOUCH POLARITY SWAP BUTTONS & D-PAD - ONLY FOR SMALL TOUCH SCREENS */}
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

            <div className="flex gap-3">
              <button
                onTouchStart={() => togglePolarity("positive")}
                className="w-16 h-16 rounded-2xl bg-blue-600 border border-blue-300 active:scale-90 font-black text-lg text-white"
              >
                +
              </button>
              <button
                onTouchStart={() => togglePolarity("negative")}
                className="w-16 h-16 rounded-2xl bg-red-600 border border-red-300 active:scale-90 font-black text-lg text-white"
              >
                -
              </button>
            </div>
          </div>
          )}
        </>
      )}

      {gameState === "menu" && (
        <div className="absolute inset-0 z-40 bg-[#030712]/95 backdrop-blur-xl flex flex-col items-center justify-center p-6">
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center max-w-xl mb-8">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 text-xs font-bold uppercase tracking-widest mb-3">
              <Magnet className="w-3.5 h-3.5" /> Electromagnetic Polarity Accelerator
            </div>
            <h1 className="text-6xl font-black uppercase tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-red-400">
              FLUX
            </h1>
            <p className="text-sm text-white/60 mt-3">
              Toggle magnetic flux polarity between Positive and Negative to attract opposite charges and avoid overcharge.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-lg w-full">
            <button
              onClick={() => startGame("flux_accelerator")}
              className="p-5 rounded-2xl bg-[#0b0f19] border border-blue-500/40 hover:border-blue-400 flex flex-col items-center gap-2 hover:scale-105 transition-all text-center"
            >
              <User className="w-8 h-8 text-blue-400" />
              <div className="font-black text-lg">FLUX ACCELERATOR</div>
              <div className="text-xs text-white/50">Single player particle capture</div>
            </button>

            <button
              onClick={() => startGame("polarity_duel")}
              className="p-5 rounded-2xl bg-[#0b0f19] border border-red-500/40 hover:border-red-400 flex flex-col items-center gap-2 hover:scale-105 transition-all text-center"
            >
              <Users className="w-8 h-8 text-red-400" />
              <div className="font-black text-lg">POLARITY DUEL</div>
              <div className="text-xs text-white/50">2-Player magnetic clash</div>
            </button>
          </div>
        </div>
      )}

      {gameState === "game_over" && (
        <div className="absolute inset-0 z-50 bg-black/85 backdrop-blur-md flex flex-col items-center justify-center p-6">
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center max-w-md w-full">
            <h2 className="text-4xl font-black uppercase text-blue-400 mb-2">
              {winnerName ? `${winnerName}!` : "Core Overcharged"}
            </h2>
            <p className="text-xs text-white/50 mb-6">Electromagnetic Polarity Trial Concluded</p>

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
