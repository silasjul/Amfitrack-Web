import { IEncoder } from "../interfaces/IEncoder";
import { ISendPipeline, ReplyFilter, SendOptions } from "../interfaces/ISendPipeline";
import { ITransport } from "../interfaces/ITransport";
import { PayloadType } from "../protocol/AmfitrackDecoder";
import { DEFAULT_RETRIES, DEFAULT_TIMEOUT_MS } from "../../config";

/**
 * Raw-byte offsets matching the amfiprot packet layout.
 * Byte 0 is skipped (report-ID / padding); header occupies bytes 1-7.
 */
const OFFSET_PAYLOAD_LENGTH = 1;
const OFFSET_PAYLOAD_TYPE = 4;
const OFFSET_SOURCE_TX_ID = 5;
const OFFSET_PAYLOAD_START = 8;

export class SendPipeline implements ISendPipeline {
  private encoder: IEncoder;

  constructor(encoder: IEncoder) {
    this.encoder = encoder;
  }

  public async sendAndAwaitReply(
    transport: ITransport,
    payloadBytes: Uint8Array,
    filter: ReplyFilter,
    options?: SendOptions,
  ): Promise<Uint8Array> {
    const timeoutMs = options?.timeoutMs ?? DEFAULT_TIMEOUT_MS;
    const retries = options?.retries ?? DEFAULT_RETRIES;

    let lastError: Error | undefined;

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        return await this.sendOnce(transport, payloadBytes, filter, timeoutMs, options?.destinationId);
      } catch (err) {
        lastError = err as Error;
        if (attempt < retries) {
          console.warn(
            `Retry ${attempt + 1}/${retries} for reply 0x${filter.expectedCommonId.toString(16)}`,
          );
        }
      }
    }

    throw lastError;
  }

  private sendOnce(
    transport: ITransport,
    payloadBytes: Uint8Array,
    filter: ReplyFilter,
    timeoutMs: number,
    destinationId?: number,
  ): Promise<Uint8Array> {
    const packet = this.encoder.encode(payloadBytes, destinationId);

    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        transport.removeListener(onData);
        reject(
          new Error(
            `Timeout waiting for reply 0x${filter.expectedCommonId.toString(16)}`,
          ),
        );
      }, timeoutMs);

      const onData = (bytes: Uint8Array) => {
        if (bytes[OFFSET_PAYLOAD_TYPE] !== PayloadType.COMMON) return;

        if (filter.filterSourceTxId !== undefined) {
          const sourceTxId = bytes[OFFSET_SOURCE_TX_ID];
          if (
            sourceTxId !== filter.filterSourceTxId &&
            (filter.alternateSourceTxId === undefined ||
              sourceTxId !== filter.alternateSourceTxId)
          )
            return;
        }

        const replyId = bytes[OFFSET_PAYLOAD_START];
        if (replyId !== filter.expectedCommonId) return;

        const payloadLength = bytes[OFFSET_PAYLOAD_LENGTH];
        const payload = bytes.slice(
          OFFSET_PAYLOAD_START,
          OFFSET_PAYLOAD_START + payloadLength,
        );

        if (filter.validate && !filter.validate(payload)) return;

        clearTimeout(timer);
        transport.removeListener(onData);
        resolve(payload);
      };

      transport.addListener(onData);

      transport.writeToDevice(packet).catch((err: Error) => {
        clearTimeout(timer);
        transport.removeListener(onData);
        reject(new Error(`Failed to send report: ${err.message}`));
      });
    });
  }
}
