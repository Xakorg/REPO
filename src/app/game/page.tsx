"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Gamepad2,
  Trophy,
  Shield,
  Zap,
  Play,
  RotateCcw,
  Volume2,
  VolumeX,
  ShoppingBag,
  Sparkles,
  Pause,
  ArrowLeft,
  Crosshair,
  Flame,
  Award,
  Info,
  ChevronRight,
  ShieldAlert,
  Radio
} from "lucide-react";
import { cn } from "@/lib/utils";

// --- WEB AUDIO API PROCEDURAL SOUND SYNTHESIZER ---
class SoundEffects {
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

  playLaser() {
    if (this.muted || !this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(800, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(100, this.ctx.currentTime + 0.12);

      gain.gain.setValueAtTime(0.15, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.12);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + 0.12);
    } catch {
      // Audio context fallbacks
    }
  }

  playExplosion(isBig = false) {
    if (this.muted || !this.ctx) return;
    try {
      const duration = isBig ? 0.5 : 0.25;
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
      filter.frequency.setValueAtTime(isBig ? 400 : 800, this.ctx.currentTime);
      filter.frequency.linearRampToValueAtTime(50, this.ctx.currentTime + duration);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(isBig ? 0.35 : 0.2, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + duration);

      whiteNoise.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);

      whiteNoise.start();
      whiteNoise.stop(this.ctx.currentTime + duration);
    } catch {
      // Audio fallbacks
    }
  }

  playPowerup() {
    if (this.muted || !this.ctx) return;
    try {
      const notes = [300, 450, 600, 900];
      notes.forEach((freq, idx) => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime + idx * 0.05);

        gain.gain.setValueAtTime(0.12, this.ctx.currentTime + idx * 0.05);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + idx * 0.05 + 0.08);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(this.ctx.currentTime + idx * 0.05);
        osc.stop(this.ctx.currentTime + idx * 0.05 + 0.08);
      });
    } catch {
      // Fallback
    }
  }

  playEmp() {
    if (this.muted || !this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(120, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(800, this.ctx.currentTime + 0.3);

      gain.gain.setValueAtTime(0.3, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.4);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + 0.4);
    } catch {
      // Fallback
    }
  }

  playHit() {
    if (this.muted || !this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "square";
      osc.frequency.setValueAtTime(150, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(40, this.ctx.currentTime + 0.1);

      gain.gain.setValueAtTime(0.15, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.1);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + 0.1);
    } catch {
      // Fallback
    }
  }
}

const sfx = new SoundEffects();

// --- GAME TYPES ---
type GameState = "MENU" | "PLAYING" | "PAUSED" | "SHOP" | "GAMEOVER" | "ACHIEVEMENTS";
type GameMode = "SURVIVAL" | "BOSS_RUSH" | "TIME_ATTACK";

interface Achievement {
  id: string;
  title: string;
  desc: string;
  unlocked: boolean;
  icon: string;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
  life: number;
  maxLife: number;
}

interface Star {
  x: number;
  y: number;
  size: number;
  speed: number;
  alpha: number;
}

interface Projectile {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
  isEnemy: boolean;
  damage: number;
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
  type: "DRONE" | "SCOUT" | "HEAVY" | "BOSS";
  color: string;
  shootTimer: number;
  shootInterval: number;
  scoreValue: number;
  rotation: number;
}

interface PowerUp {
  x: number;
  y: number;
  vy: number;
  type: "SHIELD" | "SPREAD" | "EMP" | "OVERDRIVE" | "COIN";
  radius: number;
}

export default function CyberPulseGame() {
  // Navigation & States
  const [gameState, setGameState] = useState<GameState>("MENU");
  const [gameMode, setGameMode] = useState<GameMode>("SURVIVAL");
  const [isMuted, setIsMuted] = useState(false);
  const [highScore, setHighScore] = useState(0);
  const [coins, setCoins] = useState(0);
  const [score, setScore] = useState(0);
  const [wave, setWave] = useState(1);
  const [timeRemaining, setTimeRemaining] = useState(90);

  // Upgrades
  const [upgrades, setUpgrades] = useState({
    fireRateLevel: 1,
    damageLevel: 1,
    shieldLevel: 1,
    speedLevel: 1,
    empCapacity: 1
  });

  // Player Stats Live
  const [playerHp, setPlayerHp] = useState(100);
  const [playerShield, setPlayerShield] = useState(100);
  const [empCharges, setEmpCharges] = useState(1);
  const [multiplier, setMultiplier] = useState(1);
  const [overdriveActive, setOverdriveActive] = useState(false);

  // Achievements
  const [achievements, setAchievements] = useState<Achievement[]>([
    { id: "first_blood", title: "First Strike", desc: "Destroy your first enemy drone", unlocked: false, icon: "⚔️" },
    { id: "boss_slayer", title: "Titan Slayer", desc: "Defeat a Dreadnought Leviathan Boss", unlocked: false, icon: "👑" },
    { id: "shield_master", title: "Invincible Guard", desc: "Reach max shield level", unlocked: false, icon: "🛡️" },
    { id: "coin_hoarder", title: "Cyber Tycoon", desc: "Accumulate 200 Cyber Credits", unlocked: false, icon: "💎" },
    { id: "high_scorer", title: "Cyber Legend", desc: "Score 10,000 points in a single run", unlocked: false, icon: "🔥" }
  ]);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Canvas Refs
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameIdRef = useRef<number | null>(null);

  // Game Engine Mutable State Refs
  const keysRef = useRef<{ [key: string]: boolean }>({});
  const touchJoystickRef = useRef<{ active: boolean; dx: number; dy: number }>({ active: false, dx: 0, dy: 0 });
  const touchFireRef = useRef<boolean>(false);

  const gameLoopState = useRef({
    player: {
      x: 0,
      y: 0,
      vx: 0,
      vy: 0,
      radius: 18,
      speed: 6,
      maxHp: 100,
      hp: 100,
      maxShield: 100,
      shield: 100,
      shieldRegenTimer: 0,
      fireTimer: 0,
      weaponType: "NORMAL" as "NORMAL" | "SPREAD" | "OVERDRIVE",
      weaponDuration: 0,
      overdriveTimer: 0
    },
    enemies: [] as Enemy[],
    projectiles: [] as Projectile[],
    particles: [] as Particle[],
    stars: [] as Star[],
    powerups: [] as PowerUp[],
    score: 0,
    multiplier: 1,
    multiplierTimer: 0,
    coinsEarned: 0,
    wave: 1,
    waveSpawnTimer: 0,
    bossActive: false,
    nextEnemyId: 1,
    shake: 0,
    time: 0,
    timeAttackTimer: 90
  });

  // Load persistence
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedScore = localStorage.getItem("cyber_pulse_highscore");
      if (savedScore) setHighScore(parseInt(savedScore, 10));

      const savedCoins = localStorage.getItem("cyber_pulse_coins");
      if (savedCoins) setCoins(parseInt(savedCoins, 10));

      const savedUpgrades = localStorage.getItem("cyber_pulse_upgrades");
      if (savedUpgrades) {
        try { setUpgrades(JSON.parse(savedUpgrades)); } catch {}
      }

      const savedAch = localStorage.getItem("cyber_pulse_achievements");
      if (savedAch) {
        try { setAchievements(JSON.parse(savedAch)); } catch {}
      }
    }
  }, []);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const unlockAchievement = useCallback((id: string) => {
    setAchievements(prev => {
      const updated = prev.map(a => {
        if (a.id === id && !a.unlocked) {
          triggerToast(`🏆 Achievement Unlocked: ${a.title}!`);
          return { ...a, unlocked: true };
        }
        return a;
      });
      localStorage.setItem("cyber_pulse_achievements", JSON.stringify(updated));
      return updated;
    });
  }, []);

  // Keyboard Event Listeners
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      sfx.init();
      keysRef.current[e.code] = true;

      if (e.code === "KeyE" || e.code === "ShiftLeft") {
        triggerEMP();
      }
      if (e.code === "KeyP" || e.code === "Escape") {
        setGameState(prev => (prev === "PLAYING" ? "PAUSED" : prev === "PAUSED" ? "PLAYING" : prev));
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
  }, []);

  // Toggle Mute
  const toggleMute = () => {
    sfx.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  // EMP Wave Action
  const triggerEMP = () => {
    if (gameState !== "PLAYING") return;
    if (empCharges <= 0) return;

    setEmpCharges(prev => prev - 1);
    sfx.playEmp();

    const state = gameLoopState.current;
    state.shake = 18;

    // Destroy all enemy projectiles
    state.projectiles = state.projectiles.filter(p => !p.isEnemy);

    // Damage and push back all enemies
    state.enemies.forEach(enemy => {
      enemy.hp -= 150;
      enemy.vx *= -2;
      enemy.vy *= -2;

      // EMP Blast particles
      for (let i = 0; i < 16; i++) {
        const angle = (Math.PI * 2 * i) / 16;
        state.particles.push({
          x: enemy.x,
          y: enemy.y,
          vx: Math.cos(angle) * 8,
          vy: Math.sin(angle) * 8,
          radius: 3,
          color: "#00f3ff",
          life: 1,
          maxLife: 20
        });
      }
    });

    // Wave visual ring around player
    for (let i = 0; i < 36; i++) {
      const angle = (Math.PI * 2 * i) / 36;
      state.particles.push({
        x: state.player.x,
        y: state.player.y,
        vx: Math.cos(angle) * 14,
        vy: Math.sin(angle) * 14,
        radius: 4,
        color: "#00f3ff",
        life: 1,
        maxLife: 30
      });
    }
  };

  // Start / Reset Game
  const startGame = (mode: GameMode) => {
    sfx.init();
    setGameMode(mode);
    setGameState("PLAYING");
    setScore(0);
    setWave(1);
    setMultiplier(1);
    setOverdriveActive(false);
    setTimeRemaining(mode === "TIME_ATTACK" ? 90 : 0);

    const baseShield = 100 + (upgrades.shieldLevel - 1) * 25;
    const baseHp = 100;

    setPlayerHp(baseHp);
    setPlayerShield(baseShield);
    setEmpCharges(upgrades.empCapacity);

    // Reset loop state
    const canvas = canvasRef.current;
    const width = canvas ? canvas.width : 1000;
    const height = canvas ? canvas.height : 700;

    const stars: Star[] = [];
    for (let i = 0; i < 100; i++) {
      stars.push({
        x: Math.random() * width,
        y: Math.random() * height,
        size: Math.random() * 2 + 0.5,
        speed: Math.random() * 2 + 0.5,
        alpha: Math.random() * 0.8 + 0.2
      });
    }

    gameLoopState.current = {
      player: {
        x: width / 2,
        y: height - 120,
        vx: 0,
        vy: 0,
        radius: 18,
        speed: 5 + upgrades.speedLevel * 0.8,
        maxHp: baseHp,
        hp: baseHp,
        maxShield: baseShield,
        shield: baseShield,
        shieldRegenTimer: 0,
        fireTimer: 0,
        weaponType: "NORMAL",
        weaponDuration: 0,
        overdriveTimer: 0
      },
      enemies: [],
      projectiles: [],
      particles: [],
      stars,
      powerups: [],
      score: 0,
      multiplier: 1,
      multiplierTimer: 0,
      coinsEarned: 0,
      wave: 1,
      waveSpawnTimer: 0,
      bossActive: mode === "BOSS_RUSH",
      nextEnemyId: 1,
      shake: 0,
      time: 0,
      timeAttackTimer: 90
    };

    if (mode === "BOSS_RUSH") {
      spawnBoss(width, height);
    }
  };

  // Spawn Boss Enemy
  const spawnBoss = (width: number, height: number) => {
    const boss: Enemy = {
      id: gameLoopState.current.nextEnemyId++,
      x: width / 2,
      y: 120,
      vx: 3,
      vy: 0,
      radius: 48,
      hp: 1500,
      maxHp: 1500,
      type: "BOSS",
      color: "#ff0055",
      shootTimer: 0,
      shootInterval: 30,
      scoreValue: 2500,
      rotation: 0
    };
    gameLoopState.current.enemies.push(boss);
    gameLoopState.current.bossActive = true;
    triggerToast("⚠️ WARNING: Dreadnought Leviathan Approaching!");
  };

  // Upgrade Purchase Handler
  const purchaseUpgrade = (type: keyof typeof upgrades, cost: number) => {
    if (coins < cost) return;
    setCoins(prev => {
      const nextCoins = prev - cost;
      localStorage.setItem("cyber_pulse_coins", nextCoins.toString());
      return nextCoins;
    });

    setUpgrades(prev => {
      const updated = { ...prev, [type]: prev[type] + 1 };
      localStorage.setItem("cyber_pulse_upgrades", JSON.stringify(updated));
      return updated;
    });

    sfx.playPowerup();

    if (type === "shieldLevel" && upgrades.shieldLevel >= 4) {
      unlockAchievement("shield_master");
    }
  };

  // --- CANVAS GAME RENDER & PHYSICS LOOP ---
  useEffect(() => {
    if (gameState !== "PLAYING") return;

    let lastTime = performance.now();

    const render = (now: number) => {
      const delta = (now - lastTime) / 1000;
      lastTime = now;

      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const width = canvas.width;
      const height = canvas.height;
      const state = gameLoopState.current;
      state.time += delta;

      // Clear Canvas with backdrop trail
      ctx.fillStyle = "rgba(9, 10, 15, 0.35)";
      ctx.fillRect(0, 0, width, height);

      // --- SCREEN SHAKE OFFSET ---
      ctx.save();
      if (state.shake > 0) {
        const dx = (Math.random() - 0.5) * state.shake;
        const dy = (Math.random() - 0.5) * state.shake;
        ctx.translate(dx, dy);
        state.shake *= 0.9;
        if (state.shake < 0.2) state.shake = 0;
      }

      // --- STARFIELD PARALLAX ---
      state.stars.forEach(star => {
        star.y += star.speed;
        if (star.y > height) {
          star.y = 0;
          star.x = Math.random() * width;
        }
        ctx.fillStyle = `rgba(0, 243, 255, ${star.alpha})`;
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
        ctx.fill();
      });

      // --- TIME ATTACK TIMER ---
      if (gameMode === "TIME_ATTACK") {
        state.timeAttackTimer -= delta;
        setTimeRemaining(Math.max(0, Math.ceil(state.timeAttackTimer)));
        if (state.timeAttackTimer <= 0) {
          setGameState("GAMEOVER");
        }
      }

      // --- PLAYER CONTROLS & PHYSICS ---
      const player = state.player;
      let inputX = 0;
      let inputY = 0;

      if (keysRef.current["KeyA"] || keysRef.current["ArrowLeft"]) inputX -= 1;
      if (keysRef.current["KeyD"] || keysRef.current["ArrowRight"]) inputX += 1;
      if (keysRef.current["KeyW"] || keysRef.current["ArrowUp"]) inputY -= 1;
      if (keysRef.current["KeyS"] || keysRef.current["ArrowDown"]) inputY += 1;

      if (touchJoystickRef.current.active) {
        inputX += touchJoystickRef.current.dx;
        inputY += touchJoystickRef.current.dy;
      }

      // Normalize speed
      if (inputX !== 0 || inputY !== 0) {
        const len = Math.hypot(inputX, inputY);
        player.vx = (inputX / len) * player.speed;
        player.vy = (inputY / len) * player.speed;
      } else {
        player.vx *= 0.85;
        player.vy *= 0.85;
      }

      player.x += player.vx;
      player.y += player.vy;

      // Keep inside boundary
      player.x = Math.max(player.radius, Math.min(width - player.radius, player.x));
      player.y = Math.max(player.radius, Math.min(height - player.radius, player.y));

      // Weapon Buff Timer
      if (player.weaponDuration > 0) {
        player.weaponDuration -= delta;
        if (player.weaponDuration <= 0) {
          player.weaponType = "NORMAL";
        }
      }
      if (player.overdriveTimer > 0) {
        player.overdriveTimer -= delta;
        if (player.overdriveTimer <= 0) {
          setOverdriveActive(false);
        }
      }

      // Shield Regeneration
      if (player.shield < player.maxShield) {
        player.shieldRegenTimer += delta;
        if (player.shieldRegenTimer > 4) {
          player.shield = Math.min(player.maxShield, player.shield + 8 * delta);
          setPlayerShield(Math.round(player.shield));
        }
      }

      // --- PLAYER FIRING ---
      const isShooting = keysRef.current["Space"] || touchFireRef.current;
      player.fireTimer += delta;
      const baseInterval = Math.max(0.08, 0.22 - (upgrades.fireRateLevel - 1) * 0.03);
      const fireInterval = player.overdriveTimer > 0 ? baseInterval * 0.4 : baseInterval;

      if (isShooting && player.fireTimer >= fireInterval) {
        player.fireTimer = 0;
        sfx.playLaser();

        const pDamage = (15 + (upgrades.damageLevel - 1) * 5) * (player.overdriveTimer > 0 ? 1.8 : 1);

        if (player.weaponType === "SPREAD") {
          // 3-way spread
          [-0.25, 0, 0.25].forEach(angle => {
            state.projectiles.push({
              x: player.x,
              y: player.y - 15,
              vx: Math.sin(angle) * 14,
              vy: -Math.cos(angle) * 14,
              radius: 4,
              color: "#ff00e5",
              isEnemy: false,
              damage: pDamage
            });
          });
        } else {
          // Standard / Overdrive Twin plasma
          state.projectiles.push({
            x: player.x - 8,
            y: player.y - 15,
            vx: 0,
            vy: -15,
            radius: player.overdriveTimer > 0 ? 5 : 4,
            color: player.overdriveTimer > 0 ? "#ffb700" : "#00f3ff",
            isEnemy: false,
            damage: pDamage
          });
          state.projectiles.push({
            x: player.x + 8,
            y: player.y - 15,
            vx: 0,
            vy: -15,
            radius: player.overdriveTimer > 0 ? 5 : 4,
            color: player.overdriveTimer > 0 ? "#ffb700" : "#00f3ff",
            isEnemy: false,
            damage: pDamage
          });
        }
      }

      // --- DRAW PLAYER SHIP ---
      ctx.save();
      ctx.translate(player.x, player.y);

      // Thruster Trail
      ctx.fillStyle = player.overdriveTimer > 0 ? "#ffb700" : "#00f3ff";
      ctx.beginPath();
      ctx.moveTo(-6, 15);
      ctx.lineTo(0, 25 + Math.random() * 8);
      ctx.lineTo(6, 15);
      ctx.fill();

      // Ship Hull
      ctx.fillStyle = player.overdriveTimer > 0 ? "#ff0055" : "#0f172a";
      ctx.strokeStyle = player.overdriveTimer > 0 ? "#ffb700" : "#00f3ff";
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(0, -20);
      ctx.lineTo(16, 16);
      ctx.lineTo(0, 8);
      ctx.lineTo(-16, 16);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Energy Shield Bubble
      if (player.shield > 0) {
        ctx.strokeStyle = `rgba(0, 243, 255, ${0.3 + (player.shield / player.maxShield) * 0.5})`;
        ctx.shadowColor = "#00f3ff";
        ctx.shadowBlur = 12;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(0, 0, player.radius + 6, 0, Math.PI * 2);
        ctx.stroke();
      }

      ctx.restore();

      // --- WAVE SPAWNING & ENEMY AI ---
      if (gameMode !== "BOSS_RUSH") {
        state.waveSpawnTimer += delta;
        if (state.enemies.length === 0 || (state.waveSpawnTimer > 3 && state.enemies.length < 12)) {
          state.waveSpawnTimer = 0;
          const spawnCount = Math.min(2 + Math.floor(state.wave * 1.5), 10);

          for (let i = 0; i < spawnCount; i++) {
            const randType = Math.random();
            let enemyType: Enemy["type"] = "DRONE";
            let hp = 30 + state.wave * 10;
            let radius = 16;
            let color = "#ff0055";
            let scoreVal = 100;

            if (randType > 0.75) {
              enemyType = "HEAVY";
              hp = 120 + state.wave * 25;
              radius = 26;
              color = "#a855f7";
              scoreVal = 350;
            } else if (randType > 0.45) {
              enemyType = "SCOUT";
              hp = 50 + state.wave * 12;
              radius = 18;
              color = "#ffb700";
              scoreVal = 200;
            }

            state.enemies.push({
              id: state.nextEnemyId++,
              x: Math.random() * (width - 60) + 30,
              y: -30 - Math.random() * 100,
              vx: (Math.random() - 0.5) * 2,
              vy: Math.random() * 1.5 + 1.2,
              radius,
              hp,
              maxHp: hp,
              type: enemyType,
              color,
              shootTimer: Math.random() * 2,
              shootInterval: enemyType === "HEAVY" ? 1.8 : 2.5,
              scoreValue: scoreVal,
              rotation: 0
            });
          }
        }
      }

      // --- UPDATE & DRAW ENEMIES ---
      state.enemies.forEach((enemy, index) => {
        enemy.x += enemy.vx;
        enemy.y += enemy.vy;
        enemy.rotation += 0.02;

        // Bounce horizontally off walls
        if (enemy.x < enemy.radius || enemy.x > width - enemy.radius) {
          enemy.vx *= -1;
        }

        // Boss Movement Pattern
        if (enemy.type === "BOSS") {
          if (enemy.y < 120) enemy.vy = 1;
          else enemy.vy = 0;

          if (enemy.x < 100 || enemy.x > width - 100) enemy.vx *= -1;
        }

        // Enemy Shooting Logic
        enemy.shootTimer += delta;
        if (enemy.shootTimer >= enemy.shootInterval && enemy.y > 0) {
          enemy.shootTimer = 0;
          if (enemy.type === "HEAVY" || enemy.type === "BOSS") {
            // Radial Ring Shot
            const bullets = enemy.type === "BOSS" ? 12 : 6;
            for (let b = 0; b < bullets; b++) {
              const angle = (Math.PI * 2 * b) / bullets + enemy.rotation;
              state.projectiles.push({
                x: enemy.x,
                y: enemy.y,
                vx: Math.cos(angle) * 4,
                vy: Math.sin(angle) * 4,
                radius: 5,
                color: "#ff0055",
                isEnemy: true,
                damage: 12
              });
            }
          } else {
            // Targeted Plasma Bolt towards player
            const dx = player.x - enemy.x;
            const dy = player.y - enemy.y;
            const dist = Math.hypot(dx, dy) || 1;
            state.projectiles.push({
              x: enemy.x,
              y: enemy.y,
              vx: (dx / dist) * 5,
              vy: (dy / dist) * 5,
              radius: 4,
              color: "#ff0055",
              isEnemy: true,
              damage: 10
            });
          }
        }

        // Draw Enemy
        ctx.save();
        ctx.translate(enemy.x, enemy.y);
        ctx.rotate(enemy.rotation);

        ctx.fillStyle = enemy.color;
        ctx.shadowColor = enemy.color;
        ctx.shadowBlur = 10;

        if (enemy.type === "BOSS") {
          ctx.beginPath();
          ctx.arc(0, 0, enemy.radius, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = "#ffffff";
          ctx.lineWidth = 4;
          ctx.stroke();
        } else if (enemy.type === "HEAVY") {
          ctx.beginPath();
          ctx.rect(-enemy.radius, -enemy.radius, enemy.radius * 2, enemy.radius * 2);
          ctx.fill();
        } else {
          ctx.beginPath();
          ctx.moveTo(0, -enemy.radius);
          ctx.lineTo(enemy.radius, enemy.radius);
          ctx.lineTo(-enemy.radius, enemy.radius);
          ctx.closePath();
          ctx.fill();
        }

        ctx.restore();

        // Draw Enemy Health Bar (if damaged)
        if (enemy.hp < enemy.maxHp) {
          ctx.fillStyle = "rgba(0,0,0,0.6)";
          ctx.fillRect(enemy.x - 20, enemy.y - enemy.radius - 12, 40, 5);
          ctx.fillStyle = "#ff0055";
          ctx.fillRect(enemy.x - 20, enemy.y - enemy.radius - 12, (enemy.hp / enemy.maxHp) * 40, 5);
        }

        // Remove if off-screen bottom
        if (enemy.y > height + 50) {
          state.enemies.splice(index, 1);
        }
      });

      // --- PROJECTILES & COLLISION DETECTION ---
      state.projectiles.forEach((p, pIdx) => {
        p.x += p.vx;
        p.y += p.vy;

        // Draw Projectile
        ctx.fillStyle = p.color;
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fill();

        // Player Hit Check
        if (p.isEnemy) {
          const dist = Math.hypot(p.x - player.x, p.y - player.y);
          if (dist < p.radius + player.radius) {
            state.projectiles.splice(pIdx, 1);
            sfx.playHit();
            state.shake = 10;

            // Damage Shield first, then Health
            if (player.shield > 0) {
              player.shield = Math.max(0, player.shield - p.damage);
              player.shieldRegenTimer = 0;
              setPlayerShield(Math.round(player.shield));
            } else {
              player.hp = Math.max(0, player.hp - p.damage);
              setPlayerHp(Math.round(player.hp));
            }

            if (player.hp <= 0) {
              sfx.playExplosion(true);
              setGameState("GAMEOVER");
            }
          }
        } else {
          // Enemy Hit Check
          state.enemies.forEach((enemy, eIdx) => {
            const dist = Math.hypot(p.x - enemy.x, p.y - enemy.y);
            if (dist < p.radius + enemy.radius) {
              state.projectiles.splice(pIdx, 1);
              enemy.hp -= p.damage;

              // Spark Particles
              for (let i = 0; i < 4; i++) {
                state.particles.push({
                  x: p.x,
                  y: p.y,
                  vx: (Math.random() - 0.5) * 4,
                  vy: (Math.random() - 0.5) * 4,
                  radius: 2,
                  color: p.color,
                  life: 1,
                  maxLife: 12
                });
              }

              // Destroy Enemy
              if (enemy.hp <= 0) {
                sfx.playExplosion(enemy.type === "BOSS" || enemy.type === "HEAVY");
                state.enemies.splice(eIdx, 1);

                unlockAchievement("first_blood");
                if (enemy.type === "BOSS") {
                  unlockAchievement("boss_slayer");
                  state.bossActive = false;
                }

                // Add Score & Multiplier
                state.score += enemy.scoreValue * state.multiplier;
                setScore(state.score);
                state.multiplierTimer = 5;

                if (state.score > highScore) {
                  setHighScore(state.score);
                  localStorage.setItem("cyber_pulse_highscore", state.score.toString());
                  if (state.score >= 10000) unlockAchievement("high_scorer");
                }

                // Spawn Power-up Chance (20% chance)
                if (Math.random() < 0.25) {
                  const types: PowerUp["type"][] = ["SHIELD", "SPREAD", "EMP", "OVERDRIVE", "COIN"];
                  const selectedType = types[Math.floor(Math.random() * types.length)];
                  state.powerups.push({
                    x: enemy.x,
                    y: enemy.y,
                    vy: 2,
                    type: selectedType,
                    radius: 12
                  });
                }

                // Explosion Particles
                const particleCount = enemy.type === "BOSS" ? 40 : 16;
                for (let i = 0; i < particleCount; i++) {
                  const angle = Math.random() * Math.PI * 2;
                  const spd = Math.random() * 6 + 2;
                  state.particles.push({
                    x: enemy.x,
                    y: enemy.y,
                    vx: Math.cos(angle) * spd,
                    vy: Math.sin(angle) * spd,
                    radius: Math.random() * 3 + 1,
                    color: enemy.color,
                    life: 1,
                    maxLife: 30
                  });
                }
              }
            }
          });
        }

        // Remove offscreen projectiles
        if (p.x < 0 || p.x > width || p.y < 0 || p.y > height) {
          state.projectiles.splice(pIdx, 1);
        }
      });

      // --- POWER-UPS UPDATE & COLLISION ---
      state.powerups.forEach((pu, puIdx) => {
        pu.y += pu.vy;

        // Draw Power-up
        ctx.save();
        ctx.translate(pu.x, pu.y);
        ctx.fillStyle = pu.type === "COIN" ? "#ffb700" : pu.type === "SHIELD" ? "#00f3ff" : "#ff00e5";
        ctx.shadowColor = ctx.fillStyle;
        ctx.shadowBlur = 12;
        ctx.beginPath();
        ctx.arc(0, 0, pu.radius, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 10px sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(pu.type[0], 0, 0);
        ctx.restore();

        // Player Collect Power-up
        const dist = Math.hypot(pu.x - player.x, pu.y - player.y);
        if (dist < pu.radius + player.radius) {
          state.powerups.splice(puIdx, 1);
          sfx.playPowerup();

          if (pu.type === "SHIELD") {
            player.shield = Math.min(player.maxShield, player.shield + 40);
            setPlayerShield(Math.round(player.shield));
            triggerToast("🛡️ Shield Restored +40");
          } else if (pu.type === "SPREAD") {
            player.weaponType = "SPREAD";
            player.weaponDuration = 10;
            triggerToast("⚡ Spread Laser Engaged (10s)");
          } else if (pu.type === "EMP") {
            setEmpCharges(prev => prev + 1);
            triggerToast("💣 EMP Charge Acquired!");
          } else if (pu.type === "OVERDRIVE") {
            player.overdriveTimer = 8;
            setOverdriveActive(true);
            triggerToast("🔥 QUANTUM OVERDRIVE ACTIVATED!");
          } else if (pu.type === "COIN") {
            setCoins(prev => {
              const nextCoins = prev + 25;
              localStorage.setItem("cyber_pulse_coins", nextCoins.toString());
              if (nextCoins >= 200) unlockAchievement("coin_hoarder");
              return nextCoins;
            });
            triggerToast("💎 +25 Cyber Credits");
          }
        }

        if (pu.y > height + 30) {
          state.powerups.splice(puIdx, 1);
        }
      });

      // --- PARTICLES UPDATE ---
      state.particles.forEach((part, pIdx) => {
        part.x += part.vx;
        part.y += part.vy;
        part.life += 1;

        const alpha = 1 - part.life / part.maxLife;
        ctx.fillStyle = part.color;
        ctx.globalAlpha = Math.max(0, alpha);
        ctx.beginPath();
        ctx.arc(part.x, part.y, part.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1.0;

        if (part.life >= part.maxLife) {
          state.particles.splice(pIdx, 1);
        }
      });

      ctx.restore();

      // Request Next Frame
      animFrameIdRef.current = requestAnimationFrame(render);
    };

    animFrameIdRef.current = requestAnimationFrame(render);
    return () => {
      if (animFrameIdRef.current) cancelAnimationFrame(animFrameIdRef.current);
    };
  }, [gameState, gameMode, upgrades, empCharges, highScore, unlockAchievement]);

  return (
    <div className="relative w-full h-screen bg-slate-950 text-slate-100 overflow-hidden flex flex-col font-sans select-none">
      {/* Background Neon Grid Ambience */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-cyan-900/20 via-slate-950 to-slate-950 pointer-events-none" />

      {/* HEADER BAR */}
      <header className="relative z-20 flex items-center justify-between px-6 py-4 bg-slate-900/60 backdrop-blur-md border-b border-cyan-500/20">
        <div className="flex items-center gap-3">
          <Link
            href="/games"
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-cyan-400 border border-slate-700 transition"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm font-semibold">Games Hub</span>
          </Link>
          <div className="h-5 w-px bg-slate-800" />
          <div className="flex items-center gap-2">
            <Gamepad2 className="w-6 h-6 text-cyan-400 animate-pulse" />
            <h1 className="text-lg font-black tracking-wider bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-500 bg-clip-text text-transparent uppercase">
              Cyber Pulse 2099
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="flex items-center gap-4 text-xs font-mono">
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-950/50 border border-cyan-500/30 text-cyan-400">
              <Trophy className="w-3.5 h-3.5" />
              <span>HIGH: {highScore.toLocaleString()}</span>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-950/50 border border-amber-500/30 text-amber-400">
              <Sparkles className="w-3.5 h-3.5" />
              <span>CREDITS: {coins}</span>
            </div>
          </div>

          <button
            onClick={toggleMute}
            className="p-2 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-cyan-400 transition"
            title="Toggle Audio"
          >
            {isMuted ? <VolumeX className="w-5 h-5 text-red-400" /> : <Volume2 className="w-5 h-5 text-cyan-400" />}
          </button>
        </div>
      </header>

      {/* TOAST NOTIFICATION */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute top-20 left-1/2 -translate-x-1/2 z-50 px-5 py-2.5 rounded-xl bg-slate-900/90 border border-cyan-400/50 shadow-lg shadow-cyan-500/20 backdrop-blur-md text-cyan-300 text-sm font-semibold flex items-center gap-2"
          >
            <Sparkles className="w-4 h-4 text-amber-400 animate-spin" />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* MAIN GAME CONTAINER */}
      <div className="relative flex-1 flex items-center justify-center p-4">
        {/* CANVAS */}
        <canvas
          ref={canvasRef}
          width={1000}
          height={680}
          className="rounded-2xl border border-cyan-500/30 shadow-2xl shadow-cyan-950/50 bg-slate-950 max-w-full max-h-full object-contain"
        />

        {/* HUD OVERLAY (When Playing) */}
        {gameState === "PLAYING" && (
          <div className="absolute inset-4 pointer-events-none flex flex-col justify-between p-6">
            {/* Top HUD */}
            <div className="flex justify-between items-start">
              {/* Player Vitals */}
              <div className="flex flex-col gap-2 w-64 p-3 rounded-xl bg-slate-900/70 border border-slate-800 backdrop-blur-md">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="flex items-center gap-1 text-red-400 font-bold">
                    <Flame className="w-3.5 h-3.5" /> HULL HP
                  </span>
                  <span>{playerHp} / 100</span>
                </div>
                <div className="w-full bg-slate-950 h-2.5 rounded-full overflow-hidden border border-slate-800">
                  <div
                    className="bg-gradient-to-r from-red-600 to-pink-500 h-full transition-all duration-200"
                    style={{ width: `${playerHp}%` }}
                  />
                </div>

                <div className="flex items-center justify-between text-xs font-mono mt-1">
                  <span className="flex items-center gap-1 text-cyan-400 font-bold">
                    <Shield className="w-3.5 h-3.5" /> SHIELD
                  </span>
                  <span>{playerShield} MAX</span>
                </div>
                <div className="w-full bg-slate-950 h-2.5 rounded-full overflow-hidden border border-slate-800">
                  <div
                    className="bg-gradient-to-r from-cyan-500 to-blue-600 h-full transition-all duration-200"
                    style={{ width: `${(playerShield / (100 + (upgrades.shieldLevel - 1) * 25)) * 100}%` }}
                  />
                </div>
              </div>

              {/* Score & EMP Stats */}
              <div className="flex flex-col items-end gap-2">
                <div className="px-5 py-2 rounded-xl bg-slate-900/70 border border-cyan-500/30 backdrop-blur-md text-right">
                  <div className="text-xs font-mono text-slate-400 uppercase">Current Score</div>
                  <div className="text-2xl font-black text-cyan-400 font-mono tracking-wider">{score.toLocaleString()}</div>
                </div>

                {gameMode === "TIME_ATTACK" && (
                  <div className="px-4 py-1.5 rounded-lg bg-pink-950/70 border border-pink-500/40 text-pink-400 font-mono font-bold text-sm">
                    ⏱️ TIME LEFT: {timeRemaining}s
                  </div>
                )}

                <div className="flex items-center gap-2">
                  <button
                    onClick={triggerEMP}
                    className={cn(
                      "pointer-events-auto px-4 py-2 rounded-xl font-mono text-xs font-bold flex items-center gap-2 transition border shadow-lg",
                      empCharges > 0
                        ? "bg-cyan-500/20 hover:bg-cyan-500/40 text-cyan-300 border-cyan-400/50 shadow-cyan-500/20 cursor-pointer"
                        : "bg-slate-900/50 text-slate-600 border-slate-800 cursor-not-allowed"
                    )}
                  >
                    <Zap className="w-4 h-4 text-cyan-400" />
                    <span>EMP BLAST ({empCharges})</span>
                    <span className="text-[10px] text-slate-400">[Key E]</span>
                  </button>

                  <button
                    onClick={() => setGameState("PAUSED")}
                    className="pointer-events-auto p-2 rounded-xl bg-slate-900/70 border border-slate-800 hover:bg-slate-800 text-slate-300 transition"
                  >
                    <Pause className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Touch Controls Overlay for Mobile / Touch screens */}
            <div className="flex justify-between items-end pointer-events-auto md:hidden pb-4 px-2">
              {/* Virtual D-Pad / Joystick indicator */}
              <div
                className="w-28 h-28 rounded-full bg-slate-900/60 border border-cyan-500/30 backdrop-blur-md flex items-center justify-center touch-none"
                onTouchStart={e => {
                  const touch = e.touches[0];
                  const rect = e.currentTarget.getBoundingClientRect();
                  const cx = rect.left + rect.width / 2;
                  const cy = rect.top + rect.height / 2;
                  touchJoystickRef.current = {
                    active: true,
                    dx: (touch.clientX - cx) / (rect.width / 2),
                    dy: (touch.clientY - cy) / (rect.height / 2)
                  };
                }}
                onTouchMove={e => {
                  const touch = e.touches[0];
                  const rect = e.currentTarget.getBoundingClientRect();
                  const cx = rect.left + rect.width / 2;
                  const cy = rect.top + rect.height / 2;
                  touchJoystickRef.current = {
                    active: true,
                    dx: Math.max(-1, Math.min(1, (touch.clientX - cx) / (rect.width / 2))),
                    dy: Math.max(-1, Math.min(1, (touch.clientY - cy) / (rect.height / 2)))
                  };
                }}
                onTouchEnd={() => {
                  touchJoystickRef.current = { active: false, dx: 0, dy: 0 };
                }}
              >
                <Crosshair className="w-8 h-8 text-cyan-400/50" />
              </div>

              {/* Fire Button */}
              <div className="flex flex-col gap-3">
                <button
                  onTouchStart={() => (touchFireRef.current = true)}
                  onTouchEnd={() => (touchFireRef.current = false)}
                  className="w-20 h-20 rounded-full bg-red-600/80 active:bg-red-500 border-2 border-red-400 text-white font-bold flex items-center justify-center shadow-lg shadow-red-500/30"
                >
                  FIRE
                </button>
              </div>
            </div>
          </div>
        )}

        {/* MENU OVERLAY */}
        {gameState === "MENU" && (
          <div className="absolute inset-0 z-30 flex items-center justify-center p-6 bg-slate-950/80 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="max-w-xl w-full p-8 rounded-3xl bg-slate-900/90 border border-cyan-500/30 shadow-2xl shadow-cyan-950/80 text-center flex flex-col items-center gap-6"
            >
              <div className="relative">
                <div className="absolute -inset-1 rounded-full bg-gradient-to-r from-cyan-500 to-pink-500 opacity-75 blur" />
                <div className="relative p-4 rounded-full bg-slate-950 border border-cyan-400">
                  <Gamepad2 className="w-12 h-12 text-cyan-400" />
                </div>
              </div>

              <div>
                <h2 className="text-3xl font-black tracking-wider bg-gradient-to-r from-cyan-400 via-pink-400 to-purple-400 bg-clip-text text-transparent uppercase">
                  CYBER PULSE 2099
                </h2>
                <p className="text-sm text-slate-400 mt-2 max-w-md">
                  Pilot your high-tech starfighter against endless swarms of rogue mechs. Upgrade weapons, unleash EMP blasts, and dominate the leaderboard!
                </p>
              </div>

              {/* Game Mode Selector */}
              <div className="w-full flex flex-col gap-3">
                <div className="text-xs font-mono text-slate-400 uppercase tracking-widest">Select Game Mode</div>
                <div className="grid grid-cols-3 gap-3">
                  <button
                    onClick={() => startGame("SURVIVAL")}
                    className="p-4 rounded-2xl bg-gradient-to-b from-cyan-950/80 to-slate-900 border border-cyan-500/40 hover:border-cyan-400 hover:scale-105 transition flex flex-col items-center gap-2 group"
                  >
                    <ShieldAlert className="w-6 h-6 text-cyan-400 group-hover:animate-bounce" />
                    <span className="text-xs font-bold text-slate-200">Survival</span>
                  </button>

                  <button
                    onClick={() => startGame("BOSS_RUSH")}
                    className="p-4 rounded-2xl bg-gradient-to-b from-pink-950/80 to-slate-900 border border-pink-500/40 hover:border-pink-400 hover:scale-105 transition flex flex-col items-center gap-2 group"
                  >
                    <Flame className="w-6 h-6 text-pink-400 group-hover:animate-bounce" />
                    <span className="text-xs font-bold text-slate-200">Boss Rush</span>
                  </button>

                  <button
                    onClick={() => startGame("TIME_ATTACK")}
                    className="p-4 rounded-2xl bg-gradient-to-b from-amber-950/80 to-slate-900 border border-amber-500/40 hover:border-amber-400 hover:scale-105 transition flex flex-col items-center gap-2 group"
                  >
                    <Radio className="w-6 h-6 text-amber-400 group-hover:animate-bounce" />
                    <span className="text-xs font-bold text-slate-200">Time Attack</span>
                  </button>
                </div>
              </div>

              {/* Secondary Actions */}
              <div className="flex gap-4 w-full">
                <button
                  onClick={() => setGameState("SHOP")}
                  className="flex-1 py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-cyan-400 font-bold text-sm flex items-center justify-center gap-2 transition"
                >
                  <ShoppingBag className="w-4 h-4" />
                  <span>Ship Hangar</span>
                </button>
                <button
                  onClick={() => setGameState("ACHIEVEMENTS")}
                  className="flex-1 py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-amber-400 font-bold text-sm flex items-center justify-center gap-2 transition"
                >
                  <Trophy className="w-4 h-4" />
                  <span>Achievements</span>
                </button>
              </div>

              {/* Controls guide */}
              <div className="w-full p-4 rounded-xl bg-slate-950/60 border border-slate-800 text-xs text-slate-400 flex justify-around font-mono">
                <div><span className="text-cyan-400 font-bold">WASD / ARROWS</span> Move</div>
                <div><span className="text-cyan-400 font-bold">SPACE</span> Shoot</div>
                <div><span className="text-cyan-400 font-bold">E / SHIFT</span> EMP Blast</div>
              </div>
            </motion.div>
          </div>
        )}

        {/* SHOP / UPGRADES OVERLAY */}
        {gameState === "SHOP" && (
          <div className="absolute inset-0 z-30 flex items-center justify-center p-6 bg-slate-950/90 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="max-w-2xl w-full p-8 rounded-3xl bg-slate-900 border border-cyan-500/30 shadow-2xl flex flex-col gap-6"
            >
              <div className="flex justify-between items-center border-b border-slate-800 pb-4">
                <div className="flex items-center gap-3">
                  <ShoppingBag className="w-6 h-6 text-cyan-400" />
                  <h2 className="text-xl font-bold text-slate-100">Cyber Hangar Upgrades</h2>
                </div>
                <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-amber-950/50 border border-amber-500/40 text-amber-400 font-mono text-sm font-bold">
                  <Sparkles className="w-4 h-4" />
                  <span>{coins} Credits</span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Fire Rate */}
                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex justify-between items-center">
                  <div>
                    <div className="text-sm font-bold text-cyan-300">Rapid Plasma Cannon</div>
                    <div className="text-xs text-slate-400">Level {upgrades.fireRateLevel} / 5</div>
                  </div>
                  <button
                    disabled={upgrades.fireRateLevel >= 5 || coins < upgrades.fireRateLevel * 100}
                    onClick={() => purchaseUpgrade("fireRateLevel", upgrades.fireRateLevel * 100)}
                    className="px-4 py-2 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/40 disabled:opacity-40 text-cyan-300 text-xs font-bold border border-cyan-500/40 transition"
                  >
                    {upgrades.fireRateLevel >= 5 ? "MAX" : `Upgrade (${upgrades.fireRateLevel * 100} 💎)`}
                  </button>
                </div>

                {/* Damage */}
                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex justify-between items-center">
                  <div>
                    <div className="text-sm font-bold text-pink-300">High-Output Lasers</div>
                    <div className="text-xs text-slate-400">Level {upgrades.damageLevel} / 5</div>
                  </div>
                  <button
                    disabled={upgrades.damageLevel >= 5 || coins < upgrades.damageLevel * 120}
                    onClick={() => purchaseUpgrade("damageLevel", upgrades.damageLevel * 120)}
                    className="px-4 py-2 rounded-xl bg-pink-500/20 hover:bg-pink-500/40 disabled:opacity-40 text-pink-300 text-xs font-bold border border-pink-500/40 transition"
                  >
                    {upgrades.damageLevel >= 5 ? "MAX" : `Upgrade (${upgrades.damageLevel * 120} 💎)`}
                  </button>
                </div>

                {/* Shield Max */}
                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex justify-between items-center">
                  <div>
                    <div className="text-sm font-bold text-blue-300">Shield Matrix Capacity</div>
                    <div className="text-xs text-slate-400">Level {upgrades.shieldLevel} / 5</div>
                  </div>
                  <button
                    disabled={upgrades.shieldLevel >= 5 || coins < upgrades.shieldLevel * 80}
                    onClick={() => purchaseUpgrade("shieldLevel", upgrades.shieldLevel * 80)}
                    className="px-4 py-2 rounded-xl bg-blue-500/20 hover:bg-blue-500/40 disabled:opacity-40 text-blue-300 text-xs font-bold border border-blue-500/40 transition"
                  >
                    {upgrades.shieldLevel >= 5 ? "MAX" : `Upgrade (${upgrades.shieldLevel * 80} 💎)`}
                  </button>
                </div>

                {/* EMP Charges */}
                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex justify-between items-center">
                  <div>
                    <div className="text-sm font-bold text-purple-300">EMP Capacitor</div>
                    <div className="text-xs text-slate-400">Capacity: {upgrades.empCapacity}</div>
                  </div>
                  <button
                    disabled={upgrades.empCapacity >= 3 || coins < upgrades.empCapacity * 150}
                    onClick={() => purchaseUpgrade("empCapacity", upgrades.empCapacity * 150)}
                    className="px-4 py-2 rounded-xl bg-purple-500/20 hover:bg-purple-500/40 disabled:opacity-40 text-purple-300 text-xs font-bold border border-purple-500/40 transition"
                  >
                    {upgrades.empCapacity >= 3 ? "MAX" : `Upgrade (${upgrades.empCapacity * 150} 💎)`}
                  </button>
                </div>
              </div>

              <button
                onClick={() => setGameState("MENU")}
                className="w-full py-3 rounded-xl bg-slate-800 hover:bg-slate-700 font-bold text-slate-200 transition"
              >
                Back to Main Menu
              </button>
            </motion.div>
          </div>
        )}

        {/* ACHIEVEMENTS OVERLAY */}
        {gameState === "ACHIEVEMENTS" && (
          <div className="absolute inset-0 z-30 flex items-center justify-center p-6 bg-slate-950/90 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="max-w-xl w-full p-8 rounded-3xl bg-slate-900 border border-amber-500/30 shadow-2xl flex flex-col gap-6"
            >
              <div className="flex justify-between items-center border-b border-slate-800 pb-4">
                <div className="flex items-center gap-3">
                  <Trophy className="w-6 h-6 text-amber-400" />
                  <h2 className="text-xl font-bold text-slate-100">Mission Trophies & Badges</h2>
                </div>
                <div className="text-xs font-mono text-amber-400 font-bold px-3 py-1 rounded-full bg-amber-950/50 border border-amber-500/40">
                  {achievements.filter(a => a.unlocked).length} / {achievements.length} UNLOCKED
                </div>
              </div>

              <div className="flex flex-col gap-3 max-h-[340px] overflow-y-auto pr-1">
                {achievements.map(ach => (
                  <div
                    key={ach.id}
                    className={cn(
                      "p-4 rounded-2xl border flex items-center gap-4 transition",
                      ach.unlocked
                        ? "bg-amber-950/20 border-amber-500/40 text-slate-100"
                        : "bg-slate-950/60 border-slate-800 text-slate-500"
                    )}
                  >
                    <div className="text-3xl p-2 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center">
                      {ach.icon}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm">{ach.title}</span>
                        {ach.unlocked && (
                          <span className="text-[10px] uppercase tracking-wider font-mono font-bold text-amber-400 bg-amber-950/60 px-2 py-0.5 rounded-full border border-amber-500/30">
                            UNLOCKED
                          </span>
                        )}
                      </div>
                      <p className="text-xs mt-0.5 text-slate-400">{ach.desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              <button
                onClick={() => setGameState("MENU")}
                className="w-full py-3 rounded-xl bg-slate-800 hover:bg-slate-700 font-bold text-slate-200 transition"
              >
                Back to Main Menu
              </button>
            </motion.div>
          </div>
        )}

        {/* PAUSE OVERLAY */}
        {gameState === "PAUSED" && (
          <div className="absolute inset-0 z-30 flex items-center justify-center p-6 bg-slate-950/80 backdrop-blur-md">
            <div className="max-w-md w-full p-6 rounded-3xl bg-slate-900 border border-slate-800 text-center flex flex-col gap-4">
              <h3 className="text-2xl font-bold text-slate-100">SYSTEM PAUSED</h3>
              <div className="flex flex-col gap-3">
                <button
                  onClick={() => setGameState("PLAYING")}
                  className="py-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold transition"
                >
                  Resume Mission
                </button>
                <button
                  onClick={() => startGame(gameMode)}
                  className="py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold transition flex items-center justify-center gap-2"
                >
                  <RotateCcw className="w-4 h-4" /> Restart Mission
                </button>
                <button
                  onClick={() => setGameState("MENU")}
                  className="py-3 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200 transition"
                >
                  Abort to Main Menu
                </button>
              </div>
            </div>
          </div>
        )}

        {/* GAMEOVER OVERLAY */}
        {gameState === "GAMEOVER" && (
          <div className="absolute inset-0 z-30 flex items-center justify-center p-6 bg-slate-950/90 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="max-w-md w-full p-8 rounded-3xl bg-slate-900 border border-red-500/30 text-center flex flex-col items-center gap-5"
            >
              <div className="p-4 rounded-full bg-red-950/60 border border-red-500/40 text-red-400">
                <ShieldAlert className="w-10 h-10" />
              </div>

              <div>
                <h3 className="text-2xl font-black text-red-400 uppercase tracking-wider">CRITICAL HULL FAILURE</h3>
                <p className="text-xs text-slate-400 mt-1">Your ship was destroyed in combat</p>
              </div>

              <div className="w-full p-4 rounded-2xl bg-slate-950 border border-slate-800 flex flex-col gap-2 font-mono text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-400">Final Score</span>
                  <span className="text-cyan-400 font-bold">{score.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">High Score</span>
                  <span className="text-amber-400 font-bold">{highScore.toLocaleString()}</span>
                </div>
              </div>

              <div className="flex gap-3 w-full">
                <button
                  onClick={() => startGame(gameMode)}
                  className="flex-1 py-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold flex items-center justify-center gap-2 transition"
                >
                  <RotateCcw className="w-4 h-4" /> Try Again
                </button>
                <button
                  onClick={() => setGameState("MENU")}
                  className="py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold transition"
                >
                  Menu
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
}
