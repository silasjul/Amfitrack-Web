"use client";

import { Physics } from "@react-three/cannon";
import { Canvas, useThree } from "@react-three/fiber";
import * as THREE from "three";
import React, { useEffect, useRef } from "react";
import Drumset from "@/components/drum-demo/Drumset";
import { ContactShadows, Environment, OrbitControls } from "@react-three/drei";
import { button, folder, Leva, useControls } from "leva";
import Drumstick from "@/components/drum-demo/Drumstick";
import useTxIds from "@/hooks/useTxIds";

const GL_PROPS = { toneMapping: THREE.ReinhardToneMapping };
const CAMERA_POSITION: [number, number, number] = [0.2, 7.3, -4.6];

export default function Home() {
  const { sensorTxIds } = useTxIds();
  const resetRefs = useRef<Array<() => void>>([]);

  const {
    fov,
    drumHeight,
    isDebug,
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
      value: 0.23,
      min: 0,
      max: 1,
      step: 0.001,
    },
    Colliders: folder({
      isDebug: { value: true, label: "Show" },
    }),
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
    resetAllCenters: button(() => resetRefs.current.forEach((fn) => fn())),
  });

  return (
    <div className="relative h-full w-full">
      <Leva
        collapsed
        theme={{ sizes: { rootWidth: "500px", controlWidth: "360px" } }}
      />
      <Canvas shadows gl={GL_PROPS} camera={{ fov, position: CAMERA_POSITION }}>
        <Environment
          files={environment}
          background
          ground={{
            height: environmentHeight,
            radius: environmentRadius,
            scale: environmentScale,
          }}
          rotation-y={Math.PI}
        />
        <ContactShadows opacity={Opacity} blur={Blur} scale={15} far={Far} />
        <OrbitControls
          target={[0, drumHeight + 3.8, 0]}
          minPolarAngle={0}
          maxPolarAngle={Math.PI * 0.6}
          maxDistance={10}
        />
        <CameraRig fov={fov} />
        <Light />
        <Physics gravity={[0, -9.81, 0]}>
          <Drumset drumHeight={drumHeight} isDebug={isDebug} />
          {sensorTxIds[0] && (
            <Drumstick
              sensorId={sensorTxIds[0]}
              isDebug={isDebug}
              onRegisterReset={(fn) => {
                resetRefs.current[0] = fn;
              }}
            />
          )}
          {sensorTxIds[1] && (
            <Drumstick
              sensorId={sensorTxIds[1]}
              isDebug={isDebug}
              onRegisterReset={(fn) => {
                resetRefs.current[1] = fn;
              }}
            />
          )}
        </Physics>
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

function CameraRig({ fov }: { fov: number }) {
  const { camera } = useThree();

  useEffect(() => {
    (camera as THREE.PerspectiveCamera).fov = fov;
    camera.updateProjectionMatrix();
  }, [fov, camera]);

  return null;
}
