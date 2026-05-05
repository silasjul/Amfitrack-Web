import useEnableModelShadow from "@/hooks/useEnableModelShadow";
import { useSensorSync } from "@/hooks/useSensorSync";
import { Center, useGLTF } from "@react-three/drei";
import { folder, useControls } from "leva";
import React, { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";

useGLTF.preload("/drum-kit/drumstick.glb");

interface DrumstickProps {
  sensorId: number;
  onRegisterReset?: (fn: () => void) => void;
}

export default function Drumstick({
  sensorId,
  onRegisterReset,
}: DrumstickProps) {
  const groupRef = useRef<THREE.Group>(null);
  const { scene } = useGLTF("/drum-kit/drumstick.glb");
  const clone = useMemo(() => scene.clone(), [scene]);
  useEnableModelShadow(clone);
  const { resetCenter } = useSensorSync(groupRef, sensorId);

  useEffect(() => {
    onRegisterReset?.(() => resetCenter([0, -4.5, 0]));
  }, [resetCenter, onRegisterReset]);

  const { positionZ, scale } = useControls({
    drumstick: folder({
      positionZ: {
        value: 0,
        min: -2,
        max: 2,
        step: 0.001,
        label: "rotationPoint",
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
        <primitive
          object={clone}
          scale={scale}
          rotation-y={-Math.PI / 2}
          position-z={positionZ}
        />
      </Center>
    </group>
  );
}
