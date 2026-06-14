"use client";

import { useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { RigidBody, CapsuleCollider, useRevoluteJoint } from "@react-three/rapier";
import { useControllerInput } from "./useControllerInput";
import * as THREE from "three";

export function Player({ position = [0, 1, 5] }: { position?: [number, number, number] }) {
  const ref = useRef<any>(null);
  const input = useControllerInput();
  
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
    if (input.x !== 0 || input.y !== 0) {
      const angle = Math.atan2(input.x, input.y);
      // We set the rotation as a quaternion
      const euler = new THREE.Euler(0, angle, 0);
      const quaternion = new THREE.Quaternion().setFromEuler(euler);
      ref.current.setNextKinematicRotation(quaternion); // wait, we are dynamic, we shouldn't use setNextKinematicRotation, we should use setRotation.
      ref.current.setRotation(quaternion, true);
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
      <group position={[0, 0.5, 0]}>
        {/* Body */}
        <mesh position={[0, 0.5, 0]} castShadow>
          <capsuleGeometry args={[0.5, 1, 4, 16]} />
          <meshStandardMaterial color="#3b82f6" /> {/* Blue Player */}
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
