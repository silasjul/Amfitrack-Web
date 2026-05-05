import { useBox } from "@react-three/cannon";

interface RimBoxProps {
  position: [number, number, number];
  rotation: [number, number, number];
  args: [number, number, number];
}

function RimBox({ position, rotation, args }: RimBoxProps) {
  const [ref] = useBox(() => ({
    type: "Static",
    args,
    position,
    rotation,
  }));
  return <group ref={ref} />;
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

export default function FloorTomRim({
  position,
  rotation,
  radius,
  bodyHeight,
  count,
  boxW,
  boxH,
  boxD,
}: Props) {
  const rimY = position[1] + bodyHeight / 2;
  const globalRY = rotation[1];

  return (
    <>
      {Array.from({ length: count }, (_, i) => {
        // each box rotated so its width dimension is tangent to the circle
        const theta = (i / count) * Math.PI * 2 + globalRY;
        const x = position[0] + Math.sin(theta) * radius;
        const z = position[2] + Math.cos(theta) * radius;
        return (
          <RimBox
            key={i}
            position={[x, rimY, z]}
            rotation={[0, theta, 0]}
            args={[boxW, boxH, boxD]}
          />
        );
      })}
    </>
  );
}
