"use client";

import React, { useEffect, useRef, useState } from "react";
import {
  Play,
  Pause,
  RotateCcw,
  Volume2,
  VolumeX,
  Shield,
  Zap,
  Sparkles,
  Trophy,
  Clock,
  Crosshair,
  Award,
  ShoppingCart,
  Maximize,
  ArrowLeft,
  ChevronRight
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
  hp: number;
  maxHp: number;
  shield: number;
  maxShield: number;
  energy: number;
  maxEnergy: number;
  score: number;
  credits: number;
  kills: number;
  wave: number;
  selectedWeapon: number;
  dashCooldown: number;
  timeFreezeTimer: number;
  invulnerableTimer: number;
}

interface Weapon {
  name: string;
  damage: number;
  fireRate: number; // ms
  energyCost: number;
  speed: number;
  count: number;
  spread: number;
  color: string;
  unlocked: boolean;
  cost: number;
}

interface Bullet {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  damage: number;
  color: string;
  radius: number;
  isEnemy: boolean;
  life: number;
}

interface Enemy {
  id: string;
  type: "swarmer" | "sentinel" | "titan" | "phantom" | "boss";
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  hp: number;
  maxHp: number;
  speed: number;
  damage: number;
  color: string;
  shootCooldown: number;
  scoreValue: number;
  creditValue: number;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
  alpha: number;
  decay: number;
}

interface PowerUp {
  id: string;
  type: "health" | "shield" | "timeFreeze" | "energy" | "quadDamage";
  x: number;
  y: number;
  radius: number;
  duration: number;
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

interface UpgradeItem {
  id: string;
  name: string;
  level: number;
  maxLevel: number;
  cost: number;
  description: string;
}

// Web Audio Sound Engine
class SoundSynth {
  private ctx: AudioContext | null = null;
  public enabled: boolean = true;

  private init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) this.ctx = new AudioCtx();
    }
  }

  playShoot() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(800, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(100, this.ctx.currentTime + 0.1);

    gain.gain.setValueAtTime(0.15, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.1);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.1);
  }

  playExplosion() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = "square";
    osc.frequency.setValueAtTime(120, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(20, this.ctx.currentTime + 0.3);

    gain.gain.setValueAtTime(0.3, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.3);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.3);
  }

  playPowerup() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(400, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(1200, this.ctx.currentTime + 0.25);

    gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.25);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.25);
  }

  playTimeFreeze() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(900, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(150, this.ctx.currentTime + 0.5);

    gain.gain.setValueAtTime(0.3, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.5);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.5);
  }
}

const audioSynth = new SoundSynth();

export default function ChronoVanguardGame() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Game States
  const [gameState, setGameState] = useState<"menu" | "playing" | "paused" | "shop" | "gameover">("menu");
  const [highScore, setHighScore] = useState<number>(0);
  const [soundMuted, setSoundMuted] = useState<boolean>(false);
  const [waveCount, setWaveCount] = useState<number>(1);
  const [waveBanner, setWaveBanner] = useState<string | null>(null);

  // Stats for UI
  const [playerStats, setPlayerStats] = useState<{
    hp: number;
    maxHp: number;
    shield: number;
    maxShield: number;
    energy: number;
    maxEnergy: number;
    score: number;
    credits: number;
    wave: number;
    kills: number;
    timeFreeze: number;
  }>({
    hp: 100,
    maxHp: 100,
    shield: 50,
    maxShield: 50,
    energy: 100,
    maxEnergy: 100,
    score: 0,
    credits: 0,
    wave: 1,
    kills: 0,
    timeFreeze: 0
  });

  // Upgrades
  const [upgrades, setUpgrades] = useState<UpgradeItem[]>([
    { id: "maxHp", name: "Nano Armor", level: 1, maxLevel: 5, cost: 150, description: "+25 Max Health" },
    { id: "shield", name: "Aegis Shielding", level: 1, maxLevel: 5, cost: 200, description: "+20 Max Shield" },
    { id: "energyRegen", name: "Tachyon Core", level: 1, maxLevel: 5, cost: 180, description: "+25% Energy Regen Speed" },
    { id: "damage", name: "Plasma Charge", level: 1, maxLevel: 5, cost: 250, description: "+15% All Weapons Damage" },
    { id: "speed", name: "Thrust Vectoring", level: 1, maxLevel: 5, cost: 120, description: "+10% Movement Speed" }
  ]);

  // Weapons State
  const [weapons, setWeapons] = useState<Weapon[]>([
    { name: "Pulse Cannon", damage: 18, fireRate: 150, energyCost: 2, speed: 14, count: 1, spread: 0, color: "#00f0ff", unlocked: true, cost: 0 },
    { name: "Dual Plasma", damage: 24, fireRate: 220, energyCost: 5, speed: 13, count: 2, spread: 0.15, color: "#ff0077", unlocked: false, cost: 300 },
    { name: "Spread Shotgun", damage: 16, fireRate: 400, energyCost: 12, speed: 11, count: 5, spread: 0.35, color: "#ffaa00", unlocked: false, cost: 600 },
    { name: "Tachyon Beam", damage: 55, fireRate: 500, energyCost: 20, speed: 20, count: 1, spread: 0, color: "#a855f7", unlocked: false, cost: 1000 }
  ]);
  const [activeWeaponIndex, setActiveWeaponIndex] = useState<number>(0);

  // References for live Game Loop
  const keysRef = useRef<{ [key: string]: boolean }>({});
  const mousePosRef = useRef<Vector2D>({ x: 0, y: 0 });
  const isMouseDownRef = useRef<boolean>(false);
  const lastShotTimeRef = useRef<number>(0);

  const playerRef = useRef<Player>({
    x: 400,
    y: 300,
    vx: 0,
    vy: 0,
    radius: 16,
    angle: 0,
    hp: 100,
    maxHp: 100,
    shield: 50,
    maxShield: 50,
    energy: 100,
    maxEnergy: 100,
    score: 0,
    credits: 0,
    kills: 0,
    wave: 1,
    selectedWeapon: 0,
    dashCooldown: 0,
    timeFreezeTimer: 0,
    invulnerableTimer: 0
  });

  const bulletsRef = useRef<Bullet[]>([]);
  const enemiesRef = useRef<Enemy[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const powerUpsRef = useRef<PowerUp[]>([]);
  const floatingTextsRef = useRef<FloatingText[]>([]);
  const animationFrameRef = useRef<number | null>(null);

  // Load High Score
  useEffect(() => {
    const savedScore = localStorage.getItem("chrono_vanguard_highscore");
    if (savedScore) {
      setHighScore(parseInt(savedScore, 10));
    }
  }, []);

  // Sync sound toggle
  useEffect(() => {
    audioSynth.enabled = !soundMuted;
  }, [soundMuted]);

  // Key event listeners
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      keysRef.current[e.code] = true;

      // Quick Weapon Switching
      if (e.code === "Digit1") setActiveWeaponIndex(0);
      if (e.code === "Digit2" && weapons[1]?.unlocked) setActiveWeaponIndex(1);
      if (e.code === "Digit3" && weapons[2]?.unlocked) setActiveWeaponIndex(2);
      if (e.code === "Digit4" && weapons[3]?.unlocked) setActiveWeaponIndex(3);

      // Dash / Ability
      if (e.code === "Space" && gameState === "playing") {
        performDash();
      }

      // Time Freeze
      if ((e.code === "KeyE" || e.code === "ShiftLeft") && gameState === "playing") {
        activateTimeFreeze();
      }

      // Pause toggle
      if (e.code === "KeyP" || e.code === "Escape") {
        setGameState(prev => (prev === "playing" ? "paused" : prev === "paused" ? "playing" : prev));
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
  }, [gameState, weapons]);

  // Mouse & Touch listeners on Canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const updateMousePos = (clientX: number, clientY: number) => {
      const rect = canvas.getBoundingClientRect();
      mousePosRef.current = {
        x: clientX - rect.left,
        y: clientY - rect.top
      };
    };

    const handleMouseMove = (e: MouseEvent) => {
      updateMousePos(e.clientX, e.clientY);
    };

    const handleMouseDown = (e: MouseEvent) => {
      if (e.button === 0) {
        isMouseDownRef.current = true;
      }
    };

    const handleMouseUp = (e: MouseEvent) => {
      if (e.button === 0) {
        isMouseDownRef.current = false;
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        updateMousePos(e.touches[0].clientX, e.touches[0].clientY);
      }
    };

    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        updateMousePos(e.touches[0].clientX, e.touches[0].clientY);
        isMouseDownRef.current = true;
      }
    };

    const handleTouchEnd = () => {
      isMouseDownRef.current = false;
    };

    canvas.addEventListener("mousemove", handleMouseMove);
    canvas.addEventListener("mousedown", handleMouseDown);
    window.addEventListener("mouseup", handleMouseUp);

    canvas.addEventListener("touchmove", handleTouchMove, { passive: true });
    canvas.addEventListener("touchstart", handleTouchStart, { passive: true });
    canvas.addEventListener("touchend", handleTouchEnd);

    return () => {
      canvas.removeEventListener("mousemove", handleMouseMove);
      canvas.removeEventListener("mousedown", handleMouseDown);
      window.removeEventListener("mouseup", handleMouseUp);
      canvas.removeEventListener("touchmove", handleTouchMove);
      canvas.removeEventListener("touchstart", handleTouchStart);
      canvas.removeEventListener("touchend", handleTouchEnd);
    };
  }, []);

  // Reset Game
  const startNewGame = () => {
    const p = playerRef.current;
    p.x = 400;
    p.y = 300;
    p.vx = 0;
    p.vy = 0;
    p.hp = 100;
    p.maxHp = 100;
    p.shield = 50;
    p.maxShield = 50;
    p.energy = 100;
    p.maxEnergy = 100;
    p.score = 0;
    p.credits = 100;
    p.kills = 0;
    p.wave = 1;
    p.timeFreezeTimer = 0;
    p.invulnerableTimer = 0;

    bulletsRef.current = [];
    enemiesRef.current = [];
    particlesRef.current = [];
    powerUpsRef.current = [];
    floatingTextsRef.current = [];

    setWaveCount(1);
    setActiveWeaponIndex(0);
    setGameState("playing");
    spawnWave(1);
  };

  // Perform Dash Ability
  const performDash = () => {
    const p = playerRef.current;
    if (p.dashCooldown > 0 || p.energy < 20) return;

    p.energy -= 20;
    p.dashCooldown = 60; // 1 sec at 60fps
    p.invulnerableTimer = 20;

    const dashSpeed = 16;
    p.vx = Math.cos(p.angle) * dashSpeed;
    p.vy = Math.sin(p.angle) * dashSpeed;

    // Create Dash particles
    for (let i = 0; i < 15; i++) {
      particlesRef.current.push({
        x: p.x,
        y: p.y,
        vx: (Math.random() - 0.5) * 6,
        vy: (Math.random() - 0.5) * 6,
        radius: Math.random() * 4 + 2,
        color: "#00f0ff",
        alpha: 1,
        decay: 0.05
      });
    }

    addFloatingText("TACTICAL DASH!", p.x, p.y - 20, "#00f0ff");
    audioSynth.playPowerup();
  };

  // Activate Time Freeze Ability
  const activateTimeFreeze = () => {
    const p = playerRef.current;
    if (p.energy < 40 || p.timeFreezeTimer > 0) return;

    p.energy -= 40;
    p.timeFreezeTimer = 300; // 5 seconds at 60fps
    addFloatingText("TEMPORAL DILATION!", p.x, p.y - 30, "#a855f7");
    audioSynth.playTimeFreeze();
  };

  // Floating text helper
  const addFloatingText = (text: string, x: number, y: number, color: string = "#ffffff") => {
    floatingTextsRef.current.push({
      id: Math.random().toString(),
      text,
      x,
      y,
      color,
      alpha: 1,
      vy: -1.2
    });
  };

  // Wave Spawner Engine
  const spawnWave = (wave: number) => {
    setWaveBanner(`WAVE ${wave} INCOMING`);
    setTimeout(() => setWaveBanner(null), 2500);

    const canvas = canvasRef.current;
    const width = canvas ? canvas.width : 800;
    const height = canvas ? canvas.height : 600;

    const enemyCount = 6 + wave * 4;

    for (let i = 0; i < enemyCount; i++) {
      // Spawn around screen edges
      let x = 0, y = 0;
      if (Math.random() < 0.5) {
        x = Math.random() < 0.5 ? -30 : width + 30;
        y = Math.random() * height;
      } else {
        x = Math.random() * width;
        y = Math.random() < 0.5 ? -30 : height + 30;
      }

      const roll = Math.random();
      let type: "swarmer" | "sentinel" | "titan" | "phantom" = "swarmer";
      let hp = 30 + wave * 5;
      let speed = 2.5 + Math.random() * 0.8;
      let radius = 14;
      let color = "#ff3366";
      let scoreVal = 50;
      let creditVal = 10;

      if (roll > 0.65 && wave >= 2) {
        type = "sentinel";
        hp = 55 + wave * 8;
        speed = 1.8;
        radius = 18;
        color = "#ffaa00";
        scoreVal = 100;
        creditVal = 20;
      } else if (roll > 0.85 && wave >= 3) {
        type = "titan";
        hp = 140 + wave * 25;
        speed = 1.1;
        radius = 26;
        color = "#aa00ff";
        scoreVal = 250;
        creditVal = 50;
      } else if (roll > 0.95 && wave >= 4) {
        type = "phantom";
        hp = 70 + wave * 10;
        speed = 3.5;
        radius = 16;
        color = "#00ffcc";
        scoreVal = 180;
        creditVal = 35;
      }

      enemiesRef.current.push({
        id: Math.random().toString(),
        type,
        x,
        y,
        vx: 0,
        vy: 0,
        radius,
        hp,
        maxHp: hp,
        speed,
        damage: 10 + wave * 2,
        color,
        shootCooldown: Math.random() * 60,
        scoreValue: scoreVal,
        creditValue: creditVal
      });
    }

    // Boss Spawn every 5 waves
    if (wave % 5 === 0) {
      enemiesRef.current.push({
        id: "boss_" + wave,
        type: "boss",
        x: width / 2,
        y: -60,
        vx: 0,
        vy: 0,
        radius: 45,
        hp: 600 + wave * 250,
        maxHp: 600 + wave * 250,
        speed: 1.2,
        damage: 25,
        color: "#ff0055",
        shootCooldown: 30,
        scoreValue: 2000,
        creditValue: 500
      });
      addFloatingText("⚠️ CHRONOS OVERLORD DETECTED!", width / 2 - 100, 100, "#ff0055");
    }
  };

  // Fire Weapon
  const shootWeapon = () => {
    const p = playerRef.current;
    const currentWeapon = weapons[activeWeaponIndex];
    const now = Date.now();

    if (now - lastShotTimeRef.current < currentWeapon.fireRate) return;
    if (p.energy < currentWeapon.energyCost) return;

    p.energy -= currentWeapon.energyCost;
    lastShotTimeRef.current = now;

    // Calculate bullet velocities with spread
    for (let i = 0; i < currentWeapon.count; i++) {
      const spreadAngle = (i - (currentWeapon.count - 1) / 2) * currentWeapon.spread;
      const finalAngle = p.angle + spreadAngle;

      bulletsRef.current.push({
        id: Math.random().toString(),
        x: p.x + Math.cos(p.angle) * p.radius,
        y: p.y + Math.sin(p.angle) * p.radius,
        vx: Math.cos(finalAngle) * currentWeapon.speed,
        vy: Math.sin(finalAngle) * currentWeapon.speed,
        damage: currentWeapon.damage * (1 + (upgrades.find(u => u.id === "damage")?.level || 1) * 0.15),
        color: currentWeapon.color,
        radius: 4,
        isEnemy: false,
        life: 100
      });
    }

    audioSynth.playShoot();
  };

  // Main Canvas & Game Loop Effect
  useEffect(() => {
    if (gameState !== "playing") return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Resize canvas to parent container
    const handleResize = () => {
      if (containerRef.current && canvas) {
        canvas.width = containerRef.current.clientWidth;
        canvas.height = containerRef.current.clientHeight;
      }
    };
    handleResize();
    window.addEventListener("resize", handleResize);

    let lastFrameTime = performance.now();

    const loop = (currentTime: number) => {
      const dt = (currentTime - lastFrameTime) / 1000;
      lastFrameTime = currentTime;

      const p = playerRef.current;
      const width = canvas.width;
      const height = canvas.height;

      // 1. UPDATE PLAYER
      // Decrement timers
      if (p.dashCooldown > 0) p.dashCooldown--;
      if (p.timeFreezeTimer > 0) p.timeFreezeTimer--;
      if (p.invulnerableTimer > 0) p.invulnerableTimer--;

      // Energy Regeneration
      const energyRegenRate = 0.25 * (1 + (upgrades.find(u => u.id === "energyRegen")?.level || 1) * 0.25);
      p.energy = Math.min(p.maxEnergy, p.energy + energyRegenRate);

      // Shield Regeneration
      if (p.shield < p.maxShield) {
        p.shield = Math.min(p.maxShield, p.shield + 0.08);
      }

      // Movement input
      const speedMult = 1 + (upgrades.find(u => u.id === "speed")?.level || 1) * 0.1;
      const moveSpeed = 4.5 * speedMult;

      let dx = 0, dy = 0;
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

      // Screen boundaries
      p.x = Math.max(p.radius, Math.min(width - p.radius, p.x));
      p.y = Math.max(p.radius, Math.min(height - p.radius, p.y));

      // Aim angle to mouse
      p.angle = Math.atan2(mousePosRef.current.y - p.y, mousePosRef.current.x - p.x);

      // Shooting trigger
      if (isMouseDownRef.current || keysRef.current["Space"]) {
        shootWeapon();
      }

      // 2. UPDATE BULLETS
      for (let i = bulletsRef.current.length - 1; i >= 0; i--) {
        const b = bulletsRef.current[i];
        b.x += b.vx;
        b.y += b.vy;
        b.life--;

        if (b.x < 0 || b.x > width || b.y < 0 || b.y > height || b.life <= 0) {
          bulletsRef.current.splice(i, 1);
        }
      }

      // 3. UPDATE ENEMIES
      const timeFreezeFactor = p.timeFreezeTimer > 0 ? 0.2 : 1.0;

      for (let i = enemiesRef.current.length - 1; i >= 0; i--) {
        const enemy = enemiesRef.current[i];

        // Enemy movement towards player
        const angleToPlayer = Math.atan2(p.y - enemy.y, p.x - enemy.x);
        const currentSpeed = enemy.speed * timeFreezeFactor;

        enemy.vx = Math.cos(angleToPlayer) * currentSpeed;
        enemy.vy = Math.sin(angleToPlayer) * currentSpeed;

        enemy.x += enemy.vx;
        enemy.y += enemy.vy;

        // Enemy Shooting Logic
        if (enemy.type === "sentinel" || enemy.type === "boss") {
          enemy.shootCooldown -= 1 * timeFreezeFactor;
          if (enemy.shootCooldown <= 0) {
            enemy.shootCooldown = enemy.type === "boss" ? 35 : 90;

            bulletsRef.current.push({
              id: Math.random().toString(),
              x: enemy.x,
              y: enemy.y,
              vx: Math.cos(angleToPlayer) * 7,
              vy: Math.sin(angleToPlayer) * 7,
              damage: enemy.damage,
              color: "#ff0055",
              radius: enemy.type === "boss" ? 7 : 5,
              isEnemy: true,
              life: 120
            });
          }
        }

        // Collision Enemy -> Player
        const distToPlayer = Math.hypot(p.x - enemy.x, p.y - enemy.y);
        if (distToPlayer < p.radius + enemy.radius && p.invulnerableTimer <= 0) {
          // Take Damage
          let dmg = enemy.damage * 0.15;
          if (p.shield > 0) {
            p.shield -= dmg;
            if (p.shield < 0) {
              p.hp += p.shield; // remaining excess to HP
              p.shield = 0;
            }
          } else {
            p.hp -= dmg;
          }

          p.invulnerableTimer = 10; // short invuln

          // Check Player Death
          if (p.hp <= 0) {
            p.hp = 0;
            setGameState("gameover");
            if (p.score > highScore) {
              setHighScore(p.score);
              localStorage.setItem("chrono_vanguard_highscore", p.score.toString());
            }
          }
        }

        // Collision Bullets -> Enemy
        for (let j = bulletsRef.current.length - 1; j >= 0; j--) {
          const b = bulletsRef.current[j];
          if (b.isEnemy) continue;

          const dist = Math.hypot(b.x - enemy.x, b.y - enemy.y);
          if (dist < b.radius + enemy.radius) {
            // Apply Damage
            enemy.hp -= b.damage;

            // Spawn Hit Particles
            for (let k = 0; k < 4; k++) {
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

            bulletsRef.current.splice(j, 1);

            // Enemy Defeated
            if (enemy.hp <= 0) {
              p.score += enemy.scoreValue;
              p.credits += enemy.creditValue;
              p.kills++;

              addFloatingText(`+${enemy.scoreValue}`, enemy.x, enemy.y, "#00f0ff");

              // Spawn Death Particles
              for (let k = 0; k < 12; k++) {
                particlesRef.current.push({
                  x: enemy.x,
                  y: enemy.y,
                  vx: (Math.random() - 0.5) * 8,
                  vy: (Math.random() - 0.5) * 8,
                  radius: Math.random() * 5 + 2,
                  color: enemy.color,
                  alpha: 1,
                  decay: 0.04
                });
              }

              // Random PowerUp Drop
              if (Math.random() < 0.15) {
                const types: ("health" | "shield" | "timeFreeze" | "energy")[] = ["health", "shield", "timeFreeze", "energy"];
                const dropType = types[Math.floor(Math.random() * types.length)];
                powerUpsRef.current.push({
                  id: Math.random().toString(),
                  type: dropType,
                  x: enemy.x,
                  y: enemy.y,
                  radius: 12,
                  duration: 600
                });
              }

              audioSynth.playExplosion();
              enemiesRef.current.splice(i, 1);
              break;
            }
          }
        }
      }

      // Check Bullet -> Player collisions
      for (let j = bulletsRef.current.length - 1; j >= 0; j--) {
        const b = bulletsRef.current[j];
        if (!b.isEnemy) continue;

        const dist = Math.hypot(b.x - p.x, b.y - p.y);
        if (dist < b.radius + p.radius && p.invulnerableTimer <= 0) {
          if (p.shield > 0) {
            p.shield -= b.damage;
            if (p.shield < 0) {
              p.hp += p.shield;
              p.shield = 0;
            }
          } else {
            p.hp -= b.damage;
          }

          p.invulnerableTimer = 15;
          bulletsRef.current.splice(j, 1);

          if (p.hp <= 0) {
            p.hp = 0;
            setGameState("gameover");
            if (p.score > highScore) {
              setHighScore(p.score);
              localStorage.setItem("chrono_vanguard_highscore", p.score.toString());
            }
          }
        }
      }

      // 4. UPDATE POWERUPS
      for (let i = powerUpsRef.current.length - 1; i >= 0; i--) {
        const item = powerUpsRef.current[i];
        item.duration--;

        const dist = Math.hypot(p.x - item.x, p.y - item.y);
        if (dist < p.radius + item.radius) {
          if (item.type === "health") {
            p.hp = Math.min(p.maxHp, p.hp + 35);
            addFloatingText("+35 HP", p.x, p.y - 20, "#00ff66");
          } else if (item.type === "shield") {
            p.shield = Math.min(p.maxShield, p.shield + 30);
            addFloatingText("+30 SHIELD", p.x, p.y - 20, "#00f0ff");
          } else if (item.type === "energy") {
            p.energy = p.maxEnergy;
            addFloatingText("ENERGY RECHARGED", p.x, p.y - 20, "#ffaa00");
          } else if (item.type === "timeFreeze") {
            p.timeFreezeTimer = 300;
            addFloatingText("TIME FREEZE!", p.x, p.y - 20, "#a855f7");
          }

          audioSynth.playPowerup();
          powerUpsRef.current.splice(i, 1);
          continue;
        }

        if (item.duration <= 0) {
          powerUpsRef.current.splice(i, 1);
        }
      }

      // 5. UPDATE PARTICLES & FLOATING TEXTS
      for (let i = particlesRef.current.length - 1; i >= 0; i--) {
        const pt = particlesRef.current[i];
        pt.x += pt.vx;
        pt.y += pt.vy;
        pt.alpha -= pt.decay;
        if (pt.alpha <= 0) particlesRef.current.splice(i, 1);
      }

      for (let i = floatingTextsRef.current.length - 1; i >= 0; i--) {
        const ft = floatingTextsRef.current[i];
        ft.y += ft.vy;
        ft.alpha -= 0.02;
        if (ft.alpha <= 0) floatingTextsRef.current.splice(i, 1);
      }

      // Check Wave Completion
      if (enemiesRef.current.length === 0) {
        p.wave++;
        setWaveCount(p.wave);
        spawnWave(p.wave);
      }

      // Update React State UI values
      setPlayerStats({
        hp: Math.round(p.hp),
        maxHp: Math.round(p.maxHp),
        shield: Math.round(p.shield),
        maxShield: Math.round(p.maxShield),
        energy: Math.round(p.energy),
        maxEnergy: Math.round(p.maxEnergy),
        score: p.score,
        credits: p.credits,
        wave: p.wave,
        kills: p.kills,
        timeFreeze: Math.ceil(p.timeFreezeTimer / 60)
      });

      // -------------------------------------------------------------
      // RENDER SECTION
      // -------------------------------------------------------------
      ctx.clearRect(0, 0, width, height);

      // Background Cyber Grid & Starfield
      ctx.fillStyle = "#060412";
      ctx.fillRect(0, 0, width, height);

      ctx.strokeStyle = "rgba(0, 240, 255, 0.04)";
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

      // Render Time Freeze Overlay
      if (p.timeFreezeTimer > 0) {
        ctx.fillStyle = "rgba(168, 85, 247, 0.12)";
        ctx.fillRect(0, 0, width, height);
      }

      // Render PowerUps
      powerUpsRef.current.forEach(item => {
        ctx.save();
        ctx.beginPath();
        ctx.arc(item.x, item.y, item.radius, 0, Math.PI * 2);
        ctx.fillStyle =
          item.type === "health"
            ? "#00ff66"
            : item.type === "shield"
            ? "#00f0ff"
            : item.type === "energy"
            ? "#ffaa00"
            : "#a855f7";
        ctx.shadowColor = ctx.fillStyle;
        ctx.shadowBlur = 12;
        ctx.fill();
        ctx.restore();
      });

      // Render Bullets
      bulletsRef.current.forEach(b => {
        ctx.save();
        ctx.beginPath();
        ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
        ctx.fillStyle = b.color;
        ctx.shadowColor = b.color;
        ctx.shadowBlur = 10;
        ctx.fill();
        ctx.restore();
      });

      // Render Enemies
      enemiesRef.current.forEach(enemy => {
        ctx.save();
        ctx.translate(enemy.x, enemy.y);

        // Body
        ctx.beginPath();
        if (enemy.type === "titan" || enemy.type === "boss") {
          ctx.arc(0, 0, enemy.radius, 0, Math.PI * 2);
        } else {
          ctx.arc(0, 0, enemy.radius, 0, Math.PI * 2);
        }
        ctx.fillStyle = enemy.color;
        ctx.shadowColor = enemy.color;
        ctx.shadowBlur = 14;
        ctx.fill();

        // HP bar above enemy
        if (enemy.hp < enemy.maxHp) {
          const barW = enemy.radius * 2.2;
          const barH = 4;
          ctx.fillStyle = "rgba(0,0,0,0.6)";
          ctx.fillRect(-barW / 2, -enemy.radius - 10, barW, barH);
          ctx.fillStyle = "#00ff66";
          ctx.fillRect(-barW / 2, -enemy.radius - 10, barW * (enemy.hp / enemy.maxHp), barH);
        }

        ctx.restore();
      });

      // Render Particles
      particlesRef.current.forEach(pt => {
        ctx.save();
        ctx.globalAlpha = pt.alpha;
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, pt.radius, 0, Math.PI * 2);
        ctx.fillStyle = pt.color;
        ctx.fill();
        ctx.restore();
      });

      // Render Player Ship
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.angle);

      // Invulnerable flashing
      if (p.invulnerableTimer % 4 < 2) {
        // Thruster flame
        ctx.beginPath();
        ctx.moveTo(-p.radius, -6);
        ctx.lineTo(-p.radius - 12 - Math.random() * 6, 0);
        ctx.lineTo(-p.radius, 6);
        ctx.fillStyle = "#ffaa00";
        ctx.shadowColor = "#ff5500";
        ctx.shadowBlur = 12;
        ctx.fill();

        // Ship Triangle
        ctx.beginPath();
        ctx.moveTo(p.radius + 4, 0);
        ctx.lineTo(-p.radius, -p.radius + 2);
        ctx.lineTo(-p.radius + 4, 0);
        ctx.lineTo(-p.radius, p.radius - 2);
        ctx.closePath();

        ctx.fillStyle = "#00f0ff";
        ctx.shadowColor = "#00f0ff";
        ctx.shadowBlur = 16;
        ctx.fill();
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 2;
        ctx.stroke();

        // Shield Aura
        if (p.shield > 0) {
          ctx.beginPath();
          ctx.arc(0, 0, p.radius + 6, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(0, 240, 255, ${0.3 + (p.shield / p.maxShield) * 0.5})`;
          ctx.lineWidth = 2;
          ctx.stroke();
        }
      }
      ctx.restore();

      // Render Floating Combat Text
      floatingTextsRef.current.forEach(ft => {
        ctx.save();
        ctx.globalAlpha = ft.alpha;
        ctx.font = "bold 13px system-ui, sans-serif";
        ctx.fillStyle = ft.color;
        ctx.shadowColor = ft.color;
        ctx.shadowBlur = 8;
        ctx.fillText(ft.text, ft.x, ft.y);
        ctx.restore();
      });

      animationFrameRef.current = requestAnimationFrame(loop);
    };

    animationFrameRef.current = requestAnimationFrame(loop);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      window.removeEventListener("resize", handleResize);
    };
  }, [gameState, upgrades, weapons, activeWeaponIndex, highScore]);

  // Upgrade Purchase Logic
  const purchaseUpgrade = (id: string) => {
    const up = upgrades.find(u => u.id === id);
    if (!up) return;

    const p = playerRef.current;
    if (p.credits >= up.cost && up.level < up.maxLevel) {
      p.credits -= up.cost;
      up.level++;
      up.cost = Math.round(up.cost * 1.6);

      if (id === "maxHp") {
        p.maxHp += 25;
        p.hp += 25;
      } else if (id === "shield") {
        p.maxShield += 20;
        p.shield += 20;
      }

      setUpgrades([...upgrades]);
      audioSynth.playPowerup();
    }
  };

  // Weapon Unlock Logic
  const unlockWeapon = (index: number) => {
    const w = weapons[index];
    const p = playerRef.current;

    if (!w.unlocked && p.credits >= w.cost) {
      p.credits -= w.cost;
      w.unlocked = true;
      setWeapons([...weapons]);
      setActiveWeaponIndex(index);
      audioSynth.playPowerup();
    }
  };

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full min-h-[600px] bg-slate-950 text-white flex flex-col font-sans select-none overflow-hidden rounded-xl border border-cyan-500/20 shadow-2xl"
    >
      {/* HUD Header Bar */}
      {gameState === "playing" && (
        <div className="absolute top-0 left-0 right-0 z-20 p-4 flex flex-wrap items-center justify-between gap-4 bg-gradient-to-b from-slate-950/90 to-transparent backdrop-blur-xs pointer-events-none">
          {/* Health & Shield */}
          <div className="flex items-center gap-4 pointer-events-auto">
            <div className="flex flex-col gap-1 w-36">
              <div className="flex items-center justify-between text-xs font-bold text-cyan-400">
                <span className="flex items-center gap-1"><Shield className="w-3.5 h-3.5" /> HP</span>
                <span>{playerStats.hp} / {playerStats.maxHp}</span>
              </div>
              <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden border border-cyan-500/30">
                <div
                  className="h-full bg-gradient-to-r from-cyan-500 to-emerald-400 transition-all duration-200"
                  style={{ width: `${(playerStats.hp / playerStats.maxHp) * 100}%` }}
                />
              </div>

              <div className="flex items-center justify-between text-xs font-bold text-blue-400 mt-1">
                <span>Shield</span>
                <span>{playerStats.shield} / {playerStats.maxShield}</span>
              </div>
              <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden border border-blue-500/30">
                <div
                  className="h-full bg-blue-400 transition-all duration-200"
                  style={{ width: `${(playerStats.shield / playerStats.maxShield) * 100}%` }}
                />
              </div>
            </div>

            {/* Energy Bar */}
            <div className="flex flex-col gap-1 w-28">
              <div className="flex items-center justify-between text-xs font-bold text-amber-400">
                <span className="flex items-center gap-1"><Zap className="w-3.5 h-3.5" /> Energy</span>
                <span>{playerStats.energy}%</span>
              </div>
              <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden border border-amber-500/30">
                <div
                  className="h-full bg-amber-400 transition-all duration-150"
                  style={{ width: `${(playerStats.energy / playerStats.maxEnergy) * 100}%` }}
                />
              </div>
            </div>
          </div>

          {/* Center Info: Score, Credits & Wave */}
          <div className="flex items-center gap-6 bg-slate-900/80 px-4 py-2 rounded-xl border border-cyan-500/30 pointer-events-auto">
            <div className="text-center">
              <div className="text-[10px] uppercase tracking-wider text-cyan-400 font-semibold">Score</div>
              <div className="text-lg font-black text-white">{playerStats.score}</div>
            </div>
            <div className="w-px h-6 bg-slate-700" />
            <div className="text-center">
              <div className="text-[10px] uppercase tracking-wider text-amber-400 font-semibold">Credits</div>
              <div className="text-lg font-black text-amber-300">⬡ {playerStats.credits}</div>
            </div>
            <div className="w-px h-6 bg-slate-700" />
            <div className="text-center">
              <div className="text-[10px] uppercase tracking-wider text-purple-400 font-semibold">Wave</div>
              <div className="text-lg font-black text-purple-300">#{playerStats.wave}</div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2 pointer-events-auto">
            <button
              onClick={() => setGameState("shop")}
              className="p-2.5 bg-slate-800/90 hover:bg-slate-700 border border-amber-500/40 rounded-xl text-amber-300 font-bold text-xs flex items-center gap-1.5 transition-all shadow-md"
            >
              <ShoppingCart className="w-4 h-4" /> Shop
            </button>
            <button
              onClick={() => setSoundMuted(!soundMuted)}
              className="p-2.5 bg-slate-800/90 hover:bg-slate-700 border border-cyan-500/30 rounded-xl text-cyan-300 transition-all"
            >
              {soundMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>
            <button
              onClick={() => setGameState("paused")}
              className="p-2.5 bg-slate-800/90 hover:bg-slate-700 border border-cyan-500/30 rounded-xl text-cyan-300 transition-all"
            >
              <Pause className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Main Canvas Element */}
      <canvas ref={canvasRef} className="w-full h-full block bg-slate-950 cursor-crosshair" />

      {/* Wave Banner */}
      {waveBanner && gameState === "playing" && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-30">
          <div className="px-8 py-4 bg-cyan-950/90 border-y-2 border-cyan-400 text-cyan-300 text-3xl font-black tracking-widest uppercase shadow-[0_0_50px_rgba(0,240,255,0.4)] animate-pulse">
            {waveBanner}
          </div>
        </div>
      )}

      {/* Weapons Bar (Bottom) */}
      {gameState === "playing" && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 bg-slate-900/90 p-2 rounded-2xl border border-cyan-500/30 backdrop-blur-md">
          {weapons.map((w, idx) => (
            <button
              key={idx}
              onClick={() => w.unlocked && setActiveWeaponIndex(idx)}
              className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex flex-col items-center gap-0.5 border ${
                activeWeaponIndex === idx
                  ? "bg-cyan-500/20 border-cyan-400 text-cyan-300 shadow-[0_0_15px_rgba(0,240,255,0.3)]"
                  : w.unlocked
                  ? "bg-slate-800/60 border-slate-700 text-slate-300 hover:bg-slate-700"
                  : "bg-slate-950/60 border-slate-800 text-slate-600 cursor-not-allowed"
              }`}
            >
              <span className="text-[10px] text-slate-400 font-mono">[{idx + 1}]</span>
              <span>{w.name}</span>
              {!w.unlocked && <span className="text-[9px] text-amber-400">⬡ {w.cost}</span>}
            </button>
          ))}
        </div>
      )}

      {/* MENU OVERLAY */}
      {gameState === "menu" && (
        <div className="absolute inset-0 z-40 flex flex-col items-center justify-center bg-slate-950/95 backdrop-blur-md p-6 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs font-semibold uppercase tracking-wider mb-4">
            <Sparkles className="w-4 h-4" /> Next-Gen Cyber Arcade
          </div>

          <h1 className="text-5xl md:text-6xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-500 mb-2">
            CHRONO VANGUARD
          </h1>
          <p className="text-lg font-bold tracking-widest text-cyan-300/80 uppercase mb-8">
            PARADOX RIFT SURVIVOR
          </p>

          <div className="max-w-md text-sm text-slate-300 mb-8 space-y-2 leading-relaxed bg-slate-900/60 p-4 rounded-xl border border-slate-800">
            <p>Pilot your Tachyon Vanguard starfighter against rogue temporal anomalies.</p>
            <div className="flex justify-center gap-4 text-xs font-mono text-cyan-400 pt-2 border-t border-slate-800">
              <span>[WASD] Move</span>
              <span>[MOUSE] Aim & Shoot</span>
              <span>[SPACE] Dash</span>
              <span>[E] Time Freeze</span>
            </div>
          </div>

          {highScore > 0 && (
            <div className="flex items-center gap-2 mb-8 text-amber-400 font-bold bg-amber-500/10 px-4 py-2 rounded-xl border border-amber-500/30">
              <Trophy className="w-5 h-5" /> High Score: {highScore}
            </div>
          )}

          <button
            onClick={startNewGame}
            className="px-8 py-4 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-black text-lg rounded-2xl shadow-[0_0_30px_rgba(0,240,255,0.4)] transition-all hover:scale-105 active:scale-95 flex items-center gap-3"
          >
            <Play className="w-6 h-6 fill-current" /> LAUNCH MISSION
          </button>
        </div>
      )}

      {/* SHOP / UPGRADES OVERLAY */}
      {gameState === "shop" && (
        <div className="absolute inset-0 z-40 flex flex-col bg-slate-950/95 backdrop-blur-md p-6 overflow-y-auto">
          <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-6">
            <div>
              <h2 className="text-2xl font-black text-cyan-400 flex items-center gap-2">
                <ShoppingCart className="w-6 h-6" /> TECH MATRIX SHOP
              </h2>
              <p className="text-xs text-slate-400">Upgrade Vanguard systems & unlock heavy plasma weaponry.</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-lg font-black text-amber-300 bg-amber-500/10 px-4 py-2 rounded-xl border border-amber-500/30">
                Credits: ⬡ {playerStats.credits}
              </div>
              <button
                onClick={() => setGameState("playing")}
                className="px-5 py-2.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black rounded-xl transition-all"
              >
                RETURN TO COMBAT
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto w-full">
            {/* System Upgrades */}
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-cyan-300 uppercase tracking-wider">Ship Subsystem Upgrades</h3>
              {upgrades.map(up => (
                <div key={up.id} className="p-4 bg-slate-900/80 rounded-xl border border-slate-800 flex items-center justify-between">
                  <div>
                    <div className="font-bold text-white text-sm">{up.name}</div>
                    <div className="text-xs text-slate-400">{up.description}</div>
                    <div className="text-[10px] text-cyan-400 font-mono mt-1">Level {up.level} / {up.maxLevel}</div>
                  </div>
                  <button
                    onClick={() => purchaseUpgrade(up.id)}
                    disabled={up.level >= up.maxLevel || playerStats.credits < up.cost}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                      up.level >= up.maxLevel
                        ? "bg-slate-800 text-slate-500 cursor-not-allowed"
                        : playerStats.credits >= up.cost
                        ? "bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-md"
                        : "bg-slate-800 text-slate-600 cursor-not-allowed"
                    }`}
                  >
                    {up.level >= up.maxLevel ? "MAXED" : `Upgrade (⬡ ${up.cost})`}
                  </button>
                </div>
              ))}
            </div>

            {/* Weapon Arsenal */}
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-purple-300 uppercase tracking-wider">Weapon Arsenal</h3>
              {weapons.map((w, idx) => (
                <div key={idx} className="p-4 bg-slate-900/80 rounded-xl border border-slate-800 flex items-center justify-between">
                  <div>
                    <div className="font-bold text-white text-sm flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full" style={{ backgroundColor: w.color }} />
                      {w.name}
                    </div>
                    <div className="text-xs text-slate-400">
                      Damage: {w.damage} | Fire Rate: {w.fireRate}ms
                    </div>
                    <div className="text-[10px] text-purple-400 font-mono mt-1">
                      {w.unlocked ? "Status: UNLOCKED" : `Unlock Cost: ⬡ ${w.cost}`}
                    </div>
                  </div>
                  {!w.unlocked ? (
                    <button
                      onClick={() => unlockWeapon(idx)}
                      disabled={playerStats.credits < w.cost}
                      className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                        playerStats.credits >= w.cost
                          ? "bg-purple-500 hover:bg-purple-400 text-white shadow-md"
                          : "bg-slate-800 text-slate-600 cursor-not-allowed"
                      }`}
                    >
                      Unlock (⬡ {w.cost})
                    </button>
                  ) : (
                    <span className="text-xs font-bold text-emerald-400 px-3 py-1 bg-emerald-500/10 rounded-lg border border-emerald-500/30">
                      OWNED
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* PAUSE OVERLAY */}
      {gameState === "paused" && (
        <div className="absolute inset-0 z-40 flex flex-col items-center justify-center bg-slate-950/90 backdrop-blur-md p-6">
          <h2 className="text-4xl font-black text-cyan-400 mb-6">MISSION PAUSED</h2>
          <div className="flex flex-col gap-4 w-64">
            <button
              onClick={() => setGameState("playing")}
              className="px-6 py-3 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black rounded-xl transition-all"
            >
              RESUME COMBAT
            </button>
            <button
              onClick={() => setGameState("shop")}
              className="px-6 py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl transition-all"
            >
              TECH SHOP
            </button>
            <button
              onClick={startNewGame}
              className="px-6 py-3 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl transition-all"
            >
              RESTART MISSION
            </button>
          </div>
        </div>
      )}

      {/* GAME OVER OVERLAY */}
      {gameState === "gameover" && (
        <div className="absolute inset-0 z-40 flex flex-col items-center justify-center bg-slate-950/95 backdrop-blur-md p-6 text-center">
          <h2 className="text-5xl font-black text-rose-500 mb-2">VANGUARD DESTROYED</h2>
          <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-6">
            Temporal rift collapsed
          </p>

          <div className="bg-slate-900/80 p-6 rounded-2xl border border-slate-800 w-full max-w-sm mb-8 space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-slate-400">Final Score:</span>
              <span className="font-bold text-white">{playerStats.score}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-400">Waves Survived:</span>
              <span className="font-bold text-purple-300">#{playerStats.wave}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-400">Anomalies Destroyed:</span>
              <span className="font-bold text-cyan-300">{playerStats.kills}</span>
            </div>
            <div className="flex justify-between text-sm pt-2 border-t border-slate-800">
              <span className="text-amber-400 font-bold">Personal Best:</span>
              <span className="font-bold text-amber-300">{highScore}</span>
            </div>
          </div>

          <button
            onClick={startNewGame}
            className="px-8 py-4 bg-gradient-to-r from-rose-500 to-purple-600 hover:from-rose-400 hover:to-purple-500 text-white font-black text-lg rounded-2xl shadow-[0_0_30px_rgba(244,63,94,0.4)] transition-all hover:scale-105 active:scale-95 flex items-center gap-3"
          >
            <RotateCcw className="w-5 h-5" /> RE-ENTER RIFT
          </button>
        </div>
      )}
    </div>
  );
}
