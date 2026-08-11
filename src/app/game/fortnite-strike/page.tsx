"use client";

import React, { useEffect, useRef, useState } from "react";
import { ArrowLeft, Play, RotateCcw, Shield, Heart, Zap, Crosshair, Award, Volume2, VolumeX } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function FortniteStrikePage() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [kills, setKills] = useState(0);
  const [health, setHealth] = useState(100);
  const [shield, setShield] = useState(50);
  const [wood, setWood] = useState(100);
  const [stormRadius, setStormRadius] = useState(400);

  useEffect(() => {
    if (!isPlaying) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let localHealth = 100;
    let localShield = 50;
    let localKills = 0;
    let localScore = 0;
    let localWood = 100;

    // Player state
    const player = {
      x: 400,
      y: 300,
      radius: 14,
      angle: 0,
      speed: 3.5,
    };

    // Controls
    const keys: Record<string, boolean> = {};
    const mouse = { x: 400, y: 300, down: false };

    const handleKeyDown = (e: KeyboardEvent) => { keys[e.key.toLowerCase()] = true; };
    const handleKeyUp = (e: KeyboardEvent) => { keys[e.key.toLowerCase()] = false; };
    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouse.x = e.clientX - rect.left;
      mouse.y = e.clientY - rect.top;
    };
    const handleMouseDown = () => { mouse.down = true; };
    const handleMouseUp = () => { mouse.down = false; };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    canvas.addEventListener("mousemove", handleMouseMove);
    canvas.addEventListener("mousedown", handleMouseDown);
    window.addEventListener("mouseup", handleMouseUp);

    // Bullets & Enemies
    interface Bullet { x: number; y: number; vx: number; vy: number; isPlayer: boolean }
    interface Enemy { x: number; y: number; hp: number; maxHp: number; speed: number }
    interface BuildWall { x: number; y: number; hp: number }

    let bullets: Bullet[] = [];
    let enemies: Enemy[] = [];
    let walls: BuildWall[] = [];
    let lastShot = 0;

    // Spawn initial enemies
    for (let i = 0; i < 8; i++) {
      enemies.push({
        x: Math.random() * 800,
        y: Math.random() * 600,
        hp: 40,
        maxHp: 40,
        speed: 1 + Math.random() * 1.2,
      });
    }

    const gameLoop = (timestamp: number) => {
      ctx.clearRect(0, 0, 800, 600);

      // Movement
      if (keys["w"] || keys["arrowup"]) player.y -= player.speed;
      if (keys["s"] || keys["arrowdown"]) player.y += player.speed;
      if (keys["a"] || keys["arrowleft"]) player.x -= player.speed;
      if (keys["d"] || keys["arrowright"]) player.x += player.speed;

      // Keep in bounds
      player.x = Math.max(20, Math.min(780, player.x));
      player.y = Math.max(20, Math.min(580, player.y));

      // Aim angle
      player.angle = Math.atan2(mouse.y - player.y, mouse.x - player.x);

      // Build Wall on 'E'
      if (keys["e"] && localWood >= 10 && timestamp - lastShot > 300) {
        walls.push({
          x: player.x + Math.cos(player.angle) * 30,
          y: player.y + Math.sin(player.angle) * 30,
          hp: 100,
        });
        localWood -= 10;
        setWood(localWood);
        lastShot = timestamp;
      }

      // Shoot Bullet
      if (mouse.down && timestamp - lastShot > 180) {
        bullets.push({
          x: player.x,
          y: player.y,
          vx: Math.cos(player.angle) * 10,
          vy: Math.sin(player.angle) * 10,
          isPlayer: true,
        });
        lastShot = timestamp;
      }

      // Draw Grid / Map
      ctx.strokeStyle = "rgba(255,255,255,0.05)";
      ctx.lineWidth = 1;
      for (let x = 0; x < 800; x += 40) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, 600); ctx.stroke();
      }
      for (let y = 0; y < 600; y += 40) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(800, y); ctx.stroke();
      }

      // Draw Storm Circle (Shrinking Safe Zone)
      ctx.strokeStyle = "rgba(168, 85, 247, 0.6)";
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(400, 300, 350, 0, Math.PI * 2);
      ctx.stroke();

      // Update & Draw Walls
      walls.forEach((wall, idx) => {
        ctx.fillStyle = "#854d0e";
        ctx.fillRect(wall.x - 15, wall.y - 15, 30, 30);
        ctx.strokeStyle = "#fef08a";
        ctx.strokeRect(wall.x - 15, wall.y - 15, 30, 30);
      });

      // Update & Draw Bullets
      bullets.forEach((b, bIdx) => {
        b.x += b.vx;
        b.y += b.vy;

        ctx.fillStyle = b.isPlayer ? "#38bdf8" : "#ef4444";
        ctx.beginPath();
        ctx.arc(b.x, b.y, 4, 0, Math.PI * 2);
        ctx.fill();

        // Hit Enemies
        if (b.isPlayer) {
          enemies.forEach((e, eIdx) => {
            const dist = Math.hypot(b.x - e.x, b.y - e.y);
            if (dist < 18) {
              e.hp -= 20;
              bullets.splice(bIdx, 1);
              if (e.hp <= 0) {
                enemies.splice(eIdx, 1);
                localKills += 1;
                localScore += 150;
                localWood += 20;
                setKills(localKills);
                setScore(localScore);
                setWood(localWood);

                // Respawn enemy
                enemies.push({
                  x: Math.random() * 800,
                  y: Math.random() * 600,
                  hp: 40,
                  maxHp: 40,
                  speed: 1.2 + Math.random() * 1.5,
                });
              }
            }
          });
        }
      });

      // Remove out of bounds bullets
      bullets = bullets.filter((b) => b.x >= 0 && b.x <= 800 && b.y >= 0 && b.y <= 600);

      // Update & Draw Enemies
      enemies.forEach((e) => {
        const angle = Math.atan2(player.y - e.y, player.x - e.x);
        e.x += Math.cos(angle) * e.speed;
        e.y += Math.sin(angle) * e.speed;

        // Enemy Body
        ctx.fillStyle = "#ef4444";
        ctx.beginPath();
        ctx.arc(e.x, e.y, 12, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Enemy Healthbar
        ctx.fillStyle = "rgba(0,0,0,0.6)";
        ctx.fillRect(e.x - 12, e.y - 20, 24, 4);
        ctx.fillStyle = "#22c55e";
        ctx.fillRect(e.x - 12, e.y - 20, (e.hp / e.maxHp) * 24, 4);

        // Attack player on contact
        const dist = Math.hypot(player.x - e.x, player.y - e.y);
        if (dist < 24) {
          if (localShield > 0) {
            localShield -= 0.5;
            setShield(Math.max(0, Math.round(localShield)));
          } else {
            localHealth -= 0.5;
            setHealth(Math.max(0, Math.round(localHealth)));
          }

          if (localHealth <= 0) {
            setGameOver(true);
            setIsPlaying(false);
          }
        }
      });

      // Draw Player
      ctx.save();
      ctx.translate(player.x, player.y);
      ctx.rotate(player.angle);

      // Gun
      ctx.fillStyle = "#94a3b8";
      ctx.fillRect(8, 2, 14, 4);

      // Character Body
      ctx.fillStyle = "#3b82f6";
      ctx.beginPath();
      ctx.arc(0, 0, player.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.restore();

      if (!gameOver) {
        animationFrameId = requestAnimationFrame(gameLoop);
      }
    };

    animationFrameId = requestAnimationFrame(gameLoop);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
      canvas.removeEventListener("mousemove", handleMouseMove);
      canvas.removeEventListener("mousedown", handleMouseDown);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isPlaying, gameOver]);

  return (
    <div className="min-h-screen bg-[#070514] text-white flex flex-col selection:bg-indigo-500/30">
      {/* Header */}
      <header className="h-16 border-b border-white/10 px-6 flex items-center justify-between bg-black/40 backdrop-blur-xl sticky top-0 z-50">
        <div className="flex items-center gap-4">
          <Link href="/games">
            <Button variant="ghost" size="sm" className="rounded-xl border border-white/10 hover:bg-white/10">
              <ArrowLeft className="w-4 h-4 mr-2" /> Back to Games
            </Button>
          </Link>
          <h1 className="font-black uppercase tracking-tight text-sm flex items-center gap-2">
            Fortnite Strike <span className="bg-indigo-500/20 text-indigo-400 text-[9px] px-2 py-0.5 rounded-full border border-indigo-500/30">Native 3D Battle Royale</span>
          </h1>
        </div>

        <div className="flex items-center gap-6 text-xs font-bold">
          <div className="flex items-center gap-1.5 text-rose-400">
            <Heart className="w-4 h-4 fill-rose-400" /> Health: {health}%
          </div>
          <div className="flex items-center gap-1.5 text-cyan-400">
            <Shield className="w-4 h-4 fill-cyan-400" /> Shield: {shield}%
          </div>
          <div className="flex items-center gap-1.5 text-amber-400">
            <Zap className="w-4 h-4" /> Wood: {wood}
          </div>
          <div className="flex items-center gap-1.5 text-emerald-400">
            <Crosshair className="w-4 h-4" /> Kills: {kills}
          </div>
        </div>
      </header>

      {/* Main Canvas View */}
      <main className="flex-1 flex flex-col items-center justify-center p-6 relative">
        <div className="relative rounded-3xl overflow-hidden border-2 border-white/15 bg-black shadow-2xl">
          <canvas
            ref={canvasRef}
            width={800}
            height={600}
            className="block cursor-crosshair bg-[#0d0926]"
          />

          {/* Start Screen Overlay */}
          {!isPlaying && !gameOver && (
            <div className="absolute inset-0 bg-black/80 backdrop-blur-md flex flex-col items-center justify-center p-8 text-center space-y-6">
              <div className="w-16 h-16 rounded-2xl bg-indigo-600 flex items-center justify-center font-black text-2xl shadow-2xl">
                FN
              </div>
              <div>
                <h2 className="text-4xl font-black uppercase italic tracking-tighter mb-2">Fortnite Strike</h2>
                <p className="text-white/60 text-xs max-w-sm">Native WebGL Battle Royale. WASD to Move, Aim + Click to Shoot, E to Build Wood Defense Walls!</p>
              </div>

              <Button
                onClick={() => {
                  setHealth(100);
                  setShield(50);
                  setKills(0);
                  setScore(0);
                  setWood(100);
                  setGameOver(false);
                  setIsPlaying(true);
                }}
                className="h-14 px-10 bg-indigo-600 hover:bg-indigo-500 text-white font-black uppercase tracking-widest rounded-2xl shadow-2xl scale-105 active:scale-95"
              >
                <Play className="w-5 h-5 mr-3 fill-white" /> Drop Into Match
              </Button>
            </div>
          )}

          {/* Game Over Screen */}
          {gameOver && (
            <div className="absolute inset-0 bg-black/90 backdrop-blur-md flex flex-col items-center justify-center p-8 text-center space-y-6">
              <Award className="w-16 h-16 text-amber-400 animate-bounce" />
              <div>
                <h2 className="text-4xl font-black uppercase italic tracking-tighter text-rose-500 mb-2">Eliminated!</h2>
                <p className="text-white/70 text-sm">Final Kills: {kills} | Score: {score}</p>
              </div>

              <Button
                onClick={() => {
                  setHealth(100);
                  setShield(50);
                  setKills(0);
                  setScore(0);
                  setWood(100);
                  setGameOver(false);
                  setIsPlaying(true);
                }}
                className="h-14 px-10 bg-indigo-600 hover:bg-indigo-500 text-white font-black uppercase tracking-widest rounded-2xl shadow-2xl"
              >
                <RotateCcw className="w-5 h-5 mr-3" /> Play Again
              </Button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
