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
  stickQuaternion: THREE.Quaternion;
  thresholds: DrumHitThresholds;
}

export type ClassifyResult =
  | { play: false }
  | { play: true; soundId: DrumSoundId };

const _drumUp = new THREE.Vector3();
const _normal = new THREE.Vector3();
const _offset = new THREE.Vector3();
const _stickDir = new THREE.Vector3();
const DRUM_LOCAL_UP = new THREE.Vector3(0, 1, 0);
const STICK_LOCAL_TIP_DIR = new THREE.Vector3(0, 0, -1);

export function classifyDrumHit(input: ClassifyDrumHitInput): ClassifyResult {
  const {
    drumKind,
    contactPoint,
    contactNormal,
    drumPosition,
    drumQuaternion,
    drumRadius,
    stickQuaternion,
    thresholds,
  } = input;

  _drumUp.copy(DRUM_LOCAL_UP).applyQuaternion(drumQuaternion);
  _normal.set(contactNormal[0], contactNormal[1], contactNormal[2]);

  // |dot| because cannon's contactNormal sign depends on which body is A vs B
  const normalAlignment = Math.abs(_drumUp.dot(_normal));
  const topAngleDeg =
    Math.acos(Math.min(1, normalAlignment)) * (180 / Math.PI);
  if (topAngleDeg > thresholds.topNormalDeg) {
    return { play: false };
  }

  _offset.set(
    contactPoint[0] - drumPosition[0],
    contactPoint[1] - drumPosition[1],
    contactPoint[2] - drumPosition[2],
  );
  // Project onto head plane: subtract component along drum-up
  const along = _offset.dot(_drumUp);
  _offset.addScaledVector(_drumUp, -along);
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

  // Stick approach angle: 0° = perpendicular to head (normal hit), 90° = laying flat
  _stickDir.copy(STICK_LOCAL_TIP_DIR).applyQuaternion(stickQuaternion);
  const headInward = _drumUp.clone().multiplyScalar(-1);
  const stickAlignment = Math.max(-1, Math.min(1, _stickDir.dot(headInward)));
  const stickAngleDeg = Math.acos(stickAlignment) * (180 / Math.PI);

  if (stickAngleDeg >= thresholds.rimshotAngleDeg) {
    return { play: true, soundId: "snare_rimshot" };
  }
  if (rPct <= thresholds.snareCenterPct) {
    return { play: true, soundId: "snare" };
  }
  return { play: true, soundId: "snare_side" };
}
