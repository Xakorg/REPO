'use client';

import React, { useEffect, useRef, useState } from 'react';

export default function EpicDrift2() {
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

    const car = {
      x: canvas.width / 2,
      y: canvas.height / 2,
      angle: 0,
      velocity: 0,
      maxVelocity: 5,
      driftAngle: 0,
    };

    const keys: Record<string, boolean> = {};

    let pathOffset = 0;

    // Track points generator
    const getTrackCenter = (yOffset: number) => {
      return canvas.width / 2 + Math.sin((yOffset + pathOffset) * 0.008) * 160 + Math.cos((yOffset + pathOffset) * 0.02) * 50;
    };

    const skidMarks: { x: number; y: number; alpha: number }[] = [];

    const handleKeyDown = (e: KeyboardEvent) => (keys[e.key] = true);
    const handleKeyUp = (e: KeyboardEvent) => (keys[e.key] = false);

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    const update = () => {
      // Accelerate / Brake
      if (keys['ArrowUp'] || keys['w']) car.velocity = Math.min(car.maxVelocity, car.velocity + 0.15);
      else car.velocity = Math.max(0, car.velocity - 0.05);

      if (keys['ArrowDown'] || keys['s']) car.velocity = Math.max(0, car.velocity - 0.1);

      // Steering
      const steerSpeed = 0.05 * (car.velocity / car.maxVelocity);
      if (keys['ArrowLeft'] || keys['a']) car.angle -= steerSpeed;
      if (keys['ArrowRight'] || keys['d']) car.angle += steerSpeed;

      // Drift physics (handbrake)
      const isDrifting = keys[' '] || Math.abs(car.angle) > 0.4;
      pathOffset += car.velocity * 3;

      if (isDrifting && car.velocity > 1.5) {
        currentScore += Math.floor(car.velocity * 5);
        setScore(currentScore);

        // Leave skidmarks
        skidMarks.push({
          x: car.x - Math.cos(car.angle) * 15,
          y: car.y - Math.sin(car.angle) * 15,
          alpha: 1.0,
        });
      }

      // Check track boundaries
      const currentTrackCenter = getTrackCenter(car.y);
      const trackWidth = 140;

      if (car.x < currentTrackCenter - trackWidth / 2 || car.x > currentTrackCenter + trackWidth / 2) {
        setGameState('gameover');
        window.dispatchEvent(new CustomEvent('xakteir-game-score', { detail: { score: currentScore } }));
        return;
      }

      // Smooth horizontal position adjustment relative to track movement
      if (keys['ArrowLeft'] || keys['a']) car.x -= car.velocity * 1.2;
      if (keys['ArrowRight'] || keys['d']) car.x += car.velocity * 1.2;

      // Update skid marks
      for (let i = skidMarks.length - 1; i >= 0; i--) {
        skidMarks[i].alpha -= 0.02;
        if (skidMarks[i].alpha <= 0) skidMarks.splice(i, 1);
      }
    };

    const draw = () => {
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw curved track
      ctx.fillStyle = '#334155';
      ctx.beginPath();
      for (let y = 0; y < canvas.height; y += 10) {
        const center = getTrackCenter(y);
        const w = 140;
        ctx.rect(center - w / 2, y, w, 10);
      }
      ctx.fill();

      // Track borders
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 6;
      ctx.beginPath();
      for (let y = 0; y < canvas.height; y += 10) {
        const center = getTrackCenter(y);
        const w = 140;
        ctx.lineTo(center - w / 2, y);
      }
      ctx.stroke();

      ctx.strokeStyle = '#ef4444';
      ctx.beginPath();
      for (let y = 0; y < canvas.height; y += 10) {
        const center = getTrackCenter(y);
        const w = 140;
        ctx.lineTo(center + w / 2, y);
      }
      ctx.stroke();

      // Skid marks
      skidMarks.forEach((sm) => {
        ctx.fillStyle = `rgba(0, 0, 0, ${sm.alpha})`;
        ctx.fillRect(sm.x - 3, sm.y - 3, 6, 6);
      });

      // Draw Car
      ctx.save();
      ctx.translate(car.x, car.y);
      ctx.rotate(car.angle);

      // Car body
      ctx.fillStyle = '#38bdf8';
      ctx.fillRect(-12, -22, 24, 44);

      // Windshield
      ctx.fillStyle = '#0284c7';
      ctx.fillRect(-9, -10, 18, 14);

      // Wheels
      ctx.fillStyle = '#000000';
      ctx.fillRect(-14, -18, 4, 10);
      ctx.fillRect(10, -18, 4, 10);
      ctx.fillRect(-14, 8, 4, 10);
      ctx.fillRect(10, 8, 4, 10);

      ctx.restore();
    };

    const loop = () => {
      update();
      draw();
      animId = requestAnimationFrame(loop);
    };

    loop();

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      cancelAnimationFrame(animId);
    };
  }, [gameState]);

  const startGame = () => {
    setScore(0);
    setGameState('playing');
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[500px] bg-zinc-950 text-white p-4 rounded-xl shadow-2xl border border-zinc-800">
      <h1 className="text-3xl font-extrabold mb-2 text-sky-400 tracking-wider">EPIC DRIFT 2</h1>
      <p className="text-xs text-zinc-400 mb-4">Use Up to accelerate, Left/Right to steer & Space to drift stay on track!</p>
      <div className="relative border-2 border-sky-500/40 rounded-lg overflow-hidden">
        <canvas ref={canvasRef} width={600} height={400} className="block bg-zinc-950" />

        {gameState === 'start' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-zinc-950/90">
            <p className="text-xl font-bold text-sky-400 mb-4">Master High Speed Drifts!</p>
            <button
              onClick={startGame}
              className="px-6 py-3 bg-sky-500 hover:bg-sky-600 font-bold rounded-lg transition transform hover:scale-105"
            >
              Start Game
            </button>
          </div>
        )}

        {gameState === 'gameover' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-zinc-950/90">
            <h2 className="text-3xl font-bold text-red-500 mb-2">CRASHED!</h2>
            <p className="text-lg text-zinc-300 mb-4">Drift Points: {score}</p>
            <button
              onClick={startGame}
              className="px-6 py-3 bg-sky-500 hover:bg-sky-600 font-bold rounded-lg transition transform hover:scale-105"
            >
              Play Again
            </button>
          </div>
        )}
      </div>
      <div className="mt-4 font-mono text-lg text-sky-400">Drift Score: {score}</div>
    </div>
  );
}
