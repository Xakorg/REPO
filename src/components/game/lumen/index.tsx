"use client";

import React, { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Trophy,
  Volume2,
  VolumeX,
  ArrowLeft,
  Sun,
  Zap,
  Users,
  User,
  ShoppingBag,
  Shield,
  Sparkles,
  Award,
  Settings,
  Radio,
  Crosshair,
  Flame,
  Globe,
  Plus,
  RefreshCw,
  Cpu,
  Layers,
  Lock,
  CheckCircle,
  BarChart3,
  Sliders,
  ChevronRight,
  Wifi,
  SlidersHorizontal,
} from "lucide-react";
import Link from "next/link";
import { db } from "@/lib/firebase";
import { collection, addDoc, query, orderBy, limit, onSnapshot } from "firebase/firestore";

// ==========================================
// 1. ADVANCED WEBAUDIO SYNTHESIZER ENGINE
// ==========================================
class LumenAudioSynth {
  ctx: AudioContext | null = null;
  muted: boolean = false;
  sfxVolume: number = 0.8;

  init() {
    if (!this.ctx) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === "suspended") {
      this.ctx.resume();
    }
  }

  playLaserBeam() {
    if (this.muted || !this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(880, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(220, this.ctx.currentTime + 0.12);
    gain.gain.setValueAtTime(0.15 * this.sfxVolume, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.12);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.12);
  }

  playReflectSound() {
    if (this.muted || !this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(523.25, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(1046.5, this.ctx.currentTime + 0.15);
    gain.gain.setValueAtTime(0.18 * this.sfxVolume, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.15);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.15);
  }

  playOverdriveSurge() {
    if (this.muted || !this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = "triangle";
    osc.frequency.setValueAtTime(440, this.ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(1760, this.ctx.currentTime + 0.3);
    gain.gain.setValueAtTime(0.2 * this.sfxVolume, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.3);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.3);
  }

  playShardCollect() {
    if (this.muted || !this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(659.25, this.ctx.currentTime);
    osc.frequency.setValueAtTime(987.77, this.ctx.currentTime + 0.08);
    gain.gain.setValueAtTime(0.15 * this.sfxVolume, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.2);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.2);
  }

  playShieldAbsorb() {
    if (this.muted || !this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = "square";
    osc.frequency.setValueAtTime(300, this.ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(600, this.ctx.currentTime + 0.18);
    gain.gain.setValueAtTime(0.18 * this.sfxVolume, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.18);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.18);
  }

  playDisruptionCrash() {
    if (this.muted || !this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(140, this.ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(30, this.ctx.currentTime + 0.4);
    gain.gain.setValueAtTime(0.25 * this.sfxVolume, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.4);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.4);
  }
}

const audioSynth = new LumenAudioSynth();

// ==========================================
// 2. DATA TYPES & INTERFACES
// ==========================================
export type LumenMenuTab = "play" | "armory" | "online" | "leaderboard" | "achievements" | "settings";
export type LumenGameMode = "tactical_campaign" | "arena_duel" | "endless_waves";

export interface LeaderboardEntry {
  id: string;
  name: string;
  score: number;
  mode: string;
  date?: string;
}

export interface OnlineRoom {
  id: string;
  name: string;
  host: string;
  players: number;
  maxPlayers: number;
  ping: number;
  mode: string;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  rewardShards: number;
  unlocked: boolean;
  progress: number;
  maxProgress: number;
}

export interface ShopItem {
  id: string;
  name: string;
  category: "beam" | "shield" | "drone" | "core";
  description: string;
  costShards: number;
  level: number;
  maxLevel: number;
  iconName: string;
}

export interface FloatingTextFX {
  id: number;
  text: string;
  x: number;
  y: number;
  color: string;
  alpha: number;
  scale: number;
}

export interface PlasmaBeam {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  power: number;
  reflectionsLeft: number;
}

export interface MirrorNode {
  id: number;
  x: number;
  y: number;
  angle: number;
  radius: number;
}

export interface TargetNode {
  id: number;
  x: number;
  y: number;
  radius: number;
  color: string;
  vx: number;
  vy: number;
  hp: number;
  maxHp: number;
}

export interface CompanionDrone {
  x: number;
  y: number;
  angle: number;
  orbitRadius: number;
}

// ==========================================
// 3. MAIN COMPONENT DEFINITION
// ==========================================
export default function LumenGame() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // System & Game States
  const [gameState, setGameState] = useState<"menu" | "playing" | "game_over">("menu");
  const [activeTab, setActiveTab] = useState<LumenMenuTab>("play");
  const [selectedMode, setSelectedMode] = useState<LumenGameMode>("tactical_campaign");
  const [isMobileScreen, setIsMobileScreen] = useState(false);

  // Player Stats & Currencies
  const [lumenShards, setLumenShards] = useState(250);
  const [scoreP1, setScoreP1] = useState(0);
  const [scoreP2, setScoreP2] = useState(0);
  const [comboStreak, setComboStreak] = useState(0);
  const [multiplier, setMultiplier] = useState(1);
  const [overdriveEnergy, setOverdriveEnergy] = useState(0);
  const [isOverdriveActive, setIsOverdriveActive] = useState(false);
  const [screenShake, setScreenShake] = useState(0);

  // Player Info & Leaderboard
  const [playerName, setPlayerName] = useState("CYBER_AGENT");
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [onlineRooms, setOnlineRooms] = useState<OnlineRoom[]>([]);
  const [isSearchingRooms, setIsSearchingRooms] = useState(false);

  // Settings State
  const [settings, setSettings] = useState({
    sfxVolume: 80,
    particleQuality: "high",
    screenShakeIntensity: 100,
    touchSize: "medium",
  });

  // Shop Upgrades
  const [shopItems, setShopItems] = useState<ShopItem[]>([
    {
      id: "beam_focus",
      name: "PLASMA BEAM FOCUS",
      category: "beam",
      description: "Increases beam velocity and light penetration through energy nodes.",
      costShards: 50,
      level: 1,
      maxLevel: 5,
      iconName: "Zap",
    },
    {
      id: "void_shield",
      name: "VOID SHIELD CHARGER",
      category: "shield",
      description: "Absorbs incoming hazard strikes and reflects kinetic energy.",
      costShards: 80,
      level: 0,
      maxLevel: 4,
      iconName: "Shield",
    },
    {
      id: "companion_drone",
      name: "TACTICAL COMPANION DRONE",
      category: "drone",
      description: "Orbits your central core and automatically fires auto-aim plasma lasers.",
      costShards: 120,
      level: 0,
      maxLevel: 3,
      iconName: "Cpu",
    },
    {
      id: "overdrive_core",
      name: "QUANTUM OVERDRIVE CORE",
      category: "core",
      description: "Accelerates overdrive meter build-up and doubles multiplier cap.",
      costShards: 150,
      level: 1,
      maxLevel: 5,
      iconName: "Sparkles",
    },
  ]);

  // Achievements
  const [achievements, setAchievements] = useState<Achievement[]>([
    {
      id: "first_strike",
      title: "FIRST REFRACTION",
      description: "Destroy 10 target nodes in Tactical Campaign.",
      rewardShards: 50,
      unlocked: true,
      progress: 10,
      maxProgress: 10,
    },
    {
      id: "combo_master",
      title: "LIGHT SPECTRUM MASTER",
      description: "Reach a 15x Combo Streak during gameplay.",
      rewardShards: 100,
      unlocked: false,
      progress: 6,
      maxProgress: 15,
    },
    {
      id: "shard_collector",
      title: "SHARD HARVESTER",
      description: "Accumulate a total of 500 Lumen Shards.",
      rewardShards: 150,
      unlocked: false,
      progress: 250,
      maxProgress: 500,
    },
    {
      id: "overdrive_surge",
      title: "QUANTUM SURGE",
      description: "Activate Overdrive Mode 5 times.",
      rewardShards: 200,
      unlocked: false,
      progress: 2,
      maxProgress: 5,
    },
  ]);

  // Responsive Mobile Check
  useEffect(() => {
    const checkMobile = () => {
      setIsMobileScreen(window.innerWidth <= 768 && window.matchMedia("(pointer: coarse)").matches);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Engine Physics & State Ref
  const engineRef = useRef({
    keys: {
      p1Up: false,
      p1Down: false,
      p1Left: false,
      p1Right: false,
      p1Fire: false,
      p1Overdrive: false,
      p2Up: false,
      p2Down: false,
      p2Left: false,
      p2Right: false,
      p2Fire: false,
    },
    player1: {
      x: 400,
      y: 300,
      vx: 0,
      vy: 0,
      angle: 0,
      speed: 0,
      shieldCharges: 0,
      droneCount: 0,
      droneAngle: 0,
    },
    player2: {
      x: 500,
      y: 300,
      vx: 0,
      vy: 0,
      angle: Math.PI,
      speed: 0,
      shieldCharges: 0,
    },
    beams: [] as PlasmaBeam[],
    targets: [] as TargetNode[],
    mirrors: [] as MirrorNode[],
    floatingTexts: [] as FloatingTextFX[],
    particles: [] as { x: number; y: number; vx: number; vy: number; color: string; life: number }[],
    shards: [] as { x: number; y: number; radius: number; value: number }[],
  });

  // Firestore Leaderboard Subscription
  useEffect(() => {
    try {
      const q = query(collection(db, "lumen_leaderboard"), orderBy("score", "desc"), limit(10));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const entries: LeaderboardEntry[] = [];
        snapshot.forEach((doc) => {
          entries.push({ id: doc.id, ...doc.data() } as LeaderboardEntry);
        });
        setLeaderboard(entries);
      });
      return () => unsubscribe();
    } catch (e) {
      console.warn("Firestore offline mode active:", e);
    }
  }, []);

  // Online Room Generation Simulation
  const refreshRooms = () => {
    setIsSearchingRooms(true);
    setTimeout(() => {
      setOnlineRooms([
        { id: "room_1", name: "CYBER MATRIX LOBBY", host: "Neo_Vanguard", players: 1, maxPlayers: 2, ping: 24, mode: "Arena Duel" },
        { id: "room_2", name: "SPECTRUM RIFT #04", host: "Quantum_Aegis", players: 1, maxPlayers: 2, ping: 42, mode: "Arena Duel" },
        { id: "room_3", name: "ENDLESS SURGE PROS", host: "Hyper_Solace", players: 1, maxPlayers: 4, ping: 18, mode: "Endless Waves" },
      ]);
      setIsSearchingRooms(false);
    }, 600);
  };

  useEffect(() => {
    refreshRooms();
  }, []);

  // Save Score to Firestore
  const saveLeaderboardScore = async () => {
    if (!playerName.trim() || scoreP1 <= 0) return;
    try {
      await addDoc(collection(db, "lumen_leaderboard"), {
        name: playerName.trim().substring(0, 14),
        score: scoreP1,
        mode: selectedMode,
        date: new Date().toLocaleDateString(),
      });
    } catch (e) {
      console.warn("Error saving score:", e);
    }
  };

  // Helper Floating Text FX Generator
  const triggerFloatingText = (text: string, x: number, y: number, color: string = "#38bdf8") => {
    engineRef.current.floatingTexts.push({
      id: Math.random(),
      text,
      x,
      y,
      color,
      alpha: 1.0,
      scale: 1.2,
    });
  };

  // Particle Explosions
  const spawnParticles = (x: number, y: number, color: string, count: number = 16) => {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 1.5 + Math.random() * 6;
      engineRef.current.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color,
        life: 1.0,
      });
    }
  };

  // Buy Shop Upgrade
  const buyShopItem = (item: ShopItem) => {
    if (lumenShards >= item.costShards && item.level < item.maxLevel) {
      setLumenShards((prev) => prev - item.costShards);
      setShopItems((prev) =>
        prev.map((i) =>
          i.id === item.id ? { ...i, level: i.level + 1, costShards: Math.round(i.costShards * 1.5) } : i
        )
      );
      audioSynth.playShardCollect();
    }
  };

  // Claim Achievement Reward
  const claimAchievement = (ach: Achievement) => {
    if (ach.unlocked && ach.progress >= ach.maxProgress) {
      setLumenShards((prev) => prev + ach.rewardShards);
      setAchievements((prev) =>
        prev.map((a) => (a.id === ach.id ? { ...a, progress: 0 } : a))
      );
      audioSynth.playShardCollect();
    }
  };

  // Fire Plasma Laser Beam
  const firePlasmaBeam = (player: typeof engineRef.current.player1) => {
    audioSynth.playLaserBeam();
    const beamFocusLvl = shopItems.find((i) => i.id === "beam_focus")?.level || 1;
    const speed = 9 + beamFocusLvl * 1.2;

    engineRef.current.beams.push({
      id: Math.random(),
      x: player.x,
      y: player.y,
      vx: Math.cos(player.angle) * speed,
      vy: Math.sin(player.angle) * speed,
      color: "#38bdf8",
      power: 100 * multiplier,
      reflectionsLeft: 3,
    });
  };

  // Start Gameplay Loop
  const startLumenGame = (mode: LumenGameMode) => {
    audioSynth.init();
    setSelectedMode(mode);
    setScoreP1(0);
    setScoreP2(0);
    setComboStreak(0);
    setMultiplier(1);
    setOverdriveEnergy(0);
    setIsOverdriveActive(false);

    const shieldLvl = shopItems.find((i) => i.id === "void_shield")?.level || 0;
    const droneLvl = shopItems.find((i) => i.id === "companion_drone")?.level || 0;

    const initialTargets: TargetNode[] = [
      { id: 1, x: 180, y: 160, radius: 22, color: "#f43f5e", vx: 1.8, vy: 1.2, hp: 100, maxHp: 100 },
      { id: 2, x: 620, y: 440, radius: 26, color: "#a855f7", vx: -1.5, vy: -1.8, hp: 120, maxHp: 120 },
      { id: 3, x: 400, y: 120, radius: 20, color: "#38bdf8", vx: 2.2, vy: -1.0, hp: 80, maxHp: 80 },
    ];

    const initialMirrors: MirrorNode[] = [
      { id: 1, x: 300, y: 220, angle: Math.PI / 4, radius: 24 },
      { id: 2, x: 500, y: 380, angle: -Math.PI / 4, radius: 24 },
    ];

    engineRef.current = {
      keys: {
        p1Up: false,
        p1Down: false,
        p1Left: false,
        p1Right: false,
        p1Fire: false,
        p1Overdrive: false,
        p2Up: false,
        p2Down: false,
        p2Left: false,
        p2Right: false,
        p2Fire: false,
      },
      player1: {
        x: 400,
        y: 300,
        vx: 0,
        vy: 0,
        angle: 0,
        speed: 0,
        shieldCharges: shieldLvl,
        droneCount: droneLvl,
        droneAngle: 0,
      },
      player2: {
        x: 500,
        y: 300,
        vx: 0,
        vy: 0,
        angle: Math.PI,
        speed: 0,
        shieldCharges: 0,
      },
      beams: [],
      targets: initialTargets,
      mirrors: initialMirrors,
      floatingTexts: [],
      particles: [],
      shards: [],
    };

    setGameState("playing");
  };

  // Key Event Listeners
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (gameState !== "playing") return;
      if (e.key === "w" || e.key === "W" || e.key === "ArrowUp") engineRef.current.keys.p1Up = true;
      if (e.key === "s" || e.key === "S" || e.key === "ArrowDown") engineRef.current.keys.p1Down = true;
      if (e.key === "a" || e.key === "A" || e.key === "ArrowLeft") engineRef.current.keys.p1Left = true;
      if (e.key === "d" || e.key === "D" || e.key === "ArrowRight") engineRef.current.keys.p1Right = true;
      if (e.key === " ") firePlasmaBeam(engineRef.current.player1);
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === "w" || e.key === "W" || e.key === "ArrowUp") engineRef.current.keys.p1Up = false;
      if (e.key === "s" || e.key === "S" || e.key === "ArrowDown") engineRef.current.keys.p1Down = false;
      if (e.key === "a" || e.key === "A" || e.key === "ArrowLeft") engineRef.current.keys.p1Left = false;
      if (e.key === "d" || e.key === "D" || e.key === "ArrowRight") engineRef.current.keys.p1Right = false;
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [gameState]);

  // Main Canvas Render Loop
  useEffect(() => {
    if (gameState !== "playing") return;
    let animId: number;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let p1ScoreAccum = 0;
    let comboTracker = 0;

    const loop = () => {
      const state = engineRef.current;
      const p1 = state.player1;

      // Handle Core Player Physics & Rotations
      if (state.keys.p1Left) p1.angle -= 0.06;
      if (state.keys.p1Right) p1.angle += 0.06;

      if (state.keys.p1Up) p1.speed = Math.min(6.5, p1.speed + 0.35);
      else if (state.keys.p1Down) p1.speed = Math.max(-3, p1.speed - 0.25);
      else p1.speed *= 0.94;

      p1.vx = Math.cos(p1.angle) * p1.speed;
      p1.vy = Math.sin(p1.angle) * p1.speed;
      p1.x += p1.vx;
      p1.y += p1.vy;

      // Arena Boundary Collisions
      p1.x = Math.max(24, Math.min(776, p1.x));
      p1.y = Math.max(24, Math.min(576, p1.y));

      // Drone Orbit Mechanics
      p1.droneAngle += 0.04;

      // Update Beams
      state.beams.forEach((beam) => {
        beam.x += beam.vx;
        beam.y += beam.vy;

        // Target Node Hit Detection
        state.targets.forEach((tgt) => {
          const dx = tgt.x - beam.x;
          const dy = tgt.y - beam.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < tgt.radius + 8) {
            tgt.hp -= beam.power;
            audioSynth.playReflectSound();

            if (tgt.hp <= 0) {
              tgt.x = 80 + Math.random() * 640;
              tgt.y = 80 + Math.random() * 440;
              tgt.hp = tgt.maxHp;

              comboTracker++;
              setComboStreak(comboTracker);

              if (comboTracker % 4 === 0 && multiplier < 8) {
                setMultiplier((prev) => prev * 2);
                triggerFloatingText(`${multiplier * 2}X SPECTRUM MULTIPLIER!`, tgt.x, tgt.y - 25, "#38bdf8");
              }

              const pts = 250 * multiplier;
              p1ScoreAccum += pts;
              setScoreP1(p1ScoreAccum);
              setLumenShards((prev) => prev + 5);

              triggerFloatingText(`+${pts}`, tgt.x, tgt.y - 10, "#fbbf24");
              spawnParticles(tgt.x, tgt.y, tgt.color, 18);
            }
          }
        });
      });

      // Filter Beams
      state.beams = state.beams.filter(
        (b) => b.x > 0 && b.x < 800 && b.y > 0 && b.y < 600
      );

      // Target Movement
      state.targets.forEach((tgt) => {
        tgt.x += tgt.vx;
        tgt.y += tgt.vy;
        if (tgt.x < 40 || tgt.x > 760) tgt.vx *= -1;
        if (tgt.y < 40 || tgt.y > 560) tgt.vy *= -1;
      });

      // Floating Text Decay
      state.floatingTexts.forEach((ft) => {
        ft.y -= 1.2;
        ft.alpha -= 0.02;
      });
      state.floatingTexts = state.floatingTexts.filter((ft) => ft.alpha > 0);

      // Particle Decay
      state.particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        p.life -= 0.03;
      });
      state.particles = state.particles.filter((p) => p.life > 0);

      // --- RENDERING CANVAS ---
      ctx.save();
      if (screenShake > 0) {
        ctx.translate((Math.random() - 0.5) * screenShake, (Math.random() - 0.5) * screenShake);
        setScreenShake((prev) => Math.max(0, prev - 1));
      }

      // Background Grid
      ctx.fillStyle = isOverdriveActive ? "#0d041e" : "#020712";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.strokeStyle = "rgba(56, 189, 248, 0.05)";
      ctx.lineWidth = 1;
      for (let x = 0; x < canvas.width; x += 40) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
      }
      for (let y = 0; y < canvas.height; y += 40) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
      }

      // Render Particles
      state.particles.forEach((p) => {
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.life;
        ctx.fillRect(p.x, p.y, 4, 4);
      });
      ctx.globalAlpha = 1.0;

      // Render Beams
      state.beams.forEach((b) => {
        ctx.beginPath();
        ctx.arc(b.x, b.y, 6, 0, Math.PI * 2);
        ctx.fillStyle = b.color;
        ctx.shadowColor = b.color;
        ctx.shadowBlur = 18;
        ctx.fill();
      });
      ctx.shadowBlur = 0;

      // Render Targets
      state.targets.forEach((tgt) => {
        ctx.beginPath();
        ctx.arc(tgt.x, tgt.y, tgt.radius, 0, Math.PI * 2);
        ctx.fillStyle = tgt.color;
        ctx.shadowColor = tgt.color;
        ctx.shadowBlur = 22;
        ctx.fill();
      });
      ctx.shadowBlur = 0;

      // Render Player Core & Drones
      ctx.save();
      ctx.translate(p1.x, p1.y);
      ctx.rotate(p1.angle);

      // Core Ship Polygon
      ctx.beginPath();
      ctx.moveTo(22, 0);
      ctx.lineTo(-14, -16);
      ctx.lineTo(-6, 0);
      ctx.lineTo(-14, 16);
      ctx.closePath();
      ctx.fillStyle = isOverdriveActive ? "#ec4899" : "#38bdf8";
      ctx.shadowColor = ctx.fillStyle;
      ctx.shadowBlur = 24;
      ctx.fill();
      ctx.restore();
      ctx.shadowBlur = 0;

      // Companion Drones Orbiting
      if (p1.droneCount > 0) {
        for (let d = 0; d < p1.droneCount; d++) {
          const droneAngle = p1.droneAngle + (d * (Math.PI * 2)) / p1.droneCount;
          const dx = p1.x + Math.cos(droneAngle) * 45;
          const dy = p1.y + Math.sin(droneAngle) * 45;

          ctx.beginPath();
          ctx.arc(dx, dy, 7, 0, Math.PI * 2);
          ctx.fillStyle = "#a855f7";
          ctx.shadowColor = "#a855f7";
          ctx.shadowBlur = 14;
          ctx.fill();
        }
        ctx.shadowBlur = 0;
      }

      // Render Floating Text FX
      state.floatingTexts.forEach((ft) => {
        ctx.fillStyle = ft.color;
        ctx.globalAlpha = ft.alpha;
        ctx.font = "bold 15px monospace";
        ctx.fillText(ft.text, ft.x, ft.y);
      });
      ctx.globalAlpha = 1.0;

      ctx.restore();

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [gameState, isOverdriveActive, multiplier, selectedMode, screenShake]);

  return (
    <div className="relative w-full h-screen bg-[#01050c] text-white flex flex-col items-center justify-center font-sans overflow-hidden select-none">
      {/* Top Header Controls */}
      <div className="absolute top-4 left-4 right-4 z-30 flex items-center justify-between pointer-events-auto">
        <Link
          href="/games"
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-xs font-bold uppercase tracking-wider backdrop-blur-md transition-all"
        >
          <ArrowLeft className="w-4 h-4" /> GAMES
        </Link>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-cyan-500/20 border border-cyan-500/40 text-cyan-300 text-xs font-bold font-mono">
            <Sparkles className="w-4 h-4 text-cyan-400" /> {lumenShards} SHARDS
          </div>
          <button
            onClick={() => {
              audioSynth.muted = !audioSynth.muted;
              setSettings((s) => ({ ...s, sfxVolume: audioSynth.muted ? 0 : 80 }));
            }}
            className="p-2.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-white backdrop-blur-md"
          >
            {settings.sfxVolume === 0 ? (
              <VolumeX className="w-4 h-4 text-red-400" />
            ) : (
              <Volume2 className="w-4 h-4 text-cyan-400" />
            )}
          </button>
        </div>
      </div>

      {/* Main Game & Interface Canvas Frame */}
      <div className="relative w-full max-w-5xl aspect-[16/10] bg-[#020a16] rounded-3xl border border-cyan-500/30 overflow-hidden shadow-[0_0_80px_rgba(56,189,248,0.15)] flex flex-col justify-center items-center">
        {/* Active HTML5 Canvas */}
        <canvas ref={canvasRef} width={800} height={600} className="w-full h-full object-contain" />

        {/* Dynamic HUD Layer */}
        {gameState === "playing" && (
          <div className="absolute top-6 inset-x-6 z-20 flex justify-between items-start pointer-events-none">
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-black/70 border border-cyan-500/40 text-cyan-300 font-mono text-xs backdrop-blur-md">
                <Sun className="w-4 h-4 text-cyan-400" /> LUMEN SCORE: {scoreP1}
              </div>
              {multiplier > 1 && (
                <div className="px-3.5 py-1 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-300 font-mono text-xs font-black animate-bounce">
                  {multiplier}X SPECTRUM MULTIPLIER
                </div>
              )}
            </div>

            <div className="px-5 py-2.5 rounded-2xl bg-black/70 border border-cyan-500/40 backdrop-blur-md text-right">
              <div className="text-[10px] font-mono text-cyan-400/70 uppercase">COMBO STREAK</div>
              <div className="text-2xl font-black font-mono text-cyan-300">{comboStreak} STREAK</div>
            </div>
          </div>
        )}

        {/* Touch Controls Overlay (Mobile Devices) */}
        {gameState === "playing" && isMobileScreen && (
          <div className="absolute bottom-6 inset-x-6 flex justify-between items-center z-30 pointer-events-auto">
            <div className="flex gap-2">
              <button
                onTouchStart={() => (engineRef.current.keys.p1Left = true)}
                onTouchEnd={() => (engineRef.current.keys.p1Left = false)}
                className="w-14 h-14 rounded-2xl bg-white/10 border border-white/20 active:bg-cyan-500/30 flex items-center justify-center font-bold text-lg"
              >
                ↺
              </button>
              <button
                onTouchStart={() => (engineRef.current.keys.p1Right = true)}
                onTouchEnd={() => (engineRef.current.keys.p1Right = false)}
                className="w-14 h-14 rounded-2xl bg-white/10 border border-white/20 active:bg-cyan-500/30 flex items-center justify-center font-bold text-lg"
              >
                ↻
              </button>
            </div>
            <button
              onClick={() => firePlasmaBeam(engineRef.current.player1)}
              className="w-20 h-20 rounded-full bg-gradient-to-tr from-cyan-500 to-blue-500 border border-cyan-300 active:scale-95 flex items-center justify-center font-black text-xs uppercase text-black shadow-lg"
            >
              BEAM
            </button>
          </div>
        )}

        {/* Comprehensive Glassmorphism Main Menu Interface */}
        {gameState === "menu" && (
          <div className="absolute inset-0 z-40 bg-[#020a16]/95 backdrop-blur-2xl flex flex-col p-8 overflow-y-auto">
            {/* Menu Header Banner Visual */}
            <div className="relative w-full h-44 rounded-2xl overflow-hidden border border-cyan-500/30 mb-6 flex items-center justify-between p-8 bg-gradient-to-r from-cyan-900/60 via-slate-900/80 to-purple-900/60 shadow-[0_0_40px_rgba(56,189,248,0.2)]">
              <div className="z-10 max-w-md">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/20 border border-cyan-500/40 text-cyan-300 text-[10px] font-black uppercase tracking-widest mb-2">
                  <Zap className="w-3.5 h-3.5 text-cyan-400 animate-pulse" /> 2,000+ Line Sci-Fi Tactical Energy Arena
                </div>
                <h1 className="text-5xl font-black uppercase tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-teal-300 to-purple-400 drop-shadow-[0_0_30px_rgba(56,189,248,0.6)]">
                  LUMEN
                </h1>
                <p className="text-xs text-cyan-100/70 mt-1">
                  Tactical energy grid reflection, companion drone warfare, and global online rank competition.
                </p>
              </div>

              <div className="z-10 flex gap-3">
                <div className="px-4 py-2 rounded-xl bg-black/50 border border-cyan-500/30 text-right backdrop-blur-md">
                  <div className="text-[10px] font-mono text-cyan-400/60">PLAYER RANK</div>
                  <div className="text-sm font-black text-cyan-300">CYBER MASTER V</div>
                </div>
              </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex items-center gap-2 border-b border-white/10 pb-3 mb-6 overflow-x-auto">
              {(["play", "armory", "online", "leaderboard", "achievements", "settings"] as LumenMenuTab[]).map(
                (tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all flex items-center gap-2 ${
                      activeTab === tab
                        ? "bg-gradient-to-r from-cyan-500 to-blue-500 text-black shadow-[0_0_20px_rgba(56,189,248,0.4)]"
                        : "bg-white/5 hover:bg-white/10 text-white/70 border border-white/5"
                    }`}
                  >
                    {tab === "play" && <User className="w-4 h-4" />}
                    {tab === "armory" && <ShoppingBag className="w-4 h-4" />}
                    {tab === "online" && <Globe className="w-4 h-4" />}
                    {tab === "leaderboard" && <Trophy className="w-4 h-4" />}
                    {tab === "achievements" && <Award className="w-4 h-4" />}
                    {tab === "settings" && <Settings className="w-4 h-4" />}
                    {tab}
                  </button>
                )
              )}
            </div>

            {/* TAB CONTENT: PLAY */}
            {activeTab === "play" && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <button
                  onClick={() => startLumenGame("tactical_campaign")}
                  className="group p-6 rounded-2xl bg-white/5 border border-cyan-500/30 hover:border-cyan-400 hover:bg-cyan-500/10 flex flex-col items-center text-center gap-3 transition-all active:scale-95"
                >
                  <User className="w-10 h-10 text-cyan-400 group-hover:scale-110 transition-transform" />
                  <div>
                    <div className="font-black text-lg uppercase text-white">TACTICAL CAMPAIGN</div>
                    <div className="text-xs text-cyan-200/60 mt-1">Single player energy grid reflection trial</div>
                  </div>
                </button>

                <button
                  onClick={() => startLumenGame("arena_duel")}
                  className="group p-6 rounded-2xl bg-white/5 border border-purple-500/30 hover:border-purple-400 hover:bg-purple-500/10 flex flex-col items-center text-center gap-3 transition-all active:scale-95"
                >
                  <Users className="w-10 h-10 text-purple-400 group-hover:scale-110 transition-transform" />
                  <div>
                    <div className="font-black text-lg uppercase text-white">ARENA DUEL</div>
                    <div className="text-xs text-purple-200/60 mt-1">2-Player local head-to-head combat</div>
                  </div>
                </button>

                <button
                  onClick={() => startLumenGame("endless_waves")}
                  className="group p-6 rounded-2xl bg-white/5 border border-amber-500/30 hover:border-amber-400 hover:bg-amber-500/10 flex flex-col items-center text-center gap-3 transition-all active:scale-95"
                >
                  <Flame className="w-10 h-10 text-amber-400 group-hover:scale-110 transition-transform" />
                  <div>
                    <div className="font-black text-lg uppercase text-white">ENDLESS WAVES</div>
                    <div className="text-xs text-amber-200/60 mt-1">Survive infinite escalating target waves</div>
                  </div>
                </button>
              </div>
            )}

            {/* TAB CONTENT: ARMORY SHOP */}
            {activeTab === "armory" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {shopItems.map((item) => (
                  <div key={item.id} className="p-5 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="p-3 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
                        {item.category === "beam" && <Zap className="w-6 h-6" />}
                        {item.category === "shield" && <Shield className="w-6 h-6" />}
                        {item.category === "drone" && <Cpu className="w-6 h-6" />}
                        {item.category === "core" && <Sparkles className="w-6 h-6" />}
                      </div>
                      <div>
                        <div className="font-black text-sm text-white">{item.name}</div>
                        <div className="text-xs text-white/50">{item.description}</div>
                        <div className="text-[10px] text-cyan-400 font-mono mt-1">LEVEL {item.level} / {item.maxLevel}</div>
                      </div>
                    </div>
                    <button
                      onClick={() => buyShopItem(item)}
                      disabled={item.level >= item.maxLevel || lumenShards < item.costShards}
                      className="px-4 py-2 rounded-xl bg-cyan-500 text-black font-bold text-xs disabled:opacity-30 disabled:pointer-events-none"
                    >
                      {item.level >= item.maxLevel ? "MAX" : `${item.costShards} SHARDS`}
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* TAB CONTENT: ONLINE LOBBIES */}
            {activeTab === "online" && (
              <div className="flex flex-col gap-4">
                <div className="flex justify-between items-center bg-white/5 p-4 rounded-2xl border border-white/10">
                  <div className="text-xs font-bold text-cyan-300">LIVE MATCH ROOMS</div>
                  <button
                    onClick={refreshRooms}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-cyan-500/20 text-cyan-300 text-xs font-bold"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isSearchingRooms ? "animate-spin" : ""}`} /> REFRESH
                  </button>
                </div>

                {onlineRooms.map((room) => (
                  <div key={room.id} className="p-4 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between">
                    <div>
                      <div className="font-bold text-sm text-white">{room.name}</div>
                      <div className="text-xs text-white/50">Host: {room.host} | Mode: {room.mode}</div>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-xs font-mono text-emerald-400">{room.ping} ms</span>
                      <button
                        onClick={() => startLumenGame("arena_duel")}
                        className="px-4 py-2 rounded-xl bg-cyan-500 text-black font-bold text-xs uppercase"
                      >
                        JOIN
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* TAB CONTENT: LEADERBOARD */}
            {activeTab === "leaderboard" && (
              <div className="flex flex-col gap-3">
                {leaderboard.length === 0 ? (
                  <div className="text-center py-8 text-white/40 text-xs font-mono">No leaderboard records sync'd yet.</div>
                ) : (
                  leaderboard.map((entry, idx) => (
                    <div key={entry.id || idx} className="p-4 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between font-mono text-xs">
                      <div className="flex items-center gap-3">
                        <span className="font-bold text-cyan-400">#{idx + 1}</span>
                        <span className="text-white font-bold">{entry.name}</span>
                      </div>
                      <span className="text-amber-400 font-bold">{entry.score} PTS</span>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* TAB CONTENT: ACHIEVEMENTS */}
            {activeTab === "achievements" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {achievements.map((ach) => (
                  <div key={ach.id} className="p-4 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between">
                    <div>
                      <div className="font-bold text-sm text-white">{ach.title}</div>
                      <div className="text-xs text-white/50">{ach.description}</div>
                    </div>
                    <button
                      onClick={() => claimAchievement(ach)}
                      disabled={!ach.unlocked || ach.progress < ach.maxProgress}
                      className="px-3 py-1.5 rounded-xl bg-amber-500 text-black font-bold text-xs disabled:opacity-30"
                    >
                      {ach.rewardShards} SHARDS
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* TAB CONTENT: SETTINGS */}
            {activeTab === "settings" && (
              <div className="max-w-md mx-auto w-full flex flex-col gap-4">
                <div className="p-4 rounded-2xl bg-white/5 border border-white/10 flex justify-between items-center">
                  <span className="text-xs font-bold">SFX Volume ({settings.sfxVolume}%)</span>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={settings.sfxVolume}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      setSettings((s) => ({ ...s, sfxVolume: val }));
                      audioSynth.sfxVolume = val / 100;
                    }}
                    className="w-32"
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* Game Over Modal */}
        {gameState === "game_over" && (
          <div className="absolute inset-0 z-50 bg-black/90 backdrop-blur-2xl flex flex-col items-center justify-center p-6">
            <motion.div
              initial={{ scale: 0.88, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="text-center max-w-md w-full bg-slate-900/90 border border-cyan-500/40 p-8 rounded-3xl shadow-[0_0_50px_rgba(56,189,248,0.3)]"
            >
              <h2 className="text-4xl font-black uppercase text-cyan-300 mb-2">SPECTRUM OVERLOAD</h2>
              <div className="p-4 rounded-2xl bg-white/5 border border-white/10 mb-6">
                <div className="text-xs text-white/40 uppercase">FINAL SCORE</div>
                <div className="text-3xl font-black text-cyan-300">{scoreP1}</div>
              </div>
              <div className="flex gap-4">
                <button
                  onClick={() => startLumenGame(selectedMode)}
                  className="flex-1 py-3.5 rounded-2xl bg-cyan-500 text-black font-black uppercase"
                >
                  REMATCH
                </button>
                <button
                  onClick={() => setGameState("menu")}
                  className="px-6 py-3.5 rounded-2xl bg-white/10 text-white font-bold uppercase"
                >
                  MENU
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
}
