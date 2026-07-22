'use client';

import React, { useEffect, useRef, useState } from 'react';

const COLORS = ['#ef4444', '#3b82f6', '#10b981', '#f59e0b']; // Red, Blue, Green, Yellow

export default function CrazySpin() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [gameState, setGameState] = useState<'START' | 'PLAYING' | 'GAMEOVER'>('START');
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);

  const rotationRef = useRef(0); // in degrees (0, 90, 180, 270)

  const rotateLeft = () => {
    rotationRef.current = (rotationRef.current - 90 + 360) % 360;
  };

  const rotateRight = () => {
    rotationRef.current = (rotationRef.current + 90) % 360;
  };

  useEffect(() => {
    if (gameState !== 'PLAYING') return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let currentScore = 0;
    let currentLives = 3;
    let frame = 0;

    type Ball = {
      x: number;
      y: number;
      colorIndex: number;
      speed: number;
      angle: number;
      dist: number;
    };

    let balls: Ball[] = [];

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') rotateLeft();
      if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') rotateRight();
    };

    window.addEventListener('keydown', handleKeyDown);

    const center = { x: canvas.width / 2, y: canvas.height / 2, radius: 55 };

    const gameLoop = () => {
      frame++;

      ctx.fillStyle = '#09090b';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Spawn Ball towards center
      if (frame % Math.max(30, 80 - Math.floor(currentScore / 10)) === 0) {
        const colorIndex = Math.floor(Math.random() * 4);
        // Cardinal direction spawn (Top, Right, Bottom, Left)
        const dirIndex = Math.floor(Math.random() * 4);
        const spawnAngle = (dirIndex * 90 * Math.PI) / 180;
        const dist = 220;

        balls.push({
          x: center.x + Math.cos(spawnAngle) * dist,
          y: center.y + Math.sin(spawnAngle) * dist,
          colorIndex,
          speed: 2 + Math.random() * 0.8 + currentScore * 0.02,
          angle: spawnAngle,
          dist,
        });
      }

      // Draw Center Wheel
      ctx.save();
      ctx.translate(center.x, center.y);
      ctx.rotate((rotationRef.current * Math.PI) / 180);

      for (let i = 0; i < 4; i++) {
        ctx.fillStyle = COLORS[i];
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.arc(0, 0, center.radius, (i * 90 - 45) * Math.PI / 180, (i * 90 + 45) * Math.PI / 180);
        ctx.closePath();
        ctx.fill();
      }

      // Inner hub
      ctx.fillStyle = '#09090b';
      ctx.beginPath();
      ctx.arc(0, 0, 18, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // Process Balls
      for (let i = balls.length - 1; i >= 0; i--) {
        const b = balls[i];
        b.dist -= b.speed;
        b.x = center.x + Math.cos(b.angle) * b.dist;
        b.y = center.y + Math.sin(b.angle) * b.dist;

        // Draw Ball
        ctx.fillStyle = COLORS[b.colorIndex];
        ctx.beginPath();
        ctx.arc(b.x, b.y, 10, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Hit Wheel check
        if (b.dist <= center.radius + 5) {
          // Calculate which quadrant ball hit based on current wheel rotation
          // Ball angle normalized 0, 90, 180, 270 relative to center
          let ballDeg = (Math.round((b.angle * 180) / Math.PI) % 360 + 360) % 360;
          let wheelDeg = (rotationRef.current % 360 + 360) % 360;

          // Target wheel index facing that direction
          let targetQuadrant = Math.round((ballDeg - wheelDeg) / 90) % 4;
          targetQuadrant = (targetQuadrant + 4) % 4;

          if (targetQuadrant === b.colorIndex) {
            currentScore += 10;
            setScore(currentScore);
          } else {
            currentLives -= 1;
            setLives(currentLives);
            if (currentLives <= 0) {
              setGameState('GAMEOVER');
              window.dispatchEvent(new CustomEvent('xakteir-game-score', { detail: { score: currentScore } }));
              return;
            }
          }
          balls.splice(i, 1);
        }
      }

      animId = requestAnimationFrame(gameLoop);
    };

    animId = requestAnimationFrame(gameLoop);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [gameState]);

  const startGame = () => {
    setScore(0);
    setLives(3);
    rotationRef.current = 0;
    setGameState('PLAYING');
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[500px] bg-zinc-950 text-white rounded-xl p-4 shadow-2xl relative select-none">
      <h2 className="text-2xl font-bold tracking-wider mb-2 text-rose-400">CRAZY SPIN</h2>
      <div className="relative border-2 border-rose-500/30 rounded-lg overflow-hidden bg-zinc-900">
        <canvas ref={canvasRef} width={420} height={420} className="block" />

        {gameState === 'START' && (
          <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center p-6 text-center">
            <p className="text-zinc-300 mb-4 text-sm max-w-xs">Rotate the color wheel using Arrow Keys or Buttons to match incoming colored energy orbs!</p>
            <button
              onClick={startGame}
              className="px-6 py-2 bg-rose-500 hover:bg-rose-400 text-zinc-950 font-bold rounded-full transition transform hover:scale-105"
            >
              SPIN WHEEL
            </button>
          </div>
        )}

        {gameState === 'GAMEOVER' && (
          <div className="absolute inset-0 bg-black/85 flex flex-col items-center justify-center p-6 text-center">
            <h3 className="text-2xl font-extrabold text-red-500 mb-2">OUT OF LIVES</h3>
            <p className="text-lg text-zinc-300 mb-4">Final Score: <span className="text-rose-400 font-bold">{score}</span></p>
            <button
              onClick={startGame}
              className="px-6 py-2 bg-rose-500 hover:bg-rose-400 text-zinc-950 font-bold rounded-full transition transform hover:scale-105"
            >
              TRY AGAIN
            </button>
          </div>
        )}

        {gameState === 'PLAYING' && (
          <>
            <div className="absolute top-3 left-3 right-3 flex justify-between items-center">
              <div className="bg-zinc-900/80 border border-rose-500/30 px-3 py-1 rounded-md text-rose-400 text-sm font-bold">
                Score: {score}
              </div>
              <div className="flex gap-1">
                {Array.from({ length: 3 }).map((_, i) => (
                  <span key={i} className={`text-lg ${i < lives ? 'text-rose-500' : 'text-zinc-700'}`}>
                    ♥
                  </span>
                ))}
              </div>
            </div>

            <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-6 px-4">
              <button
                onClick={rotateLeft}
                className="px-5 py-2 bg-zinc-800 border border-zinc-600 hover:bg-zinc-700 font-bold rounded-lg text-sm transition"
              >
                ◀ ROTATE LEFT
              </button>
              <button
                onClick={rotateRight}
                className="px-5 py-2 bg-zinc-800 border border-zinc-600 hover:bg-zinc-700 font-bold rounded-lg text-sm transition"
              >
                ROTATE RIGHT ▶
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
