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

    // source is the physical transport the packet arrived on (e.g. the hub's
    // HID connection). readFromTxId is its resolved TX ID, used to link sensors
    // to the hub they're relayed through.
    const readFromTxId = this.deviceManager.registerSourceOrGetTxId(source);

    // header.sourceTxId is the TX ID of the device that generated the packet --
    // may be the hub itself or a sensor the hub is relaying for.
    this.deviceManager.pingOrRegisterDevice(
      header.sourceTxId,
      header.payloadType,
      readFromTxId,
    );

    // Only count this packet for frequency if it arrived directly from its
    // source. When a device (e.g. a source) is connected via USB AND a hub
    // relays the same packets, we'd otherwise double-count.
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
