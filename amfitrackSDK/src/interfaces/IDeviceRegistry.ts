import { PayloadType } from "../protocol/AmfitrackDecoder";
import { ITransport } from "./ITransport";

export interface IDeviceRegistry {
  registerSourceOrGetTxId(source: ITransport): number;
  pingOrRegisterDevice(
    deviceTxId: number,
    payloadType: PayloadType,
    readFromTxId: number | null,
  ): void;
  destroy(): void;
}
