'use client';

import React, { useEffect, useRef, useState } from 'react';

interface Drone {
  id: number;
  x: number;
  y: number;
  speed: number;
  radius: number;
}

interface LightningBolt {
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  life: number;
}

export default function ElectroStrike() {
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
    let playerX = canvas.width / 2;
    let playerY = canvas.height / 2;
    const playerRadius = 16;

    let drones: Drone[] = [];
    let bolts: LightningBolt[] = [];
    let frameCount = 0;

    let mouseX = playerX;
    let mouseY = playerY;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouseX = e.clientX - rect.left;
      mouseY = e.clientY - rect.top;
    };

    const handleMouseDown = () => {
      // Shoot lightning bolt towards mouse
      const angle = Math.atan2(mouseY - playerY, mouseX - playerX);
      const targetX = playerX + Math.cos(angle) * 350;
      const targetY = playerY + Math.sin(angle) * 350;

      bolts.push({
        startX: playerX,
        startY: playerY,
        endX: targetX,
        endY: targetY,
        life: 8,
      });

      // Check hits along bolt trajectory
      for (let i = drones.length - 1; i >= 0; i--) {
        const drone = drones[i];
        // Line-circle collision check simplified
        const distToPlayer = Math.hypot(drone.x - playerX, drone.y - playerY);
        const droneAngle = Math.atan2(drone.y - playerY, drone.x - playerX);
        const angleDiff = Math.abs(angle - droneAngle);

        if (angleDiff < 0.35 && distToPlayer < 350) {
          drones.splice(i, 1);
          setScore((s) => s + 50);
        }
      }
    };

    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('mousedown', handleMouseDown);

    const gameLoop = () => {
      frameCount++;

      // Spawn Drones from edges
      if (frameCount % Math.max(12, 40 - Math.floor(frameCount / 150)) === 0) {
        const edge = Math.floor(Math.random() * 4);
        let x = 0, y = 0;
        if (edge === 0) { x = Math.random() * canvas.width; y = -10; }
        if (edge === 1) { x = canvas.width + 10; y = Math.random() * canvas.height; }
        if (edge === 2) { x = Math.random() * canvas.width; y = canvas.height + 10; }
        if (edge === 3) { x = -10; y = Math.random() * canvas.height; }

        drones.push({
          id: Math.random(),
          x,
          y,
          speed: 1.8 + Math.random() * 1.5,
          radius: 12,
        });
      }

      // Update Drones towards center
      for (let i = drones.length - 1; i >= 0; i--) {
        const d = drones[i];
        const angle = Math.atan2(playerY - d.y, playerX - d.x);
        d.x += Math.cos(angle) * d.speed;
        d.y += Math.sin(angle) * d.speed;

        // Collision with player
        const dist = Math.hypot(playerX - d.x, playerY - d.y);
        if (dist < playerRadius + d.radius) {
          const finalScore = scoreRef.current;
          window.dispatchEvent(new CustomEvent('xakteir-game-score', { detail: { score: finalScore } }));
          setGameState('GAMEOVER');
          return;
        }
      }

      // Render
      ctx.fillStyle = '#05050d';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Grid visual
      ctx.strokeStyle = '#1e1b4b';
      ctx.lineWidth = 1;
      for (let x = 0; x < canvas.width; x += 40) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, canvas.height); ctx.stroke();
      }
      for (let y = 0; y < canvas.height; y += 40) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(canvas.width, y); ctx.stroke();
      }

      // Draw Player Electro Core
      ctx.fillStyle = '#38bdf8';
      ctx.beginPath();
      ctx.arc(playerX, playerY, playerRadius + Math.sin(frameCount * 0.2) * 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#e0f2fe';
      ctx.lineWidth = 3;
      ctx.stroke();

      // Aim Line
      ctx.strokeStyle = '#38bdf844';
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(playerX, playerY);
      ctx.lineTo(mouseX, mouseY);
      ctx.stroke();
      ctx.setLineDash([]);

      // Draw Lightning Bolts
      for (let i = bolts.length - 1; i >= 0; i--) {
        const bolt = bolts[i];
        ctx.strokeStyle = '#60a5fa';
        ctx.lineWidth = bolt.life;
        ctx.beginPath();
        ctx.moveTo(bolt.startX, bolt.startY);

        // Jagged line path
        const midX = (bolt.startX + bolt.endX) / 2 + (Math.random() - 0.5) * 30;
        const midY = (bolt.startY + bolt.endY) / 2 + (Math.random() - 0.5) * 30;
        ctx.lineTo(midX, midY);
        ctx.lineTo(bolt.endX, bolt.endY);
        ctx.stroke();

        bolt.life -= 1;
        if (bolt.life <= 0) bolts.splice(i, 1);
      }

      // Draw Drones
      drones.forEach((d) => {
        ctx.fillStyle = '#f43f5e';
        ctx.beginPath();
        ctx.arc(d.x, d.y, d.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#fda4af';
        ctx.lineWidth = 2;
        ctx.stroke();
      });

      animId = requestAnimationFrame(gameLoop);
    };

    animId = requestAnimationFrame(gameLoop);

    return () => {
      cancelAnimationFrame(animId);
      canvas.removeEventListener('mousemove', handleMouseMove);
      canvas.removeEventListener('mousedown', handleMouseDown);
    };
  }, [gameState]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[500px] bg-zinc-950 text-white rounded-xl p-4">
      <div className="flex justify-between items-center w-full max-w-[600px] mb-4">
        <div>
          <h2 className="text-xl font-bold text-sky-400">Electro Strike</h2>
          <p className="text-xs text-zinc-400">Aim with Mouse & Click to blast cyber drones with lightning!</p>
        </div>
        <div className="text-lg font-semibold text-sky-300">Score: {score}</div>
      </div>

      <div className="relative border border-sky-900/50 rounded-lg overflow-hidden">
        <canvas ref={canvasRef} width={600} height={400} className="bg-zinc-950 block cursor-crosshair" />

        {gameState === 'START' && (
          <div className="absolute inset-0 bg-zinc-950/90 flex flex-col items-center justify-center p-6 text-center">
            <h3 className="text-3xl font-extrabold text-sky-400 mb-2">ELECTRO STRIKE</h3>
            <p className="text-zinc-400 mb-6 max-w-sm">Protect the core! Click to discharge electric energy bolts and destroy incoming drones!</p>
            <button
              onClick={startGame}
              className="px-6 py-3 bg-sky-600 hover:bg-sky-500 text-white font-bold rounded-lg transition"
            >
              Initiate Strike
            </button>
          </div>
        )}

        {gameState === 'GAMEOVER' && (
          <div className="absolute inset-0 bg-zinc-950/90 flex flex-col items-center justify-center p-6 text-center">
            <h3 className="text-3xl font-extrabold text-red-500 mb-2">CORE OVERLOADED</h3>
            <p className="text-zinc-300 text-lg mb-4">Final Score: <span className="text-sky-400 font-bold">{score}</span></p>
            <button
              onClick={startGame}
              className="px-6 py-3 bg-sky-600 hover:bg-sky-500 text-white font-bold rounded-lg transition"
            >
              Play Again
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
