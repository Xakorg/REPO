"use client";
import { Canvas, useFrame } from "@react-three/fiber";
import { Physics, RigidBody } from "@react-three/rapier";
import { useRef, useState } from "react";
import * as THREE from "three";

function Ball({ onGoal }: { onGoal: () => void }) {
  const ref = useRef<any>(null);
  const kicked = useRef(false);

  useFrame(() => {
    if (!ref.current) return;
    const pos = ref.current.translation();
    if (pos.z < -18 && Math.abs(pos.x) < 4 && pos.y < 4 && !kicked.current) {
      kicked.current = true;
      onGoal();
    }
    if (pos.y < -5) {
      ref.current.setTranslation({ x: 0, y: 1, z: 5 }, true);
      ref.current.setLinvel({ x: 0, y: 0, z: 0 }, true);
      kicked.current = false;
    }
  });

  return (
    <RigidBody ref={ref} colliders="ball" position={[0, 1, 5]} restitution={0.5}>
      <mesh castShadow onClick={() => {
        if (ref.current && !kicked.current) {
          ref.current.applyImpulse({ x: (Math.random() - 0.5) * 5, y: 8, z: -25 }, true);
        }
      }}>
        <sphereGeometry args={[0.8, 32, 32]} />
        <meshStandardMaterial color="white" roughness={0.5} />
      </mesh>
    </RigidBody>
  );
}

export default function Football3D() {
  const [score, setScore] = useState(0);

  return (
    <div className="w-full h-full relative">
      <div className="absolute top-4 left-4 z-10 bg-black/50 p-4 rounded-xl text-white font-black text-xl backdrop-blur-md">
        ⚽ Goals: {score}
      </div>
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 bg-black/50 px-6 py-2 rounded-full text-white text-xs uppercase tracking-widest backdrop-blur-md">
        Click the ball to kick toward goal!
      </div>
      <Canvas camera={{ position: [0, 8, 15], fov: 55 }} shadows>
        <color attach="background" args={["#87CEEB"]} />
        <ambientLight intensity={0.4} />
        <directionalLight position={[10, 20, 5]} intensity={1.5} castShadow />
        <Physics gravity={[0, -15, 0]}>
          {/* Ground */}
          <RigidBody type="fixed" friction={0.8}>
            <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
              <planeGeometry args={[30, 40]} />
              <meshStandardMaterial color="#4CAF50" />
            </mesh>
          </RigidBody>
          {/* Goal Posts */}
          {[[-4, 2, -20], [4, 2, -20]].map((p, i) => (
            <RigidBody key={i} type="fixed" position={p as [number, number, number]}>
              <mesh><cylinderGeometry args={[0.15, 0.15, 4]} /><meshStandardMaterial color="white" /></mesh>
            </RigidBody>
          ))}
          <RigidBody type="fixed" position={[0, 3.9, -20]} rotation={[0, 0, Math.PI / 2]}>
            <mesh><cylinderGeometry args={[0.15, 0.15, 8.3]} /><meshStandardMaterial color="white" /></mesh>
          </RigidBody>
          <Ball onGoal={() => setScore(s => s + 1)} />
        </Physics>
      </Canvas>
    </div>
  );
}
