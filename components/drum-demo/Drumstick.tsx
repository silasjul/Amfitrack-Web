import useEnableModelShadow from "@/hooks/useEnableModelShadow";
import { useSensorSync } from "@/hooks/useSensorSync";
import useTxIds from "@/hooks/useTxIds";
import { Center, useGLTF } from "@react-three/drei";
import { folder, useControls } from "leva";
import React, { useRef } from "react";
import * as THREE from "three";

export default function Drumstick() {
  const { sensorTxIds } = useTxIds();
  const groupRef = useRef<THREE.Group>(null);
  const { scene } = useGLTF("/drum-kit/drumstick.glb");
  useEnableModelShadow(scene);
  useSensorSync(groupRef, sensorTxIds[0]);

  const { positionY, scale } = useControls({
    drumstick: folder({
      positionY: {
        value: 0,
        min: -2,
        max: 2,
        step: 0.001,
      },
      scale: {
        value: 0.025,
        min: 0.01,
        max: 0.05,
        step: 0.0001,
      },
    }),
  });

  return (
    <group ref={groupRef}>
      <Center>
        <primitive object={scene} position-y={positionY} scale={scale} />
      </Center>
    </group>
  );
}
