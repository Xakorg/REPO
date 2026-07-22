'use client';

import React, { useEffect, useRef, useState } from 'react';

export default function LunarRacer() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [gameState, setGameState] = useState<'START' | 'PLAYING' | 'GAMEOVER'>('START');
  const [score, setScore] = useState(0);

  const stateRef = useRef({
    gameState: 'START',
    score: 0,
    rover: { x: 100, y: 200, vx: 0, vy: 0, angle: 0, vAngle: 0 },
    keys: { gas: false, left: false, right: false },
    orbs: [] as Array<{ x: number; y: number; collected: boolean }>,
    cameraX: 0,
  });

  const getTerrainY = (x: number) => {
    return 280 + Math.sin(x * 0.01) * 40 + Math.cos(x * 0.025) * 20;
  };

  const startGame = () => {
    stateRef.current = {
      gameState: 'PLAYING',
      score: 0,
      rover: { x: 100, y: getTerrainY(100) - 20, vx: 0, vy: 0, angle: 0, vAngle: 0 },
      keys: { gas: false, left: false, right: false },
      orbs: Array.from({ length: 40 }).map((_, i) => {
        const ox = 300 + i * 200 + Math.random() * 80;
        return { x: ox, y: getTerrainY(ox) - 50, collected: false };
      }),
      cameraX: 0,
    };
    setScore(0);
    setGameState('PLAYING');
  };

  const gameOver = () => {
    const finalScore = Math.floor(stateRef.current.score);
    setGameState('GAMEOVER');
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('xakteir-game-score', { detail: { score: finalScore } }));
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === 'd' || e.key === ' ') stateRef.current.keys.gas = true;
      if (e.key === 'ArrowLeft' || e.key === 'a') stateRef.current.keys.left = true;
      if (e.key === 'ArrowUp' || e.key === 'w') stateRef.current.keys.right = true;
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === 'd' || e.key === ' ') stateRef.current.keys.gas = false;
      if (e.key === 'ArrowLeft' || e.key === 'a') stateRef.current.keys.left = false;
      if (e.key === 'ArrowUp' || e.key === 'w') stateRef.current.keys.right = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;

    const loop = () => {
      const s = stateRef.current;

      if (s.gameState === 'PLAYING') {
        const r = s.rover;
        const groundY = getTerrainY(r.x);

        // Gas / Accelerate
        if (s.keys.gas) {
          r.vx += Math.cos(r.angle) * 0.25;
          r.vy += Math.sin(r.angle) * 0.25;
        }

        // Tilt controls
        if (s.keys.left) r.vAngle -= 0.04;
        if (s.keys.right) r.vAngle += 0.04;

        // Moon Low Gravity & Friction
        r.vy += 0.12; // low gravity
        r.vx *= 0.98;
        r.vy *= 0.98;
        r.vAngle *= 0.9;

        r.x += r.vx;
        r.y += r.vy;
        r.angle += r.vAngle;

        // Ground Collision
        if (r.y >= groundY - 15) {
          r.y = groundY - 15;
          r.vy = 0;

          // Slope alignment
          const nextY = getTerrainY(r.x + 5);
          const slopeAngle = Math.atan2(nextY - groundY, 5);
          r.angle += (slopeAngle - r.angle) * 0.2;

          // Check upside down crash
          const angleDiff = Math.abs((r.angle % (Math.PI * 2)) - slopeAngle);
          if (angleDiff > Math.PI * 0.6) {
            gameOver();
          }
        }

        // Camera follow
        s.cameraX += (r.x - 150 - s.cameraX) * 0.1;

        // Score based on distance
        s.score = Math.max(s.score, Math.floor(r.x / 10));
        setScore(s.score);

        // Collect Orbs
        s.orbs.forEach((orb) => {
          if (!orb.collected && Math.hypot(r.x - orb.x, r.y - orb.y) < 30) {
            orb.collected = true;
            s.score += 50;
          }
        });
      }

      // RENDER LUNAR LANDSCAPE
      ctx.fillStyle = '#09090b';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.save();
      ctx.translate(-s.cameraX, 0);

      // Draw Moon Stars / Sky
      ctx.fillStyle = '#ffffff';
      for (let i = 0; i < 50; i++) {
        const starX = (s.cameraX * 0.8 + i * 120) % (canvas.width * 2);
        ctx.fillRect(starX, (i * 37) % 200, 2, 2);
      }

      // Terrain Surface
      ctx.fillStyle = '#27272a';
      ctx.strokeStyle = '#a1a1aa';
      ctx.lineWidth = 3;

      ctx.beginPath();
      const startX = Math.floor(s.cameraX - 50);
      const endX = Math.ceil(s.cameraX + canvas.width + 50);

      ctx.moveTo(startX, canvas.height);
      for (let x = startX; x <= endX; x += 10) {
        ctx.lineTo(x, getTerrainY(x));
      }
      ctx.lineTo(endX, canvas.height);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Draw Orbs
      s.orbs.forEach((orb) => {
        if (!orb.collected) {
          ctx.fillStyle = '#f59e0b';
          ctx.shadowColor = '#f59e0b';
          ctx.shadowBlur = 12;
          ctx.beginPath();
          ctx.arc(orb.x, orb.y, 8, 0, Math.PI * 2);
          ctx.fill();
        }
      });

      // Draw Moon Rover
      ctx.save();
      ctx.translate(s.rover.x, s.rover.y);
      ctx.rotate(s.rover.angle);

      ctx.fillStyle = '#e4e4e7';
      ctx.shadowColor = '#00f3ff';
      ctx.shadowBlur = 10;
      ctx.fillRect(-15, -10, 30, 15); // Rover Body

      ctx.fillStyle = '#38bdf8';
      ctx.fillRect(0, -14, 10, 6); // Windshield

      // Wheels
      ctx.fillStyle = '#71717a';
      ctx.shadowBlur = 0;
      ctx.beginPath();
      ctx.arc(-10, 8, 6, 0, Math.PI * 2);
      ctx.arc(10, 8, 6, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
      ctx.restore();

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-[500px] bg-zinc-950 text-white p-4 rounded-xl border border-zinc-800">
      <div className="mb-4 text-center">
        <h2 className="text-3xl font-extrabold tracking-wider text-amber-400 drop-shadow-[0_0_10px_rgba(245,158,11,0.5)]">
          LUNAR RACER
        </h2>
        <div className="flex gap-6 mt-2 text-sm font-semibold text-zinc-400">
          <span>DISTANCE: <strong className="text-yellow-400">{score}m</strong></span>
        </div>
      </div>

      <div className="relative">
        <canvas
          ref={canvasRef}
          width={600}
          height={380}
          className="bg-zinc-950 border-2 border-amber-500/30 rounded-lg shadow-inner"
        />

        {gameState !== 'PLAYING' && (
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center rounded-lg">
            <h3 className="text-2xl font-bold text-amber-400 mb-2">
              {gameState === 'START' ? 'MOON EXPLORER' : 'ROVER FLIPPED!'}
            </h3>
            <p className="text-zinc-400 text-xs mb-6 text-center max-w-xs">
              {gameState === 'START'
                ? 'Drive across low-gravity moon craters! Hold [GAS] to accelerate, tilt Left/Right to keep rover balanced!'
                : `Distance Reached: ${score}m`}
            </p>
            <button
              onClick={startGame}
              className="px-6 py-2 bg-amber-500 hover:bg-amber-400 text-black font-bold rounded-full transition-all shadow-[0_0_15px_rgba(245,158,11,0.4)]"
            >
              {gameState === 'START' ? 'LAUNCH ROVER' : 'TRY AGAIN'}
            </button>
          </div>
        )}
      </div>

      <div className="mt-4 flex gap-4 text-xs text-zinc-400">
        <span>[SPACE / RIGHT] Gas</span>
        <span>[LEFT / A] Tilt Back</span>
        <span>[UP / W] Tilt Forward</span>
      </div>

      <div className="mt-2 flex gap-3">
        <button
          onMouseDown={() => (stateRef.current.keys.left = true)}
          onMouseUp={() => (stateRef.current.keys.left = false)}
          onTouchStart={() => (stateRef.current.keys.left = true)}
          onTouchEnd={() => (stateRef.current.keys.left = false)}
          className="px-4 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-amber-400 rounded-md text-xs font-semibold border border-amber-500/20"
        >
          ↺ TILT BACK
        </button>
        <button
          onMouseDown={() => (stateRef.current.keys.gas = true)}
          onMouseUp={() => (stateRef.current.keys.gas = false)}
          onTouchStart={() => (stateRef.current.keys.gas = true)}
          onTouchEnd={() => (stateRef.current.keys.gas = false)}
          className="px-6 py-1.5 bg-amber-500 hover:bg-amber-400 text-black rounded-md text-xs font-bold shadow-[0_0_10px_rgba(245,158,11,0.3)]"
        >
          GAS 🚀
        </button>
        <button
          onMouseDown={() => (stateRef.current.keys.right = true)}
          onMouseUp={() => (stateRef.current.keys.right = false)}
          onTouchStart={() => (stateRef.current.keys.right = true)}
          onTouchEnd={() => (stateRef.current.keys.right = false)}
          className="px-4 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-amber-400 rounded-md text-xs font-semibold border border-amber-500/20"
        >
          ↻ TILT FWD
        </button>
      </div>
    </div>
  );
}
