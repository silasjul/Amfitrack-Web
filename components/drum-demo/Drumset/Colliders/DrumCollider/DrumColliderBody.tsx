import { useCylinder } from "@react-three/cannon";
import { useDrumDemoStore } from "@/stores/useDrumDemoStore";

interface Props {
  position: [number, number, number];
  rotation: [number, number, number];
  radius: number;
  height: number;
}

export default function DrumColliderBody({ position, rotation, radius, height }: Props) {
  const isDebug = useDrumDemoStore((s) => s.isDebug);
  const [ref] = useCylinder(() => ({
    type: "Static",
    args: [radius, radius, height, 16],
    position,
    rotation,
  }));

  return (
    <>
      <group ref={ref} />
      {isDebug && (
        <mesh position={position} rotation={rotation}>
          <cylinderGeometry args={[radius, radius, height, 16]} />
          <meshBasicMaterial color="lime" wireframe />
        </mesh>
      )}
    </>
  );
}
