"use client";

import React, { useEffect, useRef, useState } from "react";
import {
  Play,
  RotateCcw,
  Volume2,
  VolumeX,
  Trophy,
  Zap,
  ChevronLeft,
  ChevronRight,
  Orbit,
  Shield,
  Compass,
} from "lucide-react";

interface Platform {
  x: number;
  y: number;
  w: number;
  h: number;
}

interface LaserField {
  x: number;
  y: number;
  w: number;
  h: number;
}

interface EnergyCell {
  x: number;
  y: number;
  collected: boolean;
}

export default function ZeroGOrbitalRunnerGame() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [gameState, setGameState] = useState<"IDLE" | "PLAYING" | "LEVEL_CLEAR" | "GAME_OVER">("IDLE");
  const [score, setScore] = useState(0);
  const [cellsCollected, setCellsCollected] = useState(0);
  const [gravityDir, setGravityDir] = useState<1 | -1>(1); // 1 = down, -1 = up
  const [isMuted, setIsMuted] = useState(false);

  const [mobileControls, setMobileControls] = useState({ left: false, right: false, flip: false, dash: false });

  const audioCtxRef = useRef<AudioContext | null>(null);

  const initAudio = () => {
    if (!audioCtxRef.current) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      audioCtxRef.current = new AudioCtx();
    }
    if (audioCtxRef.current.state === "suspended") {
      audioCtxRef.current.resume();
    }
  };

  const playSound = (type: "flip" | "dash" | "cell" | "laser" | "clear") => {
    if (isMuted || !audioCtxRef.current) return;
    try {
      const ctx = audioCtxRef.current;
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      if (type === "flip") {
        osc.type = "sine";
        osc.frequency.setValueAtTime(400, now);
        osc.frequency.exponentialRampToValueAtTime(850, now + 0.15);
        gain.gain.setValueAtTime(0.25, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
        osc.start(now);
        osc.stop(now + 0.15);
      } else if (type === "dash") {
        osc.type = "triangle";
        osc.frequency.setValueAtTime(700, now);
        osc.frequency.linearRampToValueAtTime(250, now + 0.12);
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.12);
        osc.start(now);
        osc.stop(now + 0.12);
      } else if (type === "cell") {
        osc.type = "sine";
        osc.frequency.setValueAtTime(600, now);
        osc.frequency.setValueAtTime(900, now + 0.08);
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
        osc.start(now);
        osc.stop(now + 0.2);
      } else if (type === "laser") {
        osc.type = "square";
        osc.frequency.setValueAtTime(200, now);
        osc.frequency.exponentialRampToValueAtTime(50, now + 0.2);
        gain.gain.setValueAtTime(0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
        osc.start(now);
        osc.stop(now + 0.2);
      } else if (type === "clear") {
        osc.type = "sine";
        osc.frequency.setValueAtTime(440, now);
        osc.frequency.setValueAtTime(554, now + 0.12);
        osc.frequency.setValueAtTime(659, now + 0.24);
        gain.gain.setValueAtTime(0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.4);
        osc.start(now);
        osc.stop(now + 0.4);
      }
    } catch {}
  };

  const playerRef = useRef({
    x: 100,
    y: 450,
    w: 26,
    h: 36,
    vx: 0,
    vy: 0,
    speed: 6.5,
    gravityDir: 1 as 1 | -1,
    grounded: false,
    flipCooldown: 0,
    isDashing: false,
    dashTimer: 0,
    dashCooldown: 0,
  });

  const levelRef = useRef({
    width: 3200,
    height: 600,
    goal: { x: 3050, y: 250, w: 40, h: 100 },
    platforms: [
      // Floor & Ceiling platforms
      { x: 0, y: 520, w: 400, h: 80 },
      { x: 0, y: 0, w: 400, h: 80 },
      { x: 480, y: 460, w: 240, h: 30 },
      { x: 480, y: 110, w: 240, h: 30 },
      { x: 800, y: 380, w: 260, h: 30 },
      { x: 800, y: 190, w: 260, h: 30 },
      { x: 1140, y: 500, w: 300, h: 30 },
      { x: 1140, y: 70, w: 300, h: 30 },
      { x: 1520, y: 420, w: 220, h: 30 },
      { x: 1520, y: 150, w: 220, h: 30 },
      { x: 1820, y: 340, w: 260, h: 30 },
      { x: 1820, y: 230, w: 260, h: 30 },
      { x: 2160, y: 480, w: 280, h: 30 },
      { x: 2160, y: 90, w: 280, h: 30 },
      { x: 2520, y: 400, w: 240, h: 30 },
      { x: 2520, y: 160, w: 240, h: 30 },
      { x: 2840, y: 250, w: 300, h: 100 },
    ] as Platform[],
    lasers: [
      { x: 740, y: 140, w: 40, h: 290 },
      { x: 1460, y: 100, w: 40, h: 380 },
      { x: 2100, y: 120, w: 40, h: 330 },
      { x: 2780, y: 180, w: 40, h: 240 },
    ] as LaserField[],
    cells: [
      { x: 580, y: 280, collected: false },
      { x: 920, y: 280, collected: false },
      { x: 1280, y: 280, collected: false },
      { x: 1940, y: 280, collected: false },
      { x: 2640, y: 280, collected: false },
    ] as EnergyCell[],
  });

  const particlesRef = useRef<{ x: number; y: number; vx: number; vy: number; radius: number; color: string; alpha: number }[]>([]);
  const cameraXRef = useRef(0);
  const keysRef = useRef<{ [key: string]: boolean }>({});

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      keysRef.current[e.code] = true;
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
  }, []);

  const startGame = () => {
    initAudio();
    const p = playerRef.current;
    p.x = 80;
    p.y = 450;
    p.vx = 0;
    p.vy = 0;
    p.gravityDir = 1;
    p.flipCooldown = 0;

    levelRef.current.cells.forEach((c) => (c.collected = false));
    setScore(0);
    setCellsCollected(0);
    setGravityDir(1);
    particlesRef.current = [];

    setGameState("PLAYING");
  };

  useEffect(() => {
    let animId: number;

    const loop = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      if (canvas.width !== canvas.clientWidth || canvas.height !== canvas.clientHeight) {
        canvas.width = canvas.clientWidth;
        canvas.height = canvas.clientHeight;
      }

      const viewW = canvas.width;
      const viewH = canvas.height;
      const p = playerRef.current;
      const lvl = levelRef.current;

      if (gameState === "PLAYING") {
        const moveLeft = keysRef.current["KeyA"] || keysRef.current["ArrowLeft"] || mobileControls.left;
        const moveRight = keysRef.current["KeyD"] || keysRef.current["ArrowRight"] || mobileControls.right;
        const flipPressed = keysRef.current["KeyW"] || keysRef.current["Space"] || keysRef.current["ArrowUp"] || mobileControls.flip;
        const dashPressed = keysRef.current["KeyK"] || keysRef.current["ShiftLeft"] || mobileControls.dash;

        // X Movement
        if (moveLeft) p.vx = -p.speed;
        else if (moveRight) p.vx = p.speed;
        else p.vx *= 0.75;

        // Gravity Flip
        if (flipPressed && p.flipCooldown <= 0 && p.grounded) {
          p.gravityDir = (p.gravityDir * -1) as 1 | -1;
          p.flipCooldown = 18;
          p.grounded = false;
          setGravityDir(p.gravityDir);
          playSound("flip");
        }
        if (p.flipCooldown > 0) p.flipCooldown -= 1;

        // Dash logic
        if (dashPressed && p.dashCooldown <= 0) {
          p.isDashing = true;
          p.dashTimer = 10;
          p.dashCooldown = 40;
          playSound("dash");
        }

        if (p.isDashing) {
          p.vx = (p.vx >= 0 ? 1 : -1) * 14;
          p.dashTimer -= 1;
          if (p.dashTimer <= 0) p.isDashing = false;
        }

        if (p.dashCooldown > 0) p.dashCooldown -= 1;

        // Gravity Acceleration
        p.vy += p.gravityDir * 0.55;

        // Collisions
        p.grounded = false;

        p.x += p.vx;
        lvl.platforms.forEach((plat) => {
          if (p.x < plat.x + plat.w && p.x + p.w > plat.x && p.y < plat.y + plat.h && p.y + p.h > plat.y) {
            if (p.vx > 0) p.x = plat.x - p.w;
            if (p.vx < 0) p.x = plat.x + plat.w;
          }
        });

        p.y += p.vy;
        lvl.platforms.forEach((plat) => {
          if (p.x < plat.x + plat.w && p.x + p.w > plat.x && p.y < plat.y + plat.h && p.y + p.h > plat.y) {
            if (p.vy > 0 && p.gravityDir === 1) {
              p.y = plat.y - p.h;
              p.vy = 0;
              p.grounded = true;
            } else if (p.vy < 0 && p.gravityDir === -1) {
              p.y = plat.y + plat.h;
              p.vy = 0;
              p.grounded = true;
            }
          }
        });

        // Out of bounds check
        if (p.y < -100 || p.y > lvl.height + 100) {
          playSound("laser");
          setGameState("GAME_OVER");
        }

        // Laser Hazards Check
        lvl.lasers.forEach((laser) => {
          if (p.x < laser.x + laser.w && p.x + p.w > laser.x && p.y < laser.y + laser.h && p.y + p.h > laser.y) {
            playSound("laser");
            setGameState("GAME_OVER");
          }
        });

        // Energy Cell Pickups
        lvl.cells.forEach((cell) => {
          if (!cell.collected && Math.hypot(p.x + p.w / 2 - cell.x, p.y + p.h / 2 - cell.y) < 25) {
            cell.collected = true;
            setCellsCollected((c) => c + 1);
            setScore((s) => s + 400);
            playSound("cell");
          }
        });

        // Goal reached check
        if (p.x < lvl.goal.x + lvl.goal.w && p.x + p.w > lvl.goal.x && p.y < lvl.goal.y + lvl.goal.h && p.y + p.h > lvl.goal.y) {
          playSound("clear");
          setGameState("LEVEL_CLEAR");
        }

        cameraXRef.current = Math.max(0, Math.min(lvl.width - viewW, p.x - viewW / 3));
      }

      // --- RENDERING ---
      const camX = cameraXRef.current;

      // Deep Space Orbital Station BG
      ctx.fillStyle = "#030712";
      ctx.fillRect(0, 0, viewW, viewH);

      // Starfield grid effect
      ctx.fillStyle = "rgba(147, 51, 234, 0.2)";
      for (let i = 0; i < 40; i++) {
        const sx = (i * 110 - camX * 0.15 + viewW * 2) % (viewW + 50);
        const sy = (i * 37) % viewH;
        ctx.fillRect(sx, sy, 2, 2);
      }

      ctx.save();
      ctx.translate(-camX, 0);

      // Draw Platforms
      lvl.platforms.forEach((plat) => {
        ctx.fillStyle = "#1e1b4b";
        ctx.shadowBlur = 10;
        ctx.shadowColor = "#818cf8";
        ctx.fillRect(plat.x, plat.y, plat.w, plat.h);
        ctx.strokeStyle = "#818cf8";
        ctx.lineWidth = 1.5;
        ctx.strokeRect(plat.x, plat.y, plat.w, plat.h);
      });

      // Draw Laser Fields
      lvl.lasers.forEach((laser) => {
        ctx.save();
        ctx.fillStyle = "rgba(239, 68, 68, 0.8)";
        ctx.shadowBlur = 20;
        ctx.shadowColor = "#ef4444";
        ctx.fillRect(laser.x, laser.y, laser.w, laser.h);
        ctx.restore();
      });

      // Draw Energy Cells
      lvl.cells.forEach((cell) => {
        if (!cell.collected) {
          ctx.save();
          ctx.shadowBlur = 15;
          ctx.shadowColor = "#a855f7";
          ctx.fillStyle = "#a855f7";
          ctx.beginPath();
          ctx.arc(cell.x, cell.y, 9, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }
      });

      // Draw Goal Station Gate
      ctx.save();
      ctx.shadowBlur = 25;
      ctx.shadowColor = "#22c55e";
      ctx.fillStyle = "#22c55e";
      ctx.fillRect(lvl.goal.x, lvl.goal.y, lvl.goal.w, lvl.goal.h);
      ctx.restore();

      // Draw Player astronaut
      ctx.save();
      ctx.shadowBlur = 15;
      ctx.shadowColor = "#38bdf8";
      ctx.fillStyle = "#38bdf8";
      ctx.fillRect(p.x, p.y, p.w, p.h);

      // Visor
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(p.x + 4, p.gravityDir === 1 ? p.y + 6 : p.y + p.h - 12, 18, 6);
      ctx.restore();

      ctx.restore();

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [gameState, mobileControls]);

  return (
    <div className="relative w-full h-screen bg-slate-950 text-white select-none overflow-hidden font-sans">
      <canvas ref={canvasRef} className="w-full h-full block cursor-crosshair" />

      {/* HUD */}
      {gameState !== "IDLE" && (
        <div className="absolute top-0 left-0 w-full p-4 pointer-events-none flex justify-between items-start z-10">
          <div className="bg-slate-900/80 backdrop-blur-md p-3 rounded-xl border border-slate-800 flex items-center gap-3">
            <Compass className="w-6 h-6 text-purple-400" />
            <div>
              <span className="text-xs text-slate-400 block">GRAVITY MATRIX</span>
              <span className="text-sm font-bold text-purple-400">{gravityDir === 1 ? "FLOOR (DOWN)" : "CEILING (UP)"}</span>
            </div>
          </div>

          <div className="flex items-center gap-3 pointer-events-auto">
            <div className="bg-slate-900/80 backdrop-blur-md px-4 py-2 rounded-xl border border-slate-800 text-right">
              <span className="text-xs text-slate-400 block">SCORE</span>
              <span className="text-lg font-bold text-purple-400">{score}</span>
            </div>
            <button
              onClick={() => setIsMuted(!isMuted)}
              className="p-2.5 bg-slate-800 rounded-lg border border-slate-700 text-slate-300"
            >
              {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
            </button>
          </div>
        </div>
      )}

      {/* MOBILE CONTROLS */}
      {gameState === "PLAYING" && (
        <div className="absolute bottom-4 left-0 w-full px-6 flex justify-between items-end pointer-events-none z-20">
          <div className="flex gap-3 pointer-events-auto">
            <button
              onTouchStart={() => setMobileControls((c) => ({ ...c, left: true }))}
              onTouchEnd={() => setMobileControls((c) => ({ ...c, left: false }))}
              onMouseDown={() => setMobileControls((c) => ({ ...c, left: true }))}
              onMouseUp={() => setMobileControls((c) => ({ ...c, left: false }))}
              className="w-16 h-16 bg-slate-800/80 active:bg-purple-500/50 backdrop-blur-md rounded-2xl border border-slate-700 flex items-center justify-center text-white"
            >
              <ChevronLeft className="w-8 h-8" />
            </button>
            <button
              onTouchStart={() => setMobileControls((c) => ({ ...c, right: true }))}
              onTouchEnd={() => setMobileControls((c) => ({ ...c, right: false }))}
              onMouseDown={() => setMobileControls((c) => ({ ...c, right: true }))}
              onMouseUp={() => setMobileControls((c) => ({ ...c, right: false }))}
              className="w-16 h-16 bg-slate-800/80 active:bg-purple-500/50 backdrop-blur-md rounded-2xl border border-slate-700 flex items-center justify-center text-white"
            >
              <ChevronRight className="w-8 h-8" />
            </button>
          </div>

          <div className="flex gap-3 pointer-events-auto">
            <button
              onTouchStart={() => setMobileControls((c) => ({ ...c, dash: true }))}
              onTouchEnd={() => setMobileControls((c) => ({ ...c, dash: false }))}
              onMouseDown={() => setMobileControls((c) => ({ ...c, dash: true }))}
              onMouseUp={() => setMobileControls((c) => ({ ...c, dash: false }))}
              className="w-16 h-16 bg-cyan-600/80 active:bg-cyan-500 backdrop-blur-md rounded-full border border-cyan-400 flex items-center justify-center font-bold text-xs"
            >
              DASH
            </button>
            <button
              onTouchStart={() => setMobileControls((c) => ({ ...c, flip: true }))}
              onTouchEnd={() => setMobileControls((c) => ({ ...c, flip: false }))}
              onMouseDown={() => setMobileControls((c) => ({ ...c, flip: true }))}
              onMouseUp={() => setMobileControls((c) => ({ ...c, flip: false }))}
              className="w-16 h-16 bg-purple-600/80 active:bg-purple-500 backdrop-blur-md rounded-full border border-purple-400 flex items-center justify-center font-bold text-xs"
            >
              FLIP G
            </button>
          </div>
        </div>
      )}

      {/* START MODAL */}
      {gameState === "IDLE" && (
        <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-6 z-30">
          <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center">
            <Orbit className="w-12 h-12 text-purple-400 mx-auto mb-3 animate-spin" />
            <h1 className="text-3xl font-black text-purple-400 mb-2">ZERO-G ORBITAL RUNNER</h1>
            <p className="text-sm text-slate-400 mb-6">
              Sci-Fi Space Gravity Platformer. Flip gravity upside-down on command to dodge lethal orbital laser barriers!
            </p>
            <button
              onClick={startGame}
              className="w-full py-3 bg-gradient-to-r from-purple-600 to-indigo-500 hover:from-purple-500 hover:to-indigo-400 text-white font-bold rounded-xl shadow-lg cursor-pointer"
            >
              INITIALIZE ORBIT
            </button>
          </div>
        </div>
      )}

      {/* LEVEL CLEAR */}
      {gameState === "LEVEL_CLEAR" && (
        <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-6 z-30">
          <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center">
            <Trophy className="w-12 h-12 text-yellow-400 mx-auto mb-3" />
            <h2 className="text-2xl font-bold text-white mb-2">ORBITAL SECTOR CLEARED!</h2>
            <button onClick={startGame} className="w-full py-3 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl">
              RE-ENTER ORBIT
            </button>
          </div>
        </div>
      )}

      {/* GAME OVER */}
      {gameState === "GAME_OVER" && (
        <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-6 z-30">
          <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center">
            <Shield className="w-12 h-12 text-red-500 mx-auto mb-3" />
            <h2 className="text-2xl font-bold text-white mb-2">SYSTEM CRITICAL</h2>
            <p className="text-sm text-slate-400 mb-6">Atmospheric breach or laser hit.</p>
            <button
              onClick={startGame}
              className="w-full py-3 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl flex items-center justify-center gap-2 cursor-pointer"
            >
              <RotateCcw className="w-5 h-5" /> RETRY ORBIT
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
