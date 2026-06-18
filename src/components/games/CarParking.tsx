"use client";
import { useEffect, useRef } from "react";

export default function CarParking() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;
    const W = canvas.width, H = canvas.height;

    let px = W / 2 - 20, py = H - 120;
    let pAngle = -Math.PI / 2;
    let speed = 0;
    let parked = false;
    const keys: Record<string, boolean> = {};
    const SPOT = { x: W / 2 - 30, y: 80, w: 60, h: 100 };

    window.addEventListener("keydown", e => { keys[e.code] = true; });
    window.addEventListener("keyup", e => { keys[e.code] = false; });

    let frame: number;
    const tick = () => {
      if (!parked) {
        if (keys["ArrowUp"]) speed = Math.min(speed + 0.1, 4);
        if (keys["ArrowDown"]) speed = Math.max(speed - 0.1, -2);
        else speed *= 0.96;

        if (keys["ArrowLeft"]) pAngle -= 0.03 * (speed > 0 ? 1 : -1);
        if (keys["ArrowRight"]) pAngle += 0.03 * (speed > 0 ? 1 : -1);

        px += Math.cos(pAngle) * speed;
        py += Math.sin(pAngle) * speed;
        px = Math.max(20, Math.min(W - 20, px));
        py = Math.max(20, Math.min(H - 20, py));

        // Check parked
        if (px > SPOT.x && px < SPOT.x + SPOT.w && py > SPOT.y && py < SPOT.y + SPOT.h) {
          const angleDiff = Math.abs(((pAngle + Math.PI / 2) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2));
          if (angleDiff < 0.3 || angleDiff > Math.PI * 2 - 0.3) parked = true;
        }
      }

      ctx.fillStyle = "#374151";
      ctx.fillRect(0, 0, W, H);

      // Road markings
      ctx.strokeStyle = "#6b7280";
      for (let y = 0; y < H; y += 80) {
        ctx.beginPath(); ctx.setLineDash([20, 15]); ctx.moveTo(W / 2, y); ctx.lineTo(W / 2, y + 80); ctx.stroke();
      }
      ctx.setLineDash([]);

      // Parking spot
      ctx.strokeStyle = parked ? "#22c55e" : "#ffffff";
      ctx.lineWidth = 3;
      ctx.strokeRect(SPOT.x, SPOT.y, SPOT.w, SPOT.h);
      ctx.fillStyle = parked ? "rgba(34,197,94,0.2)" : "rgba(255,255,255,0.05)";
      ctx.fillRect(SPOT.x, SPOT.y, SPOT.w, SPOT.h);
      ctx.fillStyle = parked ? "#22c55e" : "white";
      ctx.font = "bold 14px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("P", SPOT.x + SPOT.w / 2, SPOT.y + SPOT.h / 2 + 6);

      // Car
      ctx.save();
      ctx.translate(px, py);
      ctx.rotate(pAngle);
      ctx.fillStyle = "#3b82f6";
      ctx.shadowColor = "#3b82f6"; ctx.shadowBlur = 10;
      ctx.fillRect(-20, -12, 40, 24);
      ctx.fillStyle = "#1d4ed8";
      ctx.fillRect(-15, -10, 30, 10);
      ctx.fillStyle = "#93c5fd";
      ctx.fillRect(-13, -9, 12, 7);
      ctx.fillRect(3, -9, 12, 7);
      ctx.fillStyle = "#facc15";
      ctx.beginPath(); ctx.arc(20, -8, 5, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(20, 8, 5, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = "#ef4444";
      ctx.beginPath(); ctx.arc(-20, -8, 4, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(-20, 8, 4, 0, Math.PI * 2); ctx.fill();
      ctx.shadowBlur = 0;
      ctx.restore();

      if (parked) {
        ctx.fillStyle = "rgba(0,0,0,0.7)";
        ctx.fillRect(0, H / 2 - 60, W, 120);
        ctx.fillStyle = "#22c55e";
        ctx.font = "bold 42px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText("✅ Perfect Park!", W / 2, H / 2 + 15);
      }

      ctx.fillStyle = "rgba(255,255,255,0.6)";
      ctx.font = "12px monospace";
      ctx.textAlign = "left";
      ctx.fillText("↑↓ throttle · ←→ steer", 10, H - 10);

      frame = requestAnimationFrame(tick);
    };
    tick();
    return () => cancelAnimationFrame(frame);
  }, []);

  return (
    <div className="w-full h-full flex flex-col items-center justify-center bg-[#374151]">
      <canvas ref={canvasRef} width={640} height={480} className="border-2 border-gray-500/50 rounded-xl shadow-2xl max-w-full max-h-full object-contain" />
      <p className="mt-4 text-gray-400 text-sm font-mono uppercase tracking-widest">Park the car in the white spot!</p>
    </div>
  );
}
