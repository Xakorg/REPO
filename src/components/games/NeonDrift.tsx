"use client";
import { useEffect, useRef } from "react";

export default function NeonDrift() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let x = canvas.width / 2;
    let y = canvas.height - 100;
    let speed = 0;
    let angle = -Math.PI / 2;
    const keys: Record<string, boolean> = {};

    const handleKeyDown = (e: KeyboardEvent) => { keys[e.key] = true; };
    const handleKeyUp = (e: KeyboardEvent) => { keys[e.key] = false; };
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    let trackOffset = 0;

    let animationId: number;
    const render = () => {
      if (keys["ArrowUp"]) speed = Math.min(speed + 0.2, 10);
      else if (keys["ArrowDown"]) speed = Math.max(speed - 0.2, -5);
      else speed *= 0.95;

      if (keys["ArrowLeft"]) angle -= 0.05 * (speed / 10);
      if (keys["ArrowRight"]) angle += 0.05 * (speed / 10);

      x += Math.cos(angle) * speed;
      y += Math.sin(angle) * speed;

      // Keep in bounds
      x = Math.max(0, Math.min(canvas.width, x));
      y = Math.max(0, Math.min(canvas.height, y));

      trackOffset += speed;

      // Clear
      ctx.fillStyle = "#050510";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw Grid
      ctx.strokeStyle = "#00ffcc22";
      ctx.lineWidth = 2;
      ctx.beginPath();
      for (let i = 0; i < canvas.width; i += 50) {
        ctx.moveTo(i, 0); ctx.lineTo(i, canvas.height);
      }
      for (let i = (trackOffset % 50) - 50; i < canvas.height; i += 50) {
        ctx.moveTo(0, i); ctx.lineTo(canvas.width, i);
      }
      ctx.stroke();

      // Draw Car
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(angle);
      
      // Trail
      if (speed > 5) {
        ctx.fillStyle = "#ff00ff88";
        ctx.fillRect(-30, -5, 20, 10);
      }

      ctx.fillStyle = "#00ffcc";
      ctx.shadowColor = "#00ffcc";
      ctx.shadowBlur = 20;
      ctx.fillRect(-15, -10, 30, 20);
      ctx.fillStyle = "white";
      ctx.fillRect(5, -8, 5, 16); // windshield
      
      ctx.restore();

      animationId = requestAnimationFrame(render);
    };
    render();

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
      cancelAnimationFrame(animationId);
    };
  }, []);

  return (
    <div className="w-full h-full flex flex-col items-center justify-center bg-[#050510] relative">
      <canvas 
        ref={canvasRef} 
        width={800} 
        height={600} 
        className="border-4 border-fuchsia-500/30 rounded-xl shadow-[0_0_50px_rgba(255,0,255,0.2)] max-w-full max-h-full object-contain"
      />
      <div className="absolute bottom-10 text-fuchsia-400 font-mono text-sm uppercase tracking-widest bg-black/80 px-4 py-2 rounded-full border border-fuchsia-500/50">
        Use Arrow Keys to Drive & Drift
      </div>
    </div>
  );
}
