"use client";
import { useEffect, useRef, useState } from "react";

export default function AimTrainer() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(30);
  const [playing, setPlaying] = useState(false);

  const targetRef = useRef({ x: 400, y: 300, radius: 30, createdAt: 0 });

  const spawnTarget = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    targetRef.current = {
      x: 50 + Math.random() * (canvas.width - 100),
      y: 50 + Math.random() * (canvas.height - 100),
      radius: 20 + Math.random() * 20,
      createdAt: Date.now()
    };
  };

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!playing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const dx = x - targetRef.current.x;
    const dy = y - targetRef.current.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist <= targetRef.current.radius) {
      setScore(s => s + 1);
      spawnTarget();
    } else {
      setScore(s => Math.max(0, s - 1)); // penalty
    }
  };

  useEffect(() => {
    if (playing && timeLeft > 0) {
      const timer = setInterval(() => setTimeLeft(t => t - 1), 1000);
      return () => clearInterval(timer);
    } else if (timeLeft === 0) {
      setPlaying(false);
    }
  }, [playing, timeLeft]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationId: number;
    const render = () => {
      ctx.fillStyle = "#111";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      if (playing) {
        // Draw crosshair center
        ctx.fillStyle = "#333";
        ctx.fillRect(canvas.width/2 - 1, 0, 2, canvas.height);
        ctx.fillRect(0, canvas.height/2 - 1, canvas.width, 2);

        // Draw target
        const t = targetRef.current;
        const age = Date.now() - t.createdAt;
        const scale = Math.min(1, age / 150); // pop in animation

        ctx.beginPath();
        ctx.arc(t.x, t.y, t.radius * scale, 0, Math.PI * 2);
        ctx.fillStyle = "#3b82f6";
        ctx.fill();
        
        ctx.beginPath();
        ctx.arc(t.x, t.y, t.radius * scale * 0.6, 0, Math.PI * 2);
        ctx.fillStyle = "#60a5fa";
        ctx.fill();
        
        ctx.beginPath();
        ctx.arc(t.x, t.y, t.radius * scale * 0.2, 0, Math.PI * 2);
        ctx.fillStyle = "#eff6ff";
        ctx.fill();
      } else {
        ctx.fillStyle = "white";
        ctx.font = "30px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText(timeLeft === 0 ? `Game Over! Score: ${score}` : "Click Start to Play", canvas.width/2, canvas.height/2);
      }

      animationId = requestAnimationFrame(render);
    };
    render();

    return () => cancelAnimationFrame(animationId);
  }, [playing, score, timeLeft]);

  return (
    <div className="w-full h-full flex flex-col items-center justify-center bg-[#0a0a0a] gap-6">
      <div className="flex gap-12 text-white font-black text-2xl uppercase tracking-widest">
        <div>Score: <span className="text-blue-500">{score}</span></div>
        <div>Time: <span className={timeLeft <= 5 ? "text-rose-500" : "text-emerald-500"}>{timeLeft}s</span></div>
      </div>
      <canvas 
        ref={canvasRef} 
        width={800} 
        height={600} 
        onClick={handleCanvasClick}
        className="border border-white/10 rounded-2xl shadow-2xl cursor-crosshair bg-[#111] max-w-full object-contain"
      />
      {!playing && (
        <button 
          onClick={() => { setScore(0); setTimeLeft(30); setPlaying(true); spawnTarget(); }}
          className="bg-blue-600 hover:bg-blue-500 text-white px-8 py-3 rounded-full font-bold tracking-widest uppercase"
        >
          {timeLeft === 0 ? "Play Again" : "Start"}
        </button>
      )}
    </div>
  );
}
