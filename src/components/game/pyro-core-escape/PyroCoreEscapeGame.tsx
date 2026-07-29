"use client";

import React, { useEffect, useRef, useState } from "react";
import {
  Play,
  RotateCcw,
  Volume2,
  VolumeX,
  Flame,
  Trophy,
  Zap,
  ChevronLeft,
  ChevronRight,
  Shield,
} from "lucide-react";

interface Platform {
  x: number;
  y: number;
  w: number;
  h: number;
  type?: "normal" | "crumbling" | "bounce";
  crumbled?: boolean;
}

export default function PyroCoreEscapeGame() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [gameState, setGameState] = useState<"IDLE" | "PLAYING" | "GAME_OVER">("IDLE");
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [fuel, setFuel] = useState(100);
  const [isMuted, setIsMuted] = useState(false);

  const [mobileControls, setMobileControls] = useState({ left: false, right: false, thrust: false, dash: false });

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

  const playSound = (type: "thrust" | "dash" | "bounce" | "lava" | "point") => {
    if (isMuted || !audioCtxRef.current) return;
    try {
      const ctx = audioCtxRef.current;
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      if (type === "thrust") {
        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(180, now);
        osc.frequency.linearRampToValueAtTime(320, now + 0.08);
        gain.gain.setValueAtTime(0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.08);
        osc.start(now);
        osc.stop(now + 0.08);
      } else if (type === "dash") {
        osc.type = "sine";
        osc.frequency.setValueAtTime(600, now);
        osc.frequency.exponentialRampToValueAtTime(200, now + 0.12);
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.12);
        osc.start(now);
        osc.stop(now + 0.12);
      } else if (type === "bounce") {
        osc.type = "triangle";
        osc.frequency.setValueAtTime(250, now);
        osc.frequency.exponentialRampToValueAtTime(700, now + 0.15);
        gain.gain.setValueAtTime(0.25, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
        osc.start(now);
        osc.stop(now + 0.15);
      } else if (type === "lava") {
        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(100, now);
        osc.frequency.linearRampToValueAtTime(30, now + 0.35);
        gain.gain.setValueAtTime(0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.35);
        osc.start(now);
        osc.stop(now + 0.35);
      } else if (type === "point") {
        osc.type = "sine";
        osc.frequency.setValueAtTime(587, now);
        osc.frequency.setValueAtTime(880, now + 0.08);
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.18);
        osc.start(now);
        osc.stop(now + 0.18);
      }
    } catch {}
  };

  const playerRef = useRef({
    x: 400,
    y: 500,
    w: 24,
    h: 36,
    vx: 0,
    vy: 0,
    speed: 6,
    fuel: 100,
    maxFuel: 100,
    isDashing: false,
    dashTimer: 0,
    dashCooldown: 0,
    grounded: false,
  });

  const lavaYRef = useRef(700);
  const lavaSpeedRef = useRef(1.8);
  const platformsRef = useRef<Platform[]>([]);
  const particlesRef = useRef<{ x: number; y: number; vx: number; vy: number; radius: number; color: string; alpha: number }[]>([]);
  const keysRef = useRef<{ [key: string]: boolean }>({});
  const cameraYRef = useRef(0);

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

  const generateInitialPlatforms = () => {
    const plats: Platform[] = [{ x: 0, y: 550, w: 800, h: 40, type: "normal" }];
    let curY = 460;
    for (let i = 0; i < 40; i++) {
      const platW = 120 + Math.random() * 100;
      const platX = Math.random() * (800 - platW);
      const isBounce = Math.random() < 0.15;
      const isCrumble = !isBounce && Math.random() < 0.25;

      plats.push({
        x: platX,
        y: curY,
        w: platW,
        h: 22,
        type: isBounce ? "bounce" : isCrumble ? "crumbling" : "normal",
      });

      curY -= 90 + Math.random() * 40;
    }
    platformsRef.current = plats;
  };

  const startGame = () => {
    initAudio();
    const p = playerRef.current;
    p.x = 380;
    p.y = 480;
    p.vx = 0;
    p.vy = 0;
    p.fuel = 100;

    lavaYRef.current = 650;
    lavaSpeedRef.current = 1.8;
    cameraYRef.current = 0;
    setScore(0);
    setFuel(100);
    generateInitialPlatforms();
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

      if (gameState === "PLAYING") {
        const moveLeft = keysRef.current["KeyA"] || keysRef.current["ArrowLeft"] || mobileControls.left;
        const moveRight = keysRef.current["KeyD"] || keysRef.current["ArrowRight"] || mobileControls.right;
        const thrustPressed = keysRef.current["KeyW"] || keysRef.current["Space"] || keysRef.current["ArrowUp"] || mobileControls.thrust;
        const dashPressed = keysRef.current["KeyK"] || keysRef.current["ShiftLeft"] || mobileControls.dash;

        // X Movement
        if (moveLeft) p.vx = -p.speed;
        else if (moveRight) p.vx = p.speed;
        else p.vx *= 0.8;

        // Jetpack Thrust
        if (thrustPressed && p.fuel > 0) {
          p.vy -= 0.85;
          p.fuel = Math.max(0, p.fuel - 0.6);
          playSound("thrust");

          // Thrust flame particles
          particlesRef.current.push({
            x: p.x + p.w / 2 + (Math.random() - 0.5) * 6,
            y: p.y + p.h,
            vx: (Math.random() - 0.5) * 2,
            vy: 3 + Math.random() * 3,
            radius: 3 + Math.random() * 3,
            color: "#ff5500",
            alpha: 1,
          });
        } else {
          // Gravity
          p.vy += 0.5;
        }

        // Fuel regeneration when grounded
        if (p.grounded && p.fuel < p.maxFuel) {
          p.fuel = Math.min(p.maxFuel, p.fuel + 1.5);
        }
        setFuel(p.fuel);

        // Dash logic
        if (dashPressed && p.dashCooldown <= 0 && p.fuel >= 20) {
          p.isDashing = true;
          p.dashTimer = 8;
          p.dashCooldown = 35;
          p.fuel -= 20;
          playSound("dash");
        }

        if (p.isDashing) {
          p.vy = -14;
          p.dashTimer -= 1;
          if (p.dashTimer <= 0) p.isDashing = false;
        }

        if (p.dashCooldown > 0) p.dashCooldown -= 1;

        // Y Collision with Platforms
        p.grounded = false;
        p.x += p.vx;
        p.y += p.vy;

        platformsRef.current.forEach((plat) => {
          if (plat.crumbled) return;
          if (p.x < plat.x + plat.w && p.x + p.w > plat.x && p.y + p.h >= plat.y && p.y + p.h <= plat.y + 15 && p.vy > 0) {
            p.y = plat.y - p.h;
            p.vy = 0;
            p.grounded = true;

            if (plat.type === "bounce") {
              p.vy = -16;
              playSound("bounce");
            } else if (plat.type === "crumbling") {
              setTimeout(() => {
                plat.crumbled = true;
              }, 250);
            }
          }
        });

        // Screen Side Wrap
        if (p.x < -p.w) p.x = viewW;
        if (p.x > viewW) p.x = -p.w;

        // Rising Lava Logic
        lavaYRef.current -= lavaSpeedRef.current;
        lavaSpeedRef.current += 0.0003; // Accelerate over time

        if (p.y + p.h >= lavaYRef.current) {
          playSound("lava");
          setGameState("GAME_OVER");
          if (score > highScore) setHighScore(score);
        }

        // Camera Follow (Moves up when player goes higher)
        const targetCamY = Math.min(0, -p.y + viewH / 2);
        if (targetCamY < cameraYRef.current) {
          cameraYRef.current = targetCamY;
          const currentHeightScore = Math.floor(-cameraYRef.current);
          if (currentHeightScore > score) {
            setScore(currentHeightScore);
          }
        }

        // Generate infinite platforms higher up
        const topPlatY = platformsRef.current[platformsRef.current.length - 1].y;
        if (p.y < topPlatY + 600) {
          let curY = topPlatY - 100;
          for (let i = 0; i < 20; i++) {
            const platW = 100 + Math.random() * 100;
            const platX = Math.random() * (viewW - platW);
            const isBounce = Math.random() < 0.15;
            const isCrumble = !isBounce && Math.random() < 0.3;

            platformsRef.current.push({
              x: platX,
              y: curY,
              w: platW,
              h: 22,
              type: isBounce ? "bounce" : isCrumble ? "crumbling" : "normal",
            });
            curY -= 90 + Math.random() * 40;
          }
        }

        // Update particles
        particlesRef.current.forEach((part) => {
          part.x += part.vx;
          part.y += part.vy;
          part.alpha -= 0.04;
        });
        particlesRef.current = particlesRef.current.filter((p) => p.alpha > 0);
      }

      // --- RENDERING ---
      const camY = cameraYRef.current;

      // Dark Volcanic Chamber Background
      ctx.fillStyle = "#180808";
      ctx.fillRect(0, 0, viewW, viewH);

      ctx.save();
      ctx.translate(0, -camY);

      // Draw Platforms
      platformsRef.current.forEach((plat) => {
        if (plat.crumbled) return;
        if (plat.type === "bounce") {
          ctx.fillStyle = "#ffaa00";
          ctx.shadowBlur = 10;
          ctx.shadowColor = "#ffaa00";
        } else if (plat.type === "crumbling") {
          ctx.fillStyle = "#7f1d1d";
          ctx.shadowBlur = 0;
        } else {
          ctx.fillStyle = "#371b1b";
          ctx.shadowBlur = 0;
        }

        ctx.fillRect(plat.x, plat.y, plat.w, plat.h);
        ctx.strokeStyle = "#ef4444";
        ctx.lineWidth = 1.5;
        ctx.strokeRect(plat.x, plat.y, plat.w, plat.h);
      });

      // Draw Particles
      particlesRef.current.forEach((part) => {
        ctx.save();
        ctx.globalAlpha = part.alpha;
        ctx.fillStyle = part.color;
        ctx.beginPath();
        ctx.arc(part.x, part.y, part.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });

      // Draw Player
      ctx.save();
      ctx.shadowBlur = 15;
      ctx.shadowColor = "#f97316";
      ctx.fillStyle = "#f97316";
      ctx.fillRect(p.x, p.y, p.w, p.h);
      ctx.restore();

      // Draw Rising Lava Ocean
      ctx.save();
      ctx.fillStyle = "#dc2626";
      ctx.shadowBlur = 30;
      ctx.shadowColor = "#dc2626";
      ctx.fillRect(0, lavaYRef.current, viewW, viewH + 1000);
      ctx.restore();

      ctx.restore();

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [gameState, mobileControls, score, highScore]);

  return (
    <div className="relative w-full h-screen bg-slate-950 text-white select-none overflow-hidden font-sans">
      <canvas ref={canvasRef} className="w-full h-full block cursor-crosshair" />

      {/* HUD */}
      {gameState !== "IDLE" && (
        <div className="absolute top-0 left-0 w-full p-4 pointer-events-none flex justify-between items-start z-10">
          <div className="w-60 bg-slate-900/80 backdrop-blur-md p-3 rounded-xl border border-slate-800">
            <div className="flex justify-between text-xs font-semibold mb-1 text-orange-400">
              <span className="flex items-center gap-1">
                <Flame className="w-3.5 h-3.5" /> JETPACK FUEL
              </span>
              <span>{Math.round(fuel)}%</span>
            </div>
            <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-yellow-500 to-red-600" style={{ width: `${fuel}%` }} />
            </div>
          </div>

          <div className="flex items-center gap-3 pointer-events-auto">
            <div className="bg-slate-900/80 backdrop-blur-md px-4 py-2 rounded-xl border border-slate-800 text-right">
              <span className="text-xs text-slate-400 block">HEIGHT SCORE</span>
              <span className="text-lg font-bold text-orange-400">{score}m</span>
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
              className="w-16 h-16 bg-slate-800/80 active:bg-orange-500/50 backdrop-blur-md rounded-2xl border border-slate-700 flex items-center justify-center text-white"
            >
              <ChevronLeft className="w-8 h-8" />
            </button>
            <button
              onTouchStart={() => setMobileControls((c) => ({ ...c, right: true }))}
              onTouchEnd={() => setMobileControls((c) => ({ ...c, right: false }))}
              onMouseDown={() => setMobileControls((c) => ({ ...c, right: true }))}
              onMouseUp={() => setMobileControls((c) => ({ ...c, right: false }))}
              className="w-16 h-16 bg-slate-800/80 active:bg-orange-500/50 backdrop-blur-md rounded-2xl border border-slate-700 flex items-center justify-center text-white"
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
              className="w-16 h-16 bg-orange-600/80 active:bg-orange-500 backdrop-blur-md rounded-full border border-orange-400 flex items-center justify-center font-bold text-xs"
            >
              SUPER BOOST
            </button>
            <button
              onTouchStart={() => setMobileControls((c) => ({ ...c, thrust: true }))}
              onTouchEnd={() => setMobileControls((c) => ({ ...c, thrust: false }))}
              onMouseDown={() => setMobileControls((c) => ({ ...c, thrust: true }))}
              onMouseUp={() => setMobileControls((c) => ({ ...c, thrust: false }))}
              className="w-16 h-16 bg-red-600/80 active:bg-red-500 backdrop-blur-md rounded-full border border-red-400 flex items-center justify-center font-bold text-xs"
            >
              THRUST
            </button>
          </div>
        </div>
      )}

      {/* START MODAL */}
      {gameState === "IDLE" && (
        <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-6 z-30">
          <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center">
            <Flame className="w-12 h-12 text-red-500 mx-auto mb-3 animate-bounce" />
            <h1 className="text-3xl font-black text-red-500 mb-2">PYRO CORE ESCAPE</h1>
            <p className="text-sm text-slate-400 mb-6">
              Volcanic Magma Escape Platformer. Thrust upward with your jetpack and climb higher before the rising lava ocean consumes you!
            </p>
            <button
              onClick={startGame}
              className="w-full py-3 bg-gradient-to-r from-red-600 to-orange-500 hover:from-red-500 hover:to-orange-400 text-white font-bold rounded-xl shadow-lg cursor-pointer"
            >
              LAUNCH JETPACK
            </button>
          </div>
        </div>
      )}

      {/* GAME OVER */}
      {gameState === "GAME_OVER" && (
        <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-6 z-30">
          <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center">
            <Flame className="w-12 h-12 text-red-500 mx-auto mb-3" />
            <h2 className="text-2xl font-bold text-white mb-2">CONSUMED BY LAVA</h2>
            <p className="text-sm text-slate-400 mb-2">Height Reached: {score}m</p>
            <p className="text-xs text-orange-400 mb-6">Best Record: {highScore}m</p>
            <button
              onClick={startGame}
              className="w-full py-3 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl flex items-center justify-center gap-2 cursor-pointer"
            >
              <RotateCcw className="w-5 h-5" /> RE-TRY ESCAPE
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
