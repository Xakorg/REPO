"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useRef, useEffect } from "react";
import * as THREE from "three";

interface SplitscreenCameraProps {
  player1Ref: React.MutableRefObject<any>;
  player2Ref: React.MutableRefObject<any>;
}

export function SplitscreenCamera({ player1Ref, player2Ref }: SplitscreenCameraProps) {
  const { gl, scene, size } = useThree();
  
  // We need two cameras for the two views
  const camera1 = useRef(new THREE.PerspectiveCamera(45, size.width / 2 / size.height, 0.1, 1000));
  const camera2 = useRef(new THREE.PerspectiveCamera(45, size.width / 2 / size.height, 0.1, 1000));

  // Disable auto clear so we can render multiple times per frame
  useEffect(() => {
    gl.autoClear = false;
    return () => {
      gl.autoClear = true;
    };
  }, [gl]);

  useFrame((state) => {
    if (!player1Ref.current || !player2Ref.current) return;

    const width = state.size.width;
    const height = state.size.height;

    // Update camera aspect ratios if window resized
    camera1.current.aspect = (width / 2) / height;
    camera1.current.updateProjectionMatrix();
    camera2.current.aspect = (width / 2) / height;
    camera2.current.updateProjectionMatrix();

    // Player 1 Camera Follow
    const p1Pos = player1Ref.current.translation();
    camera1.current.position.set(p1Pos.x, p1Pos.y + 10, p1Pos.z + 15);
    camera1.current.lookAt(p1Pos.x, p1Pos.y, p1Pos.z);

    // Player 2 Camera Follow
    const p2Pos = player2Ref.current.translation();
    camera2.current.position.set(p2Pos.x, p2Pos.y + 10, p2Pos.z - 15); // P2 looks from the opposite side
    camera2.current.lookAt(p2Pos.x, p2Pos.y, p2Pos.z);

    // Render Player 1 (Left Half)
    gl.setViewport(0, 0, width / 2, height);
    gl.setScissor(0, 0, width / 2, height);
    gl.setScissorTest(true);
    // Clear the left side
    gl.setClearColor("#87CEEB"); // Sky blue
    gl.clear();
    gl.render(scene, camera1.current);

    // Render Player 2 (Right Half)
    gl.setViewport(width / 2, 0, width / 2, height);
    gl.setScissor(width / 2, 0, width / 2, height);
    gl.setScissorTest(true);
    // Clear the right side
    gl.setClearColor("#87CEEB");
    gl.clear();
    gl.render(scene, camera2.current);

    // Disable scissor test for default R3F pipeline, though we've effectively replaced it
    gl.setScissorTest(false);

  }, 1); // priority 1 means this takes over the render loop

  return null;
}
