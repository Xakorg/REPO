"use client";
import { useEffect, useRef, useState } from "react";

const LANES = 4;
const TILE_HEIGHT = 120;
const TILE_WIDTH = 80;
const CANVAS_HEIGHT = 500;
const CANVAS_WIDTH = LANES * TILE_WIDTH;

export default function RhythmTap() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [started, setStarted] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let tiles: { lane: number; y: number; active: boolean; hit: boolean }[] = [];
    let localScore = 0;
    let isGameOver = false;
    let reqId: number;
    let speed = 4;
    let spawnTimer = 0;
    let spawnRate = 60; // frames
    
    function reset() {
      tiles = [];
      localScore = 0;
      setScore(0);
      isGameOver = false;
      setGameOver(false);
      speed = 4;
      spawnRate = 60;
      // Add first few tiles
      tiles.push({ lane: Math.floor(Math.random() * LANES), y: -TILE_HEIGHT, active: true, hit: false });
      tiles.push({ lane: Math.floor(Math.random() * LANES), y: -TILE_HEIGHT - 200, active: true, hit: false });
      tiles.push({ lane: Math.floor(Math.random() * LANES), y: -TILE_HEIGHT - 400, active: true, hit: false });
    }

    function update() {
      if (!started || isGameOver) {
        draw();
        reqId = requestAnimationFrame(update);
        return;
      }

      spawnTimer++;
      if (spawnTimer >= spawnRate) {
        spawnTimer = 0;
        tiles.push({ lane: Math.floor(Math.random() * LANES), y: -TILE_HEIGHT, active: true, hit: false });
        // Increase difficulty
        if (spawnRate > 25) spawnRate -= 1;
        speed += 0.05;
      }

      for (let i = 0; i < tiles.length; i++) {
        const t = tiles[i];
        if (!t.active) continue;
        t.y += speed;
        
        // Missed tile
        if (t.y > CANVAS_HEIGHT && !t.hit) {
          isGameOver = true;
          setGameOver(true);
          window.dispatchEvent(new CustomEvent("xakteir-game-score", { detail: { score: localScore } }));
        }
      }

      draw();
      reqId = requestAnimationFrame(update);
    }

    function draw() {
      ctx!.fillStyle = "#fafafa";
      ctx!.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      // Draw lanes
      ctx!.strokeStyle = "#d4d4d8";
      ctx!.lineWidth = 1;
      for (let i = 1; i < LANES; i++) {
        ctx!.beginPath();
        ctx!.moveTo(i * TILE_WIDTH, 0);
        ctx!.lineTo(i * TILE_WIDTH, CANVAS_HEIGHT);
        ctx!.stroke();
      }

      // Draw tiles
      for (const t of tiles) {
        if (!t.active) continue;
        ctx!.fillStyle = t.hit ? "#a1a1aa" : "#09090b";
        ctx!.fillRect(t.lane * TILE_WIDTH, t.y, TILE_WIDTH, TILE_HEIGHT);
        
        if (!t.hit) {
           ctx!.fillStyle = "rgba(255,255,255,0.1)";
           ctx!.fillRect(t.lane * TILE_WIDTH + 5, t.y + 5, TILE_WIDTH - 10, 10);
        }
      }

      // HUD
      if (!started) {
        ctx!.fillStyle = "rgba(0,0,0,0.8)";
        ctx!.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
        ctx!.fillStyle = "white";
        ctx!.font = "20px sans-serif";
        ctx!.textAlign = "center";
        ctx!.fillText("Click to Start", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
      } else if (isGameOver) {
        ctx!.fillStyle = "rgba(0,0,0,0.8)";
        ctx!.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
        ctx!.fillStyle = "white";
        ctx!.font = "bold 30px sans-serif";
        ctx!.textAlign = "center";
        ctx!.fillText("GAME OVER", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 20);
        ctx!.font = "16px sans-serif";
        ctx!.fillText("Click to Restart", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 20);
      }
      
      // Bottom hit zone indicator
      ctx!.fillStyle = "rgba(239,68,68,0.2)";
      ctx!.fillRect(0, CANVAS_HEIGHT - Math.min(100, speed*10), CANVAS_WIDTH, Math.min(100, speed*10));
    }

    const handleClick = (e: MouseEvent) => {
      if (isGameOver) {
        reset();
        setStarted(true);
        return;
      }
      if (!started) {
        setStarted(true);
        return;
      }

      const rect = canvas.getBoundingClientRect();
      const scaleX = CANVAS_WIDTH / rect.width;
      const scaleY = CANVAS_HEIGHT / rect.height;
      const clickX = (e.clientX - rect.left) * scaleX;
      const clickY = (e.clientY - rect.top) * scaleY;
      
      const lane = Math.floor(clickX / TILE_WIDTH);

      // Find lowest unhit tile in that lane
      let hit = false;
      let lowestTile = null;
      for (const t of tiles) {
        if (t.active && !t.hit && t.lane === lane && t.y > -TILE_HEIGHT) {
           if (!lowestTile || t.y > lowestTile.y) {
              lowestTile = t;
           }
        }
      }

      if (lowestTile && clickY >= lowestTile.y && clickY <= lowestTile.y + TILE_HEIGHT) {
        lowestTile.hit = true;
        lowestTile.active = false;
        localScore += 10;
        setScore(localScore);
        hit = true;
      }

      // If clicked empty space in a lane where there is a tile, or totally missed
      if (!hit && clickY > CANVAS_HEIGHT / 2) {
         // Some versions of piano tiles punish you for misclicks.
         // Let's add a misclick penalty.
         isGameOver = true;
         setGameOver(true);
         window.dispatchEvent(new CustomEvent("xakteir-game-score", { detail: { score: localScore } }));
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
       if (!started || isGameOver) return;
       // Map keys D, F, J, K to lanes 0, 1, 2, 3
       const keys = ['d', 'f', 'j', 'k'];
       const lane = keys.indexOf(e.key.toLowerCase());
       if (lane !== -1) {
          let lowestTile = null;
          for (const t of tiles) {
            if (t.active && !t.hit && t.lane === lane && t.y > -TILE_HEIGHT) {
               if (!lowestTile || t.y > lowestTile.y) {
                  lowestTile = t;
               }
            }
          }
          if (lowestTile && lowestTile.y > CANVAS_HEIGHT - 250) {
             lowestTile.hit = true;
             lowestTile.active = false;
             localScore += 10;
             setScore(localScore);
          } else {
             isGameOver = true;
             setGameOver(true);
             window.dispatchEvent(new CustomEvent("xakteir-game-score", { detail: { score: localScore } }));
          }
       }
    };

    canvas.addEventListener("click", handleClick);
    window.addEventListener("keydown", handleKeyDown);

    reset();
    reqId = requestAnimationFrame(update);

    return () => {
      canvas.removeEventListener("click", handleClick);
      window.removeEventListener("keydown", handleKeyDown);
      cancelAnimationFrame(reqId);
    };
  }, [started]);

  return (
    <div className="flex flex-col items-center justify-center p-8 select-none">
      <div className="mb-4 text-white text-2xl font-black tracking-widest uppercase">
        Score: {score}
      </div>
      <div className="relative rounded-xl overflow-hidden shadow-[0_0_50px_rgba(255,255,255,0.1)] ring-4 ring-white/10 bg-white">
        <canvas
          ref={canvasRef}
          width={CANVAS_WIDTH}
          height={CANVAS_HEIGHT}
          className="block cursor-pointer"
        />
      </div>
      <div className="mt-6 text-white/50 text-sm flex gap-4">
        <span><kbd className="bg-white/10 px-2 py-1 rounded">D F J K</kbd> to play with keyboard</span>
        <span>or <kbd className="bg-white/10 px-2 py-1 rounded">Click</kbd> the tiles</span>
      </div>
    </div>
  );
}
