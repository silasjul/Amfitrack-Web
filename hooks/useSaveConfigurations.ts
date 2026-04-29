"use client";

import { useCallback, useState } from "react";
import { toast } from "sonner";
import { useAmfitrack } from "@/amfitrackSDK";
import { usePendingConfigStore } from "@/stores/usePendingConfigStore";

export function useSaveConfigurations() {
  const { sdk } = useAmfitrack();
  const [saving, setSaving] = useState(false);

  const save = useCallback(async () => {
    const { pending, removePending, removePendingForDevice, remapDeviceTxId } =
      usePendingConfigStore.getState();

    if (!sdk || pending.length === 0) return;
    setSaving(true);

    const snapshot = [...pending];
    const remaps = new Map<number, number>();
    const skippedDevices = new Set<number>();
    let failed = 0;

    for (const config of snapshot) {
      const currentTxId = remaps.get(config.txId) ?? config.txId;
      if (skippedDevices.has(currentTxId)) continue;

      try {
        const result = await sdk.setParam(
          currentTxId,
          config.paramUid,
          config.valueToPush,
        );

        if (result.txIdChanged !== undefined) {
          removePending(currentTxId, config.paramUid);
          remapDeviceTxId(currentTxId, result.txIdChanged);
          remaps.set(config.txId, result.txIdChanged);
        } else if (result.configInvalidated) {
          removePendingForDevice(currentTxId);
          skippedDevices.add(currentTxId);
        } else {
          removePending(currentTxId, config.paramUid);
        }
      } catch (err) {
        console.error(
          `Failed to save ${config.parameterName} on device ${currentTxId}:`,
          err,
        );
        failed++;
      }
    }

    if (failed === 0) {
      toast.success("Settings saved successfully");
    } else {
      toast.error(`Failed to save ${failed} setting(s)`, {
        description: "Successfully saved settings have been applied.",
      });
    }

    setSaving(false);
  }, [sdk]);

  return { save, saving };
}
