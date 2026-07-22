'use client';

import React, { useEffect, useRef, useState } from 'react';

interface Bullet {
  x: number;
  y: number;
  vx: number;
  vy: number;
}

interface Enemy {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  hp: number;
}

interface Shard {
  x: number;
  y: number;
}

export default function CrystalStrike2() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [score, setScore] = useState(0);
  const [hp, setHp] = useState(100);
  const [hyperEnergy, setHyperEnergy] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);

  const stateRef = useRef({
    px: 220,
    py: 180,
    mouseAngle: 0,
    bullets: [] as Bullet[],
    enemies: [] as Enemy[],
    shards: [] as Shard[],
    keys: { w: false, a: false, s: false, d: false },
    score: 0,
    hp: 100,
    hyperEnergy: 0,
    nextId: 1,
    spawnTimer: 0,
    started: false,
    gameOver: false,
  });

  const initGame = () => {
    stateRef.current = {
      px: 220,
      py: 180,
      mouseAngle: 0,
      bullets: [],
      enemies: [],
      shards: [],
      keys: { w: false, a: false, s: false, d: false },
      score: 0,
      hp: 100,
      hyperEnergy: 0,
      nextId: 1,
      spawnTimer: 0,
      started: true,
      gameOver: false,
    };
    setScore(0);
    setHp(100);
    setHyperEnergy(0);
    setGameOver(false);
    setGameStarted(true);
  };

  const shoot = () => {
    const s = stateRef.current;
    if (!s.started || s.gameOver) return;

    const speed = 8;
    s.bullets.push({
      x: s.px,
      y: s.py,
      vx: Math.cos(s.mouseAngle) * speed,
      vy: Math.sin(s.mouseAngle) * speed,
    });
  };

  const triggerHyper = () => {
    const s = stateRef.current;
    if (s.hyperEnergy >= 100 && s.started && !s.gameOver) {
      s.hyperEnergy = 0;
      setHyperEnergy(0);
      for (let angle = 0; angle < Math.PI * 2; angle += Math.PI / 8) {
        s.bullets.push({
          x: s.px,
          y: s.py,
          vx: Math.cos(angle) * 10,
          vy: Math.sin(angle) * 10,
        });
      }
    }
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;
      stateRef.current.mouseAngle = Math.atan2(my - stateRef.current.py, mx - stateRef.current.px);
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      if (['w', 'a', 's', 'd'].includes(k)) {
        stateRef.current.keys[k as 'w' | 'a' | 's' | 'd'] = true;
      }
      if (e.code === 'Space') {
        triggerHyper();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      if (['w', 'a', 's', 'd'].includes(k)) {
        stateRef.current.keys[k as 'w' | 'a' | 's' | 'd'] = false;
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    let animId: number;

    const loop = () => {
      const s = stateRef.current;

      ctx.fillStyle = '#09090b';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      if (s.started && !s.gameOver) {
        // Player movement
        const moveSpeed = 3.5;
        if (s.keys.w) s.py = Math.max(20, s.py - moveSpeed);
        if (s.keys.s) s.py = Math.min(canvas.height - 20, s.py + moveSpeed);
        if (s.keys.a) s.px = Math.max(20, s.px - moveSpeed);
        if (s.keys.d) s.px = Math.min(canvas.width - 20, s.px + moveSpeed);

        // Spawn Enemies
        s.spawnTimer++;
        if (s.spawnTimer > 35) {
          s.spawnTimer = 0;
          const side = Math.floor(Math.random() * 4);
          let ex = 0,
            ey = 0;
          if (side === 0) {
            ex = Math.random() * canvas.width;
            ey = -20;
          } else if (side === 1) {
            ex = canvas.width + 20;
            ey = Math.random() * canvas.height;
          } else if (side === 2) {
            ex = Math.random() * canvas.width;
            ey = canvas.height + 20;
          } else {
            ex = -20;
            ey = Math.random() * canvas.height;
          }

          const angle = Math.atan2(s.py - ey, s.px - ex);
          const spd = 1.5 + Math.random() * 1.2;
          s.enemies.push({
            id: s.nextId++,
            x: ex,
            y: ey,
            vx: Math.cos(angle) * spd,
            vy: Math.sin(angle) * spd,
            radius: 12,
            hp: 2,
          });
        }

        // Bullets physics
        for (let i = s.bullets.length - 1; i >= 0; i--) {
          const b = s.bullets[i];
          b.x += b.vx;
          b.y += b.vy;

          if (b.x < 0 || b.x > canvas.width || b.y < 0 || b.y > canvas.height) {
            s.bullets.splice(i, 1);
            continue;
          }

          // Bullet - Enemy collision
          for (let j = s.enemies.length - 1; j >= 0; j--) {
            const e = s.enemies[j];
            if (Math.hypot(e.x - b.x, e.y - b.y) < e.radius + 4) {
              e.hp--;
              s.bullets.splice(i, 1);
              if (e.hp <= 0) {
                s.score += 50;
                setScore(s.score);
                s.shards.push({ x: e.x, y: e.y });
                s.enemies.splice(j, 1);
              }
              break;
            }
          }
        }

        // Enemies physics
        for (let i = s.enemies.length - 1; i >= 0; i--) {
          const e = s.enemies[i];
          e.x += e.vx;
          e.y += e.vy;

          // Enemy - Player collision
          if (Math.hypot(e.x - s.px, e.y - s.py) < e.radius + 12) {
            s.hp -= 20;
            setHp(s.hp);
            s.enemies.splice(i, 1);

            if (s.hp <= 0) {
              s.gameOver = true;
              setGameOver(true);
              window.dispatchEvent(new CustomEvent('xakteir-game-score', { detail: { score: s.score } }));
            }
          }
        }

        // Shards collection
        for (let i = s.shards.length - 1; i >= 0; i--) {
          const sh = s.shards[i];
          if (Math.hypot(sh.x - s.px, sh.y - s.py) < 24) {
            s.hyperEnergy = Math.min(100, s.hyperEnergy + 15);
            setHyperEnergy(s.hyperEnergy);
            s.score += 20;
            setScore(s.score);
            s.shards.splice(i, 1);
          }
        }
      }

      // Render Shards
      s.shards.forEach((sh) => {
        ctx.fillStyle = '#38bdf8';
        ctx.shadowBlur = 8;
        ctx.shadowColor = '#38bdf8';
        ctx.beginPath();
        ctx.arc(sh.x, sh.y, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      });

      // Render Bullets
      s.bullets.forEach((b) => {
        ctx.fillStyle = '#f43f5e';
        ctx.beginPath();
        ctx.arc(b.x, b.y, 4, 0, Math.PI * 2);
        ctx.fill();
      });

      // Render Enemies
      s.enemies.forEach((e) => {
        ctx.fillStyle = '#a855f7';
        ctx.shadowBlur = 10;
        ctx.shadowColor = '#a855f7';
        ctx.beginPath();
        ctx.arc(e.x, e.y, e.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      });

      // Render Player Ship
      ctx.save();
      ctx.translate(s.px, s.py);
      ctx.rotate(s.mouseAngle);
      ctx.fillStyle = '#06b6d4';
      ctx.shadowBlur = 12;
      ctx.shadowColor = '#06b6d4';
      ctx.beginPath();
      ctx.moveTo(14, 0);
      ctx.lineTo(-10, -10);
      ctx.lineTo(-6, 0);
      ctx.lineTo(-10, 10);
      ctx.closePath();
      ctx.fill();
      ctx.restore();

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-[450px] bg-zinc-950 text-white p-4 rounded-xl border border-zinc-800">
      <div className="w-full max-w-[440px] flex justify-between items-center mb-2 text-xs font-semibold">
        <span className="text-cyan-400">Shield HP: {hp}%</span>
        <span className="text-sky-400">Hyper Energy: {hyperEnergy}%</span>
        <span className="text-rose-400">Score: {score}</span>
      </div>

      <div
        onClick={shoot}
        className="relative border-2 border-rose-500/40 rounded-lg overflow-hidden shadow-lg shadow-rose-500/10 cursor-pointer"
      >
        <canvas ref={canvasRef} width={440} height={360} className="bg-zinc-950" />

        {(!gameStarted || gameOver) && (
          <div className="absolute inset-0 bg-black/85 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center z-10">
            <h3 className="text-2xl font-bold mb-2 text-rose-400">
              {gameOver ? 'SHIP DESTROYED' : 'CRYSTAL STRIKE 2'}
            </h3>
            {gameOver && <p className="text-zinc-300 mb-4 font-semibold">Final Score: {score}</p>}
            <button
              onClick={(e) => {
                e.stopPropagation();
                initGame();
              }}
              className="px-6 py-2 bg-gradient-to-r from-rose-500 to-red-500 text-white font-bold rounded-lg hover:opacity-90 transition transform hover:scale-105"
            >
              {gameOver ? 'Play Again' : 'Engage Swarm'}
            </button>
          </div>
        )}
      </div>

      <p className="text-xs text-zinc-500 mt-3">WASD to move, Mouse to aim & click to shoot. Space for Hyper Burst at 100%!</p>
    </div>
  );
}
