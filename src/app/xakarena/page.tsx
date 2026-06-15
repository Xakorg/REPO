"use client";

import { Canvas } from "@react-three/fiber";
import { Physics } from "@react-three/rapier";
import { Suspense, useState, useRef } from "react";
import * as THREE from "three";
import { Loader, KeyboardControls } from "@react-three/drei";
import { ArenaMap } from "@/components/game/arena/ArenaMap";
import { Gladiator } from "@/components/game/arena/Gladiator";
import { WeaponUI } from "@/components/game/arena/WeaponUI";
import { LobbyUI } from "@/components/game/arena/LobbyUI";
import { FriendsSidebar } from "@/components/game/arena/FriendsSidebar";
import { ArenaSplitscreen } from "@/components/game/arena/ArenaSplitscreen";

export default function XakArenaPage() {
  const [activeWeapon, setActiveWeapon] = useState<"gun" | "melee" | "wand">("gun");
  const [gameState, setGameState] = useState<"lobby" | "playing">("lobby");
  const [gameMode, setGameMode] = useState("Free For All");

  // Splitscreen Setup
  const isSplitscreen = gameMode.includes("2v2") || gameMode.includes("1v1"); // trigger local splitscreen
  
  const player1Ref = useRef<any>(null);
  const player2Ref = useRef<any>(null);
  const [camera1, setCamera1] = useState<THREE.PerspectiveCamera | null>(null);
  const [camera2, setCamera2] = useState<THREE.PerspectiveCamera | null>(null);

  // Health State tracking for HUD
  const [hp1, setHp1] = useState(100);
  const [hp2, setHp2] = useState(100);

  return (
    <div className="w-full h-screen bg-[#111] overflow-hidden relative font-sans">
      <KeyboardControls
        map={[
          { name: "forward", keys: ["ArrowUp", "w", "W"] },
          { name: "backward", keys: ["ArrowDown", "s", "S"] },
          { name: "left", keys: ["ArrowLeft", "a", "A"] },
          { name: "right", keys: ["ArrowRight", "d", "D"] },
          { name: "jump", keys: ["Space"] },
          { name: "shoot", keys: ["Click", "Enter"] },
        ]}
      >
        <Canvas shadows camera={{ position: [0, 5, 10], fov: 60 }}>
          <color attach="background" args={["#111"]} />
          <fog attach="fog" args={["#111", 10, 50]} />
          
          <ambientLight intensity={0.4} />
          <directionalLight
            castShadow
            position={[10, 20, 10]}
            intensity={1.5}
            shadow-mapSize={[2048, 2048]}
          >
            <orthographicCamera attach="shadow-camera" args={[-30, 30, 30, -30]} />
          </directionalLight>

          <Suspense fallback={null}>
            <Physics debug={false} gravity={[0, -20, 0]}>
              <ArenaMap />
              
              {!isSplitscreen ? (
                 <Gladiator activeWeapon={activeWeapon} position={[0, 5, 0]} gameState={gameState} inputType="mouse" onHealthChange={setHp1} />
              ) : (
                 <>
                   {gameState === "playing" && (
                      <ArenaSplitscreen 
                        player1Ref={player1Ref} 
                        player2Ref={player2Ref} 
                        setCamera1={setCamera1 as any} 
                        setCamera2={setCamera2 as any} 
                      />
                   )}
                   <Gladiator 
                     innerRef={player1Ref} 
                     activeWeapon={activeWeapon} 
                     position={[-5, 5, 0]} 
                     gameState={gameState} 
                     inputType={gameState === "lobby" ? "mouse" : "keyboard_p1"} 
                     customCamera={camera1 || undefined}
                     playerIndex={1}
                     colorOffset={0} // Blueish default
                     onHealthChange={setHp1}
                   />
                   {gameState === "playing" && (
                     <Gladiator 
                       innerRef={player2Ref} 
                       activeWeapon={activeWeapon} 
                       position={[5, 5, 0]} 
                       gameState={gameState} 
                       inputType="keyboard_p2" 
                       customCamera={camera2 || undefined}
                       playerIndex={2}
                       colorOffset={-0.3} // Reddish
                       onHealthChange={setHp2}
                     />
                   )}
                 </>
              )}
            </Physics>
          </Suspense>
        </Canvas>
      </KeyboardControls>
      
      <Loader />
      
      {/* HUD & UI Overlays */}
      {gameState === "playing" && (
        <>
          <WeaponUI activeWeapon={activeWeapon} setActiveWeapon={setActiveWeapon} />
          
          {/* Health HUD */}
          <div className="absolute top-8 left-8 flex flex-col gap-2 pointer-events-none w-64">
             <div className="text-white font-black italic uppercase tracking-widest flex justify-between">
                <span>P1 Integrity</span>
                <span className="text-sky-400">{hp1}%</span>
             </div>
             <div className="h-3 bg-black/50 border border-white/20 rounded overflow-hidden">
                <div className="h-full bg-sky-500 transition-all duration-300" style={{ width: `${hp1}%` }} />
             </div>
          </div>

          {isSplitscreen && (
             <div className="absolute top-8 right-8 flex flex-col gap-2 pointer-events-none w-64 text-right">
                <div className="text-white font-black italic uppercase tracking-widest flex justify-between">
                   <span className="text-red-400">{hp2}%</span>
                   <span>P2 Integrity</span>
                </div>
                <div className="h-3 bg-black/50 border border-white/20 rounded overflow-hidden flex justify-end">
                   <div className="h-full bg-red-500 transition-all duration-300" style={{ width: `${hp2}%` }} />
                </div>
             </div>
          )}

          {isSplitscreen && (
             <div className="absolute top-4 left-1/2 -translate-x-1/2 text-white/50 text-xs font-bold uppercase tracking-widest text-center pointer-events-none bg-black/50 backdrop-blur-md px-4 py-2 rounded-full border border-white/10">
               P1: WASD+Q/E to rotate, F to fire &nbsp;&bull;&nbsp; P2: Arrows+U/O to rotate, L to fire
             </div>
          )}
        </>
      )}
      
      {gameState === "lobby" && (
        <LobbyUI setGameState={setGameState} gameMode={gameMode} setGameMode={setGameMode} />
      )}
      
      {gameState === "lobby" && <FriendsSidebar />}
    </div>
  );
}
