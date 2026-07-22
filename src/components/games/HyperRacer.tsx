'use client';

import React, { useEffect, useRef, useState } from 'react';

export default function HyperRacer() {
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
    let laneWidth = canvas.width / 3;
    let playerLane = 1; // 0, 1, 2

    let traffic: { lane: number; y: number; speed: number; color: string }[] = [];
    let coins: { lane: number; y: number }[] = [];
    let timer = 0;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (gameStateRef.current !== 'playing') return;
      if (e.code === 'ArrowLeft' || e.code === 'KeyA') {
        playerLane = Math.max(0, playerLane - 1);
      }
      if (e.code === 'ArrowRight' || e.code === 'KeyD') {
        playerLane = Math.min(2, playerLane + 1);
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    const gameLoop = () => {
      if (gameStateRef.current === 'playing') {
        ctx.fillStyle = '#09090b';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Draw Lane dividers
        ctx.strokeStyle = '#3f3f46';
        ctx.setLineDash([20, 15]);
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(laneWidth, 0); ctx.lineTo(laneWidth, canvas.height);
        ctx.moveTo(laneWidth * 2, 0); ctx.lineTo(laneWidth * 2, canvas.height);
        ctx.stroke();
        ctx.setLineDash([]);

        // Score tick
        currentScore += 1;
        setScore(Math.floor(currentScore / 5));

        // Draw Player Car
        const playerX = playerLane * laneWidth + laneWidth / 2 - 20;
        const playerY = canvas.height - 80;

        ctx.fillStyle = '#3b82f6';
        ctx.shadowColor = '#3b82f6';
        ctx.shadowBlur = 12;
        ctx.fillRect(playerX, playerY, 40, 60);

        // Spawn Traffic & Coins
        timer++;
        if (timer > Math.max(25, 60 - Math.floor(currentScore / 200))) {
          timer = 0;
          const lane = Math.floor(Math.random() * 3);
          traffic.push({
            lane,
            y: -70,
            speed: 4 + Math.random() * 3 + currentScore / 500,
            color: '#ef4444',
          });

          if (Math.random() > 0.4) {
            const coinLane = (lane + 1 + Math.floor(Math.random() * 2)) % 3;
            coins.push({ lane: coinLane, y: -40 });
          }
        }

        // Update & Draw Coins
        for (let i = coins.length - 1; i >= 0; i--) {
          const coin = coins[i];
          coin.y += 5;
          const cx = coin.lane * laneWidth + laneWidth / 2;

          ctx.fillStyle = '#eab308';
          ctx.shadowColor = '#eab308';
          ctx.shadowBlur = 10;
          ctx.beginPath();
          ctx.arc(cx, coin.y, 10, 0, Math.PI * 2);
          ctx.fill();

          // Collect coin
          if (coin.lane === playerLane && Math.abs(coin.y - (playerY + 30)) < 35) {
            coins.splice(i, 1);
            currentScore += 100;
          } else if (coin.y > canvas.height) {
            coins.splice(i, 1);
          }
        }

        // Update & Draw Traffic
        for (let i = traffic.length - 1; i >= 0; i--) {
          const t = traffic[i];
          t.y += t.speed;
          const tx = t.lane * laneWidth + laneWidth / 2 - 20;

          ctx.fillStyle = t.color;
          ctx.shadowColor = t.color;
          ctx.shadowBlur = 10;
          ctx.fillRect(tx, t.y, 40, 60);

          // Collision Check
          if (t.lane === playerLane && Math.abs(t.y - playerY) < 50) {
            const finalScore = Math.floor(currentScore / 5);
            setGameState('gameover');
            window.dispatchEvent(
              new CustomEvent('xakteir-game-score', { detail: { score: finalScore } })
            );
            return;
          }

          if (t.y > canvas.height) traffic.splice(i, 1);
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
      <div className="flex justify-between w-full max-w-[450px] mb-2 items-center">
        <h2 className="text-xl font-bold tracking-wider text-orange-500">HYPER RACER</h2>
        <div className="text-lg font-mono">Score: <span className="text-yellow-400">{score}</span></div>
      </div>

      <div className="relative border-2 border-zinc-800 rounded-lg overflow-hidden">
        <canvas ref={canvasRef} width={450} height={400} className="bg-zinc-950 block" />

        {gameState === 'start' && (
          <div className="absolute inset-0 bg-black/85 flex flex-col items-center justify-center p-4">
            <h1 className="text-3xl font-extrabold mb-2 text-orange-500">HYPER RACER</h1>
            <p className="text-zinc-400 mb-6 text-center">Use LEFT / RIGHT arrow keys or A/D to switch lanes and avoid traffic!</p>
            <button
              onClick={startGame}
              className="px-6 py-2 bg-orange-600 hover:bg-orange-500 font-bold rounded-lg transition"
            >
              START RACE
            </button>
          </div>
        )}

        {gameState === 'gameover' && (
          <div className="absolute inset-0 bg-black/90 flex flex-col items-center justify-center p-4">
            <h2 className="text-3xl font-bold text-red-500 mb-2">CRASHED!</h2>
            <p className="text-xl text-zinc-300 mb-6">Final Score: {score}</p>
            <button
              onClick={startGame}
              className="px-6 py-2 bg-orange-600 hover:bg-orange-500 font-bold rounded-lg transition"
            >
              RACE AGAIN
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
