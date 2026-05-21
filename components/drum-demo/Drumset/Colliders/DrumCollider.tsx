import { useControls, button } from "leva";
import { useRef } from "react";
import { useCylinder } from "@react-three/cannon";
import * as THREE from "three";
import { useDrumDemoStore } from "@/stores/useDrumDemoStore";
import { useDrumAudio } from "@/hooks/drum/useDrumAudio";
import { useDrumAudioThresholdsStore } from "@/stores/useDrumAudioThresholdsStore";
import { classifyDrumHit, type DrumKind } from "@/hooks/drum/classifyDrumHit";

interface DrumColliderProps {
  name: string;
  drumKind: DrumKind;
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
  drumKind,
  px: propPx = 0,
  py: propPy = 100,
  pz: propPz = 0,
  rx: propRx = 0,
  rz: propRz = 0,
  bodyRadius: propBodyRadius = 50,
  bodyHeight: propBodyHeight = 50,
}: DrumColliderProps) {
  const currentDebugValuesRef = useRef<any>(null);
  const isDebug = useDrumDemoStore((s) => s.isDebug);
  const { playHit } = useDrumAudio();

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

  const [ref] = useCylinder(
    () => {
      const drumQuat = new THREE.Quaternion().setFromEuler(
        new THREE.Euler(rx, 0, rz),
      );
      const drumCenter: [number, number, number] = [px, py, pz];

      return {
        type: "Static",
        args: [bodyRadius, bodyRadius, bodyHeight, 16],
        position,
        rotation,
        onCollide: (e) => {
          const hitTime = performance.now();
          const velocity = e.contact.impactVelocity;
          const point = e.contact.contactPoint as [number, number, number];
          const normal = e.contact.contactNormal as [number, number, number];
          const result = classifyDrumHit({
            drumKind,
            contactPoint: point,
            contactNormal: normal,
            drumPosition: drumCenter,
            drumQuaternion: drumQuat,
            drumRadius: bodyRadius,
            thresholds: useDrumAudioThresholdsStore.getState(),
          });
          if (!result.play) return;
          playHit(result.soundId, point, velocity, hitTime);
        },
      };
    },
    undefined,
    [bodyRadius, bodyHeight, px, py, pz, rx, rz, drumKind],
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
