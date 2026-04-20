import type { IDecoder } from "../interfaces/IProtocol";
import { DeviceRegistry } from "../topology/DeviceRegistry";
import { useDeviceStore } from "../store/useDeviceStore";
import type { HIDConnection } from "../transport/HIDConnection";

export class ReadPipeline {
  private decoder: IDecoder;
  private deviceRegistry: DeviceRegistry;

  constructor(decoder: IDecoder, deviceRegistry: DeviceRegistry) {
    this.decoder = decoder;
    this.deviceRegistry = deviceRegistry;
  }

  processData(bytes: Uint8Array, source: HIDConnection): void {
    const { header, payload } = this.decoder.decode(bytes);

    const readFromTxId = this.deviceRegistry.registerSourceOrGetTxId(source);

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
