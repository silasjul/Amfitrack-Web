import { IEncoder } from "../interfaces/IEncoder";
import { crc8 } from "./crc";
import { LE } from "../../config";

export enum PacketType {
  NO_ACK = 0x00,
  REQUEST_ACK = 0x01,
  ACK = 0x02,
  REPLY = 0x03,
}

export enum AmfiprotPayloadType {
  COMMON = 0x00,
  SUCCESS = 0xf0,
  NOT_IMPLEMENTED = 0xfd,
  FAILURE = 0xfe,
  INVALID_REQUEST = 0xff,
}

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

const DESTINATION_BROADCAST = 0xff;
const SOURCE_PC = 0x00;

/**
 * Amfiprot protocol codec.
 *
 * Handles packet framing, common-payload construction, and
 * config-value encoding/decoding.
 *
 * Packet layout:
 *   [header (6 bytes)] [header CRC (1)] [payload (N bytes)] [payload CRC (1)]
 *
 * Header layout:
 *   [0] payload_length  -- byte count of the payload (excl. CRC)
 *   [1] packet_type     -- NO_ACK / REQUEST_ACK / ACK / REPLY
 *   [2] packet_number   -- sequential counter, wraps at 255
 *   [3] payload_type    -- COMMON for configuration commands
 *   [4] source_tx_id    -- 0x00 for PC
 *   [5] destination_id  -- target device, or 0xFF for broadcast
 */
export class AmfitrackEncoder implements IEncoder {
  private packetNumber = 0;

  public encode(
    payloadBytes: Uint8Array,
    destinationId = DESTINATION_BROADCAST,
  ): Uint8Array {
    const header = new Uint8Array([
      payloadBytes.length,
      PacketType.NO_ACK,
      this.packetNumber,
      AmfiprotPayloadType.COMMON,
      SOURCE_PC,
      destinationId,
    ]);
    this.packetNumber = (this.packetNumber + 1) % 255;

    const packet = new Uint8Array(header.length + 1 + payloadBytes.length + 1);
    packet.set(header);
    packet[header.length] = crc8(header);
    packet.set(payloadBytes, header.length + 1);
    packet[packet.length - 1] = crc8(payloadBytes);
    return packet;
  }

  public buildCommonPayload(
    id: number,
    size: number,
  ): { bytes: Uint8Array; view: DataView } {
    const bytes = new Uint8Array(size);
    bytes[0] = id;
    return { bytes, view: new DataView(bytes.buffer) };
  }

  /**
   * Config value encoding / decoding
   */
  public encodeConfigValue(
    value: number | boolean | string,
    dataType: number,
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
        new DataView(buf.buffer).setBigInt64(
          0,
          BigInt(Math.trunc(Number(value))),
          LE,
        );
        return buf;
      }
      case ConfigValueType.UINT64: {
        const buf = new Uint8Array(8);
        new DataView(buf.buffer).setBigUint64(
          0,
          BigInt(Math.trunc(Number(value))),
          LE,
        );
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
