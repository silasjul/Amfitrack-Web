"use client";

import { useEffect } from "react";
import { useActiveSceneStore } from "@/stores/useActiveSceneStore";

export default function Page() {
  useEffect(() => {
    useActiveSceneStore.getState().setScene("star-wars");
  }, []);
  return null;
}
