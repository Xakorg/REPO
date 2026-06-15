"use client";

import { Canvas } from "@react-three/fiber";
import { Physics } from "@react-three/rapier";
import { Suspense, useState, useRef, useEffect } from "react";
import { Loader, Sparkles } from "@react-three/drei";
import { Pitch } from "@/components/game/Pitch";
import { Ball } from "@/components/game/Ball";
import { Player } from "@/components/game/Player";
import { SplitscreenCamera } from "@/components/game/sports/SplitscreenCamera";
import { Goal } from "@/components/game/sports/Goal";
import { SportsLobby } from "@/components/game/sports/SportsLobby";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { useMultiplayer } from "@/hooks/useMultiplayer";

export default function XakSportsGame() {
  const [gameState, setGameState] = useState<"lobby" | "playing">("lobby");
  const [gameMode, setGameMode] = useState("2 Player Local");
  const [score, setScore] = useState({ p1: 0, p2: 0 });
  const [goalEvent, setGoalEvent] = useState<1 | 2 | null>(null);

  const player1Ref = useRef<any>(null);
  const player2Ref = useRef<any>(null);
  const player3Ref = useRef<any>(null);
  const player4Ref = useRef<any>(null);

  const isOnline = gameMode === "Online Multiplayer";
  const numLocalPlayers = gameMode.startsWith("2") ? 2 : gameMode.startsWith("3") ? 3 : gameMode.startsWith("4") ? 4 : 1;
  const { peers, updateLocalState, myId } = useMultiplayer("xaksports-public", isOnline && gameState === "playing");

  const playerRefs = [player1Ref, player2Ref, player3Ref, player4Ref].slice(0, numLocalPlayers);

  const handleScore = (team: 1 | 2) => {
    if (goalEvent !== null) return; // Prevent multiple triggers
    setScore(prev => ({ ...prev, [`p${team}`]: prev[`p${team}` as keyof typeof prev] + 1 }));
    setGoalEvent(team);
    
    // Reset after 3 seconds
    setTimeout(() => {
      setGoalEvent(null);
      // We would ideally reset rigidbodies here too!
    }, 3000);
  };

  return (
    <div className="w-full h-full bg-[#87CEEB] overflow-hidden relative">
      
      {gameState === "lobby" && (
        <SportsLobby setGameState={setGameState} gameMode={gameMode} setGameMode={setGameMode} />
      )}

      <Canvas shadows camera={{ position: [0, 15, 20], fov: 45 }}>
        <ambientLight intensity={0.5} />
        <directionalLight
          castShadow
          position={[10, 20, 10]}
          intensity={1.5}
          shadow-mapSize={[2048, 2048]}
        >
          <orthographicCamera attach="shadow-camera" args={[-20, 20, 20, -20]} />
        </directionalLight>

        <Suspense fallback={null}>
          <Physics debug={false} gravity={[0, -9.81, 0]}>
            <Pitch />
            
            {/* Goals */}
            <Goal position={[0, 0, -20]} team={1} onScore={handleScore} />
            <Goal position={[0, 0, 20]} rotation={[0, Math.PI, 0]} team={2} onScore={handleScore} />
            
            {/* Game Objects */}
            {gameState === "playing" && (
              <>
                <Ball position={[0, 5, 0]} />
                <Player innerRef={player1Ref} position={[0, 1, 5]} playerIndex={1} onUpdateNetwork={isOnline ? updateLocalState : undefined} />
                {numLocalPlayers >= 2 && <Player innerRef={player2Ref} position={[0, 1, -5]} playerIndex={2} />}
                {numLocalPlayers >= 3 && <Player innerRef={player3Ref} position={[5, 1, 5]} playerIndex={3} />}
                {numLocalPlayers >= 4 && <Player innerRef={player4Ref} position={[-5, 1, -5]} playerIndex={4} />}

                {/* Online Peers */}
                {isOnline && Array.from(peers.values()).map(peer => (
                   <mesh key={peer.id} position={[peer.x, peer.y, peer.z]} rotation={[peer.pitch, peer.yaw, 0]}>
                      <boxGeometry args={[1, 2, 1]} />
                      <meshStandardMaterial color="red" />
                   </mesh>
                ))}
              </>
            )}
          </Physics>
        </Suspense>

        {gameState === "playing" && (
           <SplitscreenCamera players={playerRefs} />
        )}
      </Canvas>
      <Loader />
      
      {/* HUD overlay */}
      {gameState === "playing" && (
        <div className="absolute top-4 left-4 right-4 flex justify-between pointer-events-none font-black uppercase italic text-white drop-shadow-[0_0_8px_rgba(0,0,0,0.8)] z-10">
           <div className="text-3xl tracking-tighter text-blue-400">P1 SCORE: {score.p1}</div>
           <div className="text-4xl">XAKSPORTS</div>
           <div className="text-3xl tracking-tighter text-red-400">P2 SCORE: {score.p2}</div>
        </div>
      )}

      {/* Goal Celebration Overlay */}
      <AnimatePresence>
        {goalEvent !== null && (
          <motion.div 
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 1.5, opacity: 0 }}
            transition={{ type: "spring", bounce: 0.6 }}
            className="absolute inset-0 flex items-center justify-center pointer-events-none z-40"
          >
            <div className={cn(
              "text-9xl font-black italic tracking-tighter uppercase drop-shadow-[0_0_30px_rgba(255,255,255,0.8)]",
              goalEvent === 1 ? "text-blue-500" : "text-red-500"
            )}>
              GOAL!!!
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
