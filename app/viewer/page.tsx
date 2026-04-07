"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import CoordinateSystem from "@/components/viewer/CoordinateSystem";
import SourceModel from "@/components/viewer/SourceModel";
import SensorModel from "@/components/viewer/SensorModel";
import { useAmfitrack } from "@/hooks/useAmfitrack";

export default function Home() {

  const sdk = useAmfitrack();

  return (
    <div className="h-full w-full text-emerald-500">
      <Canvas camera={{ position: [10, 8, 10], fov: 50 }}>
        <ambientLight intensity={0.6} />
        <directionalLight position={[-0.6, 7.3, -9.5]} intensity={1.3} />

        <CoordinateSystem />
        <SourceModel />
        <SensorModel />

        <OrbitControls makeDefault />
      </Canvas>
    </div>
  );
}
