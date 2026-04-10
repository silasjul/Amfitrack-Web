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
import { AmfitrackWeb } from "@/amfitrackWebSDK";
import { EmfImuFrameIdData } from "@/amfitrackWebSDK/packets/decoders";
import { Configuration } from "@/amfitrackWebSDK/Configurator";

const POSITION_SCALE = 0.01;
const SENSOR_TIMEOUT_MS = 3000;
const SENSOR_CLEANUP_INTERVAL_MS = 1000;

interface AmfitrackContextValue {
  isReading: boolean;
  hubConnected: boolean;
  sourceConnected: boolean;
  sensorIds: number[];
  sensorsDataRef: React.RefObject<Map<number, EmfImuFrameIdData>>;
  hubConfiguration: Configuration[];
  sourceConfiguration: Configuration[];
  requestConnectionHub: () => Promise<void>;
  requestConnectionSource: () => Promise<void>;
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

  const sensorsDataRef = useRef<Map<number, EmfImuFrameIdData>>(new Map());
  const sensorLastSeenRef = useRef<Map<number, number>>(new Map());

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
   * Methods
   */
  const requestConnectionHub = useCallback(async () => {
    try {
      await amfitrackWebRef.current.requestConnectionHub();
    } catch (error) {
      console.log("Failed to connect hub:", error);
    }
  }, []);

  const requestConnectionSource = useCallback(async () => {
    try {
      await amfitrackWebRef.current.requestConnectionSource();
    } catch (error) {
      console.log("Failed to connect source:", error);
    }
  }, []);

  return {
    isReading,
    hubConnected,
    sourceConnected,
    sensorIds,
    sensorsDataRef,
    hubConfiguration,
    sourceConfiguration,
    requestConnectionHub,
    requestConnectionSource,
  };
}
