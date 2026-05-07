import useEnableModelShadow from "@/hooks/useEnableModelShadow";
import { Center, useGLTF } from "@react-three/drei";
import React, { useEffect, useMemo } from "react";
import * as THREE from "three";
import DrumsetColliders from "./DrumsetColliders";

useGLTF.preload("/drum-kit/drumset.glb");

export default function Drumset({ drumHeight }: { drumHeight: number }) {
  const { scene } = useGLTF("/drum-kit/drumset.glb");
  const clone = useMemo(() => scene.clone(), [scene]);
  useEnableModelShadow(clone);

  return (
    <group>
      <primitive
        position={[0, drumHeight, 0]}
        object={clone}
        scale={0.045}
        rotation-y={Math.PI}
      />
      <DrumsetColliders />
    </group>
  );
}
