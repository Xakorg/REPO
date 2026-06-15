"use client";

import { RigidBody, CuboidCollider } from "@react-three/rapier";
import { Sparkles, useGLTF } from "@react-three/drei";
import { useState } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

export function WeaponChest({ position }: { position: [number, number, number] }) {
  const [opened, setOpened] = useState(false);
  const [weaponType, setWeaponType] = useState<"gun" | "wand" | "melee" | null>(null);

  return (
    <group position={position}>
      {!opened ? (
        <RigidBody type="fixed" colliders={false}>
          <mesh castShadow receiveShadow position={[0, 0.5, 0]}>
            <boxGeometry args={[1.5, 1, 1]} />
            <meshStandardMaterial color="#fbbf24" metalness={0.8} roughness={0.2} />
          </mesh>
          <mesh position={[0, 1, 0]}>
             <boxGeometry args={[1.6, 0.2, 1.1]} />
             <meshStandardMaterial color="#b45309" metalness={0.6} roughness={0.4} />
          </mesh>
          <Sparkles count={10} scale={2} size={4} speed={0.4} opacity={0.8} color="#fbbf24" position={[0, 1.5, 0]} />
          
          <CuboidCollider 
            args={[1.5, 1, 1.5]} 
            position={[0, 0.5, 0]} 
            sensor 
            onIntersectionEnter={(payload) => {
              if (payload.other.rigidBodyObject?.name?.startsWith("gladiator")) {
                setOpened(true);
                const types = ["gun", "wand", "melee"] as const;
                const type = types[Math.floor(Math.random() * types.length)];
                setWeaponType(type);
                
                // Fire custom event to update player weapon (a real app would use a store)
                window.dispatchEvent(new CustomEvent('weaponPickup', { detail: type }));
              }
            }}
          />
        </RigidBody>
      ) : (
        <group position={[0, 1, 0]}>
           {/* Floating Weapon hologram */}
           <mesh>
             <boxGeometry args={[0.5, 0.5, 0.5]} />
             <meshStandardMaterial 
               color={weaponType === "gun" ? "#ef4444" : weaponType === "wand" ? "#a855f7" : "#3b82f6"} 
               emissive={weaponType === "gun" ? "#ef4444" : weaponType === "wand" ? "#a855f7" : "#3b82f6"}
               emissiveIntensity={1}
               wireframe
             />
           </mesh>
        </group>
      )}
    </group>
  );
}
