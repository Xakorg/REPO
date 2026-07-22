'use client';

import React, { useEffect, useRef, useState } from 'react';

export default function CosmicBounce() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [gameState, setGameState] = useState<'start' | 'playing' | 'gameover'>('start');
  const [score, setScore] = useState(0);

  const gameStateRef = useRef(gameState);
  gameStateRef.current = gameState;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let currentScore = 0;

    let paddleWidth = 100;
    let paddleX = (canvas.width - paddleWidth) / 2;

    let ballX = canvas.width / 2;
    let ballY = canvas.height - 60;
    let ballDx = 4 * (Math.random() > 0.5 ? 1 : -1);
    let ballDy = -4;

    const rowCount = 4;
    const colCount = 7;
    const blockWidth = 70;
    const blockHeight = 20;
    const blockPadding = 10;
    const offsetTop = 40;
    const offsetLeft = 25;

    let blocks: { x: number; y: number; active: boolean; color: string }[] = [];

    const initBlocks = () => {
      blocks = [];
      const colors = ['#f43f5e', '#a855f7', '#3b82f6', '#10b981'];
      for (let r = 0; r < rowCount; r++) {
        for (let c = 0; c < colCount; c++) {
          blocks.push({
            x: offsetLeft + c * (blockWidth + blockPadding),
            y: offsetTop + r * (blockHeight + blockPadding),
            active: true,
            color: colors[r % colors.length],
          });
        }
      }
    };

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      paddleX = Math.max(0, Math.min(canvas.width - paddleWidth, e.clientX - rect.left - paddleWidth / 2));
    };

    canvas.addEventListener('mousemove', handleMouseMove);

    const gameLoop = () => {
      if (gameStateRef.current === 'playing') {
        ctx.fillStyle = '#09090b';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Draw Paddle
        ctx.fillStyle = '#ec4899';
        ctx.shadowColor = '#ec4899';
        ctx.shadowBlur = 10;
        ctx.fillRect(paddleX, canvas.height - 20, paddleWidth, 12);

        // Update & Draw Ball
        ballX += ballDx;
        ballY += ballDy;

        if (ballX <= 8 || ballX >= canvas.width - 8) ballDx = -ballDx;
        if (ballY <= 8) ballDy = -ballDy;

        // Paddle Collision
        if (
          ballY + 8 >= canvas.height - 20 &&
          ballX >= paddleX &&
          ballX <= paddleX + paddleWidth
        ) {
          ballDy = -Math.abs(ballDy);
          const hitPoint = (ballX - (paddleX + paddleWidth / 2)) / (paddleWidth / 2);
          ballDx = hitPoint * 5;
        }

        // Draw Ball
        ctx.fillStyle = '#fde047';
        ctx.shadowColor = '#fde047';
        ctx.shadowBlur = 12;
        ctx.beginPath();
        ctx.arc(ballX, ballY, 8, 0, Math.PI * 2);
        ctx.fill();

        // Draw & Check Blocks
        let activeCount = 0;
        blocks.forEach((block) => {
          if (!block.active) return;
          activeCount++;

          ctx.fillStyle = block.color;
          ctx.shadowColor = block.color;
          ctx.shadowBlur = 8;
          ctx.fillRect(block.x, block.y, blockWidth, blockHeight);

          // Ball block collision
          if (
            ballX + 8 > block.x &&
            ballX - 8 < block.x + blockWidth &&
            ballY + 8 > block.y &&
            ballY - 8 < block.y + blockHeight
          ) {
            block.active = false;
            ballDy = -ballDy;
            currentScore += 10;
            setScore(currentScore);
          }
        });

        // Respawn blocks if all destroyed
        if (activeCount === 0) {
          initBlocks();
          ballDy = ballDy > 0 ? ballDy + 0.5 : ballDy - 0.5;
        }

        // Game Over condition
        if (ballY > canvas.height) {
          setGameState('gameover');
          window.dispatchEvent(
            new CustomEvent('xakteir-game-score', { detail: { score: currentScore } })
          );
          return;
        }
      }
      animId = requestAnimationFrame(gameLoop);
    };

    initBlocks();
    animId = requestAnimationFrame(gameLoop);

    return () => {
      cancelAnimationFrame(animId);
      canvas.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  const startGame = () => {
    setScore(0);
    setGameState('playing');
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[450px] bg-zinc-950 text-white p-4 rounded-xl border border-zinc-800">
      <div className="flex justify-between w-full max-w-[600px] mb-2 items-center">
        <h2 className="text-xl font-bold tracking-wider text-pink-500">COSMIC BOUNCE</h2>
        <div className="text-lg font-mono">Score: <span className="text-yellow-400">{score}</span></div>
      </div>

      <div className="relative border-2 border-zinc-800 rounded-lg overflow-hidden">
        <canvas ref={canvasRef} width={600} height={350} className="bg-zinc-950 block cursor-none" />

        {gameState === 'start' && (
          <div className="absolute inset-0 bg-black/85 flex flex-col items-center justify-center p-4">
            <h1 className="text-3xl font-extrabold mb-2 text-pink-500">COSMIC BOUNCE</h1>
            <p className="text-zinc-400 mb-6">Move mouse to control paddle and destroy cosmic blocks!</p>
            <button
              onClick={startGame}
              className="px-6 py-2 bg-pink-600 hover:bg-pink-500 font-bold rounded-lg transition"
            >
              LAUNCH BALL
            </button>
          </div>
        )}

        {gameState === 'gameover' && (
          <div className="absolute inset-0 bg-black/90 flex flex-col items-center justify-center p-4">
            <h2 className="text-3xl font-bold text-red-500 mb-2">ORB LOST</h2>
            <p className="text-xl text-zinc-300 mb-6">Final Score: {score}</p>
            <button
              onClick={startGame}
              className="px-6 py-2 bg-pink-600 hover:bg-pink-500 font-bold rounded-lg transition"
            >
              TRY AGAIN
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
