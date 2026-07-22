'use client';

import React, { useEffect, useRef, useState } from 'react';

const COLORS = ['#ef4444', '#3b82f6', '#10b981', '#f59e0b', '#a855f7'];

export default function AstroSpin2() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [gameState, setGameState] = useState<'start' | 'playing' | 'gameover'>('start');
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);

  useEffect(() => {
    if (gameState !== 'playing') return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let currentScore = 0;
    let currentLives = 3;

    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const ringRadius = 130;

    let rotationAngle = 0;
    let rotationSpeed = 0.02;

    // Outer segments (5 color nodes around ring)
    let segments = COLORS.map((color, i) => ({
      angle: (i * (Math.PI * 2)) / COLORS.length,
      color,
    }));

    let currentOrbColor = COLORS[Math.floor(Math.random() * COLORS.length)];
    let activeOrb: { x: number; y: number; vx: number; vy: number; color: string } | null = null;

    const launchOrb = () => {
      if (activeOrb) return;
      // Launch orb outwards along current pointer angle or upward (0 degrees)
      activeOrb = {
        x: centerX,
        y: centerY,
        vx: 0,
        vy: -7,
        color: currentOrbColor,
      };
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === ' ' || e.key === 'ArrowUp') {
        launchOrb();
      }
    };
    const handleClick = () => {
      launchOrb();
    };

    window.addEventListener('keydown', handleKeyDown);
    canvas.addEventListener('click', handleClick);

    const update = () => {
      rotationAngle += rotationSpeed;

      if (activeOrb) {
        activeOrb.x += activeOrb.vx;
        activeOrb.y += activeOrb.vy;

        const dist = Math.hypot(activeOrb.x - centerX, activeOrb.y - centerY);
        if (dist >= ringRadius - 10) {
          // Check collision angle
          const hitAngle = Math.atan2(activeOrb.y - centerY, activeOrb.x - centerX);
          // Normalize hit angle relative to rotation
          let relAngle = (hitAngle - rotationAngle) % (Math.PI * 2);
          if (relAngle < 0) relAngle += Math.PI * 2;

          const segAngleWidth = (Math.PI * 2) / segments.length;
          const matchedIndex = Math.floor(relAngle / segAngleWidth) % segments.length;
          const hitSegment = segments[matchedIndex];

          if (hitSegment && hitSegment.color === activeOrb.color) {
            currentScore += 150;
            setScore(currentScore);
            rotationSpeed = (rotationSpeed > 0 ? 1 : -1) * (0.02 + Math.min(0.04, currentScore * 0.00002));
            if (Math.random() < 0.3) rotationSpeed *= -1; // change direction occasionally
          } else {
            currentLives--;
            setLives(currentLives);
            if (currentLives <= 0) {
              setGameState('gameover');
              window.dispatchEvent(new CustomEvent('xakteir-game-score', { detail: { score: currentScore } }));
              return;
            }
          }

          // Reset orb
          activeOrb = null;
          currentOrbColor = COLORS[Math.floor(Math.random() * COLORS.length)];
        }
      }
    };

    const draw = () => {
      ctx.fillStyle = '#09090b';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw outer rotating ring
      ctx.lineWidth = 14;
      const segAngleWidth = (Math.PI * 2) / segments.length;

      segments.forEach((seg, i) => {
        const start = rotationAngle + i * segAngleWidth;
        const end = start + segAngleWidth - 0.05;
        ctx.strokeStyle = seg.color;
        ctx.beginPath();
        ctx.arc(centerX, centerY, ringRadius, start, end);
        ctx.stroke();
      });

      // Draw Center Cannon / Orb
      ctx.fillStyle = activeOrb ? '#27272a' : currentOrbColor;
      ctx.beginPath();
      ctx.arc(centerX, centerY, 20, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Launch arrow guide
      ctx.strokeStyle = '#ffffff44';
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]);
      ctx.beginPath();
      ctx.moveTo(centerX, centerY - 20);
      ctx.lineTo(centerX, centerY - ringRadius + 10);
      ctx.stroke();
      ctx.setLineDash([]);

      // Active Orb in flight
      if (activeOrb) {
        ctx.fillStyle = activeOrb.color;
        ctx.beginPath();
        ctx.arc(activeOrb.x, activeOrb.y, 14, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.stroke();
      }
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
    setLives(3);
    setGameState('playing');
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[500px] bg-zinc-950 text-white p-4 rounded-xl shadow-2xl border border-zinc-800">
      <h1 className="text-3xl font-extrabold mb-2 text-cyan-400 tracking-wider">ASTRO SPIN 2</h1>
      <p className="text-xs text-zinc-400 mb-4">Click or Space to launch orb. Match color of the rotating ring segment!</p>
      <div className="relative border-2 border-cyan-500/40 rounded-lg overflow-hidden">
        <canvas ref={canvasRef} width={600} height={400} className="block bg-zinc-950 cursor-pointer" />

        {gameState === 'start' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-zinc-950/90">
            <p className="text-xl font-bold text-cyan-400 mb-4">Match Colors & Spin the Cosmic Ring!</p>
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
            <h2 className="text-3xl font-bold text-red-500 mb-2">GAME OVER</h2>
            <p className="text-lg text-zinc-300 mb-4">Final Score: {score}</p>
            <button
              onClick={startGame}
              className="px-6 py-3 bg-cyan-500 hover:bg-cyan-600 font-bold rounded-lg transition transform hover:scale-105"
            >
              Play Again
            </button>
          </div>
        )}
      </div>
      <div className="flex gap-8 mt-4 font-mono text-lg">
        <span className="text-cyan-400">Score: {score}</span>
        <span className="text-red-400">Lives: {'❤️'.repeat(lives)}</span>
      </div>
    </div>
  );
}
