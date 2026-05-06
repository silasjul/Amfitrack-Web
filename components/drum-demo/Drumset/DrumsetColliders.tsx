import React from "react";
import FloorTom from "./Colliders/FloorTom";
import Snare from "./Colliders/Snare";
import HiTom from "./Colliders/HiTom";
import MediumTom from "./Colliders/MediumTom";

export default function DrumsetColliders({ isDebug = false }: { isDebug?: boolean }) {
  return (
    <group>
      <FloorTom isDebug={isDebug} />
      <Snare isDebug={isDebug} />
      <HiTom isDebug={isDebug} />
      <MediumTom isDebug={isDebug} />
    </group>
  );
}
