import React from "react";
import FloorTom from "./Colliders/FloorTom";
import Snare from "./Colliders/Snare";
import { folder, useControls } from "leva";
import HiTom from "./Colliders/HiTom";

export default function DrumsetColliders() {
  const { isDebug } = useControls({
    colliders: folder({
      isDebug: {
        value: true,
        label: "Show",
      },
    }),
  });

  return (
    <group>
      <FloorTom isDebug={isDebug} />
      <Snare isDebug={isDebug} />
      <HiTom isDebug={isDebug} />
    </group>
  );
}
