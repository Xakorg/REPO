'use client';

import React, { useEffect, useRef, useState } from 'react';

interface Brick {
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
  hp: number;
  maxHp: number;
  pts: number;
}

interface Ball {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  active: boolean;
}

interface PowerUp {
  x: number;
  y: number;
  type: 'multiball' | 'laser' | 'wide';
  vy: number;
}

interface Laser {
  x: number;
  y: number;
  vy: number;
}

export default function NeonBounce2() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [gameOver, setGameOver] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);

  const stateRef = useRef({
    paddleX: 200,
    paddleWidth: 90,
    paddleHeight: 14,
    balls: [] as Ball[],
    bricks: [] as Brick[],
    powerUps: [] as PowerUp[],
    lasers: [] as Laser[],
    laserTime: 0,
    score: 0,
    lives: 3,
    started: false,
    gameOver: false,
  });

  const createBricks = () => {
    const bricks: Brick[] = [];
    const rows = 5;
    const cols = 8;
    const padding = 6;
    const brickW = (400 - (cols + 1) * padding) / cols;
    const brickH = 18;
    const colors = ['#f43f5e', '#a855f7', '#3b82f6', '#10b981', '#f59e0b'];

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const hp = r === 0 ? 2 : 1;
        bricks.push({
          x: padding + c * (brickW + padding),
          y: 40 + r * (brickH + padding),
          width: brickW,
          height: brickH,
          color: colors[r % colors.length],
          hp,
          maxHp: hp,
          pts: (rows - r) * 20,
        });
      }
    }
    return bricks;
  };

  const initGame = () => {
    stateRef.current = {
      paddleX: 155,
      paddleWidth: 90,
      paddleHeight: 14,
      balls: [{ x: 200, y: 350, vx: 3.5 * (Math.random() > 0.5 ? 1 : -1), vy: -4, radius: 7, active: true }],
      bricks: createBricks(),
      powerUps: [],
      lasers: [],
      laserTime: 0,
      score: 0,
      lives: 3,
      started: true,
      gameOver: false,
    };
    setScore(0);
    setLives(3);
    setGameOver(false);
    setGameStarted(true);
  };

  const fireLaser = () => {
    const s = stateRef.current;
    if (s.laserTime > 0 && s.started && !s.gameOver) {
      s.lasers.push({ x: s.paddleX + 15, y: 380, vy: -8 });
      s.lasers.push({ x: s.paddleX + s.paddleWidth - 15, y: 380, vy: -8 });
    }
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const rx = e.clientX - rect.left;
      const pw = stateRef.current.paddleWidth;
      stateRef.current.paddleX = Math.max(0, Math.min(canvas.width - pw, rx - pw / 2));
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        fireLaser();
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('keydown', handleKeyDown);

    let animId: number;

    const loop = () => {
      const s = stateRef.current;

      ctx.fillStyle = '#09090b';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      if (s.started && !s.gameOver) {
        if (s.laserTime > 0) s.laserTime--;

        // Move & draw lasers
        ctx.fillStyle = '#f43f5e';
        for (let i = s.lasers.length - 1; i >= 0; i--) {
          const l = s.lasers[i];
          l.y += l.vy;
          ctx.fillRect(l.x - 2, l.y, 4, 10);

          // Check brick collisions
          for (const b of s.bricks) {
            if (b.hp > 0 && l.x >= b.x && l.x <= b.x + b.width && l.y >= b.y && l.y <= b.y + b.height) {
              b.hp--;
              s.lasers.splice(i, 1);
              if (b.hp <= 0) {
                s.score += b.pts;
                setScore(s.score);
              }
              break;
            }
          }
          if (l.y < 0) s.lasers.splice(i, 1);
        }

        // Move balls
        let activeBallsCount = 0;
        s.balls.forEach((ball) => {
          if (!ball.active) return;
          activeBallsCount++;

          ball.x += ball.vx;
          ball.y += ball.vy;

          if (ball.x - ball.radius < 0) {
            ball.x = ball.radius;
            ball.vx *= -1;
          }
          if (ball.x + ball.radius > canvas.width) {
            ball.x = canvas.width - ball.radius;
            ball.vx *= -1;
          }
          if (ball.y - ball.radius < 0) {
            ball.y = ball.radius;
            ball.vy *= -1;
          }

          // Paddle collision
          const paddleY = canvas.height - 30;
          if (
            ball.y + ball.radius >= paddleY &&
            ball.y - ball.radius <= paddleY + s.paddleHeight &&
            ball.x >= s.paddleX &&
            ball.x <= s.paddleX + s.paddleWidth
          ) {
            ball.vy = -Math.abs(ball.vy);
            const hitPos = (ball.x - (s.paddleX + s.paddleWidth / 2)) / (s.paddleWidth / 2);
            ball.vx = hitPos * 5;
          }

          // Brick collision
          s.bricks.forEach((b) => {
            if (b.hp <= 0) return;
            if (
              ball.x + ball.radius > b.x &&
              ball.x - ball.radius < b.x + b.width &&
              ball.y + ball.radius > b.y &&
              ball.y - ball.radius < b.y + b.height
            ) {
              b.hp--;
              ball.vy *= -1;
              if (b.hp <= 0) {
                s.score += b.pts;
                setScore(s.score);

                // Spawn powerup chance
                if (Math.random() < 0.25) {
                  const types: ('multiball' | 'laser' | 'wide')[] = ['multiball', 'laser', 'wide'];
                  s.powerUps.push({
                    x: b.x + b.width / 2,
                    y: b.y + b.height / 2,
                    type: types[Math.floor(Math.random() * types.length)],
                    vy: 2,
                  });
                }
              }
            }
          });

          // Ball lost bottom
          if (ball.y - ball.radius > canvas.height) {
            ball.active = false;
          }
        });

        if (activeBallsCount === 0) {
          s.lives--;
          setLives(s.lives);
          if (s.lives <= 0) {
            s.gameOver = true;
            setGameOver(true);
            window.dispatchEvent(new CustomEvent('xakteir-game-score', { detail: { score: s.score } }));
          } else {
            s.balls = [{ x: s.paddleX + s.paddleWidth / 2, y: 350, vx: 3.5, vy: -4, radius: 7, active: true }];
          }
        }

        // Check if all bricks cleared
        if (s.bricks.every((b) => b.hp <= 0)) {
          s.score += 500;
          setScore(s.score);
          s.bricks = createBricks();
        }

        // Move powerups
        for (let i = s.powerUps.length - 1; i >= 0; i--) {
          const p = s.powerUps[i];
          p.y += p.vy;

          const paddleY = canvas.height - 30;
          if (
            p.y >= paddleY &&
            p.y <= paddleY + s.paddleHeight &&
            p.x >= s.paddleX &&
            p.x <= s.paddleX + s.paddleWidth
          ) {
            if (p.type === 'multiball') {
              s.balls.push({ x: p.x, y: paddleY - 10, vx: -3, vy: -4, radius: 7, active: true });
              s.balls.push({ x: p.x, y: paddleY - 10, vx: 3, vy: -4, radius: 7, active: true });
            } else if (p.type === 'laser') {
              s.laserTime = 300;
            } else if (p.type === 'wide') {
              s.paddleWidth = Math.min(150, s.paddleWidth + 25);
            }
            s.powerUps.splice(i, 1);
          } else if (p.y > canvas.height) {
            s.powerUps.splice(i, 1);
          }
        }
      }

      // Draw bricks
      s.bricks.forEach((b) => {
        if (b.hp <= 0) return;
        ctx.fillStyle = b.hp === 2 ? '#e11d48' : b.color;
        ctx.shadowBlur = 8;
        ctx.shadowColor = b.color;
        ctx.fillRect(b.x, b.y, b.width, b.height);
        ctx.shadowBlur = 0;
      });

      // Draw paddle
      const paddleY = canvas.height - 30;
      ctx.fillStyle = s.laserTime > 0 ? '#f43f5e' : '#06b6d4';
      ctx.shadowBlur = 12;
      ctx.shadowColor = ctx.fillStyle;
      ctx.fillRect(s.paddleX, paddleY, s.paddleWidth, s.paddleHeight);
      ctx.shadowBlur = 0;

      // Draw powerups
      s.powerUps.forEach((p) => {
        ctx.fillStyle = p.type === 'multiball' ? '#eab308' : p.type === 'laser' ? '#f43f5e' : '#10b981';
        ctx.beginPath();
        ctx.arc(p.x, p.y, 8, 0, Math.PI * 2);
        ctx.fill();
      });

      // Draw balls
      s.balls.forEach((ball) => {
        if (!ball.active) return;
        ctx.fillStyle = '#ffffff';
        ctx.shadowBlur = 10;
        ctx.shadowColor = '#06b6d4';
        ctx.beginPath();
        ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      });

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-[450px] bg-zinc-950 text-white p-4 rounded-xl border border-zinc-800">
      <div className="w-full max-w-[400px] flex justify-between items-center mb-2">
        <h2 className="text-xl font-bold text-cyan-400">NEON BOUNCE 2</h2>
        <div className="flex gap-2 text-xs font-semibold">
          <span className="bg-zinc-900 px-3 py-1 rounded-full border border-zinc-800 text-rose-400">
            Lives: {lives}
          </span>
          <span className="bg-zinc-900 px-3 py-1 rounded-full border border-zinc-800 text-cyan-400">
            Score: {score}
          </span>
        </div>
      </div>

      <div
        onClick={fireLaser}
        className="relative border-2 border-cyan-500/40 rounded-lg overflow-hidden shadow-lg shadow-cyan-500/10 cursor-pointer"
      >
        <canvas ref={canvasRef} width={400} height={450} className="bg-zinc-950" />

        {(!gameStarted || gameOver) && (
          <div className="absolute inset-0 bg-black/85 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center z-10">
            <h3 className="text-2xl font-bold mb-2 text-cyan-400">{gameOver ? 'GAME OVER' : 'NEON BOUNCE 2'}</h3>
            {gameOver && <p className="text-zinc-300 mb-4">Final Score: {score}</p>}
            <button
              onClick={(e) => {
                e.stopPropagation();
                initGame();
              }}
              className="px-6 py-2 bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-bold rounded-lg hover:opacity-90 transition transform hover:scale-105"
            >
              {gameOver ? 'Play Again' : 'Start Game'}
            </button>
          </div>
        )}
      </div>

      <p className="text-xs text-zinc-500 mt-3">Move mouse to guide paddle. Click or press Space to fire laser!</p>
    </div>
  );
}
