"use client";

import { useAmfitrack } from "@/hooks/useAmfitrack";
import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { type EmfImuFrameIdData } from "@/amfitrackWebSDK/packets/decoders";
import { getDistortionLevel } from "@/config/distortion";

interface Props {
  selectedSensorId: number | null;
  onSelectSensor: (id: number | null) => void;
}

export default function SidebarUpper({
  selectedSensorId,
  onSelectSensor,
}: Props) {
  const { sensorIds, sensorsDataRef } = useAmfitrack();
  const [snapshots, setSnapshots] = useState<Map<number, EmfImuFrameIdData>>(
    new Map(),
  );

  useEffect(() => {
    if (sensorIds.length === 0) return;
    const interval = setInterval(() => {
      const map = sensorsDataRef.current;
      if (map.size === 0) return;
      const next = new Map<number, EmfImuFrameIdData>();
      for (const [id, d] of map) {
        next.set(id, {
          ...d,
          position: { x: d.position.x, y: d.position.y, z: d.position.z },
          quaternion: {
            x: d.quaternion.x,
            y: d.quaternion.y,
            z: d.quaternion.z,
            w: d.quaternion.w,
          },
        });
      }
      setSnapshots(next);
    }, 100);
    return () => clearInterval(interval);
  }, [sensorIds, sensorsDataRef]);

  useEffect(() => {
    if (selectedSensorId === null && sensorIds.length > 0) {
      onSelectSensor(sensorIds[0]);
    } else if (
      selectedSensorId !== null &&
      !sensorIds.includes(selectedSensorId)
    ) {
      onSelectSensor(sensorIds[0] ?? null);
    }
  }, [sensorIds, selectedSensorId, onSelectSensor]);

  return (
    <div className="flex h-full w-full flex-col pl-1 pr-1 pb-0.5">
      <div className="flex-1 flex flex-col bg-sidebar rounded-b-sm overflow-hidden">
        <div className="flex items-center gap-1 px-3 py-2 border-b border-sidebar-border/30">
          <span className="text-[10px] font-semibold uppercase tracking-widest text-sidebar-foreground/40">
            Sensors
          </span>
          <Badge
            variant="secondary"
            className="h-4 px-1.5 text-[10px] font-mono"
          >
            {sensorIds.length}
          </Badge>
        </div>

        <div className="flex-1 overflow-y-auto p-1.5 space-y-1">
          {sensorIds.length === 0 && <SkeletonRows />}
          {sensorIds.map((id) => (
            <SensorRow
              key={id}
              label={`SENSOR_${id}`}
              data={snapshots.get(id)}
              isSelected={selectedSensorId === id}
              onSelect={() => onSelectSensor(id)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function SensorRow({
  label,
  data,
  isSelected,
  onSelect,
}: {
  label: string;
  data?: EmfImuFrameIdData;
  isSelected: boolean;
  onSelect: () => void;
}) {
  const distortion = data?.metalDistortion ?? 0;
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

  const statusColor = {
    clean: "text-emerald-600/60 dark:text-emerald-400/60",
    moderate: "text-amber-600/60 dark:text-amber-400/60",
    high: "text-red-600/60 dark:text-red-400/60",
  }[level];

  const statusText = {
    clean: "Clean",
    moderate: "Moderate",
    high: "Distorted",
  }[level];

  return (
    <button
      onClick={onSelect}
      className={cn(
        "group w-full flex items-center gap-2.5 px-3 py-2 text-left rounded-lg transition-all duration-150",
        "hover:bg-white/13",
        isSelected
          ? "bg-sidebar-foreground/8 ring-1 ring-sidebar-foreground/10"
          : "ring-1 ring-transparent",
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
              "text-xs font-medium truncate transition-colors",
              isSelected
                ? "text-sidebar-foreground"
                : "text-sidebar-foreground/70 group-hover:text-sidebar-foreground/90",
            )}
          >
            {label}
          </span>
        </div>
        {data && (
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className="text-[10px] font-mono tabular-nums text-sidebar-foreground/35">
              {data.temperature.toFixed(1)}°C
            </span>
            <span className="text-[10px] text-sidebar-foreground/15">·</span>
            <span className={cn("text-[10px] font-medium", statusColor)}>
              {statusText}
            </span>
          </div>
        )}
      </div>
    </button>
  );
}

function SkeletonRows() {
  return (
    <div className="space-y-1 p-2">
      {[1, 2, 3].map((i) => (
        <div key={i} className="flex items-center gap-2.5 px-1 py-2">
          <Skeleton className="size-2 rounded-full" />
          <div className="flex-1 space-y-1.5">
            <div className="flex justify-between">
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-3 w-10" />
            </div>
            <div className="flex gap-2">
              <Skeleton className="h-2.5 w-8" />
              <Skeleton className="h-2.5 w-12" />
            </div>
          </div>
        </div>
      ))}
      <p className="text-center text-[10px] text-sidebar-foreground/30 pt-2">
        Waiting for sensors…
      </p>
    </div>
  );
}
