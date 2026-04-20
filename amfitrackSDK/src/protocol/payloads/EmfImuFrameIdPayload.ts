import { IPayloadDecoder } from "../../interfaces/IProtocol";
import { LE } from "../../../config";
import { parseImuData, parseMagnetoData } from "./helpers/dataParsers";

export type EmfImuFrameIdData = ReturnType<EmfImuFrameIdPayload["getDecoded"]>;

export class EmfImuFrameIdPayload implements IPayloadDecoder<EmfImuFrameIdData> {
  public getDecoded(payload: Uint8Array) {
    const view = new DataView(
      payload.buffer,
      payload.byteOffset,
      payload.byteLength,
    );

    const position = {
      x: this.getInt24(view, 0) / 100,
      y: this.getInt24(view, 3) / 100,
      z: this.getInt24(view, 6) / 100,
    };

    const quaternion = {
      x: this.getInt24(view, 9) / 1000000,
      y: this.getInt24(view, 12) / 1000000,
      z: this.getInt24(view, 15) / 1000000,
      w: this.getInt24(view, 18) / 1000000,
    };

    const sensorStatus = this.parseSensorStatus(payload[21]);
    const sourceCoilId = payload[22];
    const calcId = view.getUint16(23, LE);

    const imu = parseImuData(view, 25);
    const magneto = parseMagnetoData(view, 37);

    const temperature = payload[43] * 0.5 - 30;
    const sensorState = this.parseSourceState(payload[44]);
    const metalDistortion = payload[45];
    const gpioState = view.getUint16(46, LE);
    const rssi = payload[48];
    const frameId = payload[49] | (payload[50] << 8) | (payload[51] << 16);

    return {
      position,
      quaternion,
      sensorStatus,
      sourceCoilId,
      calcId,
      imu,
      magneto,
      temperature,
      sensorState,
      metalDistortion,
      gpioState,
      rssi,
      frameId,
    };
  }

  private parseSensorStatus(byte: number) {
    const BATTERY_LEVELS = ["Full", "OK", "Low", "Critical"] as const;
    const BFIELD_STATUSES = [
      "Tracking",
      "Uncertain tracking",
      "No tracking",
      "B field too low",
      "B field too high",
      "Source coil defect",
      "Sensor coil defect",
    ] as const;

    return {
      batteryLevel: BATTERY_LEVELS[byte & 0x03],
      batteryCharging: Boolean(byte & 0x04),
      sourceConnected: Boolean(byte & 0x08),
      bFieldStatus: BFIELD_STATUSES[(byte >> 4) & 0x07] ?? "Unknown",
      sync: Boolean(byte & 0x80),
    };
  }

  private parseSourceState(state: number): string {
    const labels = [
      "Phase Modulation",
      "Frequency Tune",
      "Current Tune",
      "Crosstalk Calibration",
      "Offset Coil Enabled",
    ];
    const active = labels.filter((_, i) => state & (1 << i));
    return active.length > 0 ? active.join(", ") : "None";
  }

  private getInt24(view: DataView, offset: number) {
    let value =
      view.getUint8(offset) |
      (view.getUint8(offset + 1) << 8) |
      (view.getUint8(offset + 2) << 16);

    value = (value << 8) >> 8;
    return value;
  }
}
