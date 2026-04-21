import { PayloadType } from "../protocol/AmfitrackDecoder";
import { ResolvedTransport } from "./ISendPipeline";
import { ITransport } from "./ITransport";

export interface IDeviceRegistry {
  registerSourceOrGetTxId(source: ITransport): number;
  pingOrRegisterDevice(
    deviceTxId: number,
    payloadType: PayloadType,
    readFromTxId: number | null,
  ): void;
  resolveTransport(txId: number): ResolvedTransport;
  destroy(): void;
}
