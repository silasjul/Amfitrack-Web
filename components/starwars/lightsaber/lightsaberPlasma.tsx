"use client";

import * as THREE from "three";
import { useRef } from "react";
import { useControls, folder } from "leva";
import { useFrame } from "@react-three/fiber";
import { applyDistortionColor } from "@/lib/distortionColorLerp";

const COLOR_CLEAN = new THREE.Color("rgb(0, 255, 0)");
const COLOR_DISTORTED = new THREE.Color("rgb(255, 0, 0)");

export default function LightsaberPlasma({
  metalDistortionRef,
}: {
  metalDistortionRef: React.RefObject<number>;
}) {
  const materialRef = useRef<THREE.MeshBasicMaterial>(null);

  const { offset, length, radius } = useControls({
    lightsaber: folder({
      offset: {
        value: -0.9,
        min: -2,
        max: 0,
      },
      length: {
        value: 1.5,
        min: 0,
        max: 2,
      },
      radius: {
        value: 0.02,
        min: 0.001,
        max: 0.05,
      },
    }),
  });

  useFrame(() => {
    if (!materialRef.current) return;
    applyDistortionColor(
      materialRef.current,
      metalDistortionRef.current,
      COLOR_CLEAN,
      COLOR_DISTORTED,
      0.3,
    );
  });

  return (
    <mesh rotation-x={Math.PI / 2} position-z={offset}>
      <cylinderGeometry args={[radius, radius, length, 32, 32]} />
      <meshBasicMaterial ref={materialRef} color={COLOR_CLEAN} />
    </mesh>
  );
}
