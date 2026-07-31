"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import {
  Shield,
  Zap,
  Volume2,
  VolumeX,
  Play,
  RotateCcw,
  Sparkles,
  Target,
  Trophy,
  Award,
  Crosshair,
  Flame,
  Activity,
  ArrowLeft,
  ChevronRight,
  Maximize2,
  Cpu,
  Radio,
  BarChart2
} from "lucide-react";
import Link from "next/link";

// ==========================================
// 1. TYPES & CONSTANTS
// ==========================================

export type WeaponType =
  | "hyper_pulse"
  | "void_beam"
  | "tachyon_rail"
  | "cluster_missile"
  | "plasma_scatter";

export interface WeaponConfig {
  id: WeaponType;
  name: string;
  fireRate: number; // ms per shot
  damage: number;
  energyCost: number;
  color: string;
  description: string;
  speed: number;
  size: number;
}

export const WEAPON_TYPES: Record<WeaponType, WeaponConfig> = {
  hyper_pulse: {
    id: "hyper_pulse",
    name: "Hyper Pulse Cannon",
    fireRate: 120,
    damage: 28,
    energyCost: 3,
    color: "#00f0ff",
    description: "Rapid energy pulse stream with moderate spread.",
    speed: 16,
    size: 5,
  },
  void_beam: {
    id: "void_beam",
    name: "Void Ray Beam",
    fireRate: 80,
    damage: 18,
    energyCost: 2,
    color: "#a855f7",
    description: "High-frequency violet beam that pierces armor.",
    speed: 22,
    size: 4,
  },
  tachyon_rail: {
    id: "tachyon_rail",
    name: "Tachyon Railgun",
    fireRate: 400,
    damage: 140,
    energyCost: 15,
    color: "#f59e0b",
    description: "Devastating hyper-velocity slug penetrating enemy lines.",
    speed: 30,
    size: 8,
  },
  cluster_missile: {
    id: "cluster_missile",
    name: "Cluster Seekers",
    fireRate: 350,
    damage: 65,
    energyCost: 12,
    color: "#ec4899",
    description: "Homing explosive ordinance seeking high-threat targets.",
    speed: 11,
    size: 7,
  },
  plasma_scatter: {
    id: "plasma_scatter",
    name: "Plasma Scattergun",
    fireRate: 250,
    damage: 22,
    energyCost: 8,
    color: "#10b981",
    description: "Multi-shot burst spreading high-temperature plasma.",
    speed: 14,
    size: 6,
  },
};

export interface PlayerState {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  health: number;
  maxHealth: number;
  shield: number;
  maxShield: number;
  energy: number;
  maxEnergy: number;
  activeWeapon: WeaponType;
  dashCooldown: number;
  novaCooldown: number;
  isDashing: boolean;
  score: number;
  combo: number;
  maxCombo: number;
  kills: number;
}

export interface Enemy {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  health: number;
  maxHealth: number;
  type: "scout" | "drone" | "interceptor" | "cruiser" | "boss";
  color: string;
  scoreValue: number;
  fireCooldown: number;
  behaviorTimer: number;
  phase?: number;
}

export interface Bullet {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  damage: number;
  color: string;
  isPlayer: boolean;
  isHoming?: boolean;
  targetId?: string;
  life: number;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
  alpha: number;
  life: number;
  maxLife: number;
}

export interface Powerup {
  id: string;
  x: number;
  y: number;
  type: "health" | "shield" | "energy" | "weapon_upgrade" | "nova_charge";
  radius: number;
  duration: number;
}

export interface FloatingText {
  id: string;
  x: number;
  y: number;
  text: string;
  color: string;
  alpha: number;
  vy: number;
}

// ==========================================
// 2. SOUND SYNTHESIZER (Web Audio API)
// ==========================================
class SoundSynth {
  private ctx: AudioContext | null = null;
  public enabled: boolean = true;

  private init() {
    if (!this.ctx && typeof window !== "undefined") {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx && this.ctx.state === "suspended") {
      this.ctx.resume();
    }
  }

  playLaser(type: WeaponType) {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.connect(gain);
    gain.connect(this.ctx.destination);

    const now = this.ctx.currentTime;
    if (type === "hyper_pulse") {
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(800, now);
      osc.frequency.exponentialRampToValueAtTime(150, now + 0.08);
      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.08);
      osc.start(now);
      osc.stop(now + 0.08);
    } else if (type === "void_beam") {
      osc.type = "sine";
      osc.frequency.setValueAtTime(1200, now);
      osc.frequency.exponentialRampToValueAtTime(300, now + 0.05);
      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.05);
      osc.start(now);
      osc.stop(now + 0.05);
    } else if (type === "tachyon_rail") {
      osc.type = "triangle";
      osc.frequency.setValueAtTime(1600, now);
      osc.frequency.exponentialRampToValueAtTime(80, now + 0.2);
      gain.gain.setValueAtTime(0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
      osc.start(now);
      osc.stop(now + 0.2);
    } else if (type === "cluster_missile") {
      osc.type = "square";
      osc.frequency.setValueAtTime(350, now);
      osc.frequency.exponentialRampToValueAtTime(100, now + 0.15);
      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
      osc.start(now);
      osc.stop(now + 0.15);
    } else {
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(600, now);
      osc.frequency.exponentialRampToValueAtTime(200, now + 0.1);
      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
      osc.start(now);
      osc.stop(now + 0.1);
    }
  }

  playExplosion(isLarge: boolean = false) {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;

    const dur = isLarge ? 0.4 : 0.2;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = "sawtooth";
    const now = this.ctx.currentTime;
    osc.frequency.setValueAtTime(isLarge ? 120 : 220, now);
    osc.frequency.exponentialRampToValueAtTime(30, now + dur);

    gain.gain.setValueAtTime(isLarge ? 0.3 : 0.18, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + dur);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + dur);
  }

  playPowerup() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const notes = [440, 554.37, 659.25, 880];
    notes.forEach((freq, i) => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, now + i * 0.04);
      gain.gain.setValueAtTime(0.12, now + i * 0.04);
      gain.gain.exponentialRampToValueAtTime(0.01, now + i * 0.04 + 0.08);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now + i * 0.04);
      osc.stop(now + i * 0.04 + 0.08);
    });
  }

  playNova() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(100, now);
    osc.frequency.exponentialRampToValueAtTime(1200, now + 0.5);

    gain.gain.setValueAtTime(0.35, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.5);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.5);
  }
}

const audioSynth = new SoundSynth();

// ==========================================
// 3. MAIN GAME COMPONENT
// ==========================================
export default function HyperionVoidSurgeGame() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Game UI & Logic States
  const [gameState, setGameState] = useState<"menu" | "playing" | "paused" | "gameover">("menu");
  const [soundOn, setSoundOn] = useState<boolean>(true);
  const [wave, setWave] = useState<number>(1);
  const [highScore, setHighScore] = useState<number>(0);
  const [score, setScore] = useState<number>(0);
  const [kills, setKills] = useState<number>(0);
  const [combo, setCombo] = useState<number>(0);
  const [selectedWeapon, setSelectedWeapon] = useState<WeaponType>("hyper_pulse");
  const [playerHealth, setPlayerHealth] = useState<number>(100);
  const [playerShield, setPlayerShield] = useState<number>(100);
  const [playerEnergy, setPlayerEnergy] = useState<number>(100);
  const [novaReady, setNovaReady] = useState<boolean>(true);
  const [bossHealthPercent, setBossHealthPercent] = useState<number | null>(null);

  // Game Engine References (to prevent re-render glitches inside loop)
  const engineRef = useRef<{
    player: PlayerState;
    enemies: Enemy[];
    bullets: Bullet[];
    particles: Particle[];
    powerups: Powerup[];
    floatingTexts: FloatingText[];
    keys: Record<string, boolean>;
    mouse: { x: number; y: number; isDown: boolean };
    lastShotTime: number;
    waveEnemiesToSpawn: number;
    spawnTimer: number;
    screenShake: number;
    bossRef: Enemy | null;
  }>({
    player: {
      x: 600,
      y: 400,
      vx: 0,
      vy: 0,
      radius: 18,
      health: 100,
      maxHealth: 100,
      shield: 100,
      maxShield: 100,
      energy: 100,
      maxEnergy: 100,
      activeWeapon: "hyper_pulse",
      dashCooldown: 0,
      novaCooldown: 0,
      isDashing: false,
      score: 0,
      combo: 0,
      maxCombo: 0,
      kills: 0,
    },
    enemies: [],
    bullets: [],
    particles: [],
    powerups: [],
    floatingTexts: [],
    keys: {},
    mouse: { x: 600, y: 300, isDown: false },
    lastShotTime: 0,
    waveEnemiesToSpawn: 10,
    spawnTimer: 0,
    screenShake: 0,
    bossRef: null,
  });

  // Load High Score from LocalStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("hyperion_void_high_score");
      if (saved) setHighScore(parseInt(saved, 10));
    }
  }, []);

  // Update sound state in synth
  useEffect(() => {
    audioSynth.enabled = soundOn;
  }, [soundOn]);

  // Restart / Reset Game Data
  const startNewGame = useCallback(() => {
    const canvas = canvasRef.current;
    const width = canvas ? canvas.width : 1200;
    const height = canvas ? canvas.height : 700;

    engineRef.current = {
      player: {
        x: width / 2,
        y: height - 120,
        vx: 0,
        vy: 0,
        radius: 18,
        health: 100,
        maxHealth: 100,
        shield: 100,
        maxShield: 100,
        energy: 100,
        maxEnergy: 100,
        activeWeapon: "hyper_pulse",
        dashCooldown: 0,
        novaCooldown: 0,
        isDashing: false,
        score: 0,
        combo: 0,
        maxCombo: 0,
        kills: 0,
      },
      enemies: [],
      bullets: [],
      particles: [],
      powerups: [],
      floatingTexts: [],
      keys: {},
      mouse: { x: width / 2, y: height / 2, isDown: false },
      lastShotTime: 0,
      waveEnemiesToSpawn: 12,
      spawnTimer: 0,
      screenShake: 0,
      bossRef: null,
    };

    setWave(1);
    setScore(0);
    setKills(0);
    setCombo(0);
    setSelectedWeapon("hyper_pulse");
    setPlayerHealth(100);
    setPlayerShield(100);
    setPlayerEnergy(100);
    setNovaReady(true);
    setBossHealthPercent(null);
    setGameState("playing");
  }, []);

  // Spawn Enemy Utility
  const spawnEnemy = useCallback((currentWave: number, width: number, isBossWave: boolean = false) => {
    const engine = engineRef.current;

    if (isBossWave && !engine.bossRef) {
      // Spawn Dreadnought Boss
      const boss: Enemy = {
        id: "boss_" + Date.now(),
        x: width / 2,
        y: -100,
        vx: 0,
        vy: 1.5,
        radius: 55,
        health: 1200 + currentWave * 400,
        maxHealth: 1200 + currentWave * 400,
        type: "boss",
        color: "#f43f5e",
        scoreValue: 5000,
        fireCooldown: 0,
        behaviorTimer: 0,
        phase: 1,
      };
      engine.enemies.push(boss);
      engine.bossRef = boss;

      engine.floatingTexts.push({
        id: "txt_" + Date.now(),
        x: width / 2 - 140,
        y: 200,
        text: "⚠️ WARNING: DREADNOUGHT APPROACHING ⚠️",
        color: "#f43f5e",
        alpha: 1.0,
        vy: -0.3,
      });
      return;
    }

    const randX = Math.random() * (width - 100) + 50;
    const randType = Math.random();

    let enemy: Enemy;
    if (randType < 0.4) {
      // Scout - fast, low health
      enemy = {
        id: "e_" + Date.now() + "_" + Math.random(),
        x: randX,
        y: -30,
        vx: (Math.random() - 0.5) * 2.5,
        vy: 2.2 + Math.random() * 1.5,
        radius: 14,
        health: 35 + currentWave * 8,
        maxHealth: 35 + currentWave * 8,
        type: "scout",
        color: "#38bdf8",
        scoreValue: 120,
        fireCooldown: 0,
        behaviorTimer: 0,
      };
    } else if (randType < 0.75) {
      // Interceptor - aggressive shooter
      enemy = {
        id: "e_" + Date.now() + "_" + Math.random(),
        x: randX,
        y: -30,
        vx: (Math.random() - 0.5) * 1.8,
        vy: 1.6 + Math.random(),
        radius: 20,
        health: 80 + currentWave * 15,
        maxHealth: 80 + currentWave * 15,
        type: "interceptor",
        color: "#c084fc",
        scoreValue: 250,
        fireCooldown: 60,
        behaviorTimer: 0,
      };
    } else {
      // Heavy Cruiser - tanky
      enemy = {
        id: "e_" + Date.now() + "_" + Math.random(),
        x: randX,
        y: -40,
        vx: (Math.random() - 0.5) * 1.0,
        vy: 1.0 + Math.random() * 0.5,
        radius: 32,
        health: 220 + currentWave * 45,
        maxHealth: 220 + currentWave * 45,
        type: "cruiser",
        color: "#f97316",
        scoreValue: 600,
        fireCooldown: 90,
        behaviorTimer: 0,
      };
    }

    engine.enemies.push(enemy);
  }, []);

  // Trigger Graviton Nova Ability
  const triggerNova = useCallback(() => {
    const engine = engineRef.current;
    if (engine.player.novaCooldown > 0 || engine.player.energy < 30) return;

    engine.player.energy -= 30;
    engine.player.novaCooldown = 400; // frames
    setNovaReady(false);
    audioSynth.playNova();

    engine.screenShake = 25;

    // Create massive burst particles
    for (let i = 0; i < 120; i++) {
      const angle = (Math.PI * 2 * i) / 120;
      const spd = 6 + Math.random() * 10;
      engine.particles.push({
        x: engine.player.x,
        y: engine.player.y,
        vx: Math.cos(angle) * spd,
        vy: Math.sin(angle) * spd,
        radius: 3 + Math.random() * 4,
        color: i % 2 === 0 ? "#a855f7" : "#00f0ff",
        alpha: 1.0,
        life: 0,
        maxLife: 40 + Math.random() * 20,
      });
    }

    // Damage all visible enemies
    engine.enemies.forEach((enemy) => {
      const dist = Math.hypot(enemy.x - engine.player.x, enemy.y - engine.player.y);
      if (dist < 450) {
        enemy.health -= 220;
        engine.particles.push({
          x: enemy.x,
          y: enemy.y,
          vx: (Math.random() - 0.5) * 4,
          vy: (Math.random() - 0.5) * 4,
          radius: 5,
          color: "#a855f7",
          alpha: 1,
          life: 0,
          maxLife: 25,
        });
      }
    });

    // Clear enemy bullets
    engine.bullets = engine.bullets.filter((b) => b.isPlayer);
  }, []);

  // Trigger Dash Ability
  const triggerDash = useCallback(() => {
    const engine = engineRef.current;
    if (engine.player.dashCooldown > 0 || engine.player.energy < 20) return;

    engine.player.energy -= 20;
    engine.player.dashCooldown = 150;
    engine.player.isDashing = true;

    const angle = Math.atan2(
      engine.mouse.y - engine.player.y,
      engine.mouse.x - engine.player.x
    );
    engine.player.vx = Math.cos(angle) * 18;
    engine.player.vy = Math.sin(angle) * 18;

    for (let i = 0; i < 25; i++) {
      engine.particles.push({
        x: engine.player.x,
        y: engine.player.y,
        vx: (Math.random() - 0.5) * 5,
        vy: (Math.random() - 0.5) * 5,
        radius: 4,
        color: "#00f0ff",
        alpha: 1,
        life: 0,
        maxLife: 20,
      });
    }
  }, []);

  // Weapon Fire Logic
  const fireWeapon = useCallback(() => {
    const engine = engineRef.current;
    const now = Date.now();
    const wConfig = WEAPON_TYPES[engine.player.activeWeapon];

    if (now - engine.lastShotTime < wConfig.fireRate) return;
    if (engine.player.energy < wConfig.energyCost) return;

    engine.player.energy = Math.max(0, engine.player.energy - wConfig.energyCost);
    engine.lastShotTime = now;
    audioSynth.playLaser(wConfig.id);

    const angle = Math.atan2(
      engine.mouse.y - engine.player.y,
      engine.mouse.x - engine.player.x
    );

    if (wConfig.id === "hyper_pulse") {
      const spread = (Math.random() - 0.5) * 0.15;
      engine.bullets.push({
        id: "b_" + Math.random(),
        x: engine.player.x,
        y: engine.player.y,
        vx: Math.cos(angle + spread) * wConfig.speed,
        vy: Math.sin(angle + spread) * wConfig.speed,
        radius: wConfig.size,
        damage: wConfig.damage,
        color: wConfig.color,
        isPlayer: true,
        life: 0,
      });
    } else if (wConfig.id === "void_beam") {
      engine.bullets.push({
        id: "b_" + Math.random(),
        x: engine.player.x,
        y: engine.player.y,
        vx: Math.cos(angle) * wConfig.speed,
        vy: Math.sin(angle) * wConfig.speed,
        radius: wConfig.size,
        damage: wConfig.damage,
        color: wConfig.color,
        isPlayer: true,
        life: 0,
      });
    } else if (wConfig.id === "tachyon_rail") {
      engine.screenShake = 6;
      engine.bullets.push({
        id: "b_" + Math.random(),
        x: engine.player.x,
        y: engine.player.y,
        vx: Math.cos(angle) * wConfig.speed,
        vy: Math.sin(angle) * wConfig.speed,
        radius: wConfig.size,
        damage: wConfig.damage,
        color: wConfig.color,
        isPlayer: true,
        life: 0,
      });
    } else if (wConfig.id === "cluster_missile") {
      [-0.2, 0, 0.2].forEach((offset) => {
        engine.bullets.push({
          id: "b_" + Math.random(),
          x: engine.player.x,
          y: engine.player.y,
          vx: Math.cos(angle + offset) * wConfig.speed,
          vy: Math.sin(angle + offset) * wConfig.speed,
          radius: wConfig.size,
          damage: wConfig.damage,
          color: wConfig.color,
          isPlayer: true,
          isHoming: true,
          life: 0,
        });
      });
    } else if (wConfig.id === "plasma_scatter") {
      for (let i = -2; i <= 2; i++) {
        const spreadAngle = angle + i * 0.12;
        engine.bullets.push({
          id: "b_" + Math.random(),
          x: engine.player.x,
          y: engine.player.y,
          vx: Math.cos(spreadAngle) * wConfig.speed,
          vy: Math.sin(spreadAngle) * wConfig.speed,
          radius: wConfig.size,
          damage: wConfig.damage,
          color: wConfig.color,
          isPlayer: true,
          life: 0,
        });
      }
    }
  }, []);

  // Window Resize & Keyboard/Mouse Input Listeners
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      engineRef.current.keys[e.key.toLowerCase()] = true;

      // Weapon shortcuts
      if (e.key === "1") setSelectedWeapon("hyper_pulse");
      if (e.key === "2") setSelectedWeapon("void_beam");
      if (e.key === "3") setSelectedWeapon("tachyon_rail");
      if (e.key === "4") setSelectedWeapon("cluster_missile");
      if (e.key === "5") setSelectedWeapon("plasma_scatter");

      if (e.key.toLowerCase() === "e" || e.key === " ") {
        triggerNova();
      }
      if (e.key.toLowerCase() === "shift") {
        triggerDash();
      }
      if (e.key.toLowerCase() === "p" || e.key === "Escape") {
        setGameState((prev) => (prev === "playing" ? "paused" : prev === "paused" ? "playing" : prev));
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      engineRef.current.keys[e.key.toLowerCase()] = false;
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!canvasRef.current) return;
      const rect = canvasRef.current.getBoundingClientRect();
      engineRef.current.mouse.x = e.clientX - rect.left;
      engineRef.current.mouse.y = e.clientY - rect.top;
    };

    const handleMouseDown = () => {
      engineRef.current.mouse.isDown = true;
    };

    const handleMouseUp = () => {
      engineRef.current.mouse.isDown = false;
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
  }, [triggerNova, triggerDash]);

  // Sync state weapon selection
  useEffect(() => {
    engineRef.current.player.activeWeapon = selectedWeapon;
  }, [selectedWeapon]);

  // Main Canvas Render & Physics Loop
  useEffect(() => {
    let animationFrameId: number;

    const renderLoop = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const engine = engineRef.current;
      const { player } = engine;

      // Handle Canvas Sizing
      if (canvas.width !== canvas.clientWidth || canvas.height !== canvas.clientHeight) {
        canvas.width = canvas.clientWidth || 1200;
        canvas.height = canvas.clientHeight || 700;
      }
      const W = canvas.width;
      const H = canvas.height;

      if (gameState === "playing") {
        // ----------------------------------------
        // A. PLAYER MOVEMENT & PHYSICS
        // ----------------------------------------
        const moveSpeed = player.isDashing ? 10 : 6.5;
        let dx = 0;
        let dy = 0;

        if (engine.keys["w"] || engine.keys["arrowup"]) dy -= 1;
        if (engine.keys["s"] || engine.keys["arrowdown"]) dy += 1;
        if (engine.keys["a"] || engine.keys["arrowleft"]) dx -= 1;
        if (engine.keys["d"] || engine.keys["arrowright"]) dx += 1;

        if (dx !== 0 && dy !== 0) {
          dx *= 0.7071;
          dy *= 0.7071;
        }

        player.vx = player.vx * 0.85 + dx * moveSpeed * 0.15;
        player.vy = player.vy * 0.85 + dy * moveSpeed * 0.15;

        player.x += player.vx;
        player.y += player.vy;

        // Boundaries
        player.x = Math.max(player.radius + 10, Math.min(W - player.radius - 10, player.x));
        player.y = Math.max(player.radius + 10, Math.min(H - player.radius - 10, player.y));

        // Energy & Shield Regeneration
        if (player.energy < player.maxEnergy) {
          player.energy = Math.min(player.maxEnergy, player.energy + 0.35);
        }
        if (player.shield < player.maxShield) {
          player.shield = Math.min(player.maxShield, player.shield + 0.08);
        }

        // Cooldown Timers
        if (player.dashCooldown > 0) player.dashCooldown--;
        if (player.dashCooldown < 120) player.isDashing = false;

        if (player.novaCooldown > 0) {
          player.novaCooldown--;
          if (player.novaCooldown === 0) setNovaReady(true);
        }

        // Auto Fire when mouse down
        if (engine.mouse.isDown) {
          fireWeapon();
        }

        // ----------------------------------------
        // B. WAVE MANAGEMENT & ENEMY SPAWNING
        // ----------------------------------------
        if (engine.waveEnemiesToSpawn > 0) {
          engine.spawnTimer++;
          if (engine.spawnTimer >= Math.max(25, 90 - wave * 6)) {
            engine.spawnTimer = 0;
            spawnEnemy(wave, W, wave % 5 === 0);
            engine.waveEnemiesToSpawn--;
          }
        } else if (engine.enemies.length === 0) {
          // Wave Cleared!
          const nextWave = wave + 1;
          setWave(nextWave);
          engine.waveEnemiesToSpawn = 10 + nextWave * 4;
          engine.player.health = Math.min(engine.player.maxHealth, engine.player.health + 25);
          engine.player.shield = engine.player.maxShield;

          engine.floatingTexts.push({
            id: "txt_" + Date.now(),
            x: W / 2 - 80,
            y: H / 2 - 50,
            text: `WAVE ${nextWave} INCOMING`,
            color: "#00f0ff",
            alpha: 1.0,
            vy: -0.5,
          });

          audioSynth.playPowerup();
        }

        // Update Boss Health Bar state for UI
        if (engine.bossRef) {
          const hpPct = Math.max(0, (engine.bossRef.health / engine.bossRef.maxHealth) * 100);
          setBossHealthPercent(hpPct);
        } else {
          setBossHealthPercent(null);
        }

        // ----------------------------------------
        // C. BULLET PHYSICS & COLLISIONS
        // ----------------------------------------
        engine.bullets.forEach((bullet) => {
          if (bullet.isHoming && bullet.isPlayer) {
            // Find closest enemy
            let closest: Enemy | null = null;
            let minDist = 9999;
            engine.enemies.forEach((e) => {
              const d = Math.hypot(e.x - bullet.x, e.y - bullet.y);
              if (d < minDist) {
                minDist = d;
                closest = e;
              }
            });
            if (closest) {
              const targetAngle = Math.atan2((closest as Enemy).y - bullet.y, (closest as Enemy).x - bullet.x);
              bullet.vx = bullet.vx * 0.9 + Math.cos(targetAngle) * 2.2;
              bullet.vy = bullet.vy * 0.9 + Math.sin(targetAngle) * 2.2;
            }
          }

          bullet.x += bullet.vx;
          bullet.y += bullet.vy;
          bullet.life++;

          // Bullet trail particles
          if (Math.random() < 0.4) {
            engine.particles.push({
              x: bullet.x,
              y: bullet.y,
              vx: (Math.random() - 0.5) * 1.5,
              vy: (Math.random() - 0.5) * 1.5,
              radius: bullet.radius * 0.5,
              color: bullet.color,
              alpha: 0.7,
              life: 0,
              maxLife: 15,
            });
          }
        });

        // Filter out of bounds / dead bullets
        engine.bullets = engine.bullets.filter(
          (b) => b.x >= -50 && b.x <= W + 50 && b.y >= -50 && b.y <= H + 50 && b.life < 200
        );

        // ----------------------------------------
        // D. ENEMY AI & BEHAVIOR
        // ----------------------------------------
        engine.enemies.forEach((enemy) => {
          enemy.behaviorTimer++;

          if (enemy.type === "scout") {
            enemy.x += enemy.vx + Math.sin(enemy.behaviorTimer * 0.08) * 2;
            enemy.y += enemy.vy;
          } else if (enemy.type === "interceptor") {
            enemy.x += enemy.vx;
            enemy.y += enemy.vy;
            if (enemy.y > H * 0.6) enemy.vy = -1;
            if (enemy.y < 60) enemy.vy = 1;
            if (enemy.x < 50 || enemy.x > W - 50) enemy.vx *= -1;

            // Enemy Shooting
            enemy.fireCooldown--;
            if (enemy.fireCooldown <= 0) {
              enemy.fireCooldown = 90 - Math.min(50, wave * 3);
              const angle = Math.atan2(player.y - enemy.y, player.x - enemy.x);
              engine.bullets.push({
                id: "eb_" + Math.random(),
                x: enemy.x,
                y: enemy.y,
                vx: Math.cos(angle) * 7,
                vy: Math.sin(angle) * 7,
                radius: 5,
                damage: 18,
                color: "#ef4444",
                isPlayer: false,
                life: 0,
              });
            }
          } else if (enemy.type === "cruiser") {
            enemy.x += enemy.vx;
            enemy.y += enemy.vy * 0.5;

            enemy.fireCooldown--;
            if (enemy.fireCooldown <= 0) {
              enemy.fireCooldown = 110;
              // Triple Shot Burst
              [-0.25, 0, 0.25].forEach((angleOffset) => {
                const angle = Math.atan2(player.y - enemy.y, player.x - enemy.x) + angleOffset;
                engine.bullets.push({
                  id: "eb_" + Math.random(),
                  x: enemy.x,
                  y: enemy.y,
                  vx: Math.cos(angle) * 6,
                  vy: Math.sin(angle) * 6,
                  radius: 6,
                  damage: 24,
                  color: "#f97316",
                  isPlayer: false,
                  life: 0,
                });
              });
            }
          } else if (enemy.type === "boss") {
            // Boss Movement Phase
            if (enemy.y < 120) enemy.y += 1;
            else enemy.x += Math.sin(enemy.behaviorTimer * 0.03) * 3;

            enemy.fireCooldown--;
            if (enemy.fireCooldown <= 0) {
              enemy.fireCooldown = 40;
              // Radial bullet storm
              const count = 12;
              for (let i = 0; i < count; i++) {
                const angle = (Math.PI * 2 * i) / count + enemy.behaviorTimer * 0.05;
                engine.bullets.push({
                  id: "eb_" + Math.random(),
                  x: enemy.x,
                  y: enemy.y + 20,
                  vx: Math.cos(angle) * 5.5,
                  vy: Math.sin(angle) * 5.5,
                  radius: 6,
                  damage: 22,
                  color: "#f43f5e",
                  isPlayer: false,
                  life: 0,
                });
              }
            }
          }

          // Check Player vs Enemy Collision
          const distToPlayer = Math.hypot(enemy.x - player.x, enemy.y - player.y);
          if (distToPlayer < enemy.radius + player.radius && !player.isDashing) {
            const dmg = 25;
            if (player.shield > 0) {
              player.shield = Math.max(0, player.shield - dmg);
            } else {
              player.health = Math.max(0, player.health - dmg);
            }
            engine.screenShake = 12;
            audioSynth.playExplosion(false);

            // Destroy non-boss enemy on ramming
            if (enemy.type !== "boss") {
              enemy.health = 0;
            }
          }
        });

        // ----------------------------------------
        // E. BULLET COLLISION CHECKS
        // ----------------------------------------
        engine.bullets.forEach((bullet) => {
          if (bullet.isPlayer) {
            // Player Bullet hits Enemy
            engine.enemies.forEach((enemy) => {
              const d = Math.hypot(enemy.x - bullet.x, enemy.y - bullet.y);
              if (d < enemy.radius + bullet.radius) {
                enemy.health -= bullet.damage;
                bullet.life = 999; // destroy bullet

                // Hit particles
                for (let p = 0; p < 4; p++) {
                  engine.particles.push({
                    x: bullet.x,
                    y: bullet.y,
                    vx: (Math.random() - 0.5) * 4,
                    vy: (Math.random() - 0.5) * 4,
                    radius: 3,
                    color: bullet.color,
                    alpha: 1,
                    life: 0,
                    maxLife: 15,
                  });
                }
              }
            });
          } else {
            // Enemy Bullet hits Player
            const d = Math.hypot(player.x - bullet.x, player.y - bullet.y);
            if (d < player.radius + bullet.radius && !player.isDashing) {
              bullet.life = 999;
              engine.screenShake = 10;
              if (player.shield > 0) {
                player.shield = Math.max(0, player.shield - bullet.damage);
              } else {
                player.health = Math.max(0, player.health - bullet.damage);
              }
              player.combo = 0;
              setCombo(0);
              audioSynth.playExplosion(false);
            }
          }
        });

        // Filter Dead Enemies & Handle Rewards
        engine.enemies = engine.enemies.filter((enemy) => {
          if (enemy.health <= 0 || enemy.y > H + 100) {
            if (enemy.health <= 0) {
              // Enemy Death Explosion
              const isLarge = enemy.type === "boss" || enemy.type === "cruiser";
              audioSynth.playExplosion(isLarge);
              engine.screenShake = isLarge ? 20 : 8;

              // Increase Score & Combo
              player.score += enemy.scoreValue * (1 + Math.floor(player.combo / 5) * 0.2);
              player.kills++;
              player.combo++;
              if (player.combo > player.maxCombo) player.maxCombo = player.combo;

              setScore(Math.floor(player.score));
              setKills(player.kills);
              setCombo(player.combo);

              // Spawn Explosion Particles
              const count = isLarge ? 40 : 15;
              for (let i = 0; i < count; i++) {
                engine.particles.push({
                  x: enemy.x,
                  y: enemy.y,
                  vx: (Math.random() - 0.5) * 8,
                  vy: (Math.random() - 0.5) * 8,
                  radius: 3 + Math.random() * 4,
                  color: enemy.color,
                  alpha: 1,
                  life: 0,
                  maxLife: 30,
                });
              }

              // Powerup Drop Chance
              if (Math.random() < 0.25 || enemy.type === "boss") {
                const types: ("health" | "shield" | "energy" | "nova_charge")[] = [
                  "health",
                  "shield",
                  "energy",
                  "nova_charge",
                ];
                const pType = types[Math.floor(Math.random() * types.length)];
                engine.powerups.push({
                  id: "p_" + Math.random(),
                  x: enemy.x,
                  y: enemy.y,
                  type: pType,
                  radius: 12,
                  duration: 400,
                });
              }

              if (enemy.type === "boss") {
                engine.bossRef = null;
              }
            }
            return false;
          }
          return true;
        });

        // ----------------------------------------
        // F. POWERUPS PHYSICS & PICKUPS
        // ----------------------------------------
        engine.powerups.forEach((pow) => {
          pow.y += 1.2;
          const d = Math.hypot(player.x - pow.x, player.y - pow.y);
          if (d < player.radius + pow.radius) {
            pow.duration = 0; // collect
            audioSynth.playPowerup();

            if (pow.type === "health") {
              player.health = Math.min(player.maxHealth, player.health + 35);
            } else if (pow.type === "shield") {
              player.shield = Math.min(player.maxShield, player.shield + 40);
            } else if (pow.type === "energy") {
              player.energy = player.maxEnergy;
            } else if (pow.type === "nova_charge") {
              player.novaCooldown = 0;
              setNovaReady(true);
            }

            engine.floatingTexts.push({
              id: "txt_" + Date.now(),
              x: pow.x,
              y: pow.y,
              text: `+ ${pow.type.toUpperCase()}`,
              color: "#10b981",
              alpha: 1,
              vy: -1,
            });
          }
        });
        engine.powerups = engine.powerups.filter((p) => p.y < H + 50 && p.duration > 0);

        // Sync React HUD States
        setPlayerHealth(Math.floor(player.health));
        setPlayerShield(Math.floor(player.shield));
        setPlayerEnergy(Math.floor(player.energy));

        // Game Over Condition
        if (player.health <= 0) {
          setGameState("gameover");
          if (player.score > highScore) {
            setHighScore(Math.floor(player.score));
            if (typeof window !== "undefined") {
              localStorage.setItem("hyperion_void_high_score", Math.floor(player.score).toString());
            }
          }
        }
      }

      // ----------------------------------------
      // G. RENDER CANVAS SCENE
      // ----------------------------------------
      ctx.save();

      // Screen Shake
      if (engine.screenShake > 0) {
        ctx.translate(
          (Math.random() - 0.5) * engine.screenShake,
          (Math.random() - 0.5) * engine.screenShake
        );
        engine.screenShake *= 0.9;
        if (engine.screenShake < 0.2) engine.screenShake = 0;
      }

      // Deep Space Background
      ctx.fillStyle = "#030712";
      ctx.fillRect(0, 0, W, H);

      // Draw Grid / Starfield lines
      ctx.strokeStyle = "rgba(0, 240, 255, 0.05)";
      ctx.lineWidth = 1;
      const gridSize = 60;
      const offsetY = (Date.now() * 0.05) % gridSize;
      for (let x = 0; x < W; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, H);
        ctx.stroke();
      }
      for (let y = offsetY; y < H; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(W, y);
        ctx.stroke();
      }

      // Draw Powerups
      engine.powerups.forEach((pow) => {
        ctx.save();
        ctx.shadowColor = pow.type === "health" ? "#ef4444" : "#00f0ff";
        ctx.shadowBlur = 10;
        ctx.fillStyle = pow.type === "health" ? "#ef4444" : pow.type === "shield" ? "#3b82f6" : "#a855f7";
        ctx.beginPath();
        ctx.arc(pow.x, pow.y, pow.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });

      // Draw Particles
      engine.particles.forEach((pt) => {
        pt.x += pt.vx;
        pt.y += pt.vy;
        pt.life++;
        pt.alpha = Math.max(0, 1 - pt.life / pt.maxLife);

        ctx.fillStyle = pt.color;
        ctx.globalAlpha = pt.alpha;
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, pt.radius, 0, Math.PI * 2);
        ctx.fill();
      });
      engine.particles = engine.particles.filter((p) => p.life < p.maxLife);
      ctx.globalAlpha = 1.0;

      // Draw Bullets
      engine.bullets.forEach((b) => {
        ctx.save();
        ctx.shadowColor = b.color;
        ctx.shadowBlur = 12;
        ctx.fillStyle = b.color;
        ctx.beginPath();
        ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });

      // Draw Enemies
      engine.enemies.forEach((enemy) => {
        ctx.save();
        ctx.shadowColor = enemy.color;
        ctx.shadowBlur = 15;
        ctx.fillStyle = enemy.color;

        if (enemy.type === "scout") {
          // Triangle Ship
          ctx.beginPath();
          ctx.moveTo(enemy.x, enemy.y + enemy.radius);
          ctx.lineTo(enemy.x - enemy.radius, enemy.y - enemy.radius);
          ctx.lineTo(enemy.x + enemy.radius, enemy.y - enemy.radius);
          ctx.closePath();
          ctx.fill();
        } else if (enemy.type === "interceptor") {
          // Diamond Ship
          ctx.beginPath();
          ctx.moveTo(enemy.x, enemy.y + enemy.radius);
          ctx.lineTo(enemy.x + enemy.radius, enemy.y);
          ctx.lineTo(enemy.x, enemy.y - enemy.radius);
          ctx.lineTo(enemy.x - enemy.radius, enemy.y);
          ctx.closePath();
          ctx.fill();
        } else if (enemy.type === "cruiser") {
          // Hexagon Heavy Cruiser
          ctx.beginPath();
          ctx.arc(enemy.x, enemy.y, enemy.radius, 0, Math.PI * 2);
          ctx.fill();
        } else if (enemy.type === "boss") {
          // Dreadnought Starship
          ctx.beginPath();
          ctx.arc(enemy.x, enemy.y, enemy.radius, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = "#ffffff";
          ctx.lineWidth = 4;
          ctx.stroke();
        }

        // Enemy Health Bar
        if (enemy.health < enemy.maxHealth) {
          const barW = enemy.radius * 2;
          const barH = 4;
          ctx.fillStyle = "rgba(0,0,0,0.6)";
          ctx.fillRect(enemy.x - enemy.radius, enemy.y - enemy.radius - 12, barW, barH);
          ctx.fillStyle = "#ef4444";
          ctx.fillRect(
            enemy.x - enemy.radius,
            enemy.y - enemy.radius - 12,
            (enemy.health / enemy.maxHealth) * barW,
            barH
          );
        }

        ctx.restore();
      });

      // Draw Player Ship (Hyperion Interceptor)
      if (gameState === "playing" || gameState === "paused") {
        ctx.save();
        const angle = Math.atan2(engine.mouse.y - player.y, engine.mouse.x - player.x);

        ctx.translate(player.x, player.y);
        ctx.rotate(angle + Math.PI / 2);

        // Engine Trail
        ctx.fillStyle = player.isDashing ? "#00f0ff" : "#38bdf8";
        ctx.beginPath();
        ctx.moveTo(-6, player.radius);
        ctx.lineTo(6, player.radius);
        ctx.lineTo(0, player.radius + 15 + Math.random() * 8);
        ctx.closePath();
        ctx.fill();

        // Ship Body
        ctx.shadowColor = "#00f0ff";
        ctx.shadowBlur = 18;
        ctx.fillStyle = "#0284c7";
        ctx.beginPath();
        ctx.moveTo(0, -player.radius - 4);
        ctx.lineTo(player.radius + 4, player.radius);
        ctx.lineTo(0, player.radius - 4);
        ctx.lineTo(-player.radius - 4, player.radius);
        ctx.closePath();
        ctx.fill();

        // Cockpit
        ctx.fillStyle = "#38bdf8";
        ctx.beginPath();
        ctx.arc(0, -2, 6, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();

        // Shield Aura
        if (player.shield > 0) {
          ctx.save();
          ctx.strokeStyle = "rgba(0, 240, 255, " + (player.shield / player.maxShield) * 0.6 + ")";
          ctx.lineWidth = 3;
          ctx.shadowColor = "#00f0ff";
          ctx.shadowBlur = 10;
          ctx.beginPath();
          ctx.arc(player.x, player.y, player.radius + 10, 0, Math.PI * 2);
          ctx.stroke();
          ctx.restore();
        }
      }

      // Draw Floating Texts
      engine.floatingTexts.forEach((ft) => {
        ft.y += ft.vy;
        ft.alpha -= 0.015;

        ctx.save();
        ctx.font = "bold 16px sans-serif";
        ctx.fillStyle = ft.color;
        ctx.globalAlpha = Math.max(0, ft.alpha);
        ctx.fillText(ft.text, ft.x, ft.y);
        ctx.restore();
      });
      engine.floatingTexts = engine.floatingTexts.filter((t) => t.alpha > 0);

      ctx.restore();

      animationFrameId = requestAnimationFrame(renderLoop);
    };

    renderLoop();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [gameState, wave, fireWeapon, spawnEnemy]);

  return (
    <div className="relative w-full h-screen bg-slate-950 text-white font-sans overflow-hidden select-none">
      {/* Background Canvas */}
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full block z-0 cursor-crosshair" />

      {/* TOP HEADER OVERLAY */}
      <div className="absolute top-0 left-0 right-0 z-10 p-4 bg-gradient-to-b from-slate-950/90 to-transparent backdrop-blur-sm flex items-center justify-between pointer-events-auto">
        <div className="flex items-center space-x-4">
          <Link
            href="/games"
            className="flex items-center space-x-2 text-slate-400 hover:text-cyan-400 transition-colors bg-slate-900/80 px-3 py-1.5 rounded-lg border border-slate-800"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-xs font-semibold uppercase tracking-wider">Back</span>
          </Link>
          <div className="flex items-center space-x-2">
            <Cpu className="w-5 h-5 text-cyan-400 animate-pulse" />
            <span className="font-bold text-lg tracking-wider bg-gradient-to-r from-cyan-400 to-purple-500 bg-clip-text text-transparent">
              HYPERION VOID SURGE
            </span>
          </div>
        </div>

        {/* Top Status & Controls */}
        <div className="flex items-center space-x-6">
          <div className="flex items-center space-x-2 bg-slate-900/80 px-4 py-1.5 rounded-lg border border-slate-800">
            <Trophy className="w-4 h-4 text-amber-400" />
            <span className="text-xs text-slate-400 font-semibold">HIGH SCORE:</span>
            <span className="text-sm font-bold text-amber-400">{highScore.toLocaleString()}</span>
          </div>

          <button
            onClick={() => setSoundOn(!soundOn)}
            className="p-2 rounded-lg bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-cyan-400 border border-slate-800 transition-all"
            title="Toggle Sound"
          >
            {soundOn ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5 text-red-400" />}
          </button>
        </div>
      </div>

      {/* GAMEPLAY HUD OVERLAY (Visible when playing/paused) */}
      {(gameState === "playing" || gameState === "paused") && (
        <div className="absolute inset-0 z-10 pointer-events-none flex flex-col justify-between p-6 pt-20">
          {/* Top HUD: Boss Health Bar & Wave Info */}
          <div className="flex flex-col items-center space-y-3">
            {bossHealthPercent !== null && (
              <div className="w-full max-w-md bg-slate-900/90 p-3 rounded-xl border border-red-500/40 shadow-lg shadow-red-950/50 backdrop-blur-md animate-pulse">
                <div className="flex justify-between items-center mb-1 text-xs font-bold text-red-400 tracking-wider">
                  <span>DREADNOUGHT OVERLORD</span>
                  <span>{Math.floor(bossHealthPercent)}%</span>
                </div>
                <div className="w-full bg-slate-950 h-3 rounded-full overflow-hidden border border-red-900">
                  <div
                    className="bg-gradient-to-r from-red-600 to-rose-400 h-full transition-all duration-150"
                    style={{ width: `${bossHealthPercent}%` }}
                  />
                </div>
              </div>
            )}

            <div className="flex items-center space-x-6 bg-slate-900/80 px-6 py-2 rounded-full border border-slate-800 backdrop-blur-md">
              <div>
                <span className="text-xs text-slate-400 uppercase tracking-widest font-semibold">WAVE</span>
                <p className="text-xl font-extrabold text-cyan-400 text-center">{wave}</p>
              </div>
              <div className="h-6 w-px bg-slate-800" />
              <div>
                <span className="text-xs text-slate-400 uppercase tracking-widest font-semibold">SCORE</span>
                <p className="text-xl font-extrabold text-purple-400">{score.toLocaleString()}</p>
              </div>
              <div className="h-6 w-px bg-slate-800" />
              <div>
                <span className="text-xs text-slate-400 uppercase tracking-widest font-semibold">COMBO</span>
                <p className="text-xl font-extrabold text-amber-400">{combo}x</p>
              </div>
            </div>
          </div>

          {/* Bottom HUD: Status Bars & Weapon Selector */}
          <div className="flex justify-between items-end pointer-events-auto">
            {/* Player Stats Bars */}
            <div className="w-64 space-y-2.5 bg-slate-900/80 p-4 rounded-xl border border-slate-800 backdrop-blur-md">
              {/* Health */}
              <div>
                <div className="flex justify-between text-xs font-bold mb-1">
                  <span className="text-rose-400 flex items-center gap-1">
                    <Activity className="w-3.5 h-3.5" /> HULL HEALTH
                  </span>
                  <span className="text-rose-400">{playerHealth}%</span>
                </div>
                <div className="w-full bg-slate-950 h-2.5 rounded-full overflow-hidden border border-rose-950">
                  <div
                    className="bg-gradient-to-r from-rose-600 to-red-400 h-full transition-all"
                    style={{ width: `${playerHealth}%` }}
                  />
                </div>
              </div>

              {/* Shield */}
              <div>
                <div className="flex justify-between text-xs font-bold mb-1">
                  <span className="text-cyan-400 flex items-center gap-1">
                    <Shield className="w-3.5 h-3.5" /> VOID SHIELD
                  </span>
                  <span className="text-cyan-400">{playerShield}%</span>
                </div>
                <div className="w-full bg-slate-950 h-2.5 rounded-full overflow-hidden border border-cyan-950">
                  <div
                    className="bg-gradient-to-r from-cyan-600 to-blue-400 h-full transition-all"
                    style={{ width: `${playerShield}%` }}
                  />
                </div>
              </div>

              {/* Energy */}
              <div>
                <div className="flex justify-between text-xs font-bold mb-1">
                  <span className="text-purple-400 flex items-center gap-1">
                    <Zap className="w-3.5 h-3.5" /> ENERGY MATRIX
                  </span>
                  <span className="text-purple-400">{playerEnergy}%</span>
                </div>
                <div className="w-full bg-slate-950 h-2.5 rounded-full overflow-hidden border border-purple-950">
                  <div
                    className="bg-gradient-to-r from-purple-600 to-indigo-400 h-full transition-all"
                    style={{ width: `${playerEnergy}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Weapon Selector HUD */}
            <div className="flex items-center space-x-2 bg-slate-900/80 p-2 rounded-xl border border-slate-800 backdrop-blur-md">
              {(Object.keys(WEAPON_TYPES) as WeaponType[]).map((wKey, idx) => {
                const w = WEAPON_TYPES[wKey];
                const isSelected = selectedWeapon === wKey;
                return (
                  <button
                    key={wKey}
                    onClick={() => setSelectedWeapon(wKey)}
                    className={`relative p-3 rounded-lg border flex flex-col items-center space-y-1 transition-all ${
                      isSelected
                        ? "bg-slate-800 border-cyan-400 text-cyan-400 shadow-lg shadow-cyan-950/50"
                        : "bg-slate-950/50 border-slate-800 text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    <span className="text-[10px] font-extrabold text-slate-500 absolute top-1 left-1">
                      {idx + 1}
                    </span>
                    <Target className="w-5 h-5 mt-1" style={{ color: isSelected ? w.color : undefined }} />
                    <span className="text-[10px] font-bold tracking-tight">{w.name.split(" ")[0]}</span>
                  </button>
                );
              })}
            </div>

            {/* Special Ability Button (Nova EMP) */}
            <button
              onClick={triggerNova}
              disabled={!novaReady}
              className={`p-4 rounded-xl border flex flex-col items-center justify-center space-y-1 transition-all ${
                novaReady
                  ? "bg-gradient-to-br from-purple-600 to-indigo-700 border-purple-400 text-white shadow-lg shadow-purple-950/80 hover:scale-105 active:scale-95"
                  : "bg-slate-900/60 border-slate-800 text-slate-600 cursor-not-allowed"
              }`}
            >
              <Sparkles className={`w-6 h-6 ${novaReady ? "animate-spin" : ""}`} />
              <span className="text-[10px] font-extrabold tracking-widest uppercase">GRAVITON NOVA</span>
              <span className="text-[9px] text-purple-200 font-semibold">[SPACE / E]</span>
            </button>
          </div>
        </div>
      )}

      {/* START MENU OVERLAY */}
      {gameState === "menu" && (
        <div className="absolute inset-0 z-20 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-6">
          <div className="max-w-xl w-full bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl text-center space-y-6">
            <div className="inline-flex p-4 rounded-2xl bg-cyan-950/50 border border-cyan-500/30 text-cyan-400 mb-2">
              <Radio className="w-12 h-12 animate-pulse" />
            </div>

            <div className="space-y-2">
              <h1 className="text-4xl font-extrabold tracking-wider bg-gradient-to-r from-cyan-400 via-purple-400 to-rose-400 bg-clip-text text-transparent">
                HYPERION VOID SURGE
              </h1>
              <p className="text-sm text-slate-400">
                Command the hyperion void interceptor. Wipe out invading alien armadas and master the matrix energy grid.
              </p>
            </div>

            {/* Control Instructions */}
            <div className="grid grid-cols-2 gap-3 text-left text-xs bg-slate-950 p-4 rounded-xl border border-slate-800">
              <div className="space-y-1">
                <span className="text-slate-400 font-semibold">MOVEMENT:</span>
                <p className="font-bold text-cyan-300">W, A, S, D / Arrow Keys</p>
              </div>
              <div className="space-y-1">
                <span className="text-slate-400 font-semibold">AIM & FIRE:</span>
                <p className="font-bold text-cyan-300">Mouse Move + Left Click</p>
              </div>
              <div className="space-y-1">
                <span className="text-slate-400 font-semibold">GRAVITON NOVA:</span>
                <p className="font-bold text-purple-300">Spacebar / E Key</p>
              </div>
              <div className="space-y-1">
                <span className="text-slate-400 font-semibold">HYPER DASH:</span>
                <p className="font-bold text-amber-300">Shift Key</p>
              </div>
            </div>

            <button
              onClick={startNewGame}
              className="w-full py-4 rounded-xl font-extrabold tracking-widest text-lg uppercase bg-gradient-to-r from-cyan-500 via-purple-600 to-rose-600 hover:from-cyan-400 hover:to-rose-500 text-white shadow-xl shadow-cyan-950/50 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center space-x-2"
            >
              <Play className="w-5 h-5 fill-current" />
              <span>LAUNCH INTERCEPTOR</span>
            </button>
          </div>
        </div>
      )}

      {/* PAUSE MENU OVERLAY */}
      {gameState === "paused" && (
        <div className="absolute inset-0 z-30 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl text-center space-y-6">
            <h2 className="text-2xl font-extrabold tracking-widest text-cyan-400">GAME PAUSED</h2>

            <div className="space-y-3">
              <button
                onClick={() => setGameState("playing")}
                className="w-full py-3 rounded-xl font-bold bg-cyan-600 hover:bg-cyan-500 text-white transition-all"
              >
                RESUME COMBAT
              </button>

              <button
                onClick={startNewGame}
                className="w-full py-3 rounded-xl font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 transition-all"
              >
                RESTART MISSION
              </button>

              <button
                onClick={() => setGameState("menu")}
                className="w-full py-3 rounded-xl font-bold bg-slate-950 hover:bg-slate-900 text-slate-400 border border-slate-800 transition-all"
              >
                QUIT TO MENU
              </button>
            </div>
          </div>
        </div>
      )}

      {/* GAME OVER OVERLAY */}
      {gameState === "gameover" && (
        <div className="absolute inset-0 z-30 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-slate-900 border border-rose-500/30 rounded-2xl p-8 shadow-2xl text-center space-y-6 animate-in fade-in zoom-in duration-200">
            <div className="inline-flex p-3 rounded-full bg-rose-950/60 border border-rose-500/40 text-rose-500 mb-1">
              <Activity className="w-10 h-10" />
            </div>

            <div className="space-y-1">
              <h2 className="text-3xl font-extrabold tracking-widest text-rose-500">INTERCEPTOR DESTROYED</h2>
              <p className="text-xs text-slate-400 uppercase tracking-widest">MISSION SUMMARY</p>
            </div>

            {/* Score Breakdown */}
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3 text-sm">
              <div className="flex justify-between items-center text-slate-400">
                <span>FINAL SCORE:</span>
                <span className="font-extrabold text-cyan-400 text-lg">{score.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center text-slate-400">
                <span>WAVES COMPLETED:</span>
                <span className="font-bold text-white">{wave}</span>
              </div>
              <div className="flex justify-between items-center text-slate-400">
                <span>HOSTILES ELIMINATED:</span>
                <span className="font-bold text-purple-400">{kills}</span>
              </div>
              <div className="flex justify-between items-center text-slate-400">
                <span>MAX COMBO:</span>
                <span className="font-bold text-amber-400">{engineRef.current.player.maxCombo}x</span>
              </div>
            </div>

            <button
              onClick={startNewGame}
              className="w-full py-3.5 rounded-xl font-extrabold tracking-widest uppercase bg-gradient-to-r from-rose-600 to-cyan-600 hover:from-rose-500 hover:to-cyan-500 text-white transition-all shadow-lg flex items-center justify-center space-x-2"
            >
              <RotateCcw className="w-5 h-5" />
              <span>TRY AGAIN</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
