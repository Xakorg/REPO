"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Activity,
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
  Radio,
  Music,
  RadioTower,
  Smartphone
} from "lucide-react";
import Link from "next/link";
import { useUser, useFirestore, setDocumentNonBlocking } from "@/firebase";
import { doc, increment } from "firebase/firestore";

// ==========================================
// PULSE GAME TYPES
// ==========================================

export type PulseMode = "rhythm_conduit" | "pulse_battle";

export interface BeatPulseNode {
  id: string;
  lane: number;
  y: number;
  speed: number;
  radius: number;
  hit: boolean;
  color: string;
}

export interface PulseWave {
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  color: string;
  alpha: number;
}

// ==========================================
// WEB AUDIO SYNTHESIZER
// ==========================================

class PulseAudioSynth {
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

  playBeatPulse() {
    if (this.muted || !this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(440, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(880, this.ctx.currentTime + 0.1);

      gain.gain.setValueAtTime(0.25, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.1);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.1);
    } catch (e) {}
  }

  playPerfectSync() {
    if (this.muted || !this.ctx) return;
    try {
      [523.25, 659.25, 783.99, 1046.5].forEach((freq, i) => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();
        osc.type = "triangle";
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

  playMissSound() {
    if (this.muted || !this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(150, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(60, this.ctx.currentTime + 0.2);

      gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.2);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.2);
    } catch (e) {}
  }
}

const audio = new PulseAudioSynth();

// ==========================================
// PULSE GAME COMPONENT
// ==========================================

export default function PulseGame() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const { user } = useUser();
  const firestore = useFirestore();

  const [gameState, setGameState] = useState<"menu" | "playing" | "paused" | "game_over">("menu");
  const [mode, setMode] = useState<PulseMode>("rhythm_conduit");
  const [soundEnabled, setSoundEnabled] = useState(true);

  // HUD Metrics
  const [synchroMultiplier, setSynchroMultiplier] = useState(1);
  const [energyIntegrity, setEnergyIntegrity] = useState(100);
  const [score, setScore] = useState(0);
  const [winnerName, setWinnerName] = useState<string | null>(null);

  const engineRef = useRef({
    keys: {
      left: false, right: false, pulse: false,
      p2Left: false, p2Right: false, p2Pulse: false
    },
    p1Lane: 1, // Lanes 0, 1, 2
    p2Lane: 1,
    nodes: [] as BeatPulseNode[],
    waves: [] as PulseWave[],
    combo: 0,
    health: 100,
    score: 0,
    frameCount: 0,
    bpmTimer: 0
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
            displayName: user.displayName || "Pulse Master",
            points: increment(points),
            updatedAt: new Date().toISOString()
          },
          { merge: true }
        );
      }
    }
  };

  const initPulse = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.width = canvas.parentElement?.clientWidth || window.innerWidth;
    canvas.height = canvas.parentElement?.clientHeight || window.innerHeight;

    const engine = engineRef.current;
    engine.p1Lane = 1;
    engine.p2Lane = 1;
    engine.nodes = [];
    engine.waves = [];
    engine.combo = 0;
    engine.health = 100;
    engine.score = 0;
    engine.frameCount = 0;
    engine.bpmTimer = 0;

    setSynchroMultiplier(1);
    setEnergyIntegrity(100);
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
      const h = canvas.height;
      const engine = engineRef.current;

      engine.frameCount++;
      engine.bpmTimer++;

      // Spawn Rhythm Pulse Nodes on Beat (Every 45 frames)
      if (engine.bpmTimer % 45 === 0) {
        const lane = Math.floor(Math.random() * 3);
        const colors = ["#a855f7", "#ec4899", "#3b82f6"];
        engine.nodes.push({
          id: `node_${Date.now()}_${Math.random()}`,
          lane,
          y: -20,
          speed: 4.5,
          radius: 16,
          hit: false,
          color: colors[lane]
        });
      }

      // Update Nodes Physics
      for (let i = engine.nodes.length - 1; i >= 0; i--) {
        const node = engine.nodes[i];
        node.y += node.speed;

        // Check Hit in Target Zone (y near bottom)
        const targetY = h - 90;
        if (!node.hit && Math.abs(node.y - targetY) < 30 && engine.keys.pulse && engine.p1Lane === node.lane) {
          node.hit = true;
          engine.keys.pulse = false;
          audio.playPerfectSync();
          engine.combo++;
          const mult = Math.min(8, 1 + Math.floor(engine.combo / 5));
          engine.score += 100 * mult;
          setSynchroMultiplier(mult);
          setScore(engine.score);

          // Add Pulse Wave
          const laneX = getLaneX(node.lane, canvas.width);
          engine.waves.push({ x: laneX, y: targetY, radius: 10, maxRadius: 80, color: node.color, alpha: 1.0 });

          engine.nodes.splice(i, 1);
          continue;
        }

        // Missed Node
        if (node.y > h - 40 && !node.hit) {
          audio.playMissSound();
          engine.combo = 0;
          engine.health = Math.max(0, engine.health - 10);
          setEnergyIntegrity(engine.health);
          setSynchroMultiplier(1);

          if (engine.health <= 0) {
            setWinnerName("Rhythm Conduit Overload");
            dispatchScore(engine.score);
            setGameState("game_over");
          }

          engine.nodes.splice(i, 1);
        }
      }

      // Update Pulse Waves
      for (let i = engine.waves.length - 1; i >= 0; i--) {
        const wave = engine.waves[i];
        wave.radius += 5;
        wave.alpha = 1.0 - wave.radius / wave.maxRadius;
        if (wave.radius >= wave.maxRadius) {
          engine.waves.splice(i, 1);
        }
      }
    };

    const getLaneX = (lane: number, width: number) => {
      const spacing = width / 4;
      return spacing * (lane + 1);
    };

    const renderCanvas = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      const w = canvas.width;
      const h = canvas.height;
      const engine = engineRef.current;

      ctx.fillStyle = "#090514";
      ctx.fillRect(0, 0, w, h);

      // Draw Electro Corridor Lanes
      const colors = ["#a855f7", "#ec4899", "#3b82f6"];
      for (let i = 0; i < 3; i++) {
        const lx = (w / 4) * (i + 1);
        ctx.strokeStyle = `rgba(168, 85, 247, 0.15)`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(lx, 0);
        ctx.lineTo(lx, h);
        ctx.stroke();
      }

      // Draw Rhythm Target Zone Line
      const targetY = h - 90;
      ctx.strokeStyle = "rgba(236, 72, 153, 0.4)";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(0, targetY);
      ctx.lineTo(w, targetY);
      ctx.stroke();

      // Draw Pulse Waves
      engine.waves.forEach(wave => {
        ctx.save();
        ctx.strokeStyle = `rgba(168, 85, 247, ${wave.alpha})`;
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(wave.x, wave.y, wave.radius, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      });

      // Draw Falling Pulse Nodes
      engine.nodes.forEach(node => {
        const lx = (w / 4) * (node.lane + 1);
        ctx.save();
        ctx.shadowBlur = 20;
        ctx.shadowColor = node.color;
        ctx.fillStyle = node.color;
        ctx.beginPath();
        ctx.arc(lx, node.y, node.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });

      // Draw Player Rhythm Paddle
      const p1X = (w / 4) * (engine.p1Lane + 1);
      ctx.save();
      ctx.shadowBlur = 25;
      ctx.shadowColor = colors[engine.p1Lane];
      ctx.fillStyle = colors[engine.p1Lane];
      ctx.beginPath();
      ctx.roundRect(p1X - 35, targetY - 12, 70, 24, 12);
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
      const engine = engineRef.current;

      if (e.key === "a" || e.key === "A" || e.key === "ArrowLeft") {
        engine.p1Lane = Math.max(0, engine.p1Lane - 1);
      }
      if (e.key === "d" || e.key === "D" || e.key === "ArrowRight") {
        engine.p1Lane = Math.min(2, engine.p1Lane + 1);
      }
      if (e.key === " " || e.key === "Enter") {
        keys.pulse = true;
        audio.playBeatPulse();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const triggerMobileLeft = () => {
    audio.init();
    engineRef.current.p1Lane = Math.max(0, engineRef.current.p1Lane - 1);
  };

  const triggerMobileRight = () => {
    audio.init();
    engineRef.current.p1Lane = Math.min(2, engineRef.current.p1Lane + 1);
  };

  const triggerMobilePulse = () => {
    audio.init();
    engineRef.current.keys.pulse = true;
    audio.playBeatPulse();
  };

  const startGame = (selectedMode: PulseMode) => {
    setMode(selectedMode);
    initPulse();
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
          <ArrowLeft className="w-4 h-4" /> Exit Pulse
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
                <div className="text-[10px] font-black uppercase text-white/40 tracking-wider">SYNCHRO MULTIPLIER</div>
                <div className="text-lg font-black text-purple-400">{synchroMultiplier}x</div>
              </div>

              <div className="text-center">
                <div className="text-[10px] font-black uppercase text-white/40 tracking-wider">ENERGY INTEGRITY</div>
                <div className="text-xl font-black text-emerald-400">{energyIntegrity}%</div>
              </div>

              <div className="text-center">
                <div className="text-[10px] font-black uppercase text-white/40 tracking-wider">BEAT SCORE</div>
                <div className="text-xl font-black text-pink-400">{score}</div>
              </div>
            </div>
          </div>

          {/* MOBILE TOUCH CONTROLS OVERLAY */}
          <div className="absolute bottom-6 inset-x-6 flex justify-between items-center z-30 md:hidden pointer-events-auto">
            <div className="flex gap-3">
              <button
                onTouchStart={triggerMobileLeft}
                onClick={triggerMobileLeft}
                className="w-16 h-16 rounded-2xl bg-purple-600/40 border border-purple-400/60 active:scale-95 flex items-center justify-center font-black text-2xl"
              >
                ◀
              </button>
              <button
                onTouchStart={triggerMobileRight}
                onClick={triggerMobileRight}
                className="w-16 h-16 rounded-2xl bg-purple-600/40 border border-purple-400/60 active:scale-95 flex items-center justify-center font-black text-2xl"
              >
                ▶
              </button>
            </div>

            <button
              onTouchStart={triggerMobilePulse}
              onClick={triggerMobilePulse}
              className="w-20 h-20 rounded-full bg-gradient-to-tr from-pink-500 to-purple-600 border border-pink-300 active:scale-90 flex items-center justify-center font-black text-xs uppercase tracking-wider"
            >
              PULSE
            </button>
          </div>
        </>
      )}

      {gameState === "menu" && (
        <div className="absolute inset-0 z-40 bg-[#090514]/95 backdrop-blur-xl flex flex-col items-center justify-center p-6">
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center max-w-xl mb-8">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/30 text-purple-400 text-xs font-bold uppercase tracking-widest mb-3">
              <Activity className="w-3.5 h-3.5" /> Rhythm Electro Corridor Defense
            </div>
            <h1 className="text-6xl font-black uppercase tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500">
              PULSE
            </h1>
            <p className="text-sm text-white/60 mt-3">
              Shift electro lanes and trigger timed pulse shockwaves on the beat to synchronize viral nodes before overload.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-lg w-full">
            <button
              onClick={() => startGame("rhythm_conduit")}
              className="p-5 rounded-2xl bg-[#0b0f19] border border-purple-500/40 hover:border-purple-400 flex flex-col items-center gap-2 hover:scale-105 transition-all text-center"
            >
              <User className="w-8 h-8 text-purple-400" />
              <div className="font-black text-lg">RHYTHM CONDUIT</div>
              <div className="text-xs text-white/50">Single player rhythm defense</div>
            </button>

            <button
              onClick={() => startGame("pulse_battle")}
              className="p-5 rounded-2xl bg-[#0b0f19] border border-pink-500/40 hover:border-pink-400 flex flex-col items-center gap-2 hover:scale-105 transition-all text-center"
            >
              <Users className="w-8 h-8 text-pink-400" />
              <div className="font-black text-lg">PULSE BATTLE</div>
              <div className="text-xs text-white/50">2-Player rhythm sync clash</div>
            </button>
          </div>
        </div>
      )}

      {gameState === "game_over" && (
        <div className="absolute inset-0 z-50 bg-black/85 backdrop-blur-md flex flex-col items-center justify-center p-6">
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center max-w-md w-full">
            <h2 className="text-4xl font-black uppercase text-purple-400 mb-2">
              {winnerName ? `${winnerName}!` : "Conduit Overload"}
            </h2>
            <p className="text-xs text-white/50 mb-6">Electro Rhythm Sync Ended</p>

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
