"use client";
import { useEffect, useRef, useState } from "react";

export default function MysticWizard() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [gameOver, setGameOver] = useState(false);
  const [finalScore, setFinalScore] = useState(0);
  const [gameKey, setGameKey] = useState(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const W = canvas.width;
    const H = canvas.height;

    let wx = W / 2;
    let wy = H - 50;
    let score = 0;
    let hp = 3;
    let mana = 100;
    let isDead = false;

    type Spell = { x: number; y: number; vx: number; vy: number; radius: number; color: string; isAoE: boolean };
    type Monster = { x: number; y: number; vy: number; radius: number; hp: number; type: string; color: string };
    type Particle = { x: number; y: number; vx: number; vy: number; life: number; color: string };

    const spells: Spell[] = [];
    const monsters: Monster[] = [];
    const particles: Particle[] = [];
    const keys: Record<string, boolean> = {};

    const handleKeyDown = (e: KeyboardEvent) => {
      keys[e.code] = true;
      if (e.code === "Digit1" || e.code === "KeyA") castSpell("arcane");
      if (e.code === "Digit2" || e.code === "KeyS") castSpell("fire");
      if (e.code === "Digit3" || e.code === "KeyD") castSpell("lightning");
    };

    window.addEventListener("keydown", handleKeyDown);

    let spawnTimer = 0;
    let animationFrameId: number;

    const createBurst = (x: number, y: number, color: string, count = 12) => {
      for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 4 + 1;
        particles.push({
          x, y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          life: 15 + Math.random() * 15,
          color,
        });
      }
    };

    const castSpell = (type: "arcane" | "fire" | "lightning") => {
      if (isDead) return;

      if (type === "arcane") {
        spells.push({ x: wx, y: wy - 20, vx: 0, vy: -12, radius: 8, color: "#c084fc", isAoE: false });
      } else if (type === "fire" && mana >= 20) {
        mana -= 20;
        spells.push({ x: wx, y: wy - 20, vx: 0, vy: -8, radius: 18, color: "#f97316", isAoE: true });
      } else if (type === "lightning" && mana >= 40) {
        mana -= 40;
        createBurst(wx, wy, "#facc15", 35);
        // Clear all nearby monsters
        for (let i = monsters.length - 1; i >= 0; i--) {
          const m = monsters[i];
          if (Math.hypot(m.x - wx, m.y - wy) < 220) {
            createBurst(m.x, m.y, "#facc15", 15);
            score += 150;
            monsters.splice(i, 1);
          }
        }
      }
    };

    const gameLoop = () => {
      if (!isDead) {
        // Regeneration
        if (mana < 100) mana = Math.min(100, mana + 0.25);

        // Wizard Movement
        if (keys["ArrowLeft"]) wx -= 6;
        if (keys["ArrowRight"]) wx += 6;
        wx = Math.max(30, Math.min(W - 30, wx));

        // Spawn Monsters
        spawnTimer++;
        if (spawnTimer > Math.max(18, 55 - Math.floor(score / 200))) {
          spawnTimer = 0;
          const isBoss = Math.random() < 0.2;
          monsters.push({
            x: 40 + Math.random() * (W - 80),
            y: -20,
            vy: 1.5 + Math.random() * 2 + score / 500,
            radius: isBoss ? 24 : 14,
            hp: isBoss ? 3 : 1,
            type: isBoss ? "boss" : "minion",
            color: isBoss ? "#ef4444" : "#22c55e",
          });
        }

        // Update Spells
        for (let i = spells.length - 1; i >= 0; i--) {
          const s = spells[i];
          s.y += s.vy;
          if (s.y < -30) spells.splice(i, 1);
        }

        // Update Monsters
        for (let i = monsters.length - 1; i >= 0; i--) {
          const m = monsters[i];
          m.y += m.vy;

          // Out of bounds / Hit Wizard
          if (Math.hypot(m.x - wx, m.y - wy) < m.radius + 18) {
            createBurst(m.x, m.y, "#ef4444", 20);
            monsters.splice(i, 1);
            hp--;
            if (hp <= 0) {
              isDead = true;
              setFinalScore(score);
              setGameOver(true);
              window.dispatchEvent(
                new CustomEvent("xakteir-game-score", { detail: { score } })
              );
            }
            continue;
          }

          // Spell collisions
          for (let j = spells.length - 1; j >= 0; j--) {
            const s = spells[j];
            if (Math.hypot(s.x - m.x, s.y - m.y) < m.radius + s.radius) {
              if (!s.isAoE) spells.splice(j, 1);
              m.hp--;
              createBurst(m.x, m.y, s.color, 8);
              if (m.hp <= 0) {
                createBurst(m.x, m.y, m.color, 16);
                score += m.type === "boss" ? 300 : 100;
                monsters.splice(i, 1);
                break;
              }
            }
          }
        }

        // Update Particles
        for (let i = particles.length - 1; i >= 0; i--) {
          const p = particles[i];
          p.x += p.vx;
          p.y += p.vy;
          p.life--;
          if (p.life <= 0) particles.splice(i, 1);
        }
      }

      // Render Arcane Sky Background
      ctx.fillStyle = "#090514";
      ctx.fillRect(0, 0, W, H);

      // Arcane Pentagram / Circle line on ground
      ctx.strokeStyle = "#3b0764";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(W / 2, H - 30, 200, Math.PI, Math.PI * 2);
      ctx.stroke();

      // Render Spells
      for (const s of spells) {
        ctx.shadowColor = s.color;
        ctx.shadowBlur = 15;
        ctx.fillStyle = s.color;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      }

      // Render Monsters
      for (const m of monsters) {
        ctx.shadowColor = m.color;
        ctx.shadowBlur = 10;
        ctx.fillStyle = m.color;
        ctx.beginPath();
        ctx.arc(m.x, m.y, m.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      }

      // Render Particles
      for (const p of particles) {
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.life / 25;
        ctx.fillRect(p.x - 2, p.y - 2, 4, 4);
        ctx.globalAlpha = 1;
      }

      // Render Wizard Hero
      if (!isDead) {
        ctx.shadowColor = "#a855f7";
        ctx.shadowBlur = 20;
        ctx.fillStyle = "#a855f7";
        ctx.beginPath();
        ctx.moveTo(wx, wy - 25);
        ctx.lineTo(wx - 16, wy + 15);
        ctx.lineTo(wx + 16, wy + 15);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = "#facc15";
        ctx.beginPath();
        ctx.arc(wx, wy - 8, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      }

      // HUD
      ctx.fillStyle = "#f3e8ff";
      ctx.font = "bold 16px sans-serif";
      ctx.fillText(`SCORE: ${score}`, 20, 30);
      ctx.fillText(`MANA: ${Math.floor(mana)}%`, 20, 55);
      ctx.fillText(`LIVES: ${"🔮".repeat(Math.max(0, hp))}`, W - 140, 30);

      animationFrameId = requestAnimationFrame(gameLoop);
    };

    gameLoop();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [gameKey]);

  const restart = () => {
    setGameOver(false);
    setFinalScore(0);
    setGameKey((k) => k + 1);
  };

  return (
    <div className="w-full h-full flex flex-col items-center justify-center bg-zinc-950 p-4">
      <h2 className="text-purple-400 text-xl font-bold uppercase tracking-wider mb-2">Mystic Wizard</h2>
      <div className="relative">
        <canvas ref={canvasRef} width={640} height={480} className="border border-purple-900/50 rounded-xl bg-zinc-950 shadow-2xl" />
        {gameOver && (
          <div className="absolute inset-0 bg-black/85 backdrop-blur-sm rounded-xl flex flex-col items-center justify-center gap-4">
            <h3 className="text-purple-400 font-extrabold text-3xl uppercase">Sanctum Overrun</h3>
            <p className="text-zinc-300 text-lg">Final Score: <span className="text-purple-400 font-bold">{finalScore}</span></p>
            <button
              onClick={restart}
              className="px-6 py-2 bg-purple-600 hover:bg-purple-500 text-white font-bold uppercase rounded-lg transition"
            >
              Channel Spells Again
            </button>
          </div>
        )}
      </div>
      <p className="text-zinc-500 text-xs mt-3">Controls: Press 1 (Arcane), 2 (Fire), 3 (Lightning Nova). Left/Right to move!</p>
    </div>
  );
}
