import React from "react";
import DrumCollider from "./DrumCollider";

export default function FloorTom() {
  return (
    <DrumCollider
      showLeva={true}
      px={0}
      py={0}
      pz={0}
      rx={0}
      rz={0}
      bodyRadius={5}
      bodyHeight={5}
      skinRadiusOffset={0}
      skinHeightAbove={0}
      skinThickness={0}
      rimCount={10}
      rimRadiusOffset={0}
      rimBoxW={2}
      rimBoxH={2}
      rimBoxD={2}
    />
  );
}
