import { create } from "zustand";

interface ViewerState {
  selectedDeviceId: number | null;
  hoveredSensorId: number | null;
  setSelectedDeviceId: (id: number | null) => void;
  setHoveredSensorId: (id: number | null) => void;
}

export const useViewerStore = create<ViewerState>((set) => ({
  selectedDeviceId: null,
  hoveredSensorId: null,
  setSelectedDeviceId: (id) => set({ selectedDeviceId: id }),
  setHoveredSensorId: (id) => set({ hoveredSensorId: id }),
}));
