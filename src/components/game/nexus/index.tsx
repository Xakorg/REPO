"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
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
  Share2,
  Smartphone
} from "lucide-react";
import Link from "next/link";
import { useUser, useFirestore, setDocumentNonBlocking } from "@/firebase";
import { doc, increment } from "firebase/firestore";

// ==========================================
// NEXUS GAME TYPES
// ==========================================

export type NexusMode = "conduit_master" | "nexus_grid_clash";

export interface EnergyNode {
  id: string;
  x: number;
  y: number;
  radius: number;
  voltage: number;
  maxVoltage: number;
  connectedTo: string[];
  color: string;
}

export interface EnergySpark {
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
  progress: number;
  color: string;
}

// ==========================================
// WEB AUDIO SYNTHESIZER
// ==========================================

class NexusAudioSynth {
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

  playLinkConnect() {
    if (this.muted || !this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(520, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1040, this.ctx.currentTime + 0.1);

      gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.1);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.1);
    } catch (e) {}
  }

  playSurgeDischarge() {
    if (this.muted || !this.ctx) return;
    try {
      [400, 600, 800, 1200].forEach((freq, i) => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();
        osc.type = "triangle";
        osc.frequency.setValueAtTime(freq, this.ctx!.currentTime + i * 0.04);

        gain.gain.setValueAtTime(0.25, this.ctx!.currentTime + i * 0.04);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx!.currentTime + i * 0.04 + 0.12);

        osc.connect(gain);
        gain.connect(this.ctx!.destination);
        osc.start(this.ctx!.currentTime + i * 0.04);
        osc.stop(this.ctx!.currentTime + i * 0.04 + 0.12);
      });
    } catch (e) {}
  }

  playOverloadWarning() {
    if (this.muted || !this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(180, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(60, this.ctx.currentTime + 0.2);

      gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.2);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.2);
    } catch (e) {}
  }
}

const audio = new NexusAudioSynth();

// ==========================================
// NEXUS GAME COMPONENT
// ==========================================

export default function NexusGame() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const { user } = useUser();
  const firestore = useFirestore();

  const [gameState, setGameState] = useState<"menu" | "playing" | "paused" | "game_over">("menu");
  const [mode, setMode] = useState<NexusMode>("conduit_master");
  const [soundEnabled, setSoundEnabled] = useState(true);

  // HUD Metrics
  const [gridVoltage, setGridVoltage] = useState(0);
  const [activeNodes, setActiveNodes] = useState(0);
  const [score, setScore] = useState(0);
  const [winnerName, setWinnerName] = useState<string | null>(null);

  const engineRef = useRef({
    selectedNodeId: null as string | null,
    nodes: [] as EnergyNode[],
    sparks: [] as EnergySpark[],
    score: 0,
    totalVoltage: 0,
    frameCount: 0
  });

  const toggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    audio.muted = !next;
  };

  const dispatchScore = (finalScore: number) => {
    if (typeof window !== "undefined" && finalScore > 0) {
      const points = Math.floor(finalScore / 30) + 15;
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
            displayName: user.displayName || "Nexus Architect",
            points: increment(points),
            updatedAt: new Date().toISOString()
          },
          { merge: true }
        );
      }
    }
  };

  const initNexus = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const w = (canvas.width = canvas.parentElement?.clientWidth || window.innerWidth);
    const h = (canvas.height = canvas.parentElement?.clientHeight || window.innerHeight);

    const engine = engineRef.current;
    engine.selectedNodeId = null;
    engine.sparks = [];
    engine.score = 0;
    engine.frameCount = 0;

    // Spawn 7 Circuit Nodes
    const nodes: EnergyNode[] = [];
    const count = 7;
    const colors = ["#10b981", "#3b82f6", "#a855f7", "#ec4899"];

    for (let i = 0; i < count; i++) {
      nodes.push({
        id: `node_${i}`,
        x: (w / 4) * ((i % 3) + 1) + (Math.random() * 40 - 20),
        y: (h / 4) * (Math.floor(i / 3) + 1) + (Math.random() * 40 - 20),
        radius: 20,
        voltage: 10,
        maxVoltage: 100,
        connectedTo: [],
        color: colors[i % colors.length]
      });
    }

    engine.nodes = nodes;
    setGridVoltage(10);
    setActiveNodes(7);
    setScore(0);
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
      const engine = engineRef.current;

      engine.frameCount++;

      // Increase voltage on connected nodes over time
      let totalV = 0;
      engine.nodes.forEach(node => {
        if (node.connectedTo.length > 0) {
          node.voltage = Math.min(node.maxVoltage, node.voltage + 0.15 * node.connectedTo.length);
        }
        totalV += node.voltage;

        // Check Overload
        if (node.voltage >= node.maxVoltage) {
          audio.playOverloadWarning();
          setWinnerName("Node Circuit Overload");
          dispatchScore(engine.score);
          setGameState("game_over");
        }
      });

      engine.totalVoltage = Math.floor(totalV);
      setGridVoltage(engine.totalVoltage);

      // Spawn Sparks along connected node lines
      if (engine.frameCount % 15 === 0) {
        engine.nodes.forEach(node => {
          node.connectedTo.forEach(targetId => {
            const targetNode = engine.nodes.find(n => n.id === targetId);
            if (targetNode) {
              engine.sparks.push({
                fromX: node.x,
                fromY: node.y,
                toX: targetNode.x,
                toY: targetNode.y,
                progress: 0,
                color: node.color
              });
            }
          });
        });
      }

      // Update Sparks
      for (let i = engine.sparks.length - 1; i >= 0; i--) {
        const spark = engine.sparks[i];
        spark.progress += 0.08;
        if (spark.progress >= 1.0) {
          engine.sparks.splice(i, 1);
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

      ctx.fillStyle = "#022c22";
      ctx.fillRect(0, 0, w, h);

      // Draw Connections between nodes
      engine.nodes.forEach(node => {
        node.connectedTo.forEach(targetId => {
          const targetNode = engine.nodes.find(n => n.id === targetId);
          if (targetNode) {
            ctx.strokeStyle = "rgba(16, 185, 129, 0.4)";
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(node.x, node.y);
            ctx.lineTo(targetNode.x, targetNode.y);
            ctx.stroke();
          }
        });
      });

      // Draw Sparks
      engine.sparks.forEach(spark => {
        const sx = spark.fromX + (spark.toX - spark.fromX) * spark.progress;
        const sy = spark.fromY + (spark.toY - spark.fromY) * spark.progress;

        ctx.save();
        ctx.shadowBlur = 15;
        ctx.shadowColor = spark.color;
        ctx.fillStyle = spark.color;
        ctx.beginPath();
        ctx.arc(sx, sy, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });

      // Draw Circuit Nodes
      engine.nodes.forEach(node => {
        const isSelected = engine.selectedNodeId === node.id;
        ctx.save();
        ctx.shadowBlur = isSelected ? 30 : 15;
        ctx.shadowColor = node.color;
        ctx.fillStyle = node.color;
        ctx.beginPath();
        ctx.arc(node.x, node.y, node.radius + (isSelected ? 5 : 0), 0, Math.PI * 2);
        ctx.fill();

        // Draw Voltage Ring
        ctx.strokeStyle = "rgba(255, 255, 255, 0.6)";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(node.x, node.y, node.radius + 6, 0, (Math.PI * 2 * node.voltage) / node.maxVoltage);
        ctx.stroke();

        ctx.restore();
      });
    };

    animId = requestAnimationFrame(runLoop);
    return () => cancelAnimationFrame(animId);
  }, [gameState, mode]);

  // Touch & Mouse Click Connect Nodes
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    audio.init();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
    const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;
    const x = clientX - rect.left;
    const y = clientY - rect.top;

    const engine = engineRef.current;
    const clickedNode = engine.nodes.find(n => Math.hypot(n.x - x, n.y - y) < n.radius + 15);

    if (clickedNode) {
      if (engine.selectedNodeId && engine.selectedNodeId !== clickedNode.id) {
        const prevNode = engine.nodes.find(n => n.id === engine.selectedNodeId);
        if (prevNode && !prevNode.connectedTo.includes(clickedNode.id)) {
          prevNode.connectedTo.push(clickedNode.id);
          audio.playLinkConnect();
          engine.score += 200;
          setScore(engine.score);
        }
        engine.selectedNodeId = null;
      } else {
        engine.selectedNodeId = clickedNode.id;
      }
    } else {
      engine.selectedNodeId = null;
    }
  };

  const triggerPowerSurge = () => {
    audio.init();
    audio.playSurgeDischarge();
    const engine = engineRef.current;
    engine.nodes.forEach(n => (n.voltage = Math.max(5, n.voltage - 30)));
    engine.score += 500;
    setScore(engine.score);
  };

  const startGame = (selectedMode: NexusMode) => {
    setMode(selectedMode);
    initNexus();
    setGameState("playing");
  };

  return (
    <div className="w-full h-screen bg-[#022c22] text-white relative overflow-hidden font-sans select-none">
      <canvas
        ref={canvasRef}
        onClick={handleCanvasClick}
        onTouchStart={handleCanvasClick}
        className="absolute inset-0 w-full h-full block cursor-pointer"
      />

      <div className="absolute top-0 inset-x-0 p-4 flex justify-between items-center z-30 pointer-events-none">
        <Link
          href="/games"
          className="pointer-events-auto flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold"
        >
          <ArrowLeft className="w-4 h-4" /> Exit Nexus
        </Link>
        <button
          onClick={toggleSound}
          className="pointer-events-auto p-2 rounded-xl bg-white/5 border border-white/10"
        >
          {soundEnabled ? <Volume2 className="w-4 h-4 text-emerald-400" /> : <VolumeX className="w-4 h-4 text-rose-400" />}
        </button>
      </div>

      {gameState === "playing" && (
        <>
          <div className="absolute top-4 inset-x-0 flex justify-center pointer-events-none z-20">
            <div className="bg-[#0b0f19]/90 border border-emerald-500/30 px-8 py-3 rounded-2xl backdrop-blur-md flex items-center gap-8 pointer-events-auto">
              <div className="text-center">
                <div className="text-[10px] font-black uppercase text-white/40 tracking-wider">GRID VOLTAGE</div>
                <div className="text-lg font-black text-emerald-400">{gridVoltage} V</div>
              </div>

              <div className="text-center">
                <div className="text-[10px] font-black uppercase text-white/40 tracking-wider">ACTIVE NODES</div>
                <div className="text-xl font-black text-blue-400">{activeNodes} / 7</div>
              </div>

              <div className="text-center">
                <div className="text-[10px] font-black uppercase text-white/40 tracking-wider">NEXUS SCORE</div>
                <div className="text-xl font-black text-pink-400">{score}</div>
              </div>
            </div>
          </div>

          {/* MOBILE TOUCH POWER SURGE BUTTON OVERLAY */}
          <div className="absolute bottom-6 right-6 z-30 md:hidden pointer-events-auto">
            <button
              onTouchStart={triggerPowerSurge}
              onClick={triggerPowerSurge}
              className="w-20 h-20 rounded-full bg-gradient-to-tr from-emerald-500 to-teal-600 border border-emerald-300 active:scale-90 flex items-center justify-center font-black text-xs uppercase tracking-wider"
            >
              SURGE
            </button>
          </div>
        </>
      )}

      {gameState === "menu" && (
        <div className="absolute inset-0 z-40 bg-[#021f18]/90 backdrop-blur-2xl flex flex-col items-center justify-center p-6 overflow-y-auto">
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-emerald-600/20 rounded-full blur-[120px] pointer-events-none animate-pulse" />

          <motion.div
            initial={{ scale: 0.88, opacity: 0, y: 10 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            className="text-center max-w-2xl mb-8 z-10"
          >
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-black uppercase tracking-widest mb-4 shadow-[0_0_20px_rgba(16,185,129,0.2)]">
              <Share2 className="w-4 h-4 text-emerald-400 animate-pulse" /> High-Voltage Conduit Protocol
            </div>

            <h1 className="text-7xl md:text-8xl font-black uppercase tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-emerald-300 via-teal-300 to-cyan-400 drop-shadow-[0_0_40px_rgba(16,185,129,0.6)]">
              NEXUS
            </h1>
            <p className="text-base text-emerald-100/70 mt-4 max-w-lg mx-auto leading-relaxed">
              Connect high-voltage circuit nodes, balance electric current flow, and discharge power surges before overload.
            </p>

            <div className="flex justify-center gap-3 mt-4">
              <span className="px-3 py-1 rounded-md bg-white/5 border border-white/10 text-[10px] font-mono text-emerald-300">1P / 2P MODES</span>
              <span className="px-3 py-1 rounded-md bg-white/5 border border-white/10 text-[10px] font-mono text-teal-300">ONLINE LEADERBOARD</span>
              <span className="px-3 py-1 rounded-md bg-white/5 border border-white/10 text-[10px] font-mono text-cyan-300">TOUCH READY</span>
            </div>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-xl w-full z-10">
            <button
              onClick={() => startGame("conduit_master")}
              className="group relative p-6 rounded-3xl bg-white/5 border border-emerald-500/30 hover:border-emerald-400 hover:bg-emerald-500/10 flex flex-col items-center gap-3 transition-all duration-300 text-center backdrop-blur-md shadow-lg hover:shadow-[0_0_30px_rgba(16,185,129,0.3)] active:scale-95"
            >
              <User className="w-8 h-8 text-emerald-400 group-hover:scale-110 transition-transform" />
              <div>
                <div className="font-black text-xl uppercase tracking-wider text-white">CONDUIT MASTER</div>
                <div className="text-xs text-emerald-200/60 mt-1">Single player node balance & power surge</div>
              </div>
            </button>

            <button
              onClick={() => startGame("nexus_grid_clash")}
              className="group relative p-6 rounded-3xl bg-white/5 border border-teal-500/30 hover:border-teal-400 hover:bg-teal-500/10 flex flex-col items-center gap-3 transition-all duration-300 text-center backdrop-blur-md shadow-lg hover:shadow-[0_0_30px_rgba(20,184,166,0.3)] active:scale-95"
            >
              <Users className="w-8 h-8 text-teal-400 group-hover:scale-110 transition-transform" />
              <div>
                <div className="font-black text-xl uppercase tracking-wider text-white">GRID CLASH</div>
                <div className="text-xs text-teal-200/60 mt-1">2-Player high-voltage link duel</div>
              </div>
            </button>
          </div>

          <div className="mt-8 z-10 flex flex-wrap items-center justify-center gap-6 text-xs text-white/50 bg-black/40 px-6 py-3 rounded-2xl border border-white/10">
            <div className="flex items-center gap-2">
              <span className="font-mono text-emerald-300 bg-white/10 px-2 py-0.5 rounded border border-white/10 font-bold">CLICK / TOUCH</span>
              <span>Connect Nodes</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-teal-300 bg-white/10 px-2 py-0.5 rounded border border-white/10 font-bold">SPACE</span>
              <span>Power Surge</span>
            </div>
          </div>
        </div>
      )}

      {gameState === "game_over" && (
        <div className="absolute inset-0 z-50 bg-black/85 backdrop-blur-md flex flex-col items-center justify-center p-6">
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center max-w-md w-full">
            <h2 className="text-4xl font-black uppercase text-emerald-400 mb-2">
              {winnerName ? `${winnerName}!` : "Grid Overload"}
            </h2>
            <p className="text-xs text-white/50 mb-6">Nexus Conduit Protocol Concluded</p>

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
