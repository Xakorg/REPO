'use client';

import React, { useEffect, useRef, useState } from 'react';

export default function SuperRunner() {
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
    let speed = 5;

    const groundY = canvas.height - 60;
    const player = {
      x: 60,
      y: groundY - 30,
      w: 30,
      h: 45,
      vy: 0,
      gravity: 0.7,
      jumpForce: -13,
      grounded: true,
      jumpsLeft: 2,
    };

    type Obstacle = { x: number; w: number; h: number; type: 'crate' | 'spike' | 'coin' };
    let obstacles: Obstacle[] = [];
    let spawnTimer = 0;

    const jump = () => {
      if (player.jumpsLeft > 0) {
        player.vy = player.jumpForce;
        player.grounded = false;
        player.jumpsLeft--;
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'KeyW') {
        e.preventDefault();
        jump();
      }
    };

    const handleCanvasClick = () => {
      jump();
    };

    window.addEventListener('keydown', handleKeyDown);
    canvas.addEventListener('click', handleCanvasClick);

    const gameLoop = () => {
      // Update Physics
      player.vy += player.gravity;
      player.y += player.vy;

      if (player.y >= groundY - player.h) {
        player.y = groundY - player.h;
        player.vy = 0;
        player.grounded = true;
        player.jumpsLeft = 2;
      }

      speed = 5 + Math.floor(currentScore / 50) * 0.5;

      // Spawn Obstacles
      spawnTimer++;
      if (spawnTimer >= Math.max(40, 90 - Math.floor(currentScore / 20))) {
        spawnTimer = 0;
        const rand = Math.random();
        if (rand < 0.4) {
          // Crate
          obstacles.push({ x: canvas.width + 20, w: 30, h: 30, type: 'crate' });
        } else if (rand < 0.7) {
          // Spike
          obstacles.push({ x: canvas.width + 20, w: 25, h: 35, type: 'spike' });
        } else {
          // Coin
          obstacles.push({ x: canvas.width + 20, w: 20, h: 20, type: 'coin' });
        }
      }

      // Draw Screen
      ctx.fillStyle = '#09090b';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw Ground
      ctx.fillStyle = '#27272a';
      ctx.fillRect(0, groundY, canvas.width, canvas.height - groundY);
      ctx.fillStyle = '#10b981';
      ctx.fillRect(0, groundY, canvas.width, 4);

      // Draw Player Runner
      ctx.fillStyle = '#10b981';
      ctx.fillRect(player.x, player.y, player.w, player.h);
      // Eye
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(player.x + 18, player.y + 8, 8, 8);
      ctx.fillStyle = '#09090b';
      ctx.fillRect(player.x + 22, player.y + 10, 4, 4);

      // Process Obstacles
      for (let i = obstacles.length - 1; i >= 0; i--) {
        const obs = obstacles[i];
        obs.x -= speed;

        const obsY = obs.type === 'coin' ? groundY - 70 : groundY - obs.h;

        // Draw Obstacles
        if (obs.type === 'crate') {
          ctx.fillStyle = '#d97706';
          ctx.fillRect(obs.x, obsY, obs.w, obs.h);
          ctx.strokeStyle = '#b45309';
          ctx.strokeRect(obs.x, obsY, obs.w, obs.h);
        } else if (obs.type === 'spike') {
          ctx.fillStyle = '#ef4444';
          ctx.beginPath();
          ctx.moveTo(obs.x, groundY);
          ctx.lineTo(obs.x + obs.w / 2, groundY - obs.h);
          ctx.lineTo(obs.x + obs.w, groundY);
          ctx.closePath();
          ctx.fill();
        } else {
          // Coin
          ctx.fillStyle = '#f59e0b';
          ctx.beginPath();
          ctx.arc(obs.x + obs.w / 2, obsY + obs.h / 2, obs.w / 2, 0, Math.PI * 2);
          ctx.fill();
        }

        // Collision Check
        const pRight = player.x + player.w;
        const pBottom = player.y + player.h;
        const oRight = obs.x + obs.w;
        const oBottom = obsY + obs.h;

        if (player.x < oRight && pRight > obs.x && player.y < oBottom && pBottom > obsY) {
          if (obs.type === 'coin') {
            currentScore += 25;
            setScore(currentScore);
            obstacles.splice(i, 1);
            continue;
          } else {
            // Hit hazard
            setGameState('GAMEOVER');
            window.dispatchEvent(new CustomEvent('xakteir-game-score', { detail: { score: currentScore } }));
            return;
          }
        }

        if (obs.x + obs.w < 0) {
          if (obs.type !== 'coin') {
            currentScore += 5;
            setScore(currentScore);
          }
          obstacles.splice(i, 1);
        }
      }

      animId = requestAnimationFrame(gameLoop);
    };

    animId = requestAnimationFrame(gameLoop);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('keydown', handleKeyDown);
      canvas.removeEventListener('click', handleCanvasClick);
    };
  }, [gameState]);

  const startGame = () => {
    setScore(0);
    setGameState('PLAYING');
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[500px] bg-zinc-950 text-white rounded-xl p-4 shadow-2xl relative select-none">
      <h2 className="text-2xl font-bold tracking-wider mb-2 text-emerald-400">SUPER RUNNER</h2>
      <div className="relative border-2 border-emerald-500/30 rounded-lg overflow-hidden bg-zinc-900">
        <canvas ref={canvasRef} width={500} height={350} className="block cursor-pointer" />

        {gameState === 'START' && (
          <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center p-6 text-center">
            <p className="text-zinc-300 mb-4 text-sm max-w-xs">Press SPACE or CLICK to Jump! Double-jump over crates and spikes while picking up golden coins!</p>
            <button
              onClick={startGame}
              className="px-6 py-2 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold rounded-full transition transform hover:scale-105"
            >
              RUN NOW
            </button>
          </div>
        )}

        {gameState === 'GAMEOVER' && (
          <div className="absolute inset-0 bg-black/85 flex flex-col items-center justify-center p-6 text-center">
            <h3 className="text-2xl font-extrabold text-red-500 mb-2">RUN OVER</h3>
            <p className="text-lg text-zinc-300 mb-4">Final Score: <span className="text-emerald-400 font-bold">{score}</span></p>
            <button
              onClick={startGame}
              className="px-6 py-2 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold rounded-full transition transform hover:scale-105"
            >
              TRY AGAIN
            </button>
          </div>
        )}

        {gameState === 'PLAYING' && (
          <div className="absolute top-3 left-3 bg-zinc-900/80 border border-emerald-500/30 px-3 py-1 rounded-md text-emerald-400 text-sm font-bold">
            Score: {score}
          </div>
        )}
      </div>
    </div>
  );
}
