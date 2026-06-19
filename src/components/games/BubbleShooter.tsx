"use client";
import { useEffect, useRef, useState } from "react";

export default function BubbleShooter() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef({
    shooter: { x: 320, angle: -Math.PI / 2, color: "#3b82f6" },
    bullet: null as null | { x: number; y: number; vx: number; vy: number; color: string },
    grid: [] as { x: number; y: number; color: string; alive: boolean }[],
    score: 0,
  });

  const colors = ["#ef4444", "#3b82f6", "#22c55e", "#f59e0b", "#a855f7"];

  useEffect(() => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;
    const s = stateRef.current;

    // Build grid
    for (let row = 0; row < 5; row++) {
      for (let col = 0; col < 10 - (row % 2); col++) {
        s.grid.push({
          x: col * 60 + (row % 2 === 0 ? 30 : 60),
          y: row * 50 + 50,
          color: colors[Math.floor(Math.random() * colors.length)],
          alive: true,
        });
      }
    }
    s.shooter.color = colors[Math.floor(Math.random() * colors.length)];

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const mx = (e.clientX - rect.left) * (canvas.width / rect.width);
      const my = (e.clientY - rect.top) * (canvas.height / rect.height);
      s.shooter.angle = Math.atan2(my - canvas.height + 50, mx - s.shooter.x);
    };

    const handleClick = () => {
      if (!s.bullet) {
        s.bullet = {
          x: s.shooter.x,
          y: canvas.height - 50,
          vx: Math.cos(s.shooter.angle) * 8,
          vy: Math.sin(s.shooter.angle) * 8,
          color: s.shooter.color,
        };
        s.shooter.color = colors[Math.floor(Math.random() * colors.length)];
      }
    };
    canvas.addEventListener("mousemove", handleMouseMove);
    canvas.addEventListener("click", handleClick);

    let frame: number;
    const tick = () => {
      const b = s.bullet;
      if (b) {
        b.x += b.vx; b.y += b.vy;
        if (b.x < 20 || b.x > canvas.width - 20) b.vx *= -1;
        if (b.y < 20) { s.bullet = null; }

        for (const bubble of s.grid) {
          if (!bubble.alive) continue;
          const dx = b.x - bubble.x, dy = b.y - bubble.y;
          if (Math.sqrt(dx * dx + dy * dy) < 50) {
            bubble.alive = false;
            s.score += bubble.color === b.color ? 20 : 5;
            s.bullet = null;
            break;
          }
        }
      }

      ctx.fillStyle = "#0a0a20";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Bubbles
      for (const bubble of s.grid) {
        if (!bubble.alive) continue;
        ctx.fillStyle = bubble.color;
        ctx.shadowColor = bubble.color;
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.arc(bubble.x, bubble.y, 22, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "rgba(255,255,255,0.3)";
        ctx.beginPath();
        ctx.arc(bubble.x - 7, bubble.y - 7, 8, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      }

      // Aim line
      ctx.strokeStyle = "rgba(255,255,255,0.2)";
      ctx.setLineDash([5, 10]);
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(s.shooter.x, canvas.height - 50);
      ctx.lineTo(s.shooter.x + Math.cos(s.shooter.angle) * 120, canvas.height - 50 + Math.sin(s.shooter.angle) * 120);
      ctx.stroke();
      ctx.setLineDash([]);

      // Shooter
      ctx.fillStyle = s.shooter.color;
      ctx.shadowColor = s.shooter.color;
      ctx.shadowBlur = 15;
      ctx.beginPath();
      ctx.arc(s.shooter.x, canvas.height - 50, 22, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      // Bullet
      if (b) {
        ctx.fillStyle = b.color;
        ctx.shadowColor = b.color;
        ctx.shadowBlur = 15;
        ctx.beginPath();
        ctx.arc(b.x, b.y, 20, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      }

      ctx.fillStyle = "white";
      ctx.font = "bold 16px monospace";
      ctx.textAlign = "left";
      ctx.fillText(`Score: ${s.score}`, 10, 30);

      frame = requestAnimationFrame(tick);
    };
    tick();
    return () => { canvas.removeEventListener("mousemove", handleMouseMove); canvas.removeEventListener("click", handleClick); cancelAnimationFrame(frame); };
  }, []);

  return (
    <div className="w-full h-full flex flex-col items-center justify-center bg-[#0a0a20]">
      <canvas ref={canvasRef} width={640} height={480} className="border-2 border-blue-500/50 rounded-xl shadow-2xl max-w-full max-h-full object-contain cursor-crosshair" />
      <p className="mt-4 text-blue-400 text-sm font-mono uppercase tracking-widest">Move mouse to aim, Click to shoot</p>
    </div>
  );
}
