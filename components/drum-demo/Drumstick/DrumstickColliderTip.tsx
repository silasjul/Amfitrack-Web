import { useSphere } from "@react-three/cannon";
import { useFrame } from "@react-three/fiber";
import { RefObject } from "react";
import * as THREE from "three";

const _pos = new THREE.Vector3();
const _quat = new THREE.Quaternion();
const _offset = new THREE.Vector3();

interface Props {
  syncRef: RefObject<THREE.Group | null>;
  radius: number;
  offsetZ: number;
  isDebug?: boolean;
}

export default function DrumstickColliderTip({
  syncRef,
  radius,
  offsetZ,
  isDebug = false,
}: Props) {
  const [ref, api] = useSphere(() => ({
    type: "Kinematic",
    args: [radius],
    position: [0, -1000, 0],
  }));

  useFrame(() => {
    if (!syncRef.current) return;
    syncRef.current.getWorldPosition(_pos);
    syncRef.current.getWorldQuaternion(_quat);
    _offset.set(0, 0, offsetZ).applyQuaternion(_quat);
    api.position.set(_pos.x + _offset.x, _pos.y + _offset.y, _pos.z + _offset.z);
  });

  return (
    <>
      <group ref={ref} />
      {isDebug && (
        <mesh position={[0, 0, offsetZ]}>
          <sphereGeometry args={[radius, 10, 10]} />
          <meshBasicMaterial color="yellow" wireframe />
        </mesh>
      )}
    </>
  );
}
