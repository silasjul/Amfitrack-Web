"use client";

import * as React from "react";

import { RightSidebar, RightSidebarRail } from "@/components/ui/sidebar-right";
import {
  SidebarContent,
  SidebarHeader,
  SidebarFooter,
} from "@/components/ui/sidebar";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";

export function AppSidebar({
  ...props
}: React.ComponentProps<typeof RightSidebar>) {
  return (
    <RightSidebar {...props}>
      <SidebarContent className="gap-0">
        <ResizablePanelGroup
          orientation="vertical"
          className="min-h-[200px] max-w-sm rounded-lg border"
        >
          <ResizablePanel defaultSize="25%">
            <div className="flex h-full items-center justify-center p-6">
              <span className="font-semibold">Header</span>
            </div>
          </ResizablePanel>
          <ResizableHandle withHandle />
          <ResizablePanel defaultSize="75%">
            <div className="flex h-full items-center justify-center p-6">
              <span className="font-semibold">Content</span>
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      </SidebarContent>
      <RightSidebarRail />
    </RightSidebar>
  );
}
