import { LE } from "../../config";
import { ConfigValueType } from "./ReplyConfigurationValueUidPayload";

/**
 * Encodes a config value into bytes for SET_CONFIGURATION_VALUE_UID payloads.
 *
 * Inverse of ReplyConfigurationValueUidPayload.decodeValue().
 * Mirrors encode_config_value() in common_payload.py.
 */
export class ValueEncoder {
  public encode(
    value: number | boolean | string,
    dataType: ConfigValueType,
  ): Uint8Array {
    switch (dataType) {
      case ConfigValueType.BOOL:
      case ConfigValueType.PROCEDURE_CALL: {
        const buf = new Uint8Array(1);
        buf[0] = value ? 1 : 0;
        return buf;
      }
      case ConfigValueType.CHAR: {
        const encoded = new TextEncoder().encode(String(value));
        const buf = new Uint8Array(encoded.length + 1);
        buf.set(encoded);
        buf[encoded.length] = 0;
        return buf;
      }
      case ConfigValueType.INT8: {
        const buf = new Uint8Array(1);
        new DataView(buf.buffer).setInt8(0, Number(value));
        return buf;
      }
      case ConfigValueType.UINT8: {
        const buf = new Uint8Array(1);
        new DataView(buf.buffer).setUint8(0, Number(value));
        return buf;
      }
      case ConfigValueType.INT16: {
        const buf = new Uint8Array(2);
        new DataView(buf.buffer).setInt16(0, Number(value), LE);
        return buf;
      }
      case ConfigValueType.UINT16: {
        const buf = new Uint8Array(2);
        new DataView(buf.buffer).setUint16(0, Number(value), LE);
        return buf;
      }
      case ConfigValueType.INT32: {
        const buf = new Uint8Array(4);
        new DataView(buf.buffer).setInt32(0, Number(value), LE);
        return buf;
      }
      case ConfigValueType.UINT32: {
        const buf = new Uint8Array(4);
        new DataView(buf.buffer).setUint32(0, Number(value), LE);
        return buf;
      }
      case ConfigValueType.INT64: {
        const buf = new Uint8Array(8);
        new DataView(buf.buffer).setBigInt64(0, BigInt(Math.trunc(Number(value))), LE);
        return buf;
      }
      case ConfigValueType.UINT64: {
        const buf = new Uint8Array(8);
        new DataView(buf.buffer).setBigUint64(0, BigInt(Math.trunc(Number(value))), LE);
        return buf;
      }
      case ConfigValueType.FLOAT: {
        const buf = new Uint8Array(4);
        new DataView(buf.buffer).setFloat32(0, Number(value), LE);
        return buf;
      }
      case ConfigValueType.DOUBLE: {
        const buf = new Uint8Array(8);
        new DataView(buf.buffer).setFloat64(0, Number(value), LE);
        return buf;
      }
      default: {
        const buf = new Uint8Array(1);
        new DataView(buf.buffer).setUint8(0, Number(value));
        return buf;
      }
    }
  }
}
