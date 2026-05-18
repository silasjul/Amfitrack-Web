"use client";

import { lazy } from "react";
import {
  useActiveSceneStore,
  type SceneId,
} from "@/stores/useActiveSceneStore";
import CanvasReset from "./CanvasReset";

const DrumKitScene = lazy(() => import("./scenes/DrumKitScene"));
const StarWarsScene = lazy(() => import("./scenes/StarWarsScene"));
const ViewerScene = lazy(() => import("./scenes/ViewerScene"));

export default function SceneManager() {
  const scene = useActiveSceneStore((s) => s.scene);

  return (
    <>
      <CanvasReset sceneId={scene} />
      <group key={scene}>{renderScene(scene)}</group>
    </>
  );
}

function renderScene(scene: SceneId) {
  switch (scene) {
    case "drum-kit":
      return <DrumKitScene />;
    case "star-wars":
      return <StarWarsScene />;
    case "viewer":
      return <ViewerScene />;
  }
}
