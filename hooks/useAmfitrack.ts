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
import { PRODUCT_ID_SENSOR, PRODUCT_ID_SOURCE } from "@/amfitrackWebSDK/config";
import {
  EmfImuFrameIdData,
  SourceMeasurementData,
  SourceCalibrationData,
} from "@/amfitrackWebSDK/packets/decoders";

const POSITION_SCALE = 0.01;
const SENSOR_TIMEOUT_MS = 3000;
const SENSOR_CLEANUP_INTERVAL_MS = 1000;

interface AmfitrackContextValue {
  isReading: boolean;
  hubConnected: boolean;
  sourceConnected: boolean;
  sensorIds: number[];
  hubRef: React.RefObject<HIDDevice | null>;
  sourceRef: React.RefObject<HIDDevice | null>;
  sensorsDataRef: React.RefObject<Map<number, EmfImuFrameIdData>>;
  startReading: (device: HIDDevice | null) => Promise<void>;
  stopReading: () => void;
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
  /*
   * State
   */
  const amfitrackWebRef = useRef(new AmfitrackWeb());
  const [isReading, setIsReading] = useState(false);
  const sensorsDataRef = useRef<Map<number, EmfImuFrameIdData>>(new Map());
  const sensorLastSeenRef = useRef<Map<number, number>>(new Map());
  const [sensorIds, setSensorIds] = useState<number[]>([]);

  // Devices
  const hubRef = useRef<HIDDevice | null>(null); // uses sensor id
  const sourceRef = useRef<HIDDevice | null>(null); // uses source id
  const [hubConnected, setHubConnected] = useState(false);
  const [sourceConnected, setSourceConnected] = useState(false);

  const initializedRef = useRef(false);

  /**
   * Methods
   */
  const requestConnectionHub = useCallback(async () => {
    try {
      const device = await amfitrackWebRef.current.requestConnectionHub();
      if (device) {
        hubRef.current = device;
        setHubConnected(true);
      }
    } catch (error: any) {
      console.log("Failed to connect hub:", error);
    }
  }, []);

  const requestConnectionSource = useCallback(async () => {
    try {
      const device = await amfitrackWebRef.current.requestConnectionSource();
      if (device) {
        sourceRef.current = device;
        setSourceConnected(true);
      }
    } catch (error: any) {
      console.log("Failed to connect source:", error);
    }
  }, []);

  const autoConnectAuthorizedDevices = async () => {
    const hubDevice = await amfitrackWebRef.current.getHubDevice();
    if (hubDevice) {
      hubRef.current = hubDevice;
      setHubConnected(true);
    }
    const sourceDevice = await amfitrackWebRef.current.getSourceDevice();
    if (sourceDevice) {
      sourceRef.current = sourceDevice;
      setSourceConnected(true);
    }
  };

  /**
   * On mount, auto connect and add cleanup listener
   */
  useEffect(() => {
    if (!initializedRef.current) {
      initializedRef.current = true;
      autoConnectAuthorizedDevices();
    }

    const handleDisconnect = (e: HIDConnectionEvent) => {
      const device = e.device;
      if (device.productId === PRODUCT_ID_SENSOR && hubRef.current === device) {
        hubRef.current = null;
        setHubConnected(false);
      }
      if (
        device.productId === PRODUCT_ID_SOURCE &&
        sourceRef.current === device
      ) {
        sourceRef.current = null;
        setSourceConnected(false);
      }
    };

    navigator.hid.addEventListener("disconnect", handleDisconnect);
    return () => {
      navigator.hid.removeEventListener("disconnect", handleDisconnect);
    };
  }, []);

  /**
   * Automatically start reading from hub when connected
   */
  const startReading = useCallback(
    async (device: HIDDevice | null) => {
      if (!device || isReading) return;
      try {
        await amfitrackWebRef.current.startReadingDevice(device);
        setIsReading(true);
      } catch (error: any) {
        console.error(
          "Failed to open device — it may already be in use by another tab or application:",
          error,
        );
      }
    },
    [isReading],
  );

  const stopReading = () => {
    amfitrackWebRef.current.stopReading();
    setIsReading(false);
  };

  useEffect(() => {
    if (hubRef.current) {
      startReading(hubRef.current);
    }

    return () => {
      stopReading();
    };
  }, [hubRef.current]);

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
   * Handle EMF data
   */
  amfitrackWebRef.current.setOnEmfImuFrameId((header, data) => {
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

  return {
    isReading,
    hubConnected,
    sourceConnected,
    sensorIds,
    hubRef,
    sourceRef,
    startReading,
    stopReading,
    requestConnectionHub,
    requestConnectionSource,
    sensorsDataRef,
  };
}
