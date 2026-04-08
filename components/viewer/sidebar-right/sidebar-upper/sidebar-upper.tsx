"use client";

import { useAmfitrack } from "@/hooks/useAmfitrack";
import { Radio } from "lucide-react";

export default function SidebarUpper() {
  const { sensorIds } = useAmfitrack();

  return (
    <div className="flex h-full w-full flex-col overflow-y-auto">
      <div className="flex-1 flex flex-col mx-1 mt-0 mb-0.5 bg-sidebar-accent rounded-b-md">
        {sensorIds.length === 0 && (
          <span className="px-3 py-2 text-xs text-sidebar-foreground/40">
            No sensors detected.
          </span>
        )}
        {sensorIds.map((id, index) => (
          <button
            key={id}
            className="flex items-center gap-2 px-3 py-1 text-left text-sm transition-colors hover:bg-sidebar-accent"
          >
            <Radio className="size-3.5 shrink-0 text-sidebar-foreground/60" />
            <span className="truncate text-sidebar-foreground">
              sensor_{index + 1}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
