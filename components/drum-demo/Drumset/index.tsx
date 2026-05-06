import useEnableModelShadow from "@/hooks/useEnableModelShadow";
import { Center, useGLTF } from "@react-three/drei";
import React, { useEffect, useMemo } from "react";
import * as THREE from "three";
import DrumsetColliders from "./DrumsetColliders";

useGLTF.preload("/drum-kit/drumset.glb");

export default function Drumset({
  drumHeight,
  isDebug = false,
}: {
  drumHeight: number;
  isDebug?: boolean;
}) {
  const { scene } = useGLTF("/drum-kit/drumset.glb");
  const clone = useMemo(() => scene.clone(), [scene]);
  useEnableModelShadow(clone);

  return (
    <group position={[0, drumHeight, 0]} scale={0.045} rotation-y={Math.PI}>
      <primitive object={clone} />
      <DrumsetColliders isDebug={isDebug} />
    </group>
  );
}
