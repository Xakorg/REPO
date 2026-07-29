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
  Settings,
  Flame,
} from "lucide-react";

interface RotatingGear {
  x: number;
  y: number;
  radius: number;
  angle: number;
  rotSpeed: number;
}

interface PendulumBlade {
  x: number;
  y: number;
  length: number;
  angle: number;
  angularVel: number;
}

interface GoldenGearItem {
  x: number;
  y: number;
  collected: boolean;
}

export default function SteampunkClockworkClimbGame() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [gameState, setGameState] = useState<"IDLE" | "PLAYING" | "LEVEL_CLEAR" | "GAME_OVER">("IDLE");
  const [score, setScore] = useState(0);
  const [gearsCollected, setGearsCollected] = useState(0);
  const [steamPressure, setSteamPressure] = useState(100);
  const [isMuted, setIsMuted] = useState(false);

  const [mobileControls, setMobileControls] = useState({ left: false, right: false, jump: false, steam: false });

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

  const playSound = (type: "jump" | "steam" | "gear" | "hit" | "clear") => {
    if (isMuted || !audioCtxRef.current) return;
    try {
      const ctx = audioCtxRef.current;
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      if (type === "jump") {
        osc.type = "triangle";
        osc.frequency.setValueAtTime(220, now);
        osc.frequency.exponentialRampToValueAtTime(440, now + 0.12);
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.12);
        osc.start(now);
        osc.stop(now + 0.12);
      } else if (type === "steam") {
        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(500, now);
        osc.frequency.linearRampToValueAtTime(200, now + 0.18);
        gain.gain.setValueAtTime(0.25, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.18);
        osc.start(now);
        osc.stop(now + 0.18);
      } else if (type === "gear") {
        osc.type = "sine";
        osc.frequency.setValueAtTime(523, now);
        osc.frequency.setValueAtTime(659, now + 0.08);
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
        osc.start(now);
        osc.stop(now + 0.2);
      } else if (type === "hit") {
        osc.type = "square";
        osc.frequency.setValueAtTime(150, now);
        osc.frequency.exponentialRampToValueAtTime(40, now + 0.15);
        gain.gain.setValueAtTime(0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
        osc.start(now);
        osc.stop(now + 0.15);
      } else if (type === "clear") {
        osc.type = "triangle";
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
    y: 500,
    w: 26,
    h: 36,
    vx: 0,
    vy: 0,
    speed: 5.5,
    jumpPower: 11,
    grounded: false,
    steamPressure: 100,
    doubleJumpAvailable: true,
  });

  const levelRef = useRef({
    width: 2800,
    height: 700,
    goal: { x: 2650, y: 150, w: 50, h: 80 },
    platforms: [
      { x: 0, y: 580, w: 350, h: 80 },
      { x: 420, y: 500, w: 180, h: 30 },
      { x: 680, y: 440, w: 160, h: 30 },
      { x: 920, y: 380, w: 200, h: 30 },
      { x: 1200, y: 320, w: 180, h: 30 },
      { x: 1500, y: 400, w: 180, h: 30 },
      { x: 1760, y: 330, w: 160, h: 30 },
      { x: 2020, y: 260, w: 200, h: 30 },
      { x: 2300, y: 200, w: 180, h: 30 },
      { x: 2550, y: 220, w: 220, h: 100 },
    ],
    gears: [
      { x: 550, y: 300, radius: 55, angle: 0, rotSpeed: 0.02 },
      { x: 1050, y: 240, radius: 65, angle: 0, rotSpeed: -0.025 },
      { x: 1650, y: 220, radius: 60, angle: 0, rotSpeed: 0.03 },
      { x: 2150, y: 180, radius: 70, angle: 0, rotSpeed: -0.02 },
    ] as RotatingGear[],
    pendulums: [
      { x: 800, y: 100, length: 220, angle: Math.PI / 4, angularVel: 0 },
      { x: 1380, y: 100, length: 200, angle: -Math.PI / 4, angularVel: 0 },
      { x: 1900, y: 100, length: 240, angle: Math.PI / 3, angularVel: 0 },
    ] as PendulumBlade[],
    gearItems: [
      { x: 480, y: 460, collected: false },
      { x: 1050, y: 160, collected: false },
      { x: 1840, y: 280, collected: false },
      { x: 2380, y: 160, collected: false },
    ] as GoldenGearItem[],
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
    p.y = 500;
    p.vx = 0;
    p.vy = 0;
    p.steamPressure = 100;

    levelRef.current.gearItems.forEach((gi) => (gi.collected = false));
    setScore(0);
    setGearsCollected(0);
    setSteamPressure(100);
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
        const jumpPressed = keysRef.current["KeyW"] || keysRef.current["Space"] || keysRef.current["ArrowUp"] || mobileControls.jump;
        const steamPressed = keysRef.current["KeyK"] || keysRef.current["ShiftLeft"] || mobileControls.steam;

        // X movement
        if (moveLeft) p.vx = -p.speed;
        else if (moveRight) p.vx = p.speed;
        else p.vx *= 0.78;

        // Steam Burst (Super Jump)
        if (steamPressed && p.steamPressure >= 30) {
          p.vy = -14;
          p.steamPressure -= 30;
          playSound("steam");

          // Steam particles
          for (let i = 0; i < 12; i++) {
            particlesRef.current.push({
              x: p.x + p.w / 2,
              y: p.y + p.h,
              vx: (Math.random() - 0.5) * 4,
              vy: 2 + Math.random() * 4,
              radius: 4 + Math.random() * 4,
              color: "#e2e8f0",
              alpha: 0.8,
            });
          }
        }

        // Steam Pressure recharge
        if (p.steamPressure < 100) {
          p.steamPressure = Math.min(100, p.steamPressure + 0.3);
          setSteamPressure(p.steamPressure);
        }

        // Gravity
        p.vy += 0.55;

        // Platform collisions
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
            if (p.vy > 0) {
              p.y = plat.y - p.h;
              p.vy = 0;
              p.grounded = true;
              p.doubleJumpAvailable = true;
            } else if (p.vy < 0) {
              p.y = plat.y + plat.h;
              p.vy = 0;
            }
          }
        });

        // Rotating Gear Platforms collision
        lvl.gears.forEach((gear) => {
          gear.angle += gear.rotSpeed;
          const dist = Math.hypot(p.x + p.w / 2 - gear.x, p.y + p.h / 2 - gear.y);
          if (dist < gear.radius + 15 && dist > gear.radius - 15) {
            p.grounded = true;
            p.vy = 0;
            p.x += Math.cos(gear.angle) * 1.5;
          }
        });

        // Jump Handling
        if (jumpPressed) {
          if (p.grounded) {
            p.vy = -p.jumpPower;
            p.grounded = false;
            playSound("jump");
          } else if (p.doubleJumpAvailable) {
            p.vy = -p.jumpPower * 0.85;
            p.doubleJumpAvailable = false;
            playSound("jump");
          }
        }

        // Out of bounds
        if (p.y > lvl.height + 100) {
          playSound("hit");
          setGameState("GAME_OVER");
        }

        // Pendulum Blade hazards
        lvl.pendulums.forEach((pend) => {
          const gravityConstant = 0.002;
          const angularAccel = -gravityConstant * Math.sin(pend.angle);
          pend.angularVel += angularAccel;
          pend.angle += pend.angularVel;

          const bladeX = pend.x + Math.sin(pend.angle) * pend.length;
          const bladeY = pend.y + Math.cos(pend.angle) * pend.length;

          if (Math.hypot(p.x + p.w / 2 - bladeX, p.y + p.h / 2 - bladeY) < 25) {
            playSound("hit");
            setGameState("GAME_OVER");
          }
        });

        // Golden Gear Pickups
        lvl.gearItems.forEach((gi) => {
          if (!gi.collected && Math.hypot(p.x + p.w / 2 - gi.x, p.y + p.h / 2 - gi.y) < 25) {
            gi.collected = true;
            setGearsCollected((g) => g + 1);
            setScore((s) => s + 500);
            playSound("gear");
          }
        });

        // Goal reached check
        if (p.x < lvl.goal.x + lvl.goal.w && p.x + p.w > lvl.goal.x && p.y < lvl.goal.y + lvl.goal.h && p.y + p.h > lvl.goal.y) {
          playSound("clear");
          setGameState("LEVEL_CLEAR");
        }

        cameraXRef.current = Math.max(0, Math.min(lvl.width - viewW, p.x - viewW / 3));

        // Update Steam particles
        particlesRef.current.forEach((part) => {
          part.x += part.vx;
          part.y += part.vy;
          part.alpha -= 0.03;
        });
        particlesRef.current = particlesRef.current.filter((p) => p.alpha > 0);
      }

      // --- RENDERING ---
      const camX = cameraXRef.current;

      // Warm Steampunk Brass Atmosphere BG
      ctx.fillStyle = "#1c140d";
      ctx.fillRect(0, 0, viewW, viewH);

      ctx.save();
      ctx.translate(-camX, 0);

      // Draw Platforms
      lvl.platforms.forEach((plat) => {
        ctx.fillStyle = "#452917";
        ctx.shadowBlur = 10;
        ctx.shadowColor = "#d97706";
        ctx.fillRect(plat.x, plat.y, plat.w, plat.h);
        ctx.strokeStyle = "#fbbf24";
        ctx.lineWidth = 1.5;
        ctx.strokeRect(plat.x, plat.y, plat.w, plat.h);
      });

      // Draw Rotating Brass Gears
      lvl.gears.forEach((gear) => {
        ctx.save();
        ctx.translate(gear.x, gear.y);
        ctx.rotate(gear.angle);
        ctx.strokeStyle = "#d97706";
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(0, 0, gear.radius, 0, Math.PI * 2);
        ctx.stroke();

        // Gear Cogs
        for (let a = 0; a < Math.PI * 2; a += Math.PI / 4) {
          const cx = Math.cos(a) * gear.radius;
          const cy = Math.sin(a) * gear.radius;
          ctx.fillStyle = "#fbbf24";
          ctx.fillRect(cx - 6, cy - 6, 12, 12);
        }
        ctx.restore();
      });

      // Draw Pendulum Blades
      lvl.pendulums.forEach((pend) => {
        const bladeX = pend.x + Math.sin(pend.angle) * pend.length;
        const bladeY = pend.y + Math.cos(pend.angle) * pend.length;

        ctx.strokeStyle = "#78350f";
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(pend.x, pend.y);
        ctx.lineTo(bladeX, bladeY);
        ctx.stroke();

        ctx.save();
        ctx.shadowBlur = 15;
        ctx.shadowColor = "#ef4444";
        ctx.fillStyle = "#ef4444";
        ctx.beginPath();
        ctx.arc(bladeX, bladeY, 18, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });

      // Draw Golden Gear Items
      lvl.gearItems.forEach((gi) => {
        if (!gi.collected) {
          ctx.save();
          ctx.shadowBlur = 15;
          ctx.shadowColor = "#fbbf24";
          ctx.fillStyle = "#fbbf24";
          ctx.beginPath();
          ctx.arc(gi.x, gi.y, 9, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }
      });

      // Draw Goal Door
      ctx.save();
      ctx.shadowBlur = 20;
      ctx.shadowColor = "#fbbf24";
      ctx.fillStyle = "#fbbf24";
      ctx.fillRect(lvl.goal.x, lvl.goal.y, lvl.goal.w, lvl.goal.h);
      ctx.restore();

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
      ctx.shadowBlur = 12;
      ctx.shadowColor = "#fbbf24";
      ctx.fillStyle = "#d97706";
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
            <div className="flex justify-between text-xs font-semibold mb-1 text-amber-400">
              <span className="flex items-center gap-1">
                <Flame className="w-3.5 h-3.5" /> STEAM PRESSURE
              </span>
              <span>{Math.round(steamPressure)}%</span>
            </div>
            <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden">
              <div className="h-full bg-amber-400" style={{ width: `${steamPressure}%` }} />
            </div>
          </div>

          <div className="flex items-center gap-3 pointer-events-auto">
            <div className="bg-slate-900/80 backdrop-blur-md px-4 py-2 rounded-xl border border-slate-800 text-right">
              <span className="text-xs text-slate-400 block">SCORE</span>
              <span className="text-lg font-bold text-amber-400">{score}</span>
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
              className="w-16 h-16 bg-slate-800/80 active:bg-amber-500/50 backdrop-blur-md rounded-2xl border border-slate-700 flex items-center justify-center text-white"
            >
              <ChevronLeft className="w-8 h-8" />
            </button>
            <button
              onTouchStart={() => setMobileControls((c) => ({ ...c, right: true }))}
              onTouchEnd={() => setMobileControls((c) => ({ ...c, right: false }))}
              onMouseDown={() => setMobileControls((c) => ({ ...c, right: true }))}
              onMouseUp={() => setMobileControls((c) => ({ ...c, right: false }))}
              className="w-16 h-16 bg-slate-800/80 active:bg-amber-500/50 backdrop-blur-md rounded-2xl border border-slate-700 flex items-center justify-center text-white"
            >
              <ChevronRight className="w-8 h-8" />
            </button>
          </div>

          <div className="flex gap-3 pointer-events-auto">
            <button
              onTouchStart={() => setMobileControls((c) => ({ ...c, steam: true }))}
              onTouchEnd={() => setMobileControls((c) => ({ ...c, steam: false }))}
              onMouseDown={() => setMobileControls((c) => ({ ...c, steam: true }))}
              onMouseUp={() => setMobileControls((c) => ({ ...c, steam: false }))}
              className="w-16 h-16 bg-amber-600/80 active:bg-amber-500 backdrop-blur-md rounded-full border border-amber-400 flex items-center justify-center font-bold text-xs"
            >
              STEAM BURST
            </button>
            <button
              onTouchStart={() => setMobileControls((c) => ({ ...c, jump: true }))}
              onTouchEnd={() => setMobileControls((c) => ({ ...c, jump: false }))}
              onMouseDown={() => setMobileControls((c) => ({ ...c, jump: true }))}
              onMouseUp={() => setMobileControls((c) => ({ ...c, jump: false }))}
              className="w-16 h-16 bg-yellow-600/80 active:bg-yellow-500 backdrop-blur-md rounded-full border border-yellow-400 flex items-center justify-center font-bold text-xs"
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
            <Settings className="w-12 h-12 text-amber-400 mx-auto mb-3 animate-spin" />
            <h1 className="text-3xl font-black text-amber-400 mb-2">STEAMPUNK CLOCKWORK CLIMB</h1>
            <p className="text-sm text-slate-400 mb-6">
              Steampunk Brass Tower Platformer. Ride rotating cogs, avoid swinging pendulum blades, and release steam bursts to scale the clocktower!
            </p>
            <button
              onClick={startGame}
              className="w-full py-3 bg-gradient-to-r from-amber-600 to-yellow-500 hover:from-amber-500 hover:to-yellow-400 text-white font-bold rounded-xl shadow-lg cursor-pointer"
            >
              ASCEND TOWER
            </button>
          </div>
        </div>
      )}

      {/* LEVEL CLEAR */}
      {gameState === "LEVEL_CLEAR" && (
        <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-6 z-30">
          <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center">
            <Trophy className="w-12 h-12 text-yellow-400 mx-auto mb-3" />
            <h2 className="text-2xl font-bold text-white mb-2">CLOCKTOWER REACHED!</h2>
            <button onClick={startGame} className="w-full py-3 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-xl">
              ASCEND AGAIN
            </button>
          </div>
        </div>
      )}

      {/* GAME OVER */}
      {gameState === "GAME_OVER" && (
        <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-6 z-30">
          <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center">
            <Settings className="w-12 h-12 text-red-500 mx-auto mb-3" />
            <h2 className="text-2xl font-bold text-white mb-2">CRUSHED BY GEARS</h2>
            <p className="text-sm text-slate-400 mb-6">Mechanical hazard collision.</p>
            <button
              onClick={startGame}
              className="w-full py-3 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-xl flex items-center justify-center gap-2 cursor-pointer"
            >
              <RotateCcw className="w-5 h-5" /> RE-TRY CLIMB
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
