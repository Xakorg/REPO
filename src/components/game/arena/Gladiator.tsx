"use client";

import { useRef, useState, useEffect } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { RigidBody, CapsuleCollider } from "@react-three/rapier";
import { useKeyboardControls, Sparkles } from "@react-three/drei";
import * as THREE from "three";

interface GladiatorProps {
  position?: [number, number, number];
  activeWeapon: "gun" | "melee" | "wand";
  gameState?: "lobby" | "playing";
  inputType?: "mouse" | "keyboard_p1" | "keyboard_p2";
  innerRef?: React.MutableRefObject<any>;
  colorOffset?: number; // to distinguish P1 vs P2
  customCamera?: THREE.PerspectiveCamera;
  playerIndex?: 1 | 2;
  onHealthChange?: (hp: number) => void;
}

interface Projectile {
  id: string;
  position: [number, number, number];
  velocity: [number, number, number];
  type: "gun" | "wand";
}

export function Gladiator({ position = [0, 5, 0], activeWeapon, gameState = "playing", inputType = "mouse", innerRef, colorOffset = 0, customCamera, playerIndex = 1, onHealthChange }: GladiatorProps) {
  const defaultRef = useRef<any>(null);
  const playerRef = innerRef || defaultRef;
  const [, get] = useKeyboardControls();
  const { camera: globalCamera } = useThree();
  const activeCamera = customCamera || globalCamera;
  const [projectiles, setProjectiles] = useState<Projectile[]>([]);
  const [health, setHealth] = useState(100);
  const lastFireTime = useRef(0);
  const meleeSwing = useRef(0);
  const meleeWeaponRef = useRef<any>(null);
  
  // Mech Animation Refs
  const pauldronL = useRef<any>(null);
  const pauldronR = useRef<any>(null);
  const coreRef = useRef<any>(null);
  
  // Basic attributes
  const speed = 12;
  const jumpForce = 8;
  
  // Camera Orbit Angles
  const yaw = useRef(0);
  const pitch = useRef(0.2); // slight downward angle

  // Pointer Lock & Mouse Move
  useEffect(() => {
    if (gameState !== "playing" || inputType !== "mouse") return;

    const onMouseMove = (e: MouseEvent) => {
      if (document.pointerLockElement) {
        yaw.current -= e.movementX * 0.002;
        pitch.current -= e.movementY * 0.002;
        // Clamp pitch to avoid flipping
        pitch.current = Math.max(-Math.PI / 2 + 0.1, Math.min(Math.PI / 2 - 0.1, pitch.current));
      }
    };

    const onClick = () => {
      if (!document.pointerLockElement) {
        document.body.requestPointerLock();
      }
    };

    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("click", onClick);

    return () => {
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("click", onClick);
    };
  }, [gameState]);

  // Health Updates
  useEffect(() => {
    if (onHealthChange) onHealthChange(health);
    if (health <= 0) {
      // Respawn logic
      setHealth(100);
      if (playerRef.current) {
        playerRef.current.setTranslation({ x: position[0], y: position[1] + 10, z: position[2] }, true);
      }
    }
  }, [health, onHealthChange, playerRef, position]);

  // Listen for Health Pickups
  useEffect(() => {
    const handleHeal = (e: any) => {
      // If we don't have the uuid, heal both for now, or match by closest distance if we had UUIDs easily available
      setHealth(h => Math.min(100, h + 50));
    };
    window.addEventListener('healthPickup', handleHeal);
    return () => window.removeEventListener('healthPickup', handleHeal);
  }, []);

  const targetCameraPos = new THREE.Vector3();

  useFrame((state, delta) => {
    if (!playerRef.current) return;

    if (gameState === "lobby") {
       // Lobby Mode: Slow rotation, fixed camera, no movement
       playerRef.current.setLinvel({ x: 0, y: 0, z: 0 }, true);
       
       // Rotate slowly for showcase
       const rot = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, state.clock.elapsedTime * 0.5, 0));
       playerRef.current.setRotation(rot, true);

       // Animate Mech Parts
       if (pauldronL.current && pauldronR.current && coreRef.current) {
         const float = Math.sin(state.clock.elapsedTime * 3) * 0.05;
         pauldronL.current.position.y = 0.8 + float;
         pauldronR.current.position.y = 0.8 + float;
         coreRef.current.scale.setScalar(1 + Math.sin(state.clock.elapsedTime * 5) * 0.1);
       }

       // Fixed Lobby Camera
       const targetCamPos = new THREE.Vector3(0, 5, 12);
       activeCamera.position.lerp(targetCamPos, delta * 2);
       activeCamera.lookAt(0, 3, 0);
       return;
    }

    // --- Playing Mode ---
    // 1. Input & Movement
    let forward = false, backward = false, left = false, right = false, jump = false, shoot = false;
    let rotLeft = false, rotRight = false;
    
    if (inputType === "mouse") {
      const keys = get();
      forward = keys.forward; backward = keys.backward; left = keys.left; right = keys.right;
      jump = keys.jump; shoot = keys.shoot;
    } else {
      // Local Splitscreen Keyboard mapping
      // We don't have access to standard KeyboardControls for two players cleanly, so we poll DOM
      // Actually we need global key state. For simplicity, we'll read a global object attached to window in useFrame.
      const ks = (window as any).localKeys || {};
      if (inputType === "keyboard_p1") {
        forward = ks['w']; backward = ks['s']; left = ks['a']; right = ks['d'];
        jump = ks[' ']; shoot = ks['f']; rotLeft = ks['q']; rotRight = ks['e'];
      } else {
        forward = ks['arrowup']; backward = ks['arrowdown']; left = ks['arrowleft']; right = ks['arrowright'];
        jump = ks['shift']; shoot = ks['l']; rotLeft = ks['u']; rotRight = ks['o'];
      }
    }

    // Apply Camera Rotation from Keyboard
    if (rotLeft) yaw.current += 0.03;
    if (rotRight) yaw.current -= 0.03;

    const vel = playerRef.current.linvel();
    
    // Calculate movement vector relative to camera's Y-rotation
    const moveDir = new THREE.Vector3();
    if (forward) moveDir.z -= 1;
    if (backward) moveDir.z += 1;
    if (left) moveDir.x -= 1;
    if (right) moveDir.x += 1;
    
    moveDir.normalize();
    // Rotate movement vector by camera yaw
    if (moveDir.lengthSq() > 0) {
      moveDir.applyAxisAngle(new THREE.Vector3(0, 1, 0), yaw.current);
    }

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

    // Animate Mech Parts while playing
    if (pauldronL.current && pauldronR.current && coreRef.current) {
      const float = Math.sin(state.clock.elapsedTime * 5) * 0.08;
      pauldronL.current.position.y = 0.8 + float;
      pauldronR.current.position.y = 0.8 + float;
      coreRef.current.scale.setScalar(1 + Math.sin(state.clock.elapsedTime * 8) * 0.1);
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
    // Always face away from camera
    const quaternion = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, yaw.current, 0));
    playerRef.current.setRotation(quaternion, true);

    // 3. 3rd-Person Camera Follow
    const playerWorldPos = new THREE.Vector3();
    playerWorldPos.copy(playerRef.current.translation());

    const radius = 8;
    const cx = playerWorldPos.x + radius * Math.sin(yaw.current) * Math.cos(pitch.current);
    const cy = playerWorldPos.y + radius * Math.sin(pitch.current) + 2; 
    const cz = playerWorldPos.z + radius * Math.cos(yaw.current) * Math.cos(pitch.current);
    
    targetCameraPos.set(cx, cy, cz);
    activeCamera.position.lerp(targetCameraPos, delta * 15);
    
    // Look slightly above the player
    const lookTarget = playerWorldPos.clone().add(new THREE.Vector3(0, 2, 0));
    activeCamera.lookAt(lookTarget);
  });

  return (
    <group>
      <RigidBody
        ref={playerRef}
        position={position}
        colliders={false}
        mass={2}
        lockRotations // Prevent falling over
        name={`gladiator-${playerIndex}`}
        onIntersectionEnter={(payload) => {
           // Basic damage logic
           if (payload.other.rigidBodyObject?.name?.startsWith("projectile")) {
             setHealth(h => Math.max(0, h - 20)); // Projectiles do 20 damage
           }
        }}
      >
        <CapsuleCollider args={[0.5, 0.5]} position={[0, 1, 0]} />
        
        {/* Gladiator Mech Visuals */}
        <group position={[0, 0.5, 0]}>
          {/* Main Torso */}
          <mesh castShadow position={[0, 0, 0]}>
            <boxGeometry args={[0.7, 0.9, 0.4]} />
            <meshStandardMaterial color={new THREE.Color("#0f172a").offsetHSL(colorOffset, 0, 0)} metalness={0.8} roughness={0.2} />
          </mesh>
          
          {/* Glowing Energy Core */}
          <mesh ref={coreRef} castShadow position={[0, 0.1, 0.21]}>
             <sphereGeometry args={[0.15, 16, 16]} />
             <meshStandardMaterial color="#0ea5e9" emissive="#0ea5e9" emissiveIntensity={2} />
          </mesh>

          {/* Floating Pauldrons */}
          <mesh ref={pauldronL} castShadow position={[-0.45, 0.8, 0]} rotation={[0, 0, 0.2]}>
            <boxGeometry args={[0.3, 0.4, 0.5]} />
            <meshStandardMaterial color="#855cd6" metalness={0.5} roughness={0.3} />
          </mesh>
          <mesh ref={pauldronR} castShadow position={[0.45, 0.8, 0]} rotation={[0, 0, -0.2]}>
            <boxGeometry args={[0.3, 0.4, 0.5]} />
            <meshStandardMaterial color="#855cd6" metalness={0.5} roughness={0.3} />
          </mesh>
          
          {/* Head & Visor */}
          <group position={[0, 0.65, 0]}>
            <mesh castShadow>
              <boxGeometry args={[0.5, 0.5, 0.5]} />
              <meshStandardMaterial color="#1e293b" />
            </mesh>
            {/* Cyber Visor */}
            <mesh position={[0, 0.05, 0.26]} castShadow>
              <boxGeometry args={[0.4, 0.15, 0.05]} />
              <meshStandardMaterial color="#0ea5e9" emissive="#0ea5e9" emissiveIntensity={1} />
            </mesh>
          </group>

          {/* Particle Trail */}
          <Sparkles count={20} scale={1.5} size={2} speed={0.4} opacity={0.5} color="#0ea5e9" position={[0, -0.5, -0.2]} />

          {/* Floating Health Bar */}
          <group position={[0, 1.8, 0]}>
             <mesh position={[0, 0, 0]}>
               <planeGeometry args={[1, 0.1]} />
               <meshBasicMaterial color="#ef4444" />
             </mesh>
             <mesh position={[-0.5 + (health/100)/2, 0, 0.01]}>
               <planeGeometry args={[health/100, 0.1]} />
               <meshBasicMaterial color="#22c55e" />
             </mesh>
          </group>

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
           name={`projectile-${playerIndex}`}
           sensor // makes them not bounce players around
           onIntersectionEnter={() => {
              // Destroy projectile on hit
              setProjectiles(prev => prev.filter(proj => proj.id !== p.id));
           }}
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
