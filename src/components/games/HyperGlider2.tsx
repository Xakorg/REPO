'use client';

import React, { useEffect, useRef, useState } from 'react';

interface Ring {
  x: number;
  y: number;
  z: number;
  radius: number;
  passed: boolean;
}

interface Mine {
  x: number;
  y: number;
  z: number;
  radius: number;
}

export default function HyperGlider2() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [score, setScore] = useState(0);
  const [speed, setSpeed] = useState(100);
  const [gameOver, setGameOver] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);

  const stateRef = useRef({
    gx: 200,
    gy: 180,
    rings: [] as Ring[],
    mines: [] as Mine[],
    speed: 6,
    distance: 0,
    score: 0,
    started: false,
    gameOver: false,
  });

  const initGame = () => {
    stateRef.current = {
      gx: 200,
      gy: 180,
      rings: [],
      mines: [],
      speed: 6,
      distance: 0,
      score: 0,
      started: true,
      gameOver: false,
    };
    setScore(0);
    setSpeed(100);
    setGameOver(false);
    setGameStarted(true);
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      stateRef.current.gx = Math.max(30, Math.min(canvas.width - 30, e.clientX - rect.left));
      stateRef.current.gy = Math.max(30, Math.min(canvas.height - 30, e.clientY - rect.top));
    };

    window.addEventListener('mousemove', handleMouseMove);

    let animId: number;

    const loop = () => {
      const s = stateRef.current;

      ctx.fillStyle = '#09090b';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw horizon lines
      ctx.strokeStyle = '#1e1b4b';
      for (let y = 100; y < canvas.height; y += 30) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
      }

      if (s.started && !s.gameOver) {
        s.distance += s.speed;

        // Spawn Rings & Mines
        if (Math.random() < 0.08) {
          s.rings.push({
            x: Math.random() * (canvas.width - 80) + 40,
            y: Math.random() * (canvas.height - 80) + 40,
            z: 600,
            radius: 40,
            passed: false,
          });
        }

        if (Math.random() < 0.05) {
          s.mines.push({
            x: Math.random() * (canvas.width - 60) + 30,
            y: Math.random() * (canvas.height - 60) + 30,
            z: 600,
            radius: 20,
          });
        }

        // Update & Render Rings (Z perspective)
        for (let i = s.rings.length - 1; i >= 0; i--) {
          const r = s.rings[i];
          r.z -= s.speed * 2;

          const scale = 300 / Math.max(10, r.z);
          const rx = canvas.width / 2 + (r.x - canvas.width / 2) * scale;
          const ry = canvas.height / 2 + (r.y - canvas.height / 2) * scale;
          const rRadius = r.radius * scale;

          if (r.z > 0) {
            ctx.strokeStyle = '#38bdf8';
            ctx.lineWidth = Math.max(1, 4 * scale);
            ctx.shadowBlur = 10;
            ctx.shadowColor = '#38bdf8';
            ctx.beginPath();
            ctx.arc(rx, ry, rRadius, 0, Math.PI * 2);
            ctx.stroke();
            ctx.shadowBlur = 0;
            ctx.lineWidth = 1;
          }

          // Check passage through ring
          if (r.z <= 20 && r.z > -20 && !r.passed) {
            r.passed = true;
            if (Math.hypot(s.gx - rx, s.gy - ry) < rRadius + 15) {
              s.score += 150;
              setScore(s.score);
              s.speed = Math.min(12, s.speed + 0.3);
              setSpeed(Math.round((s.speed / 6) * 100));
            }
          }

          if (r.z < -50) s.rings.splice(i, 1);
        }

        // Update & Render Mines
        for (let i = s.mines.length - 1; i >= 0; i--) {
          const m = s.mines[i];
          m.z -= s.speed * 2;

          const scale = 300 / Math.max(10, m.z);
          const mx = canvas.width / 2 + (m.x - canvas.width / 2) * scale;
          const my = canvas.height / 2 + (m.y - canvas.height / 2) * scale;
          const mRadius = m.radius * scale;

          if (m.z > 0) {
            ctx.fillStyle = '#ef4444';
            ctx.shadowBlur = 10;
            ctx.shadowColor = '#ef4444';
            ctx.beginPath();
            ctx.arc(mx, my, mRadius, 0, Math.PI * 2);
            ctx.fill();
            ctx.shadowBlur = 0;
          }

          // Check mine collision
          if (m.z <= 20 && m.z > -20) {
            if (Math.hypot(s.gx - mx, s.gy - my) < mRadius + 10) {
              s.gameOver = true;
              setGameOver(true);
              window.dispatchEvent(new CustomEvent('xakteir-game-score', { detail: { score: s.score } }));
            }
          }

          if (m.z < -50) s.mines.splice(i, 1);
        }
      }

      // Render Glider Ship
      ctx.fillStyle = '#06b6d4';
      ctx.shadowBlur = 15;
      ctx.shadowColor = '#06b6d4';
      ctx.beginPath();
      ctx.moveTo(s.gx, s.gy - 15);
      ctx.lineTo(s.gx - 25, s.gy + 10);
      ctx.lineTo(s.gx, s.gy + 5);
      ctx.lineTo(s.gx + 25, s.gy + 10);
      ctx.closePath();
      ctx.fill();
      ctx.shadowBlur = 0;

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-[450px] bg-zinc-950 text-white p-4 rounded-xl border border-zinc-800">
      <div className="w-full max-w-[440px] flex justify-between items-center mb-2 text-xs font-semibold">
        <h2 className="text-xl font-bold text-sky-400">HYPER GLIDER 2</h2>
        <div className="flex gap-2">
          <span className="bg-zinc-900 px-3 py-1 rounded-full border border-zinc-800 text-cyan-400">
            Speed: {speed}%
          </span>
          <span className="bg-zinc-900 px-3 py-1 rounded-full border border-zinc-800 text-sky-400">
            Score: {score}
          </span>
        </div>
      </div>

      <div className="relative border-2 border-sky-500/40 rounded-lg overflow-hidden shadow-lg shadow-sky-500/10 cursor-pointer">
        <canvas ref={canvasRef} width={440} height={360} className="bg-zinc-950" />

        {(!gameStarted || gameOver) && (
          <div className="absolute inset-0 bg-black/85 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center z-10">
            <h3 className="text-2xl font-bold mb-2 text-sky-400">
              {gameOver ? 'AERIAL CRASH' : 'HYPER GLIDER 2'}
            </h3>
            {gameOver && <p className="text-zinc-300 mb-4 font-semibold">Final Distance Score: {score}</p>}
            <button
              onClick={initGame}
              className="px-6 py-2 bg-gradient-to-r from-sky-500 to-indigo-500 text-white font-bold rounded-lg hover:opacity-90 transition transform hover:scale-105"
            >
              {gameOver ? 'Play Again' : 'Take Flight'}
            </button>
          </div>
        )}
      </div>

      <p className="text-xs text-zinc-500 mt-3">Move mouse to steer glider through cyan boost rings and dodge red sky mines!</p>
    </div>
  );
}
