'use client';

import React, { useEffect, useRef, useState } from 'react';

interface Node {
  id: number;
  x: number;
  y: number;
  radius: number;
  color: string;
  points: number;
}

export default function QuantumBounce() {
  const [gameState, setGameState] = useState<'START' | 'PLAYING' | 'GAMEOVER'>('START');
  const [score, setScore] = useState<number>(0);
  const [combo, setCombo] = useState<number>(1);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const stateRef = useRef({
    gameState: 'START',
    score: 0,
    combo: 1,
    paddleX: 250,
    paddleWidth: 100,
    ballX: 250,
    ballY: 250,
    ballVx: 4,
    ballVy: -4,
    nodes: [] as Node[],
    keys: { left: false, right: false },
    nextId: 1,
  });

  const initNodes = () => {
    const nodes: Node[] = [];
    const colors = ['#38bdf8', '#a855f7', '#f43f5e', '#eab308', '#22c55e'];
    let id = 1;
    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 6; c++) {
        nodes.push({
          id: id++,
          x: 60 + c * 75,
          y: 60 + r * 45,
          radius: 18,
          color: colors[(r + c) % colors.length],
          points: (4 - r) * 50,
        });
      }
    }
    return nodes;
  };

  const startGame = () => {
    stateRef.current = {
      gameState: 'PLAYING',
      score: 0,
      combo: 1,
      paddleX: 250,
      paddleWidth: 100,
      ballX: 250,
      ballY: 350,
      ballVx: (Math.random() > 0.5 ? 1 : -1) * (3.5 + Math.random() * 2),
      ballVy: -5,
      nodes: initNodes(),
      keys: { left: false, right: false },
      nextId: 1,
    };
    setScore(0);
    setCombo(1);
    setGameState('PLAYING');
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const k = stateRef.current.keys;
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') k.left = true;
      if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') k.right = true;
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const k = stateRef.current.keys;
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') k.left = false;
      if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') k.right = false;
    };

    const handleMouseMove = (e: MouseEvent) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const st = stateRef.current;
      if (st.gameState === 'PLAYING') {
        st.paddleX = Math.max(st.paddleWidth / 2, Math.min(canvas.width - st.paddleWidth / 2, e.clientX - rect.left));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('mousemove', handleMouseMove);

    let animId: number;

    const update = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const st = stateRef.current;

      ctx.fillStyle = '#090814';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      if (st.gameState === 'PLAYING') {
        // Paddle movement via keys
        if (st.keys.left && st.paddleX > st.paddleWidth / 2) st.paddleX -= 7;
        if (st.keys.right && st.paddleX < canvas.width - st.paddleWidth / 2) st.paddleX += 7;

        // Move Ball
        st.ballX += st.ballVx;
        st.ballY += st.ballVy;

        // Wall Bounces
        if (st.ballX - 10 <= 0 || st.ballX + 10 >= canvas.width) {
          st.ballVx *= -1;
        }
        if (st.ballY - 10 <= 0) {
          st.ballVy *= -1;
        }

        // Paddle Collision
        const paddleY = canvas.height - 30;
        if (
          st.ballY + 10 >= paddleY &&
          st.ballY - 10 <= paddleY + 14 &&
          st.ballX >= st.paddleX - st.paddleWidth / 2 &&
          st.ballX <= st.paddleX + st.paddleWidth / 2
        ) {
          const hitPos = (st.ballX - st.paddleX) / (st.paddleWidth / 2);
          st.ballVx = hitPos * 6;
          st.ballVy = -Math.abs(st.ballVy);
          st.combo = 1;
          setCombo(1);
        }

        // Node Collisions
        for (let i = st.nodes.length - 1; i >= 0; i--) {
          const node = st.nodes[i];
          const dist = Math.hypot(st.ballX - node.x, st.ballY - node.y);
          if (dist < 10 + node.radius) {
            st.ballVy *= -1;
            st.score += node.points * st.combo;
            st.combo += 1;
            setScore(st.score);
            setCombo(st.combo);
            st.nodes.splice(i, 1);

            // Respawn nodes if all cleared
            if (st.nodes.length === 0) {
              st.nodes = initNodes();
              st.ballVy *= 1.1;
            }
            break;
          }
        }

        // Fall Off Bottom
        if (st.ballY > canvas.height + 20) {
          st.gameState = 'GAMEOVER';
          setGameState('GAMEOVER');
          window.dispatchEvent(new CustomEvent('xakteir-game-score', { detail: { score: st.score } }));
        }

        // Draw Nodes
        st.nodes.forEach((node) => {
          ctx.fillStyle = node.color;
          ctx.shadowColor = node.color;
          ctx.shadowBlur = 12;
          ctx.beginPath();
          ctx.arc(node.x, node.y, node.radius, 0, Math.PI * 2);
          ctx.fill();
          ctx.shadowBlur = 0;
        });

        // Draw Paddle
        ctx.fillStyle = '#a855f7';
        ctx.shadowColor = '#c084fc';
        ctx.shadowBlur = 15;
        ctx.beginPath();
        ctx.roundRect(st.paddleX - st.paddleWidth / 2, paddleY, st.paddleWidth, 14, 6);
        ctx.fill();
        ctx.shadowBlur = 0;

        // Draw Ball
        ctx.fillStyle = '#67e8f9';
        ctx.shadowColor = '#38bdf8';
        ctx.shadowBlur = 18;
        ctx.beginPath();
        ctx.arc(st.ballX, st.ballY, 10, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      }

      animId = requestAnimationFrame(update);
    };

    animId = requestAnimationFrame(update);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('mousemove', handleMouseMove);
      cancelAnimationFrame(animId);
    };
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-[500px] bg-zinc-950 text-white rounded-xl p-4">
      <div className="flex justify-between items-center w-full max-w-[500px] mb-3">
        <div>
          <h2 className="text-xl font-bold text-purple-400">Quantum Bounce</h2>
          <p className="text-xs text-zinc-400">Bounce quantum particle & chain node hits!</p>
        </div>
        <div className="text-right">
          <div className="text-sm text-cyan-400">Multiplier: {combo}x</div>
          <div className="text-lg font-semibold text-purple-400">Score: {score}</div>
        </div>
      </div>

      <div className="relative border border-purple-900/50 rounded-xl overflow-hidden shadow-2xl bg-zinc-950">
        <canvas ref={canvasRef} width={500} height={500} className="block" />

        {gameState === 'START' && (
          <div className="absolute inset-0 bg-zinc-950/90 flex flex-col items-center justify-center p-6 text-center z-10">
            <h3 className="text-3xl font-extrabold text-purple-400 mb-2">QUANTUM BOUNCE</h3>
            <p className="text-zinc-400 mb-6 max-w-xs text-sm">
              Use your mouse or Left/Right keys to steer the quantum paddle. Destroy nodes to build up combo scores!
            </p>
            <button
              onClick={startGame}
              className="px-6 py-3 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-lg transition shadow-lg shadow-purple-600/30"
            >
              Start Bounce
            </button>
          </div>
        )}

        {gameState === 'GAMEOVER' && (
          <div className="absolute inset-0 bg-zinc-950/90 flex flex-col items-center justify-center p-6 text-center z-10">
            <h3 className="text-3xl font-extrabold text-red-500 mb-2">PARTICLE LOST</h3>
            <p className="text-zinc-300 text-lg mb-4">
              Final Score: <span className="text-purple-400 font-bold">{score}</span>
            </p>
            <button
              onClick={startGame}
              className="px-6 py-3 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-lg transition"
            >
              Try Again
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
