import React, { useRef } from "react";

import { Canvas } from "@react-three/fiber";
import { OrbitControls, useHelper, Stats } from "@react-three/drei";
import * as THREE from "three";
import CoordinateSystem from "@/components/viewer/coordinateSystem/CoordinateSystem";
import SourceModel from "@/components/viewer/SourceModel";
import SensorModels from "@/components/viewer/SensorModel";
import { Leva, useControls } from "leva";

export default function Viewer() {
  const cameraStartScale = 0.75;

  return (
    <div className="h-full w-full">
      {/* <Leva collapsed /> */}
      <Canvas
        camera={{
          position: [
            -1.3 * cameraStartScale,
            4.1 * cameraStartScale,
            8.9 * cameraStartScale,
          ],
          fov: 50,
        }}
      >
        {/* <Stats /> */}
        <Light />

        <CoordinateSystem />
        <SourceModel />
        <SensorModels />

        <OrbitControls makeDefault />
      </Canvas>
    </div>
  );
}

function Light() {
  const directionalLightRef = useRef<THREE.DirectionalLight>(null!);

  // const { lightPosition, showHelper } = useControls({
  //   lightPosition: {
  //     value: [-1.3, 4.1, 8.9],
  //     min: -10,
  //     max: 10,
  //     step: 0.1,
  //   },
  //   showHelper: {
  //     value: false,
  //   },
  // });

  // useHelper(directionalLightRef, (showHelper ? THREE.DirectionalLightHelper : null) as typeof THREE.DirectionalLightHelper, 1, "hotpink");

  return (
    <>
      <ambientLight intensity={0.6} />
      <directionalLight
        ref={directionalLightRef}
        position={[-1.3, 4.1, 8.9]}
        intensity={1.3}
      />
    </>
  );
}
