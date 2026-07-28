"use client";

import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Trophy,
  Zap,
  Shield,
  Play,
  RotateCcw,
  ArrowLeft,
  Volume2,
  VolumeX,
  Flame,
  Crosshair,
  Sparkles,
  Radio,
  Rocket,
  Award,
  Target,
  Cpu,
  Layers,
  Pause,
  RefreshCw,
  Gauge,
  Sliders,
  CheckCircle2,
  Skull,
  Sword,
  BatteryCharging,
  ZapOff,
  Activity,
  Heart,
  TrendingUp
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

// ==========================================
// 1. PROCEDURAL 2D AUDIO SYNTHESIZER
// ==========================================
class CyberAudioSynth {
  private ctx: AudioContext | null = null;
  public muted: boolean = false;

  private initCtx() {
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

  public playLaser() {
    if (this.muted) return;
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(1200, now);
    osc.frequency.exponentialRampToValueAtTime(200, now + 0.08);

    gain.gain.setValueAtTime(0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.08);
  }

  public playSlash() {
    if (this.muted) return;
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(400, now);
    osc.frequency.exponentialRampToValueAtTime(1600, now + 0.12);

    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.12);
  }

  public playDash() {
    if (this.muted) return;
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = "triangle";
    osc.frequency.setValueAtTime(150, now);
    osc.frequency.exponentialRampToValueAtTime(800, now + 0.2);

    gain.gain.setValueAtTime(0.25, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.2);
  }

  public playExplosion(isLarge: boolean = false) {
    if (this.muted) return;
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const duration = isLarge ? 0.6 : 0.25;

    const bufferSize = this.ctx.sampleRate * duration;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(isLarge ? 500 : 900, now);
    filter.frequency.linearRampToValueAtTime(50, now + duration);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(isLarge ? 0.4 : 0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);

    noise.start(now);
    noise.stop(now + duration);
  }

  public playXp() {
    if (this.muted) return;
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(800, now);
    osc.frequency.exponentialRampToValueAtTime(1400, now + 0.09);

    gain.gain.setValueAtTime(0.1, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.09);
  }

  public playLevelUp() {
    if (this.muted) return;
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
    notes.forEach((freq, idx) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, now + idx * 0.08);

      gain.gain.setValueAtTime(0.2, now + idx * 0.08);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.15);

      osc.connect(gain);
      gain.connect(this.ctx!.destination);

      osc.start(now + idx * 0.08);
      osc.stop(now + idx * 0.08 + 0.15);
    });
  }

  public playGameOver() {
    if (this.muted) return;
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const notes = [400, 300, 200, 100];
    notes.forEach((freq, idx) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();

      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(freq, now + idx * 0.15);

      gain.gain.setValueAtTime(0.3, now + idx * 0.15);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.15 + 0.2);

      osc.connect(gain);
      gain.connect(this.ctx!.destination);

      osc.start(now + idx * 0.15);
      osc.stop(now + idx * 0.15 + 0.2);
    });
  }
}

const audioSynth = new CyberAudioSynth();

// ==========================================
// 2. TYPES & INTERFACES
// ==========================================
export interface PlayerState {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  speed: number;
  hp: number;
  maxHp: number;
  level: number;
  xp: number;
  nextXp: number;
  dashCooldown: number;
  isDashing: boolean;
  dashTime: number;
  angle: number;
  invulnerableTime: number;
}

export interface EnemyEntity {
  id: string;
  type: "hound" | "shooter" | "tank" | "assassin" | "boss";
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  speed: number;
  hp: number;
  maxHp: number;
  damage: number;
  color: string;
  shootTimer: number;
  xpValue: number;
}

export interface BulletEntity {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
  damage: number;
  isEnemy: boolean;
  pierce: number;
  life: number;
}

export interface ParticleEntity {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  life: number;
  maxLife: number;
}

export interface XpGem {
  id: string;
  x: number;
  y: number;
  value: number;
}

export interface UpgradeOption {
  id: string;
  name: string;
  description: string;
  icon: string;
  level: number;
  maxLevel: number;
}

// ==========================================
// 3. MAIN GAME COMPONENT
// ==========================================
export default function CyberNexusSurvivorGame() {
  const router = useRouter();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Game Lifecycle
  const [gameState, setGameState] = useState<"menu" | "playing" | "levelup" | "paused" | "gameover" | "victory">("menu");
  const [difficulty, setDifficulty] = useState<"normal" | "hardcore" | "nightmare">("normal");

  // Player Stats
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [survivalTime, setSurvivalTime] = useState(0);
  const [kills, setKills] = useState(0);
  const [wave, setWave] = useState(1);
  const [playerHp, setPlayerHp] = useState(100);
  const [playerMaxHp, setPlayerMaxHp] = useState(100);
  const [playerLevel, setPlayerLevel] = useState(1);
  const [playerXp, setPlayerXp] = useState(0);
  const [nextLevelXp, setNextLevelXp] = useState(100);
  const [dashCd, setDashCd] = useState(0);
  const [overdriveCd, setOverdriveCd] = useState(0);

  // Active Upgrade Perks
  const [perks, setPerks] = useState<{ [key: string]: number }>({
    katana: 1,
    fireRate: 0,
    drone: 0,
    lightning: 0,
    shield: 0,
    speed: 0,
    crit: 0,
    maxHp: 0
  });

  const [availableUpgrades, setAvailableUpgrades] = useState<UpgradeOption[]>([]);

  // Mouse & Key Input States
  const keys = useRef<{ [key: string]: boolean }>({});
  const mousePos = useRef({ x: 0, y: 0 });

  // Game Entities Refs for 60 FPS Canvas Loop
  const playerRef = useRef<PlayerState>({
    x: 600,
    y: 400,
    vx: 0,
    vy: 0,
    radius: 16,
    speed: 5,
    hp: 100,
    maxHp: 100,
    level: 1,
    xp: 0,
    nextXp: 100,
    dashCooldown: 0,
    isDashing: false,
    dashTime: 0,
    angle: 0,
    invulnerableTime: 0
  });

  const enemiesRef = useRef<EnemyEntity[]>([]);
  const bulletsRef = useRef<BulletEntity[]>([]);
  const particlesRef = useRef<ParticleEntity[]>([]);
  const xpGemsRef = useRef<XpGem[]>([]);
  const isBossSpawned = useRef(false);
  const lastShotTime = useRef(0);
  const lastLightningTime = useRef(0);
  const shakeRef = useRef(0);

  // Load High Score
  useEffect(() => {
    const saved = localStorage.getItem("cyber_nexus_survivor_highscore");
    if (saved) setHighScore(parseInt(saved, 10));
  }, []);

  // Keyboard & Mouse Controls Setup
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      keys.current[e.code] = true;

      if (e.code === "Space" && playerRef.current.dashCooldown <= 0 && gameState === "playing") {
        performDash();
      }
      if (e.code === "KeyE" && overdriveCd <= 0 && gameState === "playing") {
        performOverdrive();
      }
      if (e.code === "KeyP" || e.code === "Escape") {
        setGameState((prev) => (prev === "playing" ? "paused" : prev === "paused" ? "playing" : prev));
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      keys.current[e.code] = false;
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (canvasRef.current) {
        const rect = canvasRef.current.getBoundingClientRect();
        mousePos.current = {
          x: e.clientX - rect.left,
          y: e.clientY - rect.top
        };
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    window.addEventListener("mousemove", handleMouseMove);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
      window.removeEventListener("mousemove", handleMouseMove);
    };
  }, [gameState, overdriveCd]);

  // Dash Roll Ability
  const performDash = () => {
    audioSynth.playDash();
    const p = playerRef.current;
    p.isDashing = true;
    p.dashTime = 0.25;
    p.dashCooldown = 1.8 - perks.speed * 0.2;
    p.invulnerableTime = 0.35;

    // Dash Ghost Particles
    for (let i = 0; i < 8; i++) {
      particlesRef.current.push({
        id: Math.random().toString(),
        x: p.x + (Math.random() - 0.5) * 10,
        y: p.y + (Math.random() - 0.5) * 10,
        vx: -p.vx * 0.3,
        vy: -p.vy * 0.3,
        color: "#38bdf8",
        size: 8,
        life: 0.3,
        maxLife: 0.3
      });
    }
  };

  // Overdrive EMP Pulse Ability
  const performOverdrive = () => {
    audioSynth.playExplosion(true);
    setOverdriveCd(12);
    shakeRef.current = 15;

    const p = playerRef.current;

    // Shockwave Ring Particles
    for (let angle = 0; angle < Math.PI * 2; angle += 0.15) {
      particlesRef.current.push({
        id: Math.random().toString(),
        x: p.x,
        y: p.y,
        vx: Math.cos(angle) * 12,
        vy: Math.sin(angle) * 12,
        color: "#a855f7",
        size: 6,
        life: 0.5,
        maxLife: 0.5
      });
    }

    // Clear nearby enemy bullets
    bulletsRef.current = bulletsRef.current.filter((b) => b.isEnemy === false);

    // Damage and push all nearby enemies
    enemiesRef.current.forEach((e) => {
      const dist = Math.hypot(e.x - p.x, e.y - p.y);
      if (dist < 220) {
        e.hp -= 150;
        const pushAngle = Math.atan2(e.y - p.y, e.x - p.x);
        e.x += Math.cos(pushAngle) * 80;
        e.y += Math.sin(pushAngle) * 80;
      }
    });
  };

  // Trigger Level Up Modal & Perks
  const triggerLevelUp = () => {
    audioSynth.playLevelUp();
    setGameState("levelup");

    const allOptions: UpgradeOption[] = [
      { id: "katana", name: "Plasma Katana Spin", description: "Spinning blade arc damages surrounding cyber hostiles", icon: "Sword", level: perks.katana, maxLevel: 5 },
      { id: "fireRate", name: "Rapid Plasma Vulcan", description: "Increases Vulcan cannon firing rate and bullet speed", icon: "Zap", level: perks.fireRate, maxLevel: 5 },
      { id: "drone", name: "Homing Attack Drone", description: "Deploys autonomous cyber drone firing seeker lasers", icon: "Rocket", level: perks.drone, maxLevel: 5 },
      { id: "lightning", name: "Chain Lightning Arc", description: "Periodically electrocutes chains of nearby hostiles", icon: "Activity", level: perks.lightning, maxLevel: 5 },
      { id: "shield", name: "Nanite Force Shield", description: "Grants regenerating force shield absorbing enemy damage", icon: "Shield", level: perks.shield, maxLevel: 5 },
      { id: "speed", name: "Cyber Engine Thrusters", description: "Boosts movement speed and reduces dash cooldown", icon: "TrendingUp", level: perks.speed, maxLevel: 5 },
      { id: "crit", name: "Targeting Matrix", description: "Increases critical hit chance and damage multiplier", icon: "Target", level: perks.crit, maxLevel: 5 },
      { id: "maxHp", name: "Bio-Synthetic Armor", description: "Increases maximum hull integrity and restores 40% HP", icon: "Heart", level: perks.maxHp, maxLevel: 5 }
    ];

    const available = allOptions.filter((opt) => opt.level < opt.maxLevel);
    const shuffled = available.sort(() => 0.5 - Math.random()).slice(0, 3);
    setAvailableUpgrades(shuffled);
  };

  // Select Upgrade Perk
  const selectUpgrade = (id: string) => {
    setPerks((prev) => {
      const nextLevel = (prev[id] || 0) + 1;
      if (id === "maxHp") {
        setPlayerMaxHp((m) => m + 30);
        setPlayerHp((h) => Math.min(playerMaxHp + 30, h + 50));
      }
      return { ...prev, [id]: nextLevel };
    });
    setGameState("playing");
  };

  // MAIN 60 FPS CANVAS GAME ENGINE LOOP
  useEffect(() => {
    if (gameState !== "playing") return;

    let animId: number;
    let lastTime = performance.now();
    let secondTimer = 0;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const gameLoop = (now: number) => {
      const delta = Math.min((now - lastTime) / 1000, 0.1);
      lastTime = now;

      secondTimer += delta;
      if (secondTimer >= 1.0) {
        secondTimer = 0;
        setSurvivalTime((st) => st + 1);
        setOverdriveCd((cd) => Math.max(0, cd - 1));
      }

      const p = playerRef.current;

      // 1. Process Movement & Friction
      let inputX = 0;
      let inputY = 0;

      if (keys.current["KeyA"] || keys.current["ArrowLeft"]) inputX -= 1;
      if (keys.current["KeyD"] || keys.current["ArrowRight"]) inputX += 1;
      if (keys.current["KeyW"] || keys.current["ArrowUp"]) inputY -= 1;
      if (keys.current["KeyS"] || keys.current["ArrowDown"]) inputY += 1;

      // Normalize diagonal vector
      if (inputX !== 0 && inputY !== 0) {
        inputX *= 0.7071;
        inputY *= 0.7071;
      }

      const moveSpeed = (p.speed + perks.speed * 0.8) * (p.isDashing ? 2.5 : 1.0);
      p.vx = inputX * moveSpeed;
      p.vy = inputY * moveSpeed;

      p.x = Math.max(p.radius, Math.min(canvas.width - p.radius, p.x + p.vx));
      p.y = Math.max(p.radius, Math.min(canvas.height - p.radius, p.y + p.vy));

      p.angle = Math.atan2(mousePos.current.y - p.y, mousePos.current.x - p.x);

      // Dash Cooldown Timers
      if (p.isDashing) {
        p.dashTime -= delta;
        if (p.dashTime <= 0) p.isDashing = false;
      }
      if (p.dashCooldown > 0) {
        p.dashCooldown -= delta;
        setDashCd(p.dashCooldown);
      }
      if (p.invulnerableTime > 0) p.invulnerableTime -= delta;

      // 2. Weapon Firing Engine (Plasma Guns & Katana)
      const fireInterval = Math.max(0.12, 0.35 - perks.fireRate * 0.04);
      if (now - lastShotTime.current > fireInterval * 1000) {
        lastShotTime.current = now;
        audioSynth.playLaser();

        const bulletSpeed = 16 + perks.fireRate * 2;
        const dirX = Math.cos(p.angle);
        const dirY = Math.sin(p.angle);

        bulletsRef.current.push({
          id: Math.random().toString(),
          x: p.x + dirX * 20,
          y: p.y + dirY * 20,
          vx: dirX * bulletSpeed,
          vy: dirY * bulletSpeed,
          radius: 4,
          color: "#38bdf8",
          damage: 35 + perks.crit * 8,
          isEnemy: false,
          pierce: 1,
          life: 2.0
        });

        // Katana Arc Strike
        if (perks.katana > 0) {
          audioSynth.playSlash();
          const arcCount = 3 + perks.katana;
          for (let i = 0; i < arcCount; i++) {
            const arcAngle = p.angle + (i - (arcCount - 1) / 2) * 0.35;
            bulletsRef.current.push({
              id: Math.random().toString(),
              x: p.x,
              y: p.y,
              vx: Math.cos(arcAngle) * 12,
              vy: Math.sin(arcAngle) * 12,
              radius: 12,
              color: "#06b6d4",
              damage: 45 + perks.katana * 15,
              isEnemy: false,
              pierce: 3,
              life: 0.3
            });
          }
        }
      }

      // Chain Lightning Passive Arc
      if (perks.lightning > 0 && now - lastLightningTime.current > 2500 - perks.lightning * 300) {
        lastLightningTime.current = now;
        const targetEnemies = enemiesRef.current.slice(0, perks.lightning + 1);
        targetEnemies.forEach((e) => {
          e.hp -= 80;
          particlesRef.current.push({
            id: Math.random().toString(),
            x: e.x,
            y: e.y,
            vx: (Math.random() - 0.5) * 6,
            vy: (Math.random() - 0.5) * 6,
            color: "#f59e0b",
            size: 6,
            life: 0.3,
            maxLife: 0.3
          });
        });
      }

      // 3. Enemy Spawning Logic
      const maxEnemies = 25 + wave * 8;
      if (enemiesRef.current.length < maxEnemies && Math.random() < 0.06) {
        // Spawn from edges
        let spawnX = 0;
        let spawnY = 0;
        if (Math.random() < 0.5) {
          spawnX = Math.random() < 0.5 ? -20 : canvas.width + 20;
          spawnY = Math.random() * canvas.height;
        } else {
          spawnX = Math.random() * canvas.width;
          spawnY = Math.random() < 0.5 ? -20 : canvas.height + 20;
        }

        const types: ("hound" | "shooter" | "tank" | "assassin")[] = ["hound", "shooter", "tank", "assassin"];
        const chosenType = types[Math.floor(Math.random() * types.length)];

        let hp = 40 + wave * 12;
        let speed = 2.8 + Math.random() * 1.2;
        let radius = 14;
        let color = "#ef4444";
        let xpValue = 20;

        if (chosenType === "tank") {
          hp = 160 + wave * 40;
          speed = 1.4;
          radius = 24;
          color = "#f43f5e";
          xpValue = 50;
        } else if (chosenType === "assassin") {
          hp = 30;
          speed = 4.5;
          radius = 12;
          color = "#a855f7";
          xpValue = 35;
        }

        enemiesRef.current.push({
          id: Math.random().toString(),
          type: chosenType,
          x: spawnX,
          y: spawnY,
          vx: 0,
          vy: 0,
          radius,
          speed,
          hp,
          maxHp: hp,
          damage: chosenType === "tank" ? 25 : 12,
          color,
          shootTimer: 0,
          xpValue
        });
      }

      // Boss Spawning Trigger (Wave 5 & 10)
      if (survivalTime > 120 && !isBossSpawned.current) {
        isBossSpawned.current = true;
        setWave(5);
        enemiesRef.current.push({
          id: "NEXUS_OVERLORD_2D",
          type: "boss",
          x: canvas.width / 2,
          y: -50,
          vx: 0,
          vy: 0,
          radius: 45,
          speed: 1.2,
          hp: 1500,
          maxHp: 1500,
          damage: 35,
          color: "#f59e0b",
          shootTimer: 0,
          xpValue: 500
        });
      }

      // 4. Update Enemies & AI Steering
      enemiesRef.current.forEach((e) => {
        const dx = p.x - e.x;
        const dy = p.y - e.y;
        const dist = Math.hypot(dx, dy);

        if (dist > 0) {
          e.vx = (dx / dist) * e.speed;
          e.vy = (dy / dist) * e.speed;
        }

        e.x += e.vx;
        e.y += e.vy;

        // Enemy Shooting AI
        if (e.type === "shooter" || e.type === "boss") {
          e.shootTimer += delta;
          const threshold = e.type === "boss" ? 0.6 : 2.2;
          if (e.shootTimer > threshold) {
            e.shootTimer = 0;
            const bAngle = Math.atan2(p.y - e.y, p.x - e.x);

            if (e.type === "boss") {
              // Radial Ring Shot
              for (let a = 0; a < Math.PI * 2; a += Math.PI / 4) {
                bulletsRef.current.push({
                  id: Math.random().toString(),
                  x: e.x,
                  y: e.y,
                  vx: Math.cos(a) * 6,
                  vy: Math.sin(a) * 6,
                  radius: 6,
                  color: "#f59e0b",
                  damage: 18,
                  isEnemy: true,
                  pierce: 1,
                  life: 4.0
                });
              }
            } else {
              bulletsRef.current.push({
                id: Math.random().toString(),
                x: e.x,
                y: e.y,
                vx: Math.cos(bAngle) * 7,
                vy: Math.sin(bAngle) * 7,
                radius: 5,
                color: "#ef4444",
                damage: 14,
                isEnemy: true,
                pierce: 1,
                life: 3.0
              });
            }
          }
        }

        // Enemy vs Player Body Collision
        if (dist < e.radius + p.radius && p.invulnerableTime <= 0 && !p.isDashing) {
          p.hp -= e.damage;
          p.invulnerableTime = 0.6;
          setPlayerHp(p.hp);
          shakeRef.current = 8;
          if (p.hp <= 0) {
            audioSynth.playGameOver();
            setGameState("gameover");
          }
        }
      });

      // 5. Update Bullets & Collisions
      bulletsRef.current.forEach((b) => {
        b.x += b.vx;
        b.y += b.vy;
        b.life -= delta;

        // Player Bullet vs Enemy
        if (!b.isEnemy) {
          enemiesRef.current.forEach((e) => {
            const dist = Math.hypot(b.x - e.x, b.y - e.y);
            if (dist < b.radius + e.radius) {
              e.hp -= b.damage;
              b.pierce -= 1;

              // Spark particles
              for (let i = 0; i < 3; i++) {
                particlesRef.current.push({
                  id: Math.random().toString(),
                  x: b.x,
                  y: b.y,
                  vx: (Math.random() - 0.5) * 6,
                  vy: (Math.random() - 0.5) * 6,
                  color: b.color,
                  size: 3,
                  life: 0.2,
                  maxLife: 0.2
                });
              }
            }
          });
        } else {
          // Enemy Bullet vs Player
          const dist = Math.hypot(b.x - p.x, b.y - p.y);
          if (dist < b.radius + p.radius && p.invulnerableTime <= 0 && !p.isDashing) {
            p.hp -= b.damage;
            p.invulnerableTime = 0.5;
            b.life = 0;
            setPlayerHp(p.hp);
            shakeRef.current = 6;
            if (p.hp <= 0) {
              audioSynth.playGameOver();
              setGameState("gameover");
            }
          }
        }
      });

      bulletsRef.current = bulletsRef.current.filter((b) => b.life > 0 && b.pierce > 0);

      // Handle Enemy Deaths & Drop XP Gems
      enemiesRef.current.forEach((e) => {
        if (e.hp <= 0) {
          audioSynth.playExplosion(e.type === "boss");
          setScore((s) => s + e.xpValue * 10);
          setKills((k) => k + 1);

          // Drop XP Gem
          xpGemsRef.current.push({
            id: Math.random().toString(),
            x: e.x,
            y: e.y,
            value: e.xpValue
          });

          // Explosion Particle Burst
          for (let i = 0; i < (e.type === "boss" ? 30 : 10); i++) {
            particlesRef.current.push({
              id: Math.random().toString(),
              x: e.x,
              y: e.y,
              vx: (Math.random() - 0.5) * 10,
              vy: (Math.random() - 0.5) * 10,
              color: e.color,
              size: e.type === "boss" ? 8 : 4,
              life: 0.4,
              maxLife: 0.4
            });
          }
        }
      });

      enemiesRef.current = enemiesRef.current.filter((e) => e.hp > 0);

      // 6. XP Gems Collection & Level Up Logic
      xpGemsRef.current.forEach((gem) => {
        const dist = Math.hypot(gem.x - p.x, gem.y - p.y);
        if (dist < 120) {
          // Magnetize towards player
          gem.x += (p.x - gem.x) * 0.15;
          gem.y += (p.y - gem.y) * 0.15;
        }
        if (dist < p.radius + 10) {
          audioSynth.playXp();
          gem.value = 0; // Mark collected
          p.xp += gem.value;

          setPlayerXp((currXp) => {
            const nextXp = currXp + 25;
            if (nextXp >= p.nextXp) {
              p.level += 1;
              p.nextXp = Math.floor(p.nextXp * 1.4);
              setPlayerLevel(p.level);
              setNextLevelXp(p.nextXp);
              triggerLevelUp();
              return 0;
            }
            return nextXp;
          });
        }
      });

      xpGemsRef.current = xpGemsRef.current.filter((gem) => gem.value > 0);

      // 7. Update Particles
      particlesRef.current.forEach((part) => {
        part.x += part.vx;
        part.y += part.vy;
        part.life -= delta;
      });
      particlesRef.current = particlesRef.current.filter((part) => part.life > 0);

      // Screen Shake decay
      shakeRef.current = Math.max(0, shakeRef.current - delta * 20);

      // ==========================================
      // 8. CANVAS RENDER PHASE
      // ==========================================
      ctx.save();
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Apply Camera Shake Offset
      if (shakeRef.current > 0) {
        ctx.translate((Math.random() - 0.5) * shakeRef.current, (Math.random() - 0.5) * shakeRef.current);
      }

      // Draw Grid Background Pattern
      ctx.strokeStyle = "rgba(56, 189, 248, 0.08)";
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

      // Draw XP Gems
      xpGemsRef.current.forEach((gem) => {
        ctx.fillStyle = "#38bdf8";
        ctx.shadowColor = "#38bdf8";
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.arc(gem.x, gem.y, 4, 0, Math.PI * 2);
        ctx.fill();
      });

      // Draw Particles
      particlesRef.current.forEach((part) => {
        ctx.fillStyle = part.color;
        ctx.globalAlpha = part.life / part.maxLife;
        ctx.beginPath();
        ctx.arc(part.x, part.y, part.size, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.globalAlpha = 1.0;

      // Draw Bullets
      bulletsRef.current.forEach((b) => {
        ctx.fillStyle = b.color;
        ctx.shadowColor = b.color;
        ctx.shadowBlur = 12;
        ctx.beginPath();
        ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
        ctx.fill();
      });

      // Draw Enemies
      enemiesRef.current.forEach((e) => {
        ctx.fillStyle = e.color;
        ctx.shadowColor = e.color;
        ctx.shadowBlur = e.type === "boss" ? 25 : 10;

        ctx.beginPath();
        if (e.type === "boss") {
          ctx.arc(e.x, e.y, e.radius, 0, Math.PI * 2);
        } else if (e.type === "tank") {
          ctx.rect(e.x - e.radius, e.y - e.radius, e.radius * 2, e.radius * 2);
        } else {
          ctx.arc(e.x, e.y, e.radius, 0, Math.PI * 2);
        }
        ctx.fill();

        // Enemy Health Bar
        if (e.hp < e.maxHp) {
          ctx.fillStyle = "rgba(0,0,0,0.6)";
          ctx.fillRect(e.x - e.radius, e.y - e.radius - 8, e.radius * 2, 4);
          ctx.fillStyle = "#ef4444";
          ctx.fillRect(e.x - e.radius, e.y - e.radius - 8, (e.radius * 2 * e.hp) / e.maxHp, 4);
        }
      });

      // Draw Player Hero & Directional Cannon
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.angle);

      // Player Force Shield Aura
      if (perks.shield > 0) {
        ctx.strokeStyle = "rgba(6, 182, 212, 0.4)";
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(0, 0, p.radius + 8, 0, Math.PI * 2);
        ctx.stroke();
      }

      // Hero Outer Body
      ctx.fillStyle = p.invulnerableTime > 0 ? "#f43f5e" : "#0284c7";
      ctx.shadowColor = "#38bdf8";
      ctx.shadowBlur = 15;
      ctx.beginPath();
      ctx.arc(0, 0, p.radius, 0, Math.PI * 2);
      ctx.fill();

      // Cyber Gun Barrel
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, -3, p.radius + 10, 6);
      ctx.restore();

      ctx.restore();

      animId = requestAnimationFrame(gameLoop);
    };

    animId = requestAnimationFrame(gameLoop);

    return () => cancelAnimationFrame(animId);
  }, [gameState, wave, perks]);

  // Restart Game Function
  const restartGame = () => {
    setScore(0);
    setSurvivalTime(0);
    setKills(0);
    setWave(1);
    setPlayerHp(100);
    setPlayerMaxHp(100);
    setPlayerLevel(1);
    setPlayerXp(0);
    setNextLevelXp(100);
    setPerks({ katana: 1, fireRate: 0, drone: 0, lightning: 0, shield: 0, speed: 0, crit: 0, maxHp: 0 });

    playerRef.current = {
      x: 600,
      y: 400,
      vx: 0,
      vy: 0,
      radius: 16,
      speed: 5,
      hp: 100,
      maxHp: 100,
      level: 1,
      xp: 0,
      nextXp: 100,
      dashCooldown: 0,
      isDashing: false,
      dashTime: 0,
      angle: 0,
      invulnerableTime: 0
    };

    enemiesRef.current = [];
    bulletsRef.current = [];
    particlesRef.current = [];
    xpGemsRef.current = [];
    isBossSpawned.current = false;
    setGameState("playing");
  };

  return (
    <div className="fixed inset-0 z-[400] bg-zinc-950 text-white font-sans overflow-hidden select-none">
      {/* 2D HTML5 Canvas Layer */}
      <canvas ref={canvasRef} width={1280} height={720} className="w-full h-full object-cover block" />

      {/* LIVE COMBAT HUD */}
      {gameState === "playing" && (
        <div className="absolute inset-0 pointer-events-none p-6 flex flex-col justify-between z-10">
          {/* Top Bar Status */}
          <div className="flex justify-between items-start">
            {/* Health & XP Meters */}
            <div className="space-y-3 bg-black/60 backdrop-blur-xl border border-white/10 p-4 rounded-2xl w-80 pointer-events-auto shadow-2xl">
              <div className="flex items-center justify-between text-xs font-black tracking-widest uppercase">
                <span className="flex items-center gap-1.5 text-rose-400">
                  <Heart className="w-4 h-4 fill-rose-500" /> HULL INTEGRITY
                </span>
                <span className="tabular-nums">
                  {Math.ceil(playerHp)} / {playerMaxHp}
                </span>
              </div>
              <div className="w-full h-3 bg-zinc-900 rounded-full overflow-hidden border border-white/10">
                <div
                  className="h-full bg-gradient-to-r from-rose-600 to-red-500 transition-all duration-200"
                  style={{ width: `${(playerHp / playerMaxHp) * 100}%` }}
                />
              </div>

              <div className="flex items-center justify-between text-[11px] font-black tracking-widest uppercase pt-1">
                <span className="flex items-center gap-1 text-cyan-400">
                  <TrendingUp className="w-3.5 h-3.5" /> LEVEL {playerLevel}
                </span>
                <span className="text-white/60 tabular-nums">
                  {playerXp} / {nextLevelXp} XP
                </span>
              </div>
              <div className="w-full h-2 bg-zinc-900 rounded-full overflow-hidden border border-white/10">
                <div
                  className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 transition-all duration-150"
                  style={{ width: `${(playerXp / nextLevelXp) * 100}%` }}
                />
              </div>
            </div>

            {/* Score & Survival Timer */}
            <div className="flex flex-col items-center pointer-events-auto">
              <div className="bg-black/70 backdrop-blur-md border border-white/10 px-8 py-2 rounded-full text-center shadow-2xl">
                <div className="text-[10px] font-black uppercase tracking-[0.3em] text-cyan-400">SURVIVAL SCORE</div>
                <div className="text-4xl font-black italic tracking-tighter text-white tabular-nums">{score}</div>
              </div>
              <div className="mt-2 bg-white/10 backdrop-blur-md border border-white/10 text-white text-[11px] font-black uppercase tracking-widest px-4 py-1 rounded-full shadow-lg">
                Time: {Math.floor(survivalTime / 60)}:{("0" + (survivalTime % 60)).slice(-2)}
              </div>
            </div>

            {/* Ability Cooldowns */}
            <div className="flex items-center gap-3 pointer-events-auto">
              <div className="bg-black/60 backdrop-blur-xl border border-white/10 p-3 rounded-2xl text-center space-y-1">
                <div className="text-[10px] font-black uppercase text-cyan-400">DASH [SPACE]</div>
                <div className="text-xs font-black">{dashCd > 0 ? `${dashCd.toFixed(1)}s` : "READY"}</div>
              </div>
              <div className="bg-black/60 backdrop-blur-xl border border-white/10 p-3 rounded-2xl text-center space-y-1">
                <div className="text-[10px] font-black uppercase text-purple-400">EMP PULSE [E]</div>
                <div className="text-xs font-black">{overdriveCd > 0 ? `${overdriveCd}s` : "READY"}</div>
              </div>
              <button
                onClick={() => setGameState("paused")}
                className="w-11 h-11 rounded-2xl bg-black/60 backdrop-blur-xl border border-white/10 flex items-center justify-center hover:bg-white/20 transition-all"
              >
                <Pause className="w-5 h-5 text-white" />
              </button>
            </div>
          </div>

          {/* Controls Legend */}
          <div className="text-[11px] font-bold text-white/50 bg-black/50 p-3 rounded-xl backdrop-blur-md border border-white/5 self-start">
            [WASD] Move Cyber Hero | [MOUSE] Aim Cannon | [SPACE] Dash Roll | [E] Overdrive EMP
          </div>
        </div>
      )}

      {/* START MENU OVERLAY */}
      {gameState === "menu" && (
        <div className="absolute inset-0 z-50 bg-black/90 backdrop-blur-2xl flex flex-col items-center justify-center p-8 text-center">
          <motion.div initial={{ y: -30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="max-w-2xl space-y-6">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs font-black uppercase tracking-widest">
              <Sparkles className="w-4 h-4" /> 2D Top-Down Cyberpunk Survivor
            </div>
            <h1 className="text-6xl md:text-7xl font-black italic tracking-tighter uppercase bg-gradient-to-r from-cyan-400 via-sky-200 to-purple-500 bg-clip-text text-transparent drop-shadow-[0_0_35px_rgba(56,189,248,0.4)]">
              CYBER NEXUS SURVIVOR
            </h1>
            <p className="text-white/70 text-base md:text-lg max-w-lg mx-auto font-medium leading-relaxed">
              Survive endless armadas of rogue mechs. Collect XP crystals, unlock game-changing cyber perks, and defeat sector dreadnought bosses.
            </p>

            <div className="flex justify-center gap-8 py-2">
              <div className="flex items-center gap-3 bg-white/5 border border-white/10 px-6 py-3 rounded-2xl">
                <Trophy className="w-6 h-6 text-amber-400" />
                <div className="text-left">
                  <div className="text-[10px] font-black uppercase tracking-widest text-white/50">High Score</div>
                  <div className="text-xl font-black text-white">{highScore}</div>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
              <button
                onClick={() => setGameState("playing")}
                className="px-10 py-5 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-full font-black text-lg uppercase tracking-widest hover:scale-105 transition-all shadow-[0_0_50px_rgba(6,182,212,0.5)] flex items-center justify-center gap-3"
              >
                <Play className="w-6 h-6 fill-white" /> Start Survival Mode
              </button>
            </div>

            <div className="pt-6">
              <Link href="/games" className="text-xs font-black uppercase tracking-widest text-white/40 hover:text-white transition-colors flex items-center justify-center gap-2">
                <ArrowLeft className="w-4 h-4" /> Return to Games Hub
              </Link>
            </div>
          </motion.div>
        </div>
      )}

      {/* LEVEL UP PERK SELECTOR MODAL */}
      {gameState === "levelup" && (
        <div className="absolute inset-0 z-50 bg-black/85 backdrop-blur-2xl flex flex-col items-center justify-center p-8 text-center">
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="max-w-3xl w-full space-y-6">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-black uppercase tracking-widest">
              <Zap className="w-4 h-4" /> LEVEL UP ACHIEVED
            </div>
            <h2 className="text-4xl font-black italic tracking-tighter uppercase text-white">CHOOSE A CYBER UPGRADE</h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
              {availableUpgrades.map((upg) => (
                <div
                  key={upg.id}
                  onClick={() => selectUpgrade(upg.id)}
                  className="bg-white/5 border border-white/10 hover:border-cyan-400 p-6 rounded-3xl text-left cursor-pointer transition-all hover:scale-105 hover:bg-white/10 flex flex-col justify-between space-y-4 shadow-2xl group"
                >
                  <div className="space-y-2">
                    <div className="w-12 h-12 rounded-2xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center group-hover:bg-cyan-500 group-hover:text-black transition-colors">
                      <Cpu className="w-6 h-6 text-cyan-400 group-hover:text-black" />
                    </div>
                    <div className="font-black text-lg text-white uppercase pt-2">{upg.name}</div>
                    <div className="text-xs text-white/60 leading-relaxed font-medium">{upg.description}</div>
                  </div>
                  <div className="text-[10px] font-black uppercase tracking-widest text-cyan-400 bg-cyan-500/10 px-3 py-1.5 rounded-xl self-start">
                    Rank {upg.level + 1} / {upg.maxLevel}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      )}

      {/* GAME OVER OVERLAY */}
      {gameState === "gameover" && (
        <div className="absolute inset-0 z-50 bg-black/95 backdrop-blur-3xl flex flex-col items-center justify-center p-8 text-center">
          <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="max-w-lg w-full space-y-6">
            <div className="w-20 h-20 bg-rose-500/20 border-2 border-rose-500 rounded-3xl mx-auto flex items-center justify-center">
              <Skull className="w-10 h-10 text-rose-500" />
            </div>
            <h2 className="text-5xl font-black italic tracking-tighter uppercase text-rose-500">HERO DEFEATED</h2>
            <p className="text-white/60 text-sm font-bold uppercase tracking-widest">Sector Matrix Overrun</p>

            <div className="bg-white/5 border border-white/10 p-6 rounded-3xl space-y-3 text-left">
              <div className="flex justify-between text-sm">
                <span className="text-white/50">Final Score:</span>
                <span className="font-black text-lg text-cyan-400">{score}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-white/50">Survival Duration:</span>
                <span className="font-bold">
                  {Math.floor(survivalTime / 60)}m {survivalTime % 60}s
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-white/50">Enemies Defeated:</span>
                <span className="font-bold">{kills}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-white/50">Level Reached:</span>
                <span className="font-bold">Level {playerLevel}</span>
              </div>
            </div>

            <div className="flex gap-4 pt-4">
              <button
                onClick={restartGame}
                className="flex-1 py-5 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-2xl font-black text-sm uppercase tracking-widest hover:scale-105 transition-all shadow-lg flex items-center justify-center gap-2"
              >
                <RefreshCw className="w-5 h-5" /> Retry Survival
              </button>
              <button
                onClick={() => setGameState("menu")}
                className="py-5 px-8 bg-white/10 border border-white/20 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-white/20 transition-all"
              >
                Exit
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
