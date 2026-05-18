import { create } from "zustand";

interface DrumAudioThresholdsState {
  topNormalDeg: number;
  rimRadiusPct: number;
  snareCenterPct: number;
  bellRadiusPct: number;
  hihatTipRadiusPct: number;
  setTopNormalDeg: (value: number) => void;
  setRimRadiusPct: (value: number) => void;
  setSnareCenterPct: (value: number) => void;
  setBellRadiusPct: (value: number) => void;
  setHihatTipRadiusPct: (value: number) => void;
}

export const useDrumAudioThresholdsStore = create<DrumAudioThresholdsState>(
  (set) => ({
    topNormalDeg: 45,
    rimRadiusPct: 0.85,
    snareCenterPct: 0.45,
    bellRadiusPct: 0.2,
    hihatTipRadiusPct: 0.5,
    setTopNormalDeg: (topNormalDeg) => set({ topNormalDeg }),
    setRimRadiusPct: (rimRadiusPct) => set({ rimRadiusPct }),
    setSnareCenterPct: (snareCenterPct) => set({ snareCenterPct }),
    setBellRadiusPct: (bellRadiusPct) => set({ bellRadiusPct }),
    setHihatTipRadiusPct: (hihatTipRadiusPct) => set({ hihatTipRadiusPct }),
  }),
);
