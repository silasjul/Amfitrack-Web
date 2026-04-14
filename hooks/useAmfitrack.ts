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
import { toast } from "sonner";
import { AmfitrackWeb } from "@/amfitrackWebSDK";
import {
  type DeviceFrequency,
  DeviceError,
} from "@/amfitrackWebSDK/AmfitrackWeb";
import { EmfImuFrameIdData } from "@/amfitrackWebSDK/packets/decoders";
import { Configuration, extractDeviceId } from "@/amfitrackWebSDK/Configurator";

const POSITION_SCALE = 0.01;
const SENSOR_TIMEOUT_MS = 3000;
const SENSOR_CLEANUP_INTERVAL_MS = 1000;

interface AmfitrackContextValue {
  isReading: boolean;
  hubConnected: boolean;
  sourceConnected: boolean;
  hubTxId: number | null;
  sourceTxId: number | null;
  sensorIds: number[];
  sensorsDataRef: React.RefObject<Map<number, EmfImuFrameIdData>>;
  messageFrequencyRef: React.RefObject<Map<number, DeviceFrequency>>;
  amfitrackWebRef: React.RefObject<AmfitrackWeb>;
  hubConfiguration: Configuration[];
  sourceConfiguration: Configuration[];
  sensorConfigurations: Map<number, Configuration[]>;
  requestConnectionHub: () => Promise<void>;
  requestConnectionSource: () => Promise<void>;
  updateParameterValue: (
    deviceName: string,
    uid: number,
    value: number | boolean | string,
  ) => void;
}

const AmfitrackContext = createContext<AmfitrackContextValue | null>(null);

export { AmfitrackContext };

export function useAmfitrack() {
  const ctx = useContext(AmfitrackContext);
  if (!ctx) {
    throw new Error("useAmfitrack must be used within an AmfitrackProvider");
  }
  return ctx;
}

export function useAmfitrackProvider(): AmfitrackContextValue {
  const amfitrackWebRef = useRef(new AmfitrackWeb());
  const [isReading, setIsReading] = useState(false);
  const [hubConnected, setHubConnected] = useState(false);
  const [sourceConnected, setSourceConnected] = useState(false);
  const [sensorIds, setSensorIds] = useState<number[]>([]);
  const [hubConfiguration, setHubConfiguration] = useState<Configuration[]>([]);
  const [sourceConfiguration, setSourceConfiguration] = useState<
    Configuration[]
  >([]);
  const [sensorConfigurations, setSensorConfigurations] = useState<
    Map<number, Configuration[]>
  >(new Map());

  const hubTxId =
    hubConfiguration.length > 0 ? extractDeviceId(hubConfiguration) : null;
  const sourceTxId =
    sourceConfiguration.length > 0
      ? extractDeviceId(sourceConfiguration)
      : null;

  const sensorsDataRef = useRef<Map<number, EmfImuFrameIdData>>(new Map());
  const sensorLastSeenRef = useRef<Map<number, number>>(new Map());
  const messageFrequencyRef = useRef<Map<number, DeviceFrequency>>(new Map());
  const configFetchedRef = useRef<Set<number>>(new Set());

  /**
   * Subscribe to SDK events and manage lifecycle
   */
  useEffect(() => {
    const sdk = amfitrackWebRef.current;

    const unbindHub = sdk.on("hubConnection", (connected) => {
      setHubConnected(connected);

      if (connected) {
        sdk.getHubConfiguration().then((config) => {
          console.log("hub configuration", config);
          setHubConfiguration(config ?? []);
        });
      } else {
        setHubConfiguration([]);
      }
    });

    const unbindSource = sdk.on("sourceConnection", (connected) => {
      setSourceConnected(connected);

      if (connected) {
        sdk.getSourceConfiguration().then((config) => {
          console.log("source configuration", config);
          setSourceConfiguration(config ?? []);
        });
      } else {
        setSourceConfiguration([]);
      }
    });
    const unbindReading = sdk.on("reading", setIsReading);

    const unbindFrequency = sdk.on("messageFrequency", (data) => {
      messageFrequencyRef.current = data;
    });

    const unbindError = sdk.on("error", ({ title, description }) => {
      toast.error(title, { description });
    });

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

    sdk.initialize();

    return () => {
      unbindHub();
      unbindSource();
      unbindReading();
      unbindFrequency();
      unbindError();
      unbindEmf();
      sdk.destroy();
    };
  }, []);

  /**
   * Cleanup expired sensors
   */
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

  /**
   * Fetch sensor configurations (only for sensors not yet fetched)
   */
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
  }, [hubConnected, sensorIds]);

  /**
   * Methods
   */
  const requestConnectionHub = useCallback(async () => {
    try {
      await amfitrackWebRef.current.requestConnectionHub();
    } catch (error) {
      if (error instanceof DeviceError) {
        toast.error(error.title, { description: error.description });
      } else {
        toast.error(error instanceof Error ? error.message : String(error));
      }
    }
  }, []);

  const requestConnectionSource = useCallback(async () => {
    try {
      await amfitrackWebRef.current.requestConnectionSource();
    } catch (error) {
      if (error instanceof DeviceError) {
        toast.error(error.title, { description: error.description });
      } else {
        toast.error(error instanceof Error ? error.message : String(error));
      }
    }
  }, []);

  const updateParameterValue = useCallback(
    (deviceName: string, uid: number, value: number | boolean | string) => {
      const patchConfig = (configs: Configuration[]) =>
        configs.map((cat) => ({
          ...cat,
          parameters: cat.parameters.map((p) =>
            p.uid === uid ? { ...p, value } : p,
          ),
        }));

      if (deviceName === "Hub") {
        setHubConfiguration((prev) => patchConfig(prev));
      } else if (deviceName === "Source") {
        setSourceConfiguration((prev) => patchConfig(prev));
      } else if (deviceName.startsWith("Sensor ")) {
        const sensorID = parseInt(deviceName.replace("Sensor ", ""), 10);
        setSensorConfigurations((prev) => {
          const next = new Map(prev);
          const existing = next.get(sensorID);
          if (existing) next.set(sensorID, patchConfig(existing));
          return next;
        });
      }
    },
    [],
  );

  return {
    isReading,
    hubConnected,
    sourceConnected,
    hubTxId,
    sourceTxId,
    sensorIds,
    sensorsDataRef,
    messageFrequencyRef,
    amfitrackWebRef,
    hubConfiguration,
    sourceConfiguration,
    sensorConfigurations,
    requestConnectionHub,
    requestConnectionSource,
    updateParameterValue,
  };
}
