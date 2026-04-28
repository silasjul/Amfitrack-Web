import * as React from "react";
import { ArrowLeftRight, Bug } from "lucide-react";

import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

export default function NavSecondary() {
  return (
    <SidebarGroup>
      <SidebarGroupContent>
        <SidebarMenu>
        <SidebarMenuItem>
            <SidebarMenuButton asChild size="sm">
              <div>
                <Bug />
                <span>Record/Logging</span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton asChild size="sm">
              <div>
                <ArrowLeftRight />
                <span>Config transfer</span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}
