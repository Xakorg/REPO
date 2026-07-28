"use client";

import React, { useEffect, useRef, useState } from "react";
import { 
  Play, Pause, RotateCcw, Shield, Zap, Crosshair, Trophy, 
  ShoppingBag, Sparkles, Volume2, VolumeX, ArrowLeft, Radio, Rocket
} from "lucide-react";

// Types & Interfaces
type GameState = "menu" | "class_select" | "playing" | "paused" | "gameover" | "shop";
type ShipClass = "vanguard" | "phantom" | "dreadnought";

interface Player {
  x: number;
  y: number;
  vx: number;
  vy: number;
  rotation: number;
  radius: number;
  health: number;
  maxHealth: number;
  shield: number;
  maxShield: number;
  shieldRechargeDelay: number;
  energy: number;
  maxEnergy: number;
  speed: number;
  fireRate: number;
  lastFired: number;
  damage: number;
  score: number;
  credits: number;
  level: number;
  xp: number;
  xpToNext: number;
  shipClass: ShipClass;
  weaponType: "plasma" | "spread" | "missile" | "railgun";
  dronesCount: number;
  dashCooldown: number;
  isDashing: boolean;
  dashTime: number;
  invulnerableTime: number;
}

interface Enemy {
  id: string;
  type: "scout" | "interceptor" | "destroyer" | "boss" | "swarm";
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  health: number;
  maxHealth: number;
  speed: number;
  scoreValue: number;
  creditsValue: number;
  color: string;
  shootTimer: number;
  shootInterval: number;
  angle: number;
  bossPhase?: number;
}

interface Bullet {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  isEnemy: boolean;
  damage: number;
  color: string;
  lifetime: number;
  pierce?: number;
  isHoming?: boolean;
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
  shape: "circle" | "spark" | "ring";
}

interface PowerUp {
  id: string;
  type: "health" | "shield" | "nuke" | "triple" | "speed";
  x: number;
  y: number;
  radius: number;
  duration: number;
}

interface Drone {
  angle: number;
  distance: number;
  lastFired: number;
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
  description: string;
  cost: number;
  level: number;
  maxLevel: number;
  icon: string;
}

// Web Audio API Synth Generator
class AudioSynth {
  private ctx: AudioContext | null = null;
  public enabled: boolean = true;

  constructor() {
    // AudioContext created lazily on user gesture
  }

  private init() {
    if (!this.ctx && typeof window !== "undefined") {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === "suspended") {
      this.ctx.resume();
    }
  }

  playLaser(pitch = 800) {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(pitch, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(100, this.ctx.currentTime + 0.12);
      gain.gain.setValueAtTime(0.15, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.12);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.12);
    } catch {}
  }

  playExplosion(big = false) {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;
    try {
      const dur = big ? 0.4 : 0.2;
      const bufferSize = this.ctx.sampleRate * dur;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }
      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.setValueAtTime(big ? 300 : 600, this.ctx.currentTime);
      filter.frequency.exponentialRampToValueAtTime(40, this.ctx.currentTime + dur);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(big ? 0.4 : 0.2, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + dur);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);
      noise.start();
    } catch {}
  }

  playPowerup() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;
    try {
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
    } catch {}
  }

  playHit() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(150, this.ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(40, this.ctx.currentTime + 0.08);
      gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.01, this.ctx.currentTime + 0.08);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.08);
    } catch {}
  }
}

const audioSynth = new AudioSynth();

export default function QuantumHelixGame() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // State
  const [gameState, setGameState] = useState<GameState>("menu");
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [score, setScore] = useState<number>(0);
  const [highScore, setHighScore] = useState<number>(0);
  const [wave, setWave] = useState<number>(1);
  const [credits, setCredits] = useState<number>(0);
  const [waveText, setWaveText] = useState<string>("");
  const [selectedClass, setSelectedClass] = useState<ShipClass>("vanguard");

  // Upgrades
  const [upgrades, setUpgrades] = useState<UpgradeItem[]>([
    { id: "max_health", name: "Hull Armor", description: "+25 Max Hull Health", cost: 100, level: 0, maxLevel: 5, icon: "shield" },
    { id: "max_shield", name: "Quantum Shield", description: "+20 Max Shield Energy", cost: 120, level: 0, maxLevel: 5, icon: "zap" },
    { id: "damage", name: "Plasma Charge", description: "+15% Weapon Damage", cost: 150, level: 0, maxLevel: 5, icon: "crosshair" },
    { id: "fire_rate", name: "Overclock Cannon", description: "+15% Firing Speed", cost: 180, level: 0, maxLevel: 5, icon: "sparkles" },
    { id: "drones", name: "Support Drone", description: "Deploy automated defense drone", cost: 300, level: 0, maxLevel: 3, icon: "rocket" },
  ]);

  // Refs for game loop logic
  const keysRef = useRef<{ [key: string]: boolean }>({});
  const mouseRef = useRef<{ x: number; y: number; isDown: boolean }>({ x: 0, y: 0, isDown: false });

  const playerRef = useRef<Player>({
    x: 600,
    y: 400,
    vx: 0,
    vy: 0,
    rotation: 0,
    radius: 18,
    health: 100,
    maxHealth: 100,
    shield: 50,
    maxShield: 50,
    shieldRechargeDelay: 0,
    energy: 100,
    maxEnergy: 100,
    speed: 5,
    fireRate: 150, // ms
    lastFired: 0,
    damage: 25,
    score: 0,
    credits: 0,
    level: 1,
    xp: 0,
    xpToNext: 100,
    shipClass: "vanguard",
    weaponType: "plasma",
    dronesCount: 0,
    dashCooldown: 0,
    isDashing: false,
    dashTime: 0,
    invulnerableTime: 0,
  });

  const enemiesRef = useRef<Enemy[]>([]);
  const bulletsRef = useRef<Bullet[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const powerUpsRef = useRef<PowerUp[]>([]);
  const floatingTextsRef = useRef<FloatingText[]>([]);
  const dronesRef = useRef<Drone[]>([]);
  const screenShakeRef = useRef<number>(0);
  const waveInProgressRef = useRef<boolean>(false);
  const waveTimerRef = useRef<number>(0);

  // Load high score from local storage
  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("quantum_helix_highscore");
      if (saved) setHighScore(parseInt(saved, 10) || 0);
    }
  }, []);

  // Keyboard and mouse event listeners
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      keysRef.current[e.key.toLowerCase()] = true;
      if (e.key === "p" || e.key === "P" || e.key === "Escape") {
        setGameState((prev) => (prev === "playing" ? "paused" : prev === "paused" ? "playing" : prev));
      }
      if (e.key === " " && gameState === "playing") {
        performDash();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      keysRef.current[e.key.toLowerCase()] = false;
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!canvasRef.current) return;
      const rect = canvasRef.current.getBoundingClientRect();
      mouseRef.current.x = e.clientX - rect.left;
      mouseRef.current.y = e.clientY - rect.top;
    };

    const handleMouseDown = (e: MouseEvent) => {
      if (e.button === 0) mouseRef.current.isDown = true;
    };

    const handleMouseUp = (e: MouseEvent) => {
      if (e.button === 0) mouseRef.current.isDown = false;
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
  }, [gameState]);

  // Dash mechanic
  const performDash = () => {
    const p = playerRef.current;
    if (p.dashCooldown > 0 || p.energy < 25) return;
    p.energy -= 25;
    p.dashCooldown = 180; // frames ~ 3s
    p.isDashing = true;
    p.dashTime = 12; // frames ~ 0.2s
    p.invulnerableTime = 20;

    // Dash particles
    for (let i = 0; i < 20; i++) {
      particlesRef.current.push({
        x: p.x,
        y: p.y,
        vx: (Math.random() - 0.5) * 8,
        vy: (Math.random() - 0.5) * 8,
        radius: Math.random() * 4 + 2,
        color: "#00f0ff",
        alpha: 1,
        decay: 0.05,
        shape: "spark",
      });
    }
  };

  // Start new game
  const startGame = (shipClass: ShipClass) => {
    setSelectedClass(shipClass);
    let baseHealth = 100;
    let baseShield = 50;
    let baseSpeed = 5.5;
    let baseDamage = 25;
    let baseFireRate = 150;
    let weapon: "plasma" | "spread" | "missile" | "railgun" = "plasma";

    if (shipClass === "phantom") {
      baseHealth = 75;
      baseShield = 40;
      baseSpeed = 7.0;
      baseDamage = 20;
      baseFireRate = 110;
      weapon = "spread";
    } else if (shipClass === "dreadnought") {
      baseHealth = 150;
      baseShield = 80;
      baseSpeed = 4.2;
      baseDamage = 35;
      baseFireRate = 220;
      weapon = "missile";
    }

    playerRef.current = {
      x: 600,
      y: 400,
      vx: 0,
      vy: 0,
      rotation: 0,
      radius: 18,
      health: baseHealth,
      maxHealth: baseHealth,
      shield: baseShield,
      maxShield: baseShield,
      shieldRechargeDelay: 0,
      energy: 100,
      maxEnergy: 100,
      speed: baseSpeed,
      fireRate: baseFireRate,
      lastFired: 0,
      damage: baseDamage,
      score: 0,
      credits: 0,
      level: 1,
      xp: 0,
      xpToNext: 100,
      shipClass,
      weaponType: weapon,
      dronesCount: 0,
      dashCooldown: 0,
      isDashing: false,
      dashTime: 0,
      invulnerableTime: 0,
    };

    enemiesRef.current = [];
    bulletsRef.current = [];
    particlesRef.current = [];
    powerUpsRef.current = [];
    floatingTextsRef.current = [];
    dronesRef.current = [];

    setScore(0);
    setCredits(0);
    setWave(1);
    setGameState("playing");
    startWave(1);
  };

  // Wave Spawner
  const startWave = (currentWave: number) => {
    waveInProgressRef.current = true;
    setWaveText(`WAVE ${currentWave}: HOSTILE INBOUND`);
    setTimeout(() => setWaveText(""), 2500);

    const isBossWave = currentWave % 5 === 0;
    const enemyCount = isBossWave ? 1 : 4 + currentWave * 3;

    if (isBossWave) {
      // Spawn Boss
      enemiesRef.current.push({
        id: "boss_" + Math.random(),
        type: "boss",
        x: 600,
        y: -100,
        vx: 0,
        vy: 1.5,
        radius: 45,
        health: 500 + currentWave * 250,
        maxHealth: 500 + currentWave * 250,
        speed: 1.5,
        scoreValue: 2000,
        creditsValue: 300,
        color: "#ff0055",
        shootTimer: 0,
        shootInterval: 40,
        angle: 0,
        bossPhase: 1,
      });
    } else {
      // Regular enemies
      for (let i = 0; i < enemyCount; i++) {
        setTimeout(() => {
          if (gameState !== "playing" && gameState !== "paused") return;
          const types: ("scout" | "interceptor" | "destroyer" | "swarm")[] = ["scout", "interceptor", "swarm"];
          if (currentWave >= 3) types.push("destroyer");

          const type = types[Math.floor(Math.random() * types.length)];
          let health = 30;
          let speed = 3;
          let radius = 14;
          let color = "#ff0055";
          let scoreVal = 50;
          let credVal = 10;

          if (type === "interceptor") {
            health = 50;
            speed = 4;
            color = "#ff5500";
            scoreVal = 80;
            credVal = 15;
          } else if (type === "destroyer") {
            health = 120;
            speed = 1.8;
            radius = 24;
            color = "#aa00ff";
            scoreVal = 180;
            credVal = 35;
          } else if (type === "swarm") {
            health = 15;
            speed = 5;
            radius = 10;
            color = "#ffff00";
            scoreVal = 30;
            credVal = 5;
          }

          // Spawn around edges
          const angle = Math.random() * Math.PI * 2;
          const dist = 700;
          const x = 600 + Math.cos(angle) * dist;
          const y = 400 + Math.sin(angle) * dist;

          enemiesRef.current.push({
            id: Math.random().toString(),
            type,
            x,
            y,
            vx: 0,
            vy: 0,
            radius,
            health: health + currentWave * 8,
            maxHealth: health + currentWave * 8,
            speed,
            scoreValue: scoreVal,
            creditsValue: credVal,
            color,
            shootTimer: Math.random() * 60,
            shootInterval: type === "destroyer" ? 60 : type === "interceptor" ? 90 : 120,
            angle: 0,
          });
        }, i * 350);
      }
    }
  };

  // Main Game Loop (Canvas updates & rendering)
  useEffect(() => {
    let animId: number;

    const render = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      // Handle screen shake
      ctx.save();
      if (screenShakeRef.current > 0) {
        const shakeX = (Math.random() - 0.5) * screenShakeRef.current;
        const shakeY = (Math.random() - 0.5) * screenShakeRef.current;
        ctx.translate(shakeX, shakeY);
        screenShakeRef.current *= 0.9;
        if (screenShakeRef.current < 0.5) screenShakeRef.current = 0;
      }

      // Background rendering
      ctx.fillStyle = "#080914";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Grid background effect
      ctx.strokeStyle = "rgba(0, 240, 255, 0.05)";
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

      if (gameState === "playing") {
        updateGameLogic(canvas);
      }

      // Render Particles
      particlesRef.current.forEach((p) => {
        ctx.save();
        ctx.globalAlpha = p.alpha;
        ctx.fillStyle = p.color;
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 8;
        if (p.shape === "circle") {
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
          ctx.fill();
        } else if (p.shape === "spark") {
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
          ctx.fill();
        } else if (p.shape === "ring") {
          ctx.strokeStyle = p.color;
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
          ctx.stroke();
        }
        ctx.restore();
      });

      // Render Powerups
      powerUpsRef.current.forEach((pu) => {
        ctx.save();
        ctx.shadowColor = pu.type === "health" ? "#00ff66" : pu.type === "shield" ? "#00f0ff" : "#ff0055";
        ctx.shadowBlur = 12;
        ctx.fillStyle = pu.type === "health" ? "#00ff66" : pu.type === "shield" ? "#00f0ff" : "#ff0055";
        ctx.beginPath();
        ctx.arc(pu.x, pu.y, pu.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 10px monospace";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(pu.type[0].toUpperCase(), pu.x, pu.y);
        ctx.restore();
      });

      // Render Bullets
      bulletsRef.current.forEach((b) => {
        ctx.save();
        ctx.shadowColor = b.color;
        ctx.shadowBlur = 10;
        ctx.fillStyle = b.color;
        ctx.beginPath();
        ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });

      // Render Enemies
      enemiesRef.current.forEach((e) => {
        ctx.save();
        ctx.translate(e.x, e.y);
        ctx.rotate(e.angle);
        ctx.shadowColor = e.color;
        ctx.shadowBlur = 12;
        ctx.fillStyle = e.color;

        if (e.type === "scout" || e.type === "swarm") {
          ctx.beginPath();
          ctx.moveTo(e.radius, 0);
          ctx.lineTo(-e.radius, e.radius * 0.7);
          ctx.lineTo(-e.radius * 0.5, 0);
          ctx.lineTo(-e.radius, -e.radius * 0.7);
          ctx.closePath();
          ctx.fill();
        } else if (e.type === "interceptor") {
          ctx.beginPath();
          ctx.moveTo(e.radius * 1.2, 0);
          ctx.lineTo(-e.radius, e.radius);
          ctx.lineTo(-e.radius * 0.3, 0);
          ctx.lineTo(-e.radius, -e.radius);
          ctx.closePath();
          ctx.fill();
        } else if (e.type === "destroyer") {
          ctx.beginPath();
          ctx.rect(-e.radius, -e.radius, e.radius * 2, e.radius * 2);
          ctx.fill();
          ctx.strokeStyle = "#ffffff";
          ctx.lineWidth = 2;
          ctx.strokeRect(-e.radius * 0.6, -e.radius * 0.6, e.radius * 1.2, e.radius * 1.2);
        } else if (e.type === "boss") {
          // Octagon Boss
          ctx.beginPath();
          for (let i = 0; i < 8; i++) {
            const a = (i * Math.PI) / 4;
            const bx = Math.cos(a) * e.radius;
            const by = Math.sin(a) * e.radius;
            if (i === 0) ctx.moveTo(bx, by);
            else ctx.lineTo(bx, by);
          }
          ctx.closePath();
          ctx.fill();
          ctx.fillStyle = "#ffffff";
          ctx.beginPath();
          ctx.arc(0, 0, e.radius * 0.4, 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.restore();

        // Enemy Health Bar
        if (e.health < e.maxHealth) {
          ctx.fillStyle = "rgba(0, 0, 0, 0.6)";
          ctx.fillRect(e.x - e.radius, e.y - e.radius - 10, e.radius * 2, 4);
          ctx.fillStyle = e.color;
          ctx.fillRect(e.x - e.radius, e.y - e.radius - 10, (e.radius * 2 * e.health) / e.maxHealth, 4);
        }
      });

      // Render Player
      const p = playerRef.current;
      if (gameState === "playing" || gameState === "paused") {
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);

        // Player Shield aura
        if (p.shield > 0) {
          ctx.strokeStyle = `rgba(0, 240, 255, ${0.3 + (p.shield / p.maxShield) * 0.5})`;
          ctx.lineWidth = 2;
          ctx.shadowColor = "#00f0ff";
          ctx.shadowBlur = 10;
          ctx.beginPath();
          ctx.arc(0, 0, p.radius + 6, 0, Math.PI * 2);
          ctx.stroke();
        }

        // Invulnerability blinking
        if (p.invulnerableTime % 4 < 2) {
          ctx.shadowColor = "#00f0ff";
          ctx.shadowBlur = 15;
          ctx.fillStyle = p.shipClass === "phantom" ? "#ff00bb" : p.shipClass === "dreadnought" ? "#33ff55" : "#00f0ff";

          ctx.beginPath();
          ctx.moveTo(p.radius * 1.3, 0);
          ctx.lineTo(-p.radius, p.radius * 0.8);
          ctx.lineTo(-p.radius * 0.4, 0);
          ctx.lineTo(-p.radius, -p.radius * 0.8);
          ctx.closePath();
          ctx.fill();

          // Engine glow
          ctx.fillStyle = "#ffaa00";
          ctx.beginPath();
          ctx.arc(-p.radius * 0.6, 0, 5, 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.restore();

        // Render Drones
        dronesRef.current.forEach((drone, idx) => {
          const angle = drone.angle + (Date.now() / 500) % (Math.PI * 2);
          const dx = p.x + Math.cos(angle) * drone.distance;
          const dy = p.y + Math.sin(angle) * drone.distance;

          ctx.save();
          ctx.shadowColor = "#00ff66";
          ctx.shadowBlur = 8;
          ctx.fillStyle = "#00ff66";
          ctx.beginPath();
          ctx.arc(dx, dy, 6, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        });
      }

      // Render Floating Text
      floatingTextsRef.current.forEach((ft) => {
        ctx.save();
        ctx.globalAlpha = ft.alpha;
        ctx.fillStyle = ft.color;
        ctx.font = "bold 14px sans-serif";
        ctx.fillText(ft.text, ft.x, ft.y);
        ctx.restore();
      });

      ctx.restore();
      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, [gameState]);

  // Update Game Logic Step
  const updateGameLogic = (canvas: HTMLCanvasElement) => {
    const p = playerRef.current;

    // Player Rotation (aim at mouse)
    const dx = mouseRef.current.x - p.x;
    const dy = mouseRef.current.y - p.y;
    p.rotation = Math.atan2(dy, dx);

    // Player Movement Controls
    let moveX = 0;
    let moveY = 0;
    if (keysRef.current["w"] || keysRef.current["arrowup"]) moveY -= 1;
    if (keysRef.current["s"] || keysRef.current["arrowdown"]) moveY += 1;
    if (keysRef.current["a"] || keysRef.current["arrowleft"]) moveX -= 1;
    if (keysRef.current["d"] || keysRef.current["arrowright"]) moveX += 1;

    if (moveX !== 0 && moveY !== 0) {
      moveX *= 0.7071;
      moveY *= 0.7071;
    }

    const currentSpeed = p.isDashing ? p.speed * 2.2 : p.speed;
    p.vx = moveX * currentSpeed;
    p.vy = moveY * currentSpeed;

    p.x += p.vx;
    p.y += p.vy;

    // Boundaries
    p.x = Math.max(p.radius, Math.min(canvas.width - p.radius, p.x));
    p.y = Math.max(p.radius, Math.min(canvas.height - p.radius, p.y));

    // Dash timer
    if (p.isDashing) {
      p.dashTime--;
      if (p.dashTime <= 0) p.isDashing = false;
    }
    if (p.dashCooldown > 0) p.dashCooldown--;
    if (p.invulnerableTime > 0) p.invulnerableTime--;

    // Energy & Shield Recharge
    if (p.energy < p.maxEnergy) p.energy = Math.min(p.maxEnergy, p.energy + 0.2);
    if (p.shieldRechargeDelay > 0) {
      p.shieldRechargeDelay--;
    } else if (p.shield < p.maxShield) {
      p.shield = Math.min(p.maxShield, p.shield + 0.15);
    }

    // Auto / Mouse Firing
    const now = Date.now();
    if ((mouseRef.current.isDown || keysRef.current["j"]) && now - p.lastFired >= p.fireRate) {
      p.lastFired = now;
      fireWeapon();
    }

    // Drone auto fire
    dronesRef.current.forEach((drone, idx) => {
      if (now - drone.lastFired >= 300) {
        drone.lastFired = now;
        const angle = drone.angle + (Date.now() / 500) % (Math.PI * 2);
        const dx = p.x + Math.cos(angle) * drone.distance;
        const dy = p.y + Math.sin(angle) * drone.distance;
        let closest: Enemy | null = null;
        let minDist = 400;

        enemiesRef.current.forEach((e) => {
          const d = Math.hypot(e.x - dx, e.y - dy);
          if (d < minDist) {
            minDist = d;
            closest = e;
          }
        });

        if (closest) {
          const targetAngle = Math.atan2((closest as Enemy).y - dy, (closest as Enemy).x - dx);
          bulletsRef.current.push({
            id: Math.random().toString(),
            x: dx,
            y: dy,
            vx: Math.cos(targetAngle) * 12,
            vy: Math.sin(targetAngle) * 12,
            radius: 3,
            isEnemy: false,
            damage: 12,
            color: "#00ff66",
            lifetime: 60,
          });
        }
      }
    });

    // Update Bullets
    for (let i = bulletsRef.current.length - 1; i >= 0; i--) {
      const b = bulletsRef.current[i];
      b.x += b.vx;
      b.y += b.vy;
      b.lifetime--;

      // Offscreen or expired
      if (b.lifetime <= 0 || b.x < 0 || b.x > canvas.width || b.y < 0 || b.y > canvas.height) {
        bulletsRef.current.splice(i, 1);
        continue;
      }

      // Enemy hit by Player bullet
      if (!b.isEnemy) {
        for (let j = enemiesRef.current.length - 1; j >= 0; j--) {
          const e = enemiesRef.current[j];
          const dist = Math.hypot(b.x - e.x, b.y - e.y);
          if (dist < b.radius + e.radius) {
            e.health -= b.damage;
            audioSynth.playHit();

            // Hit particle
            particlesRef.current.push({
              x: b.x,
              y: b.y,
              vx: (Math.random() - 0.5) * 4,
              vy: (Math.random() - 0.5) * 4,
              radius: 2,
              color: "#ffffff",
              alpha: 1,
              decay: 0.1,
              shape: "spark",
            });

            // Bullet removal
            if (!b.pierce) {
              bulletsRef.current.splice(i, 1);
            } else {
              b.pierce--;
              if (b.pierce <= 0) bulletsRef.current.splice(i, 1);
            }

            // Enemy death check
            if (e.health <= 0) {
              onEnemyDefeated(e);
              enemiesRef.current.splice(j, 1);
            }
            break;
          }
        }
      } else {
        // Player hit by Enemy bullet
        const dist = Math.hypot(b.x - p.x, b.y - p.y);
        if (dist < b.radius + p.radius && p.invulnerableTime <= 0) {
          bulletsRef.current.splice(i, 1);
          damagePlayer(b.damage);
        }
      }
    }

    // Update Enemies
    for (let i = enemiesRef.current.length - 1; i >= 0; i--) {
      const e = enemiesRef.current[i];
      const targetAngle = Math.atan2(p.y - e.y, p.x - e.x);
      e.angle = targetAngle;

      e.vx = Math.cos(targetAngle) * e.speed;
      e.vy = Math.sin(targetAngle) * e.speed;
      e.x += e.vx;
      e.y += e.vy;

      // Enemy Shooting logic
      e.shootTimer++;
      if (e.shootTimer >= e.shootInterval) {
        e.shootTimer = 0;
        if (e.type === "boss") {
          // Boss bullet barrage
          for (let b = -2; b <= 2; b++) {
            const spreadAngle = targetAngle + (b * Math.PI) / 12;
            bulletsRef.current.push({
              id: Math.random().toString(),
              x: e.x,
              y: e.y,
              vx: Math.cos(spreadAngle) * 6,
              vy: Math.sin(spreadAngle) * 6,
              radius: 5,
              isEnemy: true,
              damage: 20,
              color: "#ff0055",
              lifetime: 120,
            });
          }
        } else {
          bulletsRef.current.push({
            id: Math.random().toString(),
            x: e.x,
            y: e.y,
            vx: Math.cos(targetAngle) * 7,
            vy: Math.sin(targetAngle) * 7,
            radius: 4,
            isEnemy: true,
            damage: 12,
            color: e.color,
            lifetime: 100,
          });
        }
      }

      // Collision with player
      const dist = Math.hypot(e.x - p.x, e.y - p.y);
      if (dist < e.radius + p.radius && p.invulnerableTime <= 0) {
        damagePlayer(25);
        if (e.type !== "boss") {
          onEnemyDefeated(e);
          enemiesRef.current.splice(i, 1);
        }
      }
    }

    // Update Powerups
    for (let i = powerUpsRef.current.length - 1; i >= 0; i--) {
      const pu = powerUpsRef.current[i];
      const dist = Math.hypot(pu.x - p.x, pu.y - p.y);
      if (dist < pu.radius + p.radius) {
        audioSynth.playPowerup();
        if (pu.type === "health") {
          p.health = Math.min(p.maxHealth, p.health + 40);
          addFloatingText("+40 HULL", p.x, p.y - 20, "#00ff66");
        } else if (pu.type === "shield") {
          p.shield = p.maxShield;
          addFloatingText("SHIELD RESTORED", p.x, p.y - 20, "#00f0ff");
        } else if (pu.type === "speed") {
          p.energy = p.maxEnergy;
          addFloatingText("TURBO BOOST", p.x, p.y - 20, "#ffff00");
        }
        powerUpsRef.current.splice(i, 1);
      }
    }

    // Update Particles
    for (let i = particlesRef.current.length - 1; i >= 0; i--) {
      const pt = particlesRef.current[i];
      pt.x += pt.vx;
      pt.y += pt.vy;
      pt.alpha -= pt.decay;
      if (pt.shape === "ring") pt.radius += 1.5;
      if (pt.alpha <= 0) particlesRef.current.splice(i, 1);
    }

    // Update Floating Text
    for (let i = floatingTextsRef.current.length - 1; i >= 0; i--) {
      const ft = floatingTextsRef.current[i];
      ft.y += ft.vy;
      ft.alpha -= 0.02;
      if (ft.alpha <= 0) floatingTextsRef.current.splice(i, 1);
    }

    // Check Wave Completion
    if (enemiesRef.current.length === 0 && waveInProgressRef.current) {
      waveInProgressRef.current = false;
      audioSynth.playPowerup();
      setWaveText(`WAVE ${wave} CLEAR!`);

      setTimeout(() => {
        setGameState("shop");
      }, 1500);
    }
  };

  // Weapon Fire Logic
  const fireWeapon = () => {
    const p = playerRef.current;
    audioSynth.playLaser();

    const speed = 14;
    const baseDamage = p.damage;

    if (p.weaponType === "plasma") {
      bulletsRef.current.push({
        id: Math.random().toString(),
        x: p.x + Math.cos(p.rotation) * p.radius,
        y: p.y + Math.sin(p.rotation) * p.radius,
        vx: Math.cos(p.rotation) * speed,
        vy: Math.sin(p.rotation) * speed,
        radius: 4,
        isEnemy: false,
        damage: baseDamage,
        color: "#00f0ff",
        lifetime: 50,
      });
    } else if (p.weaponType === "spread") {
      const angles = [p.rotation - 0.2, p.rotation, p.rotation + 0.2];
      angles.forEach((a) => {
        bulletsRef.current.push({
          id: Math.random().toString(),
          x: p.x + Math.cos(a) * p.radius,
          y: p.y + Math.sin(a) * p.radius,
          vx: Math.cos(a) * speed,
          vy: Math.sin(a) * speed,
          radius: 3.5,
          isEnemy: false,
          damage: baseDamage * 0.7,
          color: "#ff00bb",
          lifetime: 45,
        });
      });
    } else if (p.weaponType === "missile") {
      bulletsRef.current.push({
        id: Math.random().toString(),
        x: p.x + Math.cos(p.rotation) * p.radius,
        y: p.y + Math.sin(p.rotation) * p.radius,
        vx: Math.cos(p.rotation) * (speed * 0.8),
        vy: Math.sin(p.rotation) * (speed * 0.8),
        radius: 6,
        isEnemy: false,
        damage: baseDamage * 1.8,
        color: "#ffaa00",
        lifetime: 60,
        pierce: 1,
      });
    }
  };

  // Damage Player Logic
  const damagePlayer = (amount: number) => {
    const p = playerRef.current;
    screenShakeRef.current = 15;
    audioSynth.playExplosion();

    p.shieldRechargeDelay = 120; // 2 sec delay before recharge
    if (p.shield > 0) {
      if (p.shield >= amount) {
        p.shield -= amount;
      } else {
        const overflow = amount - p.shield;
        p.shield = 0;
        p.health -= overflow;
      }
    } else {
      p.health -= amount;
    }

    addFloatingText(`-${Math.round(amount)}`, p.x, p.y - 15, "#ff0055");

    if (p.health <= 0) {
      p.health = 0;
      setGameState("gameover");
      if (p.score > highScore) {
        setHighScore(p.score);
        if (typeof window !== "undefined") {
          localStorage.setItem("quantum_helix_highscore", p.score.toString());
        }
      }
    }
  };

  // Enemy Defeated Callback
  const onEnemyDefeated = (e: Enemy) => {
    audioSynth.playExplosion(e.type === "boss" || e.type === "destroyer");
    const p = playerRef.current;

    // Gain score & credits
    p.score += e.scoreValue;
    p.credits += e.creditsValue;
    p.xp += e.creditsValue * 2;

    setScore(p.score);
    setCredits(p.credits);

    // XP Level up check
    if (p.xp >= p.xpToNext) {
      p.level++;
      p.xp -= p.xpToNext;
      p.xpToNext = Math.round(p.xpToNext * 1.5);
      p.damage += 5;
      addFloatingText("LEVEL UP!", p.x, p.y - 30, "#ffff00");
    }

    // Explosion Particles
    const count = e.type === "boss" ? 50 : 15;
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const spd = Math.random() * 6 + 2;
      particlesRef.current.push({
        x: e.x,
        y: e.y,
        vx: Math.cos(angle) * spd,
        vy: Math.sin(angle) * spd,
        radius: Math.random() * 4 + 2,
        color: e.color,
        alpha: 1,
        decay: 0.03,
        shape: "circle",
      });
    }

    // Drop Powerup chance
    if (Math.random() < 0.25) {
      const types: ("health" | "shield" | "speed")[] = ["health", "shield", "speed"];
      const puType = types[Math.floor(Math.random() * types.length)];
      powerUpsRef.current.push({
        id: Math.random().toString(),
        type: puType,
        x: e.x,
        y: e.y,
        radius: 12,
        duration: 300,
      });
    }
  };

  const addFloatingText = (text: string, x: number, y: number, color: string) => {
    floatingTextsRef.current.push({
      id: Math.random().toString(),
      text,
      x,
      y,
      color,
      alpha: 1,
      vy: -1.2,
    });
  };

  // Purchase Upgrades
  const buyUpgrade = (upgId: string) => {
    const p = playerRef.current;
    setUpgrades((prev) =>
      prev.map((upg) => {
        if (upg.id === upgId && upg.level < upg.maxLevel && p.credits >= upg.cost) {
          p.credits -= upg.cost;
          setCredits(p.credits);

          // Apply Upgrade effects
          if (upgId === "max_health") {
            p.maxHealth += 25;
            p.health += 25;
          } else if (upgId === "max_shield") {
            p.maxShield += 20;
            p.shield += 20;
          } else if (upgId === "damage") {
            p.damage += 6;
          } else if (upgId === "fire_rate") {
            p.fireRate = Math.max(70, p.fireRate - 15);
          } else if (upgId === "drones") {
            p.dronesCount++;
            dronesRef.current.push({
              angle: (dronesRef.current.length * Math.PI * 2) / 3,
              distance: 45,
              lastFired: 0,
            });
          }

          return { ...upg, level: upg.level + 1, cost: Math.round(upg.cost * 1.5) };
        }
        return upg;
      })
    );
  };

  const continueNextWave = () => {
    setWave((prev) => {
      const nextW = prev + 1;
      startWave(nextW);
      return nextW;
    });
    setGameState("playing");
  };

  return (
    <div className="relative w-full min-h-screen bg-slate-950 text-white font-sans flex flex-col items-center justify-center p-4 overflow-hidden select-none">
      {/* Background Neon Overlay */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(0,240,255,0.08)_0,transparent_70%)] pointer-events-none" />

      {/* Header Bar */}
      <header className="w-full max-w-5xl flex items-center justify-between py-3 px-6 bg-slate-900/80 backdrop-blur-md border border-cyan-500/20 rounded-xl mb-4 shadow-lg shadow-cyan-500/5 z-10">
        <div className="flex items-center gap-3">
          <Sparkles className="w-6 h-6 text-cyan-400 animate-pulse" />
          <h1 className="text-xl font-bold tracking-wider bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 via-teal-300 to-indigo-400">
            QUANTUM HELIX: CYBER ODYSSEY
          </h1>
        </div>

        <div className="flex items-center gap-6 text-sm font-semibold">
          <div className="flex items-center gap-2">
            <Trophy className="w-4 h-4 text-amber-400" />
            <span className="text-slate-400">HIGH SCORE:</span>
            <span className="text-amber-400 font-mono text-base">{highScore.toLocaleString()}</span>
          </div>
          <button
            onClick={() => {
              const nextState = !soundEnabled;
              setSoundEnabled(nextState);
              audioSynth.enabled = nextState;
            }}
            className="p-2 rounded-lg bg-slate-800 border border-slate-700 hover:border-cyan-500/50 transition-all text-slate-300 hover:text-cyan-400"
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>
        </div>
      </header>

      {/* Main Canvas Area */}
      <div className="relative w-full max-w-5xl aspect-[12/7] bg-slate-900/90 border border-cyan-500/30 rounded-2xl overflow-hidden shadow-2xl shadow-cyan-500/10">
        <canvas ref={canvasRef} width={1200} height={700} className="w-full h-full block" />

        {/* Floating Wave Text Overlay */}
        {waveText && (
          <div className="absolute top-12 left-1/2 -translate-x-1/2 px-6 py-2 bg-cyan-950/80 border border-cyan-400/50 rounded-full text-cyan-300 font-black tracking-widest text-lg animate-bounce shadow-lg shadow-cyan-500/20">
            {waveText}
          </div>
        )}

        {/* HUD Overlay (Playing) */}
        {(gameState === "playing" || gameState === "paused") && (
          <div className="absolute top-4 left-4 right-4 flex justify-between items-start pointer-events-none">
            {/* Player Vitals */}
            <div className="flex flex-col gap-2 w-64 bg-slate-950/80 p-3 rounded-xl border border-cyan-500/20 backdrop-blur-md">
              {/* Hull Health */}
              <div>
                <div className="flex justify-between text-xs text-slate-300 mb-1 font-bold">
                  <span>HULL ARMOR</span>
                  <span>
                    {Math.round(playerRef.current.health)} / {playerRef.current.maxHealth}
                  </span>
                </div>
                <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-red-500 to-emerald-400 transition-all duration-200"
                    style={{ width: `${Math.max(0, (playerRef.current.health / playerRef.current.maxHealth) * 100)}%` }}
                  />
                </div>
              </div>

              {/* Shield Energy */}
              <div>
                <div className="flex justify-between text-xs text-slate-300 mb-1 font-bold">
                  <span>QUANTUM SHIELD</span>
                  <span>
                    {Math.round(playerRef.current.shield)} / {playerRef.current.maxShield}
                  </span>
                </div>
                <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-cyan-400 transition-all duration-150"
                    style={{ width: `${Math.max(0, (playerRef.current.shield / playerRef.current.maxShield) * 100)}%` }}
                  />
                </div>
              </div>

              {/* Turbo Energy */}
              <div>
                <div className="flex justify-between text-xs text-slate-400 mb-1">
                  <span>TURBO DASH (SPACE)</span>
                  <span>{Math.round(playerRef.current.energy)}%</span>
                </div>
                <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-amber-400 transition-all duration-100"
                    style={{ width: `${(playerRef.current.energy / playerRef.current.maxEnergy) * 100}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Score & Wave Info */}
            <div className="flex flex-col items-end gap-1 bg-slate-950/80 px-4 py-2 rounded-xl border border-cyan-500/20 backdrop-blur-md">
              <div className="text-xs text-cyan-400 font-bold tracking-widest">WAVE {wave}</div>
              <div className="text-2xl font-black font-mono text-white">{score.toLocaleString()}</div>
              <div className="text-xs text-emerald-400 font-semibold">{credits} CREDITS</div>
            </div>
          </div>
        )}

        {/* Menu Screen */}
        {gameState === "menu" && (
          <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center z-20">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 font-mono text-xs mb-4">
              <Radio className="w-3.5 h-3.5 animate-pulse" /> SYSTEM READY
            </div>
            <h2 className="text-4xl md:text-5xl font-black tracking-tight text-white mb-2">QUANTUM HELIX</h2>
            <p className="text-slate-400 max-w-md text-sm mb-8">
              Engage in high-octane 2D cyberpunk arcade space combat. Upgrade weapons, summon defense drones, and conquer rogue AI armadas.
            </p>

            <button
              onClick={() => setGameState("class_select")}
              className="px-8 py-4 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 font-bold text-white shadow-lg shadow-cyan-500/25 hover:brightness-110 hover:scale-105 transition-all flex items-center gap-3 text-lg"
            >
              <Play className="w-5 h-5 fill-current" /> LAUNCH MISSION
            </button>
          </div>
        )}

        {/* Class Selection Screen */}
        {gameState === "class_select" && (
          <div className="absolute inset-0 bg-slate-950/95 backdrop-blur-lg flex flex-col items-center justify-center p-6 z-20">
            <h3 className="text-2xl font-bold text-cyan-300 mb-6">SELECT YOUR STARFIGHTER</h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl w-full mb-8">
              {/* Vanguard */}
              <div
                onClick={() => startGame("vanguard")}
                className="bg-slate-900 border border-cyan-500/30 hover:border-cyan-400 p-5 rounded-2xl cursor-pointer hover:scale-105 transition-all flex flex-col items-center text-center group"
              >
                <div className="p-4 rounded-full bg-cyan-500/10 mb-4 group-hover:bg-cyan-500/20 text-cyan-400">
                  <Rocket className="w-8 h-8" />
                </div>
                <h4 className="text-lg font-bold text-white mb-1">HELIX VANGUARD</h4>
                <div className="text-xs text-cyan-400 mb-3">Balanced Assault</div>
                <p className="text-xs text-slate-400">Dual plasma cannons, standard hull armor, and rapid turbo maneuvering.</p>
              </div>

              {/* Phantom */}
              <div
                onClick={() => startGame("phantom")}
                className="bg-slate-900 border border-pink-500/30 hover:border-pink-400 p-5 rounded-2xl cursor-pointer hover:scale-105 transition-all flex flex-col items-center text-center group"
              >
                <div className="p-4 rounded-full bg-pink-500/10 mb-4 group-hover:bg-pink-500/20 text-pink-400">
                  <Zap className="w-8 h-8" />
                </div>
                <h4 className="text-lg font-bold text-white mb-1">NEON PHANTOM</h4>
                <div className="text-xs text-pink-400 mb-3">High-Speed Interceptor</div>
                <p className="text-xs text-slate-400">Ultra-fast spread shot cannons, high mobility, lighter armor protection.</p>
              </div>

              {/* Dreadnought */}
              <div
                onClick={() => startGame("dreadnought")}
                className="bg-slate-900 border border-emerald-500/30 hover:border-emerald-400 p-5 rounded-2xl cursor-pointer hover:scale-105 transition-all flex flex-col items-center text-center group"
              >
                <div className="p-4 rounded-full bg-emerald-500/10 mb-4 group-hover:bg-emerald-500/20 text-emerald-400">
                  <Shield className="w-8 h-8" />
                </div>
                <h4 className="text-lg font-bold text-white mb-1">AEGIS DREADNOUGHT</h4>
                <div className="text-xs text-emerald-400 mb-3">Heavy Armored Cruiser</div>
                <p className="text-xs text-slate-400">Heavy missile artillery, double hull strength, reduced movement speed.</p>
              </div>
            </div>

            <button
              onClick={() => setGameState("menu")}
              className="text-xs text-slate-400 hover:text-white flex items-center gap-1"
            >
              <ArrowLeft className="w-4 h-4" /> BACK TO MENU
            </button>
          </div>
        )}

        {/* Shop Overlay */}
        {gameState === "shop" && (
          <div className="absolute inset-0 bg-slate-950/95 backdrop-blur-lg flex flex-col items-center justify-center p-6 z-20">
            <div className="flex items-center gap-2 mb-2">
              <ShoppingBag className="w-6 h-6 text-cyan-400" />
              <h3 className="text-2xl font-bold text-white">UPGRADE HANGAR</h3>
            </div>
            <div className="text-sm text-emerald-400 font-mono mb-6">AVAILABLE CREDITS: {credits} CREDITS</div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl w-full mb-6">
              {upgrades.map((upg) => (
                <div key={upg.id} className="bg-slate-900 p-4 rounded-xl border border-slate-800 flex justify-between items-center">
                  <div>
                    <div className="font-bold text-sm text-white">{upg.name}</div>
                    <div className="text-xs text-slate-400 mb-1">{upg.description}</div>
                    <div className="text-xs text-cyan-400">
                      LVL {upg.level} / {upg.maxLevel}
                    </div>
                  </div>
                  <button
                    disabled={upg.level >= upg.maxLevel || credits < upg.cost}
                    onClick={() => buyUpgrade(upg.id)}
                    className="px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 disabled:bg-slate-800 disabled:text-slate-600 font-bold text-xs transition-all"
                  >
                    {upg.level >= upg.maxLevel ? "MAXED" : `${upg.cost} CREDITS`}
                  </button>
                </div>
              ))}
            </div>

            <button
              onClick={continueNextWave}
              className="px-8 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 font-bold text-white shadow-lg shadow-emerald-500/20 hover:scale-105 transition-all"
            >
              NEXT WAVE ({wave + 1}) →
            </button>
          </div>
        )}

        {/* Game Over Screen */}
        {gameState === "gameover" && (
          <div className="absolute inset-0 bg-slate-950/95 backdrop-blur-lg flex flex-col items-center justify-center p-6 text-center z-20">
            <h3 className="text-3xl font-black text-red-500 mb-2">HULL DESTROYED</h3>
            <p className="text-slate-400 text-sm mb-6">Your vessel was overwhelmed by enemy forces.</p>

            <div className="bg-slate-900 p-6 rounded-2xl border border-red-500/20 max-w-xs w-full mb-6">
              <div className="text-xs text-slate-400 mb-1">FINAL SCORE</div>
              <div className="text-3xl font-black font-mono text-cyan-400 mb-4">{score.toLocaleString()}</div>
              <div className="text-xs text-slate-400 mb-1">SURVIVED WAVES</div>
              <div className="text-xl font-bold text-white">{wave}</div>
            </div>

            <div className="flex gap-4">
              <button
                onClick={() => startGame(selectedClass)}
                className="px-6 py-3 rounded-xl bg-cyan-500 font-bold text-slate-950 hover:bg-cyan-400 transition-all flex items-center gap-2"
              >
                <RotateCcw className="w-4 h-4" /> RETRY MISSION
              </button>
              <button
                onClick={() => setGameState("menu")}
                className="px-6 py-3 rounded-xl bg-slate-800 font-bold text-slate-300 hover:bg-slate-700 transition-all"
              >
                MAIN MENU
              </button>
            </div>
          </div>
        )}

        {/* Paused Screen */}
        {gameState === "paused" && (
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center z-20">
            <h3 className="text-3xl font-black text-white mb-6">GAME PAUSED</h3>
            <button
              onClick={() => setGameState("playing")}
              className="px-8 py-3 rounded-xl bg-cyan-500 font-bold text-slate-950 hover:bg-cyan-400 transition-all mb-3"
            >
              RESUME GAME
            </button>
            <button
              onClick={() => setGameState("menu")}
              className="text-xs text-slate-400 hover:text-white"
            >
              QUIT TO MENU
            </button>
          </div>
        )}
      </div>

      {/* Footer Instructions */}
      <footer className="w-full max-w-5xl mt-4 flex items-center justify-between text-xs text-slate-400 px-2">
        <div>
          <span className="font-bold text-slate-300">CONTROLS:</span> WASD / Arrows to Move | Mouse to Aim & Shoot | SPACE for Turbo Dash | P to Pause
        </div>
        <div>Xakteir Arcade Engine 2026</div>
      </footer>
    </div>
  );
}
