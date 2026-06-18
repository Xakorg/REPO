"use client";
import { useEffect, useRef } from "react";

export default function Pinball() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;
    const W = canvas.width, H = canvas.height;

    let bx = W / 2, by = H - 100, vbx = 3, vby = -7;
    let score = 0;
    let lAngle = 0.4, rAngle = Math.PI - 0.4;
    let lActive = false, rActive = false;

    const bumpers = [
      { x: 150, y: 180, r: 30 }, { x: 320, y: 140, r: 30 }, { x: 490, y: 180, r: 30 },
      { x: 220, y: 280, r: 25 }, { x: 420, y: 280, r: 25 },
    ];

    const keys: Record<string, boolean> = {};
    window.addEventListener("keydown", e => { keys[e.code] = true; });
    window.addEventListener("keyup", e => { keys[e.code] = false; });

    let frame: number;
    const tick = () => {
      lActive = keys["KeyZ"] || keys["ArrowLeft"];
      rActive = keys["Slash"] || keys["ArrowRight"];

      // Flippers
      const targetL = lActive ? 0.1 : 0.4;
      const targetR = rActive ? Math.PI - 0.1 : Math.PI - 0.4;
      lAngle += (targetL - lAngle) * 0.25;
      rAngle += (targetR - rAngle) * 0.25;

      vby += 0.3;
      bx += vbx; by += vby;

      // Wall bounce
      if (bx < 15 || bx > W - 15) vbx *= -1;
      if (by < 15) vby = Math.abs(vby);

      // Bumper collisions
      for (const b of bumpers) {
        const dx = bx - b.x, dy = by - b.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < b.r + 10) {
          const nx = dx / dist, ny = dy / dist;
          const dot = vbx * nx + vby * ny;
          vbx = (vbx - 2 * dot * nx) * 1.2;
          vby = (vby - 2 * dot * ny) * 1.2;
          score += 100;
        }
      }

      // Flipper collisions
      const lTip = { x: 120 + Math.cos(lAngle) * 80, y: H - 80 + Math.sin(lAngle) * 80 };
      const rTip = { x: 520 + Math.cos(rAngle) * 80, y: H - 80 + Math.sin(rAngle) * 80 };

      // Simple: if ball near bottom left flipper zone
      if (by > H - 110 && by < H - 60 && bx > 100 && bx < 280) {
        if (lActive) { vby = -12; vbx += (bx - 180) / 20; score += 10; }
        else if (by > H - 65) { by = H - 65; }
      }
      if (by > H - 110 && by < H - 60 && bx > 360 && bx < 540) {
        if (rActive) { vby = -12; vbx += (bx - 450) / 20; score += 10; }
        else if (by > H - 65) { by = H - 65; }
      }

      // Ball drain
      if (by > H + 20) { bx = W / 2; by = H - 150; vbx = (Math.random() - 0.5) * 6; vby = -8; }

      // Draw
      ctx.fillStyle = "#050510";
      ctx.fillRect(0, 0, W, H);

      // Borders
      ctx.strokeStyle = "#6366f1";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(0, 0); ctx.lineTo(0, H);
      ctx.moveTo(W, 0); ctx.lineTo(W, H);
      ctx.stroke();

      // Bumpers
      for (const b of bumpers) {
        ctx.fillStyle = "#f59e0b";
        ctx.shadowColor = "#f59e0b"; ctx.shadowBlur = 20;
        ctx.beginPath(); ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = "#fbbf24";
        ctx.beginPath(); ctx.arc(b.x, b.y, b.r - 10, 0, Math.PI * 2); ctx.fill();
        ctx.shadowBlur = 0;
      }

      // Flippers
      ctx.strokeStyle = lActive ? "#22c55e" : "#6366f1";
      ctx.lineWidth = 10; ctx.lineCap = "round";
      ctx.beginPath(); ctx.moveTo(120, H - 80); ctx.lineTo(120 + Math.cos(lAngle) * 80, H - 80 + Math.sin(lAngle) * 80); ctx.stroke();
      ctx.strokeStyle = rActive ? "#22c55e" : "#6366f1";
      ctx.beginPath(); ctx.moveTo(520, H - 80); ctx.lineTo(520 + Math.cos(rAngle) * 80, H - 80 + Math.sin(rAngle) * 80); ctx.stroke();

      // Ball
      ctx.fillStyle = "#e2e8f0";
      ctx.shadowColor = "white"; ctx.shadowBlur = 15;
      ctx.beginPath(); ctx.arc(bx, by, 12, 0, Math.PI * 2); ctx.fill();
      ctx.shadowBlur = 0;

      ctx.fillStyle = "white";
      ctx.font = "bold 20px monospace";
      ctx.textAlign = "left";
      ctx.fillText(`Score: ${score}`, 10, 28);
      ctx.fillStyle = "rgba(255,255,255,0.3)";
      ctx.font = "11px monospace";
      ctx.textAlign = "center";
      ctx.fillText("Z/← Left Flipper · //→ Right Flipper", W / 2, H - 10);

      frame = requestAnimationFrame(tick);
    };
    tick();
    return () => cancelAnimationFrame(frame);
  }, []);

  return (
    <div className="w-full h-full flex flex-col items-center justify-center bg-[#050510]">
      <canvas ref={canvasRef} width={640} height={480} className="border border-indigo-500/30 rounded-xl shadow-2xl max-w-full max-h-full object-contain" />
    </div>
  );
}
