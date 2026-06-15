"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useRef, useEffect, useMemo } from "react";
import * as THREE from "three";

interface SplitscreenCameraProps {
  players: React.MutableRefObject<any>[];
}

export function SplitscreenCamera({ players }: SplitscreenCameraProps) {
  const { gl, scene, size } = useThree();
  
  // Create 4 cameras, we will only use as many as we have players
  const cameras = useMemo(() => {
    return [
      new THREE.PerspectiveCamera(45, 1, 0.1, 1000),
      new THREE.PerspectiveCamera(45, 1, 0.1, 1000),
      new THREE.PerspectiveCamera(45, 1, 0.1, 1000),
      new THREE.PerspectiveCamera(45, 1, 0.1, 1000),
    ];
  }, []);

  // Disable auto clear so we can render multiple times per frame
  useEffect(() => {
    gl.autoClear = false;
    return () => {
      gl.autoClear = true;
    };
  }, [gl]);

  useFrame((state) => {
    const width = state.size.width;
    const height = state.size.height;
    const numPlayers = players.filter(p => p && p.current).length;
    if (numPlayers === 0) return;

    // Determine layout
    // 2 players: Side by side (1x2)
    // 3 or 4 players: 2x2 Grid
    const isGrid = numPlayers > 2;

    const camWidth = isGrid ? width / 2 : width / numPlayers;
    const camHeight = isGrid ? height / 2 : height;

    players.forEach((playerRef, index) => {
      if (!playerRef.current) return;
      const camera = cameras[index];
      if (!camera) return;

      // Update camera aspect ratios
      camera.aspect = camWidth / camHeight;
      camera.updateProjectionMatrix();

      // Camera Follow logic based on index
      // P1: Above behind
      // P2: Opposite side
      // P3/P4: Perpendicular sides
      const pPos = playerRef.current.translation();
      if (index === 0) {
        camera.position.set(pPos.x, pPos.y + 10, pPos.z + 15);
      } else if (index === 1) {
        camera.position.set(pPos.x, pPos.y + 10, pPos.z - 15); 
      } else if (index === 2) {
        camera.position.set(pPos.x + 15, pPos.y + 10, pPos.z); 
      } else {
        camera.position.set(pPos.x - 15, pPos.y + 10, pPos.z); 
      }
      camera.lookAt(pPos.x, pPos.y, pPos.z);

      // Determine viewport position
      let vx = 0;
      let vy = 0;

      if (!isGrid) {
        // Horizontal split
        vx = index * camWidth;
        vy = 0;
      } else {
        // 2x2 Grid. WebGL origin is Bottom-Left!
        // Index 0: Top-Left (x: 0, y: camHeight)
        // Index 1: Top-Right (x: camWidth, y: camHeight)
        // Index 2: Bottom-Left (x: 0, y: 0)
        // Index 3: Bottom-Right (x: camWidth, y: 0)
        if (index === 0) { vx = 0; vy = camHeight; }
        else if (index === 1) { vx = camWidth; vy = camHeight; }
        else if (index === 2) { vx = 0; vy = 0; }
        else if (index === 3) { vx = camWidth; vy = 0; }
      }

      // Render
      gl.setViewport(vx, vy, camWidth, camHeight);
      gl.setScissor(vx, vy, camWidth, camHeight);
      gl.setScissorTest(true);
      gl.setClearColor("#87CEEB"); // Sky blue
      gl.clear();
      gl.render(scene, camera);
    });

    gl.setScissorTest(false);
  }, 1);

  return null;
}
