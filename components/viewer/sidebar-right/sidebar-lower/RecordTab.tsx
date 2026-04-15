"use client";

import { Video } from "lucide-react";

export default function RecordTab() {
  return (
    <div className="flex-1 flex items-center justify-center h-full p-6">
      <div className="text-center space-y-2">
        <div className="mx-auto size-12 rounded-full bg-sidebar/60 flex items-center justify-center">
          <Video className="size-5 text-sidebar-foreground/20" />
        </div>
        <p className="text-xs text-sidebar-foreground/30">
          <span className="text-[10.5px]">Recording coming soon</span>
        </p>
      </div>
    </div>
  );
}
