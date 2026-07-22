'use client';

import React, { useState, useEffect, useRef } from 'react';

interface Drone {
  id: number;
  x: number;
  y: number;
  speed: number;
  hp: number;
}

interface LightningArc {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  life: number;
}

export default function ElectroStrike2() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [gameState, setGameState] = useState<'START' | 'PLAYING' | 'GAMEOVER'>('START');
  const [score, setScore] = useState(0);
  const [hp, setHp] = useState(100);

  const stateRef = useRef({
    gameState: 'START',
    score: 0,
    hp: 100,
    playerX: 200,
    playerY: 400,
    drones: [] as Drone[],
    arcs: [] as LightningArc[],
    nextId: 1,
    spawnTimer: 0,
  });

  const startGame = () => {
    stateRef.current = {
      gameState: 'PLAYING',
      score: 0,
      hp: 100,
      playerX: 200,
      playerY: 400,
      drones: [],
      arcs: [],
      nextId: 1,
      spawnTimer: 0,
    };
    setScore(0);
    setHp(100);
    setGameState('PLAYING');
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (stateRef.current.gameState !== 'PLAYING' || !canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    stateRef.current.playerX = e.clientX - rect.left;
    stateRef.current.playerY = e.clientY - rect.top;
  };

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const state = stateRef.current;
    if (state.gameState !== 'PLAYING' || !canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const targetX = e.clientX - rect.left;
    const targetY = e.clientY - rect.top;

    // Fire electro strike beam towards click point
    let hitCount = 0;
    const hitDrones: Drone[] = [];

    state.drones.forEach((d) => {
      const dist = Math.hypot(d.x - targetX, d.y - targetY);
      if (dist < 60) {
        d.hp -= 50;
        hitDrones.push(d);
        hitCount++;
        state.arcs.push({
          x1: state.playerX,
          y1: state.playerY,
          x2: d.x,
          y2: d.y,
          life: 8,
        });
      }
    });

    // Chain lightning effect to nearby drones
    hitDrones.forEach((primary) => {
      state.drones.forEach((secondary) => {
        if (secondary.id !== primary.id && Math.hypot(secondary.x - primary.x, secondary.y - primary.y) < 80) {
          secondary.hp -= 25;
          state.arcs.push({
            x1: primary.x,
            y1: primary.y,
            x2: secondary.x,
            y2: secondary.y,
            life: 6,
          });
        }
      });
    });

    if (hitCount === 0) {
      state.arcs.push({
        x1: state.playerX,
        y1: state.playerY,
        x2: targetX,
        y2: targetY,
        life: 5,
      });
    }

    // Clean dead drones
    state.drones = state.drones.filter((d) => {
      if (d.hp <= 0) {
        state.score += 30;
        setScore(state.score);
        return false;
      }
      return true;
    });
  };

  useEffect(() => {
    let animId: number;

    const loop = () => {
      const state = stateRef.current;
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      if (state.gameState === 'PLAYING') {
        // Spawn drones
        state.spawnTimer++;
        if (state.spawnTimer > 40) {
          state.spawnTimer = 0;
          state.drones.push({
            id: state.nextId++,
            x: Math.random() * 360 + 20,
            y: -20,
            speed: 1.5 + Math.random() * 1.5,
            hp: 50,
          });
        }

        // Update drones towards player
        for (let i = state.drones.length - 1; i >= 0; i--) {
          const d = state.drones[i];
          const dx = state.playerX - d.x;
          const dy = state.playerY - d.y;
          const dist = Math.hypot(dx, dy);

          if (dist < 18) {
            state.hp -= 15;
            setHp(Math.max(0, state.hp));
            state.drones.splice(i, 1);

            if (state.hp <= 0) {
              state.gameState = 'GAMEOVER';
              setGameState('GAMEOVER');
              window.dispatchEvent(new CustomEvent('xakteir-game-score', { detail: { score: state.score } }));
            }
          } else {
            d.x += (dx / dist) * d.speed;
            d.y += (dy / dist) * d.speed;
          }
        }

        // Update lightning arc life
        for (let i = state.arcs.length - 1; i >= 0; i--) {
          state.arcs[i].life -= 1;
          if (state.arcs[i].life <= 0) {
            state.arcs.splice(i, 1);
          }
        }
      }

      // Render
      ctx.fillStyle = '#09090b';
      ctx.fillRect(0, 0, 400, 480);

      if (state.gameState === 'PLAYING') {
        // Draw player node
        ctx.beginPath();
        ctx.arc(state.playerX, state.playerY, 12, 0, Math.PI * 2);
        ctx.fillStyle = '#38bdf8';
        ctx.shadowBlur = 15;
        ctx.shadowColor = '#38bdf8';
        ctx.fill();
        ctx.shadowBlur = 0;

        // Draw drones
        state.drones.forEach((d) => {
          ctx.beginPath();
          ctx.arc(d.x, d.y, 10, 0, Math.PI * 2);
          ctx.fillStyle = '#f43f5e';
          ctx.shadowBlur = 8;
          ctx.shadowColor = '#f43f5e';
          ctx.fill();
          ctx.shadowBlur = 0;
        });

        // Draw electric arcs
        ctx.strokeStyle = '#60a5fa';
        ctx.lineWidth = 2;
        state.arcs.forEach((arc) => {
          ctx.beginPath();
          ctx.moveTo(arc.x1, arc.y1);
          // Add jagged lightning mid point
          const midX = (arc.x1 + arc.x2) / 2 + (Math.random() - 0.5) * 20;
          const midY = (arc.y1 + arc.y2) / 2 + (Math.random() - 0.5) * 20;
          ctx.lineTo(midX, midY);
          ctx.lineTo(arc.x2, arc.y2);
          ctx.stroke();
        });
      }

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-[550px] bg-zinc-950 text-white rounded-xl p-4">
      <div className="flex justify-between items-center w-[400px] mb-3">
        <div>
          <h2 className="text-xl font-bold text-blue-400">Electro Strike 2</h2>
          <p className="text-xs text-zinc-400">Chain lightning arcade shooter</p>
        </div>
        <div className="text-right">
          <div className="text-sm font-semibold text-blue-300">Score: {score}</div>
          <div className="text-xs text-emerald-400">Shield HP: {hp}%</div>
        </div>
      </div>

      <div className="relative border border-blue-900/50 rounded-xl overflow-hidden bg-zinc-900">
        <canvas
          ref={canvasRef}
          width={400}
          height={480}
          onMouseMove={handleMouseMove}
          onClick={handleCanvasClick}
          className="cursor-crosshair block"
        />

        {gameState === 'START' && (
          <div className="absolute inset-0 bg-zinc-950/90 flex flex-col items-center justify-center p-6 text-center z-10">
            <h3 className="text-3xl font-extrabold text-blue-400 mb-2">ELECTRO STRIKE 2</h3>
            <p className="text-zinc-400 mb-6 max-w-xs text-sm">
              Move cursor to position ship. Click to discharge high voltage lightning arcs that chain between invading drones!
            </p>
            <button
              onClick={startGame}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg transition"
            >
              Start Game
            </button>
          </div>
        )}

        {gameState === 'GAMEOVER' && (
          <div className="absolute inset-0 bg-zinc-950/90 flex flex-col items-center justify-center p-6 text-center z-10">
            <h3 className="text-3xl font-extrabold text-rose-500 mb-2">SYSTEM OVERLOAD</h3>
            <p className="text-zinc-300 text-lg mb-4">
              Final Score: <span className="text-blue-400 font-bold">{score}</span>
            </p>
            <button
              onClick={startGame}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg transition"
            >
              Play Again
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
