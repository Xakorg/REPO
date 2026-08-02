"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Zap,
  Shield,
  Crosshair,
  Award,
  Volume2,
  VolumeX,
  Pause,
  Play,
  RotateCcw,
  Sparkles,
  Flame,
  Rocket,
  Users,
  User,
  Globe,
  Trophy,
  ArrowLeft,
  Activity,
  Radio,
  Clock,
  CheckCircle2,
  X
} from "lucide-react";
import Link from "next/link";
import { useUser, useFirestore, setDocumentNonBlocking } from "@/firebase";
import { doc, increment } from "firebase/firestore";

// ==========================================
// TYPES & DATA STRUCTURES
// ==========================================

export type GameMode = "single" | "local_2p" | "online";

export interface StasisPlayer {
  id: string;
  name: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  rotation: number;
  health: number;
  maxHealth: number;
  energy: number;
  maxEnergy: number;
  score: number;
  color: string;
  stasisActive: boolean;
  stasisTimer: number;
  stasisCooldown: number;
  fireCooldown: number;
  kills: number;
}

// ==========================================
// WEB AUDIO SYNTHESIZER
// ==========================================

class AudioSynth {
  ctx: AudioContext | null = null;
  muted: boolean = false;

  init() {
    if (!this.ctx && typeof window !== "undefined") {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) this.ctx = new AudioCtx();
    }
    if (this.ctx && this.ctx.state === "suspended") {
      this.ctx.resume();
    }
  }

  playStasisPulse() {
    if (this.muted || !this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(300, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1200, this.ctx.currentTime + 0.3);
      osc.frequency.exponentialRampToValueAtTime(80, this.ctx.currentTime + 0.7);

      gain.gain.setValueAtTime(0.3, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.7);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.7);
    } catch (e) {}
  }

  playLaser(freq = 700) {
    if (this.muted || !this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(150, this.ctx.currentTime + 0.1);

      gain.gain.setValueAtTime(0.12, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.1);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.1);
    } catch (e) {}
  }

  playImpact() {
    if (this.muted || !this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "square";
      osc.frequency.setValueAtTime(200, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(40, this.ctx.currentTime + 0.2);

      gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.2);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.2);
    } catch (e) {}
  }

  playVictory() {
    if (this.muted || !this.ctx) return;
    try {
      [523.25, 659.25, 783.99, 1046.5].forEach((freq, idx) => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();
        osc.type = "triangle";
        osc.frequency.setValueAtTime(freq, this.ctx!.currentTime + idx * 0.1);
        gain.gain.setValueAtTime(0.2, this.ctx!.currentTime + idx * 0.1);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx!.currentTime + idx * 0.1 + 0.3);
        osc.connect(gain);
        gain.connect(this.ctx!.destination);
        osc.start(this.ctx!.currentTime + idx * 0.1);
        osc.stop(this.ctx!.currentTime + idx * 0.1 + 0.3);
      });
    } catch (e) {}
  }
}

const synth = new AudioSynth();

// ==========================================
// MAIN STASIS GAME COMPONENT
// ==========================================

export default function StasisGame() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const { user } = useUser();
  const firestore = useFirestore();

  // App UI State
  const [gameState, setGameState] = useState<"menu" | "playing" | "paused" | "game_over">("menu");
  const [mode, setMode] = useState<GameMode>("single");
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [roomCode, setRoomCode] = useState("");
  const [onlineJoined, setOnlineJoined] = useState(false);

  // Stats for Game Over
  const [scoreP1, setScoreP1] = useState(0);
  const [scoreP2, setScoreP2] = useState(0);
  const [healthP1, setHealthP1] = useState(100);
  const [healthP2, setHealthP2] = useState(100);
  const [stasisP1, setStasisP1] = useState(1.0); // Ratio
  const [stasisP2, setStasisP2] = useState(1.0);
  const [wave, setWave] = useState(1);
  const [winnerName, setWinnerName] = useState<string | null>(null);

  // Engine Refs (Avoid re-renders during 60FPS loop)
  const engineRef = useRef({
    keys: {
      w: false, a: false, s: false, d: false, space: false,
      up: false, left: false, down: false, right: false, enter: false,
      mouseX: 0, mouseY: 0, mouseDown: false
    },
    p1: {
      id: "p1", name: "Player 1", x: 200, y: 300, vx: 0, vy: 0, radius: 18, rotation: 0,
      health: 100, maxHealth: 100, energy: 100, maxEnergy: 100, score: 0, color: "#06b6d4",
      stasisActive: false, stasisTimer: 0, stasisCooldown: 0, fireCooldown: 0, kills: 0
    } as StasisPlayer,
    p2: {
      id: "p2", name: "Player 2", x: 800, y: 300, vx: 0, vy: 0, radius: 18, rotation: Math.PI,
      health: 100, maxHealth: 100, energy: 100, maxEnergy: 100, score: 0, color: "#f43f5e",
      stasisActive: false, stasisTimer: 0, stasisCooldown: 0, fireCooldown: 0, kills: 0
    } as StasisPlayer,
    bullets: [] as any[],
    enemies: [] as any[],
    particles: [] as any[],
    stasisZones: [] as any[],
    orbs: [] as any[],
    wave: 1,
    waveTimer: 0
  });

  const toggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    synth.muted = !next;
  };

  // Dispatch global score event to Xakteir Leaderboard
  const dispatchScore = (finalScore: number) => {
    if (typeof window !== "undefined" && finalScore > 0) {
      const points = Math.floor(finalScore / 50) + 10;
      window.dispatchEvent(
        new CustomEvent("xakteir-game-score", {
          detail: { score: finalScore, points }
        })
      );
      if (user && firestore) {
        setDocumentNonBlocking(
          doc(firestore, "leaderboard", user.uid),
          {
            uid: user.uid,
            displayName: user.displayName || "Stasis Pilot",
            points: increment(points),
            updatedAt: new Date().toISOString()
          },
          { merge: true }
        );
      }
    }
  };

  // Initialize Game Loop State
  const initGame = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const w = (canvas.width = canvas.parentElement?.clientWidth || window.innerWidth);
    const h = (canvas.height = canvas.parentElement?.clientHeight || window.innerHeight);

    const engine = engineRef.current;

    engine.p1 = {
      id: "p1", name: user?.displayName || "Alpha Pilot", x: w * 0.25, y: h / 2, vx: 0, vy: 0, radius: 18, rotation: 0,
      health: 100, maxHealth: 100, energy: 100, maxEnergy: 100, score: 0, color: "#06b6d4",
      stasisActive: false, stasisTimer: 0, stasisCooldown: 0, fireCooldown: 0, kills: 0
    };

    engine.p2 = {
      id: "p2", name: mode === "local_2p" ? "Vanguard 2" : "AI Sentinel", x: w * 0.75, y: h / 2, vx: 0, vy: 0, radius: 18, rotation: Math.PI,
      health: 100, maxHealth: 100, energy: 100, maxEnergy: 100, score: 0, color: mode === "local_2p" ? "#f43f5e" : "#eab308",
      stasisActive: false, stasisTimer: 0, stasisCooldown: 0, fireCooldown: 0, kills: 0
    };

    engine.bullets = [];
    engine.enemies = [];
    engine.particles = [];
    engine.stasisZones = [];
    engine.orbs = [];
    engine.wave = 1;
    engine.waveTimer = 0;

    setScoreP1(0);
    setScoreP2(0);
    setHealthP1(100);
    setHealthP2(100);
    setStasisP1(1.0);
    setStasisP2(1.0);
    setWave(1);
    setWinnerName(null);
  }, [mode, user]);

  // Main 60FPS Game & Physics Loop
  useEffect(() => {
    let animId: number;

    const runLoop = () => {
      if (gameState === "playing") {
        updatePhysics();
      }
      renderCanvas();
      animId = requestAnimationFrame(runLoop);
    };

    const updatePhysics = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const w = canvas.width;
      const h = canvas.height;
      const engine = engineRef.current;
      const keys = engine.keys;
      const p1 = engine.p1;
      const p2 = engine.p2;

      // ----------------------------------------
      // PLAYER 1 MOVEMENT & STASIS
      // ----------------------------------------
      let p1dx = 0;
      let p1dy = 0;
      if (keys.w) p1dy -= 1;
      if (keys.s) p1dy += 1;
      if (keys.a) p1dx -= 1;
      if (keys.d) p1dx += 1;

      if (p1dx !== 0 && p1dy !== 0) {
        p1dx *= 0.7071;
        p1dy *= 0.7071;
      }

      p1.vx += (p1dx * 6.5 - p1.vx) * 0.25;
      p1.vy += (p1dy * 6.5 - p1.vy) * 0.25;

      p1.x = Math.max(p1.radius, Math.min(w - p1.radius, p1.x + p1.vx));
      p1.y = Math.max(p1.radius, Math.min(h - p1.radius, p1.y + p1.vy));

      // P1 Rotation towards mouse or movement
      if (keys.mouseX || keys.mouseY) {
        p1.rotation = Math.atan2(keys.mouseY - p1.y, keys.mouseX - p1.x);
      } else if (p1dx !== 0 || p1dy !== 0) {
        p1.rotation = Math.atan2(p1.vy, p1.vx);
      }

      // P1 Stasis Ability (Spacebar)
      if (p1.stasisCooldown > 0) p1.stasisCooldown--;
      setStasisP1(1 - p1.stasisCooldown / 300);

      if (keys.space && p1.stasisCooldown <= 0) {
        synth.playStasisPulse();
        p1.stasisCooldown = 300; // 5s cooldown
        engine.stasisZones.push({
          x: p1.x,
          y: p1.y,
          radius: 10,
          maxRadius: 180,
          life: 180, // 3 seconds stasis field
          color: p1.color,
          ownerId: p1.id
        });
      }

      // P1 Shooting
      if (p1.fireCooldown > 0) p1.fireCooldown--;
      if ((keys.mouseDown || keys.space) && p1.fireCooldown <= 0) {
        synth.playLaser(750);
        p1.fireCooldown = 12;
        engine.bullets.push({
          x: p1.x + Math.cos(p1.rotation) * 22,
          y: p1.y + Math.sin(p1.rotation) * 22,
          vx: Math.cos(p1.rotation) * 15,
          vy: Math.sin(p1.rotation) * 15,
          radius: 4,
          damage: 25,
          color: p1.color,
          ownerId: p1.id
        });
      }

      // ----------------------------------------
      // PLAYER 2 / AI MOVEMENT & LOGIC
      // ----------------------------------------
      if (mode === "local_2p") {
        let p2dx = 0;
        let p2dy = 0;
        if (keys.up) p2dy -= 1;
        if (keys.down) p2dy += 1;
        if (keys.left) p2dx -= 1;
        if (keys.right) p2dx += 1;

        if (p2dx !== 0 && p2dy !== 0) {
          p2dx *= 0.7071;
          p2dy *= 0.7071;
        }

        p2.vx += (p2dx * 6.5 - p2.vx) * 0.25;
        p2.vy += (p2dy * 6.5 - p2.vy) * 0.25;

        p2.x = Math.max(p2.radius, Math.min(w - p2.radius, p2.x + p2.vx));
        p2.y = Math.max(p2.radius, Math.min(h - p2.radius, p2.y + p2.vy));

        if (p2dx !== 0 || p2dy !== 0) {
          p2.rotation = Math.atan2(p2.vy, p2.vx);
        }

        // P2 Stasis
        if (p2.stasisCooldown > 0) p2.stasisCooldown--;
        setStasisP2(1 - p2.stasisCooldown / 300);

        if (keys.enter && p2.stasisCooldown <= 0) {
          synth.playStasisPulse();
          p2.stasisCooldown = 300;
          engine.stasisZones.push({
            x: p2.x,
            y: p2.y,
            radius: 10,
            maxRadius: 180,
            life: 180,
            color: p2.color,
            ownerId: p2.id
          });
        }

        // P2 Firing (Enter key)
        if (p2.fireCooldown > 0) p2.fireCooldown--;
        if (keys.enter && p2.fireCooldown <= 0) {
          synth.playLaser(550);
          p2.fireCooldown = 12;
          engine.bullets.push({
            x: p2.x + Math.cos(p2.rotation) * 22,
            y: p2.y + Math.sin(p2.rotation) * 22,
            vx: Math.cos(p2.rotation) * 15,
            vy: Math.sin(p2.rotation) * 15,
            radius: 4,
            damage: 25,
            color: p2.color,
            ownerId: p2.id
          });
        }
      } else {
        // AI Sentinel Logic for Single Player
        engine.waveTimer++;
        if (engine.enemies.length < Math.min(6 + engine.wave * 2, 20) && Math.random() < 0.04) {
          const angle = Math.random() * Math.PI * 2;
          engine.enemies.push({
            x: Math.random() * w,
            y: -30,
            vx: (Math.random() - 0.5) * 2,
            vy: Math.random() * 2 + 1,
            radius: 14,
            health: 30 + engine.wave * 10,
            color: "#eab308"
          });
        }

        if (engine.waveTimer > 700 && engine.enemies.length === 0) {
          engine.waveTimer = 0;
          engine.wave++;
          setWave(engine.wave);
        }
      }

      // ----------------------------------------
      // UPDATE STASIS ZONES & TIME DILATION
      // ----------------------------------------
      for (let zIdx = engine.stasisZones.length - 1; zIdx >= 0; zIdx--) {
        const zone = engine.stasisZones[zIdx];
        if (zone.radius < zone.maxRadius) zone.radius += 8;
        zone.life--;

        if (zone.life <= 0) {
          engine.stasisZones.splice(zIdx, 1);
        }
      }

      // ----------------------------------------
      // UPDATE BULLETS & COLLISION
      // ----------------------------------------
      for (let bIdx = engine.bullets.length - 1; bIdx >= 0; bIdx--) {
        const b = engine.bullets[bIdx];

        // Check if inside any enemy Stasis Zone (Slowdown physics!)
        let speedMult = 1.0;
        engine.stasisZones.forEach(z => {
          if (z.ownerId !== b.ownerId) {
            const dist = Math.hypot(b.x - z.x, b.y - z.y);
            if (dist < z.radius) {
              speedMult = 0.15; // 85% Slow motion in stasis!
            }
          }
        });

        b.x += b.vx * speedMult;
        b.y += b.vy * speedMult;

        // Player Vs Bullet collision
        if (mode === "local_2p") {
          const target = b.ownerId === "p1" ? p2 : p1;
          const dist = Math.hypot(b.x - target.x, b.y - target.y);
          if (dist < target.radius + b.radius) {
            synth.playImpact();
            target.health -= b.damage;
            createHitSparks(b.x, b.y, b.color);
            engine.bullets.splice(bIdx, 1);

            if (target.id === "p1") setHealthP1(target.health);
            else setHealthP2(target.health);

            if (target.health <= 0) {
              synth.playVictory();
              const winner = b.ownerId === "p1" ? p1.name : p2.name;
              setWinnerName(winner);
              dispatchScore(b.ownerId === "p1" ? 1500 : 1000);
              setGameState("game_over");
            }
            continue;
          }
        }

        // Enemy collision (Single Player)
        if (mode === "single") {
          for (let eIdx = engine.enemies.length - 1; eIdx >= 0; eIdx--) {
            const enemy = engine.enemies[eIdx];
            const dist = Math.hypot(b.x - enemy.x, b.y - enemy.y);
            if (dist < enemy.radius + b.radius) {
              synth.playImpact();
              enemy.health -= b.damage;
              createHitSparks(b.x, b.y, b.color);
              engine.bullets.splice(bIdx, 1);

              if (enemy.health <= 0) {
                p1.score += 150;
                p1.kills++;
                setScoreP1(p1.score);
                engine.enemies.splice(eIdx, 1);
              }
              break;
            }
          }
        }

        if (b.x < -20 || b.x > w + 20 || b.y < -20 || b.y > h + 20) {
          engine.bullets.splice(bIdx, 1);
        }
      }

      // Single Player Enemies AI Movement
      if (mode === "single") {
        for (let eIdx = engine.enemies.length - 1; eIdx >= 0; eIdx--) {
          const enemy = engine.enemies[eIdx];

          let slowMult = 1.0;
          engine.stasisZones.forEach(z => {
            if (Math.hypot(enemy.x - z.x, enemy.y - z.y) < z.radius) {
              slowMult = 0.1;
            }
          });

          enemy.x += enemy.vx * slowMult;
          enemy.y += enemy.vy * slowMult;

          const dist = Math.hypot(enemy.x - p1.x, enemy.y - p1.y);
          if (dist < p1.radius + enemy.radius) {
            synth.playImpact();
            p1.health -= 20;
            setHealthP1(p1.health);
            engine.enemies.splice(eIdx, 1);

            if (p1.health <= 0) {
              dispatchScore(p1.score);
              setGameState("game_over");
            }
          }
        }
      }
    };

    const createHitSparks = (x: number, y: number, color: string) => {
      const engine = engineRef.current;
      for (let i = 0; i < 8; i++) {
        const angle = Math.random() * Math.PI * 2;
        engine.particles.push({
          x, y,
          vx: Math.cos(angle) * (Math.random() * 5 + 2),
          vy: Math.sin(angle) * (Math.random() * 5 + 2),
          radius: Math.random() * 2 + 1,
          color,
          alpha: 1,
          life: 15
        });
      }
    };

    // Canvas rendering loop
    const renderCanvas = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      const w = canvas.width;
      const h = canvas.height;
      const engine = engineRef.current;

      ctx.fillStyle = "#030712";
      ctx.fillRect(0, 0, w, h);

      // Draw Grid lines
      ctx.strokeStyle = "rgba(255, 255, 255, 0.03)";
      ctx.lineWidth = 1;
      const gridSize = 40;
      for (let x = 0; x < w; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, h);
        ctx.stroke();
      }
      for (let y = 0; y < h; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();
      }

      // Draw Stasis Dilation Fields
      engine.stasisZones.forEach(z => {
        ctx.save();
        ctx.fillStyle = `${z.color}15`;
        ctx.strokeStyle = z.color;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(z.x, z.y, z.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        ctx.strokeStyle = `${z.color}60`;
        ctx.setLineDash([6, 6]);
        ctx.beginPath();
        ctx.arc(z.x, z.y, z.radius * 0.6, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      });

      // Draw Particles
      for (let i = engine.particles.length - 1; i >= 0; i--) {
        const p = engine.particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.alpha -= 1 / p.life;

        if (p.alpha <= 0) {
          engine.particles.splice(i, 1);
          continue;
        }

        ctx.fillStyle = p.color;
        ctx.globalAlpha = Math.max(0, p.alpha);
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;

      // Draw Bullets
      engine.bullets.forEach(b => {
        ctx.shadowBlur = 10;
        ctx.shadowColor = b.color;
        ctx.fillStyle = b.color;
        ctx.beginPath();
        ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.shadowBlur = 0;

      // Draw Single Player Enemies
      if (mode === "single") {
        engine.enemies.forEach(e => {
          ctx.fillStyle = e.color;
          ctx.shadowBlur = 12;
          ctx.shadowColor = e.color;
          ctx.beginPath();
          ctx.arc(e.x, e.y, e.radius, 0, Math.PI * 2);
          ctx.fill();
        });
        ctx.shadowBlur = 0;
      }

      // Draw Players
      [engine.p1, ...(mode === "local_2p" ? [engine.p2] : [])].forEach(p => {
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);

        ctx.shadowBlur = 15;
        ctx.shadowColor = p.color;
        ctx.fillStyle = p.color;

        ctx.beginPath();
        ctx.moveTo(p.radius + 4, 0);
        ctx.lineTo(-p.radius, -p.radius + 3);
        ctx.lineTo(-p.radius / 2, 0);
        ctx.lineTo(-p.radius, p.radius - 3);
        ctx.closePath();
        ctx.fill();

        ctx.restore();
      });
    };

    animId = requestAnimationFrame(runLoop);
    return () => cancelAnimationFrame(animId);
  }, [gameState, mode]);

  // Event Listeners for P1 and P2 controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      synth.init();
      const keys = engineRef.current.keys;
      if (e.key === "w" || e.key === "W") keys.w = true;
      if (e.key === "a" || e.key === "A") keys.a = true;
      if (e.key === "s" || e.key === "S") keys.s = true;
      if (e.key === "d" || e.key === "D") keys.d = true;
      if (e.key === " ") keys.space = true;

      if (e.key === "ArrowUp") keys.up = true;
      if (e.key === "ArrowLeft") keys.left = true;
      if (e.key === "ArrowDown") keys.down = true;
      if (e.key === "ArrowRight") keys.right = true;
      if (e.key === "Enter") keys.enter = true;
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const keys = engineRef.current.keys;
      if (e.key === "w" || e.key === "W") keys.w = false;
      if (e.key === "a" || e.key === "A") keys.a = false;
      if (e.key === "s" || e.key === "S") keys.s = false;
      if (e.key === "d" || e.key === "D") keys.d = false;
      if (e.key === " ") keys.space = false;

      if (e.key === "ArrowUp") keys.up = false;
      if (e.key === "ArrowLeft") keys.left = false;
      if (e.key === "ArrowDown") keys.down = false;
      if (e.key === "ArrowRight") keys.right = false;
      if (e.key === "Enter") keys.enter = false;
    };

    const handleMouseMove = (e: MouseEvent) => {
      const canvas = canvasRef.current;
      if (canvas) {
        const rect = canvas.getBoundingClientRect();
        engineRef.current.keys.mouseX = e.clientX - rect.left;
        engineRef.current.keys.mouseY = e.clientY - rect.top;
      }
    };

    const handleMouseDown = () => {
      synth.init();
      engineRef.current.keys.mouseDown = true;
    };
    const handleMouseUp = () => {
      engineRef.current.keys.mouseDown = false;
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
  }, []);

  const startGame = (selectedMode: GameMode) => {
    setMode(selectedMode);
    initGame();
    setGameState("playing");
  };

  return (
    <div className="w-full h-screen bg-[#030712] text-white relative overflow-hidden font-sans select-none">
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full block" />

      {/* Top Controls Header */}
      <div className="absolute top-0 inset-x-0 p-4 flex justify-between items-center z-30 pointer-events-none">
        <Link
          href="/games"
          className="pointer-events-auto flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 backdrop-blur-md text-xs font-semibold"
        >
          <ArrowLeft className="w-4 h-4" /> Exit Stasis
        </Link>
        <div className="flex items-center gap-3 pointer-events-auto">
          <button
            onClick={toggleSound}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 backdrop-blur-md"
          >
            {soundEnabled ? <Volume2 className="w-4 h-4 text-cyan-400" /> : <VolumeX className="w-4 h-4 text-rose-400" />}
          </button>
        </div>
      </div>

      {/* HUD Overlay */}
      {gameState === "playing" && (
        <div className="absolute inset-0 p-6 flex flex-col justify-between pointer-events-none z-20">
          <div className="flex justify-between items-start mt-12">
            {/* Player 1 HUD */}
            <div className="bg-[#0b0f19]/80 border border-cyan-500/30 p-3.5 rounded-2xl backdrop-blur-md w-56">
              <div className="text-xs font-black text-cyan-400 uppercase tracking-wider mb-1 flex justify-between">
                <span>{engineRef.current.p1.name}</span>
                <span>{Math.ceil(healthP1)} HP</span>
              </div>
              <div className="w-full h-2 bg-cyan-950 rounded-full overflow-hidden mb-2">
                <div className="h-full bg-cyan-400 transition-all" style={{ width: `${Math.max(0, healthP1)}%` }} />
              </div>
              <div className="flex justify-between items-center text-[10px] font-bold text-white/50">
                <span>Stasis Pulse</span>
                <span className={stasisP1 >= 1 ? "text-cyan-400 font-black" : ""}>
                  {stasisP1 >= 1 ? "READY [SPACE]" : "CHARGING"}
                </span>
              </div>
            </div>

            {/* Mode Title / Wave */}
            <div className="text-center bg-[#0b0f19]/80 border border-white/10 px-5 py-2 rounded-2xl backdrop-blur-md">
              <div className="text-[10px] font-black uppercase text-white/40 tracking-widest">STASIS FIELD</div>
              <div className="text-xl font-black text-cyan-400">
                {mode === "single" ? `WAVE ${wave}` : "VERSUS ARENA"}
              </div>
            </div>

            {/* Player 2 / AI HUD */}
            <div className="bg-[#0b0f19]/80 border border-rose-500/30 p-3.5 rounded-2xl backdrop-blur-md w-56 text-right">
              <div className="text-xs font-black text-rose-400 uppercase tracking-wider mb-1 flex justify-between">
                <span>{healthP2} HP</span>
                <span>{engineRef.current.p2.name}</span>
              </div>
              <div className="w-full h-2 bg-rose-950 rounded-full overflow-hidden mb-2">
                <div className="h-full bg-rose-500 transition-all" style={{ width: `${Math.max(0, healthP2)}%` }} />
              </div>
              <div className="flex justify-between items-center text-[10px] font-bold text-white/50">
                <span className={stasisP2 >= 1 ? "text-rose-400 font-black" : ""}>
                  {stasisP2 >= 1 ? "READY [ENTER]" : "CHARGING"}
                </span>
                <span>Stasis Pulse</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Menu */}
      {gameState === "menu" && (
        <div className="absolute inset-0 z-40 bg-[#030712]/90 backdrop-blur-xl flex flex-col items-center justify-center p-6">
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center max-w-xl mb-8">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs font-bold uppercase tracking-widest mb-3">
              <Clock className="w-3.5 h-3.5" /> Time Dilation Combat Arena
            </div>
            <h1 className="text-6xl font-black uppercase tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-indigo-500">
              STASIS
            </h1>
            <p className="text-sm text-white/60 mt-3">
              Control localized time fields to freeze enemy fire, outmaneuver combat droids, and dominate 2-Player duel arenas.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-lg w-full mb-8">
            <button
              onClick={() => startGame("single")}
              className="p-5 rounded-2xl bg-[#0b0f19] border border-cyan-500/40 hover:border-cyan-400 flex flex-col items-center gap-2 hover:scale-105 transition-all text-center"
            >
              <User className="w-8 h-8 text-cyan-400" />
              <div className="font-black text-lg">SOLO SURVIVAL</div>
              <div className="text-xs text-white/50">Defend against endless AI sentinel waves</div>
            </button>

            <button
              onClick={() => startGame("local_2p")}
              className="p-5 rounded-2xl bg-[#0b0f19] border border-rose-500/40 hover:border-rose-400 flex flex-col items-center gap-2 hover:scale-105 transition-all text-center"
            >
              <Users className="w-8 h-8 text-rose-400" />
              <div className="font-black text-lg">2-PLAYER DUEL</div>
              <div className="text-xs text-white/50">Same keyboard head-to-head tactical arena</div>
            </button>
          </div>
        </div>
      )}

      {/* Game Over Modal */}
      {gameState === "game_over" && (
        <div className="absolute inset-0 z-50 bg-black/85 backdrop-blur-md flex flex-col items-center justify-center p-6">
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center max-w-md w-full">
            <h2 className="text-4xl font-black uppercase text-cyan-400 mb-2">
              {winnerName ? `${winnerName} Victorius!` : "Match Complete"}
            </h2>
            <p className="text-xs text-white/50 mb-6">Stasis Sector Simulation Ended</p>

            <div className="flex gap-4">
              <button
                onClick={() => startGame(mode)}
                className="flex-1 py-3.5 rounded-xl bg-cyan-500 text-black font-black uppercase tracking-wider"
              >
                REMATCH
              </button>
              <button
                onClick={() => setGameState("menu")}
                className="px-5 py-3.5 rounded-xl bg-white/10 text-white font-bold uppercase"
              >
                MENU
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
