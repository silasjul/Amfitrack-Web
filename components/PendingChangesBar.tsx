"use client";

import { useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { toast } from "sonner";
import { useConfigurations } from "@/hooks/useConfigurations";
import { useAmfitrack } from "@/hooks/useAmfitrack";
import { useHub } from "@/hooks/useHub";
import { useSource } from "@/hooks/useSource";
import { useSensor } from "@/hooks/useSensor";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, X } from "lucide-react";

export const PENDING_BAR_ATTR = "data-pending-changes-bar";

export default function PendingChangesBar() {
  const {
    configurations,
    removeConfiguration,
    removeConfigurationsForDevice,
    renameDevice,
    clearConfigurations,
  } = useConfigurations();
  const { amfitrackWebRef } = useAmfitrack();
  const {
    hubDevices,
    hubTxIds,
    updateHubParameterValue,
    refetchHubConfiguration,
  } = useHub();
  const {
    sourceDevices,
    sourceTxIds,
    updateSourceParameterValue,
    refetchSourceConfiguration,
  } = useSource();
  const {
    updateSensorParameterValue,
    remapSensorId,
    refetchSensorConfiguration,
  } = useSensor();
  const [saving, setSaving] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const findHubDevice = useCallback(
    (deviceName: string): HIDDevice | null => {
      const txIdStr = deviceName.replace("Hub ", "");
      const txId = parseInt(txIdStr, 10);
      if (isNaN(txId)) return hubDevices[0] ?? null;
      for (const [device, id] of hubTxIds) {
        if (id === txId) return device;
      }
      return null;
    },
    [hubDevices, hubTxIds],
  );

  const findSourceDevice = useCallback(
    (deviceName: string): HIDDevice | null => {
      const txIdStr = deviceName.replace("Source ", "");
      const txId = parseInt(txIdStr, 10);
      if (isNaN(txId)) return sourceDevices[0] ?? null;
      for (const [device, id] of sourceTxIds) {
        if (id === txId) return device;
      }
      return null;
    },
    [sourceDevices, sourceTxIds],
  );

  const handleSave = useCallback(
    async function handleSave() {
      setSaving(true);
      let failed = 0;
      const devicesToRefetch = new Set<string>();

      // Pre-resolve HID device references before the loop so that a Device ID
      // change mid-save doesn't break lookups for remaining pending changes.
      const resolvedDevices = new Map<string, HIDDevice | null>();
      for (const config of configurations) {
        const name = config.deviceName;
        if (resolvedDevices.has(name)) continue;
        if (name.startsWith("Hub")) {
          resolvedDevices.set(name, findHubDevice(name));
        } else if (name.startsWith("Source")) {
          resolvedDevices.set(name, findSourceDevice(name));
        }
      }

      for (const config of configurations) {
        if (devicesToRefetch.has(config.deviceName)) continue;

        try {
          const name = config.deviceName;
          const isConfigModeChange =
            config.parameterName.startsWith("Config mode");
          const isDeviceIdChange = config.parameterName === "Device ID";
          let confirmedValue: number | boolean | string;
          let effectiveDeviceName = name;

          const sdk = amfitrackWebRef.current;

          if (name.startsWith("Hub")) {
            const device = resolvedDevices.get(name);
            if (!device) throw new Error("Hub device not found");
            const txId = hubTxIds.get(device) ?? undefined;
            confirmedValue = await sdk.setHubParameterValue(
              device,
              config.uid,
              config.valueToPush,
              txId,
              isDeviceIdChange,
            );
            updateHubParameterValue(device, config.uid, confirmedValue);
            if (isDeviceIdChange) {
              const newName = `Hub ${confirmedValue}`;
              renameDevice(name, newName);
              effectiveDeviceName = newName;
            }
          } else if (name.startsWith("Source")) {
            const device = resolvedDevices.get(name);
            if (!device) throw new Error("Source device not found");
            const txId = sourceTxIds.get(device) ?? undefined;
            confirmedValue = await sdk.setSourceParameterValue(
              device,
              config.uid,
              config.valueToPush,
              txId,
              isDeviceIdChange,
            );
            updateSourceParameterValue(device, config.uid, confirmedValue);
            if (isDeviceIdChange) {
              const newName = `Source ${confirmedValue}`;
              renameDevice(name, newName);
              effectiveDeviceName = newName;
            }
          } else if (name.startsWith("Sensor ")) {
            const sensorID = parseInt(name.replace("Sensor ", ""), 10);
            confirmedValue = await sdk.setSensorParameterValue(
              sensorID,
              config.uid,
              config.valueToPush,
              isDeviceIdChange,
            );
            updateSensorParameterValue(sensorID, config.uid, confirmedValue);
            if (isDeviceIdChange) {
              remapSensorId(sensorID, confirmedValue as number);
            }
          } else {
            continue;
          }

          if (isConfigModeChange) {
            devicesToRefetch.add(name);
            removeConfigurationsForDevice(name);
            continue;
          }

          removeConfiguration(effectiveDeviceName, config.uid);
        } catch (error) {
          console.error(
            `Failed to save ${config.parameterName} on ${config.deviceName}:`,
            error,
          );
          failed++;
        }
      }

      for (const deviceName of devicesToRefetch) {
        if (deviceName.startsWith("Sensor ")) {
          const sensorID = parseInt(deviceName.replace("Sensor ", ""), 10);
          await refetchSensorConfiguration(sensorID);
        } else if (deviceName.startsWith("Hub")) {
          const device =
            resolvedDevices.get(deviceName) ?? findHubDevice(deviceName);
          if (device) await refetchHubConfiguration(device);
        } else if (deviceName.startsWith("Source")) {
          const device =
            resolvedDevices.get(deviceName) ?? findSourceDevice(deviceName);
          if (device) await refetchSourceConfiguration(device);
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
    },
    [
      configurations,
      amfitrackWebRef,
      findHubDevice,
      findSourceDevice,
      hubTxIds,
      sourceTxIds,
      updateHubParameterValue,
      updateSourceParameterValue,
      updateSensorParameterValue,
      remapSensorId,
      renameDevice,
      removeConfiguration,
      removeConfigurationsForDevice,
      refetchSensorConfiguration,
      refetchHubConfiguration,
      refetchSourceConfiguration,
    ],
  );

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Enter" && !saving && configurations.length > 0) {
        e.preventDefault();
        handleSave();
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [handleSave, saving]);

  const count = configurations.length;
  if (count === 0 || !mounted) return null;

  return createPortal(
    <div
      {...{ [PENDING_BAR_ATTR]: "" }}
      className="fixed bottom-6 left-1/2 -translate-x-1/2 z-100 pointer-events-auto animate-in slide-in-from-bottom-4 fade-in duration-300"
    >
      <div className="flex items-center gap-3 rounded-xl border border-border bg-background/80 backdrop-blur-lg shadow-lg px-4 py-2.5">
        <Badge variant="secondary">{count}</Badge>
        <span className="text-sm text-muted-foreground">
          unsaved {count === 1 ? "change" : "changes"}
        </span>

        <div className="flex items-center gap-1.5 ml-1">
          <Button
            variant="outline"
            size="sm"
            onClick={clearConfigurations}
            disabled={saving}
          >
            <X data-icon="inline-start" />
            Discard
          </Button>
          <Button size="sm" onClick={handleSave} disabled={saving}>
            {saving && (
              <Loader2 data-icon="inline-start" className="animate-spin" />
            )}
            {saving ? "Saving…" : "Save"}
          </Button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
