"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { useDeviceStore } from "@/amfitrackSDK";
import type { DeviceFrequency, DeviceKind } from "@/amfitrackSDK";
import { getDistortionLevel } from "@/config/distortion";
import { FrequencyHoverCard } from "@/components/frequency-breakdown";
import { useViewerStore } from "@/stores/useViewerStore";
import { DeviceIcon } from "@/components/sidebar-left/transport-items";
import Image from "next/image";
import {
  BatteryFull,
  BatteryMedium,
  BatteryLow,
  BatteryWarning,
} from "lucide-react";

const BATTERY_ICONS = {
  Full: BatteryFull,
  OK: BatteryMedium,
  Low: BatteryLow,
  Critical: BatteryWarning,
} as const;

const DISTORTION_COLOR: Record<string, string> = {
  clean: "bg-emerald-500",
  moderate: "bg-amber-500",
  high: "bg-red-500",
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
  const [distortionValue, setDistortionValue] = useState<number>(0);
  const [batteryLevel, setBatteryLevel] = useState<
    "Full" | "OK" | "Low" | "Critical" | null
  >(null);

  useEffect(() => {
    if (!isSensor) return;
    const interval = setInterval(() => {
      const data = useDeviceStore.getState().emfImuFrameId[id];
      if (!data) return;
      const normalizedDistortion = data.metalDistortion / 255;
      setDistortionValue(normalizedDistortion);
      setDistortionLevel(getDistortionLevel(normalizedDistortion));
      setBatteryLevel(data.sensorStatus.batteryLevel);
    }, 200);
    return () => clearInterval(interval);
  }, [id, isSensor]);

  const hz = frequency?.totalHz ?? 0;
  const label = `${kind.charAt(0).toUpperCase() + kind.slice(1)}_${id}`;
  const BatIcon = batteryLevel ? BATTERY_ICONS[batteryLevel] : null;

  const distortionColor = DISTORTION_COLOR[distortionLevel];
  const distortionQuality = 1 - distortionValue;
  const distortionBars = Math.max(
    1,
    Math.min(3, Math.ceil(distortionQuality * 3)),
  );

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
        "w-full flex items-center gap-2 px-2 py-1 text-left rounded-sm transition-colors",
        isSelected
          ? "bg-sidebar-foreground/8 ring-1 ring-sidebar-foreground/10"
          : "ring-1 ring-transparent",
        "hover:bg-white/13",
        isHovered && !isSelected && "bg-white/13",
      )}
    >
      <DeviceIcon kind={kind} />

      <span
        className={cn(
          "text-[11px] font-medium truncate min-w-0 leading-none",
          isSelected ? "text-sidebar-foreground" : "text-sidebar-foreground/70",
        )}
      >
        {label}
      </span>

      <div className="flex-1" />

      {isSensor && (
        <span
          title={`Distortion: ${distortionValue.toFixed(2)}`}
          className="inline-flex h-3.5 w-3.5 shrink-0 items-start justify-center"
        >
          <span
            aria-label={`Distortion ${distortionValue.toFixed(2)}`}
            className="inline-flex h-3 w-3 items-end justify-center gap-[2px]"
          >
            <span
              className={cn(
                "w-[2px] rounded-sm transition-colors h-[4px]",
                distortionBars >= 1
                  ? distortionColor
                  : "bg-sidebar-foreground/20",
              )}
            />
            <span
              className={cn(
                "w-[2px] rounded-sm transition-colors h-[7px]",
                distortionBars >= 2
                  ? distortionColor
                  : "bg-sidebar-foreground/20",
              )}
            />
            <span
              className={cn(
                "w-[2px] rounded-sm transition-colors h-[10px]",
                distortionBars >= 3
                  ? distortionColor
                  : "bg-sidebar-foreground/20",
              )}
            />
          </span>
        </span>
      )}

      {isSensor && BatIcon && (
        <BatIcon className="size-3.5 shrink-0 text-sidebar-foreground/30" />
      )}

      <FrequencyHoverCard frequency={frequency}>
        <span
          className={cn(
            "text-[10px] font-mono tabular-nums cursor-default shrink-0",
            hz > 0 || isHub ? "text-sidebar-foreground/35" : "text-red-400/60",
          )}
        >
          {hz.toFixed(0)}Hz
        </span>
      </FrequencyHoverCard>
    </button>
  );
}
