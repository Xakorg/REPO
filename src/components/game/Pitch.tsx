"use client";

import { RigidBody, CuboidCollider } from "@react-three/rapier";

export function Pitch() {
  const pitchWidth = 30;
  const pitchLength = 50;
  const wallHeight = 5;
  const wallThickness = 1;

  return (
    <group>
      {/* The Ground */}
      <RigidBody type="fixed" friction={2}>
        <mesh receiveShadow position={[0, -0.5, 0]}>
          <boxGeometry args={[pitchWidth, 1, pitchLength]} />
          <meshStandardMaterial color="#2e7d32" />
        </mesh>
      </RigidBody>

      {/* Invisible Boundaries to keep the ball in play */}
      <RigidBody type="fixed">
        {/* Top Wall */}
        <CuboidCollider position={[0, wallHeight / 2, -pitchLength / 2 - wallThickness / 2]} args={[pitchWidth / 2, wallHeight / 2, wallThickness / 2]} />
        {/* Bottom Wall */}
        <CuboidCollider position={[0, wallHeight / 2, pitchLength / 2 + wallThickness / 2]} args={[pitchWidth / 2, wallHeight / 2, wallThickness / 2]} />
        {/* Left Wall */}
        <CuboidCollider position={[-pitchWidth / 2 - wallThickness / 2, wallHeight / 2, 0]} args={[wallThickness / 2, wallHeight / 2, pitchLength / 2]} />
        {/* Right Wall */}
        <CuboidCollider position={[pitchWidth / 2 + wallThickness / 2, wallHeight / 2, 0]} args={[wallThickness / 2, wallHeight / 2, pitchLength / 2]} />
      </RigidBody>
      
      {/* Pitch Lines (Decorative) */}
      {/* Center Line */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
         <planeGeometry args={[pitchWidth, 0.2]} />
         <meshBasicMaterial color="white" />
      </mesh>
      {/* Center Circle */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
         <ringGeometry args={[3, 3.2, 32]} />
         <meshBasicMaterial color="white" />
      </mesh>
    </group>
  );
}
