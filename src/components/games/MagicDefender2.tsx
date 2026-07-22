'use client';

import React, { useEffect, useRef, useState } from 'react';

type SpellType = 'fireball' | 'frost' | 'lightning';

export default function MagicDefender2() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [gameState, setGameState] = useState<'start' | 'playing' | 'gameover'>('start');
  const [score, setScore] = useState(0);
  const [mana, setMana] = useState(100);
  const [nexusHp, setNexusHp] = useState(100);
  const [selectedSpell, setSelectedSpell] = useState<SpellType>('fireball');

  const selectedSpellRef = useRef<SpellType>('fireball');
  selectedSpellRef.current = selectedSpell;

  useEffect(() => {
    if (gameState !== 'playing') return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let currentScore = 0;
    let currentMana = 100;
    let currentHp = 100;

    const enemies: { x: number; y: number; hp: number; maxHp: number; speed: number; slowTimer: number; radius: number }[] = [];
    const spellEffects: { x: number; y: number; radius: number; maxRadius: number; color: string; life: number }[] = [];

    let spawnTimer = 0;

    const handleClick = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const clickY = e.clientY - rect.top;

      const spell = selectedSpellRef.current;
      let cost = 20;
      if (spell === 'frost') cost = 15;
      if (spell === 'lightning') cost = 30;

      if (currentMana < cost) return;
      currentMana -= cost;
      setMana(currentMana);

      if (spell === 'fireball') {
        spellEffects.push({ x: clickX, y: clickY, radius: 5, maxRadius: 45, color: '#f97316', life: 15 });
        enemies.forEach((en) => {
          if (Math.hypot(en.x - clickX, en.y - clickY) < 50) {
            en.hp -= 40;
          }
        });
      } else if (spell === 'frost') {
        spellEffects.push({ x: clickX, y: clickY, radius: 5, maxRadius: 60, color: '#38bdf8', life: 20 });
        enemies.forEach((en) => {
          if (Math.hypot(en.x - clickX, en.y - clickY) < 65) {
            en.hp -= 15;
            en.slowTimer = 90;
          }
        });
      } else if (spell === 'lightning') {
        spellEffects.push({ x: clickX, y: clickY, radius: 5, maxRadius: 30, color: '#a855f7', life: 10 });
        enemies.forEach((en) => {
          if (Math.hypot(en.x - clickX, en.y - clickY) < 70) {
            en.hp -= 80;
          }
        });
      }
    };

    canvas.addEventListener('click', handleClick);

    const update = () => {
      // Mana regeneration
      if (currentMana < 100) {
        currentMana = Math.min(100, currentMana + 0.15);
        setMana(Math.floor(currentMana));
      }

      spawnTimer++;
      if (spawnTimer % 50 === 0) {
        const isTank = Math.random() < 0.25;
        enemies.push({
          x: canvas.width + 20,
          y: Math.random() * (canvas.height - 100) + 50,
          hp: isTank ? 120 : 40,
          maxHp: isTank ? 120 : 40,
          speed: isTank ? 1 : 2.2,
          slowTimer: 0,
          radius: isTank ? 18 : 12,
        });
      }

      // Update enemies
      for (let i = enemies.length - 1; i >= 0; i--) {
        const en = enemies[i];
        let currentSpeed = en.speed;
        if (en.slowTimer > 0) {
          en.slowTimer--;
          currentSpeed *= 0.4;
        }

        en.x -= currentSpeed;

        if (en.hp <= 0) {
          enemies.splice(i, 1);
          currentScore += 100;
          setScore(currentScore);
          currentMana = Math.min(100, currentMana + 5);
          setMana(Math.floor(currentMana));
          continue;
        }

        // Reach Nexus (left boundary)
        if (en.x <= 40) {
          currentHp -= en.radius > 15 ? 20 : 10;
          setNexusHp(currentHp);
          enemies.splice(i, 1);
          if (currentHp <= 0) {
            setGameState('gameover');
            window.dispatchEvent(new CustomEvent('xakteir-game-score', { detail: { score: currentScore } }));
            return;
          }
        }
      }

      // Update spell effects
      for (let i = spellEffects.length - 1; i >= 0; i--) {
        const ef = spellEffects[i];
        ef.radius += (ef.maxRadius - ef.radius) * 0.3;
        ef.life--;
        if (ef.life <= 0) spellEffects.splice(i, 1);
      }
    };

    const draw = () => {
      ctx.fillStyle = '#09090b';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Nexus Wall on left
      ctx.fillStyle = '#8b5cf6';
      ctx.fillRect(0, 0, 30, canvas.height);
      ctx.fillStyle = '#c084fc';
      ctx.beginPath();
      ctx.arc(15, canvas.height / 2, 25, 0, Math.PI * 2);
      ctx.fill();

      // Enemies
      enemies.forEach((en) => {
        ctx.fillStyle = en.slowTimer > 0 ? '#38bdf8' : en.radius > 15 ? '#dc2626' : '#ea580c';
        ctx.beginPath();
        ctx.arc(en.x, en.y, en.radius, 0, Math.PI * 2);
        ctx.fill();

        // HP bar
        const hpBarW = en.radius * 2;
        ctx.fillStyle = '#3f3f46';
        ctx.fillRect(en.x - en.radius, en.y - en.radius - 8, hpBarW, 4);
        ctx.fillStyle = '#22c55e';
        ctx.fillRect(en.x - en.radius, en.y - en.radius - 8, hpBarW * (Math.max(0, en.hp) / en.maxHp), 4);
      });

      // Spell Explosions
      spellEffects.forEach((ef) => {
        ctx.strokeStyle = ef.color;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(ef.x, ef.y, ef.radius, 0, Math.PI * 2);
        ctx.stroke();
      });
    };

    const loop = () => {
      update();
      draw();
      animId = requestAnimationFrame(loop);
    };

    loop();

    return () => {
      canvas.removeEventListener('click', handleClick);
      cancelAnimationFrame(animId);
    };
  }, [gameState]);

  const startGame = () => {
    setScore(0);
    setMana(100);
    setNexusHp(100);
    setGameState('playing');
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[500px] bg-zinc-950 text-white p-4 rounded-xl shadow-2xl border border-zinc-800">
      <h1 className="text-3xl font-extrabold mb-2 text-purple-400 tracking-wider">MAGIC DEFENDER 2</h1>
      <p className="text-xs text-zinc-400 mb-2">Select spell and click canvas to cast spells to stop invading dark forces!</p>

      {/* Spell selector */}
      <div className="flex gap-4 mb-3">
        <button
          onClick={() => setSelectedSpell('fireball')}
          className={`px-3 py-1.5 rounded-lg font-bold border transition ${
            selectedSpell === 'fireball' ? 'bg-orange-600 border-orange-400' : 'bg-zinc-800 border-zinc-700 hover:bg-zinc-700'
          }`}
        >
          🔥 Fireball (20 MP)
        </button>
        <button
          onClick={() => setSelectedSpell('frost')}
          className={`px-3 py-1.5 rounded-lg font-bold border transition ${
            selectedSpell === 'frost' ? 'bg-sky-600 border-sky-400' : 'bg-zinc-800 border-zinc-700 hover:bg-zinc-700'
          }`}
        >
          ❄️ Frost (15 MP)
        </button>
        <button
          onClick={() => setSelectedSpell('lightning')}
          className={`px-3 py-1.5 rounded-lg font-bold border transition ${
            selectedSpell === 'lightning' ? 'bg-purple-600 border-purple-400' : 'bg-zinc-800 border-zinc-700 hover:bg-zinc-700'
          }`}
        >
          ⚡ Lightning (30 MP)
        </button>
      </div>

      <div className="relative border-2 border-purple-500/40 rounded-lg overflow-hidden">
        <canvas ref={canvasRef} width={600} height={400} className="block bg-zinc-950 cursor-crosshair" />

        {gameState === 'start' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-zinc-950/90">
            <p className="text-xl font-bold text-purple-400 mb-4">Protect the Nexus Crystal!</p>
            <button
              onClick={startGame}
              className="px-6 py-3 bg-purple-600 hover:bg-purple-700 font-bold rounded-lg transition transform hover:scale-105"
            >
              Start Game
            </button>
          </div>
        )}

        {gameState === 'gameover' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-zinc-950/90">
            <h2 className="text-3xl font-bold text-red-500 mb-2">NEXUS DESTROYED</h2>
            <p className="text-lg text-zinc-300 mb-4">Final Score: {score}</p>
            <button
              onClick={startGame}
              className="px-6 py-3 bg-purple-600 hover:bg-purple-700 font-bold rounded-lg transition transform hover:scale-105"
            >
              Play Again
            </button>
          </div>
        )}
      </div>

      <div className="flex gap-8 mt-4 font-mono text-lg">
        <span className="text-purple-400">Score: {score}</span>
        <span className="text-blue-400">MP: {Math.floor(mana)}/100</span>
        <span className="text-emerald-400">Nexus HP: {nexusHp}</span>
      </div>
    </div>
  );
}
