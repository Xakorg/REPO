"use client";
import { useEffect, useRef, useState } from "react";

interface Tower {
  id: number;
  x: number;
  y: number;
  type: "fire" | "frost" | "lightning";
  range: number;
  damage: number;
  cooldown: number;
  timer: number;
}

interface Enemy {
  id: number;
  pathIdx: number;
  x: number;
  y: number;
  hp: number;
  maxHp: number;
  speed: number;
  slowedTimer: number;
}

export default function MagicDefender() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [score, setScore] = useState(0);
  const [mana, setMana] = useState(100);
  const [health, setHealth] = useState(100);
  const [gameOver, setGameOver] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const [selectedType, setSelectedType] = useState<"fire" | "frost" | "lightning">("fire");

  const PATH = [
    { x: -20, y: 120 },
    { x: 160, y: 120 },
    { x: 160, y: 360 },
    { x: 360, y: 360 },
    { x: 360, y: 160 },
    { x: 540, y: 160 },
    { x: 540, y: 440 }
  ];

  const TOWER_SPOTS = [
    { x: 90, y: 60 },
    { x: 230, y: 180 },
    { x: 90, y: 240 },
    { x: 230, y: 420 },
    { x: 440, y: 240 },
    { x: 440, y: 420 },
    { x: 600, y: 80 }
  ];

  useEffect(() => {
    if (!gameStarted || gameOver) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const W = canvas.width;
    const H = canvas.height;

    let localScore = 0;
    let localMana = 120;
    let localHealth = 100;
    let isDead = false;

    const towers: Tower[] = [];
    const enemies: Enemy[] = [];
    const projectiles: { x: number; y: number; tx: number; ty: number; color: string; speed: number }[] = [];
    const particles: { x: number; y: number; vx: number; vy: number; life: number; color: string }[] = [];

    let spawnTimer = 0;
    let enemyIdCounter = 0;
    let animId: number;

    const handleCanvasClick = (e: MouseEvent) => {
      if (isDead) return;
      const rect = canvas.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;

      // Check click on tower spots
      for (const spot of TOWER_SPOTS) {
        if (Math.hypot(mx - spot.x, my - spot.y) < 25) {
          const cost = selectedType === "fire" ? 50 : selectedType === "frost" ? 60 : 75;
          const existing = towers.find(t => Math.hypot(t.x - spot.x, t.y - spot.y) < 10);
          if (!existing && localMana >= cost) {
            localMana -= cost;
            setMana(localMana);
            towers.push({
              id: Date.now(),
              x: spot.x,
              y: spot.y,
              type: selectedType,
              range: selectedType === "frost" ? 110 : selectedType === "fire" ? 130 : 160,
              damage: selectedType === "fire" ? 25 : selectedType === "frost" ? 12 : 40,
              cooldown: selectedType === "fire" ? 30 : selectedType === "frost" ? 20 : 45,
              timer: 0
            });
          }
          return;
        }
      }

      // Cast Meteor Spell if click elsewhere and have mana
      if (localMana >= 30) {
        localMana -= 30;
        setMana(localMana);
        for (const en of enemies) {
          if (Math.hypot(mx - en.x, my - en.y) < 70) {
            en.hp -= 50;
            for (let i = 0; i < 10; i++) {
              particles.push({
                x: en.x, y: en.y,
                vx: (Math.random() - 0.5) * 6,
                vy: (Math.random() - 0.5) * 6,
                life: 20,
                color: "#f97316"
              });
            }
          }
        }
      }
    };

    canvas.addEventListener("click", handleCanvasClick);

    const loop = () => {
      if (isDead) return;

      // Mana regen
      if (Math.random() < 0.05 && localMana < 200) {
        localMana += 1;
        setMana(localMana);
      }

      // Spawn Enemies
      spawnTimer++;
      if (spawnTimer > Math.max(25, 70 - Math.floor(localScore / 300))) {
        spawnTimer = 0;
        enemyIdCounter++;
        const hpBase = 40 + Math.floor(localScore / 10);
        enemies.push({
          id: enemyIdCounter,
          pathIdx: 0,
          x: PATH[0].x,
          y: PATH[0].y,
          hp: hpBase,
          maxHp: hpBase,
          speed: 1.2 + Math.random() * 0.6,
          slowedTimer: 0
        });
      }

      // Update Towers
      for (const t of towers) {
        t.timer++;
        if (t.timer >= t.cooldown) {
          // Find target enemy in range
          const target = enemies.find(e => Math.hypot(e.x - t.x, e.y - t.y) <= t.range);
          if (target) {
            t.timer = 0;
            projectiles.push({
              x: t.x,
              y: t.y,
              tx: target.x,
              ty: target.y,
              color: t.type === "fire" ? "#ef4444" : t.type === "frost" ? "#38bdf8" : "#eab308",
              speed: 8
            });

            target.hp -= t.damage;
            if (t.type === "frost") target.slowedTimer = 40;

            if (t.type === "lightning") {
              // Chain to extra nearby enemy
              const chain = enemies.find(e => e.id !== target.id && Math.hypot(e.x - target.x, e.y - target.y) < 80);
              if (chain) chain.hp -= t.damage * 0.6;
            }
          }
        }
      }

      // Update Projectiles
      for (let i = projectiles.length - 1; i >= 0; i--) {
        const p = projectiles[i];
        const ang = Math.atan2(p.ty - p.y, p.tx - p.x);
        p.x += Math.cos(ang) * p.speed;
        p.y += Math.sin(ang) * p.speed;
        if (Math.hypot(p.tx - p.x, p.ty - p.y) < 10) {
          projectiles.splice(i, 1);
        }
      }

      // Update Enemies
      for (let i = enemies.length - 1; i >= 0; i--) {
        const e = enemies[i];
        if (e.slowedTimer > 0) e.slowedTimer--;
        const currentSpeed = e.slowedTimer > 0 ? e.speed * 0.5 : e.speed;

        const targetPoint = PATH[e.pathIdx + 1];
        if (targetPoint) {
          const dx = targetPoint.x - e.x;
          const dy = targetPoint.y - e.y;
          const dist = Math.hypot(dx, dy);

          if (dist < currentSpeed) {
            e.x = targetPoint.x;
            e.y = targetPoint.y;
            e.pathIdx++;
          } else {
            e.x += (dx / dist) * currentSpeed;
            e.y += (dy / dist) * currentSpeed;
          }
        } else {
          // Reached Crystal!
          localHealth -= 15;
          setHealth(Math.max(0, localHealth));
          enemies.splice(i, 1);

          if (localHealth <= 0) {
            isDead = true;
            setGameOver(true);
            window.dispatchEvent(
              new CustomEvent("xakteir-game-score", { detail: { score: localScore } })
            );
            return;
          }
          continue;
        }

        // Check if enemy died
        if (e.hp <= 0) {
          localScore += 50;
          localMana = Math.min(200, localMana + 15);
          setScore(localScore);
          setMana(localMana);

          for (let p = 0; p < 8; p++) {
            particles.push({
              x: e.x, y: e.y,
              vx: (Math.random() - 0.5) * 4,
              vy: (Math.random() - 0.5) * 4,
              life: 15,
              color: "#a855f7"
            });
          }
          enemies.splice(i, 1);
        }
      }

      // Update Particles
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.life -= 1;
        if (p.life <= 0) particles.splice(i, 1);
      }

      // DRAWING
      ctx.fillStyle = "#0f172a";
      ctx.fillRect(0, 0, W, H);

      // Draw Path
      ctx.strokeStyle = "#1e293b";
      ctx.lineWidth = 36;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.beginPath();
      ctx.moveTo(PATH[0].x, PATH[0].y);
      for (let i = 1; i < PATH.length; i++) ctx.lineTo(PATH[i].x, PATH[i].y);
      ctx.stroke();

      ctx.strokeStyle = "#334155";
      ctx.lineWidth = 4;
      ctx.stroke();

      // Draw Crystal Base
      const endP = PATH[PATH.length - 1];
      ctx.fillStyle = "#a855f7";
      ctx.shadowColor = "#c084fc";
      ctx.shadowBlur = 20;
      ctx.beginPath();
      ctx.arc(endP.x, endP.y, 25, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      // Draw Tower Spots
      for (const spot of TOWER_SPOTS) {
        const hasTower = towers.some(t => Math.hypot(t.x - spot.x, t.y - spot.y) < 10);
        ctx.fillStyle = hasTower ? "#1e293b" : "rgba(255, 255, 255, 0.06)";
        ctx.strokeStyle = "rgba(255, 255, 255, 0.2)";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(spot.x, spot.y, 20, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      }

      // Draw Towers
      for (const t of towers) {
        ctx.shadowBlur = 10;
        ctx.shadowColor = t.type === "fire" ? "#ef4444" : t.type === "frost" ? "#38bdf8" : "#eab308";
        ctx.fillStyle = t.type === "fire" ? "#ef4444" : t.type === "frost" ? "#38bdf8" : "#eab308";
        ctx.beginPath();
        ctx.arc(t.x, t.y, 16, 0, Math.PI * 2);
        ctx.fill();

        // Tower Inner Core
        ctx.fillStyle = "#ffffff";
        ctx.beginPath();
        ctx.arc(t.x, t.y, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      }

      // Draw Projectiles
      for (const p of projectiles) {
        ctx.fillStyle = p.color;
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      }

      // Draw Enemies
      for (const e of enemies) {
        ctx.fillStyle = e.slowedTimer > 0 ? "#38bdf8" : "#a855f7";
        ctx.shadowColor = "#a855f7";
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.arc(e.x, e.y, 12, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;

        // Health bar
        const hpPct = Math.max(0, e.hp / e.maxHp);
        ctx.fillStyle = "#00000077";
        ctx.fillRect(e.x - 14, e.y - 20, 28, 4);
        ctx.fillStyle = "#22c55e";
        ctx.fillRect(e.x - 14, e.y - 20, 28 * hpPct, 4);
      }

      // Draw Particles
      for (const p of particles) {
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.life / 20;
        ctx.fillRect(p.x - 2, p.y - 2, 4, 4);
      }
      ctx.globalAlpha = 1.0;

      // HUD
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 15px monospace";
      ctx.textAlign = "left";
      ctx.fillText(`SCORE: ${localScore}`, 15, 30);
      ctx.fillText(`MANA: ${localMana}`, 155, 30);
      ctx.textAlign = "right";
      ctx.fillText(`CRYSTAL HP: ${localHealth}%`, W - 15, 30);

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(animId);
      canvas.removeEventListener("click", handleCanvasClick);
    };
  }, [gameStarted, gameOver, selectedType]);

  const startGame = () => {
    setScore(0);
    setMana(120);
    setHealth(100);
    setGameOver(false);
    setGameStarted(true);
  };

  return (
    <div className="w-full h-full flex flex-col items-center justify-center bg-zinc-950 text-white p-4">
      <div className="relative border border-purple-500/30 rounded-2xl overflow-hidden shadow-2xl shadow-purple-500/10">
        <canvas ref={canvasRef} width={640} height={480} className="bg-black block max-w-full h-auto cursor-pointer" />

        {/* Tower Selector Bar */}
        {gameStarted && !gameOver && (
          <div className="absolute top-12 left-4 flex gap-2">
            <button
              onClick={() => setSelectedType("fire")}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold border transition ${
                selectedType === "fire"
                  ? "bg-red-600 border-red-400 text-white shadow-md shadow-red-500/30"
                  : "bg-zinc-900/80 border-zinc-700 text-zinc-400"
              }`}
            >
              🔥 FIRE (50 MP)
            </button>
            <button
              onClick={() => setSelectedType("frost")}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold border transition ${
                selectedType === "frost"
                  ? "bg-sky-600 border-sky-400 text-white shadow-md shadow-sky-500/30"
                  : "bg-zinc-900/80 border-zinc-700 text-zinc-400"
              }`}
            >
              ❄️ FROST (60 MP)
            </button>
            <button
              onClick={() => setSelectedType("lightning")}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold border transition ${
                selectedType === "lightning"
                  ? "bg-amber-600 border-amber-400 text-white shadow-md shadow-amber-500/30"
                  : "bg-zinc-900/80 border-zinc-700 text-zinc-400"
              }`}
            >
              ⚡ LIGHTNING (75 MP)
            </button>
          </div>
        )}

        {(!gameStarted || gameOver) && (
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center">
            <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-400 to-indigo-400 mb-2">
              MAGIC DEFENDER
            </h1>
            <p className="text-zinc-400 mb-6 max-w-md text-sm">
              Place elemental wizard towers on circle spots to defend the Crystal Core from dark magic invaders!
            </p>
            {gameOver && (
              <div className="mb-6 bg-zinc-900/80 border border-zinc-800 rounded-xl p-4 min-w-[200px]">
                <p className="text-zinc-400 text-xs uppercase tracking-wider">Final Score</p>
                <p className="text-3xl font-mono font-bold text-purple-400">{score}</p>
              </div>
            )}
            <button
              onClick={startGame}
              className="px-8 py-3 bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-400 hover:to-indigo-500 text-white font-bold rounded-xl transition transform active:scale-95 shadow-lg shadow-purple-500/20"
            >
              {gameOver ? "PLAY AGAIN" : "DEFEND CRYSTAL"}
            </button>
            <p className="mt-4 text-xs text-zinc-500 font-mono">
              Click Ring Spots to Place Towers • Click Enemies directly for Meteor Blast (30 MP)
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
