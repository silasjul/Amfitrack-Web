import { useCylinder } from "@react-three/cannon";

interface Props {
  position: [number, number, number];
  rotation: [number, number, number];
  radius: number;
  height: number;
}

export default function FloorTomBody({ position, rotation, radius, height }: Props) {
  const [ref] = useCylinder(() => ({
    type: "Static",
    args: [radius, radius, height, 16],
    position,
    rotation,
  }));
  return <group ref={ref} />;
}
