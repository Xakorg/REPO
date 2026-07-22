"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Gamepad2,
  Trophy,
  Shield,
  Zap,
  Play,
  RotateCcw,
  Volume2,
  VolumeX,
  ShoppingBag,
  Sparkles,
  Pause,
  ArrowLeft,
  Flame,
  Award,
  Radio,
  Gauge,
  Crosshair,
  Compass
} from "lucide-react";
import { cn } from "@/lib/utils";

// --- PROCEDURAL SYNTHWAVE AUDIO ENGINE ---
class NeonAudio {
  ctx: AudioContext | null = null;
  muted: boolean = false;
  engineOsc: OscillatorNode | null = null;
  engineGain: GainNode | null = null;
  musicGain: GainNode | null = null;
  musicInterval: any = null;

  init() {
    if (!this.ctx && typeof window !== "undefined") {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === "suspended") {
      this.ctx.resume();
    }
  }

  playLaser() {
    if (this.muted || !this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(950, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(150, this.ctx.currentTime + 0.1);

      gain.gain.setValueAtTime(0.15, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.1);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + 0.1);
    } catch {}
  }

  playBoost() {
    if (this.muted || !this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(120, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(800, this.ctx.currentTime + 0.35);

      gain.gain.setValueAtTime(0.25, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.4);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + 0.4);
    } catch {}
  }

  playExplosion() {
    if (this.muted || !this.ctx) return;
    try {
      const duration = 0.4;
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
      filter.frequency.setValueAtTime(500, this.ctx.currentTime);
      filter.frequency.linearRampToValueAtTime(40, this.ctx.currentTime + duration);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.35, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + duration);

      whiteNoise.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);

      whiteNoise.start();
      whiteNoise.stop(this.ctx.currentTime + duration);
    } catch {}
  }

  playPickup() {
    if (this.muted || !this.ctx) return;
    try {
      const notes = [440, 554.37, 659.25, 880];
      notes.forEach((freq, idx) => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime + idx * 0.04);

        gain.gain.setValueAtTime(0.12, this.ctx.currentTime + idx * 0.04);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + idx * 0.04 + 0.07);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(this.ctx.currentTime + idx * 0.04);
        osc.stop(this.ctx.currentTime + idx * 0.04 + 0.07);
      });
    } catch {}
  }

  startMusic() {
    if (this.muted || !this.ctx) return;
    this.stopMusic();
    try {
      const synthBass = [65.41, 65.41, 98.0, 87.31, 65.41, 77.78, 98.0, 130.81];
      let step = 0;

      this.musicGain = this.ctx.createGain();
      this.musicGain.gain.setValueAtTime(0.04, this.ctx.currentTime);
      this.musicGain.connect(this.ctx.destination);

      this.musicInterval = setInterval(() => {
        if (!this.ctx || this.muted || !this.musicGain) return;
        const freq = synthBass[step % synthBass.length];
        step++;

        const osc = this.ctx.createOscillator();
        const g = this.ctx.createGain();
        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

        g.gain.setValueAtTime(0.04, this.ctx.currentTime);
        g.gain.exponentialRampToValueAtTime(0.003, this.ctx.currentTime + 0.16);

        osc.connect(g);
        g.connect(this.musicGain);

        osc.start();
        osc.stop(this.ctx.currentTime + 0.16);
      }, 180);
    } catch {}
  }

  stopMusic() {
    if (this.musicInterval) {
      clearInterval(this.musicInterval);
      this.musicInterval = null;
    }
  }
}

const sfx = new NeonAudio();

type GameState = "MENU" | "PLAYING" | "PAUSED" | "SHOP" | "ACHIEVEMENTS" | "GAMEOVER";
type GameMode = "OVERDRIVE" | "COMBAT" | "TIME_TRIAL";
type VehicleType = "CYBER_BLADE" | "VALKYRIE" | "PHANTOM";

interface VehicleConfig {
  name: string;
  desc: string;
  speed: number;
  accel: number;
  shieldBonus: number;
  color: string;
  icon: string;
}

const VEHICLES: Record<VehicleType, VehicleConfig> = {
  CYBER_BLADE: {
    name: "Cyber Blade GT",
    desc: "Balanced racing interceptor with agile drift controls.",
    speed: 180,
    accel: 1.2,
    shieldBonus: 0,
    color: "#00f3ff",
    icon: "🏎️"
  },
  VALKYRIE: {
    name: "Valkyrie Titan",
    desc: "Heavy armor hovercraft (+40 Shield) built for combat survival.",
    speed: 160,
    accel: 1.0,
    shieldBonus: 40,
    color: "#a855f7",
    icon: "🛡️"
  },
  PHANTOM: {
    name: "Phantom Apex",
    desc: "Hyper-speed phantom racer (+25 Top Speed) with magnetic credit attraction.",
    speed: 215,
    accel: 1.5,
    shieldBonus: -10,
    color: "#ff00e5",
    icon: "⚡"
  }
};

interface TrackObject {
  active: boolean;
  x: number; // -1 to +1 lane relative
  z: number; // distance 0 to 1000
  type: "OBSTACLE" | "CREDIT" | "SHIELD_POWER" | "NITRO_POWER" | "ENEMY";
  hp?: number;
}

interface Bullet {
  active: boolean;
  x: number;
  z: number;
  vx: number;
  isEnemy: boolean;
}

export default function NeonVelocity() {
  const [gameState, setGameState] = useState<GameState>("MENU");
  const [gameMode, setGameMode] = useState<GameMode>("OVERDRIVE");
  const [selectedVehicle, setSelectedVehicle] = useState<VehicleType>("CYBER_BLADE");
  const [isMuted, setIsMuted] = useState(false);

  const [highScore, setHighScore] = useState(0);
  const [credits, setCredits] = useState(0);
  const [score, setScore] = useState(0);
  const [speedKmh, setSpeedKmh] = useState(0);
  const [shield, setShield] = useState(100);
  const [maxShield, setMaxShield] = useState(100);
  const [nitro, setNitro] = useState(100);
  const [timeRemaining, setTimeRemaining] = useState(60);

  const [upgrades, setUpgrades] = useState({
    topSpeedLevel: 1,
    accelLevel: 1,
    shieldLevel: 1,
    nitroLevel: 1
  });

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const keysRef = useRef<{ [key: string]: boolean }>({});

  const gameLoopState = useRef({
    playerX: 0, // -1 (left) to +1 (right)
    playerZSpeed: 0,
    targetSpeed: 180,
    shield: 100,
    maxShield: 100,
    nitro: 100,
    isNitroActive: false,
    score: 0,
    distanceTravelled: 0,
    trackObjects: [] as TrackObject[],
    bullets: [] as Bullet[],
    particles: [] as Array<{ x: number; y: number; vx: number; vy: number; life: number; color: string }>,
    shake: 0,
    time: 0,
    timeTrialTimer: 60,
    fireTimer: 0
  });

  // Persistence
  useEffect(() => {
    if (typeof window !== "undefined") {
      const hs = localStorage.getItem("neon_velocity_highscore");
      if (hs) setHighScore(parseInt(hs, 10));

      const cr = localStorage.getItem("neon_velocity_credits");
      if (cr) setCredits(parseInt(cr, 10));

      const up = localStorage.getItem("neon_velocity_upgrades");
      if (up) {
        try {
          setUpgrades(JSON.parse(up));
        } catch {}
      }

      const veh = localStorage.getItem("neon_velocity_vehicle");
      if (veh && ["CYBER_BLADE", "VALKYRIE", "PHANTOM"].includes(veh)) {
        setSelectedVehicle(veh as VehicleType);
      }
    }
  }, []);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Keyboard control setup with scroll prevention
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      sfx.init();
      if (["Space", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.code)) {
        e.preventDefault();
      }
      keysRef.current[e.code] = true;

      if (e.code === "KeyP" || e.code === "Escape") {
        setGameState(prev => {
          if (prev === "PLAYING") {
            sfx.stopMusic();
            return "PAUSED";
          }
          if (prev === "PAUSED") {
            sfx.startMusic();
            return "PLAYING";
          }
          return prev;
        });
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

  const toggleMute = () => {
    sfx.muted = !isMuted;
    setIsMuted(!isMuted);
    if (isMuted && gameState === "PLAYING") {
      sfx.startMusic();
    } else {
      sfx.stopMusic();
    }
  };

  const startGame = (mode: GameMode) => {
    sfx.init();
    sfx.startMusic();
    setGameMode(mode);
    setGameState("PLAYING");

    const vConfig = VEHICLES[selectedVehicle];
    const bShield = 100 + (upgrades.shieldLevel - 1) * 20 + vConfig.shieldBonus;

    setShield(bShield);
    setMaxShield(bShield);
    setNitro(100);
    setScore(0);
    setTimeRemaining(mode === "TIME_TRIAL" ? 60 : 0);

    const initialObjects: TrackObject[] = [];
    for (let z = 300; z < 2000; z += 160) {
      initialObjects.push({
        active: true,
        x: (Math.random() - 0.5) * 1.6,
        z,
        type: Math.random() > 0.4 ? "OBSTACLE" : Math.random() > 0.5 ? "CREDIT" : "NITRO_POWER"
      });
    }

    gameLoopState.current = {
      playerX: 0,
      playerZSpeed: 0,
      targetSpeed: vConfig.speed + (upgrades.topSpeedLevel - 1) * 15,
      shield: bShield,
      maxShield: bShield,
      nitro: 100,
      isNitroActive: false,
      score: 0,
      distanceTravelled: 0,
      trackObjects: initialObjects,
      bullets: [],
      particles: [],
      shake: 0,
      time: 0,
      timeTrialTimer: 60,
      fireTimer: 0
    };
  };

  const purchaseUpgrade = (type: keyof typeof upgrades, cost: number) => {
    if (credits < cost) return;
    setCredits(prev => {
      const next = prev - cost;
      localStorage.setItem("neon_velocity_credits", next.toString());
      return next;
    });

    setUpgrades(prev => {
      const updated = { ...prev, [type]: prev[type] + 1 };
      localStorage.setItem("neon_velocity_upgrades", JSON.stringify(updated));
      return updated;
    });

    sfx.playPickup();
  };

  // --- MAIN 3D PSEUDO-CANVAS RENDERER & GAME LOOP ---
  useEffect(() => {
    if (gameState !== "PLAYING") return;

    let lastTime = performance.now();
    let lastHudUpdate = performance.now();

    const render = (now: number) => {
      const delta = Math.min((now - lastTime) / 1000, 0.1);
      lastTime = now;

      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const w = canvas.width;
      const h = canvas.height;
      const state = gameLoopState.current;
      state.time += delta;

      const vConfig = VEHICLES[selectedVehicle];
      const maxSpeed = (vConfig.speed + (upgrades.topSpeedLevel - 1) * 15) * (state.isNitroActive ? 1.45 : 1);

      // Handle Acceleration & Nitro Input
      const isAccelerating = keysRef.current["KeyW"] || keysRef.current["ArrowUp"];
      const isBraking = keysRef.current["KeyS"] || keysRef.current["ArrowDown"];
      const isNitroInput = keysRef.current["ShiftLeft"] || keysRef.current["KeyE"];

      if (isNitroInput && state.nitro > 5) {
        state.isNitroActive = true;
        state.nitro = Math.max(0, state.nitro - 35 * delta);
        if (Math.random() < 0.3) sfx.playBoost();
      } else {
        state.isNitroActive = false;
        state.nitro = Math.min(100, state.nitro + 12 * delta);
      }

      if (isAccelerating) {
        state.playerZSpeed = Math.min(maxSpeed, state.playerZSpeed + 120 * vConfig.accel * delta);
      } else if (isBraking) {
        state.playerZSpeed = Math.max(40, state.playerZSpeed - 180 * delta);
      } else {
        state.playerZSpeed = Math.max(80, state.playerZSpeed - 20 * delta);
      }

      // Lateral Steering (WASD / Arrows)
      let steerInput = 0;
      if (keysRef.current["KeyA"] || keysRef.current["ArrowLeft"]) steerInput -= 1;
      if (keysRef.current["KeyD"] || keysRef.current["ArrowRight"]) steerInput += 1;

      state.playerX += steerInput * 1.8 * delta;
      state.playerX = Math.max(-1.1, Math.min(1.1, state.playerX));

      // Player Firing Cannon (Space)
      state.fireTimer += delta;
      if (keysRef.current["Space"] && state.fireTimer > 0.16) {
        state.fireTimer = 0;
        sfx.playLaser();
        state.bullets.push({
          active: true,
          x: state.playerX,
          z: 80,
          vx: 0,
          isEnemy: false
        });
      }

      // Distance Travelled & Score Progress
      const currentSpeedRatio = state.playerZSpeed / 100;
      state.distanceTravelled += state.playerZSpeed * delta;
      state.score += Math.round(state.playerZSpeed * delta * 2);

      // Time trial mode timer
      if (gameMode === "TIME_TRIAL") {
        state.timeTrialTimer -= delta;
        if (state.timeTrialTimer <= 0) {
          sfx.stopMusic();
          setGameState("GAMEOVER");
        }
      }

      // --- CLEAR CANVAS & DRAW SYNTHWAVE SKY/SUN ---
      ctx.fillStyle = "#070814";
      ctx.fillRect(0, 0, w, h);

      // Screen Shake translation
      ctx.save();
      if (state.shake > 0) {
        ctx.translate((Math.random() - 0.5) * state.shake, (Math.random() - 0.5) * state.shake);
        state.shake *= 0.86;
      }

      // Synthwave Neon Sun at Horizon
      const horizonY = h * 0.45;
      const sunGradient = ctx.createLinearGradient(0, horizonY - 120, 0, horizonY);
      sunGradient.addColorStop(0, "#ff00e5");
      sunGradient.addColorStop(1, "#ffb700");
      ctx.fillStyle = sunGradient;
      ctx.beginPath();
      ctx.arc(w / 2, horizonY, 80, Math.PI, 0, false);
      ctx.fill();

      // Draw Grid Ground in 3D Perspective
      ctx.strokeStyle = "rgba(0, 243, 255, 0.35)";
      ctx.lineWidth = 1.5;

      const numGridLines = 16;
      for (let i = -numGridLines / 2; i <= numGridLines / 2; i++) {
        const xOffset = i * (w / 10);
        ctx.beginPath();
        ctx.moveTo(w / 2 + xOffset * 0.05, horizonY);
        ctx.lineTo(w / 2 + xOffset * 2.5, h);
        ctx.stroke();
      }

      // Moving Horizontal Grid Lines
      const gridSpeed = (state.distanceTravelled * 0.5) % 40;
      for (let y = horizonY; y <= h; y += 12) {
        const lineY = y + (gridSpeed * ((y - horizonY) / (h - horizonY)));
        if (lineY <= h) {
          ctx.strokeStyle = `rgba(0, 243, 255, ${0.1 + ((lineY - horizonY) / (h - horizonY)) * 0.5})`;
          ctx.beginPath();
          ctx.moveTo(0, lineY);
          ctx.lineTo(w, lineY);
          ctx.stroke();
        }
      }

      // --- TRACK OBJECTS UPDATE & 3D RENDERING ---
      state.trackObjects.forEach(obj => {
        if (!obj.active) return;
        obj.z -= state.playerZSpeed * 2.2 * delta;

        // Respawn ahead if passed player
        if (obj.z <= 0) {
          obj.z = 1800 + Math.random() * 400;
          obj.x = (Math.random() - 0.5) * 1.8;
          obj.active = true;
          const rand = Math.random();
          obj.type = gameMode === "COMBAT" && rand > 0.6 ? "ENEMY" : rand > 0.4 ? "OBSTACLE" : rand > 0.5 ? "CREDIT" : "SHIELD_POWER";
          if (obj.type === "ENEMY") obj.hp = 60;
        }

        // Project 3D (x, z) to 2D Screen (sx, sy, scale)
        const scale = 300 / Math.max(10, obj.z);
        const sx = w / 2 + obj.x * (w * 0.35) * scale;
        const sy = horizonY + scale * (h * 0.4);
        const size = 32 * scale;

        if (sy >= horizonY && sy <= h) {
          ctx.save();
          ctx.translate(sx, sy);

          if (obj.type === "OBSTACLE") {
            ctx.fillStyle = "#ff0055";
            ctx.shadowColor = "#ff0055";
            ctx.shadowBlur = 12 * scale;
            ctx.fillRect(-size / 2, -size, size, size);
          } else if (obj.type === "ENEMY") {
            ctx.fillStyle = "#a855f7";
            ctx.shadowColor = "#a855f7";
            ctx.shadowBlur = 14 * scale;
            ctx.beginPath();
            ctx.moveTo(0, -size * 1.2);
            ctx.lineTo(size / 2, 0);
            ctx.lineTo(-size / 2, 0);
            ctx.closePath();
            ctx.fill();
          } else if (obj.type === "CREDIT") {
            ctx.fillStyle = "#ffb700";
            ctx.shadowColor = "#ffb700";
            ctx.shadowBlur = 10 * scale;
            ctx.beginPath();
            ctx.arc(0, -size / 2, size / 2, 0, Math.PI * 2);
            ctx.fill();
          } else if (obj.type === "SHIELD_POWER") {
            ctx.fillStyle = "#00f3ff";
            ctx.shadowColor = "#00f3ff";
            ctx.shadowBlur = 12 * scale;
            ctx.beginPath();
            ctx.arc(0, -size / 2, size / 2, 0, Math.PI * 2);
            ctx.fill();
          }
          ctx.restore();

          // Collision Detection with Player (z < 60 && Math.abs(x - playerX) < 0.25)
          if (obj.z < 65 && obj.z > 10 && Math.abs(obj.x - state.playerX) < 0.28) {
            obj.active = false;
            if (obj.type === "OBSTACLE" || obj.type === "ENEMY") {
              sfx.playExplosion();
              state.shake = 16;
              state.shield -= 30;
              state.playerZSpeed *= 0.4;
              if (state.shield <= 0) {
                sfx.stopMusic();
                setGameState("GAMEOVER");
              }
            } else if (obj.type === "CREDIT") {
              sfx.playPickup();
              setCredits(prev => {
                const next = prev + 15;
                localStorage.setItem("neon_velocity_credits", next.toString());
                return next;
              });
            } else if (obj.type === "SHIELD_POWER") {
              sfx.playPickup();
              state.shield = Math.min(state.maxShield, state.shield + 35);
            }
          }
        }
      });

      // --- BULLETS UPDATE ---
      state.bullets.forEach(b => {
        if (!b.active) return;
        b.z += 800 * delta;

        const scale = 300 / Math.max(10, b.z);
        const sx = w / 2 + b.x * (w * 0.35) * scale;
        const sy = horizonY + scale * (h * 0.4);

        ctx.fillStyle = "#00f3ff";
        ctx.shadowColor = "#00f3ff";
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.arc(sx, sy, 4 * scale, 0, Math.PI * 2);
        ctx.fill();

        // Bullet hit track objects
        state.trackObjects.forEach(obj => {
          if (!obj.active) return;
          if (Math.abs(obj.z - b.z) < 40 && Math.abs(obj.x - b.x) < 0.2) {
            b.active = false;
            if (obj.type === "OBSTACLE" || obj.type === "ENEMY") {
              obj.active = false;
              sfx.playExplosion();
              state.score += 250;
            }
          }
        });

        if (b.z > 1600) b.active = false;
      });

      // --- DRAW PLAYER CYBER VEHICLE ---
      const playerPx = w / 2 + state.playerX * (w * 0.35);
      const playerPy = h - 70;

      ctx.save();
      ctx.translate(playerPx, playerPy);

      // Nitro boost exhaust trail
      if (state.isNitroActive) {
        ctx.fillStyle = "#ff00e5";
        ctx.shadowColor = "#ff00e5";
        ctx.shadowBlur = 20;
        ctx.beginPath();
        ctx.moveTo(-10, 20);
        ctx.lineTo(0, 45 + Math.random() * 15);
        ctx.lineTo(10, 20);
        ctx.fill();
      }

      // Car Chassis Geometry
      ctx.fillStyle = "#0f172a";
      ctx.strokeStyle = vConfig.color;
      ctx.lineWidth = 3;
      ctx.shadowColor = vConfig.color;
      ctx.shadowBlur = 15;
      ctx.beginPath();
      ctx.moveTo(0, -30);
      ctx.lineTo(24, 18);
      ctx.lineTo(16, 25);
      ctx.lineTo(-16, 25);
      ctx.lineTo(-24, 18);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      ctx.restore();

      // Filter inactive projectiles & entities
      state.bullets = state.bullets.filter(b => b.active);

      // Throttled HUD update (10Hz)
      if (now - lastHudUpdate > 100) {
        lastHudUpdate = now;
        setSpeedKmh(Math.round(state.playerZSpeed));
        setShield(Math.round(state.shield));
        setNitro(Math.round(state.nitro));
        setScore(state.score);
        if (state.score > highScore) {
          setHighScore(state.score);
          localStorage.setItem("neon_velocity_highscore", state.score.toString());
        }
        if (gameMode === "TIME_TRIAL") {
          setTimeRemaining(Math.max(0, Math.ceil(state.timeTrialTimer)));
        }
      }

      animFrameRef.current = requestAnimationFrame(render);
    };

    animFrameRef.current = requestAnimationFrame(render);
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [gameState, gameMode, selectedVehicle, upgrades]);

  return (
    <div className="relative w-full h-screen bg-slate-950 text-slate-100 overflow-hidden flex flex-col font-sans select-none">
      {/* HEADER */}
      <header className="relative z-20 flex items-center justify-between px-6 py-4 bg-slate-900/60 backdrop-blur-md border-b border-cyan-500/20">
        <div className="flex items-center gap-3">
          <Link
            href="/games"
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-cyan-400 border border-slate-700 transition text-sm font-semibold"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Games Hub</span>
          </Link>
          <div className="h-5 w-px bg-slate-800" />
          <div className="flex items-center gap-2">
            <Gauge className="w-6 h-6 text-cyan-400 animate-pulse" />
            <h1 className="text-lg font-black tracking-wider bg-gradient-to-r from-cyan-400 via-pink-400 to-amber-400 bg-clip-text text-transparent uppercase">
              Neon Velocity 2099
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="flex items-center gap-4 text-xs font-mono">
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-950/50 border border-cyan-500/30 text-cyan-400">
              <Trophy className="w-3.5 h-3.5" />
              <span>TOP: {highScore.toLocaleString()}</span>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-950/50 border border-amber-500/30 text-amber-400">
              <Sparkles className="w-3.5 h-3.5" />
              <span>CREDITS: {credits}</span>
            </div>
          </div>

          <button
            onClick={toggleMute}
            className="p-2 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-cyan-400 transition"
          >
            {isMuted ? <VolumeX className="w-5 h-5 text-red-400" /> : <Volume2 className="w-5 h-5 text-cyan-400" />}
          </button>
        </div>
      </header>

      {/* CANVAS CONTAINER */}
      <div className="relative flex-1 flex items-center justify-center p-4">
        <canvas
          ref={canvasRef}
          width={1000}
          height={640}
          className="rounded-2xl border border-cyan-500/30 shadow-2xl bg-slate-950 max-w-full max-h-full object-contain"
        />

        {/* HUD OVERLAY */}
        {gameState === "PLAYING" && (
          <div className="absolute inset-4 pointer-events-none flex flex-col justify-between p-6">
            <div className="flex justify-between items-start">
              {/* Vitals */}
              <div className="flex flex-col gap-2 w-64 p-3 rounded-xl bg-slate-900/80 border border-slate-800 backdrop-blur-md">
                <div className="flex justify-between text-xs font-mono text-cyan-400 font-bold">
                  <span>SHIELD HP</span>
                  <span>{shield} / {maxShield}</span>
                </div>
                <div className="w-full bg-slate-950 h-2.5 rounded-full overflow-hidden border border-slate-800">
                  <div
                    className="bg-gradient-to-r from-cyan-500 to-blue-600 h-full transition-all duration-200"
                    style={{ width: `${Math.max(0, (shield / maxShield) * 100)}%` }}
                  />
                </div>

                <div className="flex justify-between text-xs font-mono text-pink-400 font-bold mt-1">
                  <span>NITRO BOOST</span>
                  <span>{nitro}%</span>
                </div>
                <div className="w-full bg-slate-950 h-2.5 rounded-full overflow-hidden border border-slate-800">
                  <div
                    className="bg-gradient-to-r from-pink-500 to-amber-500 h-full transition-all duration-200"
                    style={{ width: `${nitro}%` }}
                  />
                </div>
              </div>

              {/* Speed & Score */}
              <div className="flex flex-col items-end gap-2">
                <div className="px-5 py-2 rounded-xl bg-slate-900/80 border border-cyan-500/30 backdrop-blur-md text-right">
                  <div className="text-[10px] font-mono text-slate-400 uppercase">VELOCITY</div>
                  <div className="text-3xl font-black text-cyan-400 font-mono tracking-wider">{speedKmh} <span className="text-sm font-normal text-slate-400">KM/H</span></div>
                  <div className="text-xs font-bold text-amber-400 font-mono mt-0.5">SCORE: {score.toLocaleString()}</div>
                </div>

                {gameMode === "TIME_TRIAL" && (
                  <div className="px-4 py-1 rounded-lg bg-pink-950/80 border border-pink-500/40 text-pink-400 font-mono font-bold text-xs">
                    ⏱️ TIME: {timeRemaining}s
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* MENU OVERLAY */}
        {gameState === "MENU" && (
          <div className="absolute inset-0 z-30 flex items-center justify-center p-6 bg-slate-950/80 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="max-w-xl w-full p-8 rounded-3xl bg-slate-900/90 border border-cyan-500/30 shadow-2xl text-center flex flex-col items-center gap-6"
            >
              <div className="relative">
                <div className="absolute -inset-1 rounded-full bg-gradient-to-r from-cyan-500 to-pink-500 opacity-75 blur" />
                <div className="relative p-4 rounded-full bg-slate-950 border border-cyan-400">
                  <Gauge className="w-12 h-12 text-cyan-400" />
                </div>
              </div>

              <div>
                <h2 className="text-3xl font-black tracking-wider bg-gradient-to-r from-cyan-400 via-pink-400 to-amber-400 bg-clip-text text-transparent uppercase">
                  NEON VELOCITY 2099
                </h2>
                <p className="text-sm text-slate-400 mt-2 max-w-md">
                  Blast through neon synthwave highways at breakneck speeds. Dodge obstacles, fire plasma cannons, collect credits, and upgrade your vehicle!
                </p>
              </div>

              {/* Hangar Vehicle Selector */}
              <div className="w-full flex flex-col gap-2">
                <div className="text-xs font-mono text-slate-400 uppercase tracking-widest">Select Cyber Racer</div>
                <div className="grid grid-cols-3 gap-2">
                  {(["CYBER_BLADE", "VALKYRIE", "PHANTOM"] as VehicleType[]).map(veh => (
                    <button
                      key={veh}
                      onClick={() => {
                        setSelectedVehicle(veh);
                        localStorage.setItem("neon_velocity_vehicle", veh);
                      }}
                      className={cn(
                        "p-3 rounded-xl border text-left transition flex flex-col gap-1",
                        selectedVehicle === veh
                          ? "bg-cyan-950/60 border-cyan-400 text-cyan-300 shadow-md shadow-cyan-500/20"
                          : "bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200"
                      )}
                    >
                      <div className="flex items-center gap-1.5 font-bold text-xs">
                        <span>{VEHICLES[veh].icon}</span>
                        <span>{VEHICLES[veh].name}</span>
                      </div>
                      <div className="text-[10px] text-slate-400 leading-tight">{VEHICLES[veh].desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Mode Selector */}
              <div className="w-full flex flex-col gap-3">
                <div className="text-xs font-mono text-slate-400 uppercase tracking-widest">Select Game Mode</div>
                <div className="grid grid-cols-3 gap-3">
                  <button
                    onClick={() => startGame("OVERDRIVE")}
                    className="p-4 rounded-2xl bg-gradient-to-b from-cyan-950/80 to-slate-900 border border-cyan-500/40 hover:border-cyan-400 hover:scale-105 transition flex flex-col items-center gap-2"
                  >
                    <Flame className="w-6 h-6 text-cyan-400" />
                    <span className="text-xs font-bold text-slate-200">Overdrive</span>
                  </button>

                  <button
                    onClick={() => startGame("COMBAT")}
                    className="p-4 rounded-2xl bg-gradient-to-b from-pink-950/80 to-slate-900 border border-pink-500/40 hover:border-pink-400 hover:scale-105 transition flex flex-col items-center gap-2"
                  >
                    <Crosshair className="w-6 h-6 text-pink-400" />
                    <span className="text-xs font-bold text-slate-200">Combat</span>
                  </button>

                  <button
                    onClick={() => startGame("TIME_TRIAL")}
                    className="p-4 rounded-2xl bg-gradient-to-b from-amber-950/80 to-slate-900 border border-amber-500/40 hover:border-amber-400 hover:scale-105 transition flex flex-col items-center gap-2"
                  >
                    <Radio className="w-6 h-6 text-amber-400" />
                    <span className="text-xs font-bold text-slate-200">Time Trial</span>
                  </button>
                </div>
              </div>

              {/* Secondary Actions */}
              <div className="flex gap-4 w-full">
                <button
                  onClick={() => setGameState("SHOP")}
                  className="flex-1 py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-cyan-400 font-bold text-sm flex items-center justify-center gap-2 transition"
                >
                  <ShoppingBag className="w-4 h-4" />
                  <span>Upgrades Hangar</span>
                </button>
              </div>

              <div className="w-full p-3 rounded-xl bg-slate-950/60 border border-slate-800 text-xs text-slate-400 flex justify-around font-mono">
                <div><span className="text-cyan-400 font-bold">A/D or ARROWS</span> Steer</div>
                <div><span className="text-cyan-400 font-bold">W / S</span> Accel / Brake</div>
                <div><span className="text-cyan-400 font-bold">SHIFT</span> Nitro</div>
                <div><span className="text-cyan-400 font-bold">SPACE</span> Cannon</div>
              </div>
            </motion.div>
          </div>
        )}

        {/* SHOP OVERLAY */}
        {gameState === "SHOP" && (
          <div className="absolute inset-0 z-30 flex items-center justify-center p-6 bg-slate-950/90 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="max-w-xl w-full p-8 rounded-3xl bg-slate-900 border border-cyan-500/30 shadow-2xl flex flex-col gap-6"
            >
              <div className="flex justify-between items-center border-b border-slate-800 pb-4">
                <div className="flex items-center gap-3">
                  <ShoppingBag className="w-6 h-6 text-cyan-400" />
                  <h2 className="text-xl font-bold text-slate-100">Vehicle Upgrades Hangar</h2>
                </div>
                <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-amber-950/50 border border-amber-500/40 text-amber-400 font-mono text-sm font-bold">
                  <Sparkles className="w-4 h-4" />
                  <span>{credits} Credits</span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex justify-between items-center">
                  <div>
                    <div className="text-sm font-bold text-cyan-300">Top Speed Turbine</div>
                    <div className="text-xs text-slate-400">Level {upgrades.topSpeedLevel} / 5</div>
                  </div>
                  <button
                    disabled={upgrades.topSpeedLevel >= 5 || credits < upgrades.topSpeedLevel * 100}
                    onClick={() => purchaseUpgrade("topSpeedLevel", upgrades.topSpeedLevel * 100)}
                    className="px-4 py-2 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/40 disabled:opacity-40 text-cyan-300 text-xs font-bold border border-cyan-500/40 transition"
                  >
                    {upgrades.topSpeedLevel >= 5 ? "MAX" : `Upgrade (${upgrades.topSpeedLevel * 100} 💎)`}
                  </button>
                </div>

                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex justify-between items-center">
                  <div>
                    <div className="text-sm font-bold text-pink-300">Shield Matrix</div>
                    <div className="text-xs text-slate-400">Level {upgrades.shieldLevel} / 5</div>
                  </div>
                  <button
                    disabled={upgrades.shieldLevel >= 5 || credits < upgrades.shieldLevel * 80}
                    onClick={() => purchaseUpgrade("shieldLevel", upgrades.shieldLevel * 80)}
                    className="px-4 py-2 rounded-xl bg-pink-500/20 hover:bg-pink-500/40 disabled:opacity-40 text-pink-300 text-xs font-bold border border-pink-500/40 transition"
                  >
                    {upgrades.shieldLevel >= 5 ? "MAX" : `Upgrade (${upgrades.shieldLevel * 80} 💎)`}
                  </button>
                </div>
              </div>

              <button
                onClick={() => setGameState("MENU")}
                className="w-full py-3 rounded-xl bg-slate-800 hover:bg-slate-700 font-bold text-slate-200 transition"
              >
                Back to Main Menu
              </button>
            </motion.div>
          </div>
        )}

        {/* GAMEOVER OVERLAY */}
        {gameState === "GAMEOVER" && (
          <div className="absolute inset-0 z-30 flex items-center justify-center p-6 bg-slate-950/90 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="max-w-md w-full p-8 rounded-3xl bg-slate-900 border border-red-500/30 text-center flex flex-col items-center gap-5"
            >
              <div className="p-4 rounded-full bg-red-950/60 border border-red-500/40 text-red-400">
                <Gauge className="w-10 h-10" />
              </div>

              <div>
                <h3 className="text-2xl font-black text-red-400 uppercase tracking-wider">VEHICLE CRASHED</h3>
                <p className="text-xs text-slate-400 mt-1">Your shield failed on the track</p>
              </div>

              <div className="w-full p-4 rounded-2xl bg-slate-950 border border-slate-800 flex flex-col gap-2 font-mono text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-400">Final Score</span>
                  <span className="text-cyan-400 font-bold">{score.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">High Score</span>
                  <span className="text-amber-400 font-bold">{highScore.toLocaleString()}</span>
                </div>
              </div>

              <div className="flex gap-3 w-full">
                <button
                  onClick={() => startGame(gameMode)}
                  className="flex-1 py-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold flex items-center justify-center gap-2 transition"
                >
                  <RotateCcw className="w-4 h-4" /> Restart Race
                </button>
                <button
                  onClick={() => setGameState("MENU")}
                  className="py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold transition"
                >
                  Menu
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
}
