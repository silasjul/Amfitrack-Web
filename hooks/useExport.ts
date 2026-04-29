"use client";

import { useState, useCallback } from "react";
import { toast } from "sonner";
import type { AmfitrackSDK } from "@/amfitrackSDK";
import type { DeviceMeta } from "@/amfitrackSDK/src/interfaces/IStore";
import { configurationsToCSV, downloadCSV, type DeviceExportData } from "../lib/csv";

const KIND_ORDER: Record<string, number> = {
  sensor: 0,
  hub: 1,
  source: 2,
  unknown: 3,
};

export function useExport(
  sdk: AmfitrackSDK | null,
  deviceMeta: Record<number, DeviceMeta>,
) {
  const [exportProgress, setExportProgress] = useState<{
    current: number;
    total: number;
  } | null>(null);

  const isExporting = exportProgress !== null;

  const handleDownload = useCallback(
    async (txIds: number[]) => {
      if (!sdk || txIds.length === 0) return;

      const sorted = [...txIds].sort(
        (a, b) =>
          (KIND_ORDER[deviceMeta[a]?.kind ?? "unknown"] ?? 3) -
          (KIND_ORDER[deviceMeta[b]?.kind ?? "unknown"] ?? 3),
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

  return { exportProgress, isExporting, handleDownload };
}
