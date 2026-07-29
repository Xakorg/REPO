"use client";

import React, { useEffect, useRef, useState } from "react";
import { 
  Shield, 
  Zap, 
  Trophy, 
  RotateCcw, 
  Play, 
  Pause, 
  Volume2, 
  VolumeX, 
  Sparkles, 
  Target, 
  Award, 
  Crosshair, 
  Flame, 
  Activity,
  ArrowLeft,
  ChevronRight,
  Maximize2
} from "lucide-react";

// --- Types & Interfaces ---

interface PlayableShip {
  id: string;
  name: string;
  tagline: string;
  color: string;
  accent: string;
  speed: number;
  maxHealth: number;
  fireRate: number;
  abilityName: string;
  abilityDesc: string;
  abilityCooldown: number;
  unlocked: boolean;
  cost: number;
}

interface Perk {
  id: string;
  name: string;
  description: string;
  icon: string;
  tier: "common" | "rare" | "epic" | "legendary";
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  alpha: number;
  decay: number;
}

interface PlayerBullet {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  damage: number;
  color: string;
  isHoming?: boolean;
  target?: Enemy | null;
  penetration?: number;
}

interface EnemyBullet {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
  damage: number;
}

interface Enemy {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  type: "scout" | "cruiser" | "hunter" | "boss";
  radius: number;
  health: number;
  maxHealth: number;
  scoreValue: number;
  color: string;
  fireTimer: number;
  fireInterval: number;
  angle: number;
  bossPhase?: number;
}

interface DropItem {
  x: number;
  y: number;
  type: "xp" | "health" | "shield" | "credit";
  value: number;
  radius: number;
}

interface FloatingText {
  x: number;
  y: number;
  text: string;
  color: string;
  alpha: number;
  vy: number;
}

// --- Sound Synthesizer (Web Audio API) ---
class SoundFx {
  private ctx: AudioContext | null = null;
  public enabled: boolean = true;

  constructor() {
    // AudioContext will be initialized on first user interaction
  }

  private init() {
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

  playLaser() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;
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
    } catch (e) {}
  }

  playExplosion(isBig: boolean = false) {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;
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
      filter.frequency.exponentialRampToValueAtTime(30, this.ctx.currentTime + duration);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(isBig ? 0.4 : 0.2, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + duration);

      whiteNoise.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);
      whiteNoise.start();
      whiteNoise.stop(this.ctx.currentTime + duration);
    } catch (e) {}
  }

  playLevelUp() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      [440, 554.37, 659.25, 880].forEach((freq, idx) => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, now + idx * 0.08);
        gain.gain.setValueAtTime(0.2, now + idx * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.01, now + idx * 0.08 + 0.25);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now + idx * 0.08);
        osc.stop(now + idx * 0.08 + 0.25);
      });
    } catch (e) {}
  }

  playPickup() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(523.25, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1046.5, this.ctx.currentTime + 0.1);
      gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.1);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.1);
    } catch (e) {}
  }

  playAbility() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(200, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1200, this.ctx.currentTime + 0.3);
      gain.gain.setValueAtTime(0.3, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.3);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.3);
    } catch (e) {}
  }
}

const sfx = new SoundFx();

// --- Available Ships ---
const SHIPS: PlayableShip[] = [
  {
    id: "vortex_interceptor",
    name: "Vortex Interceptor",
    tagline: "Agile Striker",
    color: "#06b6d4",
    accent: "#67e8f9",
    speed: 6.5,
    maxHealth: 100,
    fireRate: 150,
    abilityName: "Hyper Pulse",
    abilityDesc: "Unleashes a 360-degree shockwave that destroys enemy projectiles and damages nearby foes.",
    abilityCooldown: 8,
    unlocked: true,
    cost: 0
  },
  {
    id: "aether_dreadnought",
    name: "Aether Dreadnought",
    tagline: "Heavy Fortress",
    color: "#a855f7",
    accent: "#c084fc",
    speed: 4.8,
    maxHealth: 160,
    fireRate: 200,
    abilityName: "Aegis Matrix",
    abilityDesc: "Grants invulnerability shield and double damage for 5 seconds.",
    abilityCooldown: 14,
    unlocked: true,
    cost: 0
  },
  {
    id: "quantum_phantom",
    name: "Quantum Phantom",
    tagline: "High-Crit Assassin",
    color: "#f43f5e",
    accent: "#fb7185",
    speed: 7.2,
    maxHealth: 85,
    fireRate: 120,
    abilityName: "Phase Dash",
    abilityDesc: "Teleports forward while spawning homing plasma bolts in all directions.",
    abilityCooldown: 10,
    unlocked: true,
    cost: 0
  }
];

// --- Available Perks Pool ---
const PERK_POOL: Perk[] = [
  { id: "fire_rate", name: "Overcharge", description: "+25% Attack Speed", icon: "⚡", tier: "common" },
  { id: "multishot", name: "Split Cannon", description: "+1 Extra Projectile per shot", icon: "🔱", tier: "rare" },
  { id: "homing", name: "Seeker Drones", description: "Fires sub-homing missiles periodically", icon: "🎯", tier: "epic" },
  { id: "health_boost", name: "Nanite Core", description: "+40 Max Health & Full Heal", icon: "❤️", tier: "common" },
  { id: "shield_regen", name: "Aegis Shield", description: "Generates an orbiting energy shield ball", icon: "🛡️", tier: "rare" },
  { id: "magnet", name: "Vortex Field", description: "+100% XP & Item Attraction Range", icon: "🧲", tier: "common" },
  { id: "damage_up", name: "Plasma Forge", description: "+35% Bullet Damage", icon: "🔥", tier: "common" },
  { id: "crit_boost", name: "Targeting Matrix", description: "+25% Critical Hit Chance", icon: "🎯", tier: "rare" },
  { id: "time_slow", name: "Chrono Field", description: "Slows enemy movement & bullets by 20%", icon: "⏳", tier: "epic" },
  { id: "overdrive", name: "Quantum Surge", description: "Defeated enemies explode dealing splash damage", icon: "💥", tier: "legendary" }
];

export default function CyberVortexOdyssey() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // --- Game State ---
  const [gameState, setGameState] = useState<"menu" | "playing" | "perk_select" | "paused" | "gameover" | "shop">("menu");
  const [selectedShipIndex, setSelectedShipIndex] = useState<number>(0);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);

  // Meta Currency & Stats
  const [credits, setCredits] = useState<number>(0);
  const [highScore, setHighScore] = useState<number>(0);

  // Permanent Upgrades (Shop)
  const [upgrades, setUpgrades] = useState({
    healthLvl: 0,
    damageLvl: 0,
    speedLvl: 0,
    creditLvl: 0
  });

  // Current Run Stats
  const [score, setScore] = useState<number>(0);
  const [wave, setWave] = useState<number>(1);
  const [level, setLevel] = useState<number>(1);
  const [xp, setXp] = useState<number>(0);
  const [xpToNext, setXpToNext] = useState<number>(100);
  const [health, setHealth] = useState<number>(100);
  const [maxHealth, setMaxHealth] = useState<number>(100);
  const [abilityCdTimer, setAbilityCdTimer] = useState<number>(0);
  const [activePerks, setActivePerks] = useState<Perk[]>([]);
  const [perkOptions, setPerkOptions] = useState<Perk[]>([]);

  // Run Summary Stats
  const [runStats, setRunStats] = useState({
    kills: 0,
    bossesDefeated: 0,
    shotsFired: 0,
    damageDealt: 0,
    creditsEarned: 0
  });

  // --- Refs for Canvas Loop ---
  const requestRef = useRef<number | null>(null);
  const keysRef = useRef<Record<string, boolean>>({});
  const touchJoystickRef = useRef<{ active: boolean; startX: number; startY: number; currX: number; currY: number }>({
    active: false,
    startX: 0,
    startY: 0,
    currX: 0,
    currY: 0
  });
  const touchFireRef = useRef<boolean>(false);
  const touchAbilityRef = useRef<boolean>(false);

  // Entities Ref
  const gameEntitiesRef = useRef<{
    player: {
      x: number;
      y: number;
      vx: number;
      vy: number;
      radius: number;
      angle: number;
      lastShot: number;
      abilityCd: number;
      invulnerableTimer: number;
      shieldActive: boolean;
      shieldDuration: number;
      orbitalShields: number;
    };
    particles: Particle[];
    playerBullets: PlayerBullet[];
    enemyBullets: EnemyBullet[];
    enemies: Enemy[];
    drops: DropItem[];
    floatingTexts: FloatingText[];
    stars: { x: number; y: number; z: number; size: number }[];
    waveEnemiesLeft: number;
    waveSpawnTimer: number;
    isBossWave: boolean;
    bossActive: boolean;
    perksAcquired: Record<string, number>;
  }>({
    player: {
      x: 400,
      y: 300,
      vx: 0,
      vy: 0,
      radius: 18,
      angle: 0,
      lastShot: 0,
      abilityCd: 0,
      invulnerableTimer: 0,
      shieldActive: false,
      shieldDuration: 0,
      orbitalShields: 0
    },
    particles: [],
    playerBullets: [],
    enemyBullets: [],
    enemies: [],
    drops: [],
    floatingTexts: [],
    stars: [],
    waveEnemiesLeft: 0,
    waveSpawnTimer: 0,
    isBossWave: false,
    bossActive: false,
    perksAcquired: {}
  });

  // --- Load Saved Data ---
  useEffect(() => {
    try {
      const savedCredits = localStorage.getItem("cvo_credits");
      const savedHighScore = localStorage.getItem("cvo_highscore");
      const savedUpgrades = localStorage.getItem("cvo_upgrades");
      if (savedCredits) setCredits(parseInt(savedCredits, 10));
      if (savedHighScore) setHighScore(parseInt(savedHighScore, 10));
      if (savedUpgrades) setUpgrades(JSON.parse(savedUpgrades));
    } catch (e) {}
  }, []);

  // --- Save Data Helper ---
  const saveProgress = (newCredits: number, newHighScore: number, newUpgrades = upgrades) => {
    try {
      localStorage.setItem("cvo_credits", newCredits.toString());
      localStorage.setItem("cvo_highscore", newHighScore.toString());
      localStorage.setItem("cvo_upgrades", JSON.stringify(newUpgrades));
    } catch (e) {}
  };

  // --- Handle Key Inputs ---
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      keysRef.current[e.code] = true;
      if (e.code === "KeyP" && (gameState === "playing" || gameState === "paused")) {
        setGameState(prev => (prev === "playing" ? "paused" : "playing"));
      }
      if (e.code === "KeyE" || e.code === "ShiftLeft" || e.code === "ShiftRight") {
        triggerPlayerAbility();
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
  }, [gameState]);

  // --- Initialize Starfield ---
  const initStars = (width: number, height: number) => {
    const stars = [];
    for (let i = 0; i < 120; i++) {
      stars.push({
        x: Math.random() * width,
        y: Math.random() * height,
        z: Math.random() * 2 + 0.5,
        size: Math.random() * 2 + 1
      });
    }
    gameEntitiesRef.current.stars = stars;
  };

  // --- Start New Game ---
  const startNewGame = () => {
    const ship = SHIPS[selectedShipIndex];
    const baseHp = ship.maxHealth + upgrades.healthLvl * 20;

    setScore(0);
    setWave(1);
    setLevel(1);
    setXp(0);
    setXpToNext(100);
    setHealth(baseHp);
    setMaxHealth(baseHp);
    setAbilityCdTimer(0);
    setActivePerks([]);

    setRunStats({
      kills: 0,
      bossesDefeated: 0,
      shotsFired: 0,
      damageDealt: 0,
      creditsEarned: 0
    });

    const canvas = canvasRef.current;
    const width = canvas ? canvas.width : 800;
    const height = canvas ? canvas.height : 600;

    gameEntitiesRef.current = {
      player: {
        x: width / 2,
        y: height / 2,
        vx: 0,
        vy: 0,
        radius: 18,
        angle: 0,
        lastShot: 0,
        abilityCd: 0,
        invulnerableTimer: 0,
        shieldActive: false,
        shieldDuration: 0,
        orbitalShields: 0
      },
      particles: [],
      playerBullets: [],
      enemyBullets: [],
      enemies: [],
      drops: [],
      floatingTexts: [],
      stars: gameEntitiesRef.current.stars.length ? gameEntitiesRef.current.stars : [],
      waveEnemiesLeft: 10,
      waveSpawnTimer: 0,
      isBossWave: false,
      bossActive: false,
      perksAcquired: {}
    };

    if (!gameEntitiesRef.current.stars.length) {
      initStars(width, height);
    }

    setGameState("playing");
  };

  // --- Trigger Ability ---
  const triggerPlayerAbility = () => {
    const ent = gameEntitiesRef.current;
    const p = ent.player;
    const ship = SHIPS[selectedShipIndex];

    if (p.abilityCd > 0 || gameState !== "playing") return;

    p.abilityCd = ship.abilityCooldown;
    setAbilityCdTimer(ship.abilityCooldown);
    sfx.playAbility();

    if (ship.id === "vortex_interceptor") {
      // Hyper Pulse Shockwave
      for (let a = 0; a < Math.PI * 2; a += Math.PI / 16) {
        ent.playerBullets.push({
          x: p.x,
          y: p.y,
          vx: Math.cos(a) * 9,
          vy: Math.sin(a) * 9,
          radius: 8,
          damage: 45,
          color: ship.color
        });
      }
      // Destroy nearby enemy bullets
      ent.enemyBullets = ent.enemyBullets.filter(b => {
        const dist = Math.hypot(b.x - p.x, b.y - p.y);
        return dist > 220;
      });
      createExplosionRing(p.x, p.y, ship.color, 40);
    } else if (ship.id === "aether_dreadnought") {
      // Aegis Shield Matrix
      p.shieldActive = true;
      p.shieldDuration = 5;
      createExplosionRing(p.x, p.y, "#c084fc", 30);
    } else if (ship.id === "quantum_phantom") {
      // Phase Dash + Teleport
      const dashDist = 180;
      const targetX = Math.max(30, Math.min((canvasRef.current?.width || 800) - 30, p.x + Math.cos(p.angle) * dashDist));
      const targetY = Math.max(30, Math.min((canvasRef.current?.height || 600) - 30, p.y + Math.sin(p.angle) * dashDist));

      for (let i = 0; i < 12; i++) {
        ent.particles.push({
          x: p.x + (targetX - p.x) * (i / 12),
          y: p.y + (targetY - p.y) * (i / 12),
          vx: (Math.random() - 0.5) * 2,
          vy: (Math.random() - 0.5) * 2,
          size: 6,
          color: "#fb7185",
          alpha: 1,
          decay: 0.05
        });
      }

      p.x = targetX;
      p.y = targetY;
      p.invulnerableTimer = 1.5;

      // Homing bolts
      ent.enemies.forEach(e => {
        ent.playerBullets.push({
          x: p.x,
          y: p.y,
          vx: (Math.random() - 0.5) * 4,
          vy: (Math.random() - 0.5) * 4,
          radius: 6,
          damage: 35,
          color: "#fb7185",
          isHoming: true,
          target: e
        });
      });
    }
  };

  // --- Visual Particles Helper ---
  const createExplosionRing = (x: number, y: number, color: string, count: number = 20) => {
    const ent = gameEntitiesRef.current;
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count;
      const speed = Math.random() * 4 + 2;
      ent.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: Math.random() * 4 + 2,
        color,
        alpha: 1,
        decay: Math.random() * 0.03 + 0.02
      });
    }
  };

  const addFloatingText = (x: number, y: number, text: string, color: string) => {
    gameEntitiesRef.current.floatingTexts.push({
      x,
      y,
      text,
      color,
      alpha: 1,
      vy: -1.2
    });
  };

  // --- Level Up Trigger ---
  const triggerLevelUp = () => {
    sfx.playLevelUp();
    // Pick 3 random perks from pool
    const shuffled = [...PERK_POOL].sort(() => 0.5 - Math.random());
    setPerkOptions(shuffled.slice(0, 3));
    setGameState("perk_select");
  };

  const applyPerk = (perk: Perk) => {
    setActivePerks(prev => [...prev, perk]);
    const acquired = gameEntitiesRef.current.perksAcquired;
    acquired[perk.id] = (acquired[perk.id] || 0) + 1;

    const p = gameEntitiesRef.current.player;

    if (perk.id === "health_boost") {
      setMaxHealth(prev => {
        const next = prev + 40;
        setHealth(next);
        return next;
      });
    } else if (perk.id === "shield_regen") {
      p.orbitalShields = (p.orbitalShields || 0) + 1;
    }

    setGameState("playing");
  };

  // --- Main Update & Render Loop ---
  useEffect(() => {
    let lastTime = performance.now();

    const loop = (now: number) => {
      const dt = Math.min((now - lastTime) / 1000, 0.1);
      lastTime = now;

      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext("2d");
        if (ctx) {
          updateGame(dt, canvas.width, canvas.height);
          renderGame(ctx, canvas.width, canvas.height);
        }
      }

      requestRef.current = requestAnimationFrame(loop);
    };

    if (gameState === "playing" || gameState === "perk_select" || gameState === "paused") {
      requestRef.current = requestAnimationFrame(loop);
    }

    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [gameState, selectedShipIndex, upgrades]);

  // --- Game State Update Logic ---
  const updateGame = (dt: number, width: number, height: number) => {
    const ent = gameEntitiesRef.current;
    const p = ent.player;
    const ship = SHIPS[selectedShipIndex];
    const perks = ent.perksAcquired;

    // Background Stars Warp
    ent.stars.forEach(st => {
      st.y += st.z * 1.5;
      if (st.y > height) {
        st.y = 0;
        st.x = Math.random() * width;
      }
    });

    if (gameState !== "playing") return;

    // --- Cooldowns & Timers ---
    if (p.abilityCd > 0) {
      p.abilityCd = Math.max(0, p.abilityCd - dt);
      setAbilityCdTimer(Math.ceil(p.abilityCd));
    }
    if (p.invulnerableTimer > 0) {
      p.invulnerableTimer -= dt;
    }
    if (p.shieldActive) {
      p.shieldDuration -= dt;
      if (p.shieldDuration <= 0) p.shieldActive = false;
    }

    // --- Player Movement ---
    let dx = 0;
    let dy = 0;
    const keys = keysRef.current;

    if (keys["KeyW"] || keys["ArrowUp"]) dy -= 1;
    if (keys["KeyS"] || keys["ArrowDown"]) dy += 1;
    if (keys["KeyA"] || keys["ArrowLeft"]) dx -= 1;
    if (keys["KeyD"] || keys["ArrowRight"]) dx += 1;

    // Touch Joystick Input
    const joy = touchJoystickRef.current;
    if (joy.active) {
      const jdx = joy.currX - joy.startX;
      const jdy = joy.currY - joy.startY;
      const len = Math.hypot(jdx, jdy);
      if (len > 10) {
        dx = jdx / len;
        dy = jdy / len;
      }
    }

    const moveSpeed = (ship.speed + (upgrades.speedLvl * 0.5)) * (dx && dy ? 0.707 : 1);
    p.vx = dx * moveSpeed;
    p.vy = dy * moveSpeed;

    p.x += p.vx;
    p.y += p.vy;

    // Clamp inside canvas
    p.x = Math.max(p.radius, Math.min(width - p.radius, p.x));
    p.y = Math.max(p.radius, Math.min(height - p.radius, p.y));

    // Player Direction Angle
    if (dx !== 0 || dy !== 0) {
      p.angle = Math.atan2(dy, dx);
    }

    // Thruster Particles
    if (dx !== 0 || dy !== 0) {
      for (let i = 0; i < 2; i++) {
        ent.particles.push({
          x: p.x - Math.cos(p.angle) * 14,
          y: p.y - Math.sin(p.angle) * 14,
          vx: -Math.cos(p.angle) * 3 + (Math.random() - 0.5) * 1.5,
          vy: -Math.sin(p.angle) * 3 + (Math.random() - 0.5) * 1.5,
          size: Math.random() * 4 + 2,
          color: ship.accent,
          alpha: 0.8,
          decay: 0.08
        });
      }
    }

    // --- Player Shooting ---
    const now = performance.now();
    const fireInterval = ship.fireRate * (1 - (perks["fire_rate"] || 0) * 0.2);

    if ((keys["Space"] || touchFireRef.current) && now - p.lastShot >= fireInterval) {
      p.lastShot = now;
      sfx.playLaser();
      setRunStats(prev => ({ ...prev, shotsFired: prev.shotsFired + 1 }));

      const baseDmg = (20 + upgrades.damageLvl * 4) * (1 + (perks["damage_up"] || 0) * 0.35);
      const isCrit = Math.random() < ((perks["crit_boost"] || 0) * 0.25 + (ship.id === "quantum_phantom" ? 0.2 : 0.05));
      const damage = isCrit ? baseDmg * 2 : baseDmg;

      const extraShots = perks["multishot"] || 0;
      const totalBullets = 1 + extraShots;

      for (let b = 0; b < totalBullets; b++) {
        const spreadAngle = (b - (totalBullets - 1) / 2) * 0.18;
        const bAngle = p.angle + spreadAngle;
        ent.playerBullets.push({
          x: p.x + Math.cos(bAngle) * 16,
          y: p.y + Math.sin(bAngle) * 16,
          vx: Math.cos(bAngle) * 12,
          vy: Math.sin(bAngle) * 12,
          radius: isCrit ? 6 : 4,
          damage,
          color: isCrit ? "#facc15" : ship.color
        });
      }

      // Homing Seeker Drones perk
      if (perks["homing"] && ent.enemies.length > 0) {
        const closestEnemy = ent.enemies[0];
        ent.playerBullets.push({
          x: p.x,
          y: p.y,
          vx: Math.cos(p.angle + Math.PI / 2) * 6,
          vy: Math.sin(p.angle + Math.PI / 2) * 6,
          radius: 5,
          damage: damage * 0.8,
          color: "#ec4899",
          isHoming: true,
          target: closestEnemy
        });
      }
    }

    // --- Update Player Bullets ---
    ent.playerBullets.forEach(b => {
      if (b.isHoming && b.target && ent.enemies.includes(b.target)) {
        const angleToTarget = Math.atan2(b.target.y - b.y, b.target.x - b.x);
        b.vx += Math.cos(angleToTarget) * 0.8;
        b.vy += Math.sin(angleToTarget) * 0.8;
        const speed = Math.hypot(b.vx, b.vy);
        if (speed > 10) {
          b.vx = (b.vx / speed) * 10;
          b.vy = (b.vy / speed) * 10;
        }
      }
      b.x += b.vx;
      b.y += b.vy;
    });

    // Filter offscreen bullets
    ent.playerBullets = ent.playerBullets.filter(b => b.x >= 0 && b.x <= width && b.y >= 0 && b.y <= height);

    // --- Wave Spawning Logic ---
    if (ent.enemies.length === 0 && ent.waveEnemiesLeft <= 0 && !ent.bossActive) {
      // Wave Cleared!
      const nextWave = wave + 1;
      setWave(nextWave);

      if (nextWave % 5 === 0) {
        // Boss Wave!
        ent.isBossWave = true;
        ent.bossActive = true;
        ent.enemies.push({
          id: Date.now(),
          x: width / 2,
          y: -80,
          vx: 0,
          vy: 1.5,
          type: "boss",
          radius: 48,
          health: 1200 + nextWave * 200,
          maxHealth: 1200 + nextWave * 200,
          scoreValue: 2000,
          color: "#f43f5e",
          fireTimer: 0,
          fireInterval: 1.2,
          angle: Math.PI / 2,
          bossPhase: 1
        });
        addFloatingText(width / 2, 100, "⚠️ BOSS DETECTED!", "#f43f5e");
      } else {
        ent.isBossWave = false;
        ent.waveEnemiesLeft = 12 + nextWave * 4;
        addFloatingText(width / 2, height / 2 - 40, `WAVE ${nextWave}`, "#06b6d4");
      }
    }

    // Spawn regular wave enemies
    if (!ent.isBossWave && ent.waveEnemiesLeft > 0) {
      ent.waveSpawnTimer += dt;
      if (ent.waveSpawnTimer >= 0.8) {
        ent.waveSpawnTimer = 0;
        ent.waveEnemiesLeft -= 1;

        const side = Math.floor(Math.random() * 4);
        let ex = 0;
        let ey = 0;
        if (side === 0) { ex = Math.random() * width; ey = -30; }
        else if (side === 1) { ex = width + 30; ey = Math.random() * height; }
        else if (side === 2) { ex = Math.random() * width; ey = height + 30; }
        else { ex = -30; ey = Math.random() * height; }

        const types: ("scout" | "cruiser" | "hunter")[] = ["scout", "cruiser", "hunter"];
        const randType = types[Math.floor(Math.random() * types.length)];
        let hp = 30 + wave * 5;
        let rad = 16;
        let col = "#22c55e";
        let scoreVal = 100;

        if (randType === "cruiser") {
          hp *= 2.2;
          rad = 24;
          col = "#eab308";
          scoreVal = 250;
        } else if (randType === "hunter") {
          hp *= 1.2;
          rad = 18;
          col = "#a855f7";
          scoreVal = 180;
        }

        ent.enemies.push({
          id: Date.now() + Math.random(),
          x: ex,
          y: ey,
          vx: 0,
          vy: 0,
          type: randType,
          radius: rad,
          health: hp,
          maxHealth: hp,
          scoreValue: scoreVal,
          color: col,
          fireTimer: Math.random() * 2,
          fireInterval: randType === "cruiser" ? 2.2 : 1.5,
          angle: 0
        });
      }
    }

    // --- Update Enemies ---
    const slowFactor = perks["time_slow"] ? 0.8 : 1.0;

    ent.enemies.forEach(e => {
      const angleToPlayer = Math.atan2(p.y - e.y, p.x - e.x);
      e.angle = angleToPlayer;

      if (e.type === "boss") {
        // Boss AI Movement
        if (e.y < 120) e.y += e.vy;
        else {
          e.x += Math.sin(performance.now() / 1000) * 3 * slowFactor;
        }

        // Boss Shooting Patterns
        e.fireTimer += dt * slowFactor;
        if (e.fireTimer >= e.fireInterval) {
          e.fireTimer = 0;
          // Spiral Radial Burst
          for (let a = 0; a < Math.PI * 2; a += Math.PI / 8) {
            ent.enemyBullets.push({
              x: e.x,
              y: e.y,
              vx: Math.cos(a + e.angle) * 4.5,
              vy: Math.sin(a + e.angle) * 4.5,
              radius: 6,
              color: "#f43f5e",
              damage: 18
            });
          }
        }
      } else if (e.type === "scout") {
        e.x += Math.cos(angleToPlayer) * 2.8 * slowFactor;
        e.y += Math.sin(angleToPlayer) * 2.8 * slowFactor;
      } else if (e.type === "cruiser") {
        e.x += Math.cos(angleToPlayer) * 1.5 * slowFactor;
        e.y += Math.sin(angleToPlayer) * 1.5 * slowFactor;

        e.fireTimer += dt * slowFactor;
        if (e.fireTimer >= e.fireInterval) {
          e.fireTimer = 0;
          ent.enemyBullets.push({
            x: e.x,
            y: e.y,
            vx: Math.cos(angleToPlayer) * 5,
            vy: Math.sin(angleToPlayer) * 5,
            radius: 5,
            color: "#eab308",
            damage: 12
          });
        }
      } else if (e.type === "hunter") {
        e.x += Math.cos(angleToPlayer) * 3.5 * slowFactor;
        e.y += Math.sin(angleToPlayer) * 3.5 * slowFactor;
      }
    });

    // --- Update Enemy Bullets ---
    ent.enemyBullets.forEach(b => {
      b.x += b.vx * slowFactor;
      b.y += b.vy * slowFactor;
    });

    ent.enemyBullets = ent.enemyBullets.filter(b => b.x >= 0 && b.x <= width && b.y >= 0 && b.y <= height);

    // --- Collision: Player Bullets -> Enemies ---
    ent.playerBullets.forEach(b => {
      ent.enemies.forEach(e => {
        const dist = Math.hypot(b.x - e.x, b.y - e.y);
        if (dist < b.radius + e.radius) {
          e.health -= b.damage;
          b.radius = 0; // Mark for removal

          setRunStats(prev => ({ ...prev, damageDealt: prev.damageDealt + b.damage }));
          addFloatingText(e.x, e.y - 10, `-${Math.round(b.damage)}`, b.color);

          // Impact Spark Particles
          for (let i = 0; i < 4; i++) {
            ent.particles.push({
              x: b.x,
              y: b.y,
              vx: (Math.random() - 0.5) * 4,
              vy: (Math.random() - 0.5) * 4,
              size: 3,
              color: b.color,
              alpha: 1,
              decay: 0.1
            });
          }

          if (e.health <= 0) {
            // Defeated Enemy
            sfx.playExplosion(e.type === "boss");
            createExplosionRing(e.x, e.y, e.color, e.type === "boss" ? 40 : 15);

            setScore(prev => {
              const newScore = prev + e.scoreValue;
              if (newScore > highScore) {
                setHighScore(newScore);
                saveProgress(credits, newScore);
              }
              return newScore;
            });

            setRunStats(prev => ({
              ...prev,
              kills: prev.kills + 1,
              bossesDefeated: prev.bossesDefeated + (e.type === "boss" ? 1 : 0)
            }));

            // Drop Items
            const xpVal = e.type === "boss" ? 200 : 25;
            ent.drops.push({
              x: e.x,
              y: e.y,
              type: "xp",
              value: xpVal,
              radius: 6
            });

            if (Math.random() < 0.25 || e.type === "boss") {
              const earnedCrd = (e.type === "boss" ? 50 : 5) * (1 + upgrades.creditLvl * 0.2);
              ent.drops.push({
                x: e.x + (Math.random() - 0.5) * 20,
                y: e.y + (Math.random() - 0.5) * 20,
                type: "credit",
                value: earnedCrd,
                radius: 7
              });
            }

            if (Math.random() < 0.15) {
              ent.drops.push({
                x: e.x + (Math.random() - 0.5) * 20,
                y: e.y + (Math.random() - 0.5) * 20,
                type: "health",
                value: 20,
                radius: 7
              });
            }

            if (e.type === "boss") ent.bossActive = false;
          }
        }
      });
    });

    // Cleanup dead bullets & enemies
    ent.playerBullets = ent.playerBullets.filter(b => b.radius > 0);
    ent.enemies = ent.enemies.filter(e => e.health > 0);

    // --- Collision: Enemy Bullets & Enemy Bodies -> Player ---
    if (p.invulnerableTimer <= 0 && !p.shieldActive) {
      // Enemy Bullets
      ent.enemyBullets.forEach(b => {
        const dist = Math.hypot(b.x - p.x, b.y - p.y);
        if (dist < b.radius + p.radius) {
          b.radius = 0;
          takePlayerDamage(b.damage);
        }
      });
      ent.enemyBullets = ent.enemyBullets.filter(b => b.radius > 0);

      // Enemy Body Collision
      ent.enemies.forEach(e => {
        const dist = Math.hypot(e.x - p.x, e.y - p.y);
        if (dist < e.radius + p.radius) {
          takePlayerDamage(25);
          createExplosionRing(p.x, p.y, "#ef4444", 10);
        }
      });
    }

    // --- Magnet & Pickup Drops ---
    const magnetRange = 100 * (1 + (perks["magnet"] || 0) * 1.0);
    ent.drops.forEach(d => {
      const dist = Math.hypot(d.x - p.x, d.y - p.y);
      if (dist < magnetRange) {
        // Pull item towards player
        const angle = Math.atan2(p.y - d.y, p.x - d.x);
        d.x += Math.cos(angle) * 7;
        d.y += Math.sin(angle) * 7;
      }

      if (dist < d.radius + p.radius) {
        d.radius = 0; // Mark collected
        sfx.playPickup();

        if (d.type === "xp") {
          addXP(d.value);
        } else if (d.type === "credit") {
          setCredits(prev => {
            const next = prev + d.value;
            saveProgress(next, highScore);
            return next;
          });
          setRunStats(prev => ({ ...prev, creditsEarned: prev.creditsEarned + d.value }));
          addFloatingText(d.x, d.y, `+${d.value} CR`, "#facc15");
        } else if (d.type === "health") {
          setHealth(prev => Math.min(maxHealth, prev + d.value));
          addFloatingText(d.x, d.y, `+${d.value} HP`, "#22c55e");
        }
      }
    });

    ent.drops = ent.drops.filter(d => d.radius > 0);

    // --- Update Particles & Floating Text ---
    ent.particles.forEach(pt => {
      pt.x += pt.vx;
      pt.y += pt.vy;
      pt.alpha -= pt.decay;
    });
    ent.particles = ent.particles.filter(pt => pt.alpha > 0);

    ent.floatingTexts.forEach(ft => {
      ft.y += ft.vy;
      ft.alpha -= 0.02;
    });
    ent.floatingTexts = ent.floatingTexts.filter(ft => ft.alpha > 0);
  };

  // --- Add XP and Check Level Up ---
  const addXP = (amount: number) => {
    setXp(prevXp => {
      const newXp = prevXp + amount;
      if (newXp >= xpToNext) {
        setLevel(prevLvl => prevLvl + 1);
        setXpToNext(prevMax => Math.round(prevMax * 1.4));
        triggerLevelUp();
        return newXp - xpToNext;
      }
      return newXp;
    });
  };

  // --- Take Damage Helper ---
  const takePlayerDamage = (damage: number) => {
    const p = gameEntitiesRef.current.player;
    p.invulnerableTimer = 0.5; // Brief invulnerability iframe

    setHealth(prevHp => {
      const nextHp = prevHp - damage;
      addFloatingText(p.x, p.y - 15, `-${Math.round(damage)}`, "#ef4444");

      if (nextHp <= 0) {
        // Game Over!
        sfx.playExplosion(true);
        setGameState("gameover");

        // Dispatch Custom Leaderboard Event
        try {
          window.dispatchEvent(
            new CustomEvent("xakteir-game-score", {
              detail: { score: score, points: Math.floor(score / 10) }
            })
          );
        } catch (e) {}

        const finalCredits = credits + runStats.creditsEarned;
        const finalHighScore = Math.max(highScore, score);
        saveProgress(finalCredits, finalHighScore);
      }
      return Math.max(0, nextHp);
    });
  };

  // --- Render Loop ---
  const renderGame = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    const ent = gameEntitiesRef.current;
    const p = ent.player;
    const ship = SHIPS[selectedShipIndex];

    // Clear Canvas
    ctx.fillStyle = "#070514";
    ctx.fillRect(0, 0, width, height);

    // Draw Starfield Background
    ctx.fillStyle = "#ffffff";
    ent.stars.forEach(st => {
      ctx.globalAlpha = Math.min(1, st.z / 2);
      ctx.fillRect(st.x, st.y, st.size, st.size);
    });
    ctx.globalAlpha = 1.0;

    // Draw Drops
    ent.drops.forEach(d => {
      ctx.beginPath();
      ctx.arc(d.x, d.y, d.radius, 0, Math.PI * 2);
      if (d.type === "xp") ctx.fillStyle = "#06b6d4";
      else if (d.type === "credit") ctx.fillStyle = "#facc15";
      else if (d.type === "health") ctx.fillStyle = "#22c55e";
      ctx.fill();
      ctx.shadowBlur = 8;
      ctx.shadowColor = ctx.fillStyle;
    });
    ctx.shadowBlur = 0;

    // Draw Particles (Glow Blend Mode)
    ctx.globalCompositeOperation = "lighter";
    ent.particles.forEach(pt => {
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, pt.size, 0, Math.PI * 2);
      ctx.fillStyle = pt.color;
      ctx.globalAlpha = pt.alpha;
      ctx.fill();
    });
    ctx.globalCompositeOperation = "source-over";
    ctx.globalAlpha = 1.0;

    // Draw Player Bullets
    ent.playerBullets.forEach(b => {
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
      ctx.fillStyle = b.color;
      ctx.fill();
      ctx.shadowBlur = 10;
      ctx.shadowColor = b.color;
    });
    ctx.shadowBlur = 0;

    // Draw Enemy Bullets
    ent.enemyBullets.forEach(b => {
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
      ctx.fillStyle = b.color;
      ctx.fill();
    });

    // Draw Enemies
    ent.enemies.forEach(e => {
      ctx.save();
      ctx.translate(e.x, e.y);
      ctx.rotate(e.angle);

      ctx.beginPath();
      if (e.type === "boss") {
        // Octagon Boss shape
        const r = e.radius;
        ctx.moveTo(r, 0);
        ctx.lineTo(r * 0.7, r * 0.7);
        ctx.lineTo(0, r);
        ctx.lineTo(-r * 0.7, r * 0.7);
        ctx.lineTo(-r, 0);
        ctx.lineTo(-r * 0.7, -r * 0.7);
        ctx.lineTo(0, -r);
        ctx.lineTo(r * 0.7, -r * 0.7);
      } else {
        // Triangle/Diamond Enemies
        ctx.moveTo(e.radius, 0);
        ctx.lineTo(-e.radius * 0.7, e.radius * 0.7);
        ctx.lineTo(-e.radius * 0.3, 0);
        ctx.lineTo(-e.radius * 0.7, -e.radius * 0.7);
      }
      ctx.closePath();
      ctx.fillStyle = e.color;
      ctx.fill();
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 1.5;
      ctx.stroke();

      ctx.restore();

      // Enemy Health Bar
      if (e.health < e.maxHealth) {
        const barW = e.radius * 2;
        const hpRatio = e.health / e.maxHealth;
        ctx.fillStyle = "#374151";
        ctx.fillRect(e.x - barW / 2, e.y - e.radius - 10, barW, 4);
        ctx.fillStyle = e.color;
        ctx.fillRect(e.x - barW / 2, e.y - e.radius - 10, barW * hpRatio, 4);
      }
    });

    // Draw Player Ship
    if (p.invulnerableTimer <= 0 || Math.floor(performance.now() / 100) % 2 === 0) {
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.angle);

      // Main Triangular Starfighter Shape
      ctx.beginPath();
      ctx.moveTo(p.radius + 4, 0);
      ctx.lineTo(-p.radius, p.radius * 0.8);
      ctx.lineTo(-p.radius * 0.4, 0);
      ctx.lineTo(-p.radius, -p.radius * 0.8);
      ctx.closePath();

      ctx.fillStyle = ship.color;
      ctx.fill();
      ctx.strokeStyle = ship.accent;
      ctx.lineWidth = 2;
      ctx.stroke();

      // Cockpit Glow
      ctx.beginPath();
      ctx.arc(2, 0, 4, 0, Math.PI * 2);
      ctx.fillStyle = "#ffffff";
      ctx.fill();

      ctx.restore();
    }

    // Draw Active Shield Matrix Effect
    if (p.shieldActive) {
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius + 12, 0, Math.PI * 2);
      ctx.strokeStyle = "#c084fc";
      ctx.lineWidth = 3;
      ctx.shadowBlur = 15;
      ctx.shadowColor = "#c084fc";
      ctx.stroke();
      ctx.shadowBlur = 0;
    }

    // Draw Orbiting Shield Drones
    if (p.orbitalShields > 0) {
      const time = performance.now() / 600;
      for (let i = 0; i < p.orbitalShields; i++) {
        const orbAngle = time + (i * Math.PI * 2) / p.orbitalShields;
        const ox = p.x + Math.cos(orbAngle) * 35;
        const oy = p.y + Math.sin(orbAngle) * 35;

        ctx.beginPath();
        ctx.arc(ox, oy, 5, 0, Math.PI * 2);
        ctx.fillStyle = "#06b6d4";
        ctx.fill();
        ctx.shadowBlur = 8;
        ctx.shadowColor = "#06b6d4";
      }
      ctx.shadowBlur = 0;
    }

    // Draw Floating Text Popups
    ent.floatingTexts.forEach(ft => {
      ctx.font = "bold 13px sans-serif";
      ctx.fillStyle = ft.color;
      ctx.globalAlpha = ft.alpha;
      ctx.fillText(ft.text, ft.x - 10, ft.y);
    });
    ctx.globalAlpha = 1.0;
  };

  // --- Touch Event Handlers for Mobile Controls ---
  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x = touch.clientX - rect.left;
    const y = touch.clientY - rect.top;

    if (x < rect.width / 2) {
      touchJoystickRef.current = {
        active: true,
        startX: x,
        startY: y,
        currX: x,
        currY: y
      };
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!touchJoystickRef.current.active) return;
    const touch = e.touches[0];
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    touchJoystickRef.current.currX = touch.clientX - rect.left;
    touchJoystickRef.current.currY = touch.clientY - rect.top;
  };

  const handleTouchEnd = () => {
    touchJoystickRef.current.active = false;
  };

  return (
    <div className="w-full min-h-screen bg-[#070514] text-white font-sans flex flex-col items-center justify-start relative overflow-hidden select-none">
      
      {/* Background Neon Grid Decorative Effect */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1f1a3a15_1px,transparent_1px),linear-gradient(to_bottom,#1f1a3a15_1px,transparent_1px)] bg-[size:4rem_4rem] pointer-events-none" />

      {/* Main Header Container */}
      <header className="w-full max-w-6xl px-4 py-4 flex items-center justify-between z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-black italic tracking-wider bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 via-indigo-400 to-purple-400">
              CYBER VORTEX ODYSSEY
            </h1>
            <p className="text-[10px] md:text-xs font-bold tracking-widest text-cyan-400/60 uppercase">
              Rogue-Lite Space Arcade Core
            </p>
          </div>
        </div>

        {/* Currency & High Score Badge */}
        <div className="flex items-center gap-4">
          <div className="hidden sm:flex items-center gap-2 bg-white/5 border border-white/10 px-3 py-1.5 rounded-xl backdrop-blur-md">
            <Trophy className="w-4 h-4 text-yellow-400" />
            <span className="text-xs font-bold text-white/70 uppercase">Best:</span>
            <span className="text-xs font-black text-yellow-400">{highScore}</span>
          </div>

          <div className="flex items-center gap-2 bg-yellow-500/10 border border-yellow-500/30 px-3 py-1.5 rounded-xl backdrop-blur-md">
            <span className="text-yellow-400 font-bold text-sm">⚡</span>
            <span className="text-xs font-black text-yellow-300">{credits} CR</span>
          </div>

          <button
            onClick={() => {
              const next = !soundEnabled;
              setSoundEnabled(next);
              sfx.enabled = next;
            }}
            className="p-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-all text-white/80"
          >
            {soundEnabled ? <Volume2 className="w-4 h-4 text-cyan-400" /> : <VolumeX className="w-4 h-4 text-rose-400" />}
          </button>
        </div>
      </header>

      {/* Game Stage Area */}
      <main className="w-full max-w-5xl px-4 flex-1 flex flex-col items-center justify-center relative z-10 pb-8">
        
        <div className="w-full aspect-[4/3] md:aspect-[16/9] bg-black rounded-2xl overflow-hidden relative border border-white/10 shadow-2xl flex flex-col items-center justify-center">
          
          <canvas
            ref={canvasRef}
            width={960}
            height={540}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            className="w-full h-full object-contain block bg-[#070514]"
          />

          {/* --- TOP HUD OVERLAY --- */}
          {gameState === "playing" && (
            <div className="absolute top-0 inset-x-0 p-4 flex justify-between items-start pointer-events-none backdrop-gradient-to-b from-black/80 to-transparent">
              {/* Left HUD: HP & Shield Bar */}
              <div className="flex flex-col gap-2 min-w-[200px]">
                <div className="flex justify-between items-center text-xs font-bold uppercase tracking-wider">
                  <span className="text-rose-400 flex items-center gap-1">
                    <Activity className="w-3.5 h-3.5" /> HP
                  </span>
                  <span className="text-white/80">{Math.ceil(health)} / {maxHealth}</span>
                </div>
                <div className="w-full h-3 bg-zinc-900 border border-white/10 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-rose-600 to-rose-400 transition-all duration-200" 
                    style={{ width: `${Math.max(0, (health / maxHealth) * 100)}%` }}
                  />
                </div>

                {/* Level XP Bar */}
                <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-wider mt-1">
                  <span className="text-cyan-400">LVL {level}</span>
                  <span className="text-white/60">{xp} / {xpToNext} XP</span>
                </div>
                <div className="w-full h-1.5 bg-zinc-900 border border-white/10 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-cyan-400 transition-all duration-200" 
                    style={{ width: `${Math.min(100, (xp / xpToNext) * 100)}%` }}
                  />
                </div>
              </div>

              {/* Center HUD: Wave & Score */}
              <div className="flex flex-col items-center">
                <div className="px-4 py-1 bg-white/10 border border-white/20 rounded-full backdrop-blur-md text-xs font-black tracking-widest uppercase text-cyan-300 shadow-lg">
                  WAVE {wave}
                </div>
                <div className="text-2xl font-black italic tracking-wider text-white mt-1">
                  {score.toLocaleString()}
                </div>
              </div>

              {/* Right HUD: Ability Cooldown & Pause */}
              <div className="flex items-center gap-3">
                <div className="flex flex-col items-end">
                  <span className="text-[10px] font-bold text-white/50 uppercase tracking-widest">
                    {SHIPS[selectedShipIndex].abilityName}
                  </span>
                  <button
                    onClick={triggerPlayerAbility}
                    disabled={abilityCdTimer > 0}
                    className={`mt-1 px-3 py-1.5 rounded-xl font-bold text-xs uppercase tracking-widest border pointer-events-auto transition-all ${
                      abilityCdTimer === 0 
                        ? "bg-cyan-500/20 border-cyan-400 text-cyan-300 shadow-[0_0_15px_rgba(6,182,212,0.4)] hover:bg-cyan-500/40" 
                        : "bg-white/5 border-white/10 text-white/40"
                    }`}
                  >
                    {abilityCdTimer > 0 ? `${abilityCdTimer}s` : "READY (E)"}
                  </button>
                </div>

                <button
                  onClick={() => setGameState("paused")}
                  className="p-2.5 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl text-white pointer-events-auto transition-all"
                >
                  <Pause className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* --- MAIN MENU MODAL OVERLAY --- */}
          {gameState === "menu" && (
            <div className="absolute inset-0 z-30 bg-black/85 backdrop-blur-md p-6 flex flex-col items-center justify-center text-center">
              
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-cyan-500 to-indigo-600 flex items-center justify-center shadow-2xl shadow-cyan-500/40 mb-4 animate-bounce">
                <Sparkles className="w-8 h-8 text-white" />
              </div>

              <h2 className="text-3xl md:text-5xl font-black italic tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-indigo-300 to-purple-400 mb-2">
                CYBER VORTEX ODYSSEY
              </h2>
              <p className="text-xs md:text-sm font-medium text-white/70 max-w-md mb-6">
                Pilot your custom apex starfighter, conquer alien rogue AI waves, collect neon shards, and unlock legendary rogue-lite perks.
              </p>

              {/* Ship Selector Carousel */}
              <div className="w-full max-w-lg mb-6">
                <div className="text-xs font-bold tracking-widest text-cyan-400 uppercase mb-3">
                  SELECT YOUR SHIP FRAME
                </div>
                <div className="grid grid-cols-3 gap-3">
                  {SHIPS.map((ship, idx) => (
                    <button
                      key={ship.id}
                      onClick={() => setSelectedShipIndex(idx)}
                      className={`p-3 rounded-2xl border text-left transition-all relative overflow-hidden ${
                        selectedShipIndex === idx
                          ? "bg-white/10 border-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.3)] scale-105"
                          : "bg-white/5 border-white/10 hover:bg-white/10 opacity-70"
                      }`}
                    >
                      <div className="w-3 h-3 rounded-full mb-2" style={{ backgroundColor: ship.color }} />
                      <div className="text-xs font-black tracking-tight text-white">{ship.name}</div>
                      <div className="text-[9px] font-semibold text-white/50">{ship.tagline}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-4 items-center">
                <button
                  onClick={startNewGame}
                  className="px-8 py-4 bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-black text-sm uppercase tracking-widest rounded-xl shadow-[0_0_30px_rgba(6,182,212,0.5)] transition-all transform hover:scale-105 flex items-center gap-2"
                >
                  <Play className="w-4 h-4 fill-white" /> Launch Mission
                </button>

                <button
                  onClick={() => setGameState("shop")}
                  className="px-6 py-4 bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold text-sm uppercase tracking-widest rounded-xl transition-all"
                >
                  Tech Hangar
                </button>
              </div>
            </div>
          )}

          {/* --- TECH HANGAR SHOP OVERLAY --- */}
          {gameState === "shop" && (
            <div className="absolute inset-0 z-30 bg-black/90 backdrop-blur-md p-6 flex flex-col items-center justify-center">
              <h2 className="text-2xl font-black italic tracking-widest uppercase text-cyan-400 mb-2">
                TECH HANGAR UPGRADES
              </h2>
              <p className="text-xs text-white/60 mb-6">Spend credits collected during runs for permanent hull upgrades.</p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-xl mb-6">
                {[
                  { key: "healthLvl", name: "Hull Armor", desc: "+20 Max HP per level", cost: (upgrades.healthLvl + 1) * 100, lvl: upgrades.healthLvl },
                  { key: "damageLvl", name: "Plasma Forge", desc: "+4 Bullet Damage per level", cost: (upgrades.damageLvl + 1) * 120, lvl: upgrades.damageLvl },
                  { key: "speedLvl", name: "Thruster Overdrive", desc: "+0.5 Speed per level", cost: (upgrades.speedLvl + 1) * 90, lvl: upgrades.speedLvl },
                  { key: "creditLvl", name: "Nano Harvester", desc: "+20% Credit Gain per level", cost: (upgrades.creditLvl + 1) * 150, lvl: upgrades.creditLvl }
                ].map(upg => (
                  <div key={upg.key} className="bg-white/5 border border-white/10 p-4 rounded-xl flex items-center justify-between">
                    <div>
                      <div className="text-sm font-bold text-white">{upg.name} (Lvl {upg.lvl})</div>
                      <div className="text-[10px] text-white/50">{upg.desc}</div>
                    </div>
                    <button
                      onClick={() => {
                        if (credits >= upg.cost) {
                          const nextCredits = credits - upg.cost;
                          const nextUpg = { ...upgrades, [upg.key]: upg.lvl + 1 };
                          setCredits(nextCredits);
                          setUpgrades(nextUpg);
                          saveProgress(nextCredits, highScore, nextUpg);
                        }
                      }}
                      disabled={credits < upg.cost}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase transition-all ${
                        credits >= upg.cost
                          ? "bg-yellow-500 hover:bg-yellow-400 text-black shadow-lg"
                          : "bg-white/5 text-white/30"
                      }`}
                    >
                      Buy {upg.cost} CR
                    </button>
                  </div>
                ))}
              </div>

              <button
                onClick={() => setGameState("menu")}
                className="px-6 py-2.5 bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold text-xs uppercase tracking-widest rounded-xl transition-all"
              >
                Back to Menu
              </button>
            </div>
          )}

          {/* --- ROGUE-LITE PERK SELECT MODAL --- */}
          {gameState === "perk_select" && (
            <div className="absolute inset-0 z-40 bg-black/85 backdrop-blur-md p-6 flex flex-col items-center justify-center text-center">
              <div className="px-4 py-1 bg-cyan-500/20 border border-cyan-400 rounded-full text-cyan-300 font-bold text-xs uppercase tracking-widest mb-2 animate-pulse">
                LEVEL UP! SELECT A PERK
              </div>
              <h2 className="text-2xl font-black italic tracking-widest text-white mb-6">
                TACTICAL MATRIX ENHANCEMENT
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full max-w-2xl">
                {perkOptions.map((perk, idx) => (
                  <button
                    key={idx}
                    onClick={() => applyPerk(perk)}
                    className="p-5 rounded-2xl bg-white/5 border border-white/10 hover:border-cyan-400 hover:bg-white/10 transition-all flex flex-col items-center text-center group transform hover:-translate-y-1 shadow-xl"
                  >
                    <div className="text-3xl mb-3 group-hover:scale-125 transition-transform">{perk.icon}</div>
                    <div className="text-sm font-black text-white group-hover:text-cyan-300 transition-colors mb-1">
                      {perk.name}
                    </div>
                    <div className="text-xs text-white/60 font-medium">{perk.description}</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* --- PAUSE OVERLAY --- */}
          {gameState === "paused" && (
            <div className="absolute inset-0 z-40 bg-black/80 backdrop-blur-md p-6 flex flex-col items-center justify-center text-center">
              <h2 className="text-3xl font-black italic tracking-widest text-white mb-6">GAME PAUSED</h2>
              <div className="flex gap-4">
                <button
                  onClick={() => setGameState("playing")}
                  className="px-6 py-3 bg-cyan-500 hover:bg-cyan-400 text-black font-bold text-xs uppercase tracking-widest rounded-xl transition-all"
                >
                  Resume Game
                </button>
                <button
                  onClick={() => setGameState("menu")}
                  className="px-6 py-3 bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold text-xs uppercase tracking-widest rounded-xl transition-all"
                >
                  Quit to Menu
                </button>
              </div>
            </div>
          )}

          {/* --- GAME OVER MODAL --- */}
          {gameState === "gameover" && (
            <div className="absolute inset-0 z-40 bg-black/90 backdrop-blur-md p-6 flex flex-col items-center justify-center text-center">
              <h2 className="text-4xl font-black italic tracking-widest text-rose-500 mb-2">
                MISSION FAILED
              </h2>
              <p className="text-xs text-white/50 uppercase tracking-widest mb-6">Starfighter Destroyed</p>

              {/* Run Summary Grid */}
              <div className="grid grid-cols-2 gap-4 w-full max-w-md bg-white/5 border border-white/10 p-5 rounded-2xl mb-6">
                <div>
                  <div className="text-[10px] font-bold text-white/40 uppercase">Final Score</div>
                  <div className="text-xl font-black text-cyan-400">{score.toLocaleString()}</div>
                </div>
                <div>
                  <div className="text-[10px] font-bold text-white/40 uppercase">Wave Reached</div>
                  <div className="text-xl font-black text-indigo-400">{wave}</div>
                </div>
                <div>
                  <div className="text-[10px] font-bold text-white/40 uppercase">Enemies Destroyed</div>
                  <div className="text-xl font-black text-rose-400">{runStats.kills}</div>
                </div>
                <div>
                  <div className="text-[10px] font-bold text-white/40 uppercase">Credits Earned</div>
                  <div className="text-xl font-black text-yellow-400">+{runStats.creditsEarned} CR</div>
                </div>
              </div>

              <div className="flex gap-4">
                <button
                  onClick={startNewGame}
                  className="px-6 py-3 bg-cyan-500 hover:bg-cyan-400 text-black font-black text-xs uppercase tracking-widest rounded-xl shadow-lg transition-all"
                >
                  Play Again
                </button>
                <button
                  onClick={() => setGameState("menu")}
                  className="px-6 py-3 bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold text-xs uppercase tracking-widest rounded-xl transition-all"
                >
                  Main Menu
                </button>
              </div>
            </div>
          )}

          {/* --- MOBILE TOUCH CONTROLS OVERLAY --- */}
          {gameState === "playing" && (
            <div className="md:hidden absolute inset-0 pointer-events-none flex justify-between items-end p-6 z-20">
              {/* Left Virtual Joystick Area */}
              <div className="w-32 h-32 rounded-full border-2 border-white/20 bg-black/30 backdrop-blur-sm relative flex items-center justify-center">
                <div className="w-12 h-12 rounded-full bg-cyan-400/40 border border-cyan-300" />
              </div>

              {/* Right Action Buttons */}
              <div className="flex gap-3 pointer-events-auto">
                <button
                  onTouchStart={() => (touchFireRef.current = true)}
                  onTouchEnd={() => (touchFireRef.current = false)}
                  className="w-16 h-16 rounded-full bg-rose-500/30 border border-rose-400 active:bg-rose-500/60 flex items-center justify-center text-white font-black text-xs uppercase tracking-widest shadow-lg"
                >
                  FIRE
                </button>
              </div>
            </div>
          )}

        </div>

        {/* Game Instructions Footer Bar */}
        <div className="w-full mt-4 bg-white/5 border border-white/10 rounded-2xl p-4 flex flex-col md:flex-row items-center justify-between gap-3 text-xs text-white/60">
          <div className="flex items-center gap-2">
            <span className="font-bold text-white uppercase tracking-wider">Controls:</span>
            <span>WASD / Arrows = Move</span> • <span>Space = Shoot</span> • <span>E / Shift = Ability</span> • <span>P = Pause</span>
          </div>
          <div className="text-[10px] font-semibold text-white/40 uppercase tracking-widest">
            Xakteir Leaderboard Score Sync Enabled
          </div>
        </div>

      </main>

    </div>
  );
}
