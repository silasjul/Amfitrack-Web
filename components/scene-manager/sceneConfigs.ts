import * as THREE from "three";
import type { SceneId } from "@/stores/useActiveSceneStore";

export type SceneConfig = {
  camera: {
    position: [number, number, number];
    fov: number;
    near: number;
    far: number;
  };
  toneMapping: THREE.ToneMapping;
  toneMappingExposure: number;
};

export const SCENE_CONFIGS: Record<SceneId, SceneConfig> = {
  "drum-kit": {
    camera: { position: [0.2, 7.3, -4.6], fov: 70, near: 0.1, far: 1000 },
    toneMapping: THREE.ReinhardToneMapping,
    toneMappingExposure: 1,
  },
  "star-wars": {
    camera: { position: [0, 0.25, 2], fov: 50, near: 0.1, far: 1000 },
    toneMapping: THREE.ReinhardToneMapping,
    toneMappingExposure: 3,
  },
  viewer: {
    camera: {
      position: [-1.3 * 0.75, 4.1 * 0.75, 8.9 * 0.75],
      fov: 50,
      near: 0.1,
      far: 1000,
    },
    toneMapping: THREE.ACESFilmicToneMapping,
    toneMappingExposure: 1,
  },
};
