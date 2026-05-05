import React from "react";
import { folder, useControls } from "leva";
import FloorTomBody from "./FloorTomBody";
import FloorTomSkin from "./FloorTomSkin";
import FloorTomRim from "./FloorTomRim";

export default function FloorTom() {
  const {
    px, py, pz, ry,
    bodyRadius, bodyHeight,
    skinRadiusOffset, skinHeightAbove, skinThickness,
    rimCount, rimRadiusOffset, rimBoxW, rimBoxH, rimBoxD,
  } = useControls("FloorTom", {
    Position: folder({
      px: { value: 1.5, min: -5, max: 5, step: 0.01, label: "X" },
      py: { value: 0.85, min: -2, max: 5, step: 0.01, label: "Y" },
      pz: { value: 0.5, min: -5, max: 5, step: 0.01, label: "Z" },
      ry: { value: 0, min: -Math.PI, max: Math.PI, step: 0.01, label: "Rotation Y" },
    }),
    Body: folder({
      bodyRadius: { value: 0.22, min: 0.01, max: 1, step: 0.005, label: "Radius" },
      bodyHeight: { value: 0.28, min: 0.01, max: 2, step: 0.005, label: "Height" },
    }),
    Skin: folder({
      skinRadiusOffset: { value: -0.01, min: -0.1, max: 0.1, step: 0.001, label: "Radius Offset" },
      skinHeightAbove: { value: 0.01, min: 0, max: 0.1, step: 0.001, label: "Height Above" },
      skinThickness: { value: 0.01, min: 0.002, max: 0.05, step: 0.001, label: "Thickness" },
    }),
    Rim: folder({
      rimCount: { value: 12, min: 3, max: 24, step: 1, label: "Count" },
      rimRadiusOffset: { value: 0.005, min: -0.1, max: 0.2, step: 0.001, label: "Radius Offset" },
      rimBoxW: { value: 0.05, min: 0.005, max: 0.2, step: 0.005, label: "Box Width (tangent)" },
      rimBoxH: { value: 0.03, min: 0.005, max: 0.2, step: 0.005, label: "Box Height" },
      rimBoxD: { value: 0.02, min: 0.005, max: 0.2, step: 0.005, label: "Box Depth (radial)" },
    }),
  });

  const position: [number, number, number] = [px, py, pz];
  const rotation: [number, number, number] = [0, ry, 0];

  // key forces remount of physics bodies when cannon args change (size, count)
  const physicsKey = `${bodyRadius},${bodyHeight},${skinRadiusOffset},${skinHeightAbove},${skinThickness},${rimCount},${rimRadiusOffset},${rimBoxW},${rimBoxH},${rimBoxD},${px},${py},${pz},${ry}`;

  return (
    <React.Fragment key={physicsKey}>
      <FloorTomBody
        position={position}
        rotation={rotation}
        radius={bodyRadius}
        height={bodyHeight}
      />
      <FloorTomSkin
        position={position}
        rotation={rotation}
        radius={bodyRadius + skinRadiusOffset}
        bodyHeight={bodyHeight}
        heightAbove={skinHeightAbove}
        thickness={skinThickness}
      />
      <FloorTomRim
        position={position}
        rotation={rotation}
        radius={bodyRadius + rimRadiusOffset}
        bodyHeight={bodyHeight}
        count={Math.round(rimCount)}
        boxW={rimBoxW}
        boxH={rimBoxH}
        boxD={rimBoxD}
      />
    </React.Fragment>
  );
}
