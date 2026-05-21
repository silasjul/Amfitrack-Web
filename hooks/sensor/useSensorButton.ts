import { useEffect, useRef } from "react";
import { useDeviceStore } from "@/amfitrackSDK";

interface UseSensorButtonOptions {
  onPress?: () => void;
  onRelease?: () => void;
}

export function useSensorButton(
  sensorId: number | undefined,
  { onPress, onRelease }: UseSensorButtonOptions,
) {
  const onPressRef = useRef(onPress);
  const onReleaseRef = useRef(onRelease);
  onPressRef.current = onPress;
  onReleaseRef.current = onRelease;

  useEffect(() => {
    if (sensorId === undefined) return;
    // Subscribe directly to the store to fire only on press/release transitions,
    // not on every incoming frame.
    let prev =
      useDeviceStore.getState().emfImuFrameId[sensorId]?.buttonPressed ?? false;
    const unsubscribe = useDeviceStore.subscribe((state) => {
      const next = state.emfImuFrameId[sensorId]?.buttonPressed ?? false;
      if (next === prev) return;
      prev = next;
      if (next) onPressRef.current?.();
      else onReleaseRef.current?.();
    });
    return unsubscribe;
  }, [sensorId]);
}
