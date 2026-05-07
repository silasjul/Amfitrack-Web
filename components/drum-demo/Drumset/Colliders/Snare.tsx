import React from "react";
import DrumCollider from "./DrumCollider";

export default function Snare() {
  return (
    <DrumCollider
      px={-2.14}
      py={3.56}
      pz={1.44}
      rx={0.1}
      rz={-0.01}
      bodyRadius={1.16}
      bodyHeight={0.88}
      skinRadiusOffset={-0.04}
      skinHeightAbove={-0.01}
      skinThickness={0.09}
      rimCount={25}
      rimRadiusOffset={-0.02}
      rimBoxW={0.3}
      rimBoxH={0.23}
      rimBoxD={0.07}
    />
  );
}
