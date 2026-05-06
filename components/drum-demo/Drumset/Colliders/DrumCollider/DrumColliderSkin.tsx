import { useCylinder } from "@react-three/cannon";

interface Props {
  position: [number, number, number];
  radius: number;
  bodyHeight: number;
  heightAbove: number;
  thickness: number;
  isDebug?: boolean;
}

export default function DrumColliderSkin({
  position,
  radius,
  bodyHeight,
  heightAbove,
  thickness,
  isDebug = false,
}: Props) {
  const skinY = position[1] + bodyHeight / 2 + heightAbove + thickness / 2;

  const [ref] = useCylinder(() => ({
    type: "Static",
    args: [radius, radius, thickness, 32],
    position: [position[0], skinY, position[2]],
  }));
  return (
    <>
      <group ref={ref} />
      {isDebug && (
        <mesh position={[position[0], skinY, position[2]]}>
          <cylinderGeometry args={[radius, radius, thickness, 32]} />
          <meshBasicMaterial color="cyan" wireframe />
        </mesh>
      )}
    </>
  );
}
