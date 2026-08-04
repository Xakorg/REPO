"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Shield,
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
  RotateCw,
  ShieldCheck,
  Smartphone
} from "lucide-react";
import Link from "next/link";
import { useUser, useFirestore, setDocumentNonBlocking } from "@/firebase";
import { doc, increment } from "firebase/firestore";

// ==========================================
// AEGIS GAME TYPES
// ==========================================

export type AegisMode = "aegis_deflector" | "dual_aegis_arena";

export interface PlasmaBolt {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  reflected: boolean;
  color: string;
}

export interface BatteryNode {
  id: string;
  angle: number;
  distance: number;
  hp: number;
  maxHp: number;
  color: string;
}

// ==========================================
// WEB AUDIO SYNTHESIZER
// ==========================================

class AegisAudioSynth {
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

  playShieldReflect() {
    if (this.muted || !this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(800, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1600, this.ctx.currentTime + 0.12);

      gain.gain.setValueAtTime(0.3, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.12);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.12);
    } catch (e) {}
  }

  playBatteryDestroy() {
    if (this.muted || !this.ctx) return;
    try {
      [300, 450, 600, 900].forEach((freq, i) => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();
        osc.type = "triangle";
        osc.frequency.setValueAtTime(freq, this.ctx!.currentTime + i * 0.05);

        gain.gain.setValueAtTime(0.25, this.ctx!.currentTime + i * 0.05);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx!.currentTime + i * 0.05 + 0.15);

        osc.connect(gain);
        gain.connect(this.ctx!.destination);
        osc.start(this.ctx!.currentTime + i * 0.05);
        osc.stop(this.ctx!.currentTime + i * 0.05 + 0.15);
      });
    } catch (e) {}
  }

  playCoreHit() {
    if (this.muted || !this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(180, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(50, this.ctx.currentTime + 0.25);

      gain.gain.setValueAtTime(0.3, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.25);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.25);
    } catch (e) {}
  }
}

const audio = new AegisAudioSynth();

// ==========================================
// AEGIS GAME COMPONENT
// ==========================================

export default function AegisGame() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const { user } = useUser();
  const firestore = useFirestore();

  const [gameState, setGameState] = useState<"menu" | "playing" | "paused" | "game_over">("menu");
  const [mode, setMode] = useState<AegisMode>("aegis_deflector");
  const [soundEnabled, setSoundEnabled] = useState(true);

  // HUD Metrics
  const [coreIntegrity, setCoreIntegrity] = useState(100);
  const [batteriesDestroyed, setBatteriesDestroyed] = useState(0);
  const [score, setScore] = useState(0);
  const [winnerName, setWinnerName] = useState<string | null>(null);

  const engineRef = useRef({
    keys: {
      left: false, right: false, p2Left: false, p2Right: false
    },
    shieldAngle: 0, // 0 to 2PI
    shieldArc: Math.PI / 3, // 60 degrees arc
    coreHealth: 100,
    bolts: [] as PlasmaBolt[],
    batteries: [] as BatteryNode[],
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
            displayName: user.displayName || "Aegis Commander",
            points: increment(points),
            updatedAt: new Date().toISOString()
          },
          { merge: true }
        );
      }
    }
  };

  const initAegis = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const w = (canvas.width = canvas.parentElement?.clientWidth || window.innerWidth);
    const h = (canvas.height = canvas.parentElement?.clientHeight || window.innerHeight);

    const engine = engineRef.current;
    engine.shieldAngle = 0;
    engine.coreHealth = 100;
    engine.bolts = [];
    engine.score = 0;
    engine.frameCount = 0;

    // Spawn 6 Surrounding Battery Nodes
    const batteries: BatteryNode[] = [];
    const count = 6;
    const dist = Math.min(w, h) * 0.38;
    for (let i = 0; i < count; i++) {
      const angle = (i * Math.PI * 2) / count;
      batteries.push({
        id: `bat_${i}`,
        angle,
        distance: dist,
        hp: 3,
        maxHp: 3,
        color: "#06b6d4"
      });
    }

    engine.batteries = batteries;
    setCoreIntegrity(100);
    setBatteriesDestroyed(0);
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
      const centerX = w / 2;
      const centerY = h / 2;
      const engine = engineRef.current;
      const keys = engine.keys;

      // Shield Rotation Physics
      if (keys.left) engine.shieldAngle -= 0.07;
      if (keys.right) engine.shieldAngle += 0.07;

      engine.frameCount++;

      // Batteries Fire Plasma Bolts Periodic
      engine.batteries.forEach(bat => {
        if (bat.hp > 0 && engine.frameCount % 90 === 0) {
          const bx = centerX + Math.cos(bat.angle) * bat.distance;
          const by = centerY + Math.sin(bat.angle) * bat.distance;
          const dx = centerX - bx;
          const dy = centerY - by;
          const dist = Math.hypot(dx, dy);

          engine.bolts.push({
            id: `bolt_${Date.now()}_${Math.random()}`,
            x: bx,
            y: by,
            vx: (dx / dist) * 3.5,
            vy: (dy / dist) * 3.5,
            radius: 8,
            reflected: false,
            color: "#06b6d4"
          });
        }
      });

      // Update Plasma Bolts
      const shieldRadius = 65;
      for (let i = engine.bolts.length - 1; i >= 0; i--) {
        const bolt = engine.bolts[i];
        bolt.x += bolt.vx;
        bolt.y += bolt.vy;

        const distToCenter = Math.hypot(bolt.x - centerX, bolt.y - centerY);

        // Check Shield Arc Collision
        if (!bolt.reflected && Math.abs(distToCenter - shieldRadius) < 12) {
          let boltAngle = Math.atan2(bolt.y - centerY, bolt.x - centerX);
          if (boltAngle < 0) boltAngle += Math.PI * 2;

          let normalizedShield = engine.shieldAngle % (Math.PI * 2);
          if (normalizedShield < 0) normalizedShield += Math.PI * 2;

          const angleDiff = Math.abs(boltAngle - normalizedShield);
          if (angleDiff < engine.shieldArc / 2 || angleDiff > Math.PI * 2 - engine.shieldArc / 2) {
            // Reflected!
            audio.playShieldReflect();
            bolt.reflected = true;
            bolt.vx *= -1.5;
            bolt.vy *= -1.5;
            bolt.color = "#a855f7";
            engine.score += 150;
            setScore(engine.score);
          }
        }

        // Check Core Collision
        if (distToCenter < 25) {
          audio.playCoreHit();
          engine.coreHealth = Math.max(0, engine.coreHealth - 12);
          setCoreIntegrity(engine.coreHealth);

          if (engine.coreHealth <= 0) {
            setWinnerName("Orbital Aegis Core Destroyed");
            dispatchScore(engine.score);
            setGameState("game_over");
          }

          engine.bolts.splice(i, 1);
          continue;
        }

        // Check Reflected Bolt Hitting Battery
        if (bolt.reflected) {
          engine.batteries.forEach(bat => {
            if (bat.hp > 0) {
              const bx = centerX + Math.cos(bat.angle) * bat.distance;
              const by = centerY + Math.sin(bat.angle) * bat.distance;
              if (Math.hypot(bolt.x - bx, bolt.y - by) < 28) {
                audio.playBatteryDestroy();
                bat.hp--;
                bolt.vx = 0; bolt.vy = 0;
                engine.score += 300;
                setScore(engine.score);
              }
            }
          });
        }
      }

      // Check Victory Condition
      const remainingBatteries = engine.batteries.filter(b => b.hp > 0).length;
      setBatteriesDestroyed(6 - remainingBatteries);

      if (remainingBatteries === 0) {
        setWinnerName("All Hostile Batteries Neutralized");
        dispatchScore(engine.score + engine.coreHealth * 20);
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
      const centerX = w / 2;
      const centerY = h / 2;
      const engine = engineRef.current;

      ctx.fillStyle = "#030712";
      ctx.fillRect(0, 0, w, h);

      // Draw Aegis Orbit Circle
      ctx.strokeStyle = "rgba(6, 182, 212, 0.12)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(centerX, centerY, 65, 0, Math.PI * 2);
      ctx.stroke();

      // Draw Battery Nodes
      engine.batteries.forEach(bat => {
        if (bat.hp > 0) {
          const bx = centerX + Math.cos(bat.angle) * bat.distance;
          const by = centerY + Math.sin(bat.angle) * bat.distance;

          ctx.save();
          ctx.shadowBlur = 18;
          ctx.shadowColor = bat.color;
          ctx.fillStyle = bat.color;
          ctx.beginPath();
          ctx.arc(bx, by, 18, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }
      });

      // Draw Plasma Bolts
      engine.bolts.forEach(bolt => {
        ctx.save();
        ctx.shadowBlur = 16;
        ctx.shadowColor = bolt.color;
        ctx.fillStyle = bolt.color;
        ctx.beginPath();
        ctx.arc(bolt.x, bolt.y, bolt.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });

      // Draw 360 Aegis Rotating Shield Arc
      ctx.save();
      ctx.shadowBlur = 25;
      ctx.shadowColor = "#06b6d4";
      ctx.strokeStyle = "#06b6d4";
      ctx.lineWidth = 8;
      ctx.beginPath();
      ctx.arc(
        centerX,
        centerY,
        65,
        engine.shieldAngle - engine.shieldArc / 2,
        engine.shieldAngle + engine.shieldArc / 2
      );
      ctx.stroke();
      ctx.restore();

      // Draw Central Core
      ctx.save();
      ctx.shadowBlur = 20;
      ctx.shadowColor = "#a855f7";
      ctx.fillStyle = "#a855f7";
      ctx.beginPath();
      ctx.arc(centerX, centerY, 22, 0, Math.PI * 2);
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
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const keys = engineRef.current.keys;
      if (e.key === "a" || e.key === "A" || e.key === "ArrowLeft") keys.left = false;
      if (e.key === "d" || e.key === "D" || e.key === "ArrowRight") keys.right = false;
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

  const startGame = (selectedMode: AegisMode) => {
    setMode(selectedMode);
    initAegis();
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
          <ArrowLeft className="w-4 h-4" /> Exit Aegis
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
                <div className="text-[10px] font-black uppercase text-white/40 tracking-wider">CORE INTEGRITY</div>
                <div className="text-lg font-black text-cyan-400">{Math.ceil(coreIntegrity)}%</div>
              </div>

              <div className="text-center">
                <div className="text-[10px] font-black uppercase text-white/40 tracking-wider">BATTERIES DESTROYED</div>
                <div className="text-xl font-black text-purple-400">{batteriesDestroyed} / 6</div>
              </div>

              <div className="text-center">
                <div className="text-[10px] font-black uppercase text-white/40 tracking-wider">AEGIS SCORE</div>
                <div className="text-xl font-black text-emerald-400">{score}</div>
              </div>
            </div>
          </div>

          {/* MOBILE TOUCH CONTROLS OVERLAY */}
          <div className="absolute bottom-6 inset-x-6 flex justify-between items-center z-30 md:hidden pointer-events-auto">
            <button
              onTouchStart={triggerMobileLeftStart}
              onTouchEnd={triggerMobileLeftEnd}
              onMouseDown={triggerMobileLeftStart}
              onMouseUp={triggerMobileLeftEnd}
              className="w-20 h-20 rounded-2xl bg-cyan-600/40 border border-cyan-400/60 active:scale-95 flex items-center justify-center font-black text-2xl"
            >
              ↺ ROTATE
            </button>

            <button
              onTouchStart={triggerMobileRightStart}
              onTouchEnd={triggerMobileRightEnd}
              onMouseDown={triggerMobileRightStart}
              onMouseUp={triggerMobileRightEnd}
              className="w-20 h-20 rounded-2xl bg-cyan-600/40 border border-cyan-400/60 active:scale-95 flex items-center justify-center font-black text-2xl"
            >
              ↻ ROTATE
            </button>
          </div>
        </>
      )}

      {gameState === "menu" && (
        <div className="absolute inset-0 z-40 bg-[#030712]/95 backdrop-blur-xl flex flex-col items-center justify-center p-6">
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center max-w-xl mb-8">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs font-bold uppercase tracking-widest mb-3">
              <ShieldCheck className="w-3.5 h-3.5" /> 360-Degree Orbital Shielding
            </div>
            <h1 className="text-6xl font-black uppercase tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-500">
              AEGIS
            </h1>
            <p className="text-sm text-white/60 mt-3">
              Rotate a 360-degree orbital aegis barrier to deflect incoming plasma bolts back at hostile battery stations.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-lg w-full">
            <button
              onClick={() => startGame("aegis_deflector")}
              className="p-5 rounded-2xl bg-[#0b0f19] border border-cyan-500/40 hover:border-cyan-400 flex flex-col items-center gap-2 hover:scale-105 transition-all text-center"
            >
              <User className="w-8 h-8 text-cyan-400" />
              <div className="font-black text-lg">AEGIS DEFLECTOR</div>
              <div className="text-xs text-white/50">Single player shield challenge</div>
            </button>

            <button
              onClick={() => startGame("dual_aegis_arena")}
              className="p-5 rounded-2xl bg-[#0b0f19] border border-purple-500/40 hover:border-purple-400 flex flex-col items-center gap-2 hover:scale-105 transition-all text-center"
            >
              <Users className="w-8 h-8 text-purple-400" />
              <div className="font-black text-lg">DUAL ARENA</div>
              <div className="text-xs text-white/50">2-Player shield deflection duel</div>
            </button>
          </div>
        </div>
      )}

      {gameState === "game_over" && (
        <div className="absolute inset-0 z-50 bg-black/85 backdrop-blur-md flex flex-col items-center justify-center p-6">
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center max-w-md w-full">
            <h2 className="text-4xl font-black uppercase text-cyan-400 mb-2">
              {winnerName ? `${winnerName}!` : "Core Destroyed"}
            </h2>
            <p className="text-xs text-white/50 mb-6">Orbital Shield Defense Protocol Concluded</p>

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
