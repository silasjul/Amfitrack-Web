"use client";

import { useLayoutEffect } from "react";
import * as THREE from "three";
import { useThree } from "@react-three/fiber";
import { useXR } from "@react-three/xr";
import type { SceneId } from "@/stores/useActiveSceneStore";
import { SCENE_CONFIGS } from "./sceneConfigs";

export default function CanvasReset({ sceneId }: { sceneId: SceneId }) {
  const { gl, camera, scene } = useThree();
  const inXR = useXR((s) => s.mode != null);

  useLayoutEffect(() => {
    const cfg = SCENE_CONFIGS[sceneId];

    gl.toneMapping = cfg.toneMapping;
    gl.toneMappingExposure = cfg.toneMappingExposure;

    scene.background = null;
    scene.environment = null;

    if (!inXR) {
      const cam = camera as THREE.PerspectiveCamera;
      cam.position.fromArray(cfg.camera.position);
      cam.rotation.set(0, 0, 0);
      cam.quaternion.identity();
      cam.up.set(0, 1, 0);
      cam.fov = cfg.camera.fov;
      cam.near = cfg.camera.near;
      cam.far = cfg.camera.far;
      cam.updateProjectionMatrix();
    }
  }, [sceneId, gl, camera, scene, inXR]);

  return null;
}
