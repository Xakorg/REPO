"use client";
import { useEffect, useRef } from "react";

export default function MiniGolf() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;
    const W = canvas.width, H = canvas.height;

    let bx = 100, by = H - 80;
    let vx = 0, vy = 0;
    let power = 0, powerDir = 1;
    let aiming = true;
    let strokes = 0;
    let mouseX = 0, mouseY = 0;
    let holed = false;

    const hole = { x: W - 100, y: 80, r: 20 };
    const walls = [
      { x: 60, y: H - 200, w: 20, h: 150 },
      { x: W / 2 - 50, y: 100, w: 20, h: 200 },
      { x: W / 2 + 100, y: H - 250, w: 20, h: 200 },
    ];

    canvas.addEventListener("mousemove", e => {
      const rect = canvas.getBoundingClientRect();
      mouseX = (e.clientX - rect.left) * (W / rect.width);
      mouseY = (e.clientY - rect.top) * (H / rect.height);
    });

    canvas.addEventListener("click", () => {
      if (!aiming || holed) return;
      const dx = mouseX - bx, dy = mouseY - by;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const speed = Math.min(power * 0.15, 12);
      vx = (dx / dist) * speed;
      vy = (dy / dist) * speed;
      aiming = false;
      strokes++;
      power = 0;
    });

    let frame: number;
    const tick = () => {
      if (aiming) {
        power += powerDir * 1.5;
        if (power >= 100 || power <= 0) powerDir *= -1;
      } else if (!holed) {
        vx *= 0.985; vy *= 0.985;
        bx += vx; by += vy;

        // Bounce off borders
        if (bx < 15 || bx > W - 15) vx *= -0.7;
        if (by < 15 || by > H - 15) vy *= -0.7;
        bx = Math.max(15, Math.min(W - 15, bx));
        by = Math.max(15, Math.min(H - 15, by));

        // Wall collisions
        for (const w of walls) {
          if (bx + 10 > w.x && bx - 10 < w.x + w.w && by + 10 > w.y && by - 10 < w.y + w.h) {
            if (bx < w.x || bx > w.x + w.w) vx *= -0.7;
            else vy *= -0.7;
          }
        }

        // Hole
        const dx = bx - hole.x, dy = by - hole.y;
        if (Math.sqrt(dx * dx + dy * dy) < hole.r + 5) {
          holed = true; vx = 0; vy = 0;
        }

        // Stop
        if (Math.abs(vx) < 0.2 && Math.abs(vy) < 0.2) { vx = 0; vy = 0; aiming = true; }
      }

      // Draw course
      const g = ctx.createLinearGradient(0, 0, W, H);
      g.addColorStop(0, "#14532d"); g.addColorStop(1, "#166534");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, W, H);

      // Border
      ctx.strokeStyle = "#15803d";
      ctx.lineWidth = 4;
      ctx.strokeRect(10, 10, W - 20, H - 20);

      // Walls
      for (const w of walls) {
        ctx.fillStyle = "#4b5563";
        ctx.fillRect(w.x, w.y, w.w, w.h);
      }

      // Hole
      ctx.fillStyle = "#111";
      ctx.beginPath(); ctx.arc(hole.x, hole.y, hole.r, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = "#ef4444";
      ctx.beginPath();
      ctx.moveTo(hole.x, hole.y - hole.r);
      ctx.lineTo(hole.x + 20, hole.y - hole.r - 15);
      ctx.lineTo(hole.x, hole.y - hole.r - 10);
      ctx.fill();

      // Aim line
      if (aiming && !holed) {
        const dx = mouseX - bx, dy = mouseY - by;
        const dist = Math.sqrt(dx * dx + dy * dy);
        ctx.strokeStyle = `rgba(255,255,100,${power / 200 + 0.2})`;
        ctx.setLineDash([6, 6]);
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(bx, by);
        ctx.lineTo(bx + (dx / dist) * (power * 1.2), by + (dy / dist) * (power * 1.2));
        ctx.stroke();
        ctx.setLineDash([]);
      }

      // Power bar
      if (aiming && !holed) {
        ctx.fillStyle = "#1f2937";
        ctx.fillRect(20, H - 35, 120, 12);
        ctx.fillStyle = `hsl(${120 - power * 1.2}, 80%, 50%)`;
        ctx.fillRect(20, H - 35, power * 1.2, 12);
      }

      // Ball
      ctx.fillStyle = "white";
      ctx.shadowColor = "white"; ctx.shadowBlur = 10;
      ctx.beginPath(); ctx.arc(bx, by, 10, 0, Math.PI * 2); ctx.fill();
      ctx.shadowBlur = 0;

      // HUD
      ctx.fillStyle = "white";
      ctx.font = "bold 16px monospace";
      ctx.textAlign = "left";
      ctx.fillText(`Strokes: ${strokes}`, 15, 30);
      if (holed) {
        ctx.fillStyle = "rgba(0,0,0,0.7)";
        ctx.fillRect(0, 0, W, H);
        ctx.fillStyle = "#fbbf24";
        ctx.font = "bold 42px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText("⛳ Hole In It!", W / 2, H / 2);
        ctx.font = "24px monospace";
        ctx.fillStyle = "white";
        ctx.fillText(`${strokes} strokes!`, W / 2, H / 2 + 50);
      }

      frame = requestAnimationFrame(tick);
    };
    tick();
    return () => cancelAnimationFrame(frame);
  }, []);

  return (
    <div className="w-full h-full flex flex-col items-center justify-center bg-[#052e16]">
      <canvas ref={canvasRef} width={640} height={480} className="border-2 border-green-500/50 rounded-xl shadow-2xl max-w-full max-h-full object-contain cursor-crosshair" />
      <p className="mt-4 text-green-400 text-sm font-mono uppercase tracking-widest">Move mouse to aim, click to putt!</p>
    </div>
  );
}
