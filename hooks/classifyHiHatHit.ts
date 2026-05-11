import * as THREE from "three";
import type { DrumSoundId } from "./useDrumAudio";

export interface HiHatHitThresholds {
  hihatTipRadiusPct: number;
}

export interface ClassifyHiHatHitInput {
  contactPoint: [number, number, number];
  hihatPosition: [number, number, number];
  hihatQuaternion: THREE.Quaternion;
  hihatRadius: number;
  thresholds: HiHatHitThresholds;
  tipToggleRef: { current: number };
  shankToggleRef: { current: number };
}

export type ClassifyHiHatResult = { play: true; soundId: DrumSoundId };

const _up = new THREE.Vector3();
const _offset = new THREE.Vector3();
const HIHAT_LOCAL_UP = new THREE.Vector3(0, 1, 0);

export function classifyHiHatHit(
  input: ClassifyHiHatHitInput,
): ClassifyHiHatResult {
  const {
    contactPoint,
    hihatPosition,
    hihatQuaternion,
    hihatRadius,
    thresholds,
    tipToggleRef,
    shankToggleRef,
  } = input;

  _up.copy(HIHAT_LOCAL_UP).applyQuaternion(hihatQuaternion);
  _offset.set(
    contactPoint[0] - hihatPosition[0],
    contactPoint[1] - hihatPosition[1],
    contactPoint[2] - hihatPosition[2],
  );

  // Radial distance from the central axis.
  const axial = _offset.dot(_up);
  _offset.addScaledVector(_up, -axial);
  const r = _offset.length();
  const rPct = hihatRadius > 0 ? r / hihatRadius : 0;

  if (rPct <= thresholds.hihatTipRadiusPct) {
    const soundId: DrumSoundId =
      tipToggleRef.current++ % 2 === 0 ? "hihat_tip" : "hihat_tip_tight";
    return { play: true, soundId };
  }

  const soundId: DrumSoundId =
    shankToggleRef.current++ % 2 === 0 ? "hihat_shank" : "hihat_shank_tight";
  return { play: true, soundId };
}
