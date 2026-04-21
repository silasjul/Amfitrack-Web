import type { IDecoder } from "../interfaces/IDecoder";
import type { DeviceStoreApi } from "../interfaces/IStore";
import type { IDeviceManager } from "../interfaces/IDeviceManager";
import type { IFrequencyTracker } from "../interfaces/IFrequencyTracker";
import { ITransport } from "../interfaces/ITransport";
import { IReadPipeline } from "../interfaces/IReadPipeline";

export class ReadPipeline implements IReadPipeline {
  private decoder: IDecoder;
  private store: DeviceStoreApi;
  private deviceManager: IDeviceManager;
  private frequencyTracker: IFrequencyTracker;

  constructor(
    decoder: IDecoder,
    store: DeviceStoreApi,
    deviceManager: IDeviceManager,
    frequencyTracker: IFrequencyTracker,
  ) {
    this.decoder = decoder;
    this.store = store;
    this.deviceManager = deviceManager;
    this.frequencyTracker = frequencyTracker;
  }

  processData(bytes: Uint8Array, source: ITransport): void {
    const { header, payload } = this.decoder.decode(bytes);

    const readFromTxId = this.deviceManager.registerSourceOrGetTxId(source);

    this.deviceManager.pingOrRegisterDevice(
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
