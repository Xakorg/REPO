"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import { 
  Zap, 
  Shield, 
  Crosshair, 
  Award, 
  RotateCcw, 
  Play, 
  Pause, 
  Volume2, 
  VolumeX, 
  Sparkles, 
  Cpu, 
  Flame, 
  Target, 
  Activity, 
  Trophy, 
  ChevronRight, 
  Info,
  Radio,
  Rocket
} from "lucide-react";

// --- TYPES & INTERFACES ---
export type WeaponType = "PLASMA" | "SPREAD" | "RAILGUN" | "HOMING" | "ANTIMATTER";
export type Difficulty = "NORMAL" | "HARDCORE" | "NIGHTMARE";

interface UpgradeOption {
  id: string;
  name: string;
  description: string;
  icon: string;
  apply: (stats: GameStats) => void;
}

interface GameStats {
  damageMult: number;
  fireRateMult: number;
  maxHp: number;
  shieldRegenRate: number;
  moveSpeed: number;
  magnetRadius: number;
  droneCount: number;
  critChance: number;
  empCooldownMult: number;
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
  spark?: boolean;
}

interface FloatingText {
  x: number;
  y: number;
  text: string;
  color: string;
  life: number;
  vy: number;
}

interface Projectile {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  damage: number;
  color: string;
  isEnemy: boolean;
  piercing: number;
  isHoming?: boolean;
  targetId?: number;
  life?: number;
}

interface Enemy {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  hp: number;
  maxHp: number;
  speed: number;
  type: "SCOUT" | "INTERCEPTOR" | "BOMBER" | "ASSASSIN" | "CARRIER" | "BOSS";
  color: string;
  fireTimer: number;
  angle: number;
  bossPhase?: number;
  bossSkillTimer?: number;
}

interface DropItem {
  x: number;
  y: number;
  vx: number;
  vy: number;
  value: number;
  type: "XP" | "CREDIT" | "HEALTH" | "SHIELD";
}

// --- WEB AUDIO SYNTHESIZER ---
class SoundSynth {
  private ctx: AudioContext | null = null;
  public enabled: boolean = true;

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

  playLaser(type: WeaponType) {
    if (!this.enabled) return;
    this.initCtx();
    if (!this.ctx) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.connect(gain);
    gain.connect(this.ctx.destination);

    const now = this.ctx.currentTime;
    if (type === "PLASMA") {
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(800, now);
      osc.frequency.exponentialRampToValueAtTime(150, now + 0.08);
      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.08);
      osc.start(now);
      osc.stop(now + 0.08);
    } else if (type === "SPREAD") {
      osc.type = "square";
      osc.frequency.setValueAtTime(450, now);
      osc.frequency.exponentialRampToValueAtTime(80, now + 0.12);
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.12);
      osc.start(now);
      osc.stop(now + 0.12);
    } else if (type === "RAILGUN") {
      osc.type = "sine";
      osc.frequency.setValueAtTime(1200, now);
      osc.frequency.exponentialRampToValueAtTime(300, now + 0.2);
      gain.gain.setValueAtTime(0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
      osc.start(now);
      osc.stop(now + 0.2);
    } else if (type === "HOMING") {
      osc.type = "triangle";
      osc.frequency.setValueAtTime(600, now);
      osc.frequency.linearRampToValueAtTime(900, now + 0.1);
      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
      osc.start(now);
      osc.stop(now + 0.1);
    } else {
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(300, now);
      osc.frequency.linearRampToValueAtTime(600, now + 0.15);
      gain.gain.setValueAtTime(0.1, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
      osc.start(now);
      osc.stop(now + 0.15);
    }
  }

  playExplosion(isLarge: boolean = false) {
    if (!this.enabled) return;
    this.initCtx();
    if (!this.ctx) return;

    const dur = isLarge ? 0.4 : 0.2;
    const bufferSize = this.ctx.sampleRate * dur;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(isLarge ? 300 : 600, this.ctx.currentTime);
    filter.frequency.exponentialRampToValueAtTime(30, this.ctx.currentTime + dur);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(isLarge ? 0.35 : 0.2, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + dur);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);

    noise.start();
  }

  playEMP() {
    if (!this.enabled) return;
    this.initCtx();
    if (!this.ctx) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = "sine";
    const now = this.ctx.currentTime;
    osc.frequency.setValueAtTime(1500, now);
    osc.frequency.exponentialRampToValueAtTime(100, now + 0.5);
    gain.gain.setValueAtTime(0.4, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.5);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.5);
  }

  playOverdrive() {
    if (!this.enabled) return;
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(200, now);
    osc.frequency.exponentialRampToValueAtTime(1200, now + 0.6);
    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.6);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.6);
  }

  playLevelUp() {
    if (!this.enabled) return;
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    [523.25, 659.25, 783.99, 1046.50].forEach((freq, idx) => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(freq, now + idx * 0.08);
      gain.gain.setValueAtTime(0.2, now + idx * 0.08);
      gain.gain.exponentialRampToValueAtTime(0.01, now + idx * 0.08 + 0.12);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now + idx * 0.08);
      osc.stop(now + idx * 0.08 + 0.12);
    });
  }

  playDrop() {
    if (!this.enabled) return;
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(800, now);
    osc.frequency.exponentialRampToValueAtTime(1400, now + 0.06);
    gain.gain.setValueAtTime(0.1, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.06);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.06);
  }
}

const synth = new SoundSynth();

// --- MAIN COMPONENT ---
export default function NeonVanguardOverdriveGame() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // --- GAME STATES ---
  const [gameState, setGameState] = useState<"MENU" | "PLAYING" | "PAUSED" | "UPGRADE" | "GAMEOVER">("MENU");
  const [difficulty, setDifficulty] = useState<Difficulty>("NORMAL");
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);

  // --- STATS & METRICS ---
  const [score, setScore] = useState<number>(0);
  const [highScore, setHighScore] = useState<number>(0);
  const [kills, setKills] = useState<number>(0);
  const [wave, setWave] = useState<number>(1);
  const [level, setLevel] = useState<number>(1);
  const [xp, setXp] = useState<number>(0);
  const [xpToNext, setXpToNext] = useState<number>(100);
  const [hp, setHp] = useState<number>(100);
  const [maxHp, setMaxHp] = useState<number>(100);
  const [shield, setShield] = useState<number>(50);
  const [maxShield, setMaxShield] = useState<number>(50);
  const [overdrive, setOverdrive] = useState<number>(0);
  const [isOverdriveActive, setIsOverdriveActive] = useState<boolean>(false);
  const [empCooldown, setEmpCooldown] = useState<number>(0);
  const [dashCooldown, setDashCooldown] = useState<number>(0);
  const [activeWeapon, setActiveWeapon] = useState<WeaponType>("PLASMA");
  const [combo, setCombo] = useState<number>(0);
  const [survivalTime, setSurvivalTime] = useState<number>(0);

  // Upgrades
  const [availableUpgrades, setAvailableUpgrades] = useState<UpgradeOption[]>([]);

  // Persistent Player Stats
  const statsRef = useRef<GameStats>({
    damageMult: 1.0,
    fireRateMult: 1.0,
    maxHp: 100,
    shieldRegenRate: 1.5,
    moveSpeed: 6.0,
    magnetRadius: 160,
    droneCount: 0,
    critChance: 0.1,
    empCooldownMult: 1.0,
  });

  // Game Loop References
  const keysRef = useRef<{ [key: string]: boolean }>({});
  const mouseRef = useRef<{ x: number; y: number; down: boolean }>({ x: 0, y: 0, down: false });
  const animFrameId = useRef<number | null>(null);

  // Game Object Collections
  const playerRef = useRef({
    x: 400,
    y: 300,
    vx: 0,
    vy: 0,
    angle: 0,
    radius: 18,
    invulnTimer: 0,
    lastShoot: 0,
    empTimer: 0,
    dashTimer: 0,
    overdriveTimer: 0,
  });

  const projectilesRef = useRef<Projectile[]>([]);
  const enemiesRef = useRef<Enemy[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const floatTextsRef = useRef<FloatingText[]>([]);
  const dropsRef = useRef<DropItem[]>([]);
  const nextEntityId = useRef<number>(1);
  const waveTimerRef = useRef<number>(0);
  const startTimeRef = useRef<number>(0);

  // Load High Score on Mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedScore = localStorage.getItem("neon_vanguard_highscore");
      if (savedScore) {
        setHighScore(parseInt(savedScore, 10));
      }
    }
  }, []);

  // Keyboard Event Handlers
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      keysRef.current[e.key.toLowerCase()] = true;

      // Quick weapon hotkeys 1-5
      if (e.key === "1") setActiveWeapon("PLASMA");
      if (e.key === "2") setActiveWeapon("SPREAD");
      if (e.key === "3") setActiveWeapon("RAILGUN");
      if (e.key === "4") setActiveWeapon("HOMING");
      if (e.key === "5") setActiveWeapon("ANTIMATTER");

      // Pause toggle
      if (e.key === "p" || e.key === "Escape") {
        if (gameState === "PLAYING") setGameState("PAUSED");
        else if (gameState === "PAUSED") setGameState("PLAYING");
      }

      // Abilities
      if (e.key.toLowerCase() === "e") triggerEMP();
      if (e.key.toLowerCase() === "r") triggerOverdrive();
      if (e.key === "Shift") triggerDash();
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      keysRef.current[e.key.toLowerCase()] = false;
      if (e.key === "Shift") keysRef.current["shift"] = false;
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [gameState, empCooldown, overdrive, dashCooldown]);

  // Mouse Handlers
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    mouseRef.current.x = e.clientX - rect.left;
    mouseRef.current.y = e.clientY - rect.top;
  };

  const handleMouseDown = () => {
    mouseRef.current.down = true;
  };

  const handleMouseUp = () => {
    mouseRef.current.down = false;
  };

  // --- ABILITY TRIGGERS ---
  const triggerEMP = () => {
    if (empCooldown > 0 && !playerRef.current.overdriveTimer) return;
    const player = playerRef.current;
    synth.playEMP();

    // Clear all enemy projectiles
    projectilesRef.current = projectilesRef.current.filter((p) => !p.isEnemy);

    // Damage and push back enemies
    enemiesRef.current.forEach((enemy) => {
      const dx = enemy.x - player.x;
      const dy = enemy.y - player.y;
      const dist = Math.hypot(dx, dy);
      if (dist < 320) {
        enemy.hp -= 80 * statsRef.current.damageMult;
        const pushAngle = Math.atan2(dy, dx);
        enemy.vx += Math.cos(pushAngle) * 15;
        enemy.vy += Math.sin(pushAngle) * 15;
      }
    });

    // Particle shockwave ring
    for (let i = 0; i < 48; i++) {
      const angle = (Math.PI * 2 * i) / 48;
      const speed = 10;
      particlesRef.current.push({
        x: player.x,
        y: player.y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color: "#00f0ff",
        size: 4,
        life: 25,
        maxLife: 25,
      });
    }

    setEmpCooldown(10 * statsRef.current.empCooldownMult);
  };

  const triggerOverdrive = () => {
    if (overdrive < 100 && !playerRef.current.overdriveTimer) return;
    if (playerRef.current.overdriveTimer > 0) return;

    synth.playOverdrive();
    playerRef.current.overdriveTimer = 480; // 8 seconds at 60fps
    setOverdrive(0);
    setIsOverdriveActive(true);

    // Blast effect
    for (let i = 0; i < 60; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 12 + 4;
      particlesRef.current.push({
        x: playerRef.current.x,
        y: playerRef.current.y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color: i % 2 === 0 ? "#ff007f" : "#7928ca",
        size: Math.random() * 6 + 3,
        life: 35,
        maxLife: 35,
      });
    }
  };

  const triggerDash = () => {
    if (dashCooldown > 0) return;
    const player = playerRef.current;
    const moveAngle = Math.atan2(
      mouseRef.current.y - player.y,
      mouseRef.current.x - player.x
    );

    player.vx += Math.cos(moveAngle) * 18;
    player.vy += Math.sin(moveAngle) * 18;
    player.invulnTimer = 20;
    setDashCooldown(2.5);

    // Leave phantom ghost particles
    for (let i = 0; i < 16; i++) {
      particlesRef.current.push({
        x: player.x + (Math.random() - 0.5) * 20,
        y: player.y + (Math.random() - 0.5) * 20,
        vx: -Math.cos(moveAngle) * 3,
        vy: -Math.sin(moveAngle) * 3,
        color: "#00f0ff",
        size: 6,
        life: 20,
        maxLife: 20,
      });
    }
  };

  // --- START & RESET GAME ---
  const startGame = () => {
    setScore(0);
    setKills(0);
    setWave(1);
    setLevel(1);
    setXp(0);
    setXpToNext(100);
    setHp(100);
    setMaxHp(100);
    setShield(50);
    setMaxShield(50);
    setOverdrive(0);
    setIsOverdriveActive(false);
    setEmpCooldown(0);
    setDashCooldown(0);
    setCombo(0);
    setSurvivalTime(0);
    setActiveWeapon("PLASMA");

    statsRef.current = {
      damageMult: difficulty === "NIGHTMARE" ? 0.8 : difficulty === "HARDCORE" ? 0.9 : 1.0,
      fireRateMult: 1.0,
      maxHp: 100,
      shieldRegenRate: 1.5,
      moveSpeed: 6.0,
      magnetRadius: 160,
      droneCount: 0,
      critChance: 0.1,
      empCooldownMult: 1.0,
    };

    playerRef.current = {
      x: 400,
      y: 300,
      vx: 0,
      vy: 0,
      angle: 0,
      radius: 18,
      invulnTimer: 60,
      lastShoot: 0,
      empTimer: 0,
      dashTimer: 0,
      overdriveTimer: 0,
    };

    projectilesRef.current = [];
    enemiesRef.current = [];
    particlesRef.current = [];
    floatTextsRef.current = [];
    dropsRef.current = [];
    waveTimerRef.current = 0;
    startTimeRef.current = Date.now();

    setGameState("PLAYING");
  };

  // --- LEVEL UP UPGRADES GENERATOR ---
  const triggerLevelUp = (newLevel: number) => {
    synth.playLevelUp();

    const pool: UpgradeOption[] = [
      {
        id: "damage",
        name: "Plasma Surge Core",
        description: "+25% All Weapon Damage",
        icon: "Flame",
        apply: (st) => { st.damageMult *= 1.25; }
      },
      {
        id: "firerate",
        name: "Hyper-Overclock Array",
        description: "+20% Weapon Fire Rate",
        icon: "Zap",
        apply: (st) => { st.fireRateMult *= 1.20; }
      },
      {
        id: "maxhp",
        name: "Nanite Armor Plating",
        description: "+30 Max HP & Instant Full Heal",
        icon: "Shield",
        apply: (st) => { 
          st.maxHp += 30; 
          setMaxHp(st.maxHp);
          setHp(st.maxHp);
        }
      },
      {
        id: "shield",
        name: "Aegis Matrix Shielding",
        description: "+50% Shield Recharge Rate",
        icon: "Cpu",
        apply: (st) => { st.shieldRegenRate *= 1.5; }
      },
      {
        id: "speed",
        name: "Tachyon Engine Thrusters",
        description: "+15% Flight Movement Speed",
        icon: "Rocket",
        apply: (st) => { st.moveSpeed *= 1.15; }
      },
      {
        id: "drone",
        name: "Autonomous Laser Drone",
        description: "Deploy orbiting attack drone (+1 Drone)",
        icon: "Radio",
        apply: (st) => { st.droneCount += 1; }
      },
      {
        id: "magnet",
        name: "Quantum Gravity Attractor",
        description: "+40% Data & Credit Attraction Radius",
        icon: "Target",
        apply: (st) => { st.magnetRadius *= 1.4; }
      },
      {
        id: "crit",
        name: "Targeting Matrix Chip",
        description: "+15% Critical Hit Chance (2.5x Damage)",
        icon: "Crosshair",
        apply: (st) => { st.critChance += 0.15; }
      }
    ];

    // Pick 3 distinct upgrades randomly
    const shuffled = [...pool].sort(() => 0.5 - Math.random());
    setAvailableUpgrades(shuffled.slice(0, 3));
    setGameState("UPGRADE");
  };

  const selectUpgrade = (upgrade: UpgradeOption) => {
    upgrade.apply(statsRef.current);
    setGameState("PLAYING");
  };

  // --- SPAWN ENEMIES ---
  const spawnEnemy = useCallback((type: Enemy["type"]) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const width = canvas.width || 800;
    const height = canvas.height || 600;

    // Spawn on border
    let x = 0, y = 0;
    if (Math.random() < 0.5) {
      x = Math.random() < 0.5 ? -40 : width + 40;
      y = Math.random() * height;
    } else {
      x = Math.random() * width;
      y = Math.random() < 0.5 ? -40 : height + 40;
    }

    let hpVal = 40;
    let radiusVal = 14;
    let speedVal = 2.5;
    let colorVal = "#ff0055";

    if (type === "SCOUT") {
      hpVal = 30;
      radiusVal = 12;
      speedVal = 3.8;
      colorVal = "#00ffaa";
    } else if (type === "INTERCEPTOR") {
      hpVal = 60;
      radiusVal = 16;
      speedVal = 2.8;
      colorVal = "#00f0ff";
    } else if (type === "BOMBER") {
      hpVal = 140;
      radiusVal = 22;
      speedVal = 1.6;
      colorVal = "#ffaa00";
    } else if (type === "ASSASSIN") {
      hpVal = 80;
      radiusVal = 15;
      speedVal = 4.5;
      colorVal = "#bf00ff";
    } else if (type === "CARRIER") {
      hpVal = 260;
      radiusVal = 28;
      speedVal = 1.2;
      colorVal = "#ff00aa";
    } else if (type === "BOSS") {
      x = width / 2;
      y = -100;
      hpVal = 1200 + wave * 400;
      radiusVal = 45;
      speedVal = 1.0;
      colorVal = "#ff0000";
      synth.playExplosion(true);
    }

    // Scale with difficulty & wave
    const mult = difficulty === "NIGHTMARE" ? 1.5 : difficulty === "HARDCORE" ? 1.25 : 1.0;
    hpVal *= (1 + wave * 0.15) * mult;

    enemiesRef.current.push({
      id: nextEntityId.current++,
      x,
      y,
      vx: 0,
      vy: 0,
      radius: radiusVal,
      hp: hpVal,
      maxHp: hpVal,
      speed: speedVal,
      type,
      color: colorVal,
      fireTimer: 0,
      angle: 0,
      bossPhase: type === "BOSS" ? 1 : undefined,
      bossSkillTimer: 0,
    });
  }, [wave, difficulty]);

  // --- MAIN CANVAS RENDER & TICK LOOP ---
  useEffect(() => {
    if (gameState !== "PLAYING") return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let lastFrameTime = performance.now();

    const gameLoop = (currentTime: number) => {
      const delta = (currentTime - lastFrameTime) / 1000;
      lastFrameTime = currentTime;

      // Update Survival Time
      setSurvivalTime(Math.floor((Date.now() - startTimeRef.current) / 1000));

      // Decrement Cooldowns
      setEmpCooldown((prev) => Math.max(0, prev - delta));
      setDashCooldown((prev) => Math.max(0, prev - delta));

      // --- PLAYER MOVEMENT & LOGIC ---
      const player = playerRef.current;
      const stats = statsRef.current;

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

      player.vx += dx * stats.moveSpeed * 0.4;
      player.vy += dy * stats.moveSpeed * 0.4;
      player.vx *= 0.86; // Friction
      player.vy *= 0.86;

      player.x += player.vx;
      player.y += player.vy;

      // Canvas boundary constraint
      player.x = Math.max(player.radius, Math.min(canvas.width - player.radius, player.x));
      player.y = Math.max(player.radius, Math.min(canvas.height - player.radius, player.y));

      // Player rotation to mouse
      player.angle = Math.atan2(mouseRef.current.y - player.y, mouseRef.current.x - player.x);

      // Timers
      if (player.invulnTimer > 0) player.invulnTimer--;
      if (player.overdriveTimer > 0) {
        player.overdriveTimer--;
        if (player.overdriveTimer <= 0) {
          setIsOverdriveActive(false);
        }
      }

      // Shield Regeneration
      setShield((prevShield) => Math.min(maxShield, prevShield + (stats.shieldRegenRate * delta)));

      // Engine Exhaust Particles
      if (Math.hypot(player.vx, player.vy) > 0.5) {
        const backAngle = player.angle + Math.PI;
        particlesRef.current.push({
          x: player.x + Math.cos(backAngle) * 14,
          y: player.y + Math.sin(backAngle) * 14,
          vx: Math.cos(backAngle) * 3 + (Math.random() - 0.5) * 1,
          vy: Math.sin(backAngle) * 3 + (Math.random() - 0.5) * 1,
          color: player.overdriveTimer > 0 ? "#ff007f" : "#00f0ff",
          size: Math.random() * 4 + 2,
          life: 15,
          maxLife: 15,
        });
      }

      // --- SHOOTING LOGIC ---
      const now = performance.now();
      const fireInterval = player.overdriveTimer > 0 ? 80 : 150 / stats.fireRateMult;

      if ((mouseRef.current.down || keysRef.current[" "]) && now - player.lastShoot > fireInterval) {
        player.lastShoot = now;
        synth.playLaser(activeWeapon);

        const baseDamage = 25 * stats.damageMult;
        const isCrit = Math.random() < stats.critChance;
        const finalDamage = isCrit ? baseDamage * 2.5 : baseDamage;

        if (activeWeapon === "PLASMA") {
          // Dual plasma bolts
          const perpAngle = player.angle + Math.PI / 2;
          [-8, 8].forEach((offset) => {
            projectilesRef.current.push({
              id: nextEntityId.current++,
              x: player.x + Math.cos(perpAngle) * offset,
              y: player.y + Math.sin(perpAngle) * offset,
              vx: Math.cos(player.angle) * 14,
              vy: Math.sin(player.angle) * 14,
              radius: 4,
              damage: finalDamage,
              color: isCrit ? "#ffff00" : "#00f0ff",
              isEnemy: false,
              piercing: 1,
            });
          });
        } else if (activeWeapon === "SPREAD") {
          // 5-way spread
          [-0.3, -0.15, 0, 0.15, 0.3].forEach((angOffset) => {
            const spreadAngle = player.angle + angOffset;
            projectilesRef.current.push({
              id: nextEntityId.current++,
              x: player.x,
              y: player.y,
              vx: Math.cos(spreadAngle) * 12,
              vy: Math.sin(spreadAngle) * 12,
              radius: 5,
              damage: finalDamage * 0.65,
              color: "#ff00ff",
              isEnemy: false,
              piercing: 1,
            });
          });
        } else if (activeWeapon === "RAILGUN") {
          // Fast piercing beam
          projectilesRef.current.push({
            id: nextEntityId.current++,
            x: player.x,
            y: player.y,
            vx: Math.cos(player.angle) * 22,
            vy: Math.sin(player.angle) * 22,
            radius: 7,
            damage: finalDamage * 1.8,
            color: "#00ffaa",
            isEnemy: false,
            piercing: 4,
          });
        } else if (activeWeapon === "HOMING") {
          // Seeking missiles
          const target = enemiesRef.current[0];
          projectilesRef.current.push({
            id: nextEntityId.current++,
            x: player.x,
            y: player.y,
            vx: Math.cos(player.angle) * 9,
            vy: Math.sin(player.angle) * 9,
            radius: 6,
            damage: finalDamage * 1.2,
            color: "#ffaa00",
            isEnemy: false,
            piercing: 1,
            isHoming: true,
            targetId: target ? target.id : undefined,
          });
        } else if (activeWeapon === "ANTIMATTER") {
          // Giant antimatter ray
          projectilesRef.current.push({
            id: nextEntityId.current++,
            x: player.x,
            y: player.y,
            vx: Math.cos(player.angle) * 16,
            vy: Math.sin(player.angle) * 16,
            radius: 12,
            damage: finalDamage * 2.2,
            color: "#bf00ff",
            isEnemy: false,
            piercing: 99,
          });
        }
      }

      // --- ORBITAL DRONES ---
      if (stats.droneCount > 0) {
        for (let d = 0; d < stats.droneCount; d++) {
          const droneAngle = (now / 400) + ((Math.PI * 2 * d) / stats.droneCount);
          const droneX = player.x + Math.cos(droneAngle) * 55;
          const droneY = player.y + Math.sin(droneAngle) * 55;

          // Drone auto fire nearest enemy
          if (now % 300 < 20 && enemiesRef.current.length > 0) {
            const target = enemiesRef.current[0];
            const aimAngle = Math.atan2(target.y - droneY, target.x - droneX);
            projectilesRef.current.push({
              id: nextEntityId.current++,
              x: droneX,
              y: droneY,
              vx: Math.cos(aimAngle) * 12,
              vy: Math.sin(aimAngle) * 12,
              radius: 3,
              damage: 15 * stats.damageMult,
              color: "#00f0ff",
              isEnemy: false,
              piercing: 1,
            });
          }

          // Draw Drone
          ctx.save();
          ctx.beginPath();
          ctx.arc(droneX, droneY, 6, 0, Math.PI * 2);
          ctx.fillStyle = "#00f0ff";
          ctx.shadowBlur = 10;
          ctx.shadowColor = "#00f0ff";
          ctx.fill();
          ctx.restore();
        }
      }

      // --- PROJECTILES LOGIC ---
      projectilesRef.current.forEach((proj) => {
        // Homing Adjustment
        if (proj.isHoming && proj.targetId) {
          const t = enemiesRef.current.find((e) => e.id === proj.targetId);
          if (t) {
            const targetAngle = Math.atan2(t.y - proj.y, t.x - proj.x);
            proj.vx += Math.cos(targetAngle) * 0.8;
            proj.vy += Math.sin(targetAngle) * 0.8;
            const speed = Math.hypot(proj.vx, proj.vy);
            if (speed > 11) {
              proj.vx = (proj.vx / speed) * 11;
              proj.vy = (proj.vy / speed) * 11;
            }
          }
        }

        proj.x += proj.vx;
        proj.y += proj.vy;

        // Projectile particles
        if (Math.random() < 0.4) {
          particlesRef.current.push({
            x: proj.x,
            y: proj.y,
            vx: -proj.vx * 0.2,
            vy: -proj.vy * 0.2,
            color: proj.color,
            size: 2,
            life: 10,
            maxLife: 10,
          });
        }
      });

      // Filter out of bounds
      projectilesRef.current = projectilesRef.current.filter(
        (p) => p.x >= -50 && p.x <= canvas.width + 50 && p.y >= -50 && p.y <= canvas.height + 50 && p.piercing > 0
      );

      // --- ENEMY SPAWNING & AI ---
      waveTimerRef.current += delta;
      if (waveTimerRef.current > 4) {
        waveTimerRef.current = 0;
        const enemyTypes: Enemy["type"][] = ["SCOUT", "INTERCEPTOR", "BOMBER", "ASSASSIN"];
        if (wave >= 3) enemyTypes.push("CARRIER");
        const countToSpawn = Math.min(10, Math.floor(wave * 1.5));

        for (let i = 0; i < countToSpawn; i++) {
          const randType = enemyTypes[Math.floor(Math.random() * enemyTypes.length)];
          spawnEnemy(randType);
        }

        // Spawn Boss on wave multiples of 5
        if (wave % 5 === 0 && !enemiesRef.current.some((e) => e.type === "BOSS")) {
          spawnEnemy("BOSS");
        }
      }

      // Update Enemies
      enemiesRef.current.forEach((enemy) => {
        const angleToPlayer = Math.atan2(player.y - enemy.y, player.x - enemy.x);
        enemy.angle = angleToPlayer;

        // Friction on pushback
        enemy.vx *= 0.9;
        enemy.vy *= 0.9;

        // AI behavior by type
        if (enemy.type === "SCOUT") {
          enemy.x += Math.cos(angleToPlayer) * enemy.speed + enemy.vx;
          enemy.y += Math.sin(angleToPlayer) * enemy.speed + enemy.vy;
        } else if (enemy.type === "INTERCEPTOR") {
          // Maintain medium distance and shoot
          const dist = Math.hypot(player.x - enemy.x, player.y - enemy.y);
          if (dist > 220) {
            enemy.x += Math.cos(angleToPlayer) * enemy.speed + enemy.vx;
            enemy.y += Math.sin(angleToPlayer) * enemy.speed + enemy.vy;
          }
          enemy.fireTimer += delta;
          if (enemy.fireTimer > 1.8) {
            enemy.fireTimer = 0;
            projectilesRef.current.push({
              id: nextEntityId.current++,
              x: enemy.x,
              y: enemy.y,
              vx: Math.cos(angleToPlayer) * 7,
              vy: Math.sin(angleToPlayer) * 7,
              radius: 4,
              damage: 15,
              color: "#ff0055",
              isEnemy: true,
              piercing: 1,
            });
          }
        } else if (enemy.type === "BOMBER") {
          enemy.x += Math.cos(angleToPlayer) * enemy.speed + enemy.vx;
          enemy.y += Math.sin(angleToPlayer) * enemy.speed + enemy.vy;
          enemy.fireTimer += delta;
          if (enemy.fireTimer > 2.5) {
            enemy.fireTimer = 0;
            // 8-directional cluster mine burst
            for (let b = 0; b < 8; b++) {
              const bAngle = (Math.PI * 2 * b) / 8;
              projectilesRef.current.push({
                id: nextEntityId.current++,
                x: enemy.x,
                y: enemy.y,
                vx: Math.cos(bAngle) * 4,
                vy: Math.sin(bAngle) * 4,
                radius: 5,
                damage: 22,
                color: "#ffaa00",
                isEnemy: true,
                piercing: 1,
              });
            }
          }
        } else if (enemy.type === "ASSASSIN") {
          // Fast dash
          enemy.x += Math.cos(angleToPlayer) * enemy.speed * 1.2 + enemy.vx;
          enemy.y += Math.sin(angleToPlayer) * enemy.speed * 1.2 + enemy.vy;
        } else if (enemy.type === "CARRIER") {
          enemy.x += Math.cos(angleToPlayer) * enemy.speed + enemy.vx;
          enemy.y += Math.sin(angleToPlayer) * enemy.speed + enemy.vy;
          enemy.fireTimer += delta;
          if (enemy.fireTimer > 4.0) {
            enemy.fireTimer = 0;
            spawnEnemy("SCOUT");
          }
        } else if (enemy.type === "BOSS") {
          // Move towards top center position
          const targetY = 120;
          enemy.y += (targetY - enemy.y) * 0.05;
          enemy.x += Math.sin(now / 800) * 3;

          enemy.fireTimer += delta;
          if (enemy.fireTimer > 0.3) {
            enemy.fireTimer = 0;
            // Radial bullet spiral
            const spiralAngle = (now / 200) % (Math.PI * 2);
            for (let p = 0; p < 3; p++) {
              const finalA = spiralAngle + (p * Math.PI * 2) / 3;
              projectilesRef.current.push({
                id: nextEntityId.current++,
                x: enemy.x,
                y: enemy.y,
                vx: Math.cos(finalA) * 6,
                vy: Math.sin(finalA) * 6,
                radius: 6,
                damage: 20,
                color: "#ff0000",
                isEnemy: true,
                piercing: 1,
              });
            }
          }
        }
      });

      // --- COLLISIONS: PLAYER & ENEMY PROJECTILES ---
      projectilesRef.current.forEach((proj) => {
        if (proj.isEnemy) {
          // Check collision with player
          const dist = Math.hypot(proj.x - player.x, proj.y - player.y);
          if (dist < proj.radius + player.radius && player.invulnTimer <= 0) {
            proj.piercing = 0;
            let dmg = proj.damage;

            // Shield absorbs first
            setShield((prevShield) => {
              if (prevShield >= dmg) {
                return prevShield - dmg;
              } else {
                const remainingDmg = dmg - prevShield;
                setHp((prevHp) => {
                  const newHp = prevHp - remainingDmg;
                  if (newHp <= 0) triggerGameOver();
                  return Math.max(0, newHp);
                });
                return 0;
              }
            });

            player.invulnTimer = 25; // iframe buffer
            synth.playExplosion(false);

            // Screen hit sparks
            for (let s = 0; s < 12; s++) {
              particlesRef.current.push({
                x: player.x,
                y: player.y,
                vx: (Math.random() - 0.5) * 8,
                vy: (Math.random() - 0.5) * 8,
                color: "#ff0055",
                size: 3,
                life: 15,
                maxLife: 15,
              });
            }
          }
        } else {
          // Player projectile hit enemies
          enemiesRef.current.forEach((enemy) => {
            const dist = Math.hypot(proj.x - enemy.x, proj.y - enemy.y);
            if (dist < proj.radius + enemy.radius && proj.piercing > 0) {
              proj.piercing--;
              enemy.hp -= proj.damage;

              // Knockback impulse
              const pushAngle = Math.atan2(enemy.y - proj.y, enemy.x - proj.x);
              enemy.vx += Math.cos(pushAngle) * 3;
              enemy.vy += Math.sin(pushAngle) * 3;

              // Floating damage text
              floatTextsRef.current.push({
                x: enemy.x + (Math.random() - 0.5) * 20,
                y: enemy.y - 10,
                text: Math.round(proj.damage).toString(),
                color: proj.color,
                life: 25,
                vy: -1.2,
              });

              // Hit particles
              for (let hp = 0; hp < 5; hp++) {
                particlesRef.current.push({
                  x: proj.x,
                  y: proj.y,
                  vx: (Math.random() - 0.5) * 6,
                  vy: (Math.random() - 0.5) * 6,
                  color: proj.color,
                  size: 3,
                  life: 12,
                  maxLife: 12,
                });
              }
            }
          });
        }
      });

      // --- REMOVE DEAD ENEMIES & DROPS ---
      enemiesRef.current = enemiesRef.current.filter((enemy) => {
        if (enemy.hp <= 0) {
          synth.playExplosion(enemy.type === "BOSS");
          setKills((prev) => prev + 1);
          setCombo((prev) => prev + 1);

          // Overdrive meter gain
          setOverdrive((prev) => Math.min(100, prev + (enemy.type === "BOSS" ? 40 : 8)));

          // Score calc
          const pointVal = enemy.type === "BOSS" ? 2500 : enemy.type === "CARRIER" ? 450 : 100;
          setScore((prev) => prev + pointVal * (1 + combo * 0.1));

          // Drop XP / Health
          dropsRef.current.push({
            x: enemy.x,
            y: enemy.y,
            vx: (Math.random() - 0.5) * 3,
            vy: (Math.random() - 0.5) * 3,
            value: enemy.type === "BOSS" ? 150 : 25,
            type: Math.random() < 0.15 ? "HEALTH" : "XP",
          });

          // Death explosion particles
          const pCount = enemy.type === "BOSS" ? 60 : 18;
          for (let p = 0; p < pCount; p++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = Math.random() * 8 + 2;
            particlesRef.current.push({
              x: enemy.x,
              y: enemy.y,
              vx: Math.cos(angle) * speed,
              vy: Math.sin(angle) * speed,
              color: enemy.color,
              size: Math.random() * 5 + 2,
              life: 25,
              maxLife: 25,
            });
          }

          // If boss died, increment wave
          if (enemy.type === "BOSS") {
            setWave((w) => w + 1);
          }

          return false;
        }
        return true;
      });

      // --- DROPS LOGIC ---
      dropsRef.current.forEach((drop) => {
        const dx = player.x - drop.x;
        const dy = player.y - drop.y;
        const dist = Math.hypot(dx, dy);

        // Magnet attraction
        if (dist < stats.magnetRadius) {
          const angle = Math.atan2(dy, dx);
          drop.vx += Math.cos(angle) * 1.5;
          drop.vy += Math.sin(angle) * 1.5;
        }

        drop.vx *= 0.92;
        drop.vy *= 0.92;
        drop.x += drop.vx;
        drop.y += drop.vy;

        // Pickup collision
        if (dist < player.radius + 12) {
          synth.playDrop();
          if (drop.type === "XP") {
            setXp((prevXp) => {
              const newXp = prevXp + drop.value;
              if (newXp >= xpToNext) {
                setLevel((lvl) => {
                  triggerLevelUp(lvl + 1);
                  return lvl + 1;
                });
                setXpToNext((prev) => Math.floor(prev * 1.35));
                return 0;
              }
              return newXp;
            });
          } else if (drop.type === "HEALTH") {
            setHp((prev) => Math.min(maxHp, prev + 25));
          }
          drop.value = 0; // Mark for cleanup
        }
      });

      dropsRef.current = dropsRef.current.filter((d) => d.value > 0);

      // --- RENDERING CANVAS DRAWINGS ---
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Deep Space Parallax Grid Background
      ctx.strokeStyle = player.overdriveTimer > 0 ? "rgba(255, 0, 127, 0.15)" : "rgba(0, 240, 255, 0.06)";
      ctx.lineWidth = 1;
      const gridSize = 40;
      const offsetX = (player.x * 0.1) % gridSize;
      const offsetY = (player.y * 0.1) % gridSize;

      for (let x = -gridSize; x < canvas.width + gridSize; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x - offsetX, 0);
        ctx.lineTo(x - offsetX, canvas.height);
        ctx.stroke();
      }
      for (let y = -gridSize; y < canvas.height + gridSize; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y - offsetY);
        ctx.lineTo(canvas.width, y - offsetY);
        ctx.stroke();
      }

      // Draw Drops
      dropsRef.current.forEach((drop) => {
        ctx.save();
        ctx.beginPath();
        ctx.arc(drop.x, drop.y, 5, 0, Math.PI * 2);
        ctx.fillStyle = drop.type === "HEALTH" ? "#00ffaa" : "#ffd700";
        ctx.shadowBlur = 10;
        ctx.shadowColor = drop.type === "HEALTH" ? "#00ffaa" : "#ffd700";
        ctx.fill();
        ctx.restore();
      });

      // Draw Enemies
      enemiesRef.current.forEach((enemy) => {
        ctx.save();
        ctx.translate(enemy.x, enemy.y);
        ctx.rotate(enemy.angle);

        ctx.beginPath();
        if (enemy.type === "BOSS") {
          // Octagon Boss shape
          const sides = 8;
          for (let i = 0; i < sides; i++) {
            const a = (Math.PI * 2 * i) / sides;
            const px = Math.cos(a) * enemy.radius;
            const py = Math.sin(a) * enemy.radius;
            if (i === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
          }
        } else if (enemy.type === "CARRIER") {
          ctx.rect(-enemy.radius, -enemy.radius, enemy.radius * 2, enemy.radius * 2);
        } else {
          // Sharp triangle ships
          ctx.moveTo(enemy.radius, 0);
          ctx.lineTo(-enemy.radius, -enemy.radius * 0.8);
          ctx.lineTo(-enemy.radius * 0.4, 0);
          ctx.lineTo(-enemy.radius, enemy.radius * 0.8);
        }
        ctx.closePath();

        ctx.fillStyle = enemy.color;
        ctx.shadowBlur = 12;
        ctx.shadowColor = enemy.color;
        ctx.fill();
        ctx.restore();

        // Enemy HP Bar for Boss / Heavy
        if (enemy.type === "BOSS" || enemy.type === "CARRIER") {
          ctx.fillStyle = "rgba(0, 0, 0, 0.6)";
          ctx.fillRect(enemy.x - 30, enemy.y - enemy.radius - 12, 60, 6);
          ctx.fillStyle = enemy.color;
          ctx.fillRect(enemy.x - 30, enemy.y - enemy.radius - 12, (enemy.hp / enemy.maxHp) * 60, 6);
        }
      });

      // Draw Projectiles
      projectilesRef.current.forEach((proj) => {
        ctx.save();
        ctx.beginPath();
        ctx.arc(proj.x, proj.y, proj.radius, 0, Math.PI * 2);
        ctx.fillStyle = proj.color;
        ctx.shadowBlur = 12;
        ctx.shadowColor = proj.color;
        ctx.fill();
        ctx.restore();
      });

      // Draw Player Fighter Ship
      ctx.save();
      ctx.translate(player.x, player.y);
      ctx.rotate(player.angle);

      // Invulnerability flicker
      if (player.invulnTimer % 4 < 2) {
        // Futuristic Fighter Vessel Polygon
        ctx.beginPath();
        ctx.moveTo(player.radius * 1.4, 0);
        ctx.lineTo(-player.radius, -player.radius * 0.9);
        ctx.lineTo(-player.radius * 0.5, 0);
        ctx.lineTo(-player.radius, player.radius * 0.9);
        ctx.closePath();

        ctx.fillStyle = player.overdriveTimer > 0 ? "#ff007f" : "#00f0ff";
        ctx.shadowBlur = 16;
        ctx.shadowColor = player.overdriveTimer > 0 ? "#ff007f" : "#00f0ff";
        ctx.fill();

        // Cockpit glass
        ctx.beginPath();
        ctx.arc(2, 0, 4, 0, Math.PI * 2);
        ctx.fillStyle = "#ffffff";
        ctx.fill();
      }
      ctx.restore();

      // Shield Bubble Render
      if (shield > 0) {
        ctx.save();
        ctx.beginPath();
        ctx.arc(player.x, player.y, player.radius + 8, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(0, 240, 255, ${0.3 + (shield / maxShield) * 0.4})`;
        ctx.lineWidth = 2;
        ctx.shadowBlur = 10;
        ctx.shadowColor = "#00f0ff";
        ctx.stroke();
        ctx.restore();
      }

      // Draw Particles
      particlesRef.current.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        p.life--;

        ctx.save();
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * (p.life / p.maxLife), 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.life / p.maxLife;
        ctx.fill();
        ctx.restore();
      });
      particlesRef.current = particlesRef.current.filter((p) => p.life > 0);

      // Draw Floating Damage Texts
      floatTextsRef.current.forEach((ft) => {
        ft.y += ft.vy;
        ft.life--;

        ctx.save();
        ctx.font = "bold 13px system-ui, sans-serif";
        ctx.fillStyle = ft.color;
        ctx.globalAlpha = ft.life / 25;
        ctx.fillText(ft.text, ft.x, ft.y);
        ctx.restore();
      });
      floatTextsRef.current = floatTextsRef.current.filter((ft) => ft.life > 0);

      // Loop Next Frame
      animFrameId.current = requestAnimationFrame(gameLoop);
    };

    animFrameId.current = requestAnimationFrame(gameLoop);
    return () => {
      if (animFrameId.current) cancelAnimationFrame(animFrameId.current);
    };
  }, [gameState, wave, difficulty, activeWeapon, maxShield, xpToNext]);

  // Game Over Handler
  const triggerGameOver = () => {
    setGameState("GAMEOVER");
    if (score > highScore) {
      setHighScore(score);
      if (typeof window !== "undefined") {
        localStorage.setItem("neon_vanguard_highscore", score.toString());
      }
    }
  };

  return (
    <div className="relative w-full h-full min-h-[600px] bg-black text-white font-sans overflow-hidden select-none flex flex-col items-center justify-center">
      {/* HUD HEADER OVERLAY (Visible during gameplay) */}
      {gameState === "PLAYING" && (
        <div className="absolute top-0 left-0 right-0 p-4 z-20 flex justify-between items-center bg-gradient-to-b from-black/80 to-transparent pointer-events-none">
          {/* Health & Shield Gauges */}
          <div className="flex flex-col gap-2 min-w-[200px]">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-cyan-400 shrink-0" />
              <div className="w-full bg-zinc-800 h-2.5 rounded-full overflow-hidden border border-cyan-500/30">
                <div
                  className="bg-cyan-400 h-full transition-all duration-150"
                  style={{ width: `${(shield / maxShield) * 100}%` }}
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-rose-500 shrink-0" />
              <div className="w-full bg-zinc-800 h-3 rounded-full overflow-hidden border border-rose-500/30">
                <div
                  className="bg-rose-500 h-full transition-all duration-150"
                  style={{ width: `${(hp / maxHp) * 100}%` }}
                />
              </div>
            </div>
          </div>

          {/* Score, Wave & Level */}
          <div className="flex items-center gap-6 text-center">
            <div>
              <div className="text-[10px] text-zinc-400 uppercase tracking-widest font-bold">SCORE</div>
              <div className="text-xl font-black text-cyan-400 tracking-wider">{score}</div>
            </div>
            <div>
              <div className="text-[10px] text-zinc-400 uppercase tracking-widest font-bold">WAVE</div>
              <div className="text-xl font-black text-purple-400">{wave}</div>
            </div>
            <div>
              <div className="text-[10px] text-zinc-400 uppercase tracking-widest font-bold">LEVEL</div>
              <div className="text-xl font-black text-amber-400">{level}</div>
            </div>
          </div>

          {/* Active Abilities Status */}
          <div className="flex items-center gap-3">
            <button
              onClick={triggerEMP}
              disabled={empCooldown > 0}
              className={`px-3 py-1.5 rounded-lg border text-xs font-bold flex items-center gap-1.5 transition-all pointer-events-auto ${
                empCooldown === 0
                  ? "bg-cyan-500/20 border-cyan-500 text-cyan-300 hover:bg-cyan-500/40 cursor-pointer"
                  : "bg-zinc-800 border-zinc-700 text-zinc-500 cursor-not-allowed"
              }`}
            >
              <Zap className="w-3.5 h-3.5" />
              EMP {empCooldown > 0 ? `(${Math.ceil(empCooldown)}s)` : "[E]"}
            </button>

            <button
              onClick={triggerOverdrive}
              disabled={overdrive < 100 && !isOverdriveActive}
              className={`px-3 py-1.5 rounded-lg border text-xs font-bold flex items-center gap-1.5 transition-all pointer-events-auto ${
                overdrive >= 100 || isOverdriveActive
                  ? "bg-pink-500/30 border-pink-500 text-pink-300 animate-pulse hover:bg-pink-500/50 cursor-pointer"
                  : "bg-zinc-800 border-zinc-700 text-zinc-500 cursor-not-allowed"
              }`}
            >
              <Flame className="w-3.5 h-3.5" />
              OVERDRIVE {isOverdriveActive ? "ACTIVE" : overdrive >= 100 ? "[R] READY" : `${Math.floor(overdrive)}%`}
            </button>
          </div>
        </div>
      )}

      {/* WEAPON SELECTOR FOOTER BAR */}
      {gameState === "PLAYING" && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 bg-zinc-900/80 backdrop-blur-md border border-white/10 p-1.5 rounded-xl">
          {(["PLASMA", "SPREAD", "RAILGUN", "HOMING", "ANTIMATTER"] as WeaponType[]).map((w, idx) => (
            <button
              key={w}
              onClick={() => setActiveWeapon(w)}
              className={`px-3 py-1 rounded-lg text-xs font-black tracking-wider transition-all ${
                activeWeapon === w
                  ? "bg-cyan-500 text-black shadow-[0_0_10px_rgba(0,240,255,0.6)]"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              [{idx + 1}] {w}
            </button>
          ))}
        </div>
      )}

      {/* CANVAS ELEMENT */}
      <canvas
        ref={canvasRef}
        width={960}
        height={600}
        onMouseMove={handleMouseMove}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        className="w-full h-full object-contain cursor-crosshair"
      />

      {/* START MENU OVERLAY */}
      {gameState === "MENU" && (
        <div className="absolute inset-0 bg-black/90 backdrop-blur-xl z-30 flex flex-col items-center justify-center p-6 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs font-bold tracking-widest uppercase mb-4">
            <Sparkles className="w-4 h-4" /> Next-Gen Cyber Arcade
          </div>

          <h1 className="text-5xl md:text-6xl font-black tracking-tight bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-500 bg-clip-text text-transparent mb-3">
            NEON VANGUARD OVERDRIVE
          </h1>
          <p className="text-zinc-400 max-w-md text-sm mb-8 leading-relaxed">
            Command the cybernetic fighter interceptor. Unleash EMP shockwaves, level up tech matrices, conquer alien dreadnought armadas, and activate Hyper Overdrive!
          </p>

          {/* Difficulty Selector */}
          <div className="flex gap-3 mb-8">
            {(["NORMAL", "HARDCORE", "NIGHTMARE"] as Difficulty[]).map((d) => (
              <button
                key={d}
                onClick={() => setDifficulty(d)}
                className={`px-4 py-2 rounded-xl text-xs font-black tracking-wider border transition-all ${
                  difficulty === d
                    ? "bg-cyan-500/20 border-cyan-400 text-cyan-300"
                    : "border-zinc-800 text-zinc-500 hover:text-zinc-300"
                }`}
              >
                {d}
              </button>
            ))}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4">
            <button
              onClick={startGame}
              className="px-8 py-4 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-black font-black rounded-2xl tracking-widest text-sm uppercase shadow-[0_0_25px_rgba(0,240,255,0.4)] flex items-center gap-2 transition-all transform hover:scale-105"
            >
              <Play className="w-5 h-5 fill-black" /> Launch Mission
            </button>
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className="p-4 bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white rounded-2xl transition-all"
            >
              {soundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
            </button>
          </div>

          {/* Controls hint */}
          <div className="mt-10 grid grid-cols-2 md:grid-cols-4 gap-4 text-xs text-zinc-500 font-medium">
            <div className="bg-zinc-900/60 p-2.5 rounded-xl border border-zinc-800">
              <span className="text-cyan-400 font-bold">WASD / ARROWS</span> Move
            </div>
            <div className="bg-zinc-900/60 p-2.5 rounded-xl border border-zinc-800">
              <span className="text-cyan-400 font-bold">MOUSE / SPACE</span> Aim & Fire
            </div>
            <div className="bg-zinc-900/60 p-2.5 rounded-xl border border-zinc-800">
              <span className="text-cyan-400 font-bold">SHIFT / E / R</span> Abilities
            </div>
            <div className="bg-zinc-900/60 p-2.5 rounded-xl border border-zinc-800">
              <span className="text-cyan-400 font-bold">1 - 5</span> Switch Weapons
            </div>
          </div>
        </div>
      )}

      {/* UPGRADE MODAL */}
      {gameState === "UPGRADE" && (
        <div className="absolute inset-0 bg-black/85 backdrop-blur-md z-30 flex flex-col items-center justify-center p-6 text-center">
          <div className="text-amber-400 text-xs font-black tracking-widest uppercase mb-2">SYSTEM UPGRADE AVAILABLE</div>
          <h2 className="text-3xl font-black text-white mb-6">Choose Matrix Enhancement</h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-3xl w-full">
            {availableUpgrades.map((upg) => (
              <div
                key={upg.id}
                onClick={() => selectUpgrade(upg)}
                className="bg-zinc-900/90 border border-zinc-700 hover:border-cyan-400 p-6 rounded-2xl cursor-pointer hover:bg-zinc-800/80 transition-all flex flex-col items-center text-center group shadow-xl"
              >
                <div className="p-3 bg-cyan-500/10 rounded-xl text-cyan-400 mb-4 group-hover:scale-110 transition-transform">
                  <Sparkles className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-white mb-2">{upg.name}</h3>
                <p className="text-xs text-zinc-400 leading-relaxed">{upg.description}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* PAUSE OVERLAY */}
      {gameState === "PAUSED" && (
        <div className="absolute inset-0 bg-black/80 backdrop-blur-md z-30 flex flex-col items-center justify-center p-6 text-center">
          <h2 className="text-4xl font-black tracking-wider text-white mb-4">MISSION PAUSED</h2>
          <div className="flex gap-4">
            <button
              onClick={() => setGameState("PLAYING")}
              className="px-6 py-3 bg-cyan-500 text-black font-bold rounded-xl uppercase tracking-widest text-xs"
            >
              Resume
            </button>
            <button
              onClick={() => setGameState("MENU")}
              className="px-6 py-3 bg-zinc-800 text-white font-bold rounded-xl uppercase tracking-widest text-xs"
            >
              Quit to Menu
            </button>
          </div>
        </div>
      )}

      {/* GAMEOVER OVERLAY */}
      {gameState === "GAMEOVER" && (
        <div className="absolute inset-0 bg-black/90 backdrop-blur-xl z-30 flex flex-col items-center justify-center p-6 text-center">
          <div className="text-rose-500 text-xs font-black tracking-widest uppercase mb-2">VESSEL CRITICAL FAILURE</div>
          <h2 className="text-5xl font-black text-white mb-6">GAME OVER</h2>

          <div className="bg-zinc-900/80 border border-zinc-800 p-6 rounded-2xl max-w-sm w-full mb-8 grid grid-cols-2 gap-4 text-center">
            <div>
              <div className="text-[10px] text-zinc-500 uppercase font-bold">Final Score</div>
              <div className="text-2xl font-black text-cyan-400">{score}</div>
            </div>
            <div>
              <div className="text-[10px] text-zinc-500 uppercase font-bold">Best Score</div>
              <div className="text-2xl font-black text-amber-400">{highScore}</div>
            </div>
            <div>
              <div className="text-[10px] text-zinc-500 uppercase font-bold">Enemies Destroyed</div>
              <div className="text-lg font-bold text-white">{kills}</div>
            </div>
            <div>
              <div className="text-[10px] text-zinc-500 uppercase font-bold">Survival Time</div>
              <div className="text-lg font-bold text-white">{survivalTime}s</div>
            </div>
          </div>

          <button
            onClick={startGame}
            className="px-8 py-4 bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-400 hover:to-pink-500 text-white font-black rounded-2xl tracking-widest text-sm uppercase shadow-[0_0_25px_rgba(244,63,94,0.4)] flex items-center gap-2 transition-all transform hover:scale-105"
          >
            <RotateCcw className="w-5 h-5" /> Retry Mission
          </button>
        </div>
      )}
    </div>
  );
}
