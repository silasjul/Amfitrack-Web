"use client";

import { useRef, useState, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import { Center, useFBX } from "@react-three/drei";
import * as THREE from "three";
import { useAmfitrack } from "@/hooks/useAmfitrack";

function SensorInstance({ sensorId }: { sensorId: number }) {
  const groupRef = useRef<THREE.Group>(null!);
  const { sensorsDataRef } = useAmfitrack();
  const fbx = useFBX("/models/viewer/sensor.fbx");
  const clone = useMemo(() => fbx.clone(), [fbx]);

  useFrame(() => {
    const data = sensorsDataRef.current.get(sensorId);
    if (!data || !groupRef.current) return;

    groupRef.current.position.copy(data.position);
    groupRef.current.quaternion.copy(data.quaternion);
  });

  return (
    <group ref={groupRef}>
      <Center>
        <primitive object={clone} scale={0.01} rotation-x={Math.PI / 2} rotation-z={Math.PI} rotation-y={Math.PI} />
      </Center>
    </group>
  );
}

export default function SensorModels() {
  const { sensorsDataRef } = useAmfitrack();
  const [sensorIds, setSensorIds] = useState<number[]>([]);
  const prevCountRef = useRef(0);
  const knownIdsRef = useRef<Set<number>>(new Set());

  useFrame(() => {
    const map = sensorsDataRef.current;
    if (map.size === prevCountRef.current) {
      let allKnown = true;
      for (const id of map.keys()) {
        if (!knownIdsRef.current.has(id)) {
          allKnown = false;
          break;
        }
      }
      if (allKnown) return;
    }

    prevCountRef.current = map.size;
    knownIdsRef.current = new Set(map.keys());
    setSensorIds(Array.from(map.keys()));
  });

  return (
    <>
      {sensorIds.map((id) => (
        <SensorInstance key={id} sensorId={id} />
      ))}
    </>
  );
}
