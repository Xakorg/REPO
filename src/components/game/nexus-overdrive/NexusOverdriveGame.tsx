"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Float, Sparkles, PerspectiveCamera } from "@react-three/drei";
import * as THREE from "three";
import { motion, AnimatePresence } from "framer-motion";
import {
  Trophy,
  Zap,
  Shield,
  Play,
  RotateCcw,
  ArrowLeft,
  Volume2,
  VolumeX,
  Flame,
  Target,
  Sparkles as SparklesIcon,
  Palette,
  Crosshair,
  Award,
  Pause,
  Maximize2,
  Radio,
  Rocket,
  ShieldAlert,
  ShoppingBag,
  Info,
  ChevronRight
} from "lucide-react";
import Link from "next/link";

// ==========================================
// 1. SYNTHETIC WEB AUDIO SOUND ENGINE
// ==========================================
class NexusSoundEngine {
  ctx: AudioContext | null = null;
  muted: boolean = false;
  bgmNode: AudioBufferSourceNode | null = null;
  bgmGain: GainNode | null = null;

  init() {
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

  playLaser() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(1200, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(180, this.ctx.currentTime + 0.08);

      gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.08);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + 0.08);
    } catch (e) {
      // Audio context catch fallback
    }
  }

  playMissile() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "square";
      osc.frequency.setValueAtTime(300, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(600, this.ctx.currentTime + 0.2);

      gain.gain.setValueAtTime(0.25, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.2);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + 0.2);
    } catch (e) {}
  }

  playExplosion() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    try {
      const bufferSize = this.ctx.sampleRate * 0.3;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const output = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
      }

      const whiteNoise = this.ctx.createBufferSource();
      whiteNoise.buffer = buffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.setValueAtTime(800, this.ctx.currentTime);
      filter.frequency.exponentialRampToValueAtTime(50, this.ctx.currentTime + 0.3);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.4, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.3);

      whiteNoise.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);

      whiteNoise.start();
    } catch (e) {}
  }

  playShieldHit() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(800, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(200, this.ctx.currentTime + 0.15);

      gain.gain.setValueAtTime(0.3, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.15);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + 0.15);
    } catch (e) {}
  }

  playPowerup() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    try {
      const notes = [440, 554.37, 659.25, 880];
      notes.forEach((freq, idx) => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, this.ctx!.currentTime + idx * 0.05);

        gain.gain.setValueAtTime(0.2, this.ctx!.currentTime + idx * 0.05);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx!.currentTime + idx * 0.05 + 0.1);

        osc.connect(gain);
        gain.connect(this.ctx!.destination);

        osc.start(this.ctx!.currentTime + idx * 0.05);
        osc.stop(this.ctx!.currentTime + idx * 0.05 + 0.1);
      });
    } catch (e) {}
  }

  playOverdrive() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(200, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1400, this.ctx.currentTime + 0.5);

      gain.gain.setValueAtTime(0.35, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.5);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + 0.5);
    } catch (e) {}
  }
}

const soundEngine = new NexusSoundEngine();

// ==========================================
// 2. TYPES & INTERFACES
// ==========================================
export type ShipSkin = "cyber-cyan" | "neon-crimson" | "solar-gold" | "void-purple";

export interface ShipSkinMeta {
  id: ShipSkin;
  name: string;
  primaryColor: string;
  glowColor: string;
  trailColor: string;
}

export const SHIP_SKINS: Record<ShipSkin, ShipSkinMeta> = {
  "cyber-cyan": { id: "cyber-cyan", name: "Cyber Cyan", primaryColor: "#00f0ff", glowColor: "#00a8ff", trailColor: "#00e1ff" },
  "neon-crimson": { id: "neon-crimson", name: "Neon Crimson", primaryColor: "#ff0055", glowColor: "#ff00aa", trailColor: "#ff3300" },
  "solar-gold": { id: "solar-gold", name: "Solar Gold", primaryColor: "#ffaa00", glowColor: "#ffe600", trailColor: "#ff7700" },
  "void-purple": { id: "void-purple", name: "Void Purple", primaryColor: "#a000ff", glowColor: "#d400ff", trailColor: "#8000ff" },
};

export interface PlayerStats {
  health: number;
  maxHealth: number;
  shield: number;
  maxShield: number;
  overdrive: number; // 0 to 100
  laserPower: number;
  speed: number;
  missilesCount: number;
  score: number;
  credits: number;
  wave: number;
  kills: number;
  combo: number;
  highestCombo: number;
}

export interface EnemyUnit {
  id: string;
  type: "drone" | "interceptor" | "gunner" | "phantom" | "boss";
  position: [number, number, number];
  hp: number;
  maxHp: number;
  speed: number;
  targetPos: [number, number, number];
  color: string;
  size: number;
  fireCooldown: number;
}

export interface BulletUnit {
  id: string;
  position: [number, number, number];
  direction: [number, number, number];
  speed: number;
  isPlayer: boolean;
  color: string;
  damage: number;
}

export interface ParticleUnit {
  id: string;
  position: [number, number, number];
  velocity: [number, number, number];
  color: string;
  size: number;
  life: number;
}

export interface PowerupUnit {
  id: string;
  type: "health" | "shield" | "missile" | "overdrive" | "credits";
  position: [number, number, number];
}

export interface UpgradeItem {
  id: string;
  title: string;
  description: string;
  cost: number;
  level: number;
  maxLevel: number;
  icon: any;
}

// ==========================================
// 3. THREE.JS SCENE COMPONENTS
// ==========================================

// Moving Starfield Environment
function AnimatedStarfield() {
  const starsRef = useRef<THREE.Points>(null);
  const count = 1200;

  const [positions, colors] = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const col = new Float32Array(count * 3);
    const palette = [new THREE.Color("#00f0ff"), new THREE.Color("#ff00aa"), new THREE.Color("#ffffff"), new THREE.Color("#7000ff")];

    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 120;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 80;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 200;

      const chosenColor = palette[Math.floor(Math.random() * palette.length)];
      col[i * 3] = chosenColor.r;
      col[i * 3 + 1] = chosenColor.g;
      col[i * 3 + 2] = chosenColor.b;
    }
    return [pos, col];
  }, []);

  useFrame((_, delta) => {
    if (starsRef.current) {
      const posArr = starsRef.current.geometry.attributes.position.array as Float32Array;
      for (let i = 0; i < count; i++) {
        posArr[i * 3 + 2] += delta * 30;
        if (posArr[i * 3 + 2] > 50) {
          posArr[i * 3 + 2] = -150;
        }
      }
      starsRef.current.geometry.attributes.position.needsUpdate = true;
    }
  });

  return (
    <points ref={starsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-color" args={[colors, 3]} />
      </bufferGeometry>
      <pointsMaterial size={0.35} vertexColors transparent opacity={0.8} />
    </points>
  );
}

// Synthwave Grid Platform Floor
function WarpGridFloor() {
  const gridRef = useRef<THREE.Group>(null);

  useFrame((_, delta) => {
    if (gridRef.current) {
      gridRef.current.position.z += delta * 15;
      if (gridRef.current.position.z > 10) {
        gridRef.current.position.z = 0;
      }
    }
  });

  return (
    <group ref={gridRef} position={[0, -12, 0]}>
      <gridHelper args={[200, 40, "#00f0ff", "#ff0077"]} position={[0, 0, 0]} />
      <gridHelper args={[200, 40, "#7000ff", "#00f0ff"]} position={[0, 0, -100]} />
    </group>
  );
}

// 3D Player Starfighter
function 3DPlayerShip({
  position,
  skin,
  isOverdrive,
  roll
}: {
  position: [number, number, number];
  skin: ShipSkin;
  isOverdrive: boolean;
  roll: number;
}) {
  const shipRef = useRef<THREE.Group>(null);
  const skinMeta = SHIP_SKINS[skin];

  useFrame(() => {
    if (shipRef.current) {
      shipRef.current.rotation.z = THREE.MathUtils.lerp(shipRef.current.rotation.z, -roll * 0.4, 0.1);
      shipRef.current.rotation.x = THREE.MathUtils.lerp(shipRef.current.rotation.x, Math.sin(Date.now() * 0.003) * 0.05, 0.1);
    }
  });

  return (
    <group ref={shipRef} position={position}>
      {/* Fuselage Core */}
      <mesh position={[0, 0, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <coneGeometry args={[0.7, 3.2, 5]} />
        <meshStandardMaterial color={skinMeta.primaryColor} metalness={0.8} roughness={0.2} emissive={skinMeta.primaryColor} emissiveIntensity={isOverdrive ? 0.8 : 0.2} />
      </mesh>

      {/* Cockpit Canopy */}
      <mesh position={[0, 0.2, -0.2]}>
        <sphereGeometry args={[0.45, 16, 16]} />
        <meshStandardMaterial color="#ffffff" metalness={0.9} roughness={0.1} transparent opacity={0.7} />
      </mesh>

      {/* Main Swept Wings */}
      <mesh position={[-1.2, 0, 0.4]} rotation={[0, 0, -0.15]}>
        <boxGeometry args={[1.8, 0.08, 1.2]} />
        <meshStandardMaterial color="#1a1a2e" metalness={0.9} roughness={0.3} />
      </mesh>
      <mesh position={[1.2, 0, 0.4]} rotation={[0, 0, 0.15]}>
        <boxGeometry args={[1.8, 0.08, 1.2]} />
        <meshStandardMaterial color="#1a1a2e" metalness={0.9} roughness={0.3} />
      </mesh>

      {/* Wingtip Cannons */}
      <mesh position={[-2.1, 0, 0.2]}>
        <cylinderGeometry args={[0.06, 0.06, 1]} />
        <meshStandardMaterial color={skinMeta.glowColor} emissive={skinMeta.glowColor} emissiveIntensity={0.9} />
      </mesh>
      <mesh position={[2.1, 0, 0.2]}>
        <cylinderGeometry args={[0.06, 0.06, 1]} />
        <meshStandardMaterial color={skinMeta.glowColor} emissive={skinMeta.glowColor} emissiveIntensity={0.9} />
      </mesh>

      {/* Thruster Engine Glow */}
      <mesh position={[-0.4, 0, 1.5]}>
        <cylinderGeometry args={[0.2, 0.1, 0.6]} />
        <meshBasicMaterial color={isOverdrive ? "#ffffff" : skinMeta.trailColor} />
      </mesh>
      <mesh position={[0.4, 0, 1.5]}>
        <cylinderGeometry args={[0.2, 0.1, 0.6]} />
        <meshBasicMaterial color={isOverdrive ? "#ffffff" : skinMeta.trailColor} />
      </mesh>

      {/* Overdrive Energy Aura Shield */}
      {isOverdrive && (
        <mesh>
          <sphereGeometry args={[2.5, 32, 32]} />
          <meshBasicMaterial color="#00ffff" transparent opacity={0.25} wireframe />
        </mesh>
      )}
    </group>
  );
}

// 3D Enemy Models
function 3DEnemyMesh({ enemy }: { enemy: EnemyUnit }) {
  const meshRef = useRef<THREE.Group>(null);

  useFrame((_, delta) => {
    if (meshRef.current) {
      if (enemy.type === "interceptor") {
        meshRef.current.rotation.z += delta * 3;
      } else if (enemy.type === "boss") {
        meshRef.current.rotation.y += delta * 0.5;
      } else {
        meshRef.current.rotation.x += delta * 1.5;
      }
    }
  });

  return (
    <group ref={meshRef} position={enemy.position}>
      {enemy.type === "drone" && (
        <mesh>
          <octahedronGeometry args={[enemy.size]} />
          <meshStandardMaterial color={enemy.color} emissive={enemy.color} emissiveIntensity={0.6} wireframe />
        </mesh>
      )}

      {enemy.type === "interceptor" && (
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <coneGeometry args={[enemy.size * 0.8, enemy.size * 2, 4]} />
          <meshStandardMaterial color={enemy.color} emissive={enemy.color} emissiveIntensity={0.8} />
        </mesh>
      )}

      {enemy.type === "gunner" && (
        <mesh>
          <boxGeometry args={[enemy.size * 1.5, enemy.size * 1.5, enemy.size * 1.5]} />
          <meshStandardMaterial color={enemy.color} metalness={0.8} roughness={0.2} emissive={enemy.color} emissiveIntensity={0.4} />
        </mesh>
      )}

      {enemy.type === "phantom" && (
        <mesh>
          <torusGeometry args={[enemy.size, 0.2, 16, 32]} />
          <meshStandardMaterial color={enemy.color} emissive={enemy.color} emissiveIntensity={0.9} transparent opacity={0.85} />
        </mesh>
      )}

      {enemy.type === "boss" && (
        <group>
          {/* Boss Core */}
          <mesh>
            <dodecahedronGeometry args={[enemy.size]} />
            <meshStandardMaterial color="#ff0044" emissive="#ff0044" emissiveIntensity={0.9} wireframe />
          </mesh>
          {/* Boss Outer Shield Ring */}
          <mesh rotation={[Math.PI / 4, Math.PI / 4, 0]}>
            <torusGeometry args={[enemy.size * 1.6, 0.3, 16, 32]} />
            <meshStandardMaterial color="#ffaa00" emissive="#ffaa00" emissiveIntensity={0.8} />
          </mesh>
        </group>
      )}
    </group>
  );
}

// 3D Laser & Projectile Bullets
function 3DBulletMesh({ bullet }: { bullet: BulletUnit }) {
  return (
    <mesh position={bullet.position}>
      <sphereGeometry args={[bullet.isPlayer ? 0.25 : 0.3, 8, 8]} />
      <meshBasicMaterial color={bullet.color} />
    </mesh>
  );
}

// 3D Powerup Items
function 3DPowerupMesh({ powerup }: { powerup: PowerupUnit }) {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((_, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * 2;
      groupRef.current.rotation.x += delta;
    }
  });

  const getColor = () => {
    switch (powerup.type) {
      case "health": return "#00ff66";
      case "shield": return "#00a8ff";
      case "missile": return "#ff9900";
      case "overdrive": return "#d400ff";
      case "credits": return "#ffd700";
    }
  };

  return (
    <group ref={groupRef} position={powerup.position}>
      <mesh>
        <octahedronGeometry args={[0.5]} />
        <meshStandardMaterial color={getColor()} emissive={getColor()} emissiveIntensity={0.9} />
      </mesh>
    </group>
  );
}

// ==========================================
// 4. MAIN GAME COMPONENT & LOGIC ENGINE
// ==========================================
export default function NexusOverdriveGame() {
  // Game Flow States
  const [gameState, setGameState] = useState<"menu" | "playing" | "paused" | "shop" | "gameover">("menu");
  const [difficulty, setDifficulty] = useState<"normal" | "hard" | "insane">("normal");
  const [selectedSkin, setSelectedSkin] = useState<ShipSkin>("cyber-cyan");

  // Audio Toggle
  const [isMuted, setIsMuted] = useState(false);

  // Player Stats
  const [stats, setStats] = useState<PlayerStats>({
    health: 100,
    maxHealth: 100,
    shield: 100,
    maxShield: 100,
    overdrive: 0,
    laserPower: 1,
    speed: 18,
    missilesCount: 3,
    score: 0,
    credits: 0,
    wave: 1,
    kills: 0,
    combo: 0,
    highestCombo: 0,
  });

  // Upgrades List
  const [upgrades, setUpgrades] = useState<UpgradeItem[]>([
    { id: "laser", title: "Dual Plasma Cannon", description: "Increase fire rate & projectile damage", cost: 150, level: 1, maxLevel: 5, icon: Zap },
    { id: "shield", title: "Shield Matrix", description: "Increase max shield capacity & regeneration", cost: 200, level: 1, maxLevel: 5, icon: Shield },
    { id: "health", title: "Hull Armor", description: "Increase starfighter max health", cost: 180, level: 1, maxLevel: 5, icon: Flame },
    { id: "missile", title: "Homing Missiles", description: "Increase missile stock & reload frequency", cost: 250, level: 1, maxLevel: 5, icon: Rocket },
    { id: "overdrive", title: "Overdrive Core", description: "Accelerate ultimate overdrive charge rate", cost: 300, level: 1, maxLevel: 5, icon: SparklesIcon },
  ]);

  // Positional State for 3D Entities
  const [playerPosition, setPlayerPosition] = useState<[number, number, number]>([0, 0, 0]);
  const [playerRoll, setPlayerRoll] = useState<number>(0);
  const [enemies, setEnemies] = useState<EnemyUnit[]>([]);
  const [bullets, setBullets] = useState<BulletUnit[]>([]);
  const [powerups, setPowerups] = useState<PowerupUnit[]>([]);
  const [isOverdriveActive, setIsOverdriveActive] = useState<boolean>(false);
  const [highScore, setHighScore] = useState<number>(0);
  const [achievementToast, setAchievementToast] = useState<string | null>(null);

  // Keyboard Controls Trackers
  const keysPressed = useRef<Record<string, boolean>>({});

  // High score initialization
  useEffect(() => {
    const savedScore = localStorage.getItem("nexus_overdrive_highscore");
    if (savedScore) {
      setHighScore(parseInt(savedScore, 10));
    }
  }, []);

  // Keyboard Event Listeners
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      keysPressed.current[e.code] = true;

      if (e.code === "KeyP" && gameState === "playing") {
        setGameState("paused");
      } else if (e.code === "KeyP" && gameState === "paused") {
        setGameState("playing");
      }

      if (e.code === "Space" && gameState === "playing") {
        e.preventDefault();
        fireLaser();
      }

      if (e.code === "KeyF" && gameState === "playing") {
        fireMissile();
      }

      if (e.code === "KeyE" && gameState === "playing") {
        activateOverdrive();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      keysPressed.current[e.code] = false;
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [gameState, stats, isOverdriveActive]);

  // Audio mute sync
  const toggleMute = () => {
    soundEngine.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  // Start / Restart Game Session
  const startGame = () => {
    soundEngine.init();
    setStats({
      health: 100,
      maxHealth: 100,
      shield: 100,
      maxShield: 100,
      overdrive: 0,
      laserPower: 1,
      speed: 18,
      missilesCount: 3,
      score: 0,
      credits: 0,
      wave: 1,
      kills: 0,
      combo: 0,
      highestCombo: 0,
    });
    setPlayerPosition([0, 0, 0]);
    setEnemies([]);
    setBullets([]);
    setPowerups([]);
    setIsOverdriveActive(false);
    setGameState("playing");
    spawnWave(1);
  };

  // Wave Spawner Engine
  const spawnWave = (waveNum: number) => {
    const newEnemies: EnemyUnit[] = [];
    const count = 4 + waveNum * 2;
    const types: EnemyUnit["type"][] = ["drone", "interceptor", "gunner", "phantom"];

    // Spawn Boss every 5 waves
    if (waveNum % 5 === 0) {
      newEnemies.push({
        id: `boss-${Date.now()}`,
        type: "boss",
        position: [0, 5, -50],
        hp: 300 + waveNum * 100,
        maxHp: 300 + waveNum * 100,
        speed: 4,
        targetPos: [0, 2, -20],
        color: "#ff0055",
        size: 3.5,
        fireCooldown: 0,
      });
    }

    for (let i = 0; i < count; i++) {
      const type = types[Math.floor(Math.random() * types.length)];
      const x = (Math.random() - 0.5) * 36;
      const y = (Math.random() - 0.5) * 16;
      const z = -30 - Math.random() * 60;

      let color = "#00f0ff";
      let size = 1.2;
      let hp = 20 + waveNum * 5;

      if (type === "interceptor") {
        color = "#ffaa00";
        size = 1.0;
        hp = 15 + waveNum * 4;
      } else if (type === "gunner") {
        color = "#ff00ff";
        size = 1.8;
        hp = 40 + waveNum * 10;
      } else if (type === "phantom") {
        color = "#00ff88";
        size = 1.4;
        hp = 25 + waveNum * 6;
      }

      newEnemies.push({
        id: `enemy-${i}-${Date.now()}`,
        type,
        position: [x, y, z],
        hp,
        maxHp: hp,
        speed: 6 + Math.random() * 4,
        targetPos: [(Math.random() - 0.5) * 25, (Math.random() - 0.5) * 10, -10],
        color,
        size,
        fireCooldown: Math.random() * 2,
      });
    }

    setEnemies(newEnemies);
  };

  // Primary Laser Fire
  const fireLaser = () => {
    soundEngine.playLaser();
    const newBullets: BulletUnit[] = [];
    const spread = isOverdriveActive ? 0.6 : 0.3;

    newBullets.push({
      id: `bullet-left-${Date.now()}`,
      position: [playerPosition[0] - spread, playerPosition[1], playerPosition[2] - 1],
      direction: [0, 0, -1],
      speed: 45,
      isPlayer: true,
      color: SHIP_SKINS[selectedSkin].primaryColor,
      damage: 15 * stats.laserPower * (isOverdriveActive ? 2 : 1),
    });

    newBullets.push({
      id: `bullet-right-${Date.now()}`,
      position: [playerPosition[0] + spread, playerPosition[1], playerPosition[2] - 1],
      direction: [0, 0, -1],
      speed: 45,
      isPlayer: true,
      color: SHIP_SKINS[selectedSkin].primaryColor,
      damage: 15 * stats.laserPower * (isOverdriveActive ? 2 : 1),
    });

    setBullets(prev => [...prev, ...newBullets]);
  };

  // Homing Missile Fire
  const fireMissile = () => {
    if (stats.missilesCount <= 0) return;

    soundEngine.playMissile();
    setStats(prev => ({ ...prev, missilesCount: prev.missilesCount - 1 }));

    setBullets(prev => [
      ...prev,
      {
        id: `missile-${Date.now()}`,
        position: [playerPosition[0], playerPosition[1] - 0.3, playerPosition[2] - 1],
        direction: [0, 0, -1],
        speed: 35,
        isPlayer: true,
        color: "#ffaa00",
        damage: 60,
      }
    ]);
  };

  // Ultimate Overdrive Activation
  const activateOverdrive = () => {
    if (stats.overdrive < 100 || isOverdriveActive) return;

    soundEngine.playOverdrive();
    setIsOverdriveActive(true);
    setStats(prev => ({ ...prev, overdrive: 0 }));

    // Show achievement toast
    setAchievementToast("OVERDRIVE ULTIMATE ACTIVATED!");
    setTimeout(() => setAchievementToast(null), 3000);

    setTimeout(() => {
      setIsOverdriveActive(false);
    }, 6000);
  };

  // Main Game Loop Engine (60 FPS tick update)
  useEffect(() => {
    if (gameState !== "playing") return;

    const interval = setInterval(() => {
      // 1. Update Player Movement from Key State
      setPlayerPosition(prev => {
        let [x, y, z] = prev;
        const speed = (stats.speed / 60) * (isOverdriveActive ? 1.4 : 1.0);
        let roll = 0;

        if (keysPressed.current["KeyA"] || keysPressed.current["ArrowLeft"]) {
          x = Math.max(-18, x - speed);
          roll = -1;
        }
        if (keysPressed.current["KeyD"] || keysPressed.current["ArrowRight"]) {
          x = Math.min(18, x + speed);
          roll = 1;
        }
        if (keysPressed.current["KeyW"] || keysPressed.current["ArrowUp"]) {
          y = Math.min(8, y + speed);
        }
        if (keysPressed.current["KeyS"] || keysPressed.current["ArrowDown"]) {
          y = Math.max(-8, y - speed);
        }

        setPlayerRoll(roll);
        return [x, y, z];
      });

      // 2. Shield Regeneration Logic
      setStats(prev => ({
        ...prev,
        shield: Math.min(prev.maxShield, prev.shield + 0.08)
      }));

      // 3. Update Bullets Position & Collision Detection
      setBullets(prevBullets => {
        const nextBullets: BulletUnit[] = [];

        prevBullets.forEach(b => {
          const newZ = b.position[2] + b.direction[2] * (b.speed / 60);
          const newX = b.position[0] + b.direction[0] * (b.speed / 60);
          const newY = b.position[1] + b.direction[1] * (b.speed / 60);

          if (Math.abs(newZ) < 80 && Math.abs(newX) < 30) {
            nextBullets.push({
              ...b,
              position: [newX, newY, newZ],
            });
          }
        });

        return nextBullets;
      });

      // 4. Update Enemies Position & Attack Logic
      setEnemies(prevEnemies => {
        let updatedEnemies: EnemyUnit[] = [];

        prevEnemies.forEach(enemy => {
          let [x, y, z] = enemy.position;

          // Move enemy towards player z-plane
          z += (enemy.speed / 60);

          // If enemy bypasses player, reset to top back
          if (z > 15) {
            z = -50 - Math.random() * 30;
            x = (Math.random() - 0.5) * 30;
          }

          // Enemy firing timer logic
          const newCooldown = enemy.fireCooldown - 0.016;
          if (newCooldown <= 0 && Math.abs(z - playerPosition[2]) < 40) {
            // Enemy fires laser projectile
            setBullets(bPrev => [
              ...bPrev,
              {
                id: `enemy-bullet-${Date.now()}-${Math.random()}`,
                position: [x, y, z],
                direction: [0, 0, 1],
                speed: 25,
                isPlayer: false,
                color: "#ff0044",
                damage: 10,
              }
            ]);
          }

          updatedEnemies.push({
            ...enemy,
            position: [x, y, z],
            fireCooldown: newCooldown <= 0 ? 1.5 + Math.random() * 2 : newCooldown,
          });
        });

        return updatedEnemies;
      });

      // 5. Collision Checks: Player Bullets vs Enemies
      setBullets(prevBullets => {
        const remainingBullets: BulletUnit[] = [];

        prevBullets.forEach(bullet => {
          if (!bullet.isPlayer) {
            // Enemy bullet hit player check
            const distToPlayer = Math.hypot(
              bullet.position[0] - playerPosition[0],
              bullet.position[1] - playerPosition[1],
              bullet.position[2] - playerPosition[2]
            );

            if (distToPlayer < 1.5) {
              soundEngine.playShieldHit();
              setStats(prev => {
                let shield = prev.shield - bullet.damage;
                let health = prev.health;
                if (shield < 0) {
                  health += shield; // Remaining damage hits hull health
                  shield = 0;
                }
                if (health <= 0) {
                  setGameState("gameover");
                }
                return { ...prev, shield, health: Math.max(0, health), combo: 0 };
              });
              return; // Destroy bullet
            }
            remainingBullets.push(bullet);
            return;
          }

          // Player bullet hit enemy check
          let hitEnemy = false;

          setEnemies(prevEnemies => {
            return prevEnemies.map(enemy => {
              if (hitEnemy) return enemy;

              const dist = Math.hypot(
                bullet.position[0] - enemy.position[0],
                bullet.position[1] - enemy.position[1],
                bullet.position[2] - enemy.position[2]
              );

              if (dist < enemy.size + 0.8) {
                hitEnemy = true;
                const newHp = enemy.hp - bullet.damage;

                if (newHp <= 0) {
                  soundEngine.playExplosion();

                  // Reward score & credits
                  const comboMult = Math.floor(stats.combo / 5) + 1;
                  const earnedScore = 50 * comboMult;
                  const earnedCredits = 10;

                  setStats(s => ({
                    ...s,
                    score: s.score + earnedScore,
                    credits: s.credits + earnedCredits,
                    kills: s.kills + 1,
                    combo: s.combo + 1,
                    highestCombo: Math.max(s.highestCombo, s.combo + 1),
                    overdrive: Math.min(100, s.overdrive + 8),
                  }));

                  // Chance to spawn powerup
                  if (Math.random() < 0.35) {
                    const powerupTypes: PowerupUnit["type"][] = ["health", "shield", "missile", "overdrive", "credits"];
                    setPowerups(p => [
                      ...p,
                      {
                        id: `powerup-${Date.now()}`,
                        type: powerupTypes[Math.floor(Math.random() * powerupTypes.length)],
                        position: enemy.position,
                      }
                    ]);
                  }
                }

                return { ...enemy, hp: newHp };
              }).filter(enemy => enemy.hp > 0);
            });
          });

          if (!hitEnemy) {
            remainingBullets.push(bullet);
          }
        });

        return remainingBullets;
      });

      // 6. Check Wave Completion
      setEnemies(prev => {
        if (prev.length === 0 && gameState === "playing") {
          setStats(s => {
            const nextWave = s.wave + 1;
            spawnWave(nextWave);
            return { ...s, wave: nextWave };
          });
        }
        return prev;
      });

      // 7. Powerup Collection Logic
      setPowerups(prevPowerups => {
        const remainingPowerups: PowerupUnit[] = [];

        prevPowerups.forEach(pow => {
          let [x, y, z] = pow.position;
          z += 0.15; // Float towards camera

          const distToPlayer = Math.hypot(x - playerPosition[0], y - playerPosition[1], z - playerPosition[2]);

          if (distToPlayer < 2.0) {
            soundEngine.playPowerup();
            setStats(s => {
              let { health, maxHealth, shield, maxShield, missilesCount, overdrive, credits } = s;
              if (pow.type === "health") health = Math.min(maxHealth, health + 30);
              if (pow.type === "shield") shield = Math.min(maxShield, shield + 40);
              if (pow.type === "missile") missilesCount += 2;
              if (pow.type === "overdrive") overdrive = Math.min(100, overdrive + 30);
              if (pow.type === "credits") credits += 50;
              return { ...s, health, shield, missilesCount, overdrive, credits };
            });
            return;
          }

          if (z < 20) {
            remainingPowerups.push({ ...pow, position: [x, y, z] });
          }
        });

        return remainingPowerups;
      });

    }, 1000 / 60);

    return () => clearInterval(interval);
  }, [gameState, playerPosition, stats, isOverdriveActive, selectedSkin]);

  // Update High Score on Game Over
  useEffect(() => {
    if (gameState === "gameover") {
      if (stats.score > highScore) {
        setHighScore(stats.score);
        localStorage.setItem("nexus_overdrive_highscore", stats.score.toString());
      }
    }
  }, [gameState, stats.score, highScore]);

  // Purchase Upgrade Handler
  const purchaseUpgrade = (upgId: string) => {
    setUpgrades(prev =>
      prev.map(item => {
        if (item.id === upgId && stats.credits >= item.cost && item.level < item.maxLevel) {
          soundEngine.playPowerup();
          setStats(s => ({
            ...s,
            credits: s.credits - item.cost,
            laserPower: upgId === "laser" ? s.laserPower + 0.3 : s.laserPower,
            maxShield: upgId === "shield" ? s.maxShield + 25 : s.maxShield,
            maxHealth: upgId === "health" ? s.maxHealth + 25 : s.maxHealth,
            missilesCount: upgId === "missile" ? s.missilesCount + 3 : s.missilesCount,
          }));
          return {
            ...item,
            level: item.level + 1,
            cost: Math.floor(item.cost * 1.5),
          };
        }
        return item;
      })
    );
  };

  return (
    <div className="relative w-full h-screen bg-black overflow-hidden font-sans select-none text-white">
      {/* 3D CANVAS VIEWPORT */}
      <div className="absolute inset-0 z-0">
        <Canvas>
          <PerspectiveCamera makeDefault position={[0, 4, 12]} fov={60} />
          <ambientLight intensity={0.6} />
          <pointLight position={[10, 20, 10]} intensity={1.5} color={SHIP_SKINS[selectedSkin].primaryColor} />
          <pointLight position={[-10, -10, -10]} intensity={0.8} color="#ff00aa" />

          {/* Animated Background Starfield */}
          <AnimatedStarfield />
          <WarpGridFloor />

          {/* Player Ship */}
          <3DPlayerShip
            position={playerPosition}
            skin={selectedSkin}
            isOverdrive={isOverdriveActive}
            roll={playerRoll}
          />

          {/* Render Enemies */}
          {enemies.map(enemy => (
            <3DEnemyMesh key={enemy.id} enemy={enemy} />
          ))}

          {/* Render Bullets */}
          {bullets.map(bullet => (
            <3DBulletMesh key={bullet.id} bullet={bullet} />
          ))}

          {/* Render Powerup Items */}
          {powerups.map(powerup => (
            <3DPowerupMesh key={powerup.id} powerup={powerup} />
          ))}
        </Canvas>
      </div>

      {/* OVERLAY 1: TOP HUD HEADER */}
      {gameState === "playing" && (
        <div className="absolute top-0 left-0 right-0 p-6 z-20 flex justify-between items-start pointer-events-none">
          {/* Left HUD: Health & Shields */}
          <div className="flex flex-col gap-3 bg-black/60 backdrop-blur-md p-4 rounded-2xl border border-white/10 w-72 pointer-events-auto">
            {/* Hull Health Bar */}
            <div>
              <div className="flex justify-between text-xs font-black uppercase tracking-wider mb-1">
                <span className="flex items-center gap-1 text-rose-400">
                  <Flame className="w-4 h-4" /> Hull Health
                </span>
                <span>{Math.ceil(stats.health)} / {stats.maxHealth}</span>
              </div>
              <div className="w-full h-2.5 bg-zinc-900 rounded-full overflow-hidden border border-white/10">
                <div
                  className="h-full bg-gradient-to-r from-red-600 to-rose-400 transition-all duration-200"
                  style={{ width: `${(stats.health / stats.maxHealth) * 100}%` }}
                />
              </div>
            </div>

            {/* Shield Matrix Bar */}
            <div>
              <div className="flex justify-between text-xs font-black uppercase tracking-wider mb-1">
                <span className="flex items-center gap-1 text-cyan-400">
                  <Shield className="w-4 h-4" /> Shield Matrix
                </span>
                <span>{Math.ceil(stats.shield)} / {stats.maxShield}</span>
              </div>
              <div className="w-full h-2.5 bg-zinc-900 rounded-full overflow-hidden border border-white/10">
                <div
                  className="h-full bg-gradient-to-r from-cyan-600 to-cyan-300 transition-all duration-200"
                  style={{ width: `${(stats.shield / stats.maxShield) * 100}%` }}
                />
              </div>
            </div>

            {/* Ultimate Overdrive Bar */}
            <div>
              <div className="flex justify-between text-xs font-black uppercase tracking-wider mb-1">
                <span className="flex items-center gap-1 text-fuchsia-400">
                  <SparklesIcon className="w-4 h-4" /> Overdrive (PRESS E)
                </span>
                <span>{Math.ceil(stats.overdrive)}%</span>
              </div>
              <div className="w-full h-2 bg-zinc-900 rounded-full overflow-hidden border border-white/10">
                <div
                  className="h-full bg-gradient-to-r from-purple-600 via-fuchsia-400 to-pink-400 transition-all duration-200"
                  style={{ width: `${stats.overdrive}%` }}
                />
              </div>
            </div>
          </div>

          {/* Center HUD: Wave & Score */}
          <div className="flex flex-col items-center gap-1 bg-black/60 backdrop-blur-md px-8 py-3 rounded-2xl border border-white/10">
            <span className="text-xs font-black tracking-widest text-white/50 uppercase">SECTOR WAVE</span>
            <span className="text-3xl font-black text-cyan-400 tracking-tighter">WAVE {stats.wave}</span>
            <div className="flex items-center gap-4 text-xs font-bold mt-1">
              <span className="text-amber-400">SCORE: {stats.score}</span>
              <span className="text-emerald-400">CREDITS: 🪙 {stats.credits}</span>
            </div>
          </div>

          {/* Right HUD: Controls & Sound */}
          <div className="flex items-center gap-3 pointer-events-auto">
            <button
              onClick={() => setGameState("shop")}
              className="p-3 rounded-xl bg-indigo-600/80 hover:bg-indigo-600 border border-white/20 transition-all flex items-center gap-2 font-bold text-xs uppercase"
            >
              <ShoppingBag className="w-4 h-4" /> Shop
            </button>
            <button
              onClick={toggleMute}
              className="p-3 rounded-xl bg-white/10 hover:bg-white/20 border border-white/10 transition-all"
            >
              {isMuted ? <VolumeX className="w-5 h-5 text-rose-400" /> : <Volume2 className="w-5 h-5 text-cyan-400" />}
            </button>
            <button
              onClick={() => setGameState("paused")}
              className="p-3 rounded-xl bg-white/10 hover:bg-white/20 border border-white/10 transition-all"
            >
              <Pause className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {/* OVERLAY 2: ACHIEVEMENT / NOTIFICATION TOAST */}
      <AnimatePresence>
        {achievementToast && (
          <motion.div
            initial={{ opacity: 0, y: -50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -30, scale: 0.9 }}
            className="absolute top-24 left-1/2 -translate-x-1/2 z-30 bg-gradient-to-r from-purple-600 to-pink-600 px-8 py-3 rounded-full border-2 border-white/30 shadow-[0_0_30px_rgba(212,0,255,0.6)] flex items-center gap-3"
          >
            <SparklesIcon className="w-5 h-5 animate-spin" />
            <span className="font-black tracking-widest text-sm uppercase">{achievementToast}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* OVERLAY 3: START MENU */}
      <AnimatePresence>
        {gameState === "menu" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-40 bg-gradient-to-t from-black via-black/80 to-transparent flex flex-col items-center justify-center p-6"
          >
            <Link
              href="/games"
              className="absolute top-8 left-8 flex items-center gap-2 text-xs font-black uppercase tracking-widest text-white/50 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-4 h-4" /> Back to Arcade
            </Link>

            <motion.div
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="flex flex-col items-center max-w-xl text-center"
            >
              <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs font-black uppercase tracking-widest mb-6">
                <Rocket className="w-4 h-4" /> Apex 3D Space Fighter
              </div>

              <h1 className="text-6xl font-black tracking-tighter uppercase mb-4 bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 via-fuchsia-500 to-pink-500">
                NEXUS OVERDRIVE
              </h1>
              <p className="text-white/60 text-sm mb-8 leading-relaxed">
                Pilot your custom cyber starfighter through hostile armadas. Unleash homing missiles, activate hyper overdrive, upgrade weapons, and conquer the galaxy.
              </p>

              {/* Skin Selector */}
              <div className="mb-8 w-full">
                <span className="text-xs font-black uppercase tracking-widest text-white/50 mb-3 block">
                  Select Starfighter Core
                </span>
                <div className="grid grid-cols-4 gap-3">
                  {Object.values(SHIP_SKINS).map(skin => (
                    <button
                      key={skin.id}
                      onClick={() => setSelectedSkin(skin.id)}
                      className={`p-3 rounded-xl border flex flex-col items-center gap-2 transition-all ${
                        selectedSkin === skin.id
                          ? "border-cyan-400 bg-cyan-500/20 shadow-[0_0_15px_rgba(0,240,255,0.3)]"
                          : "border-white/10 bg-white/5 hover:bg-white/10"
                      }`}
                    >
                      <div
                        className="w-6 h-6 rounded-full border border-white/20"
                        style={{ backgroundColor: skin.primaryColor }}
                      />
                      <span className="text-[10px] font-black uppercase tracking-wider">{skin.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Start Button */}
              <button
                onClick={startGame}
                className="w-full py-4 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-full font-black uppercase tracking-widest hover:scale-105 transition-all shadow-[0_0_40px_rgba(0,240,255,0.4)] flex items-center justify-center gap-3 text-base"
              >
                <Play className="w-5 h-5 fill-white" /> Launch Mission
              </button>

              <div className="mt-8 flex gap-8 text-xs font-bold text-white/40 uppercase">
                <span>HIGH SCORE: {highScore}</span>
                <span>KEYBOARD: WASD / SPACE / F / E</span>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* OVERLAY 4: PAUSE MENU */}
      <AnimatePresence>
        {gameState === "paused" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-40 bg-black/80 backdrop-blur-md flex flex-col items-center justify-center p-6"
          >
            <div className="bg-zinc-900 border border-white/10 p-8 rounded-3xl max-w-md w-full text-center">
              <h2 className="text-3xl font-black uppercase tracking-wider mb-6">MISSION PAUSED</h2>
              <div className="space-y-4">
                <button
                  onClick={() => setGameState("playing")}
                  className="w-full py-3.5 bg-cyan-500 text-black font-black uppercase tracking-wider rounded-xl hover:bg-cyan-400 transition-all"
                >
                  Resume Combat
                </button>
                <button
                  onClick={() => setGameState("shop")}
                  className="w-full py-3.5 bg-indigo-600 text-white font-black uppercase tracking-wider rounded-xl hover:bg-indigo-500 transition-all"
                >
                  Upgrade Hangar Shop
                </button>
                <button
                  onClick={() => setGameState("menu")}
                  className="w-full py-3.5 bg-white/10 text-white font-black uppercase tracking-wider rounded-xl hover:bg-white/20 transition-all"
                >
                  Abandon Mission
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* OVERLAY 5: UPGRADE SHOP */}
      <AnimatePresence>
        {gameState === "shop" && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="absolute inset-0 z-40 bg-black/90 backdrop-blur-lg flex flex-col items-center justify-center p-6"
          >
            <div className="bg-zinc-950 border border-white/10 p-8 rounded-3xl max-w-2xl w-full">
              <div className="flex justify-between items-center mb-6 pb-4 border-b border-white/10">
                <div>
                  <h2 className="text-2xl font-black uppercase tracking-wider flex items-center gap-2">
                    <ShoppingBag className="w-6 h-6 text-indigo-400" /> Hangar Tech Upgrades
                  </h2>
                  <p className="text-xs text-white/50">Enhance your starfighter systems with collected credits</p>
                </div>
                <div className="text-right">
                  <span className="text-xs font-bold text-white/50 block">CREDITS BALANCE</span>
                  <span className="text-2xl font-black text-amber-400">🪙 {stats.credits}</span>
                </div>
              </div>

              {/* Upgrades List */}
              <div className="space-y-4 max-h-[50vh] overflow-y-auto pr-2">
                {upgrades.map(upg => {
                  const Icon = upg.icon;
                  const canAfford = stats.credits >= upg.cost && upg.level < upg.maxLevel;
                  return (
                    <div
                      key={upg.id}
                      className="p-4 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between gap-4"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center">
                          <Icon className="w-6 h-6 text-indigo-400" />
                        </div>
                        <div>
                          <div className="font-bold text-sm uppercase flex items-center gap-2">
                            {upg.title}
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/10 text-white/60">
                              LVL {upg.level} / {upg.maxLevel}
                            </span>
                          </div>
                          <p className="text-xs text-white/50 mt-0.5">{upg.description}</p>
                        </div>
                      </div>

                      <button
                        onClick={() => purchaseUpgrade(upg.id)}
                        disabled={!canAfford}
                        className={`px-5 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider transition-all ${
                          canAfford
                            ? "bg-amber-500 hover:bg-amber-400 text-black shadow-[0_0_15px_rgba(245,158,11,0.3)]"
                            : "bg-white/10 text-white/30 cursor-not-allowed"
                        }`}
                      >
                        {upg.level >= upg.maxLevel ? "MAXED" : `🪙 ${upg.cost}`}
                      </button>
                    </div>
                  );
                })}
              </div>

              <div className="mt-8 pt-4 border-t border-white/10 flex justify-end">
                <button
                  onClick={() => setGameState("playing")}
                  className="px-8 py-3 bg-cyan-500 text-black font-black uppercase tracking-wider rounded-xl hover:bg-cyan-400 transition-all"
                >
                  Return to Combat
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* OVERLAY 6: GAME OVER SCREEN */}
      <AnimatePresence>
        {gameState === "gameover" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-40 bg-black/90 backdrop-blur-md flex flex-col items-center justify-center p-6"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="bg-zinc-950 border border-white/10 p-8 rounded-3xl max-w-md w-full text-center"
            >
              <div className="w-16 h-16 rounded-full bg-rose-500/20 border border-rose-500/40 flex items-center justify-center mx-auto mb-4">
                <ShieldAlert className="w-8 h-8 text-rose-500" />
              </div>

              <h2 className="text-4xl font-black uppercase tracking-tighter text-rose-500 mb-2">
                STARFIGHTER DESTROYED
              </h2>
              <p className="text-xs text-white/50 uppercase tracking-widest mb-6">Sector Defense Failed</p>

              {/* Stats Summary */}
              <div className="grid grid-cols-2 gap-3 mb-8 text-left">
                <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                  <span className="text-[10px] text-white/40 font-bold uppercase block">FINAL SCORE</span>
                  <span className="text-xl font-black text-amber-400">{stats.score}</span>
                </div>
                <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                  <span className="text-[10px] text-white/40 font-bold uppercase block">WAVES SURVIVED</span>
                  <span className="text-xl font-black text-cyan-400">{stats.wave}</span>
                </div>
                <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                  <span className="text-[10px] text-white/40 font-bold uppercase block">ENEMIES DESTROYED</span>
                  <span className="text-xl font-black text-rose-400">{stats.kills}</span>
                </div>
                <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                  <span className="text-[10px] text-white/40 font-bold uppercase block">MAX COMBO</span>
                  <span className="text-xl font-black text-fuchsia-400">x{stats.highestCombo}</span>
                </div>
              </div>

              <div className="space-y-3">
                <button
                  onClick={startGame}
                  className="w-full py-4 bg-cyan-500 text-black font-black uppercase tracking-widest rounded-xl hover:bg-cyan-400 transition-all flex items-center justify-center gap-2"
                >
                  <RotateCcw className="w-5 h-5" /> Retry Mission
                </button>
                <button
                  onClick={() => setGameState("menu")}
                  className="w-full py-3.5 bg-white/10 text-white font-black uppercase tracking-widest rounded-xl hover:bg-white/20 transition-all"
                >
                  Main Menu
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
