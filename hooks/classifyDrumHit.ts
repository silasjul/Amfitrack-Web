import * as THREE from "three";
import type { DrumSoundId } from "./useDrumAudio";

export type DrumKind = "snare" | "hi_tom" | "medium_tom" | "floor_tom";

export interface DrumHitThresholds {
  topNormalDeg: number;
  rimRadiusPct: number;
  snareCenterPct: number;
}

export interface ClassifyDrumHitInput {
  drumKind: DrumKind;
  contactPoint: [number, number, number];
  contactNormal: [number, number, number];
  drumPosition: [number, number, number];
  drumQuaternion: THREE.Quaternion;
  drumRadius: number;
  thresholds: DrumHitThresholds;
}

export type ClassifyResult =
  | { play: false }
  | { play: true; soundId: DrumSoundId };

const _drumUp = new THREE.Vector3();
const _normal = new THREE.Vector3();
const _offset = new THREE.Vector3();
const DRUM_LOCAL_UP = new THREE.Vector3(0, 1, 0);

export function classifyDrumHit(input: ClassifyDrumHitInput): ClassifyResult {
  const {
    drumKind,
    contactPoint,
    contactNormal,
    drumPosition,
    drumQuaternion,
    drumRadius,
    thresholds,
  } = input;

  _drumUp.copy(DRUM_LOCAL_UP).applyQuaternion(drumQuaternion);
  _normal.set(contactNormal[0], contactNormal[1], contactNormal[2]);
  _offset.set(
    contactPoint[0] - drumPosition[0],
    contactPoint[1] - drumPosition[1],
    contactPoint[2] - drumPosition[2],
  );

  // Signed projection onto drum's up axis. > 0 = upper half, < 0 = lower half.
  const localY = _offset.dot(_drumUp);
  if (localY <= 0) {
    return { play: false };
  }

  // Reject side-wall hits: contact normal must be aligned with drum's up axis.
  const normalAlignment = Math.abs(_drumUp.dot(_normal));
  const topAngleDeg = Math.acos(Math.min(1, normalAlignment)) * (180 / Math.PI);
  if (topAngleDeg > thresholds.topNormalDeg) {
    return { play: false };
  }

  // Radial distance from drum center on the head plane.
  _offset.addScaledVector(_drumUp, -localY);
  const r = _offset.length();
  const rPct = drumRadius > 0 ? r / drumRadius : 0;

  if (drumKind !== "snare") {
    const soundId: DrumSoundId = rPct >= thresholds.rimRadiusPct
      ? (`${drumKind}_rim` as DrumSoundId)
      : (drumKind as DrumSoundId);
    return { play: true, soundId };
  }

  if (rPct >= thresholds.rimRadiusPct) {
    return { play: true, soundId: "snare_rim" };
  }
  if (rPct <= thresholds.snareCenterPct) {
    return { play: true, soundId: "snare" };
  }
  return { play: true, soundId: "snare_side" };
}
