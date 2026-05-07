import * as THREE from "three";
import { useMemo } from "react";
import { useCylinder, useSphere, useLockConstraint } from "@react-three/cannon";
import { useDrumDemoStore } from "@/stores/useDrumDemoStore";
import { ReactNode } from "react";

// Aligns Cannon's Y-axis cylinder with the stick's Z axis
const CYL_ALIGN = new THREE.Quaternion().setFromEuler(new THREE.Euler(Math.PI / 2, 0, 0));

interface Props {
  position: [number, number, number];
  rotation: [number, number, number];
  bodyRadius: number;
  bodyLength: number;
  bodyOffsetZ: number;
  tipRadius: number;
  tipOffsetZ: number;
  onBodyCollide?: (e: any) => void;
  onTipCollide?: (e: any) => void;
  children?: ReactNode;
}

export default function DrumstickCompoundBody({
  position,
  rotation,
  bodyRadius,
  bodyLength,
  bodyOffsetZ,
  tipRadius,
  tipOffsetZ,
  onBodyCollide,
  onTipCollide,
  children,
}: Props) {
  const isDebug = useDrumDemoStore((s) => s.isDebug);

  const stickQuat = useMemo(
    () => new THREE.Quaternion().setFromEuler(new THREE.Euler(rotation[0], rotation[1], rotation[2])),
    [rotation],
  );

  const bodyWorldPosition = useMemo<[number, number, number]>(() => {
    const offset = new THREE.Vector3(0, 0, bodyOffsetZ).applyQuaternion(stickQuat);
    return [position[0] + offset.x, position[1] + offset.y, position[2] + offset.z];
  }, [position, stickQuat, bodyOffsetZ]);

  const bodyWorldRotation = useMemo<[number, number, number]>(() => {
    const e = new THREE.Euler().setFromQuaternion(
      new THREE.Quaternion().multiplyQuaternions(stickQuat, CYL_ALIGN),
    );
    return [e.x, e.y, e.z];
  }, [stickQuat]);

  const tipWorldPosition = useMemo<[number, number, number]>(() => {
    const offset = new THREE.Vector3(0, 0, tipOffsetZ).applyQuaternion(stickQuat);
    return [position[0] + offset.x, position[1] + offset.y, position[2] + offset.z];
  }, [position, stickQuat, tipOffsetZ]);

  const [bodyRef] = useCylinder(() => ({
    type: "Dynamic",
    mass: 0.5,
    args: [bodyRadius, bodyRadius, bodyLength, 8],
    position: bodyWorldPosition,
    rotation: bodyWorldRotation,
    onCollide: onBodyCollide,
  }));

  const [tipRef] = useSphere(() => ({
    type: "Dynamic",
    mass: 0.5,
    args: [tipRadius],
    position: tipWorldPosition,
    onCollide: onTipCollide,
  }));

  useLockConstraint(bodyRef, tipRef, {});

  return (
    <>
      <group ref={bodyRef}>
        {/* Undo CYL_ALIGN (-π/2 around X) and shift to stick root so children sit correctly */}
        <group rotation-x={-Math.PI / 2} position={[0, -bodyOffsetZ, 0]}>
          {children}
        </group>
        {isDebug && (
          <mesh>
            <cylinderGeometry args={[bodyRadius, bodyRadius, bodyLength, 8]} />
            <meshBasicMaterial color="lime" wireframe />
          </mesh>
        )}
      </group>
      <group ref={tipRef}>
        {isDebug && (
          <mesh>
            <sphereGeometry args={[tipRadius, 10, 10]} />
            <meshBasicMaterial color="yellow" wireframe />
          </mesh>
        )}
      </group>
    </>
  );
}
