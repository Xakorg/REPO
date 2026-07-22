"use client";
import React, { useEffect, useRef, useState } from "react";

const COLORS = ["#06b6d4", "#ec4899", "#eab308", "#22c55e"]; // Cyan, Magenta, Yellow, Green

export default function VoidSpin() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [gameState, setGameState] = useState<"IDLE" | "PLAYING" | "GAMEOVER">("IDLE");
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);

  const rotationRef = useRef(0); // target rotation angle in quarter-turns (0, 1, 2, 3)
  const currentAngleRef = useRef(0);
  const nodesRef = useRef<Array<{ angleIndex: number; colorIndex: number; dist: number; speed: number }>>([]);
  const scoreRef = useRef(0);
  scoreRef.current = score;

  const startGame = () => {
    rotationRef.current = 0;
    currentAngleRef.current = 0;
    nodesRef.current = [];
    setScore(0);
    setLives(3);
    setGameState("PLAYING");
  };

  const rotateLeft = () => {
    rotationRef.current = (rotationRef.current - 1 + 4) % 4;
  };

  const rotateRight = () => {
    rotationRef.current = (rotationRef.current + 1) % 4;
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft" || e.key === "a" || e.key === "A") rotateLeft();
      if (e.key === "ArrowRight" || e.key === "d" || e.key === "D") rotateRight();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  useEffect(() => {
    if (gameState !== "PLAYING") return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;
    let spawnTimer = 0;
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const dialRadius = 60;

    const loop = () => {
      // Smoothly interpolate current angle towards rotation target
      const targetAngle = (rotationRef.current * Math.PI) / 2;
      let diff = targetAngle - currentAngleRef.current;
      while (diff < -Math.PI) diff += Math.PI * 2;
      while (diff > Math.PI) diff -= Math.PI * 2;
      currentAngleRef.current += diff * 0.25;

      // Spawn nodes
      spawnTimer++;
      if (spawnTimer % 60 === 0) {
        const dirIndex = Math.floor(Math.random() * 4); // 0: Top, 1: Right, 2: Bottom, 3: Left
        const colorIdx = Math.floor(Math.random() * 4);
        nodesRef.current.push({
          angleIndex: dirIndex,
          colorIndex: colorIdx,
          dist: 280,
          speed: 2 + Math.random() * 1.5,
        });
      }

      // Move nodes & check collisions
      for (let i = nodesRef.current.length - 1; i >= 0; i--) {
        const node = nodesRef.current[i];
        node.dist -= node.speed;

        if (node.dist <= dialRadius + 10) {
          nodesRef.current.splice(i, 1);

          // Determine which sector of the dial facing this node direction
          // Dir 0 = top (-PI/2), 1 = right (0), 2 = bottom (PI/2), 3 = left (PI)
          // Dial sectors (0,1,2,3) rotated by currentAngleRef
          const sectorAtDir = (node.angleIndex - rotationRef.current + 4) % 4;

          if (sectorAtDir === node.colorIndex) {
            setScore((s) => s + 150);
          } else {
            setLives((l) => {
              const next = l - 1;
              if (next <= 0) {
                setGameState("GAMEOVER");
                window.dispatchEvent(
                  new CustomEvent("xakteir-game-score", {
                    detail: { score: scoreRef.current },
                  })
                );
              }
              return next;
            });
          }
        }
      }

      // Render
      ctx.fillStyle = "#09090b";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw Center Dial with 4 colored sectors
      ctx.save();
      ctx.translate(centerX, centerY);
      ctx.rotate(currentAngleRef.current);

      for (let s = 0; s < 4; s++) {
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.arc(0, 0, dialRadius, (s * Math.PI) / 2 - Math.PI / 4, ((s + 1) * Math.PI) / 2 - Math.PI / 4);
        ctx.closePath();
        ctx.fillStyle = COLORS[s];
        ctx.fill();
        ctx.strokeStyle = "#18181b";
        ctx.lineWidth = 3;
        ctx.stroke();
      }
      ctx.restore();

      // Draw Central core indicator
      ctx.beginPath();
      ctx.arc(centerX, centerY, 20, 0, Math.PI * 2);
      ctx.fillStyle = "#18181b";
      ctx.fill();
      ctx.strokeStyle = "#3f3f46";
      ctx.stroke();

      // Draw Nodes moving towards center
      nodesRef.current.forEach((node) => {
        // angle for direction: 0 -> -PI/2, 1 -> 0, 2 -> PI/2, 3 -> PI
        const angleMap = [-Math.PI / 2, 0, Math.PI / 2, Math.PI];
        const angle = angleMap[node.angleIndex];
        const nx = centerX + Math.cos(angle) * node.dist;
        const ny = centerY + Math.sin(angle) * node.dist;

        ctx.beginPath();
        ctx.arc(nx, ny, 14, 0, Math.PI * 2);
        ctx.fillStyle = COLORS[node.colorIndex];
        ctx.fill();
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 2;
        ctx.stroke();
      });

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [gameState]);

  return (
    <div className="w-full h-full flex flex-col items-center justify-center bg-zinc-950 text-white p-4">
      <div className="flex gap-8 mb-4 text-xl font-bold uppercase tracking-wider">
        <div>Score: <span className="text-pink-400">{score}</span></div>
        <div>Lives: <span className="text-red-400">{"❤️".repeat(lives)}</span></div>
      </div>
      <div className="relative border border-zinc-800 rounded-xl overflow-hidden shadow-2xl">
        <canvas ref={canvasRef} width={800} height={600} className="block bg-zinc-950" />
        {gameState !== "PLAYING" && (
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center gap-4">
            <h1 className="text-4xl font-extrabold tracking-widest text-pink-400">VOID SPIN</h1>
            {gameState === "GAMEOVER" && (
              <p className="text-2xl text-zinc-300">Final Score: <span className="text-pink-400 font-bold">{score}</span></p>
            )}
            <p className="text-sm text-zinc-400">Controls: Left/Right Arrow or A/D to spin the central dial!</p>
            <div className="flex gap-4">
              <button
                onClick={rotateLeft}
                className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 rounded text-sm font-semibold"
              >
                ◀ Rotate Left
              </button>
              <button
                onClick={rotateRight}
                className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 rounded text-sm font-semibold"
              >
                Rotate Right ▶
              </button>
            </div>
            <button
              onClick={startGame}
              className="mt-4 px-8 py-3 bg-pink-500 hover:bg-pink-400 text-zinc-950 font-black tracking-wider rounded-lg transition-transform active:scale-95"
            >
              {gameState === "GAMEOVER" ? "RESTART" : "PLAY NOW"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
