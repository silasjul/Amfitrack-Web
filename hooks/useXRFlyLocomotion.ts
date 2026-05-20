import { RefObject } from "react";
import { Object3D } from "three";
import { useXRControllerLocomotion } from "@react-three/xr";

type FlyOptions = {
  speed?: number;
  rotationDegrees?: number;
  hand?: "left" | "right";
};

// Like `useXRControllerLocomotion`, but also applies the vertical component of
// the thumbstick-translation vector so the user flies in the direction the
// headset is facing instead of being locked to the XZ plane.
export function useXRFlyLocomotion(
  target: RefObject<Object3D | null>,
  { speed = 3, rotationDegrees = 30, hand = "left" }: FlyOptions = {},
) {
  useXRControllerLocomotion(
    (velocity, rotationVelocityY, deltaTime) => {
      const obj = target.current;
      if (!obj) return;
      obj.position.x += velocity.x * deltaTime;
      obj.position.y += velocity.y * deltaTime;
      obj.position.z += velocity.z * deltaTime;
      obj.rotation.y += rotationVelocityY;
    },
    { speed },
    { type: "snap", degrees: rotationDegrees },
    hand,
  );
}
