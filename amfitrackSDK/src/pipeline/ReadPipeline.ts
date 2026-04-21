import type { IDecoder } from "../interfaces/IDecoder";
import { DeviceRegistry } from "../topology/DeviceRegistry";
import { useDeviceStore } from "../store/useDeviceStore";
import { ITransport } from "../interfaces/ITransport";
import { IReadPipeline } from "../interfaces/IReadPipeline";
import { FrequencyTracker } from "../tracking/FrequencyTracker";

export class ReadPipeline implements IReadPipeline {
  private decoder: IDecoder;
  private deviceRegistry: DeviceRegistry;
  private frequencyTracker: FrequencyTracker;

  constructor(
    decoder: IDecoder,
    deviceRegistry: DeviceRegistry,
    frequencyTracker: FrequencyTracker,
  ) {
    this.decoder = decoder;
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

    useDeviceStore
      .getState()
      .updatePayload(header.sourceTxId, header.payloadType, payload);
  }
}
