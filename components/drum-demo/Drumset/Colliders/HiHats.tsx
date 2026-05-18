import { useCompoundBody } from "@react-three/cannon";
import { button, folder, useControls } from "leva";
import { useRef } from "react";
import * as THREE from "three";
import { useDrumDemoStore } from "@/stores/useDrumDemoStore";
import { useDrumAudio } from "@/hooks/useDrumAudio";
import { useDrumAudioThresholdsStore } from "@/stores/useDrumAudioThresholdsStore";
import { classifyHiHatHit } from "@/hooks/classifyHiHatHit";

type Vec3Tuple = [number, number, number];

export default function HiHats() {
  const currentValuesRef = useRef<any>(null);
  const isDebug = useDrumDemoStore((s) => s.isDebug);
  const { playHit } = useDrumAudio();
  const tipToggleRef = useRef(0);
  const shankToggleRef = useRef(0);

  const { px, py, pz, rx, rz, bodyRadius, tipRadius, coneHeight, gap } = useControls(
    "HiHats",
    {
      Pose: folder({
        px: { value: -3.669, min: -5, max: 5, step: 0.001, label: "X" },
        py: { value: 5.604, min: 0, max: 10, step: 0.001, label: "Y" },
        pz: { value: 1.998, min: -5, max: 5, step: 0.001, label: "Z" },
        rx: {
          value: 0,
          min: -Math.PI,
          max: Math.PI,
          step: 0.001,
          label: "Rotation X",
        },
        rz: {
          value: 0,
          min: -Math.PI,
          max: Math.PI,
          step: 0.001,
          label: "Rotation Z",
        },
      }),
      Shape: folder({
        bodyRadius: {
          value: 1.582,
          min: 0.1,
          max: 4,
          step: 0.001,
          label: "Radius",
        },
        tipRadius: {
          value: 1.407,
          min: 0,
          max: 4,
          step: 0.001,
          label: "Tip Radius",
        },
        coneHeight: {
          value: 0.142,
          min: 0.01,
          max: 2,
          step: 0.001,
          label: "Cone Height",
        },
        gap: {
          value: 0,
          min: 0,
          max: 2,
          step: 0.001,
          label: "Plate Gap",
        },
      }),
      logValues: button(() => {
        console.log("[HiHats values]", currentValuesRef.current);
      }),
    },
    { collapsed: true },
  );

  currentValuesRef.current = {
    px,
    py,
    pz,
    rx,
    rz,
    bodyRadius,
    tipRadius,
    coneHeight,
    gap,
  };

  const position: Vec3Tuple = [px, py, pz];
  const rotation: Vec3Tuple = [rx, 0, rz];

  // Two cones meeting at their wide bases in the middle: top tip points up,
  // bottom tip points down. `gap` separates the two wide bases.
  const topOffsetY = gap / 2 + coneHeight / 2;
  const bottomOffsetY = -(gap / 2 + coneHeight / 2);

  const [ref] = useCompoundBody(
    () => {
      const hihatQuat = new THREE.Quaternion().setFromEuler(
        new THREE.Euler(rx, 0, rz),
      );
      const hihatCenter: Vec3Tuple = [px, py, pz];

      return {
        type: "Static",
        position,
        rotation,
        shapes: [
          {
            type: "Cylinder",
            args: [tipRadius, bodyRadius, coneHeight, 16],
            position: [0, topOffsetY, 0] as Vec3Tuple,
            rotation: [0, 0, 0] as Vec3Tuple,
          },
          {
            type: "Cylinder",
            args: [bodyRadius, tipRadius, coneHeight, 16],
            position: [0, bottomOffsetY, 0] as Vec3Tuple,
            rotation: [0, 0, 0] as Vec3Tuple,
          },
        ],
        onCollide: (e) => {
          const velocity = e.contact.impactVelocity;
          const point = e.contact.contactPoint as Vec3Tuple;
          const result = classifyHiHatHit({
            contactPoint: point,
            hihatPosition: hihatCenter,
            hihatQuaternion: hihatQuat,
            hihatRadius: bodyRadius,
            thresholds: useDrumAudioThresholdsStore.getState(),
            tipToggleRef,
            shankToggleRef,
          });
          playHit(result.soundId, point, velocity);
        },
      };
    },
    undefined,
    [bodyRadius, tipRadius, coneHeight, gap, px, py, pz, rx, rz],
  );

  return (
    <>
      <group ref={ref} />
      {isDebug && (
        <group position={position} rotation={rotation}>
          <mesh position={[0, topOffsetY, 0]}>
            <cylinderGeometry args={[tipRadius, bodyRadius, coneHeight, 16]} />
            <meshBasicMaterial color="lime" wireframe />
          </mesh>
          <mesh position={[0, bottomOffsetY, 0]}>
            <cylinderGeometry args={[bodyRadius, tipRadius, coneHeight, 16]} />
            <meshBasicMaterial color="lime" wireframe />
          </mesh>
        </group>
      )}
    </>
  );
}
