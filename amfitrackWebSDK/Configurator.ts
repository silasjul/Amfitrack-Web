import HIDManager from "./HIDManager";
import { PacketBuilder, AmfiprotPayloadType } from "./packets/PacketBuilder";
import { CommonPayloadId } from "./packets/decoders/CommonPayload";
import { ReplyConfigurationValueUidPayload } from "./packets/decoders";
import { LE } from "./config";

export interface Configuration {
  name: string;
  parameters: { name: string; uid: number; value: number | boolean | string }[];
}

const DEFAULT_RETRIES = 5;
const DEFAULT_TIMEOUT_MS = 100;

/**
 * High-level configuration interface for amfiprot devices.
 *
 * Mirrors Configurator in configurator.py.
 * Each method sends a command packet and awaits the matching reply.
 */
export class Configurator {
  private hidManager: HIDManager;
  private packetBuilder = new PacketBuilder();
  private configValueDecoder = new ReplyConfigurationValueUidPayload();

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
  private async sendCommonPayload(
    device: HIDDevice,
    payloadBytes: Uint8Array,
    expectedReplyId: CommonPayloadId,
    timeoutMs = DEFAULT_TIMEOUT_MS,
    retries = DEFAULT_RETRIES,
  ): Promise<Uint8Array> {
    let lastError: Error | undefined;

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        return await this.sendCommonPayloadOnce(
          device,
          payloadBytes,
          expectedReplyId,
          timeoutMs,
        );
      } catch (err) {
        lastError = err as Error;
        if (attempt < retries) {
          console.warn(
            `Retry ${attempt + 1}/${retries} for reply 0x${expectedReplyId.toString(16)}`,
          );
        }
      }
    }

    throw lastError;
  }

  private sendCommonPayloadOnce(
    device: HIDDevice,
    payloadBytes: Uint8Array,
    expectedReplyId: CommonPayloadId,
    timeoutMs: number,
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
        const bytes = new Uint8Array(
          event.data.buffer,
          event.data.byteOffset,
          event.data.byteLength,
        );
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
  private buildRequest(
    id: CommonPayloadId,
    size: number,
  ): { bytes: Uint8Array; view: DataView } {
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
    const { bytes } = this.buildRequest(
      CommonPayloadId.REQUEST_CATEGORY_COUNT,
      1,
    );
    const reply = await this.sendCommonPayload(
      device,
      bytes,
      CommonPayloadId.REPLY_CATEGORY_COUNT,
    );
    return this.view(reply).getUint8(1);
  }

  /**
   * Mirrors Configurator._get_category_name() in configurator.py.
   *
   * Request payload: [0x16, index]
   * Reply payload:   [0x17, category_id, ...ascii_name..., 0x00]
   */
  private async getCategoryName(
    device: HIDDevice,
    index: number,
  ): Promise<string> {
    const { bytes, view } = this.buildRequest(
      CommonPayloadId.REQUEST_CONFIGURATION_CATEGORY,
      2,
    );
    view.setUint8(1, index);
    const reply = await this.sendCommonPayload(
      device,
      bytes,
      CommonPayloadId.REPLY_CONFIGURATION_CATEGORY,
    );
    return this.decodeString(reply, 2);
  }

  /**
   * Mirrors Configurator._get_parameter_count() in configurator.py.
   *
   * Request payload: [0x18, category_index]
   * Reply payload:   [0x19, category_index, count (uint16 LE)]
   */
  private async getParameterCount(
    device: HIDDevice,
    categoryIndex: number,
  ): Promise<number> {
    const { bytes, view } = this.buildRequest(
      CommonPayloadId.REQUEST_CONFIGURATION_VALUE_COUNT,
      2,
    );
    view.setUint8(1, categoryIndex);
    const reply = await this.sendCommonPayload(
      device,
      bytes,
      CommonPayloadId.REPLY_CONFIGURATION_VALUE_COUNT,
    );
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
    const { bytes, view } = this.buildRequest(
      CommonPayloadId.REQUEST_CONFIGURATION_NAME_AND_UID,
      4,
    );
    view.setUint8(1, categoryIndex);
    view.setUint16(2, parameterIndex, LE);
    const reply = await this.sendCommonPayload(
      device,
      bytes,
      CommonPayloadId.REPLY_CONFIGURATION_NAME_AND_UID,
    );
    const rv = this.view(reply);
    return {
      uid: rv.getUint32(4, LE),
      name: this.decodeString(reply, 8),
    };
  }

  /**
   * Mirrors Configurator.read() in configurator.py.
   *
   * Request payload: [0x13, uid (uint32 LE)]
   * Reply payload:   [0x14, uid (uint32 LE), data_type, value...]
   */
  private async getParameterValue(
    device: HIDDevice,
    uid: number,
  ): Promise<number | boolean | string> {
    const { bytes, view } = this.buildRequest(
      CommonPayloadId.REQUEST_CONFIGURATION_VALUE_UID,
      5,
    );
    view.setUint32(1, uid, LE);
    const reply = await this.sendCommonPayload(
      device,
      bytes,
      CommonPayloadId.REPLY_CONFIGURATION_VALUE_UID,
    );
    return this.configValueDecoder.getDecoded(reply).value;
  }

  public async getConfiguration(device: HIDDevice): Promise<Configuration[]> {
    await this.hidManager.openDevice(device);

    const config: Configuration[] = [];

    const categoryCount = await this.getCategoryCount(device);

    for (let catIdx = 0; catIdx < categoryCount; catIdx++) {
      const categoryName = await this.getCategoryName(device, catIdx);
      const categoryParameters = [];

      const parameterCount = await this.getParameterCount(device, catIdx);
      for (let paramIdx = 0; paramIdx < parameterCount; paramIdx++) {
        const { name, uid } = await this.getParameterNameAndUid(
          device,
          catIdx,
          paramIdx,
        );
        const value = await this.getParameterValue(device, uid);
        categoryParameters.push({ name, uid, value });
      }
      config.push({ name: categoryName, parameters: categoryParameters });
    }

    return config;
  }
}
