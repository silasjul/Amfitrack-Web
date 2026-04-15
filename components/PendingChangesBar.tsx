"use client";

import { useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { toast } from "sonner";
import { useConfigurations } from "@/hooks/useConfigurations";
import { useAmfitrack } from "@/hooks/useAmfitrack";
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
    clearConfigurations,
  } = useConfigurations();
  const { amfitrackWebRef, updateParameterValue, refetchConfiguration } =
    useAmfitrack();
  const { updateSensorParameterValue, remapSensorId, refetchSensorConfiguration } =
    useSensor();
  const [saving, setSaving] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const handleSave = useCallback(
    async function handleSave() {
      setSaving(true);
      let failed = 0;
      const devicesToRefetch = new Set<string>();

      for (const config of configurations) {
        if (devicesToRefetch.has(config.deviceName)) continue;

        try {
          const name = config.deviceName;
          const isConfigModeChange =
            config.parameterName.startsWith("Config mode");
          let confirmedValue: number | boolean | string;

          const sdk = amfitrackWebRef.current;
          if (name === "Hub") {
            confirmedValue = await sdk.setHubParameterValue(
              config.uid,
              config.valueToPush,
            );
            updateParameterValue(name, config.uid, confirmedValue);
          } else if (name === "Source") {
            confirmedValue = await sdk.setSourceParameterValue(
              config.uid,
              config.valueToPush,
            );
            updateParameterValue(name, config.uid, confirmedValue);
          } else if (name.startsWith("Sensor ")) {
            const sensorID = parseInt(name.replace("Sensor ", ""), 10);
            const isDeviceIdChange = config.parameterName === "Device ID";
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

          removeConfiguration(config.deviceName, config.uid);
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
        } else {
          await refetchConfiguration(deviceName);
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
    [configurations, amfitrackWebRef, updateParameterValue, updateSensorParameterValue, remapSensorId, removeConfiguration, removeConfigurationsForDevice, refetchSensorConfiguration, refetchConfiguration],
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
