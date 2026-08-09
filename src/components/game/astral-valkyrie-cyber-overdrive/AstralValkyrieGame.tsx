"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Shield, Zap, Award, Flame, Play, Pause, RotateCcw, Volume2, VolumeX,
  Crosshair, Sparkles, Terminal, ChevronRight, Settings, Radio, Cpu,
  Compass, Swords, RefreshCw, ShoppingBag, Lock, Unlock, Star, ArrowUpRight,
  Maximize2, Activity, Battery, Target, AlertTriangle, Eye
} from "lucide-react";
import { useUser, useFirestore, setDocumentNonBlocking } from "@/firebase";
import { doc, getDoc } from "firebase/firestore";

// ─────────────────────────────────────────────────────────────────────────────
// TYPES & INTERFACES
// ─────────────────────────────────────────────────────────────────────────────

export type GameMode = "campaign" | "endless" | "boss_rush";
export type TabState = "game" | "armory" | "skills" | "achievements" | "leaderboard" | "terminal";

export interface WeaponOption {
  id: string;
  name: string;
  type: "laser" | "plasma" | "missile" | "railgun" | "blade" | "beam";
  level: number;
  maxLevel: number;
  damage: number;
  fireRate: number; // ms
  energyCost: number;
  costCredits: number;
  description: string;
  unlocked: boolean;
  color: string;
  soundType: "plasma" | "railgun" | "missile" | "laser" | "beam";
}

export interface SkillNode {
  id: string;
  name: string;
  icon: string;
  description: string;
  cooldown: number; // seconds
  duration: number; // seconds
  energyCost: number;
  unlocked: boolean;
  active: boolean;
  level: number;
  maxLevel: number;
  costCredits: number;
  category: "offense" | "defense" | "utility";
}

export interface AchievementItem {
  id: string;
  title: string;
  description: string;
  unlocked: boolean;
  progress: number;
  target: number;
  rewardCredits: number;
  icon: string;
}

export interface ParticleEffect {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
  life: number;
  maxLife: number;
  shape?: "circle" | "spark" | "ring" | "star";
}

export interface Bullet {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  damage: number;
  color: string;
  radius: number;
  isPlayer: boolean;
  type?: string;
}

export interface EnemyUnit {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  hp: number;
  maxHp: number;
  type: "scout" | "interceptor" | "dreadnought" | "boss";
  name: string;
  color: string;
  radius: number;
  shootCooldown: number;
  lastShot: number;
  scoreValue: number;
  creditsValue: number;
  bossPhase?: number;
  maxBossPhases?: number;
}

export interface PlayerValkyrie {
  x: number;
  y: number;
  radius: number;
  hp: number;
  maxHp: number;
  shield: number;
  maxShield: number;
  energy: number;
  maxEnergy: number;
  overdrive: number;
  maxOverdrive: number;
  isOverdriveActive: boolean;
  speed: number;
  score: number;
  kills: number;
  combos: number;
  credits: number;
  wingAngle: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// WEB AUDIO SYNTHESIZER ENGINE
// ─────────────────────────────────────────────────────────────────────────────
class ValkyrieAudioEngine {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;

  constructor() {
    // AudioContext will be initialized on first user interaction
  }

  private initCtx() {
    if (!this.ctx && typeof window !== "undefined") {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === "suspended") {
      this.ctx.resume();
    }
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
  }

  public playLaserSound(freq: number = 880) {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(110, this.ctx.currentTime + 0.12);

      gain.gain.setValueAtTime(0.15, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.12);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + 0.12);
    } catch {
      // Audio fallback silent
    }
  }

  public playRailgunSound() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = "square";
      osc.frequency.setValueAtTime(1200, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(40, this.ctx.currentTime + 0.3);

      gain.gain.setValueAtTime(0.25, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.3);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + 0.3);
    } catch {}
  }

  public playExplosionSound(intensity: "small" | "heavy" | "boss" = "small") {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    try {
      const duration = intensity === "boss" ? 0.8 : intensity === "heavy" ? 0.4 : 0.2;
      const bufferSize = this.ctx.sampleRate * duration;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);

      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }

      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.setValueAtTime(intensity === "boss" ? 300 : 800, this.ctx.currentTime);
      filter.frequency.exponentialRampToValueAtTime(20, this.ctx.currentTime + duration);

      const gain = this.ctx.createGain();
      const vol = intensity === "boss" ? 0.4 : intensity === "heavy" ? 0.25 : 0.15;
      gain.gain.setValueAtTime(vol, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);

      noise.start();
      noise.stop(this.ctx.currentTime + duration);
    } catch {}
  }

  public playShieldHit() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(440, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(880, this.ctx.currentTime + 0.15);

      gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.15);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + 0.15);
    } catch {}
  }

  public playOverdriveActivation() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = "triangle";
      osc.frequency.setValueAtTime(220, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1760, this.ctx.currentTime + 0.5);

      gain.gain.setValueAtTime(0.3, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.5);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + 0.5);
    } catch {}
  }
}

const audioSynth = new ValkyrieAudioEngine();

// ─────────────────────────────────────────────────────────────────────────────
// DEFAULT CONFIGURATIONS
// ─────────────────────────────────────────────────────────────────────────────

const INITIAL_WEAPONS: WeaponOption[] = [
  {
    id: "dual_plasma",
    name: "Dual Plasma Cannons",
    type: "plasma",
    level: 1,
    maxLevel: 5,
    damage: 25,
    fireRate: 180,
    energyCost: 2,
    costCredits: 0,
    description: "Twin high-velocity plasma blasters mounted on Valkyrie wings.",
    unlocked: true,
    color: "#38bdf8",
    soundType: "plasma",
  },
  {
    id: "quantum_railgun",
    name: "Quantum Railgun",
    type: "railgun",
    level: 1,
    maxLevel: 5,
    damage: 85,
    fireRate: 450,
    energyCost: 12,
    costCredits: 1200,
    description: "Fires localized singularity bolts capable of piercing heavy shields.",
    unlocked: false,
    color: "#a855f7",
    soundType: "railgun",
  },
  {
    id: "homing_missiles",
    name: "Photon Cluster Missiles",
    type: "missile",
    level: 1,
    maxLevel: 5,
    damage: 45,
    fireRate: 350,
    energyCost: 8,
    costCredits: 2500,
    description: "Launches lock-on photon missiles that seek nearby enemy signatures.",
    unlocked: false,
    color: "#f59e0b",
    soundType: "missile",
  },
  {
    id: "tachyon_beam",
    name: "Tachyon Beam Emitter",
    type: "beam",
    level: 1,
    maxLevel: 5,
    damage: 140,
    fireRate: 600,
    energyCost: 25,
    costCredits: 5000,
    description: "Continuous high-intensity thermal laser slicing through dreadnought hulls.",
    unlocked: false,
    color: "#10b981",
    soundType: "beam",
  },
];

const INITIAL_SKILLS: SkillNode[] = [
  {
    id: "chrono_shift",
    name: "Chrono Shift (Time Dilation)",
    icon: "Zap",
    description: "Dilates time by 75% for 6 seconds, slowing enemy projectiles and movement.",
    cooldown: 20,
    duration: 6,
    energyCost: 30,
    unlocked: true,
    active: false,
    level: 1,
    maxLevel: 3,
    costCredits: 0,
    category: "utility",
  },
  {
    id: "valkyrie_overdrive",
    name: "Overdrive Core Pulse",
    icon: "Flame",
    description: "Unleashes 100% critical energy output, doubling fire rate and weapon damage.",
    cooldown: 25,
    duration: 8,
    energyCost: 40,
    unlocked: true,
    active: false,
    level: 1,
    maxLevel: 3,
    costCredits: 1500,
    category: "offense",
  },
  {
    id: "aegis_matrix",
    name: "Aegis Shield Refresh",
    icon: "Shield",
    description: "Instantly recharges 100% of Valkyrie shield matrix and repels nearby bullets.",
    cooldown: 18,
    duration: 3,
    energyCost: 35,
    unlocked: false,
    active: false,
    level: 1,
    maxLevel: 3,
    costCredits: 3000,
    category: "defense",
  },
  {
    id: "orbital_strike",
    name: "Astral Orbital Laser",
    icon: "Target",
    description: "Calls down a heavy orbital beam strike directly targeting the strongest enemy.",
    cooldown: 35,
    duration: 4,
    energyCost: 60,
    unlocked: false,
    active: false,
    level: 1,
    maxLevel: 3,
    costCredits: 6000,
    category: "offense",
  },
];

const INITIAL_ACHIEVEMENTS: AchievementItem[] = [
  {
    id: "first_blood",
    title: "First Valkyrie Strike",
    description: "Destroy 10 enemy mechas in combat.",
    unlocked: false,
    progress: 0,
    target: 10,
    rewardCredits: 500,
    icon: "Swords",
  },
  {
    id: "dreadnought_slayer",
    title: "Dreadnought Hunter",
    description: "Defeat 3 Sector Bosses.",
    unlocked: false,
    progress: 0,
    target: 3,
    rewardCredits: 2000,
    icon: "Award",
  },
  {
    id: "overdrive_master",
    title: "Maximum Overclock",
    description: "Activate Overdrive Core Pulse 5 times.",
    unlocked: false,
    progress: 0,
    target: 5,
    rewardCredits: 1500,
    icon: "Flame",
  },
  {
    id: "century_kills",
    title: "Century Sweeper",
    description: "Achieve 100 total mecha kills.",
    unlocked: false,
    progress: 0,
    target: 100,
    rewardCredits: 5000,
    icon: "Target",
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

export default function AstralValkyrieGame() {
  const { user } = useUser();
  const firestore = useFirestore();

  // Canvas & Game Loop Refs
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const requestRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(performance.now());
  const lastShotTimeRef = useRef<number>(0);

  // User & Controls Input State
  const keysRef = useRef<{ [key: string]: boolean }>({});
  const mousePosRef = useRef<{ x: number; y: number }>({ x: 400, y: 300 });
  const isMouseDownRef = useRef<boolean>(false);

  // Game Play States
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [gameOver, setGameOver] = useState<boolean>(false);
  const [gameMode, setGameMode] = useState<GameMode>("campaign");
  const [activeTab, setActiveTab] = useState<TabState>("game");

  // Audio State
  const [muted, setMuted] = useState<boolean>(false);

  // Stats & Equipment States
  const [weapons, setWeapons] = useState<WeaponOption[]>(INITIAL_WEAPONS);
  const [selectedWeaponId, setSelectedWeaponId] = useState<string>("dual_plasma");
  const [skills, setSkills] = useState<SkillNode[]>(INITIAL_SKILLS);
  const [achievements, setAchievements] = useState<AchievementItem[]>(INITIAL_ACHIEVEMENTS);

  const [sector, setSector] = useState<number>(1);
  const [totalCredits, setTotalCredits] = useState<number>(2500);
  const [highScore, setHighScore] = useState<number>(0);

  // Live Game Objects State
  const playerRef = useRef<PlayerValkyrie>({
    x: 400,
    y: 500,
    radius: 22,
    hp: 200,
    maxHp: 200,
    shield: 100,
    maxShield: 100,
    energy: 100,
    maxEnergy: 100,
    overdrive: 0,
    maxOverdrive: 100,
    isOverdriveActive: false,
    speed: 6.5,
    score: 0,
    kills: 0,
    combos: 0,
    credits: 0,
    wingAngle: 0,
  });

  const bulletsRef = useRef<Bullet[]>([]);
  const enemiesRef = useRef<EnemyUnit[]>([]);
  const particlesRef = useRef<ParticleEffect[]>([]);

  // Skill Cooldown Tracking
  const skillCooldownsRef = useRef<{ [key: string]: number }>({});

  // Terminal Dev State
  const [terminalInput, setTerminalInput] = useState("");
  const [terminalLogs, setTerminalLogs] = useState<string[]>([
    "[SYSTEM ONLINE] Astral Valkyrie Apex Mecha OS v4.2 Initialized.",
    "[STATUS] Weapon matrices ready. All sectors online.",
  ]);

  // Load persistence from Firebase
  useEffect(() => {
    if (!user || !firestore) return;
    const statsDocRef = doc(firestore, `users/${user.uid}/game_stats`, "astral_valkyrie_cyber_overdrive");
    getDoc(statsDocRef)
      .then((snap) => {
        if (snap.exists()) {
          const data = snap.data();
          if (data.highScore) setHighScore(data.highScore);
          if (data.totalCredits) setTotalCredits(data.totalCredits);
        }
      })
      .catch(() => {});
  }, [user, firestore]);

  // Save Persistence
  const saveStatsToFirebase = useCallback(
    (newScore: number, earnedCredits: number) => {
      if (!user || !firestore) return;
      const statsDocRef = doc(firestore, `users/${user.uid}/game_stats`, "astral_valkyrie_cyber_overdrive");
      const finalHigh = Math.max(highScore, newScore);
      const finalCreds = totalCredits + earnedCredits;

      setDocumentNonBlocking(
        statsDocRef,
        {
          highScore: finalHigh,
          totalCredits: finalCreds,
          lastPlayed: Date.now(),
        },
        { merge: true }
      );
    },
    [user, firestore, highScore, totalCredits]
  );

  // ───────────────────────────────────────────────────────────────────────────
  // GAME SETUP & INIT
  // ───────────────────────────────────────────────────────────────────────────

  const startGame = (mode: GameMode = "campaign") => {
    setGameMode(mode);
    setGameOver(false);
    setIsPaused(false);
    setIsPlaying(true);
    setActiveTab("game");
    setSector(1);

    playerRef.current = {
      x: 400,
      y: 500,
      radius: 22,
      hp: 200,
      maxHp: 200,
      shield: 100,
      maxShield: 100,
      energy: 100,
      maxEnergy: 100,
      overdrive: 0,
      maxOverdrive: 100,
      isOverdriveActive: false,
      speed: 6.5,
      score: 0,
      kills: 0,
      combos: 0,
      credits: 0,
      wingAngle: 0,
    };

    bulletsRef.current = [];
    enemiesRef.current = [];
    particlesRef.current = [];
    skillCooldownsRef.current = {};

    spawnWave(1, mode);
  };

  const spawnWave = (currentSector: number, mode: GameMode) => {
    const isBossSector = currentSector % 3 === 0 || mode === "boss_rush";
    const enemyCount = mode === "boss_rush" ? 1 : 4 + currentSector * 2;

    const newEnemies: EnemyUnit[] = [];

    if (isBossSector) {
      newEnemies.push({
        id: `boss_${Date.now()}`,
        x: 400,
        y: 120,
        vx: 2.5,
        vy: 0,
        hp: 1200 + currentSector * 600,
        maxHp: 1200 + currentSector * 600,
        type: "boss",
        name: `Solaris Dreadnought Mk-${currentSector}`,
        color: "#f43f5e",
        radius: 45,
        shootCooldown: 800,
        lastShot: 0,
        scoreValue: 5000,
        creditsValue: 1200,
        bossPhase: 1,
        maxBossPhases: 3,
      });
    } else {
      for (let i = 0; i < enemyCount; i++) {
        const isDread = Math.random() > 0.7;
        newEnemies.push({
          id: `enemy_${Date.now()}_${i}`,
          x: 80 + Math.random() * 640,
          y: -50 - i * 60,
          vx: (Math.random() - 0.5) * 3,
          vy: 1.5 + Math.random() * 1.5,
          hp: isDread ? 180 : 60,
          maxHp: isDread ? 180 : 60,
          type: isDread ? "dreadnought" : Math.random() > 0.5 ? "interceptor" : "scout",
          name: isDread ? "Elite Dreadnought" : "Vanguard Interceptor",
          color: isDread ? "#c084fc" : "#38bdf8",
          radius: isDread ? 28 : 16,
          shootCooldown: isDread ? 1200 : 1800,
          lastShot: 0,
          scoreValue: isDread ? 400 : 150,
          creditsValue: isDread ? 80 : 30,
        });
      }
    }

    enemiesRef.current = newEnemies;
  };

  // ───────────────────────────────────────────────────────────────────────────
  // PARTICLE SYSTEM ENGINE
  // ───────────────────────────────────────────────────────────────────────────

  const spawnParticles = (x: number, y: number, color: string, count: number = 12, shape: "circle" | "spark" | "ring" = "circle") => {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 1 + Math.random() * 6;
      particlesRef.current.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        radius: 2 + Math.random() * 4,
        color,
        life: 0,
        maxLife: 20 + Math.random() * 25,
        shape,
      });
    }
  };

  // ───────────────────────────────────────────────────────────────────────────
  // SHOOTING & WEAPONS LOGIC
  // ───────────────────────────────────────────────────────────────────────────

  const fireWeapon = (now: number) => {
    const activeWeapon = weapons.find((w) => w.id === selectedWeaponId) || weapons[0];
    if (now - lastShotTimeRef.current < activeWeapon.fireRate) return;
    if (playerRef.current.energy < activeWeapon.energyCost) return;

    lastShotTimeRef.current = now;
    playerRef.current.energy = Math.max(0, playerRef.current.energy - activeWeapon.energyCost);

    const px = playerRef.current.x;
    const py = playerRef.current.y - playerRef.current.radius;
    const isOverdrive = playerRef.current.isOverdriveActive;
    const dmg = isOverdrive ? activeWeapon.damage * 2 : activeWeapon.damage;

    if (activeWeapon.type === "plasma") {
      bulletsRef.current.push(
        { id: `b_${now}_1`, x: px - 14, y: py, vx: 0, vy: -14, damage: dmg, color: activeWeapon.color, radius: 4, isPlayer: true },
        { id: `b_${now}_2`, x: px + 14, y: py, vx: 0, vy: -14, damage: dmg, color: activeWeapon.color, radius: 4, isPlayer: true }
      );
      audioSynth.playLaserSound(800);
    } else if (activeWeapon.type === "railgun") {
      bulletsRef.current.push({
        id: `b_${now}`,
        x: px,
        y: py,
        vx: 0,
        vy: -20,
        damage: dmg,
        color: activeWeapon.color,
        radius: 8,
        isPlayer: true,
      });
      audioSynth.playRailgunSound();
    } else if (activeWeapon.type === "missile") {
      bulletsRef.current.push(
        { id: `b_${now}_1`, x: px - 20, y: py + 10, vx: -3, vy: -10, damage: dmg, color: activeWeapon.color, radius: 5, isPlayer: true },
        { id: `b_${now}_2`, x: px + 20, y: py + 10, vx: 3, vy: -10, damage: dmg, color: activeWeapon.color, radius: 5, isPlayer: true }
      );
      audioSynth.playLaserSound(600);
    } else if (activeWeapon.type === "beam") {
      bulletsRef.current.push({
        id: `b_${now}`,
        x: px,
        y: py - 20,
        vx: 0,
        vy: -24,
        damage: dmg,
        color: activeWeapon.color,
        radius: 12,
        isPlayer: true,
      });
      audioSynth.playLaserSound(1100);
    }

    spawnParticles(px, py, activeWeapon.color, 4, "spark");
  };

  // ───────────────────────────────────────────────────────────────────────────
  // SKILL ACTIVATION
  // ───────────────────────────────────────────────────────────────────────────

  const activateSkill = (skillId: string) => {
    const sk = skills.find((s) => s.id === skillId);
    if (!sk || !sk.unlocked) return;

    const cd = skillCooldownsRef.current[skillId] || 0;
    if (cd > 0) return;
    if (playerRef.current.energy < sk.energyCost) return;

    playerRef.current.energy -= sk.energyCost;
    skillCooldownsRef.current[skillId] = sk.cooldown;

    if (skillId === "valkyrie_overdrive") {
      playerRef.current.isOverdriveActive = true;
      playerRef.current.overdrive = 100;
      audioSynth.playOverdriveActivation();

      setTimeout(() => {
        playerRef.current.isOverdriveActive = false;
      }, sk.duration * 1000);
    } else if (skillId === "aegis_matrix") {
      playerRef.current.shield = playerRef.current.maxShield;
      audioSynth.playShieldHit();
      spawnParticles(playerRef.current.x, playerRef.current.y, "#38bdf8", 30, "ring");
    } else if (skillId === "orbital_strike") {
      audioSynth.playExplosionSound("boss");
      enemiesRef.current.forEach((e) => {
        e.hp -= 400;
        spawnParticles(e.x, e.y, "#ef4444", 25, "spark");
      });
    }

    setSkills((prev) => prev.map((s) => (s.id === skillId ? { ...s, active: true } : s)));
  };

  // ───────────────────────────────────────────────────────────────────────────
  // MAIN GAME LOOP & RENDER
  // ───────────────────────────────────────────────────────────────────────────

  const updateGameLogic = (dt: number) => {
    if (!isPlaying || isPaused || gameOver) return;

    const p = playerRef.current;

    // Movement controls
    if (keysRef.current["KeyA"] || keysRef.current["ArrowLeft"]) p.x = Math.max(p.radius, p.x - p.speed);
    if (keysRef.current["KeyD"] || keysRef.current["ArrowRight"]) p.x = Math.min(800 - p.radius, p.x + p.speed);
    if (keysRef.current["KeyW"] || keysRef.current["ArrowUp"]) p.y = Math.max(p.radius, p.y - p.speed);
    if (keysRef.current["KeyS"] || keysRef.current["ArrowDown"]) p.y = Math.min(600 - p.radius, p.y + p.speed);

    // Mouse aiming / continuous shooting
    if (isMouseDownRef.current || keysRef.current["Space"]) {
      fireWeapon(performance.now());
    }

    // Energy & Shield Passive Recharge
    p.energy = Math.min(p.maxEnergy, p.energy + 0.25);
    p.shield = Math.min(p.maxShield, p.shield + 0.08);
    p.wingAngle += 0.05;

    // Update Skill Cooldowns
    Object.keys(skillCooldownsRef.current).forEach((k) => {
      if (skillCooldownsRef.current[k] > 0) {
        skillCooldownsRef.current[k] = Math.max(0, skillCooldownsRef.current[k] - dt / 1000);
      }
    });

    // ── Update Bullets ──────────────────────────────────────────────────────
    bulletsRef.current = bulletsRef.current.filter((b) => {
      b.x += b.vx;
      b.y += b.vy;
      return b.y > -20 && b.y < 620 && b.x > -20 && b.x < 820;
    });

    // ── Update Enemies & Enemy Shooting ─────────────────────────────────────
    const now = performance.now();
    enemiesRef.current.forEach((e) => {
      e.x += e.vx;
      e.y += e.vy;

      // Bounce off walls
      if (e.x < e.radius || e.x > 800 - e.radius) e.vx *= -1;

      // Enemy shooting logic
      if (now - e.lastShot > e.shootCooldown) {
        e.lastShot = now;
        if (e.type === "boss") {
          // Boss radial burst
          for (let a = 0; a < Math.PI * 2; a += Math.PI / 4) {
            bulletsRef.current.push({
              id: `eb_${now}_${a}`,
              x: e.x,
              y: e.y + e.radius,
              vx: Math.cos(a) * 4,
              vy: Math.sin(a) * 4,
              damage: 15,
              color: "#f43f5e",
              radius: 5,
              isPlayer: false,
            });
          }
        } else {
          bulletsRef.current.push({
            id: `eb_${now}`,
            x: e.x,
            y: e.y + e.radius,
            vx: 0,
            vy: 5,
            damage: 12,
            color: "#ec4899",
            radius: 4,
            isPlayer: false,
          });
        }
      }
    });

    // Remove off-screen non-boss enemies and wrap them back
    enemiesRef.current.forEach((e) => {
      if (e.y > 650 && e.type !== "boss") {
        e.y = -40;
        e.x = 50 + Math.random() * 700;
      }
    });

    // ── Collision Detection: Player Bullets -> Enemies ──────────────────────
    bulletsRef.current.forEach((b) => {
      if (!b.isPlayer) return;
      enemiesRef.current.forEach((e) => {
        const dx = b.x - e.x;
        const dy = b.y - e.y;
        const dist = Math.hypot(dx, dy);

        if (dist < b.radius + e.radius) {
          e.hp -= b.damage;
          b.y = -999; // destroy bullet
          spawnParticles(b.x, b.y, b.color, 6, "spark");

          // Enemy Destroyed
          if (e.hp <= 0) {
            p.score += e.scoreValue;
            p.credits += e.creditsValue;
            p.kills += 1;
            p.combos += 1;
            p.overdrive = Math.min(p.maxOverdrive, p.overdrive + 12);

            spawnParticles(e.x, e.y, e.color, e.type === "boss" ? 40 : 18, "circle");
            audioSynth.playExplosionSound(e.type === "boss" ? "boss" : e.type === "dreadnought" ? "heavy" : "small");

            // Update achievement progress
            setAchievements((prev) =>
              prev.map((ach) => {
                if (ach.id === "first_blood") {
                  const prog = Math.min(ach.target, ach.progress + 1);
                  return { ...ach, progress: prog, unlocked: prog >= ach.target };
                }
                if (ach.id === "dreadnought_slayer" && e.type === "boss") {
                  const prog = Math.min(ach.target, ach.progress + 1);
                  return { ...ach, progress: prog, unlocked: prog >= ach.target };
                }
                if (ach.id === "century_kills") {
                  const prog = Math.min(ach.target, ach.progress + 1);
                  return { ...ach, progress: prog, unlocked: prog >= ach.target };
                }
                return ach;
              })
            );
          }
        }
      });
    });

    // Filter dead enemies
    enemiesRef.current = enemiesRef.current.filter((e) => e.hp > 0);

    // If all enemies dead -> Next Sector Wave
    if (enemiesRef.current.length === 0) {
      const nextSec = sector + 1;
      setSector(nextSec);
      spawnWave(nextSec, gameMode);
    }

    // ── Collision Detection: Enemy Bullets -> Player ────────────────────────
    bulletsRef.current.forEach((b) => {
      if (b.isPlayer) return;
      const dx = b.x - p.x;
      const dy = b.y - p.y;
      const dist = Math.hypot(dx, dy);

      if (dist < b.radius + p.radius) {
        b.y = 9999; // destroy bullet
        let dmg = b.damage;

        if (p.shield > 0) {
          if (p.shield >= dmg) {
            p.shield -= dmg;
            dmg = 0;
          } else {
            dmg -= p.shield;
            p.shield = 0;
          }
          audioSynth.playShieldHit();
          spawnParticles(p.x, p.y, "#38bdf8", 8, "ring");
        }

        if (dmg > 0) {
          p.hp -= dmg;
          spawnParticles(p.x, p.y, "#ef4444", 12, "spark");
          audioSynth.playExplosionSound("small");
        }

        // Game Over Check
        if (p.hp <= 0) {
          setGameOver(true);
          setIsPlaying(false);
          audioSynth.playExplosionSound("boss");
          saveStatsToFirebase(p.score, p.credits);
        }
      }
    });

    // ── Update Particles ───────────────────────────────────────────────────
    particlesRef.current = particlesRef.current.filter((pt) => {
      pt.x += pt.vx;
      pt.y += pt.vy;
      pt.life += 1;
      return pt.life < pt.maxLife;
    });
  };

  // ───────────────────────────────────────────────────────────────────────────
  // CANVAS RENDER METHOD
  // ───────────────────────────────────────────────────────────────────────────

  const renderCanvas = (ctx: CanvasRenderingContext2D) => {
    ctx.clearRect(0, 0, 800, 600);

    // Deep Cyber Grid Background
    ctx.strokeStyle = "rgba(56, 189, 248, 0.06)";
    ctx.lineWidth = 1;
    for (let x = 0; x < 800; x += 40) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, 600);
      ctx.stroke();
    }
    for (let y = 0; y < 600; y += 40) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(800, y);
      ctx.stroke();
    }

    // ── Draw Particles ──────────────────────────────────────────────────────
    particlesRef.current.forEach((pt) => {
      ctx.save();
      const alpha = 1 - pt.life / pt.maxLife;
      ctx.globalAlpha = alpha;
      ctx.fillStyle = pt.color;

      if (pt.shape === "ring") {
        ctx.strokeStyle = pt.color;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, pt.radius + pt.life * 1.5, 0, Math.PI * 2);
        ctx.stroke();
      } else {
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, pt.radius, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    });

    // ── Draw Bullets ────────────────────────────────────────────────────────
    bulletsRef.current.forEach((b) => {
      ctx.save();
      ctx.fillStyle = b.color;
      ctx.shadowColor = b.color;
      ctx.shadowBlur = 10;

      ctx.beginPath();
      ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });

    // ── Draw Enemies ────────────────────────────────────────────────────────
    enemiesRef.current.forEach((e) => {
      ctx.save();
      ctx.fillStyle = e.color;
      ctx.shadowColor = e.color;
      ctx.shadowBlur = e.type === "boss" ? 25 : 12;

      if (e.type === "boss") {
        // Boss Mecha Hull Drawing
        ctx.beginPath();
        ctx.moveTo(e.x, e.y + e.radius);
        ctx.lineTo(e.x - e.radius * 1.4, e.y - e.radius * 0.8);
        ctx.lineTo(e.x - e.radius * 0.6, e.y - e.radius * 1.2);
        ctx.lineTo(e.x, e.y - e.radius * 0.6);
        ctx.lineTo(e.x + e.radius * 0.6, e.y - e.radius * 1.2);
        ctx.lineTo(e.x + e.radius * 1.4, e.y - e.radius * 0.8);
        ctx.closePath();
        ctx.fill();

        // Boss HP Bar Above Head
        const hpPct = Math.max(0, e.hp / e.maxHp);
        ctx.fillStyle = "rgba(15, 23, 42, 0.8)";
        ctx.fillRect(e.x - 60, e.y - e.radius - 20, 120, 8);
        ctx.fillStyle = "#ef4444";
        ctx.fillRect(e.x - 60, e.y - e.radius - 20, 120 * hpPct, 8);
      } else {
        ctx.beginPath();
        ctx.arc(e.x, e.y, e.radius, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();
    });

    // ── Draw Valkyrie Player Mecha ──────────────────────────────────────────
    if (isPlaying && !gameOver) {
      const p = playerRef.current;
      ctx.save();
      ctx.translate(p.x, p.y);

      // Overdrive Glow Aura
      if (p.isOverdriveActive) {
        ctx.strokeStyle = "rgba(245, 158, 11, 0.8)";
        ctx.lineWidth = 4;
        ctx.shadowColor = "#f59e0b";
        ctx.shadowBlur = 20;
        ctx.beginPath();
        ctx.arc(0, 0, p.radius + 14, 0, Math.PI * 2);
        ctx.stroke();
      }

      // Energy Shield Circle
      if (p.shield > 0) {
        ctx.strokeStyle = "rgba(56, 189, 248, 0.7)";
        ctx.lineWidth = 2.5;
        ctx.shadowColor = "#38bdf8";
        ctx.shadowBlur = 12;
        ctx.beginPath();
        ctx.arc(0, 0, p.radius + 8, 0, Math.PI * 2);
        ctx.stroke();
      }

      // Animated Valkyrie Mecha Wings
      ctx.fillStyle = "#38bdf8";
      ctx.shadowColor = "#38bdf8";
      ctx.shadowBlur = 15;

      const wingSweep = Math.sin(p.wingAngle) * 4;

      // Left Wing
      ctx.beginPath();
      ctx.moveTo(-6, 0);
      ctx.lineTo(-p.radius * 1.8 - wingSweep, p.radius * 0.8);
      ctx.lineTo(-p.radius * 0.8, -p.radius * 0.8);
      ctx.closePath();
      ctx.fill();

      // Right Wing
      ctx.beginPath();
      ctx.moveTo(6, 0);
      ctx.lineTo(p.radius * 1.8 + wingSweep, p.radius * 0.8);
      ctx.lineTo(p.radius * 0.8, -p.radius * 0.8);
      ctx.closePath();
      ctx.fill();

      // Core Mecha Body Triangle
      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      ctx.moveTo(0, -p.radius * 1.4);
      ctx.lineTo(-p.radius * 0.8, p.radius * 0.8);
      ctx.lineTo(0, p.radius * 0.4);
      ctx.lineTo(p.radius * 0.8, p.radius * 0.8);
      ctx.closePath();
      ctx.fill();

      // Thruster Flame
      ctx.fillStyle = "#f59e0b";
      ctx.beginPath();
      ctx.moveTo(-6, p.radius * 0.6);
      ctx.lineTo(0, p.radius * 1.6 + Math.random() * 8);
      ctx.lineTo(6, p.radius * 0.6);
      ctx.closePath();
      ctx.fill();

      ctx.restore();
    }
  };

  // ───────────────────────────────────────────────────────────────────────────
  // RAF LOOP EFFECT
  // ───────────────────────────────────────────────────────────────────────────

  useEffect(() => {
    const loop = (timestamp: number) => {
      const dt = timestamp - lastTimeRef.current;
      lastTimeRef.current = timestamp;

      updateGameLogic(dt);

      if (canvasRef.current) {
        const ctx = canvasRef.current.getContext("2d");
        if (ctx) renderCanvas(ctx);
      }

      requestRef.current = requestAnimationFrame(loop);
    };

    requestRef.current = requestAnimationFrame(loop);
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [isPlaying, isPaused, gameOver]);

  // ───────────────────────────────────────────────────────────────────────────
  // MOUSE & KEYBOARD EVENT HANDLERS
  // ───────────────────────────────────────────────────────────────────────────

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      keysRef.current[e.code] = true;
      if (e.code === "Digit1") activateSkill("chrono_shift");
      if (e.code === "Digit2") activateSkill("valkyrie_overdrive");
      if (e.code === "Digit3") activateSkill("aegis_matrix");
      if (e.code === "Digit4") activateSkill("orbital_strike");
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      keysRef.current[e.code] = false;
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!canvasRef.current) return;
      const rect = canvasRef.current.getBoundingClientRect();
      mousePosRef.current = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      };
    };

    const handleMouseDown = () => {
      isMouseDownRef.current = true;
    };

    const handleMouseUp = () => {
      isMouseDownRef.current = false;
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mousedown", handleMouseDown);
    window.addEventListener("mouseup", handleMouseUp);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mousedown", handleMouseDown);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [skills]);

  // ───────────────────────────────────────────────────────────────────────────
  // DEV TERMINAL LOGIC
  // ───────────────────────────────────────────────────────────────────────────

  const handleTerminalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!terminalInput.trim()) return;

    const cmd = terminalInput.trim().toLowerCase();
    const newLogs = [...terminalLogs, `> ${terminalInput}`];

    if (cmd === "override_power") {
      playerRef.current.hp = 9999;
      playerRef.current.maxHp = 9999;
      playerRef.current.shield = 9999;
      newLogs.push("[CHEAT] Infinite Valkyrie Hull & Shield Matrix Engaged.");
    } else if (cmd.startsWith("add_credits")) {
      setTotalCredits((prev) => prev + 10000);
      newLogs.push("[CHEAT] Added +10,000 Credits to Armory Vault.");
    } else if (cmd === "infinite_overdrive") {
      playerRef.current.isOverdriveActive = true;
      newLogs.push("[CHEAT] Permanent Valkyrie Overdrive Mode Engaged.");
    } else if (cmd === "clear") {
      setTerminalLogs([]);
      setTerminalInput("");
      return;
    } else {
      newLogs.push(`[ERROR] Unknown command: "${cmd}". Type "override_power", "add_credits", "infinite_overdrive", or "clear".`);
    }

    setTerminalLogs(newLogs);
    setTerminalInput("");
  };

  // ───────────────────────────────────────────────────────────────────────────
  // UI RENDER HELPERS
  // ───────────────────────────────────────────────────────────────────────────

  const p = playerRef.current;

  return (
    <div className="w-full min-h-screen bg-[#05030d] text-white flex flex-col items-center justify-start p-4 md:p-8 font-sans selection:bg-sky-500 selection:text-black">
      {/* ── TOP NAVIGATION & GAME HEADER ───────────────────────────────────── */}
      <header className="w-full max-w-6xl flex flex-col md:flex-row items-center justify-between gap-4 p-4 rounded-3xl bg-white/[0.03] border border-white/10 backdrop-blur-2xl shadow-2xl mb-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-sky-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-sky-500/20">
            <Zap className="w-6 h-6 text-white animate-pulse" />
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-black uppercase italic tracking-tighter bg-gradient-to-r from-sky-400 via-indigo-300 to-purple-400 bg-clip-text text-transparent">
              Astral Valkyrie: Cyber Overdrive
            </h1>
            <p className="text-xs text-white/40 font-mono flex items-center gap-2">
              <span>MECHA SUITE V4.2</span> • <span className="text-emerald-400">FPS: 60</span> •{" "}
              <span className="text-sky-400">SECTOR {sector}</span>
            </p>
          </div>
        </div>

        {/* Tab Selection Navigation */}
        <div className="flex items-center gap-1.5 p-1.5 rounded-2xl bg-black/40 border border-white/10">
          {(["game", "armory", "skills", "achievements", "terminal"] as TabState[]).map((t) => (
            <button
              key={t}
              onClick={() => setActiveTab(t)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
                activeTab === t
                  ? "bg-sky-500 text-black shadow-lg shadow-sky-500/30"
                  : "text-white/50 hover:text-white hover:bg-white/5"
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {/* Sound & Controls */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-bold font-mono">
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>{totalCredits.toLocaleString()} CR</span>
          </div>

          <button
            onClick={() => {
              setMuted(!muted);
              audioSynth.setMuted(!muted);
            }}
            className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-white/60 hover:text-white transition-all"
            title="Toggle Audio"
          >
            {muted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-sky-400" />}
          </button>
        </div>
      </header>

      {/* ── MAIN CONTENT WORKSPACE ─────────────────────────────────────────── */}
      <main className="w-full max-w-6xl flex flex-col items-center justify-center">
        {activeTab === "game" && (
          <div className="w-full flex flex-col items-center gap-4">
            {/* HUD Status Bar */}
            <div className="w-full max-w-[800px] flex items-center justify-between px-6 py-3 rounded-2xl bg-white/[0.03] border border-white/10 backdrop-blur-xl text-xs font-mono">
              <div className="flex items-center gap-4">
                {/* Hull HP */}
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-rose-400" />
                  <div className="w-28 h-2.5 rounded-full bg-white/10 overflow-hidden">
                    <div
                      className="h-full bg-rose-500 transition-all duration-200"
                      style={{ width: `${Math.max(0, (p.hp / p.maxHp) * 100)}%` }}
                    />
                  </div>
                </div>

                {/* Shield */}
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-sky-400" />
                  <div className="w-24 h-2.5 rounded-full bg-white/10 overflow-hidden">
                    <div
                      className="h-full bg-sky-400 transition-all duration-200"
                      style={{ width: `${Math.max(0, (p.shield / p.maxShield) * 100)}%` }}
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-6">
                <div className="text-right">
                  <span className="text-white/40 block text-[10px]">SCORE</span>
                  <span className="text-sky-400 font-bold text-sm">{p.score.toLocaleString()}</span>
                </div>
                <div className="text-right">
                  <span className="text-white/40 block text-[10px]">KILLS</span>
                  <span className="text-emerald-400 font-bold text-sm">{p.kills}</span>
                </div>
              </div>
            </div>

            {/* Canvas Container */}
            <div className="relative w-full max-w-[800px] aspect-[4/3] rounded-3xl overflow-hidden border-2 border-white/10 shadow-2xl shadow-sky-500/10 bg-slate-950">
              <canvas ref={canvasRef} width={800} height={600} className="w-full h-full block" />

              {/* Start / Game Over Overlay */}
              {(!isPlaying || gameOver) && (
                <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-md flex flex-col items-center justify-center gap-6 p-6 text-center z-20">
                  {gameOver ? (
                    <>
                      <div className="w-16 h-16 rounded-3xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center">
                        <AlertTriangle className="w-8 h-8 text-rose-500 animate-bounce" />
                      </div>
                      <div>
                        <h2 className="text-3xl font-black uppercase italic tracking-wider text-rose-400">VALKYRIE HULL DESTROYED</h2>
                        <p className="text-sm text-white/50 mt-1 font-mono">
                          Final Score: {p.score.toLocaleString()} • Credits Earned: +{p.credits} CR
                        </p>
                      </div>

                      <button
                        onClick={() => startGame(gameMode)}
                        className="px-8 py-3 rounded-2xl bg-gradient-to-r from-rose-500 to-sky-500 text-white font-black uppercase tracking-wider text-sm shadow-xl shadow-rose-500/30 hover:scale-105 transition-all"
                      >
                        Re-Deploy Valkyrie
                      </button>
                    </>
                  ) : (
                    <>
                      <div className="w-20 h-20 rounded-3xl bg-sky-500/20 border-2 border-sky-500/40 flex items-center justify-center shadow-2xl shadow-sky-500/30">
                        <Zap className="w-10 h-10 text-sky-400 animate-pulse" />
                      </div>
                      <div>
                        <h2 className="text-3xl font-black uppercase italic tracking-wider">ASTRAL VALKYRIE MECHA</h2>
                        <p className="text-xs text-white/50 max-w-md mx-auto mt-2 leading-relaxed">
                          Pilot the Valkyrie-X01 Apex mecha suit through enemy sector waves. Use WASD or Arrow Keys to move, Mouse to aim & shoot, and keys 1-4 for skill matrices.
                        </p>
                      </div>

                      <div className="flex items-center gap-3">
                        {(["campaign", "endless", "boss_rush"] as GameMode[]).map((m) => (
                          <button
                            key={m}
                            onClick={() => startGame(m)}
                            className="px-6 py-3 rounded-2xl bg-sky-500 hover:bg-sky-400 text-black font-black uppercase tracking-wider text-xs shadow-xl shadow-sky-500/30 hover:scale-105 transition-all"
                          >
                            Launch {m.replace("_", " ")}
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Quick Skill Bar Controls Below Canvas */}
            <div className="w-full max-w-[800px] grid grid-cols-4 gap-3">
              {skills.map((sk, idx) => {
                const cd = skillCooldownsRef.current[sk.id] || 0;
                return (
                  <button
                    key={sk.id}
                    onClick={() => activateSkill(sk.id)}
                    disabled={!sk.unlocked || cd > 0}
                    className={`p-3 rounded-2xl border flex flex-col items-center justify-center gap-1 transition-all relative overflow-hidden ${
                      sk.unlocked && cd === 0
                        ? "bg-white/5 border-white/10 hover:border-sky-500/50 hover:bg-sky-500/10 text-white"
                        : "bg-white/[0.02] border-white/5 text-white/30"
                    }`}
                  >
                    <span className="absolute top-1.5 left-2 text-[9px] font-mono text-white/40">[{idx + 1}]</span>
                    <Zap className="w-4 h-4 text-sky-400 mb-0.5" />
                    <span className="text-[10px] font-bold truncate max-w-full">{sk.name}</span>
                    {cd > 0 && <span className="text-[10px] font-mono text-amber-400 font-bold">{cd.toFixed(1)}s</span>}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* ── TAB: ARMORY & WEAPON UPGRADES ─────────────────────────────────── */}
        {activeTab === "armory" && (
          <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 gap-4">
            {weapons.map((w) => (
              <div
                key={w.id}
                className={`p-5 rounded-3xl border transition-all flex flex-col justify-between gap-4 ${
                  selectedWeaponId === w.id
                    ? "bg-sky-500/10 border-sky-500/40 shadow-xl shadow-sky-500/10"
                    : "bg-white/[0.03] border-white/10"
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-mono font-bold uppercase tracking-widest text-sky-400">
                      LVL {w.level}/{w.maxLevel}
                    </span>
                    <span className="text-xs font-mono text-white/40">{w.damage} DMG</span>
                  </div>
                  <h3 className="text-lg font-black uppercase italic tracking-tight">{w.name}</h3>
                  <p className="text-xs text-white/50 mt-1 leading-relaxed">{w.description}</p>
                </div>

                <div className="flex items-center gap-2">
                  {!w.unlocked ? (
                    <button
                      onClick={() => {
                        if (totalCredits >= w.costCredits) {
                          setTotalCredits((prev) => prev - w.costCredits);
                          setWeapons((prev) => prev.map((item) => (item.id === w.id ? { ...item, unlocked: true } : item)));
                        }
                      }}
                      disabled={totalCredits < w.costCredits}
                      className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-30 text-black font-black uppercase tracking-wider text-xs shadow-lg transition-all"
                    >
                      Unlock ({w.costCredits} CR)
                    </button>
                  ) : (
                    <button
                      onClick={() => setSelectedWeaponId(w.id)}
                      className={`w-full py-2.5 rounded-xl font-black uppercase tracking-wider text-xs transition-all ${
                        selectedWeaponId === w.id
                          ? "bg-sky-500 text-black"
                          : "bg-white/10 hover:bg-white/20 text-white"
                      }`}
                    >
                      {selectedWeaponId === w.id ? "Equipped" : "Equip Weapon"}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── TAB: SKILL TREE ──────────────────────────────────────────────── */}
        {activeTab === "skills" && (
          <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 gap-4">
            {skills.map((sk) => (
              <div key={sk.id} className="p-5 rounded-3xl bg-white/[0.03] border border-white/10 flex flex-col justify-between gap-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-mono text-purple-400 font-bold uppercase tracking-wider">{sk.category}</span>
                    <span className="text-xs font-mono text-white/40">{sk.cooldown}s CD</span>
                  </div>
                  <h3 className="text-lg font-black uppercase italic tracking-tight">{sk.name}</h3>
                  <p className="text-xs text-white/50 mt-1 leading-relaxed">{sk.description}</p>
                </div>

                {!sk.unlocked && (
                  <button
                    onClick={() => {
                      if (totalCredits >= sk.costCredits) {
                        setTotalCredits((prev) => prev - sk.costCredits);
                        setSkills((prev) => prev.map((s) => (s.id === sk.id ? { ...s, unlocked: true } : s)));
                      }
                    }}
                    disabled={totalCredits < sk.costCredits}
                    className="w-full py-2.5 rounded-xl bg-purple-500 hover:bg-purple-400 disabled:opacity-30 text-white font-black uppercase tracking-wider text-xs shadow-lg transition-all"
                  >
                    Unlock Skill ({sk.costCredits} CR)
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        {/* ── TAB: ACHIEVEMENTS ────────────────────────────────────────────── */}
        {activeTab === "achievements" && (
          <div className="w-full max-w-4xl space-y-3">
            {achievements.map((ach) => (
              <div key={ach.id} className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-white">{ach.title}</h4>
                  <p className="text-xs text-white/40">{ach.description}</p>
                </div>
                <div className="flex items-center gap-4 font-mono text-xs">
                  <span className="text-amber-400">+{ach.rewardCredits} CR</span>
                  <span className={ach.unlocked ? "text-emerald-400 font-bold" : "text-white/30"}>
                    {ach.progress}/{ach.target}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── TAB: DEV TERMINAL ────────────────────────────────────────────── */}
        {activeTab === "terminal" && (
          <div className="w-full max-w-4xl rounded-3xl bg-black/60 border border-white/10 p-4 font-mono text-xs text-emerald-400 shadow-2xl">
            <div className="h-64 overflow-y-auto space-y-1 mb-4 p-2 bg-black/40 rounded-2xl border border-white/5">
              {terminalLogs.map((l, idx) => (
                <p key={idx} className="leading-relaxed">
                  {l}
                </p>
              ))}
            </div>

            <form onSubmit={handleTerminalSubmit} className="flex gap-2">
              <input
                type="text"
                value={terminalInput}
                onChange={(e) => setTerminalInput(e.target.value)}
                placeholder="Enter command (e.g. override_power, add_credits, infinite_overdrive)..."
                className="flex-1 px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-xs text-white placeholder:text-white/20 focus:outline-none focus:border-emerald-500"
              />
              <button type="submit" className="px-5 py-2.5 rounded-xl bg-emerald-500 text-black font-bold uppercase text-xs">
                Run
              </button>
            </form>
          </div>
        )}
      </main>
    </div>
  );
}
