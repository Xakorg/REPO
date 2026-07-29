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
  Radio,
  Rocket,
  Swords,
  Award,
  ArrowLeft,
  Pause,
  Flame,
  RefreshCw,
  Sliders,
  ChevronRight,
  Target
} from "lucide-react";
import Link from "next/link";

// ============================================================================
// 1. WEB AUDIO SYNTHESIZER SFX ENGINE (Zero External Assets)
// ============================================================================
class NebulaAudioEngine {
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

  public playLaser(pitchMultiplier: number = 1.0) {
    if (this.muted) return;
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(880 * pitchMultiplier, now);
    osc.frequency.exponentialRampToValueAtTime(110 * pitchMultiplier, now + 0.12);

    gain.gain.setValueAtTime(0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.12);
  }

  public playHeavyLaser() {
    if (this.muted) return;
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = "square";
    osc.frequency.setValueAtTime(320, now);
    osc.frequency.exponentialRampToValueAtTime(60, now + 0.25);

    gain.gain.setValueAtTime(0.25, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.25);
  }

  public playExplosion(isLarge: boolean = false) {
    if (this.muted) return;
    this.initCtx();
    if (!this.ctx) return;

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
    filter.frequency.setValueAtTime(isLarge ? 400 : 800, this.ctx.currentTime);
    filter.frequency.exponentialRampToValueAtTime(30, this.ctx.currentTime + duration);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(isLarge ? 0.35 : 0.2, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + duration);

    whiteNoise.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);

    whiteNoise.start();
  }

  public playEmpPulse() {
    if (this.muted) return;
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(150, now);
    osc.frequency.exponentialRampToValueAtTime(1200, now + 0.2);
    osc.frequency.exponentialRampToValueAtTime(80, now + 0.5);

    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.5);
  }

  public playDashSFX() {
    if (this.muted) return;
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = "triangle";
    osc.frequency.setValueAtTime(200, now);
    osc.frequency.exponentialRampToValueAtTime(900, now + 0.18);

    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.18);
  }

  public playCrystalPickup() {
    if (this.muted) return;
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const notes = [523.25, 659.25, 783.99, 1046.5];
    notes.forEach((freq, idx) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, now + idx * 0.04);

      gain.gain.setValueAtTime(0.12, now + idx * 0.04);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.04 + 0.08);

      osc.connect(gain);
      gain.connect(this.ctx!.destination);

      osc.start(now + idx * 0.04);
      osc.stop(now + idx * 0.04 + 0.08);
    });
  }

  public playUpgradeSFX() {
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

      gain.gain.setValueAtTime(0.15, now + idx * 0.06);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.06 + 0.12);

      osc.connect(gain);
      gain.connect(this.ctx!.destination);

      osc.start(now + idx * 0.06);
      osc.stop(now + idx * 0.06 + 0.12);
    });
  }
}

const audioEngine = new NebulaAudioEngine();

// ============================================================================
// 2. GAME DATA STRUCTURES & TYPES
// ============================================================================
type GameState = "START" | "PLAYING" | "SHOP" | "PAUSED" | "GAMEOVER" | "VICTORY";
type Difficulty = "NORMAL" | "HEROIC" | "NIGHTMARE";

interface PlayerState {
  x: number;
  y: number;
  vx: number;
  vy: number;
  angle: number;
  hp: number;
  maxHp: number;
  shield: number;
  maxShield: number;
  shieldRechargeCd: number;
  speed: number;
  dashCooldown: number;
  dashActiveTime: number;
  empCooldown: number;
  fireCooldown: number;
  invulnerableTime: number;
}

interface NexusCoreState {
  x: number;
  y: number;
  radius: number;
  hp: number;
  maxHp: number;
  pulseTimer: number;
  turretAngle: number;
  turretFireCd: number;
}

interface Projectile {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  damage: number;
  isEnemy: boolean;
  color: string;
  radius: number;
  life: number;
}

interface Enemy {
  id: number;
  type: "swarmer" | "interceptor" | "sniper" | "dreadnought" | "boss";
  x: number;
  y: number;
  vx: number;
  vy: number;
  angle: number;
  hp: number;
  maxHp: number;
  radius: number;
  color: string;
  fireCd: number;
  scoreValue: number;
  crystalDropCount: number;
  bossPhase?: number;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  life: number;
  maxLife: number;
}

interface PlasmaCrystal {
  id: number;
  x: number;
  y: number;
  value: number;
  life: number;
}

interface FloatingText {
  id: number;
  x: number;
  y: number;
  text: string;
  color: string;
  life: number;
}

interface UpgradeItem {
  id: string;
  name: string;
  description: string;
  level: number;
  maxLevel: number;
  baseCost: number;
  costMultiplier: number;
  icon: string;
}

// ============================================================================
// 3. MAIN COMPONENT: NebulaNexusOverdriveGame
// ============================================================================
export default function NebulaNexusOverdriveGame() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Game UI & State Variables
  const [gameState, setGameState] = useState<GameState>("START");
  const [difficulty, setDifficulty] = useState<Difficulty>("NORMAL");
  const [score, setScore] = useState<number>(0);
  const [highScore, setHighScore] = useState<number>(0);
  const [wave, setWave] = useState<number>(1);
  const [crystals, setCrystals] = useState<number>(0);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [enemiesRemaining, setEnemiesRemaining] = useState<number>(0);

  // Upgrades State
  const [upgrades, setUpgrades] = useState<{ [key: string]: UpgradeItem }>({
    weaponDamage: { id: "weaponDamage", name: "Plasma Cannon Power", description: "Increases primary laser damage by +20%", level: 1, maxLevel: 5, baseCost: 150, costMultiplier: 1.8, icon: "Zap" },
    fireRate: { id: "fireRate", name: "Overdrive Fire Rate", description: "Increases attack speed by +18%", level: 1, maxLevel: 5, baseCost: 120, costMultiplier: 1.6, icon: "Flame" },
    shieldCap: { id: "shieldCap", name: "Aegis Shield Matrix", description: "Boosts max shield & regeneration speed", level: 1, maxLevel: 5, baseCost: 180, costMultiplier: 1.7, icon: "Shield" },
    engineSpeed: { id: "engineSpeed", name: "Tachyon Thrusters", description: "Increases movement speed & dash recharge", level: 1, maxLevel: 5, baseCost: 100, costMultiplier: 1.5, icon: "Rocket" },
    drones: { id: "drones", name: "Orbital Defense Drone", description: "Deploys autonomous laser drones around player", level: 0, maxLevel: 3, baseCost: 300, costMultiplier: 2.2, icon: "Target" },
    nexusHealth: { id: "nexusHealth", name: "Nexus Core Fortification", description: "Restores & expands Nexus Core maximum health", level: 1, maxLevel: 5, baseCost: 200, costMultiplier: 1.75, icon: "Radio" }
  });

  // Controls & Touch Inputs
  const keysPressed = useRef<{ [key: string]: boolean }>({});
  const mousePos = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const isMouseDown = useRef<boolean>(false);

  // Core Game Entities (Mutable refs for smooth 60FPS loop)
  const playerRef = useRef<PlayerState>({
    x: 400, y: 300, vx: 0, vy: 0, angle: 0,
    hp: 100, maxHp: 100, shield: 50, maxShield: 50,
    shieldRechargeCd: 0, speed: 4.5,
    dashCooldown: 0, dashActiveTime: 0, empCooldown: 0,
    fireCooldown: 0, invulnerableTime: 0
  });

  const nexusRef = useRef<NexusCoreState>({
    x: 400, y: 300, radius: 45, hp: 500, maxHp: 500, pulseTimer: 0, turretAngle: 0, turretFireCd: 0
  });

  const projectilesRef = useRef<Projectile[]>([]);
  const enemiesRef = useRef<Enemy[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const crystalsRef = useRef<PlasmaCrystal[]>([]);
  const floatingTextsRef = useRef<FloatingText[]>([]);
  const animationFrameId = useRef<number | null>(null);
  const nextEntityId = useRef<number>(1);
  const waveSpawningRef = useRef<{ totalToSpawn: number; spawned: number; spawnTimer: number }>({
    totalToSpawn: 0, spawned: 0, spawnTimer: 0
  });

  // Load High Score on Mount
  useEffect(() => {
    const saved = localStorage.getItem("nebula_nexus_high_score");
    if (saved) setHighScore(parseInt(saved, 10));
  }, []);

  // Update High Score when Score changes
  useEffect(() => {
    if (score > highScore) {
      setHighScore(score);
      localStorage.setItem("nebula_nexus_high_score", score.toString());
    }
  }, [score, highScore]);

  // Window Resize & Canvas Bounds Listener
  useEffect(() => {
    const handleResize = () => {
      if (canvasRef.current) {
        canvasRef.current.width = canvasRef.current.parentElement?.clientWidth || 900;
        canvasRef.current.height = canvasRef.current.parentElement?.clientHeight || 650;
        if (gameState === "START") {
          nexusRef.current.x = canvasRef.current.width / 2;
          nexusRef.current.y = canvasRef.current.height / 2;
          playerRef.current.x = nexusRef.current.x;
          playerRef.current.y = nexusRef.current.y - 120;
        }
      }
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [gameState]);

  // Keyboard Event Handlers
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      keysPressed.current[e.code] = true;

      if (e.code === "KeyP" || e.code === "Escape") {
        if (gameState === "PLAYING") setGameState("PAUSED");
        else if (gameState === "PAUSED") setGameState("PLAYING");
      }

      if (gameState === "PLAYING") {
        if (e.code === "ShiftLeft" || e.code === "ShiftRight") {
          triggerDash();
        }
        if (e.code === "KeyE") {
          triggerEMP();
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      keysPressed.current[e.code] = false;
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [gameState]);

  // Ability Triggers
  const triggerDash = () => {
    const p = playerRef.current;
    if (p.dashCooldown <= 0) {
      p.dashCooldown = Math.max(90, 180 - upgrades.engineSpeed.level * 18);
      p.dashActiveTime = 12;
      p.invulnerableTime = 18;
      audioEngine.playDashSFX();

      // Create Thruster Burst Particles
      for (let i = 0; i < 25; i++) {
        particlesRef.current.push({
          x: p.x, y: p.y,
          vx: (Math.random() - 0.5) * 8 - Math.cos(p.angle) * 4,
          vy: (Math.random() - 0.5) * 8 - Math.sin(p.angle) * 4,
          color: "#00f0ff", size: Math.random() * 4 + 2,
          life: 25, maxLife: 25
        });
      }
    }
  };

  const triggerEMP = () => {
    const p = playerRef.current;
    if (p.empCooldown <= 0) {
      p.empCooldown = 300; // 5 seconds
      audioEngine.playEmpPulse();

      // Shockwave particles & destroy enemy projectiles
      projectilesRef.current = projectilesRef.current.filter((proj) => !proj.isEnemy);

      // Stun & Damage Enemies in Range
      const empRadius = 320;
      enemiesRef.current.forEach((enemy) => {
        const dist = Math.hypot(enemy.x - p.x, enemy.y - p.y);
        if (dist <= empRadius) {
          enemy.hp -= 40 + upgrades.weaponDamage.level * 10;
          enemy.vx *= 0.1;
          enemy.vy *= 0.1;
        }
      });

      // Visual shockwave ring particles
      for (let angle = 0; angle < Math.PI * 2; angle += 0.15) {
        particlesRef.current.push({
          x: p.x, y: p.y,
          vx: Math.cos(angle) * 12,
          vy: Math.sin(angle) * 12,
          color: "#a855f7", size: 4,
          life: 30, maxLife: 30
        });
      }

      spawnFloatingText(p.x, p.y - 20, "EMP NOVA!", "#a855f7");
    }
  };

  const spawnFloatingText = (x: number, y: number, text: string, color: string) => {
    floatingTextsRef.current.push({
      id: nextEntityId.current++,
      x, y, text, color, life: 40
    });
  };

  // Start Game Routine
  const startGame = () => {
    if (!canvasRef.current) return;
    const width = canvasRef.current.width;
    const height = canvasRef.current.height;

    nexusRef.current = {
      x: width / 2, y: height / 2, radius: 45,
      hp: 500 + (upgrades.nexusHealth.level - 1) * 100,
      maxHp: 500 + (upgrades.nexusHealth.level - 1) * 100,
      pulseTimer: 0, turretAngle: 0, turretFireCd: 0
    };

    playerRef.current = {
      x: width / 2, y: height / 2 - 120, vx: 0, vy: 0, angle: 0,
      hp: 100, maxHp: 100,
      shield: 50 + (upgrades.shieldCap.level - 1) * 15,
      maxShield: 50 + (upgrades.shieldCap.level - 1) * 15,
      shieldRechargeCd: 0,
      speed: 4.5 + (upgrades.engineSpeed.level - 1) * 0.5,
      dashCooldown: 0, dashActiveTime: 0, empCooldown: 0,
      fireCooldown: 0, invulnerableTime: 0
    };

    projectilesRef.current = [];
    enemiesRef.current = [];
    particlesRef.current = [];
    crystalsRef.current = [];
    floatingTextsRef.current = [];

    setScore(0);
    setWave(1);
    setCrystals(100);
    setGameState("PLAYING");

    setupWave(1);
  };

  // Setup Waves
  const setupWave = (waveNum: number) => {
    let enemyCount = 8 + waveNum * 4;
    if (difficulty === "HEROIC") enemyCount = Math.floor(enemyCount * 1.35);
    if (difficulty === "NIGHTMARE") enemyCount = Math.floor(enemyCount * 1.8);

    waveSpawningRef.current = {
      totalToSpawn: enemyCount,
      spawned: 0,
      spawnTimer: 0
    };
    setEnemiesRemaining(enemyCount);
  };

  // Wave Spawner Engine
  const spawnEnemyUnit = () => {
    if (!canvasRef.current) return;
    const width = canvasRef.current.width;
    const height = canvasRef.current.height;

    // Spawn around outer rim
    const angle = Math.random() * Math.PI * 2;
    const dist = Math.max(width, height) / 2 + 50;
    const x = width / 2 + Math.cos(angle) * dist;
    const y = height / 2 + Math.sin(angle) * dist;

    // Determine type based on wave
    const roll = Math.random();
    let type: Enemy["type"] = "swarmer";
    let hp = 30 + wave * 6;
    let color = "#ef4444";
    let radius = 16;
    let crystalValue = 10;
    let scoreValue = 100;

    if (wave >= 5 && waveSpawningRef.current.spawned === waveSpawningRef.current.totalToSpawn - 1 && wave % 5 === 0) {
      type = "boss";
      hp = 600 + wave * 250;
      color = "#ec4899";
      radius = 42;
      crystalValue = 250;
      scoreValue = 2500;
    } else if (roll > 0.8 && wave >= 3) {
      type = "dreadnought";
      hp = 140 + wave * 20;
      color = "#f97316";
      radius = 28;
      crystalValue = 40;
      scoreValue = 400;
    } else if (roll > 0.65 && wave >= 2) {
      type = "sniper";
      hp = 50 + wave * 8;
      color = "#3b82f6";
      radius = 18;
      crystalValue = 25;
      scoreValue = 250;
    } else if (roll > 0.4) {
      type = "interceptor";
      hp = 40 + wave * 8;
      color = "#eab308";
      radius = 16;
      crystalValue = 15;
      scoreValue = 150;
    }

    enemiesRef.current.push({
      id: nextEntityId.current++,
      type, x, y, vx: 0, vy: 0, angle: 0,
      hp, maxHp: hp, radius, color, fireCd: 40 + Math.random() * 40,
      scoreValue, crystalDropCount: crystalValue, bossPhase: 1
    });

    waveSpawningRef.current.spawned++;
  };

  // Purchase Upgrade Handler
  const buyUpgrade = (upgradeId: string) => {
    const item = upgrades[upgradeId];
    if (!item) return;
    const cost = Math.floor(item.baseCost * Math.pow(item.costMultiplier, item.level - 1));

    if (crystals >= cost && item.level < item.maxLevel) {
      setCrystals((prev) => prev - cost);
      audioEngine.playUpgradeSFX();

      setUpgrades((prev) => ({
        ...prev,
        [upgradeId]: { ...prev[upgradeId], level: prev[upgradeId].level + 1 }
      }));

      // Apply immediate stat increases
      const p = playerRef.current;
      const nexus = nexusRef.current;
      if (upgradeId === "engineSpeed") p.speed += 0.6;
      if (upgradeId === "shieldCap") {
        p.maxShield += 20;
        p.shield = p.maxShield;
      }
      if (upgradeId === "nexusHealth") {
        nexus.maxHp += 150;
        nexus.hp = nexus.maxHp;
      }
    }
  };

  // Main 60 FPS Render & Simulation Loop
  useEffect(() => {
    if (gameState !== "PLAYING") return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let lastTime = performance.now();

    const loop = (currentTime: number) => {
      const dt = Math.min((currentTime - lastTime) / 1000, 0.033);
      lastTime = currentTime;

      const width = canvas.width;
      const height = canvas.height;

      // ----------------------------------------------------------------------
      // A. UPDATE SPAWNER & WAVE CHECK
      // ----------------------------------------------------------------------
      const spawner = waveSpawningRef.current;
      if (spawner.spawned < spawner.totalToSpawn) {
        spawner.spawnTimer += 1;
        if (spawner.spawnTimer >= 45) {
          spawnEnemyUnit();
          spawner.spawnTimer = 0;
        }
      } else if (enemiesRef.current.length === 0) {
        // Wave complete! Go to Shop or Next Wave
        audioEngine.playUpgradeSFX();
        const bonusCrystals = 50 + wave * 25;
        setCrystals((prev) => prev + bonusCrystals);
        spawnFloatingText(width / 2, height / 2 - 80, `WAVE ${wave} CLEARED! +${bonusCrystals} CRYSTALS`, "#22c55e");

        setWave((prev) => {
          const nextWave = prev + 1;
          setupWave(nextWave);
          return nextWave;
        });
        setGameState("SHOP");
        return;
      }
      setEnemiesRemaining(spawner.totalToSpawn - spawner.spawned + enemiesRef.current.length);

      // ----------------------------------------------------------------------
      // B. PLAYER MOVEMENT & ABILITIES
      // ----------------------------------------------------------------------
      const p = playerRef.current;
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

      // Apply Dash Boost
      let currentSpeed = p.speed;
      if (p.dashActiveTime > 0) {
        currentSpeed *= 2.8;
        p.dashActiveTime--;
        particlesRef.current.push({
          x: p.x, y: p.y,
          vx: (Math.random() - 0.5) * 2, vy: (Math.random() - 0.5) * 2,
          color: "#00f0ff", size: 3, life: 15, maxLife: 15
        });
      }

      p.vx = moveX * currentSpeed;
      p.vy = moveY * currentSpeed;
      p.x = Math.max(20, Math.min(width - 20, p.x + p.vx));
      p.y = Math.max(20, Math.min(height - 20, p.y + p.vy));

      // Rotate player ship towards mouse pointer
      p.angle = Math.atan2(mousePos.current.y - p.y, mousePos.current.x - p.x);

      // Cooldown Timers
      if (p.dashCooldown > 0) p.dashCooldown--;
      if (p.empCooldown > 0) p.empCooldown--;
      if (p.fireCooldown > 0) p.fireCooldown--;
      if (p.invulnerableTime > 0) p.invulnerableTime--;

      // Shield Regeneration
      if (p.shieldRechargeCd > 0) p.shieldRechargeCd--;
      else if (p.shield < p.maxShield) {
        p.shield = Math.min(p.maxShield, p.shield + 0.15 + upgrades.shieldCap.level * 0.05);
      }

      // Player Firing Primary Cannon
      if ((isMouseDown.current || keysPressed.current["Space"]) && p.fireCooldown <= 0) {
        const fireDelay = Math.max(6, 16 - upgrades.fireRate.level * 2);
        p.fireCooldown = fireDelay;

        const baseDamage = 18 + upgrades.weaponDamage.level * 6;
        const projSpeed = 14;

        // Primary Barrel
        projectilesRef.current.push({
          id: nextEntityId.current++,
          x: p.x + Math.cos(p.angle) * 18,
          y: p.y + Math.sin(p.angle) * 18,
          vx: Math.cos(p.angle) * projSpeed,
          vy: Math.sin(p.angle) * projSpeed,
          damage: baseDamage, isEnemy: false, color: "#00f0ff", radius: 4, life: 75
        });

        // Double Shot at Weapon Level 3+
        if (upgrades.weaponDamage.level >= 3) {
          const spread = 0.12;
          projectilesRef.current.push({
            id: nextEntityId.current++,
            x: p.x + Math.cos(p.angle + spread) * 18,
            y: p.y + Math.sin(p.angle + spread) * 18,
            vx: Math.cos(p.angle + spread) * projSpeed,
            vy: Math.sin(p.angle + spread) * projSpeed,
            damage: baseDamage * 0.85, isEnemy: false, color: "#38bdf8", radius: 3.5, life: 75
          });
          projectilesRef.current.push({
            id: nextEntityId.current++,
            x: p.x + Math.cos(p.angle - spread) * 18,
            y: p.y + Math.sin(p.angle - spread) * 18,
            vx: Math.cos(p.angle - spread) * projSpeed,
            vy: Math.sin(p.angle - spread) * projSpeed,
            damage: baseDamage * 0.85, isEnemy: false, color: "#38bdf8", radius: 3.5, life: 75
          });
        }

        audioEngine.playLaser(1.0);
      }

      // Orbital Defense Drones Logic
      const droneCount = upgrades.drones.level;
      if (droneCount > 0) {
        const droneTime = currentTime * 0.003;
        for (let i = 0; i < droneCount; i++) {
          const droneAngle = droneTime + (i * Math.PI * 2) / droneCount;
          const droneX = p.x + Math.cos(droneAngle) * 55;
          const droneY = p.y + Math.sin(droneAngle) * 55;

          // Drone auto-fire closest enemy
          if (Math.random() < 0.06 && enemiesRef.current.length > 0) {
            let closest: Enemy | null = null;
            let minDist = 300;
            enemiesRef.current.forEach((e) => {
              const d = Math.hypot(e.x - droneX, e.y - droneY);
              if (d < minDist) {
                minDist = d;
                closest = e;
              }
            });

            if (closest) {
              const aimAngle = Math.atan2((closest as Enemy).y - droneY, (closest as Enemy).x - droneX);
              projectilesRef.current.push({
                id: nextEntityId.current++,
                x: droneX, y: droneY,
                vx: Math.cos(aimAngle) * 12, vy: Math.sin(aimAngle) * 12,
                damage: 8 + upgrades.drones.level * 4, isEnemy: false, color: "#a855f7", radius: 3, life: 50
              });
            }
          }

          // Draw Drone
          particlesRef.current.push({
            x: droneX, y: droneY, vx: 0, vy: 0, color: "#c084fc", size: 2.5, life: 2, maxLife: 2
          });
        }
      }

      // ----------------------------------------------------------------------
      // C. NEXUS CORE LOGIC & TURRET
      // ----------------------------------------------------------------------
      const nexus = nexusRef.current;
      nexus.pulseTimer += dt * 3;
      nexus.turretAngle += 0.02;

      // Nexus Core Defense Turret Auto-Firing
      if (upgrades.nexusHealth.level >= 2) {
        nexus.turretFireCd--;
        if (nexus.turretFireCd <= 0 && enemiesRef.current.length > 0) {
          nexus.turretFireCd = Math.max(15, 45 - upgrades.nexusHealth.level * 6);
          const target = enemiesRef.current[Math.floor(Math.random() * enemiesRef.current.length)];
          const aimAngle = Math.atan2(target.y - nexus.y, target.x - nexus.x);

          projectilesRef.current.push({
            id: nextEntityId.current++,
            x: nexus.x + Math.cos(aimAngle) * nexus.radius,
            y: nexus.y + Math.sin(aimAngle) * nexus.radius,
            vx: Math.cos(aimAngle) * 10, vy: Math.sin(aimAngle) * 10,
            damage: 15 + upgrades.nexusHealth.level * 5, isEnemy: false, color: "#22c55e", radius: 4, life: 60
          });
        }
      }

      // ----------------------------------------------------------------------
      // D. ENEMY AI & COMBAT UPDATE
      // ----------------------------------------------------------------------
      enemiesRef.current.forEach((enemy) => {
        // Target priority: Nexus Core or Player depending on proximity
        const distToPlayer = Math.hypot(p.x - enemy.x, p.y - enemy.y);
        const distToNexus = Math.hypot(nexus.x - enemy.x, nexus.y - enemy.y);
        const targetObj = distToPlayer < 220 ? p : nexus;

        const aimAngle = Math.atan2(targetObj.y - enemy.y, targetObj.x - enemy.x);
        enemy.angle = aimAngle;

        // Enemy AI movement behaviors
        if (enemy.type === "swarmer") {
          enemy.vx = Math.cos(aimAngle) * 3.4;
          enemy.vy = Math.sin(aimAngle) * 3.4;
        } else if (enemy.type === "interceptor") {
          const orbitAngle = aimAngle + Math.PI / 2;
          enemy.vx = Math.cos(aimAngle) * 2.0 + Math.cos(orbitAngle) * 1.5;
          enemy.vy = Math.sin(aimAngle) * 2.0 + Math.sin(orbitAngle) * 1.5;
        } else if (enemy.type === "sniper") {
          if (distToPlayer > 300) {
            enemy.vx = Math.cos(aimAngle) * 1.8;
            enemy.vy = Math.sin(aimAngle) * 1.8;
          } else {
            enemy.vx *= 0.95;
            enemy.vy *= 0.95;
          }
        } else if (enemy.type === "dreadnought" || enemy.type === "boss") {
          enemy.vx = Math.cos(aimAngle) * (enemy.type === "boss" ? 0.8 : 1.2);
          enemy.vy = Math.sin(aimAngle) * (enemy.type === "boss" ? 0.8 : 1.2);
        }

        enemy.x += enemy.vx;
        enemy.y += enemy.vy;

        // Enemy Weapons Firing
        enemy.fireCd--;
        if (enemy.fireCd <= 0) {
          enemy.fireCd = enemy.type === "boss" ? 30 : enemy.type === "sniper" ? 110 : 70;

          if (enemy.type === "interceptor") {
            projectilesRef.current.push({
              id: nextEntityId.current++,
              x: enemy.x, y: enemy.y,
              vx: Math.cos(aimAngle) * 7, vy: Math.sin(aimAngle) * 7,
              damage: 10, isEnemy: true, color: "#eab308", radius: 4, life: 90
            });
          } else if (enemy.type === "sniper") {
            projectilesRef.current.push({
              id: nextEntityId.current++,
              x: enemy.x, y: enemy.y,
              vx: Math.cos(aimAngle) * 16, vy: Math.sin(aimAngle) * 16,
              damage: 28, isEnemy: true, color: "#3b82f6", radius: 5, life: 80
            });
          } else if (enemy.type === "dreadnought") {
            // Triple Shot Barrage
            for (let a = -0.2; a <= 0.2; a += 0.2) {
              projectilesRef.current.push({
                id: nextEntityId.current++,
                x: enemy.x, y: enemy.y,
                vx: Math.cos(aimAngle + a) * 8, vy: Math.sin(aimAngle + a) * 8,
                damage: 14, isEnemy: true, color: "#f97316", radius: 4.5, life: 80
              });
            }
          } else if (enemy.type === "boss") {
            // Radial Bullet Hell Ring
            for (let b = 0; b < Math.PI * 2; b += Math.PI / 6) {
              projectilesRef.current.push({
                id: nextEntityId.current++,
                x: enemy.x, y: enemy.y,
                vx: Math.cos(b) * 6, vy: Math.sin(b) * 6,
                damage: 16, isEnemy: true, color: "#ec4899", radius: 5, life: 100
              });
            }
          }
        }

        // Collision Enemy vs Nexus Core
        const hitNexusDist = Math.hypot(nexus.x - enemy.x, nexus.y - enemy.y);
        if (hitNexusDist <= nexus.radius + enemy.radius) {
          nexus.hp -= enemy.type === "boss" ? 60 : 25;
          enemy.hp -= 9999; // Destroy on impact with core
          audioEngine.playExplosion(true);
          spawnFloatingText(enemy.x, enemy.y, "-NEXUS DAMAGED-", "#ef4444");

          if (nexus.hp <= 0) {
            setGameState("GAMEOVER");
          }
        }

        // Collision Enemy vs Player
        const hitPlayerDist = Math.hypot(p.x - enemy.x, p.y - enemy.y);
        if (hitPlayerDist <= enemy.radius + 18 && p.invulnerableTime <= 0) {
          damagePlayer(enemy.type === "boss" ? 45 : 18);
          p.invulnerableTime = 25;
        }
      });

      // Damage Player Helper
      const damagePlayer = (dmg: number) => {
        p.shieldRechargeCd = 120; // 2 sec delay for shield recharge
        if (p.shield > 0) {
          if (p.shield >= dmg) {
            p.shield -= dmg;
          } else {
            const overflow = dmg - p.shield;
            p.shield = 0;
            p.hp -= overflow;
          }
        } else {
          p.hp -= dmg;
        }

        audioEngine.playExplosion(false);
        spawnFloatingText(p.x, p.y - 15, `-${dmg}`, "#ef4444");

        if (p.hp <= 0) {
          p.hp = 0;
          setGameState("GAMEOVER");
        }
      };

      // ----------------------------------------------------------------------
      // E. PROJECTILES & COLLISION DETECTION
      // ----------------------------------------------------------------------
      projectilesRef.current.forEach((proj) => {
        proj.x += proj.vx;
        proj.y += proj.vy;
        proj.life--;

        // Projectile vs Enemy
        if (!proj.isEnemy) {
          enemiesRef.current.forEach((enemy) => {
            if (proj.life > 0 && Math.hypot(enemy.x - proj.x, enemy.y - proj.y) <= enemy.radius + proj.radius) {
              enemy.hp -= proj.damage;
              proj.life = 0; // Destroy projectile

              // Hit Impact Particles
              for (let i = 0; i < 5; i++) {
                particlesRef.current.push({
                  x: proj.x, y: proj.y,
                  vx: (Math.random() - 0.5) * 4, vy: (Math.random() - 0.5) * 4,
                  color: proj.color, size: 2.5, life: 12, maxLife: 12
                });
              }

              // Enemy Death Check
              if (enemy.hp <= 0) {
                audioEngine.playExplosion(enemy.type === "boss" || enemy.type === "dreadnought");
                setScore((prev) => prev + enemy.scoreValue);

                // Drop Plasma Crystals
                crystalsRef.current.push({
                  id: nextEntityId.current++,
                  x: enemy.x, y: enemy.y,
                  value: enemy.crystalDropCount, life: 400
                });

                // Explosion particle shockwave
                for (let k = 0; k < 18; k++) {
                  const pAngle = Math.random() * Math.PI * 2;
                  const pSpeed = Math.random() * 6 + 2;
                  particlesRef.current.push({
                    x: enemy.x, y: enemy.y,
                    vx: Math.cos(pAngle) * pSpeed, vy: Math.sin(pAngle) * pSpeed,
                    color: enemy.color, size: Math.random() * 5 + 2, life: 25, maxLife: 25
                  });
                }
              }
            }
          });
        } else {
          // Enemy Projectile vs Player
          if (p.invulnerableTime <= 0 && Math.hypot(p.x - proj.x, p.y - proj.y) <= 18 + proj.radius) {
            damagePlayer(proj.damage);
            proj.life = 0;
          }
          // Enemy Projectile vs Nexus Core
          if (Math.hypot(nexus.x - proj.x, nexus.y - proj.y) <= nexus.radius + proj.radius) {
            nexus.hp -= proj.damage * 0.75;
            proj.life = 0;
            spawnFloatingText(proj.x, proj.y, `-${Math.floor(proj.damage * 0.75)}`, "#f87171");
            if (nexus.hp <= 0) setGameState("GAMEOVER");
          }
        }
      });

      // Filter dead entities
      enemiesRef.current = enemiesRef.current.filter((e) => e.hp > 0);
      projectilesRef.current = projectilesRef.current.filter(
        (p) => p.life > 0 && p.x >= -50 && p.x <= width + 50 && p.y >= -50 && p.y <= height + 50
      );

      // ----------------------------------------------------------------------
      // F. PLASMA CRYSTALS PICKUP
      // ----------------------------------------------------------------------
      crystalsRef.current.forEach((c) => {
        c.life--;
        const distToPlayer = Math.hypot(p.x - c.x, p.y - c.y);
        if (distToPlayer < 120) {
          // Magnet attraction
          c.x += ((p.x - c.x) / distToPlayer) * 6;
          c.y += ((p.y - c.y) / distToPlayer) * 6;
        }

        if (distToPlayer < 24) {
          audioEngine.playCrystalPickup();
          setCrystals((prev) => prev + c.value);
          spawnFloatingText(c.x, c.y - 10, `+${c.value} Crystals`, "#00f0ff");
          c.life = 0;
        }
      });
      crystalsRef.current = crystalsRef.current.filter((c) => c.life > 0);

      // Update Particles & Floating Text
      particlesRef.current.forEach((pt) => {
        pt.x += pt.vx; pt.y += pt.vy; pt.life--;
      });
      particlesRef.current = particlesRef.current.filter((pt) => pt.life > 0);

      floatingTextsRef.current.forEach((ft) => {
        ft.y -= 0.8; ft.life--;
      });
      floatingTextsRef.current = floatingTextsRef.current.filter((ft) => ft.life > 0);

      // ----------------------------------------------------------------------
      // G. RENDERING CANVAS SCENE
      // ----------------------------------------------------------------------
      ctx.fillStyle = "#030712";
      ctx.fillRect(0, 0, width, height);

      // Parallax Grid Background
      ctx.strokeStyle = "rgba(30, 41, 59, 0.4)";
      ctx.lineWidth = 1;
      const gridSize = 50;
      for (let x = 0; x < width; x += gridSize) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, height); ctx.stroke();
      }
      for (let y = 0; y < height; y += gridSize) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(width, y); ctx.stroke();
      }

      // Draw Nexus Core Energy Grid
      const corePulse = Math.sin(nexus.pulseTimer) * 5;
      const nexusGlow = ctx.createRadialGradient(nexus.x, nexus.y, 10, nexus.x, nexus.y, nexus.radius + 30 + corePulse);
      nexusGlow.addColorStop(0, "rgba(34, 197, 94, 0.8)");
      nexusGlow.addColorStop(0.5, "rgba(34, 197, 94, 0.2)");
      nexusGlow.addColorStop(1, "rgba(34, 197, 94, 0)");

      ctx.fillStyle = nexusGlow;
      ctx.beginPath();
      ctx.arc(nexus.x, nexus.y, nexus.radius + 30 + corePulse, 0, Math.PI * 2);
      ctx.fill();

      // Nexus Core Outer Ring & Body
      ctx.fillStyle = "#15803d";
      ctx.beginPath();
      ctx.arc(nexus.x, nexus.y, nexus.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "#4ade80";
      ctx.lineWidth = 4;
      ctx.stroke();

      // Nexus Core Turret Barrel (Level 2+)
      if (upgrades.nexusHealth.level >= 2) {
        ctx.save();
        ctx.translate(nexus.x, nexus.y);
        ctx.rotate(nexus.turretAngle);
        ctx.fillStyle = "#22c55e";
        ctx.fillRect(0, -5, nexus.radius + 15, 10);
        ctx.restore();
      }

      // Nexus Core Health Ring
      const nexusHpPct = nexus.hp / nexus.maxHp;
      ctx.strokeStyle = nexusHpPct > 0.4 ? "#22c55e" : "#ef4444";
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.arc(nexus.x, nexus.y, nexus.radius + 8, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * nexusHpPct);
      ctx.stroke();

      // Draw Plasma Crystals
      crystalsRef.current.forEach((c) => {
        ctx.fillStyle = "#00f0ff";
        ctx.shadowColor = "#00f0ff";
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.arc(c.x, c.y, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      });

      // Draw Projectiles
      projectilesRef.current.forEach((proj) => {
        ctx.fillStyle = proj.color;
        ctx.shadowColor = proj.color;
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.arc(proj.x, proj.y, proj.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      });

      // Draw Enemies
      enemiesRef.current.forEach((enemy) => {
        ctx.save();
        ctx.translate(enemy.x, enemy.y);
        ctx.rotate(enemy.angle);

        ctx.fillStyle = enemy.color;
        ctx.shadowColor = enemy.color;
        ctx.shadowBlur = 12;

        if (enemy.type === "swarmer") {
          ctx.beginPath();
          ctx.moveTo(enemy.radius, 0);
          ctx.lineTo(-enemy.radius, enemy.radius * 0.7);
          ctx.lineTo(-enemy.radius * 0.4, 0);
          ctx.lineTo(-enemy.radius, -enemy.radius * 0.7);
          ctx.closePath();
          ctx.fill();
        } else if (enemy.type === "interceptor" || enemy.type === "sniper") {
          ctx.beginPath();
          ctx.moveTo(enemy.radius * 1.2, 0);
          ctx.lineTo(-enemy.radius, enemy.radius);
          ctx.lineTo(-enemy.radius * 0.5, 0);
          ctx.lineTo(-enemy.radius, -enemy.radius);
          ctx.closePath();
          ctx.fill();
        } else {
          // Dreadnought & Boss octagon shape
          ctx.beginPath();
          for (let i = 0; i < 8; i++) {
            const a = (i * Math.PI) / 4;
            const rx = Math.cos(a) * enemy.radius;
            const ry = Math.sin(a) * enemy.radius;
            if (i === 0) ctx.moveTo(rx, ry);
            else ctx.lineTo(rx, ry);
          }
          ctx.closePath();
          ctx.fill();
        }
        ctx.shadowBlur = 0;
        ctx.restore();

        // Enemy Health Bar
        if (enemy.hp < enemy.maxHp) {
          const barW = enemy.radius * 2;
          ctx.fillStyle = "rgba(0, 0, 0, 0.6)";
          ctx.fillRect(enemy.x - barW / 2, enemy.y - enemy.radius - 12, barW, 4);
          ctx.fillStyle = "#ef4444";
          ctx.fillRect(enemy.x - barW / 2, enemy.y - enemy.radius - 12, barW * (enemy.hp / enemy.maxHp), 4);
        }
      });

      // Draw Player Ship
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.angle);

      ctx.fillStyle = p.invulnerableTime > 0 && Math.floor(currentTime / 50) % 2 === 0 ? "#ffffff" : "#00f0ff";
      ctx.shadowColor = "#00f0ff";
      ctx.shadowBlur = 15;

      // Triangle Starcraft Vessel
      ctx.beginPath();
      ctx.moveTo(20, 0);
      ctx.lineTo(-15, 14);
      ctx.lineTo(-8, 0);
      ctx.lineTo(-15, -14);
      ctx.closePath();
      ctx.fill();
      ctx.shadowBlur = 0;

      // Shield Aura
      if (p.shield > 0) {
        ctx.strokeStyle = "rgba(56, 189, 248, 0.7)";
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(0, 0, 24, 0, Math.PI * 2);
        ctx.stroke();
      }

      ctx.restore();

      // Draw Particles
      particlesRef.current.forEach((pt) => {
        ctx.fillStyle = pt.color;
        ctx.globalAlpha = pt.life / pt.maxLife;
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, pt.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1.0;
      });

      // Draw Floating Text
      ctx.font = "bold 13px Inter, sans-serif";
      ctx.textAlign = "center";
      floatingTextsRef.current.forEach((ft) => {
        ctx.fillStyle = ft.color;
        ctx.globalAlpha = ft.life / 40;
        ctx.fillText(ft.text, ft.x, ft.y);
        ctx.globalAlpha = 1.0;
      });

      animationFrameId.current = requestAnimationFrame(loop);
    };

    animationFrameId.current = requestAnimationFrame(loop);
    return () => {
      if (animationFrameId.current) cancelAnimationFrame(animationFrameId.current);
    };
  }, [gameState, wave, difficulty]);

  // Track Mouse Movement
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    mousePos.current = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
  };

  const handleMouseDown = () => { isMouseDown.current = true; };
  const handleMouseUp = () => { isMouseDown.current = false; };

  // Calculate Upgrade Cost
  const getUpgradeCost = (item: UpgradeItem) => {
    return Math.floor(item.baseCost * Math.pow(item.costMultiplier, item.level - 1));
  };

  return (
    <div className="relative w-full h-[85vh] min-h-[600px] max-h-[850px] bg-slate-950 text-white rounded-2xl overflow-hidden shadow-2xl border border-slate-800 flex flex-col select-none">
      {/* Top Header Bar */}
      <div className="flex items-center justify-between px-6 py-3 bg-slate-900/90 border-b border-slate-800 backdrop-blur z-20">
        <div className="flex items-center gap-4">
          <Link href="/games" className="text-slate-400 hover:text-white transition-colors flex items-center gap-1 text-sm font-semibold">
            <ArrowLeft className="w-4 h-4" /> Games Catalog
          </Link>
          <div className="h-4 w-[1px] bg-slate-800" />
          <h1 className="text-lg font-black tracking-wider bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-500 bg-clip-text text-transparent">
            NEBULA NEXUS OVERDRIVE
          </h1>
        </div>

        <div className="flex items-center gap-6 text-sm font-medium">
          <div className="flex items-center gap-2 text-cyan-400">
            <Sparkles className="w-4 h-4" />
            <span>Crystals: <strong className="text-white font-bold">{crystals}</strong></span>
          </div>
          <div className="flex items-center gap-2 text-amber-400">
            <Trophy className="w-4 h-4" />
            <span>High Score: <strong className="text-white font-bold">{highScore}</strong></span>
          </div>
          <button
            onClick={() => setIsMuted(audioEngine.toggleMute())}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-all"
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-cyan-400" />}
          </button>
        </div>
      </div>

      {/* Main Canvas Viewport & Overlays */}
      <div className="relative flex-1 bg-slate-950 overflow-hidden">
        <canvas
          ref={canvasRef}
          onMouseMove={handleMouseMove}
          onMouseDown={handleMouseDown}
          onMouseUp={handleMouseUp}
          className="w-full h-full cursor-crosshair block"
        />

        {/* ACTIVE GAME HUD */}
        {gameState === "PLAYING" && (
          <div className="absolute inset-0 pointer-events-none p-6 flex flex-col justify-between z-10">
            {/* Top HUD Stats */}
            <div className="flex justify-between items-start">
              {/* Player HP & Shield Bars */}
              <div className="bg-slate-900/80 p-4 rounded-xl border border-slate-800 backdrop-blur w-64 pointer-events-auto shadow-lg">
                <div className="text-xs font-bold text-slate-400 mb-1 flex justify-between">
                  <span>HULL SHIELD</span>
                  <span>{Math.ceil(playerRef.current.shield)} / {playerRef.current.maxShield}</span>
                </div>
                <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden mb-2">
                  <div
                    className="h-full bg-cyan-400 transition-all duration-150"
                    style={{ width: `${(playerRef.current.shield / playerRef.current.maxShield) * 100}%` }}
                  />
                </div>

                <div className="text-xs font-bold text-slate-400 mb-1 flex justify-between">
                  <span>ARMOR INTEGRITY</span>
                  <span>{Math.ceil(playerRef.current.hp)} / {playerRef.current.maxHp}</span>
                </div>
                <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-400 transition-all duration-150"
                    style={{ width: `${(playerRef.current.hp / playerRef.current.maxHp) * 100}%` }}
                  />
                </div>
              </div>

              {/* Wave & Score Center Badge */}
              <div className="text-center bg-slate-900/80 px-6 py-3 rounded-xl border border-slate-800 backdrop-blur shadow-lg">
                <div className="text-xs uppercase font-extrabold tracking-widest text-cyan-400">WAVE {wave}</div>
                <div className="text-2xl font-black tracking-tight text-white">{score.toLocaleString()} PTS</div>
                <div className="text-xs text-slate-400 mt-0.5">{enemiesRemaining} Hostiles Remaining</div>
              </div>

              {/* Nexus Core Status */}
              <div className="bg-slate-900/80 p-4 rounded-xl border border-slate-800 backdrop-blur w-64 pointer-events-auto shadow-lg">
                <div className="text-xs font-bold text-emerald-400 mb-1 flex justify-between">
                  <span>NEXUS CORE INTEGRITY</span>
                  <span>{Math.ceil(nexusRef.current.hp)} / {nexusRef.current.maxHp}</span>
                </div>
                <div className="w-full h-3 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-emerald-500 to-green-400 transition-all duration-150"
                    style={{ width: `${(nexusRef.current.hp / nexusRef.current.maxHp) * 100}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Bottom Ability Cooldown Bar */}
            <div className="flex justify-between items-end">
              <div className="flex gap-3 pointer-events-auto">
                <button
                  onClick={triggerDash}
                  className={`px-4 py-3 rounded-xl border flex items-center gap-2 font-bold text-xs transition-all ${
                    playerRef.current.dashCooldown <= 0
                      ? "bg-cyan-500/20 border-cyan-500 text-cyan-300 hover:bg-cyan-500/30"
                      : "bg-slate-900/60 border-slate-800 text-slate-500"
                  }`}
                >
                  <Rocket className="w-4 h-4" />
                  <span>DASH (Shift)</span>
                </button>

                <button
                  onClick={triggerEMP}
                  className={`px-4 py-3 rounded-xl border flex items-center gap-2 font-bold text-xs transition-all ${
                    playerRef.current.empCooldown <= 0
                      ? "bg-purple-500/20 border-purple-500 text-purple-300 hover:bg-purple-500/30"
                      : "bg-slate-900/60 border-slate-800 text-slate-500"
                  }`}
                >
                  <Zap className="w-4 h-4" />
                  <span>EMP NOVA (E)</span>
                </button>
              </div>

              <div className="pointer-events-auto">
                <button
                  onClick={() => setGameState("PAUSED")}
                  className="p-3 bg-slate-900/80 hover:bg-slate-800 border border-slate-800 rounded-xl text-slate-300 hover:text-white transition-all shadow-lg"
                >
                  <Pause className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* START SCREEN OVERLAY */}
        {gameState === "START" && (
          <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-6 z-30">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="max-w-xl w-full bg-slate-900/90 border border-slate-800 p-8 rounded-2xl shadow-2xl text-center"
            >
              <div className="inline-flex p-4 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 mb-4">
                <Crosshair className="w-10 h-10 animate-pulse" />
              </div>
              <h2 className="text-3xl font-black tracking-wider text-white mb-2">NEBULA NEXUS OVERDRIVE</h2>
              <p className="text-slate-400 text-sm mb-6 leading-relaxed">
                Defend the central Nexus Core against unrelenting rogue AI starfleets. Pilot your tachyon vessel, collect plasma crystals, and install tactical upgrades to survive.
              </p>

              {/* Difficulty Selection */}
              <div className="flex justify-center gap-3 mb-8">
                {(["NORMAL", "HEROIC", "NIGHTMARE"] as Difficulty[]).map((d) => (
                  <button
                    key={d}
                    onClick={() => setDifficulty(d)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all ${
                      difficulty === d
                        ? "bg-cyan-500 border-cyan-400 text-slate-950 shadow-lg shadow-cyan-500/20"
                        : "bg-slate-800/60 border-slate-700 text-slate-400 hover:text-white"
                    }`}
                  >
                    {d}
                  </button>
                ))}
              </div>

              <button
                onClick={startGame}
                className="w-full py-4 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-black rounded-xl text-lg tracking-wider transition-all shadow-xl shadow-cyan-500/20 flex items-center justify-center gap-2"
              >
                <Play className="w-6 h-6 fill-current" /> LAUNCH DEFENSE MISSION
              </button>
            </motion.div>
          </div>
        )}

        {/* UPGRADE SHOP OVERLAY */}
        {gameState === "SHOP" && (
          <div className="absolute inset-0 bg-slate-950/95 backdrop-blur-md flex items-center justify-center p-6 z-30">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="max-w-3xl w-full bg-slate-900 border border-slate-800 p-8 rounded-2xl shadow-2xl"
            >
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="text-2xl font-black text-white flex items-center gap-2">
                    <Sliders className="w-6 h-6 text-cyan-400" /> NEXUS TACTICAL TERMINAL
                  </h3>
                  <p className="text-slate-400 text-xs mt-1">Upgrade your starcraft and core defenses before Wave {wave}</p>
                </div>
                <div className="px-4 py-2 bg-slate-800 rounded-xl border border-slate-700 text-cyan-400 font-bold text-sm flex items-center gap-2">
                  <Sparkles className="w-4 h-4" /> {crystals} Plasma Crystals
                </div>
              </div>

              {/* Upgrade Grid */}
              <div className="grid grid-cols-2 gap-4 mb-8">
                {Object.values(upgrades).map((item) => {
                  const cost = getUpgradeCost(item);
                  const isMax = item.level >= item.maxLevel;
                  const canAfford = crystals >= cost && !isMax;

                  return (
                    <div
                      key={item.id}
                      className="bg-slate-950/60 p-4 rounded-xl border border-slate-800/80 flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex justify-between items-start mb-1">
                          <h4 className="font-bold text-sm text-white">{item.name}</h4>
                          <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                            Lvl {item.level}/{item.maxLevel}
                          </span>
                        </div>
                        <p className="text-slate-400 text-xs mb-3">{item.description}</p>
                      </div>

                      <button
                        onClick={() => buyUpgrade(item.id)}
                        disabled={!canAfford}
                        className={`w-full py-2.5 rounded-lg font-bold text-xs flex items-center justify-center gap-1.5 transition-all ${
                          isMax
                            ? "bg-slate-800 text-slate-500 cursor-not-allowed"
                            : canAfford
                            ? "bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-md shadow-cyan-500/20"
                            : "bg-slate-800 text-slate-500 cursor-not-allowed"
                        }`}
                      >
                        {isMax ? "MAXED OUT" : `UPGRADE (${cost} C)`}
                      </button>
                    </div>
                  );
                })}
              </div>

              <button
                onClick={() => setGameState("PLAYING")}
                className="w-full py-3.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-xl text-base tracking-wider transition-all shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2"
              >
                ENGAGE NEXT WAVE <ChevronRight className="w-5 h-5" />
              </button>
            </motion.div>
          </div>
        )}

        {/* PAUSE OVERLAY */}
        {gameState === "PAUSED" && (
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-6 z-30">
            <div className="bg-slate-900 border border-slate-800 p-8 rounded-2xl max-w-sm w-full text-center shadow-2xl">
              <h3 className="text-2xl font-black text-white mb-6">DEFENSE PAUSED</h3>
              <div className="space-y-3">
                <button
                  onClick={() => setGameState("PLAYING")}
                  className="w-full py-3 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold rounded-xl text-sm transition-all"
                >
                  RESUME MISSION
                </button>
                <button
                  onClick={startGame}
                  className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-xl text-sm transition-all"
                >
                  RESTART GAME
                </button>
              </div>
            </div>
          </div>
        )}

        {/* GAMEOVER OVERLAY */}
        {gameState === "GAMEOVER" && (
          <div className="absolute inset-0 bg-slate-950/95 backdrop-blur-md flex items-center justify-center p-6 z-30">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="max-w-md w-full bg-slate-900 border border-slate-800 p-8 rounded-2xl text-center shadow-2xl"
            >
              <div className="inline-flex p-4 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-400 mb-4">
                <Shield className="w-10 h-10" />
              </div>
              <h3 className="text-3xl font-black text-white mb-1">NEXUS BREACHED</h3>
              <p className="text-slate-400 text-sm mb-6">Mission failed. The core has been destroyed.</p>

              <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800/80 mb-6 space-y-2 text-sm">
                <div className="flex justify-between text-slate-400">
                  <span>Waves Survived</span>
                  <strong className="text-white">{wave - 1}</strong>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Final Score</span>
                  <strong className="text-cyan-400 font-bold">{score.toLocaleString()}</strong>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>All-Time High Score</span>
                  <strong className="text-amber-400 font-bold">{highScore.toLocaleString()}</strong>
                </div>
              </div>

              <button
                onClick={startGame}
                className="w-full py-4 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-black rounded-xl text-base tracking-wider transition-all shadow-xl shadow-cyan-500/20 flex items-center justify-center gap-2"
              >
                <RotateCcw className="w-5 h-5" /> RE-DEPLOY DEFENSES
              </button>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
}
