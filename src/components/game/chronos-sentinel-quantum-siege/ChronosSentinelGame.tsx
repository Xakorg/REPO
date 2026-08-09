"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Shield, Zap, Award, Flame, Play, Pause, RotateCcw, Volume2, VolumeX,
  Crosshair, Sparkles, Terminal, ChevronRight, Settings, Radio, Cpu,
  Compass, Swords, RefreshCw, ShoppingBag, Lock, Unlock, Star, ArrowUpRight,
  Maximize2, Activity, Battery, Target, AlertTriangle, Eye, Layers, Box
} from "lucide-react";
import { useUser, useFirestore, setDocumentNonBlocking } from "@/firebase";
import { doc, getDoc } from "firebase/firestore";

// ─────────────────────────────────────────────────────────────────────────────
// TYPES & INTERFACES
// ─────────────────────────────────────────────────────────────────────────────

export type GameMode = "campaign" | "endless" | "boss_rush";
export type TabState = "game" | "turrets" | "pilot" | "achievements" | "terminal";

export interface TurretType {
  id: string;
  name: string;
  type: "tachyon" | "singularity" | "emp" | "chrono" | "railgun";
  level: number;
  maxLevel: number;
  damage: number;
  range: number;
  fireRate: number; // ms
  costCredits: number;
  unlocked: boolean;
  color: string;
  description: string;
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

export interface PlacedTurret {
  id: string;
  typeId: string;
  x: number;
  y: number;
  level: number;
  damage: number;
  range: number;
  fireRate: number;
  lastShot: number;
  color: string;
  targetEnemyId?: string;
  angle: number;
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

export interface SiegeEnemy {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  hp: number;
  maxHp: number;
  type: "crawler" | "interceptor" | "dreadnought" | "boss";
  name: string;
  color: string;
  radius: number;
  speed: number;
  shootCooldown: number;
  lastShot: number;
  scoreValue: number;
  creditsValue: number;
}

export interface SentinelPilot {
  x: number;
  y: number;
  radius: number;
  hp: number;
  maxHp: number;
  shield: number;
  maxShield: number;
  energy: number;
  maxEnergy: number;
  speed: number;
  score: number;
  kills: number;
  credits: number;
  angle: number;
}

export interface BaseCore {
  x: number;
  y: number;
  hp: number;
  maxHp: number;
  shield: number;
  maxShield: number;
  radius: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// WEB AUDIO SYNTHESIZER ENGINE
// ─────────────────────────────────────────────────────────────────────────────
class SentinelAudioEngine {
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

  public playTurretShot(freq: number = 750) {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(120, this.ctx.currentTime + 0.1);

      gain.gain.setValueAtTime(0.12, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.1);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + 0.1);
    } catch {}
  }

  public playExplosion(intensity: "small" | "heavy" = "small") {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    try {
      const duration = intensity === "heavy" ? 0.4 : 0.2;
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
      filter.frequency.setValueAtTime(intensity === "heavy" ? 400 : 900, this.ctx.currentTime);
      filter.frequency.exponentialRampToValueAtTime(30, this.ctx.currentTime + duration);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(intensity === "heavy" ? 0.3 : 0.15, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);

      noise.start();
      noise.stop(this.ctx.currentTime + duration);
    } catch {}
  }

  public playCoreHit() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = "square";
      osc.frequency.setValueAtTime(150, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(50, this.ctx.currentTime + 0.25);

      gain.gain.setValueAtTime(0.25, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.25);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + 0.25);
    } catch {}
  }
}

const audioSynth = new SentinelAudioEngine();

// ─────────────────────────────────────────────────────────────────────────────
// INITIAL DEFAULT CONFIGURATIONS
// ─────────────────────────────────────────────────────────────────────────────

const INITIAL_TURRET_TYPES: TurretType[] = [
  {
    id: "tachyon_cannon",
    name: "Tachyon Pulse Turret",
    type: "tachyon",
    level: 1,
    maxLevel: 5,
    damage: 35,
    range: 180,
    fireRate: 250,
    costCredits: 300,
    unlocked: true,
    color: "#38bdf8",
    description: "Rapid-fire energy cannon designed for continuous light & medium enemy suppression.",
  },
  {
    id: "singularity_emitter",
    name: "Singularity Railgun",
    type: "singularity",
    level: 1,
    maxLevel: 5,
    damage: 120,
    range: 240,
    fireRate: 650,
    costCredits: 1500,
    description: "Launches heavy gravitational singularity bolts that pierce armor.",
  },
  {
    id: "emp_tesla",
    name: "EMP Tesla Coil",
    type: "emp",
    level: 1,
    maxLevel: 5,
    damage: 60,
    range: 150,
    fireRate: 400,
    costCredits: 2800,
    description: "Emits high-frequency EMP shockwaves that slow and damage surrounding foes.",
  },
  {
    id: "chrono_stasis",
    name: "Chrono Stasis Pylon",
    type: "chrono",
    level: 1,
    maxLevel: 5,
    damage: 180,
    range: 280,
    fireRate: 900,
    costCredits: 5000,
    description: "Calls down intense temporal disruption beams that annihilate heavy dreadnoughts.",
  },
];

const INITIAL_ACHIEVEMENTS: AchievementItem[] = [
  {
    id: "first_defence",
    title: "Quantum Barrier Active",
    description: "Defeat 15 siege enemies in battle.",
    unlocked: false,
    progress: 0,
    target: 15,
    rewardCredits: 600,
    icon: "Shield",
  },
  {
    id: "turret_master",
    title: "Arsenal Engineer",
    description: "Deploy 8 turrets on the grid.",
    unlocked: false,
    progress: 0,
    target: 8,
    rewardCredits: 2200,
    icon: "Layers",
  },
  {
    id: "boss_conqueror",
    title: "Void Leviathan Destroyer",
    description: "Defeat 2 Siege Bosses.",
    unlocked: false,
    progress: 0,
    target: 2,
    rewardCredits: 3500,
    icon: "Award",
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

export default function ChronosSentinelGame() {
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
  const [turretTypes, setTurretTypes] = useState<TurretType[]>(INITIAL_TURRET_TYPES);
  const [selectedTurretTypeId, setSelectedTurretTypeId] = useState<string>("tachyon_cannon");
  const [achievements, setAchievements] = useState<AchievementItem[]>(INITIAL_ACHIEVEMENTS);

  const [sector, setSector] = useState<number>(1);
  const [totalCredits, setTotalCredits] = useState<number>(3000);
  const [highScore, setHighScore] = useState<number>(0);

  // Dynamic Game State Refs
  const baseCoreRef = useRef<BaseCore>({
    x: 400,
    y: 300,
    hp: 1000,
    maxHp: 1000,
    shield: 500,
    maxShield: 500,
    radius: 35,
  });

  const pilotRef = useRef<SentinelPilot>({
    x: 400,
    y: 420,
    radius: 18,
    hp: 300,
    maxHp: 300,
    shield: 150,
    maxShield: 150,
    energy: 100,
    maxEnergy: 100,
    speed: 5.5,
    score: 0,
    kills: 0,
    credits: 0,
    angle: 0,
  });

  const placedTurretsRef = useRef<PlacedTurret[]>([]);
  const enemiesRef = useRef<SiegeEnemy[]>([]);
  const bulletsRef = useRef<Bullet[]>([]);
  const particlesRef = useRef<ParticleEffect[]>([]);

  // Dev Terminal State
  const [terminalInput, setTerminalInput] = useState("");
  const [terminalLogs, setTerminalLogs] = useState<string[]>([
    "[SYSTEM ONLINE] Chronos Sentinel Defense Grid v5.0 Active.",
    "[STATUS] Quantum core operational. Grid defense online.",
  ]);

  // Load Persistence
  useEffect(() => {
    if (!user || !firestore) return;
    const docRef = doc(firestore, `users/${user.uid}/game_stats`, "chronos_sentinel_quantum_siege");
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
      const docRef = doc(firestore, `users/${user.uid}/game_stats`, "chronos_sentinel_quantum_siege");
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

    baseCoreRef.current = {
      x: 400,
      y: 300,
      hp: 1000,
      maxHp: 1000,
      shield: 500,
      maxShield: 500,
      radius: 35,
    };

    pilotRef.current = {
      x: 400,
      y: 420,
      radius: 18,
      hp: 300,
      maxHp: 300,
      shield: 150,
      maxShield: 150,
      energy: 100,
      maxEnergy: 100,
      speed: 5.5,
      score: 0,
      kills: 0,
      credits: 0,
      angle: 0,
    };

    placedTurretsRef.current = [
      {
        id: "turret_init_1",
        typeId: "tachyon_cannon",
        x: 320,
        y: 220,
        level: 1,
        damage: 35,
        range: 180,
        fireRate: 250,
        lastShot: 0,
        color: "#38bdf8",
        angle: 0,
      },
      {
        id: "turret_init_2",
        typeId: "tachyon_cannon",
        x: 480,
        y: 220,
        level: 1,
        damage: 35,
        range: 180,
        fireRate: 250,
        lastShot: 0,
        color: "#38bdf8",
        angle: 0,
      },
    ];

    bulletsRef.current = [];
    enemiesRef.current = [];
    particlesRef.current = [];

    spawnWave(1, mode);
  };

  const spawnWave = (currentSector: number, mode: GameMode) => {
    const isBossSector = currentSector % 3 === 0 || mode === "boss_rush";
    const enemyCount = mode === "boss_rush" ? 1 : 5 + currentSector * 3;

    const newEnemies: SiegeEnemy[] = [];

    if (isBossSector) {
      newEnemies.push({
        id: `boss_${Date.now()}`,
        x: 400,
        y: 60,
        vx: 2,
        vy: 0.5,
        hp: 1500 + currentSector * 800,
        maxHp: 1500 + currentSector * 800,
        type: "boss",
        name: `Void Leviathan Mk-${currentSector}`,
        color: "#f43f5e",
        radius: 42,
        speed: 1.2,
        shootCooldown: 900,
        lastShot: 0,
        scoreValue: 6000,
        creditsValue: 1500,
      });
    } else {
      for (let i = 0; i < enemyCount; i++) {
        const isDread = Math.random() > 0.75;
        const angle = Math.random() * Math.PI * 2;
        const dist = 380 + Math.random() * 80;

        newEnemies.push({
          id: `enemy_${Date.now()}_${i}`,
          x: 400 + Math.cos(angle) * dist,
          y: 300 + Math.sin(angle) * dist,
          vx: 0,
          vy: 0,
          hp: isDread ? 220 : 70,
          maxHp: isDread ? 220 : 70,
          type: isDread ? "dreadnought" : Math.random() > 0.5 ? "interceptor" : "crawler",
          name: isDread ? "Siege Dreadnought" : "Rift Crawler",
          color: isDread ? "#c084fc" : "#38bdf8",
          radius: isDread ? 24 : 15,
          speed: isDread ? 0.8 : 1.6,
          shootCooldown: isDread ? 1400 : 2000,
          lastShot: 0,
          scoreValue: isDread ? 450 : 160,
          creditsValue: isDread ? 90 : 35,
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
      const speed = 1 + Math.random() * 5;
      particlesRef.current.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        radius: 2 + Math.random() * 3.5,
        color,
        life: 0,
        maxLife: 15 + Math.random() * 20,
        shape,
      });
    }
  };

  // ───────────────────────────────────────────────────────────────────────────
  // TURRET PLACEMENT LOGIC
  // ───────────────────────────────────────────────────────────────────────────

  const placeTurretAt = (canvasX: number, canvasY: number) => {
    const tType = turretTypes.find((t) => t.id === selectedTurretTypeId) || turretTypes[0];
    if (totalCredits < tType.costCredits) return;

    setTotalCredits((prev) => prev - tType.costCredits);

    placedTurretsRef.current.push({
      id: `turret_${Date.now()}`,
      typeId: tType.id,
      x: canvasX,
      y: canvasY,
      level: 1,
      damage: tType.damage,
      range: tType.range,
      fireRate: tType.fireRate,
      lastShot: 0,
      color: tType.color,
      angle: 0,
    });

    spawnParticles(canvasX, canvasY, tType.color, 20, "ring");
    audioSynth.playTurretShot(900);

    // Update achievement
    setAchievements((prev) =>
      prev.map((ach) => {
        if (ach.id === "turret_master") {
          const prog = Math.min(ach.target, placedTurretsRef.current.length);
          return { ...ach, progress: prog, unlocked: prog >= ach.target };
        }
        return ach;
      })
    );
  };

  // ───────────────────────────────────────────────────────────────────────────
  // GAME LOOP & LOGIC
  // ───────────────────────────────────────────────────────────────────────────

  const updateGameLogic = (dt: number) => {
    if (!isPlaying || isPaused || gameOver) return;

    const p = pilotRef.current;
    const core = baseCoreRef.current;
    const now = performance.now();

    // Pilot Movement Controls
    if (keysRef.current["KeyA"] || keysRef.current["ArrowLeft"]) p.x = Math.max(p.radius, p.x - p.speed);
    if (keysRef.current["KeyD"] || keysRef.current["ArrowRight"]) p.x = Math.min(800 - p.radius, p.x + p.speed);
    if (keysRef.current["KeyW"] || keysRef.current["ArrowUp"]) p.y = Math.max(p.radius, p.y - p.speed);
    if (keysRef.current["KeyS"] || keysRef.current["ArrowDown"]) p.y = Math.min(600 - p.radius, p.y + p.speed);

    // Pilot Shooting Towards Mouse
    if (isMouseDownRef.current || keysRef.current["Space"]) {
      if (now - lastShotTimeRef.current > 160 && p.energy >= 4) {
        lastShotTimeRef.current = now;
        p.energy -= 4;

        const dx = mousePosRef.current.x - p.x;
        const dy = mousePosRef.current.y - p.y;
        const angle = Math.atan2(dy, dx);
        p.angle = angle;

        bulletsRef.current.push({
          id: `pb_${now}`,
          x: p.x,
          y: p.y,
          vx: Math.cos(angle) * 14,
          vy: Math.sin(angle) * 14,
          damage: 30,
          color: "#38bdf8",
          radius: 4,
          isPlayer: true,
        });

        audioSynth.playTurretShot(850);
      }
    }

    // Energy & Core Shield Passive Recovery
    p.energy = Math.min(p.maxEnergy, p.energy + 0.3);
    core.shield = Math.min(core.maxShield, core.shield + 0.1);

    // ── Update Placed Turrets & Auto-Targeting ───────────────────────────────
    placedTurretsRef.current.forEach((t) => {
      // Find nearest enemy within range
      let nearestEnemy: SiegeEnemy | null = null;
      let nearestDist = t.range;

      enemiesRef.current.forEach((e) => {
        const dist = Math.hypot(e.x - t.x, e.y - t.y);
        if (dist < nearestDist) {
          nearestDist = dist;
          nearestEnemy = e;
        }
      });

      if (nearestEnemy) {
        const angle = Math.atan2(nearestEnemy.y - t.y, nearestEnemy.x - t.x);
        t.angle = angle;

        if (now - t.lastShot > t.fireRate) {
          t.lastShot = now;
          bulletsRef.current.push({
            id: `tb_${now}_${t.id}`,
            x: t.x,
            y: t.y,
            vx: Math.cos(angle) * 12,
            vy: Math.sin(angle) * 12,
            damage: t.damage,
            color: t.color,
            radius: 5,
            isPlayer: true,
          });

          audioSynth.playTurretShot(650);
        }
      }
    });

    // ── Update Enemies (Movement towards Core) ──────────────────────────────
    enemiesRef.current.forEach((e) => {
      const dx = core.x - e.x;
      const dy = core.y - e.y;
      const dist = Math.hypot(dx, dy);

      if (dist > core.radius + e.radius) {
        e.vx = (dx / dist) * e.speed;
        e.vy = (dy / dist) * e.speed;
        e.x += e.vx;
        e.y += e.vy;
      } else {
        // Enemies hitting base core
        let dmg = 15;
        if (core.shield > 0) {
          core.shield = Math.max(0, core.shield - dmg);
        } else {
          core.hp -= dmg;
        }
        audioSynth.playCoreHit();
        spawnParticles(e.x, e.y, "#ef4444", 8, "spark");
        e.hp = 0; // Destroy enemy on core impact

        if (core.hp <= 0) {
          setGameOver(true);
          setIsPlaying(false);
          saveStatsToFirebase(p.score, p.credits);
        }
      }
    });

    // ── Update Bullets ──────────────────────────────────────────────────────
    bulletsRef.current = bulletsRef.current.filter((b) => {
      b.x += b.vx;
      b.y += b.vy;
      return b.x > -20 && b.x < 820 && b.y > -20 && b.y < 620;
    });

    // ── Collision: Player Bullets -> Enemies ────────────────────────────────
    bulletsRef.current.forEach((b) => {
      if (!b.isPlayer) return;
      enemiesRef.current.forEach((e) => {
        const dist = Math.hypot(b.x - e.x, b.y - e.y);
        if (dist < b.radius + e.radius) {
          e.hp -= b.damage;
          b.y = -999; // destroy bullet
          spawnParticles(b.x, b.y, b.color, 5, "spark");

          if (e.hp <= 0) {
            p.score += e.scoreValue;
            p.credits += e.creditsValue;
            p.kills += 1;
            spawnParticles(e.x, e.y, e.color, e.type === "boss" ? 35 : 15, "circle");
            audioSynth.playExplosion(e.type === "boss" ? "heavy" : "small");

            // Update achievement progress
            setAchievements((prev) =>
              prev.map((ach) => {
                if (ach.id === "first_defence") {
                  const prog = Math.min(ach.target, ach.progress + 1);
                  return { ...ach, progress: prog, unlocked: prog >= ach.target };
                }
                if (ach.id === "boss_conqueror" && e.type === "boss") {
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

    // Remove dead enemies
    enemiesRef.current = enemiesRef.current.filter((e) => e.hp > 0);

    // Wave Progression
    if (enemiesRef.current.length === 0) {
      const nextSec = sector + 1;
      setSector(nextSec);
      spawnWave(nextSec, gameMode);
    }

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

    // Grid Lines
    ctx.strokeStyle = "rgba(56, 189, 248, 0.05)";
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

    // ── Draw Base Core ──────────────────────────────────────────────────────
    const core = baseCoreRef.current;
    ctx.save();
    ctx.translate(core.x, core.y);

    if (core.shield > 0) {
      ctx.strokeStyle = "rgba(56, 189, 248, 0.6)";
      ctx.lineWidth = 3;
      ctx.shadowColor = "#38bdf8";
      ctx.shadowBlur = 15;
      ctx.beginPath();
      ctx.arc(0, 0, core.radius + 12, 0, Math.PI * 2);
      ctx.stroke();
    }

    ctx.fillStyle = "#38bdf8";
    ctx.shadowColor = "#38bdf8";
    ctx.shadowBlur = 20;
    ctx.beginPath();
    ctx.arc(0, 0, core.radius, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();

    // ── Draw Particles ──────────────────────────────────────────────────────
    particlesRef.current.forEach((pt) => {
      ctx.save();
      ctx.globalAlpha = 1 - pt.life / pt.maxLife;
      ctx.fillStyle = pt.color;

      if (pt.shape === "ring") {
        ctx.strokeStyle = pt.color;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, pt.radius + pt.life * 1.2, 0, Math.PI * 2);
        ctx.stroke();
      } else {
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, pt.radius, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    });

    // ── Draw Placed Turrets ────────────────────────────────────────────────
    placedTurretsRef.current.forEach((t) => {
      ctx.save();
      ctx.translate(t.x, t.y);

      // Turret Range Radius Outline
      ctx.strokeStyle = "rgba(255, 255, 255, 0.05)";
      ctx.beginPath();
      ctx.arc(0, 0, t.range, 0, Math.PI * 2);
      ctx.stroke();

      // Turret Base
      ctx.fillStyle = "#1e293b";
      ctx.beginPath();
      ctx.arc(0, 0, 16, 0, Math.PI * 2);
      ctx.fill();

      // Rotating Cannon Barrel
      ctx.rotate(t.angle);
      ctx.fillStyle = t.color;
      ctx.shadowColor = t.color;
      ctx.shadowBlur = 10;
      ctx.fillRect(0, -4, 20, 8);

      ctx.restore();
    });

    // ── Draw Bullets ────────────────────────────────────────────────────────
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

    // ── Draw Enemies ────────────────────────────────────────────────────────
    enemiesRef.current.forEach((e) => {
      ctx.save();
      ctx.fillStyle = e.color;
      ctx.shadowColor = e.color;
      ctx.shadowBlur = e.type === "boss" ? 20 : 10;

      ctx.beginPath();
      ctx.arc(e.x, e.y, e.radius, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    });

    // ── Draw Pilot Mech Hero ────────────────────────────────────────────────
    if (isPlaying && !gameOver) {
      const p = pilotRef.current;
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.angle);

      ctx.fillStyle = "#ffffff";
      ctx.shadowColor = "#38bdf8";
      ctx.shadowBlur = 12;

      ctx.beginPath();
      ctx.moveTo(18, 0);
      ctx.lineTo(-12, -12);
      ctx.lineTo(-6, 0);
      ctx.lineTo(-12, 12);
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

  // Mouse & Keyboard Listeners
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      keysRef.current[e.code] = true;
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
    const handleMouseDown = (e: MouseEvent) => {
      if (e.button === 0 && canvasRef.current) {
        const rect = canvasRef.current.getBoundingClientRect();
        const clickX = e.clientX - rect.left;
        const clickY = e.clientY - rect.top;

        // Check if placing turret on empty space
        const distToCore = Math.hypot(clickX - 400, clickY - 300);
        if (distToCore > 60) {
          placeTurretAt(clickX, clickY);
        }
      }
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
  }, [selectedTurretTypeId, totalCredits]);

  // Dev Terminal Submit
  const handleTerminalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!terminalInput.trim()) return;

    const cmd = terminalInput.trim().toLowerCase();
    const newLogs = [...terminalLogs, `> ${terminalInput}`];

    if (cmd === "override_power") {
      baseCoreRef.current.hp = 99999;
      baseCoreRef.current.shield = 99999;
      newLogs.push("[CHEAT] Base Core Matrix Invincibility Engaged.");
    } else if (cmd.startsWith("add_credits")) {
      setTotalCredits((prev) => prev + 15000);
      newLogs.push("[CHEAT] Added +15,000 Credits to Sentinel Vault.");
    } else if (cmd === "nuke_enemies") {
      enemiesRef.current.forEach((e) => (e.hp = 0));
      newLogs.push("[CHEAT] Orbital Nuke Deployed. All enemies purged.");
    } else if (cmd === "clear") {
      setTerminalLogs([]);
      setTerminalInput("");
      return;
    } else {
      newLogs.push(`[ERROR] Unknown command: "${cmd}". Type "override_power", "add_credits", "nuke_enemies", or "clear".`);
    }

    setTerminalLogs(newLogs);
    setTerminalInput("");
  };

  const p = pilotRef.current;
  const core = baseCoreRef.current;

  return (
    <div className="w-full min-h-screen bg-[#05030d] text-white flex flex-col items-center justify-start p-4 md:p-8 font-sans selection:bg-sky-500 selection:text-black">
      {/* Top Navigation */}
      <header className="w-full max-w-6xl flex flex-col md:flex-row items-center justify-between gap-4 p-4 rounded-3xl bg-white/[0.03] border border-white/10 backdrop-blur-2xl shadow-2xl mb-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-sky-500 flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <Shield className="w-6 h-6 text-white animate-pulse" />
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-black uppercase italic tracking-tighter bg-gradient-to-r from-indigo-400 via-sky-300 to-purple-400 bg-clip-text text-transparent">
              Chronos Sentinel: Quantum Siege
            </h1>
            <p className="text-xs text-white/40 font-mono flex items-center gap-2">
              <span>DEFENSE MATRIX V5.0</span> • <span className="text-emerald-400">SECTOR {sector}</span>
            </p>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1.5 p-1.5 rounded-2xl bg-black/40 border border-white/10">
          {(["game", "turrets", "achievements", "terminal"] as TabState[]).map((t) => (
            <button
              key={t}
              onClick={() => setActiveTab(t)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
                activeTab === t
                  ? "bg-indigo-500 text-white shadow-lg shadow-indigo-500/30"
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
            {muted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-sky-400" />}
          </button>
        </div>
      </header>

      {/* Main Workspace */}
      <main className="w-full max-w-6xl flex flex-col items-center justify-center">
        {activeTab === "game" && (
          <div className="w-full flex flex-col items-center gap-4">
            {/* HUD */}
            <div className="w-full max-w-[800px] flex items-center justify-between px-6 py-3 rounded-2xl bg-white/[0.03] border border-white/10 backdrop-blur-xl text-xs font-mono">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-sky-400" />
                  <div className="w-28 h-2.5 rounded-full bg-white/10 overflow-hidden">
                    <div
                      className="h-full bg-sky-400 transition-all duration-200"
                      style={{ width: `${Math.max(0, (core.hp / core.maxHp) * 100)}%` }}
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-6">
                <div className="text-right">
                  <span className="text-white/40 block text-[10px]">SCORE</span>
                  <span className="text-indigo-400 font-bold text-sm">{p.score.toLocaleString()}</span>
                </div>
                <div className="text-right">
                  <span className="text-white/40 block text-[10px]">KILLS</span>
                  <span className="text-emerald-400 font-bold text-sm">{p.kills}</span>
                </div>
              </div>
            </div>

            {/* Canvas */}
            <div className="relative w-full max-w-[800px] aspect-[4/3] rounded-3xl overflow-hidden border-2 border-white/10 shadow-2xl shadow-indigo-500/10 bg-slate-950">
              <canvas ref={canvasRef} width={800} height={600} className="w-full h-full block cursor-crosshair" />

              {/* Start / Game Over */}
              {(!isPlaying || gameOver) && (
                <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-md flex flex-col items-center justify-center gap-6 p-6 text-center z-20">
                  {gameOver ? (
                    <>
                      <div className="w-16 h-16 rounded-3xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center">
                        <AlertTriangle className="w-8 h-8 text-rose-500 animate-bounce" />
                      </div>
                      <div>
                        <h2 className="text-3xl font-black uppercase italic tracking-wider text-rose-400">BASE CORE DESTRUCTION</h2>
                        <p className="text-sm text-white/50 mt-1 font-mono">
                          Final Score: {p.score.toLocaleString()} • Credits: +{p.credits} CR
                        </p>
                      </div>

                      <button
                        onClick={() => startGame(gameMode)}
                        className="px-8 py-3 rounded-2xl bg-gradient-to-r from-rose-500 to-indigo-500 text-white font-black uppercase tracking-wider text-sm shadow-xl shadow-rose-500/30 hover:scale-105 transition-all"
                      >
                        Re-Deploy Sentinel Grid
                      </button>
                    </>
                  ) : (
                    <>
                      <div className="w-20 h-20 rounded-3xl bg-indigo-500/20 border-2 border-indigo-500/40 flex items-center justify-center shadow-2xl shadow-indigo-500/30">
                        <Shield className="w-10 h-10 text-indigo-400 animate-pulse" />
                      </div>
                      <div>
                        <h2 className="text-3xl font-black uppercase italic tracking-wider">CHRONOS SENTINEL GRID</h2>
                        <p className="text-xs text-white/50 max-w-md mx-auto mt-2 leading-relaxed">
                          Deploy automated quantum turrets by clicking anywhere on the grid. Pilot your Sentinel Mech with WASD to shoot enemies directly and defend the base core.
                        </p>
                      </div>

                      <div className="flex items-center gap-3">
                        {(["campaign", "endless", "boss_rush"] as GameMode[]).map((m) => (
                          <button
                            key={m}
                            onClick={() => startGame(m)}
                            className="px-6 py-3 rounded-2xl bg-indigo-500 hover:bg-indigo-400 text-white font-black uppercase tracking-wider text-xs shadow-xl shadow-indigo-500/30 hover:scale-105 transition-all"
                          >
                            Start {m.replace("_", " ")}
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Turret Selection Palette */}
            <div className="w-full max-w-[800px] grid grid-cols-4 gap-3">
              {turretTypes.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setSelectedTurretTypeId(t.id)}
                  className={`p-3 rounded-2xl border flex flex-col items-center justify-center gap-1 transition-all ${
                    selectedTurretTypeId === t.id
                      ? "bg-indigo-500/20 border-indigo-500 text-white shadow-lg shadow-indigo-500/20"
                      : "bg-white/5 border-white/10 text-white/50 hover:text-white"
                  }`}
                >
                  <Box className="w-4 h-4 text-sky-400" />
                  <span className="text-[10px] font-bold truncate max-w-full">{t.name}</span>
                  <span className="text-[9px] font-mono text-amber-400">{t.costCredits} CR</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* TAB: TURRET ARMORY */}
        {activeTab === "turrets" && (
          <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 gap-4">
            {turretTypes.map((t) => (
              <div key={t.id} className="p-5 rounded-3xl bg-white/[0.03] border border-white/10 flex flex-col justify-between gap-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-mono text-sky-400 font-bold uppercase">{t.type} Turret</span>
                    <span className="text-xs font-mono text-white/40">{t.damage} DMG</span>
                  </div>
                  <h3 className="text-lg font-black uppercase italic tracking-tight">{t.name}</h3>
                  <p className="text-xs text-white/50 mt-1 leading-relaxed">{t.description}</p>
                </div>

                <div className="flex items-center justify-between text-xs font-mono text-white/40 pt-2 border-t border-white/5">
                  <span>Range: {t.range}px</span>
                  <span>Fire Rate: {t.fireRate}ms</span>
                </div>
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
                placeholder="Enter command (e.g. override_power, add_credits, nuke_enemies)..."
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
