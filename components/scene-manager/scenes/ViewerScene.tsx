"use client";

import { useRef } from "react";
import * as THREE from "three";
import { OrbitControls } from "@react-three/drei";
import CoordinateSystem from "@/components/viewer/coordinateSystem/CoordinateSystem";
import SourceModel from "@/components/viewer/SourceModel";
import SensorModels from "@/components/viewer/SensorModel";
import { useXR } from "@react-three/xr";

export default function ViewerScene() {
  const inXR = useXR((s) => s.mode != null);

  return (
    <>
      <Light />
      <CoordinateSystem />
      <SourceModel />
      <SensorModels />
      {!inXR && <OrbitControls makeDefault />}
    </>
  );
}

function Light() {
  const directionalLightRef = useRef<THREE.DirectionalLight>(null!);
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
