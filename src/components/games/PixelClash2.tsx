'use client';

import React, { useEffect, useRef, useState } from 'react';

interface Unit {
  id: number;
  x: number;
  lane: number;
  type: 'warrior' | 'archer' | 'mage';
  isEnemy: boolean;
  hp: number;
  maxHp: number;
  attack: number;
  range: number;
  speed: number;
  cooldown: number;
}

export default function PixelClash2() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [energy, setEnergy] = useState(10);
  const [playerHp, setPlayerHp] = useState(100);
  const [enemyHp, setEnemyHp] = useState(100);
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);

  const stateRef = useRef({
    energy: 10,
    playerHp: 100,
    enemyHp: 100,
    score: 0,
    units: [] as Unit[],
    nextId: 1,
    spawnTimer: 0,
    started: false,
    gameOver: false,
  });

  const initGame = () => {
    stateRef.current = {
      energy: 10,
      playerHp: 100,
      enemyHp: 100,
      score: 0,
      units: [],
      nextId: 1,
      spawnTimer: 0,
      started: true,
      gameOver: false,
    };
    setEnergy(10);
    setPlayerHp(100);
    setEnemyHp(100);
    setScore(0);
    setGameOver(false);
    setGameStarted(true);
  };

  const spawnUnit = (type: 'warrior' | 'archer' | 'mage', lane: number) => {
    const s = stateRef.current;
    if (!s.started || s.gameOver) return;

    const costs = { warrior: 3, archer: 4, mage: 6 };
    const cost = costs[type];

    if (s.energy >= cost) {
      s.energy -= cost;
      setEnergy(s.energy);

      const stats = {
        warrior: { hp: 80, attack: 12, range: 15, speed: 1.2 },
        archer: { hp: 45, attack: 18, range: 110, speed: 1.5 },
        mage: { hp: 55, attack: 28, range: 80, speed: 0.9 },
      }[type];

      s.units.push({
        id: s.nextId++,
        x: 40,
        lane,
        type,
        isEnemy: false,
        hp: stats.hp,
        maxHp: stats.hp,
        attack: stats.attack,
        range: stats.range,
        speed: stats.speed,
        cooldown: 0,
      });
    }
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;

    const loop = () => {
      const s = stateRef.current;

      ctx.fillStyle = '#09090b';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw 3 lanes
      const laneH = 90;
      for (let i = 0; i < 3; i++) {
        ctx.fillStyle = i % 2 === 0 ? '#18181b' : '#27272a';
        ctx.fillRect(50, 40 + i * laneH, 350, laneH - 8);
      }

      // Draw bases
      ctx.fillStyle = '#3b82f6';
      ctx.fillRect(10, 40, 35, 260);
      ctx.fillStyle = '#ef4444';
      ctx.fillRect(405, 40, 35, 260);

      if (s.started && !s.gameOver) {
        // Energy regen
        if (s.energy < 10) {
          s.energy = Math.min(10, s.energy + 0.02);
          setEnergy(Math.floor(s.energy));
        }

        // AI enemy spawn timer
        s.spawnTimer++;
        if (s.spawnTimer > 160) {
          s.spawnTimer = 0;
          const lane = Math.floor(Math.random() * 3);
          const types: ('warrior' | 'archer' | 'mage')[] = ['warrior', 'warrior', 'archer', 'mage'];
          const type = types[Math.floor(Math.random() * types.length)];
          const stats = {
            warrior: { hp: 70, attack: 10, range: 15, speed: 1.0 },
            archer: { hp: 40, attack: 15, range: 100, speed: 1.3 },
            mage: { hp: 50, attack: 24, range: 75, speed: 0.8 },
          }[type];

          s.units.push({
            id: s.nextId++,
            x: 410,
            lane,
            type,
            isEnemy: true,
            hp: stats.hp,
            maxHp: stats.hp,
            attack: stats.attack,
            range: stats.range,
            speed: stats.speed,
            cooldown: 0,
          });
        }

        // Process units
        s.units.forEach((u) => {
          if (u.hp <= 0) return;
          if (u.cooldown > 0) u.cooldown--;

          // Find target
          let target: Unit | null = null;
          let minDistance = 999;

          s.units.forEach((other) => {
            if (other.hp > 0 && other.isEnemy !== u.isEnemy && other.lane === u.lane) {
              const dist = Math.abs(other.x - u.x);
              if (dist < minDistance && ((!u.isEnemy && other.x > u.x) || (u.isEnemy && other.x < u.x))) {
                minDistance = dist;
                target = other;
              }
            }
          });

          if (target && minDistance <= u.range) {
            // Attack unit
            if (u.cooldown === 0) {
              (target as Unit).hp -= u.attack;
              u.cooldown = 40;
              if ((target as Unit).hp <= 0 && !u.isEnemy) {
                s.score += 40;
                setScore(s.score);
              }
            }
          } else {
            // Attack base or move
            const baseTargetX = u.isEnemy ? 45 : 405;
            const distToBase = Math.abs(baseTargetX - u.x);
            if (distToBase <= u.range) {
              if (u.cooldown === 0) {
                if (u.isEnemy) {
                  s.playerHp = Math.max(0, s.playerHp - u.attack / 2);
                  setPlayerHp(Math.round(s.playerHp));
                } else {
                  s.enemyHp = Math.max(0, s.enemyHp - u.attack / 2);
                  setEnemyHp(Math.round(s.enemyHp));
                  s.score += 20;
                  setScore(s.score);
                }
                u.cooldown = 40;
              }
            } else {
              u.x += u.isEnemy ? -u.speed : u.speed;
            }
          }
        });

        // Filter dead units
        s.units = s.units.filter((u) => u.hp > 0);

        // Check game over
        if (s.playerHp <= 0 || s.enemyHp <= 0) {
          s.gameOver = true;
          setGameOver(true);
          const finalScore = s.score + (s.enemyHp <= 0 ? 500 : 0);
          setScore(finalScore);
          window.dispatchEvent(new CustomEvent('xakteir-game-score', { detail: { score: finalScore } }));
        }
      }

      // Render Units
      s.units.forEach((u) => {
        const laneY = 40 + u.lane * laneH + 40;
        ctx.fillStyle = u.isEnemy ? '#f43f5e' : '#3b82f6';
        ctx.beginPath();
        ctx.arc(u.x, laneY, u.type === 'warrior' ? 14 : 10, 0, Math.PI * 2);
        ctx.fill();

        // Draw HP bar
        const barW = 20;
        ctx.fillStyle = '#27272a';
        ctx.fillRect(u.x - barW / 2, laneY - 20, barW, 4);
        ctx.fillStyle = u.isEnemy ? '#ef4444' : '#22c55e';
        ctx.fillRect(u.x - barW / 2, laneY - 20, (barW * u.hp) / u.maxHp, 4);
      });

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);

    return () => cancelAnimationFrame(animId);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-[450px] bg-zinc-950 text-white p-4 rounded-xl border border-zinc-800">
      <div className="w-full max-w-[450px] flex justify-between items-center mb-2 text-xs font-semibold">
        <span className="text-blue-400">Player HP: {playerHp}%</span>
        <span className="text-amber-400 font-bold text-base">PIXEL CLASH 2</span>
        <span className="text-rose-400">Enemy HP: {enemyHp}%</span>
      </div>

      <div className="relative border-2 border-indigo-500/40 rounded-lg overflow-hidden shadow-lg shadow-indigo-500/10">
        <canvas ref={canvasRef} width={450} height={340} className="bg-zinc-950" />

        {(!gameStarted || gameOver) && (
          <div className="absolute inset-0 bg-black/85 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center z-10">
            <h3 className="text-2xl font-bold mb-2 text-indigo-400">
              {gameOver ? (enemyHp <= 0 ? 'VICTORY!' : 'DEFEAT!') : 'PIXEL CLASH 2'}
            </h3>
            {gameOver && <p className="text-zinc-300 mb-4 font-semibold">Final Score: {score}</p>}
            <button
              onClick={initGame}
              className="px-6 py-2 bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-bold rounded-lg hover:opacity-90 transition transform hover:scale-105"
            >
              {gameOver ? 'Play Again' : 'Start Clash'}
            </button>
          </div>
        )}
      </div>

      {/* Spawn controls */}
      <div className="w-full max-w-[450px] mt-3 flex justify-between items-center bg-zinc-900/80 p-2.5 rounded-lg border border-zinc-800">
        <div className="text-xs font-bold text-amber-400">Energy: {Math.floor(energy)}/10</div>
        <div className="flex gap-2">
          {(['warrior', 'archer', 'mage'] as const).map((t) => {
            const costs = { warrior: 3, archer: 4, mage: 6 };
            return (
              <div key={t} className="flex flex-col items-center">
                <span className="text-[10px] text-zinc-400 uppercase">{t} ({costs[t]}E)</span>
                <div className="flex gap-1 mt-0.5">
                  {[0, 1, 2].map((lane) => (
                    <button
                      key={lane}
                      disabled={energy < costs[t] || !gameStarted || gameOver}
                      onClick={() => spawnUnit(t, lane)}
                      className="px-2 py-1 bg-indigo-600/80 hover:bg-indigo-500 disabled:opacity-30 disabled:hover:bg-indigo-600/80 text-[10px] rounded font-bold transition"
                    >
                      L{lane + 1}
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
