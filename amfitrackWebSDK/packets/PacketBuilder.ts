import { crc8 } from "./crc";

/**
 * Mirrors PacketType in packet.py.
 * Bits [7:6] of the packet_type header byte.
 */
export enum PacketType {
  NO_ACK = 0x00,
  REQUEST_ACK = 0x01,
  ACK = 0x02,
  REPLY = 0x03,
}

/**
 * Mirrors PayloadType in payload.py.
 * Determines which family of payloads the packet carries.
 */
export enum AmfiprotPayloadType {
  COMMON = 0x00,
  SUCCESS = 0xf0,
  NOT_IMPLEMENTED = 0xfd,
  FAILURE = 0xfe,
  INVALID_REQUEST = 0xff,
}

export const DESTINATION_BROADCAST = 0xff;
export const DESTINATION_USB_DEVICE = 0x00;
const SOURCE_PC = 0x00;

/**
 * Builds outgoing amfiprot packets.
 *
 * Mirrors Packet.from_payload() in packet.py.
 *
 * Packet layout:
 *   [header (6 bytes)] [header CRC (1)] [payload (N bytes)] [payload CRC (1)]
 *
 * Header layout (matches Header.HeaderIndex in packet.py):
 *   [0] payload_length  — byte count of the payload (excl. CRC)
 *   [1] packet_type     — NO_ACK / REQUEST_ACK / ACK / REPLY
 *   [2] packet_number   — sequential counter, wraps at 255
 *   [3] payload_type    — COMMON for configuration commands
 *   [4] source_tx_id    — 0x00 for PC
 *   [5] destination_id  — target device, or 0xFF for broadcast
 */
export class PacketBuilder {
  private packetNumber = 0;

  public build(
    payloadBytes: Uint8Array,
    destinationId = DESTINATION_BROADCAST,
    payloadType = AmfiprotPayloadType.COMMON,
    packetType = PacketType.NO_ACK,
    sourceId = SOURCE_PC,
  ): Uint8Array {
    const header = new Uint8Array([
      payloadBytes.length,
      packetType,
      this.packetNumber,
      payloadType,
      sourceId,
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
}
