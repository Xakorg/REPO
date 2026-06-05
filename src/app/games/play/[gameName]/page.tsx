"use client";

import React, { useState, useEffect, useRef } from "react";
import dynamic from "next/dynamic";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { X, Maximize, Minimize, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

// Helper mapping to translate ID to component name
function getGameComponent(id: string) {
  const mapping: Record<string, string> = {
    aim: "AimGame",
    balance: "BalanceGame",
    basketball: "BasketballGame",
    breaker: "BreakerGame",
    bubble: "BubbleGame",
    clickSpeed: "ClickSpeedGame",
    clicker: "ClickerGame",
    colorMatch: "ColorMatchGame",
    connectFour: "ConnectFourGame",
    dodge: "DodgeGame",
    drawing: "DrawingGame",
    fishing: "FishingGame",
    flappy: "FlappyGame",
    football3D: "Football3DGame",
    football: "Football3DGame",
    frogger: "FroggerGame",
    golf: "GolfGame",
    gravity: "GravityGame",
    invaders: "InvadersGame",
    jump: "JumpGame",
    knife: "KnifeGame",
    match3: "Match3Game",
    math: "MathGame",
    maze: "MazeGame",
    memory: "MemoryGame",
    minesweeper: "MinesweeperGame",
    paint: "PaintGame",
    parking: "ParkingGame",
    pinball: "PinballGame",
    plinko: "PlinkoGame",
    pong: "PongGame",
    rps: "RPSGame",
    reaction: "ReactionGame",
    sequence: "SequenceGame",
    snake: "SnakeGame",
    spinWheel: "SpinWheelGame",
    stack: "StackGame",
    sudoku: "SudokuGame",
    tictactoe: "TicTacToeGame",
    towerDefense: "TowerDefenseGame",
    trivia: "TriviaGame",
    tunnel3D: "Tunnel3DGame",
    twoZeroFourEight: "TwoZeroFourEightGame",
    typing: "TypingGame",
    whack: "WhackGame",
    word: "WordGame",
    xbr: "XbrGame"
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
        <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-6 text-white">
          <Loader2 className="w-12 h-12 animate-spin text-primary" />
          <p className="text-sm font-black uppercase tracking-widest text-zinc-500">Loading Game Logic...</p>
        </div>
      ),
      ssr: false
    }
  );

  return (
    <div ref={containerRef} className="fixed inset-0 z-[1000] bg-black overflow-hidden flex flex-col">
      <div className="absolute inset-0 arcade-grid opacity-10 pointer-events-none" />
      <div className="absolute top-10 right-10 z-[1100] flex gap-4">
        <Button 
          size="icon" 
          variant="ghost" 
          onClick={handleToggleFullscreen} 
          className="rounded-full h-16 w-16 bg-black/60 backdrop-blur-xl border-4 border-white/10 hover:bg-primary transition-all shadow-2xl"
        >
          {isFullscreen ? <Minimize className="w-8 h-8 text-white" /> : <Maximize className="w-8 h-8 text-white" />}
        </Button>
        <Button 
          size="icon" 
          variant="ghost" 
          onClick={handleExit} 
          className="rounded-full h-16 w-16 bg-black/60 backdrop-blur-xl border-4 border-white/10 hover:bg-rose-600 transition-all shadow-2xl"
        >
          <X className="w-8 h-8 text-white" />
        </Button>
      </div>
      <div className="flex-1 w-full h-full flex items-center justify-center p-0">
        <GameComponent onExit={handleExit} />
      </div>
    </div>
  );
}
