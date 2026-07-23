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
  Maximize2
} from "lucide-react";
import Link from "next/link";

// --- SYNTHETIC WEB AUDIO SOUND SYSTEM ---
class HyperSoundEngine {
  ctx: AudioContext | null = null;
  muted: boolean = false;
  engineOsc: OscillatorNode | null = null;
  engineGain: GainNode | null = null;

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

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(880, this.ctx.currentTime); // A5
    osc.frequency.exponentialRampToValueAtTime(110, this.ctx.currentTime + 0.12);

    gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.12);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.12);
  }

  playOrbCollect() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(523.25, now); // C5
    osc.frequency.setValueAtTime(659.25, now + 0.05); // E5
    osc.frequency.setValueAtTime(783.99, now + 0.1); // G5
    osc.frequency.setValueAtTime(1046.5, now + 0.15); // C6

    gain.gain.setValueAtTime(0.25, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(now + 0.25);
  }

  playExplosion() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(180, now);
    osc.frequency.exponentialRampToValueAtTime(20, now + 0.4);

    gain.gain.setValueAtTime(0.45, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.4);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(now + 0.4);
  }

  playShieldUp() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = "triangle";
    osc.frequency.setValueAtTime(300, now);
    osc.frequency.exponentialRampToValueAtTime(900, now + 0.3);

    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(now + 0.3);
  }

  playHyperBoost() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(150, now);
    osc.frequency.exponentialRampToValueAtTime(1200, now + 0.5);

    gain.gain.setValueAtTime(0.35, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.5);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(now + 0.5);
  }
}

const sounds = new HyperSoundEngine();

// --- THEME PALETTES ---
interface ThemePalette {
  id: string;
  name: string;
  primary: string;
  secondary: string;
  accent: string;
  fog: string;
  bg: string;
}

const THEMES: Record<string, ThemePalette> = {
  synth: {
    id: "synth",
    name: "Neon Synthwave",
    primary: "#00f0ff",
    secondary: "#ff0077",
    accent: "#ffe600",
    fog: "#0a001a",
    bg: "#050010"
  },
  sunset: {
    id: "sunset",
    name: "Vaporwave Sunset",
    primary: "#ff7700",
    secondary: "#aa00ff",
    accent: "#00ffcc",
    fog: "#1c0022",
    bg: "#100015"
  },
  matrix: {
    id: "matrix",
    name: "Matrix Void",
    primary: "#00ff66",
    secondary: "#008833",
    accent: "#ccff00",
    fog: "#00150a",
    bg: "#000a05"
  },
  crimson: {
    id: "crimson",
    name: "Hyper Crimson",
    primary: "#ff2244",
    secondary: "#ff9900",
    accent: "#ffffff",
    fog: "#1f0005",
    bg: "#100003"
  }
};

// --- TYPES ---
interface ItemEntity {
  id: number;
  x: number;
  y: number;
  z: number;
  type: "obstacle" | "orb" | "shield" | "battery" | "drone";
  active: boolean;
  scale: number;
  rotationSpeed: number;
}

interface LaserEntity {
  id: number;
  x: number;
  y: number;
  z: number;
  active: boolean;
}

// --- 3D CANVAS COMPONENTS ---

// Player Starfighter Mesh Component
function CyberCraft({
  posX,
  posY,
  roll,
  isShielded,
  isBoosting,
  theme
}: {
  posX: number;
  posY: number;
  roll: number;
  isShielded: boolean;
  isBoosting: boolean;
  theme: ThemePalette;
}) {
  const meshRef = useRef<THREE.Group>(null);
  const thrusterRef = useRef<THREE.Mesh>(null);

  useFrame((state, delta) => {
    if (meshRef.current) {
      meshRef.current.position.x = THREE.MathUtils.lerp(meshRef.current.position.x, posX, delta * 14);
      meshRef.current.position.y = THREE.MathUtils.lerp(meshRef.current.position.y, posY - 0.8, delta * 12);
      meshRef.current.rotation.z = THREE.MathUtils.lerp(meshRef.current.rotation.z, -roll * 0.45, delta * 12);
      meshRef.current.rotation.y = THREE.MathUtils.lerp(meshRef.current.rotation.y, roll * 0.25, delta * 10);
      meshRef.current.rotation.x = THREE.MathUtils.lerp(meshRef.current.rotation.x, (isBoosting ? -0.15 : 0), delta * 8);
    }
    if (thrusterRef.current) {
      const s = 1 + Math.sin(state.clock.elapsedTime * 30) * 0.2 + (isBoosting ? 1.5 : 0);
      thrusterRef.current.scale.set(s, s, s * (isBoosting ? 2.5 : 1));
    }
  });

  return (
    <group ref={meshRef} position={[0, -0.8, 3]}>
      {/* Ship Body Center Hull */}
      <mesh position={[0, 0, -0.4]} rotation={[Math.PI / 2, 0, 0]}>
        <coneGeometry args={[0.4, 1.6, 5]} />
        <meshStandardMaterial
          color={theme.primary}
          metalness={0.9}
          roughness={0.1}
          emissive={theme.primary}
          emissiveIntensity={isBoosting ? 0.9 : 0.4}
        />
      </mesh>

      {/* Cockpit Glass */}
      <mesh position={[0, 0.18, -0.1]}>
        <boxGeometry args={[0.32, 0.22, 0.7]} />
        <meshPhysicalMaterial
          color="#ffffff"
          transmission={0.8}
          opacity={0.9}
          transparent
          roughness={0.05}
          ior={1.5}
        />
      </mesh>

      {/* Left Wing */}
      <group position={[-0.75, 0, 0.1]} rotation={[0, -0.2, -0.1]}>
        <mesh>
          <boxGeometry args={[0.9, 0.06, 0.9]} />
          <meshStandardMaterial color={theme.secondary} metalness={0.8} roughness={0.2} />
        </mesh>
        {/* Wingtip Weapon Pod */}
        <mesh position={[-0.45, 0, -0.3]}>
          <cylinderGeometry args={[0.06, 0.06, 0.6, 8]} />
          <meshStandardMaterial color={theme.accent} emissive={theme.accent} emissiveIntensity={0.6} />
        </mesh>
      </group>

      {/* Right Wing */}
      <group position={[0.75, 0, 0.1]} rotation={[0, 0.2, 0.1]}>
        <mesh>
          <boxGeometry args={[0.9, 0.06, 0.9]} />
          <meshStandardMaterial color={theme.secondary} metalness={0.8} roughness={0.2} />
        </mesh>
        {/* Wingtip Weapon Pod */}
        <mesh position={[0.45, 0, -0.3]}>
          <cylinderGeometry args={[0.06, 0.06, 0.6, 8]} />
          <meshStandardMaterial color={theme.accent} emissive={theme.accent} emissiveIntensity={0.6} />
        </mesh>
      </group>

      {/* Dual Engine Thrusters */}
      <mesh ref={thrusterRef} position={[0, 0, 0.55]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.2, 0.05, 0.8, 12]} />
        <meshBasicMaterial color={isBoosting ? "#ffffff" : theme.accent} transparent opacity={0.95} />
      </mesh>

      {/* Protective Energy Shield Sphere */}
      {isShielded && (
        <mesh position={[0, 0, -0.2]}>
          <sphereGeometry args={[1.3, 24, 24]} />
          <meshStandardMaterial
            color={theme.primary}
            wireframe
            transparent
            opacity={0.6}
            emissive={theme.primary}
            emissiveIntensity={0.8}
          />
        </mesh>
      )}
    </group>
  );
}

// 3D Neon Horizon Grid Highway
function HorizonGrid({ speed, theme }: { speed: number; theme: ThemePalette }) {
  const gridRef = useRef<THREE.Mesh>(null);

  useFrame((_, delta) => {
    if (gridRef.current) {
      // Animate grid texture offset to create motion forward effect
      const mat = gridRef.current.material as THREE.MeshStandardMaterial;
      if (mat && mat.map) {
        mat.map.offset.y -= delta * (speed * 0.04);
      }
    }
  });

  const gridTexture = useMemo(() => {
    if (typeof window === "undefined") return null;
    const canvas = document.createElement("canvas");
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.fillStyle = theme.bg;
      ctx.fillRect(0, 0, 512, 512);

      ctx.strokeStyle = theme.primary;
      ctx.lineWidth = 4;
      ctx.shadowColor = theme.primary;
      ctx.shadowBlur = 10;

      // Draw Grid Lines
      const step = 32;
      for (let x = 0; x <= 512; x += step) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, 512);
        ctx.stroke();
      }
      for (let y = 0; y <= 512; y += step) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(512, y);
        ctx.stroke();
      }
    }
    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(12, 30);
    return texture;
  }, [theme]);

  return (
    <mesh ref={gridRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, -2, -40]}>
      <planeGeometry args={[60, 160]} />
      {gridTexture ? (
        <meshStandardMaterial map={gridTexture} roughness={0.1} metalness={0.5} />
      ) : (
        <meshStandardMaterial color={theme.bg} wireframe />
      )}
    </mesh>
  );
}

// Render Lasers Shot by Player
function LasersRenderer({ lasers, theme }: { lasers: LaserEntity[]; theme: ThemePalette }) {
  return (
    <group>
      {lasers
        .filter((l) => l.active)
        .map((l) => (
          <mesh key={l.id} position={[l.x, l.y, l.z]}>
            <boxGeometry args={[0.15, 0.15, 1.4]} />
            <meshBasicMaterial color={theme.accent} />
          </mesh>
        ))}
    </group>
  );
}

// Render Track Entities (Obstacles, Orbs, Shields, Boost Batteries)
function EntitiesRenderer({ entities, theme }: { entities: ItemEntity[]; theme: ThemePalette }) {
  return (
    <group>
      {entities
        .filter((e) => e.active)
        .map((e) => {
          if (e.type === "obstacle") {
            return (
              <mesh key={e.id} position={[e.x, e.y, e.z]} rotation={[0, e.z * 0.05, 0]} scale={e.scale}>
                <octahedronGeometry args={[1, 0]} />
                <meshStandardMaterial
                  color={theme.secondary}
                  roughness={0.2}
                  metalness={0.8}
                  emissive={theme.secondary}
                  emissiveIntensity={0.5}
                />
              </mesh>
            );
          } else if (e.type === "drone") {
            return (
              <group key={e.id} position={[e.x, e.y, e.z]} scale={e.scale}>
                <mesh rotation={[0, e.z * 0.1, 0]}>
                  <torusGeometry args={[0.8, 0.2, 8, 16]} />
                  <meshStandardMaterial color="#ff0044" emissive="#ff0044" emissiveIntensity={0.8} />
                </mesh>
                <mesh>
                  <sphereGeometry args={[0.4, 12, 12]} />
                  <meshStandardMaterial color="#ffffff" emissive="#ffffff" />
                </mesh>
              </group>
            );
          } else if (e.type === "orb") {
            return (
              <Float key={e.id} speed={4} floatIntensity={1}>
                <mesh position={[e.x, e.y, e.z]} scale={e.scale}>
                  <sphereGeometry args={[0.5, 16, 16]} />
                  <meshStandardMaterial
                    color={theme.accent}
                    emissive={theme.accent}
                    emissiveIntensity={0.9}
                    roughness={0.1}
                  />
                </mesh>
              </Float>
            );
          } else if (e.type === "shield") {
            return (
              <Float key={e.id} speed={3} floatIntensity={0.8}>
                <mesh position={[e.x, e.y, e.z]} scale={e.scale}>
                  <icosahedronGeometry args={[0.6, 0]} />
                  <meshStandardMaterial color={theme.primary} emissive={theme.primary} emissiveIntensity={1} wireframe />
                </mesh>
              </Float>
            );
          } else if (e.type === "battery") {
            return (
              <Float key={e.id} speed={5} floatIntensity={1.2}>
                <mesh position={[e.x, e.y, e.z]} scale={e.scale} rotation={[0, e.z * 0.1, 0]}>
                  <boxGeometry args={[0.6, 0.8, 0.6]} />
                  <meshStandardMaterial color="#ffaa00" emissive="#ffaa00" emissiveIntensity={1} />
                </mesh>
              </Float>
            );
          }
          return null;
        })}
    </group>
  );
}

// Environmental Background Atmosphere (Distant Neon Sun, Stars & Fog)
function Atmosphere({ theme }: { theme: ThemePalette }) {
  return (
    <group position={[0, 0, -80]}>
      {/* Synthwave Sun */}
      <mesh position={[0, 10, 0]}>
        <circleGeometry args={[22, 64]} />
        <meshBasicMaterial color={theme.secondary} />
      </mesh>

      {/* Cyber Sparkles */}
      <Sparkles count={120} scale={[80, 40, 80]} size={6} speed={0.4} color={theme.primary} />
    </group>
  );
}

// 3D Scene Wrapper
function GameScene({
  posX,
  posY,
  roll,
  speed,
  isShielded,
  isBoosting,
  entities,
  lasers,
  theme
}: {
  posX: number;
  posY: number;
  roll: number;
  speed: number;
  isShielded: boolean;
  isBoosting: boolean;
  entities: ItemEntity[];
  lasers: LaserEntity[];
  theme: ThemePalette;
}) {
  return (
    <>
      <color attach="background" args={[theme.bg]} />
      <fog attach="fog" args={[theme.fog, 30, 90]} />
      <PerspectiveCamera makeDefault position={[0, 1.8, 8]} fov={isBoosting ? 85 : 70} />

      <ambientLight intensity={0.6} />
      <directionalLight position={[10, 20, 15]} intensity={1.2} />
      <pointLight position={[0, 2, 4]} intensity={2} color={theme.primary} />

      <CyberCraft
        posX={posX}
        posY={posY}
        roll={roll}
        isShielded={isShielded}
        isBoosting={isBoosting}
        theme={theme}
      />
      <HorizonGrid speed={speed} theme={theme} />
      <EntitiesRenderer entities={entities} theme={theme} />
      <LasersRenderer lasers={lasers} theme={theme} />
      <Atmosphere theme={theme} />
    </>
  );
}

// --- MAIN HYPER HORIZON GAME COMPONENT ---
export default function HyperHorizonGame() {
  // Game states
  const [gameState, setGameState] = useState<"menu" | "playing" | "paused" | "gameover">("menu");
  const [activeTheme, setActiveTheme] = useState<string>("synth");

  // Player Stats & Controls
  const [posX, setPosX] = useState<number>(0);
  const [posY, setPosY] = useState<number>(0);
  const [roll, setRoll] = useState<number>(0);
  const [score, setScore] = useState<number>(0);
  const [highScore, setHighScore] = useState<number>(0);
  const [multiplier, setMultiplier] = useState<number>(1);
  const [shields, setShields] = useState<number>(3);
  const [boostEnergy, setBoostEnergy] = useState<number>(100);
  const [isBoosting, setIsBoosting] = useState<boolean>(false);
  const [orbsCollected, setOrbsCollected] = useState<number>(0);
  const [distance, setDistance] = useState<number>(0);
  const [speed, setSpeed] = useState<number>(40);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [laserAmmo, setLaserAmmo] = useState<number>(10);

  // Entities state
  const [entities, setEntities] = useState<ItemEntity[]>([]);
  const [lasers, setLasers] = useState<LaserEntity[]>([]);

  // Upgrades purchased with credits
  const [credits, setCredits] = useState<number>(0);
  const [shieldUpgrade, setShieldUpgrade] = useState<number>(0);
  const [laserUpgrade, setLaserUpgrade] = useState<number>(0);

  const keysPressed = useRef<Record<string, boolean>>({});
  const nextEntityId = useRef<number>(1);
  const nextLaserId = useRef<number>(1);
  const lastSpawnTime = useRef<number>(0);
  const theme = THEMES[activeTheme] || THEMES.synth;

  // Load Saved High Scores & Upgrades
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedHigh = localStorage.getItem("hyper_horizon_highscore");
      if (savedHigh) setHighScore(parseInt(savedHigh, 10));

      const savedCreds = localStorage.getItem("hyper_horizon_credits");
      if (savedCreds) setCredits(parseInt(savedCreds, 10));

      const savedShieldUp = localStorage.getItem("hyper_horizon_shield_up");
      if (savedShieldUp) setShieldUpgrade(parseInt(savedShieldUp, 10));
    }
  }, []);

  // Keyboard Event Listeners
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      keysPressed.current[e.key] = true;

      if (e.key === "p" || e.key === "P" || e.key === "Escape") {
        if (gameState === "playing") setGameState("paused");
        else if (gameState === "paused") setGameState("playing");
      }

      if (e.key === " " && gameState === "playing") {
        fireLaser();
      }

      if ((e.key === "Shift" || e.key === "e" || e.key === "E") && gameState === "playing") {
        activateBoost();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      keysPressed.current[e.key] = false;
      if (e.key === "Shift" || e.key === "e" || e.key === "E") {
        setIsBoosting(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [gameState, boostEnergy, laserAmmo]);

  // Fire Player Laser
  const fireLaser = () => {
    if (laserAmmo <= 0) return;
    setLaserAmmo((prev) => Math.max(0, prev - 1));
    sounds.playLaser();

    const newLaser: LaserEntity = {
      id: nextLaserId.current++,
      x: posX,
      y: posY - 0.7,
      z: 2.0,
      active: true
    };
    setLasers((prev) => [...prev, newLaser]);
  };

  // Trigger Hyper Boost
  const activateBoost = () => {
    if (boostEnergy > 20 && !isBoosting) {
      setIsBoosting(true);
      sounds.playHyperBoost();
    }
  };

  // Start Game
  const startGame = () => {
    setGameState("playing");
    setScore(0);
    setDistance(0);
    setMultiplier(1);
    setShields(3 + shieldUpgrade);
    setBoostEnergy(100);
    setOrbsCollected(0);
    setSpeed(45);
    setPosX(0);
    setPosY(0);
    setRoll(0);
    setEntities([]);
    setLasers([]);
    setLaserAmmo(10 + laserUpgrade * 5);
  };

  // Main Game Loop (RequestAnimationFrame)
  useEffect(() => {
    if (gameState !== "playing") return;

    let animFrameId: number;
    let lastTime = performance.now();

    const loop = (currentTime: number) => {
      const delta = Math.min((currentTime - lastTime) / 1000, 0.1);
      lastTime = currentTime;

      // 1. Handle Player Steering Movement
      let moveX = 0;
      let moveY = 0;

      if (keysPressed.current["ArrowLeft"] || keysPressed.current["a"] || keysPressed.current["A"]) {
        moveX -= 1;
      }
      if (keysPressed.current["ArrowRight"] || keysPressed.current["d"] || keysPressed.current["D"]) {
        moveX += 1;
      }
      if (keysPressed.current["ArrowUp"] || keysPressed.current["w"] || keysPressed.current["W"]) {
        moveY += 1;
      }
      if (keysPressed.current["ArrowDown"] || keysPressed.current["s"] || keysPressed.current["S"]) {
        moveY -= 1;
      }

      setPosX((prev) => Math.max(-5.5, Math.min(5.5, prev + moveX * delta * 14)));
      setPosY((prev) => Math.max(-0.5, Math.min(3.5, prev + moveY * delta * 10)));
      setRoll((prev) => THREE.MathUtils.lerp(prev, moveX, delta * 10));

      // Boost consumption & ammo regen
      if (isBoosting) {
        setBoostEnergy((prev) => {
          if (prev <= 0) {
            setIsBoosting(false);
            return 0;
          }
          return Math.max(0, prev - delta * 35);
        });
      } else {
        setBoostEnergy((prev) => Math.min(100, prev + delta * 8));
      }

      setLaserAmmo((prev) => Math.min(10 + laserUpgrade * 5, prev + delta * 1.5));

      // 2. Increase Speed & Distance
      const currentSpeed = isBoosting ? speed * 2.2 : speed;
      setDistance((prev) => prev + currentSpeed * delta * 0.1);
      setScore((prev) => prev + Math.floor(currentSpeed * delta * multiplier * 2));
      setSpeed((prev) => Math.min(110, prev + delta * 0.6));

      // 3. Spawn Entities
      if (currentTime - lastSpawnTime.current > Math.max(250, 900 - speed * 5)) {
        lastSpawnTime.current = currentTime;
        const spawnX = (Math.random() - 0.5) * 11;
        const spawnY = Math.random() * 3.5 - 0.5;

        const rand = Math.random();
        let entityType: ItemEntity["type"] = "obstacle";

        if (rand > 0.85) entityType = "orb";
        else if (rand > 0.75) entityType = "drone";
        else if (rand > 0.68) entityType = "battery";
        else if (rand > 0.62) entityType = "shield";

        const newEnt: ItemEntity = {
          id: nextEntityId.current++,
          x: spawnX,
          y: spawnY,
          z: -80,
          type: entityType,
          active: true,
          scale: entityType === "obstacle" ? 1.2 + Math.random() * 0.6 : 1,
          rotationSpeed: (Math.random() - 0.5) * 4
        };

        setEntities((prev) => [...prev.slice(-40), newEnt]);
      }

      // 4. Update Lasers Position
      setLasers((prev) =>
        prev
          .map((l) => ({ ...l, z: l.z - delta * 90 }))
          .filter((l) => l.z > -90 && l.active)
      );

      // 5. Update & Check Entity Collisions
      setEntities((prev) => {
        const updated: ItemEntity[] = [];

        for (const ent of prev) {
          if (!ent.active) continue;

          const newZ = ent.z + delta * currentSpeed;

          // Laser Hit Collisions
          let hitByLaser = false;
          lasers.forEach((l) => {
            if (l.active && Math.abs(l.x - ent.x) < 1.4 && Math.abs(l.y - ent.y) < 1.4 && Math.abs(l.z - newZ) < 3.0) {
              if (ent.type === "obstacle" || ent.type === "drone") {
                hitByLaser = true;
                l.active = false;
                sounds.playExplosion();
                setScore((s) => s + 500 * multiplier);
              }
            }
          });

          if (hitByLaser) continue;

          // Player Ship Collisions (z near player at +3.0)
          if (newZ >= 1.5 && newZ <= 4.2) {
            const distSq = (posX - ent.x) ** 2 + (posY - ent.y) ** 2;

            if (distSq < 1.4) {
              if (ent.type === "obstacle" || ent.type === "drone") {
                if (isBoosting) {
                  // Invulnerable during hyper boost!
                  sounds.playExplosion();
                  setScore((s) => s + 300);
                } else {
                  sounds.playExplosion();
                  setShields((s) => {
                    const next = s - 1;
                    if (next <= 0) {
                      setGameState("gameover");
                    }
                    return next;
                  });
                  setMultiplier(1);
                }
                continue;
              } else if (ent.type === "orb") {
                sounds.playOrbCollect();
                setOrbsCollected((o) => o + 1);
                setScore((s) => s + 250 * multiplier);
                setMultiplier((m) => Math.min(8, m + 1));
                setCredits((c) => c + 5);
                continue;
              } else if (ent.type === "shield") {
                sounds.playShieldUp();
                setShields((s) => Math.min(5, s + 1));
                continue;
              } else if (ent.type === "battery") {
                sounds.playOrbCollect();
                setBoostEnergy(100);
                continue;
              }
            }
          }

          if (newZ < 8) {
            updated.push({ ...ent, z: newZ });
          }
        }
        return updated;
      });

      animFrameId = requestAnimationFrame(loop);
    };

    animFrameId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animFrameId);
  }, [gameState, posX, posY, speed, isBoosting, multiplier, lasers, laserUpgrade]);

  // Sync High Score
  useEffect(() => {
    if (gameState === "gameover") {
      if (score > highScore) {
        setHighScore(score);
        localStorage.setItem("hyper_horizon_highscore", score.toString());
      }
      localStorage.setItem("hyper_horizon_credits", credits.toString());
    }
  }, [gameState, score, highScore, credits]);

  const toggleMute = () => {
    sounds.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  return (
    <div className="relative w-full h-screen overflow-hidden bg-slate-950 select-none font-sans text-white">
      {/* 3D WebGL Canvas Container */}
      <div className="absolute inset-0 z-0">
        <Canvas gl={{ antialias: true, alpha: false }}>
          <GameScene
            posX={posX}
            posY={posY}
            roll={roll}
            speed={speed}
            isShielded={shields > 0}
            isBoosting={isBoosting}
            entities={entities}
            lasers={lasers}
            theme={theme}
          />
        </Canvas>
      </div>

      {/* --- HUD OVERLAY (PLAYING STATE) --- */}
      {gameState === "playing" && (
        <div className="absolute inset-0 z-10 pointer-events-none p-6 flex flex-col justify-between">
          {/* Top Header Bar */}
          <div className="flex justify-between items-start">
            {/* Left: Score & Multiplier */}
            <div className="space-y-1 bg-black/60 backdrop-blur-md border border-cyan-500/30 p-4 rounded-xl shadow-lg shadow-cyan-500/10">
              <div className="text-xs uppercase tracking-widest text-cyan-400 font-semibold flex items-center gap-1.5">
                <Trophy className="w-3.5 h-3.5" /> Score
              </div>
              <div className="text-3xl font-black tracking-tight text-white">{score.toLocaleString()}</div>
              <div className="flex items-center gap-2 text-xs font-bold text-amber-400">
                <Flame className="w-3.5 h-3.5 animate-pulse" /> {multiplier}x Multiplier
              </div>
            </div>

            {/* Middle: Controls & Pause */}
            <div className="pointer-events-auto flex items-center gap-3">
              <button
                onClick={() => setGameState("paused")}
                className="p-3 bg-black/60 hover:bg-black/80 backdrop-blur-md border border-slate-700 hover:border-cyan-400 rounded-xl transition text-slate-300 hover:text-white"
              >
                <Pause className="w-5 h-5" />
              </button>
              <button
                onClick={toggleMute}
                className="p-3 bg-black/60 hover:bg-black/80 backdrop-blur-md border border-slate-700 hover:border-cyan-400 rounded-xl transition text-slate-300 hover:text-white"
              >
                {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
              </button>
            </div>

            {/* Right: Shields & Speedometer */}
            <div className="space-y-2 bg-black/60 backdrop-blur-md border border-cyan-500/30 p-4 rounded-xl shadow-lg text-right">
              <div className="text-xs uppercase tracking-widest text-emerald-400 font-semibold flex items-center justify-end gap-1.5">
                <Shield className="w-3.5 h-3.5" /> Shields ({shields})
              </div>
              <div className="flex justify-end gap-1.5">
                {[...Array(5)].map((_, i) => (
                  <div
                    key={i}
                    className={`w-6 h-2 rounded-sm transition-all duration-300 ${
                      i < shields ? "bg-emerald-400 shadow-sm shadow-emerald-400" : "bg-slate-800 border border-slate-700"
                    }`}
                  />
                ))}
              </div>
              <div className="text-xs text-slate-400 font-mono pt-1">
                SPEED: <span className="text-white font-bold">{Math.round(speed * 2.4)} KM/H</span>
              </div>
            </div>
          </div>

          {/* Bottom HUD: Hyper Boost & Ammo Meters */}
          <div className="flex justify-between items-end">
            {/* Boost Bar */}
            <div className="w-72 bg-black/70 backdrop-blur-md border border-amber-500/30 p-3 rounded-xl space-y-1">
              <div className="flex justify-between text-xs font-bold text-amber-400 uppercase tracking-wider">
                <span className="flex items-center gap-1"><Zap className="w-3.5 h-3.5" /> Hyper Boost (Shift)</span>
                <span>{Math.round(boostEnergy)}%</span>
              </div>
              <div className="w-full bg-slate-900 h-3 rounded-full overflow-hidden border border-amber-500/20">
                <div
                  className={`h-full transition-all duration-150 ${
                    isBoosting ? "bg-gradient-to-r from-amber-400 to-red-500 animate-pulse" : "bg-amber-400"
                  }`}
                  style={{ width: `${boostEnergy}%` }}
                />
              </div>
            </div>

            {/* Laser Ammo Indicator */}
            <div className="w-72 bg-black/70 backdrop-blur-md border border-cyan-500/30 p-3 rounded-xl space-y-1">
              <div className="flex justify-between text-xs font-bold text-cyan-400 uppercase tracking-wider">
                <span className="flex items-center gap-1"><Crosshair className="w-3.5 h-3.5" /> Plasma Cannons (Space)</span>
                <span>{Math.round(laserAmmo)} AMMO</span>
              </div>
              <div className="w-full bg-slate-900 h-3 rounded-full overflow-hidden border border-cyan-500/20">
                <div
                  className="h-full bg-cyan-400 transition-all duration-150"
                  style={{ width: `${(laserAmmo / (10 + laserUpgrade * 5)) * 100}%` }}
                />
              </div>
            </div>
          </div>

          {/* Mobile On-Screen Controls */}
          <div className="md:hidden pointer-events-auto flex justify-between items-center pb-4">
            <div className="grid grid-cols-3 gap-2 w-36">
              <div />
              <button
                onMouseDown={() => (keysPressed.current["w"] = true)}
                onMouseUp={() => (keysPressed.current["w"] = false)}
                className="bg-black/70 border border-slate-700 p-4 rounded-lg text-center font-bold"
              >
                ▲
              </button>
              <div />
              <button
                onMouseDown={() => (keysPressed.current["a"] = true)}
                onMouseUp={() => (keysPressed.current["a"] = false)}
                className="bg-black/70 border border-slate-700 p-4 rounded-lg text-center font-bold"
              >
                ◀
              </button>
              <button
                onMouseDown={() => (keysPressed.current["s"] = true)}
                onMouseUp={() => (keysPressed.current["s"] = false)}
                className="bg-black/70 border border-slate-700 p-4 rounded-lg text-center font-bold"
              >
                ▼
              </button>
              <button
                onMouseDown={() => (keysPressed.current["d"] = true)}
                onMouseUp={() => (keysPressed.current["d"] = false)}
                className="bg-black/70 border border-slate-700 p-4 rounded-lg text-center font-bold"
              >
                ▶
              </button>
            </div>

            <div className="flex gap-2">
              <button
                onClick={fireLaser}
                className="bg-cyan-600 hover:bg-cyan-500 border border-cyan-400 p-4 rounded-xl font-black text-xs tracking-wider"
              >
                FIRE
              </button>
              <button
                onClick={activateBoost}
                className="bg-amber-600 hover:bg-amber-500 border border-amber-400 p-4 rounded-xl font-black text-xs tracking-wider"
              >
                BOOST
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- START MENU OVERLAY --- */}
      {gameState === "menu" && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/80 backdrop-blur-xl p-6">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="max-w-xl w-full bg-slate-900/90 border border-cyan-500/40 rounded-3xl p-8 shadow-2xl shadow-cyan-500/20 space-y-6 text-center"
          >
            {/* Header */}
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-cyan-500/10 border border-cyan-400/30 rounded-full text-xs font-semibold text-cyan-400 uppercase tracking-widest mb-3">
                <SparklesIcon className="w-3.5 h-3.5" /> 3D Cyberpunk Horizon Racer
              </div>
              <h1 className="text-5xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-pink-500 to-amber-400">
                HYPER HORIZON 3D
              </h1>
              <p className="text-sm text-slate-400 mt-2">
                Pilot your synthwave apex starfighter. Dodge rogue pylons, destroy alien drones, and reach lightspeed!
              </p>
            </div>

            {/* High Score & Credits Stats */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4">
                <div className="text-xs text-slate-400 uppercase font-semibold flex items-center justify-center gap-1.5">
                  <Trophy className="w-4 h-4 text-amber-400" /> Best Score
                </div>
                <div className="text-2xl font-black text-white mt-1">{highScore.toLocaleString()}</div>
              </div>
              <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4">
                <div className="text-xs text-slate-400 uppercase font-semibold flex items-center justify-center gap-1.5">
                  <SparklesIcon className="w-4 h-4 text-cyan-400" /> Credits Earned
                </div>
                <div className="text-2xl font-black text-cyan-400 mt-1">{credits} CR</div>
              </div>
            </div>

            {/* Theme Selector */}
            <div className="space-y-2 text-left">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Palette className="w-3.5 h-3.5" /> Visual Cyber Theme
              </label>
              <div className="grid grid-cols-4 gap-2">
                {Object.values(THEMES).map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setActiveTheme(t.id)}
                    className={`p-2.5 rounded-xl border text-xs font-bold transition flex flex-col items-center gap-1 ${
                      activeTheme === t.id
                        ? "border-cyan-400 bg-cyan-500/20 text-white"
                        : "border-slate-800 bg-slate-950 text-slate-400 hover:border-slate-700"
                    }`}
                  >
                    <div
                      className="w-4 h-4 rounded-full border border-white/20"
                      style={{ backgroundColor: t.primary }}
                    />
                    {t.name.split(" ")[0]}
                  </button>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3 pt-2">
              <button
                onClick={startGame}
                className="w-full py-4 bg-gradient-to-r from-cyan-500 via-pink-500 to-amber-500 hover:brightness-110 text-black font-black text-lg tracking-wider rounded-2xl transition shadow-lg shadow-cyan-500/30 flex items-center justify-center gap-2"
              >
                <Play className="w-5 h-5 fill-black" /> LAUNCH MISSION
              </button>

              <div className="flex gap-3">
                <Link
                  href="/games"
                  className="flex-1 py-3 bg-slate-950 hover:bg-slate-900 border border-slate-800 rounded-xl text-xs font-bold text-slate-300 hover:text-white transition flex items-center justify-center gap-1.5"
                >
                  <ArrowLeft className="w-4 h-4" /> Exit to Games Portal
                </Link>
                <button
                  onClick={toggleMute}
                  className="px-4 py-3 bg-slate-950 hover:bg-slate-900 border border-slate-800 rounded-xl text-xs font-bold text-slate-300 transition flex items-center justify-center gap-1.5"
                >
                  {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />} Audio
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* --- PAUSE MENU OVERLAY --- */}
      {gameState === "paused" && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/80 backdrop-blur-md p-6">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-8 text-center space-y-6"
          >
            <h2 className="text-3xl font-black text-white">MISSION PAUSED</h2>
            <div className="space-y-3">
              <button
                onClick={() => setGameState("playing")}
                className="w-full py-3.5 bg-cyan-500 hover:bg-cyan-400 text-black font-bold rounded-xl transition"
              >
                RESUME FLIGHT
              </button>
              <button
                onClick={startGame}
                className="w-full py-3.5 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl transition"
              >
                RESTART MISSION
              </button>
              <button
                onClick={() => setGameState("menu")}
                className="w-full py-3.5 bg-red-900/40 hover:bg-red-900/60 border border-red-500/40 text-red-300 font-bold rounded-xl transition"
              >
                ABORT TO MENU
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* --- GAME OVER OVERLAY --- */}
      {gameState === "gameover" && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/85 backdrop-blur-xl p-6">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="max-w-lg w-full bg-slate-900/90 border border-red-500/40 rounded-3xl p-8 text-center space-y-6 shadow-2xl shadow-red-500/20"
          >
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-red-500/20 border border-red-500/30 rounded-full text-xs font-bold text-red-400 uppercase tracking-widest mb-3">
                Mission Terminated
              </div>
              <h2 className="text-4xl font-black text-white">SHIP DESTROYED</h2>
            </div>

            {/* Score Breakdown Table */}
            <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 space-y-3 text-left">
              <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                <span className="text-xs text-slate-400 uppercase font-semibold">Final Score</span>
                <span className="text-xl font-black text-cyan-400">{score.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                <span className="text-xs text-slate-400 uppercase font-semibold">Distance Traveled</span>
                <span className="text-sm font-bold text-white">{Math.floor(distance)} KM</span>
              </div>
              <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                <span className="text-xs text-slate-400 uppercase font-semibold">Orbs Collected</span>
                <span className="text-sm font-bold text-amber-400">{orbsCollected}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-slate-400 uppercase font-semibold">Credits Earned</span>
                <span className="text-sm font-bold text-emerald-400">+{orbsCollected * 5} CR</span>
              </div>
            </div>

            {/* Buttons */}
            <div className="space-y-3">
              <button
                onClick={startGame}
                className="w-full py-4 bg-gradient-to-r from-cyan-500 to-pink-500 hover:brightness-110 text-black font-black text-lg tracking-wider rounded-2xl transition shadow-lg shadow-cyan-500/30 flex items-center justify-center gap-2"
              >
                <RotateCcw className="w-5 h-5" /> PLAY AGAIN
              </button>
              <button
                onClick={() => setGameState("menu")}
                className="w-full py-3 bg-slate-950 hover:bg-slate-900 border border-slate-800 text-slate-300 font-bold rounded-xl transition"
              >
                MAIN MENU
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
