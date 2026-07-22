'use client';

import React, { useEffect, useRef, useState } from 'react';

interface Brick {
  x: number;
  y: number;
  w: number;
  h: number;
  color: string;
  active: boolean;
  points: number;
}

export default function SolarBounce() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [gameState, setGameState] = useState<'START' | 'PLAYING' | 'GAMEOVER'>('START');
  const [score, setScore] = useState<number>(0);
  const [lives, setLives] = useState<number>(3);

  const stateRef = useRef({
    gameState: 'START',
    score: 0,
    lives: 3,
    paddleX: 200,
    paddleW: 90,
    ballX: 250,
    ballY: 350,
    ballVX: 3,
    ballVY: -4,
    bricks: [] as Brick[],
  });

  const initGame = () => {
    const bricks: Brick[] = [];
    const colors = ['#f97316', '#eab308', '#ef4444', '#f59e0b', '#ec4899'];
    const rows = 4;
    const cols = 7;
    const w = 54;
    const h = 20;
    const padding = 10;
    const offsetLeft = 25;
    const offsetTop = 40;

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        bricks.push({
          x: offsetLeft + c * (w + padding),
          y: offsetTop + r * (h + padding),
          w,
          h,
          color: colors[r % colors.length],
          active: true,
          points: (rows - r) * 10,
        });
      }
    }

    stateRef.current = {
      gameState: 'PLAYING',
      score: 0,
      lives: 3,
      paddleX: 200,
      paddleW: 90,
      ballX: 250,
      ballY: 350,
      ballVX: (Math.random() > 0.5 ? 1 : -1) * (3 + Math.random()),
      ballVY: -4,
      bricks,
    };

    setScore(0);
    setLives(3);
    setGameState('PLAYING');
  };

  useEffect(() => {
    let animId: number;

    const handleMouseMove = (e: MouseEvent) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      stateRef.current.paddleX = Math.max(0, Math.min(canvas.width - stateRef.current.paddleW, mouseX - stateRef.current.paddleW / 2));
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        stateRef.current.paddleX = Math.max(0, stateRef.current.paddleX - 25);
      } else if (e.key === 'ArrowRight') {
        stateRef.current.paddleX = Math.min(500 - stateRef.current.paddleW, stateRef.current.paddleX + 25);
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('keydown', handleKeyDown);

    const update = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw Sun background glow
      const grad = ctx.createRadialGradient(250, 250, 20, 250, 250, 250);
      grad.addColorStop(0, 'rgba(249, 115, 22, 0.15)');
      grad.addColorStop(1, 'rgba(9, 9, 11, 1)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const st = stateRef.current;

      if (st.gameState === 'PLAYING') {
        // Move Ball
        st.ballX += st.ballVX;
        st.ballY += st.ballVY;

        // Wall collisions
        if (st.ballX <= 8 || st.ballX >= canvas.width - 8) {
          st.ballVX = -st.ballVX;
        }
        if (st.ballY <= 8) {
          st.ballVY = -st.ballVY;
        }

        // Paddle collision
        const paddleY = canvas.height - 25;
        if (
          st.ballY + 8 >= paddleY &&
          st.ballY - 8 <= paddleY + 12 &&
          st.ballX >= st.paddleX &&
          st.ballX <= st.paddleX + st.paddleW &&
          st.ballVY > 0
        ) {
          st.ballVY = -Math.abs(st.ballVY);
          const hitPos = (st.ballX - (st.paddleX + st.paddleW / 2)) / (st.paddleW / 2);
          st.ballVX = hitPos * 5;
        }

        // Bottom hit (lose life)
        if (st.ballY >= canvas.height - 5) {
          st.lives -= 1;
          setLives(st.lives);
          if (st.lives <= 0) {
            st.gameState = 'GAMEOVER';
            setGameState('GAMEOVER');
            window.dispatchEvent(new CustomEvent('xakteir-game-score', { detail: { score: st.score } }));
          } else {
            st.ballX = 250;
            st.ballY = 350;
            st.ballVX = (Math.random() > 0.5 ? 1 : -1) * 3;
            st.ballVY = -4;
          }
        }

        // Brick collisions
        let activeCount = 0;
        st.bricks.forEach((b) => {
          if (!b.active) return;
          activeCount++;
          if (
            st.ballX + 8 >= b.x &&
            st.ballX - 8 <= b.x + b.w &&
            st.ballY + 8 >= b.y &&
            st.ballY - 8 <= b.y + b.h
          ) {
            b.active = false;
            st.ballVY = -st.ballVY;
            st.score += b.points;
            setScore(st.score);
          }
        });

        // Respawn bricks if cleared
        if (activeCount === 0) {
          st.bricks.forEach((b) => (b.active = true));
          st.ballVY = (st.ballVY < 0 ? -1 : 1) * (Math.abs(st.ballVY) + 0.5);
        }

        // Draw Bricks
        st.bricks.forEach((b) => {
          if (!b.active) return;
          ctx.fillStyle = b.color;
          ctx.shadowColor = b.color;
          ctx.shadowBlur = 8;
          ctx.beginPath();
          ctx.roundRect(b.x, b.y, b.w, b.h, 4);
          ctx.fill();
          ctx.shadowBlur = 0;
        });

        // Draw Paddle
        ctx.fillStyle = '#f97316';
        ctx.shadowColor = '#f97316';
        ctx.shadowBlur = 12;
        ctx.beginPath();
        ctx.roundRect(st.paddleX, paddleY, st.paddleW, 12, 6);
        ctx.fill();
        ctx.shadowBlur = 0;

        // Draw Ball (Solar flare)
        ctx.fillStyle = '#fef08a';
        ctx.shadowColor = '#eab308';
        ctx.shadowBlur = 15;
        ctx.beginPath();
        ctx.arc(st.ballX, st.ballY, 8, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      }

      animId = requestAnimationFrame(update);
    };

    animId = requestAnimationFrame(update);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('keydown', handleKeyDown);
      cancelAnimationFrame(animId);
    };
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-[500px] bg-zinc-950 text-white rounded-xl p-4">
      <div className="flex justify-between items-center w-full max-w-[500px] mb-3">
        <div>
          <h2 className="text-xl font-bold text-orange-400">Solar Bounce</h2>
          <p className="text-xs text-zinc-400">Bounce the solar orb to break cosmic energy blocks!</p>
        </div>
        <div className="text-right">
          <div className="text-lg font-semibold text-amber-400">Score: {score}</div>
          <div className="text-sm text-zinc-400">Lives: {'❤️'.repeat(lives)}</div>
        </div>
      </div>

      <div className="relative border border-orange-900/50 rounded-xl overflow-hidden shadow-2xl bg-zinc-950">
        <canvas ref={canvasRef} width={500} height={500} className="block cursor-none" />

        {gameState === 'START' && (
          <div className="absolute inset-0 bg-zinc-950/90 flex flex-col items-center justify-center p-6 text-center z-10">
            <h3 className="text-3xl font-extrabold text-orange-400 mb-2">SOLAR BOUNCE</h3>
            <p className="text-zinc-400 mb-6 max-w-xs text-sm">
              Use your mouse or arrow keys to move the solar shield. Don't let the solar flare escape into deep space!
            </p>
            <button
              onClick={initGame}
              className="px-6 py-3 bg-orange-600 hover:bg-orange-500 text-white font-bold rounded-lg transition shadow-lg shadow-orange-600/30"
            >
              Launch Core
            </button>
          </div>
        )}

        {gameState === 'GAMEOVER' && (
          <div className="absolute inset-0 bg-zinc-950/90 flex flex-col items-center justify-center p-6 text-center z-10">
            <h3 className="text-3xl font-extrabold text-red-500 mb-2">SOLAR FLARE LOST</h3>
            <p className="text-zinc-300 text-lg mb-4">
              Final Score: <span className="text-orange-400 font-bold">{score}</span>
            </p>
            <button
              onClick={initGame}
              className="px-6 py-3 bg-orange-600 hover:bg-orange-500 text-white font-bold rounded-lg transition"
            >
              Play Again
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
