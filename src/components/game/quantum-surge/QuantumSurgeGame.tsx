"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Float, Sparkles, PerspectiveCamera } from "@react-three/drei";
import * as THREE from "three";
import { motion, AnimatePresence } from "framer-motion";
import { Trophy, Zap, Shield, Play, RotateCcw, ArrowLeft, Volume2, VolumeX, Flame } from "lucide-react";
import Link from "next/link";

// --- SYNTH AUDIO GENERATOR (Web Audio API) ---
class SoundManager {
  ctx: AudioContext | null = null;
  muted: boolean = false;

  constructor() {
    // Lazy init on first user interaction
  }

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

  playCollect() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(587.33, this.ctx.currentTime); // D5
    osc.frequency.exponentialRampToValueAtTime(1174.66, this.ctx.currentTime + 0.15); // D6

    gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.15);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.15);
  }

  playHit() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(150, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(30, this.ctx.currentTime + 0.3);

    gain.gain.setValueAtTime(0.4, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.3);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.3);
  }

  playBoost() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = "triangle";
    osc.frequency.setValueAtTime(200, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(800, this.ctx.currentTime + 0.4);

    gain.gain.setValueAtTime(0.3, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.4);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.4);
  }
}

const sounds = new SoundManager();

// --- 3D SCENE COMPONENTS ---

// Player Starfighter Component
function PlayerShip({ positionX, roll }: { positionX: number; roll: number }) {
  const meshRef = useRef<THREE.Group>(null);

  useFrame((_, delta) => {
    if (meshRef.current) {
      // Smooth interpolation for position & banking roll
      meshRef.current.position.x = THREE.MathUtils.lerp(meshRef.current.position.x, positionX, delta * 12);
      meshRef.current.rotation.z = THREE.MathUtils.lerp(meshRef.current.rotation.z, -roll * 0.4, delta * 10);
      meshRef.current.rotation.y = THREE.MathUtils.lerp(meshRef.current.rotation.y, roll * 0.2, delta * 10);
    }
  });

  return (
    <group ref={meshRef} position={[0, -1, 3]}>
      {/* Ship Body Nose */}
      <mesh position={[0, 0, -0.6]} rotation={[Math.PI / 2, 0, 0]}>
        <coneGeometry args={[0.35, 1.4, 4]} />
        <meshStandardMaterial color="#00f0ff" roughness={0.1} metalness={0.9} emissive="#0088ff" emissiveIntensity={0.5} />
      </mesh>

      {/* Cockpit Canopy */}
      <mesh position={[0, 0.15, -0.2]}>
        <boxGeometry args={[0.3, 0.2, 0.6]} />
        <meshStandardMaterial color="#ff00ff" roughness={0.0} metalness={1.0} emissive="#ff00aa" emissiveIntensity={0.8} />
      </mesh>

      {/* Main Wings */}
      <mesh position={[0, 0, 0.2]} rotation={[0, 0, 0]}>
        <boxGeometry args={[2.2, 0.08, 0.6]} />
        <meshStandardMaterial color="#0f172a" roughness={0.2} metalness={0.8} />
      </mesh>

      {/* Wingtip Energy Needles */}
      <mesh position={[-1.15, 0, -0.1]}>
        <boxGeometry args={[0.06, 0.12, 0.8]} />
        <meshStandardMaterial color="#00f0ff" emissive="#00ffff" emissiveIntensity={2.0} />
      </mesh>
      <mesh position={[1.15, 0, -0.1]}>
        <boxGeometry args={[0.06, 0.12, 0.8]} />
        <meshStandardMaterial color="#00f0ff" emissive="#00ffff" emissiveIntensity={2.0} />
      </mesh>

      {/* Thruster Glows */}
      <pointLight position={[-0.4, 0, 0.6]} color="#ff00aa" intensity={3} distance={2} />
      <pointLight position={[0.4, 0, 0.6]} color="#ff00aa" intensity={3} distance={2} />
      <mesh position={[-0.4, 0, 0.5]}>
        <sphereGeometry args={[0.12, 16, 16]} />
        <meshBasicMaterial color="#ff00aa" />
      </mesh>
      <mesh position={[0.4, 0, 0.5]}>
        <sphereGeometry args={[0.12, 16, 16]} />
        <meshBasicMaterial color="#ff00aa" />
      </mesh>
    </group>
  );
}

// 3D Moving Highway Grid & Tunnel Rings
function TunnelHighway({ speed }: { speed: number }) {
  const gridRef = useRef<THREE.Mesh>(null);
  const ringGroupRef = useRef<THREE.Group>(null);

  useFrame((_, delta) => {
    if (gridRef.current) {
      gridRef.current.position.z += delta * speed;
      if (gridRef.current.position.z > 10) {
        gridRef.current.position.z -= 10;
      }
    }
    if (ringGroupRef.current) {
      ringGroupRef.current.children.forEach((ring, i) => {
        ring.position.z += delta * speed;
        ring.rotation.z += delta * 0.2 * (i % 2 === 0 ? 1 : -1);
        if (ring.position.z > 5) {
          ring.position.z -= 60;
        }
      });
    }
  });

  const rings = useMemo(() => {
    return Array.from({ length: 12 }).map((_, i) => ({
      z: -i * 5,
      id: i,
    }));
  }, []);

  return (
    <group>
      {/* Ground Floor Grid */}
      <mesh ref={gridRef} position={[0, -2, -20]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[24, 80, 24, 80]} />
        <meshStandardMaterial color="#050515" wireframe emissive="#00f0ff" emissiveIntensity={0.3} />
      </mesh>

      {/* Cyber Tunnel Rings */}
      <group ref={ringGroupRef}>
        {rings.map((r) => (
          <mesh key={r.id} position={[0, 0, r.z]}>
            <torusGeometry args={[5.5, 0.05, 8, 32]} />
            <meshStandardMaterial color={r.id % 2 === 0 ? "#ff00aa" : "#00f0ff"} emissive={r.id % 2 === 0 ? "#ff00aa" : "#00f0ff"} emissiveIntensity={1.5} />
          </mesh>
        ))}
      </group>
    </group>
  );
}

// Obstacle & Item Entities
interface Entity {
  id: number;
  x: number;
  z: number;
  type: "barrier" | "ring" | "orb" | "shield";
}

function GameEntities({
  entities,
  speed,
}: {
  entities: Entity[];
  speed: number;
}) {
  return (
    <group>
      {entities.map((item) => (
        <group key={item.id} position={[item.x, item.type === "barrier" ? -1 : 0, item.z]}>
          {item.type === "barrier" && (
            <mesh>
              <boxGeometry args={[1.5, 1.5, 0.4]} />
              <meshStandardMaterial color="#ff0055" emissive="#ff0033" emissiveIntensity={2.5} wireframe />
            </mesh>
          )}

          {item.type === "ring" && (
            <mesh rotation={[0, 0, Math.PI / 4]}>
              <octahedronGeometry args={[0.7, 0]} />
              <meshStandardMaterial color="#00ffcc" emissive="#00ffaa" emissiveIntensity={3.0} />
            </mesh>
          )}

          {item.type === "orb" && (
            <Float speed={5} rotationIntensity={2} floatIntensity={1}>
              <mesh>
                <sphereGeometry args={[0.4, 16, 16]} />
                <meshStandardMaterial color="#ffd700" emissive="#ffaa00" emissiveIntensity={3.0} />
              </mesh>
            </Float>
          )}

          {item.type === "shield" && (
            <Float speed={4} rotationIntensity={1.5} floatIntensity={1}>
              <mesh>
                <icosahedronGeometry args={[0.45, 0]} />
                <meshStandardMaterial color="#0099ff" emissive="#0066ff" emissiveIntensity={3.0} wireframe />
              </mesh>
            </Float>
          )}
        </group>
      ))}
    </group>
  );
}

// --- MAIN GAME COMPONENT ---
export default function QuantumSurgeGame() {
  const [gameState, setGameState] = useState<"menu" | "playing" | "gameover">("menu");
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [multiplier, setMultiplier] = useState(1);
  const [shield, setShield] = useState(3);
  const [speed, setSpeed] = useState(25);
  const [playerX, setPlayerX] = useState(0);
  const [roll, setRoll] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [boostActive, setBoostActive] = useState(false);

  // Entities state
  const [entities, setEntities] = useState<Entity[]>([]);
  const requestRef = useRef<number | null>(null);
  const lastSpawnRef = useRef<number>(0);
  const playerXRef = useRef(0);
  const speedRef = useRef(25);
  const shieldRef = useRef(3);
  const scoreRef = useRef(0);
  const gameStateRef = useRef<"menu" | "playing" | "gameover">("menu");

  // Keep refs in sync
  playerXRef.current = playerX;
  speedRef.current = speed;
  shieldRef.current = shield;
  scoreRef.current = score;
  gameStateRef.current = gameState;

  // Load High Score
  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("xakteir_quantumsurge_highscore");
      if (saved) setHighScore(parseInt(saved, 10));
    }
  }, []);

  // Handle Controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (gameStateRef.current !== "playing") return;
      if (e.key === "ArrowLeft" || e.key === "a" || e.key === "A") {
        setPlayerX((prev) => Math.max(-3.5, prev - 0.75));
        setRoll(-1);
      } else if (e.key === "ArrowRight" || e.key === "d" || e.key === "D") {
        setPlayerX((prev) => Math.min(3.5, prev + 0.75));
        setRoll(1);
      } else if (e.key === " ") {
        triggerBoost();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft" || e.key === "a" || e.key === "A" || e.key === "ArrowRight" || e.key === "d" || e.key === "D") {
        setRoll(0);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, []);

  // Trigger Hyper Boost
  const triggerBoost = () => {
    if (boostActive) return;
    setBoostActive(true);
    setSpeed((s) => s + 20);
    sounds.playBoost();

    setTimeout(() => {
      setBoostActive(false);
      setSpeed((s) => Math.max(25, s - 20));
    }, 4000);
  };

  // Main Game Loop
  useEffect(() => {
    if (gameState !== "playing") return;

    let lastTime = performance.now();

    const updateGame = (time: number) => {
      const delta = (time - lastTime) / 1000;
      lastTime = time;

      // Increase speed gradually
      setSpeed((prevSpeed) => Math.min(65, prevSpeed + delta * 0.5));

      // Increase Score
      setScore((prev) => {
        const next = prev + Math.floor(delta * 100 * (boostActive ? 3 : 1));
        return next;
      });

      // Spawn entities
      if (time - lastSpawnRef.current > Math.max(400, 1200 - speedRef.current * 15)) {
        lastSpawnRef.current = time;
        const types: Entity["type"][] = ["barrier", "barrier", "ring", "orb", "shield"];
        const chosenType = types[Math.floor(Math.random() * types.length)];
        const lanes = [-3, -1.5, 0, 1.5, 3];
        const randomX = lanes[Math.floor(Math.random() * lanes.length)];

        setEntities((prev) => [
          ...prev,
          {
            id: Date.now() + Math.random(),
            x: randomX,
            z: -50,
            type: chosenType,
          },
        ]);
      }

      // Move entities & detect collisions
      setEntities((prevEntities) => {
        const currentPx = playerXRef.current;
        const updated: Entity[] = [];

        for (const item of prevEntities) {
          const newZ = item.z + delta * speedRef.current;

          // Check collision with player at z = 3
          if (Math.abs(newZ - 3) < 0.8 && Math.abs(item.x - currentPx) < 1.0) {
            if (item.type === "barrier") {
              if (!boostActive) {
                sounds.playHit();
                const newShield = shieldRef.current - 1;
                setShield(newShield);
                if (newShield <= 0) {
                  endGame();
                  return prevEntities;
                }
              }
            } else if (item.type === "ring" || item.type === "orb") {
              sounds.playCollect();
              setScore((s) => s + 500);
              setMultiplier((m) => Math.min(8, m + 1));
            } else if (item.type === "shield") {
              sounds.playCollect();
              setShield((s) => Math.min(5, s + 1));
            }
            continue; // Item collected/hit -> remove
          }

          if (newZ < 10) {
            updated.push({ ...item, z: newZ });
          }
        }

        return updated;
      });

      if (gameStateRef.current === "playing") {
        requestRef.current = requestAnimationFrame(updateGame);
      }
    };

    requestRef.current = requestAnimationFrame(updateGame);
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [gameState, boostActive]);

  // Start Game
  const startGame = () => {
    sounds.init();
    setScore(0);
    setShield(3);
    setSpeed(25);
    setPlayerX(0);
    setEntities([]);
    setGameState("playing");
  };

  // End Game
  const endGame = () => {
    setGameState("gameover");
    const finalScore = scoreRef.current;

    if (finalScore > highScore) {
      setHighScore(finalScore);
      if (typeof window !== "undefined") {
        localStorage.setItem("xakteir_quantumsurge_highscore", finalScore.toString());
      }
    }

    // Dispatch global event for leaderboards
    if (typeof window !== "undefined") {
      const event = new CustomEvent("xakteir-game-score", {
        detail: { score: finalScore, points: Math.floor(finalScore / 100) },
      });
      window.dispatchEvent(event);
    }
  };

  return (
    <div className="w-full h-screen bg-black text-white font-sans overflow-hidden relative select-none">
      {/* 3D RENDER CANVAS */}
      <div className="absolute inset-0 z-0">
        <Canvas>
          <PerspectiveCamera makeDefault position={[0, 1, 7]} fov={75} />
          <ambientLight intensity={0.4} />
          <pointLight position={[0, 10, -10]} intensity={4} color="#00ffff" />
          <directionalLight position={[5, 10, 5]} intensity={1.5} color="#ff00aa" />

          <TunnelHighway speed={speed} />
          {gameState === "playing" && <PlayerShip positionX={playerX} roll={roll} />}
          <GameEntities entities={entities} speed={speed} />

          <Sparkles count={120} scale={[20, 20, 50]} size={3} speed={speed * 0.05} color="#00f0ff" />
        </Canvas>
      </div>

      {/* TOP NAVIGATION HUD */}
      <header className="absolute top-0 left-0 right-0 z-20 p-6 flex justify-between items-center bg-gradient-to-b from-black/80 to-transparent pointer-events-auto">
        <Link href="/games">
          <button className="flex items-center gap-2 bg-white/10 backdrop-blur-md border border-white/15 px-4 py-2 rounded-full font-bold hover:bg-white hover:text-black transition-all">
            <ArrowLeft className="w-4 h-4" /> Exit
          </button>
        </Link>

        <div className="text-center">
          <h1 className="text-xl font-black italic tracking-widest uppercase bg-gradient-to-r from-cyan-400 via-fuchsia-500 to-pink-500 bg-clip-text text-transparent">
            Quantum Surge 3D
          </h1>
          <p className="text-[10px] font-bold text-cyan-400/80 tracking-widest uppercase">Apex Cyber Velocity Engine</p>
        </div>

        <button
          onClick={() => {
            sounds.muted = !isMuted;
            setIsMuted(!isMuted);
          }}
          className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-md border border-white/15 flex items-center justify-center hover:bg-white/20 transition-all"
        >
          {isMuted ? <VolumeX className="w-5 h-5 text-rose-400" /> : <Volume2 className="w-5 h-5 text-cyan-400" />}
        </button>
      </header>

      {/* PLAYING HUD OVERLAY */}
      {gameState === "playing" && (
        <div className="absolute inset-0 z-10 pointer-events-none p-8 flex flex-col justify-between">
          {/* Top Stats */}
          <div className="flex justify-between items-start mt-16">
            <div className="bg-black/40 backdrop-blur-md border border-cyan-500/30 p-4 rounded-2xl">
              <span className="text-xs font-bold text-cyan-400 uppercase tracking-widest block">SCORE</span>
              <span className="text-3xl font-black tabular-nums tracking-wider">{score.toLocaleString()}</span>
            </div>

            <div className="flex gap-4">
              <div className="bg-black/40 backdrop-blur-md border border-fuchsia-500/30 p-4 rounded-2xl text-right">
                <span className="text-xs font-bold text-fuchsia-400 uppercase tracking-widest block">SPEED</span>
                <span className="text-2xl font-black italic">{Math.floor(speed * 3.6)} KM/H</span>
              </div>
              <div className="bg-black/40 backdrop-blur-md border border-amber-500/30 p-4 rounded-2xl text-right">
                <span className="text-xs font-bold text-amber-400 uppercase tracking-widest block">SHIELD</span>
                <div className="flex gap-1.5 mt-1">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Shield
                      key={i}
                      className={`w-5 h-5 ${i < shield ? "text-amber-400 fill-amber-400" : "text-white/20"}`}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Mobile Controls / Boost */}
          <div className="flex justify-between items-end mb-4 pointer-events-auto">
            {/* Left/Right Mobile Touch Pads */}
            <div className="flex gap-3 md:hidden">
              <button
                onTouchStart={() => {
                  setPlayerX((prev) => Math.max(-3.5, prev - 0.75));
                  setRoll(-1);
                }}
                onTouchEnd={() => setRoll(0)}
                className="w-16 h-16 rounded-2xl bg-cyan-500/20 active:bg-cyan-500/50 border border-cyan-400/40 text-cyan-300 font-bold text-2xl flex items-center justify-center backdrop-blur-md"
              >
                ◀
              </button>
              <button
                onTouchStart={() => {
                  setPlayerX((prev) => Math.min(3.5, prev + 0.75));
                  setRoll(1);
                }}
                onTouchEnd={() => setRoll(0)}
                className="w-16 h-16 rounded-2xl bg-cyan-500/20 active:bg-cyan-500/50 border border-cyan-400/40 text-cyan-300 font-bold text-2xl flex items-center justify-center backdrop-blur-md"
              >
                ▶
              </button>
            </div>

            {/* Hyper Boost Button */}
            <button
              onClick={triggerBoost}
              disabled={boostActive}
              className={`px-6 py-4 rounded-2xl font-black text-sm uppercase tracking-widest flex items-center gap-2 backdrop-blur-md border transition-all ${
                boostActive
                  ? "bg-fuchsia-600/80 border-fuchsia-400 text-white animate-pulse"
                  : "bg-fuchsia-500/20 hover:bg-fuchsia-500/40 border-fuchsia-500/40 text-fuchsia-300"
              }`}
            >
              <Flame className="w-5 h-5" />
              {boostActive ? "HYPER BOOST ACTIVE!" : "TRIGGER BOOST (SPACE)"}
            </button>
          </div>
        </div>
      )}

      {/* START MENU OVERLAY */}
      {gameState === "menu" && (
        <div className="absolute inset-0 z-30 bg-black/70 backdrop-blur-lg flex items-center justify-center p-6">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-lg bg-zinc-950/90 border border-cyan-500/40 p-8 rounded-3xl text-center shadow-[0_0_50px_rgba(0,240,255,0.2)]"
          >
            <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-tr from-cyan-500 to-fuchsia-600 flex items-center justify-center shadow-lg shadow-cyan-500/30">
              <Zap className="w-10 h-10 text-white animate-pulse" />
            </div>

            <h2 className="text-4xl font-black italic tracking-wider uppercase mb-2 bg-gradient-to-r from-cyan-400 to-fuchsia-500 bg-clip-text text-transparent">
              Quantum Surge 3D
            </h2>
            <p className="text-zinc-400 text-sm mb-6 font-medium">
              Navigate the infinite cyber highway, dodge red quantum barriers, collect golden energy cores, and unleash hyper boosts!
            </p>

            {highScore > 0 && (
              <div className="bg-white/5 border border-white/10 p-3 rounded-xl mb-6 inline-flex items-center gap-2">
                <Trophy className="w-4 h-4 text-amber-400" />
                <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">High Score:</span>
                <span className="text-sm font-black text-amber-400">{highScore.toLocaleString()}</span>
              </div>
            )}

            <button
              onClick={startGame}
              className="w-full py-4 bg-gradient-to-r from-cyan-500 to-fuchsia-600 hover:from-cyan-400 hover:to-fuchsia-500 text-black font-black text-lg rounded-2xl tracking-widest uppercase shadow-xl hover:scale-[1.02] transition-all flex items-center justify-center gap-3"
            >
              <Play className="w-6 h-6 fill-current" /> LAUNCH MISSION
            </button>
          </motion.div>
        </div>
      )}

      {/* GAME OVER OVERLAY */}
      {gameState === "gameover" && (
        <div className="absolute inset-0 z-30 bg-black/85 backdrop-blur-xl flex items-center justify-center p-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-lg bg-zinc-950/90 border border-rose-500/40 p-8 rounded-3xl text-center shadow-[0_0_60px_rgba(244,63,94,0.3)]"
          >
            <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center">
              <Trophy className="w-10 h-10 text-rose-400" />
            </div>

            <h2 className="text-4xl font-black italic tracking-wider uppercase mb-2 text-rose-500">
              MISSION TERMINATED
            </h2>
            <p className="text-zinc-400 text-xs uppercase tracking-widest mb-6 font-bold">
              Starfighter Shield Depleted
            </p>

            <div className="bg-white/5 border border-white/10 p-6 rounded-2xl mb-8 space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-zinc-400 font-bold uppercase">Final Score</span>
                <span className="text-2xl font-black text-white">{score.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm border-t border-white/10 pt-3">
                <span className="text-zinc-400 font-bold uppercase">Best Score</span>
                <span className="text-lg font-black text-amber-400">{highScore.toLocaleString()}</span>
              </div>
            </div>

            <div className="flex gap-4">
              <button
                onClick={startGame}
                className="flex-1 py-4 bg-white text-black hover:bg-zinc-200 font-black text-base rounded-2xl tracking-widest uppercase transition-all flex items-center justify-center gap-2"
              >
                <RotateCcw className="w-5 h-5" /> TRY AGAIN
              </button>
              <Link href="/games" className="flex-1">
                <button className="w-full py-4 bg-white/10 hover:bg-white/20 text-white font-black text-base rounded-2xl tracking-widest uppercase border border-white/15 transition-all">
                  LIBRARY
                </button>
              </Link>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
