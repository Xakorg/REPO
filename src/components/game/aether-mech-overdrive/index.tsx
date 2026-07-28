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
  Target
} from "lucide-react";

// --- TYPES & INTERFACES ---
type GameState = "MENU" | "PLAYING" | "PAUSED" | "LEVEL_UP" | "GAME_OVER" | "VICTORY" | "SHOP";

interface Weapon {
  id: string;
  name: string;
  fireRate: number; // ms per shot
  damage: number;
  speed: number;
  spread: number;
  projectilesPerShot: number;
  energyCost: number;
  color: string;
  unlocked: boolean;
  description: string;
}

interface Ability {
  id: string;
  name: string;
  cooldown: number; // in ms
  lastUsed: number;
  duration: number;
  energyCost: number;
  description: string;
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
  type: "SCOUT" | "WALKER" | "SNIPER" | "HEAVY" | "BOSS";
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  hp: number;
  maxHp: number;
  color: string;
  speed: number;
  scoreValue: number;
  lastShot: number;
  fireRate: number;
  shield?: number;
  maxShield?: number;
  bossPhase?: number;
}

interface DropItem {
  id: number;
  x: number;
  y: number;
  type: "XP" | "HEALTH" | "ENERGY" | "OVERDRIVE";
  value: number;
  radius: number;
  duration: number;
}

interface HologramDecoy {
  x: number;
  y: number;
  duration: number;
  maxDuration: number;
}

interface UpgradeOption {
  id: string;
  title: string;
  description: string;
  category: "OFFENSE" | "DEFENSE" | "UTILITY";
  apply: (stats: GameStats) => void;
}

interface GameStats {
  maxHp: number;
  hp: number;
  shield: number;
  maxShield: number;
  shieldRegenRate: number;
  moveSpeed: number;
  damageMultiplier: number;
  fireRateMultiplier: number;
  critChance: number;
  magnetRadius: number;
  level: number;
  xp: number;
  xpToNext: number;
  credits: number;
  kills: number;
  wave: number;
  score: number;
  highScore: number;
}

export default function AetherMechOverdriveGame() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // --- GAME STATES ---
  const [gameState, setGameState] = useState<GameState>("MENU");
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [activeWeaponIndex, setActiveWeaponIndex] = useState<number>(0);

  // Stats State
  const [stats, setStats] = useState<GameStats>({
    maxHp: 100,
    hp: 100,
    shield: 50,
    maxShield: 50,
    shieldRegenRate: 2,
    moveSpeed: 4.5,
    damageMultiplier: 1,
    fireRateMultiplier: 1,
    critChance: 0.05,
    magnetRadius: 120,
    level: 1,
    xp: 0,
    xpToNext: 100,
    credits: 0,
    kills: 0,
    wave: 1,
    score: 0,
    highScore: 0,
  });

  // Available Weapons
  const [weapons, setWeapons] = useState<Weapon[]>([
    {
      id: "pulse",
      name: "Pulse Blaster",
      fireRate: 150,
      damage: 18,
      speed: 12,
      spread: 0.08,
      projectilesPerShot: 1,
      energyCost: 0,
      color: "#00f0ff",
      unlocked: true,
      description: "Standard dual rapid-fire plasma cannons.",
    },
    {
      id: "shotgun",
      name: "Ion Scattercannon",
      fireRate: 450,
      damage: 14,
      speed: 10,
      spread: 0.35,
      projectilesPerShot: 5,
      energyCost: 2,
      color: "#ff0077",
      unlocked: true,
      description: "High-spread heavy kinetic ion shell bursts.",
    },
    {
      id: "beam",
      name: "Quantum Railbeam",
      fireRate: 600,
      damage: 85,
      speed: 22,
      spread: 0.02,
      projectilesPerShot: 1,
      energyCost: 5,
      color: "#39ff14",
      unlocked: false,
      description: "High-density energy line that pierces enemy defenses.",
    },
    {
      id: "mortar",
      name: "Aether Mortar",
      fireRate: 750,
      damage: 110,
      speed: 8,
      spread: 0.15,
      projectilesPerShot: 1,
      energyCost: 10,
      color: "#ffaa00",
      unlocked: false,
      description: "Explosive energy round dealing high splash damage.",
    },
  ]);

  // Abilities
  const [abilities, setAbilities] = useState<Ability[]>([
    {
      id: "time_warp",
      name: "Time Dilation",
      cooldown: 12000,
      lastUsed: 0,
      duration: 4000,
      energyCost: 20,
      description: "Slowing enemy movement and projectiles by 80%.",
      icon: "Zap",
    },
    {
      id: "decoy",
      name: "Hologram Echo",
      cooldown: 15000,
      lastUsed: 0,
      duration: 5000,
      energyCost: 25,
      description: "Deploys a glowing decoy that attracts hostile fire.",
      icon: "Radio",
    },
    {
      id: "barrier",
      name: "Aether Shield",
      cooldown: 18000,
      lastUsed: 0,
      duration: 3500,
      energyCost: 30,
      description: "Grants invulnerability and reflects incoming enemy blasts.",
      icon: "Shield",
    },
    {
      id: "emp",
      name: "EMP Overdrive",
      cooldown: 20000,
      lastUsed: 0,
      duration: 1000,
      energyCost: 40,
      description: "Discharges a massive shockwave damaging and disabling all foes.",
      icon: "Flame",
    },
  ]);

  // Upgrades presented on level up
  const [upgradeChoices, setUpgradeChoices] = useState<UpgradeOption[]>([]);

  // Persistent shop upgrades
  const [metaUpgrades, setMetaUpgrades] = useState({
    baseHpLevel: 0,
    baseShieldLevel: 0,
    baseSpeedLevel: 0,
    weaponPowerLevel: 0,
  });

  // Game Engine Mutable References
  const mousePos = useRef({ x: 0, y: 0 });
  const keysPressed = useRef<{ [key: string]: boolean }>({});
  const playerRef = useRef({
    x: 400,
    y: 300,
    radius: 18,
    angle: 0,
    energy: 100,
    maxEnergy: 100,
    energyRegen: 0.2,
    invulnerableTime: 0,
    timeWarpActive: 0,
    barrierActive: 0,
  });

  const lastShotTime = useRef(0);
  const bulletsRef = useRef<Bullet[]>([]);
  const enemiesRef = useRef<Enemy[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const dropsRef = useRef<DropItem[]>([]);
  const decoysRef = useRef<HologramDecoy[]>([]);
  const waveTimer = useRef(0);
  const bossActiveRef = useRef(false);
  const audioCtxRef = useRef<AudioContext | null>(null);

  // Load High Score on Mount
  useEffect(() => {
    const savedScore = localStorage.getItem("aether_mech_highscore");
    if (savedScore) {
      setStats((prev) => ({ ...prev, highScore: parseInt(savedScore, 10) || 0 }));
    }
  }, []);

  // --- AUDIO SYNTHESIZER (Web Audio API) ---
  const playSound = useCallback(
    (type: "shoot" | "hit" | "explosion" | "timewarp" | "levelup" | "shield" | "boss") => {
      if (!soundEnabled) return;
      try {
        if (!audioCtxRef.current) {
          const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
          audioCtxRef.current = new AudioContextClass();
        }
        const ctx = audioCtxRef.current;
        if (ctx.state === "suspended") {
          ctx.resume();
        }

        const now = ctx.currentTime;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);

        if (type === "shoot") {
          osc.type = "sawtooth";
          osc.frequency.setValueAtTime(440, now);
          osc.frequency.exponentialRampToValueAtTime(110, now + 0.08);
          gain.gain.setValueAtTime(0.15, now);
          gain.gain.exponentialRampToValueAtTime(0.01, now + 0.08);
          osc.start(now);
          osc.stop(now + 0.08);
        } else if (type === "hit") {
          osc.type = "sine";
          osc.frequency.setValueAtTime(300, now);
          osc.frequency.exponentialRampToValueAtTime(80, now + 0.05);
          gain.gain.setValueAtTime(0.1, now);
          gain.gain.exponentialRampToValueAtTime(0.01, now + 0.05);
          osc.start(now);
          osc.stop(now + 0.05);
        } else if (type === "explosion") {
          osc.type = "square";
          osc.frequency.setValueAtTime(150, now);
          osc.frequency.exponentialRampToValueAtTime(30, now + 0.25);
          gain.gain.setValueAtTime(0.3, now);
          gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);
          osc.start(now);
          osc.stop(now + 0.25);
        } else if (type === "timewarp") {
          osc.type = "sine";
          osc.frequency.setValueAtTime(200, now);
          osc.frequency.linearRampToValueAtTime(800, now + 0.3);
          gain.gain.setValueAtTime(0.2, now);
          gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
          osc.start(now);
          osc.stop(now + 0.3);
        } else if (type === "levelup") {
          osc.type = "triangle";
          osc.frequency.setValueAtTime(440, now);
          osc.frequency.setValueAtTime(554, now + 0.1);
          osc.frequency.setValueAtTime(659, now + 0.2);
          gain.gain.setValueAtTime(0.25, now);
          gain.gain.exponentialRampToValueAtTime(0.01, now + 0.4);
          osc.start(now);
          osc.stop(now + 0.4);
        } else if (type === "shield") {
          osc.type = "sine";
          osc.frequency.setValueAtTime(600, now);
          osc.frequency.exponentialRampToValueAtTime(300, now + 0.15);
          gain.gain.setValueAtTime(0.2, now);
          gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
          osc.start(now);
          osc.stop(now + 0.15);
        } else if (type === "boss") {
          osc.type = "sawtooth";
          osc.frequency.setValueAtTime(120, now);
          osc.frequency.linearRampToValueAtTime(60, now + 0.5);
          gain.gain.setValueAtTime(0.4, now);
          gain.gain.exponentialRampToValueAtTime(0.01, now + 0.5);
          osc.start(now);
          osc.stop(now + 0.5);
        }
      } catch (e) {
        console.warn("Audio playback error:", e);
      }
    },
    [soundEnabled]
  );

  // --- PARTICLE GENERATOR ---
  const spawnExplosion = (x: number, y: number, color: string, count = 15) => {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 1 + Math.random() * 6;
      particlesRef.current.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 0,
        maxLife: 20 + Math.random() * 25,
        color,
        size: 2 + Math.random() * 4,
        glow: true,
      });
    }
  };

  // --- START / RESET GAME ---
  const startGame = () => {
    const initialHp = 100 + metaUpgrades.baseHpLevel * 25;
    const initialShield = 50 + metaUpgrades.baseShieldLevel * 15;
    const initialSpeed = 4.5 + metaUpgrades.baseSpeedLevel * 0.5;

    setStats({
      maxHp: initialHp,
      hp: initialHp,
      shield: initialShield,
      maxShield: initialShield,
      shieldRegenRate: 2,
      moveSpeed: initialSpeed,
      damageMultiplier: 1 + metaUpgrades.weaponPowerLevel * 0.15,
      fireRateMultiplier: 1,
      critChance: 0.05,
      magnetRadius: 120,
      level: 1,
      xp: 0,
      xpToNext: 100,
      credits: 0,
      kills: 0,
      wave: 1,
      score: 0,
      highScore: stats.highScore,
    });

    playerRef.current = {
      x: 600,
      y: 400,
      radius: 18,
      angle: 0,
      energy: 100,
      maxEnergy: 100,
      energyRegen: 0.25,
      invulnerableTime: 0,
      timeWarpActive: 0,
      barrierActive: 0,
    };

    bulletsRef.current = [];
    enemiesRef.current = [];
    particlesRef.current = [];
    dropsRef.current = [];
    decoysRef.current = [];
    waveTimer.current = 0;
    bossActiveRef.current = false;

    spawnWave(1);
    setGameState("PLAYING");
  };

  // --- SPAWN WAVE MECHANICS ---
  const spawnWave = (waveNum: number) => {
    enemiesRef.current = [];
    bossActiveRef.current = false;

    // Check for Boss Wave every 5 waves
    if (waveNum % 5 === 0) {
      bossActiveRef.current = true;
      playSound("boss");
      enemiesRef.current.push({
        id: Date.now(),
        type: "BOSS",
        x: 600,
        y: -100,
        vx: 0,
        vy: 1.2,
        radius: 45,
        hp: 1200 + waveNum * 400,
        maxHp: 1200 + waveNum * 400,
        color: "#ff0055",
        speed: 1.5,
        scoreValue: 2500,
        lastShot: 0,
        fireRate: 800,
        shield: 500,
        maxShield: 500,
        bossPhase: 1,
      });
      return;
    }

    const enemyCount = 6 + waveNum * 3;
    for (let i = 0; i < enemyCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const distance = 500 + Math.random() * 300;
      const spawnX = playerRef.current.x + Math.cos(angle) * distance;
      const spawnY = playerRef.current.y + Math.sin(angle) * distance;

      const roll = Math.random();
      let type: "SCOUT" | "WALKER" | "SNIPER" | "HEAVY" = "SCOUT";
      let hp = 30 + waveNum * 10;
      let radius = 14;
      let color = "#00ffcc";
      let speed = 2.8 + Math.random() * 0.8;
      let scoreVal = 100;
      let fireRate = 2000;

      if (roll > 0.8 && waveNum >= 3) {
        type = "HEAVY";
        hp = 180 + waveNum * 30;
        radius = 24;
        color = "#ff3300";
        speed = 1.2;
        scoreVal = 400;
        fireRate = 1800;
      } else if (roll > 0.55) {
        type = "SNIPER";
        hp = 50 + waveNum * 12;
        radius = 16;
        color = "#cc00ff";
        speed = 1.8;
        scoreVal = 2500;
        fireRate = 2500;
      } else if (roll > 0.3) {
        type = "WALKER";
        hp = 70 + waveNum * 15;
        radius = 18;
        color = "#ffcc00";
        speed = 2.0;
        scoreVal = 200;
        fireRate = 1500;
      }

      enemiesRef.current.push({
        id: Date.now() + i,
        type,
        x: spawnX,
        y: spawnY,
        vx: 0,
        vy: 0,
        radius,
        hp,
        maxHp: hp,
        color,
        speed,
        scoreValue: scoreVal,
        lastShot: Date.now() + Math.random() * 1000,
        fireRate,
      });
    }
  };

  // --- TRIGGER ABILITY ---
  const triggerAbility = (abilityId: string) => {
    if (gameState !== "PLAYING") return;
    const now = Date.now();
    const ability = abilities.find((a) => a.id === abilityId);
    if (!ability) return;

    if (now - ability.lastUsed < ability.cooldown) return;
    if (playerRef.current.energy < ability.energyCost) return;

    // Deduct energy & set cooldown
    playerRef.current.energy -= ability.energyCost;
    setAbilities((prev) =>
      prev.map((a) => (a.id === abilityId ? { ...a, lastUsed: now } : a))
    );

    if (abilityId === "time_warp") {
      playerRef.current.timeWarpActive = now + ability.duration;
      playSound("timewarp");
      spawnExplosion(playerRef.current.x, playerRef.current.y, "#00f0ff", 25);
    } else if (abilityId === "decoy") {
      decoysRef.current.push({
        x: playerRef.current.x,
        y: playerRef.current.y,
        duration: ability.duration,
        maxDuration: ability.duration,
      });
      playSound("shoot");
    } else if (abilityId === "barrier") {
      playerRef.current.barrierActive = now + ability.duration;
      playSound("shield");
    } else if (abilityId === "emp") {
      playSound("explosion");
      spawnExplosion(playerRef.current.x, playerRef.current.y, "#ff0077", 40);
      enemiesRef.current.forEach((enemy) => {
        enemy.hp -= 150 * stats.damageMultiplier;
        enemy.vx = (enemy.x - playerRef.current.x) * 0.1;
        enemy.vy = (enemy.y - playerRef.current.y) * 0.1;
      });
    }
  };

  // --- LEVEL UP & PERK SELECTION ---
  const triggerLevelUp = () => {
    setGameState("LEVEL_UP");
    playSound("levelup");

    const pool: UpgradeOption[] = [
      {
        id: "damage_up",
        title: "Aether Overcharge",
        description: "+25% Weapons Damage Output",
        category: "OFFENSE",
        apply: () =>
          setStats((prev) => ({
            ...prev,
            damageMultiplier: prev.damageMultiplier + 0.25,
          })),
      },
      {
        id: "fire_rate",
        title: "Hyper-Servo Actuators",
        description: "+20% Weapon Fire Rate Speed",
        category: "OFFENSE",
        apply: () =>
          setStats((prev) => ({
            ...prev,
            fireRateMultiplier: prev.fireRateMultiplier + 0.2,
          })),
      },
      {
        id: "shield_regen",
        title: "Nanite Shield Matrix",
        description: "+40 Max Shield and Faster Barrier Recharge",
        category: "DEFENSE",
        apply: () =>
          setStats((prev) => ({
            ...prev,
            maxShield: prev.maxShield + 40,
            shield: prev.shield + 40,
            shieldRegenRate: prev.shieldRegenRate + 1.5,
          })),
      },
      {
        id: "hull_plating",
        title: "Titanium Hull Plating",
        description: "+50 Max Hull Armor Health",
        category: "DEFENSE",
        apply: () =>
          setStats((prev) => ({
            ...prev,
            maxHp: prev.maxHp + 50,
            hp: prev.hp + 50,
          })),
      },
      {
        id: "crit_boost",
        title: "Targeting Core Array",
        description: "+15% Critical Hit Strike Chance",
        category: "OFFENSE",
        apply: () =>
          setStats((prev) => ({
            ...prev,
            critChance: prev.critChance + 0.15,
          })),
      },
      {
        id: "speed_boost",
        title: "Quantum Thrusters",
        description: "+20% Movement & Mobility Speed",
        category: "UTILITY",
        apply: () =>
          setStats((prev) => ({
            ...prev,
            moveSpeed: prev.moveSpeed * 1.2,
          })),
      },
    ];

    // Pick 3 random distinct upgrades
    const shuffled = [...pool].sort(() => 0.5 - Math.random());
    setUpgradeChoices(shuffled.slice(0, 3));
  };

  const selectUpgrade = (upgrade: UpgradeOption) => {
    upgrade.apply(stats);
    setGameState("PLAYING");
  };

  // --- MOUSE & KEYBOARD INPUT HANDLERS ---
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      keysPressed.current[e.key.toLowerCase()] = true;

      if (e.key === "1") setActiveWeaponIndex(0);
      if (e.key === "2" && weapons[1]?.unlocked) setActiveWeaponIndex(1);
      if (e.key === "3" && weapons[2]?.unlocked) setActiveWeaponIndex(2);
      if (e.key === "4" && weapons[3]?.unlocked) setActiveWeaponIndex(3);

      if (e.key.toLowerCase() === "q") triggerAbility("time_warp");
      if (e.key.toLowerCase() === "e") triggerAbility("decoy");
      if (e.key.toLowerCase() === "r") triggerAbility("barrier");
      if (e.key.toLowerCase() === "f") triggerAbility("emp");

      if (e.key === "Escape") {
        setGameState((prev) => (prev === "PLAYING" ? "PAUSED" : prev === "PAUSED" ? "PLAYING" : prev));
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      keysPressed.current[e.key.toLowerCase()] = false;
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!canvasRef.current) return;
      const rect = canvasRef.current.getBoundingClientRect();
      mousePos.current = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      };
    };

    const handleMouseDown = (e: MouseEvent) => {
      if (e.button === 0) {
        keysPressed.current["mouse_left"] = true;
      }
    };

    const handleMouseUp = (e: MouseEvent) => {
      if (e.button === 0) {
        keysPressed.current["mouse_left"] = false;
      }
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
  }, [gameState, weapons, abilities]);

  // --- MAIN GAME LOOP ENGINE ---
  useEffect(() => {
    if (gameState !== "PLAYING") return;

    let animId: number;

    const updateAndRender = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const player = playerRef.current;
      const now = Date.now();
      const isTimeWarp = player.timeWarpActive > now;
      const isBarrier = player.barrierActive > now;

      // 1. CLEAR & DRAW BACKGROUND GRID
      ctx.fillStyle = "#050814";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.strokeStyle = "rgba(0, 240, 255, 0.05)";
      ctx.lineWidth = 1;
      const gridSize = 40;
      for (let x = 0; x < canvas.width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
      }
      for (let y = 0; y < canvas.height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
      }

      // 2. PLAYER MOVEMENT & ROTATION
      let moveX = 0;
      let moveY = 0;
      if (keysPressed.current["w"] || keysPressed.current["arrowup"]) moveY -= 1;
      if (keysPressed.current["s"] || keysPressed.current["arrowdown"]) moveY += 1;
      if (keysPressed.current["a"] || keysPressed.current["arrowleft"]) moveX -= 1;
      if (keysPressed.current["d"] || keysPressed.current["arrowright"]) moveX += 1;

      if (moveX !== 0 && moveY !== 0) {
        moveX *= 0.7071;
        moveY *= 0.7071;
      }

      player.x = Math.max(player.radius, Math.min(canvas.width - player.radius, player.x + moveX * stats.moveSpeed));
      player.y = Math.max(player.radius, Math.min(canvas.height - player.radius, player.y + moveY * stats.moveSpeed));

      // Calculate Player Angle facing Mouse
      const dx = mousePos.current.x - player.x;
      const dy = mousePos.current.y - player.y;
      player.angle = Math.atan2(dy, dx);

      // Energy & Shield Regeneration
      if (player.energy < player.maxEnergy) {
        player.energy = Math.min(player.maxEnergy, player.energy + player.energyRegen);
      }
      setStats((prev) => {
        if (prev.shield < prev.maxShield) {
          return { ...prev, shield: Math.min(prev.maxShield, prev.shield + prev.shieldRegenRate * 0.05) };
        }
        return prev;
      });

      // Player Thruster Particles
      if (moveX !== 0 || moveY !== 0) {
        particlesRef.current.push({
          x: player.x - Math.cos(player.angle) * 15,
          y: player.y - Math.sin(player.angle) * 15,
          vx: (Math.random() - 0.5) * 2 - moveX * 2,
          vy: (Math.random() - 0.5) * 2 - moveY * 2,
          life: 0,
          maxLife: 15,
          color: "#00f0ff",
          size: 3,
        });
      }

      // 3. SHOOTING MECHANICS
      const currentWeapon = weapons[activeWeaponIndex];
      const effectiveFireRate = currentWeapon.fireRate / stats.fireRateMultiplier;

      if (keysPressed.current["mouse_left"] && now - lastShotTime.current >= effectiveFireRate) {
        lastShotTime.current = now;
        playSound("shoot");

        for (let i = 0; i < currentWeapon.projectilesPerShot; i++) {
          const spreadAngle = (Math.random() - 0.5) * currentWeapon.spread;
          const finalAngle = player.angle + spreadAngle;
          const vx = Math.cos(finalAngle) * currentWeapon.speed;
          const vy = Math.sin(finalAngle) * currentWeapon.speed;

          bulletsRef.current.push({
            x: player.x + Math.cos(player.angle) * 20,
            y: player.y + Math.sin(player.angle) * 20,
            vx,
            vy,
            radius: currentWeapon.id === "mortar" ? 6 : 4,
            color: currentWeapon.color,
            damage: currentWeapon.damage * stats.damageMultiplier * (Math.random() < stats.critChance ? 2 : 1),
            isEnemy: false,
            pierce: currentWeapon.id === "beam" ? 3 : 1,
            trail: [],
          });
        }
      }

      // 4. DRAW DECOYS
      decoysRef.current = decoysRef.current.filter((decoy) => {
        decoy.duration -= 16;
        if (decoy.duration <= 0) return false;

        ctx.save();
        ctx.translate(decoy.x, decoy.y);
        ctx.strokeStyle = "rgba(0, 240, 255, 0.7)";
        ctx.lineWidth = 2;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.arc(0, 0, 22, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
        return true;
      });

      // 5. UPDATE & DRAW BULLETS
      bulletsRef.current = bulletsRef.current.filter((bullet) => {
        bullet.x += bullet.vx;
        bullet.y += bullet.vy;

        // Render bullet trail
        bullet.trail.push({ x: bullet.x, y: bullet.y });
        if (bullet.trail.length > 5) bullet.trail.shift();

        ctx.strokeStyle = bullet.color;
        ctx.lineWidth = bullet.radius;
        ctx.beginPath();
        if (bullet.trail.length > 0) {
          ctx.moveTo(bullet.trail[0].x, bullet.trail[0].y);
          ctx.lineTo(bullet.x, bullet.y);
        } else {
          ctx.arc(bullet.x, bullet.y, bullet.radius, 0, Math.PI * 2);
        }
        ctx.stroke();

        // Check Out of Bounds
        if (bullet.x < 0 || bullet.x > canvas.width || bullet.y < 0 || bullet.y > canvas.height) {
          return false;
        }

        // Bullet Collisions
        if (!bullet.isEnemy) {
          for (const enemy of enemiesRef.current) {
            const dist = Math.hypot(enemy.x - bullet.x, enemy.y - bullet.y);
            if (dist < enemy.radius + bullet.radius) {
              enemy.hp -= bullet.damage;
              playSound("hit");
              spawnExplosion(bullet.x, bullet.y, bullet.color, 6);

              bullet.pierce -= 1;
              if (enemy.hp <= 0) break;
              if (bullet.pierce <= 0) return false;
            }
          }
        } else {
          // Enemy Bullet hitting Player
          const distToPlayer = Math.hypot(player.x - bullet.x, player.y - bullet.y);
          if (distToPlayer < player.radius + bullet.radius) {
            if (isBarrier) {
              // Reflect bullet
              bullet.isEnemy = false;
              bullet.vx *= -1.5;
              bullet.vy *= -1.5;
              bullet.color = "#00f0ff";
              return true;
            }

            // Damage Shield first, then HP
            setStats((prev) => {
              let damageLeft = bullet.damage;
              let newShield = prev.shield;
              let newHp = prev.hp;

              if (newShield > 0) {
                if (newShield >= damageLeft) {
                  newShield -= damageLeft;
                  damageLeft = 0;
                } else {
                  damageLeft -= newShield;
                  newShield = 0;
                }
              }
              if (damageLeft > 0) {
                newHp = Math.max(0, newHp - damageLeft);
              }
              if (newHp <= 0) {
                setGameState("GAME_OVER");
              }
              return { ...prev, shield: newShield, hp: newHp };
            });

            playSound("shield");
            spawnExplosion(bullet.x, bullet.y, "#ff0055", 10);
            return false;
          }
        }

        return bullet.pierce > 0;
      });

      // 6. UPDATE & DRAW ENEMIES
      const activeDecoy = decoysRef.current[0];
      const targetPos = activeDecoy ? { x: activeDecoy.x, y: activeDecoy.y } : { x: player.x, y: player.y };

      enemiesRef.current = enemiesRef.current.filter((enemy) => {
        if (enemy.hp <= 0) {
          // Enemy Killed
          spawnExplosion(enemy.x, enemy.y, enemy.color, 20);
          playSound("explosion");

          // Drop XP / Health / Energy
          const dropRoll = Math.random();
          if (dropRoll > 0.2) {
            dropsRef.current.push({
              id: Date.now() + Math.random(),
              x: enemy.x,
              y: enemy.y,
              type: dropRoll > 0.85 ? "HEALTH" : dropRoll > 0.7 ? "ENERGY" : "XP",
              value: enemy.type === "BOSS" ? 500 : 25,
              radius: 7,
              duration: 10000,
            });
          }

          // Update Score & Kills
          setStats((prev) => {
            const newKills = prev.kills + 1;
            const newScore = prev.score + enemy.scoreValue;
            const newCredits = prev.credits + Math.floor(enemy.scoreValue / 10);
            const newHighScore = Math.max(prev.highScore, newScore);
            localStorage.setItem("aether_mech_highscore", newHighScore.toString());
            return { ...prev, kills: newKills, score: newScore, credits: newCredits, highScore: newHighScore };
          });

          return false;
        }

        // Enemy AI Movement
        const speedFactor = isTimeWarp ? 0.25 : 1;
        const angleToTarget = Math.atan2(targetPos.y - enemy.y, targetPos.x - enemy.x);
        enemy.vx = Math.cos(angleToTarget) * enemy.speed * speedFactor;
        enemy.vy = Math.sin(angleToTarget) * enemy.speed * speedFactor;

        enemy.x += enemy.vx;
        enemy.y += enemy.vy;

        // Enemy Ranged Attacks
        if (enemy.type !== "SCOUT" && now - enemy.lastShot >= enemy.fireRate / speedFactor) {
          enemy.lastShot = now;
          const bVx = Math.cos(angleToTarget) * 7;
          const bVy = Math.sin(angleToTarget) * 7;

          bulletsRef.current.push({
            x: enemy.x,
            y: enemy.y,
            vx: bVx,
            vy: bVy,
            radius: enemy.type === "BOSS" ? 8 : 4,
            color: "#ff0055",
            damage: enemy.type === "BOSS" ? 30 : 15,
            isEnemy: true,
            pierce: 1,
            trail: [],
          });
        }

        // Draw Enemy
        ctx.save();
        ctx.translate(enemy.x, enemy.y);
        ctx.rotate(angleToTarget);

        ctx.fillStyle = enemy.color;
        ctx.shadowColor = enemy.color;
        ctx.shadowBlur = 10;

        if (enemy.type === "BOSS") {
          // Boss Visuals
          ctx.beginPath();
          ctx.arc(0, 0, enemy.radius, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = "#ffffff";
          ctx.lineWidth = 4;
          ctx.stroke();
        } else if (enemy.type === "HEAVY") {
          ctx.fillRect(-enemy.radius, -enemy.radius, enemy.radius * 2, enemy.radius * 2);
        } else {
          ctx.beginPath();
          ctx.moveTo(enemy.radius, 0);
          ctx.lineTo(-enemy.radius, -enemy.radius * 0.7);
          ctx.lineTo(-enemy.radius, enemy.radius * 0.7);
          ctx.closePath();
          ctx.fill();
        }
        ctx.restore();

        // Enemy Health Bar Overlay
        if (enemy.hp < enemy.maxHp) {
          const barWidth = enemy.radius * 2;
          ctx.fillStyle = "rgba(255, 0, 0, 0.7)";
          ctx.fillRect(enemy.x - enemy.radius, enemy.y - enemy.radius - 8, barWidth, 4);
          ctx.fillStyle = "#00ffcc";
          ctx.fillRect(
            enemy.x - enemy.radius,
            enemy.y - enemy.radius - 8,
            barWidth * (enemy.hp / enemy.maxHp),
            4
          );
        }

        return true;
      });

      // Check Wave Completion
      if (enemiesRef.current.length === 0) {
        waveTimer.current += 1;
        if (waveTimer.current > 60) {
          waveTimer.current = 0;
          setStats((prev) => {
            const nextWave = prev.wave + 1;
            spawnWave(nextWave);
            return { ...prev, wave: nextWave };
          });
        }
      }

      // 7. UPDATE & DRAW DROPS (XP / HEALTH)
      dropsRef.current = dropsRef.current.filter((drop) => {
        drop.duration -= 16;
        if (drop.duration <= 0) return false;

        const distToPlayer = Math.hypot(player.x - drop.x, player.y - drop.y);

        // Magnet attraction
        if (distToPlayer < stats.magnetRadius) {
          const angle = Math.atan2(player.y - drop.y, player.x - drop.x);
          drop.x += Math.cos(angle) * 8;
          drop.y += Math.sin(angle) * 8;
        }

        // Pickup Collision
        if (distToPlayer < player.radius + drop.radius) {
          playSound("hit");
          if (drop.type === "XP") {
            setStats((prev) => {
              let newXp = prev.xp + drop.value;
              let newLevel = prev.level;
              let newXpToNext = prev.xpToNext;

              if (newXp >= newXpToNext) {
                newXp -= newXpToNext;
                newLevel += 1;
                newXpToNext = Math.floor(newXpToNext * 1.35);
                setTimeout(triggerLevelUp, 50);
              }
              return { ...prev, xp: newXp, level: newLevel, xpToNext: newXpToNext };
            });
          } else if (drop.type === "HEALTH") {
            setStats((prev) => ({ ...prev, hp: Math.min(prev.maxHp, prev.hp + drop.value) }));
          } else if (drop.type === "ENERGY") {
            player.energy = Math.min(player.maxEnergy, player.energy + 40);
          }
          return false;
        }

        // Render Drop Item
        ctx.save();
        ctx.fillStyle = drop.type === "XP" ? "#00f0ff" : drop.type === "HEALTH" ? "#39ff14" : "#ffaa00";
        ctx.shadowColor = ctx.fillStyle;
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.arc(drop.x, drop.y, drop.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
        return true;
      });

      // 8. UPDATE & DRAW PARTICLES
      particlesRef.current = particlesRef.current.filter((p) => {
        p.x += p.vx;
        p.y += p.vy;
        p.life += 1;

        const alpha = 1 - p.life / p.maxLife;
        ctx.save();
        ctx.fillStyle = p.color;
        ctx.globalAlpha = Math.max(0, alpha);
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        return p.life < p.maxLife;
      });

      // 9. DRAW PLAYER MECH
      ctx.save();
      ctx.translate(player.x, player.y);
      ctx.rotate(player.angle);

      // Barrier Aura Effect
      if (isBarrier) {
        ctx.strokeStyle = "#00f0ff";
        ctx.shadowColor = "#00f0ff";
        ctx.shadowBlur = 20;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(0, 0, player.radius + 10, 0, Math.PI * 2);
        ctx.stroke();
      }

      // Mech Body Shape
      ctx.fillStyle = "#ffffff";
      ctx.shadowColor = "#00f0ff";
      ctx.shadowBlur = 12;
      ctx.beginPath();
      ctx.moveTo(player.radius + 6, 0);
      ctx.lineTo(-player.radius, -player.radius * 0.8);
      ctx.lineTo(-player.radius * 0.4, 0);
      ctx.lineTo(-player.radius, player.radius * 0.8);
      ctx.closePath();
      ctx.fill();

      // Cannons
      ctx.fillStyle = currentWeapon.color;
      ctx.fillRect(8, -12, 12, 4);
      ctx.fillRect(8, 8, 12, 4);

      ctx.restore();

      animId = requestAnimationFrame(updateAndRender);
    };

    animId = requestAnimationFrame(updateAndRender);
    return () => cancelAnimationFrame(animId);
  }, [gameState, stats, weapons, activeWeaponIndex, playSound]);

  return (
    <div className="relative w-full min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center font-sans overflow-hidden select-none">
      {/* BACKGROUND GRAPHIC ACCENTS */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-cyan-900/20 via-slate-950 to-slate-950 pointer-events-none" />

      {/* TOP HEADER BAR */}
      <header className="absolute top-0 left-0 right-0 h-16 px-6 bg-slate-900/80 backdrop-blur-md border-b border-cyan-500/20 flex items-center justify-between z-20">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-cyan-500/20 border border-cyan-400 flex items-center justify-center text-cyan-400 font-bold shadow-[0_0_15px_rgba(0,240,255,0.4)]">
            <Zap className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h1 className="text-xl font-black tracking-wider bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 via-teal-300 to-indigo-400">
              AETHER MECH: OVERDRIVE
            </h1>
            <p className="text-xs text-cyan-400/60 tracking-widest font-mono">TACTICAL CYBER MECH ARENA</p>
          </div>
        </div>

        <div className="flex items-center gap-6 font-mono text-sm">
          <div className="flex items-center gap-2">
            <Award className="w-4 h-4 text-amber-400" />
            <span className="text-slate-400">HIGH SCORE:</span>
            <span className="text-amber-400 font-bold">{stats.highScore.toLocaleString()}</span>
          </div>

          <button
            onClick={() => setSoundEnabled((p) => !p)}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-400 border border-cyan-500/30 transition-all"
            title="Toggle Audio"
          >
            {soundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
          </button>
        </div>
      </header>

      {/* CANVAS CONTAINER */}
      <div className="relative mt-16 rounded-xl border border-cyan-500/30 shadow-[0_0_40px_rgba(0,240,255,0.15)] overflow-hidden">
        <canvas ref={canvasRef} width={1024} height={640} className="block cursor-crosshair bg-slate-950" />

        {/* IN-GAME HUD OVERLAY */}
        {gameState === "PLAYING" && (
          <div className="absolute inset-0 pointer-events-none p-6 flex flex-col justify-between">
            {/* TOP HUD: HEALTH, SHIELD, ENERGY */}
            <div className="flex items-start justify-between">
              <div className="w-72 space-y-2 bg-slate-900/80 p-3 rounded-lg border border-cyan-500/20 backdrop-blur-sm pointer-events-auto">
                {/* Hull HP Bar */}
                <div className="space-y-1">
                  <div className="flex justify-between text-xs font-mono">
                    <span className="text-rose-400 font-semibold flex items-center gap-1">
                      <Flame className="w-3 h-3" /> HULL ARMOR
                    </span>
                    <span className="text-slate-300">
                      {Math.ceil(stats.hp)} / {stats.maxHp}
                    </span>
                  </div>
                  <div className="h-3 w-full bg-slate-950 rounded-full overflow-hidden border border-rose-900/50">
                    <div
                      className="h-full bg-gradient-to-r from-rose-600 to-rose-400 transition-all duration-200"
                      style={{ width: `${Math.max(0, (stats.hp / stats.maxHp) * 100)}%` }}
                    />
                  </div>
                </div>

                {/* Shield Bar */}
                <div className="space-y-1">
                  <div className="flex justify-between text-xs font-mono">
                    <span className="text-cyan-400 font-semibold flex items-center gap-1">
                      <Shield className="w-3 h-3" /> AETHER SHIELD
                    </span>
                    <span className="text-slate-300">
                      {Math.ceil(stats.shield)} / {stats.maxShield}
                    </span>
                  </div>
                  <div className="h-2.5 w-full bg-slate-950 rounded-full overflow-hidden border border-cyan-900/50">
                    <div
                      className="h-full bg-gradient-to-r from-cyan-600 to-cyan-300 transition-all duration-200"
                      style={{ width: `${Math.max(0, (stats.shield / stats.maxShield) * 100)}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* WAVE & SCORE CENTER BADGE */}
              <div className="text-center bg-slate-900/90 border border-cyan-500/40 px-6 py-2 rounded-xl backdrop-blur-md shadow-lg font-mono">
                <div className="text-xs text-cyan-400 tracking-widest">SECTOR WAVE</div>
                <div className="text-3xl font-black text-white">{stats.wave}</div>
                <div className="text-xs text-amber-400 mt-0.5">SCORE: {stats.score.toLocaleString()}</div>
              </div>

              {/* LEVEL & XP PROGRESS BAR */}
              <div className="w-64 bg-slate-900/80 p-3 rounded-lg border border-cyan-500/20 backdrop-blur-sm pointer-events-auto font-mono text-xs space-y-1">
                <div className="flex justify-between">
                  <span className="text-amber-400 font-bold">MECH LEVEL {stats.level}</span>
                  <span className="text-slate-400">
                    XP: {stats.xp} / {stats.xpToNext}
                  </span>
                </div>
                <div className="h-2.5 w-full bg-slate-950 rounded-full overflow-hidden border border-amber-900/50">
                  <div
                    className="h-full bg-gradient-to-r from-amber-500 to-yellow-300 transition-all duration-200"
                    style={{ width: `${(stats.xp / stats.xpToNext) * 100}%` }}
                  />
                </div>
              </div>
            </div>

            {/* BOTTOM HUD: WEAPONS & ABILITIES */}
            <div className="flex items-end justify-between pointer-events-auto">
              {/* WEAPON SELECTOR */}
              <div className="flex gap-2 bg-slate-900/80 p-2 rounded-xl border border-cyan-500/30 backdrop-blur-md">
                {weapons.map((w, idx) => (
                  <button
                    key={w.id}
                    disabled={!w.unlocked}
                    onClick={() => setActiveWeaponIndex(idx)}
                    className={`px-3 py-2 rounded-lg border font-mono text-xs transition-all flex flex-col items-center gap-1 ${
                      activeWeaponIndex === idx
                        ? "bg-cyan-500/20 border-cyan-400 text-cyan-300 shadow-[0_0_12px_rgba(0,240,255,0.3)]"
                        : w.unlocked
                        ? "bg-slate-800/60 border-slate-700 text-slate-400 hover:border-cyan-500/50"
                        : "bg-slate-950/40 border-slate-900 text-slate-600 opacity-50 cursor-not-allowed"
                    }`}
                  >
                    <span className="text-[10px] text-cyan-400/80">[{idx + 1}]</span>
                    <span className="font-bold">{w.name}</span>
                  </button>
                ))}
              </div>

              {/* ABILITIES SHORTCUT BAR */}
              <div className="flex gap-3 bg-slate-900/80 p-2.5 rounded-xl border border-indigo-500/30 backdrop-blur-md">
                {abilities.map((ab) => {
                  const now = Date.now();
                  const remainingCooldown = Math.max(0, ab.cooldown - (now - ab.lastUsed));
                  const isReady = remainingCooldown === 0 && playerRef.current.energy >= ab.energyCost;

                  return (
                    <button
                      key={ab.id}
                      onClick={() => triggerAbility(ab.id)}
                      className={`relative w-14 h-14 rounded-lg border flex flex-col items-center justify-center font-mono transition-all ${
                        isReady
                          ? "bg-indigo-600/20 border-indigo-400 text-indigo-200 hover:scale-105 shadow-[0_0_15px_rgba(99,102,241,0.4)]"
                          : "bg-slate-950/60 border-slate-800 text-slate-600"
                      }`}
                    >
                      <span className="text-[10px] font-bold text-indigo-400 absolute top-1 left-1">
                        [{ab.id === "time_warp" ? "Q" : ab.id === "decoy" ? "E" : ab.id === "barrier" ? "R" : "F"}]
                      </span>
                      <Target className="w-5 h-5 mt-1" />
                      <span className="text-[9px] font-bold truncate max-w-[48px]">{ab.name}</span>

                      {remainingCooldown > 0 && (
                        <div className="absolute inset-0 bg-slate-950/80 rounded-lg flex items-center justify-center text-xs font-bold text-rose-400">
                          {(remainingCooldown / 1000).toFixed(1)}s
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* OVERLAY: START MENU */}
        {gameState === "MENU" && (
          <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-md flex flex-col items-center justify-center p-8 z-30">
            <div className="w-16 h-16 rounded-2xl bg-cyan-500/20 border-2 border-cyan-400 flex items-center justify-center text-cyan-400 mb-6 shadow-[0_0_30px_rgba(0,240,255,0.5)]">
              <Crosshair className="w-10 h-10 animate-spin" style={{ animationDuration: "12s" }} />
            </div>

            <h2 className="text-4xl font-black tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-teal-200 to-indigo-400 mb-2 text-center">
              AETHER MECH: OVERDRIVE
            </h2>
            <p className="text-slate-400 text-sm font-mono max-w-md text-center mb-8">
              Pilot an ultra-advanced combat mech against infinite waves of rogue AI armadas. Customize weapons, deploy time-warp matrix abilities, and conquer the cyber sector.
            </p>

            <div className="flex gap-4">
              <button
                onClick={startGame}
                className="px-8 py-4 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-black tracking-wider text-lg shadow-[0_0_25px_rgba(0,240,255,0.5)] transition-all transform hover:scale-105 flex items-center gap-3"
              >
                <Play className="w-6 h-6 fill-current" /> LAUNCH MISSION
              </button>

              <button
                onClick={() => setGameState("SHOP")}
                className="px-6 py-4 rounded-xl bg-slate-900 hover:bg-slate-800 border border-cyan-500/40 text-cyan-300 font-bold font-mono text-sm transition-all flex items-center gap-2"
              >
                <Sparkles className="w-5 h-5 text-amber-400" /> MECH HANGAR SHOP
              </button>
            </div>

            {/* CONTROLS BRIEFING */}
            <div className="mt-12 grid grid-cols-2 gap-4 text-xs font-mono text-slate-400 border border-cyan-500/20 p-4 rounded-xl bg-slate-900/50 max-w-lg">
              <div>
                <span className="text-cyan-400 font-bold">WASD / ARROWS:</span> Move Mech
              </div>
              <div>
                <span className="text-cyan-400 font-bold">LEFT CLICK:</span> Fire Weapon
              </div>
              <div>
                <span className="text-cyan-400 font-bold">KEYS 1-4:</span> Switch Weapons
              </div>
              <div>
                <span className="text-cyan-400 font-bold">Q / E / R / F:</span> Abilities
              </div>
            </div>
          </div>
        )}

        {/* OVERLAY: LEVEL UP MODAL */}
        {gameState === "LEVEL_UP" && (
          <div className="absolute inset-0 bg-slate-950/95 backdrop-blur-md flex flex-col items-center justify-center p-8 z-40">
            <div className="text-amber-400 font-mono text-xs tracking-widest mb-1 flex items-center gap-2">
              <Sparkles className="w-4 h-4" /> MECH SYSTEM UPGRADE READY
            </div>
            <h3 className="text-3xl font-black text-white mb-6 font-mono">CHOOSE AN AUGMENTATION</h3>

            <div className="grid grid-cols-3 gap-6 max-w-3xl w-full">
              {upgradeChoices.map((choice) => (
                <button
                  key={choice.id}
                  onClick={() => selectUpgrade(choice)}
                  className="p-6 rounded-2xl bg-slate-900/90 border border-cyan-500/40 hover:border-cyan-400 hover:bg-cyan-950/40 transition-all text-left flex flex-col justify-between group shadow-[0_0_20px_rgba(0,240,255,0.1)] hover:shadow-[0_0_30px_rgba(0,240,255,0.3)] transform hover:-translate-y-1"
                >
                  <div>
                    <span
                      className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${
                        choice.category === "OFFENSE"
                          ? "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                          : choice.category === "DEFENSE"
                          ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30"
                          : "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                      }`}
                    >
                      {choice.category}
                    </span>
                    <h4 className="text-lg font-bold text-white mt-3 group-hover:text-cyan-300 transition-colors">
                      {choice.title}
                    </h4>
                    <p className="text-xs text-slate-400 mt-2 font-mono leading-relaxed">{choice.description}</p>
                  </div>
                  <div className="mt-6 pt-4 border-t border-slate-800 text-xs font-mono text-cyan-400 font-bold group-hover:translate-x-1 transition-transform">
                    INSTALL MODULE &rarr;
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* OVERLAY: MECH HANGAR SHOP */}
        {gameState === "SHOP" && (
          <div className="absolute inset-0 bg-slate-950/95 backdrop-blur-md flex flex-col items-center justify-center p-8 z-40">
            <div className="flex justify-between items-center w-full max-w-2xl mb-6">
              <h3 className="text-2xl font-black text-white font-mono flex items-center gap-2">
                <Sparkles className="w-6 h-6 text-amber-400" /> MECH HANGAR UPGRADES
              </h3>
              <button
                onClick={() => setGameState("MENU")}
                className="px-4 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-mono text-slate-300 flex items-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" /> RETURN TO MENU
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4 max-w-2xl w-full">
              {/* Base Health Upgrade */}
              <div className="p-4 rounded-xl bg-slate-900 border border-cyan-500/30 flex justify-between items-center font-mono">
                <div>
                  <div className="font-bold text-sm text-cyan-300">Hull Armor Capacity</div>
                  <div className="text-xs text-slate-400">Level: {metaUpgrades.baseHpLevel} / 5</div>
                </div>
                <button
                  onClick={() =>
                    setMetaUpgrades((p) => ({ ...p, baseHpLevel: Math.min(5, p.baseHpLevel + 1) }))
                  }
                  disabled={metaUpgrades.baseHpLevel >= 5}
                  className="px-4 py-2 rounded bg-cyan-500/20 border border-cyan-400 text-cyan-300 hover:bg-cyan-500/40 text-xs font-bold disabled:opacity-40"
                >
                  UPGRADE
                </button>
              </div>

              {/* Base Shield Upgrade */}
              <div className="p-4 rounded-xl bg-slate-900 border border-cyan-500/30 flex justify-between items-center font-mono">
                <div>
                  <div className="font-bold text-sm text-cyan-300">Shield Barrier Capacity</div>
                  <div className="text-xs text-slate-400">Level: {metaUpgrades.baseShieldLevel} / 5</div>
                </div>
                <button
                  onClick={() =>
                    setMetaUpgrades((p) => ({ ...p, baseShieldLevel: Math.min(5, p.baseShieldLevel + 1) }))
                  }
                  disabled={metaUpgrades.baseShieldLevel >= 5}
                  className="px-4 py-2 rounded bg-cyan-500/20 border border-cyan-400 text-cyan-300 hover:bg-cyan-500/40 text-xs font-bold disabled:opacity-40"
                >
                  UPGRADE
                </button>
              </div>

              {/* Movement Speed Upgrade */}
              <div className="p-4 rounded-xl bg-slate-900 border border-cyan-500/30 flex justify-between items-center font-mono">
                <div>
                  <div className="font-bold text-sm text-cyan-300">Engine Thrusters</div>
                  <div className="text-xs text-slate-400">Level: {metaUpgrades.baseSpeedLevel} / 5</div>
                </div>
                <button
                  onClick={() =>
                    setMetaUpgrades((p) => ({ ...p, baseSpeedLevel: Math.min(5, p.baseSpeedLevel + 1) }))
                  }
                  disabled={metaUpgrades.baseSpeedLevel >= 5}
                  className="px-4 py-2 rounded bg-cyan-500/20 border border-cyan-400 text-cyan-300 hover:bg-cyan-500/40 text-xs font-bold disabled:opacity-40"
                >
                  UPGRADE
                </button>
              </div>

              {/* Weapon Power Upgrade */}
              <div className="p-4 rounded-xl bg-slate-900 border border-cyan-500/30 flex justify-between items-center font-mono">
                <div>
                  <div className="font-bold text-sm text-cyan-300">Weapon Plasma Core</div>
                  <div className="text-xs text-slate-400">Level: {metaUpgrades.weaponPowerLevel} / 5</div>
                </div>
                <button
                  onClick={() =>
                    setMetaUpgrades((p) => ({ ...p, weaponPowerLevel: Math.min(5, p.weaponPowerLevel + 1) }))
                  }
                  disabled={metaUpgrades.weaponPowerLevel >= 5}
                  className="px-4 py-2 rounded bg-cyan-500/20 border border-cyan-400 text-cyan-300 hover:bg-cyan-500/40 text-xs font-bold disabled:opacity-40"
                >
                  UPGRADE
                </button>
              </div>
            </div>
          </div>
        )}

        {/* OVERLAY: GAME OVER */}
        {gameState === "GAME_OVER" && (
          <div className="absolute inset-0 bg-slate-950/95 backdrop-blur-md flex flex-col items-center justify-center p-8 z-40">
            <h3 className="text-4xl font-black text-rose-500 mb-2 font-mono tracking-widest">CRITICAL SYSTEM FAILURE</h3>
            <p className="text-slate-400 text-sm font-mono mb-6">MECH HULL DESTROYED IN COMBAT</p>

            <div className="bg-slate-900/90 border border-rose-500/30 p-6 rounded-2xl w-full max-w-md font-mono text-sm space-y-3 mb-8">
              <div className="flex justify-between">
                <span className="text-slate-400">FINAL SCORE:</span>
                <span className="text-amber-400 font-bold">{stats.score.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">HOSTILES NEUTRALIZED:</span>
                <span className="text-cyan-300 font-bold">{stats.kills}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">SECTOR WAVE REACHED:</span>
                <span className="text-white font-bold">{stats.wave}</span>
              </div>
            </div>

            <div className="flex gap-4">
              <button
                onClick={startGame}
                className="px-8 py-3.5 rounded-xl bg-gradient-to-r from-rose-600 to-rose-400 hover:from-rose-500 hover:to-rose-300 text-slate-950 font-black text-sm tracking-wider font-mono shadow-[0_0_20px_rgba(244,63,94,0.4)] transition-all flex items-center gap-2"
              >
                <RotateCcw className="w-5 h-5" /> REBOOT MECH
              </button>

              <button
                onClick={() => setGameState("MENU")}
                className="px-6 py-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 font-bold font-mono text-sm transition-all"
              >
                MAIN MENU
              </button>
            </div>
          </div>
        )}

        {/* OVERLAY: PAUSE */}
        {gameState === "PAUSED" && (
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-md flex flex-col items-center justify-center p-8 z-40">
            <h3 className="text-3xl font-black text-white font-mono tracking-wider mb-6">MISSION PAUSED</h3>
            <div className="flex flex-col gap-4 w-64">
              <button
                onClick={() => setGameState("PLAYING")}
                className="py-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold font-mono text-sm tracking-wider shadow-[0_0_15px_rgba(0,240,255,0.4)]"
              >
                RESUME MISSION
              </button>

              <button
                onClick={() => setGameState("MENU")}
                className="py-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 font-bold font-mono text-sm tracking-wider"
              >
                ABORT MISSION
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
