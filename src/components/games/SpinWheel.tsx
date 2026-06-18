"use client";
import { useEffect, useRef, useState } from "react";

export default function SpinWheel() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [spinning, setSpinning] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const angleRef = useRef(0);
  const velocityRef = useRef(0);

  const ITEMS = ["🎉 Win!", "💀 Lose", "🎁 Prize", "😴 Skip", "🔥 Double", "💸 Jackpot!", "🤡 Fool", "⭐ Lucky"];
  const COLORS = ["#ef4444","#3b82f6","#22c55e","#f59e0b","#8b5cf6","#ec4899","#06b6d4","#f97316"];
  const N = ITEMS.length;

  const spin = () => {
    if (spinning) return;
    setSpinning(true);
    setResult(null);
    velocityRef.current = 0.15 + Math.random() * 0.15;
  };

  useEffect(() => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;
    const CX = canvas.width / 2, CY = canvas.height / 2, R = Math.min(CX, CY) - 20;

    let frame: number;
    const tick = () => {
      if (velocityRef.current > 0) {
        angleRef.current += velocityRef.current;
        velocityRef.current *= 0.992;
        if (velocityRef.current < 0.001) {
          velocityRef.current = 0;
          setSpinning(false);
          // Calculate result
          const normalized = (((-angleRef.current) % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
          const segAngle = (Math.PI * 2) / N;
          const idx = Math.floor(normalized / segAngle) % N;
          setResult(ITEMS[idx]);
        }
      }

      ctx.fillStyle = "#0a0a1e";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Wheel segments
      const segAngle = (Math.PI * 2) / N;
      for (let i = 0; i < N; i++) {
        const start = i * segAngle + angleRef.current;
        const end = start + segAngle;
        ctx.fillStyle = COLORS[i];
        ctx.shadowColor = COLORS[i]; ctx.shadowBlur = 5;
        ctx.beginPath();
        ctx.moveTo(CX, CY);
        ctx.arc(CX, CY, R, start, end);
        ctx.closePath();
        ctx.fill();
        ctx.shadowBlur = 0;

        // Text
        ctx.save();
        ctx.translate(CX, CY);
        ctx.rotate(start + segAngle / 2);
        ctx.textAlign = "right";
        ctx.fillStyle = "white";
        ctx.font = "bold 14px sans-serif";
        ctx.fillText(ITEMS[i], R - 10, 5);
        ctx.restore();
      }

      // Border
      ctx.strokeStyle = "white";
      ctx.lineWidth = 4;
      ctx.beginPath(); ctx.arc(CX, CY, R, 0, Math.PI * 2); ctx.stroke();

      // Dividers
      for (let i = 0; i < N; i++) {
        ctx.strokeStyle = "rgba(255,255,255,0.4)";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(CX, CY);
        ctx.lineTo(CX + Math.cos(i * segAngle + angleRef.current) * R, CY + Math.sin(i * segAngle + angleRef.current) * R);
        ctx.stroke();
      }

      // Center
      ctx.fillStyle = "#1e1b4b";
      ctx.strokeStyle = "white"; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(CX, CY, 22, 0, Math.PI * 2); ctx.fill(); ctx.stroke();

      // Pointer
      ctx.fillStyle = "white";
      ctx.shadowColor = "white"; ctx.shadowBlur = 15;
      ctx.beginPath();
      ctx.moveTo(CX + R - 10, CY - 15);
      ctx.lineTo(CX + R + 20, CY);
      ctx.lineTo(CX + R - 10, CY + 15);
      ctx.closePath();
      ctx.fill();
      ctx.shadowBlur = 0;

      frame = requestAnimationFrame(tick);
    };
    tick();
    return () => cancelAnimationFrame(frame);
  }, []);

  return (
    <div className="w-full h-full flex flex-col items-center justify-center bg-[#0a0a1e] gap-6">
      <canvas ref={canvasRef} width={500} height={500} className="max-w-full max-h-[60vh] object-contain" />
      {result && !spinning && (
        <div className="text-3xl font-black text-white bg-indigo-600/30 border border-indigo-500/50 px-8 py-4 rounded-2xl animate-bounce">
          {result}
        </div>
      )}
      <button onClick={spin} disabled={spinning}
        className={`px-10 py-4 rounded-full font-black text-xl uppercase tracking-widest transition-all ${spinning ? "bg-zinc-700 text-zinc-400" : "bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-500/30 active:scale-95"}`}>
        {spinning ? "Spinning..." : "SPIN!"}
      </button>
    </div>
  );
}
