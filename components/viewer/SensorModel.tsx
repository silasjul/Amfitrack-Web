"use client";

import { useRef, useMemo, useEffect, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { Center, useFBX } from "@react-three/drei";
import * as THREE from "three";
import { useAmfitrack } from "@/hooks/useAmfitrack";
import { DISTORTION_THRESHOLDS } from "@/config/distortion";

const COLOR_CLEAN = new THREE.Color("rgb(3, 252, 44)");
const COLOR_DISTORTED = new THREE.Color("rgb(255, 0, 0)");

const COLOR_HOVERED = new THREE.Color("rgb(255, 255, 255)");

const MODEL_OFFSET_Y = 0.23;

function SensorInstance({ sensorId }: { sensorId: number }) {
  const [isHovered, setIsHovered] = useState(false);
  const groupRef = useRef<THREE.Group>(null!);
  const materialRef = useRef<THREE.MeshPhongMaterial | null>(null);
  const bodyMaterialRef = useRef<THREE.MeshPhongMaterial | null>(null);
  const originalBodyColorRef = useRef<THREE.Color | null>(null);
  const { sensorsDataRef } = useAmfitrack();
  const fbx = useFBX("/models/viewer/sensor.fbx");
  const clone = useMemo(() => fbx.clone(), [fbx]);

  useEffect(() => {
    const bodyMesh = clone.children[0] as THREE.Mesh;
    const lightMesh = clone.children[1] as THREE.Mesh;
    const lightMat = lightMesh.material as THREE.MeshPhongMaterial;
    const bodyMat = bodyMesh.material as THREE.MeshPhongMaterial;
    originalBodyColorRef.current = bodyMat.color.clone();
    materialRef.current = lightMat;
    bodyMaterialRef.current = bodyMat;
  }, [clone]);

  useFrame(() => {
    const data = sensorsDataRef.current.get(sensorId);
    if (!data || !groupRef.current) return;

    groupRef.current.position.copy(data.position).y += MODEL_OFFSET_Y - 0.01;
    groupRef.current.quaternion.copy(data.quaternion);

    if (materialRef.current) {
      if (data.metalDistortion < DISTORTION_THRESHOLDS.CLEAN) {
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

  useEffect(() => {
    if (!originalBodyColorRef.current) return;

    if (isHovered) {
      bodyMaterialRef.current?.color.set(originalBodyColorRef.current.clone().lerp(COLOR_HOVERED, 0.5));
    } else {
      bodyMaterialRef.current?.color.set(originalBodyColorRef.current);
    }
  }, [isHovered]);

  function handleClick() {
    console.log(`Sensor ${sensorId} clicked`);
  }

  return (
    <group ref={groupRef}>
      <group position={[0, 0, MODEL_OFFSET_Y]}>
        <Center>
          <primitive
            onPointerOver={() => setIsHovered(true)}
            onPointerOut={() => setIsHovered(false)}
            onClick={handleClick}
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
