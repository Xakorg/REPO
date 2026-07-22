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
  Gauge,
  Radio,
  Car,
  Crosshair,
  ShieldAlert,
  FastForward,
  Navigation
} from "lucide-react";
import { cn } from "@/lib/utils";

// --- WEB AUDIO PROCEDURAL RACING SOUND SYNTHESIZER ---
class RacingSoundEffects {
  ctx: AudioContext | null = null;
  muted: boolean = false;
  engineOsc: OscillatorNode | null = null;
  engineGain: GainNode | null = null;
  musicIntervalId: any = null;

  init() {
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

  startEngine() {
    if (this.muted || !this.ctx || this.engineOsc) return;
    try {
      this.engineOsc = this.ctx.createOscillator();
      this.engineGain = this.ctx.createGain();
      this.engineOsc.type = "sawtooth";
      this.engineOsc.frequency.setValueAtTime(60, this.ctx.currentTime);

      this.engineGain.gain.setValueAtTime(0.04, this.ctx.currentTime);

      this.engineOsc.connect(this.engineGain);
      this.engineGain.connect(this.ctx.destination);
      this.engineOsc.start();
    } catch {}
  }

  updateEnginePitch(speedRatio: number) {
    if (this.engineOsc && this.ctx && !this.muted) {
      try {
        const freq = 60 + speedRatio * 180;
        this.engineOsc.frequency.setTargetAtTime(freq, this.ctx.currentTime, 0.05);
      } catch {}
    }
  }

  stopEngine() {
    if (this.engineOsc) {
      try {
        this.engineOsc.stop();
        this.engineOsc.disconnect();
      } catch {}
      this.engineOsc = null;
      this.engineGain = null;
    }
  }

  playNitro() {
    if (this.muted || !this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(150, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(650, this.ctx.currentTime + 0.3);

      gain.gain.setValueAtTime(0.25, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.35);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.35);
    } catch {}
  }

  playDriftScreech() {
    if (this.muted || !this.ctx) return;
    try {
      const bufferSize = this.ctx.sampleRate * 0.15;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const output = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
      }
      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = "bandpass";
      filter.frequency.setValueAtTime(1200, this.ctx.currentTime);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.12, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.15);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);
      noise.start();
      noise.stop(this.ctx.currentTime + 0.15);
    } catch {}
  }

  playCrash() {
    if (this.muted || !this.ctx) return;
    try {
      const duration = 0.4;
      const bufferSize = this.ctx.sampleRate * duration;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const output = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
      }
      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.setValueAtTime(400, this.ctx.currentTime);
      filter.frequency.linearRampToValueAtTime(50, this.ctx.currentTime + duration);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.35, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + duration);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);
      noise.start();
      noise.stop(this.ctx.currentTime + duration);
    } catch {}
  }

  playCoin() {
    if (this.muted || !this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(987, this.ctx.currentTime);
      osc.frequency.setValueAtTime(1318, this.ctx.currentTime + 0.08);

      gain.gain.setValueAtTime(0.12, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.2);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.2);
    } catch {}
  }

  startMusic() {
    if (this.muted || !this.ctx) return;
    this.stopMusic();

    try {
      const bassline = [110, 110, 146.83, 110, 164.81, 146.83, 110, 220];
      let step = 0;

      this.musicIntervalId = setInterval(() => {
        if (!this.ctx || this.muted) return;
        const freq = bassline[step % bassline.length];
        step++;

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

        gain.gain.setValueAtTime(0.035, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.005, this.ctx.currentTime + 0.16);

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start();
        osc.stop(this.ctx.currentTime + 0.16);
      }, 160);
    } catch {}
  }

  stopMusic() {
    if (this.musicIntervalId) {
      clearInterval(this.musicIntervalId);
      this.musicIntervalId = null;
    }
  }
}

const racingSfx = new RacingSoundEffects();

// --- GAME TYPES ---
type GameState = "MENU" | "PLAYING" | "PAUSED" | "SHOP" | "GAMEOVER" | "ACHIEVEMENTS";
type GameMode = "ENDLESS_DRIFT" | "TIME_ATTACK" | "POLICE_PURSUIT";
type CarType = "HYPERION" | "SPECTRE" | "TITAN";

interface Achievement {
  id: string;
  title: string;
  desc: string;
  unlocked: boolean;
  icon: string;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  life: number;
  maxLife: number;
}

interface TrafficCar {
  id: number;
  x: number;
  y: number;
  speed: number;
  lane: number;
  width: number;
  height: number;
  color: string;
  isPolice: boolean;
  hp: number;
}

interface PowerUp {
  x: number;
  y: number;
  type: "NITRO" | "SHIELD" | "COIN" | "EMP";
  radius: number;
}

interface FloatingText {
  id: number;
  text: string;
  x: number;
  y: number;
  color: string;
  alpha: number;
  life: number;
}

const CAR_CONFIGS: Record<CarType, { name: string; desc: string; topSpeed: number; handling: number; hp: number; color: string; icon: string }> = {
  HYPERION: {
    name: "Hyperion GT",
    desc: "Balanced cyberpunk supercar with excellent drift stability.",
    topSpeed: 14,
    handling: 7.5,
    hp: 100,
    color: "#00f3ff",
    icon: "🏎️"
  },
  SPECTRE: {
    name: "Phantom Speeder",
    desc: "Ultra-light frame with maximum nitro acceleration & speed.",
    topSpeed: 17,
    handling: 9.0,
    hp: 75,
    color: "#ff00e5",
    icon: "⚡"
  },
  TITAN: {
    name: "Titan Enforcer",
    desc: "Heavy armored interceptor (+50 HP) capable of shoving traffic.",
    topSpeed: 12.5,
    handling: 6.0,
    hp: 150,
    color: "#a855f7",
    icon: "🛡️"
  }
};

export default function NeonDriftGame() {
  // Navigation & States
  const [gameState, setGameState] = useState<GameState>("MENU");
  const [gameMode, setGameMode] = useState<GameMode>("ENDLESS_DRIFT");
  const [selectedCar, setSelectedCar] = useState<CarType>("HYPERION");
  const [isMuted, setIsMuted] = useState(false);
  const [highScore, setHighScore] = useState(0);
  const [coins, setCoins] = useState(0);
  const [score, setScore] = useState(0);
  const [driftScore, setDriftScore] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(60);

  // Upgrades
  const [upgrades, setUpgrades] = useState({
    speedLevel: 1,
    driftLevel: 1,
    nitroLevel: 1,
    armorLevel: 1
  });

  // Live Stats
  const [carHp, setCarHp] = useState(100);
  const [carMaxHp, setCarMaxHp] = useState(100);
  const [nitroMeter, setNitroMeter] = useState(100);
  const [currentSpeedKmh, setCurrentSpeedKmh] = useState(0);
  const [isNitroActive, setIsNitroActive] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Achievements
  const [achievements, setAchievements] = useState<Achievement[]>([
    { id: "first_drift", title: "Drift King", desc: "Perform your first high-speed power slide", unlocked: false, icon: "🏎️" },
    { id: "nitro_boost", title: "Supersonic", desc: "Reach 300 KM/H with Nitro Boost", unlocked: false, icon: "⚡" },
    { id: "traffic_dodger", title: "Ghost Driver", desc: "Pass 25 vehicles without taking damage", unlocked: false, icon: "👻" },
    { id: "tycoon", title: "Cyber Racer", desc: "Accumulate 250 Cyber Credits", unlocked: false, icon: "💎" },
    { id: "high_scorer", title: "Neon Legend", desc: "Score 15,000 points in a single drift run", unlocked: false, icon: "🔥" }
  ]);

  // Canvas Refs
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameIdRef = useRef<number | null>(null);

  // Game Input Controls
  const keysRef = useRef<{ [key: string]: boolean }>({});
  const touchJoystickRef = useRef<{ active: boolean; dx: number }>({ active: false, dx: 0 });
  const touchNitroRef = useRef<boolean>(false);
  const touchDriftRef = useRef<boolean>(false);

  const gameLoopState = useRef({
    car: {
      x: 500,
      y: 520,
      vx: 0,
      vy: 0,
      angle: 0,
      speed: 0,
      maxSpeed: 14,
      hp: 100,
      maxHp: 100,
      width: 32,
      height: 60,
      nitro: 100,
      isDrifting: false,
      driftAngle: 0,
      invincibleTimer: 0
    },
    traffic: [] as TrafficCar[],
    powerups: [] as PowerUp[],
    particles: [] as Particle[],
    floatingTexts: [] as FloatingText[],
    roadOffset: 0,
    score: 0,
    driftPoints: 0,
    passedVehicles: 0,
    shake: 0,
    timeAttackTimer: 60,
    nextTrafficId: 1
  });

  // Load persistence
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedScore = localStorage.getItem("neon_drift_highscore");
      if (savedScore) setHighScore(parseInt(savedScore, 10));

      const savedCoins = localStorage.getItem("neon_drift_coins");
      if (savedCoins) setCoins(parseInt(savedCoins, 10));

      const savedUpgrades = localStorage.getItem("neon_drift_upgrades");
      if (savedUpgrades) {
        try { setUpgrades(JSON.parse(savedUpgrades)); } catch {}
      }

      const savedAch = localStorage.getItem("neon_drift_achievements");
      if (savedAch) {
        try { setAchievements(JSON.parse(savedAch)); } catch {}
      }
    }
  }, []);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const unlockAchievement = useCallback((id: string) => {
    setAchievements(prev => {
      const updated = prev.map(a => {
        if (a.id === id && !a.unlocked) {
          triggerToast(`🏆 Achievement Unlocked: ${a.title}!`);
          return { ...a, unlocked: true };
        }
        return a;
      });
      localStorage.setItem("neon_drift_achievements", JSON.stringify(updated));
      return updated;
    });
  }, []);

  // Keyboard Event Listeners
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      racingSfx.init();
      keysRef.current[e.code] = true;

      if (e.code === "KeyP" || e.code === "Escape") {
        setGameState(prev => {
          if (prev === "PLAYING") {
            racingSfx.stopEngine();
            racingSfx.stopMusic();
            return "PAUSED";
          }
          if (prev === "PAUSED") {
            racingSfx.startEngine();
            racingSfx.startMusic();
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

  // Toggle Mute
  const toggleMute = () => {
    racingSfx.muted = !isMuted;
    setIsMuted(!isMuted);
    if (isMuted && gameState === "PLAYING") {
      racingSfx.startEngine();
      racingSfx.startMusic();
    } else {
      racingSfx.stopEngine();
      racingSfx.stopMusic();
    }
  };

  const addFloatingText = (text: string, x: number, y: number, color = "#00f3ff") => {
    gameLoopState.current.floatingTexts.push({
      id: Math.random(),
      text,
      x,
      y,
      color,
      alpha: 1,
      life: 0
    });
  };

  // Start / Reset Game
  const startGame = (mode: GameMode) => {
    racingSfx.init();
    racingSfx.startEngine();
    racingSfx.startMusic();
    setGameMode(mode);
    setGameState("PLAYING");
    setScore(0);
    setDriftScore(0);
    setTimeRemaining(mode === "TIME_ATTACK" ? 60 : 0);

    const carConfig = CAR_CONFIGS[selectedCar];
    const baseHp = carConfig.hp + (upgrades.armorLevel - 1) * 20;

    setCarHp(baseHp);
    setCarMaxHp(baseHp);
    setNitroMeter(100);
    setIsNitroActive(false);

    const canvas = canvasRef.current;
    const width = canvas ? canvas.width : 1000;
    const height = canvas ? canvas.height : 680;

    gameLoopState.current = {
      car: {
        x: width / 2,
        y: height - 140,
        vx: 0,
        vy: 0,
        angle: 0,
        speed: 0,
        maxSpeed: carConfig.topSpeed + (upgrades.speedLevel - 1) * 1.5,
        hp: baseHp,
        maxHp: baseHp,
        width: 34,
        height: 64,
        nitro: 100,
        isDrifting: false,
        driftAngle: 0,
        invincibleTimer: 0
      },
      traffic: [],
      powerups: [],
      particles: [],
      floatingTexts: [],
      roadOffset: 0,
      score: 0,
      driftPoints: 0,
      passedVehicles: 0,
      shake: 0,
      timeAttackTimer: 60,
      nextTrafficId: 1
    };
  };

  // Purchase Upgrade
  const purchaseUpgrade = (type: keyof typeof upgrades, cost: number) => {
    if (coins < cost) return;
    setCoins(prev => {
      const nextCoins = prev - cost;
      localStorage.setItem("neon_drift_coins", nextCoins.toString());
      return nextCoins;
    });

    setUpgrades(prev => {
      const updated = { ...prev, [type]: prev[type] + 1 };
      localStorage.setItem("neon_drift_upgrades", JSON.stringify(updated));
      return updated;
    });

    racingSfx.playCoin();
    triggerToast("🏎️ Upgrade Complete!");
  };

  // --- CANVAS GAME PHYSICS & RENDER LOOP ---
  useEffect(() => {
    if (gameState !== "PLAYING") return;

    let lastTime = performance.now();

    const render = (now: number) => {
      const delta = (now - lastTime) / 1000;
      lastTime = now;

      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const width = canvas.width;
      const height = canvas.height;
      const state = gameLoopState.current;
      const car = state.car;

      // Clear Screen with dark synthwave glow
      ctx.fillStyle = "#090a12";
      ctx.fillRect(0, 0, width, height);

      // --- SCREEN SHAKE ---
      ctx.save();
      if (state.shake > 0) {
        const dx = (Math.random() - 0.5) * state.shake;
        const dy = (Math.random() - 0.5) * state.shake;
        ctx.translate(dx, dy);
        state.shake *= 0.88;
        if (state.shake < 0.2) state.shake = 0;
      }

      // --- DRAW HIGHWAY ROAD & NEON GRID ---
      const roadLeft = width * 0.22;
      const roadRight = width * 0.78;
      const roadWidth = roadRight - roadLeft;

      // Road asphalt backdrop
      ctx.fillStyle = "#111422";
      ctx.fillRect(roadLeft, 0, roadWidth, height);

      // Neon Guardrails
      ctx.strokeStyle = "#00f3ff";
      ctx.shadowColor = "#00f3ff";
      ctx.shadowBlur = 15;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(roadLeft, 0);
      ctx.lineTo(roadLeft, height);
      ctx.moveTo(roadRight, 0);
      ctx.lineTo(roadRight, height);
      ctx.stroke();

      // Scrolling Lane Markers
      state.roadOffset = (state.roadOffset + car.speed * 2.5) % 80;
      ctx.strokeStyle = "rgba(255, 0, 229, 0.4)";
      ctx.lineWidth = 2;
      ctx.setLineDash([30, 30]);

      for (let l = 1; l <= 3; l++) {
        const lx = roadLeft + (roadWidth / 4) * l;
        ctx.beginPath();
        ctx.moveTo(lx, -80 + state.roadOffset);
        ctx.lineTo(lx, height + 80);
        ctx.stroke();
      }
      ctx.setLineDash([]);

      // --- TIME ATTACK TIMER ---
      if (gameMode === "TIME_ATTACK") {
        state.timeAttackTimer -= delta;
        setTimeRemaining(Math.max(0, Math.ceil(state.timeAttackTimer)));
        if (state.timeAttackTimer <= 0) {
          racingSfx.stopEngine();
          racingSfx.stopMusic();
          setGameState("GAMEOVER");
        }
      }

      // --- CAR PHYSICS & INPUT ---
      let steerInput = 0;
      let accelInput = 0;

      if (keysRef.current["KeyA"] || keysRef.current["ArrowLeft"]) steerInput -= 1;
      if (keysRef.current["KeyD"] || keysRef.current["ArrowRight"]) steerInput += 1;
      if (keysRef.current["KeyW"] || keysRef.current["ArrowUp"]) accelInput += 1;
      if (keysRef.current["KeyS"] || keysRef.current["ArrowDown"]) accelInput -= 0.5;

      if (touchJoystickRef.current.active) {
        steerInput += touchJoystickRef.current.dx;
      }

      const isDriftKeyDown = keysRef.current["Space"] || touchDriftRef.current;
      const isNitroKeyDown = keysRef.current["KeyE"] || keysRef.current["ShiftLeft"] || touchNitroRef.current;

      // Nitro Boost logic
      let nitroMultiplier = 1;
      if (isNitroKeyDown && car.nitro > 0) {
        nitroMultiplier = 1.75;
        car.nitro = Math.max(0, car.nitro - 28 * delta);
        setNitroMeter(Math.round(car.nitro));
        setIsNitroActive(true);
        racingSfx.playNitro();
        state.shake = 3;

        // Nitro exhaust flames
        for (let i = 0; i < 3; i++) {
          state.particles.push({
            x: car.x + (Math.random() - 0.5) * 10,
            y: car.y + car.height / 2 + 5,
            vx: (Math.random() - 0.5) * 3,
            vy: Math.random() * 8 + 4,
            size: Math.random() * 4 + 2,
            color: "#ff00e5",
            life: 1,
            maxLife: 15
          });
        }

        if (car.speed * 20 >= 300) {
          unlockAchievement("nitro_boost");
        }
      } else {
        setIsNitroActive(false);
        // Slowly recharge nitro
        if (car.nitro < 100) {
          car.nitro = Math.min(100, car.nitro + 6 * delta);
          setNitroMeter(Math.round(car.nitro));
        }
      }

      // Acceleration & Top Speed
      const targetMaxSpeed = car.maxSpeed * nitroMultiplier;
      if (accelInput > 0) {
        car.speed = Math.min(targetMaxSpeed, car.speed + 8 * delta);
      } else if (accelInput < 0) {
        car.speed = Math.max(0, car.speed - 12 * delta);
      } else {
        car.speed = Math.max(0, car.speed - 3 * delta);
      }

      // Steering & Drift Physics
      const currentKmh = Math.round(car.speed * 18);
      setCurrentSpeedKmh(currentKmh);
      racingSfx.updateEnginePitch(car.speed / car.maxSpeed);

      car.isDrifting = isDriftKeyDown && Math.abs(steerInput) > 0.1 && car.speed > 4;

      if (car.isDrifting) {
        car.driftAngle = steerInput * 0.45;
        car.vx += steerInput * (0.8 + upgrades.driftLevel * 0.15);
        racingSfx.playDriftScreech();
        unlockAchievement("first_drift");

        // Drift smoke particles
        for (let i = 0; i < 2; i++) {
          state.particles.push({
            x: car.x - steerInput * 12,
            y: car.y + car.height / 2,
            vx: -steerInput * 4 + (Math.random() - 0.5) * 2,
            vy: Math.random() * 3 + 1,
            size: Math.random() * 5 + 3,
            color: "#00f3ff",
            life: 1,
            maxLife: 18
          });
        }

        // Score drift points
        state.driftPoints += Math.round(car.speed * 5);
        setDriftScore(state.driftPoints);
        state.score += Math.round(car.speed * 2);
        setScore(state.score);

        if (state.score >= 15000) unlockAchievement("high_scorer");
      } else {
        car.driftAngle *= 0.8;
        car.vx += steerInput * 0.5;
        car.vx *= 0.85;
      }

      car.x += car.vx;

      // Keep within road bounds
      if (car.x < roadLeft + car.width / 2) {
        car.x = roadLeft + car.width / 2;
        car.vx *= -0.5;
      }
      if (car.x > roadRight - car.width / 2) {
        car.x = roadRight - car.width / 2;
        car.vx *= -0.5;
      }

      // --- SPAWN & UPDATE TRAFFIC CARS ---
      if (Math.random() < 0.035 && state.traffic.length < 7) {
        const laneIndex = Math.floor(Math.random() * 4);
        const laneX = roadLeft + (roadWidth / 8) * (laneIndex * 2 + 1);
        const isPolice = gameMode === "POLICE_PURSUIT" && Math.random() < 0.35;
        const colors = ["#ff0055", "#a855f7", "#ffb700", "#10b981"];
        const color = isPolice ? "#3b82f6" : colors[Math.floor(Math.random() * colors.length)];

        state.traffic.push({
          id: state.nextTrafficId++,
          x: laneX,
          y: -100,
          speed: Math.random() * 3 + 2,
          lane: laneIndex,
          width: 32,
          height: 60,
          color,
          isPolice,
          hp: isPolice ? 60 : 30
        });
      }

      // Traffic Movement & Collision
      state.traffic.forEach((trafficCar, tIdx) => {
        // Move relative to player car speed
        trafficCar.y += (car.speed - trafficCar.speed) * 1.6;

        // Draw Traffic Vehicle
        ctx.save();
        ctx.translate(trafficCar.x, trafficCar.y);

        ctx.fillStyle = trafficCar.color;
        ctx.shadowColor = trafficCar.color;
        ctx.shadowBlur = 10;
        ctx.fillRect(-trafficCar.width / 2, -trafficCar.height / 2, trafficCar.width, trafficCar.height);

        // Windshield
        ctx.fillStyle = "#0f172a";
        ctx.fillRect(-trafficCar.width / 2 + 4, -trafficCar.height / 2 + 8, trafficCar.width - 8, 14);

        // Police Siren Lights
        if (trafficCar.isPolice) {
          const isRed = Math.floor(Date.now() / 150) % 2 === 0;
          ctx.fillStyle = isRed ? "#ef4444" : "#3b82f6";
          ctx.fillRect(-8, -4, 16, 8);
        }

        ctx.restore();

        // Player Collision Check
        const dx = Math.abs(car.x - trafficCar.x);
        const dy = Math.abs(car.y - trafficCar.y);

        if (dx < (car.width + trafficCar.width) / 2 - 4 && dy < (car.height + trafficCar.height) / 2 - 4) {
          state.traffic.splice(tIdx, 1);
          racingSfx.playCrash();
          state.shake = 15;

          const damage = trafficCar.isPolice ? 35 : 20;
          car.hp = Math.max(0, car.hp - damage);
          setCarHp(Math.round(car.hp));
          car.speed *= 0.4;

          addFloatingText(`CRASH -${damage}`, car.x, car.y - 30, "#ef4444");

          if (car.hp <= 0) {
            racingSfx.stopEngine();
            racingSfx.stopMusic();
            setGameState("GAMEOVER");
          }
        }

        // Passed Vehicle Score
        if (trafficCar.y > height + 80) {
          state.traffic.splice(tIdx, 1);
          state.passedVehicles += 1;
          state.score += 150;
          setScore(state.score);

          if (state.passedVehicles >= 25) {
            unlockAchievement("traffic_dodger");
          }

          if (state.score > highScore) {
            setHighScore(state.score);
            localStorage.setItem("neon_drift_highscore", state.score.toString());
          }
        }
      });

      // --- POWER-UPS SPAWN & UPDATE ---
      if (Math.random() < 0.015 && state.powerups.length < 3) {
        const laneIndex = Math.floor(Math.random() * 4);
        const laneX = roadLeft + (roadWidth / 8) * (laneIndex * 2 + 1);
        const types: PowerUp["type"][] = ["NITRO", "SHIELD", "COIN"];
        state.powerups.push({
          x: laneX,
          y: -50,
          type: types[Math.floor(Math.random() * types.length)],
          radius: 14
        });
      }

      state.powerups.forEach((pu, puIdx) => {
        pu.y += car.speed * 1.5;

        // Draw Power-up
        ctx.save();
        ctx.translate(pu.x, pu.y);
        ctx.fillStyle = pu.type === "COIN" ? "#ffb700" : pu.type === "SHIELD" ? "#00f3ff" : "#ff00e5";
        ctx.shadowColor = ctx.fillStyle;
        ctx.shadowBlur = 12;
        ctx.beginPath();
        ctx.arc(0, 0, pu.radius, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 10px sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(pu.type[0], 0, 0);
        ctx.restore();

        // Collect Power-up Check
        const dist = Math.hypot(car.x - pu.x, car.y - pu.y);
        if (dist < pu.radius + car.width / 2) {
          state.powerups.splice(puIdx, 1);
          racingSfx.playCoin();

          if (pu.type === "SHIELD") {
            car.hp = Math.min(car.maxHp, car.hp + 35);
            setCarHp(Math.round(car.hp));
            addFloatingText("ARMOR REPAIRED +35", car.x, car.y - 30, "#00f3ff");
            triggerToast("🛡️ Armor Restored +35");
          } else if (pu.type === "NITRO") {
            car.nitro = 100;
            setNitroMeter(100);
            addFloatingText("FULL NITRO RECHARGE!", car.x, car.y - 30, "#ff00e5");
            triggerToast("⚡ Full Nitro Tank!");
          } else if (pu.type === "COIN") {
            setCoins(prev => {
              const nextCoins = prev + 30;
              localStorage.setItem("neon_drift_coins", nextCoins.toString());
              if (nextCoins >= 250) unlockAchievement("tycoon");
              return nextCoins;
            });
            addFloatingText("+30 CREDITS 💎", car.x, car.y - 30, "#ffb700");
          }
        }

        if (pu.y > height + 50) {
          state.powerups.splice(puIdx, 1);
        }
      });

      // --- DRAW PLAYER CAR ---
      ctx.save();
      ctx.translate(car.x, car.y);
      ctx.rotate(car.driftAngle);

      // Tail lights glow
      ctx.fillStyle = isNitroActive ? "#ff00e5" : "#ff0055";
      ctx.shadowColor = ctx.fillStyle;
      ctx.shadowBlur = 12;
      ctx.fillRect(-car.width / 2 + 4, car.height / 2 - 4, 8, 4);
      ctx.fillRect(car.width / 2 - 12, car.height / 2 - 4, 8, 4);

      // Main Car Body
      ctx.fillStyle = CAR_CONFIGS[selectedCar].color;
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 2;
      ctx.fillRect(-car.width / 2, -car.height / 2, car.width, car.height);
      ctx.strokeRect(-car.width / 2, -car.height / 2, car.width, car.height);

      // Roof / Canopy
      ctx.fillStyle = "#0f172a";
      ctx.fillRect(-car.width / 2 + 4, -car.height / 2 + 14, car.width - 8, 22);

      ctx.restore();

      // --- DRAW FLOATING TEXT ---
      state.floatingTexts.forEach((ft, ftIdx) => {
        ft.y -= 1.2;
        ft.life += 1;
        ft.alpha = Math.max(0, 1 - ft.life / 40);

        ctx.fillStyle = ft.color;
        ctx.globalAlpha = ft.alpha;
        ctx.font = "bold 13px monospace";
        ctx.textAlign = "center";
        ctx.fillText(ft.text, ft.x, ft.y);
        ctx.globalAlpha = 1.0;

        if (ft.life >= 40) {
          state.floatingTexts.splice(ftIdx, 1);
        }
      });

      // --- DRAW PARTICLES ---
      state.particles.forEach((part, pIdx) => {
        part.x += part.vx;
        part.y += part.vy;
        part.life += 1;

        const alpha = 1 - part.life / part.maxLife;
        ctx.fillStyle = part.color;
        ctx.globalAlpha = Math.max(0, alpha);
        ctx.beginPath();
        ctx.arc(part.x, part.y, part.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1.0;

        if (part.life >= part.maxLife) {
          state.particles.splice(pIdx, 1);
        }
      });

      ctx.restore();

      animFrameIdRef.current = requestAnimationFrame(render);
    };

    animFrameIdRef.current = requestAnimationFrame(render);
    return () => {
      if (animFrameIdRef.current) cancelAnimationFrame(animFrameIdRef.current);
    };
  }, [gameState, gameMode, upgrades, selectedCar, highScore, unlockAchievement]);

  return (
    <div className="relative w-full h-screen bg-slate-950 text-slate-100 overflow-hidden flex flex-col font-sans select-none">
      {/* Ambience glow */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-purple-900/20 via-slate-950 to-slate-950 pointer-events-none" />

      {/* HEADER BAR */}
      <header className="relative z-20 flex items-center justify-between px-6 py-4 bg-slate-900/60 backdrop-blur-md border-b border-purple-500/20">
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
            <Car className="w-6 h-6 text-purple-400 animate-pulse" />
            <h1 className="text-lg font-black tracking-wider bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 bg-clip-text text-transparent uppercase">
              Neon Drift 2099
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="flex items-center gap-4 text-xs font-mono">
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-950/50 border border-cyan-500/30 text-cyan-400">
              <Trophy className="w-3.5 h-3.5" />
              <span>HIGH: {highScore.toLocaleString()}</span>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-950/50 border border-amber-500/30 text-amber-400">
              <Sparkles className="w-3.5 h-3.5" />
              <span>CREDITS: {coins}</span>
            </div>
          </div>

          <button
            onClick={toggleMute}
            className="p-2 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-cyan-400 transition"
            title="Toggle Audio"
          >
            {isMuted ? <VolumeX className="w-5 h-5 text-red-400" /> : <Volume2 className="w-5 h-5 text-cyan-400" />}
          </button>
        </div>
      </header>

      {/* TOAST NOTIFICATION */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute top-20 left-1/2 -translate-x-1/2 z-50 px-5 py-2.5 rounded-xl bg-slate-900/90 border border-purple-400/50 shadow-lg shadow-purple-500/20 backdrop-blur-md text-purple-300 text-sm font-semibold flex items-center gap-2"
          >
            <Sparkles className="w-4 h-4 text-amber-400 animate-spin" />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* MAIN GAME CONTAINER */}
      <div className="relative flex-1 flex items-center justify-center p-4">
        {/* CANVAS */}
        <canvas
          ref={canvasRef}
          width={1000}
          height={680}
          className="rounded-2xl border border-purple-500/30 shadow-2xl shadow-purple-950/50 bg-slate-950 max-w-full max-h-full object-contain"
        />

        {/* HUD OVERLAY (When Playing) */}
        {gameState === "PLAYING" && (
          <div className="absolute inset-4 pointer-events-none flex flex-col justify-between p-6">
            {/* Top HUD */}
            <div className="flex justify-between items-start">
              {/* Car Armor & Nitro Gauge */}
              <div className="flex flex-col gap-2 w-64 p-3 rounded-xl bg-slate-900/70 border border-slate-800 backdrop-blur-md">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="flex items-center gap-1 text-red-400 font-bold">
                    <Shield className="w-3.5 h-3.5" /> CHASSIS ARMOR
                  </span>
                  <span>{carHp} / {carMaxHp}</span>
                </div>
                <div className="w-full bg-slate-950 h-2.5 rounded-full overflow-hidden border border-slate-800">
                  <div
                    className="bg-gradient-to-r from-red-600 to-pink-500 h-full transition-all duration-200"
                    style={{ width: `${Math.max(0, (carHp / carMaxHp) * 100)}%` }}
                  />
                </div>

                <div className="flex items-center justify-between text-xs font-mono mt-1">
                  <span className="flex items-center gap-1 text-purple-400 font-bold">
                    <Zap className="w-3.5 h-3.5" /> NITRO BOOST
                  </span>
                  <span>{nitroMeter}%</span>
                </div>
                <div className="w-full bg-slate-950 h-2.5 rounded-full overflow-hidden border border-slate-800">
                  <div
                    className="bg-gradient-to-r from-purple-500 to-pink-500 h-full transition-all duration-150"
                    style={{ width: `${nitroMeter}%` }}
                  />
                </div>
              </div>

              {/* Speedometer & Score */}
              <div className="flex flex-col items-end gap-2">
                <div className="px-6 py-3 rounded-2xl bg-slate-900/80 border border-purple-500/30 backdrop-blur-md text-right flex items-center gap-4">
                  <div>
                    <div className="text-[10px] font-mono text-slate-400 uppercase">Speed</div>
                    <div className="text-3xl font-black text-purple-400 font-mono tracking-wider">
                      {currentSpeedKmh} <span className="text-xs text-slate-400">KM/H</span>
                    </div>
                  </div>
                  <div className="h-8 w-px bg-slate-800" />
                  <div>
                    <div className="text-[10px] font-mono text-slate-400 uppercase">Score</div>
                    <div className="text-2xl font-black text-cyan-400 font-mono tracking-wider">
                      {score.toLocaleString()}
                    </div>
                  </div>
                </div>

                {gameMode === "TIME_ATTACK" && (
                  <div className="px-4 py-1.5 rounded-lg bg-pink-950/70 border border-pink-500/40 text-pink-400 font-mono font-bold text-sm">
                    ⏱️ TIME LEFT: {timeRemaining}s
                  </div>
                )}

                <div className="flex items-center gap-2 pointer-events-auto">
                  <button
                    onClick={() => {
                      racingSfx.stopEngine();
                      racingSfx.stopMusic();
                      setGameState("PAUSED");
                    }}
                    className="p-2 rounded-xl bg-slate-900/70 border border-slate-800 hover:bg-slate-800 text-slate-300 transition"
                  >
                    <Pause className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Mobile Touch Controls Overlay */}
            <div className="flex justify-between items-end pointer-events-auto md:hidden pb-4 px-2">
              <div
                className="w-28 h-28 rounded-full bg-slate-900/60 border border-purple-500/30 backdrop-blur-md flex items-center justify-center touch-none"
                onTouchStart={e => {
                  const touch = e.touches[0];
                  const rect = e.currentTarget.getBoundingClientRect();
                  const cx = rect.left + rect.width / 2;
                  touchJoystickRef.current = {
                    active: true,
                    dx: (touch.clientX - cx) / (rect.width / 2)
                  };
                }}
                onTouchMove={e => {
                  const touch = e.touches[0];
                  const rect = e.currentTarget.getBoundingClientRect();
                  const cx = rect.left + rect.width / 2;
                  touchJoystickRef.current = {
                    active: true,
                    dx: Math.max(-1, Math.min(1, (touch.clientX - cx) / (rect.width / 2)))
                  };
                }}
                onTouchEnd={() => {
                  touchJoystickRef.current = { active: false, dx: 0 };
                }}
              >
                <Navigation className="w-8 h-8 text-purple-400/50" />
              </div>

              <div className="flex gap-3">
                <button
                  onTouchStart={() => (touchDriftRef.current = true)}
                  onTouchEnd={() => (touchDriftRef.current = false)}
                  className="w-16 h-16 rounded-full bg-cyan-600/80 active:bg-cyan-500 border border-cyan-400 text-white font-bold text-xs flex items-center justify-center shadow-lg"
                >
                  DRIFT
                </button>
                <button
                  onTouchStart={() => (touchNitroRef.current = true)}
                  onTouchEnd={() => (touchNitroRef.current = false)}
                  className="w-16 h-16 rounded-full bg-purple-600/80 active:bg-purple-500 border border-purple-400 text-white font-bold text-xs flex items-center justify-center shadow-lg"
                >
                  NITRO
                </button>
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
              className="max-w-xl w-full p-8 rounded-3xl bg-slate-900/90 border border-purple-500/30 shadow-2xl shadow-purple-950/80 text-center flex flex-col items-center gap-6"
            >
              <div className="relative">
                <div className="absolute -inset-1 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 opacity-75 blur" />
                <div className="relative p-4 rounded-full bg-slate-950 border border-purple-400">
                  <Car className="w-12 h-12 text-purple-400" />
                </div>
              </div>

              <div>
                <h2 className="text-3xl font-black tracking-wider bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 bg-clip-text text-transparent uppercase">
                  NEON DRIFT 2099
                </h2>
                <p className="text-sm text-slate-400 mt-2 max-w-md">
                  Tear up the cybernetic highway in high-speed drift battles. Outrun police interceptors, dodge dense traffic, and unleash nitro power!
                </p>
              </div>

              {/* Car Garage Bar */}
              <div className="w-full flex flex-col gap-2">
                <div className="text-xs font-mono text-slate-400 uppercase tracking-widest">Select Cyber Car</div>
                <div className="grid grid-cols-3 gap-2">
                  {(["HYPERION", "SPECTRE", "TITAN"] as CarType[]).map(car => (
                    <button
                      key={car}
                      onClick={() => setSelectedCar(car)}
                      className={cn(
                        "p-3 rounded-xl border text-left transition flex flex-col gap-1",
                        selectedCar === car
                          ? "bg-purple-950/60 border-purple-400 text-purple-300 shadow-md shadow-purple-500/20"
                          : "bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200"
                      )}
                    >
                      <div className="flex items-center gap-1.5 font-bold text-xs">
                        <span>{CAR_CONFIGS[car].icon}</span>
                        <span>{CAR_CONFIGS[car].name}</span>
                      </div>
                      <div className="text-[10px] text-slate-400 leading-tight">{CAR_CONFIGS[car].desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Game Mode Selector */}
              <div className="w-full flex flex-col gap-3">
                <div className="text-xs font-mono text-slate-400 uppercase tracking-widest">Select Game Mode</div>
                <div className="grid grid-cols-3 gap-3">
                  <button
                    onClick={() => startGame("ENDLESS_DRIFT")}
                    className="p-4 rounded-2xl bg-gradient-to-b from-purple-950/80 to-slate-900 border border-purple-500/40 hover:border-purple-400 hover:scale-105 transition flex flex-col items-center gap-2 group"
                  >
                    <Flame className="w-6 h-6 text-purple-400 group-hover:animate-bounce" />
                    <span className="text-xs font-bold text-slate-200">Endless Drift</span>
                  </button>

                  <button
                    onClick={() => startGame("POLICE_PURSUIT")}
                    className="p-4 rounded-2xl bg-gradient-to-b from-pink-950/80 to-slate-900 border border-pink-500/40 hover:border-pink-400 hover:scale-105 transition flex flex-col items-center gap-2 group"
                  >
                    <ShieldAlert className="w-6 h-6 text-pink-400 group-hover:animate-bounce" />
                    <span className="text-xs font-bold text-slate-200">Police Pursuit</span>
                  </button>

                  <button
                    onClick={() => startGame("TIME_ATTACK")}
                    className="p-4 rounded-2xl bg-gradient-to-b from-cyan-950/80 to-slate-900 border border-cyan-500/40 hover:border-cyan-400 hover:scale-105 transition flex flex-col items-center gap-2 group"
                  >
                    <Radio className="w-6 h-6 text-cyan-400 group-hover:animate-bounce" />
                    <span className="text-xs font-bold text-slate-200">Time Attack</span>
                  </button>
                </div>
              </div>

              {/* Secondary Actions */}
              <div className="flex gap-4 w-full">
                <button
                  onClick={() => setGameState("SHOP")}
                  className="flex-1 py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-purple-400 font-bold text-sm flex items-center justify-center gap-2 transition"
                >
                  <ShoppingBag className="w-4 h-4" />
                  <span>Garage Upgrades</span>
                </button>
                <button
                  onClick={() => setGameState("ACHIEVEMENTS")}
                  className="flex-1 py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-amber-400 font-bold text-sm flex items-center justify-center gap-2 transition"
                >
                  <Trophy className="w-4 h-4" />
                  <span>Achievements</span>
                </button>
              </div>

              {/* Controls guide */}
              <div className="w-full p-4 rounded-xl bg-slate-950/60 border border-slate-800 text-xs text-slate-400 flex justify-around font-mono">
                <div><span className="text-purple-400 font-bold">A/D / ARROWS</span> Steer</div>
                <div><span className="text-purple-400 font-bold">W / S</span> Accel/Brake</div>
                <div><span className="text-purple-400 font-bold">SPACE</span> Drift</div>
                <div><span className="text-purple-400 font-bold">E / SHIFT</span> Nitro</div>
              </div>
            </motion.div>
          </div>
        )}

        {/* SHOP / UPGRADES OVERLAY */}
        {gameState === "SHOP" && (
          <div className="absolute inset-0 z-30 flex items-center justify-center p-6 bg-slate-950/90 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="max-w-2xl w-full p-8 rounded-3xl bg-slate-900 border border-purple-500/30 shadow-2xl flex flex-col gap-6"
            >
              <div className="flex justify-between items-center border-b border-slate-800 pb-4">
                <div className="flex items-center gap-3">
                  <ShoppingBag className="w-6 h-6 text-purple-400" />
                  <h2 className="text-xl font-bold text-slate-100">Cyber Garage Performance Upgrades</h2>
                </div>
                <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-amber-950/50 border border-amber-500/40 text-amber-400 font-mono text-sm font-bold">
                  <Sparkles className="w-4 h-4" />
                  <span>{coins} Credits</span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Speed Level */}
                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex justify-between items-center">
                  <div>
                    <div className="text-sm font-bold text-purple-300">Engine Tuning (Top Speed)</div>
                    <div className="text-xs text-slate-400">Level {upgrades.speedLevel} / 5</div>
                  </div>
                  <button
                    disabled={upgrades.speedLevel >= 5 || coins < upgrades.speedLevel * 100}
                    onClick={() => purchaseUpgrade("speedLevel", upgrades.speedLevel * 100)}
                    className="px-4 py-2 rounded-xl bg-purple-500/20 hover:bg-purple-500/40 disabled:opacity-40 text-purple-300 text-xs font-bold border border-purple-500/40 transition"
                  >
                    {upgrades.speedLevel >= 5 ? "MAX" : `Upgrade (${upgrades.speedLevel * 100} 💎)`}
                  </button>
                </div>

                {/* Drift Level */}
                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex justify-between items-center">
                  <div>
                    <div className="text-sm font-bold text-cyan-300">Drift Tires & Traction</div>
                    <div className="text-xs text-slate-400">Level {upgrades.driftLevel} / 5</div>
                  </div>
                  <button
                    disabled={upgrades.driftLevel >= 5 || coins < upgrades.driftLevel * 90}
                    onClick={() => purchaseUpgrade("driftLevel", upgrades.driftLevel * 90)}
                    className="px-4 py-2 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/40 disabled:opacity-40 text-cyan-300 text-xs font-bold border border-cyan-500/40 transition"
                  >
                    {upgrades.driftLevel >= 5 ? "MAX" : `Upgrade (${upgrades.driftLevel * 90} 💎)`}
                  </button>
                </div>

                {/* Nitro Tank */}
                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex justify-between items-center">
                  <div>
                    <div className="text-sm font-bold text-pink-300">Nitro Injector Output</div>
                    <div className="text-xs text-slate-400">Level {upgrades.nitroLevel} / 5</div>
                  </div>
                  <button
                    disabled={upgrades.nitroLevel >= 5 || coins < upgrades.nitroLevel * 110}
                    onClick={() => purchaseUpgrade("nitroLevel", upgrades.nitroLevel * 110)}
                    className="px-4 py-2 rounded-xl bg-pink-500/20 hover:bg-pink-500/40 disabled:opacity-40 text-pink-300 text-xs font-bold border border-pink-500/40 transition"
                  >
                    {upgrades.nitroLevel >= 5 ? "MAX" : `Upgrade (${upgrades.nitroLevel * 110} 💎)`}
                  </button>
                </div>

                {/* Armor Level */}
                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex justify-between items-center">
                  <div>
                    <div className="text-sm font-bold text-blue-300">Chassis Armor Plating</div>
                    <div className="text-xs text-slate-400">Level {upgrades.armorLevel} / 5</div>
                  </div>
                  <button
                    disabled={upgrades.armorLevel >= 5 || coins < upgrades.armorLevel * 85}
                    onClick={() => purchaseUpgrade("armorLevel", upgrades.armorLevel * 85)}
                    className="px-4 py-2 rounded-xl bg-blue-500/20 hover:bg-blue-500/40 disabled:opacity-40 text-blue-300 text-xs font-bold border border-blue-500/40 transition"
                  >
                    {upgrades.armorLevel >= 5 ? "MAX" : `Upgrade (${upgrades.armorLevel * 85} 💎)`}
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

        {/* ACHIEVEMENTS OVERLAY */}
        {gameState === "ACHIEVEMENTS" && (
          <div className="absolute inset-0 z-30 flex items-center justify-center p-6 bg-slate-950/90 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="max-w-xl w-full p-8 rounded-3xl bg-slate-900 border border-amber-500/30 shadow-2xl flex flex-col gap-6"
            >
              <div className="flex justify-between items-center border-b border-slate-800 pb-4">
                <div className="flex items-center gap-3">
                  <Trophy className="w-6 h-6 text-amber-400" />
                  <h2 className="text-xl font-bold text-slate-100">Driver Badges & Trophies</h2>
                </div>
                <div className="text-xs font-mono text-amber-400 font-bold px-3 py-1 rounded-full bg-amber-950/50 border border-amber-500/40">
                  {achievements.filter(a => a.unlocked).length} / {achievements.length} UNLOCKED
                </div>
              </div>

              <div className="flex flex-col gap-3 max-h-[340px] overflow-y-auto pr-1">
                {achievements.map(ach => (
                  <div
                    key={ach.id}
                    className={cn(
                      "p-4 rounded-2xl border flex items-center gap-4 transition",
                      ach.unlocked
                        ? "bg-amber-950/20 border-amber-500/40 text-slate-100"
                        : "bg-slate-950/60 border-slate-800 text-slate-500"
                    )}
                  >
                    <div className="text-3xl p-2 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center">
                      {ach.icon}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm">{ach.title}</span>
                        {ach.unlocked && (
                          <span className="text-[10px] uppercase tracking-wider font-mono font-bold text-amber-400 bg-amber-950/60 px-2 py-0.5 rounded-full border border-amber-500/30">
                            UNLOCKED
                          </span>
                        )}
                      </div>
                      <p className="text-xs mt-0.5 text-slate-400">{ach.desc}</p>
                    </div>
                  </div>
                ))}
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

        {/* PAUSE OVERLAY */}
        {gameState === "PAUSED" && (
          <div className="absolute inset-0 z-30 flex items-center justify-center p-6 bg-slate-950/80 backdrop-blur-md">
            <div className="max-w-md w-full p-6 rounded-3xl bg-slate-900 border border-slate-800 text-center flex flex-col gap-4">
              <h3 className="text-2xl font-bold text-slate-100">SYSTEM PAUSED</h3>
              <div className="flex flex-col gap-3">
                <button
                  onClick={() => {
                    racingSfx.startEngine();
                    racingSfx.startMusic();
                    setGameState("PLAYING");
                  }}
                  className="py-3 rounded-xl bg-purple-500 hover:bg-purple-400 text-slate-950 font-bold transition"
                >
                  Resume Race
                </button>
                <button
                  onClick={() => startGame(gameMode)}
                  className="py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold transition flex items-center justify-center gap-2"
                >
                  <RotateCcw className="w-4 h-4" /> Restart Race
                </button>
                <button
                  onClick={() => {
                    racingSfx.stopEngine();
                    racingSfx.stopMusic();
                    setGameState("MENU");
                  }}
                  className="py-3 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200 transition"
                >
                  Abort to Main Menu
                </button>
              </div>
            </div>
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
                <ShieldAlert className="w-10 h-10" />
              </div>

              <div>
                <h3 className="text-2xl font-black text-red-400 uppercase tracking-wider">VEHICLE WRECKED</h3>
                <p className="text-xs text-slate-400 mt-1">Your chassis sustained critical collision damage</p>
              </div>

              <div className="w-full p-4 rounded-2xl bg-slate-950 border border-slate-800 flex flex-col gap-2 font-mono text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-400">Final Score</span>
                  <span className="text-purple-400 font-bold">{score.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Drift Points</span>
                  <span className="text-cyan-400 font-bold">{driftScore.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">High Score</span>
                  <span className="text-amber-400 font-bold">{highScore.toLocaleString()}</span>
                </div>
              </div>

              <div className="flex gap-3 w-full">
                <button
                  onClick={() => startGame(gameMode)}
                  className="flex-1 py-3 rounded-xl bg-purple-500 hover:bg-purple-400 text-slate-950 font-bold flex items-center justify-center gap-2 transition"
                >
                  <RotateCcw className="w-4 h-4" /> Try Again
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
