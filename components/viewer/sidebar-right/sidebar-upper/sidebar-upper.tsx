"use client";

import { useDeviceStore } from "@/amfitrackSDK";
import type { DeviceMeta, Configuration } from "@/amfitrackSDK";
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
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { HelpCircle } from "lucide-react";
import DeviceSettingsDialog from "@/components/sidebar-left/footer-components/DeviceSettingsDialog";
import { DeviceRow } from "./device-row";
import useTxIds from "@/hooks/useTxIds";

type DeviceFilter = "all" | "hubs" | "sources" | "sensors" | "unknown";

function deviceDisplayName(kind: string, txId: number): string {
  const prefix = kind.charAt(0).toUpperCase() + kind.slice(1);
  return `${prefix} ${txId}`;
}

export default function SidebarUpper() {
  const selectedDeviceId = useViewerStore((s) => s.selectedDeviceId);
  const setSelectedDeviceId = useViewerStore((s) => s.setSelectedDeviceId);
  const hoveredSensorId = useViewerStore((s) => s.hoveredSensorId);

  const deviceMeta = useDeviceStore((s) => s.deviceMeta);
  const frequency = useDeviceStore((s) => s.frequency);

  const lastDeviceIdRemap = usePendingConfigStore((s) => s.lastDeviceIdRemap);

  const [filter, setFilter] = useState<DeviceFilter>("all");
  const [configDialogTxId, setConfigDialogTxId] = useState<number | null>(null);

  const { sensorTxIds, sourceTxIds, hubTxIds, unknownTxIds } = useTxIds();

  const totalDeviceCount =
    hubTxIds.length +
    sourceTxIds.length +
    sensorTxIds.length +
    unknownTxIds.length;

  useEffect(() => {
    if (lastDeviceIdRemap && configDialogTxId === lastDeviceIdRemap.oldTxId) {
      setConfigDialogTxId(lastDeviceIdRemap.newTxId);
    }
  }, [lastDeviceIdRemap, configDialogTxId]);

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
    <div className="flex h-full w-full flex-col pb-0.5">
      <div className="flex-1 flex min-h-0 flex-col bg-sidebar rounded-b-sm overflow-hidden">
        <div className="flex h-8 items-center gap-1.5 px-2 border-b border-sidebar-border/30">
          <Tooltip>
            <TooltipTrigger asChild>
              <div>
                <span className="text-xs font-medium text-sidebar-foreground/70 px-0.5">
                  Devices
                </span>
                <Badge
                  variant="secondary"
                  className="h-4 px-1.5 text-[10px] font-mono text-sidebar-foreground/80"
                >
                  {totalDeviceCount}
                </Badge>
              </div>
            </TooltipTrigger>
            <TooltipContent side="bottom" sideOffset={4}>
              Double-click a device to open its settings
            </TooltipContent>
          </Tooltip>
          <div className="ml-auto flex items-center gap-1">
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

        <ScrollArea className="min-h-0 flex-1">
          <div className="space-y-0.5 px-2 py-1.5">
            {totalDeviceCount === 0 && <SkeletonRows />}

            {showSensors &&
              sensorTxIds.map((id) => (
                <DeviceRow
                  key={id}
                  id={id}
                  kind="sensor"
                  frequency={frequency[id]}
                  isSelected={selectedDeviceId === id}
                  isHovered={hoveredSensorId === id}
                  onSelect={() => setSelectedDeviceId(id)}
                  onOpenSettings={() => setConfigDialogTxId(id)}
                />
              ))}

            {showSources &&
              sourceTxIds.map((id) => (
                <DeviceRow
                  key={`source-${id}`}
                  id={id}
                  kind="source"
                  frequency={frequency[id]}
                  isSelected={selectedDeviceId === id}
                  isHovered={false}
                  onSelect={() => setSelectedDeviceId(id)}
                  onOpenSettings={() => setConfigDialogTxId(id)}
                />
              ))}

            {showHubs &&
              hubTxIds.map((id) => (
                <DeviceRow
                  key={`hub-${id}`}
                  id={id}
                  kind="hub"
                  frequency={frequency[id]}
                  isSelected={selectedDeviceId === id}
                  isHovered={false}
                  onSelect={() => setSelectedDeviceId(id)}
                  onOpenSettings={() => setConfigDialogTxId(id)}
                />
              ))}

            {showUnknown &&
              unknownTxIds.map((id) => (
                <DeviceRow
                  key={`unknown-${id}`}
                  id={id}
                  kind="unknown"
                  frequency={frequency[id]}
                  isSelected={selectedDeviceId === id}
                  isHovered={false}
                  onSelect={() => setSelectedDeviceId(id)}
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
    <div className="space-y-0.5">
      {[1, 2, 3].map((i) => (
        <div key={i} className="flex items-center gap-2 px-2 py-1">
          <Skeleton className="size-1.5 rounded-full" />
          <Skeleton className="h-3 w-16 flex-1" />
          <Skeleton className="h-3 w-8" />
        </div>
      ))}
      <p className="text-center text-[10px] text-sidebar-foreground/30 pt-2">
        Waiting for devices…
      </p>
    </div>
  );
}
