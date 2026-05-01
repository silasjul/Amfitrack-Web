"use client";

import { useRecordingStore } from "@/stores/useRecordingStore";

type SidebarOverlayProps = {
  side: "left" | "right";
};

export function SidebarOverlay({ side }: SidebarOverlayProps) {
  const isRecording = useRecordingStore((s) => s.isRecording);

  if (!isRecording) return null;

  return (
    <div
      className={`absolute inset-y-0 top-0 z-50 bg-background/60 backdrop-blur-[2px] ${
        side === "left" ? "left-0" : "right-0"
      }`}
      style={{ width: "var(--sidebar-width)" }}
    />
  );
}
