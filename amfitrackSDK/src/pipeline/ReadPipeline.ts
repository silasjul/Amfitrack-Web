import type { IDecoder } from "../interfaces/IProtocol";
import { DeviceRegistry } from "../topology/DeviceRegistry";
import { useDeviceStore } from "../store/useDeviceStore";

export class ReadPipeline {
  private decoder: IDecoder;
  private deviceRegistry: DeviceRegistry;

  constructor(decoder: IDecoder, deviceRegistry: DeviceRegistry) {
    this.decoder = decoder;
    this.deviceRegistry = deviceRegistry;
  }

  processData(bytes: Uint8Array, readFromTxId: number | null): void {
    const { header, payload } = this.decoder.decode(bytes);

    this.deviceRegistry.pingOrRegisterDevice(
      header.sourceTxId,
      header.payloadType,
      readFromTxId,
    );

    useDeviceStore
      .getState()
      .updatePayload(header.sourceTxId, header.payloadType, payload);
  }
}
