import { CommonPayloadId } from "../protocol/payloads/CommonPayload";
import { ITransport } from "./ITransport";

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
  sendAndAwaitReply(
    transport: ITransport,
    payloadBytes: Uint8Array,
    filter: ReplyFilter,
    options?: SendOptions,
  ): Promise<Uint8Array>;
}
