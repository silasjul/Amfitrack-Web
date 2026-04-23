"use client";

import { useThree } from "@react-three/fiber";
import { useGizmoContext } from "@react-three/drei";
import { useState, useMemo } from "react";
import * as THREE from "three";
import { AXIS_X, AXIS_Y, AXIS_Z, GIZMO_LABEL_COLOR } from "./config";

const GIZMO_FONT = "bold 18px Inter var, Arial, sans-serif";

export function GizmoAxisBar({
  color,
  rotation,
  scale,
}: {
  color: string;
  rotation: [number, number, number];
  scale?: [number, number, number];
}) {
  return (
    <group rotation={rotation}>
      <mesh position={[0.4, 0, 0]}>
        <boxGeometry args={scale ?? [0.8, 0.05, 0.05]} />
        <meshBasicMaterial color={color} toneMapped={false} />
      </mesh>
    </group>
  );
}

export function GizmoAxisHead({
  position,
  color,
  label,
  labelColor,
  font,
  direction,
}: {
  position: [number, number, number];
  color: string;
  label?: string;
  labelColor: string;
  font: string;
  direction: THREE.Vector3;
}) {
  const gl = useThree((state) => state.gl);
  const { tweenCamera } = useGizmoContext();
  const [active, setActive] = useState(false);

  const texture = useMemo(() => {
    const canvas = document.createElement("canvas");
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext("2d")!;
    ctx.beginPath();
    ctx.arc(32, 32, 16, 0, 2 * Math.PI);
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();
    if (label) {
      ctx.font = font;
      ctx.textAlign = "center";
      ctx.fillStyle = labelColor;
      ctx.fillText(label, 32, 41);
    }
    return new THREE.CanvasTexture(canvas);
  }, [color, label, labelColor, font]);

  const spriteScale = (label ? 1 : 0.75) * (active ? 1.2 : 1);

  return (
    <sprite
      scale={spriteScale}
      position={position}
      onPointerOver={(e) => {
        e.stopPropagation();
        setActive(true);
      }}
      onPointerOut={(e) => {
        e.stopPropagation();
        setActive(false);
      }}
      onPointerDown={(e) => {
        e.stopPropagation();
        tweenCamera(direction);
      }}
    >
      <spriteMaterial
        map={texture}
        map-anisotropy={gl.capabilities.getMaxAnisotropy() || 1}
        alphaTest={0.3}
        opacity={label ? 1 : 0.75}
        toneMapped={false}
      />
    </sprite>
  );
}

const MIRRORED_AXES = [
  {
    label: "Y",
    color: AXIS_X,
    barRotation: [0, 0, Math.PI] as [number, number, number],
    headPos: [-1, 0, 0] as [number, number, number],
    dir: new THREE.Vector3(-1, 0, 0),
    negPos: [1, 0, 0] as [number, number, number],
    negDir: new THREE.Vector3(1, 0, 0),
  },
  {
    label: "Z",
    color: AXIS_Y,
    barRotation: [0, 0, Math.PI / 2] as [number, number, number],
    headPos: [0, 1, 0] as [number, number, number],
    dir: new THREE.Vector3(0, 1, 0),
    negPos: [0, -1, 0] as [number, number, number],
    negDir: new THREE.Vector3(0, -1, 0),
  },
  {
    label: "X",
    color: AXIS_Z,
    barRotation: [0, Math.PI / 2, 0] as [number, number, number],
    headPos: [0, 0, -1] as [number, number, number],
    dir: new THREE.Vector3(0, 0, -1),
    negPos: [0, 0, 1] as [number, number, number],
    negDir: new THREE.Vector3(0, 0, 1),
  },
];

export default function MirroredGizmoViewport() {
  return (
    <group scale={40}>
      {MIRRORED_AXES.map((axis) => (
        <group key={axis.label}>
          <GizmoAxisBar color={axis.color} rotation={axis.barRotation} />
          <GizmoAxisHead
            position={axis.headPos}
            color={axis.color}
            label={axis.label}
            labelColor={GIZMO_LABEL_COLOR}
            font={GIZMO_FONT}
            direction={axis.dir}
          />
          <GizmoAxisHead
            position={axis.negPos}
            color={axis.color}
            labelColor={GIZMO_LABEL_COLOR}
            font={GIZMO_FONT}
            direction={axis.negDir}
          />
        </group>
      ))}
    </group>
  );
}
