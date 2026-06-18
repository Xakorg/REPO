"use client";
import { useEffect, useRef, useState } from "react";

export default function Plinko() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const ballsRef = useRef<{ x: number; y: number; vx: number; vy: number; color: string }[]>([]);
  const [score, setScore] = useState(0);

  useEffect(() => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;
    const W = canvas.width, H = canvas.height;

    const PEGS: { x: number; y: number }[] = [];
    const ROWS = 10, COLS = 12;
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c <= COLS - (r % 2); c++) {
        PEGS.push({ x: (c + (r % 2 === 0 ? 0.5 : 0)) * (W / COLS), y: 80 + r * 38 });
      }
    }

    const BUCKETS = [500, 100, 50, 20, 10, 5, 10, 20, 50, 100, 500];
    const BW = W / BUCKETS.length;

    const handleClick = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const mx = (e.clientX - rect.left) * (W / rect.width);
      ballsRef.current.push({
        x: mx, y: 20,
        vx: (Math.random() - 0.5) * 2,
        vy: 3,
        color: `hsl(${Math.random() * 360}, 80%, 60%)`,
      });
    };
    canvas.addEventListener("click", handleClick);

    let frame: number;
    const tick = () => {
      const balls = ballsRef.current;
      for (const b of balls) {
        b.vy += 0.4;
        b.x += b.vx; b.y += b.vy;
        if (b.x < 10 || b.x > W - 10) b.vx *= -0.7;

        for (const p of PEGS) {
          const dx = b.x - p.x, dy = b.y - p.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 18) {
            const nx = dx / dist, ny = dy / dist;
            const dot = b.vx * nx + b.vy * ny;
            b.vx -= 2 * dot * nx * 0.8 + (Math.random() - 0.5) * 2;
            b.vy -= 2 * dot * ny * 0.8;
          }
        }

        if (b.y > H - 30) {
          const idx = Math.min(Math.floor(b.x / BW), BUCKETS.length - 1);
          setScore(s => s + BUCKETS[idx]);
          b.y = H + 100; // mark for removal
        }
      }
      ballsRef.current = balls.filter(b => b.y < H + 50);

      ctx.fillStyle = "#0a0a1e";
      ctx.fillRect(0, 0, W, H);

      // Pegs
      for (const p of PEGS) {
        ctx.fillStyle = "#6366f1";
        ctx.shadowColor = "#6366f1"; ctx.shadowBlur = 8;
        ctx.beginPath(); ctx.arc(p.x, p.y, 7, 0, Math.PI * 2); ctx.fill();
        ctx.shadowBlur = 0;
      }

      // Buckets
      for (let i = 0; i <= BUCKETS.length; i++) {
        ctx.strokeStyle = "#334155";
        ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(i * BW, H - 40); ctx.lineTo(i * BW, H); ctx.stroke();
      }
      for (let i = 0; i < BUCKETS.length; i++) {
        const hue = BUCKETS[i] >= 100 ? "120" : BUCKETS[i] >= 50 ? "60" : "0";
        ctx.fillStyle = `hsla(${hue}, 70%, 50%, 0.3)`;
        ctx.fillRect(i * BW + 1, H - 39, BW - 2, 39);
        ctx.fillStyle = `hsl(${hue}, 80%, 65%)`;
        ctx.font = "bold 10px monospace";
        ctx.textAlign = "center";
        ctx.fillText(String(BUCKETS[i]), i * BW + BW / 2, H - 12);
      }

      // Balls
      for (const b of ballsRef.current) {
        ctx.fillStyle = b.color;
        ctx.shadowColor = b.color; ctx.shadowBlur = 10;
        ctx.beginPath(); ctx.arc(b.x, b.y, 10, 0, Math.PI * 2); ctx.fill();
        ctx.shadowBlur = 0;
      }

      ctx.fillStyle = "white";
      ctx.font = "bold 18px monospace";
      ctx.textAlign = "left";
      ctx.fillText(`Score: ${score}`, 10, 28);
      ctx.fillStyle = "rgba(255,255,255,0.3)";
      ctx.font = "12px monospace";
      ctx.textAlign = "center";
      ctx.fillText("Click to drop a ball!", W / 2, 55);

      frame = requestAnimationFrame(tick);
    };
    tick();
    return () => { canvas.removeEventListener("click", handleClick); cancelAnimationFrame(frame); };
  }, []);

  return (
    <div className="w-full h-full flex flex-col items-center justify-center bg-[#0a0a1e]">
      <canvas ref={canvasRef} width={640} height={480} className="border border-indigo-500/30 rounded-xl shadow-2xl max-w-full max-h-full object-contain cursor-pointer" />
    </div>
  );
}
