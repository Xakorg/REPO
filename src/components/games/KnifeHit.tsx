"use client";
import { useEffect, useRef } from "react";

export default function KnifeHit() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;
    const W = canvas.width, H = canvas.height;
    const CX = W / 2, CY = H / 2 - 30;
    const LOG_R = 80;

    let angle = 0, rotSpeed = 0.02;
    let knives: number[] = [];
    let flying: { y: number; angle: number } | null = null;
    let score = 0, lives = 3, gameOver = false;

    const throwKnife = () => {
      if (gameOver || flying) return;
      flying = { y: H - 50, angle: 0 };
    };
    canvas.addEventListener("click", throwKnife);
    window.addEventListener("keydown", e => { if (e.code === "Space") throwKnife(); });

    let frame: number;
    const tick = () => {
      if (!gameOver) {
        angle += rotSpeed;

        if (flying) {
          flying.y -= 8;
          const dist = Math.sqrt((CX - CX) ** 2 + (flying.y - CY) ** 2);
          if (dist <= LOG_R + 10) {
            // Check if it hit another knife
            const stuckAngle = -Math.PI / 2 - angle;
            let hit = false;
            for (const ka of knives) {
              let diff = ((ka - stuckAngle) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2);
              if (diff > Math.PI) diff = Math.PI * 2 - diff;
              if (diff < 0.18) { hit = true; break; }
            }
            if (hit) { lives--; if (lives <= 0) gameOver = true; }
            else { knives.push(stuckAngle); score++; rotSpeed = 0.02 + score * 0.001; }
            flying = null;
          }
          if (flying && flying.y < 0) flying = null;
        }
      }

      ctx.fillStyle = "#111118";
      ctx.fillRect(0, 0, W, H);

      // Log
      ctx.fillStyle = "#92400e";
      ctx.shadowColor = "#b45309"; ctx.shadowBlur = 10;
      ctx.beginPath(); ctx.arc(CX, CY, LOG_R, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = "#a16207";
      ctx.beginPath(); ctx.arc(CX, CY, LOG_R - 12, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = "#b45309";
      for (let r = 15; r <= LOG_R - 5; r += 15) {
        ctx.beginPath(); ctx.arc(CX, CY, r, 0, Math.PI * 2); ctx.stroke();
      }
      ctx.shadowBlur = 0;

      // Stuck knives
      for (const ka of knives) {
        const kAngle = ka + angle;
        const kx = CX + Math.cos(kAngle) * (LOG_R + 35);
        const ky = CY + Math.sin(kAngle) * (LOG_R + 35);
        ctx.save();
        ctx.translate(kx, ky);
        ctx.rotate(kAngle + Math.PI / 2);
        ctx.fillStyle = "#d1d5db";
        ctx.fillRect(-3, -30, 6, 25);
        ctx.fillStyle = "#6b7280";
        ctx.fillRect(-5, -5, 10, 15);
        ctx.restore();
      }

      // Flying knife
      if (flying) {
        ctx.save();
        ctx.translate(CX, flying.y);
        ctx.rotate(Math.PI);
        ctx.fillStyle = "#e2e8f0";
        ctx.fillRect(-3, -30, 6, 25);
        ctx.fillStyle = "#6b7280";
        ctx.fillRect(-5, -5, 10, 15);
        ctx.restore();
      }

      ctx.fillStyle = "white";
      ctx.font = "bold 20px monospace";
      ctx.textAlign = "left";
      ctx.fillText(`Score: ${score}  Lives: ${"♥".repeat(lives)}`, 10, 28);
      ctx.textAlign = "center";
      ctx.font = "13px monospace";
      ctx.fillStyle = "rgba(255,255,255,0.4)";
      ctx.fillText("Click or Space to throw", CX, H - 15);

      if (gameOver) {
        ctx.fillStyle = "rgba(0,0,0,0.85)";
        ctx.fillRect(0, 0, W, H);
        ctx.fillStyle = "white";
        ctx.font = "bold 42px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText("💀 Hit!", W / 2, H / 2);
        ctx.font = "22px monospace";
        ctx.fillText(`Knives: ${score}  — click to retry`, W / 2, H / 2 + 50);
        canvas.addEventListener("click", () => { knives = []; score = 0; lives = 3; rotSpeed = 0.02; gameOver = false; }, { once: true });
      }

      frame = requestAnimationFrame(tick);
    };
    tick();
    return () => cancelAnimationFrame(frame);
  }, []);

  return (
    <div className="w-full h-full flex flex-col items-center justify-center bg-[#111118]">
      <canvas ref={canvasRef} width={640} height={480} className="border border-white/10 rounded-xl shadow-2xl max-w-full max-h-full object-contain cursor-pointer" />
    </div>
  );
}
