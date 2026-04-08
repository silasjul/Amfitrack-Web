"use client";

import * as React from "react";
import { useState } from "react";

import { RightSidebar, RightSidebarRail } from "@/components/ui/sidebar-right";
import { SidebarContent } from "@/components/ui/sidebar";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import SidebarUpper from "./sidebar-upper/sidebar-upper";
import SidebarLower from "./sidebar-lower";

export function AppSidebar({
  ...props
}: React.ComponentProps<typeof RightSidebar>) {
  const [selectedSensorId, setSelectedSensorId] = useState<number | null>(null);

  return (
    <RightSidebar {...props} className="font-roboto-mono">
      <SidebarContent className="gap-0 bg-black/30">
        <ResizablePanelGroup
          orientation="vertical"
          className="min-h-[200px] max-w-sm"
        >
          <ResizablePanel defaultSize="25%">
            <SidebarUpper
              selectedSensorId={selectedSensorId}
              onSelectSensor={setSelectedSensorId}
            />
          </ResizablePanel>
          <ResizableHandle className="bg-transparent ring-0 ring-offset-0 aria-[orientation=horizontal]:bg-transparent" />
          <ResizablePanel defaultSize="75%">
            <SidebarLower selectedSensorId={selectedSensorId} />
          </ResizablePanel>
        </ResizablePanelGroup>
      </SidebarContent>
      <RightSidebarRail />
    </RightSidebar>
  );
}
