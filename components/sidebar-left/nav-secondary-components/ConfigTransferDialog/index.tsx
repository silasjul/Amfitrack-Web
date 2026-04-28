"use client";

import { useState, useMemo, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Upload, Download, Loader2 } from "lucide-react";
import { toast } from "sonner";
import useTxIds from "@/hooks/useTxIds";
import { useDeviceStore } from "@/amfitrackSDK/src/store/useDeviceStore";
import DeviceTable from "./DeviceTable";
import { useAmfitrack } from "@/amfitrackSDK";
import {
  configurationsToCSV,
  downloadCSV,
  type DeviceExportData,
} from "./utils";

export default function ConfigTransferDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { sensorTxIds, sourceTxIds, hubTxIds, unknownTxIds } = useTxIds();
  const deviceMeta = useDeviceStore((s) => s.deviceMeta);
  const { sdk } = useAmfitrack();

  const allIds = useMemo(
    () => [...sensorTxIds, ...sourceTxIds, ...hubTxIds, ...unknownTxIds],
    [sensorTxIds, sourceTxIds, hubTxIds, unknownTxIds],
  );

  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [exportProgress, setExportProgress] = useState<{
    current: number;
    total: number;
  } | null>(null);

  const isExporting = exportProgress !== null;

  function toggleAll(checked: boolean) {
    setSelectedIds(checked ? new Set(allIds) : new Set());
  }

  function toggleRow(id: number, checked: boolean) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      checked ? next.add(id) : next.delete(id);
      return next;
    });
  }

  const handleDownload = useCallback(
    async (txIds: number[]) => {
      if (!sdk || txIds.length === 0) return;

      const kindOrder: Record<string, number> = {
        sensor: 0,
        hub: 1,
        source: 2,
        unknown: 3,
      };
      const sorted = [...txIds].sort(
        (a, b) =>
          (kindOrder[deviceMeta[a]?.kind ?? "unknown"] ?? 3) -
          (kindOrder[deviceMeta[b]?.kind ?? "unknown"] ?? 3),
      );

      setExportProgress({ current: 0, total: sorted.length });

      try {
        const devices: DeviceExportData[] = [];

        for (let i = 0; i < sorted.length; i++) {
          const txId = sorted[i];
          const meta = deviceMeta[txId];

          const configs = await sdk.getAllDeviceConfigurations(txId);

          devices.push({
            uuid: meta?.uuid ?? "unknown",
            firmware: meta?.versions?.firmware ?? "unknown",
            rfFirmware: meta?.versions?.RF ?? "unknown",
            hardware: meta?.versions?.hardware ?? "unknown",
            name: meta?.kind ?? "unknown",
            parameters: configs.flatMap((c) => c.parameters),
          });

          setExportProgress({ current: i + 1, total: sorted.length });
        }

        const csv = configurationsToCSV(devices);
        const timestamp = new Date()
          .toISOString()
          .slice(0, 10)
          .replace(/[T:]/g, "-");
        downloadCSV(csv, `amfitrack-${timestamp}.config.csv`);
        toast.success("Configurations exported successfully");
      } catch (err) {
        toast.error("Export failed", {
          description: err instanceof Error ? err.message : "Unknown error",
        });
      } finally {
        setExportProgress(null);
      }
    },
    [sdk, deviceMeta],
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-5xl flex flex-col">
        <DialogHeader>
          <DialogTitle>Config Transfer</DialogTitle>
          <DialogDescription>
            Export or import configurations between devices.
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-center justify-between">
          <span className="text-sm">
            {selectedIds.size > 0
              ? `${selectedIds.size} of ${allIds.length} device${allIds.length !== 1 ? "s" : ""} selected`
              : `${allIds.length} device${allIds.length !== 1 ? "s" : ""} connected`}
          </span>
          <Button className="leading-0" variant="outline" size="sm">
            <Upload className="mr-1 h-4 w-4" />
            Import CSV
          </Button>
        </div>

        <DeviceTable
          allIds={allIds}
          deviceMeta={deviceMeta}
          selectedIds={selectedIds}
          onToggleAll={toggleAll}
          onToggleRow={toggleRow}
        />

        <div className="flex justify-end pt-2">
          <Button
            className="leading-0"
            disabled={selectedIds.size === 0 || isExporting}
            onClick={() => handleDownload(Array.from(selectedIds))}
          >
            {isExporting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Exporting {exportProgress.current}/{exportProgress.total}...
              </>
            ) : (
              <>
                <Download className="h-4 w-4" />
                Export Configurations
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
