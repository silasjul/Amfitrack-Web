import React from "react";
import DrumCollider from "./DrumCollider";

export default function HiTom({ isDebug = false }: { isDebug?: boolean }) {
  return (
    <DrumCollider
      isDebug={isDebug}
      px={37.43}
      py={74.24}
      pz={84.47}
      rx={-0.8}
      ry={-0.06}
      rz={0.08}
      bodyRadius={19.67}
      bodyHeight={23.25}
      skinRadiusOffset={-1.3}
      skinHeightAbove={-1.82}
      skinThickness={2.92}
      rimCount={21}
      rimRadiusOffset={-0.94}
      rimBoxW={5.82}
      rimBoxH={4.1}
      rimBoxD={1.3}
    />
  );
}
