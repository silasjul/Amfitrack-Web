"use client";

import * as React from "react";

import { Header } from "@/components/sidebar-left/header";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
  SidebarRail,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { Plus, Minus, Move3DIcon } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Footer from "./footer/footer";

const data = {
  navMain: [
    {
      title: "Demos",
      url: "#",
      items: [],
    },
    {
      title: "Minigames",
      url: "#",
      items: [
        {
          title: "Star Wars",
          url: "/minigames/star-wars"
        },
      ],
    },
  ],
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname();

  return (
    <Sidebar {...props}>
      <SidebarHeader>
        <Header />
      </SidebarHeader>
      <SidebarContent className="gap-0">
        <SidebarGroup>
          <SidebarMenu>
            <Link href="/viewer">
              <SidebarMenuItem className="flex items-center gap-2">
                <SidebarMenuButton className="min-w-8 bg-primary text-primary-foreground duration-200 ease-linear hover:bg-primary/90 hover:text-primary-foreground active:bg-primary/90 active:text-primary-foreground">
                  <Move3DIcon />
                  <span>Viewer</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </Link>
          </SidebarMenu>
        </SidebarGroup>

        {/* Testing */}
        <SidebarGroup>
          <SidebarGroupLabel>Games</SidebarGroupLabel>
          <SidebarMenu>
            {data.navMain.map((item, index) => (
              <Collapsible
                key={item.title}
                defaultOpen={item.items.some((sub) => pathname === sub.url)}
                className="group/collapsible"
              >
                <SidebarMenuItem>
                  <CollapsibleTrigger asChild>
                    <SidebarMenuButton>
                      {item.title}{" "}
                      <Plus className="ml-auto group-data-[state=open]/collapsible:hidden" />
                      <Minus className="ml-auto group-data-[state=closed]/collapsible:hidden" />
                    </SidebarMenuButton>
                  </CollapsibleTrigger>
                  {item.items?.length ? (
                    <CollapsibleContent>
                      <SidebarMenuSub>
                        {item.items.map((item) => (
                          <SidebarMenuSubItem key={item.title}>
                            <SidebarMenuSubButton
                              asChild
                              isActive={pathname === item.url}
                            >
                              <Link href={item.url}>{item.title}</Link>
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                        ))}
                      </SidebarMenuSub>
                    </CollapsibleContent>
                  ) : null}
                </SidebarMenuItem>
              </Collapsible>
            ))}
          </SidebarMenu>
        </SidebarGroup>

      </SidebarContent>
      <SidebarFooter>
        <Footer />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
