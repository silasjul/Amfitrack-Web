"use client";

import { useSensor } from "@/hooks/useSensor";
import { useHub } from "@/hooks/useHub";
import { useSource } from "@/hooks/useSource";
import { useFrequency } from "@/hooks/useFrequency";
import { useViewer } from "@/hooks/useViewer";
import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { type EmfImuFrameIdData } from "@/amfitrackWebSDK/packets/decoders";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import DeviceSettingsDialog from "@/components/sidebar-left/footer/DeviceSettingsDialog";
import { SensorRow } from "./sensor-row";
import { HubRow } from "./hub-row";
import { SourceRow } from "./source-row";

type DeviceFilter = "all" | "hubs" | "sources" | "sensors";

export default function SidebarUpper() {
  const { selectedSensorId, setSelectedSensorId, hoveredSensorId } =
    useViewer();
  const { sensorIds, sensorsDataRef, sensorConfigurations, lastSensorIdRemap } =
    useSensor();
  const { hubDevices, hubConfigurations, hubTxIds } = useHub();
  const { sourceDevices, sourceConfigurations, sourceTxIds } = useSource();
  const {
    sensors: sensorFrequencies,
    hubs: hubFrequencies,
    sources: sourceFrequencies,
  } = useFrequency();

  const [filter, setFilter] = useState<DeviceFilter>("all");
  const [snapshots, setSnapshots] = useState<Map<number, EmfImuFrameIdData>>(
    new Map(),
  );

  // Settings dialog state — can target sensors, hubs, or sources
  const [configDialogSensorId, setConfigDialogSensorId] = useState<
    number | null
  >(null);
  const [configDialogHub, setConfigDialogHub] = useState<HIDDevice | null>(
    null,
  );
  const [configDialogSource, setConfigDialogSource] =
    useState<HIDDevice | null>(null);

  const totalDeviceCount =
    hubDevices.length + sourceDevices.length + sensorIds.length;

  // Snapshot sensor data periodically for display
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

  const showHubs = filter === "all" || filter === "hubs";
  const showSources = filter === "all" || filter === "sources";
  const showSensors = filter === "all" || filter === "sensors";

  // Determine which dialog is open
  const dialogOpen =
    configDialogSensorId !== null ||
    configDialogHub !== null ||
    configDialogSource !== null;

  const { dialogDeviceName, dialogConfiguration } = (() => {
    if (configDialogSensorId !== null)
      return {
        dialogDeviceName: `Sensor ${configDialogSensorId}`,
        dialogConfiguration:
          sensorConfigurations.get(configDialogSensorId) ?? [],
      };
    if (configDialogHub !== null)
      return {
        dialogDeviceName: `Hub ${hubTxIds.get(configDialogHub) ?? "?"}`,
        dialogConfiguration: hubConfigurations.get(configDialogHub) ?? [],
      };
    if (configDialogSource !== null)
      return {
        dialogDeviceName: `Source ${sourceTxIds.get(configDialogSource) ?? "?"}`,
        dialogConfiguration: sourceConfigurations.get(configDialogSource) ?? [],
      };
    return { dialogDeviceName: "", dialogConfiguration: [] };
  })();

  const dialogLoading =
    configDialogSensorId !== null &&
    !sensorConfigurations.has(configDialogSensorId);

  const closeDialog = () => {
    setConfigDialogSensorId(null);
    setConfigDialogHub(null);
    setConfigDialogSource(null);
  };

  return (
    <div className="flex h-full w-full flex-col pl-1 pr-1 pb-0.5">
      <div className="flex-1 flex min-h-0 flex-col bg-sidebar rounded-b-sm overflow-hidden">
        <div className="flex items-center gap-1 px-3 py-2 border-b border-sidebar-border/30">
          <span className="text-[10px] font-semibold uppercase tracking-widest text-sidebar-foreground/40">
            Devices
          </span>
          <Badge
            variant="secondary"
            className="h-4 px-1.5 text-[10px] font-mono text-sidebar-foreground/80"
          >
            {totalDeviceCount}
          </Badge>
          <div className="ml-auto">
            <Select
              value={filter}
              onValueChange={(v) => setFilter(v as DeviceFilter)}
            >
              <SelectTrigger
                size="sm"
                className="h-5 text-[10px] gap-1 border-none bg-transparent px-1.5"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="min-w-12" position="popper" align="end">
                <SelectItem className="font-roboto-mono text-[10px] font-medium uppercase tracking-widest" value="all">All</SelectItem>
                <SelectItem className="font-roboto-mono text-[10px] font-medium uppercase tracking-widest" value="hubs">Hubs</SelectItem>
                <SelectItem className="font-roboto-mono text-[10px] font-medium uppercase tracking-widest" value="sources">Sources</SelectItem>
                <SelectItem className="font-roboto-mono text-[10px] font-medium uppercase tracking-widest" value="sensors">Sensors</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <ScrollArea className="min-h-0 flex-1 p-1.5">
          <div className="space-y-1">
            {totalDeviceCount === 0 && <SkeletonRows />}

            {showHubs &&
              hubDevices.map((device, idx) => {
                const id = hubTxIds.get(device) ?? null;
                return (
                  <HubRow
                    key={`hub-${id ?? idx}`}
                    id={id}
                    frequency={id != null ? hubFrequencies.get(id) : undefined}
                    configuration={hubConfigurations.get(device) ?? []}
                    isSelected={false}
                    onSelect={() => {}}
                    onOpenSettings={() => setConfigDialogHub(device)}
                  />
                );
              })}

            {showSources &&
              sourceDevices.map((device, idx) => {
                const id = sourceTxIds.get(device) ?? null;
                return (
                  <SourceRow
                    key={`source-${id ?? idx}`}
                    id={id}
                    frequency={
                      id != null ? sourceFrequencies.get(id) : undefined
                    }
                    configuration={sourceConfigurations.get(device) ?? []}
                    isSelected={false}
                    onSelect={() => {}}
                    onOpenSettings={() => setConfigDialogSource(device)}
                  />
                );
              })}

            {showSensors &&
              sensorIds.map((id) => (
                <SensorRow
                  key={id}
                  id={id}
                  label={`SENSOR_${id}`}
                  data={snapshots.get(id)}
                  frequency={sensorFrequencies.get(id)}
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
        open={dialogOpen}
        onOpenChange={(open) => {
          if (!open) closeDialog();
        }}
        deviceName={dialogDeviceName}
        configuration={dialogConfiguration}
        loading={dialogLoading}
      />
    </div>
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
        Waiting for devices…
      </p>
    </div>
  );
}
