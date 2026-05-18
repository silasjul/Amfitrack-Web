import { useSyncExternalStore } from "react";
import { xrStore } from "@/stores/xrStore";

const getSnapshot = () => xrStore.getState().mode != null;
const getServerSnapshot = () => false;

export function useIsInXR(): boolean {
  return useSyncExternalStore(xrStore.subscribe, getSnapshot, getServerSnapshot);
}
