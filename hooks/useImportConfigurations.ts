"use client";

import { useCallback, useState } from "react";
import { toast } from "sonner";
import { useAmfitrack } from "@/amfitrackSDK";
import type { DeviceExportData } from "@/lib/csv";

export interface ImportProgress {
  current: number;
  total: number;
}

export function useImportConfigurations() {
  const { sdk } = useAmfitrack();
  const [progress, setProgress] = useState<ImportProgress | null>(null);

  const isImporting = progress !== null;

  const applyConfigurations = useCallback(
    async (assignments: Map<number, DeviceExportData>) => {
      if (!sdk || assignments.size === 0) return;

      let totalParams = 0;
      for (const config of assignments.values()) {
        totalParams += config.parameters.length;
      }

      setProgress({ current: 0, total: totalParams });
      let done = 0;
      let failed = 0;
      const remaps = new Map<number, number>();
      const skippedDevices = new Set<number>();

      try {
        for (const [origTxId, config] of assignments) {
          for (const param of config.parameters) {
            const currentTxId = remaps.get(origTxId) ?? origTxId;
            if (skippedDevices.has(currentTxId)) {
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

              if (result.txIdChanged !== undefined) {
                remaps.set(origTxId, result.txIdChanged);
              } else if (result.configInvalidated) {
                skippedDevices.add(currentTxId);
              }
            } catch (err) {
              console.error(
                `Import: failed ${param.name} (uid ${param.uid}) on device ${currentTxId}:`,
                err,
              );
              failed++;
            }

            done++;
            setProgress({ current: done, total: totalParams });
          }
        }

        if (failed === 0) {
          toast.success("Configurations imported successfully");
        } else {
          toast.error(`Failed to import ${failed} parameter(s)`, {
            description:
              "Successfully imported parameters have been applied.",
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
