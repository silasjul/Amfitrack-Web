import { DISTORTION_THRESHOLDS } from "@/config/distortion";
import * as THREE from "three";

export function applyDistortionColor(
  material: { color: THREE.Color },
  distortion: number,
  cleanColor: THREE.Color,
  distortedColor: THREE.Color,
  threshold: number = DISTORTION_THRESHOLDS.CLEAN,
) {
  if (distortion < threshold) {
    material.color.copy(cleanColor);
  } else {
    material.color.lerpColors(cleanColor, distortedColor, distortion);
  }
}
