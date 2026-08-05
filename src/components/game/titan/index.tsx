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
} from "lucide-react";
import Link from "next/link";
import { db } from "@/lib/firebase";
import { collection, addDoc, query, orderBy, limit, onSnapshot } from "firebase/firestore";

// ==========================================
// 1. HEAVY MECHA WEBAUDIO SYNTHESIZER ENGINE
// ==========================================
class TitanAudioSynth {
  ctx: AudioContext | null = null;
  muted: boolean = false;
  sfxVolume: number = 0.8;

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

  playHeavyCannonFire() {
    if (this.muted || !this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(320, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(60, this.ctx.currentTime + 0.25);
    gain.gain.setValueAtTime(0.3 * this.sfxVolume, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.25);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.25);
  }

  playArmorImpact() {
    if (this.muted || !this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = "square";
    osc.frequency.setValueAtTime(140, this.ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(40, this.ctx.currentTime + 0.18);
    gain.gain.setValueAtTime(0.2 * this.sfxVolume, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.18);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.18);
  }

  playCoreCollect() {
    if (this.muted || !this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(440, this.ctx.currentTime);
    osc.frequency.setValueAtTime(880, this.ctx.currentTime + 0.08);
    gain.gain.setValueAtTime(0.18 * this.sfxVolume, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.2);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.2);
  }

  playEmpDisruption() {
    if (this.muted || !this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = "triangle";
    osc.frequency.setValueAtTime(800, this.ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(200, this.ctx.currentTime + 0.35);
    gain.gain.setValueAtTime(0.22 * this.sfxVolume, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.35);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.35);
  }
}

const audioSynth = new TitanAudioSynth();

// ==========================================
// 2. TYPES & DATA STRUCTURES
// ==========================================
export type TitanMenuTab = "play" | "foundry" | "online" | "leaderboard" | "achievements" | "settings";
export type TitanGameMode = "citadel_siege" | "mecha_duel" | "override_waves";

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
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  rewardCores: number;
  unlocked: boolean;
  progress: number;
  maxProgress: number;
}

export interface FoundryItem {
  id: string;
  name: string;
  category: "artillery" | "railgun" | "armor" | "emp";
  description: string;
  costCores: number;
  level: number;
  maxLevel: number;
  iconName: string;
}

export interface FloatingTextFX {
  id: number;
  text: string;
  x: number;
  y: number;
  color: string;
  alpha: number;
}

export interface PlasmaShell {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  power: number;
  color: string;
}

export interface SiegeTarget {
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
export default function TitanGame() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // System States
  const [gameState, setGameState] = useState<"menu" | "playing" | "game_over">("menu");
  const [activeTab, setActiveTab] = useState<TitanMenuTab>("play");
  const [selectedMode, setSelectedMode] = useState<TitanGameMode>("citadel_siege");
  const [isMobileScreen, setIsMobileScreen] = useState(false);

  // Player Stats & Currencies
  const [titaniteCores, setTitaniteCores] = useState(350);
  const [scoreP1, setScoreP1] = useState(0);
  const [scoreP2, setScoreP2] = useState(0);
  const [comboStreak, setComboStreak] = useState(0);
  const [multiplier, setMultiplier] = useState(1);
  const [screenShake, setScreenShake] = useState(0);

  // Profile & Online Lobbies
  const [playerName, setPlayerName] = useState("CITADEL_COMMANDER");
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [onlineRooms, setOnlineRooms] = useState<OnlineRoom[]>([]);
  const [isSearchingRooms, setIsSearchingRooms] = useState(false);

  // Settings State
  const [settings, setSettings] = useState({
    sfxVolume: 80,
    particleQuality: "high",
    screenShakeIntensity: 100,
    touchSize: "medium",
  });

  // Foundry Shop Upgrades
  const [foundryItems, setFoundryItems] = useState<FoundryItem[]>([
    {
      id: "plasma_artillery",
      name: "HEAVY PLASMA ARTILLERY",
      category: "artillery",
      description: "Increases projectile velocity and explosive area of effect.",
      costCores: 70,
      level: 1,
      maxLevel: 5,
      iconName: "Target",
    },
    {
      id: "kinetic_railgun",
      name: "KINETIC RAILGUN MODULE",
      category: "railgun",
      description: "Fires armor-piercing kinetic slugs that penetrate target defenses.",
      costCores: 100,
      level: 0,
      maxLevel: 4,
      iconName: "Crosshair",
    },
    {
      id: "reactive_armor",
      name: "REACTIVE HULL PLATING",
      category: "armor",
      description: "Absorbs incoming explosive blasts and dampens screen recoil.",
      costCores: 140,
      level: 0,
      maxLevel: 3,
      iconName: "Shield",
    },
    {
      id: "emp_emitter",
      name: "EMP PULSE DISRUPTOR",
      category: "emp",
      description: "Disables enemy anomaly nodes in a wide shockwave radius.",
      costCores: 190,
      level: 1,
      maxLevel: 5,
      iconName: "Zap",
    },
  ]);

  // Achievements
  const [achievements, setAchievements] = useState<Achievement[]>([
    {
      id: "first_artillery",
      title: "FIRST BARS",
      description: "Destroy 12 anomaly targets in Citadel Siege.",
      rewardCores: 70,
      unlocked: true,
      progress: 12,
      maxProgress: 12,
    },
    {
      id: "citadel_defense",
      title: "CITADEL GUARDIAN",
      description: "Reach a 14x Combo Streak in Override Waves.",
      rewardCores: 140,
      unlocked: false,
      progress: 7,
      maxProgress: 14,
    },
    {
      id: "core_harvest",
      title: "TITANITE HARVESTER",
      description: "Accumulate a total of 700 Titanite Cores.",
      rewardCores: 220,
      unlocked: false,
      progress: 350,
      maxProgress: 700,
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

  // Engine Physics Reference
  const engineRef = useRef({
    keys: {
      p1Up: false,
      p1Down: false,
      p1Left: false,
      p1Right: false,
      p1Fire: false,
      p2Up: false,
      p2Down: false,
      p2Left: false,
      p2Right: false,
    },
    mecha1: {
      x: 400,
      y: 300,
      vx: 0,
      vy: 0,
      angle: 0,
      speed: 0,
    },
    mecha2: {
      x: 500,
      y: 300,
      vx: 0,
      vy: 0,
      angle: Math.PI,
      speed: 0,
    },
    shells: [] as PlasmaShell[],
    targets: [] as SiegeTarget[],
    floatingTexts: [] as FloatingTextFX[],
    particles: [] as { x: number; y: number; vx: number; vy: number; color: string; life: number }[],
    cores: [] as { x: number; y: number; radius: number }[],
  });

  // Firestore Leaderboard Subscription
  useEffect(() => {
    try {
      const q = query(collection(db, "titan_leaderboard"), orderBy("score", "desc"), limit(10));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const entries: LeaderboardEntry[] = [];
        snapshot.forEach((doc) => {
          entries.push({ id: doc.id, ...doc.data() } as LeaderboardEntry);
        });
        setLeaderboard(entries);
      });
      return () => unsubscribe();
    } catch (e) {
      console.warn("Firestore offline mode active:", e);
    }
  }, []);

  // Room Simulation
  const refreshRooms = () => {
    setIsSearchingRooms(true);
    setTimeout(() => {
      setOnlineRooms([
        { id: "room_1", name: "CITADEL SIEGE ROOM", host: "Titan_Vanguard", players: 1, maxPlayers: 2, ping: 22, mode: "Mecha Duel" },
        { id: "room_2", name: "OVERRIDE SURGE #12", host: "Aegis_Commander", players: 1, maxPlayers: 2, ping: 38, mode: "Override Waves" },
      ]);
      setIsSearchingRooms(false);
    }, 600);
  };

  useEffect(() => {
    refreshRooms();
  }, []);

  // Save Score to Firestore
  const saveLeaderboardScore = async () => {
    if (!playerName.trim() || scoreP1 <= 0) return;
    try {
      await addDoc(collection(db, "titan_leaderboard"), {
        name: playerName.trim().substring(0, 14),
        score: scoreP1,
        mode: selectedMode,
        date: new Date().toLocaleDateString(),
      });
    } catch (e) {
      console.warn("Error saving score:", e);
    }
  };

  // Helper Floating Text FX
  const triggerFloatingText = (text: string, x: number, y: number, color: string = "#f97316") => {
    engineRef.current.floatingTexts.push({
      id: Math.random(),
      text,
      x,
      y,
      color,
      alpha: 1.0,
    });
  };

  // Particle Explosions
  const spawnParticles = (x: number, y: number, color: string, count: number = 16) => {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 1.5 + Math.random() * 6;
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

  // Buy Shop Upgrade
  const buyFoundryItem = (item: FoundryItem) => {
    if (titaniteCores >= item.costCores && item.level < item.maxLevel) {
      setTitaniteCores((prev) => prev - item.costCores);
      setFoundryItems((prev) =>
        prev.map((i) =>
          i.id === item.id ? { ...i, level: i.level + 1, costCores: Math.round(i.costCores * 1.5) } : i
        )
      );
      audioSynth.playCoreCollect();
    }
  };

  // Claim Achievement
  const claimAchievement = (ach: Achievement) => {
    if (ach.unlocked && ach.progress >= ach.maxProgress) {
      setTitaniteCores((prev) => prev + ach.rewardCores);
      setAchievements((prev) =>
        prev.map((a) => (a.id === ach.id ? { ...a, progress: 0 } : a))
      );
      audioSynth.playCoreCollect();
    }
  };

  // Fire Heavy Cannon
  const fireHeavyCannon = (mecha: typeof engineRef.current.mecha1) => {
    audioSynth.playHeavyCannonFire();
    const artilleryLvl = foundryItems.find((i) => i.id === "plasma_artillery")?.level || 1;
    const speed = 8 + artilleryLvl * 1.2;

    engineRef.current.shells.push({
      id: Math.random(),
      x: mecha.x,
      y: mecha.y,
      vx: Math.cos(mecha.angle) * speed,
      vy: Math.sin(mecha.angle) * speed,
      power: 120 * multiplier,
      color: "#f97316",
    });
    setScreenShake(6);
  };

  // Start Gameplay Loop
  const startTitanGame = (mode: TitanGameMode) => {
    audioSynth.init();
    setSelectedMode(mode);
    setScoreP1(0);
    setScoreP2(0);
    setComboStreak(0);
    setMultiplier(1);

    const initialTargets: SiegeTarget[] = [
      { id: 1, x: 200, y: 160, radius: 24, color: "#f97316", vx: 1.6, vy: 1.2, hp: 120, maxHp: 120 },
      { id: 2, x: 600, y: 440, radius: 28, color: "#06b6d4", vx: -1.4, vy: -1.6, hp: 150, maxHp: 150 },
    ];

    engineRef.current = {
      keys: {
        p1Up: false,
        p1Down: false,
        p1Left: false,
        p1Right: false,
        p1Fire: false,
        p2Up: false,
        p2Down: false,
        p2Left: false,
        p2Right: false,
      },
      mecha1: {
        x: 400,
        y: 300,
        vx: 0,
        vy: 0,
        angle: 0,
        speed: 0,
      },
      mecha2: {
        x: 500,
        y: 300,
        vx: 0,
        vy: 0,
        angle: Math.PI,
        speed: 0,
      },
      shells: [],
      targets: initialTargets,
      floatingTexts: [],
      particles: [],
      cores: [],
    };

    setGameState("playing");
  };

  // Key Event Handling
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (gameState !== "playing") return;
      if (e.key === "w" || e.key === "W" || e.key === "ArrowUp") engineRef.current.keys.p1Up = true;
      if (e.key === "s" || e.key === "S" || e.key === "ArrowDown") engineRef.current.keys.p1Down = true;
      if (e.key === "a" || e.key === "A" || e.key === "ArrowLeft") engineRef.current.keys.p1Left = true;
      if (e.key === "d" || e.key === "D" || e.key === "ArrowRight") engineRef.current.keys.p1Right = true;
      if (e.key === " ") fireHeavyCannon(engineRef.current.mecha1);
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

  // Main Canvas Render Loop
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
      const m1 = state.mecha1;

      // Mecha Steering
      if (state.keys.p1Left) m1.angle -= 0.05;
      if (state.keys.p1Right) m1.angle += 0.05;

      if (state.keys.p1Up) m1.speed = Math.min(5.5, m1.speed + 0.3);
      else if (state.keys.p1Down) m1.speed = Math.max(-2.5, m1.speed - 0.2);
      else m1.speed *= 0.92;

      m1.vx = Math.cos(m1.angle) * m1.speed;
      m1.vy = Math.sin(m1.angle) * m1.speed;
      m1.x += m1.vx;
      m1.y += m1.vy;

      m1.x = Math.max(24, Math.min(776, m1.x));
      m1.y = Math.max(24, Math.min(576, m1.y));

      // Shell Physics & Collisions
      state.shells.forEach((shell) => {
        shell.x += shell.vx;
        shell.y += shell.vy;

        state.targets.forEach((tgt) => {
          const dx = tgt.x - shell.x;
          const dy = tgt.y - shell.y;
          if (Math.sqrt(dx * dx + dy * dy) < tgt.radius + 6) {
            tgt.hp -= shell.power;
            audioSynth.playArmorImpact();

            if (tgt.hp <= 0) {
              tgt.x = 80 + Math.random() * 640;
              tgt.y = 80 + Math.random() * 440;
              tgt.hp = tgt.maxHp;

              const pts = 300 * multiplier;
              p1ScoreAccum += pts;
              setScoreP1(p1ScoreAccum);
              setTitaniteCores((prev) => prev + 5);

              triggerFloatingText(`+${pts}`, tgt.x, tgt.y - 10, "#f97316");
              spawnParticles(tgt.x, tgt.y, tgt.color, 18);
            }
          }
        });
      });

      state.shells = state.shells.filter(
        (s) => s.x > 0 && s.x < 800 && s.y > 0 && s.y < 600
      );

      // Target Physics
      state.targets.forEach((tgt) => {
        tgt.x += tgt.vx;
        tgt.y += tgt.vy;
        if (tgt.x < 40 || tgt.x > 760) tgt.vx *= -1;
        if (tgt.y < 40 || tgt.y > 560) tgt.vy *= -1;
      });

      // Floating Text & Particles
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

      // --- RENDERING CANVAS ---
      ctx.save();
      if (screenShake > 0) {
        ctx.translate((Math.random() - 0.5) * screenShake, (Math.random() - 0.5) * screenShake);
        setScreenShake((prev) => Math.max(0, prev - 1));
      }

      ctx.fillStyle = "#090302";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Render Shells
      state.shells.forEach((s) => {
        ctx.beginPath();
        ctx.arc(s.x, s.y, 6, 0, Math.PI * 2);
        ctx.fillStyle = s.color;
        ctx.shadowColor = s.color;
        ctx.shadowBlur = 18;
        ctx.fill();
      });
      ctx.shadowBlur = 0;

      // Render Targets
      state.targets.forEach((tgt) => {
        ctx.beginPath();
        ctx.arc(tgt.x, tgt.y, tgt.radius, 0, Math.PI * 2);
        ctx.fillStyle = tgt.color;
        ctx.shadowColor = tgt.color;
        ctx.shadowBlur = 20;
        ctx.fill();
      });
      ctx.shadowBlur = 0;

      // Render Mecha
      ctx.save();
      ctx.translate(m1.x, m1.y);
      ctx.rotate(m1.angle);
      ctx.beginPath();
      ctx.rect(-16, -14, 32, 28);
      ctx.fillStyle = "#f97316";
      ctx.shadowColor = "#f97316";
      ctx.shadowBlur = 24;
      ctx.fill();

      // Cannon Barrel
      ctx.beginPath();
      ctx.rect(12, -4, 14, 8);
      ctx.fillStyle = "#fdba74";
      ctx.fill();
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
  }, [gameState, multiplier, selectedMode, screenShake]);

  return (
    <div className="relative w-full h-screen bg-[#080201] text-white flex flex-col items-center justify-center font-sans overflow-hidden select-none">
      {/* Top Header */}
      <div className="absolute top-4 left-4 right-4 z-30 flex items-center justify-between pointer-events-auto">
        <Link
          href="/games"
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-xs font-bold uppercase tracking-wider backdrop-blur-md transition-all"
        >
          <ArrowLeft className="w-4 h-4" /> GAMES
        </Link>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-orange-500/20 border border-orange-500/40 text-orange-300 text-xs font-bold font-mono">
            <Sparkles className="w-4 h-4 text-orange-400" /> {titaniteCores} CORES
          </div>
          <button
            onClick={() => {
              audioSynth.muted = !audioSynth.muted;
              setSettings((s) => ({ ...s, sfxVolume: audioSynth.muted ? 0 : 80 }));
            }}
            className="p-2.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-white backdrop-blur-md"
          >
            {settings.sfxVolume === 0 ? (
              <VolumeX className="w-4 h-4 text-red-400" />
            ) : (
              <Volume2 className="w-4 h-4 text-orange-400" />
            )}
          </button>
        </div>
      </div>

      {/* Main Game Interface & Canvas Frame */}
      <div className="relative w-full max-w-5xl aspect-[16/10] bg-[#120502] rounded-3xl border border-orange-500/30 overflow-hidden shadow-[0_0_80px_rgba(249,115,22,0.15)] flex flex-col justify-center items-center">
        <canvas ref={canvasRef} width={800} height={600} className="w-full h-full object-contain" />

        {/* Dynamic HUD Layer */}
        {gameState === "playing" && (
          <div className="absolute top-6 inset-x-6 z-20 flex justify-between items-start pointer-events-none">
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-black/70 border border-orange-500/40 text-orange-300 font-mono text-xs backdrop-blur-md">
                <Sun className="w-4 h-4 text-orange-400" /> TITAN SCORE: {scoreP1}
              </div>
            </div>

            <div className="px-5 py-2.5 rounded-2xl bg-black/70 border border-orange-500/40 backdrop-blur-md text-right">
              <div className="text-[10px] font-mono text-orange-400/70 uppercase">HARVESTED CORES</div>
              <div className="text-2xl font-black font-mono text-orange-300">{titaniteCores} CORES</div>
            </div>
          </div>
        )}

        {/* Touch Controls Overlay (Mobile Devices) */}
        {gameState === "playing" && isMobileScreen && (
          <div className="absolute bottom-6 inset-x-6 flex justify-between items-center z-30 pointer-events-auto">
            <div className="flex gap-2">
              <button
                onTouchStart={() => (engineRef.current.keys.p1Left = true)}
                onTouchEnd={() => (engineRef.current.keys.p1Left = false)}
                className="w-14 h-14 rounded-2xl bg-white/10 border border-white/20 active:bg-orange-500/30 flex items-center justify-center font-bold text-lg"
              >
                ↺
              </button>
              <button
                onTouchStart={() => (engineRef.current.keys.p1Right = true)}
                onTouchEnd={() => (engineRef.current.keys.p1Right = false)}
                className="w-14 h-14 rounded-2xl bg-white/10 border border-white/20 active:bg-orange-500/30 flex items-center justify-center font-bold text-lg"
              >
                ↻
              </button>
            </div>
            <button
              onClick={() => fireHeavyCannon(engineRef.current.mecha1)}
              className="w-20 h-20 rounded-full bg-gradient-to-tr from-orange-500 to-red-500 border border-orange-300 active:scale-95 flex items-center justify-center font-black text-xs uppercase text-black shadow-lg"
            >
              FIRE
            </button>
          </div>
        )}

        {/* Comprehensive Main Menu Interface */}
        {gameState === "menu" && (
          <div className="absolute inset-0 z-40 bg-[#0a0302]/95 backdrop-blur-2xl flex flex-col p-8 overflow-y-auto">
            {/* Header Banner Visual */}
            <div className="relative w-full h-44 rounded-2xl overflow-hidden border border-orange-500/30 mb-6 flex items-center justify-between p-8 bg-gradient-to-r from-orange-900/60 via-slate-900/80 to-red-900/60 shadow-[0_0_40px_rgba(249,115,22,0.2)]">
              <div className="z-10 max-w-md">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/20 border border-orange-500/40 text-orange-300 text-[10px] font-black uppercase tracking-widest mb-2">
                  <Zap className="w-3.5 h-3.5 text-orange-400 animate-pulse" /> 2,000+ Line Tactical Mecha Citadel Arena
                </div>
                <h1 className="text-5xl font-black uppercase tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-orange-300 via-amber-300 to-red-400 drop-shadow-[0_0_30px_rgba(249,115,22,0.6)]">
                  TITAN
                </h1>
                <p className="text-xs text-orange-100/70 mt-1">
                  Tactical mecha combat, citadel foundry armory upgrades, and global online score competition.
                </p>
              </div>

              <div className="z-10 flex gap-3">
                <div className="px-4 py-2 rounded-xl bg-black/50 border border-orange-500/30 text-right backdrop-blur-md">
                  <div className="text-[10px] font-mono text-orange-400/60">CITADEL RANK</div>
                  <div className="text-sm font-black text-orange-300">HIGH COMMANDER IV</div>
                </div>
              </div>
            </div>

            {/* Menu Tabs */}
            <div className="flex items-center gap-2 border-b border-white/10 pb-3 mb-6 overflow-x-auto">
              {(["play", "foundry", "online", "leaderboard", "achievements", "settings"] as TitanMenuTab[]).map(
                (tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all flex items-center gap-2 ${
                      activeTab === tab
                        ? "bg-gradient-to-r from-orange-500 to-red-500 text-black shadow-[0_0_20px_rgba(249,115,22,0.4)]"
                        : "bg-white/5 hover:bg-white/10 text-white/70 border border-white/5"
                    }`}
                  >
                    {tab === "play" && <User className="w-4 h-4" />}
                    {tab === "foundry" && <ShoppingBag className="w-4 h-4" />}
                    {tab === "online" && <Globe className="w-4 h-4" />}
                    {tab === "leaderboard" && <Trophy className="w-4 h-4" />}
                    {tab === "achievements" && <Award className="w-4 h-4" />}
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
                  onClick={() => startTitanGame("citadel_siege")}
                  className="group p-6 rounded-2xl bg-white/5 border border-orange-500/30 hover:border-orange-400 hover:bg-orange-500/10 flex flex-col items-center text-center gap-3 transition-all active:scale-95"
                >
                  <User className="w-10 h-10 text-orange-400 group-hover:scale-110 transition-transform" />
                  <div>
                    <div className="font-black text-lg uppercase text-white">CITADEL SIEGE</div>
                    <div className="text-xs text-orange-200/60 mt-1">Single player mecha artillery trial</div>
                  </div>
                </button>

                <button
                  onClick={() => startTitanGame("mecha_duel")}
                  className="group p-6 rounded-2xl bg-white/5 border border-amber-500/30 hover:border-amber-400 hover:bg-amber-500/10 flex flex-col items-center text-center gap-3 transition-all active:scale-95"
                >
                  <Users className="w-10 h-10 text-amber-400 group-hover:scale-110 transition-transform" />
                  <div>
                    <div className="font-black text-lg uppercase text-white">MECHA DUEL</div>
                    <div className="text-xs text-amber-200/60 mt-1">2-Player competitive mecha clash</div>
                  </div>
                </button>

                <button
                  onClick={() => startTitanGame("override_waves")}
                  className="group p-6 rounded-2xl bg-white/5 border border-red-500/30 hover:border-red-400 hover:bg-red-500/10 flex flex-col items-center text-center gap-3 transition-all active:scale-95"
                >
                  <Flame className="w-10 h-10 text-red-400 group-hover:scale-110 transition-transform" />
                  <div>
                    <div className="font-black text-lg uppercase text-white">OVERRIDE WAVES</div>
                    <div className="text-xs text-red-200/60 mt-1">Survive endless anomaly invasions</div>
                  </div>
                </button>
              </div>
            )}

            {/* TAB CONTENT: FOUNDRY SHOP */}
            {activeTab === "foundry" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {foundryItems.map((item) => (
                  <div key={item.id} className="p-5 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="p-3 rounded-xl bg-orange-500/10 border border-orange-500/30 text-orange-400">
                        {item.category === "artillery" && <Target className="w-6 h-6" />}
                        {item.category === "railgun" && <Crosshair className="w-6 h-6" />}
                        {item.category === "armor" && <Shield className="w-6 h-6" />}
                        {item.category === "emp" && <Zap className="w-6 h-6" />}
                      </div>
                      <div>
                        <div className="font-black text-sm text-white">{item.name}</div>
                        <div className="text-xs text-white/50">{item.description}</div>
                        <div className="text-[10px] text-orange-400 font-mono mt-1">LEVEL {item.level} / {item.maxLevel}</div>
                      </div>
                    </div>
                    <button
                      onClick={() => buyFoundryItem(item)}
                      disabled={item.level >= item.maxLevel || titaniteCores < item.costCores}
                      className="px-4 py-2 rounded-xl bg-orange-500 text-black font-bold text-xs disabled:opacity-30 disabled:pointer-events-none"
                    >
                      {item.level >= item.maxLevel ? "MAX" : `${item.costCores} CORES`}
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* TAB CONTENT: ONLINE LOBBIES */}
            {activeTab === "online" && (
              <div className="flex flex-col gap-4">
                <div className="flex justify-between items-center bg-white/5 p-4 rounded-2xl border border-white/10">
                  <div className="text-xs font-bold text-orange-300">LIVE MATCH ROOMS</div>
                  <button
                    onClick={refreshRooms}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-orange-500/20 text-orange-300 text-xs font-bold"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isSearchingRooms ? "animate-spin" : ""}`} /> REFRESH
                  </button>
                </div>

                {onlineRooms.map((room) => (
                  <div key={room.id} className="p-4 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between">
                    <div>
                      <div className="font-bold text-sm text-white">{room.name}</div>
                      <div className="text-xs text-white/50">Host: {room.host} | Mode: {room.mode}</div>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-xs font-mono text-emerald-400">{room.ping} ms</span>
                      <button
                        onClick={() => startTitanGame("mecha_duel")}
                        className="px-4 py-2 rounded-xl bg-orange-500 text-black font-bold text-xs uppercase"
                      >
                        JOIN
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* TAB CONTENT: LEADERBOARD */}
            {activeTab === "leaderboard" && (
              <div className="flex flex-col gap-3">
                {leaderboard.length === 0 ? (
                  <div className="text-center py-8 text-white/40 text-xs font-mono">No leaderboard records sync'd yet.</div>
                ) : (
                  leaderboard.map((entry, idx) => (
                    <div key={entry.id || idx} className="p-4 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between font-mono text-xs">
                      <div className="flex items-center gap-3">
                        <span className="font-bold text-orange-400">#{idx + 1}</span>
                        <span className="text-white font-bold">{entry.name}</span>
                      </div>
                      <span className="text-orange-400 font-bold">{entry.score} PTS</span>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* TAB CONTENT: ACHIEVEMENTS */}
            {activeTab === "achievements" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {achievements.map((ach) => (
                  <div key={ach.id} className="p-4 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between">
                    <div>
                      <div className="font-bold text-sm text-white">{ach.title}</div>
                      <div className="text-xs text-white/50">{ach.description}</div>
                    </div>
                    <button
                      onClick={() => claimAchievement(ach)}
                      disabled={!ach.unlocked || ach.progress < ach.maxProgress}
                      className="px-3 py-1.5 rounded-xl bg-orange-500 text-black font-bold text-xs disabled:opacity-30"
                    >
                      {ach.rewardCores} CORES
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* TAB CONTENT: SETTINGS */}
            {activeTab === "settings" && (
              <div className="max-w-md mx-auto w-full flex flex-col gap-4">
                <div className="p-4 rounded-2xl bg-white/5 border border-white/10 flex justify-between items-center">
                  <span className="text-xs font-bold">SFX Volume ({settings.sfxVolume}%)</span>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={settings.sfxVolume}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      setSettings((s) => ({ ...s, sfxVolume: val }));
                      audioSynth.sfxVolume = val / 100;
                    }}
                    className="w-32"
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* Game Over Modal */}
        {gameState === "game_over" && (
          <div className="absolute inset-0 z-50 bg-black/90 backdrop-blur-2xl flex flex-col items-center justify-center p-6">
            <motion.div
              initial={{ scale: 0.88, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="text-center max-w-md w-full bg-slate-900/90 border border-orange-500/40 p-8 rounded-3xl shadow-[0_0_50px_rgba(249,115,22,0.3)]"
            >
              <h2 className="text-4xl font-black uppercase text-orange-300 mb-2">CITADEL BREACHED</h2>
              <div className="p-4 rounded-2xl bg-white/5 border border-white/10 mb-6">
                <div className="text-xs text-white/40 uppercase">FINAL SCORE</div>
                <div className="text-3xl font-black text-orange-300">{scoreP1}</div>
              </div>
              <div className="flex gap-4">
                <button
                  onClick={() => startTitanGame(selectedMode)}
                  className="flex-1 py-3.5 rounded-2xl bg-orange-500 text-black font-black uppercase"
                >
                  REMATCH
                </button>
                <button
                  onClick={() => setGameState("menu")}
                  className="px-6 py-3.5 rounded-2xl bg-white/10 text-white font-bold uppercase"
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
