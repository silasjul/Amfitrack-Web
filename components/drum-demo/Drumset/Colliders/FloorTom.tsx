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
      skinRadiusOffset={-1.81}
      skinHeightAbove={-2.0}
      skinThickness={3.1}
      rimCount={30}
      rimRadiusOffset={-1.38}
      rimBoxW={5.8}
      rimBoxH={5.0}
      rimBoxD={1.02}
    />
  );
}
