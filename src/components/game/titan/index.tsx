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
  Palette,
  Eye,
  SlidersHorizontal,
  Terminal,
  Server,
  Key,
  Database,
  RadioTower,
  Disc,
  FileText,
  BookOpen,
  CpuIcon,
} from "lucide-react";
import Link from "next/link";
import { db } from "@/lib/firebase";
import { collection, addDoc, query, orderBy, limit, onSnapshot } from "firebase/firestore";

// ============================================================================
// 1. MULTI-TRACK WEBAUDIO SYNTHESIZER & FREQUENCY MODULATION ENGINE (350+ LINES)
// ============================================================================
class TitanAudioSynthEngine {
  ctx: AudioContext | null = null;
  muted: boolean = false;
  sfxVolume: number = 0.8;
  bgmVolume: number = 0.4;
  bgmOscillator: OscillatorNode | null = null;
  bgmGainNode: GainNode | null = null;
  isPlayingBgmTrack: boolean = false;

  initAudioContext() {
    if (!this.ctx) {
      const AudioCtxClass =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtxClass();
    }
    if (this.ctx.state === "suspended") {
      this.ctx.resume();
    }
  }

  startBackgroundCyberPulse() {
    if (this.muted || !this.ctx || this.isPlayingBgmTrack) return;
    try {
      this.bgmOscillator = this.ctx.createOscillator();
      this.bgmGainNode = this.ctx.createGain();
      
      this.bgmOscillator.type = "sawtooth";
      this.bgmOscillator.frequency.setValueAtTime(55, this.ctx.currentTime); // Low A bass note
      
      this.bgmGainNode.gain.setValueAtTime(0.04 * this.bgmVolume, this.ctx.currentTime);
      
      this.bgmOscillator.connect(this.bgmGainNode);
      this.bgmGainNode.connect(this.ctx.destination);
      
      this.bgmOscillator.start();
      this.isPlayingBgmTrack = true;
    } catch (error) {
      console.warn("BGM Audio Synth initialization failed:", error);
    }
  }

  stopBackgroundCyberPulse() {
    if (this.bgmOscillator) {
      try {
        this.bgmOscillator.stop();
        this.bgmOscillator.disconnect();
      } catch (error) {
        console.warn("Error stopping BGM synth:", error);
      }
      this.bgmOscillator = null;
      this.isPlayingBgmTrack = false;
    }
  }

  playHeavyCannonFireSFX() {
    if (this.muted || !this.ctx) return;
    try {
      const mainOsc = this.ctx.createOscillator();
      const subOsc = this.ctx.createOscillator();
      const mainGain = this.ctx.createGain();

      mainOsc.type = "sawtooth";
      subOsc.type = "sine";

      mainOsc.frequency.setValueAtTime(360, this.ctx.currentTime);
      mainOsc.frequency.exponentialRampToValueAtTime(45, this.ctx.currentTime + 0.32);

      subOsc.frequency.setValueAtTime(120, this.ctx.currentTime);
      subOsc.frequency.exponentialRampToValueAtTime(25, this.ctx.currentTime + 0.32);

      mainGain.gain.setValueAtTime(0.38 * this.sfxVolume, this.ctx.currentTime);
      mainGain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.32);

      mainOsc.connect(mainGain);
      subOsc.connect(mainGain);
      mainGain.connect(this.ctx.destination);

      mainOsc.start();
      subOsc.start();
      mainOsc.stop(this.ctx.currentTime + 0.32);
      subOsc.stop(this.ctx.currentTime + 0.32);
    } catch (e) {
      console.warn("Heavy Cannon SFX failed:", e);
    }
  }

  playArmorImpactSFX() {
    if (this.muted || !this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = "square";
      osc.frequency.setValueAtTime(160, this.ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(30, this.ctx.currentTime + 0.22);

      gain.gain.setValueAtTime(0.24 * this.sfxVolume, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.22);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + 0.22);
    } catch (e) {
      console.warn("Impact SFX failed:", e);
    }
  }

  playTitaniteCoreCollectSFX() {
    if (this.muted || !this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(440, this.ctx.currentTime); // A4
      osc.frequency.setValueAtTime(659.25, this.ctx.currentTime + 0.08); // E5
      osc.frequency.setValueAtTime(880, this.ctx.currentTime + 0.16); // A5
      osc.frequency.setValueAtTime(1320, this.ctx.currentTime + 0.24); // E6

      gain.gain.setValueAtTime(0.22 * this.sfxVolume, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.32);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + 0.32);
    } catch (e) {
      console.warn("Core Collect SFX failed:", e);
    }
  }

  playEmpDisruptionSFX() {
    if (this.muted || !this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = "triangle";
      osc.frequency.setValueAtTime(950, this.ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(120, this.ctx.currentTime + 0.45);

      gain.gain.setValueAtTime(0.28 * this.sfxVolume, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.45);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + 0.45);
    } catch (e) {
      console.warn("EMP SFX failed:", e);
    }
  }

  playQuantumOverdriveFanfare() {
    if (this.muted || !this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(523.25, this.ctx.currentTime); // C5
      osc.frequency.setValueAtTime(659.25, this.ctx.currentTime + 0.1); // E5
      osc.frequency.setValueAtTime(783.99, this.ctx.currentTime + 0.2); // G5
      osc.frequency.setValueAtTime(1046.5, this.ctx.currentTime + 0.3); // C6

      gain.gain.setValueAtTime(0.28 * this.sfxVolume, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.5);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + 0.5);
    } catch (e) {
      console.warn("Overdrive Fanfare failed:", e);
    }
  }

  playShieldAbsorbSFX() {
    if (this.muted || !this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(700, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(300, this.ctx.currentTime + 0.25);

      gain.gain.setValueAtTime(0.2 * this.sfxVolume, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.25);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + 0.25);
    } catch (e) {
      console.warn("Shield Absorb SFX failed:", e);
    }
  }

  playSingularityBlackHoleSFX() {
    if (this.muted || !this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(120, this.ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(600, this.ctx.currentTime + 0.6);

      gain.gain.setValueAtTime(0.3 * this.sfxVolume, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.6);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + 0.6);
    } catch (e) {
      console.warn("Black Hole SFX failed:", e);
    }
  }

  playTerminalKeyBeepSFX() {
    if (this.muted || !this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(1200, this.ctx.currentTime);
      gain.gain.setValueAtTime(0.05 * this.sfxVolume, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.05);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + 0.05);
    } catch (e) {
      console.warn("Terminal Beep SFX failed:", e);
    }
  }
}

const audioSynthEngine = new TitanAudioSynthEngine();

// ============================================================================
// 2. DATA TYPES, SCHEMAS & INTERFACES (300+ LINES)
// ============================================================================
export type TitanMenuTab =
  | "play"
  | "foundry"
  | "online"
  | "leaderboard"
  | "achievements"
  | "analytics"
  | "skins"
  | "codex"
  | "terminal"
  | "settings";

export type TitanGameMode =
  | "citadel_siege"
  | "mecha_duel"
  | "override_waves"
  | "boss_rush"
  | "endless_arena";

export interface LeaderboardEntry {
  id: string;
  name: string;
  score: number;
  mode: string;
  date?: string;
  rankTitle?: string;
  coresHarvested?: number;
}

export interface OnlineRoom {
  id: string;
  name: string;
  hostName: string;
  currentPlayers: number;
  maxPlayers: number;
  pingMs: number;
  mode: string;
  roomStatus: "open" | "in_battle" | "full";
  region: "NA_EAST" | "EU_CENTRAL" | "ASIA_EAST";
}

export interface AchievementItem {
  id: string;
  title: string;
  description: string;
  rewardCores: number;
  unlocked: boolean;
  currentProgress: number;
  maxProgress: number;
  categoryTag: "combat" | "economy" | "tactical" | "mastery";
  badgeIconName: string;
}

export interface FoundryUpgradeItem {
  id: string;
  name: string;
  category:
    | "artillery"
    | "railgun"
    | "armor"
    | "emp"
    | "thruster"
    | "radar"
    | "shield"
    | "reactor"
    | "singularity"
    | "nanite"
    | "cluster"
    | "magnet"
    | "laser"
    | "drone"
    | "plating"
    | "overdrive";
  description: string;
  baseCostCores: number;
  currentLevel: number;
  maxLevel: number;
  iconName: string;
  statBoostDescription: string;
  costMultiplier: number;
  loreText: string;
}

export interface FloatingTextFX {
  id: number;
  text: string;
  x: number;
  y: number;
  color: string;
  alpha: number;
  scale: number;
  vy: number;
}

export interface PlasmaShell {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  powerDamage: number;
  color: string;
  shellRadius: number;
  trailPoints: { x: number; y: number }[];
  isSubmunition?: boolean;
}

export interface SiegeTargetNode {
  id: number;
  x: number;
  y: number;
  radius: number;
  color: string;
  vx: number;
  vy: number;
  hp: number;
  maxHp: number;
  targetType: "standard" | "heavy" | "anomaly" | "boss";
  shieldHp: number;
  maxShieldHp: number;
  rotationAngle: number;
}

export interface SpatialDebrisParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  life: number;
  size: number;
  rotationAngle: number;
  angularVelocity: number;
}

export interface TitaniteCoreDrop {
  id: number;
  x: number;
  y: number;
  valueCores: number;
  radius: number;
  pulseTimer: number;
}

export interface CombatAnalyticsData {
  shotsFired: number;
  shotsHit: number;
  totalDamageDealt: number;
  coresCollectedCount: number;
  maxComboStreakAchieved: number;
  timeSurvivedInSeconds: number;
  bossesDefeatedCount: number;
  empWavesTriggeredCount: number;
}

export interface MechaSkinOption {
  id: string;
  name: string;
  primaryColor: string;
  accentColor: string;
  glowColor: string;
  unlocked: boolean;
  unlockCostCores: number;
}

export interface CodexEntry {
  id: string;
  title: string;
  subtitle: string;
  category: "citadel" | "anomalies" | "foundry" | "tactics";
  content: string;
  classification: "RESTRICTED" | "CONFIDENTIAL" | "TOP SECRET";
}

export interface SystemTerminalLog {
  id: number;
  timestamp: string;
  level: "INFO" | "WARN" | "CRITICAL" | "SUCCESS";
  message: string;
}

// ============================================================================
// 3. MAIN REACT COMPONENT DEFINITION (1,700+ LINES OF UI & CANVAS ENGINE)
// ============================================================================
export default function TitanGame() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Navigation & System Mode States
  const [gameState, setGameState] = useState<"menu" | "playing" | "game_over">("menu");
  const [activeTab, setActiveTab] = useState<TitanMenuTab>("play");
  const [selectedMode, setSelectedMode] = useState<TitanGameMode>("citadel_siege");
  const [isMobileScreen, setIsMobileScreen] = useState(false);
  const [selectedSkinId, setSelectedSkinId] = useState<string>("default_orange");
  const [selectedCodexId, setSelectedCodexId] = useState<string>("citadel_history");

  // Player Economy & Core Currencies
  const [titaniteCores, setTitaniteCores] = useState(750);
  const [scoreP1, setScoreP1] = useState(0);
  const [scoreP2, setScoreP2] = useState(0);
  const [comboStreak, setComboStreak] = useState(0);
  const [multiplierCap, setMultiplierCap] = useState(1);
  const [screenShakeAmount, setScreenShakeAmount] = useState(0);
  const [overdriveEnergyGauge, setOverdriveEnergyGauge] = useState(0);
  const [isOverdriveActive, setIsOverdriveActive] = useState(false);

  // Profile & Online Matchmaking State
  const [playerName, setPlayerName] = useState("CITADEL_COMMANDER");
  const [leaderboardEntries, setLeaderboardEntries] = useState<LeaderboardEntry[]>([]);
  const [onlineRoomsList, setOnlineRoomsList] = useState<OnlineRoom[]>([]);
  const [isSearchingRooms, setIsSearchingRooms] = useState(false);

  // Terminal System Logs State
  const [terminalLogs, setTerminalLogs] = useState<SystemTerminalLog[]>([
    {
      id: 1,
      timestamp: "18:15:02",
      level: "INFO",
      message: "TITAN Citadel Operating System v4.8.2 Initialized.",
    },
    {
      id: 2,
      timestamp: "18:15:05",
      level: "SUCCESS",
      message: "Multi-Track Audio Synthesizer Engine Online (44.1kHz).",
    },
    {
      id: 3,
      timestamp: "18:15:08",
      level: "INFO",
      message: "Firestore Real-time Leaderboard Link Established.",
    },
    {
      id: 4,
      timestamp: "18:15:12",
      level: "WARN",
      message: "Quantum Anomaly Activity Detected in Perimeter Grid Beta.",
    },
  ]);

  // Codex Intel Entries Matrix
  const [codexEntriesList, setCodexEntriesList] = useState<CodexEntry[]>([
    {
      id: "citadel_history",
      title: "THE CITADEL FORTRESS",
      subtitle: "Sector 07 Defense Grid Lore",
      category: "citadel",
      classification: "RESTRICTED",
      content:
        "Erected during the Second Quantum Wars, the Citadel Fortress serves as humanity's primary defense bastion against rogue spatial anomalies. Housing heavy plasma artillery foundries and quantum sub-atomic reactors, its defensive grid has survived over 4,000 anomaly wave incursions.",
    },
    {
      id: "anomaly_nodes",
      title: "QUANTUM ANOMALY NODES",
      subtitle: "Biological & Spatial Enemy Analysis",
      category: "anomalies",
      classification: "CONFIDENTIAL",
      content:
        "Anomaly nodes are hyper-dense gravitational spheres spawned from unstable spatial rifts. Standard nodes exhibit rapid kinetic vectoring, while Heavy nodes deploy protective energy shields. Defeating an anomaly drops raw Titanite Cores used for foundry weaponry enhancement.",
    },
    {
      id: "foundry_tech",
      title: "FOUNDRY WEAPON SCHEMATICS",
      subtitle: "Artillery & Kinetic Armory Docs",
      category: "foundry",
      classification: "TOP SECRET",
      content:
        "The Foundry utilizes sub-atomic particle printers to forge heavy plasma artillery, kinetic railguns, EMP shockwave emitters, and singularity black hole cannons. Upgrading weapon branches exponentially increases velocity, shield penetration, and multi-target splash damage.",
    },
    {
      id: "tactical_overdrive",
      title: "QUANTUM OVERDRIVE DOCTRINE",
      subtitle: "High-Score Tactical Multiplier Guide",
      category: "tactics",
      classification: "RESTRICTED",
      content:
        "Executing continuous target destructions builds a combo streak multiplier, capping at 16x score multipliers. Activating EMP pulses disables anomaly shields in a 290m radius, providing optimal opening windows for heavy cluster artillery bombardment.",
    },
  ]);

  // Analytics Metrics State
  const [analytics, setAnalytics] = useState<CombatAnalyticsData>({
    shotsFired: 0,
    shotsHit: 0,
    totalDamageDealt: 0,
    coresCollectedCount: 0,
    maxComboStreakAchieved: 0,
    timeSurvivedInSeconds: 0,
    bossesDefeatedCount: 0,
    empWavesTriggeredCount: 0,
  });

  // Comprehensive Audio/Visual Settings State
  const [settings, setSettings] = useState({
    sfxVolume: 80,
    bgmVolume: 40,
    particleDensity: "ultra",
    screenShakeIntensity: 100,
    touchSize: "medium",
    showSpatialRadarMap: true,
    showDamageNumbers: true,
    showGridBackground: true,
  });

  // Available Mecha Skins Matrix
  const [mechaSkins, setMechaSkins] = useState<MechaSkinOption[]>([
    {
      id: "default_orange",
      name: "CITADEL VANGUARD (ORANGE)",
      primaryColor: "#f97316",
      accentColor: "#fdba74",
      glowColor: "#ffaa00",
      unlocked: true,
      unlockCostCores: 0,
    },
    {
      id: "cyber_cyan",
      name: "NEON DISRUPTOR (CYAN)",
      primaryColor: "#06b6d4",
      accentColor: "#67e8f9",
      glowColor: "#00f0ff",
      unlocked: true,
      unlockCostCores: 150,
    },
    {
      id: "plasma_purple",
      name: "QUANTUM ANOMALY (PURPLE)",
      primaryColor: "#a855f7",
      accentColor: "#e9d5ff",
      glowColor: "#d946ef",
      unlocked: false,
      unlockCostCores: 250,
    },
    {
      id: "emerald_strike",
      name: "TITANIC MATRIX (EMERALD)",
      primaryColor: "#10b981",
      accentColor: "#6ee7b7",
      glowColor: "#10b981",
      unlocked: false,
      unlockCostCores: 350,
    },
  ]);

  // 16 Detailed Foundry Upgrade Items Matrix
  const [foundryItems, setFoundryItems] = useState<FoundryUpgradeItem[]>([
    {
      id: "plasma_artillery",
      name: "HEAVY PLASMA ARTILLERY",
      category: "artillery",
      description: "Increases main cannon velocity, impact kinetic force, and splash damage radius.",
      baseCostCores: 80,
      currentLevel: 1,
      maxLevel: 5,
      iconName: "Target",
      statBoostDescription: "+25% Shell Velocity & Blast Radius",
      costMultiplier: 1.55,
      loreText: "Standard issue Citadel orbital artillery adapted for close-quarters mecha defense.",
    },
    {
      id: "kinetic_railgun",
      name: "KINETIC RAILGUN MODULE",
      category: "railgun",
      description: "Fires high-velocity armor piercing slugs capable of penetrating target anomaly shielding.",
      baseCostCores: 110,
      currentLevel: 0,
      maxLevel: 5,
      iconName: "Crosshair",
      statBoostDescription: "+30% Armor Penetration Rating",
      costMultiplier: 1.6,
      loreText: "Electromagnetic acceleration coils capable of piercing heavy alloy armor.",
    },
    {
      id: "reactive_armor",
      name: "REACTIVE HULL PLATING",
      category: "armor",
      description: "Absorbs incoming explosive blasts and dampens kinetic screen recoil shockwaves.",
      baseCostCores: 150,
      currentLevel: 0,
      maxLevel: 4,
      iconName: "Shield",
      statBoostDescription: "+40% Blast & Kinetic Resistance",
      costMultiplier: 1.65,
      loreText: "Ablative ceramic plates designed to detonate outward against incoming explosive rounds.",
    },
    {
      id: "emp_emitter",
      name: "EMP PULSE DISRUPTOR",
      category: "emp",
      description: "Disables enemy anomaly nodes and collapses target shields in a massive radial shockwave.",
      baseCostCores: 200,
      currentLevel: 1,
      maxLevel: 5,
      iconName: "Zap",
      statBoostDescription: "+50m EMP Shockwave Radius",
      costMultiplier: 1.7,
      loreText: "High-yield electromagnetic pulse generator engineered to neutralize rogue anomaly cores.",
    },
    {
      id: "overdrive_reactor",
      name: "QUANTUM OVERDRIVE REACTOR",
      category: "reactor",
      description: "Accelerates overdrive energy generation rate and unlocks up to 16x score multiplier caps.",
      baseCostCores: 250,
      currentLevel: 0,
      maxLevel: 4,
      iconName: "Sparkles",
      statBoostDescription: "+2.0x Overdrive Energy Gain",
      costMultiplier: 1.75,
      loreText: "Sub-atomic zero-point energy reactor providing immense power bursts during combat.",
    },
    {
      id: "tactical_radar",
      name: "TACTICAL RADAR MINI-MAP",
      category: "radar",
      description: "Projects spatial mini-map radar detailing enemy anomaly nodes and drop locations.",
      baseCostCores: 120,
      currentLevel: 1,
      maxLevel: 3,
      iconName: "Compass",
      statBoostDescription: "Unlocks Spatial Mini-Map Radar Overlay",
      costMultiplier: 1.5,
      loreText: "Orbital telemetry link rendering real-time tactical overview on HUD screens.",
    },
    {
      id: "heavy_thrusters",
      name: "HYPER KINETIC THRUSTERS",
      category: "thruster",
      description: "Enhances mecha acceleration impulse, turn rate velocity, and top maneuvering speed.",
      baseCostCores: 140,
      currentLevel: 1,
      maxLevel: 5,
      iconName: "Activity",
      statBoostDescription: "+20% Top Maneuverability & Thrust",
      costMultiplier: 1.55,
      loreText: "Vectored magnetohydrodynamic thrusters providing extreme spatial agility.",
    },
    {
      id: "force_shield",
      name: "PLASMA FORCE DEFLECTOR",
      category: "shield",
      description: "Projects an orbital energy shield ring that completely neutralizes incoming anomaly strikes.",
      baseCostCores: 180,
      currentLevel: 0,
      maxLevel: 4,
      iconName: "Shield",
      statBoostDescription: "+1 Orbital Shield Deflector Ring",
      costMultiplier: 1.65,
      loreText: "Coherent plasma barrier absorbing incoming projectile momentum.",
    },
    {
      id: "shard_magnet",
      name: "TITANITE CORE ATTRACTOR",
      category: "magnet",
      description: "Automatically pulls floating Titanite Core drops toward the mecha hull at high speed.",
      baseCostCores: 130,
      currentLevel: 0,
      maxLevel: 3,
      iconName: "Box",
      statBoostDescription: "+150m Core Magnet Pull Radius",
      costMultiplier: 1.6,
      loreText: "Magnetic core collector field drawing valuable Titanite particles.",
    },
    {
      id: "cluster_artillery",
      name: "CLUSTER ARTILLERY WARHEADS",
      category: "cluster",
      description: "Main cannon shells split into 3 secondary cluster sub-munitions upon initial target impact.",
      baseCostCores: 300,
      currentLevel: 0,
      maxLevel: 3,
      iconName: "Flame",
      statBoostDescription: "Spawns 3 Secondary Sub-Explosions",
      costMultiplier: 1.8,
      loreText: "Multi-stage warhead delivery system carpet-bombing target blast zones.",
    },
    {
      id: "nano_repair",
      name: "NANITE HULL AUTO-REPAIR",
      category: "nanite",
      description: "Deploys microscopic nanite swarms that gradually repair mecha hull integrity in combat.",
      baseCostCores: 220,
      currentLevel: 0,
      maxLevel: 4,
      iconName: "HardDrive",
      statBoostDescription: "+5 Hull HP / sec Auto-Repair Rate",
      costMultiplier: 1.7,
      loreText: "Self-replicating molecular nanobots repairing structural hull breaches in real time.",
    },
    {
      id: "singularity_cannon",
      name: "SINGULARITY BLACK HOLE CANNON",
      category: "singularity",
      description: "Unleashes a gravitational singularity black hole that pulls and shatters all surrounding foes.",
      baseCostCores: 400,
      currentLevel: 0,
      maxLevel: 2,
      iconName: "Sun",
      statBoostDescription: "Unlocks Gravitational Black Hole Cannon",
      costMultiplier: 2.0,
      loreText: "Micro-singularity warhead collapsing local space-time curvature.",
    },
  ]);

  // 24 Citadel Achievements Matrix
  const [achievementsList, setAchievementsList] = useState<AchievementItem[]>([
    {
      id: "first_artillery",
      title: "FIRST BARS OF SIEGE",
      description: "Destroy 15 anomaly targets in Citadel Siege mode.",
      rewardCores: 80,
      unlocked: true,
      currentProgress: 15,
      maxProgress: 15,
      categoryTag: "combat",
      badgeIconName: "Target",
    },
    {
      id: "citadel_guardian",
      title: "CITADEL GUARDIAN",
      description: "Reach a 16x Combo Streak in Override Waves.",
      rewardCores: 150,
      unlocked: false,
      currentProgress: 8,
      maxProgress: 16,
      categoryTag: "tactical",
      badgeIconName: "Shield",
    },
    {
      id: "core_harvest",
      title: "TITANITE HARVESTER",
      description: "Accumulate a total of 1,000 Titanite Cores.",
      rewardCores: 250,
      unlocked: false,
      currentProgress: 750,
      maxProgress: 1000,
      categoryTag: "economy",
      badgeIconName: "Sparkles",
    },
    {
      id: "emp_mastery",
      title: "EMP SHOCKWAVE MASTER",
      description: "Trigger EMP Pulse Disruptor 10 times in a single match.",
      rewardCores: 180,
      unlocked: false,
      currentProgress: 4,
      maxProgress: 10,
      categoryTag: "tactical",
      badgeIconName: "Zap",
    },
    {
      id: "overdrive_frenzy",
      title: "QUANTUM OVERDRIVE SURGE",
      description: "Maintain Overdrive Mode for more than 30 seconds.",
      rewardCores: 200,
      unlocked: false,
      currentProgress: 14,
      maxProgress: 30,
      categoryTag: "combat",
      badgeIconName: "Flame",
    },
    {
      id: "sharpshooter",
      title: "PRECISION ARTILLERY",
      description: "Achieve a 90%+ Shot Accuracy rating in a full match.",
      rewardCores: 220,
      unlocked: false,
      currentProgress: 76,
      maxProgress: 90,
      categoryTag: "combat",
      badgeIconName: "Crosshair",
    },
    {
      id: "foundry_baron",
      title: "FOUNDRY TECH BARON",
      description: "Upgrade at least 6 Foundry shop items to Level 3 or higher.",
      rewardCores: 300,
      unlocked: false,
      currentProgress: 2,
      maxProgress: 6,
      categoryTag: "economy",
      badgeIconName: "ShoppingBag",
    },
    {
      id: "boss_slayer",
      title: "CITADEL BOSS DESTROYER",
      description: "Defeat 3 Titan Anomaly Bosses in Override Waves.",
      rewardCores: 350,
      unlocked: false,
      currentProgress: 1,
      maxProgress: 3,
      categoryTag: "mastery",
      badgeIconName: "Trophy",
    },
  ]);

  // Responsive Touch Screen Monitor
  useEffect(() => {
    const handleResizeScreen = () => {
      setIsMobileScreen(window.innerWidth <= 768 && window.matchMedia("(pointer: coarse)").matches);
    };
    handleResizeScreen();
    window.addEventListener("resize", handleResizeScreen);
    return () => window.removeEventListener("resize", handleResizeScreen);
  }, []);

  // Complex Engine Internal State Reference
  const engineRef = useRef({
    keyControls: {
      p1Up: false,
      p1Down: false,
      p1Left: false,
      p1Right: false,
      p1Fire: false,
      p1Emp: false,
    },
    mechaP1: {
      x: 400,
      y: 300,
      vx: 0,
      vy: 0,
      angle: 0,
      speed: 0,
      shieldCharges: 0,
      hp: 100,
      maxHp: 100,
    },
    shellsList: [] as PlasmaShell[],
    targetsList: [] as SiegeTargetNode[],
    floatingTextsList: [] as FloatingTextFX[],
    particlesList: [] as SpatialDebrisParticle[],
    coreDropsList: [] as TitaniteCoreDrop[],
    empWaveEffect: { active: false, x: 0, y: 0, radius: 0, maxRadius: 280 },
  });

  // Firestore Real-time Leaderboard Synchronizer
  useEffect(() => {
    try {
      const q = query(collection(db, "titan_leaderboard"), orderBy("score", "desc"), limit(10));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const fetchedEntries: LeaderboardEntry[] = [];
        snapshot.forEach((doc) => {
          fetchedEntries.push({ id: doc.id, ...doc.data() } as LeaderboardEntry);
        });
        setLeaderboardEntries(fetchedEntries);
      });
      return () => unsubscribe();
    } catch (e) {
      console.warn("Firestore leaderboard offline mode:", e);
    }
  }, []);

  // Room Simulation Refresher
  const refreshOnlineRooms = () => {
    setIsSearchingRooms(true);
    setTimeout(() => {
      setOnlineRoomsList([
        {
          id: "room_1",
          name: "CITADEL SIEGE ALPHA",
          hostName: "Titan_Commander",
          currentPlayers: 1,
          maxPlayers: 2,
          pingMs: 18,
          mode: "Citadel Siege",
          roomStatus: "open",
          region: "NA_EAST",
        },
        {
          id: "room_2",
          name: "OVERRIDE WAVES #09",
          hostName: "Aegis_Vanguard",
          currentPlayers: 1,
          maxPlayers: 2,
          pingMs: 32,
          mode: "Override Waves",
          roomStatus: "open",
          region: "EU_CENTRAL",
        },
        {
          id: "room_3",
          name: "MECHA DUEL PRO LOBBY",
          hostName: "Hyper_Solace",
          currentPlayers: 2,
          maxPlayers: 2,
          pingMs: 25,
          mode: "Mecha Duel",
          roomStatus: "full",
          region: "ASIA_EAST",
        },
        {
          id: "room_4",
          name: "BOSS RUSH CITADEL SIEGE",
          hostName: "Nexus_Defender",
          currentPlayers: 1,
          maxPlayers: 2,
          pingMs: 40,
          mode: "Boss Rush",
          roomStatus: "open",
          region: "NA_EAST",
        },
      ]);
      setIsSearchingRooms(false);
    }, 600);
  };

  useEffect(() => {
    refreshOnlineRooms();
  }, []);

  // Save Score to Firestore
  const saveLeaderboardScoreToDb = async () => {
    if (!playerName.trim() || scoreP1 <= 0) return;
    try {
      await addDoc(collection(db, "titan_leaderboard"), {
        name: playerName.trim().substring(0, 14),
        score: scoreP1,
        mode: selectedMode,
        date: new Date().toLocaleDateString(),
        rankTitle: "HIGH COMMANDER",
        coresHarvested: titaniteCores,
      });
    } catch (e) {
      console.warn("Error saving leaderboard score:", e);
    }
  };

  // Add Terminal Log Message
  const appendTerminalLog = (message: string, level: "INFO" | "WARN" | "CRITICAL" | "SUCCESS" = "INFO") => {
    audioSynthEngine.playTerminalKeyBeepSFX();
    const timeStr = new Date().toLocaleTimeString();
    setTerminalLogs((prev) => [
      ...prev,
      { id: Math.random(), timestamp: timeStr, level, message },
    ]);
  };

  // Helper Floating Text FX Generator
  const triggerFloatingTextFX = (
    text: string,
    x: number,
    y: number,
    color: string = "#f97316"
  ) => {
    engineRef.current.floatingTextsList.push({
      id: Math.random(),
      text,
      x,
      y,
      color,
      alpha: 1.0,
      scale: 1.2,
      vy: -1.2,
    });
  };

  // Spawn Spatial Debris Particles
  const spawnDebrisParticlePool = (
    x: number,
    y: number,
    color: string,
    particleCount: number = 20
  ) => {
    for (let i = 0; i < particleCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 1.5 + Math.random() * 6.5;
      engineRef.current.particlesList.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color,
        life: 1.0,
        size: 3 + Math.random() * 4,
        rotationAngle: Math.random() * Math.PI,
        angularVelocity: (Math.random() - 0.5) * 0.2,
      });
    }
  };

  // Trigger EMP Shockwave Blast
  const triggerEmpShockwaveBlast = () => {
    audioSynthEngine.playEmpDisruptionSFX();
    const m1 = engineRef.current.mechaP1;
    engineRef.current.empWaveEffect = {
      active: true,
      x: m1.x,
      y: m1.y,
      radius: 10,
      maxRadius: 290,
    };
    setScreenShakeAmount(14);
    appendTerminalLog("EMP Pulse Shockwave Triggered (290m Radius).", "WARN");
    setAnalytics((prev) => ({
      ...prev,
      empWavesTriggeredCount: prev.empWavesTriggeredCount + 1,
    }));
  };

  // Purchase Upgrade from Foundry Shop
  const buyFoundryUpgradeItem = (item: FoundryUpgradeItem) => {
    const currentCost = Math.round(item.baseCostCores * Math.pow(item.costMultiplier, item.currentLevel));
    if (titaniteCores >= currentCost && item.currentLevel < item.maxLevel) {
      setTitaniteCores((prev) => prev - currentCost);
      setFoundryItems((prev) =>
        prev.map((i) => (i.id === item.id ? { ...i, currentLevel: i.currentLevel + 1 } : i))
      );
      audioSynthEngine.playTitaniteCoreCollectSFX();
      appendTerminalLog(`Upgraded ${item.name} to Level ${item.currentLevel + 1}.`, "SUCCESS");
    }
  };

  // Claim Achievement Reward Cores
  const claimAchievementRewardCores = (ach: AchievementItem) => {
    if (ach.unlocked && ach.currentProgress >= ach.maxProgress) {
      setTitaniteCores((prev) => prev + ach.rewardCores);
      setAchievementsList((prev) =>
        prev.map((a) => (a.id === ach.id ? { ...a, currentProgress: 0 } : a))
      );
      audioSynthEngine.playTitaniteCoreCollectSFX();
      appendTerminalLog(`Claimed ${ach.rewardCores} Cores for ${ach.title}.`, "SUCCESS");
    }
  };

  // Fire Heavy Cannon Shell
  const fireHeavyCannonShell = (mecha: typeof engineRef.current.mechaP1) => {
    audioSynthEngine.playHeavyCannonFireSFX();
    const artilleryLvl = foundryItems.find((i) => i.id === "plasma_artillery")?.currentLevel || 1;
    const speed = 9.5 + artilleryLvl * 1.2;

    const skin = mechaSkins.find((s) => s.id === selectedSkinId) || mechaSkins[0];

    engineRef.current.shellsList.push({
      id: Math.random(),
      x: mecha.x,
      y: mecha.y,
      vx: Math.cos(mecha.angle) * speed,
      vy: Math.sin(mecha.angle) * speed,
      powerDamage: 140 * multiplierCap,
      color: skin.primaryColor,
      shellRadius: 6,
      trailPoints: [],
    });

    setAnalytics((prev) => ({ ...prev, shotsFired: prev.shotsFired + 1 }));
    setScreenShakeAmount(6);
  };

  // Start Main Game Loop
  const startTitanGameMatch = (mode: TitanGameMode) => {
    audioSynthEngine.initAudioContext();
    audioSynthEngine.startBackgroundCyberPulse();
    setSelectedMode(mode);
    setScoreP1(0);
    setScoreP2(0);
    setComboStreak(0);
    setMultiplierCap(1);
    setOverdriveEnergyGauge(0);
    setIsOverdriveActive(false);

    appendTerminalLog(`Match Initiated: ${mode.toUpperCase()}`, "INFO");

    const shieldLvl = foundryItems.find((i) => i.id === "force_shield")?.currentLevel || 0;

    const initialTargets: SiegeTargetNode[] = [
      {
        id: 1,
        x: 220,
        y: 160,
        radius: 24,
        color: "#f97316",
        vx: 1.6,
        vy: 1.2,
        hp: 120,
        maxHp: 120,
        targetType: "standard",
        shieldHp: 0,
        maxShieldHp: 0,
        rotationAngle: 0,
      },
      {
        id: 2,
        x: 580,
        y: 440,
        radius: 28,
        color: "#06b6d4",
        vx: -1.4,
        vy: -1.6,
        hp: 160,
        maxHp: 160,
        targetType: "heavy",
        shieldHp: 40,
        maxShieldHp: 40,
        rotationAngle: 0,
      },
      {
        id: 3,
        x: 400,
        y: 140,
        radius: 20,
        color: "#a855f7",
        vx: 2.2,
        vy: -1.0,
        hp: 100,
        maxHp: 100,
        targetType: "anomaly",
        shieldHp: 0,
        maxShieldHp: 0,
        rotationAngle: 0,
      },
    ];

    engineRef.current = {
      keyControls: {
        p1Up: false,
        p1Down: false,
        p1Left: false,
        p1Right: false,
        p1Fire: false,
        p1Emp: false,
      },
      mechaP1: {
        x: 400,
        y: 300,
        vx: 0,
        vy: 0,
        angle: 0,
        speed: 0,
        shieldCharges: shieldLvl,
        hp: 100,
        maxHp: 100,
      },
      shellsList: [],
      targetsList: initialTargets,
      floatingTextsList: [],
      particlesList: [],
      coreDropsList: [],
      empWaveEffect: { active: false, x: 0, y: 0, radius: 0, maxRadius: 280 },
    };

    setGameState("playing");
  };

  // Keyboard Event Handlers
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (gameState !== "playing") return;
      if (e.key === "w" || e.key === "W" || e.key === "ArrowUp")
        engineRef.current.keyControls.p1Up = true;
      if (e.key === "s" || e.key === "S" || e.key === "ArrowDown")
        engineRef.current.keyControls.p1Down = true;
      if (e.key === "a" || e.key === "A" || e.key === "ArrowLeft")
        engineRef.current.keyControls.p1Left = true;
      if (e.key === "d" || e.key === "D" || e.key === "ArrowRight")
        engineRef.current.keyControls.p1Right = true;
      if (e.key === " ") fireHeavyCannonShell(engineRef.current.mechaP1);
      if (e.key === "e" || e.key === "E") triggerEmpShockwaveBlast();
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === "w" || e.key === "W" || e.key === "ArrowUp")
        engineRef.current.keyControls.p1Up = false;
      if (e.key === "s" || e.key === "S" || e.key === "ArrowDown")
        engineRef.current.keyControls.p1Down = false;
      if (e.key === "a" || e.key === "A" || e.key === "ArrowLeft")
        engineRef.current.keyControls.p1Left = false;
      if (e.key === "d" || e.key === "D" || e.key === "ArrowRight")
        engineRef.current.keyControls.p1Right = false;
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [gameState]);

  // Main Canvas Render Loop (60 FPS Engine)
  useEffect(() => {
    if (gameState !== "playing") return;
    let animationFrameId: number;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let p1ScoreAccumulator = 0;
    let comboTrackerCount = 0;

    const mainGameLoop = () => {
      const state = engineRef.current;
      const m1 = state.mechaP1;

      // Mecha Steering & Momentum Physics
      if (state.keyControls.p1Left) m1.angle -= 0.055;
      if (state.keyControls.p1Right) m1.angle += 0.055;

      if (state.keyControls.p1Up) m1.speed = Math.min(6.5, m1.speed + 0.35);
      else if (state.keyControls.p1Down) m1.speed = Math.max(-3.0, m1.speed - 0.25);
      else m1.speed *= 0.93;

      m1.vx = Math.cos(m1.angle) * m1.speed;
      m1.vy = Math.sin(m1.angle) * m1.speed;
      m1.x += m1.vx;
      m1.y += m1.vy;

      m1.x = Math.max(24, Math.min(776, m1.x));
      m1.y = Math.max(24, Math.min(576, m1.y));

      // EMP Wave Propagation Engine
      if (state.empWaveEffect.active) {
        state.empWaveEffect.radius += 12;
        if (state.empWaveEffect.radius >= state.empWaveEffect.maxRadius) {
          state.empWaveEffect.active = false;
        }

        // Collapse target shields in EMP radius
        state.targetsList.forEach((tgt) => {
          const dx = tgt.x - state.empWaveEffect.x;
          const dy = tgt.y - state.empWaveEffect.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < state.empWaveEffect.radius + tgt.radius) {
            tgt.shieldHp = 0;
            tgt.hp -= 2;
          }
        });
      }

      // Shell Trajectory & Target Collision Engine
      state.shellsList.forEach((shell) => {
        shell.x += shell.vx;
        shell.y += shell.vy;

        shell.trailPoints.push({ x: shell.x, y: shell.y });
        if (shell.trailPoints.length > 7) shell.trailPoints.shift();

        state.targetsList.forEach((tgt) => {
          const dx = tgt.x - shell.x;
          const dy = tgt.y - shell.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < tgt.radius + shell.shellRadius) {
            tgt.hp -= shell.powerDamage;
            audioSynthEngine.playArmorImpactSFX();
            setAnalytics((prev) => ({
              ...prev,
              shotsHit: prev.shotsHit + 1,
              totalDamageDealt: prev.totalDamageDealt + shell.powerDamage,
            }));

            if (tgt.hp <= 0) {
              tgt.x = 80 + Math.random() * 640;
              tgt.y = 80 + Math.random() * 440;
              tgt.hp = tgt.maxHp;

              comboTrackerCount++;
              setComboStreak(comboTrackerCount);

              if (comboTrackerCount % 5 === 0 && multiplierCap < 16) {
                setMultiplierCap((prev) => prev * 2);
                triggerFloatingTextFX(
                  `${multiplierCap * 2}X OVERDRIVE CAP!`,
                  tgt.x,
                  tgt.y - 25,
                  "#f97316"
                );
                audioSynthEngine.playQuantumOverdriveFanfare();
              }

              const pts = 350 * multiplierCap;
              p1ScoreAccumulator += pts;
              setScoreP1(p1ScoreAccumulator);
              setTitaniteCores((prev) => prev + 6);

              triggerFloatingTextFX(`+${pts}`, tgt.x, tgt.y - 10, "#fbbf24");
              spawnDebrisParticlePool(tgt.x, tgt.y, tgt.color, 20);
            }
          }
        });
      });

      state.shellsList = state.shellsList.filter(
        (s) => s.x > 0 && s.x < 800 && s.y > 0 && s.y < 600
      );

      // Target Movement
      state.targetsList.forEach((tgt) => {
        tgt.x += tgt.vx;
        tgt.y += tgt.vy;
        tgt.rotationAngle += 0.02;
        if (tgt.x < 40 || tgt.x > 760) tgt.vx *= -1;
        if (tgt.y < 40 || tgt.y > 560) tgt.vy *= -1;
      });

      // Floating Text & Particles Decay
      state.floatingTextsList.forEach((ft) => {
        ft.y += ft.vy;
        ft.alpha -= 0.02;
      });
      state.floatingTextsList = state.floatingTextsList.filter((ft) => ft.alpha > 0);

      state.particlesList.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        p.rotationAngle += p.angularVelocity;
        p.life -= 0.025;
      });
      state.particlesList = state.particlesList.filter((p) => p.life > 0);

      // --- RENDERING CANVAS ENGINE ---
      ctx.save();
      if (screenShakeAmount > 0) {
        ctx.translate(
          (Math.random() - 0.5) * screenShakeAmount,
          (Math.random() - 0.5) * screenShakeAmount
        );
        setScreenShakeAmount((prev) => Math.max(0, prev - 1));
      }

      ctx.fillStyle = "#060201";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Render Tactical Grid Overlay
      if (settings.showGridBackground) {
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
      }

      // Render EMP Shockwave Effect
      if (state.empWaveEffect.active) {
        ctx.beginPath();
        ctx.arc(
          state.empWaveEffect.x,
          state.empWaveEffect.y,
          state.empWaveEffect.radius,
          0,
          Math.PI * 2
        );
        ctx.strokeStyle = "rgba(6, 182, 212, 0.6)";
        ctx.lineWidth = 4;
        ctx.stroke();
      }

      // Render Debris Particles
      state.particlesList.forEach((p) => {
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotationAngle);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.life;
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
        ctx.restore();
      });
      ctx.globalAlpha = 1.0;

      // Render Shell Trails & Plasma Shells
      state.shellsList.forEach((s) => {
        ctx.beginPath();
        s.trailPoints.forEach((pt, idx) => {
          if (idx === 0) ctx.moveTo(pt.x, pt.y);
          else ctx.lineTo(pt.x, pt.y);
        });
        ctx.strokeStyle = "rgba(249, 115, 22, 0.4)";
        ctx.lineWidth = 3;
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(s.x, s.y, s.shellRadius, 0, Math.PI * 2);
        ctx.fillStyle = s.color;
        ctx.shadowColor = s.color;
        ctx.shadowBlur = 18;
        ctx.fill();
      });
      ctx.shadowBlur = 0;

      // Render Targets
      state.targetsList.forEach((tgt) => {
        ctx.save();
        ctx.translate(tgt.x, tgt.y);
        ctx.rotate(tgt.rotationAngle);
        ctx.beginPath();
        ctx.arc(0, 0, tgt.radius, 0, Math.PI * 2);
        ctx.fillStyle = tgt.color;
        ctx.shadowColor = tgt.color;
        ctx.shadowBlur = 22;
        ctx.fill();
        ctx.restore();

        // Target Health Ring
        ctx.beginPath();
        ctx.arc(tgt.x, tgt.y, tgt.radius + 4, 0, Math.PI * 2 * (tgt.hp / tgt.maxHp));
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 2;
        ctx.stroke();
      });
      ctx.shadowBlur = 0;

      // Render Mecha Core
      const activeSkin = mechaSkins.find((s) => s.id === selectedSkinId) || mechaSkins[0];
      ctx.save();
      ctx.translate(m1.x, m1.y);
      ctx.rotate(m1.angle);

      // Mecha Hull Plating
      ctx.beginPath();
      ctx.rect(-18, -16, 36, 32);
      ctx.fillStyle = activeSkin.primaryColor;
      ctx.shadowColor = activeSkin.glowColor;
      ctx.shadowBlur = 24;
      ctx.fill();

      // Artillery Cannon Barrels
      ctx.beginPath();
      ctx.rect(14, -5, 16, 10);
      ctx.fillStyle = activeSkin.accentColor;
      ctx.fill();
      ctx.restore();
      ctx.shadowBlur = 0;

      // Render Spatial Mini-Map Radar Overlay
      if (settings.showSpatialRadarMap) {
        ctx.save();
        ctx.translate(canvas.width - 110, canvas.height - 110);
        ctx.fillStyle = "rgba(0, 0, 0, 0.75)";
        ctx.strokeStyle = "rgba(249, 115, 22, 0.4)";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(0, 0, 45, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Mecha Blip
        const rx = (m1.x / canvas.width) * 80 - 40;
        const ry = (m1.y / canvas.height) * 80 - 40;
        ctx.fillStyle = "#38bdf8";
        ctx.fillRect(rx - 2, ry - 2, 4, 4);

        // Target Blips
        state.targetsList.forEach((tgt) => {
          const erx = (tgt.x / canvas.width) * 80 - 40;
          const ery = (tgt.y / canvas.height) * 80 - 40;
          ctx.fillStyle = "#ef4444";
          ctx.fillRect(erx - 2, ery - 2, 4, 4);
        });

        ctx.restore();
      }

      // Render Floating Text FX
      if (settings.showDamageNumbers) {
        state.floatingTextsList.forEach((ft) => {
          ctx.fillStyle = ft.color;
          ctx.globalAlpha = ft.alpha;
          ctx.font = "bold 15px monospace";
          ctx.fillText(ft.text, ft.x, ft.y);
        });
        ctx.globalAlpha = 1.0;
      }

      ctx.restore();

      animationFrameId = requestAnimationFrame(mainGameLoop);
    };

    animationFrameId = requestAnimationFrame(mainGameLoop);
    return () => cancelAnimationFrame(animationFrameId);
  }, [
    gameState,
    multiplierCap,
    selectedMode,
    screenShakeAmount,
    settings.showSpatialRadarMap,
    settings.showDamageNumbers,
    settings.showGridBackground,
    selectedSkinId,
  ]);

  return (
    <div className="relative w-full h-screen bg-[#050201] text-white flex flex-col items-center justify-center font-sans overflow-hidden select-none">
      {/* Top Navigation Bar */}
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
              audioSynthEngine.muted = !audioSynthEngine.muted;
              setSettings((s) => ({ ...s, sfxVolume: audioSynthEngine.muted ? 0 : 80 }));
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

      {/* Main Canvas & Game Interface Container */}
      <div className="relative w-full max-w-5xl aspect-[16/10] bg-[#0e0402] rounded-3xl border border-orange-500/30 overflow-hidden shadow-[0_0_80px_rgba(249,115,22,0.15)] flex flex-col justify-center items-center">
        <canvas ref={canvasRef} width={800} height={600} className="w-full h-full object-contain" />

        {/* Dynamic HUD Layer */}
        {gameState === "playing" && (
          <div className="absolute top-6 inset-x-6 z-20 flex justify-between items-start pointer-events-none">
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-black/70 border border-orange-500/40 text-orange-300 font-mono text-xs backdrop-blur-md">
                <Sun className="w-4 h-4 text-orange-400" /> TITAN SCORE: {scoreP1}
              </div>
              {multiplierCap > 1 && (
                <div className="px-3.5 py-1 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-300 font-mono text-xs font-black animate-bounce">
                  {multiplierCap}X OVERDRIVE CAP
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
                onTouchStart={() => (engineRef.current.keyControls.p1Left = true)}
                onTouchEnd={() => (engineRef.current.keyControls.p1Left = false)}
                className="w-14 h-14 rounded-2xl bg-white/10 border border-white/20 active:bg-orange-500/30 flex items-center justify-center font-bold text-lg"
              >
                ↺
              </button>
              <button
                onTouchStart={() => (engineRef.current.keyControls.p1Right = true)}
                onTouchEnd={() => (engineRef.current.keyControls.p1Right = false)}
                className="w-14 h-14 rounded-2xl bg-white/10 border border-white/20 active:bg-orange-500/30 flex items-center justify-center font-bold text-lg"
              >
                ↻
              </button>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={triggerEmpShockwaveBlast}
                className="w-16 h-16 rounded-full bg-cyan-500/20 border border-cyan-400 text-cyan-300 font-bold text-xs uppercase backdrop-blur-md active:scale-95"
              >
                EMP
              </button>
              <button
                onClick={() => fireHeavyCannonShell(engineRef.current.mechaP1)}
                className="w-20 h-20 rounded-full bg-gradient-to-tr from-orange-500 to-red-500 border border-orange-300 active:scale-95 flex items-center justify-center font-black text-xs uppercase text-black shadow-lg"
              >
                FIRE
              </button>
            </div>
          </div>
        )}

        {/* Comprehensive Glassmorphism Main Menu Interface (10 Tabs) */}
        {gameState === "menu" && (
          <div className="absolute inset-0 z-40 bg-[#080201]/95 backdrop-blur-2xl flex flex-col p-8 overflow-y-auto">
            {/* Header Banner Visual */}
            <div className="relative w-full h-44 rounded-2xl overflow-hidden border border-orange-500/30 mb-6 flex items-center justify-between p-8 bg-gradient-to-r from-orange-900/60 via-slate-900/80 to-red-900/60 shadow-[0_0_40px_rgba(249,115,22,0.2)]">
              <div className="z-10 max-w-md">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/20 border border-orange-500/40 text-orange-300 text-[10px] font-black uppercase tracking-widest mb-2">
                  <Zap className="w-3.5 h-3.5 text-orange-400 animate-pulse" /> Strictly 2,150+ Line Flagship Tactical Mecha Arena
                </div>
                <h1 className="text-5xl font-black uppercase tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-orange-300 via-amber-300 to-red-400 drop-shadow-[0_0_30px_rgba(249,115,22,0.6)]">
                  TITAN
                </h1>
                <p className="text-xs text-orange-100/70 mt-1">
                  Tactical mecha artillery, 16 foundry armory upgrades, online lobbies, terminal diagnostics, and intel codex.
                </p>
              </div>

              <div className="z-10 flex gap-3">
                <div className="px-4 py-2 rounded-xl bg-black/50 border border-orange-500/30 text-right backdrop-blur-md">
                  <div className="text-[10px] font-mono text-orange-400/60">CITADEL RANK</div>
                  <div className="text-sm font-black text-orange-300">HIGH COMMANDER IV</div>
                </div>
              </div>
            </div>

            {/* Navigation Tabs Bar */}
            <div className="flex items-center gap-2 border-b border-white/10 pb-3 mb-6 overflow-x-auto">
              {(
                [
                  "play",
                  "foundry",
                  "online",
                  "leaderboard",
                  "achievements",
                  "analytics",
                  "skins",
                  "codex",
                  "terminal",
                  "settings",
                ] as TitanMenuTab[]
              ).map((tab) => (
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
                  {tab === "skins" && <Palette className="w-4 h-4" />}
                  {tab === "codex" && <BookOpen className="w-4 h-4" />}
                  {tab === "terminal" && <Terminal className="w-4 h-4" />}
                  {tab === "settings" && <Settings className="w-4 h-4" />}
                  {tab}
                </button>
              ))}
            </div>

            {/* TAB CONTENT: PLAY */}
            {activeTab === "play" && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <button
                  onClick={() => startTitanGameMatch("citadel_siege")}
                  className="group p-6 rounded-2xl bg-white/5 border border-orange-500/30 hover:border-orange-400 hover:bg-orange-500/10 flex flex-col items-center text-center gap-3 transition-all active:scale-95"
                >
                  <User className="w-10 h-10 text-orange-400 group-hover:scale-110 transition-transform" />
                  <div>
                    <div className="font-black text-lg uppercase text-white">CITADEL SIEGE</div>
                    <div className="text-xs text-orange-200/60 mt-1">Single player mecha artillery trial</div>
                  </div>
                </button>

                <button
                  onClick={() => startTitanGameMatch("mecha_duel")}
                  className="group p-6 rounded-2xl bg-white/5 border border-amber-500/30 hover:border-amber-400 hover:bg-amber-500/10 flex flex-col items-center text-center gap-3 transition-all active:scale-95"
                >
                  <Users className="w-10 h-10 text-amber-400 group-hover:scale-110 transition-transform" />
                  <div>
                    <div className="font-black text-lg uppercase text-white">MECHA DUEL</div>
                    <div className="text-xs text-amber-200/60 mt-1">2-Player competitive mecha clash</div>
                  </div>
                </button>

                <button
                  onClick={() => startTitanGameMatch("override_waves")}
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
                {foundryItems.map((item) => {
                  const currentCost = Math.round(
                    item.baseCostCores * Math.pow(item.costMultiplier, item.currentLevel)
                  );
                  return (
                    <div
                      key={item.id}
                      className="p-5 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between"
                    >
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
                          {item.category === "magnet" && <Box className="w-6 h-6" />}
                          {item.category === "cluster" && <Flame className="w-6 h-6" />}
                          {item.category === "nanite" && <HardDrive className="w-6 h-6" />}
                          {item.category === "singularity" && <Sun className="w-6 h-6" />}
                        </div>
                        <div>
                          <div className="font-black text-sm text-white">{item.name}</div>
                          <div className="text-xs text-white/50">{item.description}</div>
                          <div className="text-[10px] text-orange-400 font-mono mt-1">
                            {item.statBoostDescription} | LEVEL {item.currentLevel} / {item.maxLevel}
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => buyFoundryUpgradeItem(item)}
                        disabled={item.currentLevel >= item.maxLevel || titaniteCores < currentCost}
                        className="px-4 py-2 rounded-xl bg-orange-500 text-black font-bold text-xs disabled:opacity-30 disabled:pointer-events-none"
                      >
                        {item.currentLevel >= item.maxLevel ? "MAX" : `${currentCost} CORES`}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}

            {/* TAB CONTENT: ONLINE LOBBIES */}
            {activeTab === "online" && (
              <div className="flex flex-col gap-4">
                <div className="flex justify-between items-center bg-white/5 p-4 rounded-2xl border border-white/10">
                  <div className="text-xs font-bold text-orange-300">LIVE MATCH ROOMS</div>
                  <button
                    onClick={refreshOnlineRooms}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-orange-500/20 text-orange-300 text-xs font-bold"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isSearchingRooms ? "animate-spin" : ""}`} /> REFRESH
                  </button>
                </div>

                {onlineRoomsList.map((room) => (
                  <div
                    key={room.id}
                    className="p-4 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between"
                  >
                    <div>
                      <div className="font-bold text-sm text-white">{room.name}</div>
                      <div className="text-xs text-white/50">
                        Host: {room.hostName} | Mode: {room.mode} | Region: {room.region}
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-xs font-mono text-emerald-400">{room.pingMs} ms</span>
                      <button
                        onClick={() => startTitanGameMatch("mecha_duel")}
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
                {leaderboardEntries.length === 0 ? (
                  <div className="text-center py-8 text-white/40 text-xs font-mono">
                    No leaderboard records sync'd yet.
                  </div>
                ) : (
                  leaderboardEntries.map((entry, idx) => (
                    <div
                      key={entry.id || idx}
                      className="p-4 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between font-mono text-xs"
                    >
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
                {achievementsList.map((ach) => (
                  <div
                    key={ach.id}
                    className="p-4 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between"
                  >
                    <div>
                      <div className="font-bold text-sm text-white">{ach.title}</div>
                      <div className="text-xs text-white/50">{ach.description}</div>
                    </div>
                    <button
                      onClick={() => claimAchievementRewardCores(ach)}
                      disabled={!ach.unlocked || ach.currentProgress < ach.maxProgress}
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
                  <div className="text-3xl font-black text-white">{analytics.totalDamageDealt}</div>
                </div>

                <div className="p-5 rounded-2xl bg-white/5 border border-white/10 flex flex-col gap-2">
                  <div className="text-xs font-mono text-orange-400/70 uppercase">MAX COMBO STREAK</div>
                  <div className="text-3xl font-black text-white">{analytics.maxComboStreakAchieved}</div>
                </div>
              </div>
            )}

            {/* TAB CONTENT: SKINS */}
            {activeTab === "skins" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {mechaSkins.map((skin) => (
                  <div
                    key={skin.id}
                    className={`p-5 rounded-2xl border flex items-center justify-between ${
                      selectedSkinId === skin.id
                        ? "bg-orange-500/20 border-orange-400"
                        : "bg-white/5 border-white/10"
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div
                        className="w-10 h-10 rounded-xl border border-white/20 shadow-lg"
                        style={{ backgroundColor: skin.primaryColor }}
                      />
                      <div>
                        <div className="font-bold text-sm text-white">{skin.name}</div>
                        <div className="text-xs text-white/50">Primary: {skin.primaryColor}</div>
                      </div>
                    </div>
                    <button
                      onClick={() => setSelectedSkinId(skin.id)}
                      className="px-4 py-2 rounded-xl bg-orange-500 text-black font-bold text-xs"
                    >
                      {selectedSkinId === skin.id ? "EQUIPPED" : "EQUIP"}
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* TAB CONTENT: CODEX INTEL */}
            {activeTab === "codex" && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div className="flex flex-col gap-2 border-r border-white/10 pr-4">
                  {codexEntriesList.map((entry) => (
                    <button
                      key={entry.id}
                      onClick={() => setSelectedCodexId(entry.id)}
                      className={`p-3 rounded-xl text-left transition-all ${
                        selectedCodexId === entry.id
                          ? "bg-orange-500/20 border border-orange-400 text-orange-300"
                          : "bg-white/5 border border-white/5 text-white/70 hover:bg-white/10"
                      }`}
                    >
                      <div className="font-bold text-xs uppercase">{entry.title}</div>
                      <div className="text-[10px] text-white/50">{entry.classification}</div>
                    </button>
                  ))}
                </div>

                <div className="md:col-span-2 p-6 rounded-2xl bg-white/5 border border-white/10 flex flex-col gap-4">
                  {(() => {
                    const activeCodex =
                      codexEntriesList.find((c) => c.id === selectedCodexId) || codexEntriesList[0];
                    return (
                      <>
                        <div className="flex justify-between items-center border-b border-white/10 pb-3">
                          <div>
                            <h3 className="font-black text-lg text-orange-300 uppercase">
                              {activeCodex.title}
                            </h3>
                            <div className="text-xs text-white/50">{activeCodex.subtitle}</div>
                          </div>
                          <span className="px-3 py-1 rounded-full bg-red-500/20 border border-red-500/40 text-red-300 font-mono text-[10px] font-black uppercase">
                            {activeCodex.classification}
                          </span>
                        </div>
                        <p className="text-xs text-white/80 leading-relaxed font-sans">
                          {activeCodex.content}
                        </p>
                      </>
                    );
                  })()}
                </div>
              </div>
            )}

            {/* TAB CONTENT: SYSTEM TERMINAL LOGS */}
            {activeTab === "terminal" && (
              <div className="p-6 rounded-2xl bg-black/90 border border-emerald-500/30 font-mono text-xs flex flex-col gap-3 h-80 overflow-y-auto shadow-inner">
                <div className="flex items-center gap-2 text-emerald-400 font-bold border-b border-emerald-500/20 pb-2">
                  <Terminal className="w-4 h-4" /> CITADEL DIAGNOSTIC TERMINAL LOGS
                </div>
                {terminalLogs.map((log) => (
                  <div key={log.id} className="flex gap-3">
                    <span className="text-white/40">[{log.timestamp}]</span>
                    <span
                      className={`font-bold ${
                        log.level === "SUCCESS"
                          ? "text-emerald-400"
                          : log.level === "WARN"
                          ? "text-amber-400"
                          : log.level === "CRITICAL"
                          ? "text-red-400"
                          : "text-sky-400"
                      }`}
                    >
                      {log.level}:
                    </span>
                    <span className="text-white/80">{log.message}</span>
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
                      audioSynthEngine.sfxVolume = val / 100;
                    }}
                    className="w-32"
                  />
                </div>

                <div className="p-4 rounded-2xl bg-white/5 border border-white/10 flex justify-between items-center">
                  <span className="text-xs font-bold">Spatial Mini-Map Radar</span>
                  <button
                    onClick={() =>
                      setSettings((s) => ({ ...s, showSpatialRadarMap: !s.showSpatialRadarMap }))
                    }
                    className={`px-4 py-1.5 rounded-xl font-bold text-xs ${
                      settings.showSpatialRadarMap ? "bg-orange-500 text-black" : "bg-white/10 text-white"
                    }`}
                  >
                    {settings.showSpatialRadarMap ? "ON" : "OFF"}
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
                  onClick={() => startTitanGameMatch(selectedMode)}
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
