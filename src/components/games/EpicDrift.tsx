"use client";
import { useEffect, useRef, useState } from "react";

export default function EpicDrift() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(60);
  const [gameOver, setGameOver] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);

  useEffect(() => {
    if (!gameStarted || gameOver) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const W = canvas.width;
    const H = canvas.height;

    let x = W / 2;
    let y = H - 80;
    let angle = -Math.PI / 2;
    let speed = 0;
    let driftPoints = 0;
    let multiplier = 1;

    const keys: Record<string, boolean> = {};

    const handleKeyDown = (e: KeyboardEvent) => { keys[e.code] = true; };
    const handleKeyUp = (e: KeyboardEvent) => { keys[e.code] = false; };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    // Track definition (Outer & Inner boundaries)
    const trackCenter = { x: W / 2, y: H / 2, rx: 240, ry: 160 };

    const particles: { x: number; y: number; alpha: number; radius: number }[] = [];

    let animId: number;

    const loop = () => {
      // Inputs
      if (keys["ArrowUp"] || keys["KeyW"]) speed = Math.min(6.5, speed + 0.15);
      else speed = Math.max(0, speed - 0.05);

      if (keys["ArrowDown"] || keys["KeyS"]) speed = Math.max(0, speed - 0.2);

      let turning = false;
      const turnSpeed = 0.06;
      if (keys["ArrowLeft"] || keys["KeyA"]) {
        angle -= turnSpeed;
        turning = true;
      }
      if (keys["ArrowRight"] || keys["KeyD"]) {
        angle += turnSpeed;
        turning = true;
      }

      // Check off-road vs drift
      const dx = (x - trackCenter.x) / trackCenter.rx;
      const dy = (y - trackCenter.y) / trackCenter.ry;
      const distRatio = Math.sqrt(dx * dx + dy * dy);

      const isOnTrack = distRatio >= 0.55 && distRatio <= 1.1;

      if (speed > 3 && turning && isOnTrack) {
        multiplier = Math.min(5, multiplier + 0.01);
        driftPoints += Math.round(speed * 3 * multiplier);
        setScore(driftPoints);

        // Drift smoke particles
        particles.push({
          x: x - Math.cos(angle) * 15,
          y: y - Math.sin(angle) * 15,
          alpha: 0.8,
          radius: Math.random() * 6 + 4
        });
      } else if (!isOnTrack) {
        speed = Math.max(1, speed * 0.94); // Slow down off-road
        multiplier = 1;
      }

      // Movement
      x += Math.cos(angle) * speed;
      y += Math.sin(angle) * speed;

      // Keep within canvas bounds
      x = Math.max(30, Math.min(W - 30, x));
      y = Math.max(30, Math.min(H - 30, y));

      // Update Particles
      for (let i = particles.length - 1; i >= 0; i--) {
        particles[i].alpha -= 0.03;
        particles[i].radius += 0.3;
        if (particles[i].alpha <= 0) particles.splice(i, 1);
      }

      // DRAWING
      ctx.fillStyle = "#15803d"; // Grass background
      ctx.fillRect(0, 0, W, H);

      // Draw Outer Track (Asphalt)
      ctx.fillStyle = "#334155";
      ctx.beginPath();
      ctx.ellipse(trackCenter.x, trackCenter.y, trackCenter.rx + 50, trackCenter.ry + 50, 0, 0, Math.PI * 2);
      ctx.fill();

      // Draw Inner Track (Grass Hole)
      ctx.fillStyle = "#15803d";
      ctx.beginPath();
      ctx.ellipse(trackCenter.x, trackCenter.y, trackCenter.rx - 50, trackCenter.ry - 50, 0, 0, Math.PI * 2);
      ctx.fill();

      // Track Center Line (Dashed)
      ctx.strokeStyle = "#facc15";
      ctx.lineWidth = 3;
      ctx.setLineDash([12, 12]);
      ctx.beginPath();
      ctx.ellipse(trackCenter.x, trackCenter.y, trackCenter.rx, trackCenter.ry, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);

      // Finish Line
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 8;
      ctx.beginPath();
      ctx.moveTo(W / 2, H - 130);
      ctx.lineTo(W / 2, H - 30);
      ctx.stroke();

      // Draw Smoke Particles
      for (const p of particles) {
        ctx.fillStyle = `rgba(226, 232, 240, ${p.alpha})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fill();
      }

      // Draw Car
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(angle);

      // Car Body
      ctx.fillStyle = "#ef4444";
      ctx.shadowColor = "#dc2626";
      ctx.shadowBlur = speed > 4 ? 12 : 4;
      ctx.fillRect(-16, -10, 32, 20);

      // Roof / Windshield
      ctx.fillStyle = "#1e293b";
      ctx.fillRect(-6, -8, 14, 16);

      // Headlights
      ctx.fillStyle = "#fef08a";
      ctx.fillRect(14, -8, 3, 4);
      ctx.fillRect(14, 4, 3, 4);

      ctx.restore();

      // HUD
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 16px monospace";
      ctx.textAlign = "left";
      ctx.fillText(`DRIFT SCORE: ${driftPoints}`, 20, 35);
      ctx.fillText(`MULTIPLIER: x${multiplier.toFixed(1)}`, 20, 60);

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);

    // Timer Interval
    const timerId = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timerId);
          setGameOver(true);
          window.dispatchEvent(
            new CustomEvent("xakteir-game-score", { detail: { score: driftPoints } })
          );
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      cancelAnimationFrame(animId);
      clearInterval(timerId);
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [gameStarted, gameOver]);

  const startGame = () => {
    setScore(0);
    setTimeLeft(60);
    setGameOver(false);
    setGameStarted(true);
  };

  return (
    <div className="w-full h-full flex flex-col items-center justify-center bg-zinc-950 text-white p-4">
      <div className="relative border border-red-500/30 rounded-2xl overflow-hidden shadow-2xl shadow-red-500/10">
        <canvas ref={canvasRef} width={640} height={480} className="bg-black block max-w-full h-auto" />

        {/* HUD Overlay for Time */}
        {gameStarted && !gameOver && (
          <div className="absolute top-4 right-6 bg-black/60 backdrop-blur-md px-4 py-2 rounded-xl border border-red-500/30 font-mono text-right">
            <span className="text-xs text-zinc-400 block uppercase">Time Left</span>
            <span className="text-2xl font-bold text-red-400">{timeLeft}s</span>
          </div>
        )}

        {(!gameStarted || gameOver) && (
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center">
            <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-red-500 via-orange-500 to-amber-500 mb-2">
              EPIC DRIFT
            </h1>
            <p className="text-zinc-400 mb-6 max-w-md text-sm">
              Accelerate through sharp turns to drift around the neon circuit before time runs out!
            </p>
            {gameOver && (
              <div className="mb-6 bg-zinc-900/80 border border-zinc-800 rounded-xl p-4 min-w-[200px]">
                <p className="text-zinc-400 text-xs uppercase tracking-wider">Final Drift Score</p>
                <p className="text-3xl font-mono font-bold text-red-400">{score}</p>
              </div>
            )}
            <button
              onClick={startGame}
              className="px-8 py-3 bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-500 hover:to-orange-500 text-white font-bold rounded-xl transition transform active:scale-95 shadow-lg shadow-red-500/20"
            >
              {gameOver ? "PLAY AGAIN" : "START DRIFTING"}
            </button>
            <p className="mt-4 text-xs text-zinc-500 font-mono">
              [Up Arrow / W] Accelerate • [Left / Right] Steer & Drift
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
