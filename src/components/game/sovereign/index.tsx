"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Globe,
  Zap,
  Shield,
  Volume2,
  VolumeX,
  Play,
  Pause,
  RotateCcw,
  Sparkles,
  Users,
  User,
  Trophy,
  ArrowLeft,
  Activity,
  Radio,
  Clock,
  Compass,
  Rocket,
  Flame,
  X
} from "lucide-react";
import Link from "next/link";
import { useUser, useFirestore, setDocumentNonBlocking } from "@/firebase";
import { doc, increment } from "firebase/firestore";

// ==========================================
// SOVEREIGN RTS TYPES
// ==========================================

export type SovereignMode = "galaxy_conquest" | "local_fleet_clash";

export interface PlanetNode {
  id: string;
  name: string;
  x: number;
  y: number;
  radius: number;
  owner: "neutral" | "p1" | "p2";
  ships: number;
  maxShips: number;
  color: string;
}

export interface ShipSquadron {
  id: string;
  owner: "p1" | "p2";
  sourceId: string;
  targetId: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  count: number;
  color: string;
}

// ==========================================
// WEB AUDIO SYNTHESIZER
// ==========================================

class SovereignAudioSynth {
  ctx: AudioContext | null = null;
  muted: boolean = false;

  init() {
    if (!this.ctx && typeof window !== "undefined") {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) this.ctx = new AudioCtx();
    }
    if (this.ctx && this.ctx.state === "suspended") {
      this.ctx.resume();
    }
  }

  playLaunch() {
    if (this.muted || !this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(300, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(700, this.ctx.currentTime + 0.12);

      gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.12);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.12);
    } catch (e) {}
  }

  playCapture() {
    if (this.muted || !this.ctx) return;
    try {
      [440, 554.37, 659.25].forEach((freq, idx) => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();
        osc.type = "triangle";
        osc.frequency.setValueAtTime(freq, this.ctx!.currentTime + idx * 0.08);

        gain.gain.setValueAtTime(0.25, this.ctx!.currentTime + idx * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx!.currentTime + idx * 0.08 + 0.2);

        osc.connect(gain);
        gain.connect(this.ctx!.destination);
        osc.start(this.ctx!.currentTime + idx * 0.08);
        osc.stop(this.ctx!.currentTime + idx * 0.08 + 0.2);
      });
    } catch (e) {}
  }
  playDefenseShield() {
    if (this.muted || !this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(800, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(200, this.ctx.currentTime + 0.3);

      gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.3);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.3);
    } catch (e) {}
  }
}

const audio = new SovereignAudioSynth();

// ==========================================
// SOVEREIGN GAME COMPONENT
// ==========================================

export default function SovereignGame() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const { user } = useUser();
  const firestore = useFirestore();

  const [gameState, setGameState] = useState<"menu" | "playing" | "paused" | "game_over">("menu");
  const [mode, setMode] = useState<SovereignMode>("galaxy_conquest");
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Selected Node for Launch
  const [selectedPlanetId, setSelectedPlanetId] = useState<string | null>(null);
  const [winnerName, setWinnerName] = useState<string | null>(null);

  const engineRef = useRef({
    planets: [] as PlanetNode[],
    squadrons: [] as ShipSquadron[],
    particles: [] as any[],
    selectedPlanetId: null as string | null
  });

  const toggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    audio.muted = !next;
  };

  const dispatchScore = (finalScore: number) => {
    if (typeof window !== "undefined" && finalScore > 0) {
      const points = Math.floor(finalScore / 25) + 15;
      window.dispatchEvent(
        new CustomEvent("xakteir-game-score", {
          detail: { score: finalScore, points }
        })
      );
      if (user && firestore) {
        setDocumentNonBlocking(
          doc(firestore, "leaderboard", user.uid),
          {
            uid: user.uid,
            displayName: user.displayName || "Sovereign Commander",
            points: increment(points),
            updatedAt: new Date().toISOString()
          },
          { merge: true }
        );
      }
    }
  };

  const initMap = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const w = (canvas.width = canvas.parentElement?.clientWidth || window.innerWidth);
    const h = (canvas.height = canvas.parentElement?.clientHeight || window.innerHeight);

    const planets: PlanetNode[] = [
      { id: "p_home1", name: "Terra Sovereign", x: w * 0.15, y: h * 0.5, radius: 45, owner: "p1", ships: 30, maxShips: 100, color: "#06b6d4" },
      { id: "p_home2", name: "Dominion Prime", x: w * 0.85, y: h * 0.5, radius: 45, owner: "p2", ships: 30, maxShips: 100, color: "#f43f5e" },

      // Neutral Planets
      { id: "n1", name: "Aegis IV", x: w * 0.35, y: h * 0.25, radius: 35, owner: "neutral", ships: 10, maxShips: 60, color: "#64748b" },
      { id: "n2", name: "Vortex Node", x: w * 0.35, y: h * 0.75, radius: 35, owner: "neutral", ships: 10, maxShips: 60, color: "#64748b" },
      { id: "n3", name: "Helios Gate", x: w * 0.65, y: h * 0.25, radius: 35, owner: "neutral", ships: 10, maxShips: 60, color: "#64748b" },
      { id: "n4", name: "Titan Fortress", x: w * 0.65, y: h * 0.75, radius: 35, owner: "neutral", ships: 10, maxShips: 60, color: "#64748b" },
      { id: "n5", name: "Nexus Core", x: w * 0.5, y: h * 0.5, radius: 55, owner: "neutral", ships: 20, maxShips: 120, color: "#eab308" }
    ];

    engineRef.current.planets = planets;
    engineRef.current.squadrons = [];
    engineRef.current.particles = [];
    engineRef.current.selectedPlanetId = null;

    setSelectedPlanetId(null);
    setWinnerName(null);
  }, []);

  // Main 60FPS Game & Physics Loop
  useEffect(() => {
    let animId: number;

    const runLoop = () => {
      if (gameState === "playing") {
        updatePhysics();
      }
      renderCanvas();
      animId = requestAnimationFrame(runLoop);
    };

    const updatePhysics = () => {
      const engine = engineRef.current;

      // Planet Ship Generation (Every 60 frames)
      engine.planets.forEach(planet => {
        if (planet.owner !== "neutral" && planet.ships < planet.maxShips) {
          planet.ships += 0.05;
        }
      });

      // Update Squadrons Movement
      for (let sIdx = engine.squadrons.length - 1; sIdx >= 0; sIdx--) {
        const sq = engine.squadrons[sIdx];
        const target = engine.planets.find(p => p.id === sq.targetId);

        if (!target) {
          engine.squadrons.splice(sIdx, 1);
          continue;
        }

        const angle = Math.atan2(target.y - sq.y, target.x - sq.x);
        sq.x += Math.cos(angle) * 4.5;
        sq.y += Math.sin(angle) * 4.5;

        // Arrival Impact
        if (Math.hypot(target.x - sq.x, target.y - sq.y) < target.radius) {
          if (target.owner === sq.owner) {
            target.ships += sq.count;
          } else {
            target.ships -= sq.count;
            if (target.ships <= 0) {
              audio.playCapture();
              target.owner = sq.owner;
              target.color = sq.color;
              target.ships = Math.abs(target.ships);
            }
          }

          engine.squadrons.splice(sIdx, 1);

          // Check Victory Condition
          const p1Nodes = engine.planets.filter(p => p.owner === "p1");
          const p2Nodes = engine.planets.filter(p => p.owner === "p2");

          if (p1Nodes.length === engine.planets.length) {
            setWinnerName("Player 1 Armada");
            dispatchScore(2500);
            setGameState("game_over");
          } else if (p2Nodes.length === engine.planets.length) {
            setWinnerName("Player 2 Armada");
            setGameState("game_over");
          }
        }
      }

      // AI Conquest Logic in Single Player
      if (mode === "galaxy_conquest" && Math.random() < 0.015) {
        const p2Planets = engine.planets.filter(p => p.owner === "p2" && p.ships > 15);
        if (p2Planets.length > 0) {
          const source = p2Planets[Math.floor(Math.random() * p2Planets.length)];
          const targets = engine.planets.filter(p => p.id !== source.id);
          const target = targets[Math.floor(Math.random() * targets.length)];

          if (source && target) {
            const sendCount = Math.floor(source.ships / 2);
            source.ships -= sendCount;
            engine.squadrons.push({
              id: `sq_${Date.now()}`,
              owner: "p2",
              sourceId: source.id,
              targetId: target.id,
              x: source.x,
              y: source.y,
              vx: 0, vy: 0,
              count: sendCount,
              color: source.color
            });
          }
        }
      }
    };

    const renderCanvas = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      const w = canvas.width;
      const h = canvas.height;
      const engine = engineRef.current;

      ctx.fillStyle = "#030712";
      ctx.fillRect(0, 0, w, h);

      // Draw Squadrons
      engine.squadrons.forEach(sq => {
        ctx.save();
        ctx.shadowBlur = 15;
        ctx.shadowColor = sq.color;

        ctx.fillStyle = sq.color;
        ctx.beginPath();
        ctx.arc(sq.x, sq.y, 6, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 10px sans-serif";
        ctx.fillText(`${sq.count}`, sq.x + 8, sq.y + 3);

        ctx.restore();
      });

      // Draw Planet Nodes
      engine.planets.forEach(p => {
        ctx.save();
        ctx.shadowBlur = p.id === engineRef.current.selectedPlanetId ? 30 : 15;
        ctx.shadowColor = p.color;

        ctx.strokeStyle = p.color;
        ctx.lineWidth = p.id === engineRef.current.selectedPlanetId ? 4 : 2;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.stroke();

        ctx.fillStyle = `${p.color}25`;
        ctx.fill();

        // Planet Label & Ship Count
        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 14px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText(Math.floor(p.ships).toString(), p.x, p.y + 5);

        ctx.restore();
      });
    };

    animId = requestAnimationFrame(runLoop);
    return () => cancelAnimationFrame(animId);
  }, [gameState, mode]);

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    audio.init();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    const engine = engineRef.current;
    const clickedPlanet = engine.planets.find(p => Math.hypot(clickX - p.x, clickY - p.y) < p.radius);

    if (clickedPlanet) {
      if (engine.selectedPlanetId === null) {
        if (clickedPlanet.owner === "p1") {
          engine.selectedPlanetId = clickedPlanet.id;
          setSelectedPlanetId(clickedPlanet.id);
        }
      } else {
        const source = engine.planets.find(p => p.id === engine.selectedPlanetId);
        if (source && source.id !== clickedPlanet.id && source.ships > 1) {
          audio.playLaunch();
          const sendCount = Math.floor(source.ships / 2);
          source.ships -= sendCount;

          engine.squadrons.push({
            id: `sq_${Date.now()}`,
            owner: "p1",
            sourceId: source.id,
            targetId: clickedPlanet.id,
            x: source.x,
            y: source.y,
            vx: 0, vy: 0,
            count: sendCount,
            color: source.color
          });
        }
        engine.selectedPlanetId = null;
        setSelectedPlanetId(null);
      }
    } else {
      engine.selectedPlanetId = null;
      setSelectedPlanetId(null);
    }
  };

  const startGame = (selectedMode: SovereignMode) => {
    setMode(selectedMode);
    initMap();
    setGameState("playing");
  };

  return (
    <div className="w-full h-screen bg-[#030712] text-white relative overflow-hidden font-sans select-none">
      <canvas
        ref={canvasRef}
        onClick={handleCanvasClick}
        className="absolute inset-0 w-full h-full block cursor-pointer"
      />

      <div className="absolute top-0 inset-x-0 p-4 flex justify-between items-center z-30 pointer-events-none">
        <Link
          href="/games"
          className="pointer-events-auto flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold"
        >
          <ArrowLeft className="w-4 h-4" /> Exit Sovereign
        </Link>
        <button
          onClick={toggleSound}
          className="pointer-events-auto p-2 rounded-xl bg-white/5 border border-white/10"
        >
          {soundEnabled ? <Volume2 className="w-4 h-4 text-cyan-400" /> : <VolumeX className="w-4 h-4 text-rose-400" />}
        </button>
      </div>

      {gameState === "playing" && (
        <div className="absolute top-4 inset-x-0 flex justify-center pointer-events-none z-20">
          <div className="bg-[#0b0f19]/90 border border-white/10 px-8 py-3 rounded-2xl backdrop-blur-md flex items-center gap-6 pointer-events-auto">
            <div className="text-center">
              <div className="text-[10px] font-black uppercase text-white/40 tracking-wider">COMMAND MATRIX</div>
              <div className="text-sm font-black text-cyan-400">
                {selectedPlanetId ? "SELECT TARGET NODE TO LAUNCH SQUADRON" : "CLICK YOUR NODE TO SELECT LAUNCH SOURCE"}
              </div>
            </div>
          </div>
        </div>
      )}

      {gameState === "menu" && (
        <div className="absolute inset-0 z-40 bg-[#030712]/90 backdrop-blur-xl flex flex-col items-center justify-center p-6">
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center max-w-xl mb-8">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs font-bold uppercase tracking-widest mb-3">
              <Globe className="w-3.5 h-3.5" /> Orbital Fleet Node RTS
            </div>
            <h1 className="text-6xl font-black uppercase tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-amber-500">
              SOVEREIGN
            </h1>
            <p className="text-sm text-white/60 mt-3">
              Command starship armadas, capture energy orbital nodes, and conquer galactic sectors in real-time strategy.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-lg w-full">
            <button
              onClick={() => startGame("galaxy_conquest")}
              className="p-5 rounded-2xl bg-[#0b0f19] border border-cyan-500/40 hover:border-cyan-400 flex flex-col items-center gap-2 hover:scale-105 transition-all text-center"
            >
              <User className="w-8 h-8 text-cyan-400" />
              <div className="font-black text-lg">GALAXY CONQUEST</div>
              <div className="text-xs text-white/50">Single player RTS vs AI Armada</div>
            </button>

            <button
              onClick={() => startGame("local_fleet_clash")}
              className="p-5 rounded-2xl bg-[#0b0f19] border border-rose-500/40 hover:border-rose-400 flex flex-col items-center gap-2 hover:scale-105 transition-all text-center"
            >
              <Users className="w-8 h-8 text-rose-400" />
              <div className="font-black text-lg">2-PLAYER FLEET CLASH</div>
              <div className="text-xs text-white/50">Same screen 1v1 orbital node strategy</div>
            </button>
          </div>
        </div>
      )}

      {gameState === "game_over" && (
        <div className="absolute inset-0 z-50 bg-black/85 backdrop-blur-md flex flex-col items-center justify-center p-6">
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center max-w-md w-full">
            <h2 className="text-4xl font-black uppercase text-cyan-400 mb-2">
              {winnerName ? `${winnerName} Victory!` : "Sector Concluded"}
            </h2>
            <p className="text-xs text-white/50 mb-6">Sovereign Fleet Operations Ended</p>

            <div className="flex gap-4">
              <button
                onClick={() => startGame(mode)}
                className="flex-1 py-3.5 rounded-xl bg-cyan-500 text-black font-black uppercase"
              >
                REMATCH
              </button>
              <button
                onClick={() => setGameState("menu")}
                className="px-5 py-3.5 rounded-xl bg-white/10 text-white font-bold uppercase"
              >
                MENU
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
