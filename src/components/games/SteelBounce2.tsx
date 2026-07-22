'use client';

import React, { useState, useEffect, useRef } from 'react';

interface Brick {
  x: number;
  y: number;
  w: number;
  h: number;
  hp: number;
  maxHp: number;
  color: string;
}

export default function SteelBounce2() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [gameState, setGameState] = useState<'START' | 'PLAYING' | 'GAMEOVER'>('START');
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);

  const stateRef = useRef({
    gameState: 'START',
    score: 0,
    lives: 3,
    paddleX: 160,
    paddleWidth: 80,
    ballX: 200,
    ballY: 300,
    ballSpeedX: 4,
    ballSpeedY: -4,
    bricks: [] as Brick[],
  });

  const initGame = () => {
    const bricks: Brick[] = [];
    const rows = 4;
    const cols = 6;
    const brickW = 55;
    const brickH = 20;
    const padding = 8;
    const offsetLeft = 18;
    const offsetTop = 40;

    const colors = ['#94a3b8', '#64748b', '#38bdf8', '#fbbf24'];

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const hp = r === 0 ? 2 : 1;
        bricks.push({
          x: offsetLeft + c * (brickW + padding),
          y: offsetTop + r * (brickH + padding),
          w: brickW,
          h: brickH,
          hp: hp,
          maxHp: hp,
          color: colors[r % colors.length],
        });
      }
    }

    stateRef.current = {
      gameState: 'PLAYING',
      score: 0,
      lives: 3,
      paddleX: 160,
      paddleWidth: 80,
      ballX: 200,
      ballY: 340,
      ballSpeedX: (Math.random() > 0.5 ? 1 : -1) * 3.5,
      ballSpeedY: -4.5,
      bricks,
    };

    setScore(0);
    setLives(3);
    setGameState('PLAYING');
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (stateRef.current.gameState !== 'PLAYING' || !canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    stateRef.current.paddleX = Math.max(0, Math.min(400 - stateRef.current.paddleWidth, mouseX - stateRef.current.paddleWidth / 2));
  };

  useEffect(() => {
    let animId: number;

    const loop = () => {
      const state = stateRef.current;
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      if (state.gameState === 'PLAYING') {
        // Move ball
        state.ballX += state.ballSpeedX;
        state.ballY += state.ballSpeedY;

        // Bounce left/right
        if (state.ballX - 8 < 0 || state.ballX + 8 > 400) {
          state.ballSpeedX = -state.ballSpeedX;
        }

        // Bounce top
        if (state.ballY - 8 < 0) {
          state.ballSpeedY = -state.ballSpeedY;
        }

        // Paddle collision
        const paddleY = 460;
        if (
          state.ballY + 8 >= paddleY &&
          state.ballY - 8 <= paddleY + 12 &&
          state.ballX >= state.paddleX &&
          state.ballX <= state.paddleX + state.paddleWidth &&
          state.ballSpeedY > 0
        ) {
          state.ballSpeedY = -Math.abs(state.ballSpeedY);
          const hitPos = (state.ballX - (state.paddleX + state.paddleWidth / 2)) / (state.paddleWidth / 2);
          state.ballSpeedX = hitPos * 5;
        }

        // Brick collision
        for (let i = state.bricks.length - 1; i >= 0; i--) {
          const b = state.bricks[i];
          if (
            state.ballX + 8 > b.x &&
            state.ballX - 8 < b.x + b.w &&
            state.ballY + 8 > b.y &&
            state.ballY - 8 < b.y + b.h
          ) {
            state.ballSpeedY = -state.ballSpeedY;
            b.hp -= 1;
            if (b.hp <= 0) {
              state.bricks.splice(i, 1);
              state.score += 50;
              setScore(state.score);
            }
            break;
          }
        }

        // Respawn bricks if cleared
        if (state.bricks.length === 0) {
          initGame();
        }

        // Bottom hit / death
        if (state.ballY > 500) {
          state.lives -= 1;
          setLives(state.lives);
          if (state.lives <= 0) {
            state.gameState = 'GAMEOVER';
            setGameState('GAMEOVER');
            window.dispatchEvent(new CustomEvent('xakteir-game-score', { detail: { score: state.score } }));
          } else {
            state.ballX = 200;
            state.ballY = 340;
            state.ballSpeedY = -4.5;
            state.ballSpeedX = (Math.random() > 0.5 ? 1 : -1) * 3.5;
          }
        }
      }

      // Draw
      ctx.clearRect(0, 0, 400, 500);

      // Background grid effect
      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 1;
      for (let x = 0; x < 400; x += 40) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, 500);
        ctx.stroke();
      }
      for (let y = 0; y < 500; y += 40) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(400, y);
        ctx.stroke();
      }

      if (state.gameState === 'PLAYING') {
        // Draw Bricks
        state.bricks.forEach((b) => {
          ctx.fillStyle = b.hp > 1 ? '#e2e8f0' : b.color;
          ctx.fillRect(b.x, b.y, b.w, b.h);
          ctx.strokeStyle = '#0f172a';
          ctx.strokeRect(b.x, b.y, b.w, b.h);
        });

        // Draw Paddle
        const gradient = ctx.createLinearGradient(state.paddleX, 0, state.paddleX + state.paddleWidth, 0);
        gradient.addColorStop(0, '#38bdf8');
        gradient.addColorStop(0.5, '#e2e8f0');
        gradient.addColorStop(1, '#38bdf8');
        ctx.fillStyle = gradient;
        ctx.fillRect(state.paddleX, 460, state.paddleWidth, 12);
        ctx.strokeStyle = '#0284c7';
        ctx.strokeRect(state.paddleX, 460, state.paddleWidth, 12);

        // Draw Ball
        ctx.beginPath();
        ctx.arc(state.ballX, state.ballY, 8, 0, Math.PI * 2);
        ctx.fillStyle = '#f8fafc';
        ctx.shadowBlur = 10;
        ctx.shadowColor = '#38bdf8';
        ctx.fill();
        ctx.shadowBlur = 0;
      }

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-[550px] bg-zinc-950 text-white rounded-xl p-4">
      <div className="flex justify-between items-center w-[400px] mb-4">
        <div>
          <h2 className="text-xl font-bold text-sky-400">Steel Bounce 2</h2>
          <p className="text-xs text-zinc-400">Bounce steel orb & destroy blocks</p>
        </div>
        <div className="text-right">
          <div className="text-lg font-semibold text-sky-300">Score: {score}</div>
          <div className="text-sm text-zinc-400">Lives: {'❤️'.repeat(lives)}</div>
        </div>
      </div>

      <div className="relative border border-sky-900/50 rounded-xl overflow-hidden bg-zinc-900">
        <canvas
          ref={canvasRef}
          width={400}
          height={500}
          onMouseMove={handleMouseMove}
          className="cursor-crosshair block"
        />

        {gameState === 'START' && (
          <div className="absolute inset-0 bg-zinc-950/90 flex flex-col items-center justify-center p-6 text-center">
            <h3 className="text-3xl font-extrabold text-sky-400 mb-2">STEEL BOUNCE 2</h3>
            <p className="text-zinc-400 mb-6 max-w-xs text-sm">
              Move mouse to control magnet paddle. Bounce ball to crush metallic armor blocks!
            </p>
            <button
              onClick={initGame}
              className="px-6 py-3 bg-sky-600 hover:bg-sky-500 text-white font-bold rounded-lg transition"
            >
              Start Game
            </button>
          </div>
        )}

        {gameState === 'GAMEOVER' && (
          <div className="absolute inset-0 bg-zinc-950/90 flex flex-col items-center justify-center p-6 text-center">
            <h3 className="text-3xl font-extrabold text-rose-500 mb-2">GAME OVER</h3>
            <p className="text-zinc-300 text-lg mb-4">
              Final Score: <span className="text-sky-400 font-bold">{score}</span>
            </p>
            <button
              onClick={initGame}
              className="px-6 py-3 bg-sky-600 hover:bg-sky-500 text-white font-bold rounded-lg transition"
            >
              Play Again
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
