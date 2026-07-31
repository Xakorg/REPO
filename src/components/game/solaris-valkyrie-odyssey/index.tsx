"use client";

import React, { useEffect, useRef, useState } from "react";
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
  Maximize2
} from "lucide-react";
import Link from "next/link";

// ==========================================
// 1. TYPES & INTERFACES
// ==========================================

export type WeaponType =
  | "plasma"
  | "railgun"
  | "scatter"
  | "homing"
  | "chain";

export interface WeaponInfo {
  name: string;
  fireRate: number; // Ms per shot
  damage: number;
  color: string;
  description: string;
}

export interface UpgradeOption {
  id: string;
  name: string;
  description: string;
  icon: string;
  rarity: "common" | "rare" | "epic" | "legendary";
  apply: (stats: PlayerStats) => void;
}

export interface PlayerStats {
  maxHealth: number;
  maxShield: number;
  shieldRegenRate: number;
  speed: number;
  damageMultiplier: number;
  fireRateMultiplier: number;
  critChance: number;
  dashCooldown: number;
  droneCount: number;
  magnetRadius: number;
  overdriveChargeRate: number;
}

interface Player {
  x: number;
  y: number;
  vx: number;
  vy: number;
  angle: number;
  health: number;
  shield: number;
  dashTimer: number;
  isDashing: boolean;
  overdriveEnergy: number;
  activeWeapon: WeaponType;
  lastShotTime: number;
}

interface Enemy {
  id: number;
  type: "scout" | "interceptor" | "destroyer" | "stealth" | "boss";
  x: number;
  y: number;
  vx: number;
  vy: number;
  health: number;
  maxHealth: number;
  radius: number;
  scoreValue: number;
  color: string;
  lastShotTime: number;
  stealthState?: boolean;
  stealthTimer?: number;
  bossPhase?: number;
}

interface Bullet {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  damage: number;
  isEnemy: boolean;
  color: string;
  radius: number;
  pierce: number;
  homingTarget?: Enemy | null;
  lifeTime: number;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  radius: number;
  alpha: number;
  decay: number;
}

interface FloatingText {
  id: number;
  text: string;
  x: number;
  y: number;
  color: string;
  alpha: number;
  vy: number;
}

interface Gem {
  id: number;
  x: number;
  y: number;
  value: number;
  radius: number;
}

interface Drone {
  angle: number;
  distance: number;
  lastShot: number;
}

// ==========================================
// 2. CONSTANTS & DEFINITIONS
// ==========================================

const WEAPONS: Record<WeaponType, WeaponInfo> = {
  plasma: {
    name: "Dual Plasma Cannon",
    fireRate: 140,
    damage: 18,
    color: "#00f0ff",
    description: "Rapid high-velocity plasma bolts with balanced damage."
  },
  railgun: {
    name: "Quantum Railgun",
    fireRate: 450,
    damage: 75,
    color: "#ff0055",
    description: "Heavy hyper-velocity beam piercing through multiple enemies."
  },
  scatter: {
    name: "Valkyrie Scatter Cannon",
    fireRate: 280,
    damage: 12,
    color: "#ffaa00",
    description: "Fires a 5-shot arc spread for close-quarters crowd control."
  },
  homing: {
    name: "Photon Homing Torpedoes",
    fireRate: 350,
    damage: 32,
    color: "#a855f7",
    description: "Auto-seeking explosive missiles targeting hostile mechs."
  },
  chain: {
    name: "Arc Lightning Emitter",
    fireRate: 220,
    damage: 22,
    color: "#3b82f6",
    description: "Emits energy blasts that arc between nearby enemy hulls."
  }
};

const ALL_UPGRADES: UpgradeOption[] = [
  {
    id: "max_shield",
    name: "Shield Matrix Overclock",
    description: "+30 Max Shield & faster shield regeneration.",
    icon: "Shield",
    rarity: "common",
    apply: (s) => {
      s.maxShield += 30;
      s.shieldRegenRate += 0.5;
    }
  },
  {
    id: "damage_boost",
    name: "Photon Amplifier",
    description: "+25% Increase to all weapon damage.",
    icon: "Flame",
    rarity: "common",
    apply: (s) => {
      s.damageMultiplier += 0.25;
    }
  },
  {
    id: "fire_rate",
    name: "Tachyon Coiler",
    description: "+20% Attack speed boost across all weapons.",
    icon: "Zap",
    rarity: "rare",
    apply: (s) => {
      s.fireRateMultiplier += 0.2;
    }
  },
  {
    id: "crit_master",
    name: "Targeting Matrix V2",
    description: "+15% Critical strike chance (2.5x damage).",
    icon: "Target",
    rarity: "rare",
    apply: (s) => {
      s.critChance += 0.15;
    }
  },
  {
    id: "thruster_boost",
    name: "Valkyrie Overdrive Engine",
    description: "+20% Movement speed & shorter dash cooldown.",
    icon: "Activity",
    rarity: "common",
    apply: (s) => {
      s.speed += 1.2;
      s.dashCooldown = Math.max(800, s.dashCooldown - 300);
    }
  },
  {
    id: "support_drone",
    name: "Automated Escort Drone",
    description: "Deploys an orbital combat drone to auto-fire at hostiles.",
    icon: "Crosshair",
    rarity: "epic",
    apply: (s) => {
      s.droneCount += 1;
    }
  },
  {
    id: "magnet_field",
    name: "Graviton Harvester",
    description: "+100% Increase in energy crystal pickup range.",
    icon: "Sparkles",
    rarity: "common",
    apply: (s) => {
      s.magnetRadius += 120;
    }
  },
  {
    id: "overdrive_charge",
    name: "Tachyon Reservoir",
    description: "+40% Faster Overdrive EMP capability charge rate.",
    icon: "Zap",
    rarity: "rare",
    apply: (s) => {
      s.overdriveChargeRate += 0.4;
    }
  },
  {
    id: "hull_plating",
    name: "Nano-Titanium Plating",
    description: "+40 Max Health & instant full repair.",
    icon: "Shield",
    rarity: "epic",
    apply: (s) => {
      s.maxHealth += 40;
    }
  },
  {
    id: "quantum_core",
    name: "Quantum Flux Core",
    description: "Legendary boost: +30% Damage & +20% Shield Regen.",
    icon: "Award",
    rarity: "legendary",
    apply: (s) => {
      s.damageMultiplier += 0.3;
      s.shieldRegenRate += 1.0;
    }
  }
];

// ==========================================
// 3. SOUND SYNTHESIS ENGINE (Web Audio API)
// ==========================================

class AudioSynth {
  ctx: AudioContext | null = null;
  enabled: boolean = true;

  init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === "suspended") {
      this.ctx.resume();
    }
  }

  playLaser(freq = 600, duration = 0.08, type: OscillatorType = "sawtooth") {
    if (!this.enabled || !this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(80, this.ctx.currentTime + duration);

      gain.gain.setValueAtTime(0.12, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + duration);
    } catch {}
  }

  playExplosion(isBig = false) {
    if (!this.enabled || !this.ctx) return;
    try {
      const bufferSize = this.ctx.sampleRate * (isBig ? 0.4 : 0.2);
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }
      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.setValueAtTime(isBig ? 300 : 600, this.ctx.currentTime);
      filter.frequency.exponentialRampToValueAtTime(40, this.ctx.currentTime + (isBig ? 0.4 : 0.2));

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(isBig ? 0.3 : 0.15, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + (isBig ? 0.4 : 0.2));

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);

      noise.start();
    } catch {}
  }

  playPowerup() {
    if (!this.enabled || !this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(300, now);
      osc.frequency.exponentialRampToValueAtTime(900, now + 0.25);

      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(now + 0.25);
    } catch {}
  }

  playDash() {
    if (!this.enabled || !this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(150, now);
      osc.frequency.exponentialRampToValueAtTime(600, now + 0.15);

      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(now + 0.15);
    } catch {}
  }
}

const synth = new AudioSynth();

// ==========================================
// 4. MAIN GAME COMPONENT
// ==========================================

export default function SolarisValkyrieOdyssey() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Game UI States
  const [gameState, setGameState] = useState<"menu" | "playing" | "levelup" | "gameover" | "victory">("menu");
  const [score, setScore] = useState<number>(0);
  const [wave, setWave] = useState<number>(1);
  const [combo, setCombo] = useState<number>(0);
  const [highestCombo, setHighestCombo] = useState<number>(0);
  const [level, setLevel] = useState<number>(1);
  const [xp, setXp] = useState<number>(0);
  const [xpToNext, setXpToNext] = useState<number>(100);

  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [selectedWeapon, setSelectedWeapon] = useState<WeaponType>("plasma");
  const [upgradeOptions, setUpgradeOptions] = useState<UpgradeOption[]>([]);

  // Performance stats for game over
  const [stats, setStats] = useState({
    enemiesDestroyed: 0,
    bossesKilled: 0,
    damageDealt: 0,
    timeSurvived: 0
  });

  // Refs for animation & state inside loop
  const playerStatsRef = useRef<PlayerStats>({
    maxHealth: 100,
    maxShield: 100,
    shieldRegenRate: 1.5,
    speed: 5.5,
    damageMultiplier: 1.0,
    fireRateMultiplier: 1.0,
    critChance: 0.05,
    dashCooldown: 2500,
    droneCount: 0,
    magnetRadius: 150,
    overdriveChargeRate: 1.0
  });

  const playerRef = useRef<Player>({
    x: 0,
    y: 0,
    vx: 0,
    vy: 0,
    angle: 0,
    health: 100,
    shield: 100,
    dashTimer: 0,
    isDashing: false,
    overdriveEnergy: 0,
    activeWeapon: "plasma",
    lastShotTime: 0
  });

  const keysRef = useRef<Record<string, boolean>>({});
  const mouseRef = useRef<{ x: number; y: number; down: boolean }>({ x: 0, y: 0, down: false });
  const enemiesRef = useRef<Enemy[]>([]);
  const bulletsRef = useRef<Bullet[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const floatingTextsRef = useRef<FloatingText[]>([]);
  const gemsRef = useRef<Gem[]>([]);
  const dronesRef = useRef<Drone[]>([]);
  const waveEnemiesRemainingRef = useRef<number>(0);

  const startTimeRef = useRef<number>(0);
  const nextEntityId = useRef<number>(1);
  const screenShakeRef = useRef<number>(0);

  // Sync Audio state
  useEffect(() => {
    synth.enabled = soundEnabled;
  }, [soundEnabled]);

  // Handle Canvas setup and resizing
  useEffect(() => {
    const handleResize = () => {
      if (canvasRef.current) {
        canvasRef.current.width = window.innerWidth;
        canvasRef.current.height = window.innerHeight;
      }
    };
    handleResize();
    window.addEventListener("resize", handleResize);

    const handleKeyDown = (e: KeyboardEvent) => {
      keysRef.current[e.key.toLowerCase()] = true;
      if (e.key === " " && gameState === "playing") {
        e.preventDefault();
        triggerDash();
      }
      if (e.key.toLowerCase() === "e" && gameState === "playing") {
        triggerOverdrive();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      keysRef.current[e.key.toLowerCase()] = false;
    };

    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current.x = e.clientX;
      mouseRef.current.y = e.clientY;
    };

    const handleMouseDown = (e: MouseEvent) => {
      if (e.button === 0) mouseRef.current.down = true;
    };

    const handleMouseUp = (e: MouseEvent) => {
      if (e.button === 0) mouseRef.current.down = false;
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mousedown", handleMouseDown);
    window.addEventListener("mouseup", handleMouseUp);

    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mousedown", handleMouseDown);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [gameState]);

  // Dash Action
  const triggerDash = () => {
    const p = playerRef.current;
    const st = playerStatsRef.current;
    const now = Date.now();
    if (now - p.dashTimer >= st.dashCooldown && !p.isDashing) {
      p.dashTimer = now;
      p.isDashing = true;
      synth.playDash();

      // Spawn dash particles
      for (let i = 0; i < 25; i++) {
        particlesRef.current.push({
          x: p.x,
          y: p.y,
          vx: (Math.random() - 0.5) * 8,
          vy: (Math.random() - 0.5) * 8,
          color: "#00f0ff",
          radius: Math.random() * 4 + 2,
          alpha: 1,
          decay: 0.05
        });
      }

      setTimeout(() => {
        p.isDashing = false;
      }, 250);
    }
  };

  // Overdrive EMP Pulse
  const triggerOverdrive = () => {
    const p = playerRef.current;
    if (p.overdriveEnergy >= 100) {
      p.overdriveEnergy = 0;
      synth.playExplosion(true);
      screenShakeRef.current = 20;

      // Clear enemy bullets
      bulletsRef.current = bulletsRef.current.filter((b) => !b.isEnemy);

      // Damage all enemies
      enemiesRef.current.forEach((e) => {
        e.health -= 150;
        addFloatingText(`150 EMP!`, e.x, e.y, "#a855f7");
      });

      // Shockwave visual ring
      for (let i = 0; i < 60; i++) {
        const ang = (Math.PI * 2 * i) / 60;
        particlesRef.current.push({
          x: p.x,
          y: p.y,
          vx: Math.cos(ang) * 15,
          vy: Math.sin(ang) * 15,
          color: "#a855f7",
          radius: 6,
          alpha: 1,
          decay: 0.02
        });
      }
    }
  };

  // Floating Combat Text Helper
  const addFloatingText = (text: string, x: number, y: number, color = "#ffffff") => {
    floatingTextsRef.current.push({
      id: nextEntityId.current++,
      text,
      x,
      y,
      color,
      alpha: 1,
      vy: -1.5
    });
  };

  // Start / Reset Game
  const startGame = () => {
    synth.init();
    const w = window.innerWidth || 1200;
    const h = window.innerHeight || 800;

    playerStatsRef.current = {
      maxHealth: 100,
      maxShield: 100,
      shieldRegenRate: 1.5,
      speed: 5.5,
      damageMultiplier: 1.0,
      fireRateMultiplier: 1.0,
      critChance: 0.05,
      dashCooldown: 2500,
      droneCount: 0,
      magnetRadius: 150,
      overdriveChargeRate: 1.0
    };

    playerRef.current = {
      x: w / 2,
      y: h / 2,
      vx: 0,
      vy: 0,
      angle: 0,
      health: 100,
      shield: 100,
      dashTimer: 0,
      isDashing: false,
      overdriveEnergy: 0,
      activeWeapon: selectedWeapon,
      lastShotTime: 0
    };

    enemiesRef.current = [];
    bulletsRef.current = [];
    particlesRef.current = [];
    floatingTextsRef.current = [];
    gemsRef.current = [];
    dronesRef.current = [];

    setScore(0);
    setWave(1);
    setCombo(0);
    setHighestCombo(0);
    setLevel(1);
    setXp(0);
    setXpToNext(100);

    setStats({
      enemiesDestroyed: 0,
      bossesKilled: 0,
      damageDealt: 0,
      timeSurvived: 0
    });

    startTimeRef.current = Date.now();
    waveEnemiesRemainingRef.current = 15;
    spawnWaveEnemies(1, 15);

    setGameState("playing");
  };

  // Enemy Wave Spawner
  const spawnWaveEnemies = (currentWave: number, count: number) => {
    const w = window.innerWidth || 1200;
    const h = window.innerHeight || 800;

    const isBossWave = currentWave % 5 === 0;

    if (isBossWave) {
      synth.playExplosion(true);
      // Spawn Boss Dreadnought
      enemiesRef.current.push({
        id: nextEntityId.current++,
        type: "boss",
        x: w / 2,
        y: -100,
        vx: 0,
        vy: 1.2,
        health: 800 + currentWave * 250,
        maxHealth: 800 + currentWave * 250,
        radius: 45,
        scoreValue: 1500,
        color: "#ff0055",
        lastShotTime: Date.now(),
        bossPhase: 1
      });
      addFloatingText("WARNING: DREADNOUGHT APPROACHING!", w / 2, 200, "#ff0055");
    }

    for (let i = 0; i < count; i++) {
      // Spawn around screen edges
      let x = 0,
        y = 0;
      if (Math.random() < 0.5) {
        x = Math.random() < 0.5 ? -50 : w + 50;
        y = Math.random() * h;
      } else {
        x = Math.random() * w;
        y = Math.random() < 0.5 ? -50 : h + 50;
      }

      const randType = Math.random();
      let type: Enemy["type"] = "scout";
      let health = 30 + currentWave * 5;
      let radius = 16;
      let scoreValue = 50;
      let color = "#00ffcc";

      if (randType > 0.75) {
        type = "destroyer";
        health = 90 + currentWave * 15;
        radius = 24;
        scoreValue = 180;
        color = "#ff9900";
      } else if (randType > 0.45) {
        type = "interceptor";
        health = 50 + currentWave * 10;
        radius = 18;
        scoreValue = 100;
        color = "#a855f7";
      } else if (randType > 0.3) {
        type = "stealth";
        health = 40 + currentWave * 8;
        radius = 15;
        scoreValue = 130;
        color = "#3b82f6";
      }

      enemiesRef.current.push({
        id: nextEntityId.current++,
        type,
        x,
        y,
        vx: 0,
        vy: 0,
        health,
        maxHealth: health,
        radius,
        scoreValue,
        color,
        lastShotTime: Date.now() + Math.random() * 2000,
        stealthState: false,
        stealthTimer: 0
      });
    }
  };

  // Level Up Modal Trigger
  const triggerLevelUp = () => {
    // Pick 3 random distinct upgrades
    const shuffled = [...ALL_UPGRADES].sort(() => 0.5 - Math.random());
    setUpgradeOptions(shuffled.slice(0, 3));
    setGameState("levelup");
    synth.playPowerup();
  };

  const selectUpgrade = (upgrade: UpgradeOption) => {
    upgrade.apply(playerStatsRef.current);
    // Instant health/shield refresh
    playerRef.current.health = Math.min(
      playerStatsRef.current.maxHealth,
      playerRef.current.health + 30
    );
    playerRef.current.shield = playerStatsRef.current.maxShield;

    setGameState("playing");
  };

  // Main Canvas Render & Game Loop
  useEffect(() => {
    let animationFrameId: number;

    const gameLoop = () => {
      if (canvasRef.current && gameState === "playing") {
        const ctx = canvasRef.current.getContext("2d");
        if (ctx) {
          const canvas = canvasRef.current;
          const w = canvas.width;
          const h = canvas.height;

          // Clear Canvas with starfield space background
          ctx.save();
          if (screenShakeRef.current > 0) {
            ctx.translate(
              (Math.random() - 0.5) * screenShakeRef.current,
              (Math.random() - 0.5) * screenShakeRef.current
            );
            screenShakeRef.current = Math.max(0, screenShakeRef.current - 1);
          }

          ctx.fillStyle = "#050714";
          ctx.fillRect(0, 0, w, h);

          // Grid lines
          ctx.strokeStyle = "rgba(0, 240, 255, 0.04)";
          ctx.lineWidth = 1;
          const gridSize = 60;
          for (let x = 0; x < w; x += gridSize) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, h);
            ctx.stroke();
          }
          for (let y = 0; y < h; y += gridSize) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(w, y);
            ctx.stroke();
          }

          const p = playerRef.current;
          const st = playerStatsRef.current;

          // Update Player Position & Rotation
          let dx = 0;
          let dy = 0;
          if (keysRef.current["w"] || keysRef.current["arrowup"]) dy -= 1;
          if (keysRef.current["s"] || keysRef.current["arrowdown"]) dy += 1;
          if (keysRef.current["a"] || keysRef.current["arrowleft"]) dx -= 1;
          if (keysRef.current["d"] || keysRef.current["arrowright"]) dx += 1;

          if (dx !== 0 && dy !== 0) {
            dx *= 0.7071;
            dy *= 0.7071;
          }

          const currentSpeed = p.isDashing ? st.speed * 2.5 : st.speed;
          p.vx = p.vx * 0.82 + dx * currentSpeed * 0.18;
          p.vy = p.vy * 0.82 + dy * currentSpeed * 0.18;

          p.x += p.vx * currentSpeed;
          p.y += p.vy * currentSpeed;

          // Boundaries
          p.x = Math.max(25, Math.min(w - 25, p.x));
          p.y = Math.max(25, Math.min(h - 25, p.y));

          // Aiming Angle
          p.angle = Math.atan2(mouseRef.current.y - p.y, mouseRef.current.x - p.x);

          // Shield Regeneration
          if (p.shield < st.maxShield) {
            p.shield = Math.min(st.maxShield, p.shield + st.shieldRegenRate * 0.08);
          }

          // Player Thruster Particles
          if (dx !== 0 || dy !== 0) {
            particlesRef.current.push({
              x: p.x - Math.cos(p.angle) * 18,
              y: p.y - Math.sin(p.angle) * 18,
              vx: -Math.cos(p.angle) * 4 + (Math.random() - 0.5) * 2,
              vy: -Math.sin(p.angle) * 4 + (Math.random() - 0.5) * 2,
              color: p.isDashing ? "#00f0ff" : "#ffaa00",
              radius: Math.random() * 3 + 1,
              alpha: 1,
              decay: 0.08
            });
          }

          // Firing Mechanics
          const weapon = WEAPONS[p.activeWeapon];
          const now = Date.now();
          const effectiveFireRate = weapon.fireRate / st.fireRateMultiplier;

          if (mouseRef.current.down && now - p.lastShotTime >= effectiveFireRate) {
            p.lastShotTime = now;
            synth.playLaser(
              p.activeWeapon === "railgun"
                ? 900
                : p.activeWeapon === "scatter"
                ? 400
                : 650
            );

            const isCrit = Math.random() < st.critChance;
            const baseDmg = weapon.damage * st.damageMultiplier * (isCrit ? 2.5 : 1.0);

            if (p.activeWeapon === "scatter") {
              const count = 5;
              for (let i = -2; i <= 2; i++) {
                const spreadAngle = p.angle + i * 0.12;
                bulletsRef.current.push({
                  id: nextEntityId.current++,
                  x: p.x + Math.cos(spreadAngle) * 20,
                  y: p.y + Math.sin(spreadAngle) * 20,
                  vx: Math.cos(spreadAngle) * 14,
                  vy: Math.sin(spreadAngle) * 14,
                  damage: baseDmg,
                  isEnemy: false,
                  color: weapon.color,
                  radius: 4,
                  pierce: 1,
                  lifeTime: 60
                });
              }
            } else if (p.activeWeapon === "railgun") {
              bulletsRef.current.push({
                id: nextEntityId.current++,
                x: p.x + Math.cos(p.angle) * 25,
                y: p.y + Math.sin(p.angle) * 25,
                vx: Math.cos(p.angle) * 22,
                vy: Math.sin(p.angle) * 22,
                damage: baseDmg,
                isEnemy: false,
                color: weapon.color,
                radius: 7,
                pierce: 5,
                lifeTime: 80
              });
            } else if (p.activeWeapon === "homing") {
              // Target nearest enemy
              let nearest: Enemy | null = null;
              let minDist = 99999;
              enemiesRef.current.forEach((e) => {
                const dist = Math.hypot(e.x - p.x, e.y - p.y);
                if (dist < minDist) {
                  minDist = dist;
                  nearest = e;
                }
              });

              bulletsRef.current.push({
                id: nextEntityId.current++,
                x: p.x + Math.cos(p.angle) * 20,
                y: p.y + Math.sin(p.angle) * 20,
                vx: Math.cos(p.angle) * 10,
                vy: Math.sin(p.angle) * 10,
                damage: baseDmg,
                isEnemy: false,
                color: weapon.color,
                radius: 5,
                pierce: 1,
                homingTarget: nearest,
                lifeTime: 120
              });
            } else {
              // Plasma or Chain
              bulletsRef.current.push({
                id: nextEntityId.current++,
                x: p.x + Math.cos(p.angle) * 20,
                y: p.y + Math.sin(p.angle) * 20,
                vx: Math.cos(p.angle) * 16,
                vy: Math.sin(p.angle) * 16,
                damage: baseDmg,
                isEnemy: false,
                color: weapon.color,
                radius: 5,
                pierce: 1,
                lifeTime: 90
              });
            }
          }

          // Drones Auto-Firing
          if (st.droneCount > 0) {
            dronesRef.current.forEach((d, idx) => {
              d.angle += 0.03;
              const droneX = p.x + Math.cos(d.angle + (idx * Math.PI * 2) / st.droneCount) * 45;
              const droneY = p.y + Math.sin(d.angle + (idx * Math.PI * 2) / st.droneCount) * 45;

              // Draw Drone
              ctx.fillStyle = "#00f0ff";
              ctx.beginPath();
              ctx.arc(droneX, droneY, 6, 0, Math.PI * 2);
              ctx.fill();

              if (now - d.lastShot > 600) {
                d.lastShot = now;
                // Fire at nearest enemy
                let closest: Enemy | null = null;
                let cDist = 400;
                enemiesRef.current.forEach((e) => {
                  const dist = Math.hypot(e.x - droneX, e.y - droneY);
                  if (dist < cDist) {
                    cDist = dist;
                    closest = e;
                  }
                });

                if (closest) {
                  const targetAng = Math.atan2(
                    (closest as Enemy).y - droneY,
                    (closest as Enemy).x - droneX
                  );
                  bulletsRef.current.push({
                    id: nextEntityId.current++,
                    x: droneX,
                    y: droneY,
                    vx: Math.cos(targetAng) * 12,
                    vy: Math.sin(targetAng) * 12,
                    damage: 15 * st.damageMultiplier,
                    isEnemy: false,
                    color: "#00f0ff",
                    radius: 3,
                    pierce: 1,
                    lifeTime: 60
                  });
                }
              }
            });

            // Adjust drones list size if count changed
            while (dronesRef.current.length < st.droneCount) {
              dronesRef.current.push({ angle: 0, distance: 45, lastShot: 0 });
            }
          }

          // Update Bullets
          bulletsRef.current.forEach((b) => {
            if (b.homingTarget && enemiesRef.current.includes(b.homingTarget)) {
              const targetAng = Math.atan2(b.homingTarget.y - b.y, b.homingTarget.x - b.x);
              b.vx = b.vx * 0.9 + Math.cos(targetAng) * 2;
              b.vy = b.vy * 0.9 + Math.sin(targetAng) * 2;
            }

            b.x += b.vx;
            b.y += b.vy;
            b.lifeTime--;

            // Render Bullet
            ctx.fillStyle = b.color;
            ctx.shadowColor = b.color;
            ctx.shadowBlur = 8;
            ctx.beginPath();
            ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
            ctx.fill();
            ctx.shadowBlur = 0;
          });

          // Filter out expired bullets
          bulletsRef.current = bulletsRef.current.filter(
            (b) => b.lifeTime > 0 && b.x > 0 && b.x < w && b.y > 0 && b.y < h
          );

          // Update & Render Enemies
          enemiesRef.current.forEach((e) => {
            const angleToPlayer = Math.atan2(p.y - e.y, p.x - e.x);

            if (e.type === "boss") {
              // Boss movement logic
              if (e.y < 150) e.y += e.vy;
              else {
                e.x += Math.sin(Date.now() * 0.002) * 3;
              }

              // Boss attack patterns
              if (now - e.lastShotTime > 1200) {
                e.lastShotTime = now;
                synth.playLaser(300, 0.15, "square");
                // Radial barrage
                const bulletCount = 12;
                for (let i = 0; i < bulletCount; i++) {
                  const bAng = (Math.PI * 2 * i) / bulletCount;
                  bulletsRef.current.push({
                    id: nextEntityId.current++,
                    x: e.x,
                    y: e.y,
                    vx: Math.cos(bAng) * 6,
                    vy: Math.sin(bAng) * 6,
                    damage: 20,
                    isEnemy: true,
                    color: "#ff0055",
                    radius: 6,
                    pierce: 1,
                    lifeTime: 140
                  });
                }
              }
            } else {
              // Standard enemy AI
              const speedMod =
                e.type === "scout" ? 3.2 : e.type === "interceptor" ? 2.5 : 1.8;
              e.vx = e.vx * 0.9 + Math.cos(angleToPlayer) * speedMod * 0.1;
              e.vy = e.vy * 0.9 + Math.sin(angleToPlayer) * speedMod * 0.1;

              e.x += e.vx;
              e.y += e.vy;

              // Enemy shooting
              if (
                (e.type === "interceptor" || e.type === "destroyer") &&
                now - e.lastShotTime > (e.type === "destroyer" ? 1800 : 2500)
              ) {
                e.lastShotTime = now;
                bulletsRef.current.push({
                  id: nextEntityId.current++,
                  x: e.x,
                  y: e.y,
                  vx: Math.cos(angleToPlayer) * 7,
                  vy: Math.sin(angleToPlayer) * 7,
                  damage: e.type === "destroyer" ? 25 : 15,
                  isEnemy: true,
                  color: e.color,
                  radius: 5,
                  pierce: 1,
                  lifeTime: 120
                });
              }
            }

            // Bullet vs Enemy Collision
            bulletsRef.current.forEach((b) => {
              if (!b.isEnemy) {
                const dist = Math.hypot(b.x - e.x, b.y - e.y);
                if (dist < e.radius + b.radius) {
                  e.health -= b.damage;
                  b.pierce--;
                  if (b.pierce <= 0) b.lifeTime = 0;

                  setStats((prev) => ({
                    ...prev,
                    damageDealt: prev.damageDealt + Math.round(b.damage)
                  }));

                  addFloatingText(
                    `${Math.round(b.damage)}`,
                    e.x + (Math.random() - 0.5) * 20,
                    e.y - 15,
                    b.color
                  );

                  // Impact spark
                  for (let k = 0; k < 4; k++) {
                    particlesRef.current.push({
                      x: b.x,
                      y: b.y,
                      vx: (Math.random() - 0.5) * 5,
                      vy: (Math.random() - 0.5) * 5,
                      color: b.color,
                      radius: 2,
                      alpha: 1,
                      decay: 0.1
                    });
                  }
                }
              }
            });

            // Player vs Enemy Collision
            const distToPlayer = Math.hypot(p.x - e.x, p.y - e.y);
            if (distToPlayer < e.radius + 20 && !p.isDashing) {
              const dmg = e.type === "boss" ? 40 : 15;
              takePlayerDamage(dmg);

              // Knockback enemy
              e.x -= Math.cos(angleToPlayer) * 40;
              e.y -= Math.sin(angleToPlayer) * 40;
            }

            // Draw Enemy Hull
            ctx.save();
            ctx.translate(e.x, e.y);
            ctx.rotate(angleToPlayer);

            ctx.fillStyle = e.color;
            ctx.shadowColor = e.color;
            ctx.shadowBlur = 10;

            if (e.type === "boss") {
              // Boss Hex Shield/Ship
              ctx.beginPath();
              for (let i = 0; i < 6; i++) {
                const a = (Math.PI / 3) * i;
                const bx = Math.cos(a) * e.radius;
                const by = Math.sin(a) * e.radius;
                if (i === 0) ctx.moveTo(bx, by);
                else ctx.lineTo(bx, by);
              }
              ctx.closePath();
              ctx.fill();
            } else if (e.type === "destroyer") {
              ctx.fillRect(-e.radius, -e.radius, e.radius * 2, e.radius * 2);
            } else {
              // Triangle starfighter
              ctx.beginPath();
              ctx.moveTo(e.radius, 0);
              ctx.lineTo(-e.radius, -e.radius * 0.7);
              ctx.lineTo(-e.radius * 0.4, 0);
              ctx.lineTo(-e.radius, e.radius * 0.7);
              ctx.closePath();
              ctx.fill();
            }

            ctx.restore();

            // Health Bar for Heavy Enemies & Bosses
            if (e.health < e.maxHealth) {
              const barW = e.radius * 2.2;
              const pct = Math.max(0, e.health / e.maxHealth);
              ctx.fillStyle = "rgba(255, 0, 0, 0.6)";
              ctx.fillRect(e.x - barW / 2, e.y - e.radius - 12, barW, 4);
              ctx.fillStyle = "#00ffcc";
              ctx.fillRect(e.x - barW / 2, e.y - e.radius - 12, barW * pct, 4);
            }
          });

          // Filter Dead Enemies & Award XP/Score
          enemiesRef.current = enemiesRef.current.filter((e) => {
            if (e.health <= 0) {
              synth.playExplosion(e.type === "boss");
              screenShakeRef.current = e.type === "boss" ? 15 : 6;

              setScore((s) => s + e.scoreValue * (1 + combo * 0.1));
              setCombo((c) => {
                const newC = c + 1;
                if (newC > highestCombo) setHighestCombo(newC);
                return newC;
              });

              setStats((prev) => ({
                ...prev,
                enemiesDestroyed: prev.enemiesDestroyed + 1,
                bossesKilled: e.type === "boss" ? prev.bossesKilled + 1 : prev.bossesKilled
              }));

              // Spawn XP Gems
              const gemCount = e.type === "boss" ? 15 : e.type === "destroyer" ? 4 : 2;
              for (let g = 0; g < gemCount; g++) {
                gemsRef.current.push({
                  id: nextEntityId.current++,
                  x: e.x + (Math.random() - 0.5) * 30,
                  y: e.y + (Math.random() - 0.5) * 30,
                  value: 15,
                  radius: 5
                });
              }

              // Overdrive energy charge on kill
              p.overdriveEnergy = Math.min(
                100,
                p.overdriveEnergy + 8 * st.overdriveChargeRate
              );

              // Death explosion particles
              for (let i = 0; i < (e.type === "boss" ? 50 : 15); i++) {
                particlesRef.current.push({
                  x: e.x,
                  y: e.y,
                  vx: (Math.random() - 0.5) * 10,
                  vy: (Math.random() - 0.5) * 10,
                  color: e.color,
                  radius: Math.random() * 4 + 2,
                  alpha: 1,
                  decay: 0.04
                });
              }

              return false;
            }
            return true;
          });

          // Check Enemy Wave Progression
          if (enemiesRef.current.length === 0) {
            setWave((wNext) => {
              const newW = wNext + 1;
              spawnWaveEnemies(newW, 10 + newW * 4);
              addFloatingText(`WAVE ${newW} COMMENCING`, w / 2, h / 2 - 100, "#00f0ff");
              return newW;
            });
          }

          // Enemy Bullet Collision with Player
          bulletsRef.current.forEach((b) => {
            if (b.isEnemy) {
              const dist = Math.hypot(b.x - p.x, b.y - p.y);
              if (dist < b.radius + 18 && !p.isDashing) {
                b.lifeTime = 0;
                takePlayerDamage(b.damage);
              }
            }
          });

          // Update Gems Pickup
          gemsRef.current.forEach((g) => {
            const dist = Math.hypot(p.x - g.x, p.y - g.y);
            if (dist < st.magnetRadius) {
              const ang = Math.atan2(p.y - g.y, p.x - g.x);
              g.x += Math.cos(ang) * 8;
              g.y += Math.sin(ang) * 8;
            }

            if (dist < 22) {
              g.radius = 0; // Collected
              synth.playPowerup();
              setXp((currXp) => {
                const nextXp = currXp + g.value;
                if (nextXp >= xpToNext) {
                  setLevel((lvl) => lvl + 1);
                  setXpToNext((target) => Math.round(target * 1.35));
                  triggerLevelUp();
                  return nextXp - xpToNext;
                }
                return nextXp;
              });
            }

            // Draw Gem
            ctx.fillStyle = "#00ffcc";
            ctx.shadowColor = "#00ffcc";
            ctx.shadowBlur = 6;
            ctx.beginPath();
            ctx.arc(g.x, g.y, g.radius, 0, Math.PI * 2);
            ctx.fill();
            ctx.shadowBlur = 0;
          });
          gemsRef.current = gemsRef.current.filter((g) => g.radius > 0);

          // Update & Draw Particles
          particlesRef.current.forEach((pt) => {
            pt.x += pt.vx;
            pt.y += pt.vy;
            pt.alpha -= pt.decay;

            ctx.fillStyle = pt.color;
            ctx.globalAlpha = Math.max(0, pt.alpha);
            ctx.beginPath();
            ctx.arc(pt.x, pt.y, pt.radius, 0, Math.PI * 2);
            ctx.fill();
            ctx.globalAlpha = 1.0;
          });
          particlesRef.current = particlesRef.current.filter((pt) => pt.alpha > 0);

          // Render Player Valkyrie Interceptor Ship
          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.rotate(p.angle);

          // Shield Glow Aura
          if (p.shield > 0) {
            ctx.strokeStyle = "rgba(0, 240, 255, 0.4)";
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(0, 0, 26, 0, Math.PI * 2);
            ctx.stroke();
          }

          // Player Ship Body
          ctx.fillStyle = p.isDashing ? "#ffffff" : "#00f0ff";
          ctx.shadowColor = "#00f0ff";
          ctx.shadowBlur = p.isDashing ? 25 : 12;

          ctx.beginPath();
          ctx.moveTo(22, 0);
          ctx.lineTo(-16, -14);
          ctx.lineTo(-8, 0);
          ctx.lineTo(-16, 14);
          ctx.closePath();
          ctx.fill();

          // Cockpit Glass
          ctx.fillStyle = "#ff0055";
          ctx.beginPath();
          ctx.arc(4, 0, 4, 0, Math.PI * 2);
          ctx.fill();

          ctx.restore();

          // Render Floating Damage/Notification Texts
          floatingTextsRef.current.forEach((ft) => {
            ft.y += ft.vy;
            ft.alpha -= 0.02;

            ctx.font = "bold 14px Inter, sans-serif";
            ctx.fillStyle = ft.color;
            ctx.globalAlpha = Math.max(0, ft.alpha);
            ctx.fillText(ft.text, ft.x, ft.y);
            ctx.globalAlpha = 1.0;
          });
          floatingTextsRef.current = floatingTextsRef.current.filter(
            (ft) => ft.alpha > 0
          );

          ctx.restore();
        }
      }

      animationFrameId = requestAnimationFrame(gameLoop);
    };

    animationFrameId = requestAnimationFrame(gameLoop);
    return () => cancelAnimationFrame(animationFrameId);
  }, [gameState, xpToNext, combo, highestCombo]);

  // Handle Player Damage
  const takePlayerDamage = (amount: number) => {
    const p = playerRef.current;
    screenShakeRef.current = 10;
    synth.playExplosion(false);

    if (p.shield > 0) {
      if (p.shield >= amount) {
        p.shield -= amount;
      } else {
        const overflow = amount - p.shield;
        p.shield = 0;
        p.health -= overflow;
      }
    } else {
      p.health -= amount;
    }

    // Reset Combo Streak on Hit
    setCombo(0);

    if (p.health <= 0) {
      p.health = 0;
      setGameState("gameover");
      synth.playExplosion(true);

      const endTime = Date.now();
      setStats((prev) => ({
        ...prev,
        timeSurvived: Math.round((endTime - startTimeRef.current) / 1000)
      }));
    }
  };

  const currentWeaponInfo = WEAPONS[selectedWeapon];

  return (
    <div className="relative w-full h-screen bg-slate-950 text-white font-sans overflow-hidden select-none">
      {/* HTML5 Game Canvas */}
      <canvas ref={canvasRef} className="absolute inset-0 block w-full h-full cursor-crosshair" />

      {/* TOP HUD BAR */}
      {gameState === "playing" && (
        <div className="absolute top-0 left-0 right-0 p-4 flex items-center justify-between pointer-events-none z-10 bg-gradient-to-b from-slate-950/80 to-transparent">
          {/* Health & Shield Bar */}
          <div className="flex flex-col gap-2 w-72 backdrop-blur-md bg-slate-900/60 p-3 rounded-xl border border-cyan-500/20 shadow-lg">
            <div className="flex items-center justify-between text-xs font-semibold text-cyan-400">
              <span className="flex items-center gap-1">
                <Shield className="w-4 h-4 text-cyan-400" /> SHIELD
              </span>
              <span>
                {Math.round(playerRef.current.shield)} / {playerStatsRef.current.maxShield}
              </span>
            </div>
            <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden border border-cyan-500/30">
              <div
                className="h-full bg-cyan-400 transition-all duration-150"
                style={{
                  width: `${Math.max(
                    0,
                    (playerRef.current.shield / playerStatsRef.current.maxShield) * 100
                  )}%`
                }}
              />
            </div>

            <div className="flex items-center justify-between text-xs font-semibold text-rose-400 mt-1">
              <span className="flex items-center gap-1">
                <Activity className="w-4 h-4 text-rose-400" /> HULL HEALTH
              </span>
              <span>
                {Math.round(playerRef.current.health)} / {playerStatsRef.current.maxHealth}
              </span>
            </div>
            <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden border border-rose-500/30">
              <div
                className="h-full bg-rose-500 transition-all duration-150"
                style={{
                  width: `${Math.max(
                    0,
                    (playerRef.current.health / playerStatsRef.current.maxHealth) * 100
                  )}%`
                }}
              />
            </div>
          </div>

          {/* Center Info: Score, Combo & Wave */}
          <div className="flex flex-col items-center gap-1 backdrop-blur-md bg-slate-900/60 px-6 py-2 rounded-2xl border border-purple-500/20 shadow-xl">
            <div className="text-2xl font-black tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400">
              {score.toLocaleString()} SCORE
            </div>
            <div className="flex items-center gap-4 text-xs font-medium text-slate-300">
              <span>
                WAVE <strong className="text-cyan-400 text-sm">{wave}</strong>
              </span>
              <span>•</span>
              <span>
                COMBO <strong className="text-amber-400 text-sm">{combo}x</strong>
              </span>
              <span>•</span>
              <span>
                LEVEL <strong className="text-purple-400 text-sm">{level}</strong>
              </span>
            </div>
          </div>

          {/* Right Status: Weapon & Overdrive */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className="pointer-events-auto p-2.5 rounded-xl bg-slate-900/80 border border-slate-700/50 hover:border-cyan-400 text-slate-300 hover:text-cyan-400 transition"
            >
              {soundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
            </button>

            <div className="flex flex-col gap-1 backdrop-blur-md bg-slate-900/60 p-3 rounded-xl border border-purple-500/20 shadow-lg text-right">
              <div className="text-xs font-bold text-purple-400 uppercase tracking-wider">
                {currentWeaponInfo.name}
              </div>
              <div className="text-xs text-slate-400 flex items-center justify-end gap-1">
                <Zap className="w-3.5 h-3.5 text-amber-400" /> [E] EMP OVERDRIVE:{" "}
                <strong className="text-cyan-400">
                  {Math.round(playerRef.current.overdriveEnergy)}%
                </strong>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MAIN MENU SCREEN */}
      {gameState === "menu" && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-slate-950/90 backdrop-blur-xl">
          <div className="max-w-2xl w-full mx-4 p-8 rounded-3xl bg-slate-900/90 border border-cyan-500/30 shadow-2xl text-center relative overflow-hidden">
            <div className="absolute -top-32 -left-32 w-64 h-64 bg-cyan-500/20 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-32 -right-32 w-64 h-64 bg-purple-500/20 rounded-full blur-3xl pointer-events-none" />

            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-cyan-950/80 border border-cyan-500/30 text-cyan-400 text-xs font-semibold uppercase tracking-widest mb-6">
              <Sparkles className="w-4 h-4" /> Next-Gen Cyber Space Action
            </div>

            <h1 className="text-5xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-purple-300 to-pink-500 mb-4">
              SOLARIS VALKYRIE ODYSSEY
            </h1>

            <p className="text-slate-300 text-sm leading-relaxed mb-8 max-w-lg mx-auto">
              Command your apex interceptor, harvest plasma energy, survive rogue AI dreadnought
              armadas, and unlock stackable cybernetic matrix upgrades.
            </p>

            {/* Weapon Selector */}
            <div className="mb-8 text-left">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 text-center">
                Select Starting Armament
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {(Object.keys(WEAPONS) as WeaponType[]).map((wKey) => {
                  const wInfo = WEAPONS[wKey];
                  const isSelected = selectedWeapon === wKey;
                  return (
                    <button
                      key={wKey}
                      onClick={() => setSelectedWeapon(wKey)}
                      className={`p-3 rounded-xl border text-left transition flex flex-col justify-between ${
                        isSelected
                          ? "bg-cyan-950/60 border-cyan-400 text-white shadow-lg shadow-cyan-500/10"
                          : "bg-slate-800/40 border-slate-700 text-slate-400 hover:border-slate-500"
                      }`}
                    >
                      <div className="font-bold text-xs text-cyan-300 mb-1">{wInfo.name}</div>
                      <div className="text-[11px] text-slate-400 leading-tight">
                        {wInfo.description}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex items-center justify-center gap-4">
              <Link
                href="/game"
                className="px-6 py-3.5 rounded-xl border border-slate-700 bg-slate-800/50 hover:bg-slate-800 text-slate-300 hover:text-white text-sm font-semibold transition flex items-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" /> Exit
              </Link>

              <button
                onClick={startGame}
                className="px-10 py-3.5 rounded-xl bg-gradient-to-r from-cyan-500 via-purple-600 to-pink-500 hover:from-cyan-400 hover:to-pink-400 text-white text-base font-bold shadow-lg shadow-cyan-500/25 transition transform hover:scale-105 flex items-center gap-2"
              >
                <Play className="w-5 h-5 fill-current" /> LAUNCH MISSION
              </button>
            </div>

            {/* Controls Guide */}
            <div className="mt-8 pt-6 border-t border-slate-800 flex items-center justify-around text-xs text-slate-400">
              <div>
                <strong className="text-slate-200">WASD / ARROWS:</strong> Move Ship
              </div>
              <div>
                <strong className="text-slate-200">MOUSE:</strong> Aim & Fire
              </div>
              <div>
                <strong className="text-slate-200">SPACE:</strong> Dash
              </div>
              <div>
                <strong className="text-slate-200">E KEY:</strong> EMP Overdrive
              </div>
            </div>
          </div>
        </div>
      )}

      {/* LEVEL UP ROGUE-LITE SELECTION MODAL */}
      {gameState === "levelup" && (
        <div className="absolute inset-0 z-30 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4">
          <div className="max-w-2xl w-full p-6 rounded-3xl bg-slate-900 border border-purple-500/40 shadow-2xl text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-950 border border-purple-500/40 text-purple-400 text-xs font-bold uppercase mb-4">
              <Sparkles className="w-4 h-4" /> Matrix Level Up Achieved
            </div>
            <h2 className="text-3xl font-extrabold text-white mb-2">CHOOSE CYBERNETIC UPGRADE</h2>
            <p className="text-slate-400 text-xs mb-6">
              Select one permanent enhancement to integrate into your starfighter systems.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
              {upgradeOptions.map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => selectUpgrade(opt)}
                  className="p-5 rounded-2xl bg-slate-800/60 border border-slate-700 hover:border-purple-400 hover:bg-slate-800 text-left transition flex flex-col justify-between group transform hover:-translate-y-1 shadow-lg"
                >
                  <div>
                    <span
                      className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase mb-2 ${
                        opt.rarity === "legendary"
                          ? "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                          : opt.rarity === "epic"
                          ? "bg-purple-500/20 text-purple-300 border border-purple-500/40"
                          : opt.rarity === "rare"
                          ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40"
                          : "bg-slate-700 text-slate-300"
                      }`}
                    >
                      {opt.rarity}
                    </span>
                    <h3 className="font-bold text-sm text-white group-hover:text-purple-300 mb-1">
                      {opt.name}
                    </h3>
                    <p className="text-xs text-slate-400 leading-relaxed">{opt.description}</p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-700/50 flex items-center justify-between text-xs font-semibold text-purple-400 group-hover:text-purple-300">
                    <span>Equip Matrix</span>
                    <ChevronRight className="w-4 h-4" />
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* GAME OVER SCREEN */}
      {gameState === "gameover" && (
        <div className="absolute inset-0 z-30 flex items-center justify-center bg-slate-950/90 backdrop-blur-xl p-4">
          <div className="max-w-md w-full p-8 rounded-3xl bg-slate-900 border border-rose-500/30 shadow-2xl text-center">
            <div className="w-16 h-16 rounded-full bg-rose-500/10 border border-rose-500/30 flex items-center justify-center mx-auto mb-4 text-rose-500">
              <Activity className="w-8 h-8" />
            </div>

            <h2 className="text-3xl font-black text-white mb-1">MISSION FAILED</h2>
            <p className="text-xs text-slate-400 mb-6">
              Valkyrie interceptor hull severely damaged. Signal lost.
            </p>

            {/* Performance breakdown */}
            <div className="bg-slate-950/60 rounded-2xl p-4 border border-slate-800 space-y-2 mb-6 text-left">
              <div className="flex justify-between text-xs text-slate-400">
                <span>Final Score</span>
                <strong className="text-cyan-400 font-bold">{score.toLocaleString()}</strong>
              </div>
              <div className="flex justify-between text-xs text-slate-400">
                <span>Waves Survived</span>
                <strong className="text-purple-400 font-bold">{wave}</strong>
              </div>
              <div className="flex justify-between text-xs text-slate-400">
                <span>Hostiles Destroyed</span>
                <strong className="text-emerald-400 font-bold">{stats.enemiesDestroyed}</strong>
              </div>
              <div className="flex justify-between text-xs text-slate-400">
                <span>Highest Combo Streak</span>
                <strong className="text-amber-400 font-bold">{highestCombo}x</strong>
              </div>
              <div className="flex justify-between text-xs text-slate-400">
                <span>Time Survived</span>
                <strong className="text-white font-bold">{stats.timeSurvived}s</strong>
              </div>
            </div>

            <div className="flex items-center justify-center gap-3">
              <button
                onClick={startGame}
                className="flex-1 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-400 hover:to-purple-500 text-white font-bold text-sm shadow-lg shadow-cyan-500/20 transition flex items-center justify-center gap-2"
              >
                <RotateCcw className="w-4 h-4" /> RETRY MISSION
              </button>

              <button
                onClick={() => setGameState("menu")}
                className="py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-sm transition"
              >
                MENU
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
