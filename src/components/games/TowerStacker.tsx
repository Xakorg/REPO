"use client";
import { useEffect, useRef, useState } from "react";

export default function TowerStacker() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;
    const W = canvas.width, H = canvas.height;

    let stack: { x: number; w: number; y: number; color: string }[] = [{ x: W / 2 - 80, w: 160, y: H - 40, color: "#6366f1" }];
    let mover = { x: 0, w: 160, dir: 1, speed: 3 };
    let gameOver = false, score = 0;

    const place = () => {
      if (gameOver) { stack = [{ x: W / 2 - 80, w: 160, y: H - 40, color: "#6366f1" }]; mover = { x: 0, w: 160, dir: 1, speed: 3 }; score = 0; gameOver = false; return; }
      const top = stack[stack.length - 1];
      const left = Math.max(mover.x, top.x);
      const right = Math.min(mover.x + mover.w, top.x + top.w);
      const overlap = right - left;

      if (overlap <= 0) { gameOver = true; return; }
      const newY = top.y - 30;
      stack.push({ x: left, w: overlap, y: newY, color: `hsl(${score * 20 + 200}, 80%, 55%)` });
      mover = { x: -200, w: overlap, dir: 1, speed: 3 + score * 0.2 };
      score++;
    };

    canvas.addEventListener("click", place);
    window.addEventListener("keydown", e => { if (e.code === "Space") place(); });

    let frame: number;
    const tick = () => {
      if (!gameOver) {
        mover.x += mover.dir * mover.speed;
        if (mover.x + mover.w > W || mover.x < 0) mover.dir *= -1;
      }

      // Scroll camera
      const topBlock = stack[stack.length - 1];
      const cameraY = Math.max(0, H / 2 - topBlock.y);

      ctx.fillStyle = "#0c0a1e";
      ctx.fillRect(0, 0, W, H);

      // Stars
      for (let i = 0; i < 60; i++) {
        ctx.fillStyle = `rgba(255,255,255,${0.2 + Math.random() * 0.1})`;
        ctx.fillRect((i * 79 + cameraY * 0.1) % W, (i * 53) % H, 1, 1);
      }

      // Blocks
      ctx.save();
      ctx.translate(0, cameraY);
      for (const block of stack) {
        ctx.fillStyle = block.color;
        ctx.shadowColor = block.color; ctx.shadowBlur = 8;
        ctx.fillRect(block.x, block.y, block.w, 28);
        ctx.fillStyle = "rgba(255,255,255,0.2)";
        ctx.fillRect(block.x, block.y, block.w, 6);
        ctx.shadowBlur = 0;
      }

      // Mover
      if (!gameOver) {
        ctx.fillStyle = "#f59e0b";
        ctx.shadowColor = "#f59e0b"; ctx.shadowBlur = 15;
        ctx.fillRect(mover.x, topBlock.y - 30, mover.w, 28);
        ctx.shadowBlur = 0;
      }
      ctx.restore();

      ctx.fillStyle = "white";
      ctx.font = "bold 24px monospace";
      ctx.textAlign = "left";
      ctx.fillText(`Height: ${score}`, 10, 35);

      if (gameOver) {
        ctx.fillStyle = "rgba(0,0,0,0.8)";
        ctx.fillRect(0, 0, W, H);
        ctx.fillStyle = "#f59e0b";
        ctx.font = "bold 42px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText("Tower Fell!", W / 2, H / 2);
        ctx.fillStyle = "white";
        ctx.font = "24px monospace";
        ctx.fillText(`Height: ${score} — Click to retry`, W / 2, H / 2 + 50);
      } else {
        ctx.fillStyle = "rgba(255,255,255,0.3)";
        ctx.font = "12px monospace";
        ctx.textAlign = "center";
        ctx.fillText("Click or Space to place block!", W / 2, H - 10);
      }

      frame = requestAnimationFrame(tick);
    };
    tick();
    return () => { canvas.removeEventListener("click", place); cancelAnimationFrame(frame); };
  }, []);

  return (
    <div className="w-full h-full flex flex-col items-center justify-center bg-[#0c0a1e]">
      <canvas ref={canvasRef} width={640} height={480} className="border border-amber-500/30 rounded-xl shadow-2xl max-w-full max-h-full object-contain cursor-pointer" />
    </div>
  );
}
