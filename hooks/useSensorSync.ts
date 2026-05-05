import { useCallback, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useDeviceStore } from "@/amfitrackSDK";

const POSITION_SCALE = 0.01;

export function useSensorSync(
  modelRef: React.RefObject<THREE.Group | null>,
  txId: number | undefined,
) {
  const centerOffsetRef = useRef(new THREE.Vector3());

  useFrame(() => {
    if (txId === undefined) return;
    const emfData = useDeviceStore.getState().emfImuFrameId;
    const data = emfData[txId];
    if (!data || !modelRef.current) return;

    modelRef.current.position
      .set(
        -data.position.y * POSITION_SCALE,
        data.position.z * POSITION_SCALE,
        -data.position.x * POSITION_SCALE,
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

  const resetCenter = useCallback((offset: [number, number, number] = [0, 0, 0]) => {
    if (txId === undefined) return;
    const emfData = useDeviceStore.getState().emfImuFrameId;
    const data = emfData[txId];
    if (data) {
      centerOffsetRef.current.set(
        -data.position.y * POSITION_SCALE + offset[0],
        data.position.z * POSITION_SCALE + offset[1],
        -data.position.x * POSITION_SCALE + offset[2],
      );
    }
  }, [txId]);

  return { resetCenter };
}
