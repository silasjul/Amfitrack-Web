import useEnableModelShadow from "@/hooks/useEnableModelShadow";
import { useSensorSync } from "@/hooks/useSensorSync";
import { Center, useGLTF } from "@react-three/drei";
import { useControls } from "leva";
import React, { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import DrumstickCollider from "./DrumstickCollider";
import { useDrumDemoStore } from "@/stores/useDrumDemoStore";

useGLTF.preload("/drum-kit/models/drumstick.glb");

interface DrumstickProps {
  sensorId: number;
  onRegisterReset?: (fn: () => void) => void;
}

export default function Drumstick({
  sensorId,
  onRegisterReset,
}: DrumstickProps) {
  const isDebug = useDrumDemoStore((s) => s.isDebug);
  const { scene } = useGLTF("/drum-kit/models/drumstick.glb");
  const clone = useMemo(() => scene.clone(), [scene]);
  const sensorPointRef = useRef<THREE.Mesh>(null!);

  const { resetCenter } = useSensorSync(sensorPointRef, sensorId);
  useEnableModelShadow(clone);

  useEffect(() => {
    onRegisterReset?.(() => resetCenter([0, -4.5, -2]));
  }, [onRegisterReset]);

  const { positionY, positionZ, scale } = useControls(
    "Drumstick model",
    {
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
      scale: { value: 0.02, min: 0.01, max: 0.05, step: 0.0001 },
    },
    { collapsed: true },
  );

  return (
    <>
      <DrumstickCollider
        sensorPointRef={sensorPointRef}
        px={0.0}
        py={0.14}
        pz={-0.01}
        rx={0}
        ry={0}
        rz={0}
        bodyRadius={0.1}
        bodyLength={2.55}
        bodyOffsetZ={0.0}
        tipRadius={0.12}
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
      <mesh ref={sensorPointRef}>
        <sphereGeometry args={[0.1, 10, 10]} />
        <meshBasicMaterial color="white" wireframe visible={isDebug} />
      </mesh>
    </>
  );
}
