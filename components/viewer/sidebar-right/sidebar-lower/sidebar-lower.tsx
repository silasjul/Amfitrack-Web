"use client";

import { useState } from "react";
import { ScanSearch, Video, Palette, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ScrollArea } from "@/components/ui/scroll-area";
import InspectTab from "./InspectTab";
import RecordTab from "./RecordTab";
import Viewtab from "./Viewtab";

type Tab = {
  id: string;
  label: string;
  icon: LucideIcon;
  content: React.ReactNode;
};

const tabs: Tab[] = [
  {
    id: "inspect",
    label: "Inspect",
    icon: ScanSearch,
    content: <InspectTab />,
  },
  { id: "view", label: "View", icon: Palette, content: <Viewtab /> },
  { id: "record", label: "Record", icon: Video, content: <RecordTab /> },
];

export default function SidebarLower() {
  const [activeTab, setActiveTab] = useState(tabs[0].id);
  const current = tabs.find((t) => t.id === activeTab)!;

  return (
    <div className="flex flex-col w-full h-full pt-0.5">
      <TooltipProvider>
        <nav className="flex items-center gap-px px-1 shrink-0">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = tab.id === activeTab;
            return (
              <Tooltip key={tab.id}>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => setActiveTab(tab.id)}
                    className={cn(
                      "flex items-center justify-center h-5 w-7 rounded-t-sm transition-colors",
                      "hover:bg-sidebar-accent hover:text-sidebar-foreground/80",
                      "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
                      isActive
                        ? "bg-sidebar text-sidebar-foreground"
                        : "text-sidebar-foreground/35",
                    )}
                  >
                    <Icon
                      className="size-3"
                      strokeWidth={isActive ? 2.2 : 1.8}
                    />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="top" sideOffset={4}>
                  {tab.label}
                </TooltipContent>
              </Tooltip>
            );
          })}
        </nav>
      </TooltipProvider>

      <div className="min-h-0 flex-1 px-1">
        <ScrollArea
          className={cn(
            "h-full min-h-0 w-full rounded-t-sm bg-sidebar",
            activeTab === "inspect" && "rounded-tl-none",
          )}
        >
          {current.content}
        </ScrollArea>
      </div>
    </div>
  );
}
