"use client";

import * as React from "react";

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  SidebarGroup,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
} from "@/components/ui/sidebar";
import { Box, ChevronRight } from "lucide-react";
import { usePathname } from "next/navigation";
import { MainNavContentData } from "./app-sidebar";
import Link from "next/link";

export default function MainNavContent({
  navMain,
}: {
  navMain: MainNavContentData;
}) {
  const pathname = usePathname();

  return (
    <SidebarGroup>
      <ViewerButton />
      <SidebarMenu>
        {navMain.map((item) => (
          <Collapsible
            key={item.title}
            asChild
            defaultOpen={item.items?.some((sub) => pathname === sub.url)}
            className="group/collapsible"
          >
            <SidebarMenuItem>
              <CollapsibleTrigger asChild>
                <SidebarMenuButton
                  tooltip={item.title}
                  isActive={item.items?.some((sub) => pathname === sub.url)}
                >
                  {item.icon && <item.icon />}
                  <span>{item.title}</span>
                  <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                </SidebarMenuButton>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <SidebarMenuSub>
                  {item.items?.map((subItem) => (
                    <SidebarMenuSubItem key={subItem.title}>
                      <SidebarMenuSubButton
                        isActive={pathname === subItem.url}
                        asChild
                      >
                        <Link href={subItem.url}>
                          {subItem.icon && <subItem.icon />}
                          <span>{subItem.title}</span>
                        </Link>
                      </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                  ))}
                </SidebarMenuSub>
              </CollapsibleContent>
            </SidebarMenuItem>
          </Collapsible>
        ))}
      </SidebarMenu>
    </SidebarGroup>
  );
}

function ViewerButton() {
  const pathname = usePathname();

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <SidebarMenuButton
          asChild
          tooltip="Viewer"
          isActive={pathname === "/viewer"}
        >
          <a href="/viewer">
            <Box />
            <span>Viewer</span>
          </a>
        </SidebarMenuButton>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
