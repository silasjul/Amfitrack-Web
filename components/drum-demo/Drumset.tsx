import useEnableModelShadow from "@/hooks/useEnableModelShadow";
import { Center, useGLTF } from "@react-three/drei";
import React, { useEffect } from "react";
import * as THREE from "three";

export default function Drumset({ drumHeight }: { drumHeight: number }) {
  const { scene } = useGLTF("/drum-kit/drumset.glb");
  useEnableModelShadow(scene);

  return (
    <group position={[0, drumHeight, 0]}>
      <Center>
        <group scale={0.045}>
          <primitive object={scene} />
        </group>
      </Center>
    </group>
  );
}
