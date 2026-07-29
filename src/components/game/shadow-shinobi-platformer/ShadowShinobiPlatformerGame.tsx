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
  Award,
  ChevronLeft,
  ChevronRight,
  ArrowUp,
  Crosshair,
  Flame,
} from "lucide-react";

// --- TYPES ---
interface LevelData {
  id: number;
  name: string;
  width: number;
  height: number;
  spawn: { x: number; y: number };
  goal: { x: number; y: number; w: number; h: number };
  platforms: { x: number; y: number; w: number; h: number; type?: "normal" | "moving" | "crumbling" | "wall"; vx?: number }[];
  hazards: { x: number; y: number; w: number; h: number; type: "spikes" | "laser" }[];
  enemies: { x: number; y: number; patrolMin: number; patrolMax: number; hp: number; maxHp: number; type: "ninja" | "drone" }[];
  scrolls: { x: number; y: number; collected: boolean }[];
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

interface Projectile {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
  isEnemy: boolean;
  life: number;
}

const LEVELS: LevelData[] = [
  {
    id: 1,
    name: "Neon Roofs",
    width: 2400,
    height: 600,
    spawn: { x: 80, y: 450 },
    goal: { x: 2280, y: 200, w: 40, h: 60 },
    platforms: [
      { x: 0, y: 520, w: 400, h: 80 },
      { x: 480, y: 460, w: 220, h: 30 },
      { x: 780, y: 400, w: 200, h: 30 },
      { x: 1060, y: 340, w: 240, h: 30, type: "moving", vx: 2 },
      { x: 1380, y: 420, w: 180, h: 30 },
      { x: 1640, y: 350, w: 200, h: 30 },
      { x: 1920, y: 280, w: 160, h: 30 },
      { x: 2160, y: 260, w: 240, h: 100 },
      // Wall jump pillars
      { x: 700, y: 150, w: 30, h: 250, type: "wall" },
      { x: 1580, y: 100, w: 30, h: 250, type: "wall" },
    ],
    hazards: [
      { x: 400, y: 570, w: 80, h: 30, type: "spikes" },
      { x: 700, y: 570, w: 80, h: 30, type: "spikes" },
      { x: 1000, y: 570, w: 380, h: 30, type: "spikes" },
    ],
    enemies: [
      { x: 550, y: 420, patrolMin: 490, patrolMax: 660, hp: 30, maxHp: 30, type: "ninja" },
      { x: 1420, y: 380, patrolMin: 1390, patrolMax: 1520, hp: 30, maxHp: 30, type: "ninja" },
      { x: 1700, y: 310, patrolMin: 1650, patrolMax: 1800, hp: 20, maxHp: 20, type: "drone" },
    ],
    scrolls: [
      { x: 550, y: 420, collected: false },
      { x: 880, y: 350, collected: false },
      { x: 1740, y: 300, collected: false },
    ],
  },
  {
    id: 2,
    name: "Shadow Citadel",
    width: 2800,
    height: 700,
    spawn: { x: 100, y: 550 },
    goal: { x: 2650, y: 150, w: 40, h: 60 },
    platforms: [
      { x: 0, y: 620, w: 350, h: 80 },
      { x: 420, y: 540, w: 180, h: 30 },
      { x: 680, y: 470, w: 160, h: 30, type: "crumbling" },
      { x: 920, y: 400, w: 200, h: 30 },
      { x: 1200, y: 340, w: 200, h: 30, type: "moving", vx: 3 },
      { x: 1500, y: 420, w: 180, h: 30 },
      { x: 1760, y: 340, w: 160, h: 30 },
      { x: 2000, y: 260, w: 220, h: 30 },
      { x: 2300, y: 200, w: 180, h: 30 },
      { x: 2550, y: 210, w: 250, h: 100 },
      // Walls
      { x: 1140, y: 100, w: 30, h: 300, type: "wall" },
      { x: 1940, y: 50, w: 30, h: 300, type: "wall" },
    ],
    hazards: [
      { x: 350, y: 670, w: 2200, h: 30, type: "spikes" },
      { x: 950, y: 380, w: 40, h: 20, type: "spikes" },
      { x: 2050, y: 240, w: 40, h: 20, type: "spikes" },
    ],
    enemies: [
      { x: 980, y: 360, patrolMin: 930, patrolMax: 1080, hp: 40, maxHp: 40, type: "ninja" },
      { x: 1540, y: 380, patrolMin: 1510, patrolMax: 1640, hp: 40, maxHp: 40, type: "ninja" },
      { x: 2040, y: 220, patrolMin: 2010, patrolMax: 2180, hp: 30, maxHp: 30, type: "drone" },
    ],
    scrolls: [
      { x: 710, y: 420, collected: false },
      { x: 1260, y: 290, collected: false },
      { x: 2080, y: 210, collected: false },
    ],
  },
];

export default function ShadowShinobiPlatformerGame() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Game States
  const [gameState, setGameState] = useState<"IDLE" | "PLAYING" | "PAUSED" | "LEVEL_CLEAR" | "GAME_OVER">("IDLE");
  const [currentLevelIdx, setCurrentLevelIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [health, setHealth] = useState(100);
  const [maxHealth] = useState(100);
  const [stamina, setStamina] = useState(100);
  const [scrollsCollected, setScrollsCollected] = useState(0);
  const [totalScrolls, setTotalScrolls] = useState(3);
  const [isMuted, setIsMuted] = useState(false);

  // Touch / Mobile Input State
  const [mobileControls, setMobileControls] = useState({ left: false, right: false, jump: false, slash: false, dash: false, shuriken: false });

  // Web Audio Synth
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

  const playSound = (type: "jump" | "slash" | "shuriken" | "dash" | "hit" | "item" | "clear") => {
    if (isMuted || !audioCtxRef.current) return;
    try {
      const ctx = audioCtxRef.current;
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      if (type === "jump") {
        osc.type = "sine";
        osc.frequency.setValueAtTime(250, now);
        osc.frequency.exponentialRampToValueAtTime(500, now + 0.12);
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.12);
        osc.start(now);
        osc.stop(now + 0.12);
      } else if (type === "slash") {
        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(600, now);
        osc.frequency.exponentialRampToValueAtTime(150, now + 0.08);
        gain.gain.setValueAtTime(0.25, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.08);
        osc.start(now);
        osc.stop(now + 0.08);
      } else if (type === "shuriken") {
        osc.type = "triangle";
        osc.frequency.setValueAtTime(800, now);
        osc.frequency.exponentialRampToValueAtTime(300, now + 0.06);
        gain.gain.setValueAtTime(0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.06);
        osc.start(now);
        osc.stop(now + 0.06);
      } else if (type === "dash") {
        osc.type = "sine";
        osc.frequency.setValueAtTime(450, now);
        osc.frequency.linearRampToValueAtTime(150, now + 0.15);
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
        osc.start(now);
        osc.stop(now + 0.15);
      } else if (type === "hit") {
        osc.type = "square";
        osc.frequency.setValueAtTime(180, now);
        osc.frequency.exponentialRampToValueAtTime(40, now + 0.1);
        gain.gain.setValueAtTime(0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
        osc.start(now);
        osc.stop(now + 0.1);
      } else if (type === "item") {
        osc.type = "sine";
        osc.frequency.setValueAtTime(523, now);
        osc.frequency.setValueAtTime(659, now + 0.08);
        osc.frequency.setValueAtTime(783, now + 0.16);
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);
        osc.start(now);
        osc.stop(now + 0.25);
      } else if (type === "clear") {
        osc.type = "triangle";
        osc.frequency.setValueAtTime(440, now);
        osc.frequency.setValueAtTime(554, now + 0.12);
        osc.frequency.setValueAtTime(659, now + 0.24);
        osc.frequency.setValueAtTime(880, now + 0.36);
        gain.gain.setValueAtTime(0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.5);
        osc.start(now);
        osc.stop(now + 0.5);
      }
    } catch {
      // Audio fallback
    }
  };

  // --- REFS ---
  const playerRef = useRef({
    x: 80,
    y: 450,
    w: 24,
    h: 38,
    vx: 0,
    vy: 0,
    speed: 5,
    jumpPower: 11.5,
    grounded: false,
    wallSliding: false,
    wallDir: 0,
    facing: 1, // 1 right, -1 left
    isDashing: false,
    dashTimer: 0,
    dashCooldown: 0,
    isSlashing: false,
    slashTimer: 0,
    slashCooldown: 0,
    shurikenCooldown: 0,
    invulnerableTimer: 0,
    hp: 100,
    stamina: 100,
    doubleJumpAvailable: true,
  });

  const keysRef = useRef<{ [key: string]: boolean }>({});
  const particlesRef = useRef<Particle[]>([]);
  const projectilesRef = useRef<Projectile[]>([]);
  const cameraXRef = useRef(0);
  const activeLevelRef = useRef<LevelData>(JSON.parse(JSON.stringify(LEVELS[0])));

  // Controls Event Listeners
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      keysRef.current[e.code] = true;
      if (e.code === "KeyP" || e.code === "Escape") {
        setGameState((prev) => (prev === "PLAYING" ? "PAUSED" : prev === "PAUSED" ? "PLAYING" : prev));
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
  }, []);

  const loadLevel = (levelIdx: number) => {
    initAudio();
    const lvl = JSON.parse(JSON.stringify(LEVELS[levelIdx]));
    activeLevelRef.current = lvl;
    setCurrentLevelIdx(levelIdx);

    const p = playerRef.current;
    p.x = lvl.spawn.x;
    p.y = lvl.spawn.y;
    p.vx = 0;
    p.vy = 0;
    p.hp = 100;
    p.stamina = 100;
    p.invulnerableTimer = 0;

    setHealth(100);
    setStamina(100);
    setScrollsCollected(0);
    setTotalScrolls(lvl.scrolls.length);
    particlesRef.current = [];
    projectilesRef.current = [];

    setGameState("PLAYING");
  };

  const createParticles = (x: number, y: number, color: string, count = 10) => {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 1 + Math.random() * 4;
      particlesRef.current.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        radius: 2 + Math.random() * 3,
        color,
        alpha: 1,
        life: 0,
        maxLife: 15 + Math.random() * 15,
      });
    }
  };

  // --- GAME LOOP ---
  useEffect(() => {
    let animId: number;

    const loop = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      if (canvas.width !== canvas.clientWidth || canvas.height !== canvas.clientHeight) {
        canvas.width = canvas.clientWidth;
        canvas.height = canvas.clientHeight;
      }

      const viewW = canvas.width;
      const viewH = canvas.height;
      const p = playerRef.current;
      const lvl = activeLevelRef.current;

      if (gameState === "PLAYING") {
        const gravity = 0.55;

        // Combine Keyboard & Mobile inputs
        const moveLeft = keysRef.current["KeyA"] || keysRef.current["ArrowLeft"] || mobileControls.left;
        const moveRight = keysRef.current["KeyD"] || keysRef.current["ArrowRight"] || mobileControls.right;
        const jumpPressed = keysRef.current["KeyW"] || keysRef.current["Space"] || keysRef.current["ArrowUp"] || mobileControls.jump;
        const slashPressed = keysRef.current["KeyJ"] || keysRef.current["KeyZ"] || mobileControls.slash;
        const dashPressed = keysRef.current["KeyK"] || keysRef.current["ShiftLeft"] || mobileControls.dash;
        const shurikenPressed = keysRef.current["KeyL"] || keysRef.current["KeyX"] || mobileControls.shuriken;

        // Horizontal movement
        if (dashPressed && p.dashCooldown <= 0 && p.stamina >= 25) {
          p.isDashing = true;
          p.dashTimer = 10;
          p.dashCooldown = 40;
          p.stamina -= 25;
          p.invulnerableTimer = 15;
          playSound("dash");
          createParticles(p.x + p.w / 2, p.y + p.h / 2, "#ff00ff", 12);
        }

        if (p.isDashing) {
          p.vx = p.facing * p.speed * 2.5;
          p.vy = 0;
          p.dashTimer -= 1;
          if (p.dashTimer <= 0) p.isDashing = false;
        } else {
          if (moveLeft) {
            p.vx = -p.speed;
            p.facing = -1;
          } else if (moveRight) {
            p.vx = p.speed;
            p.facing = 1;
          } else {
            p.vx *= 0.75;
          }
        }

        if (p.dashCooldown > 0) p.dashCooldown -= 1;
        if (p.invulnerableTimer > 0) p.invulnerableTimer -= 1;
        if (p.stamina < 100) {
          p.stamina = Math.min(100, p.stamina + 0.4);
          setStamina(p.stamina);
        }

        // Katana Slash
        if (slashPressed && p.slashCooldown <= 0) {
          p.isSlashing = true;
          p.slashTimer = 12;
          p.slashCooldown = 22;
          playSound("slash");

          // Hit detection box in front of player
          const slashBox = {
            x: p.facing === 1 ? p.x + p.w : p.x - 45,
            y: p.y - 10,
            w: 45,
            h: p.h + 20,
          };

          lvl.enemies.forEach((enemy) => {
            if (
              enemy.hp > 0 &&
              slashBox.x < enemy.x + 30 &&
              slashBox.x + slashBox.w > enemy.x - 15 &&
              slashBox.y < enemy.y + 35 &&
              slashBox.y + slashBox.h > enemy.y - 15
            ) {
              enemy.hp -= 25;
              playSound("hit");
              createParticles(enemy.x, enemy.y, "#ff0055", 15);
              if (enemy.hp <= 0) {
                setScore((s) => s + 200);
              }
            }
          });
        }
        if (p.slashTimer > 0) p.slashTimer -= 1;
        if (p.slashTimer <= 0) p.isSlashing = false;
        if (p.slashCooldown > 0) p.slashCooldown -= 1;

        // Shuriken Throw
        if (shurikenPressed && p.shurikenCooldown <= 0 && p.stamina >= 15) {
          p.shurikenCooldown = 20;
          p.stamina -= 15;
          playSound("shuriken");
          projectilesRef.current.push({
            x: p.facing === 1 ? p.x + p.w + 5 : p.x - 10,
            y: p.y + p.h / 2,
            vx: p.facing * 12,
            vy: 0,
            radius: 5,
            color: "#00ffff",
            isEnemy: false,
            life: 50,
          });
        }
        if (p.shurikenCooldown > 0) p.shurikenCooldown -= 1;

        // Gravity & Jump
        if (!p.isDashing) {
          p.vy += gravity;
        }

        // Platform collisions
        p.grounded = false;
        p.wallSliding = false;

        // Update moving platforms
        lvl.platforms.forEach((plat) => {
          if (plat.type === "moving" && plat.vx) {
            plat.x += plat.vx;
            if (plat.x < 800 || plat.x > 1400) plat.vx *= -1;
          }
        });

        // X collision
        p.x += p.vx;
        lvl.platforms.forEach((plat) => {
          if (p.x < plat.x + plat.w && p.x + p.w > plat.x && p.y < plat.y + plat.h && p.y + p.h > plat.y) {
            if (plat.type === "wall") {
              p.wallSliding = true;
              p.wallDir = p.vx > 0 ? 1 : -1;
            }
            if (p.vx > 0) p.x = plat.x - p.w;
            if (p.vx < 0) p.x = plat.x + plat.w;
          }
        });

        // Y collision
        p.y += p.vy;
        lvl.platforms.forEach((plat) => {
          if (p.x < plat.x + plat.w && p.x + p.w > plat.x && p.y < plat.y + plat.h && p.y + p.h > plat.y) {
            if (p.vy > 0) {
              p.y = plat.y - p.h;
              p.vy = 0;
              p.grounded = true;
              p.doubleJumpAvailable = true;

              if (plat.type === "moving" && plat.vx) {
                p.x += plat.vx;
              }
            } else if (p.vy < 0) {
              p.y = plat.y + plat.h;
              p.vy = 0;
            }
          }
        });

        // Jump Handling
        if (jumpPressed) {
          if (p.grounded) {
            p.vy = -p.jumpPower;
            p.grounded = false;
            playSound("jump");
            createParticles(p.x + p.w / 2, p.y + p.h, "#ffffff", 6);
          } else if (p.wallSliding) {
            p.vy = -p.jumpPower * 0.95;
            p.vx = -p.wallDir * p.speed * 1.3;
            playSound("jump");
            createParticles(p.x + p.w / 2, p.y + p.h / 2, "#00ffff", 8);
          } else if (p.doubleJumpAvailable && !p.isDashing) {
            p.vy = -p.jumpPower * 0.88;
            p.doubleJumpAvailable = false;
            playSound("jump");
            createParticles(p.x + p.w / 2, p.y + p.h, "#00ffff", 10);
          }
        }

        // Hazard Collision
        lvl.hazards.forEach((haz) => {
          if (p.x < haz.x + haz.w && p.x + p.w > haz.x && p.y < haz.y + haz.h && p.y + p.h > haz.y && p.invulnerableTimer <= 0) {
            p.hp -= 35;
            p.invulnerableTimer = 30;
            p.vy = -8;
            setHealth(Math.max(0, p.hp));
            playSound("hit");
            createParticles(p.x + p.w / 2, p.y + p.h / 2, "#ff0000", 15);

            if (p.hp <= 0) {
              setGameState("GAME_OVER");
            }
          }
        });

        // Enemies Patrol & AI
        lvl.enemies.forEach((enemy) => {
          if (enemy.hp <= 0) return;

          if (enemy.type === "ninja") {
            enemy.x += (enemy.patrolMin < enemy.x && enemy.x < enemy.patrolMax ? 1 : -1) * 1.5;
            if (enemy.x <= enemy.patrolMin || enemy.x >= enemy.patrolMax) {
              const temp = enemy.patrolMin;
              enemy.patrolMin = enemy.patrolMax;
              enemy.patrolMax = temp;
            }
          }

          // Enemy-Player Collision
          if (
            p.x < enemy.x + 24 &&
            p.x + p.w > enemy.x - 12 &&
            p.y < enemy.y + 35 &&
            p.y + p.h > enemy.y - 10 &&
            p.invulnerableTimer <= 0
          ) {
            p.hp -= 20;
            p.invulnerableTimer = 25;
            p.vy = -6;
            setHealth(Math.max(0, p.hp));
            playSound("hit");
            createParticles(p.x, p.y, "#ff0000", 10);
            if (p.hp <= 0) setGameState("GAME_OVER");
          }
        });

        // Projectiles logic
        projectilesRef.current.forEach((proj) => {
          proj.x += proj.vx;
          proj.y += proj.vy;
          proj.life -= 1;

          // Check hit enemies
          if (!proj.isEnemy) {
            lvl.enemies.forEach((enemy) => {
              if (enemy.hp > 0 && Math.hypot(proj.x - enemy.x, proj.y - enemy.y) < enemy.hp) {
                enemy.hp -= 20;
                proj.life = 0;
                playSound("hit");
                createParticles(enemy.x, enemy.y, "#00ffff", 8);
                if (enemy.hp <= 0) setScore((s) => s + 150);
              }
            });
          }
        });
        projectilesRef.current = projectilesRef.current.filter((pr) => pr.life > 0);

        // Scroll Pickups
        lvl.scrolls.forEach((s) => {
          if (!s.collected && Math.hypot(p.x + p.w / 2 - s.x, p.y + p.h / 2 - s.y) < 25) {
            s.collected = true;
            setScrollsCollected((sc) => sc + 1);
            setScore((sc) => sc + 500);
            playSound("item");
            createParticles(s.x, s.y, "#ffaa00", 15);
          }
        });

        // Goal reached check
        if (
          p.x < lvl.goal.x + lvl.goal.w &&
          p.x + p.w > lvl.goal.x &&
          p.y < lvl.goal.y + lvl.goal.h &&
          p.y + p.h > lvl.goal.y
        ) {
          playSound("clear");
          if (currentLevelIdx + 1 < LEVELS.length) {
            setGameState("LEVEL_CLEAR");
          } else {
            setGameState("LEVEL_CLEAR");
          }
        }

        // Camera Follow
        cameraXRef.current = Math.max(0, Math.min(lvl.width - viewW, p.x - viewW / 3));
      }

      // --- RENDERING ---
      const camX = cameraXRef.current;

      // Dark Cyberpunk City Background
      ctx.fillStyle = "#0a071b";
      ctx.fillRect(0, 0, viewW, viewH);

      // Parallax City Silhouettes
      ctx.fillStyle = "#120c2e";
      for (let i = 0; i < 15; i++) {
        const bgX = i * 220 - (camX * 0.3) % 220;
        ctx.fillRect(bgX, viewH - 300, 160, 300);
      }

      ctx.save();
      ctx.translate(-camX, 0);

      // Draw Platforms
      lvl.platforms.forEach((plat) => {
        ctx.fillStyle = plat.type === "wall" ? "#2a1b4e" : plat.type === "moving" ? "#00f0ff" : "#1a1236";
        ctx.fillRect(plat.x, plat.y, plat.w, plat.h);
        ctx.strokeStyle = plat.type === "moving" ? "#ffffff" : "#ff00ff";
        ctx.lineWidth = 2;
        ctx.strokeRect(plat.x, plat.y, plat.w, plat.h);
      });

      // Draw Hazards (Spikes)
      lvl.hazards.forEach((haz) => {
        ctx.fillStyle = "#ff0055";
        ctx.beginPath();
        for (let x = haz.x; x < haz.x + haz.w; x += 15) {
          ctx.moveTo(x, haz.y + haz.h);
          ctx.lineTo(x + 7.5, haz.y);
          ctx.lineTo(x + 15, haz.y + haz.h);
        }
        ctx.fill();
      });

      // Draw Scrolls
      lvl.scrolls.forEach((s) => {
        if (!s.collected) {
          ctx.save();
          ctx.shadowBlur = 15;
          ctx.shadowColor = "#ffaa00";
          ctx.fillStyle = "#ffaa00";
          ctx.beginPath();
          ctx.arc(s.x, s.y, 10, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }
      });

      // Draw Goal Door
      ctx.save();
      ctx.shadowBlur = 20;
      ctx.shadowColor = "#00ff66";
      ctx.fillStyle = "#00ff66";
      ctx.fillRect(lvl.goal.x, lvl.goal.y, lvl.goal.w, lvl.goal.h);
      ctx.restore();

      // Draw Enemies
      lvl.enemies.forEach((e) => {
        if (e.hp <= 0) return;
        ctx.save();
        ctx.shadowBlur = 10;
        ctx.shadowColor = "#ff0055";
        ctx.fillStyle = "#ff0055";
        ctx.fillRect(e.x - 12, e.y - 20, 24, 35);
        // Enemy eyes
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(e.x - 6, e.y - 12, 4, 4);
        ctx.fillRect(e.x + 2, e.y - 12, 4, 4);
        ctx.restore();
      });

      // Draw Projectiles
      projectilesRef.current.forEach((pr) => {
        ctx.fillStyle = pr.color;
        ctx.beginPath();
        ctx.arc(pr.x, pr.y, pr.radius, 0, Math.PI * 2);
        ctx.fill();
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

      // Draw Player Ninja
      ctx.save();
      ctx.shadowBlur = p.isDashing ? 20 : 10;
      ctx.shadowColor = "#00f0ff";
      ctx.fillStyle = "#00f0ff";

      if (p.invulnerableTimer % 4 < 2) {
        ctx.fillRect(p.x, p.y, p.w, p.h);
        // Headband tail trail
        ctx.fillStyle = "#ff0055";
        ctx.fillRect(p.facing === 1 ? p.x - 8 : p.x + p.w, p.y + 6, 8, 4);

        // Katana Slash Arc Visual
        if (p.isSlashing) {
          ctx.strokeStyle = "#ffffff";
          ctx.lineWidth = 3;
          ctx.beginPath();
          const arcX = p.facing === 1 ? p.x + p.w + 10 : p.x - 10;
          ctx.arc(arcX, p.y + p.h / 2, 25, -Math.PI / 3, Math.PI / 3);
          ctx.stroke();
        }
      }
      ctx.restore();

      ctx.restore(); // Restore camera transform

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [gameState, mobileControls, currentLevelIdx]);

  return (
    <div className="relative w-full h-screen bg-slate-950 text-white select-none overflow-hidden font-sans">
      <canvas ref={canvasRef} className="w-full h-full block cursor-crosshair" />

      {/* --- HUD --- */}
      {gameState !== "IDLE" && (
        <div className="absolute top-0 left-0 w-full p-4 pointer-events-none flex justify-between items-start z-10">
          <div className="flex flex-col gap-2 w-60 bg-slate-900/80 backdrop-blur-md p-3 rounded-xl border border-slate-800">
            <div>
              <div className="flex justify-between text-xs font-semibold mb-1 text-slate-300">
                <span>SHINOBI HEALTH</span>
                <span>{health}%</span>
              </div>
              <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-red-500 to-emerald-400" style={{ width: `${health}%` }} />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-xs font-semibold mb-1 text-cyan-400">
                <span>STAMINA</span>
                <span>{Math.round(stamina)}%</span>
              </div>
              <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full bg-cyan-400" style={{ width: `${stamina}%` }} />
              </div>
            </div>
          </div>

          <div className="flex flex-col items-center bg-slate-900/80 backdrop-blur-md px-6 py-2 rounded-xl border border-slate-800">
            <span className="text-xs uppercase text-cyan-400 font-bold">SCROLLS</span>
            <span className="text-xl font-bold">
              {scrollsCollected} / {totalScrolls}
            </span>
          </div>

          <div className="flex items-center gap-3 pointer-events-auto">
            <div className="bg-slate-900/80 backdrop-blur-md px-4 py-2 rounded-xl border border-slate-800 text-right">
              <span className="text-xs text-slate-400 block">SCORE</span>
              <span className="text-lg font-bold text-cyan-400">{score}</span>
            </div>
            <button
              onClick={() => setIsMuted(!isMuted)}
              className="p-2.5 bg-slate-800 rounded-lg border border-slate-700 text-slate-300"
            >
              {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
            </button>
          </div>
        </div>
      )}

      {/* --- MOBILE VIRTUAL CONTROLS OVERLAY --- */}
      {gameState === "PLAYING" && (
        <div className="absolute bottom-4 left-0 w-full px-6 flex justify-between items-end pointer-events-none z-20">
          {/* D-Pad Left/Right */}
          <div className="flex gap-3 pointer-events-auto">
            <button
              onTouchStart={() => setMobileControls((c) => ({ ...c, left: true }))}
              onTouchEnd={() => setMobileControls((c) => ({ ...c, left: false }))}
              onMouseDown={() => setMobileControls((c) => ({ ...c, left: true }))}
              onMouseUp={() => setMobileControls((c) => ({ ...c, left: false }))}
              className="w-16 h-16 bg-slate-800/80 active:bg-cyan-500/50 backdrop-blur-md rounded-2xl border border-slate-700 flex items-center justify-center text-white active:scale-95 transition-transform"
            >
              <ChevronLeft className="w-8 h-8" />
            </button>
            <button
              onTouchStart={() => setMobileControls((c) => ({ ...c, right: true }))}
              onTouchEnd={() => setMobileControls((c) => ({ ...c, right: false }))}
              onMouseDown={() => setMobileControls((c) => ({ ...c, right: true }))}
              onMouseUp={() => setMobileControls((c) => ({ ...c, right: false }))}
              className="w-16 h-16 bg-slate-800/80 active:bg-cyan-500/50 backdrop-blur-md rounded-2xl border border-slate-700 flex items-center justify-center text-white active:scale-95 transition-transform"
            >
              <ChevronRight className="w-8 h-8" />
            </button>
          </div>

          {/* Action Buttons: Jump, Slash, Shuriken, Dash */}
          <div className="grid grid-cols-2 gap-3 pointer-events-auto">
            <button
              onTouchStart={() => setMobileControls((c) => ({ ...c, slash: true }))}
              onTouchEnd={() => setMobileControls((c) => ({ ...c, slash: false }))}
              onMouseDown={() => setMobileControls((c) => ({ ...c, slash: true }))}
              onMouseUp={() => setMobileControls((c) => ({ ...c, slash: false }))}
              className="w-14 h-14 bg-red-600/80 active:bg-red-500 backdrop-blur-md rounded-full border border-red-400 flex items-center justify-center font-bold text-xs active:scale-95"
            >
              SLASH
            </button>
            <button
              onTouchStart={() => setMobileControls((c) => ({ ...c, shuriken: true }))}
              onTouchEnd={() => setMobileControls((c) => ({ ...c, shuriken: false }))}
              onMouseDown={() => setMobileControls((c) => ({ ...c, shuriken: true }))}
              onMouseUp={() => setMobileControls((c) => ({ ...c, shuriken: false }))}
              className="w-14 h-14 bg-purple-600/80 active:bg-purple-500 backdrop-blur-md rounded-full border border-purple-400 flex items-center justify-center font-bold text-xs active:scale-95"
            >
              SHURIKEN
            </button>
            <button
              onTouchStart={() => setMobileControls((c) => ({ ...c, dash: true }))}
              onTouchEnd={() => setMobileControls((c) => ({ ...c, dash: false }))}
              onMouseDown={() => setMobileControls((c) => ({ ...c, dash: true }))}
              onMouseUp={() => setMobileControls((c) => ({ ...c, dash: false }))}
              className="w-14 h-14 bg-cyan-600/80 active:bg-cyan-500 backdrop-blur-md rounded-full border border-cyan-400 flex items-center justify-center font-bold text-xs active:scale-95"
            >
              DASH
            </button>
            <button
              onTouchStart={() => setMobileControls((c) => ({ ...c, jump: true }))}
              onTouchEnd={() => setMobileControls((c) => ({ ...c, jump: false }))}
              onMouseDown={() => setMobileControls((c) => ({ ...c, jump: true }))}
              onMouseUp={() => setMobileControls((c) => ({ ...c, jump: false }))}
              className="w-14 h-14 bg-emerald-600/80 active:bg-emerald-500 backdrop-blur-md rounded-full border border-emerald-400 flex items-center justify-center font-bold text-xs active:scale-95"
            >
              JUMP
            </button>
          </div>
        </div>
      )}

      {/* --- START MODAL --- */}
      {gameState === "IDLE" && (
        <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-6 z-30">
          <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center">
            <h1 className="text-3xl font-black text-cyan-400 mb-2">SHADOW SHINOBI</h1>
            <p className="text-sm text-slate-400 mb-6">
              Precision Cyberpunk Ninja Platformer. Wall-jump, katana slash, and gather ancient scrolls across neon roofs.
            </p>
            <button
              onClick={() => loadLevel(0)}
              className="w-full py-3 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold rounded-xl shadow-lg shadow-cyan-500/25 flex items-center justify-center gap-2 cursor-pointer"
            >
              <Play className="w-5 h-5 fill-current" /> START MISSION
            </button>
          </div>
        </div>
      )}

      {/* --- LEVEL CLEAR MODAL --- */}
      {gameState === "LEVEL_CLEAR" && (
        <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-6 z-30">
          <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center">
            <Trophy className="w-12 h-12 text-yellow-400 mx-auto mb-3" />
            <h2 className="text-2xl font-bold text-white mb-2">SECTOR CLEARED!</h2>
            <p className="text-sm text-slate-400 mb-6">All objectives fulfilled.</p>
            {currentLevelIdx + 1 < LEVELS.length ? (
              <button
                onClick={() => loadLevel(currentLevelIdx + 1)}
                className="w-full py-3 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-xl"
              >
                NEXT STAGE
              </button>
            ) : (
              <button onClick={() => loadLevel(0)} className="w-full py-3 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-xl">
                PLAY AGAIN
              </button>
            )}
          </div>
        </div>
      )}

      {/* --- GAME OVER MODAL --- */}
      {gameState === "GAME_OVER" && (
        <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-6 z-30">
          <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center">
            <Flame className="w-12 h-12 text-red-500 mx-auto mb-3" />
            <h2 className="text-2xl font-bold text-white mb-2">SHINOBI DEFEATED</h2>
            <p className="text-sm text-slate-400 mb-6">You fell in battle.</p>
            <button
              onClick={() => loadLevel(currentLevelIdx)}
              className="w-full py-3 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl flex items-center justify-center gap-2 cursor-pointer"
            >
              <RotateCcw className="w-5 h-5" /> RETRY LEVEL
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
