"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sun,
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
  Palette,
  Circle,
  Smartphone
} from "lucide-react";
import Link from "next/link";
import { useUser, useFirestore, setDocumentNonBlocking } from "@/firebase";
import { doc, increment } from "firebase/firestore";

// ==========================================
// AURA GAME TYPES
// ==========================================

export type AuraMode = "aura_shift_challenge" | "prism_duel";
export type AuraColor = "cyan" | "magenta" | "yellow";

export interface ColorSurge {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  colorType: AuraColor;
  colorHex: string;
}

// ==========================================
// WEB AUDIO SYNTHESIZER
// ==========================================

class AuraAudioSynth {
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

  playPhaseShift() {
    if (this.muted || !this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(600, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1200, this.ctx.currentTime + 0.08);

      gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.08);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.08);
    } catch (e) {}
  }

  playHarmonicAbsorb() {
    if (this.muted || !this.ctx) return;
    try {
      [523.25, 659.25, 783.99, 1046.5].forEach((freq, i) => {
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

  playRepelHit() {
    if (this.muted || !this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(160, this.ctx.currentTime);
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

const audio = new AuraAudioSynth();

const COLOR_MAP: Record<AuraColor, string> = {
  cyan: "#06b6d4",
  magenta: "#ec4899",
  yellow: "#eab308"
};

// ==========================================
// AURA GAME COMPONENT
// ==========================================

export default function AuraGame() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const { user } = useUser();
  const firestore = useFirestore();

  const [gameState, setGameState] = useState<"menu" | "playing" | "paused" | "game_over">("menu");
  const [mode, setMode] = useState<AuraMode>("aura_shift_challenge");
  const [soundEnabled, setSoundEnabled] = useState(true);

  // HUD Metrics
  const [auraIntegrity, setAuraIntegrity] = useState(100);
  const [currentAura, setCurrentAura] = useState<AuraColor>("cyan");
  const [score, setScore] = useState(0);
  const [winnerName, setWinnerName] = useState<string | null>(null);

  const engineRef = useRef({
    keys: { left: false, right: false, up: false, down: false },
    player: { x: 300, y: 300, radius: 24, aura: "cyan" as AuraColor, health: 100 },
    surges: [] as ColorSurge[],
    score: 0,
    frameCount: 0
  });

  const toggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    audio.muted = !next;
  };

  const setAuraColor = (color: AuraColor) => {
    audio.init();
    audio.playPhaseShift();
    engineRef.current.player.aura = color;
    setCurrentAura(color);
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
            displayName: user.displayName || "Aura Master",
            points: increment(points),
            updatedAt: new Date().toISOString()
          },
          { merge: true }
        );
      }
    }
  };

  const initAura = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const w = (canvas.width = canvas.parentElement?.clientWidth || window.innerWidth);
    const h = (canvas.height = canvas.parentElement?.clientHeight || window.innerHeight);

    const engine = engineRef.current;
    engine.player = { x: w / 2, y: h / 2, radius: 24, aura: "cyan", health: 100 };
    engine.surges = [];
    engine.score = 0;
    engine.frameCount = 0;

    setAuraIntegrity(100);
    setCurrentAura("cyan");
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
      const speed = 4.5;
      if (keys.left) p.x = Math.max(p.radius, p.x - speed);
      if (keys.right) p.x = Math.min(w - p.radius, p.x + speed);
      if (keys.up) p.y = Math.max(p.radius, p.y - speed);
      if (keys.down) p.y = Math.min(h - p.radius, p.y + speed);

      engine.frameCount++;

      // Spawn Color Surges
      if (engine.frameCount % 50 === 0) {
        const types: AuraColor[] = ["cyan", "magenta", "yellow"];
        const chosen = types[Math.floor(Math.random() * 3)];
        const side = Math.floor(Math.random() * 4);
        let sx = 0, sy = 0;

        if (side === 0) { sx = Math.random() * w; sy = -20; }
        else if (side === 1) { sx = w + 20; sy = Math.random() * h; }
        else if (side === 2) { sx = Math.random() * w; sy = h + 20; }
        else { sx = -20; sy = Math.random() * h; }

        const dx = p.x - sx;
        const dy = p.y - sy;
        const dist = Math.hypot(dx, dy);

        engine.surges.push({
          id: `surge_${Date.now()}_${Math.random()}`,
          x: sx,
          y: sy,
          vx: (dx / dist) * 3.2,
          vy: (dy / dist) * 3.2,
          radius: 14,
          colorType: chosen,
          colorHex: COLOR_MAP[chosen]
        });
      }

      // Update Color Surges
      for (let i = engine.surges.length - 1; i >= 0; i--) {
        const surge = engine.surges[i];
        surge.x += surge.vx;
        surge.y += surge.vy;

        const distToPlayer = Math.hypot(surge.x - p.x, surge.y - p.y);
        if (distToPlayer < p.radius + surge.radius) {
          if (surge.colorType === p.aura) {
            // Harmonic Absorption!
            audio.playHarmonicAbsorb();
            engine.score += 200;
            setScore(engine.score);
          } else {
            // Mismatch Collision Damage!
            audio.playRepelHit();
            p.health = Math.max(0, p.health - 15);
            setAuraIntegrity(p.health);

            if (p.health <= 0) {
              setWinnerName("Prism Aura Overload");
              dispatchScore(engine.score);
              setGameState("game_over");
            }
          }
          engine.surges.splice(i, 1);
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

      ctx.fillStyle = "#09090b";
      ctx.fillRect(0, 0, w, h);

      // Draw Color Surges
      engine.surges.forEach(surge => {
        ctx.save();
        ctx.shadowBlur = 18;
        ctx.shadowColor = surge.colorHex;
        ctx.fillStyle = surge.colorHex;
        ctx.beginPath();
        ctx.arc(surge.x, surge.y, surge.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });

      // Draw Player Aura Sphere
      ctx.save();
      ctx.shadowBlur = 30;
      ctx.shadowColor = COLOR_MAP[p.aura];
      ctx.fillStyle = COLOR_MAP[p.aura];
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fill();

      // Outer Aura Ring
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

      if (e.key === "1") setAuraColor("cyan");
      if (e.key === "2") setAuraColor("magenta");
      if (e.key === "3") setAuraColor("yellow");
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

  const startGame = (selectedMode: AuraMode) => {
    setMode(selectedMode);
    initAura();
    setGameState("playing");
  };

  return (
    <div className="w-full h-screen bg-[#09090b] text-white relative overflow-hidden font-sans select-none">
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full block" />

      <div className="absolute top-0 inset-x-0 p-4 flex justify-between items-center z-30 pointer-events-none">
        <Link
          href="/games"
          className="pointer-events-auto flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold"
        >
          <ArrowLeft className="w-4 h-4" /> Exit Aura
        </Link>
        <button
          onClick={toggleSound}
          className="pointer-events-auto p-2 rounded-xl bg-white/5 border border-white/10"
        >
          {soundEnabled ? <Volume2 className="w-4 h-4 text-pink-400" /> : <VolumeX className="w-4 h-4 text-rose-400" />}
        </button>
      </div>

      {gameState === "playing" && (
        <>
          <div className="absolute top-4 inset-x-0 flex justify-center pointer-events-none z-20">
            <div className="bg-[#0b0f19]/90 border border-pink-500/30 px-8 py-3 rounded-2xl backdrop-blur-md flex items-center gap-8 pointer-events-auto">
              <div className="text-center">
                <div className="text-[10px] font-black uppercase text-white/40 tracking-wider">AURA INTEGRITY</div>
                <div className="text-lg font-black text-emerald-400">{auraIntegrity}%</div>
              </div>

              <div className="text-center">
                <div className="text-[10px] font-black uppercase text-white/40 tracking-wider">CURRENT AURA</div>
                <div className="text-xl font-black uppercase" style={{ color: COLOR_MAP[currentAura] }}>
                  {currentAura}
                </div>
              </div>

              <div className="text-center">
                <div className="text-[10px] font-black uppercase text-white/40 tracking-wider">PRISM SCORE</div>
                <div className="text-xl font-black text-cyan-400">{score}</div>
              </div>
            </div>
          </div>

          {/* MOBILE TOUCH PHASE SHIFT BUTTONS & D-PAD */}
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

            <div className="flex gap-2">
              <button
                onTouchStart={() => setAuraColor("cyan")}
                className="w-14 h-14 rounded-full bg-cyan-500 border border-cyan-300 active:scale-90 font-black text-[10px] uppercase text-black"
              >
                CYAN
              </button>
              <button
                onTouchStart={() => setAuraColor("magenta")}
                className="w-14 h-14 rounded-full bg-pink-500 border border-pink-300 active:scale-90 font-black text-[10px] uppercase text-black"
              >
                MAG
              </button>
              <button
                onTouchStart={() => setAuraColor("yellow")}
                className="w-14 h-14 rounded-full bg-amber-400 border border-amber-200 active:scale-90 font-black text-[10px] uppercase text-black"
              >
                YEL
              </button>
            </div>
          </div>
        </>
      )}

      {gameState === "menu" && (
        <div className="absolute inset-0 z-40 bg-[#14061a]/90 backdrop-blur-2xl flex flex-col items-center justify-center p-6 overflow-y-auto">
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-pink-600/20 rounded-full blur-[120px] pointer-events-none animate-pulse" />

          <motion.div
            initial={{ scale: 0.88, opacity: 0, y: 10 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            className="text-center max-w-2xl mb-8 z-10"
          >
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-pink-500/10 border border-pink-500/30 text-pink-300 text-xs font-black uppercase tracking-widest mb-4 shadow-[0_0_20px_rgba(236,72,153,0.2)]">
              <Palette className="w-4 h-4 text-pink-400 animate-spin" style={{ animationDuration: "10s" }} /> Harmonic Color Phase Protocol
            </div>

            <h1 className="text-7xl md:text-8xl font-black uppercase tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-pink-400 via-amber-300 to-cyan-400 drop-shadow-[0_0_40px_rgba(236,72,153,0.6)]">
              AURA
            </h1>
            <p className="text-base text-pink-100/70 mt-4 max-w-lg mx-auto leading-relaxed">
              Shift your elemental aura color state between Cyan, Magenta, and Yellow to absorb matching energy surges and avoid damage.
            </p>

            <div className="flex justify-center gap-3 mt-4">
              <span className="px-3 py-1 rounded-md bg-white/5 border border-white/10 text-[10px] font-mono text-pink-300">1P / 2P MODES</span>
              <span className="px-3 py-1 rounded-md bg-white/5 border border-white/10 text-[10px] font-mono text-cyan-300">ONLINE LEADERBOARD</span>
              <span className="px-3 py-1 rounded-md bg-white/5 border border-white/10 text-[10px] font-mono text-amber-300">TOUCH READY</span>
            </div>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-xl w-full z-10">
            <button
              onClick={() => startGame("aura_shift_challenge")}
              className="group relative p-6 rounded-3xl bg-white/5 border border-pink-500/30 hover:border-pink-400 hover:bg-pink-500/10 flex flex-col items-center gap-3 transition-all duration-300 text-center backdrop-blur-md shadow-lg hover:shadow-[0_0_30px_rgba(236,72,153,0.3)] active:scale-95"
            >
              <User className="w-8 h-8 text-pink-400 group-hover:scale-110 transition-transform" />
              <div>
                <div className="font-black text-xl uppercase tracking-wider text-white">AURA SHIFT</div>
                <div className="text-xs text-pink-200/60 mt-1">Single player color phase absorption</div>
              </div>
            </button>

            <button
              onClick={() => startGame("prism_duel")}
              className="group relative p-6 rounded-3xl bg-white/5 border border-cyan-500/30 hover:border-cyan-400 hover:bg-cyan-500/10 flex flex-col items-center gap-3 transition-all duration-300 text-center backdrop-blur-md shadow-lg hover:shadow-[0_0_30px_rgba(6,182,212,0.3)] active:scale-95"
            >
              <Users className="w-8 h-8 text-cyan-400 group-hover:scale-110 transition-transform" />
              <div>
                <div className="font-black text-xl uppercase tracking-wider text-white">PRISM DUEL</div>
                <div className="text-xs text-cyan-200/60 mt-1">2-Player elemental aura clash</div>
              </div>
            </button>
          </div>

          <div className="mt-8 z-10 flex flex-wrap items-center justify-center gap-6 text-xs text-white/50 bg-black/40 px-6 py-3 rounded-2xl border border-white/10">
            <div className="flex items-center gap-2">
              <span className="font-mono text-pink-300 bg-white/10 px-2 py-0.5 rounded border border-white/10 font-bold">1 / 2 / 3</span>
              <span>Switch Aura Colors</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-cyan-300 bg-white/10 px-2 py-0.5 rounded border border-white/10 font-bold">WASD / ARROWS</span>
              <span>Move & Dodge</span>
            </div>
          </div>
        </div>
      )}

      {gameState === "game_over" && (
        <div className="absolute inset-0 z-50 bg-black/85 backdrop-blur-md flex flex-col items-center justify-center p-6">
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center max-w-md w-full">
            <h2 className="text-4xl font-black uppercase text-pink-400 mb-2">
              {winnerName ? `${winnerName}!` : "Aura Overload"}
            </h2>
            <p className="text-xs text-white/50 mb-6">Harmonic Color Phase Trial Concluded</p>

            <div className="flex gap-4">
              <button
                onClick={() => startGame(mode)}
                className="flex-1 py-3.5 rounded-xl bg-pink-500 text-black font-black uppercase"
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
