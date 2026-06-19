"use client";
import { useEffect, useRef, useState } from "react";

export default function Basketball() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [score, setScore] = useState(0);
  const [shots, setShots] = useState(0);
  const stateRef = useRef({ bx: 320, by: 420, vx: 0, vy: 0, launched: false, scored: false, power: 0, powerDir: 1 });

  useEffect(() => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;
    const s = stateRef.current;
    const HOOP_X = 320, HOOP_Y = 150, HOOP_R = 30;
    const GRAVITY = 0.4;

    const resetBall = () => {
      s.bx = 100 + Math.random() * 440;
      s.by = 420;
      s.vx = 0; s.vy = 0;
      s.launched = false;
      s.scored = false;
      s.power = 0;
    };

    const handleClick = () => {
      if (!s.launched) {
        const angle = -Math.PI / 2 + (s.bx > HOOP_X ? -0.3 : 0.3);
        const spd = 12 + s.power / 10;
        s.vx = Math.cos(angle) * spd + (HOOP_X - s.bx) / 50;
        s.vy = Math.sin(angle) * spd;
        s.launched = true;
        setShots(prev => prev + 1);
      }
    };
    canvas.addEventListener("click", handleClick);

    let frame: number;
    const tick = () => {
      if (!s.launched) {
        s.power += s.powerDir * 1;
        if (s.power > 100 || s.power < 0) s.powerDir *= -1;
      } else {
        s.vx *= 0.99;
        s.vy += GRAVITY;
        s.bx += s.vx;
        s.by += s.vy;

        const dx = s.bx - HOOP_X, dy = s.by - HOOP_Y;
        if (!s.scored && Math.sqrt(dx * dx + dy * dy) < HOOP_R + 12 && s.vy > 0) {
          s.scored = true;
          setScore(prev => prev + 2);
        }

        if (s.by > canvas.height || s.bx < 0 || s.bx > canvas.width) resetBall();
      }

      // Sky
      const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
      grad.addColorStop(0, "#1e3a5f");
      grad.addColorStop(1, "#0f172a");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Court line
      ctx.strokeStyle = "#e2e8f0";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, 450);
      ctx.lineTo(canvas.width, 450);
      ctx.stroke();

      // Backboard
      ctx.fillStyle = "#f8fafc";
      ctx.fillRect(HOOP_X - 40, HOOP_Y - 40, 80, 50);
      ctx.strokeStyle = "#dc2626";
      ctx.strokeRect(HOOP_X - 25, HOOP_Y - 25, 50, 35);

      // Pole
      ctx.fillStyle = "#64748b";
      ctx.fillRect(HOOP_X + 38, HOOP_Y - 40, 8, 200);

      // Hoop
      ctx.strokeStyle = "#dc2626";
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(HOOP_X, HOOP_Y, HOOP_R, 0, Math.PI * 2);
      ctx.stroke();

      // Ball
      const bgrad = ctx.createRadialGradient(s.bx - 8, s.by - 8, 2, s.bx, s.by, 20);
      bgrad.addColorStop(0, "#fb923c");
      bgrad.addColorStop(1, "#c2410c");
      ctx.fillStyle = bgrad;
      ctx.beginPath();
      ctx.arc(s.bx, s.by, 20, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "#451a03";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(s.bx - 18, s.by);
      ctx.lineTo(s.bx + 18, s.by);
      ctx.moveTo(s.bx, s.by - 18);
      ctx.lineTo(s.bx, s.by + 18);
      ctx.stroke();

      // Power bar
      if (!s.launched) {
        ctx.fillStyle = "#1e293b";
        ctx.fillRect(canvas.width / 2 - 60, canvas.height - 30, 120, 16);
        ctx.fillStyle = `hsl(${120 - s.power * 1.2}, 80%, 55%)`;
        ctx.fillRect(canvas.width / 2 - 60, canvas.height - 30, s.power * 1.2, 16);
        ctx.fillStyle = "white";
        ctx.font = "11px monospace";
        ctx.textAlign = "center";
        ctx.fillText("CLICK TO SHOOT", canvas.width / 2, canvas.height - 36);
      }

      // HUD
      ctx.fillStyle = "white";
      ctx.font = "bold 18px monospace";
      ctx.textAlign = "left";
      ctx.fillText(`Score: ${score}  Shots: ${shots}`, 20, 30);

      frame = requestAnimationFrame(tick);
    };
    tick();
    return () => { canvas.removeEventListener("click", handleClick); cancelAnimationFrame(frame); };
  }, []);

  return (
    <div className="w-full h-full flex flex-col items-center justify-center bg-[#0f172a]">
      <canvas ref={canvasRef} width={640} height={480} className="border-2 border-orange-500/50 rounded-xl shadow-2xl max-w-full max-h-full object-contain cursor-pointer" />
    </div>
  );
}
