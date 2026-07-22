'use client';

import React, { useEffect, useRef, useState } from 'react';

export default function UltraRacer2() {
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

    let playerLane = 1; // 0: left, 1: center, 2: right
    const laneX = [180, 300, 420];

    const player = {
      x: laneX[1],
      y: canvas.height - 70,
      targetX: laneX[1],
      width: 36,
      height: 60,
    };

    const traffic: { x: number; y: number; lane: number; speed: number; color: string }[] = [];
    const nitros: { x: number; y: number; lane: number }[] = [];

    let speed = 7;
    let spawnTimer = 0;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' || e.key === 'a') {
        playerLane = Math.max(0, playerLane - 1);
      }
      if (e.key === 'ArrowRight' || e.key === 'd') {
        playerLane = Math.min(2, playerLane + 1);
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    const update = () => {
      currentScore += Math.floor(speed / 2);
      setScore(currentScore);

      player.targetX = laneX[playerLane];
      player.x += (player.targetX - player.x) * 0.3;

      spawnTimer++;
      if (spawnTimer % 35 === 0) {
        const lane = Math.floor(Math.random() * 3);
        traffic.push({
          x: laneX[lane],
          y: -70,
          lane,
          speed: Math.random() * 2 + 3,
          color: ['#ef4444', '#f59e0b', '#8b5cf6'][Math.floor(Math.random() * 3)],
        });

        if (Math.random() < 0.4) {
          const nLane = (lane + 1 + Math.floor(Math.random() * 2)) % 3;
          nitros.push({
            x: laneX[nLane],
            y: -40,
            lane: nLane,
          });
        }
      }

      // Update traffic
      for (let i = traffic.length - 1; i >= 0; i--) {
        const tr = traffic[i];
        tr.y += speed - tr.speed;

        // Player Collision
        if (Math.abs(tr.x - player.x) < 30 && Math.abs(tr.y - player.y) < 50) {
          setGameState('gameover');
          window.dispatchEvent(new CustomEvent('xakteir-game-score', { detail: { score: currentScore } }));
          return;
        }

        if (tr.y > canvas.height + 70) traffic.splice(i, 1);
      }

      // Update Nitros
      for (let i = nitros.length - 1; i >= 0; i--) {
        const n = nitros[i];
        n.y += speed;

        if (Math.abs(n.x - player.x) < 30 && Math.abs(n.y - player.y) < 40) {
          currentScore += 250;
          setScore(currentScore);
          speed = Math.min(15, speed + 0.3);
          nitros.splice(i, 1);
          continue;
        }

        if (n.y > canvas.height + 40) nitros.splice(i, 1);
      }
    };

    const draw = () => {
      ctx.fillStyle = '#09090b';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Highway road
      ctx.fillStyle = '#18181b';
      ctx.fillRect(120, 0, 360, canvas.height);

      // Road markings / lane dividers
      ctx.strokeStyle = '#e4e4e7';
      ctx.setLineDash([20, 20]);
      ctx.lineWidth = 3;

      // Lane 1 divider
      ctx.beginPath();
      ctx.moveTo(240, (Date.now() * 0.3) % 40 - 40);
      ctx.lineTo(240, canvas.height);
      ctx.stroke();

      // Lane 2 divider
      ctx.beginPath();
      ctx.moveTo(360, (Date.now() * 0.3) % 40 - 40);
      ctx.lineTo(360, canvas.height);
      ctx.stroke();

      ctx.setLineDash([]);

      // Nitros
      nitros.forEach((n) => {
        ctx.fillStyle = '#06b6d4';
        ctx.beginPath();
        ctx.arc(n.x, n.y, 10, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.stroke();
      });

      // Traffic cars
      traffic.forEach((tr) => {
        ctx.fillStyle = tr.color;
        ctx.fillRect(tr.x - 18, tr.y - 30, 36, 60);

        // Windshield
        ctx.fillStyle = '#000000';
        ctx.fillRect(tr.x - 14, tr.y - 10, 28, 12);
      });

      // Player Car
      ctx.fillStyle = '#22c55e';
      ctx.fillRect(player.x - 18, player.y - 30, 36, 60);

      // Player Windshield
      ctx.fillStyle = '#000000';
      ctx.fillRect(player.x - 14, player.y - 15, 28, 14);

      // Headlights
      ctx.fillStyle = '#fef08a';
      ctx.fillRect(player.x - 16, player.y - 30, 8, 4);
      ctx.fillRect(player.x + 8, player.y - 30, 8, 4);
    };

    const loop = () => {
      update();
      draw();
      animId = requestAnimationFrame(loop);
    };

    loop();

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      cancelAnimationFrame(animId);
    };
  }, [gameState]);

  const startGame = () => {
    setScore(0);
    setGameState('playing');
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[500px] bg-zinc-950 text-white p-4 rounded-xl shadow-2xl border border-zinc-800">
      <h1 className="text-3xl font-extrabold mb-2 text-cyan-400 tracking-wider">ULTRA RACER 2</h1>
      <p className="text-xs text-zinc-400 mb-4">Use Left / Right arrow keys or A/D to switch lanes, dodge traffic & grab nitro boost!</p>
      <div className="relative border-2 border-cyan-500/40 rounded-lg overflow-hidden">
        <canvas ref={canvasRef} width={600} height={400} className="block bg-zinc-950" />

        {gameState === 'start' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-zinc-950/90">
            <p className="text-xl font-bold text-cyan-400 mb-4">Extreme High-Speed Highway Racing!</p>
            <button
              onClick={startGame}
              className="px-6 py-3 bg-cyan-500 hover:bg-cyan-600 font-bold rounded-lg transition transform hover:scale-105"
            >
              Start Game
            </button>
          </div>
        )}

        {gameState === 'gameover' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-zinc-950/90">
            <h2 className="text-3xl font-bold text-red-500 mb-2">TOTALED!</h2>
            <p className="text-lg text-zinc-300 mb-4">Distance Score: {score}</p>
            <button
              onClick={startGame}
              className="px-6 py-3 bg-cyan-500 hover:bg-cyan-600 font-bold rounded-lg transition transform hover:scale-105"
            >
              Play Again
            </button>
          </div>
        )}
      </div>
      <div className="mt-4 font-mono text-lg text-cyan-400">Score: {score}</div>
    </div>
  );
}
