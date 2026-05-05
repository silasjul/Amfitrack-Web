import useEnableModelShadow from "@/hooks/useEnableModelShadow";
import { Center, useGLTF } from "@react-three/drei";
import React, { useEffect, useMemo } from "react";
import * as THREE from "three";

useGLTF.preload("/drum-kit/drumset.glb");

export default function Drumset({ drumHeight }: { drumHeight: number }) {
  const { scene } = useGLTF("/drum-kit/drumset.glb");
  const clone = useMemo(() => scene.clone(), [scene]);
  useEnableModelShadow(clone);

  return (
    <group position={[0, drumHeight, 0]} rotation-y={Math.PI}>
      <Center>
        <group scale={0.045}>
          <primitive object={clone  } />
        </group>
      </Center>
    </group>
  );
}
