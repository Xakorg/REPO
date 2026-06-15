"use client";

import { RigidBody, CuboidCollider } from "@react-three/rapier";
import * as THREE from "three";

interface GoalProps {
  position: [number, number, number];
  rotation?: [number, number, number];
  team: 1 | 2;
  onScore: (teamScoredFor: 1 | 2) => void;
}

export function Goal({ position, rotation = [0, 0, 0], team, onScore }: GoalProps) {
  const goalColor = team === 1 ? "#3b82f6" : "#ef4444"; // Team 1 defends Blue, Team 2 defends Red
  
  // A goal scored IN Team 1's net means Team 2 scored.
  const pointsTo = team === 1 ? 2 : 1;

  return (
    <group position={position} rotation={rotation as any}>
      {/* Physical Posts */}
      <RigidBody type="fixed" colliders="hull">
        {/* Left Post */}
        <mesh position={[-4, 1.5, 0]} castShadow receiveShadow>
          <cylinderGeometry args={[0.2, 0.2, 3, 16]} />
          <meshStandardMaterial color="#fff" />
        </mesh>
        
        {/* Right Post */}
        <mesh position={[4, 1.5, 0]} castShadow receiveShadow>
          <cylinderGeometry args={[0.2, 0.2, 3, 16]} />
          <meshStandardMaterial color="#fff" />
        </mesh>
        
        {/* Crossbar */}
        <mesh position={[0, 3, 0]} rotation={[0, 0, Math.PI / 2]} castShadow receiveShadow>
          <cylinderGeometry args={[0.2, 0.2, 8.4, 16]} />
          <meshStandardMaterial color="#fff" />
        </mesh>

        {/* Back Netting (Visual) */}
        <mesh position={[0, 1.5, -2]} castShadow receiveShadow>
          <boxGeometry args={[8, 3, 0.1]} />
          <meshStandardMaterial color={goalColor} opacity={0.3} transparent wireframe />
        </mesh>
      </RigidBody>

      {/* Invisible Sensor for Scoring */}
      <RigidBody 
        type="fixed" 
        colliders={false}
      >
        <CuboidCollider 
          args={[3.8, 1.4, 1]} 
          position={[0, 1.5, -1]} 
          sensor
          onIntersectionEnter={(payload) => {
            if (payload.other.rigidBodyObject?.name === "ball") {
              onScore(pointsTo);
            }
          }}
        />
      </RigidBody>
    </group>
  );
}
