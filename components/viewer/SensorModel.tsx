"use client";

import { useRef, useMemo, useEffect, useState } from "react";
import { ThreeEvent, useFrame } from "@react-three/fiber";
import { Center, useFBX } from "@react-three/drei";
import * as THREE from "three";
import gsap from "gsap";
import { useDeviceStore } from "@/amfitrackSDK";
import { useViewerStore } from "@/stores/useViewerStore";
import { DISTORTION_THRESHOLDS } from "@/config/distortion";

useFBX.preload("/models/viewer/sensor.fbx");

const POSITION_SCALE = 0.01;

export const COLOR_CLEAN = new THREE.Color("rgb(3, 252, 44)");
const COLOR_DISTORTED = new THREE.Color("rgb(255, 0, 0)");

const COLOR_HOVERED = new THREE.Color("rgb(255, 255, 255)");

const MODEL_OFFSET_Y = 0.23;

function SensorInstance({ sensorId }: { sensorId: number }) {
  const groupRef = useRef<THREE.Group>(null!);
  const lightMaterialRef = useRef<THREE.MeshPhongMaterial | null>(null);
  const bodyMaterialRef = useRef<THREE.MeshPhongMaterial | null>(null);
  const originalBodyColorRef = useRef<THREE.Color | null>(null);
  const setSelectedSensorId = useViewerStore((s) => s.setSelectedSensorId);
  const hoveredSensorId = useViewerStore((s) => s.hoveredSensorId);
  const setHoveredSensorId = useViewerStore((s) => s.setHoveredSensorId);
  const fbx = useFBX("/models/viewer/sensor.fbx");
  const clone = useMemo(() => fbx.clone(), [fbx]);

  const isHovered = hoveredSensorId === sensorId;

  useEffect(() => {
    const bodyMesh = clone.children[0] as THREE.Mesh;
    const lightMesh = clone.children[1] as THREE.Mesh;

    const lightMat = lightMesh.material as THREE.MeshPhongMaterial;
    const bodyMat = bodyMesh.material as THREE.MeshPhongMaterial;

    const lightMatClone = lightMat.clone();
    const bodyMatClone = bodyMat.clone();

    originalBodyColorRef.current = bodyMat.color.clone();

    lightMaterialRef.current = lightMatClone;
    bodyMaterialRef.current = bodyMatClone;

    lightMesh.material = lightMatClone;
    bodyMesh.material = bodyMatClone;
  }, [clone]);

  useFrame(() => {
    const data = useDeviceStore.getState().emfImuFrameId[sensorId];
    if (!data || !groupRef.current) return;

    groupRef.current.position
      .set(
        -data.position.y * POSITION_SCALE,
        data.position.z * POSITION_SCALE,
        -data.position.x * POSITION_SCALE,
      )
      .y += MODEL_OFFSET_Y - 0.01;

    groupRef.current.quaternion
      .set(
        -data.quaternion.y,
        data.quaternion.z,
        -data.quaternion.x,
        data.quaternion.w,
      )
      .normalize();

    if (lightMaterialRef.current) {
      const distortion = data.metalDistortion / 255;
      if (distortion < DISTORTION_THRESHOLDS.CLEAN) {
        lightMaterialRef.current.color.set(COLOR_CLEAN);
      } else {
        lightMaterialRef.current.color.lerpColors(
          COLOR_CLEAN,
          COLOR_DISTORTED,
          distortion,
        );
      }
    }
  });

  useEffect(() => {
    if (!originalBodyColorRef.current) return;

    const hoverColor = originalBodyColorRef.current
      .clone()
      .lerp(COLOR_HOVERED, 0.1);
    const targetColor = isHovered ? hoverColor : originalBodyColorRef.current;
    const targetScale = isHovered ? 1.02 : 1;

    if (bodyMaterialRef.current) {
      gsap.to(bodyMaterialRef.current.color, {
        r: targetColor.r,
        g: targetColor.g,
        b: targetColor.b,
        duration: 0.2,
        ease: "power2.out",
      });
    }

    if (groupRef.current) {
      gsap.to(groupRef.current.scale, {
        x: targetScale,
        y: targetScale,
        z: targetScale,
        duration: 0.2,
        ease: "power2.out",
      });
    }
  }, [isHovered]);

  function handleClick() {
    setSelectedSensorId(sensorId);
  }

  return (
    <group ref={groupRef}>
      <group position={[0, 0, MODEL_OFFSET_Y]}>
        <Center>
          <primitive
            onPointerOver={(e: ThreeEvent<PointerEvent>) => {
              e.stopPropagation();
              setHoveredSensorId(sensorId);
              document.body.style.cursor = "pointer";
            }}
            onPointerOut={(e: ThreeEvent<PointerEvent>) => {
              e.stopPropagation();
              setHoveredSensorId(null);
              document.body.style.cursor = "default";
            }}
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
  const deviceMeta = useDeviceStore((s) => s.deviceMeta);

  const sensorIds = useMemo(() => {
    const ids: number[] = [];
    for (const [txIdStr, meta] of Object.entries(deviceMeta)) {
      const txId = Number(txIdStr);
      if (txId >= 0 && meta.kind === "sensor") ids.push(txId);
    }
    return ids;
  }, [deviceMeta]);

  return (
    <>
      {sensorIds.map((id) => (
        <SensorInstance key={id} sensorId={id} />
      ))}
    </>
  );
}
