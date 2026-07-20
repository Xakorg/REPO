"use client";
import { useEffect, useRef, useState } from "react";

const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 600;

export default function SpaceRocks() {
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

    const keys = { w: false, a: false, d: false, space: false };

    let ship = {
      x: CANVAS_WIDTH / 2,
      y: CANVAS_HEIGHT / 2,
      a: -Math.PI / 2,
      r: 15,
      xv: 0,
      yv: 0,
      canShoot: true
    };

    let lasers: { x: number; y: number; xv: number; yv: number; dist: number }[] = [];
    let asteroids: { x: number; y: number; xv: number; yv: number; r: number; a: number; vert: number; offs: number[] }[] = [];

    function createAsteroid(x: number, y: number, r: number) {
      const vert = Math.floor(Math.random() * 5) + 5; // 5 to 9 vertices
      const offs = [];
      for (let i = 0; i < vert; i++) {
        offs.push(Math.random() * 0.4 + 0.8);
      }
      asteroids.push({
        x, y,
        xv: (Math.random() * 2 - 1) * (50 / r), // smaller = faster
        yv: (Math.random() * 2 - 1) * (50 / r),
        r,
        a: Math.random() * Math.PI * 2,
        vert,
        offs
      });
    }

    function reset() {
      ship = { x: CANVAS_WIDTH / 2, y: CANVAS_HEIGHT / 2, a: -Math.PI / 2, r: 15, xv: 0, yv: 0, canShoot: true };
      lasers = [];
      asteroids = [];
      localScore = 0;
      setScore(0);
      isGameOver = false;
      setGameOver(false);
      for (let i = 0; i < 5; i++) {
        let ax, ay;
        do {
          ax = Math.random() * CANVAS_WIDTH;
          ay = Math.random() * CANVAS_HEIGHT;
        } while (distBetweenPoints(ship.x, ship.y, ax, ay) < 100);
        createAsteroid(ax, ay, 50);
      }
    }

    function distBetweenPoints(x1: number, y1: number, x2: number, y2: number) {
      return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
    }

    function update() {
      if (!started || isGameOver) {
        draw();
        reqId = requestAnimationFrame(update);
        return;
      }

      // Thrust
      if (keys.w) {
        ship.xv += Math.cos(ship.a) * 0.1;
        ship.yv += Math.sin(ship.a) * 0.1;
      } else {
        ship.xv *= 0.99;
        ship.yv *= 0.99;
      }
      
      // Rotate
      if (keys.a) ship.a -= 0.1;
      if (keys.d) ship.a += 0.1;

      // Move Ship
      ship.x += ship.xv;
      ship.y += ship.yv;

      // Screen wrap
      if (ship.x < 0 - ship.r) ship.x = CANVAS_WIDTH + ship.r;
      else if (ship.x > CANVAS_WIDTH + ship.r) ship.x = 0 - ship.r;
      if (ship.y < 0 - ship.r) ship.y = CANVAS_HEIGHT + ship.r;
      else if (ship.y > CANVAS_HEIGHT + ship.r) ship.y = 0 - ship.r;

      // Shoot
      if (keys.space && ship.canShoot) {
        lasers.push({
          x: ship.x + Math.cos(ship.a) * ship.r,
          y: ship.y + Math.sin(ship.a) * ship.r,
          xv: Math.cos(ship.a) * 10,
          yv: Math.sin(ship.a) * 10,
          dist: 0
        });
        ship.canShoot = false;
        setTimeout(() => ship.canShoot = true, 200); // Fire rate
      }

      // Move Lasers
      for (let i = lasers.length - 1; i >= 0; i--) {
        lasers[i].x += lasers[i].xv;
        lasers[i].y += lasers[i].yv;
        lasers[i].dist += Math.sqrt(Math.pow(lasers[i].xv, 2) + Math.pow(lasers[i].yv, 2));

        if (lasers[i].x < 0) lasers[i].x = CANVAS_WIDTH;
        else if (lasers[i].x > CANVAS_WIDTH) lasers[i].x = 0;
        if (lasers[i].y < 0) lasers[i].y = CANVAS_HEIGHT;
        else if (lasers[i].y > CANVAS_HEIGHT) lasers[i].y = 0;

        if (lasers[i].dist > CANVAS_WIDTH * 0.8) {
          lasers.splice(i, 1);
          continue;
        }

        // Asteroid collision
        let laserHit = false;
        for (let j = asteroids.length - 1; j >= 0; j--) {
          if (distBetweenPoints(asteroids[j].x, asteroids[j].y, lasers[i].x, lasers[i].y) < asteroids[j].r) {
            laserHit = true;
            localScore += (asteroids[j].r === 50) ? 20 : (asteroids[j].r === 25) ? 50 : 100;
            setScore(localScore);
            
            if (asteroids[j].r > 20) {
              createAsteroid(asteroids[j].x, asteroids[j].y, asteroids[j].r / 2);
              createAsteroid(asteroids[j].x, asteroids[j].y, asteroids[j].r / 2);
            }
            asteroids.splice(j, 1);
            break;
          }
        }
        if (laserHit) {
          lasers.splice(i, 1);
        }
      }

      // Level up
      if (asteroids.length === 0) {
        for (let i = 0; i < 5 + (localScore / 1000); i++) {
          let ax, ay;
          do {
            ax = Math.random() * CANVAS_WIDTH;
            ay = Math.random() * CANVAS_HEIGHT;
          } while (distBetweenPoints(ship.x, ship.y, ax, ay) < 100);
          createAsteroid(ax, ay, 50);
        }
      }

      // Move Asteroids & Ship Collision
      for (let i = 0; i < asteroids.length; i++) {
        asteroids[i].x += asteroids[i].xv;
        asteroids[i].y += asteroids[i].yv;

        if (asteroids[i].x < 0 - asteroids[i].r) asteroids[i].x = CANVAS_WIDTH + asteroids[i].r;
        else if (asteroids[i].x > CANVAS_WIDTH + asteroids[i].r) asteroids[i].x = 0 - asteroids[i].r;
        if (asteroids[i].y < 0 - asteroids[i].r) asteroids[i].y = CANVAS_HEIGHT + asteroids[i].r;
        else if (asteroids[i].y > CANVAS_HEIGHT + asteroids[i].r) asteroids[i].y = 0 - asteroids[i].r;

        if (distBetweenPoints(ship.x, ship.y, asteroids[i].x, asteroids[i].y) < ship.r + asteroids[i].r) {
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

      if (started && !isGameOver) {
        // Ship
        ctx!.strokeStyle = "white";
        ctx!.lineWidth = 2;
        ctx!.beginPath();
        ctx!.moveTo(
          ship.x + (4/3) * ship.r * Math.cos(ship.a),
          ship.y + (4/3) * ship.r * Math.sin(ship.a)
        );
        ctx!.lineTo(
          ship.x - ship.r * ( (2/3) * Math.cos(ship.a) + Math.sin(ship.a) ),
          ship.y - ship.r * ( (2/3) * Math.sin(ship.a) - Math.cos(ship.a) )
        );
        ctx!.lineTo(
          ship.x - ship.r * ( (2/3) * Math.cos(ship.a) - Math.sin(ship.a) ),
          ship.y - ship.r * ( (2/3) * Math.sin(ship.a) + Math.cos(ship.a) )
        );
        ctx!.closePath();
        ctx!.stroke();

        // Thrust flame
        if (keys.w) {
          ctx!.fillStyle = "#f97316";
          ctx!.beginPath();
          ctx!.moveTo(
            ship.x - ship.r * ( (2/3) * Math.cos(ship.a) + 0.5 * Math.sin(ship.a) ),
            ship.y - ship.r * ( (2/3) * Math.sin(ship.a) - 0.5 * Math.cos(ship.a) )
          );
          ctx!.lineTo(
            ship.x - ship.r * ( (5/3) * Math.cos(ship.a) ),
            ship.y - ship.r * ( (5/3) * Math.sin(ship.a) )
          );
          ctx!.lineTo(
            ship.x - ship.r * ( (2/3) * Math.cos(ship.a) - 0.5 * Math.sin(ship.a) ),
            ship.y - ship.r * ( (2/3) * Math.sin(ship.a) + 0.5 * Math.cos(ship.a) )
          );
          ctx!.closePath();
          ctx!.fill();
        }
      }

      // Lasers
      ctx!.fillStyle = "#0ea5e9";
      for (let i = 0; i < lasers.length; i++) {
        ctx!.beginPath();
        ctx!.arc(lasers[i].x, lasers[i].y, 3, 0, Math.PI * 2);
        ctx!.fill();
      }

      // Asteroids
      ctx!.strokeStyle = "#a1a1aa";
      ctx!.lineWidth = 2;
      for (let i = 0; i < asteroids.length; i++) {
        let { x, y, r, a, vert, offs } = asteroids[i];
        ctx!.beginPath();
        for (let j = 0; j < vert; j++) {
          ctx!.lineTo(
            x + r * offs[j] * Math.cos(a + j * Math.PI * 2 / vert),
            y + r * offs[j] * Math.sin(a + j * Math.PI * 2 / vert)
          );
        }
        ctx!.closePath();
        ctx!.stroke();
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
        ctx!.fillText("GAME OVER", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 20);
        ctx!.font = "16px sans-serif";
        ctx!.fillText("Click to Restart", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 20);
      }
    }

    const handleKeyDown = (e: KeyboardEvent) => {
       if (e.key === "w" || e.key === "ArrowUp") keys.w = true;
       if (e.key === "a" || e.key === "ArrowLeft") keys.a = true;
       if (e.key === "d" || e.key === "ArrowRight") keys.d = true;
       if (e.key === " ") keys.space = true;
    };
    
    const handleKeyUp = (e: KeyboardEvent) => {
       if (e.key === "w" || e.key === "ArrowUp") keys.w = false;
       if (e.key === "a" || e.key === "ArrowLeft") keys.a = false;
       if (e.key === "d" || e.key === "ArrowRight") keys.d = false;
       if (e.key === " ") keys.space = false;
    };

    const handleClick = () => {
      if (isGameOver) {
        reset();
      }
      setStarted(true);
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    canvas.addEventListener("click", handleClick);

    reset();
    reqId = requestAnimationFrame(update);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
      canvas.removeEventListener("click", handleClick);
      cancelAnimationFrame(reqId);
    };
  }, [started]);

  return (
    <div className="flex flex-col items-center justify-center p-8 select-none">
      <div className="mb-4 text-white text-2xl font-black tracking-widest uppercase">
        Score: {score}
      </div>
      <div className="relative rounded-xl overflow-hidden shadow-[0_0_50px_rgba(255,255,255,0.1)] ring-4 ring-white/10">
        <canvas
          ref={canvasRef}
          width={CANVAS_WIDTH}
          height={CANVAS_HEIGHT}
          className="bg-zinc-950 block"
        />
      </div>
      <div className="mt-6 text-white/50 text-sm flex gap-4">
        <span><kbd className="bg-white/10 px-2 py-1 rounded">W</kbd> Thrust</span>
        <span><kbd className="bg-white/10 px-2 py-1 rounded">A D</kbd> Rotate</span>
        <span><kbd className="bg-white/10 px-2 py-1 rounded">Space</kbd> Shoot</span>
      </div>
    </div>
  );
}
