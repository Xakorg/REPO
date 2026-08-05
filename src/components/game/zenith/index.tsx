"use client";

import React, { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import {
  Trophy,
  Volume2,
  VolumeX,
  ArrowLeft,
  Mountain,
  Zap,
  Users,
  User,
} from "lucide-react";
import Link from "next/link";
import { db } from "@/lib/firebase";
import { collection, addDoc, query, orderBy, limit, onSnapshot } from "firebase/firestore";

// --- AUDIO SYNTHESIZER ---
class ZenithAudioSynth {
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

  playJump() {
    if (this.muted || !this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(350, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(750, this.ctx.currentTime + 0.15);
    gain.gain.setValueAtTime(0.12, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.15);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.15);
  }

  playOrbCollect() {
    if (this.muted || !this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = "triangle";
    osc.frequency.setValueAtTime(523.25, this.ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(1046.5, this.ctx.currentTime + 0.2);
    gain.gain.setValueAtTime(0.15, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.2);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.2);
  }

  playFallImpact() {
    if (this.muted || !this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(160, this.ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(40, this.ctx.currentTime + 0.25);
    gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.25);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.25);
  }
}

const audioSynth = new ZenithAudioSynth();

export type ZenithMode = "orbital_ascent" | "apex_climb_duel";

interface LeaderboardEntry {
  id: string;
  name: string;
  score: number;
}

interface ZenithPlatform {
  x: number;
  y: number;
  width: number;
  height: number;
  type: "normal" | "moving" | "fragile";
  vx: number;
}

interface ZenithOrb {
  x: number;
  y: number;
  radius: number;
  collected: boolean;
}

export default function ZenithGame() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [gameState, setGameState] = useState<"menu" | "playing" | "game_over">("menu");
  const [mode, setMode] = useState<ZenithMode>("orbital_ascent");
  const [scoreP1, setScoreP1] = useState(0);
  const [scoreP2, setScoreP2] = useState(0);
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
    keys: { p1Left: false, p1Right: false, p1Jump: false, p2Left: false, p2Right: false, p2Jump: false },
    climberP1: { x: 400, y: 480, vx: 0, vy: 0, width: 20, height: 28, isGrounded: false },
    climberP2: { x: 500, y: 480, vx: 0, vy: 0, width: 20, height: 28, isGrounded: false },
    platforms: [] as ZenithPlatform[],
    orbs: [] as ZenithOrb[],
    cameraY: 0,
    gravity: 0.45,
  });

  useEffect(() => {
    try {
      const q = query(collection(db, "zenith_leaderboard"), orderBy("score", "desc"), limit(5));
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
      await addDoc(collection(db, "zenith_leaderboard"), {
        name: playerName.trim().substring(0, 12),
        score: scoreP1,
        createdAt: new Date(),
      });
    } catch (e) {
      console.warn("Score submission error:", e);
    }
  };

  const startGame = (selectedMode: ZenithMode) => {
    audioSynth.init();
    setMode(selectedMode);
    setScoreP1(0);
    setScoreP2(0);
    setWinnerName(null);

    const initialPlatforms: ZenithPlatform[] = [
      { x: 350, y: 520, width: 120, height: 16, type: "normal", vx: 0 },
      { x: 200, y: 420, width: 100, height: 16, type: "normal", vx: 0 },
      { x: 500, y: 320, width: 100, height: 16, type: "moving", vx: 2 },
      { x: 300, y: 220, width: 90, height: 16, type: "normal", vx: 0 },
      { x: 450, y: 120, width: 80, height: 16, type: "fragile", vx: 0 },
    ];

    engineRef.current = {
      keys: { p1Left: false, p1Right: false, p1Jump: false, p2Left: false, p2Right: false, p2Jump: false },
      climberP1: { x: 400, y: 480, vx: 0, vy: 0, width: 20, height: 28, isGrounded: false },
      climberP2: { x: 500, y: 480, vx: 0, vy: 0, width: 20, height: 28, isGrounded: false },
      platforms: initialPlatforms,
      orbs: [],
      cameraY: 0,
      gravity: 0.45,
    };

    setGameState("playing");
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (gameState !== "playing") return;
      if (e.key === "a" || e.key === "A") engineRef.current.keys.p1Left = true;
      if (e.key === "d" || e.key === "D") engineRef.current.keys.p1Right = true;
      if (e.key === "w" || e.key === "W" || e.key === " ") engineRef.current.keys.p1Jump = true;
      if (e.key === "ArrowLeft") engineRef.current.keys.p2Left = true;
      if (e.key === "ArrowRight") engineRef.current.keys.p2Right = true;
      if (e.key === "ArrowUp") engineRef.current.keys.p2Jump = true;
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === "a" || e.key === "A") engineRef.current.keys.p1Left = false;
      if (e.key === "d" || e.key === "D") engineRef.current.keys.p1Right = false;
      if (e.key === "w" || e.key === "W" || e.key === " ") engineRef.current.keys.p1Jump = false;
      if (e.key === "ArrowLeft") engineRef.current.keys.p2Left = false;
      if (e.key === "ArrowRight") engineRef.current.keys.p2Right = false;
      if (e.key === "ArrowUp") engineRef.current.keys.p2Jump = false;
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

    let p1MaxHeight = 0;
    let p2MaxHeight = 0;

    const loop = () => {
      const state = engineRef.current;
      const c1 = state.climberP1;
      const c2 = state.climberP2;

      // P1 Movement & Jump
      if (state.keys.p1Left) c1.vx = -5;
      else if (state.keys.p1Right) c1.vx = 5;
      else c1.vx *= 0.85;

      if (state.keys.p1Jump && c1.isGrounded) {
        c1.vy = -12;
        c1.isGrounded = false;
        audioSynth.playJump();
      }

      c1.vy += state.gravity;
      c1.x += c1.vx;
      c1.y += c1.vy;
      c1.x = Math.max(10, Math.min(790, c1.x));

      // P2 Movement & Jump (if 2P mode)
      if (mode === "apex_climb_duel") {
        if (state.keys.p2Left) c2.vx = -5;
        else if (state.keys.p2Right) c2.vx = 5;
        else c2.vx *= 0.85;

        if (state.keys.p2Jump && c2.isGrounded) {
          c2.vy = -12;
          c2.isGrounded = false;
          audioSynth.playJump();
        }

        c2.vy += state.gravity;
        c2.x += c2.vx;
        c2.y += c2.vy;
        c2.x = Math.max(10, Math.min(790, c2.x));
      }

      // Update Moving Platforms
      state.platforms.forEach((p) => {
        if (p.type === "moving") {
          p.x += p.vx;
          if (p.x < 50 || p.x > 650) p.vx *= -1;
        }

        // P1 Platform Landing Test
        if (
          c1.vy > 0 &&
          c1.x > p.x &&
          c1.x < p.x + p.width &&
          c1.y + c1.height / 2 >= p.y &&
          c1.y + c1.height / 2 <= p.y + p.height + 6
        ) {
          c1.y = p.y - c1.height / 2;
          c1.vy = 0;
          c1.isGrounded = true;
        }

        // P2 Platform Landing Test
        if (
          mode === "apex_climb_duel" &&
          c2.vy > 0 &&
          c2.x > p.x &&
          c2.x < p.x + p.width &&
          c2.y + c2.height / 2 >= p.y &&
          c2.y + c2.height / 2 <= p.y + p.height + 6
        ) {
          c2.y = p.y - c2.height / 2;
          c2.vy = 0;
          c2.isGrounded = true;
        }
      });

      // Update Camera & Heights
      const currentHeightP1 = Math.floor((520 - c1.y) * 2);
      if (currentHeightP1 > p1MaxHeight) {
        p1MaxHeight = currentHeightP1;
        setScoreP1(p1MaxHeight);
      }

      if (mode === "apex_climb_duel") {
        const currentHeightP2 = Math.floor((520 - c2.y) * 2);
        if (currentHeightP2 > p2MaxHeight) {
          p2MaxHeight = currentHeightP2;
          setScoreP2(p2MaxHeight);
        }
      }

      // Procedurally Generate Ascent Platforms
      const highestPlatY = Math.min(...state.platforms.map((p) => p.y));
      if (highestPlatY > -100) {
        const types: ("normal" | "moving" | "fragile")[] = ["normal", "moving", "fragile"];
        state.platforms.push({
          x: 60 + Math.random() * 640,
          y: highestPlatY - 100,
          width: 80 + Math.random() * 40,
          height: 16,
          type: types[Math.floor(Math.random() * 3)],
          vx: 2,
        });
      }

      // Check Fall Out of Bounds
      if (c1.y > 640) {
        audioSynth.playFallImpact();
        if (mode === "apex_climb_duel") setWinnerName("PLAYER 2");
        setGameState("game_over");
        return;
      }

      if (mode === "apex_climb_duel" && c2.y > 640) {
        audioSynth.playFallImpact();
        setWinnerName("PLAYER 1");
        setGameState("game_over");
        return;
      }

      // --- RENDERING ---
      ctx.fillStyle = "#030c14";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Render Platforms
      state.platforms.forEach((p) => {
        ctx.fillStyle = p.type === "moving" ? "#06b6d4" : p.type === "fragile" ? "#f43f5e" : "#10b981";
        ctx.shadowColor = ctx.fillStyle;
        ctx.shadowBlur = 10;
        ctx.fillRect(p.x, p.y, p.width, p.height);
      });
      ctx.shadowBlur = 0;

      // Render Player 1 Climber
      ctx.fillStyle = "#34d399";
      ctx.shadowColor = "#34d399";
      ctx.shadowBlur = 16;
      ctx.fillRect(c1.x - c1.width / 2, c1.y - c1.height / 2, c1.width, c1.height);

      // Render Player 2 Climber (if 2P mode)
      if (mode === "apex_climb_duel") {
        ctx.fillStyle = "#38bdf8";
        ctx.shadowColor = "#38bdf8";
        ctx.shadowBlur = 16;
        ctx.fillRect(c2.x - c2.width / 2, c2.y - c2.height / 2, c2.width, c2.height);
      }
      ctx.shadowBlur = 0;

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [gameState, mode]);

  return (
    <div className="relative w-full h-screen bg-[#010910] text-white flex flex-col items-center justify-center font-sans overflow-hidden select-none">
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
      <div className="relative w-full max-w-4xl aspect-[4/3] bg-[#021422] rounded-3xl border border-emerald-500/30 overflow-hidden shadow-[0_0_60px_rgba(16,185,129,0.15)] flex flex-col justify-center items-center">
        <canvas ref={canvasRef} width={800} height={600} className="w-full h-full object-contain" />

        {/* Dynamic HUD */}
        {gameState === "playing" && (
          <div className="absolute top-6 inset-x-6 z-20 flex justify-between items-start pointer-events-none">
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-black/60 border border-emerald-500/40 text-emerald-300 font-mono text-xs backdrop-blur-md">
                <Mountain className="w-3.5 h-3.5 text-emerald-400" /> P1 APEX ALTITUDE: {scoreP1}m
              </div>
              {mode === "apex_climb_duel" && (
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-black/60 border border-cyan-500/40 text-cyan-300 font-mono text-xs backdrop-blur-md">
                  <Mountain className="w-3.5 h-3.5 text-cyan-400" /> P2 APEX ALTITUDE: {scoreP2}m
                </div>
              )}
            </div>

            <div className="px-4 py-2 rounded-2xl bg-black/60 border border-emerald-500/40 backdrop-blur-md text-right">
              <div className="text-[10px] font-mono text-emerald-400/70 uppercase">ZENITH PEAK</div>
              <div className="text-2xl font-black font-mono text-emerald-300">{scoreP1}m</div>
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
                ←
              </button>
              <button
                onTouchStart={() => (engineRef.current.keys.p1Right = true)}
                onTouchEnd={() => (engineRef.current.keys.p1Right = false)}
                className="w-14 h-14 rounded-2xl bg-white/10 border border-white/20 active:bg-emerald-500/30 flex items-center justify-center font-bold text-lg"
              >
                →
              </button>
            </div>
            <button
              onTouchStart={() => (engineRef.current.keys.p1Jump = true)}
              onTouchEnd={() => (engineRef.current.keys.p1Jump = false)}
              className="w-20 h-20 rounded-full bg-gradient-to-tr from-emerald-500 to-cyan-500 border border-emerald-300 active:scale-95 flex items-center justify-center font-black text-xs uppercase text-black shadow-lg"
            >
              JUMP
            </button>
          </div>
        )}

        {/* Menu Overlay */}
        {gameState === "menu" && (
          <div className="absolute inset-0 z-40 bg-[#01111c]/90 backdrop-blur-2xl flex flex-col items-center justify-center p-6 overflow-y-auto">
            <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-emerald-600/20 rounded-full blur-[120px] pointer-events-none animate-pulse" />

            <motion.div
              initial={{ scale: 0.88, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              className="text-center max-w-2xl mb-8 z-10"
            >
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-black uppercase tracking-widest mb-4 shadow-[0_0_20px_rgba(16,185,129,0.2)]">
                <Zap className="w-4 h-4 text-emerald-400 animate-bounce" /> High-Altitude Orbital Apex Platformer
              </div>

              <h1 className="text-7xl md:text-8xl font-black uppercase tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-emerald-300 via-teal-300 to-cyan-400 drop-shadow-[0_0_40px_rgba(16,185,129,0.6)]">
                ZENITH
              </h1>
              <p className="text-base text-emerald-100/70 mt-4 max-w-lg mx-auto leading-relaxed">
                Ascend procedural orbital platforms to reach peak zenith altitude without misstepping into the abyss.
              </p>

              <div className="flex justify-center gap-3 mt-4">
                <span className="px-3 py-1 rounded-md bg-white/5 border border-white/10 text-[10px] font-mono text-emerald-300">1P / 2P MODES</span>
                <span className="px-3 py-1 rounded-md bg-white/5 border border-white/10 text-[10px] font-mono text-teal-300">ONLINE LEADERBOARD</span>
                <span className="px-3 py-1 rounded-md bg-white/5 border border-white/10 text-[10px] font-mono text-cyan-300">TOUCH READY</span>
              </div>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-xl w-full z-10">
              <button
                onClick={() => startGame("orbital_ascent")}
                className="group relative p-6 rounded-3xl bg-white/5 border border-emerald-500/30 hover:border-emerald-400 hover:bg-emerald-500/10 flex flex-col items-center gap-3 transition-all duration-300 text-center backdrop-blur-md shadow-lg hover:shadow-[0_0_30px_rgba(16,185,129,0.3)] active:scale-95"
              >
                <User className="w-8 h-8 text-emerald-400 group-hover:scale-110 transition-transform" />
                <div>
                  <div className="font-black text-xl uppercase tracking-wider text-white">ORBITAL ASCENT</div>
                  <div className="text-xs text-emerald-200/60 mt-1">Single player high-altitude climbing trial</div>
                </div>
              </button>

              <button
                onClick={() => startGame("apex_climb_duel")}
                className="group relative p-6 rounded-3xl bg-white/5 border border-cyan-500/30 hover:border-cyan-400 hover:bg-cyan-500/10 flex flex-col items-center gap-3 transition-all duration-300 text-center backdrop-blur-md shadow-lg hover:shadow-[0_0_30px_rgba(6,182,212,0.3)] active:scale-95"
              >
                <Users className="w-8 h-8 text-cyan-400 group-hover:scale-110 transition-transform" />
                <div>
                  <div className="font-black text-xl uppercase tracking-wider text-white">APEX DUEL</div>
                  <div className="text-xs text-cyan-200/60 mt-1">2-Player competitive vertical race</div>
                </div>
              </button>
            </div>

            <div className="mt-8 z-10 flex flex-wrap items-center justify-center gap-6 text-xs text-white/50 bg-black/40 px-6 py-3 rounded-2xl border border-white/10">
              <div className="flex items-center gap-2">
                <span className="font-mono text-emerald-300 bg-white/10 px-2 py-0.5 rounded border border-white/10 font-bold">A / D</span>
                <span>Steer Climber</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-teal-300 bg-white/10 px-2 py-0.5 rounded border border-white/10 font-bold">W / SPACE</span>
                <span>Ascend Jump</span>
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
              className="text-center max-w-md w-full bg-slate-900/90 border border-emerald-500/40 p-8 rounded-3xl shadow-[0_0_50px_rgba(16,185,129,0.3)] relative overflow-hidden"
            >
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-bold uppercase tracking-wider mb-4">
                <Trophy className="w-3.5 h-3.5 text-emerald-400" /> Apex Ascent Finished
              </div>

              <h2 className="text-4xl font-black uppercase text-transparent bg-clip-text bg-gradient-to-r from-emerald-300 to-cyan-300 mb-2">
                {winnerName ? `${winnerName} VICTORIOUS!` : "FELL FROM ZENITH"}
              </h2>
              <p className="text-xs text-emerald-200/60 mb-6">Zenith Peak Altitude Results</p>

              <div className="p-4 rounded-2xl bg-white/5 border border-white/10 mb-6">
                <div className="text-[10px] text-white/40 font-black uppercase">MAX ALTITUDE</div>
                <div className="text-3xl font-black text-emerald-300">{scoreP1}m</div>
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
