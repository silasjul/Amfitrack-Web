"use client";

import * as React from "react";
import { PanelRightIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { AppSidebar } from "@/components/viewer/sidebar-right/app-sidebar";

const SIDEBAR_WIDTH = "16rem";

type RightSidebarContextProps = {
  open: boolean;
  toggle: () => void;
};

const RightSidebarContext =
  React.createContext<RightSidebarContextProps | null>(null);

export function useRightSidebar() {
  const ctx = React.useContext(RightSidebarContext);
  if (!ctx)
    throw new Error("useRightSidebar must be used within RightSidebarProvider");
  return ctx;
}

export function RightSidebarProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [open, setOpen] = React.useState(true);
  const toggle = React.useCallback(() => setOpen((prev) => !prev), []);

  return (
    <RightSidebarContext.Provider value={{ open, toggle }}>
      <div className="relative flex h-full w-full overflow-hidden">
        {children}
      </div>
    </RightSidebarContext.Provider>
  );
}

export function RightSidebarTrigger({
  className,
  children,
  ...props
}: React.ComponentProps<typeof Button>) {
  const { toggle } = useRightSidebar();

  return (
    <Button
      size="icon-sm"
      className={cn(className)}
      onClick={toggle}
      {...props}
    >
      {children ?? <PanelRightIcon />}
      <span className="sr-only">Toggle Right Sidebar</span>
    </Button>
  );
}

export function RightSidebarPanel({
  className,
  children,
}: {
  className?: string;
  children?: React.ReactNode;
}) {
  const { open } = useRightSidebar();

  return (
    <div
      className={cn(
        "h-full shrink-0 border-l border-sidebar-border bg-sidebar text-sidebar-foreground transition-[width] duration-200 ease-linear overflow-hidden",
        className,
      )}
      style={{ width: open ? SIDEBAR_WIDTH : "0px" }}
    >
      <div className="flex h-full flex-col" style={{ width: SIDEBAR_WIDTH }}>
        {children}
      </div>
    </div>
  );
}

export function RightSidebarInset({
  className,
  children,
}: {
  className?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className={cn("relative flex-1 min-w-0 overflow-hidden", className)}>
      {children}
    </div>
  );
}

export default function Sidebar({ children }: { children: React.ReactNode }) {
  return (
    <RightSidebarProvider>
      <RightSidebarInset>
        <div className="absolute top-0 right-0 z-10 flex shrink-0 items-center gap-2 p-2">
          <RightSidebarTrigger className="bg-[#292d39] p-4 shadow-[0_0_9px_0_#00000088] text-[#8c92a4] hover:text-white" />
        </div>
        {children}
      </RightSidebarInset>
      <AppSidebar />
    </RightSidebarProvider>
  );
}
