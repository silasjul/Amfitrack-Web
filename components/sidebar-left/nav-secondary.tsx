"use client";

import * as React from "react";
import { ArrowLeftRight, Bug } from "lucide-react";
import ConfigTransferDialog from "@/components/sidebar-left/nav-secondary-components/ConfigTransferDialog";
import RecordDialog from "@/components/sidebar-left/nav-secondary-components/RecordDialog";

import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

export default function NavSecondary() {
  const [isConfigTransferDialogOpen, setIsConfigTransferDialogOpen] =
    React.useState(false);
  const [isRecordDialogOpen, setIsRecordDialogOpen] = React.useState(false);

  return (
    <>
      <SidebarGroup className="pb-0">
        <SidebarGroupContent>
          <SidebarMenu className="">
            <SidebarMenuItem>
              <SidebarMenuButton
                asChild
                size="sm"
                onClick={() => setIsRecordDialogOpen(true)}
              >
                <div>
                  <Bug />
                  <span>Recording</span>
                </div>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton
                size="sm"
                onClick={() => setIsConfigTransferDialogOpen(true)}
              >
                <ArrowLeftRight />
                <span>Config transfer</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>

      <ConfigTransferDialog
        open={isConfigTransferDialogOpen}
        onOpenChange={setIsConfigTransferDialogOpen}
      />
      <RecordDialog
        open={isRecordDialogOpen}
        onOpenChange={setIsRecordDialogOpen}
      />
    </>
  );
}
