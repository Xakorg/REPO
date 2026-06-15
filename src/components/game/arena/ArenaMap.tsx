"use client";

import { RigidBody, CuboidCollider } from "@react-three/rapier";
import { Grid, Sparkles, Environment } from "@react-three/drei";
import { HealthPickup } from "./HealthPickup";

export function ArenaMap() {
  const arenaSize = 50;
  const wallHeight = 10;
  const wallThickness = 2;

  return (
    <group>
      {/* Atmosphere */}
      <fog attach="fog" args={["#0a0a1a", 10, 60]} />
      <ambientLight intensity={0.2} color="#855cd6" />
      <directionalLight position={[10, 20, 10]} intensity={1} color="#ffffff" castShadow />
      
      {/* Neon Spotlights */}
      <spotLight position={[-20, 20, -20]} intensity={500} color="#fbbf24" distance={50} angle={0.5} penumbra={1} castShadow />
      <spotLight position={[20, 20, 20]} intensity={500} color="#c026d3" distance={50} angle={0.5} penumbra={1} castShadow />

      {/* Cyber Grid Floor */}
      <Grid 
        position={[0, 0.01, 0]} 
        args={[arenaSize, arenaSize]} 
        cellSize={1} 
        cellThickness={1} 
        cellColor="#1a1a3a" 
        sectionSize={5} 
        sectionThickness={1.5} 
        sectionColor="#855cd6" 
        fadeDistance={40} 
        fadeStrength={1} 
      />

      {/* Physical Floor (Invisible or very dark) */}
      <RigidBody type="fixed" colliders="cuboid" name="floor">
        <mesh position={[0, -1, 0]} receiveShadow>
          <boxGeometry args={[arenaSize, 2, arenaSize]} />
          <meshStandardMaterial color="#05050a" roughness={0.8} />
        </mesh>
      </RigidBody>

      {/* Walls */}
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

      {/* Neon Chest */}
      <RigidBody type="fixed" position={[5, 0.5, -5]} colliders="cuboid" name="chest">
        <mesh castShadow>
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial color="#fbbf24" emissive="#fbbf24" emissiveIntensity={0.5} metalness={0.8} roughness={0.2} />
        </mesh>
        <pointLight position={[0, 1, 0]} color="#fbbf24" intensity={2} distance={5} />
      </RigidBody>

      {/* Obstacles / Cover */}
      {[
        { pos: [5, 2, 5], size: [4, 4, 4] },
        { pos: [-10, 3, -10], size: [6, 6, 2] },
        { pos: [15, 1.5, -8], size: [3, 3, 3] },
        { pos: [-8, 2, 12], size: [2, 4, 8] },
      ].map((o, i) => (
        <RigidBody key={i} type="fixed" position={o.pos as any}>
          <mesh castShadow receiveShadow>
            <boxGeometry args={o.size as any} />
            <meshStandardMaterial color="#1a1a2e" metalness={0.5} roughness={0.5} />
          </mesh>
          {/* Neon Trim on Obstacles */}
          <mesh position={[0, o.size[1]/2 + 0.05, 0]}>
             <boxGeometry args={[o.size[0] + 0.05, 0.1, o.size[2] + 0.05]} />
             <meshStandardMaterial color="#0ea5e9" emissive="#0ea5e9" emissiveIntensity={0.5} />
          </mesh>
        </RigidBody>
      ))}

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

      {/* Jump Pads */}
      {[
        { pos: [0, 0.1, 8] },
        { pos: [12, 0.1, -2] },
        { pos: [-12, 0.1, 5] },
      ].map((pad, i) => (
        <group key={`jumppad-${i}`} position={pad.pos as any}>
          {/* Visual Pad */}
          <mesh receiveShadow>
            <cylinderGeometry args={[1.5, 1.5, 0.2, 16]} />
            <meshStandardMaterial color="#10b981" emissive="#10b981" emissiveIntensity={1} />
          </mesh>
          <Sparkles count={10} scale={1.5} size={2} speed={0.4} opacity={0.5} color="#10b981" position={[0, 0.5, 0]} />
          
          {/* Physics Sensor */}
          <RigidBody type="fixed" colliders={false}>
            <CuboidCollider 
              args={[1.5, 1, 1.5]} 
              position={[0, 1, 0]} 
              sensor 
              onIntersectionEnter={(payload) => {
                if (payload.other.rigidBodyObject?.name === "gladiator" && payload.other.rigidBody) {
                  // Launch the player upwards!
                  payload.other.rigidBody.setLinvel({ x: 0, y: 15, z: 0 }, true);
                }
              }}
            />
          </RigidBody>
        </group>
      ))}

      {/* Health Pickups */}
      <HealthPickup position={[0, 0.5, 0]} />
      <HealthPickup position={[-8, 0.5, -8]} />
      <HealthPickup position={[8, 0.5, 8]} />

    </group>
  );
}
