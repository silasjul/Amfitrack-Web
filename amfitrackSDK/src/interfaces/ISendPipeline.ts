import { CommonPayloadId } from "../protocol/payloads/CommonPayload";
import { DeviceOrTxId } from "./IConfigurator";
import { ITransport } from "./ITransport";

export interface ResolvedTransport {
  transport: ITransport;
  deviceTxId: number;
}

export type TransportResolver = (txId: number) => ResolvedTransport;

export interface ReplyFilter {
  expectedCommonId: CommonPayloadId;
  validate?: (payload: Uint8Array) => boolean;
  filterSourceTxId?: number;
  alternateSourceTxId?: number;
}

export interface SendOptions {
  timeoutMs?: number;
  retries?: number;
  destinationId?: number;
}

export interface ISendPipeline {
  setTransportResolver(resolver: TransportResolver): void;
  sendAndAwaitReply(
    device: DeviceOrTxId,
    payloadBytes: Uint8Array,
    filter: ReplyFilter,
    options?: SendOptions,
  ): Promise<Uint8Array>;
}
