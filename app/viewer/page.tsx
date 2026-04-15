"use client";

import Sidebar from "@/components/viewer/sidebar-right/sidebar";
import Viewer from "@/components/viewer/Viewer";
import { ViewerContext, useViewerProvider } from "@/hooks/useViewer";

export default function Home() {
  const viewer = useViewerProvider();

  return (
    <ViewerContext.Provider value={viewer}>
      <Sidebar>
        <Viewer />
      </Sidebar>
    </ViewerContext.Provider>
  );
}
