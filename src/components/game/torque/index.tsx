"use client";

import React, { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Trophy,
  Volume2,
  VolumeX,
  ArrowLeft,
  Flame,
  Zap,
  Users,
  User,
  ShoppingBag,
  Shield,
  Gauge,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import { db } from "@/lib/firebase";
import { collection, addDoc, query, orderBy, limit, onSnapshot } from "firebase/firestore";

// --- AUDIO SYNTHESIZER ---
class TorqueAudioSynth {
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

  playDriftSound() {
    if (this.muted || !this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(180, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(450, this.ctx.currentTime + 0.12);
    gain.gain.setValueAtTime(0.1, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.12);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.12);
  }

  playNitroBoost() {
    if (this.muted || !this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(400, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(1400, this.ctx.currentTime + 0.25);
    gain.gain.setValueAtTime(0.18, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.25);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.25);
  }

  playCoinCollect() {
    if (this.muted || !this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = "triangle";
    osc.frequency.setValueAtTime(587.33, this.ctx.currentTime);
    osc.frequency.setValueAtTime(880, this.ctx.currentTime + 0.08);
    gain.gain.setValueAtTime(0.15, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.2);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.2);
  }

  playCrash() {
    if (this.muted || !this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(120, this.ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(30, this.ctx.currentTime + 0.35);
    gain.gain.setValueAtTime(0.25, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.35);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.35);
  }
}

const audioSynth = new TorqueAudioSynth();

export type TorqueMode = "kinetic_drift" | "torque_duel";

interface LeaderboardEntry {
  id: string;
  name: string;
  score: number;
}

interface FloatingText {
  id: number;
  text: string;
  x: number;
  y: number;
  color: string;
  alpha: number;
}

interface PowerUpDrop {
  id: number;
  x: number;
  y: number;
  type: "nitro" | "shield" | "multiplier";
  radius: number;
}

export default function TorqueGame() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [gameState, setGameState] = useState<"menu" | "shop" | "playing" | "game_over">("menu");
  const [mode, setMode] = useState<TorqueMode>("kinetic_drift");
  const [scoreP1, setScoreP1] = useState(0);
  const [scoreP2, setScoreP2] = useState(0);
  const [coins, setCoins] = useState(0);
  const [comboStreak, setComboStreak] = useState(0);
  const [multiplier, setMultiplier] = useState(1);
  const [overdriveActive, setOverdriveActive] = useState(false);
  const [screenShake, setScreenShake] = useState(0);

  // Shop Upgrades
  const [upgrades, setUpgrades] = useState({
    topSpeed: 1,
    driftHandling: 1,
    shieldCharges: 0,
    coinMagnet: 1,
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
    keys: { p1Up: false, p1Down: false, p1Left: false, p1Right: false, p1Nitro: false, p2Up: false, p2Down: false, p2Left: false, p2Right: false },
    carP1: { x: 400, y: 300, vx: 0, vy: 0, angle: 0, speed: 0, shield: 0 },
    carP2: { x: 500, y: 300, vx: 0, vy: 0, angle: Math.PI, speed: 0, shield: 0 },
    obstacles: [] as { x: number; y: number; radius: number; vx: number; vy: number }[],
    coins: [] as { x: number; y: number; radius: number }[],
    powerups: [] as PowerUpDrop[],
    floatingTexts: [] as FloatingText[],
    particles: [] as { x: number; y: number; vx: number; vy: number; color: string; life: number }[],
  });

  useEffect(() => {
    try {
      const q = query(collection(db, "torque_leaderboard"), orderBy("score", "desc"), limit(5));
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
      await addDoc(collection(db, "torque_leaderboard"), {
        name: playerName.trim().substring(0, 12),
        score: scoreP1,
        createdAt: new Date(),
      });
    } catch (e) {
      console.warn("Score submission error:", e);
    }
  };

  const addFloatingText = (text: string, x: number, y: number, color: string = "#fbbf24") => {
    engineRef.current.floatingTexts.push({
      id: Math.random(),
      text,
      x,
      y,
      color,
      alpha: 1.0,
    });
  };

  const spawnParticles = (x: number, y: number, color: string, count: number = 12) => {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 1 + Math.random() * 5;
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
    if (coins >= cost) {
      setCoins(coins - cost);
      setUpgrades((prev) => ({ ...prev, [type]: prev[type] + 1 }));
    }
  };

  const startGame = (selectedMode: TorqueMode) => {
    audioSynth.init();
    setMode(selectedMode);
    setScoreP1(0);
    setScoreP2(0);
    setComboStreak(0);
    setMultiplier(1);
    setOverdriveActive(false);
    setWinnerName(null);

    const initialObstacles = [
      { x: 200, y: 150, radius: 24, vx: 2, vy: 1 },
      { x: 600, y: 450, radius: 28, vx: -1.5, vy: -2 },
      { x: 350, y: 400, radius: 22, vx: 2.5, vy: -1 },
    ];

    const initialCoins = [
      { x: 300, y: 200, radius: 10 },
      { x: 500, y: 350, radius: 10 },
      { x: 400, y: 180, radius: 10 },
    ];

    engineRef.current = {
      keys: { p1Up: false, p1Down: false, p1Left: false, p1Right: false, p1Nitro: false, p2Up: false, p2Down: false, p2Left: false, p2Right: false },
      carP1: { x: 400, y: 300, vx: 0, vy: 0, angle: 0, speed: 0, shield: upgrades.shieldCharges },
      carP2: { x: 500, y: 300, vx: 0, vy: 0, angle: Math.PI, speed: 0, shield: 0 },
      obstacles: initialObstacles,
      coins: initialCoins,
      powerups: [],
      floatingTexts: [],
      particles: [],
    };

    setGameState("playing");
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (gameState !== "playing") return;
      if (e.key === "w" || e.key === "W" || e.key === "ArrowUp") engineRef.current.keys.p1Up = true;
      if (e.key === "s" || e.key === "S" || e.key === "ArrowDown") engineRef.current.keys.p1Down = true;
      if (e.key === "a" || e.key === "A" || e.key === "ArrowLeft") engineRef.current.keys.p1Left = true;
      if (e.key === "d" || e.key === "D" || e.key === "ArrowRight") engineRef.current.keys.p1Right = true;
      if (e.key === " ") engineRef.current.keys.p1Nitro = true;
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === "w" || e.key === "W" || e.key === "ArrowUp") engineRef.current.keys.p1Up = false;
      if (e.key === "s" || e.key === "S" || e.key === "ArrowDown") engineRef.current.keys.p1Down = false;
      if (e.key === "a" || e.key === "A" || e.key === "ArrowLeft") engineRef.current.keys.p1Left = false;
      if (e.key === "d" || e.key === "D" || e.key === "ArrowRight") engineRef.current.keys.p1Right = false;
      if (e.key === " ") engineRef.current.keys.p1Nitro = false;
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
      const c1 = state.carP1;
      const c2 = state.carP2;

      // Handling & Speed Caps
      const maxSpeed = 7 + upgrades.topSpeed * 1.2;
      const turnRate = 0.06 + upgrades.driftHandling * 0.015;

      if (state.keys.p1Left) c1.angle -= turnRate;
      if (state.keys.p1Right) c1.angle += turnRate;

      if (state.keys.p1Up) c1.speed = Math.min(maxSpeed, c1.speed + 0.35);
      else if (state.keys.p1Down) c1.speed = Math.max(-maxSpeed * 0.5, c1.speed - 0.25);
      else c1.speed *= 0.96;

      if (state.keys.p1Nitro) {
        c1.speed = Math.min(maxSpeed * 1.5, c1.speed + 0.6);
        audioSynth.playNitroBoost();
        spawnParticles(c1.x, c1.y, "#f59e0b", 3);
      }

      c1.vx = Math.cos(c1.angle) * c1.speed;
      c1.vy = Math.sin(c1.angle) * c1.speed;
      c1.x += c1.vx;
      c1.y += c1.vy;
      c1.x = Math.max(20, Math.min(780, c1.x));
      c1.y = Math.max(20, Math.min(580, c1.y));

      // Move Kinetic Obstacles
      state.obstacles.forEach((obs) => {
        obs.x += obs.vx;
        obs.y += obs.vy;
        if (obs.x < 30 || obs.x > 770) obs.vx *= -1;
        if (obs.y < 30 || obs.y > 570) obs.vy *= -1;

        // Collision Check
        const dx = obs.x - c1.x;
        const dy = obs.y - c1.y;
        if (Math.sqrt(dx * dx + dy * dy) < obs.radius + 14) {
          if (c1.shield > 0) {
            c1.shield--;
            audioSynth.playCrash();
            setScreenShake(12);
            spawnParticles(c1.x, c1.y, "#3b82f6", 20);
            addFloatingText("SHIELD ABSORBED!", c1.x, c1.y - 20, "#60a5fa");
            obs.vx *= -1.5;
            obs.vy *= -1.5;
          } else {
            audioSynth.playCrash();
            setScreenShake(24);
            spawnParticles(c1.x, c1.y, "#ef4444", 35);
            setGameState("game_over");
            return;
          }
        }
      });

      // Coin Collection with Magnet Radius
      const magnetRadius = 40 + upgrades.coinMagnet * 20;
      state.coins.forEach((coin) => {
        const dx = coin.x - c1.x;
        const dy = coin.y - c1.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < magnetRadius) {
          coin.x -= (dx / dist) * 4;
          coin.y -= (dy / dist) * 4;
        }

        if (dist < coin.radius + 14) {
          audioSynth.playCoinCollect();
          coin.x = 60 + Math.random() * 680;
          coin.y = 60 + Math.random() * 480;

          localCombo++;
          if (localCombo % 5 === 0 && localMult < 8) {
            localMult *= 2;
            setMultiplier(localMult);
            addFloatingText(`${localMult}X MULTIPLIER!`, c1.x, c1.y - 30, "#f59e0b");
          }

          if (localCombo >= 15) {
            setOverdriveActive(true);
          }

          const addedCoins = 1 * localMult;
          setCoins((prev) => prev + addedCoins);
          p1ScoreAccum += 150 * localMult;
          setScoreP1(p1ScoreAccum);
          setComboStreak(localCombo);

          addFloatingText(`+${150 * localMult}`, c1.x, c1.y - 15, "#34d399");
          spawnParticles(c1.x, c1.y, "#fbbf24", 8);
        }
      });

      // Update Floating Text FX
      state.floatingTexts.forEach((ft) => {
        ft.y -= 1.2;
        ft.alpha -= 0.02;
      });
      state.floatingTexts = state.floatingTexts.filter((ft) => ft.alpha > 0);

      // Update Particle Explosions
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

      ctx.fillStyle = overdriveActive ? "#110826" : "#020912";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Render Particles
      state.particles.forEach((p) => {
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.life;
        ctx.fillRect(p.x, p.y, 4, 4);
      });
      ctx.globalAlpha = 1.0;

      // Render Obstacles
      state.obstacles.forEach((obs) => {
        ctx.beginPath();
        ctx.arc(obs.x, obs.y, obs.radius, 0, Math.PI * 2);
        ctx.fillStyle = "#ef4444";
        ctx.shadowColor = "#ef4444";
        ctx.shadowBlur = 18;
        ctx.fill();
      });
      ctx.shadowBlur = 0;

      // Render Coins
      state.coins.forEach((coin) => {
        ctx.beginPath();
        ctx.arc(coin.x, coin.y, coin.radius, 0, Math.PI * 2);
        ctx.fillStyle = "#fbbf24";
        ctx.shadowColor = "#fbbf24";
        ctx.shadowBlur = 14;
        ctx.fill();
      });
      ctx.shadowBlur = 0;

      // Render Player Car
      ctx.save();
      ctx.translate(c1.x, c1.y);
      ctx.rotate(c1.angle);
      ctx.fillStyle = overdriveActive ? "#ec4899" : "#10b981";
      ctx.shadowColor = ctx.fillStyle;
      ctx.shadowBlur = 22;
      ctx.fillRect(-16, -10, 32, 20);
      ctx.restore();
      ctx.shadowBlur = 0;

      // Render Floating Text FX
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
  }, [gameState, mode, overdriveActive, screenShake, upgrades]);

  return (
    <div className="relative w-full h-screen bg-[#01060c] text-white flex flex-col items-center justify-center font-sans overflow-hidden select-none">
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
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-bold uppercase tracking-wider backdrop-blur-md"
          >
            <ShoppingBag className="w-4 h-4" /> GARAGE ({coins} CR)
          </button>
          <button
            onClick={() => {
              audioSynth.muted = !muted;
              setMuted(!muted);
            }}
            className="p-2.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-white backdrop-blur-md"
          >
            {muted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
          </button>
        </div>
      </div>

      {/* Main Canvas Area */}
      <div className="relative w-full max-w-4xl aspect-[4/3] bg-[#02111d] rounded-3xl border border-emerald-500/30 overflow-hidden shadow-[0_0_60px_rgba(16,185,129,0.15)] flex flex-col justify-center items-center">
        <canvas ref={canvasRef} width={800} height={600} className="w-full h-full object-contain" />

        {/* Dynamic HUD */}
        {gameState === "playing" && (
          <div className="absolute top-6 inset-x-6 z-20 flex justify-between items-start pointer-events-none">
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-black/60 border border-emerald-500/40 text-emerald-300 font-mono text-xs backdrop-blur-md">
                <Gauge className="w-3.5 h-3.5 text-emerald-400" /> TORQUE SCORE: {scoreP1}
              </div>
              {multiplier > 1 && (
                <div className="px-3 py-1 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-300 font-mono text-xs font-black animate-bounce">
                  {multiplier}X SCORE MULTIPLIER
                </div>
              )}
              {overdriveActive && (
                <div className="px-3 py-1 rounded-xl bg-pink-500/20 border border-pink-500/40 text-pink-300 font-mono text-xs font-black uppercase tracking-widest animate-pulse">
                  ⚡ OVERDRIVE MODE ACTIVE ⚡
                </div>
              )}
            </div>

            <div className="px-4 py-2 rounded-2xl bg-black/60 border border-emerald-500/40 backdrop-blur-md text-right">
              <div className="text-[10px] font-mono text-emerald-400/70 uppercase">COMBO STREAK</div>
              <div className="text-2xl font-black font-mono text-emerald-300">{comboStreak} STREAK</div>
            </div>
          </div>
        )}

        {/* Touch Controls Overlay */}
        {gameState === "playing" && isMobileScreen && (
          <div className="absolute bottom-6 inset-x-6 flex justify-between items-center z-30 pointer-events-auto">
            <div className="flex gap-2">
              <button
                onTouchStart={() => (engineRef.current.keys.p1Left = true)}
                onTouchEnd={() => (engineRef.current.keys.p1Left = false)}
                className="w-14 h-14 rounded-2xl bg-white/10 border border-white/20 active:bg-emerald-500/30 flex items-center justify-center font-bold text-lg"
              >
                ←
              </button>
              <button
                onTouchStart={() => (engineRef.current.keys.p1Right = true)}
                onTouchEnd={() => (engineRef.current.keys.p1Right = false)}
                className="w-14 h-14 rounded-2xl bg-white/10 border border-white/20 active:bg-emerald-500/30 flex items-center justify-center font-bold text-lg"
              >
                →
              </button>
            </div>
            <button
              onTouchStart={() => (engineRef.current.keys.p1Nitro = true)}
              onTouchEnd={() => (engineRef.current.keys.p1Nitro = false)}
              className="w-20 h-20 rounded-full bg-gradient-to-tr from-amber-500 to-emerald-500 border border-amber-300 active:scale-95 flex items-center justify-center font-black text-xs uppercase text-black shadow-lg"
            >
              NITRO
            </button>
          </div>
        )}

        {/* Garage Upgrades Overlay */}
        <AnimatePresence>
          {gameState === "shop" && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="absolute inset-0 z-40 bg-black/90 backdrop-blur-2xl flex flex-col items-center justify-center p-6"
            >
              <h2 className="text-4xl font-black uppercase text-amber-300 mb-2">TORQUE GARAGE</h2>
              <p className="text-xs text-amber-100/60 mb-6">Persistent Performance Upgrades (Credits: {coins} CR)</p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-lg w-full mb-6">
                <div className="p-4 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Gauge className="w-6 h-6 text-emerald-400" />
                    <div>
                      <div className="font-bold text-sm">TOP SPEED</div>
                      <div className="text-[10px] text-white/50">Level {upgrades.topSpeed}</div>
                    </div>
                  </div>
                  <button
                    onClick={() => buyUpgrade("topSpeed", 5)}
                    className="px-3 py-1.5 rounded-xl bg-amber-500 text-black font-bold text-xs"
                  >
                    5 CR
                  </button>
                </div>

                <div className="p-4 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Shield className="w-6 h-6 text-blue-400" />
                    <div>
                      <div className="font-bold text-sm">SHIELD CHARGE</div>
                      <div className="text-[10px] text-white/50">Charges: {upgrades.shieldCharges}</div>
                    </div>
                  </div>
                  <button
                    onClick={() => buyUpgrade("shieldCharges", 10)}
                    className="px-3 py-1.5 rounded-xl bg-amber-500 text-black font-bold text-xs"
                  >
                    10 CR
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
          <div className="absolute inset-0 z-40 bg-[#010a14]/90 backdrop-blur-2xl flex flex-col items-center justify-center p-6 overflow-y-auto">
            <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-emerald-600/20 rounded-full blur-[120px] pointer-events-none animate-pulse" />

            <motion.div
              initial={{ scale: 0.88, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              className="text-center max-w-2xl mb-8 z-10"
            >
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-black uppercase tracking-widest mb-4 shadow-[0_0_20px_rgba(16,185,129,0.2)]">
                <Zap className="w-4 h-4 text-emerald-400 animate-bounce" /> Kinetic Wheel Torque Combat
              </div>

              <h1 className="text-7xl md:text-8xl font-black uppercase tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-emerald-300 via-teal-300 to-amber-400 drop-shadow-[0_0_40px_rgba(16,185,129,0.6)]">
                TORQUE
              </h1>
              <p className="text-base text-emerald-100/70 mt-4 max-w-lg mx-auto leading-relaxed">
                Harness angular drift momentum to dodge kinetic obstacles, harvest stardust credits, and trigger hyper overdrive modes.
              </p>

              <div className="flex justify-center gap-3 mt-4">
                <span className="px-3 py-1 rounded-md bg-white/5 border border-white/10 text-[10px] font-mono text-emerald-300">UPGRADE GARAGE</span>
                <span className="px-3 py-1 rounded-md bg-white/5 border border-white/10 text-[10px] font-mono text-amber-300">COMBO MULTIPLIER</span>
                <span className="px-3 py-1 rounded-md bg-white/5 border border-white/10 text-[10px] font-mono text-teal-300">TOUCH READY</span>
              </div>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-xl w-full z-10">
              <button
                onClick={() => startGame("kinetic_drift")}
                className="group relative p-6 rounded-3xl bg-white/5 border border-emerald-500/30 hover:border-emerald-400 hover:bg-emerald-500/10 flex flex-col items-center gap-3 transition-all duration-300 text-center backdrop-blur-md shadow-lg hover:shadow-[0_0_30px_rgba(16,185,129,0.3)] active:scale-95"
              >
                <User className="w-8 h-8 text-emerald-400 group-hover:scale-110 transition-transform" />
                <div>
                  <div className="font-black text-xl uppercase tracking-wider text-white">KINETIC DRIFT</div>
                  <div className="text-xs text-emerald-200/60 mt-1">Single player high-speed torque trial</div>
                </div>
              </button>

              <button
                onClick={() => startGame("torque_duel")}
                className="group relative p-6 rounded-3xl bg-white/5 border border-amber-500/30 hover:border-amber-400 hover:bg-amber-500/10 flex flex-col items-center gap-3 transition-all duration-300 text-center backdrop-blur-md shadow-lg hover:shadow-[0_0_30px_rgba(245,158,11,0.3)] active:scale-95"
              >
                <Users className="w-8 h-8 text-amber-400 group-hover:scale-110 transition-transform" />
                <div>
                  <div className="font-black text-xl uppercase tracking-wider text-white">TORQUE DUEL</div>
                  <div className="text-xs text-amber-200/60 mt-1">2-Player competitive drift arena</div>
                </div>
              </button>
            </div>

            <div className="mt-8 z-10 flex flex-wrap items-center justify-center gap-6 text-xs text-white/50 bg-black/40 px-6 py-3 rounded-2xl border border-white/10">
              <div className="flex items-center gap-2">
                <span className="font-mono text-emerald-300 bg-white/10 px-2 py-0.5 rounded border border-white/10 font-bold">WASD</span>
                <span>Drive & Drift</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-amber-300 bg-white/10 px-2 py-0.5 rounded border border-white/10 font-bold">SPACE</span>
                <span>Nitro Acceleration</span>
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
              className="text-center max-w-md w-full bg-slate-900/90 border border-emerald-500/40 p-8 rounded-3xl shadow-[0_0_50px_rgba(16,185,129,0.3)] relative overflow-hidden"
            >
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-bold uppercase tracking-wider mb-4">
                <Trophy className="w-3.5 h-3.5 text-emerald-400" /> Kinetic Drift Finished
              </div>

              <h2 className="text-4xl font-black uppercase text-transparent bg-clip-text bg-gradient-to-r from-emerald-300 to-amber-300 mb-2">
                CRASHED OUT!
              </h2>
              <p className="text-xs text-emerald-200/60 mb-6">Torque Drift Performance Results</p>

              <div className="p-4 rounded-2xl bg-white/5 border border-white/10 mb-6">
                <div className="text-[10px] text-white/40 font-black uppercase">FINAL SCORE</div>
                <div className="text-3xl font-black text-emerald-300">{scoreP1}</div>
              </div>

              <div className="mb-6 flex gap-2">
                <input
                  type="text"
                  placeholder="Enter Player Name"
                  value={playerName}
                  onChange={(e) => setPlayerName(e.target.value)}
                  className="flex-1 px-4 py-3 rounded-xl bg-black/60 border border-white/10 text-white text-xs focus:outline-none focus:border-emerald-400"
                />
                <button
                  onClick={saveScore}
                  className="px-4 py-3 rounded-xl bg-emerald-500 text-black font-bold text-xs uppercase"
                >
                  SAVE
                </button>
              </div>

              <div className="flex gap-4">
                <button
                  onClick={() => startGame(mode)}
                  className="flex-1 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-amber-500 hover:from-emerald-400 hover:to-amber-400 text-black font-black uppercase tracking-wider shadow-[0_0_20px_rgba(16,185,129,0.4)] active:scale-95 transition-all"
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
