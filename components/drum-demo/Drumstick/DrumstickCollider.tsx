import { folder, useControls } from "leva";
import { ReactNode } from "react";
import DrumstickCompoundBody from "./DrumstickCompoundBody";
import * as THREE from "three";
interface DrumstickColliderProps {
  sensorPointRef?: React.RefObject<THREE.Mesh>;
  px?: number;
  py?: number;
  pz?: number;
  rx?: number;
  ry?: number;
  rz?: number;
  bodyRadius?: number;
  bodyLength?: number;
  bodyOffsetZ?: number;
  tipRadius?: number;
  tipOffsetZ?: number;
  children?: ReactNode;
}

export default function DrumstickCollider({
  sensorPointRef,
  px: propPx = 0,
  py: propPy = 0,
  pz: propPz = 0,
  rx: propRx = 0,
  ry: propRy = 0,
  rz: propRz = 0,
  bodyRadius: propBodyRadius = 0.012,
  bodyLength: propBodyLength = 0.3,
  bodyOffsetZ: propBodyOffsetZ = -0.1,
  tipRadius: propTipRadius = 0.02,
  tipOffsetZ: propTipOffsetZ = 0.2,
  children,
}: DrumstickColliderProps) {
  const {
    px,
    py,
    pz,
    rx,
    ry,
    rz,
    bodyRadius,
    bodyLength,
    bodyOffsetZ,
    tipRadius,
    tipOffsetZ,
  } = useControls("DrumstickCollider", {
    Position: folder({
      px: { value: propPx, min: -1, max: 1, step: 0.001, label: "X" },
      py: { value: propPy, min: -1, max: 1, step: 0.001, label: "Y" },
      pz: { value: propPz, min: -1, max: 1, step: 0.001, label: "Z" },
      rx: {
        value: propRx,
        min: -Math.PI,
        max: Math.PI,
        step: 0.001,
        label: "Rotation X",
      },
      ry: {
        value: propRy,
        min: -Math.PI,
        max: Math.PI,
        step: 0.001,
        label: "Rotation Y",
      },
      rz: {
        value: propRz,
        min: -Math.PI,
        max: Math.PI,
        step: 0.001,
        label: "Rotation Z",
      },
    }),
    Body: folder({
      bodyRadius: {
        value: propBodyRadius,
        min: 0.001,
        max: 0.1,
        step: 0.001,
        label: "Radius",
      },
      bodyLength: {
        value: propBodyLength,
        min: 0.01,
        max: 10,
        step: 0.001,
        label: "Length",
      },
      bodyOffsetZ: {
        value: propBodyOffsetZ,
        min: -1.4,
        max: 1.4,
        step: 0.001,
        label: "Z Offset",
      },
    }),
    Tip: folder({
      tipRadius: {
        value: propTipRadius,
        min: 0.001,
        max: 0.1,
        step: 0.001,
        label: "Radius",
      },
      tipOffsetZ: {
        value: propTipOffsetZ,
        min: -2,
        max: -1,
        step: 0.001,
        label: "Z Offset",
      },
    }),
  }, { collapsed: true });

  const physicsKey = `${px},${py},${pz},${rx},${ry},${rz},${bodyRadius},${bodyLength},${bodyOffsetZ},${tipRadius},${tipOffsetZ}`;

  return (
    <group key={physicsKey}>
      <DrumstickCompoundBody
        sensorPointRef={sensorPointRef}
        position={[px, py, pz]}
        rotation={[rx, ry, rz]}
        bodyRadius={bodyRadius}
        bodyLength={bodyLength}
        bodyOffsetZ={bodyOffsetZ}
        tipRadius={tipRadius}
        tipOffsetZ={tipOffsetZ}
      >
        {children}
      </DrumstickCompoundBody>
    </group>
  );
}
