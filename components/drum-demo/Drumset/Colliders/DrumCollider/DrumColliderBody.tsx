import { useCylinder } from "@react-three/cannon";

interface Props {
  position: [number, number, number];
  radius: number;
  height: number;
  isDebug?: boolean;
}

export default function DrumColliderBody({ position, radius, height, isDebug = false }: Props) {
  const [ref] = useCylinder(() => ({
    type: "Static",
    args: [radius, radius, height, 16],
    position,
  }));
  return (
    <>
      <group ref={ref} />
      {isDebug && (
        <mesh position={position}>
          <cylinderGeometry args={[radius, radius, height, 16]} />
          <meshBasicMaterial color="lime" wireframe />
        </mesh>
      )}
    </>
  );
}
