"use client";

import React, { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import {
  Trophy,
  Volume2,
  VolumeX,
  ArrowLeft,
  Terminal,
  Cpu,
} from "lucide-react";
import Link from "next/link";
import { db } from "@/lib/firebase";
import { collection, addDoc, query, orderBy, limit, onSnapshot } from "firebase/firestore";

// --- AUDIO SYNTHESIZER ---
class GlitchAudioSynth {
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
    osc.type = "square";
    osc.frequency.setValueAtTime(150, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(600, this.ctx.currentTime + 0.12);
    gain.gain.setValueAtTime(0.12, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.12);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.12);
  }

  playDefrag() {
    if (this.muted || !this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(800, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(200, this.ctx.currentTime + 0.25);
    gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.25);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.25);
  }

  playCollect() {
    if (this.muted || !this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(523.25, this.ctx.currentTime);
    osc.frequency.setValueAtTime(659.25, this.ctx.currentTime + 0.08);
    osc.frequency.setValueAtTime(783.99, this.ctx.currentTime + 0.16);
    gain.gain.setValueAtTime(0.15, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.24);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.24);
  }

  playHit() {
    if (this.muted || !this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(100, this.ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(30, this.ctx.currentTime + 0.3);
    gain.gain.setValueAtTime(0.25, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.3);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.3);
  }
}

const audioSynth = new GlitchAudioSynth();

interface LeaderboardEntry {
  id: string;
  name: string;
  score: number;
}

interface Platform {
  x: number;
  y: number;
  width: number;
  height: number;
  glitching: boolean;
  vx: number;
}

interface MemoryNode {
  x: number;
  y: number;
  collected: boolean;
  type: "data" | "defrag_charge";
}

interface VirusBug {
  x: number;
  y: number;
  vx: number;
  radius: number;
}

export default function GlitchGame() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [gameState, setGameState] = useState<"menu" | "playing" | "game_over">("menu");
  const [score, setScore] = useState(0);
  const [defragCharges, setDefragCharges] = useState(3);
  const [integrity, setIntegrity] = useState(100);
  const [muted, setMuted] = useState(false);
  const [, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [playerName, setPlayerName] = useState("");
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
    keys: { left: false, right: false, up: false, defrag: false },
    player: {
      x: 100,
      y: 400,
      vx: 0,
      vy: 0,
      width: 24,
      height: 32,
      grounded: false,
    },
    platforms: [] as Platform[],
    nodes: [] as MemoryNode[],
    viruses: [] as VirusBug[],
    particles: [] as { x: number; y: number; vx: number; vy: number; color: string; life: number }[],
    cameraY: 0,
    maxHeight: 0,
    defragActive: false,
    defragRadius: 0,
  });

  useEffect(() => {
    try {
      const q = query(collection(db, "glitch_leaderboard"), orderBy("score", "desc"), limit(5));
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
    if (!playerName.trim() || score <= 0) return;
    try {
      await addDoc(collection(db, "glitch_leaderboard"), {
        name: playerName.trim().substring(0, 12),
        score: score,
        createdAt: new Date(),
      });
    } catch (e) {
      console.warn("Score submission error:", e);
    }
  };

  const startGame = () => {
    audioSynth.init();
    setScore(0);
    setDefragCharges(3);
    setIntegrity(100);

    const initialPlatforms: Platform[] = [
      { x: 50, y: 550, width: 700, height: 20, glitching: false, vx: 0 },
      { x: 100, y: 440, width: 140, height: 16, glitching: false, vx: 0 },
      { x: 350, y: 350, width: 150, height: 16, glitching: true, vx: 1.5 },
      { x: 180, y: 250, width: 120, height: 16, glitching: false, vx: -1.2 },
      { x: 500, y: 160, width: 160, height: 16, glitching: false, vx: 0 },
    ];

    engineRef.current = {
      keys: { left: false, right: false, up: false, defrag: false },
      player: {
        x: 200,
        y: 450,
        vx: 0,
        vy: 0,
        width: 24,
        height: 32,
        grounded: false,
      },
      platforms: initialPlatforms,
      nodes: [
        { x: 150, y: 400, collected: false, type: "data" },
        { x: 400, y: 310, collected: false, type: "data" },
        { x: 220, y: 210, collected: false, type: "defrag_charge" },
      ],
      viruses: [
        { x: 360, y: 330, vx: 1.5, radius: 12 },
        { x: 520, y: 140, vx: -1.8, radius: 12 },
      ],
      particles: [],
      cameraY: 0,
      maxHeight: 0,
      defragActive: false,
      defragRadius: 0,
    };

    setGameState("playing");
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (gameState !== "playing") return;
      if (e.key === "ArrowLeft" || e.key === "a" || e.key === "A") engineRef.current.keys.left = true;
      if (e.key === "ArrowRight" || e.key === "d" || e.key === "D") engineRef.current.keys.right = true;
      if (e.key === "ArrowUp" || e.key === "w" || e.key === "W" || e.key === " ") engineRef.current.keys.up = true;
      if (e.key === "e" || e.key === "E" || e.key === "Shift") triggerDefrag();
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft" || e.key === "a" || e.key === "A") engineRef.current.keys.left = false;
      if (e.key === "ArrowRight" || e.key === "d" || e.key === "D") engineRef.current.keys.right = false;
      if (e.key === "ArrowUp" || e.key === "w" || e.key === "W" || e.key === " ") engineRef.current.keys.up = false;
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [gameState]);

  const triggerDefrag = () => {
    if (defragCharges <= 0 || engineRef.current.defragActive) return;
    setDefragCharges((prev) => prev - 1);
    audioSynth.playDefrag();
    engineRef.current.defragActive = true;
    engineRef.current.defragRadius = 10;
  };

  // --- GAME LOOP ---
  useEffect(() => {
    if (gameState !== "playing") return;
    let animId: number;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let localIntegrity = 100;

    const loop = () => {
      const state = engineRef.current;
      const player = state.player;

      // Player Movement Physics
      if (state.keys.left) player.vx = -4.5;
      else if (state.keys.right) player.vx = 4.5;
      else player.vx *= 0.82;

      if (state.keys.up && player.grounded) {
        player.vy = -11.5;
        player.grounded = false;
        audioSynth.playJump();
      }

      player.vy += 0.48; // gravity
      player.x += player.vx;
      player.y += player.vy;

      // Platform Collisions
      player.grounded = false;
      state.platforms.forEach((plat) => {
        plat.x += plat.vx;
        if (plat.x < 30 || plat.x + plat.width > 770) plat.vx *= -1;

        if (
          player.vy >= 0 &&
          player.x + player.width > plat.x &&
          player.x < plat.x + plat.width &&
          player.y + player.height >= plat.y &&
          player.y + player.height <= plat.y + plat.height + player.vy
        ) {
          player.y = plat.y - player.height;
          player.vy = 0;
          player.grounded = true;
          player.x += plat.vx; // ride moving platform
        }
      });

      // Camera Scrolling
      const targetCamY = player.y - 300;
      if (targetCamY < state.cameraY) {
        state.cameraY += (targetCamY - state.cameraY) * 0.1;
      }

      // Track height score
      const currentHeight = Math.floor(-player.y + 450);
      if (currentHeight > state.maxHeight) {
        state.maxHeight = currentHeight;
        setScore((prev) => Math.max(prev, currentHeight * 10));
      }

      // Generate Infinite Level Procedurally
      const highestPlatY = Math.min(...state.platforms.map((p) => p.y));
      if (highestPlatY > state.cameraY - 200) {
        const newY = highestPlatY - (80 + Math.random() * 60);
        const newW = 100 + Math.random() * 80;
        const newX = 50 + Math.random() * (700 - newW);
        const isGlitch = Math.random() > 0.6;
        const speed = isGlitch ? (Math.random() - 0.5) * 3 : 0;

        state.platforms.push({
          x: newX,
          y: newY,
          width: newW,
          height: 16,
          glitching: isGlitch,
          vx: speed,
        });

        // Spawn Nodes or Viruses
        if (Math.random() > 0.4) {
          state.nodes.push({
            x: newX + newW / 2,
            y: newY - 24,
            collected: false,
            type: Math.random() > 0.8 ? "defrag_charge" : "data",
          });
        }
        if (Math.random() > 0.5) {
          state.viruses.push({
            x: newX + 20,
            y: newY - 14,
            vx: (Math.random() > 0.5 ? 1 : -1) * 1.5,
            radius: 12,
          });
        }
      }

      // Defrag Pulse Wave Expansion
      if (state.defragActive) {
        state.defragRadius += 14;
        state.viruses = state.viruses.filter((v) => {
          const dx = v.x - (player.x + player.width / 2);
          const dy = v.y - (player.y + player.height / 2);
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < state.defragRadius) {
            // Destroy virus
            for (let i = 0; i < 8; i++) {
              state.particles.push({
                x: v.x,
                y: v.y,
                vx: (Math.random() - 0.5) * 6,
                vy: (Math.random() - 0.5) * 6,
                color: "#10b981",
                life: 20,
              });
            }
            return false;
          }
          return true;
        });

        if (state.defragRadius > 250) {
          state.defragActive = false;
        }
      }

      // Memory Node Collection
      state.nodes.forEach((node) => {
        if (!node.collected) {
          const dx = node.x - (player.x + player.width / 2);
          const dy = node.y - (player.y + player.height / 2);
          if (Math.sqrt(dx * dx + dy * dy) < 24) {
            node.collected = true;
            audioSynth.playCollect();
            if (node.type === "defrag_charge") {
              setDefragCharges((prev) => Math.min(prev + 1, 5));
            } else {
              setScore((prev) => prev + 250);
            }
          }
        }
      });

      // Virus Collisions
      state.viruses.forEach((virus) => {
        virus.x += virus.vx;
        if (virus.x < 50 || virus.x > 750) virus.vx *= -1;

        const dx = virus.x - (player.x + player.width / 2);
        const dy = virus.y - (player.y + player.height / 2);
        if (Math.sqrt(dx * dx + dy * dy) < virus.radius + 14) {
          localIntegrity -= 1.2;
          setIntegrity((prev) => Math.max(0, Math.floor(prev - 1.2)));
          audioSynth.playHit();
        }
      });

      // Fall off bottom screen or integrity depleted
      if (player.y > state.cameraY + 650 || localIntegrity <= 0) {
        setGameState("game_over");
        return;
      }

      // --- RENDERING ---
      ctx.fillStyle = "#040914";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.save();
      ctx.translate(0, -state.cameraY);

      // Render Matrix Grid Background Lines
      ctx.strokeStyle = "rgba(16, 185, 129, 0.05)";
      ctx.lineWidth = 1;
      for (let x = 0; x < canvas.width; x += 40) {
        ctx.beginPath();
        ctx.moveTo(x, state.cameraY);
        ctx.lineTo(x, state.cameraY + canvas.height);
        ctx.stroke();
      }

      // Draw Platforms
      state.platforms.forEach((plat) => {
        if (plat.glitching) {
          ctx.fillStyle = "#a855f7";
          ctx.shadowColor = "#a855f7";
          ctx.shadowBlur = 12;
        } else {
          ctx.fillStyle = "#10b981";
          ctx.shadowColor = "#10b981";
          ctx.shadowBlur = 8;
        }
        ctx.fillRect(plat.x, plat.y, plat.width, plat.height);
      });
      ctx.shadowBlur = 0;

      // Draw Memory Nodes
      state.nodes.forEach((node) => {
        if (!node.collected) {
          ctx.beginPath();
          ctx.arc(node.x, node.y, 8, 0, Math.PI * 2);
          ctx.fillStyle = node.type === "defrag_charge" ? "#f59e0b" : "#38bdf8";
          ctx.shadowColor = ctx.fillStyle;
          ctx.shadowBlur = 10;
          ctx.fill();
        }
      });

      // Draw Viruses
      state.viruses.forEach((v) => {
        ctx.beginPath();
        ctx.arc(v.x, v.y, v.radius, 0, Math.PI * 2);
        ctx.fillStyle = "#ef4444";
        ctx.shadowColor = "#ef4444";
        ctx.shadowBlur = 12;
        ctx.fill();
      });

      // Draw Defrag Pulse Wave
      if (state.defragActive) {
        ctx.beginPath();
        ctx.arc(player.x + player.width / 2, player.y + player.height / 2, state.defragRadius, 0, Math.PI * 2);
        ctx.strokeStyle = "rgba(16, 185, 129, 0.8)";
        ctx.lineWidth = 4;
        ctx.stroke();
      }

      // Draw Particles
      state.particles.forEach((p, idx) => {
        p.x += p.vx;
        p.y += p.vy;
        p.life--;
        ctx.fillStyle = p.color;
        ctx.fillRect(p.x, p.y, 3, 3);
        if (p.life <= 0) state.particles.splice(idx, 1);
      });

      // Draw Player Core Avatar
      ctx.fillStyle = "#ffffff";
      ctx.shadowColor = "#38bdf8";
      ctx.shadowBlur = 14;
      ctx.fillRect(player.x, player.y, player.width, player.height);

      ctx.restore();

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [gameState]);

  return (
    <div className="relative w-full h-screen bg-[#02050b] text-white flex flex-col items-center justify-center font-sans overflow-hidden select-none">
      {/* Top Header Bar */}
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
      <div className="relative w-full max-w-4xl aspect-[4/3] bg-[#040914] rounded-3xl border border-emerald-500/30 overflow-hidden shadow-[0_0_60px_rgba(16,185,129,0.15)] flex flex-col justify-center items-center">
        <canvas ref={canvasRef} width={800} height={600} className="w-full h-full object-contain" />

        {/* Dynamic Playing HUD */}
        {gameState === "playing" && (
          <div className="absolute top-6 inset-x-6 z-20 flex justify-between items-start pointer-events-none">
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-black/60 border border-emerald-500/40 text-emerald-300 font-mono text-xs backdrop-blur-md">
                <Terminal className="w-3.5 h-3.5" /> DEFRAG PULSES: {defragCharges}
              </div>
              <div className="w-48 bg-black/60 border border-white/10 p-1.5 rounded-xl backdrop-blur-md">
                <div className="flex justify-between text-[10px] font-mono mb-1 text-white/70">
                  <span>SYSTEM INTEGRITY</span>
                  <span>{Math.max(0, Math.floor(integrity))}%</span>
                </div>
                <div className="w-full bg-white/10 h-2 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-red-500 via-amber-400 to-emerald-400 transition-all duration-200"
                    style={{ width: `${Math.max(0, integrity)}%` }}
                  />
                </div>
              </div>
            </div>

            <div className="px-4 py-2 rounded-2xl bg-black/60 border border-emerald-500/40 backdrop-blur-md text-right">
              <div className="text-[10px] font-mono text-emerald-400/70 uppercase">DATA SCORE</div>
              <div className="text-2xl font-black font-mono text-emerald-300">{score}</div>
            </div>
          </div>
        )}

        {/* Small Touch Screen Controls */}
        {gameState === "playing" && isMobileScreen && (
          <div className="absolute bottom-6 inset-x-6 flex justify-between items-center z-30 pointer-events-auto">
            <div className="flex gap-2">
              <button
                onTouchStart={() => (engineRef.current.keys.left = true)}
                onTouchEnd={() => (engineRef.current.keys.left = false)}
                className="w-14 h-14 rounded-2xl bg-white/10 border border-white/20 active:bg-emerald-500/30 flex items-center justify-center font-bold text-lg"
              >
                ←
              </button>
              <button
                onTouchStart={() => (engineRef.current.keys.right = true)}
                onTouchEnd={() => (engineRef.current.keys.right = false)}
                className="w-14 h-14 rounded-2xl bg-white/10 border border-white/20 active:bg-emerald-500/30 flex items-center justify-center font-bold text-lg"
              >
                →
              </button>
            </div>
            <div className="flex gap-2">
              <button
                onClick={triggerDefrag}
                className="w-14 h-14 rounded-2xl bg-emerald-500/20 border border-emerald-400/40 active:bg-emerald-500 flex items-center justify-center font-bold text-xs"
              >
                PULSE
              </button>
              <button
                onTouchStart={() => (engineRef.current.keys.up = true)}
                onTouchEnd={() => (engineRef.current.keys.up = false)}
                className="w-16 h-16 rounded-2xl bg-emerald-500 border border-emerald-300 active:scale-95 flex items-center justify-center font-black text-sm uppercase text-black"
              >
                JUMP
              </button>
            </div>
          </div>
        )}

        {/* Menu Overlay */}
        {gameState === "menu" && (
          <div className="absolute inset-0 z-40 bg-[#020612]/90 backdrop-blur-2xl flex flex-col items-center justify-center p-6 overflow-y-auto">
            <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-emerald-600/20 rounded-full blur-[120px] pointer-events-none animate-pulse" />

            <motion.div
              initial={{ scale: 0.88, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              className="text-center max-w-2xl mb-8 z-10"
            >
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-black uppercase tracking-widest mb-4 shadow-[0_0_20px_rgba(16,185,129,0.2)]">
                <Cpu className="w-4 h-4 text-emerald-400 animate-spin" style={{ animationDuration: "10s" }} /> Cybernetic Stream Repair Protocol
              </div>

              <h1 className="text-7xl md:text-8xl font-black uppercase tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-emerald-300 via-teal-300 to-cyan-400 drop-shadow-[0_0_40px_rgba(16,185,129,0.6)]">
                GLITCH
              </h1>
              <p className="text-base text-emerald-100/70 mt-4 max-w-lg mx-auto leading-relaxed">
                Ascend corrupted data streams, leap across unstable glitch platforms, collect data fragments, and release defrag EMP pulses.
              </p>

              <div className="flex justify-center gap-3 mt-4">
                <span className="px-3 py-1 rounded-md bg-white/5 border border-white/10 text-[10px] font-mono text-emerald-300">SINGLE PLAYER</span>
                <span className="px-3 py-1 rounded-md bg-white/5 border border-white/10 text-[10px] font-mono text-teal-300">ONLINE LEADERBOARD</span>
                <span className="px-3 py-1 rounded-md bg-white/5 border border-white/10 text-[10px] font-mono text-cyan-300">TOUCH READY</span>
              </div>
            </motion.div>

            <button
              onClick={startGame}
              className="group px-10 py-5 rounded-3xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-black font-black text-xl uppercase tracking-wider shadow-[0_0_40px_rgba(16,185,129,0.4)] active:scale-95 transition-all z-10"
            >
              INITIALIZE REPAIR
            </button>

            <div className="mt-8 z-10 flex flex-wrap items-center justify-center gap-6 text-xs text-white/50 bg-black/40 px-6 py-3 rounded-2xl border border-white/10">
              <div className="flex items-center gap-2">
                <span className="font-mono text-emerald-300 bg-white/10 px-2 py-0.5 rounded border border-white/10 font-bold">WASD / ARROWS</span>
                <span>Move & Jump</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-teal-300 bg-white/10 px-2 py-0.5 rounded border border-white/10 font-bold">E / SHIFT</span>
                <span>Defrag EMP Pulse</span>
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
                <Trophy className="w-3.5 h-3.5 text-amber-400" /> Data Stream Terminated
              </div>

              <h2 className="text-4xl font-black uppercase text-transparent bg-clip-text bg-gradient-to-r from-emerald-300 to-teal-300 mb-2">
                SYSTEM CORRUPTED
              </h2>
              <p className="text-xs text-emerald-200/60 mb-6">Defrag Stream Repair Results</p>

              <div className="p-4 rounded-2xl bg-white/5 border border-white/10 mb-6">
                <div className="text-[10px] text-white/40 font-black uppercase">FINAL DATA SCORE</div>
                <div className="text-3xl font-black text-emerald-300">{score}</div>
              </div>

              <div className="mb-6 flex gap-2">
                <input
                  type="text"
                  placeholder="Enter Pilot Name"
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
                  onClick={startGame}
                  className="flex-1 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-black font-black uppercase tracking-wider shadow-[0_0_20px_rgba(16,185,129,0.4)] active:scale-95 transition-all"
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
