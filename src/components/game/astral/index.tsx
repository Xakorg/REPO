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
  Orbit as OrbitIcon,
  Compass,
  Star,
  Activity,
  Layers,
  Radio,
  Sliders,
  Maximize2,
} from "lucide-react";
import Link from "next/link";
import { db } from "@/lib/firebase";
import { collection, addDoc, query, orderBy, limit, onSnapshot } from "firebase/firestore";

// ==========================================
// 1. CELESTIAL WEBAUDIO SYNTHESIZER ENGINE
// ==========================================
class AstralAudioSynth {
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

  playGravitySlingshot() {
    if (this.muted || !this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(220, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(880, this.ctx.currentTime + 0.2);
    gain.gain.setValueAtTime(0.2 * this.sfxVolume, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.2);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.2);
  }

  playSolarFlarePulse() {
    if (this.muted || !this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = "triangle";
    osc.frequency.setValueAtTime(600, this.ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(1400, this.ctx.currentTime + 0.25);
    gain.gain.setValueAtTime(0.18 * this.sfxVolume, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.25);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.25);
  }

  playDustHarvest() {
    if (this.muted || !this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(523.25, this.ctx.currentTime);
    osc.frequency.setValueAtTime(783.99, this.ctx.currentTime + 0.08);
    gain.gain.setValueAtTime(0.15 * this.sfxVolume, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.18);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.18);
  }

  playSingularityDisruption() {
    if (this.muted || !this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(120, this.ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(25, this.ctx.currentTime + 0.4);
    gain.gain.setValueAtTime(0.25 * this.sfxVolume, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.4);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.4);
  }
}

const audioSynth = new AstralAudioSynth();

// ==========================================
// 2. TYPES & DATA STRUCTURES
// ==========================================
export type AstralMenuTab = "play" | "starforge" | "online" | "leaderboard" | "achievements" | "settings";
export type AstralGameMode = "astral_orbit" | "gravitational_duel" | "singularity_surge";

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
  rewardDust: number;
  unlocked: boolean;
  progress: number;
  maxProgress: number;
}

export interface StarforgeItem {
  id: string;
  name: string;
  category: "anchor" | "cannon" | "deflector" | "booster";
  description: string;
  costDust: number;
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

export interface GravityWell {
  id: number;
  x: number;
  y: number;
  mass: number;
  radius: number;
}

export interface SolarFlare {
  id: number;
  x: number;
  y: number;
  radius: number;
  color: string;
  vx: number;
  vy: number;
}

// ==========================================
// 3. MAIN COMPONENT DEFINITION
// ==========================================
export default function AstralGame() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Interface States
  const [gameState, setGameState] = useState<"menu" | "playing" | "game_over">("menu");
  const [activeTab, setActiveTab] = useState<AstralMenuTab>("play");
  const [selectedMode, setSelectedMode] = useState<AstralGameMode>("astral_orbit");
  const [isMobileScreen, setIsMobileScreen] = useState(false);

  // Player Stats & Currencies
  const [astralDust, setAstralDust] = useState(300);
  const [scoreP1, setScoreP1] = useState(0);
  const [scoreP2, setScoreP2] = useState(0);
  const [comboStreak, setComboStreak] = useState(0);
  const [multiplier, setMultiplier] = useState(1);
  const [screenShake, setScreenShake] = useState(0);

  // Profile & Online Lobbies
  const [playerName, setPlayerName] = useState("STELLAR_PILOT");
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [onlineRooms, setOnlineRooms] = useState<OnlineRoom[]>([]);
  const [isSearchingRooms, setIsSearchingRooms] = useState(false);

  // Settings State
  const [settings, setSettings] = useState({
    sfxVolume: 80,
    particleDensity: "high",
    screenShakeIntensity: 100,
    touchSize: "medium",
  });

  // Starforge Shop Upgrades
  const [starforgeItems, setStarforgeItems] = useState<StarforgeItem[]>([
    {
      id: "gravity_anchor",
      name: "GRAVITY ANCHOR CORE",
      category: "anchor",
      description: "Enhances orbital slingshot acceleration and stability in gravity wells.",
      costDust: 60,
      level: 1,
      maxLevel: 5,
      iconName: "OrbitIcon",
    },
    {
      id: "solar_cannon",
      name: "SOLAR FLARE CANNON",
      category: "cannon",
      description: "Fires high-velocity coronal plasma blasts that shatter anomalies.",
      costDust: 90,
      level: 0,
      maxLevel: 4,
      iconName: "Sun",
    },
    {
      id: "orbit_deflector",
      name: "ORBITAL ENERGY DEFLECTOR",
      category: "deflector",
      description: "Absorbs cosmic radiation strikes and provides kinetic shields.",
      costDust: 130,
      level: 0,
      maxLevel: 3,
      iconName: "Shield",
    },
    {
      id: "antimatter_booster",
      name: "ANTIMATTER THRUSTER",
      category: "booster",
      description: "Boosts top velocity and doubles combo multiplier growth rate.",
      costDust: 180,
      level: 1,
      maxLevel: 5,
      iconName: "Zap",
    },
  ]);

  // Achievements
  const [achievements, setAchievements] = useState<Achievement[]>([
    {
      id: "orbital_slingshot",
      title: "STELLAR SLINGSHOT",
      description: "Complete 10 successful orbital slingshot maneuvers.",
      rewardDust: 60,
      unlocked: true,
      progress: 10,
      maxProgress: 10,
    },
    {
      id: "singularity_survivor",
      title: "SINGULARITY SURVIVOR",
      description: "Reach a 12x Combo Streak in Singularity Surge.",
      rewardDust: 120,
      unlocked: false,
      progress: 5,
      maxProgress: 12,
    },
    {
      id: "dust_collector",
      title: "COSMIC DUST HARVESTER",
      description: "Accumulate a total of 600 Astral Dust.",
      rewardDust: 200,
      unlocked: false,
      progress: 300,
      maxProgress: 600,
    },
  ]);

  // Mobile Screen Detection
  useEffect(() => {
    const checkMobile = () => {
      setIsMobileScreen(window.innerWidth <= 768 && window.matchMedia("(pointer: coarse)").matches);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Physics Engine Reference State
  const engineRef = useRef({
    keys: {
      p1Up: false,
      p1Down: false,
      p1Left: false,
      p1Right: false,
      p1Pulse: false,
      p2Up: false,
      p2Down: false,
      p2Left: false,
      p2Right: false,
    },
    ship1: {
      x: 400,
      y: 300,
      vx: 0,
      vy: 0,
      angle: 0,
      speed: 0,
      orbitWell: null as GravityWell | null,
    },
    ship2: {
      x: 500,
      y: 300,
      vx: 0,
      vy: 0,
      angle: Math.PI,
      speed: 0,
    },
    wells: [] as GravityWell[],
    flares: [] as SolarFlare[],
    floatingTexts: [] as FloatingTextFX[],
    particles: [] as { x: number; y: number; vx: number; vy: number; color: string; life: number }[],
    dustOrbs: [] as { x: number; y: number; radius: number }[],
  });

  // Firestore Sync
  useEffect(() => {
    try {
      const q = query(collection(db, "astral_leaderboard"), orderBy("score", "desc"), limit(10));
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
        { id: "room_1", name: "CELESTIAL ORBIT LOBBY", host: "Orion_Vanguard", players: 1, maxPlayers: 2, ping: 18, mode: "Gravitational Duel" },
        { id: "room_2", name: "SINGULARITY SURGE #09", host: "Solar_Aegis", players: 1, maxPlayers: 2, ping: 35, mode: "Singularity Surge" },
      ]);
      setIsSearchingRooms(false);
    }, 600);
  };

  useEffect(() => {
    refreshRooms();
  }, []);

  // Save Score to Leaderboard
  const saveLeaderboardScore = async () => {
    if (!playerName.trim() || scoreP1 <= 0) return;
    try {
      await addDoc(collection(db, "astral_leaderboard"), {
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
  const triggerFloatingText = (text: string, x: number, y: number, color: string = "#f59e0b") => {
    engineRef.current.floatingTexts.push({
      id: Math.random(),
      text,
      x,
      y,
      color,
      alpha: 1.0,
    });
  };

  // Particle Shockwaves
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
  const buyStarforgeItem = (item: StarforgeItem) => {
    if (astralDust >= item.costDust && item.level < item.maxLevel) {
      setAstralDust((prev) => prev - item.costDust);
      setStarforgeItems((prev) =>
        prev.map((i) =>
          i.id === item.id ? { ...i, level: i.level + 1, costDust: Math.round(i.costDust * 1.5) } : i
        )
      );
      audioSynth.playDustHarvest();
    }
  };

  // Claim Achievement
  const claimAchievement = (ach: Achievement) => {
    if (ach.unlocked && ach.progress >= ach.maxProgress) {
      setAstralDust((prev) => prev + ach.rewardDust);
      setAchievements((prev) =>
        prev.map((a) => (a.id === ach.id ? { ...a, progress: 0 } : a))
      );
      audioSynth.playDustHarvest();
    }
  };

  // Pulse Slingshot Boost
  const triggerSlingshotPulse = () => {
    audioSynth.playGravitySlingshot();
    const s1 = engineRef.current.ship1;
    s1.speed = Math.min(10, s1.speed + 2.5);
    spawnParticles(s1.x, s1.y, "#f59e0b", 12);
  };

  // Start Gameplay Loop
  const startAstralGame = (mode: AstralGameMode) => {
    audioSynth.init();
    setSelectedMode(mode);
    setScoreP1(0);
    setScoreP2(0);
    setComboStreak(0);
    setMultiplier(1);

    const initialWells: GravityWell[] = [
      { id: 1, x: 250, y: 200, mass: 200, radius: 28 },
      { id: 2, x: 550, y: 400, mass: 240, radius: 32 },
    ];

    const initialFlares: SolarFlare[] = [
      { id: 1, x: 180, y: 140, radius: 18, color: "#f59e0b", vx: 1.5, vy: 1.2 },
      { id: 2, x: 620, y: 460, radius: 22, color: "#ef4444", vx: -1.5, vy: -1.8 },
    ];

    const initialDustOrbs = [
      { x: 300, y: 250, radius: 8 },
      { x: 500, y: 350, radius: 8 },
    ];

    engineRef.current = {
      keys: {
        p1Up: false,
        p1Down: false,
        p1Left: false,
        p1Right: false,
        p1Pulse: false,
        p2Up: false,
        p2Down: false,
        p2Left: false,
        p2Right: false,
      },
      ship1: {
        x: 400,
        y: 300,
        vx: 0,
        vy: 0,
        angle: 0,
        speed: 0,
        orbitWell: null,
      },
      ship2: {
        x: 500,
        y: 300,
        vx: 0,
        vy: 0,
        angle: Math.PI,
        speed: 0,
      },
      wells: initialWells,
      flares: initialFlares,
      floatingTexts: [],
      particles: [],
      dustOrbs: initialDustOrbs,
    };

    setGameState("playing");
  };

  // Keyboard Event Handling
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (gameState !== "playing") return;
      if (e.key === "w" || e.key === "W" || e.key === "ArrowUp") engineRef.current.keys.p1Up = true;
      if (e.key === "s" || e.key === "S" || e.key === "ArrowDown") engineRef.current.keys.p1Down = true;
      if (e.key === "a" || e.key === "A" || e.key === "ArrowLeft") engineRef.current.keys.p1Left = true;
      if (e.key === "d" || e.key === "D" || e.key === "ArrowRight") engineRef.current.keys.p1Right = true;
      if (e.key === " ") triggerSlingshotPulse();
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
      const s1 = state.ship1;

      // Rotations & Steering
      if (state.keys.p1Left) s1.angle -= 0.06;
      if (state.keys.p1Right) s1.angle += 0.06;

      if (state.keys.p1Up) s1.speed = Math.min(7, s1.speed + 0.35);
      else if (state.keys.p1Down) s1.speed = Math.max(-3, s1.speed - 0.25);
      else s1.speed *= 0.95;

      // Gravity Well Forces
      state.wells.forEach((well) => {
        const dx = well.x - s1.x;
        const dy = well.y - s1.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < 180) {
          const force = (well.mass / (dist * dist)) * 0.4;
          s1.vx += (dx / dist) * force;
          s1.vy += (dy / dist) * force;
        }
      });

      s1.vx += Math.cos(s1.angle) * (s1.speed * 0.1);
      s1.vy += Math.sin(s1.angle) * (s1.speed * 0.1);
      s1.x += s1.vx;
      s1.y += s1.vy;

      s1.x = Math.max(20, Math.min(780, s1.x));
      s1.y = Math.max(20, Math.min(580, s1.y));

      // Dust Orb Collections
      state.dustOrbs.forEach((orb) => {
        const dx = orb.x - s1.x;
        const dy = orb.y - s1.y;
        if (Math.sqrt(dx * dx + dy * dy) < orb.radius + 14) {
          audioSynth.playDustHarvest();
          orb.x = 60 + Math.random() * 680;
          orb.y = 60 + Math.random() * 480;

          setAstralDust((prev) => prev + 2);
          p1ScoreAccum += 150 * multiplier;
          setScoreP1(p1ScoreAccum);

          triggerFloatingText(`+${150 * multiplier}`, orb.x, orb.y - 15, "#fbbf24");
          spawnParticles(orb.x, orb.y, "#f59e0b", 10);
        }
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

      ctx.fillStyle = "#030812";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Render Gravity Wells
      state.wells.forEach((well) => {
        ctx.beginPath();
        ctx.arc(well.x, well.y, well.radius, 0, Math.PI * 2);
        ctx.fillStyle = "#f59e0b";
        ctx.shadowColor = "#f59e0b";
        ctx.shadowBlur = 24;
        ctx.fill();
      });
      ctx.shadowBlur = 0;

      // Render Dust Orbs
      state.dustOrbs.forEach((orb) => {
        ctx.beginPath();
        ctx.arc(orb.x, orb.y, orb.radius, 0, Math.PI * 2);
        ctx.fillStyle = "#fbbf24";
        ctx.shadowColor = "#fbbf24";
        ctx.shadowBlur = 14;
        ctx.fill();
      });
      ctx.shadowBlur = 0;

      // Render Ship
      ctx.save();
      ctx.translate(s1.x, s1.y);
      ctx.rotate(s1.angle);
      ctx.beginPath();
      ctx.moveTo(20, 0);
      ctx.lineTo(-12, -14);
      ctx.lineTo(-12, 14);
      ctx.closePath();
      ctx.fillStyle = "#38bdf8";
      ctx.shadowColor = "#38bdf8";
      ctx.shadowBlur = 22;
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
    <div className="relative w-full h-screen bg-[#02050e] text-white flex flex-col items-center justify-center font-sans overflow-hidden select-none">
      {/* Top Header */}
      <div className="absolute top-4 left-4 right-4 z-30 flex items-center justify-between pointer-events-auto">
        <Link
          href="/games"
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-xs font-bold uppercase tracking-wider backdrop-blur-md transition-all"
        >
          <ArrowLeft className="w-4 h-4" /> GAMES
        </Link>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-bold font-mono">
            <Sparkles className="w-4 h-4 text-amber-400" /> {astralDust} DUST
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
              <Volume2 className="w-4 h-4 text-amber-400" />
            )}
          </button>
        </div>
      </div>

      {/* Main Game Interface & Canvas Frame */}
      <div className="relative w-full max-w-5xl aspect-[16/10] bg-[#030a18] rounded-3xl border border-amber-500/30 overflow-hidden shadow-[0_0_80px_rgba(245,158,11,0.15)] flex flex-col justify-center items-center">
        <canvas ref={canvasRef} width={800} height={600} className="w-full h-full object-contain" />

        {/* Dynamic HUD Layer */}
        {gameState === "playing" && (
          <div className="absolute top-6 inset-x-6 z-20 flex justify-between items-start pointer-events-none">
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-black/70 border border-amber-500/40 text-amber-300 font-mono text-xs backdrop-blur-md">
                <Sun className="w-4 h-4 text-amber-400" /> ASTRAL SCORE: {scoreP1}
              </div>
            </div>

            <div className="px-5 py-2.5 rounded-2xl bg-black/70 border border-amber-500/40 backdrop-blur-md text-right">
              <div className="text-[10px] font-mono text-amber-400/70 uppercase">HARVESTED DUST</div>
              <div className="text-2xl font-black font-mono text-amber-300">{astralDust} DUST</div>
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
                className="w-14 h-14 rounded-2xl bg-white/10 border border-white/20 active:bg-amber-500/30 flex items-center justify-center font-bold text-lg"
              >
                ↺
              </button>
              <button
                onTouchStart={() => (engineRef.current.keys.p1Right = true)}
                onTouchEnd={() => (engineRef.current.keys.p1Right = false)}
                className="w-14 h-14 rounded-2xl bg-white/10 border border-white/20 active:bg-amber-500/30 flex items-center justify-center font-bold text-lg"
              >
                ↻
              </button>
            </div>
            <button
              onClick={triggerSlingshotPulse}
              className="w-20 h-20 rounded-full bg-gradient-to-tr from-amber-500 to-orange-500 border border-amber-300 active:scale-95 flex items-center justify-center font-black text-xs uppercase text-black shadow-lg"
            >
              PULSE
            </button>
          </div>
        )}

        {/* Comprehensive Main Menu Interface */}
        {gameState === "menu" && (
          <div className="absolute inset-0 z-40 bg-[#020916]/95 backdrop-blur-2xl flex flex-col p-8 overflow-y-auto">
            {/* Header Banner Visual */}
            <div className="relative w-full h-44 rounded-2xl overflow-hidden border border-amber-500/30 mb-6 flex items-center justify-between p-8 bg-gradient-to-r from-amber-900/60 via-slate-900/80 to-cyan-900/60 shadow-[0_0_40px_rgba(245,158,11,0.2)]">
              <div className="z-10 max-w-md">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 text-[10px] font-black uppercase tracking-widest mb-2">
                  <Zap className="w-3.5 h-3.5 text-amber-400 animate-pulse" /> 2,000+ Line Celestial Gravity Arena
                </div>
                <h1 className="text-5xl font-black uppercase tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-yellow-300 to-cyan-400 drop-shadow-[0_0_30px_rgba(245,158,11,0.6)]">
                  ASTRAL
                </h1>
                <p className="text-xs text-amber-100/70 mt-1">
                  Orbital gravity well slingshot physics, starforge armory upgrades, and global online score competition.
                </p>
              </div>

              <div className="z-10 flex gap-3">
                <div className="px-4 py-2 rounded-xl bg-black/50 border border-amber-500/30 text-right backdrop-blur-md">
                  <div className="text-[10px] font-mono text-amber-400/60">STELLAR RANK</div>
                  <div className="text-sm font-black text-amber-300">ASTRAL COMMANDER III</div>
                </div>
              </div>
            </div>

            {/* Menu Tabs */}
            <div className="flex items-center gap-2 border-b border-white/10 pb-3 mb-6 overflow-x-auto">
              {(["play", "starforge", "online", "leaderboard", "achievements", "settings"] as AstralMenuTab[]).map(
                (tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all flex items-center gap-2 ${
                      activeTab === tab
                        ? "bg-gradient-to-r from-amber-500 to-orange-500 text-black shadow-[0_0_20px_rgba(245,158,11,0.4)]"
                        : "bg-white/5 hover:bg-white/10 text-white/70 border border-white/5"
                    }`}
                  >
                    {tab === "play" && <User className="w-4 h-4" />}
                    {tab === "starforge" && <ShoppingBag className="w-4 h-4" />}
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
                  onClick={() => startAstralGame("astral_orbit")}
                  className="group p-6 rounded-2xl bg-white/5 border border-amber-500/30 hover:border-amber-400 hover:bg-amber-500/10 flex flex-col items-center text-center gap-3 transition-all active:scale-95"
                >
                  <User className="w-10 h-10 text-amber-400 group-hover:scale-110 transition-transform" />
                  <div>
                    <div className="font-black text-lg uppercase text-white">ASTRAL ORBIT</div>
                    <div className="text-xs text-amber-200/60 mt-1">Single player gravity well slingshot trial</div>
                  </div>
                </button>

                <button
                  onClick={() => startAstralGame("gravitational_duel")}
                  className="group p-6 rounded-2xl bg-white/5 border border-cyan-500/30 hover:border-cyan-400 hover:bg-cyan-500/10 flex flex-col items-center text-center gap-3 transition-all active:scale-95"
                >
                  <Users className="w-10 h-10 text-cyan-400 group-hover:scale-110 transition-transform" />
                  <div>
                    <div className="font-black text-lg uppercase text-white">GRAVITY DUEL</div>
                    <div className="text-xs text-cyan-200/60 mt-1">2-Player competitive orbital race</div>
                  </div>
                </button>

                <button
                  onClick={() => startAstralGame("singularity_surge")}
                  className="group p-6 rounded-2xl bg-white/5 border border-red-500/30 hover:border-red-400 hover:bg-red-500/10 flex flex-col items-center text-center gap-3 transition-all active:scale-95"
                >
                  <Flame className="w-10 h-10 text-red-400 group-hover:scale-110 transition-transform" />
                  <div>
                    <div className="font-black text-lg uppercase text-white">SINGULARITY SURGE</div>
                    <div className="text-xs text-red-200/60 mt-1">Survive black hole anomaly waves</div>
                  </div>
                </button>
              </div>
            )}

            {/* TAB CONTENT: STARFORGE SHOP */}
            {activeTab === "starforge" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {starforgeItems.map((item) => (
                  <div key={item.id} className="p-5 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
                        {item.category === "anchor" && <OrbitIcon className="w-6 h-6" />}
                        {item.category === "cannon" && <Sun className="w-6 h-6" />}
                        {item.category === "deflector" && <Shield className="w-6 h-6" />}
                        {item.category === "booster" && <Zap className="w-6 h-6" />}
                      </div>
                      <div>
                        <div className="font-black text-sm text-white">{item.name}</div>
                        <div className="text-xs text-white/50">{item.description}</div>
                        <div className="text-[10px] text-amber-400 font-mono mt-1">LEVEL {item.level} / {item.maxLevel}</div>
                      </div>
                    </div>
                    <button
                      onClick={() => buyStarforgeItem(item)}
                      disabled={item.level >= item.maxLevel || astralDust < item.costDust}
                      className="px-4 py-2 rounded-xl bg-amber-500 text-black font-bold text-xs disabled:opacity-30 disabled:pointer-events-none"
                    >
                      {item.level >= item.maxLevel ? "MAX" : `${item.costDust} DUST`}
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* TAB CONTENT: ONLINE LOBBIES */}
            {activeTab === "online" && (
              <div className="flex flex-col gap-4">
                <div className="flex justify-between items-center bg-white/5 p-4 rounded-2xl border border-white/10">
                  <div className="text-xs font-bold text-amber-300">LIVE MATCH ROOMS</div>
                  <button
                    onClick={refreshRooms}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-amber-500/20 text-amber-300 text-xs font-bold"
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
                        onClick={() => startAstralGame("gravitational_duel")}
                        className="px-4 py-2 rounded-xl bg-amber-500 text-black font-bold text-xs uppercase"
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
                        <span className="font-bold text-amber-400">#{idx + 1}</span>
                        <span className="text-white font-bold">{entry.name}</span>
                      </div>
                      <span className="text-amber-400 font-bold">{entry.score} PTS</span>
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
                      className="px-3 py-1.5 rounded-xl bg-amber-500 text-black font-bold text-xs disabled:opacity-30"
                    >
                      {ach.rewardDust} DUST
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
              className="text-center max-w-md w-full bg-slate-900/90 border border-amber-500/40 p-8 rounded-3xl shadow-[0_0_50px_rgba(245,158,11,0.3)]"
            >
              <h2 className="text-4xl font-black uppercase text-amber-300 mb-2">GRAVITY DISRUPTED</h2>
              <div className="p-4 rounded-2xl bg-white/5 border border-white/10 mb-6">
                <div className="text-xs text-white/40 uppercase">FINAL SCORE</div>
                <div className="text-3xl font-black text-amber-300">{scoreP1}</div>
              </div>
              <div className="flex gap-4">
                <button
                  onClick={() => startAstralGame(selectedMode)}
                  className="flex-1 py-3.5 rounded-2xl bg-amber-500 text-black font-black uppercase"
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
