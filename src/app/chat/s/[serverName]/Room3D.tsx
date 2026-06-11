"use client";

import React, { useEffect, useState, useRef, useMemo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Billboard, Text, Stars, Sky, useGLTF } from '@react-three/drei';
import { useUser, useFirestore, useCollection } from '@/firebase';
import { collection, query, onSnapshot, doc, setDoc, deleteDoc, serverTimestamp, updateDoc } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import * as THREE from 'three';

// A simple local player controller
function LocalPlayer({ position, setPosition, setRotation }: any) {
  const { camera } = useThree();
  const speed = 0.15;
  const keys = useRef<{ [key: string]: boolean }>({});

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => (keys.current[e.key.toLowerCase()] = true);
    const handleKeyUp = (e: KeyboardEvent) => (keys.current[e.key.toLowerCase()] = false);
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  useFrame(() => {
    let dx = 0;
    let dz = 0;
    if (keys.current['w'] || keys.current['arrowup']) dz -= speed;
    if (keys.current['s'] || keys.current['arrowdown']) dz += speed;
    if (keys.current['a'] || keys.current['arrowleft']) dx -= speed;
    if (keys.current['d'] || keys.current['arrowright']) dx += speed;

    if (dx !== 0 || dz !== 0) {
      const newPos = [position[0] + dx, position[1], position[2] + dz];
      setPosition(newPos);
      
      // Face direction of movement
      const angle = Math.atan2(dx, dz);
      setRotation(angle);

      // Camera follows
      camera.position.set(newPos[0], newPos[1] + 5, newPos[2] + 10);
      camera.lookAt(newPos[0], newPos[1], newPos[2]);
    }
  });

  return null;
}

// Render other players
function RemotePlayer({ data }: { data: any }) {
  const { position, rotation, displayName, photoURL, isTalking } = data;
  const meshRef = useRef<THREE.Group>(null);
  
  // Smoothly interpolate to target position
  useFrame(() => {
    if (meshRef.current && position) {
      meshRef.current.position.lerp(new THREE.Vector3(position[0] || 0, position[1] || 0, position[2] || 0), 0.1);
      // We could also lerp rotation if needed
    }
  });

  if (!position) return null;

  return (
    <group ref={meshRef} position={position as [number, number, number]}>
      <Billboard follow={true} lockX={false} lockY={false} lockZ={false}>
        {/* Simple Avatar Box */}
        <mesh position={[0, 1, 0]}>
          <planeGeometry args={[2, 2]} />
          <meshBasicMaterial color={isTalking ? "#10b981" : "#fff"} />
        </mesh>
        {/* We removed the <texture> node because it requires an HTMLImageElement, not a string URL, which causes errors */}
        <Text
          position={[0, 2.5, 0]}
          fontSize={0.4}
          color="white"
          anchorX="center"
          anchorY="middle"
          outlineWidth={0.05}
          outlineColor="black"
        >
          {displayName}
        </Text>
      </Billboard>
    </group>
  );
}

// Static interactive zones
function ArcadeMachine({ position, onEnter }: { position: [number, number, number], onEnter: () => void }) {
  return (
    <group position={position}>
      <mesh position={[0, 1.5, 0]}>
        <boxGeometry args={[2, 3, 2]} />
        <meshStandardMaterial color="#8b5cf6" />
      </mesh>
      <Text position={[0, 3.5, 0]} fontSize={0.5} color="white" outlineWidth={0.05} outlineColor="black">
        ARCADE
      </Text>
    </group>
  );
}

export default function Room3D({ serverName }: { serverName: string }) {
  const { user } = useUser();
  const firestore = useFirestore();
  const router = useRouter();

  const [localPos, setLocalPos] = useState<[number, number, number]>([0, 0, 0]);
  const [localRot, setLocalRot] = useState(0);
  const [remotePlayers, setRemotePlayers] = useState<{ [uid: string]: any }>({});
  
  // Connect to Firestore real-time presence for this 3D room
  // In a real app, WebRTC data channels are better for 60FPS movement. 
  // We'll use Firestore with throttling for now to keep it simple.
  
  const lastUpdateRef = useRef(0);

  useEffect(() => {
    if (!firestore || !user) return;
    const roomRef = collection(firestore, "room3d", serverName, "players");
    const userDocRef = doc(roomRef, user.uid);
    
    // Initial join
    setDoc(userDocRef, {
      uid: user.uid,
      displayName: user.displayName || "Member",
      photoURL: user.photoURL || "",
      position: localPos,
      rotation: localRot,
      lastSeen: serverTimestamp()
    });

    const unsub = onSnapshot(query(roomRef), (snapshot) => {
      const players: any = {};
      snapshot.forEach(docSnap => {
        if (docSnap.id !== user.uid) {
          players[docSnap.id] = docSnap.data();
        }
      });
      setRemotePlayers(players);
    });

    const cleanup = () => {
      deleteDoc(userDocRef).catch(()=>{});
    };
    window.addEventListener("beforeunload", cleanup);

    return () => {
      unsub();
      cleanup();
      window.removeEventListener("beforeunload", cleanup);
    };
  }, [firestore, user, serverName]);

  // Sync local position to Firestore periodically (throttled)
  useEffect(() => {
    const now = Date.now();
    if (now - lastUpdateRef.current > 100) { // 10 updates per sec
      lastUpdateRef.current = now;
      if (firestore && user) {
        const userDocRef = doc(firestore, "room3d", serverName, "players", user.uid);
        updateDoc(userDocRef, {
          position: localPos,
          rotation: localRot,
          lastSeen: serverTimestamp()
        }).catch(()=>{});
      }
    }

    // Check distance to interactive zones
    // Arcade zone
    const distToArcade = Math.hypot(localPos[0] - 5, localPos[2] - (-5));
    if (distToArcade < 3) {
      // Auto-join game area
      // router.push("/games"); // Or trigger a modal
    }

  }, [localPos, localRot, firestore, user, serverName]);


  return (
    <div className="w-full h-full relative bg-zinc-950">
      <div className="absolute top-4 left-4 z-10 bg-black/50 p-4 rounded-xl text-xs text-white backdrop-blur-md">
        <h3 className="font-black uppercase text-primary mb-2">3D Room: {serverName}</h3>
        <p className="opacity-70">WASD or Arrows to move.</p>
        <p className="opacity-70">Walk to zones to interact.</p>
        <button 
          onClick={() => router.push(`/chat/s/${serverName}?c=general`)}
          className="mt-4 w-full py-2 bg-white/10 hover:bg-white/20 rounded font-bold uppercase transition"
        >
          Leave Room
        </button>
      </div>

      <Canvas>
        <Sky sunPosition={[100, 20, 100]} turbidity={0.1} rayleigh={0.5} />
        <ambientLight intensity={0.5} />
        <directionalLight position={[10, 10, 5]} intensity={1} castShadow />

        {/* Floor */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.1, 0]} receiveShadow>
          <planeGeometry args={[100, 100]} />
          <meshStandardMaterial color="#1f2937" />
        </mesh>
        <gridHelper args={[100, 100, 0x000000, 0x000000]} position={[0, -0.09, 0]} material-opacity={0.2} material-transparent />

        <LocalPlayer position={localPos} setPosition={setLocalPos} setRotation={setLocalRot} />
        
        {/* Render remote players */}
        {Object.values(remotePlayers).map(p => (
          <RemotePlayer key={p.uid} data={p} />
        ))}

        {/* Arcade Machine Zone */}
        <ArcadeMachine position={[5, 0, -5]} onEnter={() => console.log("Arcade")} />
      </Canvas>
    </div>
  );
}
