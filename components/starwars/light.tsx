"use client";

import * as THREE from "three";
import { useRef, useEffect } from "react";
import { useHelper } from "@react-three/drei";
import { useControls, folder } from "leva";

export default function Light() {
  const directionalLightRef = useRef<THREE.DirectionalLight>(null!);

  const { position, color, intensity, castShadow, showHelper, resolution } = useControls({
    light: folder({
      color: {
        value: "#fff5e1"
      },
      castShadow: {
        value: true,
      },
      intensity: {
        value: 3,
        min: 0,
        max: 10,
        step: 0.1,
      },
      position: {
        value: [-7.9, 7.8, 1.1],
        min: -10, max: 10, step: 0.1
      },
      resolution: {
        value: 8192,
        options: [128, 256, 512, 1024, 2048, 4096, 8192],
      },
      showHelper: {
        value: false,
      },
    }),
  });

  useHelper(directionalLightRef, (showHelper ? THREE.DirectionalLightHelper : null) as typeof THREE.DirectionalLightHelper, 1, "hotpink");

  useEffect(() => {
    const light = directionalLightRef.current
    if (light.shadow.map) {
      light.shadow.map.dispose()
      light.shadow.map = null
    }
  }, [resolution])

  return (
    <>
      <directionalLight
        ref={directionalLightRef}
        position={position}
        color={color}
        intensity={intensity}
        castShadow={castShadow}
        shadow-mapSize={[resolution, resolution]}
        shadow-camera-near={0.1}
        shadow-camera-far={20}
        shadow-camera-top={1}
        shadow-camera-right={1}
        shadow-camera-bottom={-1}
        shadow-camera-left={-1}
      />
    </>
  );
}
