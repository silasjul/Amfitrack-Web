"use client";

import { Physics } from "@react-three/cannon";
import { useThree } from "@react-three/fiber";
import * as THREE from "three";
import React, { useEffect, useRef } from "react";
import Drumset from "@/components/drum-demo/Drumset";
import { ContactShadows, Environment, OrbitControls } from "@react-three/drei";
import { button, folder, useControls } from "leva";
import { XROrigin, useXR } from "@react-three/xr";
import Drumstick from "@/components/drum-demo/Drumstick";
import Shoe from "@/components/drum-demo/Shoe";
import DrumAudioListener from "@/components/drum-demo/DrumAudioListener";
import useTxIds from "@/hooks/useTxIds";
import { useDrumDemoStore } from "@/stores/useDrumDemoStore";
import { useDrumAudioThresholdsStore } from "@/stores/useDrumAudioThresholdsStore";

import { SCENE_CONFIGS } from "../sceneConfigs";

const CAMERA_POSITION = SCENE_CONFIGS["drum-kit"].camera.position;
const PLAYER_HEAD_HEIGHT = 1.6;
const XR_ORIGIN_POSITION: [number, number, number] = [
  -CAMERA_POSITION[0],
  CAMERA_POSITION[1] - PLAYER_HEAD_HEIGHT,
  -CAMERA_POSITION[2],
];

export default function DrumKitScene() {
  const { sensorTxIds } = useTxIds();
  const resetRefs = useRef<Array<() => void>>([]);
  const setIsDebug = useDrumDemoStore((s) => s.setIsDebug);
  const setDrumHeight = useDrumDemoStore((s) => s.setDrumHeight);
  const setTopNormalDeg = useDrumAudioThresholdsStore((s) => s.setTopNormalDeg);
  const setRimRadiusPct = useDrumAudioThresholdsStore((s) => s.setRimRadiusPct);
  const setSnareCenterPct = useDrumAudioThresholdsStore(
    (s) => s.setSnareCenterPct,
  );
  const setBellRadiusPct = useDrumAudioThresholdsStore(
    (s) => s.setBellRadiusPct,
  );
  const setHihatTipRadiusPct = useDrumAudioThresholdsStore(
    (s) => s.setHihatTipRadiusPct,
  );

  const {
    fov,
    drumHeight,
    isDebug,
    environmentHeight,
    environmentRadius,
    environmentScale,
    Opacity,
    Blur,
    Far,
    topNormalDeg,
    rimRadiusPct,
    snareCenterPct,
    bellRadiusPct,
    hihatTipRadiusPct,
  } = useControls("Drum Kit", {
    fov: { value: 70, min: 10, max: 180, step: 1 },
    drumHeight: { value: 0.23, min: 0, max: 1, step: 0.001 },
    isDebug: { value: false, label: "Show Colliders" },
    resetAllCenters: button(() => resetRefs.current.forEach((fn) => fn())),
    Environment: folder(
      {
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
          value: 0.9,
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
        bellRadiusPct: {
          value: 0.25,
          min: 0,
          max: 1,
          step: 0.01,
          label: "Ride bell radius %",
        },
        hihatTipRadiusPct: {
          value: 0.5,
          min: 0,
          max: 1,
          step: 0.01,
          label: "Hihat tip radius %",
        },
      },
      { collapsed: true },
    ),
    ContactShadows: folder(
      {
        Opacity: { value: 0.6, min: 0, max: 1, step: 0.01, label: "Opacity" },
        Blur: { value: 4.2, min: 0, max: 10, step: 0.1, label: "Blur" },
        Far: { value: 12, min: 0.1, max: 50, step: 0.1, label: "Far" },
      },
      { collapsed: true },
    ),
  });

  useEffect(() => setIsDebug(isDebug), [isDebug, setIsDebug]);
  useEffect(() => setDrumHeight(drumHeight), [drumHeight, setDrumHeight]);
  useEffect(
    () => setTopNormalDeg(topNormalDeg),
    [topNormalDeg, setTopNormalDeg],
  );
  useEffect(
    () => setRimRadiusPct(rimRadiusPct),
    [rimRadiusPct, setRimRadiusPct],
  );
  useEffect(
    () => setSnareCenterPct(snareCenterPct),
    [snareCenterPct, setSnareCenterPct],
  );
  useEffect(
    () => setBellRadiusPct(bellRadiusPct),
    [bellRadiusPct, setBellRadiusPct],
  );
  useEffect(
    () => setHihatTipRadiusPct(hihatTipRadiusPct),
    [hihatTipRadiusPct, setHihatTipRadiusPct],
  );

  return (
    <>
      <HdrEnvironment
        environmentHeight={environmentHeight}
        environmentRadius={environmentRadius}
        environmentScale={environmentScale}
      />
      <NotInXR>
        <ContactShadows opacity={Opacity} blur={Blur} scale={15} far={Far} />
      </NotInXR>
      <XROrigin position={XR_ORIGIN_POSITION} />
      <DesktopCameraControls target={[0, drumHeight + 3.8, 0]} fov={fov} />
      <DrumAudioListener />
      <ambientLight intensity={1} />
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
        {sensorTxIds[2] && (
          <Shoe
            sensorId={sensorTxIds[2]}
            onRegisterReset={(fn) => {
              resetRefs.current[2] = fn;
            }}
          />
        )}
      </Physics>
    </>
  );
}

function NotInXR({ children }: { children: React.ReactNode }) {
  const inXR = useXR((s) => s.mode != null);
  if (inXR) return null;
  return <>{children}</>;
}

function HdrEnvironment({
  environmentHeight,
  environmentRadius,
  environmentScale,
}: {
  environmentHeight: number;
  environmentRadius: number;
  environmentScale: number;
}) {
  const inXR = useXR((s) => s.mode != null);
  return (
    <Environment
      files={"/drum-kit/HDRI/ferndale_studio_11_4k.hdr"}
      background
      ground={
        inXR
          ? undefined
          : {
              height: environmentHeight,
              radius: environmentRadius,
              scale: environmentScale,
            }
      }
      rotation-y={inXR ? 0 : Math.PI}
    />
  );
}

function DesktopCameraControls({
  target,
  fov,
}: {
  target: [number, number, number];
  fov: number;
}) {
  const { camera } = useThree();
  const inXR = useXR((s) => s.mode != null);

  useEffect(() => {
    if (inXR) return;
    const cam = camera as THREE.PerspectiveCamera;
    cam.fov = fov;
    cam.updateProjectionMatrix();
  }, [fov, camera, inXR]);

  if (inXR) return null;
  return <OrbitControls target={target} />;
}
