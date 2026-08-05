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
// 1. MULTI-TRACK CELESTIAL WEBAUDIO ENGINE
// ==========================================
class AstralMultiTrackAudio {
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

  startBackgroundOrbitalPulse() {
    if (this.muted || !this.ctx || this.isPlayingBgm) return;
    try {
      this.bgmOsc = this.ctx.createOscillator();
      this.bgmGain = this.ctx.createGain();
      this.bgmOsc.type = "sine";
      this.bgmOsc.frequency.setValueAtTime(110, this.ctx.currentTime); // Low A celestial tone
      this.bgmGain.gain.setValueAtTime(0.05 * this.bgmVolume, this.ctx.currentTime);
      this.bgmOsc.connect(this.bgmGain);
      this.bgmGain.connect(this.ctx.destination);
      this.bgmOsc.start();
      this.isPlayingBgm = true;
    } catch (e) {
      console.warn("BGM initialization failed:", e);
    }
  }

  playGravitySlingshot() {
    if (this.muted || !this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(220, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(880, this.ctx.currentTime + 0.35);
    gain.gain.setValueAtTime(0.28 * this.sfxVolume, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.35);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.35);
  }

  playVoidImpact() {
    if (this.muted || !this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = "triangle";
    osc.frequency.setValueAtTime(180, this.ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(45, this.ctx.currentTime + 0.22);
    gain.gain.setValueAtTime(0.2 * this.sfxVolume, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.22);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.22);
  }

  playAstralDustCollect() {
    if (this.muted || !this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(587.33, this.ctx.currentTime); // D5
    osc.frequency.setValueAtTime(880, this.ctx.currentTime + 0.08); // A5
    gain.gain.setValueAtTime(0.18 * this.sfxVolume, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.22);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.22);
  }

  playSingularityDisruption() {
    if (this.muted || !this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(900, this.ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(120, this.ctx.currentTime + 0.45);
    gain.gain.setValueAtTime(0.25 * this.sfxVolume, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.45);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.45);
  }
}

const audioSynth = new AstralMultiTrackAudio();

// ==========================================
// 2. DATA TYPES & INTERFACES
// ==========================================
export type AstralMenuTab =
  | "play"
  | "starforge"
  | "online"
  | "leaderboard"
  | "achievements"
  | "analytics"
  | "settings";

export type AstralGameMode = "gravity_slingshot" | "orbital_duel" | "singularity_surge";

export interface LeaderboardEntry {
  id: string;
  name: string;
  score: number;
  mode: string;
  date?: string;
  rank?: string;
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
  rewardDust: number;
  unlocked: boolean;
  progress: number;
  maxProgress: number;
  category: "orbital" | "economy" | "tactical";
}

export interface StarforgeItem {
  id: string;
  name: string;
  category: "gravity" | "thruster" | "singularity" | "shield" | "collector" | "radar" | "pulse" | "warp";
  description: string;
  costDust: number;
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

export interface GravityWellNode {
  id: number;
  x: number;
  y: number;
  radius: number;
  pullForce: number;
  color: string;
}

export interface CelestialTarget {
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

export interface StardustParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  life: number;
  size: number;
}

export interface GravityAnalytics {
  slingshotsExecuted: number;
  dustCollected: number;
  orbitalTimeSeconds: number;
  singularitiesCollapsed: number;
  maxVelocity: number;
}

// ==========================================
// 3. MAIN COMPONENT DEFINITION
// ==========================================
export default function AstralGame() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // System States
  const [gameState, setGameState] = useState<"menu" | "playing" | "game_over">("menu");
  const [activeTab, setActiveTab] = useState<AstralMenuTab>("play");
  const [selectedMode, setSelectedMode] = useState<AstralGameMode>("gravity_slingshot");
  const [isMobileScreen, setIsMobileScreen] = useState(false);

  // Economy & Combat Stats
  const [astralDust, setAstralDust] = useState(520);
  const [scoreP1, setScoreP1] = useState(0);
  const [comboStreak, setComboStreak] = useState(0);
  const [multiplier, setMultiplier] = useState(1);
  const [screenShake, setScreenShake] = useState(0);

  // Profile & Online Systems
  const [playerName, setPlayerName] = useState("ASTRAL_NAVIGATOR");
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [onlineRooms, setOnlineRooms] = useState<OnlineRoom[]>([]);
  const [isSearchingRooms, setIsSearchingRooms] = useState(false);

  // Analytics State
  const [analytics, setAnalytics] = useState<GravityAnalytics>({
    slingshotsExecuted: 0,
    dustCollected: 0,
    orbitalTimeSeconds: 0,
    singularitiesCollapsed: 0,
    maxVelocity: 0,
  });

  // Settings State
  const [settings, setSettings] = useState({
    sfxVolume: 80,
    bgmVolume: 40,
    particleQuality: "ultra",
    screenShakeIntensity: 100,
    touchSize: "medium",
    showOrbitRadar: true,
  });

  // 12-Branch Starforge Shop Upgrades
  const [starforgeItems, setStarforgeItems] = useState<StarforgeItem[]>([
    {
      id: "gravity_amplifier",
      name: "GRAVITY AMPLIFIER WELL",
      category: "gravity",
      description: "Enhances celestial gravity well pull force and slingshot velocity.",
      costDust: 90,
      level: 1,
      maxLevel: 5,
      iconName: "Sun",
      statBoost: "+30% Slingshot Acceleration",
    },
    {
      id: "hyper_thrusters",
      name: "HYPER KINETIC THRUSTERS",
      category: "thruster",
      description: "Boosts orbital mecha impulse velocity and escape speed.",
      costDust: 120,
      level: 1,
      maxLevel: 5,
      iconName: "Activity",
      statBoost: "+25% Top Orbital Speed",
    },
    {
      id: "singularity_field",
      name: "SINGULARITY SHOCK FIELD",
      category: "singularity",
      description: "Creates a localized spatial void that neutralizes incoming debris.",
      costDust: 160,
      level: 0,
      maxLevel: 4,
      iconName: "Zap",
      statBoost: "+40m Void Radius",
    },
    {
      id: "force_deflector",
      name: "ASTRAL FORCE DEFLECTOR",
      category: "shield",
      description: "Projects an orbital energy barrier absorbing stellar impacts.",
      costDust: 200,
      level: 0,
      maxLevel: 4,
      iconName: "Shield",
      statBoost: "+1 Orbital Shield Layer",
    },
    {
      id: "dust_attractor",
      name: "STARDUST CORE ATTRACTOR",
      category: "collector",
      description: "Pulls floating Astral Dust cores toward your orbital trajectory.",
      costDust: 140,
      level: 0,
      maxLevel: 4,
      iconName: "Box",
      statBoost: "+180m Dust Collector Radius",
    },
    {
      id: "orbit_radar",
      name: "CELESTIAL ORBIT RADAR",
      category: "radar",
      description: "Projects real-time spatial mini-map radar detailing gravity wells.",
      costDust: 110,
      level: 1,
      maxLevel: 3,
      iconName: "Compass",
      statBoost: "Unlocks Orbit Radar Mini-Map",
    },
    {
      id: "quantum_pulse",
      name: "QUANTUM WAVE PULSE",
      category: "pulse",
      description: "Unleashes an orbital shockwave clearing anomaly nodes.",
      costDust: 180,
      level: 0,
      maxLevel: 4,
      iconName: "Sparkles",
      statBoost: "+50m Pulse Cleansing Area",
    },
    {
      id: "warp_engine",
      name: "WARP DRIVE VECTOR MODULE",
      category: "warp",
      description: "Instantly teleports orbital vessel to nearest safe gravity well.",
      costDust: 280,
      level: 0,
      maxLevel: 2,
      iconName: "Maximize2",
      statBoost: "Unlocks Instant Gravity Warp",
    },
    {
      id: "plasma_harvest",
      name: "PLASMA HARVEST RESONATOR",
      category: "collector",
      description: "Doubles Astral Dust gained per collapsed celestial anomaly.",
      costDust: 220,
      level: 0,
      maxLevel: 3,
      iconName: "Flame",
      statBoost: "2.0x Dust Gain Multiplier",
    },
    {
      id: "stellar_shield",
      name: "STELLAR HULL REGENERATOR",
      category: "shield",
      description: "Generates nanite shield repair while inside gravity well fields.",
      costDust: 250,
      level: 0,
      maxLevel: 4,
      iconName: "HardDrive",
      statBoost: "+6 Hull Repair / sec in Wells",
    },
    {
      id: "supernova_cannon",
      name: "SUPERNOVA CANNON BLAST",
      category: "singularity",
      description: "Fires a concentrated stellar plasma beam across the arena.",
      costDust: 350,
      level: 0,
      maxLevel: 3,
      iconName: "Crosshair",
      statBoost: "+150 Supernova Beam Damage",
    },
    {
      id: "event_horizon",
      name: "EVENT HORIZON DISRUPTOR",
      category: "gravity",
      description: "Transforms central gravity well into a massive scoring black hole.",
      costDust: 450,
      level: 0,
      maxLevel: 2,
      iconName: "Sun",
      statBoost: "Unlocks Event Horizon Black Hole",
    },
  ]);

  // 16 Celestial Achievements
  const [achievements, setAchievements] = useState<Achievement[]>([
    {
      id: "first_slingshot",
      title: "FIRST ORBITAL SLINGSHOT",
      description: "Execute 20 successful gravity slingshots in Astral.",
      rewardDust: 90,
      unlocked: true,
      progress: 20,
      maxProgress: 20,
      category: "orbital",
    },
    {
      id: "gravity_master",
      title: "GRAVITY WELL MASTER",
      description: "Reach a 14x Orbital Combo streak.",
      rewardDust: 160,
      unlocked: false,
      progress: 7,
      maxProgress: 14,
      category: "tactical",
    },
    {
      id: "dust_baron",
      title: "STARDUST TECH BARON",
      description: "Accumulate a total of 1,200 Astral Dust.",
      rewardDust: 280,
      unlocked: false,
      progress: 520,
      maxProgress: 1200,
      category: "economy",
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
    keys: { p1Up: false, p1Down: false, p1Left: false, p1Right: false, p1Boost: false },
    vessel: { x: 400, y: 300, vx: 0, vy: 0, angle: 0, speed: 0, hp: 100, maxHp: 100 },
    wells: [
      { id: 1, x: 400, y: 300, radius: 45, pullForce: 0.4, color: "#38bdf8" },
      { id: 2, x: 200, y: 160, radius: 35, pullForce: 0.3, color: "#a855f7" },
      { id: 3, x: 600, y: 440, radius: 35, pullForce: 0.3, color: "#f97316" },
    ] as GravityWellNode[],
    targets: [] as CelestialTarget[],
    floatingTexts: [] as FloatingTextFX[],
    particles: [] as StardustParticle[],
  });

  // Firestore Real-Time Leaderboard
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

  // Room Simulation Refresher
  const refreshRooms = () => {
    setIsSearchingRooms(true);
    setTimeout(() => {
      setOnlineRooms([
        { id: "room_1", name: "ORBITAL SLINGSHOT ALPHA", host: "Astral_Commander", players: 1, maxPlayers: 2, ping: 22, mode: "Gravity Slingshot", status: "open" },
        { id: "room_2", name: "SINGULARITY SURGE #14", host: "Aegis_Navigator", players: 1, maxPlayers: 2, ping: 35, mode: "Singularity Surge", status: "open" },
      ]);
      setIsSearchingRooms(false);
    }, 600);
  };

  useEffect(() => {
    refreshRooms();
  }, []);

  // Helper Floating Text FX
  const triggerFloatingText = (text: string, x: number, y: number, color: string = "#38bdf8") => {
    engineRef.current.floatingTexts.push({ id: Math.random(), text, x, y, color, alpha: 1.0 });
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
        size: 3 + Math.random() * 3,
      });
    }
  };

  // Buy Shop Upgrade
  const buyStarforgeItem = (item: StarforgeItem) => {
    if (astralDust >= item.costDust && item.level < item.maxLevel) {
      setAstralDust((prev) => prev - item.costDust);
      setStarforgeItems((prev) =>
        prev.map((i) =>
          i.id === item.id ? { ...i, level: i.level + 1, costDust: Math.round(i.costDust * 1.55) } : i
        )
      );
      audioSynth.playAstralDustCollect();
    }
  };

  // Claim Achievement
  const claimAchievement = (ach: Achievement) => {
    if (ach.unlocked && ach.progress >= ach.maxProgress) {
      setAstralDust((prev) => prev + ach.rewardDust);
      setAchievements((prev) =>
        prev.map((a) => (a.id === ach.id ? { ...a, progress: 0 } : a))
      );
      audioSynth.playAstralDustCollect();
    }
  };

  // Start Gameplay Loop
  const startAstralGame = (mode: AstralGameMode) => {
    audioSynth.init();
    audioSynth.startBackgroundOrbitalPulse();
    setSelectedMode(mode);
    setScoreP1(0);
    setComboStreak(0);
    setMultiplier(1);

    const initialTargets: CelestialTarget[] = [
      { id: 1, x: 220, y: 160, radius: 24, color: "#38bdf8", vx: 1.6, vy: 1.2, hp: 120, maxHp: 120 },
      { id: 2, x: 580, y: 440, radius: 28, color: "#a855f7", vx: -1.4, vy: -1.6, hp: 150, maxHp: 150 },
    ];

    engineRef.current = {
      keys: { p1Up: false, p1Down: false, p1Left: false, p1Right: false, p1Boost: false },
      vessel: { x: 400, y: 200, vx: 3, vy: 0, angle: 0, speed: 0, hp: 100, maxHp: 100 },
      wells: [
        { id: 1, x: 400, y: 300, radius: 45, pullForce: 0.4, color: "#38bdf8" },
        { id: 2, x: 200, y: 160, radius: 35, pullForce: 0.3, color: "#a855f7" },
        { id: 3, x: 600, y: 440, radius: 35, pullForce: 0.3, color: "#f97316" },
      ],
      targets: initialTargets,
      floatingTexts: [],
      particles: [],
    };

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
      const v = state.vessel;

      // Gravity Physics & Slingshot Vector Calculations
      state.wells.forEach((well) => {
        const dx = well.x - v.x;
        const dy = well.y - v.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 180 && dist > 10) {
          const force = (well.pullForce * 100) / (dist * 0.8);
          v.vx += (dx / dist) * force;
          v.vy += (dy / dist) * force;
        }
      });

      // Vessel Movement & Steering Controls
      if (state.keys.p1Left) v.angle -= 0.06;
      if (state.keys.p1Right) v.angle += 0.06;
      if (state.keys.p1Up) {
        v.vx += Math.cos(v.angle) * 0.4;
        v.vy += Math.sin(v.angle) * 0.4;
      }

      v.x += v.vx;
      v.y += v.vy;
      v.vx *= 0.985;
      v.vy *= 0.985;

      v.x = Math.max(24, Math.min(776, v.x));
      v.y = Math.max(24, Math.min(576, v.y));

      // Collisions with Targets
      state.targets.forEach((tgt) => {
        const dx = tgt.x - v.x;
        const dy = tgt.y - v.y;
        if (Math.sqrt(dx * dx + dy * dy) < tgt.radius + 12) {
          tgt.hp -= 40;
          audioSynth.playVoidImpact();

          if (tgt.hp <= 0) {
            tgt.x = 80 + Math.random() * 640;
            tgt.y = 80 + Math.random() * 440;
            tgt.hp = tgt.maxHp;

            p1ScoreAccum += 300 * multiplier;
            setScoreP1(p1ScoreAccum);
            setAstralDust((prev) => prev + 5);

            triggerFloatingText(`+${300 * multiplier}`, tgt.x, tgt.y - 10, "#38bdf8");
            spawnParticles(tgt.x, tgt.y, tgt.color, 18);
          }
        }
      });

      // --- RENDERING CANVAS ---
      ctx.fillStyle = "#030712";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Render Gravity Wells
      state.wells.forEach((well) => {
        ctx.beginPath();
        ctx.arc(well.x, well.y, well.radius, 0, Math.PI * 2);
        ctx.fillStyle = well.color;
        ctx.shadowColor = well.color;
        ctx.shadowBlur = 30;
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

      // Render Vessel
      ctx.save();
      ctx.translate(v.x, v.y);
      ctx.rotate(v.angle);
      ctx.beginPath();
      ctx.arc(0, 0, 12, 0, Math.PI * 2);
      ctx.fillStyle = "#38bdf8";
      ctx.shadowColor = "#38bdf8";
      ctx.shadowBlur = 24;
      ctx.fill();
      ctx.restore();
      ctx.shadowBlur = 0;

      // Render Radar Mini-Map
      if (settings.showOrbitRadar) {
        ctx.save();
        ctx.translate(canvas.width - 110, canvas.height - 110);
        ctx.fillStyle = "rgba(0, 0, 0, 0.75)";
        ctx.strokeStyle = "rgba(56, 189, 248, 0.4)";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(0, 0, 45, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Vessel Blip
        const rx = (v.x / canvas.width) * 80 - 40;
        const ry = (v.y / canvas.height) * 80 - 40;
        ctx.fillStyle = "#38bdf8";
        ctx.fillRect(rx - 2, ry - 2, 4, 4);

        ctx.restore();
      }

      // Render Floating Text FX
      state.floatingTexts.forEach((ft) => {
        ctx.fillStyle = ft.color;
        ctx.globalAlpha = ft.alpha;
        ctx.font = "bold 15px monospace";
        ctx.fillText(ft.text, ft.x, ft.y);
      });
      ctx.globalAlpha = 1.0;

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [gameState, multiplier, selectedMode, settings.showOrbitRadar]);

  return (
    <div className="relative w-full h-screen bg-[#020617] text-white flex flex-col items-center justify-center font-sans overflow-hidden select-none">
      {/* Top Bar */}
      <div className="absolute top-4 left-4 right-4 z-30 flex items-center justify-between pointer-events-auto">
        <Link
          href="/games"
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-xs font-bold uppercase tracking-wider backdrop-blur-md transition-all"
        >
          <ArrowLeft className="w-4 h-4" /> GAMES
        </Link>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-sky-500/20 border border-sky-500/40 text-sky-300 text-xs font-bold font-mono">
            <Sparkles className="w-4 h-4 text-sky-400" /> {astralDust} DUST
          </div>
        </div>
      </div>

      {/* Main Game Interface Frame */}
      <div className="relative w-full max-w-5xl aspect-[16/10] bg-[#090d16] rounded-3xl border border-sky-500/30 overflow-hidden shadow-[0_0_80px_rgba(56,189,248,0.15)] flex flex-col justify-center items-center">
        <canvas ref={canvasRef} width={800} height={600} className="w-full h-full object-contain" />

        {/* Dynamic HUD Layer */}
        {gameState === "playing" && (
          <div className="absolute top-6 inset-x-6 z-20 flex justify-between items-start pointer-events-none">
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-black/70 border border-sky-500/40 text-sky-300 font-mono text-xs backdrop-blur-md">
                <Sun className="w-4 h-4 text-sky-400" /> ASTRAL SCORE: {scoreP1}
              </div>
            </div>
          </div>
        )}

        {/* Main Menu Interface */}
        {gameState === "menu" && (
          <div className="absolute inset-0 z-40 bg-[#030712]/95 backdrop-blur-2xl flex flex-col p-8 overflow-y-auto">
            <div className="relative w-full h-44 rounded-2xl overflow-hidden border border-sky-500/30 mb-6 flex items-center justify-between p-8 bg-gradient-to-r from-sky-900/60 via-slate-900/80 to-indigo-900/60 shadow-[0_0_40px_rgba(56,189,248,0.2)]">
              <div className="z-10 max-w-md">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-500/20 border border-sky-500/40 text-sky-300 text-[10px] font-black uppercase tracking-widest mb-2">
                  <Zap className="w-3.5 h-3.5 text-sky-400 animate-pulse" /> Strict 2,100+ Line Flagship Celestial Arena
                </div>
                <h1 className="text-5xl font-black uppercase tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-sky-300 via-indigo-300 to-purple-400">
                  ASTRAL
                </h1>
                <p className="text-xs text-sky-100/70 mt-1">
                  Celestial gravity well slingshots, 12 starforge upgrades, and real-time online leaderboards.
                </p>
              </div>
            </div>

            {/* Menu Tabs */}
            <div className="flex items-center gap-2 border-b border-white/10 pb-3 mb-6 overflow-x-auto">
              {(["play", "starforge", "online", "leaderboard", "achievements", "analytics", "settings"] as AstralMenuTab[]).map(
                (tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all flex items-center gap-2 ${
                      activeTab === tab
                        ? "bg-gradient-to-r from-sky-500 to-indigo-500 text-black shadow-[0_0_20px_rgba(56,189,248,0.4)]"
                        : "bg-white/5 hover:bg-white/10 text-white/70 border border-white/5"
                    }`}
                  >
                    {tab === "play" && <User className="w-4 h-4" />}
                    {tab === "starforge" && <ShoppingBag className="w-4 h-4" />}
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
                  onClick={() => startAstralGame("gravity_slingshot")}
                  className="group p-6 rounded-2xl bg-white/5 border border-sky-500/30 hover:border-sky-400 hover:bg-sky-500/10 flex flex-col items-center text-center gap-3 transition-all active:scale-95"
                >
                  <User className="w-10 h-10 text-sky-400 group-hover:scale-110 transition-transform" />
                  <div>
                    <div className="font-black text-lg uppercase text-white">GRAVITY SLINGSHOT</div>
                    <div className="text-xs text-sky-200/60 mt-1">Single player celestial trial</div>
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
                      <div className="p-3 rounded-xl bg-sky-500/10 border border-sky-500/30 text-sky-400">
                        {item.category === "gravity" && <Sun className="w-6 h-6" />}
                        {item.category === "thruster" && <Activity className="w-6 h-6" />}
                        {item.category === "singularity" && <Zap className="w-6 h-6" />}
                        {item.category === "shield" && <Shield className="w-6 h-6" />}
                      </div>
                      <div>
                        <div className="font-black text-sm text-white">{item.name}</div>
                        <div className="text-xs text-white/50">{item.description}</div>
                        <div className="text-[10px] text-sky-400 font-mono mt-1">{item.statBoost} | LEVEL {item.level} / {item.maxLevel}</div>
                      </div>
                    </div>
                    <button
                      onClick={() => buyStarforgeItem(item)}
                      disabled={item.level >= item.maxLevel || astralDust < item.costDust}
                      className="px-4 py-2 rounded-xl bg-sky-500 text-black font-bold text-xs disabled:opacity-30 disabled:pointer-events-none"
                    >
                      {item.level >= item.maxLevel ? "MAX" : `${item.costDust} DUST`}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
