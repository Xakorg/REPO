"use client";

import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
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
  Crosshair,
  Award,
  Pause,
  Maximize2,
  Radio,
  Rocket,
  ShieldAlert,
  Wind,
  Compass,
  ZapOff,
  Sparkles as SparklesIcon,
  Cpu,
  RefreshCw,
  Eye,
  Activity,
  Layers,
  ChevronRight,
  HelpCircle
} from "lucide-react";
import Link from "next/link";

// ==========================================
// 1. WEB AUDIO SYNTH SOUND ENGINE
// ==========================================
class AetherSoundEngine {
  ctx: AudioContext | null = null;
  muted: boolean = false;
  bgmOsc1: OscillatorNode | null = null;
  bgmOsc2: OscillatorNode | null = null;
  bgmGain: GainNode | null = null;
  isBgmPlaying: boolean = false;

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

  playPlasma() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(900, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(150, this.ctx.currentTime + 0.08);

    gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.08);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.08);
  }

  playMissile() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(200, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(800, this.ctx.currentTime + 0.2);

    gain.gain.setValueAtTime(0.3, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.25);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.25);
  }

  playEmp() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = "triangle";
    osc.frequency.setValueAtTime(1200, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(40, this.ctx.currentTime + 0.6);

    gain.gain.setValueAtTime(0.5, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.6);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.6);
  }

  playExplosion() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    const bufferSize = this.ctx.sampleRate * 0.4;
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
    filter.frequency.exponentialRampToValueAtTime(40, this.ctx.currentTime + 0.4);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.4, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.4);

    whiteNoise.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);

    whiteNoise.start();
    whiteNoise.stop(this.ctx.currentTime + 0.4);
  }

  playShieldHit() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(500, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(1000, this.ctx.currentTime + 0.12);

    gain.gain.setValueAtTime(0.3, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.12);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.12);
  }

  playPowerup() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = "square";

    osc.frequency.setValueAtTime(400, now);
    osc.frequency.setValueAtTime(600, now + 0.08);
    osc.frequency.setValueAtTime(900, now + 0.16);

    gain.gain.setValueAtTime(0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(now + 0.3);
  }

  startBgm() {
    if (this.muted || this.isBgmPlaying) return;
    this.init();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      this.bgmGain = this.ctx.createGain();
      this.bgmGain.gain.setValueAtTime(0.05, now);

      this.bgmOsc1 = this.ctx.createOscillator();
      this.bgmOsc1.type = "sawtooth";
      this.bgmOsc1.frequency.setValueAtTime(65.41, now); // C2 synth bass

      this.bgmOsc2 = this.ctx.createOscillator();
      this.bgmOsc2.type = "sine";
      this.bgmOsc2.frequency.setValueAtTime(130.81, now);

      const filter = this.ctx.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.setValueAtTime(400, now);

      this.bgmOsc1.connect(filter);
      this.bgmOsc2.connect(filter);
      filter.connect(this.bgmGain);
      this.bgmGain.connect(this.ctx.destination);

      this.bgmOsc1.start(now);
      this.bgmOsc2.start(now);
      this.isBgmPlaying = true;
    } catch (e) {
      console.warn("Audio Context BGM start warning", e);
    }
  }

  stopBgm() {
    if (this.bgmOsc1) {
      try { this.bgmOsc1.stop(); } catch (e) {}
      this.bgmOsc1 = null;
    }
    if (this.bgmOsc2) {
      try { this.bgmOsc2.stop(); } catch (e) {}
      this.bgmOsc2 = null;
    }
    this.isBgmPlaying = false;
  }
}

const audioSynth = new AetherSoundEngine();

// ==========================================
// 2. GAME STATE INTERFACES
// ==========================================
interface PlayerState {
  x: number;
  y: number;
  z: number;
  health: number;
  maxHealth: number;
  shield: number;
  maxShield: number;
  empCooldown: number;
  missileAmmo: number;
  maxMissileAmmo: number;
  score: number;
  combo: number;
  aetherCores: number;
  weaponLevel: number;
  overdrive: number;
  isOverdriveActive: boolean;
  speedMultiplier: number;
}

interface EnemyData {
  id: string;
  type: "interceptor" | "heavy" | "stalker" | "boss";
  x: number;
  y: number;
  z: number;
  health: number;
  maxHealth: number;
  speed: number;
  shootTimer: number;
  radius: number;
  rotX: number;
  rotY: number;
  rotZ: number;
}

interface LaserData {
  id: string;
  isPlayer: boolean;
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  color: string;
  damage: number;
}

interface CoreData {
  id: string;
  x: number;
  y: number;
  z: number;
  value: number;
}

interface ParticleData {
  id: string;
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  color: string;
  size: number;
  life: number;
  maxLife: number;
}

// ==========================================
// 3. THREE.JS SCENE COMPONENTS
// ==========================================

// Starfield & Cosmic Dust
function CosmicEnvironment() {
  const starsRef = useRef<THREE.Points>(null);
  
  const [positions, colors] = useMemo(() => {
    const count = 1200;
    const pos = new Float32Array(count * 3);
    const cols = new Float32Array(count * 3);
    const palette = [
      new THREE.Color("#38bdf8"),
      new THREE.Color("#c084fc"),
      new THREE.Color("#818cf8"),
      new THREE.Color("#e879f9")
    ];

    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 200;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 200;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 300;

      const c = palette[Math.floor(Math.random() * palette.length)];
      cols[i * 3] = c.r;
      cols[i * 3 + 1] = c.g;
      cols[i * 3 + 2] = c.b;
    }
    return [pos, cols];
  }, []);

  useFrame((_, delta) => {
    if (starsRef.current) {
      const posArr = starsRef.current.geometry.attributes.position.array as Float32Array;
      for (let i = 0; i < posArr.length / 3; i++) {
        posArr[i * 3 + 2] += delta * 15;
        if (posArr[i * 3 + 2] > 50) {
          posArr[i * 3 + 2] = -250;
        }
      }
      starsRef.current.geometry.attributes.position.needsUpdate = true;
    }
  });

  return (
    <>
      <ambientLight intensity={0.5} />
      <directionalLight position={[10, 20, 15]} intensity={1.5} color="#38bdf8" />
      <pointLight position={[0, 0, -50]} intensity={3} color="#c084fc" />
      
      <points ref={starsRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[positions, 3]}
          />
          <bufferAttribute
            attach="attributes-color"
            args={[colors, 3]}
          />
        </bufferGeometry>
        <pointsMaterial
          size={0.6}
          vertexColors
          transparent
          opacity={0.8}
          blending={THREE.AdditiveBlending}
        />
      </points>

      {/* Floating Nebula Spheres */}
      <Float speed={1.5} rotationIntensity={0.5} floatIntensity={1}>
        <mesh position={[-40, 20, -100]}>
          <sphereGeometry args={[25, 16, 16]} />
          <meshBasicMaterial color="#7e22ce" transparent opacity={0.15} wireframe />
        </mesh>
      </Float>
      <Float speed={2} rotationIntensity={0.8} floatIntensity={1.2}>
        <mesh position={[50, -30, -140]}>
          <sphereGeometry args={[35, 16, 16]} />
          <meshBasicMaterial color="#0284c7" transparent opacity={0.12} wireframe />
        </mesh>
      </Float>
    </>
  );
}

// Player Ship 3D Mesh
function PlayerShipMesh({
  player,
  isDashing
}: {
  player: PlayerState;
  isDashing: boolean;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const thrusterRef = useRef<THREE.Mesh>(null);

  useFrame((state, delta) => {
    if (groupRef.current) {
      // Smooth interpolation for positioning
      groupRef.current.position.x = THREE.MathUtils.lerp(groupRef.current.position.x, player.x, delta * 15);
      groupRef.current.position.y = THREE.MathUtils.lerp(groupRef.current.position.y, player.y, delta * 15);
      groupRef.current.position.z = player.z;

      // Roll bank angle based on velocity
      const roll = (groupRef.current.position.x - player.x) * 0.8;
      const pitch = (groupRef.current.position.y - player.y) * 0.5;
      groupRef.current.rotation.z = THREE.MathUtils.lerp(groupRef.current.rotation.z, roll, delta * 10);
      groupRef.current.rotation.x = THREE.MathUtils.lerp(groupRef.current.rotation.x, pitch, delta * 10);
    }

    if (thrusterRef.current) {
      const scale = isDashing ? 2.5 + Math.sin(state.clock.getElapsedTime() * 30) * 0.5 : 1 + Math.sin(state.clock.getElapsedTime() * 15) * 0.2;
      thrusterRef.current.scale.set(1, scale, 1);
    }
  });

  return (
    <group ref={groupRef} position={[player.x, player.y, player.z]}>
      {/* Cockpit / Main Fuselage */}
      <mesh position={[0, 0, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <coneGeometry args={[0.7, 3.2, 8]} />
        <meshStandardMaterial color="#0284c7" metalness={0.9} roughness={0.1} />
      </mesh>

      {/* Cockpit Glass */}
      <mesh position={[0, 0.25, -0.2]}>
        <sphereGeometry args={[0.4, 16, 16]} />
        <meshStandardMaterial color="#38bdf8" transparent opacity={0.7} metalness={1} roughness={0} />
      </mesh>

      {/* Left Wing */}
      <mesh position={[-1.2, 0, 0.4]} rotation={[0, 0, -0.15]}>
        <boxGeometry args={[1.8, 0.08, 1.2]} />
        <meshStandardMaterial color="#0f172a" metalness={0.8} roughness={0.2} />
      </mesh>

      {/* Right Wing */}
      <mesh position={[1.2, 0, 0.4]} rotation={[0, 0, 0.15]}>
        <boxGeometry args={[1.8, 0.08, 1.2]} />
        <meshStandardMaterial color="#0f172a" metalness={0.8} roughness={0.2} />
      </mesh>

      {/* Wingtip Cannons */}
      <mesh position={[-2, 0, 0]}>
        <cylinderGeometry args={[0.06, 0.06, 1.4]} />
        <meshStandardMaterial color="#c084fc" emissive="#c084fc" emissiveIntensity={0.8} />
      </mesh>
      <mesh position={[2, 0, 0]}>
        <cylinderGeometry args={[0.06, 0.06, 1.4]} />
        <meshStandardMaterial color="#c084fc" emissive="#c084fc" emissiveIntensity={0.8} />
      </mesh>

      {/* Thruster Glow */}
      <mesh ref={thrusterRef} position={[0, 0, 1.6]} rotation={[Math.PI / 2, 0, 0]}>
        <coneGeometry args={[0.35, 1.2, 16]} />
        <meshBasicMaterial color={isDashing ? "#f43f5e" : "#38bdf8"} transparent opacity={0.9} />
      </mesh>

      {/* Energy Shield Sphere */}
      {player.shield > 0 && (
        <mesh>
          <sphereGeometry args={[2.2, 16, 16]} />
          <meshStandardMaterial
            color="#38bdf8"
            transparent
            opacity={0.18 + (player.shield / player.maxShield) * 0.15}
            wireframe
          />
        </mesh>
      )}

      {/* Overdrive Aura */}
      {player.isOverdriveActive && (
        <Sparkles count={40} scale={4} size={3} speed={2} color="#e879f9" />
      )}
    </group>
  );
}

// 3D Enemy Mesh Renderers
function EnemyMesh({ enemy }: { enemy: EnemyData }) {
  const meshRef = useRef<THREE.Group>(null);

  useFrame((_, delta) => {
    if (meshRef.current) {
      meshRef.current.position.set(enemy.x, enemy.y, enemy.z);
      meshRef.current.rotation.x += delta * enemy.rotX;
      meshRef.current.rotation.y += delta * enemy.rotY;
      meshRef.current.rotation.z += delta * enemy.rotZ;
    }
  });

  if (enemy.type === "boss") {
    return (
      <group ref={meshRef} position={[enemy.x, enemy.y, enemy.z]}>
        {/* Boss Core */}
        <mesh>
          <octahedronGeometry args={[4.5, 2]} />
          <meshStandardMaterial color="#be123c" metalness={0.9} roughness={0.1} emissive="#9f1239" emissiveIntensity={0.5} />
        </mesh>
        {/* Boss Rotating Armor Ring */}
        <mesh rotation={[Math.PI / 4, 0, 0]}>
          <torusGeometry args={[7, 0.6, 16, 32]} />
          <meshStandardMaterial color="#475569" metalness={0.8} />
        </mesh>
        <Sparkles count={60} scale={10} size={5} color="#f43f5e" />
      </group>
    );
  }

  if (enemy.type === "heavy") {
    return (
      <group ref={meshRef} position={[enemy.x, enemy.y, enemy.z]}>
        <mesh>
          <boxGeometry args={[2.4, 1.2, 2.4]} />
          <meshStandardMaterial color="#ca8a04" metalness={0.8} roughness={0.3} />
        </mesh>
        <mesh position={[0, 0, -1.4]}>
          <coneGeometry args={[0.8, 1.2, 4]} />
          <meshStandardMaterial color="#ef4444" emissive="#ef4444" emissiveIntensity={0.6} />
        </mesh>
      </group>
    );
  }

  if (enemy.type === "stalker") {
    return (
      <group ref={meshRef} position={[enemy.x, enemy.y, enemy.z]}>
        <mesh>
          <tetrahedronGeometry args={[1.5]} />
          <meshStandardMaterial color="#a855f7" wireframe emissive="#a855f7" emissiveIntensity={0.8} />
        </mesh>
      </group>
    );
  }

  // Interceptor default
  return (
    <group ref={meshRef} position={[enemy.x, enemy.y, enemy.z]}>
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <coneGeometry args={[0.9, 2.0, 6]} />
        <meshStandardMaterial color="#dc2626" metalness={0.7} roughness={0.2} />
      </mesh>
    </group>
  );
}

// Laser bolt renderer
function LasersRender({ lasers }: { lasers: LaserData[] }) {
  return (
    <>
      {lasers.map((l) => (
        <mesh key={l.id} position={[l.x, l.y, l.z]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.12, 0.12, 1.6, 8]} />
          <meshBasicMaterial color={l.color} />
        </mesh>
      ))}
    </>
  );
}

// Collectible Quantum Cores
function CoresRender({ cores }: { cores: CoreData[] }) {
  return (
    <>
      {cores.map((c) => (
        <Float key={c.id} speed={4} rotationIntensity={2} floatIntensity={1.5}>
          <mesh position={[c.x, c.y, c.z]}>
            <octahedronGeometry args={[0.6, 0]} />
            <meshStandardMaterial color="#38bdf8" emissive="#38bdf8" emissiveIntensity={1} />
          </mesh>
        </Float>
      ))}
    </>
  );
}

// Explosions & Hits Particles
function ParticlesRender({ particles }: { particles: ParticleData[] }) {
  return (
    <>
      {particles.map((p) => (
        <mesh key={p.id} position={[p.x, p.y, p.z]}>
          <sphereGeometry args={[p.size * (p.life / p.maxLife), 8, 8]} />
          <meshBasicMaterial color={p.color} transparent opacity={p.life / p.maxLife} />
        </mesh>
      ))}
    </>
  );
}

// ==========================================
// 4. MAIN GAME COMPONENT
// ==========================================
export default function AetherStrikeGame() {
  const [gameState, setGameState] = useState<"menu" | "playing" | "upgrading" | "gameover" | "victory" | "paused">("menu");
  const [difficulty, setDifficulty] = useState<"novice" | "veteran" | "apex">("veteran");
  const [muted, setMuted] = useState(false);
  const [wave, setWave] = useState(1);
  const [maxWave] = useState(10);
  const [highScore, setHighScore] = useState(0);

  // Player State
  const [player, setPlayer] = useState<PlayerState>({
    x: 0,
    y: 0,
    z: 0,
    health: 100,
    maxHealth: 100,
    shield: 50,
    maxShield: 50,
    empCooldown: 0,
    missileAmmo: 5,
    maxMissileAmmo: 10,
    score: 0,
    combo: 0,
    aetherCores: 0,
    weaponLevel: 1,
    overdrive: 0,
    isOverdriveActive: false,
    speedMultiplier: 1
  });

  // Entities Ref & State
  const enemiesRef = useRef<EnemyData[]>([]);
  const lasersRef = useRef<LaserData[]>([]);
  const coresRef = useRef<CoreData[]>([]);
  const particlesRef = useRef<ParticleData[]>([]);
  const [enemies, setEnemies] = useState<EnemyData[]>([]);
  const [lasers, setLasers] = useState<LaserData[]>([]);
  const [cores, setCores] = useState<CoreData[]>([]);
  const [particles, setParticles] = useState<ParticleData[]>([]);

  // Input states
  const keysRef = useRef<{ [key: string]: boolean }>({});
  const [isDashing, setIsDashing] = useState(false);
  const shootCooldownRef = useRef(0);
  const empWaveRadiusRef = useRef(0);
  const [empActive, setEmpActive] = useState(false);

  // Stats / Notifications
  const [notification, setNotification] = useState<string | null>(null);

  // Load high score
  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("aether_strike_highscore");
      if (stored) setHighScore(parseInt(stored, 10));
    }
  }, []);

  // Keyboard controls listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      keysRef.current[e.code] = true;

      if (e.code === "KeyP" && (gameState === "playing" || gameState === "paused")) {
        setGameState((prev) => (prev === "playing" ? "paused" : "playing"));
      }

      if (e.code === "KeyE" && gameState === "playing" && player.empCooldown <= 0) {
        triggerEMP();
      }

      if (e.code === "KeyR" && gameState === "playing" && player.missileAmmo > 0) {
        fireMissile();
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
  }, [gameState, player.empCooldown, player.missileAmmo]);

  // Audio mute sync
  const toggleMute = () => {
    const next = !muted;
    setMuted(next);
    audioSynth.muted = next;
    if (next) audioSynth.stopBgm();
    else if (gameState === "playing") audioSynth.startBgm();
  };

  // Trigger EMP Shockwave
  const triggerEMP = () => {
    audioSynth.playEmp();
    setEmpActive(true);
    empWaveRadiusRef.current = 1;

    setPlayer((prev) => ({ ...prev, empCooldown: 12 }));

    // Destroy all non-boss projectiles & damage enemies
    lasersRef.current = lasersRef.current.filter((l) => l.isPlayer);
    enemiesRef.current.forEach((enemy) => {
      enemy.health -= 50;
      // Spawn explosion particles
      spawnExplosion(enemy.x, enemy.y, enemy.z, "#38bdf8", 15);
    });

    showNotification("EMP SHOCKWAVE ACTIVATED!");
  };

  // Fire Homing Missile
  const fireMissile = () => {
    audioSynth.playMissile();
    setPlayer((prev) => ({ ...prev, missileAmmo: prev.missileAmmo - 1 }));

    // Target nearest enemy
    let target = enemiesRef.current[0];
    if (target) {
      const dx = target.x - player.x;
      const dy = target.y - player.y;
      const dz = target.z - player.z;
      const dist = Math.hypot(dx, dy, dz);

      lasersRef.current.push({
        id: "missile_" + Math.random(),
        isPlayer: true,
        x: player.x,
        y: player.y,
        z: player.z - 2,
        vx: (dx / dist) * 45,
        vy: (dy / dist) * 45,
        vz: (dz / dist) * 45,
        color: "#f43f5e",
        damage: 80
      });
    }
  };

  // Helper: Spawn Explosions
  const spawnExplosion = (x: number, y: number, z: number, color: string, count: number) => {
    audioSynth.playExplosion();
    for (let i = 0; i < count; i++) {
      particlesRef.current.push({
        id: "p_" + Math.random(),
        x,
        y,
        z,
        vx: (Math.random() - 0.5) * 20,
        vy: (Math.random() - 0.5) * 20,
        vz: (Math.random() - 0.5) * 20,
        color,
        size: Math.random() * 0.8 + 0.3,
        life: 0.6,
        maxLife: 0.6
      });
    }
  };

  // Show Toast Notification
  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 2500);
  };

  // Start Game
  const startGame = () => {
    audioSynth.startBgm();
    setWave(1);
    setPlayer({
      x: 0,
      y: 0,
      z: 0,
      health: 100,
      maxHealth: 100,
      shield: 50,
      maxShield: 50,
      empCooldown: 0,
      missileAmmo: 5,
      maxMissileAmmo: 10,
      score: 0,
      combo: 0,
      aetherCores: 0,
      weaponLevel: 1,
      overdrive: 0,
      isOverdriveActive: false,
      speedMultiplier: difficulty === "apex" ? 1.4 : difficulty === "veteran" ? 1.2 : 1
    });

    enemiesRef.current = [];
    lasersRef.current = [];
    coresRef.current = [];
    particlesRef.current = [];

    spawnWave(1);
    setGameState("playing");
  };

  // Spawn Waves of Enemies
  const spawnWave = (currentWave: number) => {
    showNotification(`WAVE ${currentWave} INITIATED`);
    const count = 4 + currentWave * 3;
    const isBossWave = currentWave % 5 === 0;

    const newEnemies: EnemyData[] = [];

    if (isBossWave) {
      newEnemies.push({
        id: "boss_" + currentWave,
        type: "boss",
        x: 0,
        y: 5,
        z: -90,
        health: 500 + currentWave * 200,
        maxHealth: 500 + currentWave * 200,
        speed: 4,
        shootTimer: 0,
        radius: 6,
        rotX: 0.2,
        rotY: 0.5,
        rotZ: 0
      });
    }

    for (let i = 0; i < count; i++) {
      const typeRand = Math.random();
      const type = typeRand > 0.7 ? "heavy" : typeRand > 0.4 ? "stalker" : "interceptor";

      newEnemies.push({
        id: `e_${currentWave}_${i}`,
        type,
        x: (Math.random() - 0.5) * 60,
        y: (Math.random() - 0.5) * 35,
        z: -60 - Math.random() * 80,
        health: type === "heavy" ? 60 : type === "stalker" ? 30 : 20,
        maxHealth: type === "heavy" ? 60 : type === "stalker" ? 30 : 20,
        speed: type === "stalker" ? 18 : type === "interceptor" ? 14 : 9,
        shootTimer: Math.random() * 2,
        radius: type === "heavy" ? 2.5 : 1.5,
        rotX: Math.random(),
        rotY: Math.random(),
        rotZ: Math.random()
      });
    }

    enemiesRef.current = newEnemies;
  };

  // Game Loop Ticker
  useEffect(() => {
    if (gameState !== "playing") return;

    let animId: number;
    let lastTime = performance.now();

    const gameLoop = (now: number) => {
      const delta = Math.min((now - lastTime) / 1000, 0.1);
      lastTime = now;

      // 1. Player Movement & Input handling
      setPlayer((prev) => {
        let speed = 25 * prev.speedMultiplier;
        let dashing = false;
        if (keysRef.current["ShiftLeft"] || keysRef.current["ShiftRight"]) {
          speed *= 1.8;
          dashing = true;
        }
        setIsDashing(dashing);

        let dx = 0;
        let dy = 0;

        if (keysRef.current["KeyA"] || keysRef.current["ArrowLeft"]) dx -= 1;
        if (keysRef.current["KeyD"] || keysRef.current["ArrowRight"]) dx += 1;
        if (keysRef.current["KeyW"] || keysRef.current["ArrowUp"]) dy += 1;
        if (keysRef.current["KeyS"] || keysRef.current["ArrowDown"]) dy -= 1;

        const newX = THREE.MathUtils.clamp(prev.x + dx * speed * delta, -32, 32);
        const newY = THREE.MathUtils.clamp(prev.y + dy * speed * delta, -20, 20);

        // EMP Cooldown countdown
        const newEmp = Math.max(0, prev.empCooldown - delta);

        // Natural Shield Regeneration
        const newShield = Math.min(prev.maxShield, prev.shield + delta * 2);

        return {
          ...prev,
          x: newX,
          y: newY,
          empCooldown: newEmp,
          shield: newShield
        };
      });

      // 2. Player Weapon Firing
      shootCooldownRef.current -= delta;
      if ((keysRef.current["Space"] || keysRef.current["KeyF"]) && shootCooldownRef.current <= 0) {
        shootCooldownRef.current = player.weaponLevel >= 3 ? 0.09 : player.weaponLevel >= 2 ? 0.13 : 0.18;
        audioSynth.playPlasma();

        if (player.weaponLevel === 1) {
          lasersRef.current.push({
            id: "pl_" + Math.random(),
            isPlayer: true,
            x: player.x,
            y: player.y,
            z: player.z - 2,
            vx: 0,
            vy: 0,
            vz: -120,
            color: "#38bdf8",
            damage: 15
          });
        } else if (player.weaponLevel === 2) {
          lasersRef.current.push(
            {
              id: "pl1_" + Math.random(),
              isPlayer: true,
              x: player.x - 1,
              y: player.y,
              z: player.z - 2,
              vx: 0,
              vy: 0,
              vz: -120,
              color: "#38bdf8",
              damage: 15
            },
            {
              id: "pl2_" + Math.random(),
              isPlayer: true,
              x: player.x + 1,
              y: player.y,
              z: player.z - 2,
              vx: 0,
              vy: 0,
              vz: -120,
              color: "#38bdf8",
              damage: 15
            }
          );
        } else {
          // Spread Shot Level 3
          lasersRef.current.push(
            {
              id: "pl1_" + Math.random(),
              isPlayer: true,
              x: player.x,
              y: player.y,
              z: player.z - 2,
              vx: 0,
              vy: 0,
              vz: -130,
              color: "#e879f9",
              damage: 20
            },
            {
              id: "pl2_" + Math.random(),
              isPlayer: true,
              x: player.x - 0.8,
              y: player.y,
              z: player.z - 2,
              vx: -15,
              vy: 0,
              vz: -125,
              color: "#c084fc",
              damage: 18
            },
            {
              id: "pl3_" + Math.random(),
              isPlayer: true,
              x: player.x + 0.8,
              y: player.y,
              z: player.z - 2,
              vx: 15,
              vy: 0,
              vz: -125,
              color: "#c084fc",
              damage: 18
            }
          );
        }
      }

      // 3. Update Lasers Position & Collision Check
      lasersRef.current.forEach((l) => {
        l.x += l.vx * delta;
        l.y += l.vy * delta;
        l.z += l.vz * delta;
      });

      // Filter out-of-bounds lasers
      lasersRef.current = lasersRef.current.filter(
        (l) => Math.abs(l.x) < 50 && Math.abs(l.y) < 35 && l.z > -160 && l.z < 10
      );

      // 4. Update Enemies & AI Shooting
      enemiesRef.current.forEach((enemy) => {
        enemy.z += enemy.speed * delta;
        enemy.shootTimer += delta;

        // Enemy AI movement wobbles
        if (enemy.type === "stalker") {
          enemy.x += Math.sin(enemy.z * 0.1) * 12 * delta;
        }

        // Enemy shoot laser
        if (enemy.shootTimer > (enemy.type === "boss" ? 0.8 : 2.0)) {
          enemy.shootTimer = 0;
          lasersRef.current.push({
            id: "el_" + Math.random(),
            isPlayer: false,
            x: enemy.x,
            y: enemy.y,
            z: enemy.z + 2,
            vx: (player.x - enemy.x) * 0.3,
            vy: (player.y - enemy.y) * 0.3,
            vz: 45,
            color: enemy.type === "boss" ? "#f43f5e" : "#ef4444",
            damage: enemy.type === "boss" ? 25 : 10
          });
        }

        // Respawn if past player
        if (enemy.z > 15) {
          enemy.z = -120;
          enemy.x = (Math.random() - 0.5) * 60;
          enemy.y = (Math.random() - 0.5) * 35;
        }
      });

      // 5. Collision Checks: Player Lasers -> Enemies
      lasersRef.current.forEach((laser) => {
        if (!laser.isPlayer) return;

        enemiesRef.current.forEach((enemy) => {
          const dist = Math.hypot(laser.x - enemy.x, laser.y - enemy.y, laser.z - enemy.z);
          if (dist < enemy.radius + 0.8) {
            enemy.health -= laser.damage;
            laser.z = 999; // mark laser for removal

            spawnExplosion(laser.x, laser.y, laser.z, laser.color, 4);

            if (enemy.health <= 0) {
              // Enemy Destroyed
              spawnExplosion(enemy.x, enemy.y, enemy.z, "#f97316", 18);
              audioSynth.playExplosion();

              // Drop Quantum Core
              coresRef.current.push({
                id: "c_" + Math.random(),
                x: enemy.x,
                y: enemy.y,
                z: enemy.z,
                value: enemy.type === "boss" ? 50 : 10
              });

              setPlayer((p) => {
                const addScore = enemy.type === "boss" ? 1000 : 150;
                const newScore = p.score + addScore * (p.combo + 1);
                if (newScore > highScore) {
                  setHighScore(newScore);
                  localStorage.setItem("aether_strike_highscore", newScore.toString());
                }
                return {
                  ...p,
                  score: newScore,
                  combo: p.combo + 1,
                  overdrive: Math.min(100, p.overdrive + 8)
                };
              });
            }
          }
        });
      });

      // Filter destroyed enemies
      enemiesRef.current = enemiesRef.current.filter((e) => e.health > 0);

      // 6. Collision Checks: Enemy Lasers -> Player
      lasersRef.current.forEach((laser) => {
        if (laser.isPlayer) return;

        const dist = Math.hypot(laser.x - player.x, laser.y - player.y, laser.z - player.z);
        if (dist < 2.0) {
          laser.z = -999; // mark laser for removal

          setPlayer((p) => {
            let nextShield = p.shield - laser.damage;
            let nextHealth = p.health;

            if (nextShield < 0) {
              nextHealth += nextShield; // apply leftover damage to health
              nextShield = 0;
            }

            if (nextShield > 0) audioSynth.playShieldHit();

            if (nextHealth <= 0) {
              setGameState("gameover");
              audioSynth.stopBgm();
            }

            return {
              ...p,
              shield: Math.max(0, nextShield),
              health: Math.max(0, nextHealth),
              combo: 0
            };
          });
        }
      });

      // 7. Update Collectible Quantum Cores & Magnetic Pull
      coresRef.current.forEach((core) => {
        const dx = player.x - core.x;
        const dy = player.y - core.y;
        const dz = player.z - core.z;
        const dist = Math.hypot(dx, dy, dz);

        if (dist < 18) {
          // Magnet pull towards player
          core.x += (dx / dist) * 30 * delta;
          core.y += (dy / dist) * 30 * delta;
          core.z += (dz / dist) * 30 * delta;
        }

        if (dist < 2.5) {
          // Collected
          core.z = 999;
          audioSynth.playPowerup();
          setPlayer((p) => ({
            ...p,
            aetherCores: p.aetherCores + core.value
          }));
        }
      });

      coresRef.current = coresRef.current.filter((c) => c.z < 20);

      // 8. Update Particles Lifecycle
      particlesRef.current.forEach((p) => {
        p.x += p.vx * delta;
        p.y += p.vy * delta;
        p.z += p.vz * delta;
        p.life -= delta;
      });
      particlesRef.current = particlesRef.current.filter((p) => p.life > 0);

      // 9. Check Wave Clearance
      if (enemiesRef.current.length === 0) {
        if (wave >= maxWave) {
          setGameState("victory");
          audioSynth.stopBgm();
        } else {
          setWave((w) => w + 1);
          setGameState("upgrading");
        }
      }

      // Sync state for React renders
      setEnemies([...enemiesRef.current]);
      setLasers([...lasersRef.current]);
      setCores([...coresRef.current]);
      setParticles([...particlesRef.current]);

      animId = requestAnimationFrame(gameLoop);
    };

    animId = requestAnimationFrame(gameLoop);
    return () => cancelAnimationFrame(animId);
  }, [gameState, player, wave, maxWave, difficulty, highScore]);

  // Upgrade Actions
  const buyUpgrade = (type: "weapon" | "shield" | "missiles") => {
    if (type === "weapon" && player.aetherCores >= 40 && player.weaponLevel < 3) {
      setPlayer((p) => ({ ...p, aetherCores: p.aetherCores - 40, weaponLevel: p.weaponLevel + 1 }));
    } else if (type === "shield" && player.aetherCores >= 30) {
      setPlayer((p) => ({ ...p, aetherCores: p.aetherCores - 30, maxShield: p.maxShield + 25, shield: p.maxShield + 25 }));
    } else if (type === "missiles" && player.aetherCores >= 20) {
      setPlayer((p) => ({ ...p, aetherCores: p.aetherCores - 20, missileAmmo: p.missileAmmo + 5 }));
    }
  };

  const resumeNextWave = () => {
    spawnWave(wave);
    setGameState("playing");
  };

  return (
    <div className="relative w-full h-screen bg-slate-950 text-white overflow-hidden font-sans select-none">
      {/* 3D WebGL Canvas */}
      <Canvas className="w-full h-full">
        <PerspectiveCamera makeDefault position={[0, 0, 18]} fov={65} />
        <CosmicEnvironment />
        <PlayerShipMesh player={player} isDashing={isDashing} />
        <LasersRender lasers={lasers} />
        <CoresRender cores={cores} />
        <ParticlesRender particles={particles} />
        {enemies.map((e) => (
          <EnemyMesh key={e.id} enemy={e} />
        ))}
      </Canvas>

      {/* HUD OVERLAY (When Playing or Paused) */}
      {(gameState === "playing" || gameState === "paused" || gameState === "upgrading") && (
        <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-6">
          {/* Top Bar Stats */}
          <div className="flex justify-between items-start">
            {/* Left: Health & Shield HUD */}
            <div className="flex flex-col gap-2 bg-slate-900/80 backdrop-blur-md p-4 rounded-xl border border-slate-800 w-72 pointer-events-auto">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-400">
                <span className="flex items-center gap-1">
                  <Shield className="w-4 h-4 text-sky-400" /> SHIELD INTEGRITY
                </span>
                <span>{Math.round(player.shield)} / {player.maxShield}</span>
              </div>
              <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-sky-500 to-cyan-400 transition-all duration-200"
                  style={{ width: `${(player.shield / player.maxShield) * 100}%` }}
                />
              </div>

              <div className="flex items-center justify-between text-xs font-semibold text-slate-400 mt-1">
                <span className="flex items-center gap-1">
                  <Flame className="w-4 h-4 text-rose-500" /> HULL STRUCTURE
                </span>
                <span>{Math.round(player.health)} / {player.maxHealth}</span>
              </div>
              <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-rose-600 to-red-500 transition-all duration-200"
                  style={{ width: `${(player.health / player.maxHealth) * 100}%` }}
                />
              </div>
            </div>

            {/* Middle: Wave & Score Counter */}
            <div className="flex flex-col items-center bg-slate-900/80 backdrop-blur-md px-6 py-3 rounded-xl border border-slate-800">
              <span className="text-xs font-bold text-sky-400 tracking-widest uppercase">WAVE {wave} / {maxWave}</span>
              <span className="text-3xl font-black tracking-tight text-white">{player.score.toLocaleString()}</span>
              {player.combo > 1 && (
                <span className="text-xs font-bold text-amber-400 animate-pulse">COMBO x{player.combo}</span>
              )}
            </div>

            {/* Right: Resources & Controls */}
            <div className="flex items-center gap-3 pointer-events-auto">
              <div className="flex items-center gap-2 bg-slate-900/80 backdrop-blur-md px-4 py-2.5 rounded-xl border border-slate-800 text-sky-400 font-bold">
                <Cpu className="w-5 h-5" />
                <span>{player.aetherCores} CORES</span>
              </div>

              <button
                onClick={toggleMute}
                className="p-3 bg-slate-900/80 backdrop-blur-md rounded-xl border border-slate-800 hover:bg-slate-800 transition"
              >
                {muted ? <VolumeX className="w-5 h-5 text-slate-400" /> : <Volume2 className="w-5 h-5 text-sky-400" />}
              </button>
            </div>
          </div>

          {/* Toast Notification */}
          <AnimatePresence>
            {notification && (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="self-center bg-sky-500/20 border border-sky-500/50 backdrop-blur-md px-6 py-2 rounded-full text-sky-300 font-bold text-sm tracking-widest uppercase shadow-lg shadow-sky-500/20"
              >
                {notification}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Bottom Bar Abilities & Ammo */}
          <div className="flex justify-between items-end">
            <div className="flex items-center gap-3">
              {/* EMP Ability Button */}
              <div className={`flex flex-col items-center p-3 rounded-xl border backdrop-blur-md ${player.empCooldown <= 0 ? "bg-sky-950/80 border-sky-500 text-sky-400 shadow-lg shadow-sky-500/20" : "bg-slate-900/80 border-slate-800 text-slate-500"}`}>
                <Zap className="w-6 h-6 mb-1" />
                <span className="text-[10px] font-bold">EMP (E)</span>
                <span className="text-[9px]">{player.empCooldown > 0 ? `${Math.ceil(player.empCooldown)}s` : "READY"}</span>
              </div>

              {/* Homing Missiles Button */}
              <div className={`flex flex-col items-center p-3 rounded-xl border backdrop-blur-md ${player.missileAmmo > 0 ? "bg-rose-950/80 border-rose-500 text-rose-400 shadow-lg shadow-rose-500/20" : "bg-slate-900/80 border-slate-800 text-slate-500"}`}>
                <Rocket className="w-6 h-6 mb-1" />
                <span className="text-[10px] font-bold">MISSILES (R)</span>
                <span className="text-[9px]">{player.missileAmmo} / {player.maxMissileAmmo}</span>
              </div>
            </div>

            {/* Controls Helper */}
            <div className="text-right text-xs text-slate-400 bg-slate-900/60 backdrop-blur-sm px-4 py-2 rounded-lg border border-slate-800/80">
              <p><span className="text-slate-200 font-semibold">WASD / Arrows</span>: Move | <span className="text-slate-200 font-semibold">Space</span>: Fire Plasma</p>
              <p><span className="text-slate-200 font-semibold">Shift</span>: Hyper-Dash | <span className="text-slate-200 font-semibold">P</span>: Pause</p>
            </div>
          </div>
        </div>
      )}

      {/* START MENU OVERLAY */}
      {gameState === "menu" && (
        <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-xl flex flex-col items-center justify-center p-6 text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="max-w-xl w-full flex flex-col items-center"
          >
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-sky-500/10 border border-sky-500/30 text-sky-400 text-xs font-semibold uppercase tracking-widest mb-6">
              <SparklesIcon className="w-4 h-4" /> 3D CYBER SPACE COMBAT
            </div>

            <h1 className="text-6xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-sky-400 via-indigo-300 to-fuchsia-400 mb-4">
              AETHER STRIKE 3D
            </h1>
            <p className="text-slate-400 text-sm max-w-md mb-8">
              Pilot your apex starfighter through hostile cyber armadas. Master EMP shockwaves, homing missiles, upgrade ship systems, and conquer sector dreadnoughts.
            </p>

            {/* Difficulty Selector */}
            <div className="flex items-center gap-2 mb-8 bg-slate-900 p-1.5 rounded-xl border border-slate-800">
              {(["novice", "veteran", "apex"] as const).map((diff) => (
                <button
                  key={diff}
                  onClick={() => setDifficulty(diff)}
                  className={`px-5 py-2 rounded-lg text-xs font-bold uppercase transition ${difficulty === diff ? "bg-sky-500 text-white shadow-md shadow-sky-500/30" : "text-slate-400 hover:text-white"}`}
                >
                  {diff}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-4 w-full max-w-xs">
              <button
                onClick={startGame}
                className="flex-1 py-4 bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white font-bold rounded-xl shadow-lg shadow-sky-500/25 flex items-center justify-center gap-2 transition transform active:scale-95"
              >
                <Play className="w-5 h-5 fill-current" /> LAUNCH MISSION
              </button>
            </div>

            {highScore > 0 && (
              <div className="mt-8 flex items-center gap-2 text-xs font-semibold text-slate-400">
                <Trophy className="w-4 h-4 text-amber-400" /> SECTOR HIGH SCORE: {highScore.toLocaleString()}
              </div>
            )}
          </motion.div>
        </div>
      )}

      {/* WAVE UPGRADE SHOP OVERLAY */}
      {gameState === "upgrading" && (
        <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-xl flex flex-col items-center justify-center p-6">
          <div className="max-w-lg w-full bg-slate-900 border border-slate-800 rounded-2xl p-6 text-center">
            <h2 className="text-2xl font-black text-sky-400 mb-2">SECTOR CLEARED!</h2>
            <p className="text-xs text-slate-400 mb-6">Upgrade your starfighter subsystems before the next wave arrives.</p>

            <div className="flex justify-center items-center gap-2 mb-6 text-sky-400 font-bold text-lg">
              <Cpu className="w-5 h-5" /> AETHER CORES: {player.aetherCores}
            </div>

            <div className="space-y-3 mb-6 text-left">
              <div className="flex items-center justify-between p-3 bg-slate-950 rounded-xl border border-slate-800">
                <div>
                  <div className="text-sm font-bold text-white">PLASMA CANNON (LVL {player.weaponLevel})</div>
                  <div className="text-xs text-slate-400">Increase fire rate & spread bullets</div>
                </div>
                <button
                  disabled={player.aetherCores < 40 || player.weaponLevel >= 3}
                  onClick={() => buyUpgrade("weapon")}
                  className="px-4 py-2 bg-sky-600 disabled:opacity-40 hover:bg-sky-500 rounded-lg text-xs font-bold text-white"
                >
                  {player.weaponLevel >= 3 ? "MAXED" : "40 CORES"}
                </button>
              </div>

              <div className="flex items-center justify-between p-3 bg-slate-950 rounded-xl border border-slate-800">
                <div>
                  <div className="text-sm font-bold text-white">SHIELD CAPACITY</div>
                  <div className="text-xs text-slate-400">+25 Max Shield & Full Recharge</div>
                </div>
                <button
                  disabled={player.aetherCores < 30}
                  onClick={() => buyUpgrade("shield")}
                  className="px-4 py-2 bg-sky-600 disabled:opacity-40 hover:bg-sky-500 rounded-lg text-xs font-bold text-white"
                >
                  30 CORES
                </button>
              </div>

              <div className="flex items-center justify-between p-3 bg-slate-950 rounded-xl border border-slate-800">
                <div>
                  <div className="text-sm font-bold text-white">MISSILE RESTOCK</div>
                  <div className="text-xs text-slate-400">+5 Homing Missiles</div>
                </div>
                <button
                  disabled={player.aetherCores < 20}
                  onClick={() => buyUpgrade("missiles")}
                  className="px-4 py-2 bg-sky-600 disabled:opacity-40 hover:bg-sky-500 rounded-lg text-xs font-bold text-white"
                >
                  20 CORES
                </button>
              </div>
            </div>

            <button
              onClick={resumeNextWave}
              className="w-full py-3 bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 rounded-xl font-bold text-white shadow-lg shadow-sky-500/20"
            >
              ENGAGE WAVE {wave}
            </button>
          </div>
        </div>
      )}

      {/* GAME OVER OVERLAY */}
      {gameState === "gameover" && (
        <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-xl flex flex-col items-center justify-center p-6 text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="max-w-md w-full bg-slate-900 border border-slate-800 p-8 rounded-2xl"
          >
            <div className="p-3 bg-rose-500/10 text-rose-500 rounded-full w-fit mx-auto mb-4">
              <ShieldAlert className="w-8 h-8" />
            </div>
            <h2 className="text-3xl font-black text-white mb-2">CRITICAL HULL FAILURE</h2>
            <p className="text-xs text-slate-400 mb-6">Your starfighter was destroyed in Wave {wave}.</p>

            <div className="bg-slate-950 p-4 rounded-xl mb-6 space-y-2 text-left text-xs font-semibold">
              <div className="flex justify-between text-slate-400">
                <span>FINAL SCORE</span>
                <span className="text-white font-bold">{player.score.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>WAVES COMPLETED</span>
                <span className="text-sky-400 font-bold">{wave - 1} / {maxWave}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>CORES COLLECTED</span>
                <span className="text-cyan-400 font-bold">{player.aetherCores}</span>
              </div>
            </div>

            <button
              onClick={startGame}
              className="w-full py-3.5 bg-sky-500 hover:bg-sky-400 font-bold text-white rounded-xl shadow-lg shadow-sky-500/25 flex items-center justify-center gap-2 mb-3"
            >
              <RotateCcw className="w-4 h-4" /> RESTART MISSION
            </button>
            <button
              onClick={() => setGameState("menu")}
              className="w-full py-3 bg-slate-800 hover:bg-slate-700 font-bold text-slate-300 rounded-xl"
            >
              MAIN MENU
            </button>
          </motion.div>
        </div>
      )}

      {/* VICTORY OVERLAY */}
      {gameState === "victory" && (
        <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-xl flex flex-col items-center justify-center p-6 text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="max-w-md w-full bg-slate-900 border border-slate-800 p-8 rounded-2xl"
          >
            <div className="p-3 bg-amber-500/10 text-amber-400 rounded-full w-fit mx-auto mb-4">
              <Award className="w-8 h-8" />
            </div>
            <h2 className="text-3xl font-black text-amber-400 mb-2">SECTOR VICTORIOUS!</h2>
            <p className="text-xs text-slate-400 mb-6">You eliminated all cyber threats and saved the Aether sector.</p>

            <div className="bg-slate-950 p-4 rounded-xl mb-6 space-y-2 text-left text-xs font-semibold">
              <div className="flex justify-between text-slate-400">
                <span>FINAL SCORE</span>
                <span className="text-amber-400 font-bold">{player.score.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>DIFFICULTY</span>
                <span className="text-sky-400 uppercase font-bold">{difficulty}</span>
              </div>
            </div>

            <button
              onClick={startGame}
              className="w-full py-3.5 bg-amber-500 hover:bg-amber-400 font-bold text-slate-950 rounded-xl shadow-lg shadow-amber-500/25 mb-3"
            >
              PLAY AGAIN
            </button>
          </motion.div>
        </div>
      )}
    </div>
  );
}
