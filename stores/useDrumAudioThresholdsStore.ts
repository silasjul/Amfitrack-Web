import { create } from "zustand";

interface DrumAudioThresholdsState {
  topNormalDeg: number;
  rimRadiusPct: number;
  snareCenterPct: number;
  setTopNormalDeg: (value: number) => void;
  setRimRadiusPct: (value: number) => void;
  setSnareCenterPct: (value: number) => void;
}

export const useDrumAudioThresholdsStore = create<DrumAudioThresholdsState>(
  (set) => ({
    topNormalDeg: 45,
    rimRadiusPct: 0.85,
    snareCenterPct: 0.45,
    setTopNormalDeg: (topNormalDeg) => set({ topNormalDeg }),
    setRimRadiusPct: (rimRadiusPct) => set({ rimRadiusPct }),
    setSnareCenterPct: (snareCenterPct) => set({ snareCenterPct }),
  }),
);
