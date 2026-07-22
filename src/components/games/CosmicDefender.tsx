'use client';

import React, { useEffect, useRef, useState } from 'react';

export default function CosmicDefender() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [gameState, setGameState] = useState<'START' | 'PLAYING' | 'GAMEOVER'>('START');
  const [score, setScore] = useState(0);
  const [planetHp, setPlanetHp] = useState(100);

  const stateRef = useRef({
    gameState: 'START',
    score: 0,
    hp: 100,
    threats: [] as Array<{ x: number; y: number; radius: number; vx: number; vy: number; hp: number; maxHp: number }>,
    lasers: [] as Array<{ x1: number; y1: number; x2: number; y2: number; alpha: number }>,
    particles: [] as Array<{ x: number; y: number; vx: number; vy: number; life: number; color: string }>,
    turrets: [] as Array<{ angle: number; cooldown: number }>,
    energy: 100,
  });

  const startGame = () => {
    stateRef.current = {
      gameState: 'PLAYING',
      score: 0,
      hp: 100,
      threats: [],
      lasers: [],
      particles: [],
      turrets: [{ angle: 0, cooldown: 0 }, { angle: Math.PI, cooldown: 0 }],
      energy: 100,
    };
    setScore(0);
    setPlanetHp(100);
    setGameState('PLAYING');
  };

  const gameOver = () => {
    const finalScore = stateRef.current.score;
    setGameState('GAMEOVER');
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('xakteir-game-score', { detail: { score: finalScore } }));
    }
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let spawnCounter = 0;
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const planetRadius = 45;

    const handleCanvasClick = (e: MouseEvent) => {
      const s = stateRef.current;
      if (s.gameState !== 'PLAYING') return;

      const rect = canvas.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;

      // Direct target laser blast (costs energy)
      if (s.energy >= 10) {
        s.energy -= 10;
        s.lasers.push({ x1: centerX, y1: centerY, x2: mx, y2: my, alpha: 1 });

        // Check hits on threats
        for (let i = s.threats.length - 1; i >= 0; i--) {
          const t = s.threats[i];
          const dist = Math.hypot(t.x - mx, t.y - my);
          if (dist < t.radius + 15) {
            t.hp -= 1;
            if (t.hp <= 0) {
              for (let p = 0; p < 10; p++) {
                s.particles.push({
                  x: t.x,
                  y: t.y,
                  vx: (Math.random() - 0.5) * 6,
                  vy: (Math.random() - 0.5) * 6,
                  life: 1,
                  color: '#f97316',
                });
              }
              s.threats.splice(i, 1);
              s.score += 20;
              setScore(s.score);
            }
          }
        }
      }
    };

    canvas.addEventListener('click', handleCanvasClick);

    const loop = () => {
      const s = stateRef.current;

      if (s.gameState === 'PLAYING') {
        // Regenerate energy
        s.energy = Math.min(100, s.energy + 0.3);

        // Rotate turrets & auto fire
        s.turrets.forEach((turret) => {
          turret.angle += 0.02;
          turret.cooldown--;
          if (turret.cooldown <= 0 && s.threats.length > 0) {
            // Find closest threat
            let closest = s.threats[0];
            let minDist = Math.hypot(closest.x - centerX, closest.y - centerY);
            s.threats.forEach((t) => {
              const d = Math.hypot(t.x - centerX, t.y - centerY);
              if (d < minDist) {
                minDist = d;
                closest = t;
              }
            });

            if (minDist < 250) {
              turret.cooldown = 40;
              const tx = centerX + Math.cos(turret.angle) * planetRadius;
              const ty = centerY + Math.sin(turret.angle) * planetRadius;
              s.lasers.push({ x1: tx, y1: ty, x2: closest.x, y2: closest.y, alpha: 0.8 });
              closest.hp -= 1;
              if (closest.hp <= 0) {
                const idx = s.threats.indexOf(closest);
                if (idx !== -1) {
                  s.threats.splice(idx, 1);
                  s.score += 15;
                  setScore(s.score);
                }
              }
            }
          }
        });

        // Spawn threats
        spawnCounter++;
        if (spawnCounter > Math.max(25, 70 - Math.floor(s.score / 60))) {
          spawnCounter = 0;
          const angle = Math.random() * Math.PI * 2;
          const dist = 320;
          const tx = centerX + Math.cos(angle) * dist;
          const ty = centerY + Math.sin(angle) * dist;
          const speed = 1.2 + Math.random() * 1.5;
          const toAngle = Math.atan2(centerY - ty, centerX - tx);

          s.threats.push({
            x: tx,
            y: ty,
            radius: 12 + Math.random() * 8,
            vx: Math.cos(toAngle) * speed,
            vy: Math.sin(toAngle) * speed,
            hp: Math.random() > 0.7 ? 2 : 1,
            maxHp: 2,
          });
        }

        // Move threats
        for (let i = s.threats.length - 1; i >= 0; i--) {
          const t = s.threats[i];
          t.x += t.vx;
          t.y += t.vy;

          const distToCenter = Math.hypot(t.x - centerX, t.y - centerY);
          if (distToCenter < planetRadius + t.radius) {
            // Impact planet
            s.hp -= 15;
            setPlanetHp(Math.max(0, s.hp));
            s.threats.splice(i, 1);

            if (s.hp <= 0) {
              gameOver();
              break;
            }
          }
        }

        // Fade lasers
        for (let i = s.lasers.length - 1; i >= 0; i--) {
          s.lasers[i].alpha -= 0.1;
          if (s.lasers[i].alpha <= 0) s.lasers.splice(i, 1);
        }

        // Update particles
        for (let i = s.particles.length - 1; i >= 0; i--) {
          const p = s.particles[i];
          p.x += p.vx;
          p.y += p.vy;
          p.life -= 0.05;
          if (p.life <= 0) s.particles.splice(i, 1);
        }
      }

      // RENDER
      ctx.fillStyle = '#050510';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Planet
      ctx.fillStyle = '#1e3a8a';
      ctx.shadowColor = '#3b82f6';
      ctx.shadowBlur = 20;
      ctx.beginPath();
      ctx.arc(centerX, centerY, planetRadius, 0, Math.PI * 2);
      ctx.fill();

      // Planet Atmosphere outline
      ctx.strokeStyle = '#60a5fa';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(centerX, centerY, planetRadius + 3, 0, Math.PI * 2);
      ctx.stroke();

      // Satellite Turrets
      s.turrets.forEach((turret) => {
        const tx = centerX + Math.cos(turret.angle) * (planetRadius + 15);
        const ty = centerY + Math.sin(turret.angle) * (planetRadius + 15);
        ctx.fillStyle = '#e0f2fe';
        ctx.shadowColor = '#38bdf8';
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.arc(tx, ty, 6, 0, Math.PI * 2);
        ctx.fill();
      });

      // Threats
      s.threats.forEach((t) => {
        ctx.fillStyle = t.hp > 1 ? '#ea580c' : '#f97316';
        ctx.shadowColor = '#f97316';
        ctx.shadowBlur = 12;
        ctx.beginPath();
        ctx.arc(t.x, t.y, t.radius, 0, Math.PI * 2);
        ctx.fill();
      });

      // Lasers
      s.lasers.forEach((l) => {
        ctx.strokeStyle = `rgba(56, 189, 248, ${l.alpha})`;
        ctx.shadowColor = '#38bdf8';
        ctx.shadowBlur = 15;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(l.x1, l.y1);
        ctx.lineTo(l.x2, l.y2);
        ctx.stroke();
      });

      // Particles
      s.particles.forEach((p) => {
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.life;
        ctx.fillRect(p.x, p.y, 4, 4);
      });
      ctx.globalAlpha = 1;

      ctx.shadowBlur = 0;
      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => {
      canvas.removeEventListener('click', handleCanvasClick);
      cancelAnimationFrame(animId);
    };
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-[500px] bg-zinc-950 text-white p-4 rounded-xl border border-zinc-800">
      <div className="mb-4 text-center">
        <h2 className="text-3xl font-extrabold tracking-wider text-blue-400 drop-shadow-[0_0_10px_rgba(59,130,246,0.5)]">
          COSMIC DEFENDER
        </h2>
        <div className="flex gap-6 mt-2 text-sm font-semibold text-zinc-400">
          <span>PLANET SHIELD: <strong className={planetHp < 30 ? 'text-red-500' : 'text-emerald-400'}>{planetHp}%</strong></span>
          <span>SCORE: <strong className="text-yellow-400">{score}</strong></span>
        </div>
      </div>

      <div className="relative">
        <canvas
          ref={canvasRef}
          width={550}
          height={400}
          className="bg-zinc-950 border-2 border-blue-500/30 rounded-lg cursor-crosshair shadow-inner"
        />

        {gameState !== 'PLAYING' && (
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center rounded-lg">
            <h3 className="text-2xl font-bold text-blue-400 mb-2">
              {gameState === 'START' ? 'PROTECT THE HOMEWORLD' : 'PLANET DESTROYED'}
            </h3>
            <p className="text-zinc-400 text-xs mb-6 text-center max-w-xs">
              {gameState === 'START'
                ? 'Click incoming meteors & alien probes to trigger defense strikes before they hit your planet!'
                : `Final Score: ${score}`}
            </p>
            <button
              onClick={startGame}
              className="px-6 py-2 bg-blue-500 hover:bg-blue-400 text-black font-bold rounded-full transition-all shadow-[0_0_15px_rgba(59,130,246,0.4)]"
            >
              {gameState === 'START' ? 'DEPLOY DEFENSES' : 'TRY AGAIN'}
            </button>
          </div>
        )}
      </div>

      <div className="mt-4 text-xs text-zinc-400">
        [CLICK] Laser Target Strike | Defense Turrets Auto-Target Enemies
      </div>
    </div>
  );
}
