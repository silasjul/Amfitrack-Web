import { useRef } from "react";
import { Group } from "three";
import { XROrigin } from "@react-three/xr";
import { useXRFlyLocomotion } from "@/hooks/xr/useXRFlyLocomotion";

const START_POSITION: [number, number, number] = [0, 0, 5];

export default function XRRig() {
  const originRef = useRef<Group>(null);
  useXRFlyLocomotion(originRef);

  return <XROrigin ref={originRef} position={START_POSITION} />;
}
