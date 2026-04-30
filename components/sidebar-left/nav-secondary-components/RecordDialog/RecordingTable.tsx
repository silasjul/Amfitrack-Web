"use client";

import Image from "next/image";
import { CircleHelp } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { TableCell, TableHead, TableRow } from "@/components/ui/table";
import { ScrollArea as ScrollAreaPrimitive } from "radix-ui";
import { ScrollBar } from "@/components/ui/scroll-area";
import { useDeviceStore } from "@/amfitrackSDK/src/store/useDeviceStore";
import useTxIds from "@/hooks/useTxIds";
import { cn, KindIconMap } from "@/lib/utils";
import type { DeviceKind } from "@/amfitrackSDK/src/interfaces/IStore";

type SectionDef = { key: string; label: string; kinds: DeviceKind[] };

const SENSOR_ONLY: SectionDef[] = [
  { key: "position", label: "Position", kinds: ["sensor"] },
  { key: "orientation", label: "Orientation", kinds: ["sensor"] },
  { key: "environment", label: "Environment", kinds: ["sensor"] },
  { key: "device_status", label: "Dev. Status", kinds: ["sensor"] },
];

const SHARED: SectionDef[] = [
  { key: "accelerometer", label: "Accel.", kinds: ["sensor", "source"] },
  { key: "gyroscope", label: "Gyro.", kinds: ["sensor", "source"] },
  { key: "magnetometer", label: "Magneto.", kinds: ["sensor", "source"] },
];

const SOURCE_ONLY: SectionDef[] = [
  { key: "current", label: "Current", kinds: ["source"] },
  { key: "voltage", label: "Voltage", kinds: ["source"] },
  { key: "status", label: "Status", kinds: ["source"] },
  { key: "calibration", label: "Calibration", kinds: ["source"] },
];

interface RecordingTableProps {
  selection: Record<number, string[]>;
  onToggle: (txId: number, section: string) => void;
  onSetSections: (txId: number, sections: string[]) => void;
}

export default function RecordingTable({
  selection,
  onToggle,
  onSetSections,
}: RecordingTableProps) {
  const { sensorTxIds, sourceTxIds } = useTxIds();
  const deviceMeta = useDeviceStore((s) => s.deviceMeta);
  const allTxIds = [...sensorTxIds, ...sourceTxIds];

  const hasSensors = sensorTxIds.length > 0;
  const hasSources = sourceTxIds.length > 0;

  // Only show columns relevant to the connected device types
  const visibleColumns: SectionDef[] = [
    ...(hasSensors ? SENSOR_ONLY : []),
    ...SHARED,
    ...(hasSources ? SOURCE_ONLY : []),
  ];

  // Border after a group only when another group follows it
  const groupBorderIndices = new Set<number>();
  if (hasSensors) {
    groupBorderIndices.add(SENSOR_ONLY.length - 1);
  }
  if (hasSources) {
    groupBorderIndices.add(
      (hasSensors ? SENSOR_ONLY.length : 0) + SHARED.length - 1,
    );
  }

  if (allTxIds.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center rounded-lg border border-dashed">
        <p className="text-sm text-muted-foreground">No devices avalible for recording.</p>
      </div>
    );
  }

  const getColumnState = (col: SectionDef): boolean | "indeterminate" => {
    const applicable = allTxIds.filter((txId) =>
      col.kinds.includes(deviceMeta[txId]?.kind as DeviceKind),
    );
    if (applicable.length === 0) return false;
    const checked = applicable.filter((txId) =>
      (selection[txId] ?? []).includes(col.key),
    ).length;
    if (checked === 0) return false;
    return checked === applicable.length ? true : "indeterminate";
  };

  const handleColumnSelectAll = (col: SectionDef) => {
    const applicable = allTxIds.filter((txId) =>
      col.kinds.includes(deviceMeta[txId]?.kind as DeviceKind),
    );
    const allChecked = applicable.every((txId) =>
      (selection[txId] ?? []).includes(col.key),
    );
    applicable.forEach((txId) => {
      const curr = selection[txId] ?? [];
      if (allChecked) {
        onSetSections(
          txId,
          curr.filter((s) => s !== col.key),
        );
      } else if (!curr.includes(col.key)) {
        onSetSections(txId, [...curr, col.key]);
      }
    });
  };

  return (
    <ScrollAreaPrimitive.Root
      type="always"
      className="flex-1 relative overflow-hidden rounded-lg border"
    >
      <ScrollAreaPrimitive.Viewport className="size-full rounded-[inherit]">
        <table className="w-full caption-bottom text-sm">
          <thead className="sticky top-0 z-10 bg-background [&_tr]:border-b">
            {/* Group label row */}
            <TableRow className="hover:bg-transparent">
              <TableHead className="border-r" />
              {hasSensors && (
                <TableHead
                  colSpan={SENSOR_ONLY.length}
                  className="border-r bg-muted/40 text-center text-[10px] font-semibold uppercase tracking-wider text-muted-foreground"
                >
                  Sensor
                </TableHead>
              )}
              <TableHead
                colSpan={SHARED.length}
                className={cn(
                  "text-center text-[10px] font-semibold uppercase tracking-wider text-muted-foreground",
                  hasSources && "border-r",
                )}
              >
                Shared
              </TableHead>
              {hasSources && (
                <TableHead
                  colSpan={SOURCE_ONLY.length}
                  className="bg-muted/40 text-center text-[10px] font-semibold uppercase tracking-wider text-muted-foreground"
                >
                  Source
                </TableHead>
              )}
            </TableRow>

            {/* Column name + select-all checkbox row */}
            <TableRow className="hover:bg-transparent">
              <TableHead className="w-[220px] border-r pl-4">Device</TableHead>
              {visibleColumns.map((col, i) => (
                <TableHead
                  key={col.key}
                  className={cn(
                    "min-w-[84px] px-2",
                    groupBorderIndices.has(i) && "border-r",
                  )}
                >
                  <div className="flex flex-col items-center gap-2 pt-2 pb-4">
                    <span className="whitespace-nowrap text-xs font-medium">
                      {col.label}
                    </span>
                    <Checkbox
                      checked={getColumnState(col)}
                      onCheckedChange={() => handleColumnSelectAll(col)}
                    />
                  </div>
                </TableHead>
              ))}
            </TableRow>
          </thead>

          <tbody className="[&_tr:last-child]:border-0">
            {allTxIds.map((txId) => {
              const meta = deviceMeta[txId];
              const kind = meta?.kind;
              const iconSrc = kind ? KindIconMap[kind] : undefined;
              const label = `${kind ? kind.charAt(0).toUpperCase() + kind.slice(1) : "Device"} #${txId}`;

              const applicableSections =
                kind === "sensor"
                  ? [...SENSOR_ONLY, ...SHARED]
                  : kind === "source"
                    ? [...SHARED, ...SOURCE_ONLY]
                    : [];

              const currSelected = selection[txId] ?? [];
              const allSelected =
                applicableSections.length > 0 &&
                applicableSections.every((s) => currSelected.includes(s.key));

              return (
                <TableRow key={txId}>
                  <TableCell className="border-r pl-4 pr-3">
                    <div className="flex items-center gap-2.5">
                      <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-muted/75">
                        {iconSrc ? (
                          <Image
                            src={iconSrc}
                            alt={kind ?? "device"}
                            width={24}
                            height={24}
                            className="object-contain brightness-150"
                          />
                        ) : (
                          <CircleHelp className="size-4 text-muted-foreground" />
                        )}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">{label}</p>
                        <p className="text-xs text-muted-foreground">
                          {currSelected.length > 0
                            ? `${currSelected.length} selected`
                            : "None selected"}
                        </p>
                      </div>
                      <Switch
                        checked={allSelected}
                        onCheckedChange={() =>
                          onSetSections(
                            txId,
                            allSelected
                              ? []
                              : applicableSections.map((s) => s.key),
                          )
                        }
                      />
                    </div>
                  </TableCell>

                  {visibleColumns.map((col, i) => {
                    const applicable = col.kinds.includes(kind as DeviceKind);
                    return (
                      <TableCell
                        key={col.key}
                        className={cn(
                          "px-2",
                          groupBorderIndices.has(i) && "border-r",
                          !applicable && "bg-muted/30",
                        )}
                      >
                        <div className="flex items-center justify-center">
                          {applicable ? (
                            <Checkbox
                              checked={currSelected.includes(col.key)}
                              onCheckedChange={() => onToggle(txId, col.key)}
                            />
                          ) : (
                            <span className="select-none text-sm text-muted-foreground/25">
                              —
                            </span>
                          )}
                        </div>
                      </TableCell>
                    );
                  })}
                </TableRow>
              );
            })}
          </tbody>
        </table>
      </ScrollAreaPrimitive.Viewport>
      <ScrollBar orientation="vertical" />
      <ScrollBar orientation="horizontal" />
      <ScrollAreaPrimitive.Corner />
    </ScrollAreaPrimitive.Root>
  );
}
