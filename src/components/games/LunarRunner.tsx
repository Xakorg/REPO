'use client';

import React, { useEffect, useRef, useState } from 'react';

interface Obstacle {
  x: number;
  width: number;
  height: number;
}

interface Star {
  x: number;
  y: number;
  collected: boolean;
}

export default function LunarRunner() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);

  const stateRef = useRef({
    playerY: 300,
    playerVy: 0,
    isGrounded: true,
    doubleJumpAvailable: true,
    score: 0,
    obstacles: [] as Obstacle[],
    stars: [] as Star[],
    speed: 5,
    spawnTimer: 0,
    started: false,
    gameOver: false,
  });

  const initGame = () => {
    stateRef.current = {
      playerY: 300,
      playerVy: 0,
      isGrounded: true,
      doubleJumpAvailable: true,
      score: 0,
      obstacles: [],
      stars: [],
      speed: 5,
      spawnTimer: 0,
      started: true,
      gameOver: false,
    };
    setScore(0);
    setGameOver(false);
    setGameStarted(true);
  };

  const jump = () => {
    const s = stateRef.current;
    if (!s.started || s.gameOver) return;

    if (s.isGrounded) {
      s.playerVy = -9;
      s.isGrounded = false;
      s.doubleJumpAvailable = true;
    } else if (s.doubleJumpAvailable) {
      s.playerVy = -8;
      s.doubleJumpAvailable = false;
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === ' ' || e.key === 'ArrowUp' || e.key === 'w') {
        jump();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;

    const loop = () => {
      const s = stateRef.current;

      // Dark Moon Sky
      ctx.fillStyle = '#030712';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Distant stars background
      ctx.fillStyle = '#ffffff';
      for (let i = 0; i < 20; i++) {
        const sx = (i * 37 + (s.started ? s.score * 0.2 : 0)) % canvas.width;
        const sy = (i * 19) % 200;
        ctx.fillRect(canvas.width - sx, sy, 2, 2);
      }

      // Moon ground level
      const groundY = 320;
      ctx.fillStyle = '#475569';
      ctx.fillRect(0, groundY, canvas.width, canvas.height - groundY);

      if (s.started && !s.gameOver) {
        // Low Gravity physics
        s.playerVy += 0.38;
        s.playerY += s.playerVy;

        if (s.playerY >= groundY - 24) {
          s.playerY = groundY - 24;
          s.playerVy = 0;
          s.isGrounded = true;
        }

        s.score += 1;
        s.speed += 0.0005;
        setScore(s.score);

        // Spawn obstacles & stardust
        s.spawnTimer += 1;
        if (s.spawnTimer >= 60) {
          s.spawnTimer = 0;
          if (Math.random() > 0.3) {
            s.obstacles.push({
              x: canvas.width + 20,
              width: 25 + Math.random() * 15,
              height: 30 + Math.random() * 25,
            });
          }
          if (Math.random() > 0.4) {
            s.stars.push({
              x: canvas.width + 40,
              y: groundY - 60 - Math.random() * 80,
              collected: false,
            });
          }
        }

        // Move items
        s.obstacles.forEach((obs) => (obs.x -= s.speed));
        s.stars.forEach((star) => (star.x -= s.speed));

        // Collision with obstacles
        const px = 60;
        const py = s.playerY;

        for (let i = 0; i < s.obstacles.length; i++) {
          const obs = s.obstacles[i];
          if (
            px + 15 > obs.x &&
            px - 15 < obs.x + obs.width &&
            py + 24 > groundY - obs.height
          ) {
            s.gameOver = true;
            setGameOver(true);
            window.dispatchEvent(
              new CustomEvent('xakteir-game-score', { detail: { score: s.score } })
            );
            break;
          }
        }

        // Collect stars
        s.stars.forEach((star) => {
          if (!star.collected && Math.hypot(star.x - px, star.y - py) < 30) {
            star.collected = true;
            s.score += 150;
            setScore(s.score);
          }
        });

        // Cleanup offscreen
        s.obstacles = s.obstacles.filter((o) => o.x > -50);
        s.stars = s.stars.filter((st) => st.x > -30);
      }

      // Draw Obstacles (Lunar Rocks)
      s.obstacles.forEach((obs) => {
        ctx.fillStyle = '#94a3b8';
        ctx.beginPath();
        ctx.roundRect(obs.x, groundY - obs.height, obs.width, obs.height, 4);
        ctx.fill();
      });

      // Draw Stars
      s.stars.forEach((star) => {
        if (!star.collected) {
          ctx.shadowBlur = 10;
          ctx.shadowColor = '#fde047';
          ctx.fillStyle = '#fde047';
          ctx.beginPath();
          ctx.arc(star.x, star.y, 8, 0, Math.PI * 2);
          ctx.fill();
          ctx.shadowBlur = 0;
        }
      });

      // Draw Astronaut Player
      const px = 60;
      const py = s.playerY;

      ctx.shadowBlur = 12;
      ctx.shadowColor = '#38bdf8';
      // Suit
      ctx.fillStyle = '#f8fafc';
      ctx.fillRect(px - 10, py - 20, 20, 26);
      // Visor
      ctx.fillStyle = '#38bdf8';
      ctx.fillRect(px - 2, py - 16, 10, 8);
      // Jetpack glow
      ctx.fillStyle = '#f97316';
      ctx.fillRect(px - 14, py - 12, 4, 12);
      ctx.shadowBlur = 0;

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-[450px] bg-zinc-950 text-white p-4 rounded-xl border border-zinc-800">
      <div className="w-full max-w-[400px] flex justify-between items-center mb-3">
        <h2 className="text-xl font-bold text-slate-200">LUNAR RUNNER</h2>
        <div className="text-sm font-semibold bg-zinc-900 px-3 py-1 rounded-full border border-zinc-800 text-yellow-400">
          Score: {score}
        </div>
      </div>

      <div
        onClick={jump}
        className="relative border-2 border-slate-700 rounded-lg overflow-hidden shadow-lg cursor-pointer"
      >
        <canvas ref={canvasRef} width={400} height={400} className="bg-zinc-950" />

        {(!gameStarted || gameOver) && (
          <div className="absolute inset-0 bg-black/85 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center z-10 cursor-default">
            <h3 className="text-2xl font-bold mb-2 text-slate-200">
              {gameOver ? 'MISSION FAILED!' : 'LUNAR RUNNER'}
            </h3>
            {gameOver && <p className="text-zinc-300 mb-4">Lunar Distance Score: {score}</p>}
            <button
              onClick={initGame}
              className="px-6 py-2 bg-slate-600 hover:bg-slate-500 text-white font-bold rounded-lg transition transform hover:scale-105"
            >
              {gameOver ? 'Try Again' : 'Start Run'}
            </button>
          </div>
        )}
      </div>

      <p className="text-xs text-zinc-500 mt-3">Click or Press Space for low-gravity double jumps to clear lunar rocks and collect stardust!</p>
    </div>
  );
}
