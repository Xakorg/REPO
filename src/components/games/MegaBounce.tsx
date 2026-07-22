'use client';

import React, { useEffect, useRef, useState } from 'react';

export default function MegaBounce() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [gameState, setGameState] = useState<'START' | 'PLAYING' | 'GAMEOVER'>('START');
  const [score, setScore] = useState(0);

  useEffect(() => {
    if (gameState !== 'PLAYING') return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let currentScore = 0;

    const paddle = {
      x: canvas.width / 2 - 40,
      y: canvas.height - 30,
      w: 80,
      h: 12,
      speed: 7,
      vx: 0,
    };

    const ball = {
      x: canvas.width / 2,
      y: canvas.height - 50,
      vx: 3.5 * (Math.random() < 0.5 ? 1 : -1),
      vy: -4.5,
      r: 7,
    };

    // Bricks Grid
    type Brick = { x: number; y: number; w: number; h: number; color: string; alive: boolean };
    let bricks: Brick[] = [];
    const colors = ['#f43f5e', '#fb923c', '#facc15', '#4ade80', '#38bdf8', '#c084fc'];

    const createBricks = () => {
      bricks = [];
      const rows = 5;
      const cols = 7;
      const bw = 50;
      const bh = 18;
      const padding = 6;
      const offsetLeft = 15;
      const offsetTop = 40;

      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          bricks.push({
            x: offsetLeft + c * (bw + padding),
            y: offsetTop + r * (bh + padding),
            w: bw,
            h: bh,
            color: colors[r % colors.length],
            alive: true,
          });
        }
      }
    };

    createBricks();

    const keys: Record<string, boolean> = {};
    const handleKeyDown = (e: KeyboardEvent) => { keys[e.code] = true; };
    const handleKeyUp = (e: KeyboardEvent) => { keys[e.code] = false; };
    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      paddle.x = e.clientX - rect.left - paddle.w / 2;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    canvas.addEventListener('mousemove', handleMouseMove);

    const gameLoop = () => {
      // Paddle keyboard movement
      paddle.vx = 0;
      if (keys['ArrowLeft'] || keys['KeyA']) paddle.vx = -paddle.speed;
      if (keys['ArrowRight'] || keys['KeyD']) paddle.vx = paddle.speed;
      paddle.x = Math.max(0, Math.min(canvas.width - paddle.w, paddle.x + paddle.vx));

      // Move Ball
      ball.x += ball.vx;
      ball.y += ball.vy;

      // Wall bounce
      if (ball.x - ball.r <= 0 || ball.x + ball.r >= canvas.width) ball.vx *= -1;
      if (ball.y - ball.r <= 0) ball.vy *= -1;

      // Bottom death
      if (ball.y + ball.r >= canvas.height) {
        setGameState('GAMEOVER');
        window.dispatchEvent(new CustomEvent('xakteir-game-score', { detail: { score: currentScore } }));
        return;
      }

      // Paddle Bounce
      if (
        ball.y + ball.r >= paddle.y &&
        ball.y - ball.r <= paddle.y + paddle.h &&
        ball.x >= paddle.x &&
        ball.x <= paddle.x + paddle.w
      ) {
        ball.vy = -Math.abs(ball.vy);
        // Angle bounce based on hit location
        const hitPos = (ball.x - (paddle.x + paddle.w / 2)) / (paddle.w / 2);
        ball.vx = hitPos * 5;
      }

      // Brick collisions
      let remainingBricks = 0;
      for (const b of bricks) {
        if (!b.alive) continue;
        remainingBricks++;

        if (
          ball.x + ball.r > b.x &&
          ball.x - ball.r < b.x + b.w &&
          ball.y + ball.r > b.y &&
          ball.y - ball.r < b.y + b.h
        ) {
          b.alive = false;
          ball.vy *= -1;
          currentScore += 20;
          setScore(currentScore);
          break;
        }
      }

      if (remainingBricks === 0) {
        currentScore += 200;
        setScore(currentScore);
        ball.vy *= 1.1;
        createBricks();
      }

      // Render
      ctx.fillStyle = '#09090b';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Render Bricks
      for (const b of bricks) {
        if (!b.alive) continue;
        ctx.fillStyle = b.color;
        ctx.fillRect(b.x, b.y, b.w, b.h);
        ctx.strokeStyle = '#09090b';
        ctx.strokeRect(b.x, b.y, b.w, b.h);
      }

      // Render Paddle
      ctx.fillStyle = '#38bdf8';
      ctx.fillRect(paddle.x, paddle.y, paddle.w, paddle.h);

      // Render Ball
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(ball.x, ball.y, ball.r, 0, Math.PI * 2);
      ctx.fill();

      animId = requestAnimationFrame(gameLoop);
    };

    animId = requestAnimationFrame(gameLoop);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      canvas.removeEventListener('mousemove', handleMouseMove);
    };
  }, [gameState]);

  const startGame = () => {
    setScore(0);
    setGameState('PLAYING');
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[500px] bg-zinc-950 text-white rounded-xl p-4 shadow-2xl relative select-none">
      <h2 className="text-2xl font-bold tracking-wider mb-2 text-sky-400">MEGA BOUNCE</h2>
      <div className="relative border-2 border-sky-500/30 rounded-lg overflow-hidden bg-zinc-900">
        <canvas ref={canvasRef} width={420} height={480} className="block cursor-none" />

        {gameState === 'START' && (
          <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center p-6 text-center">
            <p className="text-zinc-300 mb-4 text-sm max-w-xs">Move mouse or A/D keys to control paddle and smash all bricks without letting the ball fall!</p>
            <button
              onClick={startGame}
              className="px-6 py-2 bg-sky-500 hover:bg-sky-400 text-zinc-950 font-bold rounded-full transition transform hover:scale-105"
            >
              LAUNCH BALL
            </button>
          </div>
        )}

        {gameState === 'GAMEOVER' && (
          <div className="absolute inset-0 bg-black/85 flex flex-col items-center justify-center p-6 text-center">
            <h3 className="text-2xl font-extrabold text-red-500 mb-2">BALL DROPPED</h3>
            <p className="text-lg text-zinc-300 mb-4">Final Score: <span className="text-sky-400 font-bold">{score}</span></p>
            <button
              onClick={startGame}
              className="px-6 py-2 bg-sky-500 hover:bg-sky-400 text-zinc-950 font-bold rounded-full transition transform hover:scale-105"
            >
              PLAY AGAIN
            </button>
          </div>
        )}

        {gameState === 'PLAYING' && (
          <div className="absolute top-3 left-3 bg-zinc-900/80 border border-sky-500/30 px-3 py-1 rounded-md text-sky-400 text-sm font-bold">
            Score: {score}
          </div>
        )}
      </div>
    </div>
  );
}
