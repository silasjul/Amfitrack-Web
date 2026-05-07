import { useSphere } from "@react-three/cannon";
import { useDrumDemoStore } from "@/stores/useDrumDemoStore";

interface Props {
  position: [number, number, number];
  radius: number;
}

export default function DrumstickColliderTip({ position, radius }: Props) {
  const isDebug = useDrumDemoStore((s) => s.isDebug);

  const [ref] = useSphere(() => ({
    type: "Dynamic",
    mass: 1,
    args: [radius],
    position,
  }));

  return (
    <group ref={ref}>
      {isDebug && (
        <mesh>
          <sphereGeometry args={[radius, 10, 10]} />
          <meshBasicMaterial color="yellow" wireframe />
        </mesh>
      )}
    </group>
  );
}
