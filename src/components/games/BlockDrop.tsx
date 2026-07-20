"use client";
import { useEffect, useRef, useState } from "react";

const COLS = 10;
const ROWS = 20;
const BLOCK_SIZE = 30;

const SHAPES = [
  [],
  [[1, 1, 1, 1]], // I
  [[1, 1, 1], [0, 1, 0]], // T
  [[1, 1, 1], [1, 0, 0]], // L
  [[1, 1, 1], [0, 0, 1]], // J
  [[1, 1], [1, 1]], // O
  [[1, 1, 0], [0, 1, 1]], // S
  [[0, 1, 1], [1, 1, 0]] // Z
];

const COLORS = [
  "transparent",
  "#0ea5e9", // I (cyan)
  "#a855f7", // T (purple)
  "#f97316", // L (orange)
  "#3b82f6", // J (blue)
  "#eab308", // O (yellow)
  "#22c55e", // S (green)
  "#ef4444"  // Z (red)
];

export default function BlockDrop() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [started, setStarted] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let board = Array.from({ length: ROWS }, () => Array(COLS).fill(0));
    let piece = { shape: [], color: 0, x: 0, y: 0 };
    let dropCounter = 0;
    let dropInterval = 1000;
    let lastTime = 0;
    let reqId: number;
    let localScore = 0;
    let isGameOver = false;

    function reset() {
      board = Array.from({ length: ROWS }, () => Array(COLS).fill(0));
      localScore = 0;
      setScore(0);
      isGameOver = false;
      setGameOver(false);
      dropInterval = 1000;
      spawn();
    }

    function spawn() {
      const typeId = Math.floor(Math.random() * 7) + 1;
      piece.shape = SHAPES[typeId];
      piece.color = typeId;
      piece.x = Math.floor(COLS / 2) - Math.floor(piece.shape[0].length / 2);
      piece.y = 0;

      if (collide(board, piece)) {
        isGameOver = true;
        setGameOver(true);
        window.dispatchEvent(new CustomEvent("xakteir-game-score", { detail: { score: localScore } }));
      }
    }

    function collide(b: number[][], p: any) {
      for (let y = 0; y < p.shape.length; ++y) {
        for (let x = 0; x < p.shape[y].length; ++x) {
          if (p.shape[y][x] !== 0) {
            const by = p.y + y;
            const bx = p.x + x;
            if (by >= ROWS || bx < 0 || bx >= COLS || (by >= 0 && b[by][bx] !== 0)) {
              return true;
            }
          }
        }
      }
      return false;
    }

    function merge() {
      for (let y = 0; y < piece.shape.length; ++y) {
        for (let x = 0; x < piece.shape[y].length; ++x) {
          if (piece.shape[y][x] !== 0) {
            if (piece.y + y >= 0) {
              board[piece.y + y][piece.x + x] = piece.color;
            }
          }
        }
      }
    }

    function rotate() {
      const p = piece;
      const rotated = p.shape[0].map((val: any, index: any) =>
        p.shape.map((row: any) => row[index]).reverse()
      );
      const prevShape = p.shape;
      p.shape = rotated;
      let offset = 1;
      while (collide(board, p)) {
        p.x += offset;
        offset = -(offset + (offset > 0 ? 1 : -1));
        if (offset > p.shape[0].length) {
          p.shape = prevShape;
          p.x = piece.x;
          return;
        }
      }
    }

    function drop() {
      piece.y++;
      if (collide(board, piece)) {
        piece.y--;
        merge();
        spawn();
        clearLines();
      }
      dropCounter = 0;
    }

    function clearLines() {
      let linesCleared = 0;
      outer: for (let y = ROWS - 1; y >= 0; --y) {
        for (let x = 0; x < COLS; ++x) {
          if (board[y][x] === 0) continue outer;
        }
        const row = board.splice(y, 1)[0].fill(0);
        board.unshift(row);
        ++y;
        linesCleared++;
      }
      if (linesCleared > 0) {
        localScore += linesCleared * 100 * linesCleared;
        setScore(localScore);
        dropInterval = Math.max(100, 1000 - (localScore / 10));
      }
    }

    function update(time = 0) {
      if (isGameOver) return;
      if (!started) {
        draw();
        reqId = requestAnimationFrame(update);
        return;
      }
      
      const deltaTime = time - lastTime;
      lastTime = time;
      dropCounter += deltaTime;
      if (dropCounter > dropInterval) {
        drop();
      }
      draw();
      reqId = requestAnimationFrame(update);
    }

    function draw() {
      ctx!.fillStyle = "#09090b"; // zinc-950
      ctx!.fillRect(0, 0, canvas.width, canvas.height);

      drawMatrix(board, 0, 0);
      drawMatrix(piece.shape, piece.x, piece.y);

      if (!started && !isGameOver) {
        ctx!.fillStyle = "rgba(0,0,0,0.5)";
        ctx!.fillRect(0, 0, canvas.width, canvas.height);
        ctx!.fillStyle = "white";
        ctx!.font = "20px sans-serif";
        ctx!.textAlign = "center";
        ctx!.fillText("Click to Start", canvas.width / 2, canvas.height / 2);
      } else if (isGameOver) {
        ctx!.fillStyle = "rgba(0,0,0,0.7)";
        ctx!.fillRect(0, 0, canvas.width, canvas.height);
        ctx!.fillStyle = "white";
        ctx!.font = "bold 30px sans-serif";
        ctx!.textAlign = "center";
        ctx!.fillText("GAME OVER", canvas.width / 2, canvas.height / 2 - 20);
        ctx!.font = "16px sans-serif";
        ctx!.fillText("Click to Restart", canvas.width / 2, canvas.height / 2 + 20);
      }
    }

    function drawMatrix(matrix: number[][], offsetX: number, offsetY: number) {
      for (let y = 0; y < matrix.length; ++y) {
        for (let x = 0; x < matrix[y].length; ++x) {
          if (matrix[y][x] !== 0) {
            ctx!.fillStyle = COLORS[matrix[y][x]];
            const px = (x + offsetX) * BLOCK_SIZE;
            const py = (y + offsetY) * BLOCK_SIZE;
            ctx!.fillRect(px, py, BLOCK_SIZE, BLOCK_SIZE);
            ctx!.strokeStyle = "rgba(255,255,255,0.2)";
            ctx!.strokeRect(px, py, BLOCK_SIZE, BLOCK_SIZE);
            // inner highlight
            ctx!.fillStyle = "rgba(255,255,255,0.3)";
            ctx!.fillRect(px, py, BLOCK_SIZE, 4);
            ctx!.fillStyle = "rgba(0,0,0,0.3)";
            ctx!.fillRect(px, py + BLOCK_SIZE - 4, BLOCK_SIZE, 4);
          }
        }
      }
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (!started || isGameOver) return;
      if (e.key === "ArrowLeft") {
        piece.x--;
        if (collide(board, piece)) piece.x++;
      } else if (e.key === "ArrowRight") {
        piece.x++;
        if (collide(board, piece)) piece.x--;
      } else if (e.key === "ArrowDown") {
        drop();
      } else if (e.key === "ArrowUp") {
        rotate();
      } else if (e.key === " ") {
        while (!collide(board, piece)) {
          piece.y++;
        }
        piece.y--;
        drop();
      }
    };

    const handleClick = () => {
      if (isGameOver) {
        reset();
      }
      setStarted(true);
    };

    window.addEventListener("keydown", handleKeyDown);
    canvas.addEventListener("click", handleClick);

    reset();
    update();

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      canvas.removeEventListener("click", handleClick);
      cancelAnimationFrame(reqId);
    };
  }, [started]);

  return (
    <div className="flex flex-col items-center justify-center p-8 select-none">
      <div className="mb-4 text-white text-2xl font-black tracking-widest uppercase">
        Score: {score}
      </div>
      <div className="relative rounded-xl overflow-hidden shadow-[0_0_50px_rgba(14,165,233,0.3)] ring-4 ring-white/10">
        <canvas
          ref={canvasRef}
          width={COLS * BLOCK_SIZE}
          height={ROWS * BLOCK_SIZE}
          className="bg-zinc-950 block"
        />
      </div>
      <div className="mt-6 text-white/50 text-sm flex gap-4">
        <span><kbd className="bg-white/10 px-2 py-1 rounded">←→</kbd> Move</span>
        <span><kbd className="bg-white/10 px-2 py-1 rounded">↑</kbd> Rotate</span>
        <span><kbd className="bg-white/10 px-2 py-1 rounded">↓</kbd> Soft Drop</span>
        <span><kbd className="bg-white/10 px-2 py-1 rounded">Space</kbd> Hard Drop</span>
      </div>
    </div>
  );
}
