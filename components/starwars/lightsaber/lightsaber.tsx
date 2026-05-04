"use client";

import { useGLTF, Center } from "@react-three/drei";
import LightsaberPlasma from "./lightsaberPlasma";

export default function Lightsaber({ metalDistortionRef }: { metalDistortionRef: React.RefObject<number> }) {
  const { scene } = useGLTF("/models/starwars/lightsaber/scene.gltf");

  return (
    <>
      <LightsaberPlasma metalDistortionRef={metalDistortionRef} />
      <Center>
        <primitive object={scene} scale={0.3} rotation-y={Math.PI / 2} />
      </Center>
    </>
  );
}
