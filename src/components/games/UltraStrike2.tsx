'use client';

import React, { useEffect, useRef, useState } from 'react';

export default function UltraStrike2() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [gameState, setGameState] = useState<'START' | 'PLAYING' | 'GAMEOVER'>('START');
  const [score, setScore] = useState(0);

  const stateRef = useRef({
    gameState: 'START',
    score: 0,
    playerX: 200,
    bullets: [] as { x: number; y: number }[],
    enemies: [] as { x: number; y: number; vx: number; vy: number; r: number }[],
    frameCount: 0,
  });

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (stateRef.current.gameState !== 'PLAYING') return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    stateRef.current.playerX = Math.max(15, Math.min(canvas.width - 15, e.clientX - rect.left));
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (stateRef.current.gameState !== 'PLAYING') return;
    const canvas = canvasRef.current;
    if (!canvas || !e.touches[0]) return;
    const rect = canvas.getBoundingClientRect();
    stateRef.current.playerX = Math.max(15, Math.min(canvas.width - 15, e.touches[0].clientX - rect.left));
  };

  const initGame = () => {
    stateRef.current = {
      gameState: 'PLAYING',
      score: 0,
      playerX: 200,
      bullets: [],
      enemies: [],
      frameCount: 0,
    };
    setScore(0);
    setGameState('PLAYING');
  };

  useEffect(() => {
    let animId: number;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const loop = () => {
      const state = stateRef.current;

      if (state.gameState === 'PLAYING') {
        state.frameCount++;

        // Auto Fire bullets
        if (state.frameCount % 8 === 0) {
          state.bullets.push({ x: state.playerX - 6, y: canvas.height - 35 });
          state.bullets.push({ x: state.playerX + 6, y: canvas.height - 35 });
        }

        // Spawn Enemies
        if (state.frameCount % 25 === 0) {
          state.enemies.push({
            x: Math.random() * (canvas.width - 30) + 15,
            y: -15,
            vx: (Math.random() - 0.5) * 2,
            vy: 2 + Math.random() * 2.5,
            r: 12 + Math.random() * 8,
          });
        }

        // Move Bullets
        state.bullets.forEach((b) => {
          b.y -= 8;
        });

        // Move Enemies & Collisions
        state.enemies.forEach((e) => {
          e.x += e.vx;
          e.y += e.vy;

          // Bounce walls
          if (e.x < e.r || e.x > canvas.width - e.r) e.vx *= -1;

          // Bullet hits Enemy
          state.bullets.forEach((b) => {
            if (Math.hypot(b.x - e.x, b.y - e.y) < e.r + 4) {
              e.y = canvas.height + 100; // destroy enemy
              b.y = -100; // destroy bullet
              state.score += 20;
              setScore(state.score);
            }
          });

          // Enemy hits Player
          const py = canvas.height - 25;
          if (Math.hypot(state.playerX - e.x, py - e.y) < e.r + 12) {
            state.gameState = 'GAMEOVER';
            setGameState('GAMEOVER');
            window.dispatchEvent(
              new CustomEvent('xakteir-game-score', { detail: { score: state.score } })
            );
          }

          // Enemy reached bottom
          if (e.y > canvas.height + 20) {
            e.y = canvas.height + 200;
          }
        });

        // Filter offscreen
        state.bullets = state.bullets.filter((b) => b.y > 0);
        state.enemies = state.enemies.filter((e) => e.y <= canvas.height + 50);
      }

      // Render
      ctx.fillStyle = '#09090b';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      if (state.gameState === 'PLAYING') {
        // Draw Bullets
        ctx.fillStyle = '#ef4444';
        ctx.shadowColor = '#f87171';
        ctx.shadowBlur = 8;
        state.bullets.forEach((b) => {
          ctx.fillRect(b.x - 2, b.y, 4, 10);
        });
        ctx.shadowBlur = 0;

        // Draw Enemies
        state.enemies.forEach((e) => {
          ctx.fillStyle = '#a855f7';
          ctx.shadowColor = '#c084fc';
          ctx.shadowBlur = 10;
          ctx.beginPath();
          ctx.arc(e.x, e.y, e.r, 0, Math.PI * 2);
          ctx.fill();
          ctx.shadowBlur = 0;
        });

        // Draw Player Ship
        const px = state.playerX;
        const py = canvas.height - 25;
        ctx.fillStyle = '#f43f5e';
        ctx.shadowColor = '#fb7185';
        ctx.shadowBlur = 15;
        ctx.beginPath();
        ctx.moveTo(px, py - 16);
        ctx.lineTo(px - 14, py + 12);
        ctx.lineTo(px + 14, py + 12);
        ctx.closePath();
        ctx.fill();
        ctx.shadowBlur = 0;
      }

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-[450px] bg-zinc-950 text-white p-4 rounded-xl shadow-2xl border border-zinc-800 w-full max-w-md mx-auto">
      <h2 className="text-2xl font-bold tracking-wider text-rose-500 mb-2">ULTRA STRIKE 2</h2>

      <div className="relative">
        <canvas
          ref={canvasRef}
          width={400}
          height={380}
          onMouseMove={handleMouseMove}
          onTouchMove={handleTouchMove}
          className="bg-zinc-900 border border-rose-500/30 rounded-lg cursor-none touch-none"
        />

        {gameState === 'START' && (
          <div className="absolute inset-0 bg-black/85 flex flex-col items-center justify-center p-6 text-center rounded-lg z-10">
            <h3 className="text-xl font-bold text-rose-400 mb-2 font-mono">Hyper Space Strike</h3>
            <p className="text-zinc-400 text-sm mb-6">Move mouse / finger to control interceptor and blast incoming drones!</p>
            <button
              onClick={initGame}
              className="px-6 py-3 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-lg transition-all shadow-lg"
            >
              Engage Strike
            </button>
          </div>
        )}

        {gameState === 'GAMEOVER' && (
          <div className="absolute inset-0 bg-black/90 flex flex-col items-center justify-center p-6 text-center rounded-lg z-10">
            <h3 className="text-2xl font-bold text-rose-500 mb-2">SHIP DESTROYED</h3>
            <p className="text-zinc-300 text-lg mb-1">Final Action Score:</p>
            <p className="text-3xl font-extrabold text-rose-400 mb-6">{score}</p>
            <button
              onClick={initGame}
              className="px-6 py-3 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-lg transition-all shadow-lg"
            >
              Re-Deploy
            </button>
          </div>
        )}
      </div>

      <div className="flex justify-between w-[400px] mt-3 text-sm font-semibold text-zinc-400">
        <span>Score: <span className="text-rose-400">{score}</span></span>
        <span>Controls: Move Mouse / Touch</span>
      </div>
    </div>
  );
}
