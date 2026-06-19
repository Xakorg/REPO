"use client";
import { useEffect, useRef } from "react";

const TILE = 50;
const COLS = 13, ROWS = 9;

export default function Frogger() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;
    const W = COLS * TILE, H = ROWS * TILE;

    let fx = 6, fy = 8; // frog grid pos
    let score = 0, lives = 3, gameOver = false;
    const keys: Record<string, boolean> = {};

    type Lane = { y: number; objs: { x: number; w: number; color: string }[]; speed: number; type: "car" | "log" };

    const lanes: Lane[] = [
      { y: 6, objs: [{ x: 0, w: 2, color: "#ef4444" }, { x: 5, w: 2, color: "#ef4444" }, { x: 9, w: 2, color: "#ef4444" }], speed: 0.04, type: "car" },
      { y: 5, objs: [{ x: 2, w: 3, color: "#f97316" }, { x: 8, w: 3, color: "#f97316" }], speed: -0.03, type: "car" },
      { y: 4, objs: [{ x: 0, w: 2, color: "#eab308" }, { x: 5, w: 2, color: "#eab308" }, { x: 10, w: 2, color: "#eab308" }], speed: 0.05, type: "car" },
      { y: 2, objs: [{ x: 0, w: 3, color: "#92400e" }, { x: 5, w: 3, color: "#92400e" }], speed: -0.02, type: "log" },
      { y: 1, objs: [{ x: 1, w: 4, color: "#78350f" }, { x: 8, w: 4, color: "#78350f" }], speed: 0.025, type: "log" },
    ];

    let moveTimer = 0;
    const handleKey = (e: KeyboardEvent) => { keys[e.code] = true; };
    const handleKeyUp = (e: KeyboardEvent) => { keys[e.code] = false; };
    window.addEventListener("keydown", handleKey);
    window.addEventListener("keyup", handleKeyUp);

    let frame: number;
    let lastMove = 0;

    const tick = (time: number) => {
      if (!gameOver) {
        // Move frog
        if (time - lastMove > 150) {
          if (keys["ArrowUp"]) { fy = Math.max(0, fy - 1); lastMove = time; }
          if (keys["ArrowDown"]) { fy = Math.min(8, fy + 1); lastMove = time; }
          if (keys["ArrowLeft"]) { fx = Math.max(0, fx - 1); lastMove = time; }
          if (keys["ArrowRight"]) { fx = Math.min(12, fx + 1); lastMove = time; }
        }

        if (fy === 0) { score++; fx = 6; fy = 8; }

        // Move lanes
        for (const lane of lanes) {
          for (const o of lane.objs) {
            o.x += lane.speed;
            if (o.x > COLS) o.x -= COLS + o.w;
            if (o.x + o.w < 0) o.x += COLS + o.w;
          }
        }

        // Collision on roads
        for (const lane of lanes) {
          if (lane.type !== "car" || lane.y !== fy) continue;
          let hit = false;
          for (const o of lane.objs) {
            if (fx >= o.x && fx < o.x + o.w) { hit = false; break; }
            hit = true;
          }
        }

        // Check death
        const road = lanes.filter(l => l.type === "car");
        for (const lane of road) {
          if (lane.y !== fy) continue;
          let onCar = false;
          for (const o of lane.objs) {
            if (fx >= Math.floor(o.x) && fx < Math.floor(o.x) + o.w) { onCar = true; }
          }
          if (!onCar) { lives--; fx = 6; fy = 8; if (lives <= 0) gameOver = true; }
        }
      }

      // Draw
      // Grass rows
      for (let r = 0; r < ROWS; r++) {
        ctx.fillStyle = [0, 3, 7, 8].includes(r) ? "#166534" : r <= 2 ? "#164e63" : "#92400e";
        ctx.fillRect(0, r * TILE, W, TILE);
      }
      ctx.fillStyle = "#0c4a6e";
      ctx.fillRect(0, 3 * TILE, W, 1 * TILE);

      // Lanes
      for (const lane of lanes) {
        for (const o of lane.objs) {
          ctx.fillStyle = lane.type === "log" ? "#a16207" : o.color;
          ctx.beginPath();
          ctx.roundRect(o.x * TILE, lane.y * TILE + 5, o.w * TILE - 4, TILE - 10, 8);
          ctx.fill();
        }
      }

      // Frog
      ctx.font = `${TILE - 8}px serif`;
      ctx.textAlign = "center";
      ctx.fillText("🐸", fx * TILE + TILE / 2, fy * TILE + TILE - 8);

      // HUD
      ctx.fillStyle = "white";
      ctx.font = "bold 14px monospace";
      ctx.textAlign = "left";
      ctx.fillText(`Score: ${score}  Lives: ${"♥".repeat(lives)}`, 5, 15);

      if (gameOver) {
        ctx.fillStyle = "rgba(0,0,0,0.8)";
        ctx.fillRect(0, 0, W, H);
        ctx.fillStyle = "white";
        ctx.font = "bold 36px monospace";
        ctx.textAlign = "center";
        ctx.fillText("GAME OVER", W / 2, H / 2);
        ctx.font = "20px monospace";
        ctx.fillText(`Score: ${score}`, W / 2, H / 2 + 40);
      }

      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => { window.removeEventListener("keydown", handleKey); window.removeEventListener("keyup", handleKeyUp); cancelAnimationFrame(frame); };
  }, []);

  return (
    <div className="w-full h-full flex flex-col items-center justify-center bg-[#052e16]">
      <canvas ref={canvasRef} width={COLS * TILE} height={ROWS * TILE} className="border-2 border-green-500/50 rounded-xl shadow-2xl max-w-full max-h-full object-contain" />
      <p className="mt-4 text-green-400 text-sm font-mono uppercase tracking-widest">Arrow Keys to hop!</p>
    </div>
  );
}
