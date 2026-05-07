import useEnableModelShadow from "@/hooks/useEnableModelShadow";
import { useSensorSync } from "@/hooks/useSensorSync";
import { Center, useGLTF } from "@react-three/drei";
import { folder, useControls } from "leva";
import React, { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import DrumstickCollider from "./DrumstickCollider";
import { useDrumDemoStore } from "@/stores/useDrumDemoStore";

useGLTF.preload("/drum-kit/drumstick.glb");

interface DrumstickProps {
  sensorId: number;
  onRegisterReset?: (fn: () => void) => void;
}

export default function Drumstick({
  sensorId,
  onRegisterReset,
}: DrumstickProps) {
  const { scene } = useGLTF("/drum-kit/drumstick.glb");
  const clone = useMemo(() => scene.clone(), [scene]);
  useEnableModelShadow(clone);

  useEffect(() => {
    onRegisterReset?.(() => console.log("reset position"));
  }, [onRegisterReset]);

  const { positionY, positionZ, scale } = useControls({
    drumstick: folder({
      positionY: {
        value: -0.14,
        min: -0.5,
        max: 0.5,
        step: 0.001,
        label: "offsetY",
      },
      positionZ: {
        value: 0.0,
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
    <DrumstickCollider
      showLeva
      px={0.0}
      py={0.14}
      pz={-0.01}
      rx={0}
      ry={0}
      rz={0}
      bodyRadius={0.05}
      bodyLength={2.55}
      bodyOffsetZ={0.0}
      tipRadius={0.06}
      tipOffsetZ={-1.29}
    >
      <primitive
        object={clone}
        scale={scale}
        rotation-y={-Math.PI / 2}
        position-y={positionY}
        position-z={positionZ}
      />
    </DrumstickCollider>
  );
}
