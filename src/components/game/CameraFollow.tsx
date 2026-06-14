"use client";

import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

export function CameraFollow() {
  const { camera, scene } = useThree();

  useFrame(() => {
    // Find the player or ball in the scene
    const player = scene.getObjectByName("player");
    const ball = scene.getObjectByName("ball");

    let targetPosition = new THREE.Vector3();

    if (player && ball) {
       // Look at the midpoint between player and ball
       const pPos = new THREE.Vector3();
       player.getWorldPosition(pPos);
       
       const bPos = new THREE.Vector3();
       ball.getWorldPosition(bPos);
       
       targetPosition.lerpVectors(pPos, bPos, 0.5);
    } else if (player) {
       player.getWorldPosition(targetPosition);
    } else {
       return;
    }

    // Offset camera to be above and behind (2.5D view)
    const cameraOffset = new THREE.Vector3(0, 15, 20);
    const desiredPosition = targetPosition.clone().add(cameraOffset);

    // Smoothly interpolate camera position
    camera.position.lerp(desiredPosition, 0.05);
    
    // Look at the target
    camera.lookAt(targetPosition);
  });

  return null;
}
