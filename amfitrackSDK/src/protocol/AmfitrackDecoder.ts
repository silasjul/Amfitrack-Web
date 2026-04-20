import {
  AmfitrackMessage,
  IDecoder,
  IPayloadDecoder,
} from "../interfaces/IProtocol";
import {
  SourceMeasurementData,
  SourceCalibrationData,
  EmfImuFrameIdData,
  CommonData,
  SourceCalibrationPayload,
  SourceMeasurementPayload,
  EmfImuFrameIdPayload,
  CommonPayload,
} from "./payloads";

export enum PayloadType {
  SOURCE_CALIBRATION = 0x23,
  SOURCE_MEASUREMENT = 0x24,
  EMF_IMU_FRAME_ID = 0x1a,
  COMMON = 0x00,
  NOT_IMPLEMENTED = 0xfd,
}

export interface PacketHeader {
  payloadLength: number;
  packetType: number;
  packetNumber: number;
  payloadType: PayloadType;
  sourceTxId: number;
  destinationTxId: number;
  crc: number;
}

export type DecodedPayload =
  | SourceMeasurementData
  | SourceCalibrationData
  | EmfImuFrameIdData
  | CommonData;

export class AmfitrackDecoder implements IDecoder {
  decode(bytes: Uint8Array): AmfitrackMessage {
    const headerBytes = bytes.subarray(1, 8);
    const payloadBytes = bytes.subarray(8);
    const header = this.parseHeader(headerBytes);
    const payload = this.parsePayload(payloadBytes, header.payloadType);
    return { header, payload };
  }

  private parseHeader(bytes: Uint8Array): PacketHeader {
    return {
      payloadLength: bytes[0], // Length of payload including CRC, in bytes.
      packetType: bytes[1],
      packetNumber: bytes[2], // Sequentially increasing packet number, used when sending back ack.
      payloadType: bytes[3] as PayloadType,
      sourceTxId: bytes[4],
      destinationTxId: bytes[5],
      crc: bytes[6],
    };
  }

  private parsePayload(
    bytes: Uint8Array,
    payloadType: PayloadType,
  ): DecodedPayload {
    const decoder = decoderMap[payloadType];
    if (!decoder) throw new Error(`Unknown payload type: ${payloadType}`);
    return decoder.getDecoded(bytes);
  }
}

const decoderMap: Record<PayloadType, IPayloadDecoder<DecodedPayload>> = {
  [PayloadType.SOURCE_CALIBRATION]: new SourceCalibrationPayload(),
  [PayloadType.SOURCE_MEASUREMENT]: new SourceMeasurementPayload(),
  [PayloadType.EMF_IMU_FRAME_ID]: new EmfImuFrameIdPayload(),
  [PayloadType.COMMON]: new CommonPayload(), // TODO
  [PayloadType.NOT_IMPLEMENTED]: new CommonPayload(), // TODO
};
