"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import * as THREE from "three";
import type { AmfitrackWeb } from "@/amfitrackWebSDK";
import { Sensor } from "@/amfitrackWebSDK";
import type { EmfImuFrameIdData } from "@/amfitrackWebSDK/packets/decoders";
import {
  extractDeviceId,
  type Configuration,
} from "@/amfitrackWebSDK/Configurator";

const POSITION_SCALE = 0.01;

export interface SensorIdRemap {
  oldId: number;
  newId: number;
}

export interface SensorContextValue {
  sensors: Sensor[];
  sensorIds: number[];
  sensorsDataRef: React.RefObject<Map<number, EmfImuFrameIdData>>;
  sensorConfigurations: Map<number, Configuration[]>;
  lastSensorIdRemap: SensorIdRemap | null;
  updateSensorParameterValue: (
    sensorId: number,
    uid: number,
    value: number | boolean | string,
  ) => void;
  remapSensorId: (oldId: number, newId: number) => void;
  refetchSensorConfiguration: (sensorId: number) => Promise<void>;
}

const SensorContext = createContext<SensorContextValue | null>(null);

export { SensorContext };

export function useSensor() {
  const ctx = useContext(SensorContext);
  if (!ctx) {
    throw new Error("useSensor must be used within a SensorProvider");
  }
  return ctx;
}

export function useSensorProvider(
  amfitrackWebRef: React.RefObject<AmfitrackWeb>,
  hubConnected: boolean,
): SensorContextValue {
  const [sensors, setSensors] = useState<Sensor[]>([]);
  const [sensorIds, setSensorIds] = useState<number[]>([]);
  const [sensorConfigurations, setSensorConfigurations] = useState<
    Map<number, Configuration[]>
  >(new Map());

  const [lastSensorIdRemap, setLastSensorIdRemap] =
    useState<SensorIdRemap | null>(null);

  const sensorsDataRef = useRef<Map<number, EmfImuFrameIdData>>(new Map());
  const configFetchedRef = useRef<Set<number>>(new Set());

  // Registration (add/remove) is driven by the SDK's unified device events.
  // The SDK now owns timeout-based liveness so there is no local cleanup.
  useEffect(() => {
    const sdk = amfitrackWebRef.current;

    // Track USB sensors for which we have already issued (or completed) a
    // direct USB config fetch, so `deviceUpdated` retries don't re-enter.
    const usbFetched = new WeakSet<Sensor>();

    const fetchUsbSensorConfig = async (sensor: Sensor) => {
      if (!sensor.hidDevice) return;
      if (usbFetched.has(sensor)) return;
      usbFetched.add(sensor);
      try {
        const config =
          (await sdk.getSensorConfigurationFromUsb(sensor)) ?? [];
        console.log("sensor configuration (usb)", config);
        const txId = extractDeviceId(config);
        if (txId !== null) {
          // Prevent the hub-routed config effect below from re-fetching the
          // same sensor once its txId is published into `sensorIds`.
          configFetchedRef.current.add(txId);
          sdk.setDeviceTxId(sensor, txId);
          setSensorConfigurations((prev) => {
            const next = new Map(prev);
            next.set(txId, config);
            return next;
          });
          setSensorIds((prev) =>
            prev.includes(txId) ? prev : [...prev, txId],
          );
        }
        setSensors((prev) => [...prev]);
      } catch (err) {
        usbFetched.delete(sensor);
        console.error("Failed to get USB sensor config", err);
      }
    };

    const unbindAdded = sdk.on("deviceAdded", (device) => {
      if (device.kind !== "sensor") return;
      const sensor = device as Sensor;
      setSensors((prev) =>
        prev.includes(sensor) ? prev : [...prev, sensor],
      );

      if (sensor.hidDevice) {
        fetchUsbSensorConfig(sensor);
        return;
      }

      const id = sensor.txId;
      if (id === null) return;
      setSensorIds((prev) => (prev.includes(id) ? prev : [...prev, id]));
    });

    const unbindUpdated = sdk.on("deviceUpdated", (device) => {
      if (device.kind !== "sensor") return;
      const sensor = device as Sensor;
      setSensors((prev) => (prev.includes(sensor) ? [...prev] : prev));

      // A USB sensor's txId may land after `deviceAdded` (for instance if
      // the initial USB config fetch failed and is being retried). Keep
      // `sensorIds` in sync when that happens.
      const id = sensor.txId;
      if (id !== null) {
        setSensorIds((prev) => (prev.includes(id) ? prev : [...prev, id]));
      }

      // Retry the USB config fetch if it hasn't succeeded yet.
      if (sensor.hidDevice) {
        fetchUsbSensorConfig(sensor);
      }
    });

    const unbindRemoved = sdk.on("deviceRemoved", (device) => {
      if (device.kind !== "sensor") return;
      const sensor = device as Sensor;
      setSensors((prev) => prev.filter((s) => s !== sensor));
      const id = sensor.txId;
      if (id === null) return;
      sensorsDataRef.current.delete(id);
      setSensorIds((prev) => prev.filter((x) => x !== id));
    });

    return () => {
      unbindAdded();
      unbindUpdated();
      unbindRemoved();
    };
  }, [amfitrackWebRef]);

  // Hot path: mirror raw EMF frames into THREE.js-enriched entries on the ref.
  // Kept out of state so it does not trigger re-renders at the packet rate.
  useEffect(() => {
    const sdk = amfitrackWebRef.current;

    const unbindEmf = sdk.on("emfImuFrameId", (header, data) => {
      const id = header.sourceTxId;
      let entry = sensorsDataRef.current.get(id);

      if (!entry) {
        entry = {
          ...data,
          metalDistortion: data.metalDistortion / 255,
          position: new THREE.Vector3(),
          quaternion: new THREE.Quaternion(),
        };
        sensorsDataRef.current.set(id, entry);
      } else {
        entry.sensorStatus = data.sensorStatus;
        entry.sourceCoilId = data.sourceCoilId;
        entry.calcId = data.calcId;
        entry.imu = data.imu;
        entry.magneto = data.magneto;
        entry.temperature = data.temperature;
        entry.sensorState = data.sensorState;
        entry.metalDistortion = data.metalDistortion / 255;
        entry.gpioState = data.gpioState;
        entry.rssi = data.rssi;
        entry.frameId = data.frameId;
      }

      (entry.position as THREE.Vector3).set(
        -data.position.y * POSITION_SCALE,
        data.position.z * POSITION_SCALE,
        -data.position.x * POSITION_SCALE,
      );
      (entry.quaternion as THREE.Quaternion)
        .set(
          -data.quaternion.y,
          data.quaternion.z,
          -data.quaternion.x,
          data.quaternion.w,
        )
        .normalize();
    });

    return () => {
      unbindEmf();
    };
  }, [amfitrackWebRef]);

  useEffect(() => {
    if (!hubConnected || sensorIds.length === 0) return;

    const newIds = sensorIds.filter((id) => !configFetchedRef.current.has(id));
    if (newIds.length === 0) return;

    let cancelled = false;

    const fetchConfigs = async () => {
      for (const id of newIds) {
        if (cancelled) break;
        configFetchedRef.current.add(id);
        try {
          const configs =
            await amfitrackWebRef.current.getSensorConfiguration(id);
          console.log("sensor configuration", id, configs);
          setSensorConfigurations((prev) => {
            const newMap = new Map(prev);
            newMap.set(id, configs ?? []);
            return newMap;
          });
        } catch (err) {
          configFetchedRef.current.delete(id);
          if (!cancelled) {
            console.error("Failed to get sensor config for", id, err);
          }
        }
      }
    };

    fetchConfigs();

    return () => {
      cancelled = true;
    };
  }, [hubConnected, sensorIds, amfitrackWebRef]);

  const updateSensorParameterValue = useCallback(
    (sensorId: number, uid: number, value: number | boolean | string) => {
      setSensorConfigurations((prev) => {
        const next = new Map(prev);
        const existing = next.get(sensorId);
        if (existing) {
          next.set(
            sensorId,
            existing.map((cat) => ({
              ...cat,
              parameters: cat.parameters.map((p) =>
                p.uid === uid ? { ...p, value } : p,
              ),
            })),
          );
        }
        return next;
      });
    },
    [],
  );

  const refetchSensorConfiguration = useCallback(
    async (sensorId: number) => {
      try {
        const configs =
          await amfitrackWebRef.current.getSensorConfiguration(sensorId);
        setSensorConfigurations((prev) => {
          const next = new Map(prev);
          next.set(sensorId, configs ?? []);
          return next;
        });
      } catch (err) {
        console.error("Failed to refetch sensor config for", sensorId, err);
      }
    },
    [amfitrackWebRef],
  );

  // Used when changing Device ID in sensor configuration
  const remapSensorId = useCallback((oldId: number, newId: number) => {
    const oldData = sensorsDataRef.current.get(oldId);
    if (oldData && !sensorsDataRef.current.has(newId)) {
      sensorsDataRef.current.set(newId, oldData);
    }
    sensorsDataRef.current.delete(oldId);

    if (configFetchedRef.current.has(oldId)) {
      configFetchedRef.current.delete(oldId);
      configFetchedRef.current.add(newId);
    }

    setSensorConfigurations((prev) => {
      const next = new Map(prev);
      const configs = next.get(oldId);
      if (configs) {
        next.delete(oldId);
        next.set(newId, configs);
      }
      return next;
    });

    setSensorIds((prev) => {
      const without = prev.filter((x) => x !== oldId);
      return without.includes(newId) ? without : [...without, newId];
    });
    setLastSensorIdRemap({ oldId, newId });
  }, []);

  return {
    sensors,
    sensorIds,
    sensorsDataRef,
    sensorConfigurations,
    lastSensorIdRemap,
    updateSensorParameterValue,
    remapSensorId,
    refetchSensorConfiguration,
  };
}
