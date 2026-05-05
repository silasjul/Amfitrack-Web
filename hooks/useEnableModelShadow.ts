import { useEffect } from "react";
import * as THREE from "three";

export default function useEnableModelShadow(scene: THREE.Group) {
  useEffect(() => {
    scene.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });
  }, [scene]);
}
