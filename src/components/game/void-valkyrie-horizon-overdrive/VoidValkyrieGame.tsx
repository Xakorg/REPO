"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Shield, Zap, Award, Flame, Play, Pause, RotateCcw, Volume2, VolumeX,
  Crosshair, Sparkles, Terminal, ChevronRight, Settings, Radio, Cpu,
  Compass, Swords, RefreshCw, ShoppingBag, Lock, Unlock, Star, ArrowUpRight,
  Maximize2, Activity, Battery, Target, AlertTriangle, Eye, Rocket, Navigation
} from "lucide-react";
import { useUser, useFirestore, setDocumentNonBlocking } from "@/firebase";
import { doc, getDoc } from "firebase/firestore";

// ─────────────────────────────────────────────────────────────────────────────
// TYPES & INTERFACES
// ─────────────────────────────────────────────────────────────────────────────

export type GameMode = "campaign" | "endless" | "boss_rush";
export type TabState = "game" | "armory" | "skills" | "achievements" | "terminal";

export interface WeaponOption {
  id: string;
  name: string;
  type: "pulse" | "singularity" | "railgun" | "tachyon";
  level: number;
  maxLevel: number;
  damage: number;
  fireRate: number; // ms
  energyCost: number;
  costCredits: number;
  description: string;
  unlocked: boolean;
  color: string;
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
  vz?: number;
  radius: number;
  color: string;
  life: number;
  maxLife: number;
  shape?: "circle" | "spark" | "ring";
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
}

export interface EnemyShip {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  hp: number;
  maxHp: number;
  type: "drone" | "interceptor" | "frigate" | "boss";
  name: string;
  color: string;
  radius: number;
  shootCooldown: number;
  lastShot: number;
  scoreValue: number;
  creditsValue: number;
}

export interface ValkyrieFighter {
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
  credits: number;
  rollAngle: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// WEB AUDIO SYNTHESIZER ENGINE
// ─────────────────────────────────────────────────────────────────────────────
class VoidAudioEngine {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;

  private initCtx() {
    if (!this.ctx && typeof window !== "undefined") {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) this.ctx = new AudioCtx();
    }
    if (this.ctx && this.ctx.state === "suspended") {
      this.ctx.resume();
    }
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
  }

  public playLaserShot(freq: number = 820) {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(140, this.ctx.currentTime + 0.11);

      gain.gain.setValueAtTime(0.14, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.11);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + 0.11);
    } catch {}
  }

  public playExplosion(intensity: "small" | "heavy" | "boss" = "small") {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    try {
      const duration = intensity === "boss" ? 0.7 : intensity === "heavy" ? 0.35 : 0.18;
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
      filter.frequency.setValueAtTime(intensity === "boss" ? 350 : 750, this.ctx.currentTime);
      filter.frequency.exponentialRampToValueAtTime(25, this.ctx.currentTime + duration);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(intensity === "boss" ? 0.35 : 0.18, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);

      noise.start();
      noise.stop(this.ctx.currentTime + duration);
    } catch {}
  }
}

const audioSynth = new VoidAudioEngine();

// ─────────────────────────────────────────────────────────────────────────────
// INITIAL DEFAULT CONFIGURATIONS
// ─────────────────────────────────────────────────────────────────────────────

const INITIAL_WEAPONS: WeaponOption[] = [
  {
    id: "twin_void_pulse",
    name: "Twin Void Pulse Blasters",
    type: "pulse",
    level: 1,
    maxLevel: 5,
    damage: 28,
    fireRate: 170,
    energyCost: 2,
    costCredits: 0,
    description: "Rapid high-frequency void energy cannons mounted on Valkyrie wings.",
    unlocked: true,
    color: "#38bdf8",
  },
  {
    id: "singularity_cannon",
    name: "Singularity Rail Cannon",
    type: "singularity",
    level: 1,
    maxLevel: 5,
    damage: 90,
    fireRate: 480,
    energyCost: 14,
    costCredits: 1400,
    description: "Launches heavy gravitational singularity bolts that tear through enemy shields.",
    unlocked: false,
    color: "#a855f7",
  },
  {
    id: "hyper_railgun",
    name: "Hyper-Kinetic Railgun",
    type: "railgun",
    level: 1,
    maxLevel: 5,
    damage: 150,
    fireRate: 700,
    energyCost: 22,
    costCredits: 3200,
    description: "Ultra high-velocity tungsten projectile capable of piercing multiple enemy hulls.",
    unlocked: false,
    color: "#f59e0b",
  },
  {
    id: "quantum_tachyon_beam",
    name: "Quantum Tachyon Beam",
    type: "tachyon",
    level: 1,
    maxLevel: 5,
    damage: 200,
    fireRate: 850,
    energyCost: 30,
    costCredits: 6500,
    description: "Continuous thermal tachyon laser beam causing catastrophic boss damage.",
    unlocked: false,
    color: "#10b981",
  },
];

const INITIAL_SKILLS: SkillNode[] = [
  {
    id: "stasis_field",
    name: "Stasis Temporal Field",
    icon: "Zap",
    description: "Slows surrounding enemy projectiles and movement by 80% for 6 seconds.",
    cooldown: 22,
    duration: 6,
    energyCost: 35,
    unlocked: true,
    active: false,
    costCredits: 0,
    category: "utility",
  },
  {
    id: "reactor_overdrive",
    name: "Valkyrie Reactor Overdrive",
    icon: "Flame",
    description: "Unleashes 100% reactor power, doubling weapon fire rate and damage output.",
    cooldown: 28,
    duration: 8,
    energyCost: 45,
    unlocked: true,
    active: false,
    costCredits: 1800,
    category: "offense",
  },
  {
    id: "kinetic_barrier",
    name: "Aegis Kinetic Barrier",
    icon: "Shield",
    description: "Instantly recharges 100% Valkyrie shield matrix and repels nearby attacks.",
    cooldown: 20,
    duration: 3,
    energyCost: 40,
    unlocked: false,
    active: false,
    costCredits: 3500,
    category: "defense",
  },
];

const INITIAL_ACHIEVEMENTS: AchievementItem[] = [
  {
    id: "horizon_sweeper",
    title: "Galactic Horizon Ace",
    description: "Destroy 20 enemy Void fighters in combat.",
    unlocked: false,
    progress: 0,
    target: 20,
    rewardCredits: 700,
    icon: "Rocket",
  },
  {
    id: "overlord_slayer",
    title: "Void Overlord Hunter",
    description: "Defeat 2 Colossal Boss Warships.",
    unlocked: false,
    progress: 0,
    target: 2,
    rewardCredits: 3000,
    icon: "Award",
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

export default function VoidValkyrieGame() {
  const { user } = useUser();
  const firestore = useFirestore();

  // Canvas & RAF Loop Refs
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const requestRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(performance.now());
  const lastShotTimeRef = useRef<number>(0);

  // Controls Input State
  const keysRef = useRef<{ [key: string]: boolean }>({});
  const mousePosRef = useRef<{ x: number; y: number }>({ x: 400, y: 300 });
  const isMouseDownRef = useRef<boolean>(false);

  // Game States
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [gameOver, setGameOver] = useState<boolean>(false);
  const [gameMode, setGameMode] = useState<GameMode>("campaign");
  const [activeTab, setActiveTab] = useState<TabState>("game");

  // Audio State
  const [muted, setMuted] = useState<boolean>(false);

  // Armory & Stats
  const [weapons, setWeapons] = useState<WeaponOption[]>(INITIAL_WEAPONS);
  const [selectedWeaponId, setSelectedWeaponId] = useState<string>("twin_void_pulse");
  const [skills, setSkills] = useState<SkillNode[]>(INITIAL_SKILLS);
  const [achievements, setAchievements] = useState<AchievementItem[]>(INITIAL_ACHIEVEMENTS);

  const [sector, setSector] = useState<number>(1);
  const [totalCredits, setTotalCredits] = useState<number>(3500);
  const [highScore, setHighScore] = useState<number>(0);

  // Dynamic Game State Refs
  const fighterRef = useRef<ValkyrieFighter>({
    x: 400,
    y: 520,
    radius: 20,
    hp: 250,
    maxHp: 250,
    shield: 120,
    maxShield: 120,
    energy: 100,
    maxEnergy: 100,
    overdrive: 0,
    maxOverdrive: 100,
    isOverdriveActive: false,
    speed: 7.0,
    score: 0,
    kills: 0,
    credits: 0,
    rollAngle: 0,
  });

  const enemiesRef = useRef<EnemyShip[]>([]);
  const bulletsRef = useRef<Bullet[]>([]);
  const particlesRef = useRef<ParticleEffect[]>([]);
  const skillCooldownsRef = useRef<{ [key: string]: number }>({});

  // Dev Terminal State
  const [terminalInput, setTerminalInput] = useState("");
  const [terminalLogs, setTerminalLogs] = useState<string[]>([
    "[SYSTEM ONLINE] Void Valkyrie V-9 Horizon Engine Initialized.",
    "[STATUS] Reactor matrices online. Warp course plotted.",
  ]);

  // Load Persistence
  useEffect(() => {
    if (!user || !firestore) return;
    const docRef = doc(firestore, `users/${user.uid}/game_stats`, "void_valkyrie_horizon_overdrive");
    getDoc(docRef)
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
      const docRef = doc(firestore, `users/${user.uid}/game_stats`, "void_valkyrie_horizon_overdrive");
      setDocumentNonBlocking(
        docRef,
        {
          highScore: Math.max(highScore, newScore),
          totalCredits: totalCredits + earnedCredits,
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

    fighterRef.current = {
      x: 400,
      y: 520,
      radius: 20,
      hp: 250,
      maxHp: 250,
      shield: 120,
      maxShield: 120,
      energy: 100,
      maxEnergy: 100,
      overdrive: 0,
      maxOverdrive: 100,
      isOverdriveActive: false,
      speed: 7.0,
      score: 0,
      kills: 0,
      credits: 0,
      rollAngle: 0,
    };

    bulletsRef.current = [];
    enemiesRef.current = [];
    particlesRef.current = [];
    skillCooldownsRef.current = {};

    spawnWave(1, mode);
  };

  const spawnWave = (currentSector: number, mode: GameMode) => {
    const isBossSector = currentSector % 3 === 0 || mode === "boss_rush";
    const enemyCount = mode === "boss_rush" ? 1 : 5 + currentSector * 2;

    const newEnemies: EnemyShip[] = [];

    if (isBossSector) {
      newEnemies.push({
        id: `boss_${Date.now()}`,
        x: 400,
        y: 110,
        vx: 2.8,
        vy: 0,
        hp: 1400 + currentSector * 700,
        maxHp: 1400 + currentSector * 700,
        type: "boss",
        name: `Void Overlord Omega Mk-${currentSector}`,
        color: "#f43f5e",
        radius: 48,
        shootCooldown: 750,
        lastShot: 0,
        scoreValue: 5500,
        creditsValue: 1400,
      });
    } else {
      for (let i = 0; i < enemyCount; i++) {
        const isFrigate = Math.random() > 0.7;
        newEnemies.push({
          id: `enemy_${Date.now()}_${i}`,
          x: 60 + Math.random() * 680,
          y: -40 - i * 50,
          vx: (Math.random() - 0.5) * 3.5,
          vy: 1.8 + Math.random() * 1.5,
          hp: isFrigate ? 200 : 65,
          maxHp: isFrigate ? 200 : 65,
          type: isFrigate ? "frigate" : Math.random() > 0.5 ? "interceptor" : "drone",
          name: isFrigate ? "Void Frigate" : "Void Drone",
          color: isFrigate ? "#c084fc" : "#38bdf8",
          radius: isFrigate ? 26 : 15,
          shootCooldown: isFrigate ? 1100 : 1700,
          lastShot: 0,
          scoreValue: isFrigate ? 420 : 150,
          creditsValue: isFrigate ? 85 : 30,
        });
      }
    }

    enemiesRef.current = newEnemies;
  };

  // ───────────────────────────────────────────────────────────────────────────
  // PARTICLE SYSTEM ENGINE
  // ───────────────────────────────────────────────────────────────────────────

  const spawnParticles = (x: number, y: number, color: string, count: number = 10, shape: "circle" | "spark" | "ring" = "circle") => {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 1 + Math.random() * 5.5;
      particlesRef.current.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        radius: 2 + Math.random() * 3.5,
        color,
        life: 0,
        maxLife: 18 + Math.random() * 22,
        shape,
      });
    }
  };

  // ───────────────────────────────────────────────────────────────────────────
  // SHOOTING LOGIC
  // ───────────────────────────────────────────────────────────────────────────

  const fireWeapon = (now: number) => {
    const activeWeapon = weapons.find((w) => w.id === selectedWeaponId) || weapons[0];
    if (now - lastShotTimeRef.current < activeWeapon.fireRate) return;
    if (fighterRef.current.energy < activeWeapon.energyCost) return;

    lastShotTimeRef.current = now;
    fighterRef.current.energy = Math.max(0, fighterRef.current.energy - activeWeapon.energyCost);

    const fx = fighterRef.current.x;
    const fy = fighterRef.current.y - fighterRef.current.radius;
    const dmg = fighterRef.current.isOverdriveActive ? activeWeapon.damage * 2 : activeWeapon.damage;

    bulletsRef.current.push(
      { id: `b_${now}_1`, x: fx - 14, y: fy, vx: 0, vy: -15, damage: dmg, color: activeWeapon.color, radius: 4, isPlayer: true },
      { id: `b_${now}_2`, x: fx + 14, y: fy, vx: 0, vy: -15, damage: dmg, color: activeWeapon.color, radius: 4, isPlayer: true }
    );

    audioSynth.playLaserShot(850);
    spawnParticles(fx, fy, activeWeapon.color, 4, "spark");
  };

  // ───────────────────────────────────────────────────────────────────────────
  // SKILL ACTIVATION
  // ───────────────────────────────────────────────────────────────────────────

  const activateSkill = (skillId: string) => {
    const sk = skills.find((s) => s.id === skillId);
    if (!sk || !sk.unlocked) return;

    const cd = skillCooldownsRef.current[skillId] || 0;
    if (cd > 0) return;
    if (fighterRef.current.energy < sk.energyCost) return;

    fighterRef.current.energy -= sk.energyCost;
    skillCooldownsRef.current[skillId] = sk.cooldown;

    if (skillId === "reactor_overdrive") {
      fighterRef.current.isOverdriveActive = true;
      setTimeout(() => {
        fighterRef.current.isOverdriveActive = false;
      }, sk.duration * 1000);
    } else if (skillId === "kinetic_barrier") {
      fighterRef.current.shield = fighterRef.current.maxShield;
      spawnParticles(fighterRef.current.x, fighterRef.current.y, "#38bdf8", 25, "ring");
    }
  };

  // ───────────────────────────────────────────────────────────────────────────
  // GAME LOOP & LOGIC
  // ───────────────────────────────────────────────────────────────────────────

  const updateGameLogic = (dt: number) => {
    if (!isPlaying || isPaused || gameOver) return;

    const f = fighterRef.current;
    const now = performance.now();

    // Movement Controls
    if (keysRef.current["KeyA"] || keysRef.current["ArrowLeft"]) {
      f.x = Math.max(f.radius, f.x - f.speed);
      f.rollAngle = -0.3;
    } else if (keysRef.current["KeyD"] || keysRef.current["ArrowRight"]) {
      f.x = Math.min(800 - f.radius, f.x + f.speed);
      f.rollAngle = 0.3;
    } else {
      f.rollAngle = 0;
    }

    if (keysRef.current["KeyW"] || keysRef.current["ArrowUp"]) f.y = Math.max(f.radius, f.y - f.speed);
    if (keysRef.current["KeyS"] || keysRef.current["ArrowDown"]) f.y = Math.min(600 - f.radius, f.y + f.speed);

    if (isMouseDownRef.current || keysRef.current["Space"]) {
      fireWeapon(now);
    }

    // Energy & Shield Passive Recovery
    f.energy = Math.min(f.maxEnergy, f.energy + 0.3);
    f.shield = Math.min(f.maxShield, f.shield + 0.1);

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
    enemiesRef.current.forEach((e) => {
      e.x += e.vx;
      e.y += e.vy;

      if (e.x < e.radius || e.x > 800 - e.radius) e.vx *= -1;

      if (now - e.lastShot > e.shootCooldown) {
        e.lastShot = now;
        bulletsRef.current.push({
          id: `eb_${now}`,
          x: e.x,
          y: e.y + e.radius,
          vx: 0,
          vy: 5.5,
          damage: 14,
          color: "#ec4899",
          radius: 4,
          isPlayer: false,
        });
      }
    });

    // Respawn off-screen non-boss enemies
    enemiesRef.current.forEach((e) => {
      if (e.y > 640 && e.type !== "boss") {
        e.y = -30;
        e.x = 50 + Math.random() * 700;
      }
    });

    // ── Collision: Player Bullets -> Enemies ────────────────────────────────
    bulletsRef.current.forEach((b) => {
      if (!b.isPlayer) return;
      enemiesRef.current.forEach((e) => {
        const dist = Math.hypot(b.x - e.x, b.y - e.y);
        if (dist < b.radius + e.radius) {
          e.hp -= b.damage;
          b.y = -999;
          spawnParticles(b.x, b.y, b.color, 5, "spark");

          if (e.hp <= 0) {
            f.score += e.scoreValue;
            f.credits += e.creditsValue;
            f.kills += 1;
            spawnParticles(e.x, e.y, e.color, e.type === "boss" ? 35 : 15, "circle");
            audioSynth.playExplosion(e.type === "boss" ? "boss" : "small");

            setAchievements((prev) =>
              prev.map((ach) => {
                if (ach.id === "horizon_sweeper") {
                  const prog = Math.min(ach.target, ach.progress + 1);
                  return { ...ach, progress: prog, unlocked: prog >= ach.target };
                }
                if (ach.id === "overlord_slayer" && e.type === "boss") {
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

    enemiesRef.current = enemiesRef.current.filter((e) => e.hp > 0);

    if (enemiesRef.current.length === 0) {
      const nextSec = sector + 1;
      setSector(nextSec);
      spawnWave(nextSec, gameMode);
    }

    // ── Collision: Enemy Bullets -> Valkyrie Fighter ────────────────────────
    bulletsRef.current.forEach((b) => {
      if (b.isPlayer) return;
      const dist = Math.hypot(b.x - f.x, b.y - f.y);
      if (dist < b.radius + f.radius) {
        b.y = 9999;
        let dmg = b.damage;

        if (f.shield > 0) {
          if (f.shield >= dmg) {
            f.shield -= dmg;
            dmg = 0;
          } else {
            dmg -= f.shield;
            f.shield = 0;
          }
          spawnParticles(f.x, f.y, "#38bdf8", 6, "ring");
        }

        if (dmg > 0) {
          f.hp -= dmg;
          spawnParticles(f.x, f.y, "#ef4444", 10, "spark");
          audioSynth.playExplosion("small");
        }

        if (f.hp <= 0) {
          setGameOver(true);
          setIsPlaying(false);
          audioSynth.playExplosion("boss");
          saveStatsToFirebase(f.score, f.credits);
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
  // CANVAS RENDER ENGINE
  // ───────────────────────────────────────────────────────────────────────────

  const renderCanvas = (ctx: CanvasRenderingContext2D) => {
    ctx.clearRect(0, 0, 800, 600);

    // Warp Grid Lines
    ctx.strokeStyle = "rgba(168, 85, 247, 0.06)";
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

    // Draw Particles
    particlesRef.current.forEach((pt) => {
      ctx.save();
      ctx.globalAlpha = 1 - pt.life / pt.maxLife;
      ctx.fillStyle = pt.color;

      if (pt.shape === "ring") {
        ctx.strokeStyle = pt.color;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, pt.radius + pt.life * 1.4, 0, Math.PI * 2);
        ctx.stroke();
      } else {
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, pt.radius, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    });

    // Draw Bullets
    bulletsRef.current.forEach((b) => {
      ctx.save();
      ctx.fillStyle = b.color;
      ctx.shadowColor = b.color;
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });

    // Draw Enemies
    enemiesRef.current.forEach((e) => {
      ctx.save();
      ctx.fillStyle = e.color;
      ctx.shadowColor = e.color;
      ctx.shadowBlur = e.type === "boss" ? 22 : 10;
      ctx.beginPath();
      ctx.arc(e.x, e.y, e.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });

    // Draw Valkyrie Fighter V-9
    if (isPlaying && !gameOver) {
      const f = fighterRef.current;
      ctx.save();
      ctx.translate(f.x, f.y);
      ctx.rotate(f.rollAngle);

      if (f.shield > 0) {
        ctx.strokeStyle = "rgba(56, 189, 248, 0.7)";
        ctx.lineWidth = 2.5;
        ctx.shadowColor = "#38bdf8";
        ctx.shadowBlur = 14;
        ctx.beginPath();
        ctx.arc(0, 0, f.radius + 8, 0, Math.PI * 2);
        ctx.stroke();
      }

      ctx.fillStyle = "#38bdf8";
      ctx.shadowColor = "#38bdf8";
      ctx.shadowBlur = 15;

      // Fighter Wings
      ctx.beginPath();
      ctx.moveTo(0, -f.radius * 1.5);
      ctx.lineTo(-f.radius * 1.6, f.radius * 0.8);
      ctx.lineTo(0, f.radius * 0.4);
      ctx.lineTo(f.radius * 1.6, f.radius * 0.8);
      ctx.closePath();
      ctx.fill();

      // Thruster Flame
      ctx.fillStyle = "#f59e0b";
      ctx.beginPath();
      ctx.moveTo(-5, f.radius * 0.6);
      ctx.lineTo(0, f.radius * 1.5 + Math.random() * 6);
      ctx.lineTo(5, f.radius * 0.6);
      ctx.closePath();
      ctx.fill();

      ctx.restore();
    }
  };

  // RAF Effect
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

  // Keyboard & Mouse Listeners
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      keysRef.current[e.code] = true;
      if (e.code === "Digit1") activateSkill("stasis_field");
      if (e.code === "Digit2") activateSkill("reactor_overdrive");
      if (e.code === "Digit3") activateSkill("kinetic_barrier");
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

  // Dev Terminal Submit
  const handleTerminalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!terminalInput.trim()) return;

    const cmd = terminalInput.trim().toLowerCase();
    const newLogs = [...terminalLogs, `> ${terminalInput}`];

    if (cmd === "override_power") {
      fighterRef.current.hp = 99999;
      fighterRef.current.shield = 99999;
      newLogs.push("[CHEAT] Void Valkyrie Invincibility Matrix Engaged.");
    } else if (cmd.startsWith("add_credits")) {
      setTotalCredits((prev) => prev + 20000);
      newLogs.push("[CHEAT] Added +20,000 Credits to Armory Vault.");
    } else if (cmd === "clear") {
      setTerminalLogs([]);
      setTerminalInput("");
      return;
    } else {
      newLogs.push(`[ERROR] Unknown command: "${cmd}". Type "override_power", "add_credits", or "clear".`);
    }

    setTerminalLogs(newLogs);
    setTerminalInput("");
  };

  const f = fighterRef.current;

  return (
    <div className="w-full min-h-screen bg-[#05030d] text-white flex flex-col items-center justify-start p-4 md:p-8 font-sans selection:bg-purple-500 selection:text-black">
      {/* Top Header Navigation */}
      <header className="w-full max-w-6xl flex flex-col md:flex-row items-center justify-between gap-4 p-4 rounded-3xl bg-white/[0.03] border border-white/10 backdrop-blur-2xl shadow-2xl mb-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-500 to-sky-500 flex items-center justify-center shadow-lg shadow-purple-500/20">
            <Rocket className="w-6 h-6 text-white animate-pulse" />
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-black uppercase italic tracking-tighter bg-gradient-to-r from-purple-400 via-sky-300 to-indigo-400 bg-clip-text text-transparent">
              Void Valkyrie: Horizon Overdrive
            </h1>
            <p className="text-xs text-white/40 font-mono flex items-center gap-2">
              <span>WARP ENGINE V9.0</span> • <span className="text-emerald-400">SECTOR {sector}</span>
            </p>
          </div>
        </div>

        {/* Tab Selection */}
        <div className="flex items-center gap-1.5 p-1.5 rounded-2xl bg-black/40 border border-white/10">
          {(["game", "armory", "skills", "achievements", "terminal"] as TabState[]).map((t) => (
            <button
              key={t}
              onClick={() => setActiveTab(t)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
                activeTab === t
                  ? "bg-purple-500 text-white shadow-lg shadow-purple-500/30"
                  : "text-white/50 hover:text-white hover:bg-white/5"
              }`}
            >
              {t}
            </button>
          ))}
        </div>

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
          >
            {muted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-purple-400" />}
          </button>
        </div>
      </header>

      {/* Main Workspace */}
      <main className="w-full max-w-6xl flex flex-col items-center justify-center">
        {activeTab === "game" && (
          <div className="w-full flex flex-col items-center gap-4">
            {/* HUD Bar */}
            <div className="w-full max-w-[800px] flex items-center justify-between px-6 py-3 rounded-2xl bg-white/[0.03] border border-white/10 backdrop-blur-xl text-xs font-mono">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-rose-400" />
                  <div className="w-28 h-2.5 rounded-full bg-white/10 overflow-hidden">
                    <div
                      className="h-full bg-rose-500 transition-all duration-200"
                      style={{ width: `${Math.max(0, (f.hp / f.maxHp) * 100)}%` }}
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-sky-400" />
                  <div className="w-24 h-2.5 rounded-full bg-white/10 overflow-hidden">
                    <div
                      className="h-full bg-sky-400 transition-all duration-200"
                      style={{ width: `${Math.max(0, (f.shield / f.maxShield) * 100)}%` }}
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-6">
                <div className="text-right">
                  <span className="text-white/40 block text-[10px]">SCORE</span>
                  <span className="text-purple-400 font-bold text-sm">{f.score.toLocaleString()}</span>
                </div>
                <div className="text-right">
                  <span className="text-white/40 block text-[10px]">KILLS</span>
                  <span className="text-emerald-400 font-bold text-sm">{f.kills}</span>
                </div>
              </div>
            </div>

            {/* Canvas Container */}
            <div className="relative w-full max-w-[800px] aspect-[4/3] rounded-3xl overflow-hidden border-2 border-white/10 shadow-2xl shadow-purple-500/10 bg-slate-950">
              <canvas ref={canvasRef} width={800} height={600} className="w-full h-full block" />

              {/* Start / Game Over */}
              {(!isPlaying || gameOver) && (
                <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-md flex flex-col items-center justify-center gap-6 p-6 text-center z-20">
                  {gameOver ? (
                    <>
                      <div className="w-16 h-16 rounded-3xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center">
                        <AlertTriangle className="w-8 h-8 text-rose-500 animate-bounce" />
                      </div>
                      <div>
                        <h2 className="text-3xl font-black uppercase italic tracking-wider text-rose-400">VALKYRIE V-9 DESTROYED</h2>
                        <p className="text-sm text-white/50 mt-1 font-mono">
                          Final Score: {f.score.toLocaleString()} • Credits: +{f.credits} CR
                        </p>
                      </div>

                      <button
                        onClick={() => startGame(gameMode)}
                        className="px-8 py-3 rounded-2xl bg-gradient-to-r from-rose-500 to-purple-500 text-white font-black uppercase tracking-wider text-sm shadow-xl shadow-rose-500/30 hover:scale-105 transition-all"
                      >
                        Re-Deploy Fighter
                      </button>
                    </>
                  ) : (
                    <>
                      <div className="w-20 h-20 rounded-3xl bg-purple-500/20 border-2 border-purple-500/40 flex items-center justify-center shadow-2xl shadow-purple-500/30">
                        <Rocket className="w-10 h-10 text-purple-400 animate-pulse" />
                      </div>
                      <div>
                        <h2 className="text-3xl font-black uppercase italic tracking-wider">VOID VALKYRIE HORIZON</h2>
                        <p className="text-xs text-white/50 max-w-md mx-auto mt-2 leading-relaxed">
                          Pilot the Void Valkyrie V-9 fighter across deep-space warp sectors. Use WASD to maneuver, mouse to aim & shoot blasters, and keys 1-3 for skill matrices.
                        </p>
                      </div>

                      <div className="flex items-center gap-3">
                        {(["campaign", "endless", "boss_rush"] as GameMode[]).map((m) => (
                          <button
                            key={m}
                            onClick={() => startGame(m)}
                            className="px-6 py-3 rounded-2xl bg-purple-500 hover:bg-purple-400 text-white font-black uppercase tracking-wider text-xs shadow-xl shadow-purple-500/30 hover:scale-105 transition-all"
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

            {/* Quick Skill Bar */}
            <div className="w-full max-w-[800px] grid grid-cols-3 gap-3">
              {skills.map((sk, idx) => {
                const cd = skillCooldownsRef.current[sk.id] || 0;
                return (
                  <button
                    key={sk.id}
                    onClick={() => activateSkill(sk.id)}
                    disabled={!sk.unlocked || cd > 0}
                    className={`p-3 rounded-2xl border flex flex-col items-center justify-center gap-1 transition-all ${
                      sk.unlocked && cd === 0
                        ? "bg-white/5 border-white/10 hover:border-purple-500/50 hover:bg-purple-500/10 text-white"
                        : "bg-white/[0.02] border-white/5 text-white/30"
                    }`}
                  >
                    <span className="text-[10px] font-mono text-white/40">[{idx + 1}]</span>
                    <Zap className="w-4 h-4 text-purple-400" />
                    <span className="text-[10px] font-bold truncate max-w-full">{sk.name}</span>
                    {cd > 0 && <span className="text-[10px] font-mono text-amber-400 font-bold">{cd.toFixed(1)}s</span>}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB: ARMORY */}
        {activeTab === "armory" && (
          <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 gap-4">
            {weapons.map((w) => (
              <div
                key={w.id}
                className={`p-5 rounded-3xl border transition-all flex flex-col justify-between gap-4 ${
                  selectedWeaponId === w.id
                    ? "bg-purple-500/10 border-purple-500/40 shadow-xl shadow-purple-500/10"
                    : "bg-white/[0.03] border-white/10"
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-mono font-bold uppercase tracking-widest text-purple-400">
                      LVL {w.level}/{w.maxLevel}
                    </span>
                    <span className="text-xs font-mono text-white/40">{w.damage} DMG</span>
                  </div>
                  <h3 className="text-lg font-black uppercase italic tracking-tight">{w.name}</h3>
                  <p className="text-xs text-white/50 mt-1 leading-relaxed">{w.description}</p>
                </div>

                {!w.unlocked ? (
                  <button
                    onClick={() => {
                      if (totalCredits >= w.costCredits) {
                        setTotalCredits((prev) => prev - w.costCredits);
                        setWeapons((prev) => prev.map((item) => (item.id === w.id ? { ...item, unlocked: true } : item)));
                      }
                    }}
                    disabled={totalCredits < w.costCredits}
                    className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-black uppercase tracking-wider text-xs shadow-lg transition-all"
                  >
                    Unlock ({w.costCredits} CR)
                  </button>
                ) : (
                  <button
                    onClick={() => setSelectedWeaponId(w.id)}
                    className={`w-full py-2.5 rounded-xl font-black uppercase tracking-wider text-xs transition-all ${
                      selectedWeaponId === w.id ? "bg-purple-500 text-white" : "bg-white/10 hover:bg-white/20 text-white"
                    }`}
                  >
                    {selectedWeaponId === w.id ? "Equipped" : "Equip Weapon"}
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        {/* TAB: ACHIEVEMENTS */}
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

        {/* TAB: DEV TERMINAL */}
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
                placeholder="Enter command (e.g. override_power, add_credits)..."
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
