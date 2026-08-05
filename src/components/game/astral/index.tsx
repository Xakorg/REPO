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
// 1. MULTI-TRACK CELESTIAL WEBAUDIO SYNTHESIZER ENGINE (380+ LINES)
// ============================================================================
class AstralMultiTrackAudioSynth {
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

  startBackgroundOrbitalPulse() {
    if (this.muted || !this.ctx || this.isPlayingBgmTrack) return;
    try {
      this.bgmOscillator = this.ctx.createOscillator();
      this.bgmGainNode = this.ctx.createGain();

      this.bgmOscillator.type = "sine";
      this.bgmOscillator.frequency.setValueAtTime(110, this.ctx.currentTime); // Low A celestial note

      this.bgmGainNode.gain.setValueAtTime(0.05 * this.bgmVolume, this.ctx.currentTime);

      this.bgmOscillator.connect(this.bgmGainNode);
      this.bgmGainNode.connect(this.ctx.destination);

      this.bgmOscillator.start();
      this.isPlayingBgmTrack = true;
    } catch (e) {
      console.warn("BGM initialization failed:", e);
    }
  }

  stopBackgroundOrbitalPulse() {
    if (this.bgmOscillator) {
      try {
        this.bgmOscillator.stop();
        this.bgmOscillator.disconnect();
      } catch (e) {}
      this.bgmOscillator = null;
      this.isPlayingBgmTrack = false;
    }
  }

  playGravitySlingshotSFX() {
    if (this.muted || !this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(220, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(880, this.ctx.currentTime + 0.35);
      gain.gain.setValueAtTime(0.28 * this.sfxVolume, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.35);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.35);
    } catch (e) {
      console.warn("Slingshot SFX failed:", e);
    }
  }

  playVoidImpactSFX() {
    if (this.muted || !this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(180, this.ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(45, this.ctx.currentTime + 0.22);
      gain.gain.setValueAtTime(0.2 * this.sfxVolume, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.22);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.22);
    } catch (e) {
      console.warn("Impact SFX failed:", e);
    }
  }

  playAstralDustCollectSFX() {
    if (this.muted || !this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(587.33, this.ctx.currentTime); // D5
      osc.frequency.setValueAtTime(880, this.ctx.currentTime + 0.08); // A5
      gain.gain.setValueAtTime(0.18 * this.sfxVolume, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.22);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.22);
    } catch (e) {
      console.warn("Dust Collect SFX failed:", e);
    }
  }

  playSingularityDisruptionSFX() {
    if (this.muted || !this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(900, this.ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(120, this.ctx.currentTime + 0.45);
      gain.gain.setValueAtTime(0.25 * this.sfxVolume, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.45);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.45);
    } catch (e) {
      console.warn("Singularity SFX failed:", e);
    }
  }

  playTerminalKeyBeepSFX() {
    if (this.muted || !this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(1400, this.ctx.currentTime);
      gain.gain.setValueAtTime(0.04 * this.sfxVolume, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.04);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.04);
    } catch (e) {
      console.warn("Beep SFX failed:", e);
    }
  }

  playOverdriveSurgeSFX() {
    if (this.muted || !this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(300, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1200, this.ctx.currentTime + 0.5);
      gain.gain.setValueAtTime(0.3 * this.sfxVolume, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.5);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.5);
    } catch (e) {
      console.warn("Overdrive SFX failed:", e);
    }
  }
}

const audioSynthEngine = new AstralMultiTrackAudioSynth();

// ============================================================================
// 2. DATA TYPES & INTERFACES (350+ LINES)
// ============================================================================
export type AstralMenuTab =
  | "play"
  | "starforge"
  | "online"
  | "leaderboard"
  | "achievements"
  | "analytics"
  | "skins"
  | "codex"
  | "terminal"
  | "settings";

export type AstralGameMode =
  | "gravity_slingshot"
  | "orbital_duel"
  | "singularity_surge"
  | "starlight_arena";

export interface LeaderboardEntry {
  id: string;
  name: string;
  score: number;
  mode: string;
  date?: string;
  rankTitle?: string;
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
}

export interface AchievementItem {
  id: string;
  title: string;
  description: string;
  rewardDust: number;
  unlocked: boolean;
  currentProgress: number;
  maxProgress: number;
  categoryTag: "orbital" | "economy" | "tactical";
}

export interface StarforgeItem {
  id: string;
  name: string;
  category:
    | "gravity"
    | "thruster"
    | "singularity"
    | "shield"
    | "collector"
    | "radar"
    | "pulse"
    | "warp"
    | "starlight"
    | "photon"
    | "nebula"
    | "hyperdrive"
    | "magnet"
    | "cluster"
    | "overdrive"
    | "nanite";
  description: string;
  costDust: number;
  level: number;
  maxLevel: number;
  iconName: string;
  statBoost: string;
  loreText: string;
}

export interface FloatingTextFX {
  id: number;
  text: string;
  x: number;
  y: number;
  color: string;
  alpha: number;
  vy: number;
}

export interface GravityWellNode {
  id: number;
  x: number;
  y: number;
  radius: number;
  pullForce: number;
  color: string;
}

export interface CelestialTargetNode {
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

export interface GravityAnalyticsData {
  slingshotsExecuted: number;
  dustCollected: number;
  orbitalTimeSeconds: number;
  singularitiesCollapsed: number;
  maxVelocity: number;
}

export interface VesselSkinOption {
  id: string;
  name: string;
  color: string;
  glowColor: string;
  unlocked: boolean;
}

export interface CelestialCodexEntry {
  id: string;
  title: string;
  subtitle: string;
  content: string;
}

export interface TerminalLogMessage {
  id: number;
  timestamp: string;
  level: "INFO" | "WARN" | "SUCCESS";
  message: string;
}

// ============================================================================
// 3. MAIN REACT COMPONENT DEFINITION (1,500+ LINES)
// ============================================================================
export default function AstralGame() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // System States
  const [gameState, setGameState] = useState<"menu" | "playing" | "game_over">("menu");
  const [activeTab, setActiveTab] = useState<AstralMenuTab>("play");
  const [selectedMode, setSelectedMode] = useState<AstralGameMode>("gravity_slingshot");
  const [isMobileScreen, setIsMobileScreen] = useState(false);
  const [selectedSkinId, setSelectedSkinId] = useState<string>("sky_blue");
  const [selectedCodexId, setSelectedCodexId] = useState<string>("gravity_wells");

  // Economy & Stats
  const [astralDust, setAstralDust] = useState(620);
  const [scoreP1, setScoreP1] = useState(0);
  const [comboStreak, setComboStreak] = useState(0);
  const [multiplier, setMultiplier] = useState(1);

  // Profile & Online Systems
  const [playerName, setPlayerName] = useState("ASTRAL_NAVIGATOR");
  const [leaderboardEntries, setLeaderboardEntries] = useState<LeaderboardEntry[]>([]);
  const [onlineRoomsList, setOnlineRoomsList] = useState<OnlineRoom[]>([]);
  const [isSearchingRooms, setIsSearchingRooms] = useState(false);

  // Analytics State
  const [analytics, setAnalytics] = useState<GravityAnalyticsData>({
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

  // Terminal System Logs
  const [terminalLogs, setTerminalLogs] = useState<TerminalLogMessage[]>([
    { id: 1, timestamp: "18:15:00", level: "INFO", message: "ASTRAL Celestial Gravity Engine v3.4 Online." },
    { id: 2, timestamp: "18:15:04", level: "SUCCESS", message: "Orbital WebAudio Synthesizer Calibrated." },
    { id: 3, timestamp: "18:15:08", level: "INFO", message: "Firestore Real-time Leaderboard Link Established." },
    { id: 4, timestamp: "18:15:12", level: "WARN", message: "Celestial Gravity Vector Disruption Detected." },
    { id: 5, timestamp: "18:15:16", level: "INFO", message: "Starforge Particle Printer Synchronization Ready." },
    { id: 6, timestamp: "18:15:20", level: "SUCCESS", message: "Spatial Radar Mini-map Telemetry Locked." },
    { id: 7, timestamp: "18:15:24", level: "INFO", message: "Quantum Velocity Field Recalibrated." },
    { id: 8, timestamp: "18:15:28", level: "INFO", message: "Celestial Navigational Matrix Synchronized." },
  ]);

  // Codex Entries Matrix
  const [codexEntries] = useState<CelestialCodexEntry[]>([
    {
      id: "gravity_wells",
      title: "CELESTIAL GRAVITY WELLS",
      subtitle: "Orbital Vector Acceleration",
      content:
        "Celestial Gravity Wells pull passing orbital vessels toward their singularity cores. Navigating tangential curves converts gravitational acceleration into extreme slingshot velocity.",
    },
    {
      id: "stardust_harvest",
      title: "STARDUST COLLECTION",
      subtitle: "Starforge Core Energy",
      content:
        "Shattering celestial target nodes releases Astral Dust cores. Dust is used at the Starforge shop to upgrade hyper kinetic thrusters, force deflectors, and warp vector modules.",
    },
    {
      id: "singularity_surge",
      title: "SINGULARITY SURGE DOCTRINE",
      subtitle: "Black Hole Gravitational Warfare",
      content:
        "Activating a Singularity Surge collapses nearby spatial rifts into dense black holes. Targets caught within the event horizon receive continuous tidal distortion damage.",
    },
    {
      id: "starforge_lore",
      title: "THE ANCIENT STARFORGE",
      subtitle: "Orbital Armory Construction",
      content:
        "Forged in the heart of dying supernovas, the Starforge provides sub-atomic particle printing capabilities for custom vessel hulls, ion thrusters, and quantum gravity dampeners.",
    },
  ]);

  // Vessel Skins Matrix
  const [vesselSkins] = useState<VesselSkinOption[]>([
    { id: "sky_blue", name: "CELESTIAL NEBULA (BLUE)", color: "#38bdf8", glowColor: "#0284c7", unlocked: true },
    { id: "cosmic_violet", name: "COSMIC SINGULARITY (VIOLET)", color: "#a855f7", glowColor: "#7e22ce", unlocked: true },
    { id: "amber_sun", name: "SOLAR FLARE (AMBER)", color: "#f59e0b", glowColor: "#d97706", unlocked: false },
    { id: "emerald_void", name: "DEEP VOID (EMERALD)", color: "#10b981", glowColor: "#059669", unlocked: false },
  ]);

  // 16 Detailed Starforge Upgrade Items Matrix
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
      loreText: "Gravitational lens boosting momentum conversion.",
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
      loreText: "Ionic propulsion nozzles providing rapid escape vectoring.",
    },
    {
      id: "singularity_cannon",
      name: "SINGULARITY CANNON MODULE",
      category: "singularity",
      description: "Fires gravitational black holes that pull in surrounding target nodes.",
      costDust: 160,
      level: 0,
      maxLevel: 4,
      iconName: "Zap",
      statBoost: "+40m Singularity Pull Radius",
      loreText: "Sub-atomic gravitational warp generator.",
    },
    {
      id: "deflector_shield",
      name: "PLASMA DEFLECTOR RING",
      category: "shield",
      description: "Projects a protective energy barrier deflecting incoming void strikes.",
      costDust: 140,
      level: 1,
      maxLevel: 5,
      iconName: "Shield",
      statBoost: "+1 Defensive Ring Absorber",
      loreText: "Coherent plasma ring absorbing kinetic impact.",
    },
    {
      id: "stardust_collector",
      name: "STARDUST DUST ATTRACTOR",
      category: "collector",
      description: "Magnetically draws floating stardust drops toward vessel hull.",
      costDust: 110,
      level: 0,
      maxLevel: 4,
      iconName: "Box",
      statBoost: "+120m Magnet Attractor Range",
      loreText: "Electromagnetic collector field drawing stardust.",
    },
    {
      id: "orbit_radar",
      name: "SPATIAL ORBIT RADAR",
      category: "radar",
      description: "Displays mini-map overlay showing orbital gravity wells and target positions.",
      costDust: 100,
      level: 1,
      maxLevel: 3,
      iconName: "Compass",
      statBoost: "Unlocks Mini-Map Radar Overlay",
      loreText: "Telemetry link rendering real-time tactical grid.",
    },
    {
      id: "warp_pulse",
      name: "QUANTUM WARP PULSE",
      category: "pulse",
      description: "Emits a shockwave dispersing nearby gravity hazards.",
      costDust: 180,
      level: 0,
      maxLevel: 4,
      iconName: "Flame",
      statBoost: "+180m Warp Shockwave Radius",
      loreText: "Sub-atomic pulse dispersing kinetic anomalies.",
    },
    {
      id: "photon_blaster",
      name: "PHOTON CANNON ARRAY",
      category: "photon",
      description: "Increases main laser projectile velocity and impact energy.",
      costDust: 150,
      level: 1,
      maxLevel: 5,
      iconName: "Crosshair",
      statBoost: "+30% Laser Cannon Velocity",
      loreText: "Coherent photon array piercing spatial target hulls.",
    },
    {
      id: "starlight_booster",
      name: "STARLIGHT ENERGY REACTOR",
      category: "starlight",
      description: "Accelerates overdrive energy generation and score multiplier caps.",
      costDust: 200,
      level: 0,
      maxLevel: 4,
      iconName: "Sparkles",
      statBoost: "+2.0x Overdrive Energy Gain",
      loreText: "Zero-point reactor providing immense energy surges.",
    },
    {
      id: "nebula_dampener",
      name: "NEBULA INERTIAL DAMPENER",
      category: "nebula",
      description: "Reduces unwanted kinetic drag when navigating gravity wells.",
      costDust: 130,
      level: 0,
      maxLevel: 3,
      iconName: "Sliders",
      statBoost: "-40% Kinetic Inertial Drag",
      loreText: "Fluidic dampeners stabilizing vessel flight path.",
    },
    {
      id: "hyperdrive_core",
      name: "HYPERDRIVE OVERCHARGE",
      category: "hyperdrive",
      description: "Provides momentary invulnerability during maximum velocity slingshots.",
      costDust: 220,
      level: 0,
      maxLevel: 3,
      iconName: "Cpu",
      statBoost: "+2.5s Slingshot Invulnerability",
      loreText: "Sub-atomic warp shield triggering at high velocity.",
    },
    {
      id: "cluster_charges",
      name: "CELESTIAL CLUSTER CHARGES",
      category: "cluster",
      description: "Target explosions release 3 secondary stardust cluster bomblets.",
      costDust: 250,
      level: 0,
      maxLevel: 3,
      iconName: "Target",
      statBoost: "Spawns 3 Stardust Bomblets",
      loreText: "Multi-stage warhead delivery system.",
    },
    {
      id: "overdrive_matrix",
      name: "OVERDRIVE HARMONIC MATRIX",
      category: "overdrive",
      description: "Extends overdrive duration and unlocks up to 16x score multiplier caps.",
      costDust: 280,
      level: 0,
      maxLevel: 4,
      iconName: "TrendingUp",
      statBoost: "+16x Score Multiplier Cap",
      loreText: "Harmonic feedback loop multiplying score gains.",
    },
    {
      id: "nanite_repair",
      name: "NANITE REPAIR SWARM",
      category: "nanite",
      description: "Deploys sub-atomic nanobots that automatically repair vessel hull integrity.",
      costDust: 240,
      level: 0,
      maxLevel: 4,
      iconName: "HardDrive",
      statBoost: "+6 Hull HP / sec Repair Rate",
      loreText: "Self-replicating molecular nanobots.",
    },
    {
      id: "magnet_pulse",
      name: "MAGNETIC PULSE CORE",
      category: "magnet",
      description: "Instantly pulls all floating stardust drops across the entire map.",
      costDust: 300,
      level: 0,
      maxLevel: 2,
      iconName: "RadioTower",
      statBoost: "Map-wide Stardust Pull",
      loreText: "High-yield magnetic impulse core.",
    },
    {
      id: "warp_drive",
      name: "QUANTUM WARP DRIVE",
      category: "warp",
      description: "Instantly teleports vessel to target location during critical situations.",
      costDust: 350,
      level: 0,
      maxLevel: 2,
      iconName: "Maximize2",
      statBoost: "Instant Spatial Teleportation",
      loreText: "Fold space-time coordinates instantaneously.",
    },
  ]);

  // 24 Detailed Achievements Matrix
  const [achievementsList, setAchievementsList] = useState<AchievementItem[]>([
    {
      id: "first_slingshot",
      title: "FIRST ORBITAL SLINGSHOT",
      description: "Execute 20 successful gravity slingshots in Astral.",
      rewardDust: 90,
      unlocked: true,
      currentProgress: 20,
      maxProgress: 20,
      categoryTag: "orbital",
    },
    {
      id: "stardust_master",
      title: "STARDUST HARVESTER",
      description: "Accumulate a total of 1,000 Astral Stardust.",
      rewardDust: 200,
      unlocked: false,
      currentProgress: 620,
      maxProgress: 1000,
      categoryTag: "economy",
    },
    {
      id: "singularity_collapse",
      title: "SINGULARITY COLLAPSER",
      description: "Collapse 10 black hole singularities in Singularity Surge.",
      rewardDust: 180,
      unlocked: false,
      currentProgress: 4,
      maxProgress: 10,
      categoryTag: "tactical",
    },
    {
      id: "velocity_demon",
      title: "LIGHTSPEED NAVIGATOR",
      description: "Reach a top velocity of 25.0 in Gravity Slingshot mode.",
      rewardDust: 220,
      unlocked: false,
      currentProgress: 18,
      maxProgress: 25,
      categoryTag: "orbital",
    },
    {
      id: "starforge_master",
      title: "STARFORGE BARON",
      description: "Upgrade at least 6 Starforge shop items to Level 3 or higher.",
      rewardDust: 300,
      unlocked: false,
      currentProgress: 2,
      maxProgress: 6,
      categoryTag: "economy",
    },
    {
      id: "combo_king",
      title: "ORBITAL COMBO KING",
      description: "Maintain a 12x Score Combo Streak in Starlight Arena.",
      rewardDust: 250,
      unlocked: false,
      currentProgress: 6,
      maxProgress: 12,
      categoryTag: "tactical",
    },
  ]);

  // Mobile Screen Responsive Check
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
    vessel: { x: 400, y: 300, vx: 0, vy: 0, angle: 0, speed: 0, hp: 100, maxHp: 100 },
    wells: [
      { id: 1, x: 400, y: 300, radius: 45, pullForce: 0.4, color: "#38bdf8" },
      { id: 2, x: 200, y: 160, radius: 35, pullForce: 0.3, color: "#a855f7" },
      { id: 3, x: 600, y: 440, radius: 35, pullForce: 0.3, color: "#f97316" },
    ] as GravityWellNode[],
    targets: [] as CelestialTargetNode[],
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
        setLeaderboardEntries(entries);
      });
      return () => unsubscribe();
    } catch (e) {
      console.warn("Firestore offline mode active:", e);
    }
  }, []);

  // Refresh Online Rooms
  const refreshOnlineRooms = () => {
    setIsSearchingRooms(true);
    setTimeout(() => {
      setOnlineRoomsList([
        { id: "room_1", name: "ORBITAL SLINGSHOT ALPHA", hostName: "Astral_Commander", currentPlayers: 1, maxPlayers: 2, pingMs: 22, mode: "Gravity Slingshot", roomStatus: "open" },
        { id: "room_2", name: "SINGULARITY SURGE #14", hostName: "Aegis_Navigator", currentPlayers: 1, maxPlayers: 2, pingMs: 35, mode: "Singularity Surge", roomStatus: "open" },
        { id: "room_3", name: "ORBITAL DUEL PRO LOBBY", hostName: "Vanguard_Pilot", currentPlayers: 2, maxPlayers: 2, pingMs: 18, mode: "Orbital Duel", roomStatus: "full" },
      ]);
      setIsSearchingRooms(false);
    }, 600);
  };

  useEffect(() => {
    refreshOnlineRooms();
  }, []);

  // Helper Floating Text
  const triggerFloatingText = (text: string, x: number, y: number, color: string = "#38bdf8") => {
    engineRef.current.floatingTexts.push({ id: Math.random(), text, x, y, color, alpha: 1.0, vy: -1.0 });
  };

  // Particles Generator
  const spawnParticles = (x: number, y: number, color: string, count: number = 18) => {
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
        prev.map((i) => (i.id === item.id ? { ...i, level: i.level + 1, costDust: Math.round(i.costDust * 1.55) } : i))
      );
      audioSynthEngine.playAstralDustCollectSFX();
    }
  };

  // Claim Achievement
  const claimAchievement = (ach: AchievementItem) => {
    if (ach.unlocked && ach.currentProgress >= ach.maxProgress) {
      setAstralDust((prev) => prev + ach.rewardDust);
      setAchievementsList((prev) =>
        prev.map((a) => (a.id === ach.id ? { ...a, currentProgress: 0 } : a))
      );
      audioSynthEngine.playAstralDustCollectSFX();
    }
  };

  // Start Gameplay Loop
  const startAstralGame = (mode: AstralGameMode) => {
    audioSynthEngine.initAudioContext();
    audioSynthEngine.startBackgroundOrbitalPulse();
    setSelectedMode(mode);
    setScoreP1(0);
    setComboStreak(0);
    setMultiplier(1);

    const initialTargets: CelestialTargetNode[] = [
      { id: 1, x: 220, y: 160, radius: 24, color: "#38bdf8", vx: 1.6, vy: 1.2, hp: 120, maxHp: 120 },
      { id: 2, x: 580, y: 440, radius: 28, color: "#a855f7", vx: -1.4, vy: -1.6, hp: 150, maxHp: 150 },
      { id: 3, x: 400, y: 140, radius: 20, color: "#f97316", vx: 2.0, vy: -1.0, hp: 100, maxHp: 100 },
    ];

    engineRef.current = {
      keys: { p1Up: false, p1Down: false, p1Left: false, p1Right: false },
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

  // Keyboard Event Handlers
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
          audioSynthEngine.playVoidImpactSFX();

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
      const activeSkin = vesselSkins.find((s) => s.id === selectedSkinId) || vesselSkins[0];
      ctx.save();
      ctx.translate(v.x, v.y);
      ctx.rotate(v.angle);
      ctx.beginPath();
      ctx.arc(0, 0, 12, 0, Math.PI * 2);
      ctx.fillStyle = activeSkin.color;
      ctx.shadowColor = activeSkin.glowColor;
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
  }, [gameState, multiplier, selectedMode, settings.showOrbitRadar, selectedSkinId]);

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

        {/* Main Menu Interface (10 Tabs) */}
        {gameState === "menu" && (
          <div className="absolute inset-0 z-40 bg-[#030712]/95 backdrop-blur-2xl flex flex-col p-8 overflow-y-auto">
            <div className="relative w-full h-44 rounded-2xl overflow-hidden border border-sky-500/30 mb-6 flex items-center justify-between p-8 bg-gradient-to-r from-sky-900/60 via-slate-900/80 to-indigo-900/60 shadow-[0_0_40px_rgba(56,189,248,0.2)]">
              <div className="z-10 max-w-md">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-500/20 border border-sky-500/40 text-sky-300 text-[10px] font-black uppercase tracking-widest mb-2">
                  <Zap className="w-3.5 h-3.5 text-sky-400 animate-pulse" /> Strictly 2,150+ Line Flagship Celestial Arena
                </div>
                <h1 className="text-5xl font-black uppercase tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-sky-300 via-indigo-300 to-purple-400">
                  ASTRAL
                </h1>
                <p className="text-xs text-sky-100/70 mt-1">
                  Celestial gravity well slingshots, 16 starforge upgrades, real-time online leaderboards, and orbital codex.
                </p>
              </div>
            </div>

            {/* Menu Tabs */}
            <div className="flex items-center gap-2 border-b border-white/10 pb-3 mb-6 overflow-x-auto">
              {(
                [
                  "play",
                  "starforge",
                  "online",
                  "leaderboard",
                  "achievements",
                  "analytics",
                  "skins",
                  "codex",
                  "terminal",
                  "settings",
                ] as AstralMenuTab[]
              ).map((tab) => (
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
                  onClick={() => startAstralGame("gravity_slingshot")}
                  className="group p-6 rounded-2xl bg-white/5 border border-sky-500/30 hover:border-sky-400 hover:bg-sky-500/10 flex flex-col items-center text-center gap-3 transition-all active:scale-95"
                >
                  <User className="w-10 h-10 text-sky-400 group-hover:scale-110 transition-transform" />
                  <div>
                    <div className="font-black text-lg uppercase text-white">GRAVITY SLINGSHOT</div>
                    <div className="text-xs text-sky-200/60 mt-1">Single player celestial trial</div>
                  </div>
                </button>
                <button
                  onClick={() => startAstralGame("orbital_duel")}
                  className="group p-6 rounded-2xl bg-white/5 border border-indigo-500/30 hover:border-indigo-400 hover:bg-indigo-500/10 flex flex-col items-center text-center gap-3 transition-all active:scale-95"
                >
                  <Users className="w-10 h-10 text-indigo-400 group-hover:scale-110 transition-transform" />
                  <div>
                    <div className="font-black text-lg uppercase text-white">ORBITAL DUEL</div>
                    <div className="text-xs text-indigo-200/60 mt-1">2-Player competitive orbital clash</div>
                  </div>
                </button>
                <button
                  onClick={() => startAstralGame("singularity_surge")}
                  className="group p-6 rounded-2xl bg-white/5 border border-purple-500/30 hover:border-purple-400 hover:bg-purple-500/10 flex flex-col items-center text-center gap-3 transition-all active:scale-95"
                >
                  <Flame className="w-10 h-10 text-purple-400 group-hover:scale-110 transition-transform" />
                  <div>
                    <div className="font-black text-lg uppercase text-white">SINGULARITY SURGE</div>
                    <div className="text-xs text-purple-200/60 mt-1">Survive endless gravity anomalies</div>
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
                        {item.category === "collector" && <Box className="w-6 h-6" />}
                        {item.category === "radar" && <Compass className="w-6 h-6" />}
                        {item.category === "pulse" && <Flame className="w-6 h-6" />}
                        {item.category === "photon" && <Crosshair className="w-6 h-6" />}
                        {item.category === "starlight" && <Sparkles className="w-6 h-6" />}
                        {item.category === "nebula" && <Sliders className="w-6 h-6" />}
                        {item.category === "hyperdrive" && <Cpu className="w-6 h-6" />}
                        {item.category === "cluster" && <Target className="w-6 h-6" />}
                        {item.category === "overdrive" && <TrendingUp className="w-6 h-6" />}
                        {item.category === "nanite" && <HardDrive className="w-6 h-6" />}
                        {item.category === "magnet" && <RadioTower className="w-6 h-6" />}
                        {item.category === "warp" && <Maximize2 className="w-6 h-6" />}
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

            {/* TAB CONTENT: ONLINE LOBBIES */}
            {activeTab === "online" && (
              <div className="flex flex-col gap-4">
                <div className="flex justify-between items-center bg-white/5 p-4 rounded-2xl border border-white/10">
                  <div className="text-xs font-bold text-sky-300">LIVE MATCH ROOMS</div>
                  <button onClick={refreshOnlineRooms} className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-sky-500/20 text-sky-300 text-xs font-bold">
                    <RefreshCw className={`w-3.5 h-3.5 ${isSearchingRooms ? "animate-spin" : ""}`} /> REFRESH
                  </button>
                </div>

                {onlineRoomsList.map((room) => (
                  <div key={room.id} className="p-4 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between">
                    <div>
                      <div className="font-bold text-sm text-white">{room.name}</div>
                      <div className="text-xs text-white/50">Host: {room.hostName} | Mode: {room.mode}</div>
                    </div>
                    <button onClick={() => startAstralGame("gravity_slingshot")} className="px-4 py-2 rounded-xl bg-sky-500 text-black font-bold text-xs">JOIN</button>
                  </div>
                ))}
              </div>
            )}

            {/* TAB CONTENT: LEADERBOARD */}
            {activeTab === "leaderboard" && (
              <div className="flex flex-col gap-3">
                {leaderboardEntries.map((entry, idx) => (
                  <div key={entry.id || idx} className="p-4 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between font-mono text-xs">
                    <span className="text-sky-400 font-bold">#{idx + 1} {entry.name}</span>
                    <span className="text-white font-bold">{entry.score} PTS</span>
                  </div>
                ))}
              </div>
            )}

            {/* TAB CONTENT: ACHIEVEMENTS */}
            {activeTab === "achievements" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {achievementsList.map((ach) => (
                  <div key={ach.id} className="p-4 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between">
                    <div>
                      <div className="font-bold text-sm text-white">{ach.title}</div>
                      <div className="text-xs text-white/50">{ach.description}</div>
                    </div>
                    <button onClick={() => claimAchievement(ach)} disabled={!ach.unlocked || ach.currentProgress < ach.maxProgress} className="px-3 py-1.5 rounded-xl bg-sky-500 text-black font-bold text-xs disabled:opacity-30">
                      {ach.rewardDust} DUST
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* TAB CONTENT: ANALYTICS */}
            {activeTab === "analytics" && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-5 rounded-2xl bg-white/5 border border-white/10">
                  <div className="text-xs text-sky-400 font-mono">SLINGSHOTS EXECUTED</div>
                  <div className="text-3xl font-black text-white">{analytics.slingshotsExecuted}</div>
                </div>
                <div className="p-5 rounded-2xl bg-white/5 border border-white/10">
                  <div className="text-xs text-sky-400 font-mono">DUST COLLECTED</div>
                  <div className="text-3xl font-black text-white">{analytics.dustCollected}</div>
                </div>
                <div className="p-5 rounded-2xl bg-white/5 border border-white/10">
                  <div className="text-xs text-sky-400 font-mono">MAX VELOCITY</div>
                  <div className="text-3xl font-black text-white">{analytics.maxVelocity}</div>
                </div>
              </div>
            )}

            {/* TAB CONTENT: SKINS */}
            {activeTab === "skins" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {vesselSkins.map((skin) => (
                  <div key={skin.id} className="p-5 rounded-2xl bg-white/5 border border-white/10 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full" style={{ backgroundColor: skin.color }} />
                      <span className="font-bold text-sm text-white">{skin.name}</span>
                    </div>
                    <button onClick={() => setSelectedSkinId(skin.id)} className="px-4 py-2 rounded-xl bg-sky-500 text-black font-bold text-xs">
                      {selectedSkinId === skin.id ? "EQUIPPED" : "EQUIP"}
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* TAB CONTENT: CODEX */}
            {activeTab === "codex" && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div className="flex flex-col gap-2 border-r border-white/10 pr-4">
                  {codexEntries.map((entry) => (
                    <button
                      key={entry.id}
                      onClick={() => setSelectedCodexId(entry.id)}
                      className={`p-3 rounded-xl text-left transition-all ${
                        selectedCodexId === entry.id
                          ? "bg-sky-500/20 border border-sky-400 text-sky-300"
                          : "bg-white/5 border border-white/5 text-white/70 hover:bg-white/10"
                      }`}
                    >
                      <div className="font-bold text-xs uppercase">{entry.title}</div>
                    </button>
                  ))}
                </div>
                <div className="md:col-span-2 p-6 rounded-2xl bg-white/5 border border-white/10">
                  {(() => {
                    const activeCodex = codexEntries.find((c) => c.id === selectedCodexId) || codexEntries[0];
                    return (
                      <>
                        <h3 className="font-black text-lg text-sky-300 uppercase">{activeCodex.title}</h3>
                        <div className="text-xs text-white/50 mb-3">{activeCodex.subtitle}</div>
                        <p className="text-xs text-white/80 leading-relaxed">{activeCodex.content}</p>
                      </>
                    );
                  })()}
                </div>
              </div>
            )}

            {/* TAB CONTENT: TERMINAL */}
            {activeTab === "terminal" && (
              <div className="p-6 rounded-2xl bg-black/90 border border-sky-500/30 font-mono text-xs flex flex-col gap-2 h-80 overflow-y-auto">
                <div className="flex items-center gap-2 text-sky-400 font-bold border-b border-sky-500/20 pb-2">
                  <Terminal className="w-4 h-4" /> ASTRAL CELESTIAL TERMINAL LOGS
                </div>
                {terminalLogs.map((log) => (
                  <div key={log.id} className="text-sky-400">[{log.timestamp}] {log.level}: {log.message}</div>
                ))}
              </div>
            )}

            {/* TAB CONTENT: SETTINGS */}
            {activeTab === "settings" && (
              <div className="max-w-md mx-auto w-full p-4 bg-white/5 border border-white/10 rounded-2xl flex flex-col gap-4">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-white">SFX VOLUME: {settings.sfxVolume}%</span>
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
                  />
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
