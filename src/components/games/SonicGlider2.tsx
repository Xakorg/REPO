'use client';

import React, { useEffect, useRef, useState } from 'react';

interface Ring {
  x: number;
  y: number;
  radius: number;
  passed: boolean;
}

interface Obstacle {
  x: number;
  y: number;
}

export default function SonicGlider2() {
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
    let gliderY = 150;
    let gliderVy = 0;
    const gliderX = 120;

    let rings: Ring[] = [];
    let obstacles: Obstacle[] = [];
    let frameCount = 0;
    let distance = 0;

    const keys: Record<string, boolean> = {};

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
      distance += 1;
      setScore((s) => s + 1);

      // Controls
      if (keys['ArrowUp'] || keys['w'] || keys['W'] || keys[' ']) {
        gliderVy -= 0.5; // Catch updraft
      } else {
        gliderVy += 0.25; // Gravity
      }

      gliderVy = Math.max(-5, Math.min(5, gliderVy));
      gliderY += gliderVy;

      // Ground / Ceiling crash
      if (gliderY < 15 || gliderY > canvas.height - 20) {
        const finalScore = scoreRef.current;
        window.dispatchEvent(new CustomEvent('xakteir-game-score', { detail: { score: finalScore } }));
        setGameState('GAMEOVER');
        return;
      }

      // Spawn Rings
      if (frameCount % 70 === 0) {
        rings.push({
          x: canvas.width + 30,
          y: Math.random() * (canvas.height - 100) + 50,
          radius: 24,
          passed: false,
        });
      }

      // Spawn Obstacles (birds / clouds)
      if (frameCount % 110 === 0) {
        obstacles.push({
          x: canvas.width + 30,
          y: Math.random() * (canvas.height - 80) + 40,
        });
      }

      // Move & Collide Rings
      for (let i = rings.length - 1; i >= 0; i--) {
        const ring = rings[i];
        ring.x -= 4;

        // Check ring hit
        if (!ring.passed && Math.hypot(ring.x - gliderX, ring.y - gliderY) < ring.radius) {
          ring.passed = true;
          setScore((s) => s + 150);
          gliderVy = -3; // Boost lift
        }

        if (ring.x < -40) rings.splice(i, 1);
      }

      // Move & Collide Obstacles
      for (let i = obstacles.length - 1; i >= 0; i--) {
        const obs = obstacles[i];
        obs.x -= 4.5;

        if (Math.hypot(obs.x - gliderX, obs.y - gliderY) < 18) {
          const finalScore = scoreRef.current;
          window.dispatchEvent(new CustomEvent('xakteir-game-score', { detail: { score: finalScore } }));
          setGameState('GAMEOVER');
          return;
        }

        if (obs.x < -40) obstacles.splice(i, 1);
      }

      // Render
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Distant mountains
      ctx.fillStyle = '#1e293b';
      ctx.beginPath();
      ctx.moveTo(0, canvas.height);
      for (let x = 0; x <= canvas.width; x += 50) {
        const h = Math.sin((x + distance) * 0.01) * 40 + 80;
        ctx.lineTo(x, canvas.height - h);
      }
      ctx.lineTo(canvas.width, canvas.height);
      ctx.fill();

      // Draw Glider
      ctx.save();
      ctx.translate(gliderX, gliderY);
      ctx.rotate(gliderVy * 0.08);

      // Wing
      ctx.fillStyle = '#38bdf8';
      ctx.beginPath();
      ctx.ellipse(0, -5, 20, 6, 0, 0, Math.PI * 2);
      ctx.fill();

      // Pilot line
      ctx.strokeStyle = '#e2e8f0';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(-10, 0); ctx.lineTo(0, 10);
      ctx.moveTo(10, 0); ctx.lineTo(0, 10);
      ctx.stroke();

      ctx.restore();

      // Draw Golden Checkpoint Rings
      rings.forEach((ring) => {
        ctx.strokeStyle = ring.passed ? '#22c55e' : '#eab308';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(ring.x, ring.y, ring.radius, 0, Math.PI * 2);
        ctx.stroke();
      });

      // Draw Birds / Hazards
      obstacles.forEach((obs) => {
        ctx.fillStyle = '#ef4444';
        ctx.beginPath();
        ctx.arc(obs.x, obs.y, 10, 0, Math.PI * 2);
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
        <div>
          <h2 className="text-xl font-bold text-sky-400">Sonic Glider 2</h2>
          <p className="text-xs text-zinc-400">Press Up / Space to ride updrafts, fly through gold rings!</p>
        </div>
        <div className="text-lg font-semibold text-sky-300">Score: {score}</div>
      </div>

      <div className="relative border border-sky-900/50 rounded-lg overflow-hidden">
        <canvas ref={canvasRef} width={600} height={400} className="bg-zinc-950 block" />

        {gameState === 'START' && (
          <div className="absolute inset-0 bg-zinc-950/90 flex flex-col items-center justify-center p-6 text-center">
            <h3 className="text-3xl font-extrabold text-sky-400 mb-2">SONIC GLIDER 2</h3>
            <p className="text-zinc-400 mb-6 max-w-sm">Soar through the air! Fly through gold rings for boost and bonus points, avoid mountain walls and hazards.</p>
            <button
              onClick={startGame}
              className="px-6 py-3 bg-sky-600 hover:bg-sky-500 text-white font-bold rounded-lg transition"
            >
              Take Flight
            </button>
          </div>
        )}

        {gameState === 'GAMEOVER' && (
          <div className="absolute inset-0 bg-zinc-950/90 flex flex-col items-center justify-center p-6 text-center">
            <h3 className="text-3xl font-extrabold text-red-500 mb-2">GLIDER CRASHED</h3>
            <p className="text-zinc-300 text-lg mb-4">Final Score: <span className="text-sky-400 font-bold">{score}</span></p>
            <button
              onClick={startGame}
              className="px-6 py-3 bg-sky-600 hover:bg-sky-500 text-white font-bold rounded-lg transition"
            >
              Fly Again
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
