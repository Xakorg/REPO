'use client';

import React, { useEffect, useRef, useState } from 'react';

export default function VoidDash() {
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
    let shipX = canvas.width / 2;
    let shipY = canvas.height - 60;
    const shipRadius = 15;
    let speed = 4;

    const keys: Record<string, boolean> = {};

    interface Obstacle {
      x: number;
      y: number;
      radius: number;
      speed: number;
    }
    interface Orb {
      x: number;
      y: number;
      radius: number;
    }

    let obstacles: Obstacle[] = [];
    let orbs: Orb[] = [];
    let frameCount = 0;

    const handleKeyDown = (e: KeyboardEvent) => {
      keys[e.key] = true;
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      keys[e.key] = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    const gameLoop = () => {
      frameCount++;

      // Controls
      if ((keys['ArrowLeft'] || keys['a'] || keys['A']) && shipX > shipRadius) {
        shipX -= 6;
      }
      if ((keys['ArrowRight'] || keys['d'] || keys['D']) && shipX < canvas.width - shipRadius) {
        shipX += 6;
      }
      if ((keys['ArrowUp'] || keys['w'] || keys['W']) && shipY > shipRadius) {
        shipY -= 5;
      }
      if ((keys['ArrowDown'] || keys['s'] || keys['S']) && shipY < canvas.height - shipRadius) {
        shipY += 5;
      }

      // Increase speed slightly
      if (frameCount % 300 === 0) {
        speed += 0.5;
      }

      // Spawn Obstacles
      if (frameCount % Math.max(15, Math.floor(40 - speed * 2)) === 0) {
        obstacles.push({
          x: Math.random() * (canvas.width - 40) + 20,
          y: -20,
          radius: Math.random() * 15 + 10,
          speed: speed + Math.random() * 2,
        });
      }

      // Spawn Orbs
      if (frameCount % 60 === 0) {
        orbs.push({
          x: Math.random() * (canvas.width - 30) + 15,
          y: -10,
          radius: 8,
        });
      }

      // Update Obstacles
      for (let i = obstacles.length - 1; i >= 0; i--) {
        const obs = obstacles[i];
        obs.y += obs.speed;

        // Collision check
        const dist = Math.hypot(shipX - obs.x, shipY - obs.y);
        if (dist < shipRadius + obs.radius) {
          const finalScore = scoreRef.current;
          window.dispatchEvent(new CustomEvent('xakteir-game-score', { detail: { score: finalScore } }));
          setGameState('GAMEOVER');
          return;
        }

        if (obs.y > canvas.height + 30) {
          obstacles.splice(i, 1);
          setScore((s) => s + 5);
        }
      }

      // Update Orbs
      for (let i = orbs.length - 1; i >= 0; i--) {
        const orb = orbs[i];
        orb.y += speed;

        const dist = Math.hypot(shipX - orb.x, shipY - orb.y);
        if (dist < shipRadius + orb.radius) {
          orbs.splice(i, 1);
          setScore((s) => s + 50);
          continue;
        }

        if (orb.y > canvas.height + 20) {
          orbs.splice(i, 1);
        }
      }

      // Render
      ctx.fillStyle = '#050510';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Starfield background effect
      ctx.fillStyle = '#ffffff33';
      for (let i = 0; i < 20; i++) {
        const sx = (Math.sin(i * 99 + frameCount * 0.05) * 0.5 + 0.5) * canvas.width;
        const sy = ((i * 30 + frameCount * (speed * 0.5)) % canvas.height);
        ctx.fillRect(sx, sy, 2, 2);
      }

      // Draw Ship
      ctx.fillStyle = '#a855f7';
      ctx.beginPath();
      ctx.moveTo(shipX, shipY - shipRadius);
      ctx.lineTo(shipX - shipRadius, shipY + shipRadius);
      ctx.lineTo(shipX, shipY + shipRadius / 2);
      ctx.lineTo(shipX + shipRadius, shipY + shipRadius);
      ctx.closePath();
      ctx.fill();

      // Ship thruster flame
      ctx.fillStyle = '#ec4899';
      ctx.beginPath();
      ctx.moveTo(shipX - 6, shipY + shipRadius);
      ctx.lineTo(shipX, shipY + shipRadius + 12 + Math.random() * 6);
      ctx.lineTo(shipX + 6, shipY + shipRadius);
      ctx.closePath();
      ctx.fill();

      // Draw Obstacles (Void Orbs)
      obstacles.forEach((obs) => {
        ctx.fillStyle = '#7e22ce';
        ctx.beginPath();
        ctx.arc(obs.x, obs.y, obs.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#c084fc';
        ctx.lineWidth = 2;
        ctx.stroke();
      });

      // Draw Plasma Orbs
      orbs.forEach((orb) => {
        ctx.fillStyle = '#38bdf8';
        ctx.beginPath();
        ctx.arc(orb.x, orb.y, orb.radius, 0, Math.PI * 2);
        ctx.fill();
      });

      animId = requestAnimationFrame(gameLoop);
    };

    animId = requestAnimationFrame(gameLoop);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [gameState]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[500px] bg-zinc-950 text-white rounded-xl p-4">
      <div className="flex justify-between items-center w-full max-w-[600px] mb-4">
        <h2 className="text-xl font-bold text-purple-400">Void Dash</h2>
        <div className="text-lg font-semibold text-purple-300">Score: {score}</div>
      </div>

      <div className="relative border border-purple-900/50 rounded-lg overflow-hidden">
        <canvas ref={canvasRef} width={600} height={400} className="bg-zinc-950 block" />

        {gameState === 'START' && (
          <div className="absolute inset-0 bg-zinc-950/90 flex flex-col items-center justify-center p-6 text-center">
            <h3 className="text-3xl font-extrabold text-purple-400 mb-2">VOID DASH</h3>
            <p className="text-zinc-400 mb-6 max-w-sm">Use Arrow keys / WASD to navigate through the void. Avoid purple anomalies and grab blue plasma energy!</p>
            <button
              onClick={startGame}
              className="px-6 py-3 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-lg transition"
            >
              Start Dash
            </button>
          </div>
        )}

        {gameState === 'GAMEOVER' && (
          <div className="absolute inset-0 bg-zinc-950/90 flex flex-col items-center justify-center p-6 text-center">
            <h3 className="text-3xl font-extrabold text-red-500 mb-2">CONSUMED BY VOID</h3>
            <p className="text-zinc-300 text-lg mb-4">Final Score: <span className="text-purple-400 font-bold">{score}</span></p>
            <button
              onClick={startGame}
              className="px-6 py-3 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-lg transition"
            >
              Try Again
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
