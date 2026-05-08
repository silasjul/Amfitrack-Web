import { useControls, button } from "leva";
import { useRef } from "react";
import { useCylinder } from "@react-three/cannon";
import { useDrumDemoStore } from "@/stores/useDrumDemoStore";

interface DrumColliderProps {
  name: string;
  px?: number;
  py?: number;
  pz?: number;
  rx?: number;
  rz?: number;
  bodyRadius?: number;
  bodyHeight?: number;
}

export default function DrumCollider({
  name,
  px: propPx = 0,
  py: propPy = 100,
  pz: propPz = 0,
  rx: propRx = 0,
  rz: propRz = 0,
  bodyRadius: propBodyRadius = 50,
  bodyHeight: propBodyHeight = 50,
}: DrumColliderProps) {
  const currentDebugValuesRef = useRef<any>(null);

  const levaValues = useControls(
    name,
    {
      px: { value: propPx, min: -5, max: 5, step: 0.001, label: "X" },
      py: { value: propPy, min: -5, max: 8, step: 0.001, label: "Y" },
      pz: { value: propPz, min: -6, max: 5, step: 0.001, label: "Z" },
      rx: {
        value: propRx,
        min: -Math.PI / 3,
        max: Math.PI / 3,
        step: 0.001,
        label: "Rotation X",
      },
      rz: {
        value: propRz,
        min: -Math.PI / 3,
        max: Math.PI / 3,
        step: 0.001,
        label: "Rotation Z",
      },
      bodyRadius: {
        value: propBodyRadius,
        min: 0.5,
        max: 4,
        step: 0.001,
        label: "Radius",
      },
      bodyHeight: {
        value: propBodyHeight,
        min: 0.01,
        max: 5,
        step: 0.001,
        label: "Height",
      },
      logValues: button(() => {
        console.log(
          `[DrumCollider "${name}" values]`,
          currentDebugValuesRef.current,
        );
      }),
    },
    { collapsed: true },
  );

  const { px, py, pz, rx, rz, bodyRadius, bodyHeight } = levaValues;

  const position: [number, number, number] = [px, py, pz];
  const rotation: [number, number, number] = [rx, 0, rz];

  currentDebugValuesRef.current = {
    px,
    py,
    pz,
    rx,
    rz,
    position,
    rotation,
    bodyRadius,
    bodyHeight,
  };

  const isDebug = useDrumDemoStore((s) => s.isDebug);
  const [ref] = useCylinder(
    () => ({
      type: "Static",
      args: [bodyRadius, bodyRadius, bodyHeight, 16],
      position,
      rotation,
      onCollide: (e) => {
        const velocity = e.contact.impactVelocity;
        const point = e.contact.contactPoint;
        const normal = e.contact.contactNormal;

        console.log("Collision " + name, {
          velocity,
          normal,
          point,
        });
      },
    }),
    undefined,
    [bodyRadius, bodyHeight, px, py, pz, rx, rz],
  );

  return (
    <>
      <group ref={ref} />
      {isDebug && (
        <mesh position={position} rotation={rotation}>
          <cylinderGeometry args={[bodyRadius, bodyRadius, bodyHeight, 16]} />
          <meshBasicMaterial color="lime" wireframe />
        </mesh>
      )}
    </>
  );
}
