'use client';

import React, { useEffect, useRef, useState } from 'react';

export default function SolarShooter2() {
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

    const player = { x: canvas.width / 2, y: canvas.height - 40, radius: 18, speed: 6 };
    const bullets: { x: number; y: number; vy: number }[] = [];
    const enemies: { x: number; y: number; radius: number; vx: number; vy: number; hp: number; color: string }[] = [];
    const particles: { x: number; y: number; vx: number; vy: number; life: number; color: string }[] = [];

    const keys: Record<string, boolean> = {};

    const handleKeyDown = (e: KeyboardEvent) => {
      keys[e.key] = true;
      if (e.key === ' ' || e.key === 'ArrowUp' || e.key === 'w') {
        bullets.push({ x: player.x, y: player.y - player.radius, vy: -9 });
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      keys[e.key] = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    let spawnTimer = 0;

    const update = () => {
      if (keys['ArrowLeft'] || keys['a']) player.x = Math.max(player.radius, player.x - player.speed);
      if (keys['ArrowRight'] || keys['d']) player.x = Math.min(canvas.width - player.radius, player.x + player.speed);

      spawnTimer++;
      if (spawnTimer % 40 === 0) {
        const radius = Math.random() * 15 + 12;
        enemies.push({
          x: Math.random() * (canvas.width - radius * 2) + radius,
          y: -radius,
          radius,
          vx: (Math.random() - 0.5) * 2,
          vy: Math.random() * 2 + 1.5,
          hp: radius > 20 ? 2 : 1,
          color: radius > 20 ? '#ef4444' : '#f97316',
        });
      }

      // Update bullets
      for (let i = bullets.length - 1; i >= 0; i--) {
        bullets[i].y += bullets[i].vy;
        if (bullets[i].y < -10) bullets.splice(i, 1);
      }

      // Update enemies
      for (let i = enemies.length - 1; i >= 0; i--) {
        const e = enemies[i];
        e.x += e.vx;
        e.y += e.vy;

        // Wall bounces
        if (e.x - e.radius < 0 || e.x + e.radius > canvas.width) e.vx *= -1;

        // Player collision
        const dist = Math.hypot(e.x - player.x, e.y - player.y);
        if (dist < e.radius + player.radius) {
          setGameState('gameover');
          window.dispatchEvent(new CustomEvent('xakteir-game-score', { detail: { score: currentScore } }));
          return;
        }

        // Bullet collisions
        for (let j = bullets.length - 1; j >= 0; j--) {
          const b = bullets[j];
          const bDist = Math.hypot(e.x - b.x, e.y - b.y);
          if (bDist < e.radius + 4) {
            bullets.splice(j, 1);
            e.hp -= 1;
            if (e.hp <= 0) {
              // Create particles
              for (let p = 0; p < 12; p++) {
                particles.push({
                  x: e.x,
                  y: e.y,
                  vx: (Math.random() - 0.5) * 6,
                  vy: (Math.random() - 0.5) * 6,
                  life: 20,
                  color: e.color,
                });
              }
              enemies.splice(i, 1);
              currentScore += 100;
              setScore(currentScore);
              break;
            }
          }
        }

        if (e.y > canvas.height + e.radius) enemies.splice(i, 1);
      }

      // Update particles
      for (let p = particles.length - 1; p >= 0; p--) {
        const pt = particles[p];
        pt.x += pt.vx;
        pt.y += pt.vy;
        pt.life--;
        if (pt.life <= 0) particles.splice(p, 1);
      }
    };

    const draw = () => {
      ctx.fillStyle = '#09090b';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Starfield background
      ctx.fillStyle = '#ffffff33';
      for (let i = 0; i < 30; i++) {
        ctx.fillRect((i * 47) % canvas.width, (i * 91 + Date.now() * 0.05) % canvas.height, 2, 2);
      }

      // Draw player
      ctx.fillStyle = '#38bdf8';
      ctx.beginPath();
      ctx.moveTo(player.x, player.y - player.radius);
      ctx.lineTo(player.x - player.radius, player.y + player.radius);
      ctx.lineTo(player.x + player.radius, player.y + player.radius);
      ctx.closePath();
      ctx.fill();

      // Core thruster glow
      ctx.fillStyle = '#f59e0b';
      ctx.beginPath();
      ctx.arc(player.x, player.y + player.radius, 6, 0, Math.PI * 2);
      ctx.fill();

      // Bullets
      ctx.fillStyle = '#facc15';
      bullets.forEach((b) => {
        ctx.beginPath();
        ctx.arc(b.x, b.y, 4, 0, Math.PI * 2);
        ctx.fill();
      });

      // Enemies
      enemies.forEach((e) => {
        ctx.fillStyle = e.color;
        ctx.beginPath();
        ctx.arc(e.x, e.y, e.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#fde047';
        ctx.lineWidth = 2;
        ctx.stroke();
      });

      // Particles
      particles.forEach((p) => {
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
        ctx.fill();
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
      <h1 className="text-3xl font-extrabold mb-2 text-amber-500 tracking-wider">SOLAR SHOOTER 2</h1>
      <p className="text-xs text-zinc-400 mb-4">Use Left/Right or A/D to move, Space to Shoot solar lasers</p>
      <div className="relative border-2 border-amber-500/40 rounded-lg overflow-hidden">
        <canvas ref={canvasRef} width={600} height={400} className="block bg-zinc-950" />

        {gameState === 'start' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-zinc-950/90">
            <p className="text-xl font-bold text-amber-400 mb-4">Defend the Solar System!</p>
            <button
              onClick={startGame}
              className="px-6 py-3 bg-amber-500 hover:bg-amber-600 font-bold rounded-lg transition transform hover:scale-105"
            >
              Start Game
            </button>
          </div>
        )}

        {gameState === 'gameover' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-zinc-950/90">
            <h2 className="text-3xl font-bold text-red-500 mb-2">GAME OVER</h2>
            <p className="text-lg text-zinc-300 mb-4">Final Score: {score}</p>
            <button
              onClick={startGame}
              className="px-6 py-3 bg-amber-500 hover:bg-amber-600 font-bold rounded-lg transition transform hover:scale-105"
            >
              Play Again
            </button>
          </div>
        )}
      </div>
      <div className="mt-4 font-mono text-lg text-amber-400">Score: {score}</div>
    </div>
  );
}
