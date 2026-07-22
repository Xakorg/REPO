'use client';

import React, { useState, useEffect, useRef } from 'react';

interface Car {
  x: number;
  y: number;
  speed: number;
  color: string;
}

interface Fuel {
  x: number;
  y: number;
}

export default function RetroRacer() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [gameState, setGameState] = useState<'start' | 'playing' | 'gameover'>('start');
  const [score, setScore] = useState(0);

  const playerXRef = useRef(270);
  const keysRef = useRef<{ [key: string]: boolean }>({});
  const enemiesRef = useRef<Car[]>([]);
  const fuelsRef = useRef<Fuel[]>([]);

  const gameStateRef = useRef(gameState);
  gameStateRef.current = gameState;
  const scoreRef = useRef(score);
  scoreRef.current = score;

  const gameOverHandled = useRef(false);

  const handleGameOver = (finalScore: number) => {
    if (gameOverHandled.current) return;
    gameOverHandled.current = true;
    setGameState('gameover');
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('xakteir-game-score', { detail: { score: finalScore } }));
    }
  };

  const moveLeft = () => {
    playerXRef.current = Math.max(120, playerXRef.current - 40);
  };

  const moveRight = () => {
    playerXRef.current = Math.min(420, playerXRef.current + 40);
  };

  const startGame = () => {
    setScore(0);
    scoreRef.current = 0;
    playerXRef.current = 270;
    enemiesRef.current = [];
    fuelsRef.current = [];
    gameOverHandled.current = false;
    setGameState('playing');
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      keysRef.current[e.key.toLowerCase()] = true;
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      keysRef.current[e.key.toLowerCase()] = false;
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  useEffect(() => {
    if (gameState !== 'playing') return;

    let animId: number;
    let spawnTimer: NodeJS.Timeout;
    let roadOffsetY = 0;

    const spawnTraffic = () => {
      if (gameStateRef.current !== 'playing') return;

      const lanes = [140, 230, 320, 410];
      const lane = lanes[Math.floor(Math.random() * lanes.length)];

      if (Math.random() < 0.7) {
        enemiesRef.current.push({
          x: lane,
          y: -60,
          speed: 3 + Math.random() * 2 + Math.min(scoreRef.current / 100, 4),
          color: '#ef4444',
        });
      } else {
        fuelsRef.current.push({
          x: lane + 10,
          y: -40,
        });
      }

      spawnTimer = setTimeout(spawnTraffic, Math.max(400, 1200 - scoreRef.current * 5));
    };

    spawnTraffic();

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const update = () => {
      if (!ctx || gameStateRef.current !== 'playing') return;

      // Handle continuous keyboard movement
      if (keysRef.current['a'] || keysRef.current['arrowleft']) {
        playerXRef.current = Math.max(110, playerXRef.current - 5);
      }
      if (keysRef.current['d'] || keysRef.current['arrowright']) {
        playerXRef.current = Math.min(430, playerXRef.current + 5);
      }

      // Draw background grass
      ctx.fillStyle = '#15803d';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw road
      ctx.fillStyle = '#27272a';
      ctx.fillRect(100, 0, 400, canvas.height);

      // Road borders
      ctx.fillStyle = '#ef4444';
      ctx.fillRect(90, 0, 10, canvas.height);
      ctx.fillRect(500, 0, 10, canvas.height);

      // Moving road lines
      roadOffsetY = (roadOffsetY + 6) % 40;
      ctx.strokeStyle = '#fef08a';
      ctx.lineWidth = 4;
      ctx.setLineDash([20, 20]);
      ctx.lineDashOffset = -roadOffsetY;

      ctx.beginPath();
      ctx.moveTo(233, 0);
      ctx.lineTo(233, canvas.height);
      ctx.moveTo(366, 0);
      ctx.lineTo(366, canvas.height);
      ctx.stroke();
      ctx.setLineDash([]);

      // Update & draw fuel pickups
      for (let i = fuelsRef.current.length - 1; i >= 0; i--) {
        const fuel = fuelsRef.current[i];
        fuel.y += 4;

        ctx.beginPath();
        ctx.arc(fuel.x + 15, fuel.y + 15, 12, 0, Math.PI * 2);
        ctx.fillStyle = '#22c55e';
        ctx.shadowBlur = 10;
        ctx.shadowColor = '#22c55e';
        ctx.fill();
        ctx.shadowBlur = 0;

        // Collect fuel
        if (Math.hypot(playerXRef.current + 20 - (fuel.x + 15), 320 + 30 - (fuel.y + 15)) < 30) {
          fuelsRef.current.splice(i, 1);
          const newScore = scoreRef.current + 30;
          setScore(newScore);
          scoreRef.current = newScore;
        } else if (fuel.y > canvas.height + 40) {
          fuelsRef.current.splice(i, 1);
        }
      }

      // Update & draw traffic cars
      for (let i = enemiesRef.current.length - 1; i >= 0; i--) {
        const car = enemiesRef.current[i];
        car.y += car.speed;

        // Draw opponent car
        ctx.fillStyle = car.color;
        ctx.fillRect(car.x, car.y, 40, 60);
        ctx.fillStyle = '#000';
        ctx.fillRect(car.x + 5, car.y + 10, 30, 15); // windshield

        // Collision check
        const pBox = { x: playerXRef.current, y: 320, w: 40, h: 60 };
        const eBox = { x: car.x, y: car.y, w: 40, h: 60 };

        if (
          pBox.x < eBox.x + eBox.w &&
          pBox.x + pBox.w > eBox.x &&
          pBox.y < eBox.y + eBox.h &&
          pBox.y + pBox.h > eBox.y
        ) {
          handleGameOver(scoreRef.current);
          return;
        }

        if (car.y > canvas.height + 70) {
          enemiesRef.current.splice(i, 1);
          const newScore = scoreRef.current + 10;
          setScore(newScore);
          scoreRef.current = newScore;
        }
      }

      // Draw Player Car
      ctx.fillStyle = '#3b82f6';
      ctx.fillRect(playerXRef.current, 320, 40, 60);
      ctx.fillStyle = '#93c5fd';
      ctx.fillRect(playerXRef.current + 5, 335, 30, 15); // windshield
      // Headlights glow
      ctx.fillStyle = '#fef08a';
      ctx.fillRect(playerXRef.current + 4, 320, 8, 4);
      ctx.fillRect(playerXRef.current + 28, 320, 8, 4);

      animId = requestAnimationFrame(update);
    };

    animId = requestAnimationFrame(update);

    return () => {
      cancelAnimationFrame(animId);
      clearTimeout(spawnTimer);
    };
  }, [gameState]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[500px] bg-zinc-950 text-white p-4 rounded-xl">
      <h1 className="text-3xl font-black text-blue-400 mb-2 tracking-wider">RETRO RACER</h1>

      {gameState === 'playing' && (
        <div className="text-xl font-bold text-blue-400 mb-2">Score: {score}</div>
      )}

      <div className="relative border-2 border-blue-500/30 rounded-lg overflow-hidden bg-zinc-900">
        <canvas ref={canvasRef} width={600} height={400} className="max-w-full" />

        {gameState === 'start' && (
          <div className="absolute inset-0 bg-zinc-950/90 flex flex-col items-center justify-center p-6 text-center">
            <p className="text-zinc-300 mb-6 max-w-md">
              Steer your vehicle using Left/Right arrows or A/D keys. Avoid opponent traffic and collect green turbo canisters!
            </p>
            <button
              onClick={startGame}
              className="px-6 py-3 bg-blue-500 hover:bg-blue-400 text-zinc-950 font-black rounded-lg text-lg transition transform active:scale-95"
            >
              START RACE
            </button>
          </div>
        )}

        {gameState === 'gameover' && (
          <div className="absolute inset-0 bg-zinc-950/90 flex flex-col items-center justify-center p-6 text-center">
            <h2 className="text-4xl font-extrabold text-red-500 mb-2">CRASH!</h2>
            <p className="text-2xl text-blue-400 font-bold mb-6">Final Score: {score}</p>
            <button
              onClick={startGame}
              className="px-6 py-3 bg-blue-500 hover:bg-blue-400 text-zinc-950 font-black rounded-lg text-lg transition transform active:scale-95"
            >
              RETRY
            </button>
          </div>
        )}
      </div>

      {gameState === 'playing' && (
        <div className="flex gap-4 mt-4">
          <button
            onClick={moveLeft}
            className="px-8 py-3 bg-zinc-800 hover:bg-zinc-700 font-black rounded-lg border border-blue-500/40 text-blue-300 text-lg transition active:scale-95"
          >
            ◀ LEFT
          </button>
          <button
            onClick={moveRight}
            className="px-8 py-3 bg-zinc-800 hover:bg-zinc-700 font-black rounded-lg border border-blue-500/40 text-blue-300 text-lg transition active:scale-95"
          >
            RIGHT ▶
          </button>
        </div>
      )}
    </div>
  );
}
