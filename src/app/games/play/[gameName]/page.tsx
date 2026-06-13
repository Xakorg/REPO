"use client";

import React, { useState, useEffect, useRef } from "react";
import dynamic from "next/dynamic";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Maximize, Minimize, Loader2, Flag, Octagon, MessageSquare, Heart, Star, Share2, Eye } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useFirestore, useDoc } from "@/firebase";
import { doc } from "firebase/firestore";

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

  const firestore = useFirestore();
  const isBuiltIn = ['aim', 'balance', 'basketball', 'breaker', 'bubble', 'clickSpeed', 'clicker', 'colorMatch', 'connectFour', 'dodge', 'drawing', 'fishing', 'flappy', 'football3D', 'football', 'frogger', 'golf', 'gravity', 'invaders', 'jump', 'knife', 'match3', 'math', 'maze', 'memory', 'minesweeper', 'paint', 'parking', 'pinball', 'plinko', 'pong', 'rps', 'reaction', 'sequence', 'snake', 'spinWheel', 'stack', 'sudoku', 'tictactoe', 'towerDefense', 'trivia', 'tunnel3D', 'twoZeroFourEight', 'typing', 'whack', 'word', 'xbr'].includes(gameName);

  const { data: communityGame, isLoading: isLoadingCommunityGame } = useDoc(
    !isBuiltIn && firestore ? doc(firestore, "publishedProjects", gameName) : null
  );

  // Load game component dynamically
  const GameComponent = React.useMemo(() => {
    if (!isBuiltIn) return null;
    const componentName = getGameComponent(gameName);
    return dynamic(
      () => import(`../../components/${componentName}`).then(mod => mod[componentName] || mod.default).catch(() => () => <div className="text-white">Game Not Found</div>),
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
  }, [gameName, isBuiltIn]);

  return (
    <div className="min-h-screen bg-[#0e0e1a] text-white flex flex-col font-sans overflow-y-auto">
      {/* Scratch Header */}
      <header className="h-14 bg-[#4d97ff] flex items-center justify-between px-6 shrink-0 shadow-md z-10">
        <div className="flex items-center gap-6">
          <div className="font-black italic text-2xl tracking-tighter cursor-pointer" onClick={handleExit}>GAMES</div>
          <div className="flex items-center gap-4 text-sm font-bold text-white/90">
            <button className="hover:text-white transition-colors" onClick={handleExit}>Explore</button>
            <button className="hover:text-white transition-colors" onClick={() => router.push('/games/studio')}>Games Studio</button>
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
              {isLoadingCommunityGame ? (
                <Loader2 className="w-12 h-12 animate-spin text-primary" />
              ) : isBuiltIn && GameComponent ? (
                <GameComponent onExit={handleExit} isPlaying={isPlaying} />
              ) : communityGame ? (
                isPlaying ? (
                  <iframe srcDoc={communityGame.files?.find((f: any) => f.name === 'index.html')?.content || "No index.html found"} className="w-full h-full border-none" sandbox="allow-scripts allow-same-origin" />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center bg-zinc-900 text-zinc-500">
                    <Flag className="w-16 h-16 mb-4 text-[#4cb715]" />
                    <p className="font-bold uppercase tracking-widest text-sm">Click Go to Start</p>
                  </div>
                )
              ) : (
                <div className="text-white font-bold">Game Not Found</div>
              )}
              
              {!isPlaying && isBuiltIn && (
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
                <Heart className="w-5 h-5" /> <span>{communityGame?.likes || 0}</span>
              </button>
              <button className="flex items-center gap-2 text-zinc-400 hover:text-amber-400 font-bold transition-colors">
                <Star className="w-5 h-5" /> <span>{communityGame?.stars || 0}</span>
              </button>
              <button className="flex items-center gap-2 text-zinc-400 hover:text-blue-400 font-bold transition-colors">
                <Share2 className="w-5 h-5" /> <span>Share</span>
              </button>
            </div>
            <div className="flex items-center gap-2 text-zinc-400 font-bold text-sm">
              <Eye className="w-5 h-5" /> <span>{communityGame?.views || 0}</span>
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
            <h2 className="text-xl font-black uppercase text-[#4d97ff]">Leaderboard</h2>
            <div className="flex flex-col gap-2 min-h-[100px] justify-center items-center text-zinc-500 text-sm font-bold">
              No high scores yet.
            </div>
          </Card>
        </div>
      </div>
      
      {/* Comments Section */}
      <div className="max-w-6xl w-full mx-auto p-6 flex flex-col gap-4 mt-2 mb-10">
        <h2 className="text-2xl font-black uppercase text-[#4cb715]">Comments</h2>
        <div className="bg-white/5 rounded-xl p-4 flex flex-col gap-4">
          <div className="flex gap-4">
            <div className="w-10 h-10 rounded-full bg-white/10 shrink-0"></div>
            <Input className="bg-black/20 border-white/10 text-white flex-1" placeholder="Add a comment..." />
            <Button className="bg-[#4cb715] hover:bg-[#3d9510] font-bold">Post</Button>
          </div>
          <div className="flex flex-col gap-4 mt-4 text-center py-10 text-zinc-500 font-bold text-sm">
            No comments yet. Be the first to comment!
          </div>
        </div>
      </div>
    </div>
  );
}
