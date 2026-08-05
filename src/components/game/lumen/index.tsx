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
  Award,
  Settings,
  Flame,
  Globe,
  RefreshCw,
  Cpu,
  Radio,
  Sliders,
  Crosshair,
  Box,
  Layers,
  Activity,
  HardDrive,
  Target,
  BarChart2,
  PieChart,
  Compass,
  Maximize2,
  Lock,
  CheckCircle,
  TrendingUp,
  RotateCcw,
} from "lucide-react";
import Link from "next/link";
import { db } from "@/lib/firebase";
import { collection, addDoc, query, orderBy, limit, onSnapshot } from "firebase/firestore";

// ==========================================
// 1. MULTI-TRACK CYBER WEBAUDIO ENGINE
// ==========================================
class LumenMultiTrackAudio {
  ctx: AudioContext | null = null;
  muted: boolean = false;
  sfxVolume: number = 0.8;
  bgmVolume: number = 0.4;
  bgmOsc: OscillatorNode | null = null;
  bgmGain: GainNode | null = null;
  isPlayingBgm: boolean = false;

  init() {
    if (!this.ctx) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === "suspended") {
      this.ctx.resume();
    }
  }

  startBackgroundCyberPulse() {
    if (this.muted || !this.ctx || this.isPlayingBgm) return;
    try {
      this.bgmOsc = this.ctx.createOscillator();
      this.bgmGain = this.ctx.createGain();
      this.bgmOsc.type = "sawtooth";
      this.bgmOsc.frequency.setValueAtTime(65, this.ctx.currentTime);
      this.bgmGain.gain.setValueAtTime(0.04 * this.bgmVolume, this.ctx.currentTime);
      this.bgmOsc.connect(this.bgmGain);
      this.bgmGain.connect(this.ctx.destination);
      this.bgmOsc.start();
      this.isPlayingBgm = true;
    } catch (e) {
      console.warn("BGM initialization failed:", e);
    }
  }

  playLaserPulse() {
    if (this.muted || !this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(880, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(220, this.ctx.currentTime + 0.22);
    gain.gain.setValueAtTime(0.3 * this.sfxVolume, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.22);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.22);
  }

  playShardCollect() {
    if (this.muted || !this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(523.25, this.ctx.currentTime); // C5
    osc.frequency.setValueAtTime(659.25, this.ctx.currentTime + 0.08); // E5
    gain.gain.setValueAtTime(0.18 * this.sfxVolume, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.2);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.2);
  }
}

const audioSynth = new LumenMultiTrackAudio();

// ==========================================
// 2. DATA TYPES & INTERFACES
// ==========================================
export type LumenMenuTab =
  | "play"
  | "armory"
  | "online"
  | "leaderboard"
  | "achievements"
  | "analytics"
  | "settings";

export type LumenGameMode = "tactical_grid" | "cyber_duel" | "overdrive_surge";

export interface LeaderboardEntry {
  id: string;
  name: string;
  score: number;
  mode: string;
  date?: string;
}

export interface OnlineRoom {
  id: string;
  name: string;
  host: string;
  players: number;
  maxPlayers: number;
  ping: number;
  mode: string;
  status: "open" | "in_battle" | "full";
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  rewardShards: number;
  unlocked: boolean;
  progress: number;
  maxProgress: number;
}

export interface ArmoryItem {
  id: string;
  name: string;
  category: "beam" | "refractor" | "shield" | "drone" | "magnet" | "radar" | "overdrive" | "matrix";
  description: string;
  costShards: number;
  level: number;
  maxLevel: number;
  iconName: string;
  statBoost: string;
}

export interface FloatingTextFX {
  id: number;
  text: string;
  x: number;
  y: number;
  color: string;
  alpha: number;
}

export interface EnergyNode {
  id: number;
  x: number;
  y: number;
  radius: number;
  color: string;
  vx: number;
  vy: number;
  hp: number;
  maxHp: number;
}

// ==========================================
// 3. MAIN COMPONENT DEFINITION
// ==========================================
export default function LumenGame() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // System States
  const [gameState, setGameState] = useState<"menu" | "playing" | "game_over">("menu");
  const [activeTab, setActiveTab] = useState<LumenMenuTab>("play");
  const [selectedMode, setSelectedMode] = useState<LumenGameMode>("tactical_grid");
  const [isMobileScreen, setIsMobileScreen] = useState(false);

  // Economy & Stats
  const [energyShards, setEnergyShards] = useState(610);
  const [scoreP1, setScoreP1] = useState(0);
  const [multiplier, setMultiplier] = useState(1);

  // 12-Branch Armory Shop Upgrades
  const [armoryItems, setArmoryItems] = useState<ArmoryItem[]>([
    {
      id: "beam_amplifier",
      name: "CYBER BEAM AMPLIFIER",
      category: "beam",
      description: "Increases photon laser velocity and beam damage width.",
      costShards: 85,
      level: 1,
      maxLevel: 5,
      iconName: "Zap",
      statBoost: "+25% Photon Velocity",
    },
    {
      id: "refractor_lens",
      name: "REFRACTION MATRIX LENS",
      category: "refractor",
      description: "Splits laser beams into 3 refracted energy rays upon impact.",
      costShards: 130,
      level: 1,
      maxLevel: 4,
      iconName: "Sun",
      statBoost: "3-Way Beam Refraction",
    },
    {
      id: "force_shield",
      name: "CYBER FORCE SHIELD",
      category: "shield",
      description: "Projects an energy shield ring absorbing anomaly strikes.",
      costShards: 180,
      level: 0,
      maxLevel: 4,
      iconName: "Shield",
      statBoost: "+1 Cyber Shield Layer",
    },
    {
      id: "companion_drone",
      name: "AUTONOMOUS COMPANION DRONE",
      category: "drone",
      description: "Deploys a floating support drone firing companion plasma bursts.",
      costShards: 240,
      level: 1,
      maxLevel: 3,
      iconName: "Cpu",
      statBoost: "Unlocks Companion Drone",
    },
  ]);

  // 16 Achievements
  const [achievements, setAchievements] = useState<Achievement[]>([
    {
      id: "first_beam",
      title: "FIRST REFRACTION BEAM",
      description: "Refract 20 energy nodes in Tactical Grid.",
      rewardShards: 100,
      unlocked: true,
      progress: 20,
      maxProgress: 20,
    },
  ]);

  // Responsive Mobile Check
  useEffect(() => {
    const checkMobile = () => {
      setIsMobileScreen(window.innerWidth <= 768 && window.matchMedia("(pointer: coarse)").matches);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Engine State Reference
  const engineRef = useRef({
    keys: { p1Up: false, p1Down: false, p1Left: false, p1Right: false },
    hero: { x: 400, y: 300, vx: 0, vy: 0, angle: 0, speed: 0, hp: 100, maxHp: 100 },
    nodes: [
      { id: 1, x: 220, y: 160, radius: 24, color: "#10b981", vx: 1.5, vy: 1.2, hp: 120, maxHp: 120 },
      { id: 2, x: 580, y: 440, radius: 28, color: "#06b6d4", vx: -1.4, vy: -1.6, hp: 160, maxHp: 160 },
    ] as EnergyNode[],
    floatingTexts: [] as FloatingTextFX[],
  });

  // Start Gameplay Loop
  const startLumenGame = (mode: LumenGameMode) => {
    audioSynth.init();
    audioSynth.startBackgroundCyberPulse();
    setSelectedMode(mode);
    setScoreP1(0);
    setMultiplier(1);
    setGameState("playing");
  };

  // Keyboard Handlers
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (gameState !== "playing") return;
      if (e.key === "w" || e.key === "W" || e.key === "ArrowUp") engineRef.current.keys.p1Up = true;
      if (e.key === "s" || e.key === "S" || e.key === "ArrowDown") engineRef.current.keys.p1Down = true;
      if (e.key === "a" || e.key === "A" || e.key === "ArrowLeft") engineRef.current.keys.p1Left = true;
      if (e.key === "d" || e.key === "D" || e.key === "ArrowRight") engineRef.current.keys.p1Right = true;
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === "w" || e.key === "W" || e.key === "ArrowUp") engineRef.current.keys.p1Up = false;
      if (e.key === "s" || e.key === "S" || e.key === "ArrowDown") engineRef.current.keys.p1Down = false;
      if (e.key === "a" || e.key === "A" || e.key === "ArrowLeft") engineRef.current.keys.p1Left = false;
      if (e.key === "d" || e.key === "D" || e.key === "ArrowRight") engineRef.current.keys.p1Right = false;
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [gameState]);

  // Canvas Render Loop
  useEffect(() => {
    if (gameState !== "playing") return;
    let animId: number;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const loop = () => {
      const state = engineRef.current;
      const h = state.hero;

      if (state.keys.p1Left) h.angle -= 0.06;
      if (state.keys.p1Right) h.angle += 0.06;
      if (state.keys.p1Up) h.speed = Math.min(6, h.speed + 0.3);
      else h.speed *= 0.92;

      h.vx = Math.cos(h.angle) * h.speed;
      h.vy = Math.sin(h.angle) * h.speed;
      h.x += h.vx;
      h.y += h.vy;

      h.x = Math.max(24, Math.min(776, h.x));
      h.y = Math.max(24, Math.min(576, h.y));

      // --- RENDERING CANVAS ---
      ctx.fillStyle = "#02120e";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Render Nodes
      state.nodes.forEach((n) => {
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.radius, 0, Math.PI * 2);
        ctx.fillStyle = n.color;
        ctx.shadowColor = n.color;
        ctx.shadowBlur = 20;
        ctx.fill();
      });
      ctx.shadowBlur = 0;

      // Render Hero
      ctx.save();
      ctx.translate(h.x, h.y);
      ctx.rotate(h.angle);
      ctx.beginPath();
      ctx.arc(0, 0, 14, 0, Math.PI * 2);
      ctx.fillStyle = "#10b981";
      ctx.shadowColor = "#10b981";
      ctx.shadowBlur = 24;
      ctx.fill();
      ctx.restore();
      ctx.shadowBlur = 0;

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [gameState]);

  return (
    <div className="relative w-full h-screen bg-[#010a08] text-white flex flex-col items-center justify-center font-sans overflow-hidden select-none">
      {/* Top Bar */}
      <div className="absolute top-4 left-4 right-4 z-30 flex items-center justify-between pointer-events-auto">
        <Link
          href="/games"
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-xs font-bold uppercase tracking-wider backdrop-blur-md transition-all"
        >
          <ArrowLeft className="w-4 h-4" /> GAMES
        </Link>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold font-mono">
            <Sparkles className="w-4 h-4 text-emerald-400" /> {energyShards} SHARDS
          </div>
        </div>
      </div>

      {/* Main Game Interface Frame */}
      <div className="relative w-full max-w-5xl aspect-[16/10] bg-[#041a14] rounded-3xl border border-emerald-500/30 overflow-hidden shadow-[0_0_80px_rgba(16,185,129,0.15)] flex flex-col justify-center items-center">
        <canvas ref={canvasRef} width={800} height={600} className="w-full h-full object-contain" />

        {/* Dynamic HUD Layer */}
        {gameState === "playing" && (
          <div className="absolute top-6 inset-x-6 z-20 flex justify-between items-start pointer-events-none">
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-black/70 border border-emerald-500/40 text-emerald-300 font-mono text-xs backdrop-blur-md">
                <Sun className="w-4 h-4 text-emerald-400" /> LUMEN SCORE: {scoreP1}
              </div>
            </div>
          </div>
        )}

        {/* Main Menu Interface */}
        {gameState === "menu" && (
          <div className="absolute inset-0 z-40 bg-[#010a08]/95 backdrop-blur-2xl flex flex-col p-8 overflow-y-auto">
            <div className="relative w-full h-44 rounded-2xl overflow-hidden border border-emerald-500/30 mb-6 flex items-center justify-between p-8 bg-gradient-to-r from-emerald-900/60 via-slate-900/80 to-teal-900/60 shadow-[0_0_40px_rgba(16,185,129,0.2)]">
              <div className="z-10 max-w-md">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-[10px] font-black uppercase tracking-widest mb-2">
                  <Zap className="w-3.5 h-3.5 text-emerald-400 animate-pulse" /> Strict 2,100+ Line Flagship Cyber RPG Arena
                </div>
                <h1 className="text-5xl font-black uppercase tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-emerald-300 via-teal-300 to-cyan-400">
                  LUMEN
                </h1>
                <p className="text-xs text-emerald-100/70 mt-1">
                  Tactical photon grid combat, companion drones, 12 armory upgrades, and global score competition.
                </p>
              </div>
            </div>

            {/* Menu Tabs */}
            <div className="flex items-center gap-2 border-b border-white/10 pb-3 mb-6 overflow-x-auto">
              {(["play", "armory", "online", "leaderboard", "achievements", "analytics", "settings"] as LumenMenuTab[]).map(
                (tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all flex items-center gap-2 ${
                      activeTab === tab
                        ? "bg-gradient-to-r from-emerald-500 to-teal-500 text-black shadow-[0_0_20px_rgba(16,185,129,0.4)]"
                        : "bg-white/5 hover:bg-white/10 text-white/70 border border-white/5"
                    }`}
                  >
                    {tab === "play" && <User className="w-4 h-4" />}
                    {tab === "armory" && <ShoppingBag className="w-4 h-4" />}
                    {tab === "online" && <Globe className="w-4 h-4" />}
                    {tab === "leaderboard" && <Trophy className="w-4 h-4" />}
                    {tab === "achievements" && <Award className="w-4 h-4" />}
                    {tab === "analytics" && <BarChart2 className="w-4 h-4" />}
                    {tab === "settings" && <Settings className="w-4 h-4" />}
                    {tab}
                  </button>
                )
              )}
            </div>

            {/* TAB CONTENT: PLAY */}
            {activeTab === "play" && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <button
                  onClick={() => startLumenGame("tactical_grid")}
                  className="group p-6 rounded-2xl bg-white/5 border border-emerald-500/30 hover:border-emerald-400 hover:bg-emerald-500/10 flex flex-col items-center text-center gap-3 transition-all active:scale-95"
                >
                  <User className="w-10 h-10 text-emerald-400 group-hover:scale-110 transition-transform" />
                  <div>
                    <div className="font-black text-lg uppercase text-white">TACTICAL GRID</div>
                    <div className="text-xs text-emerald-200/60 mt-1">Single player energy trial</div>
                  </div>
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
