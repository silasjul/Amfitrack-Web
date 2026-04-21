import type { IDecoder } from "../interfaces/IDecoder";
import type { DeviceStoreApi } from "../interfaces/IStore";
import { DeviceRegistry } from "../topology/DeviceRegistry";
import { ITransport } from "../interfaces/ITransport";
import { IReadPipeline } from "../interfaces/IReadPipeline";
import { FrequencyTracker } from "../tracking/FrequencyTracker";

export class ReadPipeline implements IReadPipeline {
  private decoder: IDecoder;
  private store: DeviceStoreApi;
  private deviceRegistry: DeviceRegistry;
  private frequencyTracker: FrequencyTracker;

  constructor(
    decoder: IDecoder,
    store: DeviceStoreApi,
    deviceRegistry: DeviceRegistry,
    frequencyTracker: FrequencyTracker,
  ) {
    this.decoder = decoder;
    this.store = store;
    this.deviceRegistry = deviceRegistry;
    this.frequencyTracker = frequencyTracker;
  }

  processData(bytes: Uint8Array, source: ITransport): void {
    const { header, payload } = this.decoder.decode(bytes);

    const readFromTxId = this.deviceRegistry.registerSourceOrGetTxId(source);

    this.deviceRegistry.pingOrRegisterDevice(
      header.sourceTxId,
      header.payloadType,
      readFromTxId,
    );

    this.frequencyTracker.trackPacket(header.sourceTxId, header.payloadType);

    this.store
      .getState()
      .updatePayload(header.sourceTxId, header.payloadType, payload);
  }
}
