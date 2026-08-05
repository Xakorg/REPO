"use client";

import React, { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import {
  Trophy,
  Volume2,
  VolumeX,
  ArrowLeft,
  Globe,
  Zap,
  Users,
  User,
} from "lucide-react";
import Link from "next/link";
import { db } from "@/lib/firebase";
import { collection, addDoc, query, orderBy, limit, onSnapshot } from "firebase/firestore";

// --- AUDIO SYNTHESIZER ---
class OrbitAudioSynth {
  ctx: AudioContext | null = null;
  muted: boolean = false;

  init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === "suspended") {
      this.ctx.resume();
    }
  }

  playOrbitSlingshot() {
    if (this.muted || !this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(400, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(1200, this.ctx.currentTime + 0.2);
    gain.gain.setValueAtTime(0.15, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.2);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.2);
  }

  playOrbCollect() {
    if (this.muted || !this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = "triangle";
    osc.frequency.setValueAtTime(550, this.ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(1100, this.ctx.currentTime + 0.15);
    gain.gain.setValueAtTime(0.12, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.15);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.15);
  }

  playGravityCrash() {
    if (this.muted || !this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(140, this.ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(30, this.ctx.currentTime + 0.3);
    gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.3);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.3);
  }
}

const audioSynth = new OrbitAudioSynth();

export type OrbitMode = "planetary_slingshot" | "gravity_clash";

interface LeaderboardEntry {
  id: string;
  name: string;
  score: number;
}

interface Satellite {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  orbitingPlanetIndex: number | null;
  angle: number;
}

interface Planet {
  x: number;
  y: number;
  radius: number;
  mass: number;
  color: string;
}

export default function OrbitGame() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [gameState, setGameState] = useState<"menu" | "playing" | "game_over">("menu");
  const [mode, setMode] = useState<OrbitMode>("planetary_slingshot");
  const [scoreP1, setScoreP1] = useState(0);
  const [scoreP2, setScoreP2] = useState(0);
  const [orbitFuel, setOrbitFuel] = useState(100);
  const [muted, setMuted] = useState(false);
  const [, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [playerName, setPlayerName] = useState("");
  const [winnerName, setWinnerName] = useState<string | null>(null);
  const [isMobileScreen, setIsMobileScreen] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobileScreen(window.innerWidth <= 768 && window.matchMedia("(pointer: coarse)").matches);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const engineRef = useRef({
    keys: { p1Boost: false, p1Left: false, p1Right: false, p2Boost: false, p2Left: false, p2Right: false },
    satP1: { x: 200, y: 300, vx: 0, vy: -3, radius: 8, orbitingPlanetIndex: null, angle: 0 } as Satellite,
    satP2: { x: 600, y: 300, vx: 0, vy: 3, radius: 8, orbitingPlanetIndex: null, angle: Math.PI } as Satellite,
    planets: [] as Planet[],
    orbs: [] as { x: number; y: number; collected: boolean }[],
  });

  useEffect(() => {
    try {
      const q = query(collection(db, "orbit_leaderboard"), orderBy("score", "desc"), limit(5));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const entries: LeaderboardEntry[] = [];
        snapshot.forEach((doc) => {
          entries.push({ id: doc.id, ...doc.data() } as LeaderboardEntry);
        });
        setLeaderboard(entries);
      });
      return () => unsubscribe();
    } catch (e) {
      console.warn("Firestore leaderboard offline:", e);
    }
  }, []);

  const saveScore = async () => {
    if (!playerName.trim() || scoreP1 <= 0) return;
    try {
      await addDoc(collection(db, "orbit_leaderboard"), {
        name: playerName.trim().substring(0, 12),
        score: scoreP1,
        createdAt: new Date(),
      });
    } catch (e) {
      console.warn("Score submission error:", e);
    }
  };

  const startGame = (selectedMode: OrbitMode) => {
    audioSynth.init();
    setMode(selectedMode);
    setScoreP1(0);
    setScoreP2(0);
    setOrbitFuel(100);
    setWinnerName(null);

    const initialPlanets: Planet[] = [
      { x: 400, y: 300, radius: 45, mass: 2200, color: "#10b981" },
      { x: 220, y: 180, radius: 32, mass: 1400, color: "#06b6d4" },
      { x: 580, y: 420, radius: 35, mass: 1600, color: "#3b82f6" },
    ];

    const initialOrbs = [
      { x: 300, y: 120, collected: false },
      { x: 500, y: 480, collected: false },
      { x: 400, y: 180, collected: false },
    ];

    engineRef.current = {
      keys: { p1Boost: false, p1Left: false, p1Right: false, p2Boost: false, p2Left: false, p2Right: false },
      satP1: { x: 200, y: 300, vx: 0, vy: -3, radius: 8, orbitingPlanetIndex: null, angle: 0 },
      satP2: { x: 600, y: 300, vx: 0, vy: 3, radius: 8, orbitingPlanetIndex: null, angle: Math.PI },
      planets: initialPlanets,
      orbs: initialOrbs,
    };

    setGameState("playing");
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (gameState !== "playing") return;
      if (e.key === "a" || e.key === "A") engineRef.current.keys.p1Left = true;
      if (e.key === "d" || e.key === "D") engineRef.current.keys.p1Right = true;
      if (e.key === " " || e.key === "w" || e.key === "W") engineRef.current.keys.p1Boost = true;
      if (e.key === "ArrowLeft") engineRef.current.keys.p2Left = true;
      if (e.key === "ArrowRight") engineRef.current.keys.p2Right = true;
      if (e.key === "ArrowUp") engineRef.current.keys.p2Boost = true;
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === "a" || e.key === "A") engineRef.current.keys.p1Left = false;
      if (e.key === "d" || e.key === "D") engineRef.current.keys.p1Right = false;
      if (e.key === " " || e.key === "w" || e.key === "W") engineRef.current.keys.p1Boost = false;
      if (e.key === "ArrowLeft") engineRef.current.keys.p2Left = false;
      if (e.key === "ArrowRight") engineRef.current.keys.p2Right = false;
      if (e.key === "ArrowUp") engineRef.current.keys.p2Boost = false;
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [gameState]);

  // --- GAME LOOP ---
  useEffect(() => {
    if (gameState !== "playing") return;
    let animId: number;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let p1ScoreAccum = 0;
    let p2ScoreAccum = 0;
    let localFuel = 100;

    const loop = () => {
      const state = engineRef.current;
      const sat1 = state.satP1;
      const sat2 = state.satP2;

      // Apply Planetary Gravitational Forces
      state.planets.forEach((p) => {
        const dx1 = p.x - sat1.x;
        const dy1 = p.y - sat1.y;
        const dist1 = Math.sqrt(dx1 * dx1 + dy1 * dy1);
        if (dist1 > p.radius) {
          const force1 = p.mass / (dist1 * dist1);
          sat1.vx += (dx1 / dist1) * force1;
          sat1.vy += (dy1 / dist1) * force1;
        }

        if (mode === "gravity_clash") {
          const dx2 = p.x - sat2.x;
          const dy2 = p.y - sat2.y;
          const dist2 = Math.sqrt(dx2 * dx2 + dy2 * dy2);
          if (dist2 > p.radius) {
            const force2 = p.mass / (dist2 * dist2);
            sat2.vx += (dx2 / dist2) * force2;
            sat2.vy += (dy2 / dist2) * force2;
          }
        }
      });

      // P1 Boost Thruster
      if (state.keys.p1Boost && localFuel > 0) {
        audioSynth.playOrbitSlingshot();
        sat1.vx += Math.cos(sat1.angle) * 0.4;
        sat1.vy += Math.sin(sat1.angle) * 0.4;
        localFuel -= 0.3;
        setOrbitFuel(Math.max(0, Math.floor(localFuel)));
      }

      if (state.keys.p1Left) sat1.angle -= 0.08;
      if (state.keys.p1Right) sat1.angle += 0.08;

      sat1.x += sat1.vx;
      sat1.y += sat1.vy;

      // P2 Thruster (if 2P mode)
      if (mode === "gravity_clash") {
        if (state.keys.p2Boost) {
          audioSynth.playOrbitSlingshot();
          sat2.vx += Math.cos(sat2.angle) * 0.4;
          sat2.vy += Math.sin(sat2.angle) * 0.4;
        }
        if (state.keys.p2Left) sat2.angle -= 0.08;
        if (state.keys.p2Right) sat2.angle += 0.08;

        sat2.x += sat2.vx;
        sat2.y += sat2.vy;
      }

      // Collect Stardust Orbs
      state.orbs.forEach((orb) => {
        if (!orb.collected) {
          const dx1 = orb.x - sat1.x;
          const dy1 = orb.y - sat1.y;
          if (Math.sqrt(dx1 * dx1 + dy1 * dy1) < sat1.radius + 12) {
            orb.collected = true;
            audioSynth.playOrbCollect();
            p1ScoreAccum += 200;
            setScoreP1(p1ScoreAccum);
            localFuel = Math.min(100, localFuel + 15);
          }
        }
      });

      // Respawn Orbs
      if (state.orbs.every((o) => o.collected)) {
        state.orbs.forEach((o) => {
          o.collected = false;
          o.x = 100 + Math.random() * 600;
          o.y = 100 + Math.random() * 400;
        });
      }

      // Check Crashes with Planets or Walls
      state.planets.forEach((p) => {
        const dx1 = p.x - sat1.x;
        const dy1 = p.y - sat1.y;
        if (Math.sqrt(dx1 * dx1 + dy1 * dy1) < p.radius + sat1.radius) {
          audioSynth.playGravityCrash();
          if (mode === "gravity_clash") setWinnerName("PLAYER 2");
          setGameState("game_over");
          return;
        }
      });

      if (sat1.x < 0 || sat1.x > 800 || sat1.y < 0 || sat1.y > 600) {
        audioSynth.playGravityCrash();
        if (mode === "gravity_clash") setWinnerName("PLAYER 2");
        setGameState("game_over");
        return;
      }

      // --- RENDERING ---
      ctx.fillStyle = "#020a12";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Render Planets
      state.planets.forEach((p) => {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 24;
        ctx.fill();
      });
      ctx.shadowBlur = 0;

      // Render Stardust Orbs
      state.orbs.forEach((orb) => {
        if (!orb.collected) {
          ctx.beginPath();
          ctx.arc(orb.x, orb.y, 8, 0, Math.PI * 2);
          ctx.fillStyle = "#fbbf24";
          ctx.shadowColor = "#fbbf24";
          ctx.shadowBlur = 12;
          ctx.fill();
        }
      });
      ctx.shadowBlur = 0;

      // Render Player 1 Satellite
      ctx.beginPath();
      ctx.arc(sat1.x, sat1.y, sat1.radius, 0, Math.PI * 2);
      ctx.fillStyle = "#10b981";
      ctx.shadowColor = "#10b981";
      ctx.shadowBlur = 16;
      ctx.fill();
      ctx.shadowBlur = 0;

      // Render Player 2 Satellite (if 2P mode)
      if (mode === "gravity_clash") {
        ctx.beginPath();
        ctx.arc(sat2.x, sat2.y, sat2.radius, 0, Math.PI * 2);
        ctx.fillStyle = "#06b6d4";
        ctx.shadowColor = "#06b6d4";
        ctx.shadowBlur = 16;
        ctx.fill();
        ctx.shadowBlur = 0;
      }

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [gameState, mode]);

  return (
    <div className="relative w-full h-screen bg-[#01070d] text-white flex flex-col items-center justify-center font-sans overflow-hidden select-none">
      {/* Navigation Header */}
      <div className="absolute top-4 left-4 right-4 z-30 flex items-center justify-between pointer-events-auto">
        <Link
          href="/games"
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-xs font-bold uppercase tracking-wider backdrop-blur-md transition-all"
        >
          <ArrowLeft className="w-4 h-4" /> GAMES
        </Link>
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              audioSynth.muted = !muted;
              setMuted(!muted);
            }}
            className="p-2.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-white backdrop-blur-md"
          >
            {muted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
          </button>
        </div>
      </div>

      {/* Main Canvas Area */}
      <div className="relative w-full max-w-4xl aspect-[4/3] bg-[#021320] rounded-3xl border border-emerald-500/30 overflow-hidden shadow-[0_0_60px_rgba(16,185,129,0.15)] flex flex-col justify-center items-center">
        <canvas ref={canvasRef} width={800} height={600} className="w-full h-full object-contain" />

        {/* Dynamic HUD */}
        {gameState === "playing" && (
          <div className="absolute top-6 inset-x-6 z-20 flex justify-between items-start pointer-events-none">
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-black/60 border border-emerald-500/40 text-emerald-300 font-mono text-xs backdrop-blur-md">
                <Globe className="w-3.5 h-3.5 text-emerald-400" /> P1 ORBIT SCORE: {scoreP1}
              </div>
              {mode === "gravity_clash" && (
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-black/60 border border-cyan-500/40 text-cyan-300 font-mono text-xs backdrop-blur-md">
                  <Globe className="w-3.5 h-3.5 text-cyan-400" /> P2 ORBIT SCORE: {scoreP2}
                </div>
              )}
              {mode === "planetary_slingshot" && (
                <div className="w-48 bg-black/60 border border-white/10 p-1.5 rounded-xl backdrop-blur-md">
                  <div className="flex justify-between text-[10px] font-mono mb-1 text-white/70">
                    <span>THRUSTER FUEL</span>
                    <span>{orbitFuel}%</span>
                  </div>
                  <div className="w-full bg-white/10 h-2 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-400 transition-all duration-200"
                      style={{ width: `${orbitFuel}%` }}
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="px-4 py-2 rounded-2xl bg-black/60 border border-emerald-500/40 backdrop-blur-md text-right">
              <div className="text-[10px] font-mono text-emerald-400/70 uppercase">SLINGSHOT DISTANCE</div>
              <div className="text-2xl font-black font-mono text-emerald-300">{scoreP1}</div>
            </div>
          </div>
        )}

        {/* Small Touch Screen Controls */}
        {gameState === "playing" && isMobileScreen && (
          <div className="absolute bottom-6 inset-x-6 flex justify-between items-center z-30 pointer-events-auto">
            <div className="flex gap-2">
              <button
                onTouchStart={() => (engineRef.current.keys.p1Left = true)}
                onTouchEnd={() => (engineRef.current.keys.p1Left = false)}
                className="w-14 h-14 rounded-2xl bg-white/10 border border-white/20 active:bg-emerald-500/30 flex items-center justify-center font-bold text-lg"
              >
                ↺
              </button>
              <button
                onTouchStart={() => (engineRef.current.keys.p1Right = true)}
                onTouchEnd={() => (engineRef.current.keys.p1Right = false)}
                className="w-14 h-14 rounded-2xl bg-white/10 border border-white/20 active:bg-emerald-500/30 flex items-center justify-center font-bold text-lg"
              >
                ↻
              </button>
            </div>
            <button
              onTouchStart={() => (engineRef.current.keys.p1Boost = true)}
              onTouchEnd={() => (engineRef.current.keys.p1Boost = false)}
              className="w-20 h-20 rounded-full bg-gradient-to-tr from-emerald-500 to-cyan-500 border border-emerald-300 active:scale-95 flex items-center justify-center font-black text-xs uppercase text-black shadow-lg"
            >
              BOOST
            </button>
          </div>
        )}

        {/* Menu Overlay */}
        {gameState === "menu" && (
          <div className="absolute inset-0 z-40 bg-[#010e1a]/90 backdrop-blur-2xl flex flex-col items-center justify-center p-6 overflow-y-auto">
            <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-emerald-600/20 rounded-full blur-[120px] pointer-events-none animate-pulse" />

            <motion.div
              initial={{ scale: 0.88, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              className="text-center max-w-2xl mb-8 z-10"
            >
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-black uppercase tracking-widest mb-4 shadow-[0_0_20px_rgba(16,185,129,0.2)]">
                <Zap className="w-4 h-4 text-emerald-400 animate-bounce" /> Planetary Gravitational Slingshot
              </div>

              <h1 className="text-7xl md:text-8xl font-black uppercase tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-emerald-300 via-teal-300 to-cyan-400 drop-shadow-[0_0_40px_rgba(16,185,129,0.6)]">
                ORBIT
              </h1>
              <p className="text-base text-emerald-100/70 mt-4 max-w-lg mx-auto leading-relaxed">
                Slingshot satellites through planetary gravity wells and harvest stardust without crashing into planet surfaces.
              </p>

              <div className="flex justify-center gap-3 mt-4">
                <span className="px-3 py-1 rounded-md bg-white/5 border border-white/10 text-[10px] font-mono text-emerald-300">1P / 2P MODES</span>
                <span className="px-3 py-1 rounded-md bg-white/5 border border-white/10 text-[10px] font-mono text-cyan-300">ONLINE LEADERBOARD</span>
                <span className="px-3 py-1 rounded-md bg-white/5 border border-white/10 text-[10px] font-mono text-teal-300">TOUCH READY</span>
              </div>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-xl w-full z-10">
              <button
                onClick={() => startGame("planetary_slingshot")}
                className="group relative p-6 rounded-3xl bg-white/5 border border-emerald-500/30 hover:border-emerald-400 hover:bg-emerald-500/10 flex flex-col items-center gap-3 transition-all duration-300 text-center backdrop-blur-md shadow-lg hover:shadow-[0_0_30px_rgba(16,185,129,0.3)] active:scale-95"
              >
                <User className="w-8 h-8 text-emerald-400 group-hover:scale-110 transition-transform" />
                <div>
                  <div className="font-black text-xl uppercase tracking-wider text-white">SLINGSHOT</div>
                  <div className="text-xs text-emerald-200/60 mt-1">Single player planetary orbit navigation</div>
                </div>
              </button>

              <button
                onClick={() => startGame("gravity_clash")}
                className="group relative p-6 rounded-3xl bg-white/5 border border-cyan-500/30 hover:border-cyan-400 hover:bg-cyan-500/10 flex flex-col items-center gap-3 transition-all duration-300 text-center backdrop-blur-md shadow-lg hover:shadow-[0_0_30px_rgba(6,182,212,0.3)] active:scale-95"
              >
                <Users className="w-8 h-8 text-cyan-400 group-hover:scale-110 transition-transform" />
                <div>
                  <div className="font-black text-xl uppercase tracking-wider text-white">GRAVITY CLASH</div>
                  <div className="text-xs text-cyan-200/60 mt-1">2-Player satellite orbit duel</div>
                </div>
              </button>
            </div>

            <div className="mt-8 z-10 flex flex-wrap items-center justify-center gap-6 text-xs text-white/50 bg-black/40 px-6 py-3 rounded-2xl border border-white/10">
              <div className="flex items-center gap-2">
                <span className="font-mono text-emerald-300 bg-white/10 px-2 py-0.5 rounded border border-white/10 font-bold">A / D</span>
                <span>Rotate Satellite</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-cyan-300 bg-white/10 px-2 py-0.5 rounded border border-white/10 font-bold">W / SPACE</span>
                <span>Thruster Boost</span>
              </div>
            </div>
          </div>
        )}

        {/* Game Over Screen */}
        {gameState === "game_over" && (
          <div className="absolute inset-0 z-50 bg-black/90 backdrop-blur-2xl flex flex-col items-center justify-center p-6">
            <motion.div
              initial={{ scale: 0.88, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="text-center max-w-md w-full bg-slate-900/90 border border-emerald-500/40 p-8 rounded-3xl shadow-[0_0_50px_rgba(16,185,129,0.3)] relative overflow-hidden"
            >
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-bold uppercase tracking-wider mb-4">
                <Trophy className="w-3.5 h-3.5 text-emerald-400" /> Orbit Trajectory Finished
              </div>

              <h2 className="text-4xl font-black uppercase text-transparent bg-clip-text bg-gradient-to-r from-emerald-300 to-cyan-300 mb-2">
                {winnerName ? `${winnerName} VICTORY!` : "ORBIT COLLAPSED"}
              </h2>
              <p className="text-xs text-emerald-200/60 mb-6">Planetary Slingshot Results</p>

              <div className="p-4 rounded-2xl bg-white/5 border border-white/10 mb-6">
                <div className="text-[10px] text-white/40 font-black uppercase">FINAL SCORE</div>
                <div className="text-3xl font-black text-emerald-300">{scoreP1}</div>
              </div>

              <div className="mb-6 flex gap-2">
                <input
                  type="text"
                  placeholder="Enter Player Name"
                  value={playerName}
                  onChange={(e) => setPlayerName(e.target.value)}
                  className="flex-1 px-4 py-3 rounded-xl bg-black/60 border border-white/10 text-white text-xs focus:outline-none focus:border-emerald-400"
                />
                <button
                  onClick={saveScore}
                  className="px-4 py-3 rounded-xl bg-emerald-500 text-black font-bold text-xs uppercase"
                >
                  SAVE
                </button>
              </div>

              <div className="flex gap-4">
                <button
                  onClick={() => startGame(mode)}
                  className="flex-1 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-black font-black uppercase tracking-wider shadow-[0_0_20px_rgba(16,185,129,0.4)] active:scale-95 transition-all"
                >
                  REMATCH
                </button>
                <button
                  onClick={() => setGameState("menu")}
                  className="px-6 py-3.5 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-bold uppercase tracking-wider border border-white/10 active:scale-95 transition-all"
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
