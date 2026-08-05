"use client";

import React, { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Trophy,
  Volume2,
  VolumeX,
  ArrowLeft,
  Sun,
  Zap,
  Users,
  User,
  ShoppingBag,
  Shield,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import { db } from "@/lib/firebase";
import { collection, addDoc, query, orderBy, limit, onSnapshot } from "firebase/firestore";

// --- AUDIO SYNTHESIZER ---
class PrismAudioSynth {
  ctx: AudioContext | null = null;
  muted: boolean = false;

  init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === "suspended") {
      this.ctx.resume();
    }
  }

  playReflectSound() {
    if (this.muted || !this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(523.25, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(1046.5, this.ctx.currentTime + 0.15);
    gain.gain.setValueAtTime(0.15, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.15);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.15);
  }

  playPrismOverload() {
    if (this.muted || !this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = "triangle";
    osc.frequency.setValueAtTime(880, this.ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(1760, this.ctx.currentTime + 0.25);
    gain.gain.setValueAtTime(0.18, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.25);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.25);
  }

  playDisruption() {
    if (this.muted || !this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(140, this.ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(35, this.ctx.currentTime + 0.3);
    gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.3);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.3);
  }
}

const audioSynth = new PrismAudioSynth();

export type PrismMode = "refraction_defense" | "prism_duel";

interface LeaderboardEntry {
  id: string;
  name: string;
  score: number;
}

interface LightBeam {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
}

interface RefractorNode {
  x: number;
  y: number;
  angle: number;
  radius: number;
}

interface FloatingText {
  id: number;
  text: string;
  x: number;
  y: number;
  color: string;
  alpha: number;
}

export default function PrismGame() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [gameState, setGameState] = useState<"menu" | "shop" | "playing" | "game_over">("menu");
  const [mode, setMode] = useState<PrismMode>("refraction_defense");
  const [scoreP1, setScoreP1] = useState(0);
  const [scoreP2, setScoreP2] = useState(0);
  const [crystals, setCrystals] = useState(0);
  const [comboStreak, setComboStreak] = useState(0);
  const [multiplier, setMultiplier] = useState(1);
  const [screenShake, setScreenShake] = useState(0);

  // Shop Upgrades
  const [upgrades, setUpgrades] = useState({
    prismFocus: 1,
    laserShield: 0,
    crystalBonus: 1,
  });

  const [muted, setMuted] = useState(false);
  const [, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [playerName, setPlayerName] = useState("");
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
    keys: { p1RotateLeft: false, p1RotateRight: false, p1Fire: false, p2RotateLeft: false, p2RotateRight: false, p2Fire: false },
    prismP1: { x: 400, y: 300, angle: 0, radius: 24, shield: 0 } as RefractorNode,
    prismP2: { x: 500, y: 300, angle: Math.PI, radius: 24, shield: 0 } as RefractorNode,
    beams: [] as LightBeam[],
    targets: [] as { x: number; y: number; radius: number; color: string; vx: number; vy: number }[],
    floatingTexts: [] as FloatingText[],
    particles: [] as { x: number; y: number; vx: number; vy: number; color: string; life: number }[],
  });

  useEffect(() => {
    try {
      const q = query(collection(db, "prism_leaderboard"), orderBy("score", "desc"), limit(5));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const entries: LeaderboardEntry[] = [];
        snapshot.forEach((doc) => {
          entries.push({ id: doc.id, ...doc.data() } as LeaderboardEntry);
        });
        setLeaderboard(entries);
      });
      return () => unsubscribe();
    } catch (e) {
      console.warn("Firestore leaderboard offline:", e);
    }
  }, []);

  const saveScore = async () => {
    if (!playerName.trim() || scoreP1 <= 0) return;
    try {
      await addDoc(collection(db, "prism_leaderboard"), {
        name: playerName.trim().substring(0, 12),
        score: scoreP1,
        createdAt: new Date(),
      });
    } catch (e) {
      console.warn("Score submission error:", e);
    }
  };

  const addFloatingText = (text: string, x: number, y: number, color: string = "#f43f5e") => {
    engineRef.current.floatingTexts.push({
      id: Math.random(),
      text,
      x,
      y,
      color,
      alpha: 1.0,
    });
  };

  const spawnParticles = (x: number, y: number, color: string, count: number = 14) => {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 1 + Math.random() * 6;
      engineRef.current.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color,
        life: 1.0,
      });
    }
  };

  const buyUpgrade = (type: keyof typeof upgrades, cost: number) => {
    if (crystals >= cost) {
      setCrystals(crystals - cost);
      setUpgrades((prev) => ({ ...prev, [type]: prev[type] + 1 }));
    }
  };

  const fireLightBeam = (prism: RefractorNode) => {
    audioSynth.playReflectSound();
    const speed = 8;
    engineRef.current.beams.push({
      x: prism.x,
      y: prism.y,
      vx: Math.cos(prism.angle) * speed,
      vy: Math.sin(prism.angle) * speed,
      color: "#f43f5e",
    });
  };

  const startGame = (selectedMode: PrismMode) => {
    audioSynth.init();
    setMode(selectedMode);
    setScoreP1(0);
    setScoreP2(0);
    setComboStreak(0);
    setMultiplier(1);
    setWinnerName(null);

    const initialTargets = [
      { x: 150, y: 150, radius: 18, color: "#f43f5e", vx: 1.5, vy: 1 },
      { x: 650, y: 450, radius: 18, color: "#38bdf8", vx: -1.5, vy: -1 },
      { x: 400, y: 100, radius: 18, color: "#34d399", vx: 2, vy: -1.5 },
    ];

    engineRef.current = {
      keys: { p1RotateLeft: false, p1RotateRight: false, p1Fire: false, p2RotateLeft: false, p2RotateRight: false, p2Fire: false },
      prismP1: { x: 400, y: 300, angle: 0, radius: 24, shield: upgrades.laserShield },
      prismP2: { x: 500, y: 300, angle: Math.PI, radius: 24, shield: 0 },
      beams: [],
      targets: initialTargets,
      floatingTexts: [],
      particles: [],
    };

    setGameState("playing");
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (gameState !== "playing") return;
      if (e.key === "a" || e.key === "A" || e.key === "ArrowLeft") engineRef.current.keys.p1RotateLeft = true;
      if (e.key === "d" || e.key === "D" || e.key === "ArrowRight") engineRef.current.keys.p1RotateRight = true;
      if (e.key === " " || e.key === "w" || e.key === "W" || e.key === "ArrowUp") fireLightBeam(engineRef.current.prismP1);
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === "a" || e.key === "A" || e.key === "ArrowLeft") engineRef.current.keys.p1RotateLeft = false;
      if (e.key === "d" || e.key === "D" || e.key === "ArrowRight") engineRef.current.keys.p1RotateRight = false;
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [gameState]);

  // --- GAME LOOP ---
  useEffect(() => {
    if (gameState !== "playing") return;
    let animId: number;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let p1ScoreAccum = 0;
    let localCombo = 0;
    let localMult = 1;

    const loop = () => {
      const state = engineRef.current;
      const pr1 = state.prismP1;
      const pr2 = state.prismP2;

      // Rotate Prism Node
      if (state.keys.p1RotateLeft) pr1.angle -= 0.07;
      if (state.keys.p1RotateRight) pr1.angle += 0.07;

      // Update Light Beams
      state.beams.forEach((beam) => {
        beam.x += beam.vx;
        beam.y += beam.vy;

        // Hit Light Targets
        state.targets.forEach((tgt) => {
          const dx = tgt.x - beam.x;
          const dy = tgt.y - beam.y;
          if (Math.sqrt(dx * dx + dy * dy) < tgt.radius + 6) {
            audioSynth.playPrismOverload();
            tgt.x = 80 + Math.random() * 640;
            tgt.y = 80 + Math.random() * 440;

            localCombo++;
            if (localCombo % 4 === 0 && localMult < 8) {
              localMult *= 2;
              setMultiplier(localMult);
              addFloatingText(`${localMult}X PRISM MULTIPLIER!`, tgt.x, tgt.y - 25, "#f43f5e");
            }

            p1ScoreAccum += 200 * localMult;
            setScoreP1(p1ScoreAccum);
            setComboStreak(localCombo);
            setCrystals((prev) => prev + 1);

            addFloatingText(`+${200 * localMult}`, tgt.x, tgt.y - 10, "#fbbf24");
            spawnParticles(tgt.x, tgt.y, tgt.color, 16);
          }
        });
      });

      // Remove Out-of-bounds Beams
      state.beams = state.beams.filter((b) => b.x > 0 && b.x < 800 && b.y > 0 && b.y < 600);

      // Move Targets
      state.targets.forEach((tgt) => {
        tgt.x += tgt.vx;
        tgt.y += tgt.vy;
        if (tgt.x < 40 || tgt.x > 760) tgt.vx *= -1;
        if (tgt.y < 40 || tgt.y > 560) tgt.vy *= -1;
      });

      // Update Floating Text & Particles
      state.floatingTexts.forEach((ft) => {
        ft.y -= 1.2;
        ft.alpha -= 0.02;
      });
      state.floatingTexts = state.floatingTexts.filter((ft) => ft.alpha > 0);

      state.particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        p.life -= 0.03;
      });
      state.particles = state.particles.filter((p) => p.life > 0);

      // --- RENDERING ---
      ctx.save();
      if (screenShake > 0) {
        ctx.translate((Math.random() - 0.5) * screenShake, (Math.random() - 0.5) * screenShake);
        setScreenShake((prev) => Math.max(0, prev - 1));
      }

      ctx.fillStyle = "#090214";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Render Light Beams
      state.beams.forEach((beam) => {
        ctx.beginPath();
        ctx.arc(beam.x, beam.y, 5, 0, Math.PI * 2);
        ctx.fillStyle = beam.color;
        ctx.shadowColor = beam.color;
        ctx.shadowBlur = 16;
        ctx.fill();
      });
      ctx.shadowBlur = 0;

      // Render Light Targets
      state.targets.forEach((tgt) => {
        ctx.beginPath();
        ctx.arc(tgt.x, tgt.y, tgt.radius, 0, Math.PI * 2);
        ctx.fillStyle = tgt.color;
        ctx.shadowColor = tgt.color;
        ctx.shadowBlur = 20;
        ctx.fill();
      });
      ctx.shadowBlur = 0;

      // Render Prism Node
      ctx.save();
      ctx.translate(pr1.x, pr1.y);
      ctx.rotate(pr1.angle);
      ctx.beginPath();
      ctx.moveTo(18, 0);
      ctx.lineTo(-12, -14);
      ctx.lineTo(-12, 14);
      ctx.closePath();
      ctx.fillStyle = "#f43f5e";
      ctx.shadowColor = "#f43f5e";
      ctx.shadowBlur = 22;
      ctx.fill();
      ctx.restore();
      ctx.shadowBlur = 0;

      // Render Floating Texts
      state.floatingTexts.forEach((ft) => {
        ctx.fillStyle = ft.color;
        ctx.globalAlpha = ft.alpha;
        ctx.font = "bold 14px monospace";
        ctx.fillText(ft.text, ft.x, ft.y);
      });
      ctx.globalAlpha = 1.0;

      ctx.restore();

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [gameState, mode, screenShake]);

  return (
    <div className="relative w-full h-screen bg-[#06010c] text-white flex flex-col items-center justify-center font-sans overflow-hidden select-none">
      {/* Navigation Header */}
      <div className="absolute top-4 left-4 right-4 z-30 flex items-center justify-between pointer-events-auto">
        <Link
          href="/games"
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-xs font-bold uppercase tracking-wider backdrop-blur-md transition-all"
        >
          <ArrowLeft className="w-4 h-4" /> GAMES
        </Link>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setGameState("shop")}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-300 text-xs font-bold uppercase tracking-wider backdrop-blur-md"
          >
            <ShoppingBag className="w-4 h-4" /> LAB ({crystals} CRYSTALS)
          </button>
          <button
            onClick={() => {
              audioSynth.muted = !muted;
              setMuted(!muted);
            }}
            className="p-2.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-white backdrop-blur-md"
          >
            {muted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-rose-400" />}
          </button>
        </div>
      </div>

      {/* Main Canvas Area */}
      <div className="relative w-full max-w-4xl aspect-[4/3] bg-[#120420] rounded-3xl border border-rose-500/30 overflow-hidden shadow-[0_0_60px_rgba(244,63,94,0.15)] flex flex-col justify-center items-center">
        <canvas ref={canvasRef} width={800} height={600} className="w-full h-full object-contain" />

        {/* Dynamic HUD */}
        {gameState === "playing" && (
          <div className="absolute top-6 inset-x-6 z-20 flex justify-between items-start pointer-events-none">
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-black/60 border border-rose-500/40 text-rose-300 font-mono text-xs backdrop-blur-md">
                <Sun className="w-3.5 h-3.5 text-rose-400" /> PRISM SCORE: {scoreP1}
              </div>
              {multiplier > 1 && (
                <div className="px-3 py-1 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-300 font-mono text-xs font-black animate-bounce">
                  {multiplier}X REFRACTION MULTIPLIER
                </div>
              )}
            </div>

            <div className="px-4 py-2 rounded-2xl bg-black/60 border border-rose-500/40 backdrop-blur-md text-right">
              <div className="text-[10px] font-mono text-rose-400/70 uppercase">REFRACTION COMBO</div>
              <div className="text-2xl font-black font-mono text-rose-300">{comboStreak} STREAK</div>
            </div>
          </div>
        )}

        {/* Touch Controls Overlay */}
        {gameState === "playing" && isMobileScreen && (
          <div className="absolute bottom-6 inset-x-6 flex justify-between items-center z-30 pointer-events-auto">
            <div className="flex gap-2">
              <button
                onTouchStart={() => (engineRef.current.keys.p1RotateLeft = true)}
                onTouchEnd={() => (engineRef.current.keys.p1RotateLeft = false)}
                className="w-14 h-14 rounded-2xl bg-white/10 border border-white/20 active:bg-rose-500/30 flex items-center justify-center font-bold text-lg"
              >
                ↺
              </button>
              <button
                onTouchStart={() => (engineRef.current.keys.p1RotateRight = true)}
                onTouchEnd={() => (engineRef.current.keys.p1RotateRight = false)}
                className="w-14 h-14 rounded-2xl bg-white/10 border border-white/20 active:bg-rose-500/30 flex items-center justify-center font-bold text-lg"
              >
                ↻
              </button>
            </div>
            <button
              onClick={() => fireLightBeam(engineRef.current.prismP1)}
              className="w-20 h-20 rounded-full bg-gradient-to-tr from-rose-500 to-pink-500 border border-rose-300 active:scale-95 flex items-center justify-center font-black text-xs uppercase text-black shadow-lg"
            >
              BEAM
            </button>
          </div>
        )}

        {/* Lab Shop Overlay */}
        <AnimatePresence>
          {gameState === "shop" && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="absolute inset-0 z-40 bg-black/90 backdrop-blur-2xl flex flex-col items-center justify-center p-6"
            >
              <h2 className="text-4xl font-black uppercase text-rose-300 mb-2">PRISM OPTIC LAB</h2>
              <p className="text-xs text-rose-100/60 mb-6">Persistent Refraction Upgrades (Crystals: {crystals})</p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-lg w-full mb-6">
                <div className="p-4 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Sun className="w-6 h-6 text-rose-400" />
                    <div>
                      <div className="font-bold text-sm">PRISM FOCUS</div>
                      <div className="text-[10px] text-white/50">Level {upgrades.prismFocus}</div>
                    </div>
                  </div>
                  <button
                    onClick={() => buyUpgrade("prismFocus", 4)}
                    className="px-3 py-1.5 rounded-xl bg-rose-500 text-black font-bold text-xs"
                  >
                    4 CRYSTALS
                  </button>
                </div>

                <div className="p-4 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Shield className="w-6 h-6 text-pink-400" />
                    <div>
                      <div className="font-bold text-sm">LASER SHIELD</div>
                      <div className="text-[10px] text-white/50">Charges: {upgrades.laserShield}</div>
                    </div>
                  </div>
                  <button
                    onClick={() => buyUpgrade("laserShield", 8)}
                    className="px-3 py-1.5 rounded-xl bg-rose-500 text-black font-bold text-xs"
                  >
                    8 CRYSTALS
                  </button>
                </div>
              </div>

              <button
                onClick={() => setGameState("menu")}
                className="px-8 py-3 rounded-2xl bg-white/10 hover:bg-white/20 font-bold uppercase text-xs tracking-wider"
              >
                RETURN TO MENU
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Menu Overlay */}
        {gameState === "menu" && (
          <div className="absolute inset-0 z-40 bg-[#0c0114]/90 backdrop-blur-2xl flex flex-col items-center justify-center p-6 overflow-y-auto">
            <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-rose-600/20 rounded-full blur-[120px] pointer-events-none animate-pulse" />

            <motion.div
              initial={{ scale: 0.88, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              className="text-center max-w-2xl mb-8 z-10"
            >
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-black uppercase tracking-widest mb-4 shadow-[0_0_20px_rgba(244,63,94,0.2)]">
                <Zap className="w-4 h-4 text-rose-400 animate-bounce" /> Light Refraction Color-Frequency Puzzle
              </div>

              <h1 className="text-7xl md:text-8xl font-black uppercase tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-rose-300 via-pink-300 to-amber-400 drop-shadow-[0_0_40px_rgba(244,63,94,0.6)]">
                PRISM
              </h1>
              <p className="text-base text-rose-100/70 mt-4 max-w-lg mx-auto leading-relaxed">
                Reflect light beams using precision crystal optics to hit matching frequency targets and unlock lab upgrades.
              </p>

              <div className="flex justify-center gap-3 mt-4">
                <span className="px-3 py-1 rounded-md bg-white/5 border border-white/10 text-[10px] font-mono text-rose-300">OPTIC LAB</span>
                <span className="px-3 py-1 rounded-md bg-white/5 border border-white/10 text-[10px] font-mono text-pink-300">REFRACTION COMBO</span>
                <span className="px-3 py-1 rounded-md bg-white/5 border border-white/10 text-[10px] font-mono text-amber-300">TOUCH READY</span>
              </div>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-xl w-full z-10">
              <button
                onClick={() => startGame("refraction_defense")}
                className="group relative p-6 rounded-3xl bg-white/5 border border-rose-500/30 hover:border-rose-400 hover:bg-rose-500/10 flex flex-col items-center gap-3 transition-all duration-300 text-center backdrop-blur-md shadow-lg hover:shadow-[0_0_30px_rgba(244,63,94,0.3)] active:scale-95"
              >
                <User className="w-8 h-8 text-rose-400 group-hover:scale-110 transition-transform" />
                <div>
                  <div className="font-black text-xl uppercase tracking-wider text-white">REFRACTION</div>
                  <div className="text-xs text-rose-200/60 mt-1">Single player optic alignment defense</div>
                </div>
              </button>

              <button
                onClick={() => startGame("prism_duel")}
                className="group relative p-6 rounded-3xl bg-white/5 border border-pink-500/30 hover:border-pink-400 hover:bg-pink-500/10 flex flex-col items-center gap-3 transition-all duration-300 text-center backdrop-blur-md shadow-lg hover:shadow-[0_0_30px_rgba(236,72,153,0.3)] active:scale-95"
              >
                <Users className="w-8 h-8 text-pink-400 group-hover:scale-110 transition-transform" />
                <div>
                  <div className="font-black text-xl uppercase tracking-wider text-white">PRISM DUEL</div>
                  <div className="text-xs text-pink-200/60 mt-1">2-Player competitive optic duel</div>
                </div>
              </button>
            </div>

            <div className="mt-8 z-10 flex flex-wrap items-center justify-center gap-6 text-xs text-white/50 bg-black/40 px-6 py-3 rounded-2xl border border-white/10">
              <div className="flex items-center gap-2">
                <span className="font-mono text-rose-300 bg-white/10 px-2 py-0.5 rounded border border-white/10 font-bold">A / D</span>
                <span>Rotate Prism</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-pink-300 bg-white/10 px-2 py-0.5 rounded border border-white/10 font-bold">SPACE</span>
                <span>Fire Light Beam</span>
              </div>
            </div>
          </div>
        )}

        {/* Game Over Screen */}
        {gameState === "game_over" && (
          <div className="absolute inset-0 z-50 bg-black/90 backdrop-blur-2xl flex flex-col items-center justify-center p-6">
            <motion.div
              initial={{ scale: 0.88, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="text-center max-w-md w-full bg-slate-900/90 border border-rose-500/40 p-8 rounded-3xl shadow-[0_0_50px_rgba(244,63,94,0.3)] relative overflow-hidden"
            >
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-bold uppercase tracking-wider mb-4">
                <Trophy className="w-3.5 h-3.5 text-rose-400" /> Prism Defense Finished
              </div>

              <h2 className="text-4xl font-black uppercase text-transparent bg-clip-text bg-gradient-to-r from-rose-300 to-pink-300 mb-2">
                BEAM DISRUPTED
              </h2>
              <p className="text-xs text-rose-200/60 mb-6">Prism Refraction Results</p>

              <div className="p-4 rounded-2xl bg-white/5 border border-white/10 mb-6">
                <div className="text-[10px] text-white/40 font-black uppercase">FINAL SCORE</div>
                <div className="text-3xl font-black text-rose-300">{scoreP1}</div>
              </div>

              <div className="mb-6 flex gap-2">
                <input
                  type="text"
                  placeholder="Enter Player Name"
                  value={playerName}
                  onChange={(e) => setPlayerName(e.target.value)}
                  className="flex-1 px-4 py-3 rounded-xl bg-black/60 border border-white/10 text-white text-xs focus:outline-none focus:border-rose-400"
                />
                <button
                  onClick={saveScore}
                  className="px-4 py-3 rounded-xl bg-rose-500 text-black font-bold text-xs uppercase"
                >
                  SAVE
                </button>
              </div>

              <div className="flex gap-4">
                <button
                  onClick={() => startGame(mode)}
                  className="flex-1 py-3.5 rounded-2xl bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-400 hover:to-pink-400 text-black font-black uppercase tracking-wider shadow-[0_0_20px_rgba(244,63,94,0.4)] active:scale-95 transition-all"
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
    </div>
  );
}
