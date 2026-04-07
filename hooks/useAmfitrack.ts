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

const POSITION_SCALE = 0.01;

interface AmfitrackContextValue {
  modelRef: React.RefObject<THREE.Group | null>;
  status: string;
  isReading: boolean;
  hubConnected: boolean;
  sourceConnected: boolean;
  hubRef: React.RefObject<HIDDevice | null>;
  sourceRef: React.RefObject<HIDDevice | null>;
  metalDistortionRef: React.RefObject<number>;
  resetCenter: () => void;
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
  const modelRef = useRef<THREE.Group | null>(null);
  const metalDistortionRef = useRef(0);
  const [isReading, setIsReading] = useState(false);

  // Devices
  const hubRef = useRef<HIDDevice | null>(null); // uses sensor id
  const sourceRef = useRef<HIDDevice | null>(null); // uses source id
  const [hubConnected, setHubConnected] = useState(false);
  const [sourceConnected, setSourceConnected] = useState(false);

  const [status, setStatus] = useState("Disconnected");
  const initializedRef = useRef(false);

  // Position
  const latestSensorPositionRef = useRef(new THREE.Vector3());
  const centerOffsetRef = useRef(new THREE.Vector3());

  // Rotation
  const rotationOffsetRef = useRef(
    new THREE.Quaternion().setFromEuler(new THREE.Euler(0, 0, 0, "XYZ")),
  );

  /**
   * Methods
   */
  const resetCenter = useCallback(() => {
    centerOffsetRef.current.copy(latestSensorPositionRef.current);
    if (modelRef.current) {
      modelRef.current.position.set(0, 0, 0);
    }
  }, []);

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
    const devices =
      await amfitrackWebRef.current.autoConnectAuthorizedDevices();
    devices?.forEach((device) => {
      if (device.productId === PRODUCT_ID_SENSOR) {
        hubRef.current = device;
        setHubConnected(true);
      } else if (device.productId === PRODUCT_ID_SOURCE) {
        sourceRef.current = device;
        setSourceConnected(true);
      }
    });
    if (devices && devices.length > 0) {
      setStatus("Connected");
    }
  };

  const startReading = useCallback(
    async (device: HIDDevice | null) => {
      if (!device || isReading) return;
      try {
        await amfitrackWebRef.current.startReading(device);
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

  useEffect(() => {
    if (hubRef.current) {
      startReading(hubRef.current);
    }

    return () => {
      stopReading();
    };
  }, [hubRef.current]);

  amfitrackWebRef.current.setOnEmfImuFrameId((header, data) => {
    console.log({ header, data });

    metalDistortionRef.current = data.metalDistortion / 255;

    if (!modelRef.current) return;

    // remap sensor coordinates to three.js coordinates
    const sensorPosition = new THREE.Vector3(
      -data.position.y,
      data.position.z,
      -data.position.x,
    );
    latestSensorPositionRef.current.copy(sensorPosition);

    const relativePosition = sensorPosition
      .clone()
      .sub(centerOffsetRef.current);
    modelRef.current.position.copy(
      relativePosition.multiplyScalar(POSITION_SCALE),
    );

    const sensorQuaternion = new THREE.Quaternion(
      -data.quaternion.y,
      data.quaternion.z,
      -data.quaternion.x,
      data.quaternion.w,
    ).normalize();
    sensorQuaternion.multiply(rotationOffsetRef.current);
    modelRef.current.quaternion.copy(sensorQuaternion);
  });

  return {
    modelRef,
    status,
    isReading,
    hubConnected,
    sourceConnected,
    hubRef,
    sourceRef,
    metalDistortionRef,
    resetCenter,
    startReading,
    stopReading,
    requestConnectionHub,
    requestConnectionSource,
  };
}
