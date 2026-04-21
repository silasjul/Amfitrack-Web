"use client";

import Sidebar from "@/components/viewer/sidebar-right/sidebar";
import Viewer from "@/components/viewer/Viewer";

export default function Home() {
  return (
    <Sidebar>
      <Viewer />
    </Sidebar>
  );
}
