"use client";

import { useCallback, useState } from "react";
import { toast } from "sonner";
import type { Hub, Source } from "@/amfitrackWebSDK";
import { useAmfitrack } from "./useAmfitrack";
import {
  useConfigurations,
  type PendingConfiguration,
} from "./useConfigurations";
import { useHub } from "./useHub";
import { useSource } from "./useSource";
import { useSensor } from "./useSensor";

/**
 * A resolved device target for a pending change. Keeping the device reference
 * (or sensor id) in a single shared object lets us mutate it mid-save when the
 * Device ID changes, so later configurations for the same device keep pointing
 * at the right entry.
 */
type Target =
  | { kind: "hub"; device: Hub }
  | { kind: "source"; device: Source }
  | { kind: "sensor"; sensorId: number };

function targetName(target: Target): string {
  if (target.kind === "hub") return `Hub ${target.device.txId ?? "?"}`;
  if (target.kind === "source") return `Source ${target.device.txId ?? "?"}`;
  return `Sensor ${target.sensorId}`;
}

function parseIdSuffix(name: string, prefix: string): number | null {
  const id = parseInt(name.slice(prefix.length), 10);
  return Number.isNaN(id) ? null : id;
}

export function useSaveConfigurations() {
  const {
    configurations,
    removeConfiguration,
    removeConfigurationsForDevice,
    renameDevice,
  } = useConfigurations();
  const { amfitrackWebRef } = useAmfitrack();
  const { hubs, updateHubParameterValue, refetchHubConfiguration } = useHub();
  const { sources, updateSourceParameterValue, refetchSourceConfiguration } =
    useSource();
  const {
    updateSensorParameterValue,
    remapSensorId,
    refetchSensorConfiguration,
  } = useSensor();

  const [saving, setSaving] = useState(false);

  const resolveTarget = useCallback(
    (deviceName: string): Target | null => {
      if (deviceName.startsWith("Hub ")) {
        const id = parseIdSuffix(deviceName, "Hub ");
        const device =
          id === null
            ? (hubs[0] ?? null)
            : (hubs.find((h) => h.txId === id) ?? null);
        return device ? { kind: "hub", device } : null;
      }
      if (deviceName.startsWith("Source ")) {
        const id = parseIdSuffix(deviceName, "Source ");
        const device =
          id === null
            ? (sources[0] ?? null)
            : (sources.find((s) => s.txId === id) ?? null);
        return device ? { kind: "source", device } : null;
      }
      if (deviceName.startsWith("Sensor ")) {
        const id = parseIdSuffix(deviceName, "Sensor ");
        return id === null ? null : { kind: "sensor", sensorId: id };
      }
      return null;
    },
    [hubs, sources],
  );

  /**
   * Write a single parameter to the target device, mirror the confirmed value
   * into the hook-owned configuration state, and return the confirmed value so
   * the caller can handle special cases (e.g. Device ID changes).
   */
  const pushParameter = useCallback(
    async (
      target: Target,
      config: PendingConfiguration,
      expectDeviceIdChange: boolean,
    ): Promise<number | boolean | string> => {
      const sdk = amfitrackWebRef.current;

      if (target.kind === "hub") {
        const hub = target.device;
        if (!hub.hidDevice) throw new Error("Hub is not connected over USB");
        const confirmed = await sdk.setHubParameterValue(
          hub.hidDevice,
          config.uid,
          config.valueToPush,
          hub.txId ?? undefined,
          expectDeviceIdChange,
        );
        updateHubParameterValue(hub, config.uid, confirmed);
        return confirmed;
      }

      if (target.kind === "source") {
        const source = target.device;
        if (!source.hidDevice && source.txId === null) {
          throw new Error("Source has no USB connection and no known txId");
        }
        const confirmed = await sdk.setSourceParameterValue(
          source,
          config.uid,
          config.valueToPush,
          expectDeviceIdChange,
        );
        updateSourceParameterValue(source, config.uid, confirmed);
        return confirmed;
      }

      const confirmed = await sdk.setSensorParameterValue(
        target.sensorId,
        config.uid,
        config.valueToPush,
        expectDeviceIdChange,
      );
      updateSensorParameterValue(target.sensorId, config.uid, confirmed);
      return confirmed;
    },
    [
      amfitrackWebRef,
      updateHubParameterValue,
      updateSourceParameterValue,
      updateSensorParameterValue,
    ],
  );

  /**
   * Propagate a successful Device ID write through the SDK registry and the
   * UI-facing hook state so every label, lookup, and pending-change entry
   * agrees on the new id. Mutates the shared target so subsequent configs
   * that share it keep working.
   */
  const applyDeviceIdChange = useCallback(
    (target: Target, newId: number, oldName: string) => {
      const sdk = amfitrackWebRef.current;
      if (target.kind === "hub" || target.kind === "source") {
        sdk.setDeviceTxId(target.device, newId);
      } else {
        remapSensorId(target.sensorId, newId);
        sdk.renameSensor(target.sensorId, newId);
        target.sensorId = newId;
      }
      renameDevice(oldName, targetName(target));
    },
    [amfitrackWebRef, remapSensorId, renameDevice],
  );

  const refetchTarget = useCallback(
    async (target: Target) => {
      if (target.kind === "hub") {
        await refetchHubConfiguration(target.device);
      } else if (target.kind === "source") {
        await refetchSourceConfiguration(target.device);
      } else {
        await refetchSensorConfiguration(target.sensorId);
      }
    },
    [
      refetchHubConfiguration,
      refetchSourceConfiguration,
      refetchSensorConfiguration,
    ],
  );

  const save = useCallback(async () => {
    if (configurations.length === 0) return;
    setSaving(true);

    // One shared target per device, so a Device ID change mid-save is seen by
    // every remaining config for that device without re-resolving against the
    // now-renamed pending list.
    const targetsByName = new Map<string, Target | null>();
    for (const config of configurations) {
      if (targetsByName.has(config.deviceName)) continue;
      targetsByName.set(config.deviceName, resolveTarget(config.deviceName));
    }

    const refetchTargets = new Map<Target, Target>();
    let failed = 0;

    for (const config of configurations) {
      const target = targetsByName.get(config.deviceName) ?? null;

      try {
        if (!target) throw new Error(`Device ${config.deviceName} not found`);
        if (refetchTargets.has(target)) continue;

        const isDeviceIdChange = config.parameterName === "Device ID";
        const isConfigModeChange =
          config.parameterName.startsWith("Config mode");

        const nameBeforePush = targetName(target);
        const confirmed = await pushParameter(
          target,
          config,
          isDeviceIdChange,
        );

        if (isDeviceIdChange && typeof confirmed === "number") {
          applyDeviceIdChange(target, confirmed, nameBeforePush);
        }

        if (isConfigModeChange) {
          removeConfigurationsForDevice(targetName(target));
          refetchTargets.set(target, target);
        } else {
          removeConfiguration(targetName(target), config.uid);
        }
      } catch (err) {
        console.error(
          `Failed to save ${config.parameterName} on ${config.deviceName}:`,
          err,
        );
        failed++;
      }
    }

    for (const target of refetchTargets.values()) {
      try {
        await refetchTarget(target);
      } catch (err) {
        console.error("Failed to refetch configuration:", err);
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
  }, [
    configurations,
    resolveTarget,
    pushParameter,
    applyDeviceIdChange,
    refetchTarget,
    removeConfiguration,
    removeConfigurationsForDevice,
  ]);

  return { save, saving };
}
