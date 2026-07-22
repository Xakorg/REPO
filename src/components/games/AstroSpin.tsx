"use client";
import { useEffect, useRef, useState } from "react";

const COLORS = ["#06b6d4", "#ec4899", "#eab308", "#10b981"]; // Cyan, Magenta, Yellow, Green

export default function AstroSpin() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [score, setScore] = useState(0);
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
    const CX = W / 2;
    const CY = H / 2;
    const RING_RADIUS = 120;

    let rotationAngle = 0; // Angle of segment 0 in radians
    let localScore = 0;
    let lives = 3;
    let isDead = false;

    const comets: { x: number; y: number; angle: number; dist: number; speed: number; colorIndex: number }[] = [];
    const particles: { x: number; y: number; vx: number; vy: number; life: number; color: string }[] = [];

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === "ArrowLeft" || e.code === "KeyA") {
        rotationAngle -= Math.PI / 2;
      } else if (e.code === "ArrowRight" || e.code === "KeyD") {
        rotationAngle += Math.PI / 2;
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    let spawnTimer = 0;
    let animId: number;

    const spawnParticles = (x: number, y: number, color: string) => {
      for (let i = 0; i < 12; i++) {
        const a = Math.random() * Math.PI * 2;
        const spd = Math.random() * 3 + 1;
        particles.push({
          x, y,
          vx: Math.cos(a) * spd,
          vy: Math.sin(a) * spd,
          life: 25,
          color
        });
      }
    };

    const loop = () => {
      if (isDead) return;

      spawnTimer++;
      if (spawnTimer > Math.max(30, 90 - Math.floor(localScore / 200))) {
        spawnTimer = 0;
        const colorIdx = Math.floor(Math.random() * 4);
        // Spawn from 4 cardinal directions or random angles
        const cardinalAngles = [0, Math.PI / 2, Math.PI, (3 * Math.PI) / 2];
        const angle = cardinalAngles[Math.floor(Math.random() * 4)];
        const dist = 320;
        comets.push({
          x: CX + Math.cos(angle) * dist,
          y: CY + Math.sin(angle) * dist,
          angle,
          dist,
          speed: 2.2 + Math.random() * 1.5 + localScore / 1500,
          colorIndex: colorIdx
        });
      }

      // Update Particles
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.life -= 1;
        if (p.life <= 0) particles.splice(i, 1);
      }

      // Update Comets
      for (let i = comets.length - 1; i >= 0; i--) {
        const c = comets[i];
        c.dist -= c.speed;
        c.x = CX + Math.cos(c.angle) * c.dist;
        c.y = CY + Math.sin(c.angle) * c.dist;

        // Check ring collision
        if (c.dist <= RING_RADIUS + 8) {
          // Normalize angles to 0..2PI
          let normalizedCometAngle = (c.angle % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2);
          let currentRingAngle = (rotationAngle % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2);

          // Calculate which segment index (0..3) corresponds to normalizedCometAngle
          let relAngle = (normalizedCometAngle - currentRingAngle + Math.PI * 4) % (Math.PI * 2);
          let hitSegmentIndex = Math.floor((relAngle + Math.PI / 4) / (Math.PI / 2)) % 4;

          if (hitSegmentIndex === c.colorIndex) {
            // Correct match
            localScore += 100;
            setScore(localScore);
            spawnParticles(c.x, c.y, COLORS[c.colorIndex]);
          } else {
            // Wrong color mismatch!
            lives--;
            spawnParticles(c.x, c.y, "#ef4444");
            if (lives <= 0) {
              isDead = true;
              setGameOver(true);
              window.dispatchEvent(
                new CustomEvent("xakteir-game-score", { detail: { score: localScore } })
              );
              return;
            }
          }
          comets.splice(i, 1);
        }
      }

      // Draw Background
      ctx.fillStyle = "#090d16";
      ctx.fillRect(0, 0, W, H);

      // Orbital Grid Circles
      ctx.strokeStyle = "#ffffff0f";
      ctx.lineWidth = 1;
      for (let r = 50; r <= 300; r += 50) {
        ctx.beginPath();
        ctx.arc(CX, CY, r, 0, Math.PI * 2);
        ctx.stroke();
      }

      // Central Core
      const coreGrad = ctx.createRadialGradient(CX, CY, 5, CX, CY, 35);
      coreGrad.addColorStop(0, "#38bdf8");
      coreGrad.addColorStop(1, "#0369a1");
      ctx.fillStyle = coreGrad;
      ctx.shadowColor = "#38bdf8";
      ctx.shadowBlur = 20;
      ctx.beginPath();
      ctx.arc(CX, CY, 30, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      // Draw Rotating Ring Segments
      for (let i = 0; i < 4; i++) {
        const segStart = rotationAngle + (i - 0.5) * (Math.PI / 2);
        const segEnd = rotationAngle + (i + 0.5) * (Math.PI / 2);

        ctx.strokeStyle = COLORS[i];
        ctx.shadowColor = COLORS[i];
        ctx.shadowBlur = 12;
        ctx.lineWidth = 14;
        ctx.beginPath();
        ctx.arc(CX, CY, RING_RADIUS, segStart, segEnd);
        ctx.stroke();

        // Node dot
        const midAngle = rotationAngle + i * (Math.PI / 2);
        const nx = CX + Math.cos(midAngle) * RING_RADIUS;
        const ny = CY + Math.sin(midAngle) * RING_RADIUS;
        ctx.fillStyle = "#ffffff";
        ctx.beginPath();
        ctx.arc(nx, ny, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      }

      // Draw Comets
      for (const c of comets) {
        ctx.fillStyle = COLORS[c.colorIndex];
        ctx.shadowColor = COLORS[c.colorIndex];
        ctx.shadowBlur = 15;
        ctx.beginPath();
        ctx.arc(c.x, c.y, 12, 0, Math.PI * 2);
        ctx.fill();

        // Tail
        const tx = c.x + Math.cos(c.angle) * 20;
        const ty = c.y + Math.sin(c.angle) * 20;
        const tailGrad = ctx.createLinearGradient(c.x, c.y, tx, ty);
        tailGrad.addColorStop(0, COLORS[c.colorIndex]);
        tailGrad.addColorStop(1, "transparent");
        ctx.strokeStyle = tailGrad;
        ctx.lineWidth = 6;
        ctx.beginPath();
        ctx.moveTo(c.x, c.y);
        ctx.lineTo(tx, ty);
        ctx.stroke();
        ctx.shadowBlur = 0;
      }

      // Draw Particles
      for (const p of particles) {
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.life / 25;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1.0;

      // HUD
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 16px monospace";
      ctx.textAlign = "left";
      ctx.fillText(`SCORE: ${localScore}`, 20, 30);
      ctx.textAlign = "right";
      ctx.fillText(`SHIELD: ${"♥".repeat(lives)}`, W - 20, 30);

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [gameStarted, gameOver]);

  const rotateLeft = () => {
    window.dispatchEvent(new KeyboardEvent("keydown", { code: "ArrowLeft" }));
  };

  const rotateRight = () => {
    window.dispatchEvent(new KeyboardEvent("keydown", { code: "ArrowRight" }));
  };

  const startGame = () => {
    setScore(0);
    setGameOver(false);
    setGameStarted(true);
  };

  return (
    <div className="w-full h-full flex flex-col items-center justify-center bg-zinc-950 text-white p-4">
      <div className="relative border border-cyan-500/30 rounded-2xl overflow-hidden shadow-2xl shadow-cyan-500/10">
        <canvas ref={canvasRef} width={640} height={480} className="bg-black block max-w-full h-auto" />
        
        {/* On-screen Rotation Controls */}
        {gameStarted && !gameOver && (
          <div className="absolute bottom-4 left-0 right-0 flex justify-between px-8 pointer-events-none">
            <button
              onClick={rotateLeft}
              className="pointer-events-auto px-5 py-2.5 bg-cyan-600/60 hover:bg-cyan-500 text-white font-mono font-bold rounded-xl border border-cyan-400/40 backdrop-blur-md transition active:scale-95"
            >
              ↺ ROTATE CCW (←)
            </button>
            <button
              onClick={rotateRight}
              className="pointer-events-auto px-5 py-2.5 bg-cyan-600/60 hover:bg-cyan-500 text-white font-mono font-bold rounded-xl border border-cyan-400/40 backdrop-blur-md transition active:scale-95"
            >
              ROTATE CW (→) ↻
            </button>
          </div>
        )}

        {(!gameStarted || gameOver) && (
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center">
            <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-teal-400 to-emerald-400 mb-2">
              ASTRO SPIN
            </h1>
            <p className="text-zinc-400 mb-6 max-w-md text-sm">
              Rotate the orbital ring to match color nodes with incoming celestial comets!
            </p>
            {gameOver && (
              <div className="mb-6 bg-zinc-900/80 border border-zinc-800 rounded-xl p-4 min-w-[200px]">
                <p className="text-zinc-400 text-xs uppercase tracking-wider">Final Score</p>
                <p className="text-3xl font-mono font-bold text-cyan-400">{score}</p>
              </div>
            )}
            <button
              onClick={startGame}
              className="px-8 py-3 bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-400 hover:to-teal-400 text-black font-bold rounded-xl transition transform active:scale-95 shadow-lg shadow-cyan-500/20"
            >
              {gameOver ? "PLAY AGAIN" : "START SPINNING"}
            </button>
            <p className="mt-4 text-xs text-zinc-500 font-mono">
              [Left / Right Arrow] or On-screen Buttons to Rotate Ring
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
