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
  Sparkles,
  Trophy,
  ShoppingBag,
  Maximize2,
  Minimize2,
  ArrowLeft,
  Flame,
  Swords,
  ShieldAlert,
  Activity,
  Crosshair,
  Award
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
  width: number;
  height: number;
  facing: "left" | "right";
  isGrounded: boolean;
  isJumping: boolean;
  jumpCount: number;
  maxJumps: number;
  isDashing: boolean;
  dashTimer: number;
  dashCooldown: number;
  maxDashCooldown: number;
  isParrying: boolean;
  parryTimer: number;
  comboStep: number;
  comboTimer: number;
  hp: number;
  maxHp: number;
  shield: number;
  maxShield: number;
  energy: number;
  maxEnergy: number;
  ultimate: number;
  maxUltimate: number;
  bladeDamage: number;
  critChance: number;
  invulnerableTimer: number;
}

export interface Platform {
  x: number;
  y: number;
  width: number;
  height: number;
  color?: string;
  isPassThrough?: boolean;
}

export interface Enemy {
  id: string;
  type: "ninja" | "drone" | "heavy" | "assassin" | "boss";
  x: number;
  y: number;
  vx: number;
  vy: number;
  width: number;
  height: number;
  hp: number;
  maxHp: number;
  facing: "left" | "right";
  color: string;
  attackTimer: number;
  isAttacking: boolean;
  state: "patrol" | "chase" | "attack" | "staggered";
  staggerTimer: number;
  jumpTimer: number;
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
  life: number;
  reflected?: boolean;
}

export interface SlashEffect {
  id: string;
  x: number;
  y: number;
  radius: number;
  angle: number;
  color: string;
  alpha: number;
  life: number;
  maxLife: number;
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

export interface CyberShard {
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
  parries: number;
  maxCombo: number;
  wave: number;
}

// ==========================================
// AUDIO SYNTHESIZER (WEB AUDIO API)
// ==========================================
class NeonAudioEngine {
  private ctx: AudioContext | null = null;
  private muted: boolean = false;

  public setMuted(muted: boolean) {
    this.muted = muted;
  }

  private init() {
    if (!this.ctx && typeof window !== "undefined") {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) this.ctx = new AudioCtx();
    }
    if (this.ctx && this.ctx.state === "suspended") {
      this.ctx.resume();
    }
  }

  public playSlash() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(800, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(150, this.ctx.currentTime + 0.1);
      gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.1);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.1);
    } catch {}
  }

  public playParry() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(1200, this.ctx.currentTime);
      osc.frequency.setValueAtTime(2400, this.ctx.currentTime + 0.05);
      gain.gain.setValueAtTime(0.3, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.2);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.2);
    } catch {}
  }

  public playDash() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(300, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(90, this.ctx.currentTime + 0.15);
      gain.gain.setValueAtTime(0.15, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.15);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.15);
    } catch {}
  }

  public playExplosion() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;
    try {
      const dur = 0.35;
      const bufferSize = this.ctx.sampleRate * dur;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;

      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;
      const filter = this.ctx.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.setValueAtTime(500, this.ctx.currentTime);
      filter.frequency.linearRampToValueAtTime(40, this.ctx.currentTime + dur);
      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.3, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + dur);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);
      noise.start();
      noise.stop(this.ctx.currentTime + dur);
    } catch {}
  }

  public playPickup() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(600, this.ctx.currentTime);
      osc.frequency.setValueAtTime(900, this.ctx.currentTime + 0.08);
      gain.gain.setValueAtTime(0.15, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.18);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.18);
    } catch {}
  }
}

const audio = new NeonAudioEngine();

// ==========================================
// MAIN GAME COMPONENT
// ==========================================
export default function NeonRoninGame() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // States
  const [gameState, setGameState] = useState<"menu" | "playing" | "paused" | "shop" | "gameover">("menu");
  const [isMuted, setIsMuted] = useState(false);
  const [highScore, setHighScore] = useState(0);

  const [stats, setStats] = useState<GameStats>({
    score: 0,
    multiplier: 1,
    shards: 0,
    kills: 0,
    parries: 0,
    maxCombo: 0,
    wave: 1
  });

  const [playerInfo, setPlayerInfo] = useState<PlayerState>({
    x: 100,
    y: 400,
    vx: 0,
    vy: 0,
    width: 32,
    height: 48,
    facing: "right",
    isGrounded: false,
    isJumping: false,
    jumpCount: 0,
    maxJumps: 2,
    isDashing: false,
    dashTimer: 0,
    dashCooldown: 0,
    maxDashCooldown: 45,
    isParrying: false,
    parryTimer: 0,
    comboStep: 0,
    comboTimer: 0,
    hp: 120,
    maxHp: 120,
    shield: 60,
    maxShield: 60,
    energy: 100,
    maxEnergy: 100,
    ultimate: 0,
    maxUltimate: 100,
    bladeDamage: 45,
    critChance: 0.15,
    invulnerableTimer: 0
  });

  // Upgrades state
  const [upgrades, setUpgrades] = useState({
    bladeDamage: { level: 1, cost: 50, stat: "Katana Damage +25%" },
    maxShield: { level: 1, cost: 60, stat: "Plasma Shield +30" },
    maxHp: { level: 1, cost: 75, stat: "Cybernetic HP +30" },
    dashRate: { level: 1, cost: 80, stat: "Dash Cooldown -20%" },
    critMastery: { level: 1, cost: 100, stat: "Critical Chance +15%" }
  });

  // Engine Refs
  const engineRef = useRef({
    keys: {} as Record<string, boolean>,
    player: { ...playerInfo },
    platforms: [] as Platform[],
    enemies: [] as Enemy[],
    projectiles: [] as Projectile[],
    particles: [] as Particle[],
    slashes: [] as SlashEffect[],
    floatingTexts: [] as FloatingText[],
    shards: [] as CyberShard[],
    stats: { ...stats },
    screenShake: 0,
    spawnTimer: 0,
    waveTimer: 0,
    bossActive: false,
    animFrameId: 0,
    cameraX: 0
  });

  // Load highscore
  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("neon_ronin_highscore");
      if (saved) setHighScore(parseInt(saved, 10));
    }
  }, []);

  const toggleMute = () => {
    const next = !isMuted;
    setIsMuted(next);
    audio.setMuted(next);
  };

  // Keyboard Event Listeners
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      engineRef.current.keys[key] = true;

      if (key === "p" || key === "escape") {
        if (gameState === "playing") setGameState("paused");
        else if (gameState === "paused") setGameState("playing");
      }

      if (gameState === "playing") {
        if (key === "w" || key === "arrowup" || key === " ") {
          performJump();
        }
        if (key === "j" || key === "z" || key === "k") {
          performAttack();
        }
        if (key === "l" || key === "x" || key === "shift") {
          performDash();
        }
        if (key === "k" || key === "c") {
          performParry();
        }
        if (key === "u" || key === "q") {
          performUltimate();
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      engineRef.current.keys[e.key.toLowerCase()] = false;
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [gameState]);

  // Player Actions
  const performJump = () => {
    const p = engineRef.current.player;
    if (p.jumpCount < p.maxJumps) {
      p.vy = -12;
      p.jumpCount++;
      p.isGrounded = false;
      // Particles
      createSparks(p.x + p.width / 2, p.y + p.height, "#00f0ff", 6);
    }
  };

  const performDash = () => {
    const p = engineRef.current.player;
    if (p.dashCooldown > 0) return;
    p.isDashing = true;
    p.dashTimer = 12;
    p.dashCooldown = p.maxDashCooldown;
    p.invulnerableTimer = 15;
    audio.playDash();

    const dashSpeed = p.facing === "right" ? 18 : -18;
    p.vx = dashSpeed;

    createSparks(p.x + p.width / 2, p.y + p.height / 2, "#ff0077", 12);
  };

  const performParry = () => {
    const p = engineRef.current.player;
    if (p.isParrying) return;
    p.isParrying = true;
    p.parryTimer = 18;
    audio.playParry();
    addFloatingText("PARRY STANCE!", p.x, p.y - 20, "#00ffcc");
  };

  const performAttack = () => {
    const p = engineRef.current.player;
    audio.playSlash();

    p.comboStep = (p.comboStep % 3) + 1;
    p.comboTimer = 30;

    const attackWidth = 65;
    const attackHeight = 50;
    const attackX = p.facing === "right" ? p.x + p.width : p.x - attackWidth;
    const attackY = p.y - 5;

    // Create Slash visual effect
    engineRef.current.slashes.push({
      id: Math.random().toString(),
      x: attackX + attackWidth / 2,
      y: attackY + attackHeight / 2,
      radius: 35,
      angle: p.facing === "right" ? 0 : Math.PI,
      color: p.comboStep === 3 ? "#ff0077" : "#00f0ff",
      alpha: 1,
      life: 0,
      maxLife: 10
    });

    // Check hit enemies
    let hitCount = 0;
    engineRef.current.enemies.forEach((enemy) => {
      if (
        attackX < enemy.x + enemy.width &&
        attackX + attackWidth > enemy.x &&
        attackY < enemy.y + enemy.height &&
        attackY + attackHeight > enemy.y
      ) {
        hitCount++;
        const isCrit = Math.random() < p.critChance;
        const damage = p.bladeDamage * (p.comboStep === 3 ? 1.8 : 1.0) * (isCrit ? 2.0 : 1.0);

        enemy.hp -= damage;
        enemy.staggerTimer = 15;
        enemy.vx = p.facing === "right" ? 6 : -6;

        addFloatingText(
          isCrit ? `CRIT! -${Math.round(damage)}` : `-${Math.round(damage)}`,
          enemy.x + enemy.width / 2,
          enemy.y,
          isCrit ? "#ffcc00" : "#ffffff"
        );

        p.ultimate = Math.min(p.maxUltimate, p.ultimate + 8);
        engineRef.current.screenShake = 6;

        if (enemy.hp <= 0) {
          audio.playExplosion();
          engineRef.current.stats.kills++;
          engineRef.current.stats.score += enemy.type === "boss" ? 3000 : 200;

          // Drop Shards
          for (let i = 0; i < (enemy.type === "boss" ? 25 : 4); i++) {
            engineRef.current.shards.push({
              id: Math.random().toString(),
              x: enemy.x + Math.random() * enemy.width,
              y: enemy.y + Math.random() * enemy.height,
              vx: (Math.random() - 0.5) * 6,
              vy: -Math.random() * 6,
              value: 10,
              color: "#00ffcc"
            });
          }
          if (enemy.type === "boss") engineRef.current.bossActive = false;
        }
      }
    });

    if (hitCount > 0) {
      engineRef.current.stats.multiplier = Math.min(8, engineRef.current.stats.multiplier + 0.2);
    }
  };

  const performUltimate = () => {
    const p = engineRef.current.player;
    if (p.ultimate < p.maxUltimate) return;
    p.ultimate = 0;
    audio.playExplosion();
    engineRef.current.screenShake = 20;

    addFloatingText("CYBER SLASH BLITZ!", p.x - 20, p.y - 40, "#ff0077");

    // Teleport slash all enemies
    engineRef.current.enemies.forEach((enemy) => {
      enemy.hp -= 220;
      createSparks(enemy.x, enemy.y, "#ff0077", 20);
      addFloatingText("BLITZ -220", enemy.x, enemy.y, "#ff0077");
    });
  };

  const createSparks = (x: number, y: number, color: string, count: number) => {
    for (let i = 0; i < count; i++) {
      engineRef.current.particles.push({
        x,
        y,
        vx: (Math.random() - 0.5) * 8,
        vy: (Math.random() - 0.5) * 8,
        radius: 2 + Math.random() * 3,
        color,
        alpha: 1,
        life: 0,
        maxLife: 20
      });
    }
  };

  const addFloatingText = (text: string, x: number, y: number, color: string) => {
    engineRef.current.floatingTexts.push({
      id: Math.random().toString(),
      text,
      x,
      y,
      color,
      alpha: 1,
      life: 0
    });
  };

  // Init Platforms
  const createPlatforms = (width: number, height: number): Platform[] => {
    return [
      { x: 0, y: height - 40, width: width, height: 40, color: "#1e1b4b" }, // Main floor
      { x: 120, y: height - 160, width: 220, height: 18, color: "#06b6d4", isPassThrough: true },
      { x: 450, y: height - 240, width: 240, height: 18, color: "#ec4899", isPassThrough: true },
      { x: 800, y: height - 160, width: 220, height: 18, color: "#06b6d4", isPassThrough: true },
      { x: 300, y: height - 350, width: 300, height: 18, color: "#a855f7", isPassThrough: true }
    ];
  };

  // Start Game
  const startGame = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const initialPlayer: PlayerState = {
      x: 100,
      y: canvas.height - 120,
      vx: 0,
      vy: 0,
      width: 32,
      height: 48,
      facing: "right",
      isGrounded: false,
      isJumping: false,
      jumpCount: 0,
      maxJumps: 2,
      isDashing: false,
      dashTimer: 0,
      dashCooldown: 0,
      maxDashCooldown: 45,
      isParrying: false,
      parryTimer: 0,
      comboStep: 0,
      comboTimer: 0,
      hp: 120,
      maxHp: 120,
      shield: 60,
      maxShield: 60,
      energy: 100,
      maxEnergy: 100,
      ultimate: 0,
      maxUltimate: 100,
      bladeDamage: 45,
      critChance: 0.15,
      invulnerableTimer: 0
    };

    const initialStats: GameStats = {
      score: 0,
      multiplier: 1,
      shards: 0,
      kills: 0,
      parries: 0,
      maxCombo: 0,
      wave: 1
    };

    engineRef.current.player = initialPlayer;
    engineRef.current.stats = initialStats;
    engineRef.current.platforms = createPlatforms(canvas.width, canvas.height);
    engineRef.current.enemies = [];
    engineRef.current.projectiles = [];
    engineRef.current.particles = [];
    engineRef.current.slashes = [];
    engineRef.current.shards = [];
    engineRef.current.floatingTexts = [];
    engineRef.current.bossActive = false;

    setGameState("playing");
    setStats(initialStats);
    setPlayerInfo(initialPlayer);
  };

  // Spawn Wave Enemies
  const spawnWaveEnemies = (width: number, height: number) => {
    const engine = engineRef.current;
    const wave = engine.stats.wave;

    // Boss wave every 5 waves
    if (wave % 5 === 0 && !engine.bossActive && engine.enemies.length === 0) {
      engine.enemies.push({
        id: "boss_" + Math.random(),
        type: "boss",
        x: width - 200,
        y: height - 140,
        vx: 0,
        vy: 0,
        width: 64,
        height: 80,
        hp: 1200 + wave * 400,
        maxHp: 1200 + wave * 400,
        facing: "left",
        color: "#ec4899",
        attackTimer: 0,
        isAttacking: false,
        state: "chase",
        staggerTimer: 0,
        jumpTimer: 0
      });
      engine.bossActive = true;
      addFloatingText("MECHA RONIN BOSS APPEARED!", width / 2 - 120, 100, "#ec4899");
      return;
    }

    if (engine.bossActive) return;

    const maxEnemies = 4 + wave * 2;
    if (engine.enemies.length >= maxEnemies) return;

    engine.spawnTimer++;
    if (engine.spawnTimer < 100) return;
    engine.spawnTimer = 0;

    const spawnX = Math.random() > 0.5 ? 50 : width - 100;
    const rand = Math.random();
    let type: Enemy["type"] = "ninja";
    let hp = 60 + wave * 15;
    let color = "#06b6d4";

    if (rand > 0.6) {
      type = "drone";
      hp = 45 + wave * 10;
      color = "#a855f7";
    } else if (rand > 0.3) {
      type = "heavy";
      hp = 140 + wave * 30;
      color = "#eab308";
    }

    engine.enemies.push({
      id: "enemy_" + Math.random(),
      type,
      x: spawnX,
      y: type === "drone" ? height - 300 : height - 100,
      vx: 0,
      vy: 0,
      width: type === "heavy" ? 48 : 32,
      height: type === "heavy" ? 56 : 48,
      hp,
      maxHp: hp,
      facing: "left",
      color,
      attackTimer: 0,
      isAttacking: false,
      state: "chase",
      staggerTimer: 0,
      jumpTimer: 0
    });
  };

  // Main Loop Effect
  useEffect(() => {
    if (gameState !== "playing") return;

    const loop = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const engine = engineRef.current;
      const { keys, player, platforms } = engine;

      // Handle Shake
      ctx.save();
      if (engine.screenShake > 0) {
        ctx.translate((Math.random() - 0.5) * engine.screenShake, (Math.random() - 0.5) * engine.screenShake);
        engine.screenShake *= 0.88;
        if (engine.screenShake < 0.5) engine.screenShake = 0;
      }

      // ------------------------------------------
      // PLAYER PHYSICS & MOVEMENT
      // ------------------------------------------
      if (player.dashCooldown > 0) player.dashCooldown--;
      if (player.parryTimer > 0) player.parryTimer--;
      if (player.invulnerableTimer > 0) player.invulnerableTimer--;

      if (player.dashTimer > 0) {
        player.dashTimer--;
        if (player.dashTimer === 0) player.isDashing = false;
      } else {
        // Normal Left/Right Controls
        const moveSpeed = 6;
        if (keys["a"] || keys["arrowleft"]) {
          player.vx = -moveSpeed;
          player.facing = "left";
        } else if (keys["d"] || keys["arrowright"]) {
          player.vx = moveSpeed;
          player.facing = "right";
        } else {
          player.vx *= 0.75;
        }

        // Apply Gravity
        player.vy += 0.65;
      }

      player.x += player.vx;
      player.y += player.vy;

      // Platform Collision Detection
      player.isGrounded = false;
      platforms.forEach((plat) => {
        if (
          player.x < plat.x + plat.width &&
          player.x + player.width > plat.x &&
          player.y + player.height >= plat.y &&
          player.y + player.height <= plat.y + plat.height + player.vy
        ) {
          player.y = plat.y - player.height;
          player.vy = 0;
          player.isGrounded = true;
          player.jumpCount = 0;
        }
      });

      // Boundaries
      player.x = Math.max(0, Math.min(canvas.width - player.width, player.x));
      if (player.y > canvas.height) {
        player.y = canvas.height - player.height;
        player.vy = 0;
        player.isGrounded = true;
        player.jumpCount = 0;
      }

      // Shield recharge
      if (player.shield < player.maxShield) {
        player.shield = Math.min(player.maxShield, player.shield + 0.05);
      }

      // Spawning
      spawnWaveEnemies(canvas.width, canvas.height);

      // ------------------------------------------
      // UPDATE ENEMIES
      // ------------------------------------------
      engine.enemies.forEach((enemy) => {
        if (enemy.staggerTimer > 0) {
          enemy.staggerTimer--;
          enemy.vx *= 0.8;
          return;
        }

        const dx = player.x - enemy.x;
        const dist = Math.abs(dx);
        enemy.facing = dx > 0 ? "right" : "left";

        if (enemy.type === "drone") {
          // Hover above player & shoot lasers
          const targetY = player.y - 120;
          enemy.vy = (targetY - enemy.y) * 0.05;
          enemy.vx = (player.x - enemy.x) * 0.03;

          enemy.attackTimer++;
          if (enemy.attackTimer > 90) {
            enemy.attackTimer = 0;
            engine.projectiles.push({
              id: Math.random().toString(),
              x: enemy.x + enemy.width / 2,
              y: enemy.y + enemy.height,
              vx: (player.x - enemy.x) * 0.02,
              vy: 6,
              radius: 4,
              isEnemy: true,
              damage: 15,
              color: "#a855f7",
              life: 120
            });
          }
        } else {
          // Ground Enemies
          const speed = enemy.type === "boss" ? 3.5 : enemy.type === "ninja" ? 3 : 1.8;
          if (dist > 40) {
            enemy.vx = enemy.facing === "right" ? speed : -speed;
          } else {
            enemy.vx = 0;
            // Attack player
            enemy.attackTimer++;
            if (enemy.attackTimer > 60) {
              enemy.attackTimer = 0;
              checkEnemyHitPlayer(enemy, 25);
            }
          }

          enemy.vy += 0.65;
          enemy.x += enemy.vx;
          enemy.y += enemy.vy;

          // Platform Collision for enemies
          platforms.forEach((plat) => {
            if (
              enemy.x < plat.x + plat.width &&
              enemy.x + enemy.width > plat.x &&
              enemy.y + enemy.height >= plat.y &&
              enemy.y + enemy.height <= plat.y + plat.height + enemy.vy
            ) {
              enemy.y = plat.y - enemy.height;
              enemy.vy = 0;
            }
          });
        }
      });

      // ------------------------------------------
      // UPDATE PROJECTILES
      // ------------------------------------------
      engine.projectiles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        p.life--;

        if (p.isEnemy) {
          // Parry / Deflect mechanism!
          if (player.isParrying) {
            const pDist = Math.hypot(p.x - (player.x + player.width / 2), p.y - (player.y + player.height / 2));
            if (pDist < 45) {
              p.isEnemy = false;
              p.reflected = true;
              p.vx = -p.vx * 2;
              p.vy = -p.vy * 2;
              p.color = "#00ffcc";
              engine.stats.parries++;
              engine.stats.score += 300;
              audio.playParry();
              addFloatingText("DEFLECTED!", p.x, p.y, "#00ffcc");
            }
          }

          // Hit player
          if (
            p.x > player.x &&
            p.x < player.x + player.width &&
            p.y > player.y &&
            p.y < player.y + player.height
          ) {
            p.life = 0;
            takeDamage(p.damage);
          }
        } else if (p.reflected) {
          // Hit enemy with reflected laser
          engine.enemies.forEach((e) => {
            if (
              p.x > e.x &&
              p.x < e.x + e.width &&
              p.y > e.y &&
              p.y < e.y + e.height
            ) {
              p.life = 0;
              e.hp -= p.damage * 2;
              addFloatingText(`REFLECT -${Math.round(p.damage * 2)}`, e.x, e.y, "#00ffcc");
            }
          });
        }
      });

      engine.projectiles = engine.projectiles.filter((p) => p.life > 0);
      engine.enemies = engine.enemies.filter((e) => e.hp > 0);

      // Shard collection
      engine.shards.forEach((s) => {
        s.x += s.vx;
        s.y += s.vy;
        s.vy += 0.3;

        const dist = Math.hypot(s.x - player.x, s.y - player.y);
        if (dist < 100) {
          s.vx += (player.x - s.x) * 0.1;
          s.vy += (player.y - s.y) * 0.1;
        }

        if (dist < 25) {
          engine.stats.shards += s.value;
          audio.playPickup();
          s.value = 0;
        }
      });
      engine.shards = engine.shards.filter((s) => s.value > 0);

      // Check Wave Complete
      if (engine.enemies.length === 0 && !engine.bossActive) {
        engine.waveTimer++;
        if (engine.waveTimer > 120) {
          engine.waveTimer = 0;
          engine.stats.wave++;
          addFloatingText(`WAVE ${engine.stats.wave} CLEARED!`, canvas.width / 2 - 80, 150, "#00ffcc");
        }
      }

      // ------------------------------------------
      // RENDER CANVAS
      // ------------------------------------------
      ctx.fillStyle = "#09090b";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Grid background
      ctx.strokeStyle = "rgba(0, 240, 255, 0.08)";
      ctx.lineWidth = 1;
      for (let x = 0; x < canvas.width; x += 40) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
      }

      // Platforms
      platforms.forEach((plat) => {
        ctx.fillStyle = plat.color || "#1e1b4b";
        ctx.shadowColor = plat.color || "#06b6d4";
        ctx.shadowBlur = 10;
        ctx.fillRect(plat.x, plat.y, plat.width, plat.height);
        ctx.shadowBlur = 0;
      });

      // Shards
      engine.shards.forEach((s) => {
        ctx.fillStyle = s.color;
        ctx.beginPath();
        ctx.arc(s.x, s.y, 4, 0, Math.PI * 2);
        ctx.fill();
      });

      // Projectiles
      engine.projectiles.forEach((p) => {
        ctx.fillStyle = p.color;
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      });

      // Enemies
      engine.enemies.forEach((enemy) => {
        ctx.fillStyle = enemy.color;
        ctx.shadowColor = enemy.color;
        ctx.shadowBlur = 12;
        ctx.fillRect(enemy.x, enemy.y, enemy.width, enemy.height);
        ctx.shadowBlur = 0;

        // Enemy HP Bar
        if (enemy.hp < enemy.maxHp) {
          const pct = Math.max(0, enemy.hp / enemy.maxHp);
          ctx.fillStyle = "#000000";
          ctx.fillRect(enemy.x, enemy.y - 10, enemy.width, 4);
          ctx.fillStyle = enemy.color;
          ctx.fillRect(enemy.x, enemy.y - 10, enemy.width * pct, 4);
        }
      });

      // Player Ninja Render
      ctx.save();
      if (player.invulnerableTimer > 0 && Math.floor(Date.now() / 50) % 2 === 0) {
        ctx.globalAlpha = 0.5;
      }

      // Shield Aura
      if (player.shield > 0) {
        ctx.strokeStyle = "#00f0ff";
        ctx.lineWidth = 2;
        ctx.shadowColor = "#00f0ff";
        ctx.shadowBlur = 12;
        ctx.strokeRect(player.x - 4, player.y - 4, player.width + 8, player.height + 8);
      }

      // Parry Stance Aura
      if (player.isParrying) {
        ctx.strokeStyle = "#00ffcc";
        ctx.lineWidth = 3;
        ctx.shadowColor = "#00ffcc";
        ctx.shadowBlur = 20;
        ctx.beginPath();
        ctx.arc(player.x + player.width / 2, player.y + player.height / 2, 35, 0, Math.PI * 2);
        ctx.stroke();
      }

      ctx.fillStyle = "#ffffff";
      ctx.shadowColor = "#ff0077";
      ctx.shadowBlur = 15;
      ctx.fillRect(player.x, player.y, player.width, player.height);
      ctx.shadowBlur = 0;
      ctx.restore();

      // Slashes
      engine.slashes.forEach((sl) => {
        ctx.strokeStyle = sl.color;
        ctx.lineWidth = 4;
        ctx.shadowColor = sl.color;
        ctx.shadowBlur = 15;
        ctx.beginPath();
        ctx.arc(sl.x, sl.y, sl.radius, sl.angle - 0.8, sl.angle + 0.8);
        ctx.stroke();
        ctx.shadowBlur = 0;
        sl.life++;
      });
      engine.slashes = engine.slashes.filter((sl) => sl.life < sl.maxLife);

      // Particles
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

      // Floating text
      engine.floatingTexts.forEach((ft) => {
        ft.y -= 1;
        ft.life++;
        ctx.fillStyle = ft.color;
        ctx.font = "bold 13px sans-serif";
        ctx.fillText(ft.text, ft.x, ft.y);
      });
      engine.floatingTexts = engine.floatingTexts.filter((ft) => ft.life < 50);

      ctx.restore();

      setPlayerInfo({ ...player });
      setStats({ ...engine.stats });

      engine.animFrameId = requestAnimationFrame(loop);
    };

    const checkEnemyHitPlayer = (enemy: Enemy, dmg: number) => {
      const p = engineRef.current.player;
      if (
        p.x < enemy.x + enemy.width &&
        p.x + p.width > enemy.x &&
        p.y < enemy.y + enemy.height &&
        p.y + p.height > enemy.y
      ) {
        takeDamage(dmg);
      }
    };

    const takeDamage = (dmg: number) => {
      const p = engineRef.current.player;
      if (p.invulnerableTimer > 0 || p.isDashing) return;

      let rem = dmg;
      if (p.shield > 0) {
        if (p.shield >= rem) {
          p.shield -= rem;
          rem = 0;
        } else {
          rem -= p.shield;
          p.shield = 0;
        }
      }
      if (rem > 0) {
        p.hp = Math.max(0, p.hp - rem);
      }

      p.invulnerableTimer = 30;
      engineRef.current.screenShake = 12;

      if (p.hp <= 0) {
        setGameState("gameover");
        if (engineRef.current.stats.score > highScore) {
          setHighScore(engineRef.current.stats.score);
          if (typeof window !== "undefined") {
            localStorage.setItem("neon_ronin_highscore", engineRef.current.stats.score.toString());
          }
        }
      }
    };

    engineRef.current.animFrameId = requestAnimationFrame(loop);

    return () => cancelAnimationFrame(engineRef.current.animFrameId);
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

  const buyUpgrade = (key: keyof typeof upgrades) => {
    const item = upgrades[key];
    if (stats.shards >= item.cost) {
      setStats((prev) => ({ ...prev, shards: prev.shards - item.cost }));
      engineRef.current.stats.shards -= item.cost;

      setUpgrades((prev) => ({
        ...prev,
        [key]: { ...item, level: item.level + 1, cost: Math.round(item.cost * 1.5) }
      }));

      const p = engineRef.current.player;
      if (key === "bladeDamage") p.bladeDamage *= 1.25;
      else if (key === "maxShield") { p.maxShield += 30; p.shield += 30; }
      else if (key === "maxHp") { p.maxHp += 30; p.hp += 30; }
      else if (key === "dashRate") p.maxDashCooldown = Math.max(20, p.maxDashCooldown * 0.8);
      else if (key === "critMastery") p.critChance += 0.15;

      audio.playPickup();
    }
  };

  return (
    <div className="relative w-full h-screen bg-black overflow-hidden select-none font-sans text-white">
      {/* CANVAS */}
      <div className="absolute inset-0 w-full h-full">
        <canvas ref={canvasRef} className="w-full h-full block cursor-crosshair" />
      </div>

      {/* HUD OVERLAY */}
      {gameState === "playing" && (
        <div className="absolute inset-0 pointer-events-none p-6 flex flex-col justify-between z-10">
          <div className="flex justify-between items-start">
            <div className="flex flex-col gap-2 bg-black/70 backdrop-blur-md p-4 rounded-2xl border border-cyan-500/30 w-72 pointer-events-auto shadow-[0_0_20px_rgba(0,240,255,0.15)]">
              <div>
                <div className="flex justify-between text-xs font-bold text-cyan-400 mb-1 uppercase tracking-wider">
                  <span>Cybernetic HP</span>
                  <span>{Math.round(playerInfo.hp)} / {playerInfo.maxHp}</span>
                </div>
                <div className="w-full h-3 bg-zinc-900 rounded-full overflow-hidden border border-cyan-500/20">
                  <div
                    className="h-full bg-gradient-to-r from-red-600 to-rose-500 transition-all duration-200"
                    style={{ width: `${Math.max(0, (playerInfo.hp / playerInfo.maxHp) * 100)}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-bold text-cyan-300 mb-1 uppercase tracking-wider">
                  <span>Plasma Shield</span>
                  <span>{Math.round(playerInfo.shield)} / {playerInfo.maxShield}</span>
                </div>
                <div className="w-full h-2.5 bg-zinc-900 rounded-full overflow-hidden border border-cyan-500/20">
                  <div
                    className="h-full bg-gradient-to-r from-cyan-500 to-blue-400 transition-all duration-200"
                    style={{ width: `${Math.max(0, (playerInfo.shield / playerInfo.maxShield) * 100)}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-bold text-pink-400 mb-1 uppercase tracking-wider">
                  <span>Cyber Blitz Ultimate (Q/U)</span>
                  <span>{Math.round(playerInfo.ultimate)}%</span>
                </div>
                <div className="w-full h-2.5 bg-zinc-900 rounded-full overflow-hidden border border-pink-500/20">
                  <div
                    className="h-full bg-gradient-to-r from-pink-600 to-rose-400 transition-all duration-200"
                    style={{ width: `${(playerInfo.ultimate / playerInfo.maxUltimate) * 100}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Score info */}
            <div className="flex flex-col items-center bg-black/70 backdrop-blur-md px-8 py-3 rounded-2xl border border-cyan-500/30">
              <span className="text-xs uppercase tracking-widest text-cyan-400 font-bold">WAVE {stats.wave}</span>
              <span className="text-4xl font-black tracking-wider text-white">{stats.score}</span>
              <div className="flex items-center gap-4 mt-1 text-sm font-semibold text-zinc-300">
                <span>PARRIES: <strong className="text-cyan-300">{stats.parries}</strong></span>
                <span>SHARDS: <strong className="text-emerald-400">{stats.shards}</strong></span>
              </div>
            </div>

            {/* Controls Header */}
            <div className="flex items-center gap-3 pointer-events-auto">
              <button
                onClick={() => setGameState("shop")}
                className="p-3 bg-cyan-600/20 hover:bg-cyan-600/40 border border-cyan-500/40 rounded-xl backdrop-blur-md transition-all flex items-center gap-2 font-bold text-xs uppercase"
              >
                <ShoppingBag className="w-4 h-4 text-cyan-400" /> Cyberware Shop
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

          {/* Bottom Bar Controls Legend */}
          <div className="flex justify-between items-end">
            <div className="flex gap-4 pointer-events-auto">
              <div className="bg-black/70 backdrop-blur-md p-3 rounded-xl border border-cyan-500/30 text-xs font-bold text-cyan-300">
                WASD / Arrows: Move & Jump
              </div>
              <div className="bg-black/70 backdrop-blur-md p-3 rounded-xl border border-pink-500/30 text-xs font-bold text-pink-300">
                J / Z: Katana Attack
              </div>
              <div className="bg-black/70 backdrop-blur-md p-3 rounded-xl border border-emerald-500/30 text-xs font-bold text-emerald-300">
                K / C: Parry Laser Stance
              </div>
              <div className="bg-black/70 backdrop-blur-md p-3 rounded-xl border border-purple-500/30 text-xs font-bold text-purple-300">
                L / SHIFT: Cyber Dash
              </div>
            </div>
          </div>
        </div>
      )}

      {/* START MENU */}
      {gameState === "menu" && (
        <div className="absolute inset-0 z-30 bg-gradient-to-br from-black via-zinc-950 to-pink-950 flex flex-col items-center justify-center p-6">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="max-w-2xl w-full bg-black/70 backdrop-blur-2xl border border-pink-500/30 rounded-3xl p-8 md:p-10 shadow-[0_0_50px_rgba(236,72,153,0.15)] text-center flex flex-col items-center"
          >
            <div className="w-16 h-16 rounded-2xl bg-pink-500/10 border border-pink-400/40 flex items-center justify-center mb-6 shadow-[0_0_25px_rgba(236,72,153,0.3)]">
              <Swords className="w-8 h-8 text-pink-400 animate-pulse" />
            </div>

            <h1 className="text-4xl md:text-6xl font-black tracking-tighter uppercase mb-2 bg-gradient-to-r from-cyan-400 via-pink-400 to-rose-500 bg-clip-text text-transparent">
              Neon Ronin 2099
            </h1>
            <p className="text-zinc-400 text-sm md:text-base font-medium mb-8 max-w-md">
              Slice through rogue cyber ninjas, deflect incoming plasma bursts, and unleash Cyber Blitz in 2D platforming action.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 w-full">
              <button
                onClick={startGame}
                className="flex-1 py-4 bg-gradient-to-r from-pink-500 to-rose-600 text-white font-black uppercase tracking-widest rounded-2xl hover:scale-105 transition-all flex items-center justify-center gap-2 shadow-[0_0_30px_rgba(236,72,153,0.4)]"
              >
                <Play className="w-5 h-5 fill-white" /> Start Cyber Hunt
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

      {/* SHOP MODAL */}
      <AnimatePresence>
        {gameState === "shop" && (
          <div className="absolute inset-0 z-30 bg-black/80 backdrop-blur-xl flex items-center justify-center p-6">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="max-w-3xl w-full bg-zinc-950 border border-pink-500/30 rounded-3xl p-8 shadow-2xl"
            >
              <div className="flex justify-between items-center mb-6 pb-4 border-b border-white/10">
                <div>
                  <h2 className="text-2xl font-black uppercase tracking-wider text-pink-400">Cyberware Shop</h2>
                  <p className="text-xs text-zinc-400 mt-1">Upgrade your katana blade, shield matrix, and dash thrusters.</p>
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
                      <div className="text-xs text-pink-400 font-semibold">Level {item.level}</div>
                    </div>
                    <button
                      onClick={() => buyUpgrade(key as any)}
                      disabled={stats.shards < item.cost}
                      className={`px-4 py-2 rounded-xl font-bold text-xs uppercase tracking-wider transition-all ${stats.shards >= item.cost ? "bg-pink-500 text-white hover:bg-pink-400" : "bg-zinc-800 text-zinc-500 cursor-not-allowed"}`}
                    >
                      Buy ({item.cost})
                    </button>
                  </div>
                ))}
              </div>

              <div className="flex justify-end">
                <button
                  onClick={() => setGameState("playing")}
                  className="px-8 py-3.5 bg-pink-500 text-white font-black uppercase tracking-widest rounded-xl hover:bg-pink-400 transition-all"
                >
                  Resume Mission
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* PAUSE MODAL */}
      {gameState === "paused" && (
        <div className="absolute inset-0 z-30 bg-black/80 backdrop-blur-md flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-zinc-950 border border-white/20 rounded-3xl p-8 text-center flex flex-col items-center">
            <h2 className="text-3xl font-black uppercase tracking-wider text-pink-400 mb-6">Mission Paused</h2>
            <div className="flex flex-col gap-3 w-full">
              <button
                onClick={() => setGameState("playing")}
                className="py-3.5 bg-pink-500 text-white font-black uppercase tracking-wider rounded-xl hover:bg-pink-400 transition-all"
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

      {/* GAME OVER MODAL */}
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

            <h2 className="text-3xl font-black uppercase tracking-wider text-rose-500 mb-1">Ronin Defeated</h2>
            <p className="text-xs text-zinc-400 mb-6">Fallen in Cyber Wave {stats.wave}.</p>

            <div className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 space-y-2 mb-6 text-sm">
              <div className="flex justify-between text-zinc-300"><span>Final Score:</span><strong className="text-pink-400">{stats.score}</strong></div>
              <div className="flex justify-between text-zinc-300"><span>Wave Reached:</span><strong className="text-white">{stats.wave}</strong></div>
              <div className="flex justify-between text-zinc-300"><span>Hostiles Sliced:</span><strong className="text-rose-400">{stats.kills}</strong></div>
              <div className="flex justify-between text-zinc-300"><span>Lasers Deflected:</span><strong className="text-cyan-400">{stats.parries}</strong></div>
            </div>

            <div className="flex gap-3 w-full">
              <button
                onClick={startGame}
                className="flex-1 py-4 bg-pink-500 text-white font-black uppercase tracking-wider rounded-2xl hover:bg-pink-400 transition-all flex items-center justify-center gap-2"
              >
                <RotateCcw className="w-4 h-4" /> Re-Engage
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
