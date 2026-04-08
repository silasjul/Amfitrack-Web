"use client";

import * as React from "react";

import {
  RightSidebar,
  RightSidebarRail,
} from "@/components/ui/sidebar-right";
import {
  SidebarContent,
  SidebarHeader,
  SidebarFooter,
} from "@/components/ui/sidebar";

export function AppSidebar({
  ...props
}: React.ComponentProps<typeof RightSidebar>) {
  return (
    <RightSidebar {...props}>
      <SidebarHeader />
      <SidebarContent className="gap-0" />
      <SidebarFooter />
      <RightSidebarRail />
    </RightSidebar>
  );
}
