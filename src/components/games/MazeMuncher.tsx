"use client";
import { useEffect, useRef, useState } from "react";

const TILE_SIZE = 24;
const COLS = 19;
const ROWS = 21;
const CANVAS_WIDTH = COLS * TILE_SIZE;
const CANVAS_HEIGHT = ROWS * TILE_SIZE;

// 0: path, 1: wall, 2: dot, 3: power pellet, 4: empty
const MAZE = [
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
  [1,2,2,2,2,2,2,2,2,1,2,2,2,2,2,2,2,2,1],
  [1,3,1,1,2,1,1,1,2,1,2,1,1,1,2,1,1,3,1],
  [1,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,1],
  [1,2,1,1,2,1,2,1,1,1,1,1,2,1,2,1,1,2,1],
  [1,2,2,2,2,1,2,2,2,1,2,2,2,1,2,2,2,2,1],
  [1,1,1,1,2,1,1,1,0,1,0,1,1,1,2,1,1,1,1],
  [0,0,0,1,2,1,0,0,0,0,0,0,0,1,2,1,0,0,0],
  [1,1,1,1,2,1,0,1,1,4,1,1,0,1,2,1,1,1,1],
  [0,0,0,0,2,0,0,1,4,4,4,1,0,0,2,0,0,0,0],
  [1,1,1,1,2,1,0,1,1,1,1,1,0,1,2,1,1,1,1],
  [0,0,0,1,2,1,0,0,0,0,0,0,0,1,2,1,0,0,0],
  [1,1,1,1,2,1,2,1,1,1,1,1,2,1,2,1,1,1,1],
  [1,2,2,2,2,2,2,2,2,1,2,2,2,2,2,2,2,2,1],
  [1,2,1,1,2,1,1,1,2,1,2,1,1,1,2,1,1,2,1],
  [1,3,2,1,2,2,2,2,2,0,2,2,2,2,2,1,2,3,1],
  [1,1,2,1,2,1,2,1,1,1,1,1,2,1,2,1,2,1,1],
  [1,2,2,2,2,1,2,2,2,1,2,2,2,1,2,2,2,2,1],
  [1,2,1,1,1,1,1,1,2,1,2,1,1,1,1,1,1,2,1],
  [1,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,1],
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]
];

export default function MazeMuncher() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [started, setStarted] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let reqId: number;
    let localScore = 0;
    let isGameOver = false;
    let map = MAZE.map(row => [...row]);
    let totalDots = map.flat().filter(c => c === 2 || c === 3).length;
    let dotsEaten = 0;

    const SPEED = 2;
    
    let player = {
      x: 9 * TILE_SIZE + TILE_SIZE/2,
      y: 15 * TILE_SIZE + TILE_SIZE/2,
      vx: 0,
      vy: 0,
      nextVx: 0,
      nextVy: 0,
      r: 8
    };

    let ghosts = [
      { x: 9 * TILE_SIZE + TILE_SIZE/2, y: 9 * TILE_SIZE + TILE_SIZE/2, vx: SPEED, vy: 0, r: 8, color: "#ef4444" },
      { x: 8 * TILE_SIZE + TILE_SIZE/2, y: 9 * TILE_SIZE + TILE_SIZE/2, vx: -SPEED, vy: 0, r: 8, color: "#ec4899" },
      { x: 10 * TILE_SIZE + TILE_SIZE/2, y: 9 * TILE_SIZE + TILE_SIZE/2, vx: 0, vy: -SPEED, r: 8, color: "#06b6d4" },
      { x: 9 * TILE_SIZE + TILE_SIZE/2, y: 8 * TILE_SIZE + TILE_SIZE/2, vx: SPEED, vy: 0, r: 8, color: "#f59e0b" }
    ];

    function reset() {
      map = MAZE.map(row => [...row]);
      totalDots = map.flat().filter(c => c === 2 || c === 3).length;
      dotsEaten = 0;
      localScore = 0;
      setScore(0);
      isGameOver = false;
      setGameOver(false);
      player = { x: 9 * TILE_SIZE + TILE_SIZE/2, y: 15 * TILE_SIZE + TILE_SIZE/2, vx: 0, vy: 0, nextVx: 0, nextVy: 0, r: 8 };
      ghosts = [
        { x: 9 * TILE_SIZE + TILE_SIZE/2, y: 9 * TILE_SIZE + TILE_SIZE/2, vx: SPEED, vy: 0, r: 8, color: "#ef4444" },
        { x: 8 * TILE_SIZE + TILE_SIZE/2, y: 9 * TILE_SIZE + TILE_SIZE/2, vx: -SPEED, vy: 0, r: 8, color: "#ec4899" },
        { x: 10 * TILE_SIZE + TILE_SIZE/2, y: 9 * TILE_SIZE + TILE_SIZE/2, vx: 0, vy: -SPEED, r: 8, color: "#06b6d4" },
        { x: 9 * TILE_SIZE + TILE_SIZE/2, y: 8 * TILE_SIZE + TILE_SIZE/2, vx: SPEED, vy: 0, r: 8, color: "#f59e0b" }
      ];
    }

    function isWall(x: number, y: number) {
      const col = Math.floor(x / TILE_SIZE);
      const row = Math.floor(y / TILE_SIZE);
      if (row < 0 || row >= ROWS) return false; // wrap around tunnel
      if (col < 0 || col >= COLS) return false;
      return map[row][col] === 1;
    }

    function getCenterTile(x: number, y: number) {
      return { col: Math.floor(x / TILE_SIZE), row: Math.floor(y / TILE_SIZE) };
    }

    function canMove(entity: {x:number, y:number, r:number}, vx: number, vy: number) {
      const cx = entity.x + vx;
      const cy = entity.y + vy;
      // bounding box corners
      const r = entity.r - 1; // slight forgiveness
      if (isWall(cx - r, cy - r)) return false;
      if (isWall(cx + r, cy - r)) return false;
      if (isWall(cx - r, cy + r)) return false;
      if (isWall(cx + r, cy + r)) return false;
      return true;
    }

    function snapToGrid(entity: any, vx: number, vy: number) {
       const tc = getCenterTile(entity.x, entity.y);
       if (vx !== 0) { // moving horizontally, snap Y
          entity.y = tc.row * TILE_SIZE + TILE_SIZE / 2;
       }
       if (vy !== 0) { // moving vertically, snap X
          entity.x = tc.col * TILE_SIZE + TILE_SIZE / 2;
       }
    }

    function update() {
      if (!started || isGameOver) {
        draw();
        reqId = requestAnimationFrame(update);
        return;
      }

      // Try next queued move if possible, and we are close to grid center to allow cornering
      const tc = getCenterTile(player.x, player.y);
      const cx = tc.col * TILE_SIZE + TILE_SIZE / 2;
      const cy = tc.row * TILE_SIZE + TILE_SIZE / 2;
      
      const distToCenter = Math.abs(player.x - cx) + Math.abs(player.y - cy);
      
      if (distToCenter <= SPEED && (player.nextVx !== 0 || player.nextVy !== 0)) {
         if (canMove(player, player.nextVx, player.nextVy)) {
            player.vx = player.nextVx;
            player.vy = player.nextVy;
            snapToGrid(player, player.vx, player.vy);
            player.nextVx = 0;
            player.nextVy = 0;
         }
      }

      if (canMove(player, player.vx, player.vy)) {
         player.x += player.vx;
         player.y += player.vy;
      }

      // Screen wrap
      if (player.x < -TILE_SIZE/2) player.x = CANVAS_WIDTH + TILE_SIZE/2;
      else if (player.x > CANVAS_WIDTH + TILE_SIZE/2) player.x = -TILE_SIZE/2;

      // Eat dots
      const pct = getCenterTile(player.x, player.y);
      if (pct.col >= 0 && pct.col < COLS && pct.row >= 0 && pct.row < ROWS) {
         if (map[pct.row][pct.col] === 2) {
            map[pct.row][pct.col] = 0;
            localScore += 10;
            dotsEaten++;
            setScore(localScore);
         } else if (map[pct.row][pct.col] === 3) {
            map[pct.row][pct.col] = 0;
            localScore += 50;
            dotsEaten++;
            setScore(localScore);
            // In a real game, this makes ghosts edible. Here we just give points.
         }
      }

      if (dotsEaten === totalDots) {
         isGameOver = true;
         setGameOver(true);
         window.dispatchEvent(new CustomEvent("xakteir-game-score", { detail: { score: localScore } }));
      }

      // Ghosts AI (basic random intersection turning)
      for (const g of ghosts) {
         const gc = getCenterTile(g.x, g.y);
         const gcx = gc.col * TILE_SIZE + TILE_SIZE / 2;
         const gcy = gc.row * TILE_SIZE + TILE_SIZE / 2;
         const gdist = Math.abs(g.x - gcx) + Math.abs(g.y - gcy);

         if (gdist <= SPEED) {
            const possibleMoves = [];
            if (g.vx !== -SPEED && canMove(g, SPEED, 0)) possibleMoves.push({vx: SPEED, vy: 0});
            if (g.vx !== SPEED && canMove(g, -SPEED, 0)) possibleMoves.push({vx: -SPEED, vy: 0});
            if (g.vy !== -SPEED && canMove(g, 0, SPEED)) possibleMoves.push({vx: 0, vy: SPEED});
            if (g.vy !== SPEED && canMove(g, 0, -SPEED)) possibleMoves.push({vx: 0, vy: -SPEED});

            if (possibleMoves.length > 0) {
               // Prefer moving towards player (simple AI)
               let bestMove = possibleMoves[Math.floor(Math.random() * possibleMoves.length)];
               if (Math.random() > 0.4) {
                  let minD = Infinity;
                  for (const m of possibleMoves) {
                     const dx = (g.x + m.vx * 10) - player.x;
                     const dy = (g.y + m.vy * 10) - player.y;
                     const d = dx*dx + dy*dy;
                     if (d < minD) {
                        minD = d;
                        bestMove = m;
                     }
                  }
               }
               g.vx = bestMove.vx;
               g.vy = bestMove.vy;
               snapToGrid(g, g.vx, g.vy);
            } else if (g.vx === 0 && g.vy === 0) {
               // trapped, move randomly
               if (canMove(g, SPEED, 0)) g.vx = SPEED;
               else if (canMove(g, -SPEED, 0)) g.vx = -SPEED;
               else if (canMove(g, 0, SPEED)) g.vy = SPEED;
               else if (canMove(g, 0, -SPEED)) g.vy = -SPEED;
            }
         }

         if (canMove(g, g.vx, g.vy)) {
            g.x += g.vx;
            g.y += g.vy;
         }

         // Screen wrap for ghosts
         if (g.x < -TILE_SIZE/2) g.x = CANVAS_WIDTH + TILE_SIZE/2;
         else if (g.x > CANVAS_WIDTH + TILE_SIZE/2) g.x = -TILE_SIZE/2;

         // Collision with player
         const distToPlayer = Math.abs(g.x - player.x) + Math.abs(g.y - player.y);
         if (distToPlayer < player.r + g.r) {
            isGameOver = true;
            setGameOver(true);
            window.dispatchEvent(new CustomEvent("xakteir-game-score", { detail: { score: localScore } }));
         }
      }

      draw();
      reqId = requestAnimationFrame(update);
    }

    function draw() {
      ctx!.fillStyle = "#09090b";
      ctx!.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      // Draw Map
      for (let r = 0; r < ROWS; r++) {
         for (let c = 0; c < COLS; c++) {
            const tile = map[r][c];
            const px = c * TILE_SIZE;
            const py = r * TILE_SIZE;

            if (tile === 1) {
               ctx!.fillStyle = "#1e3a8a"; // blue-900 walls
               ctx!.fillRect(px, py, TILE_SIZE, TILE_SIZE);
               ctx!.strokeStyle = "#3b82f6"; // blue-500 edge
               ctx!.strokeRect(px + 2, py + 2, TILE_SIZE - 4, TILE_SIZE - 4);
            } else if (tile === 2) {
               ctx!.fillStyle = "#fef08a"; // yellow-200 dots
               ctx!.beginPath();
               ctx!.arc(px + TILE_SIZE/2, py + TILE_SIZE/2, 2, 0, Math.PI * 2);
               ctx!.fill();
            } else if (tile === 3) {
               ctx!.fillStyle = "#fef08a"; // yellow-200 power pellets
               ctx!.beginPath();
               ctx!.arc(px + TILE_SIZE/2, py + TILE_SIZE/2, 5, 0, Math.PI * 2);
               ctx!.fill();
            }
         }
      }

      if (started && !isGameOver) {
         // Draw Player
         ctx!.fillStyle = "#eab308"; // yellow-500
         ctx!.beginPath();
         
         let angleOffset = 0;
         if (player.vx > 0) angleOffset = 0;
         else if (player.vx < 0) angleOffset = Math.PI;
         else if (player.vy > 0) angleOffset = Math.PI / 2;
         else if (player.vy < 0) angleOffset = -Math.PI / 2;

         // Chomp animation
         const mouth = 0.2 + 0.2 * Math.sin(Date.now() / 50);
         
         ctx!.arc(player.x, player.y, player.r, angleOffset + mouth * Math.PI, angleOffset + (2 - mouth) * Math.PI);
         ctx!.lineTo(player.x, player.y);
         ctx!.fill();

         // Draw Ghosts
         for (const g of ghosts) {
            ctx!.fillStyle = g.color;
            ctx!.beginPath();
            ctx!.arc(g.x, g.y, g.r, Math.PI, 0);
            ctx!.lineTo(g.x + g.r, g.y + g.r);
            
            // Wavy bottom
            ctx!.lineTo(g.x + g.r * 0.5, g.y + g.r * 0.8);
            ctx!.lineTo(g.x, g.y + g.r);
            ctx!.lineTo(g.x - g.r * 0.5, g.y + g.r * 0.8);
            ctx!.lineTo(g.x - g.r, g.y + g.r);
            
            ctx!.closePath();
            ctx!.fill();

            // Eyes
            ctx!.fillStyle = "white";
            ctx!.beginPath();
            ctx!.arc(g.x - 3, g.y - 2, 2, 0, Math.PI * 2);
            ctx!.arc(g.x + 3, g.y - 2, 2, 0, Math.PI * 2);
            ctx!.fill();
            ctx!.fillStyle = "blue";
            ctx!.beginPath();
            ctx!.arc(g.x - 3 + (g.vx > 0 ? 1 : g.vx < 0 ? -1 : 0), g.y - 2 + (g.vy > 0 ? 1 : g.vy < 0 ? -1 : 0), 1, 0, Math.PI * 2);
            ctx!.arc(g.x + 3 + (g.vx > 0 ? 1 : g.vx < 0 ? -1 : 0), g.y - 2 + (g.vy > 0 ? 1 : g.vy < 0 ? -1 : 0), 1, 0, Math.PI * 2);
            ctx!.fill();
         }
      }

      if (!started && !isGameOver) {
        ctx!.fillStyle = "rgba(0,0,0,0.5)";
        ctx!.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
        ctx!.fillStyle = "white";
        ctx!.font = "20px sans-serif";
        ctx!.textAlign = "center";
        ctx!.fillText("Click to Start", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
      } else if (isGameOver) {
        ctx!.fillStyle = "rgba(0,0,0,0.7)";
        ctx!.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
        ctx!.fillStyle = "white";
        ctx!.font = "bold 30px sans-serif";
        ctx!.textAlign = "center";
        ctx!.fillText(dotsEaten === totalDots ? "YOU WIN!" : "GAME OVER", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 20);
        ctx!.font = "16px sans-serif";
        ctx!.fillText("Click to Restart", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 20);
      }
    }

    const handleKeyDown = (e: KeyboardEvent) => {
       if (e.key === "w" || e.key === "ArrowUp") { player.nextVx = 0; player.nextVy = -SPEED; }
       if (e.key === "a" || e.key === "ArrowLeft") { player.nextVx = -SPEED; player.nextVy = 0; }
       if (e.key === "s" || e.key === "ArrowDown") { player.nextVx = 0; player.nextVy = SPEED; }
       if (e.key === "d" || e.key === "ArrowRight") { player.nextVx = SPEED; player.nextVy = 0; }
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
    reqId = requestAnimationFrame(update);

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
      <div className="relative rounded-xl overflow-hidden shadow-[0_0_50px_rgba(234,179,8,0.2)] ring-4 ring-white/10">
        <canvas
          ref={canvasRef}
          width={CANVAS_WIDTH}
          height={CANVAS_HEIGHT}
          className="bg-zinc-950 block"
        />
      </div>
      <div className="mt-6 text-white/50 text-sm flex gap-4">
        <span><kbd className="bg-white/10 px-2 py-1 rounded">W A S D</kbd> Move</span>
      </div>
    </div>
  );
}
