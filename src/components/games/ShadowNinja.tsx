'use client';

import React, { useEffect, useRef, useState } from 'react';

type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';

export default function ShadowNinja() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [gameState, setGameState] = useState<'start' | 'playing' | 'gameover'>('start');
  const [score, setScore] = useState(0);

  const gameStateRef = useRef(gameState);
  gameStateRef.current = gameState;

  const currentDirRef = useRef<Direction | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let currentScore = 0;
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;

    let enemies: { id: number; dir: Direction; dist: number; speed: number }[] = [];
    let enemyId = 0;
    let spawnTimer = 0;
    let slashEffect: { dir: Direction; timer: number } | null = null;

    const directions: Direction[] = ['UP', 'DOWN', 'LEFT', 'RIGHT'];

    const handleKeyDown = (e: KeyboardEvent) => {
      let dir: Direction | null = null;
      if (e.code === 'ArrowUp' || e.code === 'KeyW') dir = 'UP';
      if (e.code === 'ArrowDown' || e.code === 'KeyS') dir = 'DOWN';
      if (e.code === 'ArrowLeft' || e.code === 'KeyA') dir = 'LEFT';
      if (e.code === 'ArrowRight' || e.code === 'KeyD') dir = 'RIGHT';

      if (dir && gameStateRef.current === 'playing') {
        processStrike(dir);
      }
    };

    const processStrike = (dir: Direction) => {
      slashEffect = { dir, timer: 6 };
      // Check nearest enemy in that direction
      let targetIdx = -1;
      let minDist = 9999;
      enemies.forEach((enemy, idx) => {
        if (enemy.dir === dir && enemy.dist < minDist) {
          minDist = enemy.dist;
          targetIdx = idx;
        }
      });

      if (targetIdx !== -1 && minDist < 140) {
        enemies.splice(targetIdx, 1);
        currentScore += 15;
        setScore(currentScore);
      }
    };

    currentDirRef.current = null;
    window.addEventListener('keydown', handleKeyDown);

    const gameLoop = () => {
      if (gameStateRef.current === 'playing') {
        ctx.fillStyle = '#09090b';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Center Ninja
        ctx.fillStyle = '#a855f7';
        ctx.shadowColor = '#a855f7';
        ctx.shadowBlur = 15;
        ctx.beginPath();
        ctx.arc(centerX, centerY, 20, 0, Math.PI * 2);
        ctx.fill();

        // Slash Effect
        if (slashEffect && slashEffect.timer > 0) {
          ctx.strokeStyle = '#38bdf8';
          ctx.shadowColor = '#38bdf8';
          ctx.shadowBlur = 20;
          ctx.lineWidth = 4;
          ctx.beginPath();
          if (slashEffect.dir === 'UP') { ctx.moveTo(centerX, centerY); ctx.lineTo(centerX, centerY - 60); }
          if (slashEffect.dir === 'DOWN') { ctx.moveTo(centerX, centerY); ctx.lineTo(centerX, centerY + 60); }
          if (slashEffect.dir === 'LEFT') { ctx.moveTo(centerX, centerY); ctx.lineTo(centerX - 60, centerY); }
          if (slashEffect.dir === 'RIGHT') { ctx.moveTo(centerX, centerY); ctx.lineTo(centerX + 60, centerY); }
          ctx.stroke();
          slashEffect.timer--;
        }

        // Spawn Enemies
        spawnTimer++;
        if (spawnTimer > Math.max(18, 50 - Math.floor(currentScore / 40))) {
          spawnTimer = 0;
          const randomDir = directions[Math.floor(Math.random() * 4)];
          enemies.push({
            id: ++enemyId,
            dir: randomDir,
            dist: 220,
            speed: 2 + Math.random() * 1.5 + currentScore / 100
          });
        }

        // Update & Draw Enemies
        for (let i = enemies.length - 1; i >= 0; i--) {
          const enemy = enemies[i];
          enemy.dist -= enemy.speed;

          let ex = centerX;
          let ey = centerY;
          if (enemy.dir === 'UP') ey = centerY - enemy.dist;
          if (enemy.dir === 'DOWN') ey = centerY + enemy.dist;
          if (enemy.dir === 'LEFT') ex = centerX - enemy.dist;
          if (enemy.dir === 'RIGHT') ex = centerX + enemy.dist;

          ctx.fillStyle = '#ef4444';
          ctx.shadowColor = '#ef4444';
          ctx.shadowBlur = 10;
          ctx.beginPath();
          ctx.arc(ex, ey, 10, 0, Math.PI * 2);
          ctx.fill();

          // Hit center -> Game Over
          if (enemy.dist <= 22) {
            setGameState('gameover');
            window.dispatchEvent(
              new CustomEvent('xakteir-game-score', { detail: { score: currentScore } })
            );
            return;
          }
        }
      }
      animId = requestAnimationFrame(gameLoop);
    };

    animId = requestAnimationFrame(gameLoop);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const startGame = () => {
    setScore(0);
    setGameState('playing');
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[450px] bg-zinc-950 text-white p-4 rounded-xl border border-zinc-800">
      <div className="flex justify-between w-full max-w-[500px] mb-2 items-center">
        <h2 className="text-xl font-bold tracking-wider text-purple-400">SHADOW NINJA</h2>
        <div className="text-lg font-mono">Score: <span className="text-yellow-400">{score}</span></div>
      </div>

      <div className="relative border-2 border-zinc-800 rounded-lg overflow-hidden">
        <canvas ref={canvasRef} width={500} height={400} className="bg-zinc-950 block" />

        {gameState === 'start' && (
          <div className="absolute inset-0 bg-black/85 flex flex-col items-center justify-center p-4">
            <h1 className="text-3xl font-extrabold mb-2 text-purple-400">SHADOW NINJA</h1>
            <p className="text-zinc-400 mb-6 text-center">Use Arrow Keys or WASD to strike incoming enemies from 4 directions!</p>
            <button
              onClick={startGame}
              className="px-6 py-2 bg-purple-600 hover:bg-purple-500 font-bold rounded-lg transition"
            >
              BEGIN TRAINING
            </button>
          </div>
        )}

        {gameState === 'gameover' && (
          <div className="absolute inset-0 bg-black/90 flex flex-col items-center justify-center p-4">
            <h2 className="text-3xl font-bold text-red-500 mb-2">STRIKE FAILED</h2>
            <p className="text-xl text-zinc-300 mb-6">Final Score: {score}</p>
            <button
              onClick={startGame}
              className="px-6 py-2 bg-purple-600 hover:bg-purple-500 font-bold rounded-lg transition"
            >
              TRY AGAIN
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
