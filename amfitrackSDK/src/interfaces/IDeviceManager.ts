import { PayloadType } from "../protocol/AmfitrackDecoder";
import { ResolvedTransport } from "./ISendPipeline";
import { DeviceKind } from "./IStore";
import { ITransport } from "./ITransport";

export interface IDeviceManager {
  registerTransportOrGetTxId(source: ITransport): number;
  /** Remove a transport and all devices that were reachable through it. */
  unregisterTransport(source: ITransport): void;
  pingOrRegisterDevice(
    deviceTxId: number,
    payloadType: PayloadType,
    uplink: number | null,
  ): void;
  resolveTransport(txId: number): ResolvedTransport;
  isDirectlyConnected(txId: number): boolean;
  updateDeviceConfig(deviceTxId: number): Promise<void>;
  refreshDeviceInfo(deviceTxId: number): Promise<void>;
  remapTxId(oldTxId: number, newTxId: number): void;
  retireTxId(kind: DeviceKind, txId: number, durationMs: number): void;
  clearRetiredTxId(kind: DeviceKind, txId: number): void;
  destroy(): void;
}
