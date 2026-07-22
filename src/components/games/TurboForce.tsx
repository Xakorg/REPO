'use client';

import React, { useEffect, useRef, useState } from 'react';

interface Mech {
  id: number;
  x: number;
  y: number;
  hp: number;
  maxHp: number;
  speed: number;
}

interface EnergyCanister {
  id: number;
  x: number;
  y: number;
}

interface Bullet {
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  vx: number;
  vy: number;
}

export default function TurboForce() {
  const [gameState, setGameState] = useState<'START' | 'PLAYING' | 'GAMEOVER'>('START');
  const [score, setScore] = useState<number>(0);
  const [energy, setEnergy] = useState<number>(100);
  const [health, setHealth] = useState<number>(100);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const stateRef = useRef({
    gameState: 'START',
    score: 0,
    energy: 100,
    health: 100,
    posX: 250,
    posY: 250,
    targetX: 250,
    targetY: 250,
    mechs: [] as Mech[],
    canisters: [] as EnergyCanister[],
    bullets: [] as Bullet[],
    spawnTimer: 0,
    shootTimer: 0,
    nextId: 1,
  });

  const startGame = () => {
    stateRef.current = {
      gameState: 'PLAYING',
      score: 0,
      energy: 100,
      health: 100,
      posX: 250,
      posY: 250,
      targetX: 250,
      targetY: 250,
      mechs: [],
      canisters: [],
      bullets: [],
      spawnTimer: 0,
      shootTimer: 0,
      nextId: 1,
    };
    setScore(0);
    setEnergy(100);
    setHealth(100);
    setGameState('PLAYING');
  };

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const st = stateRef.current;
    if (st.gameState !== 'PLAYING') return;

    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    st.targetX = e.clientX - rect.left;
    st.targetY = e.clientY - rect.top;
  };

  useEffect(() => {
    let animId: number;

    const update = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const st = stateRef.current;

      ctx.fillStyle = '#080c10';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Strategic Grid lines
      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 1;
      for (let i = 0; i < canvas.width; i += 50) {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i, canvas.height);
        ctx.stroke();
      }
      for (let j = 0; j < canvas.height; j += 50) {
        ctx.beginPath();
        ctx.moveTo(0, j);
        ctx.lineTo(canvas.width, j);
        ctx.stroke();
      }

      if (st.gameState === 'PLAYING') {
        // Commander unit movement towards click target
        const dx = st.targetX - st.posX;
        const dy = st.targetY - st.posY;
        const dist = Math.hypot(dx, dy);

        if (dist > 4) {
          st.posX += (dx / dist) * 3.5;
          st.posY += (dy / dist) * 3.5;
        }

        // Spawn Mechs
        st.spawnTimer++;
        if (st.spawnTimer > Math.max(30, 90 - Math.floor(st.score / 40))) {
          st.spawnTimer = 0;
          const angle = Math.random() * Math.PI * 2;
          const spawnDist = 300;
          st.mechs.push({
            id: st.nextId++,
            x: canvas.width / 2 + Math.cos(angle) * spawnDist,
            y: canvas.height / 2 + Math.sin(angle) * spawnDist,
            hp: 60 + Math.floor(st.score / 30),
            maxHp: 60 + Math.floor(st.score / 30),
            speed: 1.2 + Math.random() * 0.8,
          });

          // Spawn energy canisters occasionally
          if (Math.random() > 0.6) {
            st.canisters.push({
              id: st.nextId++,
              x: 40 + Math.random() * (canvas.width - 80),
              y: 40 + Math.random() * (canvas.height - 80),
            });
          }
        }

        // Commander auto-targeting & shooting
        st.shootTimer++;
        if (st.shootTimer >= 15 && st.mechs.length > 0) {
          st.shootTimer = 0;
          // Find closest mech
          let closest: Mech | null = null;
          let minDist = 300;
          st.mechs.forEach((m) => {
            const d = Math.hypot(m.x - st.posX, m.y - st.posY);
            if (d < minDist) {
              minDist = d;
              closest = m;
            }
          });

          if (closest) {
            const target: Mech = closest;
            const bdx = target.x - st.posX;
            const bdy = target.y - st.posY;
            const bdist = Math.hypot(bdx, bdy);
            st.bullets.push({
              x: st.posX,
              y: st.posY,
              targetX: target.x,
              targetY: target.y,
              vx: (bdx / bdist) * 8,
              vy: (bdy / bdist) * 8,
            });
          }
        }

        // Move Bullets
        for (let i = st.bullets.length - 1; i >= 0; i--) {
          const b = st.bullets[i];
          b.x += b.vx;
          b.y += b.vy;

          let hit = false;
          for (let j = 0; j < st.mechs.length; j++) {
            const m = st.mechs[j];
            if (Math.hypot(m.x - b.x, m.y - b.y) < 20) {
              m.hp -= 30;
              hit = true;
              break;
            }
          }

          if (hit || b.x < 0 || b.x > canvas.width || b.y < 0 || b.y > canvas.height) {
            st.bullets.splice(i, 1);
          }
        }

        // Move Mechs towards Commander
        for (let i = st.mechs.length - 1; i >= 0; i--) {
          const m = st.mechs[i];
          const mdx = st.posX - m.x;
          const mdy = st.posY - m.y;
          const mdist = Math.hypot(mdx, mdy);

          if (mdist > 0) {
            m.x += (mdx / mdist) * m.speed;
            m.y += (mdy / mdist) * m.speed;
          }

          if (m.hp <= 0) {
            st.score += 40;
            setScore(st.score);
            st.mechs.splice(i, 1);
            continue;
          }

          // Damage Commander
          if (mdist < 22) {
            st.health -= 0.6;
            setHealth(Math.max(0, Math.floor(st.health)));

            if (st.health <= 0) {
              st.gameState = 'GAMEOVER';
              setGameState('GAMEOVER');
              window.dispatchEvent(new CustomEvent('xakteir-game-score', { detail: { score: st.score } }));
            }
          }
        }

        // Collect Canisters
        for (let i = st.canisters.length - 1; i >= 0; i--) {
          const c = st.canisters[i];
          if (Math.hypot(c.x - st.posX, c.y - st.posY) < 25) {
            st.energy = Math.min(100, st.energy + 25);
            setEnergy(st.energy);
            st.score += 15;
            setScore(st.score);
            st.canisters.splice(i, 1);
          }
        }

        // Draw Canisters
        st.canisters.forEach((c) => {
          ctx.fillStyle = '#eab308';
          ctx.shadowColor = '#fde047';
          ctx.shadowBlur = 10;
          ctx.fillRect(c.x - 8, c.y - 8, 16, 16);
          ctx.shadowBlur = 0;
        });

        // Draw Bullets
        ctx.fillStyle = '#38bdf8';
        ctx.shadowColor = '#0284c7';
        ctx.shadowBlur = 8;
        st.bullets.forEach((b) => {
          ctx.beginPath();
          ctx.arc(b.x, b.y, 4, 0, Math.PI * 2);
          ctx.fill();
        });
        ctx.shadowBlur = 0;

        // Draw Enemy Mechs
        st.mechs.forEach((m) => {
          ctx.fillStyle = '#f43f5e';
          ctx.beginPath();
          ctx.arc(m.x, m.y, 14, 0, Math.PI * 2);
          ctx.fill();

          // HP bar
          ctx.fillStyle = '#1e293b';
          ctx.fillRect(m.x - 14, m.y - 22, 28, 4);
          ctx.fillStyle = '#22c55e';
          ctx.fillRect(m.x - 14, m.y - 22, (m.hp / m.maxHp) * 28, 4);
        });

        // Draw Commander Unit
        ctx.fillStyle = '#06b6d4';
        ctx.shadowColor = '#22d3ee';
        ctx.shadowBlur = 16;
        ctx.beginPath();
        ctx.arc(st.posX, st.posY, 18, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(st.posX, st.posY, 7, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      }

      animId = requestAnimationFrame(update);
    };

    animId = requestAnimationFrame(update);
    return () => cancelAnimationFrame(animId);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-[500px] bg-zinc-950 text-white rounded-xl p-4">
      <div className="flex justify-between items-center w-full max-w-[500px] mb-3">
        <div>
          <h2 className="text-xl font-bold text-cyan-400">Turbo Force</h2>
          <p className="text-xs text-zinc-400">Click to position your commander & blast enemy mechs!</p>
        </div>
        <div className="text-right">
          <div className="text-sm text-yellow-400">Energy: {energy}%</div>
          <div className="text-sm text-red-400">Health: {health}%</div>
          <div className="text-lg font-semibold text-cyan-400">Score: {score}</div>
        </div>
      </div>

      <div className="relative border border-cyan-900/50 rounded-xl overflow-hidden shadow-2xl bg-zinc-950">
        <canvas ref={canvasRef} width={500} height={450} onClick={handleCanvasClick} className="block cursor-pointer" />

        {gameState === 'START' && (
          <div className="absolute inset-0 bg-zinc-950/90 flex flex-col items-center justify-center p-6 text-center z-10">
            <h3 className="text-3xl font-extrabold text-cyan-400 mb-2">TURBO FORCE</h3>
            <p className="text-zinc-400 mb-6 max-w-xs text-sm">
              Click anywhere on the tactical battlefield to move your commander. Auto-target incoming enemy mechs and collect yellow energy canisters!
            </p>
            <button
              onClick={startGame}
              className="px-6 py-3 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-lg transition shadow-lg shadow-cyan-600/30"
            >
              Start Operation
            </button>
          </div>
        )}

        {gameState === 'GAMEOVER' && (
          <div className="absolute inset-0 bg-zinc-950/90 flex flex-col items-center justify-center p-6 text-center z-10">
            <h3 className="text-3xl font-extrabold text-red-500 mb-2">COMMANDER DOWN</h3>
            <p className="text-zinc-300 text-lg mb-4">
              Final Score: <span className="text-cyan-400 font-bold">{score}</span>
            </p>
            <button
              onClick={startGame}
              className="px-6 py-3 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-lg transition"
            >
              Try Again
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
