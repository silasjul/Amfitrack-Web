"use client";

import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import type { EmfImuFrameIdData, DeviceFrequency } from "@/amfitrackSDK";
import { getDistortionLevel } from "@/config/distortion";
import { FrequencyHoverCard } from "@/components/frequency-breakdown";
import { useViewerStore } from "@/stores/useViewerStore";
import {
  Settings,
  BatteryFull,
  BatteryMedium,
  BatteryLow,
  BatteryWarning,
} from "lucide-react";

export function SensorRow({
  id,
  label,
  data,
  frequency,
  isSelected,
  isHovered,
  onSelect,
  onOpenSettings,
}: {
  id: number;
  label: string;
  data?: EmfImuFrameIdData;
  frequency?: DeviceFrequency;
  isSelected: boolean;
  isHovered: boolean;
  onSelect: () => void;
  onOpenSettings: () => void;
}) {
  const setHoveredSensorId = useViewerStore((s) => s.setHoveredSensorId);
  const distortion = data ? data.metalDistortion / 255 : 0;
  const level = getDistortionLevel(distortion);

  const dotColor = {
    clean: "bg-emerald-500",
    moderate: "bg-amber-500",
    high: "bg-red-500",
  }[level];

  const ringColor = {
    clean: "ring-emerald-500/30",
    moderate: "ring-amber-500/30",
    high: "ring-red-500/30",
  }[level];

  const hz = frequency?.totalHz ?? 0;

  return (
    <button
      onPointerOver={() => setHoveredSensorId(id)}
      onPointerOut={() => setHoveredSensorId(null)}
      onClick={onSelect}
      className={cn(
        "w-full flex items-center gap-2.5 px-3 py-2 text-left rounded-lg transition-[width,height,padding]",
        isSelected
          ? "bg-sidebar-foreground/8 ring-1 ring-sidebar-foreground/10"
          : "ring-1 ring-transparent hover:[&_.device-row-label]:text-sidebar-foreground/90",
        "hover:bg-white/13",
        isHovered && "bg-white/13",
      )}
    >
      <div
        className={cn(
          "size-2 rounded-full shrink-0",
          dotColor,
          "ring-2 ring-offset-1 ring-offset-sidebar-accent",
          ringColor,
        )}
      />
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <span
            className={cn(
              "device-row-label text-xs font-medium truncate",
              isSelected
                ? "text-sidebar-foreground"
                : "text-sidebar-foreground/70",
            )}
          >
            {label}
          </span>
        </div>
        <div className="flex items-center gap-2 mt-0.5 h-4">
          {data ? (
            <>
              <FrequencyHoverCard frequency={frequency}>
                <span
                  className={cn(
                    "text-[10px] font-mono tabular-nums cursor-default leading-4",
                    hz > 0 ? "text-sidebar-foreground/35" : "text-red-400/60",
                  )}
                >
                  {hz.toFixed(0)}Hz
                </span>
              </FrequencyHoverCard>
              <BatteryIndicator level={data.sensorStatus.batteryLevel} />
            </>
          ) : (
            <>
              <Skeleton className="h-2.5 w-8 rounded-sm bg-sidebar-foreground/10" />
              <Skeleton className="h-2.5 w-10 rounded-sm bg-sidebar-foreground/10" />
            </>
          )}
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
          "flex h-6 w-6 shrink-0 items-center justify-center rounded-full transition-[width,height,padding]",
          "text-sidebar-foreground/20 hover:text-sidebar-foreground/60 hover:bg-white/10",
          isSelected && "text-sidebar-foreground/40",
        )}
      >
        <Settings className="h-3.5 w-3.5" />
      </div>
    </button>
  );
}

const BATTERY_ICONS = {
  Full: BatteryFull,
  OK: BatteryMedium,
  Low: BatteryLow,
  Critical: BatteryWarning,
};

function BatteryIndicator({
  level,
}: {
  level: "Full" | "OK" | "Low" | "Critical";
}) {
  const Icon = BATTERY_ICONS[level] ?? BATTERY_ICONS.OK;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-0.5 text-sidebar-foreground/35",
      )}
    >
      <Icon className="h-4 w-4" />
    </span>
  );
}
