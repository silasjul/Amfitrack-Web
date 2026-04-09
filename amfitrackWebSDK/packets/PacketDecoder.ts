import { Packet } from "./Packet";
import {
  SourceCalibrationPayload,
  SourceCalibrationData,
  SourceMeasurementPayload,
  SourceMeasurementData,
  EmfImuFrameIdPayload,
  EmfImuFrameIdData,
  CommonPayload,
  CommonData,
} from "../packets/decoders";

export enum PayloadType {
  SOURCE_CALIBRATION = 0x23,
  SOURCE_MEASUREMENT = 0x24,
  EMF_IMU_FRAME_ID = 0x1a,
  COMMON = 0x00,
}

export interface IPayloadDecoder<T> {
  getDecoded(payload: Uint8Array): T;
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

export class PacketDecoder {
  private packet: Packet;
  private payloadType: PayloadType;

  constructor(packet: Packet) {
    this.packet = packet;
    this.payloadType = packet.getHeader()[3] as PayloadType;
  }

  public getDecodedHeader(): PacketHeader {
    const headerBytes = this.packet.getHeader();

    // | Bits [7:6]: 0 = NoAck, 1 = Request Ack, 2 = Ack, 3 = Reply.
    // | Bits [5:0]: Time to live for packet routing.

    return {
      payloadLength: headerBytes[0], // Length of payload including CRC, in bytes.
      packetType: headerBytes[1],
      packetNumber: headerBytes[2], // Sequentially increasing packet number, used when sending back ack.
      payloadType: this.payloadType,
      sourceTxId: headerBytes[4],
      destinationTxId: headerBytes[5],
      crc: headerBytes[6],
    };
  }

  public getDecodedPayload(): DecodedPayload {
    const payloadBytes = this.packet.getPayload();
    const decoder = this.getDecoder();
    return decoder.getDecoded(payloadBytes) as DecodedPayload;
  }

  private getDecoder() {
    const decoder = decoderMap[this.payloadType];
    if (!decoder) throw new Error(`Unknown payload type: ${this.payloadType}`);
    return decoder;
  }

  public getPayloadType() {
    return { type: PayloadType[this.payloadType], value: this.payloadType };
  }
}

export type DecodedPayload =
  | SourceMeasurementData
  | SourceCalibrationData
  | EmfImuFrameIdData
  | CommonData;

export type PayloadDataMap = {
  [PayloadType.SOURCE_CALIBRATION]: SourceCalibrationData;
  [PayloadType.SOURCE_MEASUREMENT]: SourceMeasurementData;
  [PayloadType.EMF_IMU_FRAME_ID]: EmfImuFrameIdData;
  [PayloadType.COMMON]: CommonData;
};

const decoderMap: Record<PayloadType, IPayloadDecoder<DecodedPayload>> = {
  [PayloadType.COMMON]: new CommonPayload(),
  [PayloadType.SOURCE_MEASUREMENT]: new SourceMeasurementPayload(),
  [PayloadType.SOURCE_CALIBRATION]: new SourceCalibrationPayload(),
  [PayloadType.EMF_IMU_FRAME_ID]: new EmfImuFrameIdPayload(),
};
