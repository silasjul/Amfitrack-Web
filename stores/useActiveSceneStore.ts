import { create } from "zustand";

export type SceneId = "drum-kit" | "star-wars" | "viewer";

interface ActiveSceneState {
  scene: SceneId;
  setScene: (scene: SceneId) => void;
}

export const useActiveSceneStore = create<ActiveSceneState>((set) => ({
  scene: "drum-kit",
  setScene: (scene) => set({ scene }),
}));
