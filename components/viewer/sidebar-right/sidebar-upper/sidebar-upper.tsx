"use client";

import { useSensor } from "@/hooks/useSensor";
import { useFrequency } from "@/hooks/useFrequency";
import { useViewer } from "@/hooks/useViewer";
import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { type EmfImuFrameIdData } from "@/amfitrackWebSDK/packets/decoders";
import { type DeviceFrequency } from "@/amfitrackWebSDK/AmfitrackWeb";
import { type Configuration } from "@/amfitrackWebSDK/Configurator";
import { getDistortionLevel } from "@/config/distortion";
import { ScrollArea } from "@/components/ui/scroll-area";
import { FrequencyHoverCard } from "@/components/frequency-breakdown";
import {
  Settings,
  BatteryFull,
  BatteryMedium,
  BatteryLow,
  BatteryWarning,
} from "lucide-react";
import DeviceSettingsDialog from "@/components/sidebar-left/footer/DeviceSettingsDialog";

export default function SidebarUpper() {
  const { selectedSensorId, setSelectedSensorId, hoveredSensorId } =
    useViewer();
  const { sensorIds, sensorsDataRef, sensorConfigurations, lastSensorIdRemap } =
    useSensor();
  const { sensors: sensorFrequencies } = useFrequency();
  const [snapshots, setSnapshots] = useState<Map<number, EmfImuFrameIdData>>(
    new Map(),
  );
  const [configDialogSensorId, setConfigDialogSensorId] = useState<
    number | null
  >(null);

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
    if (lastSensorIdRemap && configDialogSensorId === lastSensorIdRemap.oldId) {
      setConfigDialogSensorId(lastSensorIdRemap.newId);
    }
  }, [lastSensorIdRemap, configDialogSensorId]);

  useEffect(() => {
    if (selectedSensorId === null && sensorIds.length > 0) {
      setSelectedSensorId(sensorIds[0]);
    } else if (
      selectedSensorId !== null &&
      !sensorIds.includes(selectedSensorId)
    ) {
      setSelectedSensorId(sensorIds[0] ?? null);
    }
  }, [sensorIds, selectedSensorId, setSelectedSensorId]);

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

        <ScrollArea className="flex-1 p-1.5">
          <div className="space-y-1">
            {sensorIds.length === 0 && <SkeletonRows />}
            {sensorIds.map((id) => (
              <SensorRow
                key={id}
                id={id}
                label={`SENSOR_${id}`}
                data={snapshots.get(id)}
                frequency={sensorFrequencies.get(id)}
                configuration={sensorConfigurations.get(id)}
                isSelected={selectedSensorId === id}
                isHovered={hoveredSensorId === id}
                onSelect={() => setSelectedSensorId(id)}
                onOpenSettings={() => setConfigDialogSensorId(id)}
              />
            ))}
          </div>
        </ScrollArea>
      </div>

      <DeviceSettingsDialog
        open={configDialogSensorId !== null}
        onOpenChange={(open) => {
          if (!open) setConfigDialogSensorId(null);
        }}
        deviceName={
          configDialogSensorId !== null ? `Sensor ${configDialogSensorId}` : ""
        }
        configuration={
          configDialogSensorId !== null
            ? (sensorConfigurations.get(configDialogSensorId) ?? [])
            : []
        }
        loading={
          configDialogSensorId !== null &&
          !sensorConfigurations.has(configDialogSensorId)
        }
      />
    </div>
  );
}

function SensorRow({
  id,
  label,
  data,
  frequency,
  configuration,
  isSelected,
  isHovered,
  onSelect,
  onOpenSettings,
}: {
  id: number;
  label: string;
  data?: EmfImuFrameIdData;
  frequency?: DeviceFrequency;
  configuration?: Configuration[];
  isSelected: boolean;
  isHovered: boolean;
  onSelect: () => void;
  onOpenSettings: () => void;
}) {
  const { setHoveredSensorId } = useViewer();
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

  const hz = frequency?.totalHz ?? 0;

  return (
    <button
      onPointerOver={() => setHoveredSensorId(id)}
      onPointerOut={() => setHoveredSensorId(null)}
      onClick={onSelect}
      className={cn(
        "group w-full flex items-center gap-2.5 px-3 py-2 text-left rounded-lg transition-all duration-150",
        isSelected
          ? "bg-sidebar-foreground/8 ring-1 ring-sidebar-foreground/10"
          : "ring-1 ring-transparent",
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
