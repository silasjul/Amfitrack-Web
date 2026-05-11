import * as THREE from "three";

/**
 * Metal distortion level thresholds (0.0 – 1.0).
 *
 * A reading below CLEAN is considered undistorted.
 * A reading between CLEAN and MODERATE is moderately distorted.
 * Anything above MODERATE is considered highly distorted.
 */
export const DISTORTION_THRESHOLDS = {
  CLEAN: 0.5,
  MODERATE: 0.7,
} as const;

export type DistortionLevel = "clean" | "moderate" | "high";

export function getDistortionLevel(distortion: number): DistortionLevel {
  if (distortion < DISTORTION_THRESHOLDS.CLEAN) return "clean";
  if (distortion < DISTORTION_THRESHOLDS.MODERATE) return "moderate";
  return "high";
}
