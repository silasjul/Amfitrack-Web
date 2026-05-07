import { create } from "zustand";

interface DrumDemoState {
  isDebug: boolean;
  setIsDebug: (value: boolean) => void;
  drumHeight: number;
  setDrumHeight: (value: number) => void;
}

export const useDrumDemoStore = create<DrumDemoState>((set) => ({
  isDebug: true,
  setIsDebug: (isDebug) => set({ isDebug }),
  drumHeight: 0.23,
  setDrumHeight: (drumHeight) => set({ drumHeight }),
}));
