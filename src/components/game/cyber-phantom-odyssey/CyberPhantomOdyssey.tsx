"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
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
  Sparkles,
  Swords,
  Award,
  Info,
  Flame,
  Activity,
  ChevronRight,
  Target,
  Clock,
  Radio,
  BarChart2
} from "lucide-react";

// --- TYPES & INTERFACES ---

export type WeaponType = "blaster" | "railgun" | "shotgun" | "missile" | "singularity";

export interface WeaponConfig {
  id: WeaponType;
  name: string;
  fireRate: number; // ms delay
  damage: number;
  speed: number;
  color: string;
  description: string;
  unlocked: boolean;
  level: number;
}

export interface Perk {
  id: string;
  title: string;
  description: string;
  icon: string;
  type: "stat" | "weapon" | "ability";
  apply: (state: GameStateRef) => void;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlocked: boolean;
}

export interface FloatingText {
  id: string;
  x: number;
  y: number;
  text: string;
  color: string;
  alpha: number;
  scale: number;
  vy: number;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
  alpha: number;
  decay: number;
  shape?: "circle" | "spark" | "ring";
}

export interface Projectile {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  damage: number;
  color: string;
  isEnemy: boolean;
  penetrates: boolean;
  pierceCount?: number;
  lifeTime: number;
  type: WeaponType | "enemy_standard" | "enemy_boss_beam" | "enemy_orb";
}

export interface Enemy {
  id: string;
  type: "swarmer" | "gunner" | "tanker" | "stalker" | "boss";
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  speed: number;
  health: number;
  maxHealth: number;
  color: string;
  attackCooldown: number;
  stealthOpacity?: number;
  bossPhase?: number;
  bossAngle?: number;
  scoreValue: number;
}

export interface XpOrb {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  value: number;
  type: "normal" | "large" | "heal" | "magnet";
  radius: number;
}

export interface Drone {
  angle: number;
  distance: number;
  fireCooldown: number;
}

export interface GameStateRef {
  player: {
    x: number;
    y: number;
    vx: number;
    vy: number;
    radius: number;
    speed: number;
    health: number;
    maxHealth: number;
    shield: number;
    maxShield: number;
    shieldRegenTimer: number;
    xp: number;
    level: number;
    xpToNextLevel: number;
    dashCooldown: number;
    dashMaxCooldown: number;
    isDashing: boolean;
    dashTimer: number;
    empCooldown: number;
    empMaxCooldown: number;
    invulnerableTimer: number;
    damageMultiplier: number;
    fireRateMultiplier: number;
    critChance: number;
    magnetRadius: number;
    activeWeapon: WeaponType;
    drones: Drone[];
  };
  weapons: Record<WeaponType, WeaponConfig>;
  enemies: Enemy[];
  projectiles: Projectile[];
  particles: Particle[];
  xpOrbs: XpOrb[];
  floatingTexts: FloatingText[];
  score: number;
  wave: number;
  enemiesKilled: number;
  damageDealt: number;
  survivalTime: number;
  comboCount: number;
  comboTimer: number;
  bossActive: boolean;
}

// --- SOUND SYNTHESIZER (WEB AUDIO API) ---

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

  public playLaser(type: WeaponType = "blaster") {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = type === "railgun" ? "sawtooth" : type === "shotgun" ? "triangle" : "sine";
      const now = this.ctx.currentTime;

      if (type === "railgun") {
        osc.frequency.setValueAtTime(800, now);
        osc.frequency.exponentialRampToValueAtTime(100, now + 0.2);
        gain.gain.setValueAtTime(0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.2);
      } else if (type === "shotgun") {
        osc.frequency.setValueAtTime(300, now);
        osc.frequency.exponentialRampToValueAtTime(60, now + 0.15);
        gain.gain.setValueAtTime(0.25, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.15);
      } else {
        osc.frequency.setValueAtTime(600, now);
        osc.frequency.exponentialRampToValueAtTime(150, now + 0.08);
        gain.gain.setValueAtTime(0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.08);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.08);
      }
    } catch {
      // Audio fallback
    }
  }

  public playExplosion(isLarge = false) {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const bufferSize = this.ctx.sampleRate * (isLarge ? 0.4 : 0.2);
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const output = buffer.getChannelData(0);

      for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
      }

      const whiteNoise = this.ctx.createBufferSource();
      whiteNoise.buffer = buffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.setValueAtTime(isLarge ? 400 : 800, now);
      filter.frequency.exponentialRampToValueAtTime(30, now + (isLarge ? 0.4 : 0.2));

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(isLarge ? 0.4 : 0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + (isLarge ? 0.4 : 0.2));

      whiteNoise.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);

      whiteNoise.start(now);
    } catch {
      // Audio fallback
    }
  }

  public playDash() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(200, now);
      osc.frequency.exponentialRampToValueAtTime(700, now + 0.12);

      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.12);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.12);
    } catch {
      // Audio fallback
    }
  }

  public playEmp() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(1000, now);
      osc.frequency.exponentialRampToValueAtTime(80, now + 0.35);

      gain.gain.setValueAtTime(0.35, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.35);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.35);
    } catch {
      // Audio fallback
    }
  }

  public playLevelUp() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    try {
      const notes = [440, 554.37, 659.25, 880];
      notes.forEach((freq, idx) => {
        const now = this.ctx!.currentTime + idx * 0.08;
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();

        osc.type = "triangle";
        osc.frequency.setValueAtTime(freq, now);

        gain.gain.setValueAtTime(0.25, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

        osc.connect(gain);
        gain.connect(this.ctx!.destination);
        osc.start(now);
        osc.stop(now + 0.2);
      });
    } catch {
      // Audio fallback
    }
  }

  public playXp() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(900 + Math.random() * 200, now);
      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.05);
    } catch {
      // Audio fallback
    }
  }
}

const sounds = new SoundEngine();

// --- PERKS DATA ---

const ALL_PERKS: Perk[] = [
  {
    id: "perk_damage_1",
    title: "Plasma Overcharge",
    description: "+25% Weapon Damage Output across all weapons.",
    icon: "Flame",
    type: "stat",
    apply: (g) => {
      g.player.damageMultiplier *= 1.25;
    }
  },
  {
    id: "perk_firerate_1",
    title: "Tachyon Accelerator",
    description: "+20% Attack Speed & Fire Rate.",
    icon: "Zap",
    type: "stat",
    apply: (g) => {
      g.player.fireRateMultiplier *= 1.2;
    }
  },
  {
    id: "perk_health_1",
    title: "Nanite Armor Matrix",
    description: "+50 Max Health & immediate 50 HP restoration.",
    icon: "Shield",
    type: "stat",
    apply: (g) => {
      g.player.maxHealth += 50;
      g.player.health = Math.min(g.player.maxHealth, g.player.health + 50);
    }
  },
  {
    id: "perk_speed_1",
    title: "Graviton Thrusters",
    description: "+18% Movement Speed & Faster Dash Cooldown.",
    icon: "Activity",
    type: "stat",
    apply: (g) => {
      g.player.speed *= 1.18;
      g.player.dashMaxCooldown = Math.max(1, g.player.dashMaxCooldown * 0.85);
    }
  },
  {
    id: "perk_crit_1",
    title: "Targeting Matrix",
    description: "+15% Critical Strike Chance for double damage.",
    icon: "Crosshair",
    type: "stat",
    apply: (g) => {
      g.player.critChance += 0.15;
    }
  },
  {
    id: "perk_magnet_1",
    title: "Singularity Magnet",
    description: "+60% XP Orb Collection Attraction Radius.",
    icon: "Sparkles",
    type: "stat",
    apply: (g) => {
      g.player.magnetRadius *= 1.6;
    }
  },
  {
    id: "perk_drone_1",
    title: "Orbital Defense Drone",
    description: "Deploy an automated orbital drone firing laser salvos.",
    icon: "Radio",
    type: "ability",
    apply: (g) => {
      g.player.drones.push({
        angle: (g.player.drones.length * Math.PI) / 2,
        distance: 60,
        fireCooldown: 0
      });
    }
  },
  {
    id: "perk_weapon_railgun",
    title: "Unlock Quantum Railgun",
    description: "Unlocks high-velocity piercing beam weapon.",
    icon: "Swords",
    type: "weapon",
    apply: (g) => {
      g.weapons.railgun.unlocked = true;
      g.weapons.railgun.level += 1;
      g.player.activeWeapon = "railgun";
    }
  },
  {
    id: "perk_weapon_shotgun",
    title: "Unlock Plasma Shotgun",
    description: "Unlocks heavy multi-pellet spreading burst cannon.",
    icon: "Target",
    type: "weapon",
    apply: (g) => {
      g.weapons.shotgun.unlocked = true;
      g.weapons.shotgun.level += 1;
      g.player.activeWeapon = "shotgun";
    }
  },
  {
    id: "perk_weapon_missile",
    title: "Unlock Photon Homing Missiles",
    description: "Fires self-guided tracking missiles targeting enemies.",
    icon: "Zap",
    type: "weapon",
    apply: (g) => {
      g.weapons.missile.unlocked = true;
      g.weapons.missile.level += 1;
      g.player.activeWeapon = "missile";
    }
  }
];

export default function CyberPhantomOdyssey() {
  // Game states
  const [gameState, setGameState] = useState<"menu" | "playing" | "paused" | "levelup" | "gameover" | "victory">("menu");
  const [soundMuted, setSoundMuted] = useState(false);
  const [highScore, setHighScore] = useState(0);

  // Level Up UI state
  const [perkOptions, setPerkOptions] = useState<Perk[]>([]);

  // Persistent HUD state (synced from ref during tick)
  const [hudState, setHudState] = useState({
    health: 100,
    maxHealth: 100,
    shield: 50,
    maxShield: 50,
    xp: 0,
    xpToNext: 100,
    level: 1,
    score: 0,
    wave: 1,
    dashCdRatio: 1,
    empCdRatio: 1,
    activeWeapon: "blaster" as WeaponType,
    bossActive: false,
    bossHealthRatio: 1
  });

  const [stats, setStats] = useState({
    score: 0,
    enemiesKilled: 0,
    damageDealt: 0,
    survivalTime: 0,
    wave: 1
  });

  // Canvas & loop refs
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationFrameId = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(0);

  // Input states
  const keysRef = useRef<Record<string, boolean>>({});
  const mouseRef = useRef<{ x: number; y: number; isDown: boolean }>({ x: 0, y: 0, isDown: false });

  // Core Game Ref State (avoiding React re-render lag during 60FPS canvas loop)
  const gameRef = useRef<GameStateRef>({
    player: {
      x: 600,
      y: 400,
      vx: 0,
      vy: 0,
      radius: 18,
      speed: 4.8,
      health: 100,
      maxHealth: 100,
      shield: 50,
      maxShield: 50,
      shieldRegenTimer: 0,
      xp: 0,
      level: 1,
      xpToNextLevel: 60,
      dashCooldown: 0,
      dashMaxCooldown: 3,
      isDashing: false,
      dashTimer: 0,
      empCooldown: 0,
      empMaxCooldown: 8,
      invulnerableTimer: 0,
      damageMultiplier: 1,
      fireRateMultiplier: 1,
      critChance: 0.05,
      magnetRadius: 150,
      activeWeapon: "blaster",
      drones: []
    },
    weapons: {
      blaster: {
        id: "blaster",
        name: "Cyber Blaster",
        fireRate: 150,
        damage: 22,
        speed: 12,
        color: "#00f0ff",
        description: "Standard high-frequency energy bolt shooter.",
        unlocked: true,
        level: 1
      },
      railgun: {
        id: "railgun",
        name: "Quantum Railgun",
        fireRate: 600,
        damage: 110,
        speed: 24,
        color: "#ff0055",
        description: "Heavy piercing tachyon beam penetrating multiple targets.",
        unlocked: false,
        level: 0
      },
      shotgun: {
        id: "shotgun",
        name: "Plasma Cannon",
        fireRate: 450,
        damage: 16,
        speed: 10,
        color: "#ffaa00",
        description: "Fires a wide spread array of 6 plasma energy pellets.",
        unlocked: false,
        level: 0
      },
      missile: {
        id: "missile",
        name: "Photon Missiles",
        fireRate: 400,
        damage: 45,
        speed: 8,
        color: "#33ff00",
        description: "Self-seeking photon missiles locking onto hostile targets.",
        unlocked: false,
        level: 0
      },
      singularity: {
        id: "singularity",
        name: "Singularity Vortex",
        fireRate: 900,
        damage: 85,
        speed: 6,
        color: "#aa00ff",
        description: "Creates gravitational vortexes dragging foes together.",
        unlocked: false,
        level: 0
      }
    },
    enemies: [],
    projectiles: [],
    particles: [],
    xpOrbs: [],
    floatingTexts: [],
    score: 0,
    wave: 1,
    enemiesKilled: 0,
    damageDealt: 0,
    survivalTime: 0,
    comboCount: 0,
    comboTimer: 0,
    bossActive: false
  });

  const lastShootTime = useRef<number>(0);
  const waveTimer = useRef<number>(0);

  // Load High Score on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("cyber_phantom_highscore");
      if (saved) {
        setHighScore(parseInt(saved, 10) || 0);
      }
    }
  }, []);

  // --- INITIALIZE / RESET GAME ---

  const initGame = useCallback(() => {
    const canvas = canvasRef.current;
    const width = canvas ? canvas.width : 1200;
    const height = canvas ? canvas.height : 800;

    gameRef.current = {
      player: {
        x: width / 2,
        y: height / 2,
        vx: 0,
        vy: 0,
        radius: 18,
        speed: 4.8,
        health: 100,
        maxHealth: 100,
        shield: 50,
        maxShield: 50,
        shieldRegenTimer: 0,
        xp: 0,
        level: 1,
        xpToNextLevel: 60,
        dashCooldown: 0,
        dashMaxCooldown: 3,
        isDashing: false,
        dashTimer: 0,
        empCooldown: 0,
        empMaxCooldown: 8,
        invulnerableTimer: 0,
        damageMultiplier: 1,
        fireRateMultiplier: 1,
        critChance: 0.05,
        magnetRadius: 150,
        activeWeapon: "blaster",
        drones: []
      },
      weapons: {
        blaster: {
          id: "blaster",
          name: "Cyber Blaster",
          fireRate: 150,
          damage: 22,
          speed: 12,
          color: "#00f0ff",
          description: "Standard high-frequency energy bolt shooter.",
          unlocked: true,
          level: 1
        },
        railgun: {
          id: "railgun",
          name: "Quantum Railgun",
          fireRate: 600,
          damage: 110,
          speed: 24,
          color: "#ff0055",
          description: "Heavy piercing tachyon beam penetrating multiple targets.",
          unlocked: false,
          level: 0
        },
        shotgun: {
          id: "shotgun",
          name: "Plasma Cannon",
          fireRate: 450,
          damage: 16,
          speed: 10,
          color: "#ffaa00",
          description: "Fires a wide spread array of 6 plasma energy pellets.",
          unlocked: false,
          level: 0
        },
        missile: {
          id: "missile",
          name: "Photon Missiles",
          fireRate: 400,
          damage: 45,
          speed: 8,
          color: "#33ff00",
          description: "Self-seeking photon missiles locking onto hostile targets.",
          unlocked: false,
          level: 0
        },
        singularity: {
          id: "singularity",
          name: "Singularity Vortex",
          fireRate: 900,
          damage: 85,
          speed: 6,
          color: "#aa00ff",
          description: "Creates gravitational vortexes dragging foes together.",
          unlocked: false,
          level: 0
        }
      },
      enemies: [],
      projectiles: [],
      particles: [],
      xpOrbs: [],
      floatingTexts: [],
      score: 0,
      wave: 1,
      enemiesKilled: 0,
      damageDealt: 0,
      survivalTime: 0,
      comboCount: 0,
      comboTimer: 0,
      bossActive: false
    };

    waveTimer.current = 0;
    lastShootTime.current = 0;
  }, []);

  // --- SPAWN ENEMY HELPERS ---

  const spawnEnemy = useCallback((type: Enemy["type"] = "swarmer") => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const width = canvas.width;
    const height = canvas.height;

    // Spawn on screen edges
    let x = 0;
    let y = 0;
    const edge = Math.floor(Math.random() * 4);
    if (edge === 0) {
      x = Math.random() * width;
      y = -30;
    } else if (edge === 1) {
      x = width + 30;
      y = Math.random() * height;
    } else if (edge === 2) {
      x = Math.random() * width;
      y = height + 30;
    } else {
      x = -30;
      y = Math.random() * height;
    }

    const wave = gameRef.current.wave;
    let enemy: Enemy;

    if (type === "boss") {
      enemy = {
        id: "boss_" + Date.now(),
        type: "boss",
        x: width / 2,
        y: 100,
        vx: 0,
        vy: 0,
        radius: 45,
        speed: 1.8,
        health: 800 + wave * 400,
        maxHealth: 800 + wave * 400,
        color: "#ff0055",
        attackCooldown: 0,
        bossPhase: 1,
        bossAngle: 0,
        scoreValue: 1500
      };
      gameRef.current.bossActive = true;
    } else if (type === "tanker") {
      enemy = {
        id: "tanker_" + Math.random(),
        type: "tanker",
        x,
        y,
        vx: 0,
        vy: 0,
        radius: 26,
        speed: 1.4 + Math.min(2, wave * 0.1),
        health: 120 + wave * 30,
        maxHealth: 120 + wave * 30,
        color: "#aa00ff",
        attackCooldown: 0,
        scoreValue: 120
      };
    } else if (type === "gunner") {
      enemy = {
        id: "gunner_" + Math.random(),
        type: "gunner",
        x,
        y,
        vx: 0,
        vy: 0,
        radius: 16,
        speed: 2.2 + Math.min(2, wave * 0.1),
        health: 40 + wave * 10,
        maxHealth: 40 + wave * 10,
        color: "#00ffaa",
        attackCooldown: 0,
        scoreValue: 70
      };
    } else if (type === "stalker") {
      enemy = {
        id: "stalker_" + Math.random(),
        type: "stalker",
        x,
        y,
        vx: 0,
        vy: 0,
        radius: 14,
        speed: 3.5 + Math.min(2, wave * 0.15),
        health: 30 + wave * 8,
        maxHealth: 30 + wave * 8,
        color: "#ffaa00",
        attackCooldown: 0,
        stealthOpacity: 0.2,
        scoreValue: 80
      };
    } else {
      // Swarmer
      enemy = {
        id: "swarmer_" + Math.random(),
        type: "swarmer",
        x,
        y,
        vx: 0,
        vy: 0,
        radius: 12,
        speed: 3.0 + Math.min(2.5, wave * 0.15),
        health: 20 + wave * 6,
        maxHealth: 20 + wave * 6,
        color: "#ff3300",
        attackCooldown: 0,
        scoreValue: 35
      };
    }

    gameRef.current.enemies.push(enemy);
  }, []);

  // --- TRIGGER DASH ---
  const triggerDash = useCallback(() => {
    const player = gameRef.current.player;
    if (player.dashCooldown <= 0 && !player.isDashing) {
      player.isDashing = true;
      player.dashTimer = 0.2; // 200ms dash
      player.dashCooldown = player.dashMaxCooldown;
      player.invulnerableTimer = 0.3;
      sounds.playDash();

      // Create ghost particle trail
      for (let i = 0; i < 12; i++) {
        gameRef.current.particles.push({
          x: player.x + (Math.random() - 0.5) * 20,
          y: player.y + (Math.random() - 0.5) * 20,
          vx: -player.vx * 0.5 + (Math.random() - 0.5) * 2,
          vy: -player.vy * 0.5 + (Math.random() - 0.5) * 2,
          radius: 8 + Math.random() * 6,
          color: "#00f0ff",
          alpha: 0.8,
          decay: 0.05
        });
      }
    }
  }, []);

  // --- TRIGGER EMP NOVA ---
  const triggerEmp = useCallback(() => {
    const player = gameRef.current.player;
    if (player.empCooldown <= 0) {
      player.empCooldown = player.empMaxCooldown;
      sounds.playEmp();

      // Clear non-boss projectiles & push enemies back
      gameRef.current.projectiles = gameRef.current.projectiles.filter((p) => !p.isEnemy);

      gameRef.current.enemies.forEach((e) => {
        const dx = e.x - player.x;
        const dy = e.y - player.y;
        const dist = Math.hypot(dx, dy) || 1;
        if (dist < 350) {
          const pushForce = (350 - dist) * 0.8;
          e.x += (dx / dist) * pushForce;
          e.y += (dy / dist) * pushForce;
          e.health -= 40 * player.damageMultiplier;

          gameRef.current.floatingTexts.push({
            id: "emp_" + Math.random(),
            x: e.x,
            y: e.y,
            text: "EMP!",
            color: "#00f0ff",
            alpha: 1,
            scale: 1.3,
            vy: -1.5
          });
        }
      });

      // EMP Shockwave visual rings
      for (let r = 20; r <= 350; r += 40) {
        for (let a = 0; a < Math.PI * 2; a += Math.PI / 8) {
          gameRef.current.particles.push({
            x: player.x + Math.cos(a) * r,
            y: player.y + Math.sin(a) * r,
            vx: Math.cos(a) * 4,
            vy: Math.sin(a) * 4,
            radius: 6,
            color: "#00f0ff",
            alpha: 0.9,
            decay: 0.04,
            shape: "ring"
          });
        }
      }
    }
  }, []);

  // --- TRIGGER SHOOTING ---
  const fireWeapon = useCallback(() => {
    const player = gameRef.current.player;
    const weapon = gameRef.current.weapons[player.activeWeapon];
    if (!weapon || !weapon.unlocked) return;

    const dx = mouseRef.current.x - player.x;
    const dy = mouseRef.current.y - player.y;
    const angle = Math.atan2(dy, dx);

    const isCrit = Math.random() < player.critChance;
    const finalDamage = weapon.damage * player.damageMultiplier * (isCrit ? 2 : 1);

    sounds.playLaser(player.activeWeapon);

    if (player.activeWeapon === "shotgun") {
      // 6 spread pellets
      const pelletCount = 6;
      const spreadAngle = 0.35;
      for (let i = 0; i < pelletCount; i++) {
        const pAngle = angle - spreadAngle / 2 + (spreadAngle / (pelletCount - 1)) * i + (Math.random() - 0.5) * 0.05;
        gameRef.current.projectiles.push({
          x: player.x + Math.cos(angle) * 20,
          y: player.y + Math.sin(angle) * 20,
          vx: Math.cos(pAngle) * weapon.speed,
          vy: Math.sin(pAngle) * weapon.speed,
          radius: 5,
          damage: finalDamage,
          color: weapon.color,
          isEnemy: false,
          penetrates: false,
          lifeTime: 1.2,
          type: "shotgun"
        });
      }
    } else if (player.activeWeapon === "railgun") {
      // High speed beam penetrating
      gameRef.current.projectiles.push({
        x: player.x + Math.cos(angle) * 20,
        y: player.y + Math.sin(angle) * 20,
        vx: Math.cos(angle) * weapon.speed,
        vy: Math.sin(angle) * weapon.speed,
        radius: 8,
        damage: finalDamage,
        color: weapon.color,
        isEnemy: false,
        penetrates: true,
        pierceCount: 5,
        lifeTime: 2.0,
        type: "railgun"
      });
    } else if (player.activeWeapon === "missile") {
      // Homing missile
      gameRef.current.projectiles.push({
        x: player.x + Math.cos(angle) * 20,
        y: player.y + Math.sin(angle) * 20,
        vx: Math.cos(angle) * weapon.speed,
        vy: Math.sin(angle) * weapon.speed,
        radius: 6,
        damage: finalDamage,
        color: weapon.color,
        isEnemy: false,
        penetrates: false,
        lifeTime: 3.0,
        type: "missile"
      });
    } else {
      // Standard Cyber Blaster (Dual fire offset)
      const offset = 10;
      const perpAngle = angle + Math.PI / 2;

      gameRef.current.projectiles.push({
        x: player.x + Math.cos(perpAngle) * offset,
        y: player.y + Math.sin(perpAngle) * offset,
        vx: Math.cos(angle) * weapon.speed,
        vy: Math.sin(angle) * weapon.speed,
        radius: 5,
        damage: finalDamage,
        color: weapon.color,
        isEnemy: false,
        penetrates: false,
        lifeTime: 1.8,
        type: "blaster"
      });

      gameRef.current.projectiles.push({
        x: player.x - Math.cos(perpAngle) * offset,
        y: player.y - Math.sin(perpAngle) * offset,
        vx: Math.cos(angle) * weapon.speed,
        vy: Math.sin(angle) * weapon.speed,
        radius: 5,
        damage: finalDamage,
        color: weapon.color,
        isEnemy: false,
        penetrates: false,
        lifeTime: 1.8,
        type: "blaster"
      });
    }
  }, []);

  // --- TRIGGER LEVEL UP ---
  const triggerLevelUp = useCallback(() => {
    sounds.playLevelUp();

    // Pick 3 random distinct perks
    const shuffled = [...ALL_PERKS].sort(() => 0.5 - Math.random());
    const selected = shuffled.slice(0, 3);
    setPerkOptions(selected);

    setGameState("levelup");
  }, []);

  const selectPerk = (perk: Perk) => {
    perk.apply(gameRef.current);

    // Increase level requirements
    const player = gameRef.current.player;
    player.level += 1;
    player.xp -= player.xpToNextLevel;
    player.xpToNextLevel = Math.floor(player.xpToNextLevel * 1.35);

    setGameState("playing");
  };

  // --- MAIN GAME LOOP (TICK & RENDER) ---

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let localLastTime = performance.now();

    const gameLoop = (time: number) => {
      const dt = Math.min((time - localLastTime) / 1000, 0.1); // Clamp delta time
      localLastTime = time;

      if (gameState === "playing") {
        // --- 1. UPDATE GAME STATE ---
        const g = gameRef.current;
        const player = g.player;

        g.survivalTime += dt;
        waveTimer.current += dt;

        // Wave spawner logic
        if (waveTimer.current > 15) {
          g.wave += 1;
          waveTimer.current = 0;

          // Check if boss wave (every 5 waves)
          if (g.wave % 5 === 0 && !g.bossActive) {
            spawnEnemy("boss");
          }
        }

        // Spawn ambient enemies based on wave number
        const maxEnemies = 15 + g.wave * 4;
        if (g.enemies.length < maxEnemies && Math.random() < 0.05 + g.wave * 0.005) {
          const rand = Math.random();
          if (rand < 0.5) spawnEnemy("swarmer");
          else if (rand < 0.75) spawnEnemy("gunner");
          else if (rand < 0.9) spawnEnemy("tanker");
          else spawnEnemy("stalker");
        }

        // Player Movement
        let moveX = 0;
        let moveY = 0;
        if (keysRef.current["w"] || keysRef.current["W"] || keysRef.current["ArrowUp"]) moveY -= 1;
        if (keysRef.current["s"] || keysRef.current["S"] || keysRef.current["ArrowDown"]) moveY += 1;
        if (keysRef.current["a"] || keysRef.current["A"] || keysRef.current["ArrowLeft"]) moveX -= 1;
        if (keysRef.current["d"] || keysRef.current["D"] || keysRef.current["ArrowRight"]) moveX += 1;

        if (moveX !== 0 && moveY !== 0) {
          moveX *= 0.7071;
          moveY *= 0.7071;
        }

        const speedMult = player.isDashing ? 2.8 : 1.0;
        player.vx = moveX * player.speed * speedMult;
        player.vy = moveY * player.speed * speedMult;

        player.x = Math.max(player.radius, Math.min(canvas.width - player.radius, player.x + player.vx));
        player.y = Math.max(player.radius, Math.min(canvas.height - player.radius, player.y + player.vy));

        // Cooldown Timers
        if (player.dashCooldown > 0) player.dashCooldown -= dt;
        if (player.empCooldown > 0) player.empCooldown -= dt;
        if (player.invulnerableTimer > 0) player.invulnerableTimer -= dt;

        if (player.isDashing) {
          player.dashTimer -= dt;
          if (player.dashTimer <= 0) player.isDashing = false;
        }

        // Shield Recharge Logic
        if (player.shield < player.maxShield) {
          player.shieldRegenTimer += dt;
          if (player.shieldRegenTimer > 4.0) {
            player.shield = Math.min(player.maxShield, player.shield + 15 * dt);
          }
        }

        // Mouse Shooting
        if (mouseRef.current.isDown) {
          const now = performance.now();
          const weapon = g.weapons[player.activeWeapon];
          if (weapon && now - lastShootTime.current >= weapon.fireRate / player.fireRateMultiplier) {
            fireWeapon();
            lastShootTime.current = now;
          }
        }

        // Orbital Drones
        player.drones.forEach((drone) => {
          drone.angle += dt * 2.5;
          drone.fireCooldown -= dt;

          if (drone.fireCooldown <= 0 && g.enemies.length > 0) {
            drone.fireCooldown = 0.6;
            // Find closest enemy
            const droneX = player.x + Math.cos(drone.angle) * drone.distance;
            const droneY = player.y + Math.sin(drone.angle) * drone.distance;

            let closest: Enemy | null = null;
            let minDist = 400;
            g.enemies.forEach((e) => {
              const dist = Math.hypot(e.x - droneX, e.y - droneY);
              if (dist < minDist) {
                minDist = dist;
                closest = e;
              }
            });

            if (closest) {
              const target = closest as Enemy;
              const angle = Math.atan2(target.y - droneY, target.x - droneX);
              g.projectiles.push({
                x: droneX,
                y: droneY,
                vx: Math.cos(angle) * 11,
                vy: Math.sin(angle) * 11,
                radius: 4,
                damage: 15 * player.damageMultiplier,
                color: "#00ffff",
                isEnemy: false,
                penetrates: false,
                lifeTime: 1.0,
                type: "blaster"
              });
            }
          }
        });

        // Update Projectiles
        for (let i = g.projectiles.length - 1; i >= 0; i--) {
          const p = g.projectiles[i];

          // Homing logic for photon missiles
          if (p.type === "missile" && !p.isEnemy && g.enemies.length > 0) {
            let closest: Enemy | null = null;
            let minDist = 500;
            g.enemies.forEach((e) => {
              const dist = Math.hypot(e.x - p.x, e.y - p.y);
              if (dist < minDist) {
                minDist = dist;
                closest = e;
              }
            });

            if (closest) {
              const target = closest as Enemy;
              const targetAngle = Math.atan2(target.y - p.y, target.x - p.x);
              const currentAngle = Math.atan2(p.vy, p.vx);
              const newAngle = currentAngle + (targetAngle - currentAngle) * 0.12;
              const speed = Math.hypot(p.vx, p.vy);
              p.vx = Math.cos(newAngle) * speed;
              p.vy = Math.sin(newAngle) * speed;
            }
          }

          p.x += p.vx;
          p.y += p.vy;
          p.lifeTime -= dt;

          if (p.lifeTime <= 0 || p.x < -50 || p.x > canvas.width + 50 || p.y < -50 || p.y > canvas.height + 50) {
            g.projectiles.splice(i, 1);
            continue;
          }

          // Player projectile vs Enemy collision
          if (!p.isEnemy) {
            for (let j = g.enemies.length - 1; j >= 0; j--) {
              const e = g.enemies[j];
              const dist = Math.hypot(e.x - p.x, e.y - p.y);

              if (dist < e.radius + p.radius) {
                e.health -= p.damage;
                g.damageDealt += p.damage;

                // Floating Damage Number
                g.floatingTexts.push({
                  id: "dmg_" + Math.random(),
                  x: e.x + (Math.random() - 0.5) * 15,
                  y: e.y - 10,
                  text: Math.round(p.damage).toString(),
                  color: p.color,
                  alpha: 1,
                  scale: 1,
                  vy: -1.2
                });

                // Impact sparks
                for (let k = 0; k < 4; k++) {
                  g.particles.push({
                    x: p.x,
                    y: p.y,
                    vx: (Math.random() - 0.5) * 6,
                    vy: (Math.random() - 0.5) * 6,
                    radius: 3 + Math.random() * 3,
                    color: p.color,
                    alpha: 0.9,
                    decay: 0.08
                  });
                }

                if (!p.penetrates) {
                  g.projectiles.splice(i, 1);
                  break;
                } else if (p.pierceCount !== undefined) {
                  p.pierceCount--;
                  if (p.pierceCount <= 0) {
                    g.projectiles.splice(i, 1);
                    break;
                  }
                }
              }
            }
          } else {
            // Enemy projectile vs Player collision
            const dist = Math.hypot(player.x - p.x, player.y - p.y);
            if (dist < player.radius + p.radius && player.invulnerableTimer <= 0) {
              // Apply damage to shield first
              let dmg = p.damage;
              if (player.shield > 0) {
                const shieldDmg = Math.min(player.shield, dmg);
                player.shield -= shieldDmg;
                dmg -= shieldDmg;
              }
              if (dmg > 0) {
                player.health -= dmg;
              }

              player.shieldRegenTimer = 0; // Reset shield regen timer
              player.invulnerableTimer = 0.5; // Brief invulnerability
              sounds.playExplosion(false);

              g.projectiles.splice(i, 1);
              if (player.health <= 0) {
                setStats({
                  score: g.score,
                  enemiesKilled: g.enemiesKilled,
                  damageDealt: Math.round(g.damageDealt),
                  survivalTime: Math.round(g.survivalTime),
                  wave: g.wave
                });
                if (g.score > highScore) {
                  setHighScore(g.score);
                  if (typeof window !== "undefined") {
                    localStorage.setItem("cyber_phantom_highscore", g.score.toString());
                  }
                }
                setGameState("gameover");
              }
            }
          }
        }

        // Update Enemies & AI
        for (let i = g.enemies.length - 1; i >= 0; i--) {
          const e = g.enemies[i];

          if (e.health <= 0) {
            // Enemy Death
            g.enemiesKilled += 1;
            g.score += e.scoreValue;
            sounds.playExplosion(e.type === "boss");

            // Drop XP Orbs
            const orbCount = e.type === "boss" ? 15 : e.type === "tanker" ? 4 : 1;
            for (let o = 0; o < orbCount; o++) {
              g.xpOrbs.push({
                id: "orb_" + Math.random(),
                x: e.x + (Math.random() - 0.5) * 20,
                y: e.y + (Math.random() - 0.5) * 20,
                vx: (Math.random() - 0.5) * 3,
                vy: (Math.random() - 0.5) * 3,
                value: e.type === "boss" ? 50 : 15,
                type: Math.random() < 0.1 ? "heal" : "normal",
                radius: 6
              });
            }

            // Explosion Particles
            const particleCount = e.type === "boss" ? 40 : 12;
            for (let p = 0; p < particleCount; p++) {
              g.particles.push({
                x: e.x,
                y: e.y,
                vx: (Math.random() - 0.5) * 8,
                vy: (Math.random() - 0.5) * 8,
                radius: 4 + Math.random() * 6,
                color: e.color,
                alpha: 1,
                decay: 0.03
              });
            }

            if (e.type === "boss") {
              g.bossActive = false;
            }

            g.enemies.splice(i, 1);
            continue;
          }

          // Enemy Movement AI
          const dx = player.x - e.x;
          const dy = player.y - e.y;
          const dist = Math.hypot(dx, dy) || 1;

          if (e.type === "gunner") {
            // Keep distance and fire plasma
            if (dist > 250) {
              e.x += (dx / dist) * e.speed;
              e.y += (dy / dist) * e.speed;
            } else if (dist < 180) {
              e.x -= (dx / dist) * e.speed;
              e.y -= (dy / dist) * e.speed;
            }

            e.attackCooldown -= dt;
            if (e.attackCooldown <= 0) {
              e.attackCooldown = 2.0;
              const angle = Math.atan2(dy, dx);
              g.projectiles.push({
                x: e.x,
                y: e.y,
                vx: Math.cos(angle) * 6,
                vy: Math.sin(angle) * 6,
                radius: 5,
                damage: 12,
                color: e.color,
                isEnemy: true,
                penetrates: false,
                lifeTime: 2.5,
                type: "enemy_standard"
              });
            }
          } else if (e.type === "boss") {
            // Boss AI Patterns
            e.bossAngle = (e.bossAngle || 0) + dt * 0.8;
            e.x = canvas.width / 2 + Math.cos(e.bossAngle) * 200;
            e.y = 120 + Math.sin(e.bossAngle * 2) * 50;

            e.attackCooldown -= dt;
            if (e.attackCooldown <= 0) {
              e.attackCooldown = 1.2;
              // Spiral projectile pattern
              for (let a = 0; a < Math.PI * 2; a += Math.PI / 4) {
                const pAngle = a + e.bossAngle;
                g.projectiles.push({
                  x: e.x,
                  y: e.y,
                  vx: Math.cos(pAngle) * 5,
                  vy: Math.sin(pAngle) * 5,
                  radius: 7,
                  damage: 18,
                  color: "#ff0055",
                  isEnemy: true,
                  penetrates: false,
                  lifeTime: 3.5,
                  type: "enemy_orb"
                });
              }
            }
          } else {
            // Swarmer / Tanker / Stalker chase player directly
            e.x += (dx / dist) * e.speed;
            e.y += (dy / dist) * e.speed;
          }

          // Enemy vs Player Body Contact Collision
          if (dist < player.radius + e.radius && player.invulnerableTimer <= 0) {
            let dmg = e.type === "boss" ? 40 : 15;
            if (player.shield > 0) {
              const shieldDmg = Math.min(player.shield, dmg);
              player.shield -= shieldDmg;
              dmg -= shieldDmg;
            }
            if (dmg > 0) {
              player.health -= dmg;
            }

            player.shieldRegenTimer = 0;
            player.invulnerableTimer = 0.5;
            sounds.playExplosion(false);

            if (player.health <= 0) {
              setStats({
                score: g.score,
                enemiesKilled: g.enemiesKilled,
                damageDealt: Math.round(g.damageDealt),
                survivalTime: Math.round(g.survivalTime),
                wave: g.wave
              });
              if (g.score > highScore) {
                setHighScore(g.score);
                if (typeof window !== "undefined") {
                  localStorage.setItem("cyber_phantom_highscore", g.score.toString());
                }
              }
              setGameState("gameover");
            }
          }
        }

        // Update XP Orbs
        for (let i = g.xpOrbs.length - 1; i >= 0; i--) {
          const orb = g.xpOrbs[i];
          const dx = player.x - orb.x;
          const dy = player.y - orb.y;
          const dist = Math.hypot(dx, dy);

          // Magnet Attraction
          if (dist < player.magnetRadius) {
            orb.vx += (dx / dist) * 0.8;
            orb.vy += (dy / dist) * 0.8;
            orb.x += orb.vx;
            orb.y += orb.vy;
          }

          if (dist < player.radius + orb.radius) {
            if (orb.type === "heal") {
              player.health = Math.min(player.maxHealth, player.health + 20);
              g.floatingTexts.push({
                id: "heal_" + Math.random(),
                x: player.x,
                y: player.y - 15,
                text: "+20 HP",
                color: "#00ff88",
                alpha: 1,
                scale: 1.2,
                vy: -1.2
              });
            } else {
              player.xp += orb.value;
              sounds.playXp();
            }

            g.xpOrbs.splice(i, 1);

            // Level Up Check
            if (player.xp >= player.xpToNextLevel) {
              triggerLevelUp();
              break;
            }
          }
        }

        // Update Floating Texts
        for (let i = g.floatingTexts.length - 1; i >= 0; i--) {
          const ft = g.floatingTexts[i];
          ft.y += ft.vy;
          ft.alpha -= 0.02;
          if (ft.alpha <= 0) g.floatingTexts.splice(i, 1);
        }

        // Update Particles
        for (let i = g.particles.length - 1; i >= 0; i--) {
          const pt = g.particles[i];
          pt.x += pt.vx;
          pt.y += pt.vy;
          pt.alpha -= pt.decay;
          if (pt.alpha <= 0) g.particles.splice(i, 1);
        }

        // Sync React HUD state
        const boss = g.enemies.find((e) => e.type === "boss");
        setHudState({
          health: Math.max(0, Math.round(player.health)),
          maxHealth: player.maxHealth,
          shield: Math.max(0, Math.round(player.shield)),
          maxShield: player.maxShield,
          xp: player.xp,
          xpToNext: player.xpToNextLevel,
          level: player.level,
          score: g.score,
          wave: g.wave,
          dashCdRatio: Math.max(0, 1 - player.dashCooldown / player.dashMaxCooldown),
          empCdRatio: Math.max(0, 1 - player.empCooldown / player.empMaxCooldown),
          activeWeapon: player.activeWeapon,
          bossActive: g.bossActive,
          bossHealthRatio: boss ? boss.health / boss.maxHealth : 1
        });
      }

      // --- 2. RENDER CANVAS GRAPHICS ---

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Cyber Grid Background
      ctx.strokeStyle = "rgba(0, 240, 255, 0.06)";
      ctx.lineWidth = 1;
      const gridSize = 40;
      const offset = (time * 0.02) % gridSize;

      for (let x = 0; x < canvas.width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
      }
      for (let y = offset; y < canvas.height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
      }

      const g = gameRef.current;
      const player = g.player;

      // Draw XP Orbs
      g.xpOrbs.forEach((orb) => {
        ctx.save();
        ctx.shadowBlur = 10;
        ctx.shadowColor = orb.type === "heal" ? "#00ff88" : "#00f0ff";
        ctx.fillStyle = orb.type === "heal" ? "#00ff88" : "#00f0ff";
        ctx.beginPath();
        ctx.arc(orb.x, orb.y, orb.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });

      // Draw Particles
      g.particles.forEach((pt) => {
        ctx.save();
        ctx.globalAlpha = Math.max(0, pt.alpha);
        ctx.fillStyle = pt.color;
        ctx.shadowBlur = 6;
        ctx.shadowColor = pt.color;

        if (pt.shape === "ring") {
          ctx.strokeStyle = pt.color;
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(pt.x, pt.y, pt.radius, 0, Math.PI * 2);
          ctx.stroke();
        } else {
          ctx.beginPath();
          ctx.arc(pt.x, pt.y, pt.radius, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      });

      // Draw Enemies
      g.enemies.forEach((e) => {
        ctx.save();
        ctx.shadowBlur = 12;
        ctx.shadowColor = e.color;
        ctx.fillStyle = e.color;

        if (e.type === "boss") {
          // Epic Boss rendering
          ctx.beginPath();
          ctx.arc(e.x, e.y, e.radius, 0, Math.PI * 2);
          ctx.fill();

          // Rotating outer ring armor
          ctx.strokeStyle = "#ffffff";
          ctx.lineWidth = 4;
          ctx.beginPath();
          ctx.arc(e.x, e.y, e.radius + 10, e.bossAngle || 0, (e.bossAngle || 0) + Math.PI * 1.5);
          ctx.stroke();

          // Boss Health Bar overhead
          const barW = 80;
          ctx.fillStyle = "rgba(0,0,0,0.6)";
          ctx.fillRect(e.x - barW / 2, e.y - e.radius - 18, barW, 6);
          ctx.fillStyle = "#ff0055";
          ctx.fillRect(e.x - barW / 2, e.y - e.radius - 18, barW * (e.health / e.maxHealth), 6);
        } else {
          // Standard / Swarmer / Tanker / Gunner
          ctx.beginPath();
          ctx.arc(e.x, e.y, e.radius, 0, Math.PI * 2);
          ctx.fill();

          // Health bar
          if (e.health < e.maxHealth) {
            const barW = e.radius * 2;
            ctx.fillStyle = "rgba(0,0,0,0.6)";
            ctx.fillRect(e.x - barW / 2, e.y - e.radius - 8, barW, 4);
            ctx.fillStyle = "#00ff88";
            ctx.fillRect(e.x - barW / 2, e.y - e.radius - 8, barW * (e.health / e.maxHealth), 4);
          }
        }
        ctx.restore();
      });

      // Draw Projectiles
      g.projectiles.forEach((p) => {
        ctx.save();
        ctx.shadowBlur = 12;
        ctx.shadowColor = p.color;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });

      // Draw Player Drones
      player.drones.forEach((drone) => {
        const dx = player.x + Math.cos(drone.angle) * drone.distance;
        const dy = player.y + Math.sin(drone.angle) * drone.distance;

        ctx.save();
        ctx.shadowBlur = 10;
        ctx.shadowColor = "#00ffff";
        ctx.fillStyle = "#00ffff";
        ctx.beginPath();
        ctx.arc(dx, dy, 7, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });

      // Draw Player Mech Ship
      ctx.save();
      const aimAngle = Math.atan2(mouseRef.current.y - player.y, mouseRef.current.x - player.x);

      ctx.translate(player.x, player.y);
      ctx.rotate(aimAngle);

      // Player Shield Glow Ring
      if (player.shield > 0) {
        ctx.save();
        ctx.strokeStyle = `rgba(0, 240, 255, ${0.4 + (player.shield / player.maxShield) * 0.5})`;
        ctx.lineWidth = 3;
        ctx.shadowBlur = 12;
        ctx.shadowColor = "#00f0ff";
        ctx.beginPath();
        ctx.arc(0, 0, player.radius + 6, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }

      // Player Triangular Cyber Ship Body
      ctx.shadowBlur = 15;
      ctx.shadowColor = "#00f0ff";
      ctx.fillStyle = "#00f0ff";
      ctx.beginPath();
      ctx.moveTo(player.radius + 4, 0);
      ctx.lineTo(-player.radius, -player.radius + 4);
      ctx.lineTo(-player.radius + 6, 0);
      ctx.lineTo(-player.radius, player.radius - 4);
      ctx.closePath();
      ctx.fill();

      // Ship Cockpit Core
      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      ctx.arc(2, 0, 5, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();

      // Draw Floating Texts
      g.floatingTexts.forEach((ft) => {
        ctx.save();
        ctx.globalAlpha = Math.max(0, ft.alpha);
        ctx.font = `bold ${Math.round(14 * ft.scale)}px sans-serif`;
        ctx.fillStyle = ft.color;
        ctx.shadowBlur = 6;
        ctx.shadowColor = ft.color;
        ctx.fillText(ft.text, ft.x, ft.y);
        ctx.restore();
      });

      animationFrameId.current = requestAnimationFrame(gameLoop);
    };

    animationFrameId.current = requestAnimationFrame(gameLoop);

    return () => {
      if (animationFrameId.current) cancelAnimationFrame(animationFrameId.current);
    };
  }, [gameState, fireWeapon, spawnEnemy, triggerLevelUp, highScore]);

  // --- EVENT LISTENERS FOR CONTROLS ---

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      keysRef.current[e.key] = true;

      if (e.key === " ") {
        triggerDash();
      } else if (e.key === "e" || e.key === "E") {
        triggerEmp();
      } else if (e.key === "1") {
        if (gameRef.current.weapons.blaster.unlocked) gameRef.current.player.activeWeapon = "blaster";
      } else if (e.key === "2") {
        if (gameRef.current.weapons.railgun.unlocked) gameRef.current.player.activeWeapon = "railgun";
      } else if (e.key === "3") {
        if (gameRef.current.weapons.shotgun.unlocked) gameRef.current.player.activeWeapon = "shotgun";
      } else if (e.key === "4") {
        if (gameRef.current.weapons.missile.unlocked) gameRef.current.player.activeWeapon = "missile";
      } else if (e.key === "p" || e.key === "P" || e.key === "Escape") {
        if (gameState === "playing") setGameState("paused");
        else if (gameState === "paused") setGameState("playing");
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      keysRef.current[e.key] = false;
    };

    const handleMouseMove = (e: MouseEvent) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      mouseRef.current.x = e.clientX - rect.left;
      mouseRef.current.y = e.clientY - rect.top;
    };

    const handleMouseDown = () => {
      mouseRef.current.isDown = true;
    };

    const handleMouseUp = () => {
      mouseRef.current.isDown = false;
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
  }, [gameState, triggerDash, triggerEmp]);

  const startGame = () => {
    initGame();
    setGameState("playing");
  };

  return (
    <div className="relative w-full min-h-screen bg-slate-950 text-white font-sans flex flex-col items-center justify-center p-4 overflow-hidden select-none">
      {/* BACKGROUND GLOW DECORATION */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-fuchsia-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* HEADER TITLE BAR */}
      <header className="w-full max-w-6xl flex items-center justify-between py-3 px-6 bg-slate-900/80 backdrop-blur border border-slate-800 rounded-2xl mb-4 shadow-2xl">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl shadow-lg shadow-cyan-500/30">
            <Swords className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-wider bg-gradient-to-r from-cyan-400 via-teal-300 to-indigo-400 bg-clip-text text-transparent">
              CYBER PHANTOM ODYSSEY
            </h1>
            <p className="text-xs text-slate-400 font-mono">TACTICAL CYBERNETIC ARCADE ROGUE-LITE</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 bg-slate-800/80 px-3 py-1.5 rounded-lg border border-slate-700 font-mono text-sm">
            <Trophy className="w-4 h-4 text-amber-400" />
            <span className="text-slate-400">HIGH SCORE:</span>
            <span className="text-amber-400 font-bold">{highScore}</span>
          </div>

          <button
            onClick={() => {
              sounds.muted = !soundMuted;
              setSoundMuted(!soundMuted);
            }}
            className="p-2 bg-slate-800 hover:bg-slate-700 rounded-xl border border-slate-700 text-slate-300 hover:text-white transition"
          >
            {soundMuted ? <VolumeX className="w-5 h-5 text-red-400" /> : <Volume2 className="w-5 h-5 text-cyan-400" />}
          </button>
        </div>
      </header>

      {/* MAIN GAME CONTAINER */}
      <div className="relative w-full max-w-6xl aspect-[3/2] bg-slate-900/90 rounded-2xl border border-slate-800 shadow-2xl overflow-hidden flex flex-col">
        {/* TOP GAMEPLAY HUD (Visible during gameplay) */}
        {gameState === "playing" && (
          <div className="absolute top-0 left-0 right-0 z-10 p-4 bg-gradient-to-b from-slate-950/90 via-slate-950/40 to-transparent flex flex-col gap-2">
            {/* Health, Shield, XP & Boss Bars */}
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-4 flex-1">
                {/* Health Bar */}
                <div className="flex-1 bg-slate-950/80 border border-slate-800 rounded-lg p-2 backdrop-blur">
                  <div className="flex justify-between text-xs font-mono mb-1 text-slate-300">
                    <span className="flex items-center gap-1">
                      <Shield className="w-3.5 h-3.5 text-cyan-400" /> SHIELD: {hudState.shield} / {hudState.maxShield}
                    </span>
                    <span className="flex items-center gap-1">
                      <Activity className="w-3.5 h-3.5 text-emerald-400" /> HP: {hudState.health} / {hudState.maxHealth}
                    </span>
                  </div>
                  <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden flex gap-1">
                    <div
                      className="bg-gradient-to-r from-cyan-500 to-blue-500 transition-all duration-150 h-full"
                      style={{ width: `${(hudState.shield / hudState.maxShield) * 100}%` }}
                    />
                    <div
                      className="bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-150 h-full"
                      style={{ width: `${(hudState.health / hudState.maxHealth) * 100}%` }}
                    />
                  </div>
                </div>

                {/* XP Bar & Level */}
                <div className="w-64 bg-slate-950/80 border border-slate-800 rounded-lg p-2 backdrop-blur">
                  <div className="flex justify-between text-xs font-mono mb-1 text-slate-300">
                    <span className="text-amber-400 font-bold">LVL {hudState.level}</span>
                    <span>
                      XP {hudState.xp} / {hudState.xpToNext}
                    </span>
                  </div>
                  <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-amber-400 to-yellow-300 transition-all duration-150 h-full"
                      style={{ width: `${(hudState.xp / hudState.xpToNext) * 100}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Wave & Score Stats */}
              <div className="flex items-center gap-3 bg-slate-950/80 border border-slate-800 rounded-lg px-4 py-2 font-mono text-sm">
                <div>
                  <span className="text-slate-500 text-xs block">WAVE</span>
                  <span className="text-cyan-400 font-bold text-base">{hudState.wave}</span>
                </div>
                <div className="h-6 w-px bg-slate-800" />
                <div>
                  <span className="text-slate-500 text-xs block">SCORE</span>
                  <span className="text-amber-400 font-bold text-base">{hudState.score}</span>
                </div>
              </div>
            </div>

            {/* Boss Warning Banner */}
            {hudState.bossActive && (
              <div className="w-full bg-red-950/80 border border-red-800/80 rounded-xl p-2 flex flex-col gap-1 backdrop-blur animate-pulse">
                <div className="flex justify-between text-xs font-bold font-mono text-red-400">
                  <span>WARNING: DREADNOUGHT BOSS DETECTED</span>
                  <span>{Math.round(hudState.bossHealthRatio * 100)}%</span>
                </div>
                <div className="w-full bg-slate-900 h-3 rounded-full overflow-hidden border border-red-900">
                  <div
                    className="bg-gradient-to-r from-red-600 via-rose-500 to-pink-500 h-full transition-all duration-200"
                    style={{ width: `${hudState.bossHealthRatio * 100}%` }}
                  />
                </div>
              </div>
            )}

            {/* Cooldown Icons */}
            <div className="flex items-center justify-between text-xs font-mono text-slate-400 mt-1">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5 bg-slate-950/70 border border-slate-800 px-2.5 py-1 rounded-md">
                  <Zap className={`w-3.5 h-3.5 ${hudState.dashCdRatio >= 1 ? "text-cyan-400" : "text-slate-600"}`} />
                  <span>DASH [SPACE]:</span>
                  <span className={hudState.dashCdRatio >= 1 ? "text-cyan-400 font-bold" : "text-slate-500"}>
                    {hudState.dashCdRatio >= 1 ? "READY" : `${Math.round(hudState.dashCdRatio * 100)}%`}
                  </span>
                </div>

                <div className="flex items-center gap-1.5 bg-slate-950/70 border border-slate-800 px-2.5 py-1 rounded-md">
                  <Sparkles className={`w-3.5 h-3.5 ${hudState.empCdRatio >= 1 ? "text-indigo-400" : "text-slate-600"}`} />
                  <span>EMP NOVA [E]:</span>
                  <span className={hudState.empCdRatio >= 1 ? "text-indigo-400 font-bold" : "text-slate-500"}>
                    {hudState.empCdRatio >= 1 ? "READY" : `${Math.round(hudState.empCdRatio * 100)}%`}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-slate-500">WEAPONS [1-4]:</span>
                <span className="text-cyan-300 uppercase font-bold">{gameRef.current.weapons[hudState.activeWeapon]?.name}</span>
              </div>
            </div>
          </div>
        )}

        {/* CANVAS GRAPHICS VIEWPORT */}
        <canvas ref={canvasRef} width={1200} height={800} className="w-full h-full object-cover block bg-slate-950" />

        {/* MAIN MENU OVERLAY */}
        {gameState === "menu" && (
          <div className="absolute inset-0 z-20 bg-slate-950/90 backdrop-blur-md flex flex-col items-center justify-center p-8 text-center">
            <div className="max-w-xl flex flex-col items-center gap-6">
              <div className="p-4 bg-gradient-to-br from-cyan-500/20 to-blue-600/20 border border-cyan-500/40 rounded-2xl shadow-2xl shadow-cyan-500/20">
                <Swords className="w-16 h-16 text-cyan-400 animate-pulse" />
              </div>

              <div>
                <h2 className="text-4xl font-extrabold tracking-wider bg-gradient-to-r from-cyan-400 via-teal-300 to-indigo-400 bg-clip-text text-transparent">
                  CYBER PHANTOM ODYSSEY
                </h2>
                <p className="text-slate-400 text-sm mt-2 font-mono">
                  Pilot your cybernetic interceptor mech through endless waves of rogue AI armadas, acquire powerful weapon evolutions,
                  and defeat dreadnought boss cores.
                </p>
              </div>

              {/* Controls Guide */}
              <div className="grid grid-cols-2 gap-3 w-full bg-slate-900/80 border border-slate-800 p-4 rounded-xl text-left text-xs font-mono">
                <div className="flex items-center gap-2 text-slate-300">
                  <span className="px-2 py-1 bg-slate-800 border border-slate-700 rounded text-cyan-400 font-bold">W A S D</span>
                  <span>Move Ship</span>
                </div>
                <div className="flex items-center gap-2 text-slate-300">
                  <span className="px-2 py-1 bg-slate-800 border border-slate-700 rounded text-cyan-400 font-bold">MOUSE</span>
                  <span>Aim & Fire</span>
                </div>
                <div className="flex items-center gap-2 text-slate-300">
                  <span className="px-2 py-1 bg-slate-800 border border-slate-700 rounded text-cyan-400 font-bold">SPACE</span>
                  <span>Phase Dash</span>
                </div>
                <div className="flex items-center gap-2 text-slate-300">
                  <span className="px-2 py-1 bg-slate-800 border border-slate-700 rounded text-cyan-400 font-bold">E KEY</span>
                  <span>EMP Shockwave</span>
                </div>
              </div>

              <button
                onClick={startGame}
                className="w-full py-4 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-extrabold text-lg tracking-wider rounded-xl shadow-lg shadow-cyan-500/30 transition transform hover:scale-105 flex items-center justify-center gap-3"
              >
                <Play className="w-6 h-6 fill-current" /> LAUNCH MISSION
              </button>
            </div>
          </div>
        )}

        {/* LEVEL UP PERK SELECTOR OVERLAY */}
        {gameState === "levelup" && (
          <div className="absolute inset-0 z-30 bg-slate-950/85 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center">
            <div className="max-w-2xl w-full flex flex-col items-center gap-6">
              <div className="flex items-center gap-2 text-amber-400 text-sm font-mono tracking-widest uppercase">
                <Sparkles className="w-5 h-5" /> SYSTEM UPGRADE AVAILABLE
              </div>

              <h2 className="text-3xl font-extrabold text-white">CHOOSE A CYBERNETIC PERK</h2>

              <div className="grid grid-cols-3 gap-4 w-full">
                {perkOptions.map((perk) => (
                  <button
                    key={perk.id}
                    onClick={() => selectPerk(perk)}
                    className="flex flex-col items-center p-5 bg-slate-900/90 hover:bg-slate-800 border border-slate-800 hover:border-cyan-500/60 rounded-2xl text-left transition transform hover:-translate-y-1 group shadow-xl"
                  >
                    <div className="p-3 bg-slate-800 group-hover:bg-cyan-500/20 rounded-xl mb-4 border border-slate-700 group-hover:border-cyan-500/40">
                      <Zap className="w-8 h-8 text-cyan-400" />
                    </div>
                    <h3 className="text-base font-bold text-white mb-2 group-hover:text-cyan-300">{perk.title}</h3>
                    <p className="text-xs text-slate-400 leading-relaxed">{perk.description}</p>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* PAUSE OVERLAY */}
        {gameState === "paused" && (
          <div className="absolute inset-0 z-30 bg-slate-950/80 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center">
            <div className="max-w-md w-full bg-slate-900 border border-slate-800 p-8 rounded-2xl shadow-2xl flex flex-col gap-6">
              <h2 className="text-2xl font-bold text-white tracking-wide">SYSTEM PAUSED</h2>

              <div className="flex flex-col gap-3">
                <button
                  onClick={() => setGameState("playing")}
                  className="py-3 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold rounded-xl shadow-lg transition"
                >
                  RESUME MISSION
                </button>

                <button
                  onClick={startGame}
                  className="py-3 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl border border-slate-700 transition"
                >
                  RESTART MISSION
                </button>

                <button
                  onClick={() => setGameState("menu")}
                  className="py-3 bg-slate-950 hover:bg-slate-900 text-slate-400 font-bold rounded-xl border border-slate-800 transition"
                >
                  ABORT TO MENU
                </button>
              </div>
            </div>
          </div>
        )}

        {/* GAME OVER DEFEAT SCREEN */}
        {gameState === "gameover" && (
          <div className="absolute inset-0 z-30 bg-slate-950/90 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center">
            <div className="max-w-lg w-full bg-slate-900 border border-slate-800 p-8 rounded-2xl shadow-2xl flex flex-col items-center gap-6">
              <div className="p-4 bg-red-500/20 border border-red-500/40 rounded-full">
                <Info className="w-12 h-12 text-red-400" />
              </div>

              <div>
                <h2 className="text-3xl font-extrabold text-red-400 tracking-wider">MECH DESTROYED</h2>
                <p className="text-xs text-slate-400 font-mono mt-1">MISSION TERMINATED - CORE OVERHEAT</p>
              </div>

              <div className="w-full bg-slate-950 border border-slate-800 p-4 rounded-xl font-mono text-xs text-left grid grid-cols-2 gap-3">
                <div>
                  <span className="text-slate-500 block">FINAL SCORE</span>
                  <span className="text-amber-400 font-bold text-lg">{stats.score}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">WAVES SURVIVED</span>
                  <span className="text-cyan-400 font-bold text-lg">{stats.wave}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">ENEMIES SLAIN</span>
                  <span className="text-emerald-400 font-bold text-base">{stats.enemiesKilled}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">SURVIVAL TIME</span>
                  <span className="text-indigo-400 font-bold text-base">{stats.survivalTime}s</span>
                </div>
              </div>

              <button
                onClick={startGame}
                className="w-full py-3.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold rounded-xl shadow-lg transition flex items-center justify-center gap-2"
              >
                <RotateCcw className="w-5 h-5" /> TRY AGAIN
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
