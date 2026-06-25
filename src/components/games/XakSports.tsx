"use client";
import { Canvas } from "@react-three/fiber";
import { Physics, RigidBody } from "@react-three/rapier";
import { useState } from "react";

export default function XakSports() {
  const [score, setScore] = useState(0);

  return (
    <div className="w-full h-full relative">
      <div className="absolute top-4 left-4 z-10 bg-black/50 p-4 rounded-xl text-white font-bold backdrop-blur-md">
        XakSports Prototype - Score: {score}
      </div>
      <Canvas camera={{ position: [0, 5, 10], fov: 50 }}>
        <color attach="background" args={["#87CEEB"]} />
        <ambientLight intensity={0.5} />
        <directionalLight position={[10, 10, 5]} intensity={1} castShadow />
        
        <Physics>
          {/* Ground */}
          <RigidBody type="fixed" friction={2}>
            <mesh position={[0, -1, 0]} receiveShadow>
              <boxGeometry args={[20, 1, 20]} />
              <meshStandardMaterial color="#4CAF50" />
            </mesh>
          </RigidBody>

          {/* Sports Ball */}
          <RigidBody colliders="ball" position={[0, 5, 0]} restitution={0.8}>
            <mesh castShadow onClick={() => setScore(s => s + 1)}>
              <sphereGeometry args={[1, 32, 32]} />
              <meshStandardMaterial color="#FF5722" />
            </mesh>
          </RigidBody>
          
          {/* Goal posts */}
          <RigidBody type="fixed" position={[-3, 1, -5]}>
            <mesh><cylinderGeometry args={[0.2, 0.2, 4]}/><meshStandardMaterial color="white"/></mesh>
          </RigidBody>
          <RigidBody type="fixed" position={[3, 1, -5]}>
            <mesh><cylinderGeometry args={[0.2, 0.2, 4]}/><meshStandardMaterial color="white"/></mesh>
          </RigidBody>
          <RigidBody type="fixed" position={[0, 3, -5]} rotation={[0, 0, Math.PI/2]}>
            <mesh><cylinderGeometry args={[0.2, 0.2, 6]}/><meshStandardMaterial color="white"/></mesh>
          </RigidBody>
        </Physics>
      </Canvas>
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 bg-black/80 px-6 py-2 rounded-full text-white text-xs tracking-widest uppercase pointer-events-none">
        Click the ball to juggle!
      </div>
    </div>
  );
}
