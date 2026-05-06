import { folder, useControls } from "leva";
import { Debug } from "@react-three/cannon";
import DrumColliderBody from "./DrumColliderBody";
import DrumColliderSkin from "./DrumColliderSkin";
import DrumColliderRim from "./DrumColliderRim";

interface DrumColliderProps {
  isDebug?: boolean;
  showLeva?: boolean;
  px?: number;
  py?: number;
  pz?: number;
  rx?: number;
  ry?: number;
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
  isDebug = false,
  showLeva = false,
  px: propPx = 0,
  py: propPy = 100,
  pz: propPz = 0,
  rx: propRx = 0,
  ry: propRy = 0,
  rz: propRz = 0,
  bodyRadius: propBodyRadius = 50,
  bodyHeight: propBodyHeight = 50,
  skinRadiusOffset: propSkinRadiusOffset = -2,
  skinHeightAbove: propSkinHeightAbove = -0.01,
  skinThickness: propSkinThickness = 2,
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
            px: { value: propPx, min: -200, max: 200, step: 0.001, label: "X" },
            py: { value: propPy, min: -100, max: 200, step: 0.001, label: "Y" },
            pz: { value: propPz, min: -200, max: 200, step: 0.001, label: "Z" },
            rx: {
              value: propRx,
              min: -Math.PI / 3,
              max: Math.PI / 3,
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
              min: -Math.PI / 3,
              max: Math.PI / 3,
              step: 0.001,
              label: "Rotation Z",
            },
          }),
          Body: folder({
            bodyRadius: {
              value: propBodyRadius,
              min: 15,
              max: 60,
              step: 0.001,
              label: "Radius",
            },
            bodyHeight: {
              value: propBodyHeight,
              min: 0.01,
              max: 100,
              step: 0.001,
              label: "Height",
            },
          }),
          Skin: folder({
            skinRadiusOffset: {
              value: propSkinRadiusOffset,
              min: -5,
              max: 0,
              step: 0.001,
              label: "Radius Offset",
            },
            skinHeightAbove: {
              value: propSkinHeightAbove,
              min: -2,
              max: 0,
              step: 0.001,
              label: "Y-Offset",
            },
            skinThickness: {
              value: propSkinThickness,
              min: 0.002,
              max: 10,
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
              min: -8,
              max: 8,
              step: 0.001,
              label: "Radius Offset",
            },
            rimBoxW: {
              value: propRimBoxW,
              min: 0,
              max: 30,
              step: 0.001,
              label: "Box Width (tangent)",
            },
            rimBoxH: {
              value: propRimBoxH,
              min: 0,
              max: 5,
              step: 0.001,
              label: "Box Height",
            },
            rimBoxD: {
              value: propRimBoxD,
              min: 0,
              max: 2,
              step: 0.001,
              label: "Box Depth (radial)",
            },
          }),
        }
      : {},
  ) as {
    px: number;
    py: number;
    pz: number;
    rx: number;
    ry: number;
    rz: number;
    bodyRadius: number;
    bodyHeight: number;
    skinRadiusOffset: number;
    skinHeightAbove: number;
    skinThickness: number;
    rimCount: number;
    rimRadiusOffset: number;
    rimBoxW: number;
    rimBoxH: number;
    rimBoxD: number;
  };

  const px = showLeva ? levaValues.px : propPx;
  const py = showLeva ? levaValues.py : propPy;
  const pz = showLeva ? levaValues.pz : propPz;
  const rx = showLeva ? levaValues.rx : propRx;
  const ry = showLeva ? levaValues.ry : propRy;
  const rz = showLeva ? levaValues.rz : propRz;
  const bodyRadius = showLeva ? levaValues.bodyRadius : propBodyRadius;
  const bodyHeight = showLeva ? levaValues.bodyHeight : propBodyHeight;
  const skinRadiusOffset = showLeva
    ? levaValues.skinRadiusOffset
    : propSkinRadiusOffset;
  const skinHeightAbove = showLeva
    ? levaValues.skinHeightAbove
    : propSkinHeightAbove;
  const skinThickness = showLeva ? levaValues.skinThickness : propSkinThickness;
  const rimCount = showLeva ? levaValues.rimCount : propRimCount;
  const rimRadiusOffset = showLeva
    ? levaValues.rimRadiusOffset
    : propRimRadiusOffset;
  const rimBoxW = showLeva ? levaValues.rimBoxW : propRimBoxW;
  const rimBoxH = showLeva ? levaValues.rimBoxH : propRimBoxH;
  const rimBoxD = showLeva ? levaValues.rimBoxD : propRimBoxD;

  const position: [number, number, number] = [px, py, pz];
  const rotation: [number, number, number] = [rx, ry, rz];

  const physicsKey = `${bodyRadius},${bodyHeight},${skinRadiusOffset},${skinHeightAbove},${skinThickness},${rimCount},${rimRadiusOffset},${rimBoxW},${rimBoxH},${rimBoxD},${px},${py},${pz},${rx},${ry},${rz}`;

  return (
    <group key={physicsKey} rotation={rotation}>
      <DrumColliderBody
        position={position}
        radius={bodyRadius}
        height={bodyHeight}
        isDebug={isDebug}
      />
      <DrumColliderSkin
        position={position}
        radius={bodyRadius + skinRadiusOffset}
        bodyHeight={bodyHeight}
        heightAbove={skinHeightAbove}
        thickness={skinThickness}
        isDebug={isDebug}
      />
      <DrumColliderRim
        position={position}
        radius={bodyRadius + rimRadiusOffset}
        bodyHeight={bodyHeight}
        count={Math.round(rimCount)}
        boxW={rimBoxW}
        boxH={rimBoxH}
        boxD={rimBoxD}
        isDebug={isDebug}
      />
    </group>
  );
}
