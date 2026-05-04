"use client";

import { Canvas, useThree } from "@react-three/fiber";
import * as THREE from "three";
import React, { useEffect } from "react";
import Drumset from "@/components/drum-demo/Drumset";
import { ContactShadows, Environment, OrbitControls } from "@react-three/drei";
import { Leva, useControls } from "leva";

export default function Home() {
  const { fov, drumHeight } = useControls({
    fov: {
      value: 70,
      min: 10,
      max: 180,
      step: 1,
    },
    drumHeight: {
      value: 4.5,
      min: 0,
      max: 15,
      step: 0.01,
    },
  });

  return (
    <div className="relative h-full w-full">
      <Leva />
      <Canvas
        gl={{ toneMapping: THREE.ReinhardToneMapping }}
        camera={{ fov, position: [0.2, 7.3, -4.6] }}
      >
        <Environment
          files="/drum-kit/HDRI/victoria_sunset_4k.hdr"
          background
          ground={{
            height: 25,
            radius: 500,
            scale: 1000,
          }}
        />
        <ContactShadows />
        <OrbitControls
          target={[0, drumHeight, 0]}
          minPolarAngle={0}
          maxPolarAngle={Math.PI * 0.7}
        />
        <CameraRig />
        <Light />
        <Drumset drumHeight={drumHeight} />
      </Canvas>
    </div>
  );
}

function Light() {
  return (
    <>
      <ambientLight intensity={0.6} />
      <directionalLight position={[0, 0, 10]} intensity={1} />
    </>
  );
}

function CameraRig() {
  const { camera } = useThree();
  const { fov } = useControls({
    fov: { value: 70, min: 10, max: 180, step: 1 },
  });

  useEffect(() => {
    (camera as THREE.PerspectiveCamera).fov = fov;
    camera.updateProjectionMatrix();
  }, [fov, camera]);

  return null;
}
