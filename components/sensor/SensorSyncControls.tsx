"use client";

import { useEffect } from "react";
import { useControls } from "leva";
import { useSensorSyncStore } from "@/stores/useSensorSyncStore";

export default function SensorSyncControls() {
  const setPositionScale = useSensorSyncStore((s) => s.setPositionScale);

  const { positionScale } = useControls("Sensor sync", {
    positionScale: {
      value: 0.01,
      min: 0.001,
      max: 0.05,
      step: 0.0001,
      label: "Position scale",
    },
  });

  useEffect(() => {
    setPositionScale(positionScale);
  }, [positionScale, setPositionScale]);

  return null;
}
