"use client";

import { RigidBody, CuboidCollider } from "@react-three/rapier";

export function ArenaMap() {
  const arenaSize = 50;
  const wallHeight = 10;
  const wallThickness = 2;

  return (
    <group>
      {/* Floor */}
      <RigidBody type="fixed" friction={1}>
        <mesh receiveShadow position={[0, -0.5, 0]}>
          <boxGeometry args={[arenaSize, 1, arenaSize]} />
          <meshStandardMaterial color="#333" roughness={0.8} />
        </mesh>
      </RigidBody>

      {/* Walls */}
      <RigidBody type="fixed">
        <mesh receiveShadow position={[0, wallHeight / 2, -arenaSize / 2 - wallThickness / 2]}>
          <boxGeometry args={[arenaSize, wallHeight, wallThickness]} />
          <meshStandardMaterial color="#444" />
        </mesh>
        <mesh receiveShadow position={[0, wallHeight / 2, arenaSize / 2 + wallThickness / 2]}>
          <boxGeometry args={[arenaSize, wallHeight, wallThickness]} />
          <meshStandardMaterial color="#444" />
        </mesh>
        <mesh receiveShadow position={[-arenaSize / 2 - wallThickness / 2, wallHeight / 2, 0]}>
          <boxGeometry args={[wallThickness, wallHeight, arenaSize]} />
          <meshStandardMaterial color="#444" />
        </mesh>
        <mesh receiveShadow position={[arenaSize / 2 + wallThickness / 2, wallHeight / 2, 0]}>
          <boxGeometry args={[wallThickness, wallHeight, arenaSize]} />
          <meshStandardMaterial color="#444" />
        </mesh>
      </RigidBody>

      {/* Obstacles / Cover */}
      <RigidBody type="fixed" position={[5, 2, 5]}>
        <mesh castShadow receiveShadow>
          <boxGeometry args={[4, 4, 4]} />
          <meshStandardMaterial color="#555" />
        </mesh>
      </RigidBody>
      <RigidBody type="fixed" position={[-8, 3, -10]}>
        <mesh castShadow receiveShadow>
          <boxGeometry args={[6, 6, 2]} />
          <meshStandardMaterial color="#666" />
        </mesh>
      </RigidBody>
      <RigidBody type="fixed" position={[10, 1.5, -12]}>
        <mesh castShadow receiveShadow>
          <cylinderGeometry args={[2, 2, 3, 16]} />
          <meshStandardMaterial color="#777" />
        </mesh>
      </RigidBody>

      {/* Simple XBR Chest (Dynamic) */}
      <RigidBody type="dynamic" mass={5} position={[0, 2, -15]} name="chest">
        <mesh castShadow receiveShadow>
          <boxGeometry args={[2, 1.5, 1.5]} />
          <meshStandardMaterial color="#b45309" roughness={0.9} /> {/* Amber/Brown Wood */}
        </mesh>
        {/* Chest Trim */}
        <mesh castShadow receiveShadow position={[0, 0, 0]}>
          <boxGeometry args={[2.1, 0.2, 1.6]} />
          <meshStandardMaterial color="#fbbf24" metalness={0.8} roughness={0.2} /> {/* Gold */}
        </mesh>
      </RigidBody>
    </group>
  );
}
