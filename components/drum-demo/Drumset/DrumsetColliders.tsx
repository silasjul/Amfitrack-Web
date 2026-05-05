import React from "react";
import FloorTom from "./Colliders/FloorTom";
import { Debug } from "@react-three/cannon";

const IS_DEBUGGING = true;

function DrumsetCollidersGroup() {
  return (
    <group>
      <FloorTom />
    </group>
  );
}

export default function DrumsetColliders() {
  if (IS_DEBUGGING)
    return (
      <Debug>
        <DrumsetCollidersGroup />
      </Debug>
    );

  return <DrumsetColliders />;
}
