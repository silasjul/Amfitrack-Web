import type { EmfImuFrameIdData } from "@/amfitrackSDK/src/protocol/payloads/EmfImuFrameIdPayload";
import type { SourceMeasurementData } from "@/amfitrackSDK/src/protocol/payloads/SourceMeasurementPayload";
import type { SourceCalibrationData } from "@/amfitrackSDK/src/protocol/payloads/SourceCalibrationPayload";
import type { DeviceKind } from "@/amfitrackSDK/src/interfaces/IStore";

const DELIMITER = ";";
const UTF8_BOM = "﻿";

export interface RecordingFrame {
  timestamp: number;
  deviceKey: string;
  frameId: number;
  data: Record<string, number | string | boolean>;
}

const SECTION_COLUMNS: Record<string, string[]> = {
  position: ["pos_x", "pos_y", "pos_z"],
  orientation: ["quat_x", "quat_y", "quat_z", "quat_w"],
  environment: ["temperature", "metal_distortion"],
  device_status: [
    "battery_level",
    "battery_charging",
    "source_connected",
    "b_field_status",
    "sync",
    "rssi",
  ],
  accelerometer: ["acc_x", "acc_y", "acc_z"],
  gyroscope: ["gyro_x", "gyro_y", "gyro_z"],
  magnetometer: ["mag_x", "mag_y", "mag_z"],
  current: ["current_x", "current_y", "current_z"],
  voltage: ["voltage_0", "voltage_1", "voltage_2", "voltage_3"],
  status: ["source_status", "source_state", "rssi"],
  calibration: ["cal_frequency", "cal_factor", "cal_phase_offset"],
};

export function extractSectionFields(
  sections: string[],
  _kind: DeviceKind,
  emf?: EmfImuFrameIdData,
  meas?: SourceMeasurementData,
  cal?: SourceCalibrationData,
): Record<string, number | string | boolean> {
  const fields: Record<string, number | string | boolean> = {};

  for (const section of sections) {
    if (section === "position" && emf) {
      fields.pos_x = emf.position.x;
      fields.pos_y = emf.position.y;
      fields.pos_z = emf.position.z;
    }
    if (section === "orientation" && emf) {
      fields.quat_x = emf.quaternion.x;
      fields.quat_y = emf.quaternion.y;
      fields.quat_z = emf.quaternion.z;
      fields.quat_w = emf.quaternion.w;
    }
    if (section === "environment" && emf) {
      fields.temperature = emf.temperature;
      fields.metal_distortion = emf.metalDistortion;
    }
    if (section === "device_status" && emf) {
      fields.battery_level = emf.sensorStatus.batteryLevel;
      fields.battery_charging = emf.sensorStatus.batteryCharging;
      fields.source_connected = emf.sensorStatus.sourceConnected;
      fields.b_field_status = emf.sensorStatus.bFieldStatus;
      fields.sync = emf.sensorStatus.sync;
      fields.rssi = emf.rssi;
    }
    if (section === "accelerometer") {
      const imu = emf?.imu ?? meas?.imu;
      if (imu) {
        fields.acc_x = imu.acc_x;
        fields.acc_y = imu.acc_y;
        fields.acc_z = imu.acc_z;
      }
    }
    if (section === "gyroscope") {
      const imu = emf?.imu ?? meas?.imu;
      if (imu) {
        fields.gyro_x = imu.gyro_x;
        fields.gyro_y = imu.gyro_y;
        fields.gyro_z = imu.gyro_z;
      }
    }
    if (section === "magnetometer") {
      const magneto = emf?.magneto ?? meas?.magneto;
      if (magneto) {
        fields.mag_x = magneto.mag_x;
        fields.mag_y = magneto.mag_y;
        fields.mag_z = magneto.mag_z;
      }
    }
    if (section === "current" && meas) {
      fields.current_x = meas.current.x;
      fields.current_y = meas.current.y;
      fields.current_z = meas.current.z;
    }
    if (section === "voltage" && meas) {
      fields.voltage_0 = meas.voltage[0] ?? 0;
      fields.voltage_1 = meas.voltage[1] ?? 0;
      fields.voltage_2 = meas.voltage[2] ?? 0;
      fields.voltage_3 = meas.voltage[3] ?? 0;
    }
    if (section === "status" && meas) {
      fields.source_status = meas.sourceStatus;
      fields.source_state = meas.sourceState;
      fields.rssi = meas.rssi;
    }
    if (section === "calibration" && cal) {
      fields.cal_frequency = cal.frequency;
      fields.cal_factor = cal.calibration;
      fields.cal_phase_offset = cal.phaseModulationOffset;
    }
  }

  return fields;
}

function escape(value: string): string {
  if (
    value.includes(DELIMITER) ||
    value.includes('"') ||
    value.includes("\n")
  ) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function formatValue(val: number | string | boolean): string {
  if (typeof val === "boolean") return val ? "true" : "false";
  if (typeof val === "number") return val.toString();
  return escape(val);
}

export function framesToCSV(
  frames: RecordingFrame[],
  selection: Record<number, string[]>,
  deviceMeta: Record<number, { kind: DeviceKind }>,
): string {
  if (frames.length === 0) return UTF8_BOM;

  // Build ordered data columns from selection (stable, deterministic order)
  const seenCols = new Set<string>();
  const allDataCols: string[] = [];

  for (const [txIdStr, sections] of Object.entries(selection)) {
    const txId = Number(txIdStr);
    if (!deviceMeta[txId] || sections.length === 0) continue;
    for (const section of sections) {
      for (const col of SECTION_COLUMNS[section] ?? []) {
        if (!seenCols.has(col)) {
          seenCols.add(col);
          allDataCols.push(col);
        }
      }
    }
  }

  const header = ["timestamp_ms", "device", "frame_id", ...allDataCols].join(
    DELIMITER,
  );
  const rows: string[] = [header];

  const t0 = frames[0].timestamp;

  for (const frame of frames) {
    const row: string[] = [
      (frame.timestamp - t0).toString(),
      frame.deviceKey,
      frame.frameId.toString(),
    ];
    for (const col of allDataCols) {
      const val = frame.data[col];
      row.push(val !== undefined ? formatValue(val) : "");
    }
    rows.push(row.join(DELIMITER));
  }

  return UTF8_BOM + rows.join("\n");
}
