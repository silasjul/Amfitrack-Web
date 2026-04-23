"use client";

import { useFrame } from "@react-three/fiber";
import { Grid, Text, GizmoHelper, Line } from "@react-three/drei";
import { useLayoutEffect, useRef } from "react";
import * as THREE from "three";
import type { Line2 } from "three-stdlib";
import MirroredGizmoViewport from "./MirroredGizmo";
import {
  PRIMARY,
  AXIS_X,
  AXIS_Y,
  AXIS_Z,
  AXIS_LENGTH,
  TEXT_DISTANCE,
} from "./config";

function biasMaterialAboveGrid(
  mat: THREE.Material | THREE.Material[] | undefined,
) {
  if (!mat) return;
  const mats = Array.isArray(mat) ? mat : [mat];
  for (const m of mats) {
    if (m && "polygonOffset" in m) {
      m.polygonOffset = true;
      m.polygonOffsetFactor = -1;
      m.polygonOffsetUnits = -1;
    }
  }
}

function AxisLine({
  start,
  end,
  color,
}: {
  start: [number, number, number];
  end: [number, number, number];
  color: string;
}) {
  const lineRef = useRef<Line2>(null!);
  useLayoutEffect(() => {
    biasMaterialAboveGrid(lineRef.current?.material);
  }, []);
  return (
    <Line
      ref={lineRef}
      toneMapped={false}
      points={[start, end]}
      color={color}
      lineWidth={2}
      renderOrder={1}
    />
  );
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
      fontSize={0.25}
      font="/fonts/inter-semibold.ttf"
      color={color}
      anchorX="center"
      anchorY="middle"
      renderOrder={2}
      onSync={(mesh) => biasMaterialAboveGrid(mesh.material)}
    >
      {label}
    </Text>
  );
}

export default function CoordinateSystem() {
  const gridRef = useRef<THREE.Mesh>(null);
  useLayoutEffect(() => {
    const m = gridRef.current?.material;
    if (m && !Array.isArray(m)) {
      // Grid still depth-tests (models occlude it) but does not write depth, so axis
      // labels can depth-test against the scene and sit visually above the grid.
      m.depthWrite = false;
    }
  }, []);

  return (
    <group position={[0, -0.27, 0]}>
      <Grid
        ref={gridRef}
        infiniteGrid
        cellSize={1}
        cellThickness={0.6}
        cellColor={PRIMARY}
        sectionSize={5}
        sectionThickness={1.5}
        sectionColor={PRIMARY}
        fadeDistance={30}
        fadeStrength={4}
        followCamera={false}
      />

      {/* Axis lines */}
      <AxisLine start={[0, 0, 0]} end={[-AXIS_LENGTH, 0, 0]} color={AXIS_X} />
      <AxisLine start={[0, 0, 0]} end={[0, AXIS_LENGTH, 0]} color={AXIS_Y} />
      <AxisLine start={[0, 0, 0]} end={[0, 0, -AXIS_LENGTH]} color={AXIS_Z} />

      {/* Axis labels */}
      <AxisLabel
        position={[0, 0, -AXIS_LENGTH - TEXT_DISTANCE]}
        label="X"
        color={AXIS_Z}
      />
      <AxisLabel
        position={[0, AXIS_LENGTH + TEXT_DISTANCE, 0]}
        label="Z"
        color={AXIS_Y}
      />
      <AxisLabel
        position={[-AXIS_LENGTH - TEXT_DISTANCE, 0, 0]}
        label="Y"
        color={AXIS_X}
      />

      <GizmoHelper alignment="bottom-right" margin={[80, 80]}>
        <MirroredGizmoViewport />
      </GizmoHelper>
    </group>
  );
}
