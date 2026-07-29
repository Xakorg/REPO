"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Shield,
  Zap,
  Crosshair,
  RotateCcw,
  Play,
  Volume2,
  VolumeX,
  Trophy,
  Sparkles,
  Rocket,
  Swords,
  Award,
  ArrowLeft,
  Pause,
  Flame,
  ChevronRight,
  Target,
  Cpu,
  Radio,
  Sliders,
  Maximize2
} from "lucide-react";
import Link from "next/link";

// ============================================================================
// 1. WEB AUDIO SYNTHESIZER SFX ENGINE (Zero External Asset Dependency)
// ============================================================================
class AstralAudioEngine {
  private ctx: AudioContext | null = null;
  public muted: boolean = false;

  private initCtx() {
    if (!this.ctx && typeof window !== "undefined") {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContextClass) {
        this.ctx = new AudioContextClass();
      }
    }
    if (this.ctx && this.ctx.state === "suspended") {
      this.ctx.resume();
    }
  }

  public toggleMute(): boolean {
    this.muted = !this.muted;
    return this.muted;
  }

  public playLaser(pitch: number = 1.0) {
    if (this.muted) return;
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(950 * pitch, now);
    osc.frequency.exponentialRampToValueAtTime(120 * pitch, now + 0.1);

    gain.gain.setValueAtTime(0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.1);
  }

  public playEmpPulse() {
    if (this.muted) return;
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(150, now);
    osc.frequency.exponentialRampToValueAtTime(800, now + 0.2);
    osc.frequency.exponentialRampToValueAtTime(40, now + 0.45);

    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.45);
  }

  public playExplosion(isBoss: boolean = false) {
    if (this.muted) return;
    this.initCtx();
    if (!this.ctx) return;

    const duration = isBoss ? 0.6 : 0.25;
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
    filter.frequency.setValueAtTime(isBoss ? 400 : 800, this.ctx.currentTime);
    filter.frequency.linearRampToValueAtTime(30, this.ctx.currentTime + duration);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(isBoss ? 0.4 : 0.2, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + duration);

    whiteNoise.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);

    whiteNoise.start();
  }

  public playPowerup() {
    if (this.muted) return;
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = "triangle";
    osc.frequency.setValueAtTime(400, now);
    osc.frequency.exponentialRampToValueAtTime(1200, now + 0.2);

    gain.gain.setValueAtTime(0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.2);
  }

  public playHit() {
    if (this.muted) return;
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = "square";
    osc.frequency.setValueAtTime(180, now);
    osc.frequency.exponentialRampToValueAtTime(40, now + 0.08);

    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.08);
  }
}

const audio = new AstralAudioEngine();

// ============================================================================
// 2. DATA TYPES & INTERFACES
// ============================================================================
interface Entity {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
}

interface Player extends Entity {
  health: number;
  maxHealth: number;
  shield: number;
  maxShield: number;
  empEnergy: number;
  maxEmpEnergy: number;
  speed: number;
  fireRate: number; // ms delay
  lastFired: number;
  angle: number;
  dashCooldown: number;
  isDashing: boolean;
  weaponType: "single" | "dual" | "spread" | "plasma";
}

interface Projectile extends Entity {
  damage: number;
  isPlayer: boolean;
  life: number;
  maxLife: number;
}

interface Enemy extends Entity {
  id: string;
  type: "swarmer" | "cruiser" | "phantom" | "boss";
  health: number;
  maxHealth: number;
  scoreValue: number;
  lastFired: number;
  fireRate: number;
  opacity?: number;
}

interface Drone {
  angle: number;
  distance: number;
  lastFired: number;
}

interface PowerUp extends Entity {
  type: "health" | "shield" | "emp" | "rapid" | "drone";
  life: number;
}

interface Particle extends Entity {
  alpha: number;
  decay: number;
  size: number;
}

interface FloatingText {
  id: string;
  x: number;
  y: number;
  text: string;
  color: string;
  alpha: number;
  vy: number;
}

interface Perk {
  id: string;
  name: string;
  description: string;
  icon: string;
}

const PERKS_POOL: Perk[] = [
  { id: "dual_plasma", name: "Twin Plasma Cannons", description: "Fires double parallel laser bolts.", icon: "⚡" },
  { id: "spread_beam", name: "Scatter Beam Array", description: "Fires a 3-way spread pattern.", icon: "🌌" },
  { id: "drone_support", name: "Defense Drone", description: "Deploys an autonomous tactical escort drone.", icon: "🛸" },
  { id: "overclock_speed", name: "Ion Thrusters", description: "+25% Ship Movement Speed & Dash duration.", icon: "🚀" },
  { id: "shield_matrix", name: "Refractive Shielding", description: "+50 Max Shield & faster regeneration.", icon: "🛡️" },
  { id: "emp_overcharge", name: "Emp Capacitor", description: "+50% EMP Blast Radius & Faster charge.", icon: "💥" },
  { id: "repair_nanites", name: "Nanite Auto-Repair", description: "Restores 40% Health instantly & passively heals.", icon: "🔧" }
];

// ============================================================================
// 3. MAIN REACT COMPONENT
// ============================================================================
export default function AstralPulseOverdriveGame() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Game States
  const [gameState, setGameState] = useState<"menu" | "playing" | "perk_select" | "paused" | "gameover">("menu");
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [wave, setWave] = useState(1);
  const [kills, setKills] = useState(0);
  const [multiplier, setMultiplier] = useState(1);

  // Sound state
  const [isMuted, setIsMuted] = useState(false);

  // Choice Perks between waves
  const [offeredPerks, setOfferedPerks] = useState<Perk[]>([]);
  const [activePerks, setActivePerks] = useState<string[]>([]);

  // Player Stats for HUD
  const [playerHud, setPlayerHud] = useState({
    health: 100,
    maxHealth: 100,
    shield: 100,
    maxShield: 100,
    empEnergy: 100,
    maxEmpEnergy: 100
  });

  // Controls state
  const keysPressed = useRef<{ [key: string]: boolean }>({});
  const mousePos = useRef({ x: 400, y: 300 });
  const isMouseDown = useRef(false);

  // Mobile Touch Controls
  const joystickPos = useRef<{ x: number; y: number } | null>(null);
  const joystickVector = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // Game Objects References (in-memory game loop performance)
  const playerRef = useRef<Player>({
    x: 400,
    y: 300,
    vx: 0,
    vy: 0,
    radius: 18,
    color: "#00f0ff",
    health: 100,
    maxHealth: 100,
    shield: 100,
    maxShield: 100,
    empEnergy: 100,
    maxEmpEnergy: 100,
    speed: 5.5,
    fireRate: 150,
    lastFired: 0,
    angle: 0,
    dashCooldown: 0,
    isDashing: false,
    weaponType: "single"
  });

  const projectilesRef = useRef<Projectile[]>([]);
  const enemiesRef = useRef<Enemy[]>([]);
  const dronesRef = useRef<Drone[]>([]);
  const powerupsRef = useRef<PowerUp[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const floatingTextsRef = useRef<FloatingText[]>([]);
  const starsRef = useRef<{ x: number; y: number; z: number; size: number }[]>([]);
  const empPulsesRef = useRef<{ x: number; y: number; radius: number; maxRadius: number; alpha: number }[]>([]);

  // Wave spawn management
  const waveEnemiesToSpawn = useRef(0);
  const lastSpawnTime = useRef(0);
  const bossSpawned = useRef(false);

  // Load Highscore
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedScore = localStorage.getItem("astral_pulse_highscore");
      if (savedScore) setHighScore(parseInt(savedScore, 10));
    }
  }, []);

  // Initialize Starfield background
  useEffect(() => {
    const stars: { x: number; y: number; z: number; size: number }[] = [];
    for (let i = 0; i < 120; i++) {
      stars.push({
        x: Math.random() * 1200,
        y: Math.random() * 800,
        z: Math.random() * 2 + 0.5,
        size: Math.random() * 2 + 0.5
      });
    }
    starsRef.current = stars;
  }, []);

  // Handle Window Resize / Setup Canvas
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      keysPressed.current[e.code] = true;
      if (e.code === "KeyP" && (gameState === "playing" || gameState === "paused")) {
        setGameState((prev) => (prev === "playing" ? "paused" : "playing"));
      }
      if (e.code === "Space" && gameState === "playing") {
        triggerDash();
      }
      if (e.code === "KeyE" || e.code === "ShiftLeft") {
        if (gameState === "playing") triggerEmp();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      keysPressed.current[e.code] = false;
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [gameState]);

  // Dash mechanic
  const triggerDash = () => {
    const p = playerRef.current;
    if (p.dashCooldown <= 0) {
      p.isDashing = true;
      p.dashCooldown = 1800; // ms
      p.vx *= 2.8;
      p.vy *= 2.8;

      // Add Thruster trail particles
      for (let i = 0; i < 15; i++) {
        particlesRef.current.push({
          x: p.x,
          y: p.y,
          vx: (Math.random() - 0.5) * 6,
          vy: (Math.random() - 0.5) * 6,
          radius: Math.random() * 4 + 2,
          color: "#00f0ff",
          alpha: 1,
          decay: 0.05,
          size: Math.random() * 3 + 1
        });
      }
      audio.playPowerup();
    }
  };

  // EMP Pulse mechanic
  const triggerEmp = () => {
    const p = playerRef.current;
    if (p.empEnergy >= 100) {
      p.empEnergy = 0;
      empPulsesRef.current.push({
        x: p.x,
        y: p.y,
        radius: 10,
        maxRadius: activePerks.includes("emp_overcharge") ? 380 : 260,
        alpha: 1
      });

      // Clear enemy projectiles nearby & damage enemies
      projectilesRef.current = projectilesRef.current.filter((proj) => {
        if (!proj.isPlayer) {
          const dx = proj.x - p.x;
          const dy = proj.y - p.y;
          return Math.hypot(dx, dy) > 280;
        }
        return true;
      });

      enemiesRef.current.forEach((enemy) => {
        const dx = enemy.x - p.x;
        const dy = enemy.y - p.y;
        if (Math.hypot(dx, dy) < 280) {
          enemy.health -= 60;
          addFloatingText(enemy.x, enemy.y, "-60 EMP", "#ff007f");
        }
      });

      audio.playEmpPulse();
    }
  };

  // Floating text feedback
  const addFloatingText = (x: number, y: number, text: string, color: string = "#ffffff") => {
    floatingTextsRef.current.push({
      id: Math.random().toString(),
      x,
      y,
      text,
      color,
      alpha: 1,
      vy: -1.2
    });
  };

  // Start a new game
  const startGame = () => {
    setScore(0);
    setWave(1);
    setKills(0);
    setMultiplier(1);
    setActivePerks([]);

    playerRef.current = {
      x: 400,
      y: 300,
      vx: 0,
      vy: 0,
      radius: 18,
      color: "#00f0ff",
      health: 100,
      maxHealth: 100,
      shield: 100,
      maxShield: 100,
      empEnergy: 100,
      maxEmpEnergy: 100,
      speed: 5.5,
      fireRate: 150,
      lastFired: 0,
      angle: 0,
      dashCooldown: 0,
      isDashing: false,
      weaponType: "single"
    };

    projectilesRef.current = [];
    enemiesRef.current = [];
    dronesRef.current = [];
    powerupsRef.current = [];
    particlesRef.current = [];
    floatingTextsRef.current = [];
    empPulsesRef.current = [];

    waveEnemiesToSpawn.current = 10;
    bossSpawned.current = false;

    setGameState("playing");
  };

  // Start next wave & offer perks
  const startNextWave = () => {
    setWave((prev) => {
      const nextWave = prev + 1;
      waveEnemiesToSpawn.current = 8 + nextWave * 4;
      bossSpawned.current = false;
      return nextWave;
    });

    // Select 3 random perks from pool
    const shuffled = [...PERKS_POOL].sort(() => 0.5 - Math.random());
    setOfferedPerks(shuffled.slice(0, 3));
    setGameState("perk_select");
  };

  const selectPerk = (perk: Perk) => {
    setActivePerks((prev) => [...prev, perk.id]);
    const p = playerRef.current;

    if (perk.id === "dual_plasma") p.weaponType = "dual";
    if (perk.id === "spread_beam") p.weaponType = "spread";
    if (perk.id === "drone_support") dronesRef.current.push({ angle: 0, distance: 45, lastFired: 0 });
    if (perk.id === "overclock_speed") p.speed += 1.5;
    if (perk.id === "shield_matrix") {
      p.maxShield += 50;
      p.shield = p.maxShield;
    }
    if (perk.id === "repair_nanites") {
      p.health = Math.min(p.maxHealth, p.health + 50);
    }

    setGameState("playing");
  };

  // Main Canvas Render & Physics Loop
  useEffect(() => {
    let animId: number;

    const loop = (timestamp: number) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      // Responsive aspect scaling
      const width = canvas.width;
      const height = canvas.height;

      if (gameState === "playing") {
        // --- 1. UPDATE PLAYER ---
        const p = playerRef.current;

        // Input Velocity
        let dx = 0;
        let dy = 0;

        if (keysPressed.current["KeyW"] || keysPressed.current["ArrowUp"]) dy -= 1;
        if (keysPressed.current["KeyS"] || keysPressed.current["ArrowDown"]) dy += 1;
        if (keysPressed.current["KeyA"] || keysPressed.current["ArrowLeft"]) dx -= 1;
        if (keysPressed.current["KeyD"] || keysPressed.current["ArrowRight"]) dx += 1;

        // Touch Joystick Support
        if (joystickVector.current.x !== 0 || joystickVector.current.y !== 0) {
          dx = joystickVector.current.x;
          dy = joystickVector.current.y;
        }

        if (dx !== 0 && dy !== 0 && joystickVector.current.x === 0) {
          dx *= 0.7071;
          dy *= 0.7071;
        }

        p.vx = p.vx * 0.85 + dx * p.speed * 0.15;
        p.vy = p.vy * 0.85 + dy * p.speed * 0.15;

        p.x += p.vx;
        p.y += p.vy;

        // Boundary Clamp
        p.x = Math.max(p.radius, Math.min(width - p.radius, p.x));
        p.y = Math.max(p.radius, Math.min(height - p.radius, p.y));

        // Aim angle towards mouse
        p.angle = Math.atan2(mousePos.current.y - p.y, mousePos.current.x - p.x);

        // Cooldowns & Shield Recharge
        if (p.dashCooldown > 0) p.dashCooldown -= 16;
        if (p.shield < p.maxShield) p.shield = Math.min(p.maxShield, p.shield + 0.08);
        if (p.empEnergy < p.maxEmpEnergy) p.empEnergy = Math.min(p.maxEmpEnergy, p.empEnergy + 0.12);

        // Weapon Firing
        if ((isMouseDown.current || keysPressed.current["Space"]) && timestamp - p.lastFired > p.fireRate) {
          p.lastFired = timestamp;
          firePlayerWeapon(p);
        }

        // --- 2. DRONES LOGIC ---
        dronesRef.current.forEach((drone, idx) => {
          drone.angle += 0.04;
          const droneX = p.x + Math.cos(drone.angle + (idx * Math.PI) / dronesRef.current.length) * drone.distance;
          const droneY = p.y + Math.sin(drone.angle + (idx * Math.PI) / dronesRef.current.length) * drone.distance;

          // Drone auto fires at closest enemy
          if (timestamp - drone.lastFired > 300 && enemiesRef.current.length > 0) {
            drone.lastFired = timestamp;
            const target = enemiesRef.current[0];
            const angle = Math.atan2(target.y - droneY, target.x - droneX);
            projectilesRef.current.push({
              x: droneX,
              y: droneY,
              vx: Math.cos(angle) * 12,
              vy: Math.sin(angle) * 12,
              radius: 4,
              color: "#00ffaa",
              damage: 15,
              isPlayer: true,
              life: 0,
              maxLife: 60
            });
            audio.playLaser(1.4);
          }
        });

        // --- 3. SPAWN ENEMIES ---
        if (waveEnemiesToSpawn.current > 0 && timestamp - lastSpawnTime.current > 1200) {
          lastSpawnTime.current = timestamp;
          waveEnemiesToSpawn.current -= 1;

          // Enemy Spawn Position (Off-screen borders)
          let ex = 0,
            ey = 0;
          if (Math.random() < 0.5) {
            ex = Math.random() < 0.5 ? -30 : width + 30;
            ey = Math.random() * height;
          } else {
            ex = Math.random() * width;
            ey = Math.random() < 0.5 ? -30 : height + 30;
          }

          const types: ("swarmer" | "cruiser" | "phantom")[] = ["swarmer", "cruiser", "phantom"];
          const randType = types[Math.floor(Math.random() * types.length)];

          enemiesRef.current.push({
            id: Math.random().toString(),
            x: ex,
            y: ey,
            vx: 0,
            vy: 0,
            radius: randType === "cruiser" ? 24 : 14,
            color: randType === "swarmer" ? "#ff2a6d" : randType === "cruiser" ? "#ffb703" : "#9d4edd",
            type: randType,
            health: randType === "cruiser" ? 60 : randType === "phantom" ? 35 : 20,
            maxHealth: randType === "cruiser" ? 60 : randType === "phantom" ? 35 : 20,
            scoreValue: randType === "cruiser" ? 250 : 100,
            lastFired: 0,
            fireRate: randType === "cruiser" ? 1800 : 2500
          });
        }

        // Spawn Boss on Wave Multiples of 5
        if (wave % 5 === 0 && waveEnemiesToSpawn.current === 0 && !bossSpawned.current && enemiesRef.current.length === 0) {
          bossSpawned.current = true;
          enemiesRef.current.push({
            id: "boss_" + wave,
            x: width / 2,
            y: -80,
            vx: 0,
            vy: 1.5,
            radius: 50,
            color: "#ff0055",
            type: "boss",
            health: 400 + wave * 150,
            maxHealth: 400 + wave * 150,
            scoreValue: 2000,
            lastFired: 0,
            fireRate: 800
          });
          addFloatingText(width / 2, 100, "⚠️ VOID TITAN DETECTED ⚠️", "#ff0055");
        }

        // Check wave completion
        if (waveEnemiesToSpawn.current === 0 && enemiesRef.current.length === 0) {
          startNextWave();
        }

        // --- 4. UPDATE ENEMIES ---
        enemiesRef.current.forEach((enemy) => {
          const angle = Math.atan2(p.y - enemy.y, p.x - enemy.x);
          const speed = enemy.type === "swarmer" ? 2.8 : enemy.type === "phantom" ? 2.2 : 1.2;

          enemy.vx = Math.cos(angle) * speed;
          enemy.vy = Math.sin(angle) * speed;
          enemy.x += enemy.vx;
          enemy.y += enemy.vy;

          // Enemy Firing Logic
          if (timestamp - enemy.lastFired > enemy.fireRate && enemy.type !== "swarmer") {
            enemy.lastFired = timestamp;
            projectilesRef.current.push({
              x: enemy.x,
              y: enemy.y,
              vx: Math.cos(angle) * 5.5,
              vy: Math.sin(angle) * 5.5,
              radius: 5,
              color: "#ff0055",
              damage: enemy.type === "boss" ? 20 : 10,
              isPlayer: false,
              life: 0,
              maxLife: 140
            });
          }
        });

        // --- 5. UPDATE PROJECTILES ---
        projectilesRef.current.forEach((proj) => {
          proj.x += proj.vx;
          proj.y += proj.vy;
          proj.life += 1;
        });

        // Filter expired projectiles
        projectilesRef.current = projectilesRef.current.filter(
          (proj) => proj.life < proj.maxLife && proj.x >= -50 && proj.x <= width + 50 && proj.y >= -50 && proj.y <= height + 50
        );

        // --- 6. COLLISIONS ---
        // Player Projectiles vs Enemies
        projectilesRef.current.forEach((proj) => {
          if (!proj.isPlayer) return;

          enemiesRef.current.forEach((enemy) => {
            const dist = Math.hypot(proj.x - enemy.x, proj.y - enemy.y);
            if (dist < proj.radius + enemy.radius) {
              proj.life = proj.maxLife; // Destroy projectile
              enemy.health -= proj.damage;
              audio.playHit();

              // Spawn Hit Particles
              for (let i = 0; i < 4; i++) {
                particlesRef.current.push({
                  x: proj.x,
                  y: proj.y,
                  vx: (Math.random() - 0.5) * 4,
                  vy: (Math.random() - 0.5) * 4,
                  radius: Math.random() * 3 + 1,
                  color: "#00f0ff",
                  alpha: 1,
                  decay: 0.08,
                  size: 2
                });
              }

              if (enemy.health <= 0) {
                // Enemy Destroyed
                audio.playExplosion(enemy.type === "boss");
                setScore((s) => s + enemy.scoreValue * multiplier);
                setKills((k) => k + 1);

                addFloatingText(enemy.x, enemy.y, `+${enemy.scoreValue}`, "#00ffcc");

                // Spawn Power-up chance
                if (Math.random() < 0.25) {
                  const types: ("health" | "shield" | "emp")[] = ["health", "shield", "emp"];
                  powerupsRef.current.push({
                    x: enemy.x,
                    y: enemy.y,
                    vx: 0,
                    vy: 0,
                    radius: 12,
                    color: "#00ffcc",
                    type: types[Math.floor(Math.random() * types.length)],
                    life: 400
                  });
                }
              }
            }
          });
        });

        // Filter dead enemies & create explosion effects
        enemiesRef.current = enemiesRef.current.filter((enemy) => {
          if (enemy.health <= 0) {
            for (let i = 0; i < 15; i++) {
              particlesRef.current.push({
                x: enemy.x,
                y: enemy.y,
                vx: (Math.random() - 0.5) * 8,
                vy: (Math.random() - 0.5) * 8,
                radius: Math.random() * 4 + 2,
                color: enemy.color,
                alpha: 1,
                decay: 0.03,
                size: Math.random() * 4 + 1
              });
            }
            return false;
          }
          return true;
        });

        // Enemy Projectiles vs Player
        projectilesRef.current.forEach((proj) => {
          if (proj.isPlayer) return;

          const dist = Math.hypot(proj.x - p.x, proj.y - p.y);
          if (dist < proj.radius + p.radius) {
            proj.life = proj.maxLife;
            damagePlayer(proj.damage);
          }
        });

        // Enemies Body Collision with Player
        enemiesRef.current.forEach((enemy) => {
          const dist = Math.hypot(enemy.x - p.x, enemy.y - p.y);
          if (dist < enemy.radius + p.radius) {
            damagePlayer(15);
            enemy.health -= 25;
          }
        });

        // Power-ups Collection
        powerupsRef.current.forEach((pow) => {
          const dist = Math.hypot(pow.x - p.x, pow.y - p.y);
          if (dist < pow.radius + p.radius) {
            pow.life = 0;
            audio.playPowerup();

            if (pow.type === "health") p.health = Math.min(p.maxHealth, p.health + 30);
            if (pow.type === "shield") p.shield = Math.min(p.maxShield, p.shield + 40);
            if (pow.type === "emp") p.empEnergy = p.maxEmpEnergy;

            addFloatingText(p.x, p.y - 20, `+${pow.type.toUpperCase()}`, "#00f0ff");
          }
        });
        powerupsRef.current = powerupsRef.current.filter((pow) => pow.life > 0);

        // Update Floating Text & Particles
        floatingTextsRef.current.forEach((ft) => {
          ft.y += ft.vy;
          ft.alpha -= 0.02;
        });
        floatingTextsRef.current = floatingTextsRef.current.filter((ft) => ft.alpha > 0);

        particlesRef.current.forEach((part) => {
          part.x += part.vx;
          part.y += part.vy;
          part.alpha -= part.decay;
        });
        particlesRef.current = particlesRef.current.filter((part) => part.alpha > 0);

        // Update EMP Waves
        empPulsesRef.current.forEach((pulse) => {
          pulse.radius += 12;
          pulse.alpha -= 0.03;
        });
        empPulsesRef.current = empPulsesRef.current.filter((pulse) => pulse.alpha > 0);

        // Update HUD sync
        setPlayerHud({
          health: Math.max(0, p.health),
          maxHealth: p.maxHealth,
          shield: Math.max(0, p.shield),
          maxShield: p.maxShield,
          empEnergy: p.empEnergy,
          maxEmpEnergy: p.maxEmpEnergy
        });
      }

      // --- 7. RENDERING CANVAS GRAPHICS ---
      ctx.fillStyle = "#050714";
      ctx.fillRect(0, 0, width, height);

      // Render Cosmic Grid Parallax Stars
      ctx.fillStyle = "rgba(255, 255, 255, 0.7)";
      starsRef.current.forEach((star) => {
        if (gameState === "playing") star.y += star.z * 0.4;
        if (star.y > height) star.y = 0;
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
        ctx.fill();
      });

      // Draw EMP Pulses
      empPulsesRef.current.forEach((pulse) => {
        ctx.strokeStyle = `rgba(0, 240, 255, ${pulse.alpha})`;
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(pulse.x, pulse.y, pulse.radius, 0, Math.PI * 2);
        ctx.stroke();
      });

      // Draw Power-ups
      powerupsRef.current.forEach((pow) => {
        ctx.fillStyle = pow.color;
        ctx.shadowColor = pow.color;
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.arc(pow.x, pow.y, pow.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      });

      // Draw Particles
      particlesRef.current.forEach((part) => {
        ctx.fillStyle = part.color;
        ctx.globalAlpha = part.alpha;
        ctx.beginPath();
        ctx.arc(part.x, part.y, part.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
      });

      // Draw Projectiles
      projectilesRef.current.forEach((proj) => {
        ctx.fillStyle = proj.color;
        ctx.shadowColor = proj.color;
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.arc(proj.x, proj.y, proj.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      });

      // Draw Enemies
      enemiesRef.current.forEach((enemy) => {
        ctx.save();
        ctx.translate(enemy.x, enemy.y);
        ctx.rotate(Math.atan2(playerRef.current.y - enemy.y, playerRef.current.x - enemy.x));

        ctx.fillStyle = enemy.color;
        ctx.shadowColor = enemy.color;
        ctx.shadowBlur = 12;

        if (enemy.type === "boss") {
          // Boss Titan Geometry
          ctx.beginPath();
          ctx.moveTo(enemy.radius, 0);
          ctx.lineTo(-enemy.radius, enemy.radius);
          ctx.lineTo(-enemy.radius / 2, 0);
          ctx.lineTo(-enemy.radius, -enemy.radius);
          ctx.closePath();
          ctx.fill();
        } else {
          // Regular Enemy Polygon
          ctx.beginPath();
          ctx.arc(0, 0, enemy.radius, 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.shadowBlur = 0;
        ctx.restore();
      });

      // Draw Escort Drones
      const p = playerRef.current;
      dronesRef.current.forEach((drone, idx) => {
        const droneX = p.x + Math.cos(drone.angle + (idx * Math.PI) / dronesRef.current.length) * drone.distance;
        const droneY = p.y + Math.sin(drone.angle + (idx * Math.PI) / dronesRef.current.length) * drone.distance;

        ctx.fillStyle = "#00ffaa";
        ctx.shadowColor = "#00ffaa";
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.arc(droneX, droneY, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      });

      // Draw Player Ship
      if (gameState === "playing" || gameState === "paused" || gameState === "perk_select") {
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.angle);

        // Shield Aura
        if (p.shield > 0) {
          ctx.strokeStyle = `rgba(0, 240, 255, ${p.shield / p.maxShield})`;
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.arc(0, 0, p.radius + 6, 0, Math.PI * 2);
          ctx.stroke();
        }

        // Ship Body Triangle
        ctx.fillStyle = p.color;
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 15;
        ctx.beginPath();
        ctx.moveTo(p.radius, 0);
        ctx.lineTo(-p.radius, p.radius * 0.7);
        ctx.lineTo(-p.radius * 0.4, 0);
        ctx.lineTo(-p.radius, -p.radius * 0.7);
        ctx.closePath();
        ctx.fill();

        ctx.shadowBlur = 0;
        ctx.restore();
      }

      // Draw Floating Text Overlay
      floatingTextsRef.current.forEach((ft) => {
        ctx.fillStyle = ft.color;
        ctx.globalAlpha = ft.alpha;
        ctx.font = "bold 14px sans-serif";
        ctx.fillText(ft.text, ft.x, ft.y);
        ctx.globalAlpha = 1;
      });

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [gameState, wave, multiplier]);

  // Firing helper
  const firePlayerWeapon = (p: Player) => {
    const speed = 14;

    if (p.weaponType === "single") {
      projectilesRef.current.push({
        x: p.x + Math.cos(p.angle) * p.radius,
        y: p.y + Math.sin(p.angle) * p.radius,
        vx: Math.cos(p.angle) * speed,
        vy: Math.sin(p.angle) * speed,
        radius: 4,
        color: "#00f0ff",
        damage: 25,
        isPlayer: true,
        life: 0,
        maxLife: 80
      });
    } else if (p.weaponType === "dual") {
      const perpX = -Math.sin(p.angle) * 8;
      const perpY = Math.cos(p.angle) * 8;

      projectilesRef.current.push({
        x: p.x + perpX,
        y: p.y + perpY,
        vx: Math.cos(p.angle) * speed,
        vy: Math.sin(p.angle) * speed,
        radius: 4,
        color: "#00f0ff",
        damage: 22,
        isPlayer: true,
        life: 0,
        maxLife: 80
      });

      projectilesRef.current.push({
        x: p.x - perpX,
        y: p.y - perpY,
        vx: Math.cos(p.angle) * speed,
        vy: Math.sin(p.angle) * speed,
        radius: 4,
        color: "#00f0ff",
        damage: 22,
        isPlayer: true,
        life: 0,
        maxLife: 80
      });
    } else if (p.weaponType === "spread") {
      [-0.2, 0, 0.2].forEach((spread) => {
        projectilesRef.current.push({
          x: p.x,
          y: p.y,
          vx: Math.cos(p.angle + spread) * speed,
          vy: Math.sin(p.angle + spread) * speed,
          radius: 3.5,
          color: "#7000ff",
          damage: 18,
          isPlayer: true,
          life: 0,
          maxLife: 80
        });
      });
    }

    audio.playLaser();
  };

  // Damage Player
  const damagePlayer = (amount: number) => {
    const p = playerRef.current;
    if (p.shield > 0) {
      const shieldDamage = Math.min(p.shield, amount);
      p.shield -= shieldDamage;
      amount -= shieldDamage;
    }

    if (amount > 0) {
      p.health -= amount;
      audio.playHit();
    }

    if (p.health <= 0) {
      audio.playExplosion(true);
      setGameState("gameover");

      setScore((finalScore) => {
        if (finalScore > highScore) {
          setHighScore(finalScore);
          if (typeof window !== "undefined") {
            localStorage.setItem("astral_pulse_highscore", finalScore.toString());
          }
        }
        return finalScore;
      });
    }
  };

  // Mouse Aim Listener
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (rect) {
      mousePos.current = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      };
    }
  };

  return (
    <div className="relative w-full min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center font-sans overflow-hidden select-none">
      {/* Top Header Bar */}
      <header className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between px-6 py-4 bg-slate-900/60 backdrop-blur-md border-b border-slate-800">
        <div className="flex items-center gap-3">
          <Link
            href="/game"
            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-cyan-400 transition-colors bg-slate-800/80 px-3 py-1.5 rounded-lg border border-slate-700"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Hub
          </Link>
          <div className="flex items-center gap-2">
            <Rocket className="w-5 h-5 text-cyan-400 animate-pulse" />
            <h1 className="font-bold text-lg bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-500 bg-clip-text text-transparent">
              ASTRAL PULSE OVERDRIVE
            </h1>
          </div>
        </div>

        {/* Audio Mute & Controls */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsMuted(audio.toggleMute())}
            className="p-2 rounded-lg bg-slate-800/80 border border-slate-700 hover:border-cyan-500 text-slate-300 hover:text-cyan-400 transition-all"
            title="Toggle Mute"
          >
            {isMuted ? <VolumeX className="w-5 h-5 text-red-400" /> : <Volume2 className="w-5 h-5 text-cyan-400" />}
          </button>
        </div>
      </header>

      {/* Main Game Screen Container */}
      <div className="relative mt-16 w-full max-w-[1000px] aspect-[4/3] bg-black rounded-2xl border border-slate-800 shadow-2xl shadow-cyan-950/40 overflow-hidden flex items-center justify-center">
        {/* Canvas Renderer */}
        <canvas
          ref={canvasRef}
          width={1000}
          height={750}
          onMouseMove={handleMouseMove}
          onMouseDown={() => (isMouseDown.current = true)}
          onMouseUp={() => (isMouseDown.current = false)}
          className="w-full h-full cursor-crosshair block"
        />

        {/* --- IN-GAME HUD OVERLAY --- */}
        {gameState === "playing" && (
          <div className="absolute inset-0 pointer-events-none p-6 flex flex-col justify-between">
            {/* Top Stats */}
            <div className="flex justify-between items-start">
              {/* Player Status Bars */}
              <div className="flex flex-col gap-2 w-64 bg-slate-900/70 p-3 rounded-xl border border-slate-800 backdrop-blur-md">
                {/* Health Bar */}
                <div>
                  <div className="flex justify-between text-xs font-semibold mb-1 text-slate-300">
                    <span className="flex items-center gap-1 text-red-400">
                      <Flame className="w-3.5 h-3.5" /> HULL HEALTH
                    </span>
                    <span>
                      {Math.ceil(playerHud.health)} / {playerHud.maxHealth}
                    </span>
                  </div>
                  <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-red-500 to-orange-400 transition-all duration-200"
                      style={{ width: `${(playerHud.health / playerHud.maxHealth) * 100}%` }}
                    />
                  </div>
                </div>

                {/* Shield Bar */}
                <div>
                  <div className="flex justify-between text-xs font-semibold mb-1 text-slate-300">
                    <span className="flex items-center gap-1 text-cyan-400">
                      <Shield className="w-3.5 h-3.5" /> SHIELD MATRIX
                    </span>
                    <span>
                      {Math.ceil(playerHud.shield)} / {playerHud.maxShield}
                    </span>
                  </div>
                  <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 transition-all duration-200"
                      style={{ width: `${(playerHud.shield / playerHud.maxShield) * 100}%` }}
                    />
                  </div>
                </div>

                {/* EMP Energy */}
                <div>
                  <div className="flex justify-between text-xs font-semibold mb-1 text-slate-300">
                    <span className="flex items-center gap-1 text-purple-400">
                      <Zap className="w-3.5 h-3.5" /> EMP CAPACITOR
                    </span>
                    <span>{playerHud.empEnergy >= 100 ? "READY [SHIFT]" : "CHARGING"}</span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-200"
                      style={{ width: `${(playerHud.empEnergy / playerHud.maxEmpEnergy) * 100}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Wave & Score Stats */}
              <div className="flex flex-col items-end gap-1.5">
                <div className="bg-slate-900/80 px-4 py-2 rounded-xl border border-slate-800 text-right backdrop-blur-md">
                  <div className="text-xs text-slate-400 uppercase tracking-wider">Score</div>
                  <div className="text-2xl font-black text-cyan-400 font-mono">{score.toLocaleString()}</div>
                </div>
                <div className="bg-slate-900/80 px-3 py-1 rounded-lg border border-slate-800 text-xs font-semibold text-purple-300">
                  WAVE {wave} • KILLS: {kills}
                </div>
              </div>
            </div>

            {/* Bottom Controls Legend */}
            <div className="flex justify-between items-end">
              <div className="text-xs text-slate-400 bg-slate-900/60 px-3 py-2 rounded-lg border border-slate-800">
                WASD / Arrows: Move • Mouse: Aim & Shoot • Space: Dash • Shift: EMP Pulse • P: Pause
              </div>
            </div>
          </div>
        )}

        {/* --- MENU OVERLAY --- */}
        {gameState === "menu" && (
          <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-md flex flex-col items-center justify-center p-8 text-center z-30">
            <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="max-w-md">
              <div className="w-16 h-16 bg-gradient-to-tr from-cyan-500 to-purple-600 rounded-2xl mx-auto mb-4 flex items-center justify-center shadow-lg shadow-cyan-500/30">
                <Rocket className="w-9 h-9 text-white" />
              </div>
              <h2 className="text-3xl font-black bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-500 bg-clip-text text-transparent mb-2">
                ASTRAL PULSE OVERDRIVE
              </h2>
              <p className="text-sm text-slate-400 mb-6">
                Pilot your Tachyon Vanguard starfighter, harvest dark matter crystals, deploy tactical EMP shockwaves, and conquer invading void armadas.
              </p>

              {highScore > 0 && (
                <div className="flex items-center justify-center gap-2 mb-6 text-sm font-semibold text-yellow-400 bg-yellow-950/40 py-2 px-4 rounded-xl border border-yellow-800/50">
                  <Trophy className="w-4 h-4" /> ALL-TIME HIGH SCORE: {highScore.toLocaleString()}
                </div>
              )}

              <button
                onClick={startGame}
                className="w-full py-4 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold rounded-xl shadow-lg shadow-cyan-500/25 transition-all flex items-center justify-center gap-2 text-lg"
              >
                <Play className="w-5 h-5 fill-current" /> LAUNCH MISSION
              </button>
            </motion.div>
          </div>
        )}

        {/* --- PERK SELECTION OVERLAY --- */}
        {gameState === "perk_select" && (
          <div className="absolute inset-0 bg-slate-950/95 backdrop-blur-md flex flex-col items-center justify-center p-8 z-30">
            <h2 className="text-2xl font-bold text-cyan-400 mb-1 flex items-center gap-2">
              <Sparkles className="w-6 h-6" /> WAVE {wave - 1} CLEARED
            </h2>
            <p className="text-sm text-slate-400 mb-6">Choose a Tactical System Upgrade to augment your Vanguard:</p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full max-w-2xl">
              {offeredPerks.map((perk) => (
                <button
                  key={perk.id}
                  onClick={() => selectPerk(perk)}
                  className="bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-cyan-500/80 p-5 rounded-2xl text-left transition-all group flex flex-col justify-between"
                >
                  <div>
                    <div className="text-3xl mb-3">{perk.icon}</div>
                    <div className="font-bold text-white group-hover:text-cyan-300 mb-1">{perk.name}</div>
                    <div className="text-xs text-slate-400">{perk.description}</div>
                  </div>
                  <div className="mt-4 text-xs font-semibold text-cyan-400 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                    INSTALL PERK <ChevronRight className="w-4 h-4" />
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* --- GAMEOVER OVERLAY --- */}
        {gameState === "gameover" && (
          <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-md flex flex-col items-center justify-center p-8 text-center z-30">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="max-w-md">
              <div className="w-16 h-16 bg-red-500/20 text-red-400 rounded-2xl mx-auto mb-4 flex items-center justify-center border border-red-500/30">
                <Flame className="w-9 h-9" />
              </div>
              <h2 className="text-3xl font-black text-red-500 mb-1">STARFIGHTER DESTROYED</h2>
              <p className="text-sm text-slate-400 mb-6">Your hull collapsed under heavy void fire.</p>

              <div className="bg-slate-900/80 p-4 rounded-xl border border-slate-800 mb-6 text-left space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-400">Final Score:</span>
                  <span className="font-mono font-bold text-cyan-400">{score.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Waves Survived:</span>
                  <span className="font-mono font-bold text-purple-400">{wave}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Total Kills:</span>
                  <span className="font-mono font-bold text-green-400">{kills}</span>
                </div>
              </div>

              <button
                onClick={startGame}
                className="w-full py-3.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold rounded-xl shadow-lg transition-all flex items-center justify-center gap-2"
              >
                <RotateCcw className="w-5 h-5" /> RESTART MISSION
              </button>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
}
