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
  Flame,
  Layers,
  Pickaxe,
  Smartphone
} from "lucide-react";
import Link from "next/link";
import { useUser, useFirestore, setDocumentNonBlocking } from "@/firebase";
import { doc, increment } from "firebase/firestore";

// ==========================================
// STRATA GAME TYPES
// ==========================================

export type StrataMode = "deep_dig_expedition" | "tectonic_race";

export interface StrataGem {
  id: string;
  x: number;
  y: number;
  radius: number;
  collected: boolean;
  color: string;
}

export interface MagmaPocket {
  id: string;
  x: number;
  y: number;
  radius: number;
  color: string;
}

// ==========================================
// WEB AUDIO SYNTHESIZER
// ==========================================

class StrataAudioSynth {
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

  playDrillSound() {
    if (this.muted || !this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(140, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(70, this.ctx.currentTime + 0.1);

      gain.gain.setValueAtTime(0.15, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.1);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.1);
    } catch (e) {}
  }

  playGemCollect() {
    if (this.muted || !this.ctx) return;
    try {
      [600, 900, 1200, 1500].forEach((freq, i) => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, this.ctx!.currentTime + i * 0.04);

        gain.gain.setValueAtTime(0.2, this.ctx!.currentTime + i * 0.04);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx!.currentTime + i * 0.04 + 0.12);

        osc.connect(gain);
        gain.connect(this.ctx!.destination);
        osc.start(this.ctx!.currentTime + i * 0.04);
        osc.stop(this.ctx!.currentTime + i * 0.04 + 0.12);
      });
    } catch (e) {}
  }

  playMagmaHiss() {
    if (this.muted || !this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "square";
      osc.frequency.setValueAtTime(220, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(80, this.ctx.currentTime + 0.3);

      gain.gain.setValueAtTime(0.25, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.3);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.3);
    } catch (e) {}
  }
}

const audio = new StrataAudioSynth();

// ==========================================
// STRATA GAME COMPONENT
// ==========================================

export default function StrataGame() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const { user } = useUser();
  const firestore = useFirestore();

  const [gameState, setGameState] = useState<"menu" | "playing" | "paused" | "game_over">("menu");
  const [mode, setMode] = useState<StrataMode>("deep_dig_expedition");
  const [soundEnabled, setSoundEnabled] = useState(true);

  // HUD Metrics
  const [depthMeters, setDepthMeters] = useState(0);
  const [hullHeat, setHullHeat] = useState(0);
  const [score, setScore] = useState(0);
  const [winnerName, setWinnerName] = useState<string | null>(null);

  const engineRef = useRef({
    keys: {
      left: false, right: false, down: false, boost: false
    },
    drill1: { x: 300, y: 100, vy: 2.0, speedX: 5.0, radius: 18, color: "#eab308", heat: 0, score: 0 },
    gems: [] as StrataGem[],
    magma: [] as MagmaPocket[],
    depth: 0,
    frameCount: 0
  });

  const toggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    audio.muted = !next;
  };

  const dispatchScore = (finalScore: number) => {
    if (typeof window !== "undefined" && finalScore > 0) {
      const points = Math.floor(finalScore / 30) + 15;
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
            displayName: user.displayName || "Strata Excavator",
            points: increment(points),
            updatedAt: new Date().toISOString()
          },
          { merge: true }
        );
      }
    }
  };

  const initStrata = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const w = (canvas.width = canvas.parentElement?.clientWidth || window.innerWidth);
    const h = (canvas.height = canvas.parentElement?.clientHeight || window.innerHeight);

    const engine = engineRef.current;
    engine.drill1 = { x: w / 2, y: 100, vy: 2.0, speedX: 5.0, radius: 18, color: "#eab308", heat: 0, score: 0 };
    engine.depth = 0;
    engine.frameCount = 0;

    // Scatter Minerals & Magma Pockets in Geological Layers
    const gems: StrataGem[] = [];
    const magma: MagmaPocket[] = [];
    const layerColors = ["#38bdf8", "#a855f7", "#eab308", "#10b981"];

    for (let i = 0; i < 15; i++) {
      gems.push({
        id: `gem_${i}`,
        x: Math.random() * (w - 60) + 30,
        y: 200 + i * 140 + Math.random() * 60,
        radius: 12,
        collected: false,
        color: layerColors[i % layerColors.length]
      });

      if (i % 2 === 1) {
        magma.push({
          id: `mag_${i}`,
          x: Math.random() * (w - 80) + 40,
          y: 260 + i * 140,
          radius: 22,
          color: "#ef4444"
        });
      }
    }

    engine.gems = gems;
    engine.magma = magma;

    setDepthMeters(0);
    setHullHeat(0);
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
      const d1 = engine.drill1;

      engine.frameCount++;

      // Drill Steering Controls
      if (keys.left) d1.x = Math.max(d1.radius, d1.x - d1.speedX);
      if (keys.right) d1.x = Math.min(w - d1.radius, d1.x + d1.speedX);

      const boostMult = keys.boost ? 2.5 : 1.0;
      if (keys.boost) audio.playDrillSound();

      d1.y += d1.vy * boostMult;
      engine.depth = Math.floor(d1.y / 10);
      setDepthMeters(engine.depth);

      // Check Minerals Pickup
      engine.gems.forEach(gem => {
        if (!gem.collected && Math.hypot(d1.x - gem.x, d1.y - gem.y) < d1.radius + gem.radius) {
          gem.collected = true;
          audio.playGemCollect();
          d1.score += 250;
          setScore(d1.score);
        }
      });

      // Check Magma Overheat
      engine.magma.forEach(mag => {
        if (Math.hypot(d1.x - mag.x, d1.y - mag.y) < d1.radius + mag.radius) {
          audio.playMagmaHiss();
          d1.heat = Math.min(100, d1.heat + 0.8);
          setHullHeat(d1.heat);

          if (d1.heat >= 100) {
            setWinnerName("Drill Rig Thermal Meltdown");
            dispatchScore(d1.score);
            setGameState("game_over");
          }
        }
      });

      // Reached Geothermal Core Target Depth
      if (engine.depth >= 250) {
        setWinnerName("Geothermal Core Reached");
        dispatchScore(d1.score + (100 - Math.ceil(d1.heat)) * 20);
        setGameState("game_over");
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

      ctx.fillStyle = "#1c1917";
      ctx.fillRect(0, 0, w, h);

      // Draw Strata Geological Layers
      const layers = ["#292524", "#1c1917", "#0c0a09", "#451a03"];
      const layerHeight = 350;
      for (let i = 0; i < 4; i++) {
        const ly = i * layerHeight - (engine.drill1.y % layerHeight);
        ctx.fillStyle = layers[i % layers.length];
        ctx.fillRect(0, ly, w, layerHeight);
      }

      // Draw Subterranean Minerals
      engine.gems.forEach(gem => {
        if (!gem.collected) {
          ctx.save();
          ctx.shadowBlur = 18;
          ctx.shadowColor = gem.color;
          ctx.fillStyle = gem.color;
          ctx.beginPath();
          ctx.arc(gem.x, gem.y, gem.radius, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }
      });

      // Draw Magma Pockets
      engine.magma.forEach(mag => {
        ctx.save();
        ctx.shadowBlur = 22;
        ctx.shadowColor = mag.color;
        ctx.fillStyle = mag.color;
        ctx.beginPath();
        ctx.arc(mag.x, mag.y, mag.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });

      // Draw Plasma Drill Rig
      const d = engine.drill1;
      ctx.save();
      ctx.shadowBlur = 25;
      ctx.shadowColor = d.color;
      ctx.fillStyle = d.color;
      ctx.beginPath();
      ctx.moveTo(d.x, d.y + d.radius * 1.5);
      ctx.lineTo(d.x - d.radius, d.y - d.radius);
      ctx.lineTo(d.x + d.radius, d.y - d.radius);
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
      if (e.key === " " || e.key === "Shift") keys.boost = true;
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const keys = engineRef.current.keys;
      if (e.key === "a" || e.key === "A" || e.key === "ArrowLeft") keys.left = false;
      if (e.key === "d" || e.key === "D" || e.key === "ArrowRight") keys.right = false;
      if (e.key === " " || e.key === "Shift") keys.boost = false;
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, []);

  const triggerMobileLeftStart = () => {
    audio.init();
    engineRef.current.keys.left = true;
  };
  const triggerMobileLeftEnd = () => {
    engineRef.current.keys.left = false;
  };

  const triggerMobileRightStart = () => {
    audio.init();
    engineRef.current.keys.right = true;
  };
  const triggerMobileRightEnd = () => {
    engineRef.current.keys.right = false;
  };

  const triggerMobileBoostStart = () => {
    audio.init();
    engineRef.current.keys.boost = true;
  };
  const triggerMobileBoostEnd = () => {
    engineRef.current.keys.boost = false;
  };

  const startGame = (selectedMode: StrataMode) => {
    setMode(selectedMode);
    initStrata();
    setGameState("playing");
  };

  return (
    <div className="w-full h-screen bg-[#1c1917] text-white relative overflow-hidden font-sans select-none">
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full block" />

      <div className="absolute top-0 inset-x-0 p-4 flex justify-between items-center z-30 pointer-events-none">
        <Link
          href="/games"
          className="pointer-events-auto flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold"
        >
          <ArrowLeft className="w-4 h-4" /> Exit Strata
        </Link>
        <button
          onClick={toggleSound}
          className="pointer-events-auto p-2 rounded-xl bg-white/5 border border-white/10"
        >
          {soundEnabled ? <Volume2 className="w-4 h-4 text-amber-400" /> : <VolumeX className="w-4 h-4 text-rose-400" />}
        </button>
      </div>

      {gameState === "playing" && (
        <>
          <div className="absolute top-4 inset-x-0 flex justify-center pointer-events-none z-20">
            <div className="bg-[#0b0f19]/90 border border-amber-500/30 px-8 py-3 rounded-2xl backdrop-blur-md flex items-center gap-8 pointer-events-auto">
              <div className="text-center">
                <div className="text-[10px] font-black uppercase text-white/40 tracking-wider">DEPTH METERS</div>
                <div className="text-lg font-black text-amber-400">{depthMeters}m</div>
              </div>

              <div className="text-center">
                <div className="text-[10px] font-black uppercase text-white/40 tracking-wider">HULL HEAT</div>
                <div className="text-xl font-black text-rose-400">{Math.ceil(hullHeat)}%</div>
              </div>

              <div className="text-center">
                <div className="text-[10px] font-black uppercase text-white/40 tracking-wider">MINERAL SCORE</div>
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
                onMouseDown={triggerMobileLeftStart}
                onMouseUp={triggerMobileLeftEnd}
                className="w-16 h-16 rounded-2xl bg-amber-600/40 border border-amber-400/60 active:scale-95 flex items-center justify-center font-black text-2xl"
              >
                ◀
              </button>
              <button
                onTouchStart={triggerMobileRightStart}
                onTouchEnd={triggerMobileRightEnd}
                onMouseDown={triggerMobileRightStart}
                onMouseUp={triggerMobileRightEnd}
                className="w-16 h-16 rounded-2xl bg-amber-600/40 border border-amber-400/60 active:scale-95 flex items-center justify-center font-black text-2xl"
              >
                ▶
              </button>
            </div>

            <button
              onTouchStart={triggerMobileBoostStart}
              onTouchEnd={triggerMobileBoostEnd}
              onMouseDown={triggerMobileBoostStart}
              onMouseUp={triggerMobileBoostEnd}
              className="w-20 h-20 rounded-full bg-gradient-to-tr from-amber-500 to-orange-600 border border-amber-300 active:scale-90 flex items-center justify-center font-black text-xs uppercase tracking-wider"
            >
              DRILL
            </button>
          </div>
        </>
      )}

      {gameState === "menu" && (
        <div className="absolute inset-0 z-40 bg-[#1c1917]/95 backdrop-blur-xl flex flex-col items-center justify-center p-6">
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center max-w-xl mb-8">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-bold uppercase tracking-widest mb-3">
              <Layers className="w-3.5 h-3.5" /> Geothermal Core Tectonic Drilling
            </div>
            <h1 className="text-6xl font-black uppercase tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-500">
              STRATA
            </h1>
            <p className="text-sm text-white/60 mt-3">
              Excavate down through geological rock strata, gather subterranean mineral gems, and avoid thermal magma pockets.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-lg w-full">
            <button
              onClick={() => startGame("deep_dig_expedition")}
              className="p-5 rounded-2xl bg-[#0b0f19] border border-amber-500/40 hover:border-amber-400 flex flex-col items-center gap-2 hover:scale-105 transition-all text-center"
            >
              <User className="w-8 h-8 text-amber-400" />
              <div className="font-black text-lg">DEEP DIG</div>
              <div className="text-xs text-white/50">Single player core excavation</div>
            </button>

            <button
              onClick={() => startGame("tectonic_race")}
              className="p-5 rounded-2xl bg-[#0b0f19] border border-orange-500/40 hover:border-orange-400 flex flex-col items-center gap-2 hover:scale-105 transition-all text-center"
            >
              <Users className="w-8 h-8 text-orange-400" />
              <div className="font-black text-lg">TECTONIC RACE</div>
              <div className="text-xs text-white/50">2-Player drill core clash</div>
            </button>
          </div>
        </div>
      )}

      {gameState === "game_over" && (
        <div className="absolute inset-0 z-50 bg-black/85 backdrop-blur-md flex flex-col items-center justify-center p-6">
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center max-w-md w-full">
            <h2 className="text-4xl font-black uppercase text-amber-400 mb-2">
              {winnerName ? `${winnerName}!` : "Excavation Complete"}
            </h2>
            <p className="text-xs text-white/50 mb-6">Geothermal Strata Protocol Concluded</p>

            <div className="flex gap-4">
              <button
                onClick={() => startGame(mode)}
                className="flex-1 py-3.5 rounded-xl bg-amber-500 text-black font-black uppercase"
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
