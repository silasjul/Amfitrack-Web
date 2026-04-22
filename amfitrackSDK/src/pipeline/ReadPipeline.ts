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
    // Ensure the transport is registered first — even if decoding fails the
    // transport should be visible in the store.
    const readFromTxId = this.deviceManager.registerTransportOrGetTxId(source);

    let decoded;
    try {
      decoded = this.decoder.decode(bytes);
    } catch {
      return;
    }
    const { header, payload } = decoded;

    this.deviceManager.pingOrRegisterDevice(
      header.sourceTxId,
      header.payloadType,
      readFromTxId,
    );

    const isRelayed = header.sourceTxId !== readFromTxId;
    if (
      !isRelayed ||
      !this.deviceManager.isDirectlyConnected(header.sourceTxId)
    ) {
      this.frequencyTracker.trackPacket(header.sourceTxId, header.payloadType);
    }

    this.store
      .getState()
      .updatePayload(header.sourceTxId, header.payloadType, payload);
  }
}
