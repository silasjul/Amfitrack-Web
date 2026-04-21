import { PacketHeader, DecodedPayload } from "../protocol/AmfitrackDecoder";

export interface AmfitrackMessage {
  header: PacketHeader;
  payload: DecodedPayload;
}

export interface IPayloadDecoder<T> {
  getDecoded(payload: Uint8Array): T;
}

export interface IDecoder {
  /**
   * Ingests a raw byte array.
   * @param bytes The raw Uint8Array received from the hardware.
   * @returns The decoded header and payload data.
   */
  decode(bytes: Uint8Array): AmfitrackMessage;
}
