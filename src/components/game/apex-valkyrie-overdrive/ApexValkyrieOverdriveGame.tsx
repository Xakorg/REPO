"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Shield,
  Zap,
  Crosshair,
  RotateCcw,
  Play,
  Volume2,
  VolumeX,
  Trophy,
  Sparkles,
  Rocket,
  Swords,
  Award,
  ArrowLeft,
  Pause,
  Flame,
  ChevronRight,
  Target,
  Cpu,
  Radio,
  Sliders,
  Maximize2,
  Activity,
  Layers,
  ZapOff,
  FastForward,
  ShoppingBag,
  CheckCircle2,
  BarChart2
} from "lucide-react";
import Link from "next/link";

// ============================================================================
// 1. WEB AUDIO SYNTHESIZER SFX ENGINE (Zero External Asset Dependency)
// ============================================================================
class ValkyrieAudioEngine {
  private ctx: AudioContext | null = null;
  public muted: boolean = false;

  private initCtx() {
    if (!this.ctx && typeof window !== "undefined") {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContextClass) {
        this.ctx = new AudioContextClass();
      }
    }
    if (this.ctx && this.ctx.state === "suspended") {
      this.ctx.resume();
    }
  }

  public toggleMute(): boolean {
    this.muted = !this.muted;
    return this.muted;
  }

  public playLaser(pitch: number = 1.0) {
    if (this.muted) return;
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(880 * pitch, now);
    osc.frequency.exponentialRampToValueAtTime(110 * pitch, now + 0.12);

    gain.gain.setValueAtTime(0.18, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.12);
  }

  public playHeavyCannon() {
    if (this.muted) return;
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = "square";
    osc.frequency.setValueAtTime(220, now);
    osc.frequency.exponentialRampToValueAtTime(40, now + 0.25);

    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.25);
  }

  public playEmpShockwave() {
    if (this.muted) return;
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(150, now);
    osc.frequency.exponentialRampToValueAtTime(1200, now + 0.4);

    gain.gain.setValueAtTime(0.4, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.45);
  }

  public playExplosion(isLarge: boolean = false) {
    if (this.muted) return;
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const duration = isLarge ? 0.6 : 0.3;
    const bufferSize = this.ctx.sampleRate * duration;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = buffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }

    const whiteNoise = this.ctx.createBufferSource();
    whiteNoise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(isLarge ? 400 : 800, now);
    filter.frequency.exponentialRampToValueAtTime(30, now + duration);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(isLarge ? 0.5 : 0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    whiteNoise.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);

    whiteNoise.start(now);
    whiteNoise.stop(now + duration);
  }

  public playPowerup() {
    if (this.muted) return;
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const notes = [440, 554.37, 659.25, 880];
    notes.forEach((freq, idx) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(freq, now + idx * 0.06);

      gain.gain.setValueAtTime(0.2, now + idx * 0.06);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.06 + 0.15);

      osc.connect(gain);
      gain.connect(this.ctx!.destination);

      osc.start(now + idx * 0.06);
      osc.stop(now + idx * 0.06 + 0.15);
    });
  }

  public playShieldHit() {
    if (this.muted) return;
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(600, now);
    osc.frequency.exponentialRampToValueAtTime(150, now + 0.15);

    gain.gain.setValueAtTime(0.25, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.15);
  }

  public playTachyonShift() {
    if (this.muted) return;
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(300, now);
    osc.frequency.linearRampToValueAtTime(1500, now + 0.35);

    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.35);
  }

  public playBossWarning() {
    if (this.muted) return;
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    for (let i = 0; i < 3; i++) {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(180, now + i * 0.25);
      osc.frequency.exponentialRampToValueAtTime(90, now + i * 0.25 + 0.2);

      gain.gain.setValueAtTime(0.35, now + i * 0.25);
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.25 + 0.2);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now + i * 0.25);
      osc.stop(now + i * 0.25 + 0.2);
    }
  }
}

const audio = new ValkyrieAudioEngine();

// ============================================================================
// 2. DATA TYPES & INTERFACES
// ============================================================================
interface Upgrades {
  damageLevel: number;
  fireRateLevel: number;
  shieldLevel: number;
  empLevel: number;
  tachyonLevel: number;
}

interface PlayerShip {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  angle: number;
  hp: number;
  maxHp: number;
  shield: number;
  maxShield: number;
  empCooldown: number;
  empMaxCooldown: number;
  tachyonActiveTimer: number;
  tachyonCooldown: number;
  tachyonMaxCooldown: number;
  invulnerableTimer: number;
}

interface Bullet {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
  isEnemy: boolean;
  damage: number;
  life: number;
}

interface Enemy {
  id: string;
  type: "scout" | "cruiser" | "stalker" | "boss";
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  hp: number;
  maxHp: number;
  color: string;
  shootTimer: number;
  phase?: number;
  behaviorTimer: number;
  targetX?: number;
  targetY?: number;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
  alpha: number;
  decay: number;
}

interface Shockwave {
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  color: string;
  alpha: number;
}

interface Powerup {
  id: string;
  x: number;
  y: number;
  type: "health" | "shield" | "emp" | "multiplier" | "core";
  radius: number;
  duration: number;
}

interface HighScoreRecord {
  score: number;
  wave: number;
  date: string;
}

// ============================================================================
// 3. MAIN REACT COMPONENT
// ============================================================================
export default function ApexValkyrieOverdriveGame() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Game States
  const [gameState, setGameState] = useState<"menu" | "playing" | "paused" | "hangar" | "gameover">("menu");
  const [score, setScore] = useState<number>(0);
  const [highScore, setHighScore] = useState<number>(0);
  const [wave, setWave] = useState<number>(1);
  const [quantumCores, setQuantumCores] = useState<number>(0);
  const [totalKills, setTotalKills] = useState<number>(0);
  const [multiplier, setMultiplier] = useState<number>(1);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [bossActive, setBossActive] = useState<boolean>(false);
  const [bossHpPercentage, setBossHpPercentage] = useState<number>(100);

  // HUD & Cooldown States for UI binding
  const [playerHp, setPlayerHp] = useState<number>(100);
  const [playerMaxHp, setPlayerMaxHp] = useState<number>(100);
  const [playerShield, setPlayerShield] = useState<number>(50);
  const [playerMaxShield, setPlayerMaxShield] = useState<number>(50);
  const [empCdPercent, setEmpCdPercent] = useState<number>(100);
  const [tachyonCdPercent, setTachyonCdPercent] = useState<number>(100);
  const [tachyonActive, setTachyonActive] = useState<boolean>(false);

  // Upgrades State
  const [upgrades, setUpgrades] = useState<Upgrades>({
    damageLevel: 1,
    fireRateLevel: 1,
    shieldLevel: 1,
    empLevel: 1,
    tachyonLevel: 1,
  });

  // Game Loop References
  const keysRef = useRef<{ [key: string]: boolean }>({});
  const mouseRef = useRef<{ x: number; y: number; isDown: boolean }>({ x: 0, y: 0, isDown: false });
  const animFrameIdRef = useRef<number | null>(null);

  // Entities stored in ref for 60fps performance
  const playerRef = useRef<PlayerShip>({
    x: 400,
    y: 600,
    vx: 0,
    vy: 0,
    radius: 18,
    angle: -Math.PI / 2,
    hp: 100,
    maxHp: 100,
    shield: 50,
    maxShield: 50,
    empCooldown: 0,
    empMaxCooldown: 400,
    tachyonActiveTimer: 0,
    tachyonCooldown: 0,
    tachyonMaxCooldown: 600,
    invulnerableTimer: 0,
  });

  const bulletsRef = useRef<Bullet[]>([]);
  const enemiesRef = useRef<Enemy[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const shockwavesRef = useRef<Shockwave[]>([]);
  const powerupsRef = useRef<Powerup[]>([]);
  const starsRef = useRef<{ x: number; y: number; size: number; speed: number; opacity: number }[]>([]);

  // Wave spawn ref
  const waveEnemyCountRef = useRef<number>(0);
  const enemiesSpawnedThisWaveRef = useRef<number>(0);
  const spawnTimerRef = useRef<number>(0);
  const scoreRef = useRef<number>(0);
  const coresRef = useRef<number>(0);
  const killsRef = useRef<number>(0);
  const waveRef = useRef<number>(1);
  const lastShotTimeRef = useRef<number>(0);

  // Load persisted stats on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedScore = localStorage.getItem("apex_valkyrie_high_score");
      if (savedScore) setHighScore(parseInt(savedScore, 10));

      const savedCores = localStorage.getItem("apex_valkyrie_quantum_cores");
      if (savedCores) {
        const parsed = parseInt(savedCores, 10);
        setQuantumCores(parsed);
        coresRef.current = parsed;
      }

      const savedUpgrades = localStorage.getItem("apex_valkyrie_upgrades");
      if (savedUpgrades) {
        try {
          setUpgrades(JSON.parse(savedUpgrades));
        } catch (e) {
          console.error("Failed to parse saved upgrades", e);
        }
      }
    }
  }, []);

  // Save upgrades when changed
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("apex_valkyrie_upgrades", JSON.stringify(upgrades));
    }
  }, [upgrades]);

  // Handle Audio Toggle
  const toggleAudio = () => {
    const muted = audio.toggleMute();
    setIsMuted(muted);
  };

  // Upgrades Pricing Logic
  const getUpgradeCost = (level: number) => level * 150;

  const buyUpgrade = (key: keyof Upgrades) => {
    const cost = getUpgradeCost(upgrades[key]);
    if (quantumCores >= cost && upgrades[key] < 5) {
      const newCores = quantumCores - cost;
      setQuantumCores(newCores);
      coresRef.current = newCores;
      localStorage.setItem("apex_valkyrie_quantum_cores", newCores.toString());

      setUpgrades((prev) => ({
        ...prev,
        [key]: prev[key] + 1,
      }));
      audio.playPowerup();
    }
  };

  // Initialize Starfield
  const initStars = (width: number, height: number) => {
    const stars = [];
    for (let i = 0; i < 120; i++) {
      stars.push({
        x: Math.random() * width,
        y: Math.random() * height,
        size: Math.random() * 2.2 + 0.5,
        speed: Math.random() * 1.5 + 0.3,
        opacity: Math.random() * 0.8 + 0.2,
      });
    }
    starsRef.current = stars;
  };

  // Start / Reset Game Session
  const startGame = () => {
    const canvas = canvasRef.current;
    const width = canvas ? canvas.width : 900;
    const height = canvas ? canvas.height : 700;

    // Apply upgrade modifiers to player base stats
    const maxH = 100 + (upgrades.shieldLevel - 1) * 25;
    const maxS = 50 + (upgrades.shieldLevel - 1) * 30;
    const empMaxCd = Math.max(200, 400 - (upgrades.empLevel - 1) * 50);
    const tachyonMaxCd = Math.max(350, 600 - (upgrades.tachyonLevel - 1) * 60);

    playerRef.current = {
      x: width / 2,
      y: height - 100,
      vx: 0,
      vy: 0,
      radius: 18,
      angle: -Math.PI / 2,
      hp: maxH,
      maxHp: maxH,
      shield: maxS,
      maxShield: maxS,
      empCooldown: 0,
      empMaxCooldown: empMaxCd,
      tachyonActiveTimer: 0,
      tachyonCooldown: 0,
      tachyonMaxCooldown: tachyonMaxCd,
      invulnerableTimer: 60,
    };

    bulletsRef.current = [];
    enemiesRef.current = [];
    particlesRef.current = [];
    shockwavesRef.current = [];
    powerupsRef.current = [];
    initStars(width, height);

    scoreRef.current = 0;
    killsRef.current = 0;
    waveRef.current = 1;
    waveEnemyCountRef.current = 12;
    enemiesSpawnedThisWaveRef.current = 0;
    spawnTimerRef.current = 0;

    setScore(0);
    setWave(1);
    setTotalKills(0);
    setMultiplier(1);
    setBossActive(false);
    setBossHpPercentage(100);

    setGameState("playing");
  };

  // Keyboard and Mouse Event Listeners
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      keysRef.current[e.code] = true;

      // Special Ability Shortcuts
      if (gameState === "playing") {
        if (e.code === "KeyQ" || e.code === "ShiftLeft") {
          triggerEmpShockwave();
        }
        if (e.code === "KeyE" || e.code === "Space") {
          triggerTachyonShift();
        }
        if (e.code === "KeyP" || e.code === "Escape") {
          setGameState((prev) => (prev === "playing" ? "paused" : "playing"));
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      keysRef.current[e.code] = false;
    };

    const handleMouseMove = (e: MouseEvent) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      mouseRef.current.x = e.clientX - rect.left;
      mouseRef.current.y = e.clientY - rect.top;
    };

    const handleMouseDown = () => {
      mouseRef.current.isDown = true;
    };

    const handleMouseUp = () => {
      mouseRef.current.isDown = false;
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
  }, [gameState, upgrades]);

  // Ability 1: EMP Shockwave
  const triggerEmpShockwave = () => {
    const player = playerRef.current;
    if (player.empCooldown <= 0) {
      player.empCooldown = player.empMaxCooldown;
      audio.playEmpShockwave();

      // Create expanding shockwave
      shockwavesRef.current.push({
        x: player.x,
        y: player.y,
        radius: 10,
        maxRadius: 280 + upgrades.empLevel * 30,
        color: "#00f0ff",
        alpha: 1.0,
      });

      // Clear enemy bullets in radius
      bulletsRef.current = bulletsRef.current.filter((b) => {
        if (!b.isEnemy) return true;
        const dist = Math.hypot(b.x - player.x, b.y - player.y);
        return dist > 320;
      });

      // Damage nearby enemies
      enemiesRef.current.forEach((enemy) => {
        const dist = Math.hypot(enemy.x - player.x, enemy.y - player.y);
        if (dist <= 320) {
          enemy.hp -= 40 + upgrades.empLevel * 15;
          // Spawn sparks
          createSparks(enemy.x, enemy.y, "#00f0ff", 8);
        }
      });
    }
  };

  // Ability 2: Tachyon Shift
  const triggerTachyonShift = () => {
    const player = playerRef.current;
    if (player.tachyonCooldown <= 0) {
      player.tachyonCooldown = player.tachyonMaxCooldown;
      player.tachyonActiveTimer = 240 + upgrades.tachyonLevel * 30; // ~4-5 seconds
      audio.playTachyonShift();

      // Create visual pulse particles
      createSparks(player.x, player.y, "#ff007f", 24);
    }
  };

  // Spark / Debris Particle Helper
  const createSparks = (x: number, y: number, color: string, count: number) => {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 4 + 1;
      particlesRef.current.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        radius: Math.random() * 2.5 + 1,
        color,
        alpha: 1.0,
        decay: Math.random() * 0.03 + 0.015,
      });
    }
  };

  // Spawn Enemy Logic
  const spawnEnemy = (canvasWidth: number) => {
    const currentWave = waveRef.current;
    const isBossWave = currentWave % 5 === 0;

    if (isBossWave && !bossActive && enemiesSpawnedThisWaveRef.current === 0) {
      // Spawn Boss Titan
      audio.playBossWarning();
      setBossActive(true);
      enemiesRef.current.push({
        id: "boss_" + Date.now(),
        type: "boss",
        x: canvasWidth / 2,
        y: -100,
        vx: 1.5,
        vy: 0.8,
        radius: 55,
        hp: 600 + currentWave * 200,
        maxHp: 600 + currentWave * 200,
        color: "#ff0055",
        shootTimer: 0,
        phase: 1,
        behaviorTimer: 0,
        targetX: canvasWidth / 2,
        targetY: 150,
      });
      enemiesSpawnedThisWaveRef.current += 1;
      return;
    }

    if (isBossWave) return;

    // Normal Enemy Spawns: scout, cruiser, stalker
    const rand = Math.random();
    let type: "scout" | "cruiser" | "stalker" = "scout";
    let color = "#39ff14";
    let hp = 20 + currentWave * 5;
    let radius = 16;
    let vy = Math.random() * 1.8 + 1.2;

    if (rand > 0.6) {
      type = "cruiser";
      color = "#ffaa00";
      hp = 55 + currentWave * 10;
      radius = 24;
      vy = Math.random() * 1.2 + 0.8;
    } else if (rand > 0.35) {
      type = "stalker";
      color = "#b026ff";
      hp = 35 + currentWave * 8;
      radius = 18;
      vy = Math.random() * 2.2 + 1.5;
    }

    const spawnX = Math.random() * (canvasWidth - 80) + 40;
    enemiesRef.current.push({
      id: "enemy_" + Date.now() + "_" + Math.random(),
      type,
      x: spawnX,
      y: -30,
      vx: (Math.random() - 0.5) * 1.5,
      vy,
      radius,
      hp,
      maxHp: hp,
      color,
      shootTimer: Math.random() * 60,
      behaviorTimer: 0,
    });

    enemiesSpawnedThisWaveRef.current += 1;
  };

  // Main Canvas Render & Physics Loop
  useEffect(() => {
    if (gameState !== "playing") return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;

    const gameLoop = () => {
      const width = canvas.width;
      const height = canvas.height;
      const player = playerRef.current;

      // ----------------------------------------------------------------------
      // 1. UPDATE PLAYER MOVEMENT & ABILITIES
      // ----------------------------------------------------------------------
      const speed = (player.tachyonActiveTimer > 0 ? 7.5 : 5.2) + (upgrades.fireRateLevel > 3 ? 1 : 0);
      let dx = 0;
      let dy = 0;

      if (keysRef.current["KeyA"] || keysRef.current["ArrowLeft"]) dx -= 1;
      if (keysRef.current["KeyD"] || keysRef.current["ArrowRight"]) dx += 1;
      if (keysRef.current["KeyW"] || keysRef.current["ArrowUp"]) dy -= 1;
      if (keysRef.current["KeyS"] || keysRef.current["ArrowDown"]) dy += 1;

      // Normalize diagonal speed
      if (dx !== 0 && dy !== 0) {
        dx *= 0.7071;
        dy *= 0.7071;
      }

      player.x += dx * speed;
      player.y += dy * speed;

      // Clamp player within boundaries
      player.x = Math.max(player.radius, Math.min(width - player.radius, player.x));
      player.y = Math.max(player.radius, Math.min(height - player.radius, player.y));

      // Aiming towards mouse cursor
      player.angle = Math.atan2(mouseRef.current.y - player.y, mouseRef.current.x - player.x);

      // Decrement Cooldowns
      if (player.empCooldown > 0) player.empCooldown--;
      if (player.tachyonCooldown > 0) player.tachyonCooldown--;
      if (player.tachyonActiveTimer > 0) player.tachyonActiveTimer--;
      if (player.invulnerableTimer > 0) player.invulnerableTimer--;

      // Shield Regeneration (slow tick when not taking hit)
      if (player.shield < player.maxShield && Math.random() < 0.05) {
        player.shield = Math.min(player.maxShield, player.shield + 1);
      }

      // UI Cooldown Binding
      setPlayerHp(player.hp);
      setPlayerMaxHp(player.maxHp);
      setPlayerShield(player.shield);
      setPlayerMaxShield(player.maxShield);
      setEmpCdPercent(Math.max(0, 100 - (player.empCooldown / player.empMaxCooldown) * 100));
      setTachyonCdPercent(Math.max(0, 100 - (player.tachyonCooldown / player.tachyonMaxCooldown) * 100));
      setTachyonActive(player.tachyonActiveTimer > 0);

      // Fire Primary Weapon
      const fireInterval = Math.max(7, 18 - upgrades.fireRateLevel * 2 - (player.tachyonActiveTimer > 0 ? 4 : 0));
      if ((mouseRef.current.isDown || keysRef.current["Space"]) && Date.now() - lastShotTimeRef.current > fireInterval * 16) {
        lastShotTimeRef.current = Date.now();
        audio.playLaser(1 + (upgrades.damageLevel - 1) * 0.1);

        const damage = 14 + upgrades.damageLevel * 6;
        const bSpeed = 11;
        const mainAngle = player.angle;

        // Multi-stream shooting based on damage upgrade level
        if (upgrades.damageLevel >= 3) {
          // Triple Spread
          [-0.18, 0, 0.18].forEach((offsetAngle) => {
            bulletsRef.current.push({
              x: player.x + Math.cos(mainAngle) * 20,
              y: player.y + Math.sin(mainAngle) * 20,
              vx: Math.cos(mainAngle + offsetAngle) * bSpeed,
              vy: Math.sin(mainAngle + offsetAngle) * bSpeed,
              radius: 4,
              color: "#00ffff",
              isEnemy: false,
              damage,
              life: 100,
            });
          });
        } else {
          // Dual Stream
          [-0.08, 0.08].forEach((offsetAngle) => {
            bulletsRef.current.push({
              x: player.x + Math.cos(mainAngle) * 20,
              y: player.y + Math.sin(mainAngle) * 20,
              vx: Math.cos(mainAngle + offsetAngle) * bSpeed,
              vy: Math.sin(mainAngle + offsetAngle) * bSpeed,
              radius: 3.5,
              color: "#00f0ff",
              isEnemy: false,
              damage,
              life: 100,
            });
          });
        }

        // Thruster Particle
        particlesRef.current.push({
          x: player.x - Math.cos(mainAngle) * 18,
          y: player.y - Math.sin(mainAngle) * 18,
          vx: -Math.cos(mainAngle) * 3 + (Math.random() - 0.5),
          vy: -Math.sin(mainAngle) * 3 + (Math.random() - 0.5),
          radius: 3,
          color: player.tachyonActiveTimer > 0 ? "#ff007f" : "#00f0ff",
          alpha: 1,
          decay: 0.05,
        });
      }

      // ----------------------------------------------------------------------
      // 2. WAVE & ENEMY SPAWNING MANAGER
      // ----------------------------------------------------------------------
      spawnTimerRef.current++;
      const currentWave = waveRef.current;
      const isBossWave = currentWave % 5 === 0;

      if (!isBossWave && enemiesSpawnedThisWaveRef.current < waveEnemyCountRef.current) {
        if (spawnTimerRef.current % Math.max(30, 90 - currentWave * 5) === 0) {
          spawnEnemy(width);
        }
      } else if (enemiesRef.current.length === 0 && enemiesSpawnedThisWaveRef.current >= waveEnemyCountRef.current && !bossActive) {
        // Wave Cleared! Next Wave
        waveRef.current += 1;
        setWave(waveRef.current);
        waveEnemyCountRef.current = 12 + waveRef.current * 4;
        enemiesSpawnedThisWaveRef.current = 0;
        audio.playPowerup();

        // Wave Reward Cores
        const bonusCores = 25 + waveRef.current * 10;
        coresRef.current += bonusCores;
        setQuantumCores(coresRef.current);
        localStorage.setItem("apex_valkyrie_quantum_cores", coresRef.current.toString());
      }

      // ----------------------------------------------------------------------
      // 3. UPDATE BULLETS
      // ----------------------------------------------------------------------
      bulletsRef.current.forEach((b) => {
        b.x += b.vx;
        b.y += b.vy;
        b.life--;
      });

      // Filter out-of-bounds or dead bullets
      bulletsRef.current = bulletsRef.current.filter(
        (b) => b.x >= -50 && b.x <= width + 50 && b.y >= -50 && b.y <= height + 50 && b.life > 0
      );

      // ----------------------------------------------------------------------
      // 4. UPDATE ENEMIES & ENEMY AI
      // ----------------------------------------------------------------------
      const timeSlow = player.tachyonActiveTimer > 0 ? 0.4 : 1.0;

      enemiesRef.current.forEach((enemy) => {
        enemy.shootTimer++;

        if (enemy.type === "scout") {
          enemy.x += enemy.vx * timeSlow;
          enemy.y += enemy.vy * timeSlow;

          // Scout bounce on walls
          if (enemy.x <= enemy.radius || enemy.x >= width - enemy.radius) enemy.vx *= -1;

          // Scout Shoot
          if (enemy.shootTimer % 90 === 0) {
            const angle = Math.atan2(player.y - enemy.y, player.x - enemy.x);
            bulletsRef.current.push({
              x: enemy.x,
              y: enemy.y,
              vx: Math.cos(angle) * 4.5 * timeSlow,
              vy: Math.sin(angle) * 4.5 * timeSlow,
              radius: 4,
              color: "#39ff14",
              isEnemy: true,
              damage: 12,
              life: 180,
            });
          }
        } else if (enemy.type === "cruiser") {
          enemy.x += enemy.vx * timeSlow;
          enemy.y += enemy.vy * timeSlow;

          if (enemy.x <= enemy.radius || enemy.x >= width - enemy.radius) enemy.vx *= -1;

          // Cruiser Triple Shot
          if (enemy.shootTimer % 110 === 0) {
            const baseAngle = Math.atan2(player.y - enemy.y, player.x - enemy.x);
            [-0.2, 0, 0.2].forEach((offset) => {
              bulletsRef.current.push({
                x: enemy.x,
                y: enemy.y,
                vx: Math.cos(baseAngle + offset) * 4 * timeSlow,
                vy: Math.sin(baseAngle + offset) * 4 * timeSlow,
                radius: 5,
                color: "#ffaa00",
                isEnemy: true,
                damage: 16,
                life: 180,
              });
            });
          }
        } else if (enemy.type === "stalker") {
          enemy.x += enemy.vx * timeSlow;
          enemy.y += enemy.vy * timeSlow;

          if (enemy.x <= enemy.radius || enemy.x >= width - enemy.radius) enemy.vx *= -1;

          // Stalker Ring Burst
          if (enemy.shootTimer % 130 === 0) {
            const count = 6;
            for (let i = 0; i < count; i++) {
              const angle = (Math.PI * 2 * i) / count;
              bulletsRef.current.push({
                x: enemy.x,
                y: enemy.y,
                vx: Math.cos(angle) * 3.5 * timeSlow,
                vy: Math.sin(angle) * 3.5 * timeSlow,
                radius: 4,
                color: "#b026ff",
                isEnemy: true,
                damage: 14,
                life: 160,
              });
            }
          }
        } else if (enemy.type === "boss") {
          // Boss Titan Movement Pattern
          if (enemy.targetY && enemy.y < enemy.targetY) {
            enemy.y += 1.5;
          } else {
            enemy.x += enemy.vx * timeSlow;
            if (enemy.x <= 100 || enemy.x >= width - 100) enemy.vx *= -1;
          }

          // Update Boss HP UI
          const bossHpPct = Math.max(0, (enemy.hp / enemy.maxHp) * 100);
          setBossHpPercentage(bossHpPct);

          // Multi-phase attacks
          if (enemy.shootTimer % 50 === 0) {
            audio.playHeavyCannon();
            const angleToPlayer = Math.atan2(player.y - enemy.y, player.x - enemy.x);

            if (bossHpPct > 50) {
              // Phase 1: Heavy Dual Volley
              [-0.25, 0.25].forEach((off) => {
                bulletsRef.current.push({
                  x: enemy.x + off * 40,
                  y: enemy.y + 20,
                  vx: Math.cos(angleToPlayer) * 5 * timeSlow,
                  vy: Math.sin(angleToPlayer) * 5 * timeSlow,
                  radius: 7,
                  color: "#ff0055",
                  isEnemy: true,
                  damage: 22,
                  life: 200,
                });
              });
            } else {
              // Phase 2: Hyper Spiral Nova
              const bulletCount = 8;
              for (let i = 0; i < bulletCount; i++) {
                const angle = angleToPlayer + (Math.PI * 2 * i) / bulletCount + enemy.shootTimer * 0.05;
                bulletsRef.current.push({
                  x: enemy.x,
                  y: enemy.y,
                  vx: Math.cos(angle) * 4.5 * timeSlow,
                  vy: Math.sin(angle) * 4.5 * timeSlow,
                  radius: 6,
                  color: "#ff00ff",
                  isEnemy: true,
                  damage: 20,
                  life: 200,
                });
              }
            }
          }
        }
      });

      // Remove enemies that move off-screen at bottom
      enemiesRef.current = enemiesRef.current.filter((e) => e.y <= height + 60 && e.hp > 0);

      // ----------------------------------------------------------------------
      // 5. BULLET VS ENEMY / PLAYER COLLISIONS
      // ----------------------------------------------------------------------
      bulletsRef.current.forEach((bullet) => {
        if (!bullet.isEnemy) {
          // Player bullet hitting enemies
          enemiesRef.current.forEach((enemy) => {
            const dist = Math.hypot(bullet.x - enemy.x, bullet.y - enemy.y);
            if (dist < bullet.radius + enemy.radius) {
              enemy.hp -= bullet.damage;
              bullet.life = 0; // Destroy bullet

              // Hit spark
              createSparks(bullet.x, bullet.y, enemy.color, 4);

              // Enemy Death Check
              if (enemy.hp <= 0) {
                audio.playExplosion(enemy.type === "boss");
                createSparks(enemy.x, enemy.y, enemy.color, enemy.type === "boss" ? 35 : 14);

                // Add Score & Cores
                const enemyScore = enemy.type === "boss" ? 1500 : enemy.type === "cruiser" ? 250 : 100;
                scoreRef.current += enemyScore * multiplier;
                killsRef.current += 1;
                setScore(scoreRef.current);
                setTotalKills(killsRef.current);

                // Core drop
                const coreDrop = enemy.type === "boss" ? 50 : Math.random() < 0.35 ? 5 : 0;
                if (coreDrop > 0) {
                  coresRef.current += coreDrop;
                  setQuantumCores(coresRef.current);
                  localStorage.setItem("apex_valkyrie_quantum_cores", coresRef.current.toString());

                  // Core Powerup visual
                  powerupsRef.current.push({
                    id: "p_" + Date.now(),
                    x: enemy.x,
                    y: enemy.y,
                    type: "core",
                    radius: 12,
                    duration: 400,
                  });
                }

                // Random Health/Shield powerup drop
                if (Math.random() < 0.12 && enemy.type !== "boss") {
                  const type = Math.random() < 0.5 ? "health" : "shield";
                  powerupsRef.current.push({
                    id: "p_" + Date.now(),
                    x: enemy.x,
                    y: enemy.y,
                    type,
                    radius: 12,
                    duration: 400,
                  });
                }

                if (enemy.type === "boss") {
                  setBossActive(false);
                }
              }
            }
          });
        } else {
          // Enemy bullet hitting player
          const dist = Math.hypot(bullet.x - player.x, bullet.y - player.y);
          if (dist < bullet.radius + player.radius && player.invulnerableTimer <= 0) {
            bullet.life = 0;
            createSparks(player.x, player.y, "#ff0055", 10);

            // Calculate Shield vs Health Damage
            if (player.shield > 0) {
              audio.playShieldHit();
              player.shield = Math.max(0, player.shield - bullet.damage);
            } else {
              audio.playExplosion(false);
              player.hp = Math.max(0, player.hp - bullet.damage);
            }

            // Flash invulnerability
            player.invulnerableTimer = 15;

            // Check Player Death
            if (player.hp <= 0) {
              audio.playExplosion(true);
              triggerGameOver();
            }
          }
        }
      });

      // Enemy Body Collision with Player
      enemiesRef.current.forEach((enemy) => {
        const dist = Math.hypot(enemy.x - player.x, enemy.y - player.y);
        if (dist < enemy.radius + player.radius && player.invulnerableTimer <= 0) {
          player.hp = Math.max(0, player.hp - 25);
          enemy.hp -= 50;
          player.invulnerableTimer = 25;
          audio.playShieldHit();

          if (player.hp <= 0) {
            triggerGameOver();
          }
        }
      });

      // ----------------------------------------------------------------------
      // 6. UPDATE POWERUPS
      // ----------------------------------------------------------------------
      powerupsRef.current.forEach((p) => {
        p.y += 1.2;
        p.duration--;

        const dist = Math.hypot(p.x - player.x, p.y - player.y);
        if (dist < p.radius + player.radius) {
          p.duration = 0;
          audio.playPowerup();

          if (p.type === "health") {
            player.hp = Math.min(player.maxHp, player.hp + 30);
          } else if (p.type === "shield") {
            player.shield = Math.min(player.maxShield, player.shield + 30);
          } else if (p.type === "core") {
            coresRef.current += 10;
            setQuantumCores(coresRef.current);
            localStorage.setItem("apex_valkyrie_quantum_cores", coresRef.current.toString());
          }
        }
      });

      powerupsRef.current = powerupsRef.current.filter((p) => p.duration > 0 && p.y <= height + 20);

      // ----------------------------------------------------------------------
      // 7. UPDATE SHOCKWAVES & PARTICLES
      // ----------------------------------------------------------------------
      shockwavesRef.current.forEach((sw) => {
        sw.radius += 12;
        sw.alpha = Math.max(0, 1 - sw.radius / sw.maxRadius);
      });
      shockwavesRef.current = shockwavesRef.current.filter((sw) => sw.radius < sw.maxRadius);

      particlesRef.current.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        p.alpha -= p.decay;
      });
      particlesRef.current = particlesRef.current.filter((p) => p.alpha > 0);

      // ----------------------------------------------------------------------
      // 8. CANVAS RENDERING
      // ----------------------------------------------------------------------
      // Clear screen with deep cyber space gradient
      const bgGradient = ctx.createLinearGradient(0, 0, 0, height);
      bgGradient.addColorStop(0, "#030712");
      bgGradient.addColorStop(0.5, "#0b0f19");
      bgGradient.addColorStop(1, "#050b14");
      ctx.fillStyle = bgGradient;
      ctx.fillRect(0, 0, width, height);

      // Render Parallax Stars
      starsRef.current.forEach((star) => {
        star.y += star.speed * (player.tachyonActiveTimer > 0 ? 2.5 : 1);
        if (star.y > height) {
          star.y = 0;
          star.x = Math.random() * width;
        }
        ctx.fillStyle = `rgba(255, 255, 255, ${star.opacity})`;
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
        ctx.fill();
      });

      // Render Shockwaves
      shockwavesRef.current.forEach((sw) => {
        ctx.save();
        ctx.strokeStyle = sw.color;
        ctx.globalAlpha = sw.alpha;
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(sw.x, sw.y, sw.radius, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      });

      // Render Particles
      particlesRef.current.forEach((p) => {
        ctx.save();
        ctx.globalAlpha = p.alpha;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });

      // Render Powerups
      powerupsRef.current.forEach((p) => {
        ctx.save();
        ctx.fillStyle = p.type === "health" ? "#39ff14" : p.type === "shield" ? "#00f0ff" : "#ffaa00";
        ctx.shadowColor = ctx.fillStyle;
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = "#ffffff";
        ctx.font = "10px sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(p.type === "health" ? "H" : p.type === "shield" ? "S" : "C", p.x, p.y);
        ctx.restore();
      });

      // Render Bullets
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

      // Render Enemies
      enemiesRef.current.forEach((e) => {
        ctx.save();
        ctx.translate(e.x, e.y);
        ctx.shadowColor = e.color;
        ctx.shadowBlur = 12;

        if (e.type === "scout") {
          // Triangle Scout
          ctx.strokeStyle = e.color;
          ctx.lineWidth = 2.5;
          ctx.beginPath();
          ctx.moveTo(0, e.radius);
          ctx.lineTo(-e.radius * 0.8, -e.radius);
          ctx.lineTo(e.radius * 0.8, -e.radius);
          ctx.closePath();
          ctx.stroke();
        } else if (e.type === "cruiser") {
          // Hexagon Cruiser
          ctx.fillStyle = e.color;
          ctx.beginPath();
          for (let i = 0; i < 6; i++) {
            const angle = (Math.PI / 3) * i;
            const px = Math.cos(angle) * e.radius;
            const py = Math.sin(angle) * e.radius;
            if (i === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
          }
          ctx.closePath();
          ctx.fill();
        } else if (e.type === "stalker") {
          // Diamond Stalker
          ctx.strokeStyle = e.color;
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.moveTo(0, -e.radius);
          ctx.lineTo(e.radius, 0);
          ctx.lineTo(0, e.radius);
          ctx.lineTo(-e.radius, 0);
          ctx.closePath();
          ctx.stroke();
        } else if (e.type === "boss") {
          // Boss Titan Dreadnought
          ctx.fillStyle = "#1e1e2e";
          ctx.strokeStyle = e.color;
          ctx.lineWidth = 4;
          ctx.beginPath();
          ctx.arc(0, 0, e.radius, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();

          // Inner Glowing Core
          ctx.fillStyle = e.color;
          ctx.beginPath();
          ctx.arc(0, 0, e.radius * 0.4, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      });

      // Render Player Valkyrie Ship
      if (player.hp > 0 && (player.invulnerableTimer % 4 < 2)) {
        ctx.save();
        ctx.translate(player.x, player.y);
        ctx.rotate(player.angle + Math.PI / 2); // Align sprite facing direction

        // Shield Aura
        if (player.shield > 0) {
          ctx.strokeStyle = "rgba(0, 240, 255, 0.6)";
          ctx.lineWidth = 2.5;
          ctx.beginPath();
          ctx.arc(0, 0, player.radius + 6, 0, Math.PI * 2);
          ctx.stroke();
        }

        // Valkyrie Wings & Hull
        ctx.fillStyle = player.tachyonActiveTimer > 0 ? "#ff007f" : "#00f0ff";
        ctx.shadowColor = ctx.fillStyle;
        ctx.shadowBlur = 15;

        // Fighter Jet Silhouette
        ctx.beginPath();
        ctx.moveTo(0, -player.radius * 1.2);
        ctx.lineTo(player.radius * 0.9, player.radius);
        ctx.lineTo(0, player.radius * 0.5);
        ctx.lineTo(-player.radius * 0.9, player.radius);
        ctx.closePath();
        ctx.fill();

        // Cockpit Glass
        ctx.fillStyle = "#ffffff";
        ctx.beginPath();
        ctx.arc(0, -player.radius * 0.2, 4, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
      }

      animationFrameId = requestAnimationFrame(gameLoop);
    };

    animationFrameId = requestAnimationFrame(gameLoop);
    animFrameIdRef.current = animationFrameId;

    return () => {
      if (animFrameIdRef.current) cancelAnimationFrame(animFrameIdRef.current);
    };
  }, [gameState, upgrades]);

  // Trigger Game Over
  const triggerGameOver = () => {
    setGameState("gameover");

    // Check High Score
    if (scoreRef.current > highScore) {
      setHighScore(scoreRef.current);
      localStorage.setItem("apex_valkyrie_high_score", scoreRef.current.toString());
    }
  };

  return (
    <div className="relative w-full min-h-screen bg-slate-950 text-white font-sans overflow-hidden flex flex-col items-center justify-center select-none">
      {/* Dynamic Background Grid Pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1f293715_1px,transparent_1px),linear-gradient(to_bottom,#1f293715_1px,transparent_1px)] bg-[size:4rem_4rem] pointer-events-none" />

      {/* Top Header Navigation */}
      <header className="absolute top-0 left-0 right-0 p-4 flex items-center justify-between z-20 bg-slate-900/60 backdrop-blur-md border-b border-slate-800/60">
        <Link
          href="/game"
          className="flex items-center gap-2 text-cyan-400 hover:text-cyan-300 font-semibold text-sm transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Arcade Hub
        </Link>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-950/80 border border-cyan-500/30 text-cyan-300 text-xs font-mono">
            <Cpu className="w-3.5 h-3.5" />
            <span>Cores: {quantumCores}</span>
          </div>
          <button
            onClick={toggleAudio}
            className="p-2 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 transition-colors"
            title="Toggle SFX Audio"
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-cyan-400" />}
          </button>
        </div>
      </header>

      {/* MAIN GAME CONTAINER */}
      <div className="relative mt-14 flex flex-col items-center justify-center">
        {/* CANVAS VIEWPORT */}
        <div className="relative rounded-2xl overflow-hidden shadow-2xl border-2 border-cyan-500/30 bg-black">
          <canvas
            ref={canvasRef}
            width={900}
            height={680}
            className="block cursor-crosshair max-w-full h-auto"
          />

          {/* PLAYING HUD OVERLAY */}
          {gameState === "playing" && (
            <div className="absolute inset-0 pointer-events-none p-5 flex flex-col justify-between">
              {/* TOP HUD */}
              <div className="flex items-start justify-between">
                {/* Health & Shield */}
                <div className="flex flex-col gap-2 w-52 bg-slate-950/70 p-3 rounded-xl backdrop-blur-sm border border-slate-800">
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs font-bold text-cyan-400">
                      <span className="flex items-center gap-1">
                        <Shield className="w-3.5 h-3.5" /> SHIELD
                      </span>
                      <span>
                        {playerShield} / {playerMaxShield}
                      </span>
                    </div>
                    <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-cyan-400 transition-all duration-200 shadow-[0_0_8px_#00f0ff]"
                        style={{ width: `${(playerShield / playerMaxShield) * 100}%` }}
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-xs font-bold text-emerald-400">
                      <span className="flex items-center gap-1">
                        <Flame className="w-3.5 h-3.5" /> HULL HP
                      </span>
                      <span>
                        {playerHp} / {playerMaxHp}
                      </span>
                    </div>
                    <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-emerald-400 transition-all duration-200 shadow-[0_0_8px_#39ff14]"
                        style={{ width: `${(playerHp / playerMaxHp) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Score & Wave Display */}
                <div className="flex flex-col items-center bg-slate-950/70 px-6 py-2 rounded-xl backdrop-blur-sm border border-slate-800">
                  <div className="text-xs uppercase tracking-widest text-slate-400 font-bold">WAVE {wave}</div>
                  <div className="text-3xl font-black text-cyan-300 font-mono tracking-wider">{score}</div>
                </div>

                {/* Pause Button */}
                <button
                  onClick={() => setGameState("paused")}
                  className="pointer-events-auto p-2.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-700 text-slate-300 transition-colors"
                >
                  <Pause className="w-5 h-5" />
                </button>
              </div>

              {/* BOSS HEALTH BAR (WHEN ACTIVE) */}
              {bossActive && (
                <div className="w-full max-w-md mx-auto bg-slate-950/90 p-3 rounded-xl border border-red-500/50 backdrop-blur-md animate-pulse">
                  <div className="flex justify-between text-xs font-black text-red-400 uppercase tracking-widest mb-1">
                    <span>APEX DREADNOUGHT TITAN</span>
                    <span>{Math.round(bossHpPercentage)}%</span>
                  </div>
                  <div className="w-full h-3 bg-slate-900 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-red-600 to-pink-500 transition-all duration-150 shadow-[0_0_12px_#ff0055]"
                      style={{ width: `${bossHpPercentage}%` }}
                    />
                  </div>
                </div>
              )}

              {/* BOTTOM HUD - ABILITIES & CONTROLS */}
              <div className="flex items-end justify-between">
                {/* EMP & Tachyon Ability Indicators */}
                <div className="flex items-center gap-3 pointer-events-auto">
                  <button
                    onClick={triggerEmpShockwave}
                    className="relative group p-3 rounded-xl bg-slate-900/80 border border-cyan-500/40 hover:border-cyan-400 transition-all text-left flex items-center gap-3"
                  >
                    <div className="relative w-10 h-10 rounded-lg bg-cyan-950 flex items-center justify-center text-cyan-300 font-black">
                      <Zap className="w-5 h-5" />
                      {empCdPercent < 100 && (
                        <div
                          className="absolute inset-0 bg-slate-950/80 rounded-lg"
                          style={{ height: `${100 - empCdPercent}%` }}
                        />
                      )}
                    </div>
                    <div>
                      <div className="text-xs font-bold text-cyan-300">[Q] EMP VORTEX</div>
                      <div className="text-[10px] text-slate-400">Shockwave & Bullet Clear</div>
                    </div>
                  </button>

                  <button
                    onClick={triggerTachyonShift}
                    className="relative group p-3 rounded-xl bg-slate-900/80 border border-pink-500/40 hover:border-pink-400 transition-all text-left flex items-center gap-3"
                  >
                    <div className="relative w-10 h-10 rounded-lg bg-pink-950 flex items-center justify-center text-pink-400 font-black">
                      <FastForward className="w-5 h-5" />
                      {tachyonCdPercent < 100 && (
                        <div
                          className="absolute inset-0 bg-slate-950/80 rounded-lg"
                          style={{ height: `${100 - tachyonCdPercent}%` }}
                        />
                      )}
                    </div>
                    <div>
                      <div className="text-xs font-bold text-pink-400">[E] TACHYON BOOST</div>
                      <div className="text-[10px] text-slate-400">
                        {tachyonActive ? "OVERDRIVE ACTIVE" : "Time Dilation"}
                      </div>
                    </div>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* MENU OVERLAY */}
          {gameState === "menu" && (
            <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-md flex flex-col items-center justify-center p-8 text-center z-10">
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="flex flex-col items-center max-w-lg"
              >
                <div className="p-4 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 mb-4">
                  <Rocket className="w-12 h-12 text-cyan-400 animate-bounce" />
                </div>
                <h1 className="text-4xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-teal-300 to-pink-500 mb-2">
                  APEX VALKYRIE OVERDRIVE
                </h1>
                <p className="text-slate-400 text-sm mb-6">
                  Command your elite Cyber Valkyrie interceptor. Unleash tachyon shifts, detonate EMP vortexes, and destroy alien dreadnought armadas.
                </p>

                <div className="grid grid-cols-2 gap-4 w-full mb-6 text-left">
                  <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 text-xs space-y-1">
                    <span className="font-bold text-cyan-400 flex items-center gap-1">
                      <Target className="w-3.5 h-3.5" /> Controls:
                    </span>
                    <p className="text-slate-400">WASD / Arrows to Navigate</p>
                    <p className="text-slate-400">Mouse to Aim & Fire</p>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 text-xs space-y-1">
                    <span className="font-bold text-pink-400 flex items-center gap-1">
                      <Zap className="w-3.5 h-3.5" /> Special Tech:
                    </span>
                    <p className="text-slate-400">[Q] EMP Shockwave</p>
                    <p className="text-slate-400">[E] Chrono Tachyon Shift</p>
                  </div>
                </div>

                <div className="flex gap-4 w-full">
                  <button
                    onClick={startGame}
                    className="flex-1 py-3.5 px-6 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 font-bold text-white shadow-lg shadow-cyan-500/25 flex items-center justify-center gap-2 transition-all transform hover:scale-[1.02]"
                  >
                    <Play className="w-5 h-5 fill-current" /> Launch Mission
                  </button>
                  <button
                    onClick={() => setGameState("hangar")}
                    className="py-3.5 px-6 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 font-bold text-slate-200 flex items-center justify-center gap-2 transition-all"
                  >
                    <ShoppingBag className="w-5 h-5 text-cyan-400" /> Hangar Shop
                  </button>
                </div>
              </motion.div>
            </div>
          )}

          {/* HANGAR SHOP OVERLAY */}
          {gameState === "hangar" && (
            <div className="absolute inset-0 bg-slate-950/95 backdrop-blur-lg p-8 flex flex-col justify-between z-10">
              <div>
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <h2 className="text-2xl font-black text-cyan-300 flex items-center gap-2">
                      <ShoppingBag className="w-6 h-6" /> VALKYRIE TECH HANGAR
                    </h2>
                    <p className="text-xs text-slate-400">Upgrade core systems with harvested Quantum Cores</p>
                  </div>
                  <div className="px-4 py-2 rounded-xl bg-cyan-950/80 border border-cyan-500/40 text-cyan-300 text-sm font-mono font-bold flex items-center gap-2">
                    <Cpu className="w-4 h-4" /> Quantum Cores: {quantumCores}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {/* Upgrade Cards */}
                  {[
                    { key: "damageLevel", title: "Plasma Cannons", desc: "Increases primary shot power & spread", icon: Swords },
                    { key: "fireRateLevel", title: "Engine Thrusters", desc: "Boosts firing speed & thruster agility", icon: Flame },
                    { key: "shieldLevel", title: "Photon Shielding", desc: "Enhances max Hull HP & Energy Shielding", icon: Shield },
                    { key: "empLevel", title: "EMP Vortex Capacitor", desc: "Expands shockwave radius & reduces cooldown", icon: Zap },
                    { key: "tachyonLevel", title: "Tachyon Core Dilation", desc: "Extends time slow duration & recharge speed", icon: FastForward },
                  ].map((item) => {
                    const level = upgrades[item.key as keyof Upgrades];
                    const cost = getUpgradeCost(level);
                    const isMax = level >= 5;

                    return (
                      <div
                        key={item.key}
                        className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between"
                      >
                        <div className="flex items-center gap-3">
                          <div className="p-3 rounded-lg bg-slate-800 text-cyan-400">
                            <item.icon className="w-5 h-5" />
                          </div>
                          <div>
                            <div className="font-bold text-sm text-slate-200">{item.title}</div>
                            <div className="text-[11px] text-slate-400">{item.desc}</div>
                            <div className="flex gap-1 mt-1.5">
                              {[1, 2, 3, 4, 5].map((lvl) => (
                                <div
                                  key={lvl}
                                  className={`w-4 h-1.5 rounded-full ${
                                    lvl <= level ? "bg-cyan-400 shadow-[0_0_6px_#00f0ff]" : "bg-slate-800"
                                  }`}
                                />
                              ))}
                            </div>
                          </div>
                        </div>

                        <button
                          disabled={isMax || quantumCores < cost}
                          onClick={() => buyUpgrade(item.key as keyof Upgrades)}
                          className={`px-4 py-2 rounded-lg font-bold text-xs flex items-center gap-1.5 transition-all ${
                            isMax
                              ? "bg-slate-800 text-slate-500 cursor-not-allowed"
                              : quantumCores >= cost
                              ? "bg-cyan-500 hover:bg-cyan-400 text-slate-950"
                              : "bg-slate-800 text-slate-400 opacity-60 cursor-not-allowed"
                          }`}
                        >
                          {isMax ? "MAXED" : `${cost} Cores`}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  onClick={() => setGameState("menu")}
                  className="px-6 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 font-bold text-sm"
                >
                  Return to Menu
                </button>
                <button
                  onClick={startGame}
                  className="px-6 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-sm"
                >
                  Deploy Valkyrie
                </button>
              </div>
            </div>
          )}

          {/* PAUSE OVERLAY */}
          {gameState === "paused" && (
            <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-md flex flex-col items-center justify-center z-10">
              <div className="p-8 rounded-2xl bg-slate-900 border border-slate-800 max-w-sm w-full text-center space-y-4">
                <h3 className="text-2xl font-black text-slate-100">MISSION PAUSED</h3>
                <div className="space-y-2">
                  <button
                    onClick={() => setGameState("playing")}
                    className="w-full py-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-sm"
                  >
                    Resume Flight
                  </button>
                  <button
                    onClick={startGame}
                    className="w-full py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-sm"
                  >
                    Restart Mission
                  </button>
                  <button
                    onClick={() => setGameState("menu")}
                    className="w-full py-3 rounded-xl bg-slate-950 hover:bg-slate-900 border border-slate-800 text-slate-400 font-bold text-sm"
                  >
                    Abort to Main Menu
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* GAME OVER OVERLAY */}
          {gameState === "gameover" && (
            <div className="absolute inset-0 bg-slate-950/95 backdrop-blur-lg flex flex-col items-center justify-center p-8 z-10 text-center">
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="max-w-md w-full"
              >
                <div className="text-red-500 font-black tracking-widest text-xs uppercase mb-1">HULL DESTRUCTION IMMINENT</div>
                <h2 className="text-4xl font-black text-slate-100 mb-6">MISSION FAILED</h2>

                <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-6 space-y-4 mb-6">
                  <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                    <span className="text-xs text-slate-400 uppercase tracking-wider font-bold">Final Score</span>
                    <span className="text-2xl font-black text-cyan-400 font-mono">{score}</span>
                  </div>
                  <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                    <span className="text-xs text-slate-400 uppercase tracking-wider font-bold">Waves Cleared</span>
                    <span className="text-lg font-bold text-slate-200">{wave}</span>
                  </div>
                  <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                    <span className="text-xs text-slate-400 uppercase tracking-wider font-bold">Hostiles Destroyed</span>
                    <span className="text-lg font-bold text-slate-200">{totalKills}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-slate-400 uppercase tracking-wider font-bold">All-Time High Score</span>
                    <span className="text-lg font-bold text-amber-400 font-mono">{highScore}</span>
                  </div>
                </div>

                <div className="flex gap-4">
                  <button
                    onClick={startGame}
                    className="flex-1 py-3.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-sm shadow-lg shadow-cyan-500/25 flex items-center justify-center gap-2"
                  >
                    <RotateCcw className="w-4 h-4" /> Immediate Redeploy
                  </button>
                  <button
                    onClick={() => setGameState("hangar")}
                    className="py-3.5 px-5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 font-bold text-sm"
                  >
                    Hangar
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
