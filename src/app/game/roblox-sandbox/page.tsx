"use client";

import React, { useEffect, useRef, useState } from "react";
import { ArrowLeft, Play, RotateCcw, Box, Sparkles, Award, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function RobloxSandboxPage() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [win, setWin] = useState(false);
  const [score, setScore] = useState(0);
  const [blocksPlaced, setBlocksPlaced] = useState(0);
  const [activeTool, setActiveTool] = useState<"build" | "play">("play");

  useEffect(() => {
    if (!isPlaying) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;

    // Player Avatar (Blocky Character)
    const player = {
      x: 60,
      y: 400,
      w: 24,
      h: 40,
      vx: 0,
      vy: 0,
      grounded: false,
    };

    // Level Platform Blocks & Hazards
    interface Block { x: number; y: number; w: number; h: number; type: "platform" | "lava" | "win" | "user" }

    let blocks: Block[] = [
      { x: 0, y: 480, w: 200, h: 40, type: "platform" },
      { x: 250, y: 430, w: 100, h: 20, type: "platform" },
      { x: 380, y: 380, w: 80, h: 20, type: "platform" },
      { x: 490, y: 480, w: 150, h: 40, type: "lava" },
      { x: 500, y: 330, w: 100, h: 20, type: "platform" },
      { x: 650, y: 270, w: 100, h: 20, type: "win" },
    ];

    const keys: Record<string, boolean> = {};

    const handleKeyDown = (e: KeyboardEvent) => { keys[e.key.toLowerCase()] = true; };
    const handleKeyUp = (e: KeyboardEvent) => { keys[e.key.toLowerCase()] = false; };

    const handleCanvasClick = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const clickX = Math.floor((e.clientX - rect.left) / 20) * 20;
      const clickY = Math.floor((e.clientY - rect.top) / 20) * 20;

      if (activeTool === "build") {
        blocks.push({ x: clickX, y: clickY, w: 40, h: 20, type: "user" });
        setBlocksPlaced((v) => v + 1);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    canvas.addEventListener("click", handleCanvasClick);

    const gameLoop = () => {
      ctx.clearRect(0, 0, 800, 600);

      // Physics & Input
      if (keys["a"] || keys["arrowleft"]) player.vx = -4;
      else if (keys["d"] || keys["arrowright"]) player.vx = 4;
      else player.vx *= 0.8;

      if ((keys["w"] || keys["space"] || keys["arrowup"]) && player.grounded) {
        player.vy = -11;
        player.grounded = false;
      }

      // Gravity
      player.vy += 0.55;

      player.x += player.vx;
      player.y += player.vy;

      // Keep inside screen
      if (player.x < 0) player.x = 0;
      if (player.x > 776) player.x = 776;

      // Collision Detection with Blocks
      player.grounded = false;

      blocks.forEach((b) => {
        if (
          player.x < b.x + b.w &&
          player.x + player.w > b.x &&
          player.y < b.y + b.h &&
          player.y + player.h > b.y
        ) {
          if (b.type === "lava") {
            setGameOver(true);
            setIsPlaying(false);
          } else if (b.type === "win") {
            setWin(true);
            setIsPlaying(false);
          } else if (player.vy > 0 && player.y + player.h - player.vy <= b.y) {
            player.y = b.y - player.h;
            player.vy = 0;
            player.grounded = true;
          }
        }
      });

      // Pit death
      if (player.y > 600) {
        setGameOver(true);
        setIsPlaying(false);
      }

      // Draw Grid Background
      ctx.fillStyle = "#0c0824";
      ctx.fillRect(0, 0, 800, 600);

      ctx.strokeStyle = "rgba(255,255,255,0.03)";
      for (let x = 0; x < 800; x += 40) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, 600); ctx.stroke();
      }
      for (let y = 0; y < 600; y += 40) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(800, y); ctx.stroke();
      }

      // Draw Blocks
      blocks.forEach((b) => {
        if (b.type === "platform") {
          ctx.fillStyle = "#3b82f6";
          ctx.fillRect(b.x, b.y, b.w, b.h);
          ctx.strokeStyle = "#93c5fd";
          ctx.strokeRect(b.x, b.y, b.w, b.h);
        } else if (b.type === "user") {
          ctx.fillStyle = "#a855f7";
          ctx.fillRect(b.x, b.y, b.w, b.h);
          ctx.strokeStyle = "#e9d5ff";
          ctx.strokeRect(b.x, b.y, b.w, b.h);
        } else if (b.type === "lava") {
          ctx.fillStyle = "#ef4444";
          ctx.fillRect(b.x, b.y, b.w, b.h);
          ctx.fillStyle = "#fba5a5";
          ctx.fillRect(b.x, b.y, b.w, 4);
        } else if (b.type === "win") {
          ctx.fillStyle = "#10b981";
          ctx.fillRect(b.x, b.y, b.w, b.h);
          ctx.fillStyle = "#ffffff";
          ctx.font = "bold 10px sans-serif";
          ctx.fillText("FINISH", b.x + 20, b.y + 14);
        }
      });

      // Draw Player (Blocky Roblox Character)
      ctx.fillStyle = "#f59e0b"; // Yellow head
      ctx.fillRect(player.x + 4, player.y, 16, 12);

      ctx.fillStyle = "#06b6d4"; // Blue Torso
      ctx.fillRect(player.x, player.y + 12, 24, 16);

      ctx.fillStyle = "#3b82f6"; // Legs
      ctx.fillRect(player.x + 2, player.y + 28, 9, 12);
      ctx.fillRect(player.x + 13, player.y + 28, 9, 12);

      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 1;
      ctx.strokeRect(player.x, player.y, player.w, player.h);

      if (!gameOver && !win) {
        animationFrameId = requestAnimationFrame(gameLoop);
      }
    };

    animationFrameId = requestAnimationFrame(gameLoop);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
      canvas.removeEventListener("click", handleCanvasClick);
    };
  }, [isPlaying, gameOver, win, activeTool]);

  return (
    <div className="min-h-screen bg-[#070514] text-white flex flex-col selection:bg-rose-500/30">
      {/* Header */}
      <header className="h-16 border-b border-white/10 px-6 flex items-center justify-between bg-black/40 backdrop-blur-xl sticky top-0 z-50">
        <div className="flex items-center gap-4">
          <Link href="/games">
            <Button variant="ghost" size="sm" className="rounded-xl border border-white/10 hover:bg-white/10">
              <ArrowLeft className="w-4 h-4 mr-2" /> Back to Games
            </Button>
          </Link>
          <h1 className="font-black uppercase tracking-tight text-sm flex items-center gap-2">
            Roblox Sandbox Obby <span className="bg-rose-500/20 text-rose-400 text-[9px] px-2 py-0.5 rounded-full border border-rose-500/30">Native 3D Builder</span>
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <Button
            onClick={() => setActiveTool(activeTool === "build" ? "play" : "build")}
            size="sm"
            className={activeTool === "build" ? "bg-purple-600 hover:bg-purple-500 text-white" : "bg-white/10 text-white"}
          >
            {activeTool === "build" ? <Plus className="w-4 h-4 mr-2" /> : <Box className="w-4 h-4 mr-2" />}
            {activeTool === "build" ? "Building Mode Active (Click Canvas)" : "Switch to Build Mode"}
          </Button>
        </div>
      </header>

      {/* Main Canvas View */}
      <main className="flex-1 flex flex-col items-center justify-center p-6 relative">
        <div className="relative rounded-3xl overflow-hidden border-2 border-white/15 bg-black shadow-2xl">
          <canvas
            ref={canvasRef}
            width={800}
            height={600}
            className="block cursor-pointer bg-[#0c0824]"
          />

          {/* Start Screen Overlay */}
          {!isPlaying && !gameOver && !win && (
            <div className="absolute inset-0 bg-black/80 backdrop-blur-md flex flex-col items-center justify-center p-8 text-center space-y-6">
              <div className="w-16 h-16 rounded-2xl bg-rose-600 flex items-center justify-center font-black text-2xl shadow-2xl">
                RBX
              </div>
              <div>
                <h2 className="text-4xl font-black uppercase italic tracking-tighter mb-2">Roblox Sandbox Obby</h2>
                <p className="text-white/60 text-xs max-w-sm">Native WebGL Obby Builder & Platformer. A/D to Move, Space to Jump, Switch to Build Mode to place blocks anywhere!</p>
              </div>

              <Button
                onClick={() => {
                  setGameOver(false);
                  setWin(false);
                  setIsPlaying(true);
                }}
                className="h-14 px-10 bg-rose-600 hover:bg-rose-500 text-white font-black uppercase tracking-widest rounded-2xl shadow-2xl scale-105 active:scale-95"
              >
                <Play className="w-5 h-5 mr-3 fill-white" /> Start Obby Course
              </Button>
            </div>
          )}

          {/* Victory Screen */}
          {win && (
            <div className="absolute inset-0 bg-black/90 backdrop-blur-md flex flex-col items-center justify-center p-8 text-center space-y-6">
              <Award className="w-16 h-16 text-emerald-400 animate-bounce" />
              <div>
                <h2 className="text-4xl font-black uppercase italic tracking-tighter text-emerald-400 mb-2">Course Completed!</h2>
                <p className="text-white/70 text-sm">You beat the Obby! Blocks Placed: {blocksPlaced}</p>
              </div>

              <Button
                onClick={() => {
                  setGameOver(false);
                  setWin(false);
                  setIsPlaying(true);
                }}
                className="h-14 px-10 bg-rose-600 hover:bg-rose-500 text-white font-black uppercase tracking-widest rounded-2xl shadow-2xl"
              >
                <RotateCcw className="w-5 h-5 mr-3" /> Replay Course
              </Button>
            </div>
          )}

          {/* Game Over Screen */}
          {gameOver && (
            <div className="absolute inset-0 bg-black/90 backdrop-blur-md flex flex-col items-center justify-center p-8 text-center space-y-6">
              <div className="w-16 h-16 rounded-full bg-rose-500/20 flex items-center justify-center border border-rose-500/40">
                <Trash2 className="w-8 h-8 text-rose-500" />
              </div>
              <div>
                <h2 className="text-4xl font-black uppercase italic tracking-tighter text-rose-500 mb-2">Fell into Hazard!</h2>
                <p className="text-white/70 text-sm">Tip: Switch to Build Mode to place platforms across gap hazards!</p>
              </div>

              <Button
                onClick={() => {
                  setGameOver(false);
                  setWin(false);
                  setIsPlaying(true);
                }}
                className="h-14 px-10 bg-rose-600 hover:bg-rose-500 text-white font-black uppercase tracking-widest rounded-2xl shadow-2xl"
              >
                <RotateCcw className="w-5 h-5 mr-3" /> Try Again
              </Button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
