"use client";

import { useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { RigidBody, CapsuleCollider, useRevoluteJoint } from "@react-three/rapier";
import { useControllerInput } from "./useControllerInput";
import * as THREE from "three";

export function Player({ position = [0, 1, 5], playerIndex = 1, innerRef, onUpdateNetwork }: { position?: [number, number, number], playerIndex?: 1 | 2 | 3 | 4, innerRef?: any, onUpdateNetwork?: (state: any) => void }) {
  const defaultRef = useRef<any>(null);
  const ref = innerRef || defaultRef;
  const input = useControllerInput(playerIndex as any);
  const meshRef = useRef<any>(null);
  
  // A simple cooldown so the user can't spam kick
  const [lastKick, setLastKick] = useState(0);

  const speed = 15;
  const maxVelocity = 8;
  const kickForce = 250;

  useFrame((state, delta) => {
    if (!ref.current) return;

    // 1. Movement logic
    const vel = ref.current.linvel();
    
    // Apply forces based on input, but cap the velocity
    const targetVelX = input.x * speed;
    const targetVelZ = input.y * speed;
    
    // Simple interpolation for smoother movement
    vel.x = THREE.MathUtils.lerp(vel.x, targetVelX, delta * 10);
    vel.z = THREE.MathUtils.lerp(vel.z, targetVelZ, delta * 10);
    
    // Keep Y velocity for gravity/bouncing
    ref.current.setLinvel(vel, true);

    // 2. Rotation logic (face the direction of movement)
    const moveDir = new THREE.Vector3(input.x, 0, input.y);
    if (moveDir.length() > 0) {
      const angle = Math.atan2(moveDir.x, moveDir.z);
      const q = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), angle);
      if (meshRef.current) {
        meshRef.current.quaternion.slerp(q, 0.2);
      }
    }
    
    // Sync Network
    if (onUpdateNetwork && playerIndex === 1) { // P1 is the authoritative local client when online
      const p = ref.current.translation();
      if (meshRef.current) {
        onUpdateNetwork({ x: p.x, y: p.y, z: p.z, yaw: meshRef.current.rotation.y });
      }
    }
  });

  return (
    <RigidBody
      ref={ref}
      position={position}
      colliders={false}
      mass={2}
      lockRotations // Prevent the capsule from falling over
      name="player"
    >
      <CapsuleCollider args={[0.5, 0.5]} position={[0, 1, 0]} />
      {/* Player Visuals */}
      <group ref={meshRef} position={[0, 0.5, 0]}>
        {/* Body */}
        <mesh position={[0, 0.5, 0]} castShadow>
          <capsuleGeometry args={[0.5, 1, 4, 16]} />
          <meshStandardMaterial color={playerIndex === 1 ? "#3b82f6" : "#ef4444"} /> 
        </mesh>
        
        {/* Simple "Face/Visor" to show direction */}
        <mesh position={[0, 0.8, 0.45]} castShadow>
          <boxGeometry args={[0.6, 0.2, 0.2]} />
          <meshStandardMaterial color="#1e3a8a" />
        </mesh>
      </group>
    </RigidBody>
  );
}
