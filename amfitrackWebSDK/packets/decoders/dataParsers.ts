import { LE } from "../../config";

const ACCEL_SCALE = 0.000122; // to g
const GYRO_SCALE = 0.07; // to deg/sec

export function parseImuData(view: DataView, offset: number) {
  return {
    acc_x: view.getInt16(offset, LE) * ACCEL_SCALE,
    acc_y: view.getInt16(offset + 2, LE) * ACCEL_SCALE,
    acc_z: view.getInt16(offset + 4, LE) * ACCEL_SCALE,
    gyro_x: view.getInt16(offset + 6, LE) * GYRO_SCALE,
    gyro_y: view.getInt16(offset + 8, LE) * GYRO_SCALE,
    gyro_z: view.getInt16(offset + 10, LE) * GYRO_SCALE,
  };
}

const MAG_SCALE = 0.012207;

export function parseMagnetoData(view: DataView, offset: number) {
  return {
    mag_x: view.getInt16(offset, LE) * MAG_SCALE,
    mag_y: view.getInt16(offset + 2, LE) * MAG_SCALE,
    mag_z: view.getInt16(offset + 4, LE) * MAG_SCALE,
  };
}