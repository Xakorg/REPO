"use client";

import React, { useEffect, useRef, useState } from "react";
import {
  Play,
  RotateCcw,
  Volume2,
  VolumeX,
  Sparkles,
  Trophy,
  Flame,
  ChevronLeft,
  ChevronRight,
  Snowflake,
  Sun,
  Shield,
} from "lucide-react";

interface LevelData {
  id: number;
  name: string;
  width: number;
  height: number;
  spawn: { x: number; y: number };
  goal: { x: number; y: number; w: number; h: number };
  platforms: { x: number; y: number; w: number; h: number; isIce?: boolean; isThermal?: boolean }[];
  icicles: { x: number; y: number; w: number; h: number; falling: boolean; vy: number }[];
  crystals: { x: number; y: number; collected: boolean }[];
}

const LEVELS: LevelData[] = [
  {
    id: 1,
    name: "Glacial Cavern",
    width: 2500,
    height: 600,
    spawn: { x: 80, y: 450 },
    goal: { x: 2350, y: 220, w: 40, h: 60 },
    platforms: [
      { x: 0, y: 520, w: 350, h: 80, isThermal: true },
      { x: 420, y: 460, w: 200, h: 30, isIce: true },
      { x: 700, y: 390, w: 180, h: 30, isIce: true },
      { x: 960, y: 350, w: 160, h: 30, isThermal: true },
      { x: 1200, y: 420, w: 220, h: 30, isIce: true },
      { x: 1500, y: 360, w: 180, h: 30, isIce: true },
      { x: 1760, y: 290, w: 160, h: 30, isThermal: true },
      { x: 2000, y: 250, w: 180, h: 30, isIce: true },
      { x: 2250, y: 280, w: 200, h: 100, isThermal: true },
    ],
    icicles: [
      { x: 500, y: 100, w: 20, h: 40, falling: false, vy: 0 },
      { x: 780, y: 100, w: 20, h: 40, falling: false, vy: 0 },
      { x: 1300, y: 100, w: 20, h: 40, falling: false, vy: 0 },
      { x: 1600, y: 100, w: 20, h: 40, falling: false, vy: 0 },
    ],
    crystals: [
      { x: 500, y: 420, collected: false },
      { x: 1040, y: 300, collected: false },
      { x: 1820, y: 240, collected: false },
    ],
  },
  {
    id: 2,
    name: "Frostbite Summit",
    width: 2800,
    height: 700,
    spawn: { x: 100, y: 550 },
    goal: { x: 2650, y: 150, w: 40, h: 60 },
    platforms: [
      { x: 0, y: 620, w: 300, h: 80, isThermal: true },
      { x: 380, y: 540, w: 160, h: 30, isIce: true },
      { x: 620, y: 460, w: 160, h: 30, isIce: true },
      { x: 860, y: 400, w: 180, h: 30, isThermal: true },
      { x: 1120, y: 340, w: 160, h: 30, isIce: true },
      { x: 1360, y: 280, w: 180, h: 30, isIce: true },
      { x: 1620, y: 350, w: 200, h: 30, isThermal: true },
      { x: 1900, y: 280, w: 160, h: 30, isIce: true },
      { x: 2140, y: 220, w: 180, h: 30, isIce: true },
      { x: 2400, y: 180, w: 160, h: 30, isThermal: true },
      { x: 2600, y: 210, w: 200, h: 100, isThermal: true },
    ],
    icicles: [
      { x: 450, y: 80, w: 20, h: 40, falling: false, vy: 0 },
      { x: 700, y: 80, w: 20, h: 40, falling: false, vy: 0 },
      { x: 1200, y: 80, w: 20, h: 40, falling: false, vy: 0 },
      { x: 1450, y: 80, w: 20, h: 40, falling: false, vy: 0 },
      { x: 2000, y: 80, w: 20, h: 40, falling: false, vy: 0 },
    ],
    crystals: [
      { x: 440, y: 500, collected: false },
      { x: 1200, y: 290, collected: false },
      { x: 1980, y: 230, collected: false },
    ],
  },
];

export default function FrostBoundOdysseyGame() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [gameState, setGameState] = useState<"IDLE" | "PLAYING" | "LEVEL_CLEAR" | "GAME_OVER">("IDLE");
  const [currentLevelIdx, setCurrentLevelIdx] = useState(0);
  const [warmth, setWarmth] = useState(100);
  const [score, setScore] = useState(0);
  const [crystalsCollected, setCrystalsCollected] = useState(0);
  const [isMuted, setIsMuted] = useState(false);

  const [mobileControls, setMobileControls] = useState({ left: false, right: false, jump: false, dash: false });

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

  const playSound = (type: "jump" | "dash" | "crystal" | "freeze" | "clear") => {
    if (isMuted || !audioCtxRef.current) return;
    try {
      const ctx = audioCtxRef.current;
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      if (type === "jump") {
        osc.type = "sine";
        osc.frequency.setValueAtTime(300, now);
        osc.frequency.exponentialRampToValueAtTime(600, now + 0.1);
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
        osc.start(now);
        osc.stop(now + 0.1);
      } else if (type === "dash") {
        osc.type = "triangle";
        osc.frequency.setValueAtTime(500, now);
        osc.frequency.linearRampToValueAtTime(200, now + 0.15);
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
        osc.start(now);
        osc.stop(now + 0.15);
      } else if (type === "crystal") {
        osc.type = "sine";
        osc.frequency.setValueAtTime(800, now);
        osc.frequency.setValueAtTime(1000, now + 0.08);
        gain.gain.setValueAtTime(0.25, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
        osc.start(now);
        osc.stop(now + 0.2);
      } else if (type === "freeze") {
        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(120, now);
        osc.frequency.linearRampToValueAtTime(40, now + 0.3);
        gain.gain.setValueAtTime(0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
        osc.start(now);
        osc.stop(now + 0.3);
      } else if (type === "clear") {
        osc.type = "sine";
        osc.frequency.setValueAtTime(523, now);
        osc.frequency.setValueAtTime(659, now + 0.15);
        osc.frequency.setValueAtTime(783, now + 0.3);
        gain.gain.setValueAtTime(0.25, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.45);
        osc.start(now);
        osc.stop(now + 0.45);
      }
    } catch {}
  };

  const playerRef = useRef({
    x: 80,
    y: 450,
    w: 26,
    h: 36,
    vx: 0,
    vy: 0,
    speed: 5,
    jumpPower: 11,
    grounded: false,
    onIce: false,
    onThermal: false,
    isDashing: false,
    dashTimer: 0,
    dashCooldown: 0,
    doubleJumpAvailable: true,
    warmth: 100,
  });

  const keysRef = useRef<{ [key: string]: boolean }>({});
  const particlesRef = useRef<{ x: number; y: number; vx: number; vy: number; radius: number; color: string; alpha: number }[]>([]);
  const cameraXRef = useRef(0);
  const activeLevelRef = useRef<LevelData>(JSON.parse(JSON.stringify(LEVELS[0])));

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

  const loadLevel = (idx: number) => {
    initAudio();
    const lvl = JSON.parse(JSON.stringify(LEVELS[idx]));
    activeLevelRef.current = lvl;
    setCurrentLevelIdx(idx);

    const p = playerRef.current;
    p.x = lvl.spawn.x;
    p.y = lvl.spawn.y;
    p.vx = 0;
    p.vy = 0;
    p.warmth = 100;

    setWarmth(100);
    setCrystalsCollected(0);
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
      const lvl = activeLevelRef.current;

      if (gameState === "PLAYING") {
        const moveLeft = keysRef.current["KeyA"] || keysRef.current["ArrowLeft"] || mobileControls.left;
        const moveRight = keysRef.current["KeyD"] || keysRef.current["ArrowRight"] || mobileControls.right;
        const jumpPressed = keysRef.current["KeyW"] || keysRef.current["Space"] || keysRef.current["ArrowUp"] || mobileControls.jump;
        const dashPressed = keysRef.current["KeyK"] || keysRef.current["ShiftLeft"] || mobileControls.dash;

        // Ice friction vs Normal friction
        const accel = p.onIce ? 0.3 : 1.2;
        const friction = p.onIce ? 0.98 : 0.78;

        if (dashPressed && p.dashCooldown <= 0) {
          p.isDashing = true;
          p.dashTimer = 10;
          p.dashCooldown = 45;
          playSound("dash");
        }

        if (p.isDashing) {
          p.vx = (p.vx >= 0 ? 1 : -1) * 14;
          p.dashTimer -= 1;
          if (p.dashTimer <= 0) p.isDashing = false;
        } else {
          if (moveLeft) p.vx -= accel;
          else if (moveRight) p.vx += accel;
          else p.vx *= friction;
        }

        if (p.dashCooldown > 0) p.dashCooldown -= 1;

        // Gravity & Y Movement
        p.vy += 0.5;

        // Platform collisions
        p.grounded = false;
        p.onIce = false;
        p.onThermal = false;

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
            if (p.vy > 0) {
              p.y = plat.y - p.h;
              p.vy = 0;
              p.grounded = true;
              p.doubleJumpAvailable = true;
              if (plat.isIce) p.onIce = true;
              if (plat.isThermal) p.onThermal = true;
            } else if (p.vy < 0) {
              p.y = plat.y + plat.h;
              p.vy = 0;
            }
          }
        });

        // Jump Handling
        if (jumpPressed) {
          if (p.grounded) {
            p.vy = -p.jumpPower;
            p.grounded = false;
            playSound("jump");
          } else if (p.doubleJumpAvailable && !p.isDashing) {
            p.vy = -p.jumpPower * 0.88;
            p.doubleJumpAvailable = false;
            playSound("jump");
          }
        }

        // Warmth Drain / Restore
        if (p.onThermal) {
          p.warmth = Math.min(100, p.warmth + 0.8);
        } else {
          p.warmth -= 0.12;
        }
        setWarmth(p.warmth);

        if (p.warmth <= 0 || p.y > lvl.height + 100) {
          playSound("freeze");
          setGameState("GAME_OVER");
        }

        // Icicle Hazards Logic
        lvl.icicles.forEach((icicle) => {
          if (!icicle.falling && Math.abs(p.x - icicle.x) < 80) {
            icicle.falling = true;
          }
          if (icicle.falling) {
            icicle.vy += 0.4;
            icicle.y += icicle.vy;

            // Hit player
            if (p.x < icicle.x + icicle.w && p.x + p.w > icicle.x && p.y < icicle.y + icicle.h && p.y + p.h > icicle.y) {
              playSound("freeze");
              setGameState("GAME_OVER");
            }
          }
        });

        // Crystal Pickups
        lvl.crystals.forEach((c) => {
          if (!c.collected && Math.hypot(p.x + p.w / 2 - c.x, p.y + p.h / 2 - c.y) < 25) {
            c.collected = true;
            setCrystalsCollected((cc) => cc + 1);
            setScore((s) => s + 300);
            p.doubleJumpAvailable = true;
            playSound("crystal");
          }
        });

        // Goal Reached
        if (p.x < lvl.goal.x + lvl.goal.w && p.x + p.w > lvl.goal.x && p.y < lvl.goal.y + lvl.goal.h && p.y + p.h > lvl.goal.y) {
          playSound("clear");
          setGameState("LEVEL_CLEAR");
        }

        cameraXRef.current = Math.max(0, Math.min(lvl.width - viewW, p.x - viewW / 3));
      }

      // --- RENDERING ---
      const camX = cameraXRef.current;

      // Arctic Blizzard Background
      ctx.fillStyle = "#091526";
      ctx.fillRect(0, 0, viewW, viewH);

      // Snowflakes background effect
      ctx.fillStyle = "rgba(255, 255, 255, 0.4)";
      for (let i = 0; i < 30; i++) {
        const sx = (i * 90 - camX * 0.2 + viewW * 2) % (viewW + 100);
        const sy = (i * 45 + Date.now() * 0.05) % viewH;
        ctx.beginPath();
        ctx.arc(sx, sy, 2, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.save();
      ctx.translate(-camX, 0);

      // Draw Platforms
      lvl.platforms.forEach((plat) => {
        if (plat.isThermal) {
          ctx.fillStyle = "#ff5500";
          ctx.shadowBlur = 15;
          ctx.shadowColor = "#ff5500";
        } else if (plat.isIce) {
          ctx.fillStyle = "#00d4ff";
          ctx.shadowBlur = 10;
          ctx.shadowColor = "#00d4ff";
        } else {
          ctx.fillStyle = "#1e3a5f";
          ctx.shadowBlur = 0;
        }

        ctx.fillRect(plat.x, plat.y, plat.w, plat.h);
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 1.5;
        ctx.strokeRect(plat.x, plat.y, plat.w, plat.h);
      });

      // Draw Icicles
      lvl.icicles.forEach((icicle) => {
        ctx.fillStyle = "#a5f3fc";
        ctx.beginPath();
        ctx.moveTo(icicle.x, icicle.y);
        ctx.lineTo(icicle.x + icicle.w / 2, icicle.y + icicle.h);
        ctx.lineTo(icicle.x + icicle.w, icicle.y);
        ctx.closePath();
        ctx.fill();
      });

      // Draw Crystals
      lvl.crystals.forEach((c) => {
        if (!c.collected) {
          ctx.save();
          ctx.shadowBlur = 12;
          ctx.shadowColor = "#38bdf8";
          ctx.fillStyle = "#38bdf8";
          ctx.beginPath();
          ctx.arc(c.x, c.y, 8, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }
      });

      // Draw Goal Gate
      ctx.save();
      ctx.shadowBlur = 20;
      ctx.shadowColor = "#ffaa00";
      ctx.fillStyle = "#ffaa00";
      ctx.fillRect(lvl.goal.x, lvl.goal.y, lvl.goal.w, lvl.goal.h);
      ctx.restore();

      // Draw Player
      ctx.save();
      ctx.shadowBlur = p.onThermal ? 20 : 10;
      ctx.shadowColor = p.onThermal ? "#ff5500" : "#38bdf8";
      ctx.fillStyle = p.onThermal ? "#ffaa00" : "#38bdf8";
      ctx.fillRect(p.x, p.y, p.w, p.h);
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
          <div className="w-60 bg-slate-900/80 backdrop-blur-md p-3 rounded-xl border border-slate-800">
            <div className="flex justify-between text-xs font-semibold mb-1 text-orange-400">
              <span className="flex items-center gap-1">
                <Sun className="w-3.5 h-3.5" /> THERMAL WARMTH
              </span>
              <span>{Math.round(warmth)}%</span>
            </div>
            <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-cyan-400 to-orange-500" style={{ width: `${warmth}%` }} />
            </div>
          </div>

          <div className="flex items-center gap-3 pointer-events-auto">
            <div className="bg-slate-900/80 backdrop-blur-md px-4 py-2 rounded-xl border border-slate-800 text-right">
              <span className="text-xs text-slate-400 block">SCORE</span>
              <span className="text-lg font-bold text-cyan-400">{score}</span>
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
              className="w-16 h-16 bg-slate-800/80 active:bg-cyan-500/50 backdrop-blur-md rounded-2xl border border-slate-700 flex items-center justify-center text-white"
            >
              <ChevronLeft className="w-8 h-8" />
            </button>
            <button
              onTouchStart={() => setMobileControls((c) => ({ ...c, right: true }))}
              onTouchEnd={() => setMobileControls((c) => ({ ...c, right: false }))}
              onMouseDown={() => setMobileControls((c) => ({ ...c, right: true }))}
              onMouseUp={() => setMobileControls((c) => ({ ...c, right: false }))}
              className="w-16 h-16 bg-slate-800/80 active:bg-cyan-500/50 backdrop-blur-md rounded-2xl border border-slate-700 flex items-center justify-center text-white"
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
              onTouchStart={() => setMobileControls((c) => ({ ...c, jump: true }))}
              onTouchEnd={() => setMobileControls((c) => ({ ...c, jump: false }))}
              onMouseDown={() => setMobileControls((c) => ({ ...c, jump: true }))}
              onMouseUp={() => setMobileControls((c) => ({ ...c, jump: false }))}
              className="w-16 h-16 bg-blue-600/80 active:bg-blue-500 backdrop-blur-md rounded-full border border-blue-400 flex items-center justify-center font-bold text-xs"
            >
              JUMP
            </button>
          </div>
        </div>
      )}

      {/* START MODAL */}
      {gameState === "IDLE" && (
        <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-6 z-30">
          <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center">
            <Snowflake className="w-12 h-12 text-cyan-400 mx-auto mb-3 animate-spin" />
            <h1 className="text-3xl font-black text-cyan-400 mb-2">FROSTBOUND ODYSSEY</h1>
            <p className="text-sm text-slate-400 mb-6">
              Arctic Ice Precision Platformer. Navigate slippery ice platforms, dodge falling icicles, and touch thermal lamps to survive the freezing cold.
            </p>
            <button
              onClick={() => loadLevel(0)}
              className="w-full py-3 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold rounded-xl shadow-lg cursor-pointer"
            >
              START EXPEDITION
            </button>
          </div>
        </div>
      )}

      {/* LEVEL CLEAR */}
      {gameState === "LEVEL_CLEAR" && (
        <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-6 z-30">
          <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center">
            <Trophy className="w-12 h-12 text-yellow-400 mx-auto mb-3" />
            <h2 className="text-2xl font-bold text-white mb-2">SUMMIT REACHED!</h2>
            {currentLevelIdx + 1 < LEVELS.length ? (
              <button
                onClick={() => loadLevel(currentLevelIdx + 1)}
                className="w-full py-3 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-xl"
              >
                NEXT MOUNTAIN
              </button>
            ) : (
              <button onClick={() => loadLevel(0)} className="w-full py-3 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-xl">
                PLAY AGAIN
              </button>
            )}
          </div>
        </div>
      )}

      {/* GAME OVER */}
      {gameState === "GAME_OVER" && (
        <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-6 z-30">
          <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center">
            <Snowflake className="w-12 h-12 text-blue-500 mx-auto mb-3" />
            <h2 className="text-2xl font-bold text-white mb-2">FROZEN SOLID</h2>
            <p className="text-sm text-slate-400 mb-6">You succumbed to the arctic frost.</p>
            <button
              onClick={() => loadLevel(currentLevelIdx)}
              className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl flex items-center justify-center gap-2 cursor-pointer"
            >
              <RotateCcw className="w-5 h-5" /> RE-TRY EXPEDITION
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
