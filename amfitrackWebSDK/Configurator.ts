import HIDManager from "./HIDManager";
import {
  PacketBuilder,
  AmfiprotPayloadType,
  DESTINATION_USB_DEVICE,
} from "./packets/PacketBuilder";
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
      if (param.uid === DEVICE_ID_UID || param.name === "Device ID") {
        if (typeof param.value === "number") return param.value;
        if (typeof param.value === "string") {
          const n = Number(param.value);
          if (!isNaN(n)) return n;
        }
      }
    }
  }
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
   * Send a Common payload to a USB-connected device (hub or source) and await
   * a reply, with retries.  Does NOT filter replies by sourceTxId.
   *
   * @param destinationId  Packet destination. Omit for broadcast reads,
   *                       pass DESTINATION_USB_DEVICE for targeted writes.
   */
  private async sendCommonPayloadDevice(
    device: HIDDevice,
    payloadBytes: Uint8Array,
    expectedReplyId: CommonPayloadId,
    timeoutMs = DEFAULT_TIMEOUT_MS,
    retries = DEFAULT_RETRIES,
    validate?: (payload: Uint8Array) => boolean,
    destinationId?: number,
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
          destinationId,
        );
      } catch (err) {
        lastError = err as Error;
        if (attempt < retries) {
          console.warn(
            `Retry ${attempt + 1}/${retries} for reply 0x${expectedReplyId.toString(16)} on device "${device.productName ?? "unknown"}"`,
          );
        }
      }
    }

    throw lastError;
  }

  /**
   * Send a Common payload to a wireless sensor (routed through the hub) and
   * await a reply, with retries.  Filters replies by sourceTxId so only
   * packets from the addressed sensor are accepted.
   */
  private async sendCommonPayloadSensor(
    device: HIDDevice,
    payloadBytes: Uint8Array,
    expectedReplyId: CommonPayloadId,
    sensorID: number,
    timeoutMs = DEFAULT_TIMEOUT_MS,
    retries = DEFAULT_RETRIES,
    validate?: (payload: Uint8Array) => boolean,
    alternateSensorID?: number,
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
          sensorID,
          alternateSensorID,
        );
      } catch (err) {
        lastError = err as Error;
        if (attempt < retries) {
          console.warn(
            `Retry ${attempt + 1}/${retries} for reply 0x${expectedReplyId.toString(16)} on sensor ${sensorID}`,
          );
        }
      }
    }

    throw lastError;
  }

  /**
   * Single-attempt send + await used by both Device and Sensor wrappers.
   *
   * @param destinationId    Packet destination (broadcast when undefined).
   * @param filterSensorID   If set, only accept replies whose sourceTxId matches.
   * @param alternateFilterID Secondary sourceTxId to accept (for ID-change writes).
   */
  private sendCommonPayloadOnce(
    device: HIDDevice,
    payloadBytes: Uint8Array,
    expectedReplyId: CommonPayloadId,
    timeoutMs: number,
    validate?: (payload: Uint8Array) => boolean,
    destinationId?: number,
    filterSensorID?: number,
    alternateFilterID?: number,
  ): Promise<Uint8Array> {
    const packet = this.packetBuilder.build(payloadBytes, destinationId);

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
        const payloadType = bytes[4];
        if (payloadType !== AmfiprotPayloadType.COMMON) return;
        if (filterSensorID !== undefined) {
          const sourceTxId = bytes[5];
          if (
            sourceTxId !== filterSensorID &&
            (alternateFilterID === undefined ||
              sourceTxId !== alternateFilterID)
          )
            return;
        }
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
    const reply =
      sensorID !== undefined
        ? await this.sendCommonPayloadSensor(
            device,
            bytes,
            CommonPayloadId.REPLY_CATEGORY_COUNT,
            sensorID,
          )
        : await this.sendCommonPayloadDevice(
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
    sensorID?: number,
  ): Promise<string> {
    const { bytes, view } = this.buildRequest(
      CommonPayloadId.REQUEST_CONFIGURATION_CATEGORY,
      2,
    );
    view.setUint8(1, index);
    const validateIndex = (payload: Uint8Array) => payload[1] === index;
    const reply =
      sensorID !== undefined
        ? await this.sendCommonPayloadSensor(
            device,
            bytes,
            CommonPayloadId.REPLY_CONFIGURATION_CATEGORY,
            sensorID,
            DEFAULT_TIMEOUT_MS,
            DEFAULT_RETRIES,
            validateIndex,
          )
        : await this.sendCommonPayloadDevice(
            device,
            bytes,
            CommonPayloadId.REPLY_CONFIGURATION_CATEGORY,
            DEFAULT_TIMEOUT_MS,
            DEFAULT_RETRIES,
            validateIndex,
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
    const validateCat = (payload: Uint8Array) => payload[1] === categoryIndex;
    const reply =
      sensorID !== undefined
        ? await this.sendCommonPayloadSensor(
            device,
            bytes,
            CommonPayloadId.REPLY_CONFIGURATION_VALUE_COUNT,
            sensorID,
            DEFAULT_TIMEOUT_MS,
            DEFAULT_RETRIES,
            validateCat,
          )
        : await this.sendCommonPayloadDevice(
            device,
            bytes,
            CommonPayloadId.REPLY_CONFIGURATION_VALUE_COUNT,
            DEFAULT_TIMEOUT_MS,
            DEFAULT_RETRIES,
            validateCat,
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
    const validateParam = (payload: Uint8Array) => {
      const v = new DataView(
        payload.buffer,
        payload.byteOffset,
        payload.byteLength,
      );
      return (
        v.getUint16(1, LE) === parameterIndex && payload[3] === categoryIndex
      );
    };
    const reply =
      sensorID !== undefined
        ? await this.sendCommonPayloadSensor(
            device,
            bytes,
            CommonPayloadId.REPLY_CONFIGURATION_NAME_AND_UID,
            sensorID,
            DEFAULT_TIMEOUT_MS,
            DEFAULT_RETRIES,
            validateParam,
          )
        : await this.sendCommonPayloadDevice(
            device,
            bytes,
            CommonPayloadId.REPLY_CONFIGURATION_NAME_AND_UID,
            DEFAULT_TIMEOUT_MS,
            DEFAULT_RETRIES,
            validateParam,
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
    const validateUid = (payload: Uint8Array) => {
      const v = new DataView(
        payload.buffer,
        payload.byteOffset,
        payload.byteLength,
      );
      return v.getUint32(1, LE) === uid;
    };
    const reply =
      sensorID !== undefined
        ? await this.sendCommonPayloadSensor(
            device,
            bytes,
            CommonPayloadId.REPLY_CONFIGURATION_VALUE_UID,
            sensorID,
            DEFAULT_TIMEOUT_MS,
            DEFAULT_RETRIES,
            validateUid,
          )
        : await this.sendCommonPayloadDevice(
            device,
            bytes,
            CommonPayloadId.REPLY_CONFIGURATION_VALUE_UID,
            DEFAULT_TIMEOUT_MS,
            DEFAULT_RETRIES,
            validateUid,
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
   * Write a parameter on a USB-connected device (hub or source).
   *
   * Uses the device's own TX ID as the packet destination (matching the Python
   * library's `node.send_payload` which sends to `self.tx_id`).  This ensures
   * the target device processes the command without forwarding it to wireless
   * sensors.  Falls back to broadcast when `deviceTxId` is not provided.
   */
  public async setDeviceParameterValue(
    device: HIDDevice,
    uid: number,
    value: number | boolean | string,
    deviceTxId?: number,
  ): Promise<number | boolean | string> {
    const { dataType } = await this.getParameterValue(device, uid);

    const encodedValue = this.valueEncoder.encode(value, dataType);
    const payloadSize = 1 + 4 + 1 + encodedValue.length;
    const { bytes, view } = this.buildRequest(
      CommonPayloadId.SET_CONFIGURATION_VALUE_UID,
      payloadSize,
    );
    view.setUint32(1, uid, LE);
    view.setUint8(5, dataType);
    bytes.set(encodedValue, 6);

    const validateUid = (payload: Uint8Array) => {
      const v = new DataView(
        payload.buffer,
        payload.byteOffset,
        payload.byteLength,
      );
      return v.getUint32(1, LE) === uid;
    };

    const reply = await this.sendCommonPayloadDevice(
      device,
      bytes,
      CommonPayloadId.REPLY_CONFIGURATION_VALUE_UID,
      DEFAULT_TIMEOUT_MS,
      DEFAULT_RETRIES,
      validateUid,
      deviceTxId,
    );

    return this.configValueDecoder.getDecoded(reply).value;
  }

  /**
   * Write a parameter on a wireless sensor, routed through the hub.
   * Uses the sensorID as the packet destination so only that sensor is affected.
   */
  public async setSensorParameterValue(
    device: HIDDevice,
    sensorID: number,
    uid: number,
    value: number | boolean | string,
    expectSourceIdChange?: boolean,
  ): Promise<number | boolean | string> {
    const { dataType } = await this.getParameterValue(device, uid, sensorID);

    const encodedValue = this.valueEncoder.encode(value, dataType);
    const payloadSize = 1 + 4 + 1 + encodedValue.length;
    const { bytes, view } = this.buildRequest(
      CommonPayloadId.SET_CONFIGURATION_VALUE_UID,
      payloadSize,
    );
    view.setUint32(1, uid, LE);
    view.setUint8(5, dataType);
    bytes.set(encodedValue, 6);

    const validateUid = (payload: Uint8Array) => {
      const v = new DataView(
        payload.buffer,
        payload.byteOffset,
        payload.byteLength,
      );
      return v.getUint32(1, LE) === uid;
    };

    const alternateSensorID =
      expectSourceIdChange && typeof value === "number" ? value : undefined;

    const reply = await this.sendCommonPayloadSensor(
      device,
      bytes,
      CommonPayloadId.REPLY_CONFIGURATION_VALUE_UID,
      sensorID,
      DEFAULT_TIMEOUT_MS,
      DEFAULT_RETRIES,
      validateUid,
      alternateSensorID,
    );

    return this.configValueDecoder.getDecoded(reply).value;
  }
}
