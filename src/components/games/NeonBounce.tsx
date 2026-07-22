'use client';

import React, { useEffect, useRef, useState } from 'react';

export default function NeonBounce() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);

  const gameState = useRef({
    paddleX: 160,
    paddleWidth: 80,
    ballX: 200,
    ballY: 300,
    ballDx: 3,
    ballDy: -3,
    score: 0,
    bricks: [] as { x: number; y: number; width: number; height: number; active: boolean; color: string }[],
    gameOver: false,
    started: false,
  });

  const initGame = () => {
    const bricks = [];
    const colors = ['#f43f5e', '#ec4899', '#a855f7', '#3b82f6', '#06b6d4', '#10b981'];
    const rows = 5;
    const cols = 7;
    const brickW = 50;
    const brickH = 15;
    const padding = 6;
    const offsetLeft = 10;
    const offsetTop = 40;

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        bricks.push({
          x: offsetLeft + c * (brickW + padding),
          y: offsetTop + r * (brickH + padding),
          width: brickW,
          height: brickH,
          active: true,
          color: colors[r % colors.length],
        });
      }
    }

    gameState.current = {
      paddleX: 160,
      paddleWidth: 80,
      ballX: 200,
      ballY: 300,
      ballDx: 3 * (Math.random() > 0.5 ? 1 : -1),
      ballDy: -3.5,
      score: 0,
      bricks,
      gameOver: false,
      started: true,
    };
    setScore(0);
    setGameOver(false);
    setGameStarted(true);
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const relativeX = e.clientX - rect.left;
      if (relativeX > 0 && relativeX < canvas.width) {
        gameState.current.paddleX = relativeX - gameState.current.paddleWidth / 2;
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        const rect = canvas.getBoundingClientRect();
        const relativeX = e.touches[0].clientX - rect.left;
        if (relativeX > 0 && relativeX < canvas.width) {
          gameState.current.paddleX = relativeX - gameState.current.paddleWidth / 2;
        }
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('touchmove', handleTouchMove);

    const loop = () => {
      const state = gameState.current;
      ctx.fillStyle = '#09090b';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      if (state.started && !state.gameOver) {
        // Move ball
        state.ballX += state.ballDx;
        state.ballY += state.ballDy;

        // Bounce walls
        if (state.ballX + 6 > canvas.width || state.ballX - 6 < 0) {
          state.ballDx = -state.ballDx;
        }
        if (state.ballY - 6 < 0) {
          state.ballDy = -state.ballDy;
        }

        // Paddle collision
        const paddleY = canvas.height - 25;
        if (
          state.ballY + 6 >= paddleY &&
          state.ballY - 6 <= paddleY + 12 &&
          state.ballX >= state.paddleX &&
          state.ballX <= state.paddleX + state.paddleWidth
        ) {
          state.ballDy = -Math.abs(state.ballDy);
          const hitPoint = (state.ballX - (state.paddleX + state.paddleWidth / 2)) / (state.paddleWidth / 2);
          state.ballDx = hitPoint * 4;
        }

        // Bottom collision (Game Over)
        if (state.ballY + 6 > canvas.height) {
          state.gameOver = true;
          setGameOver(true);
          window.dispatchEvent(new CustomEvent('xakteir-game-score', { detail: { score: state.score } }));
        }

        // Brick collision
        let remainingBricks = 0;
        state.bricks.forEach((b) => {
          if (b.active) {
            remainingBricks++;
            if (
              state.ballX > b.x &&
              state.ballX < b.x + b.width &&
              state.ballY > b.y &&
              state.ballY < b.y + b.height
            ) {
              b.active = false;
              state.ballDy = -state.ballDy;
              state.score += 20;
              setScore(state.score);
            }
          }
        });

        if (remainingBricks === 0 && state.bricks.length > 0) {
          // Win condition -> bonus score
          state.score += 100;
          setScore(state.score);
          state.gameOver = true;
          setGameOver(true);
          window.dispatchEvent(new CustomEvent('xakteir-game-score', { detail: { score: state.score } }));
        }
      }

      // Draw bricks
      state.bricks.forEach((b) => {
        if (b.active) {
          ctx.shadowBlur = 8;
          ctx.shadowColor = b.color;
          ctx.fillStyle = b.color;
          ctx.fillRect(b.x, b.y, b.width, b.height);
          ctx.shadowBlur = 0;
        }
      });

      // Draw paddle
      ctx.shadowBlur = 10;
      ctx.shadowColor = '#06b6d4';
      ctx.fillStyle = '#06b6d4';
      ctx.fillRect(state.paddleX, canvas.height - 25, state.paddleWidth, 12);

      // Draw ball
      ctx.shadowBlur = 12;
      ctx.shadowColor = '#a855f7';
      ctx.fillStyle = '#a855f7';
      ctx.beginPath();
      ctx.arc(state.ballX, state.ballY, 7, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('touchmove', handleTouchMove);
    };
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-[450px] bg-zinc-950 text-white p-4 rounded-xl border border-zinc-800">
      <div className="w-full max-w-[400px] flex justify-between items-center mb-3">
        <h2 className="text-xl font-bold text-cyan-400">NEON BOUNCE</h2>
        <div className="text-sm font-semibold bg-zinc-900 px-3 py-1 rounded-full border border-zinc-800">
          Score: <span className="text-pink-400">{score}</span>
        </div>
      </div>

      <div className="relative border-2 border-cyan-500/40 rounded-lg overflow-hidden shadow-lg shadow-cyan-500/10">
        <canvas ref={canvasRef} width={400} height={400} className="bg-zinc-950 cursor-none" />

        {(!gameStarted || gameOver) && (
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center">
            <h3 className="text-2xl font-bold mb-2 text-pink-500">{gameOver ? 'GAME OVER' : 'NEON BOUNCE'}</h3>
            {gameOver && <p className="text-zinc-300 mb-4">Final Score: {score}</p>}
            <button
              onClick={initGame}
              className="px-6 py-2 bg-gradient-to-r from-pink-500 to-cyan-500 text-white font-bold rounded-lg hover:opacity-90 transition transform hover:scale-105"
            >
              {gameOver ? 'Play Again' : 'Start Game'}
            </button>
          </div>
        )}
      </div>

      <p className="text-xs text-zinc-500 mt-3">Move mouse/touch to control paddle and destroy neon blocks!</p>
    </div>
  );
}
