"use client";

import { useCallback, useRef, useState } from "react";
import { toast } from "sonner";
import { useAmfitrack } from "@/amfitrackSDK";
import { useDeviceStore } from "@/amfitrackSDK/src/store/useDeviceStore";
import type { DeviceExportData } from "@/lib/csv";

export interface ImportProgress {
  current: number;
  total: number;
}

export function useImportConfigurations() {
  const { sdk } = useAmfitrack();
  const [progress, setProgress] = useState<ImportProgress | null>(null);
  const abortRef = useRef(false);

  const isImporting = progress !== null;

  const applyConfigurations = useCallback(
    async (assignments: Map<number, DeviceExportData>) => {
      if (!sdk || assignments.size === 0) return;

      abortRef.current = false;

      let totalParams = 0;
      for (const [, config] of assignments) {
        totalParams += config.parameters.length;
      }

      setProgress({ current: 0, total: totalParams });
      let done = 0;
      const failedDevices: number[] = [];
      const skippedDevices = new Set<number>();
      const txIdRemaps = new Map<number, number>();

      try {
        for (const [origTxId, config] of assignments) {
          if (abortRef.current) break;

          for (const param of config.parameters) {
            const currentTxId = txIdRemaps.get(origTxId) ?? origTxId;

            if (skippedDevices.has(origTxId)) {
              done++;
              setProgress({ current: done, total: totalParams });
              continue;
            }

            const meta = useDeviceStore.getState().deviceMeta[currentTxId];
            if (!meta) {
              skippedDevices.add(origTxId);
              failedDevices.push(origTxId);
              done++;
              setProgress({ current: done, total: totalParams });
              continue;
            }

            try {
              const result = await sdk.setParam(
                currentTxId,
                param.uid,
                param.value,
              );

              const activeTxId = result.txIdChanged ?? currentTxId;
              useDeviceStore.getState().pingDevice(activeTxId);

              if (result.txIdChanged !== undefined) {
                txIdRemaps.set(origTxId, result.txIdChanged);
              }
            } catch (err) {
              console.error(
                `Import: failed ${param.name} (uid ${param.uid}) on device ${currentTxId}:`,
                err,
              );
              toast.error(`Import failed: ${param.name}`, {
                description: `UID ${param.uid} on device ${currentTxId}. ${err instanceof Error ? err.message : "Unknown error"}`,
              });
              skippedDevices.add(origTxId);
              failedDevices.push(origTxId);
              done++;
              setProgress({ current: done, total: totalParams });
              continue;
            }

            done++;
            setProgress({ current: done, total: totalParams });
          }
        }

        if (failedDevices.length === 0) {
          toast.success("Configurations applied successfully");
        } else {
          toast.error(`Import failed for ${failedDevices.length} device(s)`, {
            description: `Device(s) ${failedDevices.join(", ")} failed or disconnected.`,
          });
        }
      } catch (err) {
        toast.error("Import failed", {
          description: err instanceof Error ? err.message : "Unknown error",
        });
      } finally {
        setProgress(null);
      }
    },
    [sdk],
  );

  return { isImporting, progress, applyConfigurations };
}
