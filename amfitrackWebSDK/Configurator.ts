import HIDManager from "./HIDManager";
import { PacketBuilder, AmfiprotPayloadType } from "./packets/PacketBuilder";
import { CommonPayloadId } from "./packets/decoders/CommonPayload";
import {
  ReplyConfigurationValueUidPayload,
  ConfigValueType,
  ValueEncoder,
} from "./packets/decoders";
import { LE, DEFAULT_TIMEOUT_MS, DEFAULT_RETRIES } from "./config";

export interface Configuration {
  name: string;
  parameters: { name: string; uid: number; value: number | boolean | string }[];
}

const DEVICE_ID_UID = 1574855615;

export function extractDeviceId(config: Configuration[]): number | null {
  for (const category of config) {
    for (const param of category.parameters) {
      if (param.uid === DEVICE_ID_UID && typeof param.value === "number") {
        return param.value;
      }
    }
  }
  console.warn("Device ID not found in configuration");
  return null;
}

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
  private valueEncoder = new ValueEncoder();
  private _hubDevice: HIDDevice | null = null;

  constructor(hidManager: HIDManager) {
    this.hidManager = hidManager;
  }

  set hubDevice(device: HIDDevice | null) {
    this._hubDevice = device;
  }

  /**
   * Sends a Common payload and waits for a specific reply, with retries.
   *
   * This is the core request/reply pattern used by all configurator methods,
   * equivalent to:
   *   self.device.node.send_payload(RequestPayload())
   *   packet = self.device._await_packet(ReplyPayload)
   *
   * @param validate Optional predicate applied to the extracted payload bytes.
   *                 If it returns false the reply is ignored and we keep
   *                 listening.  This prevents stale/duplicate replies from
   *                 being consumed (e.g. after a retry that produced two
   *                 device responses for the same reply-ID).
   */
  private async sendCommonPayload(
    device: HIDDevice,
    payloadBytes: Uint8Array,
    expectedReplyId: CommonPayloadId,
    timeoutMs = DEFAULT_TIMEOUT_MS,
    retries = DEFAULT_RETRIES,
    validate?: (payload: Uint8Array) => boolean,
    sensorID?: number,
  ): Promise<Uint8Array> {
    let lastError: Error | undefined;

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        return await this.sendCommonPayloadOnce(
          device,
          payloadBytes,
          expectedReplyId,
          timeoutMs,
          validate,
          sensorID,
        );
      } catch (err) {
        lastError = err as Error;
        if (attempt < retries) {
          const target =
            sensorID !== undefined
              ? `sensor ${sensorID}`
              : `device "${device.productName ?? "unknown"}"`;
          console.warn(
            `Retry ${attempt + 1}/${retries} for reply 0x${expectedReplyId.toString(16)} on ${target}`,
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
    validate?: (payload: Uint8Array) => boolean,
    sensorID?: number,
  ): Promise<Uint8Array> {
    const packet = this.packetBuilder.build(payloadBytes, sensorID);

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
        const sourceTxId = bytes[5];
        if (sensorID !== undefined && sourceTxId !== sensorID) return;
        const replyId = bytes[8];
        if (replyId !== expectedReplyId) return;

        const payloadLength = bytes[1];
        const payload = bytes.slice(8, 8 + payloadLength);

        if (validate && !validate(payload)) return;

        clearTimeout(timeout);
        device.removeEventListener("inputreport", onInput);
        resolve(payload);
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
  private async getCategoryCount(
    device: HIDDevice,
    sensorID?: number,
  ): Promise<number> {
    const { bytes } = this.buildRequest(
      CommonPayloadId.REQUEST_CATEGORY_COUNT,
      1,
    );
    const reply = await this.sendCommonPayload(
      device,
      bytes,
      CommonPayloadId.REPLY_CATEGORY_COUNT,
      DEFAULT_TIMEOUT_MS,
      DEFAULT_RETRIES,
      undefined,
      sensorID,
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
    sensorID?: number,
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
      DEFAULT_TIMEOUT_MS,
      DEFAULT_RETRIES,
      (payload) => payload[1] === index,
      sensorID,
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
    sensorID?: number,
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
      DEFAULT_TIMEOUT_MS,
      DEFAULT_RETRIES,
      (payload) => payload[1] === categoryIndex,
      sensorID,
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
    sensorID?: number,
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
      DEFAULT_TIMEOUT_MS,
      DEFAULT_RETRIES,
      (payload) => {
        const v = new DataView(
          payload.buffer,
          payload.byteOffset,
          payload.byteLength,
        );
        return (
          v.getUint16(1, LE) === parameterIndex && payload[3] === categoryIndex
        );
      },
      sensorID,
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
    sensorID?: number,
  ): Promise<{ value: number | boolean | string; dataType: ConfigValueType }> {
    const { bytes, view } = this.buildRequest(
      CommonPayloadId.REQUEST_CONFIGURATION_VALUE_UID,
      5,
    );
    view.setUint32(1, uid, LE);
    const reply = await this.sendCommonPayload(
      device,
      bytes,
      CommonPayloadId.REPLY_CONFIGURATION_VALUE_UID,
      DEFAULT_TIMEOUT_MS,
      DEFAULT_RETRIES,
      (payload) => {
        const v = new DataView(
          payload.buffer,
          payload.byteOffset,
          payload.byteLength,
        );
        return v.getUint32(1, LE) === uid;
      },
      sensorID,
    );
    const decoded = this.configValueDecoder.getDecoded(reply);
    return { value: decoded.value, dataType: decoded.dataType };
  }

  public async getConfigurationUSBDevice(
    device: HIDDevice,
  ): Promise<Configuration[]> {
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
        const { value } = await this.getParameterValue(device, uid);
        categoryParameters.push({ name, uid, value });
      }
      config.push({ name: categoryName, parameters: categoryParameters });
    }
    return config;
  }

  public async getConfigurationSensor(
    sensorID: number,
  ): Promise<Configuration[]> {
    if (!this._hubDevice) {
      throw new Error("Hub device is not connected");
    }
    const device = this._hubDevice;
    await this.hidManager.openDevice(device);

    const config: Configuration[] = [];

    const categoryCount = await this.getCategoryCount(device, sensorID);

    for (let catIdx = 0; catIdx < categoryCount; catIdx++) {
      const categoryName = await this.getCategoryName(device, catIdx, sensorID);
      const categoryParameters = [];

      const parameterCount = await this.getParameterCount(
        device,
        catIdx,
        sensorID,
      );
      for (let paramIdx = 0; paramIdx < parameterCount; paramIdx++) {
        const { name, uid } = await this.getParameterNameAndUid(
          device,
          catIdx,
          paramIdx,
          sensorID,
        );
        const { value } = await this.getParameterValue(device, uid, sensorID);
        categoryParameters.push({ name, uid, value });
      }
      config.push({ name: categoryName, parameters: categoryParameters });
    }

    return config;
  }

  /**
   * Mirrors Configurator.write() in configurator.py.
   *
   * Reads the parameter first to discover its data_type, then sends
   * SET_CONFIGURATION_VALUE_UID (0x15) and awaits REPLY_CONFIGURATION_VALUE_UID (0x14).
   *
   * Request payload: [0x15, uid (uint32 LE), data_type, encoded_value...]
   * Reply  payload:  [0x14, uid (uint32 LE), data_type, value...]
   */
  public async setParameterValue(
    device: HIDDevice,
    uid: number,
    value: number | boolean | string,
    sensorID?: number,
  ): Promise<boolean> {
    const { dataType } = await this.getParameterValue(device, uid, sensorID);

    const encodedValue = this.valueEncoder.encode(value, dataType);
    const payloadSize = 1 + 4 + 1 + encodedValue.length; // command byte + parameter uid + data type + encoded value
    const { bytes, view } = this.buildRequest(
      CommonPayloadId.SET_CONFIGURATION_VALUE_UID,
      payloadSize,
    );
    view.setUint32(1, uid, LE);
    view.setUint8(5, dataType);
    bytes.set(encodedValue, 6);

    await this.sendCommonPayload(
      device,
      bytes,
      CommonPayloadId.REPLY_CONFIGURATION_VALUE_UID,
      DEFAULT_TIMEOUT_MS,
      DEFAULT_RETRIES,
      (payload) => {
        const v = new DataView(
          payload.buffer,
          payload.byteOffset,
          payload.byteLength,
        );
        return v.getUint32(1, LE) === uid;
      },
      sensorID,
    );

    return true;
  }
}
