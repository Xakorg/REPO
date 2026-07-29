"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Trophy,
  Zap,
  Shield,
  Play,
  RotateCcw,
  Volume2,
  VolumeX,
  Flame,
  Target,
  Crosshair,
  Award,
  Pause,
  Maximize2,
  Rocket,
  ShieldAlert,
  Cpu,
  RefreshCw,
  Sparkles as SparklesIcon,
  ChevronRight,
  Activity,
  ZapOff,
  Crosshair as CrosshairIcon
} from "lucide-react";
import Link from "next/link";

// ==========================================
// 1. SOUND SYNTHESIZER (WEB AUDIO API)
// ==========================================
class SoundSynth {
  ctx: AudioContext | null = null;
  muted: boolean = false;

  constructor() {
    // Lazy initialized on first user click
  }

  private getContext(): AudioContext | null {
    if (typeof window === "undefined") return null;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === "suspended") {
      this.ctx.resume();
    }
    return this.ctx;
  }

  playShoot() {
    if (this.muted) return;
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(800, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.1);

      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.1);
    } catch {
      // Audio fallback swallow
    }
  }

  playExplosion() {
    if (this.muted) return;
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const bufferSize = ctx.sampleRate * 0.25;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }

      const noise = ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = ctx.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.setValueAtTime(1200, ctx.currentTime);
      filter.frequency.exponentialRampToValueAtTime(80, ctx.currentTime + 0.25);

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.25);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      noise.start();
      noise.stop(ctx.currentTime + 0.25);
    } catch {
      // Ignore audio errors
    }
  }

  playPowerup() {
    if (this.muted) return;
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const notes = [440, 554.37, 659.25, 880];
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.05);

        gain.gain.setValueAtTime(0.12, ctx.currentTime + idx * 0.05);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + idx * 0.05 + 0.15);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(ctx.currentTime + idx * 0.05);
        osc.stop(ctx.currentTime + idx * 0.05 + 0.15);
      });
    } catch {
      // Ignore
    }
  }

  playBossWarning() {
    if (this.muted) return;
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(150, ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(80, ctx.currentTime + 0.5);

      gain.gain.setValueAtTime(0.25, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.5);
    } catch {
      // Ignore
    }
  }
}

const audioSynth = new SoundSynth();

// ==========================================
// 2. TYPES & INTERFACES
// ==========================================
type MechClass = "titan" | "scout" | "berserker";

interface MechConfig {
  name: string;
  subtitle: string;
  color: string;
  speed: number;
  maxHp: number;
  maxShield: number;
  fireRate: number;
  weaponType: string;
  desc: string;
}

const MECH_CLASSES: Record<MechClass, MechConfig> = {
  titan: {
    name: "Aegis Prime",
    subtitle: "Heavy Vanguard Mech",
    color: "#00f0ff",
    speed: 4.2,
    maxHp: 150,
    maxShield: 100,
    fireRate: 150, // ms
    weaponType: "Twin Plasma Cannons",
    desc: "Reinforced hull plating and energy shields. Built for relentless survival."
  },
  scout: {
    name: "Vector Phantom",
    subtitle: "High-Speed Recon Mech",
    color: "#ff007f",
    speed: 6.0,
    maxHp: 90,
    maxShield: 60,
    fireRate: 100,
    weaponType: "Hyper Pulse Laser",
    desc: "Unmatched mobility and rapid-fire pulse lasers. High risk, lethal output."
  },
  berserker: {
    name: "Vortex Destroyer",
    subtitle: "Heavy Assault Mech",
    color: "#7000ff",
    speed: 4.8,
    maxHp: 120,
    maxShield: 80,
    fireRate: 130,
    weaponType: "Scatter Shot Cannon",
    desc: "Unleashes destructive shotgun spreads that obliterate enemy armadas."
  }
};

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  alpha: number;
  decay: number;
}

interface Bullet {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  radius: number;
  damage: number;
  isEnemy: boolean;
  pierce: number;
}

interface Enemy {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  hp: number;
  maxHp: number;
  speed: number;
  radius: number;
  color: string;
  type: "drone" | "shooter" | "heavy" | "boss";
  scoreValue: number;
  lastShootTime?: number;
}

interface Gem {
  id: string;
  x: number;
  y: number;
  value: number;
  color: string;
  radius: number;
}

interface UpgradeOption {
  id: string;
  name: string;
  category: "weapon" | "defense" | "utility";
  level: number;
  desc: string;
  icon: string;
}

const UPGRADE_POOL: UpgradeOption[] = [
  { id: "multishot", name: "Multi-Cannon Upgrade", category: "weapon", level: 1, desc: "Adds additional projectile barrel streams.", icon: "Target" },
  { id: "rapidfire", name: "Overclocked Servos", category: "weapon", level: 1, desc: "Increases attack firing rate by 25%.", icon: "Zap" },
  { id: "plasma_beam", name: "Piercing Plasma Core", category: "weapon", level: 1, desc: "Bullets now pierce through multiple foes.", icon: "Flame" },
  { id: "drone_turret", name: "Orbital Defense Drone", category: "utility", level: 1, desc: "Deploys a companion drone that targets nearby enemies.", icon: "Cpu" },
  { id: "max_shield", name: "Quantum Matrix Shield", category: "defense", level: 1, desc: "Boosts max shield by 40 and speeds up regen.", icon: "Shield" },
  { id: "emp_nova", name: "EMP Blast Module", category: "weapon", level: 1, desc: "Emits a localized shockwave every 5 seconds.", icon: "ZapOff" },
  { id: "nanite_repair", name: "Self-Healing Nanites", category: "defense", level: 1, desc: "Regenerates hull integrity over time.", icon: "Activity" }
];

// ==========================================
// 3. MAIN COMPONENT
// ==========================================
export default function TitanMechSurvivalGame() {
  const [gameState, setGameState] = useState<"menu" | "playing" | "paused" | "upgrade" | "gameover">("menu");
  const [selectedClass, setSelectedClass] = useState<MechClass>("titan");
  const [score, setScore] = useState<number>(0);
  const [highScore, setHighScore] = useState<number>(0);
  const [level, setLevel] = useState<number>(1);
  const [xp, setXp] = useState<number>(0);
  const [xpToNextLevel, setXpToNextLevel] = useState<number>(100);
  const [wave, setWave] = useState<number>(1);
  const [kills, setKills] = useState<number>(0);
  const [survivalTime, setSurvivalTime] = useState<number>(0);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [availableUpgrades, setAvailableUpgrades] = useState<UpgradeOption[]>([]);

  // Player Stats Live
  const [playerHp, setPlayerHp] = useState<number>(150);
  const [playerShield, setPlayerShield] = useState<number>(100);

  // Upgrade Levels Tracked
  const upgradesRef = useRef<Record<string, number>>({
    multishot: 0,
    rapidfire: 0,
    plasma_beam: 0,
    drone_turret: 0,
    max_shield: 0,
    emp_nova: 0,
    nanite_repair: 0
  });

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Gameplay Engine References
  const engineRef = useRef({
    player: {
      x: 0,
      y: 0,
      vx: 0,
      vy: 0,
      angle: 0,
      hp: 150,
      maxHp: 150,
      shield: 100,
      maxShield: 100,
      speed: 4.2,
      lastShoot: 0,
      dashCd: 0
    },
    keys: {} as Record<string, boolean>,
    mouse: { x: 0, y: 0 },
    bullets: [] as Bullet[],
    enemies: [] as Enemy[],
    particles: [] as Particle[],
    gems: [] as Gem[],
    droneAngle: 0,
    lastEmpTime: 0,
    lastNaniteTime: 0,
    cameraShake: 0,
    waveStartTime: 0,
    enemySpawnCounter: 0
  });

  // Load High Score
  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("titan_mech_high_score");
      if (saved) setHighScore(parseInt(saved, 10));
    }
  }, []);

  // Update High Score
  const checkAndUpdateHighScore = useCallback((finalScore: number) => {
    if (finalScore > highScore) {
      setHighScore(finalScore);
      if (typeof window !== "undefined") {
        localStorage.setItem("titan_mech_high_score", finalScore.toString());
      }
    }
  }, [highScore]);

  // Handle Mute Toggle
  const toggleMute = () => {
    audioSynth.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  // Start / Reset Game
  const startGame = () => {
    const mech = MECH_CLASSES[selectedClass];
    setScore(0);
    setLevel(1);
    setXp(0);
    setXpToNextLevel(100);
    setWave(1);
    setKills(0);
    setSurvivalTime(0);
    setPlayerHp(mech.maxHp);
    setPlayerShield(mech.maxShield);

    upgradesRef.current = {
      multishot: 0,
      rapidfire: 0,
      plasma_beam: 0,
      drone_turret: 0,
      max_shield: 0,
      emp_nova: 0,
      nanite_repair: 0
    };

    engineRef.current.player = {
      x: window.innerWidth / 2,
      y: window.innerHeight / 2,
      vx: 0,
      vy: 0,
      angle: 0,
      hp: mech.maxHp,
      maxHp: mech.maxHp,
      shield: mech.maxShield,
      maxShield: mech.maxShield,
      speed: mech.speed,
      lastShoot: 0,
      dashCd: 0
    };

    engineRef.current.bullets = [];
    engineRef.current.enemies = [];
    engineRef.current.particles = [];
    engineRef.current.gems = [];
    engineRef.current.waveStartTime = Date.now();

    setGameState("playing");
  };

  // Trigger Upgrade Modal
  const triggerUpgradeChoice = () => {
    // Pick 3 random upgrades from pool
    const shuffled = [...UPGRADE_POOL].sort(() => 0.5 - Math.random());
    setAvailableUpgrades(shuffled.slice(0, 3));
    setGameState("upgrade");
  };

  const selectUpgrade = (upgradeId: string) => {
    upgradesRef.current[upgradeId] = (upgradesRef.current[upgradeId] || 0) + 1;

    // Apply immediate effects
    const p = engineRef.current.player;
    if (upgradeId === "max_shield") {
      p.maxShield += 40;
      p.shield += 40;
      setPlayerShield(p.shield);
    }
    audioSynth.playPowerup();
    setGameState("playing");
  };

  // Main Render & Physics Loop
  useEffect(() => {
    if (gameState !== "playing") return;

    let animId: number;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Resize canvas
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const handleKeyDown = (e: KeyboardEvent) => {
      engineRef.current.keys[e.key.toLowerCase()] = true;
      if (e.key === "p" || e.key === "P" || e.key === "Escape") {
        setGameState("paused");
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      engineRef.current.keys[e.key.toLowerCase()] = false;
    };

    const handleMouseMove = (e: MouseEvent) => {
      engineRef.current.mouse.x = e.clientX;
      engineRef.current.mouse.y = e.clientY;
    };

    const handleMouseDown = (e: MouseEvent) => {
      if (e.button === 0) {
        shootWeapon();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mousedown", handleMouseDown);

    // Spawn Shoot function
    function shootWeapon() {
      const p = engineRef.current.player;
      const now = Date.now();
      const fireRateBonus = upgradesRef.current.rapidfire * 0.2;
      const effectiveFireRate = MECH_CLASSES[selectedClass].fireRate * (1 - fireRateBonus);

      if (now - p.lastShoot < effectiveFireRate) return;
      p.lastShoot = now;

      audioSynth.playShoot();

      const dx = engineRef.current.mouse.x - p.x;
      const dy = engineRef.current.mouse.y - p.y;
      const baseAngle = Math.atan2(dy, dx);

      const multishotLevel = upgradesRef.current.multishot;
      const numStreams = 1 + multishotLevel;
      const spreadAngle = 0.15;

      for (let i = 0; i < numStreams; i++) {
        const offset = (i - (numStreams - 1) / 2) * spreadAngle;
        const angle = baseAngle + offset;
        const speed = 14;

        engineRef.current.bullets.push({
          id: Math.random().toString(),
          x: p.x,
          y: p.y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          color: MECH_CLASSES[selectedClass].color,
          radius: 4 + multishotLevel,
          damage: 25 + multishotLevel * 10,
          isEnemy: false,
          pierce: 1 + upgradesRef.current.plasma_beam
        });
      }
    }

    // Main Frame Loop
    const loop = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const p = engineRef.current.player;
      const keys = engineRef.current.keys;
      const now = Date.now();

      // Camera shake effect offset
      let shakeX = 0;
      let shakeY = 0;
      if (engineRef.current.cameraShake > 0) {
        shakeX = (Math.random() - 0.5) * engineRef.current.cameraShake;
        shakeY = (Math.random() - 0.5) * engineRef.current.cameraShake;
        engineRef.current.cameraShake *= 0.9;
      }

      ctx.save();
      ctx.translate(shakeX, shakeY);

      // Draw Grid Background
      ctx.strokeStyle = "rgba(0, 240, 255, 0.07)";
      ctx.lineWidth = 1;
      const gridSize = 60;
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

      // Movement Input Processing
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

      p.x += moveX * p.speed;
      p.y += moveY * p.speed;

      // Keep within bounds
      p.x = Math.max(25, Math.min(canvas.width - 25, p.x));
      p.y = Math.max(25, Math.min(canvas.height - 25, p.y));

      // Player Aim Angle
      const aimDx = engineRef.current.mouse.x - p.x;
      const aimDy = engineRef.current.mouse.y - p.y;
      p.angle = Math.atan2(aimDy, aimDx);

      // Auto Fire when mouse held
      if (keys[" "] || keys["mouse0"]) {
        shootWeapon();
      }

      // Nanite Regeneration
      if (upgradesRef.current.nanite_repair > 0 && now - engineRef.current.lastNaniteTime > 2000) {
        engineRef.current.lastNaniteTime = now;
        if (p.hp < p.maxHp) {
          p.hp = Math.min(p.maxHp, p.hp + 5 * upgradesRef.current.nanite_repair);
          setPlayerHp(p.hp);
        }
      }

      // EMP Blast Skill
      if (upgradesRef.current.emp_nova > 0 && now - engineRef.current.lastEmpTime > 5000) {
        engineRef.current.lastEmpTime = now;
        audioSynth.playBossWarning();

        // Emit shockwave particles
        for (let a = 0; a < Math.PI * 2; a += 0.2) {
          engineRef.current.particles.push({
            x: p.x,
            y: p.y,
            vx: Math.cos(a) * 8,
            vy: Math.sin(a) * 8,
            color: "#00f0ff",
            size: 4,
            alpha: 1,
            decay: 0.03
          });
        }

        // Damage all enemies in blast radius
        engineRef.current.enemies.forEach((e) => {
          const dist = Math.hypot(e.x - p.x, e.y - p.y);
          if (dist < 250) {
            e.hp -= 80 * upgradesRef.current.emp_nova;
          }
        });
      }

      // Orbital Defense Drone
      if (upgradesRef.current.drone_turret > 0) {
        engineRef.current.droneAngle += 0.05;
        const droneDist = 50;
        const droneX = p.x + Math.cos(engineRef.current.droneAngle) * droneDist;
        const droneY = p.y + Math.sin(engineRef.current.droneAngle) * droneDist;

        // Draw Drone
        ctx.fillStyle = "#00f0ff";
        ctx.beginPath();
        ctx.arc(droneX, droneY, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowColor = "#00f0ff";
        ctx.shadowBlur = 10;
        ctx.stroke();

        // Drone auto firing
        if (Math.random() < 0.1 && engineRef.current.enemies.length > 0) {
          const nearest = engineRef.current.enemies[0];
          const dAngle = Math.atan2(nearest.y - droneY, nearest.x - droneX);
          engineRef.current.bullets.push({
            id: Math.random().toString(),
            x: droneX,
            y: droneY,
            vx: Math.cos(dAngle) * 12,
            vy: Math.sin(dAngle) * 12,
            color: "#00f0ff",
            radius: 3,
            damage: 15,
            isEnemy: false,
            pierce: 1
          });
        }
      }

      // Enemy Spawner Logic
      engineRef.current.enemySpawnCounter++;
      const spawnRate = Math.max(30, 90 - wave * 5);
      if (engineRef.current.enemySpawnCounter >= spawnRate) {
        engineRef.current.enemySpawnCounter = 0;

        // Random edge position
        let ex = 0;
        let ey = 0;
        if (Math.random() < 0.5) {
          ex = Math.random() < 0.5 ? -20 : canvas.width + 20;
          ey = Math.random() * canvas.height;
        } else {
          ex = Math.random() * canvas.width;
          ey = Math.random() < 0.5 ? -20 : canvas.height + 20;
        }

        const isBossWave = wave % 5 === 0;
        let type: "drone" | "shooter" | "heavy" | "boss" = "drone";
        const randType = Math.random();

        if (isBossWave && engineRef.current.enemies.filter((e) => e.type === "boss").length === 0) {
          type = "boss";
          audioSynth.playBossWarning();
        } else if (randType > 0.8) {
          type = "heavy";
        } else if (randType > 0.5) {
          type = "shooter";
        }

        const baseHp = type === "boss" ? 1500 * wave : type === "heavy" ? 120 : type === "shooter" ? 50 : 25;
        const color = type === "boss" ? "#ff0000" : type === "heavy" ? "#ffaa00" : type === "shooter" ? "#aa00ff" : "#ff0055";
        const radius = type === "boss" ? 35 : type === "heavy" ? 18 : type === "shooter" ? 12 : 10;
        const speed = type === "boss" ? 1.5 : type === "heavy" ? 1.8 : type === "shooter" ? 2.5 : 3.2;

        engineRef.current.enemies.push({
          id: Math.random().toString(),
          x: ex,
          y: ey,
          vx: 0,
          vy: 0,
          hp: baseHp,
          maxHp: baseHp,
          speed: speed,
          radius: radius,
          color: color,
          type: type,
          scoreValue: type === "boss" ? 1000 : type === "heavy" ? 150 : 50
        });
      }

      // Update & Draw Bullets
      for (let i = engineRef.current.bullets.length - 1; i >= 0; i--) {
        const b = engineRef.current.bullets[i];
        b.x += b.vx;
        b.y += b.vy;

        // Draw bullet
        ctx.fillStyle = b.color;
        ctx.shadowColor = b.color;
        ctx.shadowBlur = 12;
        ctx.beginPath();
        ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
        ctx.fill();

        // Out of bounds cleanup
        if (b.x < -50 || b.x > canvas.width + 50 || b.y < -50 || b.y > canvas.height + 50) {
          engineRef.current.bullets.splice(i, 1);
        }
      }

      // Update & Draw Enemies
      for (let i = engineRef.current.enemies.length - 1; i >= 0; i--) {
        const e = engineRef.current.enemies[i];

        // Move towards player
        const edx = p.x - e.x;
        const edy = p.y - e.y;
        const edist = Math.hypot(edx, edy);

        if (edist > 0) {
          e.x += (edx / edist) * e.speed;
          e.y += (edy / edist) * e.speed;
        }

        // Shooter enemy attack
        if (e.type === "shooter" || e.type === "boss") {
          const nowShoot = Date.now();
          if (!e.lastShootTime) e.lastShootTime = nowShoot;
          const shootInterval = e.type === "boss" ? 1000 : 2500;

          if (nowShoot - e.lastShootTime > shootInterval) {
            e.lastShootTime = nowShoot;
            const bAngle = Math.atan2(edy, edx);
            engineRef.current.bullets.push({
              id: Math.random().toString(),
              x: e.x,
              y: e.y,
              vx: Math.cos(bAngle) * 6,
              vy: Math.sin(bAngle) * 6,
              color: "#ff0055",
              radius: 5,
              damage: e.type === "boss" ? 30 : 15,
              isEnemy: true,
              pierce: 1
            });
          }
        }

        // Collision with Player
        if (edist < e.radius + 20) {
          // Take damage
          let damage = e.type === "boss" ? 40 : 15;
          if (p.shield > 0) {
            const absorbed = Math.min(p.shield, damage);
            p.shield -= absorbed;
            damage -= absorbed;
            setPlayerShield(p.shield);
          }
          if (damage > 0) {
            p.hp -= damage;
            setPlayerHp(p.hp);
            engineRef.current.cameraShake = 15;
          }

          if (p.hp <= 0) {
            // Game Over Trigger
            audioSynth.playExplosion();
            checkAndUpdateHighScore(score);
            setGameState("gameover");
          }
        }

        // Bullet collisions with Enemies
        for (let j = engineRef.current.bullets.length - 1; j >= 0; j--) {
          const b = engineRef.current.bullets[j];
          if (b.isEnemy) {
            // Check hit player
            const pDist = Math.hypot(b.x - p.x, b.y - p.y);
            if (pDist < 20) {
              let damage = b.damage;
              if (p.shield > 0) {
                const absorbed = Math.min(p.shield, damage);
                p.shield -= absorbed;
                damage -= absorbed;
                setPlayerShield(p.shield);
              }
              if (damage > 0) {
                p.hp -= damage;
                setPlayerHp(p.hp);
                engineRef.current.cameraShake = 10;
              }
              engineRef.current.bullets.splice(j, 1);
              if (p.hp <= 0) {
                audioSynth.playExplosion();
                checkAndUpdateHighScore(score);
                setGameState("gameover");
              }
            }
          } else {
            // Check hit enemy
            const bDist = Math.hypot(b.x - e.x, b.y - e.y);
            if (bDist < e.radius + b.radius) {
              e.hp -= b.damage;
              b.pierce--;
              if (b.pierce <= 0) {
                engineRef.current.bullets.splice(j, 1);
              }

              // Sparkles particle effect
              for (let k = 0; k < 4; k++) {
                engineRef.current.particles.push({
                  x: b.x,
                  y: b.y,
                  vx: (Math.random() - 0.5) * 6,
                  vy: (Math.random() - 0.5) * 6,
                  color: b.color,
                  size: Math.random() * 3 + 1,
                  alpha: 1,
                  decay: 0.05
                });
              }

              if (e.hp <= 0) {
                // Enemy Killed!
                audioSynth.playExplosion();
                setKills((prev) => prev + 1);
                setScore((prev) => prev + e.scoreValue);

                // Drop XP Gem
                engineRef.current.gems.push({
                  id: Math.random().toString(),
                  x: e.x,
                  y: e.y,
                  value: e.type === "boss" ? 100 : e.type === "heavy" ? 35 : 15,
                  color: e.type === "boss" ? "#ffcc00" : "#00ffcc",
                  radius: e.type === "boss" ? 8 : 5
                });

                engineRef.current.enemies.splice(i, 1);
                break;
              }
            }
          }
        }

        // Draw Enemy
        ctx.fillStyle = e.color;
        ctx.shadowColor = e.color;
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.arc(e.x, e.y, e.radius, 0, Math.PI * 2);
        ctx.fill();

        // Draw Enemy Health bar if damaged
        if (e.hp < e.maxHp) {
          const barWidth = e.radius * 2;
          ctx.fillStyle = "rgba(255, 255, 255, 0.2)";
          ctx.fillRect(e.x - barWidth / 2, e.y - e.radius - 8, barWidth, 4);
          ctx.fillStyle = "#ff0055";
          ctx.fillRect(e.x - barWidth / 2, e.y - e.radius - 8, barWidth * (e.hp / e.maxHp), 4);
        }
      }

      // Update & Magnetize XP Gems
      for (let i = engineRef.current.gems.length - 1; i >= 0; i--) {
        const g = engineRef.current.gems[i];
        const gDx = p.x - g.x;
        const gDy = p.y - g.y;
        const gDist = Math.hypot(gDx, gDy);

        if (gDist < 120) {
          // Magnetize towards player
          g.x += (gDx / gDist) * 8;
          g.y += (gDy / gDist) * 8;
        }

        if (gDist < 25) {
          // Pick up XP
          setXp((prevXp) => {
            const nextXp = prevXp + g.value;
            if (nextXp >= xpToNextLevel) {
              setLevel((l) => l + 1);
              setXpToNextLevel((prev) => Math.floor(prev * 1.4));
              triggerUpgradeChoice();
              return nextXp - xpToNextLevel;
            }
            return nextXp;
          });
          engineRef.current.gems.splice(i, 1);
          continue;
        }

        // Draw Gem
        ctx.fillStyle = g.color;
        ctx.shadowColor = g.color;
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.arc(g.x, g.y, g.radius, 0, Math.PI * 2);
        ctx.fill();
      }

      // Update Particles
      for (let i = engineRef.current.particles.length - 1; i >= 0; i--) {
        const pt = engineRef.current.particles[i];
        pt.x += pt.vx;
        pt.y += pt.vy;
        pt.alpha -= pt.decay;

        if (pt.alpha <= 0) {
          engineRef.current.particles.splice(i, 1);
          continue;
        }

        ctx.fillStyle = pt.color;
        ctx.globalAlpha = pt.alpha;
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, pt.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
      }

      // Draw Player Titan Mech
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.angle);

      // Mech Body Glow
      ctx.fillStyle = MECH_CLASSES[selectedClass].color;
      ctx.shadowColor = MECH_CLASSES[selectedClass].color;
      ctx.shadowBlur = 20;

      // Draw Mech Chassis
      ctx.beginPath();
      ctx.moveTo(18, 0);
      ctx.lineTo(-12, -14);
      ctx.lineTo(-6, 0);
      ctx.lineTo(-12, 14);
      ctx.closePath();
      ctx.fill();

      // Draw Cannon Barrels
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(8, -8, 12, 3);
      ctx.fillRect(8, 5, 12, 3);

      ctx.restore();

      ctx.restore();

      // Check Wave Timer Progression
      const elapsed = Math.floor((now - engineRef.current.waveStartTime) / 1000);
      setSurvivalTime(elapsed);
      if (elapsed > 0 && elapsed % 30 === 0 && Math.floor(elapsed / 30) + 1 !== wave) {
        setWave(Math.floor(elapsed / 30) + 1);
      }

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mousedown", handleMouseDown);
    };
  }, [gameState, selectedClass, wave, xpToNextLevel, checkAndUpdateHighScore, score]);

  return (
    <div className="relative w-full h-screen overflow-hidden bg-slate-950 text-white font-sans select-none">
      {/* HUD Bar Top */}
      {gameState === "playing" && (
        <div className="absolute top-0 left-0 right-0 z-20 p-4 flex justify-between items-center bg-slate-900/60 backdrop-blur-md border-b border-cyan-500/20">
          <div className="flex items-center space-x-6">
            <Link
              href="/game"
              className="flex items-center space-x-2 text-xs font-mono text-cyan-400 hover:text-cyan-300 transition-colors uppercase tracking-wider bg-slate-800/60 px-3 py-1.5 rounded-lg border border-cyan-500/30"
            >
              <span>&larr; Exit Mission</span>
            </Link>

            {/* Health Bar */}
            <div className="flex items-center space-x-2">
              <Flame className="w-5 h-5 text-red-500" />
              <div className="w-36 h-3 bg-slate-800 rounded-full overflow-hidden border border-red-500/40">
                <div
                  className="h-full bg-gradient-to-r from-red-600 to-orange-500 transition-all duration-200"
                  style={{ width: `${Math.max(0, (playerHp / MECH_CLASSES[selectedClass].maxHp) * 100)}%` }}
                />
              </div>
              <span className="text-xs font-mono text-slate-300">{Math.ceil(playerHp)} HP</span>
            </div>

            {/* Shield Bar */}
            <div className="flex items-center space-x-2">
              <Shield className="w-5 h-5 text-cyan-400" />
              <div className="w-36 h-3 bg-slate-800 rounded-full overflow-hidden border border-cyan-500/40">
                <div
                  className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 transition-all duration-200"
                  style={{ width: `${Math.max(0, (playerShield / MECH_CLASSES[selectedClass].maxShield) * 100)}%` }}
                />
              </div>
              <span className="text-xs font-mono text-slate-300">{Math.ceil(playerShield)} SHIELD</span>
            </div>
          </div>

          {/* Center Stats */}
          <div className="flex items-center space-x-8 font-mono">
            <div className="text-center">
              <div className="text-[10px] text-slate-400 uppercase tracking-widest">Score</div>
              <div className="text-lg font-bold text-cyan-400">{score.toLocaleString()}</div>
            </div>
            <div className="text-center">
              <div className="text-[10px] text-slate-400 uppercase tracking-widest">Sector Wave</div>
              <div className="text-lg font-bold text-amber-400">WAVE {wave}</div>
            </div>
            <div className="text-center">
              <div className="text-[10px] text-slate-400 uppercase tracking-widest">Kills</div>
              <div className="text-lg font-bold text-emerald-400">{kills}</div>
            </div>
          </div>

          {/* Audio & Pause Controls */}
          <div className="flex items-center space-x-3">
            <button
              onClick={toggleMute}
              className="p-2 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 transition-colors border border-cyan-500/30"
            >
              {isMuted ? <VolumeX className="w-5 h-5 text-red-400" /> : <Volume2 className="w-5 h-5 text-cyan-400" />}
            </button>
            <button
              onClick={() => setGameState("paused")}
              className="p-2 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 transition-colors border border-cyan-500/30"
            >
              <Pause className="w-5 h-5 text-amber-400" />
            </button>
          </div>
        </div>
      )}

      {/* XP Level Progress Bar */}
      {gameState === "playing" && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 w-1/3 bg-slate-900/80 backdrop-blur-md p-2 rounded-xl border border-cyan-500/30">
          <div className="flex justify-between items-center text-xs font-mono mb-1">
            <span className="text-cyan-400 font-bold">LEVEL {level}</span>
            <span className="text-slate-400">
              {xp} / {xpToNextLevel} XP
            </span>
          </div>
          <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-emerald-500 to-cyan-400 transition-all duration-300"
              style={{ width: `${Math.min(100, (xp / xpToNextLevel) * 100)}%` }}
            />
          </div>
        </div>
      )}

      {/* Canvas */}
      <canvas ref={canvasRef} className="block w-full h-full cursor-crosshair" />

      {/* MENU SCREEN */}
      {gameState === "menu" && (
        <div className="absolute inset-0 z-30 flex items-center justify-center bg-slate-950/90 backdrop-blur-lg">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="max-w-2xl w-full p-8 bg-slate-900/80 border border-cyan-500/40 rounded-2xl shadow-2xl shadow-cyan-500/10 text-center"
          >
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs font-mono mb-4">
              <SparklesIcon className="w-3.5 h-3.5" />
              <span>XAKTEIR CYBERPUNK MECH ENGINE</span>
            </div>

            <h1 className="text-4xl font-extrabold tracking-wider bg-gradient-to-r from-cyan-400 via-teal-300 to-blue-500 bg-clip-text text-transparent uppercase mb-2">
              Titan Mech Survival
            </h1>
            <p className="text-slate-400 text-sm mb-6">
              Pilot apex combat mechs against endless rogue cyber armadas. Upgrade weapon systems, harness quantum EMPs, and dominate the sector leaderboard.
            </p>

            {/* Mech Class Selection */}
            <div className="grid grid-cols-3 gap-4 mb-8">
              {(Object.keys(MECH_CLASSES) as MechClass[]).map((key) => {
                const mech = MECH_CLASSES[key];
                const isSelected = selectedClass === key;
                return (
                  <button
                    key={key}
                    onClick={() => setSelectedClass(key)}
                    className={`p-4 rounded-xl border transition-all text-left relative overflow-hidden ${
                      isSelected
                        ? "bg-cyan-950/40 border-cyan-400 shadow-lg shadow-cyan-500/20"
                        : "bg-slate-800/40 border-slate-700 hover:border-slate-500"
                    }`}
                  >
                    <div className="text-xs font-mono font-bold uppercase text-cyan-400 mb-1">{mech.name}</div>
                    <div className="text-[10px] text-slate-400 mb-2">{mech.subtitle}</div>
                    <div className="text-[11px] text-slate-300 font-mono mb-3 line-clamp-2">{mech.desc}</div>
                    <div className="text-[10px] font-mono text-emerald-400">Weapon: {mech.weaponType}</div>
                  </button>
                );
              })}
            </div>

            {/* High Score Banner */}
            {highScore > 0 && (
              <div className="mb-6 inline-flex items-center space-x-2 px-4 py-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 font-mono text-sm">
                <Trophy className="w-4 h-4 text-amber-400" />
                <span>Sector High Score: {highScore.toLocaleString()}</span>
              </div>
            )}

            {/* Action Controls */}
            <div className="flex justify-center space-x-4">
              <button
                onClick={startGame}
                className="px-8 py-3.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 font-mono font-bold text-sm tracking-wider hover:from-cyan-400 hover:to-blue-500 shadow-lg shadow-cyan-500/30 transition-all flex items-center space-x-2"
              >
                <Play className="w-5 h-5 fill-current" />
                <span>DEPLOY TITAN MECH</span>
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* UPGRADE MODAL */}
      <AnimatePresence>
        {gameState === "upgrade" && (
          <div className="absolute inset-0 z-40 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="max-w-xl w-full p-6 bg-slate-900 border border-cyan-500/50 rounded-2xl shadow-2xl text-center"
            >
              <div className="text-cyan-400 text-xs font-mono tracking-widest uppercase mb-1">TACTICAL SYSTEM UPGRADE</div>
              <h2 className="text-2xl font-extrabold text-white mb-6">Choose Module Enhancement</h2>

              <div className="grid gap-4 mb-6">
                {availableUpgrades.map((upg) => (
                  <button
                    key={upg.id}
                    onClick={() => selectUpgrade(upg.id)}
                    className="p-4 rounded-xl bg-slate-800/80 border border-cyan-500/20 hover:border-cyan-400 hover:bg-cyan-950/30 transition-all text-left flex items-start space-x-4 group"
                  >
                    <div className="p-3 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 group-hover:scale-110 transition-transform">
                      <Cpu className="w-6 h-6" />
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-center mb-1">
                        <span className="font-bold text-white group-hover:text-cyan-400 transition-colors">{upg.name}</span>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 uppercase">
                          {upg.category}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400">{upg.desc}</p>
                    </div>
                  </button>
                ))}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* GAME OVER SCREEN */}
      {gameState === "gameover" && (
        <div className="absolute inset-0 z-40 flex items-center justify-center bg-slate-950/90 backdrop-blur-md p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="max-w-md w-full p-8 bg-slate-900 border border-red-500/40 rounded-2xl shadow-2xl text-center"
          >
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-500">
              <ShieldAlert className="w-8 h-8" />
            </div>

            <h2 className="text-3xl font-extrabold text-red-500 tracking-wider uppercase mb-1">Hull Destroyed</h2>
            <p className="text-xs font-mono text-slate-400 mb-6">Mission Terminated in Sector Wave {wave}</p>

            <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700/60 font-mono text-sm space-y-3 mb-6">
              <div className="flex justify-between">
                <span className="text-slate-400">Final Score</span>
                <span className="text-cyan-400 font-bold">{score.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Total Kills</span>
                <span className="text-emerald-400 font-bold">{kills}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Time Survived</span>
                <span className="text-amber-400 font-bold">{survivalTime}s</span>
              </div>
            </div>

            <div className="flex justify-center space-x-3">
              <button
                onClick={startGame}
                className="w-full py-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 font-mono font-bold text-slate-950 text-sm tracking-wider transition-colors flex items-center justify-center space-x-2"
              >
                <RotateCcw className="w-4 h-4" />
                <span>RETRY MISSION</span>
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* PAUSE SCREEN */}
      {gameState === "paused" && (
        <div className="absolute inset-0 z-40 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="max-w-sm w-full p-6 bg-slate-900 border border-amber-500/40 rounded-2xl text-center"
          >
            <h2 className="text-2xl font-bold text-amber-400 font-mono mb-4">MISSION PAUSED</h2>
            <p className="text-xs text-slate-400 mb-6">Take a breath, Commander. Tactical systems standby.</p>

            <div className="space-y-3">
              <button
                onClick={() => setGameState("playing")}
                className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-mono font-bold text-sm tracking-wider transition-colors"
              >
                RESUME COMBAT
              </button>
              <button
                onClick={() => setGameState("menu")}
                className="w-full py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-mono text-sm tracking-wider transition-colors"
              >
                ABORT TO MENU
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
