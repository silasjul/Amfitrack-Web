"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import {
  OrbitControls,
  Grid,
  Text,
  GizmoHelper,
  GizmoViewport,
  Line,
} from "@react-three/drei";
import { useRef } from "react";
import * as THREE from "three";

const PRIMARY = "#1d4ed8";
const AXIS_X = "#ef4444";
const AXIS_Y = "#22c55e";
const AXIS_Z = "#3b82f6";
const AXIS_LENGTH = 3;

function AxisLine({
  start,
  end,
  color,
}: {
  start: [number, number, number];
  end: [number, number, number];
  color: string;
}) {
  return <Line points={[start, end]} color={color} lineWidth={2} />;
}

function AxisLabel({
  position,
  label,
  color,
}: {
  position: [number, number, number];
  label: string;
  color: string;
}) {
  const ref = useRef<THREE.Mesh>(null!);
  useFrame(({ camera }) => {
    ref.current.quaternion.copy(camera.quaternion);
  });
  return (
    <Text
      ref={ref}
      position={position}
      fontSize={0.4}
      color={color}
      fontWeight={700}
      anchorX="center"
      anchorY="middle"
    >
      {label}
    </Text>
  );
}

function CoordinateSystem() {
  return (
    <>
      <Grid
        infiniteGrid
        cellSize={1}
        cellThickness={0.6}
        cellColor="#ffffff"
        sectionSize={5}
        sectionThickness={1.5}
        sectionColor={PRIMARY}
        fadeDistance={30}
        fadeStrength={4}
        followCamera={false}
      />

      {/* Axis lines */}
      <AxisLine start={[0, 0, 0]} end={[AXIS_LENGTH, 0, 0]} color={AXIS_X} />
      <AxisLine start={[0, 0, 0]} end={[0, AXIS_LENGTH, 0]} color={AXIS_Y} />
      <AxisLine start={[0, 0, 0]} end={[0, 0, AXIS_LENGTH]} color={AXIS_Z} />

      {/* Axis labels — always face camera */}
      <AxisLabel position={[AXIS_LENGTH + 0.5, 0, 0]} label="X" color={AXIS_X} />
      <AxisLabel position={[0, AXIS_LENGTH + 0.5, 0]} label="Y" color={AXIS_Y} />
      <AxisLabel position={[0, 0, AXIS_LENGTH + 0.5]} label="Z" color={AXIS_Z} />

      <GizmoHelper alignment="bottom-right" margin={[80, 80]}>
        <GizmoViewport
          axisColors={[AXIS_X, AXIS_Y, AXIS_Z]}
          labelColor="white"
        />
      </GizmoHelper>
    </>
  );
}

export default function Home() {
  return (
    <div className="h-full w-full text-emerald-500">
      <Canvas camera={{ position: [10, 8, 10], fov: 50 }}>
        <ambientLight intensity={0.6} />
        <pointLight position={[10, 10, 10]} intensity={0.4} />

        <CoordinateSystem />

        <OrbitControls makeDefault />
      </Canvas>
    </div>
  );
}
