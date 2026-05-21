import * as THREE from "three";
import type { DrumSoundId } from "./useDrumAudio";
import type { CymbalKind } from "@/components/drum-demo/Drumset/Colliders/CymbalCollider";

export interface CymbalHitThresholds {
  bellRadiusPct: number;
}

export interface ClassifyCymbalHitInput {
  cymbalKind: CymbalKind;
  contactPoint: [number, number, number];
  cymbalPosition: [number, number, number];
  cymbalQuaternion: THREE.Quaternion;
  cymbalRadius: number;
  thresholds: CymbalHitThresholds;
  rideToggleRef: { current: number };
}

export type ClassifyCymbalResult = { play: true; soundId: DrumSoundId };

const _up = new THREE.Vector3();
const _offset = new THREE.Vector3();
const CYMBAL_LOCAL_UP = new THREE.Vector3(0, 1, 0);

export function classifyCymbalHit(
  input: ClassifyCymbalHitInput,
): ClassifyCymbalResult {
  const {
    cymbalKind,
    contactPoint,
    cymbalPosition,
    cymbalQuaternion,
    cymbalRadius,
    thresholds,
    rideToggleRef,
  } = input;

  if (cymbalKind === "crash") {
    return { play: true, soundId: "crash" };
  }

  // Ride: bell if hit close to central axis, otherwise alternate body sounds.
  _up.copy(CYMBAL_LOCAL_UP).applyQuaternion(cymbalQuaternion);
  _offset.set(
    contactPoint[0] - cymbalPosition[0],
    contactPoint[1] - cymbalPosition[1],
    contactPoint[2] - cymbalPosition[2],
  );

  // Project onto cymbal plane: radial distance from central axis.
  const axial = _offset.dot(_up);
  _offset.addScaledVector(_up, -axial);
  const r = _offset.length();
  const rPct = cymbalRadius > 0 ? r / cymbalRadius : 0;

  if (rPct <= thresholds.bellRadiusPct) {
    return { play: true, soundId: "ride_bell" };
  }

  const soundId: DrumSoundId =
    rideToggleRef.current++ % 2 === 0 ? "ride_1" : "ride_2";
  return { play: true, soundId };
}
