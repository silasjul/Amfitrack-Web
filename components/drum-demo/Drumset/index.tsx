import React from "react";
import { Model } from "./Drumset";
import DrumsetColliders from "./DrumsetColliders";

export default function Drumset({ drumHeight }: { drumHeight: number }) {
  return (
    <group>
      <Model position={[0, drumHeight, 0]} scale={0.045} rotation-y={Math.PI} />
      <DrumsetColliders />
    </group>
  );
}
