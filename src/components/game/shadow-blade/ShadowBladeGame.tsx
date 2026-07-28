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
  Sparkles,
  ShoppingBag,
  Flame,
  Sliders,
  Target,
  Sword,
  Activity,
  ChevronRight,
  RefreshCw
} from "lucide-react";
import confetti from "canvas-confetti";

// ==========================================
// TYPES & INTERFACES
// ==========================================
export interface PlayerNinja {
  x: number;
  y: number;
  vx: number;
  vy: number;
  width: number;
  height: number;
  hp: number;
  maxHp: number;
  energy: number;
  maxEnergy: number;
  shield: number;
  maxShield: number;
  score: number;
  credits: number;
  combo: number;
  isGrounded: boolean;
  isDashing: boolean;
  isSlashing: boolean;
  isDeflecting: boolean;
  facingRight: boolean;
  dashCooldown: number;
  slashCooldown: number;
  invulnerableUntil: number;
  skin: string;
}

export interface EnemyNinja {
  id: string;
  type: "drone" | "ninja" | "mech" | "oni_boss";
  x: number;
  y: number;
  vx: number;
  vy: number;
  width: number;
  height: number;
  hp: number;
  maxHp: number;
  attackCooldown: number;
  facingRight: boolean;
  color: string;
  state: "idle" | "chase" | "attack";
}

export interface Projectile {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
  isEnemy: boolean;
  damage: number;
  isReflected?: boolean;
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
  type?: "spark" | "trail" | "slash" | "ghost";
}

export interface ItemDrop {
  id: string;
  type: "health" | "energy" | "shield" | "credit";
  x: number;
  y: number;
  vy: number;
}

export interface Platform {
  x: number;
  y: number;
  w: number;
  h: number;
  color: string;
}

// ==========================================
// MAIN GAME COMPONENT
// ==========================================
export default function ShadowBladeGame() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Game UI States
  const [gameState, setGameState] = useState<"menu" | "playing" | "paused" | "gameover" | "armory" | "hangar">("menu");
  const [gameMode, setGameMode] = useState<"endless" | "bossrush" | "survival">("endless");
  const [wave, setWave] = useState(1);
  const [waveTitle, setWaveTitle] = useState("");
  const [showWaveBanner, setShowWaveBanner] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Saved Progression State
  const [highScore, setHighScore] = useState(0);
  const [totalCredits, setTotalCredits] = useState(150);
  const [selectedSkin, setSelectedSkin] = useState("neon_cyan");

  // Upgrades
  const [upgrades, setUpgrades] = useState<Record<string, number>>({
    katanaDamage: 0,
    maxHealth: 0,
    energyRegen: 0,
    dashDistance: 0,
    shurikenCount: 0
  });

  // HUD Mirrors for React state
  const [hudStats, setHudStats] = useState({
    hp: 100,
    maxHp: 100,
    energy: 100,
    maxEnergy: 100,
    shield: 100,
    maxShield: 100,
    score: 0,
    credits: 0,
    combo: 1,
    skin: "neon_cyan"
  });

  // Internal mutable refs for 60FPS physics loop
  const playerRef = useRef<PlayerNinja>({
    x: 100,
    y: 450,
    vx: 0,
    vy: 0,
    width: 32,
    height: 48,
    hp: 100,
    maxHp: 100,
    energy: 100,
    maxEnergy: 100,
    shield: 100,
    maxShield: 100,
    score: 0,
    credits: 0,
    combo: 1,
    isGrounded: false,
    isDashing: false,
    isSlashing: false,
    isDeflecting: false,
    facingRight: true,
    dashCooldown: 0,
    slashCooldown: 0,
    invulnerableUntil: 0,
    skin: "neon_cyan"
  });

  const enemiesRef = useRef<EnemyNinja[]>([]);
  const projectilesRef = useRef<Projectile[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const dropsRef = useRef<ItemDrop[]>([]);
  const keysRef = useRef<Record<string, boolean>>({});
  const audioCtxRef = useRef<AudioContext | null>(null);

  // Static Level Platforms
  const platformsRef = useRef<Platform[]>([
    { x: 0, y: 550, w: 900, h: 100, color: "#1e293b" }, // Ground
    { x: 150, y: 420, w: 180, h: 20, color: "#0f172a" },
    { x: 500, y: 420, w: 180, h: 20, color: "#0f172a" },
    { x: 320, y: 300, w: 220, h: 20, color: "#0f172a" },
    { x: 50, y: 220, w: 150, h: 20, color: "#0f172a" },
    { x: 650, y: 220, w: 150, h: 20, color: "#0f172a" }
  ]);

  // Audio Synthesizer using Web Audio API
  const playSound = useCallback((type: "slash" | "dash" | "deflect" | "shuriken" | "explosion" | "powerup" | "boss") => {
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

      if (type === "slash") {
        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(600, now);
        osc.frequency.exponentialRampToValueAtTime(150, now + 0.12);
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.12);
        osc.start(now);
        osc.stop(now + 0.12);
      } else if (type === "dash") {
        osc.type = "sine";
        osc.frequency.setValueAtTime(150, now);
        osc.frequency.exponentialRampToValueAtTime(800, now + 0.15);
        gain.gain.setValueAtTime(0.18, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
        osc.start(now);
        osc.stop(now + 0.15);
      } else if (type === "deflect") {
        osc.type = "triangle";
        osc.frequency.setValueAtTime(1200, now);
        osc.frequency.exponentialRampToValueAtTime(400, now + 0.18);
        gain.gain.setValueAtTime(0.25, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.18);
        osc.start(now);
        osc.stop(now + 0.18);
      } else if (type === "shuriken") {
        osc.type = "sine";
        osc.frequency.setValueAtTime(500, now);
        osc.frequency.linearRampToValueAtTime(900, now + 0.1);
        gain.gain.setValueAtTime(0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
        osc.start(now);
        osc.stop(now + 0.1);
      } else if (type === "explosion") {
        osc.type = "square";
        osc.frequency.setValueAtTime(120, now);
        osc.frequency.exponentialRampToValueAtTime(25, now + 0.3);
        gain.gain.setValueAtTime(0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
        osc.start(now);
        osc.stop(now + 0.3);
      } else if (type === "powerup") {
        osc.type = "sine";
        osc.frequency.setValueAtTime(523, now);
        osc.frequency.setValueAtTime(659, now + 0.08);
        osc.frequency.setValueAtTime(784, now + 0.16);
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);
        osc.start(now);
        osc.stop(now + 0.25);
      } else if (type === "boss") {
        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(90, now);
        osc.frequency.linearRampToValueAtTime(40, now + 0.6);
        gain.gain.setValueAtTime(0.35, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.6);
        osc.start(now);
        osc.stop(now + 0.6);
      }
    } catch (e) {
      // AudioContext fallback
    }
  }, [soundEnabled]);

  // Load saved progression
  useEffect(() => {
    const savedHighScore = localStorage.getItem("sb_highscore");
    const savedCredits = localStorage.getItem("sb_credits");
    const savedUpgrades = localStorage.getItem("sb_upgrades");
    const savedSkin = localStorage.getItem("sb_skin");

    if (savedHighScore) setHighScore(parseInt(savedHighScore, 10));
    if (savedCredits) setTotalCredits(parseInt(savedCredits, 10));
    if (savedSkin) setSelectedSkin(savedSkin);
    if (savedUpgrades) {
      try {
        setUpgrades(JSON.parse(savedUpgrades));
      } catch (e) {}
    }
  }, []);

  // Keyboard controls listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      keysRef.current[e.code] = true;

      if (e.code === "KeyP" || e.code === "Escape") {
        if (gameState === "playing") setGameState("paused");
        else if (gameState === "paused") setGameState("playing");
      }

      if (gameState === "playing") {
        if ((e.code === "KeyW" || e.code === "ArrowUp" || e.code === "Space") && playerRef.current.isGrounded) {
          playerRef.current.vy = -14;
          playerRef.current.isGrounded = false;
        }

        if (e.code === "KeyJ" || e.code === "KeyZ") triggerSlash();
        if (e.code === "KeyK" || e.code === "KeyX") triggerDash();
        if (e.code === "KeyL" || e.code === "KeyC") triggerShuriken();
        if (e.code === "ShiftLeft" || e.code === "ShiftRight") triggerDeflection();
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

  // Start new game
  const startNewGame = (mode: "endless" | "bossrush" | "survival" = "endless") => {
    setGameMode(mode);
    setWave(1);
    setWaveTitle("WAVE 1: CYBER SHADOWS APPROACH");
    setShowWaveBanner(true);
    setTimeout(() => setShowWaveBanner(false), 3000);

    const bonusHp = (upgrades.maxHealth || 0) * 20;

    playerRef.current = {
      x: 100,
      y: 450,
      vx: 0,
      vy: 0,
      width: 32,
      height: 48,
      hp: 100 + bonusHp,
      maxHp: 100 + bonusHp,
      energy: 100,
      maxEnergy: 100,
      shield: 100,
      maxShield: 100,
      score: 0,
      credits: 0,
      combo: 1,
      isGrounded: false,
      isDashing: false,
      isSlashing: false,
      isDeflecting: false,
      facingRight: true,
      dashCooldown: 0,
      slashCooldown: 0,
      invulnerableUntil: 0,
      skin: selectedSkin
    };

    setHudStats({
      hp: playerRef.current.hp,
      maxHp: playerRef.current.maxHp,
      energy: 100,
      maxEnergy: 100,
      shield: 100,
      maxShield: 100,
      score: 0,
      credits: 0,
      combo: 1,
      skin: selectedSkin
    });

    enemiesRef.current = [];
    projectilesRef.current = [];
    particlesRef.current = [];
    dropsRef.current = [];

    spawnWaveEnemies(1, mode);
    setGameState("playing");
  };

  // Katana Slash Action
  const triggerSlash = () => {
    const p = playerRef.current;
    if (Date.now() < p.slashCooldown) return;

    p.slashCooldown = Date.now() + 220;
    p.isSlashing = true;
    playSound("slash");

    setTimeout(() => {
      p.isSlashing = false;
    }, 180);

    // Slash Arc Collision Check
    const slashRange = 65;
    const damage = 30 + (upgrades.katanaDamage || 0) * 12;

    enemiesRef.current.forEach(enemy => {
      const dx = enemy.x - p.x;
      const dy = Math.abs(enemy.y - p.y);
      const inFront = p.facingRight ? dx > -10 && dx < slashRange : dx < 10 && dx > -slashRange;

      if (inFront && dy < 45) {
        enemy.hp -= damage * p.combo;
        createExplosion(enemy.x, enemy.y, "#00f0ff", 15);
        playSound("explosion");

        if (enemy.hp <= 0) {
          p.score += (enemy.type === "oni_boss" ? 3000 : enemy.type === "mech" ? 500 : 150) * p.combo;
          p.credits += enemy.type === "oni_boss" ? 100 : 20;
          p.combo = Math.min(10, p.combo + 1);
          p.energy = Math.min(p.maxEnergy, p.energy + 15);

          // Drop item
          if (Math.random() > 0.6) {
            const types: ("health" | "energy" | "shield" | "credit")[] = ["health", "energy", "shield", "credit"];
            dropsRef.current.push({
              id: "drop-" + Date.now(),
              type: types[Math.floor(Math.random() * types.length)],
              x: enemy.x,
              y: enemy.y,
              vy: -2
            });
          }
        }
      }
    });
  };

  // Cyber Dash Action
  const triggerDash = () => {
    const p = playerRef.current;
    if (Date.now() < p.dashCooldown || p.energy < 20) return;

    p.energy -= 20;
    p.dashCooldown = Date.now() + 600;
    p.isDashing = true;
    p.invulnerableUntil = Date.now() + 350;
    playSound("dash");

    const dashSpeed = 16 + (upgrades.dashDistance || 0) * 3;
    p.vx = p.facingRight ? dashSpeed : -dashSpeed;

    // Dash Ghost Trail Particles
    for (let i = 0; i < 5; i++) {
      particlesRef.current.push({
        x: p.x - (i * p.vx * 2),
        y: p.y,
        vx: 0,
        vy: 0,
        life: 0,
        maxLife: 20,
        color: p.skin === "solar_gold" ? "#eab308" : p.skin === "crimson_demon" ? "#ef4444" : "#00f0ff",
        size: 24,
        type: "ghost"
      });
    }

    setTimeout(() => {
      p.isDashing = false;
    }, 250);
  };

  // Plasma Shuriken Action
  const triggerShuriken = () => {
    const p = playerRef.current;
    if (p.energy < 25) return;

    p.energy -= 25;
    playSound("shuriken");

    const count = 1 + (upgrades.shurikenCount || 0);
    for (let i = 0; i < count; i++) {
      const spreadVy = (i - (count - 1) / 2) * 2;
      projectilesRef.current.push({
        id: "shuriken-" + Date.now() + i,
        x: p.x + (p.facingRight ? 20 : -20),
        y: p.y + spreadVy * 4,
        vx: p.facingRight ? 14 : -14,
        vy: spreadVy,
        radius: 6,
        color: "#c084fc",
        isEnemy: false,
        damage: 25
      });
    }
  };

  // Deflection Shield Trigger
  const triggerDeflection = () => {
    const p = playerRef.current;
    if (p.energy < 15) return;

    p.energy -= 15;
    p.isDeflecting = true;
    playSound("deflect");

    setTimeout(() => {
      p.isDeflecting = false;
    }, 400);
  };

  // Spawn Wave Enemy Logic
  const spawnWaveEnemies = (waveNum: number, mode: string) => {
    const enemies: EnemyNinja[] = [];
    const count = 4 + waveNum * 2;

    if (waveNum % 4 === 0 || mode === "bossrush") {
      // Spawn Oni Boss
      playSound("boss");
      setWaveTitle("WARNING: SHADOW ONI DEMON BOSS APPROACHING");
      setShowWaveBanner(true);
      setTimeout(() => setShowWaveBanner(false), 3500);

      enemies.push({
        id: "boss-" + Date.now(),
        type: "oni_boss",
        x: 700,
        y: 400,
        vx: -1.5,
        vy: 0,
        width: 80,
        height: 100,
        hp: 600 + waveNum * 300,
        maxHp: 600 + waveNum * 300,
        attackCooldown: 0,
        facingRight: false,
        color: "#ef4444",
        state: "chase"
      });
    } else {
      for (let i = 0; i < count; i++) {
        const isNinja = Math.random() > 0.5;
        const isMech = !isNinja && Math.random() > 0.7;
        const type = isMech ? "mech" : isNinja ? "ninja" : "drone";

        enemies.push({
          id: `enemy-${i}-${Date.now()}`,
          type,
          x: 400 + Math.random() * 450,
          y: type === "drone" ? 180 + Math.random() * 150 : 490,
          vx: (Math.random() - 0.5) * (type === "ninja" ? 3 : 1.5),
          vy: 0,
          width: type === "mech" ? 50 : type === "ninja" ? 32 : 28,
          height: type === "mech" ? 65 : type === "ninja" ? 48 : 28,
          hp: type === "mech" ? 120 : type === "ninja" ? 45 : 25,
          maxHp: type === "mech" ? 120 : type === "ninja" ? 45 : 25,
          attackCooldown: Math.random() * 60,
          facingRight: false,
          color: type === "mech" ? "#a855f7" : type === "ninja" ? "#06b6d4" : "#f43f5e",
          state: "chase"
        });
      }
    }

    enemiesRef.current = enemies;
  };

  // Helper particle generator
  const createExplosion = (x: number, y: number, color: string, count: number = 12) => {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 5 + 1;
      particlesRef.current.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 0,
        maxLife: 15 + Math.random() * 15,
        color,
        size: Math.random() * 3 + 1,
        type: "spark"
      });
    }
  };

  // Main 60 FPS Render Loop
  useEffect(() => {
    let animId: number;

    const render = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      if (canvas.width !== 850 || canvas.height !== 600) {
        canvas.width = 850;
        canvas.height = 600;
      }

      // Background Cyberpunk Atmosphere
      ctx.fillStyle = "#030712";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Neon City Grid Lines
      ctx.strokeStyle = "rgba(15, 23, 42, 0.8)";
      ctx.lineWidth = 1;
      for (let x = 0; x < canvas.width; x += 40) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
      }

      // Render Platforms
      platformsRef.current.forEach(plat => {
        ctx.fillStyle = plat.color;
        ctx.fillRect(plat.x, plat.y, plat.w, plat.h);

        // Glowing Neon Edge
        ctx.shadowBlur = 10;
        ctx.shadowColor = "#00f0ff";
        ctx.fillStyle = "#00f0ff";
        ctx.fillRect(plat.x, plat.y, plat.w, 3);
        ctx.shadowBlur = 0;
      });

      if (gameState === "playing") {
        const p = playerRef.current;
        const keys = keysRef.current;

        // Player Movement & Gravity
        const speed = 5.5;
        if (keys["KeyA"] || keys["ArrowLeft"]) {
          p.vx = -speed;
          p.facingRight = false;
        } else if (keys["KeyD"] || keys["ArrowRight"]) {
          p.vx = speed;
          p.facingRight = true;
        } else if (!p.isDashing) {
          p.vx *= 0.7; // friction
        }

        // Apply Gravity
        p.vy += 0.65; // gravity
        p.x += p.vx;
        p.y += p.vy;

        // Energy Regeneration
        const energyRegenRate = 0.2 + (upgrades.energyRegen || 0) * 0.1;
        p.energy = Math.min(p.maxEnergy, p.energy + energyRegenRate);

        // Platform Collisions
        p.isGrounded = false;
        platformsRef.current.forEach(plat => {
          if (
            p.x + p.width / 2 > plat.x &&
            p.x - p.width / 2 < plat.x + plat.w &&
            p.y + p.height / 2 >= plat.y &&
            p.y + p.height / 2 <= plat.y + plat.h + 10 &&
            p.vy >= 0
          ) {
            p.y = plat.y - p.height / 2;
            p.vy = 0;
            p.isGrounded = true;
          }
        });

        // Bounds Checking
        p.x = Math.max(20, Math.min(canvas.width - 20, p.x));

        // Update Projectiles
        projectilesRef.current.forEach(proj => {
          proj.x += proj.vx;
          proj.y += proj.vy;

          // Check Player Deflection Shield Collision
          if (proj.isEnemy && !proj.isReflected && p.isDeflecting) {
            const dist = Math.hypot(p.x - proj.x, p.y - proj.y);
            if (dist < 40) {
              proj.isEnemy = false;
              proj.isReflected = true;
              proj.vx *= -2;
              proj.vy *= -1;
              proj.color = "#00f0ff";
              proj.damage *= 2;
              playSound("deflect");
              createExplosion(proj.x, proj.y, "#00f0ff", 10);
            }
          }

          // Check Projectile hit on Enemies
          if (!proj.isEnemy) {
            enemiesRef.current.forEach(e => {
              const dist = Math.hypot(e.x - proj.x, e.y - proj.y);
              if (dist < e.width / 2 + proj.radius) {
                e.hp -= proj.damage;
                proj.x = 9999; // destroy projectile
                createExplosion(e.x, e.y, proj.color, 8);

                if (e.hp <= 0) {
                  p.score += 200 * p.combo;
                  p.credits += 15;
                  p.combo = Math.min(10, p.combo + 1);
                }
              }
            });
          }

          // Check Enemy Projectile hit on Player
          if (proj.isEnemy) {
            const dist = Math.hypot(p.x - proj.x, p.y - proj.y);
            if (dist < p.width / 2 + proj.radius && Date.now() > p.invulnerableUntil) {
              proj.x = 9999;
              takePlayerDamage(proj.damage);
            }
          }
        });

        projectilesRef.current = projectilesRef.current.filter(
          pr => pr.x > 0 && pr.x < canvas.width && pr.y > 0 && pr.y < canvas.height
        );

        // Update Enemies AI
        enemiesRef.current.forEach(enemy => {
          const dx = p.x - enemy.x;
          enemy.facingRight = dx > 0;

          if (enemy.type === "oni_boss") {
            // Oni Boss Movement & Attack
            if (Math.abs(dx) > 100) enemy.x += dx > 0 ? 1.8 : -1.8;

            enemy.attackCooldown++;
            if (enemy.attackCooldown > 80) {
              enemy.attackCooldown = 0;
              // Fire ring of shadow projectiles
              for (let a = -2; a <= 2; a++) {
                projectilesRef.current.push({
                  id: "boss-p-" + Date.now() + a,
                  x: enemy.x,
                  y: enemy.y,
                  vx: (dx > 0 ? 6 : -6) + a * 1.5,
                  vy: a * 2,
                  radius: 7,
                  color: "#ef4444",
                  isEnemy: true,
                  damage: 20
                });
              }
            }
          } else if (enemy.type === "drone") {
            enemy.x += (Math.sin(Date.now() * 0.003) * 2);
            enemy.attackCooldown++;
            if (enemy.attackCooldown > 110) {
              enemy.attackCooldown = 0;
              projectilesRef.current.push({
                id: "dp-" + Date.now(),
                x: enemy.x,
                y: enemy.y,
                vx: dx > 0 ? 5 : -5,
                vy: 2,
                radius: 4,
                color: "#f43f5e",
                isEnemy: true,
                damage: 12
              });
            }
          } else {
            // Ninja & Mech melee chase
            if (Math.abs(dx) > 40) enemy.x += dx > 0 ? 2 : -2;

            if (Math.abs(dx) < 45 && Math.abs(p.y - enemy.y) < 40 && Date.now() > p.invulnerableUntil) {
              takePlayerDamage(enemy.type === "mech" ? 25 : 15);
              p.invulnerableUntil = Date.now() + 600;
            }
          }
        });

        enemiesRef.current = enemiesRef.current.filter(e => e.hp > 0);

        // Update Item Drops & Collection
        dropsRef.current.forEach(drop => {
          drop.y += 1;
          // Platform floor check
          if (drop.y > 525) drop.y = 525;

          const dist = Math.hypot(p.x - drop.x, p.y - drop.y);
          if (dist < 35) {
            playSound("powerup");
            if (drop.type === "health") p.hp = Math.min(p.maxHp, p.hp + 30);
            if (drop.type === "energy") p.energy = Math.min(p.maxEnergy, p.energy + 50);
            if (drop.type === "shield") p.shield = Math.min(p.maxShield, p.shield + 40);
            if (drop.type === "credit") p.credits += 25;
            drop.y = 9999;
          }
        });

        dropsRef.current = dropsRef.current.filter(d => d.y < 600);

        // Wave Completion Check
        if (enemiesRef.current.length === 0) {
          const nextW = wave + 1;
          setWave(nextW);
          spawnWaveEnemies(nextW, gameMode);
          setWaveTitle(`WAVE ${nextW}: CYBER SECTOR CLEARED`);
          setShowWaveBanner(true);
          setTimeout(() => setShowWaveBanner(false), 3000);
        }

        // Sync React HUD state
        setHudStats({
          hp: p.hp,
          maxHp: p.maxHp,
          energy: p.energy,
          maxEnergy: p.maxEnergy,
          shield: p.shield,
          maxShield: p.maxShield,
          score: p.score,
          credits: p.credits,
          combo: p.combo,
          skin: p.skin
        });
      }

      // ==========================================
      // RENDERING CANVAS DRAWING
      // ==========================================

      // Render Item Drops
      dropsRef.current.forEach(drop => {
        ctx.save();
        ctx.translate(drop.x, drop.y);
        ctx.shadowBlur = 10;
        ctx.shadowColor =
          drop.type === "health"
            ? "#22c55e"
            : drop.type === "energy"
            ? "#3b82f6"
            : drop.type === "shield"
            ? "#a855f7"
            : "#eab308";

        ctx.fillStyle = ctx.shadowColor;
        ctx.beginPath();
        ctx.arc(0, 0, 8, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });

      // Render Particles
      particlesRef.current.forEach(part => {
        part.x += part.vx;
        part.y += part.vy;
        part.life++;

        ctx.save();
        ctx.globalAlpha = Math.max(0, 1 - part.life / part.maxLife);
        ctx.fillStyle = part.color;
        ctx.beginPath();
        ctx.arc(part.x, part.y, part.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });

      particlesRef.current = particlesRef.current.filter(p => p.life < p.maxLife);

      // Render Projectiles
      projectilesRef.current.forEach(proj => {
        ctx.save();
        ctx.shadowBlur = 10;
        ctx.shadowColor = proj.color;
        ctx.fillStyle = proj.color;
        ctx.beginPath();
        ctx.arc(proj.x, proj.y, proj.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });

      // Render Enemies
      enemiesRef.current.forEach(enemy => {
        ctx.save();
        ctx.translate(enemy.x, enemy.y);
        ctx.shadowBlur = 12;
        ctx.shadowColor = enemy.color;

        if (enemy.type === "oni_boss") {
          // Boss Oni Silhouette
          ctx.fillStyle = "#111827";
          ctx.strokeStyle = enemy.color;
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.moveTo(0, -enemy.height / 2);
          ctx.lineTo(enemy.width / 2, enemy.height / 2);
          ctx.lineTo(-enemy.width / 2, enemy.height / 2);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();

          // Boss Health Bar
          ctx.fillStyle = "rgba(0,0,0,0.6)";
          ctx.fillRect(-40, -enemy.height / 2 - 15, 80, 6);
          ctx.fillStyle = "#ef4444";
          ctx.fillRect(-40, -enemy.height / 2 - 15, (enemy.hp / enemy.maxHp) * 80, 6);
        } else if (enemy.type === "drone") {
          ctx.fillStyle = enemy.color;
          ctx.beginPath();
          ctx.arc(0, 0, 14, 0, Math.PI * 2);
          ctx.fill();
        } else {
          // Ninja & Mech Body
          ctx.fillStyle = enemy.color;
          ctx.fillRect(-enemy.width / 2, -enemy.height / 2, enemy.width, enemy.height);
        }

        ctx.restore();
      });

      // Render Player Cyber Shinobi
      if (gameState === "playing" || gameState === "paused") {
        const p = playerRef.current;
        ctx.save();
        ctx.translate(p.x, p.y);

        const skinColor =
          p.skin === "solar_gold"
            ? "#eab308"
            : p.skin === "crimson_demon"
            ? "#ef4444"
            : p.skin === "void_shadow"
            ? "#c084fc"
            : "#00f0ff";

        ctx.shadowBlur = 15;
        ctx.shadowColor = skinColor;

        // Shinobi Silhouette Body
        ctx.fillStyle = "#090d16";
        ctx.strokeStyle = skinColor;
        ctx.lineWidth = 2;
        ctx.fillRect(-p.width / 2, -p.height / 2, p.width, p.height);
        ctx.strokeRect(-p.width / 2, -p.height / 2, p.width, p.height);

        // Glowing Visor Line
        ctx.fillStyle = skinColor;
        const visorX = p.facingRight ? 2 : -10;
        ctx.fillRect(visorX, -14, 10, 4);

        // Katana Slash Arc Render
        if (p.isSlashing) {
          ctx.strokeStyle = skinColor;
          ctx.lineWidth = 4;
          ctx.beginPath();
          const arcStart = p.facingRight ? -Math.PI / 3 : (2 * Math.PI) / 3;
          const arcEnd = p.facingRight ? Math.PI / 3 : (4 * Math.PI) / 3;
          ctx.arc(0, 0, 45, arcStart, arcEnd);
          ctx.stroke();
        }

        // Deflection Shield Bubble
        if (p.isDeflecting) {
          ctx.strokeStyle = "rgba(0, 240, 255, 0.8)";
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.arc(0, 0, 36, 0, Math.PI * 2);
          ctx.stroke();
        }

        ctx.restore();
      }

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, [gameState, wave, gameMode, selectedSkin, upgrades, playSound]);

  // Damage Player Helper
  const takePlayerDamage = (amt: number) => {
    const p = playerRef.current;
    p.combo = 1;

    if (p.shield > 0) {
      if (p.shield >= amt) {
        p.shield -= amt;
        return;
      } else {
        const rem = amt - p.shield;
        p.shield = 0;
        p.hp -= rem;
      }
    } else {
      p.hp -= amt;
    }

    playSound("explosion");

    if (p.hp <= 0) {
      p.hp = 0;
      setGameState("gameover");

      if (p.score > highScore) {
        setHighScore(p.score);
        localStorage.setItem("sb_highscore", p.score.toString());
      }
      const newCreds = totalCredits + p.credits;
      setTotalCredits(newCreds);
      localStorage.setItem("sb_credits", newCreds.toString());

      confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
    }
  };

  // Buy Armory Upgrade
  const buyUpgrade = (key: string, baseCost: number) => {
    const currentLvl = upgrades[key] || 0;
    const cost = baseCost * (currentLvl + 1);

    if (totalCredits >= cost && currentLvl < 5) {
      const nextCreds = totalCredits - cost;
      const nextUpgrades = { ...upgrades, [key]: currentLvl + 1 };

      setTotalCredits(nextCreds);
      setUpgrades(nextUpgrades);

      localStorage.setItem("sb_credits", nextCreds.toString());
      localStorage.setItem("sb_upgrades", JSON.stringify(nextUpgrades));
      playSound("powerup");
    }
  };

  return (
    <div className="relative w-full h-screen bg-black text-white font-sans overflow-hidden select-none flex items-center justify-center">
      <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:24px_24px] opacity-40 pointer-events-none" />

      {/* Main Canvas Viewport */}
      <div className="relative border border-slate-800 rounded-xl shadow-2xl shadow-cyan-500/10 overflow-hidden bg-slate-950">
        <canvas ref={canvasRef} className="block w-[850px] h-[600px]" />

        {/* TOP HUD OVERLAY */}
        {gameState === "playing" && (
          <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-start pointer-events-none bg-gradient-to-b from-slate-950/80 to-transparent">
            {/* Health & Energy Gauges */}
            <div className="flex flex-col gap-2 w-56">
              <div className="flex items-center gap-2">
                <Flame className="w-4 h-4 text-rose-500" />
                <div className="flex-1 h-3 bg-slate-900 border border-rose-500/30 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-rose-600 to-red-400 transition-all duration-200"
                    style={{ width: `${(hudStats.hp / hudStats.maxHp) * 100}%` }}
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-cyan-400" />
                <div className="flex-1 h-3 bg-slate-900 border border-cyan-500/30 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-cyan-600 to-blue-400 transition-all duration-200"
                    style={{ width: `${(hudStats.energy / hudStats.maxEnergy) * 100}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Score Banner */}
            <div className="text-center">
              <div className="text-xs uppercase tracking-widest text-slate-400">Score</div>
              <div className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-500 font-mono">
                {hudStats.score.toLocaleString()}
              </div>
              {hudStats.combo > 1 && (
                <div className="text-xs font-bold text-amber-400 animate-pulse">
                  {hudStats.combo}x SHINOBI STREAK!
                </div>
              )}
            </div>

            {/* Sound & Pause Controls */}
            <div className="flex gap-2 pointer-events-auto">
              <button
                onClick={() => setSoundEnabled(!soundEnabled)}
                className="p-2 rounded-lg bg-slate-900/80 border border-slate-700 text-slate-300"
              >
                {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4 text-rose-400" />}
              </button>
              <button
                onClick={() => setGameState("paused")}
                className="p-2 rounded-lg bg-slate-900/80 border border-slate-700 text-slate-300"
              >
                <Pause className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* BOTTOM ACTION BAR */}
        {gameState === "playing" && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-3 p-2 rounded-xl bg-slate-900/90 border border-slate-800 backdrop-blur-md">
            <div className="px-3 py-1 bg-slate-950/60 rounded text-xs font-bold text-slate-300 flex items-center gap-1">
              <span className="text-cyan-400 font-mono">J / Space:</span> SLASH
            </div>
            <div className="px-3 py-1 bg-slate-950/60 rounded text-xs font-bold text-slate-300 flex items-center gap-1">
              <span className="text-cyan-400 font-mono">K:</span> DASH
            </div>
            <div className="px-3 py-1 bg-slate-950/60 rounded text-xs font-bold text-slate-300 flex items-center gap-1">
              <span className="text-cyan-400 font-mono">L:</span> SHURIKEN
            </div>
            <div className="px-3 py-1 bg-slate-950/60 rounded text-xs font-bold text-slate-300 flex items-center gap-1">
              <span className="text-cyan-400 font-mono">Shift:</span> DEFLECT
            </div>
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
              <div className="px-8 py-4 rounded-2xl bg-cyan-950/90 border border-cyan-500/50 backdrop-blur-md text-center shadow-2xl shadow-cyan-500/30">
                <div className="text-cyan-400 font-mono text-xs tracking-widest font-bold">TACTICAL ALERT</div>
                <div className="text-2xl font-black text-white tracking-wider mt-1">{waveTitle}</div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* MAIN MENU */}
        {gameState === "menu" && (
          <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-md flex flex-col items-center justify-center p-8 text-center">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-cyan-500 to-purple-600 flex items-center justify-center shadow-xl shadow-cyan-500/30 mb-6">
              <Sword className="w-8 h-8 text-white" />
            </div>

            <h1 className="text-4xl font-black tracking-tight text-white mb-2">
              SHADOW <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-500">BLADE 2D</span>
            </h1>
            <p className="text-slate-400 max-w-md text-sm mb-8">
              High-octane 2D cyberpunk shinobi action. Slice rogue ninjas, deflect plasma bolts, execute cyber dashes, and battle Shadow Oni bosses.
            </p>

            <div className="flex flex-col gap-3 w-64 mb-8">
              <button
                onClick={() => startNewGame("endless")}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-purple-600 text-slate-950 font-bold text-sm tracking-wide shadow-lg shadow-cyan-500/20 hover:opacity-95 transition-all flex items-center justify-center gap-2"
              >
                <Play className="w-4 h-4 fill-current" /> LAUNCH ENDLESS WAVE
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
                  <Sliders className="w-4 h-4 text-purple-400" /> SKINS
                </button>
              </div>
            </div>

            <div className="flex items-center gap-6 text-xs text-slate-400 font-mono">
              <div>BEST SCORE: <span className="text-cyan-400 font-bold">{highScore.toLocaleString()}</span></div>
              <div>CREDITS: <span className="text-amber-400 font-bold">{totalCredits.toLocaleString()}</span></div>
            </div>
          </div>
        )}

        {/* PAUSE MENU */}
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

        {/* GAME OVER */}
        {gameState === "gameover" && (
          <div className="absolute inset-0 bg-slate-950/95 backdrop-blur-md flex flex-col items-center justify-center p-8 text-center">
            <div className="w-16 h-16 rounded-full bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-500 mb-4">
              <Flame className="w-8 h-8" />
            </div>

            <h2 className="text-3xl font-black text-white mb-1">SHINOBI FALLEN</h2>
            <p className="text-slate-400 text-xs mb-6">Cyber sector lost at Wave {wave}</p>

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
                className="flex-1 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-purple-600 text-slate-950 font-bold text-sm flex items-center justify-center gap-1.5"
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
                  <ShoppingBag className="w-5 h-5 text-amber-400" /> SHINOBI ARMORY
                </h2>
                <p className="text-xs text-slate-400">Upgrade katana sharpness, energy, and dash perks</p>
              </div>
              <div className="px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400 font-mono font-bold text-sm">
                💰 {totalCredits.toLocaleString()}
              </div>
            </div>

            <div className="flex-1 space-y-3 overflow-y-auto pr-2">
              {[
                { id: "katanaDamage", name: "Plasma Edge", desc: "+12 Katana Slash damage per tier", base: 120 },
                { id: "maxHealth", name: "Cyber Armor", desc: "+20 Max Health capacity", base: 100 },
                { id: "energyRegen", name: "Energy Core", desc: "Faster energy regeneration rate", base: 150 },
                { id: "dashDistance", name: "Cyber Thrusters", desc: "+15% Dash distance & speed", base: 140 },
                { id: "shurikenCount", name: "Shuriken Pouch", desc: "+1 Extra plasma shuriken per throw", base: 200 }
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

        {/* HANGAR SKINS */}
        {gameState === "hangar" && (
          <div className="absolute inset-0 bg-slate-950 p-6 flex flex-col">
            <div className="mb-6">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Sliders className="w-5 h-5 text-purple-400" /> SHINOBI SKINS
              </h2>
              <p className="text-xs text-slate-400">Select custom cyber plasma suit</p>
            </div>

            <div className="grid grid-cols-2 gap-4 flex-1">
              {[
                { id: "neon_cyan", name: "Neon Cyan", color: "#00f0ff", desc: "Standard high-frequency plasma suit" },
                { id: "solar_gold", name: "Solar Gold", color: "#eab308", desc: "Overcharged golden energy chassis" },
                { id: "crimson_demon", name: "Crimson Demon", color: "#ef4444", desc: "Rage demon cyber suit" },
                { id: "void_shadow", name: "Void Shadow", color: "#c084fc", desc: "Stealth void wave suit" }
              ].map(skin => (
                <button
                  key={skin.id}
                  onClick={() => {
                    setSelectedSkin(skin.id);
                    localStorage.setItem("sb_skin", skin.id);
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
