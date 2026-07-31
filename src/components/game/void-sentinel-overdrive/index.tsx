"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import {
  Play,
  RotateCcw,
  Shield,
  Zap,
  Crosshair,
  Award,
  Volume2,
  VolumeX,
  Pause,
  Sparkles,
  ArrowLeft,
  Flame,
  Radio,
  Target,
  ShoppingCart,
  ChevronRight,
  TrendingUp,
  Cpu,
  RefreshCw
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// ==========================================
// TYPES & INTERFACES
// ==========================================
type GameState = "MENU" | "PLAYING" | "PAUSED" | "LEVEL_UP" | "SHOP" | "GAME_OVER" | "VICTORY";

interface Weapon {
  id: string;
  name: string;
  fireRate: number; // ms delay
  damage: number;
  speed: number;
  spread: number;
  projectilesPerShot: number;
  energyCost: number;
  color: string;
  unlocked: boolean;
  cost: number;
  level: number;
  description: string;
}

interface Ability {
  id: string;
  name: string;
  cooldown: number; // ms
  lastUsed: number;
  duration: number; // ms
  activeTimer: number;
  energyCost: number;
  description: string;
  color: string;
  icon: string;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
  glow?: boolean;
}

interface Bullet {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
  damage: number;
  isEnemy: boolean;
  pierce: number;
  trail: { x: number; y: number }[];
}

interface Enemy {
  id: number;
  type: "SWARMER" | "INTERCEPTOR" | "HEAVY" | "SNIPER" | "STALKER" | "BOSS";
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  hp: number;
  maxHp: number;
  shield: number;
  maxShield: number;
  color: string;
  speed: number;
  scoreValue: number;
  xpValue: number;
  creditsValue: number;
  lastShot: number;
  fireRate: number;
  bossPhase?: number;
  telegraphTimer?: number;
}

interface DropItem {
  id: number;
  x: number;
  y: number;
  type: "XP" | "HEALTH" | "SHIELD" | "ENERGY" | "CREDITS" | "OVERDRIVE";
  value: number;
  radius: number;
}

interface FloatingText {
  id: number;
  x: number;
  y: number;
  text: string;
  color: string;
  life: number;
  maxLife: number;
  vy: number;
}

interface Perk {
  id: string;
  name: string;
  description: string;
  icon: string;
  type: "STAT" | "WEAPON" | "ABILITY" | "DRONE";
  value: number;
  statKey?: string;
  color: string;
}

interface Drone {
  id: number;
  angle: number;
  orbitRadius: number;
  lastShot: number;
  color: string;
}

// ==========================================
// WEB AUDIO SYNTHESIZER ENGINE
// ==========================================
const playSynthSound = (
  type: "shot" | "railgun" | "explosion" | "hit" | "pickup" | "levelUp" | "overdrive" | "emp" | "gameOver",
  audioCtx: AudioContext | null,
  muted: boolean
) => {
  if (!audioCtx || muted) return;
  try {
    if (audioCtx.state === "suspended") {
      audioCtx.resume();
    }
    const now = audioCtx.currentTime;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    osc.connect(gain);
    gain.connect(audioCtx.destination);

    if (type === "shot") {
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.exponentialRampToValueAtTime(110, now + 0.08);
      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.08);
      osc.start(now);
      osc.stop(now + 0.08);
    } else if (type === "railgun") {
      osc.type = "square";
      osc.frequency.setValueAtTime(880, now);
      osc.frequency.exponentialRampToValueAtTime(60, now + 0.25);
      gain.gain.setValueAtTime(0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);
      osc.start(now);
      osc.stop(now + 0.25);
    } else if (type === "explosion") {
      osc.type = "triangle";
      osc.frequency.setValueAtTime(160, now);
      osc.frequency.exponentialRampToValueAtTime(30, now + 0.35);
      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.35);
      osc.start(now);
      osc.stop(now + 0.35);
    } else if (type === "hit") {
      osc.type = "sine";
      osc.frequency.setValueAtTime(220, now);
      osc.frequency.exponentialRampToValueAtTime(80, now + 0.05);
      gain.gain.setValueAtTime(0.1, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.05);
      osc.start(now);
      osc.stop(now + 0.05);
    } else if (type === "pickup") {
      osc.type = "sine";
      osc.frequency.setValueAtTime(523.25, now); // C5
      osc.frequency.setValueAtTime(659.25, now + 0.05); // E5
      osc.frequency.setValueAtTime(783.99, now + 0.1); // G5
      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.18);
      osc.start(now);
      osc.stop(now + 0.18);
    } else if (type === "levelUp") {
      osc.type = "triangle";
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.setValueAtTime(554.37, now + 0.1);
      osc.frequency.setValueAtTime(659.25, now + 0.2);
      osc.frequency.setValueAtTime(880, now + 0.3);
      gain.gain.setValueAtTime(0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.45);
      osc.start(now);
      osc.stop(now + 0.45);
    } else if (type === "overdrive") {
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(200, now);
      osc.frequency.linearRampToValueAtTime(1200, now + 0.4);
      gain.gain.setValueAtTime(0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.45);
      osc.start(now);
      osc.stop(now + 0.45);
    } else if (type === "emp") {
      osc.type = "sine";
      osc.frequency.setValueAtTime(800, now);
      osc.frequency.exponentialRampToValueAtTime(50, now + 0.5);
      gain.gain.setValueAtTime(0.35, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.5);
      osc.start(now);
      osc.stop(now + 0.5);
    } else if (type === "gameOver") {
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(300, now);
      osc.frequency.exponentialRampToValueAtTime(40, now + 0.7);
      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.7);
      osc.start(now);
      osc.stop(now + 0.7);
    }
  } catch {
    // Ignore audio initialization restrictions
  }
};

// ==========================================
// DEFAULT WEAPONS & PERKS DEFINITIONS
// ==========================================
const INITIAL_WEAPONS: Weapon[] = [
  {
    id: "plasma_pulse",
    name: "Dual Plasma Blaster",
    fireRate: 140,
    damage: 22,
    speed: 14,
    spread: 0.08,
    projectilesPerShot: 2,
    energyCost: 1.5,
    color: "#00f0ff",
    unlocked: true,
    cost: 0,
    level: 1,
    description: "Rapid twin plasma bursts with balanced speed and high stability."
  },
  {
    id: "quantum_railgun",
    name: "Quantum Hyper-Railgun",
    fireRate: 450,
    damage: 110,
    speed: 26,
    spread: 0.01,
    projectilesPerShot: 1,
    energyCost: 6,
    color: "#7000ff",
    unlocked: false,
    cost: 350,
    level: 1,
    description: "High-impact piercing energy beam that shreds heavily armored foes."
  },
  {
    id: "void_scatter",
    name: "Void Scattershot",
    fireRate: 320,
    damage: 24,
    speed: 12,
    spread: 0.35,
    projectilesPerShot: 5,
    energyCost: 4,
    color: "#ff0077",
    unlocked: false,
    cost: 500,
    level: 1,
    description: "Widespread 5-directional energy blast for crowd control."
  },
  {
    id: "singularity_mortar",
    name: "Singularity Mortar",
    fireRate: 600,
    damage: 180,
    speed: 9,
    spread: 0.05,
    projectilesPerShot: 1,
    energyCost: 10,
    color: "#ffb700",
    unlocked: false,
    cost: 800,
    level: 1,
    description: "Explosive void projectile that detonates into area-of-effect shockwaves."
  }
];

const ALL_PERKS: Perk[] = [
  {
    id: "stat_hp_up",
    name: "Nanite Armor Matrix",
    description: "+35 Max Health and instant 25 HP heal.",
    icon: "Shield",
    type: "STAT",
    value: 35,
    statKey: "maxHp",
    color: "#00ff88"
  },
  {
    id: "stat_shield_up",
    name: "Aegis Shield Capacity",
    description: "+40 Max Shield capacity and faster recharge.",
    icon: "Zap",
    type: "STAT",
    value: 40,
    statKey: "maxShield",
    color: "#00f0ff"
  },
  {
    id: "stat_speed_up",
    name: "Tachyon Thrusters",
    description: "+20% Movement Speed and Thruster Drift agility.",
    icon: "Flame",
    type: "STAT",
    value: 1.2,
    statKey: "speed",
    color: "#ffb700"
  },
  {
    id: "stat_energy_reg",
    name: "Zero-Point Core",
    description: "+50% Energy Regeneration rate.",
    icon: "Cpu",
    type: "STAT",
    value: 1.5,
    statKey: "energyRegen",
    color: "#7000ff"
  },
  {
    id: "drone_add",
    name: "Orbital Sentinel Drone",
    description: "Deploys an autonomous companion drone that orbits and fires at targets.",
    icon: "Radio",
    type: "DRONE",
    value: 1,
    color: "#ff0077"
  },
  {
    id: "stat_crit_up",
    name: "Cyber Target Lock",
    description: "+25% Damage boost across all weapons.",
    icon: "Target",
    type: "STAT",
    value: 1.25,
    statKey: "damageMultiplier",
    color: "#00e1ff"
  }
];

export default function VoidSentinelOverdriveGame() {
  // --- STATES ---
  const [gameState, setGameState] = useState<GameState>("MENU");
  const [score, setScore] = useState<number>(0);
  const [highScore, setHighScore] = useState<number>(0);
  const [credits, setCredits] = useState<number>(0);
  const [wave, setWave] = useState<number>(1);
  const [waveEnemiesLeft, setWaveEnemiesLeft] = useState<number>(0);
  const [level, setLevel] = useState<number>(1);
  const [xp, setXp] = useState<number>(0);
  const [nextLevelXp, setNextLevelXp] = useState<number>(100);

  const [weapons, setWeapons] = useState<Weapon[]>(INITIAL_WEAPONS);
  const [activeWeaponIdx, setActiveWeaponIdx] = useState<number>(0);
  const [muted, setMuted] = useState<boolean>(false);

  // Player Display Stats
  const [playerHp, setPlayerHp] = useState<number>(100);
  const [playerMaxHp, setPlayerMaxHp] = useState<number>(100);
  const [playerShield, setPlayerShield] = useState<number>(50);
  const [playerMaxShield, setPlayerMaxShield] = useState<number>(50);
  const [playerEnergy, setPlayerEnergy] = useState<number>(100);
  const [playerMaxEnergy, setPlayerMaxEnergy] = useState<number>(100);
  const [overdriveMeter, setOverdriveMeter] = useState<number>(0);
  const [isOverdriveActive, setIsOverdriveActive] = useState<boolean>(false);

  // Perks Modal Selection
  const [perkOptions, setPerkOptions] = useState<Perk[]>([]);

  // Drones count
  const [droneCount, setDroneCount] = useState<number>(0);

  // --- REFS ---
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);

  const keysRef = useRef<{ [key: string]: boolean }>({});
  const mouseRef = useRef<{ x: number; y: number; isDown: boolean }>({ x: 0, y: 0, isDown: false });

  // Game Engine Entities State in Ref for 60fps Loop
  const gameStateRef = useRef<GameState>("MENU");
  gameStateRef.current = gameState;

  const entitiesRef = useRef<{
    player: {
      x: number;
      y: number;
      vx: number;
      vy: number;
      radius: number;
      hp: number;
      maxHp: number;
      shield: number;
      maxShield: number;
      energy: number;
      maxEnergy: number;
      speed: number;
      damageMultiplier: number;
      energyRegen: number;
      invulnTimer: number;
      angle: number;
    };
    bullets: Bullet[];
    enemies: Enemy[];
    particles: Particle[];
    drops: DropItem[];
    floatingTexts: FloatingText[];
    drones: Drone[];
    abilities: {
      chronoDilation: Ability;
      empShockwave: Ability;
      overdriveSurge: Ability;
    };
    lastShotTime: number;
    waveInProgress: boolean;
    waveTotalEnemies: number;
    waveSpawnedEnemies: number;
    waveSpawnTimer: number;
    screenShake: number;
    timeDilationFactor: number;
  }>({
    player: {
      x: 600,
      y: 400,
      vx: 0,
      vy: 0,
      radius: 18,
      hp: 100,
      maxHp: 100,
      shield: 50,
      maxShield: 50,
      energy: 100,
      maxEnergy: 100,
      speed: 5.5,
      damageMultiplier: 1.0,
      energyRegen: 12, // per sec
      invulnTimer: 0,
      angle: 0
    },
    bullets: [],
    enemies: [],
    particles: [],
    drops: [],
    floatingTexts: [],
    drones: [],
    abilities: {
      chronoDilation: {
        id: "chrono",
        name: "Chrono Matrix",
        cooldown: 12000,
        lastUsed: 0,
        duration: 4000,
        activeTimer: 0,
        energyCost: 30,
        description: "Slows enemy movements and bullet speeds by 70%.",
        color: "#00f0ff",
        icon: "Clock"
      },
      empShockwave: {
        id: "emp",
        name: "Graviton EMP",
        cooldown: 10000,
        lastUsed: 0,
        duration: 0,
        activeTimer: 0,
        energyCost: 40,
        description: "Emits room-clearing EMP wave that strips enemy shields.",
        color: "#7000ff",
        icon: "Zap"
      },
      overdriveSurge: {
        id: "overdrive",
        name: "Overdrive Surge",
        cooldown: 20000,
        lastUsed: 0,
        duration: 6000,
        activeTimer: 0,
        energyCost: 0,
        description: "Triggers hyper-speed, 3x weapon damage, and invulnerability.",
        color: "#ff0055",
        icon: "Flame"
      }
    },
    lastShotTime: 0,
    waveInProgress: false,
    waveTotalEnemies: 0,
    waveSpawnedEnemies: 0,
    waveSpawnTimer: 0,
    screenShake: 0,
    timeDilationFactor: 1.0
  });

  // Load HighScore
  useEffect(() => {
    const saved = localStorage.getItem("void_sentinel_high_score");
    if (saved) setHighScore(parseInt(saved, 10));
  }, []);

  // Audio Context Initialization
  const initAudio = useCallback(() => {
    if (!audioCtxRef.current) {
      const AudioCtxClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtxClass) {
        audioCtxRef.current = new AudioCtxClass();
      }
    }
  }, []);

  // Spawn Floating Text helper
  const spawnFloatingText = useCallback((x: number, y: number, text: string, color: string) => {
    entitiesRef.current.floatingTexts.push({
      id: Math.random(),
      x,
      y,
      text,
      color,
      life: 1.0,
      maxLife: 1.0,
      vy: -1.5
    });
  }, []);

  // Spawn Explosive Particles helper
  const createExplosion = useCallback((x: number, y: number, color: string, count = 18, sizeMax = 4) => {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 6 + 1.5;
      entitiesRef.current.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 1.0,
        maxLife: Math.random() * 0.4 + 0.3,
        color,
        size: Math.random() * sizeMax + 2,
        glow: true
      });
    }
  }, []);

  // Trigger Perk Option Generator
  const triggerLevelUp = useCallback(() => {
    // Pick 3 random distinct perks from ALL_PERKS
    const shuffled = [...ALL_PERKS].sort(() => 0.5 - Math.random());
    setPerkOptions(shuffled.slice(0, 3));
    setGameState("LEVEL_UP");
    playSynthSound("levelUp", audioCtxRef.current, muted);
  }, [muted]);

  // Apply Selected Perk
  const selectPerk = (perk: Perk) => {
    const p = entitiesRef.current.player;
    if (perk.type === "STAT" && perk.statKey) {
      if (perk.statKey === "maxHp") {
        p.maxHp += perk.value;
        p.hp = Math.min(p.hp + 25, p.maxHp);
        setPlayerMaxHp(p.maxHp);
      } else if (perk.statKey === "maxShield") {
        p.maxShield += perk.value;
        p.shield = p.maxShield;
        setPlayerMaxShield(p.maxShield);
      } else if (perk.statKey === "speed") {
        p.speed *= perk.value;
      } else if (perk.statKey === "energyRegen") {
        p.energyRegen *= perk.value;
      } else if (perk.statKey === "damageMultiplier") {
        p.damageMultiplier *= perk.value;
      }
    } else if (perk.type === "DRONE") {
      setDroneCount((prev) => {
        const next = prev + 1;
        entitiesRef.current.drones.push({
          id: next,
          angle: (next * Math.PI * 2) / 3,
          orbitRadius: 45,
          lastShot: 0,
          color: "#ff0077"
        });
        return next;
      });
    }

    setGameState("PLAYING");
  };

  // Trigger Active Abilities
  const activateAbility = useCallback(
    (abilityKey: "chronoDilation" | "empShockwave" | "overdriveSurge") => {
      const now = Date.now();
      const ab = entitiesRef.current.abilities[abilityKey];
      const p = entitiesRef.current.player;

      if (now - ab.lastUsed < ab.cooldown) return;
      if (p.energy < ab.energyCost && abilityKey !== "overdriveSurge") return;

      if (abilityKey !== "overdriveSurge") {
        p.energy -= ab.energyCost;
      }

      ab.lastUsed = now;
      ab.activeTimer = ab.duration;

      if (abilityKey === "chronoDilation") {
        entitiesRef.current.timeDilationFactor = 0.3;
        spawnFloatingText(p.x, p.y - 30, "CHRONO MATRIX ACTIVE!", "#00f0ff");
        playSynthSound("emp", audioCtxRef.current, muted);
      } else if (abilityKey === "empShockwave") {
        // Strip all enemy shields and deal 80 damage
        entitiesRef.current.screenShake = 15;
        createExplosion(p.x, p.y, "#7000ff", 40, 8);
        playSynthSound("emp", audioCtxRef.current, muted);
        entitiesRef.current.enemies.forEach((enemy) => {
          enemy.shield = 0;
          enemy.hp -= 80;
          spawnFloatingText(enemy.x, enemy.y, "-80 EMP", "#7000ff");
        });
      } else if (abilityKey === "overdriveSurge") {
        if (overdriveMeter < 100) return;
        setOverdriveMeter(0);
        setIsOverdriveActive(true);
        p.invulnTimer = 6.0;
        spawnFloatingText(p.x, p.y - 40, "OVERDRIVE SURGE!!!", "#ff0055");
        playSynthSound("overdrive", audioCtxRef.current, muted);
      }
    },
    [muted, overdriveMeter, spawnFloatingText, createExplosion]
  );

  // Reset / Start New Game
  const startNewGame = useCallback(() => {
    initAudio();
    setScore(0);
    setWave(1);
    setLevel(1);
    setXp(0);
    setNextLevelXp(100);
    setCredits(150);
    setOverdriveMeter(0);
    setIsOverdriveActive(false);

    const initialP = {
      x: window.innerWidth / 2 || 600,
      y: window.innerHeight / 2 || 400,
      vx: 0,
      vy: 0,
      radius: 18,
      hp: 100,
      maxHp: 100,
      shield: 50,
      maxShield: 50,
      energy: 100,
      maxEnergy: 100,
      speed: 5.5,
      damageMultiplier: 1.0,
      energyRegen: 12,
      invulnTimer: 0,
      angle: 0
    };

    entitiesRef.current = {
      player: initialP,
      bullets: [],
      enemies: [],
      particles: [],
      drops: [],
      floatingTexts: [],
      drones: [],
      abilities: {
        chronoDilation: {
          id: "chrono",
          name: "Chrono Matrix",
          cooldown: 12000,
          lastUsed: 0,
          duration: 4000,
          activeTimer: 0,
          energyCost: 30,
          description: "Slows enemy movements and bullet speeds by 70%.",
          color: "#00f0ff",
          icon: "Clock"
        },
        empShockwave: {
          id: "emp",
          name: "Graviton EMP",
          cooldown: 10000,
          lastUsed: 0,
          duration: 0,
          activeTimer: 0,
          energyCost: 40,
          description: "Emits room-clearing EMP wave that strips enemy shields.",
          color: "#7000ff",
          icon: "Zap"
        },
        overdriveSurge: {
          id: "overdrive",
          name: "Overdrive Surge",
          cooldown: 20000,
          lastUsed: 0,
          duration: 6000,
          activeTimer: 0,
          energyCost: 0,
          description: "Triggers hyper-speed, 3x weapon damage, and invulnerability.",
          color: "#ff0055",
          icon: "Flame"
        }
      },
      lastShotTime: 0,
      waveInProgress: true,
      waveTotalEnemies: 12,
      waveSpawnedEnemies: 0,
      waveSpawnTimer: 0,
      screenShake: 0,
      timeDilationFactor: 1.0
    };

    setPlayerHp(100);
    setPlayerMaxHp(100);
    setPlayerShield(50);
    setPlayerMaxShield(50);
    setPlayerEnergy(100);
    setPlayerMaxEnergy(100);
    setDroneCount(0);
    setWeapons(INITIAL_WEAPONS);
    setActiveWeaponIdx(0);

    setGameState("PLAYING");
  }, [initAudio]);

  // Main Canvas & Game Loop Handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      keysRef.current[e.key.toLowerCase()] = true;

      if (e.key === "1") setActiveWeaponIdx(0);
      if (e.key === "2") setActiveWeaponIdx(1);
      if (e.key === "3") setActiveWeaponIdx(2);
      if (e.key === "4") setActiveWeaponIdx(3);

      if (e.key.toLowerCase() === "q") activateAbility("chronoDilation");
      if (e.key.toLowerCase() === "e") activateAbility("empShockwave");
      if (e.key.toLowerCase() === "r") activateAbility("overdriveSurge");

      if (e.key.toLowerCase() === "p" || e.key === "Escape") {
        setGameState((prev) => (prev === "PLAYING" ? "PAUSED" : prev === "PAUSED" ? "PLAYING" : prev));
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      keysRef.current[e.key.toLowerCase()] = false;
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (canvasRef.current) {
        const rect = canvasRef.current.getBoundingClientRect();
        mouseRef.current.x = e.clientX - rect.left;
        mouseRef.current.y = e.clientY - rect.top;
      }
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
  }, [activateAbility]);

  // 60FPS Game Loop Logic
  useEffect(() => {
    let lastFrameTime = performance.now();

    const loop = (time: number) => {
      const dt = Math.min((time - lastFrameTime) / 1000, 0.1);
      lastFrameTime = time;

      const canvas = canvasRef.current;
      if (!canvas) {
        animFrameRef.current = requestAnimationFrame(loop);
        return;
      }
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        animFrameRef.current = requestAnimationFrame(loop);
        return;
      }

      // Resize Canvas dynamically to match parent screen
      if (canvas.width !== canvas.clientWidth || canvas.height !== canvas.clientHeight) {
        canvas.width = canvas.clientWidth || 1200;
        canvas.height = canvas.clientHeight || 800;
      }

      const width = canvas.width;
      const height = canvas.height;

      if (gameStateRef.current === "PLAYING") {
        const state = entitiesRef.current;
        const p = state.player;
        const keys = keysRef.current;
        const mouse = mouseRef.current;
        const currentWeapon = weapons[activeWeaponIdx] || weapons[0];

        // Apply Time Dilation Factor if active
        if (state.abilities.chronoDilation.activeTimer > 0) {
          state.abilities.chronoDilation.activeTimer -= dt * 1000;
          if (state.abilities.chronoDilation.activeTimer <= 0) {
            state.timeDilationFactor = 1.0;
          }
        }

        // Handle Overdrive Duration
        if (state.abilities.overdriveSurge.activeTimer > 0) {
          state.abilities.overdriveSurge.activeTimer -= dt * 1000;
          if (state.abilities.overdriveSurge.activeTimer <= 0) {
            setIsOverdriveActive(false);
          }
        }

        // --- 1. PLAYER INPUT & MOVEMENT ---
        let moveX = 0;
        let moveY = 0;
        if (keys["w"] || keys["arrowup"]) moveY -= 1;
        if (keys["s"] || keys["arrowdown"]) moveY += 1;
        if (keys["a"] || keys["arrowleft"]) moveX -= 1;
        if (keys["d"] || keys["arrowright"]) moveX += 1;

        if (moveX !== 0 && moveY !== 0) {
          moveX *= 0.7071;
          moveY *= 0.7071;
        }

        const moveSpeed = p.speed * (isOverdriveActive ? 1.4 : 1.0);
        p.x += moveX * moveSpeed;
        p.y += moveY * moveSpeed;

        // Boundaries Clamp
        p.x = Math.max(p.radius, Math.min(width - p.radius, p.x));
        p.y = Math.max(p.radius, Math.min(height - p.radius, p.y));

        // Player Aim Angle
        const dx = mouse.x - p.x;
        const dy = mouse.y - p.y;
        p.angle = Math.atan2(dy, dx);

        // Energy Regen & Shield Recharge
        if (p.energy < p.maxEnergy) {
          p.energy = Math.min(p.maxEnergy, p.energy + p.energyRegen * dt);
          setPlayerEnergy(p.energy);
        }
        if (p.shield < p.maxShield) {
          p.shield = Math.min(p.maxShield, p.shield + 8 * dt);
          setPlayerShield(p.shield);
        }
        if (p.invulnTimer > 0) p.invulnTimer -= dt;

        // Thruster Particle FX
        if (moveX !== 0 || moveY !== 0) {
          state.particles.push({
            x: p.x - Math.cos(p.angle) * 12,
            y: p.y - Math.sin(p.angle) * 12,
            vx: -moveX * 2 + (Math.random() - 0.5),
            vy: -moveY * 2 + (Math.random() - 0.5),
            life: 1.0,
            maxLife: 0.25,
            color: isOverdriveActive ? "#ff0055" : "#00f0ff",
            size: Math.random() * 4 + 2
          });
        }

        // --- 2. PLAYER WEAPON FIRING ---
        const now = time;
        if (mouse.isDown && now - state.lastShotTime >= currentWeapon.fireRate) {
          if (p.energy >= currentWeapon.energyCost || isOverdriveActive) {
            if (!isOverdriveActive) p.energy -= currentWeapon.energyCost;
            state.lastShotTime = now;

            playSynthSound(currentWeapon.id === "quantum_railgun" ? "railgun" : "shot", audioCtxRef.current, muted);

            const spreadStep = currentWeapon.projectilesPerShot > 1 ? currentWeapon.spread : 0;
            const startAngle = p.angle - (spreadStep * (currentWeapon.projectilesPerShot - 1)) / 2;

            for (let i = 0; i < currentWeapon.projectilesPerShot; i++) {
              const bAngle = startAngle + i * spreadStep + (Math.random() - 0.5) * 0.04;
              const dmg = currentWeapon.damage * p.damageMultiplier * (isOverdriveActive ? 3.0 : 1.0);

              state.bullets.push({
                x: p.x + Math.cos(p.angle) * 20,
                y: p.y + Math.sin(p.angle) * 20,
                vx: Math.cos(bAngle) * currentWeapon.speed,
                vy: Math.sin(bAngle) * currentWeapon.speed,
                radius: currentWeapon.id === "singularity_mortar" ? 7 : 4,
                color: isOverdriveActive ? "#ff0055" : currentWeapon.color,
                damage: dmg,
                isEnemy: false,
                pierce: currentWeapon.id === "quantum_railgun" ? 3 : 1,
                trail: []
              });
            }
          }
        }

        // --- 3. DRONE COMPANIONS LOGIC ---
        state.drones.forEach((drone) => {
          drone.angle += 2 * dt;
          const droneX = p.x + Math.cos(drone.angle) * drone.orbitRadius;
          const droneY = p.y + Math.sin(drone.angle) * drone.orbitRadius;

          // Target nearest enemy
          let nearestEnemy: Enemy | null = null;
          let minDist = 350;
          state.enemies.forEach((enemy) => {
            const edx = enemy.x - droneX;
            const edy = enemy.y - droneY;
            const dist = Math.hypot(edx, edy);
            if (dist < minDist) {
              minDist = dist;
              nearestEnemy = enemy;
            }
          });

          if (nearestEnemy && now - drone.lastShot > 350) {
            drone.lastShot = now;
            const target: Enemy = nearestEnemy;
            const targetAngle = Math.atan2(target.y - droneY, target.x - droneX);
            state.bullets.push({
              x: droneX,
              y: droneY,
              vx: Math.cos(targetAngle) * 12,
              vy: Math.sin(targetAngle) * 12,
              radius: 3,
              color: "#ff0077",
              damage: 15 * p.damageMultiplier,
              isEnemy: false,
              pierce: 1,
              trail: []
            });
          }
        });

        // --- 4. WAVE SPAWNER & ENEMY AI ---
        if (state.waveInProgress) {
          state.waveSpawnTimer += dt;
          if (state.waveSpawnTimer > 1.2 && state.waveSpawnedEnemies < state.waveTotalEnemies) {
            state.waveSpawnTimer = 0;
            state.waveSpawnedEnemies++;

            // Choose enemy type based on wave
            const rand = Math.random();
            let type: Enemy["type"] = "SWARMER";
            let hp = 40 + wave * 10;
            let shield = wave > 3 ? 20 + wave * 5 : 0;
            let speed = 2.5 + Math.random() * 1.5;
            let color = "#ff0055";
            let radius = 16;
            let scoreVal = 50;

            if (state.waveSpawnedEnemies === state.waveTotalEnemies && wave % 5 === 0) {
              // Boss Enemy
              type = "BOSS";
              hp = 800 + wave * 300;
              shield = 300;
              speed = 1.2;
              color = "#ff0000";
              radius = 45;
              scoreVal = 2500;
              spawnFloatingText(width / 2, 100, "WARNING: BOSS INBOUND!", "#ff0000");
            } else if (rand > 0.75) {
              type = "HEAVY";
              hp = 120 + wave * 20;
              speed = 1.6;
              color = "#aa00ff";
              radius = 26;
              scoreVal = 150;
            } else if (rand > 0.5) {
              type = "INTERCEPTOR";
              hp = 60 + wave * 10;
              speed = 3.2;
              color = "#ffbb00";
              radius = 18;
              scoreVal = 100;
            }

            // Spawn at canvas perimeter
            const side = Math.floor(Math.random() * 4);
            let ex = 0,
              ey = 0;
            if (side === 0) {
              ex = Math.random() * width;
              ey = -30;
            } else if (side === 1) {
              ex = width + 30;
              ey = Math.random() * height;
            } else if (side === 2) {
              ex = Math.random() * width;
              ey = height + 30;
            } else {
              ex = -30;
              ey = Math.random() * height;
            }

            state.enemies.push({
              id: Math.random(),
              type,
              x: ex,
              y: ey,
              vx: 0,
              vy: 0,
              radius,
              hp,
              maxHp: hp,
              shield,
              maxShield: shield,
              color,
              speed,
              scoreValue: scoreVal,
              xpValue: 20 + wave * 5,
              creditsValue: 15 + wave * 5,
              lastShot: 0,
              fireRate: type === "BOSS" ? 800 : type === "HEAVY" ? 1800 : 2200
            });
          }
        }

        // Enemy Updates & Shooting
        const timeFactor = state.timeDilationFactor;
        state.enemies.forEach((enemy) => {
          const edx = p.x - enemy.x;
          const edy = p.y - enemy.y;
          const dist = Math.hypot(edx, edy);
          const angle = Math.atan2(edy, edx);

          // Enemy AI Movement
          enemy.x += Math.cos(angle) * enemy.speed * timeFactor;
          enemy.y += Math.sin(angle) * enemy.speed * timeFactor;

          // Shooting Logic
          if (enemy.type !== "SWARMER" && now - enemy.lastShot > enemy.fireRate) {
            enemy.lastShot = now;
            if (enemy.type === "BOSS") {
              // Boss 8-way bullet hell spiral
              for (let i = 0; i < 8; i++) {
                const bAngle = angle + (i * Math.PI) / 4;
                state.bullets.push({
                  x: enemy.x,
                  y: enemy.y,
                  vx: Math.cos(bAngle) * 5 * timeFactor,
                  vy: Math.sin(bAngle) * 5 * timeFactor,
                  radius: 6,
                  color: "#ff0055",
                  damage: 18,
                  isEnemy: true,
                  pierce: 1,
                  trail: []
                });
              }
            } else {
              // Regular enemy single targeting shot
              state.bullets.push({
                x: enemy.x,
                y: enemy.y,
                vx: Math.cos(angle) * 6 * timeFactor,
                vy: Math.sin(angle) * 6 * timeFactor,
                radius: 4,
                color: enemy.color,
                damage: 12,
                isEnemy: true,
                pierce: 1,
                trail: []
              });
            }
          }

          // Direct enemy collision with player
          if (dist < enemy.radius + p.radius && p.invulnTimer <= 0) {
            let dmg = 15;
            if (p.shield > 0) {
              const absorbed = Math.min(p.shield, dmg);
              p.shield -= absorbed;
              dmg -= absorbed;
              setPlayerShield(p.shield);
            }
            if (dmg > 0) {
              p.hp -= dmg;
              setPlayerHp(p.hp);
              if (p.hp <= 0) {
                setGameState("GAME_OVER");
                playSynthSound("gameOver", audioCtxRef.current, muted);
              }
            }
            p.invulnTimer = 0.8;
            state.screenShake = 10;
            createExplosion(p.x, p.y, "#ff0000", 12, 3);
          }
        });

        // --- 5. BULLET UPDATES & COLLISIONS ---
        state.bullets = state.bullets.filter((bullet) => {
          bullet.x += bullet.vx;
          bullet.y += bullet.vy;

          // Bullet trail history
          bullet.trail.push({ x: bullet.x, y: bullet.y });
          if (bullet.trail.length > 5) bullet.trail.shift();

          // Out of canvas bounds check
          if (bullet.x < -20 || bullet.x > width + 20 || bullet.y < -20 || bullet.y > height + 20) {
            return false;
          }

          if (bullet.isEnemy) {
            // Check collision with player
            const bdx = bullet.x - p.x;
            const bdy = bullet.y - p.y;
            if (Math.hypot(bdx, bdy) < bullet.radius + p.radius && p.invulnTimer <= 0) {
              let dmg = bullet.damage;
              if (p.shield > 0) {
                const abs = Math.min(p.shield, dmg);
                p.shield -= abs;
                dmg -= abs;
                setPlayerShield(p.shield);
              }
              if (dmg > 0) {
                p.hp -= dmg;
                setPlayerHp(p.hp);
                if (p.hp <= 0) {
                  setGameState("GAME_OVER");
                  playSynthSound("gameOver", audioCtxRef.current, muted);
                }
              }
              p.invulnTimer = 0.4;
              state.screenShake = 6;
              createExplosion(bullet.x, bullet.y, "#ff0055", 10, 2);
              return false;
            }
          } else {
            // Player Bullet vs Enemies
            for (let i = state.enemies.length - 1; i >= 0; i--) {
              const enemy = state.enemies[i];
              const edx = bullet.x - enemy.x;
              const edy = bullet.y - enemy.y;
              if (Math.hypot(edx, edy) < bullet.radius + enemy.radius) {
                // Apply damage
                let dmg = bullet.damage;
                if (enemy.shield > 0) {
                  const abs = Math.min(enemy.shield, dmg);
                  enemy.shield -= abs;
                  dmg -= abs;
                }
                if (dmg > 0) enemy.hp -= dmg;

                spawnFloatingText(enemy.x, enemy.y - 10, `${Math.round(bullet.damage)}`, bullet.color);
                playSynthSound("hit", audioCtxRef.current, muted);
                createExplosion(bullet.x, bullet.y, bullet.color, 6, 2);

                // Charge Overdrive Meter
                setOverdriveMeter((prev) => Math.min(100, prev + 1.5));

                // Enemy Death Handler
                if (enemy.hp <= 0) {
                  setScore((prevScore) => {
                    const newScore = prevScore + enemy.scoreValue;
                    setHighScore((prevHigh) => {
                      if (newScore > prevHigh) {
                        localStorage.setItem("void_sentinel_high_score", newScore.toString());
                        return newScore;
                      }
                      return prevHigh;
                    });
                    return newScore;
                  });

                  setCredits((prev) => prev + enemy.creditsValue);
                  createExplosion(enemy.x, enemy.y, enemy.color, 25, 6);
                  playSynthSound("explosion", audioCtxRef.current, muted);

                  // Drop XP orb & health drops
                  state.drops.push({
                    id: Math.random(),
                    x: enemy.x,
                    y: enemy.y,
                    type: "XP",
                    value: enemy.xpValue,
                    radius: 8
                  });

                  if (Math.random() < 0.25) {
                    state.drops.push({
                      id: Math.random(),
                      x: enemy.x + (Math.random() - 0.5) * 20,
                      y: enemy.y + (Math.random() - 0.5) * 20,
                      type: Math.random() > 0.5 ? "HEALTH" : "SHIELD",
                      value: 20,
                      radius: 7
                    });
                  }

                  state.enemies.splice(i, 1);
                }

                bullet.pierce--;
                if (bullet.pierce <= 0) return false;
              }
            }
          }

          return true;
        });

        // --- 6. DROP ITEMS COLLECTION & XP SYSTEM ---
        state.drops = state.drops.filter((drop) => {
          const ddx = p.x - drop.x;
          const ddy = p.y - drop.y;
          const dist = Math.hypot(ddx, ddy);

          // Magnet suction towards player
          if (dist < 180) {
            drop.x += (ddx / dist) * 7;
            drop.y += (ddy / dist) * 7;
          }

          if (dist < drop.radius + p.radius) {
            playSynthSound("pickup", audioCtxRef.current, muted);
            if (drop.type === "XP") {
              setXp((prevXp) => {
                const nextXp = prevXp + drop.value;
                if (nextXp >= nextLevelXp) {
                  setLevel((prevLvl) => prevLvl + 1);
                  setNextLevelXp((prevNext) => Math.round(prevNext * 1.4));
                  triggerLevelUp();
                  return nextXp - nextLevelXp;
                }
                return nextXp;
              });
              spawnFloatingText(drop.x, drop.y, `+${drop.value} XP`, "#00ff88");
            } else if (drop.type === "HEALTH") {
              p.hp = Math.min(p.maxHp, p.hp + drop.value);
              setPlayerHp(p.hp);
              spawnFloatingText(drop.x, drop.y, `+${drop.value} HP`, "#ff0055");
            } else if (drop.type === "SHIELD") {
              p.shield = Math.min(p.maxShield, p.shield + drop.value);
              setPlayerShield(p.shield);
              spawnFloatingText(drop.x, drop.y, `+${drop.value} SHIELD`, "#00f0ff");
            }
            return false;
          }
          return true;
        });

        // --- 7. WAVE COMPLETION CHECK ---
        setWaveEnemiesLeft(state.enemies.length + (state.waveTotalEnemies - state.waveSpawnedEnemies));
        if (state.waveSpawnedEnemies >= state.waveTotalEnemies && state.enemies.length === 0) {
          state.waveInProgress = false;
          setWave((prevWave) => {
            const nextWave = prevWave + 1;
            state.waveTotalEnemies = 12 + nextWave * 4;
            state.waveSpawnedEnemies = 0;
            state.waveInProgress = true;
            spawnFloatingText(width / 2, height / 2 - 50, `WAVE ${nextWave} INCOMING!`, "#00f0ff");
            return nextWave;
          });
        }

        // Update Particle Lifespans
        state.particles = state.particles.filter((pt) => {
          pt.x += pt.vx;
          pt.y += pt.vy;
          pt.life -= dt / pt.maxLife;
          return pt.life > 0;
        });

        // Update Floating Text Lifespans
        state.floatingTexts = state.floatingTexts.filter((ft) => {
          ft.y += ft.vy;
          ft.life -= dt / ft.maxLife;
          return ft.life > 0;
        });
      }

      // ==========================================
      // CANVAS RENDERING PASSTHROUGH
      // ==========================================
      ctx.fillStyle = "#050711";
      ctx.fillRect(0, 0, width, height);

      // Render Background Scrolling Void Grid & Stars
      ctx.strokeStyle = "rgba(0, 240, 255, 0.04)";
      ctx.lineWidth = 1;
      const gridSize = 60;
      for (let x = 0; x < width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = 0; y < height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      const state = entitiesRef.current;

      // Render Floating Drop Items
      state.drops.forEach((drop) => {
        ctx.save();
        ctx.shadowBlur = 10;
        ctx.shadowColor = drop.type === "XP" ? "#00ff88" : drop.type === "HEALTH" ? "#ff0055" : "#00f0ff";
        ctx.fillStyle = ctx.shadowColor;
        ctx.beginPath();
        ctx.arc(drop.x, drop.y, drop.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });

      // Render Bullets & Trails
      state.bullets.forEach((bullet) => {
        ctx.save();
        ctx.strokeStyle = bullet.color;
        ctx.lineWidth = bullet.radius * 1.5;
        if (bullet.trail.length > 1) {
          ctx.beginPath();
          ctx.moveTo(bullet.trail[0].x, bullet.trail[0].y);
          for (let i = 1; i < bullet.trail.length; i++) {
            ctx.lineTo(bullet.trail[i].x, bullet.trail[i].y);
          }
          ctx.stroke();
        }

        ctx.shadowBlur = 12;
        ctx.shadowColor = bullet.color;
        ctx.fillStyle = bullet.color;
        ctx.beginPath();
        ctx.arc(bullet.x, bullet.y, bullet.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });

      // Render Enemies
      state.enemies.forEach((enemy) => {
        ctx.save();
        ctx.shadowBlur = 14;
        ctx.shadowColor = enemy.color;
        ctx.fillStyle = enemy.color;
        ctx.beginPath();
        ctx.arc(enemy.x, enemy.y, enemy.radius, 0, Math.PI * 2);
        ctx.fill();

        // Render Enemy Health Bar
        if (enemy.hp < enemy.maxHp || enemy.type === "BOSS") {
          const barW = enemy.radius * 2.2;
          const barH = 5;
          const hpRatio = enemy.hp / enemy.maxHp;
          ctx.fillStyle = "rgba(0, 0, 0, 0.6)";
          ctx.fillRect(enemy.x - barW / 2, enemy.y - enemy.radius - 12, barW, barH);
          ctx.fillStyle = "#ff0055";
          ctx.fillRect(enemy.x - barW / 2, enemy.y - enemy.radius - 12, barW * hpRatio, barH);
        }
        ctx.restore();
      });

      // Render Drones
      const p = state.player;
      state.drones.forEach((drone) => {
        const droneX = p.x + Math.cos(drone.angle) * drone.orbitRadius;
        const droneY = p.y + Math.sin(drone.angle) * drone.orbitRadius;

        ctx.save();
        ctx.shadowBlur = 10;
        ctx.shadowColor = drone.color;
        ctx.fillStyle = drone.color;
        ctx.beginPath();
        ctx.arc(droneX, droneY, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });

      // Render Player Ship
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.angle);

      ctx.shadowBlur = isOverdriveActive ? 25 : 15;
      ctx.shadowColor = isOverdriveActive ? "#ff0055" : "#00f0ff";
      ctx.fillStyle = isOverdriveActive ? "#ff0055" : "#00f0ff";

      // Triangle Mech Jet Shape
      ctx.beginPath();
      ctx.moveTo(p.radius * 1.2, 0);
      ctx.lineTo(-p.radius, -p.radius * 0.8);
      ctx.lineTo(-p.radius * 0.5, 0);
      ctx.lineTo(-p.radius, p.radius * 0.8);
      ctx.closePath();
      ctx.fill();

      // Shield Aura
      if (p.shield > 0) {
        ctx.strokeStyle = "rgba(0, 240, 255, 0.4)";
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(0, 0, p.radius + 6, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.restore();

      // Render Particles
      state.particles.forEach((pt) => {
        ctx.save();
        ctx.globalAlpha = pt.life;
        ctx.fillStyle = pt.color;
        if (pt.glow) {
          ctx.shadowBlur = 8;
          ctx.shadowColor = pt.color;
        }
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, pt.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });

      // Render Floating Damage/XP Texts
      state.floatingTexts.forEach((ft) => {
        ctx.save();
        ctx.globalAlpha = ft.life;
        ctx.font = "bold 14px system-ui, sans-serif";
        ctx.fillStyle = ft.color;
        ctx.shadowBlur = 6;
        ctx.shadowColor = ft.color;
        ctx.fillText(ft.text, ft.x, ft.y);
        ctx.restore();
      });

      animFrameRef.current = requestAnimationFrame(loop);
    };

    animFrameRef.current = requestAnimationFrame(loop);

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [weapons, activeWeaponIdx, muted, triggerLevelUp, activateAbility, isOverdriveActive]);

  // Unlock / Upgrade Weapon in Shop
  const buyOrUpgradeWeapon = (index: number) => {
    const w = weapons[index];
    if (!w.unlocked && credits >= w.cost) {
      setCredits((prev) => prev - w.cost);
      setWeapons((prev) => {
        const copy = [...prev];
        copy[index].unlocked = true;
        return copy;
      });
      setActiveWeaponIdx(index);
    } else if (w.unlocked && credits >= 200 * w.level) {
      setCredits((prev) => prev - 200 * w.level);
      setWeapons((prev) => {
        const copy = [...prev];
        copy[index].damage *= 1.25;
        copy[index].level += 1;
        return copy;
      });
    }
  };

  return (
    <div className="relative w-full h-screen bg-[#050711] text-white overflow-hidden font-sans select-none">
      {/* Background Canvas Layer */}
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full block cursor-crosshair" />

      {/* --- HUD OVERLAY (WHEN PLAYING) --- */}
      {gameState === "PLAYING" && (
        <div className="absolute inset-0 pointer-events-none p-6 flex flex-col justify-between">
          {/* Top Bar: Stats & Controls */}
          <div className="flex justify-between items-start">
            {/* Health & Shield Gauge */}
            <div className="flex flex-col gap-2 w-72 bg-slate-900/80 backdrop-blur-md p-4 rounded-xl border border-cyan-500/30 shadow-lg pointer-events-auto">
              <div className="flex justify-between text-xs font-bold text-cyan-400">
                <span>HEALTH / SHIELD</span>
                <span>
                  {Math.round(playerHp)} / {playerMaxHp} HP
                </span>
              </div>
              {/* HP Bar */}
              <div className="w-full h-3 bg-slate-800 rounded-full overflow-hidden border border-slate-700">
                <div
                  className="h-full bg-gradient-to-r from-red-600 to-rose-400 transition-all duration-200"
                  style={{ width: `${(playerHp / playerMaxHp) * 100}%` }}
                />
              </div>
              {/* Shield Bar */}
              <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden border border-slate-700">
                <div
                  className="h-full bg-gradient-to-r from-cyan-500 to-blue-400 transition-all duration-200"
                  style={{ width: `${(playerShield / playerMaxShield) * 100}%` }}
                />
              </div>
              {/* Energy Bar */}
              <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden border border-slate-700">
                <div
                  className="h-full bg-gradient-to-r from-purple-500 to-indigo-400 transition-all duration-200"
                  style={{ width: `${(playerEnergy / playerMaxEnergy) * 100}%` }}
                />
              </div>
            </div>

            {/* Center Info: Score & Wave */}
            <div className="flex flex-col items-center gap-1 bg-slate-900/80 backdrop-blur-md px-6 py-3 rounded-xl border border-purple-500/30 shadow-lg">
              <div className="text-2xl font-black tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-400">
                WAVE {wave}
              </div>
              <div className="text-sm font-semibold text-slate-300">SCORE: {score.toLocaleString()}</div>
              <div className="text-xs text-cyan-400 font-medium">ENEMIES REMAINING: {waveEnemiesLeft}</div>
            </div>

            {/* Right Info: Level, XP, Mute & Pause */}
            <div className="flex items-center gap-4 pointer-events-auto">
              <div className="bg-slate-900/80 backdrop-blur-md px-4 py-3 rounded-xl border border-emerald-500/30 flex flex-col items-end">
                <div className="text-xs font-bold text-emerald-400">LEVEL {level}</div>
                <div className="w-28 h-2 bg-slate-800 rounded-full overflow-hidden mt-1 border border-slate-700">
                  <div className="h-full bg-emerald-400" style={{ width: `${(xp / nextLevelXp) * 100}%` }} />
                </div>
              </div>

              <button
                onClick={() => setGameState("SHOP")}
                className="bg-slate-900/80 hover:bg-slate-800 p-3 rounded-xl border border-amber-500/40 text-amber-400 transition shadow-lg flex items-center gap-2 font-bold text-sm"
              >
                <ShoppingCart className="w-5 h-5" />
                <span>{credits} C</span>
              </button>

              <button
                onClick={() => setMuted(!muted)}
                className="bg-slate-900/80 hover:bg-slate-800 p-3 rounded-xl border border-cyan-500/30 text-cyan-400 transition shadow-lg"
              >
                {muted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
              </button>

              <button
                onClick={() => setGameState("PAUSED")}
                className="bg-slate-900/80 hover:bg-slate-800 p-3 rounded-xl border border-cyan-500/30 text-cyan-400 transition shadow-lg"
              >
                <Pause className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Bottom Bar: Weapon Selector & Active Abilities */}
          <div className="flex justify-between items-end pointer-events-auto">
            {/* Active Weapons Carousel */}
            <div className="flex gap-2 bg-slate-900/80 backdrop-blur-md p-2 rounded-xl border border-slate-700">
              {weapons.map((w, idx) => (
                <button
                  key={w.id}
                  onClick={() => w.unlocked && setActiveWeaponIdx(idx)}
                  className={`px-4 py-2 rounded-lg text-xs font-bold transition flex flex-col items-center gap-1 border ${
                    activeWeaponIdx === idx
                      ? "bg-cyan-500/20 border-cyan-400 text-cyan-300"
                      : w.unlocked
                      ? "bg-slate-800/80 border-slate-700 text-slate-400 hover:text-white"
                      : "bg-slate-950 border-slate-800 text-slate-600 opacity-60"
                  }`}
                >
                  <span className="text-[10px] text-slate-500">[{idx + 1}]</span>
                  <span>{w.name}</span>
                </button>
              ))}
            </div>

            {/* Overdrive Meter & Ability Hotkeys */}
            <div className="flex items-center gap-3">
              {/* Abilities */}
              <div className="flex gap-2">
                <button
                  onClick={() => activateAbility("chronoDilation")}
                  className="bg-slate-900/80 hover:bg-slate-800 px-3 py-2 rounded-xl border border-cyan-500/40 text-cyan-300 flex flex-col items-center gap-1"
                >
                  <span className="text-[10px] font-bold text-cyan-400">[Q] CHRONO</span>
                </button>
                <button
                  onClick={() => activateAbility("empShockwave")}
                  className="bg-slate-900/80 hover:bg-slate-800 px-3 py-2 rounded-xl border border-purple-500/40 text-purple-300 flex flex-col items-center gap-1"
                >
                  <span className="text-[10px] font-bold text-purple-400">[E] EMP</span>
                </button>
                <button
                  onClick={() => activateAbility("overdriveSurge")}
                  disabled={overdriveMeter < 100}
                  className={`px-4 py-2 rounded-xl font-bold flex flex-col items-center gap-1 transition ${
                    overdriveMeter >= 100
                      ? "bg-rose-600 text-white animate-pulse border border-rose-400 shadow-lg shadow-rose-600/50"
                      : "bg-slate-900/80 text-slate-500 border border-slate-800 opacity-60"
                  }`}
                >
                  <span className="text-[10px]">[R] OVERDRIVE</span>
                  <span>{Math.round(overdriveMeter)}%</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- MENU OVERLAY --- */}
      {gameState === "MENU" && (
        <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-xl flex flex-col items-center justify-center p-6 text-center">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="flex flex-col items-center max-w-xl"
          >
            <div className="p-4 bg-cyan-500/10 rounded-full border border-cyan-500/30 mb-4">
              <Crosshair className="w-16 h-16 text-cyan-400 animate-spin" style={{ animationDuration: "12s" }} />
            </div>

            <h1 className="text-5xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-500 mb-2">
              VOID SENTINEL OVERDRIVE
            </h1>
            <p className="text-slate-400 text-sm mb-8 leading-relaxed">
              Tactical cybernetic space survival. Eliminate invading alien armadas, unleash graviton shockwaves, unlock
              piercing quantum weapons, and master the orbital void battlefield.
            </p>

            {highScore > 0 && (
              <div className="mb-6 px-6 py-2 bg-slate-900 border border-purple-500/30 rounded-full text-purple-300 font-bold text-sm flex items-center gap-2">
                <Award className="w-4 h-4" /> HIGH SCORE: {highScore.toLocaleString()}
              </div>
            )}

            <button
              onClick={startNewGame}
              className="w-full py-4 bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-400 hover:to-purple-500 text-white font-extrabold text-lg rounded-xl shadow-xl shadow-cyan-500/25 transition transform hover:scale-105 flex items-center justify-center gap-3"
            >
              <Play className="w-6 h-6 fill-current" /> LAUNCH MISSION
            </button>

            <div className="grid grid-cols-3 gap-4 w-full mt-8 text-xs text-slate-400 border-t border-slate-800 pt-6">
              <div className="bg-slate-900/60 p-3 rounded-lg border border-slate-800">
                <span className="font-bold text-cyan-400 block mb-1">WASD / ARROWS</span> Move Sentinel
              </div>
              <div className="bg-slate-900/60 p-3 rounded-lg border border-slate-800">
                <span className="font-bold text-cyan-400 block mb-1">MOUSE AIM & FIRE</span> Target & Blast
              </div>
              <div className="bg-slate-900/60 p-3 rounded-lg border border-slate-800">
                <span className="font-bold text-cyan-400 block mb-1">Q / E / R</span> Special Abilities
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* --- LEVEL UP PERK SELECT MODAL --- */}
      <AnimatePresence>
        {gameState === "LEVEL_UP" && (
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-6 z-50">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-slate-900 border border-cyan-500/40 rounded-2xl p-6 max-w-2xl w-full text-center shadow-2xl"
            >
              <h2 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-emerald-400 mb-1">
                SYSTEM UPGRADE UNLOCKED!
              </h2>
              <p className="text-slate-400 text-sm mb-6">Choose 1 tactical matrix perk to augment your Sentinel</p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                {perkOptions.map((perk) => (
                  <button
                    key={perk.id}
                    onClick={() => selectPerk(perk)}
                    className="flex flex-col items-center justify-between p-5 bg-slate-950 hover:bg-slate-800/80 border border-slate-800 hover:border-cyan-400 rounded-xl transition text-left group"
                  >
                    <div>
                      <div className="w-10 h-10 rounded-lg flex items-center justify-center mb-3 bg-cyan-500/10 text-cyan-400 group-hover:scale-110 transition">
                        <Sparkles className="w-6 h-6" />
                      </div>
                      <h3 className="font-bold text-white mb-2">{perk.name}</h3>
                      <p className="text-xs text-slate-400 leading-relaxed">{perk.description}</p>
                    </div>
                    <span className="mt-4 text-xs font-bold text-cyan-400 flex items-center gap-1">
                      SELECT PERK <ChevronRight className="w-3 h-3" />
                    </span>
                  </button>
                ))}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* --- ARMORY / SHOP MODAL --- */}
      <AnimatePresence>
        {gameState === "SHOP" && (
          <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-6 z-50">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-slate-900 border border-amber-500/40 rounded-2xl p-6 max-w-3xl w-full shadow-2xl flex flex-col"
            >
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-2xl font-black text-amber-400 flex items-center gap-2">
                    <ShoppingCart className="w-6 h-6" /> ARMORY & WEAPON LAB
                  </h2>
                  <p className="text-xs text-slate-400">Upgrade arsenal and purchase advanced tech</p>
                </div>
                <div className="px-4 py-2 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-400 font-bold text-sm">
                  CREDITS: {credits} C
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                {weapons.map((w, idx) => (
                  <div key={w.id} className="p-4 bg-slate-950 rounded-xl border border-slate-800 flex justify-between items-center">
                    <div>
                      <h3 className="font-bold text-white text-sm">{w.name}</h3>
                      <p className="text-xs text-slate-400 mb-2">{w.description}</p>
                      <div className="text-[10px] text-cyan-400 font-semibold">
                        DMG: {Math.round(w.damage)} | LEVEL: {w.level}
                      </div>
                    </div>
                    <button
                      onClick={() => buyOrUpgradeWeapon(idx)}
                      className={`px-4 py-2 rounded-lg text-xs font-bold transition ${
                        !w.unlocked
                          ? credits >= w.cost
                            ? "bg-amber-500 hover:bg-amber-400 text-slate-950"
                            : "bg-slate-800 text-slate-500 opacity-50"
                          : credits >= 200 * w.level
                          ? "bg-cyan-500 hover:bg-cyan-400 text-slate-950"
                          : "bg-slate-800 text-slate-500 opacity-50"
                      }`}
                    >
                      {!w.unlocked ? `UNLOCK (${w.cost}C)` : `UPGRADE (${200 * w.level}C)`}
                    </button>
                  </div>
                ))}
              </div>

              <button
                onClick={() => setGameState("PLAYING")}
                className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl transition"
              >
                RETURN TO BATTLEFIELD
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* --- PAUSE OVERLAY --- */}
      {gameState === "PAUSED" && (
        <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-md flex flex-col items-center justify-center p-6">
          <div className="bg-slate-900 border border-slate-800 p-8 rounded-2xl max-w-sm w-full text-center shadow-2xl">
            <h2 className="text-2xl font-black text-cyan-400 mb-6">MISSION PAUSED</h2>
            <div className="flex flex-col gap-3">
              <button
                onClick={() => setGameState("PLAYING")}
                className="w-full py-3 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold rounded-xl transition"
              >
                RESUME GAME
              </button>
              <button
                onClick={startNewGame}
                className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl transition flex items-center justify-center gap-2"
              >
                <RefreshCw className="w-4 h-4" /> RESTART
              </button>
              <button
                onClick={() => setGameState("MENU")}
                className="w-full py-3 bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 font-bold rounded-xl transition border border-rose-500/30"
              >
                ABORT MISSION
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- GAME OVER OVERLAY --- */}
      {gameState === "GAME_OVER" && (
        <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-xl flex flex-col items-center justify-center p-6 text-center">
          <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="max-w-md w-full">
            <div className="p-4 bg-rose-500/10 rounded-full border border-rose-500/30 mb-4 inline-block">
              <Flame className="w-12 h-12 text-rose-500" />
            </div>

            <h2 className="text-4xl font-black text-rose-500 mb-2">SENTINEL DESTROYED</h2>
            <p className="text-slate-400 text-sm mb-6">Your hull was overwhelmed by alien void forces</p>

            <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 mb-6 grid grid-cols-2 gap-4 text-left">
              <div>
                <span className="text-xs text-slate-500 block">FINAL SCORE</span>
                <span className="text-lg font-bold text-cyan-400">{score.toLocaleString()}</span>
              </div>
              <div>
                <span className="text-xs text-slate-500 block">WAVE REACHED</span>
                <span className="text-lg font-bold text-purple-400">{wave}</span>
              </div>
            </div>

            <button
              onClick={startNewGame}
              className="w-full py-4 bg-gradient-to-r from-rose-500 to-purple-600 hover:from-rose-400 hover:to-purple-500 text-white font-extrabold rounded-xl shadow-xl transition flex items-center justify-center gap-2"
            >
              <RotateCcw className="w-5 h-5" /> RE-DEPLOY SENTINEL
            </button>
          </motion.div>
        </div>
      )}
    </div>
  );
}
