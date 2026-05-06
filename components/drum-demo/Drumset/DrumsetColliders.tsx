import React from "react";
import FloorTom from "./Colliders/FloorTom";
import Snare from "./Colliders/Snare";
import { folder, useControls } from "leva";

export default function DrumsetColliders() {
  const { isDebug } = useControls({
    colliders: folder({
      isDebug: {
        value: true,
      },
    }),
  });

  return (
    <group>
      <FloorTom isDebug={isDebug} />
      <Snare isDebug={isDebug} />
    </group>
  );
}
