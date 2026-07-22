'use client';

import React, { useEffect, useRef, useState } from 'react';

interface Enemy {
  id: number;
  x: number;
  y: number;
  pathIdx: number;
  hp: number;
  maxHp: number;
  speed: number;
}

interface Tower {
  id: number;
  x: number;
  y: number;
  range: number;
  damage: number;
  cooldown: number;
  lastShot: number;
}

const PATH = [
  { x: 0, y: 200 },
  { x: 180, y: 200 },
  { x: 180, y: 80 },
  { x: 380, y: 80 },
  { x: 380, y: 320 },
  { x: 600, y: 320 },
];

export default function PyroForce() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [gameState, setGameState] = useState<'START' | 'PLAYING' | 'GAMEOVER'>('START');
  const [gold, setGold] = useState<number>(100);
  const [baseHp, setBaseHp] = useState<number>(20);
  const [score, setScore] = useState<number>(0);
  const scoreRef = useRef<number>(0);

  useEffect(() => {
    scoreRef.current = score;
  }, [score]);

  const startGame = () => {
    setGold(120);
    setBaseHp(20);
    setScore(0);
    scoreRef.current = 0;
    setGameState('PLAYING');
  };

  useEffect(() => {
    if (gameState !== 'PLAYING') return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let enemies: Enemy[] = [];
    let towers: Tower[] = [];
    let frameCount = 0;

    const handleCanvasClick = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const clickY = e.clientY - rect.top;

      // Check gold
      if (gold < 40) return;

      // Check distance to path (can't build directly on path)
      let onPath = false;
      for (let i = 0; i < PATH.length - 1; i++) {
        const p1 = PATH[i];
        const p2 = PATH[i + 1];
        if (
          clickX >= Math.min(p1.x, p2.x) - 25 &&
          clickX <= Math.max(p1.x, p2.x) + 25 &&
          clickY >= Math.min(p1.y, p2.y) - 25 &&
          clickY <= Math.max(p1.y, p2.y) + 25
        ) {
          onPath = true;
          break;
        }
      }

      if (!onPath) {
        towers.push({
          id: Math.random(),
          x: clickX,
          y: clickY,
          range: 90,
          damage: 15,
          cooldown: 25,
          lastShot: 0,
        });
        setGold((g) => g - 40);
      }
    };

    canvas.addEventListener('click', handleCanvasClick);

    const gameLoop = () => {
      frameCount++;

      // Spawn enemy wave
      if (frameCount % 60 === 0) {
        enemies.push({
          id: Math.random(),
          x: PATH[0].x,
          y: PATH[0].y,
          pathIdx: 0,
          hp: 40 + Math.floor(frameCount / 100) * 10,
          maxHp: 40 + Math.floor(frameCount / 100) * 10,
          speed: 1.5 + Math.random() * 0.5,
        });
      }

      // Move enemies
      for (let i = enemies.length - 1; i >= 0; i--) {
        const enemy = enemies[i];
        const targetPoint = PATH[enemy.pathIdx + 1];

        if (!targetPoint) {
          // Hit base
          setBaseHp((hp) => {
            const nextHp = hp - 1;
            if (nextHp <= 0) {
              const finalScore = scoreRef.current;
              window.dispatchEvent(new CustomEvent('xakteir-game-score', { detail: { score: finalScore } }));
              setGameState('GAMEOVER');
            }
            return nextHp;
          });
          enemies.splice(i, 1);
          continue;
        }

        const dx = targetPoint.x - enemy.x;
        const dy = targetPoint.y - enemy.y;
        const dist = Math.hypot(dx, dy);

        if (dist < enemy.speed) {
          enemy.x = targetPoint.x;
          enemy.y = targetPoint.y;
          enemy.pathIdx++;
        } else {
          enemy.x += (dx / dist) * enemy.speed;
          enemy.y += (dy / dist) * enemy.speed;
        }
      }

      // Tower shooting logic
      towers.forEach((tower) => {
        if (frameCount - tower.lastShot >= tower.cooldown) {
          // Find nearest enemy in range
          let target: Enemy | null = null;
          let minDist = tower.range;

          enemies.forEach((enemy) => {
            const d = Math.hypot(enemy.x - tower.x, enemy.y - tower.y);
            if (d < minDist) {
              minDist = d;
              target = enemy;
            }
          });

          if (target) {
            (target as Enemy).hp -= tower.damage;
            tower.lastShot = frameCount;

            // Draw pyro beam effect
            ctx.strokeStyle = '#ef4444';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(tower.x, tower.y);
            ctx.lineTo((target as Enemy).x, (target as Enemy).y);
            ctx.stroke();

            if ((target as Enemy).hp <= 0) {
              const idx = enemies.indexOf(target);
              if (idx !== -1) {
                enemies.splice(idx, 1);
                setGold((g) => g + 12);
                setScore((s) => s + 25);
              }
            }
          }
        }
      });

      // Render
      ctx.fillStyle = '#09090b';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw Path
      ctx.strokeStyle = '#27272a';
      ctx.lineWidth = 40;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();
      ctx.moveTo(PATH[0].x, PATH[0].y);
      for (let i = 1; i < PATH.length; i++) {
        ctx.lineTo(PATH[i].x, PATH[i].y);
      }
      ctx.stroke();

      // Draw Towers
      towers.forEach((tower) => {
        ctx.fillStyle = '#f97316';
        ctx.beginPath();
        ctx.arc(tower.x, tower.y, 16, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#fdba74';
        ctx.lineWidth = 2;
        ctx.stroke();
      });

      // Draw Enemies
      enemies.forEach((enemy) => {
        ctx.fillStyle = '#3b82f6';
        ctx.beginPath();
        ctx.arc(enemy.x, enemy.y, 10, 0, Math.PI * 2);
        ctx.fill();

        // Health bar
        const hpPct = enemy.hp / enemy.maxHp;
        ctx.fillStyle = '#ef4444';
        ctx.fillRect(enemy.x - 12, enemy.y - 18, 24, 4);
        ctx.fillStyle = '#22c55e';
        ctx.fillRect(enemy.x - 12, enemy.y - 18, 24 * hpPct, 4);
      });

      animId = requestAnimationFrame(gameLoop);
    };

    animId = requestAnimationFrame(gameLoop);

    return () => {
      cancelAnimationFrame(animId);
      canvas.removeEventListener('click', handleCanvasClick);
    };
  }, [gameState, gold]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[500px] bg-zinc-950 text-white rounded-xl p-4">
      <div className="flex justify-between items-center w-full max-w-[600px] mb-4">
        <div>
          <h2 className="text-xl font-bold text-orange-500">Pyro Force</h2>
          <p className="text-xs text-zinc-400">Click off-path to place Pyro Turret (🪙 40)</p>
        </div>
        <div className="text-right">
          <div className="text-lg font-semibold text-orange-400">Score: {score}</div>
          <div className="text-xs text-zinc-300">🪙 Gold: {gold} | ❤️ Base HP: {baseHp}</div>
        </div>
      </div>

      <div className="relative border border-orange-900/50 rounded-lg overflow-hidden">
        <canvas ref={canvasRef} width={600} height={400} className="bg-zinc-950 block" />

        {gameState === 'START' && (
          <div className="absolute inset-0 bg-zinc-950/90 flex flex-col items-center justify-center p-6 text-center">
            <h3 className="text-3xl font-extrabold text-orange-500 mb-2">PYRO FORCE</h3>
            <p className="text-zinc-400 mb-6 max-w-sm">Place fiery pyro defense turrets along the path to incinerate incoming invaders!</p>
            <button
              onClick={startGame}
              className="px-6 py-3 bg-orange-600 hover:bg-orange-500 text-white font-bold rounded-lg transition"
            >
              Deploy Force
            </button>
          </div>
        )}

        {gameState === 'GAMEOVER' && (
          <div className="absolute inset-0 bg-zinc-950/90 flex flex-col items-center justify-center p-6 text-center">
            <h3 className="text-3xl font-extrabold text-red-500 mb-2">BASE OVERRUN</h3>
            <p className="text-zinc-300 text-lg mb-4">Final Score: <span className="text-orange-400 font-bold">{score}</span></p>
            <button
              onClick={startGame}
              className="px-6 py-3 bg-orange-600 hover:bg-orange-500 text-white font-bold rounded-lg transition"
            >
              Defend Again
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
