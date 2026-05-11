import { useCallback } from "react";
import * as THREE from "three";

const SOUNDS = {
  snare: "/drum-kit/drumsounds/snare/snare.ogg",
  snare_side: "/drum-kit/drumsounds/snare/snare-side.ogg",
  snare_rim: "/drum-kit/drumsounds/snare/snare-rim.ogg",
  hi_tom: "/drum-kit/drumsounds/hi-tom/hi-tom.ogg",
  hi_tom_rim: "/drum-kit/drumsounds/hi-tom/hi-tom-rim.ogg",
  medium_tom: "/drum-kit/drumsounds/medium-tom/medium-tom.ogg",
  medium_tom_rim: "/drum-kit/drumsounds/medium-tom/medium-tom-rim.ogg",
  floor_tom: "/drum-kit/drumsounds/floor-tom/floor-tom.ogg",
  floor_tom_rim: "/drum-kit/drumsounds/floor-tom/floor-tom-rim.ogg",
  crash: "/drum-kit/drumsounds/crash/crash.ogg",
  ride_1: "/drum-kit/drumsounds/ride/ride-1.ogg",
  ride_2: "/drum-kit/drumsounds/ride/ride-2.ogg",
  ride_bell: "/drum-kit/drumsounds/ride/ride_bell.ogg",
  hihat_tip: "/drum-kit/drumsounds/hihat/hihat-tip.ogg",
  hihat_tip_tight: "/drum-kit/drumsounds/hihat/hihat-tip-tight.ogg",
  hihat_shank: "/drum-kit/drumsounds/hihat/hihat-shank.ogg",
  hihat_shank_tight: "/drum-kit/drumsounds/hihat/hihat-shank-tight.ogg",
} as const;

export type DrumSoundId = keyof typeof SOUNDS;

const COOLDOWN_MS = 80;
const MIN_VELOCITY = 2;
const MAX_VELOCITY = 20;

const buffers = new Map<DrumSoundId, AudioBuffer>();
const lastHitTime = new Map<DrumSoundId, number>();

let audioListener: THREE.AudioListener | null = null;
let audioLoader: THREE.AudioLoader | null = null;
let initialized = false;

function initClient() {
  if (initialized || typeof window === "undefined") return;
  initialized = true;

  audioListener = new THREE.AudioListener();
  audioLoader = new THREE.AudioLoader();

  (Object.keys(SOUNDS) as DrumSoundId[]).forEach((soundId) => {
    audioLoader!.load(SOUNDS[soundId], (buffer) => {
      buffers.set(soundId, buffer);
    });
  });

  // Browsers suspend AudioContext until a user gesture; resume on first interaction
  // so the very first drum hit isn't delayed by the wake-up.
  const resume = () => {
    if (audioListener && audioListener.context.state === "suspended") {
      audioListener.context.resume();
    }
    window.removeEventListener("pointerdown", resume);
    window.removeEventListener("keydown", resume);
    window.removeEventListener("touchstart", resume);
  };
  window.addEventListener("pointerdown", resume);
  window.addEventListener("keydown", resume);
  window.addEventListener("touchstart", resume);
}

if (typeof window !== "undefined") {
  initClient();
}

export function getAudioListener(): THREE.AudioListener {
  initClient();
  return audioListener!;
}

export function useDrumAudio() {
  const playHit = useCallback(
    (
      soundId: DrumSoundId,
      position: [number, number, number],
      velocity: number,
    ) => {
      if (velocity < MIN_VELOCITY) return;
      if (!audioListener) return;

      const now = Date.now();
      if ((lastHitTime.get(soundId) ?? 0) + COOLDOWN_MS > now) return;
      lastHitTime.set(soundId, now);

      const buffer = buffers.get(soundId);
      if (!buffer) return;

      const gain =
        0.3 +
        Math.min((velocity - MIN_VELOCITY) / (MAX_VELOCITY - MIN_VELOCITY), 1) *
          0.7;

      const sound = new THREE.PositionalAudio(audioListener);
      sound.setBuffer(buffer);
      sound.setRefDistance(3);
      sound.setRolloffFactor(1);
      sound.setVolume(gain);
      sound.position.set(...position);
      sound.updateMatrixWorld(true);
      sound.play();
      console.log("Playing sound", soundId);
      (sound.source as AudioBufferSourceNode).onended = () =>
        sound.disconnect();
    },
    [],
  );

  return { playHit };
}
