"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import {
  Zap,
  Shield,
  Crosshair,
  Volume2,
  VolumeX,
  Pause,
  Play,
  RotateCcw,
  Trophy,
  Flame,
  Sparkles,
  Cpu,
  Skull,
  ArrowLeft,
  ShoppingCart,
  Check,
  Radio,
} from "lucide-react";
import Link from "next/link";

// ==========================================
// TYPES & INTERFACES
// ==========================================

export type WeaponType = "plasma" | "scatter" | "beam" | "missile";

export interface WeaponConfig {
  id: WeaponType;
  name: string;
  fireRateMs: number; // Cooldown between shots
  damage: number;
  energyCost: number;
  color: string;
  unlocked: boolean;
  cost: number;
  description: string;
}

export interface Enemy {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  angle: number;
  type: "scout" | "chaser" | "titan" | "wraith" | "boss";
  hp: number;
  maxHp: number;
  speed: number;
  scoreValue: number;
  creditsValue: number;
  attackCooldown: number;
  color: string;
  radius: number;
  bossPhase?: number;
  teleportTimer?: number;
}

export interface Projectile {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  angle: number;
  damage: number;
  color: string;
  isEnemy: boolean;
  duration: number; // Life frames
  type: WeaponType | "enemy_laser" | "enemy_orb" | "boss_beam";
  radius: number;
  targetEnemyId?: string;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  radius: number;
  alpha: number;
  decay: number;
  shape?: "circle" | "spark" | "ring" | "text";
  text?: string;
}

export interface DropItem {
  id: string;
  x: number;
  y: number;
  type: "health" | "shield" | "energy" | "quad_damage" | "quantum_core";
  radius: number;
  duration: number;
  color: string;
}

export interface Star {
  x: number;
  y: number;
  size: number;
  speed: number;
  alpha: number;
}

export interface UpgradeItem {
  id: string;
  name: string;
  level: number;
  maxLevel: number;
  baseCost: number;
  costMultiplier: number;
  description: string;
  icon: string;
}

// ==========================================
// WEB AUDIO SYNTHESIZER (PROCEDURAL SFX)
// ==========================================

class SoundEngine {
  private ctx: AudioContext | null = null;
  public muted: boolean = false;

  private init() {
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

  public playLaser(type: WeaponType) {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    if (type === "plasma") {
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(800, now);
      osc.frequency.exponentialRampToValueAtTime(100, now + 0.12);
      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.12);
      osc.start(now);
      osc.stop(now + 0.12);
    } else if (type === "scatter") {
      osc.type = "square";
      osc.frequency.setValueAtTime(450, now);
      osc.frequency.exponentialRampToValueAtTime(80, now + 0.18);
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.18);
      osc.start(now);
      osc.stop(now + 0.18);
    } else if (type === "beam") {
      osc.type = "sine";
      osc.frequency.setValueAtTime(1200, now);
      osc.frequency.linearRampToValueAtTime(900, now + 0.25);
      gain.gain.setValueAtTime(0.22, now);
      gain.gain.linearRampToValueAtTime(0.01, now + 0.25);
      osc.start(now);
      osc.stop(now + 0.25);
    } else if (type === "missile") {
      osc.type = "triangle";
      osc.frequency.setValueAtTime(200, now);
      osc.frequency.exponentialRampToValueAtTime(600, now + 0.2);
      gain.gain.setValueAtTime(0.18, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.22);
      osc.start(now);
      osc.stop(now + 0.22);
    }
  }

  public playExplosion(heavy: boolean = false) {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const dur = heavy ? 0.45 : 0.22;

    // Noise buffer synthesis
    const bufferSize = this.ctx.sampleRate * dur;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(heavy ? 400 : 800, now);
    filter.frequency.exponentialRampToValueAtTime(30, now + dur);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(heavy ? 0.35 : 0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + dur);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);

    noise.start(now);
    noise.stop(now + dur);
  }

  public playPowerup() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(300, now);
    osc.frequency.setValueAtTime(450, now + 0.08);
    osc.frequency.setValueAtTime(600, now + 0.16);
    osc.frequency.setValueAtTime(900, now + 0.24);

    gain.gain.setValueAtTime(0.15, now);
    gain.gain.linearRampToValueAtTime(0.01, now + 0.32);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.32);
  }

  public playEMP() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(120, now);
    osc.frequency.exponentialRampToValueAtTime(1400, now + 0.4);

    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.45);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.45);
  }

  public playBossAlert() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(220, now);
    osc.frequency.setValueAtTime(440, now + 0.15);
    osc.frequency.setValueAtTime(220, now + 0.3);
    osc.frequency.setValueAtTime(440, now + 0.45);

    gain.gain.setValueAtTime(0.2, now);
    gain.gain.linearRampToValueAtTime(0.01, now + 0.6);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.6);
  }
}

const audio = new SoundEngine();

// ==========================================
// MAIN COMPONENT
// ==========================================

export default function QuantumVanguard() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Game UI States
  const [gameState, setGameState] = useState<"MENU" | "PLAYING" | "PAUSED" | "SHOP" | "GAMEOVER">("MENU");
  const [score, setScore] = useState<number>(0);
  const [highScore, setHighScore] = useState<number>(0);
  const [wave, setWave] = useState<number>(1);
  const [quantumCores, setQuantumCores] = useState<number>(100);
  const [playerHp, setPlayerHp] = useState<number>(100);
  const [maxHp, setMaxHp] = useState<number>(100);
  const [playerShield, setPlayerShield] = useState<number>(100);
  const [maxShield, setMaxShield] = useState<number>(100);
  const [playerEnergy, setPlayerEnergy] = useState<number>(100);
  const [maxEnergy, setMaxEnergy] = useState<number>(100);
  const [selectedWeapon, setSelectedWeapon] = useState<WeaponType>("plasma");
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [empCooldownPct, setEmpCooldownPct] = useState<number>(100);
  const [bulletTimePct, setBulletTimePct] = useState<number>(100);
  const [bossHp, setBossHp] = useState<{ current: number; max: number; name: string } | null>(null);
  const [kills, setKills] = useState<number>(0);

  // Weapons State
  const [weapons, setWeapons] = useState<Record<WeaponType, WeaponConfig>>({
    plasma: {
      id: "plasma",
      name: "Plasma Pulse",
      fireRateMs: 140,
      damage: 22,
      energyCost: 2,
      color: "#00f3ff",
      unlocked: true,
      cost: 0,
      description: "Rapid single-target energy bursts with high precision.",
    },
    scatter: {
      id: "scatter",
      name: "Scatter Cannon",
      fireRateMs: 320,
      damage: 14, // 5 pellets
      energyCost: 8,
      color: "#ff0055",
      unlocked: false,
      cost: 250,
      description: "Fires a 5-way spread of fiery plasma pellets for close combat.",
    },
    beam: {
      id: "beam",
      name: "Quantum Laser",
      fireRateMs: 80,
      damage: 12,
      energyCost: 4,
      color: "#39ff14",
      unlocked: false,
      cost: 500,
      description: "High-frequency piercing laser beam.",
    },
    missile: {
      id: "missile",
      name: "Homing Rockets",
      fireRateMs: 450,
      damage: 65,
      energyCost: 15,
      color: "#ffaa00",
      unlocked: false,
      cost: 850,
      description: "Launches lock-on self-guided explosive warheads.",
    },
  });

  // Upgrades State
  const [upgrades, setUpgrades] = useState<UpgradeItem[]>([
    { id: "maxHp", name: "Hull Armor", level: 1, maxLevel: 10, baseCost: 100, costMultiplier: 1.5, description: "+20 Max Hull Integrity", icon: "Shield" },
    { id: "maxShield", name: "Quantum Barrier", level: 1, maxLevel: 10, baseCost: 120, costMultiplier: 1.5, description: "+20 Max Shield Capacity", icon: "Zap" },
    { id: "damage", name: "Plasma Core", level: 1, maxLevel: 10, baseCost: 150, costMultiplier: 1.6, description: "+15% Weapon Damage", icon: "Flame" },
    { id: "energyRegen", name: "Reactor Core", level: 1, maxLevel: 10, baseCost: 100, costMultiplier: 1.4, description: "+25% Energy Regeneration", icon: "Cpu" },
    { id: "speed", name: "Ion Thrusters", level: 1, maxLevel: 5, baseCost: 140, costMultiplier: 1.8, description: "+10% Vessel Speed", icon: "Sparkles" },
  ]);

  // Game Engine Mutable Refs (to avoid React re-render lag during 60FPS loop)
  const engineRef = useRef({
    player: {
      x: 600,
      y: 400,
      vx: 0,
      vy: 0,
      angle: 0,
      hp: 100,
      maxHp: 100,
      shield: 100,
      maxShield: 100,
      energy: 100,
      maxEnergy: 100,
      energyRegen: 0.35,
      speed: 5.5,
      damageMultiplier: 1,
      empTimer: 0,
      empMaxTimer: 450, // frames (~7.5s)
      bulletTimeTimer: 0,
      bulletTimeMaxTimer: 360,
      isBulletTimeActive: false,
      lastShotTime: 0,
      quadDamageTimer: 0,
    },
    enemies: [] as Enemy[],
    projectiles: [] as Projectile[],
    particles: [] as Particle[],
    drops: [] as DropItem[],
    stars: [] as Star[],
    keys: {} as Record<string, boolean>,
    mouse: { x: 600, y: 400, isDown: false },
    screenShake: 0,
    waveInProgress: false,
    waveEnemiesToSpawn: 0,
    spawnTimer: 0,
    waveNumber: 1,
    currentKills: 0,
    currentScore: 0,
    cores: 100,
  });

  // Load Highscore from localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("qv2099_highscore");
      if (saved) setHighScore(parseInt(saved, 10));
    }
  }, []);

  // Initialize Parallax Stars
  const initStars = useCallback(() => {
    const stars: Star[] = [];
    for (let i = 0; i < 120; i++) {
      stars.push({
        x: Math.random() * 1920,
        y: Math.random() * 1080,
        size: Math.random() * 2 + 0.8,
        speed: Math.random() * 0.8 + 0.2,
        alpha: Math.random() * 0.7 + 0.3,
      });
    }
    engineRef.current.stars = stars;
  }, []);

  // Start / Reset Game
  const startNewGame = () => {
    const e = engineRef.current;
    e.player.hp = maxHp;
    e.player.maxHp = maxHp;
    e.player.shield = maxShield;
    e.player.maxShield = maxShield;
    e.player.energy = maxEnergy;
    e.player.maxEnergy = maxEnergy;
    e.player.x = (canvasRef.current?.width || 1200) / 2;
    e.player.y = (canvasRef.current?.height || 800) / 2;
    e.player.vx = 0;
    e.player.vy = 0;
    e.player.empTimer = 0;
    e.player.bulletTimeTimer = 0;
    e.player.isBulletTimeActive = false;

    e.enemies = [];
    e.projectiles = [];
    e.particles = [];
    e.drops = [];
    e.currentScore = 0;
    e.currentKills = 0;
    e.waveNumber = 1;
    e.waveInProgress = false;
    e.waveEnemiesToSpawn = 0;

    setScore(0);
    setKills(0);
    setWave(1);
    setPlayerHp(maxHp);
    setPlayerShield(maxShield);
    setPlayerEnergy(maxEnergy);
    setBossHp(null);
    setGameState("PLAYING");

    startWave(1);
  };

  // Wave Spawner Routine
  const startWave = (waveNum: number) => {
    const e = engineRef.current;
    e.waveNumber = waveNum;
    e.waveInProgress = true;
    e.waveEnemiesToSpawn = 10 + waveNum * 4;

    // Boss Wave check
    if (waveNum % 5 === 0) {
      audio.playBossAlert();
      const bossHpVal = 1200 + waveNum * 600;
      e.enemies.push({
        id: "boss_" + Date.now(),
        x: (canvasRef.current?.width || 1200) / 2,
        y: 100,
        vx: 0,
        vy: 0,
        angle: Math.PI / 2,
        type: "boss",
        hp: bossHpVal,
        maxHp: bossHpVal,
        speed: 1.8,
        scoreValue: 2500,
        creditsValue: 300,
        attackCooldown: 0,
        color: "#ff0055",
        radius: 65,
        bossPhase: 1,
      });
      setBossHp({ current: bossHpVal, max: bossHpVal, name: `MOTHER DREADNOUGHT (WAVE ${waveNum})` });
    }

    // Add float notification text
    createFloatingText((canvasRef.current?.width || 1200) / 2, 250, `WAVE ${waveNum} ENGAGED!`, "#00f3ff");
  };

  // Helper Floating Text Effects
  const createFloatingText = (x: number, y: number, text: string, color: string = "#ffffff") => {
    engineRef.current.particles.push({
      x,
      y,
      vx: (Math.random() - 0.5) * 1.5,
      vy: -1.5,
      color,
      radius: 14,
      alpha: 1,
      decay: 0.02,
      shape: "text",
      text,
    });
  };

  // Helper Explosions
  const createExplosion = (x: number, y: number, color: string = "#ff5500", count: number = 20, heavy: boolean = false) => {
    audio.playExplosion(heavy);
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * (heavy ? 8 : 5) + 1;
      engineRef.current.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color,
        radius: Math.random() * (heavy ? 6 : 4) + 2,
        alpha: 1,
        decay: Math.random() * 0.03 + 0.015,
        shape: Math.random() > 0.5 ? "spark" : "circle",
      });
    }
  };

  // Fire Weapon Trigger
  const shootWeapon = () => {
    const e = engineRef.current;
    const p = e.player;
    const now = performance.now();
    const wConfig = weapons[selectedWeapon];

    if (!wConfig.unlocked) return;
    if (now - p.lastShotTime < wConfig.fireRateMs) return;
    if (p.energy < wConfig.energyCost) return;

    p.energy -= wConfig.energyCost;
    p.lastShotTime = now;
    audio.playLaser(selectedWeapon);

    // Screen Shake recoil
    e.screenShake = Math.max(e.screenShake, 3);

    const dmg = wConfig.damage * p.damageMultiplier * (p.quadDamageTimer > 0 ? 4 : 1);
    const speed = 16;
    const spread = 0.08;

    if (selectedWeapon === "plasma") {
      const angle = p.angle + (Math.random() - 0.5) * spread;
      e.projectiles.push({
        id: "proj_" + Math.random(),
        x: p.x + Math.cos(p.angle) * 20,
        y: p.y + Math.sin(p.angle) * 20,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        angle,
        damage: dmg,
        color: wConfig.color,
        isEnemy: false,
        duration: 90,
        type: "plasma",
        radius: 4,
      });
    } else if (selectedWeapon === "scatter") {
      const count = 5;
      for (let i = 0; i < count; i++) {
        const offsetAngle = p.angle + (i - (count - 1) / 2) * 0.12;
        e.projectiles.push({
          id: "proj_" + Math.random(),
          x: p.x + Math.cos(p.angle) * 15,
          y: p.y + Math.sin(p.angle) * 15,
          vx: Math.cos(offsetAngle) * (speed * 0.9),
          vy: Math.sin(offsetAngle) * (speed * 0.9),
          angle: offsetAngle,
          damage: dmg * 0.7,
          color: wConfig.color,
          isEnemy: false,
          duration: 45,
          type: "scatter",
          radius: 3,
        });
      }
    } else if (selectedWeapon === "beam") {
      e.projectiles.push({
        id: "proj_" + Math.random(),
        x: p.x + Math.cos(p.angle) * 25,
        y: p.y + Math.sin(p.angle) * 25,
        vx: Math.cos(p.angle) * (speed * 1.4),
        vy: Math.sin(p.angle) * (speed * 1.4),
        angle: p.angle,
        damage: dmg,
        color: wConfig.color,
        isEnemy: false,
        duration: 70,
        type: "beam",
        radius: 6,
      });
    } else if (selectedWeapon === "missile") {
      // Find nearest enemy for lock-on
      let nearestId: string | undefined = undefined;
      let minDist = 99999;
      e.enemies.forEach((enemy) => {
        const dist = Math.hypot(enemy.x - p.x, enemy.y - p.y);
        if (dist < minDist) {
          minDist = dist;
          nearestId = enemy.id;
        }
      });

      e.projectiles.push({
        id: "proj_" + Math.random(),
        x: p.x,
        y: p.y,
        vx: Math.cos(p.angle) * 6,
        vy: Math.sin(p.angle) * 6,
        angle: p.angle,
        damage: dmg,
        color: wConfig.color,
        isEnemy: false,
        duration: 180,
        type: "missile",
        radius: 7,
        targetEnemyId: nearestId,
      });
    }
  };

  // Trigger EMP Nova Blast
  const triggerEMP = () => {
    const p = engineRef.current.player;
    if (p.empTimer < p.empMaxTimer) return;

    p.empTimer = 0;
    audio.playEMP();
    engineRef.current.screenShake = 12;

    // Clear enemy projectiles & stun enemies
    engineRef.current.projectiles = engineRef.current.projectiles.filter((proj) => !proj.isEnemy);
    engineRef.current.enemies.forEach((enemy) => {
      enemy.hp -= 80 * p.damageMultiplier;
      createExplosion(enemy.x, enemy.y, "#00ffff", 12);
    });

    // Expanding shockwave particle ring
    for (let i = 0; i < 36; i++) {
      const a = (i / 36) * Math.PI * 2;
      engineRef.current.particles.push({
        x: p.x,
        y: p.y,
        vx: Math.cos(a) * 12,
        vy: Math.sin(a) * 12,
        color: "#00f3ff",
        radius: 5,
        alpha: 1,
        decay: 0.02,
        shape: "ring",
      });
    }
  };

  // Trigger Time Dilation (Bullet Time)
  const toggleBulletTime = () => {
    const p = engineRef.current.player;
    if (!p.isBulletTimeActive && p.bulletTimeTimer >= p.bulletTimeMaxTimer) {
      p.isBulletTimeActive = true;
      createFloatingText(p.x, p.y - 30, "BULLET TIME ACTIVE", "#ff00ff");
    } else {
      p.isBulletTimeActive = false;
    }
  };

  // Upgrade Purchase
  const buyUpgrade = (upgradeId: string) => {
    const item = upgrades.find((u) => u.id === upgradeId);
    if (!item || item.level >= item.maxLevel) return;

    const cost = Math.floor(item.baseCost * Math.pow(item.costMultiplier, item.level - 1));
    if (quantumCores < cost) return;

    setQuantumCores((prev) => prev - cost);
    engineRef.current.cores -= cost;

    setUpgrades((prev) =>
      prev.map((u) => (u.id === upgradeId ? { ...u, level: u.level + 1 } : u))
    );

    // Apply upgrade to player engine values
    const p = engineRef.current.player;
    if (upgradeId === "maxHp") {
      setMaxHp((prev) => prev + 20);
      p.maxHp += 20;
      p.hp += 20;
    } else if (upgradeId === "maxShield") {
      setMaxShield((prev) => prev + 20);
      p.maxShield += 20;
      p.shield += 20;
    } else if (upgradeId === "damage") {
      p.damageMultiplier += 0.15;
    } else if (upgradeId === "energyRegen") {
      p.energyRegen += 0.08;
    } else if (upgradeId === "speed") {
      p.speed += 0.55;
    }

    audio.playPowerup();
  };

  // Unlock Weapon Purchase
  const unlockWeapon = (wId: WeaponType) => {
    const w = weapons[wId];
    if (w.unlocked || quantumCores < w.cost) return;

    setQuantumCores((prev) => prev - w.cost);
    engineRef.current.cores -= w.cost;

    setWeapons((prev) => ({
      ...prev,
      [wId]: { ...prev[wId], unlocked: true },
    }));

    setSelectedWeapon(wId);
    audio.playPowerup();
  };

  // Listeners for Keyboard & Mouse Controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      engineRef.current.keys[e.code] = true;
      if (e.code === "Space") {
        e.preventDefault();
        triggerEMP();
      }
      if (e.code === "ShiftLeft" || e.code === "KeyE") {
        toggleBulletTime();
      }
      if (e.code === "Digit1") setSelectedWeapon("plasma");
      if (e.code === "Digit2" && weapons.scatter.unlocked) setSelectedWeapon("scatter");
      if (e.code === "Digit3" && weapons.beam.unlocked) setSelectedWeapon("beam");
      if (e.code === "Digit4" && weapons.missile.unlocked) setSelectedWeapon("missile");
      if (e.code === "KeyP") {
        setGameState((prev) => (prev === "PLAYING" ? "PAUSED" : prev === "PAUSED" ? "PLAYING" : prev));
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      engineRef.current.keys[e.code] = false;
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
  }, [weapons]);

  // MAIN GAME ENGINE LOOP (60 FPS)
  useEffect(() => {
    initStars();
    let animationFrameId: number;

    const render = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const width = (canvas.width = canvas.parentElement?.clientWidth || 1200);
      const height = (canvas.height = canvas.parentElement?.clientHeight || 750);

      const e = engineRef.current;
      const p = e.player;

      if (gameState === "PLAYING") {
        // Time scale for bullet time
        const timeScale = p.isBulletTimeActive ? 0.35 : 1;

        // Drain Bullet Time
        if (p.isBulletTimeActive) {
          p.bulletTimeTimer -= 2.5;
          if (p.bulletTimeTimer <= 0) {
            p.isBulletTimeActive = false;
          }
        } else if (p.bulletTimeTimer < p.bulletTimeMaxTimer) {
          p.bulletTimeTimer += 0.5;
        }

        // Charge EMP
        if (p.empTimer < p.empMaxTimer) {
          p.empTimer++;
        }

        // Regenerate Energy
        p.energy = Math.min(p.maxEnergy, p.energy + p.energyRegen);

        // Regenerate Shield (if out of combat for a bit)
        p.shield = Math.min(p.maxShield, p.shield + 0.05);

        // Quad damage timer
        if (p.quadDamageTimer > 0) p.quadDamageTimer--;

        // Player Movement Controls (WASD / Arrows)
        let moveX = 0;
        let moveY = 0;
        if (e.keys["KeyW"] || e.keys["ArrowUp"]) moveY -= 1;
        if (e.keys["KeyS"] || e.keys["ArrowDown"]) moveY += 1;
        if (e.keys["KeyA"] || e.keys["ArrowLeft"]) moveX -= 1;
        if (e.keys["KeyD"] || e.keys["ArrowRight"]) moveX += 1;

        if (moveX !== 0 && moveY !== 0) {
          moveX *= 0.7071;
          moveY *= 0.7071;
        }

        p.vx = p.vx * 0.88 + moveX * p.speed * 0.2;
        p.vy = p.vy * 0.88 + moveY * p.speed * 0.2;

        p.x += p.vx;
        p.y += p.vy;

        // Keep inside bounds
        p.x = Math.max(25, Math.min(width - 25, p.x));
        p.y = Math.max(25, Math.min(height - 25, p.y));

        // Player Aim Rotation toward mouse cursor
        const dx = e.mouse.x - p.x;
        const dy = e.mouse.y - p.y;
        p.angle = Math.atan2(dy, dx);

        // Auto-shoot if mouse button down
        if (e.mouse.isDown) {
          shootWeapon();
        }

        // Spawn Wave Enemies gradually
        if (e.waveInProgress && e.waveEnemiesToSpawn > 0) {
          e.spawnTimer++;
          if (e.spawnTimer > 35) {
            e.spawnTimer = 0;
            e.waveEnemiesToSpawn--;

            // Pick random edge position
            let sx = 0,
              sy = 0;
            if (Math.random() > 0.5) {
              sx = Math.random() > 0.5 ? -20 : width + 20;
              sy = Math.random() * height;
            } else {
              sx = Math.random() * width;
              sy = Math.random() > 0.5 ? -20 : height + 20;
            }

            // Decide enemy type based on wave number
            const rand = Math.random();
            let type: Enemy["type"] = "scout";
            let hp = 40 + e.waveNumber * 10;
            let speed = 2.8;
            let radius = 16;
            let color = "#00f3ff";
            let scoreVal = 50;

            if (rand > 0.75 && e.waveNumber >= 3) {
              type = "titan";
              hp = 220 + e.waveNumber * 40;
              speed = 1.2;
              radius = 28;
              color = "#ffaa00";
              scoreVal = 180;
            } else if (rand > 0.5 && e.waveNumber >= 2) {
              type = "chaser";
              hp = 65 + e.waveNumber * 15;
              speed = 3.8;
              radius = 14;
              color = "#ff0055";
              scoreVal = 90;
            } else if (rand > 0.88 && e.waveNumber >= 4) {
              type = "wraith";
              hp = 90 + e.waveNumber * 20;
              speed = 3.0;
              radius = 18;
              color = "#b000ff";
              scoreVal = 220;
            }

            e.enemies.push({
              id: "enemy_" + Math.random(),
              x: sx,
              y: sy,
              vx: 0,
              vy: 0,
              angle: 0,
              type,
              hp,
              maxHp: hp,
              speed,
              scoreValue: scoreVal,
              creditsValue: Math.floor(scoreVal / 5),
              attackCooldown: 0,
              color,
              radius,
            });
          }
        }

        // Wave Clearance Check
        if (e.waveInProgress && e.waveEnemiesToSpawn <= 0 && e.enemies.length === 0) {
          e.waveInProgress = false;
          // Wave complete bonus!
          const bonusCores = 50 + e.waveNumber * 25;
          setQuantumCores((prev) => prev + bonusCores);
          e.cores += bonusCores;
          createFloatingText(width / 2, height / 2, `WAVE ${e.waveNumber} CLEAR! +${bonusCores} CORES`, "#39ff14");

          setTimeout(() => {
            startWave(e.waveNumber + 1);
            setWave(e.waveNumber + 1);
          }, 3000);
        }

        // Update Enemies AI
        for (let i = e.enemies.length - 1; i >= 0; i--) {
          const enemy = e.enemies[i];
          const edx = p.x - enemy.x;
          const edy = p.y - enemy.y;
          const dist = Math.hypot(edx, edy);
          enemy.angle = Math.atan2(edy, edx);

          if (enemy.type === "boss") {
            // Boss Movement & Multi-Phase Attacks
            enemy.x += Math.sin(Date.now() * 0.001) * 2 * timeScale;
            enemy.attackCooldown += timeScale;

            if (enemy.attackCooldown > 40) {
              enemy.attackCooldown = 0;
              // Phase 1: Triple burst
              for (let b = -1; b <= 1; b++) {
                const bAngle = enemy.angle + b * 0.25;
                e.projectiles.push({
                  id: "e_proj_" + Math.random(),
                  x: enemy.x,
                  y: enemy.y,
                  vx: Math.cos(bAngle) * 7,
                  vy: Math.sin(bAngle) * 7,
                  angle: bAngle,
                  damage: 18,
                  color: "#ff0055",
                  isEnemy: true,
                  duration: 180,
                  type: "enemy_orb",
                  radius: 8,
                });
              }
            }
            // Update Boss HUD
            setBossHp({ current: Math.max(0, enemy.hp), max: enemy.maxHp, name: `MOTHER DREADNOUGHT (WAVE ${e.waveNumber})` });
          } else {
            // Standard Enemy Movement
            enemy.vx = Math.cos(enemy.angle) * enemy.speed * timeScale;
            enemy.vy = Math.sin(enemy.angle) * enemy.speed * timeScale;
            enemy.x += enemy.vx;
            enemy.y += enemy.vy;

            // Ranged enemy shooting
            if (enemy.type === "titan") {
              enemy.attackCooldown += timeScale;
              if (enemy.attackCooldown > 90) {
                enemy.attackCooldown = 0;
                e.projectiles.push({
                  id: "e_proj_" + Math.random(),
                  x: enemy.x,
                  y: enemy.y,
                  vx: Math.cos(enemy.angle) * 6,
                  vy: Math.sin(enemy.angle) * 6,
                  angle: enemy.angle,
                  damage: 15,
                  color: "#ffaa00",
                  isEnemy: true,
                  duration: 120,
                  type: "enemy_laser",
                  radius: 6,
                });
              }
            }
          }

          // Enemy Collision with Player
          if (dist < enemy.radius + 20) {
            // Damage Player
            const rawDmg = enemy.type === "boss" ? 35 : enemy.type === "titan" ? 25 : 12;

            if (p.shield > 0) {
              const absorbed = Math.min(p.shield, rawDmg);
              p.shield -= absorbed;
              const overflow = rawDmg - absorbed;
              p.hp -= overflow;
            } else {
              p.hp -= rawDmg;
            }

            e.screenShake = 8;
            audio.playExplosion(false);
            createExplosion(p.x, p.y, "#00f3ff", 8);

            if (enemy.type !== "boss") {
              enemy.hp -= 50; // recoil damage to enemy
            }
          }

          // Death check
          if (enemy.hp <= 0) {
            createExplosion(enemy.x, enemy.y, enemy.color, enemy.type === "boss" ? 60 : 25, enemy.type === "boss");
            e.currentScore += enemy.scoreValue;
            e.currentKills++;
            setScore(e.currentScore);
            setKills(e.currentKills);

            // Item drop chance
            if (Math.random() < 0.35 || enemy.type === "boss") {
              const dropTypes: DropItem["type"][] = ["health", "shield", "energy", "quad_damage", "quantum_core"];
              const dType = dropTypes[Math.floor(Math.random() * dropTypes.length)];
              e.drops.push({
                id: "drop_" + Math.random(),
                x: enemy.x,
                y: enemy.y,
                type: dType,
                radius: 12,
                duration: 400,
                color: dType === "health" ? "#00ff66" : dType === "shield" ? "#00f3ff" : dType === "quad_damage" ? "#ff0055" : "#ffaa00",
              });
            }

            if (enemy.type === "boss") setBossHp(null);
            e.enemies.splice(i, 1);
          }
        }

        // Update Projectiles
        for (let i = e.projectiles.length - 1; i >= 0; i--) {
          const proj = e.projectiles[i];

          // Homing logic
          if (proj.type === "missile" && proj.targetEnemyId) {
            const tEnemy = e.enemies.find((en) => en.id === proj.targetEnemyId);
            if (tEnemy) {
              const mAngle = Math.atan2(tEnemy.y - proj.y, tEnemy.x - proj.x);
              proj.angle += (mAngle - proj.angle) * 0.12;
              proj.vx = Math.cos(proj.angle) * 10;
              proj.vy = Math.sin(proj.angle) * 10;
            }
          }

          proj.x += proj.vx * (proj.isEnemy ? timeScale : 1);
          proj.y += proj.vy * (proj.isEnemy ? timeScale : 1);
          proj.duration--;

          // Trail particles
          if (Math.random() < 0.4) {
            e.particles.push({
              x: proj.x,
              y: proj.y,
              vx: (Math.random() - 0.5) * 0.5,
              vy: (Math.random() - 0.5) * 0.5,
              color: proj.color,
              radius: proj.radius * 0.5,
              alpha: 0.7,
              decay: 0.08,
            });
          }

          // Out of bounds or expired check
          if (proj.duration <= 0 || proj.x < -30 || proj.x > width + 30 || proj.y < -30 || proj.y > height + 30) {
            e.projectiles.splice(i, 1);
            continue;
          }

          // Hit detection
          if (!proj.isEnemy) {
            // Player projectile vs Enemy
            for (let j = e.enemies.length - 1; j >= 0; j--) {
              const enemy = e.enemies[j];
              const pdist = Math.hypot(enemy.x - proj.x, enemy.y - proj.y);
              if (pdist < enemy.radius + proj.radius) {
                enemy.hp -= proj.damage;
                createExplosion(proj.x, proj.y, proj.color, 6);
                if (proj.type !== "beam") {
                  e.projectiles.splice(i, 1);
                }
                break;
              }
            }
          } else {
            // Enemy projectile vs Player
            const pdist = Math.hypot(p.x - proj.x, p.y - proj.y);
            if (pdist < 20 + proj.radius) {
              if (p.shield > 0) {
                p.shield = Math.max(0, p.shield - proj.damage);
              } else {
                p.hp -= proj.damage;
              }
              createExplosion(proj.x, proj.y, "#ff0055", 8);
              e.screenShake = 5;
              e.projectiles.splice(i, 1);
            }
          }
        }

        // Update Drop items pick-up
        for (let i = e.drops.length - 1; i >= 0; i--) {
          const drop = e.drops[i];
          drop.duration--;
          const dist = Math.hypot(p.x - drop.x, p.y - drop.y);

          if (dist < 32) {
            audio.playPowerup();
            if (drop.type === "health") {
              p.hp = Math.min(p.maxHp, p.hp + 35);
              createFloatingText(p.x, p.y - 20, "+35 HEALTH", "#00ff66");
            } else if (drop.type === "shield") {
              p.shield = Math.min(p.maxShield, p.shield + 40);
              createFloatingText(p.x, p.y - 20, "+40 SHIELD", "#00f3ff");
            } else if (drop.type === "energy") {
              p.energy = Math.min(p.maxEnergy, p.energy + 50);
              createFloatingText(p.x, p.y - 20, "+50 ENERGY", "#ffff00");
            } else if (drop.type === "quad_damage") {
              p.quadDamageTimer = 360; // 6s
              createFloatingText(p.x, p.y - 20, "QUAD DAMAGE!", "#ff0055");
            } else if (drop.type === "quantum_core") {
              setQuantumCores((prev) => prev + 50);
              e.cores += 50;
              createFloatingText(p.x, p.y - 20, "+50 CORES", "#ffaa00");
            }
            e.drops.splice(i, 1);
          } else if (drop.duration <= 0) {
            e.drops.splice(i, 1);
          }
        }

        // Check Player Death
        if (p.hp <= 0) {
          audio.playExplosion(true);
          createExplosion(p.x, p.y, "#00f3ff", 80, true);
          setGameState("GAMEOVER");
          if (e.currentScore > highScore) {
            setHighScore(e.currentScore);
            if (typeof window !== "undefined") {
              localStorage.setItem("qv2099_highscore", e.currentScore.toString());
            }
          }
        }

        // Update state sync for HUD
        setPlayerHp(Math.max(0, p.hp));
        setPlayerShield(Math.max(0, p.shield));
        setPlayerEnergy(Math.max(0, p.energy));
        setEmpCooldownPct(Math.floor((p.empTimer / p.empMaxTimer) * 100));
        setBulletTimePct(Math.floor((p.bulletTimeTimer / p.bulletTimeMaxTimer) * 100));
      }

      // ==========================================
      // CANVAS RENDERING PASSTHROUGH
      // ==========================================

      // Screen Shake translation
      ctx.save();
      if (e.screenShake > 0) {
        const shakeX = (Math.random() - 0.5) * e.screenShake;
        const shakeY = (Math.random() - 0.5) * e.screenShake;
        ctx.translate(shakeX, shakeY);
        e.screenShake *= 0.88;
      }

      // 1. Background Grid & Stars
      ctx.fillStyle = "#060913";
      ctx.fillRect(0, 0, width, height);

      // Parallax Stars
      e.stars.forEach((s) => {
        ctx.fillStyle = `rgba(255, 255, 255, ${s.alpha})`;
        ctx.fillRect(s.x, s.y, s.size, s.size);
        s.y += s.speed;
        if (s.y > height) s.y = 0;
      });

      // Grid Pattern
      ctx.strokeStyle = "rgba(0, 243, 255, 0.04)";
      ctx.lineWidth = 1;
      const gridSize = 60;
      for (let gx = 0; gx < width; gx += gridSize) {
        ctx.beginPath();
        ctx.moveTo(gx, 0);
        ctx.lineTo(gx, height);
        ctx.stroke();
      }
      for (let gy = 0; gy < height; gy += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, gy);
        ctx.lineTo(width, gy);
        ctx.stroke();
      }

      // 2. Render Drop Items
      e.drops.forEach((d) => {
        ctx.save();
        ctx.translate(d.x, d.y);
        ctx.shadowColor = d.color;
        ctx.shadowBlur = 12;
        ctx.fillStyle = d.color;
        ctx.beginPath();
        ctx.arc(0, 0, d.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });

      // 3. Render Particles
      for (let i = e.particles.length - 1; i >= 0; i--) {
        const pt = e.particles[i];
        pt.x += pt.vx;
        pt.y += pt.vy;
        pt.alpha -= pt.decay;

        if (pt.alpha <= 0) {
          e.particles.splice(i, 1);
          continue;
        }

        ctx.save();
        ctx.globalAlpha = Math.max(0, pt.alpha);
        if (pt.shape === "text" && pt.text) {
          ctx.font = "bold 14px sans-serif";
          ctx.fillStyle = pt.color;
          ctx.shadowColor = pt.color;
          ctx.shadowBlur = 8;
          ctx.fillText(pt.text, pt.x, pt.y);
        } else if (pt.shape === "ring") {
          ctx.strokeStyle = pt.color;
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(pt.x, pt.y, pt.radius, 0, Math.PI * 2);
          ctx.stroke();
          pt.radius += 3;
        } else {
          ctx.fillStyle = pt.color;
          ctx.beginPath();
          ctx.arc(pt.x, pt.y, pt.radius, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      }

      // 4. Render Projectiles
      e.projectiles.forEach((proj) => {
        ctx.save();
        ctx.translate(proj.x, proj.y);
        ctx.rotate(proj.angle);
        ctx.shadowColor = proj.color;
        ctx.shadowBlur = 14;
        ctx.fillStyle = proj.color;

        if (proj.type === "beam") {
          ctx.fillRect(-15, -proj.radius / 2, 30, proj.radius);
        } else if (proj.type === "missile") {
          ctx.fillRect(-8, -3, 16, 6);
          ctx.fillStyle = "#ffffff";
          ctx.fillRect(-6, -1, 12, 2);
        } else {
          ctx.beginPath();
          ctx.arc(0, 0, proj.radius, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      });

      // 5. Render Enemies
      e.enemies.forEach((enemy) => {
        ctx.save();
        ctx.translate(enemy.x, enemy.y);
        ctx.rotate(enemy.angle);
        ctx.shadowColor = enemy.color;
        ctx.shadowBlur = 15;
        ctx.fillStyle = enemy.color;
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 2;

        if (enemy.type === "boss") {
          // Boss Ship Geometry
          ctx.beginPath();
          ctx.moveTo(50, 0);
          ctx.lineTo(-40, -45);
          ctx.lineTo(-20, 0);
          ctx.lineTo(-40, 45);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();

          // Boss core glow
          ctx.fillStyle = "#ffffff";
          ctx.beginPath();
          ctx.arc(0, 0, 15, 0, Math.PI * 2);
          ctx.fill();
        } else if (enemy.type === "titan") {
          ctx.beginPath();
          ctx.moveTo(25, 0);
          ctx.lineTo(-20, -20);
          ctx.lineTo(-10, 0);
          ctx.lineTo(-20, 20);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();
        } else if (enemy.type === "wraith") {
          ctx.beginPath();
          ctx.arc(0, 0, enemy.radius, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
        } else {
          // Scouts / Chasers
          ctx.beginPath();
          ctx.moveTo(18, 0);
          ctx.lineTo(-14, -12);
          ctx.lineTo(-14, 12);
          ctx.closePath();
          ctx.fill();
        }
        ctx.restore();

        // Enemy HP Bar overlay
        if (enemy.hp < enemy.maxHp) {
          const hpPct = enemy.hp / enemy.maxHp;
          ctx.fillStyle = "rgba(0,0,0,0.6)";
          ctx.fillRect(enemy.x - 20, enemy.y - enemy.radius - 12, 40, 4);
          ctx.fillStyle = enemy.color;
          ctx.fillRect(enemy.x - 20, enemy.y - enemy.radius - 12, 40 * hpPct, 4);
        }
      });

      // 6. Render Player Starfighter
      if (gameState === "PLAYING") {
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.angle);

        // Quad damage aura glow
        if (p.quadDamageTimer > 0) {
          ctx.shadowColor = "#ff0055";
          ctx.shadowBlur = 25;
        } else {
          ctx.shadowColor = "#00f3ff";
          ctx.shadowBlur = 18;
        }

        // Thruster flame particles behind player
        ctx.fillStyle = Math.random() > 0.5 ? "#00f3ff" : "#ffffff";
        ctx.beginPath();
        ctx.moveTo(-18, -6);
        ctx.lineTo(-28 - Math.random() * 10, 0);
        ctx.lineTo(-18, 6);
        ctx.fill();

        // Ship Hull
        ctx.fillStyle = "#0e1a2b";
        ctx.strokeStyle = p.quadDamageTimer > 0 ? "#ff0055" : "#00f3ff";
        ctx.lineWidth = 2.5;

        ctx.beginPath();
        ctx.moveTo(22, 0);
        ctx.lineTo(-16, -16);
        ctx.lineTo(-8, 0);
        ctx.lineTo(-16, 16);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Cockpit Glass
        ctx.fillStyle = "#00f3ff";
        ctx.beginPath();
        ctx.arc(4, 0, 4, 0, Math.PI * 2);
        ctx.fill();

        // Shield Bubble overlay
        if (p.shield > 0) {
          ctx.strokeStyle = `rgba(0, 243, 255, ${0.3 + (p.shield / p.maxShield) * 0.4})`;
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(0, 0, 26, 0, Math.PI * 2);
          ctx.stroke();
        }

        ctx.restore();
      }

      ctx.restore(); // Restore screen shake context
      animationFrameId = requestAnimationFrame(render);
    };

    animationFrameId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animationFrameId);
  }, [gameState]);

  return (
    <div className="relative w-full h-screen max-h-screen bg-slate-950 text-white font-sans overflow-hidden select-none flex flex-col">
      {/* TOP HEADER HUD */}
      <header className="relative z-20 flex items-center justify-between px-6 py-3 bg-slate-900/80 backdrop-blur-md border-b border-cyan-500/20">
        <div className="flex items-center gap-4">
          <Link
            href="/games"
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-400 text-sm font-semibold transition border border-cyan-500/30"
          >
            <ArrowLeft className="w-4 h-4" /> Exit
          </Link>
          <div className="flex items-center gap-2">
            <Radio className="w-5 h-5 text-cyan-400 animate-pulse" />
            <span className="font-extrabold tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-sky-300 to-indigo-400">
              QUANTUM VANGUARD 2099
            </span>
          </div>
        </div>

        {/* STATS SUMMARY */}
        <div className="flex items-center gap-6 text-sm font-mono">
          <div className="flex items-center gap-2 px-3 py-1 bg-slate-950/60 rounded-md border border-cyan-500/20">
            <Trophy className="w-4 h-4 text-amber-400" />
            <span className="text-slate-400">SCORE:</span>
            <span className="text-cyan-300 font-bold text-base">{score.toLocaleString()}</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1 bg-slate-950/60 rounded-md border border-amber-500/20">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span className="text-slate-400">CORES:</span>
            <span className="text-amber-400 font-bold text-base">{quantumCores}</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1 bg-slate-950/60 rounded-md border border-indigo-500/20">
            <Flame className="w-4 h-4 text-indigo-400" />
            <span className="text-slate-400">WAVE:</span>
            <span className="text-indigo-400 font-bold text-base">{wave}</span>
          </div>
        </div>

        {/* CONTROLS & SHOP */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setGameState((prev) => (prev === "SHOP" ? "PLAYING" : "SHOP"))}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-sm font-semibold transition"
          >
            <ShoppingCart className="w-4 h-4" /> Upgrades
          </button>
          <button
            onClick={() => {
              setIsMuted(!isMuted);
              audio.muted = !isMuted;
            }}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
          >
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>
          <button
            onClick={() => setGameState((prev) => (prev === "PLAYING" ? "PAUSED" : "PLAYING"))}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
          >
            {gameState === "PAUSED" ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
          </button>
        </div>
      </header>

      {/* GAME CANVAS WORKSPACE */}
      <div className="relative flex-1 w-full bg-slate-950 flex items-center justify-center">
        <canvas ref={canvasRef} className="w-full h-full block cursor-crosshair" />

        {/* BOSS HEALTH BAR OVERLAY */}
        {bossHp && gameState === "PLAYING" && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 w-full max-w-xl px-4 z-10">
            <div className="flex justify-between text-xs font-mono text-rose-400 font-bold mb-1">
              <span>{bossHp.name}</span>
              <span>{Math.ceil(bossHp.current)} / {bossHp.max} HP</span>
            </div>
            <div className="w-full h-3 bg-slate-900 rounded-full overflow-hidden border border-rose-500/40 p-0.5">
              <div
                className="h-full bg-gradient-to-r from-rose-600 via-pink-500 to-amber-400 rounded-full transition-all duration-150"
                style={{ width: `${(bossHp.current / bossHp.max) * 100}%` }}
              />
            </div>
          </div>
        )}

        {/* BOTTOM PLAYER HUD */}
        {gameState === "PLAYING" && (
          <div className="absolute bottom-6 left-6 right-6 z-10 flex items-end justify-between pointer-events-none">
            {/* VITAL GAUGES */}
            <div className="flex flex-col gap-2 w-72 pointer-events-auto bg-slate-900/80 backdrop-blur-md p-3.5 rounded-xl border border-cyan-500/20 shadow-2xl">
              {/* HEALTH */}
              <div>
                <div className="flex justify-between text-xs font-mono mb-1 text-emerald-400">
                  <span className="flex items-center gap-1 font-bold"><Shield className="w-3.5 h-3.5" /> HULL INTEGRITY</span>
                  <span>{Math.ceil(playerHp)} / {maxHp}</span>
                </div>
                <div className="w-full h-2.5 bg-slate-950 rounded-full overflow-hidden border border-emerald-500/30">
                  <div className="h-full bg-emerald-500 transition-all" style={{ width: `${(playerHp / maxHp) * 100}%` }} />
                </div>
              </div>

              {/* SHIELD */}
              <div>
                <div className="flex justify-between text-xs font-mono mb-1 text-cyan-400">
                  <span className="flex items-center gap-1 font-bold"><Zap className="w-3.5 h-3.5" /> QUANTUM SHIELD</span>
                  <span>{Math.ceil(playerShield)} / {maxShield}</span>
                </div>
                <div className="w-full h-2.5 bg-slate-950 rounded-full overflow-hidden border border-cyan-500/30">
                  <div className="h-full bg-cyan-400 transition-all" style={{ width: `${(playerShield / maxShield) * 100}%` }} />
                </div>
              </div>

              {/* ENERGY */}
              <div>
                <div className="flex justify-between text-xs font-mono mb-1 text-amber-400">
                  <span className="flex items-center gap-1 font-bold"><Cpu className="w-3.5 h-3.5" /> REACTOR ENERGY</span>
                  <span>{Math.ceil(playerEnergy)} / {maxEnergy}</span>
                </div>
                <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden border border-amber-500/30">
                  <div className="h-full bg-amber-400 transition-all" style={{ width: `${(playerEnergy / maxEnergy) * 100}%` }} />
                </div>
              </div>
            </div>

            {/* WEAPON SELECTOR HUD */}
            <div className="flex gap-2 pointer-events-auto bg-slate-900/80 backdrop-blur-md p-2 rounded-xl border border-cyan-500/20">
              {(Object.keys(weapons) as WeaponType[]).map((wKey, idx) => {
                const w = weapons[wKey];
                const isSelected = selectedWeapon === wKey;
                return (
                  <button
                    key={wKey}
                    onClick={() => w.unlocked && setSelectedWeapon(wKey)}
                    disabled={!w.unlocked}
                    className={`relative flex flex-col items-center justify-center w-16 h-16 rounded-lg font-mono text-xs transition border ${
                      isSelected
                        ? "bg-cyan-500/20 border-cyan-400 text-cyan-300 shadow-lg shadow-cyan-500/20 scale-105"
                        : w.unlocked
                        ? "bg-slate-800/80 border-slate-700 text-slate-300 hover:bg-slate-700"
                        : "bg-slate-950 border-slate-900 text-slate-600 cursor-not-allowed"
                    }`}
                  >
                    <span className="absolute top-1 left-1.5 text-[10px] text-slate-500 font-bold">{idx + 1}</span>
                    <Crosshair className="w-5 h-5 mb-0.5" style={{ color: w.unlocked ? w.color : "#475569" }} />
                    <span className="text-[10px] truncate max-w-[56px]">{w.name.split(" ")[0]}</span>
                  </button>
                );
              })}
            </div>

            {/* SPECIAL ABILITIES COOLDOWNS */}
            <div className="flex gap-3 pointer-events-auto">
              <button
                onClick={triggerEMP}
                className={`flex flex-col items-center justify-center px-4 py-2.5 rounded-xl border font-mono text-xs transition ${
                  empCooldownPct >= 100
                    ? "bg-cyan-500/20 border-cyan-400 text-cyan-300 hover:bg-cyan-500/30 cursor-pointer shadow-lg shadow-cyan-500/20"
                    : "bg-slate-900/80 border-slate-800 text-slate-500 opacity-60"
                }`}
              >
                <div className="flex items-center gap-1.5 font-bold mb-1">
                  <Zap className="w-4 h-4 text-cyan-400" /> EMP NOVA (SPACE)
                </div>
                <div className="w-24 h-1.5 bg-slate-950 rounded-full overflow-hidden border border-cyan-500/30">
                  <div className="h-full bg-cyan-400 transition-all" style={{ width: `${empCooldownPct}%` }} />
                </div>
              </button>

              <button
                onClick={toggleBulletTime}
                className={`flex flex-col items-center justify-center px-4 py-2.5 rounded-xl border font-mono text-xs transition ${
                  bulletTimePct >= 100
                    ? "bg-purple-500/20 border-purple-400 text-purple-300 hover:bg-purple-500/30 cursor-pointer shadow-lg shadow-purple-500/20"
                    : "bg-slate-900/80 border-slate-800 text-slate-500 opacity-60"
                }`}
              >
                <div className="flex items-center gap-1.5 font-bold mb-1">
                  <Sparkles className="w-4 h-4 text-purple-400" /> BULLET TIME (SHIFT)
                </div>
                <div className="w-24 h-1.5 bg-slate-950 rounded-full overflow-hidden border border-purple-500/30">
                  <div className="h-full bg-purple-400 transition-all" style={{ width: `${bulletTimePct}%` }} />
                </div>
              </button>
            </div>
          </div>
        )}

        {/* OVERLAY: MAIN MENU */}
        {gameState === "MENU" && (
          <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-slate-950/90 backdrop-blur-lg p-6">
            <div className="max-w-md w-full bg-slate-900/80 border border-cyan-500/30 p-8 rounded-2xl shadow-2xl text-center">
              <div className="inline-flex p-3 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 mb-4 text-cyan-400">
                <Radio className="w-10 h-10 animate-pulse" />
              </div>
              <h1 className="text-3xl font-extrabold tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-sky-200 to-indigo-400 mb-2">
                QUANTUM VANGUARD 2099
              </h1>
              <p className="text-sm text-slate-400 mb-6">
                Pilot the apex starfighter against infinite synthwave armadas. Master time dilation, EMP blasts, and quantum arsenal upgrades.
              </p>

              {highScore > 0 && (
                <div className="flex items-center justify-center gap-2 mb-6 text-sm font-mono text-amber-400 bg-amber-500/10 py-2 rounded-lg border border-amber-500/30">
                  <Trophy className="w-4 h-4" /> ALL-TIME HIGH SCORE: {highScore.toLocaleString()}
                </div>
              )}

              <button
                onClick={startNewGame}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold tracking-wide shadow-xl shadow-cyan-500/25 transition transform hover:scale-[1.02]"
              >
                ENGAGE MISSION
              </button>
            </div>
          </div>
        )}

        {/* OVERLAY: SHOP & UPGRADES */}
        {gameState === "SHOP" && (
          <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-slate-950/90 backdrop-blur-lg p-6">
            <div className="max-w-3xl w-full bg-slate-900 border border-amber-500/30 rounded-2xl p-6 shadow-2xl flex flex-col max-h-[85vh]">
              <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-4">
                <div className="flex items-center gap-3">
                  <ShoppingCart className="w-6 h-6 text-amber-400" />
                  <h2 className="text-xl font-bold text-amber-300">ARMORY & HANGAR UPGRADES</h2>
                </div>
                <div className="flex items-center gap-2 px-3 py-1 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400 font-mono text-sm">
                  <Sparkles className="w-4 h-4" /> {quantumCores} CORES
                </div>
              </div>

              <div className="flex-1 overflow-y-auto pr-2 space-y-4">
                {/* WEAPON UNLOCKS */}
                <div>
                  <h3 className="text-xs font-mono text-slate-400 mb-2 tracking-wider">WEAPON ARSENAL UNLOCKS</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {(Object.keys(weapons) as WeaponType[]).map((wKey) => {
                      const w = weapons[wKey];
                      return (
                        <div key={wKey} className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 flex items-center justify-between">
                          <div>
                            <div className="flex items-center gap-2 font-bold text-sm" style={{ color: w.color }}>
                              <Crosshair className="w-4 h-4" /> {w.name}
                            </div>
                            <div className="text-xs text-slate-400 mt-0.5">{w.description}</div>
                          </div>
                          {w.unlocked ? (
                            <span className="flex items-center gap-1 text-xs text-emerald-400 font-mono font-bold px-2.5 py-1 bg-emerald-500/10 rounded-md border border-emerald-500/30">
                              <Check className="w-3.5 h-3.5" /> UNLOCKED
                            </span>
                          ) : (
                            <button
                              onClick={() => unlockWeapon(wKey)}
                              disabled={quantumCores < w.cost}
                              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition ${
                                quantumCores >= w.cost
                                  ? "bg-amber-500 hover:bg-amber-400 text-slate-950 cursor-pointer"
                                  : "bg-slate-800 text-slate-500 cursor-not-allowed"
                              }`}
                            >
                              BUY ({w.cost} CORES)
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* HULL & STAT UPGRADES */}
                <div>
                  <h3 className="text-xs font-mono text-slate-400 mb-2 tracking-wider">VESSEL SYSTEMS UPGRADES</h3>
                  <div className="space-y-2.5">
                    {upgrades.map((u) => {
                      const cost = Math.floor(u.baseCost * Math.pow(u.costMultiplier, u.level - 1));
                      const isMax = u.level >= u.maxLevel;
                      return (
                        <div key={u.id} className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 flex items-center justify-between">
                          <div>
                            <div className="flex items-center gap-2 font-bold text-sm text-slate-200">
                              {u.name} <span className="text-xs font-mono text-cyan-400">LVL {u.level}/{u.maxLevel}</span>
                            </div>
                            <div className="text-xs text-slate-400 mt-0.5">{u.description}</div>
                          </div>
                          {isMax ? (
                            <span className="text-xs text-cyan-400 font-mono font-bold px-2 py-1 bg-cyan-500/10 rounded">MAXED</span>
                          ) : (
                            <button
                              onClick={() => buyUpgrade(u.id)}
                              disabled={quantumCores < cost}
                              className={`px-3.5 py-1.5 rounded-lg text-xs font-mono font-bold transition ${
                                quantumCores >= cost
                                  ? "bg-cyan-500 hover:bg-cyan-400 text-slate-950 cursor-pointer"
                                  : "bg-slate-800 text-slate-500 cursor-not-allowed"
                              }`}
                            >
                              UPGRADE ({cost} CORES)
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-800 flex justify-end">
                <button
                  onClick={() => setGameState("PLAYING")}
                  className="px-6 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-sm transition"
                >
                  RESUME MISSION
                </button>
              </div>
            </div>
          </div>
        )}

        {/* OVERLAY: PAUSED */}
        {gameState === "PAUSED" && (
          <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-slate-950/80 backdrop-blur-md">
            <div className="p-6 bg-slate-900 border border-cyan-500/30 rounded-2xl text-center max-w-sm w-full">
              <h2 className="text-2xl font-bold text-cyan-300 mb-4">MISSION PAUSED</h2>
              <div className="flex flex-col gap-3">
                <button
                  onClick={() => setGameState("PLAYING")}
                  className="py-2.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold rounded-xl text-sm transition"
                >
                  RESUME
                </button>
                <button
                  onClick={startNewGame}
                  className="py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-xl text-sm transition"
                >
                  RESTART
                </button>
              </div>
            </div>
          </div>
        )}

        {/* OVERLAY: GAME OVER */}
        {gameState === "GAMEOVER" && (
          <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-slate-950/90 backdrop-blur-lg p-6">
            <div className="max-w-md w-full bg-slate-900 border border-rose-500/40 p-8 rounded-2xl shadow-2xl text-center">
              <div className="inline-flex p-3 rounded-2xl bg-rose-500/10 border border-rose-500/30 mb-4 text-rose-500">
                <Skull className="w-10 h-10 animate-bounce" />
              </div>
              <h2 className="text-3xl font-extrabold tracking-wider text-rose-500 mb-1">VESSEL DESTROYED</h2>
              <p className="text-xs text-slate-400 font-mono mb-6">MISSION TERMINATED AT WAVE {wave}</p>

              <div className="space-y-2.5 bg-slate-950/60 p-4 rounded-xl border border-slate-800 font-mono text-sm mb-6">
                <div className="flex justify-between text-slate-400">
                  <span>FINAL SCORE:</span>
                  <span className="text-cyan-400 font-bold">{score.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>HOSTILES ELIMINATED:</span>
                  <span className="text-rose-400 font-bold">{kills}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>WAVES SURVIVED:</span>
                  <span className="text-indigo-400 font-bold">{wave - 1}</span>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={startNewGame}
                  className="flex-1 py-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-sm transition"
                >
                  TRY AGAIN
                </button>
                <Link
                  href="/games"
                  className="px-4 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-sm transition"
                >
                  EXIT
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
