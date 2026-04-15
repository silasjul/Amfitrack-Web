"use client";

import { useState } from "react";
import { ScanSearch, Video, Eye, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import InspectTab from "./InspectTab";
import RecordTab from "./RecordTab";
import Viewtab from "./Viewtab";
import { ScrollArea } from "@/components/ui/scroll-area";

type Tab = {
  id: string;
  label: string;
  icon: LucideIcon;
  content: React.ReactNode;
};

const tabs: Tab[] = [
  { id: "inspect", label: "Inspect", icon: ScanSearch, content: <InspectTab /> },
  { id: "record", label: "Record", icon: Video, content: <RecordTab /> },
  { id: "view", label: "View", icon: Eye, content: <Viewtab /> },
];

export default function SidebarLower() {
  const [activeTab, setActiveTab] = useState(tabs[0].id);
  const current = tabs.find((t) => t.id === activeTab)!;

  return (
    <div className="flex flex-col w-full h-full">
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
                        : "text-sidebar-foreground/35"
                    )}
                  >
                    <Icon className="size-3" strokeWidth={isActive ? 2.2 : 1.8} />
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

      <ScrollArea className="flex-1 min-h-0 pl-1 pr-1">
        {current.content}
      </ScrollArea>
    </div>
  );
}
