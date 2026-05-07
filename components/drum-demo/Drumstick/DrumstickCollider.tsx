import { folder, useControls } from "leva";
import { ReactNode } from "react";
import DrumstickCompoundBody from "./DrumstickCompoundBody";

interface DrumstickColliderProps {
  showLeva?: boolean;
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
  showLeva = false,
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
  const levaValues = useControls(
    "DrumstickCollider",
    showLeva
      ? {
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
        }
      : {},
  ) as any;

  const px = showLeva ? levaValues.px : propPx;
  const py = showLeva ? levaValues.py : propPy;
  const pz = showLeva ? levaValues.pz : propPz;
  const rx = showLeva ? levaValues.rx : propRx;
  const ry = showLeva ? levaValues.ry : propRy;
  const rz = showLeva ? levaValues.rz : propRz;
  const bodyRadius = showLeva ? levaValues.bodyRadius : propBodyRadius;
  const bodyLength = showLeva ? levaValues.bodyLength : propBodyLength;
  const bodyOffsetZ = showLeva ? levaValues.bodyOffsetZ : propBodyOffsetZ;
  const tipRadius = showLeva ? levaValues.tipRadius : propTipRadius;
  const tipOffsetZ = showLeva ? levaValues.tipOffsetZ : propTipOffsetZ;

  const physicsKey = `${px},${py},${pz},${rx},${ry},${rz},${bodyRadius},${bodyLength},${bodyOffsetZ},${tipRadius},${tipOffsetZ}`;

  return (
    <group key={physicsKey}>
      <DrumstickCompoundBody
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
