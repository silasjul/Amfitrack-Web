import { useCylinder } from "@react-three/cannon";
import { useFrame } from "@react-three/fiber";
import { RefObject } from "react";
import * as THREE from "three";

const _pos = new THREE.Vector3();
const _quat = new THREE.Quaternion();
const _offset = new THREE.Vector3();
const _combined = new THREE.Quaternion();
const _cylinderLocalQuat = new THREE.Quaternion().setFromEuler(
  new THREE.Euler(Math.PI / 2, 0, 0),
);

interface Props {
  syncRef: RefObject<THREE.Group | null>;
  radius: number;
  length: number;
  offsetZ: number;
  isDebug?: boolean;
}

export default function DrumstickColliderBody({
  syncRef,
  radius,
  length,
  offsetZ,
  isDebug = false,
}: Props) {
  const [ref, api] = useCylinder(() => ({
    type: "Kinematic",
    args: [radius, radius, length, 8],
    position: [0, -1000, 0],
  }));

  useFrame(() => {
    if (!syncRef.current) return;
    syncRef.current.getWorldPosition(_pos);
    syncRef.current.getWorldQuaternion(_quat);
    _offset.set(0, 0, offsetZ).applyQuaternion(_quat);
    _combined.copy(_quat).multiply(_cylinderLocalQuat);
    api.position.set(_pos.x + _offset.x, _pos.y + _offset.y, _pos.z + _offset.z);
    api.quaternion.set(_combined.x, _combined.y, _combined.z, _combined.w);
  });

  return (
    <>
      <group ref={ref} />
      {isDebug && (
        <mesh position={[0, 0, offsetZ]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[radius, radius, length, 8]} />
          <meshBasicMaterial color="lime" wireframe />
        </mesh>
      )}
    </>
  );
}
