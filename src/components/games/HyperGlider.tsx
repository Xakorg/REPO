'use client';

import React, { useEffect, useRef, useState } from 'react';

interface Ring {
  x: number;
  y: number;
  radius: number;
  passed: boolean;
}

interface Cloud {
  x: number;
  y: number;
  width: number;
  height: number;
}

export default function HyperGlider() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [score, setScore] = useState(0);
  const [energy, setEnergy] = useState(100);
  const [gameOver, setGameOver] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);

  const stateRef = useRef({
    gliderY: 200,
    gliderVy: 0,
    isPitchingUp: false,
    rings: [] as Ring[],
    clouds: [] as Cloud[],
    score: 0,
    energy: 100,
    speed: 4,
    spawnTimer: 0,
    started: false,
    gameOver: false,
  });

  const initGame = () => {
    stateRef.current = {
      gliderY: 200,
      gliderVy: 0,
      isPitchingUp: false,
      rings: [],
      clouds: [],
      score: 0,
      energy: 100,
      speed: 4,
      spawnTimer: 0,
      started: true,
      gameOver: false,
    };
    setScore(0);
    setEnergy(100);
    setGameOver(false);
    setGameStarted(true);
  };

  const handlePointerDown = () => {
    stateRef.current.isPitchingUp = true;
  };

  const handlePointerUp = () => {
    stateRef.current.isPitchingUp = false;
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === ' ' || e.key === 'ArrowUp' || e.key === 'w') {
        stateRef.current.isPitchingUp = true;
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === ' ' || e.key === 'ArrowUp' || e.key === 'w') {
        stateRef.current.isPitchingUp = false;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;

    const loop = () => {
      const s = stateRef.current;

      // Sky background gradient
      const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
      grad.addColorStop(0, '#090d16');
      grad.addColorStop(1, '#1e1b4b');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      if (s.started && !s.gameOver) {
        // Physics: Pitching up vs gravity gliding
        if (s.isPitchingUp) {
          s.gliderVy = Math.max(-5, s.gliderVy - 0.5);
          s.energy = Math.max(0, s.energy - 0.2);
        } else {
          s.gliderVy = Math.min(5, s.gliderVy + 0.3);
        }

        s.gliderY += s.gliderVy;
        s.score += 1;
        setScore(s.score);
        setEnergy(Math.round(s.energy));

        // Check top / bottom collision or energy empty
        if (s.gliderY < 10 || s.gliderY > canvas.height - 10 || s.energy <= 0) {
          s.gameOver = true;
          setGameOver(true);
          window.dispatchEvent(
            new CustomEvent('xakteir-game-score', { detail: { score: s.score } })
          );
        }

        // Spawn rings & storm clouds
        s.spawnTimer += 1;
        if (s.spawnTimer >= 70) {
          s.spawnTimer = 0;
          const ry = 50 + Math.random() * (canvas.height - 100);
          s.rings.push({
            x: canvas.width + 40,
            y: ry,
            radius: 22,
            passed: false,
          });

          if (Math.random() > 0.4) {
            const cy = 40 + Math.random() * (canvas.height - 80);
            s.clouds.push({
              x: canvas.width + 80,
              y: cy,
              width: 50,
              height: 35,
            });
          }
        }

        // Move rings & clouds
        s.rings.forEach((r) => (r.x -= s.speed));
        s.clouds.forEach((c) => (c.x -= s.speed));

        // Check ring collision
        const gliderX = 80;
        s.rings.forEach((r) => {
          if (!r.passed && Math.abs(r.x - gliderX) < 25 && Math.abs(r.y - s.gliderY) < 25) {
            r.passed = true;
            s.score += 150;
            s.energy = Math.min(100, s.energy + 25);
            setScore(s.score);
          }
        });

        // Check cloud collision
        s.clouds.forEach((c) => {
          if (
            gliderX > c.x - 20 &&
            gliderX < c.x + c.width + 20 &&
            s.gliderY > c.y - 15 &&
            s.gliderY < c.y + c.height + 15
          ) {
            s.gameOver = true;
            setGameOver(true);
            window.dispatchEvent(
              new CustomEvent('xakteir-game-score', { detail: { score: s.score } })
            );
          }
        });

        // Cleanup offscreen
        s.rings = s.rings.filter((r) => r.x > -50);
        s.clouds = s.clouds.filter((c) => c.x > -80);
      }

      // Draw Rings
      s.rings.forEach((r) => {
        ctx.strokeStyle = r.passed ? '#10b981' : '#38bdf8';
        ctx.lineWidth = 4;
        ctx.shadowBlur = 12;
        ctx.shadowColor = r.passed ? '#10b981' : '#38bdf8';
        ctx.beginPath();
        ctx.arc(r.x, r.y, r.radius, 0, Math.PI * 2);
        ctx.stroke();
        ctx.shadowBlur = 0;
      });

      // Draw Clouds
      s.clouds.forEach((c) => {
        ctx.fillStyle = 'rgba(239, 68, 68, 0.7)';
        ctx.beginPath();
        ctx.roundRect(c.x, c.y, c.width, c.height, 10);
        ctx.fill();
      });

      // Draw Glider (Jet/Wingsuit shape at X=80)
      const gx = 80;
      const gy = s.gliderY;

      ctx.shadowBlur = 15;
      ctx.shadowColor = '#a855f7';
      ctx.fillStyle = '#c084fc';
      ctx.beginPath();
      ctx.moveTo(gx + 20, gy);
      ctx.lineTo(gx - 15, gy - 12);
      ctx.lineTo(gx - 8, gy);
      ctx.lineTo(gx - 15, gy + 12);
      ctx.closePath();
      ctx.fill();
      ctx.shadowBlur = 0;

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-[450px] bg-zinc-950 text-white p-4 rounded-xl border border-zinc-800">
      <div className="w-full max-w-[400px] flex justify-between items-center mb-3">
        <h2 className="text-xl font-bold text-sky-400">HYPER GLIDER</h2>
        <div className="flex gap-2 text-xs font-semibold">
          <span className="bg-sky-950 text-sky-300 px-3 py-1 rounded-full border border-sky-800">
            Energy: {energy}%
          </span>
          <span className="bg-zinc-900 px-3 py-1 rounded-full border border-zinc-800 text-yellow-400">
            Score: {score}
          </span>
        </div>
      </div>

      <div
        onMouseDown={handlePointerDown}
        onMouseUp={handlePointerUp}
        onTouchStart={handlePointerDown}
        onTouchEnd={handlePointerUp}
        className="relative border-2 border-sky-500/40 rounded-lg overflow-hidden shadow-lg shadow-sky-500/10 cursor-pointer"
      >
        <canvas ref={canvasRef} width={400} height={400} className="bg-zinc-950" />

        {(!gameStarted || gameOver) && (
          <div className="absolute inset-0 bg-black/85 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center z-10 cursor-default">
            <h3 className="text-2xl font-bold mb-2 text-sky-400">
              {gameOver ? 'GLIDER CRASHED!' : 'HYPER GLIDER'}
            </h3>
            {gameOver && <p className="text-zinc-300 mb-4">Flight Score: {score}</p>}
            <button
              onClick={initGame}
              className="px-6 py-2 bg-sky-600 hover:bg-sky-500 text-white font-bold rounded-lg transition transform hover:scale-105"
            >
              {gameOver ? 'Fly Again' : 'Take Off'}
            </button>
          </div>
        )}
      </div>

      <p className="text-xs text-zinc-500 mt-3">Hold Space / Click & Hold to pitch up. Fly through blue rings for energy & score!</p>
    </div>
  );
}
