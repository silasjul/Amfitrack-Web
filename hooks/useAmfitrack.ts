"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { AmfitrackWeb } from "@/amfitrackWebSDK";
import { PRODUCT_ID_SENSOR, PRODUCT_ID_SOURCE } from "@/amfitrackWebSDK/config";
import { EmfImuFrameIdData } from "@/amfitrackWebSDK/packets/decoders";

const POSITION_SCALE = 0.01;

export function useAmfitrack() {
  /**
   * State
   */
  const amfitrackWebRef = useRef(new AmfitrackWeb());
  const modelRef = useRef<THREE.Group | null>(null);
  const metalDistortionRef = useRef(0);

  // Devices
  const hubRef = useRef<HIDDevice | null>(null); // uses sensor id
  const sourceRef = useRef<HIDDevice | null>(null); // uses source id

  const [status, setStatus] = useState("Disconnected");

  // Position
  const latestSensorPositionRef = useRef(new THREE.Vector3());
  const centerOffsetRef = useRef(new THREE.Vector3());

  // Rotation
  const rotationOffsetRef = useRef(
    new THREE.Quaternion().setFromEuler(new THREE.Euler(0, 0, 0, "XYZ")),
  );

  // Reading
  const [isReading, setIsReading] = useState(false);

  /**
   * Methods
   */
  const resetCenter = useCallback(() => {
    centerOffsetRef.current.copy(latestSensorPositionRef.current);
    if (modelRef.current) {
      modelRef.current.position.set(0, 0, 0);
    }
  }, []);

  const requestConnectionDevice = useCallback(async () => {
    const device = await amfitrackWebRef.current.requestConnection();
    if (device?.productId === PRODUCT_ID_SENSOR) {
      hubRef.current = device;
    } else if (device?.productId === PRODUCT_ID_SOURCE) {
      sourceRef.current = device;
    }
  }, []);

  const autoConnectAuthorizedDevices = async () => {
    const devices =
      await amfitrackWebRef.current.autoConnectAuthorizedDevices();
    devices?.forEach((device) => {
      if (device.productId === PRODUCT_ID_SENSOR) {
        hubRef.current = device;
      } else if (device.productId === PRODUCT_ID_SOURCE) {
        sourceRef.current = device;
      }
    });
    setStatus("Connected");
  };

  const startReading = async (device: HIDDevice | null) => {
    if (!device) return;
    console.log("Starting reading for device:", device);
    await amfitrackWebRef.current.startReading(device);
    setIsReading(true);
  };

  const stopReading = () => {
    amfitrackWebRef.current.stopReading();
    setIsReading(false);
  };

  useEffect(() => {
    autoConnectAuthorizedDevices();
  }, []);

  useEffect(() => {
    const sdk = amfitrackWebRef.current;

    const handleEmfImuFrameId = (data: EmfImuFrameIdData) => {

      metalDistortionRef.current = data.metalDistortion / 255;

      if (!modelRef.current) return;

      // remap sensor coordinates to three.js coordinates
      const sensorPosition = new THREE.Vector3(
        -data.position.y,
        data.position.z,
        -data.position.x,
      );
      latestSensorPositionRef.current.copy(sensorPosition);

      const relativePosition = sensorPosition.clone().sub(centerOffsetRef.current);
      modelRef.current.position.copy(relativePosition.multiplyScalar(POSITION_SCALE));

      const sensorQuaternion = new THREE.Quaternion(
        -data.quaternion.y,
        data.quaternion.z,
        -data.quaternion.x,
        data.quaternion.w,
      ).normalize();
      sensorQuaternion.multiply(rotationOffsetRef.current);
      modelRef.current.quaternion.copy(sensorQuaternion);
    };

    sdk.on("emfImuFrameId", handleEmfImuFrameId);
    return () => sdk.off("emfImuFrameId", handleEmfImuFrameId);
  }, []);

  return {
    modelRef,
    status,
    isReading,
    hubRef,
    sourceRef,
    metalDistortionRef,
    resetCenter,
    startReading,
    stopReading,
    requestConnectionDevice,
  };
}
