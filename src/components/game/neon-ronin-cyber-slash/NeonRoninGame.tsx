"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Shield, Zap, Award, Flame, Play, Pause, RotateCcw, Volume2, VolumeX,
  Crosshair, Sparkles, Terminal, ChevronRight, Settings, Radio, Cpu,
  Compass, Swords, RefreshCw, ShoppingBag, Lock, Unlock, Star, ArrowUpRight,
  Maximize2, Activity, Battery, Target, AlertTriangle, Eye, Flame as FireIcon
} from "lucide-react";
import { useUser, useFirestore, setDocumentNonBlocking } from "@/firebase";
import { doc, getDoc } from "firebase/firestore";

// ─────────────────────────────────────────────────────────────────────────────
// TYPES & INTERFACES
// ─────────────────────────────────────────────────────────────────────────────

export type GameMode = "campaign" | "endless" | "boss_rush";
export type TabState = "game" | "dojo" | "stances" | "achievements" | "terminal";

export interface KatanaBlade {
  id: string;
  name: string;
  level: number;
  maxLevel: number;
  damage: number;
  attackSpeed: number; // ms
  costCredits: number;
  unlocked: boolean;
  color: string;
  description: string;
}

export interface RoninStance {
  id: string;
  name: string;
  icon: string;
  description: string;
  cooldown: number; // seconds
  energyCost: number;
  unlocked: boolean;
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
  shape?: "circle" | "spark" | "slash";
}

export interface SlashArc {
  x: number;
  y: number;
  angle: number;
  radius: number;
  color: string;
  life: number;
  maxLife: number;
}

export interface CyberEnemy {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  hp: number;
  maxHp: number;
  type: "grunt" | "ninja" | "cyborg" | "boss";
  name: string;
  color: string;
  radius: number;
  speed: number;
  attackCooldown: number;
  lastAttack: number;
  scoreValue: number;
  creditsValue: number;
  isAttacking?: boolean;
}

export interface RoninPlayer {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  hp: number;
  maxHp: number;
  stamina: number;
  maxStamina: number;
  energy: number;
  maxEnergy: number;
  speed: number;
  score: number;
  kills: number;
  credits: number;
  facing: "left" | "right";
  isSlashing: boolean;
  isDashing: boolean;
  dashTime: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// WEB AUDIO SYNTHESIZER ENGINE
// ─────────────────────────────────────────────────────────────────────────────
class RoninAudioEngine {
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

  public playSlashSound() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(1200, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(200, this.ctx.currentTime + 0.08);

      gain.gain.setValueAtTime(0.18, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.08);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + 0.08);
    } catch {}
  }

  public playParrySound() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = "triangle";
      osc.frequency.setValueAtTime(1600, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(800, this.ctx.currentTime + 0.15);

      gain.gain.setValueAtTime(0.25, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.15);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + 0.15);
    } catch {}
  }

  public playExplosion(intensity: "small" | "heavy" = "small") {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    try {
      const duration = intensity === "heavy" ? 0.35 : 0.15;
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
      filter.frequency.setValueAtTime(intensity === "heavy" ? 500 : 900, this.ctx.currentTime);
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
}

const audioSynth = new RoninAudioEngine();

// ─────────────────────────────────────────────────────────────────────────────
// DEFAULT CONFIGURATIONS
// ─────────────────────────────────────────────────────────────────────────────

const INITIAL_KATANAS: KatanaBlade[] = [
  {
    id: "muramasa_neon",
    name: "Muramasa Neon Katana",
    level: 1,
    maxLevel: 5,
    damage: 45,
    attackSpeed: 180,
    costCredits: 0,
    unlocked: true,
    color: "#f43f5e",
    description: "Standard cybernetically enhanced plasma katana forged for high-speed slicing.",
  },
  {
    id: "quantum_plasma_blade",
    name: "Quantum Plasma Edge",
    level: 1,
    maxLevel: 5,
    damage: 110,
    attackSpeed: 220,
    costCredits: 1600,
    unlocked: false,
    color: "#38bdf8",
    description: "Infused with quantum particles capable of shearing through cyborg plating.",
  },
  {
    id: "tachyon_edge",
    name: "Tachyon Dragon Blade",
    level: 1,
    maxLevel: 5,
    damage: 190,
    attackSpeed: 260,
    costCredits: 3600,
    unlocked: false,
    color: "#a855f7",
    description: "Emits localized temporal shockwaves with every heavy blade combo.",
  },
];

const INITIAL_STANCES: RoninStance[] = [
  {
    id: "lightning_dash",
    name: "Lightning Dash Slash",
    icon: "Zap",
    description: "Instantly dashes forward 200px, slicing all enemies caught in the path.",
    cooldown: 8,
    energyCost: 25,
    unlocked: true,
    costCredits: 0,
    category: "offense",
  },
  {
    id: "dragon_fire_slash",
    name: "Dragon Flame Arc",
    icon: "Flame",
    description: "Unleashes a 360-degree fiery plasma blade arc dealing heavy burst damage.",
    cooldown: 12,
    energyCost: 35,
    unlocked: true,
    costCredits: 1500,
    category: "offense",
  },
  {
    id: "void_stasis_parry",
    name: "Void Stasis Parry",
    icon: "Shield",
    description: "Generates a 2-second deflecting barrier that parries and reflects all attacks.",
    cooldown: 10,
    energyCost: 30,
    unlocked: false,
    costCredits: 3000,
    category: "defense",
  },
];

const INITIAL_ACHIEVEMENTS: AchievementItem[] = [
  {
    id: "first_blood_ronin",
    title: "First Cyber Slash",
    description: "Slay 15 Cyber Yakuza enemies.",
    unlocked: false,
    progress: 0,
    target: 15,
    rewardCredits: 500,
    icon: "Swords",
  },
  {
    id: "kage_slayer",
    title: "Shadow Samurai Hunter",
    description: "Defeat 2 Boss Ronins.",
    unlocked: false,
    progress: 0,
    target: 2,
    rewardCredits: 2500,
    icon: "Award",
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

export default function NeonRoninGame() {
  const { user } = useUser();
  const firestore = useFirestore();

  // Canvas & RAF Loop Refs
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const requestRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(performance.now());
  const lastSlashTimeRef = useRef<number>(0);

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
  const [katanas, setKatanas] = useState<KatanaBlade[]>(INITIAL_KATANAS);
  const [selectedKatanaId, setSelectedKatanaId] = useState<string>("muramasa_neon");
  const [stances, setStances] = useState<RoninStance[]>(INITIAL_STANCES);
  const [achievements, setAchievements] = useState<AchievementItem[]>(INITIAL_ACHIEVEMENTS);

  const [sector, setSector] = useState<number>(1);
  const [totalCredits, setTotalCredits] = useState<number>(2800);
  const [highScore, setHighScore] = useState<number>(0);

  // Dynamic Game State Refs
  const playerRef = useRef<RoninPlayer>({
    x: 400,
    y: 480,
    vx: 0,
    vy: 0,
    radius: 20,
    hp: 300,
    maxHp: 300,
    stamina: 100,
    maxStamina: 100,
    energy: 100,
    maxEnergy: 100,
    speed: 6.0,
    score: 0,
    kills: 0,
    credits: 0,
    facing: "right",
    isSlashing: false,
    isDashing: false,
    dashTime: 0,
  });

  const enemiesRef = useRef<CyberEnemy[]>([]);
  const slashArcsRef = useRef<SlashArc[]>([]);
  const particlesRef = useRef<ParticleEffect[]>([]);
  const stanceCooldownsRef = useRef<{ [key: string]: number }>({});

  // Dev Terminal State
  const [terminalInput, setTerminalInput] = useState("");
  const [terminalLogs, setTerminalLogs] = useState<string[]>([
    "[SYSTEM ONLINE] Neon Ronin Kaito Cyberware OS v3.5 Initialized.",
    "[STATUS] Katana plasma matrices online. Cyber city sector active.",
  ]);

  // Load Persistence
  useEffect(() => {
    if (!user || !firestore) return;
    const docRef = doc(firestore, `users/${user.uid}/game_stats`, "neon_ronin_cyber_slash");
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
      const docRef = doc(firestore, `users/${user.uid}/game_stats`, "neon_ronin_cyber_slash");
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

    playerRef.current = {
      x: 400,
      y: 480,
      vx: 0,
      vy: 0,
      radius: 20,
      hp: 300,
      maxHp: 300,
      stamina: 100,
      maxStamina: 100,
      energy: 100,
      maxEnergy: 100,
      speed: 6.0,
      score: 0,
      kills: 0,
      credits: 0,
      facing: "right",
      isSlashing: false,
      isDashing: false,
      dashTime: 0,
    };

    slashArcsRef.current = [];
    enemiesRef.current = [];
    particlesRef.current = [];
    stanceCooldownsRef.current = {};

    spawnWave(1, mode);
  };

  const spawnWave = (currentSector: number, mode: GameMode) => {
    const isBossSector = currentSector % 3 === 0 || mode === "boss_rush";
    const enemyCount = mode === "boss_rush" ? 1 : 4 + currentSector * 2;

    const newEnemies: CyberEnemy[] = [];

    if (isBossSector) {
      newEnemies.push({
        id: `boss_${Date.now()}`,
        x: 400,
        y: 200,
        vx: 2,
        vy: 0,
        hp: 1200 + currentSector * 600,
        maxHp: 1200 + currentSector * 600,
        type: "boss",
        name: `Kage-X Shadow Ronin Mk-${currentSector}`,
        color: "#f43f5e",
        radius: 36,
        speed: 2.2,
        attackCooldown: 900,
        lastAttack: 0,
        scoreValue: 5000,
        creditsValue: 1200,
      });
    } else {
      for (let i = 0; i < enemyCount; i++) {
        const isCyborg = Math.random() > 0.7;
        const side = Math.random() > 0.5 ? 50 : 750;

        newEnemies.push({
          id: `enemy_${Date.now()}_${i}`,
          x: side,
          y: 480 - Math.random() * 200,
          vx: side === 50 ? 2 : -2,
          vy: 0,
          hp: isCyborg ? 180 : 50,
          maxHp: isCyborg ? 180 : 50,
          type: isCyborg ? "cyborg" : Math.random() > 0.5 ? "ninja" : "grunt",
          name: isCyborg ? "Heavy Cyborg Enforcer" : "Cyber Yakuza Ninja",
          color: isCyborg ? "#c084fc" : "#38bdf8",
          radius: isCyborg ? 24 : 16,
          speed: isCyborg ? 1.5 : 2.5,
          attackCooldown: isCyborg ? 1200 : 1800,
          lastAttack: 0,
          scoreValue: isCyborg ? 380 : 140,
          creditsValue: isCyborg ? 75 : 30,
        });
      }
    }

    enemiesRef.current = newEnemies;
  };

  // ───────────────────────────────────────────────────────────────────────────
  // PARTICLE & SLASH ENGINE
  // ───────────────────────────────────────────────────────────────────────────

  const spawnParticles = (x: number, y: number, color: string, count: number = 10, shape: "circle" | "spark" | "slash" = "circle") => {
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
        maxLife: 15 + Math.random() * 20,
        shape,
      });
    }
  };

  // ───────────────────────────────────────────────────────────────────────────
  // KATANA SLASH ACTION
  // ───────────────────────────────────────────────────────────────────────────

  const performKatanaSlash = (now: number) => {
    const activeKatana = katanas.find((k) => k.id === selectedKatanaId) || katanas[0];
    if (now - lastSlashTimeRef.current < activeKatana.attackSpeed) return;
    if (playerRef.current.stamina < 10) return;

    lastSlashTimeRef.current = now;
    playerRef.current.stamina -= 10;
    playerRef.current.isSlashing = true;

    const p = playerRef.current;
    const slashAngle = p.facing === "right" ? 0 : Math.PI;

    slashArcsRef.current.push({
      x: p.x + (p.facing === "right" ? 30 : -30),
      y: p.y,
      angle: slashAngle,
      radius: 45,
      color: activeKatana.color,
      life: 0,
      maxLife: 8,
    });

    audioSynth.playSlashSound();

    // Check hit collision with enemies
    enemiesRef.current.forEach((e) => {
      const dx = e.x - p.x;
      const dy = e.y - p.y;
      const dist = Math.hypot(dx, dy);

      if (dist < 65) {
        e.hp -= activeKatana.damage;
        spawnParticles(e.x, e.y, activeKatana.color, 8, "slash");

        if (e.hp <= 0) {
          p.score += e.scoreValue;
          p.credits += e.creditsValue;
          p.kills += 1;
          spawnParticles(e.x, e.y, e.color, e.type === "boss" ? 35 : 15, "circle");
          audioSynth.playExplosion(e.type === "boss" ? "heavy" : "small");

          setAchievements((prev) =>
            prev.map((ach) => {
              if (ach.id === "first_blood_ronin") {
                const prog = Math.min(ach.target, ach.progress + 1);
                return { ...ach, progress: prog, unlocked: prog >= ach.target };
              }
              if (ach.id === "kage_slayer" && e.type === "boss") {
                const prog = Math.min(ach.target, ach.progress + 1);
                return { ...ach, progress: prog, unlocked: prog >= ach.target };
              }
              return ach;
            })
          );
        }
      }
    });

    setTimeout(() => {
      playerRef.current.isSlashing = false;
    }, 150);
  };

  // ───────────────────────────────────────────────────────────────────────────
  // STANCE SKILL ACTIVATION
  // ───────────────────────────────────────────────────────────────────────────

  const activateStance = (stanceId: string) => {
    const st = stances.find((s) => s.id === stanceId);
    if (!st || !st.unlocked) return;

    const cd = stanceCooldownsRef.current[stanceId] || 0;
    if (cd > 0) return;
    if (playerRef.current.energy < st.energyCost) return;

    playerRef.current.energy -= st.energyCost;
    stanceCooldownsRef.current[stanceId] = st.cooldown;

    const p = playerRef.current;

    if (stanceId === "lightning_dash") {
      p.isDashing = true;
      p.x += p.facing === "right" ? 180 : -180;
      audioSynth.playSlashSound();
      spawnParticles(p.x, p.y, "#38bdf8", 25, "spark");

      setTimeout(() => {
        p.isDashing = false;
      }, 200);
    } else if (stanceId === "dragon_fire_slash") {
      audioSynth.playSlashSound();
      enemiesRef.current.forEach((e) => {
        const dist = Math.hypot(e.x - p.x, e.y - p.y);
        if (dist < 160) {
          e.hp -= 200;
          spawnParticles(e.x, e.y, "#f43f5e", 15, "spark");
        }
      });
    } else if (stanceId === "void_stasis_parry") {
      audioSynth.playParrySound();
      p.hp = Math.min(p.maxHp, p.hp + 50);
      spawnParticles(p.x, p.y, "#a855f7", 20, "circle");
    }
  };

  // ───────────────────────────────────────────────────────────────────────────
  // GAME LOOP LOGIC
  // ───────────────────────────────────────────────────────────────────────────

  const updateGameLogic = (dt: number) => {
    if (!isPlaying || isPaused || gameOver) return;

    const p = playerRef.current;
    const now = performance.now();

    // Movement Controls
    if (keysRef.current["KeyA"] || keysRef.current["ArrowLeft"]) {
      p.x = Math.max(p.radius, p.x - p.speed);
      p.facing = "left";
    }
    if (keysRef.current["KeyD"] || keysRef.current["ArrowRight"]) {
      p.x = Math.min(800 - p.radius, p.x + p.speed);
      p.facing = "right";
    }

    if (isMouseDownRef.current || keysRef.current["Space"]) {
      performKatanaSlash(now);
    }

    // Passive Recovery
    p.stamina = Math.min(p.maxStamina, p.stamina + 0.4);
    p.energy = Math.min(p.maxEnergy, p.energy + 0.25);

    // Update Stance Cooldowns
    Object.keys(stanceCooldownsRef.current).forEach((k) => {
      if (stanceCooldownsRef.current[k] > 0) {
        stanceCooldownsRef.current[k] = Math.max(0, stanceCooldownsRef.current[k] - dt / 1000);
      }
    });

    // ── Update Enemies (AI Tracking towards player) ─────────────────────────
    enemiesRef.current.forEach((e) => {
      const dx = p.x - e.x;
      const dist = Math.abs(dx);

      if (dist > 35) {
        e.x += Math.sign(dx) * e.speed;
      } else {
        // Enemy attack hit player
        if (now - e.lastAttack > e.attackCooldown) {
          e.lastAttack = now;
          p.hp -= 22;
          audioSynth.playExplosion("small");
          spawnParticles(p.x, p.y, "#ef4444", 8, "spark");

          if (p.hp <= 0) {
            setGameOver(true);
            setIsPlaying(false);
            audioSynth.playExplosion("heavy");
            saveStatsToFirebase(p.score, p.credits);
          }
        }
      }
    });

    // Remove dead enemies
    enemiesRef.current = enemiesRef.current.filter((e) => e.hp > 0);

    if (enemiesRef.current.length === 0) {
      const nextSec = sector + 1;
      setSector(nextSec);
      spawnWave(nextSec, gameMode);
    }

    // ── Update Slash Arcs ───────────────────────────────────────────────────
    slashArcsRef.current = slashArcsRef.current.filter((sa) => {
      sa.life += 1;
      return sa.life < sa.maxLife;
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

    // Neon City Background Skyline Grid
    ctx.strokeStyle = "rgba(244, 63, 94, 0.05)";
    ctx.lineWidth = 1;
    for (let x = 0; x < 800; x += 40) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, 600);
      ctx.stroke();
    }

    // Ground Floor Line
    ctx.strokeStyle = "rgba(244, 63, 94, 0.4)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, 510);
    ctx.lineTo(800, 510);
    ctx.stroke();

    // Draw Particles
    particlesRef.current.forEach((pt) => {
      ctx.save();
      ctx.globalAlpha = 1 - pt.life / pt.maxLife;
      ctx.fillStyle = pt.color;
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, pt.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });

    // Draw Katana Slash Arcs
    slashArcsRef.current.forEach((sa) => {
      ctx.save();
      ctx.strokeStyle = sa.color;
      ctx.shadowColor = sa.color;
      ctx.shadowBlur = 18;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(sa.x, sa.y, sa.radius, sa.angle - 0.6, sa.angle + 0.6);
      ctx.stroke();
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

    // Draw Neon Ronin Hero Player
    if (isPlaying && !gameOver) {
      const p = playerRef.current;
      ctx.save();
      ctx.translate(p.x, p.y);

      ctx.fillStyle = "#ffffff";
      ctx.shadowColor = "#f43f5e";
      ctx.shadowBlur = 15;

      // Ronin Body Circle & Katana Sheath Line
      ctx.beginPath();
      ctx.arc(0, 0, p.radius, 0, Math.PI * 2);
      ctx.fill();

      // Blade Pointer
      ctx.strokeStyle = "#f43f5e";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(p.facing === "right" ? 24 : -24, -6);
      ctx.stroke();

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
      if (e.code === "Digit1") activateStance("lightning_dash");
      if (e.code === "Digit2") activateStance("dragon_fire_slash");
      if (e.code === "Digit3") activateStance("void_stasis_parry");
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
  }, [stances]);

  // Dev Terminal Submit
  const handleTerminalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!terminalInput.trim()) return;

    const cmd = terminalInput.trim().toLowerCase();
    const newLogs = [...terminalLogs, `> ${terminalInput}`];

    if (cmd === "override_power") {
      playerRef.current.hp = 99999;
      newLogs.push("[CHEAT] Ronin Katana Invincibility Engaged.");
    } else if (cmd.startsWith("add_credits")) {
      setTotalCredits((prev) => prev + 15000);
      newLogs.push("[CHEAT] Added +15,000 Credits to Dojo Vault.");
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

  const p = playerRef.current;

  return (
    <div className="w-full min-h-screen bg-[#05030d] text-white flex flex-col items-center justify-start p-4 md:p-8 font-sans selection:bg-rose-500 selection:text-black">
      {/* Top Header Navigation */}
      <header className="w-full max-w-6xl flex flex-col md:flex-row items-center justify-between gap-4 p-4 rounded-3xl bg-white/[0.03] border border-white/10 backdrop-blur-2xl shadow-2xl mb-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-rose-500 to-amber-500 flex items-center justify-center shadow-lg shadow-rose-500/20">
            <Swords className="w-6 h-6 text-white animate-pulse" />
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-black uppercase italic tracking-tighter bg-gradient-to-r from-rose-400 via-amber-300 to-purple-400 bg-clip-text text-transparent">
              Neon Ronin: Cyber Slash
            </h1>
            <p className="text-xs text-white/40 font-mono flex items-center gap-2">
              <span>KATANA MATRIX V3.5</span> • <span className="text-emerald-400">CITY SECTOR {sector}</span>
            </p>
          </div>
        </div>

        {/* Tab Selection */}
        <div className="flex items-center gap-1.5 p-1.5 rounded-2xl bg-black/40 border border-white/10">
          {(["game", "dojo", "stances", "achievements", "terminal"] as TabState[]).map((t) => (
            <button
              key={t}
              onClick={() => setActiveTab(t)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
                activeTab === t
                  ? "bg-rose-500 text-white shadow-lg shadow-rose-500/30"
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
            {muted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-rose-400" />}
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
                      style={{ width: `${Math.max(0, (p.hp / p.maxHp) * 100)}%` }}
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-amber-400" />
                  <div className="w-24 h-2.5 rounded-full bg-white/10 overflow-hidden">
                    <div
                      className="h-full bg-amber-400 transition-all duration-200"
                      style={{ width: `${Math.max(0, (p.stamina / p.maxStamina) * 100)}%` }}
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-6">
                <div className="text-right">
                  <span className="text-white/40 block text-[10px]">SCORE</span>
                  <span className="text-rose-400 font-bold text-sm">{p.score.toLocaleString()}</span>
                </div>
                <div className="text-right">
                  <span className="text-white/40 block text-[10px]">KILLS</span>
                  <span className="text-emerald-400 font-bold text-sm">{p.kills}</span>
                </div>
              </div>
            </div>

            {/* Canvas Container */}
            <div className="relative w-full max-w-[800px] aspect-[4/3] rounded-3xl overflow-hidden border-2 border-white/10 shadow-2xl shadow-rose-500/10 bg-slate-950">
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
                        <h2 className="text-3xl font-black uppercase italic tracking-wider text-rose-400">RONIN DEFEATED</h2>
                        <p className="text-sm text-white/50 mt-1 font-mono">
                          Final Score: {p.score.toLocaleString()} • Credits: +{p.credits} CR
                        </p>
                      </div>

                      <button
                        onClick={() => startGame(gameMode)}
                        className="px-8 py-3 rounded-2xl bg-gradient-to-r from-rose-500 to-amber-500 text-white font-black uppercase tracking-wider text-sm shadow-xl shadow-rose-500/30 hover:scale-105 transition-all"
                      >
                        Re-Deploy Ronin
                      </button>
                    </>
                  ) : (
                    <>
                      <div className="w-20 h-20 rounded-3xl bg-rose-500/20 border-2 border-rose-500/40 flex items-center justify-center shadow-2xl shadow-rose-500/30">
                        <Swords className="w-10 h-10 text-rose-400 animate-pulse" />
                      </div>
                      <div>
                        <h2 className="text-3xl font-black uppercase italic tracking-wider">NEON RONIN CYBER SLASH</h2>
                        <p className="text-xs text-white/50 max-w-md mx-auto mt-2 leading-relaxed">
                          Slice through waves of Cyber Yakuza and Shadow Ninjas. Use A/D to run, mouse/Space to perform Katana slashes, and keys 1-3 for Ronin Stances.
                        </p>
                      </div>

                      <div className="flex items-center gap-3">
                        {(["campaign", "endless", "boss_rush"] as GameMode[]).map((m) => (
                          <button
                            key={m}
                            onClick={() => startGame(m)}
                            className="px-6 py-3 rounded-2xl bg-rose-500 hover:bg-rose-400 text-white font-black uppercase tracking-wider text-xs shadow-xl shadow-rose-500/30 hover:scale-105 transition-all"
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

            {/* Quick Stance Bar */}
            <div className="w-full max-w-[800px] grid grid-cols-3 gap-3">
              {stances.map((st, idx) => {
                const cd = stanceCooldownsRef.current[st.id] || 0;
                return (
                  <button
                    key={st.id}
                    onClick={() => activateStance(st.id)}
                    disabled={!st.unlocked || cd > 0}
                    className={`p-3 rounded-2xl border flex flex-col items-center justify-center gap-1 transition-all ${
                      st.unlocked && cd === 0
                        ? "bg-white/5 border-white/10 hover:border-rose-500/50 hover:bg-rose-500/10 text-white"
                        : "bg-white/[0.02] border-white/5 text-white/30"
                    }`}
                  >
                    <span className="text-[10px] font-mono text-white/40">[{idx + 1}]</span>
                    <Zap className="w-4 h-4 text-rose-400" />
                    <span className="text-[10px] font-bold truncate max-w-full">{st.name}</span>
                    {cd > 0 && <span className="text-[10px] font-mono text-amber-400 font-bold">{cd.toFixed(1)}s</span>}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB: DOJO ARMORY */}
        {activeTab === "dojo" && (
          <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 gap-4">
            {katanas.map((k) => (
              <div
                key={k.id}
                className={`p-5 rounded-3xl border transition-all flex flex-col justify-between gap-4 ${
                  selectedKatanaId === k.id
                    ? "bg-rose-500/10 border-rose-500/40 shadow-xl shadow-rose-500/10"
                    : "bg-white/[0.03] border-white/10"
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-mono font-bold uppercase tracking-widest text-rose-400">
                      LVL {k.level}/{k.maxLevel}
                    </span>
                    <span className="text-xs font-mono text-white/40">{k.damage} DMG</span>
                  </div>
                  <h3 className="text-lg font-black uppercase italic tracking-tight">{k.name}</h3>
                  <p className="text-xs text-white/50 mt-1 leading-relaxed">{k.description}</p>
                </div>

                {!k.unlocked ? (
                  <button
                    onClick={() => {
                      if (totalCredits >= k.costCredits) {
                        setTotalCredits((prev) => prev - k.costCredits);
                        setKatanas((prev) => prev.map((item) => (item.id === k.id ? { ...item, unlocked: true } : item)));
                      }
                    }}
                    disabled={totalCredits < k.costCredits}
                    className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-black uppercase tracking-wider text-xs shadow-lg transition-all"
                  >
                    Forge Blade ({k.costCredits} CR)
                  </button>
                ) : (
                  <button
                    onClick={() => setSelectedKatanaId(k.id)}
                    className={`w-full py-2.5 rounded-xl font-black uppercase tracking-wider text-xs transition-all ${
                      selectedKatanaId === k.id ? "bg-rose-500 text-white" : "bg-white/10 hover:bg-white/20 text-white"
                    }`}
                  >
                    {selectedKatanaId === k.id ? "Equipped" : "Equip Katana"}
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
