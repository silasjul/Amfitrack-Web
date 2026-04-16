"use client";

import { cn } from "@/lib/utils";
import { type DeviceFrequency } from "@/amfitrackWebSDK/AmfitrackWeb";
import { type Configuration } from "@/amfitrackWebSDK/Configurator";
import { FrequencyHoverCard } from "@/components/frequency-breakdown";
import { Settings } from "lucide-react";

export function HubRow({
  id,
  frequency,
  isSelected,
  onSelect,
  onOpenSettings,
}: {
  id: number | null;
  frequency?: DeviceFrequency;
  configuration: Configuration[];
  isSelected: boolean;
  onSelect: () => void;
  onOpenSettings: () => void;
}) {
  const label = `HUB_${id ?? "?"}`;

  const hz = frequency?.totalHz ?? 0;

  return (
    <button
      onClick={onSelect}
      className={cn(
        "group w-full flex items-center gap-2.5 px-3 py-2 text-left rounded-lg transition-all duration-150",
        isSelected
          ? "bg-sidebar-foreground/8 ring-1 ring-sidebar-foreground/10"
          : "ring-1 ring-transparent",
        "hover:bg-white/13",
      )}
    >
      <div
        className={cn(
          "size-2 rounded-full shrink-0 bg-emerald-500",
          "ring-2 ring-offset-1 ring-offset-sidebar-accent ring-emerald-500/30",
        )}
      />
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <span
            className={cn(
              "text-xs font-medium truncate transition-colors",
              isSelected
                ? "text-sidebar-foreground"
                : "text-sidebar-foreground/70 group-hover:text-sidebar-foreground/90",
            )}
          >
            {label}
          </span>
        </div>
        <div className="flex items-center gap-2 mt-0.5 h-4">
          <FrequencyHoverCard frequency={frequency}>
            <span
              className={cn(
                "text-[10px] font-mono tabular-nums cursor-default leading-4 text-sidebar-foreground/35",
              )}
            >
              {hz.toFixed(0)}Hz
            </span>
          </FrequencyHoverCard>
        </div>
      </div>

      <div
        role="button"
        tabIndex={0}
        onClick={(e) => {
          e.stopPropagation();
          onOpenSettings();
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.stopPropagation();
            onOpenSettings();
          }
        }}
        className={cn(
          "flex h-6 w-6 shrink-0 items-center justify-center rounded-full transition-all duration-200",
          "text-sidebar-foreground/20 hover:text-sidebar-foreground/60 hover:bg-white/10",
          isSelected && "text-sidebar-foreground/40",
        )}
      >
        <Settings className="h-3.5 w-3.5" />
      </div>
    </button>
  );
}
