import { IPayloadDecoder } from "../../interfaces/IDecoder";
import { LE } from "../../../config";

export type SourceCalibrationData = ReturnType<SourceCalibrationPayload["getDecoded"]>;

export class SourceCalibrationPayload implements IPayloadDecoder<SourceCalibrationData> {
  public getDecoded(payload: Uint8Array) {
    const view = new DataView(
      payload.buffer,
      payload.byteOffset,
      payload.byteLength,
    );

    const frequency = view.getFloat32(0, LE);
    const calibration = view.getFloat32(4, LE);
    const phaseModulationOffset = view.getFloat32(8, LE);

    return {
      frequency,
      calibration,
      phaseModulationOffset,
    };
  }
}
