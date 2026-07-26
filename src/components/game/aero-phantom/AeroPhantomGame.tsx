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
  Crosshair,
  Award,
  Pause,
  Maximize2,
  Radio,
  Rocket,
  ShieldAlert,
  Wind,
  Compass,
  ZapOff
} from "lucide-react";
import Link from "next/link";

// --- WEB AUDIO SYNTH SOUND ENGINE ---
class AeroSoundEngine {
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

  playVulcan() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(800, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(100, this.ctx.currentTime + 0.05);

    gain.gain.setValueAtTime(0.15, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.05);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.05);
  }

  playMissileLaunch() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = "triangle";
    osc.frequency.setValueAtTime(200, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(1200, this.ctx.currentTime + 0.3);

    gain.gain.setValueAtTime(0.3, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.35);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.35);
  }

  playExplosion() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = "square";
    osc.frequency.setValueAtTime(120, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(20, this.ctx.currentTime + 0.4);

    gain.gain.setValueAtTime(0.4, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.4);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.4);
  }

  playLockBeep() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(1400, this.ctx.currentTime);

    gain.gain.setValueAtTime(0.1, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.08);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.08);
  }

  playPowerup() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(400, now);
    osc.frequency.exponentialRampToValueAtTime(1200, now + 0.25);

    gain.gain.setValueAtTime(0.25, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start();
    osc.stop(now + 0.25);
  }
}

const audio = new AeroSoundEngine();

// --- GAME TYPES ---
export interface EnemyDrone {
  id: string;
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  type: "interceptor" | "stealth" | "bomber";
  health: number;
  maxHealth: number;
  isTargeted: boolean;
}

export interface Missile {
  id: string;
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  targetId: string | null;
  lifetime: number;
}

export interface Bullet {
  id: string;
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  isEnemy: boolean;
}

export interface Particle {
  id: string;
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  color: string;
  size: number;
  life: number;
}

export interface PowerUp {
  id: string;
  position: THREE.Vector3;
  type: "shield" | "overdrive" | "nuke" | "multi_lock";
}

// --- 3D JET FIGHTER COMPONENT ---
function PlayerJet({
  jetPos,
  jetRot,
  colorScheme,
  isBoosting,
  isOverdrive
}: {
  jetPos: THREE.Vector3;
  jetRot: THREE.Euler;
  colorScheme: string;
  isBoosting: boolean;
  isOverdrive: boolean;
}) {
  const mainColor =
    colorScheme === "crimson"
      ? "#ef4444"
      : colorScheme === "cobalt"
      ? "#3b82f6"
      : colorScheme === "gold"
      ? "#eab308"
      : "#06b6d4";

  const trailColor = isOverdrive ? "#a855f7" : isBoosting ? "#f97316" : mainColor;

  return (
    <group position={jetPos} rotation={jetRot}>
      {/* Fuselage / Main Body */}
      <mesh position={[0, 0, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <coneGeometry args={[0.5, 3.2, 8]} />
        <meshStandardMaterial color="#1e293b" metalness={0.8} roughness={0.2} />
      </mesh>

      {/* Cockpit Canopy */}
      <mesh position={[0, 0.25, 0.3]}>
        <sphereGeometry args={[0.35, 16, 16]} />
        <meshPhysicalMaterial
          color={mainColor}
          transmission={0.6}
          opacity={0.85}
          transparent
          roughness={0.1}
          metalness={0.9}
        />
      </mesh>

      {/* Main Swept Wings */}
      <mesh position={[0, 0, -0.2]} rotation={[0, 0, 0]}>
        <boxGeometry args={[3.8, 0.08, 1.2]} />
        <meshStandardMaterial color="#0f172a" metalness={0.9} roughness={0.3} />
      </mesh>

      {/* Wingtip Energy Tracers */}
      <mesh position={[-1.9, 0, -0.2]}>
        <boxGeometry args={[0.1, 0.1, 0.6]} />
        <meshBasicMaterial color={mainColor} />
      </mesh>
      <mesh position={[1.9, 0, -0.2]}>
        <boxGeometry args={[0.1, 0.1, 0.6]} />
        <meshBasicMaterial color={mainColor} />
      </mesh>

      {/* Twin Tail Stabilizers */}
      <mesh position={[-0.45, 0.5, -1.2]} rotation={[0, 0, -Math.PI / 8]}>
        <boxGeometry args={[0.06, 0.8, 0.6]} />
        <meshStandardMaterial color={mainColor} metalness={0.7} />
      </mesh>
      <mesh position={[0.45, 0.5, -1.2]} rotation={[0, 0, Math.PI / 8]}>
        <boxGeometry args={[0.06, 0.8, 0.6]} />
        <meshStandardMaterial color={mainColor} metalness={0.7} />
      </mesh>

      {/* Afterburner Thruster Engines */}
      <mesh position={[-0.3, 0, -1.5]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.2, 0.25, 0.5, 12]} />
        <meshStandardMaterial color="#334155" />
      </mesh>
      <mesh position={[0.3, 0, -1.5]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.2, 0.25, 0.5, 12]} />
        <meshStandardMaterial color="#334155" />
      </mesh>

      {/* Thruster Flame Glow */}
      <mesh position={[-0.3, 0, -1.9]}>
        <coneGeometry args={[0.18, isBoosting ? 1.2 : 0.6, 12]} />
        <meshBasicMaterial color={trailColor} />
      </mesh>
      <mesh position={[0.3, 0, -1.9]}>
        <coneGeometry args={[0.18, isBoosting ? 1.2 : 0.6, 12]} />
        <meshBasicMaterial color={trailColor} />
      </mesh>
    </group>
  );
}

// --- 3D ENEMY INTERCEPTOR MESH ---
function EnemyMesh({ enemy }: { enemy: EnemyDrone }) {
  const isTargeted = enemy.isTargeted;
  const isBomber = enemy.type === "bomber";
  const isStealth = enemy.type === "stealth";

  const color = isStealth ? "#a855f7" : isBomber ? "#eab308" : "#ef4444";

  return (
    <group position={enemy.position}>
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <octahedronGeometry args={[isBomber ? 1.2 : 0.7, 0]} />
        <meshStandardMaterial color={color} metalness={0.8} roughness={0.2} wireframe={isStealth} />
      </mesh>

      {/* Target Lock Highlight Reticle */}
      {isTargeted && (
        <mesh>
          <ringGeometry args={[1.2, 1.35, 16]} />
          <meshBasicMaterial color="#ef4444" side={THREE.DoubleSide} transparent opacity={0.9} />
        </mesh>
      )}
    </group>
  );
}

// --- 3D ENVIRONMENT (Canyon Grid, Floating Islands & Clouds) ---
function EnvironmentWorld() {
  const gridRef = useRef<THREE.Group>(null);

  useFrame((_, delta) => {
    if (gridRef.current) {
      gridRef.current.position.z += delta * 25;
      if (gridRef.current.position.z > 50) {
        gridRef.current.position.z = 0;
      }
    }
  });

  return (
    <group>
      {/* Fog & Ambient Lights */}
      <fog attach="fog" args={["#090d16", 30, 220]} />
      <ambientLight intensity={0.5} />
      <directionalLight position={[10, 50, 20]} intensity={1.5} color="#fdba74" />
      <directionalLight position={[-20, 20, -20]} intensity={0.8} color="#38bdf8" />

      {/* Infinite Glowing Synth Canyon Floor */}
      <group ref={gridRef}>
        <gridHelper args={[600, 60, "#06b6d4", "#1e293b"]} position={[0, -20, -100]} />
      </group>

      {/* Distant Sunset Sky Dome */}
      <mesh position={[0, 0, -250]}>
        <planeGeometry args={[600, 400]} />
        <meshBasicMaterial color="#0f172a" />
      </mesh>

      {/* Distant Mountain Peaks */}
      <mesh position={[-60, -5, -180]} rotation={[0, 0, 0]}>
        <coneGeometry args={[35, 45, 4]} />
        <meshStandardMaterial color="#1e1b4b" roughness={0.9} />
      </mesh>
      <mesh position={[60, -5, -180]} rotation={[0, 0, 0]}>
        <coneGeometry args={[40, 55, 4]} />
        <meshStandardMaterial color="#1e1b4b" roughness={0.9} />
      </mesh>
      <mesh position={[0, -10, -200]} rotation={[0, 0, 0]}>
        <coneGeometry args={[70, 70, 4]} />
        <meshStandardMaterial color="#311b92" roughness={0.9} />
      </mesh>

      {/* Particle Stars & Dust */}
      <Sparkles count={250} scale={[180, 100, 200]} size={3} speed={0.4} opacity={0.6} color="#38bdf8" />
    </group>
  );
}

// --- MAIN 3D SCENE CONTROLLER ---
function GameScene({
  gameState,
  setGameState,
  score,
  setScore,
  health,
  setHealth,
  shield,
  setShield,
  missileAmmo,
  setMissileAmmo,
  flares,
  setFlares,
  colorScheme,
  combo,
  setCombo
}: any) {
  const [jetPos, setJetPos] = useState(new THREE.Vector3(0, 0, 0));
  const [jetRot, setJetRot] = useState(new THREE.Euler(0, 0, 0));

  const [enemies, setEnemies] = useState<EnemyDrone[]>([]);
  const [missiles, setMissiles] = useState<Missile[]>([]);
  const [bullets, setBullets] = useState<Bullet[]>([]);
  const [particles, setParticles] = useState<Particle[]>([]);
  const [powerups, setPowerups] = useState<PowerUp[]>([]);

  const [isBoosting, setIsBoosting] = useState(false);
  const [isOverdrive, setIsOverdrive] = useState(false);
  const [overdriveTime, setOverdriveTime] = useState(0);

  const targetEnemyIdRef = useRef<string | null>(null);
  const keysPressed = useRef<{ [key: string]: boolean }>({});

  // Keyboard Listeners
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      keysPressed.current[e.code] = true;

      // Missile launch trigger
      if (e.code === "KeyF" || e.code === "Space") {
        launchMissile();
      }
      // Flare trigger
      if (e.code === "KeyE") {
        deployFlares();
      }
      // Boost trigger
      if (e.code === "ShiftLeft" || e.code === "ShiftRight") {
        setIsBoosting(true);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      keysPressed.current[e.code] = false;
      if (e.code === "ShiftLeft" || e.code === "ShiftRight") {
        setIsBoosting(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [missileAmmo, enemies, jetPos]);

  // Missile Launch Logic
  const launchMissile = () => {
    if (missileAmmo <= 0 || gameState !== "playing") return;

    setMissileAmmo((prev: number) => prev - 1);
    audio.playMissileLaunch();

    const targetId = targetEnemyIdRef.current;
    const newMissile: Missile = {
      id: "m_" + Math.random().toString(36).substring(2, 9),
      position: jetPos.clone().add(new THREE.Vector3(0, -0.2, 0.5)),
      velocity: new THREE.Vector3(0, 0, -45),
      targetId: targetId,
      lifetime: 4
    };

    setMissiles((prev) => [...prev, newMissile]);
  };

  // Flare Deploy Logic
  const deployFlares = () => {
    if (flares <= 0 || gameState !== "playing") return;
    setFlares((prev: number) => prev - 1);
    audio.playLockBeep();

    // Spawn bright flare particles behind jet
    const newParticles: Particle[] = [];
    for (let i = 0; i < 15; i++) {
      newParticles.push({
        id: "p_" + Math.random(),
        position: jetPos.clone().add(new THREE.Vector3((Math.random() - 0.5) * 2, (Math.random() - 0.5) * 2, -1)),
        velocity: new THREE.Vector3((Math.random() - 0.5) * 10, (Math.random() - 0.5) * 10, 15 + Math.random() * 10),
        color: "#fbbf24",
        size: 0.4 + Math.random() * 0.4,
        life: 1.2
      });
    }
    setParticles((prev) => [...prev, ...newParticles]);
  };

  // Enemy Spawner Loop
  useEffect(() => {
    if (gameState !== "playing") return;

    const interval = setInterval(() => {
      setEnemies((prev) => {
        if (prev.length >= 8) return prev;

        const types: ("interceptor" | "stealth" | "bomber")[] = ["interceptor", "stealth", "bomber"];
        const chosenType = types[Math.floor(Math.random() * types.length)];
        const maxH = chosenType === "bomber" ? 60 : chosenType === "stealth" ? 30 : 40;

        const newEnemy: EnemyDrone = {
          id: "e_" + Math.random().toString(36).substring(2, 9),
          position: new THREE.Vector3(
            (Math.random() - 0.5) * 35,
            (Math.random() - 0.5) * 15 + 2,
            -60 - Math.random() * 40
          ),
          velocity: new THREE.Vector3((Math.random() - 0.5) * 2, (Math.random() - 0.5) * 2, 8 + Math.random() * 6),
          type: chosenType,
          health: maxH,
          maxHealth: maxH,
          isTargeted: false
        };
        return [...prev, newEnemy];
      });
    }, 2200);

    return () => clearInterval(interval);
  }, [gameState]);

  // Main Physics / Frame Render Loop
  useFrame((_, delta) => {
    if (gameState !== "playing") return;

    // Jet Movement Controls
    const speed = isBoosting ? 28 : 16;
    const moveX = (keysPressed.current["KeyD"] || keysPressed.current["ArrowRight"] ? 1 : 0) -
                 (keysPressed.current["KeyA"] || keysPressed.current["ArrowLeft"] ? 1 : 0);
    const moveY = (keysPressed.current["KeyW"] || keysPressed.current["ArrowUp"] ? 1 : 0) -
                 (keysPressed.current["KeyS"] || keysPressed.current["ArrowDown"] ? 1 : 0);

    const newX = THREE.MathUtils.clamp(jetPos.x + moveX * speed * delta, -20, 20);
    const newY = THREE.MathUtils.clamp(jetPos.y + moveY * speed * delta, -8, 12);
    const targetPos = new THREE.Vector3(newX, newY, 0);

    setJetPos(targetPos);
    setJetRot(new THREE.Euler(-moveY * 0.35, 0, -moveX * 0.5));

    // Dual Vulcan Cannon Firing
    if (keysPressed.current["KeyJ"] || keysPressed.current["KeyC"]) {
      audio.playVulcan();
      const leftBullet: Bullet = {
        id: "b_" + Math.random(),
        position: targetPos.clone().add(new THREE.Vector3(-0.8, -0.1, -1)),
        velocity: new THREE.Vector3(0, 0, -80),
        isEnemy: false
      };
      const rightBullet: Bullet = {
        id: "b_" + Math.random(),
        position: targetPos.clone().add(new THREE.Vector3(0.8, -0.1, -1)),
        velocity: new THREE.Vector3(0, 0, -80),
        isEnemy: false
      };
      setBullets((prev) => [...prev, leftBullet, rightBullet]);
    }

    // Update Bullets
    setBullets((prev) =>
      prev
        .map((b) => ({
          ...b,
          position: b.position.clone().add(b.velocity.clone().multiplyScalar(delta))
        }))
        .filter((b) => Math.abs(b.position.z) < 120)
    );

    // Update Enemies & Target Lock
    setEnemies((prevEnemies) => {
      let closestDist = Infinity;
      let closestId: string | null = null;

      const updated = prevEnemies.map((enemy) => {
        const dist = enemy.position.distanceTo(targetPos);
        if (enemy.position.z < 10 && dist < closestDist) {
          closestDist = dist;
          closestId = enemy.id;
        }

        // Enemy movement
        const newPos = enemy.position.clone().add(enemy.velocity.clone().multiplyScalar(delta));
        if (newPos.z > 15) {
          newPos.z = -80;
        }

        return {
          ...enemy,
          position: newPos,
          isTargeted: enemy.id === closestId
        };
      });

      targetEnemyIdRef.current = closestId;
      return updated;
    });

    // Update Heat-seeking Missiles
    setMissiles((prevMissiles) =>
      prevMissiles
        .map((missile) => {
          let vel = missile.velocity.clone();
          const target = enemies.find((e) => e.id === missile.targetId);

          if (target) {
            const dir = target.position.clone().sub(missile.position).normalize();
            vel.lerp(dir.multiplyScalar(55), 0.15);
          }

          const newPos = missile.position.clone().add(vel.clone().multiplyScalar(delta));
          return {
            ...missile,
            position: newPos,
            velocity: vel,
            lifetime: missile.lifetime - delta
          };
        })
        .filter((m) => m.lifetime > 0)
    );

    // Collision Detection: Bullets vs Enemies
    setBullets((prevBullets) => {
      const remainingBullets: Bullet[] = [];

      prevBullets.forEach((bullet) => {
        let bulletHit = false;

        if (!bullet.isEnemy) {
          setEnemies((prevEnemies) =>
            prevEnemies
              .map((enemy) => {
                if (bulletHit) return enemy;
                if (bullet.position.distanceTo(enemy.position) < 1.6) {
                  bulletHit = true;
                  const newHealth = enemy.health - 12;

                  if (newHealth <= 0) {
                    audio.playExplosion();
                    setScore((s: number) => s + (enemy.type === "bomber" ? 250 : 100));
                    setCombo((c: number) => c + 1);

                    // Chance to drop powerup
                    if (Math.random() < 0.35) {
                      setPowerups((p) => [
                        ...p,
                        {
                          id: "pow_" + Math.random(),
                          position: enemy.position.clone(),
                          type: Math.random() < 0.5 ? "shield" : "nuke"
                        }
                      ]);
                    }
                  }
                  return { ...enemy, health: newHealth };
                }
                return enemy;
              })
              .filter((e) => e.health > 0)
          );
        }

        if (!bulletHit) remainingBullets.push(bullet);
      });

      return remainingBullets;
    });

    // Collision Detection: Missiles vs Enemies
    setMissiles((prevMissiles) => {
      const remainingMissiles: Missile[] = [];

      prevMissiles.forEach((missile) => {
        let missileHit = false;

        setEnemies((prevEnemies) =>
          prevEnemies
            .map((enemy) => {
              if (missileHit) return enemy;
              if (missile.position.distanceTo(enemy.position) < 2.5) {
                missileHit = true;
                audio.playExplosion();

                setScore((s: number) => s + 350);
                setCombo((c: number) => c + 1);

                return { ...enemy, health: 0 };
              }
              return enemy;
            })
            .filter((e) => e.health > 0)
        );

        if (!missileHit) remainingMissiles.push(missile);
      });

      return remainingMissiles;
    });

    // Player vs Powerups Collision
    setPowerups((prevPowerups) =>
      prevPowerups.filter((pow) => {
        if (pow.position.distanceTo(targetPos) < 2.5) {
          audio.playPowerup();
          if (pow.type === "shield") {
            setShield((s: number) => Math.min(100, s + 35));
          } else if (pow.type === "nuke") {
            // Nuke all on-screen enemies
            setEnemies([]);
            setScore((s: number) => s + 800);
          }
          return false;
        }
        return pow.position.z < 10;
      })
    );
  });

  return (
    <group>
      <PerspectiveCamera makeDefault position={[0, 2.5, 7.5]} fov={60} />
      <EnvironmentWorld />

      <PlayerJet
        jetPos={jetPos}
        jetRot={jetRot}
        colorScheme={colorScheme}
        isBoosting={isBoosting}
        isOverdrive={isOverdrive}
      />

      {/* Render Enemies */}
      {enemies.map((enemy) => (
        <EnemyMesh key={enemy.id} enemy={enemy} />
      ))}

      {/* Render Bullets */}
      {bullets.map((b) => (
        <mesh key={b.id} position={b.position}>
          <boxGeometry args={[0.08, 0.08, 1.2]} />
          <meshBasicMaterial color="#38bdf8" />
        </mesh>
      ))}

      {/* Render Missiles */}
      {missiles.map((m) => (
        <mesh key={m.id} position={m.position}>
          <cylinderGeometry args={[0.1, 0.1, 0.8, 8]} />
          <meshBasicMaterial color="#f97316" />
        </mesh>
      ))}

      {/* Render Powerups */}
      {powerups.map((p) => (
        <Float key={p.id} position={p.position} speed={3} rotationIntensity={2}>
          <mesh>
            <octahedronGeometry args={[0.6, 0]} />
            <meshStandardMaterial color={p.type === "shield" ? "#3b82f6" : "#eab308"} emissive="#3b82f6" />
          </mesh>
        </Float>
      ))}

      {/* Flare / Explosion Particles */}
      {particles.map((pt) => (
        <mesh key={pt.id} position={pt.position}>
          <sphereGeometry args={[pt.size, 8, 8]} />
          <meshBasicMaterial color={pt.color} transparent opacity={0.8} />
        </mesh>
      ))}
    </group>
  );
}

// --- MAIN REACT GAME COMPONENT ---
export default function AeroPhantomGame() {
  const [gameState, setGameState] = useState<"menu" | "playing" | "paused" | "gameover">("menu");
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [health, setHealth] = useState(100);
  const [shield, setShield] = useState(100);
  const [missileAmmo, setMissileAmmo] = useState(12);
  const [flares, setFlares] = useState(5);
  const [combo, setCombo] = useState(1);
  const [muted, setMuted] = useState(false);
  const [colorScheme, setColorScheme] = useState<"cyan" | "crimson" | "cobalt" | "gold">("cyan");

  useEffect(() => {
    const saved = localStorage.getItem("aero_phantom_highscore");
    if (saved) setHighScore(parseInt(saved, 10));
  }, []);

  const handleStartGame = () => {
    setScore(0);
    setHealth(100);
    setShield(100);
    setMissileAmmo(12);
    setFlares(5);
    setCombo(1);
    setGameState("playing");
  };

  const toggleSound = () => {
    const next = !muted;
    setMuted(next);
    audio.muted = next;
  };

  return (
    <div className="relative w-full h-screen bg-slate-950 text-white overflow-hidden select-none font-sans">
      {/* 3D Canvas Viewport */}
      <div className="absolute inset-0 z-0">
        <Canvas>
          <GameScene
            gameState={gameState}
            setGameState={setGameState}
            score={score}
            setScore={setScore}
            health={health}
            setHealth={setHealth}
            shield={shield}
            setShield={setShield}
            missileAmmo={missileAmmo}
            setMissileAmmo={setMissileAmmo}
            flares={flares}
            setFlares={setFlares}
            colorScheme={colorScheme}
            combo={combo}
            setCombo={setCombo}
          />
        </Canvas>
      </div>

      {/* TOP NAVIGATION / HUD HEADER */}
      <div className="absolute top-4 left-4 right-4 z-20 flex justify-between items-center pointer-events-none">
        <div className="flex items-center gap-3 bg-slate-900/80 backdrop-blur-md border border-cyan-500/30 px-4 py-2 rounded-xl pointer-events-auto">
          <Link href="/games" className="text-slate-400 hover:text-cyan-400 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="flex items-center gap-2">
            <Rocket className="w-5 h-5 text-cyan-400 animate-pulse" />
            <span className="font-extrabold tracking-wider text-cyan-400 text-lg uppercase">Aero Phantom 3D</span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="bg-slate-900/80 backdrop-blur-md border border-cyan-500/30 px-4 py-2 rounded-xl flex items-center gap-3">
            <Trophy className="w-4 h-4 text-amber-400" />
            <span className="text-sm font-semibold text-slate-300">HIGH: {highScore}</span>
          </div>
          <button
            onClick={toggleSound}
            className="p-2.5 bg-slate-900/80 backdrop-blur-md border border-cyan-500/30 rounded-xl hover:border-cyan-400 transition-all pointer-events-auto text-cyan-400"
          >
            {muted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* PLAYING HUD OVERLAY */}
      {gameState === "playing" && (
        <div className="absolute inset-0 z-10 pointer-events-none flex flex-col justify-between p-6">
          {/* Top Stats */}
          <div className="flex justify-between items-start mt-14">
            {/* Health & Shield Gauge */}
            <div className="bg-slate-900/80 backdrop-blur-md border border-cyan-500/30 p-4 rounded-2xl w-64 space-y-2">
              <div className="flex justify-between text-xs font-bold text-cyan-400 uppercase">
                <span className="flex items-center gap-1">
                  <Shield className="w-3.5 h-3.5" /> Energy Shield
                </span>
                <span>{shield}%</span>
              </div>
              <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden">
                <div
                  className="bg-gradient-to-r from-blue-500 to-cyan-400 h-full transition-all duration-300"
                  style={{ width: `${shield}%` }}
                />
              </div>

              <div className="flex justify-between text-xs font-bold text-emerald-400 uppercase pt-1">
                <span className="flex items-center gap-1">
                  <Flame className="w-3.5 h-3.5" /> Jet Hull
                </span>
                <span>{health}%</span>
              </div>
              <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden">
                <div
                  className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full transition-all duration-300"
                  style={{ width: `${health}%` }}
                />
              </div>
            </div>

            {/* Score & Combo */}
            <div className="text-right bg-slate-900/80 backdrop-blur-md border border-cyan-500/30 px-6 py-3 rounded-2xl">
              <div className="text-xs text-slate-400 font-semibold uppercase tracking-widest">Tactical Score</div>
              <div className="text-3xl font-black text-cyan-400 tracking-wider">{score}</div>
              {combo > 1 && (
                <div className="text-xs font-bold text-amber-400 mt-0.5 animate-bounce">COMBO {combo}x</div>
              )}
            </div>
          </div>

          {/* Central Tactical Reticle HUD */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="relative w-48 h-48 border border-cyan-500/20 rounded-full flex items-center justify-center">
              <Crosshair className="w-12 h-12 text-cyan-400/60" />
              <div className="absolute w-2 h-2 bg-cyan-400 rounded-full animate-ping" />
            </div>
          </div>

          {/* Bottom Weapon Systems Bar */}
          <div className="flex justify-between items-end">
            {/* Ordnance / Ammo */}
            <div className="flex gap-4">
              <div className="bg-slate-900/80 backdrop-blur-md border border-cyan-500/30 px-5 py-3 rounded-2xl flex items-center gap-3">
                <Target className="w-6 h-6 text-red-400" />
                <div>
                  <div className="text-[10px] text-slate-400 uppercase font-bold">Seeker Missiles</div>
                  <div className="text-lg font-extrabold text-white">{missileAmmo} / 12</div>
                </div>
              </div>

              <div className="bg-slate-900/80 backdrop-blur-md border border-cyan-500/30 px-5 py-3 rounded-2xl flex items-center gap-3">
                <Wind className="w-6 h-6 text-amber-400" />
                <div>
                  <div className="text-[10px] text-slate-400 uppercase font-bold">Flares Counter</div>
                  <div className="text-lg font-extrabold text-white">{flares} / 5</div>
                </div>
              </div>
            </div>

            {/* Controls Guide */}
            <div className="bg-slate-900/80 backdrop-blur-md border border-cyan-500/30 px-5 py-3 rounded-2xl text-xs text-slate-400 space-y-1">
              <div>
                <span className="text-cyan-400 font-bold">WASD / ARROWS</span> : Pitch & Yaw
              </div>
              <div>
                <span className="text-cyan-400 font-bold">J / C</span> : Fire Vulcan Cannon
              </div>
              <div>
                <span className="text-cyan-400 font-bold">SPACE / F</span> : Launch Seeker Missile
              </div>
              <div>
                <span className="text-cyan-400 font-bold">E</span> : Deploy Flare Countermeasures
              </div>
            </div>
          </div>
        </div>
      )}

      {/* START / MAIN MENU MODAL */}
      {gameState === "menu" && (
        <div className="absolute inset-0 z-30 flex items-center justify-center bg-slate-950/85 backdrop-blur-lg p-6">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="max-w-lg w-full bg-slate-900/90 border border-cyan-500/30 p-8 rounded-3xl shadow-2xl shadow-cyan-950/50 text-center space-y-6"
          >
            <div className="inline-flex p-4 bg-cyan-500/10 border border-cyan-500/30 rounded-2xl text-cyan-400">
              <Rocket className="w-12 h-12" />
            </div>

            <div>
              <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-sky-300 to-blue-500 tracking-wider">
                AERO PHANTOM 3D
              </h1>
              <p className="text-slate-400 text-sm mt-2">
                Apex supersonic jet combat simulator. Intercept enemy stealth squadrons and conquer the canyon skies.
              </p>
            </div>

            {/* Skin Customizer Selection */}
            <div className="space-y-2 text-left">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Select Jet Livery</label>
              <div className="grid grid-cols-4 gap-2">
                {[
                  { id: "cyan", name: "Cyan Ghost", color: "bg-cyan-500" },
                  { id: "crimson", name: "Crimson", color: "bg-red-500" },
                  { id: "cobalt", name: "Cobalt", color: "bg-blue-500" },
                  { id: "gold", name: "Golden", color: "bg-amber-500" }
                ].map((skin) => (
                  <button
                    key={skin.id}
                    onClick={() => setColorScheme(skin.id as any)}
                    className={`p-3 rounded-xl border flex flex-col items-center gap-1 transition-all ${
                      colorScheme === skin.id
                        ? "border-cyan-400 bg-cyan-500/20 text-white"
                        : "border-slate-800 bg-slate-950/50 text-slate-400 hover:border-slate-700"
                    }`}
                  >
                    <div className={`w-4 h-4 rounded-full ${skin.color}`} />
                    <span className="text-[10px] font-bold uppercase">{skin.name}</span>
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={handleStartGame}
              className="w-full py-4 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-black rounded-2xl tracking-wider text-lg shadow-lg shadow-cyan-500/25 transition-all flex items-center justify-center gap-2"
            >
              <Play className="w-6 h-6 fill-current" /> LAUNCH SORTIE
            </button>
          </motion.div>
        </div>
      )}

      {/* GAME OVER MODAL */}
      {gameState === "gameover" && (
        <div className="absolute inset-0 z-30 flex items-center justify-center bg-slate-950/90 backdrop-blur-lg p-6">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="max-w-md w-full bg-slate-900/90 border border-red-500/30 p-8 rounded-3xl text-center space-y-6"
          >
            <div className="inline-flex p-4 bg-red-500/10 border border-red-500/30 rounded-2xl text-red-400">
              <ShieldAlert className="w-12 h-12" />
            </div>

            <div>
              <h2 className="text-3xl font-black text-red-500">SORTIE TERMINATED</h2>
              <p className="text-slate-400 text-sm mt-1">Your jet was shot down over the canyon sector.</p>
            </div>

            <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800 space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Final Score:</span>
                <span className="font-bold text-cyan-400">{score}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">High Score:</span>
                <span className="font-bold text-amber-400">{highScore}</span>
              </div>
            </div>

            <button
              onClick={handleStartGame}
              className="w-full py-4 bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-400 hover:to-rose-500 text-white font-black rounded-2xl tracking-wider text-lg transition-all flex items-center justify-center gap-2"
            >
              <RotateCcw className="w-5 h-5" /> RE-ENTER SORTIE
            </button>
          </motion.div>
        </div>
      )}
    </div>
  );
}
