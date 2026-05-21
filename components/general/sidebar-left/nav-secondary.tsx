"use client";

import * as React from "react";
import { ArrowLeftRight, Bug, RectangleGoggles, LogOut } from "lucide-react";
import { toast } from "sonner";
import ConfigTransferDialog from "@/components/general/sidebar-left/nav-secondary-components/ConfigTransferDialog";
import RecordDialog from "@/components/general/sidebar-left/nav-secondary-components/RecordDialog";
import { xrStore } from "@/stores/xrStore";
import { useIsInXR } from "@/hooks/xr/useIsInXR";
import { useIsVRSupported } from "@/hooks/xr/useIsVRSupported";

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
  const inXR = useIsInXR();
  const vrSupported = useIsVRSupported();

  const handleToggleXR = async () => {
    if (inXR) return;
    try {
      await xrStore.enterVR();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to enter VR";
      toast.error(message);
    }
  };

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
            {vrSupported && (
              <SidebarMenuItem>
                <SidebarMenuButton size="sm" onClick={handleToggleXR}>
                  <RectangleGoggles />
                  <span>Enter VR</span>
                </SidebarMenuButton>       
              </SidebarMenuItem>
            )}
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
