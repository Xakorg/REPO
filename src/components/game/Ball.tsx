"use client";

import { RigidBody, SphereCollider } from "@react-three/rapier";
import { useRef } from "react";
import * as THREE from "three";

export function Ball({ position = [0, 5, 0] }: { position?: [number, number, number] }) {
  const ref = useRef<any>(null);

  return (
    <RigidBody
      ref={ref}
      position={position}
      colliders="hull"
      restitution={0.8}
      friction={0.2}
      mass={1}
      name="ball"
    >
      <mesh castShadow receiveShadow>
        <sphereGeometry args={[0.5, 32, 32]} />
        <meshStandardMaterial color="white" />
      </mesh>
    </RigidBody>
  );
}
