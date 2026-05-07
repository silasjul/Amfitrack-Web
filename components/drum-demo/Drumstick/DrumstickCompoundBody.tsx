import { useCompoundBody } from "@react-three/cannon";
import { useDrumDemoStore } from "@/stores/useDrumDemoStore";
import { ReactNode } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
interface Props {
  sensorPointRef?: React.RefObject<THREE.Mesh>;
  position: [number, number, number];
  rotation: [number, number, number];
  bodyRadius: number;
  bodyLength: number;
  bodyOffsetZ: number;
  tipRadius: number;
  tipOffsetZ: number;
  onBodyCollide?: (e: any) => void;
  onTipCollide?: (e: any) => void;
  children?: ReactNode;
}

export default function DrumstickCompoundBody({
  sensorPointRef,
  position,
  rotation,
  bodyRadius,
  bodyLength,
  bodyOffsetZ,
  tipRadius,
  tipOffsetZ,
  onBodyCollide,
  onTipCollide,
  children,
}: Props) {
  const isDebug = useDrumDemoStore((s) => s.isDebug);

  const [ref, api] = useCompoundBody(() => ({
    type: "Dynamic",
    mass: 1,
    position,
    rotation,
    shapes: [
      {
        type: "Cylinder",
        args: [bodyRadius, bodyRadius, bodyLength, 8],
        position: [0, 0, bodyOffsetZ] as [number, number, number],
        rotation: [Math.PI / 2, 0, 0] as [number, number, number],
      },
      {
        type: "Sphere",
        args: [tipRadius] as [number],
        position: [0, 0, tipOffsetZ] as [number, number, number],
      },
    ],
    onCollide: (e) => {
      onBodyCollide?.(e);
      onTipCollide?.(e);
    },
  }));

  useFrame(() => {
    if (!sensorPointRef || !sensorPointRef.current) return;

    // Position
  });

  return (
    <group ref={ref}>
      {children}
      {isDebug && (
        <>
          <mesh position={[0, 0, bodyOffsetZ]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[bodyRadius, bodyRadius, bodyLength, 8]} />
            <meshBasicMaterial color="lime" wireframe />
          </mesh>
          <mesh position={[0, 0, tipOffsetZ]}>
            <sphereGeometry args={[tipRadius, 10, 10]} />
            <meshBasicMaterial color="yellow" wireframe />
          </mesh>
        </>
      )}
    </group>
  );
}
