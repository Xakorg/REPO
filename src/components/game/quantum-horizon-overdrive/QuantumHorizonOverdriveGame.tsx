"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Shield,
  Zap,
  Sparkles,
  RotateCcw,
  Volume2,
  VolumeX,
  Pause,
  Play,
  Flame,
  Target,
  Trophy,
  Activity,
  Cpu,
  Crosshair,
  Award,
  Maximize2,
  Settings
} from "lucide-react";

// Types
interface Player {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  speed: number;
  hp: number;
  maxHp: number;
  shield: number;
  maxShield: number;
  shieldRechargeTimer: number;
  overdriveEnergy: number;
  maxOverdriveEnergy: number;
  isOverdriveActive: boolean;
  overdriveDuration: number;
  isTimeDilationActive: boolean;
  timeDilationTimer: number;
  fireRateLevel: number;
  plasmaDamageLevel: number;
  railgunLevel: number;
  orbitalDrones: number;
  magnetRadius: number;
  critChance: number;
  invulnerableTimer: number;
}

interface Bullet {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  damage: number;
  isPlayer: boolean;
  isPiercing?: boolean;
  isHoming?: boolean;
  color: string;
  isCrit?: boolean;
}

interface Enemy {
  id: number;
  type: "swarmer" | "chaser" | "heavy" | "sniper" | "mine" | "boss";
  x: number;
  y: number;
  vx: number;
  vy: number;
  hp: number;
  maxHp: number;
  radius: number;
  color: string;
  shootCooldown: number;
  scoreValue: number;
  phase?: number;
  rotation?: number;
}

interface Particle {
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

interface Gem {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  value: number;
  radius: number;
}

interface UpgradeOption {
  id: string;
  title: string;
  description: string;
  icon: string;
  apply: (p: Player) => void;
}

export default function QuantumHorizonOverdriveGame() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Game States
  const [gameState, setGameState] = useState<"menu" | "playing" | "upgrading" | "paused" | "gameover">("menu");
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [wave, setWave] = useState(1);
  const [shards, setShards] = useState(0);
  const [nextLevelShards, setNextLevelShards] = useState(25);
  const [level, setLevel] = useState(1);
  const [multiplier, setMultiplier] = useState(1);
  const [combo, setCombo] = useState(0);
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Stats
  const [stats, setStats] = useState({
    enemiesKilled: 0,
    bossesDefeated: 0,
    timeSurvived: 0,
    maxCombo: 0,
  });

  // Upgrade Selection
  const [upgradeOptions, setUpgradeOptions] = useState<UpgradeOption[]>([]);

  // Web Audio Synth
  const audioCtxRef = useRef<AudioContext | null>(null);

  const playSynthSound = useCallback((type: "shoot" | "hit" | "explosion" | "gem" | "emp" | "overdrive" | "levelup" | "gameover") => {
    if (!soundEnabled) return;
    try {
      if (!audioCtxRef.current) {
        const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        audioCtxRef.current = new AudioCtx();
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
        osc.frequency.exponentialRampToValueAtTime(110, now + 0.1);
        gain.gain.setValueAtTime(0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
        osc.start(now);
        osc.stop(now + 0.1);
      } else if (type === "hit") {
        osc.type = "triangle";
        osc.frequency.setValueAtTime(220, now);
        osc.frequency.linearRampToValueAtTime(80, now + 0.08);
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.08);
        osc.start(now);
        osc.stop(now + 0.08);
      } else if (type === "explosion") {
        osc.type = "square";
        osc.frequency.setValueAtTime(150, now);
        osc.frequency.exponentialRampToValueAtTime(30, now + 0.3);
        gain.gain.setValueAtTime(0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
        osc.start(now);
        osc.stop(now + 0.3);
      } else if (type === "gem") {
        osc.type = "sine";
        osc.frequency.setValueAtTime(587.33, now); // D5
        osc.frequency.setValueAtTime(880, now + 0.05); // A5
        gain.gain.setValueAtTime(0.12, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.12);
        osc.start(now);
        osc.stop(now + 0.12);
      } else if (type === "emp") {
        osc.type = "sine";
        osc.frequency.setValueAtTime(800, now);
        osc.frequency.exponentialRampToValueAtTime(100, now + 0.4);
        gain.gain.setValueAtTime(0.4, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.4);
        osc.start(now);
        osc.stop(now + 0.4);
      } else if (type === "overdrive") {
        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(300, now);
        osc.frequency.linearRampToValueAtTime(1200, now + 0.5);
        gain.gain.setValueAtTime(0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.5);
        osc.start(now);
        osc.stop(now + 0.5);
      } else if (type === "levelup") {
        osc.type = "triangle";
        osc.frequency.setValueAtTime(440, now);
        osc.frequency.setValueAtTime(554.37, now + 0.1);
        osc.frequency.setValueAtTime(659.25, now + 0.2);
        gain.gain.setValueAtTime(0.25, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.35);
        osc.start(now);
        osc.stop(now + 0.35);
      } else if (type === "gameover") {
        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(300, now);
        osc.frequency.linearRampToValueAtTime(60, now + 0.7);
        gain.gain.setValueAtTime(0.4, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.7);
        osc.start(now);
        osc.stop(now + 0.7);
      }
    } catch {
      // Audio fallback
    }
  }, [soundEnabled]);

  // Load HighScore
  useEffect(() => {
    const saved = localStorage.getItem("quantum_horizon_highscore");
    if (saved) setHighScore(parseInt(saved, 10));
  }, []);

  // Main Game Refs
  const keysRef = useRef<{ [key: string]: boolean }>({});
  const mouseRef = useRef({ x: 0, y: 0, isDown: false });
  const playerRef = useRef<Player>({
    x: 400,
    y: 500,
    vx: 0,
    vy: 0,
    radius: 18,
    speed: 7,
    hp: 100,
    maxHp: 100,
    shield: 50,
    maxShield: 50,
    shieldRechargeTimer: 0,
    overdriveEnergy: 0,
    maxOverdriveEnergy: 100,
    isOverdriveActive: false,
    overdriveDuration: 0,
    isTimeDilationActive: false,
    timeDilationTimer: 0,
    fireRateLevel: 1,
    plasmaDamageLevel: 1,
    railgunLevel: 0,
    orbitalDrones: 0,
    magnetRadius: 100,
    critChance: 0.05,
    invulnerableTimer: 0,
  });

  const bulletsRef = useRef<Bullet[]>([]);
  const enemiesRef = useRef<Enemy[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const gemsRef = useRef<Gem[]>([]);
  const starsRef = useRef<{ x: number; y: number; z: number; size: number }[]>([]);
  const nextBulletId = useRef(1);
  const nextEnemyId = useRef(1);
  const nextGemId = useRef(1);
  const frameCountRef = useRef(0);
  const shootCooldownRef = useRef(0);
  const empCooldownRef = useRef(0);
  const empWaveRef = useRef<{ x: number; y: number; radius: number; maxRadius: number; alpha: number } | null>(null);

  // Initialize Parallax Stars
  useEffect(() => {
    const stars: { x: number; y: number; z: number; size: number }[] = [];
    for (let i = 0; i < 150; i++) {
      stars.push({
        x: Math.random() * 1200,
        y: Math.random() * 800,
        z: Math.random() * 3 + 0.5,
        size: Math.random() * 2 + 1,
      });
    }
    starsRef.current = stars;
  }, []);

  // Keyboard Event Handlers
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      keysRef.current[e.code] = true;
      if (e.code === "KeyP" || e.code === "Escape") {
        setGameState(prev => (prev === "playing" ? "paused" : prev === "paused" ? "playing" : prev));
      }
      if (e.code === "Space" && gameState === "playing") {
        triggerEMP();
      }
      if (e.code === "KeyE" && gameState === "playing") {
        activateOverdrive();
      }
      if (e.code === "KeyQ" && gameState === "playing") {
        activateTimeDilation();
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

  // EMP Pulse Trigger
  const triggerEMP = () => {
    if (empCooldownRef.current > 0) return;
    const player = playerRef.current;
    if (player.shield < 15) return; // Shield cost for EMP

    player.shield -= 15;
    empCooldownRef.current = 300; // 5 second cooldown
    empWaveRef.current = {
      x: player.x,
      y: player.y,
      radius: 10,
      maxRadius: 350,
      alpha: 1.0,
    };
    playSynthSound("emp");

    // Clear enemy bullets in EMP range
    bulletsRef.current = bulletsRef.current.filter(b => b.isPlayer);

    // Damage enemies in range
    enemiesRef.current.forEach(e => {
      const dx = e.x - player.x;
      const dy = e.y - player.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 350) {
        e.hp -= 40 + player.plasmaDamageLevel * 10;
        createParticles(e.x, e.y, "#00f0ff", 8);
      }
    });
  };

  // Overdrive Ability
  const activateOverdrive = () => {
    const p = playerRef.current;
    if (p.overdriveEnergy >= p.maxOverdriveEnergy && !p.isOverdriveActive) {
      p.isOverdriveActive = true;
      p.overdriveDuration = 400; // ~6.6 seconds
      p.overdriveEnergy = 0;
      playSynthSound("overdrive");
      createParticles(p.x, p.y, "#ff007f", 30);
    }
  };

  // Time Dilation Ability
  const activateTimeDilation = () => {
    const p = playerRef.current;
    if (!p.isTimeDilationActive) {
      p.isTimeDilationActive = true;
      p.timeDilationTimer = 300; // ~5 seconds
      playSynthSound("overdrive");
    }
  };

  // Particle Generation Helper
  const createParticles = (x: number, y: number, color: string, count = 12) => {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 4 + 1;
      particlesRef.current.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        radius: Math.random() * 3 + 1,
        color,
        alpha: 1.0,
        life: 0,
        maxLife: Math.random() * 25 + 15,
      });
    }
  };

  // Upgrade Options Pool
  const generateUpgradeOptions = (): UpgradeOption[] => {
    const pool: UpgradeOption[] = [
      {
        id: "fire_rate",
        title: "Plasma Accelerator",
        description: "Increases weapon fire rate by +25%",
        icon: "Zap",
        apply: (p) => { p.fireRateLevel += 1; }
      },
      {
        id: "damage",
        title: "Tachyon Core",
        description: "Increases weapon output damage by +30%",
        icon: "Flame",
        apply: (p) => { p.plasmaDamageLevel += 1; }
      },
      {
        id: "shield_boost",
        title: "Aegis Matrix",
        description: "Boosts max shield by +25 and fully recharges it",
        icon: "Shield",
        apply: (p) => { p.maxShield += 25; p.shield = p.maxShield; }
      },
      {
        id: "railgun",
        title: "Piercing Quantum Beam",
        description: "Fires a piercing railgun beam through enemy armadas",
        icon: "Target",
        apply: (p) => { p.railgunLevel += 1; }
      },
      {
        id: "drone",
        title: "Autonomous Drone Array",
        description: "Adds an orbital defender drone that fires homing plasma",
        icon: "Cpu",
        apply: (p) => { p.orbitalDrones += 1; }
      },
      {
        id: "magnet",
        title: "Graviton Harvester",
        description: "Expands Quantum Shard collection radius by +50%",
        icon: "Sparkles",
        apply: (p) => { p.magnetRadius += 50; }
      },
      {
        id: "crit",
        title: "Singularity Targeting",
        description: "Increases Critical Strike chance by +15%",
        icon: "Crosshair",
        apply: (p) => { p.critChance += 0.15; }
      }
    ];

    // Shuffle & pick 3
    return pool.sort(() => 0.5 - Math.random()).slice(0, 3);
  };

  // Start / Reset Game
  const startGame = () => {
    playerRef.current = {
      x: 400,
      y: 600,
      vx: 0,
      vy: 0,
      radius: 18,
      speed: 7,
      hp: 100,
      maxHp: 100,
      shield: 50,
      maxShield: 50,
      shieldRechargeTimer: 0,
      overdriveEnergy: 0,
      maxOverdriveEnergy: 100,
      isOverdriveActive: false,
      overdriveDuration: 0,
      isTimeDilationActive: false,
      timeDilationTimer: 0,
      fireRateLevel: 1,
      plasmaDamageLevel: 1,
      railgunLevel: 0,
      orbitalDrones: 0,
      magnetRadius: 100,
      critChance: 0.05,
      invulnerableTimer: 60,
    };

    bulletsRef.current = [];
    enemiesRef.current = [];
    particlesRef.current = [];
    gemsRef.current = [];

    setScore(0);
    setWave(1);
    setShards(0);
    setNextLevelShards(25);
    setLevel(1);
    setMultiplier(1);
    setCombo(0);
    setStats({
      enemiesKilled: 0,
      bossesDefeated: 0,
      timeSurvived: 0,
      maxCombo: 0,
    });

    setGameState("playing");
    spawnWave(1);
  };

  // Spawn Enemy Waves
  const spawnWave = (currentWave: number) => {
    const canvas = canvasRef.current;
    const width = canvas ? canvas.width : 800;

    // Check for Boss Wave (every 5th wave)
    if (currentWave % 5 === 0) {
      enemiesRef.current.push({
        id: nextEnemyId.current++,
        type: "boss",
        x: width / 2,
        y: -100,
        vx: 2,
        vy: 1,
        hp: 800 + currentWave * 200,
        maxHp: 800 + currentWave * 200,
        radius: 50,
        color: "#ff0055",
        shootCooldown: 0,
        scoreValue: 2500,
        phase: 1,
        rotation: 0,
      });
      return;
    }

    const enemyCount = 5 + currentWave * 2;
    for (let i = 0; i < enemyCount; i++) {
      const typeRand = Math.random();
      let type: "swarmer" | "chaser" | "heavy" | "sniper" | "mine" = "swarmer";
      let hp = 20;
      let radius = 14;
      let color = "#00f0ff";
      let scoreValue = 100;

      if (typeRand > 0.8) {
        type = "heavy";
        hp = 80 + currentWave * 10;
        radius = 24;
        color = "#a855f7";
        scoreValue = 300;
      } else if (typeRand > 0.6) {
        type = "sniper";
        hp = 40;
        radius = 16;
        color = "#eab308";
        scoreValue = 200;
      } else if (typeRand > 0.4) {
        type = "chaser";
        hp = 30;
        radius = 15;
        color = "#ef4444";
        scoreValue = 150;
      } else if (typeRand > 0.25) {
        type = "mine";
        hp = 15;
        radius = 12;
        color = "#10b981";
        scoreValue = 80;
      }

      enemiesRef.current.push({
        id: nextEnemyId.current++,
        type,
        x: Math.random() * (width - 100) + 50,
        y: -Math.random() * 400 - 50,
        vx: (Math.random() - 0.5) * 3,
        vy: Math.random() * 1.5 + 1.2,
        hp: hp + currentWave * 5,
        maxHp: hp + currentWave * 5,
        radius,
        color,
        shootCooldown: Math.random() * 60,
        scoreValue,
      });
    }
  };

  // Main Canvas Render & Game Loop
  useEffect(() => {
    let animationFrameId: number;

    const render = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const width = canvas.width;
      const height = canvas.height;

      // Clear Canvas
      ctx.fillStyle = "#05030d";
      ctx.fillRect(0, 0, width, height);

      // Render Parallax Synthwave Grid & Starfield
      ctx.save();
      starsRef.current.forEach(star => {
        star.y += star.z * 0.5;
        if (star.y > height) star.y = 0;
        ctx.fillStyle = `rgba(255, 255, 255, ${0.3 + star.z * 0.2})`;
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
        ctx.fill();
      });

      // Synthwave Grid Floor Effect (Bottom half)
      ctx.strokeStyle = "rgba(168, 85, 247, 0.15)";
      ctx.lineWidth = 1;
      const gridTime = (Date.now() * 0.05) % 40;
      for (let y = height / 2; y < height; y += 40) {
        const drawY = y + gridTime;
        if (drawY < height) {
          ctx.beginPath();
          ctx.moveTo(0, drawY);
          ctx.lineTo(width, drawY);
          ctx.stroke();
        }
      }
      ctx.restore();

      if (gameState !== "playing" && gameState !== "upgrading" && gameState !== "paused") {
        return;
      }

      const p = playerRef.current;
      const keys = keysRef.current;
      const mouse = mouseRef.current;
      frameCountRef.current++;

      if (gameState === "playing") {
        // Stats increment
        if (frameCountRef.current % 60 === 0) {
          setStats(prev => ({ ...prev, timeSurvived: prev.timeSurvived + 1 }));
        }

        // Time Dilation Tick
        const speedScale = p.isTimeDilationActive ? 0.4 : 1.0;
        if (p.isTimeDilationActive) {
          p.timeDilationTimer--;
          if (p.timeDilationTimer <= 0) p.isTimeDilationActive = false;
        }

        // Overdrive Tick
        if (p.isOverdriveActive) {
          p.overdriveDuration--;
          if (p.overdriveDuration <= 0) p.isOverdriveActive = false;
        }

        // EMP Cooldown
        if (empCooldownRef.current > 0) empCooldownRef.current--;

        // Player Movement
        let dx = 0;
        let dy = 0;
        if (keys["KeyW"] || keys["ArrowUp"]) dy -= 1;
        if (keys["KeyS"] || keys["ArrowDown"]) dy += 1;
        if (keys["KeyA"] || keys["ArrowLeft"]) dx -= 1;
        if (keys["KeyD"] || keys["ArrowRight"]) dx += 1;

        if (dx !== 0 && dy !== 0) {
          dx *= 0.7071;
          dy *= 0.7071;
        }

        const currentSpeed = p.isOverdriveActive ? p.speed * 1.4 : p.speed;
        p.x += dx * currentSpeed;
        p.y += dy * currentSpeed;

        // Clamp to Bounds
        p.x = Math.max(p.radius, Math.min(width - p.radius, p.x));
        p.y = Math.max(p.radius, Math.min(height - p.radius, p.y));

        // Shield Recharge Logic
        if (p.shield < p.maxShield) {
          p.shieldRechargeTimer++;
          if (p.shieldRechargeTimer > 180) {
            p.shield = Math.min(p.maxShield, p.shield + 0.3);
          }
        }

        if (p.invulnerableTimer > 0) p.invulnerableTimer--;

        // Auto-Firing Logic
        shootCooldownRef.current--;
        const fireDelay = Math.max(4, 14 - p.fireRateLevel * 2 - (p.isOverdriveActive ? 5 : 0));

        if (shootCooldownRef.current <= 0 && (mouse.isDown || keys["Space"] || keys["KeyJ"])) {
          shootCooldownRef.current = fireDelay;
          const baseDamage = 15 + p.plasmaDamageLevel * 5;
          const isCrit = Math.random() < p.critChance;
          const finalDamage = isCrit ? baseDamage * 2.2 : baseDamage;

          // Double / Triple Plasma Shot
          if (p.isOverdriveActive || p.fireRateLevel >= 3) {
            bulletsRef.current.push(
              {
                id: nextBulletId.current++,
                x: p.x - 12,
                y: p.y - 10,
                vx: -1,
                vy: -14,
                radius: 4,
                damage: finalDamage,
                isPlayer: true,
                color: isCrit ? "#ff0055" : "#00f0ff",
                isCrit,
              },
              {
                id: nextBulletId.current++,
                x: p.x + 12,
                y: p.y - 10,
                vx: 1,
                vy: -14,
                radius: 4,
                damage: finalDamage,
                isPlayer: true,
                color: isCrit ? "#ff0055" : "#00f0ff",
                isCrit,
              }
            );
          } else {
            bulletsRef.current.push({
              id: nextBulletId.current++,
              x: p.x,
              y: p.y - 15,
              vx: 0,
              vy: -14,
              radius: 5,
              damage: finalDamage,
              isPlayer: true,
              color: isCrit ? "#ff0055" : "#00f0ff",
              isCrit,
            });
          }

          // Railgun Special Beam
          if (p.railgunLevel > 0 && frameCountRef.current % (60 - p.railgunLevel * 10) === 0) {
            bulletsRef.current.push({
              id: nextBulletId.current++,
              x: p.x,
              y: p.y - 20,
              vx: 0,
              vy: -22,
              radius: 8,
              damage: 40 + p.railgunLevel * 20,
              isPlayer: true,
              isPiercing: true,
              color: "#a855f7",
            });
          }

          playSynthSound("shoot");
        }

        // Orbital Drones Auto-Targeting
        if (p.orbitalDrones > 0 && frameCountRef.current % 40 === 0 && enemiesRef.current.length > 0) {
          for (let i = 0; i < p.orbitalDrones; i++) {
            const angle = (frameCountRef.current * 0.05) + (i * Math.PI * 2) / p.orbitalDrones;
            const droneX = p.x + Math.cos(angle) * 45;
            const droneY = p.y + Math.sin(angle) * 45;
            const targetEnemy = enemiesRef.current[0];
            const tdx = targetEnemy.x - droneX;
            const tdy = targetEnemy.y - droneY;
            const dist = Math.sqrt(tdx * tdx + tdy * tdy);

            bulletsRef.current.push({
              id: nextBulletId.current++,
              x: droneX,
              y: droneY,
              vx: (tdx / dist) * 10,
              vy: (tdy / dist) * 10,
              radius: 4,
              damage: 12,
              isPlayer: true,
              isHoming: true,
              color: "#10b981",
            });
          }
        }
      }

      // Update & Render EMP Shockwave
      if (empWaveRef.current) {
        const emp = empWaveRef.current;
        emp.radius += 12;
        emp.alpha -= 0.03;
        ctx.save();
        ctx.strokeStyle = `rgba(0, 240, 255, ${Math.max(0, emp.alpha)})`;
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(emp.x, emp.y, emp.radius, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();

        if (emp.alpha <= 0 || emp.radius >= emp.maxRadius) {
          empWaveRef.current = null;
        }
      }

      // Update Bullets
      bulletsRef.current.forEach(b => {
        b.x += b.vx;
        b.y += b.vy;

        // Render Bullet
        ctx.save();
        ctx.fillStyle = b.color;
        ctx.shadowColor = b.color;
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });

      // Filter offscreen bullets
      bulletsRef.current = bulletsRef.current.filter(b => b.x >= -20 && b.x <= width + 20 && b.y >= -20 && b.y <= height + 20);

      // Update Enemies
      const currentSpeedScale = p.isTimeDilationActive ? 0.4 : 1.0;
      enemiesRef.current.forEach(e => {
        e.x += e.vx * currentSpeedScale;
        e.y += e.vy * currentSpeedScale;

        // Bounce off walls
        if (e.x - e.radius < 0 || e.x + e.radius > width) e.vx = -e.vx;

        // Boss AI Movement & Shooting
        if (e.type === "boss") {
          e.rotation = (e.rotation || 0) + 0.02;
          if (e.y < 120) e.y += 1;
          e.shootCooldown += currentSpeedScale;

          if (e.shootCooldown > 45) {
            e.shootCooldown = 0;
            // Spiral bullet pattern
            for (let a = 0; a < Math.PI * 2; a += Math.PI / 4) {
              const bAngle = a + e.rotation;
              bulletsRef.current.push({
                id: nextBulletId.current++,
                x: e.x,
                y: e.y,
                vx: Math.cos(bAngle) * 5,
                vy: Math.sin(bAngle) * 5,
                radius: 5,
                damage: 15,
                isPlayer: false,
                color: "#ff0055",
              });
            }
          }
        } else {
          // Standard Enemy Shooting
          e.shootCooldown += currentSpeedScale;
          if (e.shootCooldown > 90) {
            e.shootCooldown = 0;
            if (e.type === "sniper" || e.type === "heavy") {
              const edx = p.x - e.x;
              const edy = p.y - e.y;
              const edist = Math.sqrt(edx * edx + edy * edy);
              bulletsRef.current.push({
                id: nextBulletId.current++,
                x: e.x,
                y: e.y,
                vx: (edx / edist) * 6,
                vy: (edy / edist) * 6,
                radius: 5,
                damage: 12,
                isPlayer: false,
                color: e.color,
              });
            }
          }
        }

        // Render Enemy
        ctx.save();
        ctx.fillStyle = e.color;
        ctx.shadowColor = e.color;
        ctx.shadowBlur = 10;
        ctx.beginPath();
        if (e.type === "boss") {
          ctx.arc(e.x, e.y, e.radius, 0, Math.PI * 2);
          ctx.fill();
          // Health Bar above Boss
          ctx.fillStyle = "rgba(255,255,255,0.2)";
          ctx.fillRect(e.x - 50, e.y - e.radius - 20, 100, 8);
          ctx.fillStyle = "#ff0055";
          ctx.fillRect(e.x - 50, e.y - e.radius - 20, (e.hp / e.maxHp) * 100, 8);
        } else if (e.type === "heavy") {
          ctx.rect(e.x - e.radius, e.y - e.radius, e.radius * 2, e.radius * 2);
          ctx.fill();
        } else {
          ctx.arc(e.x, e.y, e.radius, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      });

      // Filter out enemies that went off bottom screen
      enemiesRef.current = enemiesRef.current.filter(e => e.y < height + 100);

      // Bullet & Enemy Collisions
      bulletsRef.current.forEach(b => {
        if (!b.isPlayer) {
          // Check collision with player
          const pdx = b.x - p.x;
          const pdy = b.y - p.y;
          const pdist = Math.sqrt(pdx * pdx + pdy * pdy);
          if (pdist < b.radius + p.radius && p.invulnerableTimer <= 0) {
            b.damage = 0; // Destroy bullet
            p.invulnerableTimer = 15;
            p.shieldRechargeTimer = 0;
            playSynthSound("hit");

            // Damage Shield first, then HP
            if (p.shield > 0) {
              p.shield -= 15;
              if (p.shield < 0) {
                p.hp += p.shield;
                p.shield = 0;
              }
            } else {
              p.hp -= 15;
            }

            createParticles(p.x, p.y, "#ff0055", 10);

            // Check Game Over
            if (p.hp <= 0) {
              setGameState("gameover");
              playSynthSound("gameover");
              if (score > highScore) {
                setHighScore(score);
                localStorage.setItem("quantum_horizon_highscore", score.toString());
              }
            }
          }
        } else {
          // Player bullet vs Enemies
          enemiesRef.current.forEach(e => {
            const edx = b.x - e.x;
            const edy = b.y - e.y;
            const edist = Math.sqrt(edx * edx + edy * edy);

            if (edist < b.radius + e.radius) {
              e.hp -= b.damage;
              if (!b.isPiercing) b.damage = 0; // Destroy non-piercing bullet
              createParticles(b.x, b.y, b.isCrit ? "#ff0055" : "#00f0ff", 5);
              playSynthSound("hit");

              if (e.hp <= 0) {
                playSynthSound("explosion");
                createParticles(e.x, e.y, e.color, 20);

                // Stats & Combo
                setScore(prev => prev + e.scoreValue * multiplier);
                setCombo(prev => {
                  const newCombo = prev + 1;
                  setStats(s => ({ ...s, maxCombo: Math.max(s.maxCombo, newCombo) }));
                  if (newCombo % 10 === 0) setMultiplier(m => m + 1);
                  return newCombo;
                });

                setStats(s => ({
                  ...s,
                  enemiesKilled: s.enemiesKilled + 1,
                  bossesDefated: e.type === "boss" ? s.bossesDefeated + 1 : s.bossesDefeated,
                }));

                // Charge Overdrive
                p.overdriveEnergy = Math.min(p.maxOverdriveEnergy, p.overdriveEnergy + (e.type === "boss" ? 30 : 5));

                // Spawn Quantum Shard Gems
                const gemCount = e.type === "boss" ? 15 : Math.floor(Math.random() * 3) + 1;
                for (let g = 0; g < gemCount; g++) {
                  gemsRef.current.push({
                    id: nextGemId.current++,
                    x: e.x + (Math.random() - 0.5) * 20,
                    y: e.y + (Math.random() - 0.5) * 20,
                    vx: (Math.random() - 0.5) * 4,
                    vy: (Math.random() - 0.5) * 4,
                    value: e.type === "boss" ? 10 : 2,
                    radius: 6,
                  });
                }
              }
            }
          });
        }
      });

      // Cleanup destroyed bullets & dead enemies
      bulletsRef.current = bulletsRef.current.filter(b => b.damage > 0);
      enemiesRef.current = enemiesRef.current.filter(e => e.hp > 0);

      // Check Wave Completion
      if (enemiesRef.current.length === 0 && gameState === "playing") {
        setWave(w => {
          const nextW = w + 1;
          spawnWave(nextW);
          return nextW;
        });
      }

      // Update Quantum Gems & Magnet Vacuum
      gemsRef.current.forEach(g => {
        const gdx = p.x - g.x;
        const gdy = p.y - g.y;
        const gdist = Math.sqrt(gdx * gdx + gdy * gdy);

        if (gdist < p.magnetRadius) {
          g.vx += (gdx / gdist) * 0.8;
          g.vy += (gdy / gdist) * 0.8;
        }

        g.x += g.vx;
        g.y += g.vy;
        g.vx *= 0.95;
        g.vy *= 0.95;

        // Render Gem
        ctx.save();
        ctx.fillStyle = "#00f0ff";
        ctx.shadowColor = "#00f0ff";
        ctx.shadowBlur = 6;
        ctx.beginPath();
        ctx.arc(g.x, g.y, g.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        // Collect Gem
        if (gdist < p.radius + g.radius) {
          g.value = 0; // Mark collected
          playSynthSound("gem");
          setShards(prev => {
            const nextShards = prev + 1;
            if (nextShards >= nextLevelShards) {
              setLevel(l => l + 1);
              setNextLevelShards(n => Math.floor(n * 1.5));
              playSynthSound("levelup");
              setUpgradeOptions(generateUpgradeOptions());
              setGameState("upgrading");
            }
            return nextShards;
          });
        }
      });

      gemsRef.current = gemsRef.current.filter(g => g.value > 0);

      // Update Particles
      particlesRef.current.forEach(pt => {
        pt.x += pt.vx;
        pt.y += pt.vy;
        pt.life++;
        pt.alpha = 1.0 - pt.life / pt.maxLife;

        ctx.save();
        ctx.fillStyle = pt.color;
        ctx.globalAlpha = Math.max(0, pt.alpha);
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, pt.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });

      particlesRef.current = particlesRef.current.filter(pt => pt.life < pt.maxLife);

      // Render Player Ship & Drones
      ctx.save();
      if (p.invulnerableTimer > 0 && Math.floor(p.invulnerableTimer / 3) % 2 === 0) {
        ctx.globalAlpha = 0.4;
      }

      // Render Orbital Drones
      if (p.orbitalDrones > 0) {
        for (let i = 0; i < p.orbitalDrones; i++) {
          const angle = (frameCountRef.current * 0.05) + (i * Math.PI * 2) / p.orbitalDrones;
          const droneX = p.x + Math.cos(angle) * 45;
          const droneY = p.y + Math.sin(angle) * 45;

          ctx.fillStyle = "#10b981";
          ctx.shadowColor = "#10b981";
          ctx.shadowBlur = 10;
          ctx.beginPath();
          ctx.arc(droneX, droneY, 6, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // Player Ship Hull (Sci-fi Interceptor shape)
      ctx.fillStyle = p.isOverdriveActive ? "#ff007f" : "#00f0ff";
      ctx.shadowColor = p.isOverdriveActive ? "#ff007f" : "#00f0ff";
      ctx.shadowBlur = 15;

      ctx.beginPath();
      ctx.moveTo(p.x, p.y - p.radius - 5);
      ctx.lineTo(p.x + p.radius, p.y + p.radius);
      ctx.lineTo(p.x, p.y + p.radius - 6);
      ctx.lineTo(p.x - p.radius, p.y + p.radius);
      ctx.closePath();
      ctx.fill();

      // Shield Aura
      if (p.shield > 0) {
        ctx.strokeStyle = `rgba(0, 240, 255, ${0.3 + (p.shield / p.maxShield) * 0.5})`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius + 6, 0, Math.PI * 2);
        ctx.stroke();
      }

      ctx.restore();

      animationFrameId = requestAnimationFrame(render);
    };

    animationFrameId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animationFrameId);
  }, [gameState, playSynthSound, multiplier, nextLevelShards, highScore, score]);

  // Handle Mouse / Touch Controls
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    mouseRef.current.x = e.clientX - rect.left;
    mouseRef.current.y = e.clientY - rect.top;

    if (gameState === "playing") {
      playerRef.current.x = mouseRef.current.x;
      playerRef.current.y = mouseRef.current.y;
    }
  };

  const handleMouseDown = () => { mouseRef.current.isDown = true; };
  const handleMouseUp = () => { mouseRef.current.isDown = false; };

  const selectUpgrade = (upgrade: UpgradeOption) => {
    upgrade.apply(playerRef.current);
    setGameState("playing");
  };

  return (
    <div className="relative w-full h-[750px] bg-[#05030d] rounded-2xl overflow-hidden shadow-2xl border border-white/10 flex flex-col select-none font-sans text-white">
      
      {/* Top Glassmorphic HUD Bar */}
      <div className="absolute top-0 left-0 right-0 z-20 px-6 py-4 bg-black/40 backdrop-blur-md border-b border-white/10 flex items-center justify-between">
        
        {/* HP & Shield Bars */}
        <div className="flex items-center gap-4">
          <div className="flex flex-col gap-1 w-36">
            <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-cyan-400">
              <span className="flex items-center gap-1"><Shield className="w-3.5 h-3.5" /> Shield</span>
              <span>{Math.round(playerRef.current.shield)} / {playerRef.current.maxShield}</span>
            </div>
            <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full bg-cyan-400 transition-all duration-150"
                style={{ width: `${(playerRef.current.shield / playerRef.current.maxShield) * 100}%` }}
              />
            </div>
          </div>

          <div className="flex flex-col gap-1 w-36">
            <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-rose-400">
              <span className="flex items-center gap-1"><Activity className="w-3.5 h-3.5" /> Hull</span>
              <span>{Math.round(playerRef.current.hp)} / {playerRef.current.maxHp}</span>
            </div>
            <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full bg-rose-500 transition-all duration-150"
                style={{ width: `${(playerRef.current.hp / playerRef.current.maxHp) * 100}%` }}
              />
            </div>
          </div>
        </div>

        {/* Center Stats (Score, Multiplier, Wave) */}
        <div className="flex items-center gap-8">
          <div className="text-center">
            <div className="text-[10px] uppercase font-bold tracking-widest text-white/50">Score</div>
            <div className="text-2xl font-black tracking-tight text-white">{score.toLocaleString()}</div>
          </div>

          <div className="text-center">
            <div className="text-[10px] uppercase font-bold tracking-widest text-amber-400">Combo Multiplier</div>
            <div className="text-2xl font-black text-amber-400">{multiplier}x <span className="text-xs text-white/40">({combo})</span></div>
          </div>

          <div className="text-center">
            <div className="text-[10px] uppercase font-bold tracking-widest text-purple-400">Wave</div>
            <div className="text-2xl font-black text-purple-300">WAVE {wave}</div>
          </div>
        </div>

        {/* Right Controls & Sound */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white/80 transition-colors"
          >
            {soundEnabled ? <Volume2 className="w-5 h-5 text-cyan-400" /> : <VolumeX className="w-5 h-5 text-white/40" />}
          </button>

          {gameState === "playing" && (
            <button
              onClick={() => setGameState("paused")}
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white/80 transition-colors"
            >
              <Pause className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* Main HTML5 Canvas */}
      <canvas
        ref={canvasRef}
        width={1000}
        height={750}
        onMouseMove={handleMouseMove}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        className="w-full h-full cursor-crosshair"
      />

      {/* Ability Bottom Bar (Overdrive / EMP / Dilation) */}
      {gameState === "playing" && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex items-center gap-4 px-6 py-3 bg-black/60 backdrop-blur-xl border border-white/15 rounded-2xl shadow-2xl">
          
          {/* Overdrive Meter & Button */}
          <button
            onClick={activateOverdrive}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl border font-bold text-xs uppercase tracking-wider transition-all ${
              playerRef.current.overdriveEnergy >= playerRef.current.maxOverdriveEnergy
                ? "bg-pink-600 border-pink-400 text-white animate-pulse shadow-lg shadow-pink-500/50"
                : "bg-white/5 border-white/10 text-white/40"
            }`}
          >
            <Flame className="w-4 h-4" /> Overdrive (Key E)
          </button>

          {/* EMP Pulse */}
          <button
            onClick={triggerEMP}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl border font-bold text-xs uppercase tracking-wider transition-all ${
              empCooldownRef.current <= 0 && playerRef.current.shield >= 15
                ? "bg-cyan-600 border-cyan-400 text-white shadow-lg shadow-cyan-500/30"
                : "bg-white/5 border-white/10 text-white/40"
            }`}
          >
            <Zap className="w-4 h-4" /> EMP Wave (Space)
          </button>

          {/* Time Dilation */}
          <button
            onClick={activateTimeDilation}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl border font-bold text-xs uppercase tracking-wider transition-all ${
              !playerRef.current.isTimeDilationActive
                ? "bg-purple-600 border-purple-400 text-white shadow-lg shadow-purple-500/30"
                : "bg-purple-900/50 border-purple-500 text-purple-300 animate-pulse"
            }`}
          >
            <Sparkles className="w-4 h-4" /> Time Dilation (Key Q)
          </button>
        </div>
      )}

      {/* Main Menu Overlay */}
      {gameState === "menu" && (
        <div className="absolute inset-0 z-30 bg-black/80 backdrop-blur-xl flex flex-col items-center justify-center p-8 text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center max-w-xl"
          >
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs font-bold uppercase tracking-widest mb-6">
              <Sparkles className="w-4 h-4" /> Next-Gen Cybernetic Rogue-Lite
            </div>

            <h1 className="text-5xl md:text-6xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-purple-500 to-pink-500 mb-4">
              QUANTUM HORIZON OVERDRIVE
            </h1>

            <p className="text-white/60 mb-8 leading-relaxed text-sm">
              Pilot apex starfighters through intense cosmic bullet-hell sectors. Trigger EMP shockwaves, level up tech matrix augments, and eradicate Hyperion boss dreadnoughts.
            </p>

            {highScore > 0 && (
              <div className="flex items-center gap-2 mb-6 px-6 py-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 font-bold text-sm">
                <Trophy className="w-4 h-4" /> High Score: {highScore.toLocaleString()}
              </div>
            )}

            <button
              onClick={startGame}
              className="px-10 py-4 rounded-2xl bg-gradient-to-r from-cyan-500 to-purple-600 text-white font-black uppercase tracking-widest text-base shadow-xl shadow-cyan-500/25 hover:scale-105 transition-all flex items-center gap-3"
            >
              <Play className="w-5 h-5 fill-current" /> Launch Interceptor
            </button>
          </motion.div>
        </div>
      )}

      {/* Level Up / Upgrade Selection Modal */}
      {gameState === "upgrading" && (
        <div className="absolute inset-0 z-30 bg-black/85 backdrop-blur-xl flex flex-col items-center justify-center p-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center max-w-4xl text-center"
          >
            <div className="text-xs font-bold uppercase tracking-widest text-cyan-400 mb-2">Matrix Augmentation</div>
            <h2 className="text-3xl font-black text-white mb-8">SELECT QUANTUM UPGRADE (LEVEL {level})</h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full">
              {upgradeOptions.map(opt => (
                <button
                  key={opt.id}
                  onClick={() => selectUpgrade(opt)}
                  className="flex flex-col items-center p-6 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/15 hover:border-cyan-400 transition-all text-left group hover:scale-105"
                >
                  <div className="w-12 h-12 rounded-xl bg-cyan-500/20 border border-cyan-500/40 text-cyan-400 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <Sparkles className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-bold text-white mb-2">{opt.title}</h3>
                  <p className="text-xs text-white/60 leading-relaxed">{opt.description}</p>
                </button>
              ))}
            </div>
          </motion.div>
        </div>
      )}

      {/* Pause Screen */}
      {gameState === "paused" && (
        <div className="absolute inset-0 z-30 bg-black/80 backdrop-blur-md flex flex-col items-center justify-center">
          <h2 className="text-4xl font-black text-white mb-6 tracking-wider">GAME PAUSED</h2>
          <button
            onClick={() => setGameState("playing")}
            className="px-8 py-3 rounded-xl bg-cyan-500 text-black font-bold uppercase tracking-widest text-sm hover:scale-105 transition-all flex items-center gap-2"
          >
            <Play className="w-4 h-4 fill-current" /> Resume Game
          </button>
        </div>
      )}

      {/* Game Over Screen */}
      {gameState === "gameover" && (
        <div className="absolute inset-0 z-30 bg-black/90 backdrop-blur-xl flex flex-col items-center justify-center p-8 text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center max-w-md w-full"
          >
            <div className="text-xs font-bold uppercase tracking-widest text-rose-500 mb-2">Hull Destroyed</div>
            <h2 className="text-4xl font-black text-white mb-6">MISSION FAILED</h2>

            <div className="w-full bg-white/5 border border-white/10 rounded-2xl p-6 mb-8 flex flex-col gap-4 text-left">
              <div className="flex justify-between items-center text-sm border-b border-white/10 pb-2">
                <span className="text-white/60">Final Score</span>
                <span className="font-black text-cyan-400 text-lg">{score.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center text-sm border-b border-white/10 pb-2">
                <span className="text-white/60">Wave Reached</span>
                <span className="font-bold text-white">{wave}</span>
              </div>
              <div className="flex justify-between items-center text-sm border-b border-white/10 pb-2">
                <span className="text-white/60">Enemies Eliminated</span>
                <span className="font-bold text-white">{stats.enemiesKilled}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-white/60">Max Combo</span>
                <span className="font-bold text-amber-400">{stats.maxCombo}x</span>
              </div>
            </div>

            <button
              onClick={startGame}
              className="w-full py-4 rounded-2xl bg-cyan-500 text-black font-black uppercase tracking-widest text-sm hover:scale-105 transition-all flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/25"
            >
              <RotateCcw className="w-4 h-4" /> Try Again
            </button>
          </motion.div>
        </div>
      )}

    </div>
  );
}
