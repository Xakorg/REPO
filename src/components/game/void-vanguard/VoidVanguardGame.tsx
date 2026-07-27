"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Shield,
  Zap,
  Crosshair,
  Volume2,
  VolumeX,
  RotateCcw,
  Play,
  Pause,
  Award,
  ChevronRight,
  Sparkles,
  ShoppingBag,
  Rocket,
  Flame,
  Radio,
  Sliders,
  Target,
  Maximize2
} from "lucide-react";
import confetti from "canvas-confetti";

// ==========================================
// TYPES & INTERFACES
// ==========================================
export interface PlayerState {
  x: number;
  y: number;
  vx: number;
  vy: number;
  hp: number;
  maxHp: number;
  shield: number;
  maxShield: number;
  overdrive: number;
  maxOverdrive: number;
  score: number;
  credits: number;
  combo: number;
  activeWeapon: "plasma" | "missile" | "beam";
  skin: string;
}

export interface Enemy {
  id: string;
  type: "scout" | "interceptor" | "dreadnought" | "boss";
  x: number;
  y: number;
  vx: number;
  vy: number;
  width: number;
  height: number;
  hp: number;
  maxHp: number;
  shootCooldown: number;
  color: string;
  phase?: number;
  angle?: number;
}

export interface Bullet {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
  isEnemy: boolean;
  damage: number;
  homing?: boolean;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
}

export interface PowerUp {
  id: string;
  type: "health" | "shield" | "quad" | "nuke" | "magnet";
  x: number;
  y: number;
  vy: number;
}

export interface UpgradeItem {
  id: string;
  name: string;
  description: string;
  cost: number;
  level: number;
  maxLevel: number;
  icon: any;
}

// ==========================================
// MAIN GAME COMPONENT
// ==========================================
export default function VoidVanguardGame() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Game state UI controls
  const [gameState, setGameState] = useState<"menu" | "playing" | "paused" | "gameover" | "armory" | "hangar">("menu");
  const [gameMode, setGameMode] = useState<"endless" | "bossrush" | "survival">("endless");
  const [wave, setWave] = useState(1);
  const [waveTitle, setWaveTitle] = useState("");
  const [showWaveBanner, setShowWaveBanner] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Stats & Saved Progression
  const [highScore, setHighScore] = useState(0);
  const [totalCredits, setTotalCredits] = useState(100);
  const [selectedSkin, setSelectedSkin] = useState("phantom");

  // Upgrades
  const [upgrades, setUpgrades] = useState<Record<string, number>>({
    maxShield: 0,
    plasmaRate: 0,
    missileCount: 0,
    thrusterSpeed: 0,
    magnetRadius: 0
  });

  // UI Mirror of player state for HUD rendering
  const [hudStats, setHudStats] = useState<PlayerState>({
    x: 0,
    y: 0,
    vx: 0,
    vy: 0,
    hp: 100,
    maxHp: 100,
    shield: 100,
    maxShield: 100,
    overdrive: 0,
    maxOverdrive: 100,
    score: 0,
    credits: 0,
    combo: 0,
    activeWeapon: "plasma",
    skin: "phantom"
  });

  // Internal mutable refs for 60FPS canvas engine performance
  const playerRef = useRef<PlayerState>({
    x: 400,
    y: 700,
    vx: 0,
    vy: 0,
    hp: 100,
    maxHp: 100,
    shield: 100,
    maxShield: 100,
    overdrive: 0,
    maxOverdrive: 100,
    score: 0,
    credits: 0,
    combo: 0,
    activeWeapon: "plasma",
    skin: "phantom"
  });

  const enemiesRef = useRef<Enemy[]>([]);
  const bulletsRef = useRef<Bullet[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const powerUpsRef = useRef<PowerUp[]>([]);
  const starsRef = useRef<{ x: number; y: number; z: number; size: number; speed: number }[]>([]);
  const keysRef = useRef<Record<string, boolean>>({});
  const audioCtxRef = useRef<AudioContext | null>(null);

  // Weapon cooldowns & buffs
  const lastShotRef = useRef<number>(0);
  const quadBuffUntilRef = useRef<number>(0);
  const magnetBuffUntilRef = useRef<number>(0);
  const bossActiveRef = useRef<boolean>(false);

  // Initialize Web Audio Synth SFX
  const playSound = useCallback((type: "laser" | "explosion" | "shield" | "powerup" | "overdrive" | "boss") => {
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

      if (type === "laser") {
        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(800, now);
        osc.frequency.exponentialRampToValueAtTime(100, now + 0.1);
        gain.gain.setValueAtTime(0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
        osc.start(now);
        osc.stop(now + 0.1);
      } else if (type === "explosion") {
        osc.type = "square";
        osc.frequency.setValueAtTime(150, now);
        osc.frequency.exponentialRampToValueAtTime(30, now + 0.25);
        gain.gain.setValueAtTime(0.25, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);
        osc.start(now);
        osc.stop(now + 0.25);
      } else if (type === "shield") {
        osc.type = "sine";
        osc.frequency.setValueAtTime(300, now);
        osc.frequency.linearRampToValueAtTime(600, now + 0.2);
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
        osc.start(now);
        osc.stop(now + 0.2);
      } else if (type === "powerup") {
        osc.type = "sine";
        osc.frequency.setValueAtTime(440, now);
        osc.frequency.setValueAtTime(660, now + 0.08);
        osc.frequency.setValueAtTime(880, now + 0.16);
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);
        osc.start(now);
        osc.stop(now + 0.25);
      } else if (type === "overdrive") {
        osc.type = "triangle";
        osc.frequency.setValueAtTime(200, now);
        osc.frequency.exponentialRampToValueAtTime(1200, now + 0.4);
        gain.gain.setValueAtTime(0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.4);
        osc.start(now);
        osc.stop(now + 0.4);
      } else if (type === "boss") {
        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(100, now);
        osc.frequency.linearRampToValueAtTime(50, now + 0.5);
        gain.gain.setValueAtTime(0.35, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.5);
        osc.start(now);
        osc.stop(now + 0.5);
      }
    } catch (e) {
      // Ignore audio context errors on un-interacted DOM
    }
  }, [soundEnabled]);

  // Load saved progression
  useEffect(() => {
    const savedHighScore = localStorage.getItem("vv_highscore");
    const savedCredits = localStorage.getItem("vv_credits");
    const savedUpgrades = localStorage.getItem("vv_upgrades");
    const savedSkin = localStorage.getItem("vv_skin");

    if (savedHighScore) setHighScore(parseInt(savedHighScore, 10));
    if (savedCredits) setTotalCredits(parseInt(savedCredits, 10));
    if (savedSkin) setSelectedSkin(savedSkin);
    if (savedUpgrades) {
      try {
        setUpgrades(JSON.parse(savedUpgrades));
      } catch (e) {}
    }
  }, []);

  // Initialize stars background
  useEffect(() => {
    const stars = [];
    for (let i = 0; i < 150; i++) {
      stars.push({
        x: Math.random() * 1200,
        y: Math.random() * 800,
        z: Math.random() * 3 + 1,
        size: Math.random() * 2 + 1,
        speed: Math.random() * 2 + 0.5
      });
    }
    starsRef.current = stars;
  }, []);

  // Handle Keyboard inputs
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      keysRef.current[e.code] = true;
      if (e.code === "KeyP" || e.code === "Escape") {
        if (gameState === "playing") setGameState("paused");
        else if (gameState === "paused") setGameState("playing");
      }
      if (e.code === "Digit1") selectWeapon("plasma");
      if (e.code === "Digit2") selectWeapon("missile");
      if (e.code === "Digit3") selectWeapon("beam");
      if (e.code === "KeyE" || e.code === "KeyF") triggerOverdrive();
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

  // Start new game setup
  const startNewGame = (mode: "endless" | "bossrush" | "survival" = "endless") => {
    setGameMode(mode);
    setWave(1);
    setWaveTitle(`WAVE 1: INITIAL CONTACT`);
    setShowWaveBanner(true);
    setTimeout(() => setShowWaveBanner(false), 3000);

    const initialMaxShield = 100 + (upgrades.maxShield || 0) * 25;

    playerRef.current = {
      x: 400,
      y: 650,
      vx: 0,
      vy: 0,
      hp: 100,
      maxHp: 100,
      shield: initialMaxShield,
      maxShield: initialMaxShield,
      overdrive: 0,
      maxOverdrive: 100,
      score: 0,
      credits: 0,
      combo: 1,
      activeWeapon: "plasma",
      skin: selectedSkin
    };

    setHudStats({ ...playerRef.current });
    enemiesRef.current = [];
    bulletsRef.current = [];
    particlesRef.current = [];
    powerUpsRef.current = [];
    bossActiveRef.current = false;

    spawnWaveEnemies(1, mode);
    setGameState("playing");
  };

  const selectWeapon = (weapon: "plasma" | "missile" | "beam") => {
    playerRef.current.activeWeapon = weapon;
    setHudStats(prev => ({ ...prev, activeWeapon: weapon }));
  };

  // Trigger EMP Overdrive attack
  const triggerOverdrive = () => {
    if (playerRef.current.overdrive >= 100) {
      playerRef.current.overdrive = 0;
      playSound("overdrive");

      // Clear all enemy bullets & damage all enemies
      bulletsRef.current = bulletsRef.current.filter(b => !b.isEnemy);

      enemiesRef.current.forEach(e => {
        e.hp -= 150;
        createExplosion(e.x, e.y, "#00f0ff", 25);
      });

      // EMP Shockwave visual effect
      for (let i = 0; i < 60; i++) {
        const angle = (Math.PI * 2 * i) / 60;
        particlesRef.current.push({
          x: playerRef.current.x,
          y: playerRef.current.y,
          vx: Math.cos(angle) * 12,
          vy: Math.sin(angle) * 12,
          life: 0,
          maxLife: 40,
          color: "#00f0ff",
          size: 4
        });
      }
    }
  };

  // Spawn enemy logic
  const spawnWaveEnemies = (waveNum: number, mode: string) => {
    const enemies: Enemy[] = [];
    const count = 5 + waveNum * 3;

    if (waveNum % 5 === 0 || mode === "bossrush") {
      // Boss Wave
      bossActiveRef.current = true;
      playSound("boss");
      setWaveTitle(`WARNING: DREADNOUGHT BOSS APPROACHING`);
      setShowWaveBanner(true);
      setTimeout(() => setShowWaveBanner(false), 3500);

      enemies.push({
        id: "boss-" + Date.now(),
        type: "boss",
        x: 400,
        y: -100,
        vx: 2,
        vy: 1,
        width: 160,
        height: 100,
        hp: 500 + waveNum * 250,
        maxHp: 500 + waveNum * 250,
        shootCooldown: 0,
        color: "#ff0055",
        phase: 1
      });
    } else {
      bossActiveRef.current = false;
      for (let i = 0; i < count; i++) {
        const isInter = Math.random() > 0.6;
        const isDread = !isInter && Math.random() > 0.8;
        const type = isDread ? "dreadnought" : isInter ? "interceptor" : "scout";

        enemies.push({
          id: `enemy-${i}-${Date.now()}`,
          type,
          x: 60 + Math.random() * 680,
          y: -50 - Math.random() * 400,
          vx: (Math.random() - 0.5) * (type === "scout" ? 4 : 2),
          vy: Math.random() * 1.5 + 1,
          width: type === "dreadnought" ? 70 : type === "interceptor" ? 45 : 35,
          height: type === "dreadnought" ? 50 : type === "interceptor" ? 35 : 30,
          hp: type === "dreadnought" ? 60 : type === "interceptor" ? 25 : 10,
          maxHp: type === "dreadnought" ? 60 : type === "interceptor" ? 25 : 10,
          shootCooldown: Math.random() * 60,
          color: type === "dreadnought" ? "#a855f7" : type === "interceptor" ? "#06b6d4" : "#f43f5e"
        });
      }
    }

    enemiesRef.current = enemies;
  };

  // Create particle explosion helper
  const createExplosion = (x: number, y: number, color: string, count: number = 15) => {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 6 + 1;
      particlesRef.current.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 0,
        maxLife: 20 + Math.random() * 20,
        color,
        size: Math.random() * 3 + 1
      });
    }
  };

  // Main 60 FPS Engine Loop
  useEffect(() => {
    let animationFrameId: number;

    const render = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      // Adjust high DPI canvas sizing
      if (canvas.width !== 800 || canvas.height !== 700) {
        canvas.width = 800;
        canvas.height = 700;
      }

      // Background clearing with radial gradient synth atmosphere
      ctx.fillStyle = "#030712";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Starfield rendering & parallax updates
      ctx.fillStyle = "#ffffff";
      starsRef.current.forEach(star => {
        star.y += star.speed * (gameState === "playing" ? 1.5 : 0.5);
        if (star.y > canvas.height) star.y = 0;
        const opacity = Math.min(1, star.z / 3);
        ctx.fillStyle = `rgba(255, 255, 255, ${opacity})`;
        ctx.fillRect(star.x, star.y, star.size, star.size);
      });

      if (gameState === "playing") {
        const player = playerRef.current;
        const keys = keysRef.current;

        // Player Speed & Upgrades
        const baseSpeed = 5 + (upgrades.thrusterSpeed || 0) * 0.8;
        if (keys["KeyA"] || keys["ArrowLeft"]) player.x -= baseSpeed;
        if (keys["KeyD"] || keys["ArrowRight"]) player.x += baseSpeed;
        if (keys["KeyW"] || keys["ArrowUp"]) player.y -= baseSpeed;
        if (keys["KeyS"] || keys["ArrowDown"]) player.y += baseSpeed;

        // Keep inside bounds
        player.x = Math.max(30, Math.min(canvas.width - 30, player.x));
        player.y = Math.max(50, Math.min(canvas.height - 50, player.y));

        // Player engine thruster particles
        particlesRef.current.push({
          x: player.x + (Math.random() - 0.5) * 10,
          y: player.y + 20,
          vx: (Math.random() - 0.5) * 1,
          vy: Math.random() * 4 + 2,
          life: 0,
          maxLife: 15,
          color: player.skin === "reaper" ? "#00ffcc" : player.skin === "tempest" ? "#ffaa00" : "#00f0ff",
          size: Math.random() * 3 + 1
        });

        // Firing Mechanics
        const now = Date.now();
        const fireRateDelay = Math.max(80, 160 - (upgrades.plasmaRate || 0) * 20);
        const isQuadActive = now < quadBuffUntilRef.current;

        if ((keys["Space"] || keys["KeyJ"]) && now - lastShotRef.current > fireRateDelay) {
          lastShotRef.current = now;
          playSound("laser");

          if (player.activeWeapon === "plasma") {
            const damage = isQuadActive ? 30 : 15;
            bulletsRef.current.push({
              id: "b-" + Date.now(),
              x: player.x - 12,
              y: player.y - 15,
              vx: 0,
              vy: -14,
              radius: 4,
              color: isQuadActive ? "#f59e0b" : "#06b6d4",
              isEnemy: false,
              damage
            });
            bulletsRef.current.push({
              id: "b-" + (Date.now() + 1),
              x: player.x + 12,
              y: player.y - 15,
              vx: 0,
              vy: -14,
              radius: 4,
              color: isQuadActive ? "#f59e0b" : "#06b6d4",
              isEnemy: false,
              damage
            });

            if (isQuadActive) {
              bulletsRef.current.push({
                id: "b-" + (Date.now() + 2),
                x: player.x - 20,
                y: player.y - 10,
                vx: -3,
                vy: -13,
                radius: 4,
                color: "#f59e0b",
                isEnemy: false,
                damage
              });
              bulletsRef.current.push({
                id: "b-" + (Date.now() + 3),
                x: player.x + 20,
                y: player.y - 10,
                vx: 3,
                vy: -13,
                radius: 4,
                color: "#f59e0b",
                isEnemy: false,
                damage
              });
            }
          } else if (player.activeWeapon === "missile") {
            const extraCount = upgrades.missileCount || 0;
            for (let m = 0; m < 2 + extraCount; m++) {
              const spreadVx = (m - (1 + extraCount / 2)) * 2;
              bulletsRef.current.push({
                id: "m-" + Date.now() + m,
                x: player.x + spreadVx * 5,
                y: player.y - 15,
                vx: spreadVx,
                vy: -8,
                radius: 5,
                color: "#a855f7",
                isEnemy: false,
                damage: 35,
                homing: true
              });
            }
          } else if (player.activeWeapon === "beam") {
            // Quantum beam continuous pulse
            bulletsRef.current.push({
              id: "beam-" + Date.now(),
              x: player.x,
              y: player.y - 25,
              vx: 0,
              vy: -18,
              radius: 8,
              color: "#3b82f6",
              isEnemy: false,
              damage: 25
            });
          }
        }

        // Magnet buff pulling credits & powerups
        const isMagnetActive = now < magnetBuffUntilRef.current;
        const magnetRange = 100 + (upgrades.magnetRadius || 0) * 50 + (isMagnetActive ? 200 : 0);

        powerUpsRef.current.forEach(p => {
          const dx = player.x - p.x;
          const dy = player.y - p.y;
          const dist = Math.hypot(dx, dy);

          if (dist < magnetRange) {
            p.x += (dx / dist) * 7;
            p.y += (dy / dist) * 7;
          } else {
            p.y += p.vy;
          }

          // Pickup check
          if (dist < 30) {
            playSound("powerup");
            if (p.type === "health") {
              player.hp = Math.min(player.maxHp, player.hp + 35);
            } else if (p.type === "shield") {
              player.shield = player.maxShield;
              playSound("shield");
            } else if (p.type === "quad") {
              quadBuffUntilRef.current = Date.now() + 8000;
            } else if (p.type === "magnet") {
              magnetBuffUntilRef.current = Date.now() + 10000;
            } else if (p.type === "nuke") {
              // Destroy all non-boss enemies
              enemiesRef.current.forEach(e => {
                if (e.type !== "boss") {
                  e.hp = 0;
                  createExplosion(e.x, e.y, "#ffcc00", 20);
                }
              });
            }
            p.y = 9999; // trigger remove
          }
        });

        powerUpsRef.current = powerUpsRef.current.filter(p => p.y < canvas.height + 20);

        // Update bullets & Homing AI
        bulletsRef.current.forEach(bullet => {
          if (bullet.homing && !bullet.isEnemy && enemiesRef.current.length > 0) {
            // Find target enemy
            let closest = enemiesRef.current[0];
            let minDist = Math.hypot(closest.x - bullet.x, closest.y - bullet.y);
            enemiesRef.current.forEach(e => {
              const d = Math.hypot(e.x - bullet.x, e.y - bullet.y);
              if (d < minDist) {
                minDist = d;
                closest = e;
              }
            });

            if (closest) {
              const dx = closest.x - bullet.x;
              const dy = closest.y - bullet.y;
              bullet.vx += (dx / minDist) * 0.8;
              bullet.vy += (dy / minDist) * 0.8;
            }
          }

          bullet.x += bullet.vx;
          bullet.y += bullet.vy;

          // Trail FX
          particlesRef.current.push({
            x: bullet.x,
            y: bullet.y,
            vx: 0,
            vy: 0,
            life: 0,
            maxLife: 6,
            color: bullet.color,
            size: bullet.radius * 0.8
          });
        });

        bulletsRef.current = bulletsRef.current.filter(
          b => b.x > 0 && b.x < canvas.width && b.y > 0 && b.y < canvas.height
        );

        // Update enemies
        enemiesRef.current.forEach(enemy => {
          if (enemy.type === "boss") {
            // Boss Movement logic
            if (enemy.y < 120) enemy.y += enemy.vy;
            else {
              enemy.x += enemy.vx;
              if (enemy.x < 100 || enemy.x > canvas.width - 100) enemy.vx *= -1;
            }

            // Boss bullet barrage
            enemy.shootCooldown++;
            if (enemy.shootCooldown > 45) {
              enemy.shootCooldown = 0;
              for (let a = -2; a <= 2; a++) {
                bulletsRef.current.push({
                  id: "eb-" + Date.now() + a,
                  x: enemy.x + a * 20,
                  y: enemy.y + 40,
                  vx: a * 1.5,
                  vy: 6,
                  radius: 5,
                  color: "#ff0055",
                  isEnemy: true,
                  damage: 15
                });
              }
            }
          } else {
            enemy.x += enemy.vx;
            enemy.y += enemy.vy;

            if (enemy.x < 20 || enemy.x > canvas.width - 20) enemy.vx *= -1;

            // Enemy Shooting
            enemy.shootCooldown++;
            if (enemy.shootCooldown > (enemy.type === "dreadnought" ? 60 : 100)) {
              enemy.shootCooldown = 0;
              bulletsRef.current.push({
                id: "eb-" + Date.now(),
                x: enemy.x,
                y: enemy.y + enemy.height / 2,
                vx: 0,
                vy: 5,
                radius: 4,
                color: "#ff0055",
                isEnemy: true,
                damage: enemy.type === "dreadnought" ? 20 : 10
              });
            }
          }

          // Player & Enemy Bullet Collisions
          bulletsRef.current.forEach(b => {
            if (!b.isEnemy) {
              const hit =
                b.x > enemy.x - enemy.width / 2 &&
                b.x < enemy.x + enemy.width / 2 &&
                b.y > enemy.y - enemy.height / 2 &&
                b.y < enemy.y + enemy.height / 2;

              if (hit) {
                enemy.hp -= b.damage;
                b.y = -999; // trigger remove bullet
                createExplosion(b.x, b.y, "#38bdf8", 6);

                if (enemy.hp <= 0) {
                  createExplosion(enemy.x, enemy.y, enemy.color, enemy.type === "boss" ? 60 : 20);
                  playSound(enemy.type === "boss" ? "boss" : "explosion");

                  const pts = enemy.type === "boss" ? 2500 : enemy.type === "dreadnought" ? 400 : 100;
                  player.score += pts * player.combo;
                  player.credits += Math.floor(pts / 20);
                  player.overdrive = Math.min(100, player.overdrive + (enemy.type === "boss" ? 50 : 8));
                  player.combo = Math.min(10, player.combo + 1);

                  // Chance for Powerup Drop
                  if (Math.random() > 0.7) {
                    const pTypes: ("health" | "shield" | "quad" | "nuke" | "magnet")[] = [
                      "health",
                      "shield",
                      "quad",
                      "nuke",
                      "magnet"
                    ];
                    powerUpsRef.current.push({
                      id: "pu-" + Date.now(),
                      type: pTypes[Math.floor(Math.random() * pTypes.length)],
                      x: enemy.x,
                      y: enemy.y,
                      vy: 1.5
                    });
                  }
                }
              }
            }
          });

          // Player ship collision with enemy body
          const distToPlayer = Math.hypot(player.x - enemy.x, player.y - enemy.y);
          if (distToPlayer < 35) {
            enemy.hp -= 50;
            createExplosion(enemy.x, enemy.y, "#ff0055", 15);
            takePlayerDamage(30);
          }
        });

        // Filter dead enemies
        enemiesRef.current = enemiesRef.current.filter(e => e.hp > 0 && e.y < canvas.height + 100);

        // Process enemy bullets hit on player
        bulletsRef.current.forEach(b => {
          if (b.isEnemy) {
            const dist = Math.hypot(player.x - b.x, player.y - b.y);
            if (dist < 22) {
              b.y = 9999;
              createExplosion(player.x, player.y, "#ef4444", 12);
              takePlayerDamage(b.damage);
            }
          }
        });

        // Wave Completion Check
        if (enemiesRef.current.length === 0) {
          const nextW = wave + 1;
          setWave(nextW);
          player.combo = 1;
          spawnWaveEnemies(nextW, gameMode);
          setWaveTitle(`WAVE ${nextW}: SECTOR CLEAR - NEW ENEMIES SPOTTED`);
          setShowWaveBanner(true);
          setTimeout(() => setShowWaveBanner(false), 3000);
        }

        // Sync state to React HUD
        setHudStats({ ...player });
      }

      // ==========================================
      // CANVAS DRAWING RENDERING
      // ==========================================

      // Render PowerUps
      powerUpsRef.current.forEach(p => {
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.shadowBlur = 10;
        ctx.shadowColor =
          p.type === "health"
            ? "#22c55e"
            : p.type === "shield"
            ? "#3b82f6"
            : p.type === "quad"
            ? "#f59e0b"
            : p.type === "nuke"
            ? "#ef4444"
            : "#a855f7";

        ctx.fillStyle = ctx.shadowColor;
        ctx.beginPath();
        ctx.arc(0, 0, 10, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 10px monospace";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(p.type[0].toUpperCase(), 0, 0);
        ctx.restore();
      });

      // Render Particles
      particlesRef.current.forEach((p, idx) => {
        p.x += p.vx;
        p.y += p.vy;
        p.life++;

        const alpha = 1 - p.life / p.maxLife;
        ctx.fillStyle = p.color;
        ctx.globalAlpha = Math.max(0, alpha);
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
      });

      particlesRef.current = particlesRef.current.filter(p => p.life < p.maxLife);

      // Render Bullets
      bulletsRef.current.forEach(b => {
        ctx.save();
        ctx.shadowBlur = 8;
        ctx.shadowColor = b.color;
        ctx.fillStyle = b.color;
        ctx.beginPath();
        ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });

      // Render Enemies
      enemiesRef.current.forEach(enemy => {
        ctx.save();
        ctx.translate(enemy.x, enemy.y);
        ctx.shadowBlur = 12;
        ctx.shadowColor = enemy.color;

        if (enemy.type === "boss") {
          // Boss Ship rendering
          ctx.fillStyle = "#1e1b4b";
          ctx.strokeStyle = enemy.color;
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.moveTo(0, 50);
          ctx.lineTo(-80, -20);
          ctx.lineTo(-50, -50);
          ctx.lineTo(50, -50);
          ctx.lineTo(80, -20);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();

          // Boss Health Bar overlay
          ctx.fillStyle = "rgba(0, 0, 0, 0.6)";
          ctx.fillRect(-60, -65, 120, 8);
          ctx.fillStyle = "#ef4444";
          ctx.fillRect(-60, -65, (enemy.hp / enemy.maxHp) * 120, 8);
        } else if (enemy.type === "dreadnought") {
          ctx.fillStyle = "#3b0764";
          ctx.strokeStyle = enemy.color;
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(0, 25);
          ctx.lineTo(-35, -25);
          ctx.lineTo(0, -10);
          ctx.lineTo(35, -25);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();
        } else {
          // Scout / Interceptor rendering
          ctx.fillStyle = enemy.color;
          ctx.beginPath();
          ctx.moveTo(0, 15);
          ctx.lineTo(-18, -15);
          ctx.lineTo(0, -5);
          ctx.lineTo(18, -15);
          ctx.closePath();
          ctx.fill();
        }
        ctx.restore();
      });

      // Render Player Starfighter
      if (gameState === "playing" || gameState === "paused") {
        const p = playerRef.current;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.shadowBlur = 15;

        const mainColor =
          p.skin === "reaper"
            ? "#00ffcc"
            : p.skin === "tempest"
            ? "#ffaa00"
            : p.skin === "spectre"
            ? "#c084fc"
            : "#00f0ff";

        ctx.shadowColor = mainColor;
        ctx.fillStyle = "#0f172a";
        ctx.strokeStyle = mainColor;
        ctx.lineWidth = 2;

        // Custom Starfighter Geometry
        ctx.beginPath();
        ctx.moveTo(0, -25);
        ctx.lineTo(-20, 15);
        ctx.lineTo(-8, 10);
        ctx.lineTo(0, 20);
        ctx.lineTo(8, 10);
        ctx.lineTo(20, 15);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Cockpit Glow
        ctx.fillStyle = mainColor;
        ctx.beginPath();
        ctx.ellipse(0, -5, 4, 8, 0, 0, Math.PI * 2);
        ctx.fill();

        // Energy Shield Visual Bubble
        if (p.shield > 0) {
          const shieldAlpha = (p.shield / p.maxShield) * 0.4 + 0.1;
          ctx.strokeStyle = `rgba(59, 130, 246, ${shieldAlpha})`;
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(0, 0, 32, 0, Math.PI * 2);
          ctx.stroke();
        }
        ctx.restore();
      }

      animationFrameId = requestAnimationFrame(render);
    };

    animationFrameId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animationFrameId);
  }, [gameState, wave, gameMode, selectedSkin, upgrades, playSound]);

  // Handle Player Damage
  const takePlayerDamage = (amt: number) => {
    const p = playerRef.current;
    p.combo = 1; // reset combo

    if (p.shield > 0) {
      if (p.shield >= amt) {
        p.shield -= amt;
        playSound("shield");
        return;
      } else {
        const remaining = amt - p.shield;
        p.shield = 0;
        p.hp -= remaining;
      }
    } else {
      p.hp -= amt;
    }

    playSound("explosion");

    if (p.hp <= 0) {
      p.hp = 0;
      setGameState("gameover");

      // Save highscore & credits
      if (p.score > highScore) {
        setHighScore(p.score);
        localStorage.setItem("vv_highscore", p.score.toString());
      }
      const newCreds = totalCredits + p.credits;
      setTotalCredits(newCreds);
      localStorage.setItem("vv_credits", newCreds.toString());

      confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
    }
  };

  // Armory Item Upgrade Purchase
  const buyUpgrade = (key: string, baseCost: number) => {
    const currentLvl = upgrades[key] || 0;
    const cost = baseCost * (currentLvl + 1);

    if (totalCredits >= cost && currentLvl < 5) {
      const nextCreds = totalCredits - cost;
      const nextUpgrades = { ...upgrades, [key]: currentLvl + 1 };

      setTotalCredits(nextCreds);
      setUpgrades(nextUpgrades);

      localStorage.setItem("vv_credits", nextCreds.toString());
      localStorage.setItem("vv_upgrades", JSON.stringify(nextUpgrades));
      playSound("powerup");
    }
  };

  return (
    <div className="relative w-full h-screen bg-black text-white font-sans overflow-hidden select-none flex items-center justify-center">
      {/* Dynamic Background Grid Pattern */}
      <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:24px_24px] opacity-40 pointer-events-none" />

      {/* Main Canvas Viewport */}
      <div className="relative border border-slate-800 rounded-xl shadow-2xl shadow-cyan-500/10 overflow-hidden bg-slate-950">
        <canvas ref={canvasRef} className="block w-[800px] h-[700px]" />

        {/* HUD HEADER OVERLAY */}
        {gameState === "playing" && (
          <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-start pointer-events-none bg-gradient-to-b from-slate-950/80 to-transparent">
            {/* Health & Shield Gauge */}
            <div className="flex flex-col gap-2 w-56">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-blue-400" />
                <div className="flex-1 h-3 bg-slate-900 border border-blue-500/30 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-blue-600 to-cyan-400 transition-all duration-200"
                    style={{ width: `${(hudStats.shield / hudStats.maxShield) * 100}%` }}
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Flame className="w-4 h-4 text-rose-500" />
                <div className="flex-1 h-3 bg-slate-900 border border-rose-500/30 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-rose-600 to-red-400 transition-all duration-200"
                    style={{ width: `${(hudStats.hp / hudStats.maxHp) * 100}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Score & Combo */}
            <div className="text-center">
              <div className="text-xs uppercase tracking-widest text-slate-400">Score</div>
              <div className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500 font-mono">
                {hudStats.score.toLocaleString()}
              </div>
              {hudStats.combo > 1 && (
                <div className="text-xs font-bold text-amber-400 animate-pulse">
                  {hudStats.combo}x COMBO STREAK!
                </div>
              )}
            </div>

            {/* EMP Overdrive Gauge & Pause */}
            <div className="flex flex-col items-end gap-2">
              <button
                onClick={triggerOverdrive}
                className={`pointer-events-auto px-3 py-1.5 rounded-lg border text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all ${
                  hudStats.overdrive >= 100
                    ? "bg-cyan-500 text-slate-950 border-cyan-300 animate-bounce shadow-lg shadow-cyan-500/50 cursor-pointer"
                    : "bg-slate-900/80 border-slate-700 text-slate-500 cursor-not-allowed"
                }`}
              >
                <Zap className="w-3.5 h-3.5" /> EMP Overdrive ({Math.floor(hudStats.overdrive)}%)
              </button>

              <div className="flex gap-2">
                <button
                  onClick={() => setSoundEnabled(!soundEnabled)}
                  className="pointer-events-auto p-2 rounded-lg bg-slate-900/80 border border-slate-700 hover:border-slate-500 text-slate-300"
                >
                  {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4 text-rose-400" />}
                </button>
                <button
                  onClick={() => setGameState("paused")}
                  className="pointer-events-auto p-2 rounded-lg bg-slate-900/80 border border-slate-700 hover:border-slate-500 text-slate-300"
                >
                  <Pause className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* WEAPON SELECTOR FOOTER */}
        {gameState === "playing" && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 p-1.5 rounded-xl bg-slate-900/90 border border-slate-800 backdrop-blur-md">
            {[
              { id: "plasma", label: "Vulcan", key: "1" },
              { id: "missile", label: "Swarm", key: "2" },
              { id: "beam", label: "Quantum", key: "3" }
            ].map(w => (
              <button
                key={w.id}
                onClick={() => selectWeapon(w.id as any)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                  hudStats.activeWeapon === w.id
                    ? "bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/30"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <span className="px-1 bg-slate-950/40 rounded text-[10px]">{w.key}</span> {w.label}
              </button>
            ))}
          </div>
        )}

        {/* WAVE ANNOUNCEMENT BANNER */}
        <AnimatePresence>
          {showWaveBanner && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.1 }}
              className="absolute inset-0 flex items-center justify-center pointer-events-none"
            >
              <div className="px-8 py-4 rounded-2xl bg-cyan-950/80 border border-cyan-500/50 backdrop-blur-md text-center shadow-2xl shadow-cyan-500/30">
                <div className="text-cyan-400 font-mono text-sm tracking-widest font-bold">TACTICAL ALERT</div>
                <div className="text-2xl font-black text-white tracking-wider mt-1">{waveTitle}</div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* MAIN MENU OVERLAY */}
        {gameState === "menu" && (
          <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-md flex flex-col items-center justify-center p-8 text-center">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center shadow-xl shadow-cyan-500/30 mb-6">
              <Rocket className="w-8 h-8 text-white" />
            </div>

            <h1 className="text-4xl font-black tracking-tight text-white mb-2">
              VOID <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">VANGUARD</span>
            </h1>
            <p className="text-slate-400 max-w-md text-sm mb-8">
              Apex sci-fi space shooter. Conquer endless alien armadas, upgrade your starfighter, deploy EMP shockwaves, and beat high scores.
            </p>

            <div className="flex flex-col gap-3 w-64 mb-8">
              <button
                onClick={() => startNewGame("endless")}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 font-bold text-sm tracking-wide shadow-lg shadow-cyan-500/20 hover:opacity-95 transition-all flex items-center justify-center gap-2"
              >
                <Play className="w-4 h-4 fill-current" /> LAUNCH ENDLESS MODE
              </button>

              <button
                onClick={() => startNewGame("bossrush")}
                className="w-full py-3 rounded-xl bg-slate-900 border border-slate-700 hover:border-cyan-500 text-cyan-400 font-bold text-sm tracking-wide transition-all flex items-center justify-center gap-2"
              >
                <Target className="w-4 h-4" /> BOSS RUSH MODE
              </button>

              <div className="flex gap-2">
                <button
                  onClick={() => setGameState("armory")}
                  className="flex-1 py-2.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-600 text-slate-300 font-bold text-xs flex items-center justify-center gap-1.5"
                >
                  <ShoppingBag className="w-4 h-4 text-amber-400" /> ARMORY
                </button>
                <button
                  onClick={() => setGameState("hangar")}
                  className="flex-1 py-2.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-600 text-slate-300 font-bold text-xs flex items-center justify-center gap-1.5"
                >
                  <Sliders className="w-4 h-4 text-purple-400" /> HANGAR
                </button>
              </div>
            </div>

            {/* Highscore & Credits status */}
            <div className="flex items-center gap-6 text-xs text-slate-400 font-mono">
              <div>BEST SCORE: <span className="text-cyan-400 font-bold">{highScore.toLocaleString()}</span></div>
              <div>CREDITS: <span className="text-amber-400 font-bold">{totalCredits.toLocaleString()}</span></div>
            </div>
          </div>
        )}

        {/* PAUSE OVERLAY */}
        {gameState === "paused" && (
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center">
            <h2 className="text-2xl font-black text-white mb-6">MISSION PAUSED</h2>
            <div className="flex flex-col gap-3 w-56">
              <button
                onClick={() => setGameState("playing")}
                className="w-full py-2.5 rounded-xl bg-cyan-500 text-slate-950 font-bold text-sm"
              >
                RESUME FLIGHT
              </button>
              <button
                onClick={() => setGameState("menu")}
                className="w-full py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-300 font-bold text-sm"
              >
                ABORT TO MENU
              </button>
            </div>
          </div>
        )}

        {/* GAME OVER OVERLAY */}
        {gameState === "gameover" && (
          <div className="absolute inset-0 bg-slate-950/95 backdrop-blur-md flex flex-col items-center justify-center p-8 text-center">
            <div className="w-16 h-16 rounded-full bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-500 mb-4">
              <Flame className="w-8 h-8" />
            </div>

            <h2 className="text-3xl font-black text-white mb-1">STARFIGHTER DESTROYED</h2>
            <p className="text-slate-400 text-xs mb-6">Sector defense compromised at Wave {wave}</p>

            <div className="w-72 bg-slate-900/60 border border-slate-800 rounded-xl p-4 mb-6 space-y-2 text-sm font-mono">
              <div className="flex justify-between">
                <span className="text-slate-400">FINAL SCORE</span>
                <span className="text-cyan-400 font-bold">{hudStats.score.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">CREDITS EARNED</span>
                <span className="text-amber-400 font-bold">+{hudStats.credits.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">WAVES SURVIVED</span>
                <span className="text-white font-bold">{wave - 1}</span>
              </div>
            </div>

            <div className="flex gap-3 w-72">
              <button
                onClick={() => startNewGame(gameMode)}
                className="flex-1 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 font-bold text-sm flex items-center justify-center gap-1.5"
              >
                <RotateCcw className="w-4 h-4" /> RETRY
              </button>
              <button
                onClick={() => setGameState("menu")}
                className="flex-1 py-3 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 font-bold text-sm"
              >
                MENU
              </button>
            </div>
          </div>
        )}

        {/* ARMORY MODAL */}
        {gameState === "armory" && (
          <div className="absolute inset-0 bg-slate-950 p-6 flex flex-col">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <ShoppingBag className="w-5 h-5 text-amber-400" /> STARFIGHTER ARMORY
                </h2>
                <p className="text-xs text-slate-400">Upgrade ship subsystems using earned credits</p>
              </div>
              <div className="px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400 font-mono font-bold text-sm">
                💰 {totalCredits.toLocaleString()}
              </div>
            </div>

            <div className="flex-1 space-y-3 overflow-y-auto pr-2">
              {[
                { id: "maxShield", name: "Shield Matrix", desc: "+25 Max Shield capacity per tier", base: 150 },
                { id: "plasmaRate", name: "Plasma Accelerator", desc: "Increases Vulcan cannon fire rate", base: 200 },
                { id: "missileCount", name: "Missile Pods", desc: "+1 Extra missile per barrage", base: 300 },
                { id: "thrusterSpeed", name: "Sub-Light Thrusters", desc: "Increases ship movement agility", base: 125 },
                { id: "magnetRadius", name: "Magnet Core", desc: "Attracts credits & drops from further away", base: 100 }
              ].map(item => {
                const lvl = upgrades[item.id] || 0;
                const cost = item.base * (lvl + 1);

                return (
                  <div key={item.id} className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 flex justify-between items-center">
                    <div>
                      <div className="font-bold text-sm text-white">{item.name}</div>
                      <div className="text-xs text-slate-400">{item.desc}</div>
                      <div className="flex gap-1 mt-2">
                        {[1, 2, 3, 4, 5].map(step => (
                          <div
                            key={step}
                            className={`w-4 h-1.5 rounded-full ${
                              step <= lvl ? "bg-cyan-400" : "bg-slate-800"
                            }`}
                          />
                        ))}
                      </div>
                    </div>

                    <button
                      disabled={lvl >= 5 || totalCredits < cost}
                      onClick={() => buyUpgrade(item.id, item.base)}
                      className={`px-4 py-2 rounded-lg font-bold text-xs font-mono transition-all ${
                        lvl >= 5
                          ? "bg-slate-800 text-slate-500"
                          : totalCredits >= cost
                          ? "bg-amber-500 text-slate-950 hover:bg-amber-400"
                          : "bg-slate-800 text-slate-500 cursor-not-allowed"
                      }`}
                    >
                      {lvl >= 5 ? "MAXED" : `UPGRADE (${cost} CR)`}
                    </button>
                  </div>
                );
              })}
            </div>

            <button
              onClick={() => setGameState("menu")}
              className="mt-4 w-full py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-300 font-bold text-xs"
            >
              RETURN TO MAIN MENU
            </button>
          </div>
        )}

        {/* HANGAR SKIN SELECTOR */}
        {gameState === "hangar" && (
          <div className="absolute inset-0 bg-slate-950 p-6 flex flex-col">
            <div className="mb-6">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Sliders className="w-5 h-5 text-purple-400" /> FLEET HANGAR
              </h2>
              <p className="text-xs text-slate-400">Select starfighter custom plasma hull</p>
            </div>

            <div className="grid grid-cols-2 gap-4 flex-1">
              {[
                { id: "phantom", name: "Void Phantom", color: "#00f0ff", desc: "Standard high-agility interceptor" },
                { id: "reaper", name: "Cyber Reaper", color: "#00ffcc", desc: "Heavy armor plasma specialist" },
                { id: "tempest", name: "Solar Tempest", color: "#ffaa00", desc: "Overcharged solar plasma core" },
                { id: "spectre", name: "Quantum Spectre", color: "#c084fc", desc: "Stealth void wave fighter" }
              ].map(skin => (
                <button
                  key={skin.id}
                  onClick={() => {
                    setSelectedSkin(skin.id);
                    localStorage.setItem("vv_skin", skin.id);
                  }}
                  className={`p-4 rounded-xl border text-left flex flex-col justify-between transition-all ${
                    selectedSkin === skin.id
                      ? "bg-slate-900 border-cyan-500 shadow-lg shadow-cyan-500/20"
                      : "bg-slate-900/50 border-slate-800 hover:border-slate-700"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-4 h-4 rounded-full shadow-md"
                      style={{ backgroundColor: skin.color }}
                    />
                    <span className="font-bold text-sm text-white">{skin.name}</span>
                  </div>
                  <p className="text-xs text-slate-400 mt-2">{skin.desc}</p>
                </button>
              ))}
            </div>

            <button
              onClick={() => setGameState("menu")}
              className="mt-4 w-full py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-300 font-bold text-xs"
            >
              CONFIRM & RETURN TO MENU
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
