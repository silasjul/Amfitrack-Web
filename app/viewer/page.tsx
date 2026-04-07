"use client";

import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import CoordinateSystem from "@/components/viewer/CoordinateSystem";
import SourceModel from "@/components/viewer/SourceModel";
import SensorModels from "@/components/viewer/SensorModel";

export default function Home() {
  return (
    <div className="h-full w-full text-emerald-500">
      <Canvas camera={{ position: [2, 3.5, -8], fov: 50 }}>
        <ambientLight intensity={0.6} />
        <directionalLight position={[-0.6, 7.3, -9.5]} intensity={1.3} />

        <CoordinateSystem />
        <SourceModel />
        <SensorModels />

        <OrbitControls makeDefault />
      </Canvas>
    </div>
  );
}
