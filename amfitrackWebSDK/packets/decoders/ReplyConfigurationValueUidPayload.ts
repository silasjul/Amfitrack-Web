import { IPayloadDecoder } from "../PacketDecoder";
import { LE } from "../../config";

export enum ConfigValueType {
  BOOL = 0,
  CHAR = 1,
  INT8 = 2,
  UINT8 = 3,
  INT16 = 4,
  UINT16 = 6,
  INT32 = 8,
  UINT32 = 10,
  INT64 = 12,
  UINT64 = 14,
  FLOAT = 16,
  DOUBLE = 18,
  PROCEDURE_CALL = 100,
}

export type ReplyConfigurationValueUidData = ReturnType<
  ReplyConfigurationValueUidPayload["getDecoded"]
>;

/**
 * Decodes a REPLY_CONFIGURATION_VALUE_UID (0x14) common payload.
 *
 * Layout: [id, uid (uint32 LE), data_type, value...]
 *
 * Mirrors ReplyConfigurationValueUidPayload.from_bytes() in common_payload.py.
 */
export class ReplyConfigurationValueUidPayload implements IPayloadDecoder<ReplyConfigurationValueUidData> {
  public getDecoded(payload: Uint8Array) {
    const view = new DataView(
      payload.buffer,
      payload.byteOffset,
      payload.byteLength,
    );

    const uid = view.getUint32(1, LE);
    const dataType: ConfigValueType = view.getUint8(5);
    const value = this.decodeValue(view, payload, 6, dataType);

    return { uid, dataType, value };
  }

  private decodeValue(
    view: DataView,
    raw: Uint8Array,
    off: number,
    dataType: ConfigValueType,
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

  private decodeString(data: Uint8Array, offset: number): string {
    let end = offset;
    while (end < data.length && data[end] !== 0) end++;
    return new TextDecoder("ascii").decode(data.subarray(offset, end));
  }
}
