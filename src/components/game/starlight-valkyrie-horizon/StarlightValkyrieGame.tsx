"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Play,
  Pause,
  RotateCcw,
  Volume2,
  VolumeX,
  Zap,
  Shield,
  Crosshair,
  Trophy,
  Award,
  BarChart2,
  Sparkles,
  ChevronRight,
  Flame,
  Radio,
  RadioTower,
  Cpu,
  Star,
  Activity,
  Maximize2
} from "lucide-react";
import { useUser, useFirestore, setDocumentNonBlocking } from "@/firebase";
import { doc, increment } from "firebase/firestore";

// --- SOUND SYNTHESIZER (Web Audio API) ---
class GameSoundEngine {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;

  constructor() {
    // Lazy init context on first user interaction
  }

  private initCtx() {
    if (!this.ctx && typeof window !== "undefined") {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === "suspended") {
      this.ctx.resume();
    }
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
  }

  public getMuted() {
    return this.isMuted;
  }

  public playLaser() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(880, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(110, this.ctx.currentTime + 0.12);

      gain.gain.setValueAtTime(0.15, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.12);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + 0.12);
    } catch (e) {
      // Audio fallback silent failure
    }
  }

  public playHeavyCannon() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = "square";
      osc.frequency.setValueAtTime(320, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(40, this.ctx.currentTime + 0.25);

      gain.gain.setValueAtTime(0.25, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.25);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + 0.25);
    } catch (e) {}
  }

  public playExplosion() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    try {
      const bufferSize = this.ctx.sampleRate * 0.3;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const output = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
      }

      const whiteNoise = this.ctx.createBufferSource();
      whiteNoise.buffer = buffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.setValueAtTime(800, this.ctx.currentTime);
      filter.frequency.exponentialRampToValueAtTime(30, this.ctx.currentTime + 0.3);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.35, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.3);

      whiteNoise.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);

      whiteNoise.start();
      whiteNoise.stop(this.ctx.currentTime + 0.3);
    } catch (e) {}
  }

  public playEMP() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(150, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1200, this.ctx.currentTime + 0.4);

      gain.gain.setValueAtTime(0.3, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.4);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + 0.4);
    } catch (e) {}
  }

  public playPowerUp() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.setValueAtTime(554.37, now + 0.08);
      osc.frequency.setValueAtTime(659.25, now + 0.16);
      osc.frequency.setValueAtTime(880, now + 0.24);

      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.35);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.35);
    } catch (e) {}
  }

  public playBossAlarm() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(300, now);
      osc.frequency.linearRampToValueAtTime(600, now + 0.25);
      osc.frequency.linearRampToValueAtTime(300, now + 0.5);

      gain.gain.setValueAtTime(0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.5);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.5);
    } catch (e) {}
  }
}

const sounds = new GameSoundEngine();

// --- INTERFACES & TYPES ---
interface PerkOption {
  id: string;
  name: string;
  desc: string;
  icon: string;
  tier: "Common" | "Rare" | "Epic" | "Legendary";
  apply: (game: GameState) => void;
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

interface Star {
  x: number;
  y: number;
  size: number;
  speed: number;
  alpha: number;
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
  piercing?: boolean;
}

interface PowerUpItem {
  x: number;
  y: number;
  type: "health" | "emp" | "multiplier" | "drone" | "weapon";
  radius: number;
  duration: number;
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
  type: "scout" | "stalker" | "heavy" | "boss";
  color: string;
  fireCooldown: number;
  scoreValue: number;
  bossPhase?: number;
  bossTitle?: string;
}

interface GameState {
  player: {
    x: number;
    y: number;
    radius: number;
    hp: number;
    maxHp: number;
    shield: number;
    maxShield: number;
    speed: number;
    fireRate: number; // Ms delay between shots
    lastFire: number;
    empCooldown: number;
    empMaxCooldown: number;
    lastEmp: number;
    dronesCount: number;
    weaponLevel: number;
    pierce: boolean;
    damageMultiplier: number;
    xp: number;
    xpToNext: number;
    level: number;
  };
  score: number;
  kills: number;
  multiplier: number;
  multiplierTimer: number;
  bossActive: boolean;
  currentBossName: string;
  timeElapsed: number;
}

const ALL_AUGMENTS: PerkOption[] = [
  {
    id: "tachyon_fire",
    name: "Tachyon Overcharge",
    desc: "Increases firing speed by 25%",
    icon: "Zap",
    tier: "Rare",
    apply: (g) => {
      g.player.fireRate = Math.max(70, g.player.fireRate * 0.75);
    }
  },
  {
    id: "nanite_shielding",
    name: "Nanite Shielding Matrix",
    desc: "+40 Max Shield and faster shield recovery",
    icon: "Shield",
    tier: "Epic",
    apply: (g) => {
      g.player.maxShield += 40;
      g.player.shield = g.player.maxShield;
    }
  },
  {
    id: "orbital_sentry",
    name: "Orbital Laser Sentry",
    desc: "Deploys an autonomous companion drone that auto-targets enemies",
    icon: "RadioTower",
    tier: "Legendary",
    apply: (g) => {
      g.player.dronesCount += 1;
    }
  },
  {
    id: "quantum_weapon",
    name: "Plasma Tri-Barrel",
    desc: "Upgrades primary cannons with additional spread projectiles",
    icon: "Flame",
    tier: "Rare",
    apply: (g) => {
      g.player.weaponLevel = Math.min(4, g.player.weaponLevel + 1);
    }
  },
  {
    id: "piercing_matrix",
    name: "Quantum Penetration",
    desc: "Primary shots now pierce through enemy hulls",
    icon: "Crosshair",
    tier: "Epic",
    apply: (g) => {
      g.player.pierce = true;
    }
  },
  {
    id: "graviton_burst",
    name: "Graviton EMP Overdrive",
    desc: "Reduces EMP Shockwave cooldown by 30%",
    icon: "Cpu",
    tier: "Common",
    apply: (g) => {
      g.player.empMaxCooldown = Math.max(3000, g.player.empMaxCooldown * 0.7);
    }
  },
  {
    id: "hull_reinforce",
    name: "Apex Hull Armor",
    desc: "+50 Max HP and restores 50 HP immediately",
    icon: "Sparkles",
    tier: "Common",
    apply: (g) => {
      g.player.maxHp += 50;
      g.player.hp = Math.min(g.player.maxHp, g.player.hp + 50);
    }
  }
];

export default function StarlightValkyrieGame() {
  const { user } = useUser();
  const firestore = useFirestore();

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // App UI state
  const [gameState, setGameState] = useState<"MENU" | "PLAYING" | "PAUSED" | "LEVEL_UP" | "GAME_OVER">("MENU");
  const [isMuted, setIsMuted] = useState(false);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [killsCount, setKillsCount] = useState(0);
  const [playerLevel, setPlayerLevel] = useState(1);
  const [playerHp, setPlayerHp] = useState(100);
  const [playerMaxHp, setPlayerMaxHp] = useState(100);
  const [playerShield, setPlayerShield] = useState(50);
  const [playerMaxShield, setPlayerMaxShield] = useState(50);
  const [empReady, setEmpReady] = useState(true);
  const [empProgress, setEmpProgress] = useState(100);
  const [bossActive, setBossActive] = useState(false);
  const [bossName, setBossName] = useState("");
  const [bossHpPercent, setBossHpPercent] = useState(100);

  // Perk choices state when leveling up
  const [perkChoices, setPerkChoices] = useState<PerkOption[]>([]);

  // Mobile Controls
  const [touchActive, setTouchActive] = useState(false);
  const touchJoystickRef = useRef<{ active: boolean; dx: number; dy: number }>({ active: false, dx: 0, dy: 0 });

  // Game internal mutable reference
  const gameRef = useRef<{
    stars: Star[];
    particles: Particle[];
    bullets: Bullet[];
    enemies: Enemy[];
    powerUps: PowerUpItem[];
    state: GameState;
    keys: Record<string, boolean>;
    nextEnemyId: number;
    lastSpawnTime: number;
    spawnInterval: number;
    bossSpawnedCount: number;
    animationFrameId: number | null;
  }>({
    stars: [],
    particles: [],
    bullets: [],
    enemies: [],
    powerUps: [],
    state: {
      player: {
        x: 400,
        y: 500,
        radius: 18,
        hp: 100,
        maxHp: 100,
        shield: 50,
        maxShield: 50,
        speed: 6.5,
        fireRate: 160,
        lastFire: 0,
        empCooldown: 0,
        empMaxCooldown: 10000,
        lastEmp: 0,
        dronesCount: 0,
        weaponLevel: 1,
        pierce: false,
        damageMultiplier: 1,
        xp: 0,
        xpToNext: 100,
        level: 1
      },
      score: 0,
      kills: 0,
      multiplier: 1,
      multiplierTimer: 0,
      bossActive: false,
      currentBossName: "",
      timeElapsed: 0
    },
    keys: {},
    nextEnemyId: 1,
    lastSpawnTime: 0,
    spawnInterval: 1200,
    bossSpawnedCount: 0,
    animationFrameId: null
  });

  // Load High Score from localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedScore = localStorage.getItem("starlight_valkyrie_highscore");
      if (savedScore) {
        setHighScore(parseInt(savedScore, 10));
      }
    }
  }, []);

  // Keyboard Event Listeners
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      gameRef.current.keys[e.code] = true;
      if (e.code === "KeyE" || e.code === "ShiftLeft" || e.code === "ShiftRight") {
        triggerEMP();
      }
      if (e.code === "KeyP" || e.code === "Escape") {
        setGameState((prev) => (prev === "PLAYING" ? "PAUSED" : prev === "PAUSED" ? "PLAYING" : prev));
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      gameRef.current.keys[e.code] = false;
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, []);

  // EMP Shockwave Trigger
  const triggerEMP = useCallback(() => {
    const g = gameRef.current.state;
    const now = Date.now();
    if (now - g.player.lastEmp >= g.player.empMaxCooldown && gameState === "PLAYING") {
      g.player.lastEmp = now;
      sounds.playEMP();

      // Clear all enemy bullets & damage enemies in screen radius
      gameRef.current.bullets = gameRef.current.bullets.filter((b) => !b.isEnemy);

      const canvas = canvasRef.current;
      const width = canvas ? canvas.width : 800;
      const height = canvas ? canvas.height : 600;

      // Spawn shockwave ring particles
      for (let i = 0; i < 60; i++) {
        const angle = (Math.PI * 2 * i) / 60;
        const speed = 12;
        gameRef.current.particles.push({
          x: g.player.x,
          y: g.player.y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          radius: 4,
          color: "#00f0ff",
          alpha: 1,
          decay: 0.02
        });
      }

      // Damage all enemies
      gameRef.current.enemies.forEach((enemy) => {
        const dx = enemy.x - g.player.x;
        const dy = enemy.y - g.player.y;
        const dist = Math.hypot(dx, dy);
        if (dist < 450) {
          enemy.hp -= 80;
        }
      });
    }
  }, [gameState]);

  // Init Starfield
  const initStars = (width: number, height: number) => {
    const stars: Star[] = [];
    for (let i = 0; i < 120; i++) {
      stars.push({
        x: Math.random() * width,
        y: Math.random() * height,
        size: Math.random() * 2.2 + 0.5,
        speed: Math.random() * 2 + 0.5,
        alpha: Math.random() * 0.8 + 0.2
      });
    }
    gameRef.current.stars = stars;
  };

  // Start / Reset Game
  const startGame = () => {
    const canvas = canvasRef.current;
    const width = canvas ? canvas.width : 800;
    const height = canvas ? canvas.height : 600;

    initStars(width, height);

    gameRef.current.particles = [];
    gameRef.current.bullets = [];
    gameRef.current.enemies = [];
    gameRef.current.powerUps = [];
    gameRef.current.bossSpawnedCount = 0;

    gameRef.current.state = {
      player: {
        x: width / 2,
        y: height - 90,
        radius: 18,
        hp: 100,
        maxHp: 100,
        shield: 50,
        maxShield: 50,
        speed: 6.5,
        fireRate: 160,
        lastFire: 0,
        empCooldown: 0,
        empMaxCooldown: 10000,
        lastEmp: 0,
        dronesCount: 0,
        weaponLevel: 1,
        pierce: false,
        damageMultiplier: 1,
        xp: 0,
        xpToNext: 100,
        level: 1
      },
      score: 0,
      kills: 0,
      multiplier: 1,
      multiplierTimer: 0,
      bossActive: false,
      currentBossName: "",
      timeElapsed: 0
    };

    setScore(0);
    setKillsCount(0);
    setPlayerLevel(1);
    setPlayerHp(100);
    setPlayerMaxHp(100);
    setPlayerShield(50);
    setPlayerMaxShield(50);
    setBossActive(false);
    setGameState("PLAYING");
  };

  // Select Perk Augment
  const handleSelectPerk = (perk: PerkOption) => {
    perk.apply(gameRef.current.state);
    sounds.playPowerUp();
    setGameState("PLAYING");
  };

  // Main Game Loop
  useEffect(() => {
    let lastFrameTime = performance.now();

    const loop = (now: number) => {
      const dt = (now - lastFrameTime) / 1000;
      lastFrameTime = now;

      const canvas = canvasRef.current;
      if (canvas && gameState === "PLAYING") {
        const ctx = canvas.getContext("2d");
        if (ctx) {
          updateGame(dt, canvas.width, canvas.height);
          renderGame(ctx, canvas.width, canvas.height);
        }
      } else if (canvas && (gameState === "PAUSED" || gameState === "LEVEL_UP")) {
        const ctx = canvas.getContext("2d");
        if (ctx) {
          renderGame(ctx, canvas.width, canvas.height);
        }
      }

      gameRef.current.animationFrameId = requestAnimationFrame(loop);
    };

    gameRef.current.animationFrameId = requestAnimationFrame(loop);
    return () => {
      if (gameRef.current.animationFrameId) {
        cancelAnimationFrame(gameRef.current.animationFrameId);
      }
    };
  }, [gameState]);

  // Update logic
  const updateGame = (dt: number, width: number, height: number) => {
    const g = gameRef.current.state;
    const now = Date.now();

    // Time Elapsed
    g.timeElapsed += dt;

    // Multiplier Decay
    if (g.multiplierTimer > 0) {
      g.multiplierTimer -= dt;
      if (g.multiplierTimer <= 0) {
        g.multiplier = 1;
      }
    }

    // Shield Regeneration
    if (g.player.shield < g.player.maxShield) {
      g.player.shield = Math.min(g.player.maxShield, g.player.shield + dt * 4);
    }

    // Controls Handling
    const speed = g.player.speed;
    const keys = gameRef.current.keys;

    let dx = 0;
    let dy = 0;

    if (keys["KeyW"] || keys["ArrowUp"]) dy -= 1;
    if (keys["KeyS"] || keys["ArrowDown"]) dy += 1;
    if (keys["KeyA"] || keys["ArrowLeft"]) dx -= 1;
    if (keys["KeyD"] || keys["ArrowRight"]) dx += 1;

    // Mobile Joystick
    if (touchJoystickRef.current.active) {
      dx = touchJoystickRef.current.dx;
      dy = touchJoystickRef.current.dy;
    }

    if (dx !== 0 && dy !== 0) {
      dx *= 0.7071;
      dy *= 0.7071;
    }

    g.player.x += dx * speed;
    g.player.y += dy * speed;

    // Keep Player in bounds
    g.player.x = Math.max(g.player.radius, Math.min(width - g.player.radius, g.player.x));
    g.player.y = Math.max(g.player.radius, Math.min(height - g.player.radius, g.player.y));

    // Player Engine Thruster Particles
    if (Math.random() < 0.6) {
      gameRef.current.particles.push({
        x: g.player.x + (Math.random() - 0.5) * 8,
        y: g.player.y + g.player.radius + 2,
        vx: (Math.random() - 0.5) * 1.5,
        vy: Math.random() * 3 + 2,
        radius: Math.random() * 3 + 1.5,
        color: "#00f0ff",
        alpha: 0.9,
        decay: 0.05
      });
    }

    // Primary Weapon Firing
    if (keys["Space"] || touchActive) {
      if (now - g.player.lastFire >= g.player.fireRate) {
        g.player.lastFire = now;
        firePlayerWeapon(g.player.x, g.player.y, g.player.weaponLevel, g.player.pierce);
      }
    }

    // Drone Auto Firing
    if (g.player.dronesCount > 0 && Math.random() < 0.15) {
      for (let i = 0; i < g.player.dronesCount; i++) {
        const angle = (now / 400) + (i * Math.PI * 2) / g.player.dronesCount;
        const droneX = g.player.x + Math.cos(angle) * 45;
        const droneY = g.player.y + Math.sin(angle) * 45;

        // Find closest enemy
        let closestEnemy: Enemy | null = null;
        let minDist = 9999;
        gameRef.current.enemies.forEach((enemy) => {
          const d = Math.hypot(enemy.x - droneX, enemy.y - droneY);
          if (d < minDist) {
            minDist = d;
            closestEnemy = enemy;
          }
        });

        if (closestEnemy && minDist < 350) {
          const enemyObj = closestEnemy as Enemy;
          const edx = enemyObj.x - droneX;
          const edy = enemyObj.y - droneY;
          const length = Math.hypot(edx, edy);
          gameRef.current.bullets.push({
            x: droneX,
            y: droneY,
            vx: (edx / length) * 14,
            vy: (edy / length) * 14,
            radius: 3,
            color: "#a855f7",
            isEnemy: false,
            damage: 15
          });
        }
      }
    }

    // Spawn Enemies Logic
    if (now - gameRef.current.lastSpawnTime > gameRef.current.spawnInterval && !g.bossActive) {
      gameRef.current.lastSpawnTime = now;
      spawnRandomEnemy(width);

      // Check Boss Trigger every 1200 points
      const requiredScoreForBoss = (gameRef.current.bossSpawnedCount + 1) * 1200;
      if (g.score >= requiredScoreForBoss) {
        spawnBoss(width);
      }
    }

    // Update Stars
    gameRef.current.stars.forEach((star) => {
      star.y += star.speed;
      if (star.y > height) {
        star.y = 0;
        star.x = Math.random() * width;
      }
    });

    // Update Particles
    gameRef.current.particles.forEach((p, idx) => {
      p.x += p.vx;
      p.y += p.vy;
      p.alpha -= p.decay;
    });
    gameRef.current.particles = gameRef.current.particles.filter((p) => p.alpha > 0);

    // Update PowerUps
    gameRef.current.powerUps.forEach((item) => {
      item.y += 1.8;
      // Pickup check
      const dist = Math.hypot(g.player.x - item.x, g.player.y - item.y);
      if (dist < g.player.radius + item.radius) {
        sounds.playPowerUp();
        if (item.type === "health") {
          g.player.hp = Math.min(g.player.maxHp, g.player.hp + 35);
        } else if (item.type === "emp") {
          g.player.lastEmp = 0;
        } else if (item.type === "multiplier") {
          g.multiplier = 2;
          g.multiplierTimer = 10;
        }
        item.duration = 0;
      }
    });
    gameRef.current.powerUps = gameRef.current.powerUps.filter((item) => item.y < height + 20 && item.duration > 0);

    // Update Bullets
    gameRef.current.bullets.forEach((b) => {
      b.x += b.vx;
      b.y += b.vy;

      // Enemy bullet hitting player
      if (b.isEnemy) {
        const dist = Math.hypot(b.x - g.player.x, b.y - g.player.y);
        if (dist < b.radius + g.player.radius) {
          b.y = -999; // destroy bullet
          takePlayerDamage(b.damage);
        }
      } else {
        // Player bullet hitting enemies
        gameRef.current.enemies.forEach((enemy) => {
          const edist = Math.hypot(b.x - enemy.x, b.y - enemy.y);
          if (edist < b.radius + enemy.radius) {
            enemy.hp -= b.damage * g.player.damageMultiplier;

            // Hit particles
            for (let k = 0; k < 4; k++) {
              gameRef.current.particles.push({
                x: b.x,
                y: b.y,
                vx: (Math.random() - 0.5) * 4,
                vy: (Math.random() - 0.5) * 4,
                radius: 2,
                color: "#ff0055",
                alpha: 0.8,
                decay: 0.08
              });
            }

            if (!b.piercing) {
              b.y = -999;
            }
          }
        });
      }
    });
    gameRef.current.bullets = gameRef.current.bullets.filter(
      (b) => b.x >= -50 && b.x <= width + 50 && b.y >= -50 && b.y <= height + 50
    );

    // Update Enemies
    gameRef.current.enemies.forEach((enemy) => {
      enemy.x += enemy.vx;
      enemy.y += enemy.vy;

      // Enemy specific firing logic
      if (enemy.type === "scout") {
        if (Math.random() < 0.008) {
          gameRef.current.bullets.push({
            x: enemy.x,
            y: enemy.y + enemy.radius,
            vx: 0,
            vy: 6,
            radius: 4,
            color: "#ff3366",
            isEnemy: true,
            damage: 12
          });
        }
      } else if (enemy.type === "stalker") {
        // Homing toward player
        const dx = g.player.x - enemy.x;
        const dy = g.player.y - enemy.y;
        const dist = Math.hypot(dx, dy);
        if (dist > 0) {
          enemy.vx = (dx / dist) * 2.8;
          enemy.vy = (dy / dist) * 2.8;
        }
      } else if (enemy.type === "heavy") {
        if (Math.random() < 0.02) {
          // Spread shot
          for (let angleOff of [-0.3, 0, 0.3]) {
            gameRef.current.bullets.push({
              x: enemy.x,
              y: enemy.y + enemy.radius,
              vx: Math.sin(angleOff) * 5,
              vy: Math.cos(angleOff) * 5,
              radius: 5,
              color: "#ff9900",
              isEnemy: true,
              damage: 18
            });
          }
        }
      } else if (enemy.type === "boss") {
        // Boss pattern movement & attack
        if (enemy.x <= enemy.radius || enemy.x >= width - enemy.radius) {
          enemy.vx *= -1;
        }
        if (Math.random() < 0.05) {
          // Boss spiral barrage
          const time = Date.now() / 200;
          for (let bIdx = 0; bIdx < 6; bIdx++) {
            const angle = time + (bIdx * Math.PI * 2) / 6;
            gameRef.current.bullets.push({
              x: enemy.x,
              y: enemy.y,
              vx: Math.cos(angle) * 5.5,
              vy: Math.sin(angle) * 5.5,
              radius: 6,
              color: "#e11d48",
              isEnemy: true,
              damage: 22
            });
          }
        }
      }

      // Player Collision with enemy
      const pDist = Math.hypot(g.player.x - enemy.x, g.player.y - enemy.y);
      if (pDist < g.player.radius + enemy.radius) {
        takePlayerDamage(25);
        if (enemy.type !== "boss") {
          enemy.hp = 0;
        }
      }

      // Check Enemy Defeat
      if (enemy.hp <= 0) {
        sounds.playExplosion();
        g.kills += 1;
        const scoreGained = enemy.scoreValue * g.multiplier;
        g.score += scoreGained;
        g.player.xp += Math.floor(scoreGained / 2);

        // Explosion Particles
        for (let i = 0; i < (enemy.type === "boss" ? 60 : 18); i++) {
          gameRef.current.particles.push({
            x: enemy.x,
            y: enemy.y,
            vx: (Math.random() - 0.5) * (enemy.type === "boss" ? 12 : 7),
            vy: (Math.random() - 0.5) * (enemy.type === "boss" ? 12 : 7),
            radius: Math.random() * 4 + 2,
            color: enemy.color,
            alpha: 1,
            decay: 0.03
          });
        }

        // PowerUp Drop Chance
        if (Math.random() < 0.25 || enemy.type === "boss") {
          const types: ("health" | "emp" | "multiplier")[] = ["health", "emp", "multiplier"];
          const selected = types[Math.floor(Math.random() * types.length)];
          gameRef.current.powerUps.push({
            x: enemy.x,
            y: enemy.y,
            type: selected,
            radius: 12,
            duration: 10
          });
        }

        if (enemy.type === "boss") {
          g.bossActive = false;
          setBossActive(false);
        }
      }
    });

    gameRef.current.enemies = gameRef.current.enemies.filter((e) => e.hp > 0 && e.y < height + 100);

    // Level Up Check
    if (g.player.xp >= g.player.xpToNext) {
      g.player.level += 1;
      g.player.xp -= g.player.xpToNext;
      g.player.xpToNext = Math.floor(g.player.xpToNext * 1.4);

      // Trigger Perk Augment Select Modal
      const shuffled = [...ALL_AUGMENTS].sort(() => 0.5 - Math.random());
      setPerkChoices(shuffled.slice(0, 3));
      setGameState("LEVEL_UP");
    }

    // UI React Sync
    setScore(g.score);
    setKillsCount(g.kills);
    setPlayerLevel(g.player.level);
    setPlayerHp(g.player.hp);
    setPlayerMaxHp(g.player.maxHp);
    setPlayerShield(g.player.shield);
    setPlayerMaxShield(g.player.maxShield);

    // EMP Progress
    const empElapsed = now - g.player.lastEmp;
    const empPct = Math.min(100, Math.floor((empElapsed / g.player.empMaxCooldown) * 100));
    setEmpProgress(empPct);
    setEmpReady(empPct >= 100);

    // Boss Bar
    const currentBoss = gameRef.current.enemies.find((e) => e.type === "boss");
    if (currentBoss) {
      setBossActive(true);
      setBossName(currentBoss.bossTitle || "Apex Dreadnought");
      setBossHpPercent(Math.max(0, Math.floor((currentBoss.hp / currentBoss.maxHp) * 100)));
    } else {
      setBossActive(false);
    }
  };

  // Fire Player Weapons
  const firePlayerWeapon = (x: number, y: number, level: number, pierce: boolean) => {
    sounds.playLaser();
    const speed = 16;

    if (level === 1) {
      gameRef.current.bullets.push({
        x,
        y: y - 15,
        vx: 0,
        vy: -speed,
        radius: 4,
        color: "#00f0ff",
        isEnemy: false,
        damage: 25,
        piercing: pierce
      });
    } else if (level === 2) {
      gameRef.current.bullets.push({
        x: x - 10,
        y: y - 15,
        vx: 0,
        vy: -speed,
        radius: 4,
        color: "#00f0ff",
        isEnemy: false,
        damage: 22,
        piercing: pierce
      });
      gameRef.current.bullets.push({
        x: x + 10,
        y: y - 15,
        vx: 0,
        vy: -speed,
        radius: 4,
        color: "#00f0ff",
        isEnemy: false,
        damage: 22,
        piercing: pierce
      });
    } else if (level >= 3) {
      gameRef.current.bullets.push({
        x,
        y: y - 18,
        vx: 0,
        vy: -speed,
        radius: 5,
        color: "#38bdf8",
        isEnemy: false,
        damage: 28,
        piercing: pierce
      });
      gameRef.current.bullets.push({
        x: x - 12,
        y: y - 12,
        vx: -2.5,
        vy: -speed + 1,
        radius: 4,
        color: "#00f0ff",
        isEnemy: false,
        damage: 20,
        piercing: pierce
      });
      gameRef.current.bullets.push({
        x: x + 12,
        y: y - 12,
        vx: 2.5,
        vy: -speed + 1,
        radius: 4,
        color: "#00f0ff",
        isEnemy: false,
        damage: 20,
        piercing: pierce
      });
    }
  };

  // Player Damage Receiver
  const takePlayerDamage = (amount: number) => {
    const g = gameRef.current.state;
    sounds.playHeavyCannon();

    if (g.player.shield > 0) {
      if (g.player.shield >= amount) {
        g.player.shield -= amount;
      } else {
        const remaining = amount - g.player.shield;
        g.player.shield = 0;
        g.player.hp -= remaining;
      }
    } else {
      g.player.hp -= amount;
    }

    if (g.player.hp <= 0) {
      g.player.hp = 0;
      handleGameOver();
    }
  };

  // Handle Game Over
  const handleGameOver = () => {
    sounds.playExplosion();
    setGameState("GAME_OVER");

    const finalScore = gameRef.current.state.score;
    if (finalScore > highScore) {
      setHighScore(finalScore);
      if (typeof window !== "undefined") {
        localStorage.setItem("starlight_valkyrie_highscore", finalScore.toString());
      }
    }

    // Save Score to Firestore if user logged in
    if (user && firestore) {
      try {
        const userRef = doc(firestore, "users", user.uid);
        setDocumentNonBlocking(
          userRef,
          {
            stats: {
              starlightValkyrieHighScore: Math.max(finalScore, highScore)
            }
          },
          { merge: true }
        );
      } catch (e) {}
    }
  };

  // Spawn enemy helper
  const spawnRandomEnemy = (width: number) => {
    const rand = Math.random();
    const spawnX = Math.random() * (width - 60) + 30;

    if (rand < 0.5) {
      // Scout
      gameRef.current.enemies.push({
        id: gameRef.current.nextEnemyId++,
        x: spawnX,
        y: -30,
        vx: (Math.random() - 0.5) * 3,
        vy: Math.random() * 2 + 2,
        radius: 16,
        hp: 30,
        maxHp: 30,
        type: "scout",
        color: "#f43f5e",
        fireCooldown: 0,
        scoreValue: 100
      });
    } else if (rand < 0.8) {
      // Stalker
      gameRef.current.enemies.push({
        id: gameRef.current.nextEnemyId++,
        x: spawnX,
        y: -30,
        vx: 0,
        vy: 2.5,
        radius: 18,
        hp: 55,
        maxHp: 55,
        type: "stalker",
        color: "#a855f7",
        fireCooldown: 0,
        scoreValue: 180
      });
    } else {
      // Heavy
      gameRef.current.enemies.push({
        id: gameRef.current.nextEnemyId++,
        x: spawnX,
        y: -40,
        vx: (Math.random() - 0.5) * 1.5,
        vy: 1.2,
        radius: 26,
        hp: 140,
        maxHp: 140,
        type: "heavy",
        color: "#f59e0b",
        fireCooldown: 0,
        scoreValue: 350
      });
    }
  };

  // Spawn Boss helper
  const spawnBoss = (width: number) => {
    sounds.playBossAlarm();
    gameRef.current.bossSpawnedCount += 1;
    gameRef.current.state.bossActive = true;

    const titles = ["VALKYRIE OVERSEER ALPHA", "HYPERION VOID CORE", "SINGULARITY LEVIATHAN"];
    const bossTitle = titles[(gameRef.current.bossSpawnedCount - 1) % titles.length];

    gameRef.current.enemies.push({
      id: gameRef.current.nextEnemyId++,
      x: width / 2,
      y: 90,
      vx: 3,
      vy: 0,
      radius: 45,
      hp: 1200 + gameRef.current.bossSpawnedCount * 400,
      maxHp: 1200 + gameRef.current.bossSpawnedCount * 400,
      type: "boss",
      color: "#e11d48",
      fireCooldown: 0,
      scoreValue: 1500,
      bossTitle
    });
  };

  // Render Canvas Graphics
  const renderGame = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    // Clear Background
    ctx.fillStyle = "#05030d";
    ctx.fillRect(0, 0, width, height);

    // Draw Starfield
    gameRef.current.stars.forEach((s) => {
      ctx.fillStyle = `rgba(255, 255, 255, ${s.alpha})`;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
      ctx.fill();
    });

    const g = gameRef.current.state;

    // Draw Particles
    gameRef.current.particles.forEach((p) => {
      ctx.save();
      ctx.globalAlpha = p.alpha;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });

    // Draw PowerUps
    gameRef.current.powerUps.forEach((item) => {
      ctx.save();
      ctx.shadowBlur = 12;
      ctx.shadowColor = item.type === "health" ? "#10b981" : item.type === "emp" ? "#00f0ff" : "#f59e0b";
      ctx.fillStyle = item.type === "health" ? "#10b981" : item.type === "emp" ? "#00f0ff" : "#f59e0b";
      ctx.beginPath();
      ctx.arc(item.x, item.y, item.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });

    // Draw Bullets
    gameRef.current.bullets.forEach((b) => {
      ctx.save();
      ctx.shadowBlur = 8;
      ctx.shadowColor = b.color;
      ctx.fillStyle = b.color;
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });

    // Draw Drones
    if (g.player.dronesCount > 0) {
      const now = Date.now();
      for (let i = 0; i < g.player.dronesCount; i++) {
        const angle = now / 400 + (i * Math.PI * 2) / g.player.dronesCount;
        const droneX = g.player.x + Math.cos(angle) * 45;
        const droneY = g.player.y + Math.sin(angle) * 45;

        ctx.save();
        ctx.shadowBlur = 10;
        ctx.shadowColor = "#a855f7";
        ctx.fillStyle = "#c084fc";
        ctx.beginPath();
        ctx.arc(droneX, droneY, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    }

    // Draw Enemies
    gameRef.current.enemies.forEach((enemy) => {
      ctx.save();
      ctx.shadowBlur = 14;
      ctx.shadowColor = enemy.color;
      ctx.fillStyle = enemy.color;

      if (enemy.type === "boss") {
        // Draw Apex Boss Structure
        ctx.beginPath();
        ctx.arc(enemy.x, enemy.y, enemy.radius, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 3;
        ctx.stroke();
      } else {
        // Triangle Ship Shape
        ctx.beginPath();
        ctx.moveTo(enemy.x, enemy.y + enemy.radius);
        ctx.lineTo(enemy.x - enemy.radius, enemy.y - enemy.radius);
        ctx.lineTo(enemy.x + enemy.radius, enemy.y - enemy.radius);
        ctx.closePath();
        ctx.fill();
      }
      ctx.restore();
    });

    // Draw Player Ship (Apex Starlight Valkyrie Interceptor)
    ctx.save();
    ctx.shadowBlur = 20;
    ctx.shadowColor = "#00f0ff";

    // Shield Aura
    if (g.player.shield > 0) {
      ctx.strokeStyle = `rgba(0, 240, 255, ${0.4 + (g.player.shield / g.player.maxShield) * 0.4})`;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(g.player.x, g.player.y, g.player.radius + 8, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Ship Fuselage
    ctx.fillStyle = "#38bdf8";
    ctx.beginPath();
    ctx.moveTo(g.player.x, g.player.y - g.player.radius - 6);
    ctx.lineTo(g.player.x - g.player.radius - 4, g.player.y + g.player.radius);
    ctx.lineTo(g.player.x, g.player.y + g.player.radius - 4);
    ctx.lineTo(g.player.x + g.player.radius + 4, g.player.y + g.player.radius);
    ctx.closePath();
    ctx.fill();

    // Cockpit Glow
    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.arc(g.player.x, g.player.y - 2, 4, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  };

  // Toggle Mute
  const toggleMute = () => {
    const nextMute = !isMuted;
    setIsMuted(nextMute);
    sounds.setMuted(nextMute);
  };

  return (
    <div
      ref={containerRef}
      className="relative w-full h-[calc(100vh-4rem)] max-h-[900px] bg-[#05030d] flex items-center justify-center overflow-hidden rounded-xl border border-indigo-500/20 shadow-2xl font-sans"
    >
      {/* Canvas Element */}
      <canvas
        ref={canvasRef}
        width={900}
        height={650}
        className="w-full h-full object-contain max-w-[900px] max-h-[650px] bg-[#05030d] rounded-lg shadow-inner"
      />

      {/* --- HUD OVERLAY (When Playing or Paused) --- */}
      {(gameState === "PLAYING" || gameState === "PAUSED" || gameState === "LEVEL_UP") && (
        <div className="absolute inset-0 pointer-events-none p-6 flex flex-col justify-between max-w-[900px] mx-auto">
          {/* Top Bar Stats */}
          <div className="flex items-center justify-between gap-4 bg-slate-900/60 backdrop-blur-md p-3 px-5 rounded-2xl border border-indigo-500/20 shadow-lg pointer-events-auto">
            {/* Health & Shield Bar */}
            <div className="flex flex-col gap-1.5 w-48">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
                <span className="flex items-center gap-1 text-emerald-400">
                  <Activity className="w-3.5 h-3.5" /> HP
                </span>
                <span>
                  {Math.round(playerHp)} / {playerMaxHp}
                </span>
              </div>
              <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full transition-all duration-200"
                  style={{ width: `${Math.max(0, (playerHp / playerMaxHp) * 100)}%` }}
                />
              </div>

              {/* Shield */}
              <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
                <span className="flex items-center gap-1 text-cyan-400">
                  <Shield className="w-3.5 h-3.5" /> SHIELD
                </span>
                <span>
                  {Math.round(playerShield)} / {playerMaxShield}
                </span>
              </div>
              <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                <div
                  className="bg-cyan-400 h-full transition-all duration-200"
                  style={{ width: `${Math.max(0, (playerShield / playerMaxShield) * 100)}%` }}
                />
              </div>
            </div>

            {/* Score & Multiplier */}
            <div className="flex flex-col items-center">
              <div className="text-2xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-indigo-400 tracking-wider">
                {score.toLocaleString()}
              </div>
              <div className="text-[10px] uppercase font-bold text-slate-400 tracking-widest">Score</div>
            </div>

            {/* Level & Kills */}
            <div className="flex items-center gap-6">
              <div className="flex flex-col items-center">
                <div className="text-sm font-bold text-indigo-400 flex items-center gap-1">
                  <Star className="w-4 h-4 fill-indigo-400" /> Lvl {playerLevel}
                </div>
                <div className="text-[10px] text-slate-400 uppercase font-semibold">Rank</div>
              </div>

              <div className="flex flex-col items-center">
                <div className="text-sm font-bold text-rose-400 flex items-center gap-1">
                  <Crosshair className="w-4 h-4" /> {killsCount}
                </div>
                <div className="text-[10px] text-slate-400 uppercase font-semibold">Kills</div>
              </div>

              {/* Mute & Pause */}
              <div className="flex items-center gap-2">
                <button
                  onClick={toggleMute}
                  className="p-2 bg-slate-800/80 hover:bg-slate-700 rounded-lg text-slate-300 transition"
                >
                  {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                </button>
                <button
                  onClick={() => setGameState((prev) => (prev === "PLAYING" ? "PAUSED" : "PLAYING"))}
                  className="p-2 bg-slate-800/80 hover:bg-slate-700 rounded-lg text-slate-300 transition"
                >
                  <Pause className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Boss Bar Overlay */}
          {bossActive && (
            <div className="w-full max-w-md mx-auto bg-slate-900/80 backdrop-blur-md p-3 rounded-xl border border-rose-500/40 shadow-xl pointer-events-auto flex flex-col gap-1.5 my-2">
              <div className="flex items-center justify-between text-xs font-extrabold text-rose-400 tracking-wider">
                <span className="flex items-center gap-1.5">
                  <RadioTower className="w-4 h-4 animate-pulse" /> {bossName}
                </span>
                <span>{bossHpPercent}%</span>
              </div>
              <div className="w-full bg-slate-950 h-3 rounded-full overflow-hidden border border-rose-500/30">
                <div
                  className="bg-gradient-to-r from-rose-600 via-amber-500 to-rose-500 h-full transition-all duration-150"
                  style={{ width: `${bossHpPercent}%` }}
                />
              </div>
            </div>
          )}

          {/* Bottom Control Ability Bar */}
          <div className="flex items-center justify-between pointer-events-auto">
            {/* EMP Shockwave Ability Button */}
            <button
              onClick={triggerEMP}
              disabled={!empReady}
              className={`flex items-center gap-3 px-5 py-3 rounded-xl border font-bold text-sm transition-all shadow-lg ${
                empReady
                  ? "bg-gradient-to-r from-cyan-500 to-indigo-600 border-cyan-300 text-white hover:scale-105 cursor-pointer"
                  : "bg-slate-900/80 border-slate-700/50 text-slate-500 cursor-not-allowed opacity-75"
              }`}
            >
              <Zap className={`w-5 h-5 ${empReady ? "text-cyan-200 animate-bounce" : ""}`} />
              <div className="flex flex-col text-left">
                <span className="text-xs uppercase tracking-wider text-cyan-200 font-extrabold">
                  EMP Shockwave [E]
                </span>
                <span className="text-[10px] text-slate-300">{empReady ? "READY TO DISCHARGE" : `${empProgress}% Charge`}</span>
              </div>
            </button>

            {/* Touch Fire Button (Mobile) */}
            <button
              onMouseDown={() => setTouchActive(true)}
              onMouseUp={() => setTouchActive(false)}
              onTouchStart={() => setTouchActive(true)}
              onTouchEnd={() => setTouchActive(false)}
              className="px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl border border-indigo-300 text-white font-extrabold text-sm shadow-xl active:scale-95"
            >
              AUTO FIRE
            </button>
          </div>
        </div>
      )}

      {/* --- START MENU OVERLAY --- */}
      {gameState === "MENU" && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="absolute inset-0 bg-slate-950/90 backdrop-blur-xl flex flex-col items-center justify-center p-8 z-30 text-center"
        >
          <div className="max-w-md w-full bg-slate-900/80 p-8 rounded-3xl border border-indigo-500/30 shadow-2xl flex flex-col items-center gap-6">
            <div className="p-4 bg-indigo-500/10 rounded-2xl border border-indigo-500/30 text-indigo-400">
              <Sparkles className="w-12 h-12 animate-pulse" />
            </div>

            <div className="flex flex-col gap-1">
              <h1 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-indigo-300 to-purple-400 tracking-tight">
                STARLIGHT VALKYRIE
              </h1>
              <p className="text-xs uppercase tracking-widest text-indigo-400 font-bold">Horizon Cybernetic Interceptor</p>
            </div>

            <p className="text-sm text-slate-300 leading-relaxed">
              Command the apex Starlight Interceptor. Deploy graviton EMP shockwaves, level up matrix augments, and obliterate incoming rogue AI dreadnought armadas.
            </p>

            {/* High Score Badge */}
            {highScore > 0 && (
              <div className="flex items-center gap-2 px-4 py-2 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-400 text-sm font-bold">
                <Trophy className="w-4 h-4" /> Personal Best: {highScore.toLocaleString()}
              </div>
            )}

            {/* Action Buttons */}
            <div className="w-full flex flex-col gap-3">
              <button
                onClick={startGame}
                className="w-full py-4 bg-gradient-to-r from-cyan-500 via-indigo-600 to-purple-600 hover:from-cyan-400 hover:to-purple-500 text-white font-extrabold text-lg rounded-xl shadow-lg hover:shadow-indigo-500/25 transition-all flex items-center justify-center gap-2 group cursor-pointer"
              >
                <Play className="w-5 h-5 fill-white group-hover:translate-x-0.5 transition" /> LAUNCH INTERCEPTOR
              </button>

              <button
                onClick={toggleMute}
                className="w-full py-3 bg-slate-800/80 hover:bg-slate-700 border border-slate-700/50 text-slate-300 font-semibold text-sm rounded-xl transition flex items-center justify-center gap-2 cursor-pointer"
              >
                {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                {isMuted ? "Unmute Audio" : "Audio Enabled"}
              </button>
            </div>
          </div>
        </motion.div>
      )}

      {/* --- LEVEL UP PERK SELECT MODAL --- */}
      {gameState === "LEVEL_UP" && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="absolute inset-0 bg-slate-950/95 backdrop-blur-2xl flex flex-col items-center justify-center p-6 z-40 text-center"
        >
          <div className="max-w-2xl w-full flex flex-col items-center gap-6">
            <div className="flex flex-col items-center gap-1">
              <span className="px-3 py-1 bg-indigo-500/20 border border-indigo-500/40 rounded-full text-indigo-300 text-xs font-extrabold tracking-widest uppercase">
                TACHYON MATRIX UPGRADE
              </span>
              <h2 className="text-3xl font-extrabold text-white">SELECT MATRIX AUGMENT</h2>
              <p className="text-xs text-slate-400">Level {playerLevel} Achieved - Choose 1 Augment to install</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full">
              {perkChoices.map((perk) => (
                <button
                  key={perk.id}
                  onClick={() => handleSelectPerk(perk)}
                  className="bg-slate-900/90 hover:bg-slate-800/90 border border-indigo-500/30 hover:border-cyan-400 p-5 rounded-2xl text-left flex flex-col justify-between gap-4 transition-all hover:scale-105 group cursor-pointer shadow-xl"
                >
                  <div className="flex flex-col gap-2">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-cyan-400 px-2 py-0.5 bg-cyan-950 border border-cyan-800 rounded-md w-max">
                      {perk.tier}
                    </span>
                    <h3 className="font-bold text-white text-base group-hover:text-cyan-300 transition">{perk.name}</h3>
                    <p className="text-xs text-slate-300 leading-relaxed">{perk.desc}</p>
                  </div>
                  <div className="flex items-center text-xs font-bold text-indigo-400 group-hover:text-cyan-300 gap-1">
                    INSTALL <ChevronRight className="w-4 h-4" />
                  </div>
                </button>
              ))}
            </div>
          </div>
        </motion.div>
      )}

      {/* --- PAUSE OVERLAY --- */}
      {gameState === "PAUSED" && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute inset-0 bg-slate-950/85 backdrop-blur-md flex flex-col items-center justify-center p-6 z-30 text-center"
        >
          <div className="max-w-sm w-full bg-slate-900 p-6 rounded-2xl border border-slate-800 flex flex-col items-center gap-5 shadow-2xl">
            <h2 className="text-2xl font-black text-white">MISSION PAUSED</h2>
            <div className="flex flex-col gap-3 w-full">
              <button
                onClick={() => setGameState("PLAYING")}
                className="w-full py-3 bg-gradient-to-r from-cyan-500 to-indigo-600 text-white font-bold text-sm rounded-xl cursor-pointer"
              >
                RESUME
              </button>
              <button
                onClick={startGame}
                className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-sm rounded-xl cursor-pointer"
              >
                RESTART MISSION
              </button>
            </div>
          </div>
        </motion.div>
      )}

      {/* --- GAME OVER OVERLAY --- */}
      {gameState === "GAME_OVER" && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="absolute inset-0 bg-slate-950/95 backdrop-blur-xl flex flex-col items-center justify-center p-6 z-40 text-center"
        >
          <div className="max-w-md w-full bg-slate-900/90 p-8 rounded-3xl border border-rose-500/30 shadow-2xl flex flex-col items-center gap-6">
            <div className="p-4 bg-rose-500/10 rounded-2xl border border-rose-500/30 text-rose-500">
              <Flame className="w-12 h-12" />
            </div>

            <div className="flex flex-col gap-1">
              <h2 className="text-3xl font-black text-rose-500">INTERCEPTOR DESTROYED</h2>
              <p className="text-xs uppercase tracking-widest text-slate-400 font-bold">Mission Statistics</p>
            </div>

            <div className="grid grid-cols-2 gap-3 w-full bg-slate-950/60 p-4 rounded-xl border border-slate-800">
              <div className="flex flex-col items-center">
                <span className="text-[10px] uppercase font-bold text-slate-400">Final Score</span>
                <span className="text-xl font-extrabold text-cyan-400">{score.toLocaleString()}</span>
              </div>
              <div className="flex flex-col items-center">
                <span className="text-[10px] uppercase font-bold text-slate-400">Enemies Destroyed</span>
                <span className="text-xl font-extrabold text-rose-400">{killsCount}</span>
              </div>
            </div>

            <button
              onClick={startGame}
              className="w-full py-4 bg-gradient-to-r from-rose-500 via-indigo-600 to-cyan-500 hover:from-rose-400 hover:to-cyan-400 text-white font-extrabold text-lg rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <RotateCcw className="w-5 h-5" /> RE-DEPLOY INTERCEPTOR
            </button>
          </div>
        </motion.div>
      )}
    </div>
  );
}
