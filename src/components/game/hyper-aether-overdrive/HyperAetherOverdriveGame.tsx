"use client";

import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { motion } from "framer-motion";
import {
  Play,
  RotateCcw,
  Zap,
  Shield,
  Crosshair,
  Volume2,
  VolumeX,
  Sparkles,
  Trophy,
  Award,
  Flame,
  Activity,
  Info,
  Target,
  Skull,
  ZapOff
} from "lucide-react";

// --- TYPES & INTERFACES ---
export interface LeaderboardEntry {
  id: string;
  name: string;
  score: number;
  wave: number;
  date: string;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlocked: boolean;
}

export interface AugmentOption {
  id: string;
  title: string;
  description: string;
  type: "offense" | "defense" | "utility" | "special";
  icon: string;
  apply: (stats: GameStats) => GameStats;
}

export interface GameStats {
  maxHp: number;
  hp: number;
  maxShield: number;
  shield: number;
  shieldRechargeRate: number;
  fireRateMultiplier: number;
  damageMultiplier: number;
  speed: number;
  empCooldownMax: number;
  dashCooldownMax: number;
  homingMissiles: boolean;
  droneCompanion: boolean;
  vampiricNanites: boolean;
}

// Web Audio API Sound Synthesizer
class SoundEffects {
  private ctx: AudioContext | null = null;
  private muted: boolean = false;

  private initCtx() {
    if (!this.ctx && typeof window !== "undefined") {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === "suspended") {
      this.ctx.resume();
    }
  }

  public setMuted(mute: boolean) {
    this.muted = mute;
  }

  public playLaser(weaponType: number = 0) {
    if (this.muted) return;
    this.initCtx();
    if (!this.ctx) return;

    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.connect(gain);
      gain.connect(this.ctx.destination);

      const now = this.ctx.currentTime;
      const freqMap = [880, 440, 1200, 600, 300];
      const startFreq = freqMap[weaponType] || 880;

      osc.type = weaponType === 1 ? "sawtooth" : weaponType === 4 ? "square" : "sine";
      osc.frequency.setValueAtTime(startFreq, now);
      osc.frequency.exponentialRampToValueAtTime(80, now + 0.12);

      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.12);

      osc.start(now);
      osc.stop(now + 0.12);
    } catch {
      // Audio fallback
    }
  }

  public playExplosion(isBoss: boolean = false) {
    if (this.muted) return;
    this.initCtx();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sawtooth";
      osc.connect(gain);
      gain.connect(this.ctx.destination);

      const duration = isBoss ? 0.8 : 0.35;
      osc.frequency.setValueAtTime(isBoss ? 180 : 120, now);
      osc.frequency.exponentialRampToValueAtTime(20, now + duration);

      gain.gain.setValueAtTime(isBoss ? 0.4 : 0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

      osc.start(now);
      osc.stop(now + duration);
    } catch {
      // Audio fallback
    }
  }

  public playEMP() {
    if (this.muted) return;
    this.initCtx();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sine";
      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.frequency.setValueAtTime(150, now);
      osc.frequency.exponentialRampToValueAtTime(1200, now + 0.4);

      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.45);

      osc.start(now);
      osc.stop(now + 0.45);
    } catch {
      // Audio fallback
    }
  }

  public playPickup() {
    if (this.muted) return;
    this.initCtx();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "triangle";
      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.frequency.setValueAtTime(523.25, now); // C5
      osc.frequency.setValueAtTime(659.25, now + 0.08); // E5
      osc.frequency.setValueAtTime(783.99, now + 0.16); // G5

      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.28);

      osc.start(now);
      osc.stop(now + 0.28);
    } catch {
      // Audio fallback
    }
  }

  public playLevelUp() {
    if (this.muted) return;
    this.initCtx();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      [440, 554.37, 659.25, 880].forEach((freq, idx) => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = "sine";
        osc.frequency.value = freq;
        osc.connect(gain);
        gain.connect(this.ctx.destination);

        const startTime = now + idx * 0.09;
        gain.gain.setValueAtTime(0.2, startTime);
        gain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.2);

        osc.start(startTime);
        osc.stop(startTime + 0.2);
      });
    } catch {
      // Audio fallback
    }
  }
}

const sfx = new SoundEffects();

// Available Augments for leveling up
const AVAILABLE_AUGMENTS: AugmentOption[] = [
  {
    id: "overdrive_thrusters",
    title: "Aether Thruster Surge",
    description: "Increases movement speed by +25% and improves dash recovery speed.",
    type: "utility",
    icon: "Zap",
    apply: (s) => ({ ...s, speed: s.speed * 1.25, dashCooldownMax: Math.max(1, s.dashCooldownMax * 0.8) })
  },
  {
    id: "plasma_amplifier",
    title: "Hyper Plasma Matrix",
    description: "Increases overall weapon damage by +30%.",
    type: "offense",
    icon: "Flame",
    apply: (s) => ({ ...s, damageMultiplier: s.damageMultiplier * 1.3 })
  },
  {
    id: "tachyon_repeater",
    title: "Tachyon Accelerator",
    description: "Increases fire rate across all weapon modes by +35%.",
    type: "offense",
    icon: "Crosshair",
    apply: (s) => ({ ...s, fireRateMultiplier: s.fireRateMultiplier * 1.35 })
  },
  {
    id: "quantum_shield",
    title: "Graviton Shield Matrix",
    description: "Boosts max shield energy by +50 and accelerates shield recharge rate.",
    type: "defense",
    icon: "Shield",
    apply: (s) => ({ ...s, maxShield: s.maxShield + 50, shield: s.shield + 50, shieldRechargeRate: s.shieldRechargeRate * 1.4 })
  },
  {
    id: "emp_overcharge",
    title: "Emp Capacitor Array",
    description: "Reduces EMP shockwave cooldown by 40%.",
    type: "utility",
    icon: "ZapOff",
    apply: (s) => ({ ...s, empCooldownMax: s.empCooldownMax * 0.6 })
  },
  {
    id: "homing_modules",
    title: "Seeker Array Integration",
    description: "Deploys tracking homing micro-missiles alongside secondary fire.",
    type: "special",
    icon: "Target",
    apply: (s) => ({ ...s, homingMissiles: true })
  },
  {
    id: "vampiric_nanites",
    title: "Nanite Core Converter",
    description: "Destruction of enemy dreadnoughts repairs +5 HP automatically.",
    type: "special",
    icon: "Activity",
    apply: (s) => ({ ...s, vampiricNanites: true })
  }
];

export default function HyperAetherOverdriveGame() {
  // Game states
  const [gameState, setGameState] = useState<"menu" | "playing" | "paused" | "upgrade" | "gameover">("menu");
  const [activeTab, setActiveTab] = useState<"game" | "upgrades" | "leaderboard" | "achievements" | "controls">("game");
  const [muted, setMuted] = useState(false);

  // Score & stats
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [wave, setWave] = useState(1);
  const [kills, setKills] = useState(0);
  const [xp, setXp] = useState(0);
  const [level, setLevel] = useState(1);
  const [nextLevelXp, setNextLevelXp] = useState(100);
  const [weaponIndex, setWeaponIndex] = useState(0);

  // Ability Cooldown percentage [0..1]
  const [empCooldown, setEmpCooldown] = useState(0);
  const [dashCooldown, setDashCooldown] = useState(0);

  // Player Stats
  const [stats, setStats] = useState<GameStats>({
    maxHp: 100,
    hp: 100,
    maxShield: 100,
    shield: 100,
    shieldRechargeRate: 5,
    fireRateMultiplier: 1,
    damageMultiplier: 1,
    speed: 6,
    empCooldownMax: 10,
    dashCooldownMax: 4,
    homingMissiles: false,
    droneCompanion: false,
    vampiricNanites: false
  });

  // Upgrade choices when leveling up
  const [upgradeChoices, setUpgradeChoices] = useState<AugmentOption[]>([]);
  const [selectedAugments, setSelectedAugments] = useState<string[]>([]);

  // Boss state
  const [bossActive, setBossActive] = useState(false);
  const [bossHp, setBossHp] = useState(0);
  const [bossMaxHp, setBossMaxHp] = useState(1000);

  // Leaderboards & Achievements
  const [leaderboard] = useState<LeaderboardEntry[]>([
    { id: "1", name: "Valkyrie_Zero", score: 145000, wave: 18, date: "2026-07-30" },
    { id: "2", name: "Tachyon_Rider", score: 112400, wave: 14, date: "2026-07-31" },
    { id: "3", name: "Cyber_Sentinel", score: 89600, wave: 11, date: "2026-07-31" },
    { id: "4", name: "Aether_Pilot", score: 67300, wave: 8, date: "2026-07-31" },
    { id: "5", name: "Nova_Ghost", score: 42100, wave: 6, date: "2026-07-31" }
  ]);

  const [achievements, setAchievements] = useState<Achievement[]>([
    { id: "first_blood", title: "First Strike", description: "Destroy your first rogue drone.", icon: "Target", unlocked: false },
    { id: "emp_master", title: "Graviton Surge", description: "Unleash an EMP wave clearing at least 10 enemy bullets.", icon: "ZapOff", unlocked: false },
    { id: "level_5", title: "Hyper Augmented", description: "Reach Pilot Augment Level 5.", icon: "Sparkles", unlocked: false },
    { id: "boss_slayer", title: "Hyperion Slayer", description: "Defeat the Apex Hyperion Zenith Boss.", icon: "Crown", unlocked: false },
    { id: "overdrive_legend", title: "Celestial Overdrive", description: "Achieve a score of over 50,000.", icon: "Trophy", unlocked: false }
  ]);

  // Canvas Refs
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Realtime Input state
  const keysPressed = useRef<{ [key: string]: boolean }>({});
  const mousePos = useRef<{ x: number; y: number }>({ x: 400, y: 300 });
  const isMouseDown = useRef(false);

  // Mutable Game Loop State
  const gameRef = useRef<{
    player: {
      x: number;
      y: number;
      radius: number;
      vx: number;
      vy: number;
      angle: number;
      dashTime: number;
      lastFired: number;
      lastEmp: number;
      lastDash: number;
    };
    bullets: Array<{
      x: number;
      y: number;
      vx: number;
      vy: number;
      radius: number;
      color: string;
      damage: number;
      isPlayer: boolean;
      life: number;
      pierce?: number;
      homing?: boolean;
    }>;
    enemies: Array<{
      id: number;
      type: "scout" | "sentinel" | "dreadnought" | "phantom" | "boss";
      x: number;
      y: number;
      radius: number;
      hp: number;
      maxHp: number;
      speed: number;
      color: string;
      lastFired: number;
      angle: number;
    }>;
    particles: Array<{
      x: number;
      y: number;
      vx: number;
      vy: number;
      radius: number;
      color: string;
      alpha: number;
      life: number;
      maxLife: number;
    }>;
    drops: Array<{
      x: number;
      y: number;
      type: "xp" | "hp" | "shield" | "emp";
      value: number;
      radius: number;
    }>;
    stars: Array<{ x: number; y: number; z: number; speed: number; size: number }>;
    waveEnemyCount: number;
    waveSpawnedCount: number;
    lastSpawnTime: number;
    screenShake: number;
  }>({
    player: { x: 400, y: 500, radius: 18, vx: 0, vy: 0, angle: 0, dashTime: 0, lastFired: 0, lastEmp: 0, lastDash: 0 },
    bullets: [],
    enemies: [],
    particles: [],
    drops: [],
    stars: [],
    waveEnemyCount: 15,
    waveSpawnedCount: 0,
    lastSpawnTime: 0,
    screenShake: 0
  });

  // Weapon definitions
  const WEAPONS = useMemo(() => [
    { name: "Plasma Repeater", color: "#38bdf8", rate: 120, dmg: 22, type: "auto" },
    { name: "Tachyon Beam", color: "#a855f7", rate: 80, dmg: 14, type: "beam" },
    { name: "Photon Spreader", color: "#f59e0b", rate: 300, dmg: 18, type: "spread" },
    { name: "Graviton Seeker", color: "#10b981", rate: 250, dmg: 40, type: "homing" },
    { name: "Antimatter Cannon", color: "#ef4444", rate: 500, dmg: 110, type: "heavy" }
  ], []);

  // Initialize stars once
  useEffect(() => {
    const starList = [];
    for (let i = 0; i < 120; i++) {
      starList.push({
        x: Math.random() * 1200,
        y: Math.random() * 800,
        z: Math.random() * 3 + 1,
        speed: Math.random() * 1.5 + 0.5,
        size: Math.random() * 2 + 1
      });
    }
    gameRef.current.stars = starList;

    // Load Highscore from localStorage
    const saved = localStorage.getItem("hyper_aether_highscore");
    if (saved) {
      setHighScore(parseInt(saved, 10));
    }
  }, []);

  // Toggle Mute
  const handleToggleMute = () => {
    setMuted(!muted);
    sfx.setMuted(!muted);
  };

  // Start / Restart Game
  const startGame = () => {
    setScore(0);
    setWave(1);
    setKills(0);
    setXp(0);
    setLevel(1);
    setNextLevelXp(100);
    setWeaponIndex(0);
    setBossActive(false);

    setStats({
      maxHp: 100,
      hp: 100,
      maxShield: 100,
      shield: 100,
      shieldRechargeRate: 5,
      fireRateMultiplier: 1,
      damageMultiplier: 1,
      speed: 6,
      empCooldownMax: 10,
      dashCooldownMax: 4,
      homingMissiles: false,
      droneCompanion: false,
      vampiricNanites: false
    });

    gameRef.current.player = {
      x: 400,
      y: 500,
      radius: 18,
      vx: 0,
      vy: 0,
      angle: 0,
      dashTime: 0,
      lastFired: 0,
      lastEmp: -100,
      lastDash: -100
    };
    gameRef.current.bullets = [];
    gameRef.current.enemies = [];
    gameRef.current.particles = [];
    gameRef.current.drops = [];
    gameRef.current.waveEnemyCount = 15;
    gameRef.current.waveSpawnedCount = 0;
    gameRef.current.lastSpawnTime = Date.now();

    setGameState("playing");
  };

  // Trigger EMP Shockwave
  const triggerEmp = useCallback(() => {
    const now = Date.now() / 1000;
    if (now - gameRef.current.player.lastEmp < stats.empCooldownMax) return;

    gameRef.current.player.lastEmp = now;
    sfx.playEMP();
    gameRef.current.screenShake = 15;

    // Clear enemy bullets
    let clearedBullets = 0;
    gameRef.current.bullets = gameRef.current.bullets.filter((b) => {
      if (!b.isPlayer) {
        clearedBullets++;
        return false;
      }
      return true;
    });

    // Check achievement
    if (clearedBullets >= 10) {
      setAchievements((prev) =>
        prev.map((a) => (a.id === "emp_master" ? { ...a, unlocked: true } : a))
      );
    }

    // Damage all enemies
    gameRef.current.enemies.forEach((enemy) => {
      enemy.hp -= 150 * stats.damageMultiplier;
      // Add particle wave around enemy
      for (let i = 0; i < 8; i++) {
        gameRef.current.particles.push({
          x: enemy.x,
          y: enemy.y,
          vx: (Math.random() - 0.5) * 6,
          vy: (Math.random() - 0.5) * 6,
          radius: 4,
          color: "#38bdf8",
          alpha: 1,
          life: 0,
          maxLife: 30
        });
      }
    });

    // EMP Shockwave visual particles
    const px = gameRef.current.player.x;
    const py = gameRef.current.player.y;
    for (let i = 0; i < 48; i++) {
      const ang = (i / 48) * Math.PI * 2;
      gameRef.current.particles.push({
        x: px,
        y: py,
        vx: Math.cos(ang) * 9,
        vy: Math.sin(ang) * 9,
        radius: 5,
        color: "#06b6d4",
        alpha: 1,
        life: 0,
        maxLife: 40
      });
    }
  }, [stats]);

  // Trigger Time-Dilation Dash
  const triggerDash = useCallback(() => {
    const now = Date.now() / 1000;
    if (now - gameRef.current.player.lastDash < stats.dashCooldownMax) return;

    gameRef.current.player.lastDash = now;
    gameRef.current.player.dashTime = 0.35; // 0.35s duration
    sfx.playLaser(2);

    // Ghost trail particles
    const p = gameRef.current.player;
    for (let i = 0; i < 10; i++) {
      gameRef.current.particles.push({
        x: p.x + (Math.random() - 0.5) * 20,
        y: p.y + (Math.random() - 0.5) * 20,
        vx: -p.vx * 0.3,
        vy: -p.vy * 0.3,
        radius: 8,
        color: "#a855f7",
        alpha: 0.8,
        life: 0,
        maxLife: 20
      });
    }
  }, [stats]);

  // Input Listeners
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      keysPressed.current[e.code] = true;

      if (e.code === "Space" && gameState === "playing") {
        e.preventDefault();
        triggerEmp();
      }
      if ((e.code === "ShiftLeft" || e.code === "ShiftRight") && gameState === "playing") {
        e.preventDefault();
        triggerDash();
      }
      if (e.code === "KeyP" && (gameState === "playing" || gameState === "paused")) {
        setGameState((prev) => (prev === "playing" ? "paused" : "playing"));
      }
      if (["Digit1", "Digit2", "Digit3", "Digit4", "Digit5"].includes(e.code)) {
        const idx = parseInt(e.code.replace("Digit", ""), 10) - 1;
        if (idx >= 0 && idx < WEAPONS.length) {
          setWeaponIndex(idx);
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      keysPressed.current[e.code] = false;
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!canvasRef.current) return;
      const rect = canvasRef.current.getBoundingClientRect();
      mousePos.current = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      };
    };

    const handleMouseDown = () => {
      isMouseDown.current = true;
    };

    const handleMouseUp = () => {
      isMouseDown.current = false;
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
  }, [gameState, triggerEmp, triggerDash, WEAPONS]);

  // Spawn Enemy Logic
  const spawnEnemy = useCallback((typeOverride?: "scout" | "sentinel" | "dreadnought" | "phantom" | "boss") => {
    if (!canvasRef.current) return;
    const width = canvasRef.current.width;

    const types: Array<"scout" | "sentinel" | "dreadnought" | "phantom"> = ["scout", "sentinel", "dreadnought", "phantom"];
    const type = typeOverride || types[Math.floor(Math.random() * (wave > 3 ? 4 : wave > 1 ? 2 : 1))];

    const x = Math.random() * (width - 80) + 40;
    const y = -40;

    let radius = 15;
    let hp = 40 + wave * 10;
    let speed = 2 + Math.random() * 1.5;
    let color = "#ef4444";

    if (type === "scout") {
      radius = 14;
      hp = 30 + wave * 8;
      speed = 3.5 + Math.random() * 1.2;
      color = "#f43f5e";
    } else if (type === "sentinel") {
      radius = 20;
      hp = 70 + wave * 15;
      speed = 2;
      color = "#a855f7";
    } else if (type === "dreadnought") {
      radius = 32;
      hp = 180 + wave * 35;
      speed = 1.2;
      color = "#f59e0b";
    } else if (type === "phantom") {
      radius = 18;
      hp = 90 + wave * 20;
      speed = 2.8;
      color = "#06b6d4";
    } else if (type === "boss") {
      radius = 55;
      hp = 1200 + wave * 450;
      speed = 0.8;
      color = "#ec4899";
      setBossActive(true);
      setBossHp(hp);
      setBossMaxHp(hp);
    }

    gameRef.current.enemies.push({
      id: Date.now() + Math.random(),
      type,
      x,
      y,
      radius,
      hp,
      maxHp: hp,
      speed,
      color,
      lastFired: Date.now(),
      angle: Math.PI / 2
    });
  }, [wave]);

  // Main Canvas Render & Game Loop
  useEffect(() => {
    if (gameState !== "playing") return;

    let lastFrameTime = performance.now();

    const loop = (currentTime: number) => {
      const dt = Math.min((currentTime - lastFrameTime) / 1000, 0.05);
      lastFrameTime = currentTime;

      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const width = canvas.width;
      const height = canvas.height;

      // UPDATE COOLDOWNS FOR UI
      const nowSec = Date.now() / 1000;
      const empRem = Math.max(0, 1 - (nowSec - gameRef.current.player.lastEmp) / stats.empCooldownMax);
      const dashRem = Math.max(0, 1 - (nowSec - gameRef.current.player.lastDash) / stats.dashCooldownMax);
      setEmpCooldown(empRem);
      setDashCooldown(dashRem);

      // --- 1. PLAYER MOVEMENT & CONTROLS ---
      const p = gameRef.current.player;
      let moveX = 0;
      let moveY = 0;

      if (keysPressed.current["KeyW"] || keysPressed.current["ArrowUp"]) moveY -= 1;
      if (keysPressed.current["KeyS"] || keysPressed.current["ArrowDown"]) moveY += 1;
      if (keysPressed.current["KeyA"] || keysPressed.current["ArrowLeft"]) moveX -= 1;
      if (keysPressed.current["KeyD"] || keysPressed.current["ArrowRight"]) moveX += 1;

      if (moveX !== 0 && moveY !== 0) {
        moveX *= 0.7071;
        moveY *= 0.7071;
      }

      let currentSpeed = stats.speed;
      if (p.dashTime > 0) {
        p.dashTime -= dt;
        currentSpeed *= 2.5;
      }

      p.x += moveX * currentSpeed;
      p.y += moveY * currentSpeed;

      p.x = Math.max(p.radius, Math.min(width - p.radius, p.x));
      p.y = Math.max(p.radius, Math.min(height - p.radius, p.y));

      p.angle = Math.atan2(mousePos.current.y - p.y, mousePos.current.x - p.x);

      // --- 2. PLAYER SHOOTING ---
      const currentWeapon = WEAPONS[weaponIndex];
      const fireInterval = currentWeapon.rate / stats.fireRateMultiplier;

      if (isMouseDown.current && Date.now() - p.lastFired >= fireInterval) {
        p.lastFired = Date.now();
        sfx.playLaser(weaponIndex);

        const bulletDmg = currentWeapon.dmg * stats.damageMultiplier;

        if (currentWeapon.type === "auto") {
          gameRef.current.bullets.push({
            x: p.x + Math.cos(p.angle) * 20,
            y: p.y + Math.sin(p.angle) * 20,
            vx: Math.cos(p.angle) * 14,
            vy: Math.sin(p.angle) * 14,
            radius: 4,
            color: currentWeapon.color,
            damage: bulletDmg,
            isPlayer: true,
            life: 0
          });
        } else if (currentWeapon.type === "spread") {
          for (let i = -2; i <= 2; i++) {
            const spreadAngle = p.angle + i * 0.12;
            gameRef.current.bullets.push({
              x: p.x,
              y: p.y,
              vx: Math.cos(spreadAngle) * 12,
              vy: Math.sin(spreadAngle) * 12,
              radius: 3.5,
              color: currentWeapon.color,
              damage: bulletDmg * 0.6,
              isPlayer: true,
              life: 0
            });
          }
        } else if (currentWeapon.type === "beam") {
          gameRef.current.bullets.push({
            x: p.x,
            y: p.y,
            vx: Math.cos(p.angle) * 22,
            vy: Math.sin(p.angle) * 22,
            radius: 6,
            color: currentWeapon.color,
            damage: bulletDmg,
            isPlayer: true,
            life: 0,
            pierce: 3
          });
        } else if (currentWeapon.type === "homing") {
          gameRef.current.bullets.push({
            x: p.x,
            y: p.y,
            vx: Math.cos(p.angle) * 10,
            vy: Math.sin(p.angle) * 10,
            radius: 5,
            color: currentWeapon.color,
            damage: bulletDmg,
            isPlayer: true,
            life: 0,
            homing: true
          });
        } else if (currentWeapon.type === "heavy") {
          gameRef.current.bullets.push({
            x: p.x,
            y: p.y,
            vx: Math.cos(p.angle) * 9,
            vy: Math.sin(p.angle) * 9,
            radius: 9,
            color: currentWeapon.color,
            damage: bulletDmg,
            isPlayer: true,
            life: 0
          });
        }
      }

      // --- 3. WAVE & ENEMY SPAWNING ---
      if (!bossActive && gameRef.current.waveSpawnedCount < gameRef.current.waveEnemyCount) {
        if (Date.now() - gameRef.current.lastSpawnTime > Math.max(600, 1800 - wave * 150)) {
          gameRef.current.lastSpawnTime = Date.now();
          gameRef.current.waveSpawnedCount++;
          spawnEnemy();
        }
      } else if (
        !bossActive &&
        gameRef.current.waveSpawnedCount >= gameRef.current.waveEnemyCount &&
        gameRef.current.enemies.length === 0
      ) {
        if (wave % 5 === 0) {
          spawnEnemy("boss");
        } else {
          setWave((w) => w + 1);
          gameRef.current.waveEnemyCount = 15 + wave * 5;
          gameRef.current.waveSpawnedCount = 0;
          sfx.playLevelUp();
        }
      }

      // --- 4. BULLET UPDATES & COLLISIONS ---
      gameRef.current.bullets = gameRef.current.bullets.filter((b) => {
        if (b.homing && b.isPlayer && gameRef.current.enemies.length > 0) {
          let closestEnemy = gameRef.current.enemies[0];
          let minDist = 9999;
          gameRef.current.enemies.forEach((enemy) => {
            const d = Math.hypot(enemy.x - b.x, enemy.y - b.y);
            if (d < minDist) {
              minDist = d;
              closestEnemy = enemy;
            }
          });
          const targetAngle = Math.atan2(closestEnemy.y - b.y, closestEnemy.x - b.x);
          const currentAngle = Math.atan2(b.vy, b.vx);
          const newAngle = currentAngle + (targetAngle - currentAngle) * 0.1;
          const speed = Math.hypot(b.vx, b.vy);
          b.vx = Math.cos(newAngle) * speed;
          b.vy = Math.sin(newAngle) * speed;
        }

        b.x += b.vx;
        b.y += b.vy;
        b.life++;

        if (b.x < -20 || b.x > width + 20 || b.y < -20 || b.y > height + 20 || b.life > 200) {
          return false;
        }

        if (!b.isPlayer && p.dashTime <= 0) {
          const distToPlayer = Math.hypot(b.x - p.x, b.y - p.y);
          if (distToPlayer < b.radius + p.radius) {
            setStats((prev) => {
              let damage = b.damage;
              let newShield = prev.shield;
              let newHp = prev.hp;

              if (newShield > 0) {
                if (newShield >= damage) {
                  newShield -= damage;
                  damage = 0;
                } else {
                  damage -= newShield;
                  newShield = 0;
                }
              }

              if (damage > 0) {
                newHp = Math.max(0, newHp - damage);
              }

              if (newHp <= 0) {
                setGameState("gameover");
                sfx.playExplosion(true);
              }

              return { ...prev, shield: newShield, hp: newHp };
            });

            gameRef.current.screenShake = 10;
            return false;
          }
        }

        if (b.isPlayer) {
          for (let i = 0; i < gameRef.current.enemies.length; i++) {
            const enemy = gameRef.current.enemies[i];
            const dist = Math.hypot(b.x - enemy.x, b.y - enemy.y);
            if (dist < b.radius + enemy.radius) {
              enemy.hp -= b.damage;

              if (enemy.type === "boss") {
                setBossHp(Math.max(0, enemy.hp));
              }

              for (let k = 0; k < 4; k++) {
                gameRef.current.particles.push({
                  x: b.x,
                  y: b.y,
                  vx: (Math.random() - 0.5) * 4,
                  vy: (Math.random() - 0.5) * 4,
                  radius: 2,
                  color: b.color,
                  alpha: 1,
                  life: 0,
                  maxLife: 15
                });
              }

              if (b.pierce && b.pierce > 1) {
                b.pierce--;
              } else {
                return false;
              }
            }
          }
        }

        return true;
      });

      // --- 5. ENEMY UPDATES & AI SHOOTING ---
      gameRef.current.enemies = gameRef.current.enemies.filter((enemy) => {
        if (enemy.hp <= 0) {
          sfx.playExplosion(enemy.type === "boss");
          setKills((k) => k + 1);
          setScore((s) => s + (enemy.type === "boss" ? 10000 : enemy.type === "dreadnought" ? 800 : 250));

          setAchievements((prev) =>
            prev.map((a) => (a.id === "first_blood" ? { ...a, unlocked: true } : a))
          );

          if (enemy.type === "boss") {
            setBossActive(false);
            setWave((w) => w + 1);
            setAchievements((prev) =>
              prev.map((a) => (a.id === "boss_slayer" ? { ...a, unlocked: true } : a))
            );
          }

          const dropsCount = enemy.type === "boss" ? 25 : enemy.type === "dreadnought" ? 6 : 2;
          for (let d = 0; d < dropsCount; d++) {
            gameRef.current.drops.push({
              x: enemy.x + (Math.random() - 0.5) * 30,
              y: enemy.y + (Math.random() - 0.5) * 30,
              type: Math.random() < 0.15 ? "hp" : Math.random() < 0.25 ? "shield" : "xp",
              value: 20 + wave * 5,
              radius: 6
            });
          }

          for (let pIdx = 0; pIdx < (enemy.type === "boss" ? 60 : 18); pIdx++) {
            gameRef.current.particles.push({
              x: enemy.x,
              y: enemy.y,
              vx: (Math.random() - 0.5) * 8,
              vy: (Math.random() - 0.5) * 8,
              radius: Math.random() * 5 + 2,
              color: enemy.color,
              alpha: 1,
              life: 0,
              maxLife: 35
            });
          }

          return false;
        }

        if (enemy.type === "scout") {
          const angle = Math.atan2(p.y - enemy.y, p.x - enemy.x);
          enemy.x += Math.cos(angle) * enemy.speed;
          enemy.y += Math.sin(angle) * enemy.speed;
        } else if (enemy.type === "sentinel" || enemy.type === "phantom") {
          enemy.y += enemy.speed;
          enemy.x += Math.sin(Date.now() / 300 + enemy.id) * 2;
        } else if (enemy.type === "dreadnought") {
          enemy.y += enemy.speed * 0.5;
        } else if (enemy.type === "boss") {
          const targetY = 140;
          enemy.y += (targetY - enemy.y) * 0.05;
          enemy.x = width / 2 + Math.sin(Date.now() / 800) * (width * 0.3);
        }

        const fireInterval = enemy.type === "boss" ? 400 : enemy.type === "dreadnought" ? 900 : 1600;
        if (Date.now() - enemy.lastFired > fireInterval && enemy.y > 0) {
          enemy.lastFired = Date.now();

          if (enemy.type === "boss") {
            for (let bAng = 0; bAng < Math.PI * 2; bAng += Math.PI / 6) {
              gameRef.current.bullets.push({
                x: enemy.x,
                y: enemy.y,
                vx: Math.cos(bAng) * 5,
                vy: Math.sin(bAng) * 5,
                radius: 5,
                color: "#ec4899",
                damage: 15,
                isPlayer: false,
                life: 0
              });
            }
          } else {
            const targetAngle = Math.atan2(p.y - enemy.y, p.x - enemy.x);
            gameRef.current.bullets.push({
              x: enemy.x,
              y: enemy.y,
              vx: Math.cos(targetAngle) * 6,
              vy: Math.sin(targetAngle) * 6,
              radius: 4,
              color: enemy.color,
              damage: 12,
              isPlayer: false,
              life: 0
            });
          }
        }

        if (enemy.y > height + 60) return false;

        return true;
      });

      // --- 6. XP DROPS & PICKUPS ---
      gameRef.current.drops = gameRef.current.drops.filter((drop) => {
        const dist = Math.hypot(p.x - drop.x, p.y - drop.y);
        if (dist < 180) {
          const ang = Math.atan2(p.y - drop.y, p.x - drop.x);
          drop.x += Math.cos(ang) * 8;
          drop.y += Math.sin(ang) * 8;
        }

        if (dist < p.radius + drop.radius) {
          sfx.playPickup();
          if (drop.type === "xp") {
            setXp((prevXp) => {
              const newXp = prevXp + drop.value;
              if (newXp >= nextLevelXp) {
                setLevel((lvl) => {
                  const newLevel = lvl + 1;
                  setNextLevelXp(Math.floor(nextLevelXp * 1.5));
                  sfx.playLevelUp();

                  const shuffled = [...AVAILABLE_AUGMENTS].sort(() => 0.5 - Math.random());
                  setUpgradeChoices(shuffled.slice(0, 3));
                  setGameState("upgrade");

                  if (newLevel >= 5) {
                    setAchievements((prev) =>
                      prev.map((a) => (a.id === "level_5" ? { ...a, unlocked: true } : a))
                    );
                  }
                  return newLevel;
                });
                return newXp - nextLevelXp;
              }
              return newXp;
            });
          } else if (drop.type === "hp") {
            setStats((prev) => ({ ...prev, hp: Math.min(prev.maxHp, prev.hp + 25) }));
          } else if (drop.type === "shield") {
            setStats((prev) => ({ ...prev, shield: Math.min(prev.maxShield, prev.shield + 30) }));
          }
          return false;
        }
        return true;
      });

      // --- 7. RECHARGE SHIELD ---
      setStats((prev) => {
        if (prev.shield < prev.maxShield) {
          return {
            ...prev,
            shield: Math.min(prev.maxShield, prev.shield + prev.shieldRechargeRate * dt)
          };
        }
        return prev;
      });

      // --- 8. RENDER CANVAS GRAPHICS ---
      ctx.fillStyle = "#05030d";
      ctx.fillRect(0, 0, width, height);

      ctx.save();
      if (gameRef.current.screenShake > 0) {
        const shakeX = (Math.random() - 0.5) * gameRef.current.screenShake;
        const shakeY = (Math.random() - 0.5) * gameRef.current.screenShake;
        ctx.translate(shakeX, shakeY);
        gameRef.current.screenShake *= 0.9;
      }

      gameRef.current.stars.forEach((star) => {
        star.y += star.speed;
        if (star.y > height) star.y = 0;

        ctx.fillStyle = `rgba(255, 255, 255, ${0.3 + (star.z / 4) * 0.7})`;
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
        ctx.fill();
      });

      gameRef.current.particles = gameRef.current.particles.filter((pt) => {
        pt.x += pt.vx;
        pt.y += pt.vy;
        pt.life++;
        pt.alpha = 1 - pt.life / pt.maxLife;

        ctx.fillStyle = pt.color;
        ctx.globalAlpha = Math.max(0, pt.alpha);
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, pt.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;

        return pt.life < pt.maxLife;
      });

      gameRef.current.drops.forEach((drop) => {
        ctx.fillStyle = drop.type === "xp" ? "#38bdf8" : drop.type === "hp" ? "#10b981" : "#a855f7";
        ctx.shadowColor = ctx.fillStyle;
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.arc(drop.x, drop.y, drop.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      });

      gameRef.current.bullets.forEach((b) => {
        ctx.fillStyle = b.color;
        ctx.shadowColor = b.color;
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      });

      gameRef.current.enemies.forEach((enemy) => {
        ctx.save();
        ctx.translate(enemy.x, enemy.y);

        if (enemy.type === "boss") {
          ctx.fillStyle = enemy.color;
          ctx.shadowColor = "#ec4899";
          ctx.shadowBlur = 20;
          ctx.beginPath();
          ctx.arc(0, 0, enemy.radius, 0, Math.PI * 2);
          ctx.fill();

          ctx.strokeStyle = "#06b6d4";
          ctx.lineWidth = 4;
          ctx.beginPath();
          ctx.arc(0, 0, enemy.radius + 12, Date.now() / 400, Date.now() / 400 + Math.PI * 1.5);
          ctx.stroke();
          ctx.shadowBlur = 0;
        } else {
          ctx.fillStyle = enemy.color;
          ctx.beginPath();
          ctx.moveTo(0, enemy.radius);
          ctx.lineTo(-enemy.radius, -enemy.radius);
          ctx.lineTo(enemy.radius, -enemy.radius);
          ctx.closePath();
          ctx.fill();
        }
        ctx.restore();
      });

      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.angle + Math.PI / 2);

      if (p.dashTime > 0) {
        ctx.strokeStyle = "#a855f7";
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(0, 0, p.radius + 8, 0, Math.PI * 2);
        ctx.stroke();
      }

      if (stats.shield > 0) {
        ctx.strokeStyle = `rgba(56, 189, 248, ${0.4 + (stats.shield / stats.maxShield) * 0.4})`;
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.arc(0, 0, p.radius + 6, 0, Math.PI * 2);
        ctx.stroke();
      }

      ctx.fillStyle = "#38bdf8";
      ctx.shadowColor = "#38bdf8";
      ctx.shadowBlur = 12;
      ctx.beginPath();
      ctx.moveTo(0, -p.radius * 1.2);
      ctx.lineTo(-p.radius, p.radius);
      ctx.lineTo(0, p.radius * 0.6);
      ctx.lineTo(p.radius, p.radius);
      ctx.closePath();
      ctx.fill();
      ctx.shadowBlur = 0;

      ctx.fillStyle = "#f59e0b";
      ctx.beginPath();
      ctx.moveTo(-p.radius * 0.4, p.radius * 0.8);
      ctx.lineTo(0, p.radius * 1.5 + Math.random() * 6);
      ctx.lineTo(p.radius * 0.4, p.radius * 0.8);
      ctx.closePath();
      ctx.fill();

      ctx.restore();
      ctx.restore();

      if (score > highScore) {
        setHighScore(score);
        localStorage.setItem("hyper_aether_highscore", score.toString());
        if (score >= 50000) {
          setAchievements((prev) =>
            prev.map((a) => (a.id === "overdrive_legend" ? { ...a, unlocked: true } : a))
          );
        }
      }

      animationFrameRef.current = requestAnimationFrame(loop);
    };

    animationFrameRef.current = requestAnimationFrame(loop);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [gameState, stats, WEAPONS, weaponIndex, wave, bossActive, spawnEnemy, score, highScore, nextLevelXp]);

  const applyAugment = (augment: AugmentOption) => {
    setStats((prev) => augment.apply(prev));
    setSelectedAugments((prev) => [...prev, augment.title]);
    setGameState("playing");
  };

  return (
    <div className="relative w-full min-h-screen bg-[#05030d] text-white flex flex-col items-center justify-start p-4 font-sans select-none overflow-hidden">
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-cyan-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-6xl flex flex-wrap items-center justify-between gap-4 p-4 mb-4 bg-black/40 backdrop-blur-xl border border-purple-500/20 rounded-2xl z-10 shadow-2xl">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-gradient-to-br from-cyan-500 to-purple-600 rounded-xl shadow-lg shadow-cyan-500/30">
            <Sparkles className="w-6 h-6 text-white animate-pulse" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold bg-gradient-to-r from-cyan-400 via-purple-300 to-amber-300 bg-clip-text text-transparent tracking-wide">
              HYPER AETHER OVERDRIVE
            </h1>
            <p className="text-xs text-purple-300/70">Next-Gen Cybernetic Rogue-Lite Space Interceptor</p>
          </div>
        </div>

        <div className="flex items-center gap-2 bg-black/50 p-1.5 rounded-xl border border-white/10">
          {(["game", "upgrades", "leaderboard", "achievements", "controls"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 text-xs font-semibold rounded-lg capitalize transition-all duration-200 ${
                activeTab === tab
                  ? "bg-purple-600 text-white shadow-lg shadow-purple-600/40"
                  : "text-gray-400 hover:text-white hover:bg-white/5"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleToggleMute}
            className="p-2.5 bg-white/5 hover:bg-white/10 rounded-xl border border-white/10 text-gray-300 hover:text-white transition-all"
            title={muted ? "Unmute" : "Mute"}
          >
            {muted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5 text-cyan-400" />}
          </button>
        </div>
      </div>

      <div className="w-full max-w-6xl flex-1 flex flex-col items-center justify-center z-10">
        {activeTab === "game" && (
          <div className="relative w-full flex flex-col items-center">
            {gameState === "playing" && (
              <div className="w-full max-w-[1000px] flex flex-wrap items-center justify-between gap-4 p-3 mb-2 bg-black/60 backdrop-blur-md rounded-xl border border-white/10 text-xs">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Shield className="w-4 h-4 text-cyan-400" />
                    <div className="w-28 h-3.5 bg-gray-800 rounded-full overflow-hidden border border-cyan-500/30">
                      <div
                        className="h-full bg-cyan-400 transition-all duration-150"
                        style={{ width: `${(stats.shield / stats.maxShield) * 100}%` }}
                      />
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Activity className="w-4 h-4 text-emerald-400" />
                    <div className="w-28 h-3.5 bg-gray-800 rounded-full overflow-hidden border border-emerald-500/30">
                      <div
                        className="h-full bg-emerald-400 transition-all duration-150"
                        style={{ width: `${(stats.hp / stats.maxHp) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-6">
                  <div>
                    <span className="text-gray-400">SCORE: </span>
                    <span className="font-bold text-amber-300 text-sm">{score.toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="text-gray-400">WAVE: </span>
                    <span className="font-bold text-purple-400 text-sm">{wave}</span>
                  </div>
                  <div>
                    <span className="text-gray-400">LEVEL: </span>
                    <span className="font-bold text-cyan-400 text-sm">{level}</span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5 bg-white/5 px-2.5 py-1 rounded-lg border border-white/10">
                    <ZapOff className={`w-3.5 h-3.5 ${empCooldown === 0 ? "text-cyan-400 animate-pulse" : "text-gray-500"}`} />
                    <span className="text-[10px] text-gray-300">[SPACE] EMP</span>
                  </div>
                  <div className="flex items-center gap-1.5 bg-white/5 px-2.5 py-1 rounded-lg border border-white/10">
                    <Zap className={`w-3.5 h-3.5 ${dashCooldown === 0 ? "text-purple-400 animate-pulse" : "text-gray-500"}`} />
                    <span className="text-[10px] text-gray-300">[SHIFT] DASH</span>
                  </div>
                </div>
              </div>
            )}

            {gameState === "playing" && bossActive && (
              <div className="w-full max-w-[800px] mb-3 flex flex-col items-center">
                <div className="flex items-center gap-2 mb-1">
                  <Skull className="w-4 h-4 text-red-500 animate-bounce" />
                  <span className="text-xs font-bold text-red-400 tracking-wider">APEX HYPERION ZENITH CORE</span>
                </div>
                <div className="w-full h-3 bg-red-950/80 rounded-full overflow-hidden border border-red-500/50 p-0.5">
                  <div
                    className="h-full bg-gradient-to-r from-red-600 via-pink-500 to-amber-500 rounded-full transition-all duration-200"
                    style={{ width: `${(bossHp / bossMaxHp) * 100}%` }}
                  />
                </div>
              </div>
            )}

            <div className="relative w-full max-w-[1000px] aspect-[16/10] bg-black/80 rounded-2xl border border-purple-500/30 overflow-hidden shadow-2xl shadow-purple-950/50">
              <canvas
                ref={canvasRef}
                width={1000}
                height={625}
                className="w-full h-full object-cover cursor-crosshair"
              />

              {gameState === "menu" && (
                <div className="absolute inset-0 bg-black/80 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center">
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="max-w-md flex flex-col items-center"
                  >
                    <div className="w-20 h-20 mb-6 bg-gradient-to-br from-cyan-500 to-purple-600 rounded-3xl flex items-center justify-center shadow-xl shadow-cyan-500/40">
                      <Sparkles className="w-10 h-10 text-white" />
                    </div>
                    <h2 className="text-3xl font-black text-white tracking-wide mb-2">
                      HYPER AETHER OVERDRIVE
                    </h2>
                    <p className="text-sm text-gray-300 mb-6 leading-relaxed">
                      Pilot apex starfighters, unlock tachyon matrix augments, eliminate rogue AI armadas, and conquer multistage dreadnought bosses.
                    </p>

                    <button
                      onClick={startGame}
                      className="px-8 py-3.5 bg-gradient-to-r from-cyan-500 via-purple-600 to-pink-500 hover:from-cyan-400 hover:to-pink-400 text-white font-bold rounded-xl shadow-xl shadow-purple-600/50 flex items-center gap-3 text-base transition-all transform hover:scale-105 active:scale-95"
                    >
                      <Play className="w-5 h-5 fill-current" /> LAUNCH MISSION
                    </button>
                  </motion.div>
                </div>
              )}

              {gameState === "upgrade" && (
                <div className="absolute inset-0 bg-black/85 backdrop-blur-xl flex flex-col items-center justify-center p-6 text-center z-30">
                  <h3 className="text-xl font-extrabold text-cyan-400 tracking-wider mb-1">
                    PILOT AUGMENT READY!
                  </h3>
                  <p className="text-xs text-gray-400 mb-6">Select 1 Matrix Enhancement to Upgrade Your Interceptor</p>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-3xl w-full">
                    {upgradeChoices.map((choice) => (
                      <motion.div
                        key={choice.id}
                        whileHover={{ scale: 1.04 }}
                        onClick={() => applyAugment(choice)}
                        className="bg-black/60 border border-purple-500/40 hover:border-cyan-400 p-5 rounded-2xl flex flex-col items-center text-center cursor-pointer transition-all shadow-lg hover:shadow-cyan-500/20"
                      >
                        <div className="w-12 h-12 mb-3 bg-purple-600/30 rounded-xl flex items-center justify-center text-cyan-300">
                          <Sparkles className="w-6 h-6" />
                        </div>
                        <h4 className="font-bold text-white text-sm mb-1">{choice.title}</h4>
                        <p className="text-xs text-gray-400 leading-relaxed mb-3">{choice.description}</p>
                        <span className="mt-auto px-3 py-1 bg-cyan-500/20 text-cyan-300 text-[10px] font-bold rounded-full uppercase">
                          {choice.type}
                        </span>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}

              {gameState === "gameover" && (
                <div className="absolute inset-0 bg-black/90 backdrop-blur-lg flex flex-col items-center justify-center p-6 text-center z-30">
                  <div className="w-16 h-16 mb-4 bg-red-600/30 rounded-2xl flex items-center justify-center text-red-500 border border-red-500/40">
                    <Skull className="w-8 h-8 animate-pulse" />
                  </div>
                  <h3 className="text-2xl font-black text-red-500 tracking-wider mb-2">MISSION FAILED</h3>
                  <p className="text-xs text-gray-400 mb-6">Your interceptor structure was compromised.</p>

                  <div className="flex items-center gap-8 mb-8 bg-white/5 px-6 py-4 rounded-xl border border-white/10">
                    <div>
                      <div className="text-[10px] text-gray-400">FINAL SCORE</div>
                      <div className="text-xl font-bold text-amber-300">{score.toLocaleString()}</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-gray-400">WAVES SURVIVED</div>
                      <div className="text-xl font-bold text-purple-400">{wave}</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-gray-400">ENEMIES DESTROYED</div>
                      <div className="text-xl font-bold text-cyan-400">{kills}</div>
                    </div>
                  </div>

                  <button
                    onClick={startGame}
                    className="px-8 py-3 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl shadow-lg shadow-purple-600/40 flex items-center gap-2 text-sm transition-all"
                  >
                    <RotateCcw className="w-4 h-4" /> RETRY MISSION
                  </button>
                </div>
              )}
            </div>

            {gameState === "playing" && (
              <div className="w-full max-w-[1000px] flex items-center justify-center gap-3 mt-3">
                {WEAPONS.map((w, idx) => (
                  <button
                    key={w.name}
                    onClick={() => setWeaponIndex(idx)}
                    className={`flex-1 py-2 px-3 rounded-xl border text-xs font-semibold flex items-center justify-between transition-all ${
                      weaponIndex === idx
                        ? "bg-purple-600/30 border-purple-400 text-white shadow-lg shadow-purple-600/30"
                        : "bg-black/40 border-white/10 text-gray-400 hover:bg-white/5"
                    }`}
                  >
                    <span>{idx + 1}. {w.name}</span>
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: w.color }} />
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === "upgrades" && (
          <div className="w-full max-w-4xl bg-black/50 backdrop-blur-xl border border-purple-500/20 rounded-2xl p-6">
            <h2 className="text-lg font-bold text-cyan-400 mb-4 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-cyan-400" /> ACTIVE PILOT AUGMENTS ({selectedAugments.length})
            </h2>
            {selectedAugments.length === 0 ? (
              <p className="text-sm text-gray-400">No matrix augments unlocked yet. Level up in game to gain augments.</p>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {selectedAugments.map((aug, i) => (
                  <div key={i} className="p-3 bg-white/5 border border-white/10 rounded-xl text-xs font-medium text-purple-300">
                    • {aug}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === "leaderboard" && (
          <div className="w-full max-w-4xl bg-black/50 backdrop-blur-xl border border-purple-500/20 rounded-2xl p-6">
            <h2 className="text-lg font-bold text-amber-300 mb-4 flex items-center gap-2">
              <Trophy className="w-5 h-5 text-amber-400" /> GLOBAL CELESTIAL LEADERBOARD
            </h2>
            <div className="space-y-2">
              {leaderboard.map((entry, idx) => (
                <div
                  key={entry.id}
                  className="flex items-center justify-between p-3.5 bg-white/5 border border-white/10 rounded-xl text-sm"
                >
                  <div className="flex items-center gap-4">
                    <span className={`font-black ${idx === 0 ? "text-amber-400" : idx === 1 ? "text-gray-300" : idx === 2 ? "text-amber-600" : "text-gray-500"}`}>
                      #{idx + 1}
                    </span>
                    <span className="font-semibold text-white">{entry.name}</span>
                  </div>
                  <div className="flex items-center gap-6">
                    <span className="text-gray-400 text-xs">Wave {entry.wave}</span>
                    <span className="font-bold text-cyan-400">{entry.score.toLocaleString()} PTS</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === "achievements" && (
          <div className="w-full max-w-4xl bg-black/50 backdrop-blur-xl border border-purple-500/20 rounded-2xl p-6">
            <h2 className="text-lg font-bold text-purple-400 mb-4 flex items-center gap-2">
              <Award className="w-5 h-5 text-purple-400" /> PILOT ACHIEVEMENTS
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {achievements.map((ach) => (
                <div
                  key={ach.id}
                  className={`p-4 rounded-xl border flex items-center gap-4 transition-all ${
                    ach.unlocked
                      ? "bg-purple-950/40 border-purple-500/50 text-white"
                      : "bg-white/5 border-white/10 text-gray-500"
                  }`}
                >
                  <div className={`p-3 rounded-xl ${ach.unlocked ? "bg-purple-600 text-white" : "bg-gray-800 text-gray-600"}`}>
                    <Award className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm">{ach.title}</h4>
                    <p className="text-xs text-gray-400">{ach.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === "controls" && (
          <div className="w-full max-w-4xl bg-black/50 backdrop-blur-xl border border-purple-500/20 rounded-2xl p-6">
            <h2 className="text-lg font-bold text-cyan-400 mb-4 flex items-center gap-2">
              <Info className="w-5 h-5 text-cyan-400" /> FLIGHT CONTROLS & TACTICS
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="p-4 bg-white/5 rounded-xl border border-white/10">
                <h4 className="font-bold text-white mb-2 text-sm">Movement & Aim</h4>
                <p className="text-gray-300 leading-relaxed mb-1">• WASD / Arrow Keys: Thrust & Steer Interceptor</p>
                <p className="text-gray-300 leading-relaxed mb-1">• Mouse Movement: Target Aim Reticle</p>
                <p className="text-gray-300 leading-relaxed">• Left Mouse Click (Hold): Fire Primary Weapon</p>
              </div>
              <div className="p-4 bg-white/5 rounded-xl border border-white/10">
                <h4 className="font-bold text-white mb-2 text-sm">Special Abilities</h4>
                <p className="text-gray-300 leading-relaxed mb-1">• [SPACEBAR]: Graviton EMP Shockwave (Clears bullets)</p>
                <p className="text-gray-300 leading-relaxed mb-1">• [SHIFT]: Tachyon Time-Dilation Dash (Invulnerable iframe)</p>
                <p className="text-gray-300 leading-relaxed">• [1 - 5 Keys]: Hot-swap Plasma Weapons</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
