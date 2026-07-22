'use client';

import React, { useEffect, useRef, useState } from 'react';

export default function CrazyNinja2() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [gameState, setGameState] = useState<'start' | 'playing' | 'gameover'>('start');
  const [score, setScore] = useState(0);

  useEffect(() => {
    if (gameState !== 'playing') return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let currentScore = 0;

    const ninja = {
      x: 100,
      y: 200,
      vy: 0,
      width: 20,
      height: 35,
      isGrounded: false,
      jumps: 0,
    };

    let buildings = [
      { x: 0, width: 250, height: 150 },
      { x: 300, width: 220, height: 180 },
      { x: 570, width: 280, height: 140 },
    ];

    let obstacles: { x: number; y: number; radius: number }[] = [];
    let speed = 4;
    let distanceTimer = 0;

    const handleJump = () => {
      if (ninja.jumps < 2) {
        ninja.vy = -11;
        ninja.jumps++;
        ninja.isGrounded = false;
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === ' ' || e.key === 'ArrowUp' || e.key === 'w') {
        handleJump();
      }
    };

    const handleClick = () => {
      handleJump();
    };

    window.addEventListener('keydown', handleKeyDown);
    canvas.addEventListener('click', handleClick);

    const update = () => {
      distanceTimer++;
      if (distanceTimer % 5 === 0) {
        currentScore += 10;
        setScore(currentScore);
      }

      speed = 4 + Math.min(6, currentScore * 0.0005);

      // Ninja gravity & movement
      ninja.vy += 0.6; // Gravity
      ninja.y += ninja.vy;

      // Update buildings
      buildings.forEach((b) => {
        b.x -= speed;
      });

      // Spawn new building
      const lastB = buildings[buildings.length - 1];
      if (lastB.x + lastB.width < canvas.width + 100) {
        const width = Math.floor(Math.random() * 150 + 150);
        const height = Math.floor(Math.random() * 100 + 120);
        const gap = Math.floor(Math.random() * 80 + 70);
        buildings.push({
          x: lastB.x + lastB.width + gap,
          width,
          height,
        });

        // Chance to spawn obstacle on roof
        if (Math.random() < 0.6) {
          obstacles.push({
            x: lastB.x + lastB.width + gap + width / 2,
            y: canvas.height - height - 15,
            radius: 12,
          });
        }
      }

      // Remove offscreen buildings
      if (buildings[0].x + buildings[0].width < -100) {
        buildings.shift();
      }

      // Check ground / building landing
      ninja.isGrounded = false;
      buildings.forEach((b) => {
        const buildingTop = canvas.height - b.height;
        if (
          ninja.x + ninja.width > b.x &&
          ninja.x < b.x + b.width &&
          ninja.y + ninja.height >= buildingTop &&
          ninja.y + ninja.height <= buildingTop + 15 &&
          ninja.vy >= 0
        ) {
          ninja.y = buildingTop - ninja.height;
          ninja.vy = 0;
          ninja.isGrounded = true;
          ninja.jumps = 0;
        }
      });

      // Obstacles update & collision
      for (let i = obstacles.length - 1; i >= 0; i--) {
        const obs = obstacles[i];
        obs.x -= speed;

        // Collision with ninja
        const dist = Math.hypot(obs.x - (ninja.x + ninja.width / 2), obs.y - (ninja.y + ninja.height / 2));
        if (dist < obs.radius + 10) {
          setGameState('gameover');
          window.dispatchEvent(new CustomEvent('xakteir-game-score', { detail: { score: currentScore } }));
          return;
        }

        if (obs.x < -20) obstacles.splice(i, 1);
      }

      // Fell into gap
      if (ninja.y > canvas.height + 50) {
        setGameState('gameover');
        window.dispatchEvent(new CustomEvent('xakteir-game-score', { detail: { score: currentScore } }));
        return;
      }
    };

    const draw = () => {
      ctx.fillStyle = '#09090b';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Moon in background
      ctx.fillStyle = '#fef08a22';
      ctx.beginPath();
      ctx.arc(500, 80, 45, 0, Math.PI * 2);
      ctx.fill();

      // Draw buildings
      ctx.fillStyle = '#18181b';
      ctx.strokeStyle = '#3f3f46';
      ctx.lineWidth = 2;
      buildings.forEach((b) => {
        const y = canvas.height - b.height;
        ctx.fillRect(b.x, y, b.width, b.height);
        ctx.strokeRect(b.x, y, b.width, b.height);

        // Roof line accent
        ctx.fillStyle = '#dc2626';
        ctx.fillRect(b.x, y, b.width, 4);
        ctx.fillStyle = '#18181b';
      });

      // Draw obstacles (shuriken / spike traps)
      ctx.fillStyle = '#ef4444';
      obstacles.forEach((obs) => {
        ctx.beginPath();
        ctx.arc(obs.x, obs.y, obs.radius, 0, Math.PI * 2);
        ctx.fill();
      });

      // Draw Ninja
      ctx.fillStyle = '#e11d48'; // Red headband scarf
      ctx.fillRect(ninja.x - 8, ninja.y + 4, 12, 4);

      ctx.fillStyle = '#27272a'; // Suit
      ctx.fillRect(ninja.x, ninja.y, ninja.width, ninja.height);

      // Eyes
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(ninja.x + 12, ninja.y + 6, 4, 4);
    };

    const loop = () => {
      update();
      draw();
      animId = requestAnimationFrame(loop);
    };

    loop();

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      canvas.removeEventListener('click', handleClick);
      cancelAnimationFrame(animId);
    };
  }, [gameState]);

  const startGame = () => {
    setScore(0);
    setGameState('playing');
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[500px] bg-zinc-950 text-white p-4 rounded-xl shadow-2xl border border-zinc-800">
      <h1 className="text-3xl font-extrabold mb-2 text-rose-500 tracking-wider">CRAZY NINJA 2</h1>
      <p className="text-xs text-zinc-400 mb-4">Click or Space to Jump / Double Jump across rooftops and dodge spikes!</p>
      <div className="relative border-2 border-rose-500/40 rounded-lg overflow-hidden">
        <canvas ref={canvasRef} width={600} height={400} className="block bg-zinc-950 cursor-pointer" />

        {gameState === 'start' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-zinc-950/90">
            <p className="text-xl font-bold text-rose-400 mb-4">Run, Jump & Slash on the Rooftops!</p>
            <button
              onClick={startGame}
              className="px-6 py-3 bg-rose-600 hover:bg-rose-700 font-bold rounded-lg transition transform hover:scale-105"
            >
              Start Game
            </button>
          </div>
        )}

        {gameState === 'gameover' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-zinc-950/90">
            <h2 className="text-3xl font-bold text-red-500 mb-2">RUN ENDED</h2>
            <p className="text-lg text-zinc-300 mb-4">Distance Score: {score}</p>
            <button
              onClick={startGame}
              className="px-6 py-3 bg-rose-600 hover:bg-rose-700 font-bold rounded-lg transition transform hover:scale-105"
            >
              Play Again
            </button>
          </div>
        )}
      </div>
      <div className="mt-4 font-mono text-lg text-rose-400">Score: {score}</div>
    </div>
  );
}
