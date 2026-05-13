import { useCallback } from "react";
import * as THREE from "three";

const BASE_VOLUME = 2;

const SOUNDS = {
  snare: { url: "/drum-kit/drumsounds/snare/snare.ogg", volume: BASE_VOLUME },
  snare_side: {
    url: "/drum-kit/drumsounds/snare/snare-side.ogg",
    volume: BASE_VOLUME,
  },
  snare_rim: {
    url: "/drum-kit/drumsounds/snare/snare-rim.ogg",
    volume: BASE_VOLUME,
  },
  hi_tom: {
    url: "/drum-kit/drumsounds/hi-tom/hi-tom.ogg",
    volume: BASE_VOLUME,
  },
  hi_tom_rim: {
    url: "/drum-kit/drumsounds/hi-tom/hi-tom-rim.ogg",
    volume: BASE_VOLUME,
  },
  medium_tom: {
    url: "/drum-kit/drumsounds/medium-tom/medium-tom.ogg",
    volume: BASE_VOLUME,
  },
  medium_tom_rim: {
    url: "/drum-kit/drumsounds/medium-tom/medium-tom-rim.ogg",
    volume: BASE_VOLUME,
  },
  floor_tom: {
    url: "/drum-kit/drumsounds/floor-tom/floor-tom.ogg",
    volume: BASE_VOLUME,
  },
  floor_tom_rim: {
    url: "/drum-kit/drumsounds/floor-tom/floor-tom-rim.ogg",
    volume: BASE_VOLUME,
  },
  crash: {
    url: "/drum-kit/drumsounds/crash/crash.ogg",
    volume: BASE_VOLUME + 4,
  },
  ride_1: { url: "/drum-kit/drumsounds/ride/ride-1.ogg", volume: BASE_VOLUME },
  ride_2: { url: "/drum-kit/drumsounds/ride/ride-2.ogg", volume: BASE_VOLUME },
  ride_bell: {
    url: "/drum-kit/drumsounds/ride/ride_bell.ogg",
    volume: BASE_VOLUME,
  },
  hihat_tip: {
    url: "/drum-kit/drumsounds/hihat/hihat-tip.ogg",
    volume: BASE_VOLUME,
  },
  hihat_tip_tight: {
    url: "/drum-kit/drumsounds/hihat/hihat-tip-tight.ogg",
    volume: BASE_VOLUME,
  },
  hihat_shank: {
    url: "/drum-kit/drumsounds/hihat/hihat-shank.ogg",
    volume: BASE_VOLUME,
  },
  hihat_shank_tight: {
    url: "/drum-kit/drumsounds/hihat/hihat-shank-tight.ogg",
    volume: BASE_VOLUME,
  },
  kick: { url: "/drum-kit/drumsounds/kick/kick-drum.ogg", volume: BASE_VOLUME },
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
    audioLoader!.load(SOUNDS[soundId].url, (buffer) => {
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
      sound.setRefDistance(30);
      sound.setRolloffFactor(0.3);
      sound.setVolume(gain * SOUNDS[soundId].volume);
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
