"use client";

import { useParams, useRouter } from "next/navigation";
import { GAMES_DB } from "@/lib/games-db";
import { Loader, ArrowLeft } from "lucide-react";
import { useState, useEffect, Suspense, lazy } from "react";

// --- Bespoke Game Engines ---
import dynamic from "next/dynamic";

const GAME_MAP: Record<string, React.ComponentType<any>> = {
  xaksports:    dynamic(() => import("@/components/games/XakSports")),
  xakarena:     dynamic(() => import("@/components/games/XakArena")),
  retro_engine: dynamic(() => import("@/components/games/RetroEngine")),
  neon_drift:   dynamic(() => import("@/components/games/NeonDrift")),
  pixel_knight: dynamic(() => import("@/components/games/PixelKnight")),
  aim:          dynamic(() => import("@/components/games/AimTrainer")),
  balance:      dynamic(() => import("@/components/games/BalanceBoard")),
  basketball:   dynamic(() => import("@/components/games/Basketball")),
  breaker:      dynamic(() => import("@/components/games/BrickBreaker")),
  bubble:       dynamic(() => import("@/components/games/BubbleShooter")),
  // Batch 2
  clickSpeed:   dynamic(() => import("@/components/games/ClickSpeed")),
  clicker:      dynamic(() => import("@/components/games/IdleClicker")),
  colorMatch:   dynamic(() => import("@/components/games/ColorMatch")),
  connectFour:  dynamic(() => import("@/components/games/ConnectFour")),
  dodge:        dynamic(() => import("@/components/games/DodgeObjects")),
  drawing:      dynamic(() => import("@/components/games/DrawingCanvas")),
  fishing:      dynamic(() => import("@/components/games/FishingGame")),
  flappy:       dynamic(() => import("@/components/games/FlappyBird")),
  football3D:   dynamic(() => import("@/components/games/Football3D")),
  frogger:      dynamic(() => import("@/components/games/Frogger")),
  // Batch 3
  golf:         dynamic(() => import("@/components/games/MiniGolf")),
  gravity:      dynamic(() => import("@/components/games/GravityFlip")),
  invaders:     dynamic(() => import("@/components/games/SpaceInvaders")),
  jump:         dynamic(() => import("@/components/games/InfiniteJump")),
  knife:        dynamic(() => import("@/components/games/KnifeHit")),
  match3:       dynamic(() => import("@/components/games/Match3")),
  math:         dynamic(() => import("@/components/games/MathQuiz")),
  maze:         dynamic(() => import("@/components/games/MazeSolver")),
  memory:       dynamic(() => import("@/components/games/MemoryCards")),
  minesweeper:  dynamic(() => import("@/components/games/Minesweeper")),
  // Batch 4
  paint:        dynamic(() => import("@/components/games/PaintDraw")),
  parking:      dynamic(() => import("@/components/games/CarParking")),
  pinball:      dynamic(() => import("@/components/games/Pinball")),
  plinko:       dynamic(() => import("@/components/games/Plinko")),
  pong:         dynamic(() => import("@/components/games/Pong")),
  rps:          dynamic(() => import("@/components/games/RockPaperScissors")),
  reaction:     dynamic(() => import("@/components/games/ReactionTime")),
  sequence:     dynamic(() => import("@/components/games/MemorySequence")),
  snake:        dynamic(() => import("@/components/games/Snake")),
  spinWheel:    dynamic(() => import("@/components/games/SpinWheel")),
  // Batch 5
  stack:        dynamic(() => import("@/components/games/TowerStacker")),
  sudoku:       dynamic(() => import("@/components/games/Sudoku")),
  tictactoe:    dynamic(() => import("@/components/games/TicTacToe")),
  towerDefense: dynamic(() => import("@/components/games/TowerDefense")),
  trivia:       dynamic(() => import("@/components/games/TriviaQuiz")),
  tunnel3D:     dynamic(() => import("@/components/games/Tunnel3D")),
  twoZeroFourEight: dynamic(() => import("@/components/games/Game2048")),
  typing:       dynamic(() => import("@/components/games/TypingTest")),
  whack:        dynamic(() => import("@/components/games/WhackAMole")),
  word:         dynamic(() => import("@/components/games/WordSearch")),
  xbr:          dynamic(() => import("@/components/games/XBRArena")),
};

export default function GamePlayerPage() {
  const params = useParams();
  const router = useRouter();
  const gameId = params?.id as string;
  const game = GAMES_DB.find(g => g.id === gameId);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 1200);
    return () => clearTimeout(t);
  }, []);

  if (!game) return <div className="p-20 text-white font-sans text-center">Game Not Found.</div>;

  const GameComponent = GAME_MAP[gameId];

  return (
    <div className="w-full h-screen bg-black overflow-hidden relative font-sans text-white">
      {loading && (
        <div className="absolute inset-0 z-50 bg-zinc-900 flex flex-col items-center justify-center">
          <div className="w-20 h-20 rounded-2xl bg-black border border-white/10 mb-8 overflow-hidden">
            <img src={game.iconUrl} alt="Icon" className="w-full h-full" />
          </div>
          <Loader className="w-8 h-8 animate-spin text-white/50 mb-4" />
          <h2 className="text-xl font-bold tracking-widest uppercase">Initializing Engine...</h2>
          <p className="text-xs text-white/40 mt-2">Loading {game.type} Core for {game.title}</p>
        </div>
      )}

      <div className="absolute top-0 left-0 right-0 p-4 flex justify-between z-10 bg-gradient-to-b from-black/80 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300">
        <button onClick={() => router.push('/games')} className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-full font-bold hover:bg-white hover:text-black transition-colors">
          <ArrowLeft className="w-4 h-4" /> Exit
        </button>
        <h1 className="text-xl font-black italic tracking-widest uppercase">{game.title}</h1>
      </div>

      <div className="w-full h-full">
        {!loading && GameComponent && <GameComponent />}
      </div>
    </div>
  );
}
