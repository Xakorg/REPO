'use client';

import React, { useEffect, useRef, useState } from 'react';

export default function QuantumStrike() {
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
    let playerX = canvas.width / 2;
    let keys: { [key: string]: boolean } = {};

    let bullets: { x: number; y: number }[] = [];
    let enemies: { x: number; y: number; speed: number; hp: number }[] = [];
    let enemyTimer = 0;
    let shootCooldown = 0;

    const handleKeyDown = (e: KeyboardEvent) => { keys[e.code] = true; };
    const handleKeyUp = (e: KeyboardEvent) => { keys[e.code] = false; };

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      playerX = Math.max(20, Math.min(canvas.width - 20, e.clientX - rect.left));
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    canvas.addEventListener('mousemove', handleMouseMove);

    const gameLoop = () => {
      if (gameStateRef.current === 'playing') {
        ctx.fillStyle = '#09090b';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Keyboard movement
        if (keys['ArrowLeft'] || keys['KeyA']) playerX = Math.max(20, playerX - 6);
        if (keys['ArrowRight'] || keys['KeyD']) playerX = Math.min(canvas.width - 20, playerX + 6);

        // Auto/space shoot
        shootCooldown++;
        if ((keys['Space'] || shootCooldown >= 15) && shootCooldown >= 12) {
          bullets.push({ x: playerX, y: canvas.height - 40 });
          shootCooldown = 0;
        }

        // Draw Player
        ctx.fillStyle = '#38bdf8';
        ctx.shadowColor = '#38bdf8';
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.moveTo(playerX, canvas.height - 40);
        ctx.lineTo(playerX - 20, canvas.height - 10);
        ctx.lineTo(playerX + 20, canvas.height - 10);
        ctx.closePath();
        ctx.fill();

        // Update & Draw Bullets
        for (let i = bullets.length - 1; i >= 0; i--) {
          const b = bullets[i];
          b.y -= 9;
          ctx.fillStyle = '#facc15';
          ctx.shadowColor = '#facc15';
          ctx.shadowBlur = 8;
          ctx.fillRect(b.x - 2, b.y, 4, 12);

          if (b.y < 0) bullets.splice(i, 1);
        }

        // Spawn Enemies
        enemyTimer++;
        if (enemyTimer > Math.max(20, 60 - Math.floor(currentScore / 50))) {
          enemyTimer = 0;
          enemies.push({
            x: 20 + Math.random() * (canvas.width - 40),
            y: -20,
            speed: 1.5 + Math.random() * 2 + currentScore / 200,
            hp: 1
          });
        }

        // Update & Draw Enemies
        for (let i = enemies.length - 1; i >= 0; i--) {
          const enemy = enemies[i];
          enemy.y += enemy.speed;

          ctx.fillStyle = '#a855f7';
          ctx.shadowColor = '#a855f7';
          ctx.shadowBlur = 10;
          ctx.beginPath();
          ctx.arc(enemy.x, enemy.y, 16, 0, Math.PI * 2);
          ctx.fill();

          // Check hit with bullets
          for (let j = bullets.length - 1; j >= 0; j--) {
            const b = bullets[j];
            const dist = Math.hypot(enemy.x - b.x, enemy.y - b.y);
            if (dist < 18) {
              bullets.splice(j, 1);
              enemies.splice(i, 1);
              currentScore += 10;
              setScore(currentScore);
              break;
            }
          }

          // Check hit with player or reached bottom
          if (enemy.y >= canvas.height - 30 || Math.hypot(enemy.x - playerX, enemy.y - (canvas.height - 25)) < 25) {
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
      window.removeEventListener('keyup', handleKeyUp);
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
        <h2 className="text-xl font-bold tracking-wider text-sky-400">QUANTUM STRIKE</h2>
        <div className="text-lg font-mono">Score: <span className="text-yellow-400">{score}</span></div>
      </div>

      <div className="relative border-2 border-zinc-800 rounded-lg overflow-hidden">
        <canvas ref={canvasRef} width={600} height={350} className="bg-zinc-950 block cursor-crosshair" />

        {gameState === 'start' && (
          <div className="absolute inset-0 bg-black/85 flex flex-col items-center justify-center p-4">
            <h1 className="text-3xl font-extrabold mb-2 text-sky-400">QUANTUM STRIKE</h1>
            <p className="text-zinc-400 mb-6">Move with Mouse / Arrow keys to blast quantum targets!</p>
            <button
              onClick={startGame}
              className="px-6 py-2 bg-sky-600 hover:bg-sky-500 font-bold rounded-lg transition"
            >
              LAUNCH MISSION
            </button>
          </div>
        )}

        {gameState === 'gameover' && (
          <div className="absolute inset-0 bg-black/90 flex flex-col items-center justify-center p-4">
            <h2 className="text-3xl font-bold text-red-500 mb-2">DEFENSES BREACHED</h2>
            <p className="text-xl text-zinc-300 mb-6">Final Score: {score}</p>
            <button
              onClick={startGame}
              className="px-6 py-2 bg-sky-600 hover:bg-sky-500 font-bold rounded-lg transition"
            >
              REDEPLOY
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
