"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Anchor,
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
  Waves,
  Shield,
  Smartphone
} from "lucide-react";
import Link from "next/link";
import { useUser, useFirestore, setDocumentNonBlocking } from "@/firebase";
import { doc, increment } from "firebase/firestore";

// ==========================================
// TRENCH GAME TYPES
// ==========================================

export type TrenchMode = "trench_dive" | "abyssal_race";

export interface BenthicOre {
  id: string;
  x: number;
  y: number;
  radius: number;
  value: number;
  color: string;
}

export interface AbyssalLeviathan {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  revealed: boolean;
}

// ==========================================
// WEB AUDIO SYNTHESIZER
// ==========================================

class TrenchAudioSynth {
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

  playSonarPing() {
    if (this.muted || !this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(980, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(490, this.ctx.currentTime + 0.3);

      gain.gain.setValueAtTime(0.3, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.3);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.3);
    } catch (e) {}
  }

  playOreCollect() {
    if (this.muted || !this.ctx) return;
    try {
      [440, 554.37, 659.25, 880].forEach((freq, i) => {
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

  playHullDamage() {
    if (this.muted || !this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(140, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(40, this.ctx.currentTime + 0.25);

      gain.gain.setValueAtTime(0.3, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.25);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.25);
    } catch (e) {}
  }
}

const audio = new TrenchAudioSynth();

// ==========================================
// TRENCH GAME COMPONENT
// ==========================================

export default function TrenchGame() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const { user } = useUser();
  const firestore = useFirestore();

  const [gameState, setGameState] = useState<"menu" | "playing" | "paused" | "game_over">("menu");
  const [mode, setMode] = useState<TrenchMode>("trench_dive");
  const [soundEnabled, setSoundEnabled] = useState(true);

  // HUD Metrics
  const [hullIntegrity, setHullIntegrity] = useState(100);
  const [trenchDepth, setTrenchDepth] = useState(1000);
  const [oreCollected, setOreCollected] = useState(0);
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
    keys: { left: false, right: false, up: false, down: false, sonar: false },
    sub: { x: 300, y: 150, radius: 24, hull: 100, depth: 1000 },
    ores: [] as BenthicOre[],
    leviathans: [] as AbyssalLeviathan[],
    sonarPulse: null as { radius: number; maxRadius: number } | null,
    collectedCount: 0,
    score: 0,
    frameCount: 0
  });

  const toggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    audio.muted = !next;
  };

  const triggerSonarBlast = () => {
    audio.init();
    audio.playSonarPing();
    const engine = engineRef.current;
    engine.sonarPulse = { radius: 10, maxRadius: 280 };

    // Reveal hidden Leviathans in sonar pulse range
    engine.leviathans.forEach(l => {
      const dist = Math.hypot(l.x - engine.sub.x, l.y - engine.sub.y);
      if (dist < 280) l.revealed = true;
    });
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
            displayName: user.displayName || "Abyssal Diver",
            points: increment(points),
            updatedAt: new Date().toISOString()
          },
          { merge: true }
        );
      }
    }
  };

  const initTrench = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const w = (canvas.width = canvas.parentElement?.clientWidth || window.innerWidth);
    const h = (canvas.height = canvas.parentElement?.clientHeight || window.innerHeight);

    const engine = engineRef.current;
    engine.sub = { x: w / 2, y: 150, radius: 24, hull: 100, depth: 1000 };
    engine.ores = [];
    engine.leviathans = [];
    engine.sonarPulse = null;
    engine.collectedCount = 0;
    engine.score = 0;
    engine.frameCount = 0;

    // Spawn Initial Ores & Leviathans
    const colors = ["#06b6d4", "#10b981", "#eab308"];
    for (let i = 0; i < 8; i++) {
      engine.ores.push({
        id: `ore_${i}`,
        x: Math.random() * (w - 80) + 40,
        y: Math.random() * (h - 200) + 150,
        radius: 12,
        value: 200,
        color: colors[i % colors.length]
      });
    }

    for (let i = 0; i < 4; i++) {
      engine.leviathans.push({
        id: `lev_${i}`,
        x: Math.random() * (w - 100) + 50,
        y: Math.random() * (h - 250) + 200,
        vx: (Math.random() - 0.5) * 2.2,
        vy: (Math.random() - 0.5) * 2.2,
        radius: 20,
        revealed: false
      });
    }

    setHullIntegrity(100);
    setTrenchDepth(1000);
    setOreCollected(0);
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
      const sub = engine.sub;
      const keys = engine.keys;

      // Submarine Movement
      const speed = 4.2;
      if (keys.left) sub.x = Math.max(sub.radius, sub.x - speed);
      if (keys.right) sub.x = Math.min(w - sub.radius, sub.x + speed);
      if (keys.up) sub.y = Math.max(sub.radius + 60, sub.y - speed);
      if (keys.down) sub.y = Math.min(h - sub.radius - 40, sub.y + speed);

      sub.depth = Math.floor(1000 + sub.y * 8);
      setTrenchDepth(sub.depth);

      engine.frameCount++;

      // Sonar Pulse Expansion
      if (engine.sonarPulse) {
        engine.sonarPulse.radius += 8;
        if (engine.sonarPulse.radius >= engine.sonarPulse.maxRadius) {
          engine.sonarPulse = null;
        }
      }

      // Update Leviathans
      engine.leviathans.forEach(lev => {
        lev.x += lev.vx;
        lev.y += lev.vy;

        if (lev.x < lev.radius || lev.x > w - lev.radius) lev.vx *= -1;
        if (lev.y < 150 || lev.y > h - 40) lev.vy *= -1;

        // Submarine Collision Damage
        const dist = Math.hypot(lev.x - sub.x, lev.y - sub.y);
        if (dist < lev.radius + sub.radius) {
          audio.playHullDamage();
          sub.hull = Math.max(0, sub.hull - 15);
          setHullIntegrity(sub.hull);

          if (sub.hull <= 0) {
            setWinnerName("Abyssal Pressure Breach");
            dispatchScore(engine.score);
            setGameState("game_over");
          }
        }
      });

      // Collect Benthic Ores
      for (let i = engine.ores.length - 1; i >= 0; i--) {
        const ore = engine.ores[i];
        const dist = Math.hypot(ore.x - sub.x, ore.y - sub.y);

        if (dist < sub.radius + ore.radius) {
          audio.playOreCollect();
          engine.collectedCount++;
          engine.score += ore.value;
          setOreCollected(engine.collectedCount);
          setScore(engine.score);

          engine.ores.splice(i, 1);
        }
      }

      // Respawn Ores if empty
      if (engine.ores.length < 4) {
        const colors = ["#06b6d4", "#10b981", "#eab308"];
        engine.ores.push({
          id: `ore_${Date.now()}`,
          x: Math.random() * (w - 80) + 40,
          y: Math.random() * (h - 200) + 150,
          radius: 12,
          value: 200,
          color: colors[Math.floor(Math.random() * 3)]
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
      const sub = engine.sub;

      ctx.fillStyle = "#02121e";
      ctx.fillRect(0, 0, w, h);

      // Draw Sonar Pulse Wave
      if (engine.sonarPulse) {
        ctx.strokeStyle = "rgba(6, 182, 212, 0.4)";
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(sub.x, sub.y, engine.sonarPulse.radius, 0, Math.PI * 2);
        ctx.stroke();
      }

      // Draw Benthic Ores
      engine.ores.forEach(ore => {
        ctx.save();
        ctx.shadowBlur = 15;
        ctx.shadowColor = ore.color;
        ctx.fillStyle = ore.color;
        ctx.beginPath();
        ctx.arc(ore.x, ore.y, ore.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });

      // Draw Abyssal Leviathans (Only visible if revealed or near sub)
      engine.leviathans.forEach(lev => {
        const dist = Math.hypot(lev.x - sub.x, lev.y - sub.y);
        const isVisible = lev.revealed || dist < 120;

        if (isVisible) {
          ctx.save();
          ctx.shadowBlur = 20;
          ctx.shadowColor = "#ef4444";
          ctx.fillStyle = "#ef4444";
          ctx.beginPath();
          ctx.arc(lev.x, lev.y, lev.radius, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }
      });

      // Draw Submarine
      ctx.save();
      ctx.shadowBlur = 25;
      ctx.shadowColor = "#06b6d4";
      ctx.fillStyle = "#06b6d4";
      ctx.beginPath();
      ctx.arc(sub.x, sub.y, sub.radius, 0, Math.PI * 2);
      ctx.fill();

      // Submarine Searchlight Beam
      ctx.fillStyle = "rgba(255, 255, 255, 0.12)";
      ctx.beginPath();
      ctx.moveTo(sub.x, sub.y);
      ctx.lineTo(sub.x - 70, sub.y + 160);
      ctx.lineTo(sub.x + 70, sub.y + 160);
      ctx.closePath();
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

      if (e.key === " " || e.key === "Enter") triggerSonarBlast();
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

  const startGame = (selectedMode: TrenchMode) => {
    setMode(selectedMode);
    initTrench();
    setGameState("playing");
  };

  return (
    <div className="w-full h-screen bg-[#02121e] text-white relative overflow-hidden font-sans select-none">
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full block" />

      <div className="absolute top-0 inset-x-0 p-4 flex justify-between items-center z-30 pointer-events-none">
        <Link
          href="/games"
          className="pointer-events-auto flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold"
        >
          <ArrowLeft className="w-4 h-4" /> Exit Trench
        </Link>
        <button
          onClick={toggleSound}
          className="pointer-events-auto p-2 rounded-xl bg-white/5 border border-white/10"
        >
          {soundEnabled ? <Volume2 className="w-4 h-4 text-cyan-400" /> : <VolumeX className="w-4 h-4 text-rose-400" />}
        </button>
      </div>

      {gameState === "playing" && (
        <>
          <div className="absolute top-4 inset-x-0 flex justify-center pointer-events-none z-20">
            <div className="bg-[#0b0f19]/90 border border-cyan-500/30 px-8 py-3 rounded-2xl backdrop-blur-md flex items-center gap-8 pointer-events-auto">
              <div className="text-center">
                <div className="text-[10px] font-black uppercase text-white/40 tracking-wider">HULL INTEGRITY</div>
                <div className="text-lg font-black text-cyan-400">{hullIntegrity}%</div>
              </div>

              <div className="text-center">
                <div className="text-[10px] font-black uppercase text-white/40 tracking-wider">ABYSSAL DEPTH</div>
                <div className="text-xl font-black text-emerald-400">{trenchDepth} m</div>
              </div>

              <div className="text-center">
                <div className="text-[10px] font-black uppercase text-white/40 tracking-wider">TRENCH SCORE</div>
                <div className="text-xl font-black text-amber-400">{score}</div>
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
              onTouchStart={triggerSonarBlast}
              onClick={triggerSonarBlast}
              className="w-20 h-20 rounded-full bg-gradient-to-tr from-cyan-500 to-teal-600 border border-cyan-300 active:scale-90 flex items-center justify-center font-black text-xs uppercase tracking-wider"
            >
              SONAR
            </button>
          </div>
          )}
        </>
      )}

      {gameState === "menu" && (
        <div className="absolute inset-0 z-40 bg-[#02121e]/95 backdrop-blur-xl flex flex-col items-center justify-center p-6">
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center max-w-xl mb-8">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs font-bold uppercase tracking-widest mb-3">
              <Anchor className="w-3.5 h-3.5" /> Abyssal Submersible Dredging
            </div>
            <h1 className="text-6xl font-black uppercase tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-emerald-400">
              TRENCH
            </h1>
            <p className="text-sm text-white/60 mt-3">
              Maneuver an oceanic research submersible down deep sea trenches, trigger sonar flares, and collect benthic mineral ores.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-lg w-full">
            <button
              onClick={() => startGame("trench_dive")}
              className="p-5 rounded-2xl bg-[#0b0f19] border border-cyan-500/40 hover:border-cyan-400 flex flex-col items-center gap-2 hover:scale-105 transition-all text-center"
            >
              <User className="w-8 h-8 text-cyan-400" />
              <div className="font-black text-lg">TRENCH DIVE</div>
              <div className="text-xs text-white/50">Single player deep dredging</div>
            </button>

            <button
              onClick={() => startGame("abyssal_race")}
              className="p-5 rounded-2xl bg-[#0b0f19] border border-emerald-500/40 hover:border-emerald-400 flex flex-col items-center gap-2 hover:scale-105 transition-all text-center"
            >
              <Users className="w-8 h-8 text-emerald-400" />
              <div className="font-black text-lg">ABYSSAL RACE</div>
              <div className="text-xs text-white/50">2-Player benthic depth race</div>
            </button>
          </div>
        </div>
      )}

      {gameState === "game_over" && (
        <div className="absolute inset-0 z-50 bg-black/85 backdrop-blur-md flex flex-col items-center justify-center p-6">
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center max-w-md w-full">
            <h2 className="text-4xl font-black uppercase text-cyan-400 mb-2">
              {winnerName ? `${winnerName}!` : "Hull Breached"}
            </h2>
            <p className="text-xs text-white/50 mb-6">Deep Sea Abyssal Protocol Concluded</p>

            <div className="flex gap-4">
              <button
                onClick={() => startGame(mode)}
                className="flex-1 py-3.5 rounded-xl bg-cyan-500 text-black font-black uppercase"
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
