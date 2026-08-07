"use client";
import { useEffect, useRef } from "react";

export default function Pong() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;
    const W = canvas.width, H = canvas.height;
    const PH = 80, PW = 14;

    let p1y = H / 2, p2y = H / 2;
    let bx = W / 2, by = H / 2, vbx = 5, vby = 3;
    let s1 = 0, s2 = 0;
    const keys: Record<string, boolean> = {};

    const onKeyDown = (e: KeyboardEvent) => { keys[e.code] = true; };
    const onKeyUp = (e: KeyboardEvent) => { keys[e.code] = false; };
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);

    let frame: number;
    const tick = () => {
      // Player 1
      if (keys["KeyW"]) p1y -= 6;
      if (keys["KeyS"]) p1y += 6;
      // Player 2
      if (keys["ArrowUp"]) p2y -= 6;
      if (keys["ArrowDown"]) p2y += 6;

      p1y = Math.max(PH / 2, Math.min(H - PH / 2, p1y));
      p2y = Math.max(PH / 2, Math.min(H - PH / 2, p2y));

      bx += vbx; by += vby;
      if (by < 8 || by > H - 8) vby *= -1;

      // Paddle collisions
      if (bx < 30 + PW && by > p1y - PH / 2 && by < p1y + PH / 2) {
        vbx = Math.abs(vbx) * 1.05;
        vby += (by - p1y) / 15;
      }
      if (bx > W - 30 - PW && by > p2y - PH / 2 && by < p2y + PH / 2) {
        vbx = -Math.abs(vbx) * 1.05;
        vby += (by - p2y) / 15;
      }

      // Score
      if (bx < 0) { s2++; bx = W / 2; by = H / 2; vbx = 5; vby = 3; }
      if (bx > W) { s1++; bx = W / 2; by = H / 2; vbx = -5; vby = 3; }

      vbx = Math.max(-12, Math.min(12, vbx));
      vby = Math.max(-12, Math.min(12, vby));

      // Draw
      ctx.fillStyle = "#000";
      ctx.fillRect(0, 0, W, H);

      // Center line
      ctx.strokeStyle = "rgba(255,255,255,0.1)";
      ctx.setLineDash([10, 10]);
      ctx.beginPath(); ctx.moveTo(W / 2, 0); ctx.lineTo(W / 2, H); ctx.stroke();
      ctx.setLineDash([]);

      // Paddles
      ctx.fillStyle = "#818cf8";
      ctx.shadowColor = "#818cf8"; ctx.shadowBlur = 20;
      ctx.beginPath(); ctx.roundRect(20, p1y - PH / 2, PW, PH, 7); ctx.fill();
      ctx.beginPath(); ctx.roundRect(W - 20 - PW, p2y - PH / 2, PW, PH, 7); ctx.fill();
      ctx.shadowBlur = 0;

      // Ball
      ctx.fillStyle = "white";
      ctx.shadowColor = "white"; ctx.shadowBlur = 15;
      ctx.beginPath(); ctx.arc(bx, by, 10, 0, Math.PI * 2); ctx.fill();
      ctx.shadowBlur = 0;

      // Score
      ctx.fillStyle = "white";
      ctx.font = "bold 48px monospace";
      ctx.textAlign = "center";
      ctx.fillText(`${s1}`, W / 4, 60);
      ctx.fillText(`${s2}`, (3 * W) / 4, 60);

      ctx.fillStyle = "rgba(255,255,255,0.3)";
      ctx.font = "11px monospace";
      ctx.textAlign = "left";
      ctx.fillText("W/S — Player 1", 10, H - 10);
      ctx.textAlign = "right";
      ctx.fillText("↑↓ — Player 2", W - 10, H - 10);

      frame = requestAnimationFrame(tick);
    };
    tick();
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
    };
  }, []);

  return (
    <div className="w-full h-full flex flex-col items-center justify-center bg-black">
      <canvas ref={canvasRef} width={640} height={480} className="border border-white/10 rounded-xl shadow-2xl max-w-full max-h-full object-contain" />
      <p className="mt-4 text-zinc-400 text-sm font-mono uppercase tracking-widest">2 Player Local — W/S vs ↑↓</p>
    </div>
  );
}
