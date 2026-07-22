'use client';

import React, { useEffect, useRef, useState } from 'react';

export default function SteelBounce() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [gameState, setGameState] = useState<'START' | 'PLAYING' | 'GAMEOVER'>('START');
  const [score, setScore] = useState<number>(0);
  const scoreRef = useRef<number>(0);

  useEffect(() => {
    scoreRef.current = score;
  }, [score]);

  const startGame = () => {
    setScore(0);
    scoreRef.current = 0;
    setGameState('PLAYING');
  };

  useEffect(() => {
    if (gameState !== 'PLAYING') return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let paddleWidth = 100;
    let paddleHeight = 14;
    let paddleX = (canvas.width - paddleWidth) / 2;

    let ballX = canvas.width / 2;
    let ballY = canvas.height - 40;
    let ballRadius = 8;
    let ballDx = 3.5 * (Math.random() > 0.5 ? 1 : -1);
    let ballDy = -4;

    const keys: Record<string, boolean> = {};

    const bricks: { x: number; y: number; width: number; height: number; alive: boolean; hp: number }[] = [];
    const rows = 4;
    const cols = 7;
    const padding = 8;
    const offsetTop = 40;
    const offsetLeft = 35;
    const brickWidth = (canvas.width - offsetLeft * 2 - (cols - 1) * padding) / cols;
    const brickHeight = 20;

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        bricks.push({
          x: offsetLeft + c * (brickWidth + padding),
          y: offsetTop + r * (brickHeight + padding),
          width: brickWidth,
          height: brickHeight,
          alive: true,
          hp: r === 0 ? 2 : 1,
        });
      }
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      keys[e.key] = true;
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      keys[e.key] = false;
    };
    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      paddleX = Math.max(0, Math.min(canvas.width - paddleWidth, mouseX - paddleWidth / 2));
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    canvas.addEventListener('mousemove', handleMouseMove);

    const gameLoop = () => {
      // Movement
      if (keys['ArrowLeft'] || keys['a'] || keys['A']) {
        paddleX = Math.max(0, paddleX - 7);
      }
      if (keys['ArrowRight'] || keys['d'] || keys['D']) {
        paddleX = Math.min(canvas.width - paddleWidth, paddleX + 7);
      }

      ballX += ballDx;
      ballY += ballDy;

      // Wall Bounce
      if (ballX - ballRadius < 0) {
        ballX = ballRadius;
        ballDx = -ballDx;
      }
      if (ballX + ballRadius > canvas.width) {
        ballX = canvas.width - ballRadius;
        ballDx = -ballDx;
      }
      if (ballY - ballRadius < 0) {
        ballY = ballRadius;
        ballDy = -ballDy;
      }

      // Paddle Collision
      if (
        ballY + ballRadius >= canvas.height - paddleHeight - 10 &&
        ballY - ballRadius <= canvas.height - 10 &&
        ballX >= paddleX &&
        ballX <= paddleX + paddleWidth &&
        ballDy > 0
      ) {
        ballDy = -Math.abs(ballDy);
        const hitPos = (ballX - (paddleX + paddleWidth / 2)) / (paddleWidth / 2);
        ballDx = hitPos * 5;
        setScore((prev) => prev + 10);
      }

      // Brick Collision
      let allBroken = true;
      bricks.forEach((b) => {
        if (!b.alive) return;
        allBroken = false;
        if (
          ballX + ballRadius > b.x &&
          ballX - ballRadius < b.x + b.width &&
          ballY + ballRadius > b.y &&
          ballY - ballRadius < b.y + b.height
        ) {
          b.hp -= 1;
          if (b.hp <= 0) b.alive = false;
          ballDy = -ballDy;
          setScore((prev) => prev + 25);
        }
      });

      if (allBroken) {
        // Respawn bricks with higher speed
        bricks.forEach((b) => {
          b.alive = true;
          b.hp = Math.random() > 0.5 ? 2 : 1;
        });
        ballDx *= 1.1;
        ballDy *= 1.1;
      }

      // Bottom death
      if (ballY - ballRadius > canvas.height) {
        const finalScore = scoreRef.current;
        window.dispatchEvent(new CustomEvent('xakteir-game-score', { detail: { score: finalScore } }));
        setGameState('GAMEOVER');
        return;
      }

      // Draw
      ctx.fillStyle = '#09090b';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw Bricks
      bricks.forEach((b) => {
        if (!b.alive) return;
        ctx.fillStyle = b.hp > 1 ? '#71717a' : '#3f3f46';
        ctx.fillRect(b.x, b.y, b.width, b.height);
        ctx.strokeStyle = '#a1a1aa';
        ctx.strokeRect(b.x, b.y, b.width, b.height);
      });

      // Draw Paddle
      ctx.fillStyle = '#e4e4e7';
      ctx.beginPath();
      ctx.roundRect(paddleX, canvas.height - paddleHeight - 10, paddleWidth, paddleHeight, 6);
      ctx.fill();

      // Draw Ball
      ctx.fillStyle = '#38bdf8';
      ctx.beginPath();
      ctx.arc(ballX, ballY, ballRadius, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 10;
      ctx.shadowColor = '#0284c7';

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

  return (
    <div className="flex flex-col items-center justify-center min-h-[500px] bg-zinc-950 text-white rounded-xl p-4">
      <div className="flex justify-between items-center w-full max-w-[600px] mb-4">
        <h2 className="text-xl font-bold text-slate-200">Steel Bounce</h2>
        <div className="text-lg font-semibold text-cyan-400">Score: {score}</div>
      </div>

      <div className="relative border border-zinc-800 rounded-lg overflow-hidden">
        <canvas ref={canvasRef} width={600} height={400} className="bg-zinc-950 block" />

        {gameState === 'START' && (
          <div className="absolute inset-0 bg-zinc-950/90 flex flex-col items-center justify-center p-6 text-center">
            <h3 className="text-3xl font-extrabold text-cyan-400 mb-2">STEEL BOUNCE</h3>
            <p className="text-zinc-400 mb-6 max-w-sm">Use Arrow keys or Mouse to move the steel paddle. Destroy steel blocks and bounce high!</p>
            <button
              onClick={startGame}
              className="px-6 py-3 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-lg transition"
            >
              Start Game
            </button>
          </div>
        )}

        {gameState === 'GAMEOVER' && (
          <div className="absolute inset-0 bg-zinc-950/90 flex flex-col items-center justify-center p-6 text-center">
            <h3 className="text-3xl font-extrabold text-red-500 mb-2">GAME OVER</h3>
            <p className="text-zinc-300 text-lg mb-4">Final Score: <span className="text-cyan-400 font-bold">{score}</span></p>
            <button
              onClick={startGame}
              className="px-6 py-3 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-lg transition"
            >
              Play Again
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
