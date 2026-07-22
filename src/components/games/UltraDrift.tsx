'use client';

import React, { useEffect, useRef, useState } from 'react';

export default function UltraDrift() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [gameState, setGameState] = useState<'START' | 'PLAYING' | 'GAMEOVER'>('START');
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(30);

  useEffect(() => {
    if (gameState !== 'PLAYING') return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let currentScore = 0;
    let currentTimer = 30;

    const car = {
      x: canvas.width / 2,
      y: canvas.height - 70,
      angle: -Math.PI / 2,
      speed: 0,
      maxSpeed: 4.5,
      accel: 0.15,
      friction: 0.96,
      steer: 0.05,
      driftFactor: 0.92,
    };

    // Track Checkpoints / Drift Gates
    const gates = [
      { x: 100, y: 100, r: 35, hit: false },
      { x: 300, y: 100, r: 35, hit: false },
      { x: 350, y: 250, r: 35, hit: false },
      { x: 200, y: 380, r: 35, hit: false },
      { x: 80, y: 260, r: 35, hit: false },
    ];

    let currentGateIndex = 0;

    const keys: Record<string, boolean> = {};
    const handleKeyDown = (e: KeyboardEvent) => { keys[e.code] = true; };
    const handleKeyUp = (e: KeyboardEvent) => { keys[e.code] = false; };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    // Timer countdown
    const timerInterval = setInterval(() => {
      currentTimer--;
      setTimeLeft(currentTimer);
      if (currentTimer <= 0) {
        setGameState('GAMEOVER');
        window.dispatchEvent(new CustomEvent('xakteir-game-score', { detail: { score: currentScore } }));
      }
    }, 1000);

    const gameLoop = () => {
      // Steering & Acceleration
      if (keys['ArrowUp'] || keys['KeyW']) {
        car.speed = Math.min(car.maxSpeed, car.speed + car.accel);
      } else if (keys['ArrowDown'] || keys['KeyS']) {
        car.speed = Math.max(-car.maxSpeed / 2, car.speed - car.accel);
      } else {
        car.speed *= car.friction;
      }

      const isDrifting = (keys['Space'] || keys['ShiftLeft']) && Math.abs(car.speed) > 1.5;

      if (keys['ArrowLeft'] || keys['KeyA']) {
        car.angle -= car.steer * (isDrifting ? 1.6 : 1.0);
      }
      if (keys['ArrowRight'] || keys['KeyD']) {
        car.angle += car.steer * (isDrifting ? 1.6 : 1.0);
      }

      car.x += Math.cos(car.angle) * car.speed;
      car.y += Math.sin(car.angle) * car.speed;

      // Keep within bounds
      if (car.x < 20 || car.x > canvas.width - 20 || car.y < 20 || car.y > canvas.height - 20) {
        car.speed *= -0.5;
        car.x = Math.max(25, Math.min(canvas.width - 25, car.x));
        car.y = Math.max(25, Math.min(canvas.height - 25, car.y));
      }

      // Check Drift Score
      if (isDrifting) {
        currentScore += 2;
        setScore(currentScore);
      }

      // Check Checkpoint
      const targetGate = gates[currentGateIndex];
      const dist = Math.hypot(car.x - targetGate.x, car.y - targetGate.y);
      if (dist < targetGate.r + 10) {
        currentScore += 50;
        setScore(currentScore);
        currentTimer += 4;
        setTimeLeft(currentTimer);
        currentGateIndex = (currentGateIndex + 1) % gates.length;
      }

      // Render Track & Scene
      ctx.fillStyle = '#09090b';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Track Border/Circuit Line
      ctx.strokeStyle = '#27272a';
      ctx.lineWidth = 60;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();
      ctx.moveTo(gates[0].x, gates[0].y);
      for (let i = 1; i < gates.length; i++) {
        ctx.lineTo(gates[i].x, gates[i].y);
      }
      ctx.closePath();
      ctx.stroke();

      ctx.strokeStyle = '#3f3f46';
      ctx.lineWidth = 50;
      ctx.stroke();

      // Render Gates
      gates.forEach((g, idx) => {
        const isCurrent = idx === currentGateIndex;
        ctx.fillStyle = isCurrent ? 'rgba(234, 179, 8, 0.4)' : 'rgba(113, 113, 122, 0.2)';
        ctx.strokeStyle = isCurrent ? '#eab308' : '#52525b';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(g.x, g.y, g.r, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      });

      // Render Car
      ctx.save();
      ctx.translate(car.x, car.y);
      ctx.rotate(car.angle);

      // Tire tracks if drifting
      if (isDrifting) {
        ctx.fillStyle = 'rgba(234, 179, 8, 0.6)';
        ctx.fillRect(-15, -8, 6, 4);
        ctx.fillRect(-15, 4, 6, 4);
      }

      // Car Body
      ctx.fillStyle = '#eab308';
      ctx.fillRect(-12, -7, 24, 14);
      ctx.fillStyle = '#18181b';
      ctx.fillRect(-4, -5, 12, 10);
      ctx.restore();

      animId = requestAnimationFrame(gameLoop);
    };

    animId = requestAnimationFrame(gameLoop);

    return () => {
      cancelAnimationFrame(animId);
      clearInterval(timerInterval);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [gameState]);

  const startGame = () => {
    setScore(0);
    setTimeLeft(30);
    setGameState('PLAYING');
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[500px] bg-zinc-950 text-white rounded-xl p-4 shadow-2xl relative select-none">
      <h2 className="text-2xl font-bold tracking-wider mb-2 text-yellow-400">ULTRA DRIFT</h2>
      <div className="relative border-2 border-yellow-500/30 rounded-lg overflow-hidden bg-zinc-900">
        <canvas ref={canvasRef} width={450} height={460} className="block" />

        {gameState === 'START' && (
          <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center p-6 text-center">
            <p className="text-zinc-300 mb-4 text-sm max-w-xs">WASD/Arrows to drive. Hold SPACE or SHIFT while turning to DRIFT! Pass through yellow gates to extend your timer!</p>
            <button
              onClick={startGame}
              className="px-6 py-2 bg-yellow-500 hover:bg-yellow-400 text-zinc-950 font-bold rounded-full transition transform hover:scale-105"
            >
              START DRIFTING
            </button>
          </div>
        )}

        {gameState === 'GAMEOVER' && (
          <div className="absolute inset-0 bg-black/85 flex flex-col items-center justify-center p-6 text-center">
            <h3 className="text-2xl font-extrabold text-yellow-400 mb-2">TIME UP</h3>
            <p className="text-lg text-zinc-300 mb-4">Drift Score: <span className="text-yellow-400 font-bold">{score}</span></p>
            <button
              onClick={startGame}
              className="px-6 py-2 bg-yellow-500 hover:bg-yellow-400 text-zinc-950 font-bold rounded-full transition transform hover:scale-105"
            >
              RACE AGAIN
            </button>
          </div>
        )}

        {gameState === 'PLAYING' && (
          <div className="absolute top-3 left-3 right-3 flex justify-between items-center pointer-events-none">
            <div className="bg-zinc-900/90 border border-yellow-500/30 px-3 py-1 rounded-md text-yellow-400 text-sm font-bold">
              Score: {score}
            </div>
            <div className="bg-zinc-900/90 border border-amber-500/30 px-3 py-1 rounded-md text-amber-400 text-sm font-bold">
              Time: {timeLeft}s
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
