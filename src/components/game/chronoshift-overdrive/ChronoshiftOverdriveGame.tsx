"use client";

import React, { useEffect, useRef, useState } from "react";
import {
  Play,
  Pause,
  RotateCcw,
  Volume2,
  VolumeX,
  Zap,
  Shield,
  Clock,
  Sparkles,
  Trophy,
  Activity,
  Crosshair,
  Flame,
  Award,
  ChevronRight,
} from "lucide-react";

// --- TYPES & INTERFACES ---

export interface Perk {
  id: string;
  name: string;
  description: string;
  icon: string;
  level: number;
  maxLevel: number;
}

interface Entity {
  x: number;
  y: number;
  radius: number;
  color: string;
}

interface PlayerEntity extends Entity {
  vx: number;
  vy: number;
  angle: number;
  speed: number;
  hp: number;
  maxHp: number;
  energy: number;
  maxEnergy: number;
  dashCooldown: number;
  isDashing: boolean;
  dashTimer: number;
  shieldActive: boolean;
  shieldTimer: number;
  invulnerableTimer: number;
}

interface Bullet {
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

interface Enemy extends Entity {
  id: number;
  type: "crawler" | "turret" | "swarm" | "titan" | "eater";
  hp: number;
  maxHp: number;
  speed: number;
  damage: number;
  scoreValue: number;
  xpValue: number;
  shootCooldown: number;
  angle: number;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
  alpha: number;
  life: number;
  maxLife: number;
}

interface PickupItem {
  x: number;
  y: number;
  type: "xp" | "hp" | "energy" | "emp";
  value: number;
  radius: number;
  color: string;
  life: number;
}

interface FloatingText {
  x: number;
  y: number;
  text: string;
  color: string;
  alpha: number;
  vy: number;
}

interface Drone {
  angle: number;
  shootCooldown: number;
}

const AVAILABLE_PERKS: Perk[] = [
  {
    id: "tripleShot",
    name: "Splitfire Cannons",
    description: "Fires 3 plasma bolts in a spread formation.",
    icon: "🔥",
    level: 0,
    maxLevel: 3,
  },
  {
    id: "orbitalDrone",
    name: "Orbital Defense Drone",
    description: "Spawns an automated defense drone that fires at nearby enemies.",
    icon: "🛸",
    level: 0,
    maxLevel: 3,
  },
  {
    id: "laserAura",
    name: "Chrono Pulse Aura",
    description: "Emits a pulse field that damages and slows surrounding foes.",
    icon: "⚡",
    level: 0,
    maxLevel: 3,
  },
  {
    id: "vampirism",
    name: "Nanite Vampirism",
    description: "Restores a portion of HP whenever an enemy is vanquished.",
    icon: "🧪",
    level: 0,
    maxLevel: 3,
  },
  {
    id: "timeWarpBoost",
    name: "Tachyon Core",
    description: "Increases Chrono Shift duration and reduces energy cost.",
    icon: "⏳",
    level: 0,
    maxLevel: 3,
  },
  {
    id: "empShockwave",
    name: "EMP Blast Module",
    description: "Dashing triggers an electric shockwave destroying small bullets.",
    icon: "💥",
    level: 0,
    maxLevel: 3,
  },
  {
    id: "critMaster",
    name: "Quantum Overclock",
    description: "Grants a 25% chance for attacks to deliver triple critical damage.",
    icon: "🎯",
    level: 0,
    maxLevel: 3,
  },
];

export default function ChronoshiftOverdriveGame() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // --- GAME STATES ---
  const [gameState, setGameState] = useState<"IDLE" | "PLAYING" | "PAUSED" | "LEVEL_UP" | "GAME_OVER">("IDLE");
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [wave, setWave] = useState(1);
  const [playerLevel, setPlayerLevel] = useState(1);
  const [xp, setXp] = useState(0);
  const [xpToNextLevel, setXpToNextLevel] = useState(100);
  const [health, setHealth] = useState(100);
  const [maxHealth, setMaxHealth] = useState(100);
  const [energy, setEnergy] = useState(100);
  const [maxEnergy, setMaxEnergy] = useState(100);
  const [isChronoActive, setIsChronoActive] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [perkChoices, setPerkChoices] = useState<Perk[]>([]);
  const [activePerks, setActivePerks] = useState<Record<string, number>>({});
  const [enemiesKilled, setEnemiesKilled] = useState(0);
  const [timeSurvived, setTimeSurvived] = useState(0);

  // --- AUDIO SYNTHESIZER ---
  const audioCtxRef = useRef<AudioContext | null>(null);

  const initAudio = () => {
    if (!audioCtxRef.current) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      audioCtxRef.current = new AudioCtx();
    }
    if (audioCtxRef.current.state === "suspended") {
      audioCtxRef.current.resume();
    }
  };

  const playSound = (type: "shoot" | "hit" | "explosion" | "chrono" | "levelup" | "dash") => {
    if (isMuted || !audioCtxRef.current) return;
    try {
      const ctx = audioCtxRef.current;
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      if (type === "shoot") {
        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(440, now);
        osc.frequency.exponentialRampToValueAtTime(110, now + 0.1);
        gain.gain.setValueAtTime(0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
        osc.start(now);
        osc.stop(now + 0.1);
      } else if (type === "hit") {
        osc.type = "square";
        osc.frequency.setValueAtTime(220, now);
        osc.frequency.exponentialRampToValueAtTime(55, now + 0.08);
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.08);
        osc.start(now);
        osc.stop(now + 0.08);
      } else if (type === "explosion") {
        osc.type = "triangle";
        osc.frequency.setValueAtTime(150, now);
        osc.frequency.exponentialRampToValueAtTime(30, now + 0.3);
        gain.gain.setValueAtTime(0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
        osc.start(now);
        osc.stop(now + 0.3);
      } else if (type === "chrono") {
        osc.type = "sine";
        osc.frequency.setValueAtTime(300, now);
        osc.frequency.linearRampToValueAtTime(600, now + 0.4);
        gain.gain.setValueAtTime(0.25, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.4);
        osc.start(now);
        osc.stop(now + 0.4);
      } else if (type === "levelup") {
        osc.type = "sine";
        osc.frequency.setValueAtTime(523.25, now);
        osc.frequency.setValueAtTime(659.25, now + 0.1);
        osc.frequency.setValueAtTime(783.99, now + 0.2);
        gain.gain.setValueAtTime(0.25, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.35);
        osc.start(now);
        osc.stop(now + 0.35);
      } else if (type === "dash") {
        osc.type = "sine";
        osc.frequency.setValueAtTime(800, now);
        osc.frequency.exponentialRampToValueAtTime(200, now + 0.15);
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
        osc.start(now);
        osc.stop(now + 0.15);
      }
    } catch {
      // Audio playback failed safely
    }
  };

  // --- REFS FOR GAME LOOP ---
  const playerRef = useRef<PlayerEntity>({
    x: 400,
    y: 300,
    radius: 18,
    color: "#00f0ff",
    vx: 0,
    vy: 0,
    angle: 0,
    speed: 4.5,
    hp: 100,
    maxHp: 100,
    energy: 100,
    maxEnergy: 100,
    dashCooldown: 0,
    isDashing: false,
    dashTimer: 0,
    shieldActive: false,
    shieldTimer: 0,
    invulnerableTimer: 0,
  });

  const keysRef = useRef<{ [key: string]: boolean }>({});
  const mousePosRef = useRef({ x: 0, y: 0 });
  const isMouseDownRef = useRef(false);
  const bulletsRef = useRef<Bullet[]>([]);
  const enemiesRef = useRef<Enemy[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const pickupsRef = useRef<PickupItem[]>([]);
  const floatingTextsRef = useRef<FloatingText[]>([]);
  const dronesRef = useRef<Drone[]>([]);
  const enemyIdCounter = useRef(0);
  const waveTimerRef = useRef(0);
  const shootTimerRef = useRef(0);
  const auraTimerRef = useRef(0);
  const gameTimeRef = useRef(0);

  // Load high score
  useEffect(() => {
    const savedHighScore = localStorage.getItem("chronoshift_highscore");
    if (savedHighScore) {
      setHighScore(parseInt(savedHighScore, 10));
    }
  }, []);

  // Set up Keyboard & Mouse listeners
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      keysRef.current[e.code] = true;

      if (e.code === "KeyP" || e.code === "Escape") {
        setGameState((prev) => {
          if (prev === "PLAYING") return "PAUSED";
          if (prev === "PAUSED") return "PLAYING";
          return prev;
        });
      }

      if (e.code === "Space" && gameState === "PLAYING") {
        triggerChronoShift();
      }

      if ((e.code === "ShiftLeft" || e.code === "ShiftRight") && gameState === "PLAYING") {
        triggerDash();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      keysRef.current[e.code] = false;
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!canvasRef.current) return;
      const rect = canvasRef.current.getBoundingClientRect();
      mousePosRef.current = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      };
    };

    const handleMouseDown = (e: MouseEvent) => {
      if (e.button === 0) isMouseDownRef.current = true;
      if (e.button === 2) {
        e.preventDefault();
        triggerChronoShift();
      }
    };

    const handleMouseUp = (e: MouseEvent) => {
      if (e.button === 0) isMouseDownRef.current = false;
    };

    const handleContextMenu = (e: MouseEvent) => e.preventDefault();

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mousedown", handleMouseDown);
    window.addEventListener("mouseup", handleMouseUp);
    window.addEventListener("contextmenu", handleContextMenu);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mousedown", handleMouseDown);
      window.removeEventListener("mouseup", handleMouseUp);
      window.removeEventListener("contextmenu", handleContextMenu);
    };
  }, [gameState]);

  // --- ACTIONS ---

  const startGame = () => {
    initAudio();
    playerRef.current = {
      x: canvasRef.current ? canvasRef.current.width / 2 : 400,
      y: canvasRef.current ? canvasRef.current.height / 2 : 300,
      radius: 18,
      color: "#00f0ff",
      vx: 0,
      vy: 0,
      angle: 0,
      speed: 4.8,
      hp: 100,
      maxHp: 100,
      energy: 100,
      maxEnergy: 100,
      dashCooldown: 0,
      isDashing: false,
      dashTimer: 0,
      shieldActive: false,
      shieldTimer: 0,
      invulnerableTimer: 0,
    };

    bulletsRef.current = [];
    enemiesRef.current = [];
    particlesRef.current = [];
    pickupsRef.current = [];
    floatingTextsRef.current = [];
    dronesRef.current = [];
    waveTimerRef.current = 0;
    gameTimeRef.current = 0;

    setScore(0);
    setWave(1);
    setPlayerLevel(1);
    setXp(0);
    setXpToNextLevel(100);
    setHealth(100);
    setMaxHealth(100);
    setEnergy(100);
    setMaxEnergy(100);
    setActivePerks({});
    setEnemiesKilled(0);
    setTimeSurvived(0);
    setIsChronoActive(false);

    setGameState("PLAYING");
  };

  const triggerChronoShift = () => {
    const p = playerRef.current;
    if (p.energy >= 25 && !isChronoActive) {
      p.energy -= 25;
      setIsChronoActive(true);
      playSound("chrono");
      addFloatingText(p.x, p.y - 30, "CHRONO SHIFT!", "#00ffff");
      createExplosion(p.x, p.y, "#00ffff", 30);

      setTimeout(() => {
        setIsChronoActive(false);
      }, 4000 + (activePerks["timeWarpBoost"] || 0) * 1500);
    }
  };

  const triggerDash = () => {
    const p = playerRef.current;
    if (p.dashCooldown <= 0) {
      p.isDashing = true;
      p.dashTimer = 12;
      p.dashCooldown = 60;
      p.invulnerableTimer = 20;
      playSound("dash");

      // EMP perk check
      const empLvl = activePerks["empShockwave"] || 0;
      if (empLvl > 0) {
        createExplosion(p.x, p.y, "#ff00ff", 40 + empLvl * 15);
        // Clear nearby enemy bullets
        bulletsRef.current = bulletsRef.current.filter((b) => {
          if (!b.isEnemy) return true;
          const dist = Math.hypot(b.x - p.x, b.y - p.y);
          return dist > 120 + empLvl * 40;
        });
      }
    }
  };

  const addFloatingText = (x: number, y: number, text: string, color: string) => {
    floatingTextsRef.current.push({
      x,
      y,
      text,
      color,
      alpha: 1,
      vy: -1.5,
    });
  };

  const createExplosion = (x: number, y: number, color: string, count = 15) => {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 1 + Math.random() * 5;
      particlesRef.current.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        radius: 2 + Math.random() * 4,
        color,
        alpha: 1,
        life: 0,
        maxLife: 20 + Math.random() * 20,
      });
    }
  };

  const spawnEnemy = (canvasWidth: number, canvasHeight: number) => {
    const rand = Math.random();
    let type: Enemy["type"] = "crawler";
    let hp = 30 + wave * 5;
    let speed = 2.2 + Math.random() * 0.8;
    let radius = 16;
    let color = "#ff0055";
    let scoreVal = 100;
    let xpVal = 15;

    if (rand > 0.85 && wave >= 3) {
      type = "turret";
      hp = 60 + wave * 10;
      speed = 1.0;
      radius = 22;
      color = "#aa00ff";
      scoreVal = 250;
      xpVal = 35;
    } else if (rand > 0.65) {
      type = "swarm";
      hp = 12 + wave * 2;
      speed = 3.8;
      radius = 10;
      color = "#ffaa00";
      scoreVal = 50;
      xpVal = 8;
    } else if (rand > 0.5 && wave >= 5 && Math.random() > 0.7) {
      type = "titan";
      hp = 250 + wave * 40;
      speed = 0.8;
      radius = 36;
      color = "#ff0000";
      scoreVal = 1000;
      xpVal = 120;
    }

    // Spawn around canvas border
    let x = 0;
    let y = 0;
    if (Math.random() < 0.5) {
      x = Math.random() < 0.5 ? -30 : canvasWidth + 30;
      y = Math.random() * canvasHeight;
    } else {
      x = Math.random() * canvasWidth;
      y = Math.random() < 0.5 ? -30 : canvasHeight + 30;
    }

    enemyIdCounter.current += 1;
    enemiesRef.current.push({
      id: enemyIdCounter.current,
      x,
      y,
      radius,
      color,
      hp,
      maxHp: hp,
      speed,
      damage: type === "titan" ? 30 : type === "swarm" ? 8 : 15,
      scoreValue: scoreVal,
      xpValue: xpVal,
      shootCooldown: 0,
      angle: 0,
      type,
    });
  };

  const handleLevelUp = () => {
    playSound("levelup");
    setGameState("LEVEL_UP");

    // Pick 3 random perks that aren't maxed out
    const available = AVAILABLE_PERKS.filter((p) => {
      const currentLevel = activePerks[p.id] || 0;
      return currentLevel < p.maxLevel;
    });

    const shuffled = [...available].sort(() => 0.5 - Math.random());
    setPerkChoices(shuffled.slice(0, 3));
  };

  const selectPerk = (perkId: string) => {
    setActivePerks((prev) => {
      const nextLvl = (prev[perkId] || 0) + 1;

      // Handle specific perk immediate side effects
      if (perkId === "orbitalDrone") {
        dronesRef.current.push({ angle: 0, shootCooldown: 0 });
      }

      return { ...prev, [perkId]: nextLvl };
    });

    setGameState("PLAYING");
  };

  // --- MAIN CANVAS RENDER & PHYSICS LOOP ---
  useEffect(() => {
    let animationFrameId: number;

    const render = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      // Resize canvas dynamically to match client size
      if (canvas.width !== canvas.clientWidth || canvas.height !== canvas.clientHeight) {
        canvas.width = canvas.clientWidth;
        canvas.height = canvas.clientHeight;
      }

      const width = canvas.width;
      const height = canvas.height;
      const p = playerRef.current;

      // Clear Canvas & Draw Cyberpunk Background
      ctx.fillStyle = "#050716";
      ctx.fillRect(0, 0, width, height);

      // Grid Lines
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

      if (gameState === "PLAYING") {
        gameTimeRef.current += 1 / 60;
        setTimeSurvived(Math.floor(gameTimeRef.current));

        // Time factor for Chrono Shift
        const timeFactor = isChronoActive ? 0.3 : 1.0;

        // --- PLAYER LOGIC ---
        let dx = 0;
        let dy = 0;
        if (keysRef.current["KeyW"] || keysRef.current["ArrowUp"]) dy -= 1;
        if (keysRef.current["KeyS"] || keysRef.current["ArrowDown"]) dy += 1;
        if (keysRef.current["KeyA"] || keysRef.current["ArrowLeft"]) dx -= 1;
        if (keysRef.current["KeyD"] || keysRef.current["ArrowRight"]) dx += 1;

        if (dx !== 0 && dy !== 0) {
          dx *= 0.7071;
          dy *= 0.7071;
        }

        const currentSpeed = p.isDashing ? p.speed * 2.8 : p.speed;
        p.x += dx * currentSpeed;
        p.y += dy * currentSpeed;

        // Constrain player within bounds
        p.x = Math.max(p.radius, Math.min(width - p.radius, p.x));
        p.y = Math.max(p.radius, Math.min(height - p.radius, p.y));

        // Angle towards mouse
        p.angle = Math.atan2(mousePosRef.current.y - p.y, mousePosRef.current.x - p.x);

        // Cooldowns
        if (p.dashCooldown > 0) p.dashCooldown -= 1;
        if (p.invulnerableTimer > 0) p.invulnerableTimer -= 1;
        if (p.isDashing) {
          p.dashTimer -= 1;
          if (p.dashTimer <= 0) p.isDashing = false;
          // Dash particles
          particlesRef.current.push({
            x: p.x,
            y: p.y,
            vx: -dx * 2,
            vy: -dy * 2,
            radius: p.radius * 0.8,
            color: "#00f0ff",
            alpha: 0.6,
            life: 0,
            maxLife: 10,
          });
        }

        // Energy Regeneration
        if (p.energy < p.maxEnergy) {
          p.energy = Math.min(p.maxEnergy, p.energy + 0.12);
          setEnergy(p.energy);
        }

        // --- PLAYER SHOOTING ---
        shootTimerRef.current += 1;
        if (isMouseDownRef.current && shootTimerRef.current >= 10) {
          shootTimerRef.current = 0;
          playSound("shoot");

          const bulletSpeed = 12;
          const tripleLevel = activePerks["tripleShot"] || 0;
          const critLevel = activePerks["critMaster"] || 0;
          const isCrit = Math.random() < critLevel * 0.15;
          const bulletDmg = (25 + (playerLevel - 1) * 3) * (isCrit ? 2.5 : 1.0);

          if (tripleLevel > 0) {
            const spread = 0.2;
            [-spread, 0, spread].forEach((offsetAngle) => {
              const finalAngle = p.angle + offsetAngle;
              bulletsRef.current.push({
                x: p.x + Math.cos(finalAngle) * p.radius,
                y: p.y + Math.sin(finalAngle) * p.radius,
                vx: Math.cos(finalAngle) * bulletSpeed,
                vy: Math.sin(finalAngle) * bulletSpeed,
                radius: isCrit ? 6 : 4,
                color: isCrit ? "#ffff00" : "#00f0ff",
                damage: bulletDmg,
                isEnemy: false,
                pierce: tripleLevel > 1 ? 1 : 0,
                life: 60,
              });
            });
          } else {
            bulletsRef.current.push({
              x: p.x + Math.cos(p.angle) * p.radius,
              y: p.y + Math.sin(p.angle) * p.radius,
              vx: Math.cos(p.angle) * bulletSpeed,
              vy: Math.sin(p.angle) * bulletSpeed,
              radius: isCrit ? 6 : 4,
              color: isCrit ? "#ffff00" : "#00f0ff",
              damage: bulletDmg,
              isEnemy: false,
              pierce: 0,
              life: 60,
            });
          }
        }

        // --- ORBITAL DRONES LOGIC ---
        dronesRef.current.forEach((drone) => {
          drone.angle += 0.04;
          const droneX = p.x + Math.cos(drone.angle) * 50;
          const droneY = p.y + Math.sin(drone.angle) * 50;

          // Drone auto shoot at nearest enemy
          drone.shootCooldown += 1;
          if (drone.shootCooldown >= 25 && enemiesRef.current.length > 0) {
            drone.shootCooldown = 0;
            // Find closest enemy
            let closestEnemy: Enemy | null = null;
            let minDist = Infinity;
            enemiesRef.current.forEach((e) => {
              const d = Math.hypot(e.x - droneX, e.y - droneY);
              if (d < minDist) {
                minDist = d;
                closestEnemy = e;
              }
            });

            if (closestEnemy && minDist < 350) {
              const angle = Math.atan2((closestEnemy as Enemy).y - droneY, (closestEnemy as Enemy).x - droneX);
              bulletsRef.current.push({
                x: droneX,
                y: droneY,
                vx: Math.cos(angle) * 10,
                vy: Math.sin(angle) * 10,
                radius: 3,
                color: "#00ff66",
                damage: 15,
                isEnemy: false,
                pierce: 0,
                life: 45,
              });
            }
          }
        });

        // --- CHRONO PULSE AURA LOGIC ---
        const auraLvl = activePerks["laserAura"] || 0;
        if (auraLvl > 0) {
          auraTimerRef.current += 1;
          if (auraTimerRef.current >= 30) {
            auraTimerRef.current = 0;
            const auraRadius = 80 + auraLvl * 30;
            enemiesRef.current.forEach((enemy) => {
              const dist = Math.hypot(enemy.x - p.x, enemy.y - p.y);
              if (dist <= auraRadius) {
                enemy.hp -= 10 * auraLvl;
                createExplosion(enemy.x, enemy.y, "#00ffff", 4);
              }
            });
          }
        }

        // --- ENEMY SPAWNING ---
        waveTimerRef.current += 1;
        const spawnInterval = Math.max(30, 120 - wave * 8);
        if (waveTimerRef.current % Math.floor(spawnInterval) === 0) {
          spawnEnemy(width, height);
        }

        // Wave increment check
        if (waveTimerRef.current > 1800) {
          waveTimerRef.current = 0;
          setWave((w) => w + 1);
          addFloatingText(width / 2, height / 2 - 50, `WAVE ${wave + 1} START!`, "#ffaa00");
        }

        // --- BULLETS LOGIC ---
        bulletsRef.current.forEach((b) => {
          b.x += b.vx * (b.isEnemy ? timeFactor : 1);
          b.y += b.vy * (b.isEnemy ? timeFactor : 1);
          b.life -= 1;

          // Bullet trail particles
          if (Math.random() < 0.4) {
            particlesRef.current.push({
              x: b.x,
              y: b.y,
              vx: (Math.random() - 0.5) * 0.5,
              vy: (Math.random() - 0.5) * 0.5,
              radius: 1.5,
              color: b.color,
              alpha: 0.5,
              life: 0,
              maxLife: 8,
            });
          }
        });

        // Filter out dead bullets
        bulletsRef.current = bulletsRef.current.filter((b) => {
          return b.life > 0 && b.x >= 0 && b.x <= width && b.y >= 0 && b.y <= height;
        });

        // --- ENEMIES LOGIC ---
        enemiesRef.current.forEach((enemy) => {
          const angleToPlayer = Math.atan2(p.y - enemy.y, p.x - enemy.x);
          enemy.angle = angleToPlayer;

          // Movement
          enemy.x += Math.cos(angleToPlayer) * enemy.speed * timeFactor;
          enemy.y += Math.sin(angleToPlayer) * enemy.speed * timeFactor;

          // Turret & Titan Shooting
          if (enemy.type === "turret" || enemy.type === "titan") {
            enemy.shootCooldown += 1 * timeFactor;
            const cooldownMax = enemy.type === "titan" ? 45 : 90;
            if (enemy.shootCooldown >= cooldownMax) {
              enemy.shootCooldown = 0;
              const bulletSpeed = enemy.type === "titan" ? 7 : 5;

              if (enemy.type === "titan") {
                // Titan spiral pattern
                for (let i = 0; i < 5; i++) {
                  const spiralAngle = angleToPlayer + (i - 2) * 0.25;
                  bulletsRef.current.push({
                    x: enemy.x,
                    y: enemy.y,
                    vx: Math.cos(spiralAngle) * bulletSpeed,
                    vy: Math.sin(spiralAngle) * bulletSpeed,
                    radius: 6,
                    color: "#ff0055",
                    damage: 18,
                    isEnemy: true,
                    pierce: 0,
                    life: 180,
                  });
                }
              } else {
                bulletsRef.current.push({
                  x: enemy.x,
                  y: enemy.y,
                  vx: Math.cos(angleToPlayer) * bulletSpeed,
                  vy: Math.sin(angleToPlayer) * bulletSpeed,
                  radius: 5,
                  color: "#aa00ff",
                  damage: 12,
                  isEnemy: true,
                  pierce: 0,
                  life: 150,
                });
              }
            }
          }

          // Player Collision
          const distToPlayer = Math.hypot(enemy.x - p.x, enemy.y - p.y);
          if (distToPlayer < enemy.radius + p.radius && p.invulnerableTimer <= 0) {
            playSound("hit");
            p.hp -= enemy.damage;
            p.invulnerableTimer = 30; // 0.5s invulnerability
            setHealth(Math.max(0, p.hp));
            createExplosion(p.x, p.y, "#ff0000", 15);
            addFloatingText(p.x, p.y - 20, `-${enemy.damage}`, "#ff0055");

            if (p.hp <= 0) {
              playSound("explosion");
              setGameState("GAME_OVER");
              if (score > highScore) {
                setHighScore(score);
                localStorage.setItem("chronoshift_highscore", score.toString());
              }
            }
          }
        });

        // --- BULLET - ENEMY COLLISIONS ---
        bulletsRef.current.forEach((b) => {
          if (b.isEnemy) {
            // Check collision with player
            const dist = Math.hypot(b.x - p.x, b.y - p.y);
            if (dist < b.radius + p.radius && p.invulnerableTimer <= 0) {
              b.life = 0;
              playSound("hit");
              p.hp -= b.damage;
              p.invulnerableTimer = 25;
              setHealth(Math.max(0, p.hp));
              addFloatingText(p.x, p.y - 20, `-${b.damage}`, "#ff0055");
              createExplosion(p.x, p.y, "#ff0000", 10);

              if (p.hp <= 0) {
                playSound("explosion");
                setGameState("GAME_OVER");
                if (score > highScore) {
                  setHighScore(score);
                  localStorage.setItem("chronoshift_highscore", score.toString());
                }
              }
            }
          } else {
            // Check collision with enemies
            enemiesRef.current.forEach((enemy) => {
              const dist = Math.hypot(b.x - enemy.x, b.y - enemy.y);
              if (dist < b.radius + enemy.radius && enemy.hp > 0) {
                enemy.hp -= b.damage;
                b.pierce -= 1;
                if (b.pierce < 0) b.life = 0;

                addFloatingText(enemy.x, enemy.y - 15, `${Math.round(b.damage)}`, b.color);
                createExplosion(b.x, b.y, b.color, 4);

                // Enemy vanquished
                if (enemy.hp <= 0) {
                  playSound("explosion");
                  createExplosion(enemy.x, enemy.y, enemy.color, 25);
                  setScore((s) => s + enemy.scoreValue);
                  setEnemiesKilled((k) => k + 1);

                  // Vampirism Perk check
                  const vampLvl = activePerks["vampirism"] || 0;
                  if (vampLvl > 0 && Math.random() < 0.2) {
                    const healAmount = 5 * vampLvl;
                    p.hp = Math.min(p.maxHp, p.hp + healAmount);
                    setHealth(p.hp);
                    addFloatingText(p.x, p.y - 25, `+${healAmount} HP`, "#00ff66");
                  }

                  // Spawn Pickups (XP Shards, Health/Energy)
                  pickupsRef.current.push({
                    x: enemy.x,
                    y: enemy.y,
                    type: "xp",
                    value: enemy.xpValue,
                    radius: 6,
                    color: "#00f0ff",
                    life: 600,
                  });

                  if (Math.random() < 0.15) {
                    pickupsRef.current.push({
                      x: enemy.x + (Math.random() - 0.5) * 20,
                      y: enemy.y + (Math.random() - 0.5) * 20,
                      type: Math.random() < 0.5 ? "hp" : "energy",
                      value: 20,
                      radius: 8,
                      color: Math.random() < 0.5 ? "#00ff66" : "#ff00ff",
                      life: 600,
                    });
                  }
                }
              }
            });
          }
        });

        // Filter out defeated enemies
        enemiesRef.current = enemiesRef.current.filter((e) => e.hp > 0);

        // --- PICKUPS LOGIC ---
        pickupsRef.current.forEach((item) => {
          item.life -= 1;

          // Magnet effect towards player
          const dist = Math.hypot(p.x - item.x, p.y - item.y);
          if (dist < 140) {
            const angle = Math.atan2(p.y - item.y, p.x - item.x);
            item.x += Math.cos(angle) * 6;
            item.y += Math.sin(angle) * 6;
          }

          if (dist < item.radius + p.radius) {
            item.life = 0;
            if (item.type === "xp") {
              setXp((currXp) => {
                const newXp = currXp + item.value;
                if (newXp >= xpToNextLevel) {
                  const overflow = newXp - xpToNextLevel;
                  setPlayerLevel((lvl) => lvl + 1);
                  setXpToNextLevel((prev) => Math.floor(prev * 1.35));
                  handleLevelUp();
                  return overflow;
                }
                return newXp;
              });
            } else if (item.type === "hp") {
              p.hp = Math.min(p.maxHp, p.hp + item.value);
              setHealth(p.hp);
              addFloatingText(p.x, p.y - 20, "+20 HP", "#00ff66");
            } else if (item.type === "energy") {
              p.energy = Math.min(p.maxEnergy, p.energy + item.value);
              setEnergy(p.energy);
              addFloatingText(p.x, p.y - 20, "+20 ENERGY", "#ff00ff");
            }
          }
        });

        pickupsRef.current = pickupsRef.current.filter((i) => i.life > 0);

        // --- PARTICLES LOGIC ---
        particlesRef.current.forEach((part) => {
          part.x += part.vx;
          part.y += part.vy;
          part.life += 1;
          part.alpha = 1 - part.life / part.maxLife;
        });
        particlesRef.current = particlesRef.current.filter((p) => p.life < p.maxLife);

        // --- FLOATING TEXT LOGIC ---
        floatingTextsRef.current.forEach((ft) => {
          ft.y += ft.vy;
          ft.alpha -= 0.02;
        });
        floatingTextsRef.current = floatingTextsRef.current.filter((ft) => ft.alpha > 0);
      }

      // --- RENDERING CANVAS OBJECTS ---

      // Draw Pickups
      pickupsRef.current.forEach((item) => {
        ctx.save();
        ctx.shadowBlur = 10;
        ctx.shadowColor = item.color;
        ctx.fillStyle = item.color;
        ctx.beginPath();
        ctx.arc(item.x, item.y, item.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });

      // Draw Enemies
      enemiesRef.current.forEach((enemy) => {
        ctx.save();
        ctx.translate(enemy.x, enemy.y);
        ctx.rotate(enemy.angle);
        ctx.shadowBlur = 12;
        ctx.shadowColor = enemy.color;

        // Enemy shape based on type
        ctx.fillStyle = enemy.color;
        if (enemy.type === "crawler") {
          ctx.beginPath();
          ctx.moveTo(enemy.radius, 0);
          ctx.lineTo(-enemy.radius, -enemy.radius * 0.7);
          ctx.lineTo(-enemy.radius * 0.4, 0);
          ctx.lineTo(-enemy.radius, enemy.radius * 0.7);
          ctx.closePath();
          ctx.fill();
        } else if (enemy.type === "turret") {
          ctx.beginPath();
          ctx.arc(0, 0, enemy.radius, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = "#ffffff";
          ctx.fillRect(0, -4, enemy.radius + 6, 8);
        } else if (enemy.type === "swarm") {
          ctx.beginPath();
          ctx.moveTo(enemy.radius, 0);
          ctx.lineTo(-enemy.radius, -enemy.radius);
          ctx.lineTo(-enemy.radius, enemy.radius);
          ctx.closePath();
          ctx.fill();
        } else if (enemy.type === "titan") {
          // Boss Titan shape
          ctx.beginPath();
          ctx.arc(0, 0, enemy.radius, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = "#ffffff";
          ctx.lineWidth = 3;
          ctx.strokeRect(-enemy.radius * 0.5, -enemy.radius * 0.5, enemy.radius, enemy.radius);
        }
        ctx.restore();

        // Enemy Health Bar
        if (enemy.hp < enemy.maxHp) {
          const barW = enemy.radius * 2;
          const barH = 4;
          const pct = Math.max(0, enemy.hp / enemy.maxHp);
          ctx.fillStyle = "rgba(0,0,0,0.5)";
          ctx.fillRect(enemy.x - enemy.radius, enemy.y - enemy.radius - 10, barW, barH);
          ctx.fillStyle = enemy.color;
          ctx.fillRect(enemy.x - enemy.radius, enemy.y - enemy.radius - 10, barW * pct, barH);
        }
      });

      // Draw Drones
      dronesRef.current.forEach((drone) => {
        const droneX = p.x + Math.cos(drone.angle) * 50;
        const droneY = p.y + Math.sin(drone.angle) * 50;
        ctx.save();
        ctx.shadowBlur = 10;
        ctx.shadowColor = "#00ff66";
        ctx.fillStyle = "#00ff66";
        ctx.beginPath();
        ctx.arc(droneX, droneY, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });

      // Draw Chrono Pulse Aura
      const auraLvl = activePerks["laserAura"] || 0;
      if (auraLvl > 0 && gameState === "PLAYING") {
        ctx.save();
        ctx.strokeStyle = "rgba(0, 255, 255, 0.15)";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 80 + auraLvl * 30, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }

      // Draw Bullets
      bulletsRef.current.forEach((b) => {
        ctx.save();
        ctx.shadowBlur = 8;
        ctx.shadowColor = b.color;
        ctx.fillStyle = b.color;
        ctx.beginPath();
        ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });

      // Draw Particles
      particlesRef.current.forEach((part) => {
        ctx.save();
        ctx.globalAlpha = part.alpha;
        ctx.fillStyle = part.color;
        ctx.beginPath();
        ctx.arc(part.x, part.y, part.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });

      // Draw Player
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.angle);
      ctx.shadowBlur = p.isDashing ? 25 : 15;
      ctx.shadowColor = p.color;

      // Invulnerable flash
      if (p.invulnerableTimer % 4 < 2) {
        // Mech Body
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.moveTo(p.radius + 4, 0);
        ctx.lineTo(-p.radius, -p.radius * 0.8);
        ctx.lineTo(-p.radius * 0.5, 0);
        ctx.lineTo(-p.radius, p.radius * 0.8);
        ctx.closePath();
        ctx.fill();

        // Cockpit Core
        ctx.fillStyle = "#ffffff";
        ctx.beginPath();
        ctx.arc(2, 0, 5, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();

      // Draw Floating Damage / Notification Text
      floatingTextsRef.current.forEach((ft) => {
        ctx.save();
        ctx.globalAlpha = ft.alpha;
        ctx.fillStyle = ft.color;
        ctx.font = "bold 13px system-ui, sans-serif";
        ctx.fillText(ft.text, ft.x, ft.y);
        ctx.restore();
      });

      // Draw Chrono Shift Overlay Ripple
      if (isChronoActive) {
        ctx.save();
        ctx.strokeStyle = "rgba(0, 240, 255, 0.3)";
        ctx.lineWidth = 8;
        ctx.strokeRect(0, 0, width, height);
        ctx.restore();
      }

      animationFrameId = requestAnimationFrame(render);
    };

    animationFrameId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animationFrameId);
  }, [gameState, isChronoActive, wave, activePerks, playerLevel, xpToNextLevel, score, highScore]);

  return (
    <div className="relative w-full h-screen bg-slate-950 text-white select-none overflow-hidden font-sans">
      {/* CANVAS ELEMENT */}
      <canvas ref={canvasRef} className="w-full h-full block cursor-crosshair" />

      {/* --- HUD OVERLAY --- */}
      {gameState !== "IDLE" && (
        <div className="absolute top-0 left-0 w-full p-4 pointer-events-none flex justify-between items-start z-10">
          {/* LEFT HUD: HEALTH, ENERGY, XP */}
          <div className="flex flex-col gap-2 w-64 bg-slate-900/80 backdrop-blur-md p-3 rounded-xl border border-slate-700/50 shadow-2xl">
            {/* Health Bar */}
            <div>
              <div className="flex justify-between text-xs font-semibold mb-1 text-slate-300">
                <span className="flex items-center gap-1">
                  <Activity className="w-3.5 h-3.5 text-red-500" /> HULL INTEGRITY
                </span>
                <span>
                  {Math.round(health)} / {maxHealth}
                </span>
              </div>
              <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden border border-slate-700">
                <div
                  className="h-full bg-gradient-to-r from-red-600 to-emerald-400 transition-all duration-200"
                  style={{ width: `${(health / maxHealth) * 100}%` }}
                />
              </div>
            </div>

            {/* Chrono Energy Bar */}
            <div>
              <div className="flex justify-between text-xs font-semibold mb-1 text-slate-300">
                <span className="flex items-center gap-1 text-cyan-400">
                  <Clock className="w-3.5 h-3.5" /> CHRONO MATRIX
                </span>
                <span>{Math.round(energy)}%</span>
              </div>
              <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden border border-slate-700">
                <div
                  className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 transition-all duration-200"
                  style={{ width: `${(energy / maxEnergy) * 100}%` }}
                />
              </div>
            </div>

            {/* Level & XP Bar */}
            <div>
              <div className="flex justify-between text-xs font-semibold mb-1 text-slate-300">
                <span className="flex items-center gap-1 text-purple-400">
                  <Sparkles className="w-3.5 h-3.5" /> LEVEL {playerLevel}
                </span>
                <span>
                  {xp} / {xpToNextLevel} XP
                </span>
              </div>
              <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden border border-slate-700">
                <div
                  className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-200"
                  style={{ width: `${(xp / xpToNextLevel) * 100}%` }}
                />
              </div>
            </div>
          </div>

          {/* CENTER HUD: WAVE & TIME */}
          <div className="flex flex-col items-center bg-slate-900/80 backdrop-blur-md px-6 py-2 rounded-xl border border-slate-700/50 shadow-2xl">
            <span className="text-xs uppercase tracking-widest text-cyan-400 font-bold">WAVE</span>
            <span className="text-2xl font-black text-white">{wave}</span>
            <span className="text-[10px] text-slate-400 mt-0.5">{timeSurvived}s SURVIVED</span>
          </div>

          {/* RIGHT HUD: SCORE, CONTROLS & MUTETOGGLE */}
          <div className="flex flex-col items-end gap-2 pointer-events-auto">
            <div className="bg-slate-900/80 backdrop-blur-md p-3 rounded-xl border border-slate-700/50 shadow-2xl text-right">
              <div className="text-xs font-semibold text-slate-400">SCORE</div>
              <div className="text-xl font-bold text-cyan-400 tracking-wider">{score.toLocaleString()}</div>
              <div className="text-[10px] text-slate-500 mt-1">BEST: {highScore.toLocaleString()}</div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setIsMuted(!isMuted)}
                className="p-2.5 bg-slate-800/90 hover:bg-slate-700 rounded-lg border border-slate-700 text-slate-300 transition-all"
                title="Toggle Mute"
              >
                {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </button>
              <button
                onClick={() => setGameState(gameState === "PLAYING" ? "PAUSED" : "PLAYING")}
                className="p-2.5 bg-slate-800/90 hover:bg-slate-700 rounded-lg border border-slate-700 text-slate-300 transition-all"
                title="Pause Game"
              >
                {gameState === "PLAYING" ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- START MENU --- */}
      {gameState === "IDLE" && (
        <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-lg flex items-center justify-center p-6 z-20">
          <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl text-center relative overflow-hidden">
            <div className="absolute -top-24 -left-24 w-48 h-48 bg-cyan-500/20 rounded-full blur-3xl" />
            <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-purple-500/20 rounded-full blur-3xl" />

            <div className="inline-flex items-center justify-center p-3 bg-cyan-500/10 rounded-2xl border border-cyan-500/20 mb-4 text-cyan-400">
              <Clock className="w-10 h-10 animate-pulse" />
            </div>

            <h1 className="text-3xl font-black tracking-tight text-white mb-2">CHRONOSHIFT OVERDRIVE</h1>
            <p className="text-sm text-slate-400 mb-6">
              A high-octane 2D cyberpunk survival shooter. Slow down time, upgrade your mech arsenal, and conquer rogue AI armadas.
            </p>

            <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 mb-6 text-left space-y-2 text-xs text-slate-300">
              <div className="flex justify-between items-center">
                <span className="font-semibold text-slate-400">WASD / Arrow Keys</span>
                <span>Move Mech</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-semibold text-slate-400">Mouse Aim & Left Click</span>
                <span>Aim & Shoot</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-semibold text-cyan-400">Space / Right Click</span>
                <span>Chrono Shift (Time Slow)</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-semibold text-purple-400">Left Shift</span>
                <span>Cyber Dash</span>
              </div>
            </div>

            <button
              onClick={startGame}
              className="w-full py-3.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold rounded-xl shadow-lg shadow-cyan-500/25 transition-all flex items-center justify-center gap-2 group cursor-pointer"
            >
              <Play className="w-5 h-5 fill-current group-hover:scale-110 transition-transform" />
              DEPLOY MECH
            </button>
          </div>
        </div>
      )}

      {/* --- LEVEL UP SELECTION MODAL --- */}
      {gameState === "LEVEL_UP" && (
        <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-6 z-30">
          <div className="max-w-lg w-full bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl text-center">
            <div className="inline-flex items-center justify-center p-3 bg-purple-500/10 rounded-2xl border border-purple-500/20 mb-3 text-purple-400">
              <Sparkles className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-1">SYSTEM OVERCLOCK!</h2>
            <p className="text-xs text-slate-400 mb-6">Select a perk upgrade to enhance your combat capabilities:</p>

            <div className="grid gap-3 mb-2">
              {perkChoices.map((perk) => (
                <button
                  key={perk.id}
                  onClick={() => selectPerk(perk.id)}
                  className="flex items-center gap-4 p-4 bg-slate-950 hover:bg-slate-800/80 border border-slate-800 hover:border-cyan-500/50 rounded-xl text-left transition-all group cursor-pointer"
                >
                  <span className="text-3xl p-2 bg-slate-900 rounded-lg group-hover:scale-110 transition-transform">
                    {perk.icon}
                  </span>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-sm text-white group-hover:text-cyan-400 transition-colors">
                        {perk.name}
                      </h3>
                      <span className="text-[10px] bg-slate-800 px-2 py-0.5 rounded text-slate-400 font-mono">
                        LVL {(activePerks[perk.id] || 0) + 1} / {perk.maxLevel}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-1">{perk.description}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* --- PAUSE MENU --- */}
      {gameState === "PAUSED" && (
        <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-6 z-30">
          <div className="max-w-sm w-full bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl text-center">
            <h2 className="text-xl font-bold text-white mb-4">GAME PAUSED</h2>
            <div className="space-y-3">
              <button
                onClick={() => setGameState("PLAYING")}
                className="w-full py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white font-semibold rounded-lg transition-all"
              >
                RESUME
              </button>
              <button
                onClick={startGame}
                className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-lg transition-all"
              >
                RESTART MISSION
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- GAME OVER SCREEN --- */}
      {gameState === "GAME_OVER" && (
        <div className="absolute inset-0 bg-slate-950/95 backdrop-blur-lg flex items-center justify-center p-6 z-30">
          <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl text-center">
            <div className="inline-flex items-center justify-center p-3 bg-red-500/10 rounded-2xl border border-red-500/20 mb-4 text-red-500">
              <Flame className="w-10 h-10" />
            </div>
            <h2 className="text-3xl font-black text-white mb-1">MECH DESTROYED</h2>
            <p className="text-xs text-slate-400 mb-6">Your system integrity has failed under enemy pressure.</p>

            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 mb-6 grid grid-cols-2 gap-4 text-left">
              <div>
                <span className="text-[10px] text-slate-500 block">FINAL SCORE</span>
                <span className="text-xl font-bold text-cyan-400">{score.toLocaleString()}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 block">BEST SCORE</span>
                <span className="text-xl font-bold text-purple-400">{highScore.toLocaleString()}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 block">WAVE REACHED</span>
                <span className="text-base font-semibold text-white">{wave}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 block">ENEMIES DEFEATED</span>
                <span className="text-base font-semibold text-white">{enemiesKilled}</span>
              </div>
            </div>

            <button
              onClick={startGame}
              className="w-full py-3.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold rounded-xl shadow-lg shadow-cyan-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <RotateCcw className="w-5 h-5" /> RE-DEPLOY MECH
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
