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
  HelpCircle,
  TrendingUp,
  AlertTriangle,
  Play,
  RotateCcw,
} from "lucide-react";
import Link from "next/link";
import { db } from "@/lib/firebase";
import { collection, addDoc, query, orderBy, limit, onSnapshot } from "firebase/firestore";

// ==========================================
// 1. MULTI-TRACK WEBAUDIO SYNTHESIZER ENGINE
// ==========================================
class TitanMultiTrackAudio {
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
      this.bgmOsc.frequency.setValueAtTime(55, this.ctx.currentTime); // Low A bass note
      this.bgmGain.gain.setValueAtTime(0.04 * this.bgmVolume, this.ctx.currentTime);
      this.bgmOsc.connect(this.bgmGain);
      this.bgmGain.connect(this.ctx.destination);
      this.bgmOsc.start();
      this.isPlayingBgm = true;
    } catch (e) {
      console.warn("BGM initialization failed:", e);
    }
  }

  stopBackgroundCyberPulse() {
    if (this.bgmOsc) {
      try {
        this.bgmOsc.stop();
        this.bgmOsc.disconnect();
      } catch (e) {}
      this.bgmOsc = null;
      this.isPlayingBgm = false;
    }
  }

  playHeavyCannonFire() {
    if (this.muted || !this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(340, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(50, this.ctx.currentTime + 0.28);
    gain.gain.setValueAtTime(0.35 * this.sfxVolume, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.28);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.28);
  }

  playArmorImpact() {
    if (this.muted || !this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = "square";
    osc.frequency.setValueAtTime(150, this.ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(35, this.ctx.currentTime + 0.2);
    gain.gain.setValueAtTime(0.22 * this.sfxVolume, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.2);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.2);
  }

  playCoreCollect() {
    if (this.muted || !this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(440, this.ctx.currentTime);
    osc.frequency.setValueAtTime(880, this.ctx.currentTime + 0.08);
    osc.frequency.setValueAtTime(1320, this.ctx.currentTime + 0.16);
    gain.gain.setValueAtTime(0.2 * this.sfxVolume, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.24);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.24);
  }

  playEmpDisruption() {
    if (this.muted || !this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = "triangle";
    osc.frequency.setValueAtTime(850, this.ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(150, this.ctx.currentTime + 0.4);
    gain.gain.setValueAtTime(0.25 * this.sfxVolume, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.4);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.4);
  }

  playOverdriveFanfare() {
    if (this.muted || !this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(523.25, this.ctx.currentTime); // C5
    osc.frequency.setValueAtTime(659.25, this.ctx.currentTime + 0.1); // E5
    osc.frequency.setValueAtTime(783.99, this.ctx.currentTime + 0.2); // G5
    osc.frequency.setValueAtTime(1046.5, this.ctx.currentTime + 0.3); // C6
    gain.gain.setValueAtTime(0.25 * this.sfxVolume, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.45);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.45);
  }
}

const audioSynth = new TitanMultiTrackAudio();

// ==========================================
// 2. DATA TYPES & INTERFACES
// ==========================================
export type TitanMenuTab =
  | "play"
  | "foundry"
  | "online"
  | "leaderboard"
  | "achievements"
  | "analytics"
  | "settings";

export type TitanGameMode = "citadel_siege" | "mecha_duel" | "override_waves";

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
  rewardCores: number;
  unlocked: boolean;
  progress: number;
  maxProgress: number;
  category: "combat" | "economy" | "tactical";
}

export interface FoundryItem {
  id: string;
  name: string;
  category: "artillery" | "railgun" | "armor" | "emp" | "thruster" | "radar" | "shield" | "reactor";
  description: string;
  costCores: number;
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
  scale: number;
}

export interface PlasmaShell {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  power: number;
  color: string;
  radius: number;
  trail: { x: number; y: number }[];
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
  type: "standard" | "heavy" | "anomaly" | "boss";
  shieldHp: number;
}

export interface DebrisParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  life: number;
  size: number;
  rotation: number;
  vRot: number;
}

export interface CombatAnalytics {
  shotsFired: number;
  shotsHit: number;
  damageDealt: number;
  coresCollected: number;
  maxCombo: number;
  timeSurvivedSeconds: number;
}

// ==========================================
// 3. MAIN COMPONENT DEFINITION
// ==========================================
export default function TitanGame() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // System & Navigation States
  const [gameState, setGameState] = useState<"menu" | "playing" | "game_over">("menu");
  const [activeTab, setActiveTab] = useState<TitanMenuTab>("play");
  const [selectedMode, setSelectedMode] = useState<TitanGameMode>("citadel_siege");
  const [isMobileScreen, setIsMobileScreen] = useState(false);

  // Player Economy & Combat Stats
  const [titaniteCores, setTitaniteCores] = useState(450);
  const [scoreP1, setScoreP1] = useState(0);
  const [scoreP2, setScoreP2] = useState(0);
  const [comboStreak, setComboStreak] = useState(0);
  const [multiplier, setMultiplier] = useState(1);
  const [screenShake, setScreenShake] = useState(0);
  const [overdriveMeter, setOverdriveMeter] = useState(0);
  const [isOverdriveActive, setIsOverdriveActive] = useState(false);

  // Profile & Online Systems
  const [playerName, setPlayerName] = useState("CITADEL_COMMANDER");
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [onlineRooms, setOnlineRooms] = useState<OnlineRoom[]>([]);
  const [isSearchingRooms, setIsSearchingRooms] = useState(false);

  // Analytics State
  const [analytics, setAnalytics] = useState<CombatAnalytics>({
    shotsFired: 0,
    shotsHit: 0,
    damageDealt: 0,
    coresCollected: 0,
    maxCombo: 0,
    timeSurvivedSeconds: 0,
  });

  // Settings State
  const [settings, setSettings] = useState({
    sfxVolume: 80,
    bgmVolume: 40,
    particleQuality: "ultra",
    screenShakeIntensity: 100,
    touchSize: "medium",
    showRadarMap: true,
  });

  // 12-Branch Foundry Shop Upgrades
  const [foundryItems, setFoundryItems] = useState<FoundryItem[]>([
    {
      id: "plasma_artillery",
      name: "HEAVY PLASMA ARTILLERY",
      category: "artillery",
      description: "Increases main cannon velocity and blast damage radius.",
      costCores: 80,
      level: 1,
      maxLevel: 5,
      iconName: "Target",
      statBoost: "+25% Shell Velocity & Radius",
    },
    {
      id: "kinetic_railgun",
      name: "KINETIC RAILGUN MODULE",
      category: "railgun",
      description: "Fires high-velocity armor piercing slugs through multi-targets.",
      costCores: 110,
      level: 0,
      maxLevel: 5,
      iconName: "Crosshair",
      statBoost: "+30% Armor Penetration",
    },
    {
      id: "reactive_armor",
      name: "REACTIVE HULL PLATING",
      category: "armor",
      description: "Absorbs incoming explosive blasts and dampens screen recoil shock.",
      costCores: 150,
      level: 0,
      maxLevel: 4,
      iconName: "Shield",
      statBoost: "+40% Blast Resistance",
    },
    {
      id: "emp_emitter",
      name: "EMP PULSE DISRUPTOR",
      category: "emp",
      description: "Disables enemy anomaly nodes in a massive radial shockwave.",
      costCores: 200,
      level: 1,
      maxLevel: 5,
      iconName: "Zap",
      statBoost: "+50m EMP Shockwave Radius",
    },
    {
      id: "overdrive_reactor",
      name: "QUANTUM OVERDRIVE REACTOR",
      category: "reactor",
      description: "Accelerates overdrive energy generation and unlocks 16x multiplier cap.",
      costCores: 250,
      level: 0,
      maxLevel: 4,
      iconName: "Sparkles",
      statBoost: "+2.0x Overdrive Energy Gain",
    },
    {
      id: "tactical_radar",
      name: "TACTICAL RADAR MINI-MAP",
      category: "radar",
      description: "Projects spatial radar map detailing enemy positions and energy wells.",
      costCores: 120,
      level: 1,
      maxLevel: 3,
      iconName: "Compass",
      statBoost: "Unlocks Spatial Mini-Map Radar",
    },
    {
      id: "heavy_thrusters",
      name: "HYPER KINETIC THRUSTERS",
      category: "thruster",
      description: "Enhances mecha acceleration and maximum turn rate.",
      costCores: 140,
      level: 1,
      maxLevel: 5,
      iconName: "Activity",
      statBoost: "+20% Top Maneuverability",
    },
    {
      id: "force_shield",
      name: "PLASMA FORCE DEFLECTOR",
      category: "shield",
      description: "Projects an orbital energy shield that neutralizes anomaly strikes.",
      costCores: 180,
      level: 0,
      maxLevel: 4,
      iconName: "Shield",
      statBoost: "+1 Orbital Shield Ring",
    },
    {
      id: "shard_magnet",
      name: "TITANITE CORE ATTRACTOR",
      category: "reactor",
      description: "Automatically pulls dropped Titanite Cores toward the mecha hull.",
      costCores: 130,
      level: 0,
      maxLevel: 3,
      iconName: "Box",
      statBoost: "+150m Core Pull Radius",
    },
    {
      id: "cluster_artillery",
      name: "CLUSTER ARTILLERY WARHEADS",
      category: "artillery",
      description: "Main cannon shell splits into 3 sub-munitions upon impact.",
      costCores: 300,
      level: 0,
      maxLevel: 3,
      iconName: "Flame",
      statBoost: "Spawns 3 Sub-Explosions",
    },
    {
      id: "nano_repair",
      name: "NANITE HULL AUTO-REPAIR",
      category: "armor",
      description: "Gradually repairs mecha hull integrity during active combat.",
      costCores: 220,
      level: 0,
      maxLevel: 4,
      iconName: "HardDrive",
      statBoost: "+5 HP / sec Auto-Repair",
    },
    {
      id: "singularity_cannon",
      name: "SINGULARITY BLACK HOLE CANNON",
      category: "artillery",
      description: "Unleashes a gravitational anomaly that pulls and shatters all enemies.",
      costCores: 400,
      level: 0,
      maxLevel: 2,
      iconName: "Sun",
      statBoost: "Unlocks Gravitational Black Hole",
    },
  ]);

  // 16 Citadel Achievements
  const [achievements, setAchievements] = useState<Achievement[]>([
    {
      id: "first_artillery",
      title: "FIRST BARS OF SIEGE",
      description: "Destroy 15 anomaly targets in Citadel Siege.",
      rewardCores: 80,
      unlocked: true,
      progress: 15,
      maxProgress: 15,
      category: "combat",
    },
    {
      id: "citadel_defense",
      title: "CITADEL GUARDIAN",
      description: "Reach a 16x Combo Streak in Override Waves.",
      rewardCores: 150,
      unlocked: false,
      progress: 8,
      maxProgress: 16,
      category: "tactical",
    },
    {
      id: "core_harvest",
      title: "TITANITE HARVESTER",
      description: "Accumulate a total of 1,000 Titanite Cores.",
      rewardCores: 250,
      unlocked: false,
      progress: 450,
      maxProgress: 1000,
      category: "economy",
    },
    {
      id: "emp_mastery",
      title: "EMP SHOCKWAVE MASTER",
      description: "Trigger EMP Pulse Disruptor 10 times in a single match.",
      rewardCores: 180,
      unlocked: false,
      progress: 3,
      maxProgress: 10,
      category: "tactical",
    },
    {
      id: "overdrive_frenzy",
      title: "QUANTUM OVERDRIVE SURGE",
      description: "Maintain Overdrive Mode for more than 30 seconds.",
      rewardCores: 200,
      unlocked: false,
      progress: 12,
      maxProgress: 30,
      category: "combat",
    },
    {
      id: "sharpshooter",
      title: "PRECISION ARTILLERY",
      description: "Achieve a 90%+ Shot Accuracy rating in a full match.",
      rewardCores: 220,
      unlocked: false,
      progress: 74,
      maxProgress: 90,
      category: "combat",
    },
    {
      id: "foundry_baron",
      title: "FOUNDRY TECH BARON",
      description: "Upgrade at least 6 Foundry shop items to Level 3 or higher.",
      rewardCores: 300,
      unlocked: false,
      progress: 2,
      maxProgress: 6,
      category: "economy",
    },
    {
      id: "boss_slayer",
      title: "CITADEL BOSS DESTROYER",
      description: "Defeat 3 Titan Anomaly Bosses in Override Waves.",
      rewardCores: 350,
      unlocked: false,
      progress: 1,
      maxProgress: 3,
      category: "combat",
    },
  ]);

  // Mobile Screen Responsive Listener
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
    keys: {
      p1Up: false,
      p1Down: false,
      p1Left: false,
      p1Right: false,
      p1Fire: false,
      p1Emp: false,
      p2Up: false,
      p2Down: false,
      p2Left: false,
      p2Right: false,
      p2Fire: false,
    },
    mecha1: {
      x: 400,
      y: 300,
      vx: 0,
      vy: 0,
      angle: 0,
      speed: 0,
      shieldCharges: 0,
      autoRepairTimer: 0,
      hp: 100,
      maxHp: 100,
    },
    mecha2: {
      x: 500,
      y: 300,
      vx: 0,
      vy: 0,
      angle: Math.PI,
      speed: 0,
      hp: 100,
      maxHp: 100,
    },
    shells: [] as PlasmaShell[],
    targets: [] as SiegeTarget[],
    floatingTexts: [] as FloatingTextFX[],
    particles: [] as DebrisParticle[],
    cores: [] as { x: number; y: number; radius: number; value: number }[],
    empWave: { active: false, x: 0, y: 0, radius: 0, maxRadius: 280 },
  });

  // Firestore Real-Time Leaderboard Subscription
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

  // Room Simulation Refresher
  const refreshRooms = () => {
    setIsSearchingRooms(true);
    setTimeout(() => {
      setOnlineRooms([
        { id: "room_1", name: "CITADEL SIEGE ALPHA", host: "Titan_Commander", players: 1, maxPlayers: 2, ping: 18, mode: "Citadel Siege", status: "open" },
        { id: "room_2", name: "OVERRIDE WAVES #09", host: "Aegis_Vanguard", players: 1, maxPlayers: 2, ping: 32, mode: "Override Waves", status: "open" },
        { id: "room_3", name: "MECHA DUEL PRO LOBBY", host: "Hyper_Solace", players: 2, maxPlayers: 2, ping: 25, mode: "Mecha Duel", status: "full" },
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
        rank: "HIGH COMMANDER",
      });
    } catch (e) {
      console.warn("Error saving score:", e);
    }
  };

  // Helper Floating Text FX Generator
  const triggerFloatingText = (text: string, x: number, y: number, color: string = "#f97316") => {
    engineRef.current.floatingTexts.push({
      id: Math.random(),
      text,
      x,
      y,
      color,
      alpha: 1.0,
      scale: 1.2,
    });
  };

  // Particle Explosions Pool Generator
  const spawnDebrisParticles = (x: number, y: number, color: string, count: number = 18) => {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 1.5 + Math.random() * 6.5;
      engineRef.current.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color,
        life: 1.0,
        size: 3 + Math.random() * 4,
        rotation: Math.random() * Math.PI,
        vRot: (Math.random() - 0.5) * 0.2,
      });
    }
  };

  // Trigger EMP Shockwave
  const triggerEmpShockwave = () => {
    audioSynth.playEmpDisruption();
    const m1 = engineRef.current.mecha1;
    engineRef.current.empWave = {
      active: true,
      x: m1.x,
      y: m1.y,
      radius: 10,
      maxRadius: 280,
    };
    setScreenShake(12);
  };

  // Buy Shop Upgrade Line
  const buyFoundryItem = (item: FoundryItem) => {
    if (titaniteCores >= item.costCores && item.level < item.maxLevel) {
      setTitaniteCores((prev) => prev - item.costCores);
      setFoundryItems((prev) =>
        prev.map((i) =>
          i.id === item.id ? { ...i, level: i.level + 1, costCores: Math.round(i.costCores * 1.55) } : i
        )
      );
      audioSynth.playCoreCollect();
    }
  };

  // Claim Achievement Reward
  const claimAchievement = (ach: Achievement) => {
    if (ach.unlocked && ach.progress >= ach.maxProgress) {
      setTitaniteCores((prev) => prev + ach.rewardCores);
      setAchievements((prev) =>
        prev.map((a) => (a.id === ach.id ? { ...a, progress: 0 } : a))
      );
      audioSynth.playCoreCollect();
    }
  };

  // Fire Heavy Cannon Shell
  const fireHeavyCannon = (mecha: typeof engineRef.current.mecha1) => {
    audioSynth.playHeavyCannonFire();
    const artilleryLvl = foundryItems.find((i) => i.id === "plasma_artillery")?.level || 1;
    const speed = 9 + artilleryLvl * 1.2;

    engineRef.current.shells.push({
      id: Math.random(),
      x: mecha.x,
      y: mecha.y,
      vx: Math.cos(mecha.angle) * speed,
      vy: Math.sin(mecha.angle) * speed,
      power: 140 * multiplier,
      color: "#f97316",
      radius: 6,
      trail: [],
    });

    setAnalytics((prev) => ({ ...prev, shotsFired: prev.shotsFired + 1 }));
    setScreenShake(6);
  };

  // Start Gameplay Loop
  const startTitanGame = (mode: TitanGameMode) => {
    audioSynth.init();
    audioSynth.startBackgroundCyberPulse();
    setSelectedMode(mode);
    setScoreP1(0);
    setScoreP2(0);
    setComboStreak(0);
    setMultiplier(1);
    setOverdriveMeter(0);
    setIsOverdriveActive(false);

    const shieldLvl = foundryItems.find((i) => i.id === "force_shield")?.level || 0;

    const initialTargets: SiegeTarget[] = [
      { id: 1, x: 220, y: 160, radius: 24, color: "#f97316", vx: 1.6, vy: 1.2, hp: 120, maxHp: 120, type: "standard", shieldHp: 0 },
      { id: 2, x: 580, y: 440, radius: 28, color: "#06b6d4", vx: -1.4, vy: -1.6, hp: 160, maxHp: 160, type: "heavy", shieldHp: 40 },
      { id: 3, x: 400, y: 140, radius: 20, color: "#a855f7", vx: 2.2, vy: -1.0, hp: 100, maxHp: 100, type: "anomaly", shieldHp: 0 },
    ];

    engineRef.current = {
      keys: {
        p1Up: false,
        p1Down: false,
        p1Left: false,
        p1Right: false,
        p1Fire: false,
        p1Emp: false,
        p2Up: false,
        p2Down: false,
        p2Left: false,
        p2Right: false,
        p2Fire: false,
      },
      mecha1: {
        x: 400,
        y: 300,
        vx: 0,
        vy: 0,
        angle: 0,
        speed: 0,
        shieldCharges: shieldLvl,
        autoRepairTimer: 0,
        hp: 100,
        maxHp: 100,
      },
      mecha2: {
        x: 500,
        y: 300,
        vx: 0,
        vy: 0,
        angle: Math.PI,
        speed: 0,
        hp: 100,
        maxHp: 100,
      },
      shells: [],
      targets: initialTargets,
      floatingTexts: [],
      particles: [],
      cores: [],
      empWave: { active: false, x: 0, y: 0, radius: 0, maxRadius: 280 },
    };

    setGameState("playing");
  };

  // Keyboard Event Handlers
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (gameState !== "playing") return;
      if (e.key === "w" || e.key === "W" || e.key === "ArrowUp") engineRef.current.keys.p1Up = true;
      if (e.key === "s" || e.key === "S" || e.key === "ArrowDown") engineRef.current.keys.p1Down = true;
      if (e.key === "a" || e.key === "A" || e.key === "ArrowLeft") engineRef.current.keys.p1Left = true;
      if (e.key === "d" || e.key === "D" || e.key === "ArrowRight") engineRef.current.keys.p1Right = true;
      if (e.key === " ") fireHeavyCannon(engineRef.current.mecha1);
      if (e.key === "e" || e.key === "E") triggerEmpShockwave();
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
    let comboTracker = 0;

    const loop = () => {
      const state = engineRef.current;
      const m1 = state.mecha1;

      // Steering & Impulse Physics
      if (state.keys.p1Left) m1.angle -= 0.055;
      if (state.keys.p1Right) m1.angle += 0.055;

      if (state.keys.p1Up) m1.speed = Math.min(6.5, m1.speed + 0.35);
      else if (state.keys.p1Down) m1.speed = Math.max(-3.0, m1.speed - 0.25);
      else m1.speed *= 0.93;

      m1.vx = Math.cos(m1.angle) * m1.speed;
      m1.vy = Math.sin(m1.angle) * m1.speed;
      m1.x += m1.vx;
      m1.y += m1.vy;

      m1.x = Math.max(24, Math.min(776, m1.x));
      m1.y = Math.max(24, Math.min(576, m1.y));

      // EMP Wave Propagation
      if (state.empWave.active) {
        state.empWave.radius += 12;
        if (state.empWave.radius >= state.empWave.maxRadius) {
          state.empWave.active = false;
        }

        // Damage targets in EMP wave
        state.targets.forEach((tgt) => {
          const dx = tgt.x - state.empWave.x;
          const dy = tgt.y - state.empWave.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < state.empWave.radius + tgt.radius) {
            tgt.hp -= 2;
          }
        });
      }

      // Shell Motion & Collision Logic
      state.shells.forEach((shell) => {
        shell.x += shell.vx;
        shell.y += shell.vy;

        shell.trail.push({ x: shell.x, y: shell.y });
        if (shell.trail.length > 6) shell.trail.shift();

        state.targets.forEach((tgt) => {
          const dx = tgt.x - shell.x;
          const dy = tgt.y - shell.y;
          if (Math.sqrt(dx * dx + dy * dy) < tgt.radius + shell.radius) {
            tgt.hp -= shell.power;
            audioSynth.playArmorImpact();
            setAnalytics((prev) => ({ ...prev, shotsHit: prev.shotsHit + 1, damageDealt: prev.damageDealt + shell.power }));

            if (tgt.hp <= 0) {
              tgt.x = 80 + Math.random() * 640;
              tgt.y = 80 + Math.random() * 440;
              tgt.hp = tgt.maxHp;

              comboTracker++;
              setComboStreak(comboTracker);

              if (comboTracker % 5 === 0 && multiplier < 16) {
                setMultiplier((prev) => prev * 2);
                triggerFloatingText(`${multiplier * 2}X OVERDRIVE CAP!`, tgt.x, tgt.y - 25, "#f97316");
                audioSynth.playOverdriveFanfare();
              }

              const pts = 350 * multiplier;
              p1ScoreAccum += pts;
              setScoreP1(p1ScoreAccum);
              setTitaniteCores((prev) => prev + 6);

              triggerFloatingText(`+${pts}`, tgt.x, tgt.y - 10, "#fbbf24");
              spawnDebrisParticles(tgt.x, tgt.y, tgt.color, 20);
            }
          }
        });
      });

      state.shells = state.shells.filter(
        (s) => s.x > 0 && s.x < 800 && s.y > 0 && s.y < 600
      );

      // Target Movement
      state.targets.forEach((tgt) => {
        tgt.x += tgt.vx;
        tgt.y += tgt.vy;
        if (tgt.x < 40 || tgt.x > 760) tgt.vx *= -1;
        if (tgt.y < 40 || tgt.y > 560) tgt.vy *= -1;
      });

      // Floating Text & Particles Decay
      state.floatingTexts.forEach((ft) => {
        ft.y -= 1.2;
        ft.alpha -= 0.02;
      });
      state.floatingTexts = state.floatingTexts.filter((ft) => ft.alpha > 0);

      state.particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        p.rotation += p.vRot;
        p.life -= 0.025;
      });
      state.particles = state.particles.filter((p) => p.life > 0);

      // --- RENDERING CANVAS ---
      ctx.save();
      if (screenShake > 0) {
        ctx.translate((Math.random() - 0.5) * screenShake, (Math.random() - 0.5) * screenShake);
        setScreenShake((prev) => Math.max(0, prev - 1));
      }

      ctx.fillStyle = "#070201";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Tactical Grid Overlay
      ctx.strokeStyle = "rgba(249, 115, 22, 0.06)";
      ctx.lineWidth = 1;
      for (let x = 0; x < canvas.width; x += 40) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
      }
      for (let y = 0; y < canvas.height; y += 40) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
      }

      // Render EMP Shockwave
      if (state.empWave.active) {
        ctx.beginPath();
        ctx.arc(state.empWave.x, state.empWave.y, state.empWave.radius, 0, Math.PI * 2);
        ctx.strokeStyle = "rgba(6, 182, 212, 0.6)";
        ctx.lineWidth = 4;
        ctx.stroke();
      }

      // Render Debris Particles
      state.particles.forEach((p) => {
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.life;
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
        ctx.restore();
      });
      ctx.globalAlpha = 1.0;

      // Render Shell Trails & Shells
      state.shells.forEach((s) => {
        ctx.beginPath();
        s.trail.forEach((pt, idx) => {
          if (idx === 0) ctx.moveTo(pt.x, pt.y);
          else ctx.lineTo(pt.x, pt.y);
        });
        ctx.strokeStyle = "rgba(249, 115, 22, 0.4)";
        ctx.lineWidth = 3;
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
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
        ctx.shadowBlur = 22;
        ctx.fill();

        // Target Health Ring
        ctx.beginPath();
        ctx.arc(tgt.x, tgt.y, tgt.radius + 4, 0, (Math.PI * 2 * (tgt.hp / tgt.maxHp)));
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 2;
        ctx.stroke();
      });
      ctx.shadowBlur = 0;

      // Render Mecha Core
      ctx.save();
      ctx.translate(m1.x, m1.y);
      ctx.rotate(m1.angle);

      // Mecha Hull Plating
      ctx.beginPath();
      ctx.rect(-18, -16, 36, 32);
      ctx.fillStyle = "#f97316";
      ctx.shadowColor = "#f97316";
      ctx.shadowBlur = 24;
      ctx.fill();

      // Artillery Cannon Barrels
      ctx.beginPath();
      ctx.rect(14, -5, 16, 10);
      ctx.fillStyle = "#fed7aa";
      ctx.fill();
      ctx.restore();
      ctx.shadowBlur = 0;

      // Render Spatial Mini-Map Radar Overlay
      if (settings.showRadarMap) {
        ctx.save();
        ctx.translate(canvas.width - 110, canvas.height - 110);
        ctx.fillStyle = "rgba(0, 0, 0, 0.75)";
        ctx.strokeStyle = "rgba(249, 115, 22, 0.4)";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(0, 0, 45, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Mecha Radar Blip
        const rx = (m1.x / canvas.width) * 80 - 40;
        const ry = (m1.y / canvas.height) * 80 - 40;
        ctx.fillStyle = "#38bdf8";
        ctx.fillRect(rx - 2, ry - 2, 4, 4);

        // Enemy Radar Blips
        state.targets.forEach((tgt) => {
          const erx = (tgt.x / canvas.width) * 80 - 40;
          const ery = (tgt.y / canvas.height) * 80 - 40;
          ctx.fillStyle = "#ef4444";
          ctx.fillRect(erx - 2, ery - 2, 4, 4);
        });

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

      ctx.restore();

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [gameState, multiplier, selectedMode, screenShake, settings.showRadarMap]);

  return (
    <div className="relative w-full h-screen bg-[#060201] text-white flex flex-col items-center justify-center font-sans overflow-hidden select-none">
      {/* Top Navigation Control Bar */}
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

      {/* Main Canvas & Game Interface Frame */}
      <div className="relative w-full max-w-5xl aspect-[16/10] bg-[#100402] rounded-3xl border border-orange-500/30 overflow-hidden shadow-[0_0_80px_rgba(249,115,22,0.15)] flex flex-col justify-center items-center">
        <canvas ref={canvasRef} width={800} height={600} className="w-full h-full object-contain" />

        {/* Dynamic HUD Layer */}
        {gameState === "playing" && (
          <div className="absolute top-6 inset-x-6 z-20 flex justify-between items-start pointer-events-none">
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-black/70 border border-orange-500/40 text-orange-300 font-mono text-xs backdrop-blur-md">
                <Sun className="w-4 h-4 text-orange-400" /> TITAN SCORE: {scoreP1}
              </div>
              {multiplier > 1 && (
                <div className="px-3.5 py-1 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-300 font-mono text-xs font-black animate-bounce">
                  {multiplier}X OVERDRIVE CAP
                </div>
              )}
            </div>

            <div className="px-5 py-2.5 rounded-2xl bg-black/70 border border-orange-500/40 backdrop-blur-md text-right">
              <div className="text-[10px] font-mono text-orange-400/70 uppercase">COMBO STREAK</div>
              <div className="text-2xl font-black font-mono text-orange-300">{comboStreak} STREAK</div>
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
            <div className="flex items-center gap-3">
              <button
                onClick={triggerEmpShockwave}
                className="w-16 h-16 rounded-full bg-cyan-500/20 border border-cyan-400 text-cyan-300 font-bold text-xs uppercase backdrop-blur-md active:scale-95"
              >
                EMP
              </button>
              <button
                onClick={() => fireHeavyCannon(engineRef.current.mecha1)}
                className="w-20 h-20 rounded-full bg-gradient-to-tr from-orange-500 to-red-500 border border-orange-300 active:scale-95 flex items-center justify-center font-black text-xs uppercase text-black shadow-lg"
              >
                FIRE
              </button>
            </div>
          </div>
        )}

        {/* Comprehensive Glassmorphism Main Menu Interface */}
        {gameState === "menu" && (
          <div className="absolute inset-0 z-40 bg-[#090302]/95 backdrop-blur-2xl flex flex-col p-8 overflow-y-auto">
            {/* Header Banner Visual */}
            <div className="relative w-full h-44 rounded-2xl overflow-hidden border border-orange-500/30 mb-6 flex items-center justify-between p-8 bg-gradient-to-r from-orange-900/60 via-slate-900/80 to-red-900/60 shadow-[0_0_40px_rgba(249,115,22,0.2)]">
              <div className="z-10 max-w-md">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/20 border border-orange-500/40 text-orange-300 text-[10px] font-black uppercase tracking-widest mb-2">
                  <Zap className="w-3.5 h-3.5 text-orange-400 animate-pulse" /> Strict 2,100+ Line Flagship Tactical Mecha Arena
                </div>
                <h1 className="text-5xl font-black uppercase tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-orange-300 via-amber-300 to-red-400 drop-shadow-[0_0_30px_rgba(249,115,22,0.6)]">
                  TITAN
                </h1>
                <p className="text-xs text-orange-100/70 mt-1">
                  Tactical mecha artillery, 12 foundry armory upgrades, online lobbies, and real-time combat analytics.
                </p>
              </div>

              <div className="z-10 flex gap-3">
                <div className="px-4 py-2 rounded-xl bg-black/50 border border-orange-500/30 text-right backdrop-blur-md">
                  <div className="text-[10px] font-mono text-orange-400/60">CITADEL RANK</div>
                  <div className="text-sm font-black text-orange-300">HIGH COMMANDER IV</div>
                </div>
              </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex items-center gap-2 border-b border-white/10 pb-3 mb-6 overflow-x-auto">
              {(["play", "foundry", "online", "leaderboard", "achievements", "analytics", "settings"] as TitanMenuTab[]).map(
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
                        {item.category === "reactor" && <Sparkles className="w-6 h-6" />}
                        {item.category === "radar" && <Compass className="w-6 h-6" />}
                        {item.category === "thruster" && <Activity className="w-6 h-6" />}
                        {item.category === "shield" && <Shield className="w-6 h-6" />}
                      </div>
                      <div>
                        <div className="font-black text-sm text-white">{item.name}</div>
                        <div className="text-xs text-white/50">{item.description}</div>
                        <div className="text-[10px] text-orange-400 font-mono mt-1">{item.statBoost} | LEVEL {item.level} / {item.maxLevel}</div>
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

            {/* TAB CONTENT: ANALYTICS */}
            {activeTab === "analytics" && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-5 rounded-2xl bg-white/5 border border-white/10 flex flex-col gap-2">
                  <div className="text-xs font-mono text-orange-400/70 uppercase">SHOT ACCURACY</div>
                  <div className="text-3xl font-black text-white">
                    {analytics.shotsFired > 0
                      ? Math.round((analytics.shotsHit / analytics.shotsFired) * 100)
                      : 100}
                    %
                  </div>
                </div>

                <div className="p-5 rounded-2xl bg-white/5 border border-white/10 flex flex-col gap-2">
                  <div className="text-xs font-mono text-orange-400/70 uppercase">TOTAL DAMAGE DEALT</div>
                  <div className="text-3xl font-black text-white">{analytics.damageDealt}</div>
                </div>

                <div className="p-5 rounded-2xl bg-white/5 border border-white/10 flex flex-col gap-2">
                  <div className="text-xs font-mono text-orange-400/70 uppercase">MAX COMBO STREAK</div>
                  <div className="text-3xl font-black text-white">{analytics.maxCombo}</div>
                </div>
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

                <div className="p-4 rounded-2xl bg-white/5 border border-white/10 flex justify-between items-center">
                  <span className="text-xs font-bold">Radar Mini-Map</span>
                  <button
                    onClick={() => setSettings((s) => ({ ...s, showRadarMap: !s.showRadarMap }))}
                    className={`px-4 py-1.5 rounded-xl font-bold text-xs ${
                      settings.showRadarMap ? "bg-orange-500 text-black" : "bg-white/10 text-white"
                    }`}
                  >
                    {settings.showRadarMap ? "ON" : "OFF"}
                  </button>
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
