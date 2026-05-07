import { useDrumDemoStore } from "@/stores/useDrumDemoStore";
import { useCylinder } from "@react-three/cannon";

interface Props {
  position: [number, number, number];
  rotation: [number, number, number];
  radius: number;
  length: number;
}

export default function DrumstickColliderBody({
  position,
  rotation,
  radius,
  length,
}: Props) {
  const isDebug = useDrumDemoStore((s) => s.isDebug);
  const [ref] = useCylinder(() => ({
    type: "Dynamic",
    mass: 1,
    args: [radius, radius, length, 8],
    position,
    rotation,
  }));

  return (
    <group ref={ref}>
      {isDebug && (
        <mesh>
          <cylinderGeometry args={[radius, radius, length, 8]} />
          <meshBasicMaterial color="lime" wireframe />
        </mesh>
      )}
    </group>
  );
}
