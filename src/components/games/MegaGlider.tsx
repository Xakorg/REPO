'use client';

import React, { useEffect, useRef, useState } from 'react';

interface SkyItem {
  id: number;
  x: number;
  y: number;
  type: 'ring' | 'thermal' | 'storm';
}

export default function MegaGlider() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [gameState, setGameState] = useState<'START' | 'PLAYING' | 'GAMEOVER'>('START');
  const [score, setScore] = useState<number>(0);
  const [altitude, setAltitude] = useState<number>(100);

  const stateRef = useRef({
    gameState: 'START',
    score: 0,
    altitude: 100,
    gx: 225,
    items: [] as SkyItem[],
    nextItemId: 1,
    spawnTimer: 0,
  });

  const startGame = () => {
    stateRef.current = {
      gameState: 'PLAYING',
      score: 0,
      altitude: 100,
      gx: 225,
      items: [],
      nextItemId: 1,
      spawnTimer: 0,
    };
    setScore(0);
    setAltitude(100);
    setGameState('PLAYING');
  };

  useEffect(() => {
    let animId: number;

    const handleMouseMove = (e: MouseEvent) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      stateRef.current.gx = Math.max(20, Math.min(canvas.width - 20, e.clientX - rect.left));
    };

    window.addEventListener('mousemove', handleMouseMove);

    const update = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Sky background gradient
      const skyGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
      skyGrad.addColorStop(0, '#0284c7');
      skyGrad.addColorStop(1, '#09090b');
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const st = stateRef.current;

      if (st.gameState === 'PLAYING') {
        // Natural descent
        st.altitude -= 0.12;
        st.score += 1;
        setScore(st.score);
        setAltitude(Math.max(0, Math.floor(st.altitude)));

        if (st.altitude <= 0) {
          st.gameState = 'GAMEOVER';
          setGameState('GAMEOVER');
          window.dispatchEvent(new CustomEvent('xakteir-game-score', { detail: { score: st.score } }));
        }

        // Spawn Items
        st.spawnTimer++;
        if (st.spawnTimer > 30) {
          st.spawnTimer = 0;
          const rand = Math.random();
          const type: 'ring' | 'thermal' | 'storm' = rand > 0.6 ? 'ring' : rand > 0.3 ? 'thermal' : 'storm';
          st.items.push({
            id: st.nextItemId++,
            x: Math.random() * (canvas.width - 60) + 30,
            y: -30,
            type,
          });
        }

        // Update Items
        for (let i = st.items.length - 1; i >= 0; i--) {
          const item = st.items[i];
          item.y += 3.5;

          // Glider collision (Glider fixed at y = 380)
          if (Math.hypot(item.x - st.gx, item.y - 380) < 30) {
            if (item.type === 'ring') {
              st.score += 150;
              setScore(st.score);
            } else if (item.type === 'thermal') {
              st.altitude = Math.min(100, st.altitude + 20);
            } else if (item.type === 'storm') {
              st.altitude = Math.max(0, st.altitude - 25);
            }
            st.items.splice(i, 1);
            continue;
          }

          if (item.y > canvas.height + 40) {
            st.items.splice(i, 1);
          }
        }

        // Draw Sky Items
        st.items.forEach((item) => {
          if (item.type === 'ring') {
            ctx.strokeStyle = '#facc15';
            ctx.lineWidth = 4;
            ctx.shadowColor = '#fef08a';
            ctx.shadowBlur = 10;
            ctx.beginPath();
            ctx.arc(item.x, item.y, 20, 0, Math.PI * 2);
            ctx.stroke();
            ctx.shadowBlur = 0;
          } else if (item.type === 'thermal') {
            ctx.fillStyle = '#38bdf8';
            ctx.shadowColor = '#7dd3fc';
            ctx.shadowBlur = 10;
            ctx.beginPath();
            ctx.arc(item.x, item.y, 16, 0, Math.PI * 2);
            ctx.fill();
            ctx.shadowBlur = 0;
          } else {
            ctx.fillStyle = '#64748b';
            ctx.beginPath();
            ctx.arc(item.x, item.y, 22, 0, Math.PI * 2);
            ctx.fill();
          }
        });

        // Draw Glider Wing
        ctx.fillStyle = '#ec4899';
        ctx.shadowColor = '#f472b6';
        ctx.shadowBlur = 12;
        ctx.beginPath();
        ctx.moveTo(st.gx, 365);
        ctx.lineTo(st.gx - 30, 395);
        ctx.lineTo(st.gx + 30, 395);
        ctx.closePath();
        ctx.fill();
        ctx.shadowBlur = 0;
      }

      animId = requestAnimationFrame(update);
    };

    animId = requestAnimationFrame(update);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      cancelAnimationFrame(animId);
    };
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-[520px] bg-zinc-950 text-white rounded-xl p-4">
      <div className="flex justify-between items-center w-full max-w-[450px] mb-3">
        <div>
          <h2 className="text-xl font-bold text-sky-400">Mega Glider</h2>
          <p className="text-xs text-zinc-400">Glide through rings & catch thermal updrafts!</p>
        </div>
        <div className="text-right">
          <div className="text-lg font-semibold text-sky-300">Score: {score}</div>
          <div className="text-xs text-amber-400">Altitude: {altitude}%</div>
        </div>
      </div>

      <div className="relative border border-sky-900/50 rounded-xl overflow-hidden shadow-2xl bg-zinc-950">
        <canvas ref={canvasRef} width={450} height={500} className="block cursor-none" />

        {gameState === 'START' && (
          <div className="absolute inset-0 bg-zinc-950/90 flex flex-col items-center justify-center p-6 text-center z-10">
            <h3 className="text-3xl font-extrabold text-sky-400 mb-2">MEGA GLIDER</h3>
            <p className="text-zinc-400 mb-6 max-w-xs text-sm">
              Steer glider left & right with your mouse. Catch blue thermal currents to gain altitude, pass through yellow rings for bonus points, and dodge grey storm clouds!
            </p>
            <button
              onClick={startGame}
              className="px-6 py-3 bg-sky-600 hover:bg-sky-500 text-white font-bold rounded-lg transition shadow-lg shadow-sky-600/30"
            >
              Take Flight
            </button>
          </div>
        )}

        {gameState === 'GAMEOVER' && (
          <div className="absolute inset-0 bg-zinc-950/90 flex flex-col items-center justify-center p-6 text-center z-10">
            <h3 className="text-3xl font-extrabold text-red-500 mb-2">TOUCHDOWN</h3>
            <p className="text-zinc-300 text-lg mb-4">
              Final Score: <span className="text-sky-400 font-bold">{score}</span>
            </p>
            <button
              onClick={startGame}
              className="px-6 py-3 bg-sky-600 hover:bg-sky-500 text-white font-bold rounded-lg transition"
            >
              Fly Again
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
