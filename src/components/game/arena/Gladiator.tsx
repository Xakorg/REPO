"use client";

import { useRef, useState, useEffect } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { RigidBody, CapsuleCollider } from "@react-three/rapier";
import { useKeyboardControls } from "@react-three/drei";
import * as THREE from "three";

interface GladiatorProps {
  position?: [number, number, number];
  activeWeapon: "gun" | "melee" | "wand";
  gameState?: "lobby" | "playing";
}

interface Projectile {
  id: string;
  position: [number, number, number];
  velocity: [number, number, number];
  type: "gun" | "wand";
}

export function Gladiator({ position = [0, 5, 0], activeWeapon, gameState = "playing" }: GladiatorProps) {
  const playerRef = useRef<any>(null);
  const [, get] = useKeyboardControls();
  const { camera } = useThree();
  const [projectiles, setProjectiles] = useState<Projectile[]>([]);
  const lastFireTime = useRef(0);
  const meleeSwing = useRef(0);
  const meleeWeaponRef = useRef<any>(null);
  
  // Basic attributes
  const speed = 12;
  const jumpForce = 8;
  
  // Camera state
  const cameraOffset = new THREE.Vector3(0, 5, 10);
  const targetCameraPos = new THREE.Vector3();

  useFrame((state, delta) => {
    if (!playerRef.current) return;

    if (gameState === "lobby") {
       // Lobby Mode: Slow rotation, fixed camera, no movement
       playerRef.current.setLinvel({ x: 0, y: 0, z: 0 }, true);
       
       // Rotate slowly for showcase
       const rot = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, state.clock.elapsedTime * 0.5, 0));
       playerRef.current.setRotation(rot, true);

       // Fixed Lobby Camera
       const targetCamPos = new THREE.Vector3(0, 5, 12);
       camera.position.lerp(targetCamPos, delta * 2);
       camera.lookAt(0, 3, 0);
       return;
    }

    // --- Playing Mode ---
    // 1. Input & Movement
    const { forward, backward, left, right, jump, shoot } = get();
    const vel = playerRef.current.linvel();
    
    // Calculate movement vector relative to camera's Y-rotation
    const moveDir = new THREE.Vector3();
    if (forward) moveDir.z -= 1;
    if (backward) moveDir.z += 1;
    if (left) moveDir.x -= 1;
    if (right) moveDir.x += 1;
    
    moveDir.normalize();

    // Fire Weapon / Attack
    if (shoot) {
       const now = performance.now();
       
       if (activeWeapon !== "melee") {
           const fireRate = activeWeapon === "gun" ? 200 : 500; // ms between shots
           if (now - lastFireTime.current > fireRate) {
              lastFireTime.current = now;
              
              const pPos = playerRef.current.translation();
              const facing = new THREE.Vector3(0, 0, -1).applyQuaternion(playerRef.current.rotation());
              
              const pSpeed = activeWeapon === "gun" ? 40 : 20;
              const pVel = [facing.x * pSpeed, facing.y * pSpeed, facing.z * pSpeed] as [number, number, number];
              
              setProjectiles(prev => [...prev, {
                 id: Math.random().toString(),
                 position: [pPos.x + facing.x, pPos.y + 0.5, pPos.z + facing.z],
                 velocity: pVel,
                 type: activeWeapon
              }]);
           }
       } else {
           // Melee Attack
           if (now - lastFireTime.current > 400) {
               lastFireTime.current = now;
               meleeSwing.current = 1; // start swing animation
           }
       }
    }
    
    // Animate Melee Swing
    if (meleeSwing.current > 0 && meleeWeaponRef.current) {
        meleeSwing.current -= delta * 5;
        // Swing from 0.5 to -1.5 radians
        meleeWeaponRef.current.rotation.x = THREE.MathUtils.lerp(-1.5, 0.5, Math.max(0, meleeSwing.current));
    } else if (meleeWeaponRef.current) {
        meleeWeaponRef.current.rotation.x = 0.5; // Idle
    }

    // Apply speed
    const targetVelX = moveDir.x * speed;
    const targetVelZ = moveDir.z * speed;
    
    vel.x = THREE.MathUtils.lerp(vel.x, targetVelX, delta * 15);
    vel.z = THREE.MathUtils.lerp(vel.z, targetVelZ, delta * 15);
    
    // Jump
    if (jump && Math.abs(vel.y) < 0.1) {
      vel.y = jumpForce;
    }

    playerRef.current.setLinvel(vel, true);

    // 2. Player Rotation
    if (moveDir.length() > 0) {
      const angle = Math.atan2(moveDir.x, moveDir.z);
      const euler = new THREE.Euler(0, angle, 0);
      const quaternion = new THREE.Quaternion().setFromEuler(euler);
      // smoothly rotate player model towards movement direction
      playerRef.current.setRotation(quaternion, true);
    }

    // 3. 3rd-Person Camera Follow
    const playerWorldPos = new THREE.Vector3();
    playerWorldPos.copy(playerRef.current.translation());

    // Desired camera position is player pos + offset
    targetCameraPos.copy(playerWorldPos).add(cameraOffset);
    camera.position.lerp(targetCameraPos, delta * 5);
    
    // Look slightly above the player
    const lookTarget = playerWorldPos.clone().add(new THREE.Vector3(0, 2, 0));
    camera.lookAt(lookTarget);
  });

  return (
    <group>
      <RigidBody
        ref={playerRef}
        position={position}
        colliders={false}
        mass={2}
        lockRotations // Prevent falling over
        name="gladiator"
      >
        <CapsuleCollider args={[0.5, 0.5]} position={[0, 1, 0]} />
        
        {/* Gladiator Visuals */}
        <group position={[0, 0.5, 0]}>
          {/* Main Body */}
          <mesh castShadow>
            <capsuleGeometry args={[0.5, 1, 4, 16]} />
            <meshStandardMaterial color={
              activeWeapon === "gun" ? "#0ea5e9" : 
              activeWeapon === "melee" ? "#ef4444" : 
              "#d946ef"
            } />
          </mesh>
          
          {/* Visor / Face */}
          <mesh position={[0, 0.4, 0.45]} castShadow>
            <boxGeometry args={[0.6, 0.2, 0.2]} />
            <meshStandardMaterial color="#111" />
          </mesh>

          {/* Weapon Visualizer */}
          {activeWeapon === "gun" && (
            <mesh position={[0.4, 0, 0.6]} castShadow>
              <boxGeometry args={[0.2, 0.2, 0.8]} />
              <meshStandardMaterial color="#333" />
            </mesh>
          )}
          {activeWeapon === "melee" && (
            <mesh ref={meleeWeaponRef} position={[0.6, 0.5, 0.4]} rotation={[0.5, 0, 0]} castShadow>
              <cylinderGeometry args={[0.05, 0.05, 1.5]} />
              <meshStandardMaterial color="#94a3b8" metalness={0.8} roughness={0.2} />
            </mesh>
          )}
          {activeWeapon === "wand" && (
            <mesh position={[0.5, 0.2, 0.5]} rotation={[0.8, 0, 0]} castShadow>
              <cylinderGeometry args={[0.08, 0.03, 1]} />
              <meshStandardMaterial color="#c026d3" emissive="#c026d3" emissiveIntensity={0.5} />
            </mesh>
          )}
        </group>
      </RigidBody>

      {/* Render Projectiles */}
      {projectiles.map(p => (
        <RigidBody 
           key={p.id} 
           position={p.position} 
           linearVelocity={p.velocity}
           gravityScale={p.type === "wand" ? 0 : 1} // magic wands shoot straight
        >
           <mesh castShadow>
              {p.type === "gun" ? (
                 <sphereGeometry args={[0.2, 8, 8]} />
              ) : (
                 <sphereGeometry args={[0.4, 16, 16]} />
              )}
              <meshStandardMaterial 
                 color={p.type === "gun" ? "#fbbf24" : "#c026d3"} 
                 emissive={p.type === "wand" ? "#c026d3" : "#000"} 
                 emissiveIntensity={1}
              />
           </mesh>
        </RigidBody>
      ))}
    </group>
  );
}
