'use client';

import React, { useEffect, useRef, useState } from 'react';

interface Obstacle {
  x: number;
  y: number;
  w: number;
  h: number;
  type: 'ground' | 'air';
  passed: boolean;
}

interface Core {
  x: number;
  y: number;
  collected: boolean;
}

export default function CyberDash2() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);

  const stateRef = useRef({
    playerY: 260,
    vy: 0,
    isGrounded: true,
    isSliding: false,
    slideTimer: 0,
    obstacles: [] as Obstacle[],
    cores: [] as Core[],
    speed: 5,
    distance: 0,
    score: 0,
    started: false,
    gameOver: false,
    frame: 0,
  });

  const initGame = () => {
    stateRef.current = {
      playerY: 260,
      vy: 0,
      isGrounded: true,
      isSliding: false,
      slideTimer: 0,
      obstacles: [],
      cores: [],
      speed: 5,
      distance: 0,
      score: 0,
      started: true,
      gameOver: false,
      frame: 0,
    };
    setScore(0);
    setGameOver(false);
    setGameStarted(true);
  };

  const jump = () => {
    const s = stateRef.current;
    if (!s.started || s.gameOver) return;
    if (s.isGrounded) {
      s.vy = -12;
      s.isGrounded = false;
      s.isSliding = false;
    }
  };

  const slide = () => {
    const s = stateRef.current;
    if (!s.started || s.gameOver) return;
    if (s.isGrounded) {
      s.isSliding = true;
      s.slideTimer = 25;
    }
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.code === 'ArrowUp') {
        e.preventDefault();
        jump();
      } else if (e.code === 'ArrowDown') {
        e.preventDefault();
        slide();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    let animId: number;

    const loop = () => {
      const s = stateRef.current;
      s.frame++;

      ctx.fillStyle = '#09090b';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw cyber grid floor
      ctx.strokeStyle = '#3b82f633';
      ctx.beginPath();
      ctx.moveTo(0, 300);
      ctx.lineTo(canvas.width, 300);
      ctx.stroke();

      for (let x = -(s.distance % 20); x < canvas.width; x += 20) {
        ctx.strokeStyle = '#1d4ed833';
        ctx.beginPath();
        ctx.moveTo(x, 300);
        ctx.lineTo(x - 20, 360);
        ctx.stroke();
      }

      if (s.started && !s.gameOver) {
        s.distance += 1;
        s.speed = 5 + Math.floor(s.distance / 500) * 0.5;

        // Player physics
        s.vy += 0.65;
        s.playerY += s.vy;
        if (s.playerY >= 260) {
          s.playerY = 260;
          s.vy = 0;
          s.isGrounded = true;
        }

        if (s.isSliding) {
          s.slideTimer--;
          if (s.slideTimer <= 0) s.isSliding = false;
        }

        // Spawn obstacles
        if (s.frame % Math.max(45, 90 - Math.floor(s.distance / 100)) === 0) {
          const type = Math.random() > 0.4 ? 'ground' : 'air';
          s.obstacles.push({
            x: canvas.width + 20,
            y: type === 'ground' ? 260 : 210,
            w: 24,
            h: type === 'ground' ? 40 : 25,
            type,
            passed: false,
          });

          if (Math.random() > 0.5) {
            s.cores.push({
              x: canvas.width + 60,
              y: type === 'ground' ? 210 : 270,
              collected: false,
            });
          }
        }

        // Player bounding box
        const playerH = s.isSliding ? 20 : 40;
        const playerYActual = s.isSliding ? s.playerY + 20 : s.playerY;
        const playerW = s.isSliding ? 40 : 24;
        const playerX = 60;

        // Draw Player
        ctx.fillStyle = '#06b6d4';
        ctx.shadowBlur = 12;
        ctx.shadowColor = '#06b6d4';
        ctx.fillRect(playerX, playerYActual, playerW, playerH);
        ctx.shadowBlur = 0;

        // Update & draw obstacles
        for (let i = s.obstacles.length - 1; i >= 0; i--) {
          const obs = s.obstacles[i];
          obs.x -= s.speed;

          // Draw obstacle
          ctx.fillStyle = obs.type === 'ground' ? '#ef4444' : '#a855f7';
          ctx.shadowBlur = 10;
          ctx.shadowColor = ctx.fillStyle;
          ctx.fillRect(obs.x, obs.y, obs.w, obs.h);
          ctx.shadowBlur = 0;

          // Collision detection
          if (
            playerX < obs.x + obs.w &&
            playerX + playerW > obs.x &&
            playerYActual < obs.y + obs.h &&
            playerYActual + playerH > obs.y
          ) {
            s.gameOver = true;
            setGameOver(true);
            const finalScore = s.score + Math.floor(s.distance / 10);
            setScore(finalScore);
            window.dispatchEvent(new CustomEvent('xakteir-game-score', { detail: { score: finalScore } }));
          }

          if (obs.x < -30) s.obstacles.splice(i, 1);
        }

        // Update & draw cores
        for (let i = s.cores.length - 1; i >= 0; i--) {
          const c = s.cores[i];
          c.x -= s.speed;

          if (!c.collected) {
            ctx.fillStyle = '#eab308';
            ctx.shadowBlur = 10;
            ctx.shadowColor = '#eab308';
            ctx.beginPath();
            ctx.arc(c.x, c.y, 8, 0, Math.PI * 2);
            ctx.fill();
            ctx.shadowBlur = 0;

            if (Math.hypot(playerX + 12 - c.x, playerYActual + 20 - c.y) < 24) {
              c.collected = true;
              s.score += 50;
              setScore(s.score + Math.floor(s.distance / 10));
            }
          }
          if (c.x < -20) s.cores.splice(i, 1);
        }

        setScore(s.score + Math.floor(s.distance / 10));
      } else {
        // Static player when not active
        ctx.fillStyle = '#06b6d4';
        ctx.fillRect(60, 260, 24, 40);
      }

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
      <div className="w-full max-w-[440px] flex justify-between items-center mb-2">
        <h2 className="text-xl font-bold text-cyan-400">CYBER DASH 2</h2>
        <span className="bg-zinc-900 px-3 py-1 rounded-full border border-zinc-800 text-cyan-400 font-semibold text-xs">
          Score: {score}
        </span>
      </div>

      <div
        onClick={jump}
        className="relative border-2 border-cyan-500/40 rounded-lg overflow-hidden shadow-lg shadow-cyan-500/10 cursor-pointer"
      >
        <canvas ref={canvasRef} width={440} height={360} className="bg-zinc-950" />

        {(!gameStarted || gameOver) && (
          <div className="absolute inset-0 bg-black/85 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center z-10">
            <h3 className="text-2xl font-bold mb-2 text-cyan-400">{gameOver ? 'SYSTEM CRASH' : 'CYBER DASH 2'}</h3>
            {gameOver && <p className="text-zinc-300 mb-4">Final Score: {score}</p>}
            <div className="flex gap-2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  initGame();
                }}
                className="px-6 py-2 bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-bold rounded-lg hover:opacity-90 transition transform hover:scale-105"
              >
                {gameOver ? 'Try Again' : 'Start Dash'}
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="flex gap-4 mt-3">
        <button
          onClick={jump}
          className="px-4 py-1.5 bg-zinc-900 border border-cyan-500/40 rounded text-xs text-cyan-400 hover:bg-zinc-800 font-semibold"
        >
          Jump (Up / Space)
        </button>
        <button
          onClick={slide}
          className="px-4 py-1.5 bg-zinc-900 border border-purple-500/40 rounded text-xs text-purple-400 hover:bg-zinc-800 font-semibold"
        >
          Slide (Down)
        </button>
      </div>
    </div>
  );
}
