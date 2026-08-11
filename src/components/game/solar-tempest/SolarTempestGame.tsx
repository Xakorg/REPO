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
  ShieldAlert
} from "lucide-react";
import Link from "next/link";

// --- SYNTHETIC WEB AUDIO SOUND ENGINE ---
class SolarSoundEngine {
  ctx: AudioContext | null = null;
  muted: boolean = false;

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
    osc.frequency.setValueAtTime(1050, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(150, this.ctx.currentTime + 0.1);

    gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.1);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.1);
  }

  playMissile() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(300, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(800, this.ctx.currentTime + 0.25);

    gain.gain.setValueAtTime(0.25, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.25);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.25);
  }

  playCrystalCollect() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(587.33, now); // D5
    osc.frequency.setValueAtTime(739.99, now + 0.04); // F#5
    osc.frequency.setValueAtTime(880, now + 0.08); // A5
    osc.frequency.setValueAtTime(1174.66, now + 0.12); // D6

    gain.gain.setValueAtTime(0.25, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.22);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(now + 0.22);
  }

  playExplosion() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(220, now);
    osc.frequency.exponentialRampToValueAtTime(30, now + 0.35);

    gain.gain.setValueAtTime(0.35, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.35);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(now + 0.35);
  }

  playShieldHit() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = "square";
    osc.frequency.setValueAtTime(150, now);
    osc.frequency.linearRampToValueAtTime(60, now + 0.15);

    gain.gain.setValueAtTime(0.25, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(now + 0.15);
  }

  playWarp() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(200, now);
    osc.frequency.exponentialRampToValueAtTime(1200, now + 0.4);

    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.4);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(now + 0.4);
  }
}

const soundEngine = new SolarSoundEngine();

// --- SHIP TYPES & SKINS ---
interface ShipSkin {
  id: string;
  name: string;
  hullColor: string;
  glowColor: string;
  trailColor: string;
  laserColor: string;
  price: number;
}

const SHIP_SKINS: ShipSkin[] = [
  {
    id: "solar_phoenix",
    name: "Solar Phoenix",
    hullColor: "#f97316",
    glowColor: "#fdba74",
    trailColor: "#ff4500",
    laserColor: "#f59e0b",
    price: 0
  },
  {
    id: "cyber_dragon",
    name: "Cyber Dragon",
    hullColor: "#06b6d4",
    glowColor: "#67e8f9",
    trailColor: "#00f0ff",
    laserColor: "#22d3ee",
    price: 500
  },
  {
    id: "void_reaper",
    name: "Void Reaper",
    hullColor: "#a855f7",
    glowColor: "#e9d5ff",
    trailColor: "#c084fc",
    laserColor: "#d8b4fe",
    price: 1200
  },
  {
    id: "hyper_gold",
    name: "Hyperion Gold",
    hullColor: "#eab308",
    glowColor: "#fef08a",
    trailColor: "#ffd700",
    laserColor: "#facc15",
    price: 2500
  }
];

// --- 3D SCENE COMPONENTS ---

// Player Starfighter Model
function PlayerShip({
  position,
  rotation,
  skin,
  isBoosting,
  shieldActive
}: {
  position: [number, number, number];
  rotation: [number, number, number];
  skin: ShipSkin;
  isBoosting: boolean;
  shieldActive: boolean;
}) {
  const shipGroupRef = useRef<THREE.Group>(null);
  const thrusterGlowRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (shipGroupRef.current) {
      shipGroupRef.current.position.set(...position);
      shipGroupRef.current.rotation.set(...rotation);
    }
    if (thrusterGlowRef.current) {
      const scale = isBoosting ? 1.8 + Math.sin(state.clock.getElapsedTime() * 30) * 0.3 : 1.0;
      thrusterGlowRef.current.scale.set(scale, scale, scale * 1.5);
    }
  });

  return (
    <group ref={shipGroupRef}>
      {/* Main Fuselage */}
      <mesh position={[0, 0, 0]}>
        <coneGeometry args={[0.7, 2.8, 5]} />
        <meshStandardMaterial
          color={skin.hullColor}
          metalness={0.8}
          roughness={0.2}
          emissive={skin.hullColor}
          emissiveIntensity={0.2}
        />
      </mesh>

      {/* Cockpit Canopy */}
      <mesh position={[0, 0.25, 0.2]}>
        <sphereGeometry args={[0.38, 16, 16]} />
        <meshPhysicalMaterial
          color="#1e293b"
          metalness={0.9}
          roughness={0.1}
          transmission={0.6}
          thickness={0.5}
          emissive={skin.glowColor}
          emissiveIntensity={0.5}
        />
      </mesh>

      {/* Swept Wings */}
      <mesh position={[1.1, -0.1, -0.3]} rotation={[0, -0.2, -0.1]}>
        <boxGeometry args={[1.6, 0.08, 0.9]} />
        <meshStandardMaterial color={skin.hullColor} metalness={0.7} roughness={0.3} />
      </mesh>
      <mesh position={[-1.1, -0.1, -0.3]} rotation={[0, 0.2, 0.1]}>
        <boxGeometry args={[1.6, 0.08, 0.9]} />
        <meshStandardMaterial color={skin.hullColor} metalness={0.7} roughness={0.3} />
      </mesh>

      {/* Wingtip Plasma Cannons */}
      <mesh position={[1.85, -0.1, 0.2]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.06, 0.06, 0.9, 8]} />
        <meshStandardMaterial color="#334155" metalness={0.9} roughness={0.1} />
      </mesh>
      <mesh position={[-1.85, -0.1, 0.2]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.06, 0.06, 0.9, 8]} />
        <meshStandardMaterial color="#334155" metalness={0.9} roughness={0.1} />
      </mesh>

      {/* Thruster Engine Nozzle */}
      <mesh ref={thrusterGlowRef} position={[0, 0, -1.4]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.3, 0.1, 0.6, 16]} />
        <meshBasicMaterial color={skin.trailColor} />
      </mesh>

      {/* Energy Shield Sphere */}
      {shieldActive && (
        <mesh position={[0, 0, 0]}>
          <sphereGeometry args={[2.0, 24, 24]} />
          <meshBasicMaterial
            color="#38bdf8"
            transparent
            opacity={0.35}
            wireframe
          />
        </mesh>
      )}
    </group>
  );
}

// Laser Projectile Mesh
function LaserBeam({ position, color }: { position: [number, number, number]; color: string }) {
  return (
    <mesh position={position} rotation={[Math.PI / 2, 0, 0]}>
      <cylinderGeometry args={[0.08, 0.08, 1.8, 8]} />
      <meshBasicMaterial color={color} />
    </mesh>
  );
}

// Seeker Missile Mesh
function SeekerMissileMesh({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <coneGeometry args={[0.15, 0.8, 8]} />
        <meshStandardMaterial color="#ef4444" emissive="#f87171" emissiveIntensity={0.6} />
      </mesh>
    </group>
  );
}

// Asteroid Mesh
function AsteroidMesh({
  position,
  rotation,
  scale
}: {
  position: [number, number, number];
  rotation: [number, number, number];
  scale: number;
}) {
  return (
    <mesh position={position} rotation={rotation} scale={scale}>
      <dodecahedronGeometry args={[1, 1]} />
      <meshStandardMaterial color="#475569" roughness={0.9} metalness={0.2} />
    </mesh>
  );
}

// Solar Energy Crystal (Collectible)
function EnergyCrystal({
  position,
  rotation
}: {
  position: [number, number, number];
  rotation: [number, number, number];
}) {
  return (
    <group position={position} rotation={rotation}>
      <Float speed={4} rotationIntensity={2} floatIntensity={1.5}>
        <mesh>
          <octahedronGeometry args={[0.55]} />
          <meshStandardMaterial
            color="#fbbf24"
            emissive="#f59e0b"
            emissiveIntensity={0.8}
            metalness={0.5}
            roughness={0.1}
          />
        </mesh>
      </Float>
    </group>
  );
}

// Enemy Drone Mesh
function EnemyDroneMesh({
  position,
  health,
  maxHealth
}: {
  position: [number, number, number];
  health: number;
  maxHealth: number;
}) {
  return (
    <group position={position}>
      <mesh rotation={[0, Math.PI, 0]}>
        <octahedronGeometry args={[0.8]} />
        <meshStandardMaterial color="#dc2626" emissive="#991b1b" emissiveIntensity={0.5} />
      </mesh>
      {/* Glowing Core */}
      <mesh>
        <sphereGeometry args={[0.35, 12, 12]} />
        <meshBasicMaterial color="#ef4444" />
      </mesh>
    </group>
  );
}

// Explosive Particle Visual
function ExplosionParticles({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <Sparkles count={35} scale={4} size={6} speed={3} color="#f97316" />
    </group>
  );
}

// Background Solar Environment (Sun + Space Nebula + Stars)
function SolarSpaceEnvironment({ speedMultiplier }: { speedMultiplier: number }) {
  const starsRef = useRef<THREE.Group>(null);
  const sunRef = useRef<THREE.Mesh>(null);

  useFrame((_, delta) => {
    if (starsRef.current) {
      starsRef.current.position.z += delta * 25 * speedMultiplier;
      if (starsRef.current.position.z > 50) {
        starsRef.current.position.z = -150;
      }
    }
    if (sunRef.current) {
      sunRef.current.rotation.y += delta * 0.1;
    }
  });

  return (
    <>
      <ambientLight intensity={0.4} />
      <directionalLight position={[10, 20, 15]} intensity={1.2} color="#fdba74" />
      <pointLight position={[0, 0, -200]} intensity={3.5} color="#f97316" />

      {/* Solar Core Sun */}
      <mesh ref={sunRef} position={[0, 0, -220]}>
        <sphereGeometry args={[32, 32, 32]} />
        <meshBasicMaterial color="#f97316" />
      </mesh>

      {/* Starfield particles */}
      <group ref={starsRef} position={[0, 0, 0]}>
        <Sparkles count={350} scale={120} size={4} speed={0.8} color="#ffffff" />
        <Sparkles count={150} scale={90} size={6} speed={1.2} color="#38bdf8" />
      </group>
    </>
  );
}

// Main 3D Canvas Scene Loop Controller
function SolarSceneController({
  playerPos,
  playerRot,
  skin,
  isBoosting,
  shieldActive,
  lasers,
  missiles,
  asteroids,
  crystals,
  enemies,
  explosions,
  gameSpeed
}: {
  playerPos: [number, number, number];
  playerRot: [number, number, number];
  skin: ShipSkin;
  isBoosting: boolean;
  shieldActive: boolean;
  lasers: { id: string; pos: [number, number, number] }[];
  missiles: { id: string; pos: [number, number, number] }[];
  asteroids: { id: string; pos: [number, number, number]; rot: [number, number, number]; scale: number }[];
  crystals: { id: string; pos: [number, number, number]; rot: [number, number, number] }[];
  enemies: { id: string; pos: [number, number, number]; health: number; maxHealth: number }[];
  explosions: { id: string; pos: [number, number, number] }[];
  gameSpeed: number;
}) {
  return (
    <Canvas style={{ background: "#030712" }}>
      <PerspectiveCamera makeDefault position={[0, 2.5, 7.5]} fov={65} />
      <SolarSpaceEnvironment speedMultiplier={gameSpeed} />

      <PlayerShip
        position={playerPos}
        rotation={playerRot}
        skin={skin}
        isBoosting={isBoosting}
        shieldActive={shieldActive}
      />

      {lasers.map((l) => (
        <LaserBeam key={l.id} position={l.pos} color={skin.laserColor} />
      ))}

      {missiles.map((m) => (
        <SeekerMissileMesh key={m.id} position={m.pos} />
      ))}

      {asteroids.map((a) => (
        <AsteroidMesh key={a.id} position={a.pos} rotation={a.rot} scale={a.scale} />
      ))}

      {crystals.map((c) => (
        <EnergyCrystal key={c.id} position={c.pos} rotation={c.rot} />
      ))}

      {enemies.map((e) => (
        <EnemyDroneMesh key={e.id} position={e.pos} health={e.health} maxHealth={e.maxHealth} />
      ))}

      {explosions.map((ex) => (
        <ExplosionParticles key={ex.id} position={ex.pos} />
      ))}
    </Canvas>
  );
}

// --- MAIN GAME COMPONENT ---
export default function SolarTempestGame() {
  const [gameState, setGameState] = useState<"menu" | "playing" | "paused" | "gameover">("menu");
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [credits, setCredits] = useState(0);
  const [health, setHealth] = useState(100);
  const [shield, setShield] = useState(100);
  const [heat, setHeat] = useState(0);
  const [boostEnergy, setBoostEnergy] = useState(100);
  const [missileCount, setMissileCount] = useState(5);
  const [isBoosting, setIsBoosting] = useState(false);
  const [muted, setMuted] = useState(false);

  // Upgrades
  const [laserPower, setLaserPower] = useState(1);
  const [shieldCapacity, setShieldCapacity] = useState(100);
  const [selectedSkin, setSelectedSkin] = useState<ShipSkin>(SHIP_SKINS[0]);
  const [unlockedSkins, setUnlockedSkins] = useState<string[]>(["solar_phoenix"]);

  // 3D Objects State
  const [playerPos, setPlayerPos] = useState<[number, number, number]>([0, 0, 0]);
  const [playerRot, setPlayerRot] = useState<[number, number, number]>([0, 0, 0]);
  const [lasers, setLasers] = useState<{ id: string; pos: [number, number, number] }[]>([]);
  const [missiles, setMissiles] = useState<{ id: string; pos: [number, number, number] }[]>([]);
  const [asteroids, setAsteroids] = useState<
    { id: string; pos: [number, number, number]; rot: [number, number, number]; scale: number; speed: number }[]
  >([]);
  const [crystals, setCrystals] = useState<
    { id: string; pos: [number, number, number]; rot: [number, number, number] }[]
  >([]);
  const [enemies, setEnemies] = useState<
    { id: string; pos: [number, number, number]; health: number; maxHealth: number; speed: number }[]
  >([]);
  const [explosions, setExplosions] = useState<{ id: string; pos: [number, number, number] }[]>([]);

  // Key tracking
  const keysPressed = useRef<{ [key: string]: boolean }>({});
  const lastShotTime = useRef<number>(0);
  const lastMissileTime = useRef<number>(0);

  // Load High Scores & Upgrades from LocalStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedHigh = localStorage.getItem("solar_tempest_highscore");
      if (savedHigh) setHighScore(parseInt(savedHigh, 10));

      const savedCreds = localStorage.getItem("solar_tempest_credits");
      if (savedCreds) setCredits(parseInt(savedCreds, 10));

      const savedSkins = localStorage.getItem("solar_tempest_unlocked_skins");
      if (savedSkins) {
        try { setUnlockedSkins(JSON.parse(savedSkins)); } catch (e) { console.error("Failed to parse saved skins", e); }
      }
    }
  }, []);

  // Save Progress
  const saveProgress = (newScore: number, newCredits: number) => {
    if (typeof window !== "undefined") {
      if (newScore > highScore) {
        setHighScore(newScore);
        localStorage.setItem("solar_tempest_highscore", newScore.toString());
      }
      localStorage.setItem("solar_tempest_credits", newCredits.toString());
    }
  };

  // Sound Mute Sync
  const toggleMute = () => {
    const nextMuted = !muted;
    setMuted(nextMuted);
    soundEngine.muted = nextMuted;
  };

  // Purchase Skin
  const buySkin = (skin: ShipSkin) => {
    if (credits >= skin.price && !unlockedSkins.includes(skin.id)) {
      const updatedCreds = credits - skin.price;
      const updatedSkins = [...unlockedSkins, skin.id];
      setCredits(updatedCreds);
      setUnlockedSkins(updatedSkins);
      setSelectedSkin(skin);

      if (typeof window !== "undefined") {
        localStorage.setItem("solar_tempest_credits", updatedCreds.toString());
        localStorage.setItem("solar_tempest_unlocked_skins", JSON.stringify(updatedSkins));
      }
    }
  };

  // Keyboard Event Handlers
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      keysPressed.current[e.key.toLowerCase()] = true;

      if (e.key === "p" || e.key === "P" || e.key === "Escape") {
        if (gameState === "playing") setGameState("paused");
        else if (gameState === "paused") setGameState("playing");
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      keysPressed.current[e.key.toLowerCase()] = false;
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [gameState]);

  // Start Game Routine
  const startGame = () => {
    setGameState("playing");
    setScore(0);
    setHealth(100);
    setShield(shieldCapacity);
    setHeat(0);
    setBoostEnergy(100);
    setMissileCount(5);
    setPlayerPos([0, 0, 0]);
    setPlayerRot([0, 0, 0]);
    setLasers([]);
    setMissiles([]);
    setExplosions([]);

    // Populate initial hazards
    const initialAsteroids = Array.from({ length: 8 }).map((_, i) => ({
      id: `ast_${Date.now()}_${i}`,
      pos: [(Math.random() - 0.5) * 16, (Math.random() - 0.5) * 10, -20 - i * 15] as [number, number, number],
      rot: [Math.random() * Math.PI, Math.random() * Math.PI, 0] as [number, number, number],
      scale: 0.8 + Math.random() * 1.2,
      speed: 12 + Math.random() * 8
    }));
    setAsteroids(initialAsteroids);

    const initialCrystals = Array.from({ length: 5 }).map((_, i) => ({
      id: `crys_${Date.now()}_${i}`,
      pos: [(Math.random() - 0.5) * 14, (Math.random() - 0.5) * 8, -25 - i * 20] as [number, number, number],
      rot: [0, Math.random() * Math.PI, 0] as [number, number, number]
    }));
    setCrystals(initialCrystals);

    const initialEnemies = Array.from({ length: 3 }).map((_, i) => ({
      id: `en_${Date.now()}_${i}`,
      pos: [(Math.random() - 0.5) * 14, (Math.random() - 0.5) * 8, -35 - i * 25] as [number, number, number],
      health: 3,
      maxHealth: 3,
      speed: 10 + Math.random() * 5
    }));
    setEnemies(initialEnemies);
  };

  // Main Game Loop Effect
  useEffect(() => {
    if (gameState !== "playing") return;

    let animFrameId: number;
    let lastTime = performance.now();

    const loop = (currentTime: number) => {
      const delta = (currentTime - lastTime) / 1000;
      lastTime = currentTime;

      // Handle Player Input Movement
      setPlayerPos((prev) => {
        let [x, y, z] = prev;
        let speed = 9.0;
        const boosting = keysPressed.current["shift"] && boostEnergy > 5;
        setIsBoosting(boosting);

        if (boosting) {
          speed = 17.0;
          setBoostEnergy((b) => Math.max(0, b - delta * 30));
        } else {
          setBoostEnergy((b) => Math.min(100, b + delta * 15));
        }

        if (keysPressed.current["a"] || keysPressed.current["arrowleft"]) x -= speed * delta;
        if (keysPressed.current["d"] || keysPressed.current["arrowright"]) x += speed * delta;
        if (keysPressed.current["w"] || keysPressed.current["arrowup"]) y += speed * delta;
        if (keysPressed.current["s"] || keysPressed.current["arrowdown"]) y -= speed * delta;

        // Clamp inside boundary bounds
        x = Math.max(-8.5, Math.min(8.5, x));
        y = Math.max(-4.5, Math.min(4.5, y));

        // Bank rotation on turn
        const targetRotZ = -(x - prev[0]) * 1.5;
        const targetRotX = (y - prev[1]) * 0.8;
        setPlayerRot([targetRotX, 0, targetRotZ]);

        return [x, y, z];
      });

      // Handle Weapon Shooting (Space or J key)
      if ((keysPressed.current[" "] || keysPressed.current["j"]) && currentTime - lastShotTime.current > 160) {
        if (heat < 90) {
          lastShotTime.current = currentTime;
          soundEngine.playLaser();
          setHeat((h) => Math.min(100, h + 12));

          setLasers((prev) => [
            ...prev,
            { id: `l_${Date.now()}_L`, pos: [playerPos[0] - 0.7, playerPos[1] - 0.1, playerPos[2] - 1.2] },
            { id: `l_${Date.now()}_R`, pos: [playerPos[0] + 0.7, playerPos[1] - 0.1, playerPos[2] - 1.2] }
          ]);
        }
      }

      // Handle Seeker Missile (K key)
      if (keysPressed.current["k"] && missileCount > 0 && currentTime - lastMissileTime.current > 600) {
        lastMissileTime.current = currentTime;
        setMissileCount((m) => m - 1);
        soundEngine.playMissile();
        setMissiles((prev) => [...prev, { id: `m_${Date.now()}`, pos: [playerPos[0], playerPos[1], playerPos[2] - 1.0] }]);
      }

      // Cool down weapon heat over time
      setHeat((h) => Math.max(0, h - delta * 25));

      // Move Lasers forward
      setLasers((prev) =>
        prev
          .map((l) => ({ ...l, pos: [l.pos[0], l.pos[1], l.pos[2] - delta * 55] as [number, number, number] }))
          .filter((l) => l.pos[2] > -90)
      );

      // Move Seeker Missiles forward
      setMissiles((prev) =>
        prev
          .map((m) => ({ ...m, pos: [m.pos[0], m.pos[1], m.pos[2] - delta * 45] as [number, number, number] }))
          .filter((m) => m.pos[2] > -90)
      );

      // Move Asteroids towards player
      setAsteroids((prev) =>
        prev.map((a) => {
          let z = a.pos[2] + delta * a.speed;
          if (z > 10) {
            z = -90 - Math.random() * 30;
            return {
              ...a,
              pos: [(Math.random() - 0.5) * 16, (Math.random() - 0.5) * 10, z] as [number, number, number],
              rot: [Math.random() * Math.PI, Math.random() * Math.PI, 0] as [number, number, number]
            };
          }
          return { ...a, pos: [a.pos[0], a.pos[1], z] as [number, number, number] };
        })
      );

      // Move Energy Crystals towards player
      setCrystals((prev) =>
        prev.map((c) => {
          let z = c.pos[2] + delta * 14;
          if (z > 10) {
            z = -90 - Math.random() * 25;
            return {
              ...c,
              pos: [(Math.random() - 0.5) * 14, (Math.random() - 0.5) * 8, z] as [number, number, number]
            };
          }
          return { ...c, pos: [c.pos[0], c.pos[1], z] as [number, number, number] };
        })
      );

      // Move Enemy Drones
      setEnemies((prev) =>
        prev.map((e) => {
          let z = e.pos[2] + delta * e.speed;
          if (z > 10) {
            z = -100 - Math.random() * 40;
            return {
              ...e,
              pos: [(Math.random() - 0.5) * 14, (Math.random() - 0.5) * 8, z] as [number, number, number],
              health: e.maxHealth
            };
          }
          return { ...e, pos: [e.pos[0], e.pos[1], z] as [number, number, number] };
        })
      );

      // Collision Detection: Lasers vs Enemies
      setLasers((currentLasers) => {
        let remainingLasers = [...currentLasers];
        setEnemies((currentEnemies) =>
          currentEnemies.map((enemy) => {
            let enemyHealth = enemy.health;
            remainingLasers = remainingLasers.filter((laser) => {
              const dx = laser.pos[0] - enemy.pos[0];
              const dy = laser.pos[1] - enemy.pos[1];
              const dz = laser.pos[2] - enemy.pos[2];
              const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

              if (dist < 1.2) {
                enemyHealth -= laserPower;
                if (enemyHealth <= 0) {
                  soundEngine.playExplosion();
                  setScore((s) => s + 150);
                  setCredits((c) => c + 15);
                  setExplosions((ex) => [...ex, { id: `ex_${Date.now()}`, pos: enemy.pos }]);
                }
                return false; // Destroy laser
              }
              return true;
            });
            return { ...enemy, health: enemyHealth };
          })
        );
        return remainingLasers;
      });

      // Collision Detection: Player vs Energy Crystals
      setCrystals((currentCrystals) =>
        currentCrystals.filter((crystal) => {
          const dx = crystal.pos[0] - playerPos[0];
          const dy = crystal.pos[1] - playerPos[1];
          const dz = crystal.pos[2] - playerPos[2];
          const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

          if (dist < 1.5) {
            soundEngine.playCrystalCollect();
            setScore((s) => s + 50);
            setCredits((c) => c + 5);
            setShield((sh) => Math.min(shieldCapacity, sh + 15));
            return false;
          }
          return true;
        })
      );

      // Collision Detection: Player vs Asteroids
      setAsteroids((currentAsteroids) =>
        currentAsteroids.map((ast) => {
          const dx = ast.pos[0] - playerPos[0];
          const dy = ast.pos[1] - playerPos[1];
          const dz = ast.pos[2] - playerPos[2];
          const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

          if (dist < 1.4 * ast.scale) {
            soundEngine.playShieldHit();
            setShield((sh) => {
              if (sh > 0) return Math.max(0, sh - 25);
              setHealth((h) => {
                const nextHealth = Math.max(0, h - 25);
                if (nextHealth <= 0) {
                  soundEngine.playExplosion();
                  setGameState("gameover");
                  saveProgress(score, credits);
                }
                return nextHealth;
              });
              return 0;
            });
            // Reset asteroid position
            return {
              ...ast,
              pos: [(Math.random() - 0.5) * 16, (Math.random() - 0.5) * 10, -90] as [number, number, number]
            };
          }
          return ast;
        })
      );

      // Increment passive score survival
      setScore((s) => s + 1);

      animFrameId = requestAnimationFrame(loop);
    };

    animFrameId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animFrameId);
  }, [gameState, playerPos, boostEnergy, heat, missileCount, laserPower, shieldCapacity, score, credits]);

  return (
    <div className="relative w-full h-screen bg-slate-950 text-white overflow-hidden font-sans select-none">
      {/* 3D Scene Viewport */}
      <SolarSceneController
        playerPos={playerPos}
        playerRot={playerRot}
        skin={selectedSkin}
        isBoosting={isBoosting}
        shieldActive={shield > 0}
        lasers={lasers}
        missiles={missiles}
        asteroids={asteroids}
        crystals={crystals}
        enemies={enemies}
        explosions={explosions}
        gameSpeed={isBoosting ? 2.2 : 1.0}
      />

      {/* --- HUD OVERLAY WHEN PLAYING --- */}
      {gameState === "playing" && (
        <div className="absolute inset-0 pointer-events-none p-6 flex flex-col justify-between">
          {/* Top Bar Stats */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4 bg-slate-900/80 backdrop-blur-md border border-amber-500/30 px-5 py-2.5 rounded-2xl shadow-lg">
              <Link href="/games" className="pointer-events-auto hover:text-amber-400 transition-colors">
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <div className="flex items-center gap-2">
                <Trophy className="w-5 h-5 text-amber-400" />
                <span className="text-xl font-bold tracking-wider text-amber-300">{score}</span>
              </div>
              <div className="h-4 w-px bg-slate-700" />
              <div className="flex items-center gap-2">
                <SparklesIcon className="w-4 h-4 text-cyan-400" />
                <span className="text-sm font-medium text-cyan-300">Credits: {credits}</span>
              </div>
            </div>

            <div className="flex items-center gap-3 pointer-events-auto">
              <button
                onClick={toggleMute}
                className="p-2.5 bg-slate-900/80 backdrop-blur-md border border-slate-700 rounded-xl hover:bg-slate-800 transition-colors"
              >
                {muted ? <VolumeX className="w-5 h-5 text-red-400" /> : <Volume2 className="w-5 h-5 text-green-400" />}
              </button>
              <button
                onClick={() => setGameState("paused")}
                className="p-2.5 bg-slate-900/80 backdrop-blur-md border border-slate-700 rounded-xl hover:bg-slate-800 transition-colors"
              >
                <Pause className="w-5 h-5 text-amber-400" />
              </button>
            </div>
          </div>

          {/* Center Targeting Crosshair */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-60">
            <Crosshair className="w-10 h-10 text-amber-400 animate-pulse" />
          </div>

          {/* Bottom Vitals & Gauge Panel */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
            {/* Hull & Shield Bars */}
            <div className="bg-slate-900/85 backdrop-blur-md border border-amber-500/20 p-4 rounded-2xl space-y-3">
              <div>
                <div className="flex justify-between text-xs font-semibold text-slate-300 mb-1">
                  <span className="flex items-center gap-1">
                    <Shield className="w-4 h-4 text-cyan-400" /> PLASMA SHIELD
                  </span>
                  <span>{Math.round(shield)}%</span>
                </div>
                <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-cyan-500 to-blue-500 h-full transition-all duration-200"
                    style={{ width: `${(shield / shieldCapacity) * 100}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-semibold text-slate-300 mb-1">
                  <span className="flex items-center gap-1">
                    <ShieldAlert className="w-4 h-4 text-red-400" /> HULL INTEGRITY
                  </span>
                  <span>{Math.round(health)}%</span>
                </div>
                <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-red-500 to-orange-500 h-full transition-all duration-200"
                    style={{ width: `${health}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Weapon Heat & Boost Meter */}
            <div className="bg-slate-900/85 backdrop-blur-md border border-amber-500/20 p-4 rounded-2xl space-y-3">
              <div>
                <div className="flex justify-between text-xs font-semibold text-slate-300 mb-1">
                  <span className="flex items-center gap-1">
                    <Flame className="w-4 h-4 text-amber-500" /> CANNON HEAT
                  </span>
                  <span>{Math.round(heat)}%</span>
                </div>
                <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-150 ${
                      heat > 85 ? "bg-red-500 animate-pulse" : "bg-gradient-to-r from-yellow-500 to-amber-500"
                    }`}
                    style={{ width: `${heat}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-semibold text-slate-300 mb-1">
                  <span className="flex items-center gap-1">
                    <Zap className="w-4 h-4 text-purple-400" /> HYPER BOOST
                  </span>
                  <span>{Math.round(boostEnergy)}%</span>
                </div>
                <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-purple-500 to-indigo-500 h-full transition-all duration-150"
                    style={{ width: `${boostEnergy}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Ordnance / Missiles */}
            <div className="bg-slate-900/85 backdrop-blur-md border border-amber-500/20 p-4 rounded-2xl flex items-center justify-between">
              <div>
                <div className="text-xs font-bold text-slate-400 flex items-center gap-1.5 mb-1">
                  <Rocket className="w-4 h-4 text-red-400" /> SEEKER MISSILES
                </div>
                <div className="flex gap-1.5">
                  {Array.from({ length: 5 }).map((_, idx) => (
                    <div
                      key={idx}
                      className={`w-3.5 h-6 rounded-sm border ${
                        idx < missileCount
                          ? "bg-red-500 border-red-400 shadow-sm shadow-red-500/50"
                          : "bg-slate-800 border-slate-700"
                      }`}
                    />
                  ))}
                </div>
              </div>
              <div className="text-right text-xs text-slate-400">
                <span className="font-semibold text-white">[K]</span> FIRE MISSILE
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- START MENU OVERLAY --- */}
      {gameState === "menu" && (
        <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-6 z-20">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="max-w-xl w-full bg-slate-900 border border-amber-500/30 rounded-3xl p-8 text-center shadow-2xl space-y-6"
          >
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-500/10 border border-amber-500/30 rounded-full text-amber-400 text-xs font-bold uppercase tracking-widest">
                <Radio className="w-3.5 h-3.5" /> 3D Space Flight Simulator
              </div>
              <h1 className="text-4xl md:text-5xl font-black bg-gradient-to-r from-amber-400 via-orange-400 to-amber-200 bg-clip-text text-transparent">
                SOLAR TEMPEST 3D
              </h1>
              <p className="text-sm text-slate-400">
                Command your apex starfighter across an erupting solar flare sector. Destroy enemy mech drones, harvest energy matrix crystals, and master space flight.
              </p>
            </div>

            {/* High Score Banner */}
            <div className="grid grid-cols-2 gap-4 bg-slate-950/60 p-4 rounded-2xl border border-slate-800">
              <div>
                <div className="text-xs text-slate-400 uppercase font-semibold">High Score</div>
                <div className="text-2xl font-bold text-amber-400">{highScore}</div>
              </div>
              <div>
                <div className="text-xs text-slate-400 uppercase font-semibold">Credits</div>
                <div className="text-2xl font-bold text-cyan-400">{credits}</div>
              </div>
            </div>

            {/* Ship Skin Selector */}
            <div className="space-y-2">
              <div className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center justify-center gap-2">
                <Palette className="w-4 h-4 text-amber-400" /> Select Starfighter Hangar
              </div>
              <div className="grid grid-cols-2 gap-3">
                {SHIP_SKINS.map((skin) => {
                  const unlocked = unlockedSkins.includes(skin.id);
                  const selected = selectedSkin.id === skin.id;
                  return (
                    <button
                      key={skin.id}
                      onClick={() => (unlocked ? setSelectedSkin(skin) : buySkin(skin))}
                      className={`p-3 rounded-xl border text-left flex items-center justify-between transition-all ${
                        selected
                          ? "bg-amber-500/20 border-amber-500 text-white"
                          : unlocked
                          ? "bg-slate-800/80 border-slate-700 hover:border-slate-500 text-slate-300"
                          : "bg-slate-900/50 border-slate-800 opacity-75 hover:opacity-100 text-slate-400"
                      }`}
                    >
                      <div>
                        <div className="font-bold text-sm">{skin.name}</div>
                        <div className="text-xs text-slate-400">
                          {unlocked ? "Owned" : `${skin.price} Credits`}
                        </div>
                      </div>
                      <div
                        className="w-4 h-4 rounded-full border border-white/20"
                        style={{ backgroundColor: skin.hullColor }}
                      />
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Controls Guide */}
            <div className="bg-slate-950/40 p-3 rounded-xl text-xs text-slate-400 flex justify-around">
              <div><span className="font-bold text-slate-200">[WASD]</span> Move</div>
              <div><span className="font-bold text-slate-200">[Space/J]</span> Laser</div>
              <div><span className="font-bold text-slate-200">[K]</span> Missile</div>
              <div><span className="font-bold text-slate-200">[Shift]</span> Hyper Boost</div>
            </div>

            {/* Launch Button */}
            <div className="flex gap-4">
              <Link
                href="/games"
                className="flex-1 py-3.5 bg-slate-800 border border-slate-700 rounded-xl font-bold hover:bg-slate-700 transition-colors flex items-center justify-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" /> Exit
              </Link>
              <button
                onClick={startGame}
                className="flex-2 py-3.5 px-8 bg-gradient-to-r from-amber-500 to-orange-500 rounded-xl font-black text-slate-950 hover:from-amber-400 hover:to-orange-400 shadow-lg shadow-amber-500/20 transition-all flex items-center justify-center gap-2"
              >
                <Play className="w-5 h-5 fill-slate-950" /> LAUNCH MISSION
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* --- PAUSE OVERLAY --- */}
      {gameState === "paused" && (
        <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-6 z-20">
          <div className="max-w-md w-full bg-slate-900 border border-amber-500/30 rounded-3xl p-6 text-center space-y-5">
            <h2 className="text-3xl font-black text-amber-400">MISSION PAUSED</h2>
            <div className="space-y-3">
              <button
                onClick={() => setGameState("playing")}
                className="w-full py-3 bg-amber-500 text-slate-950 rounded-xl font-bold hover:bg-amber-400 transition-colors"
              >
                RESUME FLIGHT
              </button>
              <button
                onClick={startGame}
                className="w-full py-3 bg-slate-800 border border-slate-700 rounded-xl font-bold hover:bg-slate-700 transition-colors"
              >
                RESTART MISSION
              </button>
              <button
                onClick={() => setGameState("menu")}
                className="w-full py-3 bg-red-500/20 border border-red-500/40 text-red-300 rounded-xl font-bold hover:bg-red-500/30 transition-colors"
              >
                ABORT TO MENU
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- GAME OVER OVERLAY --- */}
      {gameState === "gameover" && (
        <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-6 z-20">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="max-w-md w-full bg-slate-900 border border-red-500/40 rounded-3xl p-8 text-center space-y-6 shadow-2xl"
          >
            <div className="space-y-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-red-500/10 border border-red-500/30 rounded-full text-red-400 text-xs font-bold uppercase tracking-widest">
                <ShieldAlert className="w-3.5 h-3.5" /> HULL DESTROYED
              </div>
              <h2 className="text-4xl font-black text-red-500">STARFIGHTER LOST</h2>
            </div>

            <div className="bg-slate-950/80 p-5 rounded-2xl border border-slate-800 space-y-3">
              <div className="flex justify-between items-center text-slate-400 text-sm">
                <span>Final Score:</span>
                <span className="text-xl font-bold text-amber-400">{score}</span>
              </div>
              <div className="flex justify-between items-center text-slate-400 text-sm">
                <span>Credits Earned:</span>
                <span className="text-xl font-bold text-cyan-400">+{Math.floor(score / 10)}</span>
              </div>
              <div className="h-px bg-slate-800" />
              <div className="flex justify-between items-center text-slate-400 text-sm">
                <span>Best Record:</span>
                <span className="text-xl font-bold text-white">{highScore}</span>
              </div>
            </div>

            <div className="flex gap-4">
              <button
                onClick={() => setGameState("menu")}
                className="flex-1 py-3.5 bg-slate-800 border border-slate-700 rounded-xl font-bold hover:bg-slate-700 transition-colors"
              >
                HANGAR
              </button>
              <button
                onClick={startGame}
                className="flex-1 py-3.5 bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 font-black rounded-xl hover:from-amber-400 hover:to-orange-400 transition-all flex items-center justify-center gap-2"
              >
                <RotateCcw className="w-4 h-4" /> RETRY
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
