import React from "react";
import DrumCollider from "./DrumCollider";

export default function FloorTom() {
  return (
    <DrumCollider
      px={2.19}
      py={2.48}
      pz={1.68}
      rx={0}
      rz={0}
      bodyRadius={1.34}
      bodyHeight={2.64}
      skinRadiusOffset={-0.08}
      skinHeightAbove={-0.08}
      skinThickness={0.11}
      rimCount={30}
      rimRadiusOffset={-0.06}
      rimBoxW={0.28}
      rimBoxH={0.17}
      rimBoxD={0.07}
    />
  );
}
