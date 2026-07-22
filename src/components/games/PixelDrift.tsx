'use client';

import React, { useEffect, useRef, useState } from 'react';

export default function PixelDrift() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [gameState, setGameState] = useState<'START' | 'PLAYING' | 'GAMEOVER'>('START');
  const [score, setScore] = useState(0);

  const gameRef = useRef({
    gameState: 'START',
    score: 0,
    carX: 200,
    carY: 340,
    carVx: 0,
    obstacles: [] as Array<{ x: number; y: number; width: number; height: number; type: 'car' | 'oil' | 'coin' }>,
    speed: 5,
    frameCount: 0,
    keys: { left: false, right: false },
  });

  const startGame = () => {
    gameRef.current = {
      gameState: 'PLAYING',
      score: 0,
      carX: 200,
      carY: 340,
      carVx: 0,
      obstacles: [],
      speed: 5,
      frameCount: 0,
      keys: { left: false, right: false },
    };
    setScore(0);
    setGameState('PLAYING');
  };

  const gameOver = () => {
    const finalScore = Math.floor(gameRef.current.score);
    setGameState('GAMEOVER');
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('xakteir-game-score', { detail: { score: finalScore } }));
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' || e.key === 'a') gameRef.current.keys.left = true;
      if (e.key === 'ArrowRight' || e.key === 'd') gameRef.current.keys.right = true;
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' || e.key === 'a') gameRef.current.keys.left = false;
      if (e.key === 'ArrowRight' || e.key === 'd') gameRef.current.keys.right = false;
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
      const g = gameRef.current;
      if (g.gameState === 'PLAYING') {
        g.frameCount++;
        g.score += 0.2;
        setScore(Math.floor(g.score));
        g.speed = 5 + Math.floor(g.score / 100) * 0.5;

        // Controls
        if (g.keys.left) g.carVx -= 0.6;
        if (g.keys.right) g.carVx += 0.6;
        g.carVx *= 0.88; // friction
        g.carX += g.carVx;

        // Road boundaries
        const roadLeft = 80;
        const roadRight = 320;
        if (g.carX < roadLeft || g.carX > roadRight - 30) {
          gameOver();
        }

        // Spawn obstacles & items
        if (g.frameCount % 45 === 0) {
          const rand = Math.random();
          const type = rand > 0.4 ? 'car' : rand > 0.2 ? 'oil' : 'coin';
          const spawnX = roadLeft + Math.random() * (roadRight - roadLeft - 30);
          g.obstacles.push({
            x: spawnX,
            y: -50,
            width: type === 'coin' ? 20 : 30,
            height: type === 'coin' ? 20 : 50,
            type,
          });
        }

        // Update obstacles
        for (let i = g.obstacles.length - 1; i >= 0; i--) {
          const obs = g.obstacles[i];
          obs.y += g.speed;

          // Collision check
          if (
            g.carX < obs.x + obs.width &&
            g.carX + 30 > obs.x &&
            g.carY < obs.y + obs.height &&
            g.carY + 50 > obs.y
          ) {
            if (obs.type === 'coin') {
              g.score += 50;
              g.obstacles.splice(i, 1);
            } else if (obs.type === 'oil') {
              g.carVx += (Math.random() - 0.5) * 15; // spin out
              g.obstacles.splice(i, 1);
            } else {
              gameOver();
            }
          } else if (obs.y > canvas.height + 50) {
            g.obstacles.splice(i, 1);
          }
        }
      }

      // DRAWING
      ctx.fillStyle = '#18181b';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Road grass borders
      ctx.fillStyle = '#065f46';
      ctx.fillRect(0, 0, 80, canvas.height);
      ctx.fillRect(320, 0, 80, canvas.height);

      // Road markings
      ctx.strokeStyle = '#e4e4e7';
      ctx.lineWidth = 4;
      ctx.setLineDash([20, 20]);
      ctx.lineDashOffset = -g.frameCount * g.speed;
      ctx.beginPath();
      ctx.moveTo(200, 0);
      ctx.lineTo(200, canvas.height);
      ctx.stroke();
      ctx.setLineDash([]);

      // Draw obstacles & coins
      g.obstacles.forEach((obs) => {
        if (obs.type === 'car') {
          ctx.fillStyle = '#ef4444';
          ctx.fillRect(obs.x, obs.y, obs.width, obs.height);
          ctx.fillStyle = '#fca5a5';
          ctx.fillRect(obs.x + 4, obs.y + 10, obs.width - 8, 12);
        } else if (obs.type === 'oil') {
          ctx.fillStyle = '#3f3f46';
          ctx.beginPath();
          ctx.ellipse(obs.x + 15, obs.y + 15, 15, 10, 0, 0, Math.PI * 2);
          ctx.fill();
        } else {
          ctx.fillStyle = '#eab308';
          ctx.beginPath();
          ctx.arc(obs.x + 10, obs.y + 10, 10, 0, Math.PI * 2);
          ctx.fill();
        }
      });

      // Player Car
      ctx.fillStyle = '#3b82f6';
      ctx.fillRect(g.carX, g.carY, 30, 50);
      ctx.fillStyle = '#93c5fd';
      ctx.fillRect(g.carX + 4, g.carY + 10, 22, 12); // windshield

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-[500px] bg-zinc-950 text-white p-4 rounded-xl border border-zinc-800">
      <div className="mb-4 text-center">
        <h2 className="text-3xl font-extrabold tracking-wider text-emerald-400 drop-shadow-[0_0_10px_rgba(16,185,129,0.5)]">
          PIXEL DRIFT
        </h2>
        <div className="flex gap-6 mt-2 text-sm font-semibold text-zinc-400">
          <span>SCORE: <strong className="text-yellow-400">{score}</strong></span>
        </div>
      </div>

      <div className="relative">
        <canvas
          ref={canvasRef}
          width={400}
          height={400}
          className="bg-zinc-900 border-2 border-emerald-500/30 rounded-lg shadow-inner"
        />

        {gameState !== 'PLAYING' && (
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center rounded-lg">
            <h3 className="text-2xl font-bold text-emerald-400 mb-2">
              {gameState === 'START' ? 'TURBO DRIFTER' : 'CRASHED!'}
            </h3>
            <p className="text-zinc-400 text-xs mb-6 text-center max-w-xs">
              {gameState === 'START'
                ? 'Stay on the road! Avoid red cars & oil slicks, collect gold coins!'
                : `Final Score: ${score}`}
            </p>
            <button
              onClick={startGame}
              className="px-6 py-2 bg-emerald-500 hover:bg-emerald-400 text-black font-bold rounded-full transition-all shadow-[0_0_15px_rgba(16,185,129,0.4)]"
            >
              {gameState === 'START' ? 'START DRIFTING' : 'RESTART'}
            </button>
          </div>
        )}
      </div>

      <div className="mt-4 flex gap-4 text-xs text-zinc-400">
        <span>[A / LEFT] Steer Left</span>
        <span>[D / RIGHT] Steer Right</span>
      </div>

      <div className="mt-2 flex gap-4">
        <button
          onMouseDown={() => (gameRef.current.keys.left = true)}
          onMouseUp={() => (gameRef.current.keys.left = false)}
          onTouchStart={() => (gameRef.current.keys.left = true)}
          onTouchEnd={() => (gameRef.current.keys.left = false)}
          className="px-6 py-2 bg-zinc-800 hover:bg-zinc-700 text-emerald-400 rounded-lg font-bold border border-emerald-500/20 active:scale-95"
        >
          ◀ LEFT
        </button>
        <button
          onMouseDown={() => (gameRef.current.keys.right = true)}
          onMouseUp={() => (gameRef.current.keys.right = false)}
          onTouchStart={() => (gameRef.current.keys.right = true)}
          onTouchEnd={() => (gameRef.current.keys.right = false)}
          className="px-6 py-2 bg-zinc-800 hover:bg-zinc-700 text-emerald-400 rounded-lg font-bold border border-emerald-500/20 active:scale-95"
        >
          RIGHT ▶
        </button>
      </div>
    </div>
  );
}
