import { PayloadType } from "../protocol/AmfitrackDecoder";

export interface IFrequencyTracker {
  trackPacket(txId: number, payloadType: PayloadType): void;
  start(): void;
  stop(): void;
}
