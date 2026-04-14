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

export interface SensorContextValue {
  sensorIds: number[];
  sensorsDataRef: React.RefObject<Map<number, EmfImuFrameIdData>>;
  sensorConfigurations: Map<number, Configuration[]>;
  updateSensorParameterValue: (
    sensorId: number,
    uid: number,
    value: number | boolean | string,
  ) => void;
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
          if (cancelled) break;
          console.log("sensor configuration", id, configs);
          setSensorConfigurations((prev) => {
            const newMap = new Map(prev);
            newMap.set(id, configs ?? []);
            return newMap;
          });
        } catch (err) {
          configFetchedRef.current.delete(id);
          if (cancelled) break;
          console.error("Failed to get sensor config for", id, err);
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

  return {
    sensorIds,
    sensorsDataRef,
    sensorConfigurations,
    updateSensorParameterValue,
  };
}
