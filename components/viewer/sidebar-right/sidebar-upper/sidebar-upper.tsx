"use client";

import { useDeviceStore } from "@/amfitrackSDK";
import type {
  DeviceMeta,
  EmfImuFrameIdData,
  Configuration,
} from "@/amfitrackSDK";
import { useViewerStore } from "@/stores/useViewerStore";
import { usePendingConfigStore } from "@/stores/usePendingConfigStore";
import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
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
import { UnknownRow } from "./unknown-row";
import useTxIds from "@/hooks/useTxIds";

type DeviceFilter = "all" | "hubs" | "sources" | "sensors" | "unknown";

function deviceDisplayName(kind: string, txId: number): string {
  const prefix = kind.charAt(0).toUpperCase() + kind.slice(1);
  return `${prefix} ${txId}`;
}

export default function SidebarUpper() {
  const selectedSensorId = useViewerStore((s) => s.selectedSensorId);
  const setSelectedSensorId = useViewerStore((s) => s.setSelectedSensorId);
  const hoveredSensorId = useViewerStore((s) => s.hoveredSensorId);

  const deviceMeta = useDeviceStore((s) => s.deviceMeta);
  const frequency = useDeviceStore((s) => s.frequency);

  const lastDeviceIdRemap = usePendingConfigStore((s) => s.lastDeviceIdRemap);

  const [filter, setFilter] = useState<DeviceFilter>("all");
  const [snapshots, setSnapshots] = useState<Record<number, EmfImuFrameIdData>>(
    {},
  );

  const [configDialogTxId, setConfigDialogTxId] = useState<number | null>(null);

  const { sensorTxIds, sourceTxIds, hubTxIds, unknownTxIds } = useTxIds();

  const totalDeviceCount =
    hubTxIds.length + sourceTxIds.length + sensorTxIds.length + unknownTxIds.length;

  useEffect(() => {
    if (sensorTxIds.length === 0) return;
    const interval = setInterval(() => {
      const data = useDeviceStore.getState().emfImuFrameId;
      if (Object.keys(data).length === 0) return;
      const next: Record<number, EmfImuFrameIdData> = {};
      for (const id of sensorTxIds) {
        const d = data[id];
        if (d) next[id] = d;
      }
      setSnapshots(next);
    }, 100);
    return () => clearInterval(interval);
  }, [sensorTxIds]);

  useEffect(() => {
    if (lastDeviceIdRemap && configDialogTxId === lastDeviceIdRemap.oldTxId) {
      setConfigDialogTxId(lastDeviceIdRemap.newTxId);
    }
  }, [lastDeviceIdRemap, configDialogTxId]);

  useEffect(() => {
    if (selectedSensorId === null && sensorTxIds.length > 0) {
      setSelectedSensorId(sensorTxIds[0]);
    } else if (
      selectedSensorId !== null &&
      !sensorTxIds.includes(selectedSensorId)
    ) {
      setSelectedSensorId(sensorTxIds[0] ?? null);
    }
  }, [sensorTxIds, selectedSensorId, setSelectedSensorId]);

  const showHubs = filter === "all" || filter === "hubs";
  const showSources = filter === "all" || filter === "sources";
  const showSensors = filter === "all" || filter === "sensors";
  const showUnknown = filter === "all" || filter === "unknown";

  const dialogOpen = configDialogTxId !== null;
  const dialogMeta: DeviceMeta | undefined =
    configDialogTxId !== null ? deviceMeta[configDialogTxId] : undefined;
  const dialogDeviceName =
    configDialogTxId !== null && dialogMeta
      ? deviceDisplayName(dialogMeta.kind, configDialogTxId)
      : "";
  const dialogConfiguration: Configuration[] = dialogMeta?.configuration ?? [];
  const dialogLoading = configDialogTxId !== null && !dialogMeta?.configuration;

  const closeDialog = () => setConfigDialogTxId(null);

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
                <SelectItem
                  className="font-roboto-mono text-[10px] font-medium uppercase tracking-widest"
                  value="all"
                >
                  All
                </SelectItem>
                <SelectItem
                  className="font-roboto-mono text-[10px] font-medium uppercase tracking-widest"
                  value="hubs"
                >
                  Hubs
                </SelectItem>
                <SelectItem
                  className="font-roboto-mono text-[10px] font-medium uppercase tracking-widest"
                  value="sources"
                >
                  Sources
                </SelectItem>
                <SelectItem
                  className="font-roboto-mono text-[10px] font-medium uppercase tracking-widest"
                  value="sensors"
                >
                  Sensors
                </SelectItem>
                <SelectItem
                  className="font-roboto-mono text-[10px] font-medium uppercase tracking-widest"
                  value="unknown"
                >
                  Unknown
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <ScrollArea className="min-h-0 flex-1 p-1.5">
          <div className="space-y-1">
            {totalDeviceCount === 0 && <SkeletonRows />}
            {showSensors &&
              sensorTxIds.map((id) => (
                <SensorRow
                  key={id}
                  id={id}
                  label={`SENSOR_${id}`}
                  data={snapshots[id]}
                  frequency={frequency[id]}
                  isSelected={selectedSensorId === id}
                  isHovered={hoveredSensorId === id}
                  onSelect={() => setSelectedSensorId(id)}
                  onOpenSettings={() => setConfigDialogTxId(id)}
                />
              ))}

            {showSources &&
              sourceTxIds.map((id) => (
                <SourceRow
                  key={`source-${id}`}
                  id={id}
                  frequency={frequency[id]}
                  configuration={deviceMeta[id]?.configuration ?? []}
                  isSelected={false}
                  onSelect={() => {}}
                  onOpenSettings={() => setConfigDialogTxId(id)}
                />
              ))}

            {showHubs &&
              hubTxIds.map((id) => (
                <HubRow
                  key={`hub-${id}`}
                  id={id}
                  frequency={frequency[id]}
                  configuration={deviceMeta[id]?.configuration ?? []}
                  isSelected={false}
                  onSelect={() => {}}
                  onOpenSettings={() => setConfigDialogTxId(id)}
                />
              ))}

            {showUnknown &&
              unknownTxIds.map((id) => (
                <UnknownRow
                  key={`unknown-${id}`}
                  id={id}
                  frequency={frequency[id]}
                  isSelected={false}
                  onSelect={() => {}}
                  onOpenSettings={() => setConfigDialogTxId(id)}
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
        txId={configDialogTxId ?? 0}
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
