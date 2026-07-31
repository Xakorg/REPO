"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import { 
  Shield, 
  Zap, 
  Crosshair, 
  Sparkles, 
  Award, 
  RotateCcw, 
  Play, 
  Pause, 
  Volume2, 
  VolumeX, 
  Cpu, 
  Rocket, 
  Terminal,
  Share2,
  TrendingUp,
  Sliders,
  ChevronRight
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// --- GAME TYPES & INTERFACES ---
export interface ShipClass {
  id: string;
  name: string;
  role: string;
  color: string;
  accent: string;
  speed: number;
  maxHp: number;
  maxShield: number;
  energyRegen: number;
  abilityName: string;
  abilityDesc: string;
  primaryWeapon: string;
  description: string;
}

export interface Perk {
  id: string;
  name: string;
  icon: string;
  desc: string;
  level: number;
  maxLevel: number;
}

export interface Enemy {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  hp: number;
  maxHp: number;
  type: "drone" | "sniper" | "cruiser" | "kamikaze" | "boss";
  color: string;
  scoreValue: number;
  shootCooldown: number;
  angle: number;
  bossPhase?: number;
}

export interface Bullet {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
  isEnemy: boolean;
  damage: number;
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
  decay: number;
}

export interface Pickup {
  x: number;
  y: number;
  type: "hp" | "energy" | "overdrive" | "credit";
  radius: number;
  duration: number;
}

const SHIP_CLASSES: ShipClass[] = [
  {
    id: "valkyrie",
    name: "Valkyrie Interceptor",
    role: "High Speed & Rapid Fire",
    color: "#00f3ff",
    accent: "#00a8ff",
    speed: 6.5,
    maxHp: 100,
    maxShield: 60,
    energyRegen: 1.2,
    abilityName: "Tachyon Dash",
    abilityDesc: "Instant hyper-speed invulnerable pulse dash forward.",
    primaryWeapon: "Twin Quantum Pulse",
    description: "Built for speed and precision. Melts enemy swarms before they react."
  },
  {
    id: "aegis",
    name: "Aegis Dreadnought",
    role: "Heavy Armor & Defensive Core",
    color: "#ffb700",
    accent: "#ff8800",
    speed: 4.8,
    maxHp: 180,
    maxShield: 120,
    energyRegen: 0.9,
    abilityName: "Graviton Blast",
    abilityDesc: "Emits a localized EMP ring destroying bullets and knocking enemies back.",
    primaryWeapon: "Heavy Plasma Cannon",
    description: "Impenetrable defense tank. Converts damage taken into weapon overload."
  },
  {
    id: "mirage",
    name: "Solar Mirage",
    role: "Tactical & Autonomous Swarm",
    color: "#b026ff",
    accent: "#7928ca",
    speed: 5.8,
    maxHp: 110,
    maxShield: 80,
    energyRegen: 1.5,
    abilityName: "Orbital Drones",
    abilityDesc: "Deploys 2 automated laser defense turrets around your ship.",
    primaryWeapon: "Homing Micro-Missiles",
    description: "Advanced tactical unit. Deploys autonomous support drones in battle."
  }
];

export default function AetherZenithCyberHorizon() {
  // Game state
  const [gameState, setGameState] = useState<"menu" | "playing" | "perkSelect" | "paused" | "gameover">("menu");
  const [selectedShip, setSelectedShip] = useState<ShipClass>(SHIP_CLASSES[0]);
  const [score, setScore] = useState<number>(0);
  const [highScore, setHighScore] = useState<number>(0);
  const [credits, setCredits] = useState<number>(0);
  const [wave, setWave] = useState<number>(1);
  const [playerHp, setPlayerHp] = useState<number>(100);
  const [playerShield, setPlayerShield] = useState<number>(60);
  const [playerEnergy, setPlayerEnergy] = useState<number>(100);
  const [playerLevel, setPlayerLevel] = useState<number>(1);
  const [playerXp, setPlayerXp] = useState<number>(0);
  const [xpToNextLevel, setXpToNextLevel] = useState<number>(100);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [activePerks, setActivePerks] = useState<Record<string, number>>({
    damage: 0,
    fireRate: 0,
    maxShield: 0,
    magnet: 0,
    speed: 0
  });

  const [availablePerks, setAvailablePerks] = useState<Perk[]>([]);

  // Refs for loop
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const animFrameRef = useRef<number | null>(null);

  // Entities
  const playerRef = useRef({
    x: 400,
    y: 300,
    vx: 0,
    vy: 0,
    angle: 0,
    hp: 100,
    maxHp: 100,
    shield: 60,
    maxShield: 60,
    energy: 100,
    maxEnergy: 100,
    shootCooldown: 0,
    abilityCooldown: 0,
    invulnerableTimer: 0,
    dashTimer: 0,
    overdriveTimer: 0
  });

  const keysRef = useRef<Record<string, boolean>>({});
  const mouseRef = useRef({ x: 400, y: 300, isDown: false });
  const enemiesRef = useRef<Enemy[]>([]);
  const bulletsRef = useRef<Bullet[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const pickupsRef = useRef<Pickup[]>([]);
  const starfieldRef = useRef<{ x: number; y: number; z: number; size: number }[]>([]);

  // --- AUDIO SYNTHESIS ---
  const playSound = useCallback((type: "shoot" | "laser" | "hit" | "explosion" | "powerup" | "ability" | "levelUp") => {
    if (!soundEnabled) return;
    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === "suspended") {
        ctx.resume();
      }

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      const now = ctx.currentTime;

      if (type === "shoot") {
        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(440, now);
        osc.frequency.exponentialRampToValueAtTime(110, now + 0.1);
        gain.gain.setValueAtTime(0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
        osc.start(now);
        osc.stop(now + 0.1);
      } else if (type === "hit") {
        osc.type = "square";
        osc.frequency.setValueAtTime(150, now);
        osc.frequency.exponentialRampToValueAtTime(40, now + 0.08);
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.08);
        osc.start(now);
        osc.stop(now + 0.08);
      } else if (type === "explosion") {
        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(220, now);
        osc.frequency.linearRampToValueAtTime(30, now + 0.3);
        gain.gain.setValueAtTime(0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
        osc.start(now);
        osc.stop(now + 0.3);
      } else if (type === "powerup") {
        osc.type = "sine";
        osc.frequency.setValueAtTime(300, now);
        osc.frequency.linearRampToValueAtTime(600, now + 0.15);
        osc.frequency.linearRampToValueAtTime(900, now + 0.25);
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);
        osc.start(now);
        osc.stop(now + 0.25);
      } else if (type === "ability") {
        osc.type = "triangle";
        osc.frequency.setValueAtTime(200, now);
        osc.frequency.exponentialRampToValueAtTime(800, now + 0.2);
        gain.gain.setValueAtTime(0.25, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
        osc.start(now);
        osc.stop(now + 0.2);
      } else if (type === "levelUp") {
        osc.type = "sine";
        osc.frequency.setValueAtTime(440, now);
        osc.frequency.setValueAtTime(554.37, now + 0.1);
        osc.frequency.setValueAtTime(659.25, now + 0.2);
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.35);
        osc.start(now);
        osc.stop(now + 0.35);
      }
    } catch (e) {
      // Audio context fallbacks
    }
  }, [soundEnabled]);

  // Load high score
  useEffect(() => {
    const saved = localStorage.getItem("aether_zenith_high_score");
    if (saved) setHighScore(parseInt(saved, 10));

    // Generate starfield
    const stars = [];
    for (let i = 0; i < 150; i++) {
      stars.push({
        x: Math.random() * 1920,
        y: Math.random() * 1080,
        z: Math.random() * 2 + 0.5,
        size: Math.random() * 1.8 + 0.5
      });
    }
    starfieldRef.current = stars;
  }, []);

  // --- START GAME ---
  const startGame = (ship: ShipClass = selectedShip) => {
    setSelectedShip(ship);
    setScore(0);
    setWave(1);
    setPlayerHp(ship.maxHp);
    setPlayerShield(ship.maxShield);
    setPlayerEnergy(100);
    setPlayerLevel(1);
    setPlayerXp(0);
    setXpToNextLevel(100);
    setCredits(0);
    setActivePerks({ damage: 0, fireRate: 0, maxShield: 0, magnet: 0, speed: 0 });

    playerRef.current = {
      x: window.innerWidth / 2,
      y: window.innerHeight / 2,
      vx: 0,
      vy: 0,
      angle: 0,
      hp: ship.maxHp,
      maxHp: ship.maxHp,
      shield: ship.maxShield,
      maxShield: ship.maxShield,
      energy: 100,
      maxEnergy: 100,
      shootCooldown: 0,
      abilityCooldown: 0,
      invulnerableTimer: 0,
      dashTimer: 0,
      overdriveTimer: 0
    };

    enemiesRef.current = [];
    bulletsRef.current = [];
    particlesRef.current = [];
    pickupsRef.current = [];

    setGameState("playing");
    playSound("powerup");
  };

  // --- SPAWN WAVE ---
  const spawnEnemies = useCallback((currentWave: number, width: number, height: number) => {
    const count = 5 + currentWave * 3;
    const isBossWave = currentWave % 5 === 0;

    if (isBossWave && !enemiesRef.current.some(e => e.type === "boss")) {
      enemiesRef.current.push({
        x: width / 2,
        y: -100,
        vx: 0,
        vy: 1.5,
        radius: 45,
        hp: 1500 + currentWave * 500,
        maxHp: 1500 + currentWave * 500,
        type: "boss",
        color: "#ff0055",
        scoreValue: 2000,
        shootCooldown: 0,
        angle: 0,
        bossPhase: 1
      });
    }

    for (let i = 0; i < count; i++) {
      const edge = Math.floor(Math.random() * 4);
      let x = 0, y = 0;
      if (edge === 0) { x = Math.random() * width; y = -30; }
      else if (edge === 1) { x = width + 30; y = Math.random() * height; }
      else if (edge === 2) { x = Math.random() * width; y = height + 30; }
      else { x = -30; y = Math.random() * height; }

      const rand = Math.random();
      let type: "drone" | "sniper" | "cruiser" | "kamikaze" = "drone";
      let hp = 30 + currentWave * 5;
      let radius = 14;
      let color = "#00f3ff";
      let scoreVal = 50;

      if (rand > 0.75) {
        type = "cruiser";
        hp = 90 + currentWave * 15;
        radius = 24;
        color = "#ffb700";
        scoreVal = 150;
      } else if (rand > 0.5) {
        type = "sniper";
        hp = 45 + currentWave * 8;
        radius = 16;
        color = "#b026ff";
        scoreVal = 100;
      } else if (rand > 0.35) {
        type = "kamikaze";
        hp = 25 + currentWave * 4;
        radius = 12;
        color = "#ff0055";
        scoreVal = 80;
      }

      enemiesRef.current.push({
        x,
        y,
        vx: 0,
        vy: 0,
        radius,
        hp,
        maxHp: hp,
        type,
        color,
        scoreValue: scoreVal,
        shootCooldown: Math.random() * 60,
        angle: 0
      });
    }
  }, []);

  // --- TRIGGER PERK LEVEL UP ---
  const triggerLevelUp = useCallback(() => {
    const allPerks: Perk[] = [
      { id: "damage", name: "Plasma Overclock", icon: "⚔️", desc: "+25% Primary Cannon Damage", level: activePerks.damage, maxLevel: 5 },
      { id: "fireRate", name: "Tachyon Coils", icon: "⚡", desc: "+20% Attack Speed & Fire Rate", level: activePerks.fireRate, maxLevel: 5 },
      { id: "maxShield", name: "Aegis Core", icon: "🛡️", desc: "+30 Max Shield & Faster Shield Regen", level: activePerks.maxShield, maxLevel: 5 },
      { id: "magnet", name: "Graviton Ring", icon: "🧲", desc: "+50% Energy Orb Pick-up Radius", level: activePerks.magnet, maxLevel: 5 },
      { id: "speed", name: "Thruster Boost", icon: "🚀", desc: "+15% Ship Flight & Maneuver Speed", level: activePerks.speed, maxLevel: 5 }
    ];

    const pickable = allPerks.filter(p => p.level < p.maxLevel);
    const shuffled = pickable.sort(() => 0.5 - Math.random()).slice(0, 3);
    setAvailablePerks(shuffled);
    setGameState("perkSelect");
    playSound("levelUp");
  }, [activePerks, playSound]);

  // Select perk
  const applyPerk = (perkId: string) => {
    setActivePerks(prev => ({
      ...prev,
      [perkId]: prev[perkId] + 1
    }));

    if (perkId === "maxShield") {
      playerRef.current.maxShield += 30;
      playerRef.current.shield = playerRef.current.maxShield;
      setPlayerShield(playerRef.current.maxShield);
    }

    setGameState("playing");
  };

  // --- SPECIAL ABILITY EXECUTION ---
  const useSpecialAbility = useCallback(() => {
    const p = playerRef.current;
    if (p.energy < 40 || p.abilityCooldown > 0) return;

    p.energy -= 40;
    p.abilityCooldown = 180; // 3 seconds at 60fps
    playSound("ability");

    if (selectedShip.id === "valkyrie") {
      // Dash forward
      p.dashTimer = 20;
      p.invulnerableTimer = 35;
      const speedBoost = 18;
      p.vx = Math.cos(p.angle) * speedBoost;
      p.vy = Math.sin(p.angle) * speedBoost;

      // Spawn trail particles
      for (let i = 0; i < 25; i++) {
        particlesRef.current.push({
          x: p.x,
          y: p.y,
          vx: (Math.random() - 0.5) * 6,
          vy: (Math.random() - 0.5) * 6,
          radius: Math.random() * 4 + 2,
          color: "#00f3ff",
          alpha: 1,
          decay: 0.04
        });
      }
    } else if (selectedShip.id === "aegis") {
      // Graviton shockwave ring
      for (let a = 0; a < Math.PI * 2; a += 0.2) {
        bulletsRef.current.push({
          x: p.x,
          y: p.y,
          vx: Math.cos(a) * 8,
          vy: Math.sin(a) * 8,
          radius: 6,
          color: "#ffb700",
          isEnemy: false,
          damage: 50,
          life: 30,
          maxLife: 30
        });
      }
      p.shield = Math.min(p.maxShield, p.shield + 40);
    } else if (selectedShip.id === "mirage") {
      // Spawn homing micro missiles all around
      for (let i = 0; i < 8; i++) {
        const angle = (Math.PI * 2 / 8) * i;
        bulletsRef.current.push({
          x: p.x,
          y: p.y,
          vx: Math.cos(angle) * 7,
          vy: Math.sin(angle) * 7,
          radius: 5,
          color: "#b026ff",
          isEnemy: false,
          damage: 65,
          life: 90,
          maxLife: 90
        });
      }
    }
  }, [selectedShip, playSound]);

  // --- KEY & TOUCH EVENTS ---
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      keysRef.current[e.code] = true;
      if (e.code === "Space") {
        useSpecialAbility();
      }
      if (e.code === "KeyP" || e.code === "Escape") {
        if (gameState === "playing") setGameState("paused");
        else if (gameState === "paused") setGameState("playing");
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      keysRef.current[e.code] = false;
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!canvasRef.current) return;
      const rect = canvasRef.current.getBoundingClientRect();
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
  }, [gameState, useSpecialAbility]);

  // --- MAIN GAME LOOP ---
  useEffect(() => {
    if (gameState !== "playing") return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Handle canvas resizing
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    let localWave = wave;

    const loop = () => {
      const width = canvas.width;
      const height = canvas.height;

      // 1. CLEAR & BACKGROUND
      ctx.fillStyle = "#05030d";
      ctx.fillRect(0, 0, width, height);

      // Starfield parallax
      ctx.fillStyle = "#ffffff";
      starfieldRef.current.forEach(star => {
        star.y += star.z * 0.4;
        if (star.y > height) {
          star.y = 0;
          star.x = Math.random() * width;
        }
        ctx.globalAlpha = Math.min(1, star.z * 0.4 + 0.2);
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.globalAlpha = 1.0;

      // Check spawn next wave if enemies empty
      if (enemiesRef.current.length === 0) {
        spawnEnemies(localWave, width, height);
        setWave(localWave);
        localWave += 1;
      }

      // 2. UPDATE PLAYER
      const p = playerRef.current;
      let moveSpeed = selectedShip.speed * (1 + activePerks.speed * 0.15);

      let dx = 0;
      let dy = 0;
      if (keysRef.current["KeyW"] || keysRef.current["ArrowUp"]) dy -= 1;
      if (keysRef.current["KeyS"] || keysRef.current["ArrowDown"]) dy += 1;
      if (keysRef.current["KeyA"] || keysRef.current["ArrowLeft"]) dx -= 1;
      if (keysRef.current["KeyD"] || keysRef.current["ArrowRight"]) dx += 1;

      if (dx !== 0 && dy !== 0) {
        dx *= 0.7071;
        dy *= 0.7071;
      }

      p.vx = p.vx * 0.82 + dx * moveSpeed * 0.18;
      p.vy = p.vy * 0.82 + dy * moveSpeed * 0.18;

      p.x += p.vx;
      p.y += p.vy;

      // Bounds
      p.x = Math.max(25, Math.min(width - 25, p.x));
      p.y = Math.max(25, Math.min(height - 25, p.y));

      // Aiming angle
      p.angle = Math.atan2(mouseRef.current.y - p.y, mouseRef.current.x - p.x);

      // Timers & Regen
      if (p.shootCooldown > 0) p.shootCooldown -= 1;
      if (p.abilityCooldown > 0) p.abilityCooldown -= 1;
      if (p.invulnerableTimer > 0) p.invulnerableTimer -= 1;
      if (p.dashTimer > 0) p.dashTimer -= 1;

      // Shield regen
      if (p.shield < p.maxShield) {
        p.shield = Math.min(p.maxShield, p.shield + 0.08 * (1 + activePerks.maxShield * 0.2));
        setPlayerShield(Math.floor(p.shield));
      }

      // Energy regen
      if (p.energy < p.maxEnergy) {
        p.energy = Math.min(p.maxEnergy, p.energy + 0.15 * selectedShip.energyRegen);
        setPlayerEnergy(Math.floor(p.energy));
      }

      // Thruster trail particles
      if (Math.abs(p.vx) > 0.5 || Math.abs(p.vy) > 0.5) {
        particlesRef.current.push({
          x: p.x - Math.cos(p.angle) * 15,
          y: p.y - Math.sin(p.angle) * 15,
          vx: -Math.cos(p.angle) * 3 + (Math.random() - 0.5) * 2,
          vy: -Math.sin(p.angle) * 3 + (Math.random() - 0.5) * 2,
          radius: Math.random() * 3 + 1,
          color: selectedShip.color,
          alpha: 0.8,
          decay: 0.05
        });
      }

      // 3. SHOOTING LOGIC
      const fireRateMod = 1 - activePerks.fireRate * 0.12;
      const baseCooldown = 10 * fireRateMod;

      if (mouseRef.current.isDown && p.shootCooldown <= 0) {
        p.shootCooldown = baseCooldown;
        playSound("shoot");

        const dmg = 25 * (1 + activePerks.damage * 0.25);
        const bulletSpeed = 12;

        if (selectedShip.id === "valkyrie") {
          // Double parallel laser
          const perpX = -Math.sin(p.angle) * 8;
          const perpY = Math.cos(p.angle) * 8;

          bulletsRef.current.push(
            {
              x: p.x + perpX,
              y: p.y + perpY,
              vx: Math.cos(p.angle) * bulletSpeed,
              vy: Math.sin(p.angle) * bulletSpeed,
              radius: 4,
              color: selectedShip.color,
              isEnemy: false,
              damage: dmg,
              life: 60,
              maxLife: 60
            },
            {
              x: p.x - perpX,
              y: p.y - perpY,
              vx: Math.cos(p.angle) * bulletSpeed,
              vy: Math.sin(p.angle) * bulletSpeed,
              radius: 4,
              color: selectedShip.color,
              isEnemy: false,
              damage: dmg,
              life: 60,
              maxLife: 60
            }
          );
        } else if (selectedShip.id === "aegis") {
          // Heavy single plasma bolt
          bulletsRef.current.push({
            x: p.x,
            y: p.y,
            vx: Math.cos(p.angle) * (bulletSpeed * 1.2),
            vy: Math.sin(p.angle) * (bulletSpeed * 1.2),
            radius: 7,
            color: selectedShip.color,
            isEnemy: false,
            damage: dmg * 1.8,
            life: 60,
            maxLife: 60
          });
        } else {
          // Spread shot
          [-0.2, 0, 0.2].forEach(spread => {
            bulletsRef.current.push({
              x: p.x,
              y: p.y,
              vx: Math.cos(p.angle + spread) * bulletSpeed,
              vy: Math.sin(p.angle + spread) * bulletSpeed,
              radius: 4,
              color: selectedShip.color,
              isEnemy: false,
              damage: dmg * 0.7,
              life: 55,
              maxLife: 55
            });
          });
        }
      }

      // 4. UPDATE BULLETS
      bulletsRef.current.forEach((b, idx) => {
        b.x += b.vx;
        b.y += b.vy;
        b.life -= 1;

        // Draw bullet with glow
        ctx.shadowBlur = 10;
        ctx.shadowColor = b.color;
        ctx.fillStyle = b.color;
        ctx.beginPath();
        ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;

        // Player bullet hitting enemy
        if (!b.isEnemy) {
          enemiesRef.current.forEach(e => {
            const dist = Math.hypot(e.x - b.x, e.y - b.y);
            if (dist < e.radius + b.radius) {
              e.hp -= b.damage;
              b.life = 0;
              playSound("hit");

              // Hit particles
              for (let i = 0; i < 4; i++) {
                particlesRef.current.push({
                  x: b.x,
                  y: b.y,
                  vx: (Math.random() - 0.5) * 5,
                  vy: (Math.random() - 0.5) * 5,
                  radius: Math.random() * 3 + 1,
                  color: b.color,
                  alpha: 1,
                  decay: 0.08
                });
              }
            }
          });
        } else {
          // Enemy bullet hitting player
          const dist = Math.hypot(p.x - b.x, p.y - b.y);
          if (dist < 20 + b.radius && p.invulnerableTimer <= 0) {
            b.life = 0;
            playSound("hit");

            let remainingDmg = b.damage;
            if (p.shield > 0) {
              if (p.shield >= remainingDmg) {
                p.shield -= remainingDmg;
                remainingDmg = 0;
              } else {
                remainingDmg -= p.shield;
                p.shield = 0;
              }
              setPlayerShield(Math.floor(p.shield));
            }

            if (remainingDmg > 0) {
              p.hp -= remainingDmg;
              setPlayerHp(Math.max(0, Math.floor(p.hp)));
            }

            p.invulnerableTimer = 15;
          }
        }
      });
      bulletsRef.current = bulletsRef.current.filter(b => b.life > 0 && b.x > -50 && b.x < width + 50 && b.y > -50 && b.y < height + 50);

      // 5. UPDATE ENEMIES
      enemiesRef.current.forEach(e => {
        const angleToPlayer = Math.atan2(p.y - e.y, p.x - e.x);
        e.angle = angleToPlayer;

        if (e.type === "drone" || e.type === "kamikaze") {
          const speed = e.type === "kamikaze" ? 3.5 : 2.2;
          e.vx = Math.cos(angleToPlayer) * speed;
          e.vy = Math.sin(angleToPlayer) * speed;
        } else if (e.type === "sniper" || e.type === "cruiser") {
          const dist = Math.hypot(p.x - e.x, p.y - e.y);
          const targetDist = e.type === "sniper" ? 280 : 180;
          if (dist > targetDist) {
            e.vx = Math.cos(angleToPlayer) * 1.8;
            e.vy = Math.sin(angleToPlayer) * 1.8;
          } else {
            e.vx *= 0.9;
            e.vy *= 0.9;
          }

          // Enemy shooting
          e.shootCooldown += 1;
          if (e.shootCooldown > (e.type === "sniper" ? 80 : 110)) {
            e.shootCooldown = 0;
            bulletsRef.current.push({
              x: e.x,
              y: e.y,
              vx: Math.cos(angleToPlayer) * 6,
              vy: Math.sin(angleToPlayer) * 6,
              radius: 5,
              color: e.color,
              isEnemy: true,
              damage: e.type === "sniper" ? 25 : 18,
              life: 120,
              maxLife: 120
            });
          }
        } else if (e.type === "boss") {
          e.y = Math.min(120, e.y + e.vy);
          e.x += Math.sin(Date.now() * 0.002) * 2;

          e.shootCooldown += 1;
          if (e.shootCooldown > 40) {
            e.shootCooldown = 0;
            // Boss multi-directional ring shot
            for (let a = 0; a < Math.PI * 2; a += Math.PI / 4) {
              bulletsRef.current.push({
                x: e.x,
                y: e.y,
                vx: Math.cos(a) * 5,
                vy: Math.sin(a) * 5,
                radius: 6,
                color: "#ff0055",
                isEnemy: true,
                damage: 20,
                life: 140,
                maxLife: 140
              });
            }
          }
        }

        e.x += e.vx;
        e.y += e.vy;

        // Collision with player
        const dist = Math.hypot(p.x - e.x, p.y - e.y);
        if (dist < 20 + e.radius && p.invulnerableTimer <= 0) {
          p.hp -= 20;
          setPlayerHp(Math.max(0, Math.floor(p.hp)));
          p.invulnerableTimer = 25;
          playSound("hit");
          if (e.type === "kamikaze") e.hp = 0;
        }

        // Draw enemy
        ctx.shadowBlur = 12;
        ctx.shadowColor = e.color;
        ctx.fillStyle = e.color;

        ctx.save();
        ctx.translate(e.x, e.y);
        ctx.rotate(e.angle);

        if (e.type === "boss") {
          ctx.beginPath();
          ctx.polygon = (ctx as any).polygon;
          ctx.fillRect(-e.radius, -e.radius, e.radius * 2, e.radius * 2);
        } else {
          ctx.beginPath();
          ctx.arc(0, 0, e.radius, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
        ctx.shadowBlur = 0;

        // Health bar for boss/cruiser
        if (e.maxHp > 100) {
          ctx.fillStyle = "rgba(0,0,0,0.6)";
          ctx.fillRect(e.x - 25, e.y - e.radius - 12, 50, 6);
          ctx.fillStyle = e.color;
          ctx.fillRect(e.x - 25, e.y - e.radius - 12, 50 * (Math.max(0, e.hp) / e.maxHp), 6);
        }

        // Handle enemy death
        if (e.hp <= 0) {
          playSound("explosion");
          setScore(prev => {
            const nextScore = prev + e.scoreValue;
            if (nextScore > highScore) {
              setHighScore(nextScore);
              localStorage.setItem("aether_zenith_high_score", nextScore.toString());
            }
            return nextScore;
          });

          setCredits(prev => prev + Math.floor(e.scoreValue / 10));

          // XP Gain & Level up check
          setPlayerXp(prevXp => {
            const newXp = prevXp + e.scoreValue * 0.8;
            if (newXp >= xpToNextLevel) {
              setPlayerLevel(lvl => lvl + 1);
              setXpToNextLevel(target => Math.floor(target * 1.4));
              setTimeout(() => triggerLevelUp(), 10);
              return newXp - xpToNextLevel;
            }
            return newXp;
          });

          // Explosion particles
          for (let i = 0; i < 15; i++) {
            particlesRef.current.push({
              x: e.x,
              y: e.y,
              vx: (Math.random() - 0.5) * 8,
              vy: (Math.random() - 0.5) * 8,
              radius: Math.random() * 4 + 2,
              color: e.color,
              alpha: 1,
              decay: 0.04
            });
          }

          // Drop pickup
          if (Math.random() > 0.6) {
            const types: ("hp" | "energy" | "overdrive" | "credit")[] = ["hp", "energy", "credit"];
            if (Math.random() > 0.85) types.push("overdrive");
            pickupsRef.current.push({
              x: e.x,
              y: e.y,
              type: types[Math.floor(Math.random() * types.length)],
              radius: 8,
              duration: 360
            });
          }
        }
      });
      enemiesRef.current = enemiesRef.current.filter(e => e.hp > 0);

      // 6. UPDATE PICKUPS
      const magnetRadius = 60 * (1 + activePerks.magnet * 0.5);
      pickupsRef.current.forEach(item => {
        item.duration -= 1;

        // Magnet attraction to player
        const dist = Math.hypot(p.x - item.x, p.y - item.y);
        if (dist < magnetRadius) {
          item.x += ((p.x - item.x) / dist) * 5;
          item.y += ((p.y - item.y) / dist) * 5;
        }

        if (dist < 20 + item.radius) {
          item.duration = 0;
          playSound("powerup");
          if (item.type === "hp") {
            p.hp = Math.min(p.maxHp, p.hp + 25);
            setPlayerHp(Math.floor(p.hp));
          } else if (item.type === "energy") {
            p.energy = Math.min(p.maxEnergy, p.energy + 35);
            setPlayerEnergy(Math.floor(p.energy));
          } else if (item.type === "credit") {
            setCredits(c => c + 50);
          }
        }

        // Draw pickup
        const color = item.type === "hp" ? "#00ff88" : item.type === "energy" ? "#00f3ff" : "#ffb700";
        ctx.shadowBlur = 8;
        ctx.shadowColor = color;
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(item.x, item.y, item.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      });
      pickupsRef.current = pickupsRef.current.filter(item => item.duration > 0);

      // 7. PARTICLES
      particlesRef.current.forEach(part => {
        part.x += part.vx;
        part.y += part.vy;
        part.alpha -= part.decay;

        ctx.globalAlpha = Math.max(0, part.alpha);
        ctx.fillStyle = part.color;
        ctx.beginPath();
        ctx.arc(part.x, part.y, part.radius, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.globalAlpha = 1.0;
      particlesRef.current = particlesRef.current.filter(part => part.alpha > 0);

      // 8. DRAW PLAYER
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.angle);

      // Shield ring if active
      if (p.shield > 0) {
        ctx.strokeStyle = `rgba(0, 243, 255, ${p.shield / p.maxShield * 0.6})`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(0, 0, 26, 0, Math.PI * 2);
        ctx.stroke();
      }

      // Ship triangle mesh
      ctx.shadowBlur = p.invulnerableTimer > 0 ? 25 : 15;
      ctx.shadowColor = selectedShip.color;
      ctx.fillStyle = p.invulnerableTimer % 4 < 2 ? selectedShip.color : "#ffffff";

      ctx.beginPath();
      ctx.moveTo(20, 0);
      ctx.lineTo(-15, -14);
      ctx.lineTo(-8, 0);
      ctx.lineTo(-15, 14);
      ctx.closePath();
      ctx.fill();

      // Wing accent lines
      ctx.strokeStyle = selectedShip.accent;
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.restore();
      ctx.shadowBlur = 0;

      // 9. CHECK GAME OVER
      if (p.hp <= 0) {
        playSound("explosion");
        setGameState("gameover");

        // Dispatch Leaderboard Score to Xakteir system
        window.dispatchEvent(
          new CustomEvent("xakteir-game-score", {
            detail: { score, points: Math.floor(score / 50) }
          })
        );
        return;
      }

      animFrameRef.current = requestAnimationFrame(loop);
    };

    animFrameRef.current = requestAnimationFrame(loop);

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [gameState, wave, selectedShip, activePerks, xpToNextLevel, highScore, score, playSound, spawnEnemies, triggerLevelUp]);

  return (
    <div className="w-full h-screen bg-[#05030d] text-white font-sans overflow-hidden select-none relative">
      {/* CANVAS DISPLAY */}
      <canvas ref={canvasRef} className="w-full h-full block z-0" />

      {/* --- HUD OVERLAY (When Playing) --- */}
      {gameState === "playing" && (
        <div className="absolute inset-0 pointer-events-none p-6 flex flex-col justify-between z-10">
          {/* Top Bar */}
          <div className="flex justify-between items-start">
            {/* Health & Shield bars */}
            <div className="flex flex-col gap-2 bg-black/60 backdrop-blur-md border border-white/10 p-4 rounded-2xl w-72 pointer-events-auto">
              <div className="flex justify-between items-center text-xs font-bold uppercase tracking-wider text-cyan-400">
                <span className="flex items-center gap-1.5"><Shield className="w-4 h-4" /> Shield</span>
                <span>{playerShield} / {selectedShip.maxShield + activePerks.maxShield * 30}</span>
              </div>
              <div className="w-full h-2.5 bg-zinc-900 rounded-full overflow-hidden border border-cyan-500/30">
                <div 
                  className="h-full bg-cyan-400 shadow-[0_0_10px_#00f3ff] transition-all duration-200" 
                  style={{ width: `${Math.max(0, (playerShield / (selectedShip.maxShield + activePerks.maxShield * 30)) * 100)}%` }} 
                />
              </div>

              <div className="flex justify-between items-center text-xs font-bold uppercase tracking-wider text-rose-400 mt-1">
                <span className="flex items-center gap-1.5"><Rocket className="w-4 h-4" /> Integrity</span>
                <span>{playerHp} / {selectedShip.maxHp}</span>
              </div>
              <div className="w-full h-2.5 bg-zinc-900 rounded-full overflow-hidden border border-rose-500/30">
                <div 
                  className="h-full bg-rose-500 shadow-[0_0_10px_#ff0055] transition-all duration-200" 
                  style={{ width: `${Math.max(0, (playerHp / selectedShip.maxHp) * 100)}%` }} 
                />
              </div>

              {/* Ability Energy */}
              <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-wider text-amber-400 mt-1">
                <span className="flex items-center gap-1.5"><Zap className="w-3.5 h-3.5" /> Ability Core</span>
                <span>{playerEnergy}%</span>
              </div>
              <div className="w-full h-1.5 bg-zinc-900 rounded-full overflow-hidden border border-amber-500/30">
                <div className="h-full bg-amber-400 transition-all duration-200" style={{ width: `${playerEnergy}%` }} />
              </div>
            </div>

            {/* Score & Wave Badge */}
            <div className="flex flex-col items-end gap-1.5 bg-black/60 backdrop-blur-md border border-white/10 p-4 rounded-2xl pointer-events-auto">
              <div className="text-2xl font-black tracking-widest text-cyan-400 drop-shadow-[0_0_10px_rgba(0,243,255,0.4)]">
                {score.toLocaleString()} PTS
              </div>
              <div className="text-xs font-bold text-white/60 flex items-center gap-2 uppercase tracking-widest">
                <span>Wave <strong className="text-white">{wave}</strong></span> • 
                <span className="text-amber-400">High: {highScore.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Bottom Bar: Level & Controls hint */}
          <div className="flex justify-between items-end">
            <div className="flex items-center gap-4 bg-black/60 backdrop-blur-md border border-white/10 px-5 py-3 rounded-2xl pointer-events-auto">
              <div className="w-10 h-10 rounded-xl bg-purple-600/30 border border-purple-500 flex items-center justify-center font-black text-purple-300">
                L{playerLevel}
              </div>
              <div className="flex flex-col w-48">
                <div className="flex justify-between text-[11px] font-bold uppercase tracking-widest text-purple-300 mb-1">
                  <span>Matrix Level</span>
                  <span>{Math.floor(playerXp)} / {xpToNextLevel} XP</span>
                </div>
                <div className="w-full h-2 bg-zinc-900 rounded-full overflow-hidden border border-purple-500/30">
                  <div className="h-full bg-purple-500 shadow-[0_0_8px_#b026ff]" style={{ width: `${(playerXp / xpToNextLevel) * 100}%` }} />
                </div>
              </div>
            </div>

            <div className="hidden md:flex gap-3 bg-black/60 backdrop-blur-md border border-white/10 px-5 py-3 rounded-2xl text-xs font-semibold text-white/70 pointer-events-auto">
              <span className="flex items-center gap-1.5"><kbd className="px-2 py-0.5 bg-white/10 rounded border border-white/20">WASD</kbd> Move</span>
              <span className="flex items-center gap-1.5"><kbd className="px-2 py-0.5 bg-white/10 rounded border border-white/20">Click</kbd> Fire</span>
              <span className="flex items-center gap-1.5"><kbd className="px-2 py-0.5 bg-white/10 rounded border border-white/20">Space</kbd> {selectedShip.abilityName}</span>
              <span className="flex items-center gap-1.5"><kbd className="px-2 py-0.5 bg-white/10 rounded border border-white/20">P</kbd> Pause</span>
            </div>
          </div>
        </div>
      )}

      {/* --- MENU OVERLAY --- */}
      {gameState === "menu" && (
        <div className="absolute inset-0 z-20 bg-black/80 backdrop-blur-xl flex flex-col items-center justify-center p-6 text-center">
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="max-w-4xl w-full">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs font-black uppercase tracking-widest mb-6">
              <Sparkles className="w-4 h-4" /> Next-Gen Cyber Arcade Shooter
            </div>

            <h1 className="text-5xl md:text-7xl font-black tracking-tight uppercase bg-gradient-to-r from-cyan-400 via-purple-500 to-rose-500 bg-clip-text text-transparent mb-4">
              Aether Zenith
            </h1>
            <p className="text-zinc-400 text-base md:text-lg max-w-xl mx-auto mb-10 font-medium">
              Command apex space interceptors, unleash matrix upgrades, battle void dreadnoughts, and claim the ultimate leaderboard position.
            </p>

            {/* Ship Selection Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-10 text-left">
              {SHIP_CLASSES.map(ship => {
                const isSelected = selectedShip.id === ship.id;
                return (
                  <div
                    key={ship.id}
                    onClick={() => setSelectedShip(ship)}
                    className={`cursor-pointer relative p-6 rounded-2xl border transition-all duration-300 ${
                      isSelected 
                        ? "bg-zinc-900/90 border-cyan-400 shadow-[0_0_30px_rgba(0,243,255,0.2)] scale-105" 
                        : "bg-zinc-950/60 border-white/10 hover:border-white/30 hover:bg-zinc-900/40"
                    }`}
                  >
                    <div className="flex justify-between items-center mb-3">
                      <span className="text-xs font-black uppercase tracking-widest px-2.5 py-1 rounded-md" style={{ backgroundColor: `${ship.color}20`, color: ship.color }}>
                        {ship.role}
                      </span>
                      {isSelected && <div className="w-3 h-3 rounded-full bg-cyan-400 shadow-[0_0_10px_#00f3ff]" />}
                    </div>

                    <h3 className="text-xl font-bold text-white mb-1">{ship.name}</h3>
                    <p className="text-xs text-zinc-400 mb-4">{ship.description}</p>

                    <div className="space-y-1.5 text-xs text-zinc-300 pt-3 border-t border-white/10">
                      <div className="flex justify-between">
                        <span className="text-zinc-500">Weapon:</span>
                        <span className="font-semibold text-cyan-300">{ship.primaryWeapon}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-zinc-500">Ability:</span>
                        <span className="font-semibold text-amber-300">{ship.abilityName}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Play Button */}
            <div className="flex justify-center gap-4">
              <button
                onClick={() => startGame(selectedShip)}
                className="px-10 py-5 rounded-2xl bg-cyan-500 hover:bg-cyan-400 text-black font-black text-lg tracking-widest uppercase shadow-[0_0_40px_rgba(0,243,255,0.4)] hover:scale-105 transition-all flex items-center gap-3"
              >
                <Play className="w-6 h-6 fill-current" /> Launch Interceptor
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* --- PERK SELECT OVERLAY (ON LEVEL UP) --- */}
      {gameState === "perkSelect" && (
        <div className="absolute inset-0 z-30 bg-black/85 backdrop-blur-xl flex flex-col items-center justify-center p-6 text-center">
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="max-w-3xl w-full">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-purple-500/20 border border-purple-500/40 text-purple-300 text-xs font-black uppercase tracking-widest mb-4">
              <Cpu className="w-4 h-4" /> Cyber Matrix Upgraded
            </div>

            <h2 className="text-3xl md:text-5xl font-black tracking-tight text-white mb-2 uppercase">
              Choose Augmentation
            </h2>
            <p className="text-zinc-400 text-sm mb-8">Select a perk to enhance your ship&apos;s tactical combat matrix.</p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {availablePerks.map(perk => (
                <div
                  key={perk.id}
                  onClick={() => applyPerk(perk.id)}
                  className="cursor-pointer p-6 rounded-2xl bg-zinc-900 border border-white/10 hover:border-purple-400 hover:shadow-[0_0_30px_rgba(176,38,255,0.3)] transition-all flex flex-col items-center text-center group"
                >
                  <div className="text-4xl mb-3 group-hover:scale-110 transition-transform">{perk.icon}</div>
                  <h4 className="text-lg font-bold text-white mb-2">{perk.name}</h4>
                  <p className="text-xs text-zinc-400 mb-4">{perk.desc}</p>
                  <span className="text-[10px] font-black uppercase tracking-widest text-purple-400 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 mt-auto">
                    Rank {perk.level + 1} / {perk.maxLevel}
                  </span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      )}

      {/* --- GAMEOVER OVERLAY --- */}
      {gameState === "gameover" && (
        <div className="absolute inset-0 z-30 bg-black/90 backdrop-blur-2xl flex flex-col items-center justify-center p-6 text-center">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="max-w-md w-full bg-zinc-950 border border-rose-500/30 p-8 rounded-3xl shadow-[0_0_50px_rgba(255,0,85,0.2)]">
            <div className="w-16 h-16 rounded-2xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center mx-auto mb-6 text-rose-400">
              <Rocket className="w-8 h-8 rotate-180" />
            </div>

            <h2 className="text-3xl font-black uppercase tracking-tight text-white mb-2">Ship Destroyed</h2>
            <p className="text-xs text-zinc-400 mb-6">Your interceptor signal was lost in deep space.</p>

            <div className="bg-zinc-900/80 rounded-2xl p-5 border border-white/10 space-y-3 mb-6 text-sm">
              <div className="flex justify-between items-center text-zinc-400">
                <span>Final Score</span>
                <span className="font-black text-cyan-400 text-lg">{score.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center text-zinc-400">
                <span>Waves Survived</span>
                <span className="font-bold text-white">{wave}</span>
              </div>
              <div className="flex justify-between items-center text-zinc-400">
                <span>Personal Best</span>
                <span className="font-bold text-amber-400">{highScore.toLocaleString()}</span>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => startGame()}
                className="flex-1 py-4 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-black uppercase tracking-widest text-sm shadow-[0_0_20px_rgba(0,243,255,0.4)] transition-all flex items-center justify-center gap-2"
              >
                <RotateCcw className="w-4 h-4" /> Re-Deploy
              </button>
              <button
                onClick={() => setGameState("menu")}
                className="px-5 py-4 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-white/10 text-white font-bold text-sm transition-all"
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
