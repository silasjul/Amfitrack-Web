import { Center, useGLTF } from "@react-three/drei";
import React from "react";

export default function Drumset({ drumHeight }: { drumHeight: number }) {
  const { scene } = useGLTF("/drum-kit/drumset.glb");
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
