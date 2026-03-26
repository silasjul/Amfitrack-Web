"use client";

import { useCallback, useEffect, useRef } from "react";
import * as THREE from "three";

const POSITION_SCALE = 0.01;
const DEFAULT_WS_URL = "ws://localhost:8000/ws/sensors";

type SensorPayload = {
  sensors?: Array<{
    id: number;
    position: { x: number; y: number; z: number };
    quaternion: { x: number; y: number; z: number; w: number };
  }>;
};

export function useSensorTracking() {
  const socketRef = useRef<WebSocket | null>(null);
  const modelRef = useRef<THREE.Group | null>(null);
  const latestSensorPositionRef = useRef(new THREE.Vector3());
  const centerOffsetRef = useRef(new THREE.Vector3());
  const rotationOffsetRef = useRef(
    new THREE.Quaternion().setFromEuler(new THREE.Euler(0, 0, 0, "XYZ"))
  );

  const resetCenter = useCallback(() => {
    centerOffsetRef.current.copy(latestSensorPositionRef.current);
    if (modelRef.current) {
      modelRef.current.position.set(0, 0, 0);
    }
  }, []);

  useEffect(() => {
    const wsUrl = process.env.NEXT_PUBLIC_WS_URL?.trim() || DEFAULT_WS_URL;
    const socket = new WebSocket(wsUrl);
    socketRef.current = socket;

    socket.addEventListener("open", () => {
      console.log("[WebSocket] Connected:", wsUrl);
    });

    socket.addEventListener("message", (event) => {
      const rawData = event.data;

      try {
        if (typeof rawData !== "string") {
          return;
        }

        const parsed = JSON.parse(rawData) as SensorPayload;
        // console.log("[WebSocket] Message:", parsed);

        const sensor = parsed.sensors?.[0];
        if (!sensor || !modelRef.current) {
          return;
        }

        // sensor position
        const sensorPosition = new THREE.Vector3(-sensor.position.y, sensor.position.z, -sensor.position.x); // remaps sensor coordinates to threejs coordinates
        latestSensorPositionRef.current.copy(sensorPosition);

        const relativePosition = sensorPosition.clone().sub(centerOffsetRef.current);
        const modelPosition = relativePosition.clone().multiplyScalar(POSITION_SCALE);
        modelRef.current.position.copy(modelPosition);

        // sensor quaternion
        const sensorQuaternion = new THREE.Quaternion(
          -sensor.quaternion.y,
          sensor.quaternion.z,
          -sensor.quaternion.x,
          sensor.quaternion.w
        ).normalize()
        sensorQuaternion.multiply(rotationOffsetRef.current);
        modelRef.current.quaternion.copy(sensorQuaternion);

      } catch {
        console.error("[WebSocket] Error reading data from sensor:", rawData);
      }
    });

    socket.addEventListener("error", (event) => {
      console.error("[WebSocket] Error:", event);
    });

    socket.addEventListener("close", (event) => {
      console.log("[WebSocket] Closed:", event.code, event.reason);
    });

    return () => {
      if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
        socketRef.current.close();
      }
      socketRef.current = null;
    };
  }, []);

  return {
    modelRef,
    resetCenter
  };
}
