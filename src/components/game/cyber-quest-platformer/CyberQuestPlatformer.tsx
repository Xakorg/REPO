"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Trophy,
  Play,
  RotateCcw,
  Volume2,
  VolumeX,
  ArrowLeft,
  Key,
  Lock,
  Flag,
  Sparkles,
  Zap,
  Shield,
  Clock,
  Skull,
  Award,
  ChevronRight
} from "lucide-react";
import Link from "next/link";

// ==========================================
// 1. WEB AUDIO SYNTH SFX ENGINE
// ==========================================
class PlatformerAudioEngine {
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

  playJump() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(220, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(580, this.ctx.currentTime + 0.12);

    gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.12);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.12);
  }

  playDoubleJump() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = "triangle";
    osc.frequency.setValueAtTime(450, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(880, this.ctx.currentTime + 0.15);

    gain.gain.setValueAtTime(0.25, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.15);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.15);
  }

  playCoin() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(987.77, now); // B5
    osc.frequency.setValueAtTime(1318.51, now + 0.08); // E6

    gain.gain.setValueAtTime(0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(now + 0.2);
  }

  playKey() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = "square";
    osc.frequency.setValueAtTime(523.25, now);
    osc.frequency.setValueAtTime(659.25, now + 0.08);
    osc.frequency.setValueAtTime(783.99, now + 0.16);

    gain.gain.setValueAtTime(0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(now + 0.3);
  }

  playHurt() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(300, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(50, this.ctx.currentTime + 0.25);

    gain.gain.setValueAtTime(0.3, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.25);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.25);
  }

  playClear() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const notes = [523.25, 659.25, 783.99, 1046.5];
    notes.forEach((freq, idx) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(freq, now + idx * 0.1);
      gain.gain.setValueAtTime(0.2, now + idx * 0.1);
      gain.gain.exponentialRampToValueAtTime(0.01, now + idx * 0.1 + 0.25);
      osc.connect(gain);
      gain.connect(this.ctx!.destination);
      osc.start(now + idx * 0.1);
      osc.stop(now + idx * 0.1 + 0.25);
    });
  }
}

const audio = new PlatformerAudioEngine();

// ==========================================
// 2. LEVEL MAP DESIGNS (GRID BASED 24x14)
// ==========================================
// 0=Air, 1=Solid Block, 2=Spikes, 3=Key, 4=Door, 5=Flag, 6=Coin, 7=Spring
type TileType = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7;

interface LevelData {
  id: number;
  name: string;
  grid: TileType[][];
  startX: number;
  startY: number;
}

const LEVELS: LevelData[] = [
  {
    id: 1,
    name: "CYBER PROTOCOL: INITIATION",
    startX: 2,
    startY: 11,
    grid: [
      [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 5, 1],
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1],
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 4, 0, 0, 0, 1],
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 0, 0, 1],
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 6, 6, 0, 0, 0, 0, 0, 0, 0, 0, 1],
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 1],
      [1, 0, 0, 0, 0, 0, 3, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
      [1, 0, 0, 0, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
      [1, 0, 6, 0, 0, 0, 0, 0, 0, 2, 2, 2, 0, 0, 6, 6, 0, 0, 7, 0, 0, 0, 0, 1],
      [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
      [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
      [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1]
    ]
  },
  {
    id: 2,
    name: "NEON CAVERN: SPIKE MATRIX",
    startX: 2,
    startY: 11,
    grid: [
      [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 5, 1],
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1],
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 4, 0, 0, 0, 0, 1],
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 0, 0, 1, 1, 1, 1, 1, 0, 0, 0, 1],
      [1, 0, 0, 0, 0, 0, 6, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
      [1, 0, 0, 0, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 2, 2, 2, 2, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
      [1, 0, 3, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 0, 0, 7, 0, 0, 0, 0, 0, 1],
      [1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 0, 0, 0, 0, 1],
      [1, 0, 0, 0, 0, 2, 2, 0, 0, 0, 6, 6, 6, 0, 0, 0, 0, 0, 0, 0, 2, 2, 0, 1],
      [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
      [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
      [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1]
    ]
  },
  {
    id: 3,
    name: "CYBER CORE: VERTICAL ASCENT",
    startX: 2,
    startY: 11,
    grid: [
      [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
      [1, 5, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
      [1, 1, 1, 1, 4, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 1],
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
      [1, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 3, 1],
      [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 1],
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
      [1, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 6, 6, 6, 0, 0, 0, 0, 0, 0, 1],
      [1, 0, 7, 0, 0, 2, 2, 2, 0, 0, 7, 0, 0, 0, 0, 0, 0, 0, 2, 2, 0, 7, 0, 1],
      [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
      [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
      [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1]
    ]
  }
];

// ==========================================
// 3. MAIN GAME COMPONENT
// ==========================================
export default function CyberQuestPlatformer() {
  const [gameState, setGameState] = useState<"menu" | "playing" | "level_clear" | "game_over" | "victory">("menu");
  const [currentLevelIdx, setCurrentLevelIdx] = useState(0);
  const [hasKey, setHasKey] = useState(false);
  const [coins, setCoins] = useState(0);
  const [deaths, setDeaths] = useState(0);
  const [timer, setTimer] = useState(0);
  const [muted, setMuted] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Physics state
  const playerRef = useRef({
    x: 0,
    y: 0,
    vx: 0,
    vy: 0,
    width: 24,
    height: 32,
    grounded: false,
    jumpsLeft: 2,
    facing: "right" as "left" | "right"
  });

  const keysRef = useRef<{ [key: string]: boolean }>({});
  const gridRef = useRef<TileType[][]>([]);

  // Load level map into gridRef
  const loadLevel = (idx: number) => {
    const lvl = LEVELS[idx];
    if (!lvl) return;

    // Deep copy grid
    gridRef.current = lvl.grid.map((row) => [...row]);
    playerRef.current.x = lvl.startX * 40 + 8;
    playerRef.current.y = lvl.startY * 40 + 4;
    playerRef.current.vx = 0;
    playerRef.current.vy = 0;
    playerRef.current.jumpsLeft = 2;
    setHasKey(false);
  };

  const startNewGame = () => {
    setCurrentLevelIdx(0);
    setCoins(0);
    setDeaths(0);
    setTimer(0);
    loadLevel(0);
    setGameState("playing");
  };

  const toggleMute = () => {
    setMuted(!muted);
    audio.muted = !muted;
  };

  // Keyboard events
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      keysRef.current[e.code] = true;

      if ((e.code === "Space" || e.code === "KeyW" || e.code === "ArrowUp") && gameState === "playing") {
        const p = playerRef.current;
        if (p.grounded) {
          p.vy = -12;
          p.grounded = false;
          p.jumpsLeft = 1;
          audio.playJump();
        } else if (p.jumpsLeft > 0) {
          p.vy = -10.5;
          p.jumpsLeft -= 1;
          audio.playDoubleJump();
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      keysRef.current[e.code] = false;
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [gameState]);

  // Main Physics & Render Loop
  useEffect(() => {
    if (gameState !== "playing") return;

    let animId: number;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const TILE_SIZE = 40;
    let timerInterval = setInterval(() => {
      setTimer((t) => t + 1);
    }, 1000);

    const gameLoop = () => {
      const p = playerRef.current;
      const grid = gridRef.current;

      // Horizontal movement
      const moveSpeed = 5.5;
      if (keysRef.current["KeyA"] || keysRef.current["ArrowLeft"]) {
        p.vx = -moveSpeed;
        p.facing = "left";
      } else if (keysRef.current["KeyD"] || keysRef.current["ArrowRight"]) {
        p.vx = moveSpeed;
        p.facing = "right";
      } else {
        p.vx *= 0.7; // friction
      }

      // Gravity
      p.vy += 0.55;
      if (p.vy > 14) p.vy = 14;

      // Update position X & Tile Collision X
      p.x += p.vx;
      let leftTile = Math.floor(p.x / TILE_SIZE);
      let rightTile = Math.floor((p.x + p.width) / TILE_SIZE);
      let topTile = Math.floor(p.y / TILE_SIZE);
      let bottomTile = Math.floor((p.y + p.height - 1) / TILE_SIZE);

      for (let r = topTile; r <= bottomTile; r++) {
        for (let c = leftTile; c <= rightTile; c++) {
          if (grid[r] && grid[r][c] === 1) {
            // Solid block
            if (p.vx > 0) p.x = c * TILE_SIZE - p.width - 0.1;
            else if (p.vx < 0) p.x = (c + 1) * TILE_SIZE + 0.1;
          }
        }
      }

      // Update position Y & Tile Collision Y
      p.y += p.vy;
      leftTile = Math.floor(p.x / TILE_SIZE);
      rightTile = Math.floor((p.x + p.width) / TILE_SIZE);
      topTile = Math.floor(p.y / TILE_SIZE);
      bottomTile = Math.floor((p.y + p.height) / TILE_SIZE);

      p.grounded = false;
      for (let r = topTile; r <= bottomTile; r++) {
        for (let c = leftTile; c <= rightTile; c++) {
          if (!grid[r]) continue;
          const tile = grid[r][c];

          if (tile === 1) {
            // Solid block
            if (p.vy > 0) {
              p.y = r * TILE_SIZE - p.height;
              p.vy = 0;
              p.grounded = true;
              p.jumpsLeft = 2;
            } else if (p.vy < 0) {
              p.y = (r + 1) * TILE_SIZE;
              p.vy = 0;
            }
          } else if (tile === 2) {
            // Spikes (Hazard)
            audio.playHurt();
            setDeaths((d) => d + 1);
            loadLevel(currentLevelIdx);
            return;
          } else if (tile === 3) {
            // Key pickup
            grid[r][c] = 0;
            setHasKey(true);
            audio.playKey();
          } else if (tile === 4) {
            // Door
            if (hasKey) {
              grid[r][c] = 0; // Door unlocked!
            } else if (p.vy > 0) {
              p.y = r * TILE_SIZE - p.height;
              p.vy = 0;
              p.grounded = true;
            }
          } else if (tile === 5) {
            // Checkpoint / Flag (Level Finish)
            audio.playClear();
            if (currentLevelIdx + 1 < LEVELS.length) {
              setCurrentLevelIdx((idx) => idx + 1);
              loadLevel(currentLevelIdx + 1);
            } else {
              setGameState("victory");
            }
            return;
          } else if (tile === 6) {
            // Coin
            grid[r][c] = 0;
            setCoins((c) => c + 1);
            audio.playCoin();
          } else if (tile === 7) {
            // Spring Pad
            p.vy = -16;
            audio.playJump();
          }
        }
      }

      // Render Canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw Grid Tiles
      for (let r = 0; r < grid.length; r++) {
        for (let c = 0; c < grid[r].length; c++) {
          const tile = grid[r][c];
          const tx = c * TILE_SIZE;
          const ty = r * TILE_SIZE;

          if (tile === 1) {
            // Solid Wall
            ctx.fillStyle = "#1e293b";
            ctx.fillRect(tx, ty, TILE_SIZE, TILE_SIZE);
            ctx.strokeStyle = "#38bdf8";
            ctx.lineWidth = 1;
            ctx.strokeRect(tx + 2, ty + 2, TILE_SIZE - 4, TILE_SIZE - 4);
          } else if (tile === 2) {
            // Spikes
            ctx.fillStyle = "#ef4444";
            ctx.beginPath();
            ctx.moveTo(tx, ty + TILE_SIZE);
            ctx.lineTo(tx + TILE_SIZE / 2, ty);
            ctx.lineTo(tx + TILE_SIZE, ty + TILE_SIZE);
            ctx.closePath();
            ctx.fill();
          } else if (tile === 3) {
            // Key
            ctx.fillStyle = "#f59e0b";
            ctx.beginPath();
            ctx.arc(tx + TILE_SIZE / 2, ty + TILE_SIZE / 2, 8, 0, Math.PI * 2);
            ctx.fill();
          } else if (tile === 4) {
            // Locked Door
            ctx.fillStyle = hasKey ? "#10b981" : "#94a3b8";
            ctx.fillRect(tx + 8, ty, TILE_SIZE - 16, TILE_SIZE);
          } else if (tile === 5) {
            // Flag
            ctx.fillStyle = "#10b981";
            ctx.fillRect(tx + 8, ty + 4, 4, TILE_SIZE - 4);
            ctx.fillStyle = "#34d399";
            ctx.beginPath();
            ctx.moveTo(tx + 12, ty + 4);
            ctx.lineTo(tx + 32, ty + 12);
            ctx.lineTo(tx + 12, ty + 20);
            ctx.closePath();
            ctx.fill();
          } else if (tile === 6) {
            // Coin
            ctx.fillStyle = "#facc15";
            ctx.beginPath();
            ctx.arc(tx + TILE_SIZE / 2, ty + TILE_SIZE / 2, 6, 0, Math.PI * 2);
            ctx.fill();
          } else if (tile === 7) {
            // Spring
            ctx.fillStyle = "#ec4899";
            ctx.fillRect(tx + 4, ty + TILE_SIZE - 12, TILE_SIZE - 8, 12);
          }
        }
      }

      // Draw Player Character
      ctx.fillStyle = "#38bdf8";
      ctx.shadowColor = "#38bdf8";
      ctx.shadowBlur = 10;
      ctx.fillRect(p.x, p.y, p.width, p.height);
      ctx.shadowBlur = 0; // reset shadow

      // Visor
      ctx.fillStyle = "#0284c7";
      if (p.facing === "right") {
        ctx.fillRect(p.x + 12, p.y + 6, 10, 6);
      } else {
        ctx.fillRect(p.x + 2, p.y + 6, 10, 6);
      }

      animId = requestAnimationFrame(gameLoop);
    };

    animId = requestAnimationFrame(gameLoop);
    return () => {
      cancelAnimationFrame(animId);
      clearInterval(timerInterval);
    };
  }, [gameState, currentLevelIdx, hasKey]);

  return (
    <div className="relative w-full h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-4 font-sans select-none overflow-hidden">
      {/* Canvas Frame */}
      <div className="relative bg-slate-900 border-2 border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
        <canvas ref={canvasRef} width={960} height={560} className="block bg-slate-950" />

        {/* HUD Top Bar */}
        {gameState === "playing" && (
          <div className="absolute top-4 left-4 right-4 flex items-center justify-between pointer-events-none">
            <div className="flex items-center gap-4 bg-slate-900/80 backdrop-blur-md px-4 py-2 rounded-xl border border-slate-800 pointer-events-auto">
              <span className="text-xs font-bold text-sky-400">LEVEL {currentLevelIdx + 1}: {LEVELS[currentLevelIdx]?.name}</span>
              <div className="flex items-center gap-1 text-amber-400 font-bold text-xs">
                <Sparkles className="w-4 h-4" /> {coins} COINS
              </div>
              <div className="flex items-center gap-1 text-rose-400 font-bold text-xs">
                <Skull className="w-4 h-4" /> {deaths} DEATHS
              </div>
              <div className="flex items-center gap-1 text-slate-400 font-bold text-xs">
                <Clock className="w-4 h-4" /> {timer}s
              </div>
            </div>

            <div className="flex items-center gap-3 pointer-events-auto">
              {hasKey && (
                <div className="flex items-center gap-1 bg-amber-500/20 border border-amber-500/50 text-amber-400 px-3 py-1.5 rounded-lg text-xs font-bold animate-pulse">
                  <Key className="w-4 h-4" /> KEY OBTAINED
                </div>
              )}
              <button
                onClick={toggleMute}
                className="p-2.5 bg-slate-900/80 backdrop-blur-md rounded-xl border border-slate-800 hover:bg-slate-800"
              >
                {muted ? <VolumeX className="w-4 h-4 text-slate-400" /> : <Volume2 className="w-4 h-4 text-sky-400" />}
              </button>
            </div>
          </div>
        )}

        {/* START MENU */}
        {gameState === "menu" && (
          <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center">
            <div className="max-w-md w-full flex flex-col items-center">
              <span className="px-4 py-1.5 rounded-full bg-sky-500/10 border border-sky-500/30 text-sky-400 text-xs font-bold uppercase tracking-widest mb-6">
                2D PRECISION PLATFORMER
              </span>
              <h1 className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-sky-400 to-indigo-400 mb-4">
                CYBER QUEST
              </h1>
              <p className="text-slate-400 text-xs mb-8">
                Navigate cyber caverns, collect encryption keys, avoid plasma spikes, and reach the sector goal.
              </p>

              <button
                onClick={startNewGame}
                className="w-full py-4 bg-sky-500 hover:bg-sky-400 text-white font-bold rounded-xl shadow-lg shadow-sky-500/25 flex items-center justify-center gap-2 mb-4"
              >
                <Play className="w-5 h-5 fill-current" /> START QUEST
              </button>
              <Link href="/games" className="text-xs text-slate-400 hover:text-white flex items-center gap-1">
                <ArrowLeft className="w-4 h-4" /> Back to Arcade Hub
              </Link>
            </div>
          </div>
        )}

        {/* VICTORY OVERLAY */}
        {gameState === "victory" && (
          <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center">
            <div className="max-w-md w-full bg-slate-900 border border-slate-800 p-8 rounded-2xl">
              <Award className="w-12 h-12 text-amber-400 mx-auto mb-4" />
              <h2 className="text-3xl font-black text-white mb-2">QUEST COMPLETED!</h2>
              <p className="text-xs text-slate-400 mb-6">You conquered all cyber protocol levels.</p>

              <div className="bg-slate-950 p-4 rounded-xl mb-6 space-y-2 text-xs font-semibold text-left">
                <div className="flex justify-between text-slate-400">
                  <span>TOTAL TIME</span>
                  <span className="text-sky-400 font-bold">{timer} SECONDS</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>DEATHS</span>
                  <span className="text-rose-400 font-bold">{deaths}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>COINS COLLECTED</span>
                  <span className="text-amber-400 font-bold">{coins}</span>
                </div>
              </div>

              <button
                onClick={startNewGame}
                className="w-full py-3.5 bg-sky-500 hover:bg-sky-400 text-white font-bold rounded-xl mb-3"
              >
                REPLAY QUEST
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Onscreen Controls Guide */}
      <div className="mt-4 text-xs text-slate-400 text-center">
        <span className="text-white font-semibold">WASD / Arrow Keys</span>: Move | <span className="text-white font-semibold">Space / W</span>: Jump & Double Jump
      </div>
    </div>
  );
}
