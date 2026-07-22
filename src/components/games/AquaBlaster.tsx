"use client";
import React, { useEffect, useRef, useState } from "react";

export default function AquaBlaster() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [gameState, setGameState] = useState<"IDLE" | "PLAYING" | "GAMEOVER">("IDLE");
  const [score, setScore] = useState(0);
  const [oxygen, setOxygen] = useState(100);

  const subRef = useRef({ x: 400, y: 300, vx: 0, vy: 0 });
  const torpedoesRef = useRef<Array<{ x: number; y: number; vx: number; vy: number }>>([]);
  const monstersRef = useRef<Array<{ x: number; y: number; vx: number; vy: number; radius: number }>>([]);
  const bubblesRef = useRef<Array<{ x: number; y: number; radius: number }>>([]);
  const keysRef = useRef<{ w: boolean; a: boolean; s: boolean; d: boolean }>({ w: false, a: false, s: false, d: false });
  const mouseRef = useRef({ x: 400, y: 300 });

  const scoreRef = useRef(0);
  scoreRef.current = score;

  const startGame = () => {
    subRef.current = { x: 400, y: 300, vx: 0, vy: 0 };
    torpedoesRef.current = [];
    monstersRef.current = [];
    bubblesRef.current = [];
    setScore(0);
    setOxygen(100);
    setGameState("PLAYING");
  };

  const fireTorpedo = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (gameState !== "PLAYING") return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;

    const sub = subRef.current;
    const dx = mx - sub.x;
    const dy = my - sub.y;
    const len = Math.sqrt(dx * dx + dy * dy) || 1;

    torpedoesRef.current.push({
      x: sub.x,
      y: sub.y,
      vx: (dx / len) * 9,
      vy: (dy / len) * 9,
    });
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "w" || e.key === "W" || e.key === "ArrowUp") keysRef.current.w = true;
      if (e.key === "a" || e.key === "A" || e.key === "ArrowLeft") keysRef.current.a = true;
      if (e.key === "s" || e.key === "S" || e.key === "ArrowDown") keysRef.current.s = true;
      if (e.key === "d" || e.key === "D" || e.key === "ArrowRight") keysRef.current.d = true;
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === "w" || e.key === "W" || e.key === "ArrowUp") keysRef.current.w = false;
      if (e.key === "a" || e.key === "A" || e.key === "ArrowLeft") keysRef.current.a = false;
      if (e.key === "s" || e.key === "S" || e.key === "ArrowDown") keysRef.current.s = false;
      if (e.key === "d" || e.key === "D" || e.key === "ArrowRight") keysRef.current.d = false;
    };
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, []);

  useEffect(() => {
    if (gameState !== "PLAYING") return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;
    let frame = 0;

    const loop = () => {
      frame++;
      const sub = subRef.current;

      // Deplete oxygen slowly
      if (frame % 20 === 0) {
        setOxygen((ox) => {
          const next = ox - 1;
          if (next <= 0) {
            setGameState("GAMEOVER");
            window.dispatchEvent(
              new CustomEvent("xakteir-game-score", {
                detail: { score: scoreRef.current },
              })
            );
          }
          return Math.max(0, next);
        });
      }

      // Sub movement
      if (keysRef.current.w) sub.vy -= 0.4;
      if (keysRef.current.s) sub.vy += 0.4;
      if (keysRef.current.a) sub.vx -= 0.4;
      if (keysRef.current.d) sub.vx += 0.4;

      sub.vx *= 0.94;
      sub.vy *= 0.94;
      sub.x += sub.vx;
      sub.y += sub.vy;

      // Clamp sub within screen
      sub.x = Math.max(20, Math.min(canvas.width - 20, sub.x));
      sub.y = Math.max(20, Math.min(canvas.height - 20, sub.y));

      // Spawn monsters
      if (frame % 45 === 0) {
        const side = Math.floor(Math.random() * 4);
        let mx = 0, my = 0;
        if (side === 0) { mx = Math.random() * canvas.width; my = -30; }
        else if (side === 1) { mx = canvas.width + 30; my = Math.random() * canvas.height; }
        else if (side === 2) { mx = Math.random() * canvas.width; my = canvas.height + 30; }
        else { mx = -30; my = Math.random() * canvas.height; }

        const angle = Math.atan2(sub.y - my, sub.x - mx);
        const speed = 1.5 + Math.random() * 1.5;
        monstersRef.current.push({
          x: mx,
          y: my,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          radius: 18,
        });
      }

      // Spawn Oxygen Bubbles
      if (frame % 120 === 0) {
        bubblesRef.current.push({
          x: 40 + Math.random() * (canvas.width - 80),
          y: canvas.height + 20,
          radius: 14,
        });
      }

      // Move torpedoes
      for (let i = torpedoesRef.current.length - 1; i >= 0; i--) {
        const t = torpedoesRef.current[i];
        t.x += t.vx;
        t.y += t.vy;
        if (t.x < -20 || t.x > canvas.width + 20 || t.y < -20 || t.y > canvas.height + 20) {
          torpedoesRef.current.splice(i, 1);
        }
      }

      // Move monsters & collide with torpedoes/sub
      for (let i = monstersRef.current.length - 1; i >= 0; i--) {
        const m = monstersRef.current[i];
        m.x += m.vx;
        m.y += m.vy;

        // Sub collision
        const sdx = sub.x - m.x;
        const sdy = sub.y - m.y;
        if (Math.sqrt(sdx * sdx + sdy * sdy) < m.radius + 15) {
          setGameState("GAMEOVER");
          window.dispatchEvent(
            new CustomEvent("xakteir-game-score", {
              detail: { score: scoreRef.current },
            })
          );
        }

        // Torpedo collision
        for (let j = torpedoesRef.current.length - 1; j >= 0; j--) {
          const t = torpedoesRef.current[j];
          const tdx = t.x - m.x;
          const tdy = t.y - m.y;
          if (Math.sqrt(tdx * tdx + tdy * tdy) < m.radius + 6) {
            torpedoesRef.current.splice(j, 1);
            monstersRef.current.splice(i, 1);
            setScore((s) => s + 100);
            break;
          }
        }
      }

      // Move bubbles & check collection
      for (let i = bubblesRef.current.length - 1; i >= 0; i--) {
        const b = bubblesRef.current[i];
        b.y -= 1.5;

        const bdx = sub.x - b.x;
        const bdy = sub.y - b.y;
        if (Math.sqrt(bdx * bdx + bdy * bdy) < b.radius + 15) {
          bubblesRef.current.splice(i, 1);
          setOxygen((ox) => Math.min(100, ox + 25));
          setScore((s) => s + 50);
        } else if (b.y < -20) {
          bubblesRef.current.splice(i, 1);
        }
      }

      // Draw
      ctx.fillStyle = "#030712";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw Bubbles
      bubblesRef.current.forEach((b) => {
        ctx.beginPath();
        ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(56, 189, 248, 0.4)";
        ctx.fill();
        ctx.strokeStyle = "#38bdf8";
        ctx.stroke();
      });

      // Draw Torpedoes
      torpedoesRef.current.forEach((t) => {
        ctx.fillStyle = "#facc15";
        ctx.beginPath();
        ctx.arc(t.x, t.y, 4, 0, Math.PI * 2);
        ctx.fill();
      });

      // Draw Monsters
      monstersRef.current.forEach((m) => {
        ctx.fillStyle = "#e11d48";
        ctx.beginPath();
        ctx.arc(m.x, m.y, m.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = "#fb7185";
        ctx.lineWidth = 2;
        ctx.stroke();
      });

      // Draw Submarine
      ctx.fillStyle = "#0284c7";
      ctx.beginPath();
      ctx.ellipse(sub.x, sub.y, 22, 12, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#38bdf8";
      ctx.fillRect(sub.x - 4, sub.y - 18, 8, 8);

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [gameState]);

  return (
    <div className="w-full h-full flex flex-col items-center justify-center bg-zinc-950 text-white p-4">
      <div className="flex gap-8 mb-4 text-xl font-bold uppercase tracking-wider">
        <div>Score: <span className="text-teal-400">{score}</span></div>
        <div>Oxygen: <span className={oxygen < 30 ? "text-red-400 animate-pulse" : "text-sky-400"}>{oxygen}%</span></div>
      </div>
      <div className="relative border border-zinc-800 rounded-xl overflow-hidden shadow-2xl">
        <canvas
          ref={canvasRef}
          width={800}
          height={600}
          onClick={fireTorpedo}
          className="block bg-zinc-950 cursor-crosshair"
        />
        {gameState !== "PLAYING" && (
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center gap-4">
            <h1 className="text-4xl font-extrabold tracking-widest text-teal-400">AQUA BLASTER</h1>
            {gameState === "GAMEOVER" && (
              <p className="text-2xl text-zinc-300">Final Score: <span className="text-teal-400 font-bold">{score}</span></p>
            )}
            <p className="text-sm text-zinc-400">WASD/Arrows to Move, Click to Blast Torpedoes! Collect Oxygen Bubbles!</p>
            <button
              onClick={startGame}
              className="mt-4 px-8 py-3 bg-teal-500 hover:bg-teal-400 text-zinc-950 font-black tracking-wider rounded-lg transition-transform active:scale-95"
            >
              {gameState === "GAMEOVER" ? "RESTART" : "PLAY NOW"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
