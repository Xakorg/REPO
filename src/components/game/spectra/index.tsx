"use client";

import React, { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import {
  Trophy,
  Volume2,
  VolumeX,
  ArrowLeft,
  Sun,
  Users,
  User,
  ShieldAlert,
} from "lucide-react";
import Link from "next/link";
import { db } from "@/lib/firebase";
import { collection, addDoc, query, orderBy, limit, onSnapshot } from "firebase/firestore";

// --- AUDIO SYNTHESIZER ---
class SpectraAudioSynth {
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

  playPrismRefract() {
    if (this.muted || !this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(700, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(1400, this.ctx.currentTime + 0.15);
    gain.gain.setValueAtTime(0.12, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.15);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.15);
  }

  playOpticPulse() {
    if (this.muted || !this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = "triangle";
    osc.frequency.setValueAtTime(450, this.ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(900, this.ctx.currentTime + 0.2);
    gain.gain.setValueAtTime(0.15, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.2);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.2);
  }

  playWavelengthOverload() {
    if (this.muted || !this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(200, this.ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(50, this.ctx.currentTime + 0.3);
    gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.3);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.3);
  }
}

const audioSynth = new SpectraAudioSynth();

export type SpectraMode = "prism_defense" | "optic_clash";

interface LeaderboardEntry {
  id: string;
  name: string;
  score: number;
}

interface ChromaticBeam {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  wavelength: "red" | "green" | "blue";
  absorbed: boolean;
}

interface OpticPrism {
  x: number;
  angle: number;
  wavelength: "red" | "green" | "blue";
}

export default function SpectraGame() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [gameState, setGameState] = useState<"menu" | "playing" | "game_over">("menu");
  const [mode, setMode] = useState<SpectraMode>("prism_defense");
  const [scoreP1, setScoreP1] = useState(0);
  const [scoreP2, setScoreP2] = useState(0);
  const [prismIntegrity, setPrismIntegrity] = useState(100);
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
    keys: { p1Left: false, p1Right: false, p1ShiftColor: false, p2Left: false, p2Right: false },
    prismP1: { x: 400, angle: 0, wavelength: "red" as "red" | "green" | "blue" },
    prismP2: { x: 400, angle: Math.PI, wavelength: "blue" as "red" | "green" | "blue" },
    beams: [] as ChromaticBeam[],
    timer: 60,
  });

  useEffect(() => {
    try {
      const q = query(collection(db, "spectra_leaderboard"), orderBy("score", "desc"), limit(5));
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
      await addDoc(collection(db, "spectra_leaderboard"), {
        name: playerName.trim().substring(0, 12),
        score: scoreP1,
        createdAt: new Date(),
      });
    } catch (e) {
      console.warn("Score submission error:", e);
    }
  };

  const switchWavelength = (p: 1 | 2) => {
    const state = engineRef.current;
    audioSynth.playOpticPulse();
    if (p === 1) {
      const colors: ("red" | "green" | "blue")[] = ["red", "green", "blue"];
      const nextIdx = (colors.indexOf(state.prismP1.wavelength) + 1) % 3;
      state.prismP1.wavelength = colors[nextIdx];
    } else {
      const colors: ("red" | "green" | "blue")[] = ["red", "green", "blue"];
      const nextIdx = (colors.indexOf(state.prismP2.wavelength) + 1) % 3;
      state.prismP2.wavelength = colors[nextIdx];
    }
  };

  const startGame = (selectedMode: SpectraMode) => {
    audioSynth.init();
    setMode(selectedMode);
    setScoreP1(0);
    setScoreP2(0);
    setPrismIntegrity(100);
    setWinnerName(null);

    const initialBeams: ChromaticBeam[] = [];
    const colorList: ("red" | "green" | "blue")[] = ["red", "green", "blue"];
    const hexMap = { red: "#ef4444", green: "#10b981", blue: "#38bdf8" };

    for (let i = 0; i < 8; i++) {
      const w = colorList[Math.floor(Math.random() * 3)];
      initialBeams.push({
        x: 100 + Math.random() * 600,
        y: -50 - Math.random() * 300,
        vx: (Math.random() - 0.5) * 1.5,
        vy: 3 + Math.random() * 2,
        color: hexMap[w],
        wavelength: w,
        absorbed: false,
      });
    }

    engineRef.current = {
      keys: { p1Left: false, p1Right: false, p1ShiftColor: false, p2Left: false, p2Right: false },
      prismP1: { x: 400, angle: 0, wavelength: "red" },
      prismP2: { x: 400, angle: Math.PI, wavelength: "blue" },
      beams: initialBeams,
      timer: 60,
    };

    setGameState("playing");
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (gameState !== "playing") return;
      if (e.key === "a" || e.key === "A") engineRef.current.keys.p1Left = true;
      if (e.key === "d" || e.key === "D") engineRef.current.keys.p1Right = true;
      if (e.key === " ") switchWavelength(1);
      if (e.key === "ArrowLeft") engineRef.current.keys.p2Left = true;
      if (e.key === "ArrowRight") engineRef.current.keys.p2Right = true;
      if (e.key === "Enter") switchWavelength(2);
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === "a" || e.key === "A") engineRef.current.keys.p1Left = false;
      if (e.key === "d" || e.key === "D") engineRef.current.keys.p1Right = false;
      if (e.key === "ArrowLeft") engineRef.current.keys.p2Left = false;
      if (e.key === "ArrowRight") engineRef.current.keys.p2Right = false;
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
    let localIntegrity = 100;

    const colorHexMap = { red: "#ef4444", green: "#10b981", blue: "#38bdf8" };

    const loop = () => {
      const state = engineRef.current;
      const prism1 = state.prismP1;
      const prism2 = state.prismP2;

      // P1 Prism Navigation
      if (state.keys.p1Left) prism1.x -= 7;
      if (state.keys.p1Right) prism1.x += 7;
      prism1.x = Math.max(60, Math.min(740, prism1.x));

      // P2 Prism Navigation (if 2P mode)
      if (mode === "optic_clash") {
        if (state.keys.p2Left) prism2.x -= 7;
        if (state.keys.p2Right) prism2.x += 7;
        prism2.x = Math.max(60, Math.min(740, prism2.x));
      }

      // Chromatic Beams Movement & Refraction
      state.beams.forEach((beam) => {
        if (!beam.absorbed) {
          beam.x += beam.vx;
          beam.y += beam.vy;

          if (beam.x < 30 || beam.x > 770) beam.vx *= -1;

          // Check Prism 1 Absorption (Bottom Prism at y=520)
          const dx1 = beam.x - prism1.x;
          const dy1 = beam.y - 520;
          if (Math.sqrt(dx1 * dx1 + dy1 * dy1) < 40) {
            beam.absorbed = true;
            if (beam.wavelength === prism1.wavelength) {
              audioSynth.playPrismRefract();
              p1ScoreAccum += 200;
              setScoreP1(p1ScoreAccum);
              localIntegrity = Math.min(100, localIntegrity + 3);
            } else {
              audioSynth.playWavelengthOverload();
              localIntegrity -= 12;
            }
            setPrismIntegrity(Math.max(0, Math.floor(localIntegrity)));
          }

          // Check Prism 2 Absorption (Top Prism at y=80 if 2P mode)
          if (mode === "optic_clash" && !beam.absorbed) {
            const dx2 = beam.x - prism2.x;
            const dy2 = beam.y - 80;
            if (Math.sqrt(dx2 * dx2 + dy2 * dy2) < 40) {
              beam.absorbed = true;
              if (beam.wavelength === prism2.wavelength) {
                audioSynth.playPrismRefract();
                p2ScoreAccum += 200;
                setScoreP2(p2ScoreAccum);
              }
            }
          }
        }
      });

      // Respawn Absorbed/Out of Bounds Beams
      if (state.beams.filter((b) => !b.absorbed && b.y < 620).length < 5) {
        const colorList: ("red" | "green" | "blue")[] = ["red", "green", "blue"];
        const w = colorList[Math.floor(Math.random() * 3)];
        state.beams.push({
          x: 80 + Math.random() * 640,
          y: -40,
          vx: (Math.random() - 0.5) * 1.5,
          vy: 3 + Math.random() * 2,
          color: colorHexMap[w],
          wavelength: w,
          absorbed: false,
        });
      }

      if (mode === "prism_defense" && localIntegrity <= 0) {
        setGameState("game_over");
        return;
      }

      // --- RENDERING ---
      ctx.fillStyle = "#070214";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Render Chromatic Beams
      state.beams.forEach((b) => {
        if (!b.absorbed) {
          ctx.beginPath();
          ctx.arc(b.x, b.y, 8, 0, Math.PI * 2);
          ctx.fillStyle = b.color;
          ctx.shadowColor = b.color;
          ctx.shadowBlur = 14;
          ctx.fill();
        }
      });
      ctx.shadowBlur = 0;

      // Render Player 1 Optic Prism (Bottom)
      ctx.save();
      ctx.translate(prism1.x, 520);
      ctx.beginPath();
      ctx.moveTo(0, -25);
      ctx.lineTo(25, 20);
      ctx.lineTo(-25, 20);
      ctx.closePath();
      ctx.fillStyle = colorHexMap[prism1.wavelength];
      ctx.shadowColor = colorHexMap[prism1.wavelength];
      ctx.shadowBlur = 24;
      ctx.fill();
      ctx.restore();

      // Render Player 2 Optic Prism (Top - if 2P mode)
      if (mode === "optic_clash") {
        ctx.save();
        ctx.translate(prism2.x, 80);
        ctx.rotate(Math.PI);
        ctx.beginPath();
        ctx.moveTo(0, -25);
        ctx.lineTo(25, 20);
        ctx.lineTo(-25, 20);
        ctx.closePath();
        ctx.fillStyle = colorHexMap[prism2.wavelength];
        ctx.shadowColor = colorHexMap[prism2.wavelength];
        ctx.shadowBlur = 24;
        ctx.fill();
        ctx.restore();
      }

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [gameState, mode]);

  return (
    <div className="relative w-full h-screen bg-[#05010f] text-white flex flex-col items-center justify-center font-sans overflow-hidden select-none">
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
            {muted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-pink-400" />}
          </button>
        </div>
      </div>

      {/* Main Canvas Area */}
      <div className="relative w-full max-w-4xl aspect-[4/3] bg-[#0a031c] rounded-3xl border border-pink-500/30 overflow-hidden shadow-[0_0_60px_rgba(236,72,153,0.15)] flex flex-col justify-center items-center">
        <canvas ref={canvasRef} width={800} height={600} className="w-full h-full object-contain" />

        {/* Dynamic HUD */}
        {gameState === "playing" && (
          <div className="absolute top-6 inset-x-6 z-20 flex justify-between items-start pointer-events-none">
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-black/60 border border-pink-500/40 text-pink-300 font-mono text-xs backdrop-blur-md">
                <Sun className="w-3.5 h-3.5 text-pink-400" /> P1 SPECTRA SCORE: {scoreP1}
              </div>
              {mode === "optic_clash" && (
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-black/60 border border-cyan-500/40 text-cyan-300 font-mono text-xs backdrop-blur-md">
                  <Sun className="w-3.5 h-3.5 text-cyan-400" /> P2 SPECTRA SCORE: {scoreP2}
                </div>
              )}
              {mode === "prism_defense" && (
                <div className="w-48 bg-black/60 border border-white/10 p-1.5 rounded-xl backdrop-blur-md">
                  <div className="flex justify-between text-[10px] font-mono mb-1 text-white/70">
                    <span>PRISM INTEGRITY</span>
                    <span>{prismIntegrity}%</span>
                  </div>
                  <div className="w-full bg-white/10 h-2 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-red-500 via-emerald-400 to-cyan-400 transition-all duration-200"
                      style={{ width: `${prismIntegrity}%` }}
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="px-4 py-2 rounded-2xl bg-black/60 border border-pink-500/40 backdrop-blur-md text-right">
              <div className="text-[10px] font-mono text-pink-400/70 uppercase">WAVELENGTH MATCH</div>
              <div className="text-2xl font-black font-mono text-pink-300">{scoreP1}</div>
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
                className="w-14 h-14 rounded-2xl bg-white/10 border border-white/20 active:bg-pink-500/30 flex items-center justify-center font-bold text-lg"
              >
                ←
              </button>
              <button
                onTouchStart={() => (engineRef.current.keys.p1Right = true)}
                onTouchEnd={() => (engineRef.current.keys.p1Right = false)}
                className="w-14 h-14 rounded-2xl bg-white/10 border border-white/20 active:bg-pink-500/30 flex items-center justify-center font-bold text-lg"
              >
                →
              </button>
            </div>
            <button
              onClick={() => switchWavelength(1)}
              className="w-20 h-20 rounded-full bg-gradient-to-tr from-pink-500 to-cyan-500 border border-pink-300 active:scale-95 flex items-center justify-center font-black text-xs uppercase text-black shadow-lg"
            >
              COLOR
            </button>
          </div>
        )}

        {/* Menu Overlay */}
        {gameState === "menu" && (
          <div className="absolute inset-0 z-40 bg-[#070114]/90 backdrop-blur-2xl flex flex-col items-center justify-center p-6 overflow-y-auto">
            <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-pink-600/20 rounded-full blur-[120px] pointer-events-none animate-pulse" />

            <motion.div
              initial={{ scale: 0.88, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              className="text-center max-w-2xl mb-8 z-10"
            >
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-pink-500/10 border border-pink-500/30 text-pink-300 text-xs font-black uppercase tracking-widest mb-4 shadow-[0_0_20px_rgba(236,72,153,0.2)]">
                <Sun className="w-4 h-4 text-pink-400 animate-spin" style={{ animationDuration: "12s" }} /> Chromatic Optic Prism Protocol
              </div>

              <h1 className="text-7xl md:text-8xl font-black uppercase tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-pink-400 via-emerald-300 to-cyan-400 drop-shadow-[0_0_40px_rgba(236,72,153,0.6)]">
                SPECTRA
              </h1>
              <p className="text-base text-pink-100/70 mt-4 max-w-lg mx-auto leading-relaxed">
                Refract incoming chromatic laser beams by matching optic prism wavelengths between Red, Green, and Blue.
              </p>

              <div className="flex justify-center gap-3 mt-4">
                <span className="px-3 py-1 rounded-md bg-white/5 border border-white/10 text-[10px] font-mono text-pink-300">1P / 2P MODES</span>
                <span className="px-3 py-1 rounded-md bg-white/5 border border-white/10 text-[10px] font-mono text-emerald-300">ONLINE LEADERBOARD</span>
                <span className="px-3 py-1 rounded-md bg-white/5 border border-white/10 text-[10px] font-mono text-cyan-300">TOUCH READY</span>
              </div>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-xl w-full z-10">
              <button
                onClick={() => startGame("prism_defense")}
                className="group relative p-6 rounded-3xl bg-white/5 border border-pink-500/30 hover:border-pink-400 hover:bg-pink-500/10 flex flex-col items-center gap-3 transition-all duration-300 text-center backdrop-blur-md shadow-lg hover:shadow-[0_0_30px_rgba(236,72,153,0.3)] active:scale-95"
              >
                <User className="w-8 h-8 text-pink-400 group-hover:scale-110 transition-transform" />
                <div>
                  <div className="font-black text-xl uppercase tracking-wider text-white">PRISM DEFENSE</div>
                  <div className="text-xs text-pink-200/60 mt-1">Single player wavelength refraction</div>
                </div>
              </button>

              <button
                onClick={() => startGame("optic_clash")}
                className="group relative p-6 rounded-3xl bg-white/5 border border-cyan-500/30 hover:border-cyan-400 hover:bg-cyan-500/10 flex flex-col items-center gap-3 transition-all duration-300 text-center backdrop-blur-md shadow-lg hover:shadow-[0_0_30px_rgba(6,182,212,0.3)] active:scale-95"
              >
                <Users className="w-8 h-8 text-cyan-400 group-hover:scale-110 transition-transform" />
                <div>
                  <div className="font-black text-xl uppercase tracking-wider text-white">OPTIC CLASH</div>
                  <div className="text-xs text-cyan-200/60 mt-1">2-Player optic beam clash</div>
                </div>
              </button>
            </div>

            <div className="mt-8 z-10 flex flex-wrap items-center justify-center gap-6 text-xs text-white/50 bg-black/40 px-6 py-3 rounded-2xl border border-white/10">
              <div className="flex items-center gap-2">
                <span className="font-mono text-pink-300 bg-white/10 px-2 py-0.5 rounded border border-white/10 font-bold">A / D</span>
                <span>Move Prism</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-emerald-300 bg-white/10 px-2 py-0.5 rounded border border-white/10 font-bold">SPACE</span>
                <span>Switch Color</span>
              </div>
            </div>
          </div>
        )}

        {/* Game Over Overlay */}
        {gameState === "game_over" && (
          <div className="absolute inset-0 z-50 bg-black/90 backdrop-blur-2xl flex flex-col items-center justify-center p-6">
            <motion.div
              initial={{ scale: 0.88, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="text-center max-w-md w-full bg-slate-900/90 border border-pink-500/40 p-8 rounded-3xl shadow-[0_0_50px_rgba(236,72,153,0.3)] relative overflow-hidden"
            >
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-pink-500/10 border border-pink-500/30 text-pink-300 text-xs font-bold uppercase tracking-wider mb-4">
                <Trophy className="w-3.5 h-3.5 text-pink-400" /> Optic Trial Concluded
              </div>

              <h2 className="text-4xl font-black uppercase text-transparent bg-clip-text bg-gradient-to-r from-pink-300 to-emerald-300 mb-2">
                PRISM OVERLOADED
              </h2>
              <p className="text-xs text-pink-200/60 mb-6">Spectra Refraction Results</p>

              <div className="p-4 rounded-2xl bg-white/5 border border-white/10 mb-6">
                <div className="text-[10px] text-white/40 font-black uppercase">FINAL SPECTRA SCORE</div>
                <div className="text-3xl font-black text-pink-300">{scoreP1}</div>
              </div>

              <div className="mb-6 flex gap-2">
                <input
                  type="text"
                  placeholder="Enter Player Name"
                  value={playerName}
                  onChange={(e) => setPlayerName(e.target.value)}
                  className="flex-1 px-4 py-3 rounded-xl bg-black/60 border border-white/10 text-white text-xs focus:outline-none focus:border-pink-400"
                />
                <button
                  onClick={saveScore}
                  className="px-4 py-3 rounded-xl bg-pink-500 text-black font-bold text-xs uppercase"
                >
                  SAVE
                </button>
              </div>

              <div className="flex gap-4">
                <button
                  onClick={() => startGame(mode)}
                  className="flex-1 py-3.5 rounded-2xl bg-gradient-to-r from-pink-500 to-emerald-500 hover:from-pink-400 hover:to-emerald-400 text-black font-black uppercase tracking-wider shadow-[0_0_20px_rgba(236,72,153,0.4)] active:scale-95 transition-all"
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
