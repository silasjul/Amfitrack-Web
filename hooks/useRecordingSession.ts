"use client";

import { useCallback, useEffect, useRef } from "react";
import { useDeviceStore } from "@/amfitrackSDK/src/store/useDeviceStore";
import { useRecordingStore } from "@/stores/useRecordingStore";
import { downloadCSV } from "@/lib/csv";
import {
  extractSectionFields,
  framesToCSV,
  type RecordingFrame,
} from "@/lib/recordingCsv";

const MEAS_SECTIONS = new Set([
  "accelerometer",
  "gyroscope",
  "magnetometer",
  "current",
  "voltage",
  "status",
]);

export function useRecordingSession() {
  const isRecording = useRecordingStore((s) => s.isRecording);
  const isPaused = useRecordingStore((s) => s.isPaused);
  const selection = useRecordingStore((s) => s.selection);

  const framesRef = useRef<RecordingFrame[]>([]);

  // Clear accumulated frames whenever a new recording starts
  useEffect(() => {
    if (isRecording) framesRef.current = [];
  }, [isRecording]);

  // Subscribe to the device store while actively recording (not paused)
  useEffect(() => {
    if (!isRecording || isPaused) return;

    const unsubscribe = useDeviceStore.subscribe((state, prev) => {
      const { deviceMeta, emfImuFrameId, sourceMeasurement, sourceCalibration } =
        state;

      for (const [txIdStr, sections] of Object.entries(selection)) {
        if (sections.length === 0) continue;
        const txId = Number(txIdStr);
        const meta = deviceMeta[txId];
        if (!meta) continue;

        const { kind } = meta;
        const deviceKey = `${kind}_${txId}`;

        if (kind === "sensor") {
          const curr = emfImuFrameId[txId];
          if (curr && curr !== prev.emfImuFrameId[txId]) {
            framesRef.current.push({
              timestamp: Date.now(),
              deviceKey,
              frameId: curr.frameId,
              data: extractSectionFields(sections, kind, curr),
            });
          }
        } else if (kind === "source") {
          const hasMeasSection = sections.some((s) => MEAS_SECTIONS.has(s));

          if (hasMeasSection) {
            const curr = sourceMeasurement[txId];
            if (curr && curr !== prev.sourceMeasurement[txId]) {
              framesRef.current.push({
                timestamp: Date.now(),
                deviceKey,
                frameId: curr.frameId,
                data: extractSectionFields(sections, kind, undefined, curr),
              });
            }
          }

          if (sections.includes("calibration")) {
            const curr = sourceCalibration[txId];
            if (curr && curr !== prev.sourceCalibration[txId]) {
              framesRef.current.push({
                timestamp: Date.now(),
                deviceKey: `${deviceKey}_cal`,
                frameId: 0,
                data: extractSectionFields(
                  ["calibration"],
                  kind,
                  undefined,
                  undefined,
                  curr,
                ),
              });
            }
          }
        }
      }
    });

    return unsubscribe;
  }, [isRecording, isPaused, selection]);

  const downloadRecording = useCallback(() => {
    const frames = framesRef.current;
    if (frames.length === 0) return;

    const deviceMeta = useDeviceStore.getState().deviceMeta;
    const csv = framesToCSV(frames, selection, deviceMeta);
    const ts = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
    downloadCSV(csv, `amfitrack-recording-${ts}.csv`);
  }, [selection]);

  return { downloadRecording };
}
