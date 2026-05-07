import React, { useRef } from "react";
import { button, folder, useControls } from "leva";
import DrumColliderBody from "./DrumColliderBody";
import DrumColliderSkin from "./DrumColliderSkin";
import DrumColliderRim from "./DrumColliderRim";

interface DrumColliderProps {
  showLeva?: boolean;
  px?: number;
  py?: number;
  pz?: number;
  rx?: number;
  rz?: number;
  bodyRadius?: number;
  bodyHeight?: number;
  skinRadiusOffset?: number;
  skinHeightAbove?: number;
  skinThickness?: number;
  rimCount?: number;
  rimRadiusOffset?: number;
  rimBoxW?: number;
  rimBoxH?: number;
  rimBoxD?: number;
}

export default function DrumCollider({
  showLeva = false,
  px: propPx = 0,
  py: propPy = 100,
  pz: propPz = 0,
  rx: propRx = 0,
  rz: propRz = 0,
  bodyRadius: propBodyRadius = 50,
  bodyHeight: propBodyHeight = 50,
  skinRadiusOffset: propSkinRadiusOffset = 0,
  skinHeightAbove: propSkinHeightAbove = 0,
  skinThickness: propSkinThickness = 0,
  rimCount: propRimCount = 15,
  rimRadiusOffset: propRimRadiusOffset = 4,
  rimBoxW: propRimBoxW = 15,
  rimBoxH: propRimBoxH = 2.5,
  rimBoxD: propRimBoxD = 1,
}: DrumColliderProps) {
  const levaValues = useControls(
    "DrumCollider",
    showLeva
      ? {
          Position: folder({
            px: { value: propPx, min: -5, max: 5, step: 0.001, label: "X" },
            py: { value: propPy, min: -5, max: 8, step: 0.001, label: "Y" },
            pz: { value: propPz, min: -6, max: 5, step: 0.001, label: "Z" },
            rx: {
              value: propRx,
              min: -Math.PI / 3,
              max: Math.PI / 3,
              step: 0.001,
              label: "Rotation X",
            },
            rz: {
              value: propRz,
              min: -Math.PI / 3,
              max: Math.PI / 3,
              step: 0.001,
              label: "Rotation Z",
            },
          }),
          Body: folder({
            bodyRadius: {
              value: propBodyRadius,
              min: 0.5,
              max: 4,
              step: 0.001,
              label: "Radius",
            },
            bodyHeight: {
              value: propBodyHeight,
              min: 0.01,
              max: 5,
              step: 0.001,
              label: "Height",
            },
          }),
          Skin: folder({
            skinRadiusOffset: {
              value: propSkinRadiusOffset,
              min: -1,
              max: 0,
              step: 0.001,
              label: "Radius Offset",
            },
            yOffset: {
              value: propSkinHeightAbove,
              min: -1,
              max: 0,
              step: 0.001,
              label: "Y-Offset",
            },
            skinThickness: {
              value: propSkinThickness,
              min: 0.002,
              max: 1,
              step: 0.001,
              label: "Height",
            },
          }),
          Rim: folder({
            rimCount: {
              value: propRimCount,
              min: 3,
              max: 30,
              step: 1,
              label: "Count",
            },
            rimRadiusOffset: {
              value: propRimRadiusOffset,
              min: -2,
              max: 2,
              step: 0.001,
              label: "Radius Offset",
            },
            rimBoxW: {
              value: propRimBoxW,
              min: 0,
              max: 1.5,
              step: 0.001,
              label: "Box Width (tangent)",
            },
            rimBoxH: {
              value: propRimBoxH,
              min: 0,
              max: 1,
              step: 0.001,
              label: "Box Height",
            },
            rimBoxD: {
              value: propRimBoxD,
              min: 0,
              max: 0.75,
              step: 0.001,
              label: "Box Depth (radial)",
            },
          }),
        }
      : {},
  ) as any;

  const currentDebugValuesRef = useRef<any>(null);

  useControls(
    "DrumCollider",
    showLeva
      ? {
          Debug: folder({
            logValues: button(() => {
              console.log(
                "[DrumCollider values]",
                currentDebugValuesRef.current,
              );
            }),
          }),
        }
      : {},
  );

  const px = showLeva ? levaValues.px : propPx;
  const py = showLeva ? levaValues.py : propPy;
  const pz = showLeva ? levaValues.pz : propPz;
  const rx = showLeva ? levaValues.rx : propRx;
  const rz = showLeva ? levaValues.rz : propRz;
  const bodyRadius = showLeva ? levaValues.bodyRadius : propBodyRadius;
  const bodyHeight = showLeva ? levaValues.bodyHeight : propBodyHeight;
  const skinRadiusOffset = showLeva
    ? levaValues.skinRadiusOffset
    : propSkinRadiusOffset;
  const yOffset = showLeva ? levaValues.yOffset : propSkinHeightAbove;
  const skinThickness = showLeva ? levaValues.skinThickness : propSkinThickness;
  const rimCount = showLeva ? levaValues.rimCount : propRimCount;
  const rimRadiusOffset = showLeva
    ? levaValues.rimRadiusOffset
    : propRimRadiusOffset;
  const rimBoxW = showLeva ? levaValues.rimBoxW : propRimBoxW;
  const rimBoxH = showLeva ? levaValues.rimBoxH : propRimBoxH;
  const rimBoxD = showLeva ? levaValues.rimBoxD : propRimBoxD;

  const position: [number, number, number] = [px, py, pz];
  const rotation: [number, number, number] = [rx, 0, rz];

  currentDebugValuesRef.current = {
    px,
    py,
    pz,
    rx,
    rz,
    position,
    rotation,
    bodyRadius,
    bodyHeight,
    skinRadiusOffset,
    yOffset,
    skinThickness,
    rimCount,
    rimRadiusOffset,
    rimBoxW,
    rimBoxH,
    rimBoxD,
  };

  const physicsKey = `${bodyRadius},${bodyHeight},${skinRadiusOffset},${yOffset},${skinThickness},${rimCount},${rimRadiusOffset},${rimBoxW},${rimBoxH},${rimBoxD},${px},${py},${pz},${rx},${rz}`;

  return (
    <group key={physicsKey}>
      <DrumColliderBody
        position={position}
        rotation={rotation}
        radius={bodyRadius}
        height={bodyHeight}
      />
      <DrumColliderSkin
        position={position}
        rotation={rotation}
        radius={bodyRadius + skinRadiusOffset}
        bodyHeight={bodyHeight}
        heightAbove={yOffset}
        thickness={skinThickness}
      />
      <DrumColliderRim
        position={position}
        rotation={rotation}
        radius={bodyRadius + rimRadiusOffset}
        bodyHeight={bodyHeight}
        count={Math.round(rimCount)}
        boxW={rimBoxW}
        boxH={rimBoxH}
        boxD={rimBoxD}
      />
    </group>
  );
}
