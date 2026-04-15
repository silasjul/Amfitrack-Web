import { createContext, useContext, useState } from "react";

interface ViewerContextValue {
  selectedSensorId: number | null;
  setSelectedSensorId: (id: number | null) => void;
  hoveredSensorId: number | null;
  setHoveredSensorId: (id: number | null) => void;
}

export const ViewerContext = createContext<ViewerContextValue | null>(null);

export function useViewer() {
  const ctx = useContext(ViewerContext);
  if (!ctx) {
    throw new Error("useViewer must be used within a ViewerProvider");
  }
  return ctx;
}

export function useViewerProvider(): ViewerContextValue {
  const [selectedSensorId, setSelectedSensorId] = useState<number | null>(null);
  const [hoveredSensorId, setHoveredSensorId] = useState<number | null>(null);

  return {
    selectedSensorId,
    setSelectedSensorId,
    hoveredSensorId,
    setHoveredSensorId,
  };
}
