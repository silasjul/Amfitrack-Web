import HIDManager from "./HIDManager";
import { PacketBuilder, AmfiprotPayloadType } from "./packets/PacketBuilder";
import { CommonPayloadId } from "./packets/decoders/CommonPayload";
import { LE } from "./config";

/**
 * High-level configuration interface for amfiprot devices.
 *
 * Mirrors Configurator in configurator.py.
 * Each method sends a command packet and awaits the matching reply.
 */
export class Configurator {
  private hidManager: HIDManager;
  private packetBuilder = new PacketBuilder();

  constructor(hidManager: HIDManager) {
    this.hidManager = hidManager;
  }

  /**
   * Sends a Common payload and waits for a specific reply.
   *
   * This is the core request/reply pattern used by all configurator methods,
   * equivalent to:
   *   self.device.node.send_payload(RequestPayload())
   *   packet = self.device._await_packet(ReplyPayload)
   */
  private sendCommonPayload(
    device: HIDDevice,
    payloadBytes: Uint8Array,
    expectedReplyId: CommonPayloadId,
    timeoutMs = 2000,
  ): Promise<Uint8Array> {
    const packet = this.packetBuilder.build(payloadBytes);

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        device.removeEventListener("inputreport", onInput);
        reject(
          new Error(
            `Timeout waiting for reply 0x${expectedReplyId.toString(16)}`,
          ),
        );
      }, timeoutMs);

      const onInput = (event: HIDInputReportEvent) => {
        const bytes = new Uint8Array(event.data.buffer);
        // Incoming layout: [length_prefix, header(6), hdr_crc, payload..., payload_crc, padding]
        const payloadType = bytes[4];
        if (payloadType !== AmfiprotPayloadType.COMMON) return;
        const replyId = bytes[8];
        if (replyId !== expectedReplyId) return;

        clearTimeout(timeout);
        device.removeEventListener("inputreport", onInput);

        const payloadLength = bytes[1];
        resolve(bytes.subarray(8, 8 + payloadLength));
      };

      device.addEventListener("inputreport", onInput);

      this.hidManager.sendReport(device, packet).catch((err: Error) => {
        clearTimeout(timeout);
        device.removeEventListener("inputreport", onInput);
        reject(new Error(`Failed to send report: ${err.message}`));
      });
    });
  }

  /** Wrap a reply Uint8Array in a DataView for convenient typed reads. */
  private view(reply: Uint8Array): DataView {
    return new DataView(reply.buffer, reply.byteOffset, reply.byteLength);
  }

  /** Decode a null-terminated ASCII string starting at the given byte offset. */
  private decodeString(data: Uint8Array, offset: number): string {
    let end = offset;
    while (end < data.length && data[end] !== 0) end++;
    return new TextDecoder("ascii").decode(data.subarray(offset, end));
  }

  /** Build a request payload, using a DataView to write multi-byte values. */
  private buildRequest(id: CommonPayloadId, size: number): { bytes: Uint8Array; view: DataView } {
    const bytes = new Uint8Array(size);
    bytes[0] = id;
    return { bytes, view: new DataView(bytes.buffer) };
  }

  /**
   * Mirrors Configurator._get_category_count() in configurator.py.
   *
   * Reply payload: [0x1B, category_count]
   */
  private async getCategoryCount(device: HIDDevice): Promise<number> {
    const { bytes } = this.buildRequest(CommonPayloadId.REQUEST_CATEGORY_COUNT, 1);
    const reply = await this.sendCommonPayload(device, bytes, CommonPayloadId.REPLY_CATEGORY_COUNT);
    return this.view(reply).getUint8(1);
  }

  /**
   * Mirrors Configurator._get_category_name() in configurator.py.
   *
   * Request payload: [0x16, index]
   * Reply payload:   [0x17, category_id, ...ascii_name..., 0x00]
   */
  private async getCategoryName(device: HIDDevice, index: number): Promise<string> {
    const { bytes, view } = this.buildRequest(CommonPayloadId.REQUEST_CONFIGURATION_CATEGORY, 2);
    view.setUint8(1, index);
    const reply = await this.sendCommonPayload(device, bytes, CommonPayloadId.REPLY_CONFIGURATION_CATEGORY);
    return this.decodeString(reply, 2);
  }

  /**
   * Mirrors Configurator._get_parameter_count() in configurator.py.
   *
   * Request payload: [0x18, category_index]
   * Reply payload:   [0x19, category_index, count (uint16 LE)]
   */
  private async getParameterCount(device: HIDDevice, categoryIndex: number): Promise<number> {
    const { bytes, view } = this.buildRequest(CommonPayloadId.REQUEST_CONFIGURATION_VALUE_COUNT, 2);
    view.setUint8(1, categoryIndex);
    const reply = await this.sendCommonPayload(device, bytes, CommonPayloadId.REPLY_CONFIGURATION_VALUE_COUNT);
    return this.view(reply).getUint16(2, LE);
  }

  /**
   * Mirrors Configurator._get_parameter_name_uid() in configurator.py.
   *
   * Request payload: [0x11, category_index, param_index (uint16 LE)]
   * Reply payload:   [0x12, config_index (uint16 LE), cat_index, uid (uint32 LE), ...ascii_name..., 0x00]
   */
  private async getParameterNameAndUid(
    device: HIDDevice,
    categoryIndex: number,
    parameterIndex: number,
  ): Promise<{ name: string; uid: number }> {
    const { bytes, view } = this.buildRequest(CommonPayloadId.REQUEST_CONFIGURATION_NAME_AND_UID, 4);
    view.setUint8(1, categoryIndex);
    view.setUint16(2, parameterIndex, LE);
    const reply = await this.sendCommonPayload(device, bytes, CommonPayloadId.REPLY_CONFIGURATION_NAME_AND_UID);
    const rv = this.view(reply);
    return {
      uid: rv.getUint32(4, LE),
      name: this.decodeString(reply, 8),
    };
  }

  public async getConfiguration(device: HIDDevice): Promise<{ name: string; uid: number; value: number }[]> {
    await this.hidManager.openDevice(device);

    // test

    const categoryCount = await this.getCategoryCount(device);
    console.log("Category count:", categoryCount);

    const categoryName = await this.getCategoryName(device, 0);
    console.log("Category name:", categoryName);

    const parameterCount = await this.getParameterCount(device, 0);
    console.log("Parameter count:", parameterCount);

    const parameterNameAndUid = await this.getParameterNameAndUid(device, 0, 0);
    console.log("Parameter name and uid:", parameterNameAndUid);
    
    return [];
  }
}
