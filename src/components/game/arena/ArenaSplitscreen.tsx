"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useState } from "react";
import * as THREE from "three";

interface ArenaSplitscreenProps {
  player1Ref: React.MutableRefObject<any>;
  player2Ref: React.MutableRefObject<any>;
  setCamera1: (cam: THREE.PerspectiveCamera) => void;
  setCamera2: (cam: THREE.PerspectiveCamera) => void;
}

export function ArenaSplitscreen({ player1Ref, player2Ref, setCamera1, setCamera2 }: ArenaSplitscreenProps) {
  const { gl, scene, size } = useThree();
  
  const [camera1] = useState(() => new THREE.PerspectiveCamera(60, size.width / 2 / size.height, 0.1, 1000));
  const [camera2] = useState(() => new THREE.PerspectiveCamera(60, size.width / 2 / size.height, 0.1, 1000));

  useEffect(() => {
    setCamera1(camera1);
    setCamera2(camera2);
    // Disable auto clear
    gl.autoClear = false;
    return () => {
      gl.autoClear = true;
    };
  }, [gl, camera1, camera2, setCamera1, setCamera2]);

  // Window keydown listener for local multiplayer
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!(window as any).localKeys) (window as any).localKeys = {};
      (window as any).localKeys[e.key.toLowerCase()] = true;
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if (!(window as any).localKeys) (window as any).localKeys = {};
      (window as any).localKeys[e.key.toLowerCase()] = false;
    };
    
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  useFrame((state) => {
    const width = state.size.width;
    const height = state.size.height;

    camera1.aspect = (width / 2) / height;
    camera1.updateProjectionMatrix();
    camera2.aspect = (width / 2) / height;
    camera2.updateProjectionMatrix();

    // Render Left (Player 1)
    gl.setViewport(0, 0, width / 2, height);
    gl.setScissor(0, 0, width / 2, height);
    gl.setScissorTest(true);
    gl.setClearColor("#111");
    gl.clear();
    gl.render(scene, camera1);

    // Render Right (Player 2)
    gl.setViewport(width / 2, 0, width / 2, height);
    gl.setScissor(width / 2, 0, width / 2, height);
    gl.setScissorTest(true);
    gl.setClearColor("#111");
    gl.clear();
    gl.render(scene, camera2);

    gl.setScissorTest(false);
  }, 1);

  return null;
}
