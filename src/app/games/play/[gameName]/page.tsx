"use client";

import React, { useState, useEffect, useRef } from "react";
import dynamic from "next/dynamic";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Maximize, Minimize, Loader2, Flag, Octagon, MessageSquare, Heart, Star, Share2, Eye } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Card } from "@/components/ui/card";

// Helper mapping to translate ID to component name
function getGameComponent(id: string) {
  const mapping: Record<string, string> = {
    aim: "AimGame", balance: "BalanceGame", basketball: "BasketballGame", breaker: "BreakerGame",
    bubble: "BubbleGame", clickSpeed: "ClickSpeedGame", clicker: "ClickerGame", colorMatch: "ColorMatchGame",
    connectFour: "ConnectFourGame", dodge: "DodgeGame", drawing: "DrawingGame", fishing: "FishingGame",
    flappy: "FlappyGame", football3D: "Football3DGame", football: "Football3DGame", frogger: "FroggerGame",
    golf: "GolfGame", gravity: "GravityGame", invaders: "InvadersGame", jump: "JumpGame", knife: "KnifeGame",
    match3: "Match3Game", math: "MathGame", maze: "MazeGame", memory: "MemoryGame", minesweeper: "MinesweeperGame",
    paint: "PaintGame", parking: "ParkingGame", pinball: "PinballGame", plinko: "PlinkoGame", pong: "PongGame",
    rps: "RPSGame", reaction: "ReactionGame", sequence: "SequenceGame", snake: "SnakeGame", spinWheel: "SpinWheelGame",
    stack: "StackGame", sudoku: "SudokuGame", tictactoe: "TicTacToeGame", towerDefense: "TowerDefenseGame",
    trivia: "TriviaGame", tunnel3D: "Tunnel3DGame", twoZeroFourEight: "TwoZeroFourEightGame", typing: "TypingGame",
    whack: "WhackGame", word: "WordGame", xbr: "XbrGame"
  };
  return mapping[id] || (id.charAt(0).toUpperCase() + id.slice(1) + "Game");
}

export default function GamePlayPage() {
  const params = useParams();
  const router = useRouter();
  const gameName = (params.gameName as string) || "";
  const { toast } = useToast();
  
  const [mounted, setMounted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
    const handler = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", handler);
    return () => document.removeEventListener("fullscreenchange", handler);
  }, []);

  const handleToggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {
        toast({ variant: "destructive", title: "Fullscreen failed" });
      });
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false));
    }
  };

  const handleExit = () => {
    router.push("/games");
  };

  if (!mounted) return null;

  const componentName = getGameComponent(gameName);

  // Load game component dynamically
  const GameComponent = dynamic(
    () => import(`../../components/${componentName}`).then(mod => mod[componentName] || mod.default),
    {
      loading: () => (
        <div className="flex flex-col items-center justify-center min-h-[400px] space-y-6 text-white bg-[#0e0e1a]">
          <Loader2 className="w-12 h-12 animate-spin text-[#4d97ff]" />
          <p className="text-sm font-bold text-[#4d97ff]">Loading Blocks...</p>
        </div>
      ),
      ssr: false
    }
  ) as any;

  return (
    <div className="min-h-screen bg-[#0e0e1a] text-white flex flex-col font-sans overflow-y-auto">
      {/* Scratch Header */}
      <header className="h-14 bg-[#4d97ff] flex items-center justify-between px-6 shrink-0 shadow-md z-10">
        <div className="flex items-center gap-6">
          <div className="font-black italic text-2xl tracking-tighter cursor-pointer" onClick={handleExit}>XAKCHAT</div>
          <div className="flex items-center gap-4 text-sm font-bold text-white/90">
            <button className="hover:text-white transition-colors" onClick={handleExit}>Explore</button>
            <button className="hover:text-white transition-colors">Ideas</button>
            <button className="hover:text-white transition-colors">About</button>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Input className="h-8 w-64 rounded-full bg-white/20 border-none text-white placeholder:text-white/60 focus-visible:ring-1 focus-visible:ring-white" placeholder="Search" />
        </div>
      </header>

      {/* Project Header Info */}
      <div className="max-w-6xl w-full mx-auto p-6 flex flex-col md:flex-row gap-6 mt-4">
        
        {/* Left Side: Game Stage */}
        <div className="flex-[2] flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-black">{gameName.charAt(0).toUpperCase() + gameName.slice(1)}</h1>
          </div>

          <div ref={containerRef} className="bg-white rounded-xl shadow-xl border-4 border-[#333] overflow-hidden flex flex-col relative aspect-[4/3] max-h-[600px]">
            {/* Stage Controls */}
            <div className="h-10 bg-[#e0e0e0] flex items-center justify-between px-4 shrink-0 border-b-2 border-[#ccc]">
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => setIsPlaying(true)}
                  className="px-4 py-1 bg-[#4cb715] hover:bg-[#3d9510] text-white font-bold rounded-full transition-colors active:scale-95 shadow-sm border-2 border-white/20"
                >
                  Go
                </button>
                <button 
                  onClick={() => setIsPlaying(false)}
                  className="px-4 py-1 bg-[#ff3333] hover:bg-[#d92a2a] text-white font-bold rounded-full transition-colors active:scale-95 shadow-sm border-2 border-white/20"
                >
                  Stop
                </button>
              </div>
              <button onClick={handleToggleFullscreen} className="text-[#8f8f8f] hover:text-[#555]">
                {isFullscreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
              </button>
            </div>
            
            {/* Stage Canvas */}
            <div className="flex-1 relative bg-[#0e0e1a] flex items-center justify-center overflow-hidden">
              {isPlaying ? (
                <GameComponent onExit={handleExit} />
              ) : (
                <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center z-50">
                  <button 
                    onClick={() => setIsPlaying(true)} 
                    className="px-8 py-3 bg-[#4cb715] hover:bg-[#3d9510] text-white text-xl font-bold rounded-full transition-transform hover:scale-105 active:scale-95 shadow-xl border-4 border-white/20"
                  >
                    Go
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Social Bar */}
          <div className="flex items-center justify-between bg-white/5 rounded-xl p-3 px-6 mt-2">
            <div className="flex items-center gap-6">
              <button className="flex items-center gap-2 text-zinc-400 hover:text-rose-500 font-bold transition-colors">
                <Heart className="w-5 h-5" /> <span>{Math.floor(Math.random() * 1000)}</span>
              </button>
              <button className="flex items-center gap-2 text-zinc-400 hover:text-amber-400 font-bold transition-colors">
                <Star className="w-5 h-5" /> <span>{Math.floor(Math.random() * 500)}</span>
              </button>
              <button className="flex items-center gap-2 text-zinc-400 hover:text-blue-400 font-bold transition-colors">
                <Share2 className="w-5 h-5" /> <span>Share</span>
              </button>
            </div>
            <div className="flex items-center gap-2 text-zinc-400 font-bold text-sm">
              <Eye className="w-5 h-5" /> <span>{Math.floor(Math.random() * 5000) + 1000}</span>
            </div>
          </div>
        </div>

        {/* Right Side: Info */}
        <div className="flex-1 flex flex-col gap-6">
          <Card className="bg-white/5 border-none p-6 space-y-4">
            <h2 className="text-xl font-black uppercase text-[#4d97ff]">Instructions</h2>
            <p className="text-sm text-zinc-300 font-medium leading-relaxed min-h-[100px]">
              Click the Green Flag to start playing! Use the mouse or arrow keys depending on the game. 
              Click the Red Stop Sign at any time to pause and reset the game state.
            </p>
          </Card>
          
          <Card className="bg-white/5 border-none p-6 space-y-4">
            <h2 className="text-xl font-black uppercase text-[#4d97ff]">Notes and Credits</h2>
            <p className="text-sm text-zinc-300 font-medium leading-relaxed min-h-[100px]">
              Created by the XakChat Autonomous Engine. All graphics and logic generated dynamically.
              Remixing is enabled for this project!
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
}
