"use client";

import { useRef, useMemo, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import { Center, useFBX } from "@react-three/drei";
import * as THREE from "three";
import { useAmfitrack } from "@/hooks/useAmfitrack";

const COLOR_CLEAN = new THREE.Color("rgb(3, 252, 44)");
const COLOR_DISTORTED = new THREE.Color("rgb(255, 0, 0)");

const MODEL_OFFSET_Y = 0.23;

function SensorInstance({ sensorId }: { sensorId: number }) {
  const groupRef = useRef<THREE.Group>(null!);
  const materialRef = useRef<THREE.MeshPhongMaterial | null>(null);
  const { sensorsDataRef } = useAmfitrack();
  const fbx = useFBX("/models/viewer/sensor.fbx");
  const clone = useMemo(() => fbx.clone(), [fbx]);

  useEffect(() => {
    const mesh = clone.children[1] as THREE.Mesh;
    const original = mesh.material as THREE.MeshPhongMaterial;
    const mat = original.clone();
    mesh.material = mat;
    materialRef.current = mat;

    return () => {
      mat.dispose();
    };
  }, [clone]);

  useFrame(() => {
    const data = sensorsDataRef.current.get(sensorId);
    if (!data || !groupRef.current) return;

    groupRef.current.position.copy(data.position).y += MODEL_OFFSET_Y - 0.01;
    groupRef.current.quaternion.copy(data.quaternion);

    if (materialRef.current) {
      if (data.metalDistortion < 0.3) {
        materialRef.current.color.set(COLOR_CLEAN);
      } else {
        materialRef.current.color.lerpColors(
          COLOR_CLEAN,
          COLOR_DISTORTED,
          data.metalDistortion,
        );
      }
    }
  });

  return (
    <group ref={groupRef}>
      <group position={[0, 0, MODEL_OFFSET_Y]}>
        <Center>
          <primitive
            object={clone}
            scale={0.01}
            rotation-x={Math.PI / 2}
            rotation-z={Math.PI}
            rotation-y={Math.PI}
          />
        </Center>
      </group>
    </group>
  );
}

export default function SensorModels() {
  const { sensorIds } = useAmfitrack();

  return (
    <>
      {sensorIds.map((id) => (
        <SensorInstance key={id} sensorId={id} />
      ))}
    </>
  );
}
