import {
  Configuration,
  DeviceOrTxId,
  IConfigurator,
  Parameter,
} from "../interfaces/IConfigurator";
import { IDecoder } from "../interfaces/IDecoder";
import { IEncoder } from "../interfaces/IEncoder";
import { ISendPipeline } from "../interfaces/ISendPipeline";
import { ITransport } from "../interfaces/ITransport";
import { CommonPayloadId } from "../protocol/payloads/CommonPayload";
import { LE } from "../../config";

export class Configurator implements IConfigurator {
  private sendPipeline: ISendPipeline;
  private encoder: IEncoder;
  private decoder: IDecoder;

  constructor(sendPipeline: ISendPipeline, encoder: IEncoder, decoder: IDecoder) {
    this.sendPipeline = sendPipeline;
    this.encoder = encoder;
    this.decoder = decoder;
  }

  public async getConfiguration(
    device: DeviceOrTxId,
  ): Promise<Configuration[]> {
    const transport = this.resolveTransport(device);
    const config: Configuration[] = [];

    const categoryCount = await this.getCategoryCount(transport);

    for (let catIdx = 0; catIdx < categoryCount; catIdx++) {
      const categoryName = await this.getCategoryName(transport, catIdx);
      const parameters: Parameter[] = [];

      const parameterCount = await this.getParameterCount(transport, catIdx);
      for (let pIdx = 0; pIdx < parameterCount; pIdx++) {
        const { uid } = await this.getParameterNameAndUid(
          transport,
          catIdx,
          pIdx,
        );
        const { value } = await this.getParameterValue(transport, uid);
        parameters.push({ value });
      }
      config.push({ name: categoryName, parameters });
    }

    return config;
  }

  public async getParameter(
    device: DeviceOrTxId,
    parameterUid: number,
  ): Promise<Parameter> {
    const transport = this.resolveTransport(device);
    const { value } = await this.getParameterValue(transport, parameterUid);
    return { value };
  }

  public async setParameter(
    device: DeviceOrTxId,
    parameterUid: number,
    value: Parameter,
  ): Promise<Parameter> {
    const transport = this.resolveTransport(device);
    const { dataType } = await this.getParameterValue(transport, parameterUid);

    const encodedValue = this.encoder.encodeConfigValue(value.value, dataType);
    const payloadSize = 1 + 4 + 1 + encodedValue.length;
    const { bytes, view } = this.encoder.buildCommonPayload(
      CommonPayloadId.SET_CONFIGURATION_VALUE_UID,
      payloadSize,
    );
    view.setUint32(1, parameterUid, LE);
    view.setUint8(5, dataType);
    bytes.set(encodedValue, 6);

    const reply = await this.sendPipeline.sendAndAwaitReply(transport, bytes, {
      expectedCommonId: CommonPayloadId.REPLY_CONFIGURATION_VALUE_UID,
      validate: (p) =>
        new DataView(p.buffer, p.byteOffset, p.byteLength).getUint32(1, LE) ===
        parameterUid,
    });

    return { value: this.decoder.decodeConfigValue(reply).value };
  }

  // ---------------------------------------------------------------------------
  // Private protocol methods
  // ---------------------------------------------------------------------------

  private async getCategoryCount(transport: ITransport): Promise<number> {
    const { bytes } = this.encoder.buildCommonPayload(
      CommonPayloadId.REQUEST_CATEGORY_COUNT,
      1,
    );
    const reply = await this.sendPipeline.sendAndAwaitReply(transport, bytes, {
      expectedCommonId: CommonPayloadId.REPLY_CATEGORY_COUNT,
    });
    return new DataView(reply.buffer, reply.byteOffset, reply.byteLength)
      .getUint8(1);
  }

  private async getCategoryName(
    transport: ITransport,
    index: number,
  ): Promise<string> {
    const { bytes, view } = this.encoder.buildCommonPayload(
      CommonPayloadId.REQUEST_CONFIGURATION_CATEGORY,
      2,
    );
    view.setUint8(1, index);
    const reply = await this.sendPipeline.sendAndAwaitReply(transport, bytes, {
      expectedCommonId: CommonPayloadId.REPLY_CONFIGURATION_CATEGORY,
      validate: (p) => p[1] === index,
    });
    return this.decoder.decodeString(reply, 2);
  }

  private async getParameterCount(
    transport: ITransport,
    categoryIndex: number,
  ): Promise<number> {
    const { bytes, view } = this.encoder.buildCommonPayload(
      CommonPayloadId.REQUEST_CONFIGURATION_VALUE_COUNT,
      2,
    );
    view.setUint8(1, categoryIndex);
    const reply = await this.sendPipeline.sendAndAwaitReply(transport, bytes, {
      expectedCommonId: CommonPayloadId.REPLY_CONFIGURATION_VALUE_COUNT,
      validate: (p) => p[1] === categoryIndex,
    });
    return new DataView(reply.buffer, reply.byteOffset, reply.byteLength)
      .getUint16(2, LE);
  }

  private async getParameterNameAndUid(
    transport: ITransport,
    categoryIndex: number,
    parameterIndex: number,
  ): Promise<{ name: string; uid: number }> {
    const { bytes, view } = this.encoder.buildCommonPayload(
      CommonPayloadId.REQUEST_CONFIGURATION_NAME_AND_UID,
      4,
    );
    view.setUint8(1, categoryIndex);
    view.setUint16(2, parameterIndex, LE);
    const reply = await this.sendPipeline.sendAndAwaitReply(transport, bytes, {
      expectedCommonId: CommonPayloadId.REPLY_CONFIGURATION_NAME_AND_UID,
      validate: (p) => {
        const v = new DataView(p.buffer, p.byteOffset, p.byteLength);
        return (
          v.getUint16(1, LE) === parameterIndex && p[3] === categoryIndex
        );
      },
    });
    const rv = new DataView(reply.buffer, reply.byteOffset, reply.byteLength);
    return {
      uid: rv.getUint32(4, LE),
      name: this.decoder.decodeString(reply, 8),
    };
  }

  private async getParameterValue(
    transport: ITransport,
    uid: number,
  ): Promise<{ value: number | boolean | string; dataType: number }> {
    const { bytes, view } = this.encoder.buildCommonPayload(
      CommonPayloadId.REQUEST_CONFIGURATION_VALUE_UID,
      5,
    );
    view.setUint32(1, uid, LE);
    const reply = await this.sendPipeline.sendAndAwaitReply(transport, bytes, {
      expectedCommonId: CommonPayloadId.REPLY_CONFIGURATION_VALUE_UID,
      validate: (p) =>
        new DataView(p.buffer, p.byteOffset, p.byteLength).getUint32(1, LE) ===
        uid,
    });
    return this.decoder.decodeConfigValue(reply);
  }

  private resolveTransport(device: DeviceOrTxId): ITransport {
    if (typeof device === "string") {
      // TODO: resolve txId string to ITransport via DeviceRegistry
      throw new Error(
        `Transport resolution for txId "${device}" not yet implemented`,
      );
    }
    return device;
  }
}
