"use client";

import React, { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Trophy,
  Volume2,
  VolumeX,
  ArrowLeft,
  Zap,
  Users,
  User,
  ShoppingBag,
  Shield,
  Activity,
} from "lucide-react";
import Link from "next/link";
import { db } from "@/lib/firebase";
import { collection, addDoc, query, orderBy, limit, onSnapshot } from "firebase/firestore";

// --- AUDIO SYNTHESIZER ---
class SurgeAudioSynth {
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

  playZapSound() {
    if (this.muted || !this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(700, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(1400, this.ctx.currentTime + 0.15);
    gain.gain.setValueAtTime(0.15, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.15);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.15);
  }

  playOverload() {
    if (this.muted || !this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(400, this.ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(1200, this.ctx.currentTime + 0.25);
    gain.gain.setValueAtTime(0.18, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.25);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.25);
  }

  playShortCircuit() {
    if (this.muted || !this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(110, this.ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(25, this.ctx.currentTime + 0.35);
    gain.gain.setValueAtTime(0.22, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.35);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.35);
  }
}

const audioSynth = new SurgeAudioSynth();

export type SurgeMode = "voltage_jump" | "surge_duel";

interface LeaderboardEntry {
  id: string;
  name: string;
  score: number;
}

interface ElectricalNode {
  id: number;
  x: number;
  y: number;
  voltage: number;
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

export default function SurgeGame() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [gameState, setGameState] = useState<"menu" | "shop" | "playing" | "game_over">("menu");
  const [mode, setMode] = useState<SurgeMode>("voltage_jump");
  const [scoreP1, setScoreP1] = useState(0);
  const [scoreP2, setScoreP2] = useState(0);
  const [volts, setVolts] = useState(0);
  const [comboStreak, setComboStreak] = useState(0);
  const [multiplier, setMultiplier] = useState(1);
  const [overdriveActive, setOverdriveActive] = useState(false);
  const [screenShake, setScreenShake] = useState(0);

  // Shop Upgrades
  const [upgrades, setUpgrades] = useState({
    capacitorCap: 1,
    groundShield: 0,
    voltMagnet: 1,
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
    keys: { p1Up: false, p1Down: false, p1Left: false, p1Right: false, p1Zap: false, p2Up: false, p2Down: false, p2Left: false, p2Right: false },
    jumperP1: { x: 400, y: 300, vx: 0, vy: 0, radius: 14, shield: 0 },
    jumperP2: { x: 500, y: 300, vx: 0, vy: 0, radius: 14, shield: 0 },
    nodes: [] as ElectricalNode[],
    sparks: [] as { x: number; y: number; vx: number; vy: number }[],
    floatingTexts: [] as FloatingText[],
    particles: [] as { x: number; y: number; vx: number; vy: number; color: string; life: number }[],
  });

  useEffect(() => {
    try {
      const q = query(collection(db, "surge_leaderboard"), orderBy("score", "desc"), limit(5));
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
      await addDoc(collection(db, "surge_leaderboard"), {
        name: playerName.trim().substring(0, 12),
        score: scoreP1,
        createdAt: new Date(),
      });
    } catch (e) {
      console.warn("Score submission error:", e);
    }
  };

  const addFloatingText = (text: string, x: number, y: number, color: string = "#eab308") => {
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
    if (volts >= cost) {
      setVolts(volts - cost);
      setUpgrades((prev) => ({ ...prev, [type]: prev[type] + 1 }));
    }
  };

  const zapToClosestNode = () => {
    const state = engineRef.current;
    const j1 = state.jumperP1;
    let closestNode: any = null;
    let minDist = 140;

    state.nodes.forEach((node) => {
      const dx = node.x - j1.x;
      const dy = node.y - j1.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < minDist) {
        minDist = dist;
        closestNode = node;
      }
    });

    if (closestNode) {
      audioSynth.playZapSound();
      j1.x = closestNode.x;
      j1.y = closestNode.y;

      setVolts((prev) => prev + 1);
      spawnParticles(j1.x, j1.y, "#eab308", 12);
      addFloatingText("+VOLT!", j1.x, j1.y - 20, "#eab308");
    }
  };

  const startGame = (selectedMode: SurgeMode) => {
    audioSynth.init();
    setMode(selectedMode);
    setScoreP1(0);
    setScoreP2(0);
    setComboStreak(0);
    setMultiplier(1);
    setOverdriveActive(false);
    setWinnerName(null);

    const initialNodes: ElectricalNode[] = [
      { id: 1, x: 200, y: 200, voltage: 100, radius: 18 },
      { id: 2, x: 600, y: 400, voltage: 100, radius: 18 },
      { id: 3, x: 400, y: 250, voltage: 100, radius: 18 },
      { id: 4, x: 300, y: 450, voltage: 100, radius: 18 },
    ];

    engineRef.current = {
      keys: { p1Up: false, p1Down: false, p1Left: false, p1Right: false, p1Zap: false, p2Up: false, p2Down: false, p2Left: false, p2Right: false },
      jumperP1: { x: 400, y: 300, vx: 0, vy: 0, radius: 14, shield: upgrades.groundShield },
      jumperP2: { x: 500, y: 300, vx: 0, vy: 0, radius: 14, shield: 0 },
      nodes: initialNodes,
      sparks: [],
      floatingTexts: [],
      particles: [],
    };

    setGameState("playing");
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (gameState !== "playing") return;
      if (e.key === "w" || e.key === "W") engineRef.current.keys.p1Up = true;
      if (e.key === "s" || e.key === "S") engineRef.current.keys.p1Down = true;
      if (e.key === "a" || e.key === "A") engineRef.current.keys.p1Left = true;
      if (e.key === "d" || e.key === "D") engineRef.current.keys.p1Right = true;
      if (e.key === " ") zapToClosestNode();
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === "w" || e.key === "W") engineRef.current.keys.p1Up = false;
      if (e.key === "s" || e.key === "S") engineRef.current.keys.p1Down = false;
      if (e.key === "a" || e.key === "A") engineRef.current.keys.p1Left = false;
      if (e.key === "d" || e.key === "D") engineRef.current.keys.p1Right = false;
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

    const loop = () => {
      const state = engineRef.current;
      const j1 = state.jumperP1;

      // Thruster navigation
      if (state.keys.p1Up) j1.vy -= 0.35;
      if (state.keys.p1Down) j1.vy += 0.35;
      if (state.keys.p1Left) j1.vx -= 0.35;
      if (state.keys.p1Right) j1.vx += 0.35;

      j1.vx *= 0.95;
      j1.vy *= 0.95;
      j1.x += j1.vx;
      j1.y += j1.vy;
      j1.x = Math.max(20, Math.min(780, j1.x));
      j1.y = Math.max(20, Math.min(580, j1.y));

      p1ScoreAccum += 1;
      setScoreP1(p1ScoreAccum);

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

      ctx.fillStyle = "#0c0a02";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Render Nodes
      state.nodes.forEach((n) => {
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.radius, 0, Math.PI * 2);
        ctx.fillStyle = "#eab308";
        ctx.shadowColor = "#eab308";
        ctx.shadowBlur = 18;
        ctx.fill();
      });
      ctx.shadowBlur = 0;

      // Render Jumper
      ctx.beginPath();
      ctx.arc(j1.x, j1.y, j1.radius, 0, Math.PI * 2);
      ctx.fillStyle = "#f59e0b";
      ctx.shadowColor = "#f59e0b";
      ctx.shadowBlur = 22;
      ctx.fill();
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
    <div className="relative w-full h-screen bg-[#0a0801] text-white flex flex-col items-center justify-center font-sans overflow-hidden select-none">
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
            <ShoppingBag className="w-4 h-4" /> POWER GRID ({volts} VOLTS)
          </button>
          <button
            onClick={() => {
              audioSynth.muted = !muted;
              setMuted(!muted);
            }}
            className="p-2.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-white backdrop-blur-md"
          >
            {muted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-yellow-400" />}
          </button>
        </div>
      </div>

      {/* Main Canvas Area */}
      <div className="relative w-full max-w-4xl aspect-[4/3] bg-[#1a1402] rounded-3xl border border-yellow-500/30 overflow-hidden shadow-[0_0_60px_rgba(234,179,8,0.15)] flex flex-col justify-center items-center">
        <canvas ref={canvasRef} width={800} height={600} className="w-full h-full object-contain" />

        {/* Dynamic HUD */}
        {gameState === "playing" && (
          <div className="absolute top-6 inset-x-6 z-20 flex justify-between items-start pointer-events-none">
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-black/60 border border-yellow-500/40 text-yellow-300 font-mono text-xs backdrop-blur-md">
                <Zap className="w-3.5 h-3.5 text-yellow-400" /> SURGE VOLTAGE: {scoreP1}
              </div>
            </div>

            <div className="px-4 py-2 rounded-2xl bg-black/60 border border-yellow-500/40 backdrop-blur-md text-right">
              <div className="text-[10px] font-mono text-yellow-400/70 uppercase">VOLTS HARVESTED</div>
              <div className="text-2xl font-black font-mono text-yellow-300">{volts}</div>
            </div>
          </div>
        )}

        {/* Touch Controls Overlay */}
        {gameState === "playing" && isMobileScreen && (
          <div className="absolute bottom-6 inset-x-6 flex justify-between items-center z-30 pointer-events-auto">
            <div className="grid grid-cols-3 gap-2 w-36">
              <div />
              <button
                onTouchStart={() => (engineRef.current.keys.p1Up = true)}
                onTouchEnd={() => (engineRef.current.keys.p1Up = false)}
                className="w-11 h-11 rounded-xl bg-white/10 border border-white/20 active:bg-yellow-500/30 flex items-center justify-center font-bold"
              >
                ↑
              </button>
              <div />
              <button
                onTouchStart={() => (engineRef.current.keys.p1Left = true)}
                onTouchEnd={() => (engineRef.current.keys.p1Left = false)}
                className="w-11 h-11 rounded-xl bg-white/10 border border-white/20 active:bg-yellow-500/30 flex items-center justify-center font-bold"
              >
                ←
              </button>
              <button
                onTouchStart={() => (engineRef.current.keys.p1Down = true)}
                onTouchEnd={() => (engineRef.current.keys.p1Down = false)}
                className="w-11 h-11 rounded-xl bg-white/10 border border-white/20 active:bg-yellow-500/30 flex items-center justify-center font-bold"
              >
                ↓
              </button>
              <button
                onTouchStart={() => (engineRef.current.keys.p1Right = true)}
                onTouchEnd={() => (engineRef.current.keys.p1Right = false)}
                className="w-11 h-11 rounded-xl bg-white/10 border border-white/20 active:bg-yellow-500/30 flex items-center justify-center font-bold"
              >
                →
              </button>
            </div>
            <button
              onClick={zapToClosestNode}
              className="w-20 h-20 rounded-full bg-gradient-to-tr from-yellow-500 to-amber-500 border border-yellow-300 active:scale-95 flex items-center justify-center font-black text-xs uppercase text-black shadow-lg"
            >
              ZAP
            </button>
          </div>
        )}

        {/* Shop Overlay */}
        <AnimatePresence>
          {gameState === "shop" && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="absolute inset-0 z-40 bg-black/90 backdrop-blur-2xl flex flex-col items-center justify-center p-6"
            >
              <h2 className="text-4xl font-black uppercase text-yellow-300 mb-2">POWER GRID STATION</h2>
              <p className="text-xs text-yellow-100/60 mb-6">Persistent Grid Upgrades (Volts: {volts})</p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-lg w-full mb-6">
                <div className="p-4 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Zap className="w-6 h-6 text-yellow-400" />
                    <div>
                      <div className="font-bold text-sm">CAPACITOR CAP</div>
                      <div className="text-[10px] text-white/50">Level {upgrades.capacitorCap}</div>
                    </div>
                  </div>
                  <button
                    onClick={() => buyUpgrade("capacitorCap", 5)}
                    className="px-3 py-1.5 rounded-xl bg-yellow-500 text-black font-bold text-xs"
                  >
                    5 VOLTS
                  </button>
                </div>

                <div className="p-4 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Shield className="w-6 h-6 text-amber-400" />
                    <div>
                      <div className="font-bold text-sm">GROUND SHIELD</div>
                      <div className="text-[10px] text-white/50">Charges: {upgrades.groundShield}</div>
                    </div>
                  </div>
                  <button
                    onClick={() => buyUpgrade("groundShield", 10)}
                    className="px-3 py-1.5 rounded-xl bg-yellow-500 text-black font-bold text-xs"
                  >
                    10 VOLTS
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
          <div className="absolute inset-0 z-40 bg-[#120e01]/90 backdrop-blur-2xl flex flex-col items-center justify-center p-6 overflow-y-auto">
            <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-yellow-600/20 rounded-full blur-[120px] pointer-events-none animate-pulse" />

            <motion.div
              initial={{ scale: 0.88, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              className="text-center max-w-2xl mb-8 z-10"
            >
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-yellow-500/10 border border-yellow-500/30 text-yellow-300 text-xs font-black uppercase tracking-widest mb-4 shadow-[0_0_20px_rgba(234,179,8,0.2)]">
                <Zap className="w-4 h-4 text-yellow-400 animate-bounce" /> High-Voltage Electrical Node Jumper
              </div>

              <h1 className="text-7xl md:text-8xl font-black uppercase tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-amber-300 to-orange-400 drop-shadow-[0_0_40px_rgba(234,179,8,0.6)]">
                SURGE
              </h1>
              <p className="text-base text-yellow-100/70 mt-4 max-w-lg mx-auto leading-relaxed">
                Zap between high-voltage power grid nodes to charge energy capacitors and avoid catastrophic short circuits.
              </p>

              <div className="flex justify-center gap-3 mt-4">
                <span className="px-3 py-1 rounded-md bg-white/5 border border-white/10 text-[10px] font-mono text-yellow-300">POWER GRID STATION</span>
                <span className="px-3 py-1 rounded-md bg-white/5 border border-white/10 text-[10px] font-mono text-amber-300">STREAK MULTIPLIER</span>
                <span className="px-3 py-1 rounded-md bg-white/5 border border-white/10 text-[10px] font-mono text-orange-300">TOUCH READY</span>
              </div>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-xl w-full z-10">
              <button
                onClick={() => startGame("voltage_jump")}
                className="group relative p-6 rounded-3xl bg-white/5 border border-yellow-500/30 hover:border-yellow-400 hover:bg-yellow-500/10 flex flex-col items-center gap-3 transition-all duration-300 text-center backdrop-blur-md shadow-lg hover:shadow-[0_0_30px_rgba(234,179,8,0.3)] active:scale-95"
              >
                <User className="w-8 h-8 text-yellow-400 group-hover:scale-110 transition-transform" />
                <div>
                  <div className="font-black text-xl uppercase tracking-wider text-white">VOLTAGE JUMP</div>
                  <div className="text-xs text-yellow-200/60 mt-1">Single player high-voltage node challenge</div>
                </div>
              </button>

              <button
                onClick={() => startGame("surge_duel")}
                className="group relative p-6 rounded-3xl bg-white/5 border border-amber-500/30 hover:border-amber-400 hover:bg-amber-500/10 flex flex-col items-center gap-3 transition-all duration-300 text-center backdrop-blur-md shadow-lg hover:shadow-[0_0_30px_rgba(245,158,11,0.3)] active:scale-95"
              >
                <Users className="w-8 h-8 text-amber-400 group-hover:scale-110 transition-transform" />
                <div>
                  <div className="font-black text-xl uppercase tracking-wider text-white">SURGE DUEL</div>
                  <div className="text-xs text-amber-200/60 mt-1">2-Player competitive power grid race</div>
                </div>
              </button>
            </div>

            <div className="mt-8 z-10 flex flex-wrap items-center justify-center gap-6 text-xs text-white/50 bg-black/40 px-6 py-3 rounded-2xl border border-white/10">
              <div className="flex items-center gap-2">
                <span className="font-mono text-yellow-300 bg-white/10 px-2 py-0.5 rounded border border-white/10 font-bold">WASD</span>
                <span>Move Jumper</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-amber-300 bg-white/10 px-2 py-0.5 rounded border border-white/10 font-bold">SPACE</span>
                <span>Zap to Nearest Node</span>
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
              className="text-center max-w-md w-full bg-slate-900/90 border border-yellow-500/40 p-8 rounded-3xl shadow-[0_0_50px_rgba(234,179,8,0.3)] relative overflow-hidden"
            >
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-yellow-500/10 border border-yellow-500/30 text-yellow-300 text-xs font-bold uppercase tracking-wider mb-4">
                <Trophy className="w-3.5 h-3.5 text-yellow-400" /> Voltage Jump Finished
              </div>

              <h2 className="text-4xl font-black uppercase text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-amber-300 mb-2">
                SHORT CIRCUIT!
              </h2>
              <p className="text-xs text-yellow-200/60 mb-6">Surge Power Grid Results</p>

              <div className="p-4 rounded-2xl bg-white/5 border border-white/10 mb-6">
                <div className="text-[10px] text-white/40 font-black uppercase">FINAL SCORE</div>
                <div className="text-3xl font-black text-yellow-300">{scoreP1}</div>
              </div>

              <div className="mb-6 flex gap-2">
                <input
                  type="text"
                  placeholder="Enter Player Name"
                  value={playerName}
                  onChange={(e) => setPlayerName(e.target.value)}
                  className="flex-1 px-4 py-3 rounded-xl bg-black/60 border border-white/10 text-white text-xs focus:outline-none focus:border-yellow-400"
                />
                <button
                  onClick={saveScore}
                  className="px-4 py-3 rounded-xl bg-yellow-500 text-black font-bold text-xs uppercase"
                >
                  SAVE
                </button>
              </div>

              <div className="flex gap-4">
                <button
                  onClick={() => startGame(mode)}
                  className="flex-1 py-3.5 rounded-2xl bg-gradient-to-r from-yellow-500 to-amber-500 hover:from-yellow-400 hover:to-amber-400 text-black font-black uppercase tracking-wider shadow-[0_0_20px_rgba(234,179,8,0.4)] active:scale-95 transition-all"
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
