import {
  PacketHeader,
  DecodedPayload,
  PayloadType,
} from "../protocol/AmfitrackDecoder";

export interface AmfitrackMessage {
  header: PacketHeader;
  payload: DecodedPayload;
}

export interface DecodedConfigValue {
  uid: number;
  dataType: number;
  value: number | boolean | string;
}

export interface IPayloadDecoder<T> {
  getDecoded(payload: Uint8Array): T;
}

export interface IDecoder {
  /** Decode a full raw packet into header + payload. */
  decode(bytes: Uint8Array): AmfitrackMessage;

  /** Decode a REPLY_CONFIGURATION_VALUE_UID payload. */
  decodeConfigValue(payload: Uint8Array): DecodedConfigValue;

  /** Decode a null-terminated ASCII string from a byte array. */
  decodeString(data: Uint8Array, offset: number): string;

  parseHeader(bytes: Uint8Array): PacketHeader;
  parsePayload(bytes: Uint8Array, payloadType: PayloadType): DecodedPayload;
  sliceBytesToHeaderAndPayload(bytes: Uint8Array): {
    headerBytes: Uint8Array;
    payloadBytes: Uint8Array;
  };
}
