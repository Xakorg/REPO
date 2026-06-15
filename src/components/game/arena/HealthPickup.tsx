"use client";

import { useFrame } from "@react-three/fiber";
import { RigidBody, CuboidCollider } from "@react-three/rapier";
import { useRef, useState } from "react";
import * as THREE from "three";

export function HealthPickup({ position }: { position: [number, number, number] }) {
  const meshRef = useRef<any>(null);
  const [active, setActive] = useState(true);

  useFrame((state) => {
    if (!meshRef.current || !active) return;
    meshRef.current.rotation.y += 0.05;
    meshRef.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * 3) * 0.2;
  });

  if (!active) return null;

  return (
    <group position={position}>
      <mesh ref={meshRef} castShadow>
        <boxGeometry args={[0.5, 0.5, 0.5]} />
        <meshStandardMaterial color="#22c55e" emissive="#22c55e" emissiveIntensity={1} />
        {/* White Cross */}
        <mesh position={[0, 0, 0.26]}>
          <boxGeometry args={[0.3, 0.1, 0.05]} />
          <meshBasicMaterial color="#fff" />
        </mesh>
        <mesh position={[0, 0, 0.26]}>
          <boxGeometry args={[0.1, 0.3, 0.05]} />
          <meshBasicMaterial color="#fff" />
        </mesh>
      </mesh>

      <RigidBody type="fixed" colliders={false}>
        <CuboidCollider 
          args={[0.5, 0.5, 0.5]} 
          sensor 
          onIntersectionEnter={(payload) => {
            if (payload.other.rigidBodyObject?.name === "gladiator" && active) {
              setActive(false);
              // Dispatch custom event for health pickup
              window.dispatchEvent(new CustomEvent('healthPickup', { detail: { player: payload.other.rigidBodyObject.uuid } }));
              
              // Respawn after 10 seconds
              setTimeout(() => setActive(true), 10000);
            }
          }}
        />
      </RigidBody>
    </group>
  );
}
