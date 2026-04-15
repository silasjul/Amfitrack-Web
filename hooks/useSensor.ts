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
import type { EmfImuFrameIdData } from "@/amfitrackWebSDK/packets/decoders";
import type { Configuration } from "@/amfitrackWebSDK/Configurator";

const POSITION_SCALE = 0.01;
const SENSOR_TIMEOUT_MS = 3000;
const SENSOR_CLEANUP_INTERVAL_MS = 1000;

export interface SensorIdRemap {
  oldId: number;
  newId: number;
}

export interface SensorContextValue {
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
  const [sensorIds, setSensorIds] = useState<number[]>([]);
  const [sensorConfigurations, setSensorConfigurations] = useState<
    Map<number, Configuration[]>
  >(new Map());

  const [lastSensorIdRemap, setLastSensorIdRemap] =
    useState<SensorIdRemap | null>(null);

  const sensorsDataRef = useRef<Map<number, EmfImuFrameIdData>>(new Map());
  const sensorLastSeenRef = useRef<Map<number, number>>(new Map());
  const configFetchedRef = useRef<Set<number>>(new Set());

  useEffect(() => {
    const sdk = amfitrackWebRef.current;

    const unbindEmf = sdk.on("emfImuFrameId", (header, data) => {
      const id = header.sourceTxId;
      sensorLastSeenRef.current.set(id, Date.now());
      let entry = sensorsDataRef.current.get(id);

      if (!entry) {
        entry = {
          ...data,
          metalDistortion: data.metalDistortion / 255,
          position: new THREE.Vector3(),
          quaternion: new THREE.Quaternion(),
        };
        sensorsDataRef.current.set(id, entry);
        setSensorIds(Array.from(sensorsDataRef.current.keys()));
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

  // Cleanup expired sensors
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      let changed = false;
      for (const [id, lastSeen] of sensorLastSeenRef.current) {
        if (now - lastSeen > SENSOR_TIMEOUT_MS) {
          sensorLastSeenRef.current.delete(id);
          sensorsDataRef.current.delete(id);
          changed = true;
        }
      }
      if (changed) {
        setSensorIds(Array.from(sensorsDataRef.current.keys()));
      }
    }, SENSOR_CLEANUP_INTERVAL_MS);

    return () => clearInterval(interval);
  }, []);

  // Fetch config for new sensors
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

    sensorLastSeenRef.current.set(newId, Date.now());
    sensorLastSeenRef.current.delete(oldId);

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

    setSensorIds(Array.from(sensorsDataRef.current.keys()));
    setLastSensorIdRemap({ oldId, newId });
  }, []);

  return {
    sensorIds,
    sensorsDataRef,
    sensorConfigurations,
    lastSensorIdRemap,
    updateSensorParameterValue,
    remapSensorId,
    refetchSensorConfiguration,
  };
}
