"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Play, 
  RotateCcw, 
  Volume2, 
  VolumeX, 
  Zap, 
  Shield, 
  Sparkles, 
  Trophy, 
  Crosshair, 
  Maximize2, 
  ChevronRight,
  Gauge,
  Radio,
  Cpu,
  Activity,
  Award
} from "lucide-react";

// --- WEBAUDIO SOUND ENGINE ---
class SoundEngine {
  private ctx: AudioContext | null = null;
  public muted: boolean = false;

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

  public playLaser(type: number = 1) {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.connect(gain);
      gain.connect(this.ctx.destination);

      const now = this.ctx.currentTime;
      if (type === 1) {
        // Standard Plasma
        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(800, now);
        osc.frequency.exponentialRampToValueAtTime(150, now + 0.08);
        gain.gain.setValueAtTime(0.12, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.08);
        osc.start(now);
        osc.stop(now + 0.08);
      } else if (type === 2) {
        // Spread
        osc.type = "triangle";
        osc.frequency.setValueAtTime(600, now);
        osc.frequency.exponentialRampToValueAtTime(100, now + 0.12);
        gain.gain.setValueAtTime(0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.12);
        osc.start(now);
        osc.stop(now + 0.12);
      } else if (type === 3) {
        // Railgun
        osc.type = "square";
        osc.frequency.setValueAtTime(1200, now);
        osc.frequency.exponentialRampToValueAtTime(80, now + 0.2);
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
        osc.start(now);
        osc.stop(now + 0.2);
      } else if (type === 4) {
        // Mortar
        osc.type = "sine";
        osc.frequency.setValueAtTime(300, now);
        osc.frequency.exponentialRampToValueAtTime(60, now + 0.25);
        gain.gain.setValueAtTime(0.25, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);
        osc.start(now);
        osc.stop(now + 0.25);
      } else {
        // Void Beam
        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(1000, now);
        osc.frequency.exponentialRampToValueAtTime(400, now + 0.05);
        gain.gain.setValueAtTime(0.08, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.05);
        osc.start(now);
        osc.stop(now + 0.05);
      }
    } catch (e) {
      // Audio error fallback
    }
  }

  public playExplosion(isBoss: boolean = false) {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    try {
      const duration = isBoss ? 0.8 : 0.35;
      const bufferSize = this.ctx.sampleRate * duration;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }

      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.setValueAtTime(isBoss ? 400 : 800, this.ctx.currentTime);
      filter.frequency.exponentialRampToValueAtTime(30, this.ctx.currentTime + duration);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(isBoss ? 0.4 : 0.2, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + duration);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);

      noise.start();
    } catch (e) {
      // Audio error fallback
    }
  }

  public playPowerup() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(400, now);
      osc.frequency.exponentialRampToValueAtTime(1200, now + 0.3);
      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.3);
    } catch (e) {}
  }

  public playEmp() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(1500, now);
      osc.frequency.exponentialRampToValueAtTime(50, now + 0.5);
      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.5);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.5);
    } catch (e) {}
  }
}

const audio = new SoundEngine();

// --- GAME TYPES & INTERFACES ---
interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  alpha: number;
  life: number;
  maxLife: number;
}

interface Bullet {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  damage: number;
  isEnemy: boolean;
  piercing?: boolean;
}

interface Enemy {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  hp: number;
  maxHp: number;
  color: string;
  type: "scrapper" | "raider" | "dreadnought" | "boss";
  shootCooldown: number;
  angle: number;
  scoreValue: number;
}

interface Powerup {
  x: number;
  y: number;
  type: "shield" | "nuke" | "energy" | "damage";
  radius: number;
  color: string;
}

interface MatrixPerk {
  id: string;
  name: string;
  desc: string;
  cost: number;
  level: number;
  maxLevel: number;
  icon: string;
}

export default function CyberHelixQuantumSiege() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Game States
  const [gameState, setGameState] = useState<"start" | "playing" | "upgrading" | "gameover">("start");
  const [score, setScore] = useState<number>(0);
  const [highScore, setHighScore] = useState<number>(0);
  const [wave, setWave] = useState<number>(1);
  const [matrixCores, setMatrixCores] = useState<number>(0);
  const [health, setHealth] = useState<number>(100);
  const [maxHealth, setMaxHealth] = useState<number>(100);
  const [shield, setShield] = useState<number>(100);
  const [maxShield, setMaxShield] = useState<number>(100);
  const [energy, setEnergy] = useState<number>(100);
  const [empCooldown, setEmpCooldown] = useState<number>(0);
  const [selectedWeapon, setSelectedWeapon] = useState<number>(1);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [bossActive, setBossActive] = useState<boolean>(false);
  const [bossHpPercent, setBossHpPercent] = useState<number>(100);

  // Perks
  const [perks, setPerks] = useState<Record<string, MatrixPerk>>({
    shieldCap: { id: "shieldCap", name: "Shield Matrix", desc: "+25 Max Shield & faster regen", cost: 100, level: 1, maxLevel: 5, icon: "Shield" },
    plasmaCore: { id: "plasmaCore", name: "Plasma Reactor", desc: "+20% Fire Rate for all weapons", cost: 150, level: 1, maxLevel: 5, icon: "Zap" },
    hullArmor: { id: "hullArmor", name: "Nano Armor", desc: "+30 Max Health & auto repair", cost: 120, level: 1, maxLevel: 5, icon: "Cpu" },
    empBoost: { id: "empBoost", name: "Tachyon EMP", desc: "Decreases EMP Shockwave cooldown by 20%", cost: 200, level: 1, maxLevel: 3, icon: "Radio" },
    droneCompanion: { id: "droneCompanion", name: "Defense Drone", desc: "Deploys automated plasma turret drone", cost: 300, level: 0, maxLevel: 3, icon: "Crosshair" }
  });

  // Refs for Game Loop state without re-render delays
  const stateRef = useRef({
    player: {
      x: 0,
      y: 0,
      radius: 18,
      speed: 5.5,
      angle: 0,
      vx: 0,
      vy: 0,
      dashCooldown: 0,
      isDashing: false
    },
    keys: {
      w: false,
      a: false,
      s: false,
      d: false,
      space: false,
      shift: false,
      e: false
    },
    mouse: {
      x: 0,
      y: 0,
      down: false
    },
    bullets: [] as Bullet[],
    enemies: [] as Enemy[],
    particles: [] as Particle[],
    powerups: [] as Powerup[],
    shockwaves: [] as { x: number; y: number; radius: number; maxRadius: number; color: string }[],
    score: 0,
    wave: 1,
    matrixCores: 0,
    health: 100,
    maxHealth: 100,
    shield: 100,
    maxShield: 100,
    energy: 100,
    empCd: 0,
    lastShootTime: 0,
    selectedWeapon: 1,
    nextEnemyId: 1,
    enemiesRemainingInWave: 15,
    waveSpawnTimer: 0,
    gameTime: 0
  });

  // Load High Score
  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("xakteir_cyber_helix_highscore");
      if (saved) setHighScore(parseInt(saved, 10));
    }
  }, []);

  // Sync mute setting
  const toggleMute = () => {
    audio.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  // Start/Restart Game
  const startGame = () => {
    const s = stateRef.current;
    const canvas = canvasRef.current;
    const w = canvas ? canvas.width : 1000;
    const h = canvas ? canvas.height : 700;

    s.player.x = w / 2;
    s.player.y = h / 2;
    s.player.vx = 0;
    s.player.vy = 0;
    s.bullets = [];
    s.enemies = [];
    s.particles = [];
    s.powerups = [];
    s.shockwaves = [];
    s.score = 0;
    s.wave = 1;
    s.matrixCores = 0;
    s.health = 100;
    s.maxHealth = 100;
    s.shield = 100;
    s.maxShield = 100;
    s.energy = 100;
    s.empCd = 0;
    s.enemiesRemainingInWave = 12;
    s.gameTime = 0;

    setScore(0);
    setWave(1);
    setMatrixCores(0);
    setHealth(100);
    setMaxHealth(100);
    setShield(100);
    setMaxShield(100);
    setEnergy(100);
    setEmpCooldown(0);
    setBossActive(false);
    setGameState("playing");
  };

  // Trigger EMP Blast
  const triggerEmp = useCallback(() => {
    const s = stateRef.current;
    if (s.empCd > 0 || s.energy < 30) return;

    s.energy -= 30;
    const cooldownMax = 600 - (perks.empBoost.level * 90);
    s.empCd = Math.max(180, cooldownMax);
    setEmpCooldown(s.empCd);

    audio.playEmp();

    s.shockwaves.push({
      x: s.player.x,
      y: s.player.y,
      radius: 10,
      maxRadius: 380,
      color: "#06b6d4"
    });

    // Destroy bullets and damage enemies
    s.bullets = s.bullets.filter(b => !b.isEnemy);
    s.enemies.forEach(e => {
      const dist = Math.hypot(e.x - s.player.x, e.y - s.player.y);
      if (dist < 380) {
        e.hp -= 80;
        // Spawn particle blast
        for (let i = 0; i < 10; i++) {
          const angle = Math.random() * Math.PI * 2;
          const spd = Math.random() * 6 + 2;
          s.particles.push({
            x: e.x,
            y: e.y,
            vx: Math.cos(angle) * spd,
            vy: Math.sin(angle) * spd,
            size: Math.random() * 4 + 2,
            color: "#06b6d4",
            alpha: 1,
            life: 0,
            maxLife: 25
          });
        }
      }
    });
  }, [perks]);

  // Upgrade Matrix Perk
  const buyPerk = (perkId: string) => {
    const p = perks[perkId];
    if (!p || matrixCores < p.cost || p.level >= p.maxLevel) return;

    setMatrixCores(prev => prev - p.cost);
    stateRef.current.matrixCores -= p.cost;

    setPerks(prev => ({
      ...prev,
      [perkId]: {
        ...p,
        level: p.level + 1,
        cost: Math.round(p.cost * 1.6)
      }
    }));

    // Apply stat boosts
    const s = stateRef.current;
    if (perkId === "shieldCap") {
      s.maxShield += 25;
      s.shield = s.maxShield;
      setMaxShield(s.maxShield);
      setShield(s.shield);
    } else if (perkId === "hullArmor") {
      s.maxHealth += 30;
      s.health = s.maxHealth;
      setMaxHealth(s.maxHealth);
      setHealth(s.health);
    }
  };

  // Proceed to Next Wave
  const startNextWave = () => {
    const s = stateRef.current;
    s.wave += 1;
    s.enemiesRemainingInWave = 12 + s.wave * 4;
    setWave(s.wave);
    setGameState("playing");
  };

  // Main Canvas & Game Engine Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;

    const handleResize = () => {
      const parent = canvas.parentElement;
      if (parent) {
        canvas.width = parent.clientWidth;
        canvas.height = parent.clientHeight;
      }
    };
    handleResize();
    window.addEventListener("resize", handleResize);

    // Keyboard Listeners
    const onKeyDown = (e: KeyboardEvent) => {
      const k = stateRef.current.keys;
      const key = e.key.toLowerCase();
      if (key === "w" || e.key === "ArrowUp") k.w = true;
      if (key === "a" || e.key === "ArrowLeft") k.a = true;
      if (key === "s" || e.key === "ArrowDown") k.s = true;
      if (key === "d" || e.key === "ArrowRight") k.d = true;
      if (e.key === " ") k.space = true;
      if (e.key === "Shift") k.shift = true;
      if (key === "e") triggerEmp();
      if (key === "1") { stateRef.current.selectedWeapon = 1; setSelectedWeapon(1); }
      if (key === "2") { stateRef.current.selectedWeapon = 2; setSelectedWeapon(2); }
      if (key === "3") { stateRef.current.selectedWeapon = 3; setSelectedWeapon(3); }
      if (key === "4") { stateRef.current.selectedWeapon = 4; setSelectedWeapon(4); }
      if (key === "5") { stateRef.current.selectedWeapon = 5; setSelectedWeapon(5); }
    };

    const onKeyUp = (e: KeyboardEvent) => {
      const k = stateRef.current.keys;
      const key = e.key.toLowerCase();
      if (key === "w" || e.key === "ArrowUp") k.w = false;
      if (key === "a" || e.key === "ArrowLeft") k.a = false;
      if (key === "s" || e.key === "ArrowDown") k.s = false;
      if (key === "d" || e.key === "ArrowRight") k.d = false;
      if (e.key === " ") k.space = false;
      if (e.key === "Shift") k.shift = false;
    };

    const onMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      stateRef.current.mouse.x = e.clientX - rect.left;
      stateRef.current.mouse.y = e.clientY - rect.top;
    };

    const onMouseDown = () => {
      stateRef.current.mouse.down = true;
    };

    const onMouseUp = () => {
      stateRef.current.mouse.down = false;
    };

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    canvas.addEventListener("mousemove", onMouseMove);
    canvas.addEventListener("mousedown", onMouseDown);
    canvas.addEventListener("mouseup", onMouseUp);

    // --- GAME UPDATE FUNCTION ---
    const update = () => {
      const s = stateRef.current;
      if (gameState !== "playing") return;

      s.gameTime++;

      // Player Movement Physics
      let dx = 0;
      let dy = 0;
      if (s.keys.w) dy -= 1;
      if (s.keys.s) dy += 1;
      if (s.keys.a) dx -= 1;
      if (s.keys.d) dx += 1;

      if (dx !== 0 && dy !== 0) {
        dx *= 0.7071;
        dy *= 0.7071;
      }

      // Dash Logic
      if (s.player.dashCooldown > 0) s.player.dashCooldown--;
      if (s.keys.shift && s.player.dashCooldown <= 0 && (dx !== 0 || dy !== 0)) {
        s.player.vx += dx * 16;
        s.player.vy += dy * 16;
        s.player.dashCooldown = 60;
        // Dash particle effect
        for (let i = 0; i < 15; i++) {
          s.particles.push({
            x: s.player.x,
            y: s.player.y,
            vx: (Math.random() - 0.5) * 4,
            vy: (Math.random() - 0.5) * 4,
            size: Math.random() * 5 + 2,
            color: "#38bdf8",
            alpha: 1,
            life: 0,
            maxLife: 20
          });
        }
      } else {
        s.player.vx += dx * 0.8;
        s.player.vy += dy * 0.8;
      }

      s.player.vx *= 0.88;
      s.player.vy *= 0.88;
      s.player.x += s.player.vx;
      s.player.y += s.player.vy;

      // Keep inside screen
      s.player.x = Math.max(s.player.radius, Math.min(canvas.width - s.player.radius, s.player.x));
      s.player.y = Math.max(s.player.radius, Math.min(canvas.height - s.player.radius, s.player.y));

      // Player Rotation facing Mouse
      s.player.angle = Math.atan2(s.mouse.y - s.player.y, s.mouse.x - s.player.x);

      // Shield Regeneration
      if (s.shield < s.maxShield) {
        const regenSpeed = 0.05 + (perks.shieldCap.level * 0.02);
        s.shield = Math.min(s.maxShield, s.shield + regenSpeed);
        setShield(Math.floor(s.shield));
      }

      // Health Auto Repair if Nano Armor perk
      if (perks.hullArmor.level > 1 && s.health < s.maxHealth) {
        s.health = Math.min(s.maxHealth, s.health + 0.02);
        setHealth(Math.floor(s.health));
      }

      // Energy Regeneration
      if (s.energy < 100) {
        s.energy = Math.min(100, s.energy + 0.2);
        setEnergy(Math.floor(s.energy));
      }

      // EMP Cooldown decay
      if (s.empCd > 0) {
        s.empCd--;
        setEmpCooldown(s.empCd);
      }

      // Shooting Logic
      const now = Date.now();
      const fireRateMultiplier = 1 - (perks.plasmaCore.level * 0.05);
      const isShooting = s.mouse.down || s.keys.space;

      if (isShooting) {
        let cd = 160 * fireRateMultiplier;
        if (s.selectedWeapon === 2) cd = 280 * fireRateMultiplier;
        if (s.selectedWeapon === 3) cd = 400 * fireRateMultiplier;
        if (s.selectedWeapon === 4) cd = 500 * fireRateMultiplier;
        if (s.selectedWeapon === 5) cd = 80 * fireRateMultiplier;

        if (now - s.lastShootTime >= cd) {
          s.lastShootTime = now;
          audio.playLaser(s.selectedWeapon);

          const angle = s.player.angle;
          const px = s.player.x + Math.cos(angle) * 22;
          const py = s.player.y + Math.sin(angle) * 22;

          if (s.selectedWeapon === 1) {
            // Quantum Plasma
            s.bullets.push({
              x: px,
              y: py,
              vx: Math.cos(angle) * 14,
              vy: Math.sin(angle) * 14,
              size: 5,
              color: "#38bdf8",
              damage: 25,
              isEnemy: false
            });
          } else if (s.selectedWeapon === 2) {
            // Tachyon Spread (3-way)
            for (let offset of [-0.2, 0, 0.2]) {
              s.bullets.push({
                x: px,
                y: py,
                vx: Math.cos(angle + offset) * 13,
                vy: Math.sin(angle + offset) * 13,
                size: 4,
                color: "#c084fc",
                damage: 18,
                isEnemy: false
              });
            }
          } else if (s.selectedWeapon === 3) {
            // Heavy Railgun (Piercing)
            s.bullets.push({
              x: px,
              y: py,
              vx: Math.cos(angle) * 22,
              vy: Math.sin(angle) * 22,
              size: 8,
              color: "#f59e0b",
              damage: 70,
              isEnemy: false,
              piercing: true
            });
          } else if (s.selectedWeapon === 4) {
            // Graviton Mortar
            s.bullets.push({
              x: px,
              y: py,
              vx: Math.cos(angle) * 10,
              vy: Math.sin(angle) * 10,
              size: 10,
              color: "#10b981",
              damage: 90,
              isEnemy: false
            });
          } else if (s.selectedWeapon === 5) {
            // Void Beam
            s.bullets.push({
              x: px,
              y: py,
              vx: Math.cos(angle) * 16,
              vy: Math.sin(angle) * 16,
              size: 3.5,
              color: "#f43f5e",
              damage: 12,
              isEnemy: false
            });
          }
        }
      }

      // Drone Companion Shooting
      if (perks.droneCompanion.level > 0 && s.gameTime % 45 === 0) {
        const droneAngle = s.gameTime * 0.05;
        const dx = s.player.x + Math.cos(droneAngle) * 45;
        const dy = s.player.y + Math.sin(droneAngle) * 45;

        // Find nearest enemy
        let nearest: Enemy | null = null;
        let minDist = 600;
        s.enemies.forEach(e => {
          const d = Math.hypot(e.x - dx, e.y - dy);
          if (d < minDist) {
            minDist = d;
            nearest = e;
          }
        });

        if (nearest) {
          const targetAngle = Math.atan2((nearest as Enemy).y - dy, (nearest as Enemy).x - dx);
          s.bullets.push({
            x: dx,
            y: dy,
            vx: Math.cos(targetAngle) * 12,
            vy: Math.sin(targetAngle) * 12,
            size: 4,
            color: "#a855f7",
            damage: 15 * perks.droneCompanion.level,
            isEnemy: false
          });
        }
      }

      // Enemy Spawning Logic
      if (s.enemiesRemainingInWave > 0) {
        s.waveSpawnTimer++;
        if (s.waveSpawnTimer > Math.max(30, 90 - s.wave * 5)) {
          s.waveSpawnTimer = 0;
          s.enemiesRemainingInWave--;

          // Determine Spawn Position at edges
          let ex = 0, ey = 0;
          if (Math.random() < 0.5) {
            ex = Math.random() < 0.5 ? -30 : canvas.width + 30;
            ey = Math.random() * canvas.height;
          } else {
            ex = Math.random() * canvas.width;
            ey = Math.random() < 0.5 ? -30 : canvas.height + 30;
          }

          // Decide Enemy Type
          const isBossWave = s.wave % 5 === 0 && s.enemiesRemainingInWave === 0;
          let type: Enemy["type"] = "scrapper";
          let hp = 30 + s.wave * 10;
          let radius = 16;
          let color = "#ef4444";
          let scoreVal = 20;

          if (isBossWave) {
            type = "boss";
            hp = 500 + s.wave * 300;
            radius = 45;
            color = "#a855f7";
            scoreVal = 1000;
            setBossActive(true);
            setBossHpPercent(100);
          } else if (Math.random() < 0.25 + s.wave * 0.03) {
            type = "dreadnought";
            hp = 120 + s.wave * 25;
            radius = 28;
            color = "#f97316";
            scoreVal = 80;
          } else if (Math.random() < 0.4) {
            type = "raider";
            hp = 50 + s.wave * 15;
            radius = 20;
            color = "#eab308";
            scoreVal = 40;
          }

          s.enemies.push({
            id: s.nextEnemyId++,
            x: ex,
            y: ey,
            vx: 0,
            vy: 0,
            radius,
            hp,
            maxHp: hp,
            color,
            type,
            shootCooldown: Math.random() * 60,
            angle: 0,
            scoreValue: scoreVal
          });
        }
      } else if (s.enemies.length === 0) {
        // Wave Cleared -> Matrix Upgrade Shop
        setGameState("upgrading");
        setBossActive(false);
      }

      // Update Enemies & Enemy Shooting
      s.enemies.forEach((e, idx) => {
        const angle = Math.atan2(s.player.y - e.y, s.player.x - e.x);
        e.angle = angle;

        let spd = 2.2;
        if (e.type === "scrapper") spd = 3.4;
        if (e.type === "dreadnought") spd = 1.4;
        if (e.type === "boss") spd = 0.9;

        e.vx = Math.cos(angle) * spd;
        e.vy = Math.sin(angle) * spd;
        e.x += e.vx;
        e.y += e.vy;

        // Boss hp UI update
        if (e.type === "boss") {
          setBossHpPercent(Math.max(0, Math.floor((e.hp / e.maxHp) * 100)));
        }

        // Enemy Shooting
        e.shootCooldown++;
        let rate = e.type === "boss" ? 30 : e.type === "dreadnought" ? 80 : 120;
        if (e.shootCooldown > rate) {
          e.shootCooldown = 0;
          if (e.type === "raider" || e.type === "dreadnought" || e.type === "boss") {
            s.bullets.push({
              x: e.x,
              y: e.y,
              vx: Math.cos(angle) * (e.type === "boss" ? 7 : 5),
              vy: Math.sin(angle) * (e.type === "boss" ? 7 : 5),
              size: e.type === "boss" ? 8 : 5,
              color: "#f43f5e",
              damage: e.type === "boss" ? 25 : 12,
              isEnemy: true
            });
            if (e.type === "boss") {
              // Radial ring shot
              for (let a = 0; a < Math.PI * 2; a += Math.PI / 4) {
                s.bullets.push({
                  x: e.x,
                  y: e.y,
                  vx: Math.cos(a) * 5,
                  vy: Math.sin(a) * 5,
                  size: 6,
                  color: "#a855f7",
                  damage: 15,
                  isEnemy: true
                });
              }
            }
          }
        }
      });

      // Update Bullets & Collisions
      s.bullets.forEach((b, bIdx) => {
        b.x += b.vx;
        b.y += b.vy;

        // Player bullet hitting enemies
        if (!b.isEnemy) {
          s.enemies.forEach((e, eIdx) => {
            const dist = Math.hypot(e.x - b.x, e.y - b.y);
            if (dist < e.radius + b.size) {
              e.hp -= b.damage;
              if (!b.piercing) s.bullets.splice(bIdx, 1);

              // Bullet spark particles
              for (let i = 0; i < 4; i++) {
                s.particles.push({
                  x: b.x,
                  y: b.y,
                  vx: (Math.random() - 0.5) * 6,
                  vy: (Math.random() - 0.5) * 6,
                  size: Math.random() * 3 + 1,
                  color: b.color,
                  alpha: 1,
                  life: 0,
                  maxLife: 15
                });
              }

              // Enemy Defeated
              if (e.hp <= 0) {
                audio.playExplosion(e.type === "boss");
                s.score += e.scoreValue;
                s.matrixCores += Math.round(e.scoreValue / 5);

                setScore(s.score);
                setMatrixCores(s.matrixCores);

                if (s.score > highScore) {
                  setHighScore(s.score);
                  if (typeof window !== "undefined") {
                    localStorage.setItem("xakteir_cyber_helix_highscore", s.score.toString());
                  }
                }

                // Drop Powerup chance
                if (Math.random() < 0.25 || e.type === "boss") {
                  const types: Powerup["type"][] = ["shield", "nuke", "energy", "damage"];
                  const selected = types[Math.floor(Math.random() * types.length)];
                  const colors = { shield: "#06b6d4", nuke: "#ef4444", energy: "#eab308", damage: "#a855f7" };
                  s.powerups.push({
                    x: e.x,
                    y: e.y,
                    type: selected,
                    radius: 12,
                    color: colors[selected]
                  });
                }

                // Explosion particle shockwave
                for (let i = 0; i < (e.type === "boss" ? 40 : 15); i++) {
                  const a = Math.random() * Math.PI * 2;
                  const spd = Math.random() * (e.type === "boss" ? 10 : 6) + 1;
                  s.particles.push({
                    x: e.x,
                    y: e.y,
                    vx: Math.cos(a) * spd,
                    vy: Math.sin(a) * spd,
                    size: Math.random() * 5 + 2,
                    color: e.color,
                    alpha: 1,
                    life: 0,
                    maxLife: 30
                  });
                }

                s.enemies.splice(eIdx, 1);
              }
            }
          });
        } else {
          // Enemy bullet hitting player
          const dist = Math.hypot(s.player.x - b.x, s.player.y - b.y);
          if (dist < s.player.radius + b.size) {
            s.bullets.splice(bIdx, 1);

            // Shield absorbs damage first
            if (s.shield > 0) {
              s.shield -= b.damage;
              if (s.shield < 0) {
                s.health += s.shield; // overflow damage
                s.shield = 0;
              }
            } else {
              s.health -= b.damage;
            }

            setShield(Math.max(0, Math.floor(s.shield)));
            setHealth(Math.max(0, Math.floor(s.health)));

            // Player hit particles
            for (let i = 0; i < 8; i++) {
              s.particles.push({
                x: s.player.x,
                y: s.player.y,
                vx: (Math.random() - 0.5) * 7,
                vy: (Math.random() - 0.5) * 7,
                size: Math.random() * 4 + 2,
                color: "#ef4444",
                alpha: 1,
                life: 0,
                maxLife: 20
              });
            }

            // Player Death Check
            if (s.health <= 0) {
              audio.playExplosion(true);
              setGameState("gameover");

              // Dispatch leaderboard score event to Xakteir system
              if (typeof window !== "undefined") {
                const event = new CustomEvent("xakteir-game-score", {
                  detail: { score: s.score, points: Math.floor(s.score / 10) }
                });
                window.dispatchEvent(event);
              }
            }
          }
        }
      });

      // Filter out of bound bullets
      s.bullets = s.bullets.filter(b => b.x >= -50 && b.x <= canvas.width + 50 && b.y >= -50 && b.y <= canvas.height + 50);

      // Collect Powerups
      s.powerups.forEach((p, pIdx) => {
        const dist = Math.hypot(s.player.x - p.x, s.player.y - p.y);
        if (dist < s.player.radius + p.radius) {
          audio.playPowerup();
          if (p.type === "shield") {
            s.shield = Math.min(s.maxShield, s.shield + 40);
            setShield(Math.floor(s.shield));
          } else if (p.type === "energy") {
            s.energy = 100;
            setEnergy(100);
          } else if (p.type === "nuke") {
            // Nuke clears non-boss enemies
            s.enemies.forEach(e => {
              if (e.type !== "boss") e.hp = 0;
            });
          } else if (p.type === "damage") {
            s.score += 150;
            setScore(s.score);
          }
          s.powerups.splice(pIdx, 1);
        }
      });

      // Update Shockwaves
      s.shockwaves.forEach((sw, idx) => {
        sw.radius += 14;
        if (sw.radius >= sw.maxRadius) {
          s.shockwaves.splice(idx, 1);
        }
      });

      // Update Particles
      s.particles.forEach((p, idx) => {
        p.x += p.vx;
        p.y += p.vy;
        p.life++;
        p.alpha = 1 - (p.life / p.maxLife);
        if (p.life >= p.maxLife) {
          s.particles.splice(idx, 1);
        }
      });
    };

    // --- CANVAS RENDER FUNCTION ---
    const render = () => {
      const s = stateRef.current;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Cyber Grid Background
      ctx.strokeStyle = "rgba(6, 182, 212, 0.06)";
      ctx.lineWidth = 1;
      const gridSize = 40;
      const offset = (s.gameTime * 0.5) % gridSize;

      for (let x = 0; x < canvas.width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
      }
      for (let y = offset; y < canvas.height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
      }

      // Draw Shockwaves
      s.shockwaves.forEach(sw => {
        ctx.save();
        ctx.beginPath();
        ctx.arc(sw.x, sw.y, sw.radius, 0, Math.PI * 2);
        ctx.strokeStyle = sw.color;
        ctx.lineWidth = 6;
        ctx.shadowColor = sw.color;
        ctx.shadowBlur = 15;
        ctx.globalAlpha = 1 - (sw.radius / sw.maxRadius);
        ctx.stroke();
        ctx.restore();
      });

      // Draw Powerups
      s.powerups.forEach(p => {
        ctx.save();
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 12;
        ctx.fill();
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.restore();
      });

      // Draw Enemies
      s.enemies.forEach(e => {
        ctx.save();
        ctx.translate(e.x, e.y);
        ctx.rotate(e.angle);

        // Body Shape
        ctx.beginPath();
        if (e.type === "scrapper") {
          ctx.moveTo(e.radius, 0);
          ctx.lineTo(-e.radius, -e.radius * 0.7);
          ctx.lineTo(-e.radius * 0.4, 0);
          ctx.lineTo(-e.radius, e.radius * 0.7);
        } else if (e.type === "boss") {
          // Octagon Boss
          for (let i = 0; i < 8; i++) {
            const a = (i * Math.PI) / 4;
            const rx = Math.cos(a) * e.radius;
            const ry = Math.sin(a) * e.radius;
            if (i === 0) ctx.moveTo(rx, ry);
            else ctx.lineTo(rx, ry);
          }
        } else {
          ctx.moveTo(e.radius, 0);
          ctx.lineTo(-e.radius, -e.radius);
          ctx.lineTo(-e.radius, e.radius);
        }
        ctx.closePath();

        ctx.fillStyle = e.color;
        ctx.shadowColor = e.color;
        ctx.shadowBlur = 14;
        ctx.fill();
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Enemy Health Bar
        ctx.rotate(-e.angle);
        ctx.fillStyle = "rgba(0,0,0,0.6)";
        ctx.fillRect(-e.radius, -e.radius - 12, e.radius * 2, 4);
        ctx.fillStyle = e.color;
        ctx.fillRect(-e.radius, -e.radius - 12, (e.radius * 2) * (e.hp / e.maxHp), 4);

        ctx.restore();
      });

      // Draw Player Ship
      if (gameState === "playing") {
        ctx.save();
        ctx.translate(s.player.x, s.player.y);
        ctx.rotate(s.player.angle);

        // Ship Body
        ctx.beginPath();
        ctx.moveTo(s.player.radius * 1.3, 0);
        ctx.lineTo(-s.player.radius, -s.player.radius * 0.8);
        ctx.lineTo(-s.player.radius * 0.4, 0);
        ctx.lineTo(-s.player.radius, s.player.radius * 0.8);
        ctx.closePath();

        ctx.fillStyle = "#06b6d4";
        ctx.shadowColor = "#06b6d4";
        ctx.shadowBlur = 18;
        ctx.fill();
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 2;
        ctx.stroke();

        // Thruster Flare
        ctx.beginPath();
        ctx.moveTo(-s.player.radius * 0.5, 0);
        ctx.lineTo(-s.player.radius * 1.2, -4);
        ctx.lineTo(-s.player.radius * (1.4 + Math.random() * 0.4), 0);
        ctx.lineTo(-s.player.radius * 1.2, 4);
        ctx.fillStyle = "#38bdf8";
        ctx.fill();

        // Shield Aura
        if (s.shield > 0) {
          ctx.beginPath();
          ctx.arc(0, 0, s.player.radius + 6, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(6, 182, 212, ${0.4 + (s.shield / s.maxShield) * 0.4})`;
          ctx.lineWidth = 3;
          ctx.stroke();
        }

        ctx.restore();

        // Draw Drone Companion if active
        if (perks.droneCompanion.level > 0) {
          const droneAngle = s.gameTime * 0.05;
          const dx = s.player.x + Math.cos(droneAngle) * 45;
          const dy = s.player.y + Math.sin(droneAngle) * 45;

          ctx.save();
          ctx.translate(dx, dy);
          ctx.beginPath();
          ctx.arc(0, 0, 8, 0, Math.PI * 2);
          ctx.fillStyle = "#a855f7";
          ctx.shadowColor = "#a855f7";
          ctx.shadowBlur = 10;
          ctx.fill();
          ctx.strokeStyle = "#ffffff";
          ctx.stroke();
          ctx.restore();
        }
      }

      // Draw Bullets
      s.bullets.forEach(b => {
        ctx.save();
        ctx.beginPath();
        ctx.arc(b.x, b.y, b.size, 0, Math.PI * 2);
        ctx.fillStyle = b.color;
        ctx.shadowColor = b.color;
        ctx.shadowBlur = 10;
        ctx.fill();
        ctx.restore();
      });

      // Draw Particles
      s.particles.forEach(p => {
        ctx.save();
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.alpha;
        ctx.fill();
        ctx.restore();
      });
    };

    const loop = () => {
      update();
      render();
      animationFrameId = requestAnimationFrame(loop);
    };
    loop();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      canvas.removeEventListener("mousemove", onMouseMove);
      canvas.removeEventListener("mousedown", onMouseDown);
      canvas.removeEventListener("mouseup", onMouseUp);
    };
  }, [gameState, perks, triggerEmp, highScore]);

  return (
    <div className="relative w-full h-screen bg-[#05030d] text-white font-sans overflow-hidden select-none">
      {/* HTML5 Canvas */}
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full z-0 block cursor-crosshair" />

      {/* TOP HEADS-UP DISPLAY (HUD) */}
      <div className="absolute top-0 inset-x-0 p-4 md:p-6 z-10 flex items-center justify-between pointer-events-none">
        {/* Left Stats: HP & Shield */}
        <div className="flex flex-col gap-2 min-w-[220px]">
          {/* Health Bar */}
          <div className="flex items-center gap-3 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-xl border border-rose-500/30">
            <Activity className="w-4 h-4 text-rose-500 shrink-0" />
            <div className="flex-1">
              <div className="flex justify-between text-[10px] uppercase font-bold tracking-wider text-rose-400 mb-0.5">
                <span>Hull Integrity</span>
                <span>{health} / {maxHealth}</span>
              </div>
              <div className="w-full h-2 bg-rose-950/80 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-rose-600 to-rose-400 transition-all duration-200" style={{ width: `${(health / maxHealth) * 100}%` }} />
              </div>
            </div>
          </div>

          {/* Shield Bar */}
          <div className="flex items-center gap-3 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-xl border border-cyan-500/30">
            <Shield className="w-4 h-4 text-cyan-400 shrink-0" />
            <div className="flex-1">
              <div className="flex justify-between text-[10px] uppercase font-bold tracking-wider text-cyan-400 mb-0.5">
                <span>Shield Matrix</span>
                <span>{shield} / {maxShield}</span>
              </div>
              <div className="w-full h-2 bg-cyan-950/80 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-cyan-600 to-cyan-400 transition-all duration-200" style={{ width: `${(shield / maxShield) * 100}%` }} />
              </div>
            </div>
          </div>
        </div>

        {/* Center: Wave & Score */}
        <div className="flex flex-col items-center">
          <div className="bg-black/60 backdrop-blur-md px-6 py-2 rounded-2xl border border-indigo-500/30 shadow-[0_0_20px_rgba(99,102,241,0.2)] text-center">
            <span className="text-[10px] font-black uppercase tracking-widest text-indigo-400 block">Wave {wave}</span>
            <span className="text-2xl md:text-3xl font-black tracking-tight text-white">{score.toLocaleString()}</span>
          </div>
          {bossActive && (
            <div className="mt-2 w-64 bg-black/80 backdrop-blur-md p-2 rounded-xl border border-purple-500/50">
              <div className="flex justify-between text-[10px] font-bold text-purple-400 uppercase tracking-widest mb-1">
                <span>Helix Core Boss</span>
                <span>{bossHpPercent}%</span>
              </div>
              <div className="w-full h-2 bg-purple-950 rounded-full overflow-hidden">
                <div className="h-full bg-purple-500 transition-all duration-150" style={{ width: `${bossHpPercent}%` }} />
              </div>
            </div>
          )}
        </div>

        {/* Right: Matrix Cores & Controls */}
        <div className="flex items-center gap-3 pointer-events-auto">
          <div className="flex items-center gap-2 bg-black/60 backdrop-blur-md px-4 py-2 rounded-xl border border-amber-500/30 text-amber-400 font-bold text-sm">
            <Cpu className="w-4 h-4 text-amber-400" />
            <span>{matrixCores} Cores</span>
          </div>
          <button
            onClick={toggleMute}
            className="p-2.5 rounded-xl bg-black/60 backdrop-blur-md border border-white/10 hover:bg-white/10 text-white/80 transition-colors"
          >
            {isMuted ? <VolumeX className="w-5 h-5 text-rose-400" /> : <Volume2 className="w-5 h-5 text-emerald-400" />}
          </button>
        </div>
      </div>

      {/* BOTTOM WEAPON SELECTOR HUD */}
      {gameState === "playing" && (
        <div className="absolute bottom-6 inset-x-0 z-10 flex flex-col items-center gap-2 pointer-events-auto">
          {/* EMP & Ability Bar */}
          <div className="flex items-center gap-4 mb-1">
            <button
              onClick={triggerEmp}
              disabled={empCooldown > 0 || energy < 30}
              className={`px-4 py-1.5 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center gap-2 transition-all ${
                empCooldown === 0 && energy >= 30
                  ? "bg-cyan-500 hover:bg-cyan-400 text-black shadow-[0_0_15px_rgba(6,182,212,0.6)] cursor-pointer"
                  : "bg-white/5 text-white/30 border border-white/10 cursor-not-allowed"
              }`}
            >
              <Radio className="w-4 h-4" />
              <span>EMP Shockwave (Key E)</span>
              {empCooldown > 0 && <span className="text-[10px]">({Math.ceil(empCooldown / 60)}s)</span>}
            </button>
          </div>

          {/* Weapon Slots */}
          <div className="flex items-center gap-2 bg-black/70 backdrop-blur-xl p-1.5 rounded-2xl border border-white/10 shadow-[0_0_30px_rgba(0,0,0,0.8)]">
            {[
              { id: 1, name: "Plasma", color: "border-cyan-400 text-cyan-400" },
              { id: 2, name: "Spread", color: "border-purple-400 text-purple-400" },
              { id: 3, name: "Railgun", color: "border-amber-400 text-amber-400" },
              { id: 4, name: "Mortar", color: "border-emerald-400 text-emerald-400" },
              { id: 5, name: "Void Beam", color: "border-rose-400 text-rose-400" }
            ].map(w => (
              <button
                key={w.id}
                onClick={() => {
                  setSelectedWeapon(w.id);
                  stateRef.current.selectedWeapon = w.id;
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold uppercase transition-all flex items-center gap-2 border ${
                  selectedWeapon === w.id
                    ? `${w.color} bg-white/10 shadow-[0_0_15px_rgba(255,255,255,0.1)] scale-105`
                    : "border-transparent text-white/40 hover:text-white/80 hover:bg-white/5"
                }`}
              >
                <span className="opacity-50">[{w.id}]</span>
                <span>{w.name}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* MODAL OVERLAYS */}
      <AnimatePresence>
        {/* START SCREEN */}
        {gameState === "start" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-30 bg-black/80 backdrop-blur-xl flex flex-col items-center justify-center p-6 text-center"
          >
            <div className="max-w-md w-full bg-[#0d091e] border border-cyan-500/30 p-8 rounded-3xl shadow-[0_0_50px_rgba(6,182,212,0.2)]">
              <div className="w-16 h-16 rounded-2xl bg-cyan-500/10 border border-cyan-500/40 flex items-center justify-center mx-auto mb-6">
                <Crosshair className="w-8 h-8 text-cyan-400 animate-pulse" />
              </div>

              <h1 className="text-3xl font-black tracking-tight text-white uppercase mb-2">Cyber Helix</h1>
              <p className="text-xs text-cyan-400 font-bold uppercase tracking-widest mb-6">Quantum Siege Overdrive</p>

              <p className="text-sm text-white/60 mb-6 leading-relaxed">
                Pilot your apex interceptor, deploy EMP shockwaves, level up matrix perk upgrades between waves, and obliterate rogue AI dreadnoughts.
              </p>

              <div className="grid grid-cols-2 gap-3 text-left mb-6 text-xs bg-black/40 p-4 rounded-2xl border border-white/5">
                <div>
                  <span className="text-white/40 block">Movement:</span>
                  <span className="text-white font-bold">WASD / Arrow Keys</span>
                </div>
                <div>
                  <span className="text-white/40 block">Aim & Fire:</span>
                  <span className="text-white font-bold">Mouse & Left Click</span>
                </div>
                <div>
                  <span className="text-white/40 block">Dash:</span>
                  <span className="text-white font-bold">Left Shift</span>
                </div>
                <div>
                  <span className="text-white/40 block">EMP Shockwave:</span>
                  <span className="text-white font-bold">E Key</span>
                </div>
              </div>

              {highScore > 0 && (
                <div className="flex items-center justify-center gap-2 text-xs font-bold text-amber-400 mb-6">
                  <Trophy className="w-4 h-4" />
                  <span>High Score: {highScore.toLocaleString()}</span>
                </div>
              )}

              <button
                onClick={startGame}
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-black font-black uppercase tracking-wider text-sm shadow-[0_0_30px_rgba(6,182,212,0.4)] transition-all transform hover:scale-[1.02]"
              >
                Initialize Launch
              </button>
            </div>
          </motion.div>
        )}

        {/* WAVE INTERMISSION: MATRIX UPGRADE STORE */}
        {gameState === "upgrading" && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="absolute inset-0 z-30 bg-black/85 backdrop-blur-xl flex flex-col items-center justify-center p-6"
          >
            <div className="max-w-2xl w-full bg-[#0e0c1f] border border-indigo-500/40 p-8 rounded-3xl shadow-[0_0_60px_rgba(99,102,241,0.25)]">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-2xl font-black uppercase text-white tracking-tight">Wave {wave} Cleared!</h2>
                  <p className="text-xs text-indigo-400 font-semibold mt-1">Upgrade matrix perks using harvested cores</p>
                </div>
                <div className="flex items-center gap-2 bg-amber-500/10 border border-amber-500/30 px-4 py-2 rounded-xl text-amber-400 font-bold text-sm">
                  <Cpu className="w-4 h-4" />
                  <span>{matrixCores} Cores Available</span>
                </div>
              </div>

              {/* Perk Options List */}
              <div className="flex flex-col gap-3 mb-8 max-h-[360px] overflow-y-auto pr-1">
                {Object.values(perks).map(p => (
                  <div key={p.id} className="flex items-center justify-between bg-black/40 border border-white/10 p-4 rounded-2xl">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-black text-sm text-white">{p.name}</span>
                        <span className="text-[10px] font-bold text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5 rounded-md">
                          Lvl {p.level} / {p.maxLevel}
                        </span>
                      </div>
                      <p className="text-xs text-white/60">{p.desc}</p>
                    </div>

                    <button
                      onClick={() => buyPerk(p.id)}
                      disabled={matrixCores < p.cost || p.level >= p.maxLevel}
                      className={`px-4 py-2 rounded-xl font-bold text-xs uppercase tracking-wider transition-all ${
                        p.level >= p.maxLevel
                          ? "bg-white/5 text-white/30 border border-white/10 cursor-default"
                          : matrixCores >= p.cost
                          ? "bg-indigo-500 hover:bg-indigo-400 text-black shadow-[0_0_15px_rgba(99,102,241,0.5)]"
                          : "bg-white/5 text-white/30 border border-white/10 cursor-not-allowed"
                      }`}
                    >
                      {p.level >= p.maxLevel ? "MAX" : `Upgrade (${p.cost} Cores)`}
                    </button>
                  </div>
                ))}
              </div>

              <button
                onClick={startNextWave}
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-black font-black uppercase tracking-wider text-sm shadow-[0_0_30px_rgba(16,185,129,0.4)] transition-all"
              >
                Proceed to Wave {wave + 1}
              </button>
            </div>
          </motion.div>
        )}

        {/* GAME OVER SCREEN */}
        {gameState === "gameover" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-30 bg-black/90 backdrop-blur-xl flex flex-col items-center justify-center p-6 text-center"
          >
            <div className="max-w-md w-full bg-[#120a16] border border-rose-500/40 p-8 rounded-3xl shadow-[0_0_60px_rgba(244,63,94,0.3)]">
              <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/40 flex items-center justify-center mx-auto mb-6">
                <Activity className="w-8 h-8 text-rose-500" />
              </div>

              <h2 className="text-3xl font-black uppercase text-white mb-2">Ship Destroyed</h2>
              <p className="text-xs text-rose-400 font-bold uppercase tracking-widest mb-6">Quantum Hull Defeated</p>

              <div className="bg-black/40 border border-white/10 p-4 rounded-2xl mb-6 flex justify-around">
                <div>
                  <span className="text-[10px] text-white/40 uppercase block">Final Score</span>
                  <span className="text-2xl font-black text-white">{score.toLocaleString()}</span>
                </div>
                <div>
                  <span className="text-[10px] text-white/40 uppercase block">Wave Reached</span>
                  <span className="text-2xl font-black text-indigo-400">{wave}</span>
                </div>
              </div>

              <button
                onClick={startGame}
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-rose-500 to-indigo-600 hover:from-rose-400 hover:to-indigo-500 text-white font-black uppercase tracking-wider text-sm shadow-[0_0_30px_rgba(244,63,94,0.4)] transition-all transform hover:scale-[1.02] flex items-center justify-center gap-2"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Re-Initialize Systems</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
