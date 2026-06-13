"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { X, Trophy } from "lucide-react";

export function BreakerGame({ onExit }: { onExit: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let ballX = canvas.width / 2;
    let ballY = canvas.height - 30;
    let dx = 2;
    let dy = -2;
    const ballRadius = 8;
    const paddleHeight = 10;
    const paddleWidth = 75;
    let paddleX = (canvas.width - paddleWidth) / 2;
    let rightPressed = false;
    let leftPressed = false;

    const brickRowCount = 3;
    const brickColumnCount = 5;
    const brickWidth = 60;
    const brickHeight = 20;
    const brickPadding = 10;
    const brickOffsetTop = 30;
    const brickOffsetLeft = 30;

    const bricks: any[] = [];
    for (let c = 0; c < brickColumnCount; c++) {
      bricks[c] = [];
      for (let r = 0; r < brickRowCount; r++) {
        bricks[c][r] = { x: 0, y: 0, status: 1 };
      }
    }

    const keyDownHandler = (e: KeyboardEvent) => {
      if (e.key === "Right" || e.key === "ArrowRight") rightPressed = true;
      if (e.key === "Left" || e.key === "ArrowLeft") leftPressed = true;
    };
    const keyUpHandler = (e: KeyboardEvent) => {
      if (e.key === "Right" || e.key === "ArrowRight") rightPressed = false;
      if (e.key === "Left" || e.key === "ArrowLeft") leftPressed = false;
    };

    const drawBall = () => {
      ctx.beginPath();
      ctx.arc(ballX, ballY, ballRadius, 0, Math.PI * 2);
      ctx.fillStyle = "#a855f7";
      ctx.fill();
      ctx.closePath();
    };

    const drawPaddle = () => {
      ctx.beginPath();
      ctx.rect(paddleX, canvas.height - paddleHeight, paddleWidth, paddleHeight);
      ctx.fillStyle = "#fff";
      ctx.fill();
      ctx.closePath();
    };

    const drawBricks = () => {
      for (let c = 0; c < brickColumnCount; c++) {
        for (let r = 0; r < brickRowCount; r++) {
          if (bricks[c][r].status === 1) {
            const brickX = c * (brickWidth + brickPadding) + brickOffsetLeft;
            const brickY = r * (brickHeight + brickPadding) + brickOffsetTop;
            bricks[c][r].x = brickX;
            bricks[c][r].y = brickY;
            ctx.beginPath();
            ctx.rect(brickX, brickY, brickWidth, brickHeight);
            ctx.fillStyle = "#3b82f6";
            ctx.fill();
            ctx.closePath();
          }
        }
      }
    };

    const collisionDetection = () => {
      for (let c = 0; c < brickColumnCount; c++) {
        for (let r = 0; r < brickRowCount; r++) {
          const b = bricks[c][r];
          if (b.status === 1) {
            if (ballX > b.x && ballX < b.x + brickWidth && ballY > b.y && ballY < b.y + brickHeight) {
              dy = -dy;
              b.status = 0;
              setScore(s => s + 100);
            }
          }
        }
      }
    };

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      drawBricks();
      drawBall();
      drawPaddle();
      collisionDetection();

      if (ballX + dx > canvas.width - ballRadius || ballX + dx < ballRadius) dx = -dx;
      if (ballY + dy < ballRadius) dy = -dy;
      else if (ballY + dy > canvas.height - ballRadius) {
        if (ballX > paddleX && ballX < paddleX + paddleWidth) dy = -dy;
        else setGameOver(true);
      }

      if (rightPressed && paddleX < canvas.width - paddleWidth) paddleX += 7;
      else if (leftPressed && paddleX > 0) paddleX -= 7;

      ballX += dx;
      ballY += dy;
    };

    window.addEventListener("keydown", keyDownHandler);
    window.addEventListener("keyup", keyUpHandler);
    const interval = setInterval(draw, 10);

    return () => {
      clearInterval(interval);
      window.removeEventListener("keydown", keyDownHandler);
      window.removeEventListener("keyup", keyUpHandler);
    };
  }, [gameOver]);

  return (
    <div className="flex flex-col items-center gap-8 p-12 glass-card rounded-[4rem] border-4 border-primary/30 bg-background/90 max-w-md w-full relative">
      <div className="flex justify-between w-full items-center">
        <h2 className="text-3xl font-black italic uppercase">Xak_Breaker</h2>
        <Button size="icon" variant="ghost" onClick={onExit}><X className="w-8 h-8" /></Button>
      </div>
      <canvas ref={canvasRef} width={400} height={320} className="bg-black/50 rounded-2xl border-4 border-white/5" />
      <div className="text-center font-black text-2xl">Score: {score}</div>
      {gameOver && <div className="absolute inset-0 bg-black/90 flex flex-col items-center justify-center rounded-[4rem] z-50">
        <Trophy className="w-16 h-16 text-amber-500 mb-4" />
        <h3 className="text-4xl font-black">GAME OVER</h3>
        <Button onClick={() => window.location.reload()} className="mt-8 bg-primary">Retry</Button>
      </div>}
    </div>
  );
}
