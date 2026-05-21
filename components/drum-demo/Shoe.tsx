import { useFrame } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import { folder, useControls } from "leva";
import React, { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { useDrumDemoStore } from "@/stores/useDrumDemoStore";
import { useSensorSync } from "@/hooks/sensor/useSensorSync";
import useEnableModelShadow from "@/hooks/ui/useEnableModelShadow";
import { useDrumAudio } from "@/hooks/drum/useDrumAudio";

useGLTF.preload("/drum-kit/models/shoe.glb");

interface ShoeProps {
  sensorId: number;
  onRegisterReset?: (fn: () => void) => void;
}

export default function Shoe({ sensorId, onRegisterReset }: ShoeProps) {
  const isDebug = useDrumDemoStore((s) => s.isDebug);
  const { scene } = useGLTF("/drum-kit/models/shoe.glb");
  const clone = useMemo(() => scene.clone(), [scene]);
  const groupRef = useRef<THREE.Group>(null!);
  const prevYRef = useRef<number | null>(null);
  const armedRef = useRef(true);

  const { playHit } = useDrumAudio();
  const { resetCenter } = useSensorSync(groupRef, sensorId);
  useEnableModelShadow(clone);

  const {
    hbX,
    hbY,
    hbZ,
    hbWidth,
    hbHeight,
    hbDepth,
    minTriggerSpeed,
    reArmOffset,
    modelOffsetY,
    modelScale,
  } = useControls(
    "Shoe / Kick pedal",
    {
      Hitbox: folder({
        hbX: { value: -0.33, min: -3, max: 3, step: 0.001, label: "X" },
        hbY: { value: 0.20, min: 0, max: 6, step: 0.001, label: "Y" },
        hbZ: { value: 1.14, min: -5, max: 5, step: 0.001, label: "Z" },
        hbWidth: { value: 1.0, min: 0.1, max: 3, step: 0.01, label: "Width" },
        hbHeight: {
          value: 0.41,
          min: 0.05,
          max: 2,
          step: 0.01,
          label: "Height",
        },
        hbDepth: { value: 2.47, min: 0.1, max: 3, step: 0.01, label: "Depth" },
      }),
      Trigger: folder({
        minTriggerSpeed: {
          value: 2,
          min: 0,
          max: 20,
          step: 0.1,
          label: "Min down speed",
        },
        reArmOffset: {
          value: 0,
          min: 0,
          max: 2,
          step: 0.01,
          label: "Re-arm offset",
        },
      }),
      Model: folder({
        modelOffsetY: {
          value: 0,
          min: -0.5,
          max: 0.5,
          step: 0.001,
          label: "Offset Y",
        },
        modelScale: {
          value: 3,
          min: 2,
          max: 4,
          step: 0.0001,
          label: "Scale",
        },
      }),
    },
    { collapsed: true },
  );

  const top = hbY + hbHeight / 2;
  const bottom = hbY - hbHeight / 2;

  useEffect(() => {
    onRegisterReset?.(() => {
      armedRef.current = true;
      prevYRef.current = null;
      // Land the shoe at the top of the hitbox so it's primed but not triggering.
      resetCenter([-hbX, -(top - 0.18), -hbZ]);
    });
  }, [onRegisterReset, hbX, hbZ, top, reArmOffset, resetCenter]);

  useFrame((_, dt) => {
    const group = groupRef.current;
    if (!group) return;
    const { x, y, z } = group.position;

    const prevY = prevYRef.current;
    prevYRef.current = y;
    if (prevY === null || dt <= 0) return;

    const downSpeed = (prevY - y) / dt;

    if (y > top + reArmOffset) {
      armedRef.current = true;
    }

    const insideX = Math.abs(x - hbX) <= hbWidth / 2;
    const insideZ = Math.abs(z - hbZ) <= hbDepth / 2;
    const insideY = y <= top && y >= bottom;
    const inside = insideX && insideY && insideZ;

    if (inside && armedRef.current && downSpeed > minTriggerSpeed) {
      armedRef.current = false;
      playHit("kick", [x, y, z], downSpeed);
    }
  });

  return (
    <>
      <group ref={groupRef}>
        <primitive
          object={clone}
          scale={modelScale}
          position-y={modelOffsetY}
          rotation-y={Math.PI}
        />
      </group>
      {isDebug && (
        <mesh position={[hbX, hbY, hbZ]}>
          <boxGeometry args={[hbWidth, hbHeight, hbDepth]} />
          <meshBasicMaterial color="orange" wireframe />
        </mesh>
      )}
    </>
  );
}
