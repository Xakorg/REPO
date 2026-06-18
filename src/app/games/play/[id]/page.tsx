"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { GAMES_DB } from "@/lib/games-db";
import { Canvas } from "@react-three/fiber";
import { Loader, ArrowLeft } from "lucide-react";

export default function GamePlayerPage() {
  const params = useParams();
  const router = useRouter();
  const gameId = params?.id as string;
  const game = GAMES_DB.find(g => g.id === gameId);

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate engine boot up
    const t = setTimeout(() => setLoading(false), 2000);
    return () => clearTimeout(t);
  }, []);

  if (!game) return <div className="p-20 text-white font-sans text-center">Game Not Found.</div>;

  return (
    <div className="w-full h-screen bg-black overflow-hidden relative font-sans text-white">
      {/* Loading Overlay */}
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

      {/* Game Header */}
      <div className="absolute top-0 left-0 right-0 p-6 flex justify-between z-10 bg-gradient-to-b from-black/80 to-transparent backdrop-blur-sm opacity-0 hover:opacity-100 transition-opacity duration-300">
         <button onClick={() => router.push('/games')} className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-full font-bold hover:bg-white hover:text-black transition-colors">
            <ArrowLeft className="w-4 h-4" /> Exit
         </button>
         <h1 className="text-xl font-black italic tracking-widest uppercase">{game.title}</h1>
      </div>

      {/* The Actual Game Canvas Placeholder */}
      <Canvas className="w-full h-full">
         <color attach="background" args={["#111"]} />
         <ambientLight intensity={0.5} />
         <directionalLight position={[10, 10, 5]} intensity={1} />
         
         {/* Simple bouncing cube to prove the engine is running */}
         <mesh position={[0, 0, 0]} rotation={[0.5, 0.5, 0]}>
            <boxGeometry args={[2, 2, 2]} />
            <meshStandardMaterial color={game.type === "2D Platformer" ? "hotpink" : "cyan"} />
         </mesh>
      </Canvas>

      {/* Overlay Instructions */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 text-white/30 text-xs font-bold uppercase tracking-widest bg-black/50 px-6 py-3 rounded-full backdrop-blur-md pointer-events-none">
         {game.title} - Engine Sandbox Running
      </div>
    </div>
  );
}
