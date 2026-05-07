import * as THREE from "three";
import { useMemo } from "react";
import { useCylinder } from "@react-three/cannon";
import { useDrumDemoStore } from "@/stores/useDrumDemoStore";

interface Props {
  position: [number, number, number];
  rotation: [number, number, number];
  radius: number;
  bodyHeight: number;
  heightAbove: number;
  thickness: number;
}

export default function DrumColliderSkin({
  position,
  rotation,
  radius,
  bodyHeight,
  heightAbove,
  thickness,
}: Props) {
  const isDebug = useDrumDemoStore((s) => s.isDebug);

  const skinPosition = useMemo<[number, number, number]>(() => {
    const localY = bodyHeight / 2 + heightAbove + thickness / 2;
    const offset = new THREE.Vector3(0, localY, 0);
    offset.applyEuler(new THREE.Euler(rotation[0], rotation[1], rotation[2]));
    return [position[0] + offset.x, position[1] + offset.y, position[2] + offset.z];
  }, [position, rotation, bodyHeight, heightAbove, thickness]);

  const [ref] = useCylinder(() => ({
    type: "Static",
    args: [radius, radius, thickness, 32],
    position: skinPosition,
    rotation,
  }));

  return (
    <>
      <group ref={ref} />
      {isDebug && (
        <mesh position={skinPosition} rotation={rotation}>
          <cylinderGeometry args={[radius, radius, thickness, 32]} />
          <meshBasicMaterial color="cyan" wireframe />
        </mesh>
      )}
    </>
  );
}
