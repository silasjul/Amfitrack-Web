import type { IDecoder } from "../interfaces/IDecoder";
import type { DeviceStoreApi } from "../interfaces/IStore";
import type { IDeviceManager } from "../interfaces/IDeviceManager";
import type { IFrequencyTracker } from "../interfaces/IFrequencyTracker";
import { ITransport } from "../interfaces/ITransport";
import { IReadPipeline } from "../interfaces/IReadPipeline";
import { DecodedPayload, PacketHeader } from "../protocol/AmfitrackDecoder";

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

  processData(bytes: Uint8Array, transport: ITransport): void {
    // Registrer and or get the TX ID for the transport
    const readFromTxId =
      this.deviceManager.registerTransportOrGetTxId(transport);

    const { headerBytes, payloadBytes } =
      this.decoder.sliceBytesToHeaderAndPayload(bytes);

    // Decode the header
    let decodedHeader: PacketHeader;
    try {
      decodedHeader = this.decoder.parseHeader(headerBytes);
    } catch (err) {
      console.error(`Failed to decode header`, err, { bytes });
      return;
    }

    // Ping or register the device
    this.deviceManager.pingOrRegisterDevice(
      decodedHeader.sourceTxId,
      decodedHeader.payloadType,
      readFromTxId,
    );

    // Track the frequency of the packet
    const isRelayed = decodedHeader.sourceTxId !== readFromTxId;
    if (
      !isRelayed ||
      !this.deviceManager.isDirectlyConnected(decodedHeader.sourceTxId)
    ) {
      this.frequencyTracker.trackPacket(
        decodedHeader.sourceTxId,
        decodedHeader.payloadType,
      );
    }

    // Decode payload and store contents in state (payload starts after the header at byte 8)
    let decodedPayload: DecodedPayload;
    try {
      decodedPayload = this.decoder.parsePayload(
        payloadBytes,
        decodedHeader.payloadType,
      );
    } catch (err) {
      console.error(`Failed to decode payload`, err, { bytes });
      return;
    }

    this.store
      .getState()
      .updatePayload(
        decodedHeader.sourceTxId,
        decodedHeader.payloadType,
        decodedPayload,
      );
  }
}
