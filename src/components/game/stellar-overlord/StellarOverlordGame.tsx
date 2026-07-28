"use client";

import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
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
  Crosshair,
  Sparkles as SparklesIcon,
  Radio,
  Rocket,
  Award,
  Target,
  Cpu,
  Layers,
  Pause,
  RefreshCw,
  Gauge,
  Sliders,
  CheckCircle2,
  Skull
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

// ==========================================
// 1. PROCEDURAL WEB AUDIO SYNTHESIZER
// ==========================================
class SynthAudioEngine {
  private ctx: AudioContext | null = null;
  public muted: boolean = false;

  private initCtx() {
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

  public playLaser(pitchShift: number = 1.0) {
    if (this.muted) return;
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(880 * pitchShift, now);
    osc.frequency.exponentialRampToValueAtTime(110 * pitchShift, now + 0.12);

    gain.gain.setValueAtTime(0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.12);
  }

  public playPlasma() {
    if (this.muted) return;
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = "square";
    osc.frequency.setValueAtTime(350, now);
    osc.frequency.exponentialRampToValueAtTime(80, now + 0.25);

    gain.gain.setValueAtTime(0.25, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.25);
  }

  public playExplosion(isBoss: boolean = false) {
    if (this.muted) return;
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const duration = isBoss ? 0.8 : 0.4;
    
    // Noise buffer generation
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
    filter.frequency.setValueAtTime(isBoss ? 400 : 800, now);
    filter.frequency.linearRampToValueAtTime(40, now + duration);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(isBoss ? 0.5 : 0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    whiteNoise.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);

    whiteNoise.start(now);
    whiteNoise.stop(now + duration);
  }

  public playShieldCollect() {
    if (this.muted) return;
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(440, now);
    osc.frequency.exponentialRampToValueAtTime(1320, now + 0.25);

    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.25);
  }

  public playBoost() {
    if (this.muted) return;
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(150, now);
    osc.frequency.exponentialRampToValueAtTime(600, now + 0.35);

    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.35);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.35);
  }

  public playEMP() {
    if (this.muted) return;
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(1200, now);
    osc.frequency.exponentialRampToValueAtTime(100, now + 0.5);

    gain.gain.setValueAtTime(0.4, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.5);
  }

  public playBossWarning() {
    if (this.muted) return;
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    for (let i = 0; i < 3; i++) {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(160, now + i * 0.18);

      gain.gain.setValueAtTime(0.3, now + i * 0.18);
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.18 + 0.15);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now + i * 0.18);
      osc.stop(now + i * 0.18 + 0.15);
    }
  }

  public playGameOver() {
    if (this.muted) return;
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const notes = [300, 250, 200, 150];
    notes.forEach((freq, idx) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();

      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(freq, now + idx * 0.15);

      gain.gain.setValueAtTime(0.3, now + idx * 0.15);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.15 + 0.2);

      osc.connect(gain);
      gain.connect(this.ctx!.destination);

      osc.start(now + idx * 0.15);
      osc.stop(now + idx * 0.15 + 0.2);
    });
  }
}

const audioSynth = new SynthAudioEngine();

// ==========================================
// 2. TYPES AND INTERFACES
// ==========================================
export interface BulletItem {
  id: string;
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  isEnemy: boolean;
  damage: number;
  color: string;
}

export interface EnemyItem {
  id: string;
  type: "scout" | "interceptor" | "heavy" | "mine" | "boss";
  x: number;
  y: number;
  z: number;
  speed: number;
  hp: number;
  maxHp: number;
  scoreValue: number;
  shootTimer: number;
  radius: number;
  color: string;
}

export interface ParticleItem {
  id: string;
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
}

export interface PowerUpItem {
  id: string;
  type: "shield" | "boost" | "multishot" | "emp" | "credits";
  x: number;
  y: number;
  z: number;
}

export interface ShipUpgrades {
  fireRateLevel: number;
  shieldMaxLevel: number;
  speedLevel: number;
  multiShotLevel: number;
  empCooldownLevel: number;
}

// ==========================================
// 3. THREE.JS 3D MESH COMPONENTS
// ==========================================

// Synthwave Grid & Dynamic Nebula Horizon
function SynthwaveEnvironment({ speedMultiplier }: { speedMultiplier: number }) {
  const gridRef = useRef<THREE.Mesh>(null);
  const nebulaRef = useRef<THREE.Group>(null);

  useFrame((_, delta) => {
    if (gridRef.current) {
      gridRef.current.position.z += delta * 24 * speedMultiplier;
      if (gridRef.current.position.z > 20) {
        gridRef.current.position.z = 0;
      }
    }
    if (nebulaRef.current) {
      nebulaRef.current.rotation.z += delta * 0.05;
    }
  });

  return (
    <group>
      {/* Background Starfield & Space Dust */}
      <Sparkles count={300} scale={[60, 40, 80]} size={2.5} speed={0.8 * speedMultiplier} color="#38bdf8" />
      <Sparkles count={150} scale={[80, 50, 90]} size={4.0} speed={1.2 * speedMultiplier} color="#f43f5e" />

      {/* Cyber Grid Floor */}
      <mesh ref={gridRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, -8, 0]}>
        <planeGeometry args={[120, 120, 40, 40]} />
        <meshBasicMaterial color="#a855f7" wireframe transparent opacity={0.25} />
      </mesh>

      {/* Grid Ceiling */}
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 16, 0]}>
        <planeGeometry args={[120, 120, 30, 30]} />
        <meshBasicMaterial color="#06b6d4" wireframe transparent opacity={0.15} />
      </mesh>

      {/* Synthwave Sun horizon */}
      <Float speed={1.5} rotationIntensity={0.2} floatIntensity={0.5}>
        <group ref={nebulaRef} position={[0, 4, -45]}>
          <mesh>
            <sphereGeometry args={[14, 32, 32]} />
            <meshBasicMaterial color="#f43f5e" wireframe />
          </mesh>
          <pointLight color="#ec4899" intensity={3} distance={90} />
        </group>
      </Float>
    </group>
  );
}

// Player 3D Apex Starfighter
function PlayerStarfighter3D({
  x,
  y,
  roll,
  pitch,
  isBoosting,
  isShieldActive
}: {
  x: number;
  y: number;
  roll: number;
  pitch: number;
  isBoosting: boolean;
  isShieldActive: boolean;
}) {
  const shipGroupRef = useRef<THREE.Group>(null);
  const engineGlowRef = useRef<THREE.Mesh>(null);

  useFrame((_, delta) => {
    if (shipGroupRef.current) {
      shipGroupRef.current.position.x = THREE.MathUtils.lerp(shipGroupRef.current.position.x, x, delta * 15);
      shipGroupRef.current.position.y = THREE.MathUtils.lerp(shipGroupRef.current.position.y, y, delta * 15);
      shipGroupRef.current.rotation.z = THREE.MathUtils.lerp(shipGroupRef.current.rotation.z, -roll * 0.8, delta * 12);
      shipGroupRef.current.rotation.x = THREE.MathUtils.lerp(shipGroupRef.current.rotation.x, pitch * 0.4, delta * 12);
    }
    if (engineGlowRef.current) {
      const scale = isBoosting ? 1.8 + Math.sin(Date.now() * 0.02) * 0.4 : 1.0 + Math.sin(Date.now() * 0.01) * 0.2;
      engineGlowRef.current.scale.set(scale, scale, scale);
    }
  });

  return (
    <group ref={shipGroupRef} position={[0, 0, 0]}>
      {/* Fuselage / Main Cockpit */}
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
        <coneGeometry args={[0.7, 3.2, 5]} />
        <meshStandardMaterial color="#0284c7" metalness={0.9} roughness={0.1} emissive="#0284c7" emissiveIntensity={0.3} />
      </mesh>

      {/* Left Cyber Wing */}
      <mesh position={[-1.3, -0.2, 0.4]} rotation={[0.2, 0.3, -0.3]}>
        <boxGeometry args={[1.8, 0.1, 1.2]} />
        <meshStandardMaterial color="#38bdf8" metalness={0.8} roughness={0.2} emissive="#0ea5e9" emissiveIntensity={0.4} />
      </mesh>

      {/* Right Cyber Wing */}
      <mesh position={[1.3, -0.2, 0.4]} rotation={[0.2, -0.3, 0.3]}>
        <boxGeometry args={[1.8, 0.1, 1.2]} />
        <meshStandardMaterial color="#38bdf8" metalness={0.8} roughness={0.2} emissive="#0ea5e9" emissiveIntensity={0.4} />
      </mesh>

      {/* Wingtip Plasma Cannons */}
      <mesh position={[-2.2, -0.2, -0.2]}>
        <cylinderGeometry args={[0.08, 0.08, 1.2]} />
        <meshStandardMaterial color="#38bdf8" emissive="#38bdf8" emissiveIntensity={0.8} />
      </mesh>
      <mesh position={[2.2, -0.2, -0.2]}>
        <cylinderGeometry args={[0.08, 0.08, 1.2]} />
        <meshStandardMaterial color="#38bdf8" emissive="#38bdf8" emissiveIntensity={0.8} />
      </mesh>

      {/* Thruster Engine Glow */}
      <mesh ref={engineGlowRef} position={[0, 0, 1.6]}>
        <sphereGeometry args={[0.45, 16, 16]} />
        <meshBasicMaterial color={isBoosting ? "#ef4444" : "#38bdf8"} />
      </mesh>

      {/* Force Shield Sphere */}
      {isShieldActive && (
        <mesh position={[0, 0, 0]}>
          <sphereGeometry args={[2.5, 24, 24]} />
          <meshStandardMaterial color="#06b6d4" transparent opacity={0.35} wireframe emissive="#06b6d4" emissiveIntensity={0.5} />
        </mesh>
      )}

      {/* Ship Spotlight */}
      <pointLight color="#38bdf8" intensity={4} distance={15} />
    </group>
  );
}

// 3D Enemy Renderer
function EnemyMesh3D({ enemy }: { enemy: EnemyItem }) {
  const enemyRef = useRef<THREE.Group>(null);

  useFrame((_, delta) => {
    if (enemyRef.current) {
      enemyRef.current.position.set(enemy.x, enemy.y, enemy.z);
      if (enemy.type === "mine") {
        enemyRef.current.rotation.x += delta * 2;
        enemyRef.current.rotation.y += delta * 3;
      } else if (enemy.type === "boss") {
        enemyRef.current.rotation.y += delta * 0.4;
      } else {
        enemyRef.current.rotation.z += delta * 1.5;
      }
    }
  });

  if (enemy.type === "boss") {
    return (
      <group ref={enemyRef}>
        {/* Boss Core Structure */}
        <mesh>
          <octahedronGeometry args={[4.5, 2]} />
          <meshStandardMaterial color="#ef4444" metalness={0.9} roughness={0.1} emissive="#dc2626" emissiveIntensity={0.6} />
        </mesh>
        {/* Boss Shield Orbit Ring */}
        <mesh rotation={[Math.PI / 3, 0, 0]}>
          <torusGeometry args={[7, 0.4, 16, 64]} />
          <meshBasicMaterial color="#f43f5e" wireframe />
        </mesh>
        <pointLight color="#ef4444" intensity={8} distance={30} />
      </group>
    );
  }

  if (enemy.type === "mine") {
    return (
      <group ref={enemyRef}>
        <mesh>
          <dodecahedronGeometry args={[enemy.radius]} />
          <meshStandardMaterial color="#f59e0b" emissive="#d97706" emissiveIntensity={0.7} wireframe />
        </mesh>
        <pointLight color="#f59e0b" intensity={2} distance={8} />
      </group>
    );
  }

  return (
    <group ref={enemyRef}>
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <coneGeometry args={[enemy.radius, enemy.radius * 2.5, 4]} />
        <meshStandardMaterial color={enemy.color} metalness={0.7} roughness={0.3} emissive={enemy.color} emissiveIntensity={0.5} />
      </mesh>
      <pointLight color={enemy.color} intensity={2} distance={10} />
    </group>
  );
}

// 3D Laser / Plasma Bullets
function Bullets3D({ bullets }: { bullets: BulletItem[] }) {
  return (
    <group>
      {bullets.map((b) => (
        <mesh key={b.id} position={[b.x, b.y, b.z]}>
          <sphereGeometry args={[b.isEnemy ? 0.35 : 0.22, 12, 12]} />
          <meshBasicMaterial color={b.color} />
        </mesh>
      ))}
    </group>
  );
}

// 3D Explosions & Debris Particles
function Particles3D({ particles }: { particles: ParticleItem[] }) {
  return (
    <group>
      {particles.map((p) => (
        <mesh key={p.id} position={[p.x, p.y, p.z]}>
          <sphereGeometry args={[p.size * (p.life / p.maxLife), 8, 8]} />
          <meshBasicMaterial color={p.color} transparent opacity={p.life / p.maxLife} />
        </mesh>
      ))}
    </group>
  );
}

// 3D Floating PowerUps
function PowerUps3D({ powerUps }: { powerUps: PowerUpItem[] }) {
  return (
    <group>
      {powerUps.map((p) => (
        <Float key={p.id} speed={4} rotationIntensity={1} floatIntensity={1}>
          <mesh position={[p.x, p.y, p.z]}>
            <octahedronGeometry args={[0.9]} />
            <meshStandardMaterial
              color={
                p.type === "shield"
                  ? "#06b6d4"
                  : p.type === "boost"
                  ? "#ef4444"
                  : p.type === "emp"
                  ? "#a855f7"
                  : "#f59e0b"
              }
              emissiveIntensity={0.9}
              emissive={
                p.type === "shield"
                  ? "#06b6d4"
                  : p.type === "boost"
                  ? "#ef4444"
                  : p.type === "emp"
                  ? "#a855f7"
                  : "#f59e0b"
              }
            />
          </mesh>
        </Float>
      ))}
    </group>
  );
}

// Dynamic Camera Rig with Speed Tilt & Screen Shake
function CameraRig({
  shakeIntensity,
  isBoosting
}: {
  shakeIntensity: number;
  isBoosting: boolean;
}) {
  const { camera } = useThree();

  useFrame((_, delta) => {
    const targetFov = isBoosting ? 85 : 75;
    if (camera instanceof THREE.PerspectiveCamera) {
      camera.fov = THREE.MathUtils.lerp(camera.fov, targetFov, delta * 5);
      camera.updateProjectionMatrix();
    }

    if (shakeIntensity > 0) {
      camera.position.x = (Math.random() - 0.5) * shakeIntensity;
      camera.position.y = (Math.random() - 0.5) * shakeIntensity;
    } else {
      camera.position.x = THREE.MathUtils.lerp(camera.position.x, 0, delta * 10);
      camera.position.y = THREE.MathUtils.lerp(camera.position.y, 0, delta * 10);
    }
  });

  return null;
}

// ==========================================
// 4. MAIN GAME COMPONENT & ENGINE
// ==========================================
export default function StellarOverlordGame() {
  const router = useRouter();

  // Game Lifecycle States
  const [gameState, setGameState] = useState<"menu" | "playing" | "paused" | "upgrades" | "gameover" | "victory">("menu");
  const [difficulty, setDifficulty] = useState<"normal" | "hardcore" | "nightmare">("normal");

  // Player Stats
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [credits, setCredits] = useState(150);
  const [wave, setWave] = useState(1);
  const [health, setHealth] = useState(100);
  const [maxHealth, setMaxHealth] = useState(100);
  const [shield, setShield] = useState(50);
  const [maxShield, setMaxShield] = useState(50);
  const [boostEnergy, setBoostEnergy] = useState(100);
  const [empEnergy, setEmpEnergy] = useState(100);
  const [combo, setCombo] = useState(0);
  const [maxCombo, setMaxCombo] = useState(0);
  const [kills, setKills] = useState(0);
  const [bossesDefeated, setBossesDefeated] = useState(0);

  // Ship Controls & Coordinates
  const shipPos = useRef({ x: 0, y: 0, roll: 0, pitch: 0 });
  const [renderPos, setRenderPos] = useState({ x: 0, y: 0, roll: 0, pitch: 0 });
  const [isBoosting, setIsBoosting] = useState(false);
  const [shake, setShake] = useState(0);
  const [soundMuted, setSoundMuted] = useState(false);

  // Upgrade Levels
  const [upgrades, setUpgrades] = useState<ShipUpgrades>({
    fireRateLevel: 1,
    shieldMaxLevel: 1,
    speedLevel: 1,
    multiShotLevel: 1,
    empCooldownLevel: 1
  });

  // Active Entities
  const bulletsRef = useRef<BulletItem[]>([]);
  const enemiesRef = useRef<EnemyItem[]>([]);
  const particlesRef = useRef<ParticleItem[]>([]);
  const powerUpsRef = useRef<PowerUpItem[]>([]);

  // State Triggers for React Render
  const [bulletsState, setBulletsState] = useState<BulletItem[]>([]);
  const [enemiesState, setEnemiesState] = useState<EnemyItem[]>([]);
  const [particlesState, setParticlesState] = useState<ParticleItem[]>([]);
  const [powerUpsState, setPowerUpsState] = useState<PowerUpItem[]>([]);

  // Control Keys State
  const keysPressed = useRef<{ [key: string]: boolean }>({});
  const lastShotTime = useRef(0);
  const waveTimer = useRef(0);
  const isBossActive = useRef(false);

  // Load High Score
  useEffect(() => {
    const saved = localStorage.getItem("stellar_overlord_highscore");
    if (saved) setHighScore(parseInt(saved, 10));
  }, []);

  // Keyboard Event Listeners
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      keysPressed.current[e.code] = true;

      if (e.code === "KeyP" || e.code === "Escape") {
        setGameState((prev) => (prev === "playing" ? "paused" : prev === "paused" ? "playing" : prev));
      }
      if (e.code === "KeyE" && gameState === "playing") {
        triggerEMP();
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
  }, [gameState, empEnergy]);

  // EMP Shockwave Ability
  const triggerEMP = useCallback(() => {
    if (empEnergy < 100) return;
    setEmpEnergy(0);
    audioSynth.playEMP();
    setShake(0.8);

    // Destroy all non-boss enemies and clear bullets
    bulletsRef.current = bulletsRef.current.filter((b) => !b.isEnemy);

    enemiesRef.current.forEach((enemy) => {
      if (enemy.type !== "boss") {
        // Spawn explosion particles
        for (let i = 0; i < 12; i++) {
          particlesRef.current.push({
            id: Math.random().toString(),
            x: enemy.x,
            y: enemy.y,
            z: enemy.z,
            vx: (Math.random() - 0.5) * 8,
            vy: (Math.random() - 0.5) * 8,
            vz: (Math.random() - 0.5) * 8,
            life: 0.4,
            maxLife: 0.4,
            color: "#a855f7",
            size: 0.5
          });
        }
      } else {
        enemy.hp -= 200;
      }
    });

    enemiesRef.current = enemiesRef.current.filter((e) => e.type === "boss" && e.hp > 0);
    setScore((s) => s + 500);
    setKills((k) => k + 5);
  }, [empEnergy]);

  // Main Game Loop (60 FPS tick)
  useEffect(() => {
    if (gameState !== "playing") return;

    let animId: number;
    let lastTime = performance.now();

    const gameLoop = (now: number) => {
      const delta = Math.min((now - lastTime) / 1000, 0.1);
      lastTime = now;

      // 1. Process Input & Player Movement
      const moveSpeed = (8 + upgrades.speedLevel * 2) * (keysPressed.current["ShiftLeft"] && boostEnergy > 5 ? 1.6 : 1.0);
      let dx = 0;
      let dy = 0;

      if (keysPressed.current["KeyA"] || keysPressed.current["ArrowLeft"]) dx -= 1;
      if (keysPressed.current["KeyD"] || keysPressed.current["ArrowRight"]) dx += 1;
      if (keysPressed.current["KeyW"] || keysPressed.current["ArrowUp"]) dy += 1;
      if (keysPressed.current["KeyS"] || keysPressed.current["ArrowDown"]) dy -= 1;

      // Boost energy consumption & regeneration
      const boosting = !!keysPressed.current["ShiftLeft"] && boostEnergy > 5;
      setIsBoosting(boosting);
      if (boosting) {
        setBoostEnergy((b) => Math.max(0, b - delta * 40));
      } else {
        setBoostEnergy((b) => Math.min(100, b + delta * 20));
      }

      // Regenerate EMP slowly
      setEmpEnergy((e) => Math.min(100, e + delta * (5 + upgrades.empCooldownLevel * 2)));

      shipPos.current.x = THREE.MathUtils.clamp(shipPos.current.x + dx * moveSpeed * delta, -14, 14);
      shipPos.current.y = THREE.MathUtils.clamp(shipPos.current.y + dy * moveSpeed * delta, -7, 9);
      shipPos.current.roll = THREE.MathUtils.lerp(shipPos.current.roll, dx, delta * 10);
      shipPos.current.pitch = THREE.MathUtils.lerp(shipPos.current.pitch, dy, delta * 10);

      setRenderPos({ ...shipPos.current });

      // 2. Weapon Firing
      const fireInterval = Math.max(0.1, 0.28 - upgrades.fireRateLevel * 0.04);
      if (keysPressed.current["Space"] && now - lastShotTime.current > fireInterval * 1000) {
        lastShotTime.current = now;
        audioSynth.playLaser(1.0 + Math.random() * 0.2);

        const multi = upgrades.multiShotLevel;
        if (multi === 1) {
          bulletsRef.current.push({
            id: Math.random().toString(),
            x: shipPos.current.x,
            y: shipPos.current.y,
            z: -1,
            vx: 0,
            vy: 0,
            vz: -45,
            isEnemy: false,
            damage: 25,
            color: "#38bdf8"
          });
        } else {
          for (let i = 0; i < multi; i++) {
            const spread = (i - (multi - 1) / 2) * 1.5;
            bulletsRef.current.push({
              id: Math.random().toString(),
              x: shipPos.current.x + spread * 0.5,
              y: shipPos.current.y,
              z: -1,
              vx: spread * 2,
              vy: 0,
              vz: -45,
              isEnemy: false,
              damage: 20,
              color: "#06b6d4"
            });
          }
        }
      }

      // 3. Enemy Spawning Logic
      waveTimer.current += delta;
      const spawnInterval = Math.max(0.6, 3.0 - wave * 0.25);
      if (waveTimer.current > spawnInterval && !isBossActive.current) {
        waveTimer.current = 0;
        const spawnX = (Math.random() - 0.5) * 26;
        const spawnY = (Math.random() - 0.5) * 12;
        const types: ("scout" | "interceptor" | "heavy" | "mine")[] = ["scout", "interceptor", "heavy", "mine"];
        const chosenType = types[Math.floor(Math.random() * types.length)];

        let hp = 30 + wave * 10;
        let radius = 1.2;
        let speed = 12 + wave * 1.5;
        let color = "#ef4444";

        if (chosenType === "heavy") {
          hp = 90 + wave * 25;
          radius = 2.0;
          speed = 7;
          color = "#f43f5e";
        } else if (chosenType === "mine") {
          hp = 20;
          radius = 1.0;
          speed = 5;
          color = "#f59e0b";
        }

        enemiesRef.current.push({
          id: Math.random().toString(),
          type: chosenType,
          x: spawnX,
          y: spawnY,
          z: -50,
          speed,
          hp,
          maxHp: hp,
          scoreValue: chosenType === "heavy" ? 150 : 50,
          shootTimer: 0,
          radius,
          color
        });
      }

      // Boss Spawning Trigger every 5 Waves
      if (wave % 5 === 0 && !isBossActive.current && enemiesRef.current.length === 0) {
        isBossActive.current = true;
        audioSynth.playBossWarning();
        enemiesRef.current.push({
          id: "SECTOR_OVERLORD_BOSS",
          type: "boss",
          x: 0,
          y: 2,
          z: -35,
          speed: 0,
          hp: 800 + wave * 300,
          maxHp: 800 + wave * 300,
          scoreValue: 2500,
          shootTimer: 0,
          radius: 4.5,
          color: "#ef4444"
        });
      }

      // 4. Update Bullets Position & Collision
      bulletsRef.current.forEach((b) => {
        b.x += b.vx * delta;
        b.y += b.vy * delta;
        b.z += b.vz * delta;
      });

      // Filter out bullets beyond boundaries
      bulletsRef.current = bulletsRef.current.filter((b) => Math.abs(b.z) < 60 && Math.abs(b.x) < 30);

      // 5. Update Enemies Logic
      enemiesRef.current.forEach((enemy) => {
        if (enemy.type !== "boss") {
          enemy.z += enemy.speed * delta;
        } else {
          // Boss floating movement pattern
          enemy.x = Math.sin(now * 0.001) * 8;
          enemy.y = Math.cos(now * 0.0015) * 3 + 2;

          // Boss Firing Pattern
          enemy.shootTimer += delta;
          if (enemy.shootTimer > 0.8) {
            enemy.shootTimer = 0;
            audioSynth.playPlasma();
            for (let angle = -0.4; angle <= 0.4; angle += 0.2) {
              bulletsRef.current.push({
                id: Math.random().toString(),
                x: enemy.x,
                y: enemy.y - 1,
                z: enemy.z + 2,
                vx: Math.sin(angle) * 12,
                vy: -3,
                vz: 25,
                isEnemy: true,
                damage: 20,
                color: "#f43f5e"
              });
            }
          }
        }

        // Standard Enemy Shooting
        if (enemy.type === "interceptor" || enemy.type === "heavy") {
          enemy.shootTimer += delta;
          if (enemy.shootTimer > 1.8) {
            enemy.shootTimer = 0;
            bulletsRef.current.push({
              id: Math.random().toString(),
              x: enemy.x,
              y: enemy.y,
              z: enemy.z,
              vx: (shipPos.current.x - enemy.x) * 0.3,
              vy: (shipPos.current.y - enemy.y) * 0.3,
              vz: 22,
              isEnemy: true,
              damage: 12,
              color: "#ef4444"
            });
          }
        }

        // Check Collision: Player Laser vs Enemy
        bulletsRef.current.forEach((bullet) => {
          if (!bullet.isEnemy) {
            const dist = Math.hypot(bullet.x - enemy.x, bullet.y - enemy.y, bullet.z - enemy.z);
            if (dist < enemy.radius + 0.5) {
              enemy.hp -= bullet.damage;
              bullet.z = -999; // Mark bullet for removal

              // Hit spark particles
              for (let i = 0; i < 4; i++) {
                particlesRef.current.push({
                  id: Math.random().toString(),
                  x: bullet.x,
                  y: bullet.y,
                  z: bullet.z,
                  vx: (Math.random() - 0.5) * 5,
                  vy: (Math.random() - 0.5) * 5,
                  vz: (Math.random() - 0.5) * 5,
                  life: 0.2,
                  maxLife: 0.2,
                  color: "#38bdf8",
                  size: 0.3
                });
              }
            }
          }
        });

        // Check Collision: Enemy vs Player Ship
        const shipDist = Math.hypot(enemy.x - shipPos.current.x, enemy.y - shipPos.current.y, enemy.z - 0);
        if (shipDist < enemy.radius + 1.2) {
          takePlayerDamage(30);
          enemy.hp = -999;
          setShake(0.6);
        }
      });

      // Handle Destroyed Enemies & Drops
      enemiesRef.current.forEach((enemy) => {
        if (enemy.hp <= 0 && enemy.hp !== -999) {
          audioSynth.playExplosion(enemy.type === "boss");
          setScore((s) => s + enemy.scoreValue * (1 + combo * 0.1));
          setCredits((c) => c + Math.floor(enemy.scoreValue / 5));
          setKills((k) => k + 1);
          setCombo((c) => {
            const next = c + 1;
            setMaxCombo((mc) => Math.max(mc, next));
            return next;
          });

          if (enemy.type === "boss") {
            isBossActive.current = false;
            setBossesDefeated((b) => b + 1);
            setWave((w) => w + 1);
          }

          // Spawn Explosion Particle Burst
          for (let i = 0; i < (enemy.type === "boss" ? 35 : 12); i++) {
            particlesRef.current.push({
              id: Math.random().toString(),
              x: enemy.x,
              y: enemy.y,
              z: enemy.z,
              vx: (Math.random() - 0.5) * 12,
              vy: (Math.random() - 0.5) * 12,
              vz: (Math.random() - 0.5) * 12,
              life: 0.5,
              maxLife: 0.5,
              color: enemy.color,
              size: 0.6
            });
          }

          // Chance to drop powerup
          if (Math.random() < 0.35) {
            const powerTypes: ("shield" | "boost" | "emp" | "credits")[] = ["shield", "boost", "emp", "credits"];
            powerUpsRef.current.push({
              id: Math.random().toString(),
              type: powerTypes[Math.floor(Math.random() * powerTypes.length)],
              x: enemy.x,
              y: enemy.y,
              z: enemy.z
            });
          }
        }
      });

      // Remove Dead Enemies & Enemies that passed player
      enemiesRef.current = enemiesRef.current.filter((e) => e.hp > 0 && e.z < 10);

      // 6. Enemy Bullet vs Player Collision
      bulletsRef.current.forEach((b) => {
        if (b.isEnemy) {
          const dist = Math.hypot(b.x - shipPos.current.x, b.y - shipPos.current.y, b.z - 0);
          if (dist < 1.4) {
            takePlayerDamage(b.damage);
            b.z = 999;
            setShake(0.4);
          }
        }
      });

      // 7. PowerUp Collection Logic
      powerUpsRef.current.forEach((p) => {
        p.z += 10 * delta;
        const dist = Math.hypot(p.x - shipPos.current.x, p.y - shipPos.current.y, p.z - 0);
        if (dist < 2.0) {
          audioSynth.playShieldCollect();
          if (p.type === "shield") setShield((s) => Math.min(maxShield, s + 30));
          if (p.type === "boost") setBoostEnergy(100);
          if (p.type === "emp") setEmpEnergy(100);
          if (p.type === "credits") setCredits((c) => c + 50);
          p.z = 999;
        }
      });
      powerUpsRef.current = powerUpsRef.current.filter((p) => p.z < 10);

      // 8. Update Particles
      particlesRef.current.forEach((p) => {
        p.x += p.vx * delta;
        p.y += p.vy * delta;
        p.z += p.vz * delta;
        p.life -= delta;
      });
      particlesRef.current = particlesRef.current.filter((p) => p.life > 0);

      // Decay screen shake
      setShake((s) => Math.max(0, s - delta * 2));

      // Sync state to React
      setBulletsState([...bulletsRef.current]);
      setEnemiesState([...enemiesRef.current]);
      setParticlesState([...particlesRef.current]);
      setPowerUpsState([...powerUpsRef.current]);

      animId = requestAnimationFrame(gameLoop);
    };

    animId = requestAnimationFrame(gameLoop);

    return () => cancelAnimationFrame(animId);
  }, [gameState, wave, upgrades, boostEnergy, empEnergy, maxShield, combo]);

  // Player Damage Calculation (Shield absorbs first)
  const takePlayerDamage = (amount: number) => {
    setShield((s) => {
      if (s >= amount) return s - amount;
      const remaining = amount - s;
      setHealth((h) => {
        const nextH = h - remaining;
        if (nextH <= 0) {
          handleGameOver();
          return 0;
        }
        return nextH;
      });
      return 0;
    });
    setCombo(0);
  };

  // Game Over Handler
  const handleGameOver = () => {
    audioSynth.playGameOver();
    setGameState("gameover");
    setHighScore((prev) => {
      const next = Math.max(prev, score);
      localStorage.setItem("stellar_overlord_highscore", next.toString());
      return next;
    });
  };

  // Reset Game Function
  const restartGame = () => {
    setScore(0);
    setWave(1);
    setHealth(100);
    setShield(50);
    setBoostEnergy(100);
    setEmpEnergy(100);
    setCombo(0);
    setKills(0);
    setBossesDefeated(0);
    shipPos.current = { x: 0, y: 0, roll: 0, pitch: 0 };
    bulletsRef.current = [];
    enemiesRef.current = [];
    particlesRef.current = [];
    powerUpsRef.current = [];
    isBossActive.current = false;
    setGameState("playing");
  };

  // Buy Upgrades Function
  const buyUpgrade = (type: keyof ShipUpgrades, cost: number) => {
    if (credits >= cost && upgrades[type] < 5) {
      setCredits((c) => c - cost);
      setUpgrades((u) => ({ ...u, [type]: u[type] + 1 }));
      if (type === "shieldMaxLevel") {
        setMaxShield((ms) => ms + 25);
        setShield((s) => s + 25);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-[400] bg-black text-white font-sans overflow-hidden select-none">
      {/* 3D WebGL Canvas Rendering Layer */}
      <div className="absolute inset-0 z-0">
        <Canvas gl={{ antialias: true, alpha: false }}>
          <PerspectiveCamera makeDefault position={[0, 1.5, 9]} fov={75} />
          <CameraRig shakeIntensity={shake} isBoosting={isBoosting} />
          <ambientLight intensity={0.6} />
          <directionalLight position={[10, 20, 15]} intensity={1.5} color="#38bdf8" />
          <pointLight position={[0, -5, -10]} intensity={2} color="#ec4899" />

          <SynthwaveEnvironment speedMultiplier={isBoosting ? 2.5 : 1.0} />
          <PlayerStarfighter3D
            x={renderPos.x}
            y={renderPos.y}
            roll={renderPos.roll}
            pitch={renderPos.pitch}
            isBoosting={isBoosting}
            isShieldActive={shield > 0}
          />

          <Bullets3D bullets={bulletsState} />
          {enemiesState.map((enemy) => (
            <EnemyMesh3D key={enemy.id} enemy={enemy} />
          ))}
          <Particles3D particles={particlesState} />
          <PowerUps3D powerUps={powerUpsState} />
        </Canvas>
      </div>

      {/* ==========================================
          5. HUD & OVERLAY UI LAYERS
      ========================================== */}
      {gameState === "playing" && (
        <div className="absolute inset-0 z-10 pointer-events-none p-6 flex flex-col justify-between">
          {/* Top Bar Header */}
          <div className="flex justify-between items-start">
            {/* Left Health & Shield Monitors */}
            <div className="space-y-3 bg-black/60 backdrop-blur-xl border border-white/10 p-4 rounded-2xl w-72 pointer-events-auto">
              <div className="flex items-center justify-between text-xs font-black tracking-widest uppercase">
                <span className="flex items-center gap-1.5 text-rose-500">
                  <Flame className="w-4 h-4 fill-rose-500" /> Hull Integrity
                </span>
                <span className="tabular-nums">{Math.ceil(health)}%</span>
              </div>
              <div className="w-full h-3 bg-zinc-900 rounded-full overflow-hidden border border-white/10">
                <div
                  className="h-full bg-gradient-to-r from-rose-600 to-red-500 transition-all duration-200"
                  style={{ width: `${(health / maxHealth) * 100}%` }}
                />
              </div>

              <div className="flex items-center justify-between text-xs font-black tracking-widest uppercase pt-1">
                <span className="flex items-center gap-1.5 text-cyan-400">
                  <Shield className="w-4 h-4 fill-cyan-400" /> Force Shield
                </span>
                <span className="tabular-nums">{Math.ceil(shield)}%</span>
              </div>
              <div className="w-full h-2.5 bg-zinc-900 rounded-full overflow-hidden border border-white/10">
                <div
                  className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 transition-all duration-200"
                  style={{ width: `${(shield / maxShield) * 100}%` }}
                />
              </div>
            </div>

            {/* Center Score & Wave Badge */}
            <div className="flex flex-col items-center pointer-events-auto">
              <div className="bg-black/70 backdrop-blur-md border border-white/10 px-8 py-2.5 rounded-full text-center shadow-2xl">
                <div className="text-[10px] font-black uppercase tracking-[0.3em] text-cyan-400">SECTOR OVERLORD</div>
                <div className="text-4xl font-black italic tracking-tighter text-white tabular-nums">{score}</div>
              </div>
              <div className="mt-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-[11px] font-black uppercase tracking-widest px-4 py-1 rounded-full shadow-lg">
                Wave {wave}
              </div>
            </div>

            {/* Right Energy Meters & Menu Controls */}
            <div className="flex items-center gap-4 pointer-events-auto">
              <div className="bg-black/60 backdrop-blur-xl border border-white/10 p-4 rounded-2xl w-48 space-y-2">
                <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-wider text-rose-400">
                  <span>Warp Boost</span>
                  <span>{Math.ceil(boostEnergy)}%</span>
                </div>
                <div className="w-full h-2 bg-zinc-900 rounded-full overflow-hidden">
                  <div className="h-full bg-rose-500 transition-all" style={{ width: `${boostEnergy}%` }} />
                </div>

                <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-wider text-purple-400">
                  <span>EMP Blast [E]</span>
                  <span>{empEnergy >= 100 ? "READY" : `${Math.ceil(empEnergy)}%`}</span>
                </div>
                <div className="w-full h-2 bg-zinc-900 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all ${empEnergy >= 100 ? "bg-purple-500 animate-pulse" : "bg-purple-800"}`}
                    style={{ width: `${empEnergy}%` }}
                  />
                </div>
              </div>

              <button
                onClick={() => setGameState("paused")}
                className="w-12 h-12 rounded-2xl bg-black/60 backdrop-blur-xl border border-white/10 flex items-center justify-center hover:bg-white/20 transition-all"
              >
                <Pause className="w-5 h-5 text-white" />
              </button>
            </div>
          </div>

          {/* Active Boss Health Gauge Overlay */}
          {isBossActive.current && (
            <div className="self-center w-full max-w-xl bg-black/80 backdrop-blur-md border border-rose-500/40 p-4 rounded-2xl space-y-2 text-center pointer-events-auto animate-pulse">
              <div className="text-xs font-black uppercase tracking-[0.4em] text-rose-500 flex items-center justify-center gap-2">
                <Skull className="w-4 h-4 text-rose-500" /> SECTOR OVERLORD DREADNOUGHT <Skull className="w-4 h-4 text-rose-500" />
              </div>
              <div className="w-full h-4 bg-zinc-950 rounded-full overflow-hidden border border-rose-500/30">
                <div
                  className="h-full bg-gradient-to-r from-red-600 via-rose-500 to-amber-500 transition-all duration-150"
                  style={{
                    width: `${
                      ((enemiesState.find((e) => e.type === "boss")?.hp || 0) /
                        (enemiesState.find((e) => e.type === "boss")?.maxHp || 1)) *
                      100
                    }%`
                  }}
                />
              </div>
            </div>
          )}

          {/* Bottom Controls Legend & Combo Indicator */}
          <div className="flex justify-between items-end">
            <div className="text-[11px] font-bold text-white/50 space-y-1 bg-black/50 p-3 rounded-xl backdrop-blur-md border border-white/5">
              <div>[WASD / ARROWS] Move Flight Controller</div>
              <div>[SPACE] Fire Vulcan Cannons | [SHIFT] Warp Speed</div>
              <div>[E] EMP Shockwave</div>
            </div>

            {combo > 1 && (
              <motion.div
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="bg-gradient-to-r from-amber-500 to-orange-500 text-black font-black italic text-xl px-6 py-2 rounded-2xl shadow-[0_0_30px_rgba(245,158,11,0.5)]"
              >
                {combo}X COMBOKILL!
              </motion.div>
            )}
          </div>
        </div>
      )}

      {/* START MENU OVERLAY */}
      {gameState === "menu" && (
        <div className="absolute inset-0 z-50 bg-black/90 backdrop-blur-2xl flex flex-col items-center justify-center p-8 text-center">
          <motion.div initial={{ y: -30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="max-w-2xl space-y-6">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs font-black uppercase tracking-widest">
              <SparklesIcon className="w-4 h-4" /> Next-Gen 3D Space Arcade
            </div>
            <h1 className="text-6xl md:text-7xl font-black italic tracking-tighter uppercase bg-gradient-to-r from-cyan-400 via-sky-200 to-purple-500 bg-clip-text text-transparent drop-shadow-[0_0_35px_rgba(56,189,248,0.4)]">
              STELLAR OVERLORD
            </h1>
            <p className="text-white/70 text-base md:text-lg max-w-lg mx-auto font-medium leading-relaxed">
              Pilot your apex cyber starfighter through hostile armadas. Master Warp Speed, EMP Shockwaves, and conquer Sector Overlord Bosses in 3D.
            </p>

            {/* High Score Banner */}
            <div className="flex justify-center gap-8 py-2">
              <div className="flex items-center gap-3 bg-white/5 border border-white/10 px-6 py-3 rounded-2xl">
                <Trophy className="w-6 h-6 text-amber-400" />
                <div className="text-left">
                  <div className="text-[10px] font-black uppercase tracking-widest text-white/50">High Score</div>
                  <div className="text-xl font-black text-white">{highScore}</div>
                </div>
              </div>
            </div>

            {/* Launch Game Button */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
              <button
                onClick={() => setGameState("playing")}
                className="px-10 py-5 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-full font-black text-lg uppercase tracking-widest hover:scale-105 transition-all shadow-[0_0_50px_rgba(6,182,212,0.5)] flex items-center justify-center gap-3"
              >
                <Play className="w-6 h-6 fill-white" /> Launch Mission
              </button>
              <button
                onClick={() => setGameState("upgrades")}
                className="px-8 py-5 bg-white/10 border border-white/20 rounded-full font-black text-sm uppercase tracking-widest hover:bg-white/20 transition-all flex items-center justify-center gap-2"
              >
                <Cpu className="w-5 h-5 text-purple-400" /> Upgrades ({credits} Cr)
              </button>
            </div>

            {/* Back to Hub Link */}
            <div className="pt-6">
              <Link href="/games" className="text-xs font-black uppercase tracking-widest text-white/40 hover:text-white transition-colors flex items-center justify-center gap-2">
                <ArrowLeft className="w-4 h-4" /> Return to Games Library
              </Link>
            </div>
          </motion.div>
        </div>
      )}

      {/* PAUSE MENU OVERLAY */}
      {gameState === "paused" && (
        <div className="absolute inset-0 z-50 bg-black/85 backdrop-blur-2xl flex flex-col items-center justify-center p-8">
          <div className="bg-zinc-950 border border-white/10 rounded-3xl p-8 max-w-md w-full text-center space-y-6 shadow-2xl">
            <h2 className="text-4xl font-black italic tracking-tighter uppercase text-white">MISSION PAUSED</h2>
            <div className="space-y-3 py-2 text-left bg-white/5 p-4 rounded-2xl border border-white/5">
              <div className="flex justify-between text-sm">
                <span className="text-white/50">Current Score:</span>
                <span className="font-bold">{score}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-white/50">Current Wave:</span>
                <span className="font-bold">Wave {wave}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-white/50">Enemies Defeated:</span>
                <span className="font-bold">{kills}</span>
              </div>
            </div>
            <div className="space-y-3">
              <button
                onClick={() => setGameState("playing")}
                className="w-full py-4 bg-cyan-500 rounded-2xl font-black uppercase tracking-widest text-sm hover:bg-cyan-400 transition-all"
              >
                Resume Mission
              </button>
              <button
                onClick={restartGame}
                className="w-full py-4 bg-white/10 border border-white/10 rounded-2xl font-black uppercase tracking-widest text-sm hover:bg-white/20 transition-all"
              >
                Restart Sector
              </button>
              <button
                onClick={() => setGameState("menu")}
                className="w-full py-4 bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded-2xl font-black uppercase tracking-widest text-sm hover:bg-rose-500/30 transition-all"
              >
                Abort Mission
              </button>
            </div>
          </div>
        </div>
      )}

      {/* UPGRADE MATRIX MODAL */}
      {gameState === "upgrades" && (
        <div className="absolute inset-0 z-50 bg-black/90 backdrop-blur-2xl flex flex-col items-center justify-center p-8">
          <div className="bg-zinc-950 border border-white/10 rounded-3xl p-8 max-w-xl w-full space-y-6 shadow-2xl">
            <div className="flex justify-between items-center border-b border-white/10 pb-4">
              <div>
                <h2 className="text-3xl font-black italic tracking-tighter uppercase text-white">UPGRADE MATRIX</h2>
                <p className="text-xs text-white/50 font-bold uppercase tracking-wider">Enhance Cyber Starfighter Subsystems</p>
              </div>
              <div className="bg-amber-500/10 border border-amber-500/30 px-4 py-2 rounded-xl text-amber-400 font-black text-sm">
                {credits} Credits
              </div>
            </div>

            <div className="space-y-4">
              {[
                { key: "fireRateLevel" as keyof ShipUpgrades, label: "Vulcan Cannon Rate", cost: upgrades.fireRateLevel * 100 },
                { key: "shieldMaxLevel" as keyof ShipUpgrades, label: "Force Shield Capacity", cost: upgrades.shieldMaxLevel * 120 },
                { key: "speedLevel" as keyof ShipUpgrades, label: "Engine Thruster Speed", cost: upgrades.speedLevel * 80 },
                { key: "multiShotLevel" as keyof ShipUpgrades, label: "Multi-Cannon Spread", cost: upgrades.multiShotLevel * 200 },
                { key: "empCooldownLevel" as keyof ShipUpgrades, label: "EMP Recharge Speed", cost: upgrades.empCooldownLevel * 150 }
              ].map((item) => (
                <div key={item.key} className="flex items-center justify-between bg-white/5 p-4 rounded-2xl border border-white/5">
                  <div>
                    <div className="font-black text-sm uppercase text-white">{item.label}</div>
                    <div className="text-xs text-cyan-400 font-bold">Level {upgrades[item.key]} / 5</div>
                  </div>
                  <button
                    disabled={upgrades[item.key] >= 5 || credits < item.cost}
                    onClick={() => buyUpgrade(item.key, item.cost)}
                    className="px-6 py-2.5 rounded-xl bg-cyan-500 disabled:opacity-30 disabled:cursor-not-allowed font-black text-xs uppercase tracking-wider hover:bg-cyan-400 transition-all text-black"
                  >
                    {upgrades[item.key] >= 5 ? "MAX" : `Upgrade (${item.cost} Cr)`}
                  </button>
                </div>
              ))}
            </div>

            <button
              onClick={() => setGameState("menu")}
              className="w-full py-4 bg-white/10 border border-white/20 rounded-2xl font-black uppercase tracking-widest text-sm hover:bg-white/20 transition-all"
            >
              Back to Main Menu
            </button>
          </div>
        </div>
      )}

      {/* GAME OVER OVERLAY */}
      {gameState === "gameover" && (
        <div className="absolute inset-0 z-50 bg-black/95 backdrop-blur-3xl flex flex-col items-center justify-center p-8 text-center">
          <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="max-w-lg w-full space-y-6">
            <div className="w-20 h-20 bg-rose-500/20 border-2 border-rose-500 rounded-3xl mx-auto flex items-center justify-center">
              <Skull className="w-10 h-10 text-rose-500" />
            </div>
            <h2 className="text-5xl font-black italic tracking-tighter uppercase text-rose-500">SHIP DESTROYED</h2>
            <p className="text-white/60 text-sm font-bold uppercase tracking-widest">Sector Defense Compromised</p>

            <div className="bg-white/5 border border-white/10 p-6 rounded-3xl space-y-3 text-left">
              <div className="flex justify-between text-sm">
                <span className="text-white/50">Final Score:</span>
                <span className="font-black text-lg text-cyan-400">{score}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-white/50">Waves Survived:</span>
                <span className="font-bold">Wave {wave}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-white/50">Hostiles Eliminated:</span>
                <span className="font-bold">{kills}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-white/50">Bosses Defeated:</span>
                <span className="font-bold">{bossesDefeated}</span>
              </div>
            </div>

            <div className="flex gap-4 pt-4">
              <button
                onClick={restartGame}
                className="flex-1 py-5 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-2xl font-black text-sm uppercase tracking-widest hover:scale-105 transition-all shadow-lg flex items-center justify-center gap-2"
              >
                <RefreshCw className="w-5 h-5" /> Retry Mission
              </button>
              <button
                onClick={() => setGameState("menu")}
                className="py-5 px-8 bg-white/10 border border-white/20 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-white/20 transition-all"
              >
                Exit
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
