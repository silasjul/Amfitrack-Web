import React from "react";
import DrumCollider from "./DrumCollider";

export default function Snare({ isDebug = false }: { isDebug?: boolean }) {
  return (
    <DrumCollider
      isDebug={isDebug}
      px={47.69}
      py={77.32}
      pz={-23.9}
      rx={-0.11}
      ry={0}
      rz={0.01}
      bodyRadius={26.71}
      bodyHeight={18.66}
      skinRadiusOffset={-1.82}
      skinHeightAbove={-2.0}
      skinThickness={3.62}
      rimCount={30}
      rimRadiusOffset={-1.38}
      rimBoxW={5.8}
      rimBoxH={5.0}
      rimBoxD={1.39}
    />
  );
}
