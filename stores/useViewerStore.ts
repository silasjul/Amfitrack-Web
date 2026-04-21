import { create } from "zustand";

interface ViewerState {
  selectedSensorId: number | null;
  hoveredSensorId: number | null;
  setSelectedSensorId: (id: number | null) => void;
  setHoveredSensorId: (id: number | null) => void;
}

export const useViewerStore = create<ViewerState>((set) => ({
  selectedSensorId: null,
  hoveredSensorId: null,
  setSelectedSensorId: (id) => set({ selectedSensorId: id }),
  setHoveredSensorId: (id) => set({ hoveredSensorId: id }),
}));
