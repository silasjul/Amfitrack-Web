"use client";

import * as React from "react";

import Header from "@/components/sidebar-left/header";
import Footer from "./footer";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { Box, Gamepad2, Banana } from "lucide-react";
import MainNavContent from "./main-nav-content";
import { usePathname } from "next/navigation";

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

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar {...props}>
      <SidebarHeader>{/* <Header /> */}</SidebarHeader>
      <SidebarContent className="gap-0">
        <MainNavContent navMain={data.navMain} />
      </SidebarContent>
      <SidebarFooter>{/* <Footer /> */}</SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
