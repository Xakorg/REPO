"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Play,
  Pause,
  RotateCcw,
  Volume2,
  VolumeX,
  Shield,
  Zap,
  Clock,
  Sparkles,
  Trophy,
  ShoppingBag,
  ChevronRight,
  Crosshair,
  Maximize2,
  Minimize2,
  Info,
  Award,
  Flame,
  ArrowLeft
} from "lucide-react";
import Link from "next/link";

// ==========================================
// TYPES & INTERFACES
// ==========================================
export interface PlayerState {
  x: number;
  y: number;
  vx: number;
  vy: number;
  rotation: number;
  hp: number;
  maxHp: number;
  shield: number;
  maxShield: number;
  shieldRechargeRate: number;
  chronoEnergy: number;
  maxChronoEnergy: number;
  overdrive: number;
  maxOverdrive: number;
  primaryLevel: number;
  missileLevel: number;
  dashCooldown: number;
  maxDashCooldown: number;
  critChance: number;
}

export interface Enemy {
  id: string;
  type: "drone" | "cruiser" | "phantom" | "sentinel" | "boss";
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  hp: number;
  maxHp: number;
  color: string;
  fireTimer: number;
  phase?: number;
  stasisTimer?: number;
  angle: number;
}

export interface Projectile {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  isEnemy: boolean;
  damage: number;
  color: string;
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

export interface FloatingText {
  id: string;
  text: string;
  x: number;
  y: number;
  color: string;
  alpha: number;
  life: number;
}

export interface Crystal {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  value: number;
  color: string;
}

export interface GameStats {
  score: number;
  multiplier: number;
  shards: number;
  kills: number;
  wave: number;
  shotsFired: number;
  shotsHit: number;
  chronoTimeUsed: number;
}

// ==========================================
// AUDIO SYNTHESIZER (WEB AUDIO API)
// ==========================================
class ChronosSoundEngine {
  private ctx: AudioContext | null = null;
  private muted: boolean = false;

  constructor() {
    // Lazy init audio context on user interaction
  }

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

  public setMuted(muted: boolean) {
    this.muted = muted;
  }

  public isMuted() {
    return this.muted;
  }

  public playLaser(frequency: number = 800) {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(frequency, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(100, this.ctx.currentTime + 0.12);

      gain.gain.setValueAtTime(0.15, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.12);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + 0.12);
    } catch {
      // Ignore audio errors
    }
  }

  public playExplosion(isLarge: boolean = false) {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    try {
      const dur = isLarge ? 0.6 : 0.3;
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
      filter.frequency.setValueAtTime(isLarge ? 300 : 600, this.ctx.currentTime);
      filter.frequency.linearRampToValueAtTime(30, this.ctx.currentTime + dur);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(isLarge ? 0.4 : 0.25, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + dur);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);

      noise.start();
      noise.stop(this.ctx.currentTime + dur);
    } catch {
      // Ignore audio errors
    }
  }

  public playChronoWarp() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(200, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1200, this.ctx.currentTime + 0.3);

      gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.3);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + 0.3);
    } catch {
      // Audio fallback
    }
  }

  public playPickup() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(523.25, this.ctx.currentTime); // C5
      osc.frequency.setValueAtTime(659.25, this.ctx.currentTime + 0.08); // E5
      osc.frequency.setValueAtTime(783.99, this.ctx.currentTime + 0.16); // G5

      gain.gain.setValueAtTime(0.15, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.25);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + 0.25);
    } catch {
      // Audio fallback
    }
  }

  public playNova() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "square";
      osc.frequency.setValueAtTime(150, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(900, this.ctx.currentTime + 0.5);

      gain.gain.setValueAtTime(0.3, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.6);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + 0.6);
    } catch {
      // Audio fallback
    }
  }
}

const audioEngine = new ChronosSoundEngine();

// ==========================================
// MAIN COMPONENT
// ==========================================
export default function ChronosProtocolGame() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  
  // Game states
  const [gameState, setGameState] = useState<"menu" | "playing" | "paused" | "shop" | "gameover">("menu");
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [selectedShip, setSelectedShip] = useState<"vanguard" | "chronos" | "phantom">("vanguard");
  const [difficulty, setDifficulty] = useState<"normal" | "heroic" | "nightmare">("normal");
  const [highScore, setHighScore] = useState<number>(0);

  // HUD & Upgrade states
  const [stats, setStats] = useState<GameStats>({
    score: 0,
    multiplier: 1,
    shards: 0,
    kills: 0,
    wave: 1,
    shotsFired: 0,
    shotsHit: 0,
    chronoTimeUsed: 0
  });

  const [playerInfo, setPlayerInfo] = useState<PlayerState>({
    x: 0,
    y: 0,
    vx: 0,
    vy: 0,
    rotation: 0,
    hp: 100,
    maxHp: 100,
    shield: 50,
    maxShield: 50,
    shieldRechargeRate: 2,
    chronoEnergy: 100,
    maxChronoEnergy: 100,
    overdrive: 0,
    maxOverdrive: 100,
    primaryLevel: 1,
    missileLevel: 1,
    dashCooldown: 0,
    maxDashCooldown: 180,
    critChance: 0.1
  });

  // Upgrade costs
  const [upgrades, setUpgrades] = useState({
    maxHp: { level: 1, cost: 50, stat: "Max Health +25" },
    maxShield: { level: 1, cost: 60, stat: "Max Shield +25" },
    primaryDamage: { level: 1, cost: 80, stat: "Laser Firepower" },
    missileSwarm: { level: 1, cost: 100, stat: "Quantum Homing Swarm" },
    chronoCapacity: { level: 1, cost: 75, stat: "Chrono Energy +30" },
    tachyonCooldown: { level: 1, cost: 90, stat: "Dash Cooldown -20%" }
  });

  // Game Engine Refs
  const gameEngineRef = useRef({
    keys: {} as Record<string, boolean>,
    mouse: { x: 0, y: 0, isDown: false, rightDown: false },
    player: { ...playerInfo },
    enemies: [] as Enemy[],
    projectiles: [] as Projectile[],
    particles: [] as Particle[],
    floatingTexts: [] as FloatingText[],
    crystals: [] as Crystal[],
    stats: { ...stats },
    timeScale: 1.0,
    isTimeDilationActive: false,
    screenShake: 0,
    gridOffset: { x: 0, y: 0 },
    spawnTimer: 0,
    bossActive: false,
    bossRef: null as Enemy | null,
    waveCompleted: false,
    waveTimer: 0,
    animFrameId: 0
  });

  // Load High score
  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("chronos_protocol_highscore");
      if (saved) setHighScore(parseInt(saved, 10));
    }
  }, []);

  // Sync mute state with sound engine
  const toggleMute = () => {
    const nextMute = !isMuted;
    setIsMuted(nextMute);
    audioEngine.setMuted(nextMute);
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  // Keyboard and Mouse Event Listeners
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      gameEngineRef.current.keys[e.key.toLowerCase()] = true;
      if (e.key === "p" || e.key === "P" || e.key === "Escape") {
        if (gameState === "playing") setGameState("paused");
        else if (gameState === "paused") setGameState("playing");
      }
      if (e.key.toLowerCase() === "e" && gameState === "playing") {
        triggerTachyonDash();
      }
      if (e.key.toLowerCase() === "q" && gameState === "playing") {
        triggerChronoNova();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      gameEngineRef.current.keys[e.key.toLowerCase()] = false;
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!canvasRef.current) return;
      const rect = canvasRef.current.getBoundingClientRect();
      gameEngineRef.current.mouse.x = e.clientX - rect.left;
      gameEngineRef.current.mouse.y = e.clientY - rect.top;
    };

    const handleMouseDown = (e: MouseEvent) => {
      if (e.button === 0) gameEngineRef.current.mouse.isDown = true;
      if (e.button === 2) {
        e.preventDefault();
        triggerTachyonDash();
      }
    };

    const handleMouseUp = (e: MouseEvent) => {
      if (e.button === 0) gameEngineRef.current.mouse.isDown = false;
    };

    const handleContextMenu = (e: MouseEvent) => e.preventDefault();

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mousedown", handleMouseDown);
    window.addEventListener("mouseup", handleMouseUp);
    window.addEventListener("contextmenu", handleContextMenu);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mousedown", handleMouseDown);
      window.removeEventListener("mouseup", handleMouseUp);
      window.removeEventListener("contextmenu", handleContextMenu);
    };
  }, [gameState]);

  // Tachyon Dash Ability
  const triggerTachyonDash = () => {
    const engine = gameEngineRef.current;
    if (engine.player.dashCooldown > 0) return;

    engine.player.dashCooldown = engine.player.maxDashCooldown;
    const angle = engine.player.rotation;
    const dashDist = 220;

    // Create start shockwave particles
    createShockwave(engine.player.x, engine.player.y, "#00f0ff");

    // Teleport player
    engine.player.x += Math.cos(angle) * dashDist;
    engine.player.y += Math.sin(angle) * dashDist;

    // Create arrival shockwave particles & destroy nearby projectiles
    createShockwave(engine.player.x, engine.player.y, "#00f0ff");
    engine.screenShake = 15;
    audioEngine.playChronoWarp();

    // Damage nearby enemies
    engine.enemies.forEach((enemy) => {
      const dx = enemy.x - engine.player.x;
      const dy = enemy.y - engine.player.y;
      const dist = Math.hypot(dx, dy);
      if (dist < 180) {
        enemy.hp -= 80;
        addFloatingText(`TACHYON BLAST -80`, enemy.x, enemy.y, "#00f0ff");
      }
    });

    // Destroy incoming enemy projectiles in pulse radius
    engine.projectiles = engine.projectiles.filter((p) => {
      if (!p.isEnemy) return true;
      const dist = Math.hypot(p.x - engine.player.x, p.y - engine.player.y);
      return dist >= 200;
    });
  };

  // Chrono Nova Super Ability
  const triggerChronoNova = () => {
    const engine = gameEngineRef.current;
    if (engine.player.overdrive < engine.player.maxOverdrive) return;

    engine.player.overdrive = 0;
    engine.screenShake = 25;
    audioEngine.playNova();

    addFloatingText("CHRONO STASIS NOVA ACTIVATED!", engine.player.x, engine.player.y - 40, "#ff0077");

    // Freeze enemies and fire homing barrage at every single enemy on screen
    engine.enemies.forEach((enemy) => {
      enemy.stasisTimer = 240; // 4 seconds stasis
      for (let i = 0; i < 3; i++) {
        engine.projectiles.push({
          id: Math.random().toString(),
          x: engine.player.x,
          y: engine.player.y,
          vx: (Math.random() - 0.5) * 12,
          vy: (Math.random() - 0.5) * 12,
          radius: 6,
          isEnemy: false,
          damage: 120,
          color: "#ff0077",
          isHoming: true,
          targetId: enemy.id,
          life: 300
        });
      }
    });
  };

  const createShockwave = (x: number, y: number, color: string) => {
    const engine = gameEngineRef.current;
    for (let i = 0; i < 36; i++) {
      const angle = (i * Math.PI * 2) / 36;
      const speed = 6 + Math.random() * 4;
      engine.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        radius: 3 + Math.random() * 3,
        color,
        alpha: 1,
        life: 0,
        maxLife: 30
      });
    }
  };

  const addFloatingText = (text: string, x: number, y: number, color: string) => {
    gameEngineRef.current.floatingTexts.push({
      id: Math.random().toString(),
      text,
      x,
      y,
      color,
      alpha: 1,
      life: 0
    });
  };

  // Start Game
  const startGame = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let baseHp = 100;
    let baseShield = 50;
    let baseEnergy = 100;

    if (selectedShip === "chronos") {
      baseEnergy = 160;
    } else if (selectedShip === "phantom") {
      baseShield = 90;
    }

    const initialPlayer: PlayerState = {
      x: canvas.width / 2,
      y: canvas.height / 2,
      vx: 0,
      vy: 0,
      rotation: 0,
      hp: baseHp,
      maxHp: baseHp,
      shield: baseShield,
      maxShield: baseShield,
      shieldRechargeRate: 3,
      chronoEnergy: baseEnergy,
      maxChronoEnergy: baseEnergy,
      overdrive: 0,
      maxOverdrive: 100,
      primaryLevel: 1,
      missileLevel: 1,
      dashCooldown: 0,
      maxDashCooldown: 180,
      critChance: 0.15
    };

    const initialStats: GameStats = {
      score: 0,
      multiplier: 1,
      shards: 0,
      kills: 0,
      wave: 1,
      shotsFired: 0,
      shotsHit: 0,
      chronoTimeUsed: 0
    };

    gameEngineRef.current.player = initialPlayer;
    gameEngineRef.current.stats = initialStats;
    gameEngineRef.current.enemies = [];
    gameEngineRef.current.projectiles = [];
    gameEngineRef.current.particles = [];
    gameEngineRef.current.crystals = [];
    gameEngineRef.current.floatingTexts = [];
    gameEngineRef.current.bossActive = false;
    gameEngineRef.current.spawnTimer = 0;

    setGameState("playing");
    setStats(initialStats);
    setPlayerInfo(initialPlayer);
  };

  // Spawn Wave Enemy
  const spawnWaveEnemies = (canvasWidth: number, canvasHeight: number) => {
    const engine = gameEngineRef.current;
    const wave = engine.stats.wave;

    // Check if boss wave (every 5 waves)
    if (wave % 5 === 0 && !engine.bossActive && engine.enemies.length === 0) {
      const boss: Enemy = {
        id: "boss_" + Math.random(),
        type: "boss",
        x: canvasWidth / 2,
        y: -150,
        vx: 0,
        vy: 1.5,
        radius: 65,
        hp: 1500 + wave * 500,
        maxHp: 1500 + wave * 500,
        color: "#ff0055",
        fireTimer: 0,
        phase: 1,
        angle: 0
      };
      engine.enemies.push(boss);
      engine.bossActive = true;
      audioEngine.playExplosion(true);
      addFloatingText("CHRONOS TITAN DREADNOUGHT SPANWED!", canvasWidth / 2 - 150, 100, "#ff0055");
      return;
    }

    if (engine.bossActive) return;

    const maxEnemies = 6 + wave * 3;
    if (engine.enemies.length >= maxEnemies) return;

    engine.spawnTimer++;
    if (engine.spawnTimer < 90) return;
    engine.spawnTimer = 0;

    // Spawn point along perimeter
    const side = Math.floor(Math.random() * 4);
    let x = 0, y = 0;
    if (side === 0) { x = Math.random() * canvasWidth; y = -40; }
    else if (side === 1) { x = canvasWidth + 40; y = Math.random() * canvasHeight; }
    else if (side === 2) { x = Math.random() * canvasWidth; y = canvasHeight + 40; }
    else { x = -40; y = Math.random() * canvasHeight; }

    const rand = Math.random();
    let type: Enemy["type"] = "drone";
    let hp = 40 + wave * 10;
    let radius = 18;
    let color = "#ffaa00";

    if (rand > 0.7) {
      type = "cruiser";
      hp = 120 + wave * 25;
      radius = 28;
      color = "#ff0077";
    } else if (rand > 0.45) {
      type = "phantom";
      hp = 70 + wave * 15;
      radius = 20;
      color = "#00f0ff";
    }

    engine.enemies.push({
      id: "enemy_" + Math.random(),
      type,
      x,
      y,
      vx: 0,
      vy: 0,
      radius,
      hp,
      maxHp: hp,
      color,
      fireTimer: Math.random() * 60,
      angle: 0
    });
  };

  // Main Game Loop Effect
  useEffect(() => {
    if (gameState !== "playing") return;

    let primaryFireTimer = 0;
    let missileFireTimer = 0;

    const loop = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const engine = gameEngineRef.current;
      const { keys, mouse, player } = engine;

      // Handle Screen Shake offset
      ctx.save();
      if (engine.screenShake > 0) {
        const rx = (Math.random() - 0.5) * engine.screenShake;
        const ry = (Math.random() - 0.5) * engine.screenShake;
        ctx.translate(rx, ry);
        engine.screenShake *= 0.9;
        if (engine.screenShake < 0.5) engine.screenShake = 0;
      }

      // Time Dilation Mechanism (Bullet Time)
      const isShiftHeld = keys["shift"] || keys[" "];
      if (isShiftHeld && player.chronoEnergy > 2) {
        engine.timeScale = 0.25;
        engine.isTimeDilationActive = true;
        player.chronoEnergy = Math.max(0, player.chronoEnergy - 0.6);
        engine.stats.chronoTimeUsed += 0.016;
      } else {
        engine.timeScale = 1.0;
        engine.isTimeDilationActive = false;
        // Recharge Chrono Energy slowly
        player.chronoEnergy = Math.min(player.maxChronoEnergy, player.chronoEnergy + 0.2);
      }

      // Recharge Shield slowly
      if (player.shield < player.maxShield) {
        player.shield = Math.min(player.maxShield, player.shield + player.shieldRechargeRate * 0.016);
      }

      // Decrement Dash Cooldown
      if (player.dashCooldown > 0) player.dashCooldown--;

      // ------------------------------------------
      // PLAYER MOVEMENT & ROTATION
      // ------------------------------------------
      const moveSpeed = 6.5;
      let dx = 0, dy = 0;
      if (keys["w"] || keys["arrowup"]) dy -= 1;
      if (keys["s"] || keys["arrowdown"]) dy += 1;
      if (keys["a"] || keys["arrowleft"]) dx -= 1;
      if (keys["d"] || keys["arrowright"]) dx += 1;

      if (dx !== 0 && dy !== 0) {
        dx *= 0.7071;
        dy *= 0.7071;
      }

      player.vx = player.vx * 0.85 + dx * moveSpeed * 0.15;
      player.vy = player.vy * 0.85 + dy * moveSpeed * 0.15;
      player.x += player.vx;
      player.y += player.vy;

      // Keep player inside canvas
      player.x = Math.max(25, Math.min(canvas.width - 25, player.x));
      player.y = Math.max(25, Math.min(canvas.height - 25, player.y));

      // Aim rotation towards mouse
      const aimDx = mouse.x - player.x;
      const aimDy = mouse.y - player.y;
      player.rotation = Math.atan2(aimDy, aimDx);

      // Create engine thruster trail particles
      if (dx !== 0 || dy !== 0) {
        const rearAngle = player.rotation + Math.PI;
        engine.particles.push({
          x: player.x + Math.cos(rearAngle) * 18,
          y: player.y + Math.sin(rearAngle) * 18,
          vx: Math.cos(rearAngle) * 4 + (Math.random() - 0.5) * 2,
          vy: Math.sin(rearAngle) * 4 + (Math.random() - 0.5) * 2,
          radius: 3 + Math.random() * 3,
          color: engine.isTimeDilationActive ? "#00f0ff" : "#ff0077",
          alpha: 0.9,
          life: 0,
          maxLife: 20
        });
      }

      // ------------------------------------------
      // FIRING WEAPONS
      // ------------------------------------------
      primaryFireTimer++;
      if (mouse.isDown && primaryFireTimer >= 10) {
        primaryFireTimer = 0;
        engine.stats.shotsFired++;
        audioEngine.playLaser(700);

        const damage = 35 * (1 + (player.primaryLevel - 1) * 0.3);
        const pSpeed = 16;

        if (player.primaryLevel === 1) {
          engine.projectiles.push({
            id: Math.random().toString(),
            x: player.x + Math.cos(player.rotation) * 20,
            y: player.y + Math.sin(player.rotation) * 20,
            vx: Math.cos(player.rotation) * pSpeed,
            vy: Math.sin(player.rotation) * pSpeed,
            radius: 4,
            isEnemy: false,
            damage,
            color: "#00ffff",
            life: 120
          });
        } else {
          // Double / Spread Lasers
          const spread = 0.15;
          [-spread, spread].forEach((angleOffset) => {
            const finalAngle = player.rotation + angleOffset;
            engine.projectiles.push({
              id: Math.random().toString(),
              x: player.x + Math.cos(finalAngle) * 20,
              y: player.y + Math.sin(finalAngle) * 20,
              vx: Math.cos(finalAngle) * pSpeed,
              vy: Math.sin(finalAngle) * pSpeed,
              radius: 4,
              isEnemy: false,
              damage: damage * 0.7,
              color: "#00ffff",
              life: 120
            });
          });
        }
      }

      // Secondary Homing Missiles
      missileFireTimer++;
      if (missileFireTimer >= 120 && engine.enemies.length > 0) {
        missileFireTimer = 0;
        const target = engine.enemies[0];
        engine.projectiles.push({
          id: Math.random().toString(),
          x: player.x,
          y: player.y,
          vx: (Math.random() - 0.5) * 8,
          vy: (Math.random() - 0.5) * 8,
          radius: 5,
          isEnemy: false,
          damage: 75,
          color: "#ffaa00",
          isHoming: true,
          targetId: target.id,
          life: 200
        });
      }

      // Spawning enemies
      spawnWaveEnemies(canvas.width, canvas.height);

      // ------------------------------------------
      // UPDATE ENEMIES
      // ------------------------------------------
      engine.enemies.forEach((enemy) => {
        if (enemy.stasisTimer && enemy.stasisTimer > 0) {
          enemy.stasisTimer--;
          return;
        }

        const effectiveTimeScale = engine.timeScale;
        const eDx = player.x - enemy.x;
        const eDy = player.y - enemy.y;
        const dist = Math.hypot(eDx, eDy);
        enemy.angle = Math.atan2(eDy, eDx);

        if (enemy.type === "drone") {
          const speed = 3.5 * effectiveTimeScale;
          enemy.vx = Math.cos(enemy.angle) * speed;
          enemy.vy = Math.sin(enemy.angle) * speed;
        } else if (enemy.type === "cruiser") {
          const speed = 1.8 * effectiveTimeScale;
          if (dist > 250) {
            enemy.vx = Math.cos(enemy.angle) * speed;
            enemy.vy = Math.sin(enemy.angle) * speed;
          } else {
            enemy.vx *= 0.9;
            enemy.vy *= 0.9;
          }
          // Fire dual lasers
          enemy.fireTimer += effectiveTimeScale;
          if (enemy.fireTimer >= 100) {
            enemy.fireTimer = 0;
            audioEngine.playLaser(400);
            engine.projectiles.push({
              id: Math.random().toString(),
              x: enemy.x,
              y: enemy.y,
              vx: Math.cos(enemy.angle) * 7,
              vy: Math.sin(enemy.angle) * 7,
              radius: 5,
              isEnemy: true,
              damage: 18,
              color: "#ff0055",
              life: 150
            });
          }
        } else if (enemy.type === "phantom") {
          // Orbiting fast shooter
          const speed = 4.2 * effectiveTimeScale;
          const orbitAngle = enemy.angle + Math.PI / 2;
          enemy.vx = Math.cos(orbitAngle) * speed * 0.8 + Math.cos(enemy.angle) * speed * 0.4;
          enemy.vy = Math.sin(orbitAngle) * speed * 0.8 + Math.sin(enemy.angle) * speed * 0.4;
        } else if (enemy.type === "boss") {
          // Boss Logic
          const targetY = 140;
          if (enemy.y < targetY) {
            enemy.vy = 1;
          } else {
            enemy.vy = 0;
            enemy.vx = Math.sin(Date.now() * 0.002) * 3 * effectiveTimeScale;
          }

          enemy.fireTimer += effectiveTimeScale;
          if (enemy.fireTimer >= 45) {
            enemy.fireTimer = 0;
            audioEngine.playLaser(300);
            // Salvo burst
            for (let b = -2; b <= 2; b++) {
              const bAngle = enemy.angle + b * 0.15;
              engine.projectiles.push({
                id: Math.random().toString(),
                x: enemy.x,
                y: enemy.y + 40,
                vx: Math.cos(bAngle) * 8,
                vy: Math.sin(bAngle) * 8,
                radius: 6,
                isEnemy: true,
                damage: 22,
                color: "#ff0055",
                life: 180
              });
            }
          }
        }

        enemy.x += enemy.vx;
        enemy.y += enemy.vy;

        // Collision with player
        if (dist < enemy.radius + 18) {
          takePlayerDamage(25);
          engine.screenShake = 10;
        }
      });

      // ------------------------------------------
      // UPDATE PROJECTILES & COLLISIONS
      // ------------------------------------------
      engine.projectiles.forEach((p) => {
        if (p.isHoming && p.targetId) {
          const target = engine.enemies.find((e) => e.id === p.targetId);
          if (target) {
            const hDx = target.x - p.x;
            const hDy = target.y - p.y;
            const hAngle = Math.atan2(hDy, hDx);
            p.vx = p.vx * 0.9 + Math.cos(hAngle) * 1.5;
            p.vy = p.vy * 0.9 + Math.sin(hAngle) * 1.5;
          }
        }

        p.x += p.vx * (p.isEnemy ? engine.timeScale : 1.0);
        p.y += p.vy * (p.isEnemy ? engine.timeScale : 1.0);
        p.life--;

        // Check Hit player
        if (p.isEnemy) {
          const pDist = Math.hypot(p.x - player.x, p.y - player.y);
          if (pDist < p.radius + 18) {
            takePlayerDamage(p.damage);
            p.life = 0;
          }
        } else {
          // Check Hit enemies
          engine.enemies.forEach((enemy) => {
            const eDist = Math.hypot(p.x - enemy.x, p.y - enemy.y);
            if (eDist < p.radius + enemy.radius) {
              p.life = 0;
              engine.stats.shotsHit++;

              let isCrit = Math.random() < player.critChance;
              let actualDamage = isCrit ? p.damage * 2 : p.damage;

              enemy.hp -= actualDamage;
              addFloatingText(
                isCrit ? `CRIT! -${Math.round(actualDamage)}` : `-${Math.round(actualDamage)}`,
                enemy.x,
                enemy.y,
                isCrit ? "#ffcc00" : "#ffffff"
              );

              // Particle effect on hit
              for (let k = 0; k < 4; k++) {
                engine.particles.push({
                  x: p.x,
                  y: p.y,
                  vx: (Math.random() - 0.5) * 6,
                  vy: (Math.random() - 0.5) * 6,
                  radius: 2,
                  color: enemy.color,
                  alpha: 1,
                  life: 0,
                  maxLife: 15
                });
              }

              // Enemy Defeated
              if (enemy.hp <= 0) {
                audioEngine.playExplosion(enemy.type === "boss");
                engine.stats.kills++;
                engine.stats.score += enemy.type === "boss" ? 2500 : 150;
                player.overdrive = Math.min(player.maxOverdrive, player.overdrive + 12);

                // Drop Quantum Crystals
                const count = enemy.type === "boss" ? 20 : 3;
                for (let c = 0; c < count; c++) {
                  engine.crystals.push({
                    id: Math.random().toString(),
                    x: enemy.x + (Math.random() - 0.5) * 30,
                    y: enemy.y + (Math.random() - 0.5) * 30,
                    vx: (Math.random() - 0.5) * 4,
                    vy: (Math.random() - 0.5) * 4,
                    value: 10,
                    color: "#00ffcc"
                  });
                }

                if (enemy.type === "boss") engine.bossActive = false;
              }
            }
          });
        }
      });

      // Filter dead projectiles & enemies
      engine.projectiles = engine.projectiles.filter((p) => p.life > 0);
      engine.enemies = engine.enemies.filter((e) => e.hp > 0);

      // ------------------------------------------
      // CRYSTAL PICKUPS
      // ------------------------------------------
      engine.crystals.forEach((crystal) => {
        const cDx = player.x - crystal.x;
        const cDy = player.y - crystal.y;
        const dist = Math.hypot(cDx, cDy);

        if (dist < 160) {
          // Magnetize towards player
          crystal.vx += (cDx / dist) * 0.8;
          crystal.vy += (cDy / dist) * 0.8;
        }

        crystal.x += crystal.vx;
        crystal.y += crystal.vy;
        crystal.vx *= 0.95;
        crystal.vy *= 0.95;

        if (dist < 22) {
          engine.stats.shards += crystal.value;
          audioEngine.playPickup();
          crystal.value = 0; // Mark collected
        }
      });

      engine.crystals = engine.crystals.filter((c) => c.value > 0);

      // Check Wave Completion
      if (engine.enemies.length === 0 && !engine.bossActive) {
        engine.waveTimer++;
        if (engine.waveTimer > 120) {
          engine.waveTimer = 0;
          engine.stats.wave++;
          addFloatingText(`WAVE ${engine.stats.wave} INCOMING!`, canvas.width / 2 - 80, canvas.height / 2, "#00ffaa");
        }
      }

      // ------------------------------------------
      // RENDER BACKGROUND & SYNTH GRID
      // ------------------------------------------
      ctx.fillStyle = "#03030c";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Grid perspective lines
      ctx.strokeStyle = engine.isTimeDilationActive ? "rgba(0, 240, 255, 0.15)" : "rgba(255, 0, 119, 0.1)";
      ctx.lineWidth = 1;

      const gridSize = 60;
      engine.gridOffset.y = (engine.gridOffset.y + (engine.isTimeDilationActive ? 0.5 : 1.5)) % gridSize;

      for (let x = 0; x < canvas.width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
      }

      for (let y = engine.gridOffset.y; y < canvas.height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
      }

      // ------------------------------------------
      // RENDER CRYSTALS
      // ------------------------------------------
      engine.crystals.forEach((c) => {
        ctx.fillStyle = c.color;
        ctx.shadowColor = c.color;
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.arc(c.x, c.y, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      });

      // ------------------------------------------
      // RENDER PROJECTILES
      // ------------------------------------------
      engine.projectiles.forEach((p) => {
        ctx.fillStyle = p.color;
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      });

      // ------------------------------------------
      // RENDER ENEMIES
      // ------------------------------------------
      engine.enemies.forEach((enemy) => {
        ctx.save();
        ctx.translate(enemy.x, enemy.y);
        ctx.rotate(enemy.angle);

        ctx.strokeStyle = enemy.color;
        ctx.fillStyle = enemy.color + "33";
        ctx.shadowColor = enemy.color;
        ctx.shadowBlur = 12;
        ctx.lineWidth = 2;

        if (enemy.type === "drone") {
          ctx.beginPath();
          ctx.moveTo(15, 0);
          ctx.lineTo(-12, -10);
          ctx.lineTo(-6, 0);
          ctx.lineTo(-12, 10);
          ctx.closePath();
          ctx.stroke();
          ctx.fill();
        } else if (enemy.type === "cruiser" || enemy.type === "boss") {
          ctx.beginPath();
          const r = enemy.radius;
          ctx.rect(-r, -r, r * 2, r * 2);
          ctx.stroke();
          ctx.fill();
        } else {
          ctx.beginPath();
          ctx.arc(0, 0, enemy.radius, 0, Math.PI * 2);
          ctx.stroke();
          ctx.fill();
        }

        ctx.restore();

        // Enemy HP Bar
        if (enemy.hp < enemy.maxHp) {
          const hpPct = Math.max(0, enemy.hp / enemy.maxHp);
          ctx.fillStyle = "rgba(0,0,0,0.6)";
          ctx.fillRect(enemy.x - 20, enemy.y - enemy.radius - 12, 40, 5);
          ctx.fillStyle = "#ff0055";
          ctx.fillRect(enemy.x - 20, enemy.y - enemy.radius - 12, 40 * hpPct, 5);
        }
      });

      // ------------------------------------------
      // RENDER PLAYER SHIP
      // ------------------------------------------
      ctx.save();
      ctx.translate(player.x, player.y);
      ctx.rotate(player.rotation);

      // Player Shield Glow Ring
      if (player.shield > 0) {
        ctx.strokeStyle = "#00f0ff";
        ctx.lineWidth = 2;
        ctx.shadowColor = "#00f0ff";
        ctx.shadowBlur = 15;
        ctx.beginPath();
        ctx.arc(0, 0, 24, 0, Math.PI * 2);
        ctx.stroke();
      }

      // Ship Body Drawing
      ctx.fillStyle = "#ffffff";
      ctx.strokeStyle = "#00f0ff";
      ctx.lineWidth = 3;
      ctx.shadowColor = "#00f0ff";
      ctx.shadowBlur = 15;

      ctx.beginPath();
      ctx.moveTo(22, 0);
      ctx.lineTo(-16, -15);
      ctx.lineTo(-8, 0);
      ctx.lineTo(-16, 15);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      ctx.restore();

      // ------------------------------------------
      // PARTICLES & FLOATING TEXTS
      // ------------------------------------------
      engine.particles.forEach((pt) => {
        pt.x += pt.vx;
        pt.y += pt.vy;
        pt.life++;
        pt.alpha = 1 - pt.life / pt.maxLife;

        ctx.fillStyle = pt.color;
        ctx.globalAlpha = Math.max(0, pt.alpha);
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, pt.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1.0;
      });
      engine.particles = engine.particles.filter((pt) => pt.life < pt.maxLife);

      engine.floatingTexts.forEach((ft) => {
        ft.y -= 1;
        ft.life++;
        ft.alpha = 1 - ft.life / 60;

        ctx.fillStyle = ft.color;
        ctx.globalAlpha = Math.max(0, ft.alpha);
        ctx.font = "bold 14px sans-serif";
        ctx.fillText(ft.text, ft.x, ft.y);
        ctx.globalAlpha = 1.0;
      });
      engine.floatingTexts = engine.floatingTexts.filter((ft) => ft.life < 60);

      ctx.restore();

      // Update state for React HUD
      setPlayerInfo({ ...player });
      setStats({ ...engine.stats });

      engine.animFrameId = requestAnimationFrame(loop);
    };

    const handlePlayerDamage = (dmg: number) => {
      const engine = gameEngineRef.current;
      let remaining = dmg;
      if (engine.player.shield > 0) {
        if (engine.player.shield >= remaining) {
          engine.player.shield -= remaining;
          remaining = 0;
        } else {
          remaining -= engine.player.shield;
          engine.player.shield = 0;
        }
      }
      if (remaining > 0) {
        engine.player.hp = Math.max(0, engine.player.hp - remaining);
      }

      if (engine.player.hp <= 0) {
        audioEngine.playExplosion(true);
        setGameState("gameover");
        if (engine.stats.score > highScore) {
          setHighScore(engine.stats.score);
          if (typeof window !== "undefined") {
            localStorage.setItem("chronos_protocol_highscore", engine.stats.score.toString());
          }
        }
      }
    };

    const takePlayerDamage = (dmg: number) => handlePlayerDamage(dmg);

    gameEngineRef.current.animFrameId = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(gameEngineRef.current.animFrameId);
    };
  }, [gameState, highScore]);

  // Handle Resize
  useEffect(() => {
    const handleResize = () => {
      if (canvasRef.current) {
        canvasRef.current.width = canvasRef.current.parentElement?.clientWidth || window.innerWidth;
        canvasRef.current.height = canvasRef.current.parentElement?.clientHeight || window.innerHeight;
      }
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Purchase Upgrade
  const buyUpgrade = (key: keyof typeof upgrades) => {
    const item = upgrades[key];
    if (stats.shards >= item.cost) {
      setStats((prev) => ({ ...prev, shards: prev.shards - item.cost }));
      gameEngineRef.current.stats.shards -= item.cost;

      setUpgrades((prev) => ({
        ...prev,
        [key]: { ...item, level: item.level + 1, cost: Math.round(item.cost * 1.5) }
      }));

      // Apply stat upgrade
      const p = gameEngineRef.current.player;
      if (key === "maxHp") { p.maxHp += 25; p.hp += 25; }
      else if (key === "maxShield") { p.maxShield += 25; p.shield += 25; }
      else if (key === "primaryDamage") { p.primaryLevel += 1; }
      else if (key === "missileSwarm") { p.missileLevel += 1; }
      else if (key === "chronoCapacity") { p.maxChronoEnergy += 30; p.chronoEnergy += 30; }
      else if (key === "tachyonCooldown") { p.maxDashCooldown = Math.max(60, p.maxDashCooldown * 0.8); }

      audioEngine.playPickup();
    }
  };

  return (
    <div className="relative w-full h-screen bg-black overflow-hidden select-none font-sans text-white">
      {/* ------------------------------------------ */}
      {/* CANVAS ELEMENT */}
      {/* ------------------------------------------ */}
      <div className="absolute inset-0 w-full h-full">
        <canvas ref={canvasRef} className="w-full h-full block cursor-crosshair" />
      </div>

      {/* ------------------------------------------ */}
      {/* HUD OVERLAY (DURING PLAYING) */}
      {/* ------------------------------------------ */}
      {gameState === "playing" && (
        <div className="absolute inset-0 pointer-events-none p-6 flex flex-col justify-between z-10">
          {/* Top Bar */}
          <div className="flex justify-between items-start">
            {/* Player Stats & Vitals */}
            <div className="flex flex-col gap-2.5 bg-black/60 backdrop-blur-md p-4 rounded-2xl border border-cyan-500/30 w-72 pointer-events-auto shadow-[0_0_20px_rgba(0,240,255,0.15)]">
              {/* HP Bar */}
              <div>
                <div className="flex justify-between text-xs font-bold text-cyan-400 mb-1 uppercase tracking-wider">
                  <span>Hull Integrity</span>
                  <span>{Math.round(playerInfo.hp)} / {playerInfo.maxHp}</span>
                </div>
                <div className="w-full h-3 bg-zinc-900 rounded-full overflow-hidden border border-cyan-500/20">
                  <div
                    className="h-full bg-gradient-to-r from-red-600 to-rose-500 transition-all duration-200"
                    style={{ width: `${Math.max(0, (playerInfo.hp / playerInfo.maxHp) * 100)}%` }}
                  />
                </div>
              </div>

              {/* Shield Bar */}
              <div>
                <div className="flex justify-between text-xs font-bold text-cyan-300 mb-1 uppercase tracking-wider">
                  <span>Shield Matrix</span>
                  <span>{Math.round(playerInfo.shield)} / {playerInfo.maxShield}</span>
                </div>
                <div className="w-full h-2.5 bg-zinc-900 rounded-full overflow-hidden border border-cyan-500/20">
                  <div
                    className="h-full bg-gradient-to-r from-cyan-500 to-blue-400 transition-all duration-200"
                    style={{ width: `${Math.max(0, (playerInfo.shield / playerInfo.maxShield) * 100)}%` }}
                  />
                </div>
              </div>

              {/* Chrono Energy Bar */}
              <div>
                <div className="flex justify-between text-xs font-bold text-purple-300 mb-1 uppercase tracking-wider flex items-center">
                  <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> Chrono Energy (SHIFT)</span>
                  <span>{Math.round(playerInfo.chronoEnergy)}%</span>
                </div>
                <div className="w-full h-2.5 bg-zinc-900 rounded-full overflow-hidden border border-purple-500/20">
                  <div
                    className="h-full bg-gradient-to-r from-purple-600 to-fuchsia-400 transition-all duration-200"
                    style={{ width: `${(playerInfo.chronoEnergy / playerInfo.maxChronoEnergy) * 100}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Score & Wave info */}
            <div className="flex flex-col items-center bg-black/60 backdrop-blur-md px-8 py-3 rounded-2xl border border-cyan-500/30">
              <span className="text-xs uppercase tracking-widest text-cyan-400 font-bold">WAVE</span>
              <span className="text-4xl font-black tracking-wider text-white">{stats.wave}</span>
              <div className="flex items-center gap-4 mt-1 text-sm font-semibold text-zinc-300">
                <span>SCORE: <strong className="text-cyan-300">{stats.score}</strong></span>
                <span>SHARDS: <strong className="text-emerald-400">{stats.shards}</strong></span>
              </div>
            </div>

            {/* Quick Action Controls */}
            <div className="flex items-center gap-3 pointer-events-auto">
              <button
                onClick={() => setGameState("shop")}
                className="p-3 bg-cyan-600/20 hover:bg-cyan-600/40 border border-cyan-500/40 rounded-xl backdrop-blur-md transition-all flex items-center gap-2 font-bold text-xs uppercase"
              >
                <ShoppingBag className="w-4 h-4 text-cyan-400" /> Upgrade Matrix
              </button>
              <button
                onClick={toggleMute}
                className="p-3 bg-black/50 hover:bg-black/80 border border-white/20 rounded-xl backdrop-blur-md transition-all"
              >
                {isMuted ? <VolumeX className="w-5 h-5 text-red-400" /> : <Volume2 className="w-5 h-5 text-cyan-400" />}
              </button>
              <button
                onClick={() => setGameState("paused")}
                className="p-3 bg-black/50 hover:bg-black/80 border border-white/20 rounded-xl backdrop-blur-md transition-all"
              >
                <Pause className="w-5 h-5 text-cyan-400" />
              </button>
            </div>
          </div>

          {/* Bottom Bar Controls & Abilities */}
          <div className="flex justify-between items-end">
            <div className="flex gap-4 pointer-events-auto">
              {/* Tachyon Dash Ability Badge */}
              <div className="bg-black/60 backdrop-blur-md p-3.5 rounded-2xl border border-cyan-500/30 flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black ${playerInfo.dashCooldown === 0 ? "bg-cyan-500 text-black shadow-[0_0_15px_rgba(0,240,255,0.6)]" : "bg-zinc-800 text-zinc-500"}`}>
                  E
                </div>
                <div>
                  <div className="text-xs font-bold uppercase tracking-wider text-cyan-400">Tachyon Dash</div>
                  <div className="text-[10px] text-zinc-400">
                    {playerInfo.dashCooldown === 0 ? "READY (Right Click / E)" : `COOLDOWN (${Math.ceil(playerInfo.dashCooldown / 60)}s)`}
                  </div>
                </div>
              </div>

              {/* Chrono Nova Super Badge */}
              <div className="bg-black/60 backdrop-blur-md p-3.5 rounded-2xl border border-purple-500/30 flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black ${playerInfo.overdrive >= playerInfo.maxOverdrive ? "bg-purple-500 text-white shadow-[0_0_15px_rgba(255,0,119,0.6)] animate-pulse" : "bg-zinc-800 text-zinc-500"}`}>
                  Q
                </div>
                <div>
                  <div className="text-xs font-bold uppercase tracking-wider text-purple-400">Chrono Stasis Nova</div>
                  <div className="text-[10px] text-zinc-400">
                    {playerInfo.overdrive >= playerInfo.maxOverdrive ? "OVERDRIVE READY (Q)" : `CHARGE (${Math.round((playerInfo.overdrive / playerInfo.maxOverdrive) * 100)}%)`}
                  </div>
                </div>
              </div>
            </div>

            {/* Radar Mini map */}
            <div className="w-28 h-28 bg-black/80 backdrop-blur-md rounded-2xl border border-cyan-500/40 relative overflow-hidden">
              <div className="absolute inset-0 flex items-center justify-center opacity-20 pointer-events-none">
                <Crosshair className="w-20 h-20 text-cyan-400" />
              </div>
              <div className="absolute top-1/2 left-1/2 w-2 h-2 bg-cyan-400 rounded-full -translate-x-1/2 -translate-y-1/2 shadow-[0_0_8px_#00f0ff]" />
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------ */}
      {/* START MENU MODAL */}
      {/* ------------------------------------------ */}
      {gameState === "menu" && (
        <div className="absolute inset-0 z-30 bg-gradient-to-br from-black via-zinc-950 to-indigo-950 flex flex-col items-center justify-center p-6">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="max-w-2xl w-full bg-black/70 backdrop-blur-2xl border border-cyan-500/30 rounded-3xl p-8 md:p-10 shadow-[0_0_50px_rgba(0,240,255,0.15)] text-center flex flex-col items-center"
          >
            <div className="w-16 h-16 rounded-2xl bg-cyan-500/10 border border-cyan-400/40 flex items-center justify-center mb-6 shadow-[0_0_25px_rgba(0,240,255,0.3)]">
              <Clock className="w-8 h-8 text-cyan-400 animate-pulse" />
            </div>

            <h1 className="text-4xl md:text-6xl font-black tracking-tighter uppercase mb-2 bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-500 bg-clip-text text-transparent">
              Chronos Protocol
            </h1>
            <p className="text-zinc-400 text-sm md:text-base font-medium mb-8 max-w-md">
              Control temporal mechanics, manipulate bullet-time, and defeat endless synthwave armadas in 3D depth space.
            </p>

            {/* Select Ship */}
            <div className="w-full mb-8">
              <label className="text-xs font-bold uppercase tracking-widest text-cyan-400 block mb-3 text-left">Select Apex Vessel</label>
              <div className="grid grid-[#111] grid-cols-3 gap-3">
                {[
                  { id: "vanguard", name: "Vanguard Apex", desc: "Balanced Combat Fighter" },
                  { id: "chronos", name: "Chronos Wing", desc: "+60% Time Dilation Capacity" },
                  { id: "phantom", name: "Phantom Reaper", desc: "+80 Max Shield Matrix" }
                ].map((s) => (
                  <button
                    key={s.id}
                    onClick={() => setSelectedShip(s.id as any)}
                    className={`p-4 rounded-2xl border text-left transition-all ${selectedShip === s.id ? "bg-cyan-500/20 border-cyan-400 text-white shadow-[0_0_15px_rgba(0,240,255,0.2)]" : "bg-white/5 border-white/10 text-zinc-400 hover:bg-white/10"}`}
                  >
                    <div className="font-bold text-sm text-white mb-1">{s.name}</div>
                    <div className="text-[11px] text-zinc-400">{s.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-4 w-full">
              <button
                onClick={startGame}
                className="flex-1 py-4 bg-gradient-to-r from-cyan-500 to-blue-600 text-black font-black uppercase tracking-widest rounded-2xl hover:scale-105 transition-all flex items-center justify-center gap-2 shadow-[0_0_30px_rgba(0,240,255,0.4)]"
              >
                <Play className="w-5 h-5 fill-black" /> Launch Mission
              </button>
              <Link
                href="/games"
                className="px-6 py-4 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold uppercase tracking-wider rounded-2xl transition-all flex items-center justify-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" /> Arcade Hub
              </Link>
            </div>

            {highScore > 0 && (
              <div className="mt-6 flex items-center gap-2 text-xs font-bold text-amber-400 uppercase tracking-widest bg-amber-500/10 px-4 py-2 rounded-full border border-amber-500/20">
                <Trophy className="w-4 h-4" /> High Score: {highScore}
              </div>
            )}
          </motion.div>
        </div>
      )}

      {/* ------------------------------------------ */}
      {/* UPGRADE MATRIX SHOP MODAL */}
      {/* ------------------------------------------ */}
      <AnimatePresence>
        {gameState === "shop" && (
          <div className="absolute inset-0 z-30 bg-black/80 backdrop-blur-xl flex items-center justify-center p-6">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="max-w-3xl w-full bg-zinc-950 border border-cyan-500/30 rounded-3xl p-8 shadow-2xl"
            >
              <div className="flex justify-between items-center mb-6 pb-4 border-b border-white/10">
                <div>
                  <h2 className="text-2xl font-black uppercase tracking-wider text-cyan-400">Upgrade Matrix</h2>
                  <p className="text-xs text-zinc-400 mt-1">Enhance ship subsystems using collected Quantum Shards.</p>
                </div>
                <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/30 px-4 py-2 rounded-xl text-emerald-400 font-black text-sm">
                  <span>{stats.shards} SHARDS</span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                {Object.entries(upgrades).map(([key, item]) => (
                  <div key={key} className="bg-white/5 border border-white/10 p-4 rounded-2xl flex items-center justify-between">
                    <div>
                      <div className="font-bold text-sm text-white mb-0.5">{item.stat}</div>
                      <div className="text-xs text-cyan-400 font-semibold">Level {item.level}</div>
                    </div>
                    <button
                      onClick={() => buyUpgrade(key as any)}
                      disabled={stats.shards < item.cost}
                      className={`px-4 py-2 rounded-xl font-bold text-xs uppercase tracking-wider transition-all ${stats.shards >= item.cost ? "bg-cyan-500 text-black hover:bg-cyan-400" : "bg-zinc-800 text-zinc-500 cursor-not-allowed"}`}
                    >
                      Buy ({item.cost})
                    </button>
                  </div>
                ))}
              </div>

              <div className="flex justify-end">
                <button
                  onClick={() => setGameState("playing")}
                  className="px-8 py-3.5 bg-cyan-500 text-black font-black uppercase tracking-widest rounded-xl hover:bg-cyan-400 transition-all"
                >
                  Resume Mission
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ------------------------------------------ */}
      {/* PAUSE MODAL */}
      {/* ------------------------------------------ */}
      {gameState === "paused" && (
        <div className="absolute inset-0 z-30 bg-black/80 backdrop-blur-md flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-zinc-950 border border-white/20 rounded-3xl p-8 text-center flex flex-col items-center">
            <h2 className="text-3xl font-black uppercase tracking-wider text-cyan-400 mb-6">Mission Paused</h2>
            <div className="flex flex-col gap-3 w-full">
              <button
                onClick={() => setGameState("playing")}
                className="py-3.5 bg-cyan-500 text-black font-black uppercase tracking-wider rounded-xl hover:bg-cyan-400 transition-all"
              >
                Resume
              </button>
              <button
                onClick={startGame}
                className="py-3.5 bg-white/10 hover:bg-white/20 text-white font-bold uppercase tracking-wider rounded-xl transition-all"
              >
                Restart Game
              </button>
              <button
                onClick={() => setGameState("menu")}
                className="py-3.5 bg-rose-500/20 hover:bg-rose-500/30 text-rose-400 font-bold uppercase tracking-wider rounded-xl border border-rose-500/30 transition-all"
              >
                Main Menu
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------ */}
      {/* GAME OVER MODAL */}
      {/* ------------------------------------------ */}
      {gameState === "gameover" && (
        <div className="absolute inset-0 z-30 bg-black/90 backdrop-blur-2xl flex items-center justify-center p-6">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="max-w-md w-full bg-zinc-950 border border-rose-500/40 rounded-3xl p-8 text-center flex flex-col items-center shadow-[0_0_50px_rgba(244,63,94,0.2)]"
          >
            <div className="w-16 h-16 rounded-full bg-rose-500/10 border border-rose-500/30 flex items-center justify-center mb-4 text-rose-500">
              <Flame className="w-8 h-8" />
            </div>

            <h2 className="text-3xl font-black uppercase tracking-wider text-rose-500 mb-1">Vessel Destroyed</h2>
            <p className="text-xs text-zinc-400 mb-6">Mission failed. Subsystems corrupted in Wave {stats.wave}.</p>

            {/* Stats list */}
            <div className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 space-y-2 mb-6 text-sm">
              <div className="flex justify-between text-zinc-300"><span>Final Score:</span><strong className="text-cyan-400">{stats.score}</strong></div>
              <div className="flex justify-between text-zinc-300"><span>Wave Reached:</span><strong className="text-white">{stats.wave}</strong></div>
              <div className="flex justify-between text-zinc-300"><span>Hostiles Eliminated:</span><strong className="text-rose-400">{stats.kills}</strong></div>
              <div className="flex justify-between text-zinc-300"><span>Chrono Shards Harvested:</span><strong className="text-emerald-400">{stats.shards}</strong></div>
            </div>

            <div className="flex gap-3 w-full">
              <button
                onClick={startGame}
                className="flex-1 py-4 bg-cyan-500 text-black font-black uppercase tracking-wider rounded-2xl hover:bg-cyan-400 transition-all flex items-center justify-center gap-2"
              >
                <RotateCcw className="w-4 h-4" /> Re-Deploy
              </button>
              <button
                onClick={() => setGameState("menu")}
                className="px-6 py-4 bg-white/10 hover:bg-white/20 text-white font-bold uppercase tracking-wider rounded-2xl transition-all"
              >
                Menu
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
