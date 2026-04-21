import { PayloadType } from "../protocol/AmfitrackDecoder";
import { ResolvedTransport } from "./ISendPipeline";
import { DeviceKind } from "./IStore";
import { ITransport } from "./ITransport";

export interface IDeviceRegistry {
  classifyUsbDevice(transport: ITransport): Promise<DeviceKind>;
  registerSourceOrGetTxId(source: ITransport): number;
  pingOrRegisterDevice(
    deviceTxId: number,
    payloadType: PayloadType,
    readFromTxId: number | null,
  ): void;
  resolveTransport(txId: number): ResolvedTransport;
  updateDeviceConfig(deviceTxId: number): Promise<void>;
  remapTxId(oldTxId: number, newTxId: number): void;
  retireTxId(kind: DeviceKind, txId: number, durationMs: number): void;
  clearRetiredTxId(kind: DeviceKind, txId: number): void;
  destroy(): void;
}
