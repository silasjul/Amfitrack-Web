"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { useDeviceStore } from "@/amfitrackSDK";
import type { DeviceFrequency, DeviceKind } from "@/amfitrackSDK";
import { getDistortionLevel } from "@/config/distortion";
import { FrequencyHoverCard } from "@/components/frequency-breakdown";
import { useViewerStore } from "@/stores/useViewerStore";
import {
  Scan,
  Zap,
  Router,
  CircleHelp,
  BatteryFull,
  BatteryMedium,
  BatteryLow,
  BatteryWarning,
  type LucideIcon,
} from "lucide-react";

const KIND_ICON: Record<DeviceKind, LucideIcon> = {
  sensor: Scan,
  source: Zap,
  hub: Router,
  unknown: CircleHelp,
};

const BATTERY_ICONS = {
  Full: BatteryFull,
  OK: BatteryMedium,
  Low: BatteryLow,
  Critical: BatteryWarning,
} as const;

const DISTORTION_COLOR: Record<string, string> = {
  clean: "text-emerald-500",
  moderate: "text-amber-500",
  high: "text-red-500",
};

export function DeviceRow({
  id,
  kind,
  frequency,
  isSelected,
  isHovered,
  onSelect,
  onOpenSettings,
}: {
  id: number;
  kind: DeviceKind;
  frequency?: DeviceFrequency;
  isSelected: boolean;
  isHovered: boolean;
  onSelect: () => void;
  onOpenSettings: () => void;
}) {
  const setHoveredSensorId = useViewerStore((s) => s.setHoveredSensorId);
  const isSensor = kind === "sensor";
  const isHub = kind === "hub";

  const [distortionLevel, setDistortionLevel] = useState<string>("clean");
  const [batteryLevel, setBatteryLevel] = useState<
    "Full" | "OK" | "Low" | "Critical" | null
  >(null);

  useEffect(() => {
    if (!isSensor) return;
    const interval = setInterval(() => {
      const data = useDeviceStore.getState().emfImuFrameId[id];
      if (!data) return;
      setDistortionLevel(getDistortionLevel(data.metalDistortion / 255));
      setBatteryLevel(data.sensorStatus.batteryLevel);
    }, 200);
    return () => clearInterval(interval);
  }, [id, isSensor]);

  const KindIcon = KIND_ICON[kind];
  const hz = frequency?.totalHz ?? 0;
  const label = `${kind.charAt(0).toUpperCase() + kind.slice(1)}_${id}`;
  const BatIcon = batteryLevel ? BATTERY_ICONS[batteryLevel] : null;

  const iconColor = isSensor
    ? (DISTORTION_COLOR[distortionLevel] ?? "text-sidebar-foreground/40")
    : isSelected
      ? "text-sidebar-foreground/70"
      : "text-sidebar-foreground/35";

  return (
    <button
      onClick={onSelect}
      onDoubleClick={(e) => {
        e.stopPropagation();
        onOpenSettings();
      }}
      onPointerOver={isSensor ? () => setHoveredSensorId(id) : undefined}
      onPointerOut={isSensor ? () => setHoveredSensorId(null) : undefined}
      className={cn(
        "w-full flex items-center gap-2 px-2 py-1 text-left rounded-md transition-colors",
        isSelected
          ? "bg-sidebar-foreground/8 ring-1 ring-sidebar-foreground/10"
          : "ring-1 ring-transparent",
        "hover:bg-white/13",
        isHovered && !isSelected && "bg-white/13",
      )}
    >
      <KindIcon
        className={cn("size-3 shrink-0 transition-colors", iconColor)}
      />

      <span
        className={cn(
          "text-[11px] font-medium truncate min-w-0 flex-1",
          isSelected
            ? "text-sidebar-foreground"
            : "text-sidebar-foreground/70",
        )}
      >
        {label}
      </span>

      {isSensor && BatIcon && (
        <BatIcon className="size-3.5 shrink-0 text-sidebar-foreground/30" />
      )}

      <FrequencyHoverCard frequency={frequency}>
        <span
          className={cn(
            "text-[10px] font-mono tabular-nums cursor-default shrink-0",
            hz > 0 || isHub
              ? "text-sidebar-foreground/35"
              : "text-red-400/60",
          )}
        >
          {hz.toFixed(0)}Hz
        </span>
      </FrequencyHoverCard>
    </button>
  );
}
