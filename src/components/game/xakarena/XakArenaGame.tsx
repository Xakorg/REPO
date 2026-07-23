"use client";

import { Canvas } from "@react-three/fiber";
import { useState, useRef } from "react";
import { useFrame } from "@react-three/fiber";

function RotatingEnemy({ position, onClick }: { position: [number, number, number], onClick: () => void }) {
  const meshRef = useRef<any>(null);
  useFrame((state, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.x += delta;
      meshRef.current.rotation.y += delta;
    }
  });
  return (
    <mesh ref={meshRef} position={position} onClick={onClick}>
      <octahedronGeometry args={[1, 0]} />
      <meshStandardMaterial color="red" wireframe />
    </mesh>
  );
}

export default function XakArenaGame() {
  const [score, setScore] = useState(0);
  const [enemies, setEnemies] = useState([[-2, 1, -5], [2, 2, -4], [0, 0, -6]]);

  const hitEnemy = (index: number) => {
    setScore(s => s + 100);
    const newEnemies = [...enemies];
    newEnemies[index] = [(Math.random() - 0.5) * 10, Math.random() * 4, -5 - Math.random() * 5];
    setEnemies(newEnemies);
  };

  return (
    <div className="w-full h-full relative cursor-crosshair">
      <div className="absolute top-4 left-4 z-10 bg-red-500/20 border border-red-500/50 p-4 rounded-xl text-red-500 font-black tracking-widest uppercase">
        SCORE: {score}
      </div>
      <Canvas camera={{ position: [0, 0, 5] }}>
        <color attach="background" args={["#0a0a0a"]} />
        <ambientLight intensity={0.2} />
        <pointLight position={[0, 5, 0]} intensity={2} color="red" />
        
        {/* Floor grid */}
        <gridHelper args={[50, 50, "#ff0000", "#220000"]} position={[0, -2, 0]} />

        {enemies.map((pos, i) => (
          <RotatingEnemy key={i} position={pos as [number, number, number]} onClick={() => hitEnemy(i)} />
        ))}
      </Canvas>
      
      {/* Crosshair */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
        <div className="w-4 h-4 border-2 border-red-500 rounded-full flex items-center justify-center">
          <div className="w-1 h-1 bg-red-500 rounded-full" />
        </div>
      </div>
    </div>
  );
}
