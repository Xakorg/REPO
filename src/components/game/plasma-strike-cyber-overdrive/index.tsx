"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import { 
  Shield, 
  Zap, 
  Trophy, 
  RotateCcw, 
  Volume2, 
  VolumeX, 
  Crosshair, 
  Flame, 
  Award, 
  ArrowLeft, 
  Radio, 
  Activity, 
  Layers, 
  Play, 
  Pause, 
  Sparkles
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";

// ---------------------------------------------------------------------------
// TYPES & INTERFACES
// ---------------------------------------------------------------------------
interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
}

interface Bullet {
  x: number;
  y: number;
  vx: number;
  vy: number;
  isPlayer: boolean;
  color: string;
  radius: number;
  damage: number;
  isHoming?: boolean;
}

interface Enemy {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  type: "scout" | "interceptor" | "dreadnought" | "phantom" | "boss";
  hp: number;
  maxHp: number;
  radius: number;
  scoreValue: number;
  lastShoot: number;
  shootInterval: number;
  color: string;
  bossPhase?: number;
  angle?: number;
}

interface PowerUp {
  x: number;
  y: number;
  type: "shield" | "overdrive" | "nuke" | "drone" | "multiplier";
  radius: number;
  duration: number;
}

interface CompanionDrone {
  offsetX: number;
  offsetY: number;
  angle: number;
  lastShoot: number;
}

interface UpgradeItem {
  id: string;
  name: string;
  description: string;
  cost: number;
  level: number;
  maxLevel: number;
  icon: string;
}

// ---------------------------------------------------------------------------
// WEB AUDIO API SOUND SYNTHESIS
// ---------------------------------------------------------------------------
class SoundEngine {
  private ctx: AudioContext | null = null;
  public enabled: boolean = true;

  private init() {
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

  playLaser() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;

    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(800, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(120, this.ctx.currentTime + 0.12);

      gain.gain.setValueAtTime(0.15, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.12);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.12);
    } catch (e) {
      // Audio fallback
    }
  }

  playEnemyLaser() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;

    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "square";
      osc.frequency.setValueAtTime(400, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(80, this.ctx.currentTime + 0.15);

      gain.gain.setValueAtTime(0.1, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.15);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.15);
    } catch (e) {}
  }

  playExplosion(large = false) {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;

    try {
      const bufferSize = this.ctx.sampleRate * (large ? 0.4 : 0.25);
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const output = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
      }

      const whiteNoise = this.ctx.createBufferSource();
      whiteNoise.buffer = buffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.setValueAtTime(large ? 400 : 800, this.ctx.currentTime);
      filter.frequency.exponentialRampToValueAtTime(30, this.ctx.currentTime + (large ? 0.4 : 0.25));

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(large ? 0.35 : 0.2, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + (large ? 0.4 : 0.25));

      whiteNoise.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);

      whiteNoise.start();
      whiteNoise.stop(this.ctx.currentTime + (large ? 0.4 : 0.25));
    } catch (e) {}
  }

  playPowerup() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;

    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(300, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1200, this.ctx.currentTime + 0.25);

      gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.25);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.25);
    } catch (e) {}
  }

  playNuke() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;

    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(150, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(40, this.ctx.currentTime + 0.8);

      gain.gain.setValueAtTime(0.4, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.8);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.8);
    } catch (e) {}
  }
}

const sounds = new SoundEngine();

// ---------------------------------------------------------------------------
// MAIN COMPONENT
// ---------------------------------------------------------------------------
export default function PlasmaStrikeGame() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  
  // Game States
  const [gameState, setGameState] = useState<"menu" | "playing" | "paused" | "shop" | "gameover">("menu");
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [wave, setWave] = useState(1);
  const [credits, setCredits] = useState(0);
  const [multiplier, setMultiplier] = useState(1);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [nukeReady, setNukeReady] = useState(true);
  const [bossActive, setBossActive] = useState(false);
  const [bossHp, setBossHp] = useState<{ current: number; max: number } | null>(null);

  // Player Stats
  const playerRef = useRef({
    x: 400,
    y: 700,
    vx: 0,
    vy: 0,
    radius: 18,
    hp: 100,
    maxHp: 100,
    shield: 50,
    maxShield: 50,
    speed: 6.5,
    fireRate: 140, // ms between shots
    lastShot: 0,
    weaponLevel: 1,
    overdriveTimer: 0,
    drones: [] as CompanionDrone[],
    invulnerableTimer: 0
  });

  // Upgrade State
  const [upgrades, setUpgrades] = useState<UpgradeItem[]>([
    { id: "weapon", name: "Plasma Cannons", description: "Increase fire rate & plasma spread shots", cost: 150, level: 1, maxLevel: 5, icon: "Flame" },
    { id: "shield", name: "Aegis Shielding", description: "Increase maximum shield capacity & regen", cost: 100, level: 1, maxLevel: 5, icon: "Shield" },
    { id: "speed", name: "Thruster Overdrive", description: "Enhance movement speed and maneuverability", cost: 80, level: 1, maxLevel: 4, icon: "Zap" },
    { id: "drones", name: "Support Drones", description: "Deploy tactical companion combat drones", cost: 250, level: 0, maxLevel: 2, icon: "Sparkles" }
  ]);

  // Keys Tracked
  const keysRef = useRef<{ [key: string]: boolean }>({});
  const mouseRef = useRef({ x: 400, y: 700, down: false });

  // Game Engine Entities
  const bulletsRef = useRef<Bullet[]>([]);
  const enemiesRef = useRef<Enemy[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const powerUpsRef = useRef<PowerUp[]>([]);
  const starsRef = useRef<{ x: number; y: number; size: number; speed: number; opacity: number }[]>([]);
  const enemyIdCounter = useRef(0);
  const screenShakeRef = useRef(0);

  // Load High Score
  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("plasma_strike_highscore");
      if (saved) setHighScore(parseInt(saved, 10));
    }
  }, []);

  // Initialize Canvas & Starfield
  useEffect(() => {
    const stars: { x: number; y: number; size: number; speed: number; opacity: number }[] = [];
    for (let i = 0; i < 120; i++) {
      stars.push({
        x: Math.random() * 1000,
        y: Math.random() * 800,
        size: Math.random() * 2.2 + 0.5,
        speed: Math.random() * 2.5 + 0.5,
        opacity: Math.random() * 0.8 + 0.2
      });
    }
    starsRef.current = stars;
  }, []);

  // Keyboard Event Handlers
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      keysRef.current[e.code] = true;

      if (e.code === "KeyP" || e.code === "Escape") {
        if (gameState === "playing") setGameState("paused");
        else if (gameState === "paused") setGameState("playing");
      }

      if (e.code === "Space" && gameState === "playing" && nukeReady) {
        triggerSuperNuke();
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
  }, [gameState, nukeReady]);

  // Trigger Nuke Ability
  const triggerSuperNuke = () => {
    if (!nukeReady) return;
    setNukeReady(false);
    sounds.playNuke();
    screenShakeRef.current = 25;

    // Destroy all non-boss bullets & damage enemies
    bulletsRef.current = bulletsRef.current.filter((b) => b.isPlayer);
    
    enemiesRef.current.forEach((enemy) => {
      enemy.hp -= 250;
      // Particles burst
      for (let i = 0; i < 20; i++) {
        particlesRef.current.push({
          x: enemy.x,
          y: enemy.y,
          vx: (Math.random() - 0.5) * 12,
          vy: (Math.random() - 0.5) * 12,
          life: 1,
          maxLife: 30,
          color: "#38bdf8",
          size: Math.random() * 5 + 2
        });
      }
    });

    // Cooldown reset after 15 seconds
    setTimeout(() => {
      setNukeReady(true);
    }, 15000);
  };

  // Start Game Reset
  const startGame = () => {
    playerRef.current = {
      x: 400,
      y: 650,
      vx: 0,
      vy: 0,
      radius: 18,
      hp: 100,
      maxHp: 100,
      shield: 50,
      maxShield: 50,
      speed: 6.5,
      fireRate: 140,
      lastShot: 0,
      weaponLevel: 1,
      overdriveTimer: 0,
      drones: [],
      invulnerableTimer: 0
    };

    bulletsRef.current = [];
    enemiesRef.current = [];
    particlesRef.current = [];
    powerUpsRef.current = [];

    setScore(0);
    setWave(1);
    setCredits(0);
    setMultiplier(1);
    setNukeReady(true);
    setBossActive(false);
    setBossHp(null);
    setGameState("playing");
  };

  // Wave Enemy Spawning Logic
  const spawnWaveEnemies = useCallback((currentWave: number) => {
    const count = 5 + currentWave * 3;
    const isBossWave = currentWave % 5 === 0;

    if (isBossWave) {
      setBossActive(true);
      const bossHpValue = 1000 + currentWave * 500;
      setBossHp({ current: bossHpValue, max: bossHpValue });

      enemiesRef.current.push({
        id: ++enemyIdCounter.current,
        x: 400,
        y: 120,
        vx: 2,
        vy: 0,
        type: "boss",
        hp: bossHpValue,
        maxHp: bossHpValue,
        radius: 45,
        scoreValue: 2500,
        lastShoot: 0,
        shootInterval: 800,
        color: "#f43f5e",
        bossPhase: 1,
        angle: 0
      });
      return;
    }

    setBossActive(false);
    setBossHp(null);

    for (let i = 0; i < count; i++) {
      const typeRand = Math.random();
      let type: "scout" | "interceptor" | "dreadnought" | "phantom" = "scout";
      let hp = 30 + currentWave * 5;
      let radius = 16;
      let color = "#38bdf8";
      let scoreVal = 100;
      let interval = 1200;

      if (typeRand > 0.75) {
        type = "dreadnought";
        hp = 120 + currentWave * 20;
        radius = 28;
        color = "#a855f7";
        scoreVal = 300;
        interval = 1800;
      } else if (typeRand > 0.45) {
        type = "interceptor";
        hp = 60 + currentWave * 10;
        radius = 20;
        color = "#f59e0b";
        scoreVal = 200;
        interval = 1000;
      } else if (typeRand > 0.3) {
        type = "phantom";
        hp = 40 + currentWave * 8;
        radius = 15;
        color = "#10b981";
        scoreVal = 250;
        interval = 1400;
      }

      enemiesRef.current.push({
        id: ++enemyIdCounter.current,
        x: 60 + Math.random() * 680,
        y: -50 - Math.random() * 400,
        vx: (Math.random() - 0.5) * 3,
        vy: Math.random() * 1.5 + 1.2,
        type,
        hp,
        maxHp: hp,
        radius,
        scoreValue: scoreVal,
        lastShoot: 0,
        shootInterval: interval,
        color
      });
    }
  }, []);

  // Main Render & Game Loop
  useEffect(() => {
    if (gameState !== "playing") return;

    let animId: number;
    let lastTime = performance.now();

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const gameLoop = (currentTime: number) => {
      const dt = Math.min((currentTime - lastTime) / 1000, 0.1);
      lastTime = currentTime;

      // ---------------------------------------------------------------------
      // 1. UPDATE LOGIC
      // ---------------------------------------------------------------------
      const p = playerRef.current;

      // Invulnerability Countdown
      if (p.invulnerableTimer > 0) p.invulnerableTimer -= dt;

      // Movement Handling
      const moveSpeed = p.speed;
      if (keysRef.current["KeyW"] || keysRef.current["ArrowUp"]) p.y -= moveSpeed;
      if (keysRef.current["KeyS"] || keysRef.current["ArrowDown"]) p.y += moveSpeed;
      if (keysRef.current["KeyA"] || keysRef.current["ArrowLeft"]) p.x -= moveSpeed;
      if (keysRef.current["KeyD"] || keysRef.current["ArrowRight"]) p.x += moveSpeed;

      // Clamp Player Position
      p.x = Math.max(p.radius, Math.min(800 - p.radius, p.x));
      p.y = Math.max(p.radius, Math.min(800 - p.radius, p.y));

      // Shield Regeneration
      if (p.shield < p.maxShield) {
        p.shield = Math.min(p.maxShield, p.shield + 3 * dt);
      }

      // Player Firing
      const now = performance.now();
      if ((mouseRef.current.down || keysRef.current["Space"]) && now - p.lastShot > p.fireRate) {
        p.lastShot = now;
        sounds.playLaser();

        const level = p.weaponLevel;
        if (level === 1) {
          bulletsRef.current.push({ x: p.x, y: p.y - 15, vx: 0, vy: -14, isPlayer: true, color: "#38bdf8", radius: 4, damage: 25 });
        } else if (level === 2) {
          bulletsRef.current.push(
            { x: p.x - 8, y: p.y - 12, vx: -1, vy: -14, isPlayer: true, color: "#38bdf8", radius: 4, damage: 22 },
            { x: p.x + 8, y: p.y - 12, vx: 1, vy: -14, isPlayer: true, color: "#38bdf8", radius: 4, damage: 22 }
          );
        } else if (level >= 3) {
          bulletsRef.current.push(
            { x: p.x - 12, y: p.y - 10, vx: -2.5, vy: -14, isPlayer: true, color: "#a855f7", radius: 4, damage: 20 },
            { x: p.x, y: p.y - 18, vx: 0, vy: -15, isPlayer: true, color: "#38bdf8", radius: 5, damage: 28 },
            { x: p.x + 12, y: p.y - 10, vx: 2.5, vy: -14, isPlayer: true, color: "#a855f7", radius: 4, damage: 20 }
          );
        }

        // Companion Drone Shots
        p.drones.forEach((drone) => {
          const dx = p.x + drone.offsetX;
          const dy = p.y + drone.offsetY;
          bulletsRef.current.push({ x: dx, y: dy, vx: 0, vy: -13, isPlayer: true, color: "#10b981", radius: 3, damage: 15 });
        });
      }

      // Companion Drones Animation Angle
      p.drones.forEach((drone, idx) => {
        drone.angle += 2 * dt;
        drone.offsetX = Math.cos(drone.angle + idx * Math.PI) * 35;
        drone.offsetY = Math.sin(drone.angle + idx * Math.PI) * 20;
      });

      // Update Bullets
      bulletsRef.current.forEach((b) => {
        b.x += b.vx;
        b.y += b.vy;
      });
      bulletsRef.current = bulletsRef.current.filter((b) => b.x >= 0 && b.x <= 800 && b.y >= -20 && b.y <= 820);

      // Update Starfield
      starsRef.current.forEach((star) => {
        star.y += star.speed;
        if (star.y > 800) {
          star.y = 0;
          star.x = Math.random() * 800;
        }
      });

      // Update Enemies & Firing
      enemiesRef.current.forEach((enemy) => {
        enemy.x += enemy.vx;
        enemy.y += enemy.vy;

        // Bounce horizontally
        if (enemy.x - enemy.radius <= 0 || enemy.x + enemy.radius >= 800) {
          enemy.vx *= -1;
        }

        // Boss Movement Pattern
        if (enemy.type === "boss") {
          enemy.angle = (enemy.angle || 0) + 1.5 * dt;
          enemy.x = 400 + Math.sin(enemy.angle) * 250;
          if (now - enemy.lastShoot > enemy.shootInterval) {
            enemy.lastShoot = now;
            sounds.playEnemyLaser();
            
            // Bullet Hell Spiral Output
            for (let a = 0; a < Math.PI * 2; a += Math.PI / 4) {
              bulletsRef.current.push({
                x: enemy.x,
                y: enemy.y,
                vx: Math.cos(a + enemy.angle!) * 4.5,
                vy: Math.sin(a + enemy.angle!) * 4.5,
                isPlayer: false,
                color: "#f43f5e",
                radius: 5,
                damage: 15
              });
            }
          }
        } else {
          // Standard Enemies Firing
          if (now - enemy.lastShoot > enemy.shootInterval && enemy.y > 0) {
            enemy.lastShoot = now;
            sounds.playEnemyLaser();
            const angle = Math.atan2(p.y - enemy.y, p.x - enemy.x);
            bulletsRef.current.push({
              x: enemy.x,
              y: enemy.y,
              vx: Math.cos(angle) * 5,
              vy: Math.sin(angle) * 5,
              isPlayer: false,
              color: enemy.color,
              radius: 4,
              damage: 12
            });
          }
        }
      });

      // Remove Enemies Out of Bounds
      enemiesRef.current = enemiesRef.current.filter((e) => e.y < 850);

      // Spawn Next Wave if cleared
      if (enemiesRef.current.length === 0) {
        setWave((w) => {
          const nextW = w + 1;
          spawnWaveEnemies(nextW);
          return nextW;
        });
      }

      // Update PowerUps
      powerUpsRef.current.forEach((pu) => {
        pu.y += 2;
      });

      // PowerUp Collision with Player
      powerUpsRef.current.forEach((pu, idx) => {
        const dist = Math.hypot(pu.x - p.x, pu.y - p.y);
        if (dist < pu.radius + p.radius) {
          sounds.playPowerup();
          if (pu.type === "shield") {
            p.shield = p.maxShield;
            p.hp = Math.min(p.maxHp, p.hp + 25);
          } else if (pu.type === "overdrive") {
            p.weaponLevel = Math.min(4, p.weaponLevel + 1);
          } else if (pu.type === "nuke") {
            setNukeReady(true);
          } else if (pu.type === "multiplier") {
            setMultiplier((m) => m + 1);
          }
          powerUpsRef.current.splice(idx, 1);
        }
      });

      // Bullet Collisions
      bulletsRef.current.forEach((bullet, bIdx) => {
        if (bullet.isPlayer) {
          // Hit Enemies
          enemiesRef.current.forEach((enemy) => {
            const dist = Math.hypot(bullet.x - enemy.x, bullet.y - enemy.y);
            if (dist < bullet.radius + enemy.radius) {
              enemy.hp -= bullet.damage;
              bulletsRef.current.splice(bIdx, 1);

              // Spark particles
              for (let i = 0; i < 4; i++) {
                particlesRef.current.push({
                  x: bullet.x,
                  y: bullet.y,
                  vx: (Math.random() - 0.5) * 4,
                  vy: (Math.random() - 0.5) * 4,
                  life: 1,
                  maxLife: 15,
                  color: "#a855f7",
                  size: Math.random() * 3 + 1
                });
              }

              // Update Boss HP UI
              if (enemy.type === "boss") {
                setBossHp({ current: Math.max(0, enemy.hp), max: enemy.maxHp });
              }

              // Enemy Destroyed
              if (enemy.hp <= 0) {
                sounds.playExplosion(enemy.type === "boss" || enemy.type === "dreadnought");
                screenShakeRef.current = enemy.type === "boss" ? 18 : 6;

                // Score & Credits reward
                const addedScore = enemy.scoreValue * multiplier;
                setScore((s) => {
                  const newS = s + addedScore;
                  setHighScore((hs) => {
                    if (newS > hs) {
                      localStorage.setItem("plasma_strike_highscore", newS.toString());
                      return newS;
                    }
                    return hs;
                  });
                  return newS;
                });
                setCredits((c) => c + Math.floor(enemy.scoreValue / 10));

                // Explosion Particles
                for (let i = 0; i < (enemy.type === "boss" ? 40 : 15); i++) {
                  particlesRef.current.push({
                    x: enemy.x,
                    y: enemy.y,
                    vx: (Math.random() - 0.5) * 8,
                    vy: (Math.random() - 0.5) * 8,
                    life: 1,
                    maxLife: 25,
                    color: enemy.color,
                    size: Math.random() * 4 + 2
                  });
                }

                // PowerUp Drop Chance
                if (Math.random() < 0.25 || enemy.type === "boss") {
                  const types: ("shield" | "overdrive" | "multiplier")[] = ["shield", "overdrive", "multiplier"];
                  const selected = types[Math.floor(Math.random() * types.length)];
                  powerUpsRef.current.push({
                    x: enemy.x,
                    y: enemy.y,
                    type: selected,
                    radius: 12,
                    duration: 10
                  });
                }
              }
            }
          });
        } else {
          // Hit Player
          const dist = Math.hypot(bullet.x - p.x, bullet.y - p.y);
          if (dist < bullet.radius + p.radius && p.invulnerableTimer <= 0) {
            bulletsRef.current.splice(bIdx, 1);
            screenShakeRef.current = 8;

            // Damage Shield First
            if (p.shield > 0) {
              p.shield -= bullet.damage;
              if (p.shield < 0) {
                p.hp += p.shield; // absorb remaining damage to hp
                p.shield = 0;
              }
            } else {
              p.hp -= bullet.damage;
            }

            // Check Game Over
            if (p.hp <= 0) {
              sounds.playExplosion(true);
              setGameState("gameover");
            }
          }
        }
      });

      // Filter Dead Enemies
      enemiesRef.current = enemiesRef.current.filter((e) => e.hp > 0);

      // Update Particles
      particlesRef.current.forEach((part) => {
        part.x += part.vx;
        part.y += part.vy;
        part.life += 1;
      });
      particlesRef.current = particlesRef.current.filter((part) => part.life < part.maxLife);

      // ---------------------------------------------------------------------
      // 2. RENDER LOGIC
      // ---------------------------------------------------------------------
      ctx.clearRect(0, 0, 800, 800);

      // Handle Screen Shake
      ctx.save();
      if (screenShakeRef.current > 0) {
        const shakeX = (Math.random() - 0.5) * screenShakeRef.current;
        const shakeY = (Math.random() - 0.5) * screenShakeRef.current;
        ctx.translate(shakeX, shakeY);
        screenShakeRef.current *= 0.88;
        if (screenShakeRef.current < 0.5) screenShakeRef.current = 0;
      }

      // Draw Grid Background
      ctx.strokeStyle = "rgba(56, 189, 248, 0.05)";
      ctx.lineWidth = 1;
      for (let x = 0; x < 800; x += 40) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, 800);
        ctx.stroke();
      }
      for (let y = 0; y < 800; y += 40) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(800, y);
        ctx.stroke();
      }

      // Draw Starfield
      starsRef.current.forEach((star) => {
        ctx.fillStyle = `rgba(255, 255, 255, ${star.opacity})`;
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
        ctx.fill();
      });

      // Draw PowerUps
      powerUpsRef.current.forEach((pu) => {
        ctx.fillStyle = pu.type === "shield" ? "#38bdf8" : pu.type === "overdrive" ? "#f59e0b" : "#a855f7";
        ctx.shadowColor = ctx.fillStyle;
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.arc(pu.x, pu.y, pu.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      });

      // Draw Bullets
      bulletsRef.current.forEach((b) => {
        ctx.fillStyle = b.color;
        ctx.shadowColor = b.color;
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      });

      // Draw Enemies
      enemiesRef.current.forEach((e) => {
        ctx.save();
        ctx.translate(e.x, e.y);

        if (e.type === "boss") {
          // Draw Boss Mech Shape
          ctx.fillStyle = e.color;
          ctx.shadowColor = e.color;
          ctx.shadowBlur = 15;
          ctx.beginPath();
          ctx.moveTo(0, 45);
          ctx.lineTo(-45, -20);
          ctx.lineTo(-20, -45);
          ctx.lineTo(20, -45);
          ctx.lineTo(45, -20);
          ctx.closePath();
          ctx.fill();

          // Inner Glowing Eye
          ctx.fillStyle = "#ffffff";
          ctx.beginPath();
          ctx.arc(0, 0, 14, 0, Math.PI * 2);
          ctx.fill();
        } else {
          // Standard Enemy Fighter Shapes
          ctx.fillStyle = e.color;
          ctx.shadowColor = e.color;
          ctx.shadowBlur = 8;
          ctx.beginPath();
          ctx.moveTo(0, e.radius);
          ctx.lineTo(-e.radius, -e.radius);
          ctx.lineTo(0, -e.radius * 0.5);
          ctx.lineTo(e.radius, -e.radius);
          ctx.closePath();
          ctx.fill();
        }

        ctx.restore();

        // Enemy Health Bar
        if (e.hp < e.maxHp && e.type !== "boss") {
          const hpPct = e.hp / e.maxHp;
          ctx.fillStyle = "rgba(255, 255, 255, 0.2)";
          ctx.fillRect(e.x - 20, e.y - e.radius - 10, 40, 4);
          ctx.fillStyle = "#38bdf8";
          ctx.fillRect(e.x - 20, e.y - e.radius - 10, 40 * hpPct, 4);
        }
      });

      // Draw Companion Drones
      p.drones.forEach((drone) => {
        const dx = p.x + drone.offsetX;
        const dy = p.y + drone.offsetY;
        ctx.fillStyle = "#10b981";
        ctx.shadowColor = "#10b981";
        ctx.shadowBlur = 6;
        ctx.beginPath();
        ctx.arc(dx, dy, 7, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      });

      // Draw Player Fighter
      ctx.save();
      ctx.translate(p.x, p.y);

      // Thruster Flame Particle Trail
      ctx.fillStyle = "rgba(56, 189, 248, 0.8)";
      ctx.beginPath();
      ctx.moveTo(-6, 15);
      ctx.lineTo(0, 25 + Math.random() * 8);
      ctx.lineTo(6, 15);
      ctx.closePath();
      ctx.fill();

      // Main Ship Geometry
      ctx.fillStyle = "#ffffff";
      ctx.shadowColor = "#38bdf8";
      ctx.shadowBlur = 12;
      ctx.beginPath();
      ctx.moveTo(0, -22);
      ctx.lineTo(-18, 14);
      ctx.lineTo(-8, 10);
      ctx.lineTo(0, 16);
      ctx.lineTo(8, 10);
      ctx.lineTo(18, 14);
      ctx.closePath();
      ctx.fill();

      // Cockpit Glow
      ctx.fillStyle = "#38bdf8";
      ctx.beginPath();
      ctx.arc(0, -4, 5, 0, Math.PI * 2);
      ctx.fill();

      // Aegis Shield Aura
      if (p.shield > 0) {
        ctx.strokeStyle = `rgba(56, 189, 248, ${0.3 + (p.shield / p.maxShield) * 0.4})`;
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.arc(0, 0, p.radius + 8, 0, Math.PI * 2);
        ctx.stroke();
      }

      ctx.restore();

      // Draw Particles
      particlesRef.current.forEach((part) => {
        const alpha = 1 - part.life / part.maxLife;
        ctx.fillStyle = part.color;
        ctx.globalAlpha = alpha;
        ctx.beginPath();
        ctx.arc(part.x, part.y, part.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1.0;
      });

      ctx.restore();

      animId = requestAnimationFrame(gameLoop);
    };

    // First wave spawn trigger if starting fresh
    if (enemiesRef.current.length === 0 && wave === 1) {
      spawnWaveEnemies(1);
    }

    animId = requestAnimationFrame(gameLoop);
    return () => cancelAnimationFrame(animId);
  }, [gameState, wave, multiplier, spawnWaveEnemies]);

  // Handle Mouse Firing
  const handleMouseDown = () => {
    mouseRef.current.down = true;
  };
  const handleMouseUp = () => {
    mouseRef.current.down = false;
  };
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (rect) {
      mouseRef.current.x = e.clientX - rect.left;
      mouseRef.current.y = e.clientY - rect.top;
    }
  };

  // Buy Upgrades Logic
  const buyUpgrade = (upgradeId: string) => {
    const target = upgrades.find((u) => u.id === upgradeId);
    if (!target || target.level >= target.maxLevel || credits < target.cost) return;

    setCredits((c) => c - target.cost);

    setUpgrades((prev) =>
      prev.map((u) => (u.id === upgradeId ? { ...u, level: u.level + 1, cost: Math.floor(u.cost * 1.6) } : u))
    );

    const p = playerRef.current;
    if (upgradeId === "weapon") {
      p.weaponLevel += 1;
      p.fireRate = Math.max(70, p.fireRate - 15);
    } else if (upgradeId === "shield") {
      p.maxShield += 30;
      p.shield = p.maxShield;
    } else if (upgradeId === "speed") {
      p.speed += 1.5;
    } else if (upgradeId === "drones") {
      p.drones.push({ offsetX: 35, offsetY: 0, angle: 0, lastShoot: 0 });
    }
  };

  return (
    <div className="relative min-h-screen bg-[#05030d] text-white flex flex-col items-center justify-center font-sans overflow-hidden select-none">
      {/* Background Decorative Ambient Gradients */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top Header Navigation */}
      <header className="w-full max-w-5xl px-6 py-4 flex items-center justify-between z-10 border-b border-white/10 bg-black/40 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <Link
            href="/game"
            className="p-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition text-gray-400 hover:text-white"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-xl font-extrabold tracking-wider bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 via-sky-300 to-purple-500">
              PLASMA STRIKE: CYBER OVERDRIVE
            </h1>
            <p className="text-xs text-cyan-400/70 font-mono">XAKTEIR BESPOKE CANV-ENGINE v2.4</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={() => {
              sounds.enabled = !soundEnabled;
              setSoundEnabled(!soundEnabled);
            }}
            className="p-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition text-gray-300"
          >
            {soundEnabled ? <Volume2 className="w-5 h-5 text-cyan-400" /> : <VolumeX className="w-5 h-5 text-rose-400" />}
          </button>

          {gameState === "playing" && (
            <button
              onClick={() => setGameState("paused")}
              className="p-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition text-gray-300"
            >
              <Pause className="w-5 h-5" />
            </button>
          )}
        </div>
      </header>

      {/* Main Container */}
      <main className="relative flex flex-col items-center justify-center my-6 z-10">
        {/* Canvas & HUD Area */}
        <div className="relative rounded-2xl overflow-hidden border border-cyan-500/30 shadow-[0_0_50px_rgba(56,189,248,0.15)] bg-black">
          <canvas
            ref={canvasRef}
            width={800}
            height={800}
            onMouseDown={handleMouseDown}
            onMouseUp={handleMouseUp}
            onMouseMove={handleMouseMove}
            className="cursor-crosshair block"
          />

          {/* PLAYING HUD OVERLAY */}
          {gameState === "playing" && (
            <div className="absolute top-0 left-0 w-full p-4 pointer-events-none flex justify-between items-start">
              {/* Left Player Health & Shield */}
              <div className="flex flex-col gap-2 bg-black/60 backdrop-blur-md p-3 rounded-xl border border-white/10 min-w-[200px]">
                <div className="flex items-center justify-between text-xs font-semibold text-cyan-400">
                  <span className="flex items-center gap-1"><Shield className="w-3.5 h-3.5" /> AEGIS SHIELD</span>
                  <span>{Math.round(playerRef.current.shield)} / {playerRef.current.maxShield}</span>
                </div>
                <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-cyan-400 transition-all duration-150"
                    style={{ width: `${(playerRef.current.shield / playerRef.current.maxShield) * 100}%` }}
                  />
                </div>

                <div className="flex items-center justify-between text-xs font-semibold text-rose-400 mt-1">
                  <span className="flex items-center gap-1"><Activity className="w-3.5 h-3.5" /> HULL INTEGRITY</span>
                  <span>{Math.round(playerRef.current.hp)} / {playerRef.current.maxHp}</span>
                </div>
                <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-rose-500 transition-all duration-150"
                    style={{ width: `${(playerRef.current.hp / playerRef.current.maxHp) * 100}%` }}
                  />
                </div>
              </div>

              {/* Center Boss Health (If Active) */}
              {bossActive && bossHp && (
                <div className="flex flex-col items-center bg-black/80 backdrop-blur-md px-6 py-2 rounded-xl border border-rose-500/40 min-w-[320px]">
                  <span className="text-xs font-extrabold text-rose-400 tracking-wider mb-1 flex items-center gap-2">
                    <Flame className="w-4 h-4 animate-pulse" /> APEX CYBER SOVEREIGN
                  </span>
                  <div className="w-full h-3 bg-white/10 rounded-full overflow-hidden border border-rose-500/30">
                    <div
                      className="h-full bg-gradient-to-r from-rose-600 to-amber-500 transition-all duration-200"
                      style={{ width: `${(bossHp.current / bossHp.max) * 100}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Right Stats (Score, Wave, Nuke Ability) */}
              <div className="flex flex-col items-end gap-2">
                <div className="bg-black/60 backdrop-blur-md p-3 rounded-xl border border-white/10 flex flex-col items-end font-mono">
                  <div className="text-xs text-gray-400">SCORE</div>
                  <div className="text-2xl font-black text-cyan-400 tracking-wider">{score.toLocaleString()}</div>
                  <div className="text-xs text-amber-400 mt-1">WAVE {wave} • {multiplier}x COMBO</div>
                </div>

                {/* Super Nuke Button */}
                <button
                  onClick={triggerSuperNuke}
                  disabled={!nukeReady}
                  className={`pointer-events-auto px-4 py-2 rounded-xl border text-xs font-bold flex items-center gap-2 transition shadow-lg ${
                    nukeReady
                      ? "bg-purple-600/80 border-purple-400 hover:bg-purple-500 text-white cursor-pointer shadow-purple-500/20"
                      : "bg-gray-800/60 border-gray-700 text-gray-500 cursor-not-allowed"
                  }`}
                >
                  <Sparkles className="w-4 h-4" /> SUPER NUKE (SPACE)
                </button>
              </div>
            </div>
          )}

          {/* MENU OVERLAY */}
          {gameState === "menu" && (
            <div className="absolute inset-0 bg-black/85 backdrop-blur-md flex flex-col items-center justify-center p-8 text-center z-20">
              <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
                <h2 className="text-5xl font-black tracking-extrawide bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 via-sky-200 to-purple-500 mb-2">
                  PLASMA STRIKE
                </h2>
                <p className="text-cyan-400/80 font-mono text-sm tracking-widest uppercase mb-8">
                  CYBERNETIC ARCADE BULLET HELL
                </p>

                <div className="max-w-md mx-auto bg-white/5 border border-white/10 rounded-2xl p-6 mb-8 text-left text-sm text-gray-300 space-y-3">
                  <div className="flex items-center justify-between border-b border-white/10 pb-2">
                    <span className="text-gray-400">Controls:</span>
                    <span className="font-mono text-cyan-300">WASD / Arrow Keys</span>
                  </div>
                  <div className="flex items-center justify-between border-b border-white/10 pb-2">
                    <span className="text-gray-400">Aim & Shoot:</span>
                    <span className="font-mono text-cyan-300">Mouse Click / Spacebar</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">Super Nuke:</span>
                    <span className="font-mono text-cyan-300">Spacebar (When Charged)</span>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                  <button
                    onClick={startGame}
                    className="px-8 py-4 rounded-xl bg-gradient-to-r from-cyan-500 to-purple-600 font-extrabold text-white tracking-wider hover:opacity-90 transition shadow-lg shadow-cyan-500/25 flex items-center gap-2 text-lg"
                  >
                    <Play className="w-5 h-5 fill-current" /> LAUNCH MISSION
                  </button>

                  <button
                    onClick={() => setGameState("shop")}
                    className="px-6 py-4 rounded-xl bg-white/5 border border-white/10 font-bold text-gray-200 hover:bg-white/10 transition flex items-center gap-2"
                  >
                    <Layers className="w-5 h-5 text-purple-400" /> UPGRADE SHOP
                  </button>
                </div>
              </motion.div>
            </div>
          )}

          {/* PAUSED OVERLAY */}
          {gameState === "paused" && (
            <div className="absolute inset-0 bg-black/80 backdrop-blur-md flex flex-col items-center justify-center p-8 text-center z-20">
              <h3 className="text-3xl font-extrabold text-white mb-6">MISSION PAUSED</h3>
              <div className="flex flex-col gap-4 min-w-[220px]">
                <button
                  onClick={() => setGameState("playing")}
                  className="px-6 py-3 rounded-xl bg-cyan-500 font-bold text-white hover:bg-cyan-400 transition"
                >
                  RESUME GAME
                </button>
                <button
                  onClick={() => setGameState("shop")}
                  className="px-6 py-3 rounded-xl bg-purple-600 font-bold text-white hover:bg-purple-500 transition"
                >
                  UPGRADE SHOP
                </button>
                <button
                  onClick={() => setGameState("menu")}
                  className="px-6 py-3 rounded-xl bg-white/10 font-bold text-gray-300 hover:bg-white/20 transition"
                >
                  MAIN MENU
                </button>
              </div>
            </div>
          )}

          {/* UPGRADE SHOP OVERLAY */}
          {gameState === "shop" && (
            <div className="absolute inset-0 bg-black/90 backdrop-blur-md flex flex-col items-center justify-center p-8 z-20">
              <div className="w-full max-w-lg">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-2xl font-black text-cyan-400">CYBER HANGAR UPGRADES</h3>
                    <p className="text-xs text-gray-400 font-mono">CREDITS: {credits} CORE RE-CRYSTALS</p>
                  </div>
                  <button
                    onClick={() => setGameState("playing")}
                    className="px-4 py-2 rounded-xl bg-cyan-500 font-bold text-xs hover:bg-cyan-400 transition"
                  >
                    BACK TO BATTLE
                  </button>
                </div>

                <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
                  {upgrades.map((item) => (
                    <div
                      key={item.id}
                      className="p-4 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between"
                    >
                      <div>
                        <div className="font-bold text-white flex items-center gap-2">
                          {item.name}
                          <span className="text-xs text-cyan-400 bg-cyan-950/80 px-2 py-0.5 rounded border border-cyan-800">
                            LVL {item.level}/{item.maxLevel}
                          </span>
                        </div>
                        <div className="text-xs text-gray-400 mt-1">{item.description}</div>
                      </div>

                      <button
                        onClick={() => buyUpgrade(item.id)}
                        disabled={item.level >= item.maxLevel || credits < item.cost}
                        className={`px-4 py-2 rounded-lg text-xs font-bold border transition ${
                          item.level >= item.maxLevel
                            ? "bg-gray-800 border-gray-700 text-gray-500 cursor-not-allowed"
                            : credits >= item.cost
                            ? "bg-purple-600 border-purple-400 text-white hover:bg-purple-500"
                            : "bg-gray-900 border-gray-800 text-gray-600 cursor-not-allowed"
                        }`}
                      >
                        {item.level >= item.maxLevel ? "MAXED" : `${item.cost} CR`}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* GAME OVER OVERLAY */}
          {gameState === "gameover" && (
            <div className="absolute inset-0 bg-black/90 backdrop-blur-md flex flex-col items-center justify-center p-8 text-center z-20">
              <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
                <h3 className="text-4xl font-black text-rose-500 tracking-wider mb-2">HULL CRITICAL DETONATION</h3>
                <p className="text-gray-400 text-sm font-mono mb-6">MISSION TERMINATED AT WAVE {wave}</p>

                <div className="bg-white/5 border border-white/10 rounded-2xl p-6 min-w-[280px] mb-8 font-mono space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">FINAL SCORE:</span>
                    <span className="text-cyan-400 font-bold">{score.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">PERSONAL BEST:</span>
                    <span className="text-amber-400 font-bold">{highScore.toLocaleString()}</span>
                  </div>
                </div>

                <div className="flex items-center justify-center gap-4">
                  <button
                    onClick={startGame}
                    className="px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-purple-600 font-extrabold text-white hover:opacity-90 transition flex items-center gap-2"
                  >
                    <RotateCcw className="w-5 h-5" /> RESTART MISSION
                  </button>
                  <button
                    onClick={() => setGameState("menu")}
                    className="px-6 py-3 rounded-xl bg-white/10 font-bold text-gray-300 hover:bg-white/20 transition"
                  >
                    MAIN MENU
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </div>
      </main>

      {/* Footer Info */}
      <footer className="z-10 text-xs text-gray-500 font-mono flex items-center gap-4">
        <span>XAKTEIR ECOSYSTEM</span>
        <span>•</span>
        <span>HIGH SCORE: {highScore.toLocaleString()}</span>
      </footer>
    </div>
  );
}
