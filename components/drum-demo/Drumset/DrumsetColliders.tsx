import React from "react";
import FloorTom from "./Colliders/FloorTom";
import Snare from "./Colliders/Snare";
import HiTom from "./Colliders/HiTom";
import MediumTom from "./Colliders/MediumTom";

export default function DrumsetColliders() {
  return (
    <group>
      <FloorTom />
      <Snare />
      <HiTom />
      <MediumTom />
    </group>
  );
}
