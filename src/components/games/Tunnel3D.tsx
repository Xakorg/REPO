"use client";
import { useFrame, Canvas } from "@react-three/fiber";
import { useRef, useState } from "react";
import * as THREE from "three";

function TunnelScene({ score, setScore }: { score: number; setScore: (s: number) => void }) {
  const speed = useRef(0.15);
  const posX = useRef(0);
  const posY = useRef(0);
  const rings = useRef<{ z: number; x: number; y: number; color: string }[]>(
    Array.from({ length: 20 }, (_, i) => ({
      z: -i * 8,
      x: (Math.random() - 0.5) * 3,
      y: (Math.random() - 0.5) * 3,
      color: `hsl(${i * 18}, 80%, 60%)`,
    }))
  );
  const scoreRef = useRef(0);

  useFrame((state, delta) => {
    speed.current = Math.min(0.5, 0.15 + scoreRef.current * 0.001);

    for (const ring of rings.current) {
      ring.z += speed.current;
      if (ring.z > 5) {
        ring.z = -160;
        ring.x = (Math.random() - 0.5) * 4;
        ring.y = (Math.random() - 0.5) * 4;
        scoreRef.current++;
        setScore(scoreRef.current);
      }
    }

    // Mouse steering
    posX.current += (state.mouse.x * 2 - posX.current) * 0.05;
    posY.current += (state.mouse.y * 2 - posY.current) * 0.05;
    state.camera.position.set(posX.current, posY.current, 0);
  });

  return (
    <>
      <color attach="background" args={["#000"]} />
      <ambientLight intensity={0.2} />
      <pointLight position={[0, 0, 2]} intensity={3} color="white" />
      {rings.current.map((ring, i) => (
        <mesh key={i} position={[ring.x, ring.y, ring.z]} rotation={[0, 0, i * 0.5]}>
          <torusGeometry args={[4, 0.1, 8, 40]} />
          <meshStandardMaterial color={ring.color} emissive={ring.color} emissiveIntensity={0.5} />
        </mesh>
      ))}
      {/* Tunnel walls */}
      {Array.from({ length: 40 }, (_, i) => (
        <mesh key={`wall-${i}`} position={[0, 0, -i * 4]}>
          <cylinderGeometry args={[5, 5, 4, 16, 1, true]} />
          <meshStandardMaterial color="#1a1a3e" side={THREE.BackSide} opacity={0.5} transparent />
        </mesh>
      ))}
    </>
  );
}

export default function Tunnel3D() {
  const [score, setScore] = useState(0);

  return (
    <div className="w-full h-full relative">
      <div className="absolute top-4 left-4 z-10 text-white font-black text-xl bg-black/50 px-4 py-2 rounded-xl backdrop-blur-md">
        Score: <span className="text-cyan-400">{score}</span>
      </div>
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 text-white/50 text-xs uppercase tracking-widest">
        Move mouse to steer through the tunnel
      </div>
      <Canvas camera={{ fov: 75 }}>
        <TunnelScene score={score} setScore={setScore} />
      </Canvas>
    </div>
  );
}
