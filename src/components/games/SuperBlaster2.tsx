'use client';

import React, { useEffect, useRef, useState } from 'react';

interface Sphere {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  sizeIndex: number;
}

export default function SuperBlaster2() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [gameState, setGameState] = useState<'start' | 'playing' | 'gameover'>('start');
  const [score, setScore] = useState(0);

  useEffect(() => {
    if (gameState !== 'playing') return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let currentScore = 0;

    const player = { x: canvas.width / 2, y: canvas.height - 25, width: 26, height: 35, speed: 6 };
    const lasers: { x: number; y: number; vy: number }[] = [];
    const spheres: Sphere[] = [];

    // Initial sphere spawn
    const spawnSphere = (x: number, y: number, sizeIndex: number, dir: number = 1) => {
      const radius = sizeIndex * 14 + 10;
      spheres.push({
        x,
        y,
        vx: dir * (Math.random() * 1.5 + 1.5),
        vy: -2,
        radius,
        sizeIndex,
      });
    };

    spawnSphere(100, 80, 3, 1);
    spawnSphere(500, 80, 3, -1);

    const keys: Record<string, boolean> = {};

    const handleKeyDown = (e: KeyboardEvent) => {
      keys[e.key] = true;
      if (e.key === ' ' || e.key === 'ArrowUp' || e.key === 'w') {
        lasers.push({ x: player.x, y: player.y, vy: -10 });
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      keys[e.key] = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    const update = () => {
      if (keys['ArrowLeft'] || keys['a']) player.x = Math.max(player.width / 2, player.x - player.speed);
      if (keys['ArrowRight'] || keys['d']) player.x = Math.min(canvas.width - player.width / 2, player.x + player.speed);

      // Respawn spheres if all destroyed
      if (spheres.length === 0) {
        spawnSphere(100, 80, 3, 1);
        spawnSphere(500, 80, 3, -1);
      }

      // Lasers update
      for (let i = lasers.length - 1; i >= 0; i--) {
        lasers[i].y += lasers[i].vy;
        if (lasers[i].y < 0) lasers.splice(i, 1);
      }

      // Spheres update
      for (let i = spheres.length - 1; i >= 0; i--) {
        const s = spheres[i];
        s.x += s.vx;
        s.y += s.vy;
        s.vy += 0.2; // Gravity

        // Wall collisions
        if (s.x - s.radius <= 0 || s.x + s.radius >= canvas.width) {
          s.vx *= -1;
        }

        // Floor bounce
        if (s.y + s.radius >= canvas.height - 10) {
          s.y = canvas.height - 10 - s.radius;
          s.vy = -Math.sqrt(s.sizeIndex * 25 + 50); // bounce height based on size
        }

        // Check laser collision
        for (let j = lasers.length - 1; j >= 0; j--) {
          const l = lasers[j];
          const dist = Math.hypot(s.x - l.x, s.y - l.y);
          if (dist < s.radius) {
            lasers.splice(j, 1);

            currentScore += (4 - s.sizeIndex) * 50;
            setScore(currentScore);

            // Split sphere into 2 smaller ones if sizeIndex > 1
            if (s.sizeIndex > 1) {
              spawnSphere(s.x, s.y, s.sizeIndex - 1, 1);
              spawnSphere(s.x, s.y, s.sizeIndex - 1, -1);
            }
            spheres.splice(i, 1);
            break;
          }
        }

        // Player collision
        if (Math.abs(s.x - player.x) < s.radius + player.width / 2 && Math.abs(s.y - player.y) < s.radius + player.height / 2) {
          setGameState('gameover');
          window.dispatchEvent(new CustomEvent('xakteir-game-score', { detail: { score: currentScore } }));
          return;
        }
      }
    };

    const draw = () => {
      ctx.fillStyle = '#09090b';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Floor
      ctx.fillStyle = '#27272a';
      ctx.fillRect(0, canvas.height - 10, canvas.width, 10);

      // Player
      ctx.fillStyle = '#10b981';
      ctx.beginPath();
      ctx.arc(player.x, player.y, player.width / 2, 0, Math.PI * 2);
      ctx.fill();

      // Laser beams
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 4;
      lasers.forEach((l) => {
        ctx.beginPath();
        ctx.moveTo(l.x, l.y);
        ctx.lineTo(l.x, l.y + 15);
        ctx.stroke();
      });

      // Bouncing Spheres
      spheres.forEach((s) => {
        ctx.fillStyle = s.sizeIndex === 3 ? '#ef4444' : s.sizeIndex === 2 ? '#f59e0b' : '#a855f7';
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.stroke();
      });
    };

    const loop = () => {
      update();
      draw();
      animId = requestAnimationFrame(loop);
    };

    loop();

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      cancelAnimationFrame(animId);
    };
  }, [gameState]);

  const startGame = () => {
    setScore(0);
    setGameState('playing');
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[500px] bg-zinc-950 text-white p-4 rounded-xl shadow-2xl border border-zinc-800">
      <h1 className="text-3xl font-extrabold mb-2 text-emerald-400 tracking-wider">SUPER BLASTER 2</h1>
      <p className="text-xs text-zinc-400 mb-4">Use Arrow Keys or A/D to move, Space to Blast bouncing spheres!</p>
      <div className="relative border-2 border-emerald-500/40 rounded-lg overflow-hidden">
        <canvas ref={canvasRef} width={600} height={400} className="block bg-zinc-950" />

        {gameState === 'start' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-zinc-950/90">
            <p className="text-xl font-bold text-emerald-400 mb-4">Blast & Split Bouncing Energy Spheres!</p>
            <button
              onClick={startGame}
              className="px-6 py-3 bg-emerald-500 hover:bg-emerald-600 font-bold rounded-lg transition transform hover:scale-105"
            >
              Start Game
            </button>
          </div>
        )}

        {gameState === 'gameover' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-zinc-950/90">
            <h2 className="text-3xl font-bold text-red-500 mb-2">BLASTED!</h2>
            <p className="text-lg text-zinc-300 mb-4">Final Score: {score}</p>
            <button
              onClick={startGame}
              className="px-6 py-3 bg-emerald-500 hover:bg-emerald-600 font-bold rounded-lg transition transform hover:scale-105"
            >
              Play Again
            </button>
          </div>
        )}
      </div>
      <div className="mt-4 font-mono text-lg text-emerald-400">Score: {score}</div>
    </div>
  );
}
