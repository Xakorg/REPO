'use client';

import React, { useEffect, useRef, useState } from 'react';

export default function NeonDash() {
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
    let playerY = 220;
    let playerVy = 0;
    const gravity = 0.6;
    const jumpForce = -12;
    let isGrounded = true;

    let obstacles: { x: number; width: number; height: number }[] = [];
    let obstacleTimer = 0;
    let speed = 5;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.code === 'ArrowUp') {
        if (gameStateRef.current === 'playing' && isGrounded) {
          playerVy = jumpForce;
          isGrounded = false;
        }
      }
    };

    const handlePointerDown = () => {
      if (gameStateRef.current === 'playing' && isGrounded) {
        playerVy = jumpForce;
        isGrounded = false;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    canvas.addEventListener('pointerdown', handlePointerDown);

    const gameLoop = () => {
      if (gameStateRef.current === 'playing') {
        ctx.fillStyle = '#09090b';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Ground
        ctx.strokeStyle = '#22c55e';
        ctx.shadowColor = '#22c55e';
        ctx.shadowBlur = 10;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(0, 260);
        ctx.lineTo(canvas.width, 260);
        ctx.stroke();

        // Player physics
        playerVy += gravity;
        playerY += playerVy;
        if (playerY >= 220) {
          playerY = 220;
          playerVy = 0;
          isGrounded = true;
        }

        // Draw Player
        ctx.fillStyle = '#3b82f6';
        ctx.shadowColor = '#3b82f6';
        ctx.shadowBlur = 15;
        ctx.fillRect(60, playerY, 40, 40);

        // Spawn obstacles
        obstacleTimer++;
        if (obstacleTimer > 80 - Math.min(40, Math.floor(currentScore / 10))) {
          obstacleTimer = 0;
          const h = 30 + Math.random() * 30;
          obstacles.push({ x: canvas.width, width: 25, height: h });
        }

        // Update & Draw obstacles
        for (let i = obstacles.length - 1; i >= 0; i--) {
          const obs = obstacles[i];
          obs.x -= speed + Math.floor(currentScore / 20);

          ctx.fillStyle = '#ef4444';
          ctx.shadowColor = '#ef4444';
          ctx.shadowBlur = 15;
          ctx.fillRect(obs.x, 260 - obs.height, obs.width, obs.height);

          // Collision check
          if (
            60 < obs.x + obs.width &&
            60 + 40 > obs.x &&
            playerY + 40 > 260 - obs.height
          ) {
            setGameState('gameover');
            window.dispatchEvent(
              new CustomEvent('xakteir-game-score', { detail: { score: currentScore } })
            );
            return;
          }

          if (obs.x + obs.width < 0) {
            obstacles.splice(i, 1);
            currentScore += 1;
            setScore(currentScore);
          }
        }
      }
      animId = requestAnimationFrame(gameLoop);
    };

    animId = requestAnimationFrame(gameLoop);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('keydown', handleKeyDown);
      canvas.removeEventListener('pointerdown', handlePointerDown);
    };
  }, []);

  const startGame = () => {
    setScore(0);
    setGameState('playing');
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[450px] bg-zinc-950 text-white p-4 rounded-xl border border-zinc-800">
      <div className="flex justify-between w-full max-w-[600px] mb-2 items-center">
        <h2 className="text-xl font-bold tracking-wider text-green-400">NEON DASH</h2>
        <div className="text-lg font-mono">Score: <span className="text-yellow-400">{score}</span></div>
      </div>

      <div className="relative border-2 border-zinc-800 rounded-lg overflow-hidden">
        <canvas ref={canvasRef} width={600} height={300} className="bg-zinc-950 block" />

        {gameState === 'start' && (
          <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center p-4">
            <h1 className="text-3xl font-extrabold mb-2 text-cyan-400">NEON DASH</h1>
            <p className="text-zinc-400 mb-6">Press UP arrow or Tap canvas to Jump</p>
            <button
              onClick={startGame}
              className="px-6 py-2 bg-cyan-600 hover:bg-cyan-500 font-bold rounded-lg transition"
            >
              START GAME
            </button>
          </div>
        )}

        {gameState === 'gameover' && (
          <div className="absolute inset-0 bg-black/85 flex flex-col items-center justify-center p-4">
            <h2 className="text-3xl font-bold text-red-500 mb-2">GAME OVER</h2>
            <p className="text-xl text-zinc-300 mb-6">Final Score: {score}</p>
            <button
              onClick={startGame}
              className="px-6 py-2 bg-red-600 hover:bg-red-500 font-bold rounded-lg transition"
            >
              PLAY AGAIN
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
