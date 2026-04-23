"use client";

import * as React from "react";

import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

export default function Header() {
  return (
    <div>
      <a href="https://www.amfitrack.com/" target="_blank">
        <SidebarMenuButton
          size="lg"
          className="data-active:bg-transparent transition-colors"
          isActive
        >
          <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-white text-sidebar-primary-foreground">
            <img
              src="/amfitrack.svg"
              alt="Amfitrack Logo"
              className="size-4 brightness-0"
            />
          </div>
          <div className="flex flex-col gap-0.5 leading-none">
            <span className="font-medium">Amfitrack</span>
          </div>
        </SidebarMenuButton>
      </a>
    </div>
  );
}
