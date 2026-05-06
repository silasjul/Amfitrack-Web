import React from "react";
import DrumCollider from "./Colliders/DrumCollider";
import { Debug } from "@react-three/cannon";
import FloorTom from "./Colliders/FloorTom";
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
    </group>
  );
}
