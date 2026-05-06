import { useBox } from "@react-three/cannon";

interface RimBoxProps {
  position: [number, number, number];
  rotation: [number, number, number];
  args: [number, number, number];
  isDebug?: boolean;
}

function RimBox({ position, rotation, args, isDebug = false }: RimBoxProps) {
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
  radius: number;
  bodyHeight: number;
  count: number;
  boxW: number;
  boxH: number;
  boxD: number;
  isDebug?: boolean;
}

export default function DrumColliderRim({
  position,
  radius,
  bodyHeight,
  count,
  boxW,
  boxH,
  boxD,
  isDebug = false,
}: Props) {
  const rimY = position[1] + bodyHeight / 2;

  return (
    <>
      {Array.from({ length: count }, (_, i) => {
        // each box rotated so its width dimension is tangent to the circle
        const theta = (i / count) * Math.PI * 2;
        const x = position[0] + Math.sin(theta) * radius;
        const z = position[2] + Math.cos(theta) * radius;
        return (
          <RimBox
            key={i}
            position={[x, rimY, z]}
            rotation={[0, theta, 0]}
            args={[boxW, boxH, boxD]}
            isDebug={isDebug}
          />
        );
      })}
    </>
  );
}
