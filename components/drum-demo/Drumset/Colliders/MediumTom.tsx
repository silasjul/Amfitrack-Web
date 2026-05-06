import React from "react";
import DrumCollider from "./DrumCollider";

export default function MediumTom({ isDebug = false }: { isDebug?: boolean }) {
  return (
    <DrumCollider
      isDebug={isDebug}
      px={-51.9}
      py={68.65}
      pz={79.5}
      rx={-0.81}
      ry={0.27}
      rz={-0.11}
      bodyRadius={23.55}
      bodyHeight={28.79}
      skinRadiusOffset={-1.53}
      skinHeightAbove={-1.56}
      skinThickness={2.82}
      rimCount={25}
      rimRadiusOffset={-1.0}
      rimBoxW={5.99}
      rimBoxH={4.68}
      rimBoxD={1.4}
    />
  );
}
