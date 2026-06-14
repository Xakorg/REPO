"use client";

import { Canvas } from "@react-three/fiber";
import { Physics } from "@react-three/rapier";
import { Suspense } from "react";
import { Loader } from "@react-three/drei";
import { Pitch } from "@/components/game/Pitch";
import { Ball } from "@/components/game/Ball";
import { Player } from "@/components/game/Player";
import { CameraFollow } from "@/components/game/CameraFollow";

export default function XakSportsGame() {
  return (
    <div className="w-full h-full bg-[#87CEEB] overflow-hidden relative">
      <Canvas shadows camera={{ position: [0, 15, 20], fov: 45 }}>
        <color attach="background" args={["#87CEEB"]} />
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
            <Ball position={[0, 5, 0]} />
            <Player position={[0, 1, 5]} />
          </Physics>
        </Suspense>

        <CameraFollow />
      </Canvas>
      <Loader />
      
      {/* HUD overlay */}
      <div className="absolute top-4 left-4 right-4 flex justify-between pointer-events-none font-black uppercase italic text-white drop-shadow-md">
         <div className="text-2xl tracking-tighter">XakSports</div>
         <div className="text-xl">0 - 0</div>
      </div>
    </div>
  );
}
