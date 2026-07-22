'use client';

import React, { useEffect, useRef, useState } from 'react';

interface Obstacle {
  x: number;
  w: number;
  h: number;
}

interface Isotope {
  x: number;
  y: number;
  collected: boolean;
}

export default function LunarRunner2() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);

  const stateRef = useRef({
    rx: 80,
    ry: 260,
    vy: 0,
    angle: 0,
    angularVel: 0,
    isGrounded: true,
    obstacles: [] as Obstacle[],
    isotopes: [] as Isotope[],
    speed: 5,
    distance: 0,
    score: 0,
    flips: 0,
    started: false,
    gameOver: false,
    frame: 0,
    keys: { left: false, right: false },
  });

  const initGame = () => {
    stateRef.current = {
      rx: 80,
      ry: 260,
      vy: 0,
      angle: 0,
      angularVel: 0,
      isGrounded: true,
      obstacles: [],
      isotopes: [],
      speed: 5,
      distance: 0,
      score: 0,
      flips: 0,
      started: true,
      gameOver: false,
      frame: 0,
      keys: { left: false, right: false },
    };
    setScore(0);
    setGameOver(false);
    setGameStarted(true);
  };

  const jump = () => {
    const s = stateRef.current;
    if (!s.started || s.gameOver) return;
    if (s.isGrounded) {
      s.vy = -11;
      s.isGrounded = false;
    }
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.code === 'ArrowUp') {
        e.preventDefault();
        jump();
      }
      if (e.code === 'ArrowLeft') stateRef.current.keys.left = true;
      if (e.code === 'ArrowRight') stateRef.current.keys.right = true;
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'ArrowLeft') stateRef.current.keys.left = false;
      if (e.code === 'ArrowRight') stateRef.current.keys.right = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    let animId: number;

    const loop = () => {
      const s = stateRef.current;
      s.frame++;

      ctx.fillStyle = '#09090b';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw Lunar Surface
      ctx.fillStyle = '#27272a';
      ctx.fillRect(0, 280, canvas.width, canvas.height - 280);

      // Surface crater bumps
      ctx.fillStyle = '#18181b';
      for (let x = -(s.distance % 60); x < canvas.width; x += 60) {
        ctx.beginPath();
        ctx.arc(x, 290, 20, 0, Math.PI);
        ctx.fill();
      }

      if (s.started && !s.gameOver) {
        s.distance += s.speed;

        // Rover Physics (Low gravity)
        const gravity = 0.4;
        s.vy += gravity;
        s.ry += s.vy;

        if (s.keys.left) s.angularVel -= 0.04;
        if (s.keys.right) s.angularVel += 0.04;

        s.angle += s.angularVel;
        s.angularVel *= 0.95;

        if (s.ry >= 260) {
          s.ry = 260;
          s.vy = 0;

          // Check landing angle safety
          const normalizedAngle = Math.abs(s.angle % (Math.PI * 2));
          if (normalizedAngle > Math.PI / 3 && normalizedAngle < (Math.PI * 5) / 3) {
            // Overturned crash!
            s.gameOver = true;
            setGameOver(true);
            window.dispatchEvent(new CustomEvent('xakteir-game-score', { detail: { score: s.score } }));
          } else {
            s.angle = 0;
            s.isGrounded = true;
          }
        }

        // Spawn Craters / Obstacles
        if (s.frame % 90 === 0) {
          s.obstacles.push({
            x: canvas.width + 30,
            w: 30,
            h: 30,
          });

          if (Math.random() > 0.4) {
            s.isotopes.push({
              x: canvas.width + 70,
              y: 200,
              collected: false,
            });
          }
        }

        // Process Obstacles
        for (let i = s.obstacles.length - 1; i >= 0; i--) {
          const obs = s.obstacles[i];
          obs.x -= s.speed;

          // Draw crater obstacle
          ctx.fillStyle = '#ef4444';
          ctx.shadowBlur = 8;
          ctx.shadowColor = '#ef4444';
          ctx.fillRect(obs.x, 280 - obs.h, obs.w, obs.h);
          ctx.shadowBlur = 0;

          // Collision check
          if (
            s.rx + 20 > obs.x &&
            s.rx - 20 < obs.x + obs.w &&
            s.ry + 15 > 280 - obs.h
          ) {
            s.gameOver = true;
            setGameOver(true);
            window.dispatchEvent(new CustomEvent('xakteir-game-score', { detail: { score: s.score } }));
          }

          if (obs.x < -40) s.obstacles.splice(i, 1);
        }

        // Process Isotopes
        for (let i = s.isotopes.length - 1; i >= 0; i--) {
          const iso = s.isotopes[i];
          iso.x -= s.speed;

          if (!iso.collected) {
            ctx.fillStyle = '#a855f7';
            ctx.shadowBlur = 10;
            ctx.shadowColor = '#a855f7';
            ctx.beginPath();
            ctx.arc(iso.x, iso.y, 8, 0, Math.PI * 2);
            ctx.fill();
            ctx.shadowBlur = 0;

            if (Math.hypot(s.rx - iso.x, s.ry - iso.y) < 25) {
              iso.collected = true;
              s.score += 100;
              setScore(s.score + Math.floor(s.distance / 10));
            }
          }

          if (iso.x < -20) s.isotopes.splice(i, 1);
        }

        const totalCurrentScore = s.score + Math.floor(s.distance / 10);
        setScore(totalCurrentScore);
      }

      // Render Rover Buggy
      ctx.save();
      ctx.translate(s.rx, s.ry);
      ctx.rotate(s.angle);

      // Body
      ctx.fillStyle = '#06b6d4';
      ctx.fillRect(-20, -10, 40, 15);

      // Wheels
      ctx.fillStyle = '#71717a';
      ctx.beginPath();
      ctx.arc(-14, 8, 7, 0, Math.PI * 2);
      ctx.arc(14, 8, 7, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();

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
      <div className="w-full max-w-[440px] flex justify-between items-center mb-2">
        <h2 className="text-xl font-bold text-purple-400">LUNAR RUNNER 2</h2>
        <span className="bg-zinc-900 px-3 py-1 rounded-full border border-zinc-800 text-purple-400 font-semibold text-xs">
          Score: {score}
        </span>
      </div>

      <div
        onClick={jump}
        className="relative border-2 border-purple-500/40 rounded-lg overflow-hidden shadow-lg shadow-purple-500/10 cursor-pointer"
      >
        <canvas ref={canvasRef} width={440} height={340} className="bg-zinc-950" />

        {(!gameStarted || gameOver) && (
          <div className="absolute inset-0 bg-black/85 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center z-10">
            <h3 className="text-2xl font-bold mb-2 text-purple-400">
              {gameOver ? 'ROVER CRASHED' : 'LUNAR RUNNER 2'}
            </h3>
            {gameOver && <p className="text-zinc-300 mb-4 font-semibold">Total Distance Score: {score}</p>}
            <button
              onClick={(e) => {
                e.stopPropagation();
                initGame();
              }}
              className="px-6 py-2 bg-gradient-to-r from-purple-500 to-indigo-500 text-white font-bold rounded-lg hover:opacity-90 transition transform hover:scale-105"
            >
              {gameOver ? 'Try Again' : 'Launch Rover'}
            </button>
          </div>
        )}
      </div>

      <p className="text-xs text-zinc-500 mt-3">Space/Up Arrow or Click to jump low-gravity gaps. Left/Right arrows to balance rover tilt in mid-air!</p>
    </div>
  );
}
