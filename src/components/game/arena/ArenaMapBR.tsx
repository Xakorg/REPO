"use client";

import { RigidBody, CuboidCollider } from "@react-three/rapier";
import { Grid, Sparkles, Environment } from "@react-three/drei";
import { HealthPickup } from "./HealthPickup";
import { WeaponChest } from "./WeaponChest";
import * as THREE from "three";

export function ArenaMapBR() {
  const arenaSize = 200; // Massive map for 20 players
  const wallHeight = 10;
  const wallThickness = 2;

  // Procedurally generated obstacles
  const numObstacles = 40;
  const obstacles = Array.from({ length: numObstacles }).map((_, i) => ({
    pos: [(Math.random() - 0.5) * 180, Math.random() * 5, (Math.random() - 0.5) * 180],
    size: [Math.random() * 10 + 2, Math.random() * 8 + 2, Math.random() * 10 + 2]
  }));

  // Procedurally generated jump pads
  const numPads = 10;
  const jumpPads = Array.from({ length: numPads }).map(() => ({
    pos: [(Math.random() - 0.5) * 180, 0.1, (Math.random() - 0.5) * 180]
  }));

  // Procedurally generated health pickups
  const numPickups = 20;
  const healthPickups = Array.from({ length: numPickups }).map(() => ({
    pos: [(Math.random() - 0.5) * 180, 0.5, (Math.random() - 0.5) * 180] as [number, number, number]
  }));

  // Procedurally generated weapon chests
  const numChests = 15;
  const weaponChests = Array.from({ length: numChests }).map(() => ({
    pos: [(Math.random() - 0.5) * 180, 0, (Math.random() - 0.5) * 180] as [number, number, number]
  }));

  return (
    <group>
      <Environment preset="city" />

      {/* Cyberpunk Grid Floor */}
      <Grid 
        infiniteGrid 
        fadeDistance={200} 
        cellColor="#0ea5e9" 
        sectionColor="#38bdf8" 
        sectionSize={5} 
        cellSize={1} 
      />

      {/* Floor Physics */}
      <RigidBody type="fixed" position={[0, -0.5, 0]}>
        <mesh receiveShadow>
          <boxGeometry args={[arenaSize, 1, arenaSize]} />
          <meshStandardMaterial color="#0f172a" metalness={0.8} roughness={0.2} />
        </mesh>
      </RigidBody>

      {/* Perimeter Walls */}
      <RigidBody type="fixed">
        <mesh receiveShadow position={[0, wallHeight / 2, -arenaSize / 2 - wallThickness / 2]}>
          <boxGeometry args={[arenaSize, wallHeight, wallThickness]} />
          <meshStandardMaterial color="#1a1a2e" metalness={0.5} roughness={0.5} />
        </mesh>
        <mesh receiveShadow position={[0, wallHeight / 2, arenaSize / 2 + wallThickness / 2]}>
          <boxGeometry args={[arenaSize, wallHeight, wallThickness]} />
          <meshStandardMaterial color="#1a1a2e" metalness={0.5} roughness={0.5} />
        </mesh>
        <mesh receiveShadow position={[-arenaSize / 2 - wallThickness / 2, wallHeight / 2, 0]}>
          <boxGeometry args={[wallThickness, wallHeight, arenaSize]} />
          <meshStandardMaterial color="#1a1a2e" metalness={0.5} roughness={0.5} />
        </mesh>
        <mesh receiveShadow position={[arenaSize / 2 + wallThickness / 2, wallHeight / 2, 0]}>
          <boxGeometry args={[wallThickness, wallHeight, arenaSize]} />
          <meshStandardMaterial color="#1a1a2e" metalness={0.5} roughness={0.5} />
        </mesh>
      </RigidBody>

      {/* Procedural Obstacles */}
      {obstacles.map((o, i) => (
        <RigidBody key={`br-obs-${i}`} type="fixed" position={o.pos as any}>
          <mesh castShadow receiveShadow>
            <boxGeometry args={o.size as any} />
            <meshStandardMaterial color="#1a1a2e" metalness={0.5} roughness={0.5} />
          </mesh>
          <mesh position={[0, o.size[1]/2 + 0.05, 0]}>
             <boxGeometry args={[o.size[0] + 0.05, 0.1, o.size[2] + 0.05]} />
             <meshStandardMaterial color={i % 2 === 0 ? "#0ea5e9" : "#f43f5e"} emissive={i % 2 === 0 ? "#0ea5e9" : "#f43f5e"} emissiveIntensity={0.5} />
          </mesh>
        </RigidBody>
      ))}

      {/* Procedural Jump Pads */}
      {jumpPads.map((pad, i) => (
        <group key={`br-jumppad-${i}`} position={pad.pos as any}>
          <mesh receiveShadow>
            <cylinderGeometry args={[2, 2, 0.2, 16]} />
            <meshStandardMaterial color="#10b981" emissive="#10b981" emissiveIntensity={1} />
          </mesh>
          <Sparkles count={20} scale={2} size={3} speed={0.4} opacity={0.5} color="#10b981" position={[0, 1, 0]} />
          <RigidBody type="fixed" colliders={false}>
            <CuboidCollider 
              args={[2, 1, 2]} 
              position={[0, 1, 0]} 
              sensor 
              onIntersectionEnter={(payload) => {
                if (payload.other.rigidBodyObject?.name?.startsWith("gladiator") && payload.other.rigidBody) {
                  payload.other.rigidBody.setLinvel({ x: 0, y: 25, z: 0 }, true);
                }
              }}
            />
          </RigidBody>
        </group>
      ))}

      {/* Procedural Health Pickups */}
      {healthPickups.map((p, i) => (
        <HealthPickup key={`br-health-${i}`} position={p.pos} />
      ))}

      {/* Procedural Weapon Chests */}
      {weaponChests.map((p, i) => (
        <WeaponChest key={`br-chest-${i}`} position={p.pos} />
      ))}

    </group>
  );
}
