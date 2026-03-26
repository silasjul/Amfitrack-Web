import { IPayloadDecoder } from "../PacketDecoder";
import { LE } from "../../config";
import { parseImuData, parseMagnetoData } from "./dataParsers";

export type SourceMeasurementData = ReturnType<SourceMeasurementPayload["getDecoded"]>;

export class SourceMeasurementPayload implements IPayloadDecoder<SourceMeasurementData> {
  public getDecoded(payload: Uint8Array) {
    const view = new DataView(
      payload.buffer,
      payload.byteOffset,
      payload.byteLength,
    );

    const current = {
      x: view.getFloat32(0, LE),
      y: view.getFloat32(4, LE),
      z: view.getFloat32(8, LE),
    };

    const imu = parseImuData(view, 12);

    const magneto = parseMagnetoData(view, 24);

    const temperature = payload[30] * 0.5 - 30;
    const sourceStatus = payload[31];
    const sourceState = payload[32];
    const rssi = payload[33];

    const frameId = payload[34] | (payload[35] << 8) | (payload[36] << 16);

    let voltage = [0, 0, 0, 0];

    // when voltage is available
    if (payload.length > 37) {
      voltage = [
        view.getFloat32(37, LE),
        view.getFloat32(41, LE),
        view.getFloat32(45, LE),
        view.getFloat32(49, LE),
      ];
    }

    return {
      current,
      imu,
      magneto,
      temperature,
      sourceStatus,
      sourceState,
      rssi,
      frameId,
      voltage,
    };
  }
}
