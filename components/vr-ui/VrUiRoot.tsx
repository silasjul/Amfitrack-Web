"use client";

import { useState } from "react";
import {
  useXR,
  useXRControllerButtonEvent,
  useXRInputSourceState,
} from "@react-three/xr";
import VrLeftPanel from "./VrLeftPanel";
import VrRightPanel from "./VrRightPanel";

export default function VrUiRoot() {
  const inXR = useXR((s) => s.mode != null);
  const [open, setOpen] = useState(true);
  const toggle = () => setOpen((o) => !o);

  const leftController = useXRInputSourceState("controller", "left");
  const rightController = useXRInputSourceState("controller", "right");

  useXRControllerButtonEvent(leftController, "x-button", (state) => {
    if (state === "pressed") toggle();
  });
  useXRControllerButtonEvent(rightController, "a-button", (state) => {
    if (state === "pressed") toggle();
  });

  if (!inXR || !open) return null;

  return (
    <>
      <group position={[-0.7, 1.5, -1.2]} rotation={[0, Math.PI / 8, 0]}>
        <VrLeftPanel />
      </group>
      <group position={[0.7, 1.5, -1.2]} rotation={[0, -Math.PI / 8, 0]}>
        <VrRightPanel />
      </group>
    </>
  );
}
