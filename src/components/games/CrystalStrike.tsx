'use client';

import React, { useEffect, useRef, useState } from 'react';

interface Crystal {
  id: number;
  x: number;
  y: number;
  speed: number;
  hp: number;
  color: string;
  size: number;
}

interface Laser {
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  life: number;
}

export default function CrystalStrike() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [score, setScore] = useState(0);
  const [nexusHp, setNexusHp] = useState(100);
  const [gameOver, setGameOver] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);

  const stateRef = useRef({
    crystals: [] as Crystal[],
    lasers: [] as Laser[],
    score: 0,
    nexusHp: 100,
    mousePos: { x: 200, y: 200 },
    spawnTimer: 0,
    nextId: 1,
    started: false,
    gameOver: false,
  });

  const initGame = () => {
    stateRef.current = {
      crystals: [],
      lasers: [],
      score: 0,
      nexusHp: 100,
      mousePos: { x: 200, y: 200 },
      spawnTimer: 0,
      nextId: 1,
      started: true,
      gameOver: false,
    };
    setScore(0);
    setNexusHp(100);
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
      stateRef.current.mousePos = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      };
    };

    const handleClick = (e: MouseEvent) => {
      const s = stateRef.current;
      if (!s.started || s.gameOver) return;

      const rect = canvas.getBoundingClientRect();
      const targetX = e.clientX - rect.left;
      const targetY = e.clientY - rect.top;

      s.lasers.push({
        x: 200,
        y: 200,
        targetX,
        targetY,
        life: 8,
      });

      // Hit detection
      for (let i = s.crystals.length - 1; i >= 0; i--) {
        const c = s.crystals[i];
        const dist = Math.hypot(c.x - targetX, c.y - targetY);
        if (dist <= c.size + 15) {
          c.hp -= 1;
          if (c.hp <= 0) {
            s.crystals.splice(i, 1);
            s.score += 50;
            setScore(s.score);
          }
          break;
        }
      }
    };

    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('click', handleClick);

    let animId: number;

    const loop = () => {
      const s = stateRef.current;

      ctx.fillStyle = '#09090b';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      if (s.started && !s.gameOver) {
        // Spawn crystals
        s.spawnTimer += 1;
        if (s.spawnTimer >= 40) {
          s.spawnTimer = 0;
          const angle = Math.random() * Math.PI * 2;
          const dist = 260;
          const cx = 200 + Math.cos(angle) * dist;
          const cy = 200 + Math.sin(angle) * dist;
          const colors = ['#ec4899', '#a855f7', '#3b82f6', '#ef4444'];

          s.crystals.push({
            id: s.nextId++,
            x: cx,
            y: cy,
            speed: 1 + Math.random() * 0.8,
            hp: Math.random() > 0.7 ? 2 : 1,
            color: colors[Math.floor(Math.random() * colors.length)],
            size: 12,
          });
        }

        // Move crystals towards center (200, 200)
        for (let i = s.crystals.length - 1; i >= 0; i--) {
          const c = s.crystals[i];
          const dx = 200 - c.x;
          const dy = 200 - c.y;
          const dist = Math.hypot(dx, dy);

          if (dist < 25) {
            // Hit core
            s.nexusHp = Math.max(0, s.nexusHp - 15);
            setNexusHp(s.nexusHp);
            s.crystals.splice(i, 1);

            if (s.nexusHp <= 0) {
              s.gameOver = true;
              setGameOver(true);
              window.dispatchEvent(
                new CustomEvent('xakteir-game-score', { detail: { score: s.score } })
              );
            }
          } else {
            c.x += (dx / dist) * c.speed;
            c.y += (dy / dist) * c.speed;
          }
        }
      }

      // Draw Center Nexus
      ctx.shadowBlur = 20;
      ctx.shadowColor = '#06b6d4';
      ctx.fillStyle = '#06b6d4';
      ctx.beginPath();
      ctx.arc(200, 200, 22, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      // Draw Lasers
      s.lasers.forEach((l, idx) => {
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(l.x, l.y);
        ctx.lineTo(l.targetX, l.targetY);
        ctx.stroke();
        l.life -= 1;
      });
      s.lasers = s.lasers.filter((l) => l.life > 0);

      // Draw Crystals
      s.crystals.forEach((c) => {
        ctx.shadowBlur = 12;
        ctx.shadowColor = c.color;
        ctx.fillStyle = c.color;
        ctx.beginPath();
        ctx.arc(c.x, c.y, c.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      });

      // Draw Crosshair
      ctx.strokeStyle = '#f43f5e';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(s.mousePos.x, s.mousePos.y, 10, 0, Math.PI * 2);
      ctx.moveTo(s.mousePos.x - 14, s.mousePos.y);
      ctx.lineTo(s.mousePos.x + 14, s.mousePos.y);
      ctx.moveTo(s.mousePos.x, s.mousePos.y - 14);
      ctx.lineTo(s.mousePos.x, s.mousePos.y + 14);
      ctx.stroke();

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(animId);
      canvas.removeEventListener('mousemove', handleMouseMove);
      canvas.removeEventListener('click', handleClick);
    };
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-[450px] bg-zinc-950 text-white p-4 rounded-xl border border-zinc-800">
      <div className="w-full max-w-[400px] flex justify-between items-center mb-3">
        <h2 className="text-xl font-bold text-rose-500">CRYSTAL STRIKE</h2>
        <div className="flex gap-2 text-xs font-semibold">
          <span className="bg-cyan-950 text-cyan-400 px-3 py-1 rounded-full border border-cyan-800">
            Nexus: {nexusHp} HP
          </span>
          <span className="bg-zinc-900 px-3 py-1 rounded-full border border-zinc-800 text-rose-400">
            Score: {score}
          </span>
        </div>
      </div>

      <div className="relative border-2 border-rose-500/40 rounded-lg overflow-hidden shadow-lg shadow-rose-500/10 cursor-none">
        <canvas ref={canvasRef} width={400} height={400} className="bg-zinc-950" />

        {(!gameStarted || gameOver) && (
          <div className="absolute inset-0 bg-black/85 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center z-10 cursor-default">
            <h3 className="text-2xl font-bold mb-2 text-rose-500">
              {gameOver ? 'NEXUS DESTROYED!' : 'CRYSTAL STRIKE'}
            </h3>
            {gameOver && <p className="text-zinc-300 mb-4">Defense Score: {score}</p>}
            <button
              onClick={initGame}
              className="px-6 py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-lg transition transform hover:scale-105"
            >
              {gameOver ? 'Play Again' : 'Defend Nexus'}
            </button>
          </div>
        )}
      </div>

      <p className="text-xs text-zinc-500 mt-3">Aim with crosshair and click to shoot incoming dark crystals!</p>
    </div>
  );
}
