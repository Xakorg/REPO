"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Zap,
  Shield,
  Crosshair,
  Award,
  Volume2,
  VolumeX,
  Play,
  Pause,
  RotateCcw,
  Sparkles,
  Flame,
  Rocket,
  Cpu,
  Layers,
  Info,
  X,
  Trophy,
  ArrowLeft,
  Activity,
  Target
} from "lucide-react";
import Link from "next/link";

// ==========================================
// TYPES & GAME ENGINE STRUCTURES
// ==========================================

export interface ShipConfig {
  id: string;
  name: string;
  classTitle: string;
  description: string;
  maxHealth: number;
  maxShield: number;
  speed: number;
  primaryWeapon: "ion" | "plasma" | "quark";
  specialAbility: "emp" | "phase_dash" | "nova_beam";
  color: string;
  accentColor: string;
  statSpeed: number;
  statFirepower: number;
  statDefense: number;
}

export interface UpgradePerk {
  id: string;
  title: string;
  description: string;
  iconName: string;
  badge: string;
  type: "weapon" | "shield" | "speed" | "utility" | "special";
}

const SHIPS: ShipConfig[] = [
  {
    id: "valkyrie",
    name: "Valkyrie Prime",
    classTitle: "Interceptor Specialist",
    description: "High mobility starfighter equipped with twin Ion Cannons and Graviton EMP Shockwave technology.",
    maxHealth: 100,
    maxShield: 80,
    speed: 7.5,
    primaryWeapon: "ion",
    specialAbility: "emp",
    color: "#06b6d4", // Cyan
    accentColor: "#3b82f6",
    statSpeed: 9,
    statFirepower: 7,
    statDefense: 6
  },
  {
    id: "hyperion",
    name: "Hyperion Apex",
    classTitle: "Dreadnought Buster",
    description: "Heavy armored warship armed with Dual Plasma Cannons and Titan Aegis energy matrix.",
    maxHealth: 160,
    maxShield: 120,
    speed: 5.5,
    primaryWeapon: "plasma",
    specialAbility: "nova_beam",
    color: "#f59e0b", // Amber
    accentColor: "#ef4444",
    statSpeed: 5,
    statFirepower: 10,
    statDefense: 9
  },
  {
    id: "phantom",
    name: "Phantom Eclipse",
    classTitle: "Void Operative",
    description: "Agile stealth fighter with continuous Quark Lasers and Tachyon Phase-Dash iframe technology.",
    maxHealth: 85,
    maxShield: 70,
    speed: 9.0,
    primaryWeapon: "quark",
    specialAbility: "phase_dash",
    color: "#a855f7", // Purple
    accentColor: "#ec4899",
    statSpeed: 10,
    statFirepower: 8,
    statDefense: 5
  }
];

const PERK_POOL: UpgradePerk[] = [
  {
    id: "fire_rate",
    title: "Overclocked Coils",
    description: "Increase weapon firing rate by +25%.",
    iconName: "Zap",
    badge: "+25% Attack Speed",
    type: "weapon"
  },
  {
    id: "multishot",
    title: "Split-Matrix Array",
    description: "Add +1 extra projectile to your primary attack spread.",
    iconName: "Target",
    badge: "Extra Projectile",
    type: "weapon"
  },
  {
    id: "shield_boost",
    title: "Hyper-Capacitors",
    description: "Increase Maximum Energy Shield by +40 and restore instantly.",
    iconName: "Shield",
    badge: "+40 Max Shield",
    type: "shield"
  },
  {
    id: "crit_chance",
    title: "Targeting Matrix",
    description: "Increase critical hit chance by +20% for 2.5x damage.",
    iconName: "Crosshair",
    badge: "+20% Crit",
    type: "utility"
  },
  {
    id: "drone_support",
    title: "Tactical Wing-Drone",
    description: "Deploy an orbital combat drone that fires auto-homing laser bolts.",
    iconName: "Cpu",
    badge: "Companion Drone",
    type: "special"
  },
  {
    id: "emp_cooldown",
    title: "Tachyon Reactor",
    description: "Reduce Special Ability cooldown by 30%.",
    iconName: "Rocket",
    badge: "-30% Cooldown",
    type: "utility"
  },
  {
    id: "speed_boost",
    title: "Sub-Light Thrusters",
    description: "Increase movement velocity by +20% and dash distance.",
    iconName: "Flame",
    badge: "+20% Speed",
    type: "speed"
  },
  {
    id: "magnet_radius",
    title: "Graviton Attractor",
    description: "Double the pickup radius for Starlight XP Orbs & Health Cores.",
    iconName: "Sparkles",
    badge: "2x Pickup Range",
    type: "utility"
  }
];

const ACHIEVEMENTS = [
  { id: "first_blood", title: "First Eclipse", desc: "Destroy your first enemy ship.", key: "kills", target: 1 },
  { id: "wave_5", title: "Sector Defender", desc: "Reach Wave 5.", key: "wave", target: 5 },
  { id: "score_10k", title: "Ace Pilot", desc: "Score over 10,000 points.", key: "score", target: 10000 },
  { id: "boss_slayer", title: "Leviathan Down", desc: "Defeat a Dreadnought Boss.", key: "bossKills", target: 1 },
  { id: "combo_master", title: "Unstoppable Surge", desc: "Reach a 5.0x Combo Multiplier.", key: "maxCombo", target: 5 }
];

// ==========================================
// WEB AUDIO SYNTHESIZER (No External Assets)
// ==========================================

class AudioEngine {
  ctx: AudioContext | null = null;
  muted: boolean = false;

  init() {
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

  playLaser(pitchMultiplier = 1) {
    if (this.muted || !this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(800 * pitchMultiplier, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(120 * pitchMultiplier, this.ctx.currentTime + 0.12);

      gain.gain.setValueAtTime(0.15, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.12);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.12);
    } catch (e) {}
  }

  playExplosion(heavy = false) {
    if (this.muted || !this.ctx) return;
    try {
      const duration = heavy ? 0.6 : 0.3;
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
      filter.frequency.setValueAtTime(heavy ? 300 : 600, this.ctx.currentTime);
      filter.frequency.linearRampToValueAtTime(40, this.ctx.currentTime + duration);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(heavy ? 0.35 : 0.2, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + duration);

      whiteNoise.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);
      whiteNoise.start();
    } catch (e) {}
  }

  playEMP() {
    if (this.muted || !this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(150, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1200, this.ctx.currentTime + 0.4);
      osc.frequency.exponentialRampToValueAtTime(100, this.ctx.currentTime + 0.8);

      gain.gain.setValueAtTime(0.3, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.8);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.8);
    } catch (e) {}
  }

  playLevelUp() {
    if (this.muted || !this.ctx) return;
    try {
      const notes = [440, 554.37, 659.25, 880];
      notes.forEach((freq, idx) => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();
        osc.type = "triangle";
        osc.frequency.setValueAtTime(freq, this.ctx!.currentTime + idx * 0.08);

        gain.gain.setValueAtTime(0.2, this.ctx!.currentTime + idx * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx!.currentTime + idx * 0.08 + 0.25);

        osc.connect(gain);
        gain.connect(this.ctx!.destination);
        osc.start(this.ctx!.currentTime + idx * 0.08);
        osc.stop(this.ctx!.currentTime + idx * 0.08 + 0.25);
      });
    } catch (e) {}
  }

  playPickup() {
    if (this.muted || !this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(600, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1400, this.ctx.currentTime + 0.1);

      gain.gain.setValueAtTime(0.15, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.1);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.1);
    } catch (e) {}
  }
}

const audio = new AudioEngine();

// ==========================================
// MAIN GAME COMPONENT
// ==========================================

export default function AetherisAstralEclipse() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Game state
  const [gameState, setGameState] = useState<"menu" | "playing" | "paused" | "perk_select" | "game_over">("menu");
  const [selectedShip, setSelectedShip] = useState<ShipConfig>(SHIPS[0]);
  const [soundEnabled, setSoundEnabled] = useState(true);

  // HUD stats
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [wave, setWave] = useState(1);
  const [health, setHealth] = useState(100);
  const [maxHealth, setMaxHealth] = useState(100);
  const [shield, setShield] = useState(80);
  const [maxShield, setMaxShield] = useState(80);
  const [level, setLevel] = useState(1);
  const [xp, setXp] = useState(0);
  const [nextXp, setNextXp] = useState(100);
  const [combo, setCombo] = useState(1.0);
  const [abilityCooldown, setAbilityCooldown] = useState(0); // 0 to 1 ratio
  const [availablePerks, setAvailablePerks] = useState<UpgradePerk[]>([]);
  const [activePerks, setActivePerks] = useState<string[]>([]);
  const [unlockedAchievements, setUnlockedAchievements] = useState<string[]>([]);
  const [showAchievementsModal, setShowAchievementsModal] = useState(false);

  // End Game Stats
  const [finalStats, setFinalStats] = useState({
    kills: 0,
    bossKills: 0,
    waveReached: 1,
    score: 0,
    maxCombo: 1.0,
    leaderboardPoints: 0
  });

  // Game Logic Ref (Avoid React re-render lag during 60FPS loop)
  const engineRef = useRef({
    keys: { w: false, a: false, s: false, d: false, space: false, shift: false, mouseX: 0, mouseY: 0, mouseDown: false },
    player: {
      x: 0,
      y: 0,
      vx: 0,
      vy: 0,
      radius: 18,
      rotation: 0,
      health: 100,
      maxHealth: 100,
      shield: 80,
      maxShield: 80,
      speed: 7.5,
      fireRateCooldown: 0,
      abilityCooldown: 0,
      abilityMaxCooldown: 300, // 5 seconds at 60fps
      isDashing: false,
      dashFrames: 0,
      invulnerable: false,
      droneAngle: 0,
      hasDrone: false,
      multishot: 1,
      fireRateMultiplier: 1,
      critChance: 0.05,
      magnetRadius: 100,
      combo: 1.0,
      comboTimer: 0
    },
    bullets: [] as any[],
    enemyBullets: [] as any[],
    enemies: [] as any[],
    particles: [] as any[],
    orbs: [] as any[],
    stars: [] as any[],
    boss: null as any,
    wave: 1,
    waveTimer: 0,
    score: 0,
    kills: 0,
    bossKills: 0,
    maxCombo: 1.0,
    level: 1,
    xp: 0,
    nextXp: 100,
    lastFrameTime: 0,
    animFrameId: 0
  });

  // Toggle Mute
  const toggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    audio.muted = !next;
  };

  // Load High Score & Achievements from LocalStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedScore = localStorage.getItem("aetheris_high_score");
      if (savedScore) setHighScore(parseInt(savedScore, 10));

      const savedAchievements = localStorage.getItem("aetheris_achievements");
      if (savedAchievements) {
        try {
          setUnlockedAchievements(JSON.parse(savedAchievements));
        } catch (e) {}
      }
    }
  }, []);

  // Save High Score
  const checkHighScore = (currentScore: number) => {
    if (currentScore > highScore) {
      setHighScore(currentScore);
      if (typeof window !== "undefined") {
        localStorage.setItem("aetheris_high_score", currentScore.toString());
      }
    }
  };

  // Trigger Achievement Check
  const checkAchievements = (stats: { kills: number; wave: number; score: number; bossKills: number; maxCombo: number }) => {
    const newlyUnlocked: string[] = [];
    ACHIEVEMENTS.forEach(ach => {
      if (!unlockedAchievements.includes(ach.id)) {
        const val = (stats as any)[ach.key] || 0;
        if (val >= ach.target) {
          newlyUnlocked.push(ach.id);
        }
      }
    });

    if (newlyUnlocked.length > 0) {
      const updated = [...unlockedAchievements, ...newlyUnlocked];
      setUnlockedAchievements(updated);
      if (typeof window !== "undefined") {
        localStorage.setItem("aetheris_achievements", JSON.stringify(updated));
      }
    }
  };

  // Dispatch Score Event to Xakteir Global Leaderboard
  const dispatchXakteirScore = (finalScore: number) => {
    if (typeof window !== "undefined" && finalScore > 0) {
      const pointsEarned = Math.floor(finalScore / 100) + 15;
      const scoreEvent = new CustomEvent("xakteir-game-score", {
        detail: {
          score: finalScore,
          points: pointsEarned
        }
      });
      window.dispatchEvent(scoreEvent);
    }
  };

  // ==========================================
  // GAME ENGINE LOOPS & RENDERING
  // ==========================================

  const initGame = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const width = (canvas.width = canvas.parentElement?.clientWidth || window.innerWidth);
    const height = (canvas.height = canvas.parentElement?.clientHeight || window.innerHeight);

    // Initialize Stars Parallax
    const stars = [];
    for (let i = 0; i < 150; i++) {
      stars.push({
        x: Math.random() * width,
        y: Math.random() * height,
        size: Math.random() * 2 + 0.5,
        speed: Math.random() * 1.5 + 0.2,
        alpha: Math.random() * 0.8 + 0.2
      });
    }

    const ship = selectedShip;
    const engine = engineRef.current;

    engine.player = {
      x: width / 2,
      y: height * 0.75,
      vx: 0,
      vy: 0,
      radius: 18,
      rotation: 0,
      health: ship.maxHealth,
      maxHealth: ship.maxHealth,
      shield: ship.maxShield,
      maxShield: ship.maxShield,
      speed: ship.speed,
      fireRateCooldown: 0,
      abilityCooldown: 0,
      abilityMaxCooldown: ship.specialAbility === "phase_dash" ? 180 : 300,
      isDashing: false,
      dashFrames: 0,
      invulnerable: false,
      droneAngle: 0,
      hasDrone: false,
      multishot: 1,
      fireRateMultiplier: 1,
      critChance: 0.05,
      magnetRadius: 100,
      combo: 1.0,
      comboTimer: 0
    };

    engine.bullets = [];
    engine.enemyBullets = [];
    engine.enemies = [];
    engine.particles = [];
    engine.orbs = [];
    engine.stars = stars;
    engine.boss = null;
    engine.wave = 1;
    engine.waveTimer = 0;
    engine.score = 0;
    engine.kills = 0;
    engine.bossKills = 0;
    engine.maxCombo = 1.0;
    engine.level = 1;
    engine.xp = 0;
    engine.nextXp = 100;

    setScore(0);
    setWave(1);
    setHealth(ship.maxHealth);
    setMaxHealth(ship.maxHealth);
    setShield(ship.maxShield);
    setMaxShield(ship.maxShield);
    setLevel(1);
    setXp(0);
    setNextXp(100);
    setCombo(1.0);
    setActivePerks([]);
  }, [selectedShip]);

  // Handle Player Level Up
  const triggerLevelUp = useCallback(() => {
    audio.playLevelUp();

    // Pick 3 random perks from pool
    const shuffled = [...PERK_POOL].sort(() => 0.5 - Math.random());
    setAvailablePerks(shuffled.slice(0, 3));
    setGameState("perk_select");
  }, []);

  // Apply Upgrade Perk Choice
  const selectPerk = (perk: UpgradePerk) => {
    const engine = engineRef.current;
    const player = engine.player;

    switch (perk.id) {
      case "fire_rate":
        player.fireRateMultiplier *= 1.25;
        break;
      case "multishot":
        player.multishot = Math.min(player.multishot + 1, 5);
        break;
      case "shield_boost":
        player.maxShield += 40;
        player.shield = player.maxShield;
        setMaxShield(player.maxShield);
        setShield(player.shield);
        break;
      case "crit_chance":
        player.critChance = Math.min(player.critChance + 0.2, 0.75);
        break;
      case "drone_support":
        player.hasDrone = true;
        break;
      case "emp_cooldown":
        player.abilityMaxCooldown = Math.max(player.abilityMaxCooldown * 0.7, 100);
        break;
      case "speed_boost":
        player.speed *= 1.2;
        break;
      case "magnet_radius":
        player.magnetRadius *= 2;
        break;
    }

    setActivePerks(prev => [...prev, perk.title]);
    setGameState("playing");
  };

  // Main Canvas Render & Game Loop
  useEffect(() => {
    let animId: number;

    const runLoop = () => {
      if (gameState === "playing") {
        updateGameLogic();
      }
      renderCanvas();
      animId = requestAnimationFrame(runLoop);
    };

    const updateGameLogic = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const width = canvas.width;
      const height = canvas.height;
      const engine = engineRef.current;
      const player = engine.player;
      const keys = engine.keys;

      // 1. Move Stars
      engine.stars.forEach(star => {
        star.y += star.speed * (keys.w ? 2.5 : 1);
        if (star.y > height) {
          star.y = 0;
          star.x = Math.random() * width;
        }
      });

      // 2. Player Input Movement & Physics
      let dx = 0;
      let dy = 0;
      if (keys.w || keys.s || keys.a || keys.d) {
        if (keys.w) dy -= 1;
        if (keys.s) dy += 1;
        if (keys.a) dx -= 1;
        if (keys.d) dx += 1;
      }

      if (dx !== 0 && dy !== 0) {
        dx *= 0.7071;
        dy *= 0.7071;
      }

      const targetVx = dx * player.speed;
      const targetVy = dy * player.speed;

      player.vx += (targetVx - player.vx) * 0.2;
      player.vy += (targetVy - player.vy) * 0.2;

      player.x += player.vx;
      player.y += player.vy;

      // Screen Boundary Clamp
      player.x = Math.max(player.radius, Math.min(width - player.radius, player.x));
      player.y = Math.max(player.radius, Math.min(height - player.radius, player.y));

      // Aim Rotation
      if (keys.mouseX || keys.mouseY) {
        player.rotation = Math.atan2(keys.mouseY - player.y, keys.mouseX - player.x);
      } else {
        player.rotation = -Math.PI / 2; // Default up
      }

      // Engine Exhaust Particles
      if (Math.random() < 0.8) {
        const angle = player.rotation + Math.PI + (Math.random() - 0.5) * 0.4;
        engine.particles.push({
          x: player.x - Math.cos(player.rotation) * 15,
          y: player.y - Math.sin(player.rotation) * 15,
          vx: Math.cos(angle) * (Math.random() * 3 + 2),
          vy: Math.sin(angle) * (Math.random() * 3 + 2),
          radius: Math.random() * 3 + 1,
          color: selectedShip.color,
          alpha: 1,
          life: 20
        });
      }

      // 3. Ability Cooldown & Activation
      if (player.abilityCooldown > 0) {
        player.abilityCooldown--;
        setAbilityCooldown(player.abilityCooldown / player.abilityMaxCooldown);
      }

      if (keys.space && player.abilityCooldown <= 0) {
        player.abilityCooldown = player.abilityMaxCooldown;

        if (selectedShip.specialAbility === "emp") {
          audio.playEMP();
          // Clear all enemy bullets
          engine.enemyBullets = [];
          // Damage all enemies
          engine.enemies.forEach(e => {
            e.health -= 80;
          });
          // Visual Shockwave
          for (let i = 0; i < 360; i += 10) {
            const rad = (i * Math.PI) / 180;
            engine.particles.push({
              x: player.x,
              y: player.y,
              vx: Math.cos(rad) * 12,
              vy: Math.sin(rad) * 12,
              radius: 4,
              color: "#06b6d4",
              alpha: 1,
              life: 30
            });
          }
        } else if (selectedShip.specialAbility === "phase_dash") {
          audio.playLaser(1.8);
          player.isDashing = true;
          player.dashFrames = 15;
          player.invulnerable = true;
          player.vx *= 2.5;
          player.vy *= 2.5;
        } else if (selectedShip.specialAbility === "nova_beam") {
          audio.playLaser(0.5);
          // Giant Vertical Laser Barrage
          for (let i = -100; i <= 100; i += 20) {
            engine.bullets.push({
              x: player.x + i,
              y: player.y - 20,
              vx: 0,
              vy: -20,
              radius: 8,
              damage: 45,
              color: "#f59e0b",
              isNova: true
            });
          }
        }
      }

      // Handle Dash Frames
      if (player.isDashing) {
        player.dashFrames--;
        if (player.dashFrames <= 0) {
          player.isDashing = false;
          player.invulnerable = false;
        }
      }

      // 4. Primary Weapon Firing
      if (player.fireRateCooldown > 0) {
        player.fireRateCooldown--;
      }

      if ((keys.mouseDown || keys.space) && player.fireRateCooldown <= 0) {
        const baseCooldown = selectedShip.primaryWeapon === "quark" ? 6 : selectedShip.primaryWeapon === "plasma" ? 14 : 10;
        player.fireRateCooldown = Math.max(4, Math.floor(baseCooldown / player.fireRateMultiplier));

        audio.playLaser();

        const isCrit = Math.random() < player.critChance;
        const damageMultiplier = isCrit ? 2.5 : 1.0;

        const count = player.multishot;
        const spreadAngle = 0.12;

        for (let i = 0; i < count; i++) {
          const offset = (i - (count - 1) / 2) * spreadAngle;
          const angle = player.rotation + offset;

          engine.bullets.push({
            x: player.x + Math.cos(angle) * 20,
            y: player.y + Math.sin(angle) * 20,
            vx: Math.cos(angle) * 16,
            vy: Math.sin(angle) * 16,
            radius: isCrit ? 6 : 4,
            damage: (selectedShip.primaryWeapon === "plasma" ? 35 : 20) * damageMultiplier,
            color: isCrit ? "#ef4444" : selectedShip.color,
            isCrit: isCrit
          });
        }
      }

      // Companion Drone Firing
      if (player.hasDrone) {
        player.droneAngle += 0.05;
        const droneX = player.x + Math.cos(player.droneAngle) * 45;
        const droneY = player.y + Math.sin(player.droneAngle) * 45;

        if (Math.random() < 0.08 && engine.enemies.length > 0) {
          // Target nearest enemy
          const target = engine.enemies[0];
          const angle = Math.atan2(target.y - droneY, target.x - droneX);

          engine.bullets.push({
            x: droneX,
            y: droneY,
            vx: Math.cos(angle) * 14,
            vy: Math.sin(angle) * 14,
            radius: 3,
            damage: 15,
            color: "#ec4899"
          });
        }
      }

      // 5. Update Bullets
      for (let i = engine.bullets.length - 1; i >= 0; i--) {
        const b = engine.bullets[i];
        b.x += b.vx;
        b.y += b.vy;

        if (b.x < -20 || b.x > width + 20 || b.y < -20 || b.y > height + 20) {
          engine.bullets.splice(i, 1);
        }
      }

      // Update Enemy Bullets
      for (let i = engine.enemyBullets.length - 1; i >= 0; i--) {
        const eb = engine.enemyBullets[i];
        eb.x += eb.vx;
        eb.y += eb.vy;

        // Collision with player
        if (!player.invulnerable) {
          const dist = Math.hypot(eb.x - player.x, eb.y - player.y);
          if (dist < player.radius + eb.radius) {
            audio.playExplosion();
            takePlayerDamage(eb.damage || 15);
            engine.enemyBullets.splice(i, 1);
            continue;
          }
        }

        if (eb.x < -20 || eb.x > width + 20 || eb.y < -20 || eb.y > height + 20) {
          engine.enemyBullets.splice(i, 1);
        }
      }

      // 6. Wave Spawner & Enemy AI
      engine.waveTimer++;
      const targetEnemyCount = Math.min(8 + engine.wave * 3, 28);

      if (engine.enemies.length < targetEnemyCount && Math.random() < 0.05) {
        const typeRoll = Math.random();
        let enemyType: "scout" | "interceptor" | "heavy" = "scout";
        if (typeRoll > 0.7) enemyType = "heavy";
        else if (typeRoll > 0.4) enemyType = "interceptor";

        const spawnX = Math.random() * (width - 60) + 30;
        engine.enemies.push({
          x: spawnX,
          y: -40,
          vx: (Math.random() - 0.5) * 2,
          vy: Math.random() * 1.5 + 1.5,
          radius: enemyType === "heavy" ? 28 : enemyType === "interceptor" ? 20 : 14,
          health: enemyType === "heavy" ? 120 : enemyType === "interceptor" ? 50 : 25,
          maxHealth: enemyType === "heavy" ? 120 : enemyType === "interceptor" ? 50 : 25,
          type: enemyType,
          fireCooldown: Math.floor(Math.random() * 60) + 30,
          color: enemyType === "heavy" ? "#ef4444" : enemyType === "interceptor" ? "#a855f7" : "#34d399"
        });
      }

      // Boss Spawn on Wave Milestones
      if (engine.wave % 5 === 0 && !engine.boss && engine.waveTimer > 300) {
        audio.playEMP();
        engine.boss = {
          x: width / 2,
          y: -100,
          targetY: 120,
          radius: 55,
          health: 800 + engine.wave * 300,
          maxHealth: 800 + engine.wave * 300,
          phase: 1,
          attackTimer: 0,
          color: "#f43f5e"
        };
      }

      // Update Boss AI
      if (engine.boss) {
        const boss = engine.boss;
        if (boss.y < boss.targetY) boss.y += 2;

        boss.attackTimer++;
        if (boss.attackTimer % 45 === 0) {
          // Spiral Bullet Ring
          audio.playLaser(0.7);
          const bulletsCount = 12 + boss.phase * 4;
          for (let i = 0; i < bulletsCount; i++) {
            const rad = (i * (360 / bulletsCount) * Math.PI) / 180 + boss.attackTimer * 0.05;
            engine.enemyBullets.push({
              x: boss.x,
              y: boss.y,
              vx: Math.cos(rad) * 4,
              vy: Math.sin(rad) * 4,
              radius: 5,
              damage: 20
            });
          }
        }

        // Check player bullets vs Boss
        for (let i = engine.bullets.length - 1; i >= 0; i--) {
          const b = engine.bullets[i];
          const dist = Math.hypot(b.x - boss.x, b.y - boss.y);
          if (dist < boss.radius + b.radius) {
            boss.health -= b.damage;
            createHitParticles(b.x, b.y, b.color);
            engine.bullets.splice(i, 1);

            if (boss.health <= 0) {
              audio.playExplosion(true);
              createExplosion(boss.x, boss.y, 60, "#f43f5e");
              engine.score += 2500 * engine.wave;
              engine.bossKills++;
              engine.boss = null;
              engine.wave++;
              setWave(engine.wave);
              break;
            }
          }
        }
      }

      // Update Enemies
      for (let eIdx = engine.enemies.length - 1; eIdx >= 0; eIdx--) {
        const enemy = engine.enemies[eIdx];
        enemy.x += enemy.vx;
        enemy.y += enemy.vy;

        // Enemy Shooting AI
        enemy.fireCooldown--;
        if (enemy.fireCooldown <= 0) {
          enemy.fireCooldown = enemy.type === "heavy" ? 70 : 100;
          const angle = Math.atan2(player.y - enemy.y, player.x - enemy.x);
          engine.enemyBullets.push({
            x: enemy.x,
            y: enemy.y,
            vx: Math.cos(angle) * 5,
            vy: Math.sin(angle) * 5,
            radius: 4,
            damage: 15
          });
        }

        // Enemy Player Collision
        if (!player.invulnerable) {
          const dist = Math.hypot(enemy.x - player.x, enemy.y - player.y);
          if (dist < player.radius + enemy.radius) {
            audio.playExplosion();
            takePlayerDamage(30);
            createExplosion(enemy.x, enemy.y, 15, enemy.color);
            engine.enemies.splice(eIdx, 1);
            continue;
          }
        }

        // Bullet Collisions
        for (let bIdx = engine.bullets.length - 1; bIdx >= 0; bIdx--) {
          const b = engine.bullets[bIdx];
          const dist = Math.hypot(b.x - enemy.x, b.y - enemy.y);
          if (dist < enemy.radius + b.radius) {
            enemy.health -= b.damage;
            createHitParticles(b.x, b.y, b.color);

            if (!b.isNova) engine.bullets.splice(bIdx, 1);

            if (enemy.health <= 0) {
              audio.playExplosion();
              createExplosion(enemy.x, enemy.y, 20, enemy.color);

              // Add Score & XP
              const points = (enemy.type === "heavy" ? 300 : 100) * engine.player.combo;
              engine.score += Math.floor(points);
              engine.kills++;
              engine.xp += enemy.type === "heavy" ? 45 : 20;

              // Combo Boost
              engine.player.combo = Math.min(engine.player.combo + 0.1, 5.0);
              engine.player.comboTimer = 180;
              if (engine.player.combo > engine.maxCombo) engine.maxCombo = engine.player.combo;

              // Spawn XP / Health Orbs
              engine.orbs.push({
                x: enemy.x,
                y: enemy.y,
                type: Math.random() < 0.15 ? "health" : "xp",
                value: 20,
                radius: 6
              });

              // Level Check
              if (engine.xp >= engine.nextXp) {
                engine.level++;
                engine.xp -= engine.nextXp;
                engine.nextXp = Math.floor(engine.nextXp * 1.4);
                setLevel(engine.level);
                setXp(engine.xp);
                setNextXp(engine.nextXp);
                triggerLevelUp();
              }

              engine.enemies.splice(eIdx, 1);
              break;
            }
          }
        }

        if (enemy.y > height + 50) {
          engine.enemies.splice(eIdx, 1);
        }
      }

      // 7. Update Starlight Orbs (Magnetic Pickup)
      for (let oIdx = engine.orbs.length - 1; oIdx >= 0; oIdx--) {
        const orb = engine.orbs[oIdx];
        const dist = Math.hypot(player.x - orb.x, player.y - orb.y);

        if (dist < player.magnetRadius) {
          const angle = Math.atan2(player.y - orb.y, player.x - orb.x);
          orb.x += Math.cos(angle) * 8;
          orb.y += Math.sin(angle) * 8;
        } else {
          orb.y += 1;
        }

        if (dist < player.radius + orb.radius) {
          audio.playPickup();
          if (orb.type === "health") {
            player.health = Math.min(player.maxHealth, player.health + 25);
            setHealth(player.health);
          } else {
            engine.score += 50;
            engine.xp += 15;
            setXp(engine.xp);
          }
          engine.orbs.splice(oIdx, 1);
        }
      }

      // Combo Decay Timer
      if (engine.player.comboTimer > 0) {
        engine.player.comboTimer--;
        if (engine.player.comboTimer <= 0) {
          engine.player.combo = 1.0;
        }
      }

      // Wave Advancement
      if (engine.waveTimer > 900 && engine.enemies.length === 0 && !engine.boss) {
        engine.waveTimer = 0;
        engine.wave++;
        setWave(engine.wave);
      }

      // Sync React HUD state
      setScore(engine.score);
      setCombo(parseFloat(engine.player.combo.toFixed(1)));
      setHealth(player.health);
      setShield(player.shield);
    };

    const takePlayerDamage = (amount: number) => {
      const engine = engineRef.current;
      const player = engine.player;

      // Reset Combo on Damage
      player.combo = 1.0;

      // Shield absorbs first
      if (player.shield > 0) {
        if (player.shield >= amount) {
          player.shield -= amount;
        } else {
          const remainder = amount - player.shield;
          player.shield = 0;
          player.health -= remainder;
        }
      } else {
        player.health -= amount;
      }

      setShield(player.shield);
      setHealth(player.health);

      if (player.health <= 0) {
        audio.playExplosion(true);
        // Game Over
        const points = Math.floor(engine.score / 100) + 15;
        const stats = {
          kills: engine.kills,
          bossKills: engine.bossKills,
          waveReached: engine.wave,
          score: engine.score,
          maxCombo: engine.maxCombo,
          leaderboardPoints: points
        };

        setFinalStats(stats);
        checkHighScore(engine.score);
        checkAchievements(stats);
        dispatchXakteirScore(engine.score);
        setGameState("game_over");
      }
    };

    const createHitParticles = (x: number, y: number, color: string) => {
      const engine = engineRef.current;
      for (let i = 0; i < 6; i++) {
        const angle = Math.random() * Math.PI * 2;
        engine.particles.push({
          x,
          y,
          vx: Math.cos(angle) * (Math.random() * 4 + 1),
          vy: Math.sin(angle) * (Math.random() * 4 + 1),
          radius: Math.random() * 2 + 1,
          color,
          alpha: 1,
          life: 15
        });
      }
    };

    const createExplosion = (x: number, y: number, count: number, color: string) => {
      const engine = engineRef.current;
      for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        engine.particles.push({
          x,
          y,
          vx: Math.cos(angle) * (Math.random() * 8 + 2),
          vy: Math.sin(angle) * (Math.random() * 8 + 2),
          radius: Math.random() * 4 + 2,
          color,
          alpha: 1,
          life: 35
        });
      }
    };

    // Canvas Renderer
    const renderCanvas = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const width = canvas.width;
      const height = canvas.height;
      const engine = engineRef.current;
      const player = engine.player;

      // Background Clear
      ctx.fillStyle = "#05030d";
      ctx.fillRect(0, 0, width, height);

      // Draw Stars
      engine.stars.forEach(star => {
        ctx.fillStyle = `rgba(255, 255, 255, ${star.alpha})`;
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
        ctx.fill();
      });

      // Draw Particles
      for (let i = engine.particles.length - 1; i >= 0; i--) {
        const p = engine.particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.alpha -= 1 / p.life;

        if (p.alpha <= 0) {
          engine.particles.splice(i, 1);
          continue;
        }

        ctx.fillStyle = p.color;
        ctx.globalAlpha = Math.max(0, p.alpha);
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;

      // Draw Starlight Orbs
      engine.orbs.forEach(orb => {
        ctx.shadowBlur = 12;
        ctx.shadowColor = orb.type === "health" ? "#ef4444" : "#f59e0b";
        ctx.fillStyle = orb.type === "health" ? "#ef4444" : "#f59e0b";
        ctx.beginPath();
        ctx.arc(orb.x, orb.y, orb.radius, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.shadowBlur = 0;

      // Draw Bullets
      engine.bullets.forEach(b => {
        ctx.shadowBlur = 10;
        ctx.shadowColor = b.color;
        ctx.fillStyle = b.color;
        ctx.beginPath();
        ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.shadowBlur = 0;

      // Draw Enemy Bullets
      engine.enemyBullets.forEach(eb => {
        ctx.fillStyle = "#f43f5e";
        ctx.beginPath();
        ctx.arc(eb.x, eb.y, eb.radius, 0, Math.PI * 2);
        ctx.fill();
      });

      // Draw Enemies
      engine.enemies.forEach(enemy => {
        ctx.save();
        ctx.translate(enemy.x, enemy.y);
        ctx.fillStyle = enemy.color;
        ctx.shadowBlur = 15;
        ctx.shadowColor = enemy.color;

        if (enemy.type === "heavy") {
          // Hexagon shape
          ctx.beginPath();
          for (let i = 0; i < 6; i++) {
            const rad = (i * 60 * Math.PI) / 180;
            const px = Math.cos(rad) * enemy.radius;
            const py = Math.sin(rad) * enemy.radius;
            if (i === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
          }
          ctx.closePath();
          ctx.fill();
        } else {
          // Triangle craft pointing down
          ctx.beginPath();
          ctx.moveTo(0, enemy.radius);
          ctx.lineTo(-enemy.radius, -enemy.radius);
          ctx.lineTo(enemy.radius, -enemy.radius);
          ctx.closePath();
          ctx.fill();
        }

        // Enemy Health Bar
        if (enemy.health < enemy.maxHealth) {
          ctx.fillStyle = "rgba(255,255,255,0.2)";
          ctx.fillRect(-enemy.radius, -enemy.radius - 10, enemy.radius * 2, 4);
          ctx.fillStyle = "#ef4444";
          ctx.fillRect(-enemy.radius, -enemy.radius - 10, (enemy.radius * 2 * enemy.health) / enemy.maxHealth, 4);
        }
        ctx.restore();
      });

      // Draw Boss
      if (engine.boss) {
        const boss = engine.boss;
        ctx.save();
        ctx.translate(boss.x, boss.y);
        ctx.shadowBlur = 30;
        ctx.shadowColor = boss.color;

        ctx.fillStyle = "#1e1b4b";
        ctx.strokeStyle = boss.color;
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(0, 0, boss.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Boss Health Bar Header
        ctx.restore();
        ctx.fillStyle = "rgba(0,0,0,0.6)";
        ctx.fillRect(width / 2 - 200, 20, 400, 16);
        ctx.fillStyle = "#f43f5e";
        ctx.fillRect(width / 2 - 200, 20, (400 * boss.health) / boss.maxHealth, 16);
      }

      // Draw Player Starfighter
      if (gameState === "playing" || gameState === "paused" || gameState === "perk_select") {
        ctx.save();
        ctx.translate(player.x, player.y);
        ctx.rotate(player.rotation);

        ctx.shadowBlur = 20;
        ctx.shadowColor = selectedShip.color;

        // Main Wing Body
        ctx.fillStyle = selectedShip.color;
        ctx.beginPath();
        ctx.moveTo(player.radius + 6, 0);
        ctx.lineTo(-player.radius, -player.radius + 2);
        ctx.lineTo(-player.radius / 2, 0);
        ctx.lineTo(-player.radius, player.radius - 2);
        ctx.closePath();
        ctx.fill();

        // Cockpit Glow
        ctx.fillStyle = "#ffffff";
        ctx.beginPath();
        ctx.arc(2, 0, 5, 0, Math.PI * 2);
        ctx.fill();

        // Shield Aura
        if (player.shield > 0) {
          ctx.strokeStyle = `rgba(6, 182, 212, ${player.shield / player.maxShield})`;
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.arc(0, 0, player.radius + 8, 0, Math.PI * 2);
          ctx.stroke();
        }

        ctx.restore();

        // Draw Drone
        if (player.hasDrone) {
          const droneX = player.x + Math.cos(player.droneAngle) * 45;
          const droneY = player.y + Math.sin(player.droneAngle) * 45;
          ctx.fillStyle = "#ec4899";
          ctx.shadowBlur = 10;
          ctx.shadowColor = "#ec4899";
          ctx.beginPath();
          ctx.arc(droneX, droneY, 6, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    };

    animId = requestAnimationFrame(runLoop);

    return () => cancelAnimationFrame(animId);
  }, [gameState, selectedShip, triggerLevelUp]);

  // Handle Resize
  useEffect(() => {
    const handleResize = () => {
      const canvas = canvasRef.current;
      if (canvas) {
        canvas.width = canvas.parentElement?.clientWidth || window.innerWidth;
        canvas.height = canvas.parentElement?.clientHeight || window.innerHeight;
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Keyboard Event Listeners
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      audio.init();
      const keys = engineRef.current.keys;
      if (e.key === "w" || e.key === "W" || e.key === "ArrowUp") keys.w = true;
      if (e.key === "a" || e.key === "A" || e.key === "ArrowLeft") keys.a = true;
      if (e.key === "s" || e.key === "S" || e.key === "ArrowDown") keys.s = true;
      if (e.key === "d" || e.key === "D" || e.key === "ArrowRight") keys.d = true;
      if (e.key === " ") keys.space = true;
      if (e.key === "Escape") {
        setGameState(prev => (prev === "playing" ? "paused" : prev === "paused" ? "playing" : prev));
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const keys = engineRef.current.keys;
      if (e.key === "w" || e.key === "W" || e.key === "ArrowUp") keys.w = false;
      if (e.key === "a" || e.key === "A" || e.key === "ArrowLeft") keys.a = false;
      if (e.key === "s" || e.key === "S" || e.key === "ArrowDown") keys.s = false;
      if (e.key === "d" || e.key === "D" || e.key === "ArrowRight") keys.d = false;
      if (e.key === " ") keys.space = false;
    };

    const handleMouseMove = (e: MouseEvent) => {
      const canvas = canvasRef.current;
      if (canvas) {
        const rect = canvas.getBoundingClientRect();
        engineRef.current.keys.mouseX = e.clientX - rect.left;
        engineRef.current.keys.mouseY = e.clientY - rect.top;
      }
    };

    const handleMouseDown = () => {
      audio.init();
      engineRef.current.keys.mouseDown = true;
    };
    const handleMouseUp = () => {
      engineRef.current.keys.mouseDown = false;
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
  }, []);

  const startGame = () => {
    audio.init();
    initGame();
    setGameState("playing");
  };

  return (
    <div className="w-full h-screen bg-[#05030d] text-white relative overflow-hidden font-sans select-none">
      {/* Background Canvas */}
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full block" />

      {/* Top Header Bar */}
      <div className="absolute top-0 left-0 right-0 p-4 flex items-center justify-between z-30 pointer-events-none">
        <Link
          href="/games"
          className="pointer-events-auto flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 backdrop-blur-md text-xs font-semibold text-white/80 transition-all hover:scale-105"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Exit Arena</span>
        </Link>

        <div className="flex items-center gap-3 pointer-events-auto">
          <button
            onClick={toggleSound}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 backdrop-blur-md text-white/80 transition-all"
            title="Toggle Sound Effects"
          >
            {soundEnabled ? <Volume2 className="w-4 h-4 text-cyan-400" /> : <VolumeX className="w-4 h-4 text-rose-400" />}
          </button>

          <button
            onClick={() => setShowAchievementsModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 backdrop-blur-md text-xs font-semibold text-amber-400 transition-all"
          >
            <Trophy className="w-4 h-4" />
            <span>Badges</span>
          </button>

          {gameState === "playing" && (
            <button
              onClick={() => setGameState("paused")}
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 backdrop-blur-md text-white/80"
            >
              <Pause className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* ================= HUD OVERLAY (In Game) ================= */}
      {gameState === "playing" && (
        <div className="absolute inset-0 pointer-events-none p-6 flex flex-col justify-between z-20">
          {/* Top HUD Stats */}
          <div className="flex justify-between items-start mt-12">
            {/* Health & Shield */}
            <div className="flex flex-col gap-2 w-64 bg-[#0e0c1b]/80 border border-white/10 p-3.5 rounded-2xl backdrop-blur-md shadow-2xl">
              <div className="flex items-center justify-between text-xs font-black uppercase tracking-wider text-cyan-400">
                <span className="flex items-center gap-1">
                  <Shield className="w-3.5 h-3.5" /> Shield
                </span>
                <span>
                  {Math.ceil(shield)} / {maxShield}
                </span>
              </div>
              <div className="w-full h-2 rounded-full bg-cyan-950 overflow-hidden">
                <div
                  className="h-full bg-cyan-400 transition-all duration-200"
                  style={{ width: `${Math.max(0, (shield / maxShield) * 100)}%` }}
                />
              </div>

              <div className="flex items-center justify-between text-xs font-black uppercase tracking-wider text-rose-400 mt-1">
                <span className="flex items-center gap-1">
                  <Activity className="w-3.5 h-3.5" /> Hull HP
                </span>
                <span>
                  {Math.ceil(health)} / {maxHealth}
                </span>
              </div>
              <div className="w-full h-2.5 rounded-full bg-rose-950 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-rose-600 to-rose-400 transition-all duration-200"
                  style={{ width: `${Math.max(0, (health / maxHealth) * 100)}%` }}
                />
              </div>
            </div>

            {/* Score & Combo */}
            <div className="flex flex-col items-end gap-1 bg-[#0e0c1b]/80 border border-white/10 px-5 py-3 rounded-2xl backdrop-blur-md">
              <div className="text-[10px] font-black uppercase tracking-widest text-white/50">Cosmic Score</div>
              <div className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-indigo-300 to-purple-400">
                {score.toLocaleString()}
              </div>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs font-bold text-amber-400 bg-amber-500/10 px-2.5 py-0.5 rounded-full border border-amber-500/20">
                  {combo}x Multiplier
                </span>
                <span className="text-xs font-semibold text-white/60">Wave {wave}</span>
              </div>
            </div>
          </div>

          {/* Bottom HUD Level & Ability */}
          <div className="flex justify-between items-end mb-4">
            {/* Level & XP */}
            <div className="w-72 bg-[#0e0c1b]/80 border border-white/10 p-3 rounded-2xl backdrop-blur-md">
              <div className="flex justify-between text-xs font-bold mb-1">
                <span className="text-purple-400">Level {level}</span>
                <span className="text-white/40">
                  {xp} / {nextXp} XP
                </span>
              </div>
              <div className="w-full h-2 bg-purple-950 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-purple-500 to-indigo-400 transition-all duration-300"
                  style={{ width: `${(xp / nextXp) * 100}%` }}
                />
              </div>
            </div>

            {/* Special Ability Indicator */}
            <div className="flex items-center gap-3 bg-[#0e0c1b]/80 border border-white/10 p-3 rounded-2xl backdrop-blur-md">
              <div
                className={`w-12 h-12 rounded-xl flex items-center justify-center border transition-all ${
                  abilityCooldown <= 0
                    ? "bg-cyan-500/20 border-cyan-400 text-cyan-300 shadow-[0_0_20px_rgba(6,182,212,0.4)] animate-pulse"
                    : "bg-white/5 border-white/10 text-white/30"
                }`}
              >
                <Zap className="w-6 h-6" />
              </div>
              <div>
                <div className="text-xs font-black uppercase tracking-wider text-white">
                  {selectedShip.specialAbility.toUpperCase()}
                </div>
                <div className="text-[10px] text-white/40 font-semibold">
                  {abilityCooldown <= 0 ? "PRESS SPACE" : "CHARGING..."}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= MAIN MENU ================= */}
      {gameState === "menu" && (
        <div className="absolute inset-0 z-40 bg-[#05030d]/90 backdrop-blur-xl flex flex-col items-center justify-center p-6 overflow-y-auto">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center max-w-2xl mb-8 mt-12"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs font-bold uppercase tracking-widest mb-3">
              <Sparkles className="w-3.5 h-3.5" /> Next-Gen Cyberpunk Arcade
            </div>
            <h1 className="text-5xl md:text-6xl font-black uppercase tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-indigo-300 to-purple-500 drop-shadow-[0_0_30px_rgba(6,182,212,0.3)]">
              Aetheris: Astral Eclipse
            </h1>
            <p className="text-sm text-white/60 mt-3 max-w-lg mx-auto">
              Pilot apex starfighters, harvest cosmic plasma, unlock tachyon matrix upgrades, and eliminate invading void dreadnoughts.
            </p>
          </motion.div>

          {/* Ship Selection Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 max-w-4xl w-full mb-8">
            {SHIPS.map(ship => (
              <motion.div
                key={ship.id}
                whileHover={{ scale: 1.03 }}
                onClick={() => setSelectedShip(ship)}
                className={`cursor-pointer p-5 rounded-2xl border transition-all flex flex-col justify-between ${
                  selectedShip.id === ship.id
                    ? "bg-[#120e2b] border-cyan-400 shadow-[0_0_25px_rgba(6,182,212,0.3)]"
                    : "bg-[#0b0819]/80 border-white/10 hover:border-white/20"
                }`}
              >
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="text-lg font-black text-white">{ship.name}</h3>
                    <span
                      className="w-3 h-3 rounded-full shadow-[0_0_10px]"
                      style={{ backgroundColor: ship.color, boxShadow: `0 0 10px ${ship.color}` }}
                    />
                  </div>
                  <div className="text-xs font-bold text-cyan-400 mb-3">{ship.classTitle}</div>
                  <p className="text-xs text-white/60 leading-relaxed mb-4">{ship.description}</p>
                </div>

                {/* Stats */}
                <div className="space-y-2 text-[10px] font-bold uppercase tracking-wider text-white/40">
                  <div>
                    <div className="flex justify-between mb-0.5">
                      <span>Speed</span> <span>{ship.statSpeed}/10</span>
                    </div>
                    <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                      <div className="h-full bg-cyan-400" style={{ width: `${ship.statSpeed * 10}%` }} />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between mb-0.5">
                      <span>Firepower</span> <span>{ship.statFirepower}/10</span>
                    </div>
                    <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                      <div className="h-full bg-amber-400" style={{ width: `${ship.statFirepower * 10}%` }} />
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Launch Button */}
          <div className="flex flex-col items-center gap-4">
            <button
              onClick={startGame}
              className="px-10 py-4 rounded-2xl bg-gradient-to-r from-cyan-500 via-indigo-600 to-purple-600 text-white font-black text-lg uppercase tracking-wider shadow-[0_0_30px_rgba(6,182,212,0.4)] hover:shadow-[0_0_45px_rgba(6,182,212,0.7)] hover:scale-105 active:scale-95 transition-all"
            >
              ENGAGE ASTRIAL WARP
            </button>
            <div className="text-xs text-white/40 font-semibold flex items-center gap-4">
              <span>WASD / Arrow Keys: Move</span> • <span>Mouse: Aim & Shoot</span> • <span>Space: Special Ability</span>
            </div>
          </div>
        </div>
      )}

      {/* ================= PERK SELECTION MODAL ================= */}
      {gameState === "perk_select" && (
        <div className="absolute inset-0 z-50 bg-black/80 backdrop-blur-md flex flex-col items-center justify-center p-6">
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center mb-8">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/20 text-purple-300 text-xs font-bold uppercase tracking-widest mb-2 border border-purple-500/30">
              <Sparkles className="w-4 h-4 animate-spin" /> Level Up Reached!
            </div>
            <h2 className="text-3xl font-black text-white uppercase tracking-tight">Select Matrix Augment</h2>
            <p className="text-xs text-white/50 mt-1">Choose 1 perk upgrade to enhance your starfighter</p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 max-w-3xl w-full">
            {availablePerks.map((perk, idx) => (
              <motion.div
                key={perk.id}
                whileHover={{ scale: 1.05 }}
                onClick={() => selectPerk(perk)}
                className="cursor-pointer bg-[#0e0c1b] border border-purple-500/30 hover:border-purple-400 p-6 rounded-2xl flex flex-col justify-between transition-all shadow-[0_0_20px_rgba(168,85,247,0.15)] hover:shadow-[0_0_30px_rgba(168,85,247,0.4)]"
              >
                <div>
                  <span className="inline-block px-2.5 py-1 rounded-lg bg-purple-500/10 text-purple-400 font-bold text-[10px] uppercase tracking-wider mb-3">
                    {perk.badge}
                  </span>
                  <h3 className="text-lg font-black text-white mb-2">{perk.title}</h3>
                  <p className="text-xs text-white/60 leading-relaxed">{perk.description}</p>
                </div>
                <button className="mt-6 w-full py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs uppercase tracking-wider transition-colors">
                  Install Augment
                </button>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* ================= GAME OVER MODAL ================= */}
      {gameState === "game_over" && (
        <div className="absolute inset-0 z-50 bg-[#05030d]/90 backdrop-blur-xl flex flex-col items-center justify-center p-6">
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center max-w-md w-full">
            <h2 className="text-4xl font-black uppercase text-rose-500 tracking-tight mb-1">Starfighter Destroyed</h2>
            <p className="text-xs text-white/50 mb-6">Your vessel was overwhelmed in Sector {finalStats.waveReached}</p>

            <div className="bg-[#0e0c1b] border border-white/10 rounded-2xl p-6 mb-6 text-left space-y-3 shadow-2xl">
              <div className="flex justify-between items-center border-b border-white/10 pb-2">
                <span className="text-xs text-white/50 font-bold uppercase">Final Score</span>
                <span className="text-xl font-black text-cyan-400">{finalStats.score.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center border-b border-white/10 pb-2">
                <span className="text-xs text-white/50 font-bold uppercase">Enemies Destroyed</span>
                <span className="text-sm font-bold text-white">{finalStats.kills}</span>
              </div>
              <div className="flex justify-between items-center border-b border-white/10 pb-2">
                <span className="text-xs text-white/50 font-bold uppercase">Dreadnought Boss Kills</span>
                <span className="text-sm font-bold text-amber-400">{finalStats.bossKills}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-white/50 font-bold uppercase">Leaderboard Points Earned</span>
                <span className="text-sm font-black text-emerald-400">+{finalStats.leaderboardPoints} PTS</span>
              </div>
            </div>

            <div className="flex gap-4">
              <button
                onClick={startGame}
                className="flex-1 py-3.5 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 text-white font-black text-sm uppercase tracking-wider shadow-lg hover:scale-105 transition-all"
              >
                REDEPLOY VESSEL
              </button>
              <button
                onClick={() => setGameState("menu")}
                className="px-5 py-3.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold text-sm uppercase transition-all"
              >
                MENU
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* ================= ACHIEVEMENTS MODAL ================= */}
      {showAchievementsModal && (
        <div className="absolute inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-6">
          <div className="bg-[#0e0c1b] border border-white/10 max-w-lg w-full rounded-2xl p-6 shadow-2xl relative">
            <button
              onClick={() => setShowAchievementsModal(false)}
              className="absolute top-4 right-4 text-white/40 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2 mb-4 text-amber-400">
              <Trophy className="w-6 h-6" />
              <h3 className="text-xl font-black uppercase">Battle Achievements</h3>
            </div>
            <div className="space-y-3 max-h-80 overflow-y-auto pr-2">
              {ACHIEVEMENTS.map(ach => {
                const isUnlocked = unlockedAchievements.includes(ach.id);
                return (
                  <div
                    key={ach.id}
                    className={`p-3 rounded-xl border flex items-center justify-between ${
                      isUnlocked ? "bg-amber-500/10 border-amber-500/30 text-amber-300" : "bg-white/5 border-white/10 opacity-50"
                    }`}
                  >
                    <div>
                      <div className="text-xs font-black uppercase">{ach.title}</div>
                      <div className="text-[10px] text-white/60">{ach.desc}</div>
                    </div>
                    <span className="text-xs font-bold uppercase">{isUnlocked ? "UNLOCKED" : "LOCKED"}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
