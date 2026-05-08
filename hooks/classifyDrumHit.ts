import * as THREE from "three";
import type { DrumSoundId } from "./useDrumAudio";

export type DrumKind = "snare" | "hi_tom" | "medium_tom" | "floor_tom";

export interface DrumHitThresholds {
  topNormalDeg: number;
  rimRadiusPct: number;
  snareCenterPct: number;
  rimshotAngleDeg: number;
}

export interface ClassifyDrumHitInput {
  drumKind: DrumKind;
  contactPoint: [number, number, number];
  contactNormal: [number, number, number];
  drumPosition: [number, number, number];
  drumQuaternion: THREE.Quaternion;
  drumRadius: number;
  stickVelocity: THREE.Vector3;
  thresholds: DrumHitThresholds;
}

export type ClassifyResult =
  | { play: false }
  | { play: true; soundId: DrumSoundId };

const _drumUp = new THREE.Vector3();
const _normal = new THREE.Vector3();
const _offset = new THREE.Vector3();
const _velNorm = new THREE.Vector3();
const DRUM_LOCAL_UP = new THREE.Vector3(0, 1, 0);

export function classifyDrumHit(input: ClassifyDrumHitInput): ClassifyResult {
  const {
    drumKind,
    contactPoint,
    contactNormal,
    drumPosition,
    drumQuaternion,
    drumRadius,
    stickVelocity,
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
  // Required so bottom face hits don't pass — abs(normal·drumUp) alone treats
  // top and bottom face the same.
  const localY = _offset.dot(_drumUp);
  if (localY <= 0) {
    return { play: false };
  }

  // Reject side-wall hits: contact normal must be aligned with drum's up axis.
  // |dot| because cannon's contactNormal sign depends on which body is A vs B,
  // and we already excluded the bottom half above.
  const normalAlignment = Math.abs(_drumUp.dot(_normal));
  const topAngleDeg = Math.acos(Math.min(1, normalAlignment)) * (180 / Math.PI);
  if (topAngleDeg > thresholds.topNormalDeg) {
    return { play: false };
  }

  // Project offset onto the head plane to get radial distance from center.
  _offset.addScaledVector(_drumUp, -localY);
  const r = _offset.length();
  const rPct = drumRadius > 0 ? r / drumRadius : 0;

  if (drumKind !== "snare") {
    const rim = rPct >= thresholds.rimRadiusPct;
    const soundId: DrumSoundId = rim
      ? (`${drumKind}_rim` as DrumSoundId)
      : (drumKind as DrumSoundId);
    return { play: true, soundId };
  }

  if (rPct >= thresholds.rimRadiusPct) {
    return { play: true, soundId: "snare_rim" };
  }

  // Rimshot: stick lies nearly flat against the head (small angle from the head plane).
  // velocity-to-plane angle: 0° = stick parallel to head (rimshot),
  // 90° = stick perpendicular to head (normal hit).
  const velLen = stickVelocity.length();
  // console.log("velLen", velLen);
  if (velLen > 0.001) {
    _velNorm.copy(stickVelocity).divideScalar(velLen);
    const perpDot = Math.abs(_velNorm.dot(_drumUp));
    const angleFromPlaneDeg =
      90 - Math.acos(Math.min(1, perpDot)) * (180 / Math.PI);
    console.log(
      `[snare rimshot check] angleFromPlane=${angleFromPlaneDeg.toFixed(1)}°, threshold=${thresholds.rimshotAngleDeg}°, velLen=${velLen.toFixed(2)}, rPct=${rPct.toFixed(2)}`,
    );
    if (angleFromPlaneDeg <= thresholds.rimshotAngleDeg) {
      return { play: true, soundId: "snare_rimshot" };
    }
  }

  if (rPct <= thresholds.snareCenterPct) {
    return { play: true, soundId: "snare" };
  }
  return { play: true, soundId: "snare_side" };
}
