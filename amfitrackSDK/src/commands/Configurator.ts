import {
  Configuration,
  DeviceOrTxId,
  IConfigurator,
  ParameterValue,
  Parameter,
  SetParameterOptions,
} from "../interfaces/IConfigurator";
import { IDecoder } from "../interfaces/IDecoder";
import { IEncoder } from "../interfaces/IEncoder";
import { ISendPipeline } from "../interfaces/ISendPipeline";
import { CommonPayloadId } from "../protocol/payloads/CommonPayload";
import { LE } from "../../config";
import { DEVICE_ID_PARAM_NAME, DEVICE_CATEGORY_NAME } from "../../config";

export class Configurator implements IConfigurator {
  private sendPipeline: ISendPipeline;
  private encoder: IEncoder;
  private decoder: IDecoder;

  constructor(
    sendPipeline: ISendPipeline,
    encoder: IEncoder,
    decoder: IDecoder,
  ) {
    this.sendPipeline = sendPipeline;
    this.encoder = encoder;
    this.decoder = decoder;
  }

  public async getConfiguration(
    device: DeviceOrTxId,
  ): Promise<Configuration[]> {
    const config: Configuration[] = [];

    const categoryCount = await this.getCategoryCount(device);

    for (let catIdx = 0; catIdx < categoryCount; catIdx++) {
      const categoryName = await this.getCategoryName(device, catIdx);
      const parameters: Parameter[] = [];

      const parameterCount = await this.getParameterCount(device, catIdx);
      for (let pIdx = 0; pIdx < parameterCount; pIdx++) {
        const { name, uid } = await this.getParameterNameAndUid(
          device,
          catIdx,
          pIdx,
        );
        const { value } = await this.getParameterValueAndDataType(device, uid);
        parameters.push({ name, uid, value });
      }
      config.push({ name: categoryName, parameters });
    }

    return config;
  }

  public async getParameter(
    device: DeviceOrTxId,
    parameterUid: number,
  ): Promise<ParameterValue> {
    const { value } = await this.getParameterValueAndDataType(
      device,
      parameterUid,
    );
    return value;
  }

  public async setParameter(
    device: DeviceOrTxId,
    parameterUid: number,
    value: ParameterValue,
    options?: SetParameterOptions,
  ): Promise<ParameterValue> {
    const { dataType } = await this.getParameterValueAndDataType(
      device,
      parameterUid,
    );

    const encodedValue = this.encoder.encodeConfigValue(value, dataType);
    const payloadSize = 1 + 4 + 1 + encodedValue.length;
    const { bytes, view } = this.encoder.buildCommonPayload(
      CommonPayloadId.SET_CONFIGURATION_VALUE_UID,
      payloadSize,
    );
    view.setUint32(1, parameterUid, LE);
    view.setUint8(5, dataType);
    bytes.set(encodedValue, 6);

    const reply = await this.sendPipeline.sendAndAwaitReply(
      device,
      bytes,
      {
        expectedCommonId: CommonPayloadId.REPLY_CONFIGURATION_VALUE_UID,
        validate: (p) =>
          new DataView(p.buffer, p.byteOffset, p.byteLength).getUint32(
            1,
            LE,
          ) === parameterUid,
        alternateSourceTxId: options?.alternateSourceTxId,
      },
      {
        timeoutMs: options?.timeoutMs,
        retries: options?.retries,
      },
    );

    return this.decoder.decodeConfigValue(reply).value;
  }

  public extractDeviceId(configuration: Configuration[]): number | null {
    const deviceId = configuration
      .find((c) => c.name === DEVICE_CATEGORY_NAME)
      ?.parameters.find((p) => p.name === DEVICE_ID_PARAM_NAME)?.value;
    if (typeof deviceId !== "number") console.warn("Device ID not found");
    return deviceId as number | null;
  }

  private async getCategoryCount(device: DeviceOrTxId): Promise<number> {
    const { bytes } = this.encoder.buildCommonPayload(
      CommonPayloadId.REQUEST_CATEGORY_COUNT,
      1,
    );
    const reply = await this.sendPipeline.sendAndAwaitReply(device, bytes, {
      expectedCommonId: CommonPayloadId.REPLY_CATEGORY_COUNT,
    });
    return new DataView(
      reply.buffer,
      reply.byteOffset,
      reply.byteLength,
    ).getUint8(1);
  }

  private async getCategoryName(
    device: DeviceOrTxId,
    index: number,
  ): Promise<string> {
    const { bytes, view } = this.encoder.buildCommonPayload(
      CommonPayloadId.REQUEST_CONFIGURATION_CATEGORY,
      2,
    );
    view.setUint8(1, index);
    const reply = await this.sendPipeline.sendAndAwaitReply(device, bytes, {
      expectedCommonId: CommonPayloadId.REPLY_CONFIGURATION_CATEGORY,
      validate: (p) => p[1] === index,
    });
    return this.decoder.decodeString(reply, 2);
  }

  private async getParameterCount(
    device: DeviceOrTxId,
    categoryIndex: number,
  ): Promise<number> {
    const { bytes, view } = this.encoder.buildCommonPayload(
      CommonPayloadId.REQUEST_CONFIGURATION_VALUE_COUNT,
      2,
    );
    view.setUint8(1, categoryIndex);
    const reply = await this.sendPipeline.sendAndAwaitReply(device, bytes, {
      expectedCommonId: CommonPayloadId.REPLY_CONFIGURATION_VALUE_COUNT,
      validate: (p) => p[1] === categoryIndex,
    });
    return new DataView(
      reply.buffer,
      reply.byteOffset,
      reply.byteLength,
    ).getUint16(2, LE);
  }

  private async getParameterNameAndUid(
    device: DeviceOrTxId,
    categoryIndex: number,
    parameterIndex: number,
  ): Promise<{ name: string; uid: number }> {
    const { bytes, view } = this.encoder.buildCommonPayload(
      CommonPayloadId.REQUEST_CONFIGURATION_NAME_AND_UID,
      4,
    );
    view.setUint8(1, categoryIndex);
    view.setUint16(2, parameterIndex, LE);
    const reply = await this.sendPipeline.sendAndAwaitReply(device, bytes, {
      expectedCommonId: CommonPayloadId.REPLY_CONFIGURATION_NAME_AND_UID,
      validate: (p) => {
        const v = new DataView(p.buffer, p.byteOffset, p.byteLength);
        return v.getUint16(1, LE) === parameterIndex && p[3] === categoryIndex;
      },
    });
    const rv = new DataView(reply.buffer, reply.byteOffset, reply.byteLength);
    return {
      uid: rv.getUint32(4, LE),
      name: this.decoder.decodeString(reply, 8),
    };
  }

  private async getParameterValueAndDataType(
    device: DeviceOrTxId,
    uid: number,
  ): Promise<{ value: ParameterValue; dataType: number }> {
    const { bytes, view } = this.encoder.buildCommonPayload(
      CommonPayloadId.REQUEST_CONFIGURATION_VALUE_UID,
      5,
    );
    view.setUint32(1, uid, LE);
    const reply = await this.sendPipeline.sendAndAwaitReply(device, bytes, {
      expectedCommonId: CommonPayloadId.REPLY_CONFIGURATION_VALUE_UID,
      validate: (p) =>
        new DataView(p.buffer, p.byteOffset, p.byteLength).getUint32(1, LE) ===
        uid,
    });
    const { value, dataType } = this.decoder.decodeConfigValue(reply);
    return { value, dataType };
  }
}
