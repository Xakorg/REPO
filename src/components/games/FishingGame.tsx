"use client";
import { useEffect, useRef } from "react";

export default function FishingGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;
    const W = canvas.width, H = canvas.height;
    const WATER_Y = 180;

    let lineY = WATER_Y + 50;
    let lineDir = 1;
    let score = 0;
    let caught: { x: number; y: number; label: string; alpha: number }[] = [];
    let fish: { x: number; y: number; vx: number; label: string; color: string }[] = [];
    let autoDir = 1;
    let hooking = false;

    // Spawn fish
    for (let i = 0; i < 8; i++) {
      fish.push({
        x: Math.random() * (W - 100) + 50,
        y: WATER_Y + 50 + Math.random() * (H - WATER_Y - 100),
        vx: (Math.random() - 0.5) * 2,
        label: ["🐟 Bass +10", "🐡 Blowfish +5", "🦈 Shark +50", "🐠 Clown +15"][Math.floor(Math.random() * 4)],
        color: `hsl(${Math.random() * 360}, 80%, 60%)`,
      });
    }

    window.addEventListener("keydown", e => {
      if ((e.code === "Space" || e.code === "ArrowDown") && !hooking) hooking = true;
    });

    let frame: number;
    const tick = () => {
      // Move hook
      if (hooking) {
        lineY += 4;
        if (lineY > H - 20) { lineY = WATER_Y + 50; hooking = false; }
      } else {
        lineY = WATER_Y + 50 + Math.sin(Date.now() / 800) * 30;
      }

      // Move fish
      for (const f of fish) {
        f.x += f.vx;
        if (f.x < 20 || f.x > W - 20) f.vx *= -1;

        // Catch check
        if (hooking && Math.abs(f.x - W / 2) < 25 && Math.abs(f.y - lineY) < 20) {
          const pts = parseInt(f.label.match(/\d+/)?.[0] || "10");
          score += pts;
          caught.push({ x: W / 2, y: lineY, label: f.label, alpha: 1 });
          f.x = Math.random() * (W - 100) + 50;
          f.y = WATER_Y + 50 + Math.random() * (H - WATER_Y - 100);
          lineY = WATER_Y + 50;
          hooking = false;
        }
      }

      // Fade out caught labels
      caught = caught.filter(c => c.alpha > 0);
      caught.forEach(c => { c.y -= 1; c.alpha -= 0.02; });

      // Background
      const sky = ctx.createLinearGradient(0, 0, 0, WATER_Y);
      sky.addColorStop(0, "#0369a1"); sky.addColorStop(1, "#7dd3fc");
      ctx.fillStyle = sky;
      ctx.fillRect(0, 0, W, WATER_Y);

      // Land
      ctx.fillStyle = "#15803d";
      ctx.fillRect(0, WATER_Y - 20, W, 20);

      // Water
      const water = ctx.createLinearGradient(0, WATER_Y, 0, H);
      water.addColorStop(0, "#0c4a6e"); water.addColorStop(1, "#082f49");
      ctx.fillStyle = water;
      ctx.fillRect(0, WATER_Y, W, H - WATER_Y);

      // Water shimmer
      ctx.strokeStyle = "rgba(255,255,255,0.1)";
      for (let i = 0; i < 5; i++) {
        ctx.beginPath();
        ctx.moveTo(0, WATER_Y + 20 + i * 30 + Math.sin(Date.now() / 1000 + i) * 5);
        ctx.lineTo(W, WATER_Y + 20 + i * 30 + Math.cos(Date.now() / 1000 + i) * 5);
        ctx.stroke();
      }

      // Fish
      for (const f of fish) {
        ctx.fillStyle = f.color;
        ctx.font = "24px serif";
        ctx.textAlign = "center";
        ctx.fillText("🐟", f.x, f.y);
      }

      // Rod
      ctx.strokeStyle = "#92400e";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(W / 2 - 10, 20);
      ctx.lineTo(W / 2 + 30, 80);
      ctx.stroke();

      // Line
      ctx.strokeStyle = "#e5e7eb";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(W / 2 + 30, 80);
      ctx.lineTo(W / 2, lineY);
      ctx.stroke();

      // Hook
      ctx.fillStyle = "#9ca3af";
      ctx.beginPath();
      ctx.arc(W / 2, lineY, 6, 0, Math.PI * 2);
      ctx.fill();

      // Caught labels
      for (const c of caught) {
        ctx.globalAlpha = c.alpha;
        ctx.fillStyle = "#fbbf24";
        ctx.font = "bold 14px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText(c.label, c.x, c.y);
      }
      ctx.globalAlpha = 1;

      // HUD
      ctx.fillStyle = "white";
      ctx.font = "bold 16px monospace";
      ctx.textAlign = "left";
      ctx.fillText(`Score: ${score}`, 10, 25);
      ctx.fillStyle = "rgba(255,255,255,0.5)";
      ctx.font = "12px monospace";
      ctx.fillText("Space / Down Arrow to cast line", 10, H - 10);

      frame = requestAnimationFrame(tick);
    };
    tick();
    return () => cancelAnimationFrame(frame);
  }, []);

  return (
    <div className="w-full h-full flex flex-col items-center justify-center bg-[#082f49]">
      <canvas ref={canvasRef} width={640} height={480} className="border-2 border-blue-500/30 rounded-xl shadow-2xl max-w-full max-h-full object-contain" />
    </div>
  );
}
