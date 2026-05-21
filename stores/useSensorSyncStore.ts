import { create } from "zustand";

interface SensorSyncState {
  positionScale: number;
  setPositionScale: (value: number) => void;
}

export const useSensorSyncStore = create<SensorSyncState>((set) => ({
  positionScale: 0.01,
  setPositionScale: (positionScale) => set({ positionScale }),
}));
