"use client";

import { Canvas } from "@react-three/fiber";
import { Physics } from "@react-three/rapier";
import { Suspense, useState } from "react";
import { Loader, KeyboardControls } from "@react-three/drei";
import { ArenaMap } from "@/components/game/arena/ArenaMap";
import { Gladiator } from "@/components/game/arena/Gladiator";
import { WeaponUI } from "@/components/game/arena/WeaponUI";

export default function XakArenaPage() {
  const [activeWeapon, setActiveWeapon] = useState<"gun" | "melee" | "wand">("gun");

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
              <Gladiator activeWeapon={activeWeapon} position={[0, 5, 0]} />
            </Physics>
          </Suspense>
        </Canvas>
      </KeyboardControls>
      
      <Loader />
      
      {/* HUD Overlay */}
      <WeaponUI activeWeapon={activeWeapon} setActiveWeapon={setActiveWeapon} />
    </div>
  );
}
