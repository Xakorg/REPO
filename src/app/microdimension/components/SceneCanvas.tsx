"use client";

import React, { useRef } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, TransformControls, Grid, Environment } from "@react-three/drei";
import { useSceneState, SceneObject } from "./SceneState";

function MeshObject({ obj }: { obj: SceneObject }) {
  const { selectedId, setSelectedId, transformMode, updateObject } = useSceneState();
  const isSelected = selectedId === obj.id;
  const meshRef = useRef<any>(null);

  const handleClick = (e: any) => {
    e.stopPropagation();
    setSelectedId(obj.id);
  };

  const getGeometry = () => {
    switch (obj.type) {
      case "box":
        return <boxGeometry args={[1, 1, 1]} />;
      case "sphere":
        return <sphereGeometry args={[0.5, 32, 32]} />;
      case "plane":
        return <planeGeometry args={[1, 1]} />;
      case "character_base":
        // Simple placeholder for character
        return <capsuleGeometry args={[0.3, 1, 16, 16]} />;
      case "weapon_base":
        // Simple placeholder for weapon
        return <boxGeometry args={[0.1, 1.5, 0.2]} />;
      default:
        return <boxGeometry args={[1, 1, 1]} />;
    }
  };

  const mesh = (
    <mesh
      ref={meshRef}
      position={obj.position}
      rotation={obj.rotation}
      scale={obj.scale}
      onClick={handleClick}
      castShadow
      receiveShadow={obj.type === "plane"}
    >
      {getGeometry()}
      <meshStandardMaterial
        color={obj.color}
        roughness={0.5}
        metalness={0.1}
        wireframe={isSelected && obj.type !== "plane"}
      />
    </mesh>
  );

  if (isSelected && obj.id !== "base_plane") {
    return (
      <TransformControls
        object={meshRef}
        mode={transformMode}
        onMouseUp={() => {
          if (meshRef.current) {
            updateObject(obj.id, {
              position: [meshRef.current.position.x, meshRef.current.position.y, meshRef.current.position.z],
              rotation: [meshRef.current.rotation.x, meshRef.current.rotation.y, meshRef.current.rotation.z],
              scale: [meshRef.current.scale.x, meshRef.current.scale.y, meshRef.current.scale.z],
            });
          }
        }}
      >
        {mesh}
      </TransformControls>
    );
  }

  return mesh;
}

export function SceneCanvas() {
  const { objects, setSelectedId } = useSceneState();

  return (
    <div className="absolute inset-0 z-0">
      <Canvas shadows camera={{ position: [5, 5, 5], fov: 50 }} onPointerMissed={() => setSelectedId(null)}>
        <color attach="background" args={["#0a0a0a"]} />
        <ambientLight intensity={0.5} />
        <directionalLight
          castShadow
          position={[10, 10, 10]}
          intensity={1}
          shadow-mapSize={[1024, 1024]}
        />
        <Environment preset="city" opacity={0.2} background={false} />
        
        <Grid
          infiniteGrid
          fadeDistance={50}
          sectionColor="#333333"
          cellColor="#1a1a1a"
          position={[0, -0.01, 0]}
        />

        {objects.map((obj) => (
          <MeshObject key={obj.id} obj={obj} />
        ))}

        <OrbitControls makeDefault />
      </Canvas>
    </div>
  );
}
