'use client';

import React, { useEffect, useRef, useState } from 'react';

export default function LunarDefender() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [gameState, setGameState] = useState<'start' | 'playing' | 'gameover'>('start');
  const [score, setScore] = useState(0);
  const [shields, setShields] = useState(100);

  const gameStateRef = useRef(gameState);
  gameStateRef.current = gameState;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let currentScore = 0;
    let currentShields = 100;

    let meteors: { id: number; x: number; y: number; speed: number; radius: number }[] = [];
    let lasers: { x1: number; y1: number; x2: number; y2: number; timer: number }[] = [];
    let meteorTimer = 0;

    const handlePointerDown = (e: PointerEvent) => {
      if (gameStateRef.current !== 'playing') return;
      const rect = canvas.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const clickY = e.clientY - rect.top;

      // Fire laser from center lunar turret
      lasers.push({
        x1: canvas.width / 2,
        y1: canvas.height - 30,
        x2: clickX,
        y2: clickY,
        timer: 8,
      });

      // Check hit
      for (let i = meteors.length - 1; i >= 0; i--) {
        const m = meteors[i];
        const dist = Math.hypot(m.x - clickX, m.y - clickY);
        if (dist < m.radius + 15) {
          meteors.splice(i, 1);
          currentScore += 20;
          setScore(currentScore);
        }
      }
    };

    canvas.addEventListener('pointerdown', handlePointerDown);

    const gameLoop = () => {
      if (gameStateRef.current === 'playing') {
        ctx.fillStyle = '#09090b';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Draw Lunar Surface
        ctx.fillStyle = '#27272a';
        ctx.fillRect(0, canvas.height - 40, canvas.width, 40);

        // Draw Turret
        ctx.fillStyle = '#0ea5e9';
        ctx.shadowColor = '#0ea5e9';
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.arc(canvas.width / 2, canvas.height - 35, 20, Math.PI, 0);
        ctx.fill();

        // Draw Lasers
        for (let i = lasers.length - 1; i >= 0; i--) {
          const l = lasers[i];
          ctx.strokeStyle = '#06b6d4';
          ctx.shadowColor = '#06b6d4';
          ctx.shadowBlur = 15;
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.moveTo(l.x1, l.y1);
          ctx.lineTo(l.x2, l.y2);
          ctx.stroke();

          l.timer--;
          if (l.timer <= 0) lasers.splice(i, 1);
        }

        // Spawn Meteors
        meteorTimer++;
        if (meteorTimer > Math.max(20, 50 - Math.floor(currentScore / 60))) {
          meteorTimer = 0;
          meteors.push({
            id: Math.random(),
            x: 20 + Math.random() * (canvas.width - 40),
            y: -20,
            speed: 1.2 + Math.random() * 1.8 + currentScore / 300,
            radius: 12 + Math.random() * 8,
          });
        }

        // Update & Draw Meteors
        for (let i = meteors.length - 1; i >= 0; i--) {
          const m = meteors[i];
          m.y += m.speed;

          ctx.fillStyle = '#f97316';
          ctx.shadowColor = '#f97316';
          ctx.shadowBlur = 12;
          ctx.beginPath();
          ctx.arc(m.x, m.y, m.radius, 0, Math.PI * 2);
          ctx.fill();

          // Impact lunar base
          if (m.y >= canvas.height - 40) {
            meteors.splice(i, 1);
            currentShields -= 20;
            setShields(Math.max(0, currentShields));

            if (currentShields <= 0) {
              setGameState('gameover');
              window.dispatchEvent(
                new CustomEvent('xakteir-game-score', { detail: { score: currentScore } })
              );
              return;
            }
          }
        }
      }
      animId = requestAnimationFrame(gameLoop);
    };

    animId = requestAnimationFrame(gameLoop);

    return () => {
      cancelAnimationFrame(animId);
      canvas.removeEventListener('pointerdown', handlePointerDown);
    };
  }, []);

  const startGame = () => {
    setScore(0);
    setShields(100);
    setGameState('playing');
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[450px] bg-zinc-950 text-white p-4 rounded-xl border border-zinc-800">
      <div className="flex justify-between w-full max-w-[600px] mb-2 items-center">
        <h2 className="text-xl font-bold tracking-wider text-cyan-400">LUNAR DEFENDER</h2>
        <div className="flex gap-4 font-mono text-sm">
          <div>Shield: <span className="text-cyan-400 font-bold">{shields}%</span></div>
          <div>Score: <span className="text-yellow-400 font-bold">{score}</span></div>
        </div>
      </div>

      <div className="relative border-2 border-zinc-800 rounded-lg overflow-hidden">
        <canvas ref={canvasRef} width={600} height={350} className="bg-zinc-950 block cursor-crosshair" />

        {gameState === 'start' && (
          <div className="absolute inset-0 bg-black/85 flex flex-col items-center justify-center p-4">
            <h1 className="text-3xl font-extrabold mb-2 text-cyan-400">LUNAR DEFENDER</h1>
            <p className="text-zinc-400 mb-6 text-center">Click/Tap incoming meteors to blast them before they impact the lunar base!</p>
            <button
              onClick={startGame}
              className="px-6 py-2 bg-cyan-600 hover:bg-cyan-500 font-bold rounded-lg transition"
            >
              INITIALIZE DEFENSES
            </button>
          </div>
        )}

        {gameState === 'gameover' && (
          <div className="absolute inset-0 bg-black/90 flex flex-col items-center justify-center p-4">
            <h2 className="text-3xl font-bold text-red-500 mb-2">BASE DESTROYED</h2>
            <p className="text-xl text-zinc-300 mb-6">Final Score: {score}</p>
            <button
              onClick={startGame}
              className="px-6 py-2 bg-cyan-600 hover:bg-cyan-500 font-bold rounded-lg transition"
            >
              REBUILD BASE
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
