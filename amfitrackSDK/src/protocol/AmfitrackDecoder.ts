import {
  AmfitrackMessage,
  DecodedConfigValue,
  IDecoder,
  IPayloadDecoder,
} from "../interfaces/IDecoder";
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
import { ConfigValueType } from "./AmfitrackEncoder";
import { LE } from "../../config";

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
  private decoderMap: Record<PayloadType, IPayloadDecoder<DecodedPayload>> = {
    [PayloadType.SOURCE_CALIBRATION]: new SourceCalibrationPayload(),
    [PayloadType.SOURCE_MEASUREMENT]: new SourceMeasurementPayload(),
    [PayloadType.EMF_IMU_FRAME_ID]: new EmfImuFrameIdPayload(),
    [PayloadType.COMMON]: new CommonPayload(), // TODO
    [PayloadType.NOT_IMPLEMENTED]: new CommonPayload(), // TODO
  };

  decode(bytes: Uint8Array): AmfitrackMessage {
    const headerBytes = bytes.subarray(1, 8);
    const payloadBytes = bytes.subarray(8);
    const header = this.parseHeader(headerBytes);
    const payload = this.parsePayload(payloadBytes, header.payloadType);
    return { header, payload };
  }

  /**
   * Decode a REPLY_CONFIGURATION_VALUE_UID (0x14) payload.
   * Layout: [id, uid (uint32 LE), data_type, value...]
   */
  decodeConfigValue(payload: Uint8Array): DecodedConfigValue {
    const view = new DataView(
      payload.buffer,
      payload.byteOffset,
      payload.byteLength,
    );
    const uid = view.getUint32(1, LE);
    const dataType = view.getUint8(5);
    const value = this.decodeTypedValue(view, payload, 6, dataType);
    return { uid, dataType, value };
  }

  decodeString(data: Uint8Array, offset: number): string {
    let end = offset;
    while (end < data.length && data[end] !== 0) end++;
    return new TextDecoder("ascii").decode(data.subarray(offset, end));
  }

  private parseHeader(bytes: Uint8Array): PacketHeader {
    return {
      payloadLength: bytes[0],
      packetType: bytes[1],
      packetNumber: bytes[2],
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
    const decoder = this.decoderMap[payloadType];
    if (!decoder) throw new Error(`Unknown payload type: ${payloadType}`);
    return decoder.getDecoded(bytes);
  }

  private decodeTypedValue(
    view: DataView,
    raw: Uint8Array,
    off: number,
    dataType: number,
  ): number | boolean | string {
    switch (dataType) {
      case ConfigValueType.BOOL:
        return view.getUint8(off) !== 0;
      case ConfigValueType.CHAR:
        return this.decodeString(raw, off);
      case ConfigValueType.INT8:
        return view.getInt8(off);
      case ConfigValueType.UINT8:
        return view.getUint8(off);
      case ConfigValueType.INT16:
        return view.getInt16(off, LE);
      case ConfigValueType.UINT16:
        return view.getUint16(off, LE);
      case ConfigValueType.INT32:
        return view.getInt32(off, LE);
      case ConfigValueType.UINT32:
        return view.getUint32(off, LE);
      case ConfigValueType.INT64:
        return Number(view.getBigInt64(off, LE));
      case ConfigValueType.UINT64:
        return Number(view.getBigUint64(off, LE));
      case ConfigValueType.FLOAT:
        return view.getFloat32(off, LE);
      case ConfigValueType.DOUBLE:
        return view.getFloat64(off, LE);
      case ConfigValueType.PROCEDURE_CALL:
        return view.getUint8(off) !== 0;
      default:
        return view.getUint8(off);
    }
  }
}
