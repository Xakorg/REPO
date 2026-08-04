"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Lock,
  Unlock,
  Shield,
  Zap,
  Volume2,
  VolumeX,
  Play,
  Pause,
  RotateCcw,
  Sparkles,
  Users,
  User,
  Globe,
  Trophy,
  ArrowLeft,
  Activity,
  Radio,
  Cpu,
  Terminal,
  AlertTriangle,
  Code
} from "lucide-react";
import Link from "next/link";
import { useUser, useFirestore, setDocumentNonBlocking } from "@/firebase";
import { doc, increment } from "firebase/firestore";

// ==========================================
// CIPHER GAME TYPES
// ==========================================

export type CipherMode = "single_infiltration" | "local_hacker_duel";

export interface DecryptionNode {
  id: string;
  x: number;
  y: number;
  radius: number;
  keySequence: number[];
  currentStep: number;
  encrypted: boolean;
  owner: "neutral" | "p1" | "p2";
  color: string;
  angle: number;
}

export interface FirewallBeam {
  id: string;
  cx: number;
  cy: number;
  length: number;
  angle: number;
  speed: number;
  damage: number;
}

// ==========================================
// WEB AUDIO SYNTHESIZER
// ==========================================

class CipherAudioSynth {
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

  playDataPulse() {
    if (this.muted || !this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(800, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1400, this.ctx.currentTime + 0.08);

      gain.gain.setValueAtTime(0.15, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.08);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.08);
    } catch (e) {}
  }

  playNodeUnlocked() {
    if (this.muted || !this.ctx) return;
    try {
      [523.25, 659.25, 783.99, 1046.5].forEach((freq, i) => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();
        osc.type = "triangle";
        osc.frequency.setValueAtTime(freq, this.ctx!.currentTime + i * 0.06);

        gain.gain.setValueAtTime(0.2, this.ctx!.currentTime + i * 0.06);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx!.currentTime + i * 0.06 + 0.15);

        osc.connect(gain);
        gain.connect(this.ctx!.destination);
        osc.start(this.ctx!.currentTime + i * 0.06);
        osc.stop(this.ctx!.currentTime + i * 0.06 + 0.15);
      });
    } catch (e) {}
  }

  playFirewallAlarm() {
    if (this.muted || !this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(250, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(100, this.ctx.currentTime + 0.2);

      gain.gain.setValueAtTime(0.25, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.2);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.2);
    } catch (e) {}
  }
}

const audio = new CipherAudioSynth();

// ==========================================
// CIPHER GAME COMPONENT
// ==========================================

export default function CipherGame() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const { user } = useUser();
  const firestore = useFirestore();

  const [gameState, setGameState] = useState<"menu" | "playing" | "paused" | "game_over">("menu");
  const [mode, setMode] = useState<CipherMode>("single_infiltration");
  const [soundEnabled, setSoundEnabled] = useState(true);

  // HUD Metrics
  const [p1Integrity, setP1Integrity] = useState(100);
  const [p2Integrity, setP2Integrity] = useState(100);
  const [decryptedCount, setDecryptedCount] = useState(0);
  const [winnerName, setWinnerName] = useState<string | null>(null);

  const engineRef = useRef({
    keys: {
      w: false, a: false, s: false, d: false, space: false,
      up: false, left: false, down: false, right: false, enter: false
    },
    p1: {
      x: 150, y: 300, vx: 0, vy: 0, radius: 14, color: "#10b981", integrity: 100, score: 0
    },
    p2: {
      x: 850, y: 300, vx: 0, vy: 0, radius: 14, color: "#f43f5e", integrity: 100, score: 0
    },
    nodes: [] as DecryptionNode[],
    firewalls: [] as FirewallBeam[],
    particles: [] as any[]
  });

  const toggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    audio.muted = !next;
  };

  const dispatchScore = (finalScore: number) => {
    if (typeof window !== "undefined" && finalScore > 0) {
      const points = Math.floor(finalScore / 15) + 20;
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
            displayName: user.displayName || "Cipher Infiltrator",
            points: increment(points),
            updatedAt: new Date().toISOString()
          },
          { merge: true }
        );
      }
    }
  };

  const initCipherGrid = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const w = (canvas.width = canvas.parentElement?.clientWidth || window.innerWidth);
    const h = (canvas.height = canvas.parentElement?.clientHeight || window.innerHeight);

    const engine = engineRef.current;
    engine.p1 = { x: w * 0.15, y: h / 2, vx: 0, vy: 0, radius: 14, color: "#10b981", integrity: 100, score: 0 };
    engine.p2 = { x: w * 0.85, y: h / 2, vx: 0, vy: 0, radius: 14, color: "#f43f5e", integrity: 100, score: 0 };

    // Generate Matrix Nodes
    const nodes: DecryptionNode[] = [];
    const cols = 5;
    const rows = 3;
    const startX = w * 0.25;
    const startY = h * 0.25;
    const gapX = (w * 0.5) / (cols - 1);
    const gapY = (h * 0.5) / (rows - 1);

    let idCount = 1;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        nodes.push({
          id: `node_${idCount++}`,
          x: startX + c * gapX,
          y: startY + r * gapY,
          radius: 28,
          keySequence: [1, 2, 3],
          currentStep: 0,
          encrypted: true,
          owner: "neutral",
          color: "#64748b",
          angle: Math.random() * Math.PI * 2
        });
      }
    }

    // Firewalls
    const firewalls: FirewallBeam[] = [
      { id: "fw1", cx: w * 0.35, cy: h * 0.4, length: 110, angle: 0, speed: 0.02, damage: 0.8 },
      { id: "fw2", cx: w * 0.65, cy: h * 0.6, length: 110, angle: Math.PI, speed: -0.025, damage: 0.8 },
      { id: "fw3", cx: w * 0.5, cy: h * 0.5, length: 140, angle: Math.PI / 2, speed: 0.015, damage: 1.0 }
    ];

    engine.nodes = nodes;
    engine.firewalls = firewalls;
    engine.particles = [];

    setP1Integrity(100);
    setP2Integrity(100);
    setDecryptedCount(0);
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
      const canvas = canvasRef.current;
      if (!canvas) return;
      const w = canvas.width;
      const h = canvas.height;
      const engine = engineRef.current;
      const keys = engine.keys;

      // P1 Infiltrator Movement
      let p1dx = 0;
      let p1dy = 0;
      if (keys.a) p1dx -= 1;
      if (keys.d) p1dx += 1;
      if (keys.w) p1dy -= 1;
      if (keys.s) p1dy += 1;

      const p1 = engine.p1;
      p1.vx += (p1dx * 6.0 - p1.vx) * 0.25;
      p1.vy += (p1dy * 6.0 - p1.vy) * 0.25;
      p1.x = Math.max(p1.radius, Math.min(w - p1.radius, p1.x + p1.vx));
      p1.y = Math.max(p1.radius, Math.min(h - p1.radius, p1.y + p1.vy));

      // P2 Infiltrator Movement
      if (mode === "local_hacker_duel") {
        let p2dx = 0;
        let p2dy = 0;
        if (keys.left) p2dx -= 1;
        if (keys.right) p2dx += 1;
        if (keys.up) p2dy -= 1;
        if (keys.down) p2dy += 1;

        const p2 = engine.p2;
        p2.vx += (p2dx * 6.0 - p2.vx) * 0.25;
        p2.vy += (p2dy * 6.0 - p2.vy) * 0.25;
        p2.x = Math.max(p2.radius, Math.min(w - p2.radius, p2.x + p2.vx));
        p2.y = Math.max(p2.radius, Math.min(h - p2.radius, p2.y + p2.vy));
      }

      // Rotate Firewalls & Collision Check
      engine.firewalls.forEach(fw => {
        fw.angle += fw.speed;
        const x2 = fw.cx + Math.cos(fw.angle) * fw.length;
        const y2 = fw.cy + Math.sin(fw.angle) * fw.length;

        // P1 Hit
        if (distToSegment({ x: p1.x, y: p1.y }, { x: fw.cx, y: fw.cy }, { x: x2, y: y2 }) < p1.radius) {
          audio.playFirewallAlarm();
          p1.integrity = Math.max(0, p1.integrity - fw.damage);
          setP1Integrity(p1.integrity);
          if (p1.integrity <= 0) {
            setWinnerName(mode === "local_hacker_duel" ? "Hacker 2 (Red)" : "System Defense");
            setGameState("game_over");
          }
        }

        // P2 Hit
        if (mode === "local_hacker_duel") {
          const p2 = engine.p2;
          if (distToSegment({ x: p2.x, y: p2.y }, { x: fw.cx, y: fw.cy }, { x: x2, y: y2 }) < p2.radius) {
            audio.playFirewallAlarm();
            p2.integrity = Math.max(0, p2.integrity - fw.damage);
            setP2Integrity(p2.integrity);
            if (p2.integrity <= 0) {
              setWinnerName("Hacker 1 (Green)");
              dispatchScore(1800);
              setGameState("game_over");
            }
          }
        }
      });

      // Node Decryption Proximity Check
      let decrypted = 0;
      engine.nodes.forEach(node => {
        node.angle += 0.01;

        // P1 Decryption
        if (Math.hypot(p1.x - node.x, p1.y - node.y) < node.radius + p1.radius) {
          if (node.encrypted) {
            node.encrypted = false;
            node.owner = "p1";
            node.color = p1.color;
            audio.playNodeUnlocked();
            p1.score += 200;
          }
        }

        // P2 Decryption
        if (mode === "local_hacker_duel" && node.encrypted) {
          const p2 = engine.p2;
          if (Math.hypot(p2.x - node.x, p2.y - node.y) < node.radius + p2.radius) {
            node.encrypted = false;
            node.owner = "p2";
            node.color = p2.color;
            audio.playNodeUnlocked();
            p2.score += 200;
          }
        }

        if (!node.encrypted) decrypted++;
      });

      setDecryptedCount(decrypted);

      if (decrypted === engine.nodes.length) {
        if (mode === "single_infiltration") {
          setWinnerName("Infiltration Successful");
          dispatchScore(p1.score + 1000);
        } else {
          setWinnerName(p1.score >= engine.p2.score ? "Hacker 1 (Green)" : "Hacker 2 (Red)");
          dispatchScore(Math.max(p1.score, engine.p2.score));
        }
        setGameState("game_over");
      }
    };

    const distToSegment = (p: { x: number; y: number }, v: { x: number; y: number }, w: { x: number; y: number }) => {
      const l2 = (w.x - v.x) ** 2 + (w.y - v.y) ** 2;
      if (l2 === 0) return Math.hypot(p.x - v.x, p.y - v.y);
      let t = ((p.x - v.x) * (w.x - v.x) + (p.y - v.y) * (w.y - v.y)) / l2;
      t = Math.max(0, Math.min(1, t));
      return Math.hypot(p.x - (v.x + t * (w.x - v.x)), p.y - (v.y + t * (w.y - v.y)));
    };

    const renderCanvas = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      const w = canvas.width;
      const h = canvas.height;
      const engine = engineRef.current;

      ctx.fillStyle = "#020617";
      ctx.fillRect(0, 0, w, h);

      // Draw Matrix Grid Network Lines
      ctx.strokeStyle = "rgba(16, 185, 129, 0.08)";
      ctx.lineWidth = 1;
      for (let i = 0; i < engine.nodes.length; i++) {
        for (let j = i + 1; j < engine.nodes.length; j++) {
          const n1 = engine.nodes[i];
          const n2 = engine.nodes[j];
          if (Math.hypot(n1.x - n2.x, n1.y - n2.y) < 220) {
            ctx.beginPath();
            ctx.moveTo(n1.x, n1.y);
            ctx.lineTo(n2.x, n2.y);
            ctx.stroke();
          }
        }
      }

      // Draw Firewalls
      engine.firewalls.forEach(fw => {
        const x2 = fw.cx + Math.cos(fw.angle) * fw.length;
        const y2 = fw.cy + Math.sin(fw.angle) * fw.length;

        ctx.save();
        ctx.shadowBlur = 20;
        ctx.shadowColor = "#ef4444";

        ctx.strokeStyle = "#ef4444";
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(fw.cx, fw.cy);
        ctx.lineTo(x2, y2);
        ctx.stroke();

        ctx.restore();
      });

      // Draw Decryption Nodes
      engine.nodes.forEach(node => {
        ctx.save();
        ctx.shadowBlur = node.encrypted ? 10 : 25;
        ctx.shadowColor = node.color;

        ctx.strokeStyle = node.color;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(node.x, node.y, node.radius, 0, Math.PI * 2);
        ctx.stroke();

        ctx.fillStyle = node.encrypted ? "#0f172a" : `${node.color}30`;
        ctx.fill();

        ctx.restore();
      });

      // Draw Infiltrators (P1 and P2)
      [engine.p1, ...(mode === "local_hacker_duel" ? [engine.p2] : [])].forEach(p => {
        ctx.save();
        ctx.shadowBlur = 20;
        ctx.shadowColor = p.color;

        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
      });
    };

    animId = requestAnimationFrame(runLoop);
    return () => cancelAnimationFrame(animId);
  }, [gameState, mode]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      audio.init();
      const keys = engineRef.current.keys;
      if (e.key === "w" || e.key === "W") keys.w = true;
      if (e.key === "a" || e.key === "A") keys.a = true;
      if (e.key === "s" || e.key === "S") keys.s = true;
      if (e.key === "d" || e.key === "D") keys.d = true;

      if (e.key === "ArrowUp") keys.up = true;
      if (e.key === "ArrowLeft") keys.left = true;
      if (e.key === "ArrowDown") keys.down = true;
      if (e.key === "ArrowRight") keys.right = true;
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const keys = engineRef.current.keys;
      if (e.key === "w" || e.key === "W") keys.w = false;
      if (e.key === "a" || e.key === "A") keys.a = false;
      if (e.key === "s" || e.key === "S") keys.s = false;
      if (e.key === "d" || e.key === "D") keys.d = false;

      if (e.key === "ArrowUp") keys.up = false;
      if (e.key === "ArrowLeft") keys.left = false;
      if (e.key === "ArrowDown") keys.down = false;
      if (e.key === "ArrowRight") keys.right = false;
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, []);

  const startGame = (selectedMode: CipherMode) => {
    setMode(selectedMode);
    initCipherGrid();
    setGameState("playing");
  };

  return (
    <div className="w-full h-screen bg-[#020617] text-white relative overflow-hidden font-sans select-none">
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full block" />

      <div className="absolute top-0 inset-x-0 p-4 flex justify-between items-center z-30 pointer-events-none">
        <Link
          href="/games"
          className="pointer-events-auto flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold"
        >
          <ArrowLeft className="w-4 h-4" /> Exit Cipher
        </Link>
        <button
          onClick={toggleSound}
          className="pointer-events-auto p-2 rounded-xl bg-white/5 border border-white/10"
        >
          {soundEnabled ? <Volume2 className="w-4 h-4 text-emerald-400" /> : <VolumeX className="w-4 h-4 text-rose-400" />}
        </button>
      </div>

      {gameState === "playing" && (
        <div className="absolute top-4 inset-x-0 flex justify-center pointer-events-none z-20">
          <div className="bg-[#0b0f19]/90 border border-emerald-500/30 px-8 py-3 rounded-2xl backdrop-blur-md flex items-center gap-8 pointer-events-auto">
            <div className="text-center">
              <div className="text-[10px] font-black uppercase text-white/40 tracking-wider">HACKER 1 INTEGRITY</div>
              <div className="text-lg font-black text-emerald-400">{Math.ceil(p1Integrity)}%</div>
            </div>

            <div className="text-center">
              <div className="text-[10px] font-black uppercase text-white/40 tracking-wider">DECRYPTED NODES</div>
              <div className="text-xl font-black text-cyan-400">{decryptedCount} / {engineRef.current.nodes.length}</div>
            </div>

            {mode === "local_hacker_duel" && (
              <div className="text-center">
                <div className="text-[10px] font-black uppercase text-white/40 tracking-wider">HACKER 2 INTEGRITY</div>
                <div className="text-lg font-black text-rose-400">{Math.ceil(p2Integrity)}%</div>
              </div>
            )}
          </div>
        </div>
      )}

      {gameState === "menu" && (
        <div className="absolute inset-0 z-40 bg-[#020617]/95 backdrop-blur-xl flex flex-col items-center justify-center p-6">
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center max-w-xl mb-8">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold uppercase tracking-widest mb-3">
              <Terminal className="w-3.5 h-3.5" /> Node Decryption Action Puzzle
            </div>
            <h1 className="text-6xl font-black uppercase tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-500">
              CIPHER
            </h1>
            <p className="text-sm text-white/60 mt-3">
              Infiltrate secure matrix networks, align encrypted node keys, and evade rotating firewall beams in high-risk cybersecurity operations.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-lg w-full">
            <button
              onClick={() => startGame("single_infiltration")}
              className="p-5 rounded-2xl bg-[#0b0f19] border border-emerald-500/40 hover:border-emerald-400 flex flex-col items-center gap-2 hover:scale-105 transition-all text-center"
            >
              <User className="w-8 h-8 text-emerald-400" />
              <div className="font-black text-lg">INFILTRATION</div>
              <div className="text-xs text-white/50">Single player node decryption trial</div>
            </button>

            <button
              onClick={() => startGame("local_hacker_duel")}
              className="p-5 rounded-2xl bg-[#0b0f19] border border-rose-500/40 hover:border-rose-400 flex flex-col items-center gap-2 hover:scale-105 transition-all text-center"
            >
              <Users className="w-8 h-8 text-rose-400" />
              <div className="font-black text-lg">HACKER DUEL</div>
              <div className="text-xs text-white/50">2-Player head-to-head matrix breach</div>
            </button>
          </div>
        </div>
      )}

      {gameState === "game_over" && (
        <div className="absolute inset-0 z-50 bg-black/85 backdrop-blur-md flex flex-col items-center justify-center p-6">
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center max-w-md w-full">
            <h2 className="text-4xl font-black uppercase text-emerald-400 mb-2">
              {winnerName ? `${winnerName}!` : "Decryption Complete"}
            </h2>
            <p className="text-xs text-white/50 mb-6">Cipher Matrix Protocol Concluded</p>

            <div className="flex gap-4">
              <button
                onClick={() => startGame(mode)}
                className="flex-1 py-3.5 rounded-xl bg-emerald-500 text-black font-black uppercase"
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
