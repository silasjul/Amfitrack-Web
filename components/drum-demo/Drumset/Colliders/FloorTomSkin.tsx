import { useCylinder } from "@react-three/cannon";

interface Props {
  position: [number, number, number];
  rotation: [number, number, number];
  radius: number;
  bodyHeight: number;
  heightAbove: number;
  thickness: number;
}

export default function FloorTomSkin({
  position,
  rotation,
  radius,
  bodyHeight,
  heightAbove,
  thickness,
}: Props) {
  const skinY = position[1] + bodyHeight / 2 + heightAbove + thickness / 2;

  const [ref] = useCylinder(() => ({
    type: "Static",
    args: [radius, radius, thickness, 32],
    position: [position[0], skinY, position[2]],
    rotation,
  }));
  return <group ref={ref} />;
}
