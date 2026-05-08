"use client";

import { Physics } from "@react-three/cannon";
import { Canvas, useThree } from "@react-three/fiber";
import * as THREE from "three";
import React, { useEffect, useRef } from "react";
import Drumset from "@/components/drum-demo/Drumset";
import { ContactShadows, Environment, OrbitControls } from "@react-three/drei";
import { button, folder, Leva, useControls } from "leva";
import Drumstick from "@/components/drum-demo/Drumstick";
import DrumAudioListener from "@/components/drum-demo/DrumAudioListener";
import useTxIds from "@/hooks/useTxIds";
import { useDrumDemoStore } from "@/stores/useDrumDemoStore";
import { useDrumAudioThresholdsStore } from "@/stores/useDrumAudioThresholdsStore";

const GL_PROPS = { toneMapping: THREE.ReinhardToneMapping };
const CAMERA_POSITION: [number, number, number] = [0.2, 7.3, -4.6];

export default function Home() {
  const { sensorTxIds } = useTxIds();
  const resetRefs = useRef<Array<() => void>>([]);
  const setIsDebug = useDrumDemoStore((s) => s.setIsDebug);
  const setDrumHeight = useDrumDemoStore((s) => s.setDrumHeight);
  const setTopNormalDeg = useDrumAudioThresholdsStore((s) => s.setTopNormalDeg);
  const setRimRadiusPct = useDrumAudioThresholdsStore((s) => s.setRimRadiusPct);
  const setSnareCenterPct = useDrumAudioThresholdsStore(
    (s) => s.setSnareCenterPct,
  );
  const setRimshotAngleDeg = useDrumAudioThresholdsStore(
    (s) => s.setRimshotAngleDeg,
  );

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
    topNormalDeg,
    rimRadiusPct,
    snareCenterPct,
    rimshotAngleDeg,
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
    isDebug: { value: true, label: "Show Colliders" },
    resetAllCenters: button(() => resetRefs.current.forEach((fn) => fn())),
    Environment: folder(
      {
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
      },
      { collapsed: true },
    ),
    "Audio thresholds": folder(
      {
        topNormalDeg: {
          value: 85,
          min: 0,
          max: 90,
          step: 1,
          label: "Top angle (°)",
        },
        rimRadiusPct: {
          value: 0.90,
          min: 0,
          max: 1,
          step: 0.01,
          label: "Rim radius %",
        },
        snareCenterPct: {
          value: 0.45,
          min: 0,
          max: 1,
          step: 0.01,
          label: "Snare center %",
        },
        rimshotAngleDeg: {
          value: 60,
          min: 0,
          max: 90,
          step: 1,
          label: "Rimshot angle (°)",
        },
      },
      { collapsed: true },
    ),
    ContactShadows: folder(
      {
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
      },
      { collapsed: true },
    ),
  });

  useEffect(() => {
    setIsDebug(isDebug);
  }, [isDebug, setIsDebug]);

  useEffect(() => {
    setDrumHeight(drumHeight);
  }, [drumHeight, setDrumHeight]);

  useEffect(() => {
    setTopNormalDeg(topNormalDeg);
  }, [topNormalDeg, setTopNormalDeg]);

  useEffect(() => {
    setRimRadiusPct(rimRadiusPct);
  }, [rimRadiusPct, setRimRadiusPct]);

  useEffect(() => {
    setSnareCenterPct(snareCenterPct);
  }, [snareCenterPct, setSnareCenterPct]);

  useEffect(() => {
    setRimshotAngleDeg(rimshotAngleDeg);
  }, [rimshotAngleDeg, setRimshotAngleDeg]);

  return (
    <div className="relative h-full w-full">
      <Leva
        collapsed
        theme={{ sizes: { rootWidth: "400px", controlWidth: "full" } }}
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
          // minPolarAngle={0}
          // maxPolarAngle={Math.PI * 0.6}
          // maxDistance={10}
        />
        <CameraRig fov={fov} />
        <DrumAudioListener />
        <Light />
        <Physics gravity={[0, -9.81, 0]}>
          <Drumset drumHeight={drumHeight} />
          {sensorTxIds[0] && (
            <Drumstick
              sensorId={sensorTxIds[0]}
              onRegisterReset={(fn) => {
                resetRefs.current[0] = fn;
              }}
            />
          )}
          {sensorTxIds[1] && (
            <Drumstick
              sensorId={sensorTxIds[1]}
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
