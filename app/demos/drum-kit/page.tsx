"use client";

import { Canvas, useThree } from "@react-three/fiber";
import * as THREE from "three";
import React, { useEffect } from "react";
import Drumset from "@/components/drum-demo/Drumset";
import { ContactShadows, Environment, OrbitControls } from "@react-three/drei";
import { folder, Leva, useControls } from "leva";
import Drumstick from "@/components/drum-demo/Drumstick";

export default function Home() {
  const {
    fov,
    drumHeight,
    environment,
    environmentHeight,
    environmentRadius,
    environmentScale,
    Opacity,
    Blur,
    Far,
  } = useControls({
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
    Environment: folder({
      environment: {
        value: "/drum-kit/HDRI/ferndale_studio_11_4k.hdr",
        options: {
          Studio: "/drum-kit/HDRI/ferndale_studio_11_4k.hdr",
          Desert: "/drum-kit/HDRI/kiara_1_dawn_4k.hdr",
        },
        label: "HDRI",
      },
      environmentHeight: {
        value: 7.6,
        min: 0,
        max: 30,
        step: 0.01,
        label: "Height",
      },
      environmentRadius: {
        value: 12,
        min: 0,
        max: 20,
        step: 1,
        label: "Radius",
      },
      environmentScale: {
        value: 500,
        min: 500,
        max: 1000,
        step: 1,
        label: "Scale",
      },
    }),
    ContactShadows: folder({
      Opacity: {
        value: 0.6,
        min: 0,
        max: 1,
        step: 0.01,
        label: "Opacity",
      },
      Blur: {
        value: 4.2,
        min: 0,
        max: 10,
        step: 0.1,
        label: "Blur",
      },
      Far: {
        value: 12,
        min: 0.1,
        max: 50,
        step: 0.1,
        label: "Far",
      },
    }),
  });

  return (
    <div className="relative h-full w-full">
      <Leva collapsed />
      <Canvas
        shadows
        gl={{ toneMapping: THREE.ReinhardToneMapping }}
        camera={{ fov, position: [0.2, 7.3, -4.6] }}
      >
        <Environment
          files={environment}
          background
          ground={{
            height: environmentHeight,
            radius: environmentRadius,
            scale: environmentScale,
          }}
        />
        <ContactShadows opacity={Opacity} blur={Blur} scale={15} far={Far} />
        <OrbitControls
          target={[0, drumHeight, 0]}
          minPolarAngle={0}
          maxPolarAngle={Math.PI * 0.7}
        />
        <CameraRig />
        <Light />
        <Drumset drumHeight={drumHeight} />
        <Drumstick />
      </Canvas>
    </div>
  );
}

function Light() {
  return (
    <>
      <ambientLight intensity={1} />
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
