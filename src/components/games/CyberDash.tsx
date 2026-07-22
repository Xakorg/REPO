'use client';

import React, { useEffect, useRef, useState } from 'react';

export default function CyberDash() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);

  const stateRef = useRef({
    lane: 1, // 0: left, 1: center, 2: right
    isJumping: false,
    jumpY: 0,
    jumpVelocity: 0,
    speed: 5,
    score: 0,
    obstacles: [] as { lane: number; y: number; type: 'wall' | 'chip' }[],
    spawnTimer: 0,
    started: false,
    gameOver: false,
  });

  const initGame = () => {
    stateRef.current = {
      lane: 1,
      isJumping: false,
      jumpY: 0,
      jumpVelocity: 0,
      speed: 5,
      score: 0,
      obstacles: [],
      spawnTimer: 0,
      started: true,
      gameOver: false,
    };
    setScore(0);
    setGameOver(false);
    setGameStarted(true);
  };

  const moveLeft = () => {
    if (stateRef.current.lane > 0) stateRef.current.lane--;
  };

  const moveRight = () => {
    if (stateRef.current.lane < 2) stateRef.current.lane++;
  };

  const jump = () => {
    if (!stateRef.current.isJumping) {
      stateRef.current.isJumping = true;
      stateRef.current.jumpVelocity = 12;
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' || e.key === 'a') moveLeft();
      if (e.key === 'ArrowRight' || e.key === 'd') moveRight();
      if (e.key === 'ArrowUp' || e.key === ' ' || e.key === 'w') jump();
    };

    window.addEventListener('keydown', handleKeyDown);

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let gridOffset = 0;

    const loop = () => {
      const s = stateRef.current;

      // Clear background
      ctx.fillStyle = '#05050a';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      if (s.started && !s.gameOver) {
        s.speed += 0.001;
        s.score += Math.floor(s.speed / 2);
        setScore(s.score);

        // Jump physics
        if (s.isJumping) {
          s.jumpY += s.jumpVelocity;
          s.jumpVelocity -= 0.8;
          if (s.jumpY <= 0) {
            s.jumpY = 0;
            s.isJumping = false;
          }
        }

        // Spawn obstacles & chips
        s.spawnTimer += s.speed;
        if (s.spawnTimer > 120) {
          s.spawnTimer = 0;
          const lane = Math.floor(Math.random() * 3);
          const isChip = Math.random() > 0.6;
          s.obstacles.push({ lane, y: -40, type: isChip ? 'chip' : 'wall' });
        }

        // Move obstacles
        s.obstacles.forEach((obs) => {
          obs.y += s.speed;
        });

        // Check collisions & cleanup
        const playerY = canvas.height - 80 - s.jumpY;
        const playerLaneX = [80, 200, 320][s.lane];

        for (let i = s.obstacles.length - 1; i >= 0; i--) {
          const obs = s.obstacles[i];
          const obsX = [80, 200, 320][obs.lane];

          if (obs.y > canvas.height + 50) {
            s.obstacles.splice(i, 1);
            continue;
          }

          // Collision detection box
          if (
            Math.abs(obsX - playerLaneX) < 30 &&
            obs.y > playerY - 20 &&
            obs.y < playerY + 40
          ) {
            if (obs.type === 'chip') {
              s.score += 250;
              setScore(s.score);
              s.obstacles.splice(i, 1);
            } else {
              // Hit wall - jump can avoid low walls if jumpY > 25
              if (s.jumpY < 25) {
                s.gameOver = true;
                setGameOver(true);
                window.dispatchEvent(
                  new CustomEvent('xakteir-game-score', { detail: { score: s.score } })
                );
              }
            }
          }
        }
      }

      // Draw Grid Lines (moving down)
      gridOffset = (gridOffset + (s.started && !s.gameOver ? s.speed : 1)) % 40;
      ctx.strokeStyle = 'rgba(6, 182, 212, 0.2)';
      ctx.lineWidth = 1;

      // Lane dividers
      [140, 260].forEach((x) => {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
      });

      // Horizontal moving grid lines
      for (let y = gridOffset; y < canvas.height; y += 40) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
      }

      // Draw Obstacles & Chips
      s.obstacles.forEach((obs) => {
        const x = [80, 200, 320][obs.lane];
        if (obs.type === 'wall') {
          ctx.shadowBlur = 10;
          ctx.shadowColor = '#f43f5e';
          ctx.fillStyle = '#f43f5e';
          ctx.fillRect(x - 25, obs.y - 15, 50, 30);
          ctx.shadowBlur = 0;
        } else {
          ctx.shadowBlur = 12;
          ctx.shadowColor = '#eab308';
          ctx.fillStyle = '#eab308';
          ctx.beginPath();
          ctx.arc(x, obs.y, 14, 0, Math.PI * 2);
          ctx.fill();
          ctx.shadowBlur = 0;
        }
      });

      // Draw Player Cyber Car
      const px = [80, 200, 320][s.lane];
      const py = canvas.height - 80 - s.jumpY;

      ctx.shadowBlur = 15;
      ctx.shadowColor = '#06b6d4';
      ctx.fillStyle = '#06b6d4';
      // Main car body
      ctx.fillRect(px - 20, py - 30, 40, 50);
      // Windshield
      ctx.fillStyle = '#ec4899';
      ctx.fillRect(px - 14, py - 20, 28, 15);
      // Thrusters tail glow
      ctx.shadowColor = '#3b82f6';
      ctx.fillStyle = '#3b82f6';
      ctx.fillRect(px - 15, py + 20, 10, 8);
      ctx.fillRect(px + 5, py + 20, 10, 8);
      ctx.shadowBlur = 0;

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-[450px] bg-zinc-950 text-white p-4 rounded-xl border border-zinc-800">
      <div className="w-full max-w-[400px] flex justify-between items-center mb-3">
        <h2 className="text-xl font-bold text-cyan-400">CYBER DASH</h2>
        <div className="text-sm font-semibold bg-zinc-900 px-3 py-1 rounded-full border border-zinc-800">
          Score: <span className="text-yellow-400">{score}</span>
        </div>
      </div>

      <div className="relative border-2 border-cyan-500/40 rounded-lg overflow-hidden shadow-lg shadow-cyan-500/10">
        <canvas ref={canvasRef} width={400} height={400} className="bg-zinc-950" />

        {(!gameStarted || gameOver) && (
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center">
            <h3 className="text-2xl font-bold mb-2 text-cyan-400">{gameOver ? 'CRASHED!' : 'CYBER DASH'}</h3>
            {gameOver && <p className="text-zinc-300 mb-4">Distance Score: {score}</p>}
            <button
              onClick={initGame}
              className="px-6 py-2 bg-gradient-to-r from-cyan-500 to-pink-500 text-white font-bold rounded-lg hover:opacity-90 transition transform hover:scale-105"
            >
              {gameOver ? 'Try Again' : 'Start Dash'}
            </button>
          </div>
        )}
      </div>

      <div className="flex gap-4 mt-3">
        <button
          onClick={moveLeft}
          className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-xs font-bold border border-zinc-700"
        >
          ◀ LEFT
        </button>
        <button
          onClick={jump}
          className="px-6 py-2 bg-cyan-600 hover:bg-cyan-500 rounded-lg text-xs font-bold border border-cyan-400 shadow-md shadow-cyan-500/20"
        >
          ▲ JUMP
        </button>
        <button
          onClick={moveRight}
          className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-xs font-bold border border-zinc-700"
        >
          RIGHT ▶
        </button>
      </div>
      <p className="text-xs text-zinc-500 mt-2">Use Arrow keys or buttons to dodge walls and grab yellow power chips!</p>
    </div>
  );
}
