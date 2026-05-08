import { useEffect, useCallback } from "react";
import * as THREE from "three";

const SOUNDS = {
  snare: "/drum-kit/drumsounds/snare/snare.ogg",
  snare_rim: "/drum-kit/drumsounds/snare/snare-rim.ogg",
  snare_rimshot: "/drum-kit/drumsounds/snare/snare-rimshot.ogg",
  hi_tom: "/drum-kit/drumsounds/hi-tom/hi-tom.ogg",
  hi_tom_rim: "/drum-kit/drumsounds/hi-tom/hi-tom-rim.ogg",
  medium_tom: "/drum-kit/drumsounds/medium-tom/medium-tom.ogg",
  medium_tom_rim: "/drum-kit/drumsounds/medium-tom/medium-tom-rim.ogg",
  floor_tom: "/drum-kit/drumsounds/floor-tom/floor-tom.ogg",
  floor_tom_rim: "/drum-kit/drumsounds/floor-tom/floor-tom-rim.ogg",
} as const;

export type DrumSoundId = keyof typeof SOUNDS;

const COOLDOWN_MS = 80;
const MIN_VELOCITY = 2;
const MAX_VELOCITY = 20;

// Module-level singletons — one AudioListener, one loader, shared buffers
const audioListener = new THREE.AudioListener();
const audioLoader = new THREE.AudioLoader();
const buffers = new Map<DrumSoundId, AudioBuffer>();
const loading = new Set<DrumSoundId>();
const lastHitTime = new Map<DrumSoundId, number>();

function loadBuffer(soundId: DrumSoundId): void {
  if (buffers.has(soundId) || loading.has(soundId)) return;
  loading.add(soundId);
  audioLoader.load(SOUNDS[soundId], (buffer) => {
    buffers.set(soundId, buffer);
    loading.delete(soundId);
  });
}

export function getAudioListener(): THREE.AudioListener {
  return audioListener;
}

export function useDrumAudio() {
  useEffect(() => {
    (Object.keys(SOUNDS) as DrumSoundId[]).forEach(loadBuffer);
  }, []);

  const playHit = useCallback(
    (
      soundId: DrumSoundId,
      position: [number, number, number],
      velocity: number,
    ) => {
      if (velocity < MIN_VELOCITY) return;

      const now = Date.now();
      if ((lastHitTime.get(soundId) ?? 0) + COOLDOWN_MS > now) return;
      lastHitTime.set(soundId, now);

      const buffer = buffers.get(soundId);
      if (!buffer) return;

      const gain =
        0.3 +
        Math.min(
          (velocity - MIN_VELOCITY) / (MAX_VELOCITY - MIN_VELOCITY),
          1,
        ) *
          0.7;

      const sound = new THREE.PositionalAudio(audioListener);
      sound.setBuffer(buffer);
      sound.setRefDistance(3);
      sound.setRolloffFactor(1);
      sound.setVolume(gain);
      sound.position.set(...position);
      // Force world matrix so PannerNode gets correct position before play
      sound.updateMatrixWorld(true);
      sound.play();
      (sound.source as AudioBufferSourceNode).onended = () =>
        sound.disconnect();
    },
    [],
  );

  return { playHit };
}
