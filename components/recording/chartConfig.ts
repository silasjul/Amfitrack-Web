export interface FieldDef {
  field: string;
  label: string;
  color: string;
}

const R = "#ef4444";
const G = "#22c55e";
const B = "#3b82f6";
const Y = "#eab308";
const O = "#f97316";
const P = "#a855f7";

export const CHARTABLE_FIELDS: Record<string, FieldDef[]> = {
  position: [
    { field: "pos_x", label: "X", color: R },
    { field: "pos_y", label: "Y", color: G },
    { field: "pos_z", label: "Z", color: B },
  ],
  orientation: [
    { field: "quat_x", label: "X", color: R },
    { field: "quat_y", label: "Y", color: G },
    { field: "quat_z", label: "Z", color: B },
    { field: "quat_w", label: "W", color: Y },
  ],
  environment: [
    { field: "temperature", label: "Temp", color: O },
    { field: "metal_distortion", label: "Metal", color: P },
  ],
  device_status: [
    { field: "rssi", label: "RSSI", color: R },
    { field: "battery_charging", label: "Charging", color: G },
    { field: "source_connected", label: "Source", color: B },
    { field: "sync", label: "Sync", color: Y },
  ],
  accelerometer: [
    { field: "acc_x", label: "X", color: R },
    { field: "acc_y", label: "Y", color: G },
    { field: "acc_z", label: "Z", color: B },
  ],
  gyroscope: [
    { field: "gyro_x", label: "X", color: R },
    { field: "gyro_y", label: "Y", color: G },
    { field: "gyro_z", label: "Z", color: B },
  ],
  magnetometer: [
    { field: "mag_x", label: "X", color: R },
    { field: "mag_y", label: "Y", color: G },
    { field: "mag_z", label: "Z", color: B },
  ],
  current: [
    { field: "current_x", label: "X", color: R },
    { field: "current_y", label: "Y", color: G },
    { field: "current_z", label: "Z", color: B },
  ],
  voltage: [
    { field: "voltage_0", label: "V0", color: R },
    { field: "voltage_1", label: "V1", color: G },
    { field: "voltage_2", label: "V2", color: B },
    { field: "voltage_3", label: "V3", color: Y },
  ],
  status: [
    { field: "source_status", label: "Status", color: R },
    { field: "source_state", label: "State", color: G },
    { field: "rssi", label: "RSSI", color: B },
  ],
  calibration: [
    { field: "cal_frequency", label: "Freq", color: R },
    { field: "cal_factor", label: "Factor", color: G },
    { field: "cal_phase_offset", label: "Phase", color: B },
  ],
};

export const SECTION_LABELS: Record<string, string> = {
  position: "Position",
  orientation: "Orientation",
  environment: "Environment",
  device_status: "Device Status",
  accelerometer: "Accelerometer",
  gyroscope: "Gyroscope",
  magnetometer: "Magnetometer",
  current: "Current",
  voltage: "Voltage",
  status: "Status",
  calibration: "Calibration",
};
