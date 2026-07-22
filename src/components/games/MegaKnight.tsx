"use client";
import { useEffect, useRef, useState } from "react";

export default function MegaKnight() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [score, setScore] = useState(0);
  const [hp, setHp] = useState(100);
  const [gameOver, setGameOver] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);

  useEffect(() => {
    if (!gameStarted || gameOver) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const W = canvas.width;
    const H = canvas.height;
    const GROUND_Y = H - 80;

    let px = 100;
    let py = GROUND_Y;
    let vy = 0;
    let isGrounded = true;
    let isAttacking = false;
    let attackTimer = 0;
    let facing: "left" | "right" = "right";

    let localScore = 0;
    let localHp = 100;
    let isDead = false;

    const keys: Record<string, boolean> = {};

    const handleKeyDown = (e: KeyboardEvent) => {
      keys[e.code] = true;
      if ((e.code === "Space" || e.code === "KeyW" || e.code === "ArrowUp") && isGrounded) {
        vy = -13;
        isGrounded = false;
      }
      if ((e.code === "KeyJ" || e.code === "KeyZ") && !isAttacking) {
        isAttacking = true;
        attackTimer = 15;
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => { keys[e.code] = false; };
    const handleMouseDown = () => {
      if (!isAttacking) {
        isAttacking = true;
        attackTimer = 15;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    canvas.addEventListener("mousedown", handleMouseDown);

    const enemies: { x: number; y: number; hp: number; maxHp: number; type: "goblin" | "skeleton" }[] = [];
    const particles: { x: number; y: number; vx: number; vy: number; life: number; color: string }[] = [];

    let spawnTimer = 0;
    let animId: number;

    const loop = () => {
      if (isDead) return;

      // Player Movement
      const moveSpeed = 4.5;
      if (keys["ArrowLeft"] || keys["KeyA"]) {
        px -= moveSpeed;
        facing = "left";
      }
      if (keys["ArrowRight"] || keys["KeyD"]) {
        px += moveSpeed;
        facing = "right";
      }

      px = Math.max(30, Math.min(W - 30, px));

      // Gravity & Jumping
      vy += 0.7;
      py += vy;
      if (py >= GROUND_Y) {
        py = GROUND_Y;
        vy = 0;
        isGrounded = true;
      }

      // Attack Timer
      if (isAttacking) {
        attackTimer--;
        if (attackTimer <= 0) {
          isAttacking = false;
        }
      }

      // Spawning Enemies
      spawnTimer++;
      if (spawnTimer > Math.max(40, 90 - Math.floor(localScore / 300))) {
        spawnTimer = 0;
        const side = Math.random() < 0.5 ? -40 : W + 40;
        const type = Math.random() < 0.6 ? "goblin" : "skeleton";
        enemies.push({
          x: side,
          y: GROUND_Y,
          hp: type === "goblin" ? 30 : 60,
          maxHp: type === "goblin" ? 30 : 60,
          type
        });
      }

      // Update Enemies
      for (let i = enemies.length - 1; i >= 0; i--) {
        const e = enemies[i];
        const spd = e.type === "goblin" ? 2.2 : 1.4;
        if (e.x < px) e.x += spd;
        else e.x -= spd;

        // Player Sword Collision
        if (isAttacking && attackTimer > 5) {
          const attackBoxX = facing === "right" ? px + 10 : px - 60;
          if (e.x >= attackBoxX && e.x <= attackBoxX + 50 && Math.abs(e.y - py) < 40) {
            e.hp -= 15;
            e.x += facing === "right" ? 15 : -15; // Knockback

            for (let p = 0; p < 5; p++) {
              particles.push({
                x: e.x, y: e.y - 15,
                vx: (Math.random() - 0.5) * 4,
                vy: (Math.random() - 0.5) * 4,
                life: 15,
                color: "#f87171"
              });
            }
          }
        }

        // Enemy Hit Player
        if (Math.abs(e.x - px) < 25 && Math.abs(e.y - py) < 30) {
          localHp -= e.type === "goblin" ? 0.3 : 0.6;
          setHp(Math.max(0, Math.floor(localHp)));

          if (localHp <= 0) {
            isDead = true;
            setGameOver(true);
            window.dispatchEvent(
              new CustomEvent("xakteir-game-score", { detail: { score: localScore } })
            );
            return;
          }
        }

        // Enemy Death
        if (e.hp <= 0) {
          localScore += e.type === "goblin" ? 100 : 200;
          setScore(localScore);
          for (let p = 0; p < 12; p++) {
            particles.push({
              x: e.x, y: e.y - 15,
              vx: (Math.random() - 0.5) * 5,
              vy: (Math.random() - 0.5) * 5,
              life: 20,
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
      ctx.fillStyle = "#0c0a09";
      ctx.fillRect(0, 0, W, H);

      // Castle Background Wall
      ctx.fillStyle = "#1c1917";
      ctx.fillRect(0, 0, W, GROUND_Y);

      // Ground Floor
      ctx.fillStyle = "#44403c";
      ctx.fillRect(0, GROUND_Y, W, H - GROUND_Y);

      ctx.strokeStyle = "#292524";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(0, GROUND_Y);
      ctx.lineTo(W, GROUND_Y);
      ctx.stroke();

      // Draw Enemies
      for (const e of enemies) {
        ctx.fillStyle = e.type === "goblin" ? "#22c55e" : "#e2e8f0";
        ctx.shadowColor = e.type === "goblin" ? "#15803d" : "#94a3b8";
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.arc(e.x, e.y - 20, 14, 0, Math.PI * 2);
        ctx.fill();

        // Enemy Body
        ctx.fillRect(e.x - 10, e.y - 20, 20, 20);
        ctx.shadowBlur = 0;

        // Enemy HP Bar
        const hpPct = Math.max(0, e.hp / e.maxHp);
        ctx.fillStyle = "#00000077";
        ctx.fillRect(e.x - 15, e.y - 42, 30, 4);
        ctx.fillStyle = "#ef4444";
        ctx.fillRect(e.x - 15, e.y - 42, 30 * hpPct, 4);
      }

      // Draw Player Mega Knight
      ctx.fillStyle = "#64748b";
      ctx.shadowColor = "#38bdf8";
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.arc(px, py - 24, 16, 0, Math.PI * 2);
      ctx.fill();

      // Knight Heavy Armor Body
      ctx.fillRect(px - 14, py - 24, 28, 24);

      // Helmet Visor Glow
      ctx.fillStyle = "#38bdf8";
      const visorX = facing === "right" ? px + 4 : px - 12;
      ctx.fillRect(visorX, py - 26, 8, 4);
      ctx.shadowBlur = 0;

      // Draw Sword Slash Arc
      if (isAttacking) {
        ctx.strokeStyle = "#facc15";
        ctx.shadowColor = "#f59e0b";
        ctx.shadowBlur = 15;
        ctx.lineWidth = 6;
        ctx.beginPath();
        const startAng = facing === "right" ? -Math.PI / 3 : Math.PI + Math.PI / 3;
        const endAng = facing === "right" ? Math.PI / 3 : Math.PI - Math.PI / 3;
        ctx.arc(px, py - 15, 38, startAng, endAng);
        ctx.stroke();
        ctx.shadowBlur = 0;
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
      ctx.font = "bold 16px monospace";
      ctx.textAlign = "left";
      ctx.fillText(`SCORE: ${localScore}`, 20, 30);

      // Health Bar HUD
      ctx.fillStyle = "#00000088";
      ctx.fillRect(W - 170, 15, 150, 16);
      ctx.fillStyle = "#22c55e";
      ctx.fillRect(W - 170, 15, 1.5 * localHp, 16);
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 12px monospace";
      ctx.textAlign = "right";
      ctx.fillText(`HP ${Math.floor(localHp)}%`, W - 25, 28);

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
      canvas.removeEventListener("mousedown", handleMouseDown);
    };
  }, [gameStarted, gameOver]);

  const startGame = () => {
    setScore(0);
    setHp(100);
    setGameOver(false);
    setGameStarted(true);
  };

  return (
    <div className="w-full h-full flex flex-col items-center justify-center bg-zinc-950 text-white p-4">
      <div className="relative border border-slate-500/30 rounded-2xl overflow-hidden shadow-2xl shadow-slate-500/10">
        <canvas ref={canvasRef} width={640} height={480} className="bg-black block max-w-full h-auto cursor-pointer" />
        {(!gameStarted || gameOver) && (
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center">
            <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-slate-300 via-sky-400 to-indigo-400 mb-2">
              MEGA KNIGHT
            </h1>
            <p className="text-zinc-400 mb-6 max-w-md text-sm">
              Slay hordes of invading goblins and dark skeletons with heavy sword strikes!
            </p>
            {gameOver && (
              <div className="mb-6 bg-zinc-900/80 border border-zinc-800 rounded-xl p-4 min-w-[200px]">
                <p className="text-zinc-400 text-xs uppercase tracking-wider">Final Score</p>
                <p className="text-3xl font-mono font-bold text-sky-400">{score}</p>
              </div>
            )}
            <button
              onClick={startGame}
              className="px-8 py-3 bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white font-bold rounded-xl transition transform active:scale-95 shadow-lg shadow-sky-500/20"
            >
              {gameOver ? "PLAY AGAIN" : "ENTER BATTLE"}
            </button>
            <p className="mt-4 text-xs text-zinc-500 font-mono">
              [A / D] Move • [W / Space] Jump • [J / Click] Sword Slash
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
