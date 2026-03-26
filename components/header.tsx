"use client";

import * as React from "react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { GalleryVerticalEndIcon } from "lucide-react";

export function Header() {
  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <a href="https://www.amfitrack.com/" target="_blank">
          <SidebarMenuButton
            size="lg"
            className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
          >
            <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-black text-sidebar-primary-foreground">
              <img src="/amfitrack.svg" alt="Amfitrack Logo" className="size-4" />
            </div>
            <div className="flex flex-col gap-0.5 leading-none">
              <span className="font-medium">Amfitrack Web</span>
              <span className="">v1.0</span>
            </div>
          </SidebarMenuButton>
        </a>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
