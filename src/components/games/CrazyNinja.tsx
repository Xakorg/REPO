"use client";
import { useEffect, useRef, useState } from "react";

export default function CrazyNinja() {
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
    const LEFT_WALL_X = 60;
    const RIGHT_WALL_X = W - 60;

    let side: "left" | "right" | "jumping" = "left";
    let px = LEFT_WALL_X;
    let py = H - 120;
    let jumpTargetX = RIGHT_WALL_X;
    let jumpProgress = 0; // 0 to 1

    let localScore = 0;
    let lives = 3;
    let isDead = false;

    const obstacles: { y: number; side: "left" | "right"; type: "spike" | "shuriken"; x?: number }[] = [];
    const targets: { y: number; x: number; radius: number; sliced: boolean }[] = [];
    const particles: { x: number; y: number; vx: number; vy: number; life: number; color: string }[] = [];

    const handleJump = () => {
      if (isDead) return;
      if (side === "left") {
        side = "jumping";
        jumpTargetX = RIGHT_WALL_X;
        jumpProgress = 0;
      } else if (side === "right") {
        side = "jumping";
        jumpTargetX = LEFT_WALL_X;
        jumpProgress = 0;
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === "Space" || e.code === "ArrowUp") {
        e.preventDefault();
        handleJump();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    let spawnTimer = 0;
    let animId: number;

    const loop = () => {
      if (isDead) return;

      // Jump Animation
      if (side === "jumping") {
        jumpProgress += 0.08;
        const startX = jumpTargetX === RIGHT_WALL_X ? LEFT_WALL_X : RIGHT_WALL_X;
        px = startX + (jumpTargetX - startX) * jumpProgress;

        if (jumpProgress >= 1) {
          jumpProgress = 1;
          px = jumpTargetX;
          side = jumpTargetX === RIGHT_WALL_X ? "right" : "left";
        }
      }

      // Spawning Obstacles & Targets
      spawnTimer++;
      if (spawnTimer > Math.max(30, 70 - Math.floor(localScore / 300))) {
        spawnTimer = 0;
        if (Math.random() < 0.6) {
          obstacles.push({
            y: -30,
            side: Math.random() < 0.5 ? "left" : "right",
            type: "spike"
          });
        } else {
          targets.push({
            y: -30,
            x: W / 2 + (Math.random() - 0.5) * 160,
            radius: 16,
            sliced: false
          });
        }
      }

      // Move World / Obstacles Downward
      const scrollSpeed = 3.5 + localScore / 1500;
      for (let i = obstacles.length - 1; i >= 0; i--) {
        const obs = obstacles[i];
        obs.y += scrollSpeed;

        const obsX = obs.side === "left" ? LEFT_WALL_X + 15 : RIGHT_WALL_X - 15;
        if (Math.hypot(px - obsX, py - obs.y) < 22) {
          obstacles.splice(i, 1);
          lives--;
          for (let p = 0; p < 10; p++) {
            particles.push({
              x: px, y: py,
              vx: (Math.random() - 0.5) * 6,
              vy: (Math.random() - 0.5) * 6,
              life: 20,
              color: "#ef4444"
            });
          }
          if (lives <= 0) {
            isDead = true;
            setGameOver(true);
            window.dispatchEvent(
              new CustomEvent("xakteir-game-score", { detail: { score: localScore } })
            );
            return;
          }
        } else if (obs.y > H + 40) {
          obstacles.splice(i, 1);
        }
      }

      // Update Targets
      for (let i = targets.length - 1; i >= 0; i--) {
        const t = targets[i];
        t.y += scrollSpeed;

        if (side === "jumping" && !t.sliced && Math.hypot(px - t.x, py - t.y) < 35) {
          t.sliced = true;
          localScore += 150;
          setScore(localScore);
          for (let p = 0; p < 12; p++) {
            particles.push({
              x: t.x, y: t.y,
              vx: (Math.random() - 0.5) * 7,
              vy: (Math.random() - 0.5) * 7,
              life: 20,
              color: "#facc15"
            });
          }
        } else if (t.y > H + 40) {
          targets.splice(i, 1);
        }
      }

      // Update Particles
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.life -= 1;
        if (p.life <= 0) particles.splice(i, 1);
      }

      // DRAWING
      ctx.fillStyle = "#09090b";
      ctx.fillRect(0, 0, W, H);

      // Bamboo Walls
      ctx.fillStyle = "#15803d";
      ctx.fillRect(0, 0, LEFT_WALL_X, H);
      ctx.fillRect(RIGHT_WALL_X, 0, W - RIGHT_WALL_X, H);

      ctx.strokeStyle = "#166534";
      ctx.lineWidth = 4;
      for (let y = 0; y < H; y += 40) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(LEFT_WALL_X, y);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(RIGHT_WALL_X, y);
        ctx.lineTo(W, y);
        ctx.stroke();
      }

      // Draw Obstacles
      for (const obs of obstacles) {
        ctx.fillStyle = "#ef4444";
        ctx.shadowColor = "#ef4444";
        ctx.shadowBlur = 10;
        const ox = obs.side === "left" ? LEFT_WALL_X : RIGHT_WALL_X;
        ctx.beginPath();
        if (obs.side === "left") {
          ctx.moveTo(ox, obs.y - 12);
          ctx.lineTo(ox + 25, obs.y);
          ctx.lineTo(ox, obs.y + 12);
        } else {
          ctx.moveTo(ox, obs.y - 12);
          ctx.lineTo(ox - 25, obs.y);
          ctx.lineTo(ox, obs.y + 12);
        }
        ctx.closePath();
        ctx.fill();
        ctx.shadowBlur = 0;
      }

      // Draw Targets (Floating Golden Scrolls)
      for (const t of targets) {
        if (!t.sliced) {
          ctx.fillStyle = "#facc15";
          ctx.shadowColor = "#eab308";
          ctx.shadowBlur = 12;
          ctx.beginPath();
          ctx.arc(t.x, t.y, t.radius, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = "#000000";
          ctx.font = "bold 10px monospace";
          ctx.textAlign = "center";
          ctx.fillText("忍", t.x, t.y + 3);
          ctx.shadowBlur = 0;
        }
      }

      // Draw Ninja Character
      ctx.fillStyle = "#38bdf8";
      ctx.shadowColor = "#38bdf8";
      ctx.shadowBlur = 12;
      ctx.beginPath();
      ctx.arc(px, py, 14, 0, Math.PI * 2);
      ctx.fill();

      // Ninja Headband Tail
      ctx.strokeStyle = "#ef4444";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(px, py - 4);
      ctx.lineTo(px + (side === "left" ? -18 : 18), py - 8);
      ctx.stroke();
      ctx.shadowBlur = 0;

      // Draw Particles
      for (const p of particles) {
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.life / 20;
        ctx.fillRect(p.x - 2, p.y - 2, 4, 4);
      }
      ctx.globalAlpha = 1.0;

      // HUD
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 16px monospace";
      ctx.textAlign = "left";
      ctx.fillText(`SCORE: ${localScore}`, 80, 30);
      ctx.textAlign = "right";
      ctx.fillText(`LIVES: ${"♥".repeat(lives)}`, W - 80, 30);

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [gameStarted, gameOver]);

  const startGame = () => {
    setScore(0);
    setGameOver(false);
    setGameStarted(true);
  };

  return (
    <div className="w-full h-full flex flex-col items-center justify-center bg-zinc-950 text-white p-4">
      <div className="relative border border-emerald-500/30 rounded-2xl overflow-hidden shadow-2xl shadow-emerald-500/10">
        <canvas
          ref={canvasRef}
          width={640}
          height={480}
          className="bg-black block max-w-full h-auto cursor-pointer"
          onClick={() => {
            if (gameStarted && !gameOver) {
              window.dispatchEvent(new KeyboardEvent("keydown", { code: "Space" }));
            }
          }}
        />

        {(!gameStarted || gameOver) && (
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center">
            <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 mb-2">
              CRAZY NINJA
            </h1>
            <p className="text-zinc-400 mb-6 max-w-md text-sm">
              Wall-jump between bamboo pillars, slice golden scrolls, and dodge wall spikes!
            </p>
            {gameOver && (
              <div className="mb-6 bg-zinc-900/80 border border-zinc-800 rounded-xl p-4 min-w-[200px]">
                <p className="text-zinc-400 text-xs uppercase tracking-wider">Final Score</p>
                <p className="text-3xl font-mono font-bold text-emerald-400">{score}</p>
              </div>
            )}
            <button
              onClick={startGame}
              className="px-8 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-black font-bold rounded-xl transition transform active:scale-95 shadow-lg shadow-emerald-500/20"
            >
              {gameOver ? "PLAY AGAIN" : "START CLIMB"}
            </button>
            <p className="mt-4 text-xs text-zinc-500 font-mono">
              [Space / Up Arrow / Tap Screen] to Wall Jump & Slice
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
