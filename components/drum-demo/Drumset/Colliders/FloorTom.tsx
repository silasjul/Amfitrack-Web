import React from "react";
import DrumCollider from "./DrumCollider";

export default function FloorTom({ isDebug = false }: { isDebug?: boolean }) {
  return (
    <DrumCollider
      isDebug={isDebug}
      px={-48.5}
      py={50.5}
      pz={-37}
      rx={0}
      ry={0}
      rz={0}
      bodyRadius={30.26}
      bodyHeight={57.13}
      skinRadiusOffset={-2.05}
      skinHeightAbove={-1.82}
      skinThickness={3.43}
      rimCount={30}
      rimRadiusOffset={-1.38}
      rimBoxW={5.8}
      rimBoxH={5.0}
      rimBoxD={1.02}
    />
  );
}
