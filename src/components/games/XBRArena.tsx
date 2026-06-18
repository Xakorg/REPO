"use client";
import { Canvas, useFrame } from "@react-three/fiber";
import { useRef, useState, useEffect } from "react";
import * as THREE from "three";

function Arena({ onHit }: { onHit: () => void }) {
  const playerRef = useRef<THREE.Mesh>(null!);
  const enemiesRef = useRef<{ mesh: THREE.Mesh; vel: THREE.Vector3 }[]>([]);
  const bulletsRef = useRef<{ mesh: THREE.Mesh; vel: THREE.Vector3 }[]>([]);
  const keys = useRef<Record<string, boolean>>({});
  const lastShot = useRef(0);

  useEffect(() => {
    const down = (e: KeyboardEvent) => { keys.current[e.code] = true; };
    const up = (e: KeyboardEvent) => { keys.current[e.code] = false; };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => { window.removeEventListener("keydown", down); window.removeEventListener("keyup", up); };
  }, []);

  useFrame((state, delta) => {
    const k = keys.current;
    if (playerRef.current) {
      if (k["ArrowLeft"]) playerRef.current.position.x -= 5 * delta;
      if (k["ArrowRight"]) playerRef.current.position.x += 5 * delta;
      if (k["ArrowUp"]) playerRef.current.position.z -= 5 * delta;
      if (k["ArrowDown"]) playerRef.current.position.z += 5 * delta;
      playerRef.current.position.clamp(new THREE.Vector3(-9,-1,-9), new THREE.Vector3(9,1,9));
    }

    // Shoot
    if ((k["Space"] || k["KeyZ"]) && state.clock.elapsedTime - lastShot.current > 0.2) {
      const geom = new THREE.SphereGeometry(0.2, 8, 8);
      const mat = new THREE.MeshStandardMaterial({ color: "#22d3ee", emissive: "#22d3ee", emissiveIntensity: 1 });
      const mesh = new THREE.Mesh(geom, mat);
      mesh.position.copy(playerRef.current.position);
      state.scene.add(mesh);
      bulletsRef.current.push({ mesh, vel: new THREE.Vector3(0, 0, -15) });
      lastShot.current = state.clock.elapsedTime;
    }

    // Spawn enemies
    if (Math.random() < 0.02) {
      const geom = new THREE.OctahedronGeometry(0.7);
      const mat = new THREE.MeshStandardMaterial({ color: "#ef4444", emissive: "#ef4444", emissiveIntensity: 0.3 });
      const mesh = new THREE.Mesh(geom, mat);
      mesh.position.set((Math.random() - 0.5) * 16, 0, -15);
      state.scene.add(mesh);
      const dx = playerRef.current.position.x - mesh.position.x;
      enemiesRef.current.push({ mesh, vel: new THREE.Vector3(dx * 0.1, 0, 4 + Math.random() * 2) });
    }

    // Move bullets
    for (const b of bulletsRef.current) {
      b.mesh.position.addScaledVector(b.vel, delta);
    }

    // Move enemies
    for (const e of enemiesRef.current) {
      e.mesh.position.addScaledVector(e.vel, delta);
      e.mesh.rotation.x += delta * 2;

      // Check bullet collision
      for (const b of bulletsRef.current) {
        if (b.mesh.position.distanceTo(e.mesh.position) < 1.2) {
          state.scene.remove(e.mesh); state.scene.remove(b.mesh);
          e.mesh.position.set(0, -100, 0); b.mesh.position.set(0, -100, 0);
          onHit();
        }
      }
    }

    // Cleanup out-of-bounds
    bulletsRef.current = bulletsRef.current.filter(b => { if (b.mesh.position.z < -20 || b.mesh.position.y < -50) { state.scene.remove(b.mesh); return false; } return true; });
    enemiesRef.current = enemiesRef.current.filter(e => { if (e.mesh.position.z > 15 || e.mesh.position.y < -50) { state.scene.remove(e.mesh); return false; } return true; });
  });

  return (
    <>
      <color attach="background" args={["#050510"]} />
      <ambientLight intensity={0.3} />
      <pointLight position={[0, 10, 0]} intensity={2} />
      <gridHelper args={[20, 20, "#1a1a4e", "#0d0d2e"]} />
      <mesh ref={playerRef} position={[0, 0, 5]}>
        <boxGeometry args={[1.2, 0.4, 1.8]} />
        <meshStandardMaterial color="#818cf8" emissive="#818cf8" emissiveIntensity={0.3} />
      </mesh>
    </>
  );
}

export default function XBRArena() {
  const [score, setScore] = useState(0);
  return (
    <div className="w-full h-full relative">
      <div className="absolute top-4 left-4 z-10 bg-black/60 text-white font-black text-xl px-4 py-2 rounded-xl backdrop-blur-md">
        Kills: <span className="text-cyan-400">{score}</span>
      </div>
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 bg-black/60 text-white/50 text-xs px-4 py-2 rounded-full">
        Arrow Keys to move · Space to shoot
      </div>
      <Canvas camera={{ position: [0, 12, 12], fov: 60, near: 0.1 }}>
        <Arena onHit={() => setScore(s => s + 1)} />
      </Canvas>
    </div>
  );
}
