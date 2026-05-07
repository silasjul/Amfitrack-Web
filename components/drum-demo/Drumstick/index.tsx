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
  showLeva?: boolean;
}

export default function Drumstick({
  sensorId,
  onRegisterReset,
  showLeva = false,
}: DrumstickProps) {
  const isDebug = useDrumDemoStore((s) => s.isDebug);
  const { scene } = useGLTF("/drum-kit/drumstick.glb");
  const clone = useMemo(() => scene.clone(), [scene]);
  const sensorPointRef = useRef<THREE.Mesh>(null!);

  const { resetCenter } = useSensorSync(sensorPointRef, sensorId);
  useEnableModelShadow(clone);

  useEffect(() => {
    onRegisterReset?.(() => resetCenter([0, -4.5, -2]));
  }, [onRegisterReset]);

  const leva = useControls(
    showLeva
      ? {
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
        }
      : {},
  ) as any;

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
        bodyRadius={0.05}
        bodyLength={2.55}
        bodyOffsetZ={0.0}
        tipRadius={0.06}
        tipOffsetZ={-1.29}
      >
        <primitive
          object={clone}
          scale={leva.scale ?? 0.02}
          rotation-y={-Math.PI / 2}
          position-y={leva.positionY ?? -0.14}
          position-z={leva.positionZ ?? 0.0}
        />
      </DrumstickCollider>
      <mesh ref={sensorPointRef}>
        <sphereGeometry args={[0.1, 10, 10]} />
        <meshBasicMaterial color="white" wireframe visible={isDebug} />
      </mesh>
    </>
  );
}
