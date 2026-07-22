'use client';

import React, { useState, useEffect, useRef } from 'react';

const COLORS = ['#ef4444', '#3b82f6', '#10b981', '#f59e0b']; // Red, Blue, Green, Yellow

interface Projectile {
  x: number;
  y: number;
  colorIdx: number;
  angle: number; // approach angle
  dist: number;
  speed: number;
}

export default function MagicSpin() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [gameState, setGameState] = useState<'start' | 'playing' | 'gameover'>('start');
  const [score, setScore] = useState(0);
  const [rotation, setRotation] = useState(0); // 0, 1, 2, 3 (steps of 90 degrees)

  const rotationRef = useRef(rotation);
  rotationRef.current = rotation;
  const scoreRef = useRef(score);
  scoreRef.current = score;
  const gameStateRef = useRef(gameState);
  gameStateRef.current = gameState;

  const projectilesRef = useRef<Projectile[]>([]);
  const gameOverHandled = useRef(false);

  const rotateLeft = () => setRotation((r) => (r + 3) % 4);
  const rotateRight = () => setRotation((r) => (r + 1) % 4);

  const startGame = () => {
    setScore(0);
    setRotation(0);
    scoreRef.current = 0;
    rotationRef.current = 0;
    projectilesRef.current = [];
    gameOverHandled.current = false;
    setGameState('playing');
  };

  const handleGameOver = (finalScore: number) => {
    if (gameOverHandled.current) return;
    gameOverHandled.current = true;
    setGameState('gameover');
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('xakteir-game-score', { detail: { score: finalScore } }));
    }
  };

  // Keyboard support
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (gameStateRef.current !== 'playing') return;
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') rotateLeft();
      if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') rotateRight();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    if (gameState !== 'playing') return;

    let animId: number;
    let spawnTimer: NodeJS.Timeout;

    const spawnProjectile = () => {
      if (gameStateRef.current !== 'playing') return;

      const angles = [0, Math.PI / 2, Math.PI, (3 * Math.PI) / 2]; // 4 cardinal directions
      const angle = angles[Math.floor(Math.random() * angles.length)];
      const colorIdx = Math.floor(Math.random() * COLORS.length);
      const speed = 2 + Math.min(scoreRef.current / 50, 4);

      projectilesRef.current.push({
        x: 0,
        y: 0,
        colorIdx,
        angle,
        dist: 220,
        speed,
      });

      const delay = Math.max(700, 1500 - scoreRef.current * 15);
      spawnTimer = setTimeout(spawnProjectile, delay);
    };

    spawnProjectile();

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const center = { x: canvas.width / 2, y: canvas.height / 2 };
    const ringRadius = 50;

    const update = () => {
      if (!ctx || gameStateRef.current !== 'playing') return;

      ctx.fillStyle = '#09090b';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw center ring wheel with rotation
      ctx.save();
      ctx.translate(center.x, center.y);
      ctx.rotate((rotationRef.current * Math.PI) / 2);

      for (let i = 0; i < 4; i++) {
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.arc(0, 0, ringRadius, (i * Math.PI) / 2, ((i + 1) * Math.PI) / 2);
        ctx.fillStyle = COLORS[i];
        ctx.fill();
        ctx.strokeStyle = '#09090b';
        ctx.lineWidth = 3;
        ctx.stroke();
      }
      ctx.restore();

      // Update & draw projectiles
      for (let i = projectilesRef.current.length - 1; i >= 0; i--) {
        const p = projectilesRef.current[i];
        p.dist -= p.speed;

        const px = center.x + Math.cos(p.angle) * p.dist;
        const py = center.y + Math.sin(p.angle) * p.dist;

        ctx.beginPath();
        ctx.arc(px, py, 12, 0, Math.PI * 2);
        ctx.fillStyle = COLORS[p.colorIdx];
        ctx.shadowBlur = 10;
        ctx.shadowColor = COLORS[p.colorIdx];
        ctx.fill();
        ctx.shadowBlur = 0;

        // Collision with ring
        if (p.dist <= ringRadius + 5) {
          // Determine which quadrant p arrived from
          // 0 -> Right (0 rad), Math.PI/2 -> Down, Math.PI -> Left, 3PI/2 -> Up
          // Normalize angle to [0, 4)
          let incomingQuadrant = Math.round(p.angle / (Math.PI / 2)) % 4;
          // Accounting for rotation: wheel quadrant matching incoming angle
          let activeColorIdx = (incomingQuadrant - rotationRef.current + 4) % 4;

          if (activeColorIdx === p.colorIdx) {
            const newScore = scoreRef.current + 10;
            setScore(newScore);
            scoreRef.current = newScore;
            projectilesRef.current.splice(i, 1);
          } else {
            handleGameOver(scoreRef.current);
            return;
          }
        }
      }

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
      <h1 className="text-3xl font-black text-purple-400 mb-2 tracking-wider">MAGIC SPIN</h1>

      {gameState === 'playing' && (
        <div className="text-xl font-bold text-purple-400 mb-2">Score: {score}</div>
      )}

      <div className="relative border-2 border-purple-500/30 rounded-lg overflow-hidden bg-zinc-900">
        <canvas ref={canvasRef} width={500} height={400} className="max-w-full" />

        {gameState === 'start' && (
          <div className="absolute inset-0 bg-zinc-950/90 flex flex-col items-center justify-center p-6 text-center">
            <p className="text-zinc-300 mb-6 max-w-sm">
              Rotate the magic wheel to match incoming colored energy orbs with the corresponding color quadrant!
            </p>
            <button
              onClick={startGame}
              className="px-6 py-3 bg-purple-500 hover:bg-purple-400 text-zinc-950 font-black rounded-lg text-lg transition transform active:scale-95"
            >
              START GAME
            </button>
          </div>
        )}

        {gameState === 'gameover' && (
          <div className="absolute inset-0 bg-zinc-950/90 flex flex-col items-center justify-center p-6 text-center">
            <h2 className="text-4xl font-extrabold text-red-500 mb-2">MISMATCH!</h2>
            <p className="text-2xl text-purple-400 font-bold mb-6">Final Score: {score}</p>
            <button
              onClick={startGame}
              className="px-6 py-3 bg-purple-500 hover:bg-purple-400 text-zinc-950 font-black rounded-lg text-lg transition transform active:scale-95"
            >
              TRY AGAIN
            </button>
          </div>
        )}
      </div>

      {gameState === 'playing' && (
        <div className="flex gap-4 mt-4">
          <button
            onClick={rotateLeft}
            className="px-6 py-3 bg-zinc-800 hover:bg-zinc-700 font-bold rounded-lg border border-purple-500/40 text-purple-300 text-lg transition active:scale-95"
          >
            ↺ ROTATE LEFT
          </button>
          <button
            onClick={rotateRight}
            className="px-6 py-3 bg-zinc-800 hover:bg-zinc-700 font-bold rounded-lg border border-purple-500/40 text-purple-300 text-lg transition active:scale-95"
          >
            ROTATE RIGHT ↻
          </button>
        </div>
      )}
    </div>
  );
}
