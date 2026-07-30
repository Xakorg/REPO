"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import { 
  Shield, 
  Zap, 
  Clock, 
  Crosshair, 
  Play, 
  RotateCcw, 
  Volume2, 
  VolumeX, 
  Pause, 
  Sparkles, 
  Flame, 
  Award,
  Info,
  ChevronRight,
  Target,
  Activity
} from "lucide-react";

// Types & Interfaces
interface Vector2D {
  x: number;
  y: number;
}

interface Player {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  angle: number;
  health: number;
  maxHealth: number;
  shield: number;
  maxShield: number;
  energy: number;
  maxEnergy: number;
  speed: number;
  dashCooldown: number;
  isDashing: boolean;
  dashTimer: number;
  timeFieldActive: boolean;
  timeFieldEnergy: number;
  score: number;
  level: number;
  xp: number;
  nextXp: number;
  weaponType: "pulse" | "laser" | "missile" | "nova";
  fireRateTimer: number;
}

interface NexusCore {
  x: number;
  y: number;
  radius: number;
  health: number;
  maxHealth: number;
  shield: number;
  maxShield: number;
  rotation: number;
  pulseTimer: number;
}

interface Bullet {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  damage: number;
  isEnemy: boolean;
  color: string;
  lifetime: number;
  homing?: boolean;
  targetId?: string;
}

interface Enemy {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  type: "scout" | "hunter" | "swarmer" | "dreadnought" | "boss";
  health: number;
  maxHealth: number;
  color: string;
  scoreValue: number;
  shootTimer: number;
  angle: number;
  phase?: number;
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

interface PowerUp {
  x: number;
  y: number;
  type: "health" | "shield" | "energy" | "upgrade";
  radius: number;
  pulse: number;
}

interface FloatingText {
  id: string;
  text: string;
  x: number;
  y: number;
  color: string;
  alpha: number;
  vy: number;
}

interface UpgradeOption {
  id: string;
  title: string;
  description: string;
  icon: string;
  effect: (player: Player, core: NexusCore) => void;
}

const UPGRADE_POOL: UpgradeOption[] = [
  {
    id: "max_health",
    title: "Hull Reinforcement",
    description: "Increases Max Hull Integrity by +30 and heals 30 HP.",
    icon: "Shield",
    effect: (player) => {
      player.maxHealth += 30;
      player.health = Math.min(player.maxHealth, player.health + 30);
    }
  },
  {
    id: "max_shield",
    title: "Plasma Shield Amplifier",
    description: "Increases Max Shield Capacity by +40.",
    icon: "Zap",
    effect: (player) => {
      player.maxShield += 40;
      player.shield = player.maxShield;
    }
  },
  {
    id: "thruster_boost",
    title: "Tachyon Engine Tuning",
    description: "Boosts movement speed by 20% and reduces Dash cooldown.",
    icon: "Flame",
    effect: (player) => {
      player.speed *= 1.2;
    }
  },
  {
    id: "core_barrier",
    title: "Nexus Core Overcharge",
    description: "Restores Nexus Core Health by +50 and increases Core Shield.",
    icon: "Activity",
    effect: (_, core) => {
      core.maxHealth += 50;
      core.health = Math.min(core.maxHealth, core.health + 50);
      core.shield = core.maxShield;
    }
  },
  {
    id: "chrono_capacitor",
    title: "Chrono Dilation Array",
    description: "Increases Max Energy by +50 for longer Time-Dilation fields.",
    icon: "Clock",
    effect: (player) => {
      player.maxEnergy += 50;
      player.energy = player.maxEnergy;
    }
  }
];

export default function ChronosNexusOverdriveGame() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  
  // Game state flags
  const [gameState, setGameState] = useState<"menu" | "playing" | "paused" | "upgrade" | "gameover">("menu");
  const [score, setScore] = useState<number>(0);
  const [highScore, setHighScore] = useState<number>(0);
  const [wave, setWave] = useState<number>(1);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [activeUpgrades, setActiveUpgrades] = useState<UpgradeOption[]>([]);
  const [stats, setStats] = useState({ enemiesKilled: 0, damageDealt: 0, timeSurvived: 0 });

  // References for mutable game loop state
  const keysRef = useRef<{ [key: string]: boolean }>({});
  const mouseRef = useRef<Vector2D>({ x: 0, y: 0 });
  const audioCtxRef = useRef<AudioContext | null>(null);
  
  // Entities
  const playerRef = useRef<Player>({
    x: 400,
    y: 500,
    vx: 0,
    vy: 0,
    radius: 18,
    angle: 0,
    health: 100,
    maxHealth: 100,
    shield: 50,
    maxShield: 50,
    energy: 100,
    maxEnergy: 100,
    speed: 5.5,
    dashCooldown: 0,
    isDashing: false,
    dashTimer: 0,
    timeFieldActive: false,
    timeFieldEnergy: 100,
    score: 0,
    level: 1,
    xp: 0,
    nextXp: 100,
    weaponType: "pulse",
    fireRateTimer: 0
  });

  const nexusCoreRef = useRef<NexusCore>({
    x: 400,
    y: 300,
    radius: 35,
    health: 200,
    maxHealth: 200,
    shield: 100,
    maxShield: 100,
    rotation: 0,
    pulseTimer: 0
  });

  const bulletsRef = useRef<Bullet[]>([]);
  const enemiesRef = useRef<Enemy[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const powerUpsRef = useRef<PowerUp[]>([]);
  const floatingTextsRef = useRef<FloatingText[]>([]);
  const waveTimerRef = useRef<number>(0);
  const gameTimeRef = useRef<number>(0);

  // Load high score from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("chronos_nexus_highscore");
    if (saved) setHighScore(parseInt(saved, 10));
  }, []);

  // Web Audio Synthesizer
  const playSound = useCallback((type: "shoot" | "hit" | "explosion" | "powerup" | "dash" | "timefield" | "boss") => {
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
        osc.frequency.setValueAtTime(800, now);
        osc.frequency.exponentialRampToValueAtTime(120, now + 0.08);
        gain.gain.setValueAtTime(0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.08);
        osc.start(now);
        osc.stop(now + 0.08);
      } else if (type === "hit") {
        osc.type = "square";
        osc.frequency.setValueAtTime(300, now);
        osc.frequency.exponentialRampToValueAtTime(80, now + 0.06);
        gain.gain.setValueAtTime(0.1, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.06);
        osc.start(now);
        osc.stop(now + 0.06);
      } else if (type === "explosion") {
        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(150, now);
        osc.frequency.exponentialRampToValueAtTime(30, now + 0.35);
        gain.gain.setValueAtTime(0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.35);
        osc.start(now);
        osc.stop(now + 0.35);
      } else if (type === "powerup") {
        osc.type = "sine";
        osc.frequency.setValueAtTime(400, now);
        osc.frequency.exponentialRampToValueAtTime(880, now + 0.2);
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
        osc.start(now);
        osc.stop(now + 0.2);
      } else if (type === "dash") {
        osc.type = "sine";
        osc.frequency.setValueAtTime(600, now);
        osc.frequency.exponentialRampToValueAtTime(200, now + 0.15);
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
        osc.start(now);
        osc.stop(now + 0.15);
      } else if (type === "timefield") {
        osc.type = "triangle";
        osc.frequency.setValueAtTime(200, now);
        osc.frequency.linearRampToValueAtTime(450, now + 0.3);
        gain.gain.setValueAtTime(0.25, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
        osc.start(now);
        osc.stop(now + 0.3);
      } else if (type === "boss") {
        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(100, now);
        osc.frequency.exponentialRampToValueAtTime(50, now + 0.5);
        gain.gain.setValueAtTime(0.4, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.5);
        osc.start(now);
        osc.stop(now + 0.5);
      }
    } catch {
      // Ignore audio initialization errors
    }
  }, [soundEnabled]);

  // Create floating damage text
  const addFloatingText = (text: string, x: number, y: number, color: string = "#00f0ff") => {
    floatingTextsRef.current.push({
      id: Math.random().toString(),
      text,
      x,
      y,
      color,
      alpha: 1.0,
      vy: -1.2
    });
  };

  // Spawn visual particles
  const spawnParticles = (x: number, y: number, color: string, count: number = 10, speedMult: number = 1) => {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = (Math.random() * 3 + 1) * speedMult;
      particlesRef.current.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: Math.random() * 4 + 2,
        color,
        alpha: 1,
        decay: Math.random() * 0.03 + 0.015
      });
    }
  };

  // Reset Game
  const initGame = useCallback(() => {
    const canvas = canvasRef.current;
    const width = canvas ? canvas.width : 800;
    const height = canvas ? canvas.height : 600;

    playerRef.current = {
      x: width / 2,
      y: height / 2 + 150,
      vx: 0,
      vy: 0,
      radius: 18,
      angle: 0,
      health: 100,
      maxHealth: 100,
      shield: 50,
      maxShield: 50,
      energy: 100,
      maxEnergy: 100,
      speed: 5.5,
      dashCooldown: 0,
      isDashing: false,
      dashTimer: 0,
      timeFieldActive: false,
      timeFieldEnergy: 100,
      score: 0,
      level: 1,
      xp: 0,
      nextXp: 100,
      weaponType: "pulse",
      fireRateTimer: 0
    };

    nexusCoreRef.current = {
      x: width / 2,
      y: height / 2,
      radius: 35,
      health: 250,
      maxHealth: 250,
      shield: 100,
      maxShield: 100,
      rotation: 0,
      pulseTimer: 0
    };

    bulletsRef.current = [];
    enemiesRef.current = [];
    particlesRef.current = [];
    powerUpsRef.current = [];
    floatingTextsRef.current = [];
    waveTimerRef.current = 0;
    gameTimeRef.current = 0;

    setScore(0);
    setWave(1);
    setStats({ enemiesKilled: 0, damageDealt: 0, timeSurvived: 0 });
    setGameState("playing");
  }, []);

  // Spawn wave of enemies
  const spawnWave = useCallback((currentWave: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const width = canvas.width;
    const height = canvas.height;

    const count = 5 + currentWave * 3;
    const isBossWave = currentWave % 5 === 0;

    if (isBossWave) {
      playSound("boss");
      enemiesRef.current.push({
        id: "boss_" + Math.random(),
        x: width / 2,
        y: -60,
        vx: 0,
        vy: 1,
        radius: 45,
        type: "boss",
        health: 500 + currentWave * 150,
        maxHealth: 500 + currentWave * 150,
        color: "#ff0055",
        scoreValue: 1000,
        shootTimer: 0,
        angle: 0,
        phase: 1
      });
      addFloatingText("⚠️ WARNING: CHRONOS TITAN DETECTED ⚠️", width / 2, height / 2 - 100, "#ff0055");
    }

    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const distance = Math.max(width, height) / 2 + 50;
      const x = width / 2 + Math.cos(angle) * distance;
      const y = height / 2 + Math.sin(angle) * distance;

      const types: ("scout" | "hunter" | "swarmer" | "dreadnought")[] = ["scout", "swarmer"];
      if (currentWave >= 2) types.push("hunter");
      if (currentWave >= 4) types.push("dreadnought");

      const type = types[Math.floor(Math.random() * types.length)];
      let health = 20;
      let radius = 14;
      let color = "#00f0ff";
      let scoreValue = 50;

      if (type === "hunter") {
        health = 45;
        radius = 18;
        color = "#ffaa00";
        scoreValue = 100;
      } else if (type === "swarmer") {
        health = 12;
        radius = 10;
        color = "#a855f7";
        scoreValue = 30;
      } else if (type === "dreadnought") {
        health = 120;
        radius = 28;
        color = "#ef4444";
        scoreValue = 250;
      }

      enemiesRef.current.push({
        id: Math.random().toString(),
        x,
        y,
        vx: 0,
        vy: 0,
        radius,
        type,
        health,
        maxHealth: health,
        color,
        scoreValue,
        shootTimer: Math.random() * 60,
        angle: 0
      });
    }
  }, [playSound]);

  // Main Game Loop Update
  useEffect(() => {
    let animId: number;

    const updateGame = () => {
      if (gameState !== "playing") return;

      const canvas = canvasRef.current;
      if (!canvas) return;
      const width = canvas.width;
      const height = canvas.height;

      const player = playerRef.current;
      const core = nexusCoreRef.current;
      const keys = keysRef.current;
      const mouse = mouseRef.current;

      gameTimeRef.current += 1 / 60;
      setStats((prev) => ({ ...prev, timeSurvived: Math.floor(gameTimeRef.current) }));

      // Time Dilation Slowdown Factor
      const timeSlowFactor = player.timeFieldActive ? 0.35 : 1.0;

      // Player Movement Logic
      let dx = 0;
      let dy = 0;
      if (keys["w"] || keys["W"] || keys["ArrowUp"]) dy -= 1;
      if (keys["s"] || keys["S"] || keys["ArrowDown"]) dy += 1;
      if (keys["a"] || keys["A"] || keys["ArrowLeft"]) dx -= 1;
      if (keys["d"] || keys["D"] || keys["ArrowRight"]) dx += 1;

      if (dx !== 0 && dy !== 0) {
        dx *= 0.7071;
        dy *= 0.7071;
      }

      // Handle Dash Skill
      if (player.dashCooldown > 0) player.dashCooldown--;

      if ((keys["Shift"] || keys[" "] || keys["e"] || keys["E"]) && player.dashCooldown === 0) {
        player.isDashing = true;
        player.dashTimer = 10;
        player.dashCooldown = 60; // 1 second
        playSound("dash");
        spawnParticles(player.x, player.y, "#00f0ff", 20, 2);
      }

      let currentSpeed = player.speed;
      if (player.isDashing) {
        currentSpeed *= 3.5;
        player.dashTimer--;
        if (player.dashTimer <= 0) player.isDashing = false;
      }

      player.vx = player.vx * 0.85 + dx * currentSpeed * 0.15;
      player.vy = player.vy * 0.85 + dy * currentSpeed * 0.15;

      player.x += player.vx;
      player.y += player.vy;

      // Keep player inside canvas boundaries
      player.x = Math.max(player.radius, Math.min(width - player.radius, player.x));
      player.y = Math.max(player.radius, Math.min(height - player.radius, player.y));

      // Calculate player aiming angle towards cursor
      const aimDx = mouse.x - player.x;
      const aimDy = mouse.y - player.y;
      player.angle = Math.atan2(aimDy, aimDx);

      // Handle Time-Dilation Field (Right Click or Q key)
      if ((keys["q"] || keys["Q"]) && player.energy > 0) {
        if (!player.timeFieldActive) {
          player.timeFieldActive = true;
          playSound("timefield");
        }
        player.energy = Math.max(0, player.energy - 0.5);
        if (player.energy <= 0) player.timeFieldActive = false;
      } else {
        player.timeFieldActive = false;
        player.energy = Math.min(player.maxEnergy, player.energy + 0.2); // Energy recharge
      }

      // Shield Regeneration
      if (player.shield < player.maxShield) {
        player.shield = Math.min(player.maxShield, player.shield + 0.05);
      }

      if (core.shield < core.maxShield) {
        core.shield = Math.min(core.maxShield, core.shield + 0.08);
      }

      // Player Firing Weapons
      if (player.fireRateTimer > 0) player.fireRateTimer--;

      if ((mouseRef.current as any).isPressed || keys["f"] || keys["F"]) {
        if (player.fireRateTimer <= 0) {
          playSound("shoot");

          if (player.weaponType === "pulse") {
            const spreadAngle = 0.1;
            bulletsRef.current.push({
              x: player.x + Math.cos(player.angle) * 20,
              y: player.y + Math.sin(player.angle) * 20,
              vx: Math.cos(player.angle - spreadAngle) * 12,
              vy: Math.sin(player.angle - spreadAngle) * 12,
              radius: 4,
              damage: 15,
              isEnemy: false,
              color: "#00f0ff",
              lifetime: 90
            });
            bulletsRef.current.push({
              x: player.x + Math.cos(player.angle) * 20,
              y: player.y + Math.sin(player.angle) * 20,
              vx: Math.cos(player.angle + spreadAngle) * 12,
              vy: Math.sin(player.angle + spreadAngle) * 12,
              radius: 4,
              damage: 15,
              isEnemy: false,
              color: "#00f0ff",
              lifetime: 90
            });
            player.fireRateTimer = 10;
          } else if (player.weaponType === "laser") {
            bulletsRef.current.push({
              x: player.x + Math.cos(player.angle) * 20,
              y: player.y + Math.sin(player.angle) * 20,
              vx: Math.cos(player.angle) * 18,
              vy: Math.sin(player.angle) * 18,
              radius: 6,
              damage: 35,
              isEnemy: false,
              color: "#ff00ff",
              lifetime: 70
            });
            player.fireRateTimer = 14;
          } else if (player.weaponType === "missile") {
            bulletsRef.current.push({
              x: player.x,
              y: player.y,
              vx: Math.cos(player.angle) * 8,
              vy: Math.sin(player.angle) * 8,
              radius: 6,
              damage: 45,
              isEnemy: false,
              color: "#ffaa00",
              lifetime: 120,
              homing: true
            });
            player.fireRateTimer = 22;
          }
        }
      }

      // Update Bullets
      for (let i = bulletsRef.current.length - 1; i >= 0; i--) {
        const bullet = bulletsRef.current[i];
        bullet.x += bullet.vx;
        bullet.y += bullet.vy;
        bullet.lifetime--;

        // Homing Missile Logic
        if (bullet.homing && !bullet.isEnemy) {
          let closestEnemy: Enemy | null = null;
          let minDist = Infinity;
          for (const enemy of enemiesRef.current) {
            const dist = Math.hypot(enemy.x - bullet.x, enemy.y - bullet.y);
            if (dist < minDist) {
              minDist = dist;
              closestEnemy = enemy;
            }
          }

          if (closestEnemy) {
            const targetAngle = Math.atan2(closestEnemy.y - bullet.y, closestEnemy.x - bullet.x);
            bullet.vx = bullet.vx * 0.9 + Math.cos(targetAngle) * 1.5;
            bullet.vy = bullet.vy * 0.9 + Math.sin(targetAngle) * 1.5;
          }
        }

        // Remove expired or out of bounds bullets
        if (
          bullet.lifetime <= 0 ||
          bullet.x < -20 ||
          bullet.x > width + 20 ||
          bullet.y < -20 ||
          bullet.y > height + 20
        ) {
          bulletsRef.current.splice(i, 1);
        }
      }

      // Update Core
      core.rotation += 0.01 * timeSlowFactor;
      core.pulseTimer += 0.05;

      // Update Enemies
      for (let i = enemiesRef.current.length - 1; i >= 0; i--) {
        const enemy = enemiesRef.current[i];

        // Movement towards core or player
        let targetX = core.x;
        let targetY = core.y;
        if (enemy.type === "hunter" || enemy.type === "boss") {
          targetX = player.x;
          targetY = player.y;
        }

        const angleToTarget = Math.atan2(targetY - enemy.y, targetX - enemy.x);
        enemy.angle = angleToTarget;

        let enemySpeed = 1.8;
        if (enemy.type === "swarmer") enemySpeed = 3.2;
        if (enemy.type === "dreadnought") enemySpeed = 0.9;
        if (enemy.type === "boss") enemySpeed = 0.6;

        enemy.vx = Math.cos(angleToTarget) * enemySpeed * timeSlowFactor;
        enemy.vy = Math.sin(angleToTarget) * enemySpeed * timeSlowFactor;

        enemy.x += enemy.vx;
        enemy.y += enemy.vy;

        // Enemy Shooting Logic
        enemy.shootTimer += 1 * timeSlowFactor;

        if (enemy.type === "scout" && enemy.shootTimer >= 90) {
          enemy.shootTimer = 0;
          bulletsRef.current.push({
            x: enemy.x,
            y: enemy.y,
            vx: Math.cos(angleToTarget) * 5,
            vy: Math.sin(angleToTarget) * 5,
            radius: 4,
            damage: 10,
            isEnemy: true,
            color: "#ff0055",
            lifetime: 180
          });
        } else if (enemy.type === "hunter" && enemy.shootTimer >= 60) {
          enemy.shootTimer = 0;
          bulletsRef.current.push({
            x: enemy.x,
            y: enemy.y,
            vx: Math.cos(angleToTarget) * 7,
            vy: Math.sin(angleToTarget) * 7,
            radius: 5,
            damage: 15,
            isEnemy: true,
            color: "#ffaa00",
            lifetime: 150
          });
        } else if (enemy.type === "dreadnought" && enemy.shootTimer >= 100) {
          enemy.shootTimer = 0;
          for (let a = -0.3; a <= 0.3; a += 0.3) {
            bulletsRef.current.push({
              x: enemy.x,
              y: enemy.y,
              vx: Math.cos(angleToTarget + a) * 6,
              vy: Math.sin(angleToTarget + a) * 6,
              radius: 6,
              damage: 20,
              isEnemy: true,
              color: "#ef4444",
              lifetime: 160
            });
          }
        } else if (enemy.type === "boss" && enemy.shootTimer >= 45) {
          enemy.shootTimer = 0;
          const ringCount = 8;
          for (let r = 0; r < ringCount; r++) {
            const fireAngle = enemy.angle + (r * Math.PI * 2) / ringCount;
            bulletsRef.current.push({
              x: enemy.x,
              y: enemy.y,
              vx: Math.cos(fireAngle) * 5,
              vy: Math.sin(fireAngle) * 5,
              radius: 6,
              damage: 25,
              isEnemy: true,
              color: "#ff0055",
              lifetime: 200
            });
          }
        }

        // Enemy Collision with Nexus Core
        const distToCore = Math.hypot(core.x - enemy.x, core.y - enemy.y);
        if (distToCore < core.radius + enemy.radius) {
          playSound("hit");
          spawnParticles(enemy.x, enemy.y, enemy.color, 15);

          let coreDmg = enemy.type === "boss" ? 50 : 20;
          if (core.shield > 0) {
            const absorbed = Math.min(core.shield, coreDmg);
            core.shield -= absorbed;
            coreDmg -= absorbed;
          }
          if (coreDmg > 0) {
            core.health -= coreDmg;
          }

          if (enemy.type !== "boss") {
            enemiesRef.current.splice(i, 1);
            continue;
          }
        }

        // Enemy Collision with Player
        const distToPlayer = Math.hypot(player.x - enemy.x, player.y - enemy.y);
        if (distToPlayer < player.radius + enemy.radius && !player.isDashing) {
          playSound("hit");
          spawnParticles(player.x, player.y, "#ff0055", 15);

          let pDmg = enemy.type === "boss" ? 35 : 15;
          if (player.shield > 0) {
            const absorbed = Math.min(player.shield, pDmg);
            player.shield -= absorbed;
            pDmg -= absorbed;
          }
          if (pDmg > 0) {
            player.health -= pDmg;
          }

          if (enemy.type !== "boss") {
            enemiesRef.current.splice(i, 1);
            continue;
          }
        }
      }

      // Check Bullet Collisions
      for (let b = bulletsRef.current.length - 1; b >= 0; b--) {
        const bullet = bulletsRef.current[b];

        if (bullet.isEnemy) {
          // Check collision with Player
          const distPlayer = Math.hypot(player.x - bullet.x, player.y - bullet.y);
          if (distPlayer < player.radius + bullet.radius && !player.isDashing) {
            playSound("hit");
            spawnParticles(bullet.x, bullet.y, bullet.color, 6);

            let damage = bullet.damage;
            if (player.shield > 0) {
              const absorbed = Math.min(player.shield, damage);
              player.shield -= absorbed;
              damage -= absorbed;
            }
            if (damage > 0) {
              player.health -= damage;
            }

            bulletsRef.current.splice(b, 1);
            continue;
          }

          // Check collision with Core
          const distCore = Math.hypot(core.x - bullet.x, core.y - bullet.y);
          if (distCore < core.radius + bullet.radius) {
            playSound("hit");
            spawnParticles(bullet.x, bullet.y, bullet.color, 6);

            let damage = bullet.damage;
            if (core.shield > 0) {
              const absorbed = Math.min(core.shield, damage);
              core.shield -= absorbed;
              damage -= absorbed;
            }
            if (damage > 0) {
              core.health -= damage;
            }

            bulletsRef.current.splice(b, 1);
            continue;
          }
        } else {
          // Player Bullet hitting Enemy
          for (let e = enemiesRef.current.length - 1; e >= 0; e--) {
            const enemy = enemiesRef.current[e];
            const distEnemy = Math.hypot(enemy.x - bullet.x, enemy.y - bullet.y);

            if (distEnemy < enemy.radius + bullet.radius) {
              playSound("hit");
              spawnParticles(bullet.x, bullet.y, "#00f0ff", 8);
              addFloatingText(`-${bullet.damage}`, enemy.x, enemy.y - 10, "#00f0ff");

              enemy.health -= bullet.damage;
              setStats((prev) => ({ ...prev, damageDealt: prev.damageDealt + bullet.damage }));

              // Enemy Destroyed
              if (enemy.health <= 0) {
                playSound("explosion");
                spawnParticles(enemy.x, enemy.y, enemy.color, 25, 1.5);
                
                player.score += enemy.scoreValue;
                setScore(player.score);
                setStats((prev) => ({ ...prev, enemiesKilled: prev.enemiesKilled + 1 }));

                // Spawn Power-up drop chance (20%)
                if (Math.random() < 0.2) {
                  const pTypes: ("health" | "shield" | "energy" | "upgrade")[] = ["health", "shield", "energy"];
                  if (Math.random() < 0.05) pTypes.push("upgrade");
                  powerUpsRef.current.push({
                    x: enemy.x,
                    y: enemy.y,
                    type: pTypes[Math.floor(Math.random() * pTypes.length)],
                    radius: 10,
                    pulse: 0
                  });
                }

                enemiesRef.current.splice(e, 1);
              }

              bulletsRef.current.splice(b, 1);
              break;
            }
          }
        }
      }

      // Update Power-ups
      for (let p = powerUpsRef.current.length - 1; p >= 0; p--) {
        const powerUp = powerUpsRef.current[p];
        powerUp.pulse += 0.1;

        const dist = Math.hypot(player.x - powerUp.x, player.y - powerUp.y);
        if (dist < player.radius + powerUp.radius) {
          playSound("powerup");
          if (powerUp.type === "health") {
            player.health = Math.min(player.maxHealth, player.health + 25);
            addFloatingText("+25 HP", player.x, player.y - 15, "#22c55e");
          } else if (powerUp.type === "shield") {
            player.shield = Math.min(player.maxShield, player.shield + 30);
            addFloatingText("+30 Shield", player.x, player.y - 15, "#3b82f6");
          } else if (powerUp.type === "energy") {
            player.energy = Math.min(player.maxEnergy, player.energy + 40);
            addFloatingText("+40 Energy", player.x, player.y - 15, "#a855f7");
          } else if (powerUp.type === "upgrade") {
            player.weaponType = player.weaponType === "pulse" ? "laser" : "missile";
            addFloatingText("WEAPON UPGRADE!", player.x, player.y - 15, "#eab308");
          }

          powerUpsRef.current.splice(p, 1);
        }
      }

      // Update Particles
      for (let i = particlesRef.current.length - 1; i >= 0; i--) {
        const particle = particlesRef.current[i];
        particle.x += particle.vx;
        particle.y += particle.vy;
        particle.alpha -= particle.decay;
        if (particle.alpha <= 0) {
          particlesRef.current.splice(i, 1);
        }
      }

      // Update Floating Text
      for (let i = floatingTextsRef.current.length - 1; i >= 0; i--) {
        const ft = floatingTextsRef.current[i];
        ft.y += ft.vy;
        ft.alpha -= 0.02;
        if (ft.alpha <= 0) {
          floatingTextsRef.current.splice(i, 1);
        }
      }

      // Check Wave Completion
      if (enemiesRef.current.length === 0) {
        waveTimerRef.current++;
        if (waveTimerRef.current > 120) {
          waveTimerRef.current = 0;
          const nextWave = wave + 1;
          setWave(nextWave);

          // Every 3 waves, trigger Upgrade Selection Modal
          if (nextWave % 3 === 0) {
            // Shuffle upgrade options
            const shuffled = [...UPGRADE_POOL].sort(() => 0.5 - Math.random()).slice(0, 3);
            setActiveUpgrades(shuffled);
            setGameState("upgrade");
          } else {
            spawnWave(nextWave);
          }
        }
      }

      // Game Over Check
      if (player.health <= 0 || core.health <= 0) {
        playSound("explosion");
        setGameState("gameover");
        if (player.score > highScore) {
          setHighScore(player.score);
          localStorage.setItem("chronos_nexus_highscore", player.score.toString());
        }
      }

      // RENDER CANVAS
      const ctx = canvas.getContext("2d");
      if (ctx) {
        // Clear screen with neon space dark background
        ctx.fillStyle = "#090d16";
        ctx.fillRect(0, 0, width, height);

        // Draw parallax grid lines
        ctx.strokeStyle = player.timeFieldActive ? "rgba(168, 85, 247, 0.15)" : "rgba(0, 240, 255, 0.06)";
        ctx.lineWidth = 1;
        const gridSize = 40;
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

        // Draw Time Dilation Overlay
        if (player.timeFieldActive) {
          ctx.fillStyle = "rgba(168, 85, 247, 0.08)";
          ctx.fillRect(0, 0, width, height);
        }

        // Render Nexus Core
        ctx.save();
        ctx.translate(core.x, core.y);
        ctx.rotate(core.rotation);

        // Core Shield Ring
        if (core.shield > 0) {
          ctx.beginPath();
          ctx.arc(0, 0, core.radius + 8, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(59, 130, 246, ${core.shield / core.maxShield})`;
          ctx.lineWidth = 3;
          ctx.stroke();
        }

        // Core Glow & Body
        ctx.shadowColor = "#00f0ff";
        ctx.shadowBlur = 20;
        ctx.fillStyle = "#00f0ff";
        ctx.beginPath();
        ctx.arc(0, 0, core.radius, 0, Math.PI * 2);
        ctx.fill();

        // Inner Core Ring
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(0, 0, core.radius - 10, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();

        // Render Power-ups
        for (const powerUp of powerUpsRef.current) {
          ctx.save();
          ctx.translate(powerUp.x, powerUp.y);
          const pScale = 1 + Math.sin(powerUp.pulse) * 0.15;
          ctx.scale(pScale, pScale);

          let pColor = "#22c55e";
          if (powerUp.type === "shield") pColor = "#3b82f6";
          if (powerUp.type === "energy") pColor = "#a855f7";
          if (powerUp.type === "upgrade") pColor = "#eab308";

          ctx.shadowColor = pColor;
          ctx.shadowBlur = 12;
          ctx.fillStyle = pColor;
          ctx.beginPath();
          ctx.arc(0, 0, powerUp.radius, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }

        // Render Enemies
        for (const enemy of enemiesRef.current) {
          ctx.save();
          ctx.translate(enemy.x, enemy.y);
          ctx.rotate(enemy.angle);

          ctx.shadowColor = enemy.color;
          ctx.shadowBlur = 10;
          ctx.fillStyle = enemy.color;

          if (enemy.type === "scout") {
            ctx.beginPath();
            ctx.moveTo(enemy.radius, 0);
            ctx.lineTo(-enemy.radius, -enemy.radius * 0.7);
            ctx.lineTo(-enemy.radius, enemy.radius * 0.7);
            ctx.closePath();
            ctx.fill();
          } else if (enemy.type === "swarmer") {
            ctx.beginPath();
            ctx.arc(0, 0, enemy.radius, 0, Math.PI * 2);
            ctx.fill();
          } else if (enemy.type === "hunter" || enemy.type === "dreadnought" || enemy.type === "boss") {
            ctx.beginPath();
            ctx.rect(-enemy.radius, -enemy.radius, enemy.radius * 2, enemy.radius * 2);
            ctx.fill();
          }

          // Enemy Health Bar
          if (enemy.health < enemy.maxHealth) {
            ctx.rotate(-enemy.angle);
            ctx.fillStyle = "rgba(0, 0, 0, 0.6)";
            ctx.fillRect(-enemy.radius, -enemy.radius - 12, enemy.radius * 2, 4);
            ctx.fillStyle = enemy.color;
            ctx.fillRect(
              -enemy.radius,
              -enemy.radius - 12,
              (enemy.radius * 2 * enemy.health) / enemy.maxHealth,
              4
            );
          }

          ctx.restore();
        }

        // Render Bullets
        for (const bullet of bulletsRef.current) {
          ctx.save();
          ctx.shadowColor = bullet.color;
          ctx.shadowBlur = 8;
          ctx.fillStyle = bullet.color;
          ctx.beginPath();
          ctx.arc(bullet.x, bullet.y, bullet.radius, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }

        // Render Player
        ctx.save();
        ctx.translate(player.x, player.y);
        ctx.rotate(player.angle);

        // Player Engine Flame Particle Trail
        if (dx !== 0 || dy !== 0) {
          ctx.fillStyle = "#ffaa00";
          ctx.beginPath();
          ctx.moveTo(-player.radius, -5);
          ctx.lineTo(-player.radius - 12 - Math.random() * 6, 0);
          ctx.lineTo(-player.radius, 5);
          ctx.fill();
        }

        // Player Shield Barrier
        if (player.shield > 0) {
          ctx.beginPath();
          ctx.arc(0, 0, player.radius + 6, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(0, 240, 255, ${player.shield / player.maxShield})`;
          ctx.lineWidth = 2;
          ctx.stroke();
        }

        // Player Mech Interceptor Triangle Shape
        ctx.shadowColor = "#00f0ff";
        ctx.shadowBlur = 15;
        ctx.fillStyle = player.isDashing ? "#ffffff" : "#00f0ff";
        ctx.beginPath();
        ctx.moveTo(player.radius + 4, 0);
        ctx.lineTo(-player.radius + 4, -player.radius + 2);
        ctx.lineTo(-player.radius + 8, 0);
        ctx.lineTo(-player.radius + 4, player.radius - 2);
        ctx.closePath();
        ctx.fill();

        ctx.restore();

        // Render Visual Particles
        for (const particle of particlesRef.current) {
          ctx.save();
          ctx.globalAlpha = particle.alpha;
          ctx.fillStyle = particle.color;
          ctx.beginPath();
          ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }

        // Render Floating Texts
        for (const ft of floatingTextsRef.current) {
          ctx.save();
          ctx.globalAlpha = ft.alpha;
          ctx.fillStyle = ft.color;
          ctx.font = "bold 14px sans-serif";
          ctx.fillText(ft.text, ft.x, ft.y);
          ctx.restore();
        }
      }

      animId = requestAnimationFrame(updateGame);
    };

    animId = requestAnimationFrame(updateGame);
    return () => cancelAnimationFrame(animId);
  }, [gameState, wave, spawnWave, playSound]);

  // Handle Event Listeners for Keyboard & Mouse Controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      keysRef.current[e.key] = true;
      if (e.key === "p" || e.key === "P" || e.key === "Escape") {
        setGameState((prev) => (prev === "playing" ? "paused" : prev === "paused" ? "playing" : prev));
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      keysRef.current[e.key] = false;
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!canvasRef.current) return;
      const rect = canvasRef.current.getBoundingClientRect();
      mouseRef.current.x = e.clientX - rect.left;
      mouseRef.current.y = e.clientY - rect.top;
    };

    const handleMouseDown = () => {
      (mouseRef.current as any).isPressed = true;
    };

    const handleMouseUp = () => {
      (mouseRef.current as any).isPressed = false;
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

  // Handle Canvas Resizing
  useEffect(() => {
    const handleResize = () => {
      if (canvasRef.current) {
        const parent = canvasRef.current.parentElement;
        if (parent) {
          canvasRef.current.width = parent.clientWidth;
          canvasRef.current.height = Math.min(window.innerHeight * 0.75, 680);
        }
      }
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Select Upgrade Perk
  const handleSelectUpgrade = (upgrade: UpgradeOption) => {
    upgrade.effect(playerRef.current, nexusCoreRef.current);
    spawnWave(wave);
    setGameState("playing");
  };

  return (
    <div className="relative w-full max-w-6xl mx-auto flex flex-col items-center justify-center p-4 min-h-screen bg-slate-950 text-white font-sans select-none">
      
      {/* Top Header HUD Bar */}
      <div className="w-full flex items-center justify-between bg-slate-900/80 backdrop-blur-md border border-cyan-500/30 rounded-xl p-4 mb-4 shadow-lg shadow-cyan-500/10">
        <div className="flex items-center space-x-6">
          <div className="flex items-center space-x-2">
            <Crosshair className="w-6 h-6 text-cyan-400 animate-pulse" />
            <h1 className="text-xl font-bold bg-gradient-to-r from-cyan-400 via-sky-400 to-purple-500 bg-clip-text text-transparent tracking-wide">
              CHRONOS NEXUS OVERDRIVE
            </h1>
          </div>

          <div className="flex items-center space-x-4 text-sm font-semibold">
            <span className="bg-cyan-950/80 text-cyan-300 px-3 py-1 rounded-lg border border-cyan-800">
              WAVE {wave}
            </span>
            <span className="bg-purple-950/80 text-purple-300 px-3 py-1 rounded-lg border border-purple-800">
              SCORE: {score.toLocaleString()}
            </span>
            <span className="bg-amber-950/80 text-amber-300 px-3 py-1 rounded-lg border border-amber-800">
              HIGH: {highScore.toLocaleString()}
            </span>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="p-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-cyan-400 border border-slate-700 transition"
          >
            {soundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5 text-red-400" />}
          </button>
          
          {gameState === "playing" && (
            <button
              onClick={() => setGameState("paused")}
              className="p-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-cyan-400 border border-slate-700 transition"
            >
              <Pause className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* Main Game Viewport Container */}
      <div className="relative w-full overflow-hidden rounded-2xl border border-cyan-500/40 bg-slate-900 shadow-2xl shadow-cyan-950/50">
        <canvas ref={canvasRef} className="w-full h-[620px] block cursor-crosshair" />

        {/* Floating Controls HUD Overlay */}
        {gameState === "playing" && (
          <div className="absolute top-4 left-4 flex flex-col space-y-2 pointer-events-none">
            {/* Player Hull & Shield Bar */}
            <div className="flex flex-col bg-slate-950/80 p-2.5 rounded-lg border border-cyan-500/20 backdrop-blur w-52">
              <div className="flex justify-between text-xs text-cyan-300 font-bold mb-1">
                <span>HULL INTEGRITY</span>
                <span>{Math.ceil(playerRef.current.health)} / {playerRef.current.maxHealth}</span>
              </div>
              <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden mb-1">
                <div
                  className="h-full bg-gradient-to-r from-red-500 to-green-400 transition-all duration-200"
                  style={{ width: `${Math.max(0, (playerRef.current.health / playerRef.current.maxHealth) * 100)}%` }}
                />
              </div>

              <div className="flex justify-between text-xs text-cyan-300 font-bold mb-1">
                <span>SHIELD MATRIX</span>
                <span>{Math.ceil(playerRef.current.shield)} / {playerRef.current.maxShield}</span>
              </div>
              <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-cyan-400 transition-all duration-200"
                  style={{ width: `${Math.max(0, (playerRef.current.shield / playerRef.current.maxShield) * 100)}%` }}
                />
              </div>
            </div>

            {/* Nexus Core Status Bar */}
            <div className="flex flex-col bg-slate-950/80 p-2.5 rounded-lg border border-purple-500/20 backdrop-blur w-52">
              <div className="flex justify-between text-xs text-purple-300 font-bold mb-1">
                <span>NEXUS CORE</span>
                <span>{Math.ceil(nexusCoreRef.current.health)} / {nexusCoreRef.current.maxHealth}</span>
              </div>
              <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-200"
                  style={{ width: `${Math.max(0, (nexusCoreRef.current.health / nexusCoreRef.current.maxHealth) * 100)}%` }}
                />
              </div>
            </div>
          </div>
        )}

        {/* Start / Menu Modal */}
        {gameState === "menu" && (
          <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center z-20">
            <div className="p-4 bg-cyan-500/10 rounded-full border border-cyan-400/30 mb-4 animate-bounce">
              <Sparkles className="w-12 h-12 text-cyan-400" />
            </div>
            <h2 className="text-4xl font-extrabold tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-sky-300 to-purple-500 mb-3">
              CHRONOS NEXUS OVERDRIVE
            </h2>
            <p className="text-slate-300 max-w-lg mb-6 leading-relaxed">
              Defend the central Chronos Nexus Core from invading rogue AI dreadnought armadas! Deploy tactical time-dilation fields, execute tachyon dashes, and upgrade your interceptor mech.
            </p>

            <div className="grid grid-cols-2 gap-4 text-left max-w-md w-full mb-8 bg-slate-900/80 p-4 rounded-xl border border-slate-800 text-xs text-slate-300">
              <div><span className="text-cyan-400 font-bold">WASD / ARROWS</span> : Move</div>
              <div><span className="text-cyan-400 font-bold">MOUSE AIM + CLICK</span> : Shoot</div>
              <div><span className="text-cyan-400 font-bold">SHIFT / SPACE</span> : Tachyon Dash</div>
              <div><span className="text-cyan-400 font-bold">Q KEY</span> : Time-Dilation Field</div>
            </div>

            <button
              onClick={initGame}
              className="px-8 py-3.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold rounded-xl shadow-lg shadow-cyan-500/25 transition transform hover:scale-105 flex items-center space-x-2"
            >
              <Play className="w-5 h-5 fill-current" />
              <span>LAUNCH MISSION</span>
            </button>
          </div>
        )}

        {/* Upgrade Selection Modal */}
        {gameState === "upgrade" && (
          <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center z-20">
            <h2 className="text-3xl font-extrabold text-cyan-400 mb-2">TACTICAL MATRIX UPGRADE</h2>
            <p className="text-slate-300 mb-6 text-sm">Select an enhancement for your interceptor & Nexus Core</p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-3xl w-full">
              {activeUpgrades.map((upgrade) => (
                <div
                  key={upgrade.id}
                  onClick={() => handleSelectUpgrade(upgrade)}
                  className="p-5 bg-slate-900/90 hover:bg-slate-800 border border-cyan-500/30 hover:border-cyan-400 rounded-xl cursor-pointer transition transform hover:-translate-y-1 text-left flex flex-col justify-between"
                >
                  <div>
                    <div className="w-10 h-10 bg-cyan-950 rounded-lg flex items-center justify-center border border-cyan-800 text-cyan-400 mb-3">
                      <Sparkles className="w-5 h-5" />
                    </div>
                    <h3 className="text-lg font-bold text-white mb-2">{upgrade.title}</h3>
                    <p className="text-xs text-slate-400 leading-relaxed">{upgrade.description}</p>
                  </div>
                  <button className="mt-4 w-full py-2 bg-cyan-950 hover:bg-cyan-900 text-cyan-300 font-semibold rounded-lg border border-cyan-700/50 text-xs transition">
                    INSTALL UPGRADE
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Pause Modal */}
        {gameState === "paused" && (
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center z-20">
            <h2 className="text-3xl font-bold text-cyan-400 mb-4">TACTICAL PAUSE</h2>
            <div className="flex space-x-4">
              <button
                onClick={() => setGameState("playing")}
                className="px-6 py-2.5 bg-cyan-600 hover:bg-cyan-500 font-bold rounded-lg transition"
              >
                RESUME
              </button>
              <button
                onClick={initGame}
                className="px-6 py-2.5 bg-slate-800 hover:bg-slate-700 font-bold rounded-lg transition"
              >
                RESTART
              </button>
            </div>
          </div>
        )}

        {/* Game Over Modal */}
        {gameState === "gameover" && (
          <div className="absolute inset-0 bg-slate-950/95 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center z-20">
            <div className="p-4 bg-red-500/10 rounded-full border border-red-500/30 mb-3">
              <Flame className="w-10 h-10 text-red-500" />
            </div>
            <h2 className="text-3xl font-extrabold text-red-500 mb-2">MISSION FAILED</h2>
            <p className="text-slate-400 text-sm mb-6">The Chronos Nexus Core has been compromised.</p>

            <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 max-w-sm w-full mb-6 text-sm space-y-2">
              <div className="flex justify-between text-slate-300">
                <span>FINAL SCORE:</span>
                <span className="font-bold text-cyan-400">{score.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>WAVES CLEARED:</span>
                <span className="font-bold text-purple-400">{wave}</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>ENEMIES DESTROYED:</span>
                <span className="font-bold text-amber-400">{stats.enemiesKilled}</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>SURVIVAL TIME:</span>
                <span className="font-bold text-green-400">{stats.timeSurvived}s</span>
              </div>
            </div>

            <button
              onClick={initGame}
              className="px-8 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold rounded-xl shadow-lg transition transform hover:scale-105 flex items-center space-x-2"
            >
              <RotateCcw className="w-5 h-5" />
              <span>REDEPLOY INTERCEPTOR</span>
            </button>
          </div>
        )}
      </div>

      {/* Footer Info */}
      <div className="w-full mt-4 flex items-center justify-between text-xs text-slate-500">
        <div>Chronos Nexus Overdrive v1.0 • Xakteir Game Engine</div>
        <div>Built for Antigravity Platform</div>
      </div>
    </div>
  );
}
