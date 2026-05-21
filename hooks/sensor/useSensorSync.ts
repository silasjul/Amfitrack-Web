import { useCallback, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useDeviceStore } from "@/amfitrackSDK";
import { useSensorSyncStore } from "@/stores/useSensorSyncStore";

export function useSensorSync(
  modelRef: React.RefObject<THREE.Group | THREE.Mesh | null>,
  txId: number | undefined,
) {
  const centerOffsetRef = useRef(new THREE.Vector3());
  const positionScale = useSensorSyncStore((s) => s.positionScale);

  const scaleRef = useRef(positionScale);
  scaleRef.current = positionScale;

  useFrame(() => {
    if (txId === undefined) return;
    const emfData = useDeviceStore.getState().emfImuFrameId;
    const data = emfData[txId];
    if (!data || !modelRef.current) return;

    const s = scaleRef.current;
    modelRef.current.position
      .set(
        -data.position.y * s,
        data.position.z * s,
        -data.position.x * s,
      )
      .sub(centerOffsetRef.current);

    modelRef.current.quaternion
      .set(
        -data.quaternion.y,
        data.quaternion.z,
        -data.quaternion.x,
        data.quaternion.w,
      )
      .normalize();
  });

  const resetCenter = useCallback(
    (offset: [number, number, number] = [0, 0, 0]) => {
      if (txId === undefined) return;
      const emfData = useDeviceStore.getState().emfImuFrameId;
      const data = emfData[txId];
      if (data) {
        const s = scaleRef.current;
        centerOffsetRef.current.set(
          -data.position.y * s + offset[0],
          data.position.z * s + offset[1],
          -data.position.x * s + offset[2],
        );
      }
    },
    [txId],
  );

  return { resetCenter };
}
