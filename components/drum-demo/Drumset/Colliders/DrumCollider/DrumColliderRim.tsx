import * as THREE from "three";
import { useMemo } from "react";
import { useBox } from "@react-three/cannon";
import { useDrumDemoStore } from "@/stores/useDrumDemoStore";

interface RimBoxProps {
  position: [number, number, number];
  rotation: [number, number, number];
  args: [number, number, number];
}

function RimBox({ position, rotation, args }: RimBoxProps) {
  const isDebug = useDrumDemoStore((s) => s.isDebug);
  const [ref] = useBox(() => ({
    type: "Static",
    args,
    position,
    rotation,
  }));

  return (
    <>
      <group ref={ref} />
      {isDebug && (
        <mesh position={position} rotation={rotation}>
          <boxGeometry args={args} />
          <meshBasicMaterial color="orange" wireframe />
        </mesh>
      )}
    </>
  );
}

interface Props {
  position: [number, number, number];
  rotation: [number, number, number];
  radius: number;
  bodyHeight: number;
  count: number;
  boxW: number;
  boxH: number;
  boxD: number;
}

export default function DrumColliderRim({
  position,
  rotation,
  radius,
  bodyHeight,
  count,
  boxW,
  boxH,
  boxD,
}: Props) {
  const rimBoxes = useMemo(() => {
    const drumQuat = new THREE.Quaternion().setFromEuler(
      new THREE.Euler(rotation[0], rotation[1], rotation[2])
    );

    return Array.from({ length: count }, (_, i) => {
      const theta = (i / count) * Math.PI * 2;

      const localOffset = new THREE.Vector3(
        Math.sin(theta) * radius,
        bodyHeight / 2,
        Math.cos(theta) * radius
      );
      localOffset.applyQuaternion(drumQuat);

      const localQuat = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, theta, 0));
      const worldQuat = new THREE.Quaternion().multiplyQuaternions(drumQuat, localQuat);
      const worldEuler = new THREE.Euler().setFromQuaternion(worldQuat);

      return {
        key: i,
        position: [
          position[0] + localOffset.x,
          position[1] + localOffset.y,
          position[2] + localOffset.z,
        ] as [number, number, number],
        rotation: [worldEuler.x, worldEuler.y, worldEuler.z] as [number, number, number],
      };
    });
  }, [position, rotation, radius, bodyHeight, count]);

  return (
    <>
      {rimBoxes.map(({ key, position, rotation }) => (
        <RimBox key={key} position={position} rotation={rotation} args={[boxW, boxH, boxD]} />
      ))}
    </>
  );
}
