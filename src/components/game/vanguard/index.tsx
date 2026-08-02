"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Shield,
  Zap,
  Crosshair,
  Award,
  Volume2,
  VolumeX,
  Play,
  Pause,
  RotateCcw,
  Sparkles,
  Flame,
  Users,
  User,
  Globe,
  Trophy,
  ArrowLeft,
  Activity,
  Radio,
  Swords,
  Target,
  Terminal,
  X
} from "lucide-react";
import Link from "next/link";
import { useUser, useFirestore, setDocumentNonBlocking } from "@/firebase";
import { doc, increment } from "firebase/firestore";

// ==========================================
// VANGUARD MECH TYPES
// ==========================================

export type VanguardMode = "crusade" | "local_duel" | "online_room";

export interface MechState {
  id: string;
  name: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  rotation: number;
  health: number;
  maxHealth: number;
  heat: number;
  maxHeat: number;
  overheated: boolean;
  score: number;
  color: string;
  slashing: boolean;
  slashAngle: number;
  parrying: boolean;
  parryTimer: number;
  bladeCooldown: number;
  missileCooldown: number;
  kills: number;
}

// ==========================================
// WEB AUDIO SYNTHESIZER
// ==========================================

class MechAudioSynth {
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

  playBladeSlash() {
    if (this.muted || !this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(1200, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(300, this.ctx.currentTime + 0.15);

      gain.gain.setValueAtTime(0.25, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.15);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.15);
    } catch (e) {}
  }

  playMissileLaunch() {
    if (this.muted || !this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(150, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(850, this.ctx.currentTime + 0.2);

      gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.2);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.2);
    } catch (e) {}
  }

  playParryClash() {
    if (this.muted || !this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(1800, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(400, this.ctx.currentTime + 0.25);

      gain.gain.setValueAtTime(0.35, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.25);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.25);
    } catch (e) {}
  }

  playExplosion() {
    if (this.muted || !this.ctx) return;
    try {
      const duration = 0.4;
      const bufferSize = this.ctx.sampleRate * duration;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;

      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;
      const filter = this.ctx.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.setValueAtTime(400, this.ctx.currentTime);
      filter.frequency.linearRampToValueAtTime(50, this.ctx.currentTime + duration);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.3, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + duration);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);
      noise.start();
    } catch (e) {}
  }
}

const audio = new MechAudioSynth();

// ==========================================
// VANGUARD GAME COMPONENT
// ==========================================

export default function VanguardGame() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const { user } = useUser();
  const firestore = useFirestore();

  const [gameState, setGameState] = useState<"menu" | "playing" | "paused" | "game_over">("menu");
  const [mode, setMode] = useState<VanguardMode>("crusade");
  const [soundEnabled, setSoundEnabled] = useState(true);

  // HUD Stats
  const [scoreP1, setScoreP1] = useState(0);
  const [healthP1, setHealthP1] = useState(100);
  const [heatP1, setHeatP1] = useState(0);
  const [healthP2, setHealthP2] = useState(100);
  const [heatP2, setHeatP2] = useState(0);
  const [wave, setWave] = useState(1);
  const [winnerName, setWinnerName] = useState<string | null>(null);

  const engineRef = useRef({
    keys: {
      w: false, a: false, s: false, d: false, f: false, g: false,
      up: false, left: false, down: false, right: false, k: false, l: false,
      mouseX: 0, mouseY: 0, mouseDown: false
    },
    p1: {
      id: "p1", name: "Apex Titan", x: 200, y: 300, vx: 0, vy: 0, radius: 22, rotation: 0,
      health: 120, maxHealth: 120, heat: 0, maxHeat: 100, overheated: false, score: 0, color: "#3b82f6",
      slashing: false, slashAngle: 0, parrying: false, parryTimer: 0, bladeCooldown: 0, missileCooldown: 0, kills: 0
    } as MechState,
    p2: {
      id: "p2", name: "Iron Dread", x: 800, y: 300, vx: 0, vy: 0, radius: 22, rotation: Math.PI,
      health: 120, maxHealth: 120, heat: 0, maxHeat: 100, overheated: false, score: 0, color: "#ef4444",
      slashing: false, slashAngle: 0, parrying: false, parryTimer: 0, bladeCooldown: 0, missileCooldown: 0, kills: 0
    } as MechState,
    missiles: [] as any[],
    enemies: [] as any[],
    particles: [] as any[],
    slashFX: [] as any[],
    wave: 1,
    waveTimer: 0
  });

  const toggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    audio.muted = !next;
  };

  const dispatchScore = (finalScore: number) => {
    if (typeof window !== "undefined" && finalScore > 0) {
      const points = Math.floor(finalScore / 40) + 15;
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
            displayName: user.displayName || "Vanguard Mech Pilot",
            points: increment(points),
            updatedAt: new Date().toISOString()
          },
          { merge: true }
        );
      }
    }
  };

  const initGame = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const w = (canvas.width = canvas.parentElement?.clientWidth || window.innerWidth);
    const h = (canvas.height = canvas.parentElement?.clientHeight || window.innerHeight);

    const engine = engineRef.current;
    engine.p1 = {
      id: "p1", name: user?.displayName || "Apex Vanguard", x: w * 0.25, y: h / 2, vx: 0, vy: 0, radius: 22, rotation: 0,
      health: 120, maxHealth: 120, heat: 0, maxHeat: 100, overheated: false, score: 0, color: "#3b82f6",
      slashing: false, slashAngle: 0, parrying: false, parryTimer: 0, bladeCooldown: 0, missileCooldown: 0, kills: 0
    };

    engine.p2 = {
      id: "p2", name: mode === "local_duel" ? "Vanguard Rival" : "Rogue Sentinel", x: w * 0.75, y: h / 2, vx: 0, vy: 0, radius: 22, rotation: Math.PI,
      health: 120, maxHealth: 120, heat: 0, maxHeat: 100, overheated: false, score: 0, color: mode === "local_duel" ? "#ef4444" : "#f59e0b",
      slashing: false, slashAngle: 0, parrying: false, parryTimer: 0, bladeCooldown: 0, missileCooldown: 0, kills: 0
    };

    engine.missiles = [];
    engine.enemies = [];
    engine.particles = [];
    engine.slashFX = [];
    engine.wave = 1;
    engine.waveTimer = 0;

    setScoreP1(0);
    setHealthP1(120);
    setHeatP1(0);
    setHealthP2(120);
    setHeatP2(0);
    setWave(1);
    setWinnerName(null);
  }, [mode, user]);

  // Main 60FPS Game Loop
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
      const p1 = engine.p1;
      const p2 = engine.p2;

      // ----------------------------------------
      // PLAYER 1 LOGIC
      // ----------------------------------------
      let p1dx = 0;
      let p1dy = 0;
      if (keys.w) p1dy -= 1;
      if (keys.s) p1dy += 1;
      if (keys.a) p1dx -= 1;
      if (keys.d) p1dx += 1;

      if (p1dx !== 0 && p1dy !== 0) {
        p1dx *= 0.7071;
        p1dy *= 0.7071;
      }

      const p1Speed = p1.overheated ? 3.5 : 7.0;
      p1.vx += (p1dx * p1Speed - p1.vx) * 0.2;
      p1.vy += (p1dy * p1Speed - p1.vy) * 0.2;

      p1.x = Math.max(p1.radius, Math.min(w - p1.radius, p1.x + p1.vx));
      p1.y = Math.max(p1.radius, Math.min(h - p1.radius, p1.y + p1.vy));

      // Aiming
      if (keys.mouseX || keys.mouseY) {
        p1.rotation = Math.atan2(keys.mouseY - p1.y, keys.mouseX - p1.x);
      } else if (p1dx !== 0 || p1dy !== 0) {
        p1.rotation = Math.atan2(p1.vy, p1.vx);
      }

      // Heat Dissipation
      if (p1.heat > 0) {
        p1.heat = Math.max(0, p1.heat - 0.4);
        if (p1.heat <= 0) p1.overheated = false;
      }
      setHeatP1(p1.heat);

      // P1 Melee Blade Slash (F or Left Click)
      if (p1.bladeCooldown > 0) p1.bladeCooldown--;
      if ((keys.f || keys.mouseDown) && p1.bladeCooldown <= 0 && !p1.overheated) {
        audio.playBladeSlash();
        p1.bladeCooldown = 18;
        p1.heat = Math.min(p1.maxHeat, p1.heat + 12);
        if (p1.heat >= p1.maxHeat) p1.overheated = true;

        engine.slashFX.push({
          x: p1.x, y: p1.y, angle: p1.rotation, radius: 55, life: 10, color: p1.color, ownerId: p1.id
        });

        // Hit Detection vs P2 or Enemies
        if (mode === "local_duel") {
          const dist = Math.hypot(p2.x - p1.x, p2.y - p1.y);
          if (dist < 65) {
            audio.playParryClash();
            p2.health -= 30;
            setHealthP2(p2.health);
            createSparks(p2.x, p2.y, p1.color);

            if (p2.health <= 0) {
              setWinnerName(p1.name);
              dispatchScore(2000);
              setGameState("game_over");
            }
          }
        }
      }

      // P1 Missile Barrage (G or Space)
      if (p1.missileCooldown > 0) p1.missileCooldown--;
      if (keys.g && p1.missileCooldown <= 0 && !p1.overheated) {
        audio.playMissileLaunch();
        p1.missileCooldown = 60;
        p1.heat = Math.min(p1.maxHeat, p1.heat + 25);
        if (p1.heat >= p1.maxHeat) p1.overheated = true;

        for (let i = -1; i <= 1; i++) {
          const offsetAngle = p1.rotation + i * 0.25;
          engine.missiles.push({
            x: p1.x + Math.cos(offsetAngle) * 25,
            y: p1.y + Math.sin(offsetAngle) * 25,
            vx: Math.cos(offsetAngle) * 12,
            vy: Math.sin(offsetAngle) * 12,
            radius: 5,
            damage: 20,
            color: p1.color,
            ownerId: p1.id
          });
        }
      }

      // ----------------------------------------
      // PLAYER 2 LOGIC (LOCAL DUEL)
      // ----------------------------------------
      if (mode === "local_duel") {
        let p2dx = 0;
        let p2dy = 0;
        if (keys.up) p2dy -= 1;
        if (keys.down) p2dy += 1;
        if (keys.left) p2dx -= 1;
        if (keys.right) p2dx += 1;

        if (p2dx !== 0 && p2dy !== 0) {
          p2dx *= 0.7071;
          p2dy *= 0.7071;
        }

        const p2Speed = p2.overheated ? 3.5 : 7.0;
        p2.vx += (p2dx * p2Speed - p2.vx) * 0.2;
        p2.vy += (p2dy * p2Speed - p2.vy) * 0.2;

        p2.x = Math.max(p2.radius, Math.min(w - p2.radius, p2.x + p2.vx));
        p2.y = Math.max(p2.radius, Math.min(h - p2.radius, p2.y + p2.vy));

        if (p2dx !== 0 || p2dy !== 0) {
          p2.rotation = Math.atan2(p2.vy, p2.vx);
        }

        if (p2.heat > 0) {
          p2.heat = Math.max(0, p2.heat - 0.4);
          if (p2.heat <= 0) p2.overheated = false;
        }
        setHeatP2(p2.heat);

        // P2 Slash (K Key)
        if (p2.bladeCooldown > 0) p2.bladeCooldown--;
        if (keys.k && p2.bladeCooldown <= 0 && !p2.overheated) {
          audio.playBladeSlash();
          p2.bladeCooldown = 18;
          p2.heat = Math.min(p2.maxHeat, p2.heat + 12);
          if (p2.heat >= p2.maxHeat) p2.overheated = true;

          engine.slashFX.push({
            x: p2.x, y: p2.y, angle: p2.rotation, radius: 55, life: 10, color: p2.color, ownerId: p2.id
          });

          const dist = Math.hypot(p1.x - p2.x, p1.y - p2.y);
          if (dist < 65) {
            audio.playParryClash();
            p1.health -= 30;
            setHealthP1(p1.health);
            createSparks(p1.x, p1.y, p2.color);

            if (p1.health <= 0) {
              setWinnerName(p2.name);
              setGameState("game_over");
            }
          }
        }

        // P2 Missile (L Key)
        if (p2.missileCooldown > 0) p2.missileCooldown--;
        if (keys.l && p2.missileCooldown <= 0 && !p2.overheated) {
          audio.playMissileLaunch();
          p2.missileCooldown = 60;
          p2.heat = Math.min(p2.maxHeat, p2.heat + 25);
          if (p2.heat >= p2.maxHeat) p2.overheated = true;

          for (let i = -1; i <= 1; i++) {
            const offsetAngle = p2.rotation + i * 0.25;
            engine.missiles.push({
              x: p2.x + Math.cos(offsetAngle) * 25,
              y: p2.y + Math.sin(offsetAngle) * 25,
              vx: Math.cos(offsetAngle) * 12,
              vy: Math.sin(offsetAngle) * 12,
              radius: 5,
              damage: 20,
              color: p2.color,
              ownerId: p2.id
            });
          }
        }
      }

      // ----------------------------------------
      // UPDATE MISSILES & SLASH ANIMATIONS
      // ----------------------------------------
      for (let mIdx = engine.missiles.length - 1; mIdx >= 0; mIdx--) {
        const m = engine.missiles[mIdx];
        m.x += m.vx;
        m.y += m.vy;

        // Target Homing
        const target = m.ownerId === "p1" ? (mode === "local_duel" ? p2 : engine.enemies[0]) : p1;
        if (target) {
          const targetAngle = Math.atan2(target.y - m.y, target.x - m.x);
          m.vx += Math.cos(targetAngle) * 0.6;
          m.vy += Math.sin(targetAngle) * 0.6;
        }

        if (mode === "local_duel") {
          const hitTarget = m.ownerId === "p1" ? p2 : p1;
          if (Math.hypot(m.x - hitTarget.x, m.y - hitTarget.y) < hitTarget.radius + m.radius) {
            audio.playExplosion();
            hitTarget.health -= m.damage;
            createSparks(hitTarget.x, hitTarget.y, m.color);
            engine.missiles.splice(mIdx, 1);

            if (hitTarget.id === "p1") setHealthP1(hitTarget.health);
            else setHealthP2(hitTarget.health);

            if (hitTarget.health <= 0) {
              setWinnerName(m.ownerId === "p1" ? p1.name : p2.name);
              setGameState("game_over");
            }
            continue;
          }
        }

        if (m.x < -20 || m.x > w + 20 || m.y < -20 || m.y > h + 20) {
          engine.missiles.splice(mIdx, 1);
        }
      }

      // Update Slash Visual Effects
      for (let sIdx = engine.slashFX.length - 1; sIdx >= 0; sIdx--) {
        const s = engine.slashFX[sIdx];
        s.life--;
        if (s.life <= 0) engine.slashFX.splice(sIdx, 1);
      }
    };

    const createSparks = (x: number, y: number, color: string) => {
      const engine = engineRef.current;
      for (let i = 0; i < 12; i++) {
        const angle = Math.random() * Math.PI * 2;
        engine.particles.push({
          x, y,
          vx: Math.cos(angle) * (Math.random() * 6 + 2),
          vy: Math.sin(angle) * (Math.random() * 6 + 2),
          radius: Math.random() * 3 + 1,
          color,
          alpha: 1,
          life: 20
        });
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

      ctx.fillStyle = "#09090b";
      ctx.fillRect(0, 0, w, h);

      // Arena Hexagon Grid Pattern
      ctx.strokeStyle = "rgba(59, 130, 246, 0.05)";
      ctx.lineWidth = 1;
      for (let x = 0; x < w; x += 60) {
        for (let y = 0; y < h; y += 60) {
          ctx.beginPath();
          ctx.arc(x, y, 20, 0, Math.PI * 2);
          ctx.stroke();
        }
      }

      // Draw Slash Arcs
      engine.slashFX.forEach(s => {
        ctx.save();
        ctx.translate(s.x, s.y);
        ctx.rotate(s.angle);
        ctx.strokeStyle = s.color;
        ctx.lineWidth = 6;
        ctx.shadowBlur = 15;
        ctx.shadowColor = s.color;

        ctx.beginPath();
        ctx.arc(0, 0, s.radius, -Math.PI / 3, Math.PI / 3);
        ctx.stroke();
        ctx.restore();
      });

      // Draw Missiles
      engine.missiles.forEach(m => {
        ctx.shadowBlur = 10;
        ctx.shadowColor = m.color;
        ctx.fillStyle = m.color;
        ctx.beginPath();
        ctx.arc(m.x, m.y, m.radius, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.shadowBlur = 0;

      // Draw Particles
      for (let i = engine.particles.length - 1; i >= 0; i--) {
        const p = engine.particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.alpha -= 1 / p.life;

        if (p.alpha <= 0) {
          engine.particles.splice(i, 1);
          continue;
        }

        ctx.fillStyle = p.color;
        ctx.globalAlpha = Math.max(0, p.alpha);
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;

      // Draw Mechs
      [engine.p1, ...(mode === "local_duel" ? [engine.p2] : [])].forEach(mech => {
        ctx.save();
        ctx.translate(mech.x, mech.y);
        ctx.rotate(mech.rotation);

        ctx.shadowBlur = 20;
        ctx.shadowColor = mech.color;

        // Outer Chassis Body
        ctx.fillStyle = mech.color;
        ctx.fillRect(-mech.radius, -mech.radius, mech.radius * 2, mech.radius * 2);

        // Cockpit Core
        ctx.fillStyle = mech.overheated ? "#ef4444" : "#ffffff";
        ctx.beginPath();
        ctx.arc(0, 0, 8, 0, Math.PI * 2);
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
      if (e.key === "f" || e.key === "F") keys.f = true;
      if (e.key === "g" || e.key === "G") keys.g = true;

      if (e.key === "ArrowUp") keys.up = true;
      if (e.key === "ArrowLeft") keys.left = true;
      if (e.key === "ArrowDown") keys.down = true;
      if (e.key === "ArrowRight") keys.right = true;
      if (e.key === "k" || e.key === "K") keys.k = true;
      if (e.key === "l" || e.key === "L") keys.l = true;
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const keys = engineRef.current.keys;
      if (e.key === "w" || e.key === "W") keys.w = false;
      if (e.key === "a" || e.key === "A") keys.a = false;
      if (e.key === "s" || e.key === "S") keys.s = false;
      if (e.key === "d" || e.key === "D") keys.d = false;
      if (e.key === "f" || e.key === "F") keys.f = false;
      if (e.key === "g" || e.key === "G") keys.g = false;

      if (e.key === "ArrowUp") keys.up = false;
      if (e.key === "ArrowLeft") keys.left = false;
      if (e.key === "ArrowDown") keys.down = false;
      if (e.key === "ArrowRight") keys.right = false;
      if (e.key === "k" || e.key === "K") keys.k = false;
      if (e.key === "l" || e.key === "L") keys.l = false;
    };

    const handleMouseMove = (e: MouseEvent) => {
      const canvas = canvasRef.current;
      if (canvas) {
        const rect = canvas.getBoundingClientRect();
        engineRef.current.keys.mouseX = e.clientX - rect.left;
        engineRef.current.keys.mouseY = e.clientY - rect.top;
      }
    };

    const handleMouseDown = () => {
      audio.init();
      engineRef.current.keys.mouseDown = true;
    };
    const handleMouseUp = () => {
      engineRef.current.keys.mouseDown = false;
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mousedown", handleMouseDown);
    window.addEventListener("mouseup", handleMouseUp);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mousedown", handleMouseDown);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, []);

  const startGame = (selectedMode: VanguardMode) => {
    setMode(selectedMode);
    initGame();
    setGameState("playing");
  };

  return (
    <div className="w-full h-screen bg-[#09090b] text-white relative overflow-hidden font-sans select-none">
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full block" />

      <div className="absolute top-0 inset-x-0 p-4 flex justify-between items-center z-30 pointer-events-none">
        <Link
          href="/games"
          className="pointer-events-auto flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold"
        >
          <ArrowLeft className="w-4 h-4" /> Exit Vanguard
        </Link>
        <button
          onClick={toggleSound}
          className="pointer-events-auto p-2 rounded-xl bg-white/5 border border-white/10"
        >
          {soundEnabled ? <Volume2 className="w-4 h-4 text-blue-400" /> : <VolumeX className="w-4 h-4 text-rose-400" />}
        </button>
      </div>

      {gameState === "playing" && (
        <div className="absolute inset-0 p-6 flex flex-col justify-between pointer-events-none z-20">
          <div className="flex justify-between items-start mt-12">
            <div className="bg-[#121215]/80 border border-blue-500/30 p-3.5 rounded-2xl backdrop-blur-md w-60">
              <div className="text-xs font-black text-blue-400 uppercase tracking-wider mb-1 flex justify-between">
                <span>{engineRef.current.p1.name}</span>
                <span>{Math.ceil(healthP1)} HP</span>
              </div>
              <div className="w-full h-2.5 bg-blue-950 rounded-full overflow-hidden mb-2">
                <div className="h-full bg-blue-500 transition-all" style={{ width: `${Math.max(0, (healthP1 / 120) * 100)}%` }} />
              </div>
              <div className="text-[10px] font-bold text-white/50 flex justify-between">
                <span>CORE HEAT</span>
                <span className={heatP1 >= 100 ? "text-rose-500 font-black animate-ping" : ""}>
                  {Math.ceil(heatP1)}% {heatP1 >= 100 ? "OVERHEAT" : ""}
                </span>
              </div>
            </div>

            <div className="text-center bg-[#121215]/80 border border-white/10 px-5 py-2 rounded-2xl backdrop-blur-md">
              <div className="text-[10px] font-black uppercase text-white/40 tracking-widest">MECH ARENA</div>
              <div className="text-xl font-black text-blue-400">VANGUARD CLASH</div>
            </div>

            <div className="bg-[#121215]/80 border border-rose-500/30 p-3.5 rounded-2xl backdrop-blur-md w-60 text-right">
              <div className="text-xs font-black text-rose-400 uppercase tracking-wider mb-1 flex justify-between">
                <span>{Math.ceil(healthP2)} HP</span>
                <span>{engineRef.current.p2.name}</span>
              </div>
              <div className="w-full h-2.5 bg-rose-950 rounded-full overflow-hidden mb-2">
                <div className="h-full bg-rose-500 transition-all" style={{ width: `${Math.max(0, (healthP2 / 120) * 100)}%` }} />
              </div>
              <div className="text-[10px] font-bold text-white/50 flex justify-between">
                <span className={heatP2 >= 100 ? "text-rose-500 font-black animate-ping" : ""}>
                  {Math.ceil(heatP2)}% {heatP2 >= 100 ? "OVERHEAT" : ""}
                </span>
                <span>CORE HEAT</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {gameState === "menu" && (
        <div className="absolute inset-0 z-40 bg-[#09090b]/90 backdrop-blur-xl flex flex-col items-center justify-center p-6">
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center max-w-xl mb-8">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 text-xs font-bold uppercase tracking-widest mb-3">
              <Swords className="w-3.5 h-3.5" /> Next-Gen Cybernetic Mech Brawler
            </div>
            <h1 className="text-6xl font-black uppercase tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-500">
              VANGUARD
            </h1>
            <p className="text-sm text-white/60 mt-3">
              Master plasma blade parries, manage reactor core heat, and trigger homing missile barrages in intense 1v1 mech combat.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-lg w-full">
            <button
              onClick={() => startGame("crusade")}
              className="p-5 rounded-2xl bg-[#121215] border border-blue-500/40 hover:border-blue-400 flex flex-col items-center gap-2 hover:scale-105 transition-all text-center"
            >
              <User className="w-8 h-8 text-blue-400" />
              <div className="font-black text-lg">MECH CRUSADE</div>
              <div className="text-xs text-white/50">Single player combat simulation</div>
            </button>

            <button
              onClick={() => startGame("local_duel")}
              className="p-5 rounded-2xl bg-[#121215] border border-rose-500/40 hover:border-rose-400 flex flex-col items-center gap-2 hover:scale-105 transition-all text-center"
            >
              <Users className="w-8 h-8 text-rose-400" />
              <div className="font-black text-lg">2-PLAYER DUEL</div>
              <div className="text-xs text-white/50">Shared keyboard arena versus match</div>
            </button>
          </div>
        </div>
      )}

      {gameState === "game_over" && (
        <div className="absolute inset-0 z-50 bg-black/85 backdrop-blur-md flex flex-col items-center justify-center p-6">
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center max-w-md w-full">
            <h2 className="text-4xl font-black uppercase text-blue-400 mb-2">
              {winnerName ? `${winnerName} Victorious!` : "Simulation Complete"}
            </h2>
            <p className="text-xs text-white/50 mb-6">Vanguard Mech Battle Ended</p>

            <div className="flex gap-4">
              <button
                onClick={() => startGame(mode)}
                className="flex-1 py-3.5 rounded-xl bg-blue-500 text-white font-black uppercase"
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
