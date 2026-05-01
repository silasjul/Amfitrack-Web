"use client";

import * as React from "react";

import Header from "@/components/sidebar-left/header";
import Footer from "./footer";
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarRail,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import { Box, Gamepad2, Banana } from "lucide-react";
import MainNavContent from "./main-nav-content";
import TransportItems from "./transport-items";
import NavSecondary from "./nav-secondary";
import { SidebarOverlay } from "../recording/SidebarOverlay";

const data = {
  navMain: [
    {
      title: "Demos",
      url: "#",
      icon: Gamepad2,
      items: [],
    },
    {
      title: "Minigames",
      icon: Banana,
      url: "#",
      items: [
        {
          title: "Star Wars",
          url: "/minigames/star-wars",
        },
      ],
    },
  ],
};

export type MainNavContentData = typeof data.navMain;

export function AppSidebar({
  className,
  ...props
}: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar {...props}>
      <SidebarOverlay side="left" />
      <SidebarHeader >
        <Header />
      </SidebarHeader>
      <SidebarContent className="gap-0">
        <MainNavContent navMain={data.navMain} />
        <TransportItems />
      </SidebarContent>
      <SidebarFooter className="p-0 gap-0">
        <NavSecondary />
        <Footer />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
