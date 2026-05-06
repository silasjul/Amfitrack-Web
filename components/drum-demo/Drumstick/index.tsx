import useEnableModelShadow from "@/hooks/useEnableModelShadow";
import { useSensorSync } from "@/hooks/useSensorSync";
import { Center, useGLTF } from "@react-three/drei";
import { folder, useControls } from "leva";
import React, { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import DrumstickCollider from "./DrumstickCollider";

useGLTF.preload("/drum-kit/drumstick.glb");

interface DrumstickProps {
  sensorId: number;
  onRegisterReset?: (fn: () => void) => void;
  isDebug?: boolean;
}

export default function Drumstick({
  sensorId,
  onRegisterReset,
  isDebug = false,
}: DrumstickProps) {
  const groupRef = useRef<THREE.Group>(null);
  const { scene } = useGLTF("/drum-kit/drumstick.glb");
  const clone = useMemo(() => scene.clone(), [scene]);
  useEnableModelShadow(clone);
  const { resetCenter } = useSensorSync(groupRef, sensorId);

  useEffect(() => {
    onRegisterReset?.(() => resetCenter([0, -4.5, -2]));
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
        value: 0.02,
        min: 0.01,
        max: 0.05,
        step: 0.0001,
      },
    }),
  });

  return (
    <group ref={groupRef}>
      <primitive
        object={clone}
        scale={scale}
        rotation-y={-Math.PI / 2}
        position-z={positionZ}
      />
      <DrumstickCollider
        isDebug={isDebug}
        px={0}
        py={0.14}
        pz={-0.01}
        rx={0}
        ry={0}
        rz={0}
        bodyRadius={0.05}
        bodyLength={2.58}
        bodyOffsetZ={0.03}
        tipRadius={0.06}
        tipOffsetZ={-1.29}
      />
    </group>
  );
}
