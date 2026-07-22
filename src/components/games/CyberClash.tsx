'use client';

import React, { useEffect, useRef, useState } from 'react';

interface Unit {
  id: number;
  lane: number;
  x: number;
  type: 'defender' | 'knight' | 'emp';
  hp: number;
  maxHp: number;
  attackCooldown: number;
}

interface Enemy {
  id: number;
  lane: number;
  x: number;
  hp: number;
  maxHp: number;
  speed: number;
  damage: number;
}

interface Projectile {
  lane: number;
  x: number;
  damage: number;
  color: string;
}

export default function CyberClash() {
  const [gameState, setGameState] = useState<'START' | 'PLAYING' | 'GAMEOVER'>('START');
  const [score, setScore] = useState<number>(0);
  const [energy, setEnergy] = useState<number>(100);
  const [baseHp, setBaseHp] = useState<number>(100);
  const [selectedUnit, setSelectedUnit] = useState<'defender' | 'knight' | 'emp'>('defender');

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const stateRef = useRef({
    gameState: 'START',
    score: 0,
    energy: 100,
    baseHp: 100,
    selectedUnit: 'defender' as 'defender' | 'knight' | 'emp',
    units: [] as Unit[],
    enemies: [] as Enemy[],
    projectiles: [] as Projectile[],
    spawnTimer: 0,
    energyTimer: 0,
    nextId: 1,
  });

  const startGame = () => {
    stateRef.current = {
      gameState: 'PLAYING',
      score: 0,
      energy: 100,
      baseHp: 100,
      selectedUnit: 'defender',
      units: [],
      enemies: [],
      projectiles: [],
      spawnTimer: 0,
      energyTimer: 0,
      nextId: 1,
    };
    setScore(0);
    setEnergy(100);
    setBaseHp(100);
    setGameState('PLAYING');
  };

  const unitCosts = {
    defender: 30,
    knight: 50,
    emp: 75,
  };

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const st = stateRef.current;
    if (st.gameState !== 'PLAYING') return;

    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const lane = Math.floor(y / 100);
    if (lane < 0 || lane > 3) return;

    const cost = unitCosts[st.selectedUnit];
    if (st.energy >= cost) {
      st.energy -= cost;
      setEnergy(st.energy);

      let hp = 100;
      if (st.selectedUnit === 'knight') hp = 200;
      if (st.selectedUnit === 'emp') hp = 80;

      st.units.push({
        id: st.nextId++,
        lane,
        x: Math.min(x, 250),
        type: st.selectedUnit,
        hp,
        maxHp: hp,
        attackCooldown: 0,
      });
    }
  };

  useEffect(() => {
    let animId: number;

    const update = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const st = stateRef.current;
      st.selectedUnit = selectedUnit;

      ctx.fillStyle = '#090d16';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw Grid & Lanes
      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 1;
      for (let i = 0; i <= 4; i++) {
        ctx.beginPath();
        ctx.moveTo(0, i * 100);
        ctx.lineTo(canvas.width, i * 100);
        ctx.stroke();
      }

      // Base Line
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(50, 0);
      ctx.lineTo(50, canvas.height);
      ctx.stroke();

      if (st.gameState === 'PLAYING') {
        // Energy Regen
        st.energyTimer++;
        if (st.energyTimer >= 40) {
          st.energyTimer = 0;
          if (st.energy < 150) {
            st.energy += 5;
            setEnergy(st.energy);
          }
        }

        // Spawn Enemies
        st.spawnTimer++;
        if (st.spawnTimer > Math.max(40, 120 - Math.floor(st.score / 50))) {
          st.spawnTimer = 0;
          const lane = Math.floor(Math.random() * 4);
          st.enemies.push({
            id: st.nextId++,
            lane,
            x: canvas.width + 20,
            hp: 80 + Math.floor(st.score / 20),
            maxHp: 80 + Math.floor(st.score / 20),
            speed: 0.8 + Math.random() * 0.5,
            damage: 15,
          });
        }

        // Unit actions
        st.units.forEach((u) => {
          u.attackCooldown++;
          if (u.type === 'defender' && u.attackCooldown > 45) {
            u.attackCooldown = 0;
            st.projectiles.push({ lane: u.lane, x: u.x + 15, damage: 25, color: '#38bdf8' });
          } else if (u.type === 'knight' && u.attackCooldown > 30) {
            u.attackCooldown = 0;
            st.projectiles.push({ lane: u.lane, x: u.x + 15, damage: 40, color: '#f59e0b' });
          } else if (u.type === 'emp' && u.attackCooldown > 70) {
            u.attackCooldown = 0;
            st.projectiles.push({ lane: u.lane, x: u.x + 15, damage: 80, color: '#a855f7' });
          }
        });

        // Move Projectiles
        for (let i = st.projectiles.length - 1; i >= 0; i--) {
          const p = st.projectiles[i];
          p.x += 6;

          let hit = false;
          for (let j = 0; j < st.enemies.length; j++) {
            const enemy = st.enemies[j];
            if (enemy.lane === p.lane && Math.abs(enemy.x - p.x) < 20) {
              enemy.hp -= p.damage;
              hit = true;
              break;
            }
          }

          if (hit || p.x > canvas.width + 20) {
            st.projectiles.splice(i, 1);
          }
        }

        // Move Enemies & Collisions with Units / Base
        for (let i = st.enemies.length - 1; i >= 0; i--) {
          const enemy = st.enemies[i];

          // Check hit against units in lane
          let blocked = false;
          for (let j = 0; j < st.units.length; j++) {
            const unit = st.units[j];
            if (unit.lane === enemy.lane && Math.abs(unit.x - enemy.x) < 25) {
              blocked = true;
              unit.hp -= 0.5;
              if (unit.hp <= 0) {
                st.units.splice(j, 1);
              }
              break;
            }
          }

          if (!blocked) {
            enemy.x -= enemy.speed;
          }

          if (enemy.hp <= 0) {
            st.score += 25;
            setScore(st.score);
            st.enemies.splice(i, 1);
            continue;
          }

          if (enemy.x <= 50) {
            st.baseHp -= enemy.damage;
            setBaseHp(Math.max(0, st.baseHp));
            st.enemies.splice(i, 1);

            if (st.baseHp <= 0) {
              st.gameState = 'GAMEOVER';
              setGameState('GAMEOVER');
              window.dispatchEvent(new CustomEvent('xakteir-game-score', { detail: { score: st.score } }));
            }
          }
        }

        // Draw Units
        st.units.forEach((u) => {
          const cy = u.lane * 100 + 50;
          ctx.fillStyle = u.type === 'defender' ? '#0284c7' : u.type === 'knight' ? '#d97706' : '#9333ea';
          ctx.beginPath();
          ctx.arc(u.x, cy, 18, 0, Math.PI * 2);
          ctx.fill();

          // HP bar
          ctx.fillStyle = '#1e293b';
          ctx.fillRect(u.x - 18, cy - 28, 36, 4);
          ctx.fillStyle = '#22c55e';
          ctx.fillRect(u.x - 18, cy - 28, (u.hp / u.maxHp) * 36, 4);
        });

        // Draw Enemies
        st.enemies.forEach((e) => {
          const cy = e.lane * 100 + 50;
          ctx.fillStyle = '#ef4444';
          ctx.fillRect(e.x - 15, cy - 15, 30, 30);

          // HP bar
          ctx.fillStyle = '#1e293b';
          ctx.fillRect(e.x - 15, cy - 25, 30, 4);
          ctx.fillStyle = '#22c55e';
          ctx.fillRect(e.x - 15, cy - 25, (e.hp / e.maxHp) * 30, 4);
        });

        // Draw Projectiles
        st.projectiles.forEach((p) => {
          const cy = p.lane * 100 + 50;
          ctx.fillStyle = p.color;
          ctx.shadowColor = p.color;
          ctx.shadowBlur = 8;
          ctx.beginPath();
          ctx.arc(p.x, cy, 6, 0, Math.PI * 2);
          ctx.fill();
          ctx.shadowBlur = 0;
        });
      }

      animId = requestAnimationFrame(update);
    };

    animId = requestAnimationFrame(update);
    return () => cancelAnimationFrame(animId);
  }, [selectedUnit]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[500px] bg-zinc-950 text-white rounded-xl p-4">
      <div className="flex justify-between items-center w-full max-w-[500px] mb-3">
        <div>
          <h2 className="text-xl font-bold text-cyan-400">Cyber Clash</h2>
          <p className="text-xs text-zinc-400">Deploy defensive cyber units to stop invading rogue AI!</p>
        </div>
        <div className="text-right">
          <div className="text-sm text-emerald-400">Energy: {energy}</div>
          <div className="text-sm text-red-400">Base HP: {baseHp}</div>
          <div className="text-lg font-semibold text-cyan-400">Score: {score}</div>
        </div>
      </div>

      {gameState === 'PLAYING' && (
        <div className="flex gap-3 mb-3">
          {(['defender', 'knight', 'emp'] as const).map((unit) => (
            <button
              key={unit}
              onClick={() => setSelectedUnit(unit)}
              className={`px-3 py-1.5 rounded-lg font-semibold text-xs transition border ${
                selectedUnit === unit ? 'bg-cyan-600 border-cyan-400 text-white' : 'bg-zinc-900 border-zinc-700 text-zinc-300'
              }`}
            >
              {unit.toUpperCase()} ({unitCosts[unit]} E)
            </button>
          ))}
        </div>
      )}

      <div className="relative border border-cyan-900/50 rounded-xl overflow-hidden shadow-2xl bg-zinc-950">
        <canvas ref={canvasRef} width={500} height={400} onClick={handleCanvasClick} className="block cursor-pointer" />

        {gameState === 'START' && (
          <div className="absolute inset-0 bg-zinc-950/90 flex flex-col items-center justify-center p-6 text-center z-10">
            <h3 className="text-3xl font-extrabold text-cyan-400 mb-2">CYBER CLASH</h3>
            <p className="text-zinc-400 mb-6 max-w-xs text-sm">
              Select units and click on the grid lanes to deploy. Protect your base line from rogue AI units!
            </p>
            <button
              onClick={startGame}
              className="px-6 py-3 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-lg transition shadow-lg shadow-cyan-600/30"
            >
              Deploy Units
            </button>
          </div>
        )}

        {gameState === 'GAMEOVER' && (
          <div className="absolute inset-0 bg-zinc-950/90 flex flex-col items-center justify-center p-6 text-center z-10">
            <h3 className="text-3xl font-extrabold text-red-500 mb-2">BASE OVERRUN</h3>
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
