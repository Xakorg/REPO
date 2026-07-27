"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Gamepad2,
  Trophy,
  Shield,
  Zap,
  RotateCcw,
  Volume2,
  VolumeX,
  ShoppingBag,
  Sparkles,
  Pause,
  ArrowLeft,
  Crosshair,
  Flame,
  Swords,
  Heart,
  Award,
  Play,
  Settings,
  ChevronRight,
  Target
} from "lucide-react";
import { cn } from "@/lib/utils";

// --- PROCEDURAL WEB AUDIO SYNTHESIZER ---
class StickSoundFX {
  ctx: AudioContext | null = null;
  muted: boolean = false;

  init() {
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

  playSwing() {
    if (this.muted || !this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(400, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(100, this.ctx.currentTime + 0.1);

      gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.1);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.1);
    } catch {}
  }

  playHit() {
    if (this.muted || !this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(180, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(40, this.ctx.currentTime + 0.15);

      gain.gain.setValueAtTime(0.3, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.15);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.15);
    } catch {}
  }

  playLaser() {
    if (this.muted || !this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(900, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(150, this.ctx.currentTime + 0.12);

      gain.gain.setValueAtTime(0.15, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.12);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.12);
    } catch {}
  }

  playExplosion() {
    if (this.muted || !this.ctx) return;
    try {
      const duration = 0.35;
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
      filter.frequency.setValueAtTime(600, this.ctx.currentTime);
      filter.frequency.linearRampToValueAtTime(40, this.ctx.currentTime + duration);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.35, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + duration);

      whiteNoise.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);

      whiteNoise.start();
      whiteNoise.stop(this.ctx.currentTime + duration);
    } catch {}
  }

  playPowerup() {
    if (this.muted || !this.ctx) return;
    try {
      const notes = [261.63, 329.63, 392.0, 523.25];
      notes.forEach((freq, i) => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime + i * 0.06);

        gain.gain.setValueAtTime(0.15, this.ctx.currentTime + i * 0.06);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + i * 0.06 + 0.12);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(this.ctx.currentTime + i * 0.06);
        osc.stop(this.ctx.currentTime + i * 0.06 + 0.12);
      });
    } catch {}
  }
}

const sfx = new StickSoundFX();

// --- GAME DATA INTERFACES & TYPES ---
type WeaponType = "katana" | "dual_blasters" | "rocket_launcher" | "cyber_scythe";

interface WeaponInfo {
  name: string;
  type: WeaponType;
  damage: number;
  attackSpeed: number; // attack interval in ms
  range: number;
  color: string;
  description: string;
}

const WEAPONS: Record<WeaponType, WeaponInfo> = {
  katana: {
    name: "Cyber Katana",
    type: "katana",
    damage: 35,
    attackSpeed: 250,
    range: 70,
    color: "#00f0ff",
    description: "Lightning-fast melee slashes with razor precision."
  },
  dual_blasters: {
    name: "Dual Plasma Guns",
    type: "dual_blasters",
    damage: 22,
    attackSpeed: 180,
    range: 450,
    color: "#ff007f",
    description: "Rapid high-velocity plasma projectiles."
  },
  rocket_launcher: {
    name: "Quantum Cannon",
    type: "rocket_launcher",
    damage: 90,
    attackSpeed: 800,
    range: 550,
    color: "#ffaa00",
    description: "Heavy explosive rockets with massive shockwave AOE."
  },
  cyber_scythe: {
    name: "Void Scythe",
    type: "cyber_scythe",
    damage: 55,
    attackSpeed: 380,
    range: 95,
    color: "#a855f7",
    description: "Wide spinning arc of death with high critical chance."
  }
};

interface StickSkin {
  id: string;
  name: string;
  color: string;
  auraColor: string;
  cost: number;
}

const SKINS: StickSkin[] = [
  { id: "cyan", name: "Neon Cyber", color: "#00f0ff", auraColor: "rgba(0, 240, 255, 0.4)", cost: 0 },
  { id: "crimson", name: "Blood Shadow", color: "#ff2a5f", auraColor: "rgba(255, 42, 95, 0.4)", cost: 150 },
  { id: "gold", name: "Golden Emperor", color: "#ffd700", auraColor: "rgba(255, 215, 0, 0.5)", cost: 300 },
  { id: "emerald", name: "Jade Assassin", color: "#10b981", auraColor: "rgba(16, 185, 129, 0.4)", cost: 450 },
  { id: "violet", name: "Void Lord", color: "#8b5cf6", auraColor: "rgba(139, 92, 246, 0.5)", cost: 600 }
];

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  life: number;
  maxLife: number;
  shape?: "circle" | "spark" | "text";
  text?: string;
}

interface Projectile {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
  damage: number;
  isPlayer: boolean;
  isRocket?: boolean;
}

interface StickEntity {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  width: number;
  height: number;
  health: number;
  maxHealth: number;
  color: string;
  facing: 1 | -1; // 1 = right, -1 = left
  isGrounded: boolean;
  weapon: WeaponType;
  lastAttackTime: number;
  animFrame: number;
  isAttacking: boolean;
  attackAnimTimer: number;
  isHit: boolean;
  hitTimer: number;
  isBoss?: boolean;
  type?: "runner" | "brute" | "gunner" | "boss";
}

export default function SuperStickBattles() {
  // --- STATE MANAGEMENT ---
  const [gameState, setGameState] = useState<"menu" | "playing" | "paused" | "gameover" | "victory" | "shop">("menu");
  const [gameMode, setGameMode] = useState<"survival" | "duel">("survival");
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [wave, setWave] = useState(1);
  const [coins, setCoins] = useState(200);
  const [selectedSkin, setSelectedSkin] = useState<StickSkin>(SKINS[0]);
  const [unlockedSkins, setUnlockedSkins] = useState<string[]>(["cyan"]);
  const [selectedWeapon, setSelectedWeapon] = useState<WeaponType>("katana");
  const [rageMeter, setRageMeter] = useState(0); // 0 to 100
  const [combo, setCombo] = useState(0);
  const [comboTimer, setComboTimer] = useState(0);
  const [isMuted, setIsMuted] = useState(false);

  // Upgrades
  const [upgradeDamageLevel, setUpgradeDamageLevel] = useState(1);
  const [upgradeHealthLevel, setUpgradeHealthLevel] = useState(1);
  const [upgradeSpeedLevel, setUpgradeSpeedLevel] = useState(1);

  // Canvas & Loop references
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameId = useRef<number | null>(null);

  // Game Engine Entities
  const playerRef = useRef<StickEntity>({
    id: "player",
    x: 200,
    y: 400,
    vx: 0,
    vy: 0,
    width: 30,
    height: 70,
    health: 100,
    maxHealth: 100,
    color: SKINS[0].color,
    facing: 1,
    isGrounded: false,
    weapon: "katana",
    lastAttackTime: 0,
    animFrame: 0,
    isAttacking: false,
    attackAnimTimer: 0,
    isHit: false,
    hitTimer: 0
  });

  const enemiesRef = useRef<StickEntity[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const projectilesRef = useRef<Projectile[]>([]);
  const keysRef = useRef<Record<string, boolean>>({});
  const screenShakeRef = useRef(0);

  // Sync high score & saved coins
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedHs = localStorage.getItem("stick_high_score");
      if (savedHs) setHighScore(parseInt(savedHs, 10));
      const savedCoins = localStorage.getItem("stick_coins");
      if (savedCoins) setCoins(parseInt(savedCoins, 10));
    }
  }, []);

  const saveCoins = (newCoins: number) => {
    setCoins(newCoins);
    if (typeof window !== "undefined") {
      localStorage.setItem("stick_coins", newCoins.toString());
    }
  };

  // Keyboard Event Listeners
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      keysRef.current[e.code] = true;
      sfx.init();

      if (e.code === "KeyP" || e.code === "Escape") {
        if (gameState === "playing") setGameState("paused");
        else if (gameState === "paused") setGameState("playing");
      }

      if (gameState === "playing") {
        // Weapon Switch hotkeys 1-4
        if (e.code === "Digit1") setSelectedWeapon("katana");
        if (e.code === "Digit2") setSelectedWeapon("dual_blasters");
        if (e.code === "Digit3") setSelectedWeapon("rocket_launcher");
        if (e.code === "Digit4") setSelectedWeapon("cyber_scythe");

        // Rage / Ultimate Unleash (Key Q)
        if (e.code === "KeyQ" && rageMeter >= 100) {
          triggerUltimateAbility();
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      keysRef.current[e.code] = false;
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [gameState, rageMeter]);

  // Trigger Ultimate Rage Ability
  const triggerUltimateAbility = () => {
    setRageMeter(0);
    screenShakeRef.current = 25;
    sfx.playExplosion();
    const player = playerRef.current;

    // Create huge energy shockwave particles
    for (let i = 0; i < 60; i++) {
      const angle = (Math.PI * 2 * i) / 60;
      const speed = 12 + Math.random() * 8;
      particlesRef.current.push({
        x: player.x,
        y: player.y - 30,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: 6 + Math.random() * 6,
        color: selectedSkin.color,
        life: 1,
        maxLife: 40 + Math.random() * 20
      });
    }

    // Damage all enemies on screen
    enemiesRef.current.forEach(enemy => {
      enemy.health -= 120 * upgradeDamageLevel;
      enemy.isHit = true;
      enemy.hitTimer = 15;
      enemy.vy = -12;
      enemy.vx = enemy.x > player.x ? 15 : -15;

      particlesRef.current.push({
        x: enemy.x,
        y: enemy.y - 40,
        vx: 0,
        vy: -2,
        size: 18,
        color: "#ffff00",
        life: 1,
        maxLife: 30,
        shape: "text",
        text: "ULTIMATE 120!"
      });
    });
  };

  // Start / Restart Game Session
  const startGame = (mode: "survival" | "duel" = "survival") => {
    sfx.init();
    setGameMode(mode);
    setScore(0);
    setWave(1);
    setRageMeter(0);
    setCombo(0);

    const baseHealth = 100 + (upgradeHealthLevel - 1) * 25;

    playerRef.current = {
      id: "player",
      x: 300,
      y: 400,
      vx: 0,
      vy: 0,
      width: 30,
      height: 70,
      health: baseHealth,
      maxHealth: baseHealth,
      color: selectedSkin.color,
      facing: 1,
      isGrounded: false,
      weapon: selectedWeapon,
      lastAttackTime: 0,
      animFrame: 0,
      isAttacking: false,
      attackAnimTimer: 0,
      isHit: false,
      hitTimer: 0
    };

    enemiesRef.current = [];
    particlesRef.current = [];
    projectilesRef.current = [];

    spawnEnemyWave(1, mode);
    setGameState("playing");
  };

  // Spawn Enemy Waves
  const spawnEnemyWave = (waveNum: number, mode: "survival" | "duel") => {
    const enemyCount = mode === "duel" ? 1 : Math.min(3 + waveNum * 2, 16);
    const newEnemies: StickEntity[] = [];

    const types: ("runner" | "brute" | "gunner")[] = ["runner", "brute", "gunner"];

    for (let i = 0; i < enemyCount; i++) {
      const isBoss = mode === "survival" && waveNum % 5 === 0 && i === 0;
      const type = isBoss ? "boss" : types[i % types.length];
      const spawnX = Math.random() > 0.5 ? -100 - i * 60 : 1300 + i * 60;
      const hp = isBoss ? 350 + waveNum * 50 : 40 + waveNum * 15;

      newEnemies.push({
        id: `enemy_${Date.now()}_${i}`,
        x: spawnX,
        y: 400,
        vx: 0,
        vy: 0,
        width: isBoss ? 45 : 30,
        height: isBoss ? 95 : 70,
        health: hp,
        maxHealth: hp,
        color: isBoss ? "#ff0055" : type === "brute" ? "#ff5500" : type === "gunner" ? "#aa00ff" : "#00ffaa",
        facing: spawnX < 600 ? 1 : -1,
        isGrounded: false,
        weapon: type === "gunner" ? "dual_blasters" : isBoss ? "cyber_scythe" : "katana",
        lastAttackTime: 0,
        animFrame: 0,
        isAttacking: false,
        attackAnimTimer: 0,
        isHit: false,
        hitTimer: 0,
        isBoss,
        type
      });
    }

    enemiesRef.current = newEnemies;
  };

  // MAIN GAME LOOP (Canvas Render & Physics Step)
  useEffect(() => {
    if (gameState !== "playing") return;

    let lastTimestamp = performance.now();

    const loop = (timestamp: number) => {
      const dt = Math.min((timestamp - lastTimestamp) / 1000, 0.05);
      lastTimestamp = timestamp;

      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext("2d");
        if (ctx) {
          updatePhysics(dt);
          renderGame(ctx, canvas.width, canvas.height);
        }
      }

      animFrameId.current = requestAnimationFrame(loop);
    };

    animFrameId.current = requestAnimationFrame(loop);
    return () => {
      if (animFrameId.current) cancelAnimationFrame(animFrameId.current);
    };
  }, [gameState, selectedWeapon, upgradeDamageLevel, upgradeSpeedLevel]);

  // Update Physics, AI, Projectiles, Particles
  const updatePhysics = (dt: number) => {
    const player = playerRef.current;
    const keys = keysRef.current;
    const moveSpeed = (350 + (upgradeSpeedLevel - 1) * 30) * dt;

    // Player Horizontal Movement
    if (keys["KeyA"] || keys["ArrowLeft"]) {
      player.vx = -moveSpeed;
      player.facing = -1;
    } else if (keys["KeyD"] || keys["ArrowRight"]) {
      player.vx = moveSpeed;
      player.facing = 1;
    } else {
      player.vx *= 0.8;
    }

    // Player Jump (W / Space / Up Arrow)
    if ((keys["KeyW"] || keys["Space"] || keys["ArrowUp"]) && player.isGrounded) {
      player.vy = -580;
      player.isGrounded = false;
      sfx.playSwing();
      // Jump particles
      for (let i = 0; i < 8; i++) {
        particlesRef.current.push({
          x: player.x,
          y: player.y,
          vx: (Math.random() - 0.5) * 100,
          vy: Math.random() * 50,
          size: 4,
          color: selectedSkin.color,
          life: 1,
          maxLife: 20
        });
      }
    }

    // Gravity
    player.vy += 1200 * dt;
    player.x += player.vx;
    player.y += player.vy * dt;

    // Platform Ground Collisions (Floor at y = 480)
    const floorY = 480;
    if (player.y >= floorY) {
      player.y = floorY;
      player.vy = 0;
      player.isGrounded = true;
    }

    // Canvas Bounds
    player.x = Math.max(40, Math.min(1160, player.x));

    // Player Attack Handling (Key J / Enter / Left Click)
    const weaponInfo = WEAPONS[selectedWeapon];
    const attackInterval = weaponInfo.attackSpeed / upgradeSpeedLevel;
    const now = Date.now();

    if ((keys["KeyJ"] || keys["Enter"] || keys["KeyK"]) && now - player.lastAttackTime > attackInterval) {
      player.lastAttackTime = now;
      player.isAttacking = true;
      player.attackAnimTimer = 12;

      performPlayerAttack(player, weaponInfo);
    }

    if (player.attackAnimTimer > 0) player.attackAnimTimer--;
    if (player.hitTimer > 0) player.hitTimer--;

    // Update Enemies AI & Physics
    enemiesRef.current.forEach(enemy => {
      // Enemy Movement towards player
      const dirX = player.x > enemy.x ? 1 : -1;
      enemy.facing = dirX as 1 | -1;
      const speed = enemy.isBoss ? 160 : enemy.type === "runner" ? 240 : 180;

      const distToPlayer = Math.abs(player.x - enemy.x);

      if (distToPlayer > 50) {
        enemy.vx = dirX * speed * dt;
      } else {
        enemy.vx *= 0.8;
      }

      enemy.vy += 1200 * dt;
      enemy.x += enemy.vx;
      enemy.y += enemy.vy * dt;

      if (enemy.y >= floorY) {
        enemy.y = floorY;
        enemy.vy = 0;
        enemy.isGrounded = true;
      }

      // Enemy Attack Logic
      if (distToPlayer < 75 && now - enemy.lastAttackTime > 900) {
        enemy.lastAttackTime = now;
        enemy.isAttacking = true;
        enemy.attackAnimTimer = 10;

        // Damage Player
        if (Math.abs(player.y - enemy.y) < 50) {
          const dmg = (enemy.isBoss ? 25 : 10) + wave * 2;
          player.health -= dmg;
          player.isHit = true;
          player.hitTimer = 10;
          screenShakeRef.current = 8;
          sfx.playHit();

          // Damage indicator particle
          particlesRef.current.push({
            x: player.x,
            y: player.y - 40,
            vx: (Math.random() - 0.5) * 50,
            vy: -80,
            size: 14,
            color: "#ff2a5f",
            life: 1,
            maxLife: 25,
            shape: "text",
            text: `-${dmg}`
          });

          if (player.health <= 0) {
            handleGameOver();
          }
        }
      }

      if (enemy.attackAnimTimer > 0) enemy.attackAnimTimer--;
      if (enemy.hitTimer > 0) enemy.hitTimer--;
    });

    // Update Projectiles
    projectilesRef.current.forEach(p => {
      p.x += p.vx * dt;
      p.y += p.vy * dt;

      // Rocket particles trail
      if (p.isRocket) {
        particlesRef.current.push({
          x: p.x,
          y: p.y,
          vx: (Math.random() - 0.5) * 30,
          vy: (Math.random() - 0.5) * 30,
          size: 5,
          color: "#ff6600",
          life: 1,
          maxLife: 15
        });
      }

      // Check collision with enemies (if player projectile)
      if (p.isPlayer) {
        enemiesRef.current.forEach(enemy => {
          if (
            p.x > enemy.x - enemy.width &&
            p.x < enemy.x + enemy.width &&
            p.y > enemy.y - enemy.height &&
            p.y < enemy.y
          ) {
            enemy.health -= p.damage;
            enemy.isHit = true;
            enemy.hitTimer = 10;
            p.radius = 0; // Destroy projectile

            sfx.playHit();
            increaseCombo();

            if (p.isRocket) {
              sfx.playExplosion();
              screenShakeRef.current = 12;
            }

            // Hit Particles
            for (let k = 0; k < (p.isRocket ? 25 : 8); k++) {
              particlesRef.current.push({
                x: p.x,
                y: p.y,
                vx: (Math.random() - 0.5) * 200,
                vy: (Math.random() - 0.5) * 200,
                size: 3 + Math.random() * 4,
                color: p.color,
                life: 1,
                maxLife: 20
              });
            }

            // Floating Damage Number
            particlesRef.current.push({
              x: enemy.x,
              y: enemy.y - 35,
              vx: (Math.random() - 0.5) * 40,
              vy: -60,
              size: 14,
              color: p.isRocket ? "#ffaa00" : "#00f0ff",
              life: 1,
              maxLife: 25,
              shape: "text",
              text: `${Math.round(p.damage)}`
            });
          }
        });
      }
    });

    // Remove Out-of-bounds/dead projectiles
    projectilesRef.current = projectilesRef.current.filter(p => p.radius > 0 && p.x > 0 && p.x < 1200);

    // Remove Dead Enemies & Grant Score/Coins
    enemiesRef.current = enemiesRef.current.filter(enemy => {
      if (enemy.health <= 0) {
        const rewardCoins = enemy.isBoss ? 100 : 15;
        const rewardScore = enemy.isBoss ? 500 : 50;

        setScore(prev => prev + rewardScore);
        saveCoins(coins + rewardCoins);
        setRageMeter(prev => Math.min(100, prev + (enemy.isBoss ? 40 : 15)));

        sfx.playExplosion();

        // Death Particle Explosion
        for (let i = 0; i < (enemy.isBoss ? 50 : 20); i++) {
          particlesRef.current.push({
            x: enemy.x,
            y: enemy.y - 30,
            vx: (Math.random() - 0.5) * 300,
            vy: (Math.random() - 0.5) * 300,
            size: 4 + Math.random() * 5,
            color: enemy.color,
            life: 1,
            maxLife: 35
          });
        }
        return false;
      }
      return true;
    });

    // Next Wave Check
    if (enemiesRef.current.length === 0) {
      if (gameMode === "duel") {
        setGameState("victory");
      } else {
        const nextW = wave + 1;
        setWave(nextW);
        sfx.playPowerup();
        spawnEnemyWave(nextW, "survival");
      }
    }

    // Update Particles
    particlesRef.current.forEach(pt => {
      pt.x += pt.vx * dt;
      pt.y += pt.vy * dt;
      pt.life -= 1 / pt.maxLife;
    });
    particlesRef.current = particlesRef.current.filter(pt => pt.life > 0);

    // Screen Shake Decay
    if (screenShakeRef.current > 0) {
      screenShakeRef.current *= 0.85;
      if (screenShakeRef.current < 0.5) screenShakeRef.current = 0;
    }
  };

  // Perform Player Attack Actions
  const performPlayerAttack = (player: StickEntity, weapon: WeaponInfo) => {
    const dmg = weapon.damage * upgradeDamageLevel;

    if (weapon.type === "katana" || weapon.type === "cyber_scythe") {
      sfx.playSwing();
      // Melee Swing Hit Detection
      enemiesRef.current.forEach(enemy => {
        const inRange =
          player.facing === 1
            ? enemy.x >= player.x && enemy.x <= player.x + weapon.range
            : enemy.x <= player.x && enemy.x >= player.x - weapon.range;

        if (inRange && Math.abs(enemy.y - player.y) < 60) {
          enemy.health -= dmg;
          enemy.isHit = true;
          enemy.hitTimer = 10;
          enemy.vx = player.facing * 150;
          enemy.vy = -100;

          sfx.playHit();
          increaseCombo();
          setRageMeter(r => Math.min(100, r + 5));

          // Slash Spark Particles
          for (let i = 0; i < 10; i++) {
            particlesRef.current.push({
              x: enemy.x,
              y: enemy.y - 30,
              vx: (Math.random() - 0.5) * 200,
              vy: (Math.random() - 0.5) * 200,
              size: 3 + Math.random() * 4,
              color: weapon.color,
              life: 1,
              maxLife: 20
            });
          }

          particlesRef.current.push({
            x: enemy.x,
            y: enemy.y - 45,
            vx: 0,
            vy: -40,
            size: 14,
            color: weapon.color,
            life: 1,
            maxLife: 25,
            shape: "text",
            text: `${Math.round(dmg)}`
          });
        }
      });
    } else if (weapon.type === "dual_blasters") {
      sfx.playLaser();
      projectilesRef.current.push({
        x: player.x + player.facing * 20,
        y: player.y - 42,
        vx: player.facing * 900,
        vy: (Math.random() - 0.5) * 40,
        radius: 4,
        color: weapon.color,
        damage: dmg,
        isPlayer: true
      });
    } else if (weapon.type === "rocket_launcher") {
      sfx.playExplosion();
      projectilesRef.current.push({
        x: player.x + player.facing * 25,
        y: player.y - 40,
        vx: player.facing * 600,
        vy: -20,
        radius: 8,
        color: weapon.color,
        damage: dmg,
        isPlayer: true,
        isRocket: true
      });
    }
  };

  const increaseCombo = () => {
    setCombo(prev => prev + 1);
    setComboTimer(60); // reset combo decay
  };

  const handleGameOver = () => {
    setGameState("gameover");
    sfx.playExplosion();
    if (score > highScore) {
      setHighScore(score);
      if (typeof window !== "undefined") {
        localStorage.setItem("stick_high_score", score.toString());
      }
    }
  };

  // --- RENDERING CANVAS ENGINE ---
  const renderGame = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    ctx.save();

    // Handle Screen Shake
    if (screenShakeRef.current > 0) {
      const shakeX = (Math.random() - 0.5) * screenShakeRef.current;
      const shakeY = (Math.random() - 0.5) * screenShakeRef.current;
      ctx.translate(shakeX, shakeY);
    }

    // 1. Cyberpunk Synthwave Background Grid
    ctx.fillStyle = "#080812";
    ctx.fillRect(0, 0, width, height);

    // Neon Horizon Grid Lines
    ctx.strokeStyle = "rgba(0, 240, 255, 0.15)";
    ctx.lineWidth = 1;

    for (let x = 0; x < width; x += 60) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }

    for (let y = 0; y < height; y += 40) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    // Ground Platform
    ctx.fillStyle = "#121226";
    ctx.fillRect(0, 480, width, height - 480);
    ctx.strokeStyle = "#00f0ff";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(0, 480);
    ctx.lineTo(width, 480);
    ctx.stroke();

    // 2. Render Projectiles
    projectilesRef.current.forEach(p => {
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.isRocket ? 7 : 4, 0, Math.PI * 2);
      ctx.fill();

      // Glow effect
      ctx.shadowColor = p.color;
      ctx.shadowBlur = 12;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.isRocket ? 7 : 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
    });

    // 3. Render Enemies Stick Figures
    enemiesRef.current.forEach(enemy => {
      drawStickFigure(ctx, enemy);
    });

    // 4. Render Player Stick Figure
    const player = playerRef.current;
    drawStickFigure(ctx, player, selectedSkin.auraColor);

    // 5. Render Particles & Floating Damage Numbers
    particlesRef.current.forEach(pt => {
      ctx.globalAlpha = pt.life;
      if (pt.shape === "text" && pt.text) {
        ctx.font = "900 16px sans-serif";
        ctx.fillStyle = pt.color;
        ctx.fillText(pt.text, pt.x, pt.y);
      } else {
        ctx.fillStyle = pt.color;
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, pt.size, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    });

    ctx.restore();
  };

  // Helper: Draw Stick Figure with Bone Joints & Weapon Slashes
  const drawStickFigure = (ctx: CanvasRenderingContext2D, entity: StickEntity, auraColor?: string) => {
    ctx.save();
    const { x, y, facing, color, height, isHit, weapon, isAttacking, health, maxHealth, isBoss } = entity;

    // Hit Flash Effect
    const stickColor = isHit ? "#ffffff" : color;

    ctx.strokeStyle = stickColor;
    ctx.lineWidth = isBoss ? 5 : 3.5;
    ctx.lineCap = "round";

    // Draw Aura if present (Player Super Mode)
    if (auraColor) {
      ctx.shadowColor = stickColor;
      ctx.shadowBlur = 15;
    }

    const headRadius = isBoss ? 14 : 10;
    const neckY = y - height + headRadius * 2;
    const hipY = y - height * 0.4;

    // 1. Head
    ctx.beginPath();
    ctx.arc(x, y - height + headRadius, headRadius, 0, Math.PI * 2);
    ctx.stroke();

    // Head Eye Glow
    ctx.fillStyle = isHit ? "#ff0000" : "#ffffff";
    ctx.beginPath();
    ctx.arc(x + facing * 4, y - height + headRadius - 2, 2.5, 0, Math.PI * 2);
    ctx.fill();

    // 2. Torso
    ctx.beginPath();
    ctx.moveTo(x, neckY);
    ctx.lineTo(x, hipY);
    ctx.stroke();

    // 3. Legs (procedural walking pose)
    const legSpread = entity.vx !== 0 ? Math.sin(Date.now() * 0.015) * 12 : 5;
    // Left Leg
    ctx.beginPath();
    ctx.moveTo(x, hipY);
    ctx.lineTo(x - legSpread, y);
    ctx.stroke();
    // Right Leg
    ctx.beginPath();
    ctx.moveTo(x, hipY);
    ctx.lineTo(x + legSpread, y);
    ctx.stroke();

    // 4. Arms & Weapon Holding Angle
    const shoulderY = neckY + 8;
    const armAngle = isAttacking ? facing * 0.8 : facing * 0.2;
    const handX = x + Math.cos(armAngle) * 22 * facing;
    const handY = shoulderY + Math.sin(armAngle) * 18;

    ctx.beginPath();
    ctx.moveTo(x, shoulderY);
    ctx.lineTo(handX, handY);
    ctx.stroke();

    // 5. Draw Weapon held in hand
    drawWeapon(ctx, handX, handY, facing, weapon, isAttacking);

    // 6. Overhead Health Bar
    const barWidth = isBoss ? 70 : 40;
    const barHeight = 5;
    const barX = x - barWidth / 2;
    const barY = y - height - 15;

    ctx.fillStyle = "rgba(0,0,0,0.6)";
    ctx.fillRect(barX, barY, barWidth, barHeight);

    const hpPercent = Math.max(0, health / maxHealth);
    ctx.fillStyle = hpPercent > 0.5 ? "#10b981" : hpPercent > 0.2 ? "#f59e0b" : "#ef4444";
    ctx.fillRect(barX, barY, barWidth * hpPercent, barHeight);

    ctx.restore();
  };

  // Draw Weapon Mesh & Slash Effects
  const drawWeapon = (
    ctx: CanvasRenderingContext2D,
    handX: number,
    handY: number,
    facing: 1 | -1,
    weapon: WeaponType,
    isAttacking: boolean
  ) => {
    const info = WEAPONS[weapon];
    ctx.strokeStyle = info.color;
    ctx.lineWidth = 4;

    if (weapon === "katana") {
      ctx.beginPath();
      ctx.moveTo(handX, handY);
      ctx.lineTo(handX + facing * 45, handY - 15);
      ctx.stroke();

      // Swing Slash Arc Trail
      if (isAttacking) {
        ctx.fillStyle = "rgba(0, 240, 255, 0.3)";
        ctx.beginPath();
        ctx.arc(handX, handY, 50, -0.4, 0.8 * facing, facing === -1);
        ctx.fill();
      }
    } else if (weapon === "dual_blasters") {
      ctx.fillStyle = info.color;
      ctx.fillRect(handX, handY - 4, facing * 18, 6);
    } else if (weapon === "rocket_launcher") {
      ctx.fillStyle = "#ffaa00";
      ctx.fillRect(handX - 5, handY - 8, facing * 32, 12);
    } else if (weapon === "cyber_scythe") {
      ctx.beginPath();
      ctx.moveTo(handX, handY);
      ctx.lineTo(handX + facing * 40, handY - 30);
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(handX + facing * 40, handY - 30, 20, 0, Math.PI);
      ctx.stroke();
    }
  };

  // Buy Skin
  const buySkin = (skin: StickSkin) => {
    if (coins >= skin.cost && !unlockedSkins.includes(skin.id)) {
      const nextCoins = coins - skin.cost;
      saveCoins(nextCoins);
      setUnlockedSkins([...unlockedSkins, skin.id]);
      setSelectedSkin(skin);
      sfx.playPowerup();
    }
  };

  return (
    <div className="w-full h-screen bg-black text-white font-sans overflow-hidden flex flex-col items-center justify-center relative selection:bg-cyan-500/30">
      {/* Dynamic Background Shader overlay */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(0,240,255,0.08),transparent_70%)] pointer-events-none" />

      {/* HEADER TOP BAR */}
      <header className="absolute top-0 left-0 right-0 p-4 md:p-6 flex justify-between items-center z-50 bg-gradient-to-b from-black/80 via-black/40 to-transparent backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <Link
            href="/games"
            className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center border border-white/20 hover:bg-white/20 transition-all text-white"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="flex items-center gap-2">
            <Swords className="w-6 h-6 text-cyan-400 animate-pulse" />
            <h1 className="text-xl md:text-2xl font-black uppercase tracking-wider bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 via-fuchsia-400 to-amber-400">
              Super Stick Battles
            </h1>
          </div>
        </div>

        {/* Currency & Audio Toggle */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 bg-amber-500/10 border border-amber-500/30 px-3.5 py-1.5 rounded-full">
            <Trophy className="w-4 h-4 text-amber-400" />
            <span className="text-sm font-bold text-amber-300">{coins} COINS</span>
          </div>

          <button
            onClick={() => {
              sfx.muted = !isMuted;
              setIsMuted(!isMuted);
            }}
            className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center border border-white/20 hover:bg-white/20 transition-all"
          >
            {isMuted ? <VolumeX className="w-5 h-5 text-red-400" /> : <Volume2 className="w-5 h-5 text-cyan-400" />}
          </button>
        </div>
      </header>

      {/* MAIN GAME CANVAS CONTAINER */}
      <div className="relative w-full max-w-6xl aspect-[16/9] bg-zinc-950 rounded-2xl overflow-hidden border border-cyan-500/30 shadow-[0_0_50px_rgba(0,240,255,0.15)] flex items-center justify-center">
        <canvas ref={canvasRef} width={1200} height={675} className="w-full h-full object-contain bg-black" />

        {/* HUD OVERLAY (Only active during gameplay) */}
        {gameState === "playing" && (
          <div className="absolute inset-0 pointer-events-none p-6 flex flex-col justify-between">
            {/* Top HUD Stats */}
            <div className="flex justify-between items-start">
              {/* Player Health & Energy Bar */}
              <div className="flex flex-col gap-2 w-64">
                <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-cyan-300">
                  <span className="flex items-center gap-1">
                    <Heart className="w-4 h-4 text-red-500 fill-red-500" /> HEALTH
                  </span>
                  <span>
                    {Math.max(0, Math.round(playerRef.current.health))} / {playerRef.current.maxHealth}
                  </span>
                </div>
                <div className="w-full h-3.5 bg-zinc-900 border border-white/20 rounded-full overflow-hidden p-0.5">
                  <div
                    className="h-full bg-gradient-to-r from-red-500 to-emerald-400 rounded-full transition-all duration-200"
                    style={{
                      width: `${Math.max(0, (playerRef.current.health / playerRef.current.maxHealth) * 100)}%`
                    }}
                  />
                </div>

                {/* Ultimate Rage Meter */}
                <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-amber-300 mt-1">
                  <span className="flex items-center gap-1">
                    <Zap className="w-3.5 h-3.5 text-amber-400 fill-amber-400" /> RAGE ULTIMATE [Q]
                  </span>
                  <span>{rageMeter}%</span>
                </div>
                <div className="w-full h-2.5 bg-zinc-900 border border-amber-500/30 rounded-full overflow-hidden p-0.5">
                  <div
                    className={cn(
                      "h-full rounded-full transition-all duration-150",
                      rageMeter >= 100
                        ? "bg-gradient-to-r from-amber-400 to-yellow-300 animate-pulse shadow-[0_0_10px_#f59e0b]"
                        : "bg-amber-500"
                    )}
                    style={{ width: `${rageMeter}%` }}
                  />
                </div>
              </div>

              {/* Wave & Score HUD */}
              <div className="flex flex-col items-center">
                <div className="bg-cyan-950/80 border border-cyan-500/40 px-6 py-2 rounded-2xl backdrop-blur-md text-center">
                  <div className="text-[10px] font-bold uppercase tracking-widest text-cyan-400">
                    {gameMode === "survival" ? `WAVE ${wave}` : "DUEL ARENA"}
                  </div>
                  <div className="text-2xl font-black text-white">{score} PTS</div>
                </div>
              </div>

              {/* Weapon Selection Quick Indicator */}
              <div className="flex flex-col items-end gap-1.5">
                <div className="text-[10px] font-bold uppercase text-zinc-400">WEAPON [1-4]</div>
                <div className="flex gap-1.5">
                  {(Object.keys(WEAPONS) as WeaponType[]).map((wKey, idx) => (
                    <button
                      key={wKey}
                      onClick={() => setSelectedWeapon(wKey)}
                      className={cn(
                        "pointer-events-auto px-2.5 py-1.5 rounded-lg border text-xs font-black uppercase transition-all",
                        selectedWeapon === wKey
                          ? "bg-cyan-500 text-black border-cyan-300 shadow-[0_0_15px_rgba(0,240,255,0.5)]"
                          : "bg-black/60 border-white/20 text-zinc-400 hover:text-white"
                      )}
                    >
                      {idx + 1}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Bottom Touch Controls Overlay (for mobile/tablet touch users) */}
            <div className="flex justify-between items-end pointer-events-auto md:hidden pt-4">
              {/* Direction D-Pad */}
              <div className="flex gap-2">
                <button
                  onMouseDown={() => (keysRef.current["KeyA"] = true)}
                  onMouseUp={() => (keysRef.current["KeyA"] = false)}
                  onTouchStart={() => (keysRef.current["KeyA"] = true)}
                  onTouchEnd={() => (keysRef.current["KeyA"] = false)}
                  className="w-14 h-14 bg-white/10 active:bg-cyan-500 border border-white/20 rounded-2xl flex items-center justify-center text-xl font-bold"
                >
                  ◀
                </button>
                <button
                  onMouseDown={() => (keysRef.current["KeyD"] = true)}
                  onMouseUp={() => (keysRef.current["KeyD"] = false)}
                  onTouchStart={() => (keysRef.current["KeyD"] = true)}
                  onTouchEnd={() => (keysRef.current["KeyD"] = false)}
                  className="w-14 h-14 bg-white/10 active:bg-cyan-500 border border-white/20 rounded-2xl flex items-center justify-center text-xl font-bold"
                >
                  ▶
                </button>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    keysRef.current["Space"] = true;
                    setTimeout(() => (keysRef.current["Space"] = false), 100);
                  }}
                  className="w-14 h-14 bg-cyan-500/20 active:bg-cyan-500 border border-cyan-400 rounded-2xl flex items-center justify-center text-xs font-black"
                >
                  JUMP
                </button>
                <button
                  onClick={() => {
                    keysRef.current["KeyJ"] = true;
                    setTimeout(() => (keysRef.current["KeyJ"] = false), 100);
                  }}
                  className="w-16 h-16 bg-red-500/30 active:bg-red-500 border border-red-400 rounded-2xl flex items-center justify-center text-xs font-black text-red-300"
                >
                  ATTACK
                </button>
              </div>
            </div>
          </div>
        )}

        {/* MENU OVERLAY */}
        <AnimatePresence>
          {gameState === "menu" && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="absolute inset-0 bg-black/90 backdrop-blur-md z-40 flex flex-col items-center justify-center p-8 text-center"
            >
              <div className="w-20 h-20 rounded-3xl bg-cyan-500/10 border border-cyan-400/40 flex items-center justify-center mb-6 shadow-[0_0_40px_rgba(0,240,255,0.3)]">
                <Swords className="w-10 h-10 text-cyan-400 animate-bounce" />
              </div>

              <h2 className="text-4xl md:text-6xl font-black uppercase tracking-tighter mb-3 bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 via-fuchsia-400 to-amber-400">
                Super Stick Battles
              </h2>
              <p className="text-zinc-400 max-w-md text-sm md:text-base mb-8">
                Master high-speed stickman brawls, unlock cyber weapons, execute devastating ultimate rage strikes, and dominate waves of enemy armadas.
              </p>

              <div className="flex flex-col md:flex-row gap-4 w-full max-w-md">
                <button
                  onClick={() => startGame("survival")}
                  className="flex-1 py-4 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-black font-black uppercase tracking-wider rounded-2xl shadow-[0_0_30px_rgba(0,240,255,0.4)] transition-all flex items-center justify-center gap-2"
                >
                  <Play className="w-5 h-5 fill-black" /> Survival Waves
                </button>
                <button
                  onClick={() => startGame("duel")}
                  className="flex-1 py-4 bg-gradient-to-r from-fuchsia-600 to-purple-600 hover:from-fuchsia-500 hover:to-purple-500 text-white font-black uppercase tracking-wider rounded-2xl shadow-[0_0_30px_rgba(217,70,239,0.4)] transition-all flex items-center justify-center gap-2"
                >
                  <Target className="w-5 h-5" /> 1v1 CPU Duel
                </button>
              </div>

              <div className="flex gap-4 mt-6">
                <button
                  onClick={() => setGameState("shop")}
                  className="px-6 py-3 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl font-bold text-xs uppercase tracking-widest transition-all flex items-center gap-2"
                >
                  <ShoppingBag className="w-4 h-4 text-amber-400" /> Skins & Armory
                </button>
              </div>

              <div className="mt-8 text-xs text-zinc-500 font-mono">
                CONTROLS: WASD / ARROWS = Move | SPACE = Jump | J / ENTER = Attack | Q = Ultimate
              </div>
            </motion.div>
          )}

          {/* SHOP OVERLAY */}
          {gameState === "shop" && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/95 backdrop-blur-md z-40 flex flex-col p-8 overflow-y-auto"
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-black uppercase tracking-wider text-cyan-400 flex items-center gap-2">
                  <ShoppingBag className="w-6 h-6" /> Stickman Customization & Upgrades
                </h3>
                <button
                  onClick={() => setGameState("menu")}
                  className="px-5 py-2 bg-white/10 border border-white/20 rounded-xl font-bold text-xs uppercase hover:bg-white/20"
                >
                  Back to Menu
                </button>
              </div>

              {/* Skins Selector */}
              <div className="mb-8">
                <h4 className="text-sm font-bold uppercase text-zinc-400 mb-4">Select Cyber Skin</h4>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  {SKINS.map(skin => {
                    const isUnlocked = unlockedSkins.includes(skin.id);
                    const isSelected = selectedSkin.id === skin.id;

                    return (
                      <div
                        key={skin.id}
                        onClick={() => {
                          if (isUnlocked) setSelectedSkin(skin);
                          else buySkin(skin);
                        }}
                        className={cn(
                          "p-4 rounded-2xl border cursor-pointer flex flex-col items-center transition-all",
                          isSelected
                            ? "bg-cyan-950/80 border-cyan-400 shadow-[0_0_20px_rgba(0,240,255,0.3)]"
                            : "bg-white/5 border-white/10 hover:bg-white/10"
                        )}
                      >
                        <div
                          className="w-12 h-12 rounded-full mb-3 flex items-center justify-center border-2 border-white/20"
                          style={{ backgroundColor: skin.color }}
                        />
                        <div className="font-bold text-sm mb-1">{skin.name}</div>
                        <div className="text-xs text-zinc-400">
                          {isSelected ? (
                            <span className="text-cyan-400 font-black">EQUIPPED</span>
                          ) : isUnlocked ? (
                            <span className="text-emerald-400 font-bold">OWNED</span>
                          ) : (
                            <span className="text-amber-400 font-bold">{skin.cost} COINS</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Weapon Stats Preview */}
              <div>
                <h4 className="text-sm font-bold uppercase text-zinc-400 mb-4">Default Starting Weapon</h4>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  {(Object.keys(WEAPONS) as WeaponType[]).map(wKey => {
                    const w = WEAPONS[wKey];
                    const isSelected = selectedWeapon === wKey;

                    return (
                      <div
                        key={wKey}
                        onClick={() => setSelectedWeapon(wKey)}
                        className={cn(
                          "p-4 rounded-2xl border cursor-pointer transition-all",
                          isSelected
                            ? "bg-cyan-950/80 border-cyan-400 shadow-[0_0_20px_rgba(0,240,255,0.3)]"
                            : "bg-white/5 border-white/10 hover:bg-white/10"
                        )}
                      >
                        <div className="font-black text-sm uppercase mb-1" style={{ color: w.color }}>
                          {w.name}
                        </div>
                        <p className="text-xs text-zinc-400 mb-3">{w.description}</p>
                        <div className="text-[10px] font-bold uppercase text-zinc-500">
                          DMG: {w.damage} | SPEED: {w.attackSpeed}ms
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          )}

          {/* PAUSE OVERLAY */}
          {gameState === "paused" && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/80 backdrop-blur-md z-40 flex flex-col items-center justify-center p-8"
            >
              <h2 className="text-4xl font-black uppercase tracking-wider mb-6 text-cyan-400">GAME PAUSED</h2>
              <div className="flex flex-col gap-4 w-64">
                <button
                  onClick={() => setGameState("playing")}
                  className="py-3 bg-cyan-500 text-black font-black uppercase tracking-wider rounded-xl hover:bg-cyan-400 transition-all"
                >
                  Resume Combat
                </button>
                <button
                  onClick={() => setGameState("menu")}
                  className="py-3 bg-white/10 border border-white/20 text-white font-bold uppercase tracking-wider rounded-xl hover:bg-white/20 transition-all"
                >
                  Quit to Menu
                </button>
              </div>
            </motion.div>
          )}

          {/* GAME OVER OVERLAY */}
          {gameState === "gameover" && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/90 backdrop-blur-md z-40 flex flex-col items-center justify-center p-8 text-center"
            >
              <h2 className="text-5xl font-black uppercase tracking-tighter text-red-500 mb-2">STICK DEFEATED</h2>
              <p className="text-zinc-400 mb-6">Your cyber stickman was overwhelmed in wave combat.</p>

              <div className="bg-zinc-900 border border-white/10 p-6 rounded-2xl w-full max-w-sm mb-8">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-xs uppercase text-zinc-400 font-bold">Final Score</span>
                  <span className="text-2xl font-black text-cyan-400">{score}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs uppercase text-zinc-400 font-bold">High Score</span>
                  <span className="text-2xl font-black text-amber-400">{highScore}</span>
                </div>
              </div>

              <div className="flex gap-4">
                <button
                  onClick={() => startGame(gameMode)}
                  className="px-8 py-3.5 bg-cyan-500 text-black font-black uppercase tracking-wider rounded-xl hover:bg-cyan-400 transition-all shadow-[0_0_20px_rgba(0,240,255,0.4)]"
                >
                  Play Again
                </button>
                <button
                  onClick={() => setGameState("menu")}
                  className="px-8 py-3.5 bg-white/10 border border-white/20 text-white font-bold uppercase tracking-wider rounded-xl hover:bg-white/20 transition-all"
                >
                  Main Menu
                </button>
              </div>
            </motion.div>
          )}

          {/* VICTORY OVERLAY (for 1v1 duel mode) */}
          {gameState === "victory" && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/90 backdrop-blur-md z-40 flex flex-col items-center justify-center p-8 text-center"
            >
              <Trophy className="w-16 h-16 text-amber-400 animate-bounce mb-4" />
              <h2 className="text-5xl font-black uppercase tracking-tighter text-emerald-400 mb-2">
                VICTORY CHAMPION!
              </h2>
              <p className="text-zinc-400 mb-6">You defeated the enemy stick legend in 1v1 duel combat.</p>

              <div className="flex gap-4">
                <button
                  onClick={() => startGame("duel")}
                  className="px-8 py-3.5 bg-emerald-500 text-black font-black uppercase tracking-wider rounded-xl hover:bg-emerald-400 transition-all shadow-[0_0_20px_rgba(16,185,129,0.4)]"
                >
                  Next Duel
                </button>
                <button
                  onClick={() => setGameState("menu")}
                  className="px-8 py-3.5 bg-white/10 border border-white/20 text-white font-bold uppercase tracking-wider rounded-xl hover:bg-white/20 transition-all"
                >
                  Main Menu
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* FOOTER METADATA */}
      <footer className="mt-4 text-xs text-zinc-500 flex items-center gap-4">
        <span>PRODUCED BY XAKTEIR STUDIOS</span>
        <span>•</span>
        <span>SUPER STICK BATTLES 2D CYBER EDITION</span>
      </footer>
    </div>
  );
}
